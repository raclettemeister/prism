// ============================================================
// PRISM Context Generator v2 — Human-in-the-loop design
//
// Priority order:
//   1. context-note.md  — Written by Julien + Opus (THE source of truth)
//   2. LOG.md           — Last 3 days only (what actually happened)
//   3. Recently modified — Git tells us what changed in last 48h
//   4. CLAUDE.md        — Stable identity (read but low-weighted)
//
// If context-note.md exists and is fresh (<48h old), PRISM uses it
// directly with minimal processing. The whole point: Julien already
// told the AI what matters. Don't second-guess him.
// ============================================================

import { readFile, writeFile, readdir, mkdir } from 'fs/promises';
import { join } from 'path';
import { execSync } from 'child_process';
import Anthropic from '@anthropic-ai/sdk';
import { MODELS, LIFE_CONTEXT_FILE } from './config.js';

const client = new Anthropic();

const MYLIFEOS_DIR = '/tmp/mylifeos';

// The human-written context note — highest priority
const CONTEXT_NOTE_PATH = 'Journal/context-note.md';

// Stable identity file — always read but low priority
const IDENTITY_FILE = 'CLAUDE.md';

// How many days of LOG.md to extract
const LOG_DAYS = 3;

/**
 * Generate life-context.md for PRISM.
 *
 * Strategy:
 * - If context-note.md exists and is fresh: use it as PRIMARY source
 * - Always supplement with LOG.md (last 3 days) and recently modified files
 * - Claude's job is to MERGE these layers, not to guess from 25 files
 */
export default async function generateContext() {
  console.log('\n🧬 CONTEXT GENERATOR v2 — Human-in-the-loop');

  const repoUrl = process.env.MYLIFEOS_REPO;
  if (!repoUrl) {
    console.log('  ⚠️ No MYLIFEOS_REPO set — using existing life-context.md');
    return { generated: false, reason: 'no repo URL' };
  }

  const startTime = Date.now();

  try {
    // Step 1: Clone the repo
    await cloneRepo(repoUrl);

    // Step 2: Gather content (prioritized)
    const content = await gatherContent();

    // Step 3: Generate context
    let lifeContext;

    if (content.contextNote) {
      console.log(`  📝 Context note found (${content.contextNote.length} chars)`);

      if (content.needsSynthesis) {
        // Context note exists but we have supplementary data — merge them
        lifeContext = await synthesizeContext(content);
      } else {
        // Context note is all we need — use it directly (save tokens)
        lifeContext = formatDirectContext(content);
      }
    } else {
      console.log('  ⚠️ No context-note.md found — generating from LOG + recent files');
      lifeContext = await synthesizeContext(content);
    }

    // Step 4: Write to file
    await mkdir('data', { recursive: true });
    await writeFile(LIFE_CONTEXT_FILE, lifeContext, 'utf-8');

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`  ✅ Life context ready (${lifeContext.length} chars) in ${elapsed}s`);

    return {
      generated: true,
      hasContextNote: !!content.contextNote,
      filesRead: content.fileCount,
      inputChars: content.totalChars,
      outputChars: lifeContext.length,
      elapsed,
    };

  } catch (err) {
    console.log(`  ❌ Context generation failed: ${err.message}`);
    console.log('  Falling back to existing life-context.md');
    return { generated: false, reason: err.message };
  }
}

/**
 * Clone the MylifeOS repo.
 */
async function cloneRepo(repoUrl) {
  console.log('  📥 Cloning MylifeOS...');

  let authUrl = repoUrl;
  const pat = process.env.MYLIFEOS_PAT;
  if (pat && repoUrl.startsWith('https://')) {
    authUrl = repoUrl.replace('https://', `https://${pat}@`);
  }

  try {
    execSync(`rm -rf ${MYLIFEOS_DIR}`, { stdio: 'pipe' });
    execSync(`git clone --depth 1 --single-branch ${authUrl} ${MYLIFEOS_DIR}`, {
      stdio: 'pipe',
      timeout: 60000,
    });
    console.log('  ✅ MylifeOS cloned');
  } catch (err) {
    throw new Error(`Git clone failed: ${err.stderr?.toString()?.trim() || err.message}`);
  }
}

/**
 * Gather content with clear priority layers.
 */
