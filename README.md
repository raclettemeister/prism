# PRISM — Personal Research Intelligence System

An overnight AI analyst that reads ~110 RSS feeds while you sleep and delivers a structured intelligence briefing every morning — via email and a live interactive web page.

**Current version: v4.0 "The Smart Analyst"** — Trust Tier classification, proactive web intelligence, parallel specialist synthesis, HTML feedback portal.

---

## What It Does

Every night at 3:00 UTC (4 AM Brussels time), PRISM runs on GitHub Actions:

1. **Context** — Clones your personal vault (MylifeOS) to understand what you're working on today
2. **Collect** — Fetches ~110 RSS feeds across 20 categories (AI, builder tools, geopolitics, Europe tech, founders…)
3. **Classify + WebIntel** *(parallel)* — Assigns articles to Trust Tiers (expert sources bypass scoring) while simultaneously running targeted web searches based on your current projects
4. **Read** — Selects the top 30 articles by tier + score (down from 80), fetches their full text
5. **Builder Synthesis + World Synthesis** *(parallel)* — Two concurrent Claude calls: one focused on your builder mission, one on world context
6. **Assemble** — Combines both outputs into the complete briefing in canonical section order
7. **Validate** — A second Claude pass checks for hallucinations and unsourced claims
8. **Page** — Generates an interactive HTML briefing page with per-article feedback buttons
9. **Deliver** — Email + live portal link lands in your inbox via Resend

Cost: ~$0.75/night. Runtime: 11-21 minutes (well within the 35-min GitHub Actions limit).

---

## What's New in v4.0

### Trust Tiers replace blind batch scoring
12 expert sources (Dan Shipper/Every, Simon Willison, Steve Yegge, Addy Osmani, Pragmatic Engineer, etc.) are guaranteed in every briefing — no algorithm filters them out. Articles from these sources bypass scoring entirely.

### Proactive Web Intelligence
PRISM generates 5-8 targeted search queries from your life context and runs them *before* synthesis, not during. Synthesis calls receive pre-gathered intelligence rather than improvising web searches mid-call.

### Parallel specialist synthesis
Two concurrent Claude calls replace one sequential 20-minute mega-call:
- **Call A (Builder Intelligence)**: SIGNAL, MUST-READS, BUILDER INTELLIGENCE, ACTION AUDIT, PRIORITIES
- **Call B (World Context)**: PIONEER ADVANTAGE, TOOLS, BUILD WATCH, WORLD LENS, EUROPE TECH, TRENDS

### 🧱 BUILDER INTELLIGENCE — new section
A dedicated section for the non-technical CEO building micro-software: methodology beats, the "70% Problem" reports, micro-SaaS radar, tool updates, and API economics.

### Interactive HTML feedback portal
Every briefing generates a `YYYY-MM-DD.html` page hosted on Cloudflare Pages. React per article (❤️/✓/✗), rate sections, leave notes, submit — feedback writes directly back to the repo and is read on the next night's run. PRISM learns which sources and sections you value over time.

---

## Quick Start

```bash
# Clone and install
git clone https://github.com/YOUR_USERNAME/prism.git
cd prism
npm install

# Configure environment
cp .env.example .env
# Edit .env — minimum required: ANTHROPIC_API_KEY

# Test collection only (no API calls, no email)
npm test

# Full run
npm start
```

Your briefing is saved to `briefings/YYYY-MM-DD.md` and `briefings/YYYY-MM-DD.html`.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | ✅ Yes | All Claude calls |
| `RESEND_API_KEY` | For email | Email delivery via Resend |
| `MYLIFEOS_REPO` | For context | Your Obsidian vault repo (`username/repo`) |
| `MYLIFEOS_PAT` | For context | GitHub PAT with repo read scope |
| `PRISM_PORTAL_URL` | For live page | Base URL of Cloudflare Pages deployment (e.g. `https://prism.julien.care`) |
| `FEEDBACK_WORKER_URL` | For feedback | Cloudflare Worker endpoint for feedback submission |
| `PRISM_FEEDBACK_SECRET` | For feedback | Shared secret between portal and worker |

