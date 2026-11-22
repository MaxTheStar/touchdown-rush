// ============================================================
// TOUCHDOWN FUN — offline.js: 📴 PLAY OFFLINE (Round 28, pick ⑦)  window.TDOffline
// ------------------------------------------------------------
// No signal on the bus used to mean no game, because the page was fetched fresh every time. A ⚙️ Settings switch "Play offline" registers the service
// worker in sw.js, which keeps the game's files on the device so it opens with no connection after the first visit (see sw.js for the cache rules).
// ⚠️ OFF BY DEFAULT: a service worker is the one add-on that can leave an old version stuck, so it is opt-in. Switching it OFF unregisters the worker and
// deletes its caches, so the game goes straight back to the old always-fresh behaviour.
// ⚠️ ONLY WHERE IT IS SAFE: https on the real site (github.io) or a page opened with `?sw=1` for testing. Never on a plain localhost dev server (stale caches
// would fight the edit-and-reload loop) and never in the portal build (`build-portal.sh` deletes this file; a portal wants no network code at all).
// The worker is registered as `sw.js?v=<this file's ?v=>`, so every game version is a NEW worker with its own cache and the old one is deleted.
// ============================================================
(function () {
  'use strict';
  const supported = () => !!(navigator.serviceWorker && window.isSecureContext);
  const allowedHere = () => /github\.io$/.test(location.hostname) || /[?&]sw=1\b/.test(location.search);
  function myVersion() {
    const s = [...document.scripts].find(x => /src\/offline\.js/.test(x.src));
    const m = s && /[?&]v=(\d+)/.exec(s.src); return m ? m[1] : '0';
  }
  async function enable() {
    if (!supported() || !allowedHere() || document.body.classList.contains('portal')) return false;
    try { await navigator.serviceWorker.register('sw.js?v=' + myVersion()); return true; } catch (e) { return false; }
  }
  async function disable() {
    try {
      if (navigator.serviceWorker) { const regs = await navigator.serviceWorker.getRegistrations(); await Promise.all(regs.map(r => r.unregister())); }
      if (window.caches) { const names = await caches.keys(); await Promise.all(names.filter(n => n.indexOf('tdf-') === 0).map(n => caches.delete(n))); }
    } catch (e) {}
  }
  function init() {
    if (!window.TDSettings || !supported() || !allowedHere()) return;     // no row where it cannot work
    TDSettings.register({ id: 'offline', label: '📴 Play offline', type: 'toggle', def: false,
      hint: 'Keep the game on this device so it opens with no signal. Turn off to clear it.',
      onChange: v => { if (v) enable(); else disable(); } });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  window.TDOffline = { supported, allowedHere, enable, disable };
})();
