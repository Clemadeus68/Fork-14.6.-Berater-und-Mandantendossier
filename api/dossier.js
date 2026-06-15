export const config = { runtime: 'edge' };

const SISTRIX_BASE = 'https://api.sistrix.com';

// ── SISTRIX (Fallback, identisch zu analyst.js) ────────────────────────────────
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

// ── Firecrawl (identisch zu analyst.js — Datenerhebung bleibt unverändert) ──────
const SUBPAGE_SCORES = [
  { patterns: ['ueber', 'über', 'uber', 'about', 'unternehmen', 'company', 'wer-wir'], score: 10 },
  { patterns: ['referenz', 'reference', 'kunden', 'customer', 'fallstudie', 'case'], score: 9 },
  { patterns: ['projekt', 'portfolio', 'work', 'erfolg'], score: 8 },
  { patterns: ['team', 'mitarbeiter', 'people', 'wir-sind'], score: 7 },
  { patterns: ['leistung', 'service', 'angebot', 'loesung', 'lösung', 'solution'], score: 6 },
];
const SUBPAGE_SKIP = ['/wp-admin', '/login', '/cart', '/warenkorb', '/checkout',
  '/datenschutz', '/impressum', '/privacy', '/agb', '/sitemap', '.xml', '.pdf', '#', '?'];

function scoreSubpage(urlStr) {
  const lower = urlStr.toLowerCase();
  if (SUBPAGE_SKIP.some(p => lower.includes(p))) return 0;
  for (const { patterns, score } of SUBPAGE_SCORES) {
    if (patterns.some(p => lower.includes(p))) return score;
  }
  return 0;
}

async function scrapeOnePage(pageUrl, apiKey, timeoutMs, extraFormats = {}) {
  const r = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({ url: pageUrl, formats: ['markdown'], onlyMainContent: true, ...extraFormats }),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!r.ok) return '';
  const d = await r.json();
  return d?.success ? (d.data?.markdown || '') : '';
}

