// ============================================================
// PRISM v4.0 WebIntel — Proactive Web Intelligence
// NEW module. Runs in parallel with classify.js, BEFORE synthesis.
//
// Two-step process:
//   Step 1: Generate 5-8 targeted search queries from life context
//           (fast Claude call, no web search, ~30 seconds)
//   Step 2: Execute all queries in parallel via Claude web search
//           (2-3 minutes total, all queries concurrent)
//
// Output saved to data/web-intelligence.md
// Both synthesis calls (Builder + World) receive this pre-built intelligence.
// Web search during synthesis becomes verification-only — not primary research.
// ============================================================

import { readFile, writeFile, mkdir, readdir } from 'fs/promises';
import Anthropic from '@anthropic-ai/sdk';
import {
  MODELS,
  SONNET_46_BETAS,
  WEBINTEL_PROMPT,
  LIMITS,
  LIFE_CONTEXT_FILE,
  BRIEFINGS_DIR,
  WEBINTEL_FILE,
} from './config.js';

const client = new Anthropic();

// ── Data Loaders ─────────────────────────────────────────────

async function loadLifeContext() {
  try {
    return await readFile(LIFE_CONTEXT_FILE, 'utf-8');
  } catch {
    return 'Julien — Brussels-based founder. Building micro-SaaS with AI. Runs Chez Julien specialty food shop.';
  }
}

async function loadLastBriefings(maxCount = 2) {
  try {
    const files = await readdir(BRIEFINGS_DIR);
    const md = files.filter(f => f.endsWith('.md')).sort().reverse().slice(0, maxCount);
    const contents = await Promise.all(
      md.map(f =>
        readFile(`${BRIEFINGS_DIR}/${f}`, 'utf-8')
          .then(c => `--- ${f} ---\n${c.substring(0, 1500)}`)
      )
    );
    return contents.length ? contents.join('\n\n') : 'No previous briefings yet.';
  } catch {
    return 'No previous briefings yet.';
  }
}

// ── Query Generation ─────────────────────────────────────────

/**
 * Robustly extract a JSON array from model response.
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

/**
 * Generate targeted search queries based on life context and recent briefings.
 * Fast, cheap call — no web search, just reasoning about what to look for today.
 */
async function generateQueries(lifeContext, lastBriefings) {
  const today = new Date().toISOString().slice(0, 10);

  const prompt = `${WEBINTEL_PROMPT}

===== TODAY'S DATE =====
${today}

===== JULIEN'S LIFE CONTEXT =====
${lifeContext}

===== RECENT BRIEFING TOPICS (to avoid re-searching yesterday's covered topics) =====
${lastBriefings}

Generate 5-8 targeted search queries now. Return ONLY the JSON array, no other text.`;

  const response = await client.messages.create({
    model: MODELS.analyzer,
    max_tokens: LIMITS.webIntelMaxTokens,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content[0].text.trim();
  const queries = extractJsonArray(text);

  if (!queries || queries.length === 0) {
    console.log('  ⚠️ Query generation returned no valid JSON — using fallback queries');
    return null;
  }

  return queries.filter(q => typeof q === 'string' && q.trim().length > 0);
}

// ── Search Execution ─────────────────────────────────────────

/**
 * Execute a single web search via Claude with web_search tool.
 * Returns a concise text summary with key facts and URLs.
 */
async function executeSearch(query) {
  try {
    const response = await client.beta.messages.create({
      model: MODELS.analyzer,
      max_tokens: 2048,
      betas: SONNET_46_BETAS,
      tools: [{ type: 'web_search_20260209', name: 'web_search' }],
      messages: [{
        role: 'user',
        content: `Search for and summarize: ${query}\n\nProvide a concise 2-4 sentence factual summary of the most relevant recent findings. Include the most important source URL(s). Be specific — exact dates, version numbers, prices matter.`,
      }],
    });

    let result = '';
    for (const block of response.content) {
      if (block.type === 'text') result += block.text;
    }

    const trimmed = result.trim();
    return trimmed || 'No relevant results found for this query.';
  } catch (err) {
    if (err.message?.includes('overloaded') || err.message?.includes('529')) {
      return `Search temporarily unavailable (API overloaded). Try again in next run.`;
    }
    return `Search failed: ${err.message}`;
  }
}

// ── Main Export ──────────────────────────────────────────────

/**
 * Run proactive web intelligence gathering.
 * Generates queries from life context, executes in parallel, saves to disk.
 *
 * @returns {Promise<string>} The full web intelligence content (also saved to WEBINTEL_FILE)
 */
export default async function webintel() {
  console.log('\n🔍 WEBINTEL — Proactive web intelligence...');

  const [lifeContext, lastBriefings] = await Promise.all([
    loadLifeContext(),
    loadLastBriefings(2),
  ]);

  // ── Step 1: Generate targeted queries ───────────────────────
  let queries;
  try {
    queries = await generateQueries(lifeContext, lastBriefings);
  } catch (err) {
    console.log(`  ⚠️ Query generation failed: ${err.message}`);
    queries = null;
  }

  // Fallback queries if generation failed
  const fallbackQueries = [
    `Claude Code updates ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
    'micro-SaaS product launches this week',
    'Cursor vs Windsurf AI coding tools 2026',
    'vibe coding AI-assisted engineering news',
    `Belgium tech startup news ${new Date().getFullYear()}`,
  ];

  queries = queries || fallbackQueries;

  console.log(`  Generated ${queries.length} search queries:`);
  queries.forEach((q, i) => console.log(`    ${i + 1}. ${q}`));

  // ── Step 2: Execute all searches in parallel ─────────────────
  console.log(`  Executing ${queries.length} searches in parallel...`);
  const startTime = Date.now();

  const results = await Promise.all(
    queries.map(async (query, i) => {
      const result = await executeSearch(query);
      return { query, result, index: i + 1 };
    })
  );

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const successCount = results.filter(r => !r.result.startsWith('Search failed') && !r.result.startsWith('Search temporarily')).length;
  console.log(`  ✅ ${successCount}/${results.length} searches completed in ${elapsed}s`);

  // ── Step 3: Format and save ──────────────────────────────────
  const today = new Date().toISOString().slice(0, 10);
  const timestamp = new Date().toISOString();

  const content = [
    `<!-- PRISM Web Intelligence — ${today} — generated ${timestamp} -->`,
    `# Proactive Web Intelligence — ${today}`,
    `*${successCount} of ${queries.length} searches returned results*`,
    '',
    ...results.map(r => [
      `## Query ${r.index}: ${r.query}`,
      '',
      r.result,
    ].join('\n')),
  ].join('\n\n');

  await mkdir('data', { recursive: true });
  await writeFile(WEBINTEL_FILE, content, 'utf-8');
  console.log(`  Saved to ${WEBINTEL_FILE}`);

  return content;
}
