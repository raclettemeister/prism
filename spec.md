# PRISM Product Spec

PRISM is Julien's daily oversight briefing system.

## Core product rule

PRISM must do two things well:

1. keep oversight across all important domains every day
2. go deep on exactly one domain each run

It should not try to produce full-depth coverage for every domain every morning.

## The 4 domains

- `dev`
- `grassroot`
- `game`
- `geo_eu`

These rotate in a rolling cycle. A scheduled theme can be overridden only by a major direct-impact event. If overridden, the scheduled theme is deferred, not skipped.

## Briefing contract

Every daily briefing must contain exactly:

1. `THE SIGNAL`
2. `MUST-READS`
3. `ACTION AUDIT`
4. `CROSS-DOMAIN RADAR`
5. `THEME OF THE DAY`
6. `TODAY'S PRIORITIES`
7. `NEXT 3 DAYS`

## Personalization

Daily personalization comes from:

- `data/life-context.md`
- `data/news-interests.md`

## Feedback model

PRISM no longer treats an HTML portal as its self-improvement loop.

The improvement loop is conversational and editorial:

- Julien reads the briefing
- Julien critiques it in Cursor/Codex
- prompts, rules, or code are updated deliberately

PRISM does not auto-learn from structured per-article portal reactions anymore.
