// ============================================================
// TOUCHDOWN FUN — lob.js: 🏹 BULLET OR LOB (Round 19, pick ③)
// ------------------------------------------------------------
// Every pass was the same speed on the same flat line. Real quarterbacks pick: fire a
// BULLET into a tight window, or LOB one over a linebacker.
//
// Your ordinary throw is the BULLET (it is exactly the throw the game always had: fast,
// flat, 520 px/s). New: a 🏹 LOB button, up while you could throw. Tap it and your NEXT
// throw is a lob:
//
//   · it flies slow (360 px/s against 520) and HIGH — the ball swells as it goes up;
//   · it clears the front seven: when the lob comes down, only the defensive BACKS can
//     contest it (a linebacker or a lineman underneath cannot reach a ball that high);
//   · but it HANGS — it takes ~45% longer to arrive, the backs get to it from further away
//     (their break-on-the-ball reach is ×1.25), and a lob is a little harder to place
//     (the usual bad-throw chance ×1.4).
//
// So a lob is the throw for a receiver a linebacker is on top of, and a poor one for a
// receiver a safety is waiting for. Nothing is a free upgrade.
//
// Nothing is saved. This file owns the numbers and the button; main.js's throwTo() flies the ball.
// ============================================================
(function () {
  'use strict';

  const $ = id => document.getElementById(id);
  const SPEED = 360;          // px/s (the bullet is 520)
  const REACH = 1.25;         // the defensive backs' break-on-the-ball reach
  const BAD   = 1.4;          // the bad-throw chance, multiplied
  const MIN_MS = 380;         // even a short lob takes this long

  // Which defenders can contest a lob that has come down? (pure: roles in, roles out)
  const canContest = role => role === 'DB';

  function paint(show, armed) {
    const b = $('btn-lob'); if (!b) return;
    b.style.display = show ? 'flex' : 'none';
    b.classList.toggle('armed', !!armed);
    const small = b.querySelector('small'); if (small) small.textContent = armed ? 'LOB ✓' : 'LOB';
  }

  window.TDLob = { SPEED, REACH, BAD, MIN_MS, canContest, paint };
})();