async function gatherContent() {
  let totalChars = 0;
  let fileCount = 0;

  // ── Layer 1: Context Note (human-written, highest priority) ──
  const contextNote = await safeRead(join(MYLIFEOS_DIR, CONTEXT_NOTE_PATH));
  if (contextNote) {
    totalChars += contextNote.length;
    fileCount++;
  }

  // ── Layer 2: LOG.md — last N days only ──
  const logContent = await extractRecentLog(LOG_DAYS);
  if (logContent) {
    totalChars += logContent.length;
    fileCount++;
  }

  // ── Layer 3: Recently modified files (git-based) ──
  const recentFiles = await getRecentlyModifiedFiles();
  for (const f of recentFiles) {
    totalChars += f.content.length;
    fileCount++;
  }

  // ── Layer 4: Stable identity ──
  const identity = await safeRead(join(MYLIFEOS_DIR, IDENTITY_FILE));
  if (identity) {
    totalChars += identity.length;
    fileCount++;
  }

  // Decide if we need Claude synthesis or can use context note directly
  const needsSynthesis = !contextNote || recentFiles.length > 0 || logContent;

  return {
    contextNote,
    logContent,
    recentFiles,
    identity,
    totalChars,
    fileCount,
    needsSynthesis,
  };
}

/**
 * Extract only the last N days from LOG.md.
 * Parses the date headers (## 2026-02-14) and takes only recent ones.
 */
