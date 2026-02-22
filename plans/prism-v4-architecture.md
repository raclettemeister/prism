# PRISM v4.0 Architecture Plan
## "The Smart Analyst"

**Status:** Approved — ready for implementation  
**Supersedes:** v3.3 (brute-force batch scoring + single BIG CALL)  
**Context document:** Strategic Mastery of AI-Driven Software Development (Feb 2026)

---

## The Problem with v3.3

The current pipeline is a **factory**, not an analyst:

```
COLLECT 400+ articles → SCORE EVERYTHING blindly → PICK 80 → ONE 20-MIN MEGA-CALL
```

- Hits the 35-minute GitHub Actions ceiling regularly
- Dan Shipper or Simon Willison can be scored 3.2 if the title is abstract
- Web search is reactive (decided mid-synthesis), not targeted upfront
- Feedback is free-text markdown, not machine-readable — PRISM cannot learn
- No dedicated section for Julien's actual mission: building micro-software as a non-technical CEO

---

## The Three Architectural Shifts

```
v3.3: COLLECT EVERYTHING → SCORE EVERYTHING → ONE GIANT CALL
v4.0: KNOW WHO TO TRUST → ASK SMART QUESTIONS FIRST → PARALLEL SPECIALIST CALLS
```

1. **Trust Tiers replace blind batch scoring** — Expert sources always pass. No algorithm filters them.
2. **Proactive Web Intelligence runs before synthesis** — Targeted searches from life context, not mid-call afterthoughts.
3. **Parallel specialist calls replace the single BIG CALL** — Builder Intelligence + World Context run concurrently.

---

## Pipeline Diagram

```
GitHub Actions (3:00 UTC)
│
├── Step 0:  context.js      → Clone MylifeOS → data/life-context.md
│
├── Step 1:  collect.js      → 100 RSS feeds → 400-700 raw articles
│
├── Step 2:  classify.js     → Tier 1 (always read) | Tier 2 (amplified) | Tier 3 (filtered)
│   [PARALLEL]
├── Step 3:  webintel.js     → 5-8 targeted searches → data/web-intelligence.md
│
├── Step 4:  read.js         → Fetch full text for ~30 articles (vs 80 in v3.3)
│
├── Step 5a: synthesize.js   → CALL A: Builder Synthesis (critical path)     ─┐
│   [PARALLEL]                                                                  ├── Promise.all()
├── Step 5b: synthesize.js   → CALL B: World Synthesis (secondary)            ─┘
│
├── Step 6:  synthesize.js   → Assemble A + B into full briefing
│
├── Step 6b: page.js         → Generate briefings/YYYY-MM-DD.html (feedback UI)
│
├── Step 7:  validate.js     → Anti-hallucination check (unchanged)
│
└── Step 8:  deliver.js      → Email with live page URL + HTML summary

[CI] Commit briefings/ + data/ → Cloudflare Pages picks up → live in <1 min
```

---

## Shift 1: Trust Tier Classification (`src/classify.js`)

Replaces `src/score.js` entirely.

### Tier 1 — Expert Trusted (`treatment: always_read`)

These 12 sources are read in full, every night, unconditionally. No scoring. No keyword filtering. Guaranteed inclusion.

| Source | Rationale |
|---|---|
| `every.to` / Dan Shipper | Blueprint for the AI-native CEO (zero-code scaling) |
| `simonwillison.net` | Most reliable LLM pragmatist; critical skepticism of AI output |
| `steve-yegge.substack.com` | Vibe coding manifesto; post-IDE orchestration vision |
| `buildermethods` / Brian Casel | Sustainable micro-SaaS; anti-hype spec-driven frameworks |
| `addyosmani.com` | AI-Assisted Engineering; solving the "70% Problem" |
| `latent.space` | Heartbeat of the AI engineer ecosystem |
| `oneusefulthing.org` / Mollick | AI as organizational capacity; verification bottleneck |
| `pragmaticengineer.com` | Enterprise reality check; developer sentiment |
| `economist.com` | World context, analytical lens (not clickbait) |
| `adamtooze.com` | Macro/geopolitics for Brussels founder |
| `noahpinion.blog` | Economic forces, global structural shifts |
| `ft.com` | Financial intelligence (paywall-limited but still worth pulling) |

