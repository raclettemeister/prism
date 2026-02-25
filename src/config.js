// ============================================================
// PRISM v4.0 Configuration
//
// v4.0 architectural changes (2026-02-21):
//   "The Smart Analyst" — trust tiers replace blind batch scoring
//
//   PIPELINE: Context → Collect → [Classify ∥ WebIntel] → Read →
//             [BuilderSynth ∥ WorldSynth] → Assemble → Validate → Page → Deliver
//
//   NEW:
//   - TRUST_TIERS: 12 expert sources always read, no scoring needed
//   - ai_builder category (weight 1.0): 4 missing expert sources added
//   - nocode expanded to weight 1.0 with vibe-coding tool feeds
//   - 3 new HN builder queries in big_picture
//   - WEBINTEL_PROMPT: proactive query generation before synthesis
//   - CLASSIFY_PROMPT: replaces SCORING_PROMPT (Tier 2 only, builder-weighted)
//   - BUILDER_PROMPT: Call A — Builder Intelligence (critical path)
//   - WORLD_PROMPT: Call B — World Context (secondary, parallel)
//   - Expanded preFilterKeywords with builder methodology vocabulary
//
//   RETAINED (for legacy score.js/research.js compatibility):
//   - SCORING_PROMPT (deprecated — use CLASSIFY_PROMPT)
//   - RESEARCH_PROMPT (deprecated — use BUILDER_PROMPT + WORLD_PROMPT)
//
// v3.3 feed audit (2026-02-21):
//   - Removed all 16 Reddit feeds → blanket 403
//   - Removed 11 dead 404 feeds (cursor, deepmind, meta AI, etc.)
//   - Removed 14 blocked feeds (sifted, eu-startups, siliconcanals, etc.)
//   - Added: google AI blog, Lobste.rs AI/ML tags, DW corrected URL, Adam Tooze
//   Net: 144 → ~99 feeds
//
// NOTE ON SUBSTACK RSS: Many Substacks block the substack.com/feed format.
// Custom domains work reliably (e.g. noahpinion.blog). The ai_builder feeds
// use best-guess URLs — PRISM's Feed Health Report will flag 404s for cleanup.
// ============================================================

// --- Trust Tier Definitions (v4.0) ---
// Tier 1 sources bypass scoring entirely. They are always read.
// Pattern matching: substring match against article's feedUrl or source domain.
export const TRUST_TIERS = {
  tier1: {
    label: 'Expert Trusted',
    treatment: 'always_read',
    maxPerSource: 2,   // max 2 articles per source per night
    // Substring patterns matched against article feedUrl (case-insensitive)
    patterns: [
      // Builder experts — the document's Tier 1 Operational Foundations
      'every.to',            // Dan Shipper — AI-native CEO workflows
      'simonwillison.net',   // Simon Willison — pragmatic LLM tooling
      'steve-yegge',         // Steve Yegge — vibe coding, post-IDE vision
      'buildermethods',      // Brian Casel — sustainable micro-SaaS
      'briancasel',          // Brian Casel — alternate domain
      'addyosmani',          // Addy Osmani — AI-Assisted Engineering, 70% Problem
      // Technical practitioners
      'latent.space',        // Latent Space — AI engineer ecosystem heartbeat
      'pragmaticengineer',   // Pragmatic Engineer — enterprise reality check
      'oneusefulthing',      // Ethan Mollick — AI as organizational capacity
      // World context (analytical, not noise)
      'economist.com',       // The Economist — world context, analytical lens
      'adamtooze',           // Adam Tooze — macro/geopolitics for Brussels founder
      'noahpinion',          // Noah Smith — economic forces, global shifts
      // Game dev AI
      '80.lv',               // 80 Level — game dev tech & AI tools coverage
    ],
  },
  tier2: {
    label: 'Amplification Signal',
    treatment: 'score_if_amplified',
    // Conditions that qualify an article for Tier 2 scoring:
    crossFeedThreshold: 3,         // appears in 3+ independent feeds
    hnBestFeedPattern: 'hnrss.org/best',  // any article from HN best feeds
  },
  tier3: {
    label: 'Long Tail',
    treatment: 'score_if_budget',
    minScore: 7,          // only keep if scored >= 7
    maxArticles: 10,      // absolute cap
  },
};

