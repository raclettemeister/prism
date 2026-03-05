import { readFile, writeFile, mkdir } from 'fs/promises';
import { createHash } from 'crypto';
import Anthropic from '@anthropic-ai/sdk';
import {
  MODELS,
  SONNET_46_BETAS,
  LIMITS,
  SCOUT_MEMORY_FILE,
  SCOUT_QUERY_POOL,
  SCOUT_PROMPT,
} from './config.js';

const client = new Anthropic();

function urlHash(url) {
  return createHash('sha256').update(url.toLowerCase().trim()).digest('hex').slice(0, 16);
}

async function loadScoutMemory() {
  try {
    const raw = await readFile(SCOUT_MEMORY_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return { version: 1, catches: [], query_performance: {}, source_performance: {} };
  }
}

async function saveScoutMemory(memory) {
  await mkdir('data', { recursive: true });
  await writeFile(SCOUT_MEMORY_FILE, JSON.stringify(memory, null, 2), 'utf-8');
}

function selectQueries(memory, count = 8) {
  const always = SCOUT_QUERY_POOL.filter(q => q.priority === 'always');
  const rotate = SCOUT_QUERY_POOL.filter(q => q.priority === 'rotate');

  const scored = rotate.map(q => {
    const perf = memory.query_performance[q.query];
    const catchRate = perf ? perf.catches_produced / Math.max(perf.times_used, 1) : 0.5;
    const recency = perf ? (Date.now() - new Date(perf.last_used).getTime()) / 86400000 : 999;
    return { ...q, score: catchRate * 0.4 + Math.min(recency / 7, 1) * 0.6 };
  });

  scored.sort((a, b) => b.score - a.score);

  const bucketsSeen = new Set(always.map(q => q.bucket));
  const selected = [...always];
  for (const q of scored) {
    if (selected.length >= count) break;
    if (bucketsSeen.has(q.bucket) && selected.length > count - 2) continue;
    selected.push(q);
    bucketsSeen.add(q.bucket);
  }

  return selected.slice(0, count);
}

async function executeScoutSearch(query) {
  try {
    const response = await client.beta.messages.create({
      model: MODELS.analyzer,
      max_tokens: 2048,
      betas: SONNET_46_BETAS,
      tools: [{ type: 'web_search_20260209', name: 'web_search' }],
      messages: [{
        role: 'user',
        content: `Search for: ${query}

Return results as a structured list. For each relevant result, provide:
- Title/Name
- URL
- One-line description
- Geographic location if detectable (city, country)
- Why this is relevant to cooperative/open-source/social-impact tech

Focus on: solo developers, small companies, incubators, EU subsidies, open source projects, cooperative platforms. Brussels/Belgium/Europe preferred.

Be factual. Only include results with real URLs.`,
      }],
    });

    let result = '';
    for (const block of response.content) {
      if (block.type === 'text') result += block.text;
    }
    return result.trim() || 'No results found.';
  } catch (err) {
    return `Search failed: ${err.message}`;
  }
}

function dedup(catches, memory) {
  const cutoff = Date.now() - LIMITS.scoutMemoryDays * 86400000;
  const recentHashes = new Set(
    memory.catches
      .filter(c => new Date(c.surfaced_date).getTime() > cutoff)
      .map(c => c.url_hash)
  );

  return catches.filter(c => {
    const hash = urlHash(c.url || c.title);
    return !recentHashes.has(hash);
  });
}

export default async function scout(scoutArticles = []) {
  console.log('\n🌱 SCOUT — Grassroot Radar scanning...');
  const startTime = Date.now();

  const memory = await loadScoutMemory();
  const queries = selectQueries(memory, 8);

  console.log(`  Selected ${queries.length} search queries:`);
  queries.forEach((q, i) => console.log(`    ${i + 1}. [${q.bucket}] ${q.query}`));

  const searchResults = await Promise.all(
    queries.map(async (q) => {
      const result = await executeScoutSearch(q.query);

      const perf = memory.query_performance[q.query] || { times_used: 0, catches_produced: 0, last_used: null };
      perf.times_used += 1;
      perf.last_used = new Date().toISOString().slice(0, 10);
      memory.query_performance[q.query] = perf;

      return { query: q.query, bucket: q.bucket, result };
    })
  );

  const successCount = searchResults.filter(r => !r.result.startsWith('Search failed')).length;
  console.log(`  ✅ ${successCount}/${searchResults.length} searches completed`);

  let rssBlock = '';
  if (scoutArticles.length > 0) {
    rssBlock = '\n\n--- RSS SCOUT FEEDS ---\n' + scoutArticles.map((a, i) =>
      `${i + 1}. [${a.source}] ${a.title}\n   URL: ${a.link}\n   ${(a.content || '').substring(0, 300)}`
    ).join('\n\n');
    console.log(`  📡 ${scoutArticles.length} articles from scout RSS feeds`);
  }

  const rawCatches = searchResults.map(r =>
    `--- Search: ${r.query} [${r.bucket}] ---\n${r.result}`
  ).join('\n\n') + rssBlock;

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`  Scout collection completed in ${elapsed}s`);

  await saveScoutMemory(memory);

  return {
    rawCatches,
    catchCount: searchResults.length + scoutArticles.length,
    memory,
    searchCount: successCount,
  };
}
