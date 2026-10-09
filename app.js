/* ==========================================================================
   GossensBesterMann – Offline-Lernapp mit Fächer-System (−5 … 0 … +5)
   Daten liegen ausschließlich lokal im Browser-Speicher des Geräts.
   ========================================================================== */
'use strict';
(() => {

const KEY = 'karteikarten-ap2';
const APP_VERSION = '1.0.0';
const MIN = -5;
const MAX = 5;
const LEVELS = Array.from({ length: MAX - MIN + 1 }, (_, i) => MIN + i);
const COLORS = ['blue', 'indigo', 'purple', 'pink', 'red', 'orange', 'yellow', 'green', 'mint', 'teal', 'cyan', 'brown'];
const SIZES = [10, 20, 50, 0]; // 0 = alle

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const clampLevel = (l) => clamp(l, MIN, MAX);
const fmtLevel = (l) => (l > 0 ? `+${l}` : l < 0 ? `−${-l}` : '0');
const plural = (n, one, many) => `${n.toLocaleString('de-DE')} ${n === 1 ? one : many}`;
const dayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
const isStandalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;

function el(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}
function levelColor(l) {
  if (l === 0) return 'var(--gray)';
  const p = 42 + Math.abs(l) * 11.6;
  return `color-mix(in srgb, var(${l < 0 ? '--red' : '--green'}) ${p}%, var(--gray))`;
}
function haptic(pattern) {
  if (DB && DB.settings.haptics && navigator.vibrate) { try { navigator.vibrate(pattern); } catch (e) { /* ignore */ } }
}
function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function fmtDate(ts) {
  if (!ts) return 'noch nie';
  const d = new Date(ts);
  const today = dayKey();
  const y = new Date(); y.setDate(y.getDate() - 1);
  const time = d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  if (dayKey(d) === today) return `heute, ${time}`;
  if (dayKey(d) === dayKey(y)) return `gestern, ${time}`;
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
function autoGrow(t) {
  t.style.height = 'auto';
  t.style.height = `${t.scrollHeight}px`;
}

// SF-Symbols-artige Icons
const svg = (d, sw = 1.9) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const ICON = {
  learn: svg('<rect x="3.5" y="8.5" width="17" height="12" rx="2.8"/><path d="M6.5 5.5h11M9 2.8h6"/>'),
  cards: svg('<rect x="3" y="4.5" width="18" height="15" rx="3.2"/><path d="M7 9.5h10M7 13.5h6.5"/>'),
  folder: svg('<path d="M3 7.6A2.6 2.6 0 0 1 5.6 5h3.2c.7 0 1.3.3 1.8.8l1 1.1c.4.5 1 .7 1.6.7h5.2A2.6 2.6 0 0 1 21 10.2v6.2a2.6 2.6 0 0 1-2.6 2.6H5.6A2.6 2.6 0 0 1 3 16.4z"/>'),
  gear: svg('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>', 1.7),
  plus: svg('<path d="M12 5v14M5 12h14"/>', 2.2),
  minus: svg('<path d="M5 12h14"/>', 2.2),
  mic: svg('<rect x="9" y="3" width="6" height="11.5" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/>', 2),
  x: svg('<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>', 2.2),
  check: svg('<path d="M5 12.5l4.5 4.5L19 7.5"/>', 2.4),
  undo: svg('<path d="M9 14L4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>', 2.1),
  chev: svg('<path d="M9 5l7 7-7 7"/>', 2.6),
  chevDown: svg('<path d="M6 9l6 6 6-6"/>', 2.4),
  search: svg('<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>', 2.1),
  bulb: svg('<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.6.5 1 1.2 1 2V16h5.2v-.2c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z"/>', 2),
  flip: svg('<path d="M4 12a8 8 0 0 1 13.7-5.6L20 8.5M20 4v4.5h-4.5M20 12a8 8 0 0 1-13.7 5.6L4 15.5M4 20v-4.5h4.5"/>', 2),
  flame: svg('<path d="M12 21c-3.9 0-7-2.8-7-6.6 0-2.6 1.4-4.6 3-6.2.3 1.6 1.2 2.8 2.4 3.4C10 8 11.5 5 14 3c.2 3 1.6 4.6 3 6.3 1.2 1.4 2 3 2 5.1C19 18.2 15.9 21 12 21z"/>', 2),
  shuffle: svg('<path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>', 2),
  layers: svg('<path d="M12 3l9 5-9 5-9-5 9-5z"/><path d="M3 13l9 5 9-5"/>', 2),
  trash: svg('<path d="M4 7h16M10 11v6M14 11v6M5.5 7l1 12a2 2 0 0 0 2 1.8h7a2 2 0 0 0 2-1.8l1-12M9 7V4.5h6V7"/>', 1.9),
  sparkles: svg('<path d="M11 3l1.7 4.6L17.3 9.3 12.7 11 11 15.6 9.3 11 4.7 9.3 9.3 7.6z"/><path d="M18.5 14.5l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9z"/>', 1.9),
  download: svg('<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>', 2),
  upload: svg('<path d="M12 16V5M7 10l5-5 5 5M5 20h14"/>', 2),
  text: svg('<path d="M5 6h14M5 10h14M5 14h9M5 18h6"/>', 2),
  phone: svg('<rect x="7" y="2.5" width="10" height="19" rx="2.6"/><path d="M11 18.5h2"/>', 2),
  wave: svg('<path d="M4 10v4M8 7v10M12 4v16M16 8v8M20 11v2"/>', 2.1),
  hand: svg('<path d="M12 3v6M8 5v6M16 5v7M4 9v3a8 8 0 0 0 16 0V8"/>', 2),
  reset: svg('<path d="M4 4v5h5"/><path d="M5.1 15a7.5 7.5 0 1 0 1.2-8.1L4 9"/>', 2),
  lock: svg('<rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>', 2),
  move: svg('<path d="M3 7.6A2.6 2.6 0 0 1 5.6 5h3.2c.7 0 1.3.3 1.8.8l1 1.1c.4.5 1 .7 1.6.7h5.2A2.6 2.6 0 0 1 21 10.2v6.2a2.6 2.6 0 0 1-2.6 2.6H5.6A2.6 2.6 0 0 1 3 16.4z"/><path d="M10 13h5M13 10.5l2.5 2.5-2.5 2.5"/>', 1.9),
  info: svg('<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.01"/>', 2),
  sort: svg('<path d="M7 4v16M3.5 16.5L7 20l3.5-3.5M17 20V4M13.5 7.5L17 4l3.5 3.5"/>', 2),
  share: svg('<path d="M12 15V3M8 7l4-4 4 4M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/>', 2),
};

// ---------------------------------------------------------------------------
// Datenhaltung
// ---------------------------------------------------------------------------

let DB = null;

function defaultDB() {
  return {
    version: 1,
    categories: [{ id: 'inbox', name: 'Unsortiert', color: 'gray', keywords: [], created: Date.now() }],
    cards: [],
    log: {},
    settings: {
      haptics: true,
      voicePunct: true,
      voiceAutoNext: false,
      sessionSize: 20,
      lastCategory: 'inbox',
      cardSort: 'new',
      installDismissed: false,
    },
    meta: { lastBackup: 0, created: Date.now() },
  };
}

function normalize(d) {
  const def = defaultDB();
  d = d && typeof d === 'object' ? d : {};
  const cats = (Array.isArray(d.categories) ? d.categories : [])
    .filter((c) => c && c.id != null && typeof c.name === 'string')
    .map((c) => {
      const cat = {
        id: String(c.id),
        name: c.name.trim() || 'Ohne Namen',
        color: c.id === 'inbox' ? 'gray' : (COLORS.includes(c.color) ? c.color : 'blue'),
        keywords: Array.isArray(c.keywords) ? c.keywords.map((k) => String(k).trim()).filter(Boolean) : [],
        created: +c.created || Date.now(),
        parentId: c.parentId ? String(c.parentId) : null,
      };
      if (c.kind === 'group' && c.id !== 'inbox') cat.kind = 'group';
      if (Number.isFinite(c.order)) cat.order = c.order;
      if (c.deck) cat.deck = true;
      return cat;
    });
  const seen = new Set();
  const categories = cats.filter((c) => (seen.has(c.id) ? false : seen.add(c.id)));
  if (!categories.some((c) => c.id === 'inbox')) categories.unshift(def.categories[0]);
  // Bereiche (Gruppen) sind nie verschachtelt; Kategorien verweisen nur auf existierende Bereiche
  const groupIds = new Set(categories.filter((c) => c.kind === 'group').map((c) => c.id));
  for (const c of categories) {
    if (c.kind === 'group' || c.id === 'inbox' || !groupIds.has(c.parentId)) c.parentId = null;
  }
  // Karten liegen immer in einer Kategorie, nie direkt in einem Bereich
  const ids = new Set(categories.filter((c) => c.kind !== 'group').map((c) => c.id));
  const cardIds = new Set();
  const cards = (Array.isArray(d.cards) ? d.cards : [])
    .filter((c) => c && (c.front || c.back))
    .map((c) => {
      let id = String(c.id || uid());
      if (cardIds.has(id)) id = uid();
      cardIds.add(id);
      return {
        id,
        front: String(c.front || ''),
        back: String(c.back || ''),
        hint: String(c.hint || ''),
        categoryId: ids.has(String(c.categoryId)) ? String(c.categoryId) : 'inbox',
        level: clampLevel(Math.round(+c.level || 0)),
        created: +c.created || Date.now(),
        updated: +c.updated || +c.created || Date.now(),
        right: Math.max(0, +c.right || 0),
        wrong: Math.max(0, +c.wrong || 0),
        last: +c.last || 0,
        ...(c.deck ? { deck: true } : {}),
      };
    });
  const log = {};
  if (d.log && typeof d.log === 'object') {
    for (const [k, v] of Object.entries(d.log)) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(k) && v) log[k] = { r: Math.max(0, +v.r || 0), w: Math.max(0, +v.w || 0) };
    }
  }
  return {
    version: 1,
    categories,
    cards,
    log,
    settings: { ...def.settings, ...(d.settings && typeof d.settings === 'object' ? d.settings : {}) },
    meta: { ...def.meta, ...(d.meta && typeof d.meta === 'object' ? d.meta : {}) },
  };
}

function loadDB() {
  try {
    const raw = localStorage.getItem(KEY);
    DB = raw ? normalize(JSON.parse(raw)) : defaultDB();
  } catch (e) {
    console.error(e);
    // Beschädigte Daten nicht überschreiben: Sicherheitskopie behalten
    try { const raw = localStorage.getItem(KEY); if (raw) localStorage.setItem(`${KEY}-corrupt-${Date.now()}`, raw); } catch (e2) { /* ignore */ }
    DB = defaultDB();
  }
}

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(DB));
    return true;
  } catch (e) {
    console.error(e);
    toast('Speichern fehlgeschlagen – ist der Speicher voll?', 'error');
    return false;
  }
}

