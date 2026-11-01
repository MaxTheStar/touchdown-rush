// ============================================================
// TOUCHDOWN FUN — reverse.js: 🔁 THE REVERSE (Round 23, pick ⑥)
// ------------------------------------------------------------
// Every run in this game goes to the man you hand it to, once. A real reverse hands it to the back, the defense
// chases him one way, and then the ball goes BACK the other way to a receiver coming across behind him.
//
// Pick 🔁 on the special-call button (📋) and:
//   · your second receiver lines up on the far side, ~13 yards off the quarterback, and at the snap runs across
//     the backfield toward the other side (just behind the back); the back stays home to take the hand-off;
//   · hand it to the back as always (HAND). He now has the ball behind the line;
//   · when the receiver comes within reach of him (60px) HAND lights up AGAIN — tap it and the ball goes to the receiver.
//     No new button: the HAND key / button / H is the second exchange;
//   · if the defense has bitten (the exchange comes 0.2 to 1.2 s after the first hand-off) the linemen and
//     linebackers who chased the back are caught going the wrong way for 0.9s, and the receiver takes it at speed
//     (the same free run a broken tackle gives, 0.4s). Too early: they read it. Too late: the pile is on the back.
//
// ⚠️ IT IS A TIMING PLAY AND IT HAS A PRICE: the receiver is not running a route (one fewer target, like the jet),
// the back is slower to the hole than on a plain run (he stays home), and an exchange outside the window gets nothing
// except a receiver who is now carrying it from behind the line. Nothing is saved. This file owns the rule; calls.js owns the
// button; main.js runs the receiver across (`route 'rev'`) and asks `ready()` / `exchange()` on the HAND tap.
// ============================================================
(function () {
  'use strict';

  const OFFSET = 120;                  // px off the quarterback the man starts (12 yds). MEASURED: a back who takes the hand-off and stands still is tackled at 0.5s (not the QB's 0.93s: the OL does not hold the rush off a runner), so the man has to come to him fast
  const DEPTH  = 66;                   // px behind the line he runs along (just behind the back)
  const SPAN   = 300;                  // how far across he runs before he turns upfield (a decoy if nobody hands it to him)
  const SPEED  = 0.65;                 // his speed across, as a share of a receiver's (the back runs TOWARD him, so they close at ~330px/s)
  const READ_S = 0.20, LATE_S = 1.2;   // seconds after the FIRST hand-off: before READ_S they read it, after LATE_S the pile is on the back
  const BITE_MS = 900, GRACE_MS = 400, BITE = 0.5, BURST_MS = 600;
  const REACH = 75;                    // a little wider than a plain hand-off (HANDOFF_DIST 60): it is a pitch-back, and the window is only ~0.45s
  const td = () => window.__td || null;
  const G  = () => { const t = td(); return t ? t.G : null; };

  function can() {
    const g = G(), t = td();
    if (window.TDProtect && TDProtect.blocking && TDProtect.blocking(t.offense[1])) return false;   // 🛡 MAX PROTECT keeps the back in to block
    if (window.TDPersonnel && TDPersonnel.hasBack && !TDPersonnel.hasBack()) return false;           // 🙌 3 WIDE: nobody to hand it to first
    return !!(g && t && g.state === 'presnap' && g.team != null);
  }

  function arm() {
    const g = G(), t = td(); if (!g || !t) return;
    const L = g.losY, man = t.offense[3];
    g.revSide = man.s.x >= 266 ? 1 : -1;               // he starts on his formation's side and runs the other way
    t.place(man, Math.max(40, Math.min(493, 266 + g.revSide * OFFSET)), L + DEPTH);
    man.startX = man.s.x; man.startY = man.s.y; man.route = 'rev';
    t.offense[1].route = 'hold';                        // the back stays home to take the hand-off
    g.revOn = true; g.revDone = false; g.revT0 = 0;
    try { t.drawRoutePreview(); } catch (e) {}
  }

  function disarm() {
    const g = G(), t = td(); if (!g || !t) return;
    g.revOn = false; g.revDone = false;
    t.layoutSkill(g.losY);
    if (g.concept) { t.offense[3].route = g.concept.wr2; t.offense[1].route = g.concept.rb; }
    try { t.drawRoutePreview(); } catch (e) {}
  }

  function afterSnap() {
    const g = G(), t = td(); if (!g || !g.revOn) return;
    t.sayComment('🔁 REVERSE! Hand it off — then give it back as he comes across!');
  }

  // main.js's handOff() tells us the first exchange just happened.
  function handoff() { const g = G(); if (g && g.revOn && !g.revT0) g.revT0 = g.scene.time.now; }

  // Is the second exchange available right now? (the HAND tap asks this before it asks for an ordinary hand-off)
  function ready() {
    const g = G(), t = td();
    if (!g || !t || !g.revOn || g.revDone || g.state !== 'live' || g.ballCarrier !== t.offense[1] || g.hasPassed) return false;
    if (t.offense[1].s.y < g.losY - 2) return false;     // across the line it is a run, not a reverse
    const a = t.offense[1].s, b = t.offense[3].s;
    return Math.hypot(a.x - b.x, a.y - b.y) <= REACH;
  }

  // The pure rule: seconds since the first hand-off -> the speed factor of the men who chased the back (or null: no bite).
  function bite(elapsed) { return (elapsed >= READ_S && elapsed <= LATE_S) ? BITE : null; }

  function exchange() {
    const g = G(), t = td(); if (!ready()) return false;
    const now = g.scene.time.now, el = (now - g.revT0) / 1000;
    const b = bite(el);
    g.revDone = true;
    g.ballCarrier = t.offense[3];
    g.scene.cameras.main.startFollow(t.offense[3].s, true, 0.12, 0.12);
    if (b) {
      g.drawBite = { rush: b, lb: b }; g.drawUntil = now + BITE_MS;
      g.stiffUntil = Math.max(g.stiffUntil || 0, now + GRACE_MS);
      if (window.TDJet) g.jetBurstUntil = now + BURST_MS;
      t.sayComment('🔁 REVERSE! The whole defense ran the wrong way!');
    } else {
      t.sayComment(el < READ_S ? '🔁 Too early — they read the reverse!' : '🔁 Too late — they were all over the back!');
    }
    return true;
  }

  window.TDReverse = { can, arm, disarm, afterSnap, handoff, ready, exchange, bite, SPEED, READ_S, LATE_S, BITE_MS, GRACE_MS, BITE, OFFSET, DEPTH, SPAN, REACH };
  if (window.TDCalls) TDCalls.register({ id: 'reverse', icon: '🔁', label: 'REVERSE', can, arm, disarm, afterSnap,
    newPlay: () => { const g = G(); if (g) { g.revOn = false; g.revDone = false; g.revT0 = 0; } } });
})();
