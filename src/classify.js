// ============================================================
// PRISM v4.0 Classify — Trust Tier Classification
// Replaces: score.js (blind batch scoring of all articles)
//
// Architecture:
//   Tier 1 (Expert Trusted):   always read, no scoring — guaranteed inclusion
//   Tier 2 (Amplified Signal): cross-fed (3+) or HN Best — selectively scored
//   Tier 3 (Long Tail):        everything else — scored only if budget allows
//
// The key insight: Julien already knows who he trusts. The 12 expert sources
// in TRUST_TIERS.tier1 bypass the algorithm entirely. No more Dan Shipper
// being scored 3.2 because the article title was abstract.
// ============================================================

import { readFile } from 'fs/promises';
import Anthropic from '@anthropic-ai/sdk';
import {
  MODELS,
  TRUST_TIERS,
  SCORING,
  CLASSIFY_PROMPT,
  LIMITS,
  FEED_CATEGORIES,
  NEWS_INTERESTS_FILE,
  MEMORY_FILE,
} from './config.js';

const client = new Anthropic();

// ── Tier Assignment Helpers ──────────────────────────────────

/**
 * Check if an article's feed URL or source matches any Tier 1 pattern.
 * Tier 1 = expert trusted sources — always read, no scoring.
 */
function isTier1Source(article) {
  const feedUrl = (article.feedUrl || '').toLowerCase();
  const source = (article.source || '').toLowerCase();
  const link = (article.link || '').toLowerCase();

  return TRUST_TIERS.tier1.patterns.some(pattern => {
    const p = pattern.toLowerCase();
    return feedUrl.includes(p) || source.includes(p) || link.includes(p);
  });
}

/**
 * Check if an article qualifies for Tier 2 amplification signal.
 * Tier 2 = human-endorsed via cross-feed consensus or HN Best.
 */
function isTier2Amplified(article) {
  // Cross-feed signal: 3+ independent feeds picked up this story
  if ((article.crossFeedCount || 1) >= TRUST_TIERS.tier2.crossFeedThreshold) return true;
  // From an HN Best feed: these already filter for top-performing HN discussions
  const feedUrl = (article.feedUrl || '').toLowerCase();
  if (feedUrl.includes(TRUST_TIERS.tier2.hnBestFeedPattern)) return true;
  return false;
}

// ── Data Loaders ─────────────────────────────────────────────