// --- RSS Feeds (v4.0: 20 categories, ~110 feeds) ---
export const FEED_CATEGORIES = {

  // =====================================================
  // Category 0: AI-Assisted Builders & Micro-SaaS (NEW v4.0)
  // The 4 expert sources missing from v3.3.
  // All feeds here are Trust Tier 1 — always read, no scoring.
  // URLs are best-guess; Feed Health Report will flag 404s.
  // =====================================================
  ai_builder: {
    weight: 1.0,
    tier: 1,
    feeds: [
      'https://every.to/chain-of-thought/feed',       // Dan Shipper — Chain of Thought column
      'https://every.to/feed',                         // Every — full publication (Shipper et al.)
      'https://buildermethods.substack.com/feed',      // Brian Casel — Builder Methods
      'https://briancasel.com/feed',                   // Brian Casel — personal site (alternate)
      'https://steve-yegge.substack.com/feed',         // Steve Yegge — vibe coding manifesto
      'https://steveyegge.substack.com/feed',          // Steve Yegge — alternate Substack slug
      'https://addyosmani.com/rss',                    // Addy Osmani — Beyond Vibe Coding
      'https://addyosmani.com/feed.xml',               // Addy Osmani — alternate feed format
    ],
  },

  // =====================================================
  // Category 1: AI Tools & Techniques
  // =====================================================
  ai_tools: {
    weight: 1.0,
    feeds: [
      'https://www.latent.space/feed',
      'https://buttondown.email/ainews/rss',
      'https://simonwillison.net/atom/everything/',
      'https://lilianweng.github.io/index.xml',
      'https://www.interconnects.ai/feed',
      'https://www.bensbites.com/feed',
      'https://hnrss.org/show',
      'https://hnrss.org/launches',
      'https://huggingface.co/blog/feed.xml',
      'https://vercel.com/atom',                         // Next.js, AI SDK, v0
      'https://blog.cloudflare.com/rss/',                // Workers, edge AI
      'https://blog.langchain.dev/rss/',                 // Agent frameworks
    ],
  },

  // =====================================================
  // Category 2: AI Labs — Official Sources
  // =====================================================
  ai_labs: {
    weight: 0.95,
    feeds: [
      'https://openai.com/news/rss.xml',
      'https://raw.githubusercontent.com/Olshansk/rss-feeds/main/feeds/feed_anthropic_news.xml',
      'https://blog.google/technology/ai/rss/',          // Google AI (includes DeepMind)
    ],
  },

  // =====================================================
  // Category 3: AI News
  // =====================================================
  ai_news: {
    weight: 0.9,
    feeds: [
      'https://jack-clark.net/feed/',
      'https://www.artificialintelligence-news.com/feed/',
      'https://the-decoder.com/feed/',
      'https://venturebeat.com/category/ai/feed/',
    ],
  },

  // =====================================================
  // Category 4: AI Thinkers & Practitioners
  // =====================================================
  ai_thinkers: {
    weight: 0.9,
    feeds: [
      'https://huyenchip.com/feed.xml',                  // Chip Huyen — ML systems
      'https://sebastianraschka.com/rss_feed.xml',       // Sebastian Raschka — LLM training
      'https://www.swyx.io/rss.xml',                     // Swyx — AI engineering (also in Latent Space)
      'https://magazine.sebastianraschka.com/feed',      // Ahead of AI — monthly deep dives
    ],
  },

  // =====================================================
  // Category 5: No-Code, Low-Code & Vibe-Coding Tools
  // v4.0: expanded with vibe-coding tool feeds; weight boosted to 1.0
  // =====================================================
  nocode: {
    weight: 1.0,
    feeds: [
      'https://blog.replit.com/feed.xml',
      'https://blog.val.town/rss.xml',
      'https://lovable.dev/blog/rss',                    // Lovable — UI gen from prompts
      'https://lovable.dev/rss.xml',                     // Lovable — alternate feed path
      'https://changelog.lovable.dev/rss',               // Lovable changelog
      'https://blog.stackblitz.com/rss.xml',             // StackBlitz — powers Bolt.new
      'https://codeium.com/blog/rss',                    // Windsurf (Codeium) — AI-native IDE
      'https://codeium.com/blog/rss.xml',                // Windsurf — alternate feed path
      'https://cursor.com/changelog/rss',                // Cursor changelog (retry — was 404 in v3.3)
    ],
  },

  // =====================================================
  // Category 6: Indie Founders
  // =====================================================
  indie_founders: {
    weight: 0.8,
    feeds: [
      'https://blog.pragmaticengineer.com/rss/',
      'https://entrepreneurshandbook.co/feed',
      'https://www.saastr.com/feed/',
      'https://www.lennysnewsletter.com/feed',           // Lenny's Newsletter
      'http://www.aaronsw.com/2002/feeds/pgessays.rss',  // Paul Graham essays
      'https://pluralistic.net/feed/',                    // Cory Doctorow
      'https://www.producthunt.com/feed',                 // Product Hunt daily
      'https://news.ycombinator.com/rss',                 // HN frontpage
      'https://techcrunch.com/category/startups/feed/',   // TechCrunch Startups
    ],
  },

  // =====================================================
  // Category 7: Game Dev
  // =====================================================
  gamedev: {
    weight: 0.7,
    feeds: [
      'https://gamefromscratch.com/feed/',
      'https://gamedeveloper.com/rss.xml',
      'https://www.gamesindustry.biz/feed/news',
      'https://itch.io/games/new-and-popular.xml',
      'https://godotengine.org/rss.xml',
    ],
  },

  // =====================================================
  // Category 7b: Game Dev AI — Tools, Engines & Solo Dev Leverage
  // Focused on AI-assisted game development. 80.lv is Tier 1 (via
  // TRUST_TIERS pattern). Web intelligence handles broad discovery.
  // =====================================================
  gamedev_ai: {
    weight: 0.9,
    feeds: [
      'https://80.lv/feed',                          // 80 Level — game dev tech, AI tools coverage
      'https://blog.unity.com/feed',                  // Unity — AI-powered features, ML Agents
    ],
  },

  // =====================================================
  // Category 8: Creative AI
  // =====================================================
  creative_ai: {
    weight: 0.7,
    feeds: [
      'https://weirdwonderfulai.art/feed/',
      'https://www.creativebloq.com/feed',
      'https://arstechnica.com/ai/feed/',
      'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml',
      'https://www.wired.com/feed/rss',
    ],
  },

  // =====================================================
  // Category 9: Europe Tech
  // =====================================================
  europe_tech: {
    weight: 0.75,
    feeds: [
      'https://tech.eu/feed/',
      'https://www.brusselsmorning.com/feed/',
      'https://www.politico.eu/section/technology/feed/',
    ],
  },

  // =====================================================
  // Category 10: Big Picture
  // v4.0: added 3 builder-specific HN queries
  // =====================================================
  big_picture: {
    weight: 0.6,
    feeds: [
      'https://www.exponentialview.co/feed',
      'https://hnrss.org/best?count=30&q=AI+OR+LLM+OR+agent+OR+Claude',
      'https://hnrss.org/best?count=20&q=cursor+OR+coding+OR+prompt',
      'https://stratechery.com/feed/',
      'https://www.oneusefulthing.org/feed',
      'https://www.technologyreview.com/feed/',
      'https://hnrss.org/best?count=20&q=agent+OR+autonomous+OR+agentic',
      'https://hnrss.org/best?count=15&q=Claude+OR+Anthropic',
      'https://hnrss.org/best?count=15&q=Europe+OR+EU+OR+Brussels',
      'https://hnrss.org/whoishiring/jobs',
      // v4.0 additions: builder methodology queries
      'https://hnrss.org/best?count=20&q=micro-SaaS+OR+vibe+coding+OR+indie+hacker',
      'https://hnrss.org/best?count=15&q=Lovable+OR+Bolt.new+OR+Windsurf+OR+Cursor',
      'https://hnrss.org/best?count=15&q=solo+founder+OR+bootstrapped+OR+AI-assisted',
    ],
  },

  // =====================================================
  // Category 11: GitHub Trending
  // =====================================================
  github_trending: {
    weight: 0.85,
    feeds: [
      'https://mshibanami.github.io/GitHubTrendingRSS/daily/all.xml',
    ],
  },

  // =====================================================
  // Category 12: Tech Communities
  // =====================================================
  tech_communities: {
    weight: 0.75,
    feeds: [
      'https://lobste.rs/t/ai.rss',
      'https://lobste.rs/t/ml.rss',
    ],
  },

  // =====================================================
  // Category 13: Geopolitics & Global Economy
  // =====================================================
  geopolitics: {
    weight: 0.90,
    feeds: [
      'https://www.project-syndicate.org/rss',
      'https://www.noahpinion.blog/feed',
      'https://marginalrevolution.com/feed',
      'https://www.foreignaffairs.com/rss.xml',
      'https://ecfr.eu/feed/',
      'https://www.slowboring.com/feed',
      'https://theovershoot.co/feed',
      'https://www.geopoliticaldispatch.com/feed',
      'https://geopoliticalfutures.com/feed/',
      'https://adamtooze.com/feed/',
    ],
  },

  // =====================================================
  // Category 14: The Economist
  // =====================================================
  economist: {
    weight: 0.90,
    feeds: [
      'https://www.economist.com/leaders/rss.xml',
      'https://www.economist.com/europe/rss.xml',
      'https://www.economist.com/finance-and-economics/rss.xml',
      'https://www.economist.com/asia/rss.xml',
      'https://www.economist.com/science-and-technology/rss.xml',
      'https://www.economist.com/business/rss.xml',
      'https://www.economist.com/middle-east-and-africa/rss.xml',
    ],
  },

  // =====================================================
  // Category 15: Financial Times
  // =====================================================
  ft_sections: {
    weight: 0.80,
    feeds: [
      'https://www.ft.com/world?format=rss',
      'https://www.ft.com/global-economy?format=rss',
      'https://www.ft.com/opinion?format=rss',
      'https://www.ft.com/climate-capital?format=rss',
    ],
  },

  // =====================================================
  // Category 16: European Think Tanks
  // =====================================================
  eu_think_tanks: {
    weight: 0.80,
    feeds: [
      'https://thediplomat.com/feed/',
    ],
  },

  // =====================================================
  // Category 17: Europe Politics & Policy
  // =====================================================
  europe_politics: {
    weight: 0.85,
    feeds: [
      'https://www.politico.eu/feed/',
      'https://euobserver.com/rss',
      'https://rss.dw.com/rdf/rss-en-europe',
      'https://www.theguardian.com/world/europe-news/rss',
      'https://www.france24.com/en/rss',
    ],
  },

  // =====================================================
  // Category 18: Global Quality News
  // =====================================================
  global_quality: {
    weight: 0.75,
    feeds: [
      'https://feeds.bbci.co.uk/news/world/rss.xml',
      'https://www.aljazeera.com/xml/rss/all.xml',
      'https://www.ft.com/rss/home',
    ],
  },

  // =====================================================
  // Category 19: Meta, Philosophy & Deep Reads
  // =====================================================
  meta_philosophy: {
    weight: 0.55,
    feeds: [
      'https://80000hours.org/feed/',
      'https://www.astralcodexten.com/feed',
      'https://www.lesswrong.com/feed.xml',
      'https://timharford.com/feed/',
      'https://waitbutwhy.com/feed',
      'https://fs.blog/feed/',
      'https://thebrowser.com/feed/',
      'https://www.palladiummag.com/feed/',
      'https://www.noemamag.com/feed/',
      'https://daringfireball.net/feeds/main',
    ],
  },
};

