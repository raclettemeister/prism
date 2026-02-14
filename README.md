# PRISM — Personal Research Intelligence System (Mine)

An overnight AI research analyst that reads the internet while you sleep and delivers an intelligence briefing every morning.

## What It Does

Every night at 4 AM CET:
1. **Collects** ~50-100 articles from 9 RSS feeds (AI newsletters, Hacker News)
2. **Scores** each article for relevance using Claude Haiku
3. **Analyzes** the top 15 using Claude Sonnet — cross-referencing, pattern detection, project connections
4. **Synthesizes** a morning briefing in markdown

Cost: ~$1-2/night. Less than a coffee for a personal research team.

## Quick Start

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/prism.git
cd prism

# Install dependencies
npm install

# Set your Anthropic API key
cp .env.example .env
# Edit .env and add your key

# Dry run (test collection only, no API calls)
node src/index.js --dry-run

# Full run
node src/index.js
```

Your briefing will be saved to `briefings/YYYY-MM-DD.md`.

## Automated Nightly Runs

This repo includes a GitHub Actions workflow that runs every night.

To set it up:
1. Push this repo to GitHub
2. Go to Settings → Secrets and variables → Actions
3. Add a secret: `ANTHROPIC_API_KEY` = your key
4. The workflow runs automatically at 4 AM CET
5. You can also trigger it manually: Actions → PRISM Nightly Briefing → Run workflow

## Configuration

All settings are in `src/config.js`:
- RSS feeds to monitor
- AI model selection
- Scoring criteria and prompts
- Token budgets

## Architecture

```
src/
├── index.js       — Orchestrator (collect → score → analyze → synthesize)
├── config.js      — All feeds, prompts, and settings
├── collect.js     — RSS feed fetcher
├── score.js       — Haiku relevance scoring
├── analyze.js     — Sonnet deep analysis
└── synthesize.js  — Briefing writer

briefings/         — Output briefings (one per day)
data/memory.json   — Running context for continuity
```

## License

Private. Not for distribution.
