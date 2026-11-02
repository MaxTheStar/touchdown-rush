// ============================================================
// TOUCHDOWN FUN — mismatch.js: 👀 MISMATCH ARROW (Round 24, pick ①)
// ------------------------------------------------------------
// Before the snap you cannot tell which receiver has the best matchup. This draws a small
// yellow arrow over the receiver whose nearest defender is FARTHEST away right now.
//
// ⚠️ IT IS A HINT, NOT A CHEAT: it reads the pre-snap gap only. Coverage reacts after the
// snap, a man defender closes at the same speed, and it says nothing about the route. It is
// drawn only when the best gap beats the second best by MARGIN px, so a flat look shows nothing.
// Nothing is saved. main.js calls `TDMismatch.draw(routeGfx, offense, defense)` from drawRoutePreview.
// ============================================================
(function () {
  'use strict';
  const MARGIN = 14;      // px the best gap must beat the runner-up by

  function gaps(offense, defense) {
    const out = [];
    for (const o of offense) {
      if (o.role !== 'WR') continue;   // the back sits in an empty backfield: he would always 'win' the gap
      let best = Infinity;
      for (const d of defense) {
        if (d.role === 'DL') continue;
        const g = Math.hypot(d.s.x - o.s.x, d.s.y - o.s.y);
        if (g < best) best = g;
      }
      out.push({ o, gap: best });
    }
    return out.sort((a, b) => b.gap - a.gap);
  }

  function pick(offense, defense) {
    const g = gaps(offense, defense);
    if (g.length < 2 || !isFinite(g[0].gap)) return null;
    return g[0].gap - g[1].gap >= MARGIN ? g[0].o : null;
  }

  function draw(gfx, offense, defense) {
    const o = pick(offense, defense);
    if (!o) return null;
    const x = o.s.x, y = o.s.y - 34;
    gfx.fillStyle(0xffd23a, 0.95);
    gfx.fillTriangle(x - 9, y - 12, x + 9, y - 12, x, y);
    gfx.lineStyle(2, 0x000000, 0.5);
    gfx.strokeTriangle(x - 9, y - 12, x + 9, y - 12, x, y);
    return o;
  }

  window.TDMismatch = { MARGIN, gaps, pick, draw };
})();
