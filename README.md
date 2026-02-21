# PRISM — Personal Research Intelligence System

An overnight AI analyst that reads ~100 RSS feeds while you sleep and emails you a structured intelligence briefing every morning.

**Current version: v3.3** — All Claude Sonnet 4.6, 1M context window, web search, email delivery via Resend.

---

## What It Does

Every night at 3:00 UTC (4 AM Brussels time), PRISM runs on GitHub Actions:

1. **Context** — Clones your personal vault (MylifeOS) to understand what you're working on today
2. **Collect** — Fetches ~100 RSS feeds across 19 categories (AI, geopolitics, Europe tech, game dev, founders…)
3. **Score** — Claude Sonnet rates every article 0–10 against your interest profile in batch mode
4. **Read** — Selects the top 80 articles by score + category diversity, fetches their full text
5. **THE BIG CALL** — One massive Claude Sonnet call with 1M context + web search synthesizes the complete briefing
6. **Validate** — A second Claude pass checks for hallucinations and unsourced claims
7. **Deliver** — HTML email lands in your inbox via Resend
8. **Push** — Briefing committed to this repo; feedback template pushed back to your vault

Cost: ~$0.80–$1.50/night depending on article volume and web searches.

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

# Test collection only (no API scoring calls, no email)
npm test

# Full run
npm start
```

Your briefing is saved to `briefings/YYYY-MM-DD.md`.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | ✅ Yes | Your Anthropic API key — used for all Claude calls |
| `RESEND_API_KEY` | For email | Resend API key — if missing, briefing is saved but not emailed |
| `MYLIFEOS_REPO` | For context | Your personal vault repo, as `username/repo-name` |
| `MYLIFEOS_PAT` | For context | GitHub Personal Access Token with `repo` read scope |

Without `RESEND_API_KEY`: the briefing is generated and saved to `briefings/`, but not emailed.

Without `MYLIFEOS_REPO` + `MYLIFEOS_PAT`: PRISM falls back to the existing `data/life-context.md` and `data/news-interests.md` files in this repo. Edit those files directly to configure your interests.

---

## Configuration

Everything lives in two places:

### `src/config.js` — Technical settings
- **Feed list**: 19 categories, ~100 RSS feeds. Add/remove feeds here.
- **Model selection**: All currently use `claude-sonnet-4-6`.
- **Scoring thresholds**: `SCORING.minScore`, `SCORING.topN`, pre-filter keywords.
- **Prompts**: `SCORING_PROMPT` and `RESEARCH_PROMPT` — the full instructions sent to Claude.

### `data/news-interests.md` — What you care about
Plain-language description of your interests, projects, and what to ignore. Claude reads this to score and write your briefing. Edit freely — it's just text.

### `data/life-context.md` — Your current context
Auto-generated from MylifeOS if configured, or write it manually. Tells PRISM what you're building, your priorities this week, your stack. Updated each run.

---

## Feedback Loop

After each run, PRISM writes `data/feedback-template.md` and pushes it to your vault as `Journal/prism-feedback.md`. Before the next run, it reads that file back.

To give feedback:
1. Open `prism-feedback.md` in Obsidian
2. Rate the briefing, mark articles as loved/irrelevant, add notes
3. PRISM reads it on the next run and adjusts

---

## Automated Nightly Runs (GitHub Actions)

The workflow in `.github/workflows/nightly.yml` runs every night at 3:00 UTC.

**Setup:**
1. Push this repo to GitHub (private)
2. Go to **Settings → Secrets and variables → Actions**
3. Add secrets:
   - `ANTHROPIC_API_KEY`
   - `RESEND_API_KEY` (optional — for email delivery)
   - `MYLIFEOS_REPO` (optional — e.g. `yourname/mylifeos`)
   - `MYLIFEOS_PAT` (optional — GitHub PAT with repo read access)
4. The workflow runs automatically. You can also trigger manually: **Actions → PRISM Nightly Briefing → Run workflow**

The workflow commits briefings and memory back to this repo after each run.

---

## Feed Categories

| Category | Weight | Notes |
|---|---|---|
| `ai_tools` | 1.0 | Latent Space, Simon Willison, HuggingFace, HN launches… |
| `ai_labs` | 0.95 | OpenAI, Anthropic, Google AI |
| `ai_news` | 0.9 | The Decoder, VentureBeat, Import AI… |
| `ai_thinkers` | 0.9 | Chip Huyen, Sebastian Raschka, Swyx… |
| `nocode` | 0.95 | Replit, Val.town |
| `indie_founders` | 0.8 | Pragmatic Engineer, Lenny, PG essays, HN, TechCrunch… |
| `gamedev` | 0.7 | Game Developer, GamesIndustry.biz, Godot, itch.io |
| `creative_ai` | 0.7 | ArsTechnica AI, The Verge AI, Wired… |
| `europe_tech` | 0.75 | Tech.eu, Brussels Morning, Politico Tech |
| `big_picture` | 0.6 | Exponential View, Stratechery, MIT Tech Review, HN best |
| `github_trending` | 0.85 | Daily GitHub Trending (all languages) |
| `tech_communities` | 0.75 | Lobste.rs AI + ML tags |
| `geopolitics` | 0.9 | Project Syndicate, FT, Noah Smith, Tyler Cowen, Adam Tooze… |
| `economist` | 0.9 | 7 Economist section feeds |
| `ft_sections` | 0.8 | FT World, Economy, Opinion, Climate |
| `eu_think_tanks` | 0.8 | The Diplomat |
| `europe_politics` | 0.85 | Politico EU, EUobserver, DW Europe, Guardian Europe, France24 |
| `global_quality` | 0.75 | BBC World, Al Jazeera, FT home |
| `meta_philosophy` | 0.55 | LessWrong, Scott Alexander, FS Blog, Palladium, Noema… |

**Category weight** multiplies the raw article score — higher weight = higher final score for articles from that category.

### Known feed limitations

**Reddit RSS is blocked (HTTP 403).** Reddit blocks anonymous RSS access. There are no workarounds without OAuth credentials. Do not add `reddit.com` RSS feeds — they will always return 403. Replaced with Lobste.rs.

**Some Substack newsletters block RSS.** Only Substacks with custom domains work reliably (e.g. `noahpinion.blog`, `slowboring.com`). The `substack.com/feed` format is frequently blocked.

---

## Architecture

See [`ARCHITECTURE.md`](ARCHITECTURE.md) for a detailed breakdown of each module.

```
src/
├── index.js          — Pipeline orchestrator (8 steps)
├── config.js         — All feeds, prompts, models, scoring settings
├── context.js        — Clones MylifeOS, generates life-context.md
├── deepdive.js       — On-demand deep research on specific topics
├── collect.js        — RSS fetcher + deduplication (URL + title similarity)
├── score.js          — Batch Claude scoring with pre-filter
├── read.js           — Select top 80, fetch full article text
├── research.js       — THE BIG CALL (Sonnet + 1M context + web search)
├── validate.js       — Anti-hallucination checker
└── deliver.js        — HTML email via Resend

data/
├── life-context.md   — Auto-generated daily context snapshot
├── news-interests.md — Your interest profile (edit this)
├── memory.json       — Persistent memory across runs
├── feedback-latest.md — Feedback read on next run
└── feedback-template.md — Template written after each run

briefings/
└── YYYY-MM-DD.md     — Daily briefing output (committed to git)
```

---

## License

Private. Not for distribution.
