// ============================================================
// TOUCHDOWN FUN — tipped.js: 🙌 THE TIPPED BALL (Round 15, pick ⑦)
// ------------------------------------------------------------
// The biggest play on defense used to be a roll. A pass was thrown, one line of
// `DefenseSim.play()` decided it was an interception, and a banner told you so.
// You were never in it. A pass that is TIPPED — batted up into the air in front
// of your corner, hanging there — is one of the most exciting moments in football
// and the game spent it on a dice roll.
//
// Now when the ball is tipped you get to play it. The panel flips to a single
// moment: a football drifts across a track toward your hands, and you tap as it
// arrives.
//
//     🙌 right in your hands   85%   it sticks — INTERCEPTION
//     👏 close                 50%
//     ✋ too early / too late  35%   he got a finger on it and it dropped
//
// ⚠️ IT MUST NOT MAKE TAKEAWAYS MORE COMMON. It REPLACES the interception roll
// rather than adding a second one: the old roll (about 5% of passes) now starts a
// tipped ball instead of an automatic pick, and a further 7% of incompletions
// are tipped balls too. With the success chances above that comes out at almost
// exactly the old interception rate for an ordinary player (measured in DEVLOG
// v4.28: 5.0 picks per 100 passes before, ~5.0 for an ordinary thumb, ~7 if you
// really time it) — and a floor for the player who never taps: the ball still
// arrives and you get the 35%, so ignoring the moment costs you about two picks in
// five, never all of them. (The first cut had a 25% floor and ignoring it cost more
// than half, which is a punishment for not playing — not the idea.)
//
// ⚠️ A TAP THAT CAME TOO SOON DOES NOTHING. A nine-year-old who has just tapped
// TAP TO CONTINUE for the sixth time is going to tap once more by habit, and that
// tap must not use up the whole moment. Anything in the first third of the ball's
// flight is ignored; only a tap while the ball is actually near your hands counts.
//
// 🖐 BALL HAWK GEAR (the Pro Shop upgrade) and the 🦅 BALL HAWK trait make the
// hands bigger — a wider green zone — on top of what they already did (more
// tipped balls in the first place).
//
// Nothing is saved. This file owns the moment; main.js's `DefenseSim` starts it
// and finishes the play with whatever it reports.
// ============================================================
(function () {
  'use strict';

  const $ = id => document.getElementById(id);
  const clamp = (v, lo, hi) => v < lo ? lo : v > hi ? hi : v;

  let FLIGHT_MS = 1500;        // how long the ball takes to cross the track
  const CENTER = 0.72;         // where your hands are, as a fraction of the track
  const GREEN = 0.07;          // ± this around the centre is a perfect grab (before Ball Hawk)
  const YELLOW = 0.16;         // ± this is a close one
  const IGNORE_BEFORE = 0.34;  // a tap in the first third of the flight is a habit, not a grab
  const SUCCESS = { green: 0.85, yellow: 0.50, early: 0.35, late: 0.35 };
  const TIP_OF_INC = 0.07;     // the share of incompletions that were really tipped balls (0.10 ran takeaways 16% hot)

  let live = null;             // { t0, hawk, done, timer, raf, settled }

  // ---- the pure parts (so every number can be checked without a game) -----------
  function zones(hawk) {
    const h = clamp(hawk || 0, 0, 0.2);          // shop.js caps Ball Hawk at 0.2
    return { green: GREEN + h * 0.25, yellow: YELLOW + h * 0.30 };
  }
  // Where is the ball `ms` after it was tipped? 0..1 along the track.
  function posAt(ms) { return clamp(ms / FLIGHT_MS, 0, 1); }
  function grade(pos, hawk) {
    const z = zones(hawk);
    const d = Math.abs(pos - CENTER);
    if (d <= z.green) return 'green';
    if (d <= z.yellow) return 'yellow';
    return pos < CENTER ? 'early' : 'late';
  }
  const chance = g => SUCCESS[g] != null ? SUCCESS[g] : SUCCESS.late;

  // ---- the moment -----------------------------------------------------------------
  function overlay() {
    let el = $('tb-over');
    if (el) return el;
    const card = document.querySelector('#defense-sim .dsim-card');
    if (!card) return null;
    el = document.createElement('div');
    el.id = 'tb-over';
    card.appendChild(el);
    return el;
  }

  function paint(el, hawk) {
    const z = zones(hawk);
    const left = (CENTER - z.yellow) * 100, wy = z.yellow * 200;
    const lg = (CENTER - z.green) * 100, wg = z.green * 200;
    el.innerHTML =
      '<div class="tb-title">🙌 IT\'S TIPPED!</div>' +
      '<div class="tb-sub">Tap as the ball gets to your hands.</div>' +
      '<div class="tb-track"><i class="tb-yellow" style="left:' + left + '%;width:' + wy + '%"></i>' +
        '<i class="tb-green" style="left:' + lg + '%;width:' + wg + '%"></i>' +
        '<span class="tb-hands" style="left:' + (CENTER * 100) + '%">🙌</span>' +
        '<b class="tb-ball" id="tb-ball">🏈</b></div>' +
      '<div class="tb-res" id="tb-res">&nbsp;</div>' +
      (hawk > 0 ? '<div class="tb-hawk">🖐 Ball Hawk: your hands are bigger</div>' : '');
    el.style.display = 'flex';
  }

  // Start a tipped ball. `done(caught, grade)` is called once, after a short beat so
  // you can see what happened. Returns false if there is nowhere to draw it (the
  // caller then falls back to the old roll).
  function begin(hawk, done) {
    const el = overlay(); if (!el) return false;
    cancel();
    paint(el, hawk || 0);
    live = { t0: performance.now(), hawk: hawk || 0, done, settled: false, timer: 0, raf: 0 };
    const step = () => {
      if (!live || live.settled) return;
      const b = $('tb-ball');
      if (b) b.style.left = (posAt(performance.now() - live.t0) * 100) + '%';
      live.raf = requestAnimationFrame(step);
    };
    live.raf = requestAnimationFrame(step);
    // ⚠️ THE MOMENT CAN NEVER HANG: if nobody taps (or the pane is hidden and rAF is
    // paused), a timer ends the flight and the ball simply arrives.
    live.timer = setTimeout(() => settle('late'), FLIGHT_MS + 250);
    return true;
  }

  // A tap (or SPACE). main.js's DefenseSim.tap() forwards every tap here while a
  // tipped ball is live. Returns true if the tap was used.
  function press() {
    if (!live || live.settled) return false;
    const pos = posAt(performance.now() - live.t0);
    if (pos < IGNORE_BEFORE) return true;              // a habit tap — swallowed, nothing lost
    settle(grade(pos, live.hawk));
    return true;
  }

  function settle(g) {
    if (!live || live.settled) return;
    live.settled = true;
    clearTimeout(live.timer); cancelAnimationFrame(live.raf);
    const caught = Math.random() < chance(g);
    const res = $('tb-res');
    if (res) {
      res.className = 'tb-res ' + (caught ? 'good' : 'bad');
      res.textContent = caught
        ? (g === 'green' ? '🙌 RIGHT IN YOUR HANDS!' : '🙌 YOU GOT IT!')
        : (g === 'early' ? '✋ TOO EARLY — IT SLIPPED OUT' : g === 'late' ? '✋ TOO LATE — IT HIT THE TURF' : '✋ SO CLOSE — IT SLIPPED OUT');
    }
    const d = live.done;
    setTimeout(() => { hide(); live = null; try { d && d(caught, g); } catch (e) { console.error(e); } }, 650);
  }

  function hide() { const el = $('tb-over'); if (el) { el.style.display = 'none'; el.innerHTML = ''; } }
  function cancel() { if (live) { clearTimeout(live.timer); cancelAnimationFrame(live.raf); live = null; } hide(); }
  function active() { return !!live; }

  const css = document.createElement('style');
  css.textContent = `
    #defense-sim .dsim-card { position: relative; }
    #tb-over { display: none; position: absolute; inset: 0; z-index: 5; border-radius: 16px;
      background: rgba(10,16,30,0.96); flex-direction: column; align-items: center; justify-content: center;
      gap: 10px; padding: 18px; text-align: center; }
    .tb-title { font: 900 26px "Arial Black", Arial; color: #ffe066; }
    .tb-sub { font: 700 13px Arial; color: #cdd6e6; }
    .tb-track { position: relative; width: 100%; height: 44px; margin: 12px 0 4px; border-radius: 22px;
      background: rgba(255,255,255,0.10); overflow: hidden; }
    .tb-track i { position: absolute; top: 0; bottom: 0; }
    .tb-yellow { background: rgba(255,214,10,0.28); }
    .tb-green { background: rgba(63,200,95,0.65); }
    .tb-hands { position: absolute; top: 50%; transform: translate(-50%, -50%); font-size: 22px; opacity: .9; }
    .tb-ball { position: absolute; top: 50%; left: 0; transform: translate(-50%, -50%); font-size: 24px;
      filter: drop-shadow(0 2px 3px rgba(0,0,0,.6)); }
    .tb-res { min-height: 1.4em; font: 900 16px "Arial Black", Arial; color: #fff; }
    .tb-res.good { color: #7ff0a0; } .tb-res.bad { color: #ff9b9b; }
    .tb-hawk { font: 700 11px Arial; color: #9fd8ff; }
  `;
  document.head.appendChild(css);

  window.TDTipped = {
    begin, press, cancel, active,
    TIP_OF_INC,
    // pure, for checking the numbers without playing a down
    grade, chance, zones, posAt, SUCCESS,
    _consts: () => ({ FLIGHT_MS, CENTER, GREEN, YELLOW, IGNORE_BEFORE }),
    _flight: ms => { FLIGHT_MS = ms; return FLIGHT_MS; },   // tests only: slow the ball down to look at it
  };
})();
