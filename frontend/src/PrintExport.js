import html2canvas from 'html2canvas';

// ── Helpers ───────────────────────────────────────────────────────────────────

function escHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Generate a consistent slug ID from heading text
function slugId(text) {
  // Strip {#custom-id} if present
  const custom = text.match(/\{#([a-z0-9-]+)\}$/);
  if (custom) return custom[1];
  return text
    .toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// Strip {#id} suffix from display text
function cleanHeadingText(text) {
  return text.replace(/\s*\{#[a-z0-9-]+\}\s*$/, '').trim();
}

function inlineMarkdown(s) {
  return s
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\(#([^)]+)\)/g, '<a href="#$2">$1</a>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$1" target="_blank">$2</a>');
}

function parseMarkdown(md) {
  const lines = md.split('\n');
  const html = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (/^# /.test(line)) {
      const raw = line.slice(2).trim();
      const id = slugId(raw);
      const text = cleanHeadingText(raw);
      html.push(`<h1 id="${id}">${inlineMarkdown(escHtml(text))}</h1>`);
      i++; continue;
    }
    if (/^## /.test(line)) {
      const raw = line.slice(3).trim();
      const id = slugId(raw);
      const text = cleanHeadingText(raw);
      html.push(`<h2 id="${id}">${inlineMarkdown(escHtml(text))}</h2>`);
      i++; continue;
    }
    if (/^### /.test(line)) {
      const raw = line.slice(4).trim();
      const text = cleanHeadingText(raw);
      html.push(`<h3>${inlineMarkdown(escHtml(text))}</h3>`);
      i++; continue;
    }
    if (/^---+$/.test(line.trim())) {
      html.push('<hr>');
      i++; continue;
    }
    if (/^\|/.test(line)) {
      const rows = [];
      while (i < lines.length && /^\|/.test(lines[i])) { rows.push(lines[i]); i++; }
      html.push('<table>');
      rows.forEach((row, ri) => {
        if (/^\|[-| :]+\|/.test(row)) return;
        const cells = row.split('|').slice(1, -1).map(c => c.trim());
        const tag = ri === 0 ? 'th' : 'td';
        html.push('<tr>' + cells.map(c => `<${tag}>${inlineMarkdown(escHtml(c))}</${tag}>`).join('') + '</tr>');
      });
      html.push('</table>');
      continue;
    }
    if (/^[-*] /.test(line)) {
      html.push('<ul>');
      while (i < lines.length && /^[-*] /.test(lines[i])) {
        html.push(`<li>${inlineMarkdown(escHtml(lines[i].slice(2).trim()))}</li>`);
        i++;
      }
      html.push('</ul>');
      continue;
    }
    if (/^\d+\. /.test(line)) {
      html.push('<ol>');
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        html.push(`<li>${inlineMarkdown(escHtml(lines[i].replace(/^\d+\.\s*/, '').trim()))}</li>`);
        i++;
      }
      html.push('</ol>');
      continue;
    }
    if (/^> /.test(line)) {
      html.push(`<blockquote>${inlineMarkdown(escHtml(line.slice(2).trim()))}</blockquote>`);
      i++; continue;
    }
    if (line.trim() === '') { i++; continue; }
    html.push(`<p>${inlineMarkdown(escHtml(line.trim()))}</p>`);
    i++;
  }

  return html.join('\n');
}

// ── TOC extraction ─────────────────────────────────────────────────────────────
// Scans both # (H1) and ## (H2), builds a two-level TOC

function extractHeadings(md) {
  const headings = [];
  for (const line of md.split('\n')) {
    if (/^# /.test(line)) {
      const raw = line.slice(2).trim();
      const id = slugId(raw);
      const label = cleanHeadingText(raw);
      // Skip document title (first H1) and "Inhaltsverzeichnis"
      if (label.toLowerCase().includes('inhaltsverzeichnis')) continue;
      headings.push({ id, label, level: 1 });
    } else if (/^## /.test(line)) {
      const raw = line.slice(3).trim();
      const id = slugId(raw);
      const label = cleanHeadingText(raw);
      if (label.toLowerCase().includes('inhaltsverzeichnis')) continue;
      headings.push({ id, label, level: 2 });
    }
  }
  // Remove the very first H1 (document title)
  const firstH1 = headings.findIndex(h => h.level === 1);
  if (firstH1 === 0) headings.shift();
  return headings;
}

// ── Print HTML builder ─────────────────────────────────────────────────────────

function buildPrintHtml({ chartImage, reportHtml, companyName, url, today, title }) {
  const docTitle = title || 'Strategieanalyse';

  // Build TOC from already-rendered markdown (we pass raw md separately)
  // Note: tocHtml is passed in as pre-built HTML string
  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<title>${docTitle} – ${escHtml(companyName || url || '')}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Calibri, 'Segoe UI', sans-serif; font-size: 11pt; color: #454544; background: white; padding: 2cm; padding-bottom: 3cm; }

  /* Print notice — screen only */
  .print-notice { background: #f0f8e8; border-left: 4px solid #8CC63E; padding: 10px 16px; margin-bottom: 20px; border-radius: 0 5px 5px 0; font-size: 10pt; color: #454544; }
  @media print { .print-notice { display: none; } }

  /* Header */
  .doc-header { border-bottom: 4px solid #8CC63E; padding: 14px 0; display: flex; justify-content: space-between; align-items: center; margin-bottom: 28px; }
  .doc-header-title { font-size: 15pt; font-weight: 700; color: #454544; }
  .doc-header-meta { font-size: 9pt; color: #777; text-align: right; line-height: 1.6; }

  /* TOC */
  .toc { background: #f5fbee; border-left: 4px solid #8CC63E; padding: 14px 20px; margin-bottom: 32px; border-radius: 0 6px 6px 0; page-break-inside: avoid; }
  .toc-title { font-size: 10pt; font-weight: 700; color: #8CC63E; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px; }
  .toc ul { list-style: none; padding-left: 0; margin: 0; }
  .toc ul ul { padding-left: 18px; margin-top: 3px; }
  .toc li { margin: 3px 0; font-size: 10pt; }
  .toc li.toc-h1 > a { font-weight: 700; color: #454544; }
  .toc li.toc-h2 > a { font-weight: 400; color: #13A1B6; }
  .toc a { text-decoration: none; }
  .toc a:hover { text-decoration: underline; }

  /* Charts */
  .charts-section { margin-bottom: 32px; page-break-inside: avoid; }
  .charts-section img { max-width: 100%; border-radius: 6px; border: 1px solid #E9E9E9; }
  .section-label { font-size: 9pt; font-weight: 700; color: #777; text-transform: uppercase; letter-spacing: 0.4px; margin-bottom: 8px; }

  /* Content */
  h1 { font-size: 15pt; font-weight: 700; color: #454544; margin: 28px 0 8px; padding-bottom: 6px; border-bottom: 3px solid #8CC63E; }
  h2 { font-size: 12pt; font-weight: 700; color: #454544; margin: 22px 0 7px; }
  h3 { font-size: 11pt; font-weight: 700; color: #33AB97; margin: 14px 0 5px; }
  p { line-height: 1.65; margin: 5px 0; }
  ul, ol { padding-left: 20px; margin: 7px 0; }
  li { line-height: 1.6; margin: 2px 0; }
  strong { font-weight: 700; }
  em { font-style: italic; color: #666; }
  code { font-family: monospace; background: #f0f0f0; padding: 1px 4px; border-radius: 3px; font-size: 9.5pt; }
  blockquote { border-left: 3px solid #8CC63E; padding: 6px 12px; background: #f5fbee; margin: 10px 0; font-style: italic; color: #555; border-radius: 0 4px 4px 0; }
  hr { border: none; border-top: 1px solid #E9E9E9; margin: 18px 0; }
  table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 10pt; }
  th { background: #E9E9E9; padding: 7px 10px; text-align: left; font-weight: 700; border-bottom: 2px solid #ccc; }
  td { padding: 6px 10px; border-bottom: 1px solid #E9E9E9; vertical-align: top; }
  tr:nth-child(even) td { background: #fafafa; }
  a { color: #13A1B6; }

  /* Footer — print only */
  .print-footer {
    display: none;
  }
  @media print {
    body { font-size: 10pt; padding: 0; }
    @page { margin: 2cm 2cm 2.5cm; }
    .print-footer {
      display: flex;
      position: fixed;
      bottom: 0; left: 0; right: 0;
      height: 1.2cm;
      padding: 0 2cm;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid #E9E9E9;
      background: white;
      font-size: 8pt;
      color: #777;
    }
    .print-footer .page-num::after {
      content: "Seite " counter(page);
    }
  }
</style>
</head>
<body>

<div class="print-notice">
  <strong>Tipp für den PDF-Export:</strong> Im Druckdialog → "Weitere Einstellungen" → <strong>"Kopf- und Fußzeilen"</strong> deaktivieren, um "about:blank" zu entfernen.
</div>

<div class="doc-header">
  <div>
    <div class="doc-header-title">${escHtml(docTitle)}</div>
    <div style="font-size:10pt;color:#777;margin-top:3px;">${escHtml(companyName || url || '')}</div>
  </div>
  <div class="doc-header-meta">
    Clemens Gutmann | be nice Managementberatung<br>
    www.nice-network.de<br>
    ${escHtml(today)}
  </div>
</div>

${chartImage ? `
<div class="charts-section" id="grafischer-ueberblick">
  <div class="section-label">SISTRIX-Ergebnisse</div>
  <img src="${chartImage}" alt="SISTRIX-Ergebnisse">
</div>
` : ''}

<div class="report-body">
__REPORT_HTML__
</div>

<div class="print-footer">
  <span>Clemens Gutmann | be nice Managementberatung | www.nice-network.de</span>
  <span class="page-num"></span>
</div>

</body>
</html>`;
}

function buildTocHtml(headings, chartImage) {
  if (headings.length === 0 && !chartImage) return '';

  let items = '';
  let inSublist = false;

  if (chartImage) {
    items += `<li class="toc-h2"><a href="#grafischer-ueberblick">SISTRIX-Ergebnisse</a></li>`;
  }

  for (const h of headings) {
    if (h.level === 1) {
      if (inSublist) { items += '</ul></li>'; inSublist = false; }
      items += `<li class="toc-h1"><a href="#${h.id}">${escHtml(h.label)}</a>`;
    } else {
      if (!inSublist) { items += '<ul>'; inSublist = true; }
      items += `<li class="toc-h2"><a href="#${h.id}">${escHtml(h.label)}</a></li>`;
    }
  }
  if (inSublist) items += '</ul></li>';
  else if (items.endsWith('</a>')) items += '</li>';

  return `<div class="toc"><div class="toc-title">Inhaltsverzeichnis</div><ul>${items}</ul></div>`;
}

// ── PDF Export ─────────────────────────────────────────────────────────────────

export async function exportToPDF({ chartCardRef, report, url, companyName, title }) {
  const today = new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });

  let chartImage = null;
  if (chartCardRef?.current) {
    try {
      const canvas = await html2canvas(chartCardRef.current, { scale: 1.5, useCORS: true, logging: false, backgroundColor: '#ffffff' });
      chartImage = canvas.toDataURL('image/png');
    } catch (e) { console.warn('Chart capture failed:', e); }
  }

  const headings = extractHeadings(report || '');
  const tocHtml = buildTocHtml(headings, chartImage);
  const reportHtml = parseMarkdown(report || '');

  const template = buildPrintHtml({ chartImage, reportHtml, companyName, url, today, title });
  // Inject TOC before report body
  const html = template.replace('__REPORT_HTML__', tocHtml + reportHtml);

  const win = window.open('', '_blank', 'width=900,height=700');
  if (!win) { alert('Bitte Popup-Blocker deaktivieren für PDF-Export.'); return; }
  win.document.open();
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 700);
}

// ── Word Export (.docx) ────────────────────────────────────────────────────────

export async function exportToWord({ report, url, companyName, title }) {
  const { Document, Packer, Paragraph, TextRun, HeadingLevel, BorderStyle, AlignmentType, Table, TableRow, TableCell, WidthType, ShadingType } = await import('docx');

  const today = new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const docTitle = title || 'Strategieanalyse';

  const GREEN   = '8CC63E';
  const DARKGR  = '454544';
  const TEAL    = '33AB97';
  const MIDGR   = '777777';
  const LIGHTGR = 'E9E9E9';

  function h1Para(text) {
    return new Paragraph({
      children: [new TextRun({ text: cleanHeadingText(text), bold: true, color: DARKGR, size: 32, font: 'Calibri' })],
      spacing: { before: 320, after: 120 },
      border: { bottom: { color: GREEN, space: 1, style: BorderStyle.SINGLE, size: 12 } },
    });
  }
  function h2Para(text) {
    return new Paragraph({
      children: [new TextRun({ text: cleanHeadingText(text), bold: true, color: TEAL, size: 24, font: 'Calibri' })],
      spacing: { before: 240, after: 80 },
    });
  }
  function h3Para(text) {
    return new Paragraph({
      children: [new TextRun({ text: cleanHeadingText(text), bold: true, color: TEAL, size: 22, font: 'Calibri' })],
      spacing: { before: 180, after: 60 },
    });
  }
  function parseInline(text) {
    const segs = [];
    const re = /\*\*(.+?)\*\*|\*(.+?)\*/g;
    let last = 0, m;
    while ((m = re.exec(text)) !== null) {
      if (m.index > last) segs.push({ text: text.slice(last, m.index), bold: false, italic: false });
      if (m[1]) segs.push({ text: m[1], bold: true, italic: false });
      else if (m[2]) segs.push({ text: m[2], bold: false, italic: true });
      last = re.lastIndex;
    }
    if (last < text.length) segs.push({ text: text.slice(last), bold: false, italic: false });
    return segs.length ? segs : [{ text, bold: false, italic: false }];
  }
  function txtPara(text, opts = {}) {
    return new Paragraph({
      children: parseInline(text).map(seg => new TextRun({ text: seg.text, bold: seg.bold || opts.bold, italics: seg.italic || opts.italic, color: DARKGR, size: 20, font: 'Calibri' })),
      spacing: { before: 40, after: 40 },
    });
  }
  function bulletPara(text) {
    return new Paragraph({
      children: parseInline(text).map(seg => new TextRun({ text: seg.text, bold: seg.bold, italics: seg.italic, color: DARKGR, size: 20, font: 'Calibri' })),
      bullet: { level: 0 },
      spacing: { before: 20, after: 20 },
    });
  }
  function numPara(text) {
    return new Paragraph({
      children: parseInline(text).map(seg => new TextRun({ text: seg.text, bold: seg.bold, italics: seg.italic, color: DARKGR, size: 20, font: 'Calibri' })),
      numbering: { reference: 'default-numbering', level: 0 },
      spacing: { before: 20, after: 20 },
    });
  }
  function hrPara() {
    return new Paragraph({
      children: [new TextRun({ text: '' })],
      border: { bottom: { color: LIGHTGR, style: BorderStyle.SINGLE, size: 6, space: 1 } },
      spacing: { before: 120, after: 120 },
    });
  }

  const headerSection = [
    new Paragraph({
      children: [new TextRun({ text: docTitle, bold: true, color: DARKGR, size: 36, font: 'Calibri' })],
      spacing: { before: 0, after: 80 },
      border: { bottom: { color: GREEN, style: BorderStyle.SINGLE, size: 16, space: 1 } },
    }),
    new Paragraph({
      children: [new TextRun({ text: companyName || url || '', color: DARKGR, size: 24, font: 'Calibri' })],
      spacing: { before: 80, after: 40 },
    }),
    new Paragraph({
      children: [new TextRun({ text: `Clemens Gutmann | be nice Managementberatung | ${today}`, color: MIDGR, size: 18, font: 'Calibri', italics: true })],
      spacing: { before: 0, after: 240 },
    }),
  ];

  const lines = (report || '').split('\n');
  const body = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (/^# /.test(line)) { body.push(h1Para(line.slice(2).trim())); i++; continue; }
    if (/^## /.test(line)) { body.push(h2Para(line.slice(3).trim())); i++; continue; }
    if (/^### /.test(line)) { body.push(h3Para(line.slice(4).trim())); i++; continue; }
    if (/^---+$/.test(line.trim())) { body.push(hrPara()); i++; continue; }
    if (/^[-*] /.test(line)) {
      while (i < lines.length && /^[-*] /.test(lines[i])) { body.push(bulletPara(lines[i].slice(2).trim())); i++; }
      continue;
    }
    if (/^\d+\. /.test(line)) {
      while (i < lines.length && /^\d+\. /.test(lines[i])) { body.push(numPara(lines[i].replace(/^\d+\.\s*/, '').trim())); i++; }
      continue;
    }
    if (/^\|/.test(line)) {
      const rows = [];
      while (i < lines.length && /^\|/.test(lines[i])) { rows.push(lines[i]); i++; }
      const parsed = rows.filter(r => !/^\|[-| :]+\|$/.test(r.trim())).map(r => r.split('|').slice(1, -1).map(c => c.trim()));
      if (parsed.length > 0) {
        const colCount = Math.max(...parsed.map(r => r.length));
        const docRows = parsed.map((cells, ri) => new TableRow({
          children: cells.map(cell => new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: cell, bold: ri === 0, color: DARKGR, size: 18, font: 'Calibri' })], spacing: { before: 30, after: 30 } })],
            shading: ri === 0 ? { fill: LIGHTGR, type: ShadingType.SOLID } : undefined,
            width: { size: Math.floor(9000 / colCount), type: WidthType.DXA },
          }))
        }));
        body.push(new Table({ rows: docRows, width: { size: 9000, type: WidthType.DXA } }));
        body.push(new Paragraph({ children: [], spacing: { before: 80, after: 80 } }));
      }
      continue;
    }
    if (line.trim() === '') { body.push(new Paragraph({ children: [], spacing: { before: 40, after: 40 } })); i++; continue; }
    body.push(txtPara(line.trim()));
    i++;
  }

  const doc = new Document({
    numbering: { config: [{ reference: 'default-numbering', levels: [{ level: 0, format: 'decimal', text: '%1.', alignment: AlignmentType.LEFT }] }] },
    sections: [{ children: [...headerSection, ...body] }],
  });

  const blob = await Packer.toBlob(doc);
  const a = document.createElement('a');
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const safeName = (companyName || 'Analyse').replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30);
  const docTypeSlug = (title || 'Strategieanalyse').replace(/[^a-zA-Z0-9]/g, '_').slice(0, 20);
  a.href = URL.createObjectURL(blob);
  a.download = `${date}_${safeName}_${docTypeSlug}.docx`;
  a.click();
}
