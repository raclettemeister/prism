# PRISM — Architecture

**v3.3** — Personal Research Intelligence System

---

## Pipeline Overview

```
GitHub Actions (3:00 UTC daily)
│
├─ [CI] Fetch news-interests.md from MylifeOS via GitHub API
├─ [CI] Fetch prism-feedback.md from MylifeOS via GitHub API
│
└─ node src/index.js
   │
   ├── Step 0  · context.js    → Clone MylifeOS, generate data/life-context.md
   ├── Step 0b · deepdive.js   → Run any requested deep dives (usually skipped)
   ├── Step 1  · collect.js    → Fetch ~100 RSS feeds → deduplicate → ~400–700 articles
   ├── Step 2  · score.js      → Pre-filter → batch Claude scoring → top 100 by score
   ├── Step 3  · read.js       → Select top 80 (diversity algorithm) → fetch full text
   ├── Step 4  · research.js   → THE BIG CALL (Sonnet + 1M ctx + web search) → briefing
   ├── Step 5  · validate.js   → Anti-hallucination check → confidence score
   └── Step 6  · deliver.js    → HTML email via Resend
   
[CI] Commit briefings/ + data/ to git
[CI] Push feedback template back to MylifeOS
```

---

## Module Reference

### `src/index.js` — Orchestrator

Runs the 8-step pipeline in sequence. Tracks token usage across all steps. Aggregates cost estimate. Handles `--dry-run` flag (stops after collect, prints first 10 articles).

**Key behaviour:**
- Any step can fail without crashing later steps (each step has internal error handling)
- Token counts are summed across scoring + research + validation passes
- Cost is estimated using Sonnet 4.6 pricing ($3/$15 per MTok input/output)

---

### `src/config.js` — Central Configuration

Single source of truth for everything tunable. **If you want to change behaviour, start here.**

**Key exports:**
| Export | Purpose |
|---|---|
| `FEED_CATEGORIES` | All RSS feeds, grouped by category with weights |
| `MODELS` | Which Claude model to use for each step |
| `SONNET_46_BETAS` | Beta headers for 1M context + web search |
| `SCORING` | Pre-filter thresholds, batch sizes, keyword list, top-N |
| `LIMITS` | Max article length, age cutoff, token budgets |
| `SCORING_PROMPT` | Full system prompt for the batch scoring step |
| `RESEARCH_PROMPT` | Full system prompt for THE BIG CALL |

**Category weights** (0.0–1.0): Multiply the raw Claude score. A `1.0` category's articles compete on equal footing; a `0.55` category's articles need a higher raw score to reach the top 100.

---

### `src/context.js` — Life Context Generator

Clones the MylifeOS personal vault and produces `data/life-context.md` — a snapshot of what Julien is working on, used to personalize the briefing.

**Priority layers (highest → lowest):**
1. `Journal/context-note.md` — Julien's own words, written directly. Never overridden.
2. `LOG.md` — last 3 days of activity log. What actually happened.
3. Recently modified `.md` files (git log, last 48h). What's being actively worked on.
4. `CLAUDE.md` — stable identity file. Background info, lower priority.

**If context-note.md exists and is fresh:** formats it directly (no Claude call, saves tokens).  
**Otherwise:** Claude Sonnet synthesizes a context snapshot from the layers above.

**Fallback:** if `MYLIFEOS_REPO` is not set, or the clone fails, uses the existing `data/life-context.md`.

**Authentication fix (v3.3):** `MYLIFEOS_REPO` can be `user/repo` (bare path) or a full URL. The clone uses `oauth2:PAT@github.com` format with `GIT_TERMINAL_PROMPT=0` to prevent hanging in headless CI.

---

### `src/collect.js` — RSS Collector

Fetches all feeds in `FEED_CATEGORIES` in sequence (10s timeout per feed). Performs two deduplication passes.

**Dedup pass 1 — URL:** same article URL from multiple feeds → merge into one, keep higher-weight category, merge `feedUrlsCarried` list.

**Dedup pass 2 — Title similarity:** if 80%+ of words in two titles match → treat as same story, keep higher-weight source, merge feeds.

**Cross-feed signal:** `crossFeedCount` tracks how many feeds independently picked up the same story. Articles appearing in 3+ feeds get a scoring bonus (`SCORING.crossFeedBonus`).

**Age filter:** articles older than `LIMITS.maxArticleAge` (48h) are dropped.

Also updates `data/memory.json` with per-feed health metrics (success rate, average article count).

---

### `src/score.js` — Relevance Scorer

**Pre-filter:** if total articles > `SCORING.preFilterThreshold` (300), keeps only articles matching any keyword from `SCORING.preFilterKeywords`. Caps at `SCORING.preFilterMax` (300). Articles that don't match get score 0 and are excluded from the top 100, but remain in the full list.

**Batch scoring:** sends articles in batches of 100 to Claude Sonnet with the `SCORING_PROMPT` and the user's `news-interests.md`. Claude returns a JSON array with `index`, `score`, `reason`, `tags`, `actionable`.

**JSON extraction (v3.3 fix):** uses `extractJsonArray()` which tries two strategies:
1. Strip markdown code fences, parse directly
2. Regex-find the first `[...]` block in the response (handles preamble/postamble text)

**Final score formula:**
```
finalScore = rawScore × categoryWeight
if crossFeedCount >= 3: finalScore += crossFeedBonus (2 points)
finalScore = min(10, finalScore)
```

**Output:** full sorted article list. Top `SCORING.topN` (100) above `SCORING.minScore` (3) go to read.js.

---

