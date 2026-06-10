import html2canvas from 'html2canvas';

// ── Markdown → HTML ──────────────────────────────────────────────────────────

function escHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function inlineMarkdown(s) {
  return s
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>');
}

function parseMarkdown(md) {
  const lines = md.split('\n');
  const html = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Heading 1 (# Title)
    if (/^# /.test(line)) {
      html.push(`<h1>${inlineMarkdown(escHtml(line.slice(2).trim()))}</h1>`);
      i++; continue;
    }

    // Heading 2 with anchor (## N. Title)
    if (/^## /.test(line)) {
      const text = line.slice(3).trim();
      const m = text.match(/^(\d+)\./);
      const id = m ? `kapitel-${m[1]}` : text.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      html.push(`<h2 id="${id}">${inlineMarkdown(escHtml(text))}</h2>`);
      i++; continue;
    }

    // Heading 3
    if (/^### /.test(line)) {
      html.push(`<h3>${inlineMarkdown(escHtml(line.slice(4).trim()))}</h3>`);
      i++; continue;
    }

    // Horizontal rule
    if (/^---+$/.test(line.trim())) {
      html.push('<hr>');
      i++; continue;
    }

    // Table
    if (/^\|/.test(line)) {
      const rows = [];
      while (i < lines.length && /^\|/.test(lines[i])) {
        rows.push(lines[i]);
        i++;
      }
      html.push('<table>');
      rows.forEach((row, ri) => {
        if (/^\|[-| :]+\|/.test(row)) return; // separator row
        const cells = row.split('|').slice(1, -1).map(c => c.trim());
        const tag = ri === 0 ? 'th' : 'td';
        html.push('<tr>' + cells.map(c => `<${tag}>${inlineMarkdown(escHtml(c))}</${tag}>`).join('') + '</tr>');
      });
      html.push('</table>');
      continue;
    }

    // Unordered list
    if (/^[-*] /.test(line)) {
      html.push('<ul>');
      while (i < lines.length && /^[-*] /.test(lines[i])) {
        html.push(`<li>${inlineMarkdown(escHtml(lines[i].slice(2).trim()))}</li>`);
        i++;
      }
      html.push('</ul>');
      continue;
    }

    // Ordered list
    if (/^\d+\. /.test(line)) {
      html.push('<ol>');
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        const text = lines[i].replace(/^\d+\.\s*/, '').trim();
        html.push(`<li>${inlineMarkdown(escHtml(text))}</li>`);
        i++;
      }
      html.push('</ol>');
      continue;
    }

    // Blockquote
    if (/^> /.test(line)) {
      html.push(`<blockquote>${inlineMarkdown(escHtml(line.slice(2).trim()))}</blockquote>`);
      i++; continue;
    }

    // Empty line → paragraph break
    if (line.trim() === '') {
      i++; continue;
    }

    // Regular paragraph
    html.push(`<p>${inlineMarkdown(escHtml(line.trim()))}</p>`);
    i++;
  }

  return html.join('\n');
}

// ── TOC extraction ────────────────────────────────────────────────────────────

function extractHeadings(md) {
  const headings = [];
  for (const line of md.split('\n')) {
    if (/^## /.test(line)) {
      const text = line.slice(3).trim();
      const m = text.match(/^(\d+)\./);
      const id = m ? `kapitel-${m[1]}` : text.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      // Strip leading number ("1. ", "12. ") for TOC display — we renumber via <ol>
      const label = text.replace(/^\d+\.\s*/, '');
      headings.push({ id, label });
    }
  }
  return headings;
}

// ── Print HTML builder ────────────────────────────────────────────────────────

