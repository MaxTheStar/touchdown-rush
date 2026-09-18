// ============================================================
// TOUCHDOWN FUN — puntreturn.js: 🙋 PUNT RETURNS & THE MUFFED PUNT
// (Round 13, pick ③)
// ------------------------------------------------------------
// ⚠️ UNTIL NOW, A PUNT WAS A KICKOFF. When the other team punted,
// `takeYourBall()` called `startKickoff()` — the same deep boot, the same wall
// of coverage, the same "RETURN IT!". That is not what a punt is, and it threw
// away the single most interesting decision in the kicking game.
//
// A punt is different from a kickoff in three ways that all matter:
//
//   1. IT IS SHORTER. You field it around your own 35–45, not your own 8. So a
//      punt return starts with much better field position and much less room.
//   2. THE GUNNERS ARE ALREADY THERE. On a kickoff the coverage team has to run
//      the length of the field. On a punt, two players sprinted down the
//      sideline while the ball was still in the air, and one of them is usually
//      standing over you as it arrives.
//   3. BECAUSE OF (2), YOU ARE ALLOWED TO SAY NO. Wave your hand, and it is a
//      **FAIR CATCH**: the play is over the instant you touch it, nobody may
//      touch you, and you take the ball where you stand.
//
// ⚠️ AND HERE IS WHY THE FAIR CATCH IS A REAL DECISION AND NOT A BUTTON THAT
// WASTES YOUR TURN — **THE MUFF**. A punt is a wobbling, spinning ball dropping
// out of the sky with somebody about to hit you. If you try to catch it with a
// gunner on top of you, you can drop it — and a muffed punt is a **LIVE BALL**.
// Either team can fall on it. That is the whole feature in one sentence:
//
//        free yards, or the chance of handing them the ball.
//
// The fair catch exists in real football *because* the muff exists. Build one
// without the other and you have built nothing — a fair catch with no risk to
// avoid is just a worse return, and a muff with no fair catch is just bad luck
// happening to you.
//
// ⚠️ THE RULES THAT KEEP IT FAIR (and they are MEASURED, see the commit):
//   · A MUFF IS NEVER RANDOM. It can only happen when a gunner is genuinely
//     close — `muffChance()` is zero beyond SAFE_DIST. Catch it in space and
//     you will never, ever drop it.
//   · A FAIR CATCH IS ALWAYS 100% SAFE. No muff, no tackle, no exceptions. The
//     safe option has to actually be safe or the choice is a lie.
//   · A MUFF IS NOT AN AUTOMATIC TURNOVER. You dive on your own muff half the
//     time (the same OFF_RECOVER_CHANCE the fumble code uses), so the worst
//     moment in the game is still a coin flip, not a punishment.
//   · THE CEILING IS CAPPED at MAX_MUFF. Even with a gunner right on your chest
//     it is a risk, never a certainty.
//
// `muffChance()` is a PURE function of one number — no globals, no DOM — the
// same shape as TDFourth.advise(), TDClock.advise(), TDHit.grade() and
// TDSelf.read(), so every distance can be swept without playing a down.
//
// Nothing is saved; there is nothing to remember between games.
// ============================================================
(function () {
  'use strict';

  const $ = id => document.getElementById(id);

  // ---- the dials --------------------------------------------------------
  const SAFE_DIST = 95;    // a gunner further away than this cannot make you drop it
  const TIGHT_DIST = 22;   // right on top of you — the worst case
  const MAX_MUFF  = 0.34;  // …and even then it is barely a third

  // Where a punt is fielded. Real punts average ~45 yards from the line, and
  // their drives stall around midfield, so this lands you in your own end of
  // the field but nothing like a kickoff's goal line.
  const CATCH_MIN = 26, CATCH_MAX = 48;

  // ---- the thinking (PURE) ----------------------------------------------
  // How likely is a muff, given the distance to the NEAREST gunner in pixels?
  // Zero in space, rising as he closes, capped at MAX_MUFF on his chest.
  function muffChance(dist) {
    const d = (typeof dist === 'number' && isFinite(dist)) ? dist : Infinity;
    if (d >= SAFE_DIST) return 0;                 // caught in space — never drops
    if (d <= TIGHT_DIST) return MAX_MUFF;         // he is ON you — the ceiling
    // straight line between the two, so it is explainable in one sentence
    const t = (SAFE_DIST - d) / (SAFE_DIST - TIGHT_DIST);
    return Math.max(0, Math.min(MAX_MUFF, MAX_MUFF * t));
  }

  // Where this punt comes down (a plain yard line from your own goal).
  function catchSpot(rnd) {
    const r = (typeof rnd === 'function') ? rnd : Math.random;
    return Math.round(CATCH_MIN + r() * (CATCH_MAX - CATCH_MIN));
  }

  // ---- the 🙋 FAIR CATCH button -----------------------------------------
  // Only on screen while the ball is in the air. The moment it is caught (or
  // waved), it is gone again — a button you can press after the play would be
  // a bug wearing a feature's clothes.
  let waved = false;
  let onWave = null;

  function show(fn) {
    waved = false; onWave = fn || null;
    const b = $('btn-faircatch');
    if (b) b.style.display = 'flex';
  }
  function hide() {
    const b = $('btn-faircatch');
    if (b) b.style.display = 'none';
  }
  function wave() {
    if (waved) return;
    waved = true;
    hide();
    if (onWave) onWave();
  }
  function isWaved() { return waved; }

  function setup() {
    const b = $('btn-faircatch');
    if (b) b.addEventListener('pointerdown', e => { e.preventDefault(); wave(); });
    hide();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup);
  else setup();

  window.TDPunt = {
    muffChance, catchSpot, show, hide, wave, isWaved,
    SAFE_DIST, TIGHT_DIST, MAX_MUFF, CATCH_MIN, CATCH_MAX,
  };
})();