---

## Configuration

### `src/config.js` — Technical settings

- **`TRUST_TIERS`**: The 12 expert sources that always pass + Tier 2 amplification conditions
- **Feed list**: 20 categories, ~110 RSS feeds. New: `ai_builder` category with expert sources.
- **Model selection**: All use `claude-sonnet-4-6`
- **Prompts**: `WEBINTEL_PROMPT`, `CLASSIFY_PROMPT`, `BUILDER_PROMPT`, `WORLD_PROMPT`

### `data/news-interests.md` — What you care about

Plain-language description of your interests, projects, and what to ignore. Claude reads this every morning for scoring and synthesis. The authoritative version lives in your Obsidian vault.

**v4.0 addition:** Includes a `PRIMARY MISSION: AI Micro-Software Builder` section that calibrates PRISM toward your actual strategic goals.

### `data/life-context.md` — Your current context

Auto-generated from MylifeOS daily. Tells PRISM what you're building, your priorities this week, your stack. Also used by `webintel.js` to generate targeted search queries.

---

## Feedback Loop

After each run, PRISM generates both:
- `data/feedback-template.md` → pushed to your vault as `Journal/prism-feedback.md` (Obsidian)
- `briefings/YYYY-MM-DD.html` → deployed to Cloudflare Pages

### Via the live portal (recommended):
1. Click the link in your morning email
2. React to articles (❤️ Love / ✓ OK / ✗ Skip)
3. Rate sections you loved or want less of
4. Add freeform notes
5. Submit → writes to repo → next run adapts

### Via Obsidian (fallback):
1. Open `prism-feedback.md` in Obsidian
2. Check boxes, add notes
3. PRISM reads it on the next run

### What PRISM learns:
- **Source ratings**: Sources you consistently love → auto-promoted toward Tier 1
- **Section performance**: Sections you consistently skip → reduced token budget
- Stored in `data/memory.json` across runs

---

## Automated Nightly Runs (GitHub Actions)

The workflow in `.github/workflows/nightly.yml` runs every night at 3:00 UTC.

**Setup:**
1. Push this repo to GitHub (private)
2. Go to **Settings → Secrets and variables → Actions**
3. Add secrets: `ANTHROPIC_API_KEY`, `RESEND_API_KEY`, `MYLIFEOS_REPO`, `MYLIFEOS_PAT`, `PRISM_PORTAL_URL`, `FEEDBACK_WORKER_URL`, `PRISM_FEEDBACK_SECRET`
4. The workflow runs automatically. Manual trigger: **Actions → PRISM Nightly Briefing → Run workflow**

---

## PRISM Portal Setup (Cloudflare Pages + Worker)

To enable the live interactive briefing page:

### 1. Deploy Cloudflare Pages
- Connect your PRISM GitHub repo to Cloudflare Pages
- Build command: *(none — static files)*
- Output directory: `/briefings`
- Custom domain: `prism.yourdomain.com`

### 2. Deploy the Feedback Worker
```bash
cd worker
npm install -g wrangler  # if not installed
wrangler login
wrangler secret put PRISM_GITHUB_TOKEN   # GitHub PAT with repo write scope
wrangler secret put PRISM_GITHUB_REPO    # e.g. "raclettemeister/prism"
wrangler secret put PRISM_FEEDBACK_SECRET
wrangler deploy
```

### 3. Configure environment variables
Set in your repo's GitHub Actions secrets:
- `PRISM_PORTAL_URL=https://prism.yourdomain.com`
- `FEEDBACK_WORKER_URL=https://prism-feedback.your-subdomain.workers.dev`
- `PRISM_FEEDBACK_SECRET=your-random-secret`

Set the same `PRISM_FEEDBACK_SECRET` as a Cloudflare Worker secret.

---

## Feed Categories