const catById = (id) => DB.categories.find((c) => c.id === id);
const cardById = (id) => DB.cards.find((c) => c.id === id);
const cardsIn = (catId) => DB.cards.filter((c) => c.categoryId === catId);
const isGroup = (c) => !!c && c.kind === 'group';
const byOrder = (a, b) => (a.order ?? 1e9) - (b.order ?? 1e9) || a.name.localeCompare(b.name, 'de', { sensitivity: 'base' });
const groups = () => DB.categories.filter(isGroup).sort(byOrder);
const childrenOf = (gid) => DB.categories.filter((c) => !isGroup(c) && c.parentId === gid && c.id !== 'inbox').sort(byOrder);
const ungrouped = () => [
  ...DB.categories.filter((c) => !isGroup(c) && !c.parentId && c.id !== 'inbox').sort(byOrder),
  catById('inbox'),
];
const cardsInGroup = (gid) => {
  const ids = new Set(childrenOf(gid).map((c) => c.id));
  return DB.cards.filter((c) => ids.has(c.categoryId));
};
// Kurzname eines Bereichs: „Klausur 1: IT-Systemlösung“ → „Klausur 1“
const groupShort = (g) => g.name.split(':')[0].trim();
const catPath = (c) => {
  const g = c.parentId && catById(c.parentId);
  return g ? `${groupShort(g)} › ${c.name}` : c.name;
};
// Alle Kategorien (ohne Bereiche) in Anzeige-Reihenfolge: nach Bereich, dann ohne Bereich, „Unsortiert“ zuletzt
function sortedCats() {
  return [...groups().flatMap((g) => childrenOf(g.id)), ...ungrouped()];
}
function levelCounts(cards = DB.cards) {
  const m = Object.fromEntries(LEVELS.map((l) => [l, 0]));
  for (const c of cards) m[c.level]++;
  return m;
}
function nextColor() {
  const used = DB.categories.map((c) => c.color);
  return COLORS.find((c) => !used.includes(c)) || COLORS[DB.categories.length % COLORS.length];
}
function createCategory(name, extra = {}) {
  const cat = { id: uid(), name: name.trim(), color: nextColor(), keywords: [], created: Date.now(), parentId: null, ...extra };
  DB.categories.push(cat);
  return cat;
}
const findCatByName = (name) => DB.categories.find((c) => !isGroup(c) && c.name.toLowerCase() === name.trim().toLowerCase());
function streak() {
  let n = 0;
  const d = new Date();
  const has = (k) => DB.log[k] && DB.log[k].r + DB.log[k].w > 0;
  if (!has(dayKey(d))) d.setDate(d.getDate() - 1);
  while (has(dayKey(d))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}

// ---------------------------------------------------------------------------
// Physik: Federn, Geschwindigkeit, Momentum (nach Apples „Designing Fluid Interfaces“)
// ---------------------------------------------------------------------------

class Spring {
  constructor(value, opts = {}, onUpdate = () => {}) {
    this.x = value;
    this.v = 0;
    this.target = value;
    this.damping = opts.damping ?? 1;
    this.response = opts.response ?? 0.4;
    this.precision = opts.precision ?? 0.5;
    this.onUpdate = onUpdate;
    this.raf = 0;
  }
  set(value) {
    this.stop();
    this.x = this.target = value;
    this.v = 0;
    this.onUpdate(value);
  }
  to(target, opts = {}) {
    if (opts.damping != null) this.damping = opts.damping;
    if (opts.response != null) this.response = opts.response;
    if (opts.velocity != null) this.v = opts.velocity;
    this.target = target;
    this.onRest = opts.onRest || null;
    if (reduceMotion.matches) {
      this.set(target);
      const cb = this.onRest; this.onRest = null;
      if (cb) cb();
      return;
    }
    if (!this.raf) {
      this.last = performance.now();
      this.raf = requestAnimationFrame((t) => this.tick(t));
    }
  }
  tick(now) {
    const dt = Math.min((now - this.last) / 1000, 1 / 24);
    this.last = now;
    const k = (2 * Math.PI / this.response) ** 2;
    const c = (4 * Math.PI * this.damping) / this.response;
    const steps = Math.max(1, Math.ceil(dt / (1 / 240)));
    const h = dt / steps;
    for (let i = 0; i < steps; i++) {
      const a = -k * (this.x - this.target) - c * this.v;
      this.v += a * h;
      this.x += this.v * h;
    }
    if (Math.abs(this.v) < this.precision * 6 && Math.abs(this.x - this.target) < this.precision) {
      this.x = this.target;
      this.v = 0;
      this.raf = 0;
      this.onUpdate(this.x);
      const cb = this.onRest; this.onRest = null;
      if (cb) cb();
      return;
    }
    this.onUpdate(this.x);
    this.raf = requestAnimationFrame((t) => this.tick(t));
  }
  stop() {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
  }
}

class VelocityTracker {
  constructor() { this.pts = []; }
  add(x, y, t = performance.now()) {
    this.pts.push({ x, y, t });
    while (this.pts.length > 2 && t - this.pts[0].t > 100) this.pts.shift();
  }
  get() {
    if (this.pts.length < 2) return { x: 0, y: 0 };
    const a = this.pts[0];
    const b = this.pts[this.pts.length - 1];
    const dt = (b.t - a.t) / 1000;
    if (dt <= 0) return { x: 0, y: 0 };
    return { x: (b.x - a.x) / dt, y: (b.y - a.y) / dt };
  }
}
const project = (v, d = 0.998) => ((v / 1000) * d) / (1 - d);
const rubber = (o, dim, c = 0.55) => (o * dim * c) / (dim + c * Math.abs(o));

// ---------------------------------------------------------------------------
// Overlay-Stapel inkl. Android-Zurück-Taste
// ---------------------------------------------------------------------------

const stack = [];
let armed = false;
let pendingBack = false;

function arm() {
  if (!armed && !pendingBack) {
    history.pushState({ overlay: true }, '');
    armed = true;
  }
}
function pushOverlay(o) {
  stack.push(o);
  arm();
  o.show();
}
function closeOverlay(o, opts) {
  const i = stack.indexOf(o);
  if (i < 0) return;
  stack.splice(i, 1);
  o.hide(opts);
  if (!stack.length && armed && !pendingBack) {
    pendingBack = true;
    armed = false;
    history.back();
  }
}
window.addEventListener('popstate', () => {
  if (pendingBack) {
    pendingBack = false;
    if (stack.length) arm();
    return;
  }
  armed = false;
  const top = stack[stack.length - 1];
  if (!top) return;
  arm();
  if (top.onBack) top.onBack(); else closeOverlay(top);
});
const topOverlay = () => stack[stack.length - 1];

// App im Hintergrund zurückschieben, wenn ein Sheet offen ist (iOS-Kartenstapel)
function pushBack(p) {
  const app = $('#app');
  if (p <= 0.001) {
    app.style.transform = '';
    app.style.borderRadius = '';
    document.body.classList.remove('pushed');
    return;
  }
  document.body.classList.add('pushed');
  const s = 1 - 0.06 * p;
  app.style.transform = `translate3d(0, ${p * 10}px, 0) scale(${s})`;
  app.style.borderRadius = `${p * 12}px`;
}

// ---------------------------------------------------------------------------
// Sheet
// ---------------------------------------------------------------------------

function openSheet({ title, body, left, right, compact, onMount, beforeClose, onClose }) {
  const root = el(`
    <div class="overlay">
      <div class="scrim"></div>
      <div class="sheet ${compact ? 'compact' : ''}" role="dialog" aria-modal="true" aria-label="${esc(title)}">
        <div class="sheet-grab"><div class="grabber"></div></div>
        <header class="sheet-nav">
          <div class="sheet-nav-l">${left ? `<button class="nav-btn" data-sheet="left">${esc(left.label)}</button>` : ''}</div>
          <h2 class="sheet-title">${esc(title)}</h2>
          <div class="sheet-nav-r">${right ? `<button class="nav-btn ${right.bold ? 'bold' : ''}" data-sheet="right">${esc(right.label)}</button>` : ''}</div>
        </header>
        <div class="sheet-body">${body}</div>
      </div>
    </div>`);
  const sheetEl = $('.sheet', root);
  const scrim = $('.scrim', root);
  const isBase = !stack.some((o) => o.kind === 'sheet');
  let H = 800;
  const spring = new Spring(H, { damping: 1, response: 0.38, precision: 0.5 }, (y) => {
    sheetEl.style.transform = `translate3d(0, ${y}px, 0)`;
    const p = clamp(1 - y / H, 0, 1);
    scrim.style.opacity = String(p);
    // Beim Schließen nicht gegen ein neu geöffnetes Sheet „kämpfen“
    if (isBase && !(closing && stack.some((o) => o.kind === 'sheet'))) pushBack(p);
  });
  let closing = false;
  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    spring.stop();
    root.remove();
    if (isBase && !stack.some((o) => o.kind === 'sheet')) pushBack(0);
  };

  const sheet = {
    kind: 'sheet',
    root,
    el: sheetEl,
    body: $('.sheet-body', root),
    show() {
      $('#overlays').appendChild(root);
      H = sheetEl.offsetHeight || window.innerHeight;
      spring.set(H);
      requestAnimationFrame(() => spring.to(0, { damping: 1, response: 0.4 }));
      // nach dem Return von openSheet, aber noch vor dem ersten Frame
      if (onMount) queueMicrotask(() => onMount(sheet));
    },
    hide(opts = {}) {
      Voice.stop();
      if (document.activeElement && root.contains(document.activeElement)) document.activeElement.blur();
      H = sheetEl.offsetHeight || H;
      closing = true;
      root.style.pointerEvents = 'none';
      spring.to(H, {
        damping: 1,
        response: 0.36,
        velocity: opts.velocity,
        onRest: finish,
      });
      // Fallback, falls keine Animationsframes laufen (z. B. App im Hintergrund)
      setTimeout(finish, 1500);
      if (onClose) onClose();
    },
    close(opts) { closeOverlay(sheet, opts); },
    async tryClose(opts) {
      if (beforeClose && !(await beforeClose())) { spring.to(0, { damping: 0.85, response: 0.35 }); return; }
      closeOverlay(sheet, opts);
    },
    onBack() { sheet.tryClose(); },
    setRight(label, disabled) {
      const b = $('[data-sheet="right"]', root);
      if (!b) return;
      if (label != null) b.textContent = label;
      b.disabled = !!disabled;
    },
  };

  root.addEventListener('click', (e) => {
    if (e.target === scrim) sheet.tryClose();
    const b = e.target.closest('[data-sheet]');
    if (!b) return;
    if (b.dataset.sheet === 'left') (left.action || (() => sheet.tryClose()))(sheet);
    if (b.dataset.sheet === 'right') (right.action || (() => sheet.close()))(sheet);
  });

  // Zum Schließen nach unten ziehen – 1:1, Gummiband nach oben, Momentum-Projektion
  let drag = null;
  const onDown = (e) => {
    if (e.button !== 0 || e.target.closest('button')) return;
    drag = { id: e.pointerId, y0: e.clientY, start: spring.x, vt: new VelocityTracker() };
    drag.vt.add(0, e.clientY);
    spring.stop();
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onMove = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    drag.vt.add(0, e.clientY);
    const raw = drag.start + (e.clientY - drag.y0);
    spring.set(raw >= 0 ? raw : -rubber(-raw, H, 0.4));
  };
  const onUp = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const v = drag.vt.get().y;
    drag = null;
    const projected = spring.x + project(v);
    if (projected > H * 0.45 && v > -100) sheet.tryClose({ velocity: v });
    else spring.to(0, { velocity: v, damping: 0.86, response: 0.35 });
  };
  for (const zone of [$('.sheet-grab', root), $('.sheet-nav', root)]) {
    zone.addEventListener('pointerdown', onDown);
    zone.addEventListener('pointermove', onMove);
    zone.addEventListener('pointerup', onUp);
    zone.addEventListener('pointercancel', onUp);
  }

  pushOverlay(sheet);
  return sheet;
}

// ---------------------------------------------------------------------------
// Dialoge: Alert, Prompt, Action Sheet
// ---------------------------------------------------------------------------

function alertDialog({ title, message, buttons, input }) {
  return new Promise((resolve) => {
    const root = el(`
      <div class="overlay dialog-overlay">
        <div class="scrim"></div>
        <div class="alert" role="alertdialog" aria-label="${esc(title)}">
          <div class="alert-body">
            <div class="alert-title">${esc(title)}</div>
            ${message ? `<div class="alert-msg">${esc(message)}</div>` : ''}
            ${input ? `<input class="alert-input" type="text" value="${esc(input.value || '')}" placeholder="${esc(input.placeholder || '')}" autocomplete="off" enterkeyhint="done">` : ''}
          </div>
          <div class="alert-buttons ${buttons.length > 2 ? 'stack' : ''}">
            ${buttons.map((b, i) => `<button data-i="${i}" class="${b.style || ''}">${esc(b.label)}</button>`).join('')}
          </div>
        </div>
      </div>`);
    const box = $('.alert', root);
    const scrim = $('.scrim', root);
    const inp = $('.alert-input', root);
    const anim = new Spring(0, { damping: 1, response: 0.3, precision: 0.002 }, (p) => {
      box.style.opacity = String(clamp(p, 0, 1));
      box.style.transform = `scale(${1.12 - 0.12 * p})`;
      scrim.style.opacity = String(clamp(p, 0, 1));
    });
    let done = false;
    const finish = (i) => {
      if (done) return;
      done = true;
      const b = buttons[i];
      closeOverlay(ov);
      if (input) resolve(b && b.value ? inp.value.trim() : null);
      else resolve(b ? b.value : null);
    };
    const ov = {
      kind: 'dialog',
      show() {
        $('#overlays').appendChild(root);
        anim.to(1);
        if (inp) setTimeout(() => { inp.focus(); inp.select(); }, 60);
      },
      hide() {
        root.style.pointerEvents = 'none';
        if (inp) inp.blur();
        anim.to(0, { response: 0.22, onRest: () => root.remove() });
        setTimeout(() => root.remove(), 1500);
      },
      onBack() { finish(buttons.findIndex((b) => b.cancel)); },
    };
    root.addEventListener('click', (e) => {
      const b = e.target.closest('[data-i]');
      if (b) finish(+b.dataset.i);
    });
    if (inp) {
      inp.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); finish(buttons.findIndex((b) => b.value)); }
      });
    }
    pushOverlay(ov);
  });
}

const confirmDialog = async ({ title, message, confirm = 'OK', destructive = false }) =>
  !!(await alertDialog({
    title,
    message,
    buttons: [
      { label: 'Abbrechen', value: false, cancel: true },
      { label: confirm, value: true, style: destructive ? 'destructive bold' : 'bold' },
    ],
  }));

const promptDialog = ({ title, message, placeholder, value, confirm = 'OK' }) =>
  alertDialog({
    title,
    message,
    input: { placeholder, value },
    buttons: [
      { label: 'Abbrechen', value: false, cancel: true },
      { label: confirm, value: true, style: 'bold' },
    ],
  });

function actionSheet({ title, message, actions }) {
  return new Promise((resolve) => {
    const root = el(`
      <div class="overlay dialog-overlay">
        <div class="scrim"></div>
        <div class="asheet" role="dialog" aria-label="${esc(title || 'Aktionen')}">
          <div class="asheet-group">
            ${title || message ? `<div class="asheet-head">${title ? `<b>${esc(title)}</b>` : ''}${esc(message || '')}</div>` : ''}
            ${actions.map((a, i) => `<button data-i="${i}" class="${a.style || ''}">${esc(a.label)}</button>`).join('')}
          </div>
          <div class="asheet-group cancel"><button data-i="-1">Abbrechen</button></div>
        </div>
      </div>`);
    const box = $('.asheet', root);
    const scrim = $('.scrim', root);
    let H = 400;
    const sp = new Spring(H, { damping: 1, response: 0.35 }, (y) => {
      box.style.transform = `translate3d(0, ${y}px, 0)`;
      scrim.style.opacity = String(clamp(1 - y / H, 0, 1));
    });
    let done = false;
    const finish = (i) => {
      if (done) return;
      done = true;
      closeOverlay(ov);
      resolve(i >= 0 ? actions[i].value : null);
    };
    const ov = {
      kind: 'dialog',
      show() {
        $('#overlays').appendChild(root);
        H = box.offsetHeight + 40;
        sp.set(H);
        requestAnimationFrame(() => sp.to(0));
      },
      hide() { root.style.pointerEvents = 'none'; sp.to(H, { onRest: () => root.remove() }); setTimeout(() => root.remove(), 1500); },
      onBack() { finish(-1); },
    };
    root.addEventListener('click', (e) => {
      if (e.target === scrim) return finish(-1);
      const b = e.target.closest('[data-i]');
      if (b) finish(+b.dataset.i);
    });
    pushOverlay(ov);
  });
}

function toast(msg, kind = 'ok') {
  const host = $('#toast-host');
  while (host.children.length > 2) host.firstElementChild.remove();
  const t = el(`<div class="toast ${kind}" role="status">${kind === 'error' ? ICON.info : ICON.check}<span>${esc(msg)}</span></div>`);
  host.appendChild(t);
  requestAnimationFrame(() => requestAnimationFrame(() => t.classList.add('in')));
  setTimeout(() => {
    t.classList.remove('in');
    t.classList.add('out');
    setTimeout(() => t.remove(), 450);
  }, kind === 'error' ? 4500 : 2000);
}

// ---------------------------------------------------------------------------
// Spracherkennung (Web Speech API, Deutsch)
// ---------------------------------------------------------------------------

const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
// \u0001 markiert ein Satzende, nach dem großgeschrieben wird
const PUNCT = [
  [/\s*\b(neue zeile|neuer absatz|zeilenumbruch)\b\s*/gi, '\n\u0001'],
  [/\s*\bdoppelpunkt\b/gi, ':'],
  [/\s*\bsemikolon\b/gi, ';'],
  [/\s*\bfragezeichen\b/gi, '?\u0001'],
  [/\s*\bausrufezeichen\b/gi, '!\u0001'],
  [/\s*\bkomma\b/gi, ','],
  // „Punkt-zu-Punkt“ bleibt ein Wort
  [/(?<!\b(zu|für)[\s-]*)\s*\bpunkt\b(?![\s-]*(zu|für)\b)/gi, '.\u0001'],
];

const Voice = {
  rec: null,
  target: null,
  btn: null,
  local: null, // 'available' | 'downloadable' | 'downloading' | 'unavailable' | null (API fehlt)
  get supported() { return !!SR; },

  async checkLocal() {
    if (!SR) return (this.local = null);
    try {
      if (typeof SR.available === 'function') this.local = await SR.available({ langs: ['de-DE'], processLocally: true });
      else if (typeof SR.availableOnDevice === 'function') this.local = await SR.availableOnDevice('de-DE');
      else this.local = null;
    } catch (e) { this.local = null; }
    return this.local;
  },
  get canInstallLocal() {
    return !!SR && (typeof SR.install === 'function' || typeof SR.installOnDevice === 'function');
  },
  async installLocal() {
    if (typeof SR.install === 'function') return SR.install({ langs: ['de-DE'], processLocally: true });
    if (typeof SR.installOnDevice === 'function') return SR.installOnDevice('de-DE');
    throw new Error('unsupported');
  },

  toggle(textarea, btn, onEnd) {
    if (this.rec) {
      const same = this.target === textarea;
      this.stop();
      if (same) return;
    }
    this.start(textarea, btn, onEnd);
  },

  start(textarea, btn, onEnd) {
    if (!SR) {
      toast('Spracheingabe wird hier nicht unterstützt – nutze das Mikrofon deiner Tastatur.', 'error');
      return;
    }
    let rec;
    try { rec = new SR(); } catch (e) { toast('Spracheingabe konnte nicht starten.', 'error'); return; }
    rec.lang = 'de-DE';
    rec.interimResults = true;
    rec.continuous = false;
    rec.maxAlternatives = 1;
    if (this.local === 'available') {
      try {
        if ('processLocally' in rec) rec.processLocally = true;
        else if ('mode' in rec) rec.mode = 'ondevice-preferred';
      } catch (e) { /* ignore */ }
    }
    const base = textarea.value;
    const needsSpace = base.length > 0 && !/\s$/.test(base);
    const sentenceStart = !base.trim() || /[.!?:]\s*$|\n\s*$/.test(base);
    let got = false;

    rec.onresult = (e) => {
      let txt = '';
      for (let i = 0; i < e.results.length; i++) txt += e.results[i][0].transcript;
      txt = this.post(txt, sentenceStart);
      if (!txt) return;
      got = true;
      const join = needsSpace && !/^[.,:;!?\n]/.test(txt) ? ' ' : '';
      textarea.value = base + join + txt;
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
    };
    rec.onerror = (e) => {
      const msg = {
        'not-allowed': 'Mikrofon-Zugriff verweigert. Erlaube ihn in den Chrome-Website-Einstellungen.',
        'service-not-allowed': 'Spracherkennung ist auf diesem Gerät nicht erlaubt.',
        network: navigator.onLine
          ? 'Netzwerkfehler bei der Spracherkennung.'
          : 'Offline nicht verfügbar. Lade das Offline-Sprachpaket in den Einstellungen – oder nutze das Mikrofon der Gboard-Tastatur.',
        'no-speech': 'Nichts gehört – tippe aufs Mikrofon und sprich.',
        'audio-capture': 'Kein Mikrofon gefunden.',
        'language-not-supported': 'Deutsch wird von der Spracherkennung nicht unterstützt.',
      }[e.error];
      if (msg) toast(msg, 'error');
    };
    rec.onend = () => {
      const manual = rec._manual;
      if (this.rec === rec) this.cleanup();
      if (!manual && onEnd) onEnd(got);
    };

    this.rec = rec;
    this.target = textarea;
    this.btn = btn;
    btn.classList.add('listening');
    btn.setAttribute('aria-pressed', 'true');
    const group = btn.closest('.form-group');
    if (group) group.classList.add('listening');
    haptic(8);
    try {
      rec.start();
    } catch (e) {
      this.cleanup();
      toast('Spracheingabe konnte nicht starten.', 'error');
    }
  },

  stop() {
    if (!this.rec) return;
    this.rec._manual = true;
    try { this.rec.stop(); } catch (e) { /* ignore */ }
    this.cleanup();
  },

  cleanup() {
    if (this.btn) {
      this.btn.classList.remove('listening');
      this.btn.setAttribute('aria-pressed', 'false');
      const group = this.btn.closest('.form-group');
      if (group) group.classList.remove('listening');
    }
    this.rec = null;
    this.target = null;
    this.btn = null;
  },

  post(t, sentenceStart) {
    t = t.replace(/\s+/g, ' ').trim();
    if (!t) return '';
    if (DB.settings.voicePunct) {
      for (const [re, rep] of PUNCT) t = t.replace(re, rep);
      t = t.replace(/\u0001(\s*)([a-zäöü])/g, (m, s, ch) => s + ch.toUpperCase()).replace(/\u0001/g, '');
      t = t.replace(/\n +/g, '\n').trim();
    }
    if (sentenceStart) t = t.charAt(0).toUpperCase() + t.slice(1);
    return t;
  },
};

