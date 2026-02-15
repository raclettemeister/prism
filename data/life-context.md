<!-- PRISM Life Context — Auto-generated 2026-02-15T06:10:29.476Z -->
<!-- Source: context-note.md + LOG (3d) + 13 recent files -->
<!-- Model: claude-sonnet-4-5-20250929 -->
# Life Context Snapshot — Julien Thibaut
**Generated:** 2026-02-15

## Right Now

Julien just shipped PRISM v0.4.0 yesterday — his personal AI research system that runs autonomously every night at 4 AM on GitHub Actions and emails him a briefing. He moved his entire MylifeOS off iCloud to GitHub with Obsidian Git syncing every 30 minutes. The big strategic shift: Operation Autonomy is now the plan instead of selling the shop — Henry becomes manager. Tonight (Feb 15) is the big meeting with Henry and Lucas to discuss this restructure. He's avoiding the blog text (hasn't touched it in days despite the Feb 23 launch deadline) and knows he's spending too much time building AI tools instead of simple human tasks.

## This Week

**PRISM (Personal AI Research System):**
- v0.4.0 shipped Feb 14 with autonomous life context generation
- v1.1 expanded from 9 to ~45 RSS feeds across 9 categories (AI Tools, AI News, No-Code, Indie Founders, Game Dev, Creative AI, Europe/Belgium, Big Picture, Retail Automation)
- v1.3 deep dive feature designed: write "deep dive: topic" in context note, PRISM generates 5 queries, fetches 20 full articles, synthesizes research report (~$0.72 per deep dive)
- Full pipeline: context → collect → score (Haiku) → analyze (Sonnet) → synthesize (Sonnet) → deliver (Resend email)
- Live on GitHub Actions, runs nightly, emails staycreative@julien.care
- Budget: unlimited

**MylifeOS Infrastructure:**
- Migrated off iCloud to GitHub (raclettemeister/MyLifeOS, private repo)
- Vault now at `/Users/julienthibaut/MylifeOS/MylifeOSv2`
- Obsidian Git: auto commit-and-sync every 30 minutes
- Major cleanup: 19,711 → 258 files (removed app code, build artifacts, .DS_Store files, dead root files)
- Created `.gitignore` to prevent future bloat
- PRISM now clones this repo every morning to generate life context autonomously

**Blog (julien.care):**
- LIVE but text not polished
- Launch date: Feb 23 (8 days away)
- Julien admits: "Haven't touched the text in days. That's the thing I'm avoiding."
- Newsletter via Resend + Supabase
- Subscriber notification pipeline working (ntfy + Notion + welcome email)

**Chez Julien Simulator:**
- Live at julien.care/game
- Beta testing ready, bug reports implemented
- Family plays tonight (Feb 15) — grand opening

**Sweden Odyssey (NEW):**
- Video game about two-week Sweden trip with ~20 friends
- **First project where Julien learns to code** — not vibe-coding, actual learning
- GitHub-only, multi-person collaboration
- Project folder + STATUS.md created Feb 12

**Staffing System (Built Feb 12):**
- Complete Notion system: 3 databases (Disponibilités & Planning, Congés & Vacances, Pointage)
- Full SOP with WhatsApp message templates (FR)
- Staffing Dashboard V2 (`Business/staffing-dashboard.html`) with live Notion read/write via Cloudflare Worker proxy
- System went LIVE Feb 12 — Julien sent messages to team WhatsApp group
- Clock in/out format: flexible (⏰ 10h-18h40 or separate messages)

## Priorities & Struggles

**Stated priorities (from context note):**
1. Test PRISM full run
2. Prep for tonight's meeting with Henry and Lucas
3. STOP building AI tools and work on blog text this weekend

**The core struggle:**
"Spending too much time building AI tools, not enough on the simple human things (shop, Lucia, blog text). 70/30 ratio needs to flip."

