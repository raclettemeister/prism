<!-- PRISM Life Context — Auto-generated 2026-02-24T11:11:36.069Z -->
<!-- Source: context-note.md + LOG (3d) + 13 recent files -->
<!-- Model: claude-sonnet-4-6 -->
# LIFE CONTEXT SNAPSHOT — Julien
**Generated:** 2026-02-24

---

## 1. Right Now

Julien is consolidating his AI development cockpit after an intensive 3-day build sprint. His current setup is **Cursor + Superpowers skill set + custom skills and rules** — he's settled on this as his working harness for now, aware of its limitations (AI can skip chain steps, multi-pass thinking is hard to enforce). Blog launch is delayed by a few days; he's relaxed about it. Energy reads as focused and iterative, not scattered.

---

## 2. This Week — Active Projects

**The Cockpit (hottest project)**
- v0.3 shipped: `cockpit-repass` skill built (3-gate challenge system wrapping Superpowers chain), `cockpit-core.mdc` trimmed to 18 lines
- Core tension identified and documented: Roo Code had hard mode gates (Architect/Code) but cost €60-100+/day; Cursor + Superpowers is cheaper but AI can skip the brainstorm→worktree→plan→TDD→review chain
- Next step: set up Custom Modes in Cursor (Cockpit Planner = read-only, Cockpit Executor = full access) to approximate Roo Code's enforcement gates
- Julien is actively looking for a better cockpit architecture — this is an ongoing search, not a closed problem

**Blog (julien.care)**
- Launch delayed by a few days. Julien explicitly says it's fine.
- Context files were renamed recently (`blog-agent-context.md`, `blog-claude-context.md`) to fix AI context contamination risk

**Mixtapes**
- Active creative work: 4 entries refined in one evening (02-23) — jazz, Woodstock, Queen Live, Buena Vista Social Club
- This is live and moving

**Chez Julien Simulator**
- **FINISHED and shipped.** Complete.

**Sweden Odyssey**
- Demo finished. First real test of structured coding (not vibing). Collaborative project with friends.

**Sales Data (Chez Julien)**
- New project started: data gathering and extrapolation of shop sales. Business intelligence for GPFC srl. Active.

**Julien & Lucia — "All We Got Is Weeks"**
- New project folder created 02-22. Workshop concept: participants view life as ~4,160-week grid, paint past with watercolors, decide what to color next. Early concept stage.

**RenPy Game**
- Postponed at least one week. Julien is using the pause to think through what the cockpit for game creation will look like before starting.

**MyLifeOS System**
- Major audit completed 02-22: 13 bugs fixed, documentation foundation overhauled, SPEC.md dead links repaired, AGENT.md stripped from 220→120 lines, NightCrawler STATUS rewritten

**Now Page Bot**
- v1.0 working end-to-end as of 02-21. 7 output quality problems documented in SPEC.md (raw markdown rendering, no FR translation, bullet cramming, etc.). In improvement backlog.

---

## 3. Priorities & Struggles

**What matters most right now:**
- Getting the Cockpit to actually enforce the Superpowers chain — not just document it. Custom Modes in Cursor are the next concrete step.
- The multi-pass problem: Julien explicitly flags that it's still hard to get multiple reasoning passes on the same problem. `cockpit-repass` skill is his current answer; he knows it's imperfect.
- Blog launch (minor, relaxed about it).
- Finding a buyer for the retail shop — deep research into chains and centralized kitchens planned; already has a multi-cheese place owner interested.

**What's hard:**
- AI skipping steps in the Superpowers chain (proven in a live session: brainstorm triggered, rest of chain skipped)
- `.mdc` rules alone are not enforcement — the AI can ignore them
- Cost discipline: Opus vs Sonnet decision-making is now a Cockpit dimension (learned from €60-70 Roo Code day)

**Physical / side interest:**
- Furniture building, new leash design for Poncho, 3D printing — exploratory, not a current project

**What he's not doing this week:**
- RenPy game (explicitly postponed)
- Deep Lucia & Lucia project work (just captured concept)

---

## 4. Business — Chez Julien

**Strategic direction:** Operation Autonomy (not selling — previous Operation Exit archived). Goal: shop runs without Julien's daily involvement. Henry becomes manager.

**Current status:**
- Team meeting held 02-04 (Henry + Lucas). Foundation-laying meeting. Julien opened with life-is-changing frame (Lucia quitting May 1, creative projects). Henry pitched soft manager path; Lucas asked for sales focus.
- Next meeting: March 2026 — "The Big Meeting" — full role restructure, Henry→manager formalization, Lucas/Henry division of labor
- Henry: 24 years old, invested, good worker, wants manager path — but lacks experience and reliability yet. Needs training either way.
- Lucas: good with customers, questionable overall status, tendency to grab cognitive tasks he underperforms on

**Shop sale research:**
- Julien plans deep research to find prospects — focus on chains and centralized kitchens. Multi-cheese place owner already interested. This is active, not hypothetical.

**Software tools:**
- Staffing Calendar System: Google Calendar ↔ Notion sync worker deployed and functional (tested). Cron running every 30 min.
- Sales Data project just started (business intelligence)

**Financials:**
- ~500K annual sales, high profitability. Building ownership (48%, 18-year loan).

---

## 5. Tools & Stack

| Layer | Current choice |
|---|---|
| Primary harness | Cursor |
| Skill framework | Superpowers (14 skills, mapped from GitHub source) |
| Custom enforcement | `cockpit-repass` skill + `cockpit-core.mdc` (18 lines) |
| Model strategy | Sonnet for implementation, Opus reserved for architecture/complex decisions |
| Vault system | MyLifeOS (Obsidian markdown) |
| Auto-logging | NightCrawler (runs nightly, auto-logs activity) |
| Shop infrastructure | Cloudflare Worker + Notion + Google Calendar |
| Previously tested | Roo Code (best enforcement, too expensive at €60-100+/day on Opus) |
| Next Cursor config | Custom Modes — Cockpit Planner (read-only) + Cockpit Executor (full access) |

**Cockpit philosophy:** Not "vibe-asking an LLM." Sequences matter — like a helicopter pre-flight checklist. The Cockpit is the harness + environment + architecture + workflow that makes AI output reliable.

---

## 6. Life

**Lucia:**
- Quitting her job May 1, 2026 to go self-employed (art teaching + selling her art)
- Julien committed to supporting her financially and with time during this transition
- "All We Got Is Weeks" workshop is first captured collaborative project
- Meeting anniversary: 27th of each month (next: March 27)

**Poncho:**
- Australian Shepherd, 2.5 years old. Julien is thinking about designing a new leash for him.

**Energy / health:**
- No direct signal this snapshot. Tone across log entries reads as high-output, iterative, functional. No flags.

**Key upcoming:**
- Blog launch: imminent (days away)
- Shop prospect research: planned soon
- RenPy cockpit design: this week (thinking phase, not building)
- The Big Meeting (Henry/Lucas): March 2026

---

*Snapshot covers 2026-02-21 to 2026-02-24. Julien's own words given highest weight. LOG activity used to verify and enrich.*