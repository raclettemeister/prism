# PRISM — Architecture

**v4.0 "The Smart Analyst"** — Personal Research Intelligence System

---

## Design Philosophy

v3.3 was a **factory**: collect 400+ articles, score everything blindly, feed 80 into one 20-minute mega-call. It worked, but it threatened the 35-minute GitHub Actions ceiling and treated Dan Shipper the same as a random VentureBeat post until an algorithm decided otherwise.

v4.0 is a **smart analyst**: it knows who to trust, asks targeted questions before sitting down to write, and thinks in parallel.

```
v3.3: COLLECT EVERYTHING → SCORE EVERYTHING → ONE GIANT CALL
v4.0: KNOW WHO TO TRUST → ASK SMART QUESTIONS FIRST → PARALLEL SPECIALIST CALLS
```

---

## Pipeline Overview

```
GitHub Actions (3:00 UTC daily)
│
├── Step 0:  context.js    → Clone MylifeOS → data/life-context.md
├── Step 0b: deepdive.js   → Run deep dives (usually skipped)
├── Step 1:  collect.js    → 100+ RSS feeds → 400-700 raw articles
│
│   ┌──────────────────────────────────┐
├── │ Step 2: classify.js  [PARALLEL]  │ → Tier 1 (always read)
│   │ Step 3: webintel.js  [PARALLEL]  │ → data/web-intelligence.md
│   └──────────────────────────────────┘
│
├── Step 4:  read.js       → Select 30 articles, fetch full text
│
│   ┌──────────────────────────────────────────────┐
├── │ Step 5a: synthesize.js Call A  [PARALLEL]    │ → Builder Intelligence
│   │ Step 5b: synthesize.js Call B  [PARALLEL]    │ → World Context
│   └──────────────────────────────────────────────┘
│
├── Step 6:  synthesize.js → Assemble A+B → briefings/YYYY-MM-DD.md
├── Step 7:  validate.js   → Anti-hallucination check
├── Step 8:  page.js       → Generate briefings/YYYY-MM-DD.html (feedback UI)
└── Step 9:  deliver.js    → Email + live page URL via Resend

[CI] Commit briefings/ + data/ → Cloudflare Pages picks up → live in <1 min
[CI] Push feedback-template.md back to MylifeOS
```

---

## The Three Architectural Shifts

### Shift 1: Trust Tiers (classify.js)

Instead of scoring all 400+ articles, every article is assigned a Trust Tier:

| Tier | Treatment | Who qualifies | Count |
|---|---|---|---|
| **Tier 1: Expert Trusted** | Always read, no scoring | 12 hardcoded expert sources | ~20 articles |
| **Tier 2: Amplified Signal** | Selectively scored | crossFeedCount ≥ 3 OR from HN Best feeds | ~50-80 → top 20 |
| **Tier 3: Long Tail** | Scored only if budget allows | Everything else | top 10 if slots remain |

**Target: ~30 articles for synthesis** (down from 80 in v3.3)

**Tier 1 sources (hardcoded in `TRUST_TIERS`):**
Dan Shipper/Every, Simon Willison, Steve Yegge, Brian Casel, Addy Osmani,
Latent Space, Ethan Mollick, Pragmatic Engineer, The Economist, Adam Tooze, Noah Smith, FT

**Dynamic learning:** `memory.json.sourceRatings` adjusts tier weights over time. A source consistently loved by Julien (avgScore ≥ 4.0, 10+ data points) auto-promotes toward Tier 1. A consistently skipped source demotes toward Tier 3.

### Shift 2: Proactive Web Intelligence (webintel.js)

Runs **in parallel with classify.js**, before synthesis. Two-step process:

1. **Query generation** — Claude reads `life-context.md` + recent briefings, outputs 5-8 targeted search queries as JSON (~30 seconds, no web search needed)
2. **Parallel execution** — All queries run concurrently via `Promise.all()` (~2-3 min)

Results saved to `data/web-intelligence.md`. Both synthesis calls receive this pre-built intelligence. Web search during synthesis becomes **verification only**, not primary research.

### Shift 3: Parallel Specialist Synthesis (synthesize.js)

Two concurrent Claude calls via `Promise.all()` replace THE BIG CALL:

