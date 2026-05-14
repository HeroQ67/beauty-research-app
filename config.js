// config.js — Public deployment config (commits to git).
//
// SHARED-PROXY MODE: set proxyUrl to your deployed Cloudflare Worker.
//   - All users of the link use YOUR API key (proxied through the worker).
//   - The API key never reaches the browser.
//   - Users don't need to bring their own key.
//
// BYO-KEY MODE (default): set proxyUrl to null.
//   - Each user enters their own Anthropic API key in the ⚙️ API modal.
//   - Key stored in their browser's localStorage.
//
// Optional: appToken — shared secret sent as `x-app-token` header. The worker rejects
// requests without it (if APP_TOKEN secret is set). Adds a layer against bot abuse.

window.BR_CONFIG = {
  proxyUrl: null,    // e.g. 'https://beauty-research-proxy.YOUR-SUBDOMAIN.workers.dev'
  appToken: null,    // e.g. 'my-shared-secret-string'
};
