// ============================================================
// PRISM Scorer — Rates article relevance using Claude Haiku
// ============================================================

import Anthropic from '@anthropic-ai/sdk';
import { MODELS, SCORING, SCORING_PROMPT, LIMITS } from './config.js';

const client = new Anthropic();

/**
 * Score an array of articles for relevance using Claude Haiku.
 * Processes in parallel batches to maximize throughput.
 * Returns articles sorted by score (highest first), with score metadata attached.
 */
export default async function score(articles) {
  console.log(`\n🎯 SCORING ${articles.length} articles with ${MODELS.scorer}...`);

  let totalInputTokens = 0;
  let totalOutputTokens = 0;

  // Process in batches
  const scored = [];
  for (let i = 0; i < articles.length; i += SCORING.batchSize) {
    const batch = articles.slice(i, i + SCORING.batchSize);
    const batchNum = Math.floor(i / SCORING.batchSize) + 1;
    const totalBatches = Math.ceil(articles.length / SCORING.batchSize);
    console.log(`  Batch ${batchNum}/${totalBatches} (${batch.length} articles)...`);

    const results = await Promise.allSettled(
      batch.map((article) => scoreOne(article))
    );

    for (let j = 0; j < results.length; j++) {
      if (results[j].status === 'fulfilled') {
        const { scored: scoredArticle, usage } = results[j].value;
        scored.push(scoredArticle);
        totalInputTokens += usage.input_tokens;
        totalOutputTokens += usage.output_tokens;
      } else {
        console.log(`  ⚠️ Failed to score: ${batch[j].title} — ${results[j].reason?.message}`);
        // Include with score 0 so we don't lose it entirely
        scored.push({ ...batch[j], score: 0, reason: 'scoring failed', tags: [], actionable: false });
      }
    }
  }

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  // Filter by minimum score
  const relevant = scored.filter((a) => a.score >= SCORING.minScore);

  console.log(`\n📊 Scoring complete:`);
  console.log(`   ${scored.length} scored, ${relevant.length} above threshold (≥${SCORING.minScore})`);
  console.log(`   Top ${Math.min(SCORING.topN, relevant.length)} go to deep analysis`);
  console.log(`   Tokens: ${totalInputTokens.toLocaleString()} in / ${totalOutputTokens.toLocaleString()} out`);

  return {
    all: scored,
    top: relevant.slice(0, SCORING.topN),
    tokens: { input: totalInputTokens, output: totalOutputTokens },
  };
}

/**
 * Score a single article with Claude Haiku.
 */
async function scoreOne(article) {
  const articleText = `TITLE: ${article.title}
SOURCE: ${article.source}
DATE: ${article.date}
AUTHOR: ${article.author}

CONTENT:
${article.content.substring(0, LIMITS.maxArticleLength)}`;

  const response = await client.messages.create({
    model: MODELS.scorer,
    max_tokens: 256,
    messages: [
      {
        role: 'user',
        content: `${SCORING_PROMPT}\n\n---\n\nARTICLE TO SCORE:\n\n${articleText}`,
      },
    ],
  });

  const text = response.content[0].text.trim();

  // Parse JSON response
  let parsed;
  try {
    // Handle potential markdown wrapping
    const jsonStr = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    parsed = JSON.parse(jsonStr);
  } catch {
    // If JSON parsing fails, try to extract score from text
    const scoreMatch = text.match(/\"score\"\s*:\s*(\d+)/);
    parsed = {
      score: scoreMatch ? parseInt(scoreMatch[1]) : 0,
      reason: 'JSON parse failed: ' + text.substring(0, 100),
      tags: [],
      actionable: false,
    };
  }

  return {
    scored: {
      ...article,
      score: parsed.score || 0,
      reason: parsed.reason || '',
      tags: parsed.tags || [],
      actionable: parsed.actionable || false,
    },
    usage: response.usage,
  };
}