// --- Models (v4.0: ALL Sonnet 4.6) ---
export const MODELS = {
  scorer: 'claude-sonnet-4-6',
  analyzer: 'claude-sonnet-4-6',
  synthesizer: 'claude-sonnet-4-6',
};

// --- Sonnet 4.6 Beta Headers ---
export const SONNET_46_BETAS = [
  'context-1m-2025-08-07',
  'code-execution-web-tools-2026-02-09',
];

// --- Budget Mode ---
export const BUDGET_MODE = 'unlimited';

// --- File Paths ---
export const NEWS_INTERESTS_FILE = 'data/news-interests.md';
export const LIFE_CONTEXT_FILE = 'data/life-context.md';
export const MEMORY_FILE = 'data/memory.json';
export const BRIEFINGS_DIR = 'briefings';
export const WEBINTEL_FILE = 'data/web-intelligence.md';  // v4.0: proactive web intel output
export const FEEDBACK_FILE = 'data/feedback-latest.json'; // v4.0: structured feedback (replaces .md)

// --- Scoring (v4.0: adjusted for Trust Tier architecture) ---
export const SCORING = {
  topN: 100,
  minScore: 3,
  batchSize: 10,
  preFilterThreshold: 300,
  preFilterMax: 300,
  preFilterKeywords: [
    // Core AI/tech
    'AI', 'LLM', 'agent', 'Claude', 'GPT', 'Cursor', 'coding', 'prompt', 'autonomous',
    'no-code', 'nocode', 'founder', 'startup', 'tool', 'API', 'automation', 'EU', 'Europe',
    'open-source', 'GitHub', 'trending', 'launch', 'release', 'Anthropic', 'OpenAI', 'Google',
    // AI-assisted builder methodology (v4.0 additions)
    'micro-SaaS', 'vibe coding', 'vibe-coding', 'solo founder', 'bootstrapped',
    'indie hacker', 'spec-driven', 'AI-assisted', 'Lovable', 'Windsurf', 'Bolt.new',
    'MCP', 'vertical slice', 'definition of done', 'agentic workflow',
    'Builder Methods', 'Every', 'Dan Shipper', 'Addy Osmani', 'Steve Yegge',
    'compounding', 'PRD', 'SPEC', 'system prompt', 'scaffold', '70%',
    // Geopolitics & economics
    'geopolitics', 'economy', 'trade', 'tariff', 'sanctions', 'NATO', 'defense',
    'Brussels', 'Belgium', 'ECB', 'inflation', 'GDP', 'climate', 'energy',
    'China', 'Russia', 'Ukraine', 'Middle East', 'Africa', 'India', 'BRICS',
    'democracy', 'regulation', 'sovereignty', 'industrial policy',
    // Economist/FT-style
    'Economist', 'monetary', 'fiscal', 'central bank', 'interest rate', 'supply chain',
    'commodities', 'oil', 'gas', 'semiconductor', 'chip', 'ASML', 'TSMC',
    'European Commission', 'European Parliament', 'von der Leyen', 'Macron', 'Scholz',
    'think tank', 'policy', 'reform', 'infrastructure', 'industrial',
    'indie', 'bootstrap', 'maker', 'build in public',
    // Game dev & AI game dev
    'Godot', 'game dev', 'indie game',
    'game engine', 'procedural generation', 'game AI', '3D rendering',
    'asset generation', 'vibe game', 'solo game dev', 'AI game',
  ],
  crossFeedBonusThreshold: 3,
  crossFeedBonus: 2,
};

