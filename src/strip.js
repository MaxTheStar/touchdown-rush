// ============================================================
// TOUCHDOWN FUN — strip.js: ✋ STRIP THE BALL (Round 23, pick ②)
// ------------------------------------------------------------
// On defense a fumble was a roll the game made for you: the ball came out, and the only thing left
// to decide was whether you fell on it (🙌 Fall On It, v4.43). The defender never got to GO FOR THE BALL,
// and that is the play every defender dreams of: you have the runner wrapped up and you reach in.
//
// Now the moment that used to be "a fumble" has TWO parts. First the same timing panel as 💥 THE SHOESTRING
// TACKLE and 🙌 FALL ON IT drops in: the runner is wrapped up and you tap as you rip at the ball.
//
//     ✋ right on it   75%   you tear it out — and then it is a loose ball you must fall on (the old moment)
//     👏 close         50%
//     ✋ early / late  25%   he hangs on — an ordinary run
//
// ⚠️ IT SITS IN FRONT OF THE FUMBLE, IT DOES NOT ADD ONE. An ordinary thumb (40% on target / 30% close /
// 30% off) wins 52.5%, so the strip moment comes up 1/0.525 = 1.90× as often as the "fumble" it feeds, and
// the two moments in a row multiply to exactly the old fumble takeaway rate for an ordinary thumb. A good
// thumb strips more, a player who never taps strips about half as often. A lost strip is the NORMAL RUN
// (never a dead down: DEVLOG v4.43 — a wasted down costs a drive far more than its yards).
//
// Nothing is saved. This file owns the table; main.js builds the endings and chains the moments.
// ============================================================
(function () {
  'use strict';
  const TABLE = { green: 0.75, yellow: 0.50, early: 0.25, late: 0.25 };      // the chance you rip it out, by timing
  const ORDINARY = 0.4 * TABLE.green + 0.3 * TABLE.yellow + 0.3 * TABLE.late;  // 0.525
  const FREQ = 1 / ORDINARY;
  const ready = () => !!window.TDJump;
  // Start the moment; done(stripped) once. Returns false if it could not be drawn.
  function begin(done) {
    if (!window.TDJump) return false;
    const opts = { title: '✋ STRIP IT!', sub: 'You have him wrapped up! Tap as you rip at the ball.', winText: '✋ YOU RIPPED IT OUT!',
      success: TABLE, icon: '✋', mult: 1, bonus: 0 };
    try { return !!TDJump.begin(opts, won => { try { done && done(!!won); } catch (e) { console.error(e); } }); }
    catch (e) { console.error(e); return false; }
  }
  window.TDStrip = { begin, ready, TABLE, ORDINARY, FREQ };
})();
