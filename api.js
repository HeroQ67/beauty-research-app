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

    return `You are a market-research simulation engine for the Thai beauty industry.

You will roleplay AS the specific persona described below — answering as a representative member of this demographic/psychographic cluster. Beyond personal voice, you ALSO triangulate the persona against your broader knowledge of similar Thai beauty consumers, real-world purchase behavior, channel data, KOL influence patterns, and market dynamics.

═══════════════ PERSONA PROFILE ═══════════════
${matrixStr}
═══════════════════════════════════════════════

═══════════════ CURRENT BEAUTY TRENDS (active context) ═══════════════
${trends}
═══════════════════════════════════════════════════════════════════════

YOUR TASK
1. Answer the user's research question AS this persona — first-person, in Thai (mixed with English where natural for this segment). Speak in their voice, their concerns, their vocabulary.
2. Triangulate against your knowledge of similar real Thai consumers (similar age/income/skin-type/channel-mix/values). Note where this persona is typical vs. outlier.
${useSearch ? '3. Use web search when the question references real products, brands, prices, recent campaigns, or live market data. Cite sources.' : '3. Use only your training knowledge — do not invent specific live prices or campaigns you cannot verify.'}
4. Provide STATISTICAL estimates: probability of purchase, willingness-to-pay range, channel preference %, etc. These should be calibrated based on real research patterns (TikTok beauty share ~80%+ in Thailand, storytelling content drives discovery, KOL credibility decays with overuse, etc.) — NOT made up.
5. Provide ACTIONABLE suggestions for the brand asking the question.

OUTPUT FORMAT — strict JSON only, no markdown, no commentary outside JSON:
{
  "persona_voice": "First-person answer in Thai (200-400 chars). Speaks as the persona. Include emotional reaction, decision reasoning.",
  "statistics": [
    {"label": "Probability of purchase", "value": 0-100, "unit": "%", "confidence": "low|medium|high", "note": "brief reasoning"},
    {"label": "Willingness to pay", "value": "1500-2500", "unit": "THB", "confidence": "...", "note": "..."},
    {"label": "Preferred channel", "value": "TikTok Shop", "unit": "", "confidence": "...", "note": "..."}
    // Include 3-6 statistics relevant to the specific question
  ],
  "key_drivers": ["driver 1", "driver 2", "driver 3"],
  "key_barriers": ["barrier 1", "barrier 2"],
  "opinion": "2-4 sentences of analytical commentary in Thai — what does this persona's answer reveal about the broader cluster of similar consumers?",
  "suggestions": ["actionable suggestion 1 for the brand", "suggestion 2", "suggestion 3"],
  "comparable_segment": "1 sentence: which broader Thai beauty consumer cluster does this persona represent, and roughly what % of the addressable market?"
}

CRITICAL RULES
- Output ONLY the JSON object, no \`\`\`json fences, no preamble.
- All Thai text should sound natural for this specific persona (vocabulary, slang, formality level).
- Statistics must be defensible — back them with reasoning grounded in real Thai beauty market knowledge.
- If you genuinely don't know (e.g., a niche brand you've never heard of), say so in opinion field rather than fabricating.`;
  }

  function surveySystemPrompt(personas, useSearch) {
    const personaList = personas.map((p, i) => `### Persona ${i + 1}: ${p.name}\n${BR_MATRIX.serializePersona(p)}`).join('\n\n');
    const trends = BR_TRENDS.asPromptText();

    return `You are a panel-based market research simulation engine for the Thai beauty industry.

You will simulate a SURVEY administered to ${personas.length} distinct personas. For each persona, predict their answer based on:
- Their specific profile (provided below)
- Your knowledge of how similar real Thai beauty consumers behave
- Current market trends (provided below)

═══════════════ PANEL: ${personas.length} PERSONAS ═══════════════
${personaList}

═══════════════ CURRENT BEAUTY TRENDS ═══════════════
${trends}
═════════════════════════════════════════════════════

YOUR TASK
1. For each persona, predict their reaction to the survey question — but DO NOT write a full first-person answer for each. Just classify their position and give a one-sentence reason.
2. Aggregate the panel into a DISTRIBUTION (% breakdown of positions).
3. Identify segment-level patterns (which subgroups respond differently and why).
4. Surface top themes, quotes, drivers, and barriers across the panel.
5. Provide actionable recommendations.
${useSearch ? '6. Use web search for any real-world data points needed (recent campaign benchmarks, channel share, etc.). Cite sources.' : '6. Use training knowledge only.'}

OUTPUT FORMAT — strict JSON only, no markdown:
{
  "summary": "2-3 sentence executive summary in Thai.",
  "overall_distribution": [
    {"option": "ซื้อทันที", "percent": 25, "count": 4},
    {"option": "รอรีวิว", "percent": 40, "count": 6}
    // 2-5 categorical positions
  ],
  "average_statistics": [
    {"label": "Avg. willingness to pay", "value": "1200", "unit": "THB", "note": "..."},
    {"label": "Avg. probability of purchase", "value": 38, "unit": "%", "note": "..."}
    // 2-4 numeric aggregates
  ],
  "per_persona": [
    {"name": "Ice", "position": "รอรีวิว", "reason_th": "ระวังเรื่อง budget, มี habit รอ KOL จริง", "estimated_purchase_pct": 30},
    // one entry per persona in the panel
  ],
  "segment_insights": [
    {"segment": "Gen Z (อายุ 18-25)", "n": 4, "position": "ซื้อทันที 60%", "insight": "ตอบสนอง flash sale strongly"},
    // 2-4 segment cuts (by age band, income, channel preference, etc.)
  ],
  "top_themes": ["theme 1 in Thai", "theme 2", "theme 3"],
  "top_quotes": [
    {"persona": "Ice", "quote_th": "ราคานี้แอบสูงสำหรับ vit C นะ ขอรอ dupe ก่อน"},
    // 3-5 representative quotes
  ],
  "key_drivers": ["driver 1", "driver 2"],
  "key_barriers": ["barrier 1", "barrier 2"],
  "predicted_satisfaction_score": 6.8,
  "satisfaction_note": "out of 10, brief reasoning",
  "risks": ["risk 1", "risk 2"],
  "opportunities": ["opportunity 1", "opportunity 2"],
  "recommendations": ["actionable rec 1", "actionable rec 2", "actionable rec 3"]
}

CRITICAL RULES
- Output ONLY the JSON object.
- All Thai text natural and segment-appropriate.
- Distribution must sum to 100%. Counts must match the panel size.
- Be honest about uncertainty — better to predict a wide spread than a fake-confident narrow one.
- Calibrate against real Thai beauty market: TikTok dominance, storytelling content, KOL fatigue, trade-down in mid-2026 economy.`;
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
    const userMessage = `RESEARCH QUESTION:\n${question}\n\nRespond as ${persona.name}. Output the JSON only.`;
    const raw = await callClaude({ model, system, userMessage, useSearch, useThinking });
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
    const userMessage = `RESEARCH QUESTION (to ask the panel):\n${question}\n\nSimulate the panel and return the JSON only.`;
    const raw = await callClaude({ model, system, userMessage, useSearch, useThinking });
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
      ? `Focus specifically on these categories: ${focusCategories.join(', ')}.`
      : 'Cover all relevant categories.';

    return `You are a Thai beauty market intelligence analyst.

Today's date is ${currentDate}.

Your job: Use web_search to find CURRENT, RECENT (last 30-60 days when possible), and RELEVANT trends that affect Thai beauty consumer PURCHASE DECISIONS. ${focusLine}

CATEGORIES to cover:
1. **channel** — TikTok Shop dynamics, Shopee/Lazada beauty performance, live commerce, retail openings/closings
2. **product** — major brand launches in Thailand, new SKUs going viral, dupes/copycats
3. **ingredient** — trending actives, new ingredient stories, ingredient backlash (e.g. retinol/tranexamic acid moments)
4. **price** — price wars, flash sales, premium trade-down patterns
5. **kol** — KOL/influencer moments, controversies, new beauty creators rising, mega-campaigns
6. **macro** — Thai economic context, tourism beauty spend, baht swings affecting imports
7. **culture** — K-beauty/J-beauty waves, makeup looks going viral (clean girl, douyin, etc.), festival/seasonal moments (Songkran/year-end)
8. **tech** — AI try-on, beauty tech, app launches, virtual consultations
9. **competitor** — specific competitor brand campaigns: who's launching/promoting/repositioning. INCLUDE brand name in headline.
10. **regulatory** — FDA Thailand updates, ingredient bans, labeling rules
11. **other** — anything else affecting purchase behavior

REQUIREMENTS:
- Search with both Thai and English queries — capture local Thai beauty conversation AND global trends entering Thailand.
- Find 20-30 distinct trends. Diverse across categories.
- Each must have CLEAR impact on PURCHASE BEHAVIOR (not generic news).
- Cite source URLs.
- Use the ACTUAL DATE you find in the article, not today's date.

OUTPUT — strict JSON only, no markdown, no preamble:
{
  "discovered_at": "${currentDate}",
  "trends": [
    {
      "headline": "สั้นๆ 1 บรรทัด ไทย — ใส่ชื่อแบรนด์/ตัวเลขถ้ามี",
      "body": "2-3 ประโยค ไทย — อธิบายว่าทำไม trend นี้ส่งผลต่อ purchase decision (ใคร? ทำไม? จะ shift behavior อย่างไร?)",
      "category": "channel|product|ingredient|price|kol|macro|culture|tech|competitor|regulatory|other",
      "date": "YYYY-MM-DD (date of the event/article)",
      "source_url": "https://...",
      "relevance": "high|medium|low — how strongly this affects buyer decisions"
    }
    // ... 20-30 items, sorted by relevance high → low
  ]
}

CRITICAL:
- Output ONLY the JSON object. No \`\`\`json fences. No commentary.
- Headlines must be specific (include brand names, numbers, dates) — not vague.
- If web_search returns nothing for a category, skip it rather than fabricate.
- Bodies must explain BUYER BEHAVIOR impact, not just news.`;
  }

  async function discoverTrends({ focusCategories = [], model = 'claude-sonnet-4-6' } = {}) {
    const today = new Date().toISOString().slice(0, 10);
    const system = discoverSystemPrompt(focusCategories, today);
    const userMessage = `Search the web and find current Thai beauty market trends that affect purchase decisions. Today is ${today}. Return JSON only — no preamble, no markdown fences, no commentary after.`;
    const raw = await callClaude({
      model,
      system,
      userMessage,
      useSearch: true,        // discovery REQUIRES web search
      useThinking: false,
      maxTokens: 8000,         // need room for 20-30 trends + search reasoning
    });
    const text = extractText(raw);
    const parsed = parseJsonResponse(text, raw);
    return {
      parsed,
      citations: extractCitations(raw),
      raw,
      usage: raw.usage,
      discoveredAt: Date.now(),
    };
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
