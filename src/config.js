// ============================================================
// PRISM v3.1 Configuration — Expanded feeds, no retail/youtube
// Everything you need to tune lives here.
// ============================================================

// --- RSS Feeds (v3.1: 20 categories, ~150 feeds) ---
export const FEED_CATEGORIES = {
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
      // v3.1: new
      'https://www.cursor.com/blog/rss.xml',           // Cursor — your daily coding tool
      'https://vercel.com/atom',                         // Vercel — Next.js, AI SDK
      'https://blog.cloudflare.com/rss/',                // Cloudflare — Workers, edge AI
      'https://blog.langchain.dev/rss/',                 // LangChain — agent frameworks
      'https://supabase.com/blog/rss.xml',               // Supabase — database + edge functions
    ],
  },

  // =====================================================
  // Category 2: AI Labs — Official Sources
  // =====================================================
  ai_labs: {
    weight: 0.95,
    feeds: [
      'https://openai.com/news/rss.xml',                                    // OpenAI official
      'https://raw.githubusercontent.com/Olshansk/rss-feeds/main/feeds/feed_anthropic_news.xml', // Anthropic (community)
      'https://deepmind.google/blog/feed.xml',                               // Google DeepMind
      'https://ai.meta.com/blog/rss/',                                       // Meta AI — LLaMA, open models
    ],
  },

  // =====================================================
  // Category 3: AI News
  // =====================================================
  ai_news: {
    weight: 0.9,
    feeds: [
      'https://jack-clark.net/feed/',                    // Import AI
      'https://www.artificialintelligence-news.com/feed/',
      'https://the-decoder.com/feed/',
      'https://venturebeat.com/category/ai/feed/',
      // v3.1: removed marktechpost (low quality)
    ],
  },

  // =====================================================
  // Category 4: AI Thinkers & Practitioners
  // =====================================================
  ai_thinkers: {
    weight: 0.9,
    feeds: [
      'https://www.youtube.com/feeds/videos.xml?channel_id=UCXHV3FJAyrFJXuVWQRCv2Yw', // Andrej Karpathy
      'https://huyenchip.com/feed.xml',                  // Chip Huyen — ML systems
      'https://sebastianraschka.com/rss_feed.xml',       // Sebastian Raschka — LLM training
      'https://www.swyx.io/rss.xml',                     // Swyx — AI engineering
      'https://magazine.sebastianraschka.com/feed',       // Ahead of AI — monthly deep dives
      'https://www.deeplearning.ai/the-batch/feed/',      // The Batch — Andrew Ng
    ],
  },

  // =====================================================
  // Category 5: No-Code & Low-Code
  // =====================================================
  nocode: {
    weight: 0.95,
    feeds: [
      'https://blog.replit.com/feed.xml',
      'https://blog.val.town/rss.xml',
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
      // v3.1: new
      'https://www.lennysnewsletter.com/feed',           // Lenny's Newsletter — #1 product/growth
      'http://www.aaronsw.com/2002/feeds/pgessays.rss',  // Paul Graham essays
      'https://pluralistic.net/feed/',                    // Cory Doctorow — tech culture, monopolies
      'https://ihrss.io/organic',                         // Indie Hackers top discussions
      'https://ihrss.io/group/building-in-public',       // Indie Hackers: building in public
      'https://thesaasplaybook.substack.com/feed',       // SaaS Playbook — bootstrapped
      'https://www.producthunt.com/feed',                 // Product Hunt daily
      'https://news.ycombinator.com/rss',                 // HN frontpage
      'https://techcrunch.com/category/startups/feed/',   // TechCrunch Startups
      'https://a16z.com/feed/',                           // a16z — VC perspective
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
      // v3.1: new
      'https://www.reddit.com/r/godot/top/.rss?t=day',   // Godot community
      'https://www.reddit.com/r/gamedev/top/.rss?t=day',  // Broader game dev
      'https://www.reddit.com/r/IndieDev/top/.rss?t=day', // Indie game devs
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
      // v3.1: new
      'https://stability.ai/news/feed',                   // Stable Diffusion, image gen
      'https://runwayml.com/blog/rss.xml',                 // Runway — video AI
      'https://www.wired.com/feed/rss',                    // WIRED — tech + culture
    ],
  },

  // =====================================================
  // Category 9: Europe Tech
  // =====================================================
  europe_tech: {
    weight: 0.75,
    feeds: [
      'https://sifted.eu/feed/',
      'https://eu-startups.com/feed/',
      'https://siliconcanals.com/feed/',
      'https://tech.eu/feed/',
      'https://www.brusselsmorning.com/feed/',
      'https://www.politico.eu/section/technology/feed/',
    ],
  },

  // =====================================================
  // Category 10: Big Picture
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
      // v3.1: new HN variants
      'https://hnrss.org/best?count=20&q=agent+OR+autonomous+OR+agentic', // Agentic AI wave
      'https://hnrss.org/best?count=15&q=Claude+OR+Anthropic',             // Your primary tool
      'https://hnrss.org/best?count=15&q=Europe+OR+EU+OR+Brussels',        // European angle on HN
      'https://hnrss.org/whoishiring/jobs',                                 // Job market signal
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
  // Category 12: Reddit AI Communities
  // =====================================================
  reddit_ai: {
    weight: 0.75, // v3.1: lowered from 0.8 — getting noisy
    feeds: [
      'https://www.reddit.com/r/LocalLLaMA/top/.rss?t=day',
      'https://www.reddit.com/r/MachineLearning/top/.rss?t=day',
      'https://www.reddit.com/r/ClaudeAI/top/.rss?t=day',
      'https://www.reddit.com/r/singularity/top/.rss?t=day',
      // v3.1: new
      'https://www.reddit.com/r/ChatGPT/top/.rss?t=day',         // Competitor intelligence
      'https://www.reddit.com/r/artificial/top/.rss?t=day',       // Broader AI discussion
      'https://www.reddit.com/r/StableDiffusion/top/.rss?t=day',  // Creative AI community
    ],
  },

  // =====================================================
  // Category 13: Geopolitics & Global Economy
  // The Economist / Adam Tooze / Bruegel style
  // =====================================================
  geopolitics: {
    weight: 0.90, // v3.1: bumped from 0.85
    feeds: [
      'https://www.project-syndicate.org/rss',
      'https://www.bruegel.org/rss.xml',
      'https://adamtooze.substack.com/feed',             // Chartbook
      'https://www.noahpinion.blog/feed',                 // Noah Smith
      'https://marginalrevolution.com/feed',               // Tyler Cowen
      'https://www.foreignaffairs.com/rss.xml',
      'https://ecfr.eu/feed/',                             // European Council on Foreign Relations
      'https://www.chathamhouse.org/rss',
      // v3.1: new
      'https://www.slowboring.com/feed',                   // Matt Yglesias — policy analysis
      'https://theovershoot.co/feed',                      // Matthew C. Klein — macro research
      'https://timothyash.substack.com/feed',              // Timothy Ash — EM & geopolitics
      'https://www.geopoliticaldispatch.com/feed',         // Strategic geopolitical insights
      'https://braddelong.substack.com/feed',              // DeLong — economic history
      'https://constructionphysics.substack.com/feed',     // Brian Potter — industrial technology
      'https://geopoliticsunplugged.substack.com/feed',    // Daily geopolitical briefings
      'https://geopoliticalfutures.com/feed/',              // George Friedman — forecasting
      'https://carnegieeurope.eu/rss/',                     // Carnegie Europe — security & democracy
    ],
  },

  // =====================================================
  // Category 14: The Economist (section feeds)
  // =====================================================
  economist: {
    weight: 0.90,
    feeds: [
      'https://www.economist.com/leaders/rss.xml',                      // Editorial opinion
      'https://www.economist.com/europe/rss.xml',                       // European politics & economy
      'https://www.economist.com/finance-and-economics/rss.xml',       // Macro, ECB, trade
      'https://www.economist.com/asia/rss.xml',                         // China, India, BRICS
      'https://www.economist.com/science-and-technology/rss.xml',      // Tech through Economist lens
      'https://www.economist.com/business/rss.xml',                     // Global business trends
      'https://www.economist.com/middle-east-and-africa/rss.xml',      // MENA coverage
    ],
  },

  // =====================================================
  // Category 15: Financial Times (section feeds)
  // =====================================================
  ft_sections: {
    weight: 0.80,
    feeds: [
      'https://www.ft.com/world?format=rss',                           // Global news
      'https://www.ft.com/global-economy?format=rss',                  // Macro, trade, GDP
      'https://www.ft.com/opinion?format=rss',                         // Martin Wolf, Rana Foroohar
      'https://www.ft.com/climate-capital?format=rss',                 // Green transition, energy
    ],
  },

  // =====================================================
  // Category 16: European Think Tanks
  // =====================================================
  eu_think_tanks: {
    weight: 0.80,
    feeds: [
      'https://www.ceps.eu/feed/',                        // CEPS — Centre for European Policy Studies (Brussels)
      'https://www.epc.eu/feed/',                          // EPC — European Policy Centre (Brussels)
      'https://www.egmontinstitute.be/feed/',              // Egmont — Belgian foreign policy
      'https://www.swp-berlin.org/en/rss-feeds/',          // SWP — German security & foreign policy
      'https://thediplomat.com/feed/',                     // The Diplomat — Asia-Pacific
      'https://www.euractiv.com/feed/',                    // Euractiv — EU policy
    ],
  },

  // =====================================================
  // Category 17: Europe Politics & Policy
  // =====================================================
  europe_politics: {
    weight: 0.85, // v3.1: bumped from 0.8
    feeds: [
      'https://www.politico.eu/feed/',
      'https://euobserver.com/rss',
      'https://www.dw.com/en/top-stories/europe/rss',
      'https://www.theguardian.com/world/europe-news/rss',
      'https://www.euronews.com/rss',
      // v3.1: new
      'https://www.france24.com/en/rss',                   // French global perspective
      'https://www.reuters.com/world/rss',                  // Reuters wire service
    ],
  },

  // =====================================================
  // Category 18: Global Quality News
  // =====================================================
  global_quality: {
    weight: 0.75, // v3.1: bumped from 0.65
    feeds: [
      'https://feeds.bbci.co.uk/news/world/rss.xml',
      'https://www.aljazeera.com/xml/rss/all.xml',
      'https://www.ft.com/rss/home',
    ],
  },

  // =====================================================
  // Category 19: Reddit Geopolitics & Communities
  // =====================================================
  reddit_geopolitics: {
    weight: 0.7,
    feeds: [
      'https://www.reddit.com/r/geopolitics/top/.rss?t=day',
      'https://www.reddit.com/r/europe/top/.rss?t=day',
      'https://www.reddit.com/r/economics/top/.rss?t=day',
      // v3.1: new
      'https://www.reddit.com/r/GlobalTalk/top/.rss?t=day',          // International perspectives
      'https://www.reddit.com/r/EuropeanFederalists/top/.rss?t=week', // EU integration
      'https://www.reddit.com/r/belgica/top/.rss?t=day',              // Belgian news
    ],
  },

  // =====================================================
  // Category 20: Meta, Philosophy & Deep Reads
  // =====================================================
  meta_philosophy: {
    weight: 0.55,
    feeds: [
      'https://80000hours.org/feed/',                      // Career impact, AI safety, EA
      'https://www.astralcodexten.com/feed',               // Scott Alexander — rationality, science
      'https://www.lesswrong.com/feed.xml',                // Rationality, AI alignment
      'https://timharford.com/feed/',                       // Undercover Economist
      'https://waitbutwhy.com/feed',                        // Long-form explainers
      'https://fs.blog/feed/',                              // Farnam Street — mental models
      'https://thebrowser.com/feed/',                       // Curated best writing on the web
      'https://worksinprogress.co/feed',                    // Progress, science, infrastructure
      'https://www.palladiummag.com/feed/',                 // Governance, technology, civilization
      'https://www.noemamag.com/feed/',                     // Cross-disciplinary thinking
      'https://www.ben-evans.com/feed',                     // Benedict Evans — weekly tech/macro
      'https://daringfireball.net/feeds/main',              // John Gruber — Apple, design, tech
    ],
  },
};

