// ============================================================
// PRISM Email Template v1.0 — Structured HTML email, mobile-first, inline CSS
// ============================================================

import { marked } from 'marked';

const SECTION_BORDERS = {
  'the signal': '#dc2626',
  'pioneer advantage': '#7c3aed',
  'tools to try': '#2563eb',
  'build watch': '#ea580c',
  'europe lens': '#003399',
  "today's priorities": '#16a34a',
  'trend tracker': '#6b7280',
};

function getSectionColor(headerText) {
  const lower = (headerText || '').toLowerCase().replace(/[🔴📊🛠️🏗️🇪🇺🎯📈]/g, '').trim();
  for (const [key, color] of Object.entries(SECTION_BORDERS)) {
    if (lower.includes(key)) return color;
  }
  return '#6b7280';
}

/**
 * Convert markdown briefing to HTML with section cards (left border accent).
 * All CSS inline for email client compatibility.
 * Returns full HTML document string.
 */
export function renderEmail(briefingMarkdown, date) {
  const parts = briefingMarkdown.split(/\n(?=##\s)/);
  const sections = [];
  let firstBlock = '';

  for (let i = 0; i < parts.length; i++) {
    const raw = parts[i].trim();
    if (!raw) continue;
    const firstLineEnd = raw.indexOf('\n');
    const firstLine = firstLineEnd > 0 ? raw.slice(0, firstLineEnd) : raw;
    const body = firstLineEnd > 0 ? raw.slice(firstLineEnd + 1).trim() : '';
    const headerText = firstLine.replace(/^##\s*/, '').trim();
    const color = getSectionColor(headerText);
    const bodyHtml = body ? marked.parse(body, { gfm: true }) : '';
    const headerHtml = marked.parse(firstLine, { gfm: true }).replace(/^<p>|<\/p>$/g, '');

    if (i === 0) {
      firstBlock = headerHtml;
      if (body) sections.push({ color: getSectionColor(body.slice(0, 80)), body: bodyHtml });
      continue;
    }
    sections.push({
      color,
      header: headerHtml,
      body: bodyHtml,
    });
  }

  const baseStyle = 'font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;font-size:15px;line-height:1.6;color:#1a1a1a;margin:0;';
  const cardStyle = 'background:#fafafa;border-left:4px solid {{color}};padding:14px 16px;margin:16px 0;border-radius:0 6px 6px 0;';
  const linkStyle = 'color:#2563eb;text-decoration:underline;';
  const tableStyle = 'width:100%;border-collapse:collapse;margin:12px 0;font-size:14px;';
  const thStyle = 'text-align:left;padding:10px 12px;background:#f1f5f9;border-bottom:2px solid #e2e8f0;font-weight:600;';
  const tdStyle = 'padding:10px 12px;border-bottom:1px solid #e2e8f0;';
  const tdAltStyle = 'padding:10px 12px;border-bottom:1px solid #e2e8f0;background:#f8fafc;';

  // Inline styles into marked output (tables and links)
  function inlineSection(html) {
    let out = (html || '')
      .replace(/<a /g, `<a style="${linkStyle}" `)
      .replace(/<table/g, `<table style="${tableStyle}" `)
      .replace(/<th/g, `<th style="${thStyle}" `)
      .replace(/<td/g, `<td style="${tdStyle}" `);
    let rowIndex = 0;
    out = out.replace(/<tr>/g, () => {
      const isOdd = rowIndex++ % 2 === 1;
      return isOdd ? `<tr style="background:#f8fafc;">` : '<tr>';
    });
    return out;
  }

  const sectionHtml = sections
    .map((s) => {
      const cardCss = cardStyle.replace('{{color}}', s.color);
      const inner = (s.header ? `<div style="font-size:18px;font-weight:700;margin-bottom:10px;">${s.header}</div>` : '') + inlineSection(s.body);
      return `<div style="${cardCss}">${inner}</div>`;
    })
    .join('\n');

  const headerBlock = firstBlock
    ? `<div style="font-size:22px;font-weight:700;margin-bottom:8px;">${firstBlock}</div>`
    : '';

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="${baseStyle}max-width:600px;margin:0 auto;padding:20px;background:#ffffff;">
  <div style="background:#1a1a1a;color:#fff;padding:20px 24px;margin:-20px -20px 24px -20px;border-radius:0;">
    <div style="font-size:20px;font-weight:700;letter-spacing:0.02em;">PRISM</div>
    <div style="font-size:12px;color:#a3a3a3;margin-top:4px;">Personal Research Intelligence · ${date}</div>
  </div>
  ${headerBlock}
  ${sectionHtml}
  <div style="margin-top:32px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:12px;color:#9ca3af;">
    PRISM v1.0 — Built by Julien · Powered by Claude · ${date}
  </div>
</body>
</html>`;
}
