# Projektstatus: mandatsstart-unified-analyst
*Zuletzt aktualisiert: 10.06.2026*

---

## Projekt-Übersicht

**Was ist das?**
Ein strategisches Analyse-Tool für Clemens Gutmann (be nice Managementberatung) zur Vorbereitung von Erstgesprächen mit potenziellen Mandanten. Eingabe: Website-URL. Ausgabe: zwei vollständige Dokumente.

**Live-URL:** https://mandatsstart-unified-analyst.vercel.app
**GitHub:** https://github.com/Clemadeus68/mandatsstart-unified-analyst
**Vercel-Projekt:** `clemadeus/mandatsstart-unified-analyst`
**Lokales Verzeichnis:** `/Users/clemensgutmann/Documents/Claude/Projects/Fork Strategietool 10.6./`

---

## Was das Tool macht

### Ablauf
1. User gibt URL ein (+ optional: Firmenname, Branche, Produkt)
2. Tool identifiziert Wettbewerber automatisch (`/api/competitors`)
3. SISTRIX-Daten werden geladen (`/api/sistrix`) — Sichtbarkeitsindex, Klicks, Keywords, Top-Seiten
4. Website wird gecrawlt + vollständige Strategieanalyse gestreamt (`/api/analyst`)
5. Nach Fertigstellung: Button zum Generieren des Akquise-Briefings (`/api/briefing`)

### Ausgabe: Dokument 1 — Vollständige Strategieanalyse
3 Kapitel:
- **Kapitel 1:** Unternehmen, Markt & Wettbewerb (1.1–1.8)
- **Kapitel 2:** Digitale Außensicht & SEO-Sichtbarkeit (2.1–2.4)
- **Kapitel 3:** Synthese & Gesprächsvorbereitung (3.1–3.3)

### Ausgabe: Dokument 2 — Akquise-Briefing (vertraulich für Clemens)
5 Abschnitte:
1. Kerndefizite priorisiert (5 Stück mit Befund/Ursache/Schmerz)
2. INQA-Anknüpfungspunkte (Unternehmenskultur, Personal & Kompetenz, Digitalisierung)
3. Beratungsleistungen & konkrete Ansatzpunkte
4. Gesprächsstrategie & Einstiegsfragen
5. Risikoeinschätzung & Qualifizierung

### Export
Beide Dokumente: **MD** + **PDF** (Print-Dialog) + **Word (.docx)**
Außerdem: In Zwischenablage kopieren, Blob-Speicherung mit Share-Link, localStorage-History

---

## Tech-Stack

- **Frontend:** React 18 + Vite → `/frontend/src/`
- **Backend:** Node.js Serverless Functions (Vercel) → `/api/`
- **KI:** Claude claude-sonnet-4-5 (Anthropic API, SSE-Streaming)
- **SEO-Daten:** SISTRIX API
- **Crawling:** Firecrawl API
- **Speicherung:** Vercel Blob (private store)
- **Word-Export:** `docx` npm package
- **Styling:** be-nice CI (G=#8CC63E, DG=#454544, T=#33AB97, BT=#13A1B6, Calibri)

---

## Wichtige Architektur-Entscheidung: Two-Call-Pattern

**Problem:** `claude-sonnet-4-5` hat ein hartes Output-Limit von 8192 Tokens.
**Lösung:** Beide API-Endpoints (`analyst.js`, `briefing.js`) nutzen **zwei sequenzielle Claude-Calls**, die als ein kontinuierlicher Stream an den Client weitergeleitet werden:

- `analyst.js`: Call 1 → Kapitel 1+2 | Call 2 → Kapitel 3 (mit Kap 1+2 als Kontext)
- `briefing.js`: Call 1 → Abschnitte 1+2 | Call 2 → Abschnitte 3-5 (mit Teil 1 als Kontext)

Der Client merkt nichts davon — der Stream läuft durch. Teil 1 wird gebuffert und als Kontext an Call 2 übergeben.

---

## Datei-Übersicht

```
api/
  analyst.js        — Haupt-Analyse-Endpoint (Node.js, maxDuration=300)
                      Two-Call: buildPromptPart1() + buildPromptPart2()
                      Crawl via Firecrawl + SISTRIX intern mitgeladen
  briefing.js       — Akquise-Briefing-Endpoint (Node.js, maxDuration=300)
                      Two-Call: promptPart1 + promptPart2()
                      Input: fertige Strategieanalyse als Text
  sistrix.js        — SISTRIX-Daten-Endpoint (Edge runtime)
                      Lädt Visibility + Traffic für Haupt-Domain + bis zu 9 Wettbewerber
  competitors.js    — Wettbewerber-Identifikation (Claude-basiert)
  save-result.js    — Speichert Ergebnis in Vercel Blob
  load-result.js    — Lädt Ergebnis aus Vercel Blob (via ?r=ID)

frontend/src/
  App.jsx           — Minimaler Wrapper: Header + <Analyst /> (kein Tab-Selektor mehr)
  Analyst.jsx       — Hauptkomponente: Input-Card + SISTRIX-Charts + 2 Dokument-Karten
  ExternalIntelligence.jsx — SISTRIX-Visualisierungen (unverändert)
  PrintExport.js    — exportToPDF() + exportToWord() (docx-Package)

frontend/
  package.json      — Dependencies inkl. docx ^8.5.0
```

---

## Environment Variables (Vercel Production)

| Variable | Zweck |
|---|---|
| `ANTHROPIC_API_KEY` | Claude API |
| `SISTRIX_API_KEY` | SISTRIX Sichtbarkeitsdaten |
| `FIRECRAWL_API_KEY` | Website-Crawling |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob für Save/Load |

**Achtung:** Groß-/Kleinschreibung ist wichtig. Alle vier müssen exakt so heißen.

---

## Bekannte offene Punkte / mögliche nächste Aufgaben

1. **Testen ob Two-Call-Output jetzt vollständig ist** — war der Stand beim letzten Test noch nicht abgeschlossen (letzter Commit `9587d86` hat max_tokens nochmals angepasst)
2. **PDF-Qualität** — Druckdialog mit Hinweis auf Kopf-/Fußzeilen deaktivieren; könnte noch verbessert werden
3. **Word-Export (.docx)** — noch nicht live getestet, nur Build-Test
4. **Save/Load** — funktioniert, aber Briefing wird beim Laden noch nicht mitgespeichert (nur `report`, nicht `briefing`)
5. **Ladezeit** — Two-Call-Analyse dauert ~2-4 Minuten; kein Timeout-Problem, aber UI-Feedback könnte detaillierter sein

---

## Prozessregel

**Immer vor einem Push nach Genehmigung fragen.** Nicht einfach pushen.

---

## Commit-History (letzte 10)

```
9587d86 fix: max_tokens 8000→16000 (claude-sonnet-4-5 native limit)
cb3ae27 UI/PDF fixes: title rename, TOC links, footer, briefing header  
1d8db46 fix: split briefing into two sequential Claude calls (8k tokens each)
ad866c7 fix: split analysis into two sequential Claude calls (8k tokens each)
5172316 fix: extend output tokens — beta header + 32k/16k limits
76392b7 fix: handle SISTRIX status:error (403), remove debug logging
c3cf364 Fix: switch analyst.js from Edge to Node.js runtime (maxDuration=300s)
64a6462 Unified 1-tab analyst: 3-chapter Strategieanalyse + Akquise-Briefing + Word export
```
