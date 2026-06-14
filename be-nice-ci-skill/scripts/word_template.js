/**
 * be nice network — Word-Vorlage (.docx)
 * CI-konforme Dokumentvorlage für Clemens Gutmann
 *
 * VERWENDUNG:
 *   1. DOKUMENT-METADATEN unten anpassen (Titel, Untertitel, Datum)
 *   2. INHALT unten anpassen (Abschnitte, Info-Boxen, Texte)
 *   3. FOOTER-LOGOS: auskommentieren, welche gewünscht sind
 *   4. Ausführen: node word_template.js
 *
 * VORAUSSETZUNGEN:
 *   npm install docx   (im Projektordner)
 */

const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, BorderStyle, WidthType, ShadingType,
  VerticalAlign, PageNumber, ExternalHyperlink, ImageRun
} = require('docx');
const fs = require('fs');
const path = require('path');

// ── Logo-Pfade ────────────────────────────────────────────────────────────────
const LOGOS = path.join(__dirname, '..', 'assets');

const IMG_BENICE = fs.readFileSync(path.join(LOGOS, 'logo.png'));

// Logo-Maße IMMER aus der echten Datei berechnen (PNG-IHDR: Breite/Höhe ab Byte 16).
// Nie hartkodieren — sonst wird das Logo beim nächsten Dateitausch verzerrt.
const LOGO_PX_W  = IMG_BENICE.readUInt32BE(16);
const LOGO_PX_H  = IMG_BENICE.readUInt32BE(20);
const HDR_LOGO_W = 125;                                            // Zielbreite im Header (px)
const HDR_LOGO_H = Math.round(HDR_LOGO_W * LOGO_PX_H / LOGO_PX_W); // Höhe folgt dem Seitenverhältnis

// FOOTER-LOGOS: gewünschte auskommentieren / aktivieren
// const IMG_ACN    = fs.readFileSync(path.join(LOGOS, 'alchimedus-netzwerk.png'));
// const IMG_MASTER = fs.readFileSync(path.join(LOGOS, 'alchimedus-master.jpg'));
// const IMG_INQA   = fs.readFileSync(path.join(LOGOS, 'inqa.jpg'));

// ── Farben ────────────────────────────────────────────────────────────────────
const GRUEN        = "8CC63E";
const DUNKELGRAU   = "454544";
const TUERKIS      = "33AB97";
const BLAU_TUERKIS = "13A1B6";
const HELLGRAU     = "E9E9E9";
const WEISS        = "FFFFFF";
const FAST_SCHWARZ = "111111";
const MITTELGRAU   = "777777";

// ── Seitenmaße (A4, DXA; 1440 DXA = 1 Inch) ──────────────────────────────────
const PAGE_W  = 11906;
const PAGE_H  = 16838;
const MARGIN  = 1134;             // ~2 cm
const CONT_W  = PAGE_W - 2 * MARGIN;  // 9638 DXA

// ══════════════════════════════════════════════════════════════════════════════
// DOKUMENT-METADATEN — hier anpassen
// ══════════════════════════════════════════════════════════════════════════════
const META = {
  titel:      "Dokumenttitel",
  untertitel: "Untertitel oder Beschreibung",
  datum:      "Mai 2026",
  autor:      "Clemens Gutmann · be nice network",
  ausgabe:    "Briefing_Titel.docx",   // Ausgabedateiname
};

// ── Hilfsfunktionen ───────────────────────────────────────────────────────────

function h1(text) {
  return new Paragraph({
    children: [new TextRun({ text, font: "Calibri", size: 40, bold: true, color: DUNKELGRAU })],
    spacing: { before: 320, after: 160 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: GRUEN, space: 6 } }
  });
}

function h2(text) {
  return new Paragraph({
    children: [new TextRun({ text, font: "Calibri", size: 24, bold: true, color: TUERKIS })],
    spacing: { before: 240, after: 80 }
  });
}

function txt(text, opts = {}) {
  return new Paragraph({
    children: [new TextRun({ text, font: "Calibri", size: 20, color: FAST_SCHWARZ, ...opts })],
    spacing: { before: 60, after: 60 }
  });
}

function gap(sz = 160) {
  return new Paragraph({ children: [new TextRun("")], spacing: { before: sz, after: 0 } });
}

const NO_BDR  = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const NO_BDRS = { top: NO_BDR, bottom: NO_BDR, left: NO_BDR, right: NO_BDR };

