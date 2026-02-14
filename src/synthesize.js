// ============================================================
// PRISM Synthesizer v1.0 — Structured briefing, life context, last 3 briefings, memory
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

export default async function synthesize(analysis, stats, deepDiveReport = null) {
  const today = format(new Date(), 'yyyy-MM-dd');
  console.log(`\n📝 SYNTHESIZING briefing for ${today}...`);

  const lifeContext = await loadLifeContext();
  const lastBriefings = await loadLastBriefings(3);
  const memory = await loadMemory();
  const memoryJson = JSON.stringify(
    {
      topicFrequency: memory.topicFrequency || {},
      toolsMentioned: memory.toolsMentioned || [],
    },
    null,
    2
  );

  const prompt = SYNTHESIS_PROMPT.replace('{date}', format(new Date(), 'MMMM d, yyyy'))
    .replace('{life_context}', lifeContext)
    .replace('{last_briefings}', lastBriefings)
    .replace('{memory_json}', memoryJson);

  const userContent = `${prompt}\n\n${JSON.stringify(analysis, null, 2)}`;

  const response = await client.messages.create({
    model: MODELS.synthesizer,
    max_tokens: LIMITS.synthesisMaxTokens,
    messages: [{ role: 'user', content: userContent }],
  });

  let briefing = response.content[0].text.trim();
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
  const footer = `\n---\n*PRISM v1.0 — ${stats.articlesScored} articles scored, ${stats.articlesAnalyzed} analyzed, ${stats.totalTokens.toLocaleString()} tokens (~$${stats.estimatedCost})*`;
  if (!briefing.includes('*PRISM v1.0')) briefing += footer;

  await mkdir(BRIEFINGS_DIR, { recursive: true });
  const filepath = `${BRIEFINGS_DIR}/${today}.md`;
  await writeFile(filepath, briefing, 'utf-8');
  console.log(`  ✅ Briefing saved to ${filepath}`);

  await updateMemory(analysis, today, memory);

  console.log(`  Tokens: ${response.usage.input_tokens.toLocaleString()} in / ${response.usage.output_tokens.toLocaleString()} out`);

  return { briefing, filepath, tokens: response.usage };
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
    return { lastRun: null, feedHealth: {}, topicFrequency: {}, toolsMentioned: [], lastBriefings: [] };
  }
}

async function updateMemory(analysis, date, memory) {
  memory.lastBriefings = memory.lastBriefings || [];
  memory.lastBriefings.unshift({
    date,
    bigStory: analysis.big_story?.title || '',
    patterns: (analysis.patterns || []).map((p) => (typeof p === 'object' ? p.pattern : p)),
    toolsFlagged: (analysis.tools_and_techniques || []).map((t) => t.name),
    projectConnections: (analysis.project_connections || []).map((p) => p.project),
  });
  memory.lastBriefings = memory.lastBriefings.slice(0, 7);

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

  if (!memory.weeklyDigestDue) {
    const next = new Date(date);
    next.setDate(next.getDate() + 7);
    memory.weeklyDigestDue = next.toISOString().slice(0, 10);
  }

  await mkdir('data', { recursive: true });
  await writeFile(MEMORY_FILE, JSON.stringify(memory, null, 2), 'utf-8');
  console.log(`  ✅ Memory updated (feedHealth, topicFrequency, toolsMentioned)`);
}
