# Deploy Guide

## Status

✅ **App live at:** https://heroq67.github.io/beauty-research-app/
⏳ **Proxy:** not yet deployed — currently in BYO-key mode (users enter their own Anthropic API key)

To enable **shared-key mode** (you pay for everyone, no key needed by users), deploy the Cloudflare Worker proxy below.

---

## Cloudflare Worker — One-time setup (~10 min)

### 1. Get a Cloudflare account
- Free: https://dash.cloudflare.com/sign-up
- No credit card needed for Workers free tier (100,000 requests/day)

### 2. Install Wrangler CLI + login
```powershell
cd C:\Users\nthee\beauty-research-app\proxy
npm install
npx wrangler login
```
Browser opens → authorize Wrangler → close tab.

### 3. Set the Anthropic API key as a SECRET (not a regular env var)
```powershell
npx wrangler secret put ANTHROPIC_API_KEY
```
Paste your `sk-ant-...` key when prompted, press Enter. Secrets are encrypted and never exposed in code.

### 4. (Optional) Add a shared-secret token for extra abuse protection
```powershell
npx wrangler secret put APP_TOKEN
```
Type any random string (e.g. `xK9mP2qR7vL3nT8w`). The browser will send this in a header — bots scraping the worker URL won't have it.

### 5. Deploy
```powershell
npx wrangler deploy
```

Output will show:
```
Uploaded beauty-research-proxy (2.3 sec)
Published beauty-research-proxy
  https://beauty-research-proxy.YOUR-SUBDOMAIN.workers.dev
```
**Copy that URL.**

### 6. Configure the app to use the proxy
Edit `config.js` (in the app root, NOT in `proxy/`):
```js
window.BR_CONFIG = {
  proxyUrl: 'https://beauty-research-proxy.YOUR-SUBDOMAIN.workers.dev',
  appToken: 'xK9mP2qR7vL3nT8w', // only if you set APP_TOKEN in step 4, else null
};
```

### 7. Push to GitHub (auto-deploys to Pages in ~1 minute)
```powershell
cd C:\Users\nthee\beauty-research-app
git add config.js
git commit -m "Enable proxy mode"
git push
```

### 8. Test
Open https://heroq67.github.io/beauty-research-app/ in incognito → you should see **🔒 Shared** badge in header → API modal shows "Shared Proxy Mode" instead of key field → Research should work without entering any key.

---

## Cost guard (IMPORTANT)

Set a monthly spending limit in Anthropic Console so a runaway bug or abuse can't blow your budget:

1. https://console.anthropic.com/settings/limits
2. Set **Monthly limit** to whatever you're comfortable losing (e.g. $20-50 to start)
3. Set **email alerts** at 50% / 80% / 100%

Cloudflare Worker free tier limits abuse to 100k requests/day per IP automatically.

---

## Updates

After the initial setup, deploying changes is one command:
```powershell
# App changes (HTML/CSS/JS)
git add . && git commit -m "your message" && git push
# (Pages auto-deploys in ~1 min)

# Worker changes (proxy/worker.js)
cd proxy && npx wrangler deploy
```

---

## Lock down later (recommended after testing)

In `proxy/wrangler.toml`, the `ALLOWED_ORIGINS` env var defaults to:
```
https://heroq67.github.io,http://localhost:8080,http://127.0.0.1:8080,null
```

If you only want the GitHub Pages site to use the proxy (block all other origins), remove the localhost + null entries:
```toml
ALLOWED_ORIGINS = "https://heroq67.github.io"
```
Then `npx wrangler deploy`.

---

## Troubleshooting

**"CORS error" in browser console**
→ Your Pages URL isn't in `ALLOWED_ORIGINS`. Check `proxy/wrangler.toml`, redeploy worker.

**"401 Invalid app token"**
→ `APP_TOKEN` secret set on worker but `appToken` in `config.js` doesn't match. Make them identical or remove both.

**"500 Server missing ANTHROPIC_API_KEY secret"**
→ You forgot step 3. Re-run `npx wrangler secret put ANTHROPIC_API_KEY` from `proxy/`.

**"View source on Pages site shows my appToken"**
→ Yes, `appToken` is visible to anyone who looks. It's only a soft barrier against bots scanning random Workers URLs — not a real auth mechanism. The real protection is the API key being on the Worker server-side.

**Want to revoke access?**
→ `cd proxy && npx wrangler delete` deletes the worker entirely. Or change `APP_TOKEN` secret to invalidate the old one.