async function crawlWithFirecrawl(url, apiKey) {
  const homeStart = Date.now();

  const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({
      url,
      formats: ['markdown', 'extract', 'links'],
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
    signal: AbortSignal.timeout(20000),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`Firecrawl Fehler ${response.status}: ${err.error || response.statusText}`);
  }

  const data = await response.json();
  if (!data.success) throw new Error('Firecrawl: Crawling nicht erfolgreich');

  const homeMarkdown = data.data?.markdown || '';
  const metadata = data.data?.metadata || {};
  const extract = data.data?.extract || {};
  const rawLinks = data.data?.links || [];
  const homeElapsed = Date.now() - homeStart;

  let subMarkdowns = [];
  if (homeElapsed < 15000 && rawLinks.length > 0) {
    try {
      const baseDomain = new URL(url).hostname;
      const subpages = rawLinks
        .filter(link => { try { return new URL(link).hostname === baseDomain; } catch { return false; } })
        .map(link => ({ url: link, score: scoreSubpage(link) }))
        .filter(l => l.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map(l => l.url);

      if (subpages.length > 0) {
        const results = await Promise.allSettled(
          subpages.map(pageUrl => scrapeOnePage(pageUrl, apiKey, 8000))
        );
        subMarkdowns = results
          .map(r => r.status === 'fulfilled' ? r.value : '')
          .filter(Boolean);
      }
    } catch (_) {}
  }

  const markdown = subMarkdowns.length > 0
    ? [homeMarkdown, ...subMarkdowns].join('\n\n---\n\n')
    : homeMarkdown;

  return { markdown, metadata, extract };
}

function visTier(v) {
  if (v === null || v === undefined) return 'unbekannt';
  if (v === 0) return 'kaum sichtbar (0)';
  if (v < 1) return `niedrig (${v.toFixed(2)})`;
  if (v < 10) return `mittel (${v.toFixed(2)})`;
  if (v < 50) return `gut (${v.toFixed(2)})`;
  return `sehr hoch (${v.toFixed(2)})`;
}

// ── SISTRIX-Block für den Prompt (damit Claude mit echten Zahlen schreibt) ──────
function buildSistrixBlock(sistrix, competitorData) {
  if (!sistrix) return '(keine SISTRIX-Daten verfügbar)';
  const { domain, visibility, totalClicks, totalKeywords, totalValue } = sistrix;

  let compBlock = '';
  if (competitorData && competitorData.length > 0) {
    const all = [
      { domain, visibility: visibility ?? 0, totalClicks, totalKeywords, isMain: true },
      ...competitorData.map(c => ({ ...c, isMain: false })),
    ].sort((a, b) => (b.visibility ?? 0) - (a.visibility ?? 0));

    const rows = all.map(c =>
      `  | ${c.domain}${c.isMain ? ' (ZIELDOMAIN)' : ''} | ${(c.visibility ?? 0).toFixed(2)} | ${(c.totalClicks ?? 0).toLocaleString('de-DE')} | ${(c.totalKeywords ?? 0)} |`
    ).join('\n');

    const leader = all[0];
    compBlock = `
WETTBEWERB-VOLLVERGLEICH (SISTRIX, Deutschland) — alle Domains aus den Rohdaten:
  | Domain | Sichtbarkeit | Klicks/Monat | Keywords |
${rows}
  Digital führend: ${leader.domain} (${(leader.visibility ?? 0).toFixed(2)})
`;
  }

  return `SISTRIX — ZIELDOMAIN (Deutschland):
- Domain: ${domain}
- Sichtbarkeitsindex: ${(visibility ?? 0).toFixed(2)} (${visTier(visibility)})
- Geschätzte organische Klicks/Monat: ${totalClicks.toLocaleString('de-DE')}
- Rankende Keywords gesamt: ${totalKeywords}
- Geschätzter SEO-Wert (€/Monat): ${totalValue.toLocaleString('de-DE')}
${compBlock}`;
}

// ── Dossier-Prompt ─────────────────────────────────────────────────────────────
function buildDossierPrompt(url, crawlResult, sistrix, competitorData, extraMeta) {
  const { markdown, metadata, extract } = crawlResult;
  const metaBlock = [
    metadata.title && `Titel: ${metadata.title}`,
    metadata.description && `Meta-Description: ${metadata.description}`,
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

  const content = markdown.slice(0, 20000);
  const sistrixBlock = buildSistrixBlock(sistrix, competitorData);
  const today = new Date();
  const monatJahr = today.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });

  // Liste verfügbarer Domains (für Teil-B-Tabellenauswahl per Domainname)
  const availableDomains = sistrix
    ? [sistrix.domain, ...(competitorData || []).map(c => c.domain)].filter(Boolean)
    : [];

  return `Du bist Clemens Gutmann, Inhaber der be nice Managementberatung. Du bereitest ein internes Mandanten-Dossier für ein Erstgespräch vor. Es ersetzt frühere Doppelberichte durch ein einziges Dokument: Teil A intern, Teil B als abtrennbares Kundendokument.

ABSOLUTE AUSGABE-REGEL: Antworte mit GENAU EINEM validen JSON-Objekt. Kein Markdown, keine Code-Fences, kein Text davor oder danach. Beginne mit { und ende mit }.

═══════════ ROHDATEN ═══════════
WEBSITE: ${url}
META: ${metaBlock || '(keine)'}

${sistrixBlock}

WEBSITE-INHALT (Homepage + Unterseiten, max. 20.000 Zeichen):
${content}
═══════════════════════════════

SCHREIBSTIMME (verbindlich, Clemens Gutmann / be nice):
- Erst Beziehung, dann Erklärung. Erst Bild, dann Begriff. Erst Mensch, dann Mechanismus. Texte beginnen mit etwas Wiedererkennbarem, nie mit einer Definition.
- Kurze Impulssätze wechseln mit längeren, fließenden Sätzen. Menschen kommen vor, nicht nur Prozesse.
- KEINE langen Gedankenstriche (Em-Dashes "—"). Stattdessen Komma, Punkt oder Klammer.
- KEINE Konstruktion "das ist kein X, das ist ein Y".
- KEINE Phrasen wie "in der heutigen Zeit", "ganzheitlicher Ansatz", "Mehrwert schaffen", "maßgeschneiderte Lösungen", "entscheidend". Kein Agentursprech, kein LinkedIn-Ton.
- Teil A: nüchtern, Ich-Perspektive ("entscheidet meine Angebotslogik", "spreche ich nicht an"). Teil B: warm, Sie-Ansprache.

INHALTSREGELN:
- Alles, was nicht direkt aus den Rohdaten belegt ist, mit dem Kürzel " (H)" markieren. Nicht "(Hypothese)" ausschreiben.
- Redundanzverbot in Teil A: Jeder Befund und jede Aussage genau einmal. Das Drehbuch wiederholt KEINE wörtliche Frage, es referenziert Befunde per Nummer (B1, B2 ...).
- Befunde: 4 bis 6 Stück, priorisiert nach Hebelwirkung. Titel kurz und sprechend (z.B. "B1 · Digital unsichtbar"). Beleg-Text 2 bis 4 Sätze mit harten Zahlen, nur Befund, keine Bewertung.
- Ist ein Befund im Erstgespräch tabu, lautet sein "gespraech"-Feld exakt: "Im Erstgespräch nicht ansprechen."
- TABU-THEMEN aus Teil A (typisch: Inhaber-Flaschenhals, Markeninkonsistenz) dürfen in Teil B UNTER KEINEN UMSTÄNDEN auftauchen. Teil B enthält keine interne Einschätzung, keine Gesprächstaktik, keine Abschlusswahrscheinlichkeit, keinen Phasen-Fahrplan.
- Förderbezug wo passend: BAFA (bis 3.500 € Zuschuss), INQA-Coaching (bis 80 %, max. 17.500 €).
- Umfang: Teil A ca. 1.800 Wörter, Teil B ca. 700 Wörter. Lieber priorisieren und kürzen als überladen.

Verfügbare Domains aus den SISTRIX-Rohdaten (nur diese in Teil-B-Tabelle referenzieren): ${availableDomains.join(', ') || '(keine)'}

Gib jetzt das JSON-Objekt nach exakt diesem Schema aus (alle Felder füllen, Strings in der Schreibstimme):

{
  "firma": "vollständiger Firmenname",
  "ansprechpartner": "Name des Ansprechpartners, oder \\"(unbekannt)\\" wenn nicht ermittelbar",
  "monatJahr": "${monatJahr}",
  "teilA": {
    "kernsatz": "2 bis 3 Sätze Kernsatz des Falls für die Akzent-Box. Letzter Satz: dass alles mit (H) markierte Hypothese ist und im Erstgespräch geprüft wird.",
    "cockpit": {
      "unternehmen": "Firma, Ort, Geschäftsmodell, Größe, Marktalter. 2 bis 4 Sätze.",
      "ansprechpartner": "Name, Rolle, Entscheidungsweg.",
      "lage": "Substanz vs. Kernproblem in einem Satz.",
      "score": "Eine Zeile: Gesamteindruck X/10 plus Einzeldimensionen mit · getrennt, aufsteigend nach Schwäche sortiert. Beispiel: Gesamteindruck 4/10 · Sichtbarkeit 2 · Differenzierung 4 · Kommunikation 4 · Positionierung 5 · Angebot 6",
      "attraktivitaet": "Mandatsattraktivität, Abschlusswahrscheinlichkeit, was die Entscheidung kippen kann.",
      "naechsterSchritt": "Konkret, mit Frist."
    },
    "befunde": [
      {
        "titel": "B1 · kurzer sprechender Titel",
        "beleg": "2 bis 4 Sätze mit harten Zahlen, nur Befund.",
        "intern": "Wahrscheinliche Ursache, Bedeutung für Qualifizierung und Angebotslogik, Förderbezug wo passend, taktische Hinweise inklusive dem, was ich NICHT ansprechen soll.",
        "gespraech": "Wörtliche Frage/Formulierung in deutschen Anführungszeichen plus erwartete Reaktion in einem Satz. ODER exakt: Im Erstgespräch nicht ansprechen."
      }
    ],
    "datenblatt": {
      "wettbewerbErgaenzung": "Ein kurzer kursiver Ergänzungssatz unter der SISTRIX-Tabelle (z.B. geschätzter SEO-Wert der Zieldomain, regionale Konkurrenz außerhalb der Daten mit (H)).",
      "marktTrends": [
        { "thema": "Regionales Potenzial", "aussage": "kurz" },
        { "thema": "Marktphase", "aussage": "kurz" },
        { "thema": "Treiber", "aussage": "kurz" },
        { "thema": "Dämpfer", "aussage": "kurz" },
        { "thema": "Strukturrisiko", "aussage": "kurz" }
      ],
      "foerderhebel": [
        { "programm": "INQA-Coaching", "hebel": "bis 80 %, max. 17.500 €", "einsatz": "Einsatz im Mandat mit Eignungsurteil" },
        { "programm": "BAFA-Beratung", "hebel": "bis 3.500 € Zuschuss", "einsatz": "Einsatz im Mandat mit Eignungsurteil" },
        { "programm": "weiteres Programm falls passend", "hebel": "...", "einsatz": "..." }
      ]
    },
    "drehbuch": {
      "hauptthema": "Der eine Satz fürs Gespräch und warum er den Unternehmer-Nerv trifft.",
      "dramaturgie": "Reihenfolge der Fragen, referenziert per Befund-Nummer (Einstieg über B1, dann B2 ...). Fragen NICHT wiederholen.",
      "einwaende": [
        { "zitat": "wahrscheinlichster Einwand als wörtliches Zitat", "antwort": "Antwortstrategie im Fließtext." },
        { "zitat": "zweiter Einwand als Zitat", "antwort": "Antwortstrategie." }
      ],
      "tabu": "Was im Erstgespräch nicht angesprochen wird, mit kurzer Begründung je Punkt.",
      "nachGespraech": "48-Stunden-Routine nach dem Gespräch."
    },
    "teilBUebergang": "3 Sätze: was die folgenden Seiten sind und was sie bewusst nicht enthalten."
  },
  "teilB": {
    "akzentbox": "Sinngemäß: Dieses Kurzdossier zeigt, was ein potenzieller Mandant sieht, wenn er Sie heute sucht. Und was er nicht sieht. (an Branche anpassen)",
    "szene": {
      "titel": "kurze Szenen-Überschrift, z.B. Ein Geschäftsführer aus Heidelberg",
      "absaetze": [
        "Szene-Einstieg: konkreter fiktiver Wunschkunde sucht die Leistung, googelt, findet die Wettbewerber, nicht den Mandanten.",
        "Kurzer Absatz: er findet Wettbewerber X und Y, Sie nicht.",
        "Anerkennung: 2 bis 3 echte Stärken des Mandanten mit Namen und Substanz, dann die Brücke zur Diagnose."
      ]
    },
    "zahlen": {
      "intro": "Ein Satz, was SISTRIX misst, Überleitung zur Tabelle.",
      "domains": ["domain1.de", "domain2.de", "regionaler-peer.de", "zieldomain.de"],
      "nach": [
        "Übersetzung des Schmerzes in Alltagssprache, inklusive Satz wie: Wer Sie kennt, findet Sie. Wer Sie nicht kennt, findet <Marktführer>.",
        "Ein Satz: Website als Visitenkarte vs. stummer Akquisekanal."
      ]
    },
    "bedeutung": [
      "Konsequenz: Abhängigkeit vom Netzwerk, verändertes Suchverhalten der nächsten Entscheider-Generation.",
      "Gute Nachricht: offenes Zeitfenster, weil auch die Peers unsichtbar sind. Schmerz und Chance zusammen."
    ],
    "hebel": {
      "items": [
        "1 · erster Hebel, konkret aber zu knapp für Selbstumsetzung",
        "2 · zweiter Hebel",
        "3 · dritter Hebel"
      ],
      "foerder": "Ein Absatz zur Förderfähigkeit: BAFA bis 3.500 €, INQA-Coaching bis 80 %.",
      "naechsterSchritt": "Gesprächseinladung, 1 bis 2 Sätze.",
      "kontakt": "Clemens Gutmann  ·  clemens@nice-network.de"
    }
  }
}`;
}

