// ============================================================
// PRISM Analyzer — Deep analysis with Claude Sonnet
// ============================================================

import { readFile } from 'fs/promises';
import Anthropic from '@anthropic-ai/sdk';
import { MODELS, ANALYSIS_PROMPT, LIMITS, MEMORY_FILE } from './config.js';

const client = new Anthropic();

/**
 * Deep-analyze the top scored articles using Claude Sonnet.
 * Cross-references articles, detects patterns, connects to Julien's projects.
 * Uses memory from previous briefings for continuity.
 */
export default async function analyze(topArticles) {
  console.log(`\n🧠 ANALYZING ${topArticles.length} articles with ${MODELS.analyzer}...`);

  // Load memory for continuity
  const memory = await loadMemory();

  // Build the articles block
  const articlesBlock = topArticles
    .map((a, i) => {
      return `--- ARTICLE ${i + 1} (Score: ${a.score}/10) ---
TITLE: ${a.title}
SOURCE: ${a.source}
DATE: ${a.date}
TAGS: ${a.tags.join(', ')}
SCORING REASON: ${a.reason}
URL: ${a.link}

CONTENT:
${a.content}
`;
    })
    .join('\n');

  // Build the memory context
  const memoryContext = memory.lastBriefings?.length
    ? memory.lastBriefings
        .map((b) => `[${b.date}] Big story: ${b.bigStory} | Patterns: ${b.patterns?.join(', ') || 'none'}`)
        .join('\n')
    : 'No previous briefings yet. This is the first run.';

  // Replace memory placeholder in prompt
  const prompt = ANALYSIS_PROMPT.replace('{memory}', memoryContext);

  const response = await client.messages.create({
    model: MODELS.analyzer,
    max_tokens: LIMITS.analysisMaxTokens,
    messages: [
      {
        role: 'user',
        content: `${prompt}\n\n===== TODAY'S TOP ARTICLES =====\n\n${articlesBlock}`,
      },
    ],
  });

  const text = response.content[0].text.trim();

  // Parse the JSON response
  let analysis;
  try {
    const jsonStr = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    analysis = JSON.parse(jsonStr);
  } catch {
    console.log('  ⚠️ Failed to parse analysis JSON, using raw text');
    analysis = {
      big_story: {
        title: 'Analysis Parse Error',
        what: text.substring(0, 500),
        why_it_matters: 'The analysis was generated but could not be parsed as JSON.',
        action: 'Check the raw output in the logs.',
      },
      worth_knowing: [],
      tools_and_techniques: [],
      patterns: [],
      project_connections: [],
    };
  }

  console.log(`  ✅ Analysis complete`);
  console.log(`   Big story: ${analysis.big_story?.title || 'unknown'}`);
  console.log(`   Worth knowing: ${analysis.worth_knowing?.length || 0} items`);
  console.log(`   Tools flagged: ${analysis.tools_and_techniques?.length || 0}`);
  console.log(`   Patterns: ${analysis.patterns?.length || 0}`);
  console.log(`   Project connections: ${analysis.project_connections?.length || 0}`);
  console.log(`   Tokens: ${response.usage.input_tokens.toLocaleString()} in / ${response.usage.output_tokens.toLocaleString()} out`);

  return {
    analysis,
    tokens: response.usage,
  };
}

/**
 * Load memory from previous runs.
 */
async function loadMemory() {
  try {
    const raw = await readFile(MEMORY_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    // No memory yet — first run
    return { lastBriefings: [], trackedPatterns: [], toolsEvaluated: [] };
  }
}
