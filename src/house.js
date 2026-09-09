// ============================================================
// TOUCHDOWN FUN — house.js: 🎲 HOUSE RULES (Round 10, pick ⑤)
// ------------------------------------------------------------
// Silly football, on purpose. Flip on a house rule (or all five) before an
// exhibition game and see what happens:
//
//   🏈 GIANT BALL    the football is enormous
//   🐜 MINI DEFENSE  the other team shrinks to half size
//   💨 TURBO MODE    everybody sprints
//   🧲 STICKY HANDS  you basically cannot drop a pass
//   🐌 SLOW DEFENSE  the defenders run like they're in treacle
//
// NOT THE SAME AS 🎃 SEASON EVENTS. Those decide themselves by the calendar —
// turn up during Halloween week and it IS Halloween. These are yours to pick,
// any time you like. One is a surprise; the other is a toy box.
//
// ⚠️ EXHIBITION GAMES ONLY, AND THEY NEVER COUNT. This is the rule that makes
// the whole feature safe, and it is not negotiable:
//   • A season, playoff, rival, Maxwell or drill game turns house rules OFF —
//     they are not offered and not applied. You cannot win anything real with
//     a giant ball.
//   • Even in an exhibition, a house-rules game does NOT move the 🏅 Ranked
//     Ladder, does NOT count towards your 🔥 win streak, and can NEVER set a
//     📖 personal best. A 90-point romp against half-sized defenders must not
//     become your "Most Points" record forever — that would quietly wreck the
//     one part of the game that is supposed to be earned.
// You still get the normal payday, because you still played a game.
//
// HOW IT PLUGS IN — no new machinery. Four of the five rules are just one more
// number in a multiply-chain that already exists (the same trick ⚡ Power-Up
// Plays used): speed and catching fold into shop.js's `speedMult`/`gloveBoost`,
// and the defenders' speed folds into main.js's `updateDefense`. The two visual
// ones set a sprite scale in `beginGame`. Every getter returns the neutral value
// (1, or 0 for an addition) when no game is live or the rule is off, so with
// this file missing nothing changes anywhere.
//
// Saved in `tdr-house` = { on: [ids] } — just which switches you left flipped.
// The picker lives in the 🛍 Pro Shop, beside the other pre-game choices.
// ============================================================
(function () {
  'use strict';

  const T = window.TDStats ? TDStats.shared : null;
  const store = (k, v) => { if (T) T.store(k, v); };
  const load  = (k, f) => (T ? T.load(k, f) : f);
  const $ = id => document.getElementById(id);

  const RULES = [
    { id: 'giant',  ic: '🏈', name: 'Giant Ball',   blurb: 'The football is ENORMOUS.' },
    { id: 'mini',   ic: '🐜', name: 'Mini Defense', blurb: 'The other team shrinks to half size.' },
    { id: 'turbo',  ic: '💨', name: 'Turbo Mode',   blurb: 'Everybody sprints, all game long.' },
    { id: 'sticky', ic: '🧲', name: 'Sticky Hands', blurb: 'You basically cannot drop a pass.' },
    { id: 'slow',   ic: '🐌', name: 'Slow Defense', blurb: 'Defenders run like it is treacle.' },
  ];

  // ---- 💾 which switches you left flipped --------------------------------
  let state = (() => {
    const s = load('house', null);
    const on = (s && Array.isArray(s.on)) ? s.on.filter(id => RULES.some(r => r.id === id)) : [];
    return { on };
  })();
  function save() { store('house', { on: state.on }); }

  const isOn = id => state.on.indexOf(id) !== -1;

  // ---- 🎬 is a house-rules game actually happening right now? -------------
  // `live` is set by main.js's beginGame and is the ONLY thing the getters
  // below trust. Nothing applies just because a switch is flipped in the menu.
  let live = false;

  // beginGame calls this with whether this game is even allowed to have them.
  // Returns true if house rules are ON for this game (main.js stores that on
  // G.houseGame so endGame knows not to count it).
  function begin(allowed) {
    live = !!allowed && state.on.length > 0;
    return live;
  }
  function endGame() { live = false; }

  // ---- the numbers main.js and shop.js ask for ---------------------------
  // Every one of these is neutral unless a house-rules game is actually live.
  const armed = id => live && isOn(id);

  function speedMult()  { return armed('turbo')  ? 1.35 : 1; }   // × into shop.js speedMult()
  function catchAdd()   { return armed('sticky') ? 0.25 : 0; }   // + into shop.js gloveBoost()
  function defSlow()    { return armed('slow')   ? 0.72 : 1; }   // × into updateDefense boost
  function ballScale()  { return armed('giant')  ? 2.3  : 1; }   // × the ball sprite scale
  function defScale()   { return armed('mini')   ? 0.55 : 1; }   // × the defenders' sprite scale

  // ---- 🖼 the picker ------------------------------------------------------
  function renderGrid() {
    const g = $('house-grid'); if (!g) return;
    g.innerHTML = RULES.map(r => {
      const on = isOn(r.id);
      return `<div class="house-row${on ? ' on' : ''}" data-id="${r.id}">
                <div class="house-ic">${r.ic}</div>
                <div class="house-tx">
                  <div class="house-nm">${r.name}</div>
                  <div class="house-bl">${r.blurb}</div>
                </div>
                <div class="house-sw">${on ? 'ON' : 'OFF'}</div>
              </div>`;
    }).join('');
    const c = $('house-count');
    if (c) {
      c.textContent = state.on.length === 0
        ? 'All off — normal football.'
        : state.on.length + (state.on.length === 1 ? ' rule on' : ' rules on');
      c.className = 'house-count' + (state.on.length ? ' live' : '');
    }
  }

  function onPick(e) {
    const el = e.target.closest('[data-id]'); if (!el) return;
    e.preventDefault();
    const id = el.getAttribute('data-id');
    const i = state.on.indexOf(id);
    if (i === -1) state.on.push(id); else state.on.splice(i, 1);
    save();
    renderGrid();
  }

  function allOff() { state.on = []; save(); renderGrid(); }

  function open()  { renderGrid(); const m = $('house-modal'); if (m) m.style.display = 'flex'; }
  function close() { const m = $('house-modal'); if (m) m.style.display = 'none'; }

  function wire() {
    const tap = (id, fn) => { const el = $(id); if (el) el.addEventListener('pointerdown', e => { e.preventDefault(); fn(); }); };
    tap('open-house', open);
    tap('house-close', close);
    tap('house-clear', allOff);
    const g = $('house-grid');
    if (g) g.addEventListener('pointerdown', onPick);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire);
  else wire();

  window.TDHouse = {
    open, close, begin, endGame,
    live: () => live,                       // records.js asks this before saving a best
    on: () => state.on.slice(),
    rules: () => RULES.map(r => ({ id: r.id, name: r.name })),
    speedMult, catchAdd, defSlow, ballScale, defScale,
    _toggle: id => {
      const el = document.querySelector('#house-grid [data-id="' + id + '"]');
      if (el) el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    },
    _set: ids => { state.on = ids.slice(); save(); renderGrid(); },
  };
})();
