#!/usr/bin/env node
// ============================================================
// PRISM v4.0 — Personal Research Intelligence System
//
// Pipeline: context → deepdive → collect →
//           [classify ∥ webintel] → read →
//           synthesize (A∥B) → validate → page → deliver
//
// v4.0 changes vs v3.3:
//   - classify.js replaces score.js (Trust Tier system)
//   - webintel.js runs in parallel with classify (proactive web intel)
//   - synthesize.js replaces research.js (parallel A+B calls)
//   - page.js generates HTML briefing with feedback UI
//   - Total runtime target: 11-21 min (was 22-40 min in v3.3)
// ============================================================

import generateContext from './context.js';
import deepdive from './deepdive.js';
import collect from './collect.js';
import classify from './classify.js';
import webintel from './webintel.js';
import read from './read.js';
import synthesize from './synthesize.js';
import validate from './validate.js';
import generatePage from './page.js';
import deliver from './deliver.js';
import { format } from 'date-fns';

const isDryRun = process.argv.includes('--dry-run');

async function main() {
  const startTime = Date.now();

  console.log('═══════════════════════════════════════════════');
  console.log('  PRISM v4.0 — Personal Research Intelligence');
  console.log(`  ${new Date().toISOString()}`);
  console.log('═══════════════════════════════════════════════');

  let totalInputTokens = 0;
  let totalOutputTokens = 0;

  try {
    // ── Step 0: Generate Life Context ───────────────────────
    const contextResult = await generateContext();

    // ── Step 0b: Deep dives (if requested) ──────────────────
    const deepDiveReport = await deepdive();

    // ── Step 1: Collect ─────────────────────────────────────
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

    // ── Steps 2+3: Classify + WebIntel (PARALLEL) ────────────
    // Trust Tier classification and proactive web intelligence run concurrently.
    // classify.js assigns tiers — Tier 1 expert sources bypass scoring entirely.
    // webintel.js generates and executes targeted searches before synthesis.
    console.log('\n⚡ Running classify + webintel in parallel...');

    const [classified, webIntelContent] = await Promise.all([
      classify(articles),
      webintel(),
    ]);

    totalInputTokens += classified.tokens.input;
    totalOutputTokens += classified.tokens.output;

    const { tier1, tier2, tier3 } = classified;
    console.log(`\n  Tier summary: T1=${tier1.length} T2=${tier2.length} T3=${tier3.length}`);

    // ── Step 4: Read (select 30, fetch full text) ─────────────
    const articlesToAnalyze = await read(classified, 30);
    if (articlesToAnalyze.length === 0) {
      console.log('\n⚠️ No articles to analyze. Exiting.');
      process.exit(1);
    }

    const t1Read = articlesToAnalyze.filter(a => a.tier === 1).length;
    const t2Read = articlesToAnalyze.filter(a => a.tier === 2).length;
    const t3Read = articlesToAnalyze.filter(a => a.tier === 3).length;

    console.log(`\n📋 Articles going to synthesis (${articlesToAnalyze.length} total — T1:${t1Read} T2:${t2Read} T3:${t3Read}):`);
    articlesToAnalyze.slice(0, 8).forEach((a, i) => {
      const tier = a.tier ? `T${a.tier}` : '--';
      console.log(`  ${i + 1}. [${tier}] [${a.score}/10] [${a.source}] ${a.title.substring(0, 70)}${a.fullTextAvailable ? ' ✓' : ''}`);
    });
    if (articlesToAnalyze.length > 8) {
      console.log(`  ... and ${articlesToAnalyze.length - 8} more`);
    }

    // ── Step 5: Synthesize (Call A ∥ Call B) ──────────────────
    // Call A (Builder Intelligence) + Call B (World Context) run in parallel.
    const { briefing, filepath, tokens: synthTokens, webSearches } = await synthesize(
      articlesToAnalyze,
      classified,
      deepDiveReport
    );
    totalInputTokens += synthTokens.input_tokens;
    totalOutputTokens += synthTokens.output_tokens;

    // ── Step 6: Validate ─────────────────────────────────────
    const { confidence, briefing: validatedBriefing, tokens: valTokens } = await validate(briefing);
    totalInputTokens += valTokens.input_tokens;
    totalOutputTokens += valTokens.output_tokens;

    // ── Step 7: Generate HTML page ───────────────────────────
    const today = format(new Date(), 'yyyy-MM-dd');
    const pageFilepath = await generatePage(validatedBriefing, today, articlesToAnalyze.length);

    // ── Step 8: Deliver ──────────────────────────────────────
    const finalStats = {
      articlesScored: articles.length,
      articlesAnalyzed: articlesToAnalyze.length,
      tier1Count: t1Read,
      tier2Count: t2Read,
      tier3Count: t3Read,
      totalTokens: totalInputTokens + totalOutputTokens,
      estimatedCost: estimateCost(totalInputTokens, totalOutputTokens),
      confidence,
      webSearches: webSearches || 0,
    };
    const emailResult = await deliver(validatedBriefing, finalStats);

    // ── Done ─────────────────────────────────────────────────
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const finalCost = estimateCost(totalInputTokens, totalOutputTokens);
    const portalBase = process.env.PRISM_PORTAL_URL || '';
    const liveUrl = portalBase ? `${portalBase}/briefings/${today}.html` : pageFilepath;

    console.log('\n═══════════════════════════════════════════════');
    console.log('  PRISM v4.0 RUN COMPLETE');
    console.log('═══════════════════════════════════════════════');
    console.log(`  Context:      ${contextResult.generated ? '✅ Fresh (' + contextResult.filesRead + ' files)' : '⏭️  ' + contextResult.reason}`);
    console.log(`  Briefing:     ${filepath}`);
    console.log(`  Live page:    ${liveUrl}`);
    console.log(`  Email:        ${emailResult.sent ? '✅ Sent' : '❌ ' + emailResult.reason}`);
    console.log(`  Confidence:   ${(confidence * 100).toFixed(0)}%`);
    console.log(`  Articles:     ${articles.length} collected → T1:${t1Read} T2:${t2Read} T3:${t3Read} → ${articlesToAnalyze.length} read`);
    console.log(`  Web searches: ${webSearches || 0} (webintel) + synthesis`);
    console.log(`  Tokens:       ${totalInputTokens.toLocaleString()} in / ${totalOutputTokens.toLocaleString()} out`);
    console.log(`  Cost:         ~$${finalCost}`);
    console.log(`  Time:         ${elapsed}s`);
    console.log('═══════════════════════════════════════════════\n');

    // Diagnostic: log open handles/requests that would otherwise prevent exit
    const handles = process._getActiveHandles?.()?.length ?? '?';
    const requests = process._getActiveRequests?.()?.length ?? '?';
    if (handles > 0 || requests > 0) {
      console.log(`  [debug] Forcing exit (${handles} open handles, ${requests} pending requests)`);
    }
    process.exit(0);

  } catch (err) {
    console.error('\n💥 PRISM ERROR:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

/**
 * Cost estimate: All Sonnet 4.6 at $3/$15 per MTok input/output.
 */
function estimateCost(inputTokens, outputTokens) {
  const cost = (inputTokens / 1_000_000) * 3 + (outputTokens / 1_000_000) * 15;
  return cost.toFixed(2);
}

// Catch any unhandled promise rejections from background async operations
// (e.g. lingering SDK connections, feed parsers) that escape the main try-catch.
process.on('unhandledRejection', (err) => {
  console.error('\n💥 UNHANDLED REJECTION:', err?.message || err);
  process.exit(1);
});

main();
