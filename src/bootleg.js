// ============================================================
// TOUCHDOWN FUN — bootleg.js: 🌀 THE BOOTLEG (Round 19, pick ④)
// ------------------------------------------------------------
// The whole pocket was one place, straight behind the line. Fake the hand-off one way,
// run the OTHER, and the rush that bit on the fake is chasing you from behind.
//
// Tap 🌀 BOOTLEG before the snap and:
//   · the back goes the wrong way and stays (a fake — he is not a receiver on this play);
//   · the quarterback takes over from you for the first half-second and ROLLS OUT, away
//     from the back, toward the sideline with room;
//   · the down linemen bit on the fake: for 0.8s they run at 70% of their speed;
//   · then the quarterback is yours again — run it, or throw on the move.
//
// ⚠️ IT IS A TRADE: you gave up the pocket. The first 0.35s you cannot throw (he is still
// carrying out the fake), and EVERY throw on a bootleg is "on the run": the usual
// bad-throw chance ×1.6 while he is moving. And you have to get to a sideline: a quarterback
// who rolls out and gets caught is tackled in the open with no lineman in front of him.
//
// Nothing is saved. This file owns the rule and the button; main.js drives the roll-out in
// `controlBallCarrier()` and applies the bite in `updateDefense()`.
// ============================================================
(function () {
  'use strict';

  const $ = id => document.getElementById(id);

  const ROLL_MS  = 500;     // the quarterback's roll-out is out of your hands this long
  const ROLL_V   = 130;     // px/s sideways during it
  const LOCK_MS  = 350;     // no throwing while he carries out the fake
  const BITE_MS  = 800;     // how long the down linemen are caught going the other way
  const DL_KEEPS = 0.70;    // …and the share of their speed they keep
  const ON_RUN   = 1.6;     // the bad-throw chance multiplier while he is moving
  const MOVING   = 50;      // px/s: faster than this counts as "on the run"

  let armed = false;
  const td = () => window.__td || null;
  const G  = () => { const t = td(); return t ? t.G : null; };

  const onTheRun = speed => speed > MOVING;

  function can() {
    const g = G(), t = td();
    if (!g || !t || g.state !== 'presnap' || g.team == null || !g.concept) return false;
    if (window.TDProtect && TDProtect.blocking && TDProtect.blocking(t.offense[1])) return false;
    if (window.TDPersonnel && TDPersonnel.hasBack && !TDPersonnel.hasBack()) return false;
    return true;
  }

  function toggle() {
    const g = G(), t = td();
    if (!can() && !armed) return false;
    if (!armed) {                                       // a down is ONE of: bootleg, play action, draw, screen
      if (window.TDDraw && TDDraw.armed()) TDDraw.toggle();
      if (window.TDScreen && TDScreen.armed()) TDScreen.toggle();
      if (window.TDPA && TDPA.armed()) TDPA.toggle();
      if (window.TDCalls) TDCalls.clear();
    }
    armed = !armed;
    t.offense[1].route = armed ? 'hold' : g.concept.rb;
    try { t.drawRoutePreview(); } catch (e) {}
    paint();
    return armed;
  }

  function snapped() {
    const g = G(), t = td(); if (!g) return;
    g.bootUntil = 0; g.bootDlUntil = 0; g.bootleg = false; g.bootDir = 0;
    if (!armed || !t) return;
    const now = g.scene.time.now, rb = t.offense[1].s;
    g.bootleg = true;
    g.bootDir = rb.x < 266 ? 1 : -1;                    // away from the back
    g.bootUntil = now + ROLL_MS; g.bootDlUntil = now + BITE_MS;
    g.fakeLockUntil = Math.max(g.fakeLockUntil || 0, now + LOCK_MS);
    t.sayComment(pick3(['🌀 Bootleg!', '🌀 He fakes it and rolls out!', '🌀 The linemen bit — he is out the back door!']));
  }
  const pick3 = a => a[Math.floor(Math.random() * a.length)];

  function paint() {
    const b = $('btn-boot'); if (!b) return;
    const g = G();
    b.style.display = (g && g.state === 'presnap' && g.team) ? 'flex' : 'none';
    b.classList.toggle('armed', armed);
    b.classList.toggle('off', !armed && !can());
    const small = b.querySelector('small'); if (small) small.textContent = armed ? 'BOOT ✓' : 'BOOTLEG';
  }
  function newPlay() { armed = false; paint(); }

  function wire() {
    const b = $('btn-boot');
    if (b) b.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); toggle(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire);
  else wire();

  window.TDBoot = { can, toggle, snapped, paint, newPlay, onTheRun, armed: () => armed,
    ROLL_MS, ROLL_V, LOCK_MS, BITE_MS, DL_KEEPS, ON_RUN, MOVING };
})();
