import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateBriefingContract,
} from '../src/briefing-format.js';

const validBriefing = `# PRISM Morning Briefing — March 8, 2026

> **Theme today:** Software Dev & AI Building

## 🔴 THE SIGNAL

Something important happened.

## 📚 MUST-READS

- **[One]** — why it matters ([link](https://example.com/one))
- **[Two]** — why it matters ([link](https://example.com/two))

## ⏪ ACTION AUDIT

- Finish yesterday's follow-up.
- Keep the schedule honest.

## 🧭 CROSS-DOMAIN RADAR

- **Grassroot**: quiet today.
- **Game**: one usable update.
- **Geo-EU**: one direct-impact note.

## 🧠 THEME OF THE DAY

**Theme:** Software Dev & AI Building

**What moved today**
One short paragraph.

**Why it matters**
One short paragraph.

**What to do or watch**
One short paragraph.

## 🎯 TODAY’S PRIORITIES

1. Do the main thing.
2. Ignore noise.
3. Write down one decision.

## ⏭️ NEXT 3 DAYS

- Grassroot Hopper & Cooperative Tech
- Game Dev & Creative AI
- Geopolitics, EU Economics & Brussels Context
`;

test('briefing contract accepts the v5 7-section shape', () => {
  const result = validateBriefingContract(validBriefing);
  assert.equal(result.ok, true);
});

test('briefing contract rejects legacy sections', () => {
  const result = validateBriefingContract(`${validBriefing}\n\n## 🌍 WORLD LENS\n\nLegacy drift`);
  assert.equal(result.ok, false);
  assert.match(result.errors.join('\n'), /legacy sections present/i);
});

test('briefing contract rejects oversized lists', () => {
  const result = validateBriefingContract(validBriefing.replace(
    '1. Do the main thing.\n2. Ignore noise.\n3. Write down one decision.',
    '1. One\n2. Two\n3. Three\n4. Four'
  ));
  assert.equal(result.ok, false);
  assert.match(result.errors.join('\n'), /priorities exceed/i);
});
