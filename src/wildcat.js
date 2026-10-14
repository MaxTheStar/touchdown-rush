// ============================================================
// TOUCHDOWN FUN — wildcat.js: 🐺 THE WILDCAT (Round 19, pick ⑤)
// ------------------------------------------------------------
// Your quarterback is a passer who hands off. The wildcat snaps the ball straight to the
// running back and sends the quarterback out wide, so the defense has to guess who has it.
//
// Pick 🐺 on the special-call button (📋) and:
//   · the back lines up under centre (2½ yards behind the line, not 8) and the quarterback
//     splits out wide as a receiver;
//   · at the snap the BACK has the ball: you steer him, and he can still throw it (a
//     halfback pass to a receiver) because he is behind the line;
//   · the defense is caught guessing: for 0.35 seconds after the snap every defender holds
//     (the quarterback is not where the ball is).
//
// ⚠️ THEY LEARN, like the pump fake: the second wildcat of a possession holds them 0.2s,
// the third not at all. And the quarterback running a route matters — he is a decoy, not a
// target (you cannot throw to him), so a wildcat has ONE fewer receiver than any other
// pass play, and nobody is blocking for a drop-back.
//
// ⚠️ A DIRECT SNAP IS CLOSE AND FAST, WHICH IS WHY IT IS GATED: it is not offered on 3rd or 4th
// and long (more than 5 yards to go), where it would just be a run into a wall.
//
// Nothing is saved. This file owns the rule; calls.js owns the button; main.js applies the
// defenders' hold in `updateDefense()` and lets the quarterback run a route in `updateReceivers()`.
// ============================================================
(function () {
  'use strict';

  const HOLD = [350, 200, 0];       // ms the defense holds: the 1st wildcat of a possession, the 2nd, the 3rd
  const BACK_DEPTH = 40;           // px behind the line the back starts (a normal back is 44-104)
  const BOX_UP = 14, SAFETY_UP = 24;   // px the linebackers and the safety come up when the quarterback splits wide
  const MAX_TO_GO = 5;              // yards: farther than this on 3rd/4th and it is not offered
  const td = () => window.__td || null;
  const G  = () => { const t = td(); return t ? t.G : null; };

  // How long does the defense hold the n-th wildcat of a possession? (pure)
  const holdMs = n => HOLD[Math.max(0, Math.min(HOLD.length - 1, n | 0))];

  // May it be called on this down? (pure)
  function allowed(down, toGo) { return !(down >= 3 && toGo > MAX_TO_GO); }

  function can() {
    const g = G(), t = td();
    if (!g || !t || g.state !== 'presnap' || g.team == null) return false;
    if (window.TDPersonnel && TDPersonnel.hasBack && !TDPersonnel.hasBack()) return false;
    return allowed(g.down, g.firstDownYards - g.losYards);
  }

  function arm() {
    const g = G(), t = td(); if (!g || !t) return;
    const L = g.losY;
    t.place(t.offense[1], 266, L + BACK_DEPTH);          // the back, behind the centre (4 yards, not the usual 6-10)
    // …and the defense SEES the quarterback split wide: the linebackers and the safety on the back crowd the line (the 'stacked box')
    t.place(t.defense[2], 226, L - 46 + BOX_UP);
    t.place(t.defense[3], 306, L - 46 + BOX_UP);
    t.place(t.defense[6], 266, L - 40 + SAFETY_UP);
    // the quarterback splits wide — to whichever side has more room away from the two receivers
    const f = t.FORMATIONS[g.formation] || t.FORMATIONS[0];
    const left = Math.min(f.wr1, f.wr2), right = Math.max(f.wr1, f.wr2);
    const qx = (left - 0) > (533 - right) ? 130 : 403;
    t.place(t.offense[0], qx, L + 14);
    t.offense[0].route = 'streak';                       // a decoy: he runs straight up the field
    t.offense[0].startX = t.offense[0].s.x; t.offense[0].startY = t.offense[0].s.y;
    t.offense[1].startX = t.offense[1].s.x; t.offense[1].startY = t.offense[1].s.y;
    g.wildcat = true;
    try { t.drawRoutePreview(); } catch (e) {}
  }

  function disarm() {
    const g = G(), t = td(); if (!g || !t) return;
    g.wildcat = false;
    const L = g.losY;
    t.place(t.offense[0], 266, L + 60);
    t.offense[0].route = undefined;
    t.place(t.defense[2], 226, L - 46); t.place(t.defense[3], 306, L - 46); t.place(t.defense[6], 266, L - 40);   // the box goes back to normal
    t.layoutSkill(L);                                   // the back and the receivers go back to the formation
    try { t.drawRoutePreview(); } catch (e) {}
  }

  // The ball has just been snapped to the quarterback: hand it to the back instead.
  function afterSnap() {
    const g = G(), t = td(); if (!g || !t || !g.wildcat) return;
    g.ballCarrier = t.offense[1];
    g.scene.cameras.main.startFollow(t.offense[1].s, true, 0.12, 0.12);
    const n = g.wildUses || 0; g.wildUses = n + 1;
    g.wildHoldUntil = g.scene.time.now + holdMs(n);
    t.sayComment(n === 0 ? '🐺 WILDCAT! Direct snap to the back!' : n === 1 ? '🐺 Wildcat again…' : '🐺 They have seen the wildcat.');
  }

  window.TDWild = { holdMs, allowed, can, arm, disarm, afterSnap, HOLD, MAX_TO_GO };
  if (window.TDCalls) TDCalls.register({ id: 'wildcat', icon: '🐺', label: 'WILDCAT', can, arm, disarm, afterSnap,
    newPlay: () => { const g = G(); if (g) { g.wildcat = false; g.wildHoldUntil = 0; } } });
})();
