import test from 'node:test';
import assert from 'node:assert/strict';
import { renderDigestEmail } from '../src/email-template.js';

const briefing = `# PRISM Morning Briefing — March 10, 2026

> **Theme today:** Software Dev & AI Building

## 🔴 THE SIGNAL

Something important happened today. It matters for tomorrow too.

## 📚 MUST-READS

- **[One]** — why it matters ([link](https://example.com/one))

## ⏪ ACTION AUDIT

- Follow up on yesterday.

## 🧭 CROSS-DOMAIN RADAR

- **Grassroot**: one direct signal.
- **Game**: quiet today.
- **Geo-EU**: one notable change.

## 🧠 THEME OF THE DAY

**Theme:** Software Dev & AI Building

**What moved today**
Two useful sentences here.

**Why it matters**
Two more useful sentences here.

**What to do or watch**
Watch one thing and ignore two others.

## 🎯 TODAY’S PRIORITIES

1. Do the main thing.
2. Ignore noise.
3. Capture one lesson.

## ⏭️ NEXT 3 DAYS

- Grassroot Hopper & Cooperative Tech
- Game Dev & Creative AI
- Geopolitics, EU Economics & Brussels Context
`;

test('digest email includes cost, run stats, and core oversight sections', () => {
  const { html, text } = renderDigestEmail(briefing, 'March 10, 2026', {
    confidence: 0.62,
    estimatedCost: '0.84',
    articlesAnalyzed: 18,
    webSearches: 0,
  });

  assert.match(text, /Confidence 62% · Cost ~\$0\.84 · 18 articles analyzed · 0 web searches/);
  assert.match(text, /ACTION AUDIT/);
  assert.match(text, /CROSS-DOMAIN RADAR/);

  assert.match(html, /Cost ~\$0\.84 · 18 articles analyzed · 0 web searches/);
  assert.match(html, /ACTION AUDIT/);
  assert.match(html, /CROSS-DOMAIN RADAR/);
});
