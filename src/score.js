// ============================================================
// PRISM Scorer v1.0 — Category weights, cross-feed bonus, budget pre-filter
// ============================================================

import Anthropic from '@anthropic-ai/sdk';
import { MODELS, SCORING, SCORING_PROMPT, LIMITS, FEED_CATEGORIES } from './config.js';

const client = new Anthropic();

/**
 * Pre-filter: when over threshold, keep only articles matching any keyword (title + content).
 * Rest get score 0 without API call. Then cap at preFilterMax for API scoring.
 */
function preFilter(articles) {
  if (articles.length <= SCORING.preFilterThreshold) return { toScore: articles, skipped: [] };
  const keywords = SCORING.preFilterKeywords.map((k) => k.toLowerCase());
  const combined = (a) => `${(a.title || '')} ${(a.content || '')}`.toLowerCase();
  const matches = articles.filter((a) => keywords.some((kw) => combined(a).includes(kw)));
  const toScore = matches.slice(0, SCORING.preFilterMax);
  const skipped = articles.filter((a) => !toScore.includes(a));
  console.log(`  📉 Budget filter: ${articles.length} → ${toScore.length} sent to Haiku, ${skipped.length} skipped (no keyword match or over cap)`);
  return { toScore, skipped };
}

/**
 * Score articles with Haiku; apply category weight and cross-feed bonus.
 */
export default async function score(articles) {
  const { toScore, skipped } = preFilter(articles);
  const skippedWithZero = (skipped || []).map((a) => ({ ...a, score: 0, reason: 'pre-filtered (budget)', tags: [], actionable: false }));

  console.log(`\n🎯 SCORING ${toScore.length} articles with ${MODELS.scorer}...`);

  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  const scored = [];

  for (let i = 0; i < toScore.length; i += SCORING.batchSize) {
    const batch = toScore.slice(i, i + SCORING.batchSize);
    const batchNum = Math.floor(i / SCORING.batchSize) + 1;
    const totalBatches = Math.ceil(toScore.length / SCORING.batchSize);
    console.log(`  Batch ${batchNum}/${totalBatches} (${batch.length} articles)...`);

    const results = await Promise.allSettled(batch.map((article) => scoreOne(article)));

    for (let j = 0; j < results.length; j++) {
      if (results[j].status === 'fulfilled') {
        const { scored: scoredArticle, usage } = results[j].value;
        const category = scoredArticle.category || 'big_picture';
        const weight = FEED_CATEGORIES[category]?.weight ?? 0.6;
        let finalScore = (scoredArticle.score || 0) * weight;
        if ((scoredArticle.crossFeedCount || 0) >= SCORING.crossFeedBonusThreshold) {
          finalScore += SCORING.crossFeedBonus;
        }
        scored.push({
          ...scoredArticle,
          rawScore: scoredArticle.score,
          score: Math.min(10, Math.round(finalScore * 10) / 10),
        });
        totalInputTokens += usage.input_tokens;
        totalOutputTokens += usage.output_tokens;
      } else {
        console.log(`  ⚠️ Failed to score: ${batch[j].title} — ${results[j].reason?.message}`);
        scored.push({ ...batch[j], score: 0, rawScore: 0, reason: 'scoring failed', tags: [], actionable: false });
      }
    }
  }

  const all = [...scored, ...skippedWithZero].sort((a, b) => b.score - a.score);
  const relevant = all.filter((a) => a.score >= SCORING.minScore);
  const top = relevant.slice(0, SCORING.topN);

  console.log(`\n📊 Scoring complete:`);
  console.log(`   ${all.length} total, ${relevant.length} above threshold (≥${SCORING.minScore})`);
  console.log(`   Top ${top.length} go to deep analysis`);
  console.log(`   Tokens: ${totalInputTokens.toLocaleString()} in / ${totalOutputTokens.toLocaleString()} out`);

  return {
    all,
    top,
    tokens: { input: totalInputTokens, output: totalOutputTokens },
  };
}

async function scoreOne(article) {
  const articleText = `TITLE: ${article.title}
SOURCE: ${article.source}
CATEGORY: ${article.category || 'unknown'}
DATE: ${article.date}
AUTHOR: ${article.author}

CONTENT:
${(article.content || '').substring(0, LIMITS.maxArticleLength)}`;

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
  let parsed;
  try {
    const jsonStr = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    parsed = JSON.parse(jsonStr);
  } catch {
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
      score: parsed.score ?? 0,
      reason: parsed.reason || '',
      tags: parsed.tags || [],
      actionable: parsed.actionable || false,
    },
    usage: response.usage,
  };
}
