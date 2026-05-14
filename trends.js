// trends.js — Trend management (dated entries + categories)
// Trends are injected into every Claude prompt so personas reason against current market conditions.

window.BR_TRENDS = (function () {
  const CATEGORIES = [
    { v: 'channel', label: 'ช่องทาง / Channel' },
    { v: 'product', label: 'ผลิตภัณฑ์ / Product' },
    { v: 'ingredient', label: 'ส่วนผสม / Ingredient' },
    { v: 'price', label: 'ราคา / Price' },
    { v: 'kol', label: 'KOL / Influencer' },
    { v: 'macro', label: 'Macro / Economy' },
    { v: 'culture', label: 'วัฒนธรรม / Culture' },
    { v: 'tech', label: 'เทคโนโลยี / Tech' },
    { v: 'competitor', label: '🏷 Competitor brand' },
    { v: 'regulatory', label: '⚖️ Regulatory' },
    { v: 'other', label: 'อื่นๆ / Other' },
  ];

  const DISCOVERED_CACHE_KEY = 'br_discovered_trends';
  let lastDiscovered = null;
  let selectedFilters = new Set();

  // Default seed trends (Thai beauty market, 2026)
  const SEED_TRENDS = [
    {
      id: 't_seed_1',
      category: 'channel',
      headline: 'TikTok Shop ครองสัดส่วน beauty e-commerce ~82% ในไทย',
      body: 'Live commerce + AI-driven recommendation ทำให้ TikTok แซง Shopee/Lazada ในกลุ่ม mass beauty. แบรนด์ต้องมี TikTok strategy ไม่งั้นโดน skip',
      date: '2026-04-01',
    },
    {
      id: 't_seed_2',
      category: 'ingredient',
      headline: 'Tranexamic acid + Niacinamide กำลังแซง vit C ในตลาด whitening',
      body: 'ผู้บริโภคไทยเริ่มเข้าใจ ingredient deeper — มองหา clinical-backed actives แทน "ขาวใส" claim',
      date: '2026-03-15',
    },
    {
      id: 't_seed_3',
      category: 'culture',
      headline: 'Skinimalism เริ่มมาแทน 10-step routine',
      body: 'Gen Z เริ่มลด step lง เน้น hero products 3-4 ตัว. คนหา multi-tasking actives',
      date: '2026-02-20',
    },
    {
      id: 't_seed_4',
      category: 'macro',
      headline: 'เศรษฐกิจไทยซบเซา → consumer trade-down ใน premium beauty',
      body: 'Mass market (CeraVe, Mistine, Innisfree) โต. Luxury counter (SK-II, La Mer) แผ่วลง',
      date: '2026-01-10',
    },
  ];

  function getAll() { return BR_STORE.getTrends(); }
  function save(list) { return BR_STORE.saveTrends(list); }

  function add(trend) {
    const list = getAll();
    list.unshift(Object.assign({ id: 't_' + uid(), date: new Date().toISOString().slice(0, 10) }, trend));
    save(list);
    return list[0];
  }

  function update(id, patch) {
    const list = getAll();
    const i = list.findIndex(t => t.id === id);
    if (i < 0) return;
    list[i] = Object.assign({}, list[i], patch);
    save(list);
  }

  function remove(id) {
    save(getAll().filter(t => t.id !== id));
  }

  function loadSeeds() {
    const current = getAll();
    const existing = new Set(current.map(t => t.id));
    const news = SEED_TRENDS.filter(t => !existing.has(t.id));
    save(news.concat(current));
    return news.length;
  }

  // Format trends for Claude prompt (compact, dated)
  function asPromptText() {
    const list = getAll();
    if (!list.length) return '(no current trends provided)';
    return list.map(t => {
      const cat = CATEGORIES.find(c => c.v === t.category);
      return `[${t.date}] [${cat ? cat.label : t.category}] ${t.headline}\n  ${t.body}`;
    }).join('\n\n');
  }

  // ============ UI ============
  function render() {
    const list = getAll();
    const root = document.getElementById('trend-list');
    if (!root) return;
    if (!list.length) {
      root.innerHTML = `<div class="empty-state small">
        <div class="empty-ico">📈</div>
        <p>ยังไม่มี trend<br>กด + เพิ่มเทรนด์ หรือ Seed ตัวอย่าง</p>
        <button id="btn-seed-trends" class="ghost-btn">🌱 Load seed trends (4 ตัวอย่าง)</button>
      </div>`;
      const seedBtn = document.getElementById('btn-seed-trends');
      if (seedBtn) seedBtn.addEventListener('click', () => { loadSeeds(); render(); toast('Load seeds ลงแล้ว', 'success'); });
    } else {
      root.innerHTML = list.map(t => renderCard(t)).join('');
      bindCards();
    }
    renderPreview();
  }

  function renderCard(t) {
    const cat = CATEGORIES.find(c => c.v === t.category);
    return `<div class="trend-card" data-id="${t.id}">
      <div class="trend-head">
        <div style="flex:1;">
          <div class="trend-meta">
            <span class="trend-category">${cat ? escape(cat.label) : escape(t.category)}</span>
            <span>📅 ${escape(t.date || '')}</span>
          </div>
          <h3 style="margin: 6px 0 0;" contenteditable="true" data-edit="headline">${escape(t.headline)}</h3>
        </div>
        <div class="trend-actions">
          <button class="ghost-btn small btn-trend-delete" title="ลบ">🗑</button>
        </div>
      </div>
      <div class="trend-body" contenteditable="true" data-edit="body">${escape(t.body)}</div>
    </div>`;
  }

  function bindCards() {
    document.querySelectorAll('.trend-card').forEach(card => {
      const id = card.dataset.id;
      card.querySelectorAll('[contenteditable]').forEach(el => {
        el.addEventListener('blur', () => {
          const patch = { [el.dataset.edit]: el.textContent.trim() };
          update(id, patch);
          renderPreview();
        });
      });
      card.querySelector('.btn-trend-delete').addEventListener('click', () => {
        if (confirm('ลบ trend นี้?')) { remove(id); render(); }
      });
    });
  }

  function renderPreview() {
    const el = document.getElementById('trends-preview');
    if (el) el.textContent = asPromptText();
  }

  function openAddDialog() {
    const headline = prompt('Headline (สั้นๆ 1 บรรทัด):');
    if (!headline) return;
    const body = prompt('รายละเอียด (ทำไมถึงสำคัญต่อพฤติกรรมการซื้อ?):') || '';
    const cat = prompt('Category (channel/product/ingredient/price/kol/macro/culture/tech/other):', 'other') || 'other';
    add({ headline, body, category: cat });
    render();
    toast('เพิ่มเทรนด์แล้ว', 'success');
  }

  // ============ Discover Trends (web research) ============

  function renderFilterGrid() {
    const root = document.getElementById('discover-filter-grid');
    if (!root) return;
    root.innerHTML = CATEGORIES.map(c => `
      <label data-cat="${c.v}" class="${selectedFilters.has(c.v) ? 'checked' : ''}">
        <input type="checkbox" value="${c.v}" ${selectedFilters.has(c.v) ? 'checked' : ''}>
        <span>${escape(c.label)}</span>
      </label>
    `).join('');
    root.querySelectorAll('label').forEach(lab => {
      const cb = lab.querySelector('input');
      cb.addEventListener('change', () => {
        if (cb.checked) selectedFilters.add(cb.value);
        else selectedFilters.delete(cb.value);
        lab.classList.toggle('checked', cb.checked);
      });
    });
  }

  function loadCache() {
    lastDiscovered = BR_STORE.get(DISCOVERED_CACHE_KEY, null);
    if (!lastDiscovered) return;
    if (lastDiscovered.empty || !lastDiscovered.trends || !lastDiscovered.trends.length) {
      // Show friendly "no results" status from a previous discovery
      const status = document.getElementById('discover-status');
      const results = document.getElementById('discover-results');
      if (results) results.hidden = true;
      if (status) {
        status.hidden = false;
        const ago = humanAgo(lastDiscovered.ts);
        status.innerHTML = `<div style="text-align:center; padding: 20px; width: 100%;">
          <div style="font-size: 2.2rem; margin-bottom: 8px;">🕊</div>
          <div style="font-weight: 700; font-size: 1rem; color: var(--text);">ไม่พบ Trend ที่เกี่ยวข้องในวันนี้</div>
          <div style="margin-top: 6px; font-size: .8rem; color: var(--text-muted);">last checked ${ago} · ลองอีกครั้งภายหลัง</div>
        </div>`;
      }
      return;
    }
    renderDiscoveredResults();
  }

  async function discoverNow() {
    const btn = document.getElementById('btn-discover-trends');
    const status = document.getElementById('discover-status');
    const results = document.getElementById('discover-results');

    btn.disabled = true;
    btn.textContent = '⏳ กำลังค้น...';
    status.hidden = false;
    status.innerHTML = '<div class="spinner" style="width:18px; height:18px;"></div> <span>Claude กำลังค้นหา trends จาก web... ใช้เวลา 30-90 วินาที</span>';
    results.hidden = true;

    try {
      const focus = Array.from(selectedFilters);
      const result = await BR_API.discoverTrends({ focusCategories: focus });
      // Distinguish "API failed entirely" from "API succeeded but returned zero trends"
      if (!result.parsed || !Array.isArray(result.parsed.trends)) {
        throw new Error('Claude ตอบกลับมาในรูปแบบที่อ่านไม่ได้ — ลองอีกครั้ง');
      }
      const trends = result.parsed.trends;
      if (!trends.length) {
        // Legitimate empty result — friendly message, not an error
        results.hidden = true;
        status.hidden = false;
        status.innerHTML = `<div style="text-align:center; padding: 20px; width: 100%;">
          <div style="font-size: 2.2rem; margin-bottom: 8px;">🕊</div>
          <div style="font-weight: 700; font-size: 1rem; color: var(--text);">ไม่พบ Trend ที่เกี่ยวข้องในวันนี้</div>
          <div style="margin-top: 6px; font-size: .8rem; color: var(--text-muted);">ลองอีกครั้งภายหลัง หรือเปลี่ยน category filter</div>
        </div>`;
        toast('ไม่พบ Trend ใหม่วันนี้', '');
        // Clear stale cache so the "no results" stays sticky until next discovery
        lastDiscovered = { ts: result.discoveredAt, trends: [], citations: result.citations, empty: true };
        BR_STORE.set(DISCOVERED_CACHE_KEY, lastDiscovered);
        return;
      }
      lastDiscovered = {
        ts: result.discoveredAt,
        trends,
        citations: result.citations,
        salvaged: !!result.parsed._salvaged,
      };
      BR_STORE.set(DISCOVERED_CACHE_KEY, lastDiscovered);
      status.hidden = true;
      renderDiscoveredResults();
      if (result.parsed._salvaged) {
        toast(`พบ ${trends.length} candidates (partial — response ถูกตัด)`, '');
      } else {
        toast(`พบ ${trends.length} candidates`, 'success');
      }
    } catch (e) {
      console.error('Discover error', e);
      status.innerHTML = `<div style="color: var(--danger); white-space: pre-wrap; font-size: .8rem;"><b>❌ Error:</b>\n${escape(e.message)}</div>`;
    } finally {
      btn.disabled = false;
      btn.textContent = '🔍 ค้นหา Trends';
    }
  }

  function renderDiscoveredResults() {
    if (!lastDiscovered) return;
    const root = document.getElementById('discover-candidates');
    const countEl = document.getElementById('discover-results-count');
    const timeEl = document.getElementById('discover-results-time');
    const wrap = document.getElementById('discover-results');
    if (!root || !lastDiscovered.trends.length) {
      wrap.hidden = true;
      return;
    }
    wrap.hidden = false;
    countEl.textContent = lastDiscovered.trends.length;
    const ago = humanAgo(lastDiscovered.ts);
    timeEl.textContent = `· last discovered ${ago}`;

    // Build candidates with unique IDs (index-based, since they're fresh)
    root.innerHTML = lastDiscovered.trends.map((t, i) => {
      const cat = CATEGORIES.find(c => c.v === t.category);
      const rel = t.relevance || 'medium';
      return `<label class="candidate-card" data-idx="${i}">
        <input type="checkbox" data-cand-idx="${i}">
        <div class="cand-body">
          <div class="cand-headline">${escape(t.headline)}</div>
          <div class="cand-body-text">${escape(t.body)}</div>
          <div class="cand-meta">
            <span class="cand-cat">${cat ? escape(cat.label) : escape(t.category || 'other')}</span>
            <span>📅 ${escape(t.date || 'n/a')}</span>
            <span class="cand-rel-${rel}">⚡ ${escape(rel)}</span>
            ${t.source_url ? `<a class="cand-source" href="${escape(t.source_url)}" target="_blank" rel="noopener" onclick="event.stopPropagation()">🔗 source</a>` : ''}
          </div>
        </div>
      </label>`;
    }).join('');

    // Wire checkbox toggle + visual state
    root.querySelectorAll('.candidate-card').forEach(card => {
      const cb = card.querySelector('input');
      // Prevent <a> source link from toggling the card
      card.addEventListener('click', e => {
        if (e.target.tagName === 'A') return;
        if (e.target !== cb) { cb.checked = !cb.checked; }
        card.classList.toggle('checked', cb.checked);
        updateSelectedCount();
      });
      cb.addEventListener('change', () => {
        card.classList.toggle('checked', cb.checked);
        updateSelectedCount();
      });
    });
    updateSelectedCount();
  }

  function updateSelectedCount() {
    const n = document.querySelectorAll('#discover-candidates input:checked').length;
    const el = document.getElementById('discover-selected-count');
    if (el) el.textContent = n;
    const btn = document.getElementById('btn-discover-add');
    if (btn) btn.disabled = n === 0;
  }

  function addSelected() {
    const checked = Array.from(document.querySelectorAll('#discover-candidates input:checked'));
    if (!checked.length) { toast('ยังไม่ได้เลือก', 'error'); return; }
    if (!lastDiscovered) return;
    let addedCount = 0;
    checked.forEach(cb => {
      const idx = Number(cb.dataset.candIdx);
      const t = lastDiscovered.trends[idx];
      if (!t) return;
      add({
        headline: t.headline,
        body: t.body + (t.source_url ? `\n\n🔗 Source: ${t.source_url}` : ''),
        category: t.category || 'other',
        date: t.date || new Date().toISOString().slice(0, 10),
      });
      addedCount++;
    });
    // Uncheck all + re-render trend list
    document.querySelectorAll('#discover-candidates input:checked').forEach(cb => { cb.checked = false; cb.closest('.candidate-card').classList.remove('checked'); });
    updateSelectedCount();
    render();
    toast(`เพิ่ม ${addedCount} trends เข้า Active แล้ว`, 'success');
  }

  function humanAgo(ts) {
    if (!ts) return '';
    const mins = Math.floor((Date.now() - ts) / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins} min ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hr ago`;
    const days = Math.floor(hrs / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }

  function init() {
    render();
    renderFilterGrid();
    loadCache();

    document.getElementById('btn-new-trend').addEventListener('click', openAddDialog);
    document.getElementById('btn-discover-trends').addEventListener('click', discoverNow);
    document.getElementById('btn-discover-select-all').addEventListener('click', () => {
      document.querySelectorAll('#discover-candidates input').forEach(cb => {
        cb.checked = true; cb.closest('.candidate-card').classList.add('checked');
      });
      updateSelectedCount();
    });
    document.getElementById('btn-discover-clear').addEventListener('click', () => {
      document.querySelectorAll('#discover-candidates input').forEach(cb => {
        cb.checked = false; cb.closest('.candidate-card').classList.remove('checked');
      });
      updateSelectedCount();
    });
    document.getElementById('btn-discover-add').addEventListener('click', addSelected);
  }

  function escape(s) {
    return String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  return { init, getAll, asPromptText, add, remove, update, loadSeeds, CATEGORIES };
})();