**Max:** 2 articles per source per night → ~20-24 Tier 1 articles, guaranteed in every briefing.

### Tier 2 — Amplification Signal (`treatment: score_if_amplified`)

Articles that *humans* endorsed, not keywords:
- `crossFeedCount >= 3` — 3+ independent feeds picked up the same story
- HN articles with 100+ points
- GitHub Trending repos with builder relevance keywords

Score only ~50-80 articles. Select top 10. These feed Call B (World Synthesis).

### Tier 3 — Long Tail (`treatment: score_if_budget`)

Everything else. Scored only if Tier 1 + Tier 2 total < 30 articles. Max 10, min score 7. Usually entirely skipped.

### Dynamic Learning (from memory.json)

Over time, `classify.js` reads `memory.json.sourceRatings` to **dynamically adjust tier weights**:
- Source with `avgFeedbackScore > 4.0` over 10+ articles → auto-promote toward Tier 1
- Source with `avgFeedbackScore < 2.5` over 8+ articles → demote toward Tier 3, flag for removal

PRISM starts with opinionated defaults. It refines them based on actual reactions.

---

## Shift 2: Proactive Web Intelligence (`src/webintel.js`)

New module. Runs in parallel with `classify.js`. Completes before synthesis begins.

### How it works

**Step A — Query generation** (~30 seconds, no web search, cheap):
```
Given life-context.md and last 3 briefings:
Generate 5-8 targeted search queries to run RIGHT NOW.
Focus on:
1. Active projects — what changed in the last 24h?
2. Tools in use — any updates, outages, releases?
3. Topics tracked all week — what's the latest?
4. Micro-SaaS / builder methodology — what are practitioners discussing?
5. Brussels/Belgium business context
Return only a JSON array of queries.
```

**Step B — Parallel execution** (~2-3 minutes):
All queries run concurrently via `Promise.all()`. Results saved to `data/web-intelligence.md`.

**Example queries generated:**
- "Claude Code release notes February 21 2026"
- "Lovable.dev changelog this week"
- "Cursor vs Windsurf 2026 comparison"
- "micro-SaaS product launches indie hackers February 2026"
- "Belgian retail consumer spending February 2026"

Both synthesis calls (5a and 5b) receive this pre-built intelligence. Web search during synthesis becomes **verification only** — not primary research.

---

## Shift 3: Parallel Specialist Synthesis (`src/synthesize.js`)

Replaces `src/research.js`. Two concurrent calls via `Promise.all()`.

### Call A — Builder Intelligence (critical path)

**Input:** Tier 1 expert articles + web intelligence + life context + memory + feedback  
**Mission:** What does Julien DO today, and what does he need to know as a micro-software builder?  
**Output sections:**
- 🔴 THE SIGNAL
- 📚 MUST-READ LIST
- 🧱 BUILDER INTELLIGENCE *(new section)*
- ⏪ ACTION AUDIT
- 🎯 TODAY'S PRIORITIES

**Token budget:** 8,000 output tokens max  
**Estimated time:** 4-7 minutes  
**Resilience:** If Call A fails → briefing fails. This is the core.

### Call B — World Context (secondary)

**Input:** Tier 2 geopolitics/economy/EU articles + web intelligence + last 3 briefings  
**Mission:** What is moving in the world that matters to a Brussels-based founder?  
**Output sections:**
- 📊 PIONEER ADVANTAGE CHECK *(with Builder Impact column)*
- 🛠️ TOOLS TO TRY
- 🏗️ BUILD WATCH
- 🌍 WORLD LENS
- 🇪🇺 EUROPE TECH
- 📈 TREND TRACKER
- 🚮 SLOP FILTER
- 🔄 FEED HEALTH REPORT
- 💬 FEEDBACK RESPONSE

**Token budget:** 6,000 output tokens max  
**Estimated time:** 4-7 minutes  
**Resilience:** If Call B fails or times out → Call A sections emailed alone with a note. Graceful degradation.

### Assembly

`synthesize.js` assembles A + B outputs in defined section order after `Promise.all()` resolves.

---

## New Section: 🧱 BUILDER INTELLIGENCE

