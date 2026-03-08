// ============================================================
// PRISM v5.0 Configuration
//
// Core rule:
//   daily oversight across all domains, depth on one domain only
//
// Active pipeline:
//   Context → Collect → [Classify ∥ WebIntel] → Read →
//   Synthesize → Validate → Deliver
//
// This file defines:
// - feed categories and trust tiers
// - theme cycle and override thresholds
// - output limits
// - prompts used by the v5 run path
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

  // =====================================================
  // Category 20: Grassroot Scout — cooperative/social/environmental tech
  // scoutOnly: true — articles feed the scout radar, not the main briefing.
  // =====================================================
  grassroot_scout: {
    weight: 1.0,
    scoutOnly: true,
    feeds: [
      'https://lobste.rs/t/practices.rss',
      'https://lobste.rs/t/culture.rss',
      'https://www.reddit.com/r/opensource/.rss',
      'https://www.reddit.com/r/selfhosted/.rss',
      'https://www.reddit.com/r/belgium/.rss',
      'https://www.reddit.com/r/cooperatives/.rss',
      'https://www.reddit.com/r/SideProject/.rss',
      'https://itsfoss.com/feed/',
      'https://lwn.net/headlines/rss',
      'https://fosdem.org/2026/news/atom',
      'https://blog.opencollective.com/rss/',
      'https://nlnet.nl/feed.atom',
      'https://bonfire.cafe/blog/feed',
      'https://decidim.org/blog/feed.xml',
      'https://coopyleft.coopcycle.org/en/feed.xml',
      'https://dev.to/feed/tag/opensource',
      'https://dev.to/feed/tag/socialimpact',
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
export const WEBINTEL_FILE = 'data/web-intelligence.md';
export const SCOUT_MEMORY_FILE = 'data/scout-memory.json';

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
    // Grassroot scout keywords
    'cooperative', 'community-owned', 'social impact', 'environmental',
    'incubator', 'subsidy', 'grant', 'NLnet', 'Innoviris', 'NGI0',
    'Transition Towns', 'CoopCycle', 'Decidim', 'Bonfire', 'fediverse',
    'cooperative platform', 'open-source alternative',
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
  builderCallMaxTokens: 8500,
  worldCallMaxTokens: 6000,
  webIntelMaxTokens: 1024,      // v4.0: Query generation only (tiny)
  tier1MaxPerSource: 2,         // v4.0: max Tier 1 articles per source per night
  tier2MaxArticles: 20,         // v4.0: max Tier 2 articles after scoring
  tier3MaxArticles: 10,         // v4.0: max Tier 3 articles (only if budget allows)
  readTargetArticles: 18,       // v5.0: smaller read set for daily core + theme focus
  scoutCallMaxTokens: 4000,
  scoutMaxCatches: 5,
  scoutMaxRawCatches: 15,
  scoutMemoryDays: 30,
  mustReadMax: 3,
  actionAuditMax: 3,
  prioritiesMax: 3,
  radarThemes: 3,
  forecastDays: 3,
  briefingTargetWords: 1400,
  briefingHardCapWords: 1800,
};

export const THEME_CYCLE = {
  order: ['dev', 'grassroot', 'game', 'geo_eu'],
  forecastDays: 3,
};

export const THEME_OVERRIDE_CONFIG = {
  scoreMultiplier: 1.4,
  minScoreDelta: 4,
};

export const THEME_CONFIG = {
  dev: {
    label: 'Software Dev & AI Building',
    shortLabel: 'Dev',
    categories: ['ai_builder', 'ai_tools', 'nocode', 'indie_founders', 'github_trending', 'tech_communities'],
    projectKeywords: ['cursor', 'codex', 'blog', 'prism', 'software', 'builder', 'micro-saas'],
    directImpactKeywords: ['cursor', 'claude code', 'windsurf', 'lovable', 'bolt', 'release', 'pricing', 'outage', 'api'],
    urgentKeywords: ['breaking', 'released', 'launch', 'pricing', 'deprecated', 'outage', 'security'],
    webIntelPrompt: 'tool releases, builder workflows, AI-assisted engineering, micro-software opportunities',
  },
  grassroot: {
    label: 'Grassroot Hopper & Cooperative Tech',
    shortLabel: 'Grassroot',
    categories: ['grassroot_scout'],
    projectKeywords: ['grassroot hopper', 'movement', 'cooperative', 'community-owned'],
    directImpactKeywords: ['grassroot hopper', 'cooperative', 'community-owned', 'grant', 'funding', 'innoviris', 'nlnet', 'brussels', 'belgium'],
    urgentKeywords: ['open call', 'deadline', 'launch', 'grant', 'funding', 'brussels', 'belgium'],
    webIntelPrompt: 'aligned people, cooperative/community tech, Brussels/Belgium movement signals, grants and funding',
  },
  game: {
    label: 'Game Dev & Creative AI',
    shortLabel: 'Game',
    categories: ['gamedev', 'gamedev_ai', 'creative_ai'],
    projectKeywords: ['game', 'godot', 'chez julien simulator', 'interactive'],
    directImpactKeywords: ['game', 'unity', 'godot', 'unreal', 'asset', 'animation', 'creative ai'],
    urgentKeywords: ['release', 'launch', 'gdc', 'beta', 'tool update'],
    webIntelPrompt: 'solo game development, creative AI tools, interactive experiments, usable game pipelines',
  },
  geo_eu: {
    label: 'Geopolitics, EU Economics & Brussels Context',
    shortLabel: 'Geo-EU',
    categories: ['geopolitics', 'economist', 'ft_sections', 'europe_politics', 'global_quality', 'europe_tech'],
    projectKeywords: ['chez julien', 'brussels', 'belgium', 'europe'],
    directImpactKeywords: ['belgium', 'brussels', 'vat', 'european union', 'eu', 'energy', 'inflation', 'tariff', 'regulation'],
    urgentKeywords: ['vat', 'regulation', 'energy', 'tariff', 'sanction', 'inflation', 'deadline'],
    webIntelPrompt: 'Belgium and Brussels business context, EU economics, geopolitics with direct local impact',
  },
};

// ============================================================
// PROMPTS — v5.0
// ============================================================

export const THEMED_WEBINTEL_PROMPT = `You are PRISM's web intelligence planner for a themed daily briefing.

Return EXACTLY 6 JSON objects in a JSON array with this shape:
[
  {"query":"...", "theme":"dev|grassroot|game|geo_eu", "purpose":"one short sentence"},
  ...
]

Rules:
- Produce exactly 1 query for each theme so PRISM can maintain cross-domain radar.
- Produce 2 extra queries for the scheduled theme to deepen today's briefing.
- Queries must be about changes in the last 24-48 hours, not stable background knowledge.
- Use Julien's active projects and current life context to decide specificity.
- Keep purposes short and concrete.

Scheduled theme: {scheduled_theme}
Scheduled theme focus: {scheduled_theme_focus}
Today's date: {today}

Return only valid JSON.`;

// --- SCOUT_QUERY_POOL: rotating web search queries for Grassroot Radar ---
export const SCOUT_QUERY_POOL = [
  // Brussels/Belgium — run every night
  { query: 'Brussels open source startup 2026', bucket: 'brussels', priority: 'always' },
  { query: 'Belgian solo developer social impact project', bucket: 'brussels', priority: 'always' },
  { query: 'Innoviris new call open 2026', bucket: 'subsidies', priority: 'always' },
  // EU subsidies & incubators — rotate
  { query: 'NLnet NGI0 grantees 2026', bucket: 'subsidies', priority: 'rotate' },
  { query: 'European incubator social innovation open call 2026', bucket: 'subsidies', priority: 'rotate' },
  { query: 'Horizon Europe digital commons call 2026', bucket: 'subsidies', priority: 'rotate' },
  // Cooperative/community tech — rotate
  { query: 'cooperative platform software launch 2026', bucket: 'coop', priority: 'rotate' },
  { query: 'community-owned alternative to platform launch', bucket: 'coop', priority: 'rotate' },
  { query: 'site:indiehackers.com cooperative community platform', bucket: 'indie', priority: 'rotate' },
  // Environmental open source — rotate
  { query: 'open source environmental monitoring tool new', bucket: 'environment', priority: 'rotate' },
  { query: 'climate tech indie developer open source project 2026', bucket: 'environment', priority: 'rotate' },
  // GitHub trending — rotate
  { query: 'trending GitHub repo cooperative technology community', bucket: 'github', priority: 'rotate' },
  { query: 'new GitHub project community platform open source 2026', bucket: 'github', priority: 'rotate' },
  // Fediverse/indie — rotate
  { query: 'Mastodon #opensource social impact new project', bucket: 'fediverse', priority: 'rotate' },
  { query: 'indie hacker community platform launch 2026', bucket: 'indie', priority: 'rotate' },
  // Reference model activity — rotate
  { query: 'CoopCycle new city launch 2026', bucket: 'reference', priority: 'rotate' },
  { query: 'Decidim new deployment city 2026', bucket: 'reference', priority: 'rotate' },
  { query: 'Bonfire social network release update', bucket: 'reference', priority: 'rotate' },
  // AlternativeTo / Product Hunt — rotate
  { query: 'site:alternativeto.net cooperative open source community', bucket: 'alternatives', priority: 'rotate' },
  { query: 'Product Hunt cooperative community social impact launch', bucket: 'alternatives', priority: 'rotate' },
];

export const DAILY_THEME_PROMPT = `You are PRISM's daily oversight editor.

You are writing a concise morning briefing for Julien.
This is NOT a magazine. It is a decision-support brief.

Your job:
1. Keep daily oversight across all 4 domains.
2. Go deep on only one theme today.
3. Be concrete, terse, and useful.

Theme today: {theme_label}
Scheduled theme: {scheduled_theme_label}
Override reason: {override_reason}

Output contract:
- Write EXACTLY these 7 sections, in this exact order.
- Do not output any extra sections.
- Keep the full briefing under {word_target} words if possible and never exceed {hard_cap} words.
- MUST-READS max {must_read_max} items.
- ACTION AUDIT max {action_audit_max} bullets.
- CROSS-DOMAIN RADAR must contain exactly 3 bullets, one for each non-theme domain.
- TODAY'S PRIORITIES max {priorities_max} items.
- NEXT 3 DAYS must contain exactly 3 bullets with theme names only.

Anti-hallucination rules:
1. Every concrete claim must come from the supplied article or web intelligence material.
2. If a domain is quiet, say it is quiet. Do not pad.
3. Do not invent problems with Julien's projects.
4. Do not mention sections from older PRISM versions.

===== LIFE CONTEXT =====
{life_context}

===== NEWS INTEREST PROFILE =====
{news_interests}

===== ACTION AUDIT CONTEXT =====
{action_audit}

===== WEB INTELLIGENCE =====
{web_intelligence}

===== THEME CANDIDATES =====
{theme_candidates}

===== CROSS-DOMAIN RADAR CANDIDATES =====
{radar_candidates}

===== MUST-READ CANDIDATES =====
{must_read_candidates}

===== NEXT 3 DAYS =====
{next_days}

Start immediately with:

## 🔴 THE SIGNAL

Then continue with:

## 📚 MUST-READS

Use this exact list item format:
- **[Title]** — one sentence on why it matters today ([link](URL))

## ⏪ ACTION AUDIT

Use bullet points only.

## 🧭 CROSS-DOMAIN RADAR

Use exactly these domain labels as bold prefixes:
- **Dev**:
- **Grassroot**:
- **Game**:
- **Geo-EU**:

Only include the 3 non-theme domains. Do not include today's theme in radar.

## 🧠 THEME OF THE DAY

Start this section with:
**Theme:** {theme_label}

Then use exactly these three bold labels:
**What moved today**
**Why it matters**
**What to do or watch**

## 🎯 TODAY’S PRIORITIES

Use a numbered list.

## ⏭️ NEXT 3 DAYS

Use exactly 3 bullets, one per upcoming theme.`;

// --- CLASSIFY_PROMPT: selective scoring for amplified and long-tail candidates ---
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
