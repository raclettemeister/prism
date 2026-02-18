#!/usr/bin/env node
// ============================================================
// PRISM v3.0 — Personal Research Intelligence System (Mine)
//
// Pipeline: context → deepdive → collect → score → read →
//           research (THE BIG CALL) → validate → deliver
// ============================================================

import generateContext from './context.js';
import deepdive from './deepdive.js';
import collect from './collect.js';
import score from './score.js';
import read from './read.js';
import research from './research.js';
import validate from './validate.js';
import deliver from './deliver.js';

const isDryRun = process.argv.includes('--dry-run');

async function main() {
  const startTime = Date.now();

  console.log('═══════════════════════════════════════════════');
  console.log('  PRISM v3.0 — Personal Research Intelligence');
  console.log(`  ${new Date().toISOString()}`);
  console.log('═══════════════════════════════════════════════');

  let totalInputTokens = 0;
  let totalOutputTokens = 0;

  try {
    // ── Step 0: Generate Life Context ───────────────────
    const contextResult = await generateContext();

    // ── Step 0b: Deep dives (if requested) ──────────────
    const deepDiveReport = await deepdive();

    // ── Step 1: Collect ─────────────────────────────────
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

    // ── Step 2: Score (batch Sonnet) ─────────────────────
    const { all: scoredAll, tokens: scoreTokens } = await score(articles);
    totalInputTokens += scoreTokens.input;
    totalOutputTokens += scoreTokens.output;

    // ── Step 3: Read (select top 80, fetch full text) ────
    const articlesToAnalyze = await read(scoredAll);
    if (articlesToAnalyze.length === 0) {
      console.log('\n⚠️ No articles to analyze. Exiting.');
      process.exit(1);
    }

    console.log('\n📋 Top articles going to THE BIG CALL:');
    articlesToAnalyze.slice(0, 10).forEach((a, i) => {
      console.log(`  ${i + 1}. [${a.score}/10] [${a.source}] ${a.title}${a.fullTextAvailable ? ' ✓' : ''}`);
    });
    if (articlesToAnalyze.length > 10) {
      console.log(`  ... and ${articlesToAnalyze.length - 10} more`);
    }

    // ── Step 4: THE BIG CALL (research + synthesis) ──────
    const { briefing, filepath, tokens: researchTokens, webSearches } = await research(articlesToAnalyze, deepDiveReport);
    totalInputTokens += researchTokens.input_tokens;
    totalOutputTokens += researchTokens.output_tokens;

    // ── Step 5: Validate ────────────────────────────────
    const { confidence, briefing: validatedBriefing, tokens: valTokens } = await validate(briefing);
    totalInputTokens += valTokens.input_tokens;
    totalOutputTokens += valTokens.output_tokens;

    // ── Step 6: Deliver ─────────────────────────────────
    const finalStats = {
      articlesScored: articles.length,
      articlesAnalyzed: articlesToAnalyze.length,
      totalTokens: totalInputTokens + totalOutputTokens,
      estimatedCost: estimateCost(totalInputTokens, totalOutputTokens),
      confidence,
      webSearches: webSearches || 0,
    };
    const emailResult = await deliver(validatedBriefing, finalStats);

    // ── Done ────────────────────────────────────────────
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const finalCost = estimateCost(totalInputTokens, totalOutputTokens);

    console.log('\n═══════════════════════════════════════════════');
    console.log('  PRISM v3.0 RUN COMPLETE');
    console.log('═══════════════════════════════════════════════');
    console.log(`  Context:    ${contextResult.generated ? '✅ Fresh (' + contextResult.filesRead + ' files)' : '⏭️  ' + contextResult.reason}`);
    console.log(`  Briefing:   ${filepath}`);
    console.log(`  Email:      ${emailResult.sent ? '✅ Sent' : '❌ ' + emailResult.reason}`);
    console.log(`  Confidence: ${(confidence * 100).toFixed(0)}%`);
    console.log(`  Articles:   ${articles.length} collected → ${articlesToAnalyze.length} read → THE BIG CALL`);
    console.log(`  Web search: ${webSearches || 0} searches`);
    console.log(`  Tokens:     ${totalInputTokens.toLocaleString()} in / ${totalOutputTokens.toLocaleString()} out`);
    console.log(`  Cost:       ~$${finalCost}`);
    console.log(`  Time:       ${elapsed}s`);
    console.log('═══════════════════════════════════════════════\n');

  } catch (err) {
    console.error('\n💥 PRISM ERROR:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

/**
 * v3.0 cost estimate: ALL Sonnet 4.6 ($3/$15 per MTok) + web search ($10/1K searches)
 */
function estimateCost(inputTokens, outputTokens) {
  const cost = (inputTokens / 1_000_000) * 3 + (outputTokens / 1_000_000) * 15;
  return cost.toFixed(2);
}

main();