The section PRISM has never had. Direct translation of the strategic document into daily intelligence.

```markdown
## 🧱 BUILDER INTELLIGENCE

**Methodology beat:**
What AI-assisted engineering patterns are practitioners discussing?
Any "70% Problem" reports — where AI-generated code failed in production this week?
Spec-driven, context management, parallel agent, or prompt architecture breakthroughs?
[If nothing: "No methodology signals today."]

**Micro-SaaS Radar:**
Pain points surfaced today that could become a product.
Underserved niches. Niche buyer personas with unsolved frictions.
API combinations nobody has built yet.
[If nothing: "No micro-SaaS signals today."]

**Tool & Stack Updates:**
Changes to Cursor, Windsurf, Lovable, Bolt.new, Claude Code, v0.
Workflow changes that affect how you build tomorrow morning.
[If nothing: "No tool updates today."]

**API Economics:**
New services worth knowing about. What connective tissue appeared today?
Supabase, Stripe, Resend, Cloudflare, Neon — anything changed?
[If nothing: "Nothing new in the API landscape."]
```

---

## Feed Architecture Changes (`src/config.js`)

### New Category: `ai_builder` (weight `1.0`, tier `1`)

The 4 expert sources missing from v3.3:

```javascript
ai_builder: {
  weight: 1.0,
  tier: 1,
  feeds: [
    'https://every.to/chain-of-thought/feed',     // Dan Shipper — Chain of Thought column
    'https://every.to/feed',                       // Every — full publication
    'https://buildermethods.substack.com/feed',    // Brian Casel — Builder Methods
    'https://briancasel.com/feed',                 // Brian Casel — personal site (alternate)
    'https://steve-yegge.substack.com/feed',       // Steve Yegge — Stevie's Tech Talks
    'https://addyosmani.com/rss',                  // Addy Osmani — Beyond Vibe Coding
  ]
}
```

Note: All URLs are best-guess. PRISM's feed health report will flag 404s for cleanup.

### Expanded `nocode` (weight `1.0`, boosted from `0.95`)

```javascript
// Add to existing Replit + Val.town:
'https://lovable.dev/blog/rss',                 // Lovable blog
'https://changelog.lovable.dev/rss',            // Lovable changelog
'https://blog.stackblitz.com/rss.xml',          // StackBlitz (powers Bolt.new)
'https://codeium.com/blog/rss',                 // Windsurf / Codeium
'https://cursor.com/changelog/rss',             // Cursor changelog (retry — was 404)
```

### 3 New HN Builder Queries in `big_picture`

```javascript
'https://hnrss.org/best?count=20&q=micro-SaaS+OR+vibe+coding+OR+indie+hacker',
'https://hnrss.org/best?count=15&q=Lovable+OR+Bolt.new+OR+Windsurf+OR+Cursor',
'https://hnrss.org/best?count=15&q=solo+founder+OR+bootstrapped+OR+AI-assisted',
```

### Expanded `preFilterKeywords`

```javascript
// AI-assisted builder methodology
'micro-SaaS', 'vibe coding', 'vibe-coding', 'solo founder', 'bootstrapped',
'indie hacker', 'spec-driven', 'AI-assisted', 'Lovable', 'Windsurf', 'Bolt.new',
'MCP', 'vertical slice', 'definition of done', 'agentic workflow',
'Cursor', 'Builder Methods', 'Every', 'Dan Shipper', 'Addy Osmani', 'Steve Yegge',
'compounding', 'PRD', 'SPEC', 'context window', 'system prompt', 'scaffold',
```

---

## Feedback Learning Architecture

### Structured Feedback (`data/feedback-latest.json`)

Replaces `data/feedback-latest.md`. Machine-readable JSON:

```json
{
  "date": "2026-02-21",
  "briefingRating": 4,
  "mustReads": [
    { "title": "Token Anxiety essay", "source": "simonwillison.net", "rating": "love" },
    { "title": "Substack Notes 2026", "source": "substack", "rating": "skip" }
  ],
  "sections": {
    "BUILDER_INTELLIGENCE": "love",
    "WORLD_LENS": "ok",
    "TOOLS_TO_TRY": "love",
    "EUROPE_TECH": "skip"
  },
  "openNotes": "Less geopolitics, more Cursor workflow content"
}
```

