// ============================================================
// TOUCHDOWN FUN — sneak.js: 🐢 THE QB SNEAK (Round 19, pick ①)
// ------------------------------------------------------------
// Fourth and one on their 2-yard line, and the only choices were a hand-off the whole
// defense is waiting for or a field goal. Real teams hand the ball to the quarterback
// and push. It is the best play in football for the last yard and a bad one for the
// last two, and that is the whole point of it.
//
// When you are within 2½ yards of the marker (or of the goal line, whichever is
// closer) a 🐢 SNEAK button is there, before the snap and on the 4th-down panel. Press
// it and the quarterback goes under centre, the ball is snapped, and he drives
// forward. Whether the pile moves is this table, by how far he has to go:
//
//     inches (≤ ½ yd)  90%      1 yard  78%      1½  62%      2  48%      2½  36%
//
// EASY adds 8 points and HARD takes 8 away (the same dial every other roll uses).
//
// ⚠️ IT IS A GOOD BET FROM INCHES AND A BAD ONE FROM TWO YARDS, so it does not make
// the fourth-down decision or the field goal pointless: from 2 yards out, kicking the
// field goal is still better than a coin flip at six points.
// ⚠️ A PILE FUMBLES: 3% of sneaks (the ball is stripped in the pile), through the
// game's own fumble scramble. Success moves the ball to the marker (or the goal line:
// a touchdown); failure leaves it where it was, a down used. Nothing else changes.
//
// Nothing is saved. This file owns the table and the button; main.js's sneak() runs the play.
// ============================================================
(function () {
  'use strict';

  const $ = id => document.getElementById(id);
  const MAX_TOGO = 2.5;      // yards: farther than this and it is not a sneak
  const FUMBLE = 0.03;
  const TABLE = [[0.5, 0.90], [1.0, 0.78], [1.5, 0.62], [2.0, 0.48], [2.5, 0.36]];

  // Yards still to go: to the marker, or to the goal line if that is closer.
  function togo(losYards, firstDownYards) {
    return Math.min(firstDownYards - losYards, 100 - losYards);
  }

  // The chance the pile moves (pure). `diffAdj` = +0.08 on easy, −0.08 on hard.
  function chance(d, diffAdj) {
    if (!(d > 0)) return 0.95;                         // already there
    if (d > MAX_TOGO) return 0;
    let p = TABLE[TABLE.length - 1][1];
    for (const [yd, pr] of TABLE) { if (d <= yd) { p = pr; break; } }
    return Math.max(0.05, Math.min(0.97, p + (diffAdj || 0)));
  }

  const available = (losYards, firstDownYards) => { const d = togo(losYards, firstDownYards); return d <= MAX_TOGO; };

  // The button before the snap (the 4th-down panel has its own).
  function paint(show) {
    const b = $('btn-sneak'); if (b) b.style.display = show ? 'flex' : 'none';
  }

  window.TDSneak = { chance, togo, available, paint, MAX_TOGO, FUMBLE, TABLE };
})();
