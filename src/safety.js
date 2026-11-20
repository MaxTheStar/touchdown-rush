// ============================================================
// TOUCHDOWN FUN — safety.js: 🛑 INTENTIONAL SAFETY (Round 27, pick ①)  window.TDSafety
// ------------------------------------------------------------
// A safety only ever happened TO you. Real teams protecting a small lead late, pinned deep on 4th down, sometimes take one on purpose:
// give up 2 points, burn the clock, and then FREE KICK the ball away from your own 20 instead of punting from your end zone.
// A "③ 🛑 TAKE A SAFETY" button shows on the 4th-down panel ONLY when it is a smart call, all of these at once:
//   · the 4th quarter (the last period), 2:00 or less on the clock   · the ball inside your own 10   · you lead by 3 to 8 points
// (a 3-point lead survives the 2 points as a 1-point lead; a lead of 9+ needs no gift, and under 3 the safety would hand them the lead).
// ⚠️ It reuses the real safety path (+2 to them, the free kick from your own 20, `G.kickFrom = 20`), so there is no second rule to drift.
// ⚠️ It can never cost you the lead: the offer needs `lead - 2 >= 1`. Nothing is saved. main.js: `takeIntentionalSafety()` + the panel button.
// ============================================================
(function () {
  'use strict';
  const MAX_SPOT = 10, MAX_CLOCK = 120, MIN_LEAD = 3, MAX_LEAD = 8;
  // pure: should the button show?  ctx = { spot (yds from own goal), quarter, numQuarters, clock (secs), my, opp }
  function offered(c) {
    if (!c) return false;
    if (c.quarter < c.numQuarters) return false;
    if (!(c.clock <= MAX_CLOCK)) return false;
    if (!(c.spot <= MAX_SPOT)) return false;
    const lead = c.my - c.opp;
    return lead >= MIN_LEAD && lead <= MAX_LEAD;
  }
  window.TDSafety = { offered, MAX_SPOT, MAX_CLOCK, MIN_LEAD, MAX_LEAD };
})();
