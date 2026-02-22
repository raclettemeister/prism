// ============================================================
// PRISM v4.0 Page Generator
// NEW module. Generates briefings/YYYY-MM-DD.html alongside the .md file.
//
// The HTML page:
//   - Full briefing rendered from markdown (using marked)
//   - Per-article reaction buttons (❤️ Love / ✓ OK / ✗ Skip)
//   - Per-section rating toggle buttons
//   - Freeform notes textarea + overall rating
//   - Submit button → POSTs JSON to FEEDBACK_WORKER_URL (Cloudflare Worker)
//   - Self-contained: no external CDN, works offline for reactions
//
// The page is committed to git and served via Cloudflare Pages at:
//   https://prism.julien.care/briefings/YYYY-MM-DD.html
// ============================================================

import { writeFile, mkdir } from 'fs/promises';
import { marked } from 'marked';
import { BRIEFINGS_DIR } from './config.js';

// ── Article Extraction ───────────────────────────────────────

/**
 * Extract article titles and sources from the MUST-READ LIST section.
 * Used to populate per-article feedback widgets.
 */
function extractMustReads(markdown) {
  const sectionMatch = markdown.match(/## 📚 MUST-READ LIST([\s\S]*?)(?=\n## |$)/);
  if (!sectionMatch) return [];

  const sectionText = sectionMatch[1];
  const articles = [];

  // Match: **[Title]** by Author — Source (link)
  const regex = /\*\*\[([^\]]+)\]\*\*(?:[^\n]*)—\s*([^\n(]+)/g;
  let match;
  while ((match = regex.exec(sectionText)) !== null) {
    articles.push({
      title: match[1].trim(),
      source: match[2].trim().replace(/\(.*$/, '').trim(),
    });
  }

  return articles.slice(0, 8);
}

// ── HTML Builder ─────────────────────────────────────────────

function buildPage(markdown, date, articleCount, articles, workerUrl, feedbackSecret) {
  // Render markdown to HTML
  let contentHtml = marked.parse(markdown);

  // Inject article feedback widgets after each must-read item
  articles.forEach((article, i) => {
    const titleEscaped = article.title
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;');
    const articleWidget = `
<div class="article-feedback" data-article="${i}" data-title="${titleEscaped}" data-source="${article.source}">
  <div class="reaction-buttons">
    <button class="reaction-btn" data-value="love" onclick="setArticleReaction(${i}, 'love', this)">❤️ Love</button>
    <button class="reaction-btn" data-value="ok" onclick="setArticleReaction(${i}, 'ok', this)">✓ OK</button>
    <button class="reaction-btn" data-value="skip" onclick="setArticleReaction(${i}, 'skip', this)">✗ Skip</button>
  </div>
</div>`;
    // Insert after the article's "Conversation value:" line (last line of each must-read entry)
    const safeTitle = article.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const itemRegex = new RegExp(`(<strong>\\[${safeTitle}\\]</strong>[\\s\\S]*?(?=<li>|</ul>|<h2>))`, 'i');
    contentHtml = contentHtml.replace(itemRegex, (m) => m + articleWidget);
  });

  // Inject section feedback widgets after each major section header
  const sections = [
    { id: 'SIGNAL', emoji: '🔴', label: 'THE SIGNAL' },
    { id: 'BUILDER_INTELLIGENCE', emoji: '🧱', label: 'BUILDER INTELLIGENCE' },
    { id: 'PIONEER_ADVANTAGE', emoji: '📊', label: 'PIONEER ADVANTAGE CHECK' },
    { id: 'TOOLS_TO_TRY', emoji: '🛠️', label: 'TOOLS TO TRY' },
    { id: 'BUILD_WATCH', emoji: '🏗️', label: 'BUILD WATCH' },
    { id: 'WORLD_LENS', emoji: '🌍', label: 'WORLD LENS' },
    { id: 'EUROPE_TECH', emoji: '🇪🇺', label: 'EUROPE TECH' },
    { id: 'TREND_TRACKER', emoji: '📈', label: 'TREND TRACKER' },
  ];

  sections.forEach(s => {
    const widget = `
<div class="section-feedback" data-section="${s.id}">
  <button class="section-btn" data-value="love" onclick="setSectionRating('${s.id}', 'love', this)">❤️</button>
  <button class="section-btn" data-value="ok" onclick="setSectionRating('${s.id}', 'ok', this)">👍</button>
  <button class="section-btn" data-value="skip" onclick="setSectionRating('${s.id}', 'skip', this)">👎</button>
</div>`;
    // Insert after the section header <h2>
    const safeLabel = s.label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    contentHtml = contentHtml.replace(
      new RegExp(`(<h2>[^<]*${s.emoji}[^<]*${safeLabel.replace(/ /g, '[^<]*')}[^<]*</h2>)`, 'i'),
      (m) => m + widget
    );
  });

  const articlesJson = JSON.stringify(articles);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PRISM — ${date}</title>
  <style>
    :root {
      --bg: #0f0f0f;
      --bg-card: #1a1a1a;
      --bg-hover: #222;
      --text: #e5e5e5;
      --text-muted: #888;
      --accent: #e8743b;
      --accent-hover: #ff8c4a;
      --border: #2a2a2a;
      --success: #4caf50;
      --love: #e74c3c;
      --ok: #3498db;
      --skip: #666;
      --font: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: var(--bg);
      color: var(--text);
      font-family: var(--font);
      font-size: 16px;
      line-height: 1.7;
      padding: 0;
    }
    .container {
      max-width: 760px;
      margin: 0 auto;
      padding: 40px 24px 100px;
    }
    /* Typography */
    h1 { font-size: 1.6rem; font-weight: 700; color: var(--text); margin-bottom: 8px; line-height: 1.3; }
    h2 { font-size: 1.15rem; font-weight: 600; color: var(--text); margin: 36px 0 16px; padding-bottom: 8px; border-bottom: 1px solid var(--border); }
    h3 { font-size: 1rem; font-weight: 600; margin: 20px 0 8px; }
    p { margin-bottom: 14px; }
    a { color: var(--accent); text-decoration: none; }
    a:hover { color: var(--accent-hover); text-decoration: underline; }
    ul, ol { margin: 0 0 14px 24px; }
    li { margin-bottom: 8px; }
    strong { font-weight: 600; color: #f0f0f0; }
    em { color: var(--text-muted); }
    code { background: var(--bg-card); padding: 2px 6px; border-radius: 4px; font-size: 0.9em; font-family: 'SF Mono', 'Fira Code', monospace; }
    pre { background: var(--bg-card); padding: 16px; border-radius: 8px; overflow-x: auto; margin: 0 0 14px; }
    blockquote { border-left: 3px solid var(--accent); padding-left: 16px; color: var(--text-muted); margin: 0 0 14px; }
    hr { border: none; border-top: 1px solid var(--border); margin: 32px 0; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 0.9em; }
    th { background: var(--bg-card); padding: 8px 12px; text-align: left; border-bottom: 1px solid var(--border); font-weight: 600; }
    td { padding: 8px 12px; border-bottom: 1px solid var(--border); }
    tr:hover td { background: var(--bg-hover); }
    /* PRISM header */
    .prism-header {
      background: linear-gradient(135deg, #1a1a1a, #0f0f0f);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 32px;
    }
    .prism-header .meta { color: var(--text-muted); font-size: 0.85rem; margin-top: 6px; }
    .prism-header .meta span { margin-right: 16px; }
    /* Article feedback widgets */
    .article-feedback {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 10px 14px;
      margin: 8px 0 20px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .article-feedback::before { content: 'React: '; color: var(--text-muted); font-size: 0.85rem; }
    .reaction-buttons { display: flex; gap: 6px; }
    .reaction-btn {
      background: var(--bg);
      border: 1px solid var(--border);
      color: var(--text-muted);
      padding: 4px 12px;
      border-radius: 20px;
      cursor: pointer;
      font-size: 0.85rem;
      transition: all 0.15s ease;
    }
    .reaction-btn:hover { background: var(--bg-hover); color: var(--text); }
    .reaction-btn.active-love { background: rgba(231,76,60,0.15); border-color: var(--love); color: var(--love); }
    .reaction-btn.active-ok { background: rgba(52,152,219,0.15); border-color: var(--ok); color: var(--ok); }
    .reaction-btn.active-skip { background: rgba(102,102,102,0.15); border-color: #666; color: #888; }
    /* Section feedback widgets */
    .section-feedback {
      display: inline-flex;
      gap: 4px;
      margin-left: 10px;
      vertical-align: middle;
    }
    .section-btn {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 2px 8px;
      cursor: pointer;
      font-size: 0.8rem;
      opacity: 0.5;
      transition: all 0.15s ease;
    }
    .section-btn:hover { opacity: 1; }
    .section-btn.active { opacity: 1; background: var(--bg-hover); border-color: var(--accent); }
    /* Feedback panel */
    .feedback-panel {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 28px;
      margin-top: 48px;
    }
    .feedback-panel h2 { border: none; margin-top: 0; font-size: 1.2rem; }
    .feedback-panel .subtitle { color: var(--text-muted); font-size: 0.9rem; margin-bottom: 24px; }
    .overall-rating { margin-bottom: 24px; }
    .overall-rating label { display: block; font-size: 0.9rem; color: var(--text-muted); margin-bottom: 10px; }
    .star-buttons { display: flex; gap: 8px; }
    .star-btn {
      background: var(--bg);
      border: 1px solid var(--border);
      color: var(--text-muted);
      width: 44px; height: 44px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 1.1rem;
      font-weight: 700;
      transition: all 0.15s ease;
    }
    .star-btn:hover { background: var(--bg-hover); color: var(--text); }
    .star-btn.active { background: rgba(232,116,59,0.15); border-color: var(--accent); color: var(--accent); }
    .notes-area { margin-bottom: 24px; }
    .notes-area label { display: block; font-size: 0.9rem; color: var(--text-muted); margin-bottom: 8px; }
    textarea {
      width: 100%;
      background: var(--bg);
      border: 1px solid var(--border);
      color: var(--text);
      border-radius: 8px;
      padding: 12px 14px;
      font-family: var(--font);
      font-size: 0.95rem;
      resize: vertical;
      min-height: 90px;
    }
    textarea:focus { outline: none; border-color: var(--accent); }
    .submit-area { display: flex; gap: 12px; align-items: center; }
    #submit-btn {
      background: var(--accent);
      color: white;
      border: none;
      padding: 12px 28px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 1rem;
      font-weight: 600;
      transition: all 0.15s ease;
    }
    #submit-btn:hover { background: var(--accent-hover); }
    #submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    #submit-status { font-size: 0.9rem; }
    .status-success { color: var(--success); }
    .status-error { color: #e74c3c; }
    .status-info { color: var(--text-muted); }
    /* Sticky submit bar */
    .sticky-bar {
      position: fixed;
      bottom: 0; left: 0; right: 0;
      background: rgba(15,15,15,0.95);
      border-top: 1px solid var(--border);
      backdrop-filter: blur(10px);
      padding: 12px 24px;
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 16px;
      font-size: 0.9rem;
      z-index: 100;
      transform: translateY(100%);
      transition: transform 0.3s ease;
    }
    .sticky-bar.visible { transform: translateY(0); }
    .sticky-bar button {
      background: var(--accent);
      color: white;
      border: none;
      padding: 8px 20px;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
      font-size: 0.9rem;
    }
    /* Footer */
    .prism-footer { color: var(--text-muted); font-size: 0.8rem; text-align: center; margin-top: 40px; padding-top: 24px; border-top: 1px solid var(--border); }
  </style>
</head>
<body>
<div class="container">

  <div class="prism-header">
    <h1>PRISM Morning Briefing</h1>
    <div class="meta">
      <span>📅 ${date}</span>
      <span>📰 ${articleCount} articles analyzed</span>
      <span>🤖 PRISM v4.0</span>
    </div>
  </div>

  <div id="briefing-content">
    ${contentHtml}
  </div>

  <div class="feedback-panel" id="feedback-panel">
    <h2>📬 React to today's briefing</h2>
    <p class="subtitle">Your reactions train PRISM to improve every night.</p>

    <div class="overall-rating">
      <label>Overall rating:</label>
      <div class="star-buttons">
        ${[1,2,3,4,5].map(n => `<button class="star-btn" onclick="setOverallRating(${n}, this)">${n}</button>`).join('')}
      </div>
    </div>

    <div class="notes-area">
      <label>Notes for PRISM (optional):</label>
      <textarea id="feedback-notes" placeholder="Too much geopolitics? Loved that Builder Intelligence section? Want more micro-SaaS radar? Write anything here."></textarea>
    </div>

    <div class="submit-area">
      <button id="submit-btn" onclick="submitFeedback()">Submit Feedback →</button>
      <span id="submit-status" class="status-info"></span>
    </div>
  </div>

  <div class="prism-footer">
    PRISM v4.0 — Personal Research Intelligence System
  </div>

</div>

<!-- Sticky submit bar (appears after first interaction) -->
<div class="sticky-bar" id="sticky-bar">
  <span id="sticky-count">0 reactions recorded</span>
  <button onclick="submitFeedback()">Submit Feedback →</button>
</div>

<script>
  // ── State ────────────────────────────────────────────────
  const ARTICLES = ${articlesJson};
  const WORKER_URL = ${JSON.stringify(workerUrl || '')};
  const FEEDBACK_SECRET = ${JSON.stringify(feedbackSecret || '')};
  const DATE = ${JSON.stringify(date)};

  const state = {
    overallRating: null,
    articleReactions: {},    // index → 'love' | 'ok' | 'skip'
    sectionRatings: {},      // sectionId → 'love' | 'ok' | 'skip'
    notes: '',
    totalInteractions: 0,
  };

  // ── Reaction Setters ─────────────────────────────────────
  function setArticleReaction(index, value, btn) {
    const prev = state.articleReactions[index];
    if (prev === value) {
      // Toggle off
      delete state.articleReactions[index];
      btn.parentElement.querySelectorAll('.reaction-btn').forEach(b => b.classList.remove('active-love', 'active-ok', 'active-skip'));
    } else {
      state.articleReactions[index] = value;
      btn.parentElement.querySelectorAll('.reaction-btn').forEach(b => {
        b.classList.remove('active-love', 'active-ok', 'active-skip');
      });
      btn.classList.add('active-' + value);
    }
    updateInteractionCount();
  }

  function setSectionRating(sectionId, value, btn) {
    const prev = state.sectionRatings[sectionId];
    if (prev === value) {
      delete state.sectionRatings[sectionId];
      btn.parentElement.querySelectorAll('.section-btn').forEach(b => b.classList.remove('active'));
    } else {
      state.sectionRatings[sectionId] = value;
      btn.parentElement.querySelectorAll('.section-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    }
    updateInteractionCount();
  }

  function setOverallRating(value, btn) {
    state.overallRating = state.overallRating === value ? null : value;
    document.querySelectorAll('.star-btn').forEach(b => b.classList.remove('active'));
    if (state.overallRating) btn.classList.add('active');
    updateInteractionCount();
  }

  function updateInteractionCount() {
    const count = Object.keys(state.articleReactions).length +
                  Object.keys(state.sectionRatings).length +
                  (state.overallRating ? 1 : 0);
    state.totalInteractions = count;
    document.getElementById('sticky-count').textContent = count + ' reaction' + (count !== 1 ? 's' : '') + ' recorded';
    const bar = document.getElementById('sticky-bar');
    if (count > 0) {
      bar.classList.add('visible');
    }
  }

  // ── Submit ───────────────────────────────────────────────
  async function submitFeedback() {
    const notes = document.getElementById('feedback-notes').value.trim();
    state.notes = notes;

    const payload = {
      date: DATE,
      briefingRating: state.overallRating,
      mustReads: ARTICLES.map((article, i) => ({
        title: article.title,
        source: article.source,
        rating: state.articleReactions[i] || null,
      })).filter(a => a.rating !== null),
      sections: state.sectionRatings,
      openNotes: notes,
      submittedAt: new Date().toISOString(),
    };

    const btn = document.getElementById('submit-btn');
    const status = document.getElementById('submit-status');

    btn.disabled = true;
    status.className = 'status-info';
    status.textContent = 'Sending...';

    if (!WORKER_URL) {
      // No worker configured — download the JSON for manual submission
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'prism-feedback-' + DATE + '.json';
      a.click();
      status.className = 'status-info';
      status.textContent = '📥 Downloaded feedback JSON (no worker configured — place in data/feedback-latest.json)';
      btn.disabled = false;
      return;
    }

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (FEEDBACK_SECRET) headers['X-PRISM-Secret'] = FEEDBACK_SECRET;
      const res = await fetch(WORKER_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        status.className = 'status-success';
        status.textContent = '✅ Feedback sent! PRISM will adjust tomorrow night.';
        document.getElementById('sticky-bar').innerHTML = '<span style="color:#4caf50">✅ Feedback received — see you tomorrow morning</span>';
      } else {
        const text = await res.text();
        throw new Error(text || 'Worker returned ' + res.status);
      }
    } catch (err) {
      status.className = 'status-error';
      status.textContent = '❌ Failed: ' + err.message + ' — try downloading instead.';
      btn.disabled = false;
    }
  }

  // ── Init ─────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    // Track notes textarea changes
    document.getElementById('feedback-notes').addEventListener('input', () => {
      updateInteractionCount();
    });
  });
</script>
</body>
</html>`;
}

// ── Main Export ──────────────────────────────────────────────

/**
 * Generate the HTML briefing page with embedded feedback UI.
 * Saves to briefings/YYYY-MM-DD.html alongside the .md file.
 *
 * @param {string} markdown - The full briefing markdown text
 * @param {string} date - YYYY-MM-DD date string
 * @param {number} articleCount - Number of articles analyzed
 * @returns {Promise<string>} Path to the generated HTML file
 */
export default async function generatePage(markdown, date, articleCount = 0) {
  const workerUrl = process.env.FEEDBACK_WORKER_URL || '';
  const feedbackSecret = process.env.PRISM_FEEDBACK_SECRET || '';
  const articles = extractMustReads(markdown);

  const html = buildPage(markdown, date, articleCount, articles, workerUrl, feedbackSecret);

  await mkdir(BRIEFINGS_DIR, { recursive: true });
  const filepath = `${BRIEFINGS_DIR}/${date}.html`;
  await writeFile(filepath, html, 'utf-8');

  console.log(`\n📄 PAGE — ${filepath} (${articles.length} article widgets, ${workerUrl ? 'worker configured' : 'no worker — download fallback'})`);
  return filepath;
}
