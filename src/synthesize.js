// ============================================================
// PRISM v4.0 Synthesize — Parallel Specialist Synthesis
// Replaces: research.js (single sequential BIG CALL)
//
// Architecture:
//   Call A — Builder Intelligence (critical path)
//     Inputs:  Tier 1 expert articles + web intelligence + life context + memory
//     Outputs: SIGNAL, MUST-READS, BUILDER INTELLIGENCE, ACTION AUDIT, PRIORITIES
//     Budget:  8,000 output tokens | ~4-7 min
//
//   Call B — World Context (secondary, runs in parallel with Call A)
//     Inputs:  Tier 2/3 articles + web intelligence + last briefings
//     Outputs: PIONEER ADVANTAGE, TOOLS, BUILD WATCH, WORLD LENS, EUROPE TECH,
//              TREND TRACKER, SLOP FILTER, FEED HEALTH, FEEDBACK RESPONSE
//     Budget:  6,000 output tokens | ~4-7 min
//
//   Both calls run via Promise.all() — total time = max(A, B) not A+B.
//   Assembly: sections extracted from both outputs and reordered into final briefing.
//   Graceful degradation: if Call B fails, Call A sections are emailed alone.
// ============================================================

import { writeFile, readFile, mkdir, readdir } from 'fs/promises';
import { format } from 'date-fns';
import Anthropic from '@anthropic-ai/sdk';
import {
  MODELS,
  SONNET_46_BETAS,
  LIMITS,
  MEMORY_FILE,
  BRIEFINGS_DIR,
  LIFE_CONTEXT_FILE,
  NEWS_INTERESTS_FILE,
  WEBINTEL_FILE,
  FEEDBACK_FILE,
  BUILDER_PROMPT,
  WORLD_PROMPT,
} from './config.js';

const client = new Anthropic();

// ── Utilities ────────────────────────────────────────────────

/**
 * Strip unpaired Unicode surrogates that cause JSON errors.
 * RSS feeds sometimes contain corrupted characters.
 */
function sanitizeUnicode(str) {
  return str.replace(/[\uD800-\uDFFF]/g, (ch, i, s) => {
    const code = ch.charCodeAt(0);
    if (code >= 0xD800 && code <= 0xDBFF) {
      const next = s.charCodeAt(i + 1);
      return (next >= 0xDC00 && next <= 0xDFFF) ? ch : '';
    }
    const prev = s.charCodeAt(i - 1);
    return (prev >= 0xD800 && prev <= 0xDBFF) ? ch : '';
  });
}

function estimateCost(inputTokens, outputTokens) {
  return ((inputTokens / 1_000_000) * 3 + (outputTokens / 1_000_000) * 15).toFixed(2);
}

function buildPortalUrl(date) {
  const base = process.env.PRISM_PORTAL_URL || 'https://prism.julien.care';
  return `${base}/${date}.html`;
}

// ── Data Loaders ─────────────────────────────────────────────

async function loadLifeContext() {
  try {
    return await readFile(LIFE_CONTEXT_FILE, 'utf-8');
  } catch {
    return 'Julien — Brussels-based founder. Building micro-SaaS with AI. Runs Chez Julien specialty food shop.';
  }
}

async function loadNewsInterests() {
  try {
    return await readFile(NEWS_INTERESTS_FILE, 'utf-8');
  } catch {
    return 'AI tools, micro-SaaS, European tech, geopolitics, indie founders.';
  }
}

async function loadWebIntelligence() {
  try {
    return await readFile(WEBINTEL_FILE, 'utf-8');
  } catch {
    return 'Web intelligence not available for this run.';
  }
}

async function loadLastBriefings(maxCount = 3) {
  try {
    const files = await readdir(BRIEFINGS_DIR);
    const md = files.filter(f => f.endsWith('.md')).sort().reverse().slice(0, maxCount);
    const contents = await Promise.all(
      md.map(f => readFile(`${BRIEFINGS_DIR}/${f}`, 'utf-8')
        .then(c => `--- ${f} ---\n${c.substring(0, 2000)}`))
    );
    return contents.length ? contents.join('\n\n') : 'No previous briefings yet.';
  } catch {
    return 'No previous briefings yet.';
  }
}

