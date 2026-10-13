// ============================================================
// TOUCHDOWN FUN — handsteam.js: 🙌 THE HANDS TEAM (Round 17, pick ⑧)
// ------------------------------------------------------------
// Down by a score with the clock running out, the other team scores — and then kicks off
// like it is the first quarter: the same deep boot, the same return, nothing at stake.
// Every real team in that spot does the same thing instead: it TRIES TO GET THE BALL BACK
// with an onside kick. You have had the onside kick since v1.x (and a real scramble for it
// since v4.20); the computer never had one, so the best moment a receiving team gets — a
// short kick that bounces somewhere unpredictable while eleven men sprint at it — was skipped.
//
// Now when the other team scores in the last period, with a couple of minutes left, and is
// STILL behind by a score or less (1 to 8 points: one more touchdown could tie or win it),
// it tries the onside kick. The field holds still for the bounce, then it is the very same
// loose-ball race v4.20 built for your own onside kick (`'loose'`, shared with the muffed
// punt, the dropped pitch and the fumble), with you on the receiving end: you steer your
// hands man with the arrows or the D-pad, their three nearest men run at the ball after a
// beat, and whoever reaches it first falls on it. Win it and it is your ball where it ended
// up; lose it and it is theirs, there, and you are back on defense.
//
// ⚠️ IT IS RARE ON PURPOSE. It only exists in the last period (never in overtime, never
// before the last two minutes), only after THEIR score, only when they are still one score
// behind (a team that is losing by 20 does not gamble on a kick that, if it works, still
// leaves it losing). `advise()` is a pure function of a plain context, so every combination
// can be swept in one loop.
//
// ⚠️ IT HAS TO BE A RACE YOU CAN WIN AND CANNOT WIN BY STANDING STILL. Same rule as every
// loose ball since v4.8: a player who stands still must never win it for free, and a player
// who goes for it must usually win it. The receiving team starts a little farther from the
// landing than a real hands team would so that it is not an automatic win, and was measured
// in a pure simulation of the race (the game's own constants: 205 px/s for you, `koCover`
// 180 / 198 / 214 for them, 26 px to fall on it, three chasers, a 0.30s read, a squirt of
// 30–70 px in ANY direction, the ball coming down 110–130 px past the tee):
//
//                                    easy    medium   hard
//     goes straight for it at once    77%     74%     71%
//     a typical 0.15s read + wobble   62%     57%     55%
//     moves 0.2s late                 60%     54%     51%
//     moves 0.4s late                 45%     41%     36%
//     stands still                     0%      0%      0%
//
// So an ordinary player wins a bit more often than not — an onside kick is a gamble for the
// team that kicks it, and a receiving team that goes for the ball wins about three times in
// four, which is about what real hands teams do. (Surprise onside kicks are the exception;
// this one is announced, and that is on purpose: a nine-year-old can see what is coming.)
//
// Nothing is saved. This file owns the rule and the layout; main.js's `startCpuOnside()`
// puts the men on the field and the v4.20 scramble does everything else.
// ============================================================
(function () {
  'use strict';

  const clamp = (v, lo, hi) => v < lo ? lo : v > hi ? hi : v;
  const rnd = (a, b) => a + Math.random() * (b - a);

  const LATE_CLOCK = 120;       // seconds left in the last period: "a couple of minutes" of a 2:30 quarter
  const MAX_DEFICIT = 8;        // still behind by a touchdown and a two-point try or less (the same number as the Hail Mary)
  const REACT_MS = 300;         // their kicking team needs a beat to read the bounce

  // The geometry (px; 10px = 1 yard; the tee is their own 35, so the ball comes DOWN the screen toward your goal).
  const LAND = [110, 130];      // the ball first comes down this far from the tee
  const SQUIRT = [30, 70];      // …and then squirts this far in any direction
  const MINE_BACK = [110, 160]; // your hands man waits this far past the landing, toward your own goal
  const FIELD_W = 533;

  // Should the computer try an onside kick? ctx = { quarter, quarters, clock, my, opp, overtime } from ITS side: `my` is
  // its score (after the score that just happened) and `opp` is yours. Returns null or { kind: 'onside', behind }.
  function advise(ctx) {
    const c = ctx || {};
    if (c.overtime) return null;                                   // sudden death: there is no "kicking it back" to gamble on
    const quarters = c.quarters || 4;
    if (!(c.quarter >= quarters)) return null;                     // only the last period
    const clock = c.clock || 0;
    if (!(clock > 0 && clock <= LATE_CLOCK)) return null;          // late — and with a game left to play (a score at 0:00 ends it)
    const behind = (c.opp | 0) - (c.my | 0);
    if (!(behind >= 1 && behind <= MAX_DEFICIT)) return null;      // still down by a score or less
    return { kind: 'onside', behind };
  }

  // The picture at the kick. `teeY` is the screen y of the tee. Returns the ball's three points (tee → first landing → where it ends up),
  // your hands man, and the kicking team's line of seven (the first is the kicker).
  function layout(teeY) {
    const kx = FIELD_W / 2;
    const lx = clamp(kx + rnd(-60, 60), 80, FIELD_W - 80);
    const ly = teeY + rnd(LAND[0], LAND[1]);
    const ang = Math.random() * Math.PI * 2;                       // ANY direction, like a real onside bounce
    const far = rnd(SQUIRT[0], SQUIRT[1]);
    const fx = clamp(lx + Math.cos(ang) * far, 20, FIELD_W - 20);
    const fy = clamp(ly + Math.sin(ang) * far, 140, 1090);
    const mine = { x: clamp(lx + rnd(-25, 25), 20, FIELD_W - 20), y: ly + rnd(MINE_BACK[0], MINE_BACK[1]) };
    const line = [];
    for (let i = 0; i < 7; i++) line.push({ x: clamp(60 + i * 68 + rnd(-15, 15), 20, FIELD_W - 20), y: teeY - rnd(0, 30) });
    return { kx, tee: { x: kx, y: teeY }, land: { x: lx, y: ly }, rest: { x: fx, y: fy }, mine, line };
  }

  window.TDHands = { advise, layout, REACT_MS, LATE_CLOCK, MAX_DEFICIT, LAND, SQUIRT, MINE_BACK };
})();
