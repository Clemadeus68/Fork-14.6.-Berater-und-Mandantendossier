// ── Mandanten-Dossier .docx Renderer ───────────────────────────────────────────
// Baut EIN CI-konformes Word-Dokument (Teil A intern + Teil B Kundenteil) aus dem
// Dossier-JSON (Claude) plus den echten SISTRIX-Daten (Tabellen aus harten Zahlen).
// CI-Maße/Farben exakt nach Goldstandard 260612_Mandanten-Dossier_Scholl.

// ── Farben ──────────────────────────────────────────────────────────────────────
const GRUEN   = '8CC63E';
const DUNKEL  = '454544';
const TUERKIS = '33AB97';
const HELLGR  = 'E9E9E9';
const WEISS   = 'FFFFFF';
const SCHWARZ = '111111';
const MITTELG = '777777';
const AKZENT  = 'EEF9F7'; // helles Türkis für Akzent-Boxen

// ── Seitenmaße (A4, DXA; 1440 = 1 inch) ─────────────────────────────────────────
const PAGE_W = 11906;
const PAGE_H = 16838;
const MARGIN = 1134;             // ~2 cm
const CONT_W = PAGE_W - 2 * MARGIN; // 9638
const LABEL_W = 2200;            // Breite der Label-Spalte in Boxen
const VAL_W = CONT_W - LABEL_W;  // 7438

// PNG-Maße aus dem IHDR-Header lesen (Bytes 16–23). Niemals hartkodieren.
function pngSize(input) {
  try {
    // Robust gegen ArrayBuffer, Uint8Array und Node-Buffer (byteOffset beachten)
    const u8 = input instanceof Uint8Array
      ? input
      : new Uint8Array(input);
    const dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
    if (dv.getUint32(0) !== 0x89504e47) return null; // PNG-Signatur
    return { w: dv.getUint32(16), h: dv.getUint32(20) };
  } catch { return null; }
}

function fmtNum(n) {
  if (n === null || n === undefined || n === '') return '–';
  const num = typeof n === 'number' ? n : Number(String(n).replace(/[^\d.-]/g, ''));
  if (Number.isNaN(num)) return String(n);
  return num.toLocaleString('de-DE');
}
function fmtVis(v) {
  const num = typeof v === 'number' ? v : parseFloat(v);
  if (Number.isNaN(num)) return String(v ?? '–');
  return num.toFixed(2).replace('.', ',');
}

export function dossierFilename(firma) {
  const date = new Date();
  const yy = String(date.getFullYear()).slice(2);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const safe = String(firma || 'Mandant').replace(/[^a-zA-Z0-9äöüÄÖÜß ]/g, '').trim().replace(/\s+/g, '_').slice(0, 50);
  return `${yy}${mm}${dd}_Berater-und-Mandantendossier_${safe}.docx`;
}

