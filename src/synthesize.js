// ============================================================
// PRISM v5.0 Synthesize — one briefing, one theme, full oversight
// ============================================================

import { writeFile, readFile, mkdir } from 'fs/promises';
import { format } from 'date-fns';
import Anthropic from '@anthropic-ai/sdk';
import scout from './scout.js';
import {
  MODELS,
  LIMITS,
  MEMORY_FILE,
  BRIEFINGS_DIR,
  LIFE_CONTEXT_FILE,
  NEWS_INTERESTS_FILE,
  WEBINTEL_FILE,
  DAILY_THEME_PROMPT,
} from './config.js';
import {
  ensureThemeCycle,
  getScheduledTheme,
  getForecastThemes,
  advanceThemeCycle,
  listOtherThemes,
  summarizeThemeSignals,
  determineThemeDecision,
  themeLabel,
  themeShortLabel,
} from './themes.js';
import {
  assembleBriefing,
  extractSection,
  validateBriefingContract,
  BRIEFING_SECTION_ORDER,
} from './briefing-format.js';

const client = new Anthropic();

async function loadLifeContext() {
  try {
    return await readFile(LIFE_CONTEXT_FILE, 'utf-8');
  } catch {
    return 'Julien — Brussels-based founder. Building micro-software with AI.';
  }
}

async function loadNewsInterests() {
  try {
    return await readFile(NEWS_INTERESTS_FILE, 'utf-8');
  } catch {
    return 'AI builders, Grassroot Hopper, game development, Brussels and EU context.';
  }
}

async function loadMemory() {
  try {
    const raw = await readFile(MEMORY_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return {
      lastBriefings: [],
      actionTracking: [],
      feedQuality: {},
    };
  }
}

async function loadWebIntelligence(webIntelData = null) {
  if (webIntelData?.results) return webIntelData;

  try {
    const raw = await readFile(WEBINTEL_FILE, 'utf-8');
    return { scheduledTheme: null, results: [], markdown: raw };
  } catch {
    return { scheduledTheme: null, results: [], markdown: 'No web intelligence available.' };
  }
}

function buildArticleBuckets(selectedArticles, classified) {
  const buckets = {};
  const candidates = classified?.all || selectedArticles;
  for (const article of candidates) {
    const themeKey = article.primaryTheme || 'dev';
    buckets[themeKey] = buckets[themeKey] || { selected: [], candidates: [] };
    buckets[themeKey].candidates.push(article);
  }

  for (const article of selectedArticles) {
    const themeKey = article.primaryTheme || 'dev';
    buckets[themeKey] = buckets[themeKey] || { selected: [], candidates: [] };
    buckets[themeKey].selected.push(article);
  }

  for (const bucket of Object.values(buckets)) {
    bucket.selected.sort((a, b) => (b.score || 0) - (a.score || 0));
    bucket.candidates.sort((a, b) => (b.score || 0) - (a.score || 0));
  }

  return buckets;
}

function groupWebIntel(results = []) {
  const buckets = {};
  for (const result of results) {
    const themeKey = result.theme || 'dev';
    buckets[themeKey] = buckets[themeKey] || [];
    buckets[themeKey].push(result);
  }
  return buckets;
}

function buildActionAudit(memory) {
  const yesterdayActions = memory.actionTracking?.[0]?.actions || [];
  if (yesterdayActions.length === 0) {
    return 'No previous actions to track.';
  }

  return yesterdayActions
    .slice(0, LIMITS.actionAuditMax)
    .map((action) => `- ${action.action} — ${action.status || 'pending'}`)
    .join('\n');
}

function buildMustReadCandidates(selectedArticles) {
  return selectedArticles
    .slice()
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, LIMITS.mustReadMax + 2)
    .map((article, index) => [
      `Candidate ${index + 1}`,
      `TITLE: ${article.title}`,
      `URL: ${article.link}`,
      `THEME: ${themeShortLabel(article.primaryTheme || 'dev')}`,
      `SCORE: ${article.score || 'n/a'}`,
      `CONTENT: ${(article.fullText || article.content || '').substring(0, 1000)}`,
    ].join('\n'))
    .join('\n\n');
}

