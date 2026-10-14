// ============================================================
// TOUCHDOWN FUN — chase.js: 💥 THE SHOESTRING TACKLE (Round 20, pick ④)
// ------------------------------------------------------------
// When the other team broke a long run you watched a line of text: "Run for 24 yards."
// The best play a defender makes is the diving tackle at the last second, and you never
// got to try it.
//
// Now when they break a run the field holds still and the same timing panel as 🙌 FALL ON IT
// and the tipped ball drops in: the runner is clear and a defender is chasing him from
// behind. A football drifts toward his hands... and you tap as he dives.
//
//     💥 right on it   75%   you get a hand on his ankle — the run is cut to a third of the gain
//     👏 close         50%
//     ✋ early / late  25%   he is gone — the whole breakaway
//
// ⚠️ IT REPLACES THE BREAKAWAY, IT DOES NOT ADD A SECOND ROLL. A "saved" run is not stopped dead:
// it still goes for the ordinary part of the run plus 35% of the breakaway part (so a 25-yard
// breakaway on top of a 5-yard run becomes 5 + 9 = 14, not 5). That keeps a miss exactly as
// bad as the old game and a hit a real stop that is still a good play for them.
// ⚠️ AND IT HAS TO BE NEUTRAL FOR AN AVERAGE THUMB: an ordinary thumb (40% on target, 30% close,
// 30% off — the one every moment is tuned to) saves 52.5%, which takes ~34% off a breakaway's extra
// yards, so breakaways are made 1.52× as common. Net yards for an ordinary thumb: unchanged;
// a good thumb saves more, a player who never taps loses a little less than the yards (a miss
// is the old breakaway). Measured over thousands of drives of the real DefenseSim (DEVLOG v4.67).
//
// Nothing is saved. This file owns the table; main.js's DefenseSim builds the breakaway and
// starts the moment.
// ============================================================
(function () {
  'use strict';

  const TABLE = { green: 0.75, yellow: 0.50, early: 0.25, late: 0.25 };   // the chance you bring him down, by timing
  const ORDINARY = 0.4 * TABLE.green + 0.3 * TABLE.yellow + 0.3 * TABLE.late;     // 0.525
  const KEEP = 0.35;             // a saved run keeps this share of the breakaway's extra yards
  const FREQ = 1 / (1 - (1 - KEEP) * ORDINARY);   // breakaways are this many times as common, to keep an ordinary thumb neutral

  const ready = () => !!window.TDJump;

  // Start the moment; done(saved) once. Returns false if it could not be drawn (the caller then plays the breakaway).
  function begin(done) {
    if (!window.TDJump) return false;
    const opts = {
      title: '💥 BREAKAWAY!',
      sub: 'He is clear! Tap as you dive for his ankles.',
      winText: '💥 YOU GOT A HAND ON HIM!',
      success: TABLE,
      icon: '💥',
      mult: 1, bonus: 0,
    };
    try { return !!TDJump.begin(opts, won => { try { done && done(!!won); } catch (e) { console.error(e); } }); }
    catch (e) { console.error(e); return false; }
  }

  // The yards: what a saved run is worth (pure).
  const savedYards = (base, extra) => base + Math.round(extra * KEEP);

  window.TDChase = { begin, ready, savedYards, TABLE, ORDINARY, KEEP, FREQ };
})();
