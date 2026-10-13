// ============================================================
// TOUCHDOWN FUN — fallon.js: 🙌 FALL ON IT (Round 17, pick ⑤)
// ------------------------------------------------------------
// When the other team fumbles, the line of text under the field map read
// "FUMBLE! You recovered it!" — every single time. A loose ball is the most
// contested object in football (the defense gets it about half the time) and on
// defense you never had to go and get it. Round 16 turned YOUR fumbles into a
// race; this is the other side of the same ball.
//
// Now a fumble is a LOOSE BALL and you play the moment — the same timing panel as
// 🙌 JUMP BALL, the tipped ball and 🛑 the goal-line stand: the ball bounces
// toward your hands and you tap as it gets there.
//
//     🙌 right at your hands    80%   you fall on it — YOUR BALL
//     👏 close                  55%
//     ✋ early / late           30%   they fall on it: the run counts as the run it was
//
// ⚠️ IT MUST NOT CHANGE HOW OFTEN YOU TAKE THE BALL AWAY (for an ordinary thumb).
// A fumble used to be a takeaway 100% of the time. If you can now lose it back, the
// fumbles have to happen MORE OFTEN by the same factor or the whole defense gets
// quietly worse: the ordinary thumb of v4.28 (40% of taps in the green, 30% close,
// 30% off) recovers 57.5%, so the chance of a fumble is multiplied by 1 / 0.575 =
// 1.74. Takeaways from fumbles are then unchanged for an ordinary player, better
// for a good one (a perfect tap recovers 80%) and worse for one who never taps
// (30%) — and Ball Hawk gear and the defence you called, which used to add fumbles
// straight into takeaways, go through the same factor so they are worth exactly
// what they were.
//
// ⚠️ AND A FAILED RECOVERY IS THE NORMAL RUN, NOT A DEAD DOWN. The first cut made it a
// 0-yard play ("they fall on it, no gain, the down is gone") and the numbers said no:
// the extra fumbles it took to keep takeaways level were ordinary runs before, and a
// wasted down costs a drive far more than its yards — over 60,000 drives their
// scoring fell from 1.387 to 1.349 points a drive (−2.7%, 2.4 standard errors), a
// quiet buff for the defense. With the lost recovery being the run it was (the same
// yards, a loss, a stuff — only the ball was on the turf for a moment) the old game
// and the new one agree exactly. Measured on the real `DefenseSim`, 80,000 drives
// each against all 32 opponents, expected-points pricing:
//
//                              takeaways/100   fumble takeaways/100   their pts/drive   margin/drive
//     old (automatic)              15.0               4.17                1.391           −0.519
//     new, ordinary thumb          14.8               4.04                1.391           −0.524   (SE 0.010)
//     (25,000 drives each, fumble takeaways per 100: never taps 2.24 · careful 4.97 · perfect 5.80)
//
// So ignoring the moment costs about two fumble takeaways in five (never all of
// them), and playing it well wins you a fifth to two fifths more.
//
// 🖐 BALL HAWK gear widens the green zone, exactly as it does for the tipped ball.
//
// Nothing is saved. This file owns the numbers and the panel text; main.js's
// `DefenseSim.play()` builds the two outcomes and `tap()` lets you decide.
// ============================================================
(function () {
  'use strict';

  const TABLE = { green: 0.80, yellow: 0.55, early: 0.30, late: 0.30 };       // the chance YOU fall on it, by timing
  // the "ordinary thumb" of v4.28: 40% of taps in the green, 30% close, 30% off
  const ORDINARY = 0.4 * TABLE.green + 0.3 * TABLE.yellow + 0.3 * TABLE.early;   // = 0.575
  const FREQ = 1 / ORDINARY;                                                   // fumbles happen this much more often to keep takeaways where they were

  // Is there anywhere to draw it? (If not, the fumble is the automatic recovery it always was.)
  const ready = () => !!window.TDJump;

  // Start the moment. `hawk` is the Ball Hawk gear (0…0.2), `done(recovered)` is called once.
  // Returns false if it could not be drawn (the caller then takes the old automatic recovery) — ⚠️ it must never throw into the
  // defense panel and leave it swallowing taps for good.
  function begin(hawk, done) {
    if (!window.TDJump) return false;
    const opts = {
      title: '🙌 FALL ON IT!',
      sub: 'The ball is loose! Tap as it gets to your hands.',
      winText: '🙌 YOU GOT IT!',
      success: TABLE,
      icon: '🙌',
      zoneBonus: hawk || 0,                    // 🖐 bigger hands, a wider green (no extra odds: the table is the table)
      perk: '🖐 Ball Hawk: your hands are bigger',
      mult: 1, bonus: 0,
    };
    try { return !!TDJump.begin(opts, won => { try { done && done(!!won); } catch (e) { console.error(e); } }); }
    catch (e) { console.error(e); return false; }
  }

  window.TDFallOn = { begin, ready, TABLE, ORDINARY, FREQ };
})();
