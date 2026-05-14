// generator.js — Weighted random persona generator
// Distributions calibrated against real Thai beauty consumer data:
// - Beauty buyer skew: female-dominant, age 18-45 (peak 22-35), urban-skewed
// - Income → budget correlation
// - Age → channel preference (Gen Z = TikTok, 35+ = counter)
// - Age → skin concerns (younger = acne, older = wrinkles)
// - Income → brand prestige driver
// - All values editable in the form after generation.

window.BR_GENERATOR = (function () {

  // ============ Helpers ============
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function rand(min, max) { return min + Math.random() * (max - min); }
  function randInt(min, max) { return Math.floor(rand(min, max + 1)); }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  // weightedPick: pass [{v, w}, ...] returns one .v
  function weightedPick(items) {
    const total = items.reduce((s, x) => s + x.w, 0);
    let r = Math.random() * total;
    for (const it of items) { r -= it.w; if (r <= 0) return it.v; }
    return items[items.length - 1].v;
  }

  // weightedSample: pick N distinct items
  function weightedSample(items, n) {
    const copy = items.map(x => Object.assign({}, x));
    const out = [];
    for (let i = 0; i < n && copy.length; i++) {
      const v = weightedPick(copy);
      out.push(v);
      const idx = copy.findIndex(x => x.v === v);
      if (idx >= 0) copy.splice(idx, 1);
    }
    return out;
  }

  // Random integer with normal-ish distribution (Box-Muller approx)
  function normalAge(mean, sd, min, max) {
    const u1 = Math.random(), u2 = Math.random();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return Math.round(clamp(mean + z * sd, min, max));
  }

  // ============ Name pools ============
  const NAMES = {
    female: ['มิ้น', 'ไอซ์', 'ฝ้าย', 'เจน', 'ส้ม', 'พีช', 'ปาล์ม', 'แพม', 'มายด์', 'นัท',
             'พลอย', 'แนน', 'อุ๋ม', 'นุ่น', 'ออม', 'แตงโม', 'ปุ้ย', 'ฟ้า', 'อาย', 'แอน',
             'แก้ม', 'นิว', 'มุก', 'ขนม', 'ไหม', 'น้ำ', 'หญิง', 'ตาล', 'จูน', 'จี๊บ'],
    male: ['เจ', 'ตี๋', 'บอย', 'แบงค์', 'ก๊อต', 'พีท', 'ปอนด์', 'อาร์ท', 'ภีม', 'พล',
           'ฟิล์ม', 'ตูน', 'นนท์', 'เอิร์ธ', 'มาร์ค', 'ไอซ์', 'แม็ก', 'นิว', 'เจมส์', 'อู๋'],
    nonbinary: ['อัน', 'เทรด', 'ฌอน', 'อิงค์', 'ทาม', 'ริน', 'แทน', 'นาวา'],
  };

  // ============ Occupation by age + income tier ============
  const OCCUPATIONS = {
    young: ['นักศึกษา ป.ตรี', 'TikTok creator', 'พนักงานร้านกาแฟ', 'freelance graphic designer', 'แม่ค้า online', 'พนักงานออฟฟิศ (junior)', 'พนักงานขายห้าง'],
    mid_low: ['พนักงานออฟฟิศ', 'พนักงานธนาคาร', 'พยาบาล', 'ครู', 'แม่ค้า online', 'เลขาผู้บริหาร', 'นักบัญชี', 'พนักงานต้อนรับ'],
    mid_high: ['Senior PM บริษัทเทค', 'Marketing manager', 'Brand manager', 'หัวหน้าฝ่ายขาย', 'แพทย์ general', 'ทนายความ', 'สถาปนิก', 'แม่บ้านทำธุรกิจ online'],
    high: ['เจ้าของธุรกิจ', 'Director บริษัท', 'แพทย์เฉพาะทาง', 'Investment banker', 'CEO startup', 'นักลงทุน', 'เจ้าของร้าน luxury', 'ผู้บริหารโรงแรม'],
  };

  // ============ Lifestyle / Values / Personality by segment ============
  const LIFESTYLE_TEMPLATES = {
    student: 'มหาลัย จ-ศ, แฮงเอาท์เพื่อน คาเฟ่, ดู Netflix ตอนดึก',
    office_young: 'ทำงาน 9-6, เลิกแล้วยิม/คาเฟ่, เสาร์อาทิตย์เที่ยวห้าง',
    office_busy: 'ทำงาน 9-7 + WFH บางวัน, ออกกำลังกายเย็น, นอนดึก',
    wfh_pro: 'WFH ประชุม Zoom ทั้งวัน, ยิม 3x/wk, ทานข้าวนอกบ้าน',
    business: 'meeting clients, fitness 4x/wk, spa 2x/เดือน, trip ตปท. 6-8x/ปี',
    homemaker: 'จัดการบ้าน + ธุรกิจ online ที่บ้าน, ดูแลครอบครัว',
  };

  const VALUES_POOL = [
    'self-care', 'work-life balance', 'family', 'success', 'aesthetic',
    'sustainability', 'authenticity', 'health', 'community', 'individuality',
    'efficiency', 'quality over price', 'status', 'exclusivity', 'craftsmanship',
    'looking polished', 'natural beauty', 'experimentation', 'tradition'
  ];

  const PERSONALITY_POOL = [
    'planner', 'spontaneous', 'introvert', 'extrovert', 'ambitious', 'analytical',
    'creative', 'detail-oriented', 'value-conscious', 'trend-led', 'risk-averse',
    'risk-taker', 'social', 'confident', 'ขี้เกรงใจ', 'จริงจัง', 'ชิลล์', 'fast decision-maker',
    'researcher', 'impulsive buyer'
  ];

  // ============ Brands pool by tier ============
  const BRANDS = {
    drugstore: ['Cetaphil', 'CeraVe', 'La Roche-Posay', 'Eucerin', 'Mistine', 'Smooth-E', 'BSC', 'Pond\'s'],
    mid: ['Innisfree', 'Laneige', 'Beauty of Joseon', 'Cosrx', 'Hada Labo', 'The Ordinary', 'Anessa', 'Biore'],
    premium: ['Estée Lauder', 'Clinique', 'Shiseido', 'Drunk Elephant', 'Skinceuticals', 'Sulwhasoo'],
    luxury: ['SK-II', 'La Mer', 'Sisley', 'Guerlain', 'Cle de Peau', 'Dior Beauty', 'Chanel Beauty', 'Augustinus Bader'],
  };

  const KOLS = {
    young: ['Hyram', 'นางสาวไอซ์', 'Soundtiss', 'Pearypie', 'thai TikTok beauty creators', 'beauty.derm', 'มิเชล kuky'],
    pro: ['Caroline Hirons', 'Lab Muffin Beauty Science', 'derm clinics IG', 'หมอผิวหนัง verified'],
    luxury: ['Tatler', 'Vogue editors', 'fashion bloggers high-end', 'celebrity dermatologists'],
  };

  // ============ Trigger moments ============
  const TRIGGERS_POOL = [
    'payday', 'TikTok algorithm', 'ของหมด', 'ฤดูร้อนเหงื่อออก', 'ก่อนงานสำคัญ',
    'หมอแนะนำ', 'เพื่อน rec', 'flash sale', 'ก่อนถ่าย content',
    'เปลี่ยนงาน', 'ก่อนงานแต่ง', 'อกหัก', 'ปีใหม่', 'birthday',
    'Limited edition launch', 'เพื่อนในกลุ่มใช้', 'หลังโบนัส'
  ];

  // ============ Core generator ============
  function generate() {
    // Step 1: Gender (beauty buyers in Thailand skew female ~85%)
    const gender = weightedPick([
      { v: 'female', w: 0.85 },
      { v: 'male', w: 0.10 },
      { v: 'nonbinary', w: 0.05 },
    ]);

    // Step 2: Age — peak beauty buyer 22-35, with long tail to 50+
    // Normal distribution centered on 30, sd 9
    const age = normalAge(30, 9, 16, 60);

    // Step 3: Income — biased by age (younger = lower) and overall distribution
    let incomeBuckets;
    if (age < 22) {
      incomeBuckets = [{ v: 'lt15k', w: 0.55 }, { v: '15-30k', w: 0.30 }, { v: '30-50k', w: 0.10 }, { v: '50-100k', w: 0.05 }];
    } else if (age < 30) {
      incomeBuckets = [{ v: 'lt15k', w: 0.10 }, { v: '15-30k', w: 0.40 }, { v: '30-50k', w: 0.30 }, { v: '50-100k', w: 0.15 }, { v: '100-200k', w: 0.05 }];
    } else if (age < 45) {
      incomeBuckets = [{ v: 'lt15k', w: 0.05 }, { v: '15-30k', w: 0.20 }, { v: '30-50k', w: 0.25 }, { v: '50-100k', w: 0.25 }, { v: '100-200k', w: 0.18 }, { v: 'gt200k', w: 0.07 }];
    } else {
      incomeBuckets = [{ v: '15-30k', w: 0.20 }, { v: '30-50k', w: 0.25 }, { v: '50-100k', w: 0.25 }, { v: '100-200k', w: 0.20 }, { v: 'gt200k', w: 0.10 }];
    }
    const income = weightedPick(incomeBuckets);
    const incomeTier = incomeTierOf(income); // 0=low, 1=mid-low, 2=mid-high, 3=high

    // Step 4: Location — beauty buyers urban-skewed
    const location = weightedPick([
      { v: 'bkk', w: 0.45 },
      { v: 'metro', w: 0.20 },
      { v: 'upcountry_main', w: 0.25 },
      { v: 'upcountry_other', w: 0.10 },
    ]);

    // Step 5: Education — correlated with income
    let education;
    if (incomeTier === 0) education = weightedPick([{ v: 'lt_bachelor', w: 0.5 }, { v: 'bachelor', w: 0.45 }, { v: 'master', w: 0.05 }]);
    else if (incomeTier === 1) education = weightedPick([{ v: 'lt_bachelor', w: 0.2 }, { v: 'bachelor', w: 0.65 }, { v: 'master', w: 0.15 }]);
    else if (incomeTier === 2) education = weightedPick([{ v: 'bachelor', w: 0.55 }, { v: 'master', w: 0.40 }, { v: 'phd', w: 0.05 }]);
    else education = weightedPick([{ v: 'bachelor', w: 0.40 }, { v: 'master', w: 0.50 }, { v: 'phd', w: 0.10 }]);

    // Step 6: Responsibilities — age-driven
    const respPool = [];
    if (age < 25) respPool.push({ v: 'single_no_burden', w: 0.7 });
    else if (age < 32) { respPool.push({ v: 'single_no_burden', w: 0.4 }); respPool.push({ v: 'married_no_kids', w: 0.3 }); respPool.push({ v: 'support_parents', w: 0.3 }); }
    else if (age < 45) { respPool.push({ v: 'married_no_kids', w: 0.25 }); respPool.push({ v: 'kids_small', w: 0.35 }); respPool.push({ v: 'support_parents', w: 0.25 }); respPool.push({ v: 'household_main', w: 0.15 }); }
    else { respPool.push({ v: 'kids_grown', w: 0.4 }); respPool.push({ v: 'support_parents', w: 0.3 }); respPool.push({ v: 'household_main', w: 0.3 }); }
    if (incomeTier === 0 || incomeTier === 1) respPool.push({ v: 'debt', w: 0.4 });
    const responsibilities = weightedSample(respPool, randInt(1, 2));

    // Step 7: Occupation — age + income
    let occList;
    if (age < 22) occList = OCCUPATIONS.young;
    else if (incomeTier <= 1) occList = OCCUPATIONS.mid_low;
    else if (incomeTier === 2) occList = OCCUPATIONS.mid_high;
    else occList = OCCUPATIONS.high;
    const occupation = pick(occList);

    // Step 8: Name + display
    const namePool = NAMES[gender] || NAMES.female;
    const nick = pick(namePool);
    const persona_archetype = archetypeLabel(age, incomeTier, gender);
    const name = `${nick} · ${persona_archetype}`;

    // Step 9: Lifestyle
    let lifestyle_key;
    if (age < 22) lifestyle_key = 'student';
    else if (age < 30 && incomeTier <= 1) lifestyle_key = 'office_young';
    else if (age < 40 && incomeTier <= 2) lifestyle_key = 'office_busy';
    else if (age < 45 && incomeTier >= 2) lifestyle_key = 'wfh_pro';
    else if (incomeTier === 3) lifestyle_key = 'business';
    else lifestyle_key = 'homemaker';
    const lifestyle = LIFESTYLE_TEMPLATES[lifestyle_key];

    // Step 10: Values + Personality (sample 3 each)
    const values = sampleN(VALUES_POOL, 3);
    const personality = sampleN(PERSONALITY_POOL, 3);

    // Step 11: Social media hours — younger = more
    let sm_hours;
    if (age < 22) sm_hours = weightedPick([{ v: '3-5', w: 0.5 }, { v: 'gt5', w: 0.4 }, { v: '1-3', w: 0.1 }]);
    else if (age < 30) sm_hours = weightedPick([{ v: '1-3', w: 0.35 }, { v: '3-5', w: 0.45 }, { v: 'gt5', w: 0.15 }, { v: 'lt1', w: 0.05 }]);
    else if (age < 45) sm_hours = weightedPick([{ v: '1-3', w: 0.5 }, { v: '3-5', w: 0.30 }, { v: 'lt1', w: 0.15 }, { v: 'gt5', w: 0.05 }]);
    else sm_hours = weightedPick([{ v: 'lt1', w: 0.4 }, { v: '1-3', w: 0.45 }, { v: '3-5', w: 0.15 }]);

    // Step 12: Skin type — roughly uniform with Thai-tropical bias toward oily/combo
    const skin_type = weightedPick([
      { v: 'oily', w: 0.30 }, { v: 'combo', w: 0.35 }, { v: 'dry', w: 0.12 },
      { v: 'sensitive', w: 0.15 }, { v: 'normal', w: 0.08 },
    ]);

    // Step 13: Skin concerns — age-correlated
    const concernPool = [];
    if (age < 30) { concernPool.push({ v: 'acne', w: 0.8 }); concernPool.push({ v: 'pore', w: 0.6 }); concernPool.push({ v: 'dull', w: 0.4 }); concernPool.push({ v: 'redness', w: 0.3 }); }
    else if (age < 40) { concernPool.push({ v: 'dark_spot', w: 0.7 }); concernPool.push({ v: 'pore', w: 0.5 }); concernPool.push({ v: 'dull', w: 0.5 }); concernPool.push({ v: 'wrinkle', w: 0.4 }); concernPool.push({ v: 'acne', w: 0.3 }); }
    else { concernPool.push({ v: 'wrinkle', w: 0.85 }); concernPool.push({ v: 'dark_spot', w: 0.7 }); concernPool.push({ v: 'dull', w: 0.4 }); }
    concernPool.push({ v: 'hair', w: 0.15 });
    concernPool.push({ v: 'body', w: 0.15 });
    const skin_concerns = weightedSample(concernPool, randInt(2, 4));

    // Step 14: Routine text — derived from age + tier
    const routine = makeRoutine(age, incomeTier, skin_concerns);

    // Step 15: Budget — strongly correlated with income
    const monthly_budget = budgetFromIncome(income);

    // Step 16: Current brands — tier-based
    let brand_tier;
    if (incomeTier === 0) brand_tier = ['drugstore', 'mid'];
    else if (incomeTier === 1) brand_tier = ['drugstore', 'mid'];
    else if (incomeTier === 2) brand_tier = ['mid', 'premium'];
    else brand_tier = ['premium', 'luxury'];
    const current_brands = [];
    brand_tier.forEach(t => current_brands.push(pick(BRANDS[t])));
    if (current_brands.length < 3) current_brands.push(pick(BRANDS[pick(brand_tier)]));

    // Step 17: Purchase channels — age + income driven
    const channels = [];
    if (age < 30) channels.push('tiktok');
    if (age < 35) channels.push('shopee');
    if (incomeTier >= 2 && Math.random() < 0.6) channels.push('counter');
    if (incomeTier >= 2 && Math.random() < 0.5) channels.push('eveandboy');
    if (Math.random() < 0.4) channels.push('watsons');
    if (incomeTier === 3 && Math.random() < 0.4) channels.push('brand_dtc');
    if (incomeTier >= 1 && Math.random() < 0.2) channels.push('derm');
    // De-dupe and ensure at least 1
    const purchase_channels = Array.from(new Set(channels.length ? channels : ['shopee']));

    // Step 18: Decision drivers — sliders 1-10
    // Younger + lower income → price/promo heavy. Higher income → brand/ingredient/clean.
    // Influencer-driven: young + heavy social.
    const isYoung = age < 28;
    const isHighIncome = incomeTier >= 2;
    const heavySocial = (sm_hours === '3-5' || sm_hours === 'gt5');
    const drivers = {
      d_price:      jitter(isHighIncome ? 3 : 8, 2),
      d_review:     jitter(7, 2),
      d_kol:        jitter(heavySocial ? 8 : 4, 2),
      d_brand:      jitter(isHighIncome ? 9 : 4, 2),
      d_ingredient: jitter(age > 30 ? 8 : 5, 2),
      d_package:    jitter(isYoung ? 7 : 5, 2),
      d_promo:      jitter(isHighIncome ? 3 : 8, 2),
      d_clean:      jitter(5, 2),
    };

    // Step 19: Triggers — sample 3-5
    const triggers = sampleN(TRIGGERS_POOL, randInt(3, 5));

    // Step 20: Information sources — must sum ~100
    const sources = sourceMix(age, incomeTier, heavySocial);

    // Step 21: KOLs
    const kol_pool = isYoung ? KOLS.young : (isHighIncome ? KOLS.luxury : KOLS.pro);
    const kols = sampleN(kol_pool, randInt(2, 3));

    // Step 22: Pain points + aspirations (templated by archetype)
    const pain_points = makePainPoints(age, skin_concerns, incomeTier);
    const aspirations = makeAspirations(age, incomeTier);

    // Step 23: Brand loved/hated
    const brand_loved = sampleN(brand_tier.flatMap(t => BRANDS[t]), 2);
    const brand_hated = isHighIncome ? ['แบรนด์ mass market โฆษณาเกินจริง'] : ['แบรนด์ที่ใช้ดารามา hard sell แต่ของไม่มีผลจริง'];

    // ===== Build object =====
    return {
      name,
      age, gender, location, occupation, income, education, responsibilities,
      lifestyle,
      values, personality,
      social_media_hours: sm_hours,
      skin_type, skin_concerns,
      routine, monthly_budget, current_brands,
      purchase_channels,
      ...drivers,
      triggers,
      ...sources,
      kols,
      pain_points, aspirations,
      brand_loved, brand_hated,
      notes: `🎲 Auto-generated · weighted by Thai beauty buyer statistics · แก้ไขได้ทุกฟิลด์`,
    };
  }

  // ============ Sub-builders ============
  function incomeTierOf(income) {
    return { 'lt15k': 0, '15-30k': 1, '30-50k': 1, '50-100k': 2, '100-200k': 2, 'gt200k': 3 }[income] ?? 1;
  }

  function archetypeLabel(age, tier, gender) {
    const genderLabel = gender === 'male' ? 'หนุ่ม' : (gender === 'nonbinary' ? '' : 'สาว');
    if (age < 22) return 'Gen Z นักศึกษา';
    if (age < 28 && tier <= 1) return `${genderLabel}ออฟฟิศ entry`;
    if (age < 35 && tier === 2) return `${genderLabel}ทำงาน mid-career`;
    if (age < 40 && tier === 3) return 'Pro รายได้สูง';
    if (age < 45) return `${genderLabel}ทำงาน 35+`;
    if (tier === 3) return 'Status Seeker หรู';
    return `${genderLabel}วัยกลางคน`;
  }

  function makeRoutine(age, tier, concerns) {
    const hasAcne = concerns.includes('acne');
    const hasWrinkle = concerns.includes('wrinkle');
    if (age < 25 && tier <= 1) {
      return 'เช้า: cleanser → moisturizer → sunscreen\nเย็น: cleanser → ' + (hasAcne ? 'BHA/salicylic' : 'serum') + ' → moisturizer';
    } else if (age < 35) {
      return 'เช้า: cleanser → toner → vit C/niacinamide serum → moisturizer → sunscreen\n' +
             'เย็น: oil cleanse → cleanser → ' + (hasWrinkle ? 'retinol' : 'BHA') + ' → moisturizer';
    } else {
      return 'เช้า: hydrating toner → peptide/antioxidant serum → moisturizer → sunscreen\n' +
             'เย็น: double cleanse → retinol/tretinoin → ceramide cream → eye cream';
    }
  }

  function budgetFromIncome(income) {
    const map = { 'lt15k': 'lt500', '15-30k': '500-1500', '30-50k': '1500-3000', '50-100k': '3000-6000', '100-200k': '6000-12000', 'gt200k': 'gt12000' };
    return map[income] || '1500-3000';
  }

  function jitter(base, range) {
    return clamp(Math.round(base + (Math.random() - 0.5) * range * 2), 1, 10);
  }

  function sampleN(arr, n) {
    const copy = arr.slice();
    const out = [];
    for (let i = 0; i < n && copy.length; i++) {
      const idx = Math.floor(Math.random() * copy.length);
      out.push(copy.splice(idx, 1)[0]);
    }
    return out;
  }

  // Source mix — must sum to ~100, weighted by age + social
  function sourceMix(age, tier, heavySocial) {
    // Start with base
    const buckets = {
      s_tiktok:  age < 25 ? 50 : (age < 35 ? 30 : 10),
      s_ig:      age < 35 ? 25 : 20,
      s_yt:      10,
      s_fb:      age > 35 ? 15 : 5,
      s_blog:    age > 30 ? 10 : 5,
      s_friend:  15,
      s_expert:  tier >= 2 ? 15 : 5,
    };
    // Add jitter
    Object.keys(buckets).forEach(k => { buckets[k] = clamp(Math.round(buckets[k] + (Math.random() - 0.5) * 10), 0, 80); });
    // Normalize to ~100
    let total = Object.values(buckets).reduce((s, v) => s + v, 0);
    if (total > 0) {
      Object.keys(buckets).forEach(k => { buckets[k] = Math.round(buckets[k] * 100 / total / 5) * 5; }); // round to 5
    }
    return buckets;
  }

  function makePainPoints(age, concerns, tier) {
    const parts = [];
    if (concerns.includes('acne')) parts.push('สิวขึ้นเป็นรอบ ลองครีมแล้วก็ไม่หาย');
    if (concerns.includes('wrinkle')) parts.push('ริ้วรอยร่องแก้มลึกขึ้น แม้ใช้ retinol');
    if (concerns.includes('dark_spot')) parts.push('ฝ้า/จุดด่างดำลบไม่ออก');
    if (concerns.includes('pore')) parts.push('รูขุมขนกว้างขึ้นเรื่อยๆ');
    if (tier <= 1) parts.push('งบจำกัด แต่อยากได้ของมีคุณภาพ');
    if (tier >= 2) parts.push('counter staff ไม่รู้ละเอียดเรื่อง ingredient');
    parts.push('กลัวซื้อของปลอม online');
    return sampleN(parts, Math.min(3, parts.length)).join('. ') + '.';
  }

  function makeAspirations(age, tier) {
    const opts = [];
    if (age < 30) opts.push('ผิวใส glassy แบบ K-beauty', 'ดูสดใส glow ในรูปทุกใบ');
    if (age >= 30 && age < 45) opts.push('ดูเด็กกว่าวัย 5-7 ปี', 'ผิวดูสุขภาพดีแม้ทำงานหนัก');
    if (age >= 45) opts.push('ผิวเรียบเนียน wrinkle ช้าลง', 'ดูอ่อนกว่าวัยอย่างเป็นธรรมชาติ');
    if (tier === 3) opts.push('เป็นคนหนึ่งในวงสังคมที่ "รู้" beauty ลึก', 'ใช้ของ limited edition');
    return sampleN(opts, 2).join(', ');
  }

  return { generate };
})();