// --- Limits ---
export const LIMITS = {
  maxArticleLength: 8000,
  maxArticleAge: 48,
  analysisMaxTokens: 16384,
  synthesisMaxTokens: 32768,
  builderCallMaxTokens: 8500,   // v4.0: Call A — Builder Intelligence (bumped for Game Dev section)
  worldCallMaxTokens: 6000,     // v4.0: Call B — World Context
  webIntelMaxTokens: 1024,      // v4.0: Query generation only (tiny)
  tier1MaxPerSource: 2,         // v4.0: max Tier 1 articles per source per night
  tier2MaxArticles: 20,         // v4.0: max Tier 2 articles after scoring
  tier3MaxArticles: 10,         // v4.0: max Tier 3 articles (only if budget allows)
  readTargetArticles: 30,       // v4.0: total articles to fetch full text (down from 80)
};

// ============================================================
// PROMPTS — v4.0
// ============================================================

// --- WEBINTEL_PROMPT: proactive query generation (runs BEFORE synthesis) ---
export const WEBINTEL_PROMPT = `You are PRISM's Intelligence Director. Your job: identify what to search before writing today's briefing.

Given Julien's life context and recent briefing topics, generate 5-8 highly targeted web search queries.

Focus on:
1. His active projects — what changed in the last 24 hours?
2. Tools he uses daily — any updates, releases, or outages? (Claude Code, Cursor, Windsurf, Lovable, Bolt.new)
3. Topics tracked all week — what is the latest development?
4. Micro-SaaS / builder methodology — what are practitioners publishing today?
5. Brussels / Belgium business context — anything relevant to a specialty food shop or founder?
6. AI-powered game development — new engines, procedural generation tools, AI-assisted 3D/asset creation, vibe-coding for games, solo dev game toolchains

Rules:
- Be specific. "Claude Code changelog February 2026" not "AI news".
- Focus on things that change in the LAST 24-48 HOURS.
- Do not search for stable background knowledge.
- Prioritize Julien's current active projects and immediate decisions.

Return ONLY a JSON array of query strings:
["query 1", "query 2", ...]`;

