# PRISM

PRISM is Julien's daily research briefing system.

Current version: **v5.0 Daily Core + Rolling Theme Cycle**.

Instead of trying to cover every domain at full depth every morning, PRISM now does two things:

1. keeps oversight across all tracked domains every day
2. goes deep on exactly one rotating theme per run

The four-theme cycle is:

- `dev` — software dev, AI builder workflows, tools, micro-software
- `grassroot` — Grassroot Hopper, cooperative/community/open-source movement, aligned people and funding
- `game` — game dev, creative AI, interactive experiments
- `geo_eu` — geopolitics, EU economics, Brussels/Belgium business and regulatory context

## Daily briefing shape

Every briefing now has exactly 7 sections:

1. `THE SIGNAL`
2. `MUST-READS`
3. `ACTION AUDIT`
4. `CROSS-DOMAIN RADAR`
5. `THEME OF THE DAY`
6. `TODAY'S PRIORITIES`
7. `NEXT 3 DAYS`

This keeps PRISM usable as a morning operating brief instead of a mini-magazine.

## What the pipeline does

1. Generate life context from MylifeOS
2. Run optional deep dives requested in life context
3. Collect RSS feeds
4. Classify articles with trust tiers
5. Run theme-aware web intelligence:
   - one query per domain for oversight
   - two extra queries for today's scheduled theme
6. Read the top article set
7. Synthesize one briefing using the 7-section contract
8. Validate the briefing
9. Deliver a self-contained email digest

Artifacts written by the run:

- `briefings/YYYY-MM-DD.md`
- `data/life-context.md`
- `data/web-intelligence.md`
- `data/memory.json`

## Theme cycle behavior

PRISM stores cycle state in `data/memory.json`:

- `themeCycle.order`
- `themeCycle.nextIndex`
- `themeCycle.lastTheme`
- `themeCycle.lastThemeDate`
- `themeCycle.lastOverrideReason`

Rules:

- the next scheduled theme is always `themeCycle.order[themeCycle.nextIndex]`
- the cycle advances only after a successful run using the scheduled theme
- if a major direct-impact event forces an override, the scheduled theme is deferred, not skipped

## Feedback model

PRISM no longer treats an HTML portal as the learning loop.

The product-improvement loop is now conversational:

- read the morning email / markdown briefing
- paste your review into Cursor or Codex
- update prompts, rules, or code deliberately

Runtime personalization still comes from:

- `data/news-interests.md`
- `data/life-context.md`

## Quick start

```bash
npm install
npm start
```

Run tests:

```bash
npm test
```

Optional dry run:

```bash
npm run test:dry-run
```

## Environment

Required:

- `ANTHROPIC_API_KEY`

Optional:

- `RESEND_API_KEY`
- `MYLIFEOS_REPO`
- `MYLIFEOS_PAT`

PRISM no longer depends on:

- `PRISM_PORTAL_URL`
- `FEEDBACK_WORKER_URL`
- `PRISM_FEEDBACK_SECRET`

## Repo map

- `src/index.js` — orchestrator
- `src/config.js` — feeds, limits, theme config, prompts
- `src/themes.js` — theme cycle and override helpers
- `src/webintel.js` — cross-domain + themed web intelligence
- `src/synthesize.js` — 7-section daily briefing synthesis
- `src/briefing-format.js` — briefing contract assembly and validation helpers
- `src/deliver.js` — self-contained email digest delivery
- `.github/workflows/nightly.yml` — nightly automation

For more implementation detail, see [ARCHITECTURE.md](/Users/julienthibaut/Documents/prism/ARCHITECTURE.md).
