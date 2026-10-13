// ============================================================
// TOUCHDOWN FUN — pickreturn.js: 🏃 THE PICK-SIX RETURN (Round 17, pick ⑦)
// ------------------------------------------------------------
// You intercept the ball and then nothing happens. In the one-player game the computer's
// drive is a tap-through map (`DefenseSim`), so a pick was a line of text — "INTERCEPTED —
// YOUR BALL" — and the next thing you saw was your own first down. The most exciting thing
// a defense can do, a man with the ball and the whole field in front of him, existed only in
// the two-player game (`startPickSix`).
//
// Now an interception is a RETURN. The tap-through panel gives way to the field and you run
// it back with exactly the machinery a kickoff and a punt return already use: you steer the
// runner with the arrows or the D-pad (a swipe dashes), the other team's players chase him
// down, and the spot where he is brought down is where your drive starts. Reach their end
// zone and it is a pick-six: six points, the celebration, the film, the try.
//
// ⚠️ IT STARTS WHERE THE BALL WAS CAUGHT (v4.40 put it there): a few yards past the line of
// scrimmage, on a random lane (the pass could have gone anywhere). A pick in your own end zone
// is still a touchback.
//
// ⚠️ IT MUST NOT TURN EVERY INTERCEPTION INTO A TOUCHDOWN, so the other team is laid out the way
// a real defense meets a loose picker: the receiver who was covered is right beside him, FOUR
// more men are across the lane ahead of him, one more behind them, and the quarterback is back
// at the line (he never catches anybody, but he is there). Each starts to chase after a
// reaction delay — the quickest after 0.15–0.35s, the slowest after 0.5–0.9s — and then runs
// straight at the runner at the game's usual coverage speed (`koCover`: 180 / 198 / 214).
// A runner needs to be a bit faster than that coverage to get away; on Hard (214 against 205)
// nobody can, which is how a kickoff return already works there.
//
// MEASURED (a pure simulation of the game's own rules: 60 fps, the 5 directions a D-pad gives,
// tackle at 15px, pure pursuit; 2,500 returns per row from the spots interceptions really
// happen at; "ordinary" = a runner who looks 0.4s ahead, decides every 0.2s and errs a third
// of the time; "good" = looks 0.7s ahead, decides every 0.1s, never errs; no dashes):
//                     ordinary: mean · median · pick-sixes     good: mean · pick-sixes
//     Easy   (180)           13.9 yds ·  8.9 · 11.6%                 34.8 · 58%
//     Medium (198)           10.0 yds ·  8.4 ·  3.4%                 26.6 · 39%
//     Hard   (214)            7.9 yds ·  7.9 ·  0.0%                  8.0 ·  0%
// — "a few yards, a score once in a long while" for most people and a real chance for somebody
// who can steer, with the swipe dash (360 px/s for 0.32s) the extra a person has over the bot.
//
// ⚠️ AND A RETURN IS WORTH POINTS, SO THERE ARE FEWER OF THEM. Every interception now comes with
// about ten yards and a small chance of six: priced in expected points (0.058 a yard from your own
// 20) over 40,000 drives of the real `DefenseSim`, the return alone is worth +0.053 points a drive,
// +0.64 a game. A takeaway is a bigger swing than it was, so (like v4.40, when spotting takeaways at
// the real spot did the same thing) interceptions are rarer by PICK_SCALE — the base roll AND the
// share of incompletions that are tipped, so the whole stream — until the margin per drive is back
// where it was. 80,000 drives each, your margin per drive / interceptions per 100 drives:
//     no return (before)        −0.511 ± 0.010      10.1
//     return, scale 1.00        −0.461 ± 0.014       9.9      (+0.053: a buff)
//     return, scale 0.85        −0.506 ± 0.010       8.4      ← this one
//     return, scale 0.80        −0.528 ± 0.010       7.9
//     return, scale 0.70        −0.548 ± 0.010       7.3
// (Interceptions fall by less than the scale: a drive that no longer ends in a pick keeps going, and
// gets more throws.) Takeaways overall: 15.1 → 13.3 per 100 drives; their scoring 1.383 → 1.415.
//
// Nothing is saved. This file owns the layout and the numbers; main.js's `startPickReturn()`
// puts the men on the field and the kickoff-return machinery does everything else.
// ============================================================
(function () {
  'use strict';

  const clamp = (v, lo, hi) => v < lo ? lo : v > hi ? hi : v;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const sgn = () => (Math.random() < 0.5 ? -1 : 1);
  const gauss = () => { let s = 0; for (let i = 0; i < 6; i++) s += Math.random(); return (s - 3) / 0.7071; };   // ≈ N(0,1)

  const READY_MS = 800;          // "INTERCEPTED! RUN IT BACK!" — a beat to find the arrows before anybody moves
  const FIELD_MIN_X = 25, FIELD_MAX_X = 508;

  // The geometry. Distances are px (10px = 1 yard); `dy` is how far UPFIELD of the runner (toward the end zone he is
  // running at) a man starts, negative = behind him; `delay` is the reaction time before he gives chase, in seconds.
  const NEAR  = { dx: [35, 80],   dy: [-10, 30],   delay: [0.15, 0.35] };   // the receiver who was covered: right beside him
  const WAVE1 = { k: 4, width: 340, jitter: 30, dy: [60, 130],   delay: [0.20, 0.50] };   // four men across the lane ahead
  const WAVE2 = { k: 1, width: 340, jitter: 30, dy: [150, 260],  delay: [0.20, 0.50] };   // one more behind them
  const QB    = { dx: [-60, 60],  dy: [-260, -110], delay: [0.50, 0.90] };   // back at the line of scrimmage

  // Which fraction of the base interception chance survives: the return is worth more than the pick was (see the header).
  // Mutable on purpose — the headless simulations vary it. main.js reads it when it rolls the interception.
  const PICK_SCALE_DEFAULT = 0.85;

  // k men spread evenly across `width` px, jittered, in a random order
  function spread(k, width, jitter) {
    const xs = [];
    for (let i = 0; i < k; i++) xs.push(-width / 2 + (width * (i + 0.5)) / k + rnd(-jitter, jitter));
    for (let i = xs.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = xs[i]; xs[i] = xs[j]; xs[j] = t; }
    return xs;
  }

  // The picture at the moment of the interception: the runner's x and the seven men as { x, dy, delay } (absolute x, `dy`
  // upfield of the runner in px, delay in seconds), in the order main.js gives them to `defense[0…6]`.
  function layout() {
    const x0 = clamp(266 + gauss() * 90, 70, 463);      // the pass could have gone anywhere, mostly toward the middle
    const men = [];
    const put = (dx, dy, delay) => men.push({ x: clamp(x0 + dx, FIELD_MIN_X, FIELD_MAX_X), dy, delay });
    put(sgn() * rnd(NEAR.dx[0], NEAR.dx[1]), rnd(NEAR.dy[0], NEAR.dy[1]), rnd(NEAR.delay[0], NEAR.delay[1]));
    const a = spread(WAVE1.k, WAVE1.width, WAVE1.jitter);
    for (let i = 0; i < WAVE1.k; i++) put(a[i], rnd(WAVE1.dy[0], WAVE1.dy[1]), rnd(WAVE1.delay[0], WAVE1.delay[1]));
    const b = spread(WAVE2.k, WAVE2.width, WAVE2.jitter);
    for (let i = 0; i < WAVE2.k; i++) put(b[i], rnd(WAVE2.dy[0], WAVE2.dy[1]), rnd(WAVE2.delay[0], WAVE2.delay[1]));
    put(rnd(QB.dx[0], QB.dx[1]), rnd(QB.dy[0], QB.dy[1]), rnd(QB.delay[0], QB.delay[1]));
    return { x0, men };
  }

  window.TDPickRet = {
    layout, READY_MS,
    PICK_SCALE: PICK_SCALE_DEFAULT,
    // is the return on? (it needs the kickoff-return machinery in main.js, which is always there; the flag lets tests switch it off)
    on: true,
    ready() { return !!this.on; },
    // what main.js multiplies the BASE interception chance (and the share of incompletions that are tipped) by
    pickScale() { return this.ready() ? this.PICK_SCALE : 1; },
    _consts: () => ({ NEAR, WAVE1, WAVE2, QB, READY_MS }),
  };
})();
