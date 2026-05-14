// Cloudflare Worker — Anthropic API proxy
// Hides ANTHROPIC_API_KEY from browser. Browser → this worker → Anthropic API.
//
// Setup:
//   1. cd proxy
//   2. npx wrangler login
//   3. npx wrangler secret put ANTHROPIC_API_KEY    (paste your sk-ant-... key)
//   4. npx wrangler deploy
//   5. Copy the deployed URL (https://*.workers.dev) into ../config.js
//
// Security knobs (set as plain env vars in wrangler.toml [vars] or dashboard):
//   ALLOWED_ORIGINS  — comma-separated list (e.g. "https://heroq67.github.io,http://localhost:8080")
//                      Set "*" to allow any origin (NOT recommended — bots will abuse your key)
//   APP_TOKEN        — optional shared secret. If set, browser must send "x-app-token: <value>"
//                      Otherwise request is rejected. Use ../config.js to inject the token client-side.

const ANTHROPIC_BASE = 'https://api.anthropic.com';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';

    // ===== CORS preflight =====
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin, env) });
    }

    // ===== Origin check =====
    const allowed = (env.ALLOWED_ORIGINS || '*').split(',').map(s => s.trim());
    const originOk = allowed.includes('*') || allowed.includes(origin) || allowed.includes('null');
    if (!originOk) {
      return jsonErr(403, `Origin not allowed: ${origin}`, origin, env);
    }

    // ===== Optional shared-secret check =====
    if (env.APP_TOKEN) {
      const token = request.headers.get('x-app-token');
      if (token !== env.APP_TOKEN) {
        return jsonErr(401, 'Invalid app token', origin, env);
      }
    }

    // ===== Only allow POST to /v1/* =====
    if (request.method !== 'POST' || !url.pathname.startsWith('/v1/')) {
      return jsonErr(404, 'Not found', origin, env);
    }

    if (!env.ANTHROPIC_API_KEY) {
      return jsonErr(500, 'Server missing ANTHROPIC_API_KEY secret', origin, env);
    }

    // ===== Forward to Anthropic =====
    const fwdHeaders = new Headers();
    // Pass through Anthropic-specific headers
    const passThrough = ['content-type', 'anthropic-version', 'anthropic-beta'];
    passThrough.forEach(h => {
      const v = request.headers.get(h);
      if (v) fwdHeaders.set(h, v);
    });
    // Inject the key
    fwdHeaders.set('x-api-key', env.ANTHROPIC_API_KEY);
    // No need for browser-direct header since proxy is server-side

    let upstream;
    try {
      upstream = await fetch(ANTHROPIC_BASE + url.pathname + url.search, {
        method: 'POST',
        headers: fwdHeaders,
        body: request.body,
      });
    } catch (e) {
      return jsonErr(502, 'Upstream fetch failed: ' + e.message, origin, env);
    }

    // ===== Stream response back with CORS =====
    const respHeaders = new Headers();
    upstream.headers.forEach((v, k) => respHeaders.set(k, v));
    Object.entries(corsHeaders(origin, env)).forEach(([k, v]) => respHeaders.set(k, v));

    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: respHeaders,
    });
  },
};

function corsHeaders(origin, env) {
  const allowed = (env.ALLOWED_ORIGINS || '*').split(',').map(s => s.trim());
  let allowOrigin = '*';
  if (!allowed.includes('*')) {
    allowOrigin = (allowed.includes(origin) || allowed.includes('null')) ? (origin || '*') : 'null';
  }
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'content-type, anthropic-version, anthropic-beta, x-app-token',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}

function jsonErr(status, message, origin, env) {
  return new Response(JSON.stringify({ error: { type: 'proxy_error', message } }), {
    status,
    headers: Object.assign(
      { 'content-type': 'application/json' },
      corsHeaders(origin, env)
    ),
  });
}
