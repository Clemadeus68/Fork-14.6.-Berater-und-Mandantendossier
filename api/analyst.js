// Node.js runtime — longer timeout needed for Firecrawl + Claude 20k tokens
export const maxDuration = 300;

const SISTRIX_BASE = 'https://api.sistrix.com';

async function fetchSistrix(domain, apiKey) {
  const get = async (endpoint) => {
    const url = new URL(`${SISTRIX_BASE}/${endpoint}`);
    url.searchParams.set('api_key', apiKey);
    url.searchParams.set('format', 'json');
    url.searchParams.set('domain', domain);
    try {
      const res = await fetch(url.toString(), { signal: AbortSignal.timeout(8000) });
      const json = await res.json();
      if (json.status === 'fail') return null;
      return json;
    } catch { return null; }
  };

  const [vis, traffic] = await Promise.all([
    get('domain.visibilityindex'),
    get('domain.traffic.estimation'),
  ]);

  const visibility = parseFloat(vis?.answer?.[0]?.sichtbarkeitsindex?.[0]?.value ?? 0);
  const pages = traffic?.answer?.[0]?.result ?? [];
  const totalClicks = pages.reduce((s, p) => s + (p.click_estimation || 0), 0);
  const totalKeywords = pages.reduce((s, p) => s + (p.keywords || 0), 0);
  const totalValue = pages.reduce((s, p) => s + (p.estimated_value || 0), 0);
  const topPages = pages
    .sort((a, b) => b.click_estimation - a.click_estimation)
    .slice(0, 5);

  return { domain, visibility, totalClicks: Math.round(totalClicks), totalKeywords, totalValue: Math.round(totalValue), topPages };
}

async function crawlWithFirecrawl(url, apiKey) {
  const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      url,
      formats: ['markdown', 'extract'],
      extract: {
        schema: {
          type: 'object',
          properties: {
            companyName: { type: 'string' },
            location: { type: 'string' },
            contactPerson: { type: 'string' },
            linkedinUrl: { type: 'string' },
            employeeCount: { type: 'string' },
            foundingYear: { type: 'string' },
          }
        }
      },
      onlyMainContent: true,
    }),
    signal: AbortSignal.timeout(25000),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`Firecrawl Fehler ${response.status}: ${err.error || response.statusText}`);
  }

  const data = await response.json();
  if (!data.success) throw new Error('Firecrawl: Crawling nicht erfolgreich');

  return {
    markdown: data.data?.markdown || '',
    metadata: data.data?.metadata || {},
    extract: data.data?.extract || {},
  };
}

function visTier(v) {
  if (v === null || v === undefined) return 'unbekannt';
  if (v === 0) return 'kaum sichtbar (0)';
  if (v < 1) return `niedrig (${v.toFixed(2)})`;
  if (v < 10) return `mittel (${v.toFixed(2)})`;
  if (v < 50) return `gut (${v.toFixed(2)})`;
  return `sehr hoch (${v.toFixed(2)})`;
}

