// ============================================================
// TOUCHDOWN FUN — juke.js: 🪄 THE JUKE (Round 20, pick ⑥)
// ------------------------------------------------------------
// A swipe cuts your runner. It never BEATS a defender: he just tackles you where you end up.
// Real runners juke a man out of his shoes. When a tackler is closing on the man with the ball, a
// 🪄 JUKE button is up. TIMING IS THE WHOLE THING — how far away he is when you press:
//
//     too early (47–60px)   45%   he has time to adjust
//     right on  (25–46px)   85%   he is committed — he goes by
//     too late  (16–24px)   30%   he already has you
//
// ⚠️ WIN: he is stunned for 0.7s (8% speed), you slide 34px away from him and nobody can tackle you for 0.4s.
// ⚠️ LOSE: you stumble (30% speed for 0.35s) AND the tackle that follows is twice as likely to knock the ball loose.
// ⚠️ ONE a play, and THEY LEARN: every juke already tried this possession multiplies the chance by 0.75.
//
// Nothing is saved. This file owns the table; main.js runs the move.
// ============================================================
(function () {
  'use strict';
  const MIN_PX = 16, MAX_PX = 60;
  const LEARN = 0.75;
  // chance by the defender's distance (pure)
  function chance(d, uses) {
    if (!(d >= MIN_PX && d <= MAX_PX)) return 0;
    const base = d <= 24 ? 0.30 : d <= 46 ? 0.85 : 0.45;
    return base * Math.pow(LEARN, Math.max(0, uses | 0));
  }
  window.TDJuke = { chance, MIN_PX, MAX_PX, LEARN, STUN_MS: 700, SLIDE_PX: 34, FREE_MS: 400, TRIP_MS: 350, TRIP_KEEPS: 0.3, FUMBLE_X: 2 };
})();
