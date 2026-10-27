// ============================================================
// TOUCHDOWN FUN — haptics.js: 📳 HAPTICS (Round 22, pick ①)
// ------------------------------------------------------------
// A sack, a touchdown and a fumble all felt the same in your thumbs. Phones can buzz, and the game never asked them to.
//
//   💥 a hit            one short buzz          (18ms)
//   🏆 a touchdown      a long celebration      (40-60-40-60-140)
//   ❌ a turnover/stop  a double thud           (60-40-60)
//   🟨 a flag           a nervous triple        (25-40-25-40-25)
//
// It listens to the effects the game ALREADY makes (the touchdown sting, the big-hit shake, the loss sting), so it needs NO changes to the game's
// code: wrap, don't edit. ⚠️ It is ON by default except where the player has asked for REDUCED MOTION (then it starts OFF), has a switch in ⚙️
// SETTINGS, and does nothing at all when a phone has no vibration motor.
// ⚠️ HONEST LIMIT: iPhone Safari does not implement the Vibration API, so on an iPhone this does nothing. It works on Android phones and tablets.
// ============================================================
(function () {
  'use strict';
  const can = typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
  const PATTERNS = { hit: [18], td: [40, 60, 40, 60, 140], turnover: [60, 40, 60], flag: [25, 40, 25, 40, 25] };
  let calls = 0, last = [];

  function buzz(kind) {
    calls++;
    const on = window.TDSettings ? TDSettings.get('haptics') : true;
    if (!on) return false;
    last = PATTERNS[kind] || PATTERNS.hit;
    if (!can) return false;
    try { return navigator.vibrate(last); } catch (e) { return false; }
  }

  // wrap the game's own effects
  function wrap(obj, fn, kind, only) {
    if (!obj || typeof obj[fn] !== 'function') return;
    const orig = obj[fn];
    obj[fn] = function () { try { if (!only || only.apply(null, arguments)) buzz(kind); } catch (e) {} return orig.apply(this, arguments); };
  }
  function install() {
    const S = window.TDSound;
    if (S && typeof S.sting === 'function') {
      const orig = S.sting;
      S.sting = function (name) { try { if (name === 'td') buzz('td'); else if (name === 'lose') buzz('turnover'); else if (name === 'stuff') buzz('hit'); } catch (e) {} return orig.apply(this, arguments); };
    }
    wrap(window.TDJuice, 'bigHit', 'hit');
    wrap(window.TDHit, 'tackle', 'hit');
  }

  function reducedMotion() { try { return window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } }
  if (window.TDSettings) TDSettings.register({ id: 'haptics', label: '📳 Haptics', type: 'toggle', def: () => !reducedMotion(),
    hint: can ? 'A buzz on big hits, touchdowns, turnovers and flags.' : 'This device has no vibration motor (iPhone Safari cannot buzz). It works on Android.' });
  install();

  window.TDHaptics = { buzz, can, PATTERNS, _calls: () => calls, _last: () => last.slice() };
})();