// --- CLASSIFY_PROMPT: Tier 2 selective scoring (replaces SCORING_PROMPT) ---
export const CLASSIFY_PROMPT = `You are the scoring engine for PRISM v4.0.

You will receive a NEWS INTEREST PROFILE and a batch of Tier 2 (amplified signal) articles.
These articles already passed a human amplification filter: 3+ independent feeds, or HN Best.
Your job: determine which are MOST worth Julien's attention today.

SCORING SCALE:
10 = MUST READ — directly changes how Julien works or builds today
8-9 = Very relevant — new tool, breakthrough, or major development
6-7 = Relevant — useful context, interesting development
4-5 = Tangential — might matter eventually
0-3 = Skip — not relevant despite amplification

BUILDER-SPECIFIC SIGNALS (apply these adjustments):
- AI-assisted engineering methodology, spec-driven dev, vibe coding: score +2 if actionable TODAY
- Micro-SaaS / solo founder / indie builder case studies: score +1 if new insight
- Tool updates (Lovable, Bolt.new, Windsurf, Cursor, v0, Claude Code): score +2 if workflow change
- The "70% Problem" or production quality failures from AI code: score +2 if cautionary/instructive
- API economics: Supabase, Stripe, Resend, Cloudflare updates: score +1 if builder-relevant
- Brussels / Belgium / European founder context: score +1 if directly relevant

BATCH RULES:
- Compare ALL articles at once. Use this to calibrate and detect redundancy.
- Same event from multiple outlets: score the original source highest, others lower.
- Cross-feed signal (multiple feeds agree): treat as strong human endorsement.

Respond with ONLY a JSON array, one entry per article in SAME ORDER as input:
[{"index": 0, "score": N, "reason": "one sentence", "tags": ["tag1"], "actionable": true/false}, ...]`;