function buildRadarCandidates(themeKey, articleBuckets, webIntelBuckets) {
  return listOtherThemes(themeKey).map((otherTheme) => {
    const article = articleBuckets[otherTheme]?.candidates?.[0];
    const webIntel = webIntelBuckets[otherTheme]?.[0];
    const parts = [`DOMAIN: ${themeShortLabel(otherTheme)}`];
    if (article) {
      parts.push(`ARTICLE: ${article.title} (${article.link})`);
      parts.push(`ARTICLE_NOTE: ${(article.content || article.fullText || '').substring(0, 320)}`);
    } else {
      parts.push('ARTICLE: quiet');
    }
    if (webIntel) {
      parts.push(`WEB_INTEL: ${webIntel.query}`);
      parts.push(`WEB_INTEL_NOTE: ${(webIntel.result || '').substring(0, 320)}`);
    } else {
      parts.push('WEB_INTEL: quiet');
    }
    return parts.join('\n');
  }).join('\n\n');
}

function buildThemeCandidates(themeKey, articleBuckets, webIntelBuckets, scoutResult = null) {
  const selected = articleBuckets[themeKey]?.selected || [];
  const candidates = articleBuckets[themeKey]?.candidates || [];
  const themeArticles = (selected.length > 0 ? selected : candidates).slice(0, 6);

  const sections = themeArticles.map((article, index) => [
    `ARTICLE ${index + 1}`,
    `TITLE: ${article.title}`,
    `URL: ${article.link}`,
    `SCORE: ${article.score || 'n/a'}`,
    `CONTENT: ${(article.fullText || article.content || '').substring(0, 1400)}`,
  ].join('\n'));

  const intel = (webIntelBuckets[themeKey] || []).slice(0, 4).map((result, index) => [
    `WEB INTEL ${index + 1}`,
    `QUERY: ${result.query}`,
    `PURPOSE: ${result.purpose}`,
    `RESULT: ${(result.result || '').substring(0, 600)}`,
  ].join('\n'));

  if (scoutResult?.rawCatches) {
    intel.push(`SCOUT RAW CATCHES\n${scoutResult.rawCatches.substring(0, 4000)}`);
  }

  return [...sections, ...intel].join('\n\n');
}

function buildWebIntelBlock(webIntel) {
  if (webIntel.markdown) return webIntel.markdown.substring(0, 5000);
  if (!webIntel.results?.length) return 'No web intelligence available.';
  return webIntel.results.map((result) => `[${result.theme}] ${result.query}\n${result.result}`).join('\n\n').substring(0, 5000);
}

function buildNextDaysBlock(forecastThemes) {
  return forecastThemes.map((themeKey) => `- ${themeLabel(themeKey)}`).join('\n');
}

function createFallbackBriefing({ actionAudit, radarThemes, themeLabelText, forecastThemes }) {
  return [
    '## 🔴 THE SIGNAL',
    '',
    'Nothing decisive moved today.',
    '',
    '## 📚 MUST-READS',
    '',
    'No must-reads today.',
    '',
    '## ⏪ ACTION AUDIT',
    '',
    actionAudit.startsWith('-') ? actionAudit : `- ${actionAudit}`,
    '',
    '## 🧭 CROSS-DOMAIN RADAR',
    '',
    ...radarThemes.map((theme) => `- **${themeShortLabel(theme)}**: quiet today.`),
    '',
    '## 🧠 THEME OF THE DAY',
    '',
    `**Theme:** ${themeLabelText}`,
    '',
    '**What moved today**',
    'Quiet day in the primary theme.',
    '',
    '**Why it matters**',
    'No strong theme-specific shift needs action.',
    '',
    '**What to do or watch**',
    'Carry over the most important current work rather than forcing action.',
    '',
    '## 🎯 TODAY’S PRIORITIES',
    '',
    '1. Protect attention for the current theme and ignore noise.',
    '2. Keep one eye on cross-domain radar only for real alerts.',
    '3. Record any strong miss so tomorrow’s review is sharper.',
    '',
    '## ⏭️ NEXT 3 DAYS',
    '',
    ...forecastThemes.map((theme) => `- ${themeLabel(theme)}`),
  ].join('\n');
}

