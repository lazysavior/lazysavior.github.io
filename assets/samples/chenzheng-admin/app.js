// 晨蒸粿舖 訂單後台（概念作品）
// 資料都寫在這個檔案裡，是虛構的示意資料；沒有資料庫、沒有登入、沒有串 LINE。
// 重新整理頁面，資料會回到一開始的樣子。
// 測試用：網址加上 ?test=1（例如 index.html#today?test=1）會在畫面下方出現「測試資料」切換。
'use strict';

/* ================= 品項、營業時間 ================= */

// 品項與示意價格，照範例 #1（晨蒸粿舖一頁式）
const PRODUCTS = {
  caozai: { name: '草仔粿', unit: '顆', price: 35 },
  honggui: { name: '紅龜粿', unit: '顆', price: 35 },
  mochi: { name: '手工麻糬', unit: '盒', price: 120, pieces: 6 },
  giftbox: { name: '年節禮盒', unit: '盒', price: 380, contains: { honggui: 4, caozai: 4, mochi: 1 } },
};
const ITEM_KEYS = ['caozai', 'honggui', 'mochi', 'giftbox'];
const MAKE_ORDER = ['caozai', 'honggui', 'mochi'];
const STATUS = { pending: '待確認', confirmed: '已確認', picked: '已取貨', cancelled: '已取消' };
const STATUS_KEYS = ['pending', 'confirmed', 'picked', 'cancelled'];
const LIMIT = { name: 20, note: 100, qty: 999 };

// 營業時間（示意，照範例 #1）：週一公休；週二到週五 07:00～13:00；週六、週日 06:30～13:00
function openHours(iso) {
  const dow = dowOf(iso);
  if (dow === 1) return null;
  return dow === 0 || dow === 6 ? { open: '06:30', close: '13:00' } : { open: '07:00', close: '13:00' };
}
// 可以取貨的時段：每 30 分鐘一格，最晚 12:30
function slotsFor(iso) {
  const h = openHours(iso);
  if (!h) return [];
  const out = [];
  for (let m = toMin(h.open); m < toMin(h.close); m += 30) out.push(fromMin(m));
  return out;
}
// 取貨軌的欄：一小時一欄
function railHours(iso) {
  const h = openHours(iso);
  if (!h) return [];
  const out = [];
  for (let x = Math.floor(toMin(h.open) / 60); x < Math.ceil(toMin(h.close) / 60); x++) out.push(x);
  return out;
}

/* ================= 示意資料 ================= */

// 電話只存末 3 碼，畫面上其他碼遮起來
const DEMO_ORDERS = [
  { id: 101, date: '2026-11-26', time: '07:00', name: '林先生', tel: '318', items: { caozai: 10, honggui: 10 }, status: 'picked', note: '' },
  { id: 102, date: '2026-11-26', time: '07:00', name: '王太太', tel: '052', items: { mochi: 2 }, status: 'picked', note: '' },
  { id: 103, date: '2026-11-26', time: '07:00', name: '張先生', tel: '774', items: { honggui: 12 }, status: 'picked', note: '拜拜用' },
  { id: 104, date: '2026-11-26', time: '07:30', name: '陳小姐', tel: '321', items: { mochi: 1, caozai: 4 }, status: 'confirmed', note: '' },
  { id: 105, date: '2026-11-26', time: '07:30', name: '黃媽媽', tel: '640', items: { giftbox: 2 }, status: 'confirmed', note: '分兩袋裝' },
  { id: 106, date: '2026-11-26', time: '08:00', name: '李先生', tel: '903', items: { caozai: 6 }, status: 'confirmed', note: '' },
  { id: 107, date: '2026-11-26', time: '08:00', name: '吳小姐', tel: '215', items: { mochi: 3 }, status: 'pending', note: 'LINE 問能不能改 8:30' },
  { id: 108, date: '2026-11-26', time: '08:30', name: '蔡阿姨', tel: '467', items: { honggui: 6, caozai: 6 }, status: 'confirmed', note: '' },
  { id: 109, date: '2026-11-26', time: '09:00', name: '劉先生', tel: '128', items: { giftbox: 1 }, status: 'confirmed', note: '' },
  { id: 110, date: '2026-11-26', time: '09:30', name: '鄭小姐', tel: '586', items: { mochi: 2 }, status: 'cancelled', note: '臨時出差，改下週' },
  { id: 111, date: '2026-11-26', time: '10:00', name: '許太太', tel: '739', items: { caozai: 8, honggui: 6 }, status: 'confirmed', note: '' },
  { id: 112, date: '2026-11-26', time: '10:30', name: '謝先生', tel: '082', items: { giftbox: 2 }, status: 'pending', note: '' },
  { id: 113, date: '2026-11-26', time: '11:00', name: '楊小姐', tel: '351', items: { mochi: 1, honggui: 2 }, status: 'confirmed', note: '' },
  { id: 114, date: '2026-11-26', time: '12:00', name: '周先生', tel: '660', items: { caozai: 4, honggui: 4 }, status: 'confirmed', note: '' },
  { id: 201, date: '2026-11-27', time: '07:30', name: '何小姐', tel: '415', items: { mochi: 2 }, status: 'pending', note: '' },
  { id: 202, date: '2026-11-27', time: '09:00', name: '郭先生', tel: '237', items: { honggui: 20 }, status: 'pending', note: '公司拜拜' },
  { id: 203, date: '2026-11-27', time: '10:00', name: '曾太太', tel: '508', items: { caozai: 12 }, status: 'confirmed', note: '' },
  { id: 204, date: '2026-11-28', time: '06:30', name: '羅太太', tel: '894', items: { caozai: 10 }, status: 'confirmed', note: '' },
  { id: 301, date: '2027-02-04', time: '09:00', name: '高小姐', tel: '573', items: { giftbox: 6 }, status: 'pending', note: '年節送禮，問有沒有提袋' },
  { id: 302, date: '2027-02-04', time: '10:00', name: '林太太', tel: '146', items: { giftbox: 2 }, status: 'confirmed', note: '' },
  { id: 303, date: '2027-02-05', time: '08:00', name: '賴先生', tel: '390', items: { giftbox: 10 }, status: 'confirmed', note: '公司訂，到店再給統編' },
  { id: 304, date: '2027-02-05', time: '11:00', name: '簡小姐', tel: '725', items: { giftbox: 1, mochi: 2 }, status: 'confirmed', note: '' },
];