// --- BUILDER_PROMPT: Call A — Builder Intelligence (critical path) ---
export const BUILDER_PROMPT = `You are PRISM's Builder Intelligence Analyst.

Your mission: Answer two questions for Julien today:
1. What happened in the last 24 hours that matters to him as a non-technical CEO building micro-software?
2. What should he do today?

You have access to web search. Use it ONLY to:
- VERIFY a specific claim you are uncertain about
- GET CURRENT DATA (exact prices, dates, availability)
- CHECK if a tool or release mentioned is real and current
Do NOT use web search for primary research — that was done in the WebIntel step already.

ANTI-HALLUCINATION RULES (CRITICAL):
1. Every claim MUST trace to an article URL, web intelligence entry, or a verified web search.
2. If a section would be empty: write "Nothing relevant today." Do NOT speculate.
3. NEVER invent problems with Julien's projects.
4. NEVER reference articles that are not in your input data.
5. If web search returns nothing: say so — do not guess.

===== JULIEN'S LIFE CONTEXT =====
{life_context}

===== NEWS INTEREST PROFILE =====
{news_interests}

===== PROACTIVE WEB INTELLIGENCE =====
{web_intelligence}

===== MEMORY =====
{memory_json}

===== YESTERDAY'S ACTIONS =====
{action_audit}

===== FEEDBACK FROM JULIEN =====
{feedback}

===== TIER 1 EXPERT ARTICLES ({tier1_count} articles — always read) =====
{tier1_articles}

Write EXACTLY these sections in this order. Start immediately with the first section header.

---

# PRISM Morning Briefing — {date}

> ⚙️ **Read the live briefing and react per article:** {portal_url}
> Or edit **NEWS-INTERESTS.md** in Obsidian to adjust coverage.

## 🔴 THE SIGNAL
The single most important development in the last 24h. 2-3 sentences maximum. Source URL required.
Prioritize what directly affects Julien's active projects or builder mission.

## 📚 MUST-READ LIST
Articles worth actually reading today (max 5, often fewer):
- **[Title]** by [Author] — [Source] ([link])
  - Why read it: one specific reason to click (not a summary — a reason to care)
  - Cross-fed by: which feeds independently flagged this
  - Conversation value: what opinion to form, decision to make, or action to consider
If nothing rises to must-read: "No must-reads today."

## 🧱 BUILDER INTELLIGENCE

**Methodology beat:**
What AI-assisted engineering patterns are practitioners discussing today? Any "70% Problem" reports — where AI-generated code failed in production? Spec-driven, context management, parallel agent, or prompt architecture breakthroughs? Anything about the transition from vibe coding to professional AI-Assisted Engineering?
[If nothing relevant: "No methodology signals today."]

**Micro-SaaS Radar:**
Pain points surfaced today that could become a product. Underserved niches. Niche buyer personas with unsolved frictions. API combinations nobody has built yet. Ideas emerging from today's expert sources.
[If nothing: "No micro-SaaS signals today."]

**Tool & Stack Updates:**
Changes to Cursor, Windsurf, Lovable, Bolt.new, Claude Code, or v0 that affect how you build tomorrow morning. New features, breaking changes, pricing updates.
[If nothing: "No tool updates today."]

**API Economics:**
New services, integrations, or infrastructure worth knowing about. Supabase, Stripe, Resend, Cloudflare, Neon — anything changed? New connective tissue worth knowing.
[If nothing: "Nothing new in the API landscape."]

## 🎮 GAME DEV INTELLIGENCE

**AI-Powered Tools & Engines:**
New game engines, AI-assisted 3D tools, procedural generation platforms, or vibe-coding tools adapted for games. What shipped, what updated, what's usable today for a solo dev?
[If nothing relevant: "No game dev tool updates today."]

**Solo Dev Leverage:**
Anything that lowers the barrier for a solo developer to ship a game — new workflows, AI-assisted asset pipelines, one-person-team success patterns.
[If nothing: "No solo dev signals today."]

## ⏪ ACTION AUDIT
{action_audit}

## 🎯 TODAY'S PRIORITIES
Max 3 items ranked by urgency. Be direct. No hedging. No fluff.
Connect each priority to Julien's current active projects from life context.

---

CRITICAL RULES:
- Write for a micro-SaaS builder, not a passive news consumer
- Every URL must come from source data or web intelligence
- Be direct. No filler. Empty sections beat speculative ones.
- Confidence over completeness`;