// ---------------------------------------------------------------------------
// Automatische Kategorie-Zuordnung (Stichwörter + gelernte Wortprofile)
// ---------------------------------------------------------------------------

const STOP = new Set(('der die das den dem des ein eine einer eines einem einen und oder aber nicht ist sind war waren wird werden wurde wurden mit von für auf aus bei nach über unter vor zum zur im in am an als auch wie was wer wo wann warum wieso welche welcher welches welchen man sich sie er es wir ihr ich du kann können könnte muss müssen soll sollen sollte dass wenn dann noch nur schon sehr mehr mal bis durch gegen ohne um hat haben hatte gibt ja nein so diese dieser dieses diesem diesen jede jeder jedes alle allem allen kein keine keinen beim vom sowie bzw usw etc nennen nenne nennt erkläre erklären erklärt beschreibe beschreiben beschreibt definiere definieren definition unterschied unterschiede zwischen bitte drei zwei vier fünf beispiel beispiele welchem wofür wozu steht stehen bedeutet bedeutung begriff') .split(/\s+/));

function stem(w) {
  if (w.length > 7) return w.replace(/(ungen|ung|heit|keit|en|er|es|e|n|s)$/, '');
  if (w.length > 4) return w.replace(/(en|er|e|s|n)$/, '');
  return w;
}
function tokens(text) {
  return String(text).toLowerCase()
    .split(/[^a-z0-9äöüß]+/)
    .filter((w) => w.length >= 3 && !STOP.has(w))
    .map(stem);
}
function containsTerm(low, term) {
  const t = term.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^a-z0-9äöüß])${t}`, 'i').test(low);
}
function buildModel() {
  const m = new Map();
  for (const c of DB.categories) {
    if (c.id === 'inbox' || isGroup(c)) continue;
    m.set(c.id, {
      tf: new Map(),
      n: 0,
      kw: c.keywords.map((k) => k.toLowerCase()).filter((k) => k.length >= 2),
      kwTok: new Set(c.keywords.flatMap(tokens)),
      nameTok: new Set(tokens(c.name)),
    });
  }
  for (const card of DB.cards) {
    const e = m.get(card.categoryId);
    if (!e) continue;
    e.n++;
    for (const t of new Set(tokens(`${card.front} ${card.back} ${card.hint}`))) e.tf.set(t, (e.tf.get(t) || 0) + 1);
  }
  const df = new Map();
  for (const e of m.values()) {
    for (const t of new Set([...e.tf.keys(), ...e.kwTok, ...e.nameTok])) df.set(t, (df.get(t) || 0) + 1);
  }
  return { m, df, nCats: m.size };
}
function suggestCategory(text, model = buildModel(), exclude = null) {
  if (!model.nCats || !text.trim()) return null;
  const low = text.toLowerCase();
  const toks = new Set(tokens(text));
  const exToks = exclude ? new Set(tokens(`${exclude.front} ${exclude.back} ${exclude.hint}`)) : null;
  let best = null;
  let bestS = 0;
  let second = 0;
  for (const [id, e] of model.m) {
    let s = 0;
    for (const kw of e.kw) if (containsTerm(low, kw)) s += 4;
    if (e.kwTok.size || e.nameTok.size) {
      for (const t of toks) {
        if (e.kwTok.has(t)) s += 1.5;
        if (e.nameTok.has(t)) s += 2.5;
      }
    }
    const own = exclude && exclude.categoryId === id;
    const n = e.n - (own ? 1 : 0);
    if (n > 0) {
      for (const t of toks) {
        let tf = e.tf.get(t) || 0;
        if (own && exToks.has(t)) tf--;
        if (tf <= 0) continue;
        const idf = Math.log(1 + model.nCats / (model.df.get(t) || 1));
        s += (0.45 + tf / n) * idf;
      }
    }
    if (s > bestS) { second = bestS; bestS = s; best = id; } else if (s > second) second = s;
  }
  if (!best || bestS < 1.2 || bestS < second * 1.2) return null;
  return { id: best, score: bestS };
}

// ---------------------------------------------------------------------------
// Lernlogik
// ---------------------------------------------------------------------------

// Gewicht für „Schwächen zuerst“: −5 → 32×, 0 → ~5,7×, +5 → 1×
const weightOf = (level) => 2 ** ((MAX - level) / 2);

function poolFor(spec) {
  if (spec.type === 'category') return DB.cards.filter((c) => c.categoryId === spec.categoryId);
  if (spec.type === 'group') return cardsInGroup(spec.groupId);
  if (spec.type === 'level') return DB.cards.filter((c) => c.level === spec.level);
  if (spec.type === 'retry') return spec.ids.map(cardById).filter(Boolean);
  return DB.cards;
}
function buildQueue(spec) {
  const pool = poolFor(spec);
  if (!pool.length) return [];
  const size = spec.count || 0;
  if (spec.type === 'weighted') {
    const n = size || pool.length;
    const gap = Math.min(5, Math.floor(pool.length / 2));
    const recent = [];
    const out = [];
    for (let i = 0; i < n; i++) {
      const cand = pool.filter((c) => !recent.includes(c.id));
      const total = cand.reduce((a, c) => a + weightOf(c.level), 0);
      let r = Math.random() * total;
      let pick = cand[cand.length - 1];
      for (const c of cand) { r -= weightOf(c.level); if (r <= 0) { pick = c; break; } }
      out.push(pick.id);
      recent.push(pick.id);
      if (recent.length > gap) recent.shift();
    }
    return out;
  }
  const ids = shuffle(pool.map((c) => c.id));
  return size && spec.type !== 'retry' ? ids.slice(0, size) : ids;
}

function rateCard(card, correct) {
  const rec = {
    id: card.id,
    correct,
    from: card.level,
    prev: { right: card.right, wrong: card.wrong, last: card.last },
    day: dayKey(),
  };
  card.level = clampLevel(card.level + (correct ? 1 : -1));
  if (correct) card.right++; else card.wrong++;
  card.last = Date.now();
  rec.to = card.level;
  const lg = DB.log[rec.day] || (DB.log[rec.day] = { r: 0, w: 0 });
  if (correct) lg.r++; else lg.w++;
  save();
  return rec;
}
function undoRating(rec) {
  const card = cardById(rec.id);
  if (card) {
    card.level = rec.from;
    card.right = rec.prev.right;
    card.wrong = rec.prev.wrong;
    card.last = rec.prev.last;
  }
  const lg = DB.log[rec.day];
  if (lg) { if (rec.correct) lg.r = Math.max(0, lg.r - 1); else lg.w = Math.max(0, lg.w - 1); }
  save();
}

// ---------------------------------------------------------------------------
// UI-Zustand & Rendering
// ---------------------------------------------------------------------------

const UI = {
  tab: 'learn',
  cardsFilter: 'all',
  search: '',
  select: false,
  selected: new Set(),
  installEvt: null,
};

const TABS = [
  ['learn', 'Lernen', ICON.learn],
  ['cards', 'Karten', ICON.cards],
  ['categories', 'Kategorien', ICON.folder],
  ['settings', 'Einstellungen', ICON.gear],
];

function navbar(title, { left = '', right = '' } = {}) {
  return `<header class="navbar"><div class="navbar-inner">
    <div class="nav-left">${left}</div>
    <div class="nav-title">${esc(title)}</div>
    <div class="nav-right">${right}</div>
  </div></header>`;
}
const chev = `<span class="chev">${ICON.chev}</span>`;
const rowIcon = (icon, color, lg) => `<span class="row-icon ${lg ? 'lg' : ''}" style="--c:var(--${color})">${icon}</span>`;

function renderTabbar() {
  $('#tabbar').innerHTML = TABS.map(([id, label, icon]) =>
    `<button class="tab ${UI.tab === id ? 'active' : ''}" role="tab" aria-selected="${UI.tab === id}" data-action="tab" data-tab="${id}">${icon}<span>${label}</span></button>`).join('');
}

function setTab(t) {
  if (t === UI.tab) {
    const v = $(`.view[data-tab="${t}"]`);
    v.scrollTo({ top: 0, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
    return;
  }
  const prev = $(`.view[data-tab="${UI.tab}"]`);
  prev._st = prev.scrollTop;
  if (UI.select && t !== 'cards') setSelectMode(false);
  UI.tab = t;
  for (const v of $$('.view')) v.classList.toggle('active', v.dataset.tab === t);
  const v = $(`.view[data-tab="${t}"]`);
  v.scrollTop = v._st || 0;
  v.classList.toggle('scrolled', v.scrollTop > 40);
  renderTabbar();
}

function refresh() {
  renderLearn();
  renderCardsList();
  renderCategories();
  renderSettings();
}

// ---- Lernen ---------------------------------------------------------------

function renderLearn() {
  const v = $('#view-learn');
  const n = DB.cards.length;
  const counts = levelCounts();
  const maxC = Math.max(1, ...Object.values(counts));
  const today = DB.log[dayKey()] || { r: 0, w: 0 };
  const totR = DB.cards.reduce((a, c) => a + c.right, 0);
  const totW = DB.cards.reduce((a, c) => a + c.wrong, 0);
  const rate = totR + totW ? Math.round((totR / (totR + totW)) * 100) : null;
  const weak = DB.cards.filter((c) => c.level < 0).length;
  const size = DB.settings.sessionSize;
  const catsWithCards = DB.categories.filter((c) => cardsIn(c.id).length).length;
  const showInstall = UI.installEvt && !isStandalone() && !DB.settings.installDismissed;

  v.innerHTML = navbar('Lernen', { right: `<button class="icon-btn" data-action="new-card" aria-label="Neue Karte">${ICON.plus}</button>` }) + `
  <div class="content">
    <h1 class="large-title">Lernen</h1>
    ${showInstall ? `
      <div class="banner">
        ${rowIcon(ICON.phone, 'blue', true)}
        <div class="row-main"><div class="row-title">App installieren</div><div class="row-sub">Für Offline-Nutzung auf den Startbildschirm.</div></div>
        <button class="btn-small" data-action="install">Installieren</button>
      </div>` : ''}
    ${n === 0 ? `
      <div class="empty">
        <div class="empty-icon">${ICON.cards}</div>
        <h2>Noch keine Karten</h2>
        <p>Lege deine erste Karteikarte an – tippen oder einfach diktieren.</p>
        <button class="btn-primary" data-action="new-card">${ICON.plus}<span>Erste Karte anlegen</span></button>
      </div>` : `
      <div class="block">
        <div class="block-title">Deine Fächer</div>
        <div class="block-sub">${plural(n, 'Karte', 'Karten')} · tippe auf ein Fach, um es zu lernen</div>
        <div class="bars">
          ${LEVELS.map((l) => `
            <button class="bar" data-action="start-level" data-level="${l}" ${counts[l] ? '' : 'disabled'} aria-label="Ebene ${fmtLevel(l)}: ${counts[l]} Karten">
              <span class="bar-count">${counts[l] || ''}</span>
              <span class="bar-track"><span class="bar-fill" style="height:${counts[l] ? Math.max(6, (counts[l] / maxC) * 100) : 0}%;background:${levelColor(l)}"></span></span>
              <span class="bar-label ${l === 0 ? 'zero' : ''}">${fmtLevel(l)}</span>
            </button>`).join('')}
        </div>
        <div class="bars-legend"><span class="neg">← nicht gewusst</span><span>Start</span><span class="pos">gewusst →</span></div>
      </div>
      <div class="stats">
        <div class="stat"><div class="stat-value">${today.r + today.w}</div><div class="stat-label">heute gelernt</div></div>
        <div class="stat"><div class="stat-value">${streak()}</div><div class="stat-label">Tage in Folge</div></div>
        <div class="stat"><div class="stat-value">${rate == null ? '–' : `${rate}%`}</div><div class="stat-label">gewusst</div></div>
      </div>

      <div class="section-header">Karten pro Runde</div>
      <div class="segmented" role="radiogroup" aria-label="Karten pro Runde">
        ${SIZES.map((s) => `<button role="radio" aria-checked="${size === s}" class="${size === s ? 'on' : ''}" data-action="set-size" data-size="${s}">${s || 'Alle'}</button>`).join('')}
      </div>

      ${groups().some((g) => cardsInGroup(g.id).length) ? `
      <div class="section-header">Prüfungen</div>
      <div class="list icons" style="--inset:66px">
        ${groups().map((g) => {
          const cs = cardsInGroup(g.id);
          const known = cs.filter((c) => c.level > 0).length;
          const pct = cs.length ? Math.round((known / cs.length) * 100) : 0;
          return `<button class="row" data-action="start-group" data-id="${esc(g.id)}" ${cs.length ? '' : 'disabled'}>
            ${rowIcon(ICON.learn, g.color, true)}
            <div class="row-main">
              <div class="row-title clamp1">${esc(g.name)}</div>
              <div class="row-sub">${plural(cs.length, 'Karte', 'Karten')} · ${pct} % gewusst</div>
              <div class="gbar" style="--c:var(--${g.color})"><span style="width:${pct}%"></span></div>
            </div>${chev}
          </button>`;
        }).join('')}
      </div>` : ''}

      <div class="section-header">Lernen starten</div>
      <div class="list icons">
        <button class="row" data-action="start-weighted">
          ${rowIcon(ICON.flame, 'orange')}
          <div class="row-main"><div class="row-title">Schwächen zuerst</div><div class="row-sub">Zufällig – schwache Karten deutlich öfter</div></div>${chev}
        </button>
        <button class="row" data-action="start-equal">
          ${rowIcon(ICON.shuffle, 'blue')}
          <div class="row-main"><div class="row-title">Alle zufällig</div><div class="row-sub">Jede Karte gleich oft</div></div>${chev}
        </button>
        <button class="row" data-action="pick-category">
          ${rowIcon(ICON.folder, 'purple')}
          <div class="row-main"><div class="row-title">Eine Kategorie</div><div class="row-sub">${plural(catsWithCards, 'Kategorie', 'Kategorien')} mit Karten</div></div>${chev}
        </button>
        <button class="row" data-action="pick-level">
          ${rowIcon(ICON.layers, 'green')}
          <div class="row-main"><div class="row-title">Eine Ebene</div><div class="row-sub">${weak ? `${plural(weak, 'Karte', 'Karten')} im negativen Bereich` : 'z. B. nur deine schwächsten Karten'}</div></div>${chev}
        </button>
      </div>
      <p class="footnote">Gewusst → ein Fach nach oben, nicht gewusst → ein Fach nach unten. Neue Karten starten bei 0, der Bereich reicht von −5 bis +5.</p>
    `}
  </div>`;
}

// ---- Karten ---------------------------------------------------------------

function initCardsView() {
  const v = $('#view-cards');
  v.innerHTML = `${navbar('Karten', {
    left: '<button class="nav-btn" data-action="toggle-select" id="select-btn">Auswählen</button>',
    right: `<button class="icon-btn" data-action="new-card" aria-label="Neue Karte">${ICON.plus}</button>`,
  })}
  <div class="content">
    <h1 class="large-title" id="cards-title">Karten</h1>
    <label class="search">${ICON.search}<input id="card-search" type="search" placeholder="Karten durchsuchen" enterkeyhint="search" autocomplete="off" aria-label="Karten durchsuchen"></label>
    <div class="chips" id="card-chips"></div>
    <div class="chips sub" id="card-subchips" hidden></div>
    <div id="cards-list"></div>
  </div>`;
  $('#card-search').addEventListener('input', (e) => { UI.search = e.target.value; renderCardsList(); });
}

const SORTS = {
  new: ['Neueste zuerst', (a, b) => b.created - a.created],
  weak: ['Schwächste zuerst', (a, b) => a.level - b.level || b.created - a.created],
  strong: ['Stärkste zuerst', (a, b) => b.level - a.level || b.created - a.created],
  alpha: ['Alphabetisch', (a, b) => a.front.localeCompare(b.front, 'de', { sensitivity: 'base' })],
};

// Filter: 'all' | 'g:<Bereich-ID>' | 'g:none' (ohne Bereich) | <Kategorie-ID>
const ungroupedCardCats = () => new Set(ungrouped().map((c) => c.id));
function filterGroup() {
  const f = UI.cardsFilter;
  if (f === 'all') return null;
  if (f.startsWith('g:')) return f.slice(2);
  const c = catById(f);
  return c ? (c.parentId || 'none') : null;
}

function filteredCards() {
  const q = UI.search.trim().toLowerCase();
  const f = UI.cardsFilter;
  let list = DB.cards;
  if (f === 'g:none') { const ids = ungroupedCardCats(); list = list.filter((c) => ids.has(c.categoryId)); }
  else if (f.startsWith('g:')) list = cardsInGroup(f.slice(2));
  else if (f !== 'all') list = list.filter((c) => c.categoryId === f);
  if (q) list = list.filter((c) => `${c.front}\n${c.back}\n${c.hint}`.toLowerCase().includes(q));
  const sort = SORTS[DB.settings.cardSort] || SORTS.new;
  return [...list].sort(sort[1]);
}

function renderCardsList() {
  const f = UI.cardsFilter;
  const valid = f === 'all' || f === 'g:none' || (f.startsWith('g:') ? isGroup(catById(f.slice(2))) : catById(f) && !isGroup(catById(f)));
  if (!valid) UI.cardsFilter = 'all';
  const chips = $('#card-chips');
  const gs = groups();
  const ug = ungrouped();
  const ugCount = DB.cards.filter((c) => ug.some((x) => x.id === c.categoryId)).length;
  const active = filterGroup();
  const chip = (key, label, n, color, on) =>
    `<button class="chip ${on ? 'on' : ''}" ${color ? `style="--c:var(--${color})"` : ''} data-action="filter" data-cat="${esc(key)}">${color ? '<span class="dot"></span>' : ''}${esc(label)} <span class="n">${n}</span></button>`;

  if (!gs.length) {
    // ohne Bereiche: eine Zeile mit allen Kategorien
    chips.innerHTML = chip('all', 'Alle', DB.cards.length, null, UI.cardsFilter === 'all') +
      sortedCats().map((c) => chip(c.id, c.name, cardsIn(c.id).length, c.color, UI.cardsFilter === c.id)).join('');
    $('#card-subchips').hidden = true;
  } else {
    chips.innerHTML = chip('all', 'Alle', DB.cards.length, null, UI.cardsFilter === 'all') +
      gs.map((g) => chip(`g:${g.id}`, groupShort(g), cardsInGroup(g.id).length, g.color, active === g.id)).join('') +
      (ugCount || ug.length > 1 ? chip('g:none', 'Weitere', ugCount, 'gray', active === 'none') : '');
    const sub = $('#card-subchips');
    if (active) {
      const kids = active === 'none' ? ug : childrenOf(active);
      const total = active === 'none' ? ugCount : cardsInGroup(active).length;
      sub.innerHTML = chip(`g:${active}`, 'Alle', total, null, UI.cardsFilter === `g:${active}`) +
        kids.map((c) => chip(c.id, c.name, cardsIn(c.id).length, c.color, UI.cardsFilter === c.id)).join('');
      sub.hidden = false;
    } else {
      sub.hidden = true;
    }
  }
  // aktiven Chip in den sichtbaren Bereich der horizontalen Leiste holen
  for (const row of [chips, $('#card-subchips')]) {
    const on = $('.chip.on', row);
    if (!on || row.hidden) continue;
    const l = on.offsetLeft - 16;
    const r = on.offsetLeft + on.offsetWidth + 16 - row.clientWidth;
    if (row.scrollLeft > l) row.scrollLeft = l;
    else if (row.scrollLeft < r) row.scrollLeft = r;
  }

  const list = filteredCards();
  const box = $('#cards-list');
  const sel = UI.select;
  for (const id of [...UI.selected]) if (!cardById(id)) UI.selected.delete(id);

  if (!DB.cards.length) {
    box.innerHTML = `<div class="empty"><div class="empty-icon">${ICON.cards}</div><h2>Noch keine Karten</h2><p>Tippe auf +, um deine erste Karte anzulegen.</p><button class="btn-primary" data-action="new-card">${ICON.plus}<span>Karte anlegen</span></button></div>`;
  } else if (!list.length) {
    box.innerHTML = `<div class="empty"><h2>Keine Treffer</h2><p>${UI.search ? 'Keine Karte passt zu deiner Suche.' : 'In dieser Kategorie sind noch keine Karten.'}</p></div>`;
  } else {
    box.innerHTML = `
      <div class="list-meta"><span>${plural(list.length, 'Karte', 'Karten')}</span>
        ${sel ? `<button data-action="select-all">${list.every((c) => UI.selected.has(c.id)) ? 'Keine auswählen' : 'Alle auswählen'}</button>`
              : `<button data-action="sort">${ICON.sort.replace('<svg', '<svg width="15" height="15"')}${SORTS[DB.settings.cardSort][0]}</button>`}
      </div>
      <div class="list">
        ${list.map((c) => {
          const cat = catById(c.categoryId);
          return `<button class="row" data-action="${sel ? 'toggle-card' : 'edit-card'}" data-id="${esc(c.id)}">
            ${sel ? `<span class="check ${UI.selected.has(c.id) ? 'on' : ''}">${ICON.check}</span>` : ''}
            <span class="lvl" style="--c:${levelColor(c.level)}">${fmtLevel(c.level)}</span>
            <div class="row-main">
              <div class="row-title clamp2">${esc(c.front)}</div>
              <div class="row-sub clamp1"><span class="cat-dot" style="--c:var(--${cat.color})"></span>${esc(cat.name)} · ${esc(c.back.replace(/\s+/g, ' '))}</div>
            </div>
            ${sel ? '' : chev}
          </button>`;
        }).join('')}
      </div>`;
  }
  renderSelectBar();
}

function setSelectMode(on) {
  UI.select = on;
  UI.selected.clear();
  $('#app').classList.toggle('select-mode', on);
  const b = $('#select-btn');
  if (b) { b.textContent = on ? 'Fertig' : 'Auswählen'; b.classList.toggle('bold', on); }
  renderCardsList();
}

function renderSelectBar() {
  const n = UI.selected.size;
  const t = $('#cards-title');
  if (t) t.textContent = UI.select ? (n ? `${n} ausgewählt` : 'Auswählen') : 'Karten';
  $('#select-bar').innerHTML = `
    <button data-action="bulk-move" ${n ? '' : 'disabled'}>${ICON.move}<span>Kategorie</span></button>
    <button data-action="bulk-level" ${n ? '' : 'disabled'}>${ICON.reset}<span>Ebene</span></button>
    <button class="destructive" data-action="bulk-delete" ${n ? '' : 'disabled'}>${ICON.trash}<span>Löschen</span></button>`;
}

// ---- Kategorien -------------------------------------------------------------

function renderCategories() {
  const v = $('#view-categories');
  const inboxN = cardsIn('inbox').length;
  const catRow = (c) => {
    const cs = cardsIn(c.id);
    const avg = cs.length ? cs.reduce((a, x) => a + x.level, 0) / cs.length : null;
    return `<button class="row" data-action="edit-category" data-id="${esc(c.id)}">
      ${rowIcon(c.id === 'inbox' ? ICON.cards : ICON.folder, c.color, true)}
      <div class="row-main">
        <div class="row-title clamp1">${esc(c.name)}</div>
        <div class="row-sub">${plural(cs.length, 'Karte', 'Karten')}${avg != null ? ` · Ø Ebene ${avg > 0 ? '+' : avg < 0 ? '−' : ''}${Math.abs(avg).toLocaleString('de-DE', { maximumFractionDigits: 1 })}` : ''}</div>
      </div>${chev}
    </button>`;
  };
  const gs = groups();
  v.innerHTML = navbar('Kategorien', { right: `<button class="icon-btn" data-action="new-category" aria-label="Neue Kategorie">${ICON.plus}</button>` }) + `
  <div class="content">
    <h1 class="large-title">Kategorien</h1>
    ${gs.map((g) => {
      const kids = childrenOf(g.id);
      return `
      <div class="section-header"><span class="clamp1">${esc(g.name)}</span><button data-action="edit-category" data-id="${esc(g.id)}">Bearbeiten</button></div>
      <div class="list icons" style="--inset:66px">
        ${kids.length ? kids.map(catRow).join('') : `<div class="row"><div class="row-main"><div class="row-sub">Noch keine Kategorien in diesem Bereich</div></div></div>`}
      </div>`;
    }).join('')}
    <div class="section-header">${gs.length ? 'Weitere' : ''}</div>
    <div class="list icons" style="--inset:66px">
      ${ungrouped().map(catRow).join('')}
    </div>
    <div class="list icons" style="margin-top:12px;--inset:66px">
      <button class="row accent" data-action="new-category">
        <span class="row-icon lg" style="--c:transparent;color:var(--blue)">${ICON.plus}</span>
        <div class="row-main"><div class="row-title">Neue Kategorie</div></div>
      </button>
      <button class="row accent" data-action="new-group">
        <span class="row-icon lg" style="--c:transparent;color:var(--blue)">${ICON.layers}</span>
        <div class="row-main"><div class="row-title">Neuer Bereich</div><div class="row-sub">z. B. eine Prüfung, die Kategorien bündelt</div></div>
      </button>
    </div>

    <div class="section-header">Verteilen</div>
    <div class="list icons">
      <button class="row" data-action="auto-distribute">
        ${rowIcon(ICON.sparkles, 'purple')}
        <div class="row-main"><div class="row-title">Automatisch verteilen</div><div class="row-sub">${inboxN ? `${plural(inboxN, 'unsortierte Karte', 'unsortierte Karten')} zuordnen` : 'Passende Kategorie vorschlagen lassen'}</div></div>${chev}
      </button>
      <button class="row" data-action="manual-distribute">
        ${rowIcon(ICON.hand, 'blue')}
        <div class="row-main"><div class="row-title">Manuell verteilen</div><div class="row-sub">Mehrere Karten auswählen und verschieben</div></div>${chev}
      </button>
    </div>
    <p class="footnote">Die automatische Verteilung nutzt die Stichwörter deiner Kategorien und lernt aus den Karten, die du schon zugeordnet hast.</p>
  </div>`;
}

// ---- Einstellungen ---------------------------------------------------------

function renderSettings() {
  const v = $('#view-settings');
  const s = DB.settings;
  const voiceStatus = !Voice.supported ? 'Nicht unterstützt'
    : Voice.local === 'available' ? 'Offline bereit'
    : Voice.local === 'downloading' ? 'Wird geladen …'
    : 'Verfügbar';
  const showInstallLocal = Voice.supported && Voice.canInstallLocal && (Voice.local === 'downloadable' || Voice.local === 'downloading');
  const toggle = (key, label, sub, icon, color) => `
    <div class="row">
      ${rowIcon(icon, color)}
      <div class="row-main"><div class="row-title">${label}</div>${sub ? `<div class="row-sub">${sub}</div>` : ''}</div>
      <label class="switch"><input type="checkbox" data-setting="${key}" ${s[key] ? 'checked' : ''} aria-label="${esc(label)}"><span></span></label>
    </div>`;

  v.innerHTML = navbar('Einstellungen') + `
  <div class="content">
    <h1 class="large-title">Einstellungen</h1>

    <div class="section-header">Backup</div>
    <div class="list icons">
      <button class="row" data-action="export">
        ${rowIcon(ICON.upload, 'blue')}
        <div class="row-main"><div class="row-title">Backup exportieren</div><div class="row-sub">Zuletzt: ${fmtDate(DB.meta.lastBackup)}</div></div>${chev}
      </button>
      <button class="row" data-action="import">
        ${rowIcon(ICON.download, 'green')}
        <div class="row-main"><div class="row-title">Backup importieren</div><div class="row-sub">JSON-Datei wiederherstellen</div></div>${chev}
      </button>
      <button class="row" data-action="text-import">
        ${rowIcon(ICON.text, 'indigo')}
        <div class="row-main"><div class="row-title">Karten aus Text importieren</div><div class="row-sub">Viele Karten auf einmal einfügen</div></div>${chev}
      </button>
    </div>
    <p class="footnote">Deine Karten liegen nur auf diesem Gerät. Exportiere regelmäßig ein Backup – z. B. in Google Drive.</p>

    ${DB.meta.deckTotal ? `
    <div class="section-header">Prüfungskarten AP2</div>
    <div class="list icons">
      <div class="row">
        ${rowIcon(ICON.learn, 'indigo')}
        <div class="row-main"><div class="row-title">Mitgelieferte Karten</div><div class="row-sub">Werden bei App-Updates automatisch ergänzt</div></div>
        <span class="row-value">${(() => { const s = new Set(DB.meta.deckIds || []); return DB.cards.filter((c) => s.has(c.id)).length; })()} / ${DB.meta.deckTotal}</span>
      </div>
      <button class="row" data-action="restore-deck">
        ${rowIcon(ICON.reset, 'teal')}
        <div class="row-main"><div class="row-title">Fehlende wiederherstellen</div><div class="row-sub">Gelöschte Prüfungskarten und -kategorien zurückholen</div></div>${chev}
      </button>
    </div>
    <p class="footnote">Dein Lernstand und eigene Änderungen an Karten bleiben dabei erhalten.</p>` : ''}

    <div class="section-header">Spracheingabe</div>
    <div class="list icons">
      <div class="row">
        ${rowIcon(ICON.mic, 'red')}
        <div class="row-main"><div class="row-title">Spracherkennung</div><div class="row-sub">Deutsch</div></div>
        <span class="row-value">${voiceStatus}</span>
      </div>
      ${showInstallLocal ? `
      <button class="row accent" data-action="install-voice">
        ${rowIcon(ICON.download, 'orange')}
        <div class="row-main"><div class="row-title">Offline-Sprachpaket laden</div><div class="row-sub">Diktieren auch ohne Internet</div></div>
      </button>` : ''}
      ${toggle('voicePunct', 'Satzzeichen sprechen', '„Punkt“, „Komma“, „Fragezeichen“, „neue Zeile“', ICON.wave, 'pink')}
      ${toggle('voiceAutoNext', 'Automatisch weiter', 'Nach der Vorderseite direkt die Rückseite diktieren', ICON.chev, 'teal')}
    </div>
    <p class="footnote">Funktioniert das Diktieren offline nicht, nutze das Mikrofon-Symbol der Gboard-Tastatur – auf dem Pixel arbeitet es auch ohne Internet.</p>

    <div class="section-header">Lernen</div>
    <div class="list icons">
      ${toggle('haptics', 'Vibration', 'Kurzes Feedback beim Bewerten', ICON.phone, 'gray')}
      <button class="row" data-action="reset-levels">
        ${rowIcon(ICON.reset, 'orange')}
        <div class="row-main"><div class="row-title">Lernstand zurücksetzen</div><div class="row-sub">Alle Karten zurück auf Ebene 0</div></div>${chev}
      </button>
    </div>

    <div class="section-header">App</div>
    <div class="list icons">
      ${UI.installEvt && !isStandalone() ? `
      <button class="row" data-action="install">
        ${rowIcon(ICON.phone, 'blue')}
        <div class="row-main"><div class="row-title">Als App installieren</div><div class="row-sub">Startbildschirm-Icon, Vollbild, offline</div></div>${chev}
      </button>` : `
      <div class="row">
        ${rowIcon(ICON.phone, 'blue')}
        <div class="row-main"><div class="row-title">Installation</div></div>
        <span class="row-value">${isStandalone() ? 'Installiert' : 'Über Chrome-Menü'}</span>
      </div>`}
      <div class="row">
        ${rowIcon(ICON.lock, 'green')}
        <div class="row-main"><div class="row-title">Dauerhafter Speicher</div></div>
        <span class="row-value" id="persist-status">…</span>
      </div>
      <div class="row">
        ${rowIcon(ICON.info, 'gray')}
        <div class="row-main"><div class="row-title">Version</div></div>
        <span class="row-value">${APP_VERSION}</span>
      </div>
    </div>

    <div class="section-header">Gefahrenzone</div>
    <div class="list">
      <button class="row destructive" data-action="wipe"><div class="row-main"><div class="row-title">Alle Daten löschen</div></div></button>
    </div>
    <p class="footnote">GossensBesterMann · funktioniert vollständig offline · keine Daten verlassen dein Gerät (außer beim Diktieren, falls kein Offline-Sprachpaket installiert ist).</p>
  </div>`;
  updatePersistStatus();
}

async function updatePersistStatus() {
  const elx = $('#persist-status');
  if (!elx) return;
  try {
    const p = navigator.storage && navigator.storage.persisted ? await navigator.storage.persisted() : null;
    elx.textContent = p == null ? 'Unbekannt' : p ? 'Aktiv' : 'Nicht aktiv';
  } catch (e) { elx.textContent = 'Unbekannt'; }
}

// ---------------------------------------------------------------------------
// Karte anlegen / bearbeiten
// ---------------------------------------------------------------------------

// Kategorie-Chips, gruppiert nach Bereich. attr = Attribut, das die Kategorie-ID trägt.
function catChipsHTML(selectedId, attr, extra = '') {
  const chip = (c) => `<button type="button" class="chip ${c.id === selectedId ? 'on' : ''}" style="--c:var(--${c.color})" ${attr}="${esc(c.id)}"><span class="dot"></span>${esc(c.name)}</button>`;
  const gs = groups().filter((g) => childrenOf(g.id).length);
  if (!gs.length) return `<div class="chip-wrap">${sortedCats().map(chip).join('')}${extra}</div>`;
  return gs.map((g) => `<div class="chip-group">${esc(g.name)}</div><div class="chip-wrap">${childrenOf(g.id).map(chip).join('')}</div>`).join('') +
    `<div class="chip-group">Weitere</div><div class="chip-wrap">${ungrouped().map(chip).join('')}${extra}</div>`;
}

function fieldHTML(key, label, placeholder, value, optional) {
  return `
    <div class="form-group" data-group="${key}">
      <div class="form-label">${label}${optional ? ' <span class="opt">· optional</span>' : ''}<span class="live">Höre zu …</span></div>
      <div class="field">
        <textarea data-f="${key}" rows="1" placeholder="${esc(placeholder)}" autocapitalize="sentences" spellcheck="true">${esc(value || '')}</textarea>
        <button class="mic" type="button" data-mic="${key}" aria-label="${label} diktieren" aria-pressed="false">${ICON.mic}</button>
      </div>
    </div>`;
}

function openCardEditor(card = null, opts = {}) {
  const isNew = !card;
  let catId = card ? card.categoryId : (opts.categoryId || DB.settings.lastCategory || 'inbox');
  if (!catById(catId)) catId = 'inbox';
  let manualCat = !!card || !!opts.categoryId;
  let autoPicked = false;
  let level = card ? card.level : 0;
  const initial = card ? { front: card.front, back: card.back, hint: card.hint, cat: card.categoryId, level: card.level } : { front: '', back: '', hint: '', cat: catId, level: 0 };

  const body = `
    <div class="form">
      ${fieldHTML('front', 'Vorderseite', 'Frage oder Begriff', card && card.front)}
      ${fieldHTML('back', 'Rückseite', 'Antwort oder Erklärung', card && card.back)}
      ${fieldHTML('hint', 'Hinweis', 'Kleine Hilfe, bevor du umdrehst', card && card.hint, true)}
      <div class="form-label">Kategorie</div>
      <div class="cat-picker" id="cat-picker"></div>
      <div class="suggest-note" id="suggest-note" hidden>${ICON.sparkles}<span></span></div>
      ${card ? `
        <div class="form-label">Lernstand</div>
        <div class="list">
          <div class="row">
            <span class="lvl" id="ed-lvl"></span>
            <div class="row-main"><div class="row-title">Ebene</div><div class="row-sub">${card.right}× gewusst · ${card.wrong}× nicht gewusst</div></div>
            <div class="stepper">
              <button type="button" data-ed="lvl-down" aria-label="Ebene runter">${ICON.minus}</button>
              <button type="button" data-ed="lvl-up" aria-label="Ebene hoch">${ICON.plus}</button>
            </div>
          </div>
        </div>` : ''}
      <div class="btn-stack">
        ${isNew
          ? `<button class="btn-primary" type="button" data-ed="save-next">${ICON.plus}<span>Sichern &amp; nächste Karte</span></button>`
          : `<button class="btn-plain destructive" type="button" data-ed="delete">Karte löschen</button>`}
      </div>
      ${Voice.supported ? '' : '<p class="footnote">Dieser Browser unterstützt keine Spracheingabe. Nutze das Mikrofon deiner Tastatur.</p>'}
    </div>`;

  let sheet;
  const val = (k) => $(`[data-f="${k}"]`, sheet.body).value;
  const valid = () => val('front').trim() && val('back').trim();
  const dirty = () => val('front') !== initial.front || val('back') !== initial.back || val('hint') !== initial.hint || catId !== initial.cat || level !== initial.level;

  const renderPicker = () => {
    $('#cat-picker', sheet.body).innerHTML = catChipsHTML(catId, 'data-ed="cat" data-id', `<button type="button" class="chip dashed" data-ed="new-cat">${ICON.plus}Neu</button>`);
  };
  const renderLevel = () => {
    const l = $('#ed-lvl', sheet.body);
    if (!l) return;
    l.textContent = fmtLevel(level);
    l.style.setProperty('--c', levelColor(level));
    $('[data-ed="lvl-down"]', sheet.body).disabled = level <= MIN;
    $('[data-ed="lvl-up"]', sheet.body).disabled = level >= MAX;
  };
  const updateState = () => sheet.setRight(null, !valid());

  let suggestTimer = 0;
  const runSuggest = () => {
    clearTimeout(suggestTimer);
    suggestTimer = setTimeout(() => {
      const note = $('#suggest-note', sheet.body);
      if (manualCat) { note.hidden = true; return; }
      const s = suggestCategory(`${val('front')} ${val('back')} ${val('hint')}`, buildModel(), card);
      if (s && s.id !== catId) {
        catId = s.id;
        autoPicked = true;
        renderPicker();
      }
      if (autoPicked && s) {
        note.hidden = false;
        $('span', note).textContent = `Automatisch erkannt: ${catById(catId).name}`;
      } else if (!s && autoPicked) {
        catId = DB.settings.lastCategory && catById(DB.settings.lastCategory) ? DB.settings.lastCategory : 'inbox';
        autoPicked = false;
        renderPicker();
        note.hidden = true;
      }
    }, 350);
  };

  const persist = () => {
    const data = { front: val('front').trim(), back: val('back').trim(), hint: val('hint').trim(), categoryId: catId };
    if (isNew) {
      DB.cards.push({ id: uid(), ...data, level: 0, created: Date.now(), updated: Date.now(), right: 0, wrong: 0, last: 0 });
    } else {
      const textChanged = data.front !== card.front || data.back !== card.back || data.hint !== card.hint;
      Object.assign(card, data, { level, updated: Date.now() });
      if (textChanged) delete card.deck; // eigene Änderung: Kartensatz-Updates überschreiben sie nicht mehr
    }
    if (manualCat) DB.settings.lastCategory = catId;
    save();
    requestPersist();
    refresh();
  };

  sheet = openSheet({
    title: isNew ? 'Neue Karte' : 'Karte bearbeiten',
    body,
    left: { label: 'Abbrechen' },
    right: {
      label: 'Sichern',
      bold: true,
      action: (sh) => {
        if (!valid()) return;
        persist();
        haptic(10);
        toast(isNew ? 'Karte gesichert' : 'Änderungen gesichert');
        sh.close();
      },
    },
    beforeClose: async () => {
      if (!dirty()) return true;
      return confirmDialog({ title: 'Änderungen verwerfen?', message: 'Deine Eingaben gehen verloren.', confirm: 'Verwerfen', destructive: true });
    },
    onMount: (sh) => {
      renderPicker();
      renderLevel();
      for (const t of $$('textarea', sh.body)) autoGrow(t);
      updateState();
      if (isNew) setTimeout(() => { const f = $('[data-f="front"]', sh.body); if (f && !matchMedia('(pointer: coarse)').matches) f.focus(); }, 380);
    },
  });

  sheet.body.addEventListener('input', (e) => {
    if (e.target.matches('textarea')) {
      autoGrow(e.target);
      updateState();
      if (e.target.dataset.f !== 'hint' || val('hint')) runSuggest();
    }
  });

  sheet.body.addEventListener('click', async (e) => {
    const mic = e.target.closest('[data-mic]');
    if (mic) {
      const key = mic.dataset.mic;
      const ta = $(`[data-f="${key}"]`, sheet.body);
      Voice.toggle(ta, mic, (got) => {
        autoGrow(ta);
        if (got && DB.settings.voiceAutoNext && key === 'front' && !val('back').trim() && topOverlay() === sheet) {
          setTimeout(() => {
            if (topOverlay() !== sheet || Voice.rec) return;
            const nb = $('[data-mic="back"]', sheet.body);
            nb.scrollIntoView({ block: 'center', behavior: reduceMotion.matches ? 'auto' : 'smooth' });
            Voice.start($('[data-f="back"]', sheet.body), nb, () => autoGrow($('[data-f="back"]', sheet.body)));
          }, 450);
        }
      });
      return;
    }
    const b = e.target.closest('[data-ed]');
    if (!b) return;
    const act = b.dataset.ed;
    if (act === 'cat') {
      catId = b.dataset.id;
      manualCat = true;
      autoPicked = false;
      $('#suggest-note', sheet.body).hidden = true;
      renderPicker();
      haptic(5);
    } else if (act === 'new-cat') {
      const name = await promptDialog({ title: 'Neue Kategorie', message: 'Wie soll die Kategorie heißen?', placeholder: 'z. B. Netzwerktechnik', confirm: 'Anlegen' });
      if (name) {
        const existing = findCatByName(name);
        const cat = existing || createCategory(name);
        save();
        catId = cat.id;
        manualCat = true;
        $('#suggest-note', sheet.body).hidden = true;
        renderPicker();
        refresh();
      }
    } else if (act === 'lvl-down' || act === 'lvl-up') {
      level = clampLevel(level + (act === 'lvl-up' ? 1 : -1));
      renderLevel();
    } else if (act === 'delete') {
      const ok = await confirmDialog({ title: 'Karte löschen?', message: 'Das kann nicht rückgängig gemacht werden.', confirm: 'Löschen', destructive: true });
      if (ok) {
        DB.cards = DB.cards.filter((c) => c !== card);
        save();
        refresh();
        sheet.close();
        toast('Karte gelöscht');
      }
    } else if (act === 'save-next') {
      if (!valid()) {
        toast('Vorder- und Rückseite ausfüllen', 'error');
        const empty = !val('front').trim() ? 'front' : 'back';
        $(`[data-f="${empty}"]`, sheet.body).focus();
        return;
      }
      Voice.stop();
      persist();
      haptic(10);
      const total = DB.cards.length;
      toast(`Karte gesichert · ${plural(total, 'Karte', 'Karten')} insgesamt`);
      for (const t of $$('textarea', sheet.body)) { t.value = ''; autoGrow(t); }
      initial.front = initial.back = initial.hint = '';
      initial.cat = catId;
      autoPicked = false;
      $('#suggest-note', sheet.body).hidden = true;
      updateState();
      sheet.body.scrollTo({ top: 0, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
      const f = $('[data-f="front"]', sheet.body);
      // Sprach-Workflow: direkt die nächste Vorderseite diktieren
      if (Voice.supported && DB.settings.voiceAutoNext) Voice.start(f, $('[data-mic="front"]', sheet.body), () => autoGrow(f));
      else f.focus();
    }
  });
  return sheet;
}

// ---------------------------------------------------------------------------
// Kategorie anlegen / bearbeiten
// ---------------------------------------------------------------------------

function openCategoryEditor(cat = null, opts = {}) {
  if (isGroup(cat)) { openGroupEditor(cat); return; }
  const isNew = !cat;
  const isInbox = cat && cat.id === 'inbox';
  let parentId = cat ? cat.parentId : (opts.parentId || null);
  let color = cat ? cat.color : (parentId ? catById(parentId).color : nextColor());
  const cs = cat ? cardsIn(cat.id) : [];
  const counts = levelCounts(cs);
  const maxC = Math.max(1, ...Object.values(counts));

  const body = `
    <div class="form">
      <div class="form-group">
        <div class="form-label">Name</div>
        <div class="field"><input type="text" data-c="name" value="${esc(cat ? cat.name : '')}" placeholder="z. B. Netzwerktechnik" autocomplete="off" enterkeyhint="done"></div>
      </div>
      ${!isInbox && groups().length ? `
      <div class="form-label">Bereich</div>
      <div class="cat-picker"><div class="chip-wrap" id="grp-picker"></div></div>` : ''}
      ${isInbox ? '' : `
      <div class="form-label">Farbe</div>
      <div class="colors" id="colors"></div>
      <div class="form-group">
        <div class="form-label">Stichwörter <span class="opt">· optional</span></div>
        <div class="field"><textarea data-c="keywords" rows="1" placeholder="z. B. Subnetz, IPv4, Router, OSI">${esc(cat ? cat.keywords.join(', ') : '')}</textarea></div>
      </div>
      <p class="footnote">Durch Komma getrennt. Karten mit diesen Wörtern werden automatisch dieser Kategorie zugeordnet.</p>`}
      ${cat ? `
        <div class="form-label">${plural(cs.length, 'Karte', 'Karten')}</div>
        <div class="list">
          <div class="mini-bars" aria-label="Verteilung über die Ebenen">${LEVELS.map((l) => `<span style="height:${counts[l] ? Math.max(10, (counts[l] / maxC) * 100) : 8}%;${counts[l] ? `background:${levelColor(l)}` : ''}"></span>`).join('')}</div>
        </div>
        <div class="btn-stack">
          ${cs.length ? `<button class="btn-primary" type="button" data-ce="learn">${ICON.learn}<span>Diese Kategorie lernen</span></button>` : ''}
          <button class="btn-plain" type="button" data-ce="show">Karten anzeigen</button>
          <button class="btn-plain" type="button" data-ce="add">Karte hinzufügen</button>
          ${isInbox ? '' : '<button class="btn-plain destructive" type="button" data-ce="delete">Kategorie löschen</button>'}
        </div>` : ''}
    </div>`;

  let sheet;
  const nameVal = () => $('[data-c="name"]', sheet.body).value.trim();
  const kwVal = () => { const k = $('[data-c="keywords"]', sheet.body); return k ? k.value.split(/[,;\n]/).map((x) => x.trim()).filter(Boolean) : []; };
  const renderColors = () => {
    const box = $('#colors', sheet.body);
    if (!box) return;
    box.innerHTML = COLORS.map((c) => `<button type="button" class="swatch ${c === color ? 'on' : ''}" style="--c:var(--${c})" data-color="${c}" aria-label="Farbe ${c}"></button>`).join('');
  };
  const renderGroups = () => {
    const box = $('#grp-picker', sheet.body);
    if (!box) return;
    box.innerHTML = groups().map((g) => `<button type="button" class="chip ${parentId === g.id ? 'on' : ''}" style="--c:var(--${g.color})" data-grp="${esc(g.id)}"><span class="dot"></span>${esc(groupShort(g))}</button>`).join('') +
      `<button type="button" class="chip ${!parentId ? 'on' : ''}" style="--c:var(--gray)" data-grp=""><span class="dot"></span>Kein Bereich</button>`;
  };
  const initialKw = cat ? cat.keywords.join('|') : '';
  const dirty = () => (cat ? nameVal() !== cat.name || color !== cat.color || kwVal().join('|') !== initialKw || (parentId || null) !== (cat.parentId || null) : !!nameVal());

  sheet = openSheet({
    title: isNew ? 'Neue Kategorie' : 'Kategorie',
    body,
    left: { label: 'Abbrechen' },
    right: {
      label: isNew ? 'Anlegen' : 'Sichern',
      bold: true,
      action: (sh) => {
        const name = nameVal();
        if (!name) return;
        const dupe = DB.categories.find((c) => c !== cat && !isGroup(c) && c.name.toLowerCase() === name.toLowerCase());
        if (dupe) { toast('Diese Kategorie gibt es schon', 'error'); return; }
        if (isNew) createCategory(name, { color, keywords: kwVal(), parentId });
        else {
          Object.assign(cat, { name, color: isInbox ? 'gray' : color, keywords: isInbox ? [] : kwVal(), parentId: isInbox ? null : parentId });
          delete cat.deck;
        }
        save();
        refresh();
        toast(isNew ? 'Kategorie angelegt' : 'Kategorie gesichert');
        sh.close();
      },
    },
    beforeClose: async () => (!dirty() ? true : confirmDialog({ title: 'Änderungen verwerfen?', confirm: 'Verwerfen', destructive: true })),
    onMount: (sh) => {
      renderColors();
      renderGroups();
      for (const t of $$('textarea', sh.body)) autoGrow(t);
      sh.setRight(null, !nameVal());
    },
  });

  sheet.body.addEventListener('input', (e) => {
    if (e.target.matches('textarea')) autoGrow(e.target);
    sheet.setRight(null, !nameVal());
  });
  sheet.body.addEventListener('click', async (e) => {
    const sw = e.target.closest('[data-color]');
    if (sw) { color = sw.dataset.color; renderColors(); haptic(5); return; }
    const gp = e.target.closest('[data-grp]');
    if (gp) {
      parentId = gp.dataset.grp || null;
      if (isNew && parentId) { color = catById(parentId).color; renderColors(); }
      renderGroups();
      haptic(5);
      return;
    }
    const b = e.target.closest('[data-ce]');
    if (!b) return;
    const act = b.dataset.ce;
    if (act === 'learn') { sheet.close(); startSession({ type: 'category', categoryId: cat.id, label: cat.name }); }
    if (act === 'show') { sheet.close(); UI.cardsFilter = cat.id; setTab('cards'); renderCardsList(); }
    if (act === 'add') { sheet.close(); openCardEditor(null, { categoryId: cat.id }); }
    if (act === 'delete') {
      const n = cardsIn(cat.id).length;
      let choice = 'move';
      if (n) {
        choice = await actionSheet({
          title: `„${cat.name}“ löschen?`,
          message: `Die Kategorie enthält ${plural(n, 'Karte', 'Karten')}.`,
          actions: [
            { label: 'Karten nach „Unsortiert“ verschieben', value: 'move' },
            { label: `Kategorie und ${plural(n, 'Karte', 'Karten')} löschen`, value: 'all', style: 'destructive' },
          ],
        });
      } else if (!(await confirmDialog({ title: `„${cat.name}“ löschen?`, confirm: 'Löschen', destructive: true }))) {
        choice = null;
      }
      if (!choice) return;
      if (choice === 'all') DB.cards = DB.cards.filter((c) => c.categoryId !== cat.id);
      else for (const c of DB.cards) if (c.categoryId === cat.id) c.categoryId = 'inbox';
      DB.categories = DB.categories.filter((c) => c !== cat);
      if (DB.settings.lastCategory === cat.id) DB.settings.lastCategory = 'inbox';
      save();
      refresh();
      sheet.close();
      toast('Kategorie gelöscht');
    }
  });
}

// ---------------------------------------------------------------------------
// Bereich (z. B. eine Prüfung) anlegen / bearbeiten
// ---------------------------------------------------------------------------

function openGroupEditor(group = null) {
  const isNew = !group;
  let color = group ? group.color : nextColor();
  const kids = group ? childrenOf(group.id) : [];
  const cs = group ? cardsInGroup(group.id) : [];

  const body = `
    <div class="form">
      <div class="form-group">
        <div class="form-label">Name des Bereichs</div>
        <div class="field"><input type="text" data-g="name" value="${esc(group ? group.name : '')}" placeholder="z. B. Klausur 1: IT-Systemlösung" autocomplete="off" enterkeyhint="done"></div>
      </div>
      <p class="footnote">Tipp: Mit „Klausur 1: …“ wird „Klausur 1“ als Kurzname in Filtern angezeigt.</p>
      <div class="form-label">Farbe</div>
      <div class="colors" id="g-colors"></div>
      ${group ? `
        <div class="form-label">${plural(kids.length, 'Kategorie', 'Kategorien')} · ${plural(cs.length, 'Karte', 'Karten')}</div>
        <div class="btn-stack" style="margin-top:0">
          ${cs.length ? `<button class="btn-primary" type="button" data-ge="learn">${ICON.learn}<span>Ganzen Bereich lernen</span></button>` : ''}
          <button class="btn-plain" type="button" data-ge="add">Kategorie hinzufügen</button>
          <button class="btn-plain destructive" type="button" data-ge="delete">Bereich auflösen</button>
        </div>
        <p class="footnote">Beim Auflösen bleiben alle Kategorien und Karten erhalten – sie landen unter „Weitere“.</p>` : ''}
    </div>`;

  let sheet;
  const nameVal = () => $('[data-g="name"]', sheet.body).value.trim();
  const renderColors = () => {
    $('#g-colors', sheet.body).innerHTML = COLORS.map((c) => `<button type="button" class="swatch ${c === color ? 'on' : ''}" style="--c:var(--${c})" data-color="${c}" aria-label="Farbe ${c}"></button>`).join('');
  };
  const dirty = () => (group ? nameVal() !== group.name || color !== group.color : !!nameVal());

  sheet = openSheet({
    title: isNew ? 'Neuer Bereich' : 'Bereich',
    body,
    left: { label: 'Abbrechen' },
    right: {
      label: isNew ? 'Anlegen' : 'Sichern',
      bold: true,
      action: (sh) => {
        const name = nameVal();
        if (!name) return;
        if (isNew) {
          createCategory(name, { kind: 'group', color });
        } else {
          // Farbe an Kategorien weitergeben, die noch die alte Bereichsfarbe tragen
          for (const k of childrenOf(group.id)) if (k.color === group.color) k.color = color;
          Object.assign(group, { name, color });
          delete group.deck;
        }
        save();
        refresh();
        toast(isNew ? 'Bereich angelegt' : 'Bereich gesichert');
        sh.close();
      },
    },
    beforeClose: async () => (!dirty() ? true : confirmDialog({ title: 'Änderungen verwerfen?', confirm: 'Verwerfen', destructive: true })),
    onMount: (sh) => { renderColors(); sh.setRight(null, !nameVal()); },
  });

  sheet.body.addEventListener('input', () => sheet.setRight(null, !nameVal()));
  sheet.body.addEventListener('click', async (e) => {
    const sw = e.target.closest('[data-color]');
    if (sw) { color = sw.dataset.color; renderColors(); haptic(5); return; }
    const b = e.target.closest('[data-ge]');
    if (!b) return;
    const act = b.dataset.ge;
    if (act === 'learn') { sheet.close(); startSession({ type: 'group', groupId: group.id, label: group.name }); }
    if (act === 'add') { sheet.close(); openCategoryEditor(null, { parentId: group.id }); }
    if (act === 'delete') {
      const ok = await confirmDialog({ title: `„${group.name}“ auflösen?`, message: 'Kategorien und Karten bleiben erhalten.', confirm: 'Auflösen', destructive: true });
      if (!ok) return;
      for (const k of childrenOf(group.id)) k.parentId = null;
      DB.categories = DB.categories.filter((c) => c !== group);
      save();
      refresh();
      sheet.close();
      toast('Bereich aufgelöst');
    }
  });
}

// ---------------------------------------------------------------------------
// Automatisch verteilen
// ---------------------------------------------------------------------------

function openAutoDistribute() {
  const realCats = DB.categories.filter((c) => c.id !== 'inbox' && !isGroup(c));
  if (!realCats.length) {
    alertDialog({
      title: 'Noch keine Kategorien',
      message: 'Lege zuerst Kategorien an – am besten mit Stichwörtern. Dann kann die App deine Karten automatisch verteilen.',
      buttons: [{ label: 'OK', value: true, cancel: true, style: 'bold' }],
    });
    return;
  }
  let scope = cardsIn('inbox').length ? 'inbox' : 'all';
  let proposals = [];
  const off = new Set();

  const compute = () => {
    const model = buildModel();
    const pool = scope === 'inbox' ? cardsIn('inbox') : DB.cards;
    proposals = [];
    for (const card of pool) {
      const s = suggestCategory(`${card.front} ${card.back} ${card.hint}`, model, card);
      if (s && s.id !== card.categoryId) proposals.push({ card, to: s.id });
    }
    off.clear();
  };

  const render = (sheet) => {
    const pool = scope === 'inbox' ? cardsIn('inbox') : DB.cards;
    const n = proposals.filter((p) => !off.has(p.card.id)).length;
    sheet.body.innerHTML = `
      <div class="segmented" style="margin-top:6px">
        <button class="${scope === 'inbox' ? 'on' : ''}" data-scope="inbox">Nur Unsortiert</button>
        <button class="${scope === 'all' ? 'on' : ''}" data-scope="all">Alle Karten</button>
      </div>
      ${proposals.length ? `
        <div class="list-meta"><span>${plural(proposals.length, 'Vorschlag', 'Vorschläge')} für ${plural(pool.length, 'Karte', 'Karten')}</span></div>
        <div class="list">
          ${proposals.map((p) => {
            const to = catById(p.to);
            const from = catById(p.card.categoryId);
            return `<button class="row" data-toggle="${esc(p.card.id)}">
              <span class="check ${off.has(p.card.id) ? '' : 'on'}">${ICON.check}</span>
              <div class="row-main">
                <div class="row-title clamp1">${esc(p.card.front)}</div>
                <div class="row-sub clamp1">${scope === 'all' ? `${esc(from.name)} → ` : ''}<span class="cat-dot" style="--c:var(--${to.color})"></span><b style="font-weight:600;color:var(--label)">${esc(to.name)}</b></div>
              </div>
            </button>`;
          }).join('')}
        </div>
        <div class="btn-stack"><button class="btn-primary" data-apply ${n ? '' : 'disabled'}>${ICON.sparkles}<span>${plural(n, 'Karte', 'Karten')} zuordnen</span></button></div>
      ` : `
        <div class="empty">
          <div class="empty-icon" style="background:color-mix(in srgb,var(--purple) 14%,transparent);color:var(--purple)">${ICON.sparkles}</div>
          <h2>Keine Vorschläge</h2>
          <p>${scope === 'all' && pool.length ? 'Alles passt: Keine Karte müsste in eine andere Kategorie verschoben werden.' : pool.length ? 'Für diese Karten wurde keine eindeutig passende Kategorie gefunden. Ergänze Stichwörter bei deinen Kategorien oder ordne ein paar Karten manuell zu – daraus lernt die Verteilung.' : 'Hier gibt es keine Karten zum Verteilen.'}</p>
        </div>`}
      <p class="footnote">Vorschläge basieren auf den Stichwörtern deiner Kategorien und den Wörtern der Karten, die bereits darin liegen.</p>`;
  };

  compute();
  const sheet = openSheet({
    title: 'Automatisch verteilen',
    body: '',
    left: { label: 'Schließen' },
    onMount: (sh) => render(sh),
  });
  sheet.body.addEventListener('click', (e) => {
    const sc = e.target.closest('[data-scope]');
    if (sc) { scope = sc.dataset.scope; compute(); render(sheet); return; }
    const tg = e.target.closest('[data-toggle]');
    if (tg) {
      const id = tg.dataset.toggle;
      if (off.has(id)) off.delete(id); else off.add(id);
      render(sheet);
      return;
    }
    if (e.target.closest('[data-apply]')) {
      let n = 0;
      for (const p of proposals) {
        if (off.has(p.card.id)) continue;
        p.card.categoryId = p.to;
        p.card.updated = Date.now();
        n++;
      }
      save();
      refresh();
      haptic(12);
      toast(`${plural(n, 'Karte', 'Karten')} zugeordnet`);
      sheet.close();
    }
  });
}

// ---------------------------------------------------------------------------
// Lern-Auswahl
// ---------------------------------------------------------------------------

function pickCategorySheet() {
  const row = (c) => {
    const cs = cardsIn(c.id);
    const weak = cs.filter((x) => x.level < 0).length;
    return `<button class="row" data-cat="${esc(c.id)}" ${cs.length ? '' : 'disabled'}>
      ${rowIcon(c.id === 'inbox' ? ICON.cards : ICON.folder, c.color, true)}
      <div class="row-main"><div class="row-title clamp1">${esc(c.name)}</div><div class="row-sub">${plural(cs.length, 'Karte', 'Karten')}${weak ? ` · ${weak} schwach` : ''}</div></div>${chev}
    </button>`;
  };
  const section = (title, rows) => (rows ? `${title ? `<div class="section-header">${esc(title)}</div>` : ''}<div class="list icons" style="--inset:66px">${rows}</div>` : '');
  const gs = groups();
  const body = gs.length
    ? gs.map((g) => {
      const n = cardsInGroup(g.id).length;
      return section(g.name, `
        <button class="row" data-group="${esc(g.id)}" ${n ? '' : 'disabled'}>
          ${rowIcon(ICON.learn, g.color, true)}
          <div class="row-main"><div class="row-title">Ganze ${esc(groupShort(g))}</div><div class="row-sub">${plural(n, 'Karte', 'Karten')} aus allen Themen</div></div>${chev}
        </button>${childrenOf(g.id).map(row).join('')}`);
    }).join('') + section('Weitere', ungrouped().map(row).join(''))
    : section('', sortedCats().map(row).join(''));
  const sheet = openSheet({
    title: 'Kategorie lernen',
    compact: true,
    left: { label: 'Abbrechen' },
    body,
  });
  sheet.body.addEventListener('click', (e) => {
    const g = e.target.closest('[data-group]');
    if (g) {
      const grp = catById(g.dataset.group);
      sheet.close();
      startSession({ type: 'group', groupId: grp.id, label: grp.name });
      return;
    }
    const b = e.target.closest('[data-cat]');
    if (!b) return;
    const cat = catById(b.dataset.cat);
    sheet.close();
    startSession({ type: 'category', categoryId: cat.id, label: catPath(cat) });
  });
}

function pickLevelSheet() {
  const counts = levelCounts();
  const desc = (l) => (l === MIN ? 'Am schwächsten' : l === MAX ? 'Sicher gewusst' : l === 0 ? 'Neu / neutral' : l < 0 ? 'Negativer Bereich' : 'Positiver Bereich');
  const sheet = openSheet({
    title: 'Ebene lernen',
    compact: true,
    left: { label: 'Abbrechen' },
    body: `
      <div class="list">
        ${LEVELS.map((l) => `
          <button class="row" data-level="${l}" ${counts[l] ? '' : 'disabled'}>
            <span class="lvl" style="--c:${levelColor(l)}">${fmtLevel(l)}</span>
            <div class="row-main"><div class="row-title">Ebene ${fmtLevel(l)}</div><div class="row-sub">${desc(l)}</div></div>
            <span class="row-value">${counts[l]}</span>${chev}
          </button>`).join('')}
      </div>`,
  });
  sheet.body.addEventListener('click', (e) => {
    const b = e.target.closest('[data-level]');
    if (!b) return;
    sheet.close();
    const l = +b.dataset.level;
    startSession({ type: 'level', level: l, label: `Ebene ${fmtLevel(l)}` });
  });
}

// ---------------------------------------------------------------------------
// Lernsession
// ---------------------------------------------------------------------------

function sizeClass(t) {
  const n = t.length;
  const lines = t.split('\n').length;
  if (n > 160 || lines > 4) return 's';
  if (n > 60 || lines > 2) return 'm';
  return '';
}

// Prüfungskarten: „Ausgeschriebener Name\nErklärung“ → Name als Überschrift, Erklärung darunter
function backHTML(card) {
  const i = card.back.indexOf('\n');
  if (card.id.startsWith('d-') && i > 0 && i <= 90) {
    const title = card.back.slice(0, i).trim();
    const rest = card.back.slice(i + 1).trim();
    return `<div class="face-text ${title.length > 40 ? 'm' : ''}">${esc(title)}</div><div class="face-expl">${esc(rest)}</div>`;
  }
  return `<div class="face-text ${sizeClass(card.back)}">${esc(card.back)}</div>`;
}

function startSession(spec) {
  const queue = buildQueue({ ...spec, count: spec.count ?? DB.settings.sessionSize });
  if (!queue.length) { toast('Keine Karten in dieser Auswahl', 'error'); return; }

  const S = { spec, queue, i: 0, results: [], revealed: false, hintShown: false, view: null, done: false };
  const root = el(`
    <div class="overlay">
      <div class="session" role="dialog" aria-modal="true" aria-label="Lernsession">
        <header class="session-bar">
          <button class="round" data-s="close" aria-label="Session beenden">${ICON.x}</button>
          <div class="progress"><div class="progress-track"><div class="progress-fill"></div></div><div class="progress-text"></div></div>
          <button class="round" data-s="undo" aria-label="Letzte Bewertung rückgängig" disabled>${ICON.undo}</button>
        </header>
        <div class="session-title"></div>
        <div class="stage"><div class="flash-under"></div></div>
        <div class="session-actions"></div>
      </div>
    </div>`);
  const sessionEl = $('.session', root);
  const stage = $('.stage', root);
  const under = $('.flash-under', root);
  const actions = $('.session-actions', root);
  const undoBtn = $('[data-s="undo"]', root);
  let H = window.innerHeight;
  const slide = new Spring(H, { damping: 1, response: 0.42 }, (y) => { sessionEl.style.transform = `translate3d(0, ${y}px, 0)`; });

  const title = {
    weighted: 'Schwächen zuerst',
    equal: 'Alle zufällig',
    retry: 'Wiederholung',
  }[spec.type] || spec.label || '';
  $('.session-title', root).textContent = title;

  const updateTop = () => {
    const done = Math.min(S.i, queue.length);
    $('.progress-fill', root).style.width = `${(done / queue.length) * 100}%`;
    $('.progress-text', root).textContent = `${Math.min(S.i + 1, queue.length)} / ${queue.length}`;
    if (S.done) $('.progress-text', root).textContent = `${queue.length} / ${queue.length}`;
    undoBtn.disabled = !S.results.length;
    under.classList.toggle('none', S.done || S.i >= queue.length - 1);
  };

  const currentCard = () => cardById(queue[S.i]);

  const renderActions = () => {
    if (S.done) {
      const wrong = [...new Set(S.results.filter((r) => !r.correct).map((r) => r.id))];
      actions.innerHTML = `
        ${wrong.length ? `<button class="pill-btn" data-s="retry">${ICON.reset}<span>Falsche (${wrong.length})</span></button>` : ''}
        <button class="pill-btn primary" data-s="close">${ICON.check}<span>Fertig</span></button>`;
      return;
    }
    const card = currentCard();
    if (!S.revealed) {
      actions.innerHTML = `
        ${card.hint ? `<button class="pill-btn hint" data-s="hint" ${S.hintShown ? 'disabled' : ''}>${ICON.bulb}<span>Hinweis</span></button>` : ''}
        <button class="pill-btn primary" data-s="flip">${ICON.flip}<span>Umdrehen</span></button>`;
    } else {
      const l = card.level;
      const move = (to) => (to === l ? `bleibt bei ${fmtLevel(l)}` : `${fmtLevel(l)} → ${fmtLevel(to)}`);
      actions.innerHTML = `
        <button class="rate-btn no" data-s="no"><b>${ICON.x}Nicht gewusst</b><small>${move(clampLevel(l - 1))}</small></button>
        <button class="rate-btn yes" data-s="yes"><b>${ICON.check}Gewusst</b><small>${move(clampLevel(l + 1))}</small></button>`;
    }
  };

  // ---- Eine Karte als physisches Objekt -----------------------------------
  function CardView(card, { from = 0, revealed = false } = {}) {
    const cat = catById(card.categoryId) || catById('inbox');
    const node = el(`
      <div class="flash ${reduceMotion.matches ? 'reduce' : ''}" role="group" aria-label="Karteikarte">
        <div class="flash-inner">
          <div class="face front" aria-hidden="${revealed}">
            <div class="face-top"><span class="face-label">Frage</span><span class="face-cat" style="--c:var(--${cat.color})"><i></i><span>${esc(cat.name)}</span></span></div>
            <div class="face-scroll"><div class="face-content">
              <div class="face-text ${sizeClass(card.front)}">${esc(card.front)}</div>
              ${card.hint ? `<div class="hint-wrap"><div><div class="hint-box"><div class="hint-label">${ICON.bulb}Hinweis</div>${esc(card.hint)}</div></div></div>` : ''}
            </div></div>
            <div class="face-foot">Tippen zum Umdrehen</div>
          </div>
          <div class="face back" aria-hidden="${!revealed}">
            <div class="face-top"><span class="face-label">Antwort</span><span class="lvl" style="--c:${levelColor(card.level)}">${fmtLevel(card.level)}</span></div>
            <div class="face-scroll"><div class="face-content">
              <div class="face-q">${esc(card.front)}</div>
              ${backHTML(card)}
            </div></div>
            <div class="face-foot">Wische nach rechts oder links – oder tippe unten</div>
          </div>
        </div>
        <div class="tint yes"><span>${ICON.check}Gewusst</span></div>
        <div class="tint no"><span>${ICON.x}Nicht gewusst</span></div>
      </div>`);
    const inner = $('.flash-inner', node);
    const tYes = $('.tint.yes', node);
    const tNo = $('.tint.no', node);
    const W = () => stage.clientWidth || 320;
    const st = { x: from ? from * W() * 1.3 : 0, enter: from ? 1 : 0, angle: revealed ? 180 : 0 };

    const apply = () => {
      const w = W();
      const sc = 0.94 + 0.06 * st.enter;
      const ty = (1 - st.enter) * 30;
      node.style.transform = `translate3d(${st.x}px, ${ty}px, 0) rotate(${(st.x / w) * 9}deg) scale(${sc})`;
      node.style.opacity = from ? '1' : String(clamp(0.55 + st.enter * 0.9, 0, 1));
      tYes.style.opacity = String(clamp(st.x / (w * 0.28), 0, 1));
      tNo.style.opacity = String(clamp(-st.x / (w * 0.28), 0, 1));
      if (!reduceMotion.matches) inner.style.transform = `rotateY(${st.angle}deg)`;
    };
    const xs = new Spring(st.x, { damping: 1, response: 0.38, precision: 0.5 }, (x) => { st.x = x; apply(); });
    const es = new Spring(st.enter, { damping: 1, response: 0.36, precision: 0.002 }, (v) => { st.enter = v; apply(); });
    const fs = new Spring(st.angle, { damping: 0.82, response: 0.5, precision: 0.2 }, (a) => { st.angle = a; apply(); });
    if (reduceMotion.matches && revealed) node.classList.add('flipped');

    const view = {
      node,
      card,
      enter() {
        apply();
        es.to(1);
        if (from) xs.to(0, { damping: 0.9, response: 0.42 });
      },
      flip(toBack) {
        const target = toBack ? 180 : 0;
        $('.face.front', node).setAttribute('aria-hidden', String(toBack));
        $('.face.back', node).setAttribute('aria-hidden', String(!toBack));
        if (reduceMotion.matches) node.classList.toggle('flipped', toBack);
        else fs.to(target);
      },
      get flipped() { return fs.target === 180 || node.classList.contains('flipped'); },
      showHint() { const h = $('.hint-wrap', node); if (h) h.classList.add('show'); },
      leave(dir, velocity) {
        node.classList.add('locked');
        node.style.zIndex = '3';
        const w = W();
        const v = velocity || dir * 2200;
        xs.to(dir * w * 1.6, { damping: 1, response: 0.42, velocity: v, onRest: () => node.remove() });
        if (reduceMotion.matches) node.remove();
      },
      sink() {
        node.classList.add('locked');
        es.to(0, { response: 0.3, onRest: () => node.remove() });
        if (reduceMotion.matches) node.remove();
      },
    };

    // Gesten: Tippen = umdrehen, horizontal wischen = bewerten (nach dem Aufdecken)
    let drag = null;
    node.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      drag = { id: e.pointerId, x0: e.clientX, y0: e.clientY, sx: st.x, axis: null, vt: new VelocityTracker(), t0: performance.now() };
      drag.vt.add(e.clientX, e.clientY);
      xs.stop();
    });
    node.addEventListener('pointermove', (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      drag.vt.add(e.clientX, e.clientY);
      const dx = e.clientX - drag.x0;
      const dy = e.clientY - drag.y0;
      if (!drag.axis) {
        if (Math.hypot(dx, dy) < 10) return;
        drag.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
        if (drag.axis === 'x') { try { node.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ } }
      }
      if (drag.axis !== 'x') return;
      const raw = drag.sx + dx;
      xs.set(S.revealed ? raw : rubber(raw, W(), 0.25));
    });
    const end = (e, cancelled) => {
      if (!drag || e.pointerId !== drag.id) return;
      const d = drag;
      drag = null;
      if (!d.axis) {
        if (!cancelled && performance.now() - d.t0 < 600) onTap();
        return;
      }
      if (d.axis !== 'x') return;
      const v = d.vt.get().x;
      const proj = st.x + project(v, 0.99);
      if (!cancelled && S.revealed && Math.abs(proj) > W() * 0.38 && Math.sign(proj) === Math.sign(st.x || proj)) {
        rate(proj > 0, v);
      } else {
        xs.to(0, { velocity: v, damping: 0.78, response: 0.4 });
      }
    };
    node.addEventListener('pointerup', (e) => end(e, false));
    node.addEventListener('pointercancel', (e) => end(e, true));
    return view;
  }

  function onTap() {
    if (S.done || !S.view) return;
    if (!S.revealed) { reveal(); return; }
    S.view.flip(!S.view.flipped);
    haptic(4);
  }

  function reveal() {
    if (S.revealed || S.done) return;
    S.revealed = true;
    S.view.flip(true);
    haptic(6);
    renderActions();
  }

  function showHint() {
    if (S.revealed || S.hintShown) return;
    S.hintShown = true;
    S.view.showHint();
    renderActions();
  }

  function mount(opts = {}) {
    S.revealed = !!opts.revealed;
    S.hintShown = false;
    const view = CardView(currentCard(), opts);
    stage.appendChild(view.node);
    S.view = view;
    view.enter();
    updateTop();
    renderActions();
  }

  function rate(correct, velocity) {
    if (!S.revealed || S.done || !S.view) return;
    const card = currentCard();
    const rec = rateCard(card, correct);
    S.results.push(rec);
    haptic(correct ? 12 : [14, 50, 14]);
    S.view.leave(correct ? 1 : -1, velocity);
    S.view = null;
    S.i++;
    if (S.i >= queue.length) showSummary();
    else mount();
  }

  function undo() {
    const rec = S.results.pop();
    if (!rec) return;
    undoRating(rec);
    if (S.done) {
      S.done = false;
      const sm = $('.summary', stage);
      if (sm) sm.remove();
    } else if (S.view) {
      S.view.sink();
      S.view = null;
    }
    S.i--;
    mount({ from: rec.correct ? 1 : -1, revealed: true });
    haptic(6);
  }

  function showSummary() {
    S.done = true;
    const right = S.results.filter((r) => r.correct).length;
    const wrong = S.results.length - right;
    const pct = S.results.length ? Math.round((right / S.results.length) * 100) : 0;
    const up = S.results.filter((r) => r.to > r.from).length;
    const down = S.results.filter((r) => r.to < r.from).length;
    const C = 2 * Math.PI * 64;
    const msg = pct >= 90 ? 'Hervorragend!' : pct >= 70 ? 'Stark gemacht!' : pct >= 50 ? 'Gute Runde!' : 'Dranbleiben – das wird!';
    const node = el(`
      <div class="summary">
        <div class="ring">
          <svg viewBox="0 0 150 150"><circle class="track" cx="75" cy="75" r="64"/><circle class="val" cx="75" cy="75" r="64" stroke-dasharray="${C}" stroke-dashoffset="${C}"/></svg>
          <div class="ring-label"><b>${pct}%</b><small>gewusst</small></div>
        </div>
        <h2>${msg}</h2>
        <p>${plural(S.results.length, 'Karte', 'Karten')} gelernt</p>
        <div class="summary-grid">
          <div class="g"><b>${right}</b><span>gewusst</span></div>
          <div class="r"><b>${wrong}</b><span>nicht gewusst</span></div>
        </div>
        <p style="margin-top:14px;font-size:13px">${up} ${up === 1 ? 'Karte' : 'Karten'} aufgestiegen · ${down} abgestiegen</p>
      </div>`);
    stage.appendChild(node);
    const val = $('.val', node);
    if (right === 0) val.style.display = 'none';
    const sp = new Spring(0, { damping: 1, response: 0.4, precision: 0.002 }, (p) => {
      node.style.opacity = String(clamp(p, 0, 1));
      node.style.transform = `scale(${0.94 + 0.06 * p})`;
    });
    sp.to(1);
    requestAnimationFrame(() => requestAnimationFrame(() => { val.style.strokeDashoffset = String(C * (1 - pct / 100)); }));
    haptic([10, 60, 10]);
    updateTop();
    renderActions();
  }

  const ov = {
    kind: 'session',
    show() {
      $('#overlays').appendChild(root);
      H = sessionEl.offsetHeight || window.innerHeight;
      slide.set(H);
      mount();
      requestAnimationFrame(() => slide.to(0));
      document.addEventListener('keydown', onKey);
    },
    hide() {
      root.style.pointerEvents = 'none';
      document.removeEventListener('keydown', onKey);
      slide.to(H, { response: 0.4, onRest: () => root.remove() });
      setTimeout(() => root.remove(), 1500);
      refresh();
    },
    onBack() { closeOverlay(ov); },
  };

  function onKey(e) {
    if (topOverlay() !== ov) return;
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); if (S.done) closeOverlay(ov); else onTap(); }
    else if (e.key === 'ArrowRight' && S.revealed) rate(true);
    else if (e.key === 'ArrowLeft' && S.revealed) rate(false);
    else if (e.key.toLowerCase() === 'h') showHint();
    else if (e.key === 'Escape') closeOverlay(ov);
    else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') undo();
  }

  root.addEventListener('click', (e) => {
    const b = e.target.closest('[data-s]');
    if (!b) return;
    const a = b.dataset.s;
    if (a === 'close') closeOverlay(ov);
    else if (a === 'undo') undo();
    else if (a === 'flip') reveal();
    else if (a === 'hint') showHint();
    else if (a === 'yes') rate(true);
    else if (a === 'no') rate(false);
    else if (a === 'retry') {
      const ids = [...new Set(S.results.filter((r) => !r.correct).map((r) => r.id))];
      closeOverlay(ov);
      setTimeout(() => startSession({ type: 'retry', ids }), 120);
    }
  });

  pushOverlay(ov);
}

// ---------------------------------------------------------------------------
// Backup, Import, Text-Import
// ---------------------------------------------------------------------------

async function exportBackup() {
  const json = JSON.stringify({ app: 'karteikarten-ap2', version: 1, exported: new Date().toISOString(), data: DB }, null, 2);
  const name = `gossensbestermann-backup-${dayKey()}.json`;
  const file = new File([json], name, { type: 'application/json' });
  const canShare = !!(navigator.canShare && navigator.canShare({ files: [file] }));
  let how = 'download';
  if (canShare) {
    how = await actionSheet({
      title: 'Backup exportieren',
      message: `${plural(DB.cards.length, 'Karte', 'Karten')} · ${plural(sortedCats().length, 'Kategorie', 'Kategorien')}`,
      actions: [
        { label: 'Teilen (z. B. Google Drive)', value: 'share' },
        { label: 'In „Downloads“ speichern', value: 'download' },
      ],
    });
    if (!how) return;
  }
  try {
    if (how === 'share') {
      await navigator.share({ files: [file], title: 'GossensBesterMann-Backup' });
    } else {
      const url = URL.createObjectURL(file);
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    }
    DB.meta.lastBackup = Date.now();
    save();
    renderSettings();
    toast('Backup exportiert');
  } catch (e) {
    if (e && e.name === 'AbortError') return;
    toast('Export fehlgeschlagen', 'error');
  }
}

async function importBackupFile(file) {
  let parsed;
  try {
    parsed = JSON.parse(await file.text());
  } catch (e) {
    toast('Die Datei ist kein gültiges Backup.', 'error');
    return;
  }
  const incoming = normalize(parsed && parsed.data ? parsed.data : parsed);
  if (!incoming.cards.length && incoming.categories.length <= 1) {
    toast('Im Backup wurden keine Karten gefunden.', 'error');
    return;
  }
  const mode = await actionSheet({
    title: 'Backup importieren',
    message: `${plural(incoming.cards.length, 'Karte', 'Karten')} · ${plural(incoming.categories.length, 'Kategorie', 'Kategorien')} gefunden`,
    actions: [
      { label: 'Zusammenführen', value: 'merge' },
      { label: 'Alles ersetzen', value: 'replace', style: 'destructive' },
    ],
  });
  if (!mode) return;
  if (mode === 'replace') {
    const ok = await confirmDialog({ title: 'Alles ersetzen?', message: 'Deine aktuellen Karten werden durch das Backup ersetzt.', confirm: 'Ersetzen', destructive: true });
    if (!ok) return;
    DB = incoming;
  } else {
    for (const c of incoming.categories) {
      const same = catById(c.id) || DB.categories.find((x) => x.name.toLowerCase() === c.name.toLowerCase());
      if (!same) DB.categories.push(c);
      else if (same.id !== c.id) for (const card of incoming.cards) if (card.categoryId === c.id) card.categoryId = same.id;
    }
    for (const card of incoming.cards) {
      const ex = cardById(card.id);
      if (!ex) DB.cards.push(card);
      else if (card.updated > ex.updated || card.last > ex.last) Object.assign(ex, card);
    }
    for (const [k, v] of Object.entries(incoming.log)) {
      const cur = DB.log[k];
      DB.log[k] = cur ? { r: Math.max(cur.r, v.r), w: Math.max(cur.w, v.w) } : v;
    }
  }
  save();
  refresh();
  toast('Backup importiert');
}

function openTextImport() {
  let catId = 'inbox';
  const body = `
    <p class="footnote" style="margin:4px 36px 12px">Eine Karte pro Zeile. Felder mit Semikolon <b>;</b> oder Tabulator trennen:</p>
    <div class="list" style="margin-bottom:12px"><div class="row"><div class="row-main" style="font-family:ui-monospace,monospace;font-size:13px;line-height:1.5">Vorderseite ; Rückseite ; Hinweis ; Kategorie</div></div></div>
    <textarea class="big" data-ti placeholder="Was ist ein Subnetz?; Ein logisch abgegrenzter Teil eines IP-Netzes; denk an die Maske; Netzwerktechnik&#10;OSI-Schicht 3?; Vermittlungsschicht (Network Layer)"></textarea>
    <p class="footnote">Hinweis und Kategorie sind optional. Unbekannte Kategorien werden angelegt.</p>
    <div class="form-label">Kategorie, falls keine angegeben</div>
    <div class="cat-picker" id="ti-cats"></div>
    <div class="btn-stack"><button class="btn-primary" data-ti-go disabled>Importieren</button></div>`;
  const parse = (txt) => txt.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).map((line) => {
    const parts = (line.includes('\t') ? line.split('\t') : line.split(';')).map((p) => p.trim());
    return parts.length >= 2 && parts[0] && parts[1] ? { front: parts[0], back: parts[1], hint: parts[2] || '', cat: parts[3] || '' } : null;
  });
  const sheet = openSheet({
    title: 'Text-Import',
    body,
    left: { label: 'Abbrechen' },
    beforeClose: async () => (!$('[data-ti]', sheet.body).value.trim() ? true : confirmDialog({ title: 'Import verwerfen?', confirm: 'Verwerfen', destructive: true })),
    onMount: (sh) => renderCats(sh),
  });
  function renderCats(sh) {
    $('#ti-cats', sh.body).innerHTML = catChipsHTML(catId, 'data-ti-cat');
  }
  const ta = $('[data-ti]', sheet.body);
  const btn = $('[data-ti-go]', sheet.body);
  ta.addEventListener('input', () => {
    const rows = parse(ta.value);
    const ok = rows.filter(Boolean).length;
    const bad = rows.length - ok;
    btn.disabled = !ok;
    btn.textContent = ok ? `${plural(ok, 'Karte', 'Karten')} importieren${bad ? ` (${bad} Zeile${bad === 1 ? '' : 'n'} ungültig)` : ''}` : 'Importieren';
  });
  sheet.body.addEventListener('click', (e) => {
    const c = e.target.closest('[data-ti-cat]');
    if (c) { catId = c.dataset.tiCat; renderCats(sheet); return; }
    if (e.target.closest('[data-ti-go]')) {
      const rows = parse(ta.value).filter(Boolean);
      for (const r of rows) {
        let cid = catId;
        if (r.cat) {
          const ex = findCatByName(r.cat);
          cid = (ex || createCategory(r.cat)).id;
        }
        DB.cards.push({ id: uid(), front: r.front, back: r.back, hint: r.hint, categoryId: cid, level: 0, created: Date.now(), updated: Date.now(), right: 0, wrong: 0, last: 0 });
      }
      save();
      requestPersist();
      refresh();
      ta.value = '';
      toast(`${plural(rows.length, 'Karte', 'Karten')} importiert`);
      sheet.close();
    }
  });
}

// ---------------------------------------------------------------------------
// Globale Aktionen (Event-Delegation)
// ---------------------------------------------------------------------------

const ACTIONS = {
  tab: (b) => setTab(b.dataset.tab),
  'new-card': () => openCardEditor(null, UI.tab === 'cards' && catById(UI.cardsFilter) && !isGroup(catById(UI.cardsFilter)) ? { categoryId: UI.cardsFilter } : {}),
  'edit-card': (b) => { const c = cardById(b.dataset.id); if (c) openCardEditor(c); },
  'new-category': () => openCategoryEditor(null),
  'new-group': () => openGroupEditor(null),
  'edit-category': (b) => { const c = catById(b.dataset.id); if (c) openCategoryEditor(c); },
  'set-size': (b) => { DB.settings.sessionSize = +b.dataset.size; save(); renderLearn(); haptic(4); },
  'start-weighted': () => startSession({ type: 'weighted' }),
  'start-equal': () => startSession({ type: 'equal' }),
  'start-level': (b) => { const l = +b.dataset.level; startSession({ type: 'level', level: l, label: `Ebene ${fmtLevel(l)}` }); },
  'start-group': (b) => { const g = catById(b.dataset.id); if (g) startSession({ type: 'group', groupId: g.id, label: g.name }); },
  'pick-category': () => pickCategorySheet(),
  'pick-level': () => pickLevelSheet(),
  filter: (b) => { UI.cardsFilter = b.dataset.cat; renderCardsList(); },
  sort: async () => {
    const v = await actionSheet({ title: 'Sortieren', actions: Object.entries(SORTS).map(([k, [label]]) => ({ label: (DB.settings.cardSort === k ? '✓ ' : '') + label, value: k })) });
    if (v) { DB.settings.cardSort = v; save(); renderCardsList(); }
  },
  'toggle-select': () => setSelectMode(!UI.select),
  'toggle-card': (b) => {
    const id = b.dataset.id;
    if (UI.selected.has(id)) UI.selected.delete(id); else UI.selected.add(id);
    const chk = $('.check', b);
    if (chk) chk.classList.toggle('on', UI.selected.has(id));
    renderSelectBar();
    haptic(4);
  },
  'select-all': () => {
    const list = filteredCards();
    const all = list.every((c) => UI.selected.has(c.id));
    for (const c of list) { if (all) UI.selected.delete(c.id); else UI.selected.add(c.id); }
    renderCardsList();
  },
  'bulk-move': async () => {
    const n = UI.selected.size;
    const v = await actionSheet({
      title: `${plural(n, 'Karte', 'Karten')} verschieben nach …`,
      actions: [...sortedCats().map((c) => ({ label: catPath(c), value: c.id })), { label: '+ Neue Kategorie', value: '__new' }],
    });
    if (!v) return;
    let target = v;
    if (v === '__new') {
      const name = await promptDialog({ title: 'Neue Kategorie', placeholder: 'Name', confirm: 'Anlegen' });
      if (!name) return;
      const ex = findCatByName(name);
      target = (ex || createCategory(name)).id;
    }
    for (const id of UI.selected) { const c = cardById(id); if (c) { c.categoryId = target; c.updated = Date.now(); } }
    save();
    toast(`${plural(n, 'Karte', 'Karten')} nach „${catById(target).name}“ verschoben`);
    setSelectMode(false);
    refresh();
  },
  'bulk-level': async () => {
    const n = UI.selected.size;
    const v = await actionSheet({
      title: `Ebene für ${plural(n, 'Karte', 'Karten')} setzen`,
      actions: [...LEVELS].reverse().map((l) => ({ label: `Ebene ${fmtLevel(l)}`, value: String(l) })),
    });
    if (v == null) return;
    for (const id of UI.selected) { const c = cardById(id); if (c) c.level = +v; }
    save();
    toast(`Ebene ${fmtLevel(+v)} gesetzt`);
    setSelectMode(false);
    refresh();
  },
  'bulk-delete': async () => {
    const n = UI.selected.size;
    const ok = await confirmDialog({ title: `${plural(n, 'Karte', 'Karten')} löschen?`, message: 'Das kann nicht rückgängig gemacht werden.', confirm: 'Löschen', destructive: true });
    if (!ok) return;
    DB.cards = DB.cards.filter((c) => !UI.selected.has(c.id));
    save();
    toast(`${plural(n, 'Karte', 'Karten')} gelöscht`);
    setSelectMode(false);
    refresh();
  },
  'restore-deck': async () => {
    const r = await loadDeck({ restore: true });
    if (!r) toast('Kartensatz konnte nicht geladen werden', 'error');
    else if (!r.added) toast('Es fehlen keine Prüfungskarten');
  },
  'auto-distribute': () => openAutoDistribute(),
  'manual-distribute': () => { UI.cardsFilter = cardsIn('inbox').length ? 'inbox' : 'all'; setTab('cards'); setSelectMode(true); },
  export: () => exportBackup(),
  import: () => { const f = $('#file-input'); f.value = ''; f.click(); },
  'text-import': () => openTextImport(),
  install: async () => {
    if (!UI.installEvt) return;
    UI.installEvt.prompt();
    try { await UI.installEvt.userChoice; } catch (e) { /* ignore */ }
    UI.installEvt = null;
    refresh();
  },
  'install-voice': async () => {
    try {
      toast('Sprachpaket wird geladen …');
      const ok = await Voice.installLocal();
      await Voice.checkLocal();
      renderSettings();
      toast(ok === false ? 'Sprachpaket konnte nicht geladen werden' : 'Offline-Diktat bereit', ok === false ? 'error' : 'ok');
    } catch (e) {
      toast('Sprachpaket konnte nicht geladen werden', 'error');
    }
  },
  'reset-levels': async () => {
    const ok = await confirmDialog({ title: 'Lernstand zurücksetzen?', message: 'Alle Karten werden wieder auf Ebene 0 gesetzt. Die Karten selbst bleiben erhalten.', confirm: 'Zurücksetzen', destructive: true });
    if (!ok) return;
    for (const c of DB.cards) { c.level = 0; c.right = 0; c.wrong = 0; c.last = 0; }
    DB.log = {};
    save();
    refresh();
    toast('Lernstand zurückgesetzt');
  },
  wipe: async () => {
    const ok = await confirmDialog({ title: 'Alle Daten löschen?', message: `${plural(DB.cards.length, 'Karte', 'Karten')} und alle Kategorien werden unwiderruflich gelöscht. Exportiere vorher ein Backup!`, confirm: 'Alles löschen', destructive: true });
    if (!ok) return;
    const ok2 = await confirmDialog({ title: 'Wirklich sicher?', message: 'Dieser Schritt kann nicht rückgängig gemacht werden.', confirm: 'Endgültig löschen', destructive: true });
    if (!ok2) return;
    DB = defaultDB();
    save();
    refresh();
    toast('Alle Daten gelöscht');
  },
};

document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-action]');
  if (!b || b.disabled) return;
  const fn = ACTIONS[b.dataset.action];
  if (fn) fn(b, e);
});

document.addEventListener('change', (e) => {
  const t = e.target;
  if (t.matches('[data-setting]')) {
    DB.settings[t.dataset.setting] = t.checked;
    save();
    if (t.checked && t.dataset.setting === 'haptics') haptic(10);
  }
  if (t.id === 'file-input' && t.files && t.files[0]) importBackupFile(t.files[0]);
});

// Ctrl/Cmd+K: neue Karte (Desktop-Komfort)
document.addEventListener('keydown', (e) => {
  if (stack.length) return;
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openCardEditor(); }
});

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Mitgelieferter Kartensatz (deck/ap2.txt) – wird automatisch übernommen
// ---------------------------------------------------------------------------

const DECK_URL = 'deck/ap2.txt';

function fnv(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}

function parseDeck(txt) {
  const deck = { groups: [], cats: [], cards: [] };
  let group = null;
  let cat = null;
  let topic = '';
  for (const raw of txt.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('//') || line.startsWith('@')) continue;
    if (line.startsWith('###')) { topic = line.slice(3).trim(); continue; }
    if (line.startsWith('##')) {
      const [id, name] = line.slice(2).split('|').map((s) => s.trim());
      cat = { id: `deck-${id}`, name, parentId: group && group.id, color: group ? group.color : 'blue', order: deck.cats.length };
      deck.cats.push(cat);
      topic = '';
      continue;
    }
    if (line.startsWith('#')) {
      const [id, name, color] = line.slice(1).split('|').map((s) => s.trim());
      group = { id: `deck-${id}`, name, color: COLORS.includes(color) ? color : 'blue', order: deck.groups.length };
      deck.groups.push(group);
      cat = null;
      continue;
    }
    if (!cat) continue;
    const parts = line.split(' | ').map((s) => s.trim());
    if (parts.length < 2) continue;
    const front = parts[0];
    const back = parts.length >= 3 ? `${parts[1]}\n${parts.slice(2).join(' | ')}` : parts[1];
    deck.cards.push({ id: `d-${fnv(`${cat.id}|${front}`)}`, front, back, hint: topic ? `Thema: ${topic}` : '', categoryId: cat.id });
  }
  return deck;
}

// Fügt neue Karten/Kategorien hinzu, aktualisiert unveränderte Kartensatz-Karten.
// Lernstand, eigene Karten und eigene Änderungen bleiben unangetastet; gelöschte Karten kommen nicht wieder.
function mergeDeck(deck, { restore = false } = {}) {
  const seenCards = new Set(restore ? [] : DB.meta.deckIds || []);
  const seenCats = new Set(DB.meta.deckCats || []);
  const now = Date.now();
  let added = 0;
  let updated = 0;

  for (const d of [...deck.groups.map((g) => ({ ...g, kind: 'group' })), ...deck.cats]) {
    const ex = catById(d.id);
    if (!ex && (!seenCats.has(d.id) || restore)) {
      const cat = { id: d.id, name: d.name, color: d.color, keywords: [], created: now, parentId: d.parentId || null, order: d.order, deck: true };
      if (d.kind === 'group') cat.kind = 'group';
      DB.categories.push(cat);
    } else if (ex && ex.deck) {
      Object.assign(ex, { name: d.name, order: d.order });
      if (!isGroup(ex) && d.parentId && catById(d.parentId)) ex.parentId = d.parentId;
    }
    seenCats.add(d.id);
  }

  for (const c of deck.cards) {
    const ex = cardById(c.id);
    if (!seenCards.has(c.id) && !ex) {
      const target = catById(c.categoryId);
      DB.cards.push({ ...c, categoryId: target && !isGroup(target) ? c.categoryId : 'inbox', level: 0, created: now, updated: now, right: 0, wrong: 0, last: 0, deck: true });
      added++;
    } else if (ex && ex.deck && (ex.front !== c.front || ex.back !== c.back || ex.hint !== c.hint)) {
      Object.assign(ex, { front: c.front, back: c.back, hint: c.hint });
      updated++;
    }
    seenCards.add(c.id);
  }

  DB.meta.deckIds = [...new Set([...(DB.meta.deckIds || []), ...seenCards])];
  DB.meta.deckCats = [...seenCats];
  return { added, updated };
}

async function loadDeck(opts = {}) {
  let txt;
  try {
    const res = await fetch(DECK_URL, { cache: 'no-cache' });
    if (!res.ok) return null;
    txt = await res.text();
  } catch (e) {
    return null; // offline und noch nicht im Cache – beim nächsten Start erneut
  }
  const hash = fnv(txt);
  if (!opts.restore && DB.meta.deckHash === hash) return { added: 0, updated: 0, total: parseDeck(txt).cards.length };
  const deck = parseDeck(txt);
  const r = mergeDeck(deck, opts);
  DB.meta.deckHash = hash;
  DB.meta.deckTotal = deck.cards.length;
  save();
  if (!stack.length) refresh();
  if (r.added) toast(`${plural(r.added, 'neue Prüfungskarte', 'neue Prüfungskarten')} geladen`);
  else if (r.updated) toast(`${plural(r.updated, 'Prüfungskarte', 'Prüfungskarten')} aktualisiert`);
  return { ...r, total: deck.cards.length };
}

let persistAsked = false;
function requestPersist() {
  if (persistAsked || !navigator.storage || !navigator.storage.persist) return;
  persistAsked = true;
  navigator.storage.persist().then(updatePersistStatus).catch(() => {});
}

function boot() {
  loadDB();
  renderTabbar();
  initCardsView();
  refresh();
  $('#view-learn').classList.add('active');
  for (const v of $$('.view')) {
    v.addEventListener('scroll', () => v.classList.toggle('scrolled', v.scrollTop > 40), { passive: true });
  }
  if (DB.cards.length) requestPersist();

  Voice.checkLocal().then(() => renderSettings());
  loadDeck().then((r) => { if (r && r.added) requestPersist(); });

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    UI.installEvt = e;
    renderLearn();
    renderSettings();
  });
  window.addEventListener('appinstalled', () => {
    UI.installEvt = null;
    toast('App installiert');
    refresh();
  });

  // Daten aus einem anderen Tab übernehmen
  window.addEventListener('storage', (e) => {
    if (e.key === KEY && !stack.length) { loadDB(); refresh(); }
  });

  // App-Shortcuts (langes Drücken auf das App-Icon)
  const action = new URLSearchParams(location.search).get('action');
  if (action) {
    history.replaceState(null, '', location.pathname);
    if (action === 'new') setTimeout(() => openCardEditor(), 50);
    if (action === 'weak' && DB.cards.length) setTimeout(() => startSession({ type: 'weighted' }), 50);
  }

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.register('sw.js').catch((err) => console.warn('SW', err));
  }
}

boot();

})();
