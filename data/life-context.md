<!-- PRISM Life Context — Auto-generated 2026-02-24T07:38:13.463Z -->
<!-- Source: context-note.md + LOG (3d) + 13 recent files -->
<!-- Model: claude-sonnet-4-6 -->
# LIFE CONTEXT SNAPSHOT — PRISM
**Generated:** 2026-02-24 | **Subject:** Julien

---

## 1. Right Now

Julien is consolidating his AI development workflow around **Cursor + Superpowers skill set + custom skills/rules** as his primary "cockpit" — the metaphor he uses for the harness/environment/architecture/workflow stack that produces reliable AI output. The cockpit is functional but imperfect: AI still sometimes skips steps in the Superpowers chain and multi-pass thinking is hard to enforce. He's actively iterating on this. Blog launch is delayed by a few days — he's not bothered by it.

---

## 2. This Week — Active Projects

**The Cockpit** *(hottest project — multiple sessions this week)*
- Settled on Cursor + Superpowers + custom skills as the stack (away from Roo Code, which was costing €60-100+/day on Claude Opus)
- Built `cockpit-repass` skill: wraps Superpowers with 3 challenge gates (Design Challenge → Plan Quality Check → Review Repass), each with a "push back once, then respect" rule
- Rewrote `cockpit-core.mdc` to 18 lines — lean, personalized, no generic engineering advice
- Known gap: Cursor's `.mdc` rules aren't hard enforcement (AI can skip steps). Researched 3 enforcement options: Custom Modes with tool restrictions (Planner = read-only, Executor = full access), Claude Code Hooks (PreToolUse, exit code 2, deterministic), Cursor Plan Mode (Shift+Tab, weakest)
- **Next step:** Set up Custom Modes (Cockpit Planner + Cockpit Executor), test full chain with repass skill for one week
- Documentation updated: Cursor config README, first-week cheatsheet, superpowers-vs-cockpit comparison doc

**Mixtapes Project** *(active — several entries updated 2026-02-23)*
- New entry: `04-buena-vista-social-club.md`
- Refined: `01-jazz-mess-around.md`, `02-woodstock.md`, `03-queen-live.md`, `CALIBRATION.md`, `STATUS.md`

**Blog — julien.care** *(minor delay)*
- Launch delayed by a few days. Julien is fine with it. Not a crisis.

**Julien & Lucia — Creative Projects** *(new folder created 2026-02-22)*
- First project: **All We Got Is Weeks** — workshop where participants see life as a ~4,160-week grid, paint their past in watercolors, decide what to color next
- Folder created, STATUS.md written, added to master project table

**Chez Julien Simulator** *(FINISHED — confirmed 2026-02-22)*
- Complete and shipped.

**Sweden Odyssey** *(demo finished)*
- Demo in presentable state. First real test of learning to code properly (not vibing). Collaborative project with friends.

**Sales Data — Chez Julien** *(new, just started)*
- Data gathering and extrapolation of shop sales on business computer. Business intelligence for GPFC srl.

**RenPy Game Creation** *(postponed ~1 week)*
- Exciting but deliberately deferred. Julien wants to think carefully about what cockpit/architecture to use before starting.

**Physical Products** *(thinking phase)*
- Furniture building, new leash design for Poncho, 3D printer exploration. Interest in AI-assisted physical design. No active build yet.

**Shop Sale Prospecting** *(planned — not yet started)*
- Will do a deep research session to find prospects for selling the retail shop. Focus: chains and centralized kitchens. Already has a multi-cheese place owner interested.

**System Audit** *(completed 2026-02-22)*
- 13 bugs found and fixed across MyLifeOS: STATUS files corrected, orphaned scripts archived, dead spec links fixed, PRISM version corrected (v2.0 not v3.0), AGENT.md slimmed 220→120 lines

**MyLifeOS Documentation** *(completed 2026-02-21)*
- 8 foundation files created. System is now fully documentable for cold AI sessions.

