<!-- PRISM Life Context — Auto-generated 2026-02-14T13:28:45.858Z -->
<!-- Source: context-note.md + LOG (3d) + 13 recent files -->
<!-- Model: claude-sonnet-4-5-20250929 -->
# Life Context Snapshot — Julien Thibaut
**Generated:** 2026-02-14

## Right Now

Julien built PRISM v0.4.0 today — his personal AI research system that runs autonomously every night at 4 AM via GitHub Actions and emails him a briefing. It now includes autonomous context generation: clones his private MylifeOS repo, reads ~25 key files, synthesizes with Claude Sonnet, and writes fresh life context before reading the internet. He also moved MylifeOS off iCloud to GitHub with Obsidian Git syncing every 30 minutes. The strategic shift is finalized: Operation Autonomy (not selling the shop), Henry becomes manager, big meeting tonight with Henry and Lucas. Blog launches Feb 23. The thing he's avoiding: polishing the blog text.

## This Week

**Active projects:**

- **PRISM (Information Digest)** — v0.4.0 LIVE. Autonomous pipeline: context generation → RSS collection (9 feeds) → scoring (Haiku) → analysis (Sonnet) → synthesis (Sonnet) → email delivery (Resend). First successful run Feb 14. Budget: unlimited tokens.
- **MylifeOS v2** — Major cleanup completed. 19,711 files → 258 files. Removed all app code (moved to separate repos), lovable-prompt files, Todoist archives, dead files, duplicates, .DS_Store files. Created `.gitignore`. Now GitHub-backed with Obsidian Git auto-sync every 30 min. Clean knowledge base, no code, no bloat.
- **Operation Autonomy** — NEW strategy (replaced Operation Exit/SellOS). Henry becomes manager, software tools, documented processes. Not selling. Meeting tonight (Feb 14) with Henry and Lucas. Full PREP.md created with talking points, 5 development paths for Henry, bonus structure (Lucas 4.5%, Henry 2% of sale price), meeting structure (30 min together + 15 min each alone).
- **Blog** — Live at julien.care. Newsletter system operational (Resend + Supabase). Domain warm-up phase. Open Graph tags finalized. Launch date: Feb 23. **Status: avoiding the text polish work.**
- **Chez Julien Simulator** — Beta testing ready. Family plays tonight (Friday Feb 14). Bug report system designed but not implemented (blocked on embedding game on julien.care first).
- **Staffing Dashboard V2** — Fully integrated with Notion (live read/write). Cloudflare Worker proxy built. Two-way sync with 3 Notion databases. Julien needs to deploy the worker.

**Completed this week:**

- Three Zapier automations live (Morning Nudge, Google Review Alert, Weekly Planning Reminder)
- Subscriber notification pipeline (ntfy + Notion + welcome email)
- ntfy restructured into 3 topics (mylifeos-rhythm, mylifeos-business, mylifeos-projects)
- Staffing system launched via WhatsApp (clocking format, availability cycle, all live)
- Proton Mail DNS setup completed (staycreative@julien.care receiving)

## Priorities & Struggles

