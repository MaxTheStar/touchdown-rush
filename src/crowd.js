// ============================================================
// TOUCHDOWN FUN — crowd.js: 📣 HOME CROWD (Round 12, pick ①)
// ------------------------------------------------------------
// You have been building a stadium since v1.42 and the only thing it ever did
// was pay you coins. Now it plays football: the bigger you build it and the
// better you are playing, the louder it gets — and a loud crowd genuinely makes
// the other team's offense worse, the way it does in a real stadium.
//
// ⚠️ THIS IS THE FIRST PICK OF ROUND 12, AND THE POINT OF THE WHOLE BOARD:
// the crowd has existed in this game for eleven rounds as pure FLAVOUR. It tips
// your 🐯 mascot, it buys 🍿 hot dogs, it fills seats you paid for — and it has
// never once affected a single play. Round 12 is the round where the things
// around the football start touching the football.
//
// HOW LOUD IS IT? Three things, and all three are already real numbers:
//   🏟 SEATS    how much stadium you have actually built (stadium.js level)
//   🔥 FORM     your current win streak (streak.js) — a hot team fills the place
//   🎯 OCCASION a season, playoff, rival or 👑 boss game is an EVENT; a kickabout
//               exhibition is not, and the stands know the difference
//
// WHAT IT DOES — nothing new, just more of something that already exists. The
// noise folds into the SAME `G.oppOff` chain that 🎓 the defensive coordinator
// and ⭐ the 🧱 Wall trait already fold into, and into the ONE `cpuPow` line that
// decides how well the CPU moves the ball in the 1-player defense sim. No new
// balance system, no new machinery.
//
// ⚠️ CAPPED AT −6%, WHICH IS THE SAME CEILING A MAXED-OUT COACH GETS. Home
// field in real football is worth about two or three points; it is not worth a
// touchdown, and it must never be the reason you win. A brand-new stadium with
// no streak is EXACTLY ×1 — the game plays precisely as it did before this file
// existed, which is the rule every one of these features follows.
//
// ⚠️ AND SOME GAMES HAVE NO HOME CROWD AT ALL, for reasons that are about
// football rather than code: ⏱️ the Two-Minute Drill is a practice field,
// 🌟 the All-Star Game is a neutral site, and a 🎲 house-rules game is a garden
// kickabout. Nobody is in the stands for any of those.
//
// ⚠️ IT DOES NOT SAY A WORD. v2.8 was spent fixing an announcer bar that was on
// screen 100% of the time because a feature added a fourth voice to it, so this
// one deliberately adds none: you read the crowd in the 🏟 STADIUM screen, and
// you feel it on the field. Nothing is saved — every number it uses belongs to
// somebody else.
// ============================================================
(function () {
  'use strict';

  const $ = id => document.getElementById(id);
  const clamp01 = v => v < 0 ? 0 : v > 1 ? 1 : v;

  const MAX_TILT = 0.06;    // the most the crowd can ever cost their offense
  const STAD_MAX = 18;      // stadium.js: 18 upgrades bought = a full house
  const STREAK_MAX = 6;     // a six-game run has the place as loud as it gets

  // ---- is anybody in the stands? -----------------------------------------
  // Read off main.js's own flags, so this can never disagree with the game.
  //
  // ⚠️ THIS MUST NOT ASK WHAT STATE THE GAME IS IN, AND THAT COST A BUG. The
  // first cut started with `if (g.state === 'menu') return false` — perfectly
  // sensible, and completely wrong, because `beginGame` works out all of its
  // strength tilts BEFORE it ever leaves the menu state (the state only changes
  // at the very end, in startKickoff). So the one moment the crowd is actually
  // asked for its number, the answer was "there is no game on" and the whole
  // feature quietly did nothing: G.oppOff came out at 0.9597 with the crowd and
  // 0.9597 without it. Verification caught it; playing it never would have.
  //
  // So this asks only about the OCCASION, from flags beginGame has already set
  // by the time it folds us in. Whether a game is running at all is a different
  // question, asked separately below, and only for drawing the readout.
  function stands() {
    let g = null;
    try { g = window.__td && __td.G; } catch (e) {}
    if (!g) return false;
    if (g.drillGame || g.allStarGame) return false;      // practice field · neutral site
    try { if (window.TDHouse && TDHouse.live && TDHouse.live()) return false; } catch (e) {}
    return true;
  }

  // A game is actually on the field right now. ⚠️ ONLY for choosing between the
  // live readout and the "next season game" preview — never for the maths.
  function liveGame() {
    try {
      const g = window.__td && __td.G;
      return !!g && g.state !== 'menu' && g.state !== 'gameover';
    } catch (e) { return false; }
  }

  // ---- the three ingredients, each 0…1 ------------------------------------
  function seatsPart() {
    try {
      if (window.TDStadium && TDStadium.level) return clamp01(TDStadium.level() / STAD_MAX);
    } catch (e) {}
    return 0;
  }
  function formPart() {
    try {
      if (window.TDStreak && TDStreak.current) return clamp01(TDStreak.current() / STREAK_MAX);
    } catch (e) {}
    return 0;
  }
  // A real contest packs the house; a kickabout does not.
  function occasionPart() {
    let g = null;
    try { g = window.__td && __td.G; } catch (e) {}
    if (!g) return 0;
    if (g.bossGame) return 1;            // 👑 everybody turns out for Maxwell
    if (g.playoffGame) return 1;
    if (g.rivalGame) return 0.85;        // 😈 a grudge match
    if (g.seasonGame) return 0.7;
    if (g.eventGame) return 0.6;         // 🎃 a themed week
    return 0.25;                          // a friendly
  }

  // ---- how loud, 0…1 ------------------------------------------------------
  // Seats matter most (it is your stadium), form next, the occasion last — but
  // the occasion MULTIPLIES the lot, because an empty-feeling friendly in a huge
  // stadium is still a quiet afternoon.
  function noise() {
    if (!stands()) return 0;
    const base = seatsPart() * 0.55 + formPart() * 0.30 + 0.15;
    return clamp01(base * occasionPart() + (occasionPart() >= 0.7 ? 0.10 : 0));
  }

  // ---- what the game asks for --------------------------------------------
  // main.js's beginGame folds this into G.oppOff, beside the coach and the Wall.
  // ×1 with no stadium and no streak — the untouched game.
  function oppOffMult() { return 1 - MAX_TILT * noise(); }

  // …and the 1-player defense sim multiplies its cpuPow by this, so a loud house
  // makes them worse on the tap-to-progress drives too. Same number, so the two
  // paths can never disagree about how loud it is.
  function cpuPowMult() { return 1 - MAX_TILT * noise(); }

  // ---- the readout, inside the 🏟 STADIUM screen --------------------------
  // A "what if" version for the menu, where there is no live game to read: it
  // shows what a real season game WOULD sound like, so building seats has a
  // visible promise attached to it.
  function preview() {
    const seats = seatsPart(), form = formPart();
    const base = seats * 0.55 + form * 0.30 + 0.15;
    return clamp01(base * 0.7 + 0.10);        // 0.7 = a normal season game
  }

  const WORDS = [
    [0.85, '🔊 DEAFENING', 'They cannot hear a thing out there.'],
    [0.65, '📣 ROARING',   'This place is rocking.'],
    [0.45, '👏 LOUD',      'A proper home crowd.'],
    [0.25, '🙂 WARM',      'A decent turnout.'],
    [0,    '🤫 QUIET',     'Build some seats and win some games.'],
  ];
  function words(v) { for (const w of WORDS) if (v >= w[0]) return w; return WORDS[WORDS.length - 1]; }

  function render() {
    const box = $('stad-crowd'); if (!box) return;
    const live = liveGame() && stands();
    const v = live ? noise() : preview();
    const w = words(v);
    const pct = Math.round(v * 100);
    const tilt = (MAX_TILT * v * 100).toFixed(1);
    const bit = (label, val) =>
      '<div class="cr-bit"><span>' + label + '</span><b>' + Math.round(val * 100) + '%</b></div>';
    box.innerHTML =
      '<div class="cr-head">📣 CROWD NOISE' + (live ? '' : ' — next season game') + '</div>' +
      '<div class="cr-meter"><i style="width:' + pct + '%"></i></div>' +
      '<div class="cr-word">' + w[1] + ' <small>' + w[2] + '</small></div>' +
      '<div class="cr-bits">' + bit('🏟 Seats', seatsPart()) + bit('🔥 Form', formPart()) +
        bit('🎯 Occasion', live ? occasionPart() : 0.7) + '</div>' +
      '<div class="cr-effect">Their offense plays <b>' + tilt + '%</b> slower while it is this loud.' +
        (v < 0.2 ? ' Build seats and put a run together to turn this up.' : '') + '</div>';
  }

  // main.js calls this when the menu appears; stadium.js re-renders on upgrades.
  function onMenu() { render(); }

  window.TDCrowd = {
    oppOffMult, cpuPowMult,     // what the game folds in
    noise, preview, render, onMenu,
    stands, liveGame,
    _parts: () => ({ seats: seatsPart(), form: formPart(), occasion: occasionPart(), noise: noise() }),
    _maxTilt: () => MAX_TILT,
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', render);
  else render();
})();
