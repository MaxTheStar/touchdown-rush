// ============================================================
// TOUCHDOWN FUN — twomin.js: 🕑 THE TWO-MINUTE WARNING (Round 20, pick ①)
// ------------------------------------------------------------
// Every real half has one: when the clock reaches 2:00 in the second and fourth quarters
// the game stops, both teams get a breather, and the whole last stretch changes. Here the
// clock just ran from 2:30 to zero without a pause.
//
// At the first play boundary where the clock is at or under 2:00 in the 2nd or 4th quarter
// (once a half, never in overtime, never in a Two-Minute Drill — that already IS the last
// two minutes):
//   · THE CLOCK STOPS AT EXACTLY 2:00 — a play that carried it to 1:45 gives the 15 seconds
//     back, because the warning happened at 2:00, not at the end of the play. That is the
//     real rule and it is worth up to a whole play's time to whoever needs it;
//   · both teams get their breath back (😮‍💨 gas tank) and a fresh ⏳ play clock;
//   · it is NOT a timeout: nobody's three are touched.
//
// ⚠️ IT CANNOT BE FARMED: once a half, driven only by the clock; it fires whether anyone wants it
// or not, so no player can get it twice and a leader cannot decline it. And what it hands back is
// the SAME for both teams — whoever has the ball when it happens is the one it helps or hurts.
//
// Nothing is saved. This file owns the rule; main.js's tickPeriodAtBoundary() asks it.
// ============================================================
(function () {
  'use strict';

  const AT = 120;      // seconds left when the warning comes

  // Should the warning fire now? (pure)  q = quarter 1..4, quarters = 4, clock = seconds left,
  // ot = overtime, done = { 2: bool, 4: bool } of the warnings already given this game.
  function due(q, quarters, clock, ot, done) {
    if (ot) return false;
    if (q !== 2 && q !== quarters) return false;
    if (!(clock > 0) || clock > AT) return false;
    return !(done && done[q]);
  }

  window.TDTwoMin = { due, AT };
})();