### `src/read.js` — Article Reader

Selects the top 80 articles using a **diversity-first algorithm:**
- **First pass:** best-scoring article from each category with score ≥ 4 (ensures no category is completely unrepresented)
- **Second pass:** fill to 80 slots with highest-scoring remaining articles

Then fetches full article HTML for each, using cheerio to extract clean text:
1. Remove nav, footer, sidebar, script, style
2. Try `<article>` → `<main>` → `<body>` (in order)
3. Truncate to 3,000 words

Fetches in batches of 10 with 15s per-article timeout. Failed fetches fall back to the RSS snippet.

---

### `src/research.js` — THE BIG CALL

The core of PRISM. One Claude Sonnet call with:
- **1M token context window** (via `context-1m-2025-08-07` beta)
- **Web search** (via `code-execution-web-tools-2026-02-09` beta)
- **Adaptive thinking** enabled

Builds the prompt by assembling:
| Block | Source |
|---|---|
| `{life_context}` | `data/life-context.md` |
| `{news_interests}` | `data/news-interests.md` |
| `{last_briefings}` | Last 3 briefings from `briefings/` |
| `{memory_json}` | Topic frequency, tools seen, project watchlist |
| `{action_audit}` | Yesterday's recommended actions from memory |
| `{feedback}` | `data/feedback-latest.md` (if non-empty) |
| Articles block | All 80 articles with full text, score, category, cross-feed count |

**Web search:** Claude decides what to verify. Typically 3–9 searches per run. Count is tracked and reported.

**Output:** saves to `briefings/YYYY-MM-DD.md`, updates `data/memory.json`, writes `data/feedback-template.md`.

**Fallback:** if the 1M context + web search call fails, retries without betas (trims to ~200K tokens).

---

### `src/validate.js` — Anti-Hallucination Checker

A second Claude Sonnet call that reads the full briefing and produces a structured JSON confidence report.

**Checks:**
- All URLs are plausibly real (properly formatted, known domains)
- No invented problems with Julien's projects
- No filler sections (vague, unsourced, speculative)
- WORLD LENS maintains analytical tone (not clickbait)
- FEED HEALTH REPORT contains reasonable recommendations

**Output:** `confidence` (0.0–1.0), list of `issues` with severity + action, list of clean sections.

If `confidence < 0.7`: prepends a warning banner to the briefing.

**JSON extraction (v3.3 fix):** uses `extractJsonObject()` — same robust extraction as score.js but for `{...}` objects. Also removed `thinking: { type: 'adaptive' }` which was causing non-JSON preamble in responses.

---

### `src/deliver.js` — Email Delivery

Converts the markdown briefing to HTML via `src/email-template.js` (uses `marked`) and sends via the Resend API.

Subject line: `PRISM — February 21, 2026` (or with `⚠️` suffix if confidence < 70%).

If `RESEND_API_KEY` is not set: logs a warning and returns `{ sent: false }`. Pipeline continues normally.

---

### `src/deepdive.js` — Deep Dive Research

On-demand deep research on specific topics. Triggered by a config file or command-line argument. Not used in standard nightly runs.

Reports are saved to `briefings/deep-dives/` and injected into the briefing before the Priorities section.

---

### `src/analyze-individual.js` — Legacy

Kept for reference. Was the individual article analysis step in v2.x before THE BIG CALL consolidated everything into one prompt. Not used in v3.x.

---

## Data Files

| File | Written by | Read by | Purpose |
|---|---|---|---|
| `data/life-context.md` | `context.js` | `research.js` | Current snapshot of what Julien is doing |
| `data/news-interests.md` | You / MylifeOS | `score.js`, `research.js` | Your interest profile — controls scoring and briefing tone |
| `data/memory.json` | `collect.js`, `research.js` | `research.js` | Persistent cross-run memory: feed health, topic frequency, action tracking |
| `data/feedback-latest.md` | MylifeOS / CI | `research.js` | Feedback from previous briefing, consumed and cleared each run |
| `data/feedback-template.md` | `research.js` | MylifeOS / CI | Template pushed to vault after each run for next-day feedback |

---

## GitHub Actions Workflow

`.github/workflows/nightly.yml` — runs at `0 3 * * *` (3:00 UTC = 4:00 AM Brussels).

**Steps:**
1. Checkout repo
2. Setup Node 20
3. `npm ci`
4. `curl` fetch `NEWS-INTERESTS.md` from MylifeOS → `data/news-interests.md`
5. `curl` fetch `prism-feedback.md` from MylifeOS → `data/feedback-latest.md`
6. `node src/index.js` (with all secrets injected as env vars)
7. `git commit && git push` — commits `briefings/` and `data/`
8. GitHub API `PUT` — pushes `data/feedback-template.md` → MylifeOS `Journal/prism-feedback.md`

**Timeout:** 35 minutes. THE BIG CALL with web search typically takes 10–20 minutes.

---

## Cost Model

All steps use **Claude Sonnet 4.6** at $3.00/$15.00 per million input/output tokens.

| Step | Typical tokens | Typical cost |
|---|---|---|
| Scoring (350 articles × 4 batches) | ~35K in / ~23K out | ~$0.45 |
| THE BIG CALL (80 articles + full context) | ~105K in / ~13K out | ~$0.51 |
| Validation | ~15K in / ~2K out | ~$0.07 |
| **Total** | **~155K in / ~38K out** | **~$1.03** |

Web search adds ~$0.01/search (10 searches ≈ $0.10).

Context generation (when MylifeOS clone succeeds) adds ~$0.05–0.15 depending on vault size.
