---
name: be-nice-ci
description: Erzeugt Word-Dokumente (.docx), PowerPoint-Präsentationen (.pptx) und Excel-Tabellen (.xlsx) im Corporate Design von be nice (Clemens Gutmann, Managementberatung) und liefert Texte in seiner Schreibstimme. Nutze diesen Skill immer, wenn ein Briefing, Angebot, Beratungsunterlage, Konzept, Protokoll, Fachartikel, eine Präsentation, ein Foliendeck oder eine formatierte Tabelle für be nice, nice-network.de, Clemens Gutmann oder dessen KMU-Klienten entstehen soll – auch wenn „be nice", „CI" oder „Corporate Design" nicht ausdrücklich genannt werden. Greift ebenso, wenn nach den be-nice-Farben, der Hausschrift Calibri, dem Logo-Header/Footer oder der Tonalität gefragt wird.
---

# be nice — Corporate Identity

Verbindliches Design- und Sprachsystem für alle Dokumente, die Clemens Gutmann im Rahmen seiner Beratung erstellt. Der Skill deckt vier Dinge ab: die **Schreibstimme** (wie Texte klingen), die **Dokument-Optik** (Word), die **Präsentations-Optik** (PowerPoint/Google Slides) und die **Tabellen-Optik** (Excel).

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

Diese Regeln gelten für jeden Text, den der Skill für be nice formuliert, ob Word-Dokument, Folie oder einfache Chat-Antwort. Das Design sorgt dafür, dass ein Dokument nach be nice aussieht. Die Schreibstimme sorgt dafür, dass es nach Clemens Gutmann klingt. Beides ist gleich verbindlich.

### Wer schreibt, und woher er kommt

Geschrieben wird als Clemens Gutmann, Managementberater. Volljurist, fast 30 Jahre Berufserfahrung, gewachsen aus Recht, Vertrieb, Unternehmensführung, eigenen Gründungen und IT-Projekten. Diese Mischung ist kein Lebenslauf-Detail, sie ist der Grund, warum er den Mittelstand von innen kennt und nicht aus dem Lehrbuch.

Seine Haltung zu KI ist nicht die eines Technikers. KI ist für ihn ein organisatorisches, ein menschliches, ein Führungsthema, und eines der Compliance. Für die reine Technik kooperiert er mit Spezialisten aus seinem Netzwerk. Er schreibt als jemand, der eine Marke für achtsame KI und KI-Strategie aufbaut, eine Key Person of Influence im Werden. Analytisch, aber kein nüchterner Diagnostiker. Menschen sollen sich verstanden fühlen, bevor sie sich belehrt fühlen.

Die Firma heißt **Clemens Gutmann - be nice Managementberatung**, im Text kurz **be nice**. Nicht „nice network". `nice-network.de` ist die Web- und Mailadresse, nicht der Name der Beratung.

Zielgruppe ist der Mittelstand im DACH-Raum, quer durch alle Branchen: vom Handwerker über die Apotheke, die Arztpraxis, das Autohaus, das Modegeschäft bis zum produzierenden Betrieb und zum Software-Beratungshaus. Gearbeitet wird mit den Alchimedus-Frameworks und über BAFA- und INQA-Förderprogramme.

### Wie ein Text anfängt

Nicht mit einer Definition und nicht mit einer Analyse. Sondern mit etwas, das der Leser wiedererkennt: eine Beobachtung, eine kleine Szene, eine Erfahrung, eine Frage. Erst wenn er innerlich nickt, kommt der Begriff. Erst Beziehung, dann Erklärung.

### Wie er klingt

Schreibe, als säßest du mit einem klugen Menschen an einem Tisch, nicht als verfasstest du ein Gutachten oder eine Präsentation. Zeig Bewegung und Bilder: Situationen, Spannungen, kleine Kontraste, echte Momente aus dem Alltag. Erklär nicht nur, was passiert, sondern wie es sich anfühlt und warum Menschen so darauf reagieren. Und lass Menschen vorkommen, nicht nur Prozesse, Strukturen und Unternehmen.

Die Satzmelodie wechselt. Kurze Impulssätze treffen auf längere, fließende. Diese Mischung trägt den Text.

Metaphern aus Natur, Sport, Geschichte, Musik oder Wissenschaft sind willkommen, aber sparsam und natürlich, nie als Schmuck.

### Was nie vorkommt