| Category | Weight | Tier | Notes |
|---|---|---|---|
| `ai_builder` | 1.0 | **1** | Every/Shipper, Casel, Yegge, Osmani — always read |
| `ai_tools` | 1.0 | 2 | Latent Space, Simon Willison, HuggingFace, HN launches |
| `nocode` | 1.0 | 2 | Lovable, Bolt.new/StackBlitz, Windsurf/Codeium, Replit |
| `ai_labs` | 0.95 | 2 | OpenAI, Anthropic, Google AI |
| `ai_news` | 0.90 | 2 | The Decoder, VentureBeat, Import AI |
| `ai_thinkers` | 0.90 | 2 | Chip Huyen, Sebastian Raschka, Swyx |
| `geopolitics` | 0.90 | 2 | Project Syndicate, Noah Smith, Adam Tooze, FT |
| `economist` | 0.90 | **1** | 7 Economist section feeds |
| `europe_politics` | 0.85 | 2 | Politico EU, EUobserver, DW Europe, France24 |
| `github_trending` | 0.85 | 2 | Daily GitHub Trending |
| `indie_founders` | 0.80 | 2 | Pragmatic Engineer, Lenny, PG essays, HN, TechCrunch |
| `ft_sections` | 0.80 | **1** | FT World, Economy, Opinion, Climate |
| `eu_think_tanks` | 0.80 | 2 | The Diplomat |
| `europe_tech` | 0.75 | 2 | Tech.eu, Brussels Morning, Politico Tech |
| `tech_communities` | 0.75 | 2 | Lobste.rs AI + ML tags |
| `global_quality` | 0.75 | 2 | BBC World, Al Jazeera |
| `big_picture` | 0.60 | 2 | Exponential View, Stratechery, HN best (incl. builder queries) |
| `gamedev` | 0.70 | 2 | Game Developer, GamesIndustry.biz, Godot, itch.io |
| `creative_ai` | 0.70 | 2 | ArsTechnica AI, The Verge AI, Wired |
| `meta_philosophy` | 0.55 | 2 | LessWrong, Scott Alexander, FS Blog, Palladium, Noema |

**Tier 1 sources** within categories (Economist, FT, adamtooze, noahpinion, oneusefulthing, pragmaticengineer, simonwillison, latent.space) are always read regardless of category weight.

### Known feed limitations

**Reddit RSS is blocked (HTTP 403).** Do not add `reddit.com` RSS feeds.

**Some Substack newsletters block RSS.** The `ai_builder` feeds use best-guess URLs — PRISM's Feed Health Report will flag 404s for cleanup.

---

## Architecture

See [`ARCHITECTURE.md`](ARCHITECTURE.md) for the full technical breakdown.

```
src/
├── index.js          — Pipeline orchestrator (9 steps, parallel execution)
├── config.js         — TRUST_TIERS, feeds, models, prompts, limits
├── context.js        — Clone MylifeOS, generate life-context.md
├── collect.js        — RSS fetcher + deduplication
├── classify.js       — Trust Tier classification (NEW — replaces score.js)
├── webintel.js       — Proactive web intelligence (NEW — parallel with classify)
├── read.js           — Select 30 articles, fetch full text
├── synthesize.js     — Parallel Call A + Call B synthesis (NEW — replaces research.js)
├── page.js           — HTML briefing + feedback UI generator (NEW)
├── validate.js       — Anti-hallucination checker
├── deliver.js        — Email via Resend + live page link
├── deepdive.js       — On-demand deep research
└── email-template.js — HTML email renderer

worker/
├── feedback.js       — Cloudflare Worker: feedback → GitHub API (NEW)
└── wrangler.toml     — Worker deployment config (NEW)

data/
├── life-context.md   — Daily context snapshot (from MylifeOS)
├── news-interests.md — Interest profile (edit in Obsidian)
├── web-intelligence.md — Proactive web intel output (NEW, daily)
├── memory.json       — Persistent memory (feed health, topic freq, source ratings)
├── feedback-latest.json — Structured feedback from portal (NEW)
└── feedback-latest.md — Legacy markdown feedback (still supported)

briefings/
├── YYYY-MM-DD.md     — Daily briefing markdown
└── YYYY-MM-DD.html   — Daily briefing HTML + feedback UI (NEW)
```

---

## License

Private. Not for distribution.
