// ============================================================
// TOUCHDOWN FUN — bighit.js: 💥 HITS YOU CAN FEEL (Max's "aggressive physics")
// ------------------------------------------------------------
// Until v3.7 a defender could fly in and flatten you after a twelve-yard run
// and the game said **absolutely nothing**: no sound, no shake, no dust. The
// screen only kicked when you got stuffed at the line (`gain <= 1`), so the
// hardest-looking plays in the game were the quietest ones.
//
// This grades EVERY tackle and answers with a hit to match it — a crunch you
// can hear, a kick of the camera, and a spray of turf where he landed.
//
// ⚠️ THE GRADE IS A **V**, NOT A LINE, AND THAT IS REAL FOOTBALL. The biggest
// hits happen at BOTH ends of a play, not at one:
//
//     force
//      1.0 |*                                             *
//          | *                                        *
//      0.5 |   *                                 *
//          |      *                       *
//      0.2 |          * * * * * * * *
//          +--------------------------------------------------
//           sack   stuff   short    ordinary gain    chase-down
//
//   · A SACK or a STUFF is a defender meeting you in the hole with nowhere to
//     go. That is the hardest hit in football.
//   · An ORDINARY five-yard tackle is a wrap-up. It should be the quietest
//     thing here, because it is the thing that happens most.
//   · A CHASE-DOWN after a long run is a defender catching you at FULL SPEED
//     from behind — which is why the line climbs again instead of flattening.
//     A grade that just said "more yards = bigger hit" would get the middle of
//     the play wrong; one that said "fewer yards = bigger hit" would make the
//     best run of the game land like nothing.
//
// ⚠️ IT NEVER CHANGES A RULE. No yards move, nobody fumbles because of this,
// nothing here can decide a game — it is sound and light over the top of a
// play that already happened. Same promise juice.js makes.
//
// ♿ REDUCE MOTION IS HONOURED, AND ONLY FOR THE SHAKE. If your computer asks
// for less motion the camera never kicks — but you still get the crunch and
// the turf, because sound and dust are not motion sickness. Switching the
// whole feature off would quietly take the feedback away from the people who
// most need a play to be legible.
//
// `grade()` is a PURE FUNCTION of a plain object — no globals, no DOM — the
// same shape as TDFourth.advise() and TDClock.advise(), so every kind of
// tackle in the game can be checked without playing a down.
// ============================================================
(function () {
  'use strict';

  let REDUCED = false;
  try { REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  // ---- the grade ---------------------------------------------------------
  // play = { gain, sack, outOfBounds, incomplete }
  //   gain    yards the play made (can be negative)
  //   sack    was it the quarterback, dropped behind the line?
  // Returns 0…1. Zero means "don't bother" — no sound, no shake, nothing.
  function grade(play) {
    const p = play || {};
    // Nobody got hit on an incompletion or a run out of bounds.
    if (p.incomplete || p.outOfBounds) return 0;

    // ⚠️ A MISSING `gain` IS NOT A GAIN OF ZERO, and the difference matters a
    // lot here: zero yards means STUFFED AT THE LINE, which is nearly the
    // loudest hit on the chart. `p.gain || 0` quietly turned "I wasn't told
    // what happened" into "he got buried" — so a caller that forgot the field
    // would get the biggest crunch in the game on every play. If we don't know
    // what happened, nothing happened. (Third time this exact shape has come
    // up — see v3.1's `last` flag and v3.6's period check.)
    if (typeof p.gain !== 'number' || !isFinite(p.gain)) return 0;
    const gain = Math.round(p.gain);

    if (p.sack) return 1;                       // the quarterback, buried. the loudest thing here
    if (gain <= 0) return 0.9;                  // stuffed for nothing or a loss
    if (gain <= 2) return 0.7;                  // met in the hole, stopped short
    if (gain <= 5) return 0.45;                 // an ordinary wrap-up tackle
    if (gain <= 9) return 0.38;                 // the quietest: he ran him down easily
    // A long run ends with somebody catching you at full speed. The further
    // you got, the faster he was going when he finally got there — climbing
    // back up to a hard hit at about twenty yards.
    return Math.min(0.85, 0.38 + (gain - 9) * 0.045);
  }

  // ---- the hit -----------------------------------------------------------
  // scene/x/y come straight from main.js's ball carrier. Everything is guarded,
  // so a missing scene, camera or sound module can never break a play.
  function tackle(scene, x, y, play) {
    const f = grade(play);
    if (f <= 0) return 0;

    // 1. THE CRUNCH. The one thing that was missing entirely.
    if (window.TDSound && TDSound.hit) TDSound.hit(f);

    if (!scene) return f;

    // 2. THE CAMERA KICK, scaled to the hit. juice.js's old fixed kick was
    //    0.006; a routine tackle now lands under that and a sack lands above,
    //    so the hardest hit in the game is the one you feel most.
    //    ⚠️ Capped at 0.011 — the same ceiling the touchdown kick uses. Past
    //    that the field stops being readable, and a hit that hides the play is
    //    worse than no hit at all.
    if (!REDUCED) {
      const cam = scene.cameras && scene.cameras.main;
      if (cam && cam.shake) cam.shake(90 + 90 * f, Math.min(0.011, 0.0035 + 0.0075 * f));
    }

    // 3. THE TURF, scaled the same way.
    //    ⚠️ IT ASKS FOR `turf()`, NOT `bigHit()`. bigHit shakes the camera as
    //    well, and we just did that ourselves two lines up — two kicks a frame
    //    apart read as a stutter, not as a hit. juice.js grew a turf-only
    //    spray (v3.7) for exactly this reason; it still owns every particle in
    //    the game, this file owns none.
    if (window.TDJuice && TDJuice.turf) TDJuice.turf(scene, x, y, f);
    return f;
  }

  window.TDHit = { grade, tackle, reduced: () => REDUCED };
})();
