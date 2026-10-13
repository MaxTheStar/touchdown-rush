// ============================================================
// TOUCHDOWN FUN — slide.js: 🛝 THE QB SLIDE (Round 18, pick ②)
// ------------------------------------------------------------
// Your quarterback scrambles across the line into traffic, and the only choices
// were to keep running or to get hit. Real quarterbacks have a third one: go down
// feet first, give up the rest of the run, and keep the ball.
//
// The button exists only while it can mean something:
//   · the QB still has the ball (no hand-off, no throw) and is PAST the line of
//     scrimmage — behind it he is a passer, not a runner (and a sack is not a slide);
//   · a tackler is within CLOSE_PX — nothing to slide away from in open grass.
//
// ⚠️ IT IS A TRADE, NOT A FREE ESCAPE. A tackle pops the ball loose 12% of the time
// (18% right after a pump fake) and a loose ball is a coin-flip race. A slide cannot
// fumble, but it ends the play where he is: the yards he would have picked up before
// the hit are gone, and `GIVE_PX` makes that price explicit (see main.js slideDown()).
//
// Nothing is saved. This file owns the rule; main.js's `slideDown()` ends the play.
// ============================================================
(function () {
  'use strict';

  const CLOSE_PX = 70;     // a tackler this close is "about to hit you" (tackles happen inside 15)
  const PAST_PX  = 14;     // he must be this far across the line — a real scramble, not a sneak
  const GIVE_PX  = 0;      // yards (x10) the slide gives back: tuned by measurement, see DEVLOG

  // qb = { x, y }, losY = line of scrimmage in pixels (smaller y = further upfield),
  // defenders = [{ x, y }]. Returns { available, nearest }.
  function status(qb, losY, defenders) {
    if (!qb || losY == null) return { available: false, nearest: Infinity };
    let nearest = Infinity;
    for (const d of defenders || []) nearest = Math.min(nearest, Math.hypot(d.x - qb.x, d.y - qb.y));
    const past = qb.y <= losY - PAST_PX;
    return { available: past && nearest <= CLOSE_PX, nearest };
  }

  window.TDSlide = { status, CLOSE_PX, PAST_PX, GIVE_PX };
})();
