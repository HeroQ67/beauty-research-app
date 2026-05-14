// research.js — Single Q&A + Multi-Persona Survey UI
// Renders structured JSON responses from api.js into readable + printable HTML.

window.BR_RESEARCH = (function () {
  let lastSingleResult = null;
  let lastSurveyResult = null;

  // ============ Mode switching ============
  function initModeSwitcher() {
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const mode = btn.dataset.mode;
        document.querySelectorAll('.research-mode').forEach(m => m.classList.remove('active'));
        document.getElementById('research-' + mode).classList.add('active');
      });
    });
  }

  // ============ Single Persona Q&A ============
  function refreshPersonaSelect() {
    const sel = document.getElementById('single-persona-select');
    if (!sel) return;
    const personas = BR_PERSONAS.getAll();
    const current = sel.value;
    sel.innerHTML = '<option value="">— เลือก persona —</option>' +
      personas.map(p => `<option value="${p.id}">${escape(p.name)}${p.age ? ` (${p.age}y)` : ''}</option>`).join('');
    if (current && personas.some(p => p.id === current)) sel.value = current;

    // Also refresh checklist
    refreshPersonaChecklist();
  }

  function refreshPersonaChecklist() {
    const root = document.getElementById('survey-persona-list');
    if (!root) return;
    const personas = BR_PERSONAS.getAll();
    if (!personas.length) {
      root.innerHTML = '<p class="muted small" style="padding:8px;">ยังไม่มี persona — สร้างใน tab Personas ก่อน</p>';
      return;
    }
    root.innerHTML = personas.map(p => `
      <label>
        <input type="checkbox" value="${p.id}" data-persona>
        <span>${escape(p.name)} ${p.age ? `<small>(${p.age}y, ${escape(p.occupation || '')})</small>` : ''}</span>
      </label>
    `).join('');
  }

  function initSingle() {
    // Quick prompt chips
    document.querySelectorAll('.quick-prompts .chip').forEach(chip => {
      chip.addEventListener('click', () => {
        document.getElementById('single-question').value = chip.dataset.prompt;
      });
    });

    document.getElementById('btn-ask-single').addEventListener('click', askSingle);

    document.getElementById('btn-clear-single').addEventListener('click', () => {
      document.getElementById('single-output').innerHTML = `<div class="empty-state small">
        <div class="empty-ico">💬</div><p>เลือก persona และพิมพ์คำถามทางซ้าย</p></div>`;
      document.getElementById('single-output-actions').hidden = true;
      lastSingleResult = null;
    });

    document.getElementById('btn-print-single').addEventListener('click', () => {
      if (lastSingleResult) BR_REPORT.printSingle(lastSingleResult);
    });

    document.getElementById('btn-save-single').addEventListener('click', () => {
      if (lastSingleResult) {
        BR_STORE.pushHistory('single', { ts: Date.now(), ...lastSingleResult });
        toast('บันทึก history แล้ว', 'success');
      }
    });
  }

  async function askSingle() {
    const personaId = document.getElementById('single-persona-select').value;
    const question = document.getElementById('single-question').value.trim();
    const model = document.getElementById('single-model').value;
    const useSearch = document.getElementById('single-use-search').checked;
    const useThinking = document.getElementById('single-use-thinking').checked;

    if (!personaId) { toast('เลือก persona ก่อน', 'error'); return; }
    if (!question) { toast('พิมพ์คำถามก่อน', 'error'); return; }

    const persona = BR_PERSONAS.getAll().find(p => p.id === personaId);
    if (!persona) { toast('Persona หาไม่เจอ', 'error'); return; }

    const out = document.getElementById('single-output');
    out.innerHTML = `<div class="loading"><div class="spinner"></div><span>กำลังถาม ${escape(persona.name)}... ${useSearch ? '(ใช้ web search — อาจช้า 30-60 วิ)' : ''}</span></div>`;
    document.getElementById('single-output-actions').hidden = true;

    try {
      const result = await BR_API.askSingle({ persona, question, model, useSearch, useThinking });
      lastSingleResult = { persona, question, model, useSearch, useThinking, ...result, ts: Date.now() };
      out.innerHTML = renderSingle(lastSingleResult);
      document.getElementById('single-output-actions').hidden = false;
      toast('ตอบเสร็จแล้ว', 'success');
    } catch (e) {
      console.error(e);
      out.innerHTML = `<div class="error-msg"><b>เกิดข้อผิดพลาด:</b><br>${escape(e.message)}</div>`;
    }
  }

  function renderSingle(result) {
    const { persona, question, parsed, citations } = result;
    const p = parsed;

    const stats = (p.statistics || []).map(s => `
      <div class="stat-card">
        <div class="stat-label">${escape(s.label)}</div>
        <div class="stat-value">${escape(String(s.value))}${s.unit ? ` <span style="font-size:.7em;color:var(--text-soft);">${escape(s.unit)}</span>` : ''}</div>
        ${typeof s.value === 'number' && s.unit === '%' ? `<div class="stat-bar"><div class="stat-bar-fill" style="width:${Math.max(0, Math.min(100, s.value))}%;"></div></div>` : ''}
        ${s.note ? `<div class="muted small" style="margin-top:6px;">${escape(s.note)}</div>` : ''}
        ${s.confidence ? `<div class="muted small" style="margin-top:4px;">Confidence: <b>${escape(s.confidence)}</b></div>` : ''}
      </div>
    `).join('');

    const drivers = (p.key_drivers || []).map(d => `<li>${escape(d)}</li>`).join('');
    const barriers = (p.key_barriers || []).map(d => `<li>${escape(d)}</li>`).join('');
    const sugg = (p.suggestions || []).map(s => `<li>${escape(s)}</li>`).join('');

    const cites = citations && citations.length ? `<div style="margin-top:12px;font-size:.8rem;">
      <b>🌐 Sources:</b> ${citations.map(c => `<a href="${escape(c.url)}" target="_blank" rel="noopener" class="search-citation">${escape(c.title.slice(0, 60))}</a>`).join(' ')}
    </div>` : '';

    return `
      <div class="report-header show-print">
        <h1>Single Persona Research Report</h1>
        <p><b>Persona:</b> ${escape(persona.name)}${persona.age ? ` · ${persona.age}y` : ''}${persona.occupation ? ` · ${escape(persona.occupation)}` : ''}</p>
        <p><b>คำถาม:</b> ${escape(question)}</p>
        <p><b>Date:</b> ${new Date().toLocaleString('th-TH')}</p>
      </div>

      <h2 style="margin-bottom:8px;">💬 คำตอบในมุมมอง ${escape(persona.name)}</h2>
      <div class="answer-block">
        <div class="opinion-block" style="background:transparent;border:none;padding:0;">
          <div class="quote" style="font-size:1.05rem;">${escape(p.persona_voice || '')}</div>
        </div>
      </div>

      ${stats ? `<h3 style="margin-top:24px;">📊 Statistics & Predictions</h3>
        <div class="stat-grid">${stats}</div>` : ''}

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-top:16px;">
        ${drivers ? `<div class="opinion-block"><h4>✅ Key Drivers</h4><ul class="suggestion-list">${drivers}</ul></div>` : ''}
        ${barriers ? `<div class="opinion-block"><h4>⚠️ Key Barriers</h4><ul class="suggestion-list">${barriers}</ul></div>` : ''}
      </div>

      ${p.opinion ? `<div class="opinion-block" style="margin-top:16px;">
        <h4>🧠 Analytical Commentary</h4>
        <p>${escape(p.opinion)}</p>
        ${p.comparable_segment ? `<p class="muted small" style="margin-top:8px;"><b>Cluster:</b> ${escape(p.comparable_segment)}</p>` : ''}
      </div>` : ''}

      ${sugg ? `<div class="suggestion-block" style="margin-top:16px;">
        <h4>💡 Suggestions for the brand</h4>
        <ul class="suggestion-list">${sugg}</ul>
      </div>` : ''}

      ${cites}
    `;
  }

  // ============ Survey Mode ============
  function initSurvey() {
    document.getElementById('btn-select-all-personas').addEventListener('click', () => {
      document.querySelectorAll('#survey-persona-list input[data-persona]').forEach(c => c.checked = true);
    });
    document.getElementById('btn-clear-personas').addEventListener('click', () => {
      document.querySelectorAll('#survey-persona-list input[data-persona]').forEach(c => c.checked = false);
    });

    document.getElementById('btn-run-survey').addEventListener('click', runSurvey);

    document.getElementById('btn-clear-survey').addEventListener('click', () => {
      document.getElementById('survey-output').innerHTML = `<div class="empty-state small">
        <div class="empty-ico">📊</div><p>เลือก personas อย่างน้อย 2 คน แล้วกด รัน Survey</p></div>`;
      document.getElementById('survey-output-actions').hidden = true;
      lastSurveyResult = null;
    });

    document.getElementById('btn-print-survey').addEventListener('click', () => {
      if (lastSurveyResult) BR_REPORT.printSurvey(lastSurveyResult);
    });

    document.getElementById('btn-save-survey').addEventListener('click', () => {
      if (lastSurveyResult) {
        BR_STORE.pushHistory('survey', { ts: Date.now(), ...lastSurveyResult });
        toast('บันทึก history แล้ว', 'success');
      }
    });
  }

  async function runSurvey() {
    const selectedIds = Array.from(document.querySelectorAll('#survey-persona-list input[data-persona]:checked')).map(c => c.value);
    const question = document.getElementById('survey-question').value.trim();
    const model = document.getElementById('survey-model').value;
    const useSearch = document.getElementById('survey-use-search').checked;
    const useThinking = document.getElementById('survey-use-thinking').checked;

    if (selectedIds.length < 2) { toast('เลือก personas อย่างน้อย 2 คน', 'error'); return; }
    if (!question) { toast('พิมพ์คำถามก่อน', 'error'); return; }

    const allPersonas = BR_PERSONAS.getAll();
    const personas = selectedIds.map(id => allPersonas.find(p => p.id === id)).filter(Boolean);

    const out = document.getElementById('survey-output');
    out.innerHTML = `<div class="loading"><div class="spinner"></div><span>กำลังรัน survey กับ ${personas.length} personas... ${useSearch || useThinking ? '(ใช้ web search + thinking — อาจ 60-120 วิ)' : ''}</span></div>`;
    document.getElementById('survey-output-actions').hidden = true;

    try {
      const result = await BR_API.runSurvey({ personas, question, model, useSearch, useThinking });
      lastSurveyResult = { personas, question, model, useSearch, useThinking, ...result, ts: Date.now() };
      out.innerHTML = renderSurvey(lastSurveyResult);
      document.getElementById('survey-output-actions').hidden = false;
      toast(`Survey เสร็จ — ${personas.length} responses`, 'success');
    } catch (e) {
      console.error(e);
      out.innerHTML = `<div class="error-msg"><b>เกิดข้อผิดพลาด:</b><br>${escape(e.message)}</div>`;
    }
  }

  function renderSurvey(result) {
    const { personas, question, parsed, citations } = result;
    const p = parsed;

    const distRows = (p.overall_distribution || []).map(d => `
      <div class="dist-bar-row">
        <div class="dist-bar-label">${escape(d.option)}</div>
        <div class="dist-bar"><div class="dist-bar-fill" style="width:${d.percent}%;"></div></div>
        <div class="dist-bar-val">${d.percent}%${d.count !== undefined ? ` <small>(${d.count})</small>` : ''}</div>
      </div>
    `).join('');

    const stats = (p.average_statistics || []).map(s => `
      <div class="stat-card">
        <div class="stat-label">${escape(s.label)}</div>
        <div class="stat-value">${escape(String(s.value))}${s.unit ? ` <span style="font-size:.7em;color:var(--text-soft);">${escape(s.unit)}</span>` : ''}</div>
        ${s.note ? `<div class="muted small" style="margin-top:6px;">${escape(s.note)}</div>` : ''}
      </div>
    `).join('');

    const segs = (p.segment_insights || []).map(s => `
      <div class="segment-card">
        <h5>${escape(s.segment)}${s.n ? ` <small>(n=${s.n})</small>` : ''}</h5>
        <div class="seg-stat">${escape(String(s.position || ''))}</div>
        <div class="seg-note">${escape(s.insight || '')}</div>
      </div>
    `).join('');

    const perPersona = (p.per_persona || []).map(row => `
      <tr>
        <td><b>${escape(row.name)}</b></td>
        <td>${escape(String(row.position || ''))}</td>
        <td style="text-align:right;">${row.estimated_purchase_pct !== undefined ? row.estimated_purchase_pct + '%' : '—'}</td>
        <td>${escape(row.reason_th || '')}</td>
      </tr>
    `).join('');

    const themes = (p.top_themes || []).map(t => `<li>${escape(t)}</li>`).join('');
    const quotes = (p.top_quotes || []).map(q => `
      <div class="quote" style="margin:8px 0;"><b>${escape(q.persona)}:</b> "${escape(q.quote_th)}"</div>
    `).join('');
    const drivers = (p.key_drivers || []).map(d => `<li>${escape(d)}</li>`).join('');
    const barriers = (p.key_barriers || []).map(d => `<li>${escape(d)}</li>`).join('');
    const risks = (p.risks || []).map(d => `<li>${escape(d)}</li>`).join('');
    const opps = (p.opportunities || []).map(d => `<li>${escape(d)}</li>`).join('');
    const recs = (p.recommendations || []).map(d => `<li>${escape(d)}</li>`).join('');

    const cites = citations && citations.length ? `<div style="margin-top:12px;font-size:.8rem;">
      <b>🌐 Sources:</b> ${citations.map(c => `<a href="${escape(c.url)}" target="_blank" rel="noopener" class="search-citation">${escape(c.title.slice(0, 60))}</a>`).join(' ')}
    </div>` : '';

    return `
      <div class="report-header show-print">
        <h1>Multi-Persona Survey Report</h1>
        <p><b>Panel size:</b> ${personas.length} personas</p>
        <p><b>คำถาม:</b> ${escape(question)}</p>
        <p><b>Date:</b> ${new Date().toLocaleString('th-TH')}</p>
      </div>

      <div class="answer-block">
        <h3 style="margin-top:0;">📋 Executive Summary</h3>
        <p style="font-size:1.05rem;">${escape(p.summary || '')}</p>
      </div>

      ${p.predicted_satisfaction_score !== undefined ? `<div class="stat-grid">
        <div class="stat-card">
          <div class="stat-label">Predicted Satisfaction</div>
          <div class="stat-value">${p.predicted_satisfaction_score} <span style="font-size:.5em;color:var(--text-soft);">/10</span></div>
          <div class="stat-bar"><div class="stat-bar-fill" style="width:${p.predicted_satisfaction_score * 10}%;"></div></div>
          ${p.satisfaction_note ? `<div class="muted small" style="margin-top:6px;">${escape(p.satisfaction_note)}</div>` : ''}
        </div>
      </div>` : ''}

      ${distRows ? `<h3 style="margin-top:24px;">📊 Overall Distribution</h3>
        <div>${distRows}</div>` : ''}

      ${stats ? `<h3 style="margin-top:24px;">📈 Aggregate Statistics</h3>
        <div class="stat-grid">${stats}</div>` : ''}

      ${segs ? `<h3 style="margin-top:24px;">🎯 Segment Breakdown</h3>
        <div class="segment-grid">${segs}</div>` : ''}

      ${perPersona ? `<h3 style="margin-top:24px;">👥 Per-Persona Predictions</h3>
        <table style="width:100%; border-collapse:collapse; font-size:.85rem;">
          <thead><tr style="background:var(--surface-alt);">
            <th style="text-align:left; padding:8px;">Persona</th>
            <th style="text-align:left; padding:8px;">Position</th>
            <th style="text-align:right; padding:8px;">Purchase %</th>
            <th style="text-align:left; padding:8px;">Reasoning</th>
          </tr></thead>
          <tbody>${perPersona}</tbody>
        </table>` : ''}

      ${themes ? `<div class="opinion-block" style="margin-top:16px;">
        <h4>🔑 Top Themes</h4><ul class="suggestion-list">${themes}</ul>
      </div>` : ''}

      ${quotes ? `<div class="quotes-block" style="margin-top:16px;">
        <h4>💬 Representative Quotes</h4>${quotes}
      </div>` : ''}

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-top:16px;">
        ${drivers ? `<div class="opinion-block"><h4>✅ Drivers</h4><ul class="suggestion-list">${drivers}</ul></div>` : ''}
        ${barriers ? `<div class="opinion-block"><h4>⚠️ Barriers</h4><ul class="suggestion-list">${barriers}</ul></div>` : ''}
        ${opps ? `<div class="opinion-block"><h4>🚀 Opportunities</h4><ul class="suggestion-list">${opps}</ul></div>` : ''}
        ${risks ? `<div class="opinion-block"><h4>🚨 Risks</h4><ul class="suggestion-list">${risks}</ul></div>` : ''}
      </div>

      ${recs ? `<div class="suggestion-block" style="margin-top:16px;">
        <h4>💡 Recommendations</h4><ul class="suggestion-list">${recs}</ul>
      </div>` : ''}

      ${cites}
    `;
  }

  function init() {
    initModeSwitcher();
    initSingle();
    initSurvey();
    refreshPersonaSelect();
  }

  function escape(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  return { init, refreshPersonaSelect, getLastSingle: () => lastSingleResult, getLastSurvey: () => lastSurveyResult };
})();
