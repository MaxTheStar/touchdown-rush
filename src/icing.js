// ============================================================
// TOUCHDOWN FUN — icing.js: 🧊 ICE THE KICKER (Round 14, pick ②)
// ------------------------------------------------------------
// Their field-goal unit trots out. You have a timeout in your pocket. Burn it
// right before the snap and make him stand there and think about it — that is
// "icing the kicker", and it is one of the most famous moves in football.
//
// ------------------------------------------------------------
// ⚠️ FIRST, A THING THAT WAS QUIETLY WRONG: THEY NEVER MISSED
// ------------------------------------------------------------
// This file started as "let the player ice the kicker" and immediately hit a
// wall — there was nothing to ice. `cpuDriveEnd('fieldgoal')` simply awarded
// three points. Every field goal the computer has ever attempted, from any
// distance, went in. (Its extra points could miss — 94% — and its two-point
// tries could fail, so the field goal was the odd one out rather than a
// decision anybody made.)
//
// So the first half of this pick is honest kicking: a field goal now MISSES
// sometimes, and a long one misses a lot. Only then does icing mean anything.
//
//     20 yards …… 97%      40 yards …… 76%
//     30 yards …… 86%      50 yards …… 65%      55 (the limit) …… 60%
//
// ⚠️ Those are the MEASURED numbers, checked against the code rather than the
// ones this comment was first written with. An earlier draft of this block
// claimed 92 / 82 / 71 because it was describing a formula that had already
// been changed — and a comment that overstates is a bug nobody thinks to test.
//
// ------------------------------------------------------------
// ⚠️ AND HOW BIG SHOULD ICING BE? SMALLER THAN YOU THINK.
// ------------------------------------------------------------
// In real football the evidence for icing is thin — kickers make roughly the
// same share of kicks iced or not, and sometimes the practice swing helps them.
// A game that turned it into a 30% swing would be teaching something false. So
// it is **6 points of percentage**, which is a real edge on a long kick and
// almost nothing on a short one, and the panel says as much. The honest lesson
// is not "icing works", it is "icing is a small edge that costs you a timeout,
// so spend it when the kick actually matters".
//
// ⚠️ THE TIMEOUT IS REAL. It comes out of the same three ⏱ timeouts that stop
// the clock and buy ⏳ a fresh play clock, and you will want one on the drive
// afterwards. That trade IS the feature.
// ============================================================
(function () {
  'use strict';

  const $ = id => document.getElementById(id);
  const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);

  const NEAR       = 0.97;    // a chip shot
  const FADE       = 0.0105;  // …losing this much for every yard past 17
  // ⚠️ The floor has to sit BELOW the longest kick the game allows, or the
  // curve goes flat before it gets there: at 0.66 every kick from 49 yards to
  // the 55-yard limit came out identical, so a 55-yarder was no braver than a
  // 49-yarder. At 0.58 the odds keep falling all the way to the end of the range.
  const FAR        = 0.58;
  const ICE_COST   = 0.06;    // what standing there thinking costs him
  const SHORT_KICK = 32;      // under this, icing is close to pointless

  let pending = null;   // { dist, iced } while a kick is waiting to be taken

  // ---- the thinking (pure, so every distance can be checked) --------------
  function chance(dist, iced) {
    const d = Math.max(0, dist || 0);
    const base = clamp(NEAR + 0.03 - (d - 17) * FADE, FAR, NEAR);
    return clamp(base - (iced ? ICE_COST : 0), 0.05, NEAR);
  }

  // Is this kick worth a timeout? Not a rule the game enforces — just the
  // honest answer, so the panel can say something true instead of "ICE HIM!!!"
  // ctx = { dist, lead, quarter, clock, quarters, timeouts }
  function worth(ctx) {
    const c = ctx || {};
    const dist = c.dist || 0;
    const lead = c.lead || 0;                    // yours minus theirs, right now
    const last = (c.quarter || 1) >= (c.quarters || 4);
    const late = last && (c.clock || 0) <= 150;
    const swing = lead <= 0 || lead <= 3;        // this kick ties it or wins it for them
    if (dist < SHORT_KICK) {
      return { go: false, why: 'From ' + dist + ' yards he hardly ever misses. A timeout will not change that — keep it.' };
    }
    if (late && swing) {
      return { go: true, why: 'This kick beats you and there is barely any clock left. This is exactly what the timeout is for.' };
    }
    // ⚠️ "Late and long" is not enough on its own. Up 10 with forty seconds
    // left, their field goal still leaves them needing a touchdown AND the
    // ball back — freezing him buys you almost nothing, and the timeout is
    // worth more on the drive you are about to have.
    if (late && lead <= 8) {
      return { go: true, why: 'Long kick, late, and close enough to matter — the best moment you will get to use one.' };
    }
    if (late) {
      return { go: false, why: 'You are far enough ahead that this kick does not really change anything. Save the timeout.' };
    }
    // ⚠️ …and not in the FIRST HALF either, however long the kick is. A timeout
    // burned in the opening quarter is one you do not have in the fourth, and
    // no coach alive freezes a kicker with fifty minutes still to play.
    if (swing && dist >= 45 && (c.quarter || 1) >= (c.quarters || 4) - 1) {
      return { go: true, why: 'It is a long one and it swings the game. Worth a timeout.' };
    }
    return { go: false, why: 'A timeout here buys you six points of a miss. You will want it more on your own drive.' };
  }

  // ============================================================
  // THE KICK ITSELF
  // ============================================================
  // main.js hands the kick over here on its way through `cpuDriveEnd`.
  function begin(dist) { pending = { dist: Math.round(dist || 0), iced: false }; return pending; }
  const waiting = () => !!pending;
  const dist = () => (pending ? pending.dist : 0);
  const iced = () => !!(pending && pending.iced);

  // Did it go in? ⚠️ Clears `pending` as it answers, so one kick is rolled once
  // however many times the panel repaints around it.
  function resolve() {
    const p = pending; pending = null;
    if (!p) return { made: true, dist: 0, iced: false };
    const made = Math.random() < chance(p.dist, p.iced);
    return { made, dist: p.dist, iced: p.iced };
  }

  // ============================================================
  // THE ROW INSIDE THE 🛡 DEFENSE PANEL
  // ------------------------------------------------------------
  // ⚠️ The whole panel is one big "tap to continue" button, so this row's own
  // button MUST swallow its tap — otherwise icing him also advances the play,
  // and you would watch the kick you just paid for sail through while the panel
  // moved on without you.
  // ============================================================
  function refresh(ctx) {
    const row = $('ice-row');
    if (!row) return;
    if (!pending) { row.innerHTML = ''; row.style.display = 'none'; return; }
    row.style.display = 'block';
    const w = worth(Object.assign({ dist: pending.dist }, ctx || {}));
    const left = (ctx && ctx.timeouts) || 0;
    const pct = Math.round(chance(pending.dist, pending.iced) * 100);
    if (pending.iced) {
      row.innerHTML =
        '<div class="ice-head">🧊 TIMEOUT — HE HAS TO WAIT</div>' +
        '<div class="ice-why">' + pending.dist + ' yards, and now he has had a long think about it. ' +
        'His kick is ' + pct + '% instead of ' + Math.round(chance(pending.dist, false) * 100) + '%.</div>';
      return;
    }
    const can = left > 0;
    row.innerHTML =
      '<div class="ice-head">🥅 ' + pending.dist + '-YARD FIELD GOAL &middot; <b>' + pct + '%</b></div>' +
      '<div class="ice-why">' + w.why + '</div>' +
      (can
        ? '<div class="ice-btn' + (w.go ? ' go' : '') + '" id="ice-go">🧊 ICE HIM &middot; costs a timeout (' + left + ' left)</div>'
        : '<div class="ice-why dim">No timeouts left — nothing to do but watch.</div>');
    const btn = $('ice-go');
    if (btn) {
      btn.addEventListener('pointerdown', e => {
        // ⚠️ see the note above: the panel behind this advances on any tap.
        e.preventDefault();
        e.stopPropagation();
        if (window.TDGame && TDGame.iceKicker) TDGame.iceKicker();
      });
    }
  }

  // main.js calls this once the timeout has actually been spent.
  function markIced() { if (pending) pending.iced = true; }

  function clear() {
    pending = null;
    const row = $('ice-row');
    if (row) { row.innerHTML = ''; row.style.display = 'none'; }
  }

  window.TDIce = {
    chance, worth, begin, resolve, refresh, markIced, clear,
    waiting, dist, iced,
  };
})();
