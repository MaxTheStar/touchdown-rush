// ============================================================
// TOUCHDOWN FUN — jet.js: ✈️ THE JET SWEEP (Round 19, pick ⑥)
// ------------------------------------------------------------
// You can send a man in motion across the formation (👀, Round 14) and that is all he does.
// Real offenses snap the ball as he passes the quarterback and hand it to him at full speed,
// running at the corner while the defense is still turning around.
//
// Pick ✈️ on the special-call button (📋) and:
//   · your second receiver lines up 10 yards off the quarterback, already moving across the
//     formation just behind the line (and the back stays home to fake);
//   · at the snap he runs across at the quarterback; HAND turns green while he is within reach
//     (about 0.2 to 0.8 seconds after the snap — the sack comes at ~0.93s) and the hand-off goes to HIM
//     instead of the back;
//   · he takes it at speed: a 0.6s burst (+15%) after the exchange;
//   · miss the window and he runs on past as a decoy.
//
// ⚠️ IT IS A TIMING PLAY, NOT A BUTTON PRESS: too early and nobody is there (HAND is grey), too
// late and he is past you. And it goes OUTSIDE — to the sideline, where 📍 out of bounds is a
// real thing now — so it is a play for the edge, not the middle.
//
// Nothing is saved. This file owns the rule; calls.js owns the button; main.js hands the ball to
// whichever man the call names (`G.jetOn`) and adds the burst in `runSpeed()`.
// ============================================================
(function () {
  'use strict';

  const BURST_MS = 600, BURST_MULT = 1.15;
  const OFFSET   = 100;                // px off the quarterback the man starts (10 yds)
  const DEPTH    = 52;                 // px behind the line he runs along
  const td = () => window.__td || null;
  const G  = () => { const t = td(); return t ? t.G : null; };

  function can() {
    const g = G(), t = td();
    if (window.TDProtect && TDProtect.blocking && TDProtect.blocking(t.offense[1])) return false;   // 🛡 MAX PROTECT keeps the back in to block
    return !!(g && t && g.state === 'presnap' && g.team != null);
  }

  function arm() {
    const g = G(), t = td(); if (!g || !t) return;
    const L = g.losY, man = t.offense[3];
    // he lines up on the side his formation puts him, and runs the other way
    g.jetSide = man.s.x >= 266 ? 1 : -1;
    t.place(man, 266 + g.jetSide * OFFSET, L + DEPTH);
    man.startX = man.s.x; man.startY = man.s.y; man.route = 'jet';
    t.offense[1].route = 'hold';                         // the back stays home and fakes
    g.jetOn = true;
    try { t.drawRoutePreview(); } catch (e) {}
  }

  function disarm() {
    const g = G(), t = td(); if (!g || !t) return;
    g.jetOn = false;
    t.layoutSkill(g.losY);                               // the receivers and the back go back to the formation
    if (g.concept) { t.offense[3].route = g.concept.wr2; t.offense[1].route = g.concept.rb; }
    try { t.drawRoutePreview(); } catch (e) {}
  }

  function afterSnap() {
    const g = G(), t = td(); if (!g || !g.jetOn) return;
    t.sayComment('✈️ JET MOTION! Hand it off as he goes by!');
  }

  // The burst, asked by main.js's runSpeed() (pure).
  const burst = (now, until) => (until && now < until ? BURST_MULT : 1);

  window.TDJet = { can, arm, disarm, afterSnap, burst, BURST_MS, BURST_MULT, OFFSET, DEPTH };
  if (window.TDCalls) TDCalls.register({ id: 'jet', icon: '✈️', label: 'JET', can, arm, disarm, afterSnap,
    newPlay: () => { const g = G(); if (g) { g.jetOn = false; } } });
})();
