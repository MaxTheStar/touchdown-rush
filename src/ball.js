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
//   🏈 CLASSIC     the brown leather one, free and always yours
//   🔥 FLAME       burnt orange with gold laces
//   🌙 NIGHT GLOW  deep blue with laces that look lit up
//   🥇 GOLDEN      the golden game ball
//   ❄️ ICE         pale blue, like a frozen morning
//   🌈 RAINBOW     every lace a different colour
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
      sw: '#8B4513', swTop: '#6f3410', blurb: 'The brown leather one. A proper football.' },
    { id: 'flame',   ic: '🔥', name: 'Flame',      cost: 90,
      rim: 0x2b0900, base: 0x8c2b00, top: 0xff5b1a, laces: 0xffe066,
      sw: '#ff5b1a', swTop: '#8c2b00', blurb: 'Burnt orange with gold laces — it looks fast.' },
    { id: 'night',   ic: '🌙', name: 'Night Glow', cost: 140,
      rim: 0x05081a, base: 0x101a3a, top: 0x2a4bd8, laces: 0x7ef9ff,
      sw: '#2a4bd8', swTop: '#101a3a', blurb: 'Deep blue, with laces that look lit up.' },
    { id: 'golden',  ic: '🥇', name: 'Golden',     cost: 200,
      rim: 0x3d2f00, base: 0x8a6b00, top: 0xffc61a, laces: 0xfff4c2,
      sw: '#ffc61a', swTop: '#8a6b00', blurb: 'The golden game ball. For a golden team.' },
    { id: 'ice',     ic: '❄️', name: 'Ice',        cost: 260,
      rim: 0x123047, base: 0x4a7fa8, top: 0x9fd8f5, laces: 0xffffff,
      sw: '#9fd8f5', swTop: '#4a7fa8', blurb: 'Pale blue, like a frozen morning kickoff.' },
    { id: 'rainbow', ic: '🌈', name: 'Rainbow',    cost: 340,
      rim: 0x2a0736, base: 0x6a1b9a, top: 0xe040fb, laces: 0xffffff,
      ticks: [0xff5252, 0xffd600, 0x40c4ff],
      sw: '#e040fb', swTop: '#6a1b9a', blurb: 'Every lace a different colour. Show off.' },
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
       <div class="ball-blurb">${s.blurb}</div>`;
  }

  function renderGrid() {
    const g = $('ball-grid'); if (!g) return;
    g.innerHTML = SKINS.map(s => {
      const owned = state.owned.indexOf(s.id) !== -1;
      const on = state.equipped === s.id;
      const tag = on ? '<span class="ball-tag on">WEARING</span>'
                : owned ? '<span class="ball-tag">TAP TO WEAR</span>'
                : `<span class="ball-tag buy">${s.cost} 🪙</span>`;
      return `<div class="ball-card${on ? ' on' : ''}${owned ? '' : ' locked'}" data-id="${s.id}">
                <div class="ball-card-ic">${s.ic}</div>
                <div class="ball-card-nm">${s.name}</div>
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
