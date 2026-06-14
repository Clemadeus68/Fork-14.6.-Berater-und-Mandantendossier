# be nice network — CI-Anweisung für Dokumentvorlagen

Verbindliche Gestaltungsregeln für Word (.docx) und PowerPoint/Google Slides (.pptx).  
Gilt für alle Dokumente, die Clemens Gutmann im Rahmen seiner Beratungstätigkeit erstellt.

---

## Farbpalette

| Name | Hex | Verwendung |
|---|---|---|
| GRUEN | `#8CC63E` | Hauptmarke: H1-Unterstrich, Akzentlinien, Bullets, CTA |
| DUNKELGRAU | `#454544` | Headlines, Titeltext, Hauptschrift |
| TUERKIS | `#33AB97` | H2, Zwischenüberschriften, Akzent-Boxen |
| BLAU_TUERKIS | `#13A1B6` | Links, E-Mail, sekundäre Akzente |
| HELLGRAU | `#E9E9E9` | Header-Hintergrund, Info-Boxen, Trennlinien |
| WEISS | `#FFFFFF` | Textflächen, Slide-Hintergrund |
| FAST_SCHWARZ | `#111111` | Fließtext |
| MITTELGRAU | `#777777` | Metazeilen, Captions, Datum, URL im Header |

---

## Logos

Alle vier Logos liegen im Projektordner. Vor der Verwendung mit Pillow in PNG konvertieren (Transparenz erhalten):

```python
from PIL import Image
import io

def png_bytes(path):
    img = Image.open(path)
    if img.mode == 'P':    img = img.convert('RGBA')
    elif img.mode == 'RGB': img = img.convert('RGBA')
    buf = io.BytesIO()
    img.save(buf, format='PNG')
    buf.seek(0)
    return buf
```

| Datei | Verwendung | Ratio |
|---|---|---|
| `be-nice Kopie.png` | Header oben links (echte Transparenz — RGBA) | 1.842 : 1 |
| `Logo Alchimedus Consulting Network_rgb Kopie.png` | Footer links | 4.31 : 1 |
| `Alchimedus Consulting Network Logo and Master Certificate Kopie.jpg` | Footer Mitte | 1.88 : 1 |
| `Badges_Autorisierter_INQA-Coach_2026-2027 Kopie.jpg` | Footer rechts | 1 : 1 |

---

## Word (.docx) — Bibliothek: `docx` (npm)

### Seitenformat

```javascript
// A4, Ränder 2 cm umlaufend
page: {
  size: { width: 11906, height: 16838 },          // DXA
  margin: { top: 1134, right: 1134, bottom: 1134, left: 1134 }
}
// Content-Breite: 11906 - 2×1134 = 9638 DXA
```

### Schriftgrößen (Half-Points)

| Element | Größe | Stil | Farbe |
|---|---|---|---|
| Dokumenttitel | 48 | bold | DUNKELGRAU |
| Untertitel | 28 | — | TUERKIS |
| Metazeile | 18 | — | MITTELGRAU |
| H1 | 40 | bold | DUNKELGRAU |
| H2 | 24 | bold | TUERKIS |
| Fließtext | 20 | — | FAST_SCHWARZ |
| Header/Footer-Text | 16–18 | — | MITTELGRAU |
| Seitenzahl | 16 | — | MITTELGRAU |

### H1-Stil

```javascript
new Paragraph({
  children: [new TextRun({ text, font: "Calibri", size: 40, bold: true, color: "454544" })],
  spacing: { before: 320, after: 160 },
  border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: "8CC63E", space: 6 } }
})
```

### Info-Box (zweispaltige Tabelle)

Spalten: 2200 / 7438 DXA (Summe = 9638).  
Linke Zelle: fill `8CC63E`, Schrift WEISS 18pt bold — Label.  
Rechte Zelle: fill `E9E9E9`, Schrift FAST_SCHWARZ 20pt — Inhalt.  
`ShadingType.CLEAR`, Innenabstand `{ top: 120, bottom: 120, left: 160, right: 160 }`.

### Akzent-Box (einspaltige Tabelle)

Linker Rahmen: `BorderStyle.SINGLE`, size 12, color `13A1B6`.  
Alle anderen Rahmen: size 1, color `13A1B6`.  
Fill: `EEF9F7`, Schrift 20pt italic, FAST_SCHWARZ.

### Header

Zweispaltige Tabelle ohne Rahmen (2200 / 7438 DXA).  
Unterer Tabellenrahmen: `BorderStyle.SINGLE`, size 6, color `8CC63E`.  
Beide Zellen: fill `E9E9E9`, `verticalAlign: VerticalAlign.CENTER`.

```javascript
// Linke Zelle: be nice Logo
new ImageRun({
  type: "png", data: IMG_BENICE,
  transformation: { width: 125, height: 68 },   // px, ratio 1.842
  altText: { title: "be nice", description: "be nice Logo", name: "benice" }
})

// Rechte Zelle: URL rechts, vertikal zentriert
alignment: AlignmentType.RIGHT
new TextRun({ text: "www.nice-network.de", font: "Calibri", size: 18, color: "777777" })
```

### Footer

Vierstellige Tabelle ohne Rahmen: 2879 / 2879 / 2879 / 2001 DXA.  
Zellen 1–3: je ein Logo, zentriert (`AlignmentType.CENTER`, `VerticalAlign.CENTER`).  
Zelle 4: Seitenzahl rechts, 16pt, MITTELGRAU, Format `X / Y`.

