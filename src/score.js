// ============================================================
// PRISM v3.0 Scorer — Batch Sonnet scoring (one call for all articles)
// + heuristic pre-filter + category weights + cross-feed bonus
// ============================================================

import { readFile } from 'fs/promises';
import Anthropic from '@anthropic-ai/sdk';
import { MODELS, SCORING, SCORING_PROMPT, LIMITS, FEED_CATEGORIES, NEWS_INTERESTS_FILE } from './config.js';

const client = new Anthropic();

/**
 * Pre-filter: when over threshold, keep only articles matching any keyword.
 */
function preFilter(articles) {
  if (articles.length <= SCORING.preFilterThreshold) return { toScore: articles, skipped: [] };
  const keywords = SCORING.preFilterKeywords.map((k) => k.toLowerCase());
  const combined = (a) => `${(a.title || '')} ${(a.content || '')}`.toLowerCase();
  const matches = articles.filter((a) => keywords.some((kw) => combined(a).includes(kw)));
  const toScore = matches.slice(0, SCORING.preFilterMax);
  const skipped = articles.filter((a) => !toScore.includes(a));
  console.log(`  📉 Pre-filter: ${articles.length} → ${toScore.length} to score, ${skipped.length} skipped`);
  return { toScore, skipped };
}

/**
 * Load news interests for the scoring prompt.
 */
async function loadNewsInterests() {
  try {
    return await readFile(NEWS_INTERESTS_FILE, 'utf-8');
  } catch {
    return 'Default interests: AI tools, European tech, geopolitics, indie founders.';
  }
}

/**
 * Score all articles in ONE Sonnet call. Sonnet sees the full list
 * and can compare articles, detect redundancy, and apply relative scoring.
 */
async function batchScore(articles, newsInterests) {
  // Build compact article list
  const articleList = articles.map((a, i) =>
    `[${i}] ${a.title} | ${a.source} | ${a.category || 'unknown'} | ${a.date} | ${(a.content || '').substring(0, 300)}`
  ).join('\n');

  const userContent = `${SCORING_PROMPT}\n\n===== NEWS INTEREST PROFILE =====\n${newsInterests}\n\n===== ARTICLES (${articles.length}) =====\n${articleList}`;

  const response = await client.messages.create({
    model: MODELS.scorer,
    max_tokens: 8192,
    messages: [{ role: 'user', content: userContent }],
  });

  const text = response.content[0].text.trim();

  // Parse JSON array of scores
  let scores;
  try {
    const jsonStr = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    scores = JSON.parse(jsonStr);
  } catch {
    console.log('  ⚠️ Batch score parse failed, falling back to regex extraction');
    // Try to extract individual score objects
    scores = [];
    const matches = text.matchAll(/"index"\s*:\s*(\d+)\s*,\s*"score"\s*:\s*(\d+)/g);
    for (const m of matches) {
      scores.push({ index: parseInt(m[1]), score: parseInt(m[2]), reason: '', tags: [] });
    }
  }

  // Map scores back to articles
  const scoreMap = new Map();
  for (const s of scores) {
    if (typeof s.index === 'number') {
      scoreMap.set(s.index, s);
    }
  }

  const scored = articles.map((article, i) => {
    const s = scoreMap.get(i);
    const rawScore = s?.score ?? 3; // default to 3 if not scored
    const category = article.category || 'big_picture';
    const weight = FEED_CATEGORIES[category]?.weight ?? 0.6;
    let finalScore = rawScore * weight;
    if ((article.crossFeedCount || 0) >= SCORING.crossFeedBonusThreshold) {
      finalScore += SCORING.crossFeedBonus;
    }
    return {
      ...article,
      rawScore,
      score: Math.min(10, Math.round(finalScore * 10) / 10),
      reason: s?.reason || '',
      tags: s?.tags || [],
    };
  });

  return {
    scored,
    tokens: { input: response.usage.input_tokens, output: response.usage.output_tokens },
  };
}

/**
 * Main scoring function. Pre-filters, then batch-scores with Sonnet.
 */
export default async function score(articles) {
  const { toScore, skipped } = preFilter(articles);
  const skippedWithZero = (skipped || []).map((a) => ({
    ...a, score: 0, rawScore: 0, reason: 'pre-filtered', tags: [],
  }));

  console.log(`\n🎯 SCORING ${toScore.length} articles with ${MODELS.scorer} (batch mode)...`);

  const newsInterests = await loadNewsInterests();

  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let allScored = [];

  // If more than 100 articles, split into batches of ~100
  // (Sonnet can handle more, but JSON output gets unwieldy)
  const BATCH_SIZE = 100;
  for (let i = 0; i < toScore.length; i += BATCH_SIZE) {
    const batch = toScore.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    console.log(`  Scoring batch ${batchNum} (${batch.length} articles)...`);

    try {
      const { scored, tokens } = await batchScore(batch, newsInterests);
      allScored.push(...scored);
      totalInputTokens += tokens.input;
      totalOutputTokens += tokens.output;
    } catch (err) {
      console.log(`  ⚠️ Batch scoring failed: ${err.message}`);
      // Fallback: give everything a default score of 5
      allScored.push(...batch.map(a => ({
        ...a, score: 5, rawScore: 5, reason: 'scoring failed — default', tags: [],
      })));
    }
  }

  const all = [...allScored, ...skippedWithZero].sort((a, b) => b.score - a.score);
  const relevant = all.filter((a) => a.score >= SCORING.minScore);
  const top = relevant.slice(0, SCORING.topN);

  console.log(`\n📊 Scoring complete:`);
  console.log(`   ${all.length} total, ${relevant.length} above threshold (≥${SCORING.minScore})`);
  console.log(`   Top ${top.length} go to analysis`);
  console.log(`   Tokens: ${totalInputTokens.toLocaleString()} in / ${totalOutputTokens.toLocaleString()} out`);

  return {
    all,
    top,
    tokens: { input: totalInputTokens, output: totalOutputTokens },
  };
}