**NOW Page Bot** *(v1.0 live — 2026-02-21)*
- First successful end-to-end run (Run #8). 7 output problems identified and documented for next iteration.

---

## 3. Priorities & Struggles

**What matters most:**
- Getting the cockpit to actually enforce the Superpowers chain (not just suggest it)
- Multi-pass thinking: hard to get AI to do multiple challenge passes on the same problem — this is the core friction he named explicitly
- Cockpit Custom Modes setup is the immediate next concrete action

**Known struggles:**
- AI skips steps in the chain even when `.mdc` rules exist — passive rules ≠ enforcement
- Cost discipline: Roo Code was the best harness found so far but unsustainable at €60-100/day. Cursor is cheaper but weaker on enforcement. The tradeoff is live.
- Blog delay: minor, self-acknowledged, not a problem

**What he's thinking about but not acting on yet:**
- RenPy game cockpit design (deliberately waiting)
- Physical products / 3D printing (exploration phase)
- Shop sale prospecting (research session planned, not done)

---

## 4. Business — Chez Julien

**Strategic direction:** Operation Autonomy (push shop toward full autonomy, develop Henry as managing officer — not selling for now, though shop sale prospecting is back on his radar as a parallel track).

**Team meeting (Feb 4):** Held. Frame delivered — Lucia quitting May 1, Julien stepping back, Henry offered soft manager path, Lucas asked to focus on sales. Monthly cadence established. Next big meeting: March 2026 (full role restructure).

**Henry:** Key person. Goal is autonomous manager. Young (24), invested, but lacks structure and reliability. Training in progress regardless of exit/autonomy decision.

**Lucas:** Good with customers, questionable reliability, part-time/full-time ambiguous. Sales focus is the ask.

**Staffing Calendar System:** Google Calendar ↔ Notion sync built and deployed (Cloudflare Worker). Setup guide and test run protocol documented. Worker runs every 30 minutes.

**Financial data project just started:** Sales data gathering and extrapolation on business computer.

**Shop sale prospect:** Multi-cheese place owner already interested. Deep research session on chains/centralized kitchens planned but not yet done.

---

## 5. Tools & Stack

| Layer | Current choice |
|---|---|
| Primary IDE/harness | Cursor |
| Workflow framework | Superpowers (14-skill chain) |
| Custom enforcement | cockpit-repass skill + cockpit-core.mdc (18 lines) |
| Enforcement gap | Custom Modes not yet set up (Planner/Executor) |
| Previous harness (abandoned) | Roo Code — best enforcement found, but €60-100+/day on Opus |
| Model preference | Claude (Opus for architecture/decisions, Sonnet for implementation) |
| Cost lesson learned | Opus justified for architecture; Sonnet sufficient for most execution |
| Vault system | MyLifeOS (Obsidian-style markdown vault) |
| Automation | NightCrawler (auto-logging), NOW Page Bot (v1.0 live), Cloudflare Workers |
| Intelligence briefing | PRISM (this system) |

---

## 6. Life

**Lucia:** Quitting her job May 1, 2026 to go self-employed (art teaching + her own art). Julien's commitment: support with time and money so she can bloom. Creative collaboration active — "All We Got Is Weeks" workshop is their first joint project. Monthly anniversary: 27th.

**Poncho:** Australian Shepherd, 2.5 years old. Leash redesign project in thinking phase.

**Energy/mood:** Not explicitly stated this snapshot, but tone is grounded and productive. Several major tasks closed (Simulator finished, system audit done, cockpit v0.3 designed), new projects opening at a controlled pace. No signs of cognitive overload flagged.

**Upcoming relevant dates:**
- Lucia quitting: May 1, 2026
- Next team meeting (The Big Meeting): March 2026
- Blog launch: imminent (days away)

---

*Snapshot confidence: HIGH on cockpit/tools layer, HIGH on project status, MEDIUM on business financials (data gathering just started, no fresh numbers). Julien's own words are the anchor — all supplementary data consistent with them.*