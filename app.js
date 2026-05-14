// app.js — Boot, tab switching, API settings modal
// Last script loaded — all other modules must be ready when this runs.

(function () {

  // ============ Tab Switching ============
  function initTabs() {
    document.querySelectorAll('.tabs .tab').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.dataset.tab;
        document.querySelectorAll('.tabs .tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
        document.getElementById('tab-' + target).classList.add('active');
        // Refresh research selectors when switching to research tab
        if (target === 'research') BR_RESEARCH.refreshPersonaSelect();
      });
    });
  }

  // ============ Proxy mode detection ============
  function isProxyMode() {
    return !!(window.BR_CONFIG && window.BR_CONFIG.proxyUrl);
  }

  function initProxyDisplay() {
    if (!isProxyMode()) return;
    // Show "Shared" badge in header
    const badge = document.getElementById('proxy-badge');
    if (badge) badge.hidden = false;
    // Show proxy info section + hide BYO-key section in modal
    const info = document.getElementById('proxy-info');
    const byo = document.getElementById('byo-key-info');
    if (info) info.hidden = false;
    if (byo) byo.hidden = true;
    const urlEl = document.getElementById('proxy-url-display');
    if (urlEl) urlEl.textContent = window.BR_CONFIG.proxyUrl;
  }

  // ============ API Settings Modal ============
  function initApiModal() {
    const modal = document.getElementById('modal-api');
    const btnOpen = document.getElementById('btn-api-settings');

    function open() {
      if (!isProxyMode()) {
        document.getElementById('input-api-key').value = BR_STORE.getApiKey() || '';
      }
      const betas = BR_STORE.getApiBetas();
      document.getElementById('beta-context-1m').checked = !!betas.context1m;
      document.getElementById('beta-prompt-caching').checked = !!betas.promptCaching;
      document.getElementById('api-test-result').textContent = '';
      modal.hidden = false;
    }
    function close() { modal.hidden = true; }

    btnOpen.addEventListener('click', open);
    modal.querySelectorAll('[data-close-modal]').forEach(b => b.addEventListener('click', close));
    modal.querySelector('.modal-backdrop').addEventListener('click', close);

    document.getElementById('btn-save-api').addEventListener('click', () => {
      if (!isProxyMode()) {
        const key = document.getElementById('input-api-key').value.trim();
        BR_STORE.saveApiKey(key);
      }
      BR_STORE.saveApiBetas({
        context1m: document.getElementById('beta-context-1m').checked,
        promptCaching: document.getElementById('beta-prompt-caching').checked,
      });
      toast('บันทึก settings แล้ว', 'success');
      close();
    });

    document.getElementById('btn-test-api').addEventListener('click', async () => {
      const out = document.getElementById('api-test-result');
      if (!isProxyMode()) {
        const key = document.getElementById('input-api-key').value.trim();
        if (!key) { out.textContent = '⚠️ ใส่ API key ก่อน'; return; }
        BR_STORE.saveApiKey(key);
      }
      out.textContent = 'กำลังทดสอบ...';
      try {
        const r = await BR_API.testConnection();
        out.textContent = '✅ เชื่อมต่อสำเร็จ (model: ' + (r.model || 'ok') + ')';
        out.style.color = 'var(--success)';
      } catch (e) {
        out.textContent = '❌ ' + e.message;
        out.style.color = 'var(--danger)';
      }
    });
  }

  // ============ First-run helper ============
  function firstRunCheck() {
    if (isProxyMode()) return; // no key needed
    if (!BR_STORE.getApiKey()) {
      setTimeout(() => {
        toast('💡 ตั้ง API key ที่ปุ่ม ⚙️ API ก่อนใช้งาน Research', '');
      }, 800);
    }
  }

  // ============ Boot ============
  document.addEventListener('DOMContentLoaded', () => {
    BR_PERSONAS.init();
    BR_TRENDS.init();
    BR_RESEARCH.init();
    initTabs();
    initProxyDisplay();
    initApiModal();
    firstRunCheck();
  });

})();