async function extractRecentLog(days) {
  const logPath = join(MYLIFEOS_DIR, 'LOG.md');
  const raw = await safeRead(logPath);
  if (!raw) return null;

  const lines = raw.split('\n');
  const sections = [];
  let currentSection = null;

  // Parse LOG.md into date sections
  for (const line of lines) {
    const dateMatch = line.match(/^## (\d{4}-\d{2}-\d{2})/);
    if (dateMatch) {
      if (currentSection) sections.push(currentSection);
      currentSection = { date: dateMatch[1], lines: [line] };
    } else if (currentSection) {
      currentSection.lines.push(line);
    }
  }
  if (currentSection) sections.push(currentSection);

  // Filter to last N days
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().split('T')[0];

  const recentSections = sections.filter(s => s.date >= cutoffStr);

  if (recentSections.length === 0) {
    // Fallback: take at least the most recent section
    return sections.length > 0 ? sections[0].lines.join('\n') : null;
  }

  console.log(`  📋 LOG.md: ${recentSections.length} day(s) extracted (last ${days} days)`);
  return recentSections.map(s => s.lines.join('\n')).join('\n\n');
}

/**
 * Use git log to find files modified in the last 48 hours.
 * Read only the ones that matter (STATUS.md, README.md, strategy docs).
 */
async function getRecentlyModifiedFiles() {
  const files = [];

  try {
    // Get list of all tracked files with their last commit date
    const output = execSync(
      `cd ${MYLIFEOS_DIR} && git log --all --format="" --name-only --since="48 hours ago" | sort -u`,
      { stdio: 'pipe', encoding: 'utf-8' }
    ).trim();

    if (!output) {
      console.log('  📂 No files modified in last 48h');
      return files;
    }

    const modifiedPaths = output.split('\n').filter(Boolean);

    // Filter to meaningful files only (skip media, obsidian config, etc.)
    const meaningful = modifiedPaths.filter(p =>
      p.endsWith('.md') &&
      !p.startsWith('.obsidian') &&
      !p.startsWith('_Archive') &&
      !p.startsWith('Books/') &&
      !p.startsWith('Media/') &&
      p !== 'CLAUDE.md' && // Already read as identity
      p !== 'LOG.md' &&    // Already extracted separately
      p !== 'AGENT.md' &&  // Not relevant for context
      p !== `Journal/${CONTEXT_NOTE_PATH}` // Already read as primary
    );

    console.log(`  📂 ${meaningful.length} files modified in last 48h`);

    for (const filePath of meaningful.slice(0, 15)) { // Cap at 15 files
      const content = await safeRead(join(MYLIFEOS_DIR, filePath));
      if (content && content.length < 20000) { // Skip huge files
        files.push({ path: filePath, content });
      }
    }
  } catch {
    console.log('  📂 Could not check recent modifications (git log failed)');
  }

  return files;
}

/**
 * When context-note.md exists, format it directly with supplementary data.
 * Saves an API call when the note is sufficient on its own.
 */
function formatDirectContext(content) {
  const parts = [
    `<!-- PRISM Life Context — ${new Date().toISOString()} -->`,
    `<!-- Source: context-note.md (human-written) -->`,
    '',
    '# Julien — Life Context (Human-written)',
    '',
    content.contextNote,
  ];

  if (content.identity) {
    // Append a condensed identity section
    parts.push('', '---', '', '# Stable Identity (from CLAUDE.md)', '');
    // Only take the first ~2000 chars of CLAUDE.md (the about section)
    parts.push(content.identity.substring(0, 2000));
  }

  return parts.join('\n');
}

/**
 * Full Claude synthesis — used when there's no context note,
 * or when we need to merge the note with recent activity.
 */
async function synthesizeContext(content) {
  const promptParts = [];

  promptParts.push(`You are building a life context snapshot for PRISM, Julien's personal AI research system.`);
  promptParts.push(`Today's date: ${new Date().toISOString().split('T')[0]}`);
  promptParts.push('');

  if (content.contextNote) {
    promptParts.push('===== JULIEN\'S OWN WORDS (HIGHEST PRIORITY — this is what he told you directly) =====');
    promptParts.push(content.contextNote);
    promptParts.push('');
    promptParts.push('The above is Julien\'s own description of where he is. TRUST IT ABOVE ALL ELSE.');
    promptParts.push('Below is supplementary data to enrich the snapshot. Use it to add details, not to contradict his words.');
    promptParts.push('');
  }

  if (content.logContent) {
    promptParts.push('===== ACTIVITY LOG (last 3 days — what actually happened) =====');
    promptParts.push(content.logContent);
    promptParts.push('');
  }

  if (content.recentFiles.length > 0) {
    promptParts.push('===== RECENTLY MODIFIED FILES (last 48h — what he\'s been working on) =====');
    for (const f of content.recentFiles) {
      promptParts.push(`--- ${f.path} ---`);
      promptParts.push(f.content.substring(0, 5000)); // Cap per file
      promptParts.push('');
    }
  }

  if (content.identity) {
    promptParts.push('===== STABLE IDENTITY (from CLAUDE.md — background info, lower priority than recent activity) =====');
    promptParts.push(content.identity);
    promptParts.push('');
  }

  promptParts.push(`
Write a LIFE CONTEXT SNAPSHOT. This will be read by an AI analyst to personalize an intelligence briefing.

PRIORITY RULES:
1. Context note (Julien's own words) = ground truth. Never contradict it.
2. LOG.md last 3 days = what actually happened. More reliable than STATUS files.
3. Recently modified files = what he's actively working on RIGHT NOW.
4. CLAUDE.md = stable background. Use for identity, not for current state.

STRUCTURE:
1. **Right now** — What Julien is doing TODAY. Current focus, energy, mood if known. (2-3 sentences)
2. **This week** — Active projects and their real status. What's moving, what's stuck. (bullet points OK)
3. **Priorities & struggles** — What he said matters most. What's hard. What he's avoiding.
4. **Business** — Chez Julien, Operation Autonomy, Henry, team. Only if relevant this week.
5. **Tools & stack** — What he's using right now (models, platforms, machines).
6. **Life** — Lucia, health, energy, key upcoming dates. Only what's relevant.

RULES:
- Be SPECIFIC. Names, dates, numbers, project names.
- RECENCY > COMPLETENESS. Skip old projects that haven't been touched.
- Under 1500 words. Dense. No fluff.
- Third person ("Julien is...").
- This is for an AI reader. Optimize for machine consumption.`);

  const prompt = promptParts.join('\n');

  console.log(`  🤖 Synthesizing with ${MODELS.analyzer}...`);
  console.log(`     Input: ~${(prompt.length / 4).toLocaleString()} tokens estimated`);

  const response = await client.messages.create({
    model: MODELS.analyzer,
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  });

  const output = response.content[0].text.trim();

  console.log(`     Tokens: ${response.usage.input_tokens.toLocaleString()} in / ${response.usage.output_tokens.toLocaleString()} out`);

  const header = [
    `<!-- PRISM Life Context — Auto-generated ${new Date().toISOString()} -->`,
    `<!-- Source: ${content.contextNote ? 'context-note.md + ' : ''}LOG (${LOG_DAYS}d) + ${content.recentFiles.length} recent files -->`,
    `<!-- Model: ${MODELS.analyzer} -->`,
    '',
  ].join('\n');

  return header + output;
}

/**
 * Safely read a file, returning null if it doesn't exist.
 */
async function safeRead(filePath) {
  try {
    const content = await readFile(filePath, 'utf-8');
    return content.trim() || null;
  } catch {
    return null;
  }
}