function buildSistrixBlock(sistrix, competitorData) {
  if (!sistrix) return '';
  const { domain, visibility, totalClicks, totalKeywords, totalValue, topPages } = sistrix;
  const pagesBlock = topPages.map(p =>
    `  - ${p.path} | ~${p.clicks ?? Math.round(p.click_estimation ?? 0)} Klicks/Mo | ${p.keywords} Keywords`
  ).join('\n');

  let compBlock = '';
  if (competitorData && competitorData.length > 0) {
    const all = [
      { domain, visibility: visibility ?? 0, totalClicks, totalKeywords, totalValue, isMain: true },
      ...competitorData.map(c => ({ ...c, isMain: false })),
    ].sort((a, b) => (b.visibility ?? 0) - (a.visibility ?? 0));

    const rank = all.findIndex(e => e.isMain) + 1;
    const total = all.length;
    const leader = all[0];

    const rows = all.map(c =>
      `  | ${c.domain}${c.isMain ? ' ✱' : ''} | ${(c.visibility ?? 0).toFixed(2)} | ~${(c.totalClicks ?? 0).toLocaleString('de-DE')} Klicks/Mo | ${(c.totalKeywords ?? 0)} Keywords | ${visTier(c.visibility)} |`
    ).join('\n');

    compBlock = `
WETTBEWERB-VOLLVERGLEICH — DIGITALE SICHTBARKEIT (SISTRIX, Deutschland):
  ✱ = analysierte Domain
  | Domain | Sichtbarkeit | Klicks/Mo | Keywords | Einordnung |
  |---|---|---|---|---|
${rows}

  Rang der analysierten Domain: ${rank} von ${total}
  Digital führend: ${leader.domain} (${(leader.visibility ?? 0).toFixed(2)})
  Verhältnis analysierte Domain zu Leader: ${leader.visibility > 0 ? (((visibility ?? 0) / leader.visibility) * 100).toFixed(0) : 0}%
`;
  }

  return `
SISTRIX EXTERNE DATEN — ANALYSIERTE DOMAIN (Deutschland):
- Domain: ${domain}
- Sichtbarkeitsindex: ${(visibility ?? 0).toFixed(2)} (${visTier(visibility)})
- Geschätzte organische Klicks/Monat: ${totalClicks.toLocaleString('de-DE')}
- Rankende Keywords gesamt: ${totalKeywords}
- Geschätzter SEO-Wert (€/Monat): ${totalValue.toLocaleString('de-DE')}
- Top-Seiten nach Traffic:
${pagesBlock || '  (keine Daten verfügbar)'}
${compBlock}`;
}

function buildContext(url, crawlResult, sistrix, competitorData, extraMeta) {
  const { markdown, metadata, extract } = crawlResult;
  const metaBlock = [
    metadata.title && `Titel: ${metadata.title}`,
    metadata.description && `Meta-Description: ${metadata.description}`,
    metadata.ogTitle && metadata.ogTitle !== metadata.title && `OG-Titel: ${metadata.ogTitle}`,
    extract.companyName && `Erkannter Firmenname: ${extract.companyName}`,
    extract.location && `Erkannter Standort: ${extract.location}`,
    extract.contactPerson && `Erkannter Ansprechpartner: ${extract.contactPerson}`,
    extract.linkedinUrl && `LinkedIn: ${extract.linkedinUrl}`,
    extract.employeeCount && `Mitarbeiter: ${extract.employeeCount}`,
    extract.foundingYear && `Gründungsjahr: ${extract.foundingYear}`,
    extraMeta?.name && `Manuell: Firmenname = ${extraMeta.name}`,
    extraMeta?.branche && `Manuell: Branche = ${extraMeta.branche}`,
    extraMeta?.produkt && `Manuell: Produkt/DL = ${extraMeta.produkt}`,
  ].filter(Boolean).join('\n');

  const content = markdown.slice(0, 12000);
  const sistrixBlock = buildSistrixBlock(sistrix, competitorData);
  return { metaBlock, content, sistrixBlock };
}