**What he's avoiding:**
- Blog text polishing (the voice isn't right, needs full pass before public launch)
- Simple staffing conversations (spent Feb 12 trying to build a WhatsApp bot to ask employees about availability instead of just texting them — he called it "definitely ridiculous")
- The shop and human tasks in general

**Key insight from Feb 12:**
Asking an LLM about bleeding-edge AI is a "big no-no" — the field moves faster than training data. This reinforces the urgency of PRISM as a real personalized news feed.

## Business — Operation Autonomy

**Strategic shift (Feb 14):**
- Archived Operation Exit / SellOS
- New plan: Operation Autonomy — keep the shop, make it fully autonomous, Henry becomes manager
- Principle: "Everything is replaceable. Humans handle the human parts, software does the heavy lifting."

**Tonight's meeting (Feb 15) — The Big Meeting:**
- Henry and Lucas together, then individual conversations
- Henry's path: 5 options including title upgrade to Shop Manager, potentially taking over operations, or buyer keeps him as manager
- Lucas's path: "Let your best friend shine" — step back from cognitive tasks, focus on customer-facing work
- Bonus structure tied to potential sale: Lucas 4.5%, Henry 2% (on €200K sale = €9K for Lucas, €4K for Henry)
- Goal: Henry on thinking/projects, Lucas on customers (currently reversed — Lucas grabs cognitive tasks but underperforms)

**Team:**
- **Henry:** 24, full-time, 4 months in. Eager, growing fast, wants responsibility. But still learning, lacks maturity. Best friend of Lucas (risk: if one leaves, both might).
- **Lucas:** 24, part-time (3/4), 2 years in. Good with customers, deliberately conserves cognitive energy for his own creative agency projects. Treats shop as "battery charger" for his real ambitions. Not ready for self-awareness.

**Chez Julien status:**
- ~€500K annual sales, very high profitability
- Julien owns 48% of the building
- Shop already very self-sustainable, but needs to run without Julien

## Tools & Stack

**Current setup:**
- **Primary:** Mac Mini (16GB RAM) — Cursor + Claude Cowork (Opus)
- **Secondary:** MacBook Pro 2019 (Intel i5, 8GB RAM) — discovered Feb 12 it's incompatible with Cowork (not Apple Silicon), tried to use as Claude bot, didn't work
- **Hardware discipline:** No new device purchases until current RAM usage maxed out

**AI stack:**
- Claude Cowork (Opus) for interactive work
- Claude Sonnet 4 for PRISM analysis/synthesis
- Claude Haiku for PRISM scoring (cheap, fast)
- Cursor for code (AI-assisted development)
- Lovable for web apps (built blog + game)
- GitHub Actions for PRISM automation
- Resend for email (blog newsletter + PRISM briefings)
- Supabase for blog backend
- Notion for business operations (3 staffing databases)
- Obsidian + Obsidian Git for MylifeOS
- ntfy for push notifications (3 topics: mylifeos-rhythm, mylifeos-business, mylifeos-projects)
- Zapier: 3 automations live (Morning Nudge 8:30 AM, Google Review Alert, Weekly Planning Sunday 7 PM)

**Budget:** Unlimited for AI tokens

**The bottleneck Julien is solving:**
Learning to manage AI at scale. Goal: always have at least one AI working in the background. Parallel sessions across both machines. Package work into AI-delegatable chunks. Push every machine to its limits before buying more.

## Life

**Lucia:**
- Girlfriend, artist, teaching at International Yehudi Menuhin Foundation
- **Quitting May 1, 2026** to go self-employed (teaching art, selling her own work)
- Julien needs to support her with time and money during transition
- Meeting anniversary: 27th of each month | Birthday: Jan 13 | Yearly anniversary: April 27

**Health & presence:**
- Disciplines slipped lately (all unchecked every day per Feb 12 assessment)
- Self-assessed at 70% investment / 30% life (target is 50/50)
- "The one thing AI won't do for you is taking care of your body and your relationships"
- Dancing practice (keystone habit) has slipped

**Upcoming:**
- Tonight (Feb 15): Big Meeting with Henry and Lucas
- Feb 23: Blog public launch (8 days away)
- May 1: Lucia quits her job

**Timezone:** Europe/Brussels (CET/CEST)

**Key principle:**
"I'm excellent at micromanaging early stages — setting things up, designing systems, getting the details right. But I drop off at the macro/operational stage. I'm the founder who builds the machine, not the operator who runs it."