async function loadMemory() {
  try {
    const raw = await readFile(MEMORY_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function loadNewsInterests() {
  try {
    return await readFile(NEWS_INTERESTS_FILE, 'utf-8');
  } catch {
    return 'Default: AI tools, micro-SaaS, European tech, geopolitics, indie founders.';
  }
}

// ── JSON Extraction ──────────────────────────────────────────

/**
 * Robustly extract a JSON array from model response.
 * Handles: code fences, preamble text, postamble text.
 */
function extractJsonArray(text) {
  const stripped = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  try {
    const parsed = JSON.parse(stripped);
    if (Array.isArray(parsed)) return parsed;
  } catch { /* fall through */ }

  const match = text.match(/\[[\s\S]*\]/);
  if (match) {
    try {
      const parsed = JSON.parse(match[0]);
      if (Array.isArray(parsed)) return parsed;
    } catch { /* fall through */ }
  }
  return null;
}

// ── Batch Scoring ────────────────────────────────────────────

/**
 * Score a batch of articles using CLASSIFY_PROMPT (builder-weighted).
 * Used for Tier 2 and optionally Tier 3 articles — not Tier 1.
 */
async function batchScore(articles, newsInterests) {
  const articleList = articles.map((a, i) =>
    `[${i}] ${a.title} | ${a.source} | ${a.category || 'unknown'} | crossFeed:${a.crossFeedCount || 1} | ${(a.content || '').substring(0, 300)}`
  ).join('\n');

  const userContent = `${CLASSIFY_PROMPT}\n\n===== NEWS INTEREST PROFILE =====\n${newsInterests}\n\n===== ARTICLES (${articles.length}) =====\n${articleList}`;

  const response = await client.messages.create({
    model: MODELS.scorer,
    max_tokens: 8192,
    messages: [{ role: 'user', content: userContent }],
  });

  const text = response.content[0].text.trim();
  let scores = extractJsonArray(text);

  if (!scores) {
    console.log('  Classify score parse failed — using position-based fallback');
    const scoreMatches = [...text.matchAll(/"score"\s*:\s*(\d+)/g)];
    scores = scoreMatches.map((m, idx) => ({
      index: idx, score: parseInt(m[1]), reason: '', tags: [],
    }));
  }

  const scoreMap = new Map();
  for (const s of scores) {
    if (typeof s.index === 'number') scoreMap.set(s.index, s);
  }

  const scored = articles.map((article, i) => {
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
      actionable: s?.actionable ?? false,
    };
  });

  return {
    scored,
    tokens: { input: response.usage.input_tokens, output: response.usage.output_tokens },
  };
}

// ── Main Export ──────────────────────────────────────────────

/**
 * Classify all articles into Trust Tiers.
 *
 * Returns:
 *   tier1  — Expert Trusted articles (always read, pre-scored 9.0)
 *   tier2  — Amplified Signal articles (scored, top N kept)
 *   tier3  — Long Tail articles (scored only if budget allows)
 *   all    — Combined array (tier1 + tier2 + tier3) for read.js
 *   tokens — API usage for cost tracking
 *
 * @param {object[]} articles - Raw articles from collect.js
 * @returns {Promise<{tier1, tier2, tier3, all, tokens}>}
 */
export default async function classify(articles) {
  console.log(`\n🏷️  CLASSIFY — ${articles.length} articles into Trust Tiers...`);

  // Load memory for dynamic tier adjustments (learned source preferences)
  const memory = await loadMemory();
  const sourceRatings = memory.sourceRatings || {};

  // ── Tier Assignment ─────────────────────────────────────────
  const tier1Raw = [];
  const tier2Raw = [];
  const tier3Raw = [];

  for (const article of articles) {
    let assignedTier = null;

    // Dynamic tier override: learned from cumulative feedback ratings
    // A source consistently loved by Julien (avgScore >= 4.0, 10+ data points) → Tier 1
    // A source consistently skipped (avgScore < 2.5, 8+ data points) → Tier 3
    const ratingKey = article.source || '';
    const rating = sourceRatings[ratingKey];
    if (rating?.total >= 10 && rating.avgScore >= 4.0) {
      assignedTier = 1; // Learned: consistently high-quality
    } else if (rating?.total >= 8 && rating.avgScore < 2.5) {
      assignedTier = 3; // Learned: consistently low-quality
    }

    // Static tier assignment (if no learned override)
    if (!assignedTier) {
      if (isTier1Source(article)) {
        assignedTier = 1;
      } else if (isTier2Amplified(article)) {
        assignedTier = 2;
      } else {
        assignedTier = 3;
      }
    }

    if (assignedTier === 1) tier1Raw.push({ ...article, tier: 1 });
    else if (assignedTier === 2) tier2Raw.push({ ...article, tier: 2 });
    else tier3Raw.push({ ...article, tier: 3 });
  }

  // ── Tier 1: Always read, no scoring ─────────────────────────
  // Cap at maxPerSource to prevent one active source flooding the briefing.
  // Sort by recency first so we get the freshest articles per source.
  const tier1BySource = new Map();
  const tier1 = [];

  const tier1Sorted = [...tier1Raw].sort((a, b) =>
    new Date(b.date || 0) - new Date(a.date || 0)
  );

  for (const article of tier1Sorted) {
    const sourceKey = article.source || article.feedUrl || 'unknown';
    const count = tier1BySource.get(sourceKey) || 0;
    if (count < LIMITS.tier1MaxPerSource) {
      tier1BySource.set(sourceKey, count + 1);
      tier1.push({
        ...article,
        score: 9.0,
        rawScore: 9,
        reason: 'Tier 1: expert trusted source — always read',
        tags: ['tier1', 'expert'],
      });
    }
  }

  console.log(`  Tier 1 (Expert Trusted): ${tier1Raw.length} raw → ${tier1.length} selected (max ${LIMITS.tier1MaxPerSource}/source)`);
  if (tier1.length > 0) {
    const sourceList = [...tier1BySource.entries()]
      .filter(([, count]) => count > 0)
      .map(([source, count]) => `${source}(${count})`)
      .join(', ');
    console.log(`    Sources: ${sourceList}`);
  }

  // ── Tier 2: Score amplified signal articles ──────────────────
  let tier2 = [];
  let totalInputTokens = 0;
  let totalOutputTokens = 0;

  if (tier2Raw.length > 0) {
    console.log(`  Tier 2 (Amplified Signal): ${tier2Raw.length} articles to score...`);
    const newsInterests = await loadNewsInterests();

    try {
      const { scored, tokens } = await batchScore(tier2Raw, newsInterests);
      totalInputTokens += tokens.input;
      totalOutputTokens += tokens.output;

      tier2 = scored
        .sort((a, b) => b.score - a.score)
        .slice(0, LIMITS.tier2MaxArticles);

      console.log(`  Tier 2 scored: top ${tier2.length} of ${scored.length} kept (threshold: no minimum, just top ${LIMITS.tier2MaxArticles})`);
    } catch (err) {
      console.log(`  Tier 2 scoring failed: ${err.message}`);
      console.log(`  Fallback: ranking by crossFeedCount`);
      tier2 = tier2Raw
        .sort((a, b) => (b.crossFeedCount || 1) - (a.crossFeedCount || 1))
        .slice(0, LIMITS.tier2MaxArticles)
        .map(a => ({ ...a, score: 5, rawScore: 5, reason: 'fallback: scoring unavailable', tags: [] }));
    }
  } else {
    console.log(`  Tier 2 (Amplified Signal): 0 articles`);
  }

  // ── Tier 3: Score only if read budget allows ─────────────────
  const tier3 = [];
  const currentTotal = tier1.length + tier2.length;
  const tier3Budget = Math.max(0, LIMITS.readTargetArticles - currentTotal);

  if (tier3Budget > 0 && tier3Raw.length > 0) {
    console.log(`  Tier 3 (Long Tail): budget=${tier3Budget} slots remaining, scoring up to 100 candidates...`);

    // Pre-filter Tier 3 candidates by keyword before expensive scoring
    const keywords = SCORING.preFilterKeywords.map(k => k.toLowerCase());
    const combined = (a) => `${(a.title || '')} ${(a.content || '')}`.toLowerCase();
    const tier3Candidates = tier3Raw
      .filter(a => keywords.some(kw => combined(a).includes(kw)))
      .slice(0, 100);

    if (tier3Candidates.length > 0) {
      const newsInterests = await loadNewsInterests();
      try {
        const { scored, tokens } = await batchScore(tier3Candidates, newsInterests);
        totalInputTokens += tokens.input;
        totalOutputTokens += tokens.output;

        const highScorers = scored
          .filter(a => a.score >= TRUST_TIERS.tier3.minScore)
          .sort((a, b) => b.score - a.score)
          .slice(0, Math.min(tier3Budget, LIMITS.tier3MaxArticles));

        tier3.push(...highScorers);
        console.log(`  Tier 3 scored: ${highScorers.length} high-scorers (score >= ${TRUST_TIERS.tier3.minScore})`);
      } catch (err) {
        console.log(`  Tier 3 scoring skipped: ${err.message}`);
      }
    } else {
      console.log(`  Tier 3: 0 candidates passed keyword pre-filter`);
    }
  } else if (tier3Budget <= 0) {
    console.log(`  Tier 3: skipped — already at target (${currentTotal}/${LIMITS.readTargetArticles} articles)`);
  } else {
    console.log(`  Tier 3: no articles available`);
  }

  // ── Summary ──────────────────────────────────────────────────
  const total = tier1.length + tier2.length + tier3.length;

  console.log(`\n  ✅ Classification complete: ${total} articles`);
  console.log(`     Tier 1 (Expert): ${tier1.length} — guaranteed in briefing`);
  console.log(`     Tier 2 (Signal): ${tier2.length} — human-amplified`);
  console.log(`     Tier 3 (LongTail): ${tier3.length} — high-score only`);
  if (totalInputTokens > 0) {
    console.log(`     Tokens: ${totalInputTokens.toLocaleString()} in / ${totalOutputTokens.toLocaleString()} out`);
  }

  return {
    tier1,
    tier2,
    tier3,
    all: [...tier1, ...tier2, ...tier3],
    tokens: { input: totalInputTokens, output: totalOutputTokens },
  };
}
