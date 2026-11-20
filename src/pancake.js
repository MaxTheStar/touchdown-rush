// ============================================================
// TOUCHDOWN FUN — pancake.js: 🧱 PANCAKE BLOCK (Round 27, pick ⑧)  window.TDPancake
// ------------------------------------------------------------
// Your linemen are real men on the field (the pocket is "a rusher within 30px of an OL is slowed"), but a won block was invisible. Now, when a lineman
// has kept the SAME rusher blocked for 1.1 seconds straight, he FLATTENS him: the rusher goes down on his back (squashed flat, dimmed) for 0.7 seconds,
// an announcer line says so, and while he is down he moves at 35% of his blocked speed. At most ONE pancake a play, and it needs a real, held block.
// ⚠️ SMALL ON PURPOSE: the man was already being slowed by the block (that is what counted the 1.1s), so the extra is a brief further slowdown of a rusher
// who was already losing: it can add a moment to a pocket, never turn one into a wall, and a free rusher (not near a lineman) is never touched.
// ⚠️ A PASS-RUSH THING ONLY: it counts blocks while `nearBlocker()` runs (rushers on pass plays). Runs, kicks and 2-player red-team drives never reach it.
// NOT MEASURED: how often a block really holds 1.1s in a live pocket (the sack comes at ~0.93s unblocked), so the pancake may be rare; the effect is
// capped by the one-a-play rule either way. Nothing is saved. main.js: `nearBlocker(d)` reports to `tick()`, three rusher-speed lines multiply `mult(d)`.
// ============================================================
(function () {
  'use strict';
  const HOLD_MS = 1100, DOWN_MS = 700, DOWN_SPEED = 0.35, GAP_MS = 200;
  let done = false;     // one pancake a play
  const td = () => window.__td || null;

  // pure: given how long a rusher has been continuously blocked, has the block been won? (ms in a row)
  const won = ms => ms >= HOLD_MS;
  // call every frame a rusher is evaluated: blocked = nearBlocker(d), now = scene time (ms)
  function tick(d, blocked, now) {
    if (!d || !blocked) return;
    if (d.pkSeen != null && now - d.pkSeen <= GAP_MS) d.pkRun = (d.pkRun || 0) + (now - d.pkSeen); else d.pkRun = 0;
    d.pkSeen = now;
    if (!done && won(d.pkRun)) pancake(d, now);
  }
  function pancake(d, now) {
    done = true; d.pkDownUntil = now + DOWN_MS; d.pkRun = 0;
    try {
      const t = td();
      if (t && t.G && t.G.scene && d.s) {
        // squash him flat and dim him (steer() rewrites the ROTATION every frame, so a flip would be undone: scale and alpha are not touched)
        const sp = d.s, sx = sp.scaleX, sy = sp.scaleY, al0 = sp.alpha;
        sp.setScale(sx * 1.25, sy * 0.4); sp.setAlpha(0.7);
        t.G.scene.time.delayedCall(DOWN_MS, () => { try { sp.setScale(sx, sy); sp.setAlpha(al0 == null ? 1 : al0); } catch (e) {} });
      }
      td() && td().sayComment('🧱 PANCAKE! He puts the rusher on his back.');
    } catch (e) {}
  }
  // the multiplier on a blocked rusher's speed: 1 normally, 0.35 while he is down
  function mult(d, now) { return d && d.pkDownUntil && now < d.pkDownUntil ? DOWN_SPEED : 1; }
  function newPlay() { done = false; }
  window.TDPancake = { tick, mult, won, newPlay, HOLD_MS, DOWN_MS, DOWN_SPEED, _done: () => done };
})();
