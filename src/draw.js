// ============================================================
// TOUCHDOWN FUN — draw.js: 🎭 THE DRAW PLAY (Round 18, pick ⑦)
// ------------------------------------------------------------
// Every run in this game starts as a run, and a defense that is pinning its ears back
// to rush the passer is exactly the one that a run can beat. The classic answer is the
// DRAW: drop back like it is a pass, let the rush come past you, then hand it to the
// back behind them.
//
// Tap 🎭 DRAW before the snap and:
//   · the back STAYS HOME instead of running a route (so there is a man to hand it to);
//   · the receivers run their routes as usual — it LOOKS like a pass, and that is what
//     the linebackers and the rush believe;
//   · hand it off LATE and the rush is overrun: for 0.65s the down linemen and any
//     blitzer, and to a smaller degree the linebackers, are caught going the wrong way.
//
// ⚠️ IT HAS TO BE READ, NOT JUST PRESSED. A hand-off before 0.75s (the defense has not
// bitten yet — "they read the draw") gets nothing, and one after 2.4s gets nothing
// either (the rush is already on the quarterback). In between the bite depends on what
// the defense is doing:
//   🔥 against a BLITZ the rush is already committed, so it works best;
//   🧱 against a defense that has watched you run all day (📊 self-scouting says your
//      last 20 calls were mostly runs) it works least — they were never in a pass rush.
//
// Nothing is saved. This file owns the rule and the button; main.js applies the bite in
// `updateDefense()` and the back's `hold` route in `routeVelocity()`.
// ============================================================
(function () {
  'use strict';

  const $ = id => document.getElementById(id);

  const READ_S   = 0.75;     // hand off sooner than this and they read it
  const LATE_S   = 2.4;      // …later than this and the rush is already home
  const BITE_MS  = 900;      // how long the overrun lasts
  const GRACE_MS = 650;      // …and for the first part of it nobody can lay a hand on the back (the same free run a broken tackle gives)
  const RUSH     = 0.30;     // the rush's speed while it turns around (a fraction of PURSUE_SPEED)
  const LB       = 0.60;     // …and the linebackers' (the ones who dropped to cover a pass)
  const BLITZ_X  = 0.80;     // a blitz is MORE committed: rush × this (smaller = more overrun)
  const STACK_AT = 0.65;     // above this share of runs, the box is stacked and the bite fades

  let armed = false;
  let SCALE = 1;             // tests only: the hand-stepped test harness runs physics at 2x the scene clock, so it sets 2 here
  let t0 = 0;                // the GAME clock (scene time) at the snap — the same clock the defenders' speeds and the bite run on
  const td = () => window.__td || null;
  const G  = () => { const t = td(); return t ? t.G : null; };

  // ---- the rule (pure, so it can be swept without a game) -------------------------------
  // ctx = { elapsed (s since the snap), blitz (bool), runShare (0..1, your share of runs, or null) }.
  // Returns { rush, lb } speed factors (smaller = more overrun) or null for "nothing happens".
  function bite(ctx) {
    const e = ctx && +ctx.elapsed;
    if (!(e >= READ_S) || e > LATE_S) return null;
    let rush = RUSH, lb = LB;
    if (ctx.blitz) rush *= BLITZ_X;
    const rs = ctx.runShare;
    if (rs != null && rs > STACK_AT) {
      const k = Math.min(1, (rs - STACK_AT) / (1 - STACK_AT));      // 0 at the threshold … 1 if you only ever run
      rush += (1 - rush) * 0.6 * k; lb += (1 - lb) * 0.6 * k;
    }
    return { rush: +rush.toFixed(3), lb: +lb.toFixed(3) };
  }

  function can() {
    const g = G(), t = td();
    if (!g || !t || g.state !== 'presnap' || g.team == null || !g.concept) return false;
    if (window.TDProtect && TDProtect.blocking && TDProtect.blocking(t.offense[1])) return false;   // 🛡 MAX PROTECT keeps him in to block
    if (window.TDPersonnel && TDPersonnel.hasBack && !TDPersonnel.hasBack()) return false;           // 🙌 3 WIDE: no back at all
    return true;
  }

  function toggle() {
    const g = G(), t = td();
    if (!can() && !armed) return false;
    if (!armed && window.TDScreen && TDScreen.armed()) TDScreen.toggle();   // a down is a draw OR a screen, never both
    if (!armed && window.TDPA && TDPA.armed()) TDPA.toggle();               // …or play action
    if (!armed && window.TDBoot && TDBoot.armed()) TDBoot.toggle();         // …or a bootleg
    armed = !armed;
    t.offense[1].route = armed ? 'hold' : g.concept.rb;      // the back stays home, or goes back to his route
    try { t.drawRoutePreview(); } catch (e) {}
    paint();
    return armed;
  }

  // The ball is snapped: start the clock the read is measured against.
  function snapped() { const g = G(); if (g) { t0 = g.scene.time.now; g.drawUntil = 0; g.drawBite = null; } }

  // A hand-off just happened. If this was the draw and it was timed right, the rush is overrun.
  function handoff() {
    const g = G(); if (!armed || !g || g.state !== 'live') return null;
    const qb = td().offense[0].s;
    if (qb.y < g.losY - 2) return null;                       // he has already crossed the line: this is a run, not a draw
    const share = (window.TDSelf && TDSelf.now) ? (() => { const r = TDSelf.now(); return r && r.ready ? 1 - r.passLean : null; })() : null;
    const elapsed = (g.scene.time.now - t0) / 1000 * SCALE;
    const b = bite({ elapsed: elapsed, blitz: !!g.blitz, runShare: share });
    if (!b) {
      td().sayComment(elapsed < READ_S ? '🎭 Too early — they read the draw!' : '🎭 Too late — the rush is home!');
      return null;
    }
    g.drawUntil = g.scene.time.now + BITE_MS / SCALE;
    g.stiffUntil = Math.max(g.stiffUntil || 0, g.scene.time.now + GRACE_MS / SCALE);   // checkTackle() already honours this
    g.drawBite = b;
    td().sayComment('🎭 DRAW! The rush ran right past it!');
    return b;
  }

  function paint() {
    const b = $('btn-draw'); if (!b) return;
    const g = G();
    b.style.display = (g && g.state === 'presnap' && g.team) ? 'flex' : 'none';
    b.classList.toggle('armed', armed);
    b.classList.toggle('off', !armed && !can());
    const small = b.querySelector('small'); if (small) small.textContent = armed ? 'DRAW ✓' : 'DRAW';
  }
  function newPlay() { armed = false; paint(); }

  function wire() {
    const b = $('btn-draw');
    if (b) b.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); toggle(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire);
  else wire();

  window.TDDraw = { bite, can, toggle, snapped, handoff, paint, newPlay, armed: () => armed,
    READ_S, LATE_S, BITE_MS, GRACE_MS, RUSH, LB, BLITZ_X, STACK_AT,
    _timeScale: k => { SCALE = +k > 0 ? +k : 1; return SCALE; } };
})();
