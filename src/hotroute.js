// ============================================================
// TOUCHDOWN FUN — hotroute.js: 🪁 HOT ROUTE (Round 19, pick ⑦)
// ------------------------------------------------------------
// The audible is pre-snap. Once the ball is snapped, every receiver runs the route he was
// given, even when a linebacker is blitzing straight at the quarterback. Real quarterbacks and
// receivers adjust on the fly: the receiver the blitzer left behind turns into a quick
// route to the hole, and the ball is out before the rush gets there.
//
// When they BLITZ (the game has always shouted it at the snap) a 🪁 HOT button shows. Tap it
// and the receiver closest to where the blitzer came from drops what he was doing and cuts
// to the hole — about 4 yards past the line, just inside where the blitzing linebacker used to
// stand — and stops there, open.
//
// ⚠️ IT ONLY EXISTS WHILE IT CAN WORK: they must be blitzing, you must still have the ball behind
// the line, nobody within 5 yards of you yet, and the hot man must not already be deep. After
// that the rush is home and the button is gone.
// ⚠️ THE PRICE IS HIS ROUTE: he was a deep or medium option and he is not any more (and he is
// the only man who changes), so a hot route is a safe, short answer, not a bigger play.
// ⚠️ IT DOES NOTHING FOR YOU AGAINST COVERAGE: no blitz, no button.
//
// Nothing is saved. This file owns the rule and the button; main.js runs the `hot` route.
// ============================================================
(function () {
  'use strict';

  const $ = id => document.getElementById(id);
  const HOLE_DEPTH = 36;       // px past the line the hot man stops (3.6 yds)
  const HOLE_X     = 238;      // just inside where the blitzing linebacker used to stand (x 226)
  const ROOM_PX    = 52;       // no rusher closer than this, or it is too late
  const REACH_PX   = 135;      // the hot man must be within this of the hole
  const td = () => window.__td || null;
  const G  = () => { const t = td(); return t ? t.G : null; };

  // Which receiver is hot? The WR nearest the hole (pure over positions).
  function pickMan(wrs, hole) {
    let best = null, bd = Infinity;
    for (const w of wrs) { const d = Math.hypot(w.x - hole.x, w.y - hole.y); if (d < bd) { bd = d; best = w; } }
    return best ? { w: best, dist: bd } : null;
  }

  // Is the button up? Returns null, or { man (offense index), hole }.
  function status() {
    const g = G(), t = td();
    if (!g || !t || g.state !== 'live' || g.cpu || g.hasPassed || !g.blitz || g.hotMan) return null;
    if (g.ballCarrier !== t.offense[0]) return null;
    if (window.TDStar && TDStar.on()) return null;
    const qb = t.offense[0].s;
    if (qb.y < g.losY - 2) return null;                                       // across the line: he is a runner now
    for (const d of t.defense) if (Math.hypot(d.s.x - qb.x, d.s.y - qb.y) < ROOM_PX) return null;   // the rush is home
    const blitzer = { x: HOLE_X - 12, y: g.losY - HOLE_DEPTH };                // where the blitzing linebacker came from
    const cand = [{ i: 2, x: t.offense[2].s.x, y: t.offense[2].s.y }, { i: 3, x: t.offense[3].s.x, y: t.offense[3].s.y }];
    const p = pickMan(cand, blitzer);
    if (!p) return null;
    // the hole is on the line from the hot man toward the blitzer's side, two thirds of the way there
    const hole = { x: Math.round(p.w.x + (blitzer.x - p.w.x) * 0.65), y: g.losY - HOLE_DEPTH };
    if (Math.hypot(p.w.x - hole.x, p.w.y - hole.y) > REACH_PX) return null;       // he is already too deep to come back
    return { man: p.w.i, hole };
  }

  function press() {
    const g = G(), t = td(); const st = status(); if (!st) return false;
    const rec = t.offense[st.man];
    g.hotMan = rec; g.hotSpot = st.hole; rec.route = 'hot';
    t.sayComment('🪁 HOT ROUTE! He cuts to the hole the blitzer left!');
    if (window.TDSound) TDSound.sting('coin');
    return true;
  }

  function paint() {
    const b = $('btn-hotroute'); if (!b) return;
    b.style.display = status() ? 'flex' : 'none';
  }

  function wire() {
    const b = $('btn-hotroute');
    if (b) b.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); press(); paint(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire);
  else wire();

  window.TDHotRoute = { status, press, paint, pickMan, HOLE_DEPTH, HOLE_X, ROOM_PX, REACH_PX };
})();