function repairBriefing(rawBriefing, fallbackBriefing) {
  const repairedSections = BRIEFING_SECTION_ORDER.map((header) => {
    return extractSection(rawBriefing, header) || extractSection(fallbackBriefing, header);
  }).filter(Boolean);

  return repairedSections.join('\n\n');
}

async function callDailyBriefing({
  date,
  scheduledTheme,
  resolvedTheme,
  overrideReason,
  lifeContext,
  newsInterests,
  actionAudit,
  webIntelligence,
  themeCandidates,
  radarCandidates,
  mustReadCandidates,
  nextDays,
}) {
  const prompt = DAILY_THEME_PROMPT
    .replaceAll('{theme_label}', themeLabel(resolvedTheme))
    .replaceAll('{scheduled_theme_label}', themeLabel(scheduledTheme))
    .replace('{override_reason}', overrideReason || 'none')
    .replace('{word_target}', String(LIMITS.briefingTargetWords))
    .replace('{hard_cap}', String(LIMITS.briefingHardCapWords))
    .replace('{must_read_max}', String(LIMITS.mustReadMax))
    .replace('{action_audit_max}', String(LIMITS.actionAuditMax))
    .replace('{priorities_max}', String(LIMITS.prioritiesMax))
    .replace('{life_context}', lifeContext)
    .replace('{news_interests}', newsInterests)
    .replace('{action_audit}', actionAudit)
    .replace('{web_intelligence}', webIntelligence)
    .replace('{theme_candidates}', themeCandidates)
    .replace('{radar_candidates}', radarCandidates)
    .replace('{must_read_candidates}', mustReadCandidates)
    .replace('{next_days}', nextDays);

  console.log(`  Daily briefing call: ${themeLabel(resolvedTheme)} (${overrideReason ? 'override' : 'scheduled'})`);

  const response = await client.messages.create({
    model: MODELS.synthesizer,
    max_tokens: 5000,
    messages: [{ role: 'user', content: prompt }],
  });

  const textBlocks = response.content.filter((block) => block.type === 'text');
  return {
    raw: textBlocks.map((block) => block.text).join('').trim(),
    tokens: {
      input_tokens: response.usage.input_tokens,
      output_tokens: response.usage.output_tokens,
    },
  };
}

function updateMemory({ date, memory, briefing, selectedArticles, scheduledTheme, resolvedTheme, overrideReason }) {
  memory.lastBriefings = memory.lastBriefings || [];
  memory.lastBriefings.unshift({
    date,
    articleCount: selectedArticles.length,
    theme: resolvedTheme,
    overrideReason,
  });
  memory.lastBriefings = memory.lastBriefings.slice(0, 7);

  const prioritiesSection = extractSection(briefing, '## 🎯 TODAY’S PRIORITIES') || '';
  const actions = prioritiesSection
    .split('\n')
    .filter((line) => /^\d+\./.test(line.trim()))
    .slice(0, LIMITS.prioritiesMax)
    .map((line) => ({
      action: line.replace(/^\d+\.\s*/, '').trim(),
      project: resolvedTheme,
      status: 'pending',
    }));

  memory.actionTracking = memory.actionTracking || [];
  memory.actionTracking.unshift({ date, actions });
  memory.actionTracking = memory.actionTracking.slice(0, 7);

  memory.feedQuality = memory.feedQuality || {};
  for (const article of selectedArticles) {
    if (!article.source) continue;
    const entry = memory.feedQuality[article.source] || { articleCount: 0, lastSeen: null };
    entry.articleCount += 1;
    entry.lastSeen = date;
    memory.feedQuality[article.source] = entry;
  }

  advanceThemeCycle(memory, resolvedTheme, {
    scheduledTheme,
    overrideReason,
    runDate: date,
  });
}

