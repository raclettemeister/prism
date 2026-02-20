// ============================================================
// PRISM v3.0 — THE BIG CALL
// One massive Sonnet 4.6 call with 1M context + web search.
// Replaces: analyze-individual.js + analyze.js + synthesize.js
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
  RESEARCH_PROMPT,
} from './config.js';

const client = new Anthropic();

/**
 * Strip unpaired Unicode surrogates that cause "no low surrogate" JSON errors.
 * RSS feeds sometimes contain corrupted characters.
 */
function sanitizeUnicode(str) {
  // Replace each surrogate individually, keeping valid pairs
  return str.replace(/[\uD800-\uDFFF]/g, (ch, i, s) => {
    const code = ch.charCodeAt(0);
    if (code >= 0xD800 && code <= 0xDBFF) {
      // High surrogate — keep if followed by low surrogate
      const next = s.charCodeAt(i + 1);
      return (next >= 0xDC00 && next <= 0xDFFF) ? ch : '';
    }
    // Low surrogate — keep if preceded by high surrogate
    const prev = s.charCodeAt(i - 1);
    return (prev >= 0xD800 && prev <= 0xDBFF) ? ch : '';
  });
}

/**
 * THE BIG CALL — Sonnet 4.6 with 1M context + web search.
 * Receives all read articles, produces the complete briefing.
 *
 * @param {object[]} articles - Articles with full text from read.js
 * @param {object} stats - Pipeline stats
 * @param {object|null} deepDiveReport - Optional deep dive
 * @returns {{ briefing, filepath, tokens, webSearches }}
 */
