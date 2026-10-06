// ============================================================
// TOUCHDOWN FUN — fieldpos.js: 🦶 PUNTS THAT MATTER (Round 15, pick ③)
// ------------------------------------------------------------
// You punt it 54 yards and the banner says NICE PUNT. Then the other team
// starts at its own 25 anyway.
//
// ⚠️ THAT WAS A BUG IN DISGUISE, in the same family as the field goal that could
// not miss (v4.14). `puntYards` was used for exactly one thing — the banner —
// and every drive the computer started after a punt began at its own 25, so a
// 20-yard shank and a 70-yard bomb were the SAME punt. A missed or blocked field
// goal of yours had the same hole: the ball went to them at the 25 whether you
// kicked from your own 40 or from the 5.
//
// Now the kick decides where they start, the way it does in real football:
//
//   🦶 A PUNT lands `puntYards` past the line of scrimmage.
//        into the end zone  → TOUCHBACK, they start at their 20
//        otherwise          → they start where it landed, plus whatever the
//                             returner can make of it (or a FAIR CATCH, which is
//                             likelier the deeper it lands — nobody returns a
//                             ball at the 4)
//   🚫 A BLOCKED kick is a loose ball, so they take it where it was kicked.
//   ❌ A MISSED field goal is theirs where it was kicked from — but never worse
//        than their own 20, the real rule.
//
// ⚠️ THE KICKER'S LEG MATTERS HERE TOO. v4.17 gave you a kicker and had to leave
// punts alone, because a leg rating on a number that only drew a banner would
// have been pretending. Now it adds up to ±5 yards of punt, and the yards count.
//
// This file is pure maths (so every number can be checked without playing a
// down); main.js's onKickDone asks it where the next drive starts and hands the
// answer to `startCpuDrive` through G.turnoverSpotCpu, the door a turnover
// already uses. Nothing is saved.
// ============================================================
(function () {
  'use strict';

  const clamp = (v, lo, hi) => v < lo ? lo : v > hi ? hi : v;
  const TOUCHBACK = 20;       // where they start after a touchback
  const KICK_BACK = 7;        // the holder / punter stands about 7 yards behind the line
  const rint = (lo, hi, rnd) => lo + Math.floor(rnd() * (hi - lo + 1));

  // How likely is a fair catch? Deeper = likelier: a returner at his own 4 takes
  // the ball and waves for it.
  function fairCatchChance(theirSpot) {
    if (theirSpot <= 10) return 0.60;
    if (theirSpot <= 20) return 0.40;
    return 0.25;
  }

  // The returner's yards on a ball he does run back. Mostly a handful; now and
  // then a real chunk (but never a touchdown — the cap in afterPunt sees to that).
  function returnYards(rnd) {
    return rnd() < 0.05 ? rint(20, 38, rnd) : rint(1, 13, rnd);
  }

  // Where does THEIR drive start after you punt?
  //   losYards  yards from YOUR goal line where the ball was snapped
  //   yards     how far the punt went (the number in the banner)
  // Returns { spot, kind: 'touchback'|'fair'|'return', ret, landed, text } where
  // `spot` is in THEIR yards (distance from their own goal, 1..99).
  function afterPunt(losYards, yards, rnd) {
    rnd = rnd || Math.random;
    const landed = losYards + yards;                 // yards from MY goal where it came down
    if (landed >= 100) {
      return { spot: TOUCHBACK, kind: 'touchback', ret: 0, landed, text: 'Touchback — they start at their own 20.' };
    }
    const base = clamp(100 - landed, 1, 99);         // their yards from their goal
    if (rnd() < fairCatchChance(base)) {
      return { spot: base, kind: 'fair', ret: 0, landed, text: 'Fair catch at their own ' + base + '.' };
    }
    const ret = returnYards(rnd);
    const spot = clamp(base + ret, 1, 99);
    return { spot, kind: 'return', ret: spot - base, landed,
             text: 'Returned ' + (spot - base) + ' — they start at their own ' + spot + '.' };
  }

  // A blocked punt or field goal: the ball is loose where it was kicked.
  function afterBlock(losYards) {
    const spot = clamp(100 - (losYards - KICK_BACK), 1, 99);
    return { spot, kind: 'block', ret: 0, text: 'They take it at their own ' + spot + '.' };
  }

  // A missed field goal: spotted where it was kicked, but never inside their 20.
  function afterMiss(losYards) {
    const spot = clamp(100 - (losYards - KICK_BACK), TOUCHBACK, 99);
    return { spot, kind: 'miss', ret: 0, text: 'Their ball at their own ' + spot + '.' };
  }

  // The kicker's leg, in punt yards. 70 = average = 0; each 25 points is 6 yards.
  function legYards(leg) {
    if (!isFinite(leg)) return 0;
    return Math.round(clamp((leg - 70) / 25 * 6, -6, 6));
  }

  window.TDFieldPos = { afterPunt, afterBlock, afterMiss, legYards, fairCatchChance,
                     _consts: { TOUCHBACK, KICK_BACK } };
})();
