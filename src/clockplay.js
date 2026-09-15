// ============================================================
// TOUCHDOWN FUN — clockplay.js: ⏱️ SPIKE IT & KNEEL IT (Round 12, pick ③)
// ------------------------------------------------------------
// The two plays in football where the POINT of the play is the clock.
//
//   🏈 SPIKE IT   The quarterback catches the snap and throws the ball straight
//                 into the ground. It gains nothing, it costs you a down — and
//                 it STOPS THE CLOCK. You do it when you are behind, time is
//                 nearly gone, and you need the clock to stop RIGHT NOW so your
//                 team can line up and take one more swing.
//
//   🧎 KNEEL IT   The quarterback takes the snap and kneels down. You lose a
//                 yard, you lose a down — and the clock keeps grinding away.
//                 You do it when you are AHEAD at the very end: every second
//                 you burn is a second the other team never gets. Real teams
//                 call this the "victory formation", and it is how almost every
//                 close NFL game actually finishes.
//
// ⚠️ THEY ARE OPPOSITES, AND THAT IS THE WHOLE LESSON. One stops the clock, one
// feeds it. Which one is right depends on one question only: are you winning?
// So this feature shows exactly ONE button, and the button already knows which
// play you need. If neither play makes sense, there is no button at all — which
// is most of the game, and is the reason this doesn't cost the screen anything.
//
// ⚠️ IT ONLY EVER APPEARS WHEN IT COULD ACTUALLY CHANGE THE ENDING. Spiking in
// the first quarter is just throwing a down away: the clock rolling over to Q2
// costs you nothing, so there is nothing to save. The button therefore lives at
// the end of a half and the end of a game, never in between.
//
// ⚠️ AND THAT LINE ABOVE IS A RULE THE CODE HAS TO ENFORCE, NOT JUST A PROMISE.
// The first cut of this file only checked it for the KNEEL, so the spike came
// up at the end of Q1 and Q3 too — the two quarter breaks a drive plays
// straight through (see startBreak: inside a half, your drive carries over).
// Spiking there spends a down to stop a clock that was never going to cost you
// anything. Found by sweeping the situations, not by playing. Same shape as
// v3.1's bug: a comment described the intent and one branch didn't implement it.
//
// THE RULES IT FOLLOWS, in the order it checks them:
//   0. NOT ON 4TH DOWN          spiking or kneeling away a 4th down just hands
//                               the ball over. Downs 1–3 only. (4th down has
//                               its own panel and its own helper — see fourth.js.)
//   0b. NOT IF THE CLOCK IS ALREADY STOPPED   you called a timeout; the next
//                               play is free. Spiking would stop a stopped
//                               clock and kneeling would burn nothing. Both
//                               would cost a down for no reason at all.
//   0c. NOT IN OVERTIME         next score wins, so there is no clock to manage.
//   0d. NOT IN A PERIOD THAT ENDS NOTHING   Q1 and Q3 run straight on into the
//                               next quarter with your drive intact, so there
//                               is no clock to save. End of the HALF or end of
//                               the GAME only.
//   1. AHEAD, LAST PERIOD, AND CLOSE ENOUGH TO RUN IT OUT  →  🧎 KNEEL IT.
//   2. BEHIND OR TIED, CLOCK NEARLY GONE, ENOUGH LEFT TO BE WORTH IT → 🏈 SPIKE IT.
//   3. ANYTHING ELSE            → no button. Go play football.
//
// ⚠️ `advise()` IS A PURE FUNCTION of a plain context object — no globals, no
// DOM — exactly like `TDFourth.advise()`. That is deliberate: a feature whose
// whole job is a JUDGEMENT should have that judgement testable without playing
// a down, so every score / clock / down combination can be swept in one loop.
//
// ⚠️ THE NUMBERS ARE ARCADE NUMBERS, NOT NFL NUMBERS, and they have to be read
// against this game's clock: a quarter is 150 seconds and an ordinary play eats
// 32 of them, so a quarter is only about five plays long. On that scale:
//   · a spike costs 6s   (an incomplete pass already costs 12, and a spike is
//                         quicker than that — the ball is down instantly)
//   · a kneel costs 42s  (MORE than a normal play, because the offence stands
//                         there and milks the play clock before snapping)
// Three kneels = 126 seconds, which is most of a quarter — which is why "can I
// still run this out?" is literally `clock <= 3 kneels` below, rather than a
// number somebody picked. If QUARTER_SECONDS ever changes, these stay honest.
//
// Nothing is saved to storage — there is nothing to remember between games.
// ============================================================
(function () {
  'use strict';

  const $ = id => document.getElementById(id);

  // ---- how much clock each play is worth ---------------------------------
  const SPIKE_SECS = 6;    // the ball is dead the instant it hits the turf
  const KNEEL_SECS = 42;   // stand around, snap late, kneel: the slowest play in football

  // "Can kneeling actually finish this?" — three kneels is all you get before
  // it is 4th down, so that is the window. Derived, not guessed.
  const KNEEL_WINDOW = KNEEL_SECS * 3;

  // "Is the clock nearly gone?" — about two ordinary plays' worth. Any earlier
  // than this and stopping the clock isn't buying you anything you didn't have.
  const LATE = 64;

  // ---- the thinking ------------------------------------------------------
  // ctx = { down, quarter, quarters, clock, my, opp, spot, overtime, stopped, lastPeriod }
  //   down       1..4, this down          clock    seconds left in this period
  //   my/opp     the score right now      spot     your own-goal yard line (0…100)
  //   quarter    which period (1…4)       quarters how many there are (main.js's
  //                                                NUM_QUARTERS — so this file
  //                                                never hardcodes a second copy)
  //   stopped    has a timeout already frozen the clock for this play?
  //   overtime   sudden death?
  //   lastPeriod OPTIONAL override, and it can only ever say "yes, it is".
  //              ⚠️ WE WORK THE PERIOD OUT FROM `quarter` OURSELVES — v3.1's bug
  //              was trusting a caller to pass a `last` flag alongside the
  //              quarter it was already handing over, and a caller that passed
  //              only the quarter fell through every late-game rule. A flag that
  //              can only WIDEN the answer can't bring that bug back. (The
  //              ⏱️ drill needs no override at all: it sets quarter = the last
  //              one on purpose, so it derives correctly for free.)
  //
  // Returns null (no clock play is worth making) or a plain object describing
  // the one play that is: { kind, emoji, name, hint, secs, yards }.
  function advise(ctx) {
    const c = ctx || {};
    const down  = c.down | 0;
    const clock = Math.max(0, c.clock || 0);
    const my    = c.my  | 0;
    const opp   = c.opp | 0;

    // 0. A clock play always costs a down, so on 4th down it is just a giveaway.
    if (down < 1 || down > 3) return null;
    // 0b. The clock is already stopped — both plays would be a wasted down.
    if (c.stopped) return null;
    // 0c. Sudden death: the next score wins, so the clock isn't the problem.
    if (c.overtime) return null;

    // ---- which period is this, and does its ending actually cost anything? ----
    const quarters   = c.quarters || 4;
    const lastPeriod = (c.quarter >= quarters) || !!c.lastPeriod;
    // The half ends on the middle period (Q2 of 4). Q1 and Q3 hand the next
    // quarter straight back to you mid-drive, so their clock hitting 0 changes
    // nothing at all.
    const halfEnd    = (c.quarter * 2 === quarters);
    // 0d. A period whose ending decides nothing: there is no clock to play with.
    if (!lastPeriod && !halfEnd) return null;

    // 1. WINNING, AND THE END IS IN SIGHT → kneel it and go home.
    //    Only in the LAST period: kneeling out the first half throws away a
    //    possession you'd get to keep, and the clock resets at halftime anyway.
    if (my > opp && lastPeriod && clock <= KNEEL_WINDOW) {
      return {
        kind: 'kneel', emoji: '🧎', name: 'KNEEL IT',
        hint: "You're ahead — burn the clock and win it.",
        secs: KNEEL_SECS, yards: -1,
      };
    }

    // 2. NOT WINNING, AND TIME IS NEARLY UP → spike it and get another swing.
    //    ⚠️ `clock > SPIKE_SECS` matters: if the spike itself would run the
    //    period out there is no "next play" to save, and you'd have spent a
    //    down on nothing. The button simply isn't there in that case.
    if (my <= opp && clock <= LATE && clock > SPIKE_SECS) {
      return {
        kind: 'spike', emoji: '🏈', name: 'SPIKE IT',
        hint: 'Stop the clock — you get another play.',
        secs: SPIKE_SECS, yards: 0,
      };
    }

    return null;
  }

  // ---- the button --------------------------------------------------------
  // ONE button, and it is only on the screen when `advise` found a play. main.js
  // calls this at the line of scrimmage and passes null everywhere else.
  let current = null;      // the play the button is currently offering
  let onCall  = null;      // main.js's "do it" handler

  function update(ctx) {
    const b = $('btn-clock');
    current = ctx ? advise(ctx) : null;
    if (!b) return;
    if (!current) { b.style.display = 'none'; return; }
    b.innerHTML = '<span class="cp-ic">' + current.emoji + '</span><small>' +
                  current.name.replace(' IT', '') + '</small>';
    b.classList.toggle('kneel', current.kind === 'kneel');
    b.style.display = 'flex';
    b.title = current.hint;
  }

  function hide() { update(null); }

  // The tap. We hand main.js the whole decision (which play, how much clock,
  // how many yards) so main.js never has to know the rules — it just performs
  // what it was handed. Then the button goes away: the down is over.
  function fire() {
    if (!current || !onCall) return;
    const play = current;
    hide();
    onCall(play);
  }

  function setup(fn) {
    onCall = fn;
    const b = $('btn-clock');
    if (b) b.addEventListener('pointerdown', e => { e.preventDefault(); fire(); });
    hide();
  }

  window.TDClock = {
    advise, update, hide, setup,
    SPIKE_SECS, KNEEL_SECS, KNEEL_WINDOW, LATE,
  };
})();