// Info-Box: grüne Kopfzelle | hellgraue Inhaltszelle
function infoBox(label, content) {
  const b = { style: BorderStyle.SINGLE, size: 1, color: HELLGRAU };
  const bs = { top: b, bottom: b, left: b, right: b };
  return new Table({
    width: { size: CONT_W, type: WidthType.DXA },
    columnWidths: [2200, 7438],
    rows: [new TableRow({ children: [
      new TableCell({
        borders: bs, width: { size: 2200, type: WidthType.DXA },
        shading: { fill: GRUEN, type: ShadingType.CLEAR },
        margins: { top: 120, bottom: 120, left: 160, right: 160 },
        verticalAlign: VerticalAlign.TOP,
        children: [new Paragraph({
          children: [new TextRun({ text: label, font: "Calibri", size: 18, bold: true, color: WEISS })],
          spacing: { before: 0, after: 0 }
        })]
      }),
      new TableCell({
        borders: bs, width: { size: 7438, type: WidthType.DXA },
        shading: { fill: HELLGRAU, type: ShadingType.CLEAR },
        margins: { top: 120, bottom: 120, left: 160, right: 160 },
        verticalAlign: VerticalAlign.TOP,
        children: [new Paragraph({
          children: [new TextRun({ text: content, font: "Calibri", size: 20, color: FAST_SCHWARZ })],
          spacing: { before: 0, after: 0 }
        })]
      })
    ]})]
  });
}

// Akzent-Box: türkiser linker Balken, heller Hintergrund, kursiv
function accentBox(text) {
  const b = { style: BorderStyle.SINGLE, size: 1, color: BLAU_TUERKIS };
  const bs = { top: b, bottom: b, left: { style: BorderStyle.SINGLE, size: 12, color: BLAU_TUERKIS }, right: b };
  return new Table({
    width: { size: CONT_W, type: WidthType.DXA },
    columnWidths: [CONT_W],
    rows: [new TableRow({ children: [new TableCell({
      borders: bs, width: { size: CONT_W, type: WidthType.DXA },
      shading: { fill: "EEF9F7", type: ShadingType.CLEAR },
      margins: { top: 120, bottom: 120, left: 200, right: 160 },
      children: [new Paragraph({
        children: [new TextRun({ text, font: "Calibri", size: 20, color: FAST_SCHWARZ, italics: true })],
        spacing: { before: 0, after: 0 }
      })]
    })]})  ]
  });
}

// ── Header: Logo links | URL rechts, HELLGRAU-Hintergrund, grüne Linie ────────
const docHeader = new Header({
  children: [
    new Table({
      width: { size: CONT_W, type: WidthType.DXA },
      columnWidths: [2200, 7438],
      borders: {
        top: NO_BDR, left: NO_BDR, right: NO_BDR, insideH: NO_BDR, insideV: NO_BDR,
        bottom: { style: BorderStyle.SINGLE, size: 6, color: GRUEN, space: 0 },
      },
      rows: [new TableRow({ children: [
        new TableCell({
          borders: NO_BDRS,
          shading: { type: ShadingType.CLEAR, fill: HELLGRAU },
          width: { size: 2200, type: WidthType.DXA },
          verticalAlign: VerticalAlign.CENTER,
          margins: { top: 60, bottom: 60, left: 0, right: 0 },
          children: [new Paragraph({
            children: [new ImageRun({
              type: "png", data: IMG_BENICE,
              transformation: { width: HDR_LOGO_W, height: HDR_LOGO_H },
              altText: { title: "be nice", description: "be nice Logo", name: "benice" }
            })],
            spacing: { before: 0, after: 0 }
          })]
        }),
        new TableCell({
          borders: NO_BDRS,
          shading: { type: ShadingType.CLEAR, fill: HELLGRAU },
          width: { size: 7438, type: WidthType.DXA },
          verticalAlign: VerticalAlign.CENTER,
          margins: { top: 60, bottom: 60, left: 0, right: 0 },
          children: [new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [new TextRun({ text: "www.nice-network.de", font: "Calibri", size: 18, color: MITTELGRAU })],
            spacing: { before: 0, after: 0 }
          })]
        }),
      ]})]
    })
  ]
});

// ── Footer-Logos ──────────────────────────────────────────────────────────────
// Logos je nach Aktivierung oben einsetzen.
// Reihenfolge: je eine Zelle pro Logo (zentriert), dann Seitenzahl rechts.
// Spaltenbreiten je nach Anzahl aktiver Logos anpassen (Summe = 9638 DXA).

const LOGO_H = 46;

// Beispiel: alle drei aktiv → 3 × 2879 + 2001 = 9638
// Beispiel: zwei aktiv      → 2 × 3200 + 3238 = 9638 (anpassen)

function logoCell(imgData, imgType, ratioW, ratioH, colW) {
  return new TableCell({
    borders: NO_BDRS,
    width: { size: colW, type: WidthType.DXA },
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 60, bottom: 60, left: 60, right: 60 },
    children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new ImageRun({
        type: imgType, data: imgData,
        transformation: { width: Math.round(LOGO_H * ratioW / ratioH), height: LOGO_H },
        altText: { title: "Logo", description: "Footer-Logo", name: "logo" }
      })],
      spacing: { before: 0, after: 0 }
    })]
  });
}

// ── FOOTER KONFIGURIEREN ──────────────────────────────────────────────────────
// Aktive Logo-Zellen hier zusammenstellen.
// Ratios: ACN 1550/360 | Master 3661/1949 | INQA 1/1

