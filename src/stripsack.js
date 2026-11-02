// ============================================================
// TOUCHDOWN FUN — stripsack.js: 💥 STRIP-SACK (Round 24, pick ③)
// ------------------------------------------------------------
// A sack already carried the ordinary 12% fumble roll (the tackle code does not care who has the
// ball). Real rushers go for the ball, and the longer a quarterback holds it the more of them get there.
// A quarterback tackled with the ball more than FREE_S seconds after the snap now coughs it up
// more often: ×1 up to FREE_S, rising linearly to ×MAX_X at FULL_S and staying there.
//
// ⚠️ A NORMAL SACK IS UNTOUCHED: a QB who stands still is sacked at about 0.93s (0.78s on a
// 🌀 stunt), well inside FREE_S, so the fumbles per game for a quarterback who throws on time do
// not move at all. Only a scrambler who holds it past 1.5s pays, and only a QB (not a runner).
// Nothing is saved. main.js multiplies the fumble chance by `TDStripSack.mult(heldMs, isQB)` in checkTackle.
// ============================================================
(function () {
  'use strict';
  const FREE_S = 1.5, FULL_S = 3.5, MAX_X = 2.0;
  function mult(heldMs, isQB) {
    if (!isQB || !isFinite(heldMs)) return 1;   // (a missing snap time must never turn the fumble chance into NaN)
    const s = heldMs / 1000;
    if (s <= FREE_S) return 1;
    return 1 + (MAX_X - 1) * Math.min(1, (s - FREE_S) / (FULL_S - FREE_S));
  }
  window.TDStripSack = { FREE_S, FULL_S, MAX_X, mult };
})();
