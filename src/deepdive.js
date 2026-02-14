// ============================================================
// PRISM Deep Dive v1.3 — On-demand research from life-context "deep dive: topic"
// Runs after context, before collect. Up to 3 topics; 5 queries each; RSS + full text → Sonnet report.
// ============================================================

import { readFile, writeFile, mkdir } from 'fs/promises';
import { format } from 'date-fns';
import Anthropic from '@anthropic-ai/sdk';
import Parser from 'rss-parser';
import * as cheerio from 'cheerio';

import { MODELS, LIMITS, LIFE_CONTEXT_FILE } from './config.js';

const DEEP_DIVES_DIR = 'briefings/deep-dives';
const MAX_TOPICS = 3;
const QUERIES_PER_TOPIC = 5;
const MAX_ARTICLES_TO_READ = 20;
const FETCH_TIMEOUT_MS = 15000;
const MAX_WORDS = 3000;

const parser = new Parser({
  timeout: 10000,
  headers: { 'User-Agent': 'PRISM/1.3 (Personal Research Intelligence; +https://github.com/raclettemeister/prism)' },
});

const client = new Anthropic();

/**
 * Extract topics from life-context: lines containing "deep dive: topic" (case insensitive). Max 3.
 */
function extractTopics(lifeContext) {
  const re = /deep\s+dive\s*:\s*(.+)/gi;
  const topics = [];
  let m;
  while ((m = re.exec(lifeContext)) !== null) {
    const topic = m[1].trim();
    if (topic && !topics.includes(topic)) topics.push(topic);
  }
  if (topics.length > MAX_TOPICS) {
    console.warn(`  ⚠️ More than ${MAX_TOPICS} deep dives requested; using first ${MAX_TOPICS} only.`);
    return topics.slice(0, MAX_TOPICS);
  }
  return topics;
}

/**
 * Sonnet: generate 5 specific search queries for the topic.
 */
async function generateQueries(topic) {
  const response = await client.messages.create({
    model: MODELS.analyzer,
    max_tokens: 512,
    messages: [
      {
        role: 'user',
        content: `Generate exactly 5 specific search queries to find recent articles and discussions about: "${topic}". Return only a JSON array of 5 strings, no other text. Example: ["query one", "query two"].`,
      },
    ],
  });
  const text = response.content[0].text.trim().replace(/```json?\n?/g, '').replace(/```\n?/g, '').trim();
  try {
    const arr = JSON.parse(text);
    return Array.isArray(arr) ? arr.slice(0, QUERIES_PER_TOPIC).map((q) => String(q).trim()).filter(Boolean) : [];
  } catch {
    return [];
  }
}

/**
 * Fetch RSS feed URL; return items with link and title.
 */
async function fetchRssFeed(url) {
  try {
    const parsed = await parser.parseURL(url);
    return (parsed.items || []).map((item) => ({ link: item.link || '', title: item.title || 'Untitled' })).filter((i) => i.link);
  } catch {
    return [];
  }
}

/**
 * Same extraction as read.js: article/main/body, strip nav/footer/script/style, 3000 words.
 */
function extractTextFromHtml(html) {
  const $ = cheerio.load(html);
  $('nav, footer, aside, [role="navigation"], [role="contentinfo"], .sidebar, .nav, .footer, script, style').remove();
  let root = $('article').first();
  if (root.length === 0) root = $('main').first();
  if (root.length === 0) root = $('body');
  const text = root.length ? root.text() : $.text();
  const trimmed = text.replace(/\s+/g, ' ').trim();
  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length <= MAX_WORDS) return words.join(' ');
  return words.slice(0, MAX_WORDS).join(' ') + ' [truncated]';
}

async function fetchFullText(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'PRISM/1.3 (Personal Research Intelligence; +https://github.com/raclettemeister/prism)' },
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const html = await res.text();
    return extractTextFromHtml(html);
  } catch {
    clearTimeout(timeout);
    return null;
  }
}

/**
 * Build RSS search URLs for a query.
 */
function rssUrlsForQuery(query) {
  const enc = encodeURIComponent(query);
  return [
    `https://hnrss.org/newest?q=${enc}&count=10`,
    `https://www.reddit.com/search.rss?q=${enc}&sort=new&limit=10`,
    `https://news.google.com/rss/search?q=${enc}&hl=en`,
  ];
}

