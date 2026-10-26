// ============================================================
// TOUCHDOWN FUN — retcall.js: 🧱 CALL THE RETURN (Round 21, pick ⑥)
// ------------------------------------------------------------
// You catch a punt or a kickoff and run, with the same blockers in the same places every time. Real
// returners and coaches call the return: a wedge up the middle, or a wall to one side.
//
// While the ball is still in the air a row of three buttons is up — ⬅ LEFT · ⬆ MIDDLE · ➡ RIGHT. Pick one and
// your return team sets a WALL on that side:
//
//     the three coverage men on the called side are blocked: they run at 72% speed for 1.5 seconds;
//     the OTHER four read it and run 12% faster for the same 1.5 seconds.
//
// ⚠️ IT IS A BET ON WHERE YOU WILL RUN. Run through your wall and you have a lane. Run away from it and you
// have run into the four men who are now faster. Run straight up the middle against a LEFT or RIGHT call and
// you get the half-blocked men on one side and the quick ones on the other: roughly even. And no call is the
// return you always had.
//
// Nothing is saved. This file owns the walls; main.js asks `mult(i)` for each coverage man every frame.
// ============================================================
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  // the coverage men are lined up [70,190,345,465] across the front and [130,270,410] behind (startKickoff): the three on each side
  const WALLS = { L: [0, 1, 4], M: [1, 5, 2], R: [3, 6, 2] };
  const BLOCKED = { L: 0.72, R: 0.72, M: 0.85 }, OTHERS = 1.12, MS = 1500;   // (the middle wedge is the one a lazy runner uses, so its wall is the weaker one)
  let call = null;

  // The speed multiplier for coverage man `i`, `ms` after the return went live (pure).
  function mult(i, c, ms) {
    if (!c || ms < 0 || ms > MS) return 1;
    return WALLS[c].indexOf(i) >= 0 ? BLOCKED[c] : OTHERS;
  }

  function set(c) { call = (call === c) ? null : c; paint(); return call; }
  function get() { return call; }
  function reset() { call = null; paint(); }

  function paint(show) {
    const row = $('ret-calls'); if (!row) return;
    const g = window.__td && __td.G;
    const on = show != null ? show : !!(g && g.state === 'kickoff' && !g.koLive);
    row.style.display = on ? 'flex' : 'none';
    row.querySelectorAll('[data-c]').forEach(b => b.classList.toggle('on', b.dataset.c === call));
  }

  function wire() {
    const row = $('ret-calls'); if (!row) return;
    row.querySelectorAll('[data-c]').forEach(b => b.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); set(b.dataset.c); }));
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire); else wire();

  window.TDRet = { mult, set, get, reset, paint, WALLS, BLOCKED, OTHERS, MS };
})();
