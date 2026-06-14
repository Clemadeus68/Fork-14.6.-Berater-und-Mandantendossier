---
name: be-nice-ci
description: Erzeugt Word-Dokumente (.docx) und PowerPoint-Präsentationen (.pptx) im Corporate Design von be nice network (Clemens Gutmann, Organisationsberatung) und liefert Texte in seiner Schreibstimme. Nutze diesen Skill immer, wenn ein Briefing, Angebot, Beratungsunterlage, Konzept, Protokoll, Fachartikel, eine Präsentation oder ein Foliendeck für be nice, nice-network, Clemens Gutmann oder dessen KMU-Klienten entstehen soll – auch wenn „be nice", „CI" oder „Corporate Design" nicht ausdrücklich genannt werden. Greift ebenso, wenn nach den be-nice-Farben, der Hausschrift Calibri, dem Logo-Header/Footer oder der Tonalität gefragt wird.
---

# be nice network — Corporate Identity

Verbindliches Design- und Sprachsystem für alle Dokumente, die Clemens Gutmann im Rahmen seiner Beratung erstellt. Der Skill deckt drei Dinge ab: die **Schreibstimme** (wie Texte klingen), die **Dokument-Optik** (Word) und die **Präsentations-Optik** (PowerPoint/Google Slides).

Das Grundprinzip über allem: **Das Grün ist die Linie, die alles zusammenhält** — in Word als H1-Unterstrich, in PowerPoint als Balken unter dem Header und als Akzentstreifen links. Der Rest bleibt zurückhaltend: viel Weiß, klare Hierarchie, Farbe nur als Signal, nie als Dekoration.

## Farbpalette (Kurzreferenz)

| Name | Hex | Verwendung |
|---|---|---|
| GRÜN | `8CC63E` | Hauptmarke: H1-Unterstrich, Akzentlinien, Bullets, CTA |
| DUNKELGRAU | `454544` | Headlines, Titel, Hauptschrift |
| TÜRKIS | `33AB97` | H2, Zwischenüberschriften, Akzent-Boxen |
| BLAU-TÜRKIS | `13A1B6` | Links, E-Mail, sekundäre Akzente |
| HELLGRAU | `E9E9E9` | Header-Hintergrund, Info-Boxen, Trennlinien |
| WEISS | `FFFFFF` | Textflächen, Slide-Hintergrund |
| FAST-SCHWARZ | `111111` | Fließtext |
| MITTELGRAU | `777777` | Metazeilen, Captions, Datum, URL im Header |

Hausschrift durchgehend **Calibri** (Google-Slides-Fallback: Montserrat für Überschriften, Open Sans für Fließtext).

---

## Schreibstimme

Diese Regeln gelten für alle Texte, die der Skill für be nice formuliert — egal ob Word, Folie oder einfache Chat-Antwort.

Schreibe, als säße Clemens Gutmann mit einem klugen Menschen an einem Tisch: erzählerisch, warm, präzise. **Erst Bild, dann Begriff. Erst Mensch, dann Mechanismus.** Der Leser soll nicht denken „das ist fachlich richtig", sondern „der versteht, wie sich das anfühlt".

Konkret:
- Keine Bulletprosa als Ersatz für Gedanken, keine symmetrischen Dreiermuster.
- Keine Corporate-Sprache, keine LinkedIn-Guru-Phrasen. Tabu sind Wendungen wie „ganzheitlicher Ansatz", „Mehrwert schaffen", „maßgeschneiderte Lösungen".
- Kurze Impulssätze wechseln mit fließenden Sätzen.
- Metaphern aus Natur, Sport, Geschichte oder Wissenschaft — sparsam und natürlich, nie geschmückt.
- Zielgruppe ist der Mittelstand (KMU, DACH). Hol den Leser bei seiner realen Situation ab (der Handwerksbetrieb, das Autohaus, der Dienstleger, bei dem alle Kundenbeziehungen an einem Kopf hängen), nicht bei einer Methodenbeschreibung.

> Hinweis: Diese Sprachregeln sind aus früherer Zusammenarbeit abgeleitet und bewusst knapp gehalten. Sie dürfen jederzeit verfeinert werden — die Datei `SKILL.md` lässt sich direkt erweitern.

---

## Word-Dokumente (.docx)

Vorlage: `scripts/word_template.js` (Bibliothek `docx`, npm). Das Skript ist eine fertige, CI-konforme Vorlage mit Header (Logo + URL + grüne Linie), Titelblock, Hilfsfunktionen für Überschriften, Info- und Akzentboxen sowie Footer mit Seitenzahl.

