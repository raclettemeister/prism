// ============================================================
// PRISM v3.0 Read — Select top 80 (diversity + score), batch-fetch full text
// Uses cheerio for HTML extraction; 15s timeout per URL.
// ============================================================

import * as cheerio from 'cheerio';

const FETCH_TIMEOUT_MS = 15000;
const MAX_WORDS = 3000;
const TARGET_SELECTION = 80;  // v3.0: more articles for THE BIG CALL's 1M context
const MIN_SCORE_FOR_POOL = 3;
const MIN_SCORE_FIRST_PASS = 4;  // was 5 — more articles, lower threshold
const FETCH_BATCH_SIZE = 10;

/**
 * Select up to 50 articles:
 * - First pass: highest-scoring article from each category with score >= 4.
 * - Second pass: fill remaining with highest score overall, skipping already selected.
 * - If fewer than 50 scored above 3, take whatever scored above 3.
 */
function selectTop(scoredAll) {
  const eligible = scoredAll.filter((a) => a.score > MIN_SCORE_FOR_POOL);
  if (eligible.length === 0) return [];

  const selected = new Map(); // link -> article (to preserve order and dedupe)

  // First pass: best per category with score >= 4
  const byCategory = new Map();
  for (const a of eligible) {
    if (a.score < MIN_SCORE_FIRST_PASS) continue;
    const cat = a.category || 'big_picture';
    if (!byCategory.has(cat) || byCategory.get(cat).score < a.score) {
      byCategory.set(cat, a);
    }
  }
  for (const a of byCategory.values()) {
    selected.set(a.link, a);
  }

  // Second pass: fill up to TARGET_SELECTION by score
  const sorted = [...eligible].sort((a, b) => b.score - a.score);
  for (const a of sorted) {
    if (selected.size >= TARGET_SELECTION) break;
    if (!selected.has(a.link)) selected.set(a.link, a);
  }

  return Array.from(selected.values());
}

/**
 * Extract main content from HTML: try <article>, <main>, then <body>.
 * Strip nav, footer, sidebar, script, style.
 */
function extractText(html) {
  const $ = cheerio.load(html);
  $('nav, footer, aside, [role="navigation"], [role="contentinfo"], .sidebar, .nav, .footer, script, style').remove();
  let root = $('article').first();
  if (root.length === 0) root = $('main').first();
  if (root.length === 0) root = $('body');
  const text = root.length ? root.text() : $.text();
  return text
    .replace(/\s+/g, ' ')
    .trim();
}

function truncateToWords(text, maxWords) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return words.join(' ');
  return words.slice(0, maxWords).join(' ') + ' [truncated]';
}

/**
 * Fetch URL with timeout; return full text or null on failure.
 */
async function fetchFullText(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'PRISM/3.0 (Personal Research Intelligence; +https://github.com/raclettemeister/prism)' },
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

/**
 * Takes scored articles from score.js; selects top 50 (diversity algorithm);
 * fetches full article text in batches of 10; returns articles with fullText / fullTextAvailable.
 * Preserves all article properties including crossFeedCount.
 */
export default async function read(scoredAll) {
  const selected = selectTop(scoredAll);
  if (selected.length === 0) {
    console.log('\n📖 READ: No articles with score > 3. Skipping read step.');
    return [];
  }

  console.log(`\n📖 READING ${selected.length} articles (full text fetch, ${FETCH_TIMEOUT_MS / 1000}s timeout, batches of ${FETCH_BATCH_SIZE})...`);

  let successCount = 0;
  let failCount = 0;
  const withFullText = [];

  // Batch fetching: 10 URLs at a time to avoid rate limits and timeouts
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

  console.log(`  Read ${successCount}/${selected.length} articles successfully (${failCount} failed to fetch)\n`);
  return withFullText;
}