// 最糟情況（break-ui）：週六（多一欄 6 點）、同一個時段 6 張單、很長的稱呼和備註、四位數的數量、只有一個字的稱呼
const WORST_ORDERS = [
  { id: 1, date: '2026-11-28', time: '06:30', name: '阿嬤（隔壁水果攤）', tel: '007', items: { honggui: 12 }, status: 'picked', note: '' },
  { id: 2, date: '2026-11-28', time: '06:30', name: '歐陽小姐', tel: '512', items: { caozai: 300 }, status: 'confirmed', note: '公司尾牙要用，300 顆分 10 袋裝，每袋 30 顆，統編到店再給。七點前一定要拿到，做不到請先打電話給我' },
  { id: 3, date: '2026-11-28', time: '06:30', name: 'Anderson 先生', tel: '884', items: { mochi: 2 }, status: 'pending', note: '' },
  { id: 4, date: '2026-11-28', time: '06:30', name: '李', tel: '101', items: { caozai: 1 }, status: 'confirmed', note: '' },
  { id: 5, date: '2026-11-28', time: '06:30', name: '王小明的媽媽', tel: '666', items: { caozai: 6, honggui: 6, mochi: 3, giftbox: 1 }, status: 'confirmed', note: '' },
  { id: 6, date: '2026-11-28', time: '06:30', name: '司馬先生', tel: '230', items: { giftbox: 12 }, status: 'pending', note: '' },
  { id: 7, date: '2026-11-28', time: '07:00', name: '陳', tel: '333', items: { mochi: 120 }, status: 'confirmed', note: '' },
  { id: 8, date: '2026-11-28', time: '07:00', name: '林太太', tel: '219', items: { honggui: 4 }, status: 'cancelled', note: '' },
  { id: 9, date: '2026-11-28', time: '08:30', name: '諸葛先生（幫社區活動中心訂）', tel: '458', items: { honggui: 999, caozai: 999 }, status: 'pending', note: '' },
  { id: 10, date: '2026-11-28', time: '12:30', name: '許', tel: '000', items: { mochi: 1 }, status: 'confirmed', note: '' },
  { id: 11, date: '2026-11-29', time: '06:30', name: '黃先生', tel: '777', items: { caozai: 2 }, status: 'pending', note: '' },
];

function makeMany() {
  let seed = 20261126;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const pick = (a) => a[Math.floor(rnd() * a.length)];
  const sur = '陳林黃張李王吳劉蔡楊許鄭謝郭洪曾邱廖賴周徐蘇葉莊呂江何蕭羅高潘簡朱鍾游彭詹胡施沈余盧梁趙顏柯翁魏孫戴'.split('');
  const who = ['小姐', '先生', '太太', '媽媽', '阿姨', '伯伯'];
  const days = ['2026-11-26', '2026-11-27', '2026-11-28', '2026-11-29', '2026-12-01', '2026-12-02', '2026-12-03'];
  const out = [];
  let id = 5000;
  for (const d of days) {
    const n = d === '2026-11-26' ? 46 : 14 + Math.floor(rnd() * 12);
    const slots = slotsFor(d);
    for (let i = 0; i < n; i++) {
      const items = {};
      const k = 1 + Math.floor(rnd() * 2);
      for (let j = 0; j < k; j++) items[pick(ITEM_KEYS)] = 1 + Math.floor(rnd() * 12);
      const time = pick(slots);
      let status = rnd() < 0.2 ? 'pending' : 'confirmed';
      if (d === '2026-11-26' && toMin(time) < toMin('07:20') && status === 'confirmed') status = 'picked';
      if (rnd() < 0.05) status = 'cancelled';
      out.push({ id: id++, date: d, time, name: pick(sur) + pick(who), tel: String(Math.floor(rnd() * 1000)).padStart(3, '0'), items, status, note: rnd() < 0.15 ? '分開裝' : '' });
    }
  }
  return out;
}

const DATASETS = {
  demo: { label: '示意資料', today: '2026-11-26', now: '07:20', orders: () => DEMO_ORDERS },
  worst: { label: '最糟情況', today: '2026-11-28', now: '06:50', orders: () => WORST_ORDERS },
  empty: { label: '今天沒訂單', today: '2026-11-26', now: '07:20', orders: () => DEMO_ORDERS.filter((o) => o.date !== '2026-11-26') },
  one: { label: '只有一筆', today: '2026-11-26', now: '07:20', orders: () => DEMO_ORDERS.filter((o) => o.id === 107) },
  many: { label: '很多筆', today: '2026-11-26', now: '07:20', orders: makeMany },
  loading: { label: '載入中', today: '2026-11-26', now: '07:20', orders: () => [] },
  error: { label: '讀取失敗', today: '2026-11-26', now: '07:20', orders: () => [] },
};

let DATA = 'demo';
let TODAY = DATASETS.demo.today;
let NOW = DATASETS.demo.now;
let orders = [];
let nextId = 9000;

function loadData(key) {
  const set = DATASETS[key] ? key : 'demo';
  DATA = set;
  TODAY = DATASETS[set].today;
  NOW = DATASETS[set].now;
  orders = DATASETS[set].orders().map((o) => ({ ...o, items: { ...o.items } }));
}

/* ================= 小工具 ================= */

const $ = (sel, root = document) => root.querySelector(sel);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const WEEK = ['日', '一', '二', '三', '四', '五', '六'];
const nf = new Intl.NumberFormat('zh-TW');
const n = (x) => `<span class="num">${nf.format(x)}</span>`;
const money = (x) => `<span class="num">NT$${nf.format(x)}</span>`;

function parts(iso) { const [y, m, d] = iso.split('-').map(Number); return { y, m, d }; }
function dowOf(iso) { const { y, m, d } = parts(iso); return new Date(Date.UTC(y, m - 1, d)).getUTCDay(); }
function addDays(iso, k) { const { y, m, d } = parts(iso); const t = new Date(Date.UTC(y, m - 1, d + k)); return t.toISOString().slice(0, 10); }
function dayName(iso) {
  const { m, d } = parts(iso);
  return `${m} 月 ${d} 日（${WEEK[dowOf(iso)]}）`;
}
function dayShort(iso) { const { m, d } = parts(iso); return `${m}/${d}（${WEEK[dowOf(iso)]}）`; }
function relDay(iso) {
  if (iso === TODAY) return '今天';
  if (iso === addDays(TODAY, 1)) return '明天';
  if (iso === addDays(TODAY, 2)) return '後天';
  return '';
}
const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
const fromMin = (x) => `${String(Math.floor(x / 60)).padStart(2, '0')}:${String(x % 60).padStart(2, '0')}`;
const maskTel = (tail) => `09**-***-${tail}`;
const byTime = (a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0) || toMin(a.time) - toMin(b.time) || a.id - b.id;

function itemsText(items, html = false) {
  return ITEM_KEYS.filter((k) => items[k] > 0)
    .map((k) => `${PRODUCTS[k].name} ${html ? n(items[k]) : nf.format(items[k])} ${PRODUCTS[k].unit}`)
    .join('、');
}
function orderTotal(items) { return ITEM_KEYS.reduce((s, k) => s + (items[k] || 0) * PRODUCTS[k].price, 0); }

// 今天每種粿要做多少：單買＋禮盒裡的
function makeTotals(list) {
  const t = {};
  for (const k of MAKE_ORDER) t[k] = { single: 0, inBox: 0 };
  let boxes = 0;
  for (const o of list) {
    for (const [k, q] of Object.entries(o.items)) {
      if (!q) continue;
      if (k === 'giftbox') {
        boxes += q;
        for (const [c, per] of Object.entries(PRODUCTS.giftbox.contains)) t[c].inBox += per * q;
      } else {
        t[k].single += q;
      }
    }
  }
  return { t, boxes };
}

/* ================= 網址（畫面、篩選、打開哪一筆都記在網址） ================= */

