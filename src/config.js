// ============================================================
// PRISM v3.0 Configuration — All Sonnet 4.6, expanded coverage
// Everything you need to tune lives here.
// ============================================================

// --- RSS Feeds (v3.0: 16 categories, ~75 feeds) ---
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
    ],
  },

  // =====================================================
  // Category 2: AI News
  // =====================================================
  ai_news: {
    weight: 0.9,
    feeds: [
      'https://jack-clark.net/feed/',
      'https://www.artificialintelligence-news.com/feed/',
      'https://the-decoder.com/feed/',
      'https://venturebeat.com/category/ai/feed/',
      'https://www.marktechpost.com/feed/',
    ],
  },

  // =====================================================
  // Category 3: No-Code & Low-Code
  // =====================================================
  nocode: {
    weight: 0.95,
    feeds: [
      'https://blog.replit.com/feed.xml',
      'https://blog.val.town/rss.xml',
    ],
  },

  // =====================================================
  // Category 4: Indie Founders
  // =====================================================
  indie_founders: {
    weight: 0.8,
    feeds: [
      'https://blog.pragmaticengineer.com/rss/',
      'https://entrepreneurshandbook.co/feed',
      'https://www.saastr.com/feed/',
    ],
  },

  // =====================================================
  // Category 5: Game Dev
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
  // Category 6: Creative AI
  // =====================================================
  creative_ai: {
    weight: 0.7,
    feeds: [
      'https://weirdwonderfulai.art/feed/',
      'https://www.creativebloq.com/feed',
      'https://arstechnica.com/ai/feed/',
      'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml',
    ],
  },

  // =====================================================
  // Category 7: Europe Tech
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
  // Category 8: Big Picture
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
    ],
  },

  // =====================================================
  // Category 9: Retail & Automation
  // =====================================================
  retail_automation: {
    weight: 0.75,
    feeds: [
      'https://www.retaildive.com/feeds/news/',
      'https://www.grocerydive.com/feeds/news/',
      'https://www.modernretail.co/feed/',
      'https://www.lightspeedhq.com/blog/feed/',
    ],
  },

  // =====================================================
  // Category 10: GitHub Trending
  // =====================================================
  github_trending: {
    weight: 0.85,
    feeds: [
      'https://mshibanami.github.io/GitHubTrendingRSS/daily/all.xml',
    ],
  },

  // =====================================================
  // Category 11: Reddit AI Communities
  // =====================================================
  reddit_ai: {
    weight: 0.8,
    feeds: [
      'https://www.reddit.com/r/LocalLLaMA/top/.rss?t=day',
      'https://www.reddit.com/r/MachineLearning/top/.rss?t=day',
      'https://www.reddit.com/r/ClaudeAI/top/.rss?t=day',
      'https://www.reddit.com/r/singularity/top/.rss?t=day',
    ],
  },

  // =====================================================
  // Category 12: YouTube AI
  // =====================================================
  youtube_ai: {
    weight: 0.7,
    feeds: [
      'https://www.youtube.com/feeds/videos.xml?channel_id=UCsBjURrPoezykLs9EqgamOA', // Fireship
      'https://www.youtube.com/feeds/videos.xml?channel_id=UCbfYPyITQ-7l4upoX8nvctg', // Two Minute Papers
      'https://www.youtube.com/feeds/videos.xml?channel_id=UCXUPKJO5MZQN11PqgIvyuvQ', // AI Explained
      'https://www.youtube.com/feeds/videos.xml?channel_id=UCLXo7UDZvByw2ixzpQCufnA', // Matt Wolfe
      'https://www.youtube.com/feeds/videos.xml?channel_id=UCZHmQk67mSJgfCCTn7xBfew', // Matthew Berman
    ],
  },

  // =====================================================
  // v3.0 Category 13: Geopolitics & Global Economy
  // The Economist / Adam Tooze / Bruegel style
  // =====================================================
  geopolitics: {
    weight: 0.85,
    feeds: [
      'https://www.project-syndicate.org/rss',
      'https://www.bruegel.org/rss.xml',
      'https://adamtooze.substack.com/feed',        // Chartbook
      'https://www.noahpinion.blog/feed',            // Noah Smith
      'https://marginalrevolution.com/feed',          // Tyler Cowen
      'https://www.foreignaffairs.com/rss.xml',
      'https://ecfr.eu/feed/',                        // European Council on Foreign Relations
      'https://www.chathamhouse.org/rss',
    ],
  },

  // =====================================================
  // v3.0 Category 14: Europe Politics & Policy
  // =====================================================
  europe_politics: {
    weight: 0.8,
    feeds: [
      'https://www.politico.eu/feed/',
      'https://euobserver.com/rss',
      'https://www.dw.com/en/top-stories/europe/rss',
      'https://www.theguardian.com/world/europe-news/rss',
      'https://www.euronews.com/rss',
    ],
  },

  // =====================================================
  // v3.0 Category 15: Global Quality News
  // =====================================================
  global_quality: {
    weight: 0.65,
    feeds: [
      'https://feeds.bbci.co.uk/news/world/rss.xml',
      'https://www.aljazeera.com/xml/rss/all.xml',
      'https://www.ft.com/rss/home',
    ],
  },

  // =====================================================
  // v3.0 Category 16: Reddit Geopolitics
  // =====================================================
  reddit_geopolitics: {
    weight: 0.7,
    feeds: [
      'https://www.reddit.com/r/geopolitics/top/.rss?t=day',
      'https://www.reddit.com/r/europe/top/.rss?t=day',
      'https://www.reddit.com/r/economics/top/.rss?t=day',
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

// --- Scoring (v3.0: 80 articles, expanded keywords) ---
export const SCORING = {
  topN: 80,
  minScore: 4,
  batchSize: 10,
  preFilterThreshold: 200,
  preFilterMax: 150,
  preFilterKeywords: [
    'AI', 'LLM', 'agent', 'Claude', 'GPT', 'Cursor', 'coding', 'prompt', 'autonomous',
    'no-code', 'nocode', 'founder', 'startup', 'tool', 'API', 'automation', 'EU', 'Europe',
    'open-source', 'GitHub', 'trending', 'launch', 'release', 'Anthropic', 'OpenAI', 'Google',
    // v3.0: geopolitics & economics keywords
    'geopolitics', 'economy', 'trade', 'tariff', 'sanctions', 'NATO', 'defense',
    'Brussels', 'Belgium', 'ECB', 'inflation', 'GDP', 'climate', 'energy',
    'China', 'Russia', 'Ukraine', 'Middle East', 'Africa', 'India', 'BRICS',
    'democracy', 'regulation', 'sovereignty', 'industrial policy',
  ],
  crossFeedBonusThreshold: 3,
  crossFeedBonus: 2,
};

// --- Life Context ---
export const LIFE_CONTEXT_FILE = 'data/life-context.md';

// --- Memory ---
export const MEMORY_FILE = 'data/memory.json';
export const BRIEFINGS_DIR = 'briefings';

// --- Limits (v3.0: expanded for 1M context) ---
export const LIMITS = {
  maxArticleLength: 8000,
  maxArticleAge: 48,
  analysisMaxTokens: 16384,
  synthesisMaxTokens: 32768,
};

// --- Prompts ---

// v3.0: Batch scoring prompt — one Sonnet call for ALL articles
export const SCORING_PROMPT = `You are the scoring engine for PRISM v3.0, a personal intelligence system.

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

Respond with a JSON array, one entry per article in the SAME ORDER as input:
[{"score": N, "reason": "one sentence", "tags": ["tag1"], "actionable": true/false}, ...]`;

// v3.0: THE BIG CALL — single massive prompt for research + synthesis
export const RESEARCH_PROMPT = `You are PRISM v3.0, a personal research intelligence system.

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

CRITICAL RULES:
- Every URL must come from source data or web search results
- Write for a builder, not a consumer
- Be direct. No fluff.
- Empty sections are fine
- PRIORITIZE HUMAN-ENDORSED CONTENT (cross-feed signal)
- WORLD LENS must be analytical, not clickbait — think Economist, not CNN
- Confidence > completeness`;
