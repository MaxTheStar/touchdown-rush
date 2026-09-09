// ============================================================
// TOUCHDOWN FUN — rebrand.js: 🚚 RELOCATION & REBRAND (Round 10, pick ⑧)
// ------------------------------------------------------------
// The last pick of the last board, and the biggest one: stop borrowing
// somebody else's team. Move to a new city, name the team yourself, pick a
// three-letter code and your two colours — and then see YOUR name on the
// menu, on the scoreboard, in the standings, in the newspaper, on the
// trophies and on your poster.
//
// ⚠️ HOW IT WORKS IS THE WHOLE TRICK, AND IT IS ONE LINE. Every screen in this
// game gets its teams from main.js's `allTeams()`. So rather than hunting down
// forty places that draw a team name, rebrand.js hands `allTeams()` a REPLACED
// COPY of your team — same list, one entry swapped. Everything downstream
// shows the new name without knowing this feature exists. Two rules keep that
// safe, and both cost a bug if you break them:
//
//   1. IT RETURNS A COPY. It must never mutate the NFL_TEAMS entry itself, or
//      "reset to normal" would have nothing to go back to and every save that
//      mentions that team would be quietly rewritten.
//   2. THE COPY CARRIES `ratingKey`, the ORIGINAL three-letter code.
//      TEAM_RATINGS is keyed by code, so renaming SEA to DRG would otherwise
//      drop your team to a default 5/5 — a real change in how the game PLAYS,
//      caused by a cosmetic edit. main.js's `teamRating` prefers `ratingKey`.
//
// ⚠️ YOU CANNOT REBRAND DURING A SEASON OR A PLAYOFF RUN, and that is on
// purpose rather than laziness. Both of those save your team by its CODE
// (season.js stores `you: 'SEA'`, the bracket does the same). Change the code
// underneath them and the save is orphaned: the league would be looking for a
// team that no longer exists. Finishing first costs the player one season and
// removes a whole class of broken-save bugs. The colours and the name are
// safe to change any time; it is the CODE that has to wait.
//
// This deliberately follows the same rule Max already chose for the game's own
// rename (Touchdown Rush → Touchdown Fun in v1.13): change what people SEE,
// never the plumbing underneath. Your roster, coins, records and uniforms all
// belong to you, not to the team's name.
//
// Saved in `tdr-rebrand` = { base, abbr, city, name, jersey, helmet }.
// `base` is the code of the real team you replaced, so it can always go back.
// The editor lives in the 🛍 Pro Shop.
// ============================================================
(function () {
  'use strict';

  const T = window.TDStats ? TDStats.shared : null;
  const store = (k, v) => { if (T) T.store(k, v); };
  const load  = (k, f) => (T ? T.load(k, f) : f);
  const $ = id => document.getElementById(id);

  const MAX_NAME = 14, MAX_CITY = 14, MAX_ABBR = 3;

  // A few cities to get the ideas flowing — you can type anything you like.
  const CITIES = ['Fortree', 'Maple Bay', 'Iron Ridge', 'Silver Lake', 'Kingsport',
                  'Riverton', 'Stonewall', 'Northwind', 'Cedar Falls', 'Grand Harbor'];
  const NAMES  = ['Dragons', 'Thunder', 'Comets', 'Wolves', 'Titans', 'Rockets',
                  'Sharks', 'Falcons', 'Bandits', 'Vipers', 'Kings', 'Blizzard'];
  const COLORS = [
    { n: 'Navy',    v: 0x14337a }, { n: 'Royal',   v: 0x1b4fc4 },
    { n: 'Crimson', v: 0x8c1420 }, { n: 'Scarlet', v: 0xd6252f },
    { n: 'Forest',  v: 0x14502a }, { n: 'Lime',    v: 0x63c132 },
    { n: 'Gold',    v: 0xe8b923 }, { n: 'Orange',  v: 0xe8701a },
    { n: 'Violet',  v: 0x5b2a91 }, { n: 'Pink',    v: 0xe0559b },
    { n: 'Teal',    v: 0x0f8f8f }, { n: 'Ink',     v: 0x14161f },
    { n: 'Silver',  v: 0xc8d2dd }, { n: 'Sky',     v: 0x4ab8e8 },
  ];

  const hex = n => '#' + ((n || 0) & 0xffffff).toString(16).padStart(6, '0');
  // ⚠️ `.trim()` is load-bearing, not tidiness. Without it a name of nothing but
  // spaces collapses to a single space — which is TRUTHY, so the "give your team
  // a name" guard waved it through and you ended up with an invisible team name.
  const clean = (s, max) => String(s || '').replace(/[<>&"]/g, '').replace(/\s+/g, ' ').trim().slice(0, max);

  // ---- 💾 what you saved --------------------------------------------------
  let R = load('rebrand', null);
  if (!R || typeof R !== 'object') R = {};
  function save() { store('rebrand', R); }
  const active = () => !!R.base;

  // ---- 🔁 the one function main.js calls ---------------------------------
  // Swap your team's entry for a copy carrying the new name, code and colours.
  function apply(list) {
    if (!R.base || !Array.isArray(list)) return list;
    return list.map(t => {
      if (!t || t.abbr !== R.base) return t;
      return Object.assign({}, t, {
        abbr: R.abbr || t.abbr,
        name: R.name || t.name,
        city: R.city || '',
        jersey: (R.jersey == null) ? t.jersey : R.jersey,
        helmet: (R.helmet == null) ? t.helmet : R.helmet,
        // ⚠️ the original code, so teamRating() still finds the right ratings
        ratingKey: t.ratingKey || t.abbr,
      });
    });
  }

  // ---- 🔒 is it safe to change the CODE right now? -----------------------
  // Colours and names are always safe. The three-letter code is what a season
  // or a bracket saves you by, so that has to wait for them to finish.
  function locked() {
    if (window.TDSeason && TDSeason.hasSeason && TDSeason.hasSeason()) return 'season';
    const pl = load('playoffs', null);
    if (pl && typeof pl === 'object' && pl.round != null && !pl.done) return 'playoff';
    return null;
  }

  // ---- ✏️ the editor ------------------------------------------------------
  // `draft` is what you're typing right now; nothing is saved until you hit
  // the button, so backing out leaves your team exactly as it was.
  let draft = null;

  function baseTeam() {
    // The team currently on the menu — or the one you already rebranded.
    const abbr = R.base || ((window.TDGame && TDGame.currentMenuTeamAbbr) ? TDGame.currentMenuTeamAbbr() : null);
    if (!abbr || !window.TDGame || !TDGame.teamByAbbr) return null;
    // If we've already rebranded, teamByAbbr finds it under the NEW code.
    return TDGame.teamByAbbr(R.abbr || abbr) || TDGame.teamByAbbr(abbr);
  }

  function startDraft() {
    const t = baseTeam();
    const cur = (window.TDGame && TDGame.currentMenuTeamAbbr) ? TDGame.currentMenuTeamAbbr() : null;
    draft = {
      base: R.base || cur,
      city: R.city || '',
      name: R.name || (t ? t.name : 'MY TEAM'),
      abbr: R.abbr || (t ? t.abbr : 'TD'),
      jersey: (R.jersey != null) ? R.jersey : (t ? t.jersey : 0x14337a),
      helmet: (R.helmet != null) ? R.helmet : (t ? t.helmet : 0xe8b923),
    };
  }

  function renderPreview() {
    const p = $('rb-preview'); if (!p) return;
    const j = hex(draft.jersey), h = hex(draft.helmet);
    p.innerHTML =
      `<div class="rb-jersey" style="background:${j};border-color:${h}">
         <div class="rb-helmet" style="background:${h}"></div>
         <div class="rb-abbr">${clean(draft.abbr, MAX_ABBR).toUpperCase() || '—'}</div>
       </div>
       <div class="rb-city">${clean(draft.city, MAX_CITY) || '&nbsp;'}</div>
       <div class="rb-name">${clean(draft.name, MAX_NAME).toUpperCase() || 'MY TEAM'}</div>`;
  }

  function swatches(kind) {
    const cur = draft[kind];
    return COLORS.map(c =>
      `<div class="rb-sw${c.v === cur ? ' on' : ''}" data-kind="${kind}" data-v="${c.v}"
            style="background:${hex(c.v)}" title="${c.n}"></div>`).join('');
  }

  function render() {
    if (!draft) startDraft();
    renderPreview();
    const j = $('rb-jerseys'), h = $('rb-helmets');
    if (j) j.innerHTML = swatches('jersey');
    if (h) h.innerHTML = swatches('helmet');
    const ci = $('rb-city-input'), ni = $('rb-name-input'), ai = $('rb-abbr-input');
    if (ci && document.activeElement !== ci) ci.value = draft.city;
    if (ni && document.activeElement !== ni) ni.value = draft.name;
    if (ai && document.activeElement !== ai) ai.value = draft.abbr;

    // the code is locked mid-season
    const lock = locked();
    if (ai) ai.disabled = !!lock;
    const warn = $('rb-lock');
    if (warn) {
      warn.innerHTML = lock
        ? `🔒 Your three-letter code is locked until your ${lock === 'season' ? 'season' : 'playoff run'}
           finishes — the league saves your team by that code. Names and colours are fine to change now.`
        : '';
      warn.style.display = lock ? '' : 'none';
    }
    const reset = $('rb-reset');
    if (reset) reset.style.display = active() ? '' : 'none';
  }

  function onSwatch(e) {
    const el = e.target.closest('[data-kind]'); if (!el) return;
    e.preventDefault();
    draft[el.dataset.kind] = parseInt(el.dataset.v, 10);
    render();
  }

  function onType() {
    const ci = $('rb-city-input'), ni = $('rb-name-input'), ai = $('rb-abbr-input');
    if (ci) draft.city = clean(ci.value, MAX_CITY);
    if (ni) draft.name = clean(ni.value, MAX_NAME);
    if (ai) draft.abbr = clean(ai.value, MAX_ABBR).toUpperCase().replace(/[^A-Z0-9]/g, '');
    renderPreview();
  }

  function surprise() {
    draft.city = CITIES[Math.floor(Math.random() * CITIES.length)];
    draft.name = NAMES[Math.floor(Math.random() * NAMES.length)];
    draft.abbr = draft.name.slice(0, 3).toUpperCase();
    draft.jersey = COLORS[Math.floor(Math.random() * COLORS.length)].v;
    draft.helmet = COLORS[Math.floor(Math.random() * COLORS.length)].v;
    render();
  }

  function note(msg, bad) {
    const n = $('rb-note'); if (!n) return;
    n.textContent = msg;
    n.className = 'rb-note show' + (bad ? ' bad' : '');
  }

  // ---- ✅ make it real ----------------------------------------------------
  function commit() {
    if (!draft) return false;
    const name = clean(draft.name, MAX_NAME);
    if (!name) { note('Give your team a name first!', true); return false; }
    let abbr = clean(draft.abbr, MAX_ABBR).toUpperCase().replace(/[^A-Z0-9]/g, '');
    const lock = locked();
    if (lock) abbr = R.abbr || draft.base;      // code can't move mid-season
    if (!abbr) abbr = name.slice(0, 3).toUpperCase();

    // Don't collide with a team that already exists under that code.
    if (window.TDGame && TDGame.teamByAbbr) {
      const clash = TDGame.teamByAbbr(abbr);
      const mine = R.abbr || draft.base;
      if (clash && abbr !== mine) { note('That code belongs to another team — try a different one.', true); return false; }
    }

    R.base   = draft.base;
    R.abbr   = abbr;
    R.city   = clean(draft.city, MAX_CITY);
    R.name   = name.toUpperCase();
    R.jersey = draft.jersey;
    R.helmet = draft.helmet;
    save();
    refreshGame();
    note('Say hello to the ' + (R.city ? R.city + ' ' : '') + R.name + '!');
    render();
    return true;
  }

  function resetAll() {
    R = {};
    save();
    draft = null;
    refreshGame();
    render();
    note('Back to your original team.');
  }

  // Ask the menu to redraw so the new name and colours show immediately.
  function refreshGame() {
    try { if (window.TDMenu && TDMenu.refresh) TDMenu.refresh(); } catch (e) {}
    try { if (window.TDGame && TDGame.repaintField) TDGame.repaintField(); } catch (e) {}
  }

  // ---- open / close -------------------------------------------------------
  function gameKeyboard(on) { try { window.game.input.keyboard.enabled = on; } catch (e) {} }
  function open() {
    draft = null; render();
    const n = $('rb-note'); if (n) { n.textContent = ''; n.className = 'rb-note'; }
    gameKeyboard(false);
    const m = $('rebrand-modal'); if (m) m.style.display = 'flex';
  }
  function close() {
    const m = $('rebrand-modal'); if (m) m.style.display = 'none';
    gameKeyboard(true);
  }

  function wire() {
    const tap = (id, fn) => { const el = $(id); if (el) el.addEventListener('pointerdown', e => { e.preventDefault(); fn(); }); };
    tap('open-rebrand', open);
    tap('rebrand-close', close);
    tap('rb-save', commit);
    tap('rb-reset', resetAll);
    tap('rb-surprise', surprise);
    ['rb-city-input', 'rb-name-input', 'rb-abbr-input'].forEach(id => {
      const el = $(id); if (el) el.addEventListener('input', onType);
    });
    ['rb-jerseys', 'rb-helmets'].forEach(id => {
      const el = $(id); if (el) el.addEventListener('pointerdown', onSwatch);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire);
  else wire();

  window.TDRebrand = {
    open, close, apply, render,
    active, locked,
    current: () => Object.assign({}, R),
    _draft: () => draft && Object.assign({}, draft),
    _set: d => { draft = Object.assign(draft || {}, d); },
    _commit: commit, _reset: resetAll, _surprise: surprise,
  };
})();
