<!-- PRISM Life Context — Auto-generated 2026-02-24T10:38:03.483Z -->
<!-- Source: context-note.md + LOG (3d) + 13 recent files -->
<!-- Model: claude-sonnet-4-6 -->
# LIFE CONTEXT SNAPSHOT — Julien
**Generated:** 2026-02-24

---

## 1. Right Now

Julien is consolidating his AI development cockpit around Cursor + Superpowers skill set + custom-built skills and rules. Blog launch is delayed by a few days — he's relaxed about it. Primary mental energy this week is on cockpit architecture: how to enforce multi-pass thinking and prevent the AI from skipping workflow steps.

---

## 2. This Week — Active Projects

**The Cockpit (HOT — primary focus)**
- Settled on Cursor + Superpowers as the core harness. Built `cockpit-repass` skill with 3 challenge gates (Design Challenge → Plan Quality Check → Review Repass).
- Rewrote `cockpit-core.mdc` to 18 lines — lean, personalized.
- Key unsolved problem: .mdc rules aren't enforced. AI skips steps (proven in live session: brainstorming triggered, rest of chain skipped). Next step: set up Custom Modes in Cursor (Cockpit Planner = read-only, Cockpit Executor = full access) to mimic Roo Code's hard mode gates.
- Roo Code abandoned due to cost (€60-70/day on Opus). Cursor is cheaper but chain discipline is weaker.
- Still struggling with: getting the AI to do multiple passes on the same thinking — this is a known, named pain point.

**Blog — julien.care**
- Launch delayed a few days. Julien is fine with this. Not the current focus.

**Mixtapes Project (active this week)**
- Active work 2026-02-23: four entries refined/created (jazz, Woodstock, Queen Live, Buena Vista Social Club). Moving steadily.

**RenPy Game (postponed ~1 week)**
- Chez Julien Simulator: finished and shipped.
- Sweden Odyssey demo: finished.
- Next RenPy project: paused. Good time to design the cockpit for game creation before starting.

**Julien & Lucia — "All We Got Is Weeks"**
- New project folder created. Workshop concept: participants view life as ~4,160-week grid, paint past in watercolor, decide what to color next. Concept captured, in early stage.

**Sales Data — Chez Julien**
- New project: gathering and extrapolating shop sales data from business computer. Business intelligence for GPFC srl.

**Physical / 3D**
- Interests active but not yet projectized: furniture building, new leash design for Poncho, 3D printing. Exploring AI-assisted physical design.

**Shop Prospecting (research phase)**
- Planning deep research to find buyers for the retail shop — focus on chains and centralized kitchens. One multi-cheese place owner already interested.

---

## 3. Priorities & Struggles

**What matters most right now:**
- Getting the cockpit to actually enforce workflow discipline — not just as documentation but as hard gates. Custom Modes in Cursor is the next concrete experiment.
- The multi-pass problem: Julien explicitly named this. He wants the AI to challenge its own thinking across multiple passes before proceeding. The `cockpit-repass` skill addresses this but enforcement is still soft.

**What's hard:**
- AI skipping steps in the Superpowers chain — brainstorming triggers, then the AI jumps straight to code. This is the core unsolved problem.
- Asking for multiple passes on the same thinking remains difficult in current setup.
- Cost discipline: Opus vs Sonnet decision-making is now part of the cockpit, not just a cost concern.

**What he's watching for:**
- Better cockpit = better harness + environment + architecture + workflow. He's explicitly always scanning for improvements. Not locked in — Cursor is "for now."

**Not on the plate this week:**
- RenPy game creation (deliberately postponed).
- Deep business operational work (though shop prospecting research is coming).

---

## 4. Business — Chez Julien

**Strategic direction shift:** Operation Autonomy is still the official frame in docs, but Julien is now actively researching selling the shop. He's looking for buyers — specifically chains and centralized kitchens. One prospect (multi-cheese place owner) already engaged. This is a significant real-world development not yet reflected in Business/ files (which still describe Operation Autonomy as current strategy).

**Team:**
- Henry (full-time): development path toward manager role is documented. Monthly meetings established (Feb 4 meeting held — foundation-laying, not the big restructure yet). Big Meeting (full role restructure) targeted for March 2026.
- Lucas (part-time/variable): sales focus. Reliability concerns noted in docs.

**Staffing system:** Google Calendar ↔ Notion staffing sync is built and deployed (Cloudflare Worker). Test run docs exist. Status unclear — not mentioned in recent activity.

**Financials:** Sales data project just started. Raw data exists; analysis is the new work.

**Key tension:** Business docs describe Operation Autonomy as active strategy, but Julien's own words indicate he's now in sell-prospecting mode. Trust his words.

---

## 5. Tools & Stack

| Layer | Current choice |
|---|---|
| Primary IDE/harness | Cursor |
| Skill framework | Superpowers (14 skills, chain-based) |
| Custom enforcement | `cockpit-repass` skill + `cockpit-core.mdc` (18 lines) |
| Planned next | Custom Modes in Cursor (Planner/Executor split) |
| Previous harness (abandoned) | Roo Code — best enforcement, but €60-100+/day |
| Models | Mix of Opus (architecture) and Sonnet (implementation) — cost discipline is part of the cockpit |
| Vault/OS | MyLifeOS (markdown, Cursor as primary interface) |
| Automation | NightCrawler (auto-logging), Now Page Bot (deployed, 7 known output issues), Cloudflare Workers (staffing sync) |
| AI briefing | PRISM (this system) |

**Cockpit philosophy:** Not vibe-prompting an LLM. Sequences matter. Like a helicopter pre-flight — specific steps in specific order to get good output. Always scanning for a better cockpit.

---

## 6. Life

**Lucia:**
- Quitting her job May 1, 2026 to go self-employed (art teaching + selling her own art). This is a near-term life milestone — Julien needs to support her financially and with time during the transition.
- New collaborative project folder created ("Julien & Lucia"). "All We Got Is Weeks" workshop is the first project inside.
- Meeting anniversary: 27th of each month.

**Poncho:**
- Australian Shepherd, ~2.5 years old. New leash design is on Julien's physical-products radar.

**Energy/mood:**
- Relaxed about blog delay ("it's fine"). Engaged and productive on cockpit work. No stress signals in his words — tone is forward-leaning and curious.

**Dancing:**
- Dancing session skill exists and is actively maintained. Lindy Hop practice is a keystone habit (community, discipline). Not mentioned as active this week but infrastructure is live.

**Guitar:**
- Guitar coach skill exists and maintained. Not mentioned as active this week.

---

## Summary for AI Analyst

Julien is deep in cockpit engineering — the meta-problem of how to make AI do disciplined, multi-step thinking without skipping steps. He has a working solution (Cursor + Superpowers + cockpit-repass skill) but enforcement is still soft. The next concrete experiment is Custom Modes in Cursor. Parallel to this: blog launches imminently, Mixtapes project is moving quietly, and shop-selling prospecting is beginning. The business strategy has quietly shifted from autonomy-building to sale-prospecting — his words are the ground truth here. Lucia's May transition is the major life horizon. Mood: calm, focused, experimenting.