/**
 * Run one deep dive: queries → RSS → dedupe → fetch full text (up to 20) → Sonnet report.
 */
async function runDeepDive(topic) {
  const queries = await generateQueries(topic);
  if (queries.length === 0) {
    console.log(`  No queries generated for "${topic}"`);
    return null;
  }

  const seen = new Set();
  const items = [];
  for (const q of queries) {
    for (const url of rssUrlsForQuery(q)) {
      const feedItems = await fetchRssFeed(url);
      for (const it of feedItems) {
        if (it.link && !seen.has(it.link)) {
          seen.add(it.link);
          items.push(it);
        }
      }
    }
  }

  const toRead = items.slice(0, MAX_ARTICLES_TO_READ);
  let readCount = 0;
  const articlesWithText = [];
  for (const it of toRead) {
    const fullText = await fetchFullText(it.link);
    if (fullText) {
      readCount++;
      articlesWithText.push({ title: it.title, link: it.link, fullText });
    }
  }

  if (articlesWithText.length === 0) {
    console.log(`  No article text fetched for "${topic}"`);
    return null;
  }

  const articlesBlock = articlesWithText
    .map((a, i) => `--- ARTICLE ${i + 1} ---\nTITLE: ${a.title}\nURL: ${a.link}\n\n${a.fullText}`)
    .join('\n\n');

  const reportPrompt = `You are PRISM doing a deep dive on: "${topic}"

You have ${articlesWithText.length} full articles. Read them all carefully.

Your report MUST start with this exact section (3-4 paragraphs for the daily briefing):
## Executive Summary

Then continue with:

## Deep Dive: ${topic}

### The Current State
What exists right now? Who are the players? What can you do today?

### The Trajectory
Where is this heading in 3-6 months? What signals point there?

### Competitive Landscape
Who is building what? Open source vs commercial? US vs Europe availability?

### What This Means For Julien
Specific implications for his projects. Name the projects by name.

### Recommended Actions
Numbered list. Each action specific and achievable this week. No coding required.

### Sources
Every article referenced with title + URL.

Be thorough. This is a research report, not a summary.`;

  const response = await client.messages.create({
    model: MODELS.analyzer,
    max_tokens: LIMITS.analysisMaxTokens,
    messages: [{ role: 'user', content: `${reportPrompt}\n\n===== ARTICLES =====\n\n${articlesBlock}` }],
  });

  const fullReport = response.content[0].text.trim();
  const summaryMatch = fullReport.match(/\n##\s+Executive\s+Summary\s*\n([\s\S]*?)(?=\n##\s|$)/i);
  const summary = summaryMatch ? summaryMatch[1].trim() : fullReport.slice(0, 2000);

  const slug = topic.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '').slice(0, 80) || 'topic';
  const today = format(new Date(), 'yyyy-MM-dd');
  const filename = `${today}-${slug}.md`;
  await mkdir(DEEP_DIVES_DIR, { recursive: true });
  const reportPath = `${DEEP_DIVES_DIR}/${filename}`;
  await writeFile(reportPath, fullReport, 'utf-8');

  console.log(`  Deep dive: ${topic} — found ${items.length} articles, read ${readCount} fully, report generated`);
  return { topic, summary, reportPath };
}

/**
 * Read life-context, extract up to 3 "deep dive: topic" lines, run each, return report data for synthesize.
 */
export default async function deepdive() {
  let lifeContext = '';
  try {
    lifeContext = await readFile(LIFE_CONTEXT_FILE, 'utf-8');
  } catch {
    console.log('\n🔬 DEEP DIVE: No life-context.md — skipping.');
    return null;
  }

  const topics = extractTopics(lifeContext);
  if (topics.length === 0) {
    console.log('\n🔬 DEEP DIVE: No deep dives requested.');
    return null;
  }

  console.log(`\n🔬 DEEP DIVE: ${topics.length} topic(s) requested: ${topics.join('; ')}`);

  const results = [];
  for (const topic of topics) {
    const one = await runDeepDive(topic);
    if (one) results.push(one);
  }

  if (results.length === 0) return null;
  return { deepDives: results };
}
