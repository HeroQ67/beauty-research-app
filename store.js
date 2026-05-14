// store.js — thin LocalStorage wrapper + global state
// Keys are prefixed `br_` (beauty-research) so they don't collide with other apps.

window.BR_STORE = {
  KEYS: {
    personas: 'br_personas',
    trends: 'br_trends',
    apiKey: 'br_api_key',
    apiBetas: 'br_api_betas',
    historySingle: 'br_history_single',
    historySurvey: 'br_history_survey',
    activePersona: 'br_active_persona_id',
  },

  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return fallback;
      return JSON.parse(raw);
    } catch (e) {
      console.warn('store.get failed for', key, e);
      return fallback;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error('store.set failed for', key, e);
      return false;
    }
  },

  del(key) {
    localStorage.removeItem(key);
  },

  // Personas
  getPersonas() { return this.get(this.KEYS.personas, []); },
  savePersonas(arr) { return this.set(this.KEYS.personas, arr); },

  // Trends
  getTrends() { return this.get(this.KEYS.trends, []); },
  saveTrends(arr) { return this.set(this.KEYS.trends, arr); },

  // API
  getApiKey() { return this.get(this.KEYS.apiKey, ''); },
  saveApiKey(k) { return this.set(this.KEYS.apiKey, k); },
  getApiBetas() { return this.get(this.KEYS.apiBetas, { context1m: true, promptCaching: true }); },
  saveApiBetas(b) { return this.set(this.KEYS.apiBetas, b); },

  // History (last 30 of each)
  pushHistory(kind, entry) {
    const key = kind === 'single' ? this.KEYS.historySingle : this.KEYS.historySurvey;
    const list = this.get(key, []);
    list.unshift(entry);
    if (list.length > 30) list.length = 30;
    return this.set(key, list);
  },
};

// Quick uid helper used across modules
window.uid = () => Math.random().toString(36).slice(2, 10);

// Toast helper
window.toast = (msg, type = '') => {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.className = 'toast ' + type;
  t.hidden = false;
  clearTimeout(window._toastT);
  window._toastT = setTimeout(() => { t.hidden = true; }, 2400);
};