```javascript
// Logo-Höhe im Footer
const LOGO_H = 46;  // px
// ACN:    width: Math.round(46 * 4.31)  = 198px
// Master: width: Math.round(46 * 1.88)  =  87px
// INQA:   width: 46px (quadratisch)
```

Davor: leerer Paragraph mit oberer Trennlinie in `E9E9E9`.

### Seitenzahl

```javascript
new TextRun({ children: [PageNumber.CURRENT], font: "Calibri", size: 16, color: "777777" }),
new TextRun({ text: " / ", font: "Calibri", size: 16, color: "777777" }),
new TextRun({ children: [PageNumber.TOTAL_PAGES], font: "Calibri", size: 16, color: "777777" }),
```

---

## PowerPoint / Google Slides (.pptx) — Bibliothek: `python-pptx`

### Folienformat

```python
from pptx.util import Cm
SW = Cm(33.867)   # Breite 16:9 Widescreen
SH = Cm(19.05)    # Höhe
```

### Zonen

```python
HEADER_H  = Cm(1.6)
FOOTER_H  = Cm(2.2)
FOOTER_Y  = SH - FOOTER_H
MARGIN_L  = Cm(1.5)
CONTENT_W = SW - Cm(3.0)   # links + rechts
```

### Header (alle Folien)

Rechteck volle Breite, Höhe `HEADER_H`, fill `#E9E9E9`.  
Grüne Linie darunter: Rechteck, Höhe `Pt(3)`, fill `#8CC63E`.  
be nice Logo links: Höhe `HEADER_H - Cm(0.2)`, Breite = Höhe × 1.842, x = `Cm(0.4)`, y = `Cm(0.1)`.  
URL rechts: Textbox, 10pt, MITTELGRAU, rechtsbündig, vertikal mittig zum Logo.

```python
url_h = Cm(0.6)
url_y = (HEADER_H - url_h) / 2
add_textbox(slide, "www.nice-network.de",
            SW - Cm(5.5), url_y, Cm(5.2), url_h,
            size=10, color=MITTELGRAU, align=PP_ALIGN.RIGHT)
```

### Footer (alle Folien außer Kapitel-Trennfolien)

Rechteck volle Breite, fill `#F7F7F7`. Trennlinie oben: fill `#E9E9E9`, `Pt(1.5)`.  
Drei Logos in je einem Drittel der Folienbreite, vertikal zentriert:

```python
logo_zone_h = Cm(1.62)     # +20% gegenüber Basisgröße
logo_zone_y = FOOTER_Y + (FOOTER_H - logo_zone_h) / 2
third = SW / 3

for i, (path, ratio) in enumerate(logos):
    max_w = third - Cm(1.0)
    calc_w = logo_zone_h * ratio
    lw = min(calc_w, max_w)
    lh = lw / ratio if calc_w > max_w else logo_zone_h
    center_x = third * i + third / 2
    center_y = logo_zone_y + logo_zone_h / 2
    add_picture(slide, path, center_x - lw/2, center_y - lh/2, lw, lh)
```

### Seitenzahl

```python
def slide_number(slide, cur, total):
    txt = f"{cur} / {total}"
    add_textbox(slide, txt, SW - Cm(2.8), SH - Cm(0.65), Cm(2.6), Cm(0.55),
                size=8, color=MITTELGRAU, align=PP_ALIGN.RIGHT)
```

### Schriftgrößen Präsentation

| Element | Größe | Stil | Farbe |
|---|---|---|---|
| Titelfolie Titel | 36pt | bold | DUNKELGRAU |
| Titelfolie Untertitel | 22pt | — | TUERKIS |
| Kapitel-Trennfolie Titel | 38pt | bold | WEISS |
| Folientitel (Inhaltsfolie) | 24pt | bold | DUNKELGRAU |
| Bullets | 16pt | — | FAST_SCHWARZ |
| Zitat-Folie | 22pt | bold italic | WEISS |
| URL im Header | 10pt | — | MITTELGRAU |
| Seitenzahl | 8pt | — | MITTELGRAU |

### Folien-Typen

**Titelfolie:** Weißer Hintergrund, Header, grüner Akzentstreifen links (Cm(0.5) breit), Footer.

**Inhaltsfolie:** Weißer Hintergrund, Header, grüner Akzentstreifen links, Folientitel mit grüner Linie darunter (`Pt(2)`), Bullets mit grünem Punkt-Rechteck (`Cm(0.18) × Cm(0.18)`), Footer.

**Kapitel-Trennfolie:** Hintergrund DUNKELGRAU (volle Folie), be nice Logo direkt auf dunklem Hintergrund, Kapitel-Nummer in GRUEN (14pt bold), Titel in WEISS (38pt bold), grüne Linie darunter.

**Zitat-Folie:** Hintergrund TUERKIS, be nice Logo oben links, Text WEISS zentriert italic bold.

---

## Google Slides

Google Slides-kompatibel: `.pptx`-Datei direkt importieren über *Datei → Importieren*.  
Foliengröße auf „Widescreen 16:9" prüfen (33,87 × 19,05 cm).  
Schrift Calibri bleibt erhalten; Fallback in Google Slides: Montserrat (Überschriften), Open Sans (Fließtext).

---

## Grundprinzip

Das **GRUEN** ist die Linie, die alles zusammenhält — in Word als H1-Unterstrich, in PowerPoint als Balken unter dem Header und als Akzentstreifen links. Der Rest bleibt zurückhaltend: viel Weiß, klare Hierarchie, Farbe nur als Signal — nie als Dekoration.