function parseHash() {
  const raw = location.hash.slice(1);
  const [v, qs = ''] = raw.split('?');
  const params = Object.fromEntries(new URLSearchParams(qs));
  // # 後面不是畫面名稱（例如 #main）時，當作還在原本的畫面
  return { view: VIEWS[v] ? v : (lastView || 'today'), params, unknown: !!v && !VIEWS[v] };
}
function link(view, params = {}) {
  const p = { ...params };
  const cur = parseHash().params;
  if (cur.test) p.test = cur.test;
  if (cur.data && !('data' in params)) p.data = cur.data;
  for (const k of Object.keys(p)) if (p[k] === '' || p[k] == null) delete p[k];
  const qs = new URLSearchParams(p).toString();
  return `#${view}${qs ? '?' + qs : ''}`;
}

/* ================= 共用的小區塊 ================= */

const ICON = {
  chevron: '<svg class="icon" viewBox="0 0 20 20" aria-hidden="true"><path d="M8 5l5 5-5 5"/></svg>',
  plus: '<svg class="icon" viewBox="0 0 20 20" aria-hidden="true"><path d="M10 4v12M4 10h12"/></svg>',
  minus: '<svg class="icon" viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h12"/></svg>',
  close: '<svg class="icon" viewBox="0 0 20 20" aria-hidden="true"><path d="M5 5l10 10M15 5L5 15"/></svg>',
  search: '<svg class="icon" viewBox="0 0 20 20" aria-hidden="true"><circle cx="9" cy="9" r="5.5"/><path d="M13 13l4 4"/></svg>',
};

function statusText(s) {
  return `<span class="status status--${s}">${s === 'picked' ? '<span aria-hidden="true">✓ </span>' : ''}${STATUS[s]}</span>`;
}

function skeleton(rows = 4) {
  return `<div class="skeleton" aria-busy="true" aria-label="訂單載入中">${'<div class="skeleton__row"><span></span><span></span></div>'.repeat(rows)}</div>`;
}
function errorBlock() {
  return `
    <div class="problem" role="alert">
      <h2 class="problem__title">讀不到訂單</h2>
      <p>可能是網路斷了。先確認手機有沒有連上網路，再按「重新讀取」。</p>
      <a class="btn btn--quiet" href="${link(parseHash().view, { ...parseHash().params, data: 'demo' })}">重新讀取</a>
    </div>`;
}

/* ================= 畫面：今天 ================= */

function viewToday() {
  document.title = '今天｜晨蒸粿舖 訂單後台（概念作品）';
  const head = (count) => `
      <header class="today__head">
        <h1 class="title" id="view-title" tabindex="-1">${dayName(TODAY).replace('（', '<span class="title__dow">（').replace('）', '）</span>')}</h1>
        <p class="clock">現在 <span class="num">${NOW}</span>（示意時間）${count ? `，今天 ${n(count)} 筆訂單` : ''}</p>
      </header>`;

  if (DATA === 'loading') return `<section class="today" aria-labelledby="view-title">${head(0)}${skeleton(5)}</section>`;
  if (DATA === 'error') return `<section class="today" aria-labelledby="view-title">${head(0)}${errorBlock()}</section>`;

  const live = orders.filter((o) => o.date === TODAY && o.status !== 'cancelled');
  const picked = live.filter((o) => o.status === 'picked').length;
  const pendingToday = live.filter((o) => o.status === 'pending').sort(byTime);
  const pendingOther = orders.filter((o) => o.date !== TODAY && o.status === 'pending').length;
  const nowMin = toMin(NOW);

  if (!openHours(TODAY)) {
    return `<section class="today today--empty" aria-labelledby="view-title">${head(0)}
      <div class="empty"><h2 class="empty__title">今天週一公休</h2><p>明天的訂單在「訂單」裡。</p><a class="btn btn--quiet" href="${link('orders', { day: addDays(TODAY, 1) })}">看明天的訂單</a></div></section>`;
  }

  const pendingBlock = pendingToday.length ? `
      <a class="pending" href="${link('orders', { status: 'pending' })}">
        <span class="pending__count">${n(pendingToday.length)} 筆還沒確認</span>
        <span class="pending__who">${pendingToday.slice(0, 3).map((o) => `<span class="nowrap"><span class="num">${o.time}</span> ${esc(o.name)}</span>`).join('、')}${pendingToday.length > 3 ? `，還有 ${n(pendingToday.length - 3)} 筆` : ''}</span>
        ${pendingOther ? `<span class="pending__more">其他日期還有 ${n(pendingOther)} 筆</span>` : ''}
        ${ICON.chevron.replace('class="icon"', 'class="icon pending__go"')}
      </a>` : `
      <p class="pending pending--clear">今天的訂單都確認過了${pendingOther ? `，其他日期還有 <a href="${link('orders', { status: 'pending' })}">${n(pendingOther)} 筆</a>待確認` : ''}</p>`;

  if (!live.length) {
    return `
      <section class="today today--empty" aria-labelledby="view-title">
        ${head(0)}
        ${pendingOther ? `<p class="pending pending--clear">其他日期有 <a href="${link('orders', { status: 'pending' })}">${n(pendingOther)} 筆</a>待確認</p>` : ''}
        <div class="empty">
          <h2 class="empty__title">今天還沒有訂單</h2>
          <p>接到電話時按「新增訂單」，LINE 上的訂單也可以在這裡補登。</p>
          <a class="btn btn--primary" href="${link('new')}">${ICON.plus}新增訂單</a>
        </div>
      </section>`;
  }

  const { t, boxes } = makeTotals(live);
  const rows = MAKE_ORDER.map((k) => {
    const p = PRODUCTS[k];
    const total = t[k].single + t[k].inBox;
    const from = [];
    if (t[k].single) from.push(`單買 ${n(t[k].single)}`);
    if (t[k].inBox) from.push(`禮盒 ${n(t[k].inBox)}`);
    const pieces = p.pieces && total ? `，共 ${n(total * p.pieces)} 顆` : '';
    return `
      <div class="make__row${total ? '' : ' is-zero'}">
        <dt class="make__name">${p.name}</dt>
        <dd class="make__qty"><span class="num">${nf.format(total)}</span><span class="make__unit">${p.unit}</span></dd>
        <dd class="make__from">${from.join('、') || '今天沒有人訂'}${pieces}</dd>
      </div>`;
  }).join('');
  const boxRow = boxes ? `
      <div class="make__row make__row--box">
        <dt class="make__name">年節禮盒</dt>
        <dd class="make__qty"><span class="num">${nf.format(boxes)}</span><span class="make__unit">盒</span></dd>
        <dd class="make__from">要裝盒，每盒紅龜 4、草仔 4、麻糬 1 盒</dd>
      </div>` : '';

  // 取貨軌：一小時一欄。客人拿走的單從軌上取下，只留「已取幾張」；一欄超過 3 張就收成「還有幾張」
  const hours = railHours(TODAY);
  const railStart = hours[0] * 60, railEnd = (hours[hours.length - 1] + 1) * 60;
  const elapsed = Math.min(1, Math.max(0, (nowMin - railStart) / (railEnd - railStart)));
  const SHOW = 3;
  const cols = hours.map((h) => {
    const inHour = live.filter((o) => Math.floor(toMin(o.time) / 60) === h).sort(byTime);
    const waiting = inHour.filter((o) => o.status !== 'picked');
    const done = inHour.length - waiting.length;
    const past = (h + 1) * 60 <= nowMin;
    const shown = waiting.length > SHOW ? waiting.slice(0, SHOW - 1) : waiting;
    const more = waiting.length - shown.length;
    const slips = shown.map((o) => `
          <li><button class="slip slip--${o.status}" type="button" data-open="${o.id}" title="${esc(o.name)}" aria-label="${o.time} ${esc(o.name)}，${itemsText(o.items)}，${STATUS[o.status]}">
            <span class="slip__min num" aria-hidden="true">:${o.time.slice(3)}</span>
            <span class="slip__name" aria-hidden="true">${esc(o.name)}</span>
          </button></li>`).join('') + (more ? `
          <li><a class="rail__more" href="${link('orders', { day: TODAY, hour: h })}" aria-label="+${more} 張，${h} 點還有 ${more} 張單，看全部">+${n(more)} 張</a></li>` : '');
    const stub = done ? `<span class="rail__done"><span aria-hidden="true">✓</span> 已取 ${n(done)}</span>` : '';
    return `
        <li class="rail__col${past ? ' is-past' : ''}">
          <span class="rail__hour"><span class="num">${h}</span> 點</span>
          ${stub}
          ${slips ? `<ul class="rail__slips" role="list">${slips}</ul>` : (done ? '' : '<span class="rail__none">沒人</span>')}
        </li>`;
  }).join('');
  const anchor = elapsed < 0.1 ? 'start' : elapsed > 0.9 ? 'end' : 'mid';

  const next = live.filter((o) => o.status !== 'picked' && toMin(o.time) >= nowMin - 30).sort(byTime).slice(0, 4);
  const nextRows = next.map((o) => `
        <li class="next__row">
          <span class="next__time num">${o.time}</span>
          <span class="next__who"><button class="linkish" type="button" data-open="${o.id}">${esc(o.name)}</button>${o.status === 'pending' ? '<span class="tag tag--pending">待確認</span>' : ''}</span>
          <span class="next__items">${itemsText(o.items, true)}${o.note ? `<span class="next__note">${esc(o.note)}</span>` : ''}</span>
          ${o.status === 'pending'
            ? `<button class="btn btn--quiet next__done" type="button" data-confirm="${o.id}">確認訂單</button>`
            : `<button class="btn btn--quiet next__done" type="button" data-pick="${o.id}">已取貨</button>`}
        </li>`).join('');

  return `
    <section class="today" aria-labelledby="view-title">
      ${head(live.length)}
      ${pendingBlock}
      <section class="make" aria-labelledby="make-title">
        <h2 class="sect" id="make-title">今天要做</h2>
        <dl class="make__list">${rows}${boxRow}</dl>
      </section>
      <section class="rail-wrap" aria-labelledby="rail-title">
        <div class="sect-row">
          <h2 class="sect" id="rail-title">誰幾點來拿</h2>
          <p class="sect-aside">已取 ${n(picked)}／${n(live.length)}</p>
        </div>
        <div class="rail" style="--elapsed:${elapsed}; --cols:${hours.length}">
          <span class="rail__now rail__now--${anchor}" aria-hidden="true">現在 <span class="num">${NOW}</span></span>
          <ol class="rail__cols" role="list">${cols}</ol>
        </div>
        <p class="legend"><span class="legend__key legend__key--pending" aria-hidden="true"></span>右上角折紅角的是待確認</p>
      </section>
      <section class="next" aria-labelledby="next-title">
        <h2 class="sect" id="next-title">接下來</h2>
        <ul class="next__list" role="list">${nextRows || '<li class="next__row next__row--none">今天的都拿走了</li>'}</ul>
      </section>
    </section>`;
}