**Top priorities (Julien's own words):**
1. Test PRISM full run
2. Prep for tonight's meeting (Operation Autonomy)
3. STOP building AI tools this weekend
4. Work on blog text

**The core struggle:** Spending too much time building AI tools, not enough on simple human things (shop, Lucia, blog text). Current ratio: 70/30 investment/life. Target: 50/50. Needs to flip.

**What he's avoiding:** Polishing blog text. "Haven't touched the text in days. That's the thing I'm avoiding."

**The bottleneck awareness:** Not leveraging AI enough — needs to learn to package work into AI-delegatable chunks, run parallel sessions, build long-running background tasks. Every idle machine is a missed opportunity. But also: the irony of building bots to avoid simple human tasks (Feb 12: spent all day building WhatsApp bot to avoid asking employee about availability).

**Key insight from Feb 12:** "Asking an LLM about a pioneering field is a big no-no." Claude is bad at bleeding-edge AI news — field moves faster than training data. This reinforces PRISM's urgency.

## Business — Chez Julien & Operation Autonomy

**Strategic shift (Feb 14):** Operation Exit archived. New path: Operation Autonomy. Keep the shop, make it fully autonomous, Henry becomes manager. Software tools, documented processes, humans handle the human parts.

**Tonight's meeting (Feb 14):**
- Henry: full development pitch, 5 paths (Shop Manager title, Henry gets the shop, buyer keeps Henry, future collaboration, safety net)
- Lucas: "let your best friend shine" reframe, bonus structure, focus on sales
- Goal: official task division (Henry on thinking/projects, Lucas on customers)

**Team:**
- **Henry** — 24, full-time, 4 months in. Eager, growing fast, wants manager role. Needs training but motivated. Best friend of Lucas.
- **Lucas** — 24, part-time (3/4), 2 years in. Good with customers, deliberately conserves cognitive energy for own projects (creative agency, sound engineer). Not investing in shop development. Close to Henry (risk: if one leaves, both leave).

**Staffing system (built Feb 12, launched immediately):**
- 3 Notion databases: Disponibilités & Planning, Congés & Vacances, Pointage
- WhatsApp architecture: group for ops + clocking, private for availability
- Full SOP with copy-paste French messages
- Staffing Dashboard HTML (single-file web app, needs Cloudflare Worker deployment)

**The pattern:** Julien is excellent at micromanaging early stages (setup, design, details) but drops off at macro/operational. Founder energy, not operator energy. Operation Autonomy is designed to match this: build the systems, hand off the operations.

## Tools & Stack

**Hardware:**
- Mac Mini (16GB RAM) — primary workstation, runs Cursor + Claude Cowork
- MacBook Pro 2019 (Intel i5, 8GB RAM) — secondary, background Cowork tasks. **Note:** Incompatible with Cowork (not Apple Silicon), currently limited utility.

**AI stack:**
- **Claude Cowork (Opus)** — primary AI interface, unlimited budget
- **Cursor** — code editor with AI
- **Lovable** — web app builder (blog, game embed work)
- **GitHub Actions** — PRISM runs nightly at 4 AM
- **Resend** — email API (newsletter, PRISM delivery)
- **Supabase** — database (subscribers, bug reports)
- **Notion** — shop operations (staffing, availability, hours)

**Recent additions:**
- Obsidian Git (MylifeOS auto-sync every 30 min)
- ntfy (push notifications for life/business/projects)
- Zapier (3 live automations, 4 more planned)
- Cloudflare Workers (staffing dashboard proxy, needs deployment)

**Infrastructure philosophy:** Push existing machines to max utilization before buying new hardware. Multi-machine workflow with iCloud Drive structure (Mac Mini/, MacBook Pro/, shared MylifeOS/).

## Life

**Lucia:** Artist, 31. Currently works at International Yehudi Menuhin Foundation (MUS-E programme). **Quitting May 1, 2026** to go self-employed (teaching art, selling art). Julien needs to support with time and money. Meeting anniversary: 27th of each month. Yearly anniversary: 27 April. Birthday: 13 January.

**Health & rhythm:** Disciplines slipped. Self-assessed 70/30 investment/life ratio (target: 50/50). Dancing practice inconsistent. The wisdom: "The one thing AI won't do for you is taking care of your body and your relationships."

**Upcoming:**
- **Tonight (Feb 14):** Family game evening (Chez Julien Simulator grand opening) + Big Meeting with Henry and Lucas
- **Feb 23:** Blog public launch
- **May 1:** Lucia quits job

**Household:** Poncho (Australian Shepherd, born June 2023).

**Season:** AI Exploration + Blog Launch (Jan-May 2026). High-energy exploration, blog/game live but not publicly launched yet. The tension: learning to manage AI at scale while not losing presence, relationships, body.