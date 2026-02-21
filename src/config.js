// ============================================================
// PRISM v3.3 Configuration
//
// v3.3 feed audit (2026-02-21):
//   - Removed all 16 Reddit feeds → blanket 403, Reddit blocks anonymous RSS
//   - Removed 11 dead 404 feeds (cursor, deepmind, meta AI, deeplearning.ai,
//     stability.ai, runway, DW old URL, ben-evans, worksinprogress, SWP Berlin, a16z)
//   - Removed 14 blocked feeds (sifted, eu-startups, siliconcanals, bruegel,
//     chatham house, CEPS, EPC, Euractiv + 6 Substack-hosted newsletters)
//   - Removed 6 parse/DNS/auth errors (ihrss.io, supabase, euronews, egmont,
//     reuters paywall, carnegie europe not-RSS)
//   - Removed reddit_geopolitics category entirely (100% Reddit feeds)
//   - Added: google AI blog, Lobste.rs AI/ML tags, DW corrected URL,
//     Adam Tooze custom domain
//   Net: 144 → ~99 feeds, 20 → 19 categories
//
// NOTE ON REDDIT: Reddit blocks anonymous RSS access with HTTP 403.
// Do NOT add reddit.com RSS feeds — they will never work without OAuth.
// Use community alternatives like lobste.rs or HN instead.
// ============================================================

// --- RSS Feeds (v3.3: 19 categories, ~99 feeds) ---
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
      'https://vercel.com/atom',                         // Next.js, AI SDK
      'https://blog.cloudflare.com/rss/',                // Workers, edge AI
      'https://blog.langchain.dev/rss/',                 // Agent frameworks
      // cursor.com/blog/rss.xml → 404, no working RSS known
      // supabase.com/blog/rss.xml → invalid XML (malformed feed)
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
      // deepmind.google/blog/feed.xml → 404
      // ai.meta.com/blog/rss/ → 404, Meta AI has no public RSS
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
      'https://www.swyx.io/rss.xml',                     // Swyx — AI engineering
      'https://magazine.sebastianraschka.com/feed',      // Ahead of AI — monthly deep dives
      // youtube Karpathy → 404, YouTube changed feed format
      // deeplearning.ai/the-batch/feed/ → 404
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
      'https://www.lennysnewsletter.com/feed',           // Lenny's Newsletter
      'http://www.aaronsw.com/2002/feeds/pgessays.rss',  // Paul Graham essays
      'https://pluralistic.net/feed/',                    // Cory Doctorow
      'https://www.producthunt.com/feed',                 // Product Hunt daily
      'https://news.ycombinator.com/rss',                 // HN frontpage
      'https://techcrunch.com/category/startups/feed/',   // TechCrunch Startups
      // ihrss.io → DNS not found (domain does not exist)
      // thesaasplaybook.substack.com → 403
      // a16z.com/feed/ → 404
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
      // reddit.com/r/godot, /r/gamedev, /r/IndieDev → all 403
      // Reddit blocks anonymous RSS access. Do not re-add.
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
      // stability.ai/news/feed → 404 (company acquired by Black Forest Labs)
      // runwayml.com/blog/rss.xml → 404
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
      // sifted.eu/feed/ → 403
      // eu-startups.com/feed/ → 403
      // siliconcanals.com/feed/ → 403
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
      'https://hnrss.org/best?count=20&q=agent+OR+autonomous+OR+agentic',
      'https://hnrss.org/best?count=15&q=Claude+OR+Anthropic',
      'https://hnrss.org/best?count=15&q=Europe+OR+EU+OR+Brussels',
      'https://hnrss.org/whoishiring/jobs',
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
  // Category 12: Tech Communities (formerly reddit_ai)
  //
  // Reddit blocks anonymous RSS (HTTP 403) — do not re-add reddit.com feeds.
  // Lobste.rs is a curated, invitation-only tech community with high signal-to-noise.
  // =====================================================
  tech_communities: {
    weight: 0.75,
    feeds: [
      'https://lobste.rs/t/ai.rss',                      // Lobste.rs AI tag
      'https://lobste.rs/t/ml.rss',                      // Lobste.rs ML tag
    ],
  },

  // =====================================================
  // Category 13: Geopolitics & Global Economy
  // =====================================================
  geopolitics: {
    weight: 0.90,
    feeds: [
      'https://www.project-syndicate.org/rss',
      'https://www.noahpinion.blog/feed',                 // Noah Smith
      'https://marginalrevolution.com/feed',              // Tyler Cowen
      'https://www.foreignaffairs.com/rss.xml',
      'https://ecfr.eu/feed/',                            // European Council on Foreign Relations
      'https://www.slowboring.com/feed',                  // Matt Yglesias — policy analysis
      'https://theovershoot.co/feed',                     // Matthew C. Klein — macro
      'https://www.geopoliticaldispatch.com/feed',        // Strategic insights
      'https://geopoliticalfutures.com/feed/',            // George Friedman — forecasting
      'https://adamtooze.com/feed/',                      // Adam Tooze — Chartbook (custom domain)
      // bruegel.org/rss.xml → 403
      // adamtooze.substack.com/feed → 403 (use adamtooze.com/feed/ above instead)
      // chathamhouse.org/rss → 403
      // timothyash.substack.com/feed → 403, no custom domain
      // braddelong.substack.com/feed → 403, no custom domain
      // constructionphysics.substack.com/feed → 403, no custom domain
      // geopoliticsunplugged.substack.com/feed → 403, no custom domain
      // carnegieeurope.eu/rss/ → not recognized as RSS format
    ],
  },

  // =====================================================
  // Category 14: The Economist (section feeds)
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
  // Category 15: Financial Times (section feeds)
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
      'https://thediplomat.com/feed/',                   // The Diplomat — Asia-Pacific focus
      // ceps.eu/feed/ → 500 (server error)
      // epc.eu/feed/ → 403
      // egmontinstitute.be/feed/ → unable to parse XML
      // swp-berlin.org/en/rss-feeds/ → 404
      // euractiv.com/feed/ → 403
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
      'https://rss.dw.com/rdf/rss-en-europe',            // DW Europe (corrected URL)
      'https://www.theguardian.com/world/europe-news/rss',
      'https://www.france24.com/en/rss',
      // euronews.com/rss → malformed XML (non-whitespace before first tag)
      // reuters.com/world/rss → 401 (paywall)
      // dw.com/en/top-stories/europe/rss → 404 (old URL, replaced above)
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
      // worksinprogress.co/feed → 404
      // ben-evans.com/feed → 404
    ],
  },

  // NOTE: reddit_geopolitics category removed entirely.
  // All feeds were Reddit RSS (r/geopolitics, r/europe, r/economics, etc.)
  // Reddit blocks anonymous RSS access — HTTP 403 on all feeds.
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