**Call A — Builder Intelligence (critical path)**
- Input: Tier 1 expert articles + web intelligence + life context + memory + feedback
- Output: 🔴 SIGNAL · 📚 MUST-READS · 🧱 BUILDER INTELLIGENCE · ⏪ ACTION AUDIT · 🎯 PRIORITIES
- Budget: 8,000 output tokens | ~4-7 min
- If Call A fails: the run fails. This is the core.

**Call B — World Context (secondary)**
- Input: Tier 2/3 articles + web intelligence + last 3 briefings
- Output: 📊 PIONEER ADVANTAGE · 🛠️ TOOLS · 🏗️ BUILD WATCH · 🌍 WORLD LENS · 🇪🇺 EU TECH · 📈 TRENDS · 🚮 SLOP · 🔄 FEED HEALTH · 💬 FEEDBACK
- Budget: 6,000 output tokens | ~4-7 min
- If Call B fails: Call A sections delivered alone with a note. Graceful degradation.

**Assembly:** sections extracted by header pattern and reordered into canonical section order.

---

## Module Reference

### `src/index.js` — Orchestrator

Runs the 9-step pipeline. Tracks token usage and cost. Handles `--dry-run` flag.

Key behavior:
- Steps 2+3 (classify + webintel) run in parallel via `Promise.all()`
- Steps 5a+5b (Builder + World synthesis) run in parallel inside `synthesize.js`
- Any step can fail without crashing later steps (internal error handling)

---

### `src/config.js` — Central Configuration

Single source of truth for everything tunable.

**Key exports:**

| Export | Purpose |
|---|---|
| `TRUST_TIERS` | Tier 1 patterns, Tier 2 conditions, Tier 3 limits |
| `FEED_CATEGORIES` | 20 categories, ~110 feeds, with `tier` property on `ai_builder` |
| `MODELS` | Which Claude model for each step |
| `SCORING` | preFilterKeywords, crossFeedBonus, thresholds |
| `LIMITS` | Article targets, token budgets per call |
| `WEBINTEL_PROMPT` | Query generation instructions |
| `CLASSIFY_PROMPT` | Tier 2 selective scoring (builder-weighted) |
| `BUILDER_PROMPT` | Call A synthesis instructions |
| `WORLD_PROMPT` | Call B synthesis instructions |
| `SCORING_PROMPT` | **Deprecated** — kept for legacy score.js |
| `RESEARCH_PROMPT` | **Deprecated** — kept for legacy research.js |

**New feed category:** `ai_builder` (weight 1.0, tier 1) — Dan Shipper/Every, Brian Casel, Steve Yegge, Addy Osmani

---

### `src/classify.js` — Trust Tier Classification (NEW, replaces score.js)

Assigns every article to a Trust Tier. Tier 1 articles bypass scoring entirely.

**Algorithm:**
1. Check `memory.json.sourceRatings` for learned overrides (avgScore ≥ 4.0 → promote, < 2.5 → demote)
2. Check `TRUST_TIERS.tier1.patterns` (substring match on feedUrl/source) → Tier 1
3. Check crossFeedCount ≥ 3 or feedUrl contains `hnrss.org/best` → Tier 2
4. Everything else → Tier 3

Tier 1 articles are capped at `LIMITS.tier1MaxPerSource` (2) per source to prevent flooding.
Tier 2 articles are scored using `CLASSIFY_PROMPT` (builder-weighted).
Tier 3 articles are only scored if Tier 1 + Tier 2 total < `LIMITS.readTargetArticles` (30).

Returns: `{ tier1, tier2, tier3, all, tokens }`

---

### `src/webintel.js` — Proactive Web Intelligence (NEW)

Generates and executes targeted web searches before synthesis.

**Step 1 — Query generation:** Fast Claude call (no web search). Reads `life-context.md` + last 2 briefings. Returns 5-8 JSON search queries.

**Step 2 — Parallel execution:** All queries run concurrently via `Promise.all()`. Each uses Claude with `web_search` tool. Results saved to `data/web-intelligence.md`.

Both synthesis calls receive this intelligence. Web search during synthesis becomes verification-only.

---

### `src/read.js` — Article Reader (updated)

Accepts either v4.0 classified object `{ tier1, tier2, tier3 }` or v3.x flat array (backward compatible).

Selection algorithm:
1. All Tier 1 articles (guaranteed inclusion, deduped by URL)
2. Tier 2 articles by score until target (30) reached
3. Tier 3 articles only if budget remains

