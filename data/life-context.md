<!-- PRISM Life Context — Auto-generated 2026-02-24T06:16:28.120Z -->
<!-- Source: context-note.md + LOG (3d) + 13 recent files -->
<!-- Model: claude-sonnet-4-6 -->
# LIFE CONTEXT SNAPSHOT — Julien
**Generated:** 2026-02-24 | **Next update:** ~2026-02-27

---

## 1. RIGHT NOW

Julien has settled on **Cursor + Superpowers skill set + custom skills/rules** as his primary AI cockpit after a dense 3-day build sprint. The blog launch is delayed by a few days — he's relaxed about it. Energy appears high and focused: he's in a systems-building mode, not a vibe-coding mode, and the distinction matters to him. The cockpit work is producing real discipline infrastructure, not just documentation.

---

## 2. THIS WEEK — ACTIVE PROJECTS

**The Cockpit (v0.3 — primary focus)**
- Settled on Cursor + Superpowers as the permanent harness (Roo Code ruled out — €60-100/day on Opus was too expensive)
- Core problem identified: AI skips Superpowers chain steps (brainstorming triggers, then jumps straight to code, bypassing worktree → plan → TDD → review)
- Built `cockpit-repass` skill: multi-pass co-pilot with 3 challenge gates (Design Challenge, Plan Quality Check, Review Repass)
- Rewrote `cockpit-core.mdc` to 18 lean lines — just identity, pointer to cockpit-repass, session discipline
- **Next step:** Set up Custom Modes in Cursor (Cockpit Planner = read-only / Cockpit Executor = full access) — closest equivalent to Roo Code's hard mode gates
- Known remaining pain: AI sometimes still implements automatically; getting multiple passes on same thinking is still hard

**julien.care Blog**
- Launch delayed by a few days. Julien is fine with this. Not a crisis.
- Blog context files recently renamed (`blog-agent-context.md`, `blog-claude-context.md`) to prevent AI context contamination

**Mixtapes Project**
- Active editing this week: 4 entries worked on 2026-02-23 (Jazz Mess Around, Woodstock, Queen Live, Buena Vista Social Club)
- STATUS.md and CALIBRATION.md updated

**MyLifeOS System Audit (complete)**
- 13 bugs found and fixed on 2026-02-22: dead links, wrong version numbers, orphaned scripts, missing folders, broken paths
- Documentation foundation now complete: 8 new SPEC files, `docs/README.md` as spec index
- NightCrawler operational; reports relocated to `Journal/Digests/`

**NOW Page Bot**
- v1.0 first successful end-to-end run (Run #8) on 2026-02-21
- 7 output problems documented and queued for v1.1 (raw markdown rendering, no FR translation, bullet cramming, manual publish required, etc.)
- Parked for now — not being touched this week

**Chez Julien Simulator**
- **FINISHED and shipped.** No further work.

**Sweden Odyssey**
- Demo finished. Collaborative project with friends. First real test of "learning to code properly, not vibing."

**Sales Data (Chez Julien)**
- New project started: data gathering and extrapolation of shop sales on the business computer. Business intelligence for GPFC srl.

**Julien & Lucia — "All We Got Is Weeks"**
- New project folder created 2026-02-22
- Concept: workshop where participants see life as ~4,160 weeks on a grid, paint their past with watercolors, decide what to color next
- Early concept stage only

**RenPy Game Creation**
- Excited about it but deliberately postponed at least one week
- Open question he's sitting with: what will the cockpit look like specifically for RenPy game creation?

**Physical Products (background interest)**
- Furniture building, new leash design for Poncho, 3D printers — exploratory, no active work

---

## 3. PRIORITIES & STRUGGLES

**What matters most right now:**
- Getting The Cockpit to actually enforce chain discipline (the AI skipping steps is the core unsolved problem)
- Custom Modes setup in Cursor is the immediate next action
- Blog launch — low stress, just needs to happen

**What's hard:**
- Multi-pass thinking: Julien explicitly flags that getting the AI to make multiple passes on the same problem is still difficult in his current setup
- Auto-implementation: AI sometimes still implements without going through the full checklist sequence
- The cockpit metaphor is right but the gates aren't hard enough yet (Roo Code had perfect enforcement; Cursor doesn't)

