// Node.js runtime — single Claude call, all 5 sections in one stream
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

  const prompt = `${systemContext}

---
Erstelle das vollständige Akquise-Briefing für ${name} (${today}). Alle 5 Abschnitte in einem Durchgang.

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

INQA-Gesamteignung: [sehr gut/gut/bedingt/gering] — 1 Satz Begründung.

---

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

  async function streamClaude(p) {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: anthropicHeaders,
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 64000,
        stream: true,
        messages: [{ role: 'user', content: p }],
      }),
    });
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      throw new Error(`Claude Fehler: ${err.error?.message || r.status}`);
    }
    const reader = r.body.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(decoder.decode(value, { stream: true }));
    }
  }

  try {
    await streamClaude(prompt);
  } catch (e) {
    res.write(`data: {"type":"error","error":{"message":"${e.message}"}}\n\n`);
  }

  res.end();
}
