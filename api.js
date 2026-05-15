// api.js — Claude API client
// Direct browser → api.anthropic.com calls. Web search tool (server-side) is enabled per-call.
// Output forced to JSON via prompt so we get structured statistics + opinion + suggestions.

window.BR_API = (function () {
  const ANTHROPIC_DIRECT = 'https://api.anthropic.com/v1/messages';
  const API_VERSION = '2023-06-01';

  function usingProxy() {
    return !!(window.BR_CONFIG && window.BR_CONFIG.proxyUrl);
  }

  function getEndpoint() {
    if (usingProxy()) {
      return window.BR_CONFIG.proxyUrl.replace(/\/$/, '') + '/v1/messages';
    }
    return ANTHROPIC_DIRECT;
  }

  function getHeaders() {
    const betas = BR_STORE.getApiBetas();
    const betaList = [];
    if (betas.context1m) betaList.push('context-1m-2025-08-07');
    if (betas.promptCaching) betaList.push('prompt-caching-2024-07-31');

    const headers = {
      'content-type': 'application/json',
      'anthropic-version': API_VERSION,
    };
    if (betaList.length) headers['anthropic-beta'] = betaList.join(',');

    if (usingProxy()) {
      // Key lives in the Worker. Optional shared secret to gate the proxy.
      if (window.BR_CONFIG.appToken) {
        headers['x-app-token'] = window.BR_CONFIG.appToken;
      }
    } else {
      // BYO-key mode: read from localStorage.
      const apiKey = BR_STORE.getApiKey();
      if (!apiKey) throw new Error('ยังไม่ได้ตั้ง API key — กด ⚙️ API ที่มุมขวาบน');
      headers['x-api-key'] = apiKey;
      headers['anthropic-dangerous-direct-browser-access'] = 'true';
    }
    return headers;
  }

  // ============== System prompt builders ==============

  function singleSystemPrompt(persona, useSearch) {
    const matrixStr = BR_MATRIX.serializePersona(persona);
    const trends = BR_TRENDS.asPromptText();

    return `You are a market-research simulation engine for the Thai beauty industry, capable of TWO distinct voices in one response:

VOICE A — THE PERSONA (subjective, in-character)
VOICE B — THE EXPERT (objective, strategic analyst with 20+ years in Thai/APAC beauty)

═══════════════ PERSONA PROFILE ═══════════════
${matrixStr}
═══════════════════════════════════════════════

═══════════════ CURRENT BEAUTY TRENDS (active context) ═══════════════
${trends}
═══════════════════════════════════════════════════════════════════════

YOUR TASK
1. (Voice A) Answer the research question AS this persona — first-person, Thai, in their voice.
2. Triangulate against real similar consumers. Provide statistical estimates calibrated to real Thai beauty market data (TikTok ~80% share, KOL fatigue patterns, premium trade-down in current economy, etc.) — not fabricated.
${useSearch ? '3. Use web search for real products/brands/prices/campaigns. Cite.' : '3. Use only training knowledge — no fabricated live prices.'}
4. (Voice B) Switch perspective and write an EXPERT ANALYSIS section — as a senior beauty marketing strategist with deep Thai/APAC market knowledge AND consumer psychology training. This voice is analytical, references market structure, and gives strategic counsel a brand owner can act on.

OUTPUT FORMAT — strict JSON only, no markdown, no commentary outside JSON:
{
  "persona_voice": "First-person Thai answer (200-400 chars) — persona speaking",
  "statistics": [
    {"label": "Probability of purchase", "value": 0-100, "unit": "%", "confidence": "low|medium|high", "note": "brief reasoning"},
    {"label": "Willingness to pay", "value": "1500-2500", "unit": "THB", "confidence": "...", "note": "..."},
    {"label": "Preferred channel", "value": "TikTok Shop", "unit": "", "confidence": "...", "note": "..."}
  ],
  "key_drivers": ["driver 1", "driver 2", "driver 3"],
  "key_barriers": ["barrier 1", "barrier 2"],
  "opinion": "2-4 sentences in Thai — what does this persona's answer reveal about the broader cluster?",
  "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"],
  "comparable_segment": "1 sentence: which Thai beauty consumer cluster does this represent + rough % of addressable market",

  "expert_analysis": {
    "market_context": "Thai paragraph (3-5 sentences). Market size context for the product category in this question (THB billions, growth %), key share dynamics (mass vs premium, channel split, dominant players in this segment), and where this persona sits in that landscape. Reference real data points you know.",
    "strategic_feasibility": "Thai paragraph (3-5 sentences). Strategic viability of what the question implies (the launch, price, channel, campaign). What conditions make it succeed vs fail. Compare to historical analogous moves by other Thai/Korean/Japanese brands when relevant.",
    "consumer_psychology_lens": "Thai paragraph (2-4 sentences). Deeper psychology beyond what the persona articulates — identity signalling, in-group dynamics, status anxiety, ritual habit formation. Why this persona behaves how they do at a psychological level.",
    "expert_verdict": "Thai 2-3 sentences. The expert's bottom-line recommendation — direct, actionable, opinionated. State the call (go / go-with-conditions / don't).",
    "caveats_risks": ["risk 1 (short Thai)", "risk 2", "risk 3 (3-5 items max)"]
  }
}

CRITICAL RULES
- Output ONLY the JSON object, no \`\`\`json fences, no preamble.
- Voice A (persona_voice, opinion) = first-person, casual, in-character.
- Voice B (expert_analysis) = third-person, analytical, strategic, references market data + psychology theory.
- Statistics must be defensible — grounded in real Thai beauty market knowledge.
- Market context numbers (size/share/growth) should be reasonably accurate; flag uncertainty if you're not sure.
- Don't fabricate specific brand campaigns you can't verify.`;
  }

  function surveySystemPrompt(personas, useSearch) {
    const personaList = personas.map((p, i) => `### Persona ${i + 1}: ${p.name}\n${BR_MATRIX.serializePersona(p)}`).join('\n\n');
    const trends = BR_TRENDS.asPromptText();

    return `You are a panel-based market research simulation engine for the Thai beauty industry, capable of TWO voices:

VOICE A — PANEL SIMULATOR (predicts each persona's reaction)
VOICE B — EXPERT STRATEGIST (senior beauty marketing analyst with 20+ years in Thai/APAC, blending market intelligence + consumer psychology)

═══════════════ PANEL: ${personas.length} PERSONAS ═══════════════
${personaList}

═══════════════ CURRENT BEAUTY TRENDS ═══════════════
${trends}
═════════════════════════════════════════════════════

YOUR TASK
1. (Voice A) For each persona, predict reaction. Classify position + one-sentence reason.
2. Aggregate into distribution. Surface segment patterns, themes, quotes, drivers, barriers.
3. (Voice B) Write a separate EXPERT ANALYSIS section — strategic counsel grounded in real Thai market data + consumer psychology, addressed to the brand owner.
${useSearch ? '4. Use web search for real data points (campaign benchmarks, channel share). Cite.' : '4. Use training knowledge only.'}

OUTPUT FORMAT — strict JSON only, no markdown:
{
  "summary": "2-3 sentence Thai executive summary",
  "overall_distribution": [
    {"option": "ซื้อทันที", "percent": 25, "count": 4},
    {"option": "รอรีวิว", "percent": 40, "count": 6}
  ],
  "average_statistics": [
    {"label": "Avg. willingness to pay", "value": "1200", "unit": "THB", "note": "..."}
  ],
  "per_persona": [
    {"name": "Ice", "position": "รอรีวิว", "reason_th": "ระวังเรื่อง budget", "estimated_purchase_pct": 30}
  ],
  "segment_insights": [
    {"segment": "Gen Z (18-25)", "n": 4, "position": "ซื้อทันที 60%", "insight": "ตอบสนอง flash sale"}
  ],
  "top_themes": ["theme 1", "theme 2", "theme 3"],
  "top_quotes": [
    {"persona": "Ice", "quote_th": "ราคานี้แอบสูง..."}
  ],
  "key_drivers": ["driver 1", "driver 2"],
  "key_barriers": ["barrier 1", "barrier 2"],
  "predicted_satisfaction_score": 6.8,
  "satisfaction_note": "out of 10, brief reasoning",
  "risks": ["risk 1", "risk 2"],
  "opportunities": ["opportunity 1", "opportunity 2"],
  "recommendations": ["actionable rec 1", "actionable rec 2", "actionable rec 3"],

  "expert_analysis": {
    "market_context": "Thai 3-5 sentences. Market size for this category (THB billions, growth %), competitive structure (mass vs premium, channel split, top players), how this panel maps onto the addressable market.",
    "strategic_feasibility": "Thai 3-5 sentences. Strategic viability of the implied move (launch/price/channel/campaign). Conditions for success vs failure. Comparable plays by Thai/K-beauty/J-beauty brands.",
    "consumer_psychology_lens": "Thai 2-4 sentences. Deeper psychological dynamics across the panel — identity signalling, in-group/out-group, status anxiety, ritual habit formation. Why the distribution looks like it does at psychological level.",
    "expert_verdict": "Thai 2-3 sentences. The expert's bottom-line — go / go-with-conditions / don't, with the single most important reason.",
    "caveats_risks": ["risk 1 short Thai", "risk 2", "risk 3 (3-5 max)"]
  }
}

CRITICAL RULES
- Output ONLY the JSON object.
- Distribution must sum to 100%. Counts must match panel size.
- Voice A = predictive simulator. Voice B (expert_analysis) = strategic analyst, third-person, references real market data + psychology theory.
- Market numbers (size/share/growth) should be reasonably accurate; flag uncertainty.
- Be honest about uncertainty in distribution — wide spread > false narrow confidence.`;
  }

  // ============== Core call ==============

  async function callClaude({ model, system, userMessage, useSearch, useThinking, maxTokens }) {
    const tools = [];
    if (useSearch) {
      tools.push({ type: 'web_search_20250305', name: 'web_search', max_uses: 5 });
    }

    const body = {
      model,
      max_tokens: maxTokens || (useThinking ? 16000 : 4096),
      system,
      messages: [{ role: 'user', content: userMessage }],
    };
    if (tools.length) body.tools = tools;
    if (useThinking) {
      body.thinking = { type: 'enabled', budget_tokens: 10000 };
      body.temperature = 1; // required by extended thinking
    } else {
      body.temperature = 0.7;
    }

    const res = await fetch(getEndpoint(), {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      let detail;
      try { detail = JSON.parse(text); } catch { detail = { error: { message: text } }; }
      throw new Error(`API ${res.status}: ${detail.error?.message || text}`);
    }

    const data = await res.json();
    return data;
  }

  // Extract text blocks. When web_search runs, the model often emits intermediate
  // text blocks ("I'll search for...") BEFORE the final answer. Concatenating them
  // pollutes JSON extraction, so we expose both helpers.
  function extractText(response) {
    if (!response.content) return '';
    return response.content
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('\n')
      .trim();
  }

  function extractLastText(response) {
    if (!response.content) return '';
    const texts = response.content.filter(b => b.type === 'text');
    return texts.length ? texts[texts.length - 1].text.trim() : '';
  }

  // Extract web_search citations (if any) for display
  function extractCitations(response) {
    const citations = [];
    if (!response.content) return citations;
    response.content.forEach(block => {
      if (block.type === 'text' && block.citations) {
        block.citations.forEach(c => {
          if (c.type === 'web_search_result_location') {
            citations.push({ title: c.title || c.url, url: c.url });
          }
        });
      }
    });
    // De-dupe by URL
    const seen = new Set();
    return citations.filter(c => { if (seen.has(c.url)) return false; seen.add(c.url); return true; });
  }

  // Robust JSON extraction. With web_search, responses often have:
  // - Preamble text ("I'll search for...")
  // - Tool use blocks (filtered out)
  // - Search result blocks (filtered out)
  // - Final answer text containing the JSON, possibly with prose around it
  // We use brace-balanced scanning to find the largest valid JSON object,
  // ignoring braces inside strings.
  function parseJsonResponse(text, response) {
    // Candidates to try, in priority order:
    // 1. Last text block alone (cleanest, most likely the final answer)
    // 2. All text concatenated (fallback)
    const candidates = [];
    if (response) {
      const last = extractLastText(response);
      if (last) candidates.push(last);
    }
    if (text) candidates.push(text);
    if (!candidates.length) throw new Error('Empty response');

    let lastError = null;
    for (const cand of candidates) {
      let cleaned = cand.trim();
      // Strip leading ```json or ``` fence
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
      }
      // Try direct parse
      try { return JSON.parse(cleaned); } catch (_) {}
      // Try fenced JSON anywhere in body
      const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (fenceMatch) {
        try { return JSON.parse(fenceMatch[1].trim()); } catch (_) {}
      }
      // Brace-balanced extraction (handles { inside body text correctly)
      const balanced = findBalancedJson(cleaned);
      if (balanced) {
        try { return JSON.parse(balanced); } catch (e) {
          // Last resort: strip trailing commas (a common Claude mistake)
          try { return JSON.parse(balanced.replace(/,(\s*[\]}])/g, '$1')); } catch (e2) {
            lastError = e2;
          }
        }
      }
    }
    const preview = (candidates[0] || '').slice(0, 1000);
    throw new Error(`JSON parse failed${lastError ? ': ' + lastError.message : ''}\n\nResponse preview (first 1000 chars):\n${preview}`);
  }

  // Scan for the largest balanced { ... } substring, skipping { inside strings.
  function findBalancedJson(text) {
    const start = text.indexOf('{');
    if (start < 0) return null;
    let depth = 0;
    let inString = false;
    let escape = false;
    for (let i = start; i < text.length; i++) {
      const c = text[i];
      if (escape) { escape = false; continue; }
      if (c === '\\') { escape = true; continue; }
      if (c === '"') { inString = !inString; continue; }
      if (inString) continue;
      if (c === '{') depth++;
      else if (c === '}') {
        depth--;
        if (depth === 0) return text.slice(start, i + 1);
      }
    }
    return null;
  }

  // ============== Public API ==============

  async function askSingle({ persona, question, model, useSearch, useThinking }) {
    const system = singleSystemPrompt(persona, useSearch);
    const userMessage = `RESEARCH QUESTION:\n${question}\n\nRespond as ${persona.name} (persona_voice) AND as the expert analyst (expert_analysis). Output JSON only.`;
    const raw = await callClaude({
      model, system, userMessage, useSearch, useThinking,
      maxTokens: useThinking ? 20000 : 8000,   // expert_analysis adds substantial Thai output
    });
    const text = extractText(raw);
    const parsed = parseJsonResponse(text, raw);
    return {
      parsed,
      citations: extractCitations(raw),
      raw,
      usage: raw.usage,
    };
  }

  async function runSurvey({ personas, question, model, useSearch, useThinking }) {
    const system = surveySystemPrompt(personas, useSearch);
    const userMessage = `RESEARCH QUESTION (to ask the panel):\n${question}\n\nSimulate the panel + include expert_analysis section. Return JSON only.`;
    const raw = await callClaude({
      model, system, userMessage, useSearch, useThinking,
      maxTokens: useThinking ? 24000 : 10000,
    });
    const text = extractText(raw);
    const parsed = parseJsonResponse(text, raw);
    return {
      parsed,
      citations: extractCitations(raw),
      raw,
      usage: raw.usage,
    };
  }

  // ============== Trend Discovery ==============

  function discoverSystemPrompt(focusCategories, currentDate) {
    const focusLine = focusCategories.length
      ? `Focus on these categories: ${focusCategories.join(', ')}.`
      : 'Cover all categories.';

    return `Thai beauty market analyst. Today: ${currentDate}.

Task: Use web_search to find recent trends (last 30-60 days) affecting Thai beauty consumer purchase decisions. ${focusLine}

Categories: channel, product, ingredient, price, kol, macro, culture, tech, competitor, regulatory, other.

Find 10-20 distinct trends. Each must have CLEAR impact on PURCHASE BEHAVIOR. Search both Thai + English queries.

OUTPUT — strict JSON only. No prose, no markdown fences. Start with { end with }.

Schema:
{
  "trends": [
    {
      "headline": "สั้น 1 บรรทัด ไทย (ใส่ชื่อแบรนด์/ตัวเลข)",
      "body": "1-2 ประโยค ไทย: ทำไมกระทบการซื้อ",
      "category": "channel|product|ingredient|price|kol|macro|culture|tech|competitor|regulatory|other",
      "date": "YYYY-MM-DD",
      "source_url": "https://...",
      "relevance": "high|medium|low"
    }
  ]
}

Rules:
- Keep bodies short (1-2 sentences max) so JSON fits in budget.
- Sort by relevance high to low.
- If a field is unknown, use empty string or omit — don't fabricate.
- If you find no trends at all, return {"trends": []}`;
  }

  async function discoverTrends({ focusCategories = [], model = 'claude-sonnet-4-6' } = {}) {
    const today = new Date().toISOString().slice(0, 10);
    const system = discoverSystemPrompt(focusCategories, today);
    const userMessage = `Search the web and find current Thai beauty market trends that affect purchase decisions. Today is ${today}. Return JSON only — no preamble, no markdown fences, no commentary after.`;
    const raw = await callClaude({
      model,
      system,
      userMessage,
      useSearch: true,
      useThinking: false,
      maxTokens: 16000,        // Thai chars are heavy on tokens; +web_search overhead
    });
    const text = extractText(raw);
    let parsed;
    try {
      parsed = parseJsonResponse(text, raw);
    } catch (parseErr) {
      // SALVAGE: if response was truncated (stop_reason=max_tokens), try to extract
      // however many complete trend objects we got before the cut-off.
      const salvaged = salvagePartialTrends(extractLastText(raw) || text);
      if (salvaged && salvaged.length) {
        console.warn(`Discover truncated; salvaged ${salvaged.length} complete trends.`);
        parsed = { trends: salvaged, _salvaged: true };
      } else {
        throw parseErr;
      }
    }
    return {
      parsed,
      citations: extractCitations(raw),
      raw,
      usage: raw.usage,
      discoveredAt: Date.now(),
      stopReason: raw.stop_reason,
    };
  }

  // Salvage partial trends from a truncated response. Walks through the text
  // finding complete {...} objects inside the "trends": [ ... ] array.
  function salvagePartialTrends(text) {
    if (!text) return [];
    // Locate "trends": [
    const arrIdx = text.search(/"trends"\s*:\s*\[/);
    if (arrIdx < 0) return [];
    let i = text.indexOf('[', arrIdx) + 1;
    const trends = [];
    while (i < text.length) {
      // Skip whitespace and commas
      while (i < text.length && /[\s,]/.test(text[i])) i++;
      if (i >= text.length) break;
      if (text[i] === ']') break;
      if (text[i] !== '{') break;
      // Find balanced object starting at i
      const start = i;
      let depth = 0, inString = false, escape = false;
      let end = -1;
      for (let j = start; j < text.length; j++) {
        const c = text[j];
        if (escape) { escape = false; continue; }
        if (c === '\\') { escape = true; continue; }
        if (c === '"') { inString = !inString; continue; }
        if (inString) continue;
        if (c === '{') depth++;
        else if (c === '}') {
          depth--;
          if (depth === 0) { end = j; break; }
        }
      }
      if (end < 0) break; // truncated mid-object — stop salvage here
      const objText = text.slice(start, end + 1);
      try {
        const obj = JSON.parse(objText);
        if (obj && obj.headline) trends.push(obj);
      } catch (_) { /* skip malformed object */ }
      i = end + 1;
    }
    return trends;
  }

  async function testConnection() {
    const body = {
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 50,
      messages: [{ role: 'user', content: 'Reply with the single word: ok' }],
    };
    const res = await fetch(getEndpoint(), {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`HTTP ${res.status}: ${t.slice(0, 300)}`);
    }
    return await res.json();
  }

  return { askSingle, runSurvey, discoverTrends, testConnection };
})();