/* ================= 畫面：訂單列表 ================= */

function filterOrders(params, { ignoreStatus = false } = {}) {
  let list = orders.filter((o) => o.date >= TODAY);
  if (params.day) list = list.filter((o) => o.date === params.day);
  if (params.hour) list = list.filter((o) => Math.floor(toMin(o.time) / 60) === Number(params.hour));
  if (params.gift) list = list.filter((o) => o.items.giftbox > 0);
  const q = (params.q || '').trim();
  if (q) {
    const digits = q.replace(/\D/g, '');
    list = list.filter((o) => o.name.includes(q) || (digits.length >= 1 && digits.length <= 3 && o.tel.endsWith(digits)));
  }
  if (!ignoreStatus && params.status) list = list.filter((o) => o.status === params.status);
  return list.sort(byTime);
}

function orderTable(list, { showDate = false, caption = '' } = {}) {
  const rows = list.map((o) => {
    const isToday = o.date === TODAY;
    let act = '';
    if (o.status === 'pending') act = `<button class="btn btn--quiet btn--sm" type="button" data-confirm="${o.id}">確認</button>`;
    else if (o.status === 'confirmed' && isToday) act = `<button class="btn btn--quiet btn--sm" type="button" data-pick="${o.id}">已取貨</button>`;
    return `
      <tr class="o o--${o.status}">
        <td class="o__time"><span class="num">${o.time}</span>${showDate ? `<span class="o__date">${dayShort(o.date)}</span>` : ''}</td>
        <td class="o__who"><button class="o__open" type="button" data-open="${o.id}">${esc(o.name)}</button><span class="o__tel num">${maskTel(o.tel)}</span></td>
        <td class="o__items">${itemsText(o.items, true)}${o.note ? `<span class="o__note">${esc(o.note)}</span>` : ''}</td>
        <td class="o__status">${statusText(o.status)}</td>
        <td class="o__act">${act}</td>
      </tr>`;
  }).join('');
  return `
    <table class="orders">
      ${caption ? `<caption class="visually-hidden">${caption}</caption>` : ''}
      <thead class="orders__head"><tr><th scope="col">取貨時間</th><th scope="col">稱呼</th><th scope="col">品項</th><th scope="col">狀態</th><th scope="col"><span class="visually-hidden">動作</span></th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function orderResults(params) {
  if (DATA === 'loading') return skeleton(6);
  if (DATA === 'error') return errorBlock();
  const list = filterOrders(params);
  if (!list.length) {
    const q = (params.q || '').trim();
    const why = q ? `找不到「${esc(q)}」的訂單` : params.status ? `沒有${STATUS[params.status]}的訂單` : '這段時間還沒有訂單';
    return `
      <div class="empty">
        <h2 class="empty__title">${why}</h2>
        <p>${q ? '稱呼可以只打姓，電話打末 3 碼。' : '接到電話時，按「新增訂單」記下來。'}</p>
        ${q || params.status || params.hour ? `<a class="btn btn--quiet" href="${link('orders', params.day ? { day: params.day } : {})}">清除篩選</a>` : `<a class="btn btn--primary" href="${link('new')}">${ICON.plus}新增訂單</a>`}
      </div>`;
  }
  const days = [...new Set(list.map((o) => o.date))];
  return days.map((d) => {
    const inDay = list.filter((o) => o.date === d);
    const rel = relDay(d);
    return `
      <section class="day" aria-labelledby="day-${d}">
        <h2 class="day__title" id="day-${d}">${dayName(d)}${rel ? `<span class="day__rel">${rel}</span>` : ''}<span class="day__count">${n(inDay.length)} 筆</span></h2>
        ${orderTable(inDay, { caption: `${dayName(d)}的訂單` })}
      </section>`;
  }).join('');
}

function viewOrders(params) {
  document.title = '訂單｜晨蒸粿舖 訂單後台（概念作品）';
  const base = filterOrders(params, { ignoreStatus: true });
  const count = (s) => base.filter((o) => !s || o.status === s).length;
  const keep = { day: params.day, hour: params.hour, q: params.q };
  const chips = [['', '全部'], ...STATUS_KEYS.map((s) => [s, STATUS[s]])].map(([s, label]) => `
      <a class="seg__item" href="${link('orders', { ...keep, status: s })}" ${(params.status || '') === s ? 'aria-current="true"' : ''} data-focus="status-${s || 'all'}">${label}<span class="seg__n num">${DATA === 'loading' || DATA === 'error' ? '' : nf.format(count(s))}</span></a>`).join('');
  const dayOpts = [['', '今天以後'], [TODAY, '今天'], [addDays(TODAY, 1), '明天']].map(([d, label]) => `
      <a class="seg__item" href="${link('orders', { status: params.status, q: params.q, day: d })}" ${(params.day || '') === d && !params.hour ? 'aria-current="true"' : ''} data-focus="day-${d || 'all'}">${label}</a>`).join('');
  const hourChip = params.hour ? `<p class="hourchip">只看 ${n(Number(params.hour))} 點的單 <a class="btn btn--quiet btn--sm" href="${link('orders', { status: params.status, q: params.q, day: params.day })}">看全部時段</a></p>` : '';

  return `
    <section class="page" aria-labelledby="view-title">
      <header class="page__head">
        <h1 class="title" id="view-title" tabindex="-1">訂單</h1>
        <p class="clock">照取貨時間排，點稱呼看詳情</p>
      </header>
      <div class="tools">
        <div class="search">
          <label class="visually-hidden" for="q">用稱呼或電話末 3 碼搜尋</label>
          ${ICON.search}
          <input class="search__input" id="q" type="search" inputmode="search" autocomplete="off" placeholder="稱呼或電話末 3 碼" value="${esc(params.q || '')}" maxlength="${LIMIT.name}">
        </div>
        <nav class="seg" aria-label="依日期篩選">${dayOpts}</nav>
        <nav class="seg seg--status" aria-label="依狀態篩選">${chips}</nav>
        ${hourChip}
      </div>
      <div class="results" id="results">${orderResults(params)}</div>
    </section>`;
}

/* ================= 畫面：年節禮盒 ================= */

function viewGift(params) {
  document.title = '年節禮盒｜晨蒸粿舖 訂單後台（概念作品）';
  const head = `
      <header class="page__head">
        <h1 class="title" id="view-title" tabindex="-1">年節禮盒</h1>
        <p class="clock">每盒紅龜粿 4、草仔粿 4、手工麻糬 1 盒，示意價格 ${money(PRODUCTS.giftbox.price)}</p>
      </header>`;
  if (DATA === 'loading') return `<section class="page" aria-labelledby="view-title">${head}${skeleton(4)}</section>`;
  if (DATA === 'error') return `<section class="page" aria-labelledby="view-title">${head}${errorBlock()}</section>`;

  const list = orders.filter((o) => o.date >= TODAY && o.items.giftbox > 0 && o.status !== 'cancelled').sort(byTime);
  if (!list.length) {
    return `<section class="page" aria-labelledby="view-title">${head}
      <div class="empty"><h2 class="empty__title">還沒有人預訂禮盒</h2><p>接到預訂時，在「新增訂單」把年節禮盒的數量加上去。</p><a class="btn btn--primary" href="${link('new', { gift: 1 })}">${ICON.plus}新增禮盒訂單</a></div></section>`;
  }
  const days = [...new Set(list.map((o) => o.date))];
  const box = (arr) => arr.reduce((s, o) => s + o.items.giftbox, 0);
  const notPicked = list.filter((o) => o.status !== 'picked');
  const summary = days.map((d) => {
    const arr = list.filter((o) => o.date === d);
    const p = arr.filter((o) => o.status === 'pending').length;
    return `<tr><th scope="row">${dayName(d)}${relDay(d) ? `<span class="day__rel">${relDay(d)}</span>` : ''}</th><td class="num-cell">${n(box(arr))} 盒</td><td class="num-cell">${n(arr.length)} 筆</td><td>${p ? `<span class="status status--pending">${nf.format(p)} 筆待確認</span>` : '<span class="status status--confirmed">都確認了</span>'}</td></tr>`;
  }).join('');

  return `
    <section class="page" aria-labelledby="view-title">
      ${head}
      <section class="giftsum" aria-labelledby="gift-sum-title">
        <h2 class="sect" id="gift-sum-title">還沒取的禮盒共 ${n(box(notPicked))} 盒</h2>
        <table class="plain">
          <caption class="visually-hidden">每天要裝幾盒</caption>
          <thead><tr><th scope="col">取貨日</th><th scope="col">盒數</th><th scope="col">筆數</th><th scope="col">確認</th></tr></thead>
          <tbody>${summary}</tbody>
        </table>
      </section>
      ${days.map((d) => {
        const arr = list.filter((o) => o.date === d);
        return `
      <section class="day" aria-labelledby="g-${d}">
        <h2 class="day__title" id="g-${d}">${dayName(d)}${relDay(d) ? `<span class="day__rel">${relDay(d)}</span>` : ''}<span class="day__count">${n(box(arr))} 盒</span></h2>
        ${orderTable(arr, { caption: `${dayName(d)}的禮盒訂單` })}
      </section>`;
      }).join('')}
    </section>`;
}

/* ================= 畫面：新增訂單 ================= */

function viewNew(params) {
  document.title = '新增訂單｜晨蒸粿舖 訂單後台（概念作品）';
  let tomorrow = addDays(TODAY, 1);
  while (!openHours(tomorrow)) tomorrow = addDays(tomorrow, 1);
  const qtyRows = ITEM_KEYS.map((k) => {
    const p = PRODUCTS[k];
    const start = params.gift && k === 'giftbox' ? 1 : 0;
    return `
        <div class="qty">
          <span class="qty__name" id="lbl-${k}">${p.name}</span>
          <span class="qty__price">${money(p.price)}／${p.unit}</span>
          <div class="stepper">
            <button class="stepper__btn" type="button" data-step="${k}" data-d="-1" aria-label="${p.name}少一${p.unit}">${ICON.minus}</button>
            <input class="stepper__input num" id="q-${k}" name="${k}" type="number" inputmode="numeric" min="0" max="${LIMIT.qty}" value="${start}" aria-labelledby="lbl-${k}" aria-describedby="err-items">
            <button class="stepper__btn" type="button" data-step="${k}" data-d="1" aria-label="${p.name}多一${p.unit}">${ICON.plus}</button>
          </div>
        </div>`;
  }).join('');

  return `
    <section class="page page--form" aria-labelledby="view-title">
      <header class="page__head">
        <h1 class="title" id="view-title" tabindex="-1">新增訂單</h1>
        <p class="clock">接到電話時用。取貨那天，會算進那天的「今天要做」。</p>
      </header>
      <form class="form" id="new-form" novalidate>
        <div class="form__summary" id="summary" role="alert" tabindex="-1" hidden></div>

        <fieldset class="field field--items">
          <legend class="field__label">品項和數量</legend>
          <div class="qtys">${qtyRows}</div>
          <p class="field__err" id="err-items" hidden></p>
          <p class="total">合計 <span id="total">${money(params.gift ? PRODUCTS.giftbox.price : 0)}</span><span class="total__note">（示意價格）</span></p>
        </fieldset>

        <div class="field-row">
          <div class="field">
            <label class="field__label" for="f-date">取貨日期</label>
            <input class="input num" id="f-date" name="date" type="date" min="${TODAY}" value="${tomorrow}" aria-describedby="hint-date err-date" required>
            <p class="field__hint" id="hint-date">${dayName(tomorrow)}</p>
            <p class="field__err" id="err-date" hidden></p>
          </div>
          <div class="field">
            <label class="field__label" for="f-time">取貨時間</label>
            <select class="input num" id="f-time" name="time" aria-describedby="err-time" required>${timeOptions(tomorrow)}</select>
            <p class="field__err" id="err-time" hidden></p>
          </div>
        </div>

        <div class="field-row">
          <div class="field">
            <label class="field__label" for="f-name">稱呼</label>
            <input class="input" id="f-name" name="name" type="text" autocomplete="off" maxlength="${LIMIT.name}" placeholder="例：陳小姐" aria-describedby="err-name" required>
            <p class="field__err" id="err-name" hidden></p>
          </div>
          <div class="field">
            <label class="field__label" for="f-tel">手機號碼</label>
            <input class="input num" id="f-tel" name="tel" type="tel" inputmode="numeric" autocomplete="off" maxlength="12" placeholder="例：0912345678" aria-describedby="hint-tel err-tel" required>
            <p class="field__hint" id="hint-tel">存檔後只留末 3 碼，畫面上其他碼會遮起來</p>
            <p class="field__err" id="err-tel" hidden></p>
          </div>
        </div>

        <div class="field">
          <label class="field__label" for="f-note">備註<span class="field__opt">（可不填）</span></label>
          <textarea class="input input--area" id="f-note" name="note" rows="3" maxlength="${LIMIT.note}" placeholder="例：拜拜用、分兩袋裝" aria-describedby="note-count"></textarea>
          <p class="field__hint num" id="note-count">0／${LIMIT.note}</p>
        </div>

        <div class="form__actions">
          <button class="btn btn--primary" type="submit">存成訂單</button>
          <a class="btn btn--quiet" href="${link('today')}">不存了</a>
        </div>
      </form>
    </section>`;
}

function timeOptions(iso, keep) {
  const slots = slotsFor(iso);
  if (!slots.length) return '<option value="">週一公休，不能取貨</option>';
  return '<option value="">請選時間</option>' + slots.map((s) => `<option value="${s}" ${s === keep ? 'selected' : ''}>${s}</option>`).join('');
}

function readForm(form) {
  const items = {};
  const bad = [];
  for (const k of ITEM_KEYS) {
    const el = form.elements[k];
    const raw = String(el.value).trim();
    const num = raw === '' ? 0 : Number(raw);
    let why = '';
    if (el.validity.badInput || Number.isNaN(num)) why = '要填數字';
    else if (num < 0) why = '不能是負數';
    else if (!Number.isInteger(num)) why = '要填整數';
    else if (num > LIMIT.qty) why = `一筆最多 ${LIMIT.qty} ${PRODUCTS[k].unit}，超過請分成兩筆`;
    if (why) bad.push({ k, why });
    items[k] = why ? 0 : num;
  }
  return {
    items,
    bad,
    date: form.elements.date.value,
    time: form.elements.time.value,
    name: form.elements.name.value.trim(),
    telRaw: form.elements.tel.value,
    tel: form.elements.tel.value.replace(/[\s-]/g, ''),
    note: form.elements.note.value.trim(),
  };
}

function validate(v, only) {
  const err = {};
  if (v.bad.length) err.items = v.bad.map((b) => `${PRODUCTS[b.k].name}${b.why}`).join('；');
  else if (!ITEM_KEYS.some((k) => v.items[k] > 0)) err.items = '至少要有一樣的數量大於 0';
  if (!v.date) err.date = '請選一天';
  else if (v.date < TODAY) err.date = '不能早於今天';
  else if (!openHours(v.date)) err.date = '週一公休，請換一天';
  if (!err.date && !v.time) err.time = '請選時間';
  if (!v.name) err.name = '請填，例如陳小姐';
  if (!v.tel) err.tel = '請填';
  else if (!/^09\d{8}$/.test(v.tel)) err.tel = '要 09 開頭的 10 個數字';
  if (only) return only in err ? { [only]: err[only] } : {};
  return err;
}

const FIELD_OF = { items: 'q-caozai', date: 'f-date', time: 'f-time', name: 'f-name', tel: 'f-tel' };
const LABEL_OF = { items: '品項和數量', date: '取貨日期', time: '取貨時間', name: '稱呼', tel: '手機號碼' };

function showError(key, msg, bad = []) {
  const p = document.getElementById('err-' + key);
  if (!p) return;
  p.hidden = !msg;
  p.textContent = msg || '';
  if (key === 'items') {
    // 數量填錯時只標錯的那一格；一樣都沒填時四格都標
    const wrong = new Set(bad.map((b) => b.k));
    ITEM_KEYS.forEach((k) => document.getElementById('q-' + k)?.setAttribute('aria-invalid', msg && (!wrong.size || wrong.has(k)) ? 'true' : 'false'));
    return;
  }
  document.getElementById(FIELD_OF[key])?.setAttribute('aria-invalid', msg ? 'true' : 'false');
}

/* ================= 訂單詳情（手機從下面拉上來，桌機在右邊） ================= */

let sheetFor = null;
let openerKey = null;
let sheetUndo = null; // { id, text, fn }：面板裡最近一次可以復原的動作

function sheetHTML(o) {
  const lines = ITEM_KEYS.filter((k) => o.items[k] > 0).map((k) => {
    const p = PRODUCTS[k];
    return `<tr><th scope="row">${p.name}</th><td class="num-cell">${n(o.items[k])} ${p.unit}</td><td class="num-cell">${money(o.items[k] * p.price)}</td></tr>`;
  }).join('');
  const radios = STATUS_KEYS.map((s) => `
        <label class="seg__radio"><input type="radio" name="st" value="${s}" ${o.status === s ? 'checked' : ''}><span>${STATUS[s]}</span></label>`).join('');
  const rel = relDay(o.date);
  return `
    <div class="sheet__in">
      <header class="sheet__head">
        <div>
          <h2 class="sheet__title" id="sheet-title">${esc(o.name)}</h2>
          <p class="sheet__sub">${statusText(o.status)}</p>
        </div>
        <button class="iconbtn" type="button" data-close aria-label="關閉">${ICON.close}</button>
      </header>
      <dl class="facts">
        <div><dt>取貨</dt><dd>${rel ? `${rel}，` : ''}${dayName(o.date)}<span class="num">${o.time}</span></dd></div>
        <div><dt>電話</dt><dd class="num">${maskTel(o.tel)}</dd></div>
      </dl>
      <table class="lines">
        <caption class="visually-hidden">品項</caption>
        <tbody>${lines}</tbody>
        <tfoot><tr><th scope="row">合計（示意價格）</th><td></td><td class="num-cell">${money(orderTotal(o.items))}</td></tr></tfoot>
      </table>
      <fieldset class="seg seg--radio">
        <legend class="field__label">狀態</legend>
        ${radios}
      </fieldset>
      <p class="sheet__undo" id="sheet-undo" role="status"></p>
      <form class="notebox" id="note-form">
        <label class="field__label" for="sheet-note">備註</label>
        <textarea class="input input--area" id="sheet-note" rows="3" maxlength="${LIMIT.note}" placeholder="例：客人說會晚 10 分鐘">${esc(o.note)}</textarea>
        <div class="notebox__row"><span class="field__hint num" id="sheet-note-count">${o.note.length}／${LIMIT.note}</span><button class="btn btn--quiet" id="sheet-note-save" type="submit">存備註</button></div>
      </form>
    </div>`;
}

function syncSheet(params) {
  const dlg = $('#sheet');
  const id = Number(params.open);
  const o = id && orders.find((x) => x.id === id);
  if (!o) {
    if (dlg.open) dlg.close();
    sheetFor = null;
    sheetUndo = null;
    return;
  }
  if (sheetFor !== id) sheetUndo = null;
  if (!dlg.open) $('#toast').hidden = true; // 面板打開後，外面的提示列按不到，先收起來
  const active = dlg.open && dlg.contains(document.activeElement) ? (document.activeElement.id || (document.activeElement.name === 'st' ? 'st' : '')) : '';
  dlg.innerHTML = sheetHTML(o);
  sheetFor = id;
  if (!dlg.open) dlg.showModal();
  if (active === 'st') dlg.querySelector('input[name=st]:checked')?.focus();
  else if (active) document.getElementById(active)?.focus();
  if (sheetUndo && sheetUndo.id === id) {
    const u = sheetUndo;
    // 先放空的提示區，再填字，讀螢幕軟體才會念出來
    setTimeout(() => {
      const box = $('#sheet-undo');
      if (box && sheetUndo === u) box.innerHTML = `<span>${esc(u.text)}</span><button class="sheet__undo-btn" id="sheet-undo-btn" type="button">復原</button>`;
    }, 30);
  }
}

function closeSheetUrl() {
  const { view, params } = parseHash();
  if (!params.open) return;
  const p = { ...params };
  delete p.open;
  location.replace(link(view, p));
}

/* ================= 測試資料切換（只在網址有 test=1 時出現） ================= */

function renderTestbar(params) {
  const bar = $('#testbar');
  if (!params.test) { bar.hidden = true; return; }
  const { view } = parseHash();
  bar.hidden = false;
  bar.innerHTML = `<span class="testbar__label">測試資料</span>` + Object.entries(DATASETS).map(([k, d]) => {
    const p = { ...params, data: k };
    delete p.open;
    return `<a class="testbar__item" href="${link(view, p)}" ${DATA === k ? 'aria-current="true"' : ''}>${d.label}</a>`;
  }).join('');
}

/* ================= 路由 ================= */

const VIEWS = { today: viewToday, orders: viewOrders, giftbox: viewGift, new: viewNew };
let lastView = null;
let lastData = null;
let focusKey = null;

let lastGoodHash = '';
function route() {
  const { view, params, unknown } = parseHash();
  if (unknown && lastView) {
    // 不是畫面名稱的 #（例如 #main）：網址改回原本的畫面，不重畫，焦點移到主要內容
    history.replaceState(null, '', lastGoodHash || '#' + lastView);
    $('#main').focus();
    return;
  }
  lastGoodHash = location.hash;
  const dataKey = DATASETS[params.data] ? params.data : 'demo';
  if (dataKey !== lastData) { loadData(dataKey); lastData = dataKey; }
  $('#view').innerHTML = VIEWS[view](params);
  document.querySelectorAll('[data-view]').forEach((a) => {
    a.setAttribute('href', link(a.dataset.view));
    if (a.dataset.view === view) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
  renderTestbar(params);
  syncSheet(params);
  if (view === 'new') wireForm(params);
  revealSeg(document.querySelector('.seg--status [aria-current]')); // 重畫後，選中的那一個要在看得到的地方
  // 焦點：換畫面時移到標題；在同一個畫面裡點篩選，焦點留在那個篩選上
  if (focusKey) {
    const el = document.querySelector(`[data-focus="${focusKey}"]`);
    if (el) el.focus();
    focusKey = null;
  } else if (lastView !== null && lastView !== view) {
    const h = $('#view-title');
    if (h) h.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }
  lastView = view;
}

/* 手機上狀態篩選可以左右滑：右邊還有沒看到的，就在最右邊淡出 */
function segMore() {
  const s = document.querySelector('.seg--status');
  if (!s) return;
  const more = s.scrollWidth - s.clientWidth - s.scrollLeft > 2;
  s.toggleAttribute('data-more', more);
}
// 讓某一個篩選完整露出來：不在左邊外面、也不在右邊淡出的地方（品管退回必修 1）
function revealSeg(el) {
  const s = el && el.closest('.seg--status');
  if (!s || s.scrollWidth <= s.clientWidth) { segMore(); return; }
  const sr = s.getBoundingClientRect(), er = el.getBoundingClientRect();
  const edge = 8, fade = 56;
  if (er.left < sr.left + edge) s.scrollLeft -= sr.left + edge - er.left;
  else if (er.right > sr.right - fade) s.scrollLeft += er.right - (sr.right - fade);
  segMore();
}
document.addEventListener('scroll', (e) => { if (e.target instanceof Element && e.target.matches('.seg--status')) segMore(); }, true);
// 用鍵盤 Tab 到篩選時，也捲到看得到的地方
document.addEventListener('focusin', (e) => { if (e.target instanceof Element && e.target.closest('.seg--status')) revealSeg(e.target.closest('.seg__item')); });
window.addEventListener('resize', segMore);

/* ================= 操作 ================= */

let undoTimer = null;
// 提示列：滑鼠停在上面或焦點在裡面時，不會自己消失
function armToast(ms = 6000) {
  const el = $('#toast');
  clearTimeout(undoTimer);
  undoTimer = setTimeout(() => {
    if (el.matches(':hover') || el.contains(document.activeElement)) { armToast(2000); return; }
    el.hidden = true;
  }, ms);
}
function toast(text, undo) {
  const el = $('#toast');
  $('#toast-text').textContent = text;
  const btn = $('#toast-undo');
  btn.hidden = !undo;
  btn.onclick = undo ? () => { undo(); el.hidden = true; route(); } : null;
  el.hidden = false;
  armToast();
}
$('#toast').addEventListener('mouseenter', () => clearTimeout(undoTimer));
$('#toast').addEventListener('focusin', () => clearTimeout(undoTimer));
$('#toast').addEventListener('mouseleave', () => armToast(3000));
$('#toast').addEventListener('focusout', () => armToast(3000));

// 改狀態：詳情面板開著時，「復原」出現在面板裡；面板關著時，出現在下面的提示列
function setStatus(o, s) {
  const before = o.status;
  if (before === s) return;
  o.status = s;
  const undo = () => { o.status = before; };
  if ($('#sheet').open && sheetFor === o.id) {
    sheetUndo = { id: o.id, text: `已改成「${STATUS[s]}」`, fn: undo };
    route();
    return;
  }
  route();
  toast(`${o.name}：${STATUS[s]}`, undo);
}

// 在列表上按「已取貨」或「確認」之後，焦點留在同一列；那一列不見了就移到下一列
function refocusAfter(id, idx) {
  const view = $('#view');
  const same = view.querySelector(`.o [data-open="${id}"]`);
  const acts = [...view.querySelectorAll('[data-pick],[data-confirm]')];
  const el = same || acts[idx] || acts[idx - 1] || $('#toast-undo');
  if (el && !el.hidden) el.focus();
}

document.addEventListener('click', (e) => {
  const t = e.target;
  // 「跳到主要內容」不改網址（改了會被當成換畫面），直接把焦點移到這一頁的標題
  const skip = t.closest('.skip');
  if (skip) { e.preventDefault(); ($('#view-title') || $('#main')).focus(); return; }
  const act = t.closest('[data-pick],[data-confirm]');
  if (act) {
    const id = Number(act.dataset.pick || act.dataset.confirm);
    const o = orders.find((x) => x.id === id);
    if (!o) return;
    const idx = [...$('#view').querySelectorAll('[data-pick],[data-confirm]')].indexOf(act);
    setStatus(o, act.dataset.pick ? 'picked' : 'confirmed');
    refocusAfter(id, idx);
    return;
  }
  const open = t.closest('[data-open]');
  if (open) {
    openerKey = open.dataset.open;
    const { view, params } = parseHash();
    location.hash = link(view, { ...params, open: open.dataset.open });
    return;
  }
  if (t.closest('[data-close]')) { closeSheetUrl(); return; }
  const step = t.closest('[data-step]');
  if (step) {
    const input = document.getElementById('q-' + step.dataset.step);
    input.value = Math.max(0, Math.min(LIMIT.qty, (Number(input.value) || 0) + Number(step.dataset.d)));
    input.dispatchEvent(new Event('input', { bubbles: true }));
    return;
  }
  const seg = t.closest('[data-focus]');
  if (seg) focusKey = seg.dataset.focus;
});

// 點對話框外面的暗處也會關
$('#sheet').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) { closeSheetUrl(); return; }
  if (e.target.closest('#sheet-undo-btn') && sheetUndo) {
    const u = sheetUndo;
    sheetUndo = null;
    u.fn();
    route();
    $('#sheet-undo').textContent = '已復原';
    $('#sheet').querySelector('input[name=st]:checked')?.focus();
  }
});
$('#sheet').addEventListener('cancel', (e) => { e.preventDefault(); closeSheetUrl(); });
$('#sheet').addEventListener('close', () => {
  sheetUndo = null;
  if (openerKey) {
    const el = document.querySelector(`[data-open="${openerKey}"]`);
    if (el) el.focus();
    openerKey = null;
  }
});
$('#sheet').addEventListener('change', (e) => {
  if (e.target.name !== 'st' || !sheetFor) return;
  const o = orders.find((x) => x.id === sheetFor);
  if (o) setStatus(o, e.target.value);
});
$('#sheet').addEventListener('input', (e) => {
  if (e.target.id === 'sheet-note') $('#sheet-note-count').textContent = `${e.target.value.length}／${LIMIT.note}`;
});
$('#sheet').addEventListener('submit', (e) => {
  if (e.target.id !== 'note-form') return;
  e.preventDefault();
  const o = orders.find((x) => x.id === sheetFor);
  if (!o) return;
  const before = o.note;
  o.note = $('#sheet-note').value.trim();
  sheetUndo = { id: o.id, text: '備註存好了', fn: () => { o.note = before; } };
  route();
});

// 搜尋：邊打邊篩，網址跟著改（不會跳走，也不會把焦點弄丟）
document.addEventListener('input', (e) => {
  if (e.target.id !== 'q') return;
  const { params } = parseHash();
  const p = { ...params, q: e.target.value };
  history.replaceState(null, '', link('orders', p));
  $('#results').innerHTML = orderResults(p);
  document.querySelectorAll('.seg--status .seg__item').forEach((a) => {
    const u = new URLSearchParams(a.getAttribute('href').split('?')[1] || '');
    u.set('q', e.target.value);
    if (!e.target.value) u.delete('q');
    a.setAttribute('href', '#orders?' + u.toString());
  });
});

function wireForm(params) {
  const form = $('#new-form');
  if (!form) return;
  const touched = new Set();
  const refresh = () => {
    const v = readForm(form);
    $('#total').innerHTML = v.bad.length ? '數量有誤' : money(orderTotal(v.items));
    form.querySelector('.total__note').hidden = v.bad.length > 0;
    for (const k of touched) showError(k, validate(v, k)[k], v.bad);
  };
  form.addEventListener('input', (e) => {
    const id = e.target.id;
    if (id.startsWith('q-')) touched.add('items');
    if (id === 'f-note') $('#note-count').textContent = `${e.target.value.length}／${LIMIT.note}`;
    refresh();
  });
  form.addEventListener('change', (e) => {
    if (e.target.id === 'f-date') {
      const d = e.target.value;
      const sel = $('#f-time');
      sel.innerHTML = timeOptions(d, sel.value);
      sel.disabled = !!d && !openHours(d);
      $('#hint-date').textContent = d ? dayName(d) : '';
      touched.add('date');
    }
    refresh();
  });
  form.addEventListener('focusout', (e) => {
    const map = { 'f-date': 'date', 'f-time': 'time', 'f-name': 'name', 'f-tel': 'tel' };
    if (map[e.target.id] && e.target.value) touched.add(map[e.target.id]);
    if (map[e.target.id] && touched.has(map[e.target.id])) refresh();
  });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const v = readForm(form);
    const err = validate(v);
    Object.keys(FIELD_OF).forEach((k) => { touched.add(k); showError(k, err[k], v.bad); });
    const keys = Object.keys(err);
    const sum = $('#summary');
    if (keys.length) {
      sum.hidden = false;
      sum.innerHTML = `<p class="form__summary-title">有 ${n(keys.length)} 個地方要改</p><ul>${keys.map((k) => `<li><a href="#${FIELD_OF[k]}" data-jump="${FIELD_OF[k]}">${LABEL_OF[k]}：${err[k]}</a></li>`).join('')}</ul>`;
      sum.focus();
      return;
    }
    const o = { id: nextId++, date: v.date, time: v.time, name: v.name, tel: v.tel.slice(-3), items: v.items, status: 'confirmed', note: v.note };
    orders.push(o);
    location.hash = link('orders', { day: v.date });
    toast(`已新增：${o.name}，${dayShort(o.date)}${o.time}`, () => { orders.splice(orders.indexOf(o), 1); });
  });
  form.addEventListener('click', (e) => {
    const j = e.target.closest('[data-jump]');
    if (!j) return;
    e.preventDefault();
    const el = document.getElementById(j.dataset.jump);
    if (el) el.focus();
  });
  void params;
}

window.addEventListener('hashchange', route);
route();
