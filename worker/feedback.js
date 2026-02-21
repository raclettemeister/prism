// ============================================================
// PRISM Feedback Worker — Cloudflare Worker
//
// Receives feedback POST from the PRISM Portal HTML page,
// writes data/feedback-latest.json to the PRISM GitHub repo
// via GitHub API so the next nightly run picks it up.
//
// Deploy: wrangler deploy (from the worker/ directory)
//
// Required Cloudflare Worker secrets (set via wrangler secret put):
//   PRISM_GITHUB_TOKEN    — GitHub PAT with repo write scope
//   PRISM_GITHUB_REPO     — e.g. "raclettemeister/prism"
//   PRISM_FEEDBACK_SECRET — shared secret to authenticate requests
//
// Optional:
//   ALLOWED_ORIGIN        — CORS origin (default: PRISM_PORTAL_URL or *)
// ============================================================

const FEEDBACK_PATH = 'data/feedback-latest.json';
const COMMIT_MESSAGE_PREFIX = 'PRISM feedback';

export default {
  async fetch(request, env) {
    // CORS preflight
    if (request.method === 'OPTIONS') {
      return corsResponse('', 200, env);
    }

    // Health check
    if (request.method === 'GET') {
      return corsResponse(JSON.stringify({ status: 'PRISM Feedback Worker active' }), 200, env);
    }

    // Only accept POST
    if (request.method !== 'POST') {
      return corsResponse(JSON.stringify({ error: 'Method not allowed' }), 405, env);
    }

    // Validate secret header (optional but recommended)
    if (env.PRISM_FEEDBACK_SECRET) {
      const providedSecret = request.headers.get('X-PRISM-Secret') || '';
      if (providedSecret !== env.PRISM_FEEDBACK_SECRET) {
        return corsResponse(JSON.stringify({ error: 'Unauthorized' }), 401, env);
      }
    }

    // Parse feedback payload
    let payload;
    try {
      payload = await request.json();
    } catch {
      return corsResponse(JSON.stringify({ error: 'Invalid JSON' }), 400, env);
    }

    // Validate required fields
    if (!payload.date) {
      return corsResponse(JSON.stringify({ error: 'Missing date field' }), 400, env);
    }

    // Write to GitHub
    const result = await writeToGitHub(payload, env);
    if (result.ok) {
      return corsResponse(JSON.stringify({ success: true, message: 'Feedback saved. See you tomorrow morning.' }), 200, env);
    } else {
      return corsResponse(JSON.stringify({ error: result.error }), 500, env);
    }
  },
};

// ── GitHub API Write ─────────────────────────────────────────

/**
 * Write feedback JSON to the PRISM repo via GitHub Contents API.
 * Handles SHA management (required for updating existing files).
 */
async function writeToGitHub(payload, env) {
  const token = env.PRISM_GITHUB_TOKEN;
  const repo = env.PRISM_GITHUB_REPO;

  if (!token || !repo) {
    return { ok: false, error: 'Worker not configured: missing PRISM_GITHUB_TOKEN or PRISM_GITHUB_REPO' };
  }

  const apiBase = `https://api.github.com/repos/${repo}/contents/${FEEDBACK_PATH}`;
  const headers = {
    'Authorization': `token ${token}`,
    'Accept': 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
    'User-Agent': 'PRISM-Feedback-Worker',
  };

  // Step 1: Get current file SHA (needed to update an existing file)
  let currentSha = null;
  try {
    const getRes = await fetch(apiBase, { headers });
    if (getRes.ok) {
      const fileData = await getRes.json();
      currentSha = fileData.sha;
    }
    // 404 = file doesn't exist yet, that's fine — we'll create it
  } catch (err) {
    // Network error reading SHA — attempt write anyway (will fail if file exists)
    console.error('SHA fetch error:', err.message);
  }

  // Step 2: Write the file
  const content = btoa(JSON.stringify(payload, null, 2));
  const commitMessage = `${COMMIT_MESSAGE_PREFIX} ${payload.date} (from portal)`;

  const body = {
    message: commitMessage,
    content,
    ...(currentSha ? { sha: currentSha } : {}),
  };

  try {
    const putRes = await fetch(apiBase, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
    });

    if (putRes.ok) {
      return { ok: true };
    } else {
      const errData = await putRes.json().catch(() => ({}));
      return { ok: false, error: `GitHub API error ${putRes.status}: ${errData.message || 'unknown'}` };
    }
  } catch (err) {
    return { ok: false, error: `Network error: ${err.message}` };
  }
}

// ── CORS Helper ──────────────────────────────────────────────

function corsResponse(body, status, env) {
  const allowedOrigin = env.ALLOWED_ORIGIN || env.PRISM_PORTAL_URL || '*';
  return new Response(body, {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-PRISM-Secret',
    },
  });
}
