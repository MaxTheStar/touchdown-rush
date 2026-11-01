// ============================================================
// TOUCHDOWN FUN — hooklat.js: 🪃 HOOK AND LATERAL (Round 23, pick ⑧)
// ------------------------------------------------------------
// The longest plays in real football end with the ball tossed back across the field to a trailing teammate: a receiver catches a
// short hook, the whole defense converges on HIM, and he flips it backwards to the man who has been running behind him all along.
//
// Pick 🪃 on the special-call button (📋) and:
//   · your first receiver runs a HOOK (up, then back toward the quarterback — the curl route);
//   · your back does not stay home: he runs UP the field a few steps behind that receiver (his `trail` route);
//   · throw to the receiver as usual. When he has the ball in the open field, tap SPACE (or the big HIKE button, or PITCH): the ball
//     goes backwards to the trailing back (the ordinary 🔄 pitch, v4.19, with its ordinary 5%+ chance of a dropped ball and its
//     live-ball scramble). No new button: the lateral is the key you already use after the snap.
//   · a CLEAN lateral off a hook catches the defenders who were closing on the receiver going the wrong way: the DBs and linebackers
//     keep 60% of their speed for 0.8s — the new runner has a head start on top of the pitch's own 0.65s burst.
//
// ⚠️ IT HAS A REAL PRICE: the back is not a blocker and not a check-down, the hook is a short catch (a 5–8 yard gain if you just run it),
// and a lateral is a live ball — a pitch with a defender on the trailing man's hip is a turnover waiting to happen (pitch.js, unchanged).
// Nothing is saved. This file owns the rule; calls.js owns the button; main.js runs the back's `trail` route and applies the bite.
// ============================================================
(function () {
  'use strict';

  const BITE_MS = 800, BITE = 0.60;
  const TRAIL_BEHIND = 30;             // px the back stays behind the hook man
  const td = () => window.__td || null;
  const G  = () => { const t = td(); return t ? t.G : null; };

  function can() {
    const g = G(), t = td();
    if (window.TDProtect && TDProtect.blocking && TDProtect.blocking(t.offense[1])) return false;   // 🛡 MAX PROTECT keeps the back in to block
    if (window.TDPersonnel && TDPersonnel.hasBack && !TDPersonnel.hasBack()) return false;           // 🙌 3 WIDE: nobody trails
    return !!(g && t && g.state === 'presnap' && g.team != null);
  }

  function arm() {
    const g = G(), t = td(); if (!g || !t) return;
    t.offense[2].route = 'curl';        // the hook
    t.offense[1].route = 'trail';       // the back runs up behind him
    g.hlOn = true; g.hlUntil = 0;
    try { t.drawRoutePreview(); } catch (e) {}
  }

  function disarm() {
    const g = G(), t = td(); if (!g || !t) return;
    g.hlOn = false; g.hlUntil = 0;
    if (g.concept) { t.offense[2].route = g.concept.wr1; t.offense[1].route = g.concept.rb; }
    try { t.drawRoutePreview(); } catch (e) {}
  }

  function afterSnap() {
    const g = G(), t = td(); if (!g || !g.hlOn) return;
    t.sayComment('🪃 HOOK AND LATERAL! Throw it to the hook — then flip it back!');
  }

  // Is the lateral available on the SPACE / HIKE tap right now? The hook man has the ball in the open field and the back can take it.
  function ready() {
    const g = G(), t = td();
    if (!g || !t || !g.hlOn || g.state !== 'live' || g.ballCarrier !== t.offense[2]) return false;
    const pt = t.pitchTarget && t.pitchTarget();
    return !!(pt && pt.o === t.offense[1]);
  }

  // main.js's clean-pitch branch: did a hook man just lateral to the trailing back? Then the pursuit overran.
  function pitched(from, rec) {
    const g = G(), t = td(); if (!g || !g.hlOn || !t) return false;
    if (from !== t.offense[2] || rec !== t.offense[1]) return false;
    g.hlUntil = g.scene.time.now + BITE_MS;
    t.sayComment('🪃 LATERAL! The whole defense was chasing the wrong man!');
    return true;
  }

  // The speed factor for a chasing DB / linebacker right now (pure given the clock).
  const slow = (now, until) => (until && now < until ? BITE : 1);

  window.TDHookLat = { can, arm, disarm, afterSnap, ready, pitched, slow, BITE, BITE_MS, TRAIL_BEHIND };
  if (window.TDCalls) TDCalls.register({ id: 'hooklat', icon: '🪃', label: 'HOOK+LAT', can, arm, disarm, afterSnap,
    newPlay: () => { const g = G(); if (g) { g.hlOn = false; g.hlUntil = 0; } } });
})();