### `memory.json` Learning Fields (new additions)

```json
{
  "sourceRatings": {
    "simonwillison.net": { "total": 18, "loved": 14, "skipped": 1, "avgScore": 4.4 }
  },
  "sectionPerformance": {
    "BUILDER_INTELLIGENCE": { "avgRating": 4.8, "runs": 12 },
    "WORLD_LENS": { "avgRating": 3.1, "runs": 12 }
  },
  "topicPreferences": {
    "micro-SaaS": 8, "AI-assisted engineering": 12, "geopolitics": 3
  }
}
```

---

## Live Hosting: PRISM Portal

### Architecture

```
PRISM run → page.js generates briefings/YYYY-MM-DD.html → committed to GitHub
→ Cloudflare Pages auto-deploys → live at prism.julien.care/briefings/YYYY-MM-DD

Julien clicks link in email → reads briefing on prism.julien.care
→ clicks reactions (❤️ / ✓ / 👎) per article → rates sections → submits
→ Cloudflare Worker (worker/feedback.js) receives POST
→ Worker writes data/feedback-latest.json to PRISM repo via GitHub API
→ Next night's PRISM run reads it → adjusts
```

### `src/page.js` — HTML Briefing Generator

Generates `briefings/YYYY-MM-DD.html` alongside the existing `.md` file. The page includes:
- Full briefing rendered beautifully
- Per-article reaction buttons: `[❤️ Love]` `[✓ OK]` `[✗ Skip]`
- Per-section star ratings
- Freeform notes textarea
- "Submit Feedback" button → POSTs JSON to `FEEDBACK_WORKER_URL`

### `worker/feedback.js` — Cloudflare Worker

Tiny Worker deployed to Cloudflare. Handles feedback POST → GitHub API write.

```javascript
// Accepts POST with feedback JSON
// Reads current feedback-latest.json SHA from GitHub API
// Writes updated feedback-latest.json to PRISM repo
// Returns { success: true }
// Protected by PRISM_FEEDBACK_SECRET header
```

### New Environment Variables

| Variable | Where | Purpose |
|---|---|---|
| `FEEDBACK_WORKER_URL` | PRISM repo + GitHub Actions | Cloudflare Worker endpoint |
| `PRISM_GITHUB_WRITE_TOKEN` | Cloudflare Worker secrets | PAT to write feedback-latest.json back to repo |
| `PRISM_FEEDBACK_SECRET` | Both | Shared secret to authenticate Worker requests |

### `deliver.js` Update

