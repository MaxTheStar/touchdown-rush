// ============================================================
// TOUCHDOWN FUN — colorblind.js: 🎨 COLOR-BLIND COLORS (Round 22, pick ④)
// ------------------------------------------------------------
// Red against blue is the whole game, and for a lot of players red and green look the same. The defense is whatever colours the OPPONENT really wears
// (so a green team can vanish into the grass, a red one into a brown shirt), the timing panels are green-and-yellow, and the three routes are orange,
// pink and yellow. ⚙️ SETTINGS → 🎨 Color-blind colors changes the three places that lean on colour alone, using the Okabe-Ito palette that stays
// distinguishable for red-green and blue-yellow colour blindness alike:
//
//   1. THE OTHER TEAM wears a safe kit: ORANGE (#E69F00) if your own shirt is bluish, BLUE (#0072B2) if it is not. Applied when the next game
//      is dealt (the textures are drawn once per game) — the row says so.
//   2. THE TIMING PANELS (jump ball, toe-tap, fall-on-it, swim move…): the green "perfect" band becomes SKY BLUE with a bright edge and a ✓, the
//      yellow "close" band becomes ORANGE — never green against yellow.
//   3. THE ROUTE LINES: the back is yellow, the first receiver SKY BLUE, the second ORANGE (it was orange, pink and yellow).
//
// ⚠️ IT CHANGES WHAT YOU SEE, NOT HOW THE GAME PLAYS: no number anywhere reads this switch except the three colour choices above.
// ============================================================
(function () {
  'use strict';
  let on = false;
  const SAFE_ORANGE = { jersey: 0xE69F00, helmet: 0x7a5200 }, SAFE_BLUE = { jersey: 0x0072B2, helmet: 0x003e61 };

  // is a 0xRRGGBB colour bluish? (hue 180–260°, enough saturation)
  function bluish(c) {
    const r = (c >> 16 & 255) / 255, g = (c >> 8 & 255) / 255, b = (c & 255) / 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
    if (d < 0.12) return false;
    let h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h = (h * 60 + 360) % 360;
    return h >= 180 && h <= 260;
  }
  const safeKit = yourJersey => bluish(yourJersey) ? SAFE_ORANGE : SAFE_BLUE;

  function apply(v) {
    on = !!v;
    if (document.body) document.body.classList.toggle('cb', on);
    else document.addEventListener('DOMContentLoaded', () => document.body.classList.toggle('cb', on));
  }

  // wrap the game's own texture painter: the OTHER team ('red') wears the safe kit when the switch is on
  function install() {
    const orig = window.makeChibiTexture;
    if (typeof orig !== 'function' || orig.__cb) return;
    const wrapped = function (scene, key, jersey, helmet) {
      if (on && key === 'red') {
        let mine = 0x2255aa;
        try { mine = window.__td.G.team.jersey; } catch (e) {}
        const k = safeKit(mine); jersey = k.jersey; helmet = k.helmet;
      }
      return orig.call(this, scene, key, jersey, helmet);
    };
    wrapped.__cb = true; window.makeChibiTexture = wrapped;
  }

  if (window.TDSettings) TDSettings.register({ id: 'cb', label: '🎨 Color-blind colors', type: 'toggle', def: false,
    hint: 'A safe kit for the other team (next game), blue/orange timing bars, clearer route lines.', onChange: apply });
  const css = document.createElement('style');
  css.textContent = `
    body.cb .jb-green { background: rgba(86,180,233,0.9); box-shadow: inset 0 0 0 2px #ffffff; }
    body.cb .jb-green::after { content: '\\2713'; position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); font: 900 14px Arial; color: #02263a; }
    body.cb .jb-yellow { background: rgba(230,159,0,0.5); }
    body.cb .jb-res.good { color: #7fd0ff; } body.cb .jb-res.bad { color: #ffb347; }`;
  document.head.appendChild(css);
  install();                                              // (main.js loads AFTER this file, so also try again once the page has loaded)
  window.addEventListener('load', install);

  window.TDColorBlind = { bluish, safeKit, on: () => on, apply, SAFE_ORANGE, SAFE_BLUE };
})();
