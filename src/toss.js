// ============================================================
// TOUCHDOWN FUN — toss.js: 🪙 THE COIN TOSS (Round 13, pick ①)
// ------------------------------------------------------------
// Every real football game starts the same way, and this one never has: two
// captains at midfield, a referee, and a coin in the air.
//
// ------------------------------------------------------------
// ⚠️ THE WHOLE POINT IS THE SECOND CHOICE, NOT THE FIRST
// ------------------------------------------------------------
// Calling heads or tails is a 50/50 guess and guesses are not interesting.
// What IS interesting is what you do when you win it:
//
//   ⚡ TAKE THE BALL   You get it now. Score first, lead first.
//   ⏳ DEFER           You give it to them now — and get it at the start of
//                      the SECOND HALF instead.
//
// Deferring is the choice nearly every real NFL team makes, and it is the one
// a nine-year-old has almost certainly never heard of. The reason it is good
// is genuinely clever: if you defer and then get a stop, you can end the first
// half with the ball AND start the second half with it — two possessions in a
// row, which is the closest thing football has to a free turn.
//
// So this pick is really a lesson wearing a coin costume.
//
// ------------------------------------------------------------
// ⚠️ WHY THIS WAS NEARLY FREE, AND THE COMMENT THAT PROVED IT
// ------------------------------------------------------------
// The game ALREADY plays the real halftime rule. All four halftime sites in
// main.js say `startBreak('half', startCpuDrive)`, and one of them spells out
// why in a comment that was written long before this file existed:
//
//   "REAL FOOTBALL RULES at the half: you fielded the game-opening kickoff,
//    so the OTHER team gets the ball to start the second half"
//
// That sentence contains an ASSUMPTION — *you* fielded the opening kickoff —
// which was simply always true. All the coin toss has to do is make that
// assumption conditional. Defer, and both halves swap owners. Nothing else in
// the clock, the quarter logic or the drive flow has to change at all.
//
// ------------------------------------------------------------
// HOW IT PLUGS IN
// ------------------------------------------------------------
// It borrows the shape 📋 scout.js invented for the pre-kickoff card: return
// `true` to say "I have put something on screen, hold the kickoff", then call
// the callback when the player is done. `G.state` is still 'menu' through all
// of this and `update()` returns early on 'menu', so nothing runs behind it.
//
// The order is: 📋 scouting report → 🪙 coin toss → the opening kick. The
// report is your coaches talking before you leave the locker room; the toss is
// the last thing that happens before football.
//
// ⚠️ NOT IN EVERY GAME. The ⏱️ two-minute drill, the 🎯 arcade drills and the
// 🌟 All-Star game all start mid-situation or aren't real games — a toss there
// would be ceremony in front of a practice. Those skip it and receive exactly
// as they always did.
//
// Nothing is saved: who won a coin toss three games ago changes nothing.
// ============================================================
(function () {
  'use strict';

  const $ = id => document.getElementById(id);
  const G = () => (window.__td ? window.__td.G : null);

  // How often the computer defers when IT wins the toss. Real teams defer
  // almost always; a little variety is friendlier than a rule.
  const CPU_DEFER = 0.75;

  // ---- per-game state (nothing persisted) ---------------------------------
  let theyGetOpening = false;   // do they receive the opening kick?
  let done = null;              // main.js's "now start the game" callback
  let called = null;            // 'heads' | 'tails' — what you called
  let landed = null;            // what the coin actually was
  let youWon = false;

  function newGame() {
    theyGetOpening = false;
    done = null; called = null; landed = null; youWon = false;
    hide();
  }

  // ============================================================
  // WHAT main.js ASKS
  // ------------------------------------------------------------
  // ⚠️ BOTH OF THESE ARE FALSE BY DEFAULT, which is what makes a game where
  // this file is missing — or a drill that skips the toss — behave exactly the
  // way it always did: you field the opening kick, they get the second half.
  // ============================================================

  // Do they receive the OPENING kickoff? (true only if you deferred, or lost
  // the toss and they took the ball.)
  function theyReceive() { return theyGetOpening; }

  // …and the second half is simply the other way round. This is the entire
  // mechanical consequence of the feature.
  function youReceiveSecondHalf() { return theyGetOpening; }

  // ---- should this game even have a toss? ---------------------------------
  // ⚠️ A drill is not a game. Neither is an arcade card or an exhibition that
  // starts in a made-up situation — a coin toss in front of an empty practice
  // field is ceremony, not football.
  function realGame() {
    const g = G();
    if (!g) return false;
    if (g.drillGame || g.allStarGame || g.starGame) return false;
    if (g.simTakeover) return false;          // 🎲 you took this one over at half time
    try { if (window.TDHouse && TDHouse.live && TDHouse.live()) return false; } catch (e) {}
    return true;
  }

  // ============================================================
  // THE TOSS ITSELF
  // ------------------------------------------------------------
  // Returns true if it put the card up (and will call `cb` later), false to
  // say "carry on as normal" — the same contract scout.js uses.
  // ============================================================
  function pregame(cb) {
    if (!realGame()) return false;
    const panel = $('toss-panel');
    if (!panel) return false;
    done = cb;
    called = null; landed = null; youWon = false; theyGetOpening = false;
    showCall();
    return true;
  }

  // ---- step 1: call it in the air ----------------------------------------
  function showCall() {
    const g = G();
    const opp = g && g.oppTeam ? g.oppTeam.abbr : 'THEM';
    setBody(
      '<div class="ts-coin" id="ts-coin">🪙</div>' +
      '<div class="ts-title">CALL IT IN THE AIR</div>' +
      '<div class="ts-sub">' + opp + ' is the home captain — your call.</div>' +
      '<div class="ts-row">' +
        '<div class="ts-btn" data-call="heads">👑 HEADS</div>' +
        '<div class="ts-btn" data-call="tails">🦅 TAILS</div>' +
      '</div>');
    wire('[data-call]', el => flip(el.getAttribute('data-call')));
    show();
  }

  // ---- step 2: flip it ----------------------------------------------------
  function flip(call) {
    called = call;
    landed = Math.random() < 0.5 ? 'heads' : 'tails';
    youWon = (called === landed);

    // ⚠️ THE SPIN IS DECORATION AND IS TREATED LIKE IT. The coin is on screen
    // and readable before any animation runs, and the result is decided above
    // — not by where an animation happens to stop. (A CSS transition must
    // never be the thing that PUTS something on screen: that was the 🐯 mascot
    // bug in v1.92, and a background tab would have frozen this solid.)
    const coin = $('ts-coin');
    if (coin) coin.classList.add('spin');
    setTimeout(() => { youWon ? showChoice() : cpuChooses(); }, 900);
  }

  const FACE = { heads: '👑 HEADS', tails: '🦅 TAILS' };

  // ---- step 3a: you won — take it or defer -------------------------------
  function showChoice() {
    setBody(
      '<div class="ts-coin landed">' + (landed === 'heads' ? '👑' : '🦅') + '</div>' +
      '<div class="ts-title win">IT IS ' + FACE[landed].split(' ')[1] + ' — YOU WIN THE TOSS</div>' +
      '<div class="ts-sub">You called ' + FACE[called].split(' ')[1].toLowerCase() + '. Now the real decision.</div>' +
      '<div class="ts-opts">' +
        '<div class="ts-opt" data-take="now"><b>⚡ TAKE THE BALL</b>' +
          '<span>Get it now. Score first, lead first.</span></div>' +
        '<div class="ts-opt" data-take="defer"><b>⏳ DEFER</b>' +
          '<span>They get it now — you start the second half.</span></div>' +
      '</div>' +
      '<div class="ts-foot">Most real teams defer: get a stop, and you can finish the first ' +
        'half with the ball <em>and</em> start the second with it.</div>');
    wire('[data-take]', el => choose(el.getAttribute('data-take') === 'defer'));
  }

  // ---- step 3b: you lost — they choose ------------------------------------
  function cpuChooses() {
    const g = G();
    const opp = g && g.oppTeam ? g.oppTeam.abbr : 'THEY';
    const theyDefer = Math.random() < CPU_DEFER;
    // They defer  → YOU receive now.   They take it → THEY receive now.
    theyGetOpening = !theyDefer;
    setBody(
      '<div class="ts-coin landed">' + (landed === 'heads' ? '👑' : '🦅') + '</div>' +
      '<div class="ts-title lose">IT IS ' + FACE[landed].split(' ')[1] + ' — ' + opp + ' WINS THE TOSS</div>' +
      '<div class="ts-sub">' + (theyDefer
        ? opp + ' <b>defers</b>. You get the ball first — and they get the second half.'
        : opp + ' <b>takes the ball</b>. You are on defense to start.') + '</div>' +
      '<div class="ts-row"><div class="ts-btn go" data-go="1">🏈 LET\'S PLAY</div></div>');
    wire('[data-go]', () => finish());
  }

  function choose(defer) {
    theyGetOpening = defer;
    const g = G();
    const opp = g && g.oppTeam ? g.oppTeam.abbr : 'THEM';
    setBody(
      '<div class="ts-coin landed">' + (landed === 'heads' ? '👑' : '🦅') + '</div>' +
      '<div class="ts-title win">' + (defer ? '⏳ YOU DEFER' : '⚡ YOU TAKE THE BALL') + '</div>' +
      '<div class="ts-sub">' + (defer
        ? opp + ' receives to start — you get the ball to open the second half.'
        : 'Your ball. Let\'s go.') + '</div>' +
      '<div class="ts-row"><div class="ts-btn go" data-go="1">🏈 LET\'S PLAY</div></div>');
    wire('[data-go]', () => finish());
  }

  function finish() {
    hide();
    const cb = done;
    done = null;
    // Tell the announcer what happened, once. (⚠️ One line only — the bar is
    // shared and overloading it is what broke it in v2.8.)
    const g = G();
    if (g && window.__td && __td.sayComment) {
      try {
        __td.sayComment(theyGetOpening
          ? 'They take the opening kick — you get the second half.'
          : 'You take the opening kickoff!');
      } catch (e) {}
    }
    if (cb) { try { cb(); } catch (e) {} }
  }

  // ---- the card -----------------------------------------------------------
  function setBody(html) {
    const b = $('toss-body');
    if (b) b.innerHTML = html;
  }
  function wire(sel, fn) {
    const b = $('toss-body');
    if (!b) return;
    b.querySelectorAll(sel).forEach(el => {
      el.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); fn(el); });
    });
  }
  function show() { const p = $('toss-panel'); if (p) p.style.display = 'flex'; }
  function hide() { const p = $('toss-panel'); if (p) p.style.display = 'none'; }

  window.TDToss = {
    pregame, newGame, theyReceive, youReceiveSecondHalf,
    // for tests
    _flip: flip, _choose: choose, _finish: finish, _realGame: realGame,
    _state: () => ({ called, landed, youWon, theyGetOpening }),
    CPU_DEFER,
  };
})();
