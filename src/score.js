// ============================================================
// PRISM v3.2 Scorer — Batch Sonnet scoring (one call for all articles)
// + heuristic pre-filter + category weights + cross-feed bonus
// FIX: use array position fallback when index field missing from scores
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
  console.log(`  Pre-filter: ${articles.length} -> ${toScore.length} to score, ${skipped.length} skipped`);
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
 * Robustly extract a JSON array from a model response.
 * Handles: code fences, preamble text, postamble text.
 * Returns the parsed array or null if extraction fails.
 */
function extractJsonArray(text) {
  // Try 1: strip markdown code fences and parse directly
  const stripped = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  try {
    const parsed = JSON.parse(stripped);
    if (Array.isArray(parsed)) return parsed;
  } catch { /* fall through */ }

  // Try 2: find the first [...] block in the response (handles preamble/postamble)
  const match = text.match(/\[[\s\S]*\]/);
  if (match) {
    try {
      const parsed = JSON.parse(match[0]);
      if (Array.isArray(parsed)) return parsed;
    } catch { /* fall through */ }
  }

  return null;
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

  // Parse JSON array of scores — robust extraction handles preamble/postamble text
  let scores = extractJsonArray(text);
  if (!scores) {
    console.log('  Batch score parse failed, falling back to regex extraction');
    scores = [];
    const indexMatches = text.matchAll(/"index"\s*:\s*(\d+)\s*,\s*"score"\s*:\s*(\d+)/g);
    for (const m of indexMatches) {
      scores.push({ index: parseInt(m[1]), score: parseInt(m[2]), reason: '', tags: [] });
    }
    if (scores.length === 0) {
      const scoreMatches = [...text.matchAll(/"score"\s*:\s*(\d+)/g)];
      for (let idx = 0; idx < scoreMatches.length; idx++) {
        scores.push({ index: idx, score: parseInt(scoreMatches[idx][1]), reason: '', tags: [] });
      }
      if (scores.length > 0) {
        console.log(`  Extracted ${scores.length} scores via regex (no index field)`);
      }
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
    // Try index-based map first, then fall back to array position
    const s = scoreMap.get(i) || scores[i];
    const rawScore = s?.score ?? 3;
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

  console.log(`\n SCORING ${toScore.length} articles with ${MODELS.scorer} (batch mode)...`);

  const newsInterests = await loadNewsInterests();

  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let allScored = [];

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
      console.log(`  Batch scoring failed: ${err.message}`);
      allScored.push(...batch.map(a => ({
        ...a, score: 5, rawScore: 5, reason: 'scoring failed -- default', tags: [],
      })));
    }
  }

  const all = [...allScored, ...skippedWithZero].sort((a, b) => b.score - a.score);
  const relevant = all.filter((a) => a.score >= SCORING.minScore);
  const top = relevant.slice(0, SCORING.topN);

  console.log(`\n Scoring complete:`);
  console.log(`   ${all.length} total, ${relevant.length} above threshold (>=${SCORING.minScore})`);
  console.log(`   Top ${top.length} go to analysis`);
  console.log(`   Tokens: ${totalInputTokens.toLocaleString()} in / ${totalOutputTokens.toLocaleString()} out`);

  return {
    all,
    top,
    tokens: { input: totalInputTokens, output: totalOutputTokens },
  };
}
