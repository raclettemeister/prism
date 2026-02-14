// ============================================================
// PRISM Synthesizer — Writes the morning briefing
// ============================================================

import { writeFile, readFile, mkdir } from 'fs/promises';
import { format } from 'date-fns';
import Anthropic from '@anthropic-ai/sdk';
import { MODELS, SYNTHESIS_PROMPT, LIMITS, MEMORY_FILE, BRIEFINGS_DIR } from './config.js';

const client = new Anthropic();

/**
 * Takes the structured analysis and produces a markdown briefing.
 * Saves to briefings/YYYY-MM-DD.md and updates memory.json.
 */
export default async function synthesize(analysis, stats) {
  const today = format(new Date(), 'yyyy-MM-dd');
  console.log(`\n📝 SYNTHESIZING briefing for ${today}...`);

  // Build the synthesis prompt with stats
  const prompt = SYNTHESIS_PROMPT
    .replace('{date}', format(new Date(), 'MMMM d, yyyy'))
    .replace('{articles_scored}', stats.articlesScored)
    .replace('{articles_analyzed}', stats.articlesAnalyzed)
    .replace('{total_tokens}', stats.totalTokens.toLocaleString())
    .replace('{cost}', stats.estimatedCost);

  const response = await client.messages.create({
    model: MODELS.synthesizer,
    max_tokens: LIMITS.synthesisMaxTokens,
    messages: [
      {
        role: 'user',
        content: `${prompt}\n\n===== ANALYSIS DATA =====\n\n${JSON.stringify(analysis, null, 2)}`,
      },
    ],
  });

  const briefing = response.content[0].text.trim();

  // Ensure briefings directory exists
  await mkdir(BRIEFINGS_DIR, { recursive: true });

  // Save briefing
  const filepath = `${BRIEFINGS_DIR}/${today}.md`;
  await writeFile(filepath, briefing, 'utf-8');
  console.log(`  ✅ Briefing saved to ${filepath}`);

  // Update memory
  await updateMemory(analysis, today);

  console.log(`  Tokens: ${response.usage.input_tokens.toLocaleString()} in / ${response.usage.output_tokens.toLocaleString()} out`);

  return {
    briefing,
    filepath,
    tokens: response.usage,
  };
}

/**
 * Update memory.json with today's briefing summary for continuity.
 * Keeps last 7 days of context.
 */
async function updateMemory(analysis, date) {
  let memory;
  try {
    const raw = await readFile(MEMORY_FILE, 'utf-8');
    memory = JSON.parse(raw);
  } catch {
    memory = { lastBriefings: [], trackedPatterns: [], toolsEvaluated: [] };
  }

  // Add today's summary
  memory.lastBriefings.unshift({
    date,
    bigStory: analysis.big_story?.title || '',
    patterns: analysis.patterns || [],
    toolsFlagged: (analysis.tools_and_techniques || []).map((t) => t.name),
    projectConnections: (analysis.project_connections || []).map((p) => p.project),
  });

  // Keep only last 7 days
  memory.lastBriefings = memory.lastBriefings.slice(0, 7);

  // Accumulate patterns (deduplicate)
  const newPatterns = analysis.patterns || [];
  memory.trackedPatterns = [...new Set([...newPatterns, ...(memory.trackedPatterns || [])])].slice(0, 20);

  // Accumulate tools evaluated
  const newTools = (analysis.tools_and_techniques || []).map((t) => t.name);
  memory.toolsEvaluated = [...new Set([...newTools, ...(memory.toolsEvaluated || [])])].slice(0, 50);

  // Save
  await mkdir('data', { recursive: true });
  await writeFile(MEMORY_FILE, JSON.stringify(memory, null, 2), 'utf-8');
  console.log(`  ✅ Memory updated (${memory.lastBriefings.length} days of context)`);
}
