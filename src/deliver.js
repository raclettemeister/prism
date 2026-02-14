// ============================================================
// PRISM Delivery — Sends the briefing via email
// ============================================================

import { format } from 'date-fns';

const RESEND_API_URL = 'https://api.resend.com/emails';

/**
 * Send the briefing as an email via Resend API.
 * Converts markdown to a clean HTML email.
 */
export default async function deliver(briefingMarkdown, stats) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log('\n📧 DELIVER: No RESEND_API_KEY set — skipping email delivery.');
    console.log('   Set the RESEND_API_KEY secret in GitHub to enable email.');
    return { sent: false, reason: 'no API key' };
  }

  const today = format(new Date(), 'MMMM d, yyyy');
  console.log(`\n📧 DELIVERING briefing to staycreative@julien.care...`);

  // Convert markdown to simple HTML
  const htmlBody = markdownToHtml(briefingMarkdown);

  const emailPayload = {
    from: 'PRISM <prism@julien.care>',
    to: ['staycreative@julien.care'],
    subject: `PRISM — ${today}`,
    html: wrapInTemplate(htmlBody, stats),
  };

  try {
    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailPayload),
    });

    const result = await response.json();

    if (response.ok) {
      console.log(`  ✅ Email sent (id: ${result.id})`);
      return { sent: true, id: result.id };
    } else {
      console.log(`  ❌ Email failed: ${JSON.stringify(result)}`);
      return { sent: false, reason: result.message || 'unknown error' };
    }
  } catch (err) {
    console.log(`  ❌ Email error: ${err.message}`);
    return { sent: false, reason: err.message };
  }
}

/**
 * Basic markdown → HTML converter.
 * Handles headers, bold, italic, links, lists, tables, and horizontal rules.
 */
function markdownToHtml(md) {
  return md
    .split('\n')
    .map((line) => {
      // Headers
      if (line.startsWith('# ')) return `<h1 style="color:#1a1a1a;margin-top:32px;margin-bottom:8px;">${line.slice(2)}</h1>`;
      if (line.startsWith('## ')) return `<h2 style="color:#2d2d2d;margin-top:28px;margin-bottom:8px;border-bottom:1px solid #eee;padding-bottom:4px;">${line.slice(3)}</h2>`;
      if (line.startsWith('### ')) return `<h3 style="color:#444;margin-top:20px;margin-bottom:6px;">${line.slice(4)}</h3>`;

      // Horizontal rule
      if (line.startsWith('---')) return '<hr style="border:none;border-top:1px solid #ddd;margin:24px 0;">';

      // Table rows
      if (line.startsWith('|')) {
        // Skip separator rows
        if (line.match(/^\|\s*-+/)) return '';
        const cells = line.split('|').filter(c => c.trim()).map(c => c.trim());
        const tag = line.includes('Task') && line.includes('Best Tool') ? 'th' : 'td';
        const style = tag === 'th'
          ? 'style="text-align:left;padding:8px 12px;background:#f5f5f5;border-bottom:2px solid #ddd;font-weight:600;"'
          : 'style="padding:8px 12px;border-bottom:1px solid #eee;"';
        return `<tr>${cells.map(c => `<${tag} ${style}>${inlineFormat(c)}</${tag}>`).join('')}</tr>`;
      }

      // Bullet points
      if (line.startsWith('- ')) return `<li style="margin-bottom:4px;">${inlineFormat(line.slice(2))}</li>`;

      // Italic line (PRISM footer)
      if (line.startsWith('*') && line.endsWith('*') && !line.startsWith('**')) {
        return `<p style="color:#888;font-size:12px;font-style:italic;margin-top:24px;">${line.slice(1, -1)}</p>`;
      }

      // Empty line
      if (line.trim() === '') return '<br>';

      // Regular paragraph
      return `<p style="color:#333;line-height:1.6;margin:8px 0;">${inlineFormat(line)}</p>`;
    })
    .join('\n')
    // Wrap consecutive <li> in <ul>
    .replace(/(<li[^>]*>.*?<\/li>\n?)+/g, (match) => `<ul style="margin:8px 0;padding-left:20px;">${match}</ul>`)
    // Wrap consecutive <tr> in <table>
    .replace(/(<tr>.*?<\/tr>\n?)+/g, (match) => `<table style="width:100%;border-collapse:collapse;margin:16px 0;">${match}</table>`);
}

/**
 * Inline markdown formatting: bold, italic, links, code.
 */
function inlineFormat(text) {
  return text
    // Links: [text](url)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color:#2563eb;text-decoration:underline;">$1</a>')
    // Bold
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code style="background:#f0f0f0;padding:2px 6px;border-radius:3px;font-size:13px;">$1</code>');
}

/**
 * Wrap HTML content in a clean email template.
 */
function wrapInTemplate(htmlContent, stats) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:680px;margin:0 auto;padding:20px;background:#fff;">
  <div style="border-bottom:3px solid #1a1a1a;padding-bottom:12px;margin-bottom:24px;">
    <span style="font-size:11px;text-transform:uppercase;letter-spacing:2px;color:#888;">Personal Research Intelligence System</span>
  </div>
  ${htmlContent}
  <div style="margin-top:32px;padding-top:16px;border-top:1px solid #eee;font-size:11px;color:#aaa;">
    PRISM v0.2.0 — Scored ${stats.articlesScored} articles, analyzed ${stats.articlesAnalyzed} — <a href="https://github.com/raclettemeister/prism" style="color:#aaa;">GitHub</a>
  </div>
</body>
</html>`;
}