Fetches full HTML text for each selected article. Tier property preserved on each article for synthesize.js routing.

---

### `src/synthesize.js` — Parallel Specialist Synthesis (NEW, replaces research.js)

**Context loading:** All context loaded in parallel: lifeContext, newsInterests, webIntelligence, lastBriefings, memory, feedback.

**Feedback loading:** Tries `data/feedback-latest.json` (v4.0 structured) first, falls back to `data/feedback-latest.md` (v3.x markdown).

**Parallel calls:** `callBuilderSynth()` + `callWorldSynth()` run via `Promise.all()`.

**Assembly:** `assembleBriefing()` extracts sections by emoji+header pattern from combined output, reorders into canonical section order.

**Memory update:** Updates `memory.json` with v4.0 learning fields:
- `sourceRatings`: updated from structured feedback ratings
- `sectionPerformance`: updated from section feedback ratings
- `topicPreferences`: tracked per topic

**Feedback templates:** Writes both `data/feedback-template.md` (for MylifeOS/Obsidian) and `data/feedback-latest-template.json` (structured JSON schema).

---

### `src/page.js` — HTML Briefing Generator (NEW)

Generates `briefings/YYYY-MM-DD.html` alongside the `.md` file.

**Features:**
- Full briefing rendered from markdown via `marked`
- Per-article ❤️/✓/✗ reaction buttons (injected after MUST-READ list items)
- Per-section 👍/👍/👎 rating buttons (injected after section headers)
- Overall 1-5 star rating
- Freeform notes textarea
- Submit button → POSTs JSON to `FEEDBACK_WORKER_URL`
- If no worker: downloads feedback as JSON for manual import
- Self-contained: no external CDN dependencies

The page is committed to git and auto-deployed via Cloudflare Pages.

---

### `src/validate.js` — Anti-Hallucination Checker (unchanged)

Second Claude call that reads the full briefing and produces a structured JSON confidence report.

Checks: URL validity, no invented project problems, no filler sections, WORLD LENS tone, FEED HEALTH reasonableness.

If confidence < 0.7: prepends warning banner. Subject line gets ⚠️ suffix.

---

### `src/deliver.js` — Email Delivery (updated)

Sends HTML email via Resend API. v4.0 change: injects a portal banner with "Read live + react per article →" link when `PRISM_PORTAL_URL` is set.

---

### `src/context.js` — Life Context Generator (unchanged)

Clones MylifeOS, generates `data/life-context.md` from priority layers:
1. `Journal/context-note.md` — Julien's own words, never overridden
2. `LOG.md` — last 3 days of activity
3. Recently modified `.md` files (last 48h)
4. `CLAUDE.md` — stable identity file

Falls back to existing `data/life-context.md` if clone fails.

---

### `src/deepdive.js` — Deep Dive Research (unchanged)

On-demand deep research on specific topics. Not used in standard nightly runs. Reports saved to `briefings/deep-dives/`.

---

### `worker/feedback.js` — Cloudflare Worker (NEW)

Receives feedback POST from the PRISM Portal HTML page. Writes `data/feedback-latest.json` to the PRISM GitHub repo via GitHub Contents API.

**Auth:** Optional `X-PRISM-Secret` header validated against `PRISM_FEEDBACK_SECRET` env var.

**Deploy:** `cd worker && wrangler deploy`

**Required secrets (via `wrangler secret put`):**
- `PRISM_GITHUB_TOKEN` — PAT with repo write scope
- `PRISM_GITHUB_REPO` — e.g. `raclettemeister/prism`
- `PRISM_FEEDBACK_SECRET` — shared secret

---

## Data Files

| File | Written by | Read by | Purpose |
|---|---|---|---|
| `data/life-context.md` | `context.js` | `webintel.js`, `synthesize.js` | Julien's current projects and priorities |
| `data/news-interests.md` | You / MylifeOS CI | `classify.js`, `synthesize.js` | Interest profile — controls scoring and briefing tone |
| `data/web-intelligence.md` | `webintel.js` | `synthesize.js` | Proactive web intel from pre-synthesis searches |
| `data/memory.json` | `collect.js`, `synthesize.js` | `classify.js`, `synthesize.js` | Persistent memory: feed health, topic frequency, **source ratings**, **section performance** |
| `data/feedback-latest.json` | Cloudflare Worker / manual | `synthesize.js` | Structured feedback from PRISM Portal (v4.0) |
| `data/feedback-latest.md` | MylifeOS / CI | `synthesize.js` | Legacy markdown feedback (v3.x, still supported) |
| `data/feedback-template.md` | `synthesize.js` | MylifeOS / CI | Markdown feedback template pushed to vault after each run |