function buildPromptPart1(url, crawlResult, sistrix, competitorData, extraMeta) {
  const { metaBlock, content, sistrixBlock } = buildContext(url, crawlResult, sistrix, competitorData, extraMeta);
  const today = new Date().toLocaleDateString('de-DE');
  const hasCompetitors = competitorData && competitorData.length > 0;
  const visStr = sistrix ? `${sistrix.visibility.toFixed(2)} (${visTier(sistrix.visibility)})` : '(keine SISTRIX-Daten)';
  const clicksStr = sistrix ? sistrix.totalClicks.toLocaleString('de-DE') : '—';
  const kwStr = sistrix ? sistrix.totalKeywords.toLocaleString('de-DE') : '—';

  return `Du bist ein erfahrener Unternehmensberater. Du erstellst TEIL 1 einer Strategieanalyse (Kapitel 1 + 2) für das erste Beratungsgespräch.

Schreibe direkt, konkret, hypothesenstark. Kennzeichne Annahmen mit "(Hypothese)". Keine Füllsätze.

WEBSITE: ${url}
META-DATEN: ${metaBlock || '(keine)'}
${sistrixBlock}
WEBSITE-INHALT (erste 12.000 Zeichen):
${content}

---

Schreibe jetzt vollständig und ohne Kürzungen:

# Strategieanalyse: [Firmenname]
*Erstellt am: ${today} | Quelle: ${url}*

## Inhaltsverzeichnis
- [Kapitel 1: Unternehmen, Markt & Wettbewerb](#kapitel-1)
- [Kapitel 2: Digitale Außensicht & Sichtbarkeit](#kapitel-2)
- [Kapitel 3: Synthese & Gesprächsvorbereitung](#kapitel-3) *(folgt)*

---

# Kapitel 1: Unternehmen, Markt & Wettbewerb {#kapitel-1}

## 1.1 Unternehmensprofil
Tabelle mit: Firmenname, Website (${url}), Branche, Standort, Unternehmensgröße, Gründungsjahr, vermuteter Anlass des Erstkontakts (Hypothese), vermutete Herausforderungen, Ansprechpartner, LinkedIn.

## 1.2 Positionierungsdiagnose
3–5 Sätze: Positionierung, Außendarstellung, Konsistenz, Stärken und Schwächen der Selbstdarstellung.

## 1.3 Angebot & Zielgruppen
Leistungen, gelöste Probleme, Kernzielgruppe, adressierte Kundengruppen, Spezifität der Ansprache (hoch/mittel/niedrig + Begründung).

## 1.4 Marktanalyse
Marktgröße DACH, Wachstumsrate letzte 3 Jahre + Prognose 3 Jahre, 3 Wachstumstreiber, 2 dämpfende Faktoren. (Hypothesen kennzeichnen)

## 1.5 Wettbewerbslandschaft
3–5 konkrete Wettbewerber mit Positionierung, Stärken, Marktanteil (Hypothese). Wettbewerbsdynamik. SISTRIX-Sichtbarkeiten einbauen wo vorhanden.

## 1.6 Branchenstruktur & Trends
Wertschöpfungskette, Konzentrationsgrad, Eintrittsbarrieren, 5 Branchentrends nächste 5 Jahre, technologische Disruption.

## 1.7 Regulierung & Fördermittel
Relevante Gesetze/Anforderungen. Konkrete Förderprogramme: BAFA, INQA (Unternehmenskultur, Personal & Kompetenz, Digitalisierung), KfW, EU — was kommt für dieses Unternehmen infrage?

## 1.8 Differenzierung & Wachstumshemmnisse
Differenzierungsgrad (hoch/mittel/niedrig), Unterscheidungsmerkmale, Kommunikationsqualität, die 3 größten Wachstumshemmnisse, die 3 größten Chancen.

---

# Kapitel 2: Digitale Außensicht & Sichtbarkeit {#kapitel-2}

## 2.1 Webseitenanalyse
10-Sekunden-Test (ja/nein/teilweise + Begründung), Website-Stärken, Lücken vs. Best Practice, CTA-Qualität, Sprachqualität.

## 2.2 Digitale Sichtbarkeit (SISTRIX)
NUR mit diesen Zahlen arbeiten — keine Erfindungen:
- Sichtbarkeitsindex: ${visStr}
- Klicks/Monat: ${clicksStr}
- Keywords: ${kwStr}
Einordnung + strategische Bedeutung + Themen mit höchster Suchnachfrage (aus Top-Seiten ablesen).

## 2.3 Wettbewerbsvergleich digital
${hasCompetitors ? `Basis: SISTRIX-Daten von ${competitorData.length} Wettbewerbern (aus den SISTRIX-Daten oben).` : 'Keine Wettbewerber-SISTRIX-Daten — allgemeine Brancheneinordnung.'}
Positionierung im digitalen Wettbewerb, Interpretation der Unterschiede, 2 Chancen, 2 Risiken.

## 2.4 Demand Gaps & Quick Wins
3 unbesetzte Nachfragebereiche, 3 priorisierte Quick Wins (sofort/kurzfristig/mittelfristig).`;
}

