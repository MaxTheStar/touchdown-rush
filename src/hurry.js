// ============================================================
// TOUCHDOWN FUN — hurry.js: ⏰ THE HURRY-UP OFFENSE (Round 12, pick ⑥)
// ------------------------------------------------------------
// Ninety seconds left, you are a touchdown down, and the clock is the only
// opponent that matters. Real teams have an answer for this and until now
// this game did not: the NO-HUDDLE.
//
// ⚠️ THE ⏱️ TWO-MINUTE DRILL (v1.87) GIVES YOU THE SITUATION. THIS GIVES YOU
// THE TOOLS. That is the whole reason this pick sits next to that one on the
// board — the drill drops you in the deep end, and a player who has been
// dropped in the deep end four times deserves something to swim with.
//
// ------------------------------------------------------------
// WHAT IT ACTUALLY DOES, AND WHY THAT IS THE RIGHT LEVER
// ------------------------------------------------------------
// In this game the clock only ever moves when a play ends — `advanceClock()`
// takes 32 seconds off for an ordinary run, because those 32 seconds are not
// the play, they are the play PLUS the huddle that came before it.
//
// So the no-huddle is not a new play or a new animation. It is the huddle
// being skipped: **32 seconds becomes 16.** You get roughly twice as many
// snaps out of the same clock, which is exactly what the real thing buys you.
//
// ⚠️ AND IT DOES NOTHING AT ALL ON AN INCOMPLETE PASS — deliberately. An
// incomplete already stops the clock (12 seconds, not 32), so there is no
// huddle sitting in that number to skip. Hurrying up helps on the plays where
// the clock KEEPS RUNNING and nowhere else, which is a real and slightly
// surprising piece of football: throwing it away already saved you the time
// the no-huddle is trying to save.
//
// ------------------------------------------------------------
// ⚠️ WHY IT IS NOT AVAILABLE ALL GAME — THE BALANCE TRAP
// ------------------------------------------------------------
// If you could switch this on in the first quarter you would simply get more
// plays than the other team, every quarter, forever — more plays is more
// points, and the game would quietly break. It would not look like a bug. It
// would look like the game got easy.
//
// So it lives behind the SAME gate as ⏱️ Spike It & Kneel It, and for the same
// reason: it is only on the screen when it could actually change the ending.
//
//   0. NOT IN OVERTIME            next score wins; there is no clock to beat.
//   1. ONLY IN A PERIOD WHOSE ENDING COSTS SOMETHING — the end of the HALF or
//      the end of the GAME. ⚠️ Q1 and Q3 run straight on into the next quarter
//      with your drive intact, so hurrying there saves you nothing. This is
//      the exact rule the spike got wrong in v3.6, so it is derived from
//      `quarter` here rather than trusted from a caller.
//   2. ONLY WHEN YOU ARE BEHIND OR TIED. If you are ahead, the clock is your
//      friend and going faster is helping the other team. (That is not a
//      restriction so much as football: nobody has ever run a no-huddle to
//      protect a lead.)
//   3. ONLY WITH ENOUGH CLOCK LEFT TO BE WORTH IT — see WINDOW below.
//
// ⚠️ IT ALSO TURNS ITSELF OFF. `update()` re-checks those rules at every line
// of scrimmage, so taking the lead, reaching half time or running the clock
// out all switch it off on their own. Nothing else has to remember to.
//
// ------------------------------------------------------------
// WHAT IT COSTS YOU, BECAUSE IT HAS TO COST SOMETHING
// ------------------------------------------------------------
// You are sprinting to the line and snapping the ball. You do not get to
// stand there and think. So while the no-huddle is on:
//
//   🗣️ no audible        · 🧩 no formation change · 🎩 no trick play
//
// That is three of the four things you would normally do at the line, and it
// is honest football rather than a made-up penalty — those are exactly the
// things a real offense gives up to go fast.
//
// ⚠️ THAT TRADE-OFF IS DONE ENTIRELY IN CSS, via a `body.hurry` class. It
// costs main.js nothing, it cannot get out of sync with the mode, and turning
// the mode off puts all three buttons back in the same frame.
//
// ------------------------------------------------------------
// HOW IT PLUGS IN
// ------------------------------------------------------------
// Three one-line hooks in main.js, all guarded, so without this file the game
// is byte-identical:
//   · setupPlay  → TDHurry.update(ctx)      same ctx object ⏱️ TDClock gets
//   · endPlay    → TDHurry.runSecs(TIME_RUN_PLAY)   the 32 → 16
//   · endPlay    → TDHurry.deadMs(1600)             the pause between plays
//
// The CPU's drive is deliberately untouched: it is simulated a play at a time
// rather than snapped, so there is no huddle in it to skip.
//
// Nothing is saved to storage — a tempo is not something you remember between
// games. (Same call clockplay.js made, for the same reason.)
// ============================================================
(function () {
  'use strict';

  const $ = id => document.getElementById(id);

  // ---- the numbers, and where they come from ------------------------------
  // ⚠️ These are read against THIS game's clock, not the NFL's: a quarter is
  // 150 seconds and an ordinary play eats 32 of them, so a quarter is only
  // about five plays long.
  const NORMAL_SECS = 32;   // what an ordinary run/catch costs (main.js TIME_RUN_PLAY)
  const HURRY_SECS  = 16;   // the same play with the huddle skipped — half
  const SAVED       = NORMAL_SECS - HURRY_SECS;   // 16 seconds a snap

  // "Is there enough clock for this to be worth turning on?" — you need to be
  // able to save at least a whole extra play out of it, and you save 16 a
  // snap, so three ordinary plays' worth of clock is the honest floor.
  // Derived from the numbers above rather than picked, so if the game's clock
  // ever changes this stays true.
  const WINDOW = NORMAL_SECS * 3;      // 96 seconds

  // The dead-ball pause between plays. main.js normally holds 1600ms on the
  // banner; going fast means going fast on screen too, or the mode would be a
  // number you are told about rather than a thing you can feel.
  const DEAD_MS = 850;

  // ---- state (none of it saved) -------------------------------------------
  let on = false;        // is the no-huddle running right now?
  let offered = false;   // is the situation one where it is even allowed?

  // ============================================================
  // THE THINKING — a pure function of a plain context object
  // ------------------------------------------------------------
  // No globals, no DOM, exactly like TDClock.advise() and TDFourth.advise().
  // A feature whose whole job is "is this the moment?" should be answerable
  // without playing a down, so every score / clock / quarter combination can
  // be swept in one loop. That is how the gate above is known to hold rather
  // than hoped to.
  //
  // ctx = { down, quarter, quarters, clock, my, opp, overtime, stopped }
  // Returns true if the no-huddle should be available here.
  // ============================================================
  function allowed(ctx) {
    const c = ctx || {};
    const clock = Math.max(0, c.clock || 0);

    // 0. Sudden death — the next score wins, so the clock is not the problem.
    if (c.overtime) return false;

    // 1. Does this period's ending actually cost you anything?
    //    ⚠️ Worked out from `quarter` HERE rather than trusted from a caller —
    //    that is the v3.1/v3.6 bug, and it is not coming back through this file.
    const quarters   = c.quarters || 4;
    const lastPeriod = (c.quarter >= quarters) || !!c.lastPeriod;
    const halfEnd    = (c.quarter * 2 === quarters);
    if (!lastPeriod && !halfEnd) return false;

    // 2. Ahead? Then the clock is on your side and going faster helps them.
    if ((c.my | 0) > (c.opp | 0)) return false;

    // 3. Enough clock left for the tempo to buy you a play.
    if (clock > WINDOW) return false;
    if (clock <= HURRY_SECS) return false;   // not even one more snap in it

    return true;
  }

  // ============================================================
  // THE BUTTON
  // ------------------------------------------------------------
  // main.js calls this at every line of scrimmage with the same context object
  // it hands ⏱️ TDClock, and passes null everywhere the question is moot.
  // ============================================================
  function update(ctx) {
    offered = ctx ? allowed(ctx) : false;

    // ⚠️ The mode cannot outlive the situation that justified it. Taking the
    // lead, reaching half time or running the clock down all land here, and
    // all of them switch it off without anybody having to remember to.
    if (!offered && on) setOn(false);

    paint();
  }

  function paint() {
    const b = $('btn-hurry');
    if (!b) return;
    if (!offered) { b.style.display = 'none'; return; }
    b.innerHTML = '<span class="hu-ic">⏰</span><small>' +
                  (on ? 'HUDDLE' : 'HURRY UP') + '</small>';
    b.classList.toggle('on', on);
    b.style.display = 'flex';
    b.title = on
      ? 'No-huddle is ON — plays cost half the clock. Tap to slow back down.'
      : 'Skip the huddle: half the clock per play, but no audible, formation or trick.';
  }

  function setOn(next) {
    if (on === next) return;
    on = next;
    // The whole trade-off, in one class: CSS hides 🗣️ / 🧩 / 🎩 while it is on.
    document.body.classList.toggle('hurry', on);
    if (on) {
      if (window.TDSound) TDSound.sting('coin');
      say('⏰ NO HUDDLE — line up fast!');
    } else {
      say('Back to the huddle.');
    }
    paint();
  }

  function say(text) {
    // main.js owns the announcer bar. ⚠️ It is a shared bar with a queue and it
    // was overloaded once already (v2.8 — four voices on one down), so this
    // file speaks exactly twice a game: on, and off.
    const g = window.__td;
    if (g && typeof g.sayComment === 'function') { try { g.sayComment(text); } catch (e) {} }
  }

  // ⚠️ THE TEMPO IS YOURS TO SET, AND ONLY WHEN THE BALL IS. `update()` runs
  // from `setupPlay`, which is YOUR play being lined up — so during the other
  // team's drive the button simply keeps whatever it last showed. The big
  // #defense-sim panel (z-index 40) covers it, so you never see it there, but
  // "you cannot see it" is not the same as "you cannot press it", and the
  // states where that panel ISN'T up would leave a live button setting a tempo
  // for a snap that is not yours.
  //
  // So the tap checks the game state itself. At the line, on a dead ball, or
  // at the 4th-down panel — those are yours. Anything else is not.
  const MINE = ['presnap', 'dead', 'decision'];
  function toggle() {
    if (!offered) return;
    const g = window.__td && window.__td.G;
    if (g && MINE.indexOf(g.state) === -1) return;
    setOn(!on);
  }

  // ---- what main.js asks for ----------------------------------------------
  // ⚠️ Both of these take the normal value and hand back what it should be, so
  // the call sites read as "this, unless we are hurrying" and the module being
  // absent leaves them exactly as they were.

  // The clock cost of a play. Only the plays where the clock KEEPS RUNNING
  // have a huddle in them to skip — an incomplete already stopped it.
  function runSecs(normal) {
    return on ? HURRY_SECS : normal;
  }

  // How long the game holds on the dead ball before lining up again.
  function deadMs(normal) {
    return on ? Math.min(normal, DEAD_MS) : normal;
  }

  function isOn() { return on; }

  function newGame() {
    on = false; offered = false;
    document.body.classList.remove('hurry');
    paint();
  }

  function setup() {
    const b = $('btn-hurry');
    if (b) b.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); toggle(); });
    newGame();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup);
  else setup();

  window.TDHurry = {
    allowed, update, toggle, isOn, runSecs, deadMs, newGame,
    NORMAL_SECS, HURRY_SECS, SAVED, WINDOW, DEAD_MS,
    _offered: () => offered,
    _setOn: setOn,
  };
})();
