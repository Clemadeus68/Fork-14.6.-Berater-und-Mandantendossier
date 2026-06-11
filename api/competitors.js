export const config = { runtime: 'edge' };

const PARKING_DOMAINS = ['sedo.com', 'afternic.com', 'dan.com', 'hugedomains.com', 'godaddy.com/domain', 'namecheap.com/domains'];

async function crawlMinimal(url, apiKey) {
  const res = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({ url, formats: ['markdown'], onlyMainContent: true }),
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Firecrawl ${res.status}`);
  const d = await res.json();
  return d.data?.markdown?.slice(0, 6000) || '';
}

function buildPrompt({ url, content, userCompetitors }) {
  const mustInclude = userCompetitors.length > 0
    ? `\nFolgende Wettbewerber müssen ZWINGEND enthalten sein: ${userCompetitors.join(', ')}`
    : '';

  const contentBlock = content
    ? `WEBSITE-INHALT (Auszug):\n${content}`
    : `WEBSITE-INHALT: Nicht verfügbar. Leite Branche und Geschäftsmodell ausschließlich aus der URL und Domain ab.`;

  return `Du bist ein Marktanalyse-Experte. Identifiziere die 8–12 relevantesten direkten Wettbewerber des folgenden Unternehmens in Deutschland.

WEBSITE: ${url}

${contentBlock}
${mustInclude}

AUFGABE:
1. Erkenne Branche, Nische, Zielgruppe und GESCHÄFTSMODELL des Unternehmens.
2. Identifiziere 8–12 direkte Wettbewerber, die DASSELBE Geschäftsmodell verfolgen — nicht nur dieselbe Branche.
   Beispiel: Ein Honorarberater (provisionsfreie Beratung) hat NUR andere Honorarberater als direkte Wettbewerber, keine Banken oder Versicherungsvertreter.
3. Bevorzuge Unternehmen mit eigener Domain und messbarer Online-Präsenz.
4. Nur deutschsprachige Wettbewerber (.de, .at, .ch).
5. Wenn du keine sicheren direkten Wettbewerber identifizieren kannst, gib ein leeres Array zurück.

Antworte AUSSCHLIESSLICH mit einem JSON-Array von Domains. Kein Text, keine Erklärung, kein Markdown.
Beispiel: ["wettbewerber1.de","wettbewerber2.de","wettbewerber3.de"]`;
}

export default async function handler(req) {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: cors });
  if (req.method !== 'POST') return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { ...cors, 'Content-Type': 'application/json' } });

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const firecrawlKey = process.env.FIRECRAWL_API_KEY;
  if (!anthropicKey || !firecrawlKey) return new Response(JSON.stringify({ error: 'API keys fehlen' }), { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } });

  const { url, userCompetitors = [] } = await req.json();
  if (!url) return new Response(JSON.stringify({ error: 'URL fehlt' }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } });

  const targetUrl = url.startsWith('http') ? url : 'https://' + url;

  let content = '';
  try { content = await crawlMinimal(targetUrl, firecrawlKey); } catch (_) {}

  const prompt = buildPrompt({ url: targetUrl, content, userCompetitors });

  const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': anthropicKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5',
      max_tokens: 512,
      messages: [
        { role: 'user', content: prompt },
        { role: 'assistant', content: '[' },
      ],
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!claudeRes.ok) return new Response(JSON.stringify({ error: 'Claude-Fehler' }), { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } });

  const claudeData = await claudeRes.json();
  const rawText = claudeData.content?.[0]?.text?.trim() || ']';
  const text = '[' + rawText;

  const clean = (d) => d.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '').toLowerCase();
  const cleanedUser = userCompetitors.map(clean).filter(Boolean);
  const userSet = new Set(cleanedUser);

  let candidates = [];
  try {
    const raw = JSON.parse(text);
    if (Array.isArray(raw)) {
      // User-entered first, then Claude's suggestions fill the rest
      const all = [...cleanedUser, ...raw.map(clean)].filter(Boolean);
      candidates = [...new Set(all)].slice(0, 20);
    }
  } catch (_) {
    candidates = cleanedUser;
  }

  // Liveness + parking check — filter dead and parked domains
  const validationResults = await Promise.allSettled(
    candidates.map(async (domain) => {
      try {
        const res = await fetch(`https://${domain}`, { method: 'HEAD', signal: AbortSignal.timeout(5000) });
        if (PARKING_DOMAINS.some(p => res.url.includes(p))) return null;
        return domain;
      } catch {
        return null;
      }
    })
  );

  const validated = new Set(
    validationResults.map(r => r.status === 'fulfilled' ? r.value : null).filter(Boolean)
  );

  // User-entered always first (in original order), auto-discovered fills up to 10
  const userFirst = cleanedUser.filter(d => validated.has(d));
  const autoFill = candidates.filter(d => !userSet.has(d) && validated.has(d));
  const competitors = [...userFirst, ...autoFill].slice(0, 10);

  return new Response(JSON.stringify({ competitors, hadContent: content.length > 0 }), {
    status: 200,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}
