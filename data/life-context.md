<!-- PRISM Life Context — Auto-generated 2026-02-24T09:50:53.826Z -->
<!-- Source: context-note.md + LOG (3d) + 13 recent files -->
<!-- Model: claude-sonnet-4-6 -->
# LIFE CONTEXT SNAPSHOT — Julien
**Generated:** 2026-02-24

---

## 1. Right Now

Julien is consolidating his AI development cockpit around **Cursor + Superpowers skill set + custom skills/rules**, after a 48-hour sprint that produced the `cockpit-repass` skill and a leaner `cockpit-core.mdc`. His blog launch is delayed by a few days — he's fine with it. Energy is focused on tooling discipline and system architecture, not shipping product.

---

## 2. This Week — Active Projects

**The Cockpit (🔥 hottest)**
- Settled on Cursor + Superpowers as the primary harness. Not switching for now.
- Core problem identified: Superpowers chain (brainstorm → worktree → plan → TDD → review) doesn't hold — AI skips steps. `.mdc` rules alone don't enforce.
- Built `cockpit-repass` skill: 3 challenge gates (Design Challenge, Plan Quality Check, Review Repass) with "push back once, then respect" rule.
- Rewrote `cockpit-core.mdc` to 18 lines — lean, personalized.
- **Next step:** Set up Custom Modes in Cursor (Cockpit Planner = read-only, Cockpit Executor = full access). Test full Superpowers chain with repass skill for one week.
- Still looking for a better cockpit long-term. Multi-pass thinking on the same problem remains hard.

**julien.care Blog**
- Launch delayed a few days. Julien explicitly relaxed about it ("it's fine").
- Blog context files recently renamed (`blog-agent-context.md`, `blog-claude-context.md`) to prevent AI context contamination.

**MyLifeOS System Audit (just completed)**
- 13 bugs found and fixed on 2026-02-22: dead links, stale status files, orphaned scripts, wrong version numbers.
- Documentation foundation complete: 8 spec files created across Research Center, NightCrawler, Now Page Bot, Staffing Calendar, Automation 101.
- NOW Page Bot v1.0 end-to-end working as of 2026-02-21 (Run #8). 7 output problems documented for next iteration.

**Mixtapes Project (active)**
- Four entries created/refined in last 48h: Jazz Mess Around, Woodstock, Queen Live, Buena Vista Social Club.
- Calibration file updated.

**Chez Julien Simulator — SHIPPED**
- Finished and confirmed done.

**Sweden Odyssey (demo done)**
- Demo finished. First real test of "learning to code properly, not vibing." Collaborative with friends.

**Julien & Lucia — All We Got Is Weeks**
- New project folder created 2026-02-22.
- Concept: workshop where participants visualize life as ~4,160 weeks, paint the past with watercolors, decide what to color next.
- Captured in STATUS.md. Early stage.

**Renpy Game**
- Postponed at least one week. Julien is using the pause to think about what cockpit to use when he starts.

**Sales Data / Chez Julien Business Intelligence**
- New project started: data gathering and extrapolation of shop sales from business computer.

**Physical Products (background interest)**
- Furniture building, new leash design for Poncho, 3D printers. No active work yet — exploratory.

**Shop Sale Prospecting**
- Planning a deep research session to find buyers: chains and centralized kitchens primarily. One multi-cheese place owner already interested.

---

## 3. Priorities & Struggles

**What matters most:**
- Getting the Cockpit to actually enforce the Superpowers chain (not just suggest it). Custom Modes in Cursor is the next concrete test.
- Multi-pass thinking remains the hardest unsolved problem — Julien explicitly flags this. The AI still tends to execute after one pass rather than iterate.
- Blog launch: low urgency this week, but not forgotten.

**What's hard:**
- AI skipping steps in the Superpowers chain even with `.mdc` rules in place. Proven failure caught live in a PRISM session.
- Cost discipline: learned last week that Opus 4.6 burned €60-70 in one day on Roo Code. Cursor is cheaper but chain enforcement is weaker. This tradeoff is a live tension.
- Orderliness (self-acknowledged weak point) — system audit and documentation blitz suggests he's actively compensating.

**What he's avoiding / parked:**
- Renpy game (deliberately delayed, not abandoned).
- Physical products (interest level, no action yet).
- Newsletter system, Lindy Hop Lab, Meditation App, julien.care app — all lower urgency.

---

## 4. Business — Chez Julien

**Strategic direction:** Operation Autonomy. Goal is shop running without Julien's daily involvement. Previous plan (Operation Exit / sell) is archived but not fully abandoned — Julien is now actively researching sale prospects (chains, centralized kitchens) in parallel. One interested buyer already identified.

**Team:**
- **Henry** — full-time, invested, wants manager path. Feb 4 team meeting gave him the soft manager pitch. Still 24, lacks structure, needs development regardless of outcome. Autonomy plan depends on him.
- **Lucas** — part-time/questionable status. Good with customers. Asked to focus on sales and the floor.
- Feb meeting framing: Lucia quitting May 1 used as concrete reason for Julien stepping back. Next big meeting planned for March (full role restructure).

**Operations:**
- Staffing Calendar System: Google Calendar ↔ Notion sync built and deployed. Worker running on 30-minute cron. Red day alerts via ntfy. System appears live and functional.
- Sales data project just started — business intelligence from shop computer.

**Financials:** P&L and balance sheet files exist. No new financial data points surfaced this week.

---

## 5. Tools & Stack

| Layer | Tool |
|---|---|
| Primary AI harness | Cursor + Superpowers extension |
| Custom enforcement | `cockpit-repass` skill (3 challenge gates), `cockpit-core.mdc` (18-line lean rules) |
| Models in use | Claude (primary); Opus for architecture/complex decisions, Sonnet for implementation |
| Automation / logging | NightCrawler (auto-logs vault activity) |
| Now Page | Now Page Bot v1.0 (GitHub Actions → vault → deploy) |
| Business ops | Cloudflare Worker + Notion + Google Calendar + ntfy |
| Previously used | Roo Code (best enforcement, hard gates, but €60-100+/day — abandoned for cost) |
| Looking for | Better cockpit: harness + environment + architecture + workflow that enforces chain without burning budget |

**Key insight active in his mind:** Roo Code had perfect hard-gate enforcement (Architect mode → Code mode, no skipping). Cursor is cheaper but soft. Custom Modes (tool restriction per mode) are the closest Cursor equivalent. This is the experiment for the coming week.

---

## 6. Life

**Lucia:**
- Quitting her job May 1, 2026. Julien explicitly committed to supporting her with time and money.
- "Julien & Lucia" creative project folder just created — first collaborative concept (All We Got Is Weeks workshop) captured.
- Meeting anniversary: 27th of each month (next: 2026-02-27, in 3 days).

**Poncho:** No specific notes this week. Leash redesign is a background interest.

**Health/energy:** No explicit signals this week. No restorative menu mentions. Activity log shows late-night work sessions (10pm-midnight range consistently).

**Dancing:** Dancing session skill exists and is well-developed (Lindy Hop coaching, spaced repetition, LOG tracking). Not explicitly mentioned in recent activity — may be running quietly in background.

**Guitar:** Guitar coach skill exists. Not mentioned in recent 3-day log.

---

*Snapshot confidence: HIGH on Cockpit/tooling state, HIGH on business direction, MEDIUM on energy/mood (no explicit signals). Blog delay explicitly downplayed by Julien — treat as resolved.*