// --- Scoring (v3.3: adjusted for feed count reduction) ---
export const SCORING = {
  topN: 100,
  minScore: 3,
  batchSize: 10,
  preFilterThreshold: 300,  // v3.3: lowered — fewer feeds, fewer total articles
  preFilterMax: 300,        // v3.3: lowered accordingly
  preFilterKeywords: [
    'AI', 'LLM', 'agent', 'Claude', 'GPT', 'Cursor', 'coding', 'prompt', 'autonomous',
    'no-code', 'nocode', 'founder', 'startup', 'tool', 'API', 'automation', 'EU', 'Europe',
    'open-source', 'GitHub', 'trending', 'launch', 'release', 'Anthropic', 'OpenAI', 'Google',
    // geopolitics & economics
    'geopolitics', 'economy', 'trade', 'tariff', 'sanctions', 'NATO', 'defense',
    'Brussels', 'Belgium', 'ECB', 'inflation', 'GDP', 'climate', 'energy',
    'China', 'Russia', 'Ukraine', 'Middle East', 'Africa', 'India', 'BRICS',
    'democracy', 'regulation', 'sovereignty', 'industrial policy',
    // Economist/FT-style keywords
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

// --- Limits ---
export const LIMITS = {
  maxArticleLength: 8000,
  maxArticleAge: 48,
  analysisMaxTokens: 16384,
  synthesisMaxTokens: 32768,
};

// --- Prompts ---

// v3.0: Batch scoring prompt — one Sonnet call for ALL articles
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

// v3.0: THE BIG CALL — single massive prompt for research + synthesis
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
