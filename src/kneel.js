// ============================================================
// TOUCHDOWN FUN — kneel.js: 🧎 THEY KNEEL IT OUT (Round 17, pick ①)
// ------------------------------------------------------------
// They lead by three with ninety seconds left and the ball. Every real team in
// the world does the same thing: line up in the victory formation, snap it, and
// take a knee. Three times. The clock runs and the game is over — it is how
// almost every close game actually ends.
//
// The computer did not. Its drive only ever decided run, pass or kick, so it
// kept throwing like it was the first quarter and handed you the ball back with
// time to win. `clockplay.js` has the kneel (and the spike), but only for YOU.
//
// ⚠️ A SECOND THING WAS MISSING BEHIND IT: YOU COULD NOT FIGHT BACK. The ⏱
// button lives in the top row, and that row is hidden for the whole of the
// computer's drive (it is a menu-less tap-through panel now), so a defense that
// wanted to stop the clock simply could not. The one exception was 🧊 icing the
// kicker, which reaches the same timeouts through its own button. A kneel with
// no answer would have been a wall, not a feature, so the panel now grows a
// ⏱ TIMEOUT row at exactly the moment it matters.
//
// THE RULE (one question: CAN THEY RUN IT OUT?)
//   · only in the LAST period. A lead at the half is not one to sit on, and the
//     clock resets in the third quarter anyway.
//   · only a team that is AHEAD. Tied or behind, they have to score.
//   · only downs 1–3. That is three kneels; on 4th they must do something else.
//   · only if the clock cannot outlast the kneels they have left. Each kneel
//     burns 42 seconds (the same number kneeling costs YOU in clockplay.js: you
//     stand there and milk the play clock), and every timeout YOU still hold
//     stops the clock for one snap, so each one takes a kneel's worth off what
//     they can burn:  burn = 42 × (kneels left − your timeouts).  If the clock is
//     bigger than that, they cannot run it out and they keep playing.
//   · never in overtime, and never when you have just called a timeout: a kneel
//     on a stopped clock uses a down and burns nothing, so they play instead.
//
// ⚠️ `advise()` IS A PURE FUNCTION of a plain object — exactly like
// `TDClock.advise()` and `TDHail.advise()` — so every score / clock / down /
// timeout combination can be swept in one loop.
//
// Nothing is saved. This file owns the rule and the ⏱ row; main.js's
// `DefenseSim.tap()` performs the kneel and `TDGame.defTimeout()` spends the timeout.
// ============================================================
(function () {
  'use strict';

  const $ = id => document.getElementById(id);

  const KNEEL_SECS = 42;     // the same cost as YOUR kneel in clockplay.js (KNEEL_SECS)
  const MAX_KNEELS = 3;      // downs 1, 2 and 3
  const WINDOW = KNEEL_SECS * MAX_KNEELS;   // 126s: more than this and no number of kneels can run it out

  // ---- the thinking ------------------------------------------------------
  // ctx = { down, quarter, quarters, clock, my, opp, overtime, stopped, timeouts }
  //   my / opp   the score from YOUR side (my = you, opp = the team with the ball)
  //   timeouts   how many YOU still hold
  //   stopped    a timeout already froze the clock for the next snap
  // Returns null (they keep playing) or { kind: 'kneel', secs, kneelsLeft }.
  function advise(ctx) {
    const c = ctx || {};
    if (c.overtime || c.stopped) return null;
    const down = c.down | 0;
    if (down < 1 || down > MAX_KNEELS) return null;
    const quarters = c.quarters || 4;
    if (!(c.quarter >= quarters)) return null;                  // only the last period
    if (!((c.opp | 0) > (c.my | 0))) return null;               // only a team that is ahead
    const clock = c.clock || 0;
    if (!(clock > 0)) return null;
    const kneels = MAX_KNEELS - down + 1;                       // 1st: three, 2nd: two, 3rd: one
    const burn = KNEEL_SECS * Math.max(0, kneels - (c.timeouts | 0));
    if (clock > burn) return null;                              // they cannot run it out
    return { kind: 'kneel', secs: KNEEL_SECS, kneelsLeft: kneels };
  }

  // ---- the ⏱ row inside the 🛡 defense panel --------------------------------
  // It exists only when a timeout would actually save you something: it is the
  // last period, they are ahead, the clock is inside the end-game window, you
  // have one to spend, and the drive is not already over.
  // ⚠️ THE WHOLE PANEL IS ONE BIG "TAP TO CONTINUE" BUTTON, so the button must
  // swallow its own tap (the same rule icing.js has) or calling the timeout
  // would also run the next play.
  function showing(ctx) {
    const c = ctx || {};
    if (c.overtime || c.ending || c.stopped) return false;
    if (!(c.quarter >= (c.quarters || 4))) return false;
    if (!((c.opp | 0) > (c.my | 0))) return false;
    const clock = c.clock || 0;
    if (!(clock > 0 && clock <= WINDOW)) return false;
    return (c.timeouts | 0) > 0;
  }

  function refresh(ctx) {
    const row = $('kn-row');
    if (!row) return;
    if (!showing(ctx)) { row.innerHTML = ''; row.style.display = 'none'; return; }
    const c = ctx || {};
    const k = advise(c);
    const left = c.timeouts | 0;
    row.style.display = 'block';
    row.innerHTML =
      '<div class="ice-head">' + (k ? '🧎 THEY ARE GOING TO RUN OUT THE CLOCK' : '⏱ THE CLOCK IS AGAINST YOU') + '</div>' +
      '<div class="ice-why">' + (k
        ? 'Every kneel burns ' + KNEEL_SECS + ' seconds and you are behind. A timeout stops the clock for one snap.'
        : 'You are behind with ' + Math.round(c.clock) + ' seconds left. A timeout stops the clock for the next snap.') + '</div>' +
      '<div class="ice-btn go" id="kn-go">⏱ TIMEOUT &middot; ' + left + ' left</div>';
    const btn = $('kn-go');
    if (btn) {
      btn.addEventListener('pointerdown', e => {
        e.preventDefault();
        e.stopPropagation();
        if (window.TDGame && TDGame.defTimeout) TDGame.defTimeout();
      });
    }
  }

  function clear() { const row = $('kn-row'); if (row) { row.innerHTML = ''; row.style.display = 'none'; } }

  window.TDKneel = { advise, showing, refresh, clear, KNEEL_SECS, MAX_KNEELS, WINDOW };
})();