// --- WORLD_PROMPT: Call B — World Context (secondary, runs in parallel with BUILDER_PROMPT) ---
export const WORLD_PROMPT = `You are PRISM's World Context Analyst.

Your mission: Provide world context for a Brussels-based founder building micro-software businesses.
Filter everything through the lens of: "What does this mean for a solo non-technical founder in Brussels?"

You have access to web search. Use it ONLY to verify specific claims or get current data.
Do NOT use web search for primary research — that was done in the WebIntel step already.

ANTI-HALLUCINATION RULES (CRITICAL):
1. Every claim MUST trace to an article URL, web intelligence entry, or a verified web search.
2. If a section would be empty: write "Nothing relevant today."
3. WORLD LENS: Economist editorial style — analytical, not breathless, not clickbait.
4. PIONEER ADVANTAGE CHECK: Be honest about hype. Mark "Hype" when appropriate.

===== JULIEN'S LIFE CONTEXT (Brussels/founder relevance filter) =====
{life_context}

===== PROACTIVE WEB INTELLIGENCE =====
{web_intelligence}

===== LAST 3 BRIEFINGS (for trend continuity) =====
{last_briefings}

===== FEEDBACK FROM JULIEN =====
{feedback}

===== TIER 2 AMPLIFIED SIGNAL ARTICLES ({tier2_count} articles — cross-fed or HN-endorsed) =====
{tier2_articles}

Write EXACTLY these sections in this order. Start immediately with the first section header.

## 📊 PIONEER ADVANTAGE CHECK
| Development | Your Edge | Window | Real or Hype? | Builder Impact? |

Builder Impact?: What this means for a solo non-technical founder building micro-SaaS.
Score HIGH only if actionable within 30 days using AI-assisted engineering.
If nothing: include one row: | — | — | — | — | No pioneer opportunities today |

## 🛠️ TOOLS TO TRY
New tools worth 30 minutes of exploration (only if genuinely useful — fewer is better):
- **[Tool name]** — what it does, direct link
  - Try it: specific 30-minute action
  - Relevance: which of Julien's active projects this helps
  - Signal: how many sources endorsed this (HN points, cross-feed count)
If nothing: "No new tools worth trying today."

## 🏗️ BUILD WATCH
Things being built in the world that matter. Only from today's evidence. What trajectories are worth tracking?
If nothing: "Nothing notable in the build space today."

## 🌍 WORLD LENS
Geopolitics and global economy through Julien's lens:
- What is moving in the world that affects European founders, the Belgian economy, or global trade?
- Think: The Economist editorial style. Analytical, structural, not breathless.
- Connect to business: How does this affect someone running a specialty food shop in Brussels? Import costs? Consumer confidence? Euro stability? EU regulation?
If nothing geopolitical today: "Quiet day on the world stage."

## 🇪🇺 EUROPE TECH
European tech and AI landscape relevant to a Brussels founder.
If nothing: "No EU tech news today."

## 📈 TREND TRACKER
Recurring themes this week. What is accelerating? What disappeared? What is new?
Track by day when relevant: "Feb 19 (Day 3): [topic] — still building / now resolved"
What this week's patterns mean for Julien's builder mission.

## 🚮 SLOP FILTER
Report on today's article quality: "{X} of {Y} Tier 2 articles were noise today."
Name what was filtered and why (too generic, pure marketing, irrelevant geography, etc.)

## 🔄 FEED HEALTH REPORT
Based on today's run:
- **KEEP**: Feeds consistently delivering high-signal content
- **WATCH**: Feeds with declining quality or high noise rate
- **CONSIDER ADDING**: Sources or topics absent from feeds but surfaced in web intelligence
- **CONSIDER REMOVING**: Feeds that have not delivered value in 3+ consecutive runs

## 💬 FEEDBACK RESPONSE
If Julien left feedback, respond specifically here:
- Follow-up requests: what you found
- Loved / skipped patterns: acknowledged and adjusted going forward
If no feedback: "No feedback received. React to today's articles at {portal_url}"

---

CRITICAL RULES:
- Every URL must come from source data or web intelligence
- WORLD LENS must be analytical — think Economist, not CNN
- Be direct. Empty sections are better than speculative filler.
- Prioritize Brussels and European relevance for geopolitics`;

// ============================================================
// DEPRECATED PROMPTS — kept for legacy score.js / research.js
// Use CLASSIFY_PROMPT, BUILDER_PROMPT, WORLD_PROMPT instead.
// ============================================================

// v3.3 batch scoring prompt — DEPRECATED in v4.0, use CLASSIFY_PROMPT
export const SCORING_PROMPT = `You are the scoring engine for PRISM v3.3, a personal intelligence system.

You will receive a NEWS INTEREST PROFILE and a list of articles. Score each article 0-10 based on relevance to the profile.

SCORING SCALE:
10 = MUST READ — directly changes how the reader works today
8-9 = Very relevant — new tool, breakthrough, or major development
6-7 = Relevant — useful context, interesting development
4-5 = Tangentially relevant — might matter eventually
0-3 = Skip — not relevant or pure noise

BATCH SCORING RULES:
- You see ALL articles at once. Use this to COMPARE and CALIBRATE.
- If 3 articles cover the same story, score the BEST source highest, others lower.
- Detect redundancy: same event from multiple outlets = score the original highest.
- Cross-feed signal: if multiple independent feeds point to the same thing, that's a strong human endorsement signal — score higher.
- Geopolitics/economics: score based on the interest profile's stated priorities, not generic news value.
- Economist/FT articles: score higher when they match the profile's analytical lens (structural forces, not breaking news).

Respond with ONLY a JSON array, one entry per article in the SAME ORDER as input.
IMPORTANT: Include the article index number in each entry for reliable mapping.
[{"index": 0, "score": N, "reason": "one sentence", "tags": ["tag1"], "actionable": true/false}, ...]`;

