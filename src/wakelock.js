// ============================================================
// TOUCHDOWN FUN — wakelock.js: 💡 KEEP SCREEN ON (Round 28, pick ②)  window.TDWake
// ------------------------------------------------------------
// A phone dims and locks after about 30 seconds without a touch, and a drive spent thinking about a 4th-down call is easily that long. While a game
// is on the field this asks the browser for a SCREEN WAKE LOCK, and lets go of it at the menu, so the phone only stays awake when you are playing.
// ⚠️ NOT EVERY BROWSER HAS IT (and a browser may refuse it, for example in low-battery mode), so every call is wrapped and failure means nothing: the
// phone just sleeps like it always did. ⚠️ The lock is dropped by the browser whenever the tab is hidden, so it is re-requested when the tab comes
// back, never assumed to still be held. ⚠️ ON BY DEFAULT (the whole point), with a ⚙️ Settings switch to turn it off. Checks the game's state every
// 2 seconds instead of hooking `beginGame`/`endGame`, so it cannot miss a path out of a game and cannot touch the game loop. Nothing else is saved.
// ============================================================
(function () {
  'use strict';
  let lock = null, want = true, asking = false;
  const supported = () => !!(navigator.wakeLock && navigator.wakeLock.request);
  const inGame = () => { try { const g = window.__td && __td.G; return !!g && g.state !== 'menu'; } catch (e) { return false; } };
  async function acquire() {
    if (lock || asking || !supported() || document.hidden) return;
    asking = true;
    try {
      lock = await navigator.wakeLock.request('screen');
      try { lock.addEventListener('release', () => { lock = null; }); } catch (e) {}
    } catch (e) { lock = null; }
    asking = false;
  }
  function release() {
    if (!lock) return;
    const l = lock; lock = null;
    try { l.release(); } catch (e) {}
  }
  function tick() { if (want && inGame() && !document.hidden) acquire(); else release(); }
  function init() {
    if (window.TDSettings) TDSettings.register({ id: 'wake', label: '💡 Keep screen on', type: 'toggle', def: true,
      hint: 'The phone will not dim or lock while a game is on the field.', onChange: v => { want = !!v; tick(); } });
    setInterval(tick, 2000);
    document.addEventListener('visibilitychange', tick);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  window.TDWake = { supported, held: () => !!lock, tick, _want: () => want };
})();
