// ============================================================
// TOUCHDOWN FUN — swim.js: 🏊 THE SWIM MOVE (Round 20, pick ⑧)
// ------------------------------------------------------------
// On defense you tap to continue while the other team throws the ball. The pass rush is the
// most common play there is and you never got to rush. Inside the computer's pass play the
// SACK was one line: `Math.random() < 0.10 + …`.
//
// Now, when the rush gets a step the field holds still and the same timing panel as 💥 THE
// SHOESTRING TACKLE and 🙌 FALL ON IT drops in: a lineman is past his blocker and you tap as
// you swim over the top.
//
//     🏊 right on it   80%   you get to the quarterback — a SACK
//     👏 close         55%
//     ✋ early / late  30%   he steps up and gets the ball off — the pass is complete
//
// ⚠️ IT REPLACES THE SACK ROLL, IT DOES NOT ADD ONE. An ordinary thumb (40% on target / 30% close /
// 30% off) wins 57.5%, so the moment comes up 1/0.575 = 1.74× as often as a sack used to happen: the
// sack rate for an ordinary thumb is exactly what it was. A perfect tapper gets 1.39× the sacks, a
// player who never taps 0.52×. A lost moment is the ordinary completion the play would have been
// (never a dead down: DEVLOG v4.43 — a wasted down costs a drive far more than its yards).
// 🔥 A blitz you called, your defense and the weather all go into the same sack number, so they are
// worth what they were.
//
// Nothing is saved. This file owns the table; main.js builds the two endings and starts the moment.
// ============================================================
(function () {
  'use strict';
  const TABLE = { green: 0.80, yellow: 0.55, early: 0.30, late: 0.30 };
  const ORDINARY = 0.4 * TABLE.green + 0.3 * TABLE.yellow + 0.3 * TABLE.late;     // 0.575
  const FREQ = 1 / ORDINARY;
  const ready = () => !!window.TDJump;
  function begin(done) {
    if (!window.TDJump) return false;
    const opts = { title: '🏊 SWIM MOVE!', sub: 'You are past your man! Tap as you swim over the top.', winText: '🏊 YOU GOT HIM!',
      success: TABLE, icon: '🏊', mult: 1, bonus: 0 };
    try { return !!TDJump.begin(opts, won => { try { done && done(!!won); } catch (e) { console.error(e); } }); }
    catch (e) { console.error(e); return false; }
  }
  window.TDSwim = { begin, ready, TABLE, ORDINARY, FREQ };
})();
