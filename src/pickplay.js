// ============================================================
// TOUCHDOWN FUN — pickplay.js: 🧲 PICK PLAY (Round 24, pick ⑦)
// ------------------------------------------------------------
// Pick 🧲 on the special-call button (📋) and BOTH receivers run shallow drags across the field toward each other. When
// they cross (within 28px) the defender covering the second receiver (the nearest man to the pair when the coverage is a zone) gets run into: he keeps 15% of his speed
// for 0.9s, which is the opening the second receiver walks through.
//
// ⚠️ A PICK IS A PENALTY IN REAL FOOTBALL, so it is a gamble: a throw made while the rub is fresh (until 1.5s after it)
// draws an offensive-pass-interference flag 15% of the time. The flag is a 🟨 incomplete with the ten-yard loss and the lost down of
// intentional grounding: harsher than the real "replay the down", on purpose, so it stays a thing you weigh.
// ⚠️ And both receivers run SHALLOW (about 4-5 yards), so a rub is a short completion, not a big play.
// Nothing is saved. main.js: `TDPick.tick(...)` in updateDefense, `TDPick.slow(d,now)` on coverage speed, `TDPick.flag()` in resolvePass.
// ============================================================
(function () {
  'use strict';
  const NEAR = 28, SLOW = 0.15, SCREEN_MS = 900, FLAG_P = 0.15, FLAG_WINDOW_MS = 1500, REACH = 60, BUNCH = 55;
  const td = () => window.__td || null;
  const G  = () => { const t = td(); return t ? t.G : null; };

  // a bunch set: the receivers start 11 yards apart so the cross comes early. ⚠️ The man covering each one moves with him: the defense does not
  // re-line-up when a receiver moves, so without this the bunch would simply hand them free separation.
  function bunch(t) {
    [[2, -BUNCH], [3, BUNCH]].forEach(([i, off]) => {
      const o = t.offense[i], nx = 266 + off, dx = nx - o.s.x;
      for (const d of t.defense) if (d.role !== 'DL' && d.cover === o.num) d.s.x += dx;
      o.s.x = nx;
    });
  }
  function can() { const g = G(); return !!(g && td() && g.state === 'presnap' && g.team != null); }
  function arm() {
    const g = G(), t = td(); if (!g || !t) return;
    t.offense[2].route = 'drag'; t.offense[3].route = 'drag';
    bunch(t);
    g.pickOn = true; g.pickAt = 0; g.pickDef = null;
    try { t.drawRoutePreview(); } catch (e) {}
  }
  function disarm() {
    const g = G(), t = td(); if (!g || !t) return;
    g.pickOn = false; g.pickAt = 0; g.pickDef = null;
    if (g.concept) { t.offense[2].route = g.concept.wr1; t.offense[3].route = g.concept.wr2; }
    try { t.drawRoutePreview(); } catch (e) {}
  }
  function afterSnap() { const t = td(); if (t) t.sayComment('🧲 PICK PLAY! They cross: throw to the one who gets free (careful: it is a penalty if they see it).'); }

  // every frame: when the two receivers cross, the defender nearest the pair is screened (once a play)
  function tick(offense, defense, now) {
    const g = G(); if (!g || !g.pickOn || g.pickAt) return;
    const a = offense[2].s, b = offense[3].s;
    if (Math.hypot(a.x - b.x, a.y - b.y) > NEAR) return;
    const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    let best = defense.find(d => d.role !== 'DL' && d.cover === offense[3].num) || null, bd = REACH;   // the man on the second receiver is the one run into
    if (best) bd = -1;
    for (const d of defense) {
      if (bd < 0) break;
      if (d.role === 'DL') continue;
      const dd = Math.hypot(d.s.x - mx, d.s.y - my);
      if (dd < bd) { bd = dd; best = d; }
    }
    g.pickAt = now;
    g.pickDef = best;
    if (best) best.pickUntil = now + SCREEN_MS;
  }
  const slow = (d, now) => (d && d.pickUntil && now < d.pickUntil ? SLOW : 1);
  // asked from resolvePass: is this throw flagged? (rolled once per throw)
  function flag(now) {
    const g = G(); if (!g || !g.pickOn || !g.pickAt) return false;
    return now - g.pickAt < FLAG_WINDOW_MS && Math.random() < FLAG_P;
  }

  window.TDPick = { bunch, NEAR, SLOW, SCREEN_MS, FLAG_P, FLAG_WINDOW_MS, can, arm, disarm, afterSnap, tick, slow, flag };
  if (window.TDCalls) TDCalls.register({ id: 'pick', icon: '🧲', label: 'PICK', can, arm, disarm, afterSnap,
    newPlay: () => { const g = G(); if (g) { g.pickOn = false; g.pickAt = 0; g.pickDef = null; } } });
})();
