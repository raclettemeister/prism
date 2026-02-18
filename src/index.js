#!/usr/bin/env node
// ============================================================
// PRISM v2.0 — Personal Research Intelligence System (Mine)
//
// Pipeline: context → deepdive → collect → score → read →
//           analyzeIndividual → analyzeCross → synthesize → validate → deliver
// ============================================================

import generateContext from './context.js';
import deepdive from './deepdive.js';
import collect from './collect.js';
import score from './score.js';
import read from './read.js';
import analyzeIndividual from './analyze-individual.js';
import analyze from './analyze.js';
import synthesize from './synthesize.js';
import validate from './validate.js';
import deliver from './deliver.js';

const isDryRun = process.argv.includes('--dry-run');

async function main() {
  const startTime = Date.now();

  console.log('═══════════════════════════════════════════════');
  console.log('  PRISM v2.0 — Personal Research Intelligence');
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

    // ── Step 2: Score ───────────────────────────────────
    const { all: scoredAll, tokens: scoreTokens } = await score(articles);
    totalInputTokens += scoreTokens.input;
    totalOutputTokens += scoreTokens.output;

    // ── Step 3: Read (select top 50, fetch full text) ───
    const articlesToAnalyze = await read(scoredAll);
    if (articlesToAnalyze.length === 0) {
      console.log('\n⚠️ No articles to analyze. Exiting.');
      process.exit(1);
    }

    console.log('\n📋 Top articles going to analysis:');
    articlesToAnalyze.slice(0, 10).forEach((a, i) => {
      console.log(`  ${i + 1}. [${a.score}/10] [${a.source}] ${a.title}${a.fullTextAvailable ? ' ✓' : ''}`);
    });
    if (articlesToAnalyze.length > 10) {
      console.log(`  ... and ${articlesToAnalyze.length - 10} more`);
    }

    // ── Step 4a: Individual Analysis (Haiku per article) ─
    const { articles: individuallyAnalyzed, tokens: indivTokens } = await analyzeIndividual(articlesToAnalyze);
    totalInputTokens += indivTokens.input;
    totalOutputTokens += indivTokens.output;

    // ── Step 4b: Cross-Reference Analysis (Sonnet) ──────
    const { analysis, tokens: analyzeTokens } = await analyze(individuallyAnalyzed);
    totalInputTokens += analyzeTokens.input_tokens;
    totalOutputTokens += analyzeTokens.output_tokens;

    // ── Step 5: Synthesize ──────────────────────────────
    const stats = {
      articlesScored: articles.length,
      articlesAnalyzed: articlesToAnalyze.length,
      totalTokens: totalInputTokens + totalOutputTokens,
      estimatedCost: estimateCost(totalInputTokens, totalOutputTokens),
    };

    const { briefing, filepath, tokens: synthTokens } = await synthesize(analysis, stats, deepDiveReport, individuallyAnalyzed);
    totalInputTokens += synthTokens.input_tokens;
    totalOutputTokens += synthTokens.output_tokens;

    // ── Step 6: Validate ────────────────────────────────
    const { confidence, briefing: validatedBriefing, tokens: valTokens } = await validate(briefing, analysis);
    totalInputTokens += valTokens.input_tokens;
    totalOutputTokens += valTokens.output_tokens;

    // ── Step 7: Deliver ─────────────────────────────────
    const finalStats = {
      ...stats,
      totalTokens: totalInputTokens + totalOutputTokens,
      estimatedCost: estimateCost(totalInputTokens, totalOutputTokens),
      confidence,
    };
    const emailResult = await deliver(validatedBriefing, finalStats);

    // ── Done ────────────────────────────────────────────
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const finalCost = estimateCost(totalInputTokens, totalOutputTokens);

    console.log('\n═══════════════════════════════════════════════');
    console.log('  PRISM v2.0 RUN COMPLETE');
    console.log('═══════════════════════════════════════════════');
    console.log(`  Context:    ${contextResult.generated ? '✅ Fresh (' + contextResult.filesRead + ' files)' : '⏭️  ' + contextResult.reason}`);
    console.log(`  Briefing:   ${filepath}`);
    console.log(`  Email:      ${emailResult.sent ? '✅ Sent' : '❌ ' + emailResult.reason}`);
    console.log(`  Confidence: ${(confidence * 100).toFixed(0)}%`);
    console.log(`  Articles:   ${articles.length} collected → ${articlesToAnalyze.length} read → analyzed`);
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
 * v2.0 cost estimate: ~50% Haiku (scoring + individual analysis + validation), ~50% Sonnet (cross-ref + synthesis + context)
 * Haiku: $1/$5 per MTok | Sonnet: $3/$15 per MTok
 */
function estimateCost(inputTokens, outputTokens) {
  const avgInputCost = 0.5 * 1 + 0.5 * 3; // $2 per MTok
  const avgOutputCost = 0.5 * 5 + 0.5 * 15; // $10 per MTok
  const cost = (inputTokens / 1_000_000) * avgInputCost + (outputTokens / 1_000_000) * avgOutputCost;
  return cost.toFixed(2);
}

main();
