# Projektstatus: mandatsstart-unified-analyst
*Zuletzt aktualisiert: 10.06.2026 (Commit 5aced75)*

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
Beide Dokumente: **MD** + **PDF** (Browser-Druckdialog) + **Word (.docx)**
Außerdem: In Zwischenablage kopieren, Blob-Speicherung mit Share-Link, localStorage-History

---

## Tech-Stack

- **Frontend:** React 18 + Vite → `/frontend/src/`
- **Backend:** Node.js Serverless Functions (Vercel) → `/api/`
- **KI:** `claude-sonnet-4-6` (Anthropic API, SSE-Streaming, max_tokens: 64000)
- **SEO-Daten:** SISTRIX API
- **Crawling:** Firecrawl API
- **Speicherung:** Vercel Blob (private store)
- **Word-Export:** `docx` npm package + `jspdf` (installiert, derzeit nicht aktiv genutzt)
- **Styling:** be-nice CI (G=#8CC63E, DG=#454544, T=#33AB97, BT=#13A1B6, Calibri)

---

## Wichtige Architektur-Entscheidung: Two-Call-Pattern

**Grund:** Beide API-Endpoints (`analyst.js`, `briefing.js`) nutzen **zwei sequenzielle Claude-Calls**, die als ein kontinuierlicher SSE-Stream an den Client weitergeleitet werden:

- `analyst.js`: Call 1 → Kapitel 1+2 | Call 2 → Kapitel 3 (mit Kap 1+2 als Kontext)
- `briefing.js`: Call 1 → Abschnitte 1+2 | Call 2 → Abschnitte 3-5 (mit Teil 1 als Kontext)

Der Client merkt nichts davon — der Stream läuft durch. Teil 1 wird gebuffert und als Kontext an Call 2 übergeben.
`max_tokens: 64000` pro Call (volles Limit von claude-sonnet-4-6).

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
  save-result.js    — Speichert Ergebnis in Vercel Blob (inkl. briefing-Feld)
  load-result.js    — Lädt Ergebnis aus Vercel Blob (via ?r=ID)

frontend/src/
  App.jsx           — Minimaler Wrapper: Header + <Analyst /> (kein Tab-Selektor mehr)
  Analyst.jsx       — Hauptkomponente: Input-Card + SISTRIX-Charts + 2 Dokument-Karten
  ExternalIntelligence.jsx — SISTRIX-Visualisierungen (unverändert)
  PrintExport.js    — exportToPDF() (Browser-Print) + exportToWord() (docx-Package)

frontend/
  package.json      — Dependencies inkl. docx ^8.5.0, jspdf ^2.5.2
  public/logo.png   — be-nice Logo (1759×955px RGBA) — eingebettet in PDF + Word
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

## Bekannte offene Punkte / nächste Aufgaben

1. **Texte noch abgeschnitten?** — max_tokens auf 64000 erhöht (Commit `bf0438a`), aber noch nicht live bestätigt dass alle 3 Kapitel / 5 Abschnitte vollständig sind. **Priorität: als erstes testen.**

2. **PDF-Footer** — Browser zeigt jetzt App-URL statt `about:blank` (via `history.replaceState`). Entscheiden: App-URL im Footer akzeptieren, oder einmalig „Kopf- und Fußzeilen" im Druckdialog deaktivieren (Chrome merkt sich das pro Domain).

3. **PDF-Qualität allgemein** — be-nice CI angewendet (H2 türkis, Logo im Kopf). Noch nicht live getestet ob Layout jetzt passt. Ggf. weitere Anpassungen nötig.

4. **Word-Export (.docx)** — be-nice CI angewendet: Logo im Header, H1 size 40/border 40, Titelblock size 48, Footer „Seite N / M", Tabellen FIXED-Layout. Noch nicht live bestätigt.

5. **docx TOC Links** — InternalHyperlink + Bookmark auf Überschriften eingebaut. Noch nicht live getestet ob Links im Word-Dokument funktionieren.

6. **GH_TOKEN / Claude Code Auth-Banner** — `~/.zprofile` liest Token aus macOS Keychain: `export GH_TOKEN=$(security find-internet-password -s github.com -a Clemadeus68 -w 2>/dev/null)`. Nach Shell-Neustart wirksam.

---

## be-nice CI — wichtigste Werte für Dokument-Export

| Element | Wert |
|---|---|
| Grün | `#8CC63E` / `8CC63E` |
| Dunkelgrau | `#454544` / `454544` |
| Türkis | `#33AB97` / `33AB97` |
| Blau-Türkis | `#13A1B6` / `13A1B6` |
| Hellgrau | `#E9E9E9` / `E9E9E9` |
| Mittelgrau | `#777777` / `777777` |
| Schrift | Calibri durchgehend |
| H1 (Word) | size 40, border-bottom grün size 40 |
| H2 (Word) | size 24, Türkis |
| H2 (PDF) | color #33AB97 |
| Titelblock (Word) | size 48 |
| Logo | `frontend/public/logo.png`, 1759×955px |

---

## Prozessregel

**Immer vor einem Push nach Genehmigung fragen.** Nicht einfach pushen.

---

## Commit-History (letzte 10)

```
5aced75 revert: PDF zurück zu Browser-Print; about:blank via history.replaceState gefixt
bf0438a fix: max_tokens 32000→64000 (volles Limit von claude-sonnet-4-6)
b0b1ff6 fix: be-nice CI in PDF und Word durchsetzen
9208f57 feat: PDF via jsPDF (kein about:blank), docx TOC-Links, Tabellenbreite
9006195 fix: upgrade model to claude-sonnet-4-6 (64k output limit)
8cc0319 chore: STATUS.md offene Punkte aktualisiert
93940a4 feat: Word-Export mit Header/Footer/Seitenzahlen; briefing in Save/Load; PDF-Verbesserungen
9587d86 fix: max_tokens 8000→16000 (claude-sonnet-4-5 native limit)
```
