// Node.js runtime — extended output + long timeout
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

  const prompt = `Du bist Clemens Gutmann, Organisations- und Strategieberater (be nice Managementberatung).

Du hast soeben die folgende Strategieanalyse erstellt:

${strategieanalyse.slice(0, 18000)}

---

Erstelle jetzt ein kompaktes AKQUISE-BRIEFING für dich selbst — zur Vorbereitung des Erstgesprächs mit diesem Unternehmen.

Das Briefing ist vertraulich, für dich als Berater. Sei direkt, pointiert, ehrlich — auch kritisch gegenüber dem Unternehmen. Kein Blatt vor den Mund.

Hintergrund zu deinen Themenfeldern als INQA-zertifizierter Berater:
- **Unternehmenskultur & Führung**: Führungsdefizite, Kulturprobleme, Digitalisierungshemmnisse durch fehlende Leadership-Kompetenz
- **Personal & Kompetenz**: Fachkräftemangel, Kompetenzlücken, HR-Probleme, Weiterbildungsbedarfe
- **Digitalisierung & Innovation**: KI-Einführung, digitale Transformation, Prozessdigitalisierung, compliante KI-Nutzung, fehlende Digitalstrategie

BAFA-Förderung ist für Erstberatungen relevant (bis 3.000 EUR Zuschuss).

---

# Akquise-Briefing: ${companyName || url}
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

Die 5 drängendsten Defizite, geordnet nach Dringlichkeit und Beratungsrelevanz.
Für jedes Defizit: Kurze Beschreibung + Kapitelreferenz aus der Strategieanalyse.

### Defizit 1 — [Bezeichnung]
**Befund:** [Was genau ist das Problem?]
**Sichtbar in der Analyse:** [Kapitel X.X]
**Wahrscheinliche Ursache:** [Führung? Strategie? Ressourcen? Wissen?]
**Schmerz für den Mandanten:** [Wie fühlt sich das für die Geschäftsführung an?]

### Defizit 2 — [Bezeichnung]
**Befund:**
**Sichtbar in der Analyse:**
**Wahrscheinliche Ursache:**
**Schmerz für den Mandanten:**

### Defizit 3 — [Bezeichnung]
**Befund:**
**Sichtbar in der Analyse:**
**Wahrscheinliche Ursache:**
**Schmerz für den Mandanten:**

### Defizit 4 — [Bezeichnung]
**Befund:**
**Sichtbar in der Analyse:**
**Wahrscheinliche Ursache:**
**Schmerz für den Mandanten:**

### Defizit 5 — [Bezeichnung]
**Befund:**
**Sichtbar in der Analyse:**
**Wahrscheinliche Ursache:**
**Schmerz für den Mandanten:**

---

## 2. INQA-Anknüpfungspunkte

Wo passen meine INQA-Themenfelder konkret zu den Defiziten dieses Unternehmens?

### Unternehmenskultur & Führung
**Relevanz für diesen Mandanten:** [hoch / mittel / niedrig]
**Konkrete Anknüpfung:**
[Was zeigt die Analyse, das auf Kultur- oder Führungsdefizite hindeutet?]
**Mögliche INQA-Projektidee:**

### Personal & Kompetenz
**Relevanz für diesen Mandanten:** [hoch / mittel / niedrig]
**Konkrete Anknüpfung:**
**Mögliche INQA-Projektidee:**

### Digitalisierung & Innovation
**Relevanz für diesen Mandanten:** [hoch / mittel / niedrig]
**Konkrete Anknüpfung:**
[Besonders: KI-Einführung, digitale Sichtbarkeit, Strategie]
**Mögliche INQA-Projektidee:**

**INQA-Gesamteignung:** [sehr gut / gut / bedingt / gering] — Begründung:

---

## 3. Beratungsleistungen — konkrete Ansatzpunkte

Was kann ich diesem Unternehmen konkret anbieten? Realistisch, priorisiert.

### Kurzfristig anbieten (Erstgespräch/Quick Wins):
1. **[Leistung]** — [warum genau jetzt, was bringt es?]
2. **[Leistung]** — ...
3. **[Leistung]** — ...

### Mittelfristiges Projekt (3–12 Monate):
**Projekthypothese:** [Was wäre ein realistisches Beratungsprojekt?]
**Umfang (grob):** [Tage/Monate]
**Partnerleistungen nötig?** [Tech, Recht, Toolauswahl, Schulungen — wen würde ich einbinden?]

### BAFA-Erstberatung:
**Passt das Unternehmen?** [Ja / Nein / Prüfen]
**Begründung:**

---

## 4. Gesprächsstrategie & Einstieg

### Mein Hauptthema fürs Erstgespräch:
[Das eine Thema, das ich als Einstieg wählen würde — und warum]

### Die 3 besten Einstiegsfragen:
1. [Frage — erwartete Reaktion / was ich damit auslösen will]
2. [Frage — ...]
3. [Frage — ...]

### Hypothesen, die ich überprüfen will:
1.
2.
3.

### Was ich NICHT ansprechen sollte (noch nicht):
[Was wäre zu früh, zu sensibel, oder könnte den Mandanten abschrecken?]

---

## 5. Risikoeinschätzung & Qualifizierung

**Ist das ein attraktiver Mandant für be nice?** [Ja / Bedingt / Nein] — Begründung:

**Wahrscheinlichkeit eines Erstauftrags:** [hoch / mittel / niedrig]

**Mögliche Einwände des Mandanten:**
-
-

**Meine Antwort auf den wichtigsten Einwand:**

**Nächste Schritte nach dem Erstgespräch:**
1.
2.

---

Fülle alle Abschnitte vollständig aus. Sei konkret und pointiert — kein generisches Consulting-Sprech.`;

  try {
    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'output-128k-2025-02-19',
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
      return res.status(anthropicResponse.status).json({ error: `Claude Fehler: ${err.error?.message || anthropicResponse.status}` });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');

    const reader = anthropicResponse.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(decoder.decode(value, { stream: true }));
    }
    res.end();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
