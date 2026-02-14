// ============================================================
// PRISM Context Generator — Reads MylifeOS, writes life-context.md
//
// Runs as the first step of every PRISM pipeline.
// Clones the private MylifeOS repo from GitHub, reads key files,
// sends them to Claude for synthesis into a life-context snapshot.
// ============================================================

import { readFile, writeFile, readdir, stat, mkdir } from 'fs/promises';
import { join, relative } from 'path';
import { execSync } from 'child_process';
import Anthropic from '@anthropic-ai/sdk';
import { MODELS, LIFE_CONTEXT_FILE } from './config.js';

const client = new Anthropic();

// Where we clone MylifeOS temporarily
const MYLIFEOS_DIR = '/tmp/mylifeos';

// Files to ALWAYS read (core identity)
const CORE_FILES = [
  'CLAUDE.md',
  'AGENT.md',
  'LOG.md',
  'System/Values.md',
  'System/Disciplines.md',
  'System/Strategy Guide.md',
  'System/Personal Strategy.md',
  'Business/Operation Autonomy.md',
  'Business/README.md',
  'Projects/README.md',
];

// Directories to scan for STATUS.md / README.md files
const PROJECT_DIRS = ['Projects'];

// How many recent journal entries to include
const JOURNAL_DAILY_COUNT = 5;
const JOURNAL_WEEKLY_COUNT = 2;

/**
 * Generate a fresh life-context.md from the live MylifeOS vault.
 *
 * 1. Clone/pull MylifeOS from GitHub
 * 2. Read core files + recent journals + project statuses
 * 3. Send to Claude for synthesis
 * 4. Write data/life-context.md
 */
