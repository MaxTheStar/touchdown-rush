// ============================================================
// TOUCHDOWN FUN — field.js: 🎨 THE FIELD DESIGNER
// ------------------------------------------------------------
// Every team has a home field, and now yours looks how YOU want it. Pick your
// turf (classic green, or go wild — blue, red, purple, even a snowy white one),
// paint your end zones any colour, and stamp a logo at the 50-yard line.
//
// Unlike most of our add-ons this one really does change the FIELD, which the
// game draws in Phaser — so main.js's `drawField` now asks us for the colours
// (`TDField.look()`), and we ask it to repaint the moment you pick something
// (`TDGame.repaintField()`). With this file missing, drawField falls back to the
// original constants, so the classic look is exactly what it always was.
//
// Your design saves in localStorage 'tdr-field'. The picker lives inside the
// 🛍 Pro Shop, so there's no new menu button crowding the phone layout.
// ============================================================
(function () {
  const KEY = 'tdr-field';
  const T = window.TDStats ? TDStats.shared : null;
  const $ = id => document.getElementById(id);

  // ---- What you can choose ------------------------------------------------
  // Each turf is a pair of mown stripes (a darker and a lighter band).
  const TURFS = [
    { id: 'classic', name: 'Classic Grass', dark: 0x246b26, light: 0x2f8a33, swatch: '#2f8a33' },
    { id: 'emerald', name: 'Emerald',       dark: 0x0f6b3d, light: 0x179a55, swatch: '#179a55' },
    { id: 'blue',    name: 'Blue Turf',     dark: 0x14406e, light: 0x1d5793, swatch: '#1d5793' },
    { id: 'red',     name: 'Red Turf',      dark: 0x7a1f22, light: 0x9d2b2f, swatch: '#9d2b2f' },
    { id: 'purple',  name: 'Purple Reign',  dark: 0x3d2168, light: 0x532d8c, swatch: '#532d8c' },
    { id: 'teal',    name: 'Teal Tide',     dark: 0x0d5c5c, light: 0x137a7a, swatch: '#137a7a' },
    { id: 'night',   name: 'Midnight',      dark: 0x1a2030, light: 0x232b40, swatch: '#232b40' },
    { id: 'snow',    name: 'Snow Day',      dark: 0xc9d6e2, light: 0xdfe9f2, swatch: '#dfe9f2' },
  ];

  const ENDZONES = [
    { id: 'navy',   name: 'Navy',   color: 0x14337a, swatch: '#14337a' },
    { id: 'crimson',name: 'Crimson',color: 0x8c1420, swatch: '#8c1420' },
    { id: 'forest', name: 'Forest', color: 0x14502a, swatch: '#14502a' },
    { id: 'royal',  name: 'Royal',  color: 0x1b4fc4, swatch: '#1b4fc4' },
    { id: 'gold',   name: 'Gold',   color: 0xb8860b, swatch: '#b8860b' },
    { id: 'violet', name: 'Violet', color: 0x5b2a91, swatch: '#5b2a91' },
    { id: 'ink',    name: 'Ink',    color: 0x14161f, swatch: '#14161f' },
    { id: 'orange', name: 'Sunset', color: 0xb2560d, swatch: '#b2560d' },
  ];

  const LOGOS = ['★', '🏈', '⚡', '🔥', '👑', '🦅', '🐉', '🌟', '🦈', '🐻', '🚀', '💎'];

  const DEFAULT = { turf: 'classic', endzone: 'navy', logo: '★' };

  // ---- Save & load --------------------------------------------------------
  function load() {
    let s = T ? T.load('field', null) : null;
    if (!s) { try { s = JSON.parse(localStorage.getItem(KEY)); } catch (e) {} }
    s = (s && typeof s === 'object') ? s : {};
    return {
      turf:    TURFS.some(t => t.id === s.turf) ? s.turf : DEFAULT.turf,
      endzone: ENDZONES.some(e => e.id === s.endzone) ? s.endzone : DEFAULT.endzone,
      logo:    LOGOS.includes(s.logo) ? s.logo : DEFAULT.logo,
    };
  }
  function save() {
    if (T) T.store('field', state);
    else { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }
  }
  let state = load();

  const turfOf = () => TURFS.find(t => t.id === state.turf) || TURFS[0];
  const ezOf   = () => ENDZONES.find(e => e.id === state.endzone) || ENDZONES[0];

  // ---- What main.js's drawField asks for ---------------------------------
  function look() {
    const t = turfOf(), e = ezOf();
    return {
      dark: t.dark, light: t.light, endzone: e.color,
      logo: state.logo,
      // a plain ★ looks best in gold; a picked emoji keeps its own colours
      logoColor: state.logo === '★' ? '#ffe066' : '#ffffff'
    };
  }

  // Ask the game to redraw the field right now (so you SEE the change).
  function repaint() { if (window.TDGame && TDGame.repaintField) TDGame.repaintField(); }

  // ---- The picker ---------------------------------------------------------
  function renderPreview() {
    const p = $('fld-preview'); if (!p) return;
    const t = turfOf(), e = ezOf();
    // A tiny CSS mock-up of the field: end zone, mown stripes, midfield logo.
    p.style.background =
      `repeating-linear-gradient(180deg, ${t.swatch} 0 14px, ${shade(t.dark)} 14px 28px)`;
    p.innerHTML =
      `<div class="fld-ez" style="background:${e.swatch}">TOUCHDOWN</div>` +
      `<div class="fld-mid">${state.logo}</div>` +
      `<div class="fld-ez bottom" style="background:${e.swatch}">HOME</div>`;
  }
  const shade = n => '#' + (n & 0xffffff).toString(16).padStart(6, '0');

  function swatchRow(list, current, pick, kind) {
    return list.map(item => {
      const on = item.id === current;
      return `<div class="fld-sw${on ? ' on' : ''}" data-kind="${kind}" data-id="${item.id}" ` +
             `style="background:${item.swatch}" title="${item.name}"></div>`;
    }).join('');
  }

  function render() {
    renderPreview();
    const turf = $('fld-turfs'), ez = $('fld-ezs'), logos = $('fld-logos');
    if (turf) turf.innerHTML = swatchRow(TURFS, state.turf, null, 'turf');
    if (ez)   ez.innerHTML   = swatchRow(ENDZONES, state.endzone, null, 'ez');
    if (logos) logos.innerHTML = LOGOS.map(l =>
      `<div class="fld-logo${l === state.logo ? ' on' : ''}" data-kind="logo" data-id="${l}">${l}</div>`).join('');
    const nm = $('fld-names');
    if (nm) nm.textContent = turfOf().name + '  ·  ' + ezOf().name + ' end zones';
  }

  // One delegated tap handler for the whole picker (same trick MY TEAM uses).
  function onPick(e) {
    const el = e.target.closest('[data-kind]'); if (!el) return;
    e.preventDefault();
    const kind = el.dataset.kind, id = el.dataset.id;
    if (kind === 'turf') state.turf = id;
    else if (kind === 'ez') state.endzone = id;
    else if (kind === 'logo') state.logo = id;
    else return;
    save();
    render();
    repaint();          // the real field behind the pop-up updates instantly
  }

  function resetAll() { state = Object.assign({}, DEFAULT); save(); render(); repaint(); }

  // ---- Open / close -------------------------------------------------------
  function open() { state = load(); render(); const el = $('field-modal'); if (el) el.style.display = 'flex'; }
  function closeOverlay() { const el = $('field-modal'); if (el) el.style.display = 'none'; }

  function tap(id, fn) { const el = $(id); if (el) el.addEventListener('pointerdown', e => { e.preventDefault(); fn(); }); }
  function wire() {
    tap('open-field', open);
    tap('field-close', closeOverlay);
    tap('fld-reset', resetAll);
    const box = $('field-picks');
    if (box) box.addEventListener('pointerdown', onPick);
  }
  if (document.readyState !== 'loading') wire();
  else document.addEventListener('DOMContentLoaded', wire);

  // ---- What the rest of the game may use ----------------------------------
  window.TDField = {
    look,     // main.js drawField: the colours + midfield logo to paint
    open      // the Pro Shop button
  };
})();