---

## The Briefing Structure (v4.0)

| Section | From | Purpose |
|---|---|---|
| 🔴 THE SIGNAL | Call A | Single most important development today |
| 📚 MUST-READ LIST | Call A | Articles worth clicking (max 5) |
| 🧱 BUILDER INTELLIGENCE | Call A | Methodology beats, micro-SaaS radar, tool updates, API economics |
| 📊 PIONEER ADVANTAGE CHECK | Call B | Development → Your Edge → Window → Builder Impact? |
| 🛠️ TOOLS TO TRY | Call B | New tools with 30-min try actions |
| 🏗️ BUILD WATCH | Call B | Trajectories worth tracking |
| ⏪ ACTION AUDIT | Call A | Yesterday's priorities: carry forward, drop, modify? |
| 🎯 TODAY'S PRIORITIES | Call A | Max 3 items ranked by urgency |
| 🌍 WORLD LENS | Call B | Geopolitics through Brussels founder lens (Economist style) |
| 🇪🇺 EUROPE TECH | Call B | EU/Belgian tech landscape |
| 📈 TREND TRACKER | Call B | Recurring themes, what's accelerating, what disappeared |
| 🚮 SLOP FILTER | Call B | Signal/noise report |
| 🔄 FEED HEALTH REPORT | Call B | Keep/Watch/Add/Remove feed recommendations |
| 💬 FEEDBACK RESPONSE | Call B | Response to Julien's previous feedback |

---

## GitHub Actions Workflow

`.github/workflows/nightly.yml` — runs at `0 3 * * *` (3:00 UTC = 4:00 AM Brussels).

**Steps:**
1. Checkout repo
2. Setup Node 20
3. `npm ci`
4. `curl` fetch `NEWS-INTERESTS.md` from MylifeOS → `data/news-interests.md`
5. `curl` fetch `prism-feedback.md` from MylifeOS → `data/feedback-latest.md`
6. `node src/index.js` (all secrets injected)
7. `git commit && git push` — commits `briefings/` (`.md` + `.html`) and `data/`
8. GitHub API `PUT` — pushes `data/feedback-template.md` → MylifeOS `Journal/prism-feedback.md`
9. Cloudflare Pages picks up new HTML files → live within 1 minute

**Timeout:** 35 minutes. v4.0 typical runtime: 11-21 minutes (14-24 min safety margin).

---

## Time Budget

| Step | v3.3 | v4.0 | Change |
|---|---|---|---|
| Context | 1-2 min | 1-2 min | — |
| Collect | 2-3 min | 2-3 min | — |
| Classify + WebIntel | 5-8 min | 3-5 min (parallel) | **-3 min** |
| Read | 3-5 min | 1-2 min (30 not 80) | **-3 min** |
| Synthesis | 10-20 min | 4-7 min (parallel A+B) | **-10 min** |
| Page generation | — | <1 min | — |
| Validate + Deliver | 2 min | 2 min | — |
| **TOTAL** | **22-40 min** | **11-21 min** | **~-50%** |

---

## Cost Model

All steps use **Claude Sonnet 4.6** at $3.00/$15.00 per million input/output tokens.

| Step | v3.3 | v4.0 |
|---|---|---|
| Classify (Tier 2 only ~80 articles) | ~$0.45 (350 articles) | ~$0.15 |
| WebIntel (query gen + 5-8 searches) | — | ~$0.10 |
| Call A (Builder, 8K out max) | — | ~$0.28 |
| Call B (World, 6K out max) | ~$0.51 (single call) | ~$0.22 |
| Validation | ~$0.07 | ~$0.07 |
| **Total** | **~$1.03** | **~$0.75** |

---

## Legacy Files (kept, not used in v4.0 pipeline)

| File | Status | Notes |
|---|---|---|
| `src/score.js` | Legacy v3.3 | Replaced by `classify.js` |
| `src/research.js` | Legacy v3.3 | Replaced by `synthesize.js` |
| `src/analyze-individual.js` | Legacy v2.x | Kept for reference |
