export const config = { runtime: 'edge' };

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
  if (!anthropicKey) return new Response(JSON.stringify({ error: 'ANTHROPIC_API_KEY nicht gesetzt' }), {
    status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

  const { strategieanalyse, companyName, url } = await req.json();
  if (!strategieanalyse) return new Response(JSON.stringify({ error: 'strategieanalyse fehlt' }), {
    status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

  const today = new Date().toLocaleDateString('de-DE');
  const name = companyName || url || 'Mandant';

  // Shared context block (truncated to keep prompt short)
  const analyseContext = strategieanalyse.slice(0, 14000);

  const systemContext = `Du bist Clemens Gutmann, Organisations- und Strategieberater (be nice Managementberatung).
INQA-zertifiziert in: Unternehmenskultur & Führung | Personal & Kompetenz | Digitalisierung & Innovation.
Das Briefing ist vertraulich, nur für dich. Sei direkt, pointiert, ehrlich. Kein Consulting-Sprech.
Basis-Analyse:\n${analyseContext}`;

  const prompt = `${systemContext}

---
Erstelle das vollständige Akquise-Briefing für ${name} (${today}). Alle 5 Abschnitte in einem Durchgang.

# Akquise-Briefing: ${name}
*Erstellt am: ${today} — vertraulich für Clemens Gutmann*

---

## Inhaltsverzeichnis
- [1. Kerndefizite — priorisiert](#1-kerndefizite--priorisiert)
- [2. INQA-Anknüpfungspunkte](#2-inqa-anknüpfungspunkte)
- [3. Beratungsleistungen — konkrete Ansatzpunkte](#3-beratungsleistungen--konkrete-ansatzpunkte)
- [4. Gesprächsstrategie & Einstieg](#4-gesprächsstrategie--einstieg)
- [5. Risikoeinschätzung & Qualifizierung](#5-risikoeinschätzung--qualifizierung)

---

## 1. Kerndefizite — priorisiert

Schreibe **5 Defizite**, jeweils mit:
- **Bezeichnung** (prägnanter Titel)
- **Befund:** Was genau ist das Problem? Konkret, direkt, Zahlen wenn vorhanden.
- **Sichtbar in der Analyse:** Kapitelreferenz (z.B. Kap. 1.2)
- **Wahrscheinliche Ursache:** Führung? Strategie? Ressourcen? Wissen? Ehrliche Einschätzung.
- **Schmerz für den Mandanten:** Wie fühlt sich das für die Geschäftsführung an — in ihrer eigenen Sprache.

Priorisierung: dringendste Defizite zuerst.

---

## 2. INQA-Anknüpfungspunkte

Für jedes der drei INQA-Themenfelder:
- **Relevanz:** hoch / mittel / niedrig
- **Konkrete Anknüpfung:** Was zeigt die Analyse, das auf dieses Defizit hinweist?
- **Mögliche INQA-Projektidee:** Konkrete Maßnahme, die ich anbieten könnte.

**Themenfeld 1: Unternehmenskultur & Führung**
**Themenfeld 2: Personal & Kompetenz**
**Themenfeld 3: Digitalisierung & Innovation**

Am Ende: **INQA-Gesamteignung** (sehr gut / gut / bedingt / gering) mit Begründung.

---

## 3. Beratungsleistungen — konkrete Ansatzpunkte

**Kurzfristig anbieten (Erstgespräch/Quick Wins):**
3 konkrete Leistungen mit Begründung, warum genau jetzt.

**Mittelfristiges Projekt (3–12 Monate):**
- Projekthypothese: Was wäre ein realistisches Beratungsprojekt?
- Umfang (grob): Tage/Monate
- Partnerleistungen nötig? (Tech, Recht, Tools, Schulungen)

**BAFA-Erstberatung:**
- Passt das Unternehmen? Ja / Nein / Prüfen
- Begründung

---

## 4. Gesprächsstrategie & Einstieg

**Mein Hauptthema fürs Erstgespräch:**
Das eine Thema, das ich als Einstieg wählen würde — und warum.

**Die 3 besten Einstiegsfragen:**
Für jede Frage: Formulierung + erwartete Reaktion / was ich damit auslösen will.

**Hypothesen, die ich überprüfen will:** (3 Stück)

**Was ich NICHT ansprechen sollte (noch nicht):**
Was wäre zu früh, zu sensibel, oder könnte den Mandanten abschrecken?

---

## 5. Risikoeinschätzung & Qualifizierung

**Ist das ein attraktiver Mandant für be nice?** Ja / Bedingt / Nein — Begründung.

**Wahrscheinlichkeit eines Erstauftrags:** hoch / mittel / niedrig

**Mögliche Einwände des Mandanten:** (2 konkrete)

**Meine Antwort auf den wichtigsten Einwand:**

**Nächste Schritte nach dem Erstgespräch:** (2 Schritte)`;

  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': anthropicKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 64000,
      stream: true,
      messages: [{ role: 'user', content: prompt }],
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
