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

  // The weather kinds the field can actually be in. (🥵 hot & 🥶 blizzard are the
  // new EXTREME ones.)
  const KINDS = ['clear', 'night', 'rain', 'wind', 'snow', 'hot', 'blizzard'];
  // What the menu button can be set to (AUTO = pick a random one each game).
  const PREFS = ['auto', 'clear', 'night', 'rain', 'wind', 'snow', 'hot', 'blizzard'];

  // Everything about each weather in one place:
  //   btn    — the menu button label
  //   say    — the kickoff announcement (also tells the kid what to expect)
  //   fumble — slippery-ball fumble multiplier (1.0 = normal)
  //   catch  — how much HARDER it is to catch / complete a pass (1.0 = normal, lower = harder)
  //   fg     — how much HARDER a field goal is to make (1.0 = normal, lower = harder)
  // Each weather has a SIGNATURE effect; the two extremes (hot/blizzard) hit more.
  const INFO = {
    auto:     { btn: '🌦 AUTO' },
    clear:    { btn: '☀️ CLEAR',    say: '☀️ Clear skies — perfect football weather!', fumble: 1.0, catch: 1.00, fg: 1.00 },
    night:    { btn: '🌙 NIGHT',    say: '🌙 Night game — tougher to track the ball!', fumble: 1.0, catch: 0.82, fg: 1.00 },
    rain:     { btn: '🌧️ RAIN',     say: '🌧️ Rain! Slippery ball and shaky kicks.',   fumble: 1.5, catch: 0.95, fg: 0.75 },
    wind:     { btn: '🌬️ WINDY',    say: '🌬️ Windy — passes will flutter and sail!',   fumble: 1.0, catch: 0.80, fg: 0.85 },
    snow:     { btn: '❄️ SNOW',     say: '❄️ Snow — cold hands, watch the fumbles!',   fumble: 1.7, catch: 0.88, fg: 0.90 },
    hot:      { btn: '🥵 HEAT',     say: '🥵 HEAT WAVE! Sweaty hands out there.',      fumble: 1.0, catch: 0.88, fg: 0.97 },
    blizzard: { btn: '🥶 BLIZZARD', say: '🥶 BLIZZARD! Brutal cold — everything is hard!', fumble: 2.0, catch: 0.72, fg: 0.78 },
  };

  let pref    = load('weather', 'auto');   // what YOU picked (may be 'auto')
  let current = 'clear';                    // the actual weather in play right now

  // Put the right classes on <body> so the CSS shows the correct overlay.
  function apply(kind) {
    current = KINDS.includes(kind) ? kind : 'clear';
    const b = document.body;
    b.classList.remove('wx-night', 'wx-rain', 'wx-wind', 'wx-snow', 'wx-hot', 'wx-blizzard', 'wx-active');
    if (current !== 'clear') b.classList.add('wx-' + current, 'wx-active');
  }

  // main.js calls this at the start of every game. It picks the weather (random
  // when you're on AUTO, weighted toward nicer days), shows it, and hands back a
  // friendly line to announce at the kickoff.
  function forGame() {
    let kind = pref;
    if (pref === 'auto') {
      // Weighted toward nice days; the two EXTREMES are rare treats.
      const r = Math.random();   // clear 34 · night 18 · rain 14 · wind 12 · snow 10 · hot 7 · blizzard 5
      kind = r < 0.34 ? 'clear' : r < 0.52 ? 'night' : r < 0.66 ? 'rain'
           : r < 0.78 ? 'wind'  : r < 0.88 ? 'snow'  : r < 0.95 ? 'hot' : 'blizzard';
    }
    apply(kind);
    return INFO[current].say || '';
  }

  // The three ways weather bites, read live by main.js / kick.js (1.0 = no effect).
  function fumbleMult() { return INFO[current] ? INFO[current].fumble : 1.0; }  // slippery ball
  function catchMult()  { return INFO[current] ? INFO[current].catch  : 1.0; }  // catching / completing a pass
  function fgMult()     { return INFO[current] ? INFO[current].fg     : 1.0; }  // making a field goal

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
    catchMult,      // main.js: catch / pass-completion multiplier (night, wind, snow, hot, blizzard)
    fgMult,         // kick.js: field-goal make multiplier (rain, wind, blizzard)
    current: () => current,
    pref: () => pref,
  };
})();