// Umgebungsneutraler Builder: nimmt das docx-Modul + Rohdaten, gibt ein Document zurück.
// Wird vom Browser-Export und vom Node-Testlauf gemeinsam genutzt.
export function buildDossierDocument({ Docx, dossier, sistrixData, logoData }) {
  const {
    Document, Paragraph, TextRun, BorderStyle, AlignmentType,
    Table, TableRow, TableCell, WidthType, ShadingType, TableLayoutType,
    Header, Footer, PageNumber, ImageRun, VerticalAlign, PageBreak,
  } = Docx;

  // ── Logo-Maße aus IHDR ──────────────────────────────────────────────────────
  let logoW = 125, logoH = 44;
  if (logoData) {
    const sz = pngSize(logoData);
    if (sz && sz.w && sz.h) { logoW = 125; logoH = Math.round(125 * sz.h / sz.w); }
  }

  const NO_BDR = { style: BorderStyle.NONE, size: 0, color: WEISS };
  const NO_BDRS = { top: NO_BDR, bottom: NO_BDR, left: NO_BDR, right: NO_BDR };
  const THIN = { style: BorderStyle.SINGLE, size: 2, color: 'CCCCCC' };
  const THIN_BDRS = { top: THIN, bottom: THIN, left: THIN, right: THIN };

  // ── Run-Helfer: Inline-Parsing für **fett** ─────────────────────────────────
  function runs(text, opts = {}) {
    const base = { font: 'Calibri', size: 20, color: SCHWARZ, ...opts };
    const segs = [];
    const re = /\*\*(.+?)\*\*/g;
    let last = 0, m;
    const t = String(text ?? '');
    while ((m = re.exec(t)) !== null) {
      if (m.index > last) segs.push(new TextRun({ ...base, text: t.slice(last, m.index) }));
      segs.push(new TextRun({ ...base, text: m[1], bold: true }));
      last = re.lastIndex;
    }
    if (last < t.length) segs.push(new TextRun({ ...base, text: t.slice(last) }));
    return segs.length ? segs : [new TextRun({ ...base, text: t })];
  }

  // ── Überschriften / Absätze ─────────────────────────────────────────────────
  function title(text) {
    return new Paragraph({
      children: [new TextRun({ text, font: 'Calibri', size: 48, bold: true, color: DUNKEL })],
      spacing: { before: 0, after: 60 },
    });
  }
  function subtitle(text) {
    return new Paragraph({
      children: [new TextRun({ text, font: 'Calibri', size: 28, color: TUERKIS })],
      spacing: { before: 0, after: 40 },
    });
  }
  function metaline(text) {
    return new Paragraph({
      children: [new TextRun({ text, font: 'Calibri', size: 18, color: MITTELG })],
      spacing: { before: 0, after: 160 },
    });
  }
  function h1(text) {
    return new Paragraph({
      children: [new TextRun({ text, font: 'Calibri', size: 40, bold: true, color: DUNKEL })],
      spacing: { before: 320, after: 160 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: GRUEN, space: 6 } },
    });
  }
  function h2(text) {
    return new Paragraph({
      children: [new TextRun({ text, font: 'Calibri', size: 24, bold: true, color: TUERKIS })],
      spacing: { before: 240, after: 80 },
    });
  }
  function p(text, opts = {}) {
    return new Paragraph({
      children: runs(text, opts.run || {}),
      spacing: { before: 60, after: 60, ...(opts.spacing || {}) },
      ...(opts.align ? { alignment: opts.align } : {}),
    });
  }
  function gap(sz = 120) {
    return new Paragraph({ children: [new TextRun('')], spacing: { before: sz, after: 0 } });
  }

  // ── Boxen ───────────────────────────────────────────────────────────────────
  function cell(text, { fill, w, color = SCHWARZ, bold = false, align } = {}) {
    return new TableCell({
      borders: THIN_BDRS,
      width: { size: w, type: WidthType.DXA },
      shading: fill ? { fill, type: ShadingType.CLEAR, color: 'auto' } : undefined,
      verticalAlign: VerticalAlign.CENTER,
      margins: { top: 80, bottom: 80, left: 120, right: 120 },
      children: (Array.isArray(text) ? text : [text]).map(t =>
        new Paragraph({
          children: runs(t, { color, bold }),
          spacing: { before: 20, after: 20 },
          ...(align ? { alignment: align } : {}),
        })
      ),
    });
  }

  // Akzent-Box: eine Zelle, volle Breite, helles Türkis
  function accentBox(text) {
    return new Table({
      width: { size: CONT_W, type: WidthType.DXA },
      columnWidths: [CONT_W],
      layout: TableLayoutType.FIXED,
      rows: [new TableRow({ children: [cell(text, { fill: AKZENT, w: CONT_W })] })],
    });
  }

  // Zwei-Spalten-Box: farbiges Label links | hellgraue Inhaltszelle rechts
  function labelBox(label, content, labelFill) {
    return new Table({
      width: { size: CONT_W, type: WidthType.DXA },
      columnWidths: [LABEL_W, VAL_W],
      layout: TableLayoutType.FIXED,
      rows: [new TableRow({ children: [
        cell(label, { fill: labelFill, w: LABEL_W, color: WEISS, bold: true }),
        cell(content, { fill: HELLGR, w: VAL_W }),
      ] })],
    });
  }
  const infoBox     = (l, c) => labelBox(l, c, GRUEN);
  const internBox   = (c) => labelBox('INTERN', c, DUNKEL);
  const gespraechBox = (c) => labelBox('GESPRÄCH', c, GRUEN);

  // Datentabelle: grüne Kopfzeile (weiß), hellgraue Datenzeilen
  function dataTable(headers, rows, colWidths, centerCols = []) {
    const headRow = new TableRow({
      tableHeader: true,
      children: headers.map((h, ci) =>
        cell(h, { fill: GRUEN, w: colWidths[ci], color: WEISS, bold: true,
          align: centerCols.includes(ci) ? AlignmentType.CENTER : undefined })),
    });
    const bodyRows = rows.map(r => new TableRow({
      children: r.map((c, ci) =>
        cell(String(c.text ?? c), { fill: HELLGR, w: colWidths[ci], bold: !!c.bold,
          align: centerCols.includes(ci) ? AlignmentType.CENTER : undefined })),
    }));
    return new Table({
      width: { size: CONT_W, type: WidthType.DXA },
      columnWidths: colWidths,
      layout: TableLayoutType.FIXED,
      rows: [headRow, ...bodyRows],
    });
  }

  // Balken-Zelle: ein proportionaler, vektorbasierter Balken (verschachtelte Tabelle).
  // Kein Bild, druckt scharf, exakt in CI-Grün. Zieldomain in Türkis hervorgehoben.
  function barCell(value, maxValue, totalW, isMain) {
    const v = Number(value) || 0;
    const ratio = maxValue > 0 ? Math.min(v / maxValue, 1) : 0;
    const inner = totalW - 240; // Zellinnenränder berücksichtigen
    let fillW = Math.round(ratio * inner);
    if (v > 0) fillW = Math.max(fillW, 36); // winziger Strich auch bei Mini-Werten
    fillW = Math.min(fillW, inner);
    const restW = Math.max(inner - fillW, 1);
    const barColor = isMain ? TUERKIS : GRUEN;
    const emptyP = () => new Paragraph({ children: [new TextRun({ text: '', size: 2 })], spacing: { before: 0, after: 0 } });
    const innerCells = [];
    const innerWidths = [];
    if (fillW > 0) {
      innerCells.push(new TableCell({
        borders: NO_BDRS, width: { size: fillW, type: WidthType.DXA },
        shading: { fill: barColor, type: ShadingType.CLEAR, color: 'auto' },
        margins: { top: 0, bottom: 0, left: 0, right: 0 }, children: [emptyP()],
      }));
      innerWidths.push(fillW);
    }
    innerCells.push(new TableCell({
      borders: NO_BDRS, width: { size: restW, type: WidthType.DXA },
      margins: { top: 0, bottom: 0, left: 0, right: 0 }, children: [emptyP()],
    }));
    innerWidths.push(restW);
    const innerTable = new Table({
      width: { size: fillW + restW, type: WidthType.DXA },
      columnWidths: innerWidths,
      layout: TableLayoutType.FIXED,
      borders: { top: NO_BDR, bottom: NO_BDR, left: NO_BDR, right: NO_BDR, insideH: NO_BDR, insideV: NO_BDR },
      rows: [new TableRow({ height: { value: 150, rule: 'exact' }, children: innerCells })],
    });
    return new TableCell({
      borders: THIN_BDRS, width: { size: totalW, type: WidthType.DXA },
      shading: { fill: HELLGR, type: ShadingType.CLEAR, color: 'auto' },
      verticalAlign: VerticalAlign.CENTER,
      margins: { top: 60, bottom: 60, left: 120, right: 120 },
      children: [innerTable, emptyP()],
    });
  }

  // ── Header / Footer ─────────────────────────────────────────────────────────
  const docHeader = new Header({
    children: [
      new Table({
        width: { size: CONT_W, type: WidthType.DXA },
        columnWidths: [LABEL_W, VAL_W],
        layout: TableLayoutType.FIXED,
        borders: {
          top: NO_BDR, left: NO_BDR, right: NO_BDR, insideH: NO_BDR, insideV: NO_BDR,
          bottom: { style: BorderStyle.SINGLE, size: 8, color: GRUEN, space: 2 },
        },
        rows: [new TableRow({ children: [
          new TableCell({
            borders: NO_BDRS, width: { size: LABEL_W, type: WidthType.DXA },
            verticalAlign: VerticalAlign.CENTER, margins: { top: 40, bottom: 80, left: 0, right: 0 },
            children: [new Paragraph({
              children: logoData
                ? [new ImageRun({ data: logoData, transformation: { width: logoW, height: logoH }, type: 'png' })]
                : [new TextRun({ text: 'be nice', font: 'Calibri', size: 20, bold: true, color: GRUEN })],
              spacing: { before: 0, after: 0 },
            })],
          }),
          new TableCell({
            borders: NO_BDRS, width: { size: VAL_W, type: WidthType.DXA },
            verticalAlign: VerticalAlign.CENTER, margins: { top: 40, bottom: 80, left: 0, right: 0 },
            children: [new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [new TextRun({ text: 'www.nice-network.de', font: 'Calibri', size: 18, color: MITTELG })],
              spacing: { before: 0, after: 0 },
            })],
          }),
        ] })],
      }),
    ],
  });

  const docFooter = new Footer({
    children: [
      new Paragraph({
        children: [],
        border: { top: { color: HELLGR, style: BorderStyle.SINGLE, size: 4, space: 4 } },
        spacing: { before: 40, after: 0 },
      }),
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [
          new TextRun({ children: [PageNumber.CURRENT], font: 'Calibri', size: 16, color: MITTELG }),
          new TextRun({ text: ' / ', font: 'Calibri', size: 16, color: MITTELG }),
          new TextRun({ children: [PageNumber.TOTAL_PAGES], font: 'Calibri', size: 16, color: MITTELG }),
        ],
        spacing: { before: 40, after: 0 },
      }),
    ],
  });

  // ── SISTRIX-Tabellen aus ECHTEN Daten + Balkengrafik ────────────────────────
  function headerRow(headers, colWidths, centerCols = []) {
    return new TableRow({
      tableHeader: true,
      children: headers.map((h, ci) =>
        cell(h, { fill: GRUEN, w: colWidths[ci], color: WEISS, bold: true,
          align: centerCols.includes(ci) ? AlignmentType.CENTER : undefined })),
    });
  }

  // Teil A: Domain | Sichtbarkeit | im Vergleich (Balken) | Klicks/Monat | Keywords
  // Alle Wettbewerber, Zieldomain als letzte Zeile fett.
  const A_COLS = [2500, 1350, 2050, 1869, 1869]; // Summe 9638
  function sistrixTableA() {
    if (!sistrixData) return null;
    const main = {
      domain: sistrixData.domain, visibility: sistrixData.visibility,
      clicks: sistrixData.totalClicks, keywords: sistrixData.totalKeywords, isMain: true,
    };
    const comps = (sistrixData.competitors || []).map(c => ({
      domain: c.domain, visibility: c.visibility, clicks: c.totalClicks, keywords: c.totalKeywords, isMain: false,
    }));
    const sorted = comps.sort((a, b) => (b.visibility ?? 0) - (a.visibility ?? 0));
    const ordered = [...sorted, main]; // Zieldomain immer als letzte Zeile
    const maxVis = Math.max(...ordered.map(d => Number(d.visibility) || 0), 0.0001);
    const rows = ordered.map(d => new TableRow({ children: [
      cell(d.domain, { fill: HELLGR, w: A_COLS[0], bold: d.isMain }),
      cell(fmtVis(d.visibility), { fill: HELLGR, w: A_COLS[1], bold: d.isMain, align: AlignmentType.CENTER }),
      barCell(d.visibility, maxVis, A_COLS[2], d.isMain),
      cell(fmtNum(d.clicks), { fill: HELLGR, w: A_COLS[3], bold: d.isMain, align: AlignmentType.CENTER }),
      cell(fmtNum(d.keywords), { fill: HELLGR, w: A_COLS[4], bold: d.isMain, align: AlignmentType.CENTER }),
    ] }));
    return new Table({
      width: { size: CONT_W, type: WidthType.DXA }, columnWidths: A_COLS,
      layout: TableLayoutType.FIXED,
      rows: [headerRow(['Domain', 'Sichtbarkeit', 'im Vergleich', 'Klicks/Monat', 'Keywords'], A_COLS, [1, 3, 4]), ...rows],
    });
  }

  // Teil B: Domain | Sichtbarkeitsindex | im Vergleich (Balken) | Keywords
  const B_COLS = [3000, 2200, 2400, 2038]; // Summe 9638
  function sistrixTableB(domains) {
    if (!sistrixData) return null;
    const map = {};
    map[sistrixData.domain] = { vis: sistrixData.visibility, kw: sistrixData.totalKeywords };
    (sistrixData.competitors || []).forEach(c => { map[c.domain] = { vis: c.visibility, kw: c.totalKeywords }; });
    const norm = (d) => String(d || '').replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '').toLowerCase();
    const mainNorm = norm(sistrixData.domain);
    const list = (domains && domains.length ? domains : Object.keys(map)).map(norm);
    const seen = new Set();
    const picked = [];
    list.forEach(d => {
      if (seen.has(d)) return;
      seen.add(d);
      const hit = map[d] || map[Object.keys(map).find(k => norm(k) === d)];
      if (!hit) return;
      picked.push({ domain: d, vis: hit.vis, kw: hit.kw, isMain: d === mainNorm });
    });
    if (picked.length === 0) return null;
    const maxVis = Math.max(...picked.map(d => Number(d.vis) || 0), 0.0001);
    const rows = picked.map(d => new TableRow({ children: [
      cell(d.domain, { fill: HELLGR, w: B_COLS[0], bold: d.isMain }),
      cell(fmtVis(d.vis), { fill: HELLGR, w: B_COLS[1], bold: d.isMain, align: AlignmentType.CENTER }),
      barCell(d.vis, maxVis, B_COLS[2], d.isMain),
      cell(fmtNum(d.kw), { fill: HELLGR, w: B_COLS[3], bold: d.isMain, align: AlignmentType.CENTER }),
    ] }));
    return new Table({
      width: { size: CONT_W, type: WidthType.DXA }, columnWidths: B_COLS,
      layout: TableLayoutType.FIXED,
      rows: [headerRow(['Domain', 'Sichtbarkeitsindex', 'im Vergleich', 'Rankende Keywords'], B_COLS, [1, 3]), ...rows],
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // DOKUMENT-AUFBAU
  // ══════════════════════════════════════════════════════════════════════════
  const A = dossier.teilA || {};
  const B = dossier.teilB || {};
  const firma = dossier.firma || 'Mandant';
  const ansprech = dossier.ansprechpartner && dossier.ansprechpartner !== '(unbekannt)'
    ? dossier.ansprechpartner : '';
  const monatJahr = dossier.monatJahr || new Date().toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });

  const body = [];

  // ── Titelblock Teil A ───────────────────────────────────────────────────────
  body.push(title(`Berater- und Mandantendossier: ${firma}`));
  body.push(subtitle('Intern · Lage, Befunde, Daten und Gesprächsdrehbuch'));
  body.push(metaline(`Clemens Gutmann · be nice Managementberatung · ${monatJahr}`));
  if (A.kernsatz) body.push(accentBox(A.kernsatz));

  // ── 1 · Cockpit ─────────────────────────────────────────────────────────────
  body.push(h1('1 · Cockpit'));
  const ck = A.cockpit || {};
  const cockpitRows = [
    ['Unternehmen', ck.unternehmen],
    ['Ansprechpartner', ck.ansprechpartner],
    ['Lage in einem Satz', ck.lage],
    ['Score', ck.score],
    ['Attraktivität', ck.attraktivitaet],
    ['Nächster Schritt', ck.naechsterSchritt],
  ];
  cockpitRows.forEach(([l, c]) => { if (c) { body.push(infoBox(l, c)); body.push(gap(60)); } });

  // ── 2 · Befunde ─────────────────────────────────────────────────────────────
  body.push(h1('2 · Befunde'));
  body.push(p('Jeder Befund steht genau einmal. Grau bleibt bei mir, Grün darf ins Gespräch.'));
  (A.befunde || []).forEach(bf => {
    if (!bf) return;
    body.push(h2(bf.titel || 'Befund'));
    if (bf.beleg) body.push(p(bf.beleg));
    if (bf.intern) { body.push(internBox(bf.intern)); body.push(gap(40)); }
    if (bf.gespraech) { body.push(gespraechBox(bf.gespraech)); body.push(gap(80)); }
  });

  // ── 3 · Datenblatt ──────────────────────────────────────────────────────────
  body.push(h1('3 · Datenblatt'));
  const db = A.datenblatt || {};

  body.push(h2('Digitaler Wettbewerb (SISTRIX)'));
  const tA = sistrixTableA();
  if (tA) body.push(tA);
  else body.push(p('Keine SISTRIX-Daten verfügbar.'));
  if (db.wettbewerbErgaenzung) { body.push(gap(40)); body.push(p(db.wettbewerbErgaenzung, { run: { italics: true } })); }

  body.push(h2('Markt und Trends in Kürze (alles H)'));
  if (Array.isArray(db.marktTrends) && db.marktTrends.length) {
    const rows = db.marktTrends.slice(0, 5).map(t => [
      { text: t.thema || '', bold: false }, { text: t.aussage || '' },
    ]);
    body.push(dataTable(['Thema', 'Kernaussage'], rows, [2800, CONT_W - 2800]));
  }

  body.push(h2('Förderhebel'));
  if (Array.isArray(db.foerderhebel) && db.foerderhebel.length) {
    const rows = db.foerderhebel.map(f => [
      { text: f.programm || '' }, { text: f.hebel || '' }, { text: f.einsatz || '' },
    ]);
    body.push(dataTable(['Programm', 'Hebel', 'Einsatz im Mandat'], rows, [2600, 2600, CONT_W - 5200]));
  }

  // ── 4 · Gesprächsdrehbuch ───────────────────────────────────────────────────
  body.push(h1('4 · Gesprächsdrehbuch'));
  const dr = A.drehbuch || {};
  if (dr.hauptthema) { body.push(h2('Hauptthema')); body.push(p(dr.hauptthema)); }
  if (dr.dramaturgie) { body.push(h2('Dramaturgie')); body.push(p(dr.dramaturgie)); }
  if (Array.isArray(dr.einwaende) && dr.einwaende.length) {
    body.push(h2('Einwände'));
    dr.einwaende.forEach(e => {
      if (!e) return;
      body.push(p(`**„${(e.zitat || '').replace(/^[„"]|[""]$/g, '')}“** ${e.antwort || ''}`));
    });
  }
  if (dr.tabu) { body.push(h2('Tabu im Erstgespräch')); body.push(p(dr.tabu)); }
  if (dr.nachGespraech) { body.push(h2('Nach dem Gespräch')); body.push(p(dr.nachGespraech)); }

  // ── Übergang Teil B + harter Seitenumbruch ─────────────────────────────────
  body.push(h1('Teil B · Kundenteil (abtrennbar)'));
  if (A.teilBUebergang) body.push(p(A.teilBUebergang));
  body.push(new Paragraph({ children: [new PageBreak()] }));

  // ── Teil B Titelblock ───────────────────────────────────────────────────────
  body.push(title('Digitaler Sichtbarkeits-Check'));
  body.push(subtitle(`${firma} · Kurzdossier`));
  body.push(metaline(`Für ${ansprech || firma} · Clemens Gutmann, be nice Managementberatung · ${monatJahr}`));
  if (B.akzentbox) body.push(accentBox(B.akzentbox));

  // 1. Szene
  const sz = B.szene || {};
  if (sz.titel) body.push(h1(sz.titel));
  (sz.absaetze || []).forEach(a => { if (a) body.push(p(a)); });

  // 2. Die Zahlen
  body.push(h1('Die Zahlen'));
  const zn = B.zahlen || {};
  if (zn.intro) body.push(p(zn.intro));
  const tB = sistrixTableB(zn.domains);
  if (tB) { body.push(gap(40)); body.push(tB); body.push(gap(40)); }
  (zn.nach || []).forEach(a => { if (a) body.push(p(a)); });

  // 3. Was das für Sie bedeutet
  body.push(h1('Was das für Sie bedeutet'));
  (B.bedeutung || []).forEach(a => { if (a) body.push(p(a)); });

  // 4. Drei Hebel
  body.push(h1('Drei Hebel, die schnell wirken'));
  const hb = B.hebel || {};
  (hb.items || []).forEach(a => { if (a) body.push(p(a)); });
  if (hb.foerder) { body.push(gap(40)); body.push(p(hb.foerder)); }
  if (hb.naechsterSchritt) {
    body.push(new Paragraph({
      children: [new TextRun({ text: 'Nächster Schritt', font: 'Calibri', size: 24, bold: true, color: GRUEN })],
      spacing: { before: 240, after: 80 },
    }));
    body.push(p(hb.naechsterSchritt));
  }
  if (hb.kontakt) body.push(p(`**${hb.kontakt}**`, { run: { color: TUERKIS } }));

  // ── Dokument zusammensetzen ─────────────────────────────────────────────────
  return new Document({
    sections: [{
      properties: {
        page: {
          size: { width: PAGE_W, height: PAGE_H },
          // Ränder exakt wie Goldstandard: 2 cm rundum, Header/Footer bei 708 DXA
          margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN, header: 708, footer: 708 },
        },
      },
      headers: { default: docHeader },
      footers: { default: docFooter },
      children: body,
    }],
  });
}

// ── Browser-Export: Logo laden, Dokument bauen, Download auslösen ──────────────
export async function exportToDossier({ dossier, sistrixData }) {
  const Docx = await import('docx');

  let logoData = null;
  try {
    const resp = await fetch('/logo.png');
    if (resp.ok) logoData = await resp.arrayBuffer();
  } catch (_) {}

  const doc = buildDossierDocument({ Docx, dossier, sistrixData, logoData });
  const blob = await Docx.Packer.toBlob(doc);
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = dossierFilename(dossier.firma);
  a.click();
}