async function loadMemory() {
  try {
    const raw = await readFile(MEMORY_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return {
      lastRun: null,
      feedHealth: {},
      topicFrequency: {},
      toolsMentioned: [],
      lastBriefings: [],
      actionTracking: [],
      projectWatchlist: [],
      feedQuality: {},
      feedRecommendations: [],
      sourceRatings: {},
      sectionPerformance: {},
      topicPreferences: {},
    };
  }
}

/**
 * Load feedback — tries JSON format first (v4.0), falls back to markdown (v3.x).
 * Returns { text, structured } where text is for prompt injection,
 * structured is the parsed JSON (or null) for memory learning.
 */
async function loadFeedback() {
  // Try structured JSON first (v4.0 format)
  try {
    const raw = await readFile(FEEDBACK_FILE, 'utf-8');
    const json = JSON.parse(raw);
    if (json.date || json.briefingRating) {
      const text = formatFeedbackForPrompt(json);
      return { text, structured: json };
    }
  } catch { /* fall through */ }

  // Fall back to markdown (v3.x format)
  try {
    const raw = await readFile('data/feedback-latest.md', 'utf-8');
    if (raw.trim() && !raw.includes('(empty — edit this section)')) {
      // Ignore redirect/HTML error pages (e.g. wrong MylifeOS URL) — treat as no feedback
      if (/Temporary Redirect|Moved Permanently|<!DOCTYPE|<a\s+href/i.test(raw)) {
        return { text: null, structured: null };
      }
      return { text: raw, structured: null };
    }
  } catch { /* fall through */ }

  return { text: null, structured: null };
}

function formatFeedbackForPrompt(json) {
  const lines = [`Feedback from ${json.date || 'recent briefing'}:`];
  if (json.briefingRating) lines.push(`Overall rating: ${json.briefingRating}/5`);

  if (json.mustReads?.length > 0) {
    lines.push('Article ratings:');
    for (const item of json.mustReads) {
      lines.push(`  - "${item.title}" (${item.source}): ${item.rating}`);
    }
  }

  if (json.sections) {
    lines.push('Section ratings:');
    for (const [section, rating] of Object.entries(json.sections)) {
      lines.push(`  - ${section}: ${rating}`);
    }
  }

  if (json.openNotes?.trim()) {
    lines.push(`Notes from Julien: ${json.openNotes}`);
  }

  return lines.join('\n');
}

// ── Article Block Builders ────────────────────────────────────

/**
 * Build the articles block for injection into prompts.
 */
function buildArticlesBlock(articles, maxLength = 8000) {
  return articles.map((a, i) => {
    const content = a.fullTextAvailable && a.fullText
      ? a.fullText
      : (a.content || 'No content available');
    return `--- ARTICLE ${i + 1} (Tier:${a.tier || '?'}, Score:${a.score}/10, CrossFeed:${a.crossFeedCount || 1}, Source:${a.source}) ---
TITLE: ${a.title}
URL: ${a.link}
DATE: ${a.date}

CONTENT:
${content.substring(0, maxLength)}
`;
  }).join('\n');
}

// ── Synthesis Calls ──────────────────────────────────────────

/**
 * Call A — Builder Intelligence (critical path)
 * Produces: SIGNAL, MUST-READS, BUILDER INTELLIGENCE, ACTION AUDIT, PRIORITIES
 */
async function callBuilderSynth(tier1Articles, webIntelligence, lifeContext, newsInterests, memory, feedbackText, actionAuditBlock, date, portalUrl) {
  const memoryJson = JSON.stringify({
    topicFrequency: memory.topicFrequency || {},
    toolsMentioned: memory.toolsMentioned || [],
    projectWatchlist: memory.projectWatchlist || [],
    sourceRatings: memory.sourceRatings || {},
  }, null, 2);

  const tier1Block = buildArticlesBlock(tier1Articles);
  const tier1Count = tier1Articles.length;

  const prompt = sanitizeUnicode(
    BUILDER_PROMPT
      .replace('{date}', format(new Date(), 'MMMM d, yyyy'))
      .replace('{portal_url}', portalUrl)
      .replace('{life_context}', lifeContext)
      .replace('{news_interests}', newsInterests)
      .replace('{web_intelligence}', webIntelligence)
      .replace('{memory_json}', memoryJson)
      .replace('{action_audit}', actionAuditBlock)
      .replace('{feedback}', feedbackText || 'No feedback from Julien yet.')
      .replace('{tier1_count}', String(tier1Count))
      .replace('{tier1_articles}', tier1Block)
  );

  console.log(`  Call A (Builder): ~${Math.round(prompt.length / 4).toLocaleString()} tokens input, ${tier1Count} Tier 1 articles...`);

  const stream = client.beta.messages.stream({
    model: MODELS.synthesizer,
    max_tokens: LIMITS.builderCallMaxTokens,
    betas: SONNET_46_BETAS,
    tools: [{ type: 'web_search_20260209', name: 'web_search' }],
    messages: [{ role: 'user', content: prompt }],
  });
  const response = await stream.finalMessage();

  let output = '';
  let webSearchCount = 0;
  for (const block of response.content) {
    if (block.type === 'text') output += block.text;
    if (block.type === 'server_tool_use' && block.name === 'web_search') webSearchCount++;
  }

  return {
    output: output.trim(),
    tokens: {
      input: response.usage.input_tokens,
      output: response.usage.output_tokens,
    },
    webSearches: webSearchCount,
  };
}

/**
 * Call B — World Context (secondary, runs in parallel)
 * Produces: PIONEER ADVANTAGE, TOOLS, BUILD WATCH, WORLD LENS, EUROPE TECH,
 *           TREND TRACKER, SLOP FILTER, FEED HEALTH, FEEDBACK RESPONSE
 */
async function callWorldSynth(tier2Articles, webIntelligence, lifeContext, lastBriefings, feedbackText, portalUrl) {
  const tier2Block = buildArticlesBlock(tier2Articles);
  const tier2Count = tier2Articles.length;

  const prompt = sanitizeUnicode(
    WORLD_PROMPT
      .replace('{life_context}', lifeContext)
      .replace('{web_intelligence}', webIntelligence)
      .replace('{last_briefings}', lastBriefings)
      .replace('{feedback}', feedbackText || 'No feedback from Julien yet.')
      .replace('{portal_url}', portalUrl)
      .replace('{tier2_count}', String(tier2Count))
      .replace('{tier2_articles}', tier2Block)
  );

  console.log(`  Call B (World): ~${Math.round(prompt.length / 4).toLocaleString()} tokens input, ${tier2Count} Tier 2/3 articles...`);

  const stream = client.beta.messages.stream({
    model: MODELS.synthesizer,
    max_tokens: LIMITS.worldCallMaxTokens,
    betas: SONNET_46_BETAS,
    tools: [{ type: 'web_search_20260209', name: 'web_search' }],
    messages: [{ role: 'user', content: prompt }],
  });
  const response = await stream.finalMessage();

  let output = '';
  let webSearchCount = 0;
  for (const block of response.content) {
    if (block.type === 'text') output += block.text;
    if (block.type === 'server_tool_use' && block.name === 'web_search') webSearchCount++;
  }

  return {
    output: output.trim(),
    tokens: {
      input: response.usage.input_tokens,
      output: response.usage.output_tokens,
    },
    webSearches: webSearchCount,
  };
}

// ── Assembly ─────────────────────────────────────────────────

/**
 * Extract a named section from combined briefing text.
 * Matches from the section header to the next ## header or end of string.
 */
function extractSection(text, headerPattern) {
  const regex = new RegExp(`(${headerPattern}[\\s\\S]*?)(?=\\n## |$)`, 'i');
  const match = text.match(regex);
  return match ? match[1].trim() : null;
}

/**
 * Assemble the final briefing from Call A and Call B outputs.
 * Extracts sections by header and reorders them into the canonical section order.
 */
function assembleBriefing(callAOutput, callBOutput, date, articleCount, webSearchTotal, totalCost) {
  // Extract header (everything before first ## section in Call A)
  const headerMatch = callAOutput.match(/^([\s\S]*?)(?=\n## 🔴|\n## THE SIGNAL|$)/);
  const header = headerMatch ? headerMatch[1].trim() : `# PRISM Morning Briefing — ${date}`;

  // Strip any leading "# PRISM Morning Briefing…" header from Call B.
  // The model sometimes generates its own header (occasionally with the wrong date).
  // Call A's header is the canonical one — Call B's is always discarded.
  const callBStripped = callBOutput.replace(/^#+\s*PRISM[^\n]*\n+/i, '').trim();
  const combined = callAOutput + '\n\n' + callBStripped;

  // Extract sections in canonical order
  const sectionPatterns = [
    { key: 'signal',    pattern: '## 🔴 THE SIGNAL' },
    { key: 'mustreads', pattern: '## 📚 MUST-READ LIST' },
    { key: 'builder',   pattern: '## 🧱 BUILDER INTELLIGENCE' },
    { key: 'pioneer',   pattern: '## 📊 PIONEER ADVANTAGE CHECK' },
    { key: 'tools',     pattern: '## 🛠️ TOOLS TO TRY' },
    { key: 'buildwatch',pattern: '## 🏗️ BUILD WATCH' },
    { key: 'audit',     pattern: '## ⏪ ACTION AUDIT' },
    { key: 'priorities',pattern: '## 🎯 TODAY\'S PRIORITIES' },
    { key: 'world',     pattern: '## 🌍 WORLD LENS' },
    { key: 'eu',        pattern: '## 🇪🇺 EUROPE TECH' },
    { key: 'trends',    pattern: '## 📈 TREND TRACKER' },
    { key: 'slop',      pattern: '## 🚮 SLOP FILTER' },
    { key: 'feedhealth',pattern: '## 🔄 FEED HEALTH REPORT' },
    { key: 'feedback',  pattern: '## 💬 FEEDBACK RESPONSE' },
  ];

  const sections = [];
  for (const { pattern } of sectionPatterns) {
    // Escape special regex chars in the pattern
    const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const section = extractSection(combined, escaped);
    if (section) sections.push(section);
  }

  const footer = `\n---\n*PRISM v4.0 — ${articleCount} articles analyzed, ${webSearchTotal} web searches, ~$${totalCost}*`;

  return [header, ...sections, footer].join('\n\n');
}

// ── Memory Update ────────────────────────────────────────────

/**
 * Update memory.json with this run's data.
 * Adds v4.0 learning fields: sourceRatings, sectionPerformance, topicPreferences.
 */
async function updateMemory(date, memory, briefing, articles, feedbackStructured) {
  // --- Last briefings ---
  memory.lastBriefings = (memory.lastBriefings || []);
  memory.lastBriefings.unshift({ date, articleCount: articles.length });
  memory.lastBriefings = memory.lastBriefings.slice(0, 7);

  // --- Action tracking ---
  const todayActions = [];
  const prioritiesMatch = briefing.match(/TODAY'S PRIORITIES[\s\S]*?(?=##|$)/i);
  if (prioritiesMatch) {
    const lines = prioritiesMatch[0].split('\n').filter(l => /^\d+\./.test(l.trim()));
    for (const line of lines) {
      todayActions.push({
        action: line.replace(/^\d+\.\s*\*\*[^*]+\*\*\s*—?\s*/, '').trim(),
        project: 'general',
        status: 'pending',
      });
    }
  }
  memory.actionTracking = (memory.actionTracking || []);
  memory.actionTracking.unshift({ date, actions: todayActions });
  memory.actionTracking = memory.actionTracking.slice(0, 7);

  // --- Feed quality tracking ---
  memory.feedQuality = memory.feedQuality || {};
  for (const a of articles) {
    const source = a.source;
    if (!source) continue;
    if (!memory.feedQuality[source]) memory.feedQuality[source] = { articleCount: 0, lastSeen: date };
    memory.feedQuality[source].articleCount = (memory.feedQuality[source].articleCount || 0) + 1;
    memory.feedQuality[source].lastSeen = date;
  }

  // --- Feed health recommendations ---
  const feedHealthMatch = briefing.match(/FEED HEALTH REPORT[\s\S]*?(?=##|$)/i);
  if (feedHealthMatch) {
    memory.feedRecommendations = (memory.feedRecommendations || []);
    memory.feedRecommendations.unshift({ date, report: feedHealthMatch[0].substring(0, 2000) });
    memory.feedRecommendations = memory.feedRecommendations.slice(0, 4);
  }

  // --- Weekly digest rotation ---
  if (!memory.weeklyDigestDue) {
    const next = new Date(date);
    next.setDate(next.getDate() + 7);
    memory.weeklyDigestDue = next.toISOString().slice(0, 10);
  }

  // --- v4.0: Learn from structured feedback ---
  if (feedbackStructured) {
    memory.sourceRatings = memory.sourceRatings || {};
    memory.sectionPerformance = memory.sectionPerformance || {};
    memory.topicPreferences = memory.topicPreferences || {};

    // Update source ratings from article feedback
    if (feedbackStructured.mustReads?.length > 0) {
      for (const item of feedbackStructured.mustReads) {
        if (!item.source) continue;
        const ratingMap = { love: 5, ok: 3, skip: 1 };
        const score = ratingMap[item.rating] ?? 3;
        const existing = memory.sourceRatings[item.source] || { total: 0, sumScore: 0, avgScore: 0 };
        existing.total += 1;
        existing.sumScore = (existing.sumScore || 0) + score;
        existing.avgScore = parseFloat((existing.sumScore / existing.total).toFixed(2));
        existing.lastFeedback = date;
        memory.sourceRatings[item.source] = existing;
      }
    }

    // Update section performance from section ratings
    if (feedbackStructured.sections) {
      const ratingMap = { love: 5, great: 5, ok: 3, skip: 1, useless: 1 };
      for (const [section, rating] of Object.entries(feedbackStructured.sections)) {
        const score = ratingMap[String(rating).toLowerCase()] ?? 3;
        const existing = memory.sectionPerformance[section] || { runs: 0, sumScore: 0, avgRating: 0 };
        existing.runs += 1;
        existing.sumScore = (existing.sumScore || 0) + score;
        existing.avgRating = parseFloat((existing.sumScore / existing.runs).toFixed(2));
        memory.sectionPerformance[section] = existing;
      }
    }

    // Log feedback consumed
    memory.lastFeedback = { date, rating: feedbackStructured.briefingRating, notes: feedbackStructured.openNotes };
  }

  await mkdir('data', { recursive: true });
  await writeFile(MEMORY_FILE, JSON.stringify(memory, null, 2), 'utf-8');
  console.log(`  ✅ Memory updated (sourceRatings: ${Object.keys(memory.sourceRatings || {}).length} sources tracked)`);
}

// ── Feedback Template ─────────────────────────────────────────

/**
 * Write the structured JSON feedback template for next run.
 * Also writes a markdown version for MylifeOS (Obsidian) compatibility.
 */
async function writeFeedbackTemplate(briefing, date) {
  // Extract must-read article titles and sources for the template
  const articleMatches = [...briefing.matchAll(/\*\*\[([^\]]+)\]\*\*[^\n]*—\s*([^\n(]+)/g)];
  const articles = articleMatches.slice(0, 8).map(m => ({
    title: m[1].trim(),
    source: m[2].trim(),
    rating: null,
  }));

  // JSON template (v4.0 structured format, read by synthesize.js)
  const jsonTemplate = {
    date,
    briefingRating: null,
    mustReads: articles.map(a => ({ ...a, rating: null })),
    sections: {
      SIGNAL: null,
      MUST_READ_LIST: null,
      BUILDER_INTELLIGENCE: null,
      PIONEER_ADVANTAGE: null,
      TOOLS_TO_TRY: null,
      BUILD_WATCH: null,
      ACTION_AUDIT: null,
      TODAYS_PRIORITIES: null,
      WORLD_LENS: null,
      EUROPE_TECH: null,
      TREND_TRACKER: null,
    },
    openNotes: '',
    _instructions: 'Rating values: love / ok / skip — or 1-5 for briefingRating. Fill via PRISM Portal or edit JSON directly.',
  };

  await mkdir('data', { recursive: true });
  await writeFile(FEEDBACK_FILE.replace('.json', '-template.json'), JSON.stringify(jsonTemplate, null, 2), 'utf-8');

  // Markdown template (for MylifeOS / Obsidian compatibility)
  const mdTemplate = `# PRISM Feedback — ${date}

Edit this file in Obsidian OR react via the PRISM Portal.
PRISM reads this before the next run. Delete sections you don't care about.

## Rate Today's Briefing
<!-- Delete all but one -->
- 5 (GREAT)
- 4 (GOOD)
- 3 (MEH)
- 2 (BAD)
- 1 (TERRIBLE)

## Articles
${articles.map(a => `### ${a.title} (${a.source})\n- [ ] Love  [ ] OK  [ ] Skip`).join('\n\n')}

## Section Ratings
- 🧱 BUILDER INTELLIGENCE: [ ] Love  [ ] OK  [ ] Skip
- 📊 PIONEER ADVANTAGE: [ ] Love  [ ] OK  [ ] Skip
- 🛠️ TOOLS TO TRY: [ ] Love  [ ] OK  [ ] Skip
- 🌍 WORLD LENS: [ ] Love  [ ] OK  [ ] Skip
- 🇪🇺 EUROPE TECH: [ ] Love  [ ] OK  [ ] Skip

## Notes
<!-- Write anything here: too much X, not enough Y, loved Z, follow up on... -->

`;

  await writeFile('data/feedback-template.md', mdTemplate, 'utf-8');
  console.log(`  ✅ Feedback templates written (JSON + Markdown)`);
}

// ── Main Export ──────────────────────────────────────────────

/**
 * Run parallel synthesis: Call A (Builder) + Call B (World) concurrently.
 * Assembles their outputs into the final briefing in canonical section order.
 *
 * @param {object[]} articles - Articles with full text from read.js (includes tier property)
 * @param {object|null} classified - Original { tier1, tier2, tier3 } from classify.js
 * @param {object|null} deepDiveReport - Optional deep dive (unchanged from v3.x)
 * @returns {{ briefing, filepath, tokens, webSearches }}
 */
export default async function synthesize(articles, classified = null, deepDiveReport = null) {
  const today = format(new Date(), 'yyyy-MM-dd');
  const dateFormatted = format(new Date(), 'MMMM d, yyyy');
  const portalUrl = buildPortalUrl(today);

  console.log(`\n🧠 SYNTHESIZE — ${articles.length} articles → Call A ∥ Call B (parallel)...`);

  // Load all context in parallel
  const [lifeContext, newsInterests, webIntelligence, lastBriefings, memory, feedback] = await Promise.all([
    loadLifeContext(),
    loadNewsInterests(),
    loadWebIntelligence(),
    loadLastBriefings(3),
    loadMemory(),
    loadFeedback(),
  ]);

  // Build memory summary
  const memoryJson = JSON.stringify({
    topicFrequency: memory.topicFrequency || {},
    toolsMentioned: memory.toolsMentioned || [],
    projectWatchlist: memory.projectWatchlist || [],
    sourceRatings: memory.sourceRatings || {},
    sectionPerformance: memory.sectionPerformance || {},
  }, null, 2);

  // Build action audit from yesterday
  const yesterdayActions = memory.actionTracking?.[0]?.actions || [];
  const actionAuditBlock = yesterdayActions.length > 0
    ? `Yesterday's recommended actions:\n${yesterdayActions.map(a => `- ${a.action} (${a.project}) — status: ${a.status}`).join('\n')}`
    : 'No previous actions to track.';

  // Split articles by tier for each synthesis call
  const tier1Articles = articles.filter(a => a.tier === 1);
  const tier2And3Articles = articles.filter(a => a.tier !== 1);

  // If classify tiers weren't preserved, split by score
  const builderArticles = tier1Articles.length > 0 ? tier1Articles : articles.slice(0, Math.ceil(articles.length / 2));
  const worldArticles = tier2And3Articles.length > 0 ? tier2And3Articles : articles.slice(Math.ceil(articles.length / 2));

  const feedbackText = feedback.text;

  console.log(`  Builder articles (Tier 1): ${builderArticles.length}`);
  console.log(`  World articles (Tier 2/3): ${worldArticles.length}`);

  // ── Parallel execution: Call A + Call B ──────────────────────
  let callAResult = null;
  let callBResult = null;

  const callAPromise = callBuilderSynth(
    builderArticles, webIntelligence, lifeContext, newsInterests,
    memory, feedbackText, actionAuditBlock, dateFormatted, portalUrl
  ).then(result => { callAResult = result; return result; });

  const callBPromise = callWorldSynth(
    worldArticles, webIntelligence, lifeContext, lastBriefings, feedbackText, portalUrl
  ).then(result => { callBResult = result; return result; })
    .catch(err => {
      // Call B failure is non-fatal — briefing can still be delivered with Call A only
      console.log(`  ⚠️ Call B (World) failed: ${err.message}`);
      console.log(`  Continuing with Call A sections only...`);
      callBResult = {
        output: '## 📊 PIONEER ADVANTAGE CHECK\n\n*World synthesis unavailable this run.*\n\n## 🌍 WORLD LENS\n\n*World synthesis unavailable this run.*',
        tokens: { input: 0, output: 0 },
        webSearches: 0,
      };
      return callBResult;
    });

  const [callA, callB] = await Promise.all([callAPromise, callBPromise]);

  const totalWebSearches = callA.webSearches + callB.webSearches;
  const totalInputTokens = callA.tokens.input + callB.tokens.input;
  const totalOutputTokens = callA.tokens.output + callB.tokens.output;
  const totalCost = estimateCost(totalInputTokens, totalOutputTokens);

  console.log(`  Call A: ${callA.tokens.input.toLocaleString()} in / ${callA.tokens.output.toLocaleString()} out, ${callA.webSearches} searches`);
  console.log(`  Call B: ${callB.tokens.input.toLocaleString()} in / ${callB.tokens.output.toLocaleString()} out, ${callB.webSearches} searches`);
  console.log(`  Total web searches: ${totalWebSearches}`);

  // ── Assembly ─────────────────────────────────────────────────
  let briefing = assembleBriefing(callA.output, callB.output, dateFormatted, articles.length, totalWebSearches, totalCost);

  // Insert deep dive sections if present
  if (deepDiveReport?.deepDives?.length > 0) {
    const deepDiveSections = deepDiveReport.deepDives
      .map(d => `## 🔬 DEEP DIVE: ${d.topic}\n\n${d.summary}\n\n*Full report: briefings/deep-dives/*`)
      .join('\n\n');
    const prioritiesRegex = /\n(##\s*🎯\s*TODAY'S PRIORITIES[^\n]*\n)/i;
    if (prioritiesRegex.test(briefing)) {
      briefing = briefing.replace(prioritiesRegex, `\n${deepDiveSections}\n\n$1`);
    } else {
      briefing += `\n\n${deepDiveSections}`;
    }
  }

  // ── Save briefing ─────────────────────────────────────────────
  await mkdir(BRIEFINGS_DIR, { recursive: true });
  const filepath = `${BRIEFINGS_DIR}/${today}.md`;
  await writeFile(filepath, briefing, 'utf-8');
  console.log(`  ✅ Briefing saved to ${filepath}`);

  // ── Update memory and write feedback template ────────────────
  await updateMemory(today, memory, briefing, articles, feedback.structured);
  await writeFeedbackTemplate(briefing, today);

  return {
    briefing,
    filepath,
    tokens: { input_tokens: totalInputTokens, output_tokens: totalOutputTokens },
    webSearches: totalWebSearches,
  };
}
