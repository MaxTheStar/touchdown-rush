// ============================================================
// TOUCHDOWN FUN — stunt.js: 🌀 THE STUNT (Round 23, pick ⑦)
// ------------------------------------------------------------
// Every pass rusher in this game charges straight at the quarterback. Real defensive lines TWIST: the two inside men cross,
// one crashes into the other's gap and takes both blockers with him, and the second loops around behind him into a lane that
// nobody is left to block.
//
// On about one pass play in five (not on a blitz), the defense runs one: for the first 0.4s the left rusher (the penetrator) crashes
// across the line at 60% speed and the right rusher (the looper) swings out and behind him; after that the looper rushes the
// quarterback unblocked (no lineman slows him) while the penetrator is tied up. The pocket on a stunt play is about 0.2s shorter.
//
// ⚠️ IT HAS TO BE READABLE, AND THE READ HAS TO BE ABLE TO LIE (the same rule as formation.js). Before the snap the two linemen
// get a pair of crossing red lines; 75% of stunts show it, and 8% of plain plays show it too (a bluff). So it is a tell, not a spoiler.
// ⚠️ IT IS ONLY A SHORTER POCKET ON ABOUT A FIFTH OF PASS PLAYS: measured in DEVLOG v4.95 so the average pocket barely moves.
// 🛡 Pass Protection (protect.js) still slows the rush through `ppRush()`, and a back who stays in to block still counts as a blocker.
//
// Nothing is saved. This file owns the rule and the tell; main.js sets `G.stunt` in callPlay(), runs the lanes in updateDefense()
// and draws the tell in drawRoutePreview().
// ============================================================
(function () {
  'use strict';

  const P = 0.20;             // share of non-blitz plays that are a stunt
  const TELL = 0.75;          // a stunt shows its crossing lines this often …
  const BLUFF = 0.08;         // … and a plain play shows them this often
  const LOOP_MS = 400;        // how long the two men are crossing
  const PEN_SLOW = 0.60;      // the penetrator's speed while he crashes (he is taking two blockers with him)
  const LOOP_X = 1.0;         // the looper's speed while he swings behind

  let on = false, tell = false, t0 = 0;
  const td = () => window.__td || null;

  // callPlay(): decide this play's rush. `blitz` plays are never stunts (one new thing at a time).
  function newPlay(blitz) {
    on = !blitz && Math.random() < P;
    tell = on ? Math.random() < TELL : (!blitz && Math.random() < BLUFF);
    const t = td(); if (t) { t.G.stunt = on; t.G.stuntTell = tell; }
    return on;
  }
  function snapped() { const t = td(); if (t) t0 = t.G.scene.time.now; }
  const isOn = () => on;

  // The lane the two men take (pure given the clock). Returns { tx, ty, mult, free } for a DL, or null for "rush the QB the usual way".
  function lane(idx, elapsedMs, losY, startX) {
    if (!on) return null;
    if (idx === 0) return elapsedMs < LOOP_MS ? { tx: startX[1], ty: losY + 2, mult: PEN_SLOW, free: false } : null;
    if (idx === 1) return elapsedMs < LOOP_MS ? { tx: startX[0], ty: losY - 22, mult: LOOP_X, free: true } : { tx: null, ty: null, mult: 1, free: true };
    return null;
  }
  function laneNow(d) {
    const t = td(); if (!t || !on) return null;
    const G = t.G, i = t.defense.indexOf(d); if (i < 0 || i > 1) return null;
    return lane(i, G.scene.time.now - t0, G.losY, [246, 286]);
  }

  // The tell: a pair of crossing lines between the two linemen, drawn with the route preview before the snap.
  function drawTell(gfx, defense) {
    if (!tell || !gfx) return;
    const a = defense[0].s, b = defense[1].s;
    gfx.lineStyle(4, 0xff5a5a, 0.85);
    gfx.beginPath(); gfx.moveTo(a.x, a.y + 4); gfx.lineTo(b.x, b.y + 22); gfx.strokePath();
    gfx.beginPath(); gfx.moveTo(b.x, b.y + 4); gfx.lineTo(a.x, a.y + 22); gfx.strokePath();
    gfx.fillStyle(0xff5a5a, 0.9); gfx.fillCircle(a.x, a.y + 22, 4); gfx.fillCircle(b.x, b.y + 22, 4);
  }

  window.TDStunt = { newPlay, snapped, isOn, lane, laneNow, drawTell, P, TELL, BLUFF, LOOP_MS, PEN_SLOW, LOOP_X,
    _set: (a, tl) => { on = !!a; tell = !!tl; const t = td(); if (t) { t.G.stunt = on; t.G.stuntTell = tell; } } };
})();
