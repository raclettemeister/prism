export const BRIEFING_SECTION_ORDER = [
  '## 🔴 THE SIGNAL',
  '## 📚 MUST-READS',
  '## ⏪ ACTION AUDIT',
  '## 🧭 CROSS-DOMAIN RADAR',
  '## 🧠 THEME OF THE DAY',
  '## 🎯 TODAY’S PRIORITIES',
  '## ⏭️ NEXT 3 DAYS',
];

export const LEGACY_SECTION_HEADERS = [
  '## 📊 PIONEER ADVANTAGE CHECK',
  '## 🛠️ TOOLS TO TRY',
  '## 🏗️ BUILD WATCH',
  '## 🌍 WORLD LENS',
  '## 🇪🇺 EUROPE TECH',
  '## 📈 TREND TRACKER',
  '## 🚮 SLOP FILTER',
  '## 🔄 FEED HEALTH REPORT',
  '## 💬 FEEDBACK RESPONSE',
];

export function extractSection(text, header) {
  const escaped = header.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped}[\\s\\S]*?)(?=\\n## |$)`, 'i');
  const match = text.match(regex);
  return match ? match[1].trim() : null;
}

export function assembleBriefing(rawBriefing, { date, themeLabel, overrideReason = null, footer = '' }) {
  const headerLines = [`# PRISM Morning Briefing — ${date}`];
  headerLines.push(`> **Theme today:** ${themeLabel}`);
  if (overrideReason) headerLines.push(`> **Override:** ${overrideReason}`);

  const sections = BRIEFING_SECTION_ORDER
    .map((header) => extractSection(rawBriefing, header))
    .filter(Boolean);

  const assembled = [headerLines.join('\n'), ...sections];
  if (footer) assembled.push(footer);
  return assembled.join('\n\n');
}

export function validateBriefingContract(briefing) {
  const headers = briefing.match(/^## .+$/gm) || [];
  const mustReadsSection = extractSection(briefing, '## 📚 MUST-READS') || '';
  const actionAuditSection = extractSection(briefing, '## ⏪ ACTION AUDIT') || '';
  const radarSection = extractSection(briefing, '## 🧭 CROSS-DOMAIN RADAR') || '';
  const prioritiesSection = extractSection(briefing, '## 🎯 TODAY’S PRIORITIES') || '';
  const nextDaysSection = extractSection(briefing, '## ⏭️ NEXT 3 DAYS') || '';

  const errors = [];

  if (headers.length !== BRIEFING_SECTION_ORDER.length) {
    errors.push(`expected ${BRIEFING_SECTION_ORDER.length} sections, found ${headers.length}`);
  }

  const expected = BRIEFING_SECTION_ORDER.join('\n');
  const actual = headers.join('\n');
  if (actual !== expected) {
    errors.push('section order does not match contract');
  }

  const mustReadCount = (mustReadsSection.match(/^- \*\*/gm) || []).length;
  if (mustReadCount > 3) errors.push('must-reads exceed max 3');

  const actionCount = (actionAuditSection.match(/^- /gm) || []).length;
  if (actionCount > 3) errors.push('action audit exceeds max 3 bullets');

  const radarCount = (radarSection.match(/^- \*\*/gm) || []).length;
  if (radarCount !== 3) errors.push('cross-domain radar must contain exactly 3 lines');

  const priorityCount = (prioritiesSection.match(/^\d+\./gm) || []).length;
  if (priorityCount > 3) errors.push('priorities exceed max 3');

  const nextDaysCount = (nextDaysSection.match(/^- /gm) || []).length;
  if (nextDaysCount < 3) errors.push('next 3 days must contain 3 lines');

  const legacyPresent = LEGACY_SECTION_HEADERS.filter((header) => briefing.includes(header));
  if (legacyPresent.length > 0) {
    errors.push(`legacy sections present: ${legacyPresent.join(', ')}`);
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}
