// Persona matrix schema (bilingual TH/EN)
// Defines the structure of every persona — used by personas.js to render the form
// and by api.js to serialize personas for the Claude prompt.

window.BR_MATRIX = {
  sections: [
    {
      id: 'profile',
      label_th: 'โปรไฟล์',
      label_en: 'Profile',
      icon: '👤',
      fields: [
        { id: 'name', type: 'text', label_th: 'ชื่อ Persona', label_en: 'Persona name', placeholder: 'เช่น คุณมิ้น สาวออฟฟิศกรุงเทพ', required: true },
        { id: 'age', type: 'number', label_th: 'อายุ', label_en: 'Age', placeholder: '28', min: 13, max: 80 },
        { id: 'gender', type: 'select', label_th: 'เพศ', label_en: 'Gender', options: [
          { v: 'female', label_th: 'หญิง', label_en: 'Female' },
          { v: 'male', label_th: 'ชาย', label_en: 'Male' },
          { v: 'nonbinary', label_th: 'Non-binary / LGBTQ+', label_en: 'Non-binary / LGBTQ+' },
        ]},
        { id: 'location', type: 'select', label_th: 'ที่อยู่', label_en: 'Location', options: [
          { v: 'bkk', label_th: 'กรุงเทพ', label_en: 'Bangkok' },
          { v: 'metro', label_th: 'ปริมณฑล', label_en: 'BKK Metro' },
          { v: 'upcountry_main', label_th: 'หัวเมืองใหญ่ ตจว.', label_en: 'Major upcountry' },
          { v: 'upcountry_other', label_th: 'ตจว.อื่นๆ', label_en: 'Other upcountry' },
        ]},
        { id: 'occupation', type: 'text', label_th: 'อาชีพ', label_en: 'Occupation', placeholder: 'พนักงานออฟฟิศ / เจ้าของกิจการ / นักศึกษา' },
        { id: 'income', type: 'select', label_th: 'รายได้/เดือน (บาท)', label_en: 'Monthly income (THB)', options: [
          { v: 'lt15k', label_th: 'น้อยกว่า 15,000', label_en: '< 15,000' },
          { v: '15-30k', label_th: '15,000-30,000', label_en: '15,000-30,000' },
          { v: '30-50k', label_th: '30,000-50,000', label_en: '30,000-50,000' },
          { v: '50-100k', label_th: '50,000-100,000', label_en: '50,000-100,000' },
          { v: '100-200k', label_th: '100,000-200,000', label_en: '100,000-200,000' },
          { v: 'gt200k', label_th: 'มากกว่า 200,000', label_en: '> 200,000' },
        ]},
        { id: 'education', type: 'select', label_th: 'การศึกษา', label_en: 'Education', options: [
          { v: 'lt_bachelor', label_th: 'ต่ำกว่าปริญญาตรี', label_en: 'Below bachelor' },
          { v: 'bachelor', label_th: 'ปริญญาตรี', label_en: "Bachelor's" },
          { v: 'master', label_th: 'ปริญญาโท', label_en: "Master's" },
          { v: 'phd', label_th: 'ปริญญาเอก', label_en: 'PhD' },
        ]},
        { id: 'responsibilities', type: 'multiselect', label_th: 'ภาระความรับผิดชอบ', label_en: 'Responsibilities', options: [
          { v: 'single_no_burden', label_th: 'โสด ไม่มีภาระ', label_en: 'Single, no dependents' },
          { v: 'support_parents', label_th: 'ดูแลพ่อแม่', label_en: 'Supporting parents' },
          { v: 'married_no_kids', label_th: 'แต่งงาน ไม่มีลูก', label_en: 'Married, no kids' },
          { v: 'kids_small', label_th: 'มีลูกเล็ก', label_en: 'Has young kids' },
          { v: 'kids_grown', label_th: 'มีลูกโต', label_en: 'Has grown kids' },
          { v: 'household_main', label_th: 'หาเลี้ยงครอบครัวหลัก', label_en: 'Main household earner' },
          { v: 'debt', label_th: 'มีหนี้สิน/ผ่อน', label_en: 'Loan/debt obligations' },
        ]},
      ],
    },

    {
      id: 'psycho',
      label_th: 'จิตวิทยา & ไลฟ์สไตล์',
      label_en: 'Psychographics & Lifestyle',
      icon: '🧠',
      fields: [
        { id: 'lifestyle', type: 'textarea', label_th: 'Lifestyle ในแต่ละวัน', label_en: 'Daily lifestyle', placeholder: 'ทำงาน 9-6 ออกกำลังกายเย็น เที่ยวเสาร์อาทิตย์...', rows: 3 },
        { id: 'values', type: 'tags', label_th: 'Values / ค่านิยมหลัก (top 3-5)', label_en: 'Core values', placeholder: 'self-care, family, success, sustainability' },
        { id: 'personality', type: 'tags', label_th: 'Personality traits', label_en: 'Personality traits', placeholder: 'introvert, ambitious, planner, ขี้เกรงใจ' },
        { id: 'social_media_hours', type: 'select', label_th: 'เวลาบน social media/วัน', label_en: 'Social media hours/day', options: [
          { v: 'lt1', label_th: 'น้อยกว่า 1 ชม.', label_en: '< 1 hr' },
          { v: '1-3', label_th: '1-3 ชม.', label_en: '1-3 hr' },
          { v: '3-5', label_th: '3-5 ชม.', label_en: '3-5 hr' },
          { v: 'gt5', label_th: 'มากกว่า 5 ชม.', label_en: '> 5 hr' },
        ]},
      ],
    },

    {
      id: 'beauty',
      label_th: 'พฤติกรรมความสวยความงาม',
      label_en: 'Beauty Behavior',
      icon: '💄',
      fields: [
        { id: 'skin_type', type: 'select', label_th: 'สภาพผิว', label_en: 'Skin type', options: [
          { v: 'oily', label_th: 'มัน', label_en: 'Oily' },
          { v: 'dry', label_th: 'แห้ง', label_en: 'Dry' },
          { v: 'combo', label_th: 'ผสม', label_en: 'Combination' },
          { v: 'sensitive', label_th: 'แพ้ง่าย/บอบบาง', label_en: 'Sensitive' },
          { v: 'normal', label_th: 'ปกติ', label_en: 'Normal' },
        ]},
        { id: 'skin_concerns', type: 'multiselect', label_th: 'ปัญหาผิว/หน้า', label_en: 'Skin concerns', options: [
          { v: 'acne', label_th: 'สิว', label_en: 'Acne' },
          { v: 'dark_spot', label_th: 'จุดด่างดำ/ฝ้า', label_en: 'Dark spots/melasma' },
          { v: 'wrinkle', label_th: 'ริ้วรอย', label_en: 'Wrinkles' },
          { v: 'pore', label_th: 'รูขุมขนกว้าง', label_en: 'Large pores' },
          { v: 'dull', label_th: 'ผิวหมองคล้ำ', label_en: 'Dullness' },
          { v: 'redness', label_th: 'แดง/ระคายเคือง', label_en: 'Redness' },
          { v: 'hair', label_th: 'ผม/หนังศีรษะ', label_en: 'Hair/scalp' },
          { v: 'body', label_th: 'ผิวกาย', label_en: 'Body skin' },
        ]},
        { id: 'routine', type: 'textarea', label_th: 'Routine ปัจจุบัน (เช้า/เย็น)', label_en: 'Current routine (AM/PM)', placeholder: 'เช้า: cleanser → toner → sunscreen\nเย็น: cleansing oil → cleanser → serum → moisturizer', rows: 3 },
        { id: 'monthly_budget', type: 'select', label_th: 'งบ beauty/เดือน (บาท)', label_en: 'Beauty budget/month (THB)', options: [
          { v: 'lt500', label_th: 'น้อยกว่า 500', label_en: '< 500' },
          { v: '500-1500', label_th: '500-1,500', label_en: '500-1,500' },
          { v: '1500-3000', label_th: '1,500-3,000', label_en: '1,500-3,000' },
          { v: '3000-6000', label_th: '3,000-6,000', label_en: '3,000-6,000' },
          { v: '6000-12000', label_th: '6,000-12,000', label_en: '6,000-12,000' },
          { v: 'gt12000', label_th: 'มากกว่า 12,000', label_en: '> 12,000' },
        ]},
        { id: 'current_brands', type: 'tags', label_th: 'แบรนด์ที่ใช้ปัจจุบัน', label_en: 'Current brands', placeholder: 'La Roche-Posay, Innisfree, Cetaphil' },
        { id: 'purchase_channels', type: 'multiselect', label_th: 'ช่องทางซื้อหลัก', label_en: 'Primary purchase channels', options: [
          { v: 'tiktok', label_th: 'TikTok Shop', label_en: 'TikTok Shop' },
          { v: 'shopee', label_th: 'Shopee', label_en: 'Shopee' },
          { v: 'lazada', label_th: 'Lazada', label_en: 'Lazada' },
          { v: 'counter', label_th: 'Counter ห้าง', label_en: 'Department counter' },
          { v: 'watsons', label_th: 'Watsons/Boots', label_en: 'Watsons/Boots' },
          { v: 'eveandboy', label_th: 'Eveandboy/Sephora', label_en: 'Eveandboy/Sephora' },
          { v: 'derm', label_th: 'คลินิก/แพทย์ผิวหนัง', label_en: 'Derm clinic' },
          { v: 'brand_dtc', label_th: 'เว็บแบรนด์โดยตรง', label_en: 'Brand DTC site' },
        ]},
      ],
    },

    {
      id: 'drivers',
      label_th: 'ปัจจัยตัดสินใจซื้อ (1=ไม่สำคัญ, 10=สำคัญมาก)',
      label_en: 'Decision Drivers (1=low, 10=high)',
      icon: '🎯',
      fields: [
        { id: 'd_price', type: 'slider', label_th: 'ราคา / Value for money', label_en: 'Price / Value for money', min: 1, max: 10, default: 5 },
        { id: 'd_review', type: 'slider', label_th: 'รีวิวผู้ใช้จริง', label_en: 'Real user reviews', min: 1, max: 10, default: 5 },
        { id: 'd_kol', type: 'slider', label_th: 'Influencer / KOL', label_en: 'Influencer / KOL', min: 1, max: 10, default: 5 },
        { id: 'd_brand', type: 'slider', label_th: 'ชื่อแบรนด์/ความน่าเชื่อถือ', label_en: 'Brand prestige/trust', min: 1, max: 10, default: 5 },
        { id: 'd_ingredient', type: 'slider', label_th: 'ส่วนผสม/วิทยาศาสตร์', label_en: 'Ingredients/science', min: 1, max: 10, default: 5 },
        { id: 'd_package', type: 'slider', label_th: 'แพคเกจ/หน้าตา', label_en: 'Packaging/aesthetic', min: 1, max: 10, default: 5 },
        { id: 'd_promo', type: 'slider', label_th: 'โปรโมชั่น/ส่วนลด', label_en: 'Promo/discount', min: 1, max: 10, default: 5 },
        { id: 'd_clean', type: 'slider', label_th: 'Clean beauty/sustainable', label_en: 'Clean beauty/sustainable', min: 1, max: 10, default: 5 },
        { id: 'triggers', type: 'tags', label_th: 'Trigger moments (เหตุการณ์ที่ทำให้ซื้อ)', label_en: 'Trigger moments', placeholder: 'เปลี่ยนงาน, ฤดูร้อน, ก่อนงานแต่ง, อกหัก, payday' },
      ],
    },

    {
      id: 'sources',
      label_th: 'แหล่งข้อมูล & KOLs',
      label_en: 'Information Sources & KOLs',
      icon: '📱',
      fields: [
        { id: 's_tiktok', type: 'slider', label_th: 'TikTok (สัดส่วนการรับข้อมูล %)', label_en: 'TikTok (% of info intake)', min: 0, max: 100, default: 0, step: 5 },
        { id: 's_ig', type: 'slider', label_th: 'Instagram', label_en: 'Instagram', min: 0, max: 100, default: 0, step: 5 },
        { id: 's_yt', type: 'slider', label_th: 'YouTube', label_en: 'YouTube', min: 0, max: 100, default: 0, step: 5 },
        { id: 's_fb', type: 'slider', label_th: 'Facebook / กลุ่ม', label_en: 'Facebook / Groups', min: 0, max: 100, default: 0, step: 5 },
        { id: 's_blog', type: 'slider', label_th: 'Blog / Pantip / Jeban', label_en: 'Blogs / forums', min: 0, max: 100, default: 0, step: 5 },
        { id: 's_friend', type: 'slider', label_th: 'เพื่อน/คนรู้จัก (word of mouth)', label_en: 'Word of mouth', min: 0, max: 100, default: 0, step: 5 },
        { id: 's_expert', type: 'slider', label_th: 'หมอผิวหนัง/ผู้เชี่ยวชาญ', label_en: 'Dermatologist/expert', min: 0, max: 100, default: 0, step: 5 },
        { id: 'kols', type: 'tags', label_th: 'KOL/Influencer ที่ตามอยู่', label_en: 'KOLs/Influencers followed', placeholder: 'นางสาวไอซ์, Pearypie, Soundtiss, beauty.derm' },
      ],
    },

    {
      id: 'pain_aspiration',
      label_th: 'Pain Points & Aspirations',
      label_en: 'Pain Points & Aspirations',
      icon: '💭',
      fields: [
        { id: 'pain_points', type: 'textarea', label_th: 'Pain points (ปัญหาที่ยังหาทางออกไม่ได้)', label_en: 'Pain points (unsolved problems)', placeholder: 'ใช้ครีมมาหลายตัวแต่ฝ้ายังขึ้น, ผิวมันแล้วลื่นใน 2 ชม., กลัวซื้อของปลอม', rows: 3 },
        { id: 'aspirations', type: 'textarea', label_th: 'Aspirations (อยากเป็น/อยากดูเหมือนใคร)', label_en: 'Aspirations (who they want to be)', placeholder: 'อยากดูเด็กกว่าวัย, อยาก glow แบบสาวเกาหลี, อยากให้คนทักว่าผิวดี', rows: 3 },
        { id: 'brand_loved', type: 'tags', label_th: 'แบรนด์/แคมเปญที่รัก (อ้างอิงรสนิยม)', label_en: 'Beloved brands/campaigns', placeholder: 'Glossier, Laneige, Dior Beauty' },
        { id: 'brand_hated', type: 'tags', label_th: 'แบรนด์/รูปแบบที่ไม่ชอบ', label_en: 'Disliked brands/styles', placeholder: 'แบรนด์ที่ใช้ดารามาเก่งโฆษณาแต่ของไม่ดี' },
      ],
    },

    {
      id: 'custom',
      label_th: 'ข้อมูลเพิ่มเติม (free-form)',
      label_en: 'Additional Notes (free-form)',
      icon: '📝',
      fields: [
        { id: 'notes', type: 'textarea', label_th: 'Notes อื่นๆ', label_en: 'Other notes', placeholder: 'อะไรก็ตามที่อยากให้ Claude รู้เพิ่ม', rows: 4 },
      ],
    },
  ],

  // Helper: serialize persona for the API prompt (compact human-readable)
  serializePersona(persona) {
    if (!persona) return '';
    const lines = [];
    for (const section of this.sections) {
      const sectionLines = [];
      for (const field of section.fields) {
        const val = persona[field.id];
        if (val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0)) continue;
        const label = field.label_en;
        let displayVal = val;
        if (field.type === 'select' && field.options) {
          const opt = field.options.find(o => o.v === val);
          if (opt) displayVal = opt.label_en;
        } else if (field.type === 'multiselect' && field.options) {
          displayVal = (Array.isArray(val) ? val : [val])
            .map(v => (field.options.find(o => o.v === v) || {}).label_en || v)
            .join(', ');
        } else if (field.type === 'tags' && Array.isArray(val)) {
          displayVal = val.join(', ');
        }
        sectionLines.push(`  ${label}: ${displayVal}`);
      }
      if (sectionLines.length) {
        lines.push(`[${section.label_en}]`);
        lines.push(...sectionLines);
      }
    }
    return lines.join('\n');
  },
};
