// ============================================================
// TOUCHDOWN FUN — sw.js: 📴 PLAY OFFLINE (Round 28, pick ⑦). The service worker. Registered by src/offline.js as  sw.js?v=<game version>.
// ------------------------------------------------------------
// WHY IT IS BUILT THIS WAY: a stale cache is exactly how an old version gets stuck on a phone, so the rules are conservative.
//   • THE PAGE (index.html, any navigation) is NETWORK-FIRST: online you always get the newest page; the cached copy is used only when the network fails.
//   • EVERY OTHER FILE is CACHE-FIRST, which is safe because every script is requested as `src/x.js?v=N`: a new game version asks for NEW urls and the
//     old ones are simply never asked for again. Images without a ?v are served from cache and refreshed behind the scenes.
//   • THE CACHE IS NAMED BY THE VERSION in this file's own URL (`tdf-<v>`), so every game version is a new worker with a new cache and the ACTIVATE step
//     deletes every older `tdf-` cache. No version can linger.
//   • ON INSTALL it fetches the page, finds every script it names (including the Phaser engine on the CDN) and stores them, so the FIRST visit is already
//     playable offline. One missing file never fails the install.
//   • ONLY the game's own files and the Phaser CDN are ever cached. Everything else (the world counter, the country lookup) is passed straight to the
//     network and fails quietly when offline, as it always did. Nothing is cached for POST/other methods.
//   • A TEST HOOK: a message {t:'sim-offline', on:true} makes the worker behave as if the network is down, so offline can be proven without a plane.
// ============================================================
const V = new URL(self.location.href).searchParams.get('v') || '0';
const CACHE = 'tdf-' + V;
const PHASER_HOST = 'cdn.jsdelivr.net';
let simOffline = false;

const netFetch = (req, opts) => simOffline ? Promise.reject(new TypeError('simulated offline')) : fetch(req, opts);
const cacheable = url => url.origin === self.location.origin || (url.hostname === PHASER_HOST && url.pathname.indexOf('/npm/phaser@') === 0);

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    const base = new URL('./', self.location.href);
    const urls = [base.href + 'index.html', base.href + 'favicon.png', base.href + 'apple-touch-icon.png', base.href + 'icon-512.png'];
    try {
      const res = await fetch(base.href + 'index.html', { cache: 'no-store' });
      const html = await res.text();
      const re = /<script[^>]+src="([^"]+)"/g; let m;
      while ((m = re.exec(html))) urls.push(new URL(m[1], base).href);
    } catch (e) {}
    await Promise.all(urls.map(async u => {
      try {
        const url = new URL(u);
        const req = url.origin === self.location.origin ? new Request(u) : new Request(u, { mode: 'no-cors' });
        const r = await fetch(req); if (r && (r.ok || r.type === 'opaque')) await cache.put(u, r);
      } catch (e) {}
    }));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(n => n.indexOf('tdf-') === 0 && n !== CACHE).map(n => caches.delete(n)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', e => { if (e.data && e.data.t === 'sim-offline') simOffline = !!e.data.on; });

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (!cacheable(url)) return;                                   // the world counter etc.: straight to the network, as before
  if (req.mode === 'navigate' || url.pathname.endsWith('/index.html')) {            // THE PAGE: network first
    event.respondWith((async () => {
      try {
        const res = await netFetch(req);
        if (res && res.ok) { const c = await caches.open(CACHE); c.put(new URL('index.html', new URL('./', self.location.href)).href, res.clone()); }
        return res;
      } catch (e) {
        const hit = (await caches.match(req, { ignoreSearch: true })) || (await caches.match(new URL('index.html', new URL('./', self.location.href)).href));
        if (hit) return hit;
        throw e;
      }
    })());
    return;
  }
  event.respondWith((async () => {                               // EVERYTHING ELSE: cache first
    const hit = await caches.match(req);
    if (hit) return hit;
    const res = await netFetch(req);
    if (res && (res.ok || res.type === 'opaque')) { try { (await caches.open(CACHE)).put(req, res.clone()); } catch (e) {} }
    return res;
  })());
});