- Sterile Bulletprosa als Ersatz für Gedanken. Symmetrische Dreiermuster.
- Corporate-Sprache, Agentursprech, LinkedIn-Guru-Ton, künstliche Emotionalisierung.
- Verbrauchte Phrasen: „in der heutigen Zeit", „ganzheitlicher Ansatz", „Mehrwert schaffen", „maßgeschneiderte Lösungen", „entscheidend".
- Lange Gedankenstriche (Em-Dashes). Stattdessen Komma, Punkt oder Klammer.
- Argumentationsduette nach dem Muster „das ist kein X, das ist ein Y" (etwa „it's not just a…, it's a…" oder „das ist keine Sparsamkeit, das ist Feigheit"). Sie klingen pointiert und sind in Wahrheit eine Masche.

### Der Maßstab

> Erst Beziehung, dann Erklärung. Erst Bild, dann Begriff. Erst Mensch, dann Mechanismus.

Am Ende soll der Leser nicht denken „das ist fachlich richtig". Er soll denken: „Der versteht, wie sich das anfühlt, und ich vertraue ihm."

---

## Word-Dokumente (.docx)

Vorlage: `scripts/word_template.js` (Bibliothek `docx`, npm). Das Skript ist eine fertige, CI-konforme Vorlage mit Titelblock, Hilfsfunktionen für Überschriften, Info- und Akzentboxen sowie Header und Footer.

**Header** (wiederholt auf jeder Seite): Zwei-Spalten-Tabelle mit grüner Unterlinie, weißer Hintergrund.
- Links: Logo (`assets/logo.png`, 125×68 px)
- Rechts (rechtsbündig, 8pt, Mittelgrau): „Clemens Gutmann | be nice Managementberatung" / „www.nice-network.de" / `META.datum` — drei Zeilen, kein Dokumenttitel, kein Kundenname

**Footer** (wiederholt auf jeder Seite): Grauer Trennstrich oben, Zwei-Spalten-Tabelle.
- Links: „be nice Managementberatung | www.nice-network.de" (8pt, Mittelgrau)
- Rechts: `Seitenzahl / Gesamtseitenzahl` (8pt, Mittelgrau, rechtsbündig)

**So erzeugst du ein Dokument:**
1. `scripts/word_template.js` in den Arbeitsordner kopieren.
2. `npm install docx` im Arbeitsordner ausführen.
3. Das Logo muss erreichbar sein. Standardmäßig sucht das Skript es relativ unter `../assets/logo.png`. 
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
3. Logo-Pfad ist bereits auf `assets/logo.png` konfiguriert.
4. `META` und die Liste `slides_data` füllen.
5. `python3 pptx_template.py` ausführen.

**Folientypen (Tupelformat `("typ", feld1, feld2, [feld3])`):**
- `"title"` — Titelfolie, weiß. feld1 = Titel, feld2 = Untertitel, feld3 = `[Metazeile]`.
- `"section_divider"` — Kapiteltrennfolie, dunkelgrauer Hintergrund, Logo direkt darauf. feld1 = Nummer (`"01"`), feld2 = Kapitelüberschrift, feld3 = `[]`.
- `"content"` — Inhaltsfolie, weiß. feld1 = Folientitel, feld2 = `""`, feld3 = `[Bullets]`. Bullets bekommen grüne Punkt-Quadrate.
- `"quote"` — Zitatfolie, türkiser Hintergrund. feld1 = `""`, feld2 = Zitattext, feld3 = `[]`.

---

## Excel-Tabellen (.xlsx)

Vorlage: `scripts/xlsx_template.py` (Bibliothek `openpyxl`, mit Pillow für Bildverarbeitung). Das Skript formatiert Tabellen mit be-nice-Farbpalette, klarer Hierarchie und Calibri-Schrift. Header in Grün, Datenzeilen in Hellgrau, Summen-Zeilen in Türkis.

**So erzeugst du eine Tabelle:**
1. `scripts/xlsx_template.py` in den Arbeitsordner kopieren.
2. `pip install openpyxl pillow --break-system-packages` ausführen.
3. `META` (Titel, Datum, Autor, Ausgabedateiname) anpassen.
4. `sheets` Dict mit Blättern und Datenzeilen füllen — jede Zeile ist eine Liste von Zellenwerten.
5. `python3 xlsx_template.py` ausführen.