**What he's watching:**
- Cost discipline: Opus for architecture/complex decisions, Sonnet for implementation — this is now a named dimension of The Cockpit
- Always scanning for a better cockpit: harness + environment + architecture + workflow, not just prompting

**What's parked / not this week:**
- NOW Page Bot v1.1 fixes
- RenPy
- Physical products
- "All We Got Is Weeks" (concept captured, not being developed yet)

---

## 4. BUSINESS — CHEZ JULIEN

**Strategic direction:** Operation Autonomy — make the shop run without Julien's daily presence. Selling is the fallback, not the primary plan.

**Shop sale research:**
- Julien plans a deep research session to find prospects for selling the retail shop — focused on chains and centralized kitchens
- Already has a multi-cheese place owner interested
- This is live strategic optionality, not a committed exit

**Team:**
- **Henry** (full-time) — being developed toward managing/operating role. Feb 4 team meeting introduced the soft pitch: "manager path is open if you want it." Next big meeting: March 2026 (full role restructure conversation)
- **Lucas** (part-time/questionable) — good with customers, asked to focus on sales/floor. Has his own agency ambitions
- **The Big Meeting** (March) — planned agenda: full conversation on roles, Henry/Lucas division, development paths

**Operations:**
- Staffing Calendar System built and tested (Google Calendar ↔ Notion sync via Cloudflare Worker, cron every 30 min)
- Sales data project just started (business intelligence, running on shop computer)
- Monthly admin checklist: Fiddel closure, budget review, Liantis hours, strategic plan review

**Financials:**
- Building ownership: 48% stake, 18-year loan
- ~500K annual sales, high profitability
- No urgent financial flags visible in recent logs

---

## 5. TOOLS & STACK

| Layer | What he's using |
|---|---|
| **Primary cockpit** | Cursor + Superpowers extension + custom `.cursor/skills/` |
| **Custom skills active** | `cockpit-repass`, `dancing-session`, `guitar-coach`, `update-business-status`, `value-plan-review`, `weekly-business-plan` |
| **Global rules** | `cockpit-core.mdc` (18 lines, lean, personalized) |
| **Models** | Claude (Opus for architecture/decisions, Sonnet for implementation) |
| **Automation** | NightCrawler (auto-logging), NOW Page Bot (GitHub Actions → Cloudflare Pages) |
| **Vault** | MyLifeOS (Obsidian markdown), Notion (shop operations) |
| **Shop infra** | Cloudflare Worker, Google Calendar API, Notion API, ntfy push notifications |
| **Rejected** | Roo Code (too expensive at €60-100/day on Opus) |

**Enforcement gap being addressed:** Moving from passive `.mdc` rules (AI can ignore) to Custom Modes with tool restrictions (Planner mode = read-only + markdown only / Executor mode = full access). Claude Code Hooks (PreToolUse, exit code 2) identified as strongest enforcement option, not yet implemented.

---

## 6. LIFE

**Lucia:**
- Quitting her job May 1, 2026 to go self-employed (art teaching + selling her art)
- Julien is consciously building financial and time support capacity for this transition
- Creative collaboration beginning: "Julien & Lucia" project folder created, "All We Got Is Weeks" is first concept
- Monthly anniversary: 27th (coming up March 27)

**Poncho:**
- Australian Shepherd, ~2.5 years old
- Active project: new leash design (exploratory)
- Dancing session skill includes Poncho-aware scheduling

**Health / energy:**
- No explicit flags this week
- Lindy Hop / dancing practice infrastructure is built (skill file, song analyses, step library) — unclear if sessions are happening daily

**Upcoming:**
- Blog launch: imminent (days away)
- Big team meeting: March 2026
- Lucia's job exit: May 1, 2026

---

*Snapshot confidence: HIGH. Julien's own words are recent and specific. Activity log corroborates. No contradictions between sources.*