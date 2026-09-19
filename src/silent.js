// ============================================================
// TOUCHDOWN FUN — silent.js: 🔇 THE SILENT COUNT (Round 13, pick ⑤)
// ------------------------------------------------------------
// This is the pick the last three were building towards. 📣 The home crowd
// (v3.0) gave the stands a voice. 👕 Home & Away (v4.4) put you in somebody
// else's stadium. ⏳ The play clock (v4.6) gave the seconds before the snap
// some teeth. This is where all three meet.
//
// ⚠️ UNTIL NOW, CROWD NOISE HAS ONLY EVER POINTED ONE WAY. crowd.js tilts
// THEIR offense when your place is rocking, and on the road it hands them a
// flat +3% — but nothing in this game has ever made noise cost YOU anything at
// the line of scrimmage, which is the one thing a hostile crowd is actually
// famous for. A road stadium was a small tax on your defense and a change of
// shirt. Now you can hear it.
//
// ------------------------------------------------------------
// WHAT THE NOISE DOES TO YOU, AND WHY IT IS THESE TWO THINGS
// ------------------------------------------------------------
// A visiting offense loses two things in a loud stadium, and this game happens
// to have machinery for both:
//
//   ⏳ TIME.  The call takes longer to get in through the din, so you have less
//             of the play clock to work with: 15 seconds becomes 11.
//             ⚠️ THIS IS THE HALF YOU FEEL EVERY SINGLE DOWN. It is also what
//             makes the other half bite: a shorter clock means you reach the
//             red more often, and the red is the only place a false start
//             lives. The two compound on their own, which is the whole reason
//             the noise did not need a third effect bolted on.
//   🏃 CALM.  Your linemen are straining to hear a snap count they cannot hear,
//             so they jump: the false-start chance is DOUBLED.
//
// ------------------------------------------------------------
// …AND THE ANSWER, WHICH IS A REAL THING REAL TEAMS DO
// ------------------------------------------------------------
// 🔇 THE SILENT COUNT. Stop shouting. The centre snaps it on a LOOK instead of
// a call — a tap, a leg lift, something the line can SEE. Nobody has to hear
// anything, so nobody jumps at the wrong moment.
//
//   ✅ WHAT IT BUYS: the false-start chance drops to 0.45× — BELOW the home
//      rate. Going silent does not merely cancel the crowd, it beats it, and
//      that is not generosity: a line watching the ball genuinely is the
//      calmest a line ever gets.
//   ❌ WHAT IT COSTS: you are a beat slow off the ball. Everybody moves when
//      they SEE it rather than when they hear it, and that beat belongs to the
//      pass rush — rushers get through their blocker 15% faster.
//
// ⚠️ AND THAT COST IS A PASSING COST ONLY, WHICH IS WORTH KNOWING BEFORE YOU
// TUNE IT. It rides on main.js's `ppRush()`, and that multiplier is read inside
// `updateDefense`'s `qbHasBall` branch — the moment the ball is handed off or
// thrown, every defender switches to hunting the carrier at PURSUE_SPEED and
// the number stops applying. So going silent makes your POCKET worse and does
// nothing at all to a running play. That is a narrower cost than the real
// football version (a real line fires off late on runs too), but it is the
// honest description of what this code does, and it makes the trade cleaner:
// silent is cheapest on the downs you were going to run anyway.
//
// ⚠️ THAT TRADE IS THE ENTIRE FEATURE, and it is a genuinely hard one: you are
// swapping a rare disaster for a small tax on every snap. On 3rd and long with
// two false starts already gone, silent is obviously right. Protecting a lead
// with a max-protect pocket, it is obviously wrong. Neither answer is always
// the answer, which is the only kind of choice worth putting in front of
// somebody.
//
// ------------------------------------------------------------
// ⚠️ "SPICIER, NEVER UNFAIR" — the line Max's chart drew, and how it is held
// ------------------------------------------------------------
//   · THE CLOCK CAN NEVER BE SQUEEZED INTO THE DANGER WINDOW. playclock.js
//     clamps whatever this file asks for to at least DANGER_AT + 5, so there
//     are always five seconds in which a snap is completely safe. That floor
//     lives in playclock.js ON PURPOSE — a number wrong in THIS file cannot
//     reach through and make the road unfair.
//   · EVERY BRAKE ON THE FALSE START STILL HOLDS. Never on 4th down, never two
//     in a row, never on your first snap, at most two a game. Doubling a chance
//     that is capped twice over is still capped twice over.
//   · NONE OF IT EXISTS AT HOME. `noiseMult()` is exactly 1 and `clockSecs()`
//     hands back exactly what it was given, so a home game — and every
//     exhibition, drill and playoff game, which are all at your place — plays
//     precisely as it did before this file existed. That is the rule every one
//     of these features follows.
//
// ------------------------------------------------------------
// WHERE THE SWITCH LIVES, AND WHY IT IS NOT A NEW BUTTON
// ------------------------------------------------------------
// Inside the 🗣️ AUDIBLE panel, as a row of its own — exactly where 🛡 Pass
// Protection went in v4.2, and for exactly the same reason: `#ingame-ctrls` is
// full at four buttons and a fifth slices off the edge of a 375px phone. (⏳ The
// play clock had to shorten its own label to fit beside that row; there is no
// space left up there at all.)
//
// ⚠️ AND OPENING THAT PANEL PAUSES THE PLAY CLOCK, which is not a coincidence —
// it is why this is a safe place to put a decision. You can read the trade-off
// with the clock frozen, which is the whole point of the pause rule in
// playclock.js.
//
// ⚠️ #sc-row IS A SIBLING OF #aud-body, NOT A CHILD. audible.js rewrites that
// body's innerHTML on every render, and anything of ours inside it would be
// wiped the first time you opened the panel. protect.js learned this in v4.2.
//
// ⚠️ IT SAYS ONE SENTENCE, ONCE A GAME. A feature buried inside a panel that a
// nine-year-old has to go looking for is a feature nobody finds, so the first
// line of scrimmage of a road game points at it — once, and then never again.
// (crowd.js deliberately says nothing at all, and that is still right for a
// thing that happens every down. This happens once.)
//
// The call is STICKY across downs, like the protection scheme: you decide how
// you are playing in this building, not on this snap. Nothing is saved — a
// snap count is not something you remember between games.
// ============================================================
(function () {
  'use strict';

  const $ = id => document.getElementById(id);
  const G = () => { try { return window.__td && __td.G; } catch (e) { return null; } };

  // ---- The dials -----------------------------------------------------------
  const ROAD_NOISE  = 2.0;   // × false-start chance on the road, shouting
  const SILENT_CALM = 0.45;  // × false-start chance on the road, silent
  const ROAD_CLOCK  = 0.73;  // × the play clock on the road (15 → 11)
  const SILENT_RUSH = 1.15;  // × how fast a blocked rusher gets through

  let silent = false;   // is the silent count on? (sticky across downs)
  let told   = false;   // have we pointed at it yet this game?

  // ---- Is any of this switched on? ----------------------------------------
  // ⚠️ ONE SOURCE OF TRUTH: TDHome.away() reads the `G.awayGame` flag beginGame
  // set, which is the same flag the white jersey and the hostile crowd read. If
  // this asked the schedule again it could disagree with the shirt you are
  // wearing, and a player who is white-kitted but hearing a home crowd is a bug
  // nobody would ever be able to describe.
  function road() {
    try { return !!(window.TDHome && TDHome.away()); } catch (e) { return false; }
  }
  function available() { return road(); }
  function on() { return road() && silent; }

  // ============================================================
  // WHAT THE REST OF THE GAME ASKS FOR
  // ------------------------------------------------------------
  // Three getters, all of them exactly neutral at home, so the whole file is a
  // no-op in every game that is not a road game.
  // ============================================================

  // ⏳ playclock.js multiplies its chance by this.
  function noiseMult() {
    if (!road()) return 1;
    return silent ? SILENT_CALM : ROAD_NOISE;
  }

  // ⏳ …and asks this how long a fresh play clock is. ⚠️ playclock.js clamps the
  // answer (see fullSecs there) — this can ask for something silly and the game
  // will still be playable, which is the point of putting the floor there.
  function clockSecs(full) {
    const f = +full || 15;
    if (!road()) return f;
    return Math.round(f * ROAD_CLOCK);
  }

  // 🛡 main.js's ppRush() multiplies this into the protection chain. >1 means a
  // blocked rusher keeps MORE of his speed = a weaker pocket = the cost.
  function rushMult() { return on() ? SILENT_RUSH : 1; }

  // ============================================================
  // THE ROW INSIDE THE 🗣️ AUDIBLE PANEL
  // ============================================================
  const OPTS = [
    { id: 'normal', ic: '🗣️', name: 'ON THE CALL', blurb: 'Snap on his voice. Normal get-off — but they can jump.' },
    { id: 'silent', ic: '🔇', name: 'SILENT COUNT', blurb: 'Snap on a look. Calm line — but a beat slow off the ball.' },
  ];

  function paint() {
    const row = $('sc-row');
    if (!row) return;
    // At home there is nothing to decide, so there is nothing on the screen.
    if (!available()) { row.innerHTML = ''; return; }
    row.innerHTML =
      '<div class="sc-head">🔇 SNAP COUNT <i>&middot; it is loud in here</i></div>' +
      '<div class="sc-opts">' +
      OPTS.map(o =>
        '<div class="sc-btn' + ((o.id === 'silent') === silent ? ' on' : '') + '" data-id="' + o.id + '">' +
          '<b>' + o.ic + ' ' + o.name + '</b><span>' + o.blurb + '</span>' +
        '</div>').join('') +
      '</div>';
    row.querySelectorAll('.sc-btn').forEach(el => {
      el.addEventListener('pointerdown', e => {
        // The panel behind this has taps of its own; don't let ours run a play.
        e.preventDefault();
        e.stopPropagation();
        choose(el.getAttribute('data-id') === 'silent');
      });
    });
  }

  function choose(next) {
    if (!available()) return;
    silent = !!next;
    paint();
    if (window.TDSound) TDSound.sting('coin');
  }

  // ---- main.js calls this at every line of scrimmage ----------------------
  function newPlay() {
    paint();
    // The one sentence. ⚠️ Once a game, and only on the road — see the header.
    if (!told && available()) {
      told = true;
      try { __td.sayComment('📣 Listen to this place! Tap 🗣️ to go 🔇 SILENT.'); } catch (e) {}
    }
  }

  function newGame() { silent = false; told = false; paint(); }

  function setup() { paint(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup);
  else setup();

  window.TDSilent = {
    on, available, road, noiseMult, clockSecs, rushMult,
    newPlay, newGame, paint,
    set: choose,
    ROAD_NOISE, SILENT_CALM, ROAD_CLOCK, SILENT_RUSH,
  };
})();
