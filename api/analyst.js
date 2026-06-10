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

function buildPrompt(url, crawlResult, sistrix, competitorData, extraMeta) {
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

  const content = markdown.slice(0, 14000);
  const today = new Date().toLocaleDateString('de-DE');
  const sistrixBlock = buildSistrixBlock(sistrix, competitorData);
  const hasCompetitors = competitorData && competitorData.length > 0;
  const visStr = sistrix ? `${sistrix.visibility.toFixed(2)} (${visTier(sistrix.visibility)})` : '(keine SISTRIX-Daten)';
  const clicksStr = sistrix ? sistrix.totalClicks.toLocaleString('de-DE') : '—';
  const kwStr = sistrix ? sistrix.totalKeywords.toLocaleString('de-DE') : '—';

  return `Du bist ein erfahrener Unternehmensberater und Strategy Analyst. Du analysierst Unternehmen vor dem ersten Beratungsgespräch.

Erstelle eine vollständige Strategieanalyse auf Basis der gecrawlten Website-Inhalte${sistrixBlock ? ' und externer SISTRIX-Daten' : ''}.

WEBSITE: ${url}

META-DATEN:
${metaBlock || '(keine Meta-Daten gefunden)'}
${sistrixBlock}
GECRAWLTER WEBSITE-INHALT (erste 14.000 Zeichen):
${content}

---

Erstelle den folgenden Report vollständig. Fundierte Hypothesen sind erwünscht — kennzeichne Unsicherheiten mit "(Hypothese)". Direkt, konkret, handlungsorientiert. Keine Füllsätze.

---

# Vollständige Strategieanalyse: [Firmenname einsetzen]
*Erstellt am: ${today} | Quelle: ${url}*

---

## Inhaltsverzeichnis

- [Kapitel 1: Unternehmen, Markt & Wettbewerb](#kapitel-1-unternehmen-markt--wettbewerb)
  - [1.1 Unternehmensprofil](#11-unternehmensprofil)
  - [1.2 Positionierungsdiagnose](#12-positionierungsdiagnose)
  - [1.3 Angebot & Zielgruppen](#13-angebot--zielgruppen)
  - [1.4 Marktanalyse](#14-marktanalyse)
  - [1.5 Wettbewerbslandschaft](#15-wettbewerbslandschaft)
  - [1.6 Branchenstruktur & Trends](#16-branchenstruktur--trends)
  - [1.7 Regulierung & Fördermittel](#17-regulierung--fördermittel)
  - [1.8 Differenzierung & Wachstumshemmnisse](#18-differenzierung--wachstumshemmnisse)
- [Kapitel 2: Digitale Außensicht & Sichtbarkeit](#kapitel-2-digitale-außensicht--sichtbarkeit)
  - [2.1 Webseitenanalyse](#21-webseitenanalyse)
  - [2.2 Digitale Sichtbarkeit (SISTRIX)](#22-digitale-sichtbarkeit-sistrix)
  - [2.3 Wettbewerbsvergleich digital](#23-wettbewerbsvergleich-digital)
  - [2.4 Demand Gaps & Quick Wins](#24-demand-gaps--quick-wins)
- [Kapitel 3: Synthese & Gesprächsvorbereitung](#kapitel-3-synthese--gesprächsvorbereitung)
  - [3.1 Analyse-Score](#31-analyse-score)
  - [3.2 Priorisierte Problemfelder](#32-priorisierte-problemfelder)
  - [3.3 Executive Summary & Einstiegsfragen](#33-executive-summary--einstiegsfragen)

---

# Kapitel 1: Unternehmen, Markt & Wettbewerb

## 1.1 Unternehmensprofil

| Feld | Inhalt |
|------|--------|
| **Firmenname** | |
| **Website** | ${url} |
| **Branche** | |
| **Standort** | |
| **Unternehmensgröße** | |
| **Gründungsjahr** | |
| **Vermuteter Anlass des Erstkontakts** | (Hypothese) |
| **Vermutete Herausforderungen** | |
| **Ansprechpartner** | |
| **LinkedIn** | |

---

## 1.2 Positionierungsdiagnose

[3–5 Sätze: Wie positioniert sich das Unternehmen? Erster Eindruck der Außendarstellung? Klar, differenziert, konsistent?]

---

## 1.3 Angebot & Zielgruppen

**Produkte / Leistungen:**

**Welche Probleme werden gelöst?**

**Wahrscheinliche Kernzielgruppe:**

**Adressierte Kundengruppen:**

**Spezifität der Zielgruppenansprache:** [hoch / mittel / niedrig] — Begründung:

---

## 1.4 Marktanalyse

**Marktgröße (Deutschland / DACH / Europa):**

**Wachstumsrate (letzte 3 Jahre) und Prognose (nächste 3 Jahre):**

**Wesentliche Wachstumstreiber:**
-
-
-

**Dämpfende Faktoren:**
-
-

---

## 1.5 Wettbewerbslandschaft

**3–5 relevante Wettbewerber:**

1. **[Name]** — Positionierung, Stärken, geschätzter Marktanteil
2. **[Name]** — ...
3. **[Name]** — ...

**Aktuelle Wettbewerbsdynamiken:**

---

## 1.6 Branchenstruktur & Trends

**Kritische Stufen der Wertschöpfungskette:**

**Konzentrationsgrad:** [fragmentiert / mittel / oligopolistisch]

**Eintrittsbarrieren:**

**5 wesentliche Branchentrends (nächste 5 Jahre):**
1.
2.
3.
4.
5.

**Technologische Disruption:**

---

## 1.7 Regulierung & Fördermittel

**Relevante gesetzliche Anforderungen:**

**Relevante Förderprogramme für dieses Unternehmen:**
(BAFA, INQA, KfW, EU-Fonds — was käme konkret infrage?)

---

## 1.8 Differenzierung & Wachstumshemmnisse

**Differenzierungsgrad:** [Hoch / Mittel / Niedrig]

**Wodurch unterscheidet sich das Unternehmen?**

**Kommunikation:** [konkret / generisch — Begründung]

**Die 3 größten erkennbaren Wachstumshemmnisse:**
1.
2.
3.

**Die 3 größten erkennbaren Chancen:**
1.
2.
3.

---

# Kapitel 2: Digitale Außensicht & Sichtbarkeit

## 2.1 Webseitenanalyse

**10-Sekunden-Test:** [Ja / Teilweise / Nein] — Begründung:

**Stärken der Website:**
-
-

**Lücken im Vergleich zu Best Practice:**
-
-
-

**Call-to-Action-Qualität:** [klar / schwach / fehlend]

**Sprachliche Qualität:** [konkret / generisch / Jargon-lastig]

---

## 2.2 Digitale Sichtbarkeit (SISTRIX)

> Arbeite ausschließlich mit den gelieferten SISTRIX-Zahlen — keine Erfindungen.

**Sichtbarkeitsindex:** ${visStr}
**Organische Klicks/Monat:** ${clicksStr}
**Rankende Keywords:** ${kwStr}

**Themen mit der höchsten Suchnachfrage:**
(Leite aus Top-Seiten-URLs und Klick-Zahlen konkrete Suchthemen ab)
-
-
-

**Strategische Einordnung:**
[Was bedeutet diese Sichtbarkeitslage für das Unternehmen?]

---

## 2.3 Wettbewerbsvergleich digital

${hasCompetitors
  ? `> Basis: SISTRIX-Vergleich mit ${competitorData.length} Wettbewerbern.`
  : `> Keine Wettbewerber-Sichtbarkeitsdaten verfügbar — allgemeine Brancheneinordnung.`}

**Positionierung im digitalen Wettbewerb:**

**Interpretation der Sichtbarkeitsunterschiede:**

**Chancen:**
1.
2.

**Risiken / Warnsignale:**
1.
2.

---

## 2.4 Demand Gaps & Quick Wins

**Unbesetzte Nachfrage (keine systematische Bedienung durch Wettbewerber):**
1.
2.
3.

**Konkrete Quick Wins — priorisiert:**
1. **(sofort, 0–4 Wochen):**
2. **(kurzfristig, 1–3 Monate):**
3. **(mittelfristig, 3–6 Monate):**

---

# Kapitel 3: Synthese & Gesprächsvorbereitung

## 3.1 Analyse-Score

| Dimension | Score | Begründung |
|-----------|-------|------------|
| Positionierungsklarheit | /10 | |
| Zielgruppenklarheit | /10 | |
| Angebotsklarheit | /10 | |
| Differenzierung | /10 | |
| Digitale Sichtbarkeit | /10 | |
| Kommunikationsstärke | /10 | |
| **Gesamteindruck** | **/10** | |

---

## 3.2 Priorisierte Problemfelder

**Kurzfristig (0–12 Monate) — akuter Handlungsbedarf:**
- Symptome beim Mandanten:
- Belege aus der Analyse:

**Mittelfristig (1–3 Jahre) — strategische Lücken:**
- Markt-/Wettbewerbsveränderungen ohne Reaktion:

**Langfristig (3–7 Jahre) — strukturelle Herausforderungen:**
- Disruptionspotenziale:

---

## 3.3 Executive Summary & Einstiegsfragen

**Was ich wissen sollte (5 wichtigste Punkte):**
-
-
-
-
-

**Was ich fragen würde (5 Einstiegsfragen als offene Hypothesen):**
-
-
-
-
-

---

Fülle alle Abschnitte vollständig aus — keine Kürzungen.
Kapitel 2.2/2.3: Nur mit gelieferten SISTRIX-Zahlen arbeiten, konkrete Zahlen nennen.
Kapitel 1.4–1.6: Fundierte Hypothesen sind ausdrücklich erwünscht, bitte kennzeichnen.`;
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

  const { url, competitorData = [], extraMeta = {} } = await req.json();
  if (!url) return new Response(JSON.stringify({ error: 'URL fehlt' }), {
    status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

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
    return new Response(JSON.stringify({ error: `Crawling fehlgeschlagen: ${e.message}` }), {
      status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const prompt = buildPrompt(targetUrl, crawlResult, sistrix, competitorData, extraMeta);

  const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': anthropicKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5',
      max_tokens: 20000,
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

  return new Response(anthropicResponse.body, {
    status: 200,
    headers: {
      ...corsHeaders,
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
    },
  });
}
