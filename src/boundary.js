// ============================================================
// TOUCHDOWN FUN — boundary.js: 📍 OUT OF BOUNDS (Round 18, pick ①)
// ------------------------------------------------------------
// Every runner in this game was fenced INSIDE the white line — pressing into the
// sideline just slid you along it like a wall. Nobody could ever step out, so the
// clock never stopped for a run and the sideline was not a place anything could
// happen.
//
// Now the white line is a line. Keep pushing toward it for a beat (a brush of the
// edge is not enough) and the ball carrier steps out: the play is over right there,
// spotted where he left the field.
//
// ⚠️ THE CLOCK IS THE REAL RULE, NOT A FREE STOP. In the NFL an out-of-bounds play
// stops the clock until the snap, which saves a huddle's worth of time — and in the
// last two minutes of each half the clock stays stopped. This game charges 32s for
// a run (the play AND the huddle) and 12s for an incomplete. So stepping out saves
// those 20 seconds ONLY in the last 2:00 of the 2nd and 4th quarters (and in
// overtime). Early in a half it is just a play that ended at the sideline, and it
// can never be farmed for free time.
//
// ⚠️ WHAT COUNTS AS "PUSHING": the stick/arrow toward the edge, or a swipe dash that
// heads there. Standing next to the wall without pushing does nothing, so a runner
// can still hug the sideline up the field. The player has to MEAN it for 0.16s.
//
// Nothing is saved. main.js asks `push()` once a frame and calls `endPlay('tackle')`.
// ============================================================
(function () {
  'use strict';

  const EDGE    = 30;     // px from either edge where "at the line" begins (measured: a runner's body stops dead at x = 20, so this is "leaning on the wall")
  const PUSH_MS = 90;     // how long a runner must keep pushing out (was 160: on a phone it felt like the wall was still there)
  const WINDOW  = 120;    // seconds left in the 2nd / 4th quarter when the clock stays stopped

  let held = 0;           // ms of continuous push

  // x: the carrier's x. dir: -1 pushing left, +1 pushing right, 0 not pushing. dt: ms this frame.
  // Returns true on the frame he steps out.
  function push(x, dir, dt, width) {
    const atLeft = x <= EDGE, atRight = x >= width - EDGE;
    if (!((atLeft && dir < 0) || (atRight && dir > 0))) { held = 0; return false; }
    held += Math.min(dt, 60);                         // a stalled tab must not count as a long push
    return held >= PUSH_MS;
  }

  function reset() { held = 0; }

  // Does stepping out stop the clock right now? (pure: quarter, quarters, clock secs, overtime)
  function stopsClock(quarter, quarters, clock, overtime) {
    if (overtime) return true;
    if (quarter !== 2 && quarter !== quarters) return false;
    return clock > 0 && clock <= WINDOW;
  }

  window.TDBounds = { push, reset, stopsClock, EDGE, PUSH_MS, WINDOW };
})();
