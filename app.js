/* Moneta — 로컬 우선 가계부 PWA (저장소 이름 salim-*은 기존 데이터 호환 위해 유지) */
(function () {
  'use strict';

  // ---------- 기본값 ----------
  const GROUPS = {
    fixed:    { name: '고정',      color: 'var(--g-fixed)',    spend: true },
    living:   { name: '생활',      color: 'var(--g-living)',   spend: true },
    reserve:  { name: '적립',      color: 'var(--g-reserve)',  spend: true },
    saving:   { name: '저축·투자', color: 'var(--g-saving)',   spend: false },
    income:   { name: '수입',      color: 'var(--g-income)',   spend: false },
    transfer: { name: '이체·제외', color: 'var(--g-transfer)', spend: false }
  };
  const TYPE_GROUPS = { expense: ['living', 'fixed', 'reserve'], income: ['income'], saving: ['saving'], transfer: ['transfer'] };

  const DEFAULT_CATS = [
    ['lv_food', '식비', 'living', 450000, ['배달', '외식', '카페·디저트', '장보기·편의점']],
    ['lv_life', '생활', 'living', 150000, ['생필품', '의료·약국', '기타']],
    ['lv_pocket', '용돈', 'living', 250000, ['쇼핑', '뷰티', '여가·문화', '도서', '앱결제', '선물']],
    ['fx_loan', '대출이자', 'fixed', 220000, []],
    ['fx_mgmt', '관리비', 'fixed', 130000, []],
    ['fx_util', '공과금', 'fixed', 10000, ['도시가스', '전기·수도']],
    ['fx_tel', '통신', 'fixed', 6050, []],
    ['fx_ins', '보험', 'fixed', 180000, []],
    ['fx_sub', '구독', 'fixed', 30000, ['AI·앱', 'OTT', '기타']],
    ['fx_trans', '교통', 'fixed', 100000, ['대중교통', '택시']],
    ['fx_dona', '기부', 'fixed', 80000, []],
    ['fx_gye', '모임계', 'fixed', 20000, []],
    ['rs_gym', '운동', 'reserve', 420000, ['PT', '기타운동']],
    ['rs_irr', '비정기', 'reserve', 300000, ['의료', '선물·경조사', '공연·문화', '가전·IT', '여행', '기타']],
    ['sv_youth', '청년도약', 'saving', 700000, []],
    ['sv_house', '주택청약', 'saving', 20000, []],
    ['sv_pension', '연금저축', 'saving', 500000, []],
    ['sv_isa', 'ISA', 'saving', 584000, []],
    ['in_salary', '급여', 'income', 0, []],
    ['in_bonus', '성과급', 'income', 0, []],
    ['in_welfare', '복지포인트', 'income', 0, []],
    ['in_etc', '기타수입', 'income', 0, ['환급·캐시백', '중고판매', '정산받음', '기타']],
    ['tr_card', '카드대금', 'transfer', 0, []],
    ['tr_self', '내 계좌 이체', 'transfer', 0, []],
    ['tr_settle', '정산·송금', 'transfer', 0, []]
  ];

  const DEFAULT_METHODS = [
    ['m_money', '머니카드', 'check'],
    ['m_shinhan', '신한 신용', 'credit'],
    ['m_woori', '우리 교통', 'credit'],
    ['m_welfare', '복지카드', 'credit'],
    ['m_hana', '하나 이체', 'transfer'],
    ['m_ibk', '기업 이체', 'transfer'],
    ['m_irr', '우리(비정기) 이체', 'transfer'],
    ['m_moneyacct', '머니통장 이체', 'transfer'],
    ['m_cash', '현금', 'cash']
  ];

  // [키워드, 카테고리, 하위]  위에서부터 먼저 맞는 규칙 적용
  const DEFAULT_RULES = [
    ['쿠팡이츠', 'lv_food', '배달'], ['우아한형제들', 'lv_food', '배달'], ['배달의민족', 'lv_food', '배달'], ['요기요', 'lv_food', '배달'],
    ['OPENAI', 'fx_sub', 'AI·앱'], ['CHATGPT', 'fx_sub', 'AI·앱'], ['ANTHROPIC', 'fx_sub', 'AI·앱'], ['CLAUDE', 'fx_sub', 'AI·앱'],
    ['Prime Video', 'fx_sub', 'OTT'], ['NETFLIX', 'fx_sub', 'OTT'], ['넷플릭스', 'fx_sub', 'OTT'], ['유튜브', 'fx_sub', 'OTT'], ['티빙', 'fx_sub', 'OTT'],
    ['도시가스', 'fx_util', '도시가스'], ['텔레콤', 'fx_tel', ''],
    ['멜론티켓', 'rs_irr', '공연·문화'], ['인터파크', 'rs_irr', '공연·문화'], ['트래블월렛', 'rs_irr', '여행'],
    ['주식회사 카카오', 'rs_irr', '선물·경조사'],
    ['필라테스', 'rs_gym', 'PT'], ['밸런스홈', 'rs_gym', 'PT'], ['피트니스', 'rs_gym', 'PT'],
    ['커피', 'lv_food', '카페·디저트'], ['카페', 'lv_food', '카페·디저트'], ['폴바셋', 'lv_food', '카페·디저트'], ['할리스', 'lv_food', '카페·디저트'],
    ['투썸', 'lv_food', '카페·디저트'], ['공차', 'lv_food', '카페·디저트'], ['에스씨케이', 'lv_food', '카페·디저트'], ['스타벅스', 'lv_food', '카페·디저트'],
    ['에스프레소', 'lv_food', '카페·디저트'], ['베이커리', 'lv_food', '카페·디저트'], ['쁘띠정동', 'lv_food', '카페·디저트'],
    ['GS25', 'lv_food', '장보기·편의점'], ['이마트24', 'lv_food', '장보기·편의점'], ['씨유', 'lv_food', '장보기·편의점'], ['세븐일레븐', 'lv_food', '장보기·편의점'],
    ['하나로마트', 'lv_food', '장보기·편의점'], ['제로스토어', 'lv_food', '장보기·편의점'], ['컬리', 'lv_food', '장보기·편의점'], ['농라', 'lv_food', '장보기·편의점'],
    ['이마트', 'lv_food', '장보기·편의점'], ['홈플러스', 'lv_food', '장보기·편의점'],
    ['맥도날드', 'lv_food', '외식'], ['김밥', 'lv_food', '외식'], ['우동', 'lv_food', '외식'], ['식당', 'lv_food', '외식'], ['곱창', 'lv_food', '외식'], ['버거', 'lv_food', '외식'],
    ['다이소', 'lv_life', '생필품'],
    ['약국', 'lv_life', '의료·약국'], ['의원', 'lv_life', '의료·약국'], ['의윈', 'lv_life', '의료·약국'], ['병원', 'lv_life', '의료·약국'], ['이비인후과', 'lv_life', '의료·약국'],
    ['외과', 'lv_life', '의료·약국'], ['내과', 'lv_life', '의료·약국'], ['피부과', 'lv_life', '의료·약국'], ['치과', 'lv_life', '의료·약국'], ['한의원', 'lv_life', '의료·약국'],
    ['카카오T', 'fx_trans', '택시'], ['택시', 'fx_trans', '택시'], ['고속버스', 'fx_trans', '대중교통'], ['티머니', 'fx_trans', '대중교통'], ['코레일', 'fx_trans', '대중교통'],
    ['아모레', 'lv_pocket', '뷰티'], ['올리브영', 'lv_pocket', '뷰티'],
    ['리디', 'lv_pocket', '도서'], ['알라딘', 'lv_pocket', '도서'], ['교보문고', 'lv_pocket', '도서'], ['예스24', 'lv_pocket', '도서'],
    ['워프스페이스', 'lv_pocket', '앱결제'],
    ['PC', 'lv_pocket', '여가·문화'], ['뮤지엄', 'lv_pocket', '여가·문화'], ['CGV', 'lv_pocket', '여가·문화'], ['메가박스', 'lv_pocket', '여가·문화'], ['동행복권', 'lv_pocket', '여가·문화'],
    ['롯데쇼핑', 'lv_pocket', '쇼핑'], ['현대백화점', 'lv_pocket', '쇼핑'], ['신세계', 'lv_pocket', '쇼핑'], ['아이파크몰', 'lv_pocket', '쇼핑'],
    ['쿠팡', 'lv_pocket', '쇼핑'], ['네이버페이', 'lv_pocket', '쇼핑'], ['당근', 'lv_pocket', '쇼핑'], ['Amazon', 'lv_pocket', '쇼핑'], ['AMAZON', 'lv_pocket', '쇼핑'],
    ['에이에이치', 'lv_pocket', '쇼핑'], ['11번가', 'lv_pocket', '쇼핑'], ['G마켓', 'lv_pocket', '쇼핑'],
    // 통장 내역 전용
    ['롯손', 'fx_ins', ''], ['DB손', 'fx_ins', ''], ['손해보험', 'fx_ins', ''], ['생명', 'fx_ins', ''],
    ['고보협', 'fx_dona', ''], ['나비야', 'fx_dona', ''],
    ['신한카드', 'tr_card', ''], ['우리카드결제', 'tr_card', ''], ['삼성카드', 'tr_card', ''], ['현대카드', 'tr_card', ''], ['KB카드', 'tr_card', ''], ['카드결제', 'tr_card', ''],
    ['급여', 'in_salary', ''], ['캐시백', 'in_etc', '환급·캐시백'], ['포인트', 'in_etc', '환급·캐시백'], ['환불', 'in_etc', '환급·캐시백']
  ];
  // 반복 기록: [이름, 카테고리, 하위, 금액, 매월 일, 결제수단, 'fixed'=확정 | 'estimate'=예정(금액 확인 필요)]
  const DEFAULT_RECURRING = [
    ['급여', 'in_salary', '', 4150000, 20, 'm_hana', 'estimate'],
    ['나비야사랑해', 'fx_dona', '', 30000, 1, 'm_hana', 'fixed'],
    ['모임계', 'fx_gye', '', 20000, 1, 'm_hana', 'fixed'],
    ['전세대출 이자', 'fx_loan', '', 220000, 12, 'm_hana', 'estimate'],
    ['우리카드 교통', 'fx_trans', '대중교통', 100000, 14, 'm_woori', 'estimate'],
    ['통신비', 'fx_tel', '', 6050, 15, 'm_shinhan', 'estimate'],
    ['도시가스', 'fx_util', '도시가스', 10000, 19, 'm_shinhan', 'estimate'],
    ['DB손해보험', 'fx_ins', '', 30880, 21, 'm_hana', 'fixed'],
    ['DB손해보험(2)', 'fx_ins', '', 14220, 21, 'm_hana', 'estimate'],
    ['관리비(다빈치)', 'fx_mgmt', '', 25000, 21, 'm_hana', 'estimate'],
    ['청년도약계좌', 'sv_youth', '', 700000, 21, 'm_ibk', 'fixed'],
    ['주택청약', 'sv_house', '', 20000, 21, 'm_hana', 'fixed'],
    ['연금저축', 'sv_pension', '', 500000, 21, 'm_hana', 'fixed'],
    ['ISA', 'sv_isa', '', 584000, 21, 'm_hana', 'fixed'],
    ['관리비', 'fx_mgmt', '', 100000, 22, 'm_hana', 'fixed'],
    ['롯데손해보험', 'fx_ins', '', 134012, 26, 'm_hana', 'fixed'],
    ['고보협', 'fx_dona', '', 50000, 26, 'm_hana', 'fixed']
  ];
  const defaultRecurring = (startYm) => DEFAULT_RECURRING.map(([name, c, sub, amount, day, m, mode]) => ({ id: 'rc_' + c + '_' + day + '_' + name.length, name, cat: c, sub, amount, day, method: m, mode, active: true, startYm, updatedAt: 1 }));

  // 수입 행에서만 쓰는 규칙 대상 / 출금 행에서만 쓰는 대상
  const INCOME_ONLY = new Set(['in_salary', 'in_etc', 'in_bonus', 'in_welfare']);

  // ---------- 유틸 ----------
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const won = n => (Math.round(n) || 0).toLocaleString('ko-KR');
  const man = n => { const v = n / 10000; return (Math.abs(v) >= 100 ? Math.round(v) : Math.round(v * 10) / 10).toLocaleString('ko-KR') + '만'; };
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const now = () => Date.now();
  const pad = n => String(n).padStart(2, '0');
  const ymd = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const todayStr = () => ymd(new Date());

  function toast(msg) {
    const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; t.setAttribute('role', 'status');
    document.body.appendChild(t); setTimeout(() => t.remove(), 2400);
  }

  // ---------- 저장소 (IndexedDB, 실패 시 localStorage) ----------
  const DB_NAME = 'salim-ledger', STORE = 'kv';
  function idb() {
    return new Promise((res, rej) => {
      try {
        const r = indexedDB.open(DB_NAME, 1);
        r.onupgradeneeded = () => r.result.createObjectStore(STORE);
        r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
      } catch (e) { rej(e); }
    });
  }
  async function kvGet(k) {
    try { const db = await idb(); return await new Promise((res, rej) => { const q = db.transaction(STORE).objectStore(STORE).get(k); q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); }); }
    catch (e) { try { const v = localStorage.getItem(DB_NAME + ':' + k); return v ? JSON.parse(v) : undefined; } catch (e2) { return undefined; } }
  }
  async function kvSet(k, v) {
    try { const db = await idb(); await new Promise((res, rej) => { const t = db.transaction(STORE, 'readwrite'); t.objectStore(STORE).put(v, k); t.oncomplete = res; t.onerror = () => rej(t.error); }); }
    catch (e) { try { localStorage.setItem(DB_NAME + ':' + k, JSON.stringify(v)); } catch (e2) {} }
  }

  // ---------- 상태 ----------
  let S = null;      // 동기화되는 데이터
  let L = null;      // 이 기기에만 있는 설정
  const UI = { tab: 'home', ym: null, filter: 'all', q: '', importRows: null };

  function freshState() {
    const t = now();
    return {
      v: 1,
      cats: DEFAULT_CATS.map(([id, name, group, budget, subs], i) => ({ id, name, group, budget, subs, order: i, updatedAt: t })),
      methods: DEFAULT_METHODS.map(([id, name, kind], i) => ({ id, name, kind, order: i, updatedAt: t })),
      rules: [],   // 사용자 규칙 (기본 규칙보다 먼저 적용)
      recurring: defaultRecurring(todayStr().slice(0, 7)),
      tx: [],
      settings: { startDay: 1, myName: '', reserveStart: todayStr().slice(0, 7), reserveOpening: { rs_gym: 0, rs_irr: 0 }, updatedAt: t }
    };
  }

  async function load() {
    S = (await kvGet('state')) || freshState();
    L = (await kvGet('local')) || { deviceId: uid(), clientId: '', lastSync: 0 };
    // 새 기본 카테고리가 추가된 경우 보충
    if (!S.recurring) S.recurring = defaultRecurring(todayStr().slice(0, 7));
    const have = new Set(S.cats.map(c => c.id));
    DEFAULT_CATS.forEach(([id, name, group, budget, subs], i) => { if (!have.has(id)) S.cats.push({ id, name, group, budget, subs, order: i, updatedAt: now() }); });
  }
  let saveTimer = null;
  function persist(changed = true) {
    kvSet('state', S);
    if (changed) { clearTimeout(saveTimer); saveTimer = setTimeout(() => Sync.auto(), 2500); }
  }
  function saveLocal() { kvSet('local', L); }

  const cat = id => S.cats.find(c => c.id === id);
  const method = id => S.methods.find(m => m.id === id);
  const liveTx = () => S.tx.filter(t => !t.deleted);
  const catsOf = groups => S.cats.filter(c => !c.deleted && groups.includes(c.group)).sort((a, b) => a.order - b.order);

  // ---------- 기간 ----------
  function period(ym) {
    const [y, m] = ym.split('-').map(Number);
    const sd = Math.min(Math.max(parseInt(S.settings.startDay, 10) || 1, 1), 28);
    const start = new Date(y, m - 1, sd);
    const end = new Date(y, m, sd - 1);
    return { start: ymd(start), end: ymd(end), days: Math.round((end - start) / 864e5) + 1, startD: start };
  }
  function curYm() {
    const d = new Date(); const sd = parseInt(S.settings.startDay, 10) || 1;
    if (d.getDate() < sd) d.setMonth(d.getMonth() - 1);
    return d.getFullYear() + '-' + pad(d.getMonth() + 1);
  }
  function shiftYm(ym, k) { const [y, m] = ym.split('-').map(Number); const d = new Date(y, m - 1 + k, 1); return d.getFullYear() + '-' + pad(d.getMonth() + 1); }
  const inPeriod = (t, p) => t.date >= p.start && t.date <= p.end;

  // ---------- 분류 ----------
  function classify(text, dir) {
    const s = String(text || '');
    const all = S.rules.filter(r => !r.deleted).map(r => [r.kw, r.cat, r.sub]).concat(DEFAULT_RULES);
    for (const [kw, c, sub] of all) {
      if (!kw || !s.toUpperCase().includes(String(kw).toUpperCase())) continue;
      const g = cat(c) && cat(c).group;
      if (dir === 'in' && g !== 'income' && g !== 'transfer') continue;
      if (dir === 'out' && INCOME_ONLY.has(c)) continue;
      return { cat: c, sub: sub || '' };
    }
    return null;
  }

  // ---------- 가져오기 파서 ----------
  function cellStr(v) { return v == null ? '' : String(v).trim(); }
  function parseAmount(v) { if (typeof v === 'number') return v; const n = Number(String(v || '').replace(/[,\s원]/g, '')); return isNaN(n) ? 0 : n; }
  function parseDate(v) {
    if (typeof v === 'number' && v > 20000 && v < 80000) {
      const d = new Date(Math.round((v - 25569) * 864e5)); const t = new Date(d.getTime() + d.getTimezoneOffset() * 6e4);
      return { date: ymd(t), time: pad(t.getHours()) + ':' + pad(t.getMinutes()) };
    }
    const m = /(\d{4})[.\-/년\s]*(\d{1,2})[.\-/월\s]*(\d{1,2})[^\d]*(?:(\d{1,2}):(\d{2}))?/.exec(String(v || ''));
    if (!m) return null;
    return { date: m[1] + '-' + pad(m[2]) + '-' + pad(m[3]), time: m[4] ? pad(m[4]) + ':' + m[5] : '' };
  }
  function findHeader(rows, need) {
    for (let i = 0; i < Math.min(rows.length, 20); i++) {
      const r = (rows[i] || []).map(cellStr);
      if (need.every(alts => alts.some(a => r.some(c => c.replace(/\s/g, '') === a)))) return { idx: i, cols: r };
    }
    return null;
  }
  const colOf = (cols, names) => { for (const n of names) { const i = cols.findIndex(c => c.replace(/\s/g, '') === n); if (i >= 0) return i; } return -1; };

  function parseImport(rows) {
    // 카드 이용내역
    let h = findHeader(rows, [['가맹점명', '이용가맹점', '가맹점', '이용하신곳'], ['금액', '이용금액', '결제금액', '승인금액'], ['거래일', '이용일', '이용일자', '거래일자', '승인일자', '이용일시']]);
    if (h) {
      const c = h.cols;
      const iD = colOf(c, ['거래일', '이용일', '이용일자', '거래일자', '승인일자', '이용일시']);
      const iM = colOf(c, ['가맹점명', '이용가맹점', '가맹점', '이용하신곳']);
      const iA = colOf(c, ['금액', '이용금액', '결제금액', '승인금액']);
      const iN = colOf(c, ['승인번호']);
      const iC = colOf(c, ['취소상태', '취소여부']);
      const out = [];
      for (const r of rows.slice(h.idx + 1)) {
        const dt = parseDate(r[iD]); if (!dt) continue;
        const merchant = cellStr(r[iM]); let amt = parseAmount(r[iA]);
        if (!merchant && !amt) continue;
        const cancel = iC >= 0 && /취소/.test(cellStr(r[iC]));
        if (cancel && amt > 0) amt = -amt;
        const k = classify(merchant, 'out');
        out.push({ date: dt.date, time: dt.time, merchant, amount: amt, dir: 'out', cat: k ? k.cat : '', sub: k ? k.sub : '',
          key: ['card', dt.date, dt.time, merchant, amt, iN >= 0 ? cellStr(r[iN]) : ''].join('|') });
      }
      return { kind: 'card', label: '카드 이용내역', rows: out, defaultMethod: 'm_shinhan' };
    }
    // 은행 거래내역
    h = findHeader(rows, [['출금', '출금액', '찾으신금액', '출금금액'], ['입금', '입금액', '맡기신금액', '입금금액'], ['거래일시', '거래일', '거래일자']]);
    if (h) {
      const c = h.cols;
      const iD = colOf(c, ['거래일시', '거래일', '거래일자']);
      const iT = colOf(c, ['거래시간']);
      const iO = colOf(c, ['출금', '출금액', '찾으신금액', '출금금액']);
      const iI = colOf(c, ['입금', '입금액', '맡기신금액', '입금금액']);
      const iB = colOf(c, ['거래후잔액', '잔액', '거래후잔고']);
      const iDesc = colOf(c, ['거래내용', '적요', '내용', '기재내용']);
      const iWho = colOf(c, ['상대계좌예금주명', '받는분', '보낸분', '예금주명', '거래점']);
      const iMemo = colOf(c, ['송금메시지', '메모']);
      const me = (S.settings.myName || '').trim();
      const out = [];
      for (const r of rows.slice(h.idx + 1)) {
        const dt = parseDate(cellStr(r[iD]) + (iT >= 0 ? ' ' + cellStr(r[iT]) : '')); if (!dt) continue;
        const o = parseAmount(r[iO]), inc = parseAmount(r[iI]);
        if (!o && !inc) continue;
        const desc = cellStr(r[iDesc]), who = iWho >= 0 ? cellStr(r[iWho]) : '';
        const merchant = desc || who;
        const text = desc + ' ' + who + ' ' + (iMemo >= 0 ? cellStr(r[iMemo]) : '');
        const dir = o ? 'out' : 'in';
        let k = null;
        if (me && (desc.includes(me) || who.replace(/\s/g, '').includes(me)) && !/급여/.test(desc)) k = { cat: 'tr_self', sub: '' };
        if (!k) k = classify(text, dir);
        if (!k && dir === 'in') k = { cat: 'in_etc', sub: '기타' };
        if (dir === 'in' && inc <= 10) k = { cat: 'tr_self', sub: '' };   // 1원 인증 등
        out.push({ date: dt.date, time: dt.time, merchant, memo: who && who !== desc ? who : '', amount: o || inc, dir, cat: k ? k.cat : '', sub: k ? k.sub : '',
          key: ['bank', dt.date, dt.time, merchant, o, inc, iB >= 0 ? cellStr(r[iB]) : ''].join('|') });
      }
      return { kind: 'bank', label: '통장 거래내역', rows: out, defaultMethod: 'm_ibk' };
    }
    throw new Error('형식을 알아보지 못했어요. 카드 이용내역(가맹점명·금액·거래일) 또는 통장 거래내역(출금·입금·거래일시) 엑셀을 올려주세요.');
  }

  // ---------- 반복 기록 생성 ----------
  function monthDate(ym, day) { const [y, m] = ym.split('-').map(Number); const last = new Date(y, m, 0).getDate(); return ym + '-' + pad(Math.min(day, last)); }
  function generateRecurring() {
    const today = todayStr(); const thisYm = today.slice(0, 7);
    const byId = new Set(S.tx.map(t => t.id));
    let n = 0;
    for (const r of (S.recurring || [])) {
      if (r.deleted || !r.active) continue;
      for (let ym = r.startYm || thisYm; ym <= thisYm; ym = shiftYm(ym, 1)) {
        const date = monthDate(ym, r.day);
        if (date > today) break;
        const id = 'r_' + r.id + '_' + ym;          // 기기마다 같은 ID → 동기화 시 중복 없음
        if (byId.has(id)) continue;
        const ts = new Date(date).getTime();        // 고정 타임스탬프 → 사용자가 고치거나 지운 쪽이 항상 이김
        S.tx.push({ id, recurId: r.id, recurYm: ym, source: 'recurring', pending: r.mode === 'estimate', createdAt: ts, updatedAt: ts,
          date, time: '', merchant: r.name, memo: '', amount: r.amount, cat: r.cat, sub: r.sub || '', method: r.method });
        byId.add(id); n++;
      }
    }
    if (n) persist();
    return n;
  }
  // 가져온 실제 내역과 반복 기록 맞추기: 같은 카테고리(수입은 수입끼리) + 날짜 ±10일 + 금액 차이(확정 ±10%, 예정 ±50%)
  function findRecurringMatch(row, used) {
    const d0 = new Date(row.date).getTime();
    const g = cat(row.cat) ? cat(row.cat).group : null;
    let best = null, bestScore = 1e9;
    for (const t of liveTx()) {
      if (t.source !== 'recurring' || t.importKey || used.has(t.id)) continue;
      const tg = cat(t.cat) ? cat(t.cat).group : null;
      if (!((row.cat && t.cat === row.cat) || (g === 'income' && tg === 'income'))) continue;
      const days = Math.abs(new Date(t.date).getTime() - d0) / 864e5;
      const diff = Math.abs(row.amount - t.amount) / Math.max(Math.abs(t.amount), 1);
      const rec = (S.recurring || []).find(r => r.id === t.recurId);
      const tol = rec && rec.mode === 'fixed' ? 0.1 : g === 'income' ? 0.3 : 0.5;
      if (days > 10 || diff > tol) continue;
      const score = days / 10 + diff;
      if (score < bestScore) { best = t; bestScore = score; }
    }
    return best;
  }

  // ---------- 집계 ----------
  function stats(ym) {
    const p = period(ym);
    const txs = liveTx().filter(t => inPeriod(t, p));
    const byCat = {};
    let income = 0, spend = 0, saving = 0;
    for (const t of txs) {
      const c = cat(t.cat); const g = c ? c.group : 'living';
      const a = t.amount;
      if (g === 'income') income += a;
      else if (g === 'saving') saving += a;
      else if (g === 'transfer') { /* 제외 */ }
      else spend += a;
      const id = c ? c.id : '_unc';
      byCat[id] = (byCat[id] || 0) + a;
    }
    return { p, txs, byCat, income, spend, saving };
  }
  function reserveBalance(cid) {
    const c = cat(cid); if (!c) return 0;
    const start = S.settings.reserveStart || todayStr().slice(0, 7);
    const months = Math.max(0, (Number(curYm().slice(0, 4)) - Number(start.slice(0, 4))) * 12 + Number(curYm().slice(5)) - Number(start.slice(5)) + 1);
    const p0 = period(start);
    const used = liveTx().filter(t => t.cat === cid && t.date >= p0.start).reduce((s, t) => s + t.amount, 0);
    return (Number((S.settings.reserveOpening || {})[cid]) || 0) + months * (c.budget || 0) - used;
  }
  function stateOf(spent, budget, pacePct) {
    if (!budget) return 'ok';
    const r = spent / budget;
    if (r > 1) return 'bad';
    if (r > Math.max(pacePct + 0.1, 0.85)) return 'warn';
    return 'ok';
  }

  // ---------- 렌더: 홈 ----------
  function renderHome() {
    const el = $('#view-home');
    const st = stats(UI.ym);
    const p = st.p;
    const today = todayStr();
    const elapsed = today < p.start ? 0 : today > p.end ? p.days : Math.round((new Date(today) - new Date(p.start)) / 864e5) + 1;
    const pace = elapsed / p.days;

    if (!liveTx().length) {
      el.innerHTML = `<div class="card empty">
        <b>아직 기록이 없어요</b>
        <p>아래 <b>+</b> 버튼으로 바로 입력하거나, 카드·통장 엑셀을 가져와서 시작하세요.</p>
        <div class="btns"><button class="btn" data-go="import">엑셀 가져오기</button><button class="btn ghost" id="loadSample">예시 데이터로 둘러보기</button></div>
      </div>` + budgetOverview(st, pace);
      $('#loadSample', el).onclick = loadSample;
      return;
    }

    const living = catsOf(['living']);
    const lBudget = living.reduce((s, c) => s + (c.budget || 0), 0);
    const lSpent = living.reduce((s, c) => s + (st.byCat[c.id] || 0), 0);
    const left = lBudget - lSpent;
    const fair = Math.round(lBudget * pace);
    const s = stateOf(lSpent, lBudget, pace);
    const daysLeft = today < p.start ? p.days : today > p.end ? 0 : p.days - elapsed + 1;
    const perDay = daysLeft > 0 ? Math.max(left, 0) / daysLeft : 0;
    const chip = s === 'ok' ? '<span class="chip ok">예산 안</span>' : s === 'warn' ? '<span class="chip warn">빠르게 쓰는 중</span>' : '<span class="chip bad">초과</span>';
    const unc = st.txs.filter(t => !cat(t.cat)).length;
    const pend = st.txs.filter(t => t.pending);
    const sample = liveTx().some(t => t.sample);

    el.innerHTML = `
      ${sample ? '<div class="banner">예시 데이터가 들어 있어요. <button class="btn ghost" id="clearSample" style="padding:4px 10px;margin-left:6px">예시 지우기</button></div>' : ''}
      <div class="card hero">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><span class="lbl">이번 달 생활비 남은 돈</span>${chip}</div>
        <div class="big ${left < 0 ? '' : ''}" style="${left < 0 ? 'color:var(--bad)' : ''}">${won(left)}<span style="font-size:16px;color:var(--muted)"> 원</span></div>
        <div class="meter ${s}"><i style="width:${Math.min(lSpent / (lBudget || 1), 1) * 100}%"></i><b style="left:${Math.min(pace, 1) * 100}%"></b></div>
        <div class="row"><span>${won(lSpent)} / ${won(lBudget)}</span><span>오늘까지 적정 ${won(fair)}</span></div>
        <div class="row"><span>${p.start.slice(5).replace('-', '.')} ~ ${p.end.slice(5).replace('-', '.')} · ${elapsed}/${p.days}일</span><span>${daysLeft > 0 ? '남은 날 하루 ' + won(perDay) + '원' : '기간 종료'}</span></div>
      </div>
      <div class="kpis">
        <div class="kpi"><span>수입</span><b>${man(st.income)}</b></div>
        <div class="kpi"><span>지출</span><b>${man(st.spend)}</b></div>
        <div class="kpi"><span>저축·투자</span><b>${man(st.saving)}</b></div>
      </div>
      ${pend.length ? `<button class="card" data-go="list" data-filter="pending" style="text-align:left;border-color:var(--warn);color:var(--warn)">금액 확인 필요 ${pend.length}건 (예정 ${won(pend.reduce((s, t) => s + t.amount, 0))}원) — 눌러서 실제 금액으로 확정</button>` : ''}
      ${unc ? `<button class="card" data-go="list" data-filter="unc" style="text-align:left;border-color:var(--warn);color:var(--warn)">미분류 ${unc}건 — 눌러서 분류하기</button>` : ''}
      ${budgetOverview(st, pace)}
      ${reserveCard()}
      ${topMerchants(st)}
    `;
    const cs = $('#clearSample', el); if (cs) cs.onclick = clearSample;
  }

  function budgetOverview(st, pace) {
    let html = '';
    for (const g of ['living', 'fixed', 'reserve', 'saving']) {
      const cs = catsOf([g]);
      const b = cs.reduce((s, c) => s + (c.budget || 0), 0);
      const sp = cs.reduce((s, c) => s + (st.byCat[c.id] || 0), 0);
      html += `<div class="card grp">
        <div class="grp-h"><b><span class="dot" style="background:${GROUPS[g].color}"></span>${GROUPS[g].name}</b><span class="num muted">${won(sp)} / ${won(b)}</span></div>
        ${cs.map(c => {
          const v = st.byCat[c.id] || 0; const s = g === 'saving' ? (v >= c.budget ? 'ok' : 'ok') : stateOf(v, c.budget, g === 'fixed' ? 1 : pace);
          const subs = subBreakdown(st, c.id);
          return `<div class="brow"><span class="nm">${esc(c.name)}</span><span class="am">${won(v)} <span class="muted">/ ${won(c.budget)}</span></span>
            <div class="meter ${s}"><i style="width:${Math.min(v / (c.budget || 1), 1) * 100}%;background:${s === 'ok' ? GROUPS[g].color : ''}"></i></div>
            ${subs ? `<span class="sub">${subs}</span>` : ''}</div>`;
        }).join('')}
      </div>`;
    }
    return html;
  }
  function subBreakdown(st, cid) {
    const m = {};
    st.txs.filter(t => t.cat === cid).forEach(t => { const k = t.sub || '기타'; m[k] = (m[k] || 0) + t.amount; });
    const e = Object.entries(m).sort((a, b) => b[1] - a[1]);
    if (e.length < 1) return '';
    return e.slice(0, 4).map(([k, v]) => esc(k) + ' ' + man(v)).join(' · ');
  }
  function reserveCard() {
    const cs = catsOf(['reserve']);
    return `<div class="card grp"><div class="grp-h"><b><span class="dot" style="background:var(--g-reserve)"></span>적립 통장 잔액</b><span class="muted small">${esc(S.settings.reserveStart)}부터</span></div>
      ${cs.map(c => { const b = reserveBalance(c.id); return `<div class="brow"><span class="nm">${esc(c.name)} <span class="muted small">월 ${man(c.budget)} 적립</span></span><span class="am" style="${b < 0 ? 'color:var(--bad)' : ''}">${won(b)}원</span></div>`; }).join('')}
    </div>`;
  }
  function topMerchants(st) {
    const m = {};
    st.txs.filter(t => { const c = cat(t.cat); return !c || GROUPS[c.group].spend; }).forEach(t => { m[t.merchant || '(메모 없음)'] = (m[t.merchant || '(메모 없음)'] || 0) + t.amount; });
    const e = Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 5);
    if (!e.length) return '';
    return `<div class="card grp"><div class="grp-h"><b>많이 쓴 곳</b></div>${e.map(([k, v]) => `<div class="brow"><span class="nm">${esc(k)}</span><span class="am">${won(v)}</span></div>`).join('')}</div>`;
  }

  // ---------- 렌더: 내역 ----------
  function renderList() {
    const el = $('#view-list');
    const st = stats(UI.ym);
    let txs = st.txs.slice();
    const f = UI.filter;
    if (f === 'unc') txs = txs.filter(t => !cat(t.cat));
    else if (f === 'pending') txs = txs.filter(t => t.pending);
    else if (f !== 'all') txs = txs.filter(t => { const c = cat(t.cat); return c && (c.group === f); });
    if (UI.q) { const q = UI.q.toLowerCase(); txs = txs.filter(t => (t.merchant + ' ' + (t.memo || '') + ' ' + (cat(t.cat) ? cat(t.cat).name : '') + ' ' + (t.sub || '')).toLowerCase().includes(q)); }
    txs.sort((a, b) => (b.date + (b.time || '')).localeCompare(a.date + (a.time || '')) || b.createdAt - a.createdAt);
    const days = {};
    txs.forEach(t => { (days[t.date] = days[t.date] || []).push(t); });
    const fl = [['all', '전체'], ['pending', '확인 필요'], ['unc', '미분류'], ['living', '생활'], ['fixed', '고정'], ['reserve', '적립'], ['saving', '저축'], ['income', '수입'], ['transfer', '이체·제외']];
    const wd = ['일', '월', '화', '수', '목', '금', '토'];
    el.innerHTML = `
      <input class="search" id="q" type="search" placeholder="가맹점·메모·카테고리 검색" value="${esc(UI.q)}" aria-label="검색">
      <div class="filters">${fl.map(([k, n]) => `<button class="fchip ${f === k ? 'on' : ''}" data-f="${k}">${n}</button>`).join('')}</div>
      ${txs.length ? Object.keys(days).map(d => {
        const sum = days[d].reduce((s, t) => { const c = cat(t.cat); return s + (!c || GROUPS[c.group].spend ? t.amount : 0); }, 0);
        return `<div class="day"><div class="day-h"><span>${d.slice(5).replace('-', '.')} (${wd[new Date(d).getDay()]})</span><span class="num">${sum > 0 ? '-' + won(sum) : sum < 0 ? '+' + won(-sum) : ''}</span></div>
          ${days[d].map(txRow).join('')}</div>`;
      }).join('') : `<div class="card empty"><p>${f === 'unc' ? '미분류 내역이 없어요.' : f === 'pending' ? '확인할 예정 기록이 없어요.' : '이 기간에 내역이 없어요.'}</p></div>`}
    `;
    $('#q', el).oninput = e => { UI.q = e.target.value; const pos = e.target.selectionStart; renderList(); const q = $('#q'); q.focus(); q.setSelectionRange(pos, pos); };
    $$('.fchip', el).forEach(b => b.onclick = () => { UI.filter = b.dataset.f; renderList(); });
    $$('.tx', el).forEach(b => b.onclick = () => openEditor(S.tx.find(t => t.id === b.dataset.id)));
  }
  function txRow(t) {
    const c = cat(t.cat); const g = c ? c.group : null; const m = method(t.method);
    const color = g ? GROUPS[g].color : 'var(--warn)';
    const sign = g === 'income' ? '+' : g && !GROUPS[g].spend ? '' : '-';
    const cls = g === 'income' ? 'in' : g && !GROUPS[g].spend ? 'ex' : '';
    return `<button class="tx ${c ? '' : 'unc'}" data-id="${t.id}">
      <span class="ic" style="background:${color}">${esc((c ? c.name : '?').slice(0, 2))}</span>
      <span class="mid"><span class="t1" style="display:block">${esc(t.merchant || (c ? c.name : '미분류'))}${t.sample ? '<span class="sample-tag">예시</span>' : ''}${t.pending ? '<span class="sample-tag">예정</span>' : t.source === 'recurring' ? '<span class="sample-tag" style="color:var(--muted)">반복</span>' : ''}</span>
      <span class="t2" style="display:block">${c ? esc(c.name + (t.sub ? ' · ' + t.sub : '')) : '미분류 — 눌러서 분류'}${m ? ' · ' + esc(m.name) : ''}${t.time ? ' · ' + t.time : ''}</span></span>
      <span class="amt ${cls}">${sign}${won(Math.abs(t.amount))}${t.amount < 0 ? ' 취소' : ''}</span>
    </button>`;
  }

  // ---------- 입력 시트 ----------
  let ED = null;
  function typeOfCat(cid) { const c = cat(cid); if (!c) return 'expense'; return c.group === 'income' ? 'income' : c.group === 'saving' ? 'saving' : c.group === 'transfer' ? 'transfer' : 'expense'; }
  function openEditor(tx) {
    const isNew = !tx;
    ED = tx ? Object.assign({}, tx, { type: typeOfCat(tx.cat), amtStr: String(Math.abs(tx.amount)), neg: tx.amount < 0 })
            : { id: null, type: 'expense', amtStr: '', date: todayStr(), time: '', merchant: '', memo: '', cat: '', sub: '', method: lastMethod('') };
    ED.isNew = isNew;
    $('#sheet').hidden = false; $('#scrim').hidden = false;
    renderEditor();
    document.body.style.overflow = 'hidden';
  }
  function closeEditor() { $('#sheet').hidden = true; $('#scrim').hidden = true; document.body.style.overflow = ''; ED = null; }
  function lastMethod(cid) {
    const ts = liveTx().filter(t => t.method && t.source === 'manual' && (!cid || t.cat === cid)).sort((a, b) => b.updatedAt - a.updatedAt);
    return ts.length ? ts[0].method : (cid ? lastMethod('') : 'm_money');
  }
  function templates() {
    const since = ymd(new Date(Date.now() - 90 * 864e5));
    const m = {};
    liveTx().filter(t => t.date >= since && t.merchant && cat(t.cat) && !t.sample && TYPE_GROUPS.expense.includes(cat(t.cat).group) && t.amount > 0).forEach(t => {
      const k = t.merchant + '|' + t.cat + '|' + (t.sub || '') + '|' + (t.method || '');
      m[k] = m[k] || { n: 0, t }; m[k].n++;
    });
    return Object.values(m).sort((a, b) => b.n - a.n).slice(0, 8).map(x => x.t);
  }
  function renderEditor() {
    const sh = $('#sheet');
    const groups = TYPE_GROUPS[ED.type];
    const cs = catsOf(groups);
    const c = cat(ED.cat);
    const tm = ED.isNew && ED.type === 'expense' ? templates() : [];
    sh.innerHTML = `<div class="in">
      <div class="sheet-h"><h3>${ED.isNew ? '새 기록' : '기록 수정'}</h3><button class="x" id="edClose" aria-label="닫기">×</button></div>
      <div class="sheet-b">
        <div class="seg" role="tablist">${[['expense', '지출'], ['income', '수입'], ['saving', '저축'], ['transfer', '이체']].map(([k, n]) => `<button data-type="${k}" class="${ED.type === k ? 'on' : ''}">${n}</button>`).join('')}</div>
        ${tm.length ? `<div><span class="lab">자주 쓰는 기록</span><div class="tmpl">${tm.map((t, i) => `<button data-tm="${i}">${esc(t.merchant)}<small>${esc(cat(t.cat).name + (t.sub ? '·' + t.sub : ''))} · ${esc(method(t.method) ? method(t.method).name : '')}</small></button>`).join('')}</div></div>` : ''}
        ${ED.pending ? '<div class="banner">반복 기록의 예정 금액이에요. 실제 금액으로 고쳐서 저장하면 확정돼요.</div>' : ''}
        <div class="amount" aria-live="polite"><b id="amtShow">${ED.neg ? '-' : ''}${won(Number(ED.amtStr) || 0)}</b><span>원</span></div>
        <div class="quick">${[[1000, '+1천'], [5000, '+5천'], [10000, '+1만'], [50000, '+5만'], [100000, '+10만']].map(([v, n]) => `<button data-add="${v}">${n}</button>`).join('')}<button data-neg="1">${ED.neg ? '취소(−) 해제' : '취소/환불(−)'}</button></div>
        <div class="keypad">${['1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0', '⌫'].map(k => `<button data-k="${k}" aria-label="${k === '⌫' ? '지우기' : k}">${k}</button>`).join('')}</div>
        <div><span class="lab">카테고리</span><div class="catgrid">${cs.map(x => `<button data-cat="${x.id}" class="${ED.cat === x.id ? 'on' : ''}"><span class="dot" style="background:${GROUPS[x.group].color}"></span><span>${esc(x.name)}</span></button>`).join('')}</div></div>
        ${c && c.subs && c.subs.length ? `<div><span class="lab">세부</span><div class="chips">${c.subs.map(s => `<button data-sub="${esc(s)}" class="${ED.sub === s ? 'on' : ''}">${esc(s)}</button>`).join('')}</div></div>` : ''}
        <div><span class="lab">결제수단</span><div class="chips">${S.methods.filter(m => !m.deleted).sort((a, b) => a.order - b.order).map(m => `<button data-m="${m.id}" class="${ED.method === m.id ? 'on' : ''}">${esc(m.name)}</button>`).join('')}</div></div>
        <div class="row2"><label class="field"><span class="lab">날짜</span><input type="date" id="edDate" value="${ED.date}"></label>
          <label class="field"><span class="lab">사용처</span><input id="edMerchant" value="${esc(ED.merchant)}" placeholder="예: 스타벅스" autocomplete="off"></label></div>
        <label class="field"><span class="lab">메모</span><input id="edMemo" value="${esc(ED.memo || '')}" placeholder="선택"></label>
        ${!ED.isNew && ED.merchant ? `<label class="small" style="display:flex;gap:8px;align-items:center"><input type="checkbox" id="edRule"> "${esc(ED.merchant)}"은 다음부터 이 카테고리로 자동 분류</label>` : ''}
      </div>
      <div class="sheet-f">${ED.isNew ? '' : '<button class="btn danger" id="edDel" style="flex:0 0 auto">삭제</button>'}${ED.pending ? '<button class="btn ghost" id="edConfirm">이 금액으로 확정</button>' : ''}<button class="btn" id="edSave">저장</button></div>
    </div>`;
    const syncFields = () => { ED.date = $('#edDate').value; ED.merchant = $('#edMerchant').value; ED.memo = $('#edMemo').value; };
    $('#edClose').onclick = closeEditor;
    $$('[data-type]', sh).forEach(b => b.onclick = () => { syncFields(); ED.type = b.dataset.type; if (typeOfCat(ED.cat) !== ED.type) { ED.cat = ''; ED.sub = ''; } renderEditor(); });
    $$('[data-tm]', sh).forEach(b => b.onclick = () => { const t = tm[+b.dataset.tm]; syncFields(); Object.assign(ED, { merchant: t.merchant, cat: t.cat, sub: t.sub || '', method: t.method }); renderEditor(); });
    $$('[data-k]', sh).forEach(b => b.onclick = () => { const k = b.dataset.k; if (k === '⌫') ED.amtStr = ED.amtStr.slice(0, -1); else if (ED.amtStr.length < 10) ED.amtStr = (ED.amtStr + k).replace(/^0+/, ''); $('#amtShow').textContent = (ED.neg ? '-' : '') + won(Number(ED.amtStr) || 0); });
    $$('[data-add]', sh).forEach(b => b.onclick = () => { ED.amtStr = String((Number(ED.amtStr) || 0) + Number(b.dataset.add)); $('#amtShow').textContent = (ED.neg ? '-' : '') + won(Number(ED.amtStr)); });
    $$('[data-neg]', sh).forEach(b => b.onclick = () => { syncFields(); ED.neg = !ED.neg; renderEditor(); });
    $$('[data-cat]', sh).forEach(b => b.onclick = () => { syncFields(); ED.cat = b.dataset.cat; const cc = cat(ED.cat); if (!cc.subs.includes(ED.sub)) ED.sub = ''; if (ED.isNew) ED.method = lastMethod(ED.cat); renderEditor(); });
    $$('[data-sub]', sh).forEach(b => b.onclick = () => { syncFields(); ED.sub = ED.sub === b.dataset.sub ? '' : b.dataset.sub; renderEditor(); });
    $$('[data-m]', sh).forEach(b => b.onclick = () => { syncFields(); ED.method = b.dataset.m; renderEditor(); });
    $('#edSave').onclick = () => {
      syncFields();
      const amt = Number(ED.amtStr) || 0;
      if (!amt) { toast('금액을 입력해 주세요'); return; }
      if (!ED.cat) { toast('카테고리를 골라 주세요'); return; }
      const t = now();
      const rec = { date: ED.date || todayStr(), time: ED.time || '', merchant: ED.merchant.trim(), memo: (ED.memo || '').trim(), amount: ED.neg ? -amt : amt, cat: ED.cat, sub: ED.sub, method: ED.method, pending: false, updatedAt: t };
      if (ED.isNew) S.tx.push(Object.assign({ id: uid(), createdAt: t, source: 'manual' }, rec));
      else Object.assign(S.tx.find(x => x.id === ED.id), rec);
      const rc = $('#edRule');
      if (rc && rc.checked && rec.merchant) { addRule(rec.merchant, rec.cat, rec.sub); applyRuleToUncategorized(rec.merchant, rec.cat, rec.sub); }
      const wasNew = ED.isNew;
      persist(); closeEditor(); render(); toast(wasNew ? '저장했어요' : '수정했어요');
    };
    const cf = $('#edConfirm'); if (cf) cf.onclick = () => $('#edSave').click();
    const del = $('#edDel');
    if (del) { let armed = false; del.onclick = () => { if (!armed) { armed = true; del.textContent = '한 번 더 눌러 삭제'; return; } const x = S.tx.find(t => t.id === ED.id); x.deleted = true; x.updatedAt = now(); persist(); closeEditor(); render(); toast('삭제했어요'); }; }
  }
  function addRule(kw, c, sub) { S.rules = S.rules.filter(r => r.kw !== kw || r.deleted); S.rules.unshift({ id: uid(), kw, cat: c, sub: sub || '', updatedAt: now() }); }
  function applyRuleToUncategorized(kw, c, sub) {
    let n = 0; liveTx().forEach(t => { if (!cat(t.cat) && (t.merchant || '').includes(kw)) { t.cat = c; t.sub = sub || ''; t.updatedAt = now(); n++; } });
    if (n) toast('미분류 ' + n + '건도 같이 분류했어요');
  }

  // ---------- 렌더: 가져오기 ----------
  function renderImport() {
    const el = $('#view-import');
    const ir = UI.importRows;
    if (!ir) {
      el.innerHTML = `
        <div class="drop" id="drop">
          <b>카드·통장 엑셀 파일 올리기</b>
          <span class="muted small">신한카드 이용내역, 기업·하나 등 은행 거래내역 (.xlsx, .csv)</span>
          <label class="btn" for="file">파일 선택</label>
          <input type="file" id="file" accept=".xlsx,.csv" hidden>
        </div>
        <div class="card small muted">
          <b style="color:var(--fg)">가져오기 규칙</b><br>
          · 이미 가져온 내역은 자동으로 건너뛰어요 (같은 파일을 다시 올려도 중복 없음).<br>
          · 통장의 카드대금 이체는 카드 내역과 겹치지 않게 "이체·제외"로 분류돼요.<br>
          · 본인 계좌 간 이체를 구분하려면 설정에서 <b>내 이름</b>을 입력하세요${S.settings.myName ? ` (현재: ${esc(S.settings.myName)})` : ' (지금은 비어 있어요)'}.
        </div>`;
      const inp = $('#file', el), drop = $('#drop', el);
      inp.onchange = () => inp.files[0] && handleFile(inp.files[0]);
      drop.ondragover = e => { e.preventDefault(); drop.classList.add('over'); };
      drop.ondragleave = () => drop.classList.remove('over');
      drop.ondrop = e => { e.preventDefault(); drop.classList.remove('over'); const f = e.dataTransfer.files[0]; if (f) handleFile(f); };
      return;
    }
    const keys = new Set(S.tx.filter(t => t.importKey).map(t => t.importKey));
    ir.rows.forEach(r => { r.dup = keys.has(r.key); });
    const fresh = ir.rows.filter(r => !r.dup);
    const usedM = new Set(); fresh.forEach(r => { const m = findRecurringMatch(r, usedM); r.match = m ? m.id : null; if (m) usedM.add(m.id); });
    const nMatch = fresh.filter(r => r.match).length;
    const unc = fresh.filter(r => !r.cat).length;
    const range = ir.rows.length ? ir.rows.map(r => r.date).sort() : [];
    el.innerHTML = `
      <div class="card" style="display:grid;gap:8px">
        <b>${esc(ir.file)} · ${ir.label}</b>
        <span class="small muted">${range.length ? range[0] + ' ~ ' + range[range.length - 1] : ''} · 전체 ${ir.rows.length}건 · <b style="color:var(--fg)">새 내역 ${fresh.length}건</b> · 중복 ${ir.rows.length - fresh.length}건 · 미분류 ${unc}건${nMatch ? ` · <b style="color:var(--fg)">반복 기록과 맞춤 ${nMatch}건</b> (실제 금액으로 확정)` : ''}</span>
        <label class="field"><span class="lab">이 파일의 결제수단</span><select id="impMethod">${S.methods.filter(m => !m.deleted).map(m => `<option value="${m.id}" ${m.id === ir.method ? 'selected' : ''}>${esc(m.name)}</option>`).join('')}</select></label>
        <div class="btns"><button class="btn" id="impGo" ${fresh.length ? '' : 'disabled'}>새 내역 ${fresh.length}건 가져오기</button><button class="btn ghost" id="impCancel">취소</button></div>
      </div>
      <div class="tbl"><table><thead><tr><th>날짜</th><th>사용처</th><th>분류</th><th class="n">금액</th></tr></thead><tbody>
      ${ir.rows.slice(0, 300).map(r => { const c = cat(r.cat); return `<tr class="${r.dup ? 'dup' : ''}"><td>${r.date.slice(5)}</td><td>${esc(r.merchant)}</td><td style="color:${c ? 'inherit' : 'var(--warn)'}">${c ? esc(c.name + (r.sub ? '·' + r.sub : '')) : '미분류'}</td><td class="n">${r.dir === 'in' ? '+' : ''}${won(r.amount)}</td></tr>`; }).join('')}
      </tbody></table></div>`;
    $('#impMethod', el).onchange = e => { ir.method = e.target.value; };
    $('#impCancel', el).onclick = () => { UI.importRows = null; renderImport(); };
    $('#impGo', el).onclick = () => {
      const t = now();
      fresh.forEach(r => {
        const m = r.match && S.tx.find(x => x.id === r.match);
        if (m) Object.assign(m, { importKey: r.key, date: r.date, time: r.time, amount: r.amount, memo: r.merchant !== m.merchant ? r.merchant : m.memo, pending: false, updatedAt: t });
        else S.tx.push({ id: uid(), createdAt: t, updatedAt: t, source: ir.kind, importKey: r.key, date: r.date, time: r.time, merchant: r.merchant, memo: r.memo || '', amount: r.amount, cat: r.cat, sub: r.sub, method: ir.method });
      });
      persist(); UI.importRows = null;
      const months = fresh.map(r => r.date).sort();
      toast((fresh.length - nMatch) + '건 가져왔어요' + (nMatch ? ' · 반복 기록 ' + nMatch + '건 확정' : '') + (unc ? ' · 미분류 ' + unc + '건' : ''));
      if (months.length) UI.ym = ymFor(months[months.length - 1]);
      generateRecurring(); go(unc ? 'list' : 'home', unc ? 'unc' : null);
    };
  }
  function ymFor(date) { const sd = parseInt(S.settings.startDay, 10) || 1; const d = new Date(date); if (d.getDate() < sd) d.setMonth(d.getMonth() - 1); return d.getFullYear() + '-' + pad(d.getMonth() + 1); }
  async function handleFile(f) {
    try {
      const rows = await XlsxLite.read(f);
      const r = parseImport(rows);
      UI.importRows = { file: f.name, label: r.label, kind: r.kind, rows: r.rows, method: /신한/.test(f.name) || r.kind === 'card' ? r.defaultMethod : guessBankMethod(f.name, r.defaultMethod) };
      renderImport();
    } catch (e) { console.error(e); toast(e.message || '파일을 읽지 못했어요'); }
  }
  function guessBankMethod(name, d) { if (/하나/.test(name)) return 'm_hana'; if (/우리|네이버/.test(name)) return 'm_moneyacct'; return d; }

  // ---------- 렌더: 설정 ----------
  function renderSettings() {
    const el = $('#view-settings');
    const groups = ['living', 'fixed', 'reserve', 'saving'];
    const total = S.cats.filter(c => !c.deleted && groups.includes(c.group)).reduce((s, c) => s + (Number(c.budget) || 0), 0);
    el.innerHTML = `
      <h2>동기화 (내 구글 드라이브)</h2>
      <div class="card set">
        <div class="small muted">데이터는 이 기기에 저장되고, 연결하면 내 구글 드라이브의 앱 전용 숨김 폴더를 통해 다른 기기와 맞춰져요.</div>
        <label class="field"><span class="lab">OAuth 클라이언트 ID</span><input id="clientId" value="${esc(L.clientId)}" placeholder="xxxx.apps.googleusercontent.com" autocomplete="off"></label>
        <div class="btns"><button class="btn" id="syncNow">${Sync.token ? '지금 동기화' : '구글 연결하고 동기화'}</button>${Sync.token ? '<button class="btn ghost" id="syncOff">연결 해제</button>' : ''}</div>
        <div class="small muted" id="syncInfo">${L.lastSync ? '마지막 동기화: ' + new Date(L.lastSync).toLocaleString('ko-KR') : '아직 동기화한 적 없음'}${Sync.lastError ? ' · 오류: ' + esc(Sync.lastError) : ''}</div>
      </div>

      <h2>월 예산 <span class="num" style="float:right">${won(total)}원</span></h2>
      ${groups.map(g => `<div class="card set"><b class="small" style="display:flex;gap:6px;align-items:center"><span class="dot" style="background:${GROUPS[g].color}"></span>${GROUPS[g].name}</b>
        ${catsOf([g]).map(c => `<div class="set-row"><span>${esc(c.name)}</span><input inputmode="numeric" data-budget="${c.id}" value="${won(c.budget)}" aria-label="${esc(c.name)} 예산"></div>`).join('')}</div>`).join('')}

      <h2>반복 기록 <span class="muted small" style="font-weight:400">매월 그 날짜가 되면 자동 기록</span></h2>
      <div class="card set">
        <div class="small muted">확정: 정한 금액 그대로 기록 · 예정: 지난달 금액으로 기록하고 "확인 필요"로 표시 (실제 금액으로 고치거나 엑셀을 가져오면 확정)</div>
        ${(S.recurring || []).filter(r => !r.deleted).sort((a, b) => a.day - b.day).map(r => `<div class="set-row" style="flex-wrap:wrap">
          <span style="flex:1 1 140px;min-width:0"><b style="font-weight:500">${esc(r.name)}</b> <span class="muted small">매월 ${r.day}일 · ${esc(cat(r.cat) ? cat(r.cat).name : '?')}</span></span>
          <select data-rmode="${r.id}" class="search" style="width:auto;padding:5px 8px"><option value="fixed" ${r.mode === 'fixed' ? 'selected' : ''}>확정</option><option value="estimate" ${r.mode === 'estimate' ? 'selected' : ''}>예정</option><option value="off" ${!r.active ? 'selected' : ''}>중지</option></select>
          <input inputmode="numeric" data-ramt="${r.id}" value="${won(r.amount)}" aria-label="${esc(r.name)} 금액">
          <button data-rcdel="${r.id}" style="background:none;border:0;color:var(--bad);font-size:13px">삭제</button></div>`).join('')}
        <div class="row2"><input class="search" id="rcName" placeholder="이름 (예: 넷플릭스)"><select class="search" id="rcCat">${S.cats.filter(c => !c.deleted).sort((a, b) => a.order - b.order).map(c => `<option value="${c.id}">${GROUPS[c.group].name} · ${esc(c.name)}</option>`).join('')}</select></div>
        <div class="row2"><input class="search" id="rcAmt" inputmode="numeric" placeholder="금액"><input class="search" id="rcDay" inputmode="numeric" placeholder="매월 며칠 (1~31)"></div>
        <div class="row2"><select class="search" id="rcMode"><option value="fixed">확정 (금액 고정)</option><option value="estimate">예정 (매달 확인)</option></select><select class="search" id="rcMethod">${S.methods.filter(m => !m.deleted).map(m => `<option value="${m.id}">${esc(m.name)}</option>`).join('')}</select></div>
        <button class="btn ghost" id="rcAdd">반복 기록 추가</button>
      </div>

      <h2>기본 설정</h2>
      <div class="card set">
        <div class="set-row"><span>예산 시작일 <span class="muted small">(매월)</span></span><input inputmode="numeric" id="startDay" value="${S.settings.startDay}"></div>
        <div class="set-row"><span>내 이름 <span class="muted small">(본인 이체 구분)</span></span><input id="myName" value="${esc(S.settings.myName)}" style="font-family:var(--sans)"></div>
        <div class="set-row"><span>적립 시작 월</span><input id="resStart" value="${esc(S.settings.reserveStart)}" placeholder="2026-11"></div>
        ${catsOf(['reserve']).map(c => `<div class="set-row"><span>${esc(c.name)} 시작 잔액</span><input inputmode="numeric" data-open="${c.id}" value="${won((S.settings.reserveOpening || {})[c.id] || 0)}"></div>`).join('')}
      </div>

      <h2>자동 분류 규칙 <span class="muted small" style="font-weight:400">기본 규칙보다 먼저 적용</span></h2>
      <div class="card set">
        <div class="row2"><input class="search" id="rKw" placeholder="가맹점에 포함된 글자"><select class="search" id="rCat">${S.cats.filter(c => !c.deleted).sort((a, b) => a.order - b.order).map(c => `<option value="${c.id}">${GROUPS[c.group].name} · ${esc(c.name)}</option>`).join('')}</select></div>
        <button class="btn ghost" id="rAdd">규칙 추가</button>
        ${S.rules.filter(r => !r.deleted).map(r => `<div class="rule"><span>"${esc(r.kw)}" → ${esc(cat(r.cat) ? cat(r.cat).name : '?')}${r.sub ? ' · ' + esc(r.sub) : ''}</span><button data-rdel="${r.id}">삭제</button></div>`).join('') || '<span class="small muted">아직 내가 만든 규칙이 없어요. 내역을 수정할 때 체크해서 추가할 수도 있어요.</span>'}
      </div>

      <h2>결제수단</h2>
      <div class="card set">
        ${S.methods.filter(m => !m.deleted).sort((a, b) => a.order - b.order).map(m => `<div class="set-row"><input class="wide" data-mname="${m.id}" value="${esc(m.name)}" aria-label="결제수단 이름"><span class="muted small" style="white-space:nowrap">${{ check: '체크', credit: '신용', transfer: '이체', cash: '현금' }[m.kind]}</span></div>`).join('')}
        <div class="row2"><input class="search" id="mNew" placeholder="새 결제수단 이름"><select class="search" id="mKind"><option value="check">체크</option><option value="credit">신용</option><option value="transfer">이체</option><option value="cash">현금</option></select></div>
        <button class="btn ghost" id="mAdd">결제수단 추가</button>
      </div>

      <h2>백업</h2>
      <div class="card set">
        <div class="btns"><button class="btn ghost" id="exp">JSON으로 내보내기</button><label class="btn ghost" for="impJson">JSON 불러오기</label><input type="file" id="impJson" accept=".json" hidden></div>
        <button class="btn danger" id="wipe">이 기기의 데이터 모두 지우기</button>
      </div>
      <p class="small muted" style="text-align:center">Moneta v2 · 이 기기 ID ${esc(L.deviceId.slice(-6))}</p>
    `;
    const numIn = (inp, fn) => { inp.onchange = () => { const v = Number(inp.value.replace(/[^\d-]/g, '')) || 0; fn(v); inp.value = won(v); persist(); }; };
    $$('[data-budget]', el).forEach(inp => numIn(inp, v => { const c = cat(inp.dataset.budget); c.budget = v; c.updatedAt = now(); renderSettings(); }));
    $$('[data-open]', el).forEach(inp => numIn(inp, v => { S.settings.reserveOpening = Object.assign({}, S.settings.reserveOpening, { [inp.dataset.open]: v }); S.settings.updatedAt = now(); }));
    $$('[data-rmode]', el).forEach(sel => sel.onchange = () => { const r = S.recurring.find(x => x.id === sel.dataset.rmode); if (sel.value === 'off') r.active = false; else { r.active = true; r.mode = sel.value; } r.updatedAt = now(); persist(); generateRecurring(); });
    $$('[data-ramt]', el).forEach(inp => numIn(inp, v => { const r = S.recurring.find(x => x.id === inp.dataset.ramt); r.amount = v; r.updatedAt = now(); }));
    $$('[data-rcdel]', el).forEach(b => b.onclick = () => { const r = S.recurring.find(x => x.id === b.dataset.rcdel); r.deleted = true; r.updatedAt = now(); persist(); renderSettings(); toast('반복 기록을 삭제했어요 (이미 기록된 내역은 남아요)'); });
    $('#rcAdd', el).onclick = () => {
      const name = $('#rcName').value.trim(), amount = Number($('#rcAmt').value.replace(/[^\d]/g, '')) || 0, day = Math.min(Math.max(parseInt($('#rcDay').value, 10) || 0, 0), 31);
      if (!name || !amount || !day) { toast('이름·금액·날짜를 입력해 주세요'); return; }
      S.recurring.push({ id: 'rc_' + uid(), name, cat: $('#rcCat').value, sub: '', amount, day, method: $('#rcMethod').value, mode: $('#rcMode').value, active: true, startYm: todayStr().slice(0, 7), updatedAt: now() });
      persist(); generateRecurring(); renderSettings(); toast('추가했어요');
    };
    $('#startDay', el).onchange = e => { S.settings.startDay = Math.min(Math.max(parseInt(e.target.value, 10) || 1, 1), 28); e.target.value = S.settings.startDay; S.settings.updatedAt = now(); UI.ym = curYm(); persist(); updateMonth(); };
    $('#myName', el).onchange = e => { S.settings.myName = e.target.value.trim(); S.settings.updatedAt = now(); persist(); };
    $('#resStart', el).onchange = e => { if (/^\d{4}-\d{2}$/.test(e.target.value)) { S.settings.reserveStart = e.target.value; S.settings.updatedAt = now(); persist(); } else toast('2026-11 형식으로 입력해 주세요'); };
    $('#clientId', el).onchange = e => { L.clientId = e.target.value.trim(); saveLocal(); };
    $('#syncNow', el).onclick = () => { L.clientId = $('#clientId').value.trim(); saveLocal(); Sync.run(true); };
    const so = $('#syncOff', el); if (so) so.onclick = () => { Sync.signOut(); renderSettings(); };
    $('#rAdd', el).onclick = () => { const kw = $('#rKw').value.trim(); if (!kw) return; addRule(kw, $('#rCat').value, ''); applyRuleToUncategorized(kw, $('#rCat').value, ''); persist(); renderSettings(); };
    $$('[data-rdel]', el).forEach(b => b.onclick = () => { const r = S.rules.find(x => x.id === b.dataset.rdel); r.deleted = true; r.updatedAt = now(); persist(); renderSettings(); });
    $$('[data-mname]', el).forEach(inp => inp.onchange = () => { const m = method(inp.dataset.mname); m.name = inp.value.trim() || m.name; m.updatedAt = now(); persist(); });
    $('#mAdd', el).onclick = () => { const n = $('#mNew').value.trim(); if (!n) return; S.methods.push({ id: 'm_' + uid(), name: n, kind: $('#mKind').value, order: S.methods.length, updatedAt: now() }); persist(); renderSettings(); };
    $('#exp', el).onclick = () => {
      const blob = new Blob([JSON.stringify(S, null, 1)], { type: 'application/json' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'moneta-backup-' + todayStr() + '.json'; document.body.appendChild(a); a.click(); a.remove();
    };
    $('#impJson', el).onchange = async e => {
      const f = e.target.files[0]; if (!f) return;
      try { const data = JSON.parse(await f.text()); if (!data.tx || !data.cats) throw new Error(); S = merge(S, data); persist(); render(); toast('백업을 합쳤어요'); }
      catch (err) { toast('Moneta 백업 파일이 아니에요'); }
    };
    let wipeArmed = false;
    $('#wipe', el).onclick = async () => {
      if (!wipeArmed) { wipeArmed = true; $('#wipe').textContent = '정말 지우려면 한 번 더 누르세요'; return; }
      S = freshState(); await kvSet('state', S); render(); toast('이 기기의 데이터를 지웠어요');
    };
  }

  // ---------- 병합 (동기화·백업 공용) ----------
  function mergeList(a = [], b = []) {
    const m = new Map();
    for (const x of a) m.set(x.id, x);
    for (const x of b) { const y = m.get(x.id); if (!y || (x.updatedAt || 0) > (y.updatedAt || 0)) m.set(x.id, x); }
    return Array.from(m.values());
  }
  function merge(a, b) {
    return {
      v: 1,
      cats: mergeList(a.cats, b.cats), methods: mergeList(a.methods, b.methods), rules: mergeList(a.rules, b.rules), tx: mergeList(a.tx, b.tx), recurring: mergeList(a.recurring, b.recurring),
      settings: (b.settings && (b.settings.updatedAt || 0) > (a.settings.updatedAt || 0)) ? b.settings : a.settings
    };
  }

  // ---------- 구글 드라이브 동기화 ----------
  const Sync = {
    token: null, exp: 0, busy: false, lastError: '', client: null, fileId: null,
    status(s, cls) { const b = $('#syncBtn'); if (b) { b.textContent = s; b.className = 'sync ' + (cls || ''); } },
    async loadGis() {
      if (window.google && google.accounts && google.accounts.oauth2) return;
      await new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'https://accounts.google.com/gsi/client'; s.onload = res; s.onerror = () => rej(new Error('구글 로그인 스크립트를 불러오지 못했어요')); document.head.appendChild(s); });
    },
    async getToken(interactive) {
      if (this.token && Date.now() < this.exp - 60000) return this.token;
      try { const c = JSON.parse(sessionStorage.getItem('salim-token') || 'null'); if (c && Date.now() < c.exp - 60000) { this.token = c.t; this.exp = c.exp; return this.token; } } catch (e) {}
      if (!interactive) return null;
      if (!L.clientId) throw new Error('설정에서 OAuth 클라이언트 ID를 먼저 입력해 주세요');
      await this.loadGis();
      return new Promise((res, rej) => {
        const tc = google.accounts.oauth2.initTokenClient({
          client_id: L.clientId, scope: 'https://www.googleapis.com/auth/drive.appdata',
          callback: r => { if (r.error) return rej(new Error(r.error)); this.token = r.access_token; this.exp = Date.now() + (r.expires_in || 3600) * 1000; try { sessionStorage.setItem('salim-token', JSON.stringify({ t: this.token, exp: this.exp })); } catch (e) {} res(this.token); },
          error_callback: e => rej(new Error(e && e.type === 'popup_closed' ? '로그인 창이 닫혔어요' : '로그인하지 못했어요'))
        });
        tc.requestAccessToken({ prompt: L.everConnected ? '' : 'consent' });
      });
    },
    async api(url, opt = {}) {
      const r = await fetch(url, Object.assign({}, opt, { headers: Object.assign({ Authorization: 'Bearer ' + this.token }, opt.headers || {}) }));
      if (r.status === 401) { this.token = null; try { sessionStorage.removeItem('salim-token'); } catch (e) {} throw new Error('로그인이 만료됐어요. 다시 연결해 주세요'); }
      if (!r.ok) throw new Error('드라이브 오류 ' + r.status);
      return r;
    },
    async run(interactive) {
      if (this.busy) return; this.busy = true; this.status('동기화 중…');
      try {
        const tk = await this.getToken(interactive);
        if (!tk) { this.status(L.clientId ? '연결 필요' : '로컬', ''); return; }
        if (!this.fileId) {
          const q = encodeURIComponent("name='salim-ledger.json'");
          const r = await (await this.api('https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&fields=files(id,modifiedTime)&q=' + q)).json();
          this.fileId = r.files && r.files[0] ? r.files[0].id : null;
        }
        let merged = S;
        if (this.fileId) {
          const remote = await (await this.api('https://www.googleapis.com/drive/v3/files/' + this.fileId + '?alt=media')).json();
          merged = merge(S, remote);
        }
        S = merged; generateRecurring(); await kvSet('state', S);
        const body = JSON.stringify(S);
        if (this.fileId) {
          await this.api('https://www.googleapis.com/upload/drive/v3/files/' + this.fileId + '?uploadType=media', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body });
        } else {
          const bd = 'salim' + uid();
          const mp = `--${bd}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify({ name: 'salim-ledger.json', parents: ['appDataFolder'] })}\r\n--${bd}\r\nContent-Type: application/json\r\n\r\n${body}\r\n--${bd}--`;
          const r = await (await this.api('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id', { method: 'POST', headers: { 'Content-Type': 'multipart/related; boundary=' + bd }, body: mp })).json();
          this.fileId = r.id;
        }
        L.lastSync = Date.now(); L.everConnected = true; saveLocal(); this.lastError = '';
        this.status('동기화됨', 'on');
        render(true);
      } catch (e) {
        console.error(e); this.lastError = e.message; this.status('동기화 오류', 'err');
        if (interactive) toast(e.message);
      } finally { this.busy = false; }
    },
    auto() { if (this.token || L.everConnected) this.run(false); },
    signOut() { try { if (this.token && window.google) google.accounts.oauth2.revoke(this.token); } catch (e) {} this.token = null; this.fileId = null; L.everConnected = false; saveLocal(); try { sessionStorage.removeItem('salim-token'); } catch (e) {} this.status('로컬'); }
  };

  // ---------- 예시 데이터 ----------
  function loadSample() {
    const p = period(UI.ym); const t = now(); const d = n => { const x = new Date(p.start); x.setDate(x.getDate() + n); return ymd(x); };
    const rows = [
      [0, '하나 급여', 4150000, 'in_salary', '', 'm_hana'], [1, '청년도약', 700000, 'sv_youth', '', 'm_ibk'], [1, '연금저축', 500000, 'sv_pension', '', 'm_hana'],
      [1, '관리비', 130000, 'fx_mgmt', '', 'm_hana'], [2, '쿠팡이츠', 18000, 'lv_food', '배달', 'm_money'], [2, '컴포즈커피', 3500, 'lv_food', '카페·디저트', 'm_money'],
      [3, 'GS25', 6200, 'lv_food', '장보기·편의점', 'm_money'], [4, '올리브영', 32000, 'lv_pocket', '뷰티', 'm_money'], [5, '당산곱창', 45000, 'lv_food', '외식', 'm_money'],
      [5, 'OPENAI *CHATGPT', 30012, 'fx_sub', 'AI·앱', 'm_shinhan'], [6, '다이소', 9000, 'lv_life', '생필품', 'm_money'], [7, '쿠팡', 27800, 'lv_pocket', '쇼핑', 'm_money']
    ];
    rows.forEach(([n, mer, amt, c, sub, m]) => S.tx.push({ id: uid(), createdAt: t, updatedAt: t, source: 'sample', sample: true, date: d(n), time: '', merchant: mer, memo: '', amount: amt, cat: c, sub, method: m }));
    persist(false); render();
  }
  function clearSample() { S.tx = S.tx.filter(x => !x.sample); persist(false); render(); toast('예시를 지웠어요'); }

  // ---------- 라우팅 ----------
  function updateMonth() { const [y, m] = UI.ym.split('-'); $('#ymLabel').textContent = y + '.' + m; }
  function go(tab, filter) {
    UI.tab = tab; if (filter !== undefined && filter !== null) UI.filter = filter;
    $$('section.view').forEach(s => s.hidden = s.id !== 'view-' + tab);
    $$('nav.tabs [data-tab]').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
    $('.month').style.visibility = tab === 'home' || tab === 'list' ? 'visible' : 'hidden';
    render(); window.scrollTo(0, 0);
  }
  function render(soft) {
    updateMonth();
    if (UI.tab === 'home') renderHome();
    else if (UI.tab === 'list') { if (soft && document.activeElement && document.activeElement.id === 'q') return; renderList(); }
    else if (UI.tab === 'import') renderImport();
    else if (UI.tab === 'settings') { if (soft) { const i = $('#syncInfo'); if (i) i.textContent = '마지막 동기화: ' + new Date(L.lastSync).toLocaleString('ko-KR'); return; } renderSettings(); }
  }

  async function init() {
    await load();
    generateRecurring();
    UI.ym = curYm();
    document.addEventListener('click', e => {
      const g = e.target.closest('[data-go]'); if (g) { go(g.dataset.go, g.dataset.filter || null); }
    });
    $$('nav.tabs [data-tab]').forEach(b => b.onclick = () => go(b.dataset.tab));
    $('#addBtn').onclick = () => openEditor(null);
    $('#scrim').onclick = closeEditor;
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && ED) closeEditor(); });
    $('#prevM').onclick = () => { UI.ym = shiftYm(UI.ym, -1); render(); };
    $('#nextM').onclick = () => { UI.ym = shiftYm(UI.ym, 1); render(); };
    $('#syncBtn').onclick = () => Sync.run(true);
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') { if (generateRecurring()) render(); Sync.auto(); } });
    setInterval(() => { if (document.visibilityState === 'visible') Sync.auto(); }, 60000);
    Sync.status(L.everConnected ? '연결 필요' : '로컬');
    go('home');
    Sync.auto();
    try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) {}
    if ('serviceWorker' in navigator && location.protocol === 'https:') { navigator.serviceWorker.register('sw.js').catch(() => {}); }
  }
  // 테스트용 노출
  window.Salim = { parseImport, classify, get state() { return S; } };
  init();
})();
