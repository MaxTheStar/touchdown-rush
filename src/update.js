// ============================================================
// TOUCHDOWN FUN — update.js: 🔔 NEW VERSION BANNER (Round 30, pick ④)  window.TDUpdate
// ------------------------------------------------------------
// A phone with the game on its home screen can keep running the version it opened with for days, because nothing ever reloads it. Every 10 minutes the page
// quietly asks the server for its own front page, reads the version number out of it (the `?v=` on this very file), and if that is NEWER than the one running,
// shows a small "🔄 New version ready. TAP to update" pill on the FRONT SCREEN. Tapping it reloads. ⚠️ NEVER RELOADS BY ITSELF and never shows mid-game (a reload
// would throw away a drive). It only appears on the front screen (`body.menu`) and is gone as soon as a game starts.
// ⚠️ NETWORK CODE, so `build-portal.sh` DELETES this file and its script tag (a portal build wants no network code at all). ⚠️ It fails silently: offline, a blocked
// request or an odd reply just means no banner. Only ever asks the SAME site for its own page (a relative URL), nothing is sent. A ⚙️ switch (default ON) turns it off.
// ============================================================
(function () {
  'use strict';
  const EVERY_MS = 10 * 60 * 1000, FIRST_MS = 20 * 1000;
  let newer = null, enabled = true, timer = null, bar = null;

  function mine() {
    const s = [...document.scripts].find(x => /src\/update\.js/.test(x.src));
    const m = s && /[?&]v=(\d+)/.exec(s.src); return m ? +m[1] : 0;
  }
  // pure: the highest ?v=N on any local script in a page's HTML (0 if none)
  function versionIn(html) {
    let best = 0, m; const re = /<script[^>]+src="src\/[^"?]+\?v=(\d+)"/g;
    while ((m = re.exec(String(html || '')))) best = Math.max(best, +m[1]);
    return best;
  }
  async function check() {
    if (!enabled || document.hidden) return false;
    try {
      const res = await fetch(location.pathname + (location.search ? location.search + '&' : '?') + 'upd=' + Date.now(), { cache: 'no-store' });
      if (!res.ok) return false;
      const v = versionIn(await res.text());
      if (v > mine() && mine() > 0) { newer = v; paint(); return true; }
    } catch (e) {}
    return false;
  }
  function paint() {
    const want = !!newer && enabled && document.body.classList.contains('menu');
    if (!want) { if (bar) bar.style.display = 'none'; return; }
    if (!bar) {
      bar = document.createElement('div'); bar.id = 'upd-bar';
      bar.style.cssText = 'position:fixed;left:50%;transform:translateX(-50%);z-index:60;padding:4px 14px;border-radius:16px;background:#17325e;border:2px solid #ffd60a;color:#fff;font:800 12px Arial;line-height:16px;cursor:pointer;white-space:nowrap;box-shadow:0 2px 12px rgba(0,0,0,.5)';
      bar.textContent = '🔄 New version ready. TAP to update';
      bar.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); location.reload(); });
      document.body.appendChild(bar);
    }
    // sits in the free strip JUST BELOW the big PLAY button (every front-screen element is fixed-position, and the top rows are full): measured, so it follows PLAY
    const play = document.getElementById('tm-play');
    const pr = play ? play.getBoundingClientRect() : null;
    bar.style.top = Math.max(0, Math.min((pr ? pr.bottom : innerHeight - 40) + 4, innerHeight - 30)) + 'px';
    bar.style.display = 'block';
  }
  function init() {
    if (window.TDSettings) TDSettings.register({ id: 'upd', label: '🔔 Update banner', type: 'toggle', def: true,
      hint: 'Tell me on the front screen when a newer version of the game is ready.', onChange: v => { enabled = !!v; paint(); } });
    setTimeout(check, FIRST_MS); timer = setInterval(check, EVERY_MS);
    setInterval(paint, 1500);               // show it when the front screen next appears, hide it once a game starts
    document.addEventListener('visibilitychange', () => { if (!document.hidden) check(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  window.TDUpdate = { check, versionIn, mine, paint, isNewer: () => newer };
})();