// --- Models (v3.0: ALL Sonnet 4.6) ---
export const MODELS = {
  scorer: 'claude-sonnet-4-6',
  analyzer: 'claude-sonnet-4-6',
  synthesizer: 'claude-sonnet-4-6',
};

// --- Sonnet 4.6 Beta Headers ---
export const SONNET_46_BETAS = [
  'context-1m-2025-08-07',           // 1M token context window
  'code-execution-web-tools-2026-02-09', // Web search + code execution
];

// --- Budget Mode ---
export const BUDGET_MODE = 'unlimited';

// --- News Interests ---
export const NEWS_INTERESTS_FILE = 'data/news-interests.md';

// --- Scoring (v3.1: 100 articles, expanded keywords for new categories) ---
export const SCORING = {
  topN: 100,        // v3.1: bumped from 80 — more feeds = more top articles
  minScore: 4,
  batchSize: 10,
  preFilterThreshold: 250, // v3.1: bumped from 200
  preFilterMax: 200,       // v3.1: bumped from 150
  preFilterKeywords: [
    'AI', 'LLM', 'agent', 'Claude', 'GPT', 'Cursor', 'coding', 'prompt', 'autonomous',
    'no-code', 'nocode', 'founder', 'startup', 'tool', 'API', 'automation', 'EU', 'Europe',
    'open-source', 'GitHub', 'trending', 'launch', 'release', 'Anthropic', 'OpenAI', 'Google',
    // geopolitics & economics
    'geopolitics', 'economy', 'trade', 'tariff', 'sanctions', 'NATO', 'defense',
    'Brussels', 'Belgium', 'ECB', 'inflation', 'GDP', 'climate', 'energy',
    'China', 'Russia', 'Ukraine', 'Middle East', 'Africa', 'India', 'BRICS',
    'democracy', 'regulation', 'sovereignty', 'industrial policy',
    // v3.1: Economist/FT-style keywords
    'Economist', 'monetary', 'fiscal', 'central bank', 'interest rate', 'supply chain',
    'commodities', 'oil', 'gas', 'semiconductor', 'chip', 'ASML', 'TSMC',
    'European Commission', 'European Parliament', 'von der Leyen', 'Macron', 'Scholz',
    'think tank', 'policy', 'reform', 'infrastructure', 'industrial',
    'founder', 'indie', 'bootstrap', 'maker', 'build in public',
    'Godot', 'game dev', 'indie game',
  ],
  crossFeedBonusThreshold: 3,
  crossFeedBonus: 2,
};

// --- Life Context ---
export const LIFE_CONTEXT_FILE = 'data/life-context.md';

// --- Memory ---
export const MEMORY_FILE = 'data/memory.json';
export const BRIEFINGS_DIR = 'briefings';

// --- Limits (v3.1: expanded for more feeds) ---
export const LIMITS = {
  maxArticleLength: 8000,
  maxArticleAge: 48,
  analysisMaxTokens: 16384,
  synthesisMaxTokens: 32768,
};

// --- Prompts ---

// v3.0: Batch scoring prompt — one Sonnet call for ALL articles
export const SCORING_PROMPT = `You are the scoring engine for PRISM v3.1, a personal intelligence system.

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

Respond with a JSON array, one entry per article in the SAME ORDER as input:
[{"score": N, "reason": "one sentence", "tags": ["tag1"], "actionable": true/false}, ...]`;

// v3.0: THE BIG CALL — single massive prompt for research + synthesis
export const RESEARCH_PROMPT = `You are PRISM v3.1, a personal research intelligence system.

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
