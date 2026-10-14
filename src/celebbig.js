// ============================================================
// TOUCHDOWN FUN — celebbig.js: 🕺 EXCESSIVE CELEBRATION (Round 20, pick ②)
// ------------------------------------------------------------
// You score and the celebration plays no matter what. Real players can go too far and
// draw a fifteen-yard penalty on the kickoff — and whether to risk it is a choice
// the game never offered.
//
// On the touchdown panel (where you pick the kick or the two-point try) there is now a
// third row: ③ 🕺 GO BIG. It is OFF each time. Turn it on and pick your try, and your
// celebration is a BIG one:
//
//   +  the crowd goes wild: 45 on the momentum meter, 15 coins and 8 XP;
//   −  but it is a 1-in-8 gamble (12%) that the officials flag it: 🟨 EXCESSIVE
//      CELEBRATION, and you kick off from your own 20 instead of your 35 — 15 yards
//      of field position, the penalty's real price.
//
// ⚠️ IT IS A FUN GAMBLE, NOT A BETTER PLAY: the flag costs about 0.9 expected points of
// field position and happens 12% of the time (about −0.1 a use), and the reward is
// coins and a few points of momentum, which are worth less (momentum's effect starts above
// 30 and tops out at ±4%). Anybody can ignore it for free. It is style with a price.
//
// Nothing is saved. This file owns the numbers; main.js's choosePAT() reads the toggle,
// rolls it and sets up the kickoff.
// ============================================================
(function () {
  'use strict';

  const FLAG = 0.12;          // the chance of a flag on a BIG celebration
  const COINS = 15, XP = 8, MOMENTUM = 45;

  // Pure: given a roll in [0,1), is it flagged?
  const flagged = r => r < FLAG;

  window.TDCelebBig = { flagged, FLAG, COINS, XP, MOMENTUM };
})();
