// ============================================================
// TOUCHDOWN FUN — weather.js: 🌦 WEATHER & NIGHT GAMES
// ------------------------------------------------------------
// Every game now has WEATHER. Sometimes it's a bright afternoon, sometimes the
// lights come on for a NIGHT game, sometimes it's RAINING, sometimes it SNOWS.
//
//   🎨 THE LOOK — the weather is a see-through layer painted ON TOP of the field
//      (a `#weather-fx` div in index.html), the same trick the 3D tilt uses. Night
//      dims the stadium, rain streaks down, snow drifts by. It's pure atmosphere —
//      it never touches the players or the physics.
//
//   🏈 A LITTLE BITE — a wet or snowy ball is slippery, so in rain/snow there are a
//      few more fumbles (main.js multiplies its fumble chance by fumbleMult()).
//      Buy 🔒 IRON GRIP in the Pro Shop to fight back!
//
//   🎛 YOUR CALL — the 🌦 WEATHER button on the menu cycles what you want: AUTO
//      (a surprise each game), or lock in CLEAR / NIGHT / RAIN / SNOW. Saved in
//      localStorage (tdr-weather) so it's remembered.
//
// main.js talks to us through window.TDWeather — see the bottom.
// ============================================================
(function () {
  'use strict';

  const T = window.TDStats ? TDStats.shared : null;
  const store = (k, v) => { if (T) T.store(k, v); };
  const load  = (k, f) => (T ? T.load(k, f) : f);
  const $ = id => document.getElementById(id);

  // The weather kinds the field can actually be in.
  const KINDS = ['clear', 'night', 'rain', 'snow'];
  // What the menu button can be set to (AUTO = pick a random one each game).
  const PREFS = ['auto', 'clear', 'night', 'rain', 'snow'];

  // Button label + kickoff announcement + slippery-ball fumble multiplier per kind.
  const INFO = {
    auto:  { btn: '🌦 AUTO' },
    clear: { btn: '☀️ CLEAR', say: '☀️ Clear skies!',      fumble: 1.0 },
    night: { btn: '🌙 NIGHT', say: '🌙 Night game!',        fumble: 1.0 },
    rain:  { btn: '🌧️ RAIN',  say: '🌧️ Rain is falling!',   fumble: 1.5 },
    snow:  { btn: '❄️ SNOW',  say: '❄️ Let it snow!',        fumble: 1.7 },
  };

  let pref    = load('weather', 'auto');   // what YOU picked (may be 'auto')
  let current = 'clear';                    // the actual weather in play right now

  // Put the right classes on <body> so the CSS shows the correct overlay.
  function apply(kind) {
    current = KINDS.includes(kind) ? kind : 'clear';
    const b = document.body;
    b.classList.remove('wx-night', 'wx-rain', 'wx-snow', 'wx-active');
    if (current !== 'clear') b.classList.add('wx-' + current, 'wx-active');
  }

  // main.js calls this at the start of every game. It picks the weather (random
  // when you're on AUTO, weighted toward nicer days), shows it, and hands back a
  // friendly line to announce at the kickoff.
  function forGame() {
    let kind = pref;
    if (pref === 'auto') {
      const r = Math.random();                                  // 40% clear, 25% night, 20% rain, 15% snow
      kind = r < 0.40 ? 'clear' : r < 0.65 ? 'night' : r < 0.85 ? 'rain' : 'snow';
    }
    apply(kind);
    return INFO[current].say || '';
  }

  // How much MORE likely a fumble is right now (1.0 = normal). Read by main.js.
  function fumbleMult() { return INFO[current] ? INFO[current].fumble : 1.0; }

  // ---- The 🌦 WEATHER menu button --------------------------------------------
  function paintBtn() {
    const el = $('cycle-weather');
    if (el) el.textContent = INFO[pref].btn;
  }
  function cyclePref() {
    pref = PREFS[(PREFS.indexOf(pref) + 1) % PREFS.length];
    store('weather', pref);
    paintBtn();
  }

  function wireUp() {
    paintBtn();
    const el = $('cycle-weather');
    if (el) el.addEventListener('pointerdown', e => { e.preventDefault(); cyclePref(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wireUp);
  else wireUp();

  // ---- What the rest of the game may use -------------------------------------
  window.TDWeather = {
    forGame,        // beginGame: pick + show this game's weather, returns the announce line
    fumbleMult,     // main.js: slippery-ball fumble multiplier
    current: () => current,
    pref: () => pref,
  };
})();
