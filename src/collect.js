// ============================================================
// PRISM Collector — Fetches articles from RSS feeds
// ============================================================

import Parser from 'rss-parser';
import { FEEDS, LIMITS } from './config.js';

const parser = new Parser({
  timeout: 10000, // 10s timeout per feed
  headers: {
    'User-Agent': 'PRISM/0.1 (Personal Research Intelligence System)',
  },
});

/**
 * Fetch all configured RSS feeds and return a deduplicated, cleaned array of articles.
 * Filters to articles published within the last LIMITS.maxArticleAge hours.
 */
export default async function collect() {
  console.log(`\n📡 COLLECTING from ${FEEDS.length} feeds...`);
  const cutoff = new Date(Date.now() - LIMITS.maxArticleAge * 60 * 60 * 1000);
  const allArticles = [];
  const seenUrls = new Set();

  // Fetch all feeds in parallel
  const results = await Promise.allSettled(
    FEEDS.map(async (feed) => {
      try {
        const parsed = await parser.parseURL(feed.url);
        const articles = (parsed.items || [])
          .filter((item) => {
            // Filter by date if available
            if (item.pubDate || item.isoDate) {
              const date = new Date(item.pubDate || item.isoDate);
              return date >= cutoff;
            }
            // Keep articles without dates (better to include than miss)
            return true;
          })
          .map((item) => ({
            title: item.title?.trim() || 'Untitled',
            link: item.link || '',
            content: cleanContent(item.contentSnippet || item.content || item.summary || ''),
            source: feed.name,
            date: item.pubDate || item.isoDate || new Date().toISOString(),
            author: item.creator || item.author || '',
          }));

        console.log(`  ✅ ${feed.name}: ${articles.length} articles`);
        return articles;
      } catch (err) {
        console.log(`  ❌ ${feed.name}: ${err.message}`);
        return [];
      }
    })
  );

  // Flatten and deduplicate
  for (const result of results) {
    if (result.status === 'fulfilled') {
      for (const article of result.value) {
        if (article.link && !seenUrls.has(article.link)) {
          seenUrls.add(article.link);
          allArticles.push(article);
        }
      }
    }
  }

  // Sort by date (newest first)
  allArticles.sort((a, b) => new Date(b.date) - new Date(a.date));

  console.log(`\n📊 Collected ${allArticles.length} unique articles (cutoff: ${LIMITS.maxArticleAge}h)\n`);
  return allArticles;
}

/**
 * Clean article content: strip HTML, trim whitespace, truncate to maxArticleLength
 */
function cleanContent(raw) {
  let text = raw
    // Strip HTML tags
    .replace(/<[^>]*>/g, '')
    // Decode common HTML entities
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    // Collapse whitespace
    .replace(/\s+/g, ' ')
    .trim();

  // Truncate to save tokens
  if (text.length > LIMITS.maxArticleLength) {
    text = text.substring(0, LIMITS.maxArticleLength) + '... [truncated]';
  }

  return text;
}
