// ============================================================
// TOUCHDOWN FUN — hurdle.js: 🦘 THE HURDLE (Round 23, pick ①)
// ------------------------------------------------------------
// The 🪄 juke beats a man who is coming at you from the SIDE. It does nothing about the one standing
// right in front of you, low and ready to take your legs. Real backs jump that man and keep running.
// When a tackler is dead AHEAD (not off to a side), a 🦘 HURDLE button is up. Timing is the whole
// thing, same as the juke, but the window is tighter and the price of missing is higher:
//
//     too early (35–44px)   40%   he sees you leave the ground
//     right on  (22–34px)   80%   you are over him before he can drive
//     too late  (16–21px)   25%   he already has your legs
//
// ⚠️ WIN: you hop 40px forward over him, he is down for 0.5s, and nobody can tackle you for 0.5s.
// ⚠️ LOSE: you left your feet for nothing — a stumble (30% speed, 0.4s) AND the hit that follows is
//          three times as likely to knock the ball loose (the juke's miss is twice).
// ⚠️ It shares the juke's "ONE move a play" flag, so the two can never stack, and they learn: every
//    hurdle already tried this possession multiplies the chance by 0.8.
//
// Nothing is saved. This file owns the table; main.js runs the move.
// ============================================================
(function () {
  'use strict';
  const MIN_PX = 16, MAX_PX = 44, WIDE_PX = 26;   // WIDE_PX: how far off to the side still counts as "in front"
  const LEARN = 0.8;
  // is this man dead ahead? dx sideways, dy = how far ahead (positive = ahead of the runner)
  function inFront(dx, dy) { return dy > 0 && Math.abs(dx) <= WIDE_PX; }
  // chance by the defender's distance (pure)
  function chance(d, uses) {
    if (!(d >= MIN_PX && d <= MAX_PX)) return 0;
    const base = d <= 21 ? 0.25 : d <= 34 ? 0.80 : 0.40;
    return base * Math.pow(LEARN, Math.max(0, uses | 0));
  }
  window.TDHurdle = { chance, inFront, MIN_PX, MAX_PX, WIDE_PX, LEARN, HOP_PX: 40, STUN_MS: 500, FREE_MS: 500, TRIP_MS: 400, FUMBLE_X: 3 };
})();