**So erzeugst du ein Dokument:**
1. `scripts/word_template.js` in den Arbeitsordner kopieren.
2. `npm install docx` im Arbeitsordner ausführen.
3. Das Logo muss erreichbar sein. Standardmäßig sucht das Skript es relativ unter `../assets/be-nice.png`. Wird das Skript aus dem Skill heraus an einen anderen Ort kopiert, setze die Umgebungsvariable `BENICE_LOGOS` auf den absoluten Pfad des `assets/`-Ordners dieses Skills (oder passe die `LOGOS`-Konstante oben im Skript an).
4. Den Block `META` (Titel, Untertitel, Datum, Autor, Ausgabedateiname) und das Array `inhalt` mit dem gewünschten Inhalt füllen.
5. `node word_template.js` ausführen.

**Verfügbare Bausteine im Array `inhalt`:**
- `h1("…")` — Abschnittsüberschrift, dunkelgrau, mit grünem Unterstrich (40 half-pt).
- `h2("…")` — Zwischenüberschrift in Türkis (24 half-pt).
- `txt("…", opts)` — Fließtext (20 half-pt). `opts` z. B. `{ bold: true }` oder `{ italics: true }`.
- `infoBox("Label", "Inhalt")` — zweispaltige Box: grünes Label links, hellgrauer Inhalt rechts.
- `accentBox("…")` — einspaltige Box mit blau-türkisem linken Balken, heller Hintergrund, kursiv. Gut für einen einleitenden Kernsatz.
- `gap(größe)` — vertikaler Abstand.

Titelblock (48 half-pt Titel, 28 Untertitel, 18 Metazeile) und der Schluss-CTA in Grün mit Mail-Link sind im Template als Muster bereits vorhanden — anpassen statt neu erfinden.

---

## Präsentationen (.pptx)

Vorlage: `scripts/pptx_template.py` (Bibliothek `python-pptx`, Format 16:9 Widescreen, Google-Slides-kompatibel). Header, Footer, grüner Akzentstreifen und Seitenzahlen werden automatisch auf jede Folie gesetzt.

**So erzeugst du eine Präsentation:**
1. `scripts/pptx_template.py` in den Arbeitsordner kopieren.
2. `pip install python-pptx Pillow --break-system-packages` ausführen.
3. Logo-Pfad wie bei Word: standardmäßig `../assets/be-nice.png`, sonst `BENICE_LOGOS` setzen.
4. `META` und die Liste `slides_data` füllen.
5. `python3 pptx_template.py` ausführen.

**Folientypen (Tupelformat `("typ", feld1, feld2, [feld3])`):**
- `"title"` — Titelfolie, weiß. feld1 = Titel, feld2 = Untertitel, feld3 = `[Metazeile]`.
- `"section_divider"` — Kapiteltrennfolie, dunkelgrauer Hintergrund, Logo direkt darauf. feld1 = Nummer (`"01"`), feld2 = Kapitelüberschrift, feld3 = `[]`.
- `"content"` — Inhaltsfolie, weiß. feld1 = Folientitel, feld2 = `""`, feld3 = `[Bullets]`. Bullets bekommen grüne Punkt-Quadrate.
- `"quote"` — Zitatfolie, türkiser Hintergrund. feld1 = `""`, feld2 = Zitattext, feld3 = `[]`.

---

## Logos

`assets/be-nice.png` ist das Hauptlogo (Header in Word und PowerPoint) und immer aktiv. Seitenverhältnis 1.842 : 1.

Die drei **Footer-Logos** (Alchimedus Consulting Network, Master Certificate, INQA-Coach-Badge) sind in beiden Templates standardmäßig **auskommentiert**. Sollen sie erscheinen, müssen die Dateien in `assets/` abgelegt und die entsprechenden Zeilen im Template aktiviert werden (`FOOTER_LOGOS` in der PPTX-Vorlage, `activeLogoColumns` in der Word-Vorlage). Spaltenbreiten im Word-Footer summieren sich auf 9638 DXA.

---

## Vollständige Spezifikation

`references/be-nice-CI-Dokumentvorlagen.md` enthält die erschöpfenden Maße: alle Schriftgrößen in half-points bzw. pt, DXA-Werte für Seitenformat und Spaltenbreiten, exakte Border-Stärken, Zonenhöhen der Folien, Logo-Ratios und das Pillow-Snippet zur PNG-Konvertierung. Bei Detailfragen zu Abständen, Größen oder Farben dort nachschlagen, statt zu raten.