export default async function generateContext() {
  console.log('\n🧬 CONTEXT GENERATOR — Building fresh life context...');

  const repoUrl = process.env.MYLIFEOS_REPO;
  if (!repoUrl) {
    console.log('  ⚠️ No MYLIFEOS_REPO set — using existing life-context.md');
    return { generated: false, reason: 'no repo URL' };
  }

  const startTime = Date.now();

  try {
    // Step 1: Clone the repo
    await cloneRepo(repoUrl);

    // Step 2: Gather all relevant content
    const content = await gatherContent();

    if (content.totalChars === 0) {
      console.log('  ⚠️ No content gathered from MylifeOS — keeping existing context');
      return { generated: false, reason: 'no content found' };
    }

    console.log(`  📚 Gathered ${content.files.length} files (${(content.totalChars / 1024).toFixed(1)}KB)`);

    // Step 3: Synthesize with Claude
    const lifeContext = await synthesizeContext(content);

    // Step 4: Write to file
    await mkdir('data', { recursive: true });
    await writeFile(LIFE_CONTEXT_FILE, lifeContext, 'utf-8');

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`  ✅ Life context generated (${lifeContext.length} chars) in ${elapsed}s`);

    return {
      generated: true,
      filesRead: content.files.length,
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
 * Clone the MylifeOS repo. Uses a GitHub PAT if available.
 */
async function cloneRepo(repoUrl) {
  console.log('  📥 Cloning MylifeOS...');

  // Build authenticated URL if PAT is available
  let authUrl = repoUrl;
  const pat = process.env.MYLIFEOS_PAT;
  if (pat && repoUrl.startsWith('https://')) {
    // Insert PAT into URL: https://TOKEN@github.com/user/repo.git
    authUrl = repoUrl.replace('https://', `https://${pat}@`);
  }

  try {
    // Clean previous clone
    execSync(`rm -rf ${MYLIFEOS_DIR}`, { stdio: 'pipe' });

    // Shallow clone (only latest commit, saves time)
    execSync(`git clone --depth 1 --single-branch ${authUrl} ${MYLIFEOS_DIR}`, {
      stdio: 'pipe',
      timeout: 60000, // 60s timeout
    });

    console.log('  ✅ MylifeOS cloned');
  } catch (err) {
    throw new Error(`Git clone failed: ${err.stderr?.toString()?.trim() || err.message}`);
  }
}

/**
 * Read all relevant files from the cloned MylifeOS.
 * Returns structured content organized by category.
 */
async function gatherContent() {
  const files = [];
  let totalChars = 0;

  // 1. Core files
  for (const filePath of CORE_FILES) {
    const content = await safeRead(join(MYLIFEOS_DIR, filePath));
    if (content) {
      files.push({ path: filePath, content, category: 'core' });
      totalChars += content.length;
    }
  }

  // 2. Project STATUS.md files
  for (const dir of PROJECT_DIRS) {
    const projectsPath = join(MYLIFEOS_DIR, dir);
    try {
      const entries = await readdir(projectsPath, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          // Try STATUS.md first, then README.md
          const statusPath = join(projectsPath, entry.name, 'STATUS.md');
          const readmePath = join(projectsPath, entry.name, 'README.md');

          const statusContent = await safeRead(statusPath);
          if (statusContent) {
            files.push({ path: `${dir}/${entry.name}/STATUS.md`, content: statusContent, category: 'project' });
            totalChars += statusContent.length;
          } else {
            const readmeContent = await safeRead(readmePath);
            if (readmeContent) {
              files.push({ path: `${dir}/${entry.name}/README.md`, content: readmeContent, category: 'project' });
              totalChars += readmeContent.length;
            }
          }
        }
      }
    } catch { /* directory doesn't exist */ }
  }

  // 3. Recent daily journal entries (latest N)
  const dailyDir = join(MYLIFEOS_DIR, 'Journal/Daily');
  try {
    const dailyEntries = (await readdir(dailyDir))
      .filter(f => f.endsWith('.md'))
      .sort()
      .reverse()
      .slice(0, JOURNAL_DAILY_COUNT);

    for (const entry of dailyEntries) {
      const content = await safeRead(join(dailyDir, entry));
      if (content) {
        files.push({ path: `Journal/Daily/${entry}`, content, category: 'journal-daily' });
        totalChars += content.length;
      }
    }
  } catch { /* no daily entries */ }

  // 4. Recent weekly plans (latest N)
  const weeklyDir = join(MYLIFEOS_DIR, 'Journal/Weekly');
  try {
    const weeklyEntries = (await readdir(weeklyDir))
      .filter(f => f.endsWith('.md'))
      .sort()
      .reverse()
      .slice(0, JOURNAL_WEEKLY_COUNT);

    for (const entry of weeklyEntries) {
      const content = await safeRead(join(weeklyDir, entry));
      if (content) {
        files.push({ path: `Journal/Weekly/${entry}`, content, category: 'journal-weekly' });
        totalChars += content.length;
      }
    }
  } catch { /* no weekly entries */ }

  // 5. Business team files
  const teamDir = join(MYLIFEOS_DIR, 'Business/Team');
  try {
    const teamEntries = await readdir(teamDir);
    for (const entry of teamEntries) {
      if (entry.endsWith('.md')) {
        const content = await safeRead(join(teamDir, entry));
        if (content) {
          files.push({ path: `Business/Team/${entry}`, content, category: 'business' });
          totalChars += content.length;
        }
      }
    }
  } catch { /* no team files */ }

  // 6. The Big Meeting (if it exists)
  const meetingDir = join(MYLIFEOS_DIR, 'Business/The Big Meeting');
  try {
    const meetingEntries = await readdir(meetingDir);
    for (const entry of meetingEntries) {
      if (entry.endsWith('.md')) {
        const content = await safeRead(join(meetingDir, entry));
        if (content) {
          files.push({ path: `Business/The Big Meeting/${entry}`, content, category: 'business' });
          totalChars += content.length;
        }
      }
    }
  } catch { /* no meeting files */ }

  // 7. Personal — key files only
  const personalFiles = ['Personal/Health', 'Personal/Lucia', 'Personal/Holidays'];
  for (const dir of personalFiles) {
    const fullDir = join(MYLIFEOS_DIR, dir);
    try {
      const entries = await readdir(fullDir);
      for (const entry of entries) {
        if (entry.endsWith('.md')) {
          const content = await safeRead(join(fullDir, entry));
          if (content) {
            files.push({ path: `${dir}/${entry}`, content, category: 'personal' });
            totalChars += content.length;
          }
        }
      }
    } catch { /* skip */ }
  }

  return { files, totalChars };
}

/**
 * Send gathered content to Claude for life context synthesis.
 */
async function synthesizeContext(content) {
  // Organize content into a structured prompt
  const sections = {};
  for (const file of content.files) {
    if (!sections[file.category]) sections[file.category] = [];
    sections[file.category].push(`===== ${file.path} =====\n${file.content}`);
  }

  const allContent = Object.entries(sections)
    .map(([category, items]) => {
      const label = {
        'core': '🏠 CORE IDENTITY & SYSTEM',
        'project': '🚀 ACTIVE PROJECTS',
        'journal-daily': '📅 RECENT DAILY JOURNAL',
        'journal-weekly': '📋 RECENT WEEKLY PLANS',
        'business': '💼 BUSINESS',
        'personal': '❤️ PERSONAL',
      }[category] || category.toUpperCase();

      return `\n${'='.repeat(60)}\n${label}\n${'='.repeat(60)}\n\n${items.join('\n\n')}`;
    })
    .join('\n');

  const prompt = `You are a context synthesizer for PRISM (Personal Research Intelligence System Mine).

You've been given the complete contents of Julien's personal knowledge base (MylifeOS). Your job is to produce a LIFE CONTEXT SNAPSHOT — a single document that tells an AI analyst everything it needs to know about Julien RIGHT NOW to personalize intelligence briefings.

The snapshot should cover:

1. **Who he is** — identity, values, roles, how he thinks (brief — 2-3 sentences)
2. **Current season** — what phase of life/work he's in, the dominant tension or theme
3. **Active projects** — every project with its current status, priority, and what's happening THIS WEEK
4. **Business status** — Chez Julien, Operation Autonomy, Henry's development, team situation
5. **Tech stack & tools** — what he's using RIGHT NOW (models, tools, platforms, machines)
6. **Current challenges** — what's hard, what's stuck, what needs attention
7. **Learning focus** — what he's actively learning or exploring
8. **Relationships & life** — Lucia, key dates, personal priorities
9. **Budget stance** — spending approach for AI/tools
10. **Key dates coming up** — anything in the next 2-4 weeks

RULES:
- Be SPECIFIC. Use names, dates, numbers, project names. No vague statements.
- Prioritize RECENCY. If the journal says something different from CLAUDE.md, the journal is more current.
- Include emotional/energy state if visible from journal entries.
- Keep it under 3000 words — dense, no fluff.
- Write in third person ("Julien is..." not "You are...").
- Use present tense.
- This document is READ BY AN AI, not by Julien. Optimize for machine consumption.

Today's date: ${new Date().toISOString().split('T')[0]}

===== MYLIFEOS CONTENTS =====
${allContent}`;

  console.log(`  🤖 Synthesizing with ${MODELS.analyzer}...`);
  console.log(`     Input: ~${(prompt.length / 4).toLocaleString()} tokens estimated`);

  const response = await client.messages.create({
    model: MODELS.analyzer,
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  });

  const output = response.content[0].text.trim();

  console.log(`     Tokens: ${response.usage.input_tokens.toLocaleString()} in / ${response.usage.output_tokens.toLocaleString()} out`);

  // Add metadata header
  const header = [
    `<!-- PRISM Life Context — Auto-generated ${new Date().toISOString()} -->`,
    `<!-- Source: MylifeOS (${content.files.length} files, ${(content.totalChars / 1024).toFixed(1)}KB) -->`,
    `<!-- Model: ${MODELS.analyzer} -->`,
    '',
  ].join('\n');

  return header + output;
}

/**
 * Safely read a file, returning null if it doesn't exist or can't be read.
 */
async function safeRead(filePath) {
  try {
    const content = await readFile(filePath, 'utf-8');
    return content.trim() || null;
  } catch {
    return null;
  }
}
