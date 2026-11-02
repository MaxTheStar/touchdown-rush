// ============================================================
// TOUCHDOWN FUN — doublemove.js: 🔀 DOUBLE MOVE (Round 24, pick ④)
// ------------------------------------------------------------
// Every route breaks once. A double move fakes one way, then goes the other: the corner bites
// on the first break, and the go route behind him is open for a beat.
//
// Pick 🔀 on the special-call button (📋) and your first receiver runs STUTTER-AND-GO: up 45px, a hard
// jab to the outside (30px), then straight up the field. When he makes the jab, the DBs and
// linebackers within 110px of him BITE: they keep 45% of their speed for 0.7s.
//
// ⚠️ IT IS LATE AND RISKY, OR IT REPLACES THE DEEP BALL. The jab costs him ~0.4s, so he is only
// open down the field about 1.1s after the snap, and a quarterback who stands still is sacked at
// ~0.93s (0.78s on a 🌀 stunt). It is a play for 🛡 MAX PROTECT, a pump fake or a scramble; plain, you
// will usually be hit before he is free. Nothing is saved.
// ============================================================
(function () {
  'use strict';
  const STEM = 45, JAB = 30, BITE = 0.45, BITE_MS = 700, RANGE = 110, JABSPEED = 0.8;
  const td = () => window.__td || null;
  const G  = () => { const t = td(); return t ? t.G : null; };

  function can() {
    const g = G();
    return !!(g && td() && g.state === 'presnap' && g.team != null);
  }
  function arm() {
    const g = G(), t = td(); if (!g || !t) return;
    t.offense[2].route = 'dbl'; g.dblOn = true; g.dblUntil = 0;
    try { t.drawRoutePreview(); } catch (e) {}
  }
  function disarm() {
    const g = G(), t = td(); if (!g || !t) return;
    g.dblOn = false; g.dblUntil = 0;
    if (g.concept) t.offense[2].route = g.concept.wr1;
    try { t.drawRoutePreview(); } catch (e) {}
  }
  function afterSnap() {
    const t = td(); if (t) t.sayComment('🔀 DOUBLE MOVE! Sell the jab, then go deep!');
  }

  // Velocity for the stutter-and-go: up, jab out, then straight up. Starts the bite when the jab begins.
  function vel(o, depth, side, S) {
    const g = G(), OUT = side, lat = Math.abs(o.s.x - o.startX);
    if (depth < STEM && lat < 1) return { vx: 0, vy: -S };
    if (lat < JAB) {
      if (g && g.dblOn && !g.dblUntil) g.dblUntil = g.scene.time.now + BITE_MS;
      return { vx: OUT * S * JABSPEED, vy: -S * 0.12 };
    }
    return { vx: 0, vy: -S };
  }
  // The route sketch (for the pre-snap line).
  function path(o, side, up, clampX) {
    const sx = o.s.x, sy = o.s.y;
    return [{ x: sx, y: sy }, { x: sx, y: up(STEM) }, { x: clampX(sx + side * JAB), y: up(STEM + 6) }, { x: clampX(sx + side * JAB), y: up(250) }];
  }
  // The speed factor for a DB / linebacker right now (pure given the clock and distance).
  const slow = (now, until, dist) => (until && now < until && dist < RANGE ? BITE : 1);

  window.TDDouble = { STEM, JAB, BITE, BITE_MS, RANGE, can, arm, disarm, afterSnap, vel, path, slow };
  if (window.TDCalls) TDCalls.register({ id: 'double', icon: '🔀', label: 'DOUBLE', can, arm, disarm, afterSnap,
    newPlay: () => { const g = G(); if (g) { g.dblOn = false; g.dblUntil = 0; } } });
})();