function buildPromptPart2(url, part1Text, crawlResult, sistrix, competitorData, extraMeta) {
  const { metaBlock, content, sistrixBlock } = buildContext(url, crawlResult, sistrix, competitorData, extraMeta);

  return `Du hast soeben Kapitel 1 und 2 einer Strategieanalyse erstellt. Hier ist der bisherige Inhalt:

${part1Text.slice(-6000)}

---

Erstelle jetzt vollständig KAPITEL 3 (Synthese & Gesprächsvorbereitung) auf Basis dieser Analyse. Direkt, konkret, keine Füllsätze.

---

# Kapitel 3: Synthese & Gesprächsvorbereitung {#kapitel-3}

## 3.1 Analyse-Score
Tabelle mit Score /10 und Begründung für: Positionierungsklarheit, Zielgruppenklarheit, Angebotsklarheit, Differenzierung, Digitale Sichtbarkeit, Kommunikationsstärke, Gesamteindruck.

## 3.2 Priorisierte Problemfelder
**Kurzfristig (0–12 Monate):** Akuter Handlungsbedarf — Symptome beim Mandanten, Belege aus der Analyse.
**Mittelfristig (1–3 Jahre):** Strategische Lücken, Markt-/Wettbewerbsveränderungen ohne Reaktion.
**Langfristig (3–7 Jahre):** Strukturelle Herausforderungen, Disruptionspotenziale.

## 3.3 Executive Summary & Einstiegsfragen
**5 wichtigste Punkte für das Erstgespräch** (kompakt, präzise).
**5 Einstiegsfragen als offene Hypothesen** (konkret formuliert, Antwort provozierend).`;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const firecrawlKey = process.env.FIRECRAWL_API_KEY;

  if (!anthropicKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY nicht gesetzt' });
  if (!firecrawlKey) return res.status(500).json({ error: 'FIRECRAWL_API_KEY nicht gesetzt' });

  const { url, competitorData = [], extraMeta = {} } = req.body;
  if (!url) return res.status(400).json({ error: 'URL fehlt' });

  const targetUrl = url.startsWith('http') ? url : 'https://' + url;
  const sistrixKey = process.env.SISTRIX_API_KEY;
  const domain = new URL(targetUrl).hostname.replace(/^www\./, '');

  let crawlResult;
  let sistrix = null;
  try {
    const [crawl, sist] = await Promise.allSettled([
      crawlWithFirecrawl(targetUrl, firecrawlKey),
      sistrixKey ? fetchSistrix(domain, sistrixKey) : Promise.resolve(null),
    ]);
    if (crawl.status === 'rejected') throw new Error(crawl.reason?.message || 'Crawling fehlgeschlagen');
    crawlResult = crawl.value;
    if (sist.status === 'fulfilled') sistrix = sist.value;
  } catch (e) {
    return res.status(422).json({ error: `Crawling fehlgeschlagen: ${e.message}` });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');

  const anthropicHeaders = {
    'Content-Type': 'application/json',
    'x-api-key': anthropicKey,
    'anthropic-version': '2023-06-01',
  };

  async function streamClaude(prompt, bufferOutput) {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: anthropicHeaders,
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 8000,
        stream: true,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      throw new Error(`Claude Fehler: ${err.error?.message || r.status}`);
    }
    const reader = r.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let collected = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      res.write(chunk);
      if (bufferOutput) {
        // Extract text from SSE for use as context in part 2
        buffer += chunk;
        const lines = buffer.split('\n');
        buffer = lines.pop();
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') continue;
          try {
            const event = JSON.parse(data);
            if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
              collected += event.delta.text;
            }
          } catch (_) {}
        }
      }
    }
    return collected;
  }

  try {
    // Call 1: Kapitel 1 + 2
    const prompt1 = buildPromptPart1(targetUrl, crawlResult, sistrix, competitorData, extraMeta);
    const part1Text = await streamClaude(prompt1, true);

    // Call 2: Kapitel 3 (with Kapitel 1+2 as context)
    const prompt2 = buildPromptPart2(targetUrl, part1Text, crawlResult, sistrix, competitorData, extraMeta);
    await streamClaude(prompt2, false);
  } catch (e) {
    res.write(`data: {"type":"error","error":{"message":"${e.message}"}}\n\n`);
  }

  res.end();
}