Email includes both:
- "Read live →" link: `https://prism.julien.care/briefings/YYYY-MM-DD`
- The existing embedded HTML summary (as fallback if the link isn't clicked)

---

## Complete Module Map

```
UNCHANGED:  context.js, collect.js, validate.js, deepdive.js, 
            email-template.js, analyze-individual.js (legacy)

REPLACED:   score.js    → classify.js   (trust tiers + selective scoring)
            research.js → synthesize.js  (parallel specialist calls + assembly)

NEW:        webintel.js         — proactive web intelligence
            page.js             — HTML briefing + feedback UI generator
            worker/feedback.js  — Cloudflare Worker for feedback collection

UPDATED:    index.js    — new 8-step pipeline with parallel execution
            config.js   — TRUST_TIERS, ai_builder feeds, new prompts, keywords
            read.js     — tier-aware selection, 30 articles not 80
            deliver.js  — includes live page URL in email

DATA:
  feedback-latest.json  — replaces feedback-latest.md (structured)
  web-intelligence.md   — new daily file from webintel.js
  memory.json           — new sourceRatings, sectionPerformance, topicPreferences fields
```

---

## Time & Cost Budget

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
| **Cost/night** | **~$1.03** | **~$0.75** | **~-27%** |

GitHub Actions timeout: 35 min. v4.0 safety margin: **14-24 minutes**.

---

## `news-interests.md` Update

The local `data/news-interests.md` currently has a redirect artifact (CI overwrites it from MylifeOS on each run). The user must also update `NEWS-INTERESTS.md` in Obsidian with this new primary section:

```markdown
## PRIMARY MISSION: AI Micro-Software Builder
I am a non-technical CEO (retail background, Brussels) transitioning to building
micro-SaaS businesses using AI-assisted engineering.

Score HIGHEST any content about:
- Spec-driven AI development, PRDs, prompt architecture, context management
- The "70% Problem" — where AI falls short, production failures, quality guardrails
- Solo founder workflows: Cursor, Windsurf, Lovable, Bolt.new, v0, Claude Code
- Micro-SaaS business models, niche product ideas, bootstrapped case studies
- API economics: Supabase, Stripe, Resend, Cloudflare Workers as building blocks
- Compounding engineering — reusable scripts, agents, deployment frameworks
- Non-technical CEO building with AI — the Every / Dan Shipper pattern
- AI-assisted engineering methodology, parallel agents, vertical slices

Score LOWER: ML model architecture, VC fundraising, enterprise SaaS, mobile dev,
cryptocurrency, blockchain, social media growth hacks
```

---

## Implementation Order for Code Mode

1. `src/config.js` — TRUST_TIERS definition, new feeds, updated prompts, new keywords
2. `src/classify.js` — new file (replaces score.js)
3. `src/webintel.js` — new file (proactive web intelligence)
4. `src/read.js` — update for tier-aware selection, 30 articles
5. `src/synthesize.js` — new file (replaces research.js, parallel calls + assembly)
6. `src/page.js` — new file (HTML briefing + feedback UI)
7. `src/deliver.js` — add live page URL
8. `src/index.js` — update orchestrator for new pipeline
9. `worker/feedback.js` — new Cloudflare Worker
10. `data/news-interests.md` — update with builder mission section
11. `data/memory.json` — add learning fields
12. `.env.example` — document new environment variables
13. `ARCHITECTURE.md` — update for v4.0
14. `README.md` — update for v4.0

---

## Post-Launch Fixes — From First Run (2026-02-22)

**Run diagnostics:**
- Cost: $0.48 ✅ | Runtime: 722s (12 min) ✅ | Email: delivered ✅
- Confidence: 41% ❌ | WebIntel: 476s ❌ | ai_builder feeds: 6/8 dead ❌

---

### Fix 1 (CRITICAL) — WebIntel redesign: single unified call

**Problem:** 8 separate Claude API calls "in parallel" took 476 seconds (66% of total runtime). Anthropic serializes concurrent web search calls server-side. One call taking ~60s × effectively serial = 476s.

**Root cause:** Current architecture: (1) generate query JSON → (2) 8 separate streaming API calls. Even with `Promise.all()`, the server-side bottleneck makes them near-sequential.

**Fix:** Replace with ONE unified streaming Claude call that self-directs all its searches internally. Claude with web search enabled naturally does multiple sequential searches inside one API call. This brings WebIntel from ~476s to ~90-120s.

**Code change:** Rewrite `src/webintel.js` — remove `generateQueries()` + `executeSearch()` + `Promise.all()` pattern. Replace with a single `client.beta.messages.stream()` call using a new sharper prompt.

**New WEBINTEL_PROMPT** (replace in `src/config.js`):
```
You are PRISM's Intelligence Scout. Gather today's most important external intelligence.
You have web search. Perform 4-6 targeted searches NOW, then write a structured report.

SEARCH PRIORITIES:
1. AI tool releases/updates: Claude Code, Cursor, Windsurf, Lovable, Bolt.new — what changed today?
2. AI-assisted engineering: methodology breakthroughs, the "70% Problem" in production, spec-driven dev?
3. Micro-SaaS/indie: notable product launches, builder case studies, new tools?
4. Europe: EU AI regulation news, Belgian or Brussels business developments?
5. World: geopolitical shifts affecting European founders (ECB, trade, US-EU tech)?

DO NOT search for personal projects or general background knowledge.
FOCUS on: what changed in the last 24-48 hours that a Brussels micro-SaaS builder would not already know.

After completing your searches, write a structured intelligence report:
## [Topic]
[2-3 sentences of key findings with source URL]
```

**Expected improvement:** WebIntel time: 476s → ~90s. Total runtime: 12 min → ~5 min.

---

### Fix 2 (HIGH) — ai_builder feed URL cleanup

**Problem:** 6 of 8 new ai_builder feeds returned 404 or 403. Most expert Substacks block anonymous RSS. The ones that work today: `latent.space`, `simonwillison.net`, `economist.com`, `noahpinion.blog`.

**Dead feeds to remove from `src/config.js`:**
```
every.to/feed                    → 404
buildermethods.substack.com/feed → 403 (Substack blocked)
briancasel.com/feed              → 404
steve-yegge.substack.com/feed    → 403 (Substack blocked)
steveyegge.substack.com/feed     → 403 (Substack blocked)
addyosmani.com/rss               → 404
```

**Keep (working, just 0 articles today):**
```
every.to/chain-of-thought/feed   → alive, 0 articles (Dan Shipper publishes infrequently)
addyosmani.com/feed.xml          → alive, 0 articles
```

**Add to `big_picture` as author-specific HN coverage** (these authors' work surfaces on HN):
```javascript
'https://hnrss.org/best?count=15&q=Dan+Shipper+OR+Every+newsletter+OR+Chain+of+Thought',
'https://hnrss.org/best?count=15&q=Steve+Yegge+OR+vibe+coding+OR+Addy+Osmani',
'https://hnrss.org/best?count=15&q=Brian+Casel+OR+Builder+Methods+OR+micro-SaaS+founder',
```

**Also fix broken nocode feeds:**
```
lovable.dev/blog/rss     → malformed XML (remove)
lovable.dev/rss.xml      → 404 (remove)
changelog.lovable.dev/rss → DNS not found (remove)
codeium.com/blog/rss     → malformed XML (remove)
codeium.com/blog/rss.xml → not recognized as RSS (remove)
cursor.com/changelog/rss → 404 (remove — confirmed dead since v3.3)
```

**Keep from nocode:** `blog.replit.com/feed.xml`, `blog.val.town/rss.xml`, `blog.stackblitz.com/rss.xml`

---

### Fix 3 (HIGH) — MylifeOS PAT expired (USER ACTION)

**Problem:** `remote: Invalid username or token. Password authentication is not supported for Git operations.`

PRISM fell back to a 4-day-old `data/life-context.md`. This caused the 41% confidence score because synthesis was working from stale context about projects and priorities.

**No code change needed.** User action required:
1. Go to `github.com/settings/tokens` → generate a **Classic token** (not fine-grained) with `repo` scope
2. Go to `github.com/raclettemeister/prism` → Settings → Secrets and variables → Actions → update `MYLIFEOS_PAT`

After this fix, confidence should return to 80%+ because PRISM will have accurate current context.

---

### Fix 4 (MEDIUM) — Page widget extraction

**Problem:** `📄 PAGE — (0 article widgets)` — The regex in `src/page.js` doesn't match the actual MUST-READ format Claude outputs.

**Expected format (what regex expects):**
```markdown
**[Title]** by Author — Source (link)
```

**Actual format Claude outputs:**
```markdown
**1. ["Title with quotes"]** by Author — Source ([link](url))
```

**Fix options:**
- Option A: Update regex to handle numbered + quoted format: `/\*\*\d+\.\s*\[?"?([^"\]]+)"?\]?\*\*/g`
- Option B: Simplify — extract articles from the feedback panel as a static list of titles found in the markdown (not inject inline buttons into the rendered HTML). Show article feedback widgets as a bottom panel list, not embedded in the content flow. More reliable, less brittle.

**Recommended: Option B** — move article widgets out of the content HTML and into the bottom feedback panel as a clean labeled list. The content stays untouched; the feedback panel lists articles with reaction buttons.

---

### Fix 5 (LOW) — Cloudflare Pages portal verification

**Problem:** The portal deploy step ran but `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` secrets were set after the first run started, so this run didn't deploy.

**Expected behavior on next run:** The `Deploy briefing to Cloudflare Pages` step will auto-run via `npx wrangler pages deploy briefings --project-name=prism-portal`. On first successful deploy, Cloudflare creates the `prism-portal` project and the URL `https://prism-portal.pages.dev` becomes live.

**Verification:** After next run completes, visit `https://prism-portal.pages.dev/2026-02-22.html`
