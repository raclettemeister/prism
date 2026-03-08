// ============================================================
// PRISM v5.0 Email Templates
// ============================================================

import { marked } from 'marked';
import { extractSection } from './briefing-format.js';

const SECTION_BORDERS = {
  'the signal': '#dc2626',
  'must-read': '#9333ea',
  'action audit': '#f59e0b',
  'cross-domain radar': '#2563eb',
  'theme of the day': '#0f766e',
  "today's priorities": '#16a34a',
  'next 3 days': '#6b7280',
};
const SECTION_BACKGROUNDS = {
  'theme of the day': '#f0fdfa',
  'cross-domain radar': '#eff6ff',
};

function getSectionColor(headerText) {
  const lower = (headerText || '').toLowerCase().replace(/[🔴📊🛠️🏗️🇪🇺🎯📈🔬📚⏪🚮🌍🔄📡💬]/g, '').trim();
  for (const [key, color] of Object.entries(SECTION_BORDERS)) {
    if (lower.includes(key)) return color;
  }
  return '#6b7280';
}

function getSectionBackground(headerText) {
  const lower = (headerText || '').toLowerCase().replace(/[🔴📊🛠️🏗️🇪🇺🎯📈🔬📚⏪🚮🌍🔄📡💬]/g, '').trim();
  for (const [key, bg] of Object.entries(SECTION_BACKGROUNDS)) {
    if (lower.includes(key)) return bg;
  }
  return null;
}

/**
 * Convert a full briefing markdown file to styled HTML with section cards.
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
      if (body) sections.push({ color: getSectionColor(body.slice(0, 80)), background: getSectionBackground(body.slice(0, 80)), body: bodyHtml });
      continue;
    }
    sections.push({
      color,
      background: getSectionBackground(headerText),
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
      const cardBg = s.background || '#fafafa';
      const cardCss = cardStyle.replace('{{color}}', s.color).replace('background:#fafafa', `background:${cardBg}`);
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
    PRISM v5.0 · ${date}
  </div>
</body>
</html>`;
}

/**
 * Digest email: self-contained summary of the 7-section v5 briefing.
 * Returns { html, text }.
 */
export function renderDigestEmail(briefingMarkdown, dateStr, stats = {}) {
  const signal = sectionBody(briefingMarkdown, '## 🔴 THE SIGNAL');
  const mustReads = sectionBody(briefingMarkdown, '## 📚 MUST-READS');
  const priorities = sectionBody(briefingMarkdown, '## 🎯 TODAY’S PRIORITIES');
  const theme = sectionBody(briefingMarkdown, '## 🧠 THEME OF THE DAY');
  const nextDays = sectionBody(briefingMarkdown, '## ⏭️ NEXT 3 DAYS');
  const conf = stats.confidence != null ? `${(stats.confidence * 100).toFixed(0)}%` : '—';

  const text = [
    `PRISM briefing for ${dateStr}`,
    '',
    `Confidence: ${conf}`,
    '',
    'THE SIGNAL',
    signal,
    '',
    'MUST-READS',
    stripMarkdownBullets(mustReads),
    '',
    'THEME OF THE DAY',
    stripMarkdownBullets(theme),
    '',
    'TODAY’S PRIORITIES',
    stripMarkdownBullets(priorities),
    '',
    'NEXT 3 DAYS',
    stripMarkdownBullets(nextDays),
  ].join('\n');

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:15px;line-height:1.6;color:#1a1a1a;max-width:560px;margin:0 auto;padding:24px;">
  <div style="font-size:18px;font-weight:700;margin-bottom:12px;">PRISM</div>
  <p style="margin:0 0 12px;">Your briefing for ${dateStr} is ready.</p>
  <p style="margin:0 0 16px;color:#4b5563;">Confidence ${conf}.</p>
  <div style="border-left:4px solid #dc2626;padding-left:12px;margin:16px 0;">
    <div style="font-weight:700;margin-bottom:6px;">THE SIGNAL</div>
    ${marked.parse(signal)}
  </div>
  <div style="margin:16px 0;">
    <div style="font-weight:700;margin-bottom:6px;">MUST-READS</div>
    ${marked.parse(mustReads)}
  </div>
  <div style="margin:16px 0;">
    <div style="font-weight:700;margin-bottom:6px;">THEME OF THE DAY</div>
    ${marked.parse(theme)}
  </div>
  <div style="margin:16px 0;">
    <div style="font-weight:700;margin-bottom:6px;">TODAY’S PRIORITIES</div>
    ${marked.parse(priorities)}
  </div>
  <div style="margin:16px 0;">
    <div style="font-weight:700;margin-bottom:6px;">NEXT 3 DAYS</div>
    ${marked.parse(nextDays)}
  </div>
  <p style="margin:24px 0 0;font-size:12px;color:#9ca3af;">PRISM · ${dateStr}</p>
</body>
</html>`;

  return { html, text };
}

function sectionBody(markdown, header) {
  const section = extractSection(markdown, header);
  if (!section) return 'Nothing notable today.';
  return section.replace(/^## .+\n+/m, '').trim() || 'Nothing notable today.';
}

function stripMarkdownBullets(text) {
  return text
    .replace(/\*\*/g, '')
    .replace(/\[link\]\(([^)]+)\)/g, '$1')
    .trim();
}
