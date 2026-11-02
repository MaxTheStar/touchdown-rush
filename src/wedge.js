// ============================================================
// TOUCHDOWN FUN — wedge.js: 🏁 KICK RETURN WEDGE (Round 24, pick ⑥, moved up on Max's request)
// ------------------------------------------------------------
// A kick or punt return used to be you alone against seven coverage men (the other six offense
// players were hidden). Now five of your teammates are on the field in a V a few yards ahead of the
// returner, and they BLOCK: a coverage man who reaches a blocker is slowed to SLOW (30%) for
// HOLD_MS (1.1s). Then he sheds the block and runs at full speed, and that blocker rests REST_MS before he can
// take another man. Each blocker holds one man at a time.
//
// The blockers run upfield holding the V, at a speed a touch under the returner's, so the lane is
// there if you STAY BEHIND THE WEDGE and gone if you cut outside it (the coverage men who
// were not blocked get you). Same code for kickoffs and punts (both use startKickoff).
//
// ⚠️ 🧱 CALL THE RETURN (retcall.js) still works on top: its wall now has bodies to show it.
// Nothing is saved. main.js: `TDWedge.setup` in startKickoff / startPuntReturn, `TDWedge.update`
// each frame beside updateKickoffCoverage, and `TDWedge.slow(d)` multiplies the coverage speed.
// ============================================================
(function () {
  'use strict';
  const SLOW = 0.30, HOLD_MS = 1100, REST_MS = 600, ENGAGE = 30, SPEED = 185;
  // offsets from the returner (x, y): negative y is upfield
  const V = [[0, -46], [-40, -34], [40, -34], [-80, -22], [80, -22]];
  let st = [];   // per blocker: { o, blocking, until, rest }

  const wallOf = (d) => d && d.wedgeUntil;

  function setup(offense, retX, retY) {
    st = [];
    for (let k = 0; k < V.length; k++) {
      const o = offense[k + 1]; if (!o) continue;
      o.s.setPosition(retX + V[k][0], retY + V[k][1]).setVelocity(0, 0).setVisible(true);
      if (o.label) o.label.setVisible(false);
      st.push({ o, k, blocking: null, until: 0, rest: 0 });
    }
  }

  function update(defense, carrier, now) {
    for (const b of st) {
      const s = b.o.s;
      if (b.blocking && now >= b.until) { b.blocking.wedgeUntil = 0; b.blocking = null; b.rest = now + REST_MS; }
      if (b.blocking) {            // hold him: stay on the man, he is slowed (see slow())
        const d = b.blocking.s, a = Math.atan2(d.y - s.y, d.x - s.x);
        s.setVelocity(Math.cos(a) * 60, Math.sin(a) * 60); s.setRotation(a + Math.PI / 2);
        continue;
      }
      if (now >= b.rest) {         // look for a man to take
        let best = null, bd = ENGAGE;
        for (const d of defense) {
          if (d.wedgeUntil && now < d.wedgeUntil) continue;
          const dd = Math.hypot(d.s.x - s.x, d.s.y - s.y);
          if (dd < bd) { bd = dd; best = d; }
        }
        if (best) { b.blocking = best; b.until = now + HOLD_MS; best.wedgeUntil = b.until; continue; }
      }
      const tx = carrier.x + V[b.k][0], ty = carrier.y + V[b.k][1];   // hold the V ahead of the runner
      const dist = Math.hypot(tx - s.x, ty - s.y), a = Math.atan2(ty - s.y, tx - s.x);
      const sp = Math.min(SPEED, dist * 6);
      s.setVelocity(Math.cos(a) * sp, Math.sin(a) * sp);
      s.setRotation(-Math.PI / 2);
    }
  }

  function slow(d, now) { return (d && d.wedgeUntil && now < d.wedgeUntil) ? SLOW : 1; }
  function clear(defense) { for (const d of defense) d.wedgeUntil = 0; st = []; }

  window.TDWedge = { SLOW, HOLD_MS, REST_MS, ENGAGE, SPEED, V, setup, update, slow, clear };
})();