function buildPrintHtml({ chartImage, reportHtml, tocHtml, companyName, url, today }) {
  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<title>Strategieanalyse – ${escHtml(companyName || url)}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Calibri, 'Segoe UI', sans-serif; font-size: 11pt; color: #454544; background: white; padding: 2cm; }

  /* Header */
  .doc-header { border-bottom: 4px solid #8CC63E; padding: 14px 20px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 28px; }
  .doc-header-title { font-size: 15pt; font-weight: 700; color: #454544; }
  .doc-header-meta { font-size: 9pt; color: #777; text-align: right; line-height: 1.5; }

  /* TOC */
  .toc { background: #f5fbee; border-left: 4px solid #8CC63E; padding: 16px 20px; margin-bottom: 32px; border-radius: 0 6px 6px 0; page-break-inside: avoid; }
  .toc h2 { font-size: 11pt; font-weight: 700; color: #8CC63E; text-transform: uppercase; letter-spacing: 0.4px; margin-bottom: 10px; }
  .toc ol { padding-left: 20px; }
  .toc li { margin: 4px 0; font-size: 10pt; }
  .toc a { color: #13A1B6; text-decoration: none; }
  .toc a:hover { text-decoration: underline; }

  /* Charts section */
  .charts-section { margin-bottom: 32px; page-break-inside: avoid; }
  .charts-section img { max-width: 100%; border-radius: 6px; border: 1px solid #E9E9E9; }
  .section-label { font-size: 9pt; font-weight: 700; color: #777; text-transform: uppercase; letter-spacing: 0.4px; margin-bottom: 8px; }

  /* Report */
  h1 { font-size: 16pt; font-weight: 700; color: #454544; margin: 24px 0 8px; padding-bottom: 6px; border-bottom: 3px solid #8CC63E; }
  h2 { font-size: 13pt; font-weight: 700; color: #454544; margin: 28px 0 8px; padding-top: 8px; }
  h3 { font-size: 11pt; font-weight: 700; color: #33AB97; margin: 16px 0 6px; }
  p { line-height: 1.6; margin: 6px 0; }
  ul, ol { padding-left: 20px; margin: 8px 0; }
  li { line-height: 1.6; margin: 2px 0; }
  strong { font-weight: 700; }
  em { font-style: italic; color: #777; }
  code { font-family: monospace; background: #f0f0f0; padding: 1px 4px; border-radius: 3px; font-size: 9.5pt; }
  blockquote { border-left: 3px solid #8CC63E; padding: 6px 12px; background: #f5fbee; margin: 10px 0; font-style: italic; color: #555; border-radius: 0 4px 4px 0; }
  hr { border: none; border-top: 1px solid #E9E9E9; margin: 20px 0; }
  table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 10pt; }
  th { background: #E9E9E9; padding: 7px 10px; text-align: left; font-weight: 700; border-bottom: 2px solid #ccc; }
  td { padding: 6px 10px; border-bottom: 1px solid #E9E9E9; vertical-align: top; }
  tr:nth-child(even) td { background: #fafafa; }

  /* Print */
  @media print {
    body { font-size: 10pt; padding: 0; }
    h2 { page-break-before: auto; }
    .charts-section { page-break-after: always; }
    .no-break { page-break-inside: avoid; }
    a { color: inherit; }
  }
  @page { margin: 2cm; }
</style>
</head>
<body>

<div class="doc-header">
  <div>
    <div class="doc-header-title">Alchimedus · Strategieanalyse</div>
    <div style="font-size:10pt;color:#777;margin-top:3px;">${escHtml(companyName || url)}</div>
  </div>
  <div class="doc-header-meta">
    Clemens Gutmann | be nice Managementberatung<br>
    www.nice-network.de<br>
    ${escHtml(today)}
  </div>
</div>

${tocHtml}

${chartImage ? `
<div class="charts-section" id="grafischer-ueberblick">
  <div class="section-label">Sistrix-Ergebnisse</div>
  <img src="${chartImage}" alt="Sistrix-Ergebnisse">
</div>
` : ''}

<div class="report-body">
${reportHtml}
</div>

</body>
</html>`;
}

// ── Main export function ──────────────────────────────────────────────────────

export async function exportToPDF({ chartCardRef, report, url, companyName }) {
  const today = new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });

  // 1. Capture External Intelligence card as image
  let chartImage = null;
  if (chartCardRef?.current) {
    try {
      const canvas = await html2canvas(chartCardRef.current, {
        scale: 1.5,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });
      chartImage = canvas.toDataURL('image/png');
    } catch (e) {
      console.warn('Chart capture failed:', e);
    }
  }

  // 2. Parse headings for TOC
  const headings = extractHeadings(report || '');
  const chartEntry = chartImage
    ? `<li><a href="#grafischer-ueberblick">Grafischer Überblick (Sistrix-Ergebnisse)</a></li>`
    : '';
  const tocHtml = headings.length > 0 ? `
<div class="toc">
  <h2>Inhaltsverzeichnis</h2>
  <ol>
    ${chartEntry}
    ${headings.map(h => `<li><a href="#${h.id}">${escHtml(h.label)}</a></li>`).join('\n    ')}
  </ol>
</div>` : '';

  // 3. Convert report markdown to HTML
  const reportHtml = parseMarkdown(report || '');

  // 4. Build and open print window
  const html = buildPrintHtml({ chartImage, reportHtml, tocHtml, companyName, url, today });

  const win = window.open('', '_blank', 'width=900,height=700');
  if (!win) {
    alert('Bitte Popup-Blocker deaktivieren für PDF-Export.');
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
  win.focus();
  // Small delay so images load before print dialog
  setTimeout(() => win.print(), 600);
}
