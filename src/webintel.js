// ============================================================
// PRISM v5.0 WebIntel — cross-domain radar + themed depth
//
// Each run generates:
// - 1 query per theme (for daily oversight)
// - 2 extra queries for the scheduled theme (for today's deep section)
// ============================================================

import { readFile, writeFile, mkdir, readdir } from 'fs/promises';
import Anthropic from '@anthropic-ai/sdk';
import {
  MODELS,
  SONNET_46_BETAS,
  LIMITS,
  LIFE_CONTEXT_FILE,
  BRIEFINGS_DIR,
  WEBINTEL_FILE,
  MEMORY_FILE,
  THEME_CONFIG,
  THEMED_WEBINTEL_PROMPT,
} from './config.js';
import { ensureThemeCycle, getScheduledTheme, themeLabel } from './themes.js';

const client = new Anthropic();

async function loadLifeContext() {
  try {
    return await readFile(LIFE_CONTEXT_FILE, 'utf-8');
  } catch {
    return 'Julien — Brussels-based founder. Building micro-software with AI.';
  }
}

async function loadLastBriefings(maxCount = 2) {
  try {
    const files = await readdir(BRIEFINGS_DIR);
    const md = files.filter((file) => file.endsWith('.md')).sort().reverse().slice(0, maxCount);
    const contents = await Promise.all(
      md.map((file) => readFile(`${BRIEFINGS_DIR}/${file}`, 'utf-8').then((content) => `--- ${file} ---\n${content.substring(0, 1200)}`))
    );
    return contents.join('\n\n') || 'No previous briefings yet.';
  } catch {
    return 'No previous briefings yet.';
  }
}

