// ============================================================
// TOUCHDOWN FUN — touchback.js: 🏈 TOUCHBACK OR RETURN (Round 17, pick ③)
// ------------------------------------------------------------
// Every kickoff against you came down in exactly the same place — your returner
// on his own 8-yard line — and you ALWAYS ran it out. Real kickers boom some of
// them into the end zone, and then the returner has the oldest decision in the
// kicking game: take a knee for the touchback, or try to bring it out.
//
// Now about four kickoffs in ten sail into the end zone. While the ball is still
// falling a 🧎 TOUCHBACK button is up (the same strip, and the same idea, as the
// 🙋 FAIR CATCH on a punt). Tap it and the play is over: your ball on your own
// 25. Ignore it and you are running it out from the end zone.
//
// ⚠️ THE DECISION HAS TO BE REAL, SO THE NUMBERS ARE MEASURED. A return from the
// end zone is the same lone returner against the same seven men — but the men
// have far further to come, because a kick that reaches the end zone has
// outkicked its coverage. Simulating the real rules (they steer straight at you
// at the kickoff-coverage speed, a tackle is 15px) with a returner who picks the
// widest lane every 0.35s or every 0.15s, 2500 returns each:
//
//     coverage starts at the usual place   from the end zone: 14–19 yards   (a knee wins by 8)
//     … 60px further back                                     17–21
//     … 100px further back                                    20–22
//     … 140px further back                                    22–25          (about even)
//     … for comparison, from the usual start of a NORMAL kick, the same two
//       returners come out at 21–24
//
// So `OUTKICK_PX` is 130: an ordinary returner who runs it out does a little worse
// than the 25 he could have had for free, a good one does about as well, and every
// one of them gets the variance — a long one, or a tackle on the 12. That is a
// decision. (At 0 the knee would simply always be right.) A touchback is 25, the
// same as the one your OWN booming kick gives them (fieldpos.js).
//
// ⚠️ TACKLED INSIDE THE END ZONE ON A KICKOFF IS A TOUCHBACK, NOT A SAFETY. The
// kick put the ball there, and real football gives you the 25. (`endKickoffReturn`
// used to clamp that to the 1-yard line.)
//
// Nothing is saved. This file owns the roll, the numbers and the button; main.js's
// `startKickoff()` places the returner and the coverage and ends the play.
// ============================================================
(function () {
  'use strict';

  const $ = id => document.getElementById(id);

  const P_DEEP = 0.38;               // the share of their kickoffs that reach the end zone
  const DEPTH_MIN = 1, DEPTH_MAX = 8;  // yards deep in the end zone the ball is caught
  const OUTKICK_PX = 130;            // how much further back the coverage starts on a deep kick (see the table above)
  const TB_SPOT = 25;                // a touchback: your own 25 (fieldpos.js's TB_KICKOFF)

  // ---- the roll (pure, so every case can be checked without a game) ---------------
  // Returns { deep: false } or { deep: true, depth } (yards inside the end zone).
  function roll(rnd) {
    rnd = rnd || Math.random;
    if (rnd() >= P_DEEP) return { deep: false, depth: 0 };
    const depth = DEPTH_MIN + Math.floor(rnd() * (DEPTH_MAX - DEPTH_MIN + 1));
    return { deep: true, depth };
  }

  // ---- the button ---------------------------------------------------------------
  let taken = false, onTake = null;
  function show(fn) { taken = false; onTake = fn || null; const b = $('btn-touchback'); if (b) b.style.display = 'flex'; }
  function hide() { const b = $('btn-touchback'); if (b) b.style.display = 'none'; }
  function take() {
    if (taken) return;
    taken = true;
    hide();
    if (onTake) onTake();
  }
  const isTaken = () => taken;
  function setup() {
    const b = $('btn-touchback');
    if (b) b.addEventListener('pointerdown', e => { e.preventDefault(); take(); });
    hide();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup);
  else setup();

  window.TDTouchback = { roll, show, hide, take, isTaken, P_DEEP, DEPTH_MIN, DEPTH_MAX, OUTKICK_PX, TB_SPOT };
})();
