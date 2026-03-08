# PRISM Architecture

## Overview

PRISM v5.0 is built around one product rule:

**daily oversight across all domains, depth on one domain only**

The system no longer tries to generate a full magazine every morning, and it no longer relies on an HTML feedback portal.

## Run flow

```text
context
  -> deepdive
  -> collect
  -> [classify + webintel]
  -> read
  -> synthesize
  -> validate
  -> deliver
```

## The 4-theme cycle

PRISM rotates through:

1. `dev`
2. `grassroot`
3. `game`
4. `geo_eu`

Cycle state lives in `data/memory.json`:

```json
{
  "themeCycle": {
    "order": ["dev", "grassroot", "game", "geo_eu"],
    "nextIndex": 0,
    "lastTheme": null,
    "lastThemeDate": null,
    "lastOverrideReason": null
  }
}
```

Rules:

- `order[nextIndex]` is the scheduled theme
- the cycle advances only after a successful run that used the scheduled theme
- override days do not advance the cycle
- the `NEXT 3 DAYS` section is derived from the scheduled cycle, not from external events

## Briefing contract

The synthesizer must produce exactly these 7 sections:

1. `## 🔴 THE SIGNAL`
2. `## 📚 MUST-READS`
3. `## ⏪ ACTION AUDIT`
4. `## 🧭 CROSS-DOMAIN RADAR`
5. `## 🧠 THEME OF THE DAY`
6. `## 🎯 TODAY’S PRIORITIES`
7. `## ⏭️ NEXT 3 DAYS`

`src/briefing-format.js` is the hard guardrail for:

- section extraction
- section ordering
- legacy-section rejection
- count constraints for must-reads, radar lines, and priorities

## Theme mapping

Theme routing is explicit in `src/config.js`.

- `dev`:
  - `ai_builder`
  - `ai_tools`
  - `nocode`
  - `indie_founders`
  - `github_trending`
  - builder/tool web intelligence
- `grassroot`:
  - `grassroot_scout`
  - cooperative/community/funding search results
- `game`:
  - `gamedev`
  - `gamedev_ai`
  - `creative_ai`
- `geo_eu`:
  - `geopolitics`
  - `economist`
  - `ft_sections`
  - `europe_politics`
  - `global_quality`
  - Brussels/EU business and regulatory web intelligence

## Web intelligence

`src/webintel.js` guarantees two things every day:

- one query per theme for oversight
- two extra queries for the scheduled theme

This is what makes `CROSS-DOMAIN RADAR` deterministic instead of accidental.

## Scout behavior

The heavy Grassroot scout run is conditional:

- run it on scheduled `grassroot` days
- run it on `grassroot` override days
- do not run it on other days

On non-Grassroot days, the Grassroot radar line comes from normal collection + web intelligence only.

## Delivery and feedback

PRISM no longer depends on:

- `page.js`
- the feedback worker
- Cloudflare Pages deployment
- interactive portal reactions

The daily email is now the primary reading surface.

The product-improvement loop is external to the run:

- review the briefing
- discuss it in Cursor/Codex
- change code or editorial rules intentionally

Runtime personalization still comes from `data/news-interests.md` and `data/life-context.md`.

## Testing

`npm test` runs deterministic unit tests for:

- theme-cycle advancement
- override deferment
- the 7-section briefing contract

The pipeline dry run remains available as `npm run test:dry-run`, but it is no longer the primary test mechanism.
