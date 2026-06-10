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
Erstelle TEIL 1 des Akquise-Briefings für ${name} (${today}).

KOMPAKTFORMAT — PFLICHT: Stichpunkte statt Fließtext. Je Defizit max. 5 Zeilen. Je INQA-Thema max. 4 Bullets. Keine Einleitungssätze.

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

5 Defizite, je als kompakten Block:
**Defizit N: [Titel]**
- Befund: [1 Satz, konkret]
- Ursache: [1 Satz]
- Schmerz: [1 Satz in Mandantensprache]
- Kap.-Ref.: [z.B. Kap. 1.2]

---

## 2. INQA-Anknüpfungspunkte

Für jedes Themenfeld 3 Bullets: Relevanz | Anknüpfung | Projektidee

**Themenfeld 1: Unternehmenskultur & Führung**
**Themenfeld 2: Personal & Kompetenz**
**Themenfeld 3: Digitalisierung & Innovation**

INQA-Gesamteignung: [sehr gut/gut/bedingt/gering] — 1 Satz Begründung.`;

  const promptPart2 = (part1Text) => `${systemContext}

---
Du hast soeben Teil 1 des Akquise-Briefings geschrieben. Abschluss:

${part1Text.slice(-3000)}

---
Schreibe jetzt TEIL 2 (Abschnitte 3–5). KOMPAKTFORMAT: Stichpunkte, kein Fließtext.

## 3. Beratungsleistungen — konkrete Ansatzpunkte

**Kurzfristig (Erstgespräch):** 3 Bullets: Leistung + Warum jetzt (je 1 Satz)
**Mittelfristiges Projekt:** 3 Bullets: Hypothese | Umfang | Partner nötig?
**BAFA-Erstberatung:** Ja/Nein/Prüfen + 1 Satz Begründung

---

## 4. Gesprächsstrategie & Einstieg

**Hauptthema Erstgespräch:** 1 Satz.
**3 Einstiegsfragen:** Nummeriert, je Frage + 1 Satz erwartete Reaktion.
**3 Hypothesen zum Überprüfen:** 3 Bullets.
**Nicht ansprechen (noch nicht):** 2 Bullets.

---

## 5. Risikoeinschätzung & Qualifizierung

**Mandantenattraktivität:** Ja/Bedingt/Nein — 1 Satz.
**Erstauftragswahrscheinlichkeit:** hoch/mittel/niedrig — 1 Satz.
**2 mögliche Einwände + meine Antwort auf den stärksten:** 3 Bullets.
**Nächste Schritte nach Erstgespräch:** 2 Bullets.`;

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