export default async function handler(req) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders });
  if (req.method !== 'POST') return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const firecrawlKey = process.env.FIRECRAWL_API_KEY;

  if (!anthropicKey) return new Response(JSON.stringify({ error: 'ANTHROPIC_API_KEY nicht gesetzt' }), {
    status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
  if (!firecrawlKey) return new Response(JSON.stringify({ error: 'FIRECRAWL_API_KEY nicht gesetzt' }), {
    status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

  const { url, competitorData = [], extraMeta = {}, sistrixMain = null } = await req.json();
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
      sistrixMain ? Promise.resolve(sistrixMain)
        : sistrixKey ? fetchSistrix(domain, sistrixKey)
        : Promise.resolve(null),
    ]);
    if (crawl.status === 'rejected') throw new Error(crawl.reason?.message || 'Crawling fehlgeschlagen');
    crawlResult = crawl.value;
    if (sist.status === 'fulfilled') sistrix = sist.value;
  } catch (e) {
    return new Response(JSON.stringify({ error: `Crawling fehlgeschlagen: ${e.message}` }), {
      status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const prompt = buildDossierPrompt(targetUrl, crawlResult, sistrix, competitorData, extraMeta);

  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': anthropicKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 32000,
      stream: true,
      system: 'Du antwortest ausschließlich mit einem einzigen validen JSON-Objekt. Kein Text davor, kein Text danach, keine Markdown-Codeblöcke, keine Erklärungen. Nur das JSON-Objekt selbst.',
      messages: [
        { role: 'user', content: prompt },
      ],
    }),
  });

  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    return new Response(JSON.stringify({ error: `Claude Fehler: ${err.error?.message || r.status}` }), {
      status: r.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(r.body, {
    status: 200,
    headers: {
      ...corsHeaders,
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
    },
  });
}
