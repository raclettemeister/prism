// ============================================================
// PRISM Collector v1.1 — Categorized feeds, post-collect dedup, 10s timeout
// Dedupe by URL first, then by title similarity (80%+ words → keep higher-weighted category).
// ============================================================

import Parser from 'rss-parser';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { FEED_CATEGORIES, LIMITS, MEMORY_FILE } from './config.js';

const parser = new Parser({
  timeout: 10000, // 10s per feed — one slow feed doesn't block the pipeline
  headers: { 'User-Agent': 'PRISM/1.1 (Personal Research Intelligence System)' },
});

/**
 * Normalize title: lowercase, collapse whitespace, strip punctuation.
 */
function normalizeTitle(title) {
  return (title || '')
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Word set for title similarity (80%+ overlap = same story).
 */
function wordSet(title) {
  const words = normalizeTitle(title).split(/\s+/).filter(Boolean);
  return new Set(words);
}

function titleSimilarity(title1, title2) {
  const w1 = wordSet(title1);
  const w2 = wordSet(title2);
  if (w1.size === 0 && w2.size === 0) return 1;
  if (w1.size === 0 || w2.size === 0) return 0;
  const inter = [...w1].filter((w) => w2.has(w)).length;
  return inter / Math.min(w1.size, w2.size);
}

function getHostname(urlStr) {
  try {
    return new URL(urlStr).hostname.replace(/^www\./, '');
  } catch {
    return urlStr;
  }
}

function getAllFeeds() {
  const list = [];
  for (const [category, config] of Object.entries(FEED_CATEGORIES)) {
    for (const feedUrl of config.feeds || []) {
      list.push({ url: feedUrl, category, weight: config.weight });
    }
  }
  return list;
}

function cleanContent(raw) {
  let text = raw
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (text.length > LIMITS.maxArticleLength) {
    text = text.substring(0, LIMITS.maxArticleLength) + '... [truncated]';
  }
  return text;
}

/**
 * 1. Fetch all feeds (never crash on single feed failure).
 * 2. Dedupe by URL — merge feedUrlsCarried.
 * 3. Dedupe by title similarity (80%+ words) — keep article from higher-weighted category.
 */
export default async function collect() {
  const feeds = getAllFeeds();
  const totalFeeds = feeds.length;
  console.log(`\n📡 COLLECTING from ${totalFeeds} feeds (${Object.keys(FEED_CATEGORIES).length} categories)...`);

  const cutoff = new Date(Date.now() - LIMITS.maxArticleAge * 60 * 60 * 1000);
  const feedResults = {}; // feedUrl -> { success, count, error? }
  const allItems = []; // { title, link, content, source, category, weight, date, author, feedUrl } — no dedup yet

  for (const { url: feedUrl, category, weight } of feeds) {
    try {
      const parsed = await parser.parseURL(feedUrl);
      const items = (parsed.items || [])
        .filter((item) => {
          if (item.pubDate || item.isoDate) {
            const date = new Date(item.pubDate || item.isoDate);
            return date >= cutoff;
          }
          return true;
        })
        .map((item) => ({
          title: item.title?.trim() || 'Untitled',
          link: item.link || '',
          content: cleanContent(item.contentSnippet || item.content || item.summary || ''),
          source: getHostname(feedUrl),
          category,
          weight,
          date: item.pubDate || item.isoDate || new Date().toISOString(),
          author: item.creator || item.author || '',
          feedUrl,
        }));

      feedResults[feedUrl] = { success: true, count: items.length };
      console.log(`  ✅ [${category}] ${getHostname(feedUrl)}: ${items.length} articles`);

      for (const art of items) allItems.push({ ...art, feedUrlsCarried: [feedUrl] });
    } catch (err) {
      feedResults[feedUrl] = { success: false, count: 0, error: err.message };
      console.warn(`  ⚠️ [${category}] ${feedUrl}: ${err.message}`);
    }
  }

  const successCount = Object.values(feedResults).filter((r) => r.success).length;
  const failCount = totalFeeds - successCount;

  // Deduplication 1: by URL (keep one per URL, merge feedUrlsCarried; keep higher weight for category)
  const byUrl = new Map();
  for (const item of allItems) {
    if (!item.link) continue;
    const existing = byUrl.get(item.link);
    if (!existing) {
      byUrl.set(item.link, { ...item });
      continue;
    }
    const merged = [...new Set([...(existing.feedUrlsCarried || []), ...(item.feedUrlsCarried || [])])];
    const keep = item.weight > existing.weight ? item : existing;
    byUrl.set(item.link, { ...keep, feedUrlsCarried: merged });
  }

  let afterUrlDedup = Array.from(byUrl.values());

  // Deduplication 2: by title similarity (80%+ words) — keep higher-weighted, merge feedUrlsCarried
  const TITLE_SIMILARITY_THRESHOLD = 0.8;
  const used = new Set();
  const afterTitleDedup = [];

  for (let i = 0; i < afterUrlDedup.length; i++) {
    if (used.has(i)) continue;
    let canonical = { ...afterUrlDedup[i], feedUrlsCarried: [...(afterUrlDedup[i].feedUrlsCarried || [])] };
    for (let j = i + 1; j < afterUrlDedup.length; j++) {
      if (used.has(j)) continue;
      if (titleSimilarity(canonical.title, afterUrlDedup[j].title) >= TITLE_SIMILARITY_THRESHOLD) {
        const mergedFeedUrls = [...new Set([...canonical.feedUrlsCarried, ...(afterUrlDedup[j].feedUrlsCarried || [])])];
        if (afterUrlDedup[j].weight > canonical.weight) {
          canonical = { ...afterUrlDedup[j], feedUrlsCarried: mergedFeedUrls };
        } else {
          canonical = { ...canonical, feedUrlsCarried: mergedFeedUrls };
        }
        used.add(j);
      }
    }
    afterTitleDedup.push(canonical);
  }

  const articles = afterTitleDedup
    .map(({ feedUrlsCarried, ...a }) => ({ ...a, feedUrlsCarried, crossFeedCount: feedUrlsCarried.length }))
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  await updateFeedHealth(feedResults, feeds);

  console.log(`\n📊 Collected ${articles.length} articles from ${successCount}/${totalFeeds} feeds (${failCount} feeds failed)`);
  const crossFeed = articles.filter((a) => a.crossFeedCount >= 3).length;
  if (crossFeed > 0) console.log(`   ${crossFeed} stories in 3+ feeds (cross-feed signal)\n`);
  return articles;
}

async function updateFeedHealth(feedResults, feeds) {
  let memory = {};
  try {
    const raw = await readFile(MEMORY_FILE, 'utf-8');
    memory = JSON.parse(raw);
  } catch {
    memory = { lastRun: null, feedHealth: {}, topicFrequency: {}, toolsMentioned: [], lastBriefings: [] };
  }

  memory.lastRun = new Date().toISOString();
  memory.feedHealth = memory.feedHealth || {};
  const today = new Date().toISOString().slice(0, 10);

  for (const { url } of feeds) {
    const result = feedResults[url];
    if (!memory.feedHealth[url]) memory.feedHealth[url] = { lastSuccess: null, failCount: 0, avgArticles: 0, samples: [] };
    const h = memory.feedHealth[url];
    if (result.success) {
      h.lastSuccess = today;
      h.failCount = 0;
      h.samples = (h.samples || []).concat(result.count).slice(-10);
      h.avgArticles = h.samples.length ? Math.round(h.samples.reduce((a, b) => a + b, 0) / h.samples.length) : result.count;
    } else {
      h.failCount = (h.failCount || 0) + 1;
    }
  }

  await mkdir('data', { recursive: true });
  await writeFile(MEMORY_FILE, JSON.stringify(memory, null, 2), 'utf-8');
}
