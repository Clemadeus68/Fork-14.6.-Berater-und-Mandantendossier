export const PROMPTS = {
  markt: (d) => `Du analysierst den Markt für ${d.name}, tätig in der Branche ${d.branche} mit Fokus auf ${d.produkt}.

MARKTGRÖSSE UND ENTWICKLUNG
- Aktuelles Marktvolumen (Deutschland / DACH / Europa)
- Wachstumsrate der letzten drei Jahre, Prognose für die nächsten drei Jahre
- Wesentliche Wachstumstreiber oder Rückgangsfaktoren

WETTBEWERBSLANDSCHAFT
- Drei bis fünf relevante Wettbewerber mit Kurzprofil ihrer Positionierung
- Marktanteile (sofern verfügbar oder schätzbar)
- Aktuelle Wettbewerbsdynamiken: Preiskampf, Differenzierung oder Konsolidierung

KUNDENSEITIGE TRENDS
- Veränderte Erwartungen und Kaufverhalten der Zielgruppen
- Technologische oder gesellschaftliche Verschiebungen mit Marktrelevanz

REGULATORISCHES UMFELD
- Aktuelle oder kommende gesetzliche Anforderungen
- Relevante Förderprogramme oder politische Initiativen

ABSCHLUSS
Drei strategische Implikationen für ein Unternehmen in diesem Markt, formuliert als handlungsorientierte Sätze.

Schreibe die Ergebnisse als strukturierten Bericht.`,

  branch: (d) => `Analysiere die Branche ${d.branche} aus der Perspektive eines Unternehmensberaters, der einen mittelständischen Betrieb berät. Fokus: ${d.produkt}.

BRANCHENSTRUKTUR
- Typische Wertschöpfungskette und kritische Stufen
- Konzentrationsgrad (fragmentiert vs. oligopolistisch)
- Eintrittsbarrieren für neue Marktteilnehmer

TRENDS UND DISRUPTION
- Drei bis fünf wesentliche Trends der nächsten fünf Jahre
- Technologische Disruption: Wo verändert sich das Geschäftsmodell grundlegend?
- Nachhaltigkeits- und Regulierungsanforderungen mit Branchenspezifik

BENCHMARKS UND KENNZAHLEN
- Typische Margen, Wachstumsraten und Kapitalintensität
- Kritische Erfolgsfaktoren

STRATEGISCHE HERAUSFORDERUNGEN
Die drei wichtigsten strategischen Herausforderungen für etablierte Mittelständler in dieser Branche, konkret und handlungsorientiert formuliert.

Schreibe die Ergebnisse als strukturierten Bericht.`,

  web: (d) => `Analysiere die Website ${d.url} des Unternehmens ${d.name} (Branche: ${d.branche}).

Analysiere Positionierung, Zielgruppen, USP und Kommunikationsklarheit auf Basis der URL und deines Wissens über das Unternehmen.

POSITIONIERUNG
- Welches Leistungsversprechen wird typischerweise kommuniziert?
- Ist die Positionierung klar und konsistent?
- Welche Kernbotschaft bleibt nach dem ersten Besuch?

ZIELGRUPPEN
- Wen spricht das Unternehmen explizit und implizit an?
- Welche Zielgruppen werden möglicherweise vernachlässigt?

USP UND DIFFERENZIERUNG
- Was unterscheidet das Unternehmen vom Wettbewerb?
- Ist der USP klar formuliert?

KOMMUNIKATIONSKLARHEIT
- Versteht ein Erstbesucher in 10 Sekunden das Angebot?
- Gibt es einen klaren Call-to-Action?

LÜCKEN UND OPTIMIERUNGSPOTENZIAL
- Was fehlt im Vergleich zu Best Practice in der Branche ${d.branche}?

ABSCHLUSS
Fünf prägnante Beobachtungen für das Erstgespräch als offene Hypothesen.

Schreibe die Ergebnisse als strukturierten Bericht.`,

  synthese: (d, r1, r2, r3) => `Du hast drei Analysen als Grundlage für das Unternehmen ${d.name} (${d.branche}):

=== MARKTANALYSE ===
${r1 || "(nicht ausgeführt)"}

=== BRANCHENANALYSE ===
${r2 || "(nicht ausgeführt)"}

=== WEBSEITENANALYSE ===
${r3 || "(nicht ausgeführt)"}

SCHRITT A — SYNTHESE
Leite aus der Kombination der Perspektiven die wahrscheinlichen Problemfelder ab:

KURZFRISTIGE PROBLEMFELDER (0–12 Monate)
- Akuter Handlungsbedarf
- Symptome, die beim Mandanten sichtbar sein dürften
- Belege aus den Analysen

MITTELFRISTIGE PROBLEMFELDER (1–3 Jahre)
- Strategische Lücken
- Markt- oder Wettbewerbsveränderungen ohne Reaktion

LANGFRISTIGE PROBLEMFELDER (3–7 Jahre)
- Strukturelle Herausforderungen
- Disruptionspotenziale

HYPOTHESEN FÜR DAS ERSTGESPRÄCH
Die drei wichtigsten offenen Fragen zur Validierung.

SCHRITT B — ERGEBNISDOKUMENT
Erstelle ein vollständiges Markdown-Dokument:

# Mandatsstart-Analyse: ${d.name}
## Erstellt am: ${new Date().toLocaleDateString("de-DE")}

---
## 1. Marktanalyse
${r1 || "(nicht ausgeführt)"}

---
## 2. Branchenanalyse
${r2 || "(nicht ausgeführt)"}

---
## 3. Webseitenanalyse
${r3 || "(nicht ausgeführt)"}

---
## 4. Synthese: Wahrscheinliche Problemfelder
[Vollständige Synthese aus Schritt A]

---
## 5. Hypothesen für das Erstgespräch
[Die drei Leitfragen]

Schreibe vollständig und ohne Kürzungen.`,

  kontextkern: (d, docs) => {
    const basis = `Klient: ${d.name} | Branche: ${d.branche} | URL: ${d.url} | Produkt/DL: ${d.produkt}${d.personen ? " | Schlüsselpersonen: " + d.personen : ""}${d.notizen ? " | Ersteindrücke: " + d.notizen : ""}`;
    const anweisung = `\n\nErstelle einen Kontextkern für ein Claude-Projekt. Decke die zehn Bausteine ab: Rolle Claude im Projekt, Klient, Schlüsselpersonen, Beratungsauftrag, Zeitrahmen, Sprache gegenüber dem Klienten, Format-Präferenz, inhaltliche Tabus, methodische Tabus, Wissensbasis-Verweise. Leite fehlende Details aus dem Branchenkontext ab.\n\nLiefere:\n(1) Kontextkern max. 300 Wörter, gegliedert nach WER · FÜR WEN · WIE · WAS NICHT, Briefing-Ton\n(2) Liste empfohlener Begleitdokumente mit Dateinamen und Inhaltsskizze\n\nWas mehr als 2–3 Sätze braucht, lagere in eine eigene Datei aus und referenziere darauf.`;
    if (docs) return `Mandatsdokumente:\n${docs}\n\n${basis}${anweisung}`;
    return basis + anweisung;
  }
};
