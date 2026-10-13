// ============================================================
// TOUCHDOWN FUN — goalline.js: 🛑 STOP THE TWO-POINT TRY (Round 17, pick ④)
// ------------------------------------------------------------
// They score. Then about one time in four they do not kick the extra point — they
// go for two, a single snap from the 2-yard line, and if it works it is the
// biggest swing a try can have. It is the best goal-line stand in the sport and,
// until now, you were not in it: `cpuDriveEnd()` rolled a flat 25% for "go for
// two" and then a flat 45% for "it worked", with no input from you at all.
//
// Now when they go for two the field holds still and you get the moment — the
// same timing panel as 🙌 JUMP BALL and the tipped ball, from the defense's side:
// a football drifts toward the line and you tap as it is snapped.
//
//     🛑 right on the snap      76%   you stuff them — NO GOOD
//     👏 close                  54%
//     ✋ early / late           30%
//
// ⚠️ IT REPLACES THE 45%, IT DOES NOT ADD A SECOND ROLL. The "ordinary thumb" of
// v4.28 (40% of taps in the green, 30% close, 30% off) stops 55.6% of tries, so
// they convert 44.4% — the coin it replaced was 45%. Playing it well stops
// three in four; ignoring the moment still stops three in ten (the ball arrives
// and the panel settles itself after a second and a half — never worse than that,
// and never a punishment for not playing: it costs the same as the coin did to
// a player who just watched, plus a quarter).
//
// ⚠️ IT IS RARE ON PURPOSE: 25% of their touchdowns, about once a game. The kick
// they take the other three times is untouched.
//
// Nothing is saved. This file owns the numbers; main.js's `cpuDriveEnd()` starts
// the moment and finishes the drive with whatever it reports.
// ============================================================
(function () {
  'use strict';

  const GO_FOR_TWO = 0.25;   // the share of their touchdowns that go for two (the flat number cpuDriveEnd always used)
  const CONVERT = 0.45;      // …and how often it used to work, which the moment REPLACES (kept for the fallback and for the tests)
  const TABLE = { green: 0.76, yellow: 0.54, early: 0.30, late: 0.30 };   // the chance YOU stop it, by timing

  // The stop chance for a tap graded `g` ('green' | 'yellow' | 'early' | 'late').
  const stopChance = g => (TABLE[g] != null ? TABLE[g] : TABLE.late);

  // Is there anywhere to draw the moment? (If not, cpuDriveEnd falls back to the old coin.)
  const ready = () => !!window.TDJump;

  // Start the moment. `done(stopped)` is called once, after a short beat so you can see what happened.
  function begin(done) {
    if (!window.TDJump) return false;
    return TDJump.begin({
      title: '🛑 GOAL-LINE STAND!',
      sub: 'They go for two! Tap as the ball is snapped to stuff them at the line.',
      winText: '🛑 STUFFED AT THE LINE!',
      success: TABLE,
      icon: '🛑',
      mult: 1, bonus: 0,
    }, won => { try { done && done(!!won); } catch (e) { console.error(e); } });
  }

  window.TDGoalLine = { begin, ready, stopChance, GO_FOR_TWO, CONVERT, TABLE };
})();