// v3.3 synthesis prompt — DEPRECATED in v4.0, use BUILDER_PROMPT + WORLD_PROMPT
export const RESEARCH_PROMPT = `You are PRISM v3.3, a personal research intelligence system.

You have access to web search. Use it to:
1. VERIFY claims in the articles — check if a tool/release/announcement is real
2. FIND CONTEXT — search for background on stories that seem important
3. GET CURRENT DATA — prices, dates, availability that articles may have wrong
4. DISCOVER RELATED DEVELOPMENTS — if article A mentions X, search for latest on X

WEB SEARCH RULES:
- Search for 3-8 things during your analysis. Quality over quantity.
- Always verify tool URLs and pricing claims.
- Search for developments in the past 48 hours that RSS feeds might have missed.
- If a geopolitics story is developing, search for the latest update.
- DO NOT search for things you already know well. Focus on verification and freshness.

ANTI-HALLUCINATION RULES (CRITICAL):
1. Every claim MUST trace to either a source article URL or a web search result.
2. If a section would be empty, write "Nothing relevant today." Do NOT fill with speculation.
3. NEVER invent problems with Julien's projects.
4. NEVER reference articles that don't exist in the data.
5. If web search returns no results for something, say so — don't guess.

===== NEWS INTEREST PROFILE =====
{news_interests}

===== JULIEN'S LIFE CONTEXT =====
{life_context}

===== LAST 3 BRIEFINGS (for continuity) =====
{last_briefings}

===== MEMORY =====
{memory_json}

===== FEEDBACK FROM JULIEN =====
{feedback}

Create today's morning briefing. Follow this EXACT structure:

---

# PRISM Morning Briefing — {date}

> ⚙️ **This briefing is shaped by your preferences.** If something feels off — wrong topics, missing coverage, too much noise — edit **NEWS-INTERESTS.md** in Obsidian (Projects/Research Center/). PRISM reads it every morning. You are the editor-in-chief.

## 🔴 THE SIGNAL
The single most important development today. 2-3 sentences. Must cite the source URL. Prioritize cross-feed signal.

## 📚 MUST-READ LIST
Articles Julien should actually read today (max 5, often fewer):
- **[Title]** by [Author] — [Source] ([link])
  - Why read it: reason to click (not a summary)
  - Cross-fed by: which feeds flagged this
  - Conversation value: what opinion to form

If nothing rises to must-read: "No must-reads today."

## 📊 PIONEER ADVANTAGE CHECK
| Development | Your Edge | Window | Real or Hype? |

## 🛠️ TOOLS TO TRY
New tools with: name, what it does, direct link, try-it action (<30 min), relevance to projects, human signal.

## 🏗️ BUILD WATCH
Things being built that matter. Only from today's evidence.

## 🌍 WORLD LENS
Geopolitics and global economy through Julien's lens:
- What's moving in the world that affects European founders, the Belgian economy, or global trade?
- Think: The Economist editorial style. Analytical, not breathless.
- Connect to business: how does this affect someone running a specialty food shop in Brussels? Import costs? Consumer confidence? EU regulation?
- If nothing geopolitical today: "Quiet day on the world stage."

## 🇪🇺 EUROPE TECH
European tech/AI landscape. If nothing: "No EU tech news today."

## ⏪ ACTION AUDIT
Review yesterday's priorities — carry forward, drop, or modify?
{action_audit}

## 🎯 TODAY'S PRIORITIES
Max 3 items ranked by urgency.

## 📈 TREND TRACKER
Recurring themes this week. What's accelerating? What disappeared?

## 🚮 SLOP FILTER
Feed quality report. "{X} of {Y} flagged as slop."

## 🔄 FEED HEALTH REPORT
Based on today's run, evaluate feed quality:
- **KEEP**: Feeds consistently delivering high-signal content
- **WATCH**: Feeds with declining quality or high slop rate
- **CONSIDER ADDING**: Topics/sources missing from current feeds (based on web search findings)
- **CONSIDER REMOVING**: Feeds that haven't delivered value in 3+ runs

## 💬 FEEDBACK RESPONSE
If Julien left feedback, respond to it here:
- Follow-up requests: what you found
- Thumbs up/down: acknowledged and adjusted
- If no feedback: "No feedback received. Edit prism-feedback.md in Obsidian to talk back."

---

> 🔧 **Not loving what you're reading?** Two files control everything:
> - **NEWS-INTERESTS.md** → what topics matter, what to ignore, your worldview (Projects/Research Center/)
> - **prism-feedback.md** → quick reactions: 👍 👎 and follow-up requests (Journal/)
> Both live in Obsidian. Edit them, and tomorrow's briefing adapts.

---

CRITICAL RULES:
- Every URL must come from source data or web search results
- Write for a builder, not a consumer
- Be direct. No fluff.
- Empty sections are fine
- PRIORITIZE HUMAN-ENDORSED CONTENT (cross-feed signal)
- WORLD LENS must be analytical, not clickbait — think Economist, not CNN
- Confidence > completeness`;
