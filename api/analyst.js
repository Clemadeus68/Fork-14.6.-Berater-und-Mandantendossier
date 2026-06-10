export const config = { runtime: 'edge' };

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
  const pagesBlock = topPages.map(p => `  - ${p.path} | ~${p.clicks ?? Math.round(p.click_estimation ?? 0)} Klicks/Mo | ${p.keywords} Keywords`).join('\n');

  let compBlock = '';
  if (competitorData && competitorData.length > 0) {
    // Already sorted by visibility (sistrix.js delivers them that way), main always first
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
WETTBEWERB-VOLLVERGLEICH (SISTRIX Top-${total}, Deutschland):
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

function buildPrompt(url, crawlResult, sistrix, competitorData) {
  const { markdown, metadata, extract } = crawlResult;
  const metaBlock = [
    metadata.title && `Titel: ${metadata.title}`,
    metadata.description && `Meta-Description: ${metadata.description}`,
    metadata.ogTitle && metadata.ogTitle !== metadata.title && `OG-Titel: ${metadata.ogTitle}`,
    metadata.ogDescription && `OG-Description: ${metadata.ogDescription}`,
    extract.companyName && `Erkannter Firmenname: ${extract.companyName}`,
    extract.location && `Erkannter Standort: ${extract.location}`,
    extract.contactPerson && `Erkannter Ansprechpartner: ${extract.contactPerson}`,
    extract.linkedinUrl && `LinkedIn: ${extract.linkedinUrl}`,
  ].filter(Boolean).join('\n');

  const content = markdown.slice(0, 12000);
  const today = new Date().toLocaleDateString('de-DE');

  const sistrixBlock = buildSistrixBlock(sistrix, competitorData);

  return `Du bist ein erfahrener Unternehmensberater und Strategy Analyst. Du analysierst Unternehmen vor dem ersten Beratungsgespräch.

Analysiere das folgende Unternehmen auf Basis der gecrawlten Website-Inhalte${sistrixBlock ? ' und externer SISTRIX-Daten' : ''} und erstelle einen vollständigen Analyse-Report.

WEBSITE: ${url}

META-DATEN UND EXTRAHIERTE STRUKTURDATEN:
${metaBlock || '(keine Meta-Daten gefunden)'}
${sistrixBlock}
GECRAWLTER WEBSITE-INHALT (Markdown, erste 12.000 Zeichen):
${content}

---

Erstelle einen strukturierten Report im folgenden Markdown-Format. Triff fundierte Hypothesen, auch wenn Informationen fehlen – kennzeichne Unsicherheiten mit "(Hypothese)" oder "(unklar)". Sei direkt, konkret und handlungsorientiert.

---

# Unternehmensanalyse: [Firmenname einsetzen]
*Erstellt am: ${today} | Quelle: ${url}*

---

## 1. Unternehmensprofil

| Feld | Inhalt |
|------|--------|
| **Firmenname** | |
| **Website** | ${url} |
| **Branche** | |
| **Standort** | |
| **Unternehmensgröße** | (Schätzung) |
| **Ziel des Kontakts** | (Hypothese) |
| **Vermutete Herausforderungen** | |
| **Relevante Analysebereiche** | |

**Optionale Felder** *(sofern erkennbar)*:
- LinkedIn:
- Northdata:
- Impressum-URL:
- Ansprechpartner:

---

## 2. Positionierungsdiagnose

Kurze Zusammenfassung (3–5 Sätze): Wie positioniert sich das Unternehmen aktuell? Was ist der erste Eindruck?

---

## 3. Zielgruppenhypothese

**Wahrscheinliche Kernzielgruppe:**

**Adressierte Kundengruppen:**

**Spezifität der Zielgruppe:** [hoch / mittel / niedrig] – Begründung:

---

## 4. Was verkauft das Unternehmen?

**Produkte / Leistungen:**

**Welche Probleme werden gelöst?**

**Leistungsversprechen:** (Wird eher über Leistungen oder Ergebnisse gesprochen?)

---

## 5. Differenzierungsgrad

**Bewertung:** [Hoch / Mittel / Niedrig]

**Begründung:**

**Wodurch unterscheidet sich das Unternehmen?**

**Ist die Kommunikation generisch oder konkret?**

---

## 6. Angebotsklarheit

**Bewertung:** [Hoch / Mittel / Niedrig]

**Begründung:**

---

## 7. Wachstumshemmnisse

Die drei größten erkennbaren Herausforderungen:

1.
2.
3.

---

## 8. Chancen

Die drei größten erkennbaren Chancen:

1.
2.
3.

---

## 9. Executive Summary

*"Wenn ich morgen mit dem Geschäftsführer sprechen würde – was müsste ich wissen? Und was fragen?"*

**Was ich wissen sollte:**
-
-
-
-
-

**Was ich fragen würde:**
-
-
-
-
-

---

## 10. Analyse-Score

| Dimension | Score | Begründung |
|-----------|-------|------------|
| Positionierung | /10 | |
| Zielgruppenklarheit | /10 | |
| Angebotsklarheit | /10 | |
| Differenzierung | /10 | |
| Kommunikationsstärke | /10 | |
| **Gesamt** | **/10** | |

---

## 11. Nachfrageanalyse (SISTRIX)

> Grundlage: organische Traffic-Daten der analysierten Domain und aller Wettbewerber aus SISTRIX. Arbeite ausschließlich mit den oben gelieferten Zahlen — keine Annahmen, keine Erfindungen.

### Themen mit der höchsten Suchnachfrage

Analysiere die Top-Seiten der analysierten Domain nach ihren URL-Pfaden und Klick-Zahlen. Welche Themen und Suchintentionen stecken dahinter? Was suchen Menschen konkret, wenn sie auf diese Seiten landen? Nenne die Themen explizit mit den zugehörigen Klick-Zahlen aus den SISTRIX-Daten.

-
-
-
-

### Nachfrage-Vergleich mit Wettbewerbern

Vergleiche die Top-Seiten der Wettbewerber mit denen der analysierten Domain. Welche Themen ranken bei Wettbewerbern stark, fehlen aber im Traffic-Profil des Kunden? Welche Themen besetzt der Kunde, die Wettbewerber nicht haben? Nenne konkrete URL-Pfade und Klick-Differenzen.

-
-
-
-

### Demand Gaps — unbesetzte Nachfrage

Welche Themen werden von keinem der analysierten Wettbewerber systematisch bedient, obwohl die Branche und das Geschäftsmodell sie nahelegen? Was fehlt im gesamten Wettbewerbsfeld an digitalen Inhalten?

1.
2.
3.

### Handlungsempfehlungen aus der Nachfrageanalyse

Konkrete, umsetzbare Empfehlungen auf Basis der obigen Erkenntnisse. Was sollte der Kunde als nächstes angehen, um Nachfragepotenzial zu erschließen?

1.
2.
3.

---

## 12. Wettbewerbssichtbarkeit

> Basis: SISTRIX Sichtbarkeitsindex der identifizierten Wettbewerber (Deutschland, organische Suche)

${competitorData && competitorData.length > 0
  ? `**Verfügbare Wettbewerbsdaten:** ${competitorData.length} Wettbewerber mit SISTRIX-Daten vorhanden.`
  : `**Hinweis:** Für diese Analyse lagen keine Wettbewerber-Sichtbarkeitsdaten vor. Bitte den Abschnitt entsprechend kennzeichnen.`}

### Positionierung im digitalen Wettbewerb

*Ordne die analysierte Domain in das digitale Wettbewerbsfeld ein. Wer führt? Wer liegt zurück? Ist das überraschend oder erwartbar?*

-
-
-

### Interpretation der Sichtbarkeitsunterschiede

*Was bedeuten die Sichtbarkeitsunterschiede strategisch? Sind sie auf Branchendynamiken zurückzuführen (z.B. SEO-intensiver Wettbewerb), auf Ressourcen, auf Alter der Domain, auf Positionierungsstrategie?*

-
-
-

### Chancen und Risiken aus dem Sichtbarkeitsvergleich

*Was konkret sollte das Unternehmen tun – oder vermeiden – angesichts dieser digitalen Wettbewerbsposition?*

**Chancen:**
1.
2.

**Risiken / Warnsignale:**
1.
2.

---

Fülle alle Abschnitte vollständig aus. Schreibe vollständig und ohne Kürzungen.
Kapitel 11: Arbeite ausschließlich mit den gelieferten SISTRIX Top-Seiten-Daten. Leite Suchthemen aus URL-Pfaden und Klick-Zahlen ab — nenne konkrete Zahlen, keine Pauschalaussagen.
Kapitel 12: Nutze die SISTRIX-Vergleichstabelle. Interpretiere die Sichtbarkeitsunterschiede strategisch.`;
}

export default async function handler(req) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const firecrawlKey = process.env.FIRECRAWL_API_KEY;

  if (!anthropicKey) return new Response(JSON.stringify({ error: 'ANTHROPIC_API_KEY nicht gesetzt' }), {
    status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
  if (!firecrawlKey) return new Response(JSON.stringify({ error: 'FIRECRAWL_API_KEY nicht gesetzt' }), {
    status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

  const { url, competitorData = [] } = await req.json();
  if (!url) return new Response(JSON.stringify({ error: 'URL fehlt' }), {
    status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

  const targetUrl = url.startsWith('http') ? url : 'https://' + url;
  const sistrixKey = process.env.SISTRIX_API_KEY;
  const domain = new URL(targetUrl).hostname.replace(/^www\./, '');

  // Step 1: Firecrawl + Sistrix parallel
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
    return new Response(JSON.stringify({ error: `Crawling fehlgeschlagen: ${e.message}` }), {
      status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Step 2: Claude streaming
  const prompt = buildPrompt(targetUrl, crawlResult, sistrix, competitorData);

  const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': anthropicKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5',
      max_tokens: 16000,
      stream: true,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!anthropicResponse.ok) {
    const err = await anthropicResponse.json().catch(() => ({}));
    return new Response(JSON.stringify({ error: `Claude Fehler: ${err.error?.message || anthropicResponse.status}` }), {
      status: anthropicResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Pass Claude's SSE stream directly to the client
  return new Response(anthropicResponse.body, {
    status: 200,
    headers: {
      ...corsHeaders,
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'X-Content-Length': String(crawlResult.markdown.length),
    },
  });
}
