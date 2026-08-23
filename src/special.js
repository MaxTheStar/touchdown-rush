// ============================================================
// TOUCHDOWN FUN — special.js: 🏈 SPECIAL TEAMS TRICKS
// ------------------------------------------------------------
// Kicking downs used to be simple: kick it, or run a normal play. Now you get
// the sneaky stuff real teams pull out when they need a spark:
//
//   🎭 FAKE PUNT / FAKE FIELD GOAL — line up like you're kicking, then RUN it.
//      The defense sells out to block the kick, so they're caught flat-footed
//      for a beat and there's a lane. You get TWO fakes a game, so pick your
//      spot: if you don't get the first down, the other team takes over.
//
//   ⚡ ONSIDE KICK — after YOU score, instead of handing them the ball, try to
//      steal it back with a short squib. It usually fails (about 1 in 4 works,
//      just like real football) and they get the ball near midfield — but pull
//      it off and you get the ball right back. Offered when you actually NEED
//      it: in the 4th quarter, or any time you're behind.
//
// We lean on machinery the game already has instead of rewriting the play loop:
// the fake reuses the 🎩 trick play's "defense bites" window, and the onside
// result just sets where the next drive starts. main.js keeps the ball moving —
// we only ever answer questions and show two little panels.
// ============================================================
(function () {
  const $ = id => document.getElementById(id);

  const FAKES_PER_GAME = 2;      // enough to be a real weapon, few enough to matter
  const ONSIDE_CHANCE  = 0.22;   // about 1 in 4 — the real NFL rate is close to this
  const ONSIDE_WIN_SPOT = 45;    // you recover it around your own 45
  const ONSIDE_LOSE_SPOT = 48;   // they take over near midfield (a real cost)

  let fakesLeft = FAKES_PER_GAME;
  let onsidePick = null;         // the callback waiting on your choice

  function newGame() { fakesLeft = FAKES_PER_GAME; onsidePick = null; }

  // ---- 🎭 The fake -------------------------------------------------------
  function canFake() { return fakesLeft > 0; }
  function useFake() { if (fakesLeft > 0) fakesLeft--; return fakesLeft; }
  function fakesRemaining() { return fakesLeft; }
  // What to call it: close enough to kick a field goal, or a punt?
  // Kept short on purpose — a longer label wraps to two lines on a phone.
  function fakeLabel(inFgRange) { return inFgRange ? '③ 🎭 FAKE THE KICK' : '③ 🎭 FAKE THE PUNT'; }

  // ---- ⚡ The onside kick -------------------------------------------------
  // Only offered when a real coach would think about it: you're behind, or it's
  // late in the game and you need the ball back.
  function onsideOffered(myScore, oppScore, quarter) {
    return (myScore < oppScore) || quarter >= 4;
  }
  function rollOnside() { return Math.random() < ONSIDE_CHANCE; }
  const winSpot = () => ONSIDE_WIN_SPOT;
  const loseSpot = () => ONSIDE_LOSE_SPOT;

  // Show the "kick it deep, or gamble?" panel. main.js holds the game open
  // (it parks the dead-ball timer) until `done` is called with your answer.
  function askOnside(done) {
    onsidePick = done;
    const p = $('onside-panel');
    if (!p) { finishOnside('normal'); return; }      // no panel in the page? just kick normally
    p.style.display = 'flex';
  }
  function finishOnside(choice) {
    const p = $('onside-panel'); if (p) p.style.display = 'none';
    const cb = onsidePick; onsidePick = null;
    if (cb) cb(choice);
  }

  // A quick banner so the result of the gamble is unmistakable.
  function onsideFlash(recovered) {
    const el = $('onside-flash'); if (!el) return;
    el.textContent = recovered ? '⚡ YOU GOT IT BACK!' : '⚡ They recovered…';
    el.className = recovered ? 'show good' : 'show bad';
    setTimeout(() => { el.className = ''; }, 1800);
  }

  function tap(id, fn) { const el = $(id); if (el) el.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); fn(); }); }
  function wire() {
    tap('btn-onside', () => finishOnside('onside'));
    tap('btn-kickoff', () => finishOnside('normal'));
  }
  if (document.readyState !== 'loading') wire();
  else document.addEventListener('DOMContentLoaded', wire);

  window.TDSpecial = {
    newGame,
    canFake, useFake, fakesRemaining, fakeLabel,
    onsideOffered, askOnside, rollOnside, winSpot, loseSpot, onsideFlash,
  };
})();
