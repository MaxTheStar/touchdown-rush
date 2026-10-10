// ============================================================
// TOUCHDOWN FUN — jumpball.js: 🙌 JUMP BALL (Round 16, pick ⑦)
// ------------------------------------------------------------
// A pass arrives and a defender is right on top of the receiver. Real football calls
// that a contested catch — two men leaping for the same ball — and it is one of the
// best plays in the sport. In this game it was a roll. `resolvePass()` saw a defender
// within 1.5 yards and, in three lines, picked an interception (40%) or a knock-away
// (60%). There was NO third outcome: a covered receiver could never come down with
// it, and you never touched any of it.
//
// Now the whole field holds still over the two of them and you get the moment. A
// football drifts across a track toward your receiver's hands and you tap as it gets
// there. It is the offense's half of v4.28's tipped ball, on purpose built the same
// way (same track, same habit-tap rule) so a kid who learned one knows the other:
//
//     🙌 right at his hands   65%   he goes up and gets it — a CATCH
//     👏 close                35%
//     ✋ too early / too late 10%
//
// ⚠️ IT REPLACES THE ROLL; IT DOES NOT ADD A SECOND ONE. If the leap fails, the
// ball goes through the old contested roll exactly as before (interception 40%,
// knock-away 60%; Cannon Arm and Maxwell still count). So the INT rate on a covered
// throw is 40% × (1 − chance you won it). Using the same "ordinary thumb" v4.28 used
// (40% green / 30% close / 30% miss) a covered throw ends 40% catch / 24% pick / 36%
// knocked away; a careful thumb 58 / 17 / 25; perfect timing 65 / 14 / 21; and a player
// who ignores the moment 10 / 36 / 54 (never worse than the old 0 / 40 / 60).
// ⚠️ AND IT MUST NOT MAKE COVERAGE IRRELEVANT. A covered throw has to stay a bad idea
// compared with an open one (completion 75% for ~12 yards, no interception risk at all),
// so the win chances are modest: even a perfect leap wins 65%, and by the yardstick in
// DEVLOG v4.36 an ordinary covered throw is worth about −6 yards against +9 for the
// open man (it was −16: all downside).
//
// ⚠️ A TAP THAT CAME TOO SOON DOES NOTHING. The throw you just made, the HIKE you
// pressed ten seconds ago and the tap you made to dismiss the last banner are all
// habits. Anything in the first third of the ball's flight is swallowed; only a tap
// while the ball is actually near his hands counts.
//
// 🧤 STICKY GLOVES, 🧲 SURE HANDS and a 🔥 HOT HAND already make a receiver catch more.
// They did nothing on a covered ball (it never got as far as the catch roll). Now they
// are the "bonus": a wider green zone AND better odds in every zone. The weather's
// catch multiplier and Maxwell's reach multiply the result.
//
// Nothing is saved. This file owns the moment; main.js's `resolvePass()` starts it
// and finishes the play with whatever it reports.
// ============================================================
(function () {
  'use strict';

  const $ = id => document.getElementById(id);
  const clamp = (v, lo, hi) => v < lo ? lo : v > hi ? hi : v;

  let FLIGHT_MS = 1400;        // how long the ball takes to cross the track
  const CENTER = 0.72;         // where his hands are, as a fraction of the track
  const GREEN = 0.06;          // ± this around the centre is a perfect leap (before the bonus)
  const YELLOW = 0.15;         // ± this is a close one
  const IGNORE_BEFORE = 0.34;  // a tap in the first third of the flight is a habit, not a leap
  const SUCCESS = { green: 0.65, yellow: 0.35, early: 0.10, late: 0.10 };
  const MAX_CHANCE = 0.95;     // even a perfect leap on a glued defender is not a sure thing

  let live = null;             // { t0, bonus, mult, done, settled, timer, raf }

  // ---- the pure parts (so every number can be checked without a game) -----------
  function zones(bonus) {
    const h = clamp(bonus || 0, 0, 0.2);           // a negative bonus (bad gear) does not shrink the zone
    return { green: GREEN + h * 0.25, yellow: YELLOW + h * 0.30 };
  }
  function posAt(ms) { return clamp(ms / FLIGHT_MS, 0, 1); }
  function grade(pos, bonus) {
    const z = zones(bonus);
    const d = Math.abs(pos - CENTER);
    if (d <= z.green) return 'green';
    if (d <= z.yellow) return 'yellow';
    return pos < CENTER ? 'early' : 'late';
  }
  // The chance he comes down with it. `bonus` is added to every zone (gloves + Sure Hands + a hot hand),
  // `mult` multiplies the lot (weather, Maxwell). Never 0 and never certain.
  function chance(g, bonus, mult) {
    const base = SUCCESS[g] != null ? SUCCESS[g] : SUCCESS.late;
    return clamp((base + (bonus || 0)) * (mult != null ? mult : 1), 0.02, MAX_CHANCE);
  }

  // ---- the moment -----------------------------------------------------------------
  function overlay() {
    let el = $('jb-over');
    if (el) return el;
    if (!document.body) return null;
    el = document.createElement('div');
    el.id = 'jb-over';
    // The whole screen is the button: it is a moment, not a menu, and a thumb should not have to aim.
    el.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); press(); });
    document.body.appendChild(el);
    return el;
  }

  function paint(el, bonus) {
    const z = zones(bonus);
    const left = (CENTER - z.yellow) * 100, wy = z.yellow * 200;
    const lg = (CENTER - z.green) * 100, wg = z.green * 200;
    el.innerHTML =
      '<div class="jb-card">' +
        '<div class="jb-title">🙌 JUMP BALL!</div>' +
        '<div class="jb-sub">Tap as the ball gets to his hands.</div>' +
        '<div class="jb-track"><i class="jb-yellow" style="left:' + left + '%;width:' + wy + '%"></i>' +
          '<i class="jb-green" style="left:' + lg + '%;width:' + wg + '%"></i>' +
          '<span class="jb-hands" style="left:' + (CENTER * 100) + '%">🙌</span>' +
          '<b class="jb-ball" id="jb-ball">🏈</b></div>' +
        '<div class="jb-res" id="jb-res">&nbsp;</div>' +
        (bonus > 0 ? '<div class="jb-perk">🧤 Good hands: a wider window</div>' : '') +
      '</div>';
    el.style.display = 'flex';
  }

  // Start the moment. `opts` = { bonus, mult }. `done(won, grade)` is called once, after a short
  // beat so you can see what happened. Returns false if there is nowhere to draw it (the caller
  // then falls back to the old roll, so a missing page element can never break a pass).
  function begin(opts, done) {
    const el = overlay(); if (!el) return false;
    cancel();
    const o = opts || {};
    paint(el, o.bonus || 0);
    live = { t0: performance.now(), bonus: o.bonus || 0, mult: o.mult != null ? o.mult : 1, done, settled: false, timer: 0, raf: 0 };
    const step = () => {
      if (!live || live.settled) return;
      const b = $('jb-ball');
      if (b) b.style.left = (posAt(performance.now() - live.t0) * 100) + '%';
      live.raf = requestAnimationFrame(step);
    };
    live.raf = requestAnimationFrame(step);
    // ⚠️ THE MOMENT CAN NEVER HANG: if nobody taps (or the pane is hidden and rAF is paused),
    // a timer ends the flight and the ball simply arrives.
    live.timer = setTimeout(() => settle('late'), FLIGHT_MS + 250);
    return true;
  }

  // A tap (or SPACE). Returns true if it was used.
  function press() {
    if (!live || live.settled) return false;
    const pos = posAt(performance.now() - live.t0);
    if (pos < IGNORE_BEFORE) return true;              // a habit tap — swallowed, nothing lost
    settle(grade(pos, live.bonus));
    return true;
  }

  function settle(g) {
    if (!live || live.settled) return;
    live.settled = true;
    clearTimeout(live.timer); cancelAnimationFrame(live.raf);
    const won = Math.random() < chance(g, live.bonus, live.mult);
    const res = $('jb-res');
    if (res) {
      res.className = 'jb-res ' + (won ? 'good' : 'bad');
      res.textContent = won
        ? (g === 'green' ? '🙌 HE WENT UP AND GOT IT!' : '🙌 HE CAME DOWN WITH IT!')
        : (g === 'early' ? '✋ TOO EARLY!' : g === 'late' ? '✋ TOO LATE!' : '✋ SO CLOSE!');
    }
    const d = live.done;
    setTimeout(() => { hide(); live = null; try { d && d(won, g); } catch (e) { console.error(e); } }, 650);
  }

  function hide() { const el = $('jb-over'); if (el) { el.style.display = 'none'; el.innerHTML = ''; } }
  function cancel() { if (live) { clearTimeout(live.timer); cancelAnimationFrame(live.raf); live = null; } hide(); }
  function active() { return !!live; }

  // SPACE works too (and is swallowed, so it cannot also reach the game). Registered once, only acts while a moment is live.
  document.addEventListener('keydown', e => {
    if (!live || live.settled) return;
    if (e.code === 'Space' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); press(); }
  }, true);

  const css = document.createElement('style');
  css.textContent = `
    #jb-over { display: none; position: fixed; inset: 0; z-index: 60; background: rgba(6,10,20,0.34);
      align-items: flex-start; justify-content: center; touch-action: none; cursor: pointer;
      padding: calc(env(safe-area-inset-top, 0px) + 112px) 16px 16px; box-sizing: border-box; }
    .jb-card { width: 100%; max-width: 420px; box-sizing: border-box; border-radius: 16px; padding: 14px 16px 12px;
      background: rgba(10,16,30,0.94); border: 2px solid rgba(255,224,102,0.85); box-shadow: 0 8px 28px rgba(0,0,0,.55);
      display: flex; flex-direction: column; align-items: center; gap: 6px; text-align: center; }
    .jb-title { font: 900 24px "Arial Black", Arial; color: #ffe066; }
    .jb-sub { font: 700 13px Arial; color: #cdd6e6; }
    .jb-track { position: relative; width: 100%; height: 42px; margin: 8px 0 2px; border-radius: 21px;
      background: rgba(255,255,255,0.10); overflow: hidden; }
    .jb-track i { position: absolute; top: 0; bottom: 0; }
    .jb-yellow { background: rgba(255,214,10,0.28); }
    .jb-green { background: rgba(63,200,95,0.65); }
    .jb-hands { position: absolute; top: 50%; transform: translate(-50%, -50%); font-size: 22px; opacity: .9; }
    .jb-ball { position: absolute; top: 50%; left: 0; transform: translate(-50%, -50%); font-size: 24px;
      filter: drop-shadow(0 2px 3px rgba(0,0,0,.6)); }
    .jb-res { min-height: 1.4em; font: 900 16px "Arial Black", Arial; color: #fff; }
    .jb-res.good { color: #7ff0a0; } .jb-res.bad { color: #ff9b9b; }
    .jb-perk { font: 700 11px Arial; color: #9fd8ff; }
  `;
  document.head.appendChild(css);

  window.TDJump = {
    begin, press, cancel, active,
    // pure, for checking the numbers without playing a down
    grade, chance, zones, posAt, SUCCESS,
    _consts: () => ({ FLIGHT_MS, CENTER, GREEN, YELLOW, IGNORE_BEFORE, MAX_CHANCE }),
    _flight: ms => { FLIGHT_MS = ms; return FLIGHT_MS; },   // tests only: slow the ball down to look at it
  };
})();
