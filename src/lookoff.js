// ============================================================
// TOUCHDOWN FUN — lookoff.js: 👁 LOOK-OFF (Round 24, pick ⑧)
// ------------------------------------------------------------
// The defense reads your receivers, never your eyes. Real quarterbacks stare down one receiver to drag a safety his way and throw to
// another. Pick 👁 on the special-call button (📋): your FIRST receiver is the one you are staring at (a white eye is drawn over him before the
// snap). For the first 0.7s after the snap every defensive back and linebacker (not the linemen) drifts toward him: their target slides
// 15% of the way from where it was to him.
//
// ⚠️ IT CUTS BOTH WAYS. The men drawn toward the stare receiver leave the OTHER side open; but if you throw to the man you are
// staring at, the defense is already on top of him. Throwing the other way inside 0.7s is the whole play. There is no aim to
// hold: the stare is a choice you make before the snap, so it is never a fast tap. Nothing is saved.
// ============================================================
(function () {
  'use strict';
  const PULL = 0.15, LOOK_MS = 700;
  const td = () => window.__td || null;
  const G  = () => { const t = td(); return t ? t.G : null; };

  function can() { const g = G(); return !!(g && td() && g.state === 'presnap' && g.team != null); }
  function arm() {
    const g = G(), t = td(); if (!g || !t) return;
    g.lookOn = true; g.lookUntil = 0;
    try { t.drawRoutePreview(); } catch (e) {}
  }
  function disarm() {
    const g = G(), t = td(); if (!g || !t) return;
    g.lookOn = false; g.lookUntil = 0;
    try { t.drawRoutePreview(); } catch (e) {}
  }
  function afterSnap() {
    const g = G(), t = td(); if (!g || !t) return;
    g.lookUntil = g.scene.time.now + LOOK_MS;
    t.sayComment('👁 LOOK-OFF! Stare down the first receiver, then throw the OTHER way!');
  }
  // where a defender's target should go right now (pure given the clock): slid PULL of the way toward the stare receiver
  function target(tx, ty, wr, now, until) {
    if (!until || now >= until || !wr) return { x: tx, y: ty };
    return { x: tx + (wr.x - tx) * PULL, y: ty + (wr.y - ty) * PULL };
  }
  // the white eye over the receiver you are staring at
  function draw(gfx, offense) {
    const g = G(); if (!g || !g.lookOn) return;
    const x = offense[2].s.x, y = offense[2].s.y - 36;
    gfx.fillStyle(0xffffff, 0.95); gfx.fillEllipse(x, y, 26, 16);
    gfx.fillStyle(0x1a1a1a, 1); gfx.fillCircle(x, y, 5);
    gfx.lineStyle(2, 0x000000, 0.5); gfx.strokeEllipse(x, y, 26, 16);
  }

  window.TDLook = { PULL, LOOK_MS, can, arm, disarm, afterSnap, target, draw };
  if (window.TDCalls) TDCalls.register({ id: 'lookoff', icon: '👁', label: 'LOOK', can, arm, disarm, afterSnap,
    newPlay: () => { const g = G(); if (g) { g.lookOn = false; g.lookUntil = 0; } } });
})();
