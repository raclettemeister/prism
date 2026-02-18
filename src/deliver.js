// ============================================================
// PRISM v2.0 Delivery — HTML email via Resend, validation confidence in subject
// ============================================================

import { format } from 'date-fns';
import { renderEmail } from './email-template.js';

const RESEND_API_URL = 'https://api.resend.com/emails';

export default async function deliver(briefingMarkdown, stats) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log('\n📧 DELIVER: No RESEND_API_KEY set — skipping email delivery.');
    console.log('   Set the RESEND_API_KEY secret in GitHub to enable email.');
    return { sent: false, reason: 'no API key' };
  }

  const dateStr = format(new Date(), 'MMMM d, yyyy');
  console.log(`\n📧 DELIVERING briefing to staycreative@julien.care...`);

  const htmlBody = renderEmail(briefingMarkdown, dateStr);

  // Add warning emoji to subject when confidence is low
  const subject = stats.confidence && stats.confidence < 0.7
    ? `PRISM — ${dateStr} ⚠️`
    : `PRISM — ${dateStr}`;

  const emailPayload = {
    from: 'PRISM <prism@julien.care>',
    to: ['staycreative@julien.care'],
    subject,
    html: htmlBody,
    text: briefingMarkdown,
  };

  try {
    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
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
