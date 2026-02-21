// ============================================================
// PRISM v4.0 Read — Tier-aware article selection + full text fetch
//
// v4.0 changes:
//   - Accepts { tier1, tier2, tier3, all } from classify.js (not flat scored list)
//   - Target: 30 articles (down from 80) — higher quality, faster synthesis
//   - Preserves tier assignment on each article for synthesize.js routing
//   - Diversity algorithm unchanged; tier1 always included first
//
// v3.x: accepted flat scoredAll array from score.js, selected top 80
// ============================================================

import * as cheerio from 'cheerio';

const FETCH_TIMEOUT_MS = 15000;
const MAX_WORDS = 3000;
const FETCH_BATCH_SIZE = 10;

// ── Article Selection ────────────────────────────────────────

/**
 * Select articles to read:
 *   1. All Tier 1 (Expert Trusted) articles — guaranteed inclusion
 *   2. Fill remaining slots with Tier 2 (top by score), then Tier 3 if budget remains
 *
 * @param {{ tier1, tier2, tier3 }} classified - Output from classify.js
 * @param {number} target - Total articles to select (default: from LIMITS.readTargetArticles)
 * @returns {object[]} Selected articles with tier property preserved
 */
function selectArticles(classified, target = 30) {
  const { tier1 = [], tier2 = [], tier3 = [] } = classified;

  const selected = new Map(); // link → article (dedup by URL)

  // Step 1: Tier 1 always included first
  for (const article of tier1) {
    if (article.link) selected.set(article.link, article);
  }

  // Step 2: Fill with Tier 2 by score (already sorted from classify.js)
  for (const article of tier2) {
    if (selected.size >= target) break;
    if (article.link && !selected.has(article.link)) {
      selected.set(article.link, article);
    }
  }

  // Step 3: Fill remaining slots with Tier 3 if budget allows
  for (const article of tier3) {
    if (selected.size >= target) break;
    if (article.link && !selected.has(article.link)) {
      selected.set(article.link, article);
    }
  }

  return Array.from(selected.values());
}

// ── Full Text Extraction ─────────────────────────────────────

/**
 * Extract main content from HTML.
 * Strips nav, footer, sidebar, scripts; tries article > main > body.
 */
function extractText(html) {
  const $ = cheerio.load(html);
  $('nav, footer, aside, [role="navigation"], [role="contentinfo"], .sidebar, .nav, .footer, script, style').remove();
  let root = $('article').first();
  if (root.length === 0) root = $('main').first();
  if (root.length === 0) root = $('body');
  const text = root.length ? root.text() : $.text();
  return text.replace(/\s+/g, ' ').trim();
}

function truncateToWords(text, maxWords) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return words.join(' ');
  return words.slice(0, maxWords).join(' ') + ' [truncated]';
}

/**
 * Fetch URL with timeout. Returns clean text or null on failure.
 */
async function fetchFullText(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'PRISM/4.0 (Personal Research Intelligence; +https://github.com/raclettemeister/prism)',
      },
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const html = await res.text();
    const raw = extractText(html);
    return truncateToWords(raw, MAX_WORDS);
  } catch {
    clearTimeout(timeout);
    return null;
  }
}

// ── Main Export ──────────────────────────────────────────────

/**
 * Select top articles from classified tiers and fetch their full text.
 *
 * Accepts either:
 *   - v4.0: classified object { tier1, tier2, tier3 } from classify.js
 *   - v3.x: flat scored array from score.js (backward compatible)
 *
 * Returns articles with fullText / fullTextAvailable added,
 * tier property preserved for synthesize.js routing.
 *
 * @param {object[]|{tier1, tier2, tier3}} input - Articles from classify.js or score.js
 * @param {number} [target=30] - Target article count
 * @returns {Promise<object[]>} Articles with full text
 */
export default async function read(input, target = 30) {
  // v3.x backward compat: if passed a flat array, wrap it
  const classified = Array.isArray(input)
    ? { tier1: [], tier2: input.filter(a => a.score >= 4), tier3: input.filter(a => a.score < 4) }
    : input;

  const selected = selectArticles(classified, target);

  if (selected.length === 0) {
    console.log('\n📖 READ: No articles to read. Skipping.');
    return [];
  }

  const tier1Count = selected.filter(a => a.tier === 1).length;
  const tier2Count = selected.filter(a => a.tier === 2).length;
  const tier3Count = selected.filter(a => a.tier === 3).length;

  console.log(`\n📖 READ — ${selected.length} articles (T1:${tier1Count} T2:${tier2Count} T3:${tier3Count}) — fetching full text...`);

  let successCount = 0;
  let failCount = 0;
  const withFullText = [];

  // Fetch in batches of 10 to avoid hammering servers
  for (let i = 0; i < selected.length; i += FETCH_BATCH_SIZE) {
    const batch = selected.slice(i, i + FETCH_BATCH_SIZE);
    const batchNum = Math.floor(i / FETCH_BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(selected.length / FETCH_BATCH_SIZE);
    console.log(`  Batch ${batchNum}/${totalBatches} (${batch.length} articles)...`);

    const batchResults = await Promise.all(
      batch.map(async (article) => {
        if (!article.link) {
          failCount++;
          return { ...article, fullText: null, fullTextAvailable: false };
        }
        const fullText = await fetchFullText(article.link);
        if (fullText) {
          successCount++;
          return { ...article, fullText, fullTextAvailable: true };
        }
        failCount++;
        return { ...article, fullText: null, fullTextAvailable: false };
      })
    );
    withFullText.push(...batchResults);
  }

  console.log(`  Read ${successCount}/${selected.length} successfully (${failCount} failed, using RSS snippet as fallback)\n`);
  return withFullText;
}
