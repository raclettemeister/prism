// ============================================================
// PRISM v2.0 Synthesizer — Action tracking, human signal data,
// feed quality tracking, weekly digest mode
// ============================================================

import { writeFile, readFile, mkdir, readdir } from 'fs/promises';
import { format } from 'date-fns';
import Anthropic from '@anthropic-ai/sdk';
import {
  MODELS,
  SYNTHESIS_PROMPT,
  LIMITS,
  MEMORY_FILE,
  BRIEFINGS_DIR,
  LIFE_CONTEXT_FILE,
} from './config.js';

const client = new Anthropic();

/**
 * @param {object} analysis - Cross-reference analysis from analyze.js
 * @param {object} stats - Pipeline stats (articlesScored, articlesAnalyzed, etc.)
 * @param {object|null} deepDiveReport - Optional deep dive report
 * @param {object[]} individuallyAnalyzed - Articles with .analysis from analyzeIndividual
 */
export default async function synthesize(analysis, stats, deepDiveReport = null, individuallyAnalyzed = []) {
  const today = format(new Date(), 'yyyy-MM-dd');
  console.log(`\n📝 SYNTHESIZING briefing for ${today}...`);

  const lifeContext = await loadLifeContext();
  const lastBriefings = await loadLastBriefings(3);
  const memory = await loadMemory();

  // Build memory JSON with projectWatchlist
  const memoryJson = JSON.stringify(
    {
      topicFrequency: memory.topicFrequency || {},
      toolsMentioned: memory.toolsMentioned || [],
      projectWatchlist: memory.projectWatchlist || [],
    },
    null,
    2
  );

  // Build action audit block from yesterday's actions
  const yesterdayActions = memory.actionTracking?.[0]?.actions || [];
  const actionAuditBlock = yesterdayActions.length > 0
    ? `Yesterday's recommended actions:\n${yesterdayActions.map(a => `- ${a.action} (for ${a.project}) — status: ${a.status}`).join('\n')}`
    : 'No previous actions to track.';

  // Build human signal data block
  const humanSignalBlock = buildHumanSignalBlock(individuallyAnalyzed);

  // Check for weekly digest mode
  const isWeeklyDigest = memory.weeklyDigestDue && today >= memory.weeklyDigestDue;
  const weeklyNote = isWeeklyDigest
    ? '\n\nNOTE: This is a WEEKLY DIGEST day. Expand the Trend Tracker section with a full week analysis. Include a complete action audit covering all 7 days. Summarize the week\'s key themes and shifts.'
    : '';

  // Replace placeholders in synthesis prompt
  const prompt = SYNTHESIS_PROMPT
    .replace('{date}', format(new Date(), 'MMMM d, yyyy'))
    .replace('{life_context}', lifeContext)
    .replace('{last_briefings}', lastBriefings)
    .replace('{memory_json}', memoryJson)
    .replace('{action_audit}', actionAuditBlock);

  const userContent = `${prompt}${weeklyNote}\n\n${humanSignalBlock}\n\n${JSON.stringify(analysis, null, 2)}`;

  const response = await client.messages.create({
    model: MODELS.synthesizer,
    max_tokens: LIMITS.synthesisMaxTokens,
    messages: [{ role: 'user', content: userContent }],
  });

  let briefing = response.content[0].text.trim();

  // Insert deep dive sections if present
  if (deepDiveReport && deepDiveReport.deepDives && deepDiveReport.deepDives.length > 0) {
    const deepDiveSections = deepDiveReport.deepDives
      .map(
        (d) =>
          `## 🔬 DEEP DIVE: ${d.topic}\n\n${d.summary}\n\nFull report saved to briefings/deep-dives/`
      )
      .join('\n\n');
    const prioritiesRegex = /\n(##\s*🎯\s*TODAY'S PRIORITIES[^\n]*\n)/i;
    if (prioritiesRegex.test(briefing)) {
      briefing = briefing.replace(prioritiesRegex, `\n${deepDiveSections}\n\n$1`);
    } else {
      briefing += `\n\n${deepDiveSections}\n\n`;
    }
  }

  // Add footer
  const footer = `\n---\n*PRISM v2.0 — ${stats.articlesScored} articles scored, ${stats.articlesAnalyzed} analyzed, ${stats.totalTokens.toLocaleString()} tokens (~$${stats.estimatedCost})*`;
  if (!briefing.includes('*PRISM v2.0')) briefing += footer;

  // Save briefing
  await mkdir(BRIEFINGS_DIR, { recursive: true });
  const filepath = `${BRIEFINGS_DIR}/${today}.md`;
  await writeFile(filepath, briefing, 'utf-8');
  console.log(`  ✅ Briefing saved to ${filepath}`);

  // Update memory with all v2.0 data
  await updateMemory(analysis, today, memory, briefing, individuallyAnalyzed, isWeeklyDigest);

  console.log(`  Tokens: ${response.usage.input_tokens.toLocaleString()} in / ${response.usage.output_tokens.toLocaleString()} out`);

  return { briefing, filepath, tokens: response.usage };
}

/**
 * Build the human signal data block for the synthesis prompt.
 */
function buildHumanSignalBlock(individuallyAnalyzed) {
  if (!individuallyAnalyzed || individuallyAnalyzed.length === 0) {
    return '===== HUMAN SIGNAL DATA =====\nNo individual analysis data available.';
  }

  // Cross-feed articles
  const crossFeedArticles = individuallyAnalyzed
    .filter(a => (a.crossFeedCount || 1) >= 2)
    .sort((a, b) => (b.crossFeedCount || 1) - (a.crossFeedCount || 1))
    .map(a => ({
      title: a.title,
      url: a.link,
      source: a.source,
      crossFeedCount: a.crossFeedCount,
      humanSignal: a.analysis?.human_signal || 'unknown',
      conversationValue: a.analysis?.conversation_value || 'unknown',
    }));

  // Slop detection
  const slopCount = individuallyAnalyzed.filter(a => a.analysis?.human_signal === 'likely_slop').length;
  const slopFeeds = {};
  for (const a of individuallyAnalyzed) {
    if (a.analysis?.human_signal === 'likely_slop') {
      slopFeeds[a.source] = (slopFeeds[a.source] || 0) + 1;
    }
  }

  return `
===== HUMAN SIGNAL DATA =====
Cross-feed articles (appeared in 2+ independent feeds):
${JSON.stringify(crossFeedArticles, null, 2)}

Slop detection: ${slopCount} of ${individuallyAnalyzed.length} articles flagged as likely AI slop.
Worst slop sources: ${JSON.stringify(slopFeeds)}
`;
}

async function loadLifeContext() {
  try {
    const raw = await readFile(LIFE_CONTEXT_FILE, 'utf-8');
    return raw;
  } catch {
    return `Julien — founder, Chez Julien (Brussels). Building with AI (Operation Autonomy, PRISM, blog, games). Non-coder, uses Claude + Cursor. (No data/life-context.md found.)`;
  }
}

async function loadLastBriefings(maxCount) {
  try {
    const files = await readdir(BRIEFINGS_DIR);
    const md = files.filter((f) => f.endsWith('.md')).sort().reverse().slice(0, maxCount);
    const contents = await Promise.all(
      md.map((f) => readFile(`${BRIEFINGS_DIR}/${f}`, 'utf-8').then((c) => `--- ${f} ---\n${c}`))
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
    return { lastRun: null, feedHealth: {}, topicFrequency: {}, toolsMentioned: [], lastBriefings: [], actionTracking: [], projectWatchlist: [], feedQuality: {} };
  }
}

async function updateMemory(analysis, date, memory, briefing, individuallyAnalyzed, isWeeklyDigest) {
  // --- Last briefings ---
  memory.lastBriefings = memory.lastBriefings || [];
  memory.lastBriefings.unshift({
    date,
    bigStory: analysis.big_story?.title || '',
    patterns: (analysis.patterns || []).map((p) => (typeof p === 'object' ? p.pattern : p)),
    toolsFlagged: (analysis.tools_and_techniques || []).map((t) => t.name),
    projectConnections: (analysis.project_connections || []).map((p) => p.project),
  });
  memory.lastBriefings = memory.lastBriefings.slice(0, 7);

  // --- Topic frequency ---
  const newPatterns = analysis.patterns || [];
  const topicFrequency = memory.topicFrequency || {};
  for (const p of newPatterns) {
    const key = typeof p === 'object' ? (p.pattern || '').slice(0, 50) : String(p).slice(0, 50);
    if (!key) continue;
    const slug = key.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
    if (!slug) continue;
    topicFrequency[slug] = {
      mentions: (topicFrequency[slug]?.mentions || 0) + 1,
      lastSeen: date,
      trend: topicFrequency[slug] ? 'rising' : 'new',
    };
  }
  memory.topicFrequency = topicFrequency;

  // --- Tools mentioned ---
  const toolsMentioned = memory.toolsMentioned || [];
  for (const t of analysis.tools_and_techniques || []) {
    const name = t.name || t.url;
    if (!name) continue;
    const existing = toolsMentioned.find((m) => m.name === name || m.name === t.name);
    if (existing) {
      existing.mentions = (existing.mentions || 0) + 1;
    } else {
      toolsMentioned.push({
        name: t.name,
        firstSeen: date,
        mentions: 1,
        category: 'ai_tools',
        url: t.url,
      });
    }
  }
  memory.toolsMentioned = toolsMentioned.slice(0, 100);

  // --- Action tracking (v2.0) ---
  const todayActions = [];
  // Parse actions from the briefing text (look for numbered items under TODAY'S PRIORITIES)
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
  memory.actionTracking = memory.actionTracking.slice(0, 7); // Keep 7 days

  // --- Project watchlist (v2.0) ---
  memory.projectWatchlist = memory.projectWatchlist || [];
  // Update existing project watchlist entries from tool mentions
  for (const t of analysis.tools_and_techniques || []) {
    if (!t.name) continue;
    const existing = memory.projectWatchlist.find(p => p.name.toLowerCase() === t.name.toLowerCase());
    if (existing) {
      existing.lastMentioned = date;
      existing.mentionCount = (existing.mentionCount || 0) + 1;
      if (t.url && !existing.urls.includes(t.url)) existing.urls.push(t.url);
    }
    // Don't auto-add to watchlist — that should be manual or from explicit project mentions
  }

  // --- Feed quality tracking (v2.0) ---
  memory.feedQuality = memory.feedQuality || {};
  if (individuallyAnalyzed && individuallyAnalyzed.length > 0) {
    for (const a of individuallyAnalyzed) {
      const source = a.source;
      if (!source) continue;
      if (!memory.feedQuality[source]) {
        memory.feedQuality[source] = { humanCount: 0, slopCount: 0, lastChecked: date };
      }
      const fq = memory.feedQuality[source];
      fq.lastChecked = date;
      if (a.analysis?.human_signal === 'likely_slop') {
        fq.slopCount = (fq.slopCount || 0) + 1;
      } else if (a.analysis?.human_signal === 'human_authored' || a.analysis?.human_signal === 'human_curated') {
        fq.humanCount = (fq.humanCount || 0) + 1;
      }
    }
  }

  // --- Weekly digest due date ---
  if (!memory.weeklyDigestDue || isWeeklyDigest) {
    const next = new Date(date);
    next.setDate(next.getDate() + 7);
    memory.weeklyDigestDue = next.toISOString().slice(0, 10);
  }

  await mkdir('data', { recursive: true });
  await writeFile(MEMORY_FILE, JSON.stringify(memory, null, 2), 'utf-8');
  console.log(`  ✅ Memory updated (feedHealth, topicFrequency, toolsMentioned, actionTracking, feedQuality)`);
}
