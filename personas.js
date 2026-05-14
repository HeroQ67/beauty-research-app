// personas.js — Persona CRUD, matrix form renderer, seed data
// Depends on: matrix.js, store.js

window.BR_PERSONAS = (function () {
  let activeId = null;

  // ===================== Seeds (4 example personas) =====================
  const seeds = [
    {
      id: 'seed-ice',
      name: 'ไอซ์ · Office Girl BKK',
      age: 27, gender: 'female', location: 'bkk',
      occupation: 'พนักงาน marketing บริษัทไทย',
      income: '30-50k', education: 'bachelor',
      responsibilities: ['single_no_burden', 'support_parents'],
      lifestyle: 'ออฟฟิศ 9-6 จันทร์-ศุกร์, คาเฟ่ฮอปปิ้งเสาร์, นอนยาวอาทิตย์. กิน clean 3 มื้อ/สัปดาห์',
      values: ['self-care', 'work-life balance', 'looking polished'],
      personality: ['planner', 'introvert', 'value-conscious'],
      social_media_hours: '3-5',
      skin_type: 'combo',
      skin_concerns: ['acne', 'pore', 'dull'],
      routine: 'เช้า: cleanser → toner → vit C serum → sunscreen\nเย็น: oil cleanse → cleanser → retinol (3x/wk) → moisturizer',
      monthly_budget: '1500-3000',
      current_brands: ['Cetaphil', 'La Roche-Posay', 'Innisfree'],
      purchase_channels: ['shopee', 'watsons', 'tiktok'],
      d_price: 8, d_review: 9, d_kol: 5, d_brand: 5, d_ingredient: 8, d_package: 4, d_promo: 9, d_clean: 6,
      triggers: ['payday', 'TikTok algorithm', 'หมดของ', 'ฤดูร้อนเหงื่อออก'],
      s_tiktok: 40, s_ig: 20, s_yt: 15, s_fb: 5, s_blog: 5, s_friend: 10, s_expert: 5,
      kols: ['นางสาวไอซ์', 'Soundtiss', 'beauty.derm'],
      pain_points: 'รูขุมขนกว้างขึ้นเรื่อยๆ แม้ใช้ niacinamide. กลัวซื้อของก๊อปใน Shopee แต่ counter แพงกว่า 50%',
      aspirations: 'ผิวเรียบเนียนแบบไม่ต้องลงรองพื้น, ดูสดใสตอนถ่ายรูปกับเพื่อน',
      brand_loved: ['Laneige', 'Beauty of Joseon'],
      brand_hated: ['แบรนด์ที่ใช้ดารามา hard sell แต่ของไม่มีผลจริง'],
      notes: '',
    },
    {
      id: 'seed-mint',
      name: 'มิ้น · Working Mom 35+',
      age: 36, gender: 'female', location: 'metro',
      occupation: 'Senior PM บริษัทเทค',
      income: '100-200k', education: 'master',
      responsibilities: ['married_no_kids', 'support_parents', 'household_main'],
      lifestyle: 'WFH, ประชุม Zoom ทั้งวัน, ออกกำลังกาย yoga 3x/wk, ทานข้าวนอกบ้าน 4x/wk',
      values: ['efficiency', 'quality over price', 'health'],
      personality: ['ambitious', 'analytical', 'time-poor'],
      social_media_hours: '1-3',
      skin_type: 'dry',
      skin_concerns: ['wrinkle', 'dark_spot', 'dull'],
      routine: 'เช้า: hydrating toner → peptide serum → moisturizer → sunscreen\nเย็น: double cleanse → retinol → moisturizer → eye cream',
      monthly_budget: '6000-12000',
      current_brands: ['SK-II', 'Skinceuticals', 'Drunk Elephant'],
      purchase_channels: ['counter', 'eveandboy', 'brand_dtc'],
      d_price: 3, d_review: 7, d_kol: 4, d_brand: 8, d_ingredient: 10, d_package: 6, d_promo: 4, d_clean: 7,
      triggers: ['ใกล้งานสำคัญ', 'หมอแนะนำ', 'ครีมตัวเก่าหมด'],
      s_tiktok: 5, s_ig: 30, s_yt: 10, s_fb: 5, s_blog: 10, s_friend: 15, s_expert: 25,
      kols: ['Caroline Hirons', 'derm clinics IG', 'Lab Muffin Beauty Science'],
      pain_points: 'ริ้วรอยร่องแก้มลึกขึ้น แม้ใช้ retinol 2 ปี. เริ่มสนใจ procedure แต่กลัวเสียหน้า',
      aspirations: 'ผิวดู rest well แม้นอนน้อย, ดูเด็กกว่าวัย 5-7 ปี',
      brand_loved: ['Augustinus Bader', 'La Mer'],
      brand_hated: ['DIY ลด price-positioning ไปอยู่ Shopee flash sale'],
      notes: 'ยอมจ่ายแพง แต่ต้องมี clinical evidence',
    },
    {
      id: 'seed-fai',
      name: 'ฝ้าย · Gen Z TikTok native',
      age: 21, gender: 'female', location: 'bkk',
      occupation: 'นักศึกษา + TikTok creator (5k followers)',
      income: 'lt15k', education: 'lt_bachelor',
      responsibilities: ['single_no_burden'],
      lifestyle: 'มหาลัย จ-ศ, TikTok creator ตอนเย็น, แฮงเอาท์เพื่อน 4-5x/wk',
      values: ['individuality', 'community', 'aesthetic'],
      personality: ['extrovert', 'spontaneous', 'trend-led'],
      social_media_hours: 'gt5',
      skin_type: 'oily',
      skin_concerns: ['acne', 'pore', 'redness'],
      routine: 'เช้า: cleanser → moisturizer → sunscreen\nเย็น: cleanser → serum (เปลี่ยนตาม trend)',
      monthly_budget: '500-1500',
      current_brands: ['CeraVe (TikTok bought)', 'Mistine', 'Innisfree'],
      purchase_channels: ['tiktok', 'shopee'],
      d_price: 10, d_review: 8, d_kol: 9, d_brand: 4, d_ingredient: 5, d_package: 8, d_promo: 10, d_clean: 5,
      triggers: ['TikTok viral', 'เพื่อน rec', 'flash sale', 'ก่อนถ่าย content'],
      s_tiktok: 65, s_ig: 15, s_yt: 5, s_fb: 0, s_blog: 0, s_friend: 12, s_expert: 3,
      kols: ['Hyram', 'thai TikTok beauty creators', 'Soundtiss'],
      pain_points: 'สิวขึ้นเป็นรอบ. ของหมดเร็วเพราะใช้ซ้ำกับเพื่อน. งบจำกัดแต่อยากลองของใหม่ตลอด',
      aspirations: 'ผิวใส glassy แบบ K-beauty, ได้รับ PR จากแบรนด์',
      brand_loved: ['Innisfree', 'Glow Recipe', 'Beauty of Joseon'],
      brand_hated: ['แบรนด์ที่ดู old-money mom'],
      notes: 'รักการลองของใหม่ — high churn',
    },
    {
      id: 'seed-jane',
      name: 'เจน · Status Seeker หรู',
      age: 42, gender: 'female', location: 'bkk',
      occupation: 'เจ้าของธุรกิจ event',
      income: 'gt200k', education: 'bachelor',
      responsibilities: ['married_no_kids', 'household_main', 'kids_grown'],
      lifestyle: 'meeting client หรู, fitness 4x/wk, สปา 2x/เดือน, เที่ยวต่างประเทศ 6-8 trip/ปี',
      values: ['status', 'exclusivity', 'craftsmanship'],
      personality: ['confident', 'social', 'detail-oriented'],
      social_media_hours: '1-3',
      skin_type: 'normal',
      skin_concerns: ['wrinkle', 'dark_spot'],
      routine: 'มี facialist ส่วนตัว. ใช้ La Mer + Sisley + เครื่อง LED',
      monthly_budget: 'gt12000',
      current_brands: ['La Mer', 'Sisley', 'Guerlain', 'Cle de Peau'],
      purchase_channels: ['counter', 'eveandboy', 'brand_dtc'],
      d_price: 1, d_review: 4, d_kol: 6, d_brand: 10, d_ingredient: 7, d_package: 10, d_promo: 1, d_clean: 8,
      triggers: ['Limited edition launch', 'เพื่อน in circle ใช้', 'งาน fashion week'],
      s_tiktok: 5, s_ig: 50, s_yt: 5, s_fb: 5, s_blog: 5, s_friend: 25, s_expert: 5,
      kols: ['Tatler', 'Vogue editors', 'fashion bloggers high-end'],
      pain_points: 'ของ limited edition ขาดตลาด. counter staff ไม่รู้จัก product line ใหม่',
      aspirations: 'เป็นที่หนึ่งใน circle เรื่องความรู้ beauty + skincare',
      brand_loved: ['La Mer', 'Hermès Beauty', 'Augustinus Bader'],
      brand_hated: ['mass market brands', 'TikTok-viral ของถูก'],
      notes: 'Budget ไม่ใช่ปัญหา — ต้อง make her feel special',
    },
  ];

  // ===================== CRUD =====================
  function getAll() { return BR_STORE.getPersonas(); }
  function save(list) { return BR_STORE.savePersonas(list); }

  function create(seed = {}) {
    const list = getAll();
    const p = Object.assign({ id: 'p_' + uid(), name: 'New Persona' }, seed);
    list.push(p);
    save(list);
    return p;
  }

  function remove(id) {
    const list = getAll().filter(p => p.id !== id);
    save(list);
    if (activeId === id) activeId = null;
  }

  function update(id, patch) {
    const list = getAll();
    const i = list.findIndex(p => p.id === id);
    if (i < 0) return null;
    list[i] = Object.assign({}, list[i], patch);
    save(list);
    return list[i];
  }

  function duplicate(id) {
    const p = getAll().find(x => x.id === id);
    if (!p) return null;
    const copy = JSON.parse(JSON.stringify(p));
    copy.id = 'p_' + uid();
    copy.name = (p.name || 'Persona') + ' (copy)';
    const list = getAll();
    list.push(copy);
    save(list);
    return copy;
  }

  function loadSeeds() {
    const current = getAll();
    const existingIds = new Set(current.map(p => p.id));
    const newOnes = seeds.filter(s => !existingIds.has(s.id));
    save(current.concat(newOnes));
    return newOnes.length;
  }

  // ===================== UI: Sidebar list =====================
  function renderSidebar() {
    const root = document.getElementById('persona-list');
    if (!root) return;
    const list = getAll();
    if (!list.length) {
      root.innerHTML = '<p class="muted small" style="padding:12px;">ยังไม่มี persona<br>กด + เพื่อสร้าง หรือ "Seed" เพื่อโหลดตัวอย่าง</p>';
      return;
    }
    root.innerHTML = list.map(p => {
      const sub = [p.age && `${p.age}y`, p.occupation].filter(Boolean).join(' · ');
      return `<div class="persona-card ${p.id === activeId ? 'active' : ''}" data-id="${p.id}">
        <h4>${escape(p.name || 'Unnamed')}</h4>
        ${sub ? `<p>${escape(sub)}</p>` : ''}
      </div>`;
    }).join('');
    root.querySelectorAll('.persona-card').forEach(el => {
      el.addEventListener('click', () => selectPersona(el.dataset.id));
    });
  }

  // ===================== UI: Form =====================
  function selectPersona(id) {
    activeId = id;
    BR_STORE.set(BR_STORE.KEYS.activePersona, id);
    renderSidebar();
    renderForm();
  }

  function renderForm() {
    const empty = document.getElementById('persona-empty');
    const form = document.getElementById('persona-form');
    const body = document.getElementById('persona-form-body');
    const title = document.getElementById('persona-form-title');
    if (!activeId) {
      empty.hidden = false;
      form.hidden = true;
      return;
    }
    const persona = getAll().find(p => p.id === activeId);
    if (!persona) { empty.hidden = false; form.hidden = true; activeId = null; return; }
    empty.hidden = true;
    form.hidden = false;
    title.textContent = `แก้ไข: ${persona.name || 'Unnamed'}`;

    body.innerHTML = BR_MATRIX.sections.map(sec => renderSection(sec, persona)).join('');

    // Bind all input types
    bindFormInputs(persona);
  }

  function renderSection(section, persona) {
    return `<div class="form-section" data-section="${section.id}">
      <div class="form-section-head">
        <span style="font-size:1.2rem;">${section.icon || ''}</span>
        <h3>${escape(section.label_th)} <span class="sec-en">/ ${escape(section.label_en)}</span></h3>
      </div>
      <div class="form-grid">
        ${section.fields.map(f => renderField(f, persona)).join('')}
      </div>
    </div>`;
  }

  function renderField(field, persona) {
    const val = persona[field.id];
    const label = `<span>${escape(field.label_th)} <small>· ${escape(field.label_en)}</small></span>`;
    const full = ['textarea', 'tags', 'multiselect'].includes(field.type) ? 'full' : '';
    let input = '';

    if (field.type === 'text' || field.type === 'number') {
      input = `<input type="${field.type}" id="f_${field.id}"
        value="${val !== undefined && val !== null ? escape(String(val)) : ''}"
        placeholder="${escape(field.placeholder || '')}"
        ${field.min !== undefined ? `min="${field.min}"` : ''}
        ${field.max !== undefined ? `max="${field.max}"` : ''}>`;
    } else if (field.type === 'select') {
      input = `<select id="f_${field.id}">
        <option value="">— เลือก —</option>
        ${field.options.map(o => `<option value="${escape(o.v)}" ${val === o.v ? 'selected' : ''}>${escape(o.label_th)} / ${escape(o.label_en)}</option>`).join('')}
      </select>`;
    } else if (field.type === 'multiselect') {
      const sel = new Set(Array.isArray(val) ? val : []);
      input = `<div class="multi-check" id="f_${field.id}">
        ${field.options.map(o => `
          <label class="${sel.has(o.v) ? 'checked' : ''}" data-v="${escape(o.v)}">
            <input type="checkbox" value="${escape(o.v)}" ${sel.has(o.v) ? 'checked' : ''}>
            ${escape(o.label_th)} / ${escape(o.label_en)}
          </label>
        `).join('')}
      </div>`;
    } else if (field.type === 'textarea') {
      input = `<textarea id="f_${field.id}" rows="${field.rows || 3}"
        placeholder="${escape(field.placeholder || '')}">${val ? escape(val) : ''}</textarea>`;
    } else if (field.type === 'tags') {
      const tags = Array.isArray(val) ? val : (val ? String(val).split(',').map(x => x.trim()).filter(Boolean) : []);
      input = `<div class="tag-input" id="f_${field.id}">
        ${tags.map(t => `<span class="tag-pill">${escape(t)}<span class="x" data-tag="${escape(t)}">✕</span></span>`).join('')}
        <input type="text" placeholder="${escape(field.placeholder || 'พิมพ์แล้วกด Enter')}">
      </div>`;
    } else if (field.type === 'slider') {
      const v = val !== undefined && val !== null && val !== '' ? Number(val) : (field.default ?? field.min ?? 0);
      input = `<div class="slider-row">
        <input type="range" id="f_${field.id}" min="${field.min}" max="${field.max}" step="${field.step || 1}" value="${v}">
        <span class="slider-val" id="fv_${field.id}">${v}</span>
      </div>`;
    }

    return `<label class="${full}" data-field="${field.id}">
      ${label}
      ${input}
    </label>`;
  }

  function bindFormInputs(persona) {
    // sliders: live update display
    BR_MATRIX.sections.flatMap(s => s.fields).forEach(field => {
      if (field.type === 'slider') {
        const el = document.getElementById('f_' + field.id);
        const out = document.getElementById('fv_' + field.id);
        if (el && out) el.addEventListener('input', () => { out.textContent = el.value; });
      }
      if (field.type === 'multiselect') {
        const root = document.getElementById('f_' + field.id);
        if (root) {
          root.querySelectorAll('label').forEach(lab => {
            const cb = lab.querySelector('input');
            cb.addEventListener('change', () => {
              lab.classList.toggle('checked', cb.checked);
            });
          });
        }
      }
      if (field.type === 'tags') {
        const root = document.getElementById('f_' + field.id);
        if (!root) return;
        const inp = root.querySelector('input');
        inp.addEventListener('keydown', e => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const v = inp.value.trim().replace(/,$/, '');
            if (v) addTag(root, v);
            inp.value = '';
          } else if (e.key === 'Backspace' && !inp.value) {
            const last = root.querySelectorAll('.tag-pill');
            if (last.length) last[last.length - 1].remove();
          }
        });
        root.querySelectorAll('.x').forEach(x => {
          x.addEventListener('click', () => x.parentElement.remove());
        });
        // also paste-as-CSV
        inp.addEventListener('paste', e => {
          const t = (e.clipboardData || window.clipboardData).getData('text');
          if (t && t.includes(',')) {
            e.preventDefault();
            t.split(',').map(x => x.trim()).filter(Boolean).forEach(v => addTag(root, v));
          }
        });
      }
    });
  }

  function addTag(root, value) {
    const pill = document.createElement('span');
    pill.className = 'tag-pill';
    pill.innerHTML = `${escape(value)}<span class="x">✕</span>`;
    pill.querySelector('.x').addEventListener('click', () => pill.remove());
    root.insertBefore(pill, root.querySelector('input'));
  }

  function collectForm() {
    if (!activeId) return null;
    const out = { id: activeId };
    BR_MATRIX.sections.forEach(sec => {
      sec.fields.forEach(field => {
        const id = 'f_' + field.id;
        if (field.type === 'text') {
          out[field.id] = document.getElementById(id).value.trim();
        } else if (field.type === 'number') {
          const v = document.getElementById(id).value;
          out[field.id] = v === '' ? null : Number(v);
        } else if (field.type === 'select') {
          out[field.id] = document.getElementById(id).value;
        } else if (field.type === 'multiselect') {
          out[field.id] = Array.from(document.querySelectorAll(`#${id} input:checked`)).map(c => c.value);
        } else if (field.type === 'textarea') {
          out[field.id] = document.getElementById(id).value;
        } else if (field.type === 'tags') {
          out[field.id] = Array.from(document.querySelectorAll(`#${id} .tag-pill`))
            .map(p => p.firstChild.textContent.trim()).filter(Boolean);
          // include the pending text in input if any
          const pending = document.querySelector(`#${id} input`).value.trim();
          if (pending) out[field.id].push(pending);
        } else if (field.type === 'slider') {
          out[field.id] = Number(document.getElementById(id).value);
        }
      });
    });
    return out;
  }

  // ===================== Lifecycle =====================
  function init() {
    activeId = BR_STORE.get(BR_STORE.KEYS.activePersona, null);
    renderSidebar();
    renderForm();

    document.getElementById('btn-new-persona').addEventListener('click', () => {
      const p = create();
      selectPersona(p.id);
      toast('สร้าง persona ใหม่แล้ว', 'success');
    });

    document.getElementById('btn-random-persona').addEventListener('click', () => {
      const seed = BR_GENERATOR.generate();
      const p = create(seed);
      selectPersona(p.id);
      toast(`🎲 สุ่ม persona: ${p.name}`, 'success');
    });

    document.getElementById('btn-seed-personas').addEventListener('click', () => {
      const n = loadSeeds();
      renderSidebar();
      toast(`โหลด seed ${n} คน`, 'success');
    });

    document.getElementById('btn-export-personas').addEventListener('click', () => {
      const data = JSON.stringify(getAll(), null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `personas_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });

    document.getElementById('btn-import-personas').addEventListener('click', () => {
      document.getElementById('file-import-personas').click();
    });
    document.getElementById('file-import-personas').addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        try {
          const arr = JSON.parse(ev.target.result);
          if (!Array.isArray(arr)) throw new Error('Expected array');
          // merge by id
          const existing = getAll();
          const map = new Map(existing.map(p => [p.id, p]));
          arr.forEach(p => { if (p.id) map.set(p.id, p); });
          save(Array.from(map.values()));
          renderSidebar();
          toast(`Import สำเร็จ ${arr.length} คน`, 'success');
        } catch (err) {
          toast('Import ผิดพลาด: ' + err.message, 'error');
        }
      };
      reader.readAsText(file);
    });

    document.getElementById('persona-form').addEventListener('submit', e => {
      e.preventDefault();
      const data = collectForm();
      if (!data) return;
      update(data.id, data);
      renderSidebar();
      toast('บันทึกแล้ว', 'success');
    });

    document.getElementById('btn-delete-persona').addEventListener('click', () => {
      if (!activeId) return;
      if (!confirm('ลบ persona นี้?')) return;
      remove(activeId);
      renderSidebar();
      renderForm();
      toast('ลบแล้ว');
    });

    document.getElementById('btn-duplicate-persona').addEventListener('click', () => {
      if (!activeId) return;
      const dup = duplicate(activeId);
      if (dup) { selectPersona(dup.id); toast('Duplicate แล้ว', 'success'); }
    });
  }

  function escape(s) {
    return String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  return { init, getAll, create, remove, update, duplicate, loadSeeds, selectPersona, renderSidebar, get activeId() { return activeId; } };
})();
