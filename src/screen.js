// ============================================================
// TOUCHDOWN FUN — screen.js: 🧱 THE SCREEN PASS (Round 18, pick ⑧)
// ------------------------------------------------------------
// The opposite trick from 🎭 the draw: instead of keeping the rush off the passer, LET
// IT COME, throw short behind it, and send the blockers out in front of the receiver.
// It is the classic answer to a blitz, and the playbook had nothing like it — the
// swing and flat routes are the closest, and neither has a single blocker in front.
//
// Tap 🧱 SCREEN before the snap and:
//   · the BACK swings out to the flat and WAITS there (a route that stops, so there is
//     a man to throw to);
//   · TWO LINEMEN — the pair on his side — let their men go and run out ahead of him
//     instead of blocking: the quarterback is left with ONE blocker, so the rush gets
//     home fast (that is the price, and it is real);
//   · throw to him (the 3 button, or tap him) and when he has the ball those two linemen
//     run in front of him, and any defender they get a hand on keeps only the speed a
//     blocked rusher keeps (`rushSlow`) — the same rule a pass-blocked rusher uses.
//
// ⚠️ IT HAS TO BE THE RIGHT CALL. Against a BLITZ the linebacker who should be in the
// flat has left (and the rush the screen invites is coming anyway), so it works. Against
// a defense sitting in ZONE its linebackers drop to exactly the place the back is
// waiting and it dies there. That falls out of the defense's own coverage; nothing in
// this file reads the coverage on purpose.
//
// ⚠️ TOO LATE IS A SACK: with two of three blockers gone the quarterback has well under
// a second. Throw at once.
//
// Nothing is saved. This file owns the rule, the button and the escorts; main.js applies
// the back's `screen` route in `routeVelocity()` and asks `sealed()` in the pursuit.
// ============================================================
(function () {
  'use strict';

  const $ = id => document.getElementById(id);
  const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);

  const LAT      = 84;     // how far out to the flat the back swings (px)
  const LEAD     = 54;     // how far in front of the ball the escorts run (px)
  const SEAL_PX  = 34;     // a defender this close to an escort is blocked
  const ESC_SPEED = 192;
  const SEEK_PX  = 230;    // an escort looks this far for a man to block once the back has the ball

  let armed = false;       // called for THIS down
  let active = false;      // the ball was snapped on a called screen
  let side = 1;            // -1 = he swings left, +1 = right
  let flat = null;         // where the back waits
  let esc = [];            // the two escorting linemen

  const td = () => window.__td || null;
  const G  = () => { const t = td(); return t ? t.G : null; };

  function can() {
    const g = G(), t = td();
    if (!g || !t || g.state !== 'presnap' || g.team == null || !g.concept) return false;
    if (window.TDProtect && TDProtect.blocking && TDProtect.blocking(t.offense[1])) return false;   // 🛡 MAX PROTECT: the back is blocking
    if (window.TDPersonnel && TDPersonnel.hasBack && !TDPersonnel.hasBack()) return false;           // 🙌 3 WIDE: no back
    return true;
  }

  function toggle() {
    const g = G(), t = td();
    if (!can() && !armed) return false;
    if (!armed && window.TDDraw && TDDraw.armed()) TDDraw.toggle();     // a down is a draw OR a screen, never both
    if (!armed && window.TDPA && TDPA.armed()) TDPA.toggle();           // …or play action
    if (!armed && window.TDBoot && TDBoot.armed()) TDBoot.toggle();         // …or a bootleg
    armed = !armed;
    t.offense[1].route = armed ? 'screen' : g.concept.rb;
    try { t.drawRoutePreview(); } catch (e) {}
    paint();
    return armed;
  }

  // The ball is snapped. If the screen was called, work out who goes where.
  function snapped() {
    const t = td(); active = false; esc = []; flat = null;
    if (!armed || !t) return;
    const rb = t.offense[1];
    side = rb.startX < 266 ? -1 : 1;
    flat = { x: clamp(rb.startX + side * LAT, 40, 493), y: rb.startY };
    esc = side > 0 ? [t.offense[6], t.offense[5]] : [t.offense[4], t.offense[5]];
    active = true;
  }

  const escorting = ol => active && esc.indexOf(ol) >= 0;

  // Every frame (from main.js's updateLine): each escort goes and FINDS A MAN. Before the catch that is the nearest
  // linebacker or back to where the back is waiting (the men who would be on him the instant he has it — the rush is
  // supposed to come through); once the back has the ball it is the nearest defender level with him or in front.
  // They never go after a down lineman before the catch: that one is the whole point of letting the rush through.
  function update() {
    if (!active) return;
    const g = G(), t = td(); if (!g || !t || !(g.state === 'live' || g.state === 'pass')) return;
    const rb = t.offense[1];
    const has = g.ballCarrier === rb;
    const at = has ? { x: rb.s.x, y: rb.s.y } : flat;
    const home = [
      { x: clamp(at.x - side * 22, 30, 503), y: at.y - LEAD },
      { x: clamp(at.x + side * 20, 30, 503), y: at.y - LEAD - 12 },
    ];
    const taken = new Set();
    esc.forEach((ol, i) => {
      if (!ol || !ol.s) return;
      let best = null, bd = SEEK_PX;
      for (const d of t.defense) {
        if (taken.has(d)) continue;
        if (has ? d.s.y > rb.s.y + 30 : d.role === 'DL') continue;       // after the catch: not the men already behind him; before it: not the rush
        const dd = Math.hypot(d.s.x - at.x, d.s.y - at.y);
        if (dd < bd) { bd = dd; best = d; }
      }
      if (best) { taken.add(best); t.steer(ol.s, best.s.x, best.s.y + 6, ESC_SPEED); }   // get in front of him, goal-side of the runner
      else t.steer(ol.s, home[i].x, home[i].y, ESC_SPEED);
    });
  }

  // Is this defender being blocked by an escort right now? (Any time after the snap: a linebacker an escort has
  // gotten to before the catch is slowed too, which is what makes the flat safe to throw to.)
  function sealed(d) {
    if (!active) return false;
    for (const ol of esc) {
      if (ol && ol.s && Math.hypot(ol.s.x - d.s.x, ol.s.y - d.s.y) < SEAL_PX) return true;
    }
    return false;
  }

  function paint() {
    const b = $('btn-screen'); if (!b) return;
    const g = G();
    b.style.display = (g && g.state === 'presnap' && g.team) ? 'flex' : 'none';
    b.classList.toggle('armed', armed);
    b.classList.toggle('off', !armed && !can());
    const small = b.querySelector('small'); if (small) small.textContent = armed ? 'SCREEN ✓' : 'SCREEN';
  }
  function newPlay() { armed = false; active = false; esc = []; flat = null; paint(); }

  function wire() {
    const b = $('btn-screen');
    if (b) b.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); toggle(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire);
  else wire();

  window.TDScreen = { can, toggle, snapped, update, escorting, sealed, paint, newPlay,
    armed: () => armed, active: () => active, LAT, LEAD, SEAL_PX };
})();
