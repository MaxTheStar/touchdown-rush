// ============================================================
// TOUCHDOWN FUN — playaction.js: 🎣 PLAY ACTION (Round 19, pick ②)
// ------------------------------------------------------------
// Every pass looks like a pass. The oldest trick in football is to fake the hand-off
// first, so the linebackers step up to stop the run and the receivers get open
// behind them. It only works if the run is a real threat — and that is the part
// of it worth building.
//
// Tap 🎣 PLAY ACTION before the snap and:
//   · the back stays home and ride-fakes (he is NOT a receiver on this play);
//   · for the first 0.45 seconds you cannot throw (the quarterback is still carrying out the fake);
//   · for about 0.9 seconds the LINEBACKERS step up toward the line instead of dropping into
//     their zones, which opens the short middle. The rush and the defensive backs are not fooled.
//
// ⚠️ HOW MUCH THEY BITE DEPENDS ON YOUR RUN: it reads 📊 self-scouting. If your last twenty
// calls were nearly all passes, the linebackers have no reason to fear the run and barely move
// (25%); if you mix it up they bite a lot (up to 80%). A team that never runs cannot play-action.
//
// ⚠️ IT COSTS A PLAY'S WORTH OF RECEIVERS: the back is not an option, and the throw window
// (0.45s to the sack at ~0.93s) is narrower than an ordinary pass's.
//
// Nothing is saved. This file owns the rule and the button; main.js applies the bite in
// `updateDefense()` and the back's `hold` route (shared with the draw).
// ============================================================
(function () {
  'use strict';

  const $ = id => document.getElementById(id);

  const LOCK_MS  = 450;     // the quarterback cannot throw while he is still carrying out the fake
  const BITE_MS  = 900;     // how long the linebackers are stepping up
  const MIN_BITE = 0.25;    // a team that only passes: they barely move
  const MAX_BITE = 0.80;    // a team that mixes it up: they bite hard

  let armed = false;
  const td = () => window.__td || null;
  const G  = () => { const t = td(); return t ? t.G : null; };

  // How hard the linebackers bite, from the share of your recent calls that were RUNS (null = no read yet).
  function strength(runShare) {
    const r = runShare == null ? 0.5 : Math.max(0, Math.min(1, runShare));
    return +(MIN_BITE + (MAX_BITE - MIN_BITE) * r).toFixed(3);
  }

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
    if (!armed) {                                       // a down is ONE of: play action, draw, screen
      if (window.TDDraw && TDDraw.armed()) TDDraw.toggle();
      if (window.TDScreen && TDScreen.armed()) TDScreen.toggle();
    }
    armed = !armed;
    t.offense[1].route = armed ? 'hold' : g.concept.rb;
    try { t.drawRoutePreview(); } catch (e) {}
    paint();
    return armed;
  }

  // The ball is snapped: if it was called, start the fake and the bite.
  function snapped() {
    const g = G(), t = td(); if (!g) return;
    g.paUntil = 0; g.paStrength = 0;
    if (!armed || !t) return;
    const share = (window.TDSelf && TDSelf.now) ? (() => { const r = TDSelf.now(); return r && r.ready ? 1 - r.passLean : null; })() : null;
    const s = strength(share);
    const now = g.scene.time.now;
    g.paUntil = now + BITE_MS; g.paStrength = s;
    g.fakeLockUntil = Math.max(g.fakeLockUntil || 0, now + LOCK_MS);     // throwTo() already honours this
    t.sayComment(s >= 0.6 ? '🎣 Play action — the linebackers bite!' : s >= 0.4 ? '🎣 Play action…' : '🎣 Play action — nobody believes the run.');
    try {
      const rb = t.offense[1].s;
      const tag = g.scene.add.text(rb.x, rb.y - 30, 'FAKE!', { fontFamily: 'Arial Black, Arial', fontSize: '15px', color: '#fca5a5', stroke: '#000', strokeThickness: 4 }).setOrigin(0.5).setDepth(27);
      g.scene.tweens.add({ targets: tag, y: tag.y - 22, alpha: 0, duration: 650, ease: 'Cubic.Out', onComplete: () => tag.destroy() });
    } catch (e) {}
  }

  function paint() {
    const b = $('btn-pa'); if (!b) return;
    const g = G();
    b.style.display = (g && g.state === 'presnap' && g.team) ? 'flex' : 'none';
    b.classList.toggle('armed', armed);
    b.classList.toggle('off', !armed && !can());
    const small = b.querySelector('small'); if (small) small.textContent = armed ? 'FAKE ✓' : 'PLAY ACT';
  }
  function newPlay() { armed = false; paint(); }

  function wire() {
    const b = $('btn-pa');
    if (b) b.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); toggle(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire);
  else wire();

  window.TDPA = { strength, can, toggle, snapped, paint, newPlay, armed: () => armed, LOCK_MS, BITE_MS, MIN_BITE, MAX_BITE };
})();
