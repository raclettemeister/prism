<!-- PRISM Life Context — Auto-generated 2026-02-18T10:54:31.216Z -->
<!-- Source: context-note.md + LOG (3d) + 13 recent files -->
<!-- Model: claude-sonnet-4-5-20250929 -->
# LIFE CONTEXT SNAPSHOT — Julien

**Generated:** 2026-02-18
**For:** PRISM v2.0 intelligence briefing personalization

---

## RIGHT NOW

Julien is 6 days away from public launch (Feb 23). Two major specs completed today: PRISM v2.0 upgrade (50 articles, multi-pass architecture, 10x budget increase to €2.50/night) and Nightbot v1 (automated MylifeOS maintenance bot). Both are ready for autonomous execution in fresh Cursor sessions. The core challenge right now: figuring out what to ask of PRISM at 900K tokens vs 90K. MylifeOS underwent major cleanup — CLAUDE.md rewritten, new CURRENT.md file created, stale content removed, Operation Exit renamed to Operation Autonomy throughout the system.

---

## THIS WEEK

**Launch priorities (from Julien's own words):**
- Full text/voice pass on julien.care — "no infrastructure, no features, just the words"
- Clean finish of first game for publication Sunday
- Scale PRISM 90K→900K tokens (10x improvement) — **key task: FIND what to ask of it**
- Think pass on why 2 blogs, what they're for, why different

**Explicitly NOT this week:** Letta sync, new tools, agent frameworks, dashboard tinkering, new GitHub repos.

**Active projects:**
- **PRISM v2.0** — Spec complete, ready to build. New architecture: individual Haiku analysis per article → Sonnet cross-reference → synthesis → anti-hallucination validation. Adds 35 new feeds (50 total), removes 10 dead ones. Fixes Feb 18 hallucination bug (invented "parse error").
- **Nightbot v1** — Spec complete, ready to build. Runs 5 AM CET via GitHub Actions. Auto-fixes LOG.md gaps, flags stale STATUS.md/CURRENT.md, checks cross-file consistency, sends health report via ntfy. Budget: ~$0.05/night.
- **Staffing Calendar System** — Live but not viable. 90% deployed Feb 16-17 across 3 marathon sessions. Full Google Calendar ↔ Notion sync working, 2-month lookahead built, WhatsApp formatting complete. Still needs: Pointage DB sharing fix, auto-planning validation, planning grid UX, mobile access, general polish.
- **The Dishwasher Generation** (Substack) — 3 interconnected posts drafted, skeleton complete. Goal: 1000 paid subscribers ASAP. Public launch Feb 23.
- **julien.care** — Needs full polish pass before launch. Newsletter infrastructure complete (Resend + Supabase, domain warming).

---

## PRIORITIES & STRUGGLES

**Key insight driving this season:** "Start being public, start being a voice on internet now. Time on the web beats timing the web."

**The 10x PRISM challenge:** Budget is solved (€2.50/night is acceptable), architecture is designed, feeds are expanded. The bottleneck is conceptual: **what questions does a 900K token briefing answer that a 90K token briefing can't?** This is the critical thinking work for this week.

**Commitment imbalance (from Feb 15 mapping):** 14 active commitments across 5 tiers. Tier 1 (non-negotiable: Lucia, health, Poncho, family, disciplines) is undertended. Tier 3 (creative projects) gets most energy. Currently 70/30 work/life instead of target 50/50.

**Cognitive debt awareness:** Single-task creativity (writing, designing) energizes. Multi-project vibe-coding and automation specs burn out. This matters for how he plans AI work.

**Two blogs question (open):** julien.care = friend blog (intimate, personal, analog-feeling). The Dishwasher Generation = professional voice (ideas, frameworks, analysis). The boundary isn't fully clear yet. Needs thinking pass this week.

**Emerging interest:** Physical products — furniture building, new leash design for Poncho. Exploring how AI can help design/build physical things.

---

## BUSINESS

**Chez Julien status:** Operation Autonomy (renamed from Operation Exit Feb 18). Goal: shop runs without Julien's daily involvement. Not selling anymore — pushing toward full autonomy with Henry as potential manager.

**Staffing cycle in progress (Feb 16-22):** Jeanne added as new team member (waiting on internship schedule). Henry full availability, Lucas full availability. New WhatsApp automation working: planning + 2-month lookahead combined into one clipboard message with emoji formatting.

**Henry development path:** 24 years old, 4 months in, showing strong growth. Wants manager role. Needs training but is invested. Lucas (part-time, age 24) is good with customers but conserves cognitive energy for his own projects (creative agency, sound/light work). The goal: flip their roles — Henry on thinking/cognitive work, Lucas on customer-facing only.

**Team meeting Feb 4:** Foundation-laying conversation completed. Next: "The Big Meeting" (target Feb 14, but hasn't happened based on logs) for full role restructure.

**Financials:** ~€500K annual sales, very high profitability. 48% building ownership (18-year loan).

---

## TOOLS & STACK

**Hardware:** Mac Mini 16GB RAM (primary and only workstation). Runs Cursor + Claude Cowork. MacBook Pro 2019 removed from setup Feb 18 (never worked as planned).

**MylifeOS:** On GitHub (raclettemeister/MyLifeOS, private). Obsidian Git auto-sync every 30 min. Moved off iCloud Feb 14 to solve deadlocks.

**Active infrastructure:**
- **PRISM** — GitHub Actions, 4 AM CET, reads 45+ RSS feeds, emails briefing. v1.3 live, v2.0 spec ready to build.
- **Staffing system** — HTML dashboard + Cloudflare Worker (`chez-julien-staffing.old-morning-a434.workers.dev`). Connects to 3 Notion DBs + 2 Google Calendars. Service account: `staffing-sync@chez-julien-staffing.iam.gserviceaccount.com`.
- **Letta agents** — 3 agents built Feb 15 (Brain, Coach, Queue) with shared memory blocks at app.letta.com. Not actively used since building. Sync automation parked.
- **Zapier** — 3 live: Morning Nudge (8:30 AM), Google Review Alert, Weekly Planning Reminder (Sunday 7 PM). PRISM context-note reminder (8:30 PM via ntfy).
- **Newsletter** — Resend + Supabase. Edge Function for subscribe form. Domain warm-up in progress.

**Models:** Claude Sonnet 4.6 for autonomous execution, Haiku for batch analysis (PRISM v2.0 architecture).

**Current bottleneck:** "Ideas, never hardware." Principle: maximize AI utilization — if a machine is idle, it should be working.

---

## LIFE

**Lucia:** Girlfriend, artist. Currently at International Yehudi Menuhin Foundation (MUS-E programme). **Quitting May 1, 2026** to go self-employed (teaching art, selling her own art). This is a major transition requiring Julien's time and money support. Meeting anniversary: 27th of each month. Birthday: Jan 13. Yearly anniversary: Apr 27.

**Poncho:** Australian Shepherd, born June 2023 (2.5 years old).

**Energy/health:** Disciplines mostly unchecked daily (meditation, stretching, dancing, guitar). Self-assessed 70/30 work/life vs target 50/50. Restorative menu practice when tired (not screens).

**Upcoming key date:** **Feb 23 (5 days)** — public launch of julien.care, game, and The Dishwasher Generation. This is when stealth phase ends.

**Weekly rhythm:** Morning check-in with AI, shutdown ritual enables "Reynolds Mode" (work forbidden, full presence for Lucia). Weekly plans in Journal/Weekly/ (latest: 26-02-16 value plan + business plan — gentle reset week, only 2 priorities).

---

## INTELLIGENCE BRIEFING RELEVANCE

**High-signal topics:**
- AI agent frameworks, autonomous execution patterns, token budget optimization strategies
- Substack monetization case studies, newsletter growth tactics (European audience)
- Physical product design + AI (furniture, consumer products)
- Google Calendar API + Notion integration patterns
- Cloudflare Workers architecture, cron trigger optimization
- GitHub Actions workflow design, automated maintenance bots
- RSS feed curation for AI/tech space (PRISM v2.0 expansion)
- Founder autonomy strategies, business operation handoff case studies
- Anti-hustle culture movement, European tech scene (Dishwasher Generation positioning)

**Low-signal topics:**
- Cryptocurrency, blockchain, web3
- Enterprise SaaS marketing
- US-centric startup advice (he's in Brussels, different ecosystem)
- Mobile app development (not current focus)
- Social media growth hacks (he's anti-algorithm-gaming)

**Key people/sources he follows:** Information in Substack feeds processed by PRISM. Uses Readwise for learning. Follows AI space via ideas/tools/possibilities, not code.

**Communication style:** Direct, honest, systems-thinking. Values specificity over abstraction. Prefers "what actually happened" over "what should happen." Tracks everything in markdown.

---

**END SNAPSHOT**