export default async function synthesize(selectedArticles, classified = null, deepDiveReport = null, rawArticles = [], webIntelData = null) {
  const todayIso = format(new Date(), 'yyyy-MM-dd');
  const dateFormatted = format(new Date(), 'MMMM d, yyyy');

  console.log(`\n🧠 SYNTHESIZE — daily core + rolling theme cycle...`);
  if (deepDiveReport?.deepDives?.length) {
    console.log(`  Deep dives generated separately (${deepDiveReport.deepDives.length}) — not injected into daily briefing`);
  }

  const [lifeContext, newsInterests, memory, webIntel] = await Promise.all([
    loadLifeContext(),
    loadNewsInterests(),
    loadMemory(),
    loadWebIntelligence(webIntelData),
  ]);

  ensureThemeCycle(memory);
  const scheduledTheme = webIntel.scheduledTheme || getScheduledTheme(memory);

  const articleBuckets = buildArticleBuckets(selectedArticles, classified);
  const webIntelBuckets = groupWebIntel(webIntel.results || []);
  const summaries = Object.fromEntries(memory.themeCycle.order.map((themeKey) => [themeKey, null]));

  for (const themeKey of memory.themeCycle.order) {
    summaries[themeKey] = summarizeThemeSignals(
      themeKey,
      articleBuckets[themeKey]?.candidates?.slice(0, 3) || [],
      webIntelBuckets[themeKey]?.slice(0, 2) || [],
      lifeContext
    );
  }

  const decision = determineThemeDecision({
    scheduledTheme,
    summaries,
  });

  let scoutResult = null;
  if (decision.resolvedTheme === 'grassroot') {
    const scoutArticles = rawArticles.filter((article) => article.primaryTheme === 'grassroot' || article.category === 'grassroot_scout');
    scoutResult = await scout(scoutArticles);
  }

  const forecastThemes = getForecastThemes(memory, LIMITS.forecastDays, {
    overrideDeferred: !!decision.overrideReason,
  });
  const actionAudit = buildActionAudit(memory);
  const radarThemes = listOtherThemes(decision.resolvedTheme);
  const radarCandidates = buildRadarCandidates(decision.resolvedTheme, articleBuckets, webIntelBuckets);
  const themeCandidates = buildThemeCandidates(decision.resolvedTheme, articleBuckets, webIntelBuckets, scoutResult);
  const mustReadCandidates = buildMustReadCandidates(selectedArticles);
  const nextDays = buildNextDaysBlock(forecastThemes);
  const fallbackBriefing = createFallbackBriefing({
    actionAudit,
    radarThemes,
    themeLabelText: themeLabel(decision.resolvedTheme),
    forecastThemes,
  });

  const { raw, tokens } = await callDailyBriefing({
    date: dateFormatted,
    scheduledTheme,
    resolvedTheme: decision.resolvedTheme,
    overrideReason: decision.overrideReason,
    lifeContext,
    newsInterests,
    actionAudit,
    webIntelligence: buildWebIntelBlock(webIntel),
    themeCandidates,
    radarCandidates,
    mustReadCandidates,
    nextDays,
  });

  let briefing = assembleBriefing(raw, {
    date: dateFormatted,
    themeLabel: themeLabel(decision.resolvedTheme),
    overrideReason: decision.overrideReason,
    footer: `---\n*PRISM v5.0 — ${selectedArticles.length} articles analyzed, 0 synthesis web searches*`,
  });

  let validation = validateBriefingContract(briefing);
  if (!validation.ok) {
    console.log(`  ⚠️ Briefing contract repair: ${validation.errors.join('; ')}`);
    briefing = assembleBriefing(repairBriefing(briefing, fallbackBriefing), {
      date: dateFormatted,
      themeLabel: themeLabel(decision.resolvedTheme),
      overrideReason: decision.overrideReason,
      footer: `---\n*PRISM v5.0 — ${selectedArticles.length} articles analyzed, 0 synthesis web searches*`,
    });
    validation = validateBriefingContract(briefing);
  }

  if (!validation.ok) {
    throw new Error(`Briefing contract failed after repair: ${validation.errors.join('; ')}`);
  }

  await mkdir(BRIEFINGS_DIR, { recursive: true });
  const filepath = `${BRIEFINGS_DIR}/${todayIso}.md`;
  await writeFile(filepath, briefing, 'utf-8');
  console.log(`  ✅ Briefing saved to ${filepath}`);

  updateMemory({
    date: todayIso,
    memory,
    briefing,
    selectedArticles,
    scheduledTheme,
    resolvedTheme: decision.resolvedTheme,
    overrideReason: decision.overrideReason,
  });

  await mkdir('data', { recursive: true });
  await writeFile(MEMORY_FILE, JSON.stringify(memory, null, 2), 'utf-8');

  return {
    briefing,
    filepath,
    tokens,
    webSearches: 0,
  };
}
