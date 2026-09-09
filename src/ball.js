// ============================================================
// TOUCHDOWN FUN — ball.js: 🌈 BALL SKINS (Round 10, pick ②)
// ------------------------------------------------------------
// You have designed the jerseys (🎽 Uniform Designer) and the turf (🎨 Field
// Designer). This is the last thing on the field nobody had ever coloured in:
// the football itself.
//
// Pick a skin and the REAL ball changes — the one you throw, catch, fumble and
// carry into the end zone. Not a menu picture: the actual ball in the game.
//
// ⚠️ EVERY BALL PLAYS DIFFERENTLY. They are not paint jobs — each one you buy
// changes how the game actually plays, the same way the 👟 gear in the Pro Shop
// does, so picking a ball is picking a STYLE:
//
//   🏈 CLASSIC     free  · no tricks, just football. The honest baseline.
//   🔥 FLAME       90    · 🏃 RUNS HOT — you run 5% faster with it
//   🌙 NIGHT GLOW  140   · 🧤 EASY TO SPOT — +6% catching
//   🥇 GOLDEN      200   · 🔒 NEVER SLIPS — 35% fewer fumbles
//   ❄️ ICE         260   · 🎯 SLIPPERY — 30% fewer interceptions
//   🌈 RAINBOW     340   · 🌟 A BIT OF EVERYTHING — a little of all four
//
// The perks fold into the SAME perk functions in shop.js that the gear uses
// (`speedMult`, `gloveBoost`, `gripFactor`, `armAccuracy`), so they stack with
// everything else and get clamped by the same caps — no new balance system, and
// no way for a ball to run away with the game. The getters return the neutral
// value (1, or 0) for the Classic ball and whenever this file is missing.
//
// HOW IT WORKS — the football isn't a picture file, it's DRAWN in code by
// main.js's `makeBallTexture`. So this file doesn't paint anything itself: it
// just answers the question "what colours?" when main.js asks (`TDBall.look()`),
// exactly the way the Field Designer answers `drawField`. Every colour has a
// fallback on main.js's side, so if this file ever went missing the ball would
// go straight back to classic brown instead of breaking.
//
// When you equip a skin we ask the game to redraw the ball right then
// (`TDGame.repaintBall()`), so you see it change behind the pop-up.
//
// Saved in `tdr-ball` = { owned: [ids], equipped: id }. The picker lives inside
// the 🛍 Pro Shop next to the other designers — no new menu button, because the
// phone menu has no room left (the v1.44/45 lesson).
// ============================================================
(function () {
  'use strict';

  const T = window.TDStats ? TDStats.shared : null;
  const store = (k, v) => { if (T) T.store(k, v); };
  const load  = (k, f) => (T ? T.load(k, f) : f);
  const $ = id => document.getElementById(id);

  // ---- 🎨 the skins -------------------------------------------------------
  // `rim` is the dark edge, `base` the leather underneath, `top` the face you
  // mostly see, `laces` the stripe across it. `ticks` is optional — three lace
  // stitches, so one skin can stripe them in different colours. The numbers are
  // Phaser colours (0xRRGGBB); `sw` is the same colour as CSS, for the preview.
  const SKINS = [
    { id: 'classic', ic: '🏈', name: 'Classic',    cost: 0,
      rim: 0x0a0f18, base: 0x6f3410, top: 0x8B4513, laces: 0xffffff,
      sw: '#8B4513', swTop: '#6f3410', blurb: 'The brown leather one. A proper football.',
      perk: { label: 'No tricks — just football' } },
    { id: 'flame',   ic: '🔥', name: 'Flame',      cost: 90,
      rim: 0x2b0900, base: 0x8c2b00, top: 0xff5b1a, laces: 0xffe066,
      sw: '#ff5b1a', swTop: '#8c2b00', blurb: 'Burnt orange with gold laces — it looks fast.',
      perk: { label: '🏃 RUNS HOT — you run 5% faster', speed: 1.05 } },
    { id: 'night',   ic: '🌙', name: 'Night Glow', cost: 140,
      rim: 0x05081a, base: 0x101a3a, top: 0x2a4bd8, laces: 0x7ef9ff,
      sw: '#2a4bd8', swTop: '#101a3a', blurb: 'Deep blue, with laces that look lit up.',
      perk: { label: '🧤 EASY TO SPOT — +6% catching', cat: 0.06 } },
    { id: 'golden',  ic: '🥇', name: 'Golden',     cost: 200,
      rim: 0x3d2f00, base: 0x8a6b00, top: 0xffc61a, laces: 0xfff4c2,
      sw: '#ffc61a', swTop: '#8a6b00', blurb: 'The golden game ball. For a golden team.',
      perk: { label: '🔒 NEVER SLIPS — 35% fewer fumbles', grip: 0.35 } },
    { id: 'ice',     ic: '❄️', name: 'Ice',        cost: 260,
      rim: 0x123047, base: 0x4a7fa8, top: 0x9fd8f5, laces: 0xffffff,
      sw: '#9fd8f5', swTop: '#4a7fa8', blurb: 'Pale blue, like a frozen morning kickoff.',
      perk: { label: '🎯 SLIPPERY — 30% fewer interceptions', arm: 0.30 } },
    { id: 'rainbow', ic: '🌈', name: 'Rainbow',    cost: 340,
      rim: 0x2a0736, base: 0x6a1b9a, top: 0xe040fb, laces: 0xffffff,
      ticks: [0xff5252, 0xffd600, 0x40c4ff],
      sw: '#e040fb', swTop: '#6a1b9a', blurb: 'Every lace a different colour. Show off.',
      perk: { label: '🌟 A BIT OF EVERYTHING', speed: 1.03, cat: 0.03, grip: 0.15, arm: 0.15 } },
  ];

  const DEFAULT = 'classic';
  const skinById = id => SKINS.find(s => s.id === id) || SKINS[0];
  const coins = () => (window.TDShop && TDShop.coins) ? TDShop.coins() : 0;

  // ---- 💾 save & load -----------------------------------------------------
  let state = (() => {
    let s = load('ball', null);
    if (!s || typeof s !== 'object') s = {};
    const owned = Array.isArray(s.owned) ? s.owned.filter(id => SKINS.some(k => k.id === id)) : [];
    if (owned.indexOf(DEFAULT) === -1) owned.unshift(DEFAULT);   // classic is always yours
    const equipped = owned.indexOf(s.equipped) !== -1 ? s.equipped : DEFAULT;
    return { owned, equipped };
  })();
  function save() { store('ball', state); }

  // ---- ⚡ THE PERKS shop.js folds in --------------------------------------
  // Each one reads the ball you have EQUIPPED. Classic returns the neutral
  // value, so playing with the plain ball is byte-identical to before this
  // existed. shop.js clamps these along with the gear, so no ball can run away.
  const perkOf = () => (skinById(state.equipped).perk || {});
  function speedMult() { return perkOf().speed || 1; }   // × into shop.js speedMult()
  function catchAdd()  { return perkOf().cat   || 0; }   // + into shop.js gloveBoost()
  function gripAdd()   { return perkOf().grip  || 0; }   // + into shop.js gripFactor()
  function armAdd()    { return perkOf().arm   || 0; }   // + into shop.js armAccuracy()

  // ---- 👀 what main.js's makeBallTexture asks for -------------------------
  function look() {
    const s = skinById(state.equipped);
    return { rim: s.rim, base: s.base, top: s.top, laces: s.laces, ticks: s.ticks };
  }
  // Ask the game to redraw the ball right now, so you SEE the change.
  function repaint() { if (window.TDGame && TDGame.repaintBall) TDGame.repaintBall(); }

  // ---- 🖼 the picker ------------------------------------------------------
  // A little CSS football so you can see a skin before you buy it.
  function renderPreview() {
    const p = $('ball-preview'); if (!p) return;
    const s = skinById(state.equipped);
    const ticks = s.ticks
      ? s.ticks.map(t => '#' + (t & 0xffffff).toString(16).padStart(6, '0'))
      : null;
    const lace = '#' + (s.laces & 0xffffff).toString(16).padStart(6, '0');
    p.innerHTML =
      `<div class="ball-shape" style="background:radial-gradient(ellipse at 34% 32%, ${s.sw} 0%, ${s.sw} 52%, ${s.swTop} 100%)">
         <div class="ball-lace" style="background:${lace}"></div>
         ${[0, 1, 2].map(i =>
           `<div class="ball-tick" style="left:${34 + i * 16}%;background:${ticks ? ticks[i] : lace}"></div>`).join('')}
       </div>
       <div class="ball-name">${s.ic} ${s.name}</div>
       <div class="ball-blurb">${s.blurb}</div>
       <div class="ball-perk">${(s.perk && s.perk.label) || ''}</div>`;
  }

  function renderGrid() {
    const g = $('ball-grid'); if (!g) return;
    g.innerHTML = SKINS.map(s => {
      const owned = state.owned.indexOf(s.id) !== -1;
      const on = state.equipped === s.id;
      const tag = on ? '<span class="ball-tag on">WEARING</span>'
                : owned ? '<span class="ball-tag">TAP TO WEAR</span>'
                : `<span class="ball-tag buy">${s.cost} 🪙</span>`;
      const p = s.perk || {};
      // the tiny badge that says what this ball DOES, so you can compare at a glance
      const bits = [];
      if (p.speed) bits.push('🏃+' + Math.round((p.speed - 1) * 100) + '%');
      if (p.cat)   bits.push('🧤+' + Math.round(p.cat * 100) + '%');
      if (p.grip)  bits.push('🔒+' + Math.round(p.grip * 100) + '%');
      if (p.arm)   bits.push('🎯+' + Math.round(p.arm * 100) + '%');
      const eff = bits.length ? `<div class="ball-eff">${bits.join(' ')}</div>` : '<div class="ball-eff plain">—</div>';
      return `<div class="ball-card${on ? ' on' : ''}${owned ? '' : ' locked'}" data-id="${s.id}">
                <div class="ball-card-ic">${s.ic}</div>
                <div class="ball-card-nm">${s.name}</div>
                ${eff}
                ${tag}
              </div>`;
    }).join('');
    const c = $('ball-coins');
    if (c) c.textContent = coins() + ' 🪙';
  }

  function note(msg) {
    const n = $('ball-note'); if (!n) return;
    n.textContent = msg;
    n.classList.add('show');
  }

  function render() { renderPreview(); renderGrid(); }

  // One delegated tap handler for the whole grid (the same trick MY TEAM uses).
  function onPick(e) {
    const el = e.target.closest('[data-id]'); if (!el) return;
    e.preventDefault();
    const s = skinById(el.getAttribute('data-id'));
    const owned = state.owned.indexOf(s.id) !== -1;
    if (owned) {
      state.equipped = s.id; save();
      note(s.name + ' it is!');
      render();
      repaint();                      // the real ball changes right now
    } else if (window.TDShop && TDShop.spend && TDShop.spend(s.cost)) {
      state.owned.push(s.id); state.equipped = s.id; save();
      if (TDShop.celebrate) TDShop.celebrate(null, s.ic, s.name.toUpperCase() + ' UNLOCKED!');
      note('Unlocked! You are playing with the ' + s.name + ' ball.');
      render();
      repaint();
    } else {
      note('Not enough coins — go score some more!');
      renderGrid();
    }
  }

  // ---- open / close -------------------------------------------------------
  function open() {
    render();
    const n = $('ball-note'); if (n) { n.textContent = ''; n.classList.remove('show'); }
    const el = $('ball-modal'); if (el) el.style.display = 'flex';
  }
  function close() { const el = $('ball-modal'); if (el) el.style.display = 'none'; }

  function wire() {
    const tap = (id, fn) => { const el = $(id); if (el) el.addEventListener('pointerdown', e => { e.preventDefault(); fn(); }); };
    tap('open-ball', open);
    tap('ball-close', close);
    const box = $('ball-grid');
    if (box) box.addEventListener('pointerdown', onPick);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire);
  else wire();

  window.TDBall = {
    open, close, look, repaint,
    speedMult, catchAdd, gripAdd, armAdd,   // ⚡ shop.js folds these into the gear perks
    perk: () => Object.assign({}, perkOf()),
    equipped: () => state.equipped,
    owned: () => state.owned.slice(),
    skins: () => SKINS.map(s => ({ id: s.id, name: s.name, cost: s.cost })),
    _state: () => ({ equipped: state.equipped, owned: state.owned.slice() }),
    _pickById: id => {                      // for verification
      const el = document.querySelector('#ball-grid [data-id="' + id + '"]');
      if (el) el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    },
  };
})();
