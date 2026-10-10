// ============================================================
// TOUCHDOWN FUN — hailmary.js: 🙏 THE HAIL MARY (Round 16, pick ⑧)
// ------------------------------------------------------------
// Four seconds left, down four, eighty yards from the end zone. Every quarterback who
// ever lived has thrown this ball. The game let the clock run out and said GAME OVER —
// on the last play of a half or a game it was the same play as every other: the same
// buttons, the same routes, the same ordinary tackle at the end.
//
// A Hail Mary is a DIFFERENT PLAY. Everybody runs for the end zone, the quarterback
// stands back and heaves it as far as he can, and the ending is a pile of players under
// a falling ball. So on the very last snap of a half — or of a game you are losing by a
// score or less — a 🙏 HAIL MARY button appears next to ⚡ POWER-UPS. Tap it and the
// whole play is a short film: the snap, the receivers streaking, the defenders
// collapsing on the same spot, the ball hanging in the air for a long, long time — and
// then the pile, which is the SAME timing moment as 🙌 JUMP BALL (v4.36): a football
// drifts toward the receiver's hands and you tap as it gets there.
//
// ⚠️ IT HAS TO BE RARE, DRAMATIC AND GENUINELY LONG ODDS. Rare because it only exists on
// the last play of a period — never plan A, only the last thing you try (a deficit of
// more than a score, a lead, a tie, a half that is not ending, overtime, a stopped clock
// that makes it not the last play: none of them get the button). Long odds because a real
// one works about one time in ten:
//
//     🙌 right at his hands   24%    ×  how far away you are (1.0 inside 45 yards,
//     👏 close                10%       sliding to 0.45 at 95 yards: the ball
//     ✋ too early / too late  4%       really does die in the air from your own 5)
//
// A catch is a TOUCHDOWN, in the end zone, with the receiver under it. A miss is a ball
// knocked down in the pile (75%) or picked off for a touchback (25%).
//
// ⚠️ IT IS NOT A SHORTCUT AND IT MUST NOT BE A BETTER PLAY THAN THE NORMAL ONE. The button
// is only there when the normal ending is also "the clock runs out". Touchdown chance by how
// you tap (pure simulation of the panel's own numbers, DEVLOG v4.37), 45 / 60 / 80 / 95 yards out:
//     never taps        4.0   3.3   2.5   2.1 %
//     mashing           10.3  8.9   6.4   4.6 %
//     an ordinary thumb 15.9  13.4  9.4   7.2 %      (v4.28's "40% green / 30% close / 30% miss"
//     careful           20.7  17.3  12.7  9.3 %       thumb, at 60 yards: 11.5%, about one in nine)
//     perfect timing    24.1  20.0  14.5  10.8 %
// The perks that make a receiver catch more (gloves, Sure Hands, a hot hand) count, but at a third
// of their strength and as a SCALE, not an add-on (they widen the green zone and lift the odds by up
// to about a quarter: an ordinary thumb at 60 yards goes 13.5% → 19% in full gear). The first cut added
// them to every grade, which nearly doubled the odds, because 24% is a small number to add 10% to.
// This ball is mostly luck, and a shop upgrade should not turn a prayer into a play.
//
// ⚠️ `advise()` IS A PURE FUNCTION of a plain context object — exactly like
// `TDClock.advise()` — so every score / clock / down / distance combination can be swept
// in one loop. (The first draft of v3.1's and v4.0's judgement helpers each shipped one
// branch that did not implement its own comment; sweeping is how those were found.)
//
// Nothing is saved. This file owns the rules and the one button; main.js's `hailMary()`
// stages the play and `endPlay` finishes it.
// ============================================================
(function () {
  'use strict';

  const $ = id => document.getElementById(id);
  const clamp = (v, lo, hi) => v < lo ? lo : v > hi ? hi : v;

  const FINAL_CLOCK = 12;     // seconds: the shortest play the clock allows is an incomplete pass (12s), so any snap from here on is the LAST one
  const MIN_DIST = 25;        // yards to the end zone: closer than this you just play football
  const MAX_DEFICIT = 8;      // in the last period you must be behind by a touchdown and a two-point try or less
  const SUCCESS = { green: 0.24, yellow: 0.10, early: 0.04, late: 0.04 };   // the win-chance table handed to TDJump
  const PERK_SHARE = 0.35;    // gloves / Sure Hands / a hot hand count at 35% of their strength: it is a prayer, not a play
  const PICK_OF_MISS = 0.25;  // of the balls that are not caught, this share are picked off (a touchback); the rest are knocked down

  // How much the distance saps the odds: nothing inside 45 yards, down to 45% at 95 yards.
  function factorFor(dist) { return clamp(1 - Math.max(0, dist - 45) / 50 * 0.55, 0.45, 1); }

  // ---- the thinking ------------------------------------------------------
  // ctx = { down, quarter, quarters, clock, my, opp, spot, overtime, stopped, twoPt }
  //   spot     your own-goal yard line (0…100): how far you have come, so the end zone is 100 − spot away
  //   stopped  a timeout froze the clock for THIS play — it will not burn a second, so it is not the last play
  // Returns null (no Hail Mary is worth throwing) or { kind, dist, factor, hint }.
  function advise(ctx) {
    const c = ctx || {};
    // 0. sudden death, a two-point try and a stopped clock are all "this is not the last play"
    if (c.overtime || c.twoPt || c.stopped) return null;
    // 1. the LAST snap of the period: the clock cannot survive another play
    const clock = c.clock || 0;
    if (!(clock > 0 && clock <= FINAL_CLOCK)) return null;
    // 2. only a period whose ending decides something: the half, or the game
    const quarters = c.quarters || 4;
    const lastPeriod = (c.quarter >= quarters);
    const halfEnd = (c.quarter * 2 === quarters);
    if (!lastPeriod && !halfEnd) return null;
    // 3. at the end of the GAME a touchdown has to be able to change the ending: behind by 1…8.
    //    (At the end of the half any score helps, so there is no condition.)
    const behind = (c.opp | 0) - (c.my | 0);
    if (lastPeriod && !(behind >= 1 && behind <= MAX_DEFICIT)) return null;
    // 4. far enough away that it is a heave and not a handoff
    const dist = 100 - (c.spot | 0);
    if (dist < MIN_DIST || dist > 99) return null;
    return { kind: 'hail', dist, factor: factorFor(dist), hint: lastPeriod ? 'Last play — one prayer.' : 'Last play of the half — one prayer.' };
  }

  // ---- the button --------------------------------------------------------
  let current = null;      // the play the button is currently offering
  let onCall = null;       // main.js's "do it" handler

  function update(ctx) {
    const b = $('btn-hail');
    current = ctx ? advise(ctx) : null;
    if (!b) return;
    if (!current) { b.style.display = 'none'; return; }
    b.style.display = 'flex';
    b.title = current.hint;
  }
  function hide() { update(null); }
  function now() { return current; }

  function fire() {
    if (!current || !onCall) return;
    const play = current;
    hide();
    onCall(play);
  }

  function setup(fn) {
    onCall = fn;
    const b = $('btn-hail');
    if (b) b.addEventListener('pointerdown', e => { e.preventDefault(); fire(); });
    hide();
  }

  window.TDHail = {
    advise, update, hide, setup, now, fire,
    factorFor, SUCCESS, PERK_SHARE, PICK_OF_MISS, FINAL_CLOCK, MIN_DIST, MAX_DEFICIT,
  };
})();