**Formatierungs-Regeln im Template:**
- **Titel-Zeile** (fusioniert): Dunkelgrau, 18pt, fett.
- **Meta-Zeile** (fusioniert): Mittelgrau, 9pt, kursiv (Autor und Datum).
- **Header-Zeilen** (erste Datenzeile): Grüner Hintergrund, weiße Schrift, 11pt, fett, zentriert mit Rahmen.
- **Datenzeilen**: Hellgrauer Hintergrund, dunkle Schrift, 10pt, leichte Rahmen.
- **Summen-Zeilen** (Zeilen, die „Gesamt" oder ähnlich beginnen): Türkiser Hintergrund, weiße Schrift, fett.
- **Spaltenbreiten** passen sich automatisch an (erste Spalte 16 Einheiten, übriges gleichmäßig auf 14).

Die Tabelle lädt sich eigenständig mit Titel und Metadaten — nur `sheets` Dict mit Daten füllen.

---

## Web-Tools (React / Vite / Vercel)

Für browserbasierte Tools und Apps gilt folgendes verbindliches Layout:

### Header
- **Hintergrundfarbe:** `#cccccc` (Mittelgrau — heller als Dunkelgrau, dunkler als Hellgrau)
- **Unterlinie:** 4px solid `#8CC63E` (Grün)
- **Logo:** `assets/logo.png`, Höhe 40px, links ausgerichtet, rechts 12px Abstand zum Text
- **Titelschrift:** `#454544` (Dunkelgrau), 16px, fett — enthält den Tool-Namen **ohne** Produkt-Prefix wie „Alchimedus ·"
- **Untertitel / Meta:** `#777777` (Mittelgrau), 11px — lautet immer: `Clemens Gutmann | be nice Managementberatung`
- **Rechts:** `www.nice-network.de` als anklickbarer Link (`href="https://www.nice-network.de"`, `target="_blank"`), Farbe `#777777`, **13px** (2 Schriftgrade größer als Metazeile), kein Underline-Stil (`textDecoration: "none"`)

### Farbvariablen (JavaScript)
```js
const G  = "#8CC63E";  // Grün — Buttons, Bullets, Unterstrich
const DG = "#454544";  // Dunkelgrau — Headlines, Text
const T  = "#33AB97";  // Türkis — sekundäre Buttons, H2
const BT = "#13A1B6";  // Blau-Türkis — Links, Download-Buttons
const LG = "#E9E9E9";  // Hellgrau — Kartenhintergründe, Info-Boxen
const MG = "#777777";  // Mittelgrau — Labels, Metazeilen
```

### Schrift
`fontFamily: "Calibri, 'Segoe UI', sans-serif"` auf dem Root-Element.

### Karten / Cards
Weißer Hintergrund, `border: "1px solid #ddd"`, `borderRadius: 8`, `boxShadow: "0 1px 4px rgba(0,0,0,0.06)"`. Card-Titel mit `borderBottom: "3px solid #8CC63E"`.

### Buttons
- Primär: Grün (`#8CC63E`), weiße Schrift, `borderRadius: 5`
- Sekundär: weißer Hintergrund, `border: "1.5px solid #ccc"`, Dunkelgrau-Schrift
- Download: Blau-Türkis (`#13A1B6`), weiße Schrift
- Teal-Akzent: Türkis (`#33AB97`), weiße Schrift

### Fortschrittsbalken
`background: #e8e8e8`, Balken in Grün (`#8CC63E`), `borderRadius: 20`, Höhe 9px. Darunter Beschriftung „Gesamtfortschritt" links, Prozent rechts.

### PDF-Export (Browser-Print)

PDF-Export via `window.open()` + `window.print()`. Seitenränder werden **doppelt** gesetzt (`body`-`padding` fürs Vorschau-Fenster, `@page` für den eigentlichen Druck — manche Browser ignorieren `@page` bei dynamisch geöffneten Fenstern), Seitenzahlen über `@page`-Margin-Boxes:

```css
body { padding: 2cm; }

@media print {
  body { padding: 0; }
  @page {
    margin: 2cm;
    @bottom-left {
      content: "be nice Managementberatung | www.nice-network.de";
      font-family: Calibri, 'Segoe UI', sans-serif;
      font-size: 8pt;
      color: #777777;
      border-top: 1px solid #E9E9E9;
      padding-top: 4px;
    }
    @bottom-right {
      content: counter(page) " / " counter(pages);
      font-family: Calibri, 'Segoe UI', sans-serif;
      font-size: 8pt;
      color: #777777;
      border-top: 1px solid #E9E9E9;
      padding-top: 4px;
    }
  }
}
```

**Dokument-Header** (einmalig oben, kein Wiederholungs-Header pro Seite):
- Links: `assets/logo.png`, Höhe 40px — **kein** Dokumenttitel, **kein** Kundenname darunter
- Rechts: „Clemens Gutmann | be nice Managementberatung", „www.nice-network.de", Datum — je eine Zeile, 9pt, `#777777`, rechtsbündig

Titel und Kundenname gehören ausschließlich in die H1 des Dokuments, nicht in den Header.

**Reihenfolge der Inhaltselemente:** Header → Inhaltsverzeichnis → Charts/Grafiken → Dokumentkörper.

---

## Logos

Logo-Quelle ist `assets/logo.png` (transparent, RGBA). **Logo-Maße nie hartkodieren:** Seitenverhältnis immer aus der Bilddatei berechnen (Word-Template liest es aus dem PNG-Header, PPTX-Template über `img_ratio`). Sonst wird das Logo beim nächsten Dateitausch verzerrt. Weitere Logos für Footer sind ebenfalls im `assets/`-Ordner:
- `alchimedus-netzwerk.png`
- `alchimedus-master.jpg`
- `inqa.jpg`

Diese können in den Templates je nach Bedarf aktiviert/deaktiviert werden.

---

## Vollständige Spezifikation

`references/be-nice-CI-Dokumentvorlagen.md` enthält die erschöpfenden Maße: alle Schriftgrößen in half-points bzw. pt, DXA-Werte für Seitenformat und Spaltenbreiten, exakte Border-Stärken, Zonenhöhen der Folien, Logo-Ratios und das Pillow-Snippet zur PNG-Konvertierung. Bei Detailfragen zu Abständen, Größen oder Farben dort nachschlagen, statt zu raten.

---

## Grafik-Placement in Word-Dokumenten

Seiten dürfen nicht mit einer Grafik beginnen. python-docx rendert keine Seitenumbrüche, deshalb greift "Schau mal, ob sie passt" nicht. Stattdessen gelten diese festen Regeln, die prophylaktisch sicherstellen, dass Grafiken im Textfluss bleiben:

### Standardbreite: 85 % der Textbreite

Grafiken werden nie in voller Textbreite eingefügt. Die Standardbreite beträgt **13 cm** (entspricht ~85 % einer A4-Textbreite von 16 cm). Das schafft den Abstandspuffer, der nötig ist, damit die Grafik zusammen mit ihrem Vorgängerabsatz auf der gleichen Seite bleibt. Seitenverhältnis immer beibehalten.

### Drei Absatzeigenschaften, immer gesetzt

Für jeden Absatz, der eine Grafik enthält, und für den Absatz unmittelbar davor gelten diese Einstellungen — ohne Ausnahme:

```python
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

def grafik_anker(para_vor_grafik, para_mit_grafik):
    """Verhindert, dass eine Grafik eine Seite eröffnet."""
    for para, props in [
        (para_vor_grafik, [('w:keepNext', {})]),
        (para_mit_grafik, [('w:keepTogether', {}), ('w:pageBreakBefore', {'w:val': '0'})]),
    ]:
        pPr = para._element.find(qn('w:pPr'))
        if pPr is None:
            pPr = OxmlElement('w:pPr')
            para._element.insert(0, pPr)
        for tag, attrs in props.items():
            el = OxmlElement(tag)
            for k, v in attrs.items():
                el.set(qn(k), v)
            if pPr.find(qn(tag)) is None:
                pPr.append(el)
```

- **`keepNext`** auf dem Vorgängerabsatz: hält Text und nachfolgenden Absatz (die Grafik) auf derselben Seite.
- **`keepTogether`** auf dem Grafikabsatz: verhindert, dass der Absatz selbst über eine Seitengrenze gebrochen wird.
- **`pageBreakBefore` = 0** auf dem Grafikabsatz: unterdrückt explizit jeden Seitenumbruch vor der Grafik.

### Niemals direkt nach einer Überschrift

Zwischen einer H1- oder H2-Überschrift und einer Grafik muss immer mindestens ein Fließtextabsatz stehen. Eine Überschrift direkt gefolgt von einer Grafik erzeugt fast immer einen ungewollten Seitenauftakt.

### Wenn eine Grafik trotzdem zu groß ist

Falls die Grafik nach allen Maßnahmen die Seite zu füllen droht: Breite auf **11 cm** reduzieren und zentrieren. Das ist die Untergrenze — kleiner werden Grafiken nicht, um Lesbarkeit zu erhalten.

Das Ziel ist ein ruhiges Schriftbild: Grafiken erscheinen im Textfluss, nie als Seitenauftakt.