const activeLogoColumns = [
  // logoCell(IMG_ACN,    "png", 1550, 360,  2879),
  // logoCell(IMG_MASTER, "jpg", 3661, 1949, 2879),
  // logoCell(IMG_INQA,   "jpg", 1,    1,    2879),
];

// Breite der Seitenzahl-Spalte = 9638 - Summe der Logo-Spaltenbreiten
// Bei 3 Logos: 9638 - 3×2879 = 2001
// Bei 0 Logos: 9638
const numColWidth = 9638 - activeLogoColumns.reduce((s, c) => s + 2879, 0);

const docFooter = new Footer({
  children: [
    new Paragraph({
      border: { top: { style: BorderStyle.SINGLE, size: 4, color: HELLGRAU, space: 4 } },
      spacing: { before: 60, after: 0 }
    }),
    new Table({
      width: { size: CONT_W, type: WidthType.DXA },
      columnWidths: [...activeLogoColumns.map(() => 2879), numColWidth],
      rows: [new TableRow({ children: [
        ...activeLogoColumns,
        new TableCell({
          borders: NO_BDRS,
          width: { size: numColWidth, type: WidthType.DXA },
          verticalAlign: VerticalAlign.CENTER,
          margins: { top: 60, bottom: 60, left: 60, right: 0 },
          children: [new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({ children: [PageNumber.CURRENT], font: "Calibri", size: 16, color: MITTELGRAU }),
              new TextRun({ text: " / ", font: "Calibri", size: 16, color: MITTELGRAU }),
              new TextRun({ children: [PageNumber.TOTAL_PAGES], font: "Calibri", size: 16, color: MITTELGRAU }),
            ],
            spacing: { before: 0, after: 0 }
          })]
        }),
      ]})]
    })
  ]
});

// ══════════════════════════════════════════════════════════════════════════════
// INHALT — hier anpassen
// ══════════════════════════════════════════════════════════════════════════════

const inhalt = [

  // Titelblock
  new Paragraph({
    children: [new TextRun({ text: META.titel, font: "Calibri", size: 48, bold: true, color: DUNKELGRAU })],
    spacing: { before: 160, after: 80 }
  }),
  new Paragraph({
    children: [new TextRun({ text: META.untertitel, font: "Calibri", size: 28, color: TUERKIS })],
    spacing: { before: 0, after: 40 }
  }),
  new Paragraph({
    children: [new TextRun({ text: `${META.autor} · ${META.datum}`, font: "Calibri", size: 18, color: MITTELGRAU })],
    spacing: { before: 0, after: 0 }
  }),

  gap(200),

  // Einleitende Akzent-Box (optional)
  accentBox("Einleitender Kernsatz oder Zweck des Dokuments."),

  gap(200),

  // ── Abschnitt 1 ──────────────────────────────────────────────────────────
  h1("Erster Abschnitt"),
  txt("Fließtext zum ersten Abschnitt."),
  gap(80),

  infoBox("Label 1", "Inhalt der ersten Info-Box."),
  gap(60),
  infoBox("Label 2", "Inhalt der zweiten Info-Box."),
  gap(60),
  infoBox("Label 3", "Inhalt der dritten Info-Box."),

  gap(200),

  // ── Abschnitt 2 ──────────────────────────────────────────────────────────
  h1("Zweiter Abschnitt"),
  txt("Fließtext zum zweiten Abschnitt."),
  gap(80),

  h2("Unterüberschrift"),
  txt("Fließtext zur Unterüberschrift."),
  gap(80),

  h2("Zweite Unterüberschrift"),
  txt("Weiterer Fließtext."),

  gap(200),

  // ── Abschluss ─────────────────────────────────────────────────────────────
  new Paragraph({
    children: [new TextRun({ text: "Nächster Schritt", font: "Calibri", size: 24, bold: true, color: GRUEN })],
    spacing: { before: 0, after: 120 }
  }),
  txt("Abschlusssatz mit konkretem nächsten Schritt."),
  gap(80),
  new Paragraph({
    children: [
      new TextRun({ text: "Clemens Gutmann  ·  ", font: "Calibri", size: 18, color: DUNKELGRAU }),
      new ExternalHyperlink({
        link: "mailto:clemens@nice-network.de",
        children: [new TextRun({ text: "clemens@nice-network.de", font: "Calibri", size: 18, color: BLAU_TUERKIS })]
      })
    ],
    spacing: { before: 40, after: 0 }
  })

];

// ── Dokument bauen und speichern ──────────────────────────────────────────────
const doc = new Document({
  styles: {
    default: { document: { run: { font: "Calibri", size: 20, color: FAST_SCHWARZ } } }
  },
  sections: [{
    properties: {
      page: {
        size: { width: PAGE_W, height: PAGE_H },
        margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN }
      }
    },
    headers: { default: docHeader },
    footers: { default: docFooter },
    children: inhalt
  }]
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync(META.ausgabe, buf);
  console.log(`Gespeichert: ${META.ausgabe}`);
});
