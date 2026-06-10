// Node.js runtime — two sequential Claude calls to stay within 8192 token limit
export const maxDuration = 300;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY nicht gesetzt' });

  const { strategieanalyse, companyName, url } = req.body;
  if (!strategieanalyse) return res.status(400).json({ error: 'strategieanalyse fehlt' });

  const today = new Date().toLocaleDateString('de-DE');
  const name = companyName || url || 'Mandant';

  // Shared context block (truncated to keep prompt short)
  const analyseContext = strategieanalyse.slice(0, 14000);

  const systemContext = `Du bist Clemens Gutmann, Organisations- und Strategieberater (be nice Managementberatung).
INQA-zertifiziert in: Unternehmenskultur & Führung | Personal & Kompetenz | Digitalisierung & Innovation.
Das Briefing ist vertraulich, nur für dich. Sei direkt, pointiert, ehrlich. Kein Consulting-Sprech.
Basis-Analyse:\n${analyseContext}`;

  const promptPart1 = `${systemContext}

---
Erstelle TEIL 1 des Akquise-Briefings für ${name} (${today}):

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

Am Ende: **INQA-Gesamteignung** (sehr gut / gut / bedingt / gering) mit Begründung.`;

  const promptPart2 = (part1Text) => `${systemContext}

---
Du hast soeben Teil 1 des Akquise-Briefings geschrieben. Hier ist er:

${part1Text.slice(-4000)}

---
Schreibe jetzt TEIL 2 (Abschnitte 3–5) vollständig:

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
        model: 'claude-sonnet-4-6',
        max_tokens: 64000,
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
    let sseBuffer = '';
    let collected = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      res.write(chunk);
      if (bufferOutput) {
        sseBuffer += chunk;
        const lines = sseBuffer.split('\n');
        sseBuffer = lines.pop();
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
    // Part 1: Abschnitte 1 + 2 (Kerndefizite + INQA)
    const part1Text = await streamClaude(promptPart1, true);

    // Part 2: Abschnitte 3 + 4 + 5 (with Part 1 as context)
    await streamClaude(promptPart2(part1Text), false);
  } catch (e) {
    res.write(`data: {"type":"error","error":{"message":"${e.message}"}}\n\n`);
  }

  res.end();
}
