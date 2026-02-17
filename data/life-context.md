<!-- PRISM Life Context — Auto-generated 2026-02-17T06:13:12.284Z -->
<!-- Source: context-note.md + LOG (3d) + 13 recent files -->
<!-- Model: claude-sonnet-4-5-20250929 -->
# LIFE CONTEXT SNAPSHOT — 2026-02-17

## Right Now

Julien is in recovery mode after acknowledging cognitive debt. He's one day into a gentle reset week focused on two priorities only: completing the first staffing cycle (planning for March 2-15, due Sunday) and doing a voice pass on blog text before public launch Feb 23. The staffing dashboard went from 0% to live in 48 hours — it's rough (v0.5) but functional enough to complete this cycle.

## This Week (Feb 16-23)

**Active and moving:**
- **Staffing Calendar System** — Live as of Feb 17. Dashboard syncs with Notion, has 2-month lookahead, WhatsApp export works, Google Calendar bidirectional sync operational. Known issues: Pointage database not shared with Notion integration (causes sync errors), planning grid UX needs work, no cron trigger yet, not mobile-accessible. But it's deployed and functional — first real-world test happening this week with March 2-15 planning.
- **Blog voice pass** — Only task: polish the text. No infrastructure work, no new features. Public launch Feb 23.
- **3 Letta agents (Brain, Coach, Queue)** — Built Feb 15, operational but unused. Julien committed to using them daily: Coach for morning check-ins, Queue for prioritization decisions.

**Explicitly NOT this week:**
- Letta ↔ MylifeOS sync (automation planned, not building yet)
- PRISM tweaks (v1.3 shipped, stable)
- Sweden Odyssey (learning to code project, parked)
- New tools, agent frameworks, dashboard tinkering

**All dispos are in for March planning:**
- Henry: full availability
- Lucas: full availability  
- Jeanne: waiting on internship schedule confirmation
- Share final planning by Sunday Feb 22

## Priorities & Struggles

**The insight driving everything:** "Whatever I can build today will be shit compared to what I can build in 6 months. What matters today is learning the skills that will matter in 6 months and the next decade."

**The real investment:** Learning to manage energy, say no, and prioritize Tier 1 (presence, health, relationships) before Tier 3 (creative projects). Management skills matter more than pioneer tools — tools change in 6 months, but the ability to handle dozens of AI-assisted projects without cognitive overload is the durable skill.

**Commitment map (Feb 15) revealed the problem:** 14 active commitments across 5 tiers. Tier 1 (non-negotiable life stuff) is undertended. Tier 3 (creative projects) gets most energy. Currently running 70/30 work/life when target is 50/50. The fix: do Tier 1 FIRST every day — morning sequence is stretch/meditate → Poncho walk → THEN laptop.

**Rest is a skill being trained now.** Cognitive debt acknowledged Monday Feb 16.

**The clock:** Lucia quits May 1. Pressure on shop autonomy + being present for her transition.

## Business (Chez Julien / Operation Autonomy)

**Staffing system status:** Live but not viable yet. 7 things still need work before it's truly handed off to Henry: Pointage database sharing with Notion integration, auto-planning validation, planning grid UX improvements, cron trigger setup, mobile access, calendar view, general polish.

**First staffing cycle in progress:** March 2-15 planning due Sunday Feb 22. This is the real test — can Julien use his own system to complete an actual staffing cycle? Dashboard exists to make this possible.

**Infrastructure built Feb 14-17:**
- Google Cloud project `chez-julien-staffing`
- Service account with Calendar API access
- Two Google Calendars: "Chez Julien — Julien" (Julien's shop absences) + "Chez Julien — Planning" (shared team schedule)
- Cloudflare Worker `chez-julien-staffing` (~1060 lines) deployed via chunked upload
- Dashboard with 2-month lookahead, red day alerts, WhatsApp export, auto-planning generation

**The principle:** Build by hand first. Automate what's been proven manually. Don't automate what hasn't worked yet.

**Team:** Henry (full-time, 24, manager path being developed), Lucas (3/4 time, customer-facing), Jeanne (new, awaiting internship schedule). Big team meeting originally planned for Feb 14 (Saturday) but no update in logs — status unknown.

## Tools & Stack

**Hardware:**
- Mac Mini (16GB RAM) — primary workstation, runs Cursor + Cowork
- MacBook Pro 2019 (8GB Intel) — secondary station for background Cowork tasks

**AI services actively used:**
- Claude Sonnet (via Cowork + Cursor)
- Letta (app.letta.com) — 3 agents with shared memory blocks
- PRISM v1.3 — autonomous life context generator + news briefing (runs 4AM daily, emails staycreative@julien.care)

**Infrastructure:**
- MylifeOS on GitHub (migrated off iCloud Feb 14, Obsidian Git auto-sync every 30min)
- Cloudflare Workers (staffing system + PRISM delivery)
- Notion (Disponibilités database, Congés, Pointage)
- Google Calendar API (service account auth, bidirectional sync)
- Resend (PRISM email delivery)
- ntfy.sh (push notifications to `mylifeos-business`)

**Recent additions (Feb 14-15):**
- Zapier automations: morning nudge (8:30 AM), Google review alerts, weekly planning reminder (8:30 PM), context-note update reminder (8:30 PM)
- Subscriber pipeline: newsletter signup → ntfy + Notion + Resend welcome email

**The bottleneck being solved:** Learning to manage AI at scale. Two machines, multiple AI instances, parallel sessions. Goal: always have at least one AI working in background. Every idle machine is missed opportunity.

## Life Context

**Lucia:** Artist, currently at MUS-E Foundation, quitting May 1 to go self-employed (teaching art + selling her work). Anniversary: 27th of each month. Julien needs to support her transition with time and money so she can bloom. Meeting anniversary Feb 27 coming up in 10 days.

**Poncho:** Australian Shepherd, 2.5 years old. Daily walks are part of morning sequence (pre-laptop discipline).

**Health/Energy:** Cognitive debt acknowledged. Disciplines slipped lately. Self-assessment (Feb 12): "70% investment / 30% life instead of target 50/50." Morning sequence reestablished: stretch/meditate → Poncho → laptop.

**Upcoming date:** Blog public launch Feb 23 (6 days).

**The wisdom:** "The one thing AI won't do for you is taking care of your body and your relationships."

## Project Metadata (for reference)

**Live + polishing:**
- Blog (julien.care) — weekly bilingual, Resend + Supabase, domain warming
- Chez Julien Simulator (julien.care/game) — shipped to family/friends Feb 14
- PRISM v1.3 — autonomous briefing system, running nightly

**Built but unused:**
- Letta agents (Brain, Coach, Queue) — commitment to start using daily

**Active infrastructure:**
- Staffing Calendar System — live but rough, first cycle test in progress
- Operation Autonomy — shop autonomy push, Henry development

**Parked/Phase 2:**
- Sweden Odyssey (learn to code project)
- Examine Your Life (Phase 2, mid-2026)
- Lindy Hop Musicality Lab (Phase 3)

**The grand strategy:** Share life, make things, people who know try them, loop continues. Blog is friend blog — no content pillars, no playbook. Share good things, rest follows.