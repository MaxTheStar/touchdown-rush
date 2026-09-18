// ============================================================
// TOUCHDOWN FUN — homeaway.js: 👕 HOME & AWAY JERSEYS (Round 13, pick ②)
// ------------------------------------------------------------
// ⚠️ THIS ONE IS MAX'S OWN IDEA. He asked for it in the middle of Round 12:
// *"wear different jerseys depending on which game it is, and the jerseys
// should matter."* It got designed then and pushed aside when full screen
// jumped the queue, so it went on the Game Day Board and here it is.
//
// The second half of that sentence is the important half. A white shirt that
// only looks different is a costume. This makes the road actually harder.
//
// ------------------------------------------------------------
// ⚠️ THE GAME ALREADY KNEW WHO WAS HOME — IT WAS JUST THROWING IT AWAY
// ------------------------------------------------------------
// season.js builds the schedule with `divisionRoundRobin`, and the second half
// of the season is literally the first half with every pairing flipped:
//
//     const rematch = leg.map(round => round.map(([a, b]) => [b, a]));
//
// So the ORDER of each pair has always meant something — the first team is at
// home — and the schedule screen has said "(division rivals, home & away)" in
// its caption this whole time. But `pairFor()` only ever answered "who do I
// play?", by looping over both slots and returning the other one, which threw
// the order on the floor.
//
// Expose that order and real home-and-away is nearly free. That is why this
// pick sits at ② on a board where it could easily have looked like a ⑥.
//
// ------------------------------------------------------------
// WHAT CHANGES WHEN YOU ARE ON THE ROAD
// ------------------------------------------------------------
//   👕 WHITE JERSEY, TEAM HELMET. Real road teams wear white, and keeping the
//      helmet in your colours is what stops you losing track of who you are.
//   📣 NO HOME CROWD. crowd.js's whole tilt switches off — those are YOUR
//      seats, your streak, your stadium, and none of them travelled with you.
//   😠 A HOSTILE CROWD INSTEAD. Their offense gets a small, flat boost.
//
// ⚠️ THE ROAD PENALTY IS DELIBERATELY SMALLER THAN THE HOME BONUS (3% against
// a ceiling of 6%). Being away should be a headwind you can feel, not a tax.
// A kid losing on the road should lose to the other team, not to a multiplier.
//
// ⚠️ AND IT ONLY EXISTS IN SEASON MODE, because the schedule is the only thing
// that knows where a game is played. A quick game, a 👑 boss game, the 🏆
// playoffs and every exhibition are all HOME — which means they behave exactly
// as they always have, and nothing that was tuned before this file needs
// re-tuning after it.
//
// Nothing is saved: where this week's game is played is already in the season.
// ============================================================
(function () {
  'use strict';

  const G = () => (window.__td ? window.__td.G : null);

  // The road whites. The helmet deliberately stays your own colour.
  //
  // ⚠️ THIS IS A NUMBER, NOT A CSS STRING, AND THAT WAS THE BUG. Every kit
  // colour in this game is a Phaser colour int — `G.team.jersey` for Seattle
  // is 8772, which is 0x002244 — and `makeChibiTexture` hands it straight to
  // `graphics.fillStyle(jersey)`, which wants an int. Written as '#eef2f7' the
  // white kit silently did nothing at all: the flag was right, the crowd was
  // right, and the players ran out in their home shirts anyway.
  const AWAY_JERSEY = 0xEEF2F7;

  // ============================================================
  // ARE WE ON THE ROAD?
  // ------------------------------------------------------------
  // Asked once, by beginGame, and stashed on G.awayGame — everything else
  // reads that flag rather than re-deriving it, so the jersey you are wearing
  // and the crowd you are hearing can never disagree.
  // ============================================================
  function decide() {
    const g = G();
    if (!g) return false;
    if (!g.seasonGame) return false;          // only a schedule knows where a game is
    if (g.playoffGame) return false;          // 🏆 the bracket is played at your place
    try {
      if (window.TDSeason && TDSeason.homeAway) return TDSeason.homeAway() === 'away';
    } catch (e) {}
    return false;
  }

  // Is the CURRENT game an away game? (Reads the flag beginGame set.)
  function away() {
    const g = G();
    return !!(g && g.awayGame);
  }

  // The kit to paint on your players this game.
  function kitFor(team) {
    if (!team) return team;
    if (!away()) return team;
    return { jersey: AWAY_JERSEY, helmet: team.helmet };
  }

  // A word for the scoreboard / schedule.
  function label() { return away() ? '@' : 'vs'; }

  window.TDHome = { decide, away, kitFor, label, AWAY_JERSEY };
})();