export default async function research(articles, deepDiveReport = null) {
  const today = format(new Date(), 'yyyy-MM-dd');
  console.log(`\n🧠 THE BIG CALL — ${articles.length} articles → Sonnet 4.6 (1M context + web search)...`);

  // Load all context in parallel
  const [lifeContext, newsInterests, lastBriefings, memory, feedback] = await Promise.all([
    loadLifeContext(),
    loadNewsInterests(),
    loadLastBriefings(3),
    loadMemory(),
    loadFeedback(),
  ]);

  // Build memory JSON
  const memoryJson = JSON.stringify({
    topicFrequency: memory.topicFrequency || {},
    toolsMentioned: memory.toolsMentioned || [],
    projectWatchlist: memory.projectWatchlist || [],
    feedQuality: memory.feedQuality || {},
  }, null, 2);

  // Build action audit from yesterday
  const yesterdayActions = memory.actionTracking?.[0]?.actions || [];
  const actionAuditBlock = yesterdayActions.length > 0
    ? `Yesterday's recommended actions:\n${yesterdayActions.map(a => `- ${a.action} (for ${a.project}) — status: ${a.status}`).join('\n')}`
    : 'No previous actions to track.';

  // Build articles block — ALL articles with full context
  const articlesBlock = articles
    .map((a, i) => {
      const content = a.fullTextAvailable && a.fullText
        ? a.fullText
        : (a.content || 'No content available');
      return `--- ARTICLE ${i + 1} (Score: ${a.score}/10, Category: ${a.category || 'unknown'}, CrossFeedCount: ${a.crossFeedCount || 1}, Source: ${a.source}) ---
TITLE: ${a.title}
URL: ${a.link}
DATE: ${a.date}

CONTENT:
${content.substring(0, LIMITS.maxArticleLength)}
`;
    })
    .join('\n');

  // Build feedback block
  const feedbackBlock = feedback
    ? `===== YOUR FEEDBACK FROM LAST BRIEFING =====\n${feedback}\n`
    : '';

  // Check weekly digest mode
  const isWeeklyDigest = memory.weeklyDigestDue && today >= memory.weeklyDigestDue;
  const weeklyNote = isWeeklyDigest
    ? '\n\nNOTE: This is a WEEKLY DIGEST day. Expand Trend Tracker with full week analysis. Include complete action audit covering all 7 days.'
    : '';

  // Replace placeholders in prompt
  const prompt = RESEARCH_PROMPT
    .replace('{date}', format(new Date(), 'MMMM d, yyyy'))
    .replace('{life_context}', lifeContext)
    .replace('{news_interests}', newsInterests)
    .replace('{last_briefings}', lastBriefings)
    .replace('{memory_json}', memoryJson)
    .replace('{action_audit}', actionAuditBlock)
    .replace('{feedback}', feedbackBlock);

  const userContent = sanitizeUnicode(`${prompt}${weeklyNote}\n\n===== TODAY'S ARTICLES (${articles.length} total) =====\n${articlesBlock}`);

  const estimatedTokens = Math.round(userContent.length / 4);
  console.log(`  Context size: ~${estimatedTokens.toLocaleString()} tokens (estimated)`);

  // THE BIG CALL — Sonnet 4.6 with web search + 1M context + adaptive thinking
  let response;
  try {
    const stream = client.beta.messages.stream({
      model: MODELS.analyzer,
      max_tokens: LIMITS.synthesisMaxTokens,
      thinking: { type: 'adaptive' },
      betas: SONNET_46_BETAS,
      tools: [
        {
          type: 'web_search_20260209',
          name: 'web_search',
        },
      ],
      messages: [{ role: 'user', content: userContent }],
    });
    response = await stream.finalMessage();
  } catch (err) {
    // Fallback: if web search or 1M context fails, try without them
    console.log(`  ⚠️ Big call failed: ${err.message}`);
    console.log(`  Retrying without web search and 1M context...`);
    const fallbackStream = client.messages.stream({
      model: MODELS.analyzer,
      max_tokens: LIMITS.synthesisMaxTokens,
      messages: [{ role: 'user', content: userContent.substring(0, 800000) }], // trim to ~200K tokens
    });
    response = await fallbackStream.finalMessage();
  }

  // Extract the briefing text from the response
  // Response may contain thinking blocks, text blocks, and server_tool_use blocks
  let briefing = '';
  let webSearchCount = 0;
  for (const block of response.content) {
    if (block.type === 'text') {
      briefing += block.text;
    }
    if (block.type === 'server_tool_use' && block.name === 'web_search') {
      webSearchCount++;
    }
  }
  briefing = briefing.trim();

  // Insert deep dive sections if present
  if (deepDiveReport?.deepDives?.length > 0) {
    const deepDiveSections = deepDiveReport.deepDives
      .map(d => `## 🔬 DEEP DIVE: ${d.topic}\n\n${d.summary}\nFull report saved to briefings/deep-dives/`)
      .join('\n\n');
    const prioritiesRegex = /\n(##\s*🎯\s*TODAY'S PRIORITIES[^\n]*\n)/i;
    if (prioritiesRegex.test(briefing)) {
      briefing = briefing.replace(prioritiesRegex, `\n${deepDiveSections}\n\n$1`);
    } else {
      briefing += `\n\n${deepDiveSections}\n\n`;
    }
  }

  // Add footer
  const finalCost = estimateCost(
    response.usage.input_tokens,
    response.usage.output_tokens,
  );
  const footer = `\n---\n*PRISM v3.0 — ${articles.length} analyzed, ${webSearchCount} web searches, ~${finalCost}*`;
  if (!briefing.includes('*PRISM v3.0')) briefing += footer;

  // Save briefing
  await mkdir(BRIEFINGS_DIR, { recursive: true });
  const filepath = `${BRIEFINGS_DIR}/${today}.md`;
  await writeFile(filepath, briefing, 'utf-8');
  console.log(`  ✅ Briefing saved to ${filepath}`);
  console.log(`  Web searches: ${webSearchCount}`);

  // Update memory
  await updateMemory(today, memory, briefing, articles, isWeeklyDigest);

  // Write feedback template for next run
  await writeFeedbackTemplate(briefing, today);

  const tokens = {
    input_tokens: response.usage.input_tokens,
    output_tokens: response.usage.output_tokens,
  };
  console.log(`  Tokens: ${tokens.input_tokens.toLocaleString()} in / ${tokens.output_tokens.toLocaleString()} out`);

  return { briefing, filepath, tokens, webSearches: webSearchCount };
}

function estimateCost(inputTokens, outputTokens) {
  // All Sonnet 4.6: $3/$15 per MTok
  return ((inputTokens / 1_000_000) * 3 + (outputTokens / 1_000_000) * 15).toFixed(2);
}

// ── Loaders ──────────────────────────────────────────────

async function loadLifeContext() {
  try {
    return await readFile(LIFE_CONTEXT_FILE, 'utf-8');
  } catch {
    return 'Julien — founder, Chez Julien (Brussels). Building with AI. Non-coder, uses Claude + Cursor.';
  }
}

async function loadNewsInterests() {
  try {
    return await readFile(NEWS_INTERESTS_FILE, 'utf-8');
  } catch {
    return 'No news interests file found. Use defaults: AI tools, European tech, geopolitics, indie founders.';
  }
}

async function loadLastBriefings(maxCount) {
  try {
    const files = await readdir(BRIEFINGS_DIR);
    const md = files.filter(f => f.endsWith('.md')).sort().reverse().slice(0, maxCount);
    const contents = await Promise.all(
      md.map(f => readFile(`${BRIEFINGS_DIR}/${f}`, 'utf-8').then(c => `--- ${f} ---\n${c}`))
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
    };
  }
}

async function loadFeedback() {
  try {
    const raw = await readFile('data/feedback-latest.md', 'utf-8');
    if (raw.trim() && !raw.includes('(empty — edit this section)')) {
      return raw;
    }
    return null;
  } catch {
    return null;
  }
}

// ── Feedback Template ────────────────────────────────────

async function writeFeedbackTemplate(briefing, date) {
  // Extract article titles from the briefing
  const articleMatches = briefing.match(/\*\*\[([^\]]+)\]\*\*/g) || [];
  const titles = articleMatches.map(m => m.replace(/\*\*/g, '').replace(/\[|\]/g, '')).slice(0, 8);

  // Extract tool names
  const toolMatches = briefing.match(/\*\*([^*]+)\*\* —/g) || [];
  const tools = toolMatches.map(m => m.replace(/\*\*/g, '').replace(/ —/, '')).slice(0, 5);

  const template = `# PRISM Feedback — ${date}

Edit this file in Obsidian. PRISM reads it before the next run.
Delete sections you don't care about. Uncomment lines you want to act on.

## Rate Today's Briefing
<!-- Delete all but one -->
- GREAT
- GOOD
- MEH
- BAD

## Loved (find more like this)
${titles.map(t => `# - ${t}`).join('\n')}

## Follow Up On
${titles.map(t => `# - ${t}`).join('\n')}

## Less Of
-

## Tools I Tried
${tools.map(t => `# - ${t}: `).join('\n')}

## Feed Notes
- Add:
- Remove:

## Free Notes

`;

  await mkdir('data', { recursive: true });
  await writeFile('data/feedback-template.md', template, 'utf-8');
  console.log(`  ✅ Feedback template written`);
}

// ── Memory Update ────────────────────────────────────────

async function updateMemory(date, memory, briefing, articles, isWeeklyDigest) {
  // --- Last briefings ---
  memory.lastBriefings = memory.lastBriefings || [];
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
  memory.actionTracking = memory.actionTracking || [];
  memory.actionTracking.unshift({ date, actions: todayActions });
  memory.actionTracking = memory.actionTracking.slice(0, 7);

  // --- Feed quality tracking ---
  memory.feedQuality = memory.feedQuality || {};
  for (const a of articles) {
    const source = a.source;
    if (!source) continue;
    if (!memory.feedQuality[source]) {
      memory.feedQuality[source] = { articleCount: 0, lastSeen: date };
    }
    memory.feedQuality[source].articleCount = (memory.feedQuality[source].articleCount || 0) + 1;
    memory.feedQuality[source].lastSeen = date;
  }

  // --- Feed recommendations from briefing ---
  const feedHealthMatch = briefing.match(/FEED HEALTH REPORT[\s\S]*?(?=##|$)/i);
  if (feedHealthMatch) {
    memory.feedRecommendations = memory.feedRecommendations || [];
    memory.feedRecommendations.unshift({
      date,
      report: feedHealthMatch[0].substring(0, 2000),
    });
    memory.feedRecommendations = memory.feedRecommendations.slice(0, 4);
  }

  // --- Weekly digest rotation ---
  if (!memory.weeklyDigestDue || isWeeklyDigest) {
    const next = new Date(date);
    next.setDate(next.getDate() + 7);
    memory.weeklyDigestDue = next.toISOString().slice(0, 10);
  }

  // --- Process feedback ---
  const feedbackContent = await loadFeedback();
  if (feedbackContent) {
    memory.lastFeedback = { date, content: feedbackContent.substring(0, 2000) };
    try {
      await writeFile('data/feedback-latest.md', '', 'utf-8');
    } catch { /* ok */ }
  }

  await mkdir('data', { recursive: true });
  await writeFile(MEMORY_FILE, JSON.stringify(memory, null, 2), 'utf-8');
  console.log(`  ✅ Memory updated`);
}
// ============================================================
// PRISM v3.0 — THE BIG CALL
// One massive Sonnet 4.6 call with 1M context + web search.
// Replaces: analyze-individual.js + analyze.js + synthesize.js
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
  RESEARCH_PROMPT,
} from './config.js';

const client = new Anthropic();

/**
 * THE BIG CALL — Sonnet 4.6 with 1M context + web search.
 * Receives all read articles, produces the complete briefing.
 *
 * @param {object[]} articles - Articles with full text from read.js
 * @param {object} stats - Pipeline stats
 * @param {object|null} deepDiveReport - Optional deep dive
 * @returns {{ briefing, filepath, tokens, webSearches }}
 */
export default async function research(articles, deepDiveReport = null) {
  const today = format(new Date(), 'yyyy-MM-dd');
  console.log(`\n🧠 THE BIG CALL — ${articles.length} articles → Sonnet 4.6 (1M context + web search)...`);

  // Load all context in parallel
  const [lifeContext, newsInterests, lastBriefings, memory, feedback] = await Promise.all([
    loadLifeContext(),
    loadNewsInterests(),
    loadLastBriefings(3),
    loadMemory(),
    loadFeedback(),
  ]);

  // Build memory JSON
  const memoryJson = JSON.stringify({
    topicFrequency: memory.topicFrequency || {},
    toolsMentioned: memory.toolsMentioned || [],
    projectWatchlist: memory.projectWatchlist || [],
    feedQuality: memory.feedQuality || {},
  }, null, 2);

  // Build action audit from yesterday
  const yesterdayActions = memory.actionTracking?.[0]?.actions || [];
  const actionAuditBlock = yesterdayActions.length > 0
    ? `Yesterday's recommended actions:\n${yesterdayActions.map(a => `- ${a.action} (for ${a.project}) — status: ${a.status}`).join('\n')}`
    : 'No previous actions to track.';

  // Build articles block — ALL articles with full context
  const articlesBlock = articles
    .map((a, i) => {
      const content = a.fullTextAvailable && a.fullText
        ? a.fullText
        : (a.content || 'No content available');
      return `--- ARTICLE ${i + 1} (Score: ${a.score}/10, Category: ${a.category || 'unknown'}, CrossFeedCount: ${a.crossFeedCount || 1}, Source: ${a.source}) ---
TITLE: ${a.title}
URL: ${a.link}
DATE: ${a.date}

CONTENT:
${content.substring(0, LIMITS.maxArticleLength)}
`;
    })
    .join('\n');

  // Build feedback block
  const feedbackBlock = feedback
    ? `===== YOUR FEEDBACK FROM LAST BRIEFING =====\n${feedback}\n`
    : '';

  // Check weekly digest mode
  const isWeeklyDigest = memory.weeklyDigestDue && today >= memory.weeklyDigestDue;
  const weeklyNote = isWeeklyDigest
    ? '\n\nNOTE: This is a WEEKLY DIGEST day. Expand Trend Tracker with full week analysis. Include complete action audit covering all 7 days.'
    : '';

  // Replace placeholders in prompt
  const prompt = RESEARCH_PROMPT
    .replace('{date}', format(new Date(), 'MMMM d, yyyy'))
    .replace('{life_context}', lifeContext)
    .replace('{news_interests}', newsInterests)
    .replace('{last_briefings}', lastBriefings)
    .replace('{memory_json}', memoryJson)
    .replace('{action_audit}', actionAuditBlock)
    .replace('{feedback}', feedbackBlock);

  const userContent = `${prompt}${weeklyNote}\n\n===== TODAY'S ARTICLES (${articles.length} total) =====\n${articlesBlock}`;

  const estimatedTokens = Math.round(userContent.length / 4);
  console.log(`  Context size: ~${estimatedTokens.toLocaleString()} tokens (estimated)`);

  // THE BIG CALL — Sonnet 4.6 with web search + 1M context + adaptive thinking
  let response;
  try {
    const stream = client.beta.messages.stream({
      model: MODELS.analyzer,
      max_tokens: LIMITS.synthesisMaxTokens,
      thinking: { type: 'adaptive' },
      betas: SONNET_46_BETAS,
      tools: [
        {
          type: 'web_search_20260209',
          name: 'web_search',
        },
      ],
      messages: [{ role: 'user', content: userContent }],
    });
    response = await stream.finalMessage();
  } catch (err) {
    // Fallback: if web search or 1M context fails, try without them
    console.log(`  ⚠️ Big call failed: ${err.message}`);
    console.log(`  Retrying without web search and 1M context...`);
    const fallbackStream = client.messages.stream({
      model: MODELS.analyzer,
      max_tokens: LIMITS.synthesisMaxTokens,
      messages: [{ role: 'user', content: userContent.substring(0, 800000) }], // trim to ~200K tokens
    });
    response = await fallbackStream.finalMessage();
  }

  // Extract the briefing text from the response
  // Response may contain thinking blocks, text blocks, and server_tool_use blocks
  let briefing = '';
  let webSearchCount = 0;
  for (const block of response.content) {
    if (block.type === 'text') {
      briefing += block.text;
    }
    if (block.type === 'server_tool_use' && block.name === 'web_search') {
      webSearchCount++;
    }
  }
  briefing = briefing.trim();

  // Insert deep dive sections if present
  if (deepDiveReport?.deepDives?.length > 0) {
    const deepDiveSections = deepDiveReport.deepDives
      .map(d => `## 🔬 DEEP DIVE: ${d.topic}\n\n${d.summary}\nFull report saved to briefings/deep-dives/`)
      .join('\n\n');
    const prioritiesRegex = /\n(##\s*🎯\s*TODAY'S PRIORITIES[^\n]*\n)/i;
    if (prioritiesRegex.test(briefing)) {
      briefing = briefing.replace(prioritiesRegex, `\n${deepDiveSections}\n\n$1`);
    } else {
      briefing += `\n\n${deepDiveSections}\n\n`;
    }
  }

  // Add footer
  const finalCost = estimateCost(
    response.usage.input_tokens,
    response.usage.output_tokens,
  );
  const footer = `\n---\n*PRISM v3.0 — ${articles.length} analyzed, ${webSearchCount} web searches, ~${finalCost}*`;
  if (!briefing.includes('*PRISM v3.0')) briefing += footer;

  // Save briefing
  await mkdir(BRIEFINGS_DIR, { recursive: true });
  const filepath = `${BRIEFINGS_DIR}/${today}.md`;
  await writeFile(filepath, briefing, 'utf-8');
  console.log(`  ✅ Briefing saved to ${filepath}`);
  console.log(`  Web searches: ${webSearchCount}`);

  // Update memory
  await updateMemory(today, memory, briefing, articles, isWeeklyDigest);

  // Write feedback template for next run
  await writeFeedbackTemplate(briefing, today);

  const tokens = {
    input_tokens: response.usage.input_tokens,
    output_tokens: response.usage.output_tokens,
  };
  console.log(`  Tokens: ${tokens.input_tokens.toLocaleString()} in / ${tokens.output_tokens.toLocaleString()} out`);

  return { briefing, filepath, tokens, webSearches: webSearchCount };
}

function estimateCost(inputTokens, outputTokens) {
  // All Sonnet 4.6: $3/$15 per MTok
  return ((inputTokens / 1_000_000) * 3 + (outputTokens / 1_000_000) * 15).toFixed(2);
}

// ── Loaders ──────────────────────────────────────────────

async function loadLifeContext() {
  try {
    return await readFile(LIFE_CONTEXT_FILE, 'utf-8');
  } catch {
    return 'Julien — founder, Chez Julien (Brussels). Building with AI. Non-coder, uses Claude + Cursor.';
  }
}

async function loadNewsInterests() {
  try {
    return await readFile(NEWS_INTERESTS_FILE, 'utf-8');
  } catch {
    return 'No news interests file found. Use defaults: AI tools, European tech, geopolitics, indie founders.';
  }
}

async function loadLastBriefings(maxCount) {
  try {
    const files = await readdir(BRIEFINGS_DIR);
    const md = files.filter(f => f.endsWith('.md')).sort().reverse().slice(0, maxCount);
    const contents = await Promise.all(
      md.map(f => readFile(`${BRIEFINGS_DIR}/${f}`, 'utf-8').then(c => `--- ${f} ---\n${c}`))
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
    };
  }
}

async function loadFeedback() {
  try {
    const raw = await readFile('data/feedback-latest.md', 'utf-8');
    if (raw.trim() && !raw.includes('(empty — edit this section)')) {
      return raw;
    }
    return null;
  } catch {
    return null;
  }
}

// ── Feedback Template ────────────────────────────────────

async function writeFeedbackTemplate(briefing, date) {
  // Extract article titles from the briefing
  const articleMatches = briefing.match(/\*\*\[([^\]]+)\]\*\*/g) || [];
  const titles = articleMatches.map(m => m.replace(/\*\*/g, '').replace(/\[|\]/g, '')).slice(0, 8);

  // Extract tool names
  const toolMatches = briefing.match(/\*\*([^*]+)\*\* —/g) || [];
  const tools = toolMatches.map(m => m.replace(/\*\*/g, '').replace(/ —/, '')).slice(0, 5);

  const template = `# PRISM Feedback — ${date}

Edit this file in Obsidian. PRISM reads it before the next run.
Delete sections you don't care about. Uncomment lines you want to act on.

## Rate Today's Briefing
<!-- Delete all but one -->
- GREAT
- GOOD
- MEH
- BAD

## Loved (find more like this)
${titles.map(t => `# - ${t}`).join('\n')}

## Follow Up On
${titles.map(t => `# - ${t}`).join('\n')}

## Less Of
-

## Tools I Tried
${tools.map(t => `# - ${t}: `).join('\n')}

## Feed Notes
- Add:
- Remove:

## Free Notes

`;

  await mkdir('data', { recursive: true });
  await writeFile('data/feedback-template.md', template, 'utf-8');
  console.log(`  ✅ Feedback template written`);
}

// ── Memory Update ────────────────────────────────────────

async function updateMemory(date, memory, briefing, articles, isWeeklyDigest) {
  // --- Last briefings ---
  memory.lastBriefings = memory.lastBriefings || [];
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
  memory.actionTracking = memory.actionTracking || [];
  memory.actionTracking.unshift({ date, actions: todayActions });
  memory.actionTracking = memory.actionTracking.slice(0, 7);

  // --- Feed quality tracking ---
  memory.feedQuality = memory.feedQuality || {};
  for (const a of articles) {
    const source = a.source;
    if (!source) continue;
    if (!memory.feedQuality[source]) {
      memory.feedQuality[source] = { articleCount: 0, lastSeen: date };
    }
    memory.feedQuality[source].articleCount = (memory.feedQuality[source].articleCount || 0) + 1;
    memory.feedQuality[source].lastSeen = date;
  }

  // --- Feed recommendations from briefing ---
  const feedHealthMatch = briefing.match(/FEED HEALTH REPORT[\s\S]*?(?=##|$)/i);
  if (feedHealthMatch) {
    memory.feedRecommendations = memory.feedRecommendations || [];
    memory.feedRecommendations.unshift({
      date,
      report: feedHealthMatch[0].substring(0, 2000),
    });
    memory.feedRecommendations = memory.feedRecommendations.slice(0, 4);
  }

  // --- Weekly digest rotation ---
  if (!memory.weeklyDigestDue || isWeeklyDigest) {
    const next = new Date(date);
    next.setDate(next.getDate() + 7);
    memory.weeklyDigestDue = next.toISOString().slice(0, 10);
  }

  // --- Process feedback ---
  const feedbackContent = await loadFeedback();
  if (feedbackContent) {
    memory.lastFeedback = { date, content: feedbackContent.substring(0, 2000) };
    try {
      await writeFile('data/feedback-latest.md', '', 'utf-8');
    } catch { /* ok */ }
  }

  await mkdir('data', { recursive: true });
  await writeFile(MEMORY_FILE, JSON.stringify(memory, null, 2), 'utf-8');
  console.log(`  ✅ Memory updated`);
}
