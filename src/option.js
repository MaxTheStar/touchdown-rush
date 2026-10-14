// ============================================================
// TOUCHDOWN FUN — option.js: 🎯 THE READ OPTION (Round 19, pick ⑧)
// ------------------------------------------------------------
// The quarterback and the back both run, and the quarterback decides AFTER the snap by
// watching one defender: if he takes the back, keep it; if he stays home to chase the
// quarterback, give it. It is the hardest decision in the playbook.
//
// Pick 🎯 on the special-call button (📋) and:
//   · the back lines up beside you (3½ yards to the left) and the quarterback keeps the ball;
//   · ONE defender is "the read": the end on the right of their line. A pulsing ring is on him.
//     The decision is made by HIM, not by a roll on the result: he picks a target at the snap —
//     the back (CRASH) or the quarterback (STAY) — and from then on he really chases it;
//   · for the first third of a second he LEANS toward a target. Three times in four the lean
//     is honest. One time in four it is a FEINT: he leans one way and goes the other;
//   · you choose: press HAND (give it) or run it yourself. Nothing is scripted after that.
//
//     he crashed on the back, you KEPT it   →  he is out of the play: the QB has the edge
//     he crashed on the back, you GAVE it   →  the back is hit at the mesh: a loss
//     he stayed on the QB,   you GAVE it    →  the back has the hole
//     he stayed on the QB,   you KEPT it    →  the QB is hit
//
// ⚠️ EVERYONE ELSE IS BLOCKED for the first 0.9s (the line zone-blocks them; they keep 55% of their speed), because the first
// cut let any of the other tacklers decide the play and the key's choice changed nothing (give: −2.1 yds whichever way he went).
// ⚠️ THE TELL HAS TO BE UNCERTAIN, or a read option is a cheat code (Read the Formation lost
// 64% of their scoring when its tell was always right): a feint a quarter of the time means
// that even a perfect reader is wrong one down in four, and so a player who just gives it every
// time, or keeps it every time, is not much worse than one who reads.
// ⚠️ Whichever he chooses he is COMMITTED for 0.6s after the decision, whoever then has the ball:
// otherwise he would simply swap targets the instant you handed it off.
//
// Nothing is saved. This file owns the key defender; calls.js owns the button; main.js asks
// `target()` for the key defender every frame inside `updateDefense()`.
// ============================================================
(function () {
  'use strict';

  const LEAN_MS   = 350;       // the tell
  const COMMIT_MS = 600;       // committed this long after the decision
  const FEINT     = 0.25;      // the lean is a lie this often
  const LEAN_SPD  = 0.35;      // the key's speed while he leans (a fraction of DEF_SPEED)
  const BACK_X    = -36;       // the back lines up this far left of the QB; BACK_Y: and this far behind the line
  const BACK_Y    = 52;
  let SCALE = 1;               // tests only: the hand-stepped test harness runs physics at 2x the scene clock, so it sets 2 here
  const td = () => window.__td || null;
  const G  = () => { const t = td(); return t ? t.G : null; };

  // What the key does at the snap, and what he shows (pure over two rolls in [0,1)).
  //   crash: true = he goes for the back.   lean: 'RB' | 'QB' = where he LEANS first.
  function decide(r1, r2) {
    const crash = r1 < 0.5;
    const intended = crash ? 'RB' : 'QB';
    const lean = r2 < FEINT ? (crash ? 'QB' : 'RB') : intended;
    return { crash, intended, lean, feint: lean !== intended };
  }

  function can() {
    const g = G(), t = td();
    if (!g || !t || g.state !== 'presnap' || g.team == null) return false;
    if (window.TDProtect && TDProtect.blocking && TDProtect.blocking(t.offense[1])) return false;
    if (window.TDPersonnel && TDPersonnel.hasBack && !TDPersonnel.hasBack()) return false;
    return true;
  }

  let ring = null;
  function arm() {
    const g = G(), t = td(); if (!g || !t) return;
    const L = g.losY;
    t.place(t.offense[1], 266 + BACK_X, L + BACK_Y);
    t.offense[1].startX = t.offense[1].s.x; t.offense[1].startY = t.offense[1].s.y; t.offense[1].route = 'hold';
    g.optOn = true;
    try { t.drawRoutePreview(); } catch (e) {}
  }

  function disarm() {
    const g = G(), t = td(); if (!g || !t) return;
    g.optOn = false; g.optKey = null; killRing();
    t.layoutSkill(g.losY);
    if (g.concept) t.offense[1].route = g.concept.rb;
    try { t.drawRoutePreview(); } catch (e) {}
  }

  function afterSnap() {
    const g = G(), t = td(); if (!g || !g.optOn) return;
    const d = decide(Math.random(), Math.random());
    g.optKey = t.defense[1]; g.optPlan = d;
    g.optT0 = g.scene.time.now; g.optLockUntil = g.optT0 + (LEAN_MS + COMMIT_MS) / SCALE;
    t.sayComment('🎯 READ OPTION! Watch the end — does he take the back?');
    try {                                         // a pulsing ring on the key, so you know whom to watch
      killRing();
      ring = g.scene.add.circle(g.optKey.s.x, g.optKey.s.y, 22, 0xffd60a, 0).setStrokeStyle(3, 0xffd60a, 0.95).setDepth(26);
      g.scene.tweens.add({ targets: ring, scale: 1.35, alpha: 0.4, duration: 450, yoyo: true, repeat: -1 });
    } catch (e) {}
  }
  function killRing() { if (ring) { try { ring.destroy(); } catch (e) {} ring = null; } }

  // Where is the key defender going this frame? null = leave him to the normal brain.
  function target(d) {
    const g = G(), t = td();
    if (!g || !g.optOn || d !== g.optKey || !g.optPlan) return null;
    const now = g.scene.time.now;
    if (now > g.optLockUntil) { killRing(); return null; }
    if (ring) ring.setPosition(d.s.x, d.s.y);
    const at = who => who === 'RB' ? t.offense[1].s : t.offense[0].s;
    if (now - g.optT0 < LEAN_MS / SCALE) { const p = at(g.optPlan.lean); return { x: p.x, y: p.y, slow: LEAN_SPD }; }
    const p = at(g.optPlan.intended);
    return { x: p.x, y: p.y, slow: 1 };
  }

  // The OTHER front-seven defenders are blocked (the line zone-blocks everyone but the read man): they keep this share of their speed
  // for BLOCKED_MS after the snap. Without it a handful of other tacklers decide every option and the read changes nothing.
  const BLOCKED_MS = 900, BLOCKED_KEEPS = 0.55;
  function others(d) {
    const g = G(); if (!g || !g.optOn || d === g.optKey || !(d.role === 'DL' || d.role === 'LB')) return 1;
    return g.scene.time.now - g.optT0 < BLOCKED_MS / SCALE ? BLOCKED_KEEPS : 1;
  }

  window.TDOption = { decide, can, arm, disarm, afterSnap, target, others, LEAN_MS, COMMIT_MS, FEINT, BLOCKED_MS, BLOCKED_KEEPS,
    _timeScale: k => { SCALE = +k > 0 ? +k : 1; return SCALE; } };
  if (window.TDCalls) TDCalls.register({ id: 'option', icon: '🎯', label: 'OPTION', can, arm, disarm, afterSnap,
    newPlay: () => { const g = G(); if (g) { g.optOn = false; g.optKey = null; } killRing(); } });
})();