async function loadMemory() {
  try {
    const raw = await readFile(MEMORY_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function extractJsonArray(text) {
  const stripped = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  try {
    const parsed = JSON.parse(stripped);
    if (Array.isArray(parsed)) return parsed;
  } catch { /* fall through */ }

  const match = text.match(/\[[\s\S]*\]/);
  if (!match) return null;

  try {
    const parsed = JSON.parse(match[0]);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

async function generateQueries({ scheduledTheme, lifeContext, lastBriefings }) {
  const today = new Date().toISOString().slice(0, 10);
  const prompt = THEMED_WEBINTEL_PROMPT
    .replace('{scheduled_theme}', scheduledTheme)
    .replace('{scheduled_theme_focus}', THEME_CONFIG[scheduledTheme]?.webIntelPrompt || themeLabel(scheduledTheme))
    .replace('{today}', today);

  const response = await client.messages.create({
    model: MODELS.analyzer,
    max_tokens: LIMITS.webIntelMaxTokens,
    messages: [{
      role: 'user',
      content: `${prompt}\n\n===== LIFE CONTEXT =====\n${lifeContext}\n\n===== RECENT BRIEFINGS =====\n${lastBriefings}`,
    }],
  });

  const text = response.content[0].text.trim();
  const parsed = extractJsonArray(text);
  if (!parsed || parsed.length === 0) return null;

  return normalizeQueries(parsed, scheduledTheme);
}

function normalizeQueries(entries, scheduledTheme) {
  const normalized = [];
  for (const entry of entries) {
    if (!entry || typeof entry !== 'object') continue;
    const query = String(entry.query || '').trim();
    const theme = THEME_CONFIG[entry.theme] ? entry.theme : scheduledTheme;
    const purpose = String(entry.purpose || '').trim() || `Daily ${themeLabel(theme)} check`;
    if (!query) continue;
    normalized.push({ query, theme, purpose });
  }

  return normalized.slice(0, 6);
}

function buildFallbackQueries(scheduledTheme) {
  const monthYear = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const baseQueries = {
    dev: `Cursor Claude Code Windsurf Lovable Bolt release ${monthYear}`,
    grassroot: `Brussels Belgium cooperative tech funding grant ${new Date().getFullYear()}`,
    game: `solo game dev AI tools release ${monthYear}`,
    geo_eu: `Belgium EU business regulation VAT energy ${monthYear}`,
  };

  const extras = {
    dev: [
      `AI-assisted engineering workflow updates ${monthYear}`,
      `micro-SaaS builder tool pricing release ${monthYear}`,
    ],
    grassroot: [
      `Grassroot Hopper aligned people startups Brussels ${monthYear}`,
      `Innoviris NLnet open call cooperative technology ${new Date().getFullYear()}`,
    ],
    game: [
      `creative AI game pipeline update ${monthYear}`,
      `Unity Godot Unreal solo dev AI update ${monthYear}`,
    ],
    geo_eu: [
      `Belgium Brussels SME policy update ${monthYear}`,
      `EU economic policy founder impact ${monthYear}`,
    ],
  };

  return [
    { query: baseQueries.dev, theme: 'dev', purpose: 'Daily dev radar' },
    { query: baseQueries.grassroot, theme: 'grassroot', purpose: 'Daily grassroot radar' },
    { query: baseQueries.game, theme: 'game', purpose: 'Daily game radar' },
    { query: baseQueries.geo_eu, theme: 'geo_eu', purpose: 'Daily geo-EU radar' },
    ...extras[scheduledTheme].map((query) => ({
      query,
      theme: scheduledTheme,
      purpose: `Deepen ${themeLabel(scheduledTheme)} day`,
    })),
  ];
}

async function executeSearch({ query, theme, purpose }) {
  try {
    const response = await client.beta.messages.create({
      model: MODELS.analyzer,
      max_tokens: 1400,
      betas: SONNET_46_BETAS,
      tools: [{ type: 'web_search_20260209', name: 'web_search' }],
      messages: [{
        role: 'user',
        content: `Search for recent, factual updates on: ${query}

Return a concise summary with:
- what changed
- why it matters
- the most important source URL(s)

Keep it short and concrete. Include dates when available.`,
      }],
    });

    let result = '';
    for (const block of response.content) {
      if (block.type === 'text') result += block.text;
    }

    return {
      query,
      theme,
      purpose,
      result: result.trim() || 'No relevant results found.',
    };
  } catch (err) {
    return {
      query,
      theme,
      purpose,
      result: `Search failed: ${err.message}`,
    };
  }
}

function formatMarkdown({ scheduledTheme, queries, results }) {
  const today = new Date().toISOString().slice(0, 10);
  const lines = [
    `<!-- PRISM Web Intelligence — ${today} -->`,
    `# Web Intelligence — ${today}`,
    `*Scheduled theme: ${themeLabel(scheduledTheme)}*`,
    '',
  ];

  for (const result of results) {
    lines.push(`## [${result.theme}] ${result.query}`);
    lines.push('');
    lines.push(`Purpose: ${result.purpose}`);
    lines.push('');
    lines.push(result.result);
    lines.push('');
  }

  return lines.join('\n');
}

export default async function webintel(themeKey = null) {
  console.log('\n🔍 WEBINTEL — cross-domain radar + themed depth...');

  const [lifeContext, lastBriefings, memory] = await Promise.all([
    loadLifeContext(),
    loadLastBriefings(2),
    loadMemory(),
  ]);

  ensureThemeCycle(memory);
  const scheduledTheme = themeKey || getScheduledTheme(memory);

  let queries;
  try {
    queries = await generateQueries({ scheduledTheme, lifeContext, lastBriefings });
  } catch (err) {
    console.log(`  ⚠️ Query generation failed: ${err.message}`);
    queries = null;
  }

  queries = queries || buildFallbackQueries(scheduledTheme);

  console.log(`  Scheduled theme: ${themeLabel(scheduledTheme)}`);
  queries.forEach((item, index) => {
    console.log(`    ${index + 1}. [${item.theme}] ${item.query}`);
  });

  const results = await Promise.all(queries.map((query) => executeSearch(query)));
  const content = formatMarkdown({ scheduledTheme, queries, results });

  await mkdir('data', { recursive: true });
  await writeFile(WEBINTEL_FILE, content, 'utf-8');
  console.log(`  Saved to ${WEBINTEL_FILE}`);

  return {
    scheduledTheme,
    queries,
    results,
    markdown: content,
  };
}
