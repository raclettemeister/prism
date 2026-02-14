#!/usr/bin/env node
// ============================================================
// PRISM — Personal Research Intelligence System (Mine)
//
// Entry point. Orchestrates the full pipeline:
// context → deepdive → collect → score → read → analyze → synthesize → deliver
//
// Run: node src/index.js
// Dry run (collect only): node src/index.js --dry-run
// ============================================================

import generateContext from './context.js';
import deepdive from './deepdive.js';
import collect from './collect.js';
import score from './score.js';
import read from './read.js';
import analyze from './analyze.js';
import synthesize from './synthesize.js';
import deliver from './deliver.js';

const isDryRun = process.argv.includes('--dry-run');

async function main() {
  const startTime = Date.now();

  console.log('═══════════════════════════════════════════════');
  console.log('  PRISM v1.0 — Personal Research Intelligence');
  console.log(`  ${new Date().toISOString()}`);
  console.log('═══════════════════════════════════════════════');

  // Track total token usage
  let totalInputTokens = 0;
  let totalOutputTokens = 0;

  try {
    // ── Step 0: Generate Life Context ───────────────────
    const contextResult = await generateContext();

    // ── Step 0b: Deep dives (if requested in life-context) ─
    const deepDiveReport = await deepdive();

    // ── Step 1: Collect ──────────────────────────────────
    const articles = await collect();

    if (articles.length === 0) {
      console.log('\n⚠️ No articles collected. Check feed URLs and connectivity.');
      process.exit(1);
    }

    if (isDryRun) {
      console.log('\n🏁 DRY RUN — Collected articles:');
      articles.slice(0, 10).forEach((a, i) => {
        console.log(`  ${i + 1}. [${a.source}] ${a.title}`);
      });
      console.log(`\n  Total: ${articles.length} articles. Exiting (dry run).`);
      process.exit(0);
    }

    // ── Step 2: Score ────────────────────────────────────
    const { all: scoredAll, tokens: scoreTokens } = await score(articles);
    totalInputTokens += scoreTokens.input;
    totalOutputTokens += scoreTokens.output;

    // ── Step 3: Read (select top 15 with diversity, fetch full text) ───
    const articlesToAnalyze = await read(scoredAll);
    if (articlesToAnalyze.length === 0) {
      console.log('\n⚠️ No articles to analyze (none scored above 3). Exiting.');
      process.exit(1);
    }

    console.log('\n📋 Top articles going to analysis:');
    articlesToAnalyze.forEach((a, i) => {
      console.log(`  ${i + 1}. [${a.score}/10] [${a.source}] ${a.title}${a.fullTextAvailable ? ' ✓ full text' : ''}`);
      console.log(`     ${a.reason}`);
    });

    // ── Step 4: Analyze ──────────────────────────────────
    const { analysis, tokens: analyzeTokens } = await analyze(articlesToAnalyze);
    totalInputTokens += analyzeTokens.input_tokens;
    totalOutputTokens += analyzeTokens.output_tokens;

    // ── Step 5: Synthesize ───────────────────────────────
    const stats = {
      articlesScored: articles.length,
      articlesAnalyzed: articlesToAnalyze.length,
      totalTokens: totalInputTokens + totalOutputTokens,
      estimatedCost: estimateCost(totalInputTokens, totalOutputTokens),
    };

    const { briefing, filepath, tokens: synthTokens } = await synthesize(analysis, stats, deepDiveReport);
    totalInputTokens += synthTokens.input_tokens;
    totalOutputTokens += synthTokens.output_tokens;

    // ── Step 6: Deliver ──────────────────────────────────
    const finalStats = {
      ...stats,
      totalTokens: totalInputTokens + totalOutputTokens,
      estimatedCost: estimateCost(totalInputTokens, totalOutputTokens),
    };
    const emailResult = await deliver(briefing, finalStats);

    // ── Done ─────────────────────────────────────────────
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const finalCost = estimateCost(totalInputTokens, totalOutputTokens);

    console.log('\n═══════════════════════════════════════════════');
    console.log('  PRISM RUN COMPLETE');
    console.log('═══════════════════════════════════════════════');
    console.log(`  Context:  ${contextResult.generated ? '✅ Fresh (' + contextResult.filesRead + ' files)' : '⏭️  ' + contextResult.reason}`);
    console.log(`  Briefing: ${filepath}`);
    console.log(`  Email:    ${emailResult.sent ? '✅ Sent' : '❌ ' + emailResult.reason}`);
    console.log(`  Articles: ${articles.length} collected → ${articlesToAnalyze.length} analyzed`);
    console.log(`  Tokens:   ${totalInputTokens.toLocaleString()} in / ${totalOutputTokens.toLocaleString()} out`);
    console.log(`  Cost:     ~$${finalCost}`);
    console.log(`  Time:     ${elapsed}s`);
    console.log('═══════════════════════════════════════════════\n');

  } catch (err) {
    console.error('\n💥 PRISM ERROR:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

/**
 * Rough cost estimate based on current Anthropic pricing.
 * Haiku: $1/$5 per MTok | Sonnet: $3/$15 per MTok
 * This is approximate — actual billing depends on model mix.
 */
function estimateCost(inputTokens, outputTokens) {
  // Weighted average assuming ~60% Haiku (scoring), ~40% Sonnet (analysis + synthesis)
  const avgInputCost = 0.6 * 1 + 0.4 * 3; // $1.8 per MTok
  const avgOutputCost = 0.6 * 5 + 0.4 * 15; // $9 per MTok

  const cost = (inputTokens / 1_000_000) * avgInputCost + (outputTokens / 1_000_000) * avgOutputCost;
  return cost.toFixed(2);
}

main();
