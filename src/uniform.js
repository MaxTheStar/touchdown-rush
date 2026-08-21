// ============================================================
// TOUCHDOWN FUN — uniform.js: 🎽 THE UNIFORM DESIGNER
// ------------------------------------------------------------
// Design your OWN team kit! Pick a jersey color and a helmet color, give it a
// name, and save it to your Locker — then it shows up right in CHOOSE YOUR TEAM
// next to the real teams, and your players wear it on the field. Make a whole
// wardrobe of them (up to six) and edit or toss any you like.
//
//   HOW IT WEARS — the game already treats every uniform as a little team of
//   two colors (jersey + helmet); it draws the chibi player straight from those.
//   So a custom kit is just `{ abbr, name, jersey, helmet }` — main.js's
//   allTeams() adds our customs to the menu list, and everything (the field
//   player, the menu preview, the score code) just works, no new art needed.
//
//   WHERE — it lives in the 🛍 Pro Shop (a "🎽 UNIFORM DESIGNER" button), the
//   same tidy home as Card Packs and the Stadium — so no new menu clutter.
//
// Saved in `tdr-custom-uniforms` = an array of { id, abbr, name, jersey, helmet }
// (jersey/helmet are 0xRRGGBB numbers, exactly like the built-in uniforms).
// ============================================================
(function () {
  'use strict';

  const T = window.TDStats ? TDStats.shared : null;
  const store = (k, v) => { if (T) T.store(k, v); };
  const load  = (k, f) => (T ? T.load(k, f) : f);
  const $ = id => document.getElementById(id);

  const MAX = 6;   // how many custom kits you can keep

  // A friendly, bright palette to pick from (jersey AND helmet share it).
  const PALETTE = [
    '#e6352b', '#ff7a1a', '#ffb01f', '#ffd60a', '#2fbf4f', '#0aa06e',
    '#17c3c3', '#2f8fff', '#0b2a6b', '#7a4dff', '#c04dff', '#ff5bd0',
    '#f4f4f7', '#9aa3b0', '#3a3f4a', '#101014',
  ];
  // Fun, made-up nicknames for the 🎲 button (kept generic — no real NFL names).
  const NAMES = ['DRAGONS', 'THUNDER', 'BLAZE', 'COMETS', 'SHARKS', 'RAPTORS',
    'STORM', 'VOLTS', 'PHOENIX', 'YETIS', 'NINJAS', 'ROCKETS', 'GALAXY', 'TIGERS'];

  const toHex = n => '#' + (n >>> 0).toString(16).padStart(6, '0').slice(-6);
  const toInt = h => parseInt(h.replace('#', ''), 16) >>> 0;

  // Load the locker (default: empty). Drop anything malformed just in case.
  let customs = load('custom-uniforms', []);
  if (!Array.isArray(customs)) customs = [];
  customs = customs.filter(c => c && typeof c.jersey === 'number' && typeof c.helmet === 'number');
  function save() { store('custom-uniforms', customs); }

  // The editor's working copy: what you're building right now.
  let editing = null;                 // id of the kit being edited, or null = a new one
  let draft = { name: '', jersey: '#2f8fff', helmet: '#ffd60a' };

  // ---- 🏈 main.js: the extra "teams" to drop into CHOOSE YOUR TEAM --------
  function customTeams() {
    return customs.map(c => ({ abbr: c.abbr, name: c.name, jersey: c.jersey, helmet: c.helmet }));
  }

  // A short scoreboard code from the name (unique among YOUR kits).
  function abbrFor(name) {
    let base = (name || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 3) || 'MY';
    let abbr = base, n = 2;
    while (customs.some(c => c.abbr === abbr && c.id !== editing)) { abbr = base.slice(0, 2) + n; n++; }
    return abbr;
  }

  // ---- the little jersey+helmet preview (recolors live) -------------------
  function previewSVG(j, h) {
    return `<svg viewBox="0 0 120 150" width="118" height="148" aria-hidden="true">
      <rect x="30" y="62" width="60" height="60" rx="12" fill="${j}"/>
      <rect x="13" y="66" width="23" height="40" rx="10" fill="${j}"/>
      <rect x="84" y="66" width="23" height="40" rx="10" fill="${j}"/>
      <path d="M48 62 h24 v7 a12 11 0 0 1 -24 0 z" fill="#000" opacity="0.22"/>
      <text x="60" y="106" text-anchor="middle" font-family="Arial Black, Arial" font-size="33" fill="#fff" opacity="0.92">7</text>
      <circle cx="60" cy="34" r="24" fill="${h}"/>
      <ellipse cx="60" cy="46" rx="22" ry="9" fill="#000" opacity="0.16"/>
      <circle cx="60" cy="32" r="22" fill="${h}"/>
      <ellipse cx="51" cy="24" rx="9" ry="5" fill="#fff" opacity="0.30"/>
      <rect x="56" y="10" width="8" height="24" rx="2" fill="${j}"/>
      <ellipse cx="60" cy="45" rx="16" ry="4.5" fill="#e8e8e8"/>
    </svg>`;
  }

  function swatches(group, chosen) {
    return PALETTE.map(c =>
      `<span class="uni-sw${c.toLowerCase() === chosen.toLowerCase() ? ' on' : ''}" ` +
      `data-group="${group}" data-c="${c}" style="background:${c}"></span>`).join('');
  }

  // ---- draw the whole designer -------------------------------------------
  function render() {
    const prev = $('uni-preview'); if (prev) prev.innerHTML = previewSVG(draft.jersey, draft.helmet);
    const nm = $('uni-name'); if (nm && nm.value !== draft.name) nm.value = draft.name;
    const js = $('uni-jersey'); if (js) js.innerHTML = swatches('jersey', draft.jersey);
    const hs = $('uni-helmet'); if (hs) hs.innerHTML = swatches('helmet', draft.helmet);

    const saveBtn = $('uni-save');
    if (saveBtn) saveBtn.textContent = editing ? '💾 SAVE CHANGES' : '💾 SAVE TO LOCKER';

    // The locker of saved kits.
    const w = $('uni-wardrobe');
    if (w) {
      if (!customs.length) {
        w.innerHTML = `<div class="uni-empty">No custom kits yet — design one above and tap SAVE!</div>`;
      } else {
        w.innerHTML = customs.map(c => {
          const j = toHex(c.jersey), h = toHex(c.helmet);
          const on = c.id === editing ? ' editing' : '';
          return `<div class="uni-card${on}" data-edit="${c.id}">` +
            `<div class="uni-chip2" style="background:linear-gradient(135deg,${j} 48%,${h} 52%)"></div>` +
            `<div class="uni-card-nm">${esc(c.name)}</div>` +
            `<div class="uni-del" data-del="${c.id}" title="Delete">🗑</div></div>`;
        }).join('');
      }
    }
    const nb = $('uni-new');
    if (nb) nb.style.display = customs.length >= MAX ? 'none' : '';   // at cap: delete one to make room
    const cap = $('uni-cap');
    if (cap) cap.textContent = customs.length + ' / ' + MAX + ' in your locker';
  }

  function esc(s) { return String(s).replace(/[<>&]/g, m => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[m])); }

  function msg(text, good) {
    const m = $('uni-msg'); if (!m) return;
    m.textContent = text; m.className = 'uni-msg' + (good ? ' good' : ' warn');
    clearTimeout(msg._t); msg._t = setTimeout(() => { const e = $('uni-msg'); if (e) e.textContent = ''; }, 2200);
  }

  // ---- editing actions ----------------------------------------------------
  function pick(group, c) { draft[group] = c; render(); }
  function setName(v) { draft.name = v.slice(0, 14); }
  function randomName() { draft.name = NAMES[Math.floor(Math.random() * NAMES.length)]; render(); }

  function newDraft() {
    editing = null;
    draft = { name: '', jersey: '#2f8fff', helmet: '#ffd60a' };
    render();
  }

  function edit(id) {
    const c = customs.find(x => x.id === id); if (!c) return;
    editing = id;
    draft = { name: c.name, jersey: toHex(c.jersey), helmet: toHex(c.helmet) };
    render();
    const card = $('uniform-modal'); if (card) card.querySelector('.ov-card').scrollTop = 0;
  }

  function del(id) {
    customs = customs.filter(c => c.id !== id);
    if (editing === id) newDraft();
    save();
    render();
    if (window.TDMenu && TDMenu.refresh) TDMenu.refresh();   // a worn kit may have vanished — keep the menu safe
  }

  function saveKit() {
    let name = (draft.name || '').trim();
    if (!name) { msg('Give your kit a name first!', false); const n = $('uni-name'); if (n) n.focus(); return; }
    if (draft.jersey.toLowerCase() === draft.helmet.toLowerCase()) {
      msg('Pick two different colors so it pops!', false); return;
    }
    if (editing) {
      const c = customs.find(x => x.id === editing);
      if (c) { c.name = name; c.jersey = toInt(draft.jersey); c.helmet = toInt(draft.helmet); c.abbr = abbrFor(name); }
    } else {
      if (customs.length >= MAX) { msg('Locker full — delete one to make room.', false); return; }
      const id = 'u' + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36);
      customs.push({ id, abbr: abbrFor(name), name, jersey: toInt(draft.jersey), helmet: toInt(draft.helmet) });
      editing = id;
    }
    save();
    render();
    const c = customs.find(x => x.id === editing);
    if (window.TDShop && TDShop.celebrate) TDShop.celebrate($('uni-preview') || $('uniform-modal'), '🎽', name + '!');
    msg('Saved! Wear it in CHOOSE YOUR TEAM 🏈', true);
    if (c && window.TDMenu) { if (TDMenu.showTeam) TDMenu.showTeam(c.abbr); if (TDMenu.refresh) TDMenu.refresh(); }
  }

  // ---- pop-up plumbing ----------------------------------------------------
  function gameKeyboard(on) { try { window.game.input.keyboard.enabled = on; } catch (e) {} }
  function open()  { const m = $('uniform-modal'); if (!m) return; gameKeyboard(false); if (!editing) newDraft(); else render(); m.style.display = 'flex'; }
  function close() { const m = $('uniform-modal'); if (m) m.style.display = 'none'; gameKeyboard(true); }

  function wire() {
    const tap = (id, fn) => { const el = $(id); if (el) el.addEventListener('pointerdown', e => { e.preventDefault(); fn(); }); };
    tap('open-uniform', open);
    tap('uniform-close', close);
    tap('uni-save', saveKit);
    tap('uni-new', newDraft);
    tap('uni-dice', randomName);

    // swatch palettes (event delegation — the swatches are redrawn each render)
    ['uni-jersey', 'uni-helmet'].forEach(gid => {
      const host = $(gid);
      if (host) host.addEventListener('pointerdown', e => {
        const sw = e.target.closest('.uni-sw'); if (!sw) return;
        e.preventDefault(); pick(sw.getAttribute('data-group'), sw.getAttribute('data-c'));
      });
    });
    // the locker (edit / delete)
    const w = $('uni-wardrobe');
    if (w) w.addEventListener('pointerdown', e => {
      const d = e.target.closest('[data-del]'); if (d) { e.preventDefault(); e.stopPropagation(); del(d.getAttribute('data-del')); return; }
      const c = e.target.closest('[data-edit]'); if (c) { e.preventDefault(); edit(c.getAttribute('data-edit')); }
    });
    // the name field
    const nm = $('uni-name');
    if (nm) nm.addEventListener('input', e => setName(e.target.value));
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire);
  else wire();

  window.TDUniform = {
    customTeams, open, close,
    count: () => customs.length,
    _state: () => ({ customs: customs.slice(), editing, draft: Object.assign({}, draft) }),
  };
})();
