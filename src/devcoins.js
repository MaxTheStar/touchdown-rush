// ============================================================
// TOUCHDOWN FUN — devcoins.js: 🪙 MAX'S PRIVATE COIN LINK (not on any draft board)
// ------------------------------------------------------------
// Max asked for unlimited coins "just for me, not for everyone else", automatically. A game that is only static files cannot know who Max is, so
// the switch is a PRIVATE LINK: opening the game with  ?mc=<the secret code>  puts 999,999,999 coins on THAT device and remembers it ('tdr-mc'),
// and from then on every visit on that device tops the coins back up with no link needed. Anybody who plays without the link, or with a wrong
// code, gets nothing and sees nothing: the code never appears in the page, and the link's ?mc= part is removed from the address bar after it is read.
// ⚠️ THIS IS NOT SECURITY, only privacy by obscurity: the repo is public, so anyone who reads this file could use it. It is a harmless coin
// top-up in a kids' game, which is why that is acceptable; it must never unlock anything that costs real money or touches another player.
// ⚠️ NEVER SHIPS TO A PORTAL: build-portal.sh deletes this file and its script tag, and the code below also does nothing under body.portal.
// ⚠️ Coins only: it calls TDShop.earn() (the real path), so nothing else (stats, purchases, streaks, challenges) is bypassed or edited.
// ============================================================
(function () {
  'use strict';
  const CODE = 'mc-f42fe6f94b', FLAG = 'tdr-mc', TARGET = 999999999;
  function topUp() {
    try {
      if (document.body.classList.contains('portal') || !window.TDShop || !TDShop.coins || !TDShop.earn) return false;
      const need = TARGET - TDShop.coins();
      if (need > 0) TDShop.earn(need);
      return true;
    } catch (e) { return false; }
  }
  function run() {
    let on = false;
    try { on = localStorage.getItem(FLAG) === '1'; } catch (e) {}
    try {
      const q = new URLSearchParams(location.search);
      if (q.get('mc') === CODE) {
        on = true;
        try { localStorage.setItem(FLAG, '1'); } catch (e) {}
        q.delete('mc');
        const rest = q.toString();
        try { history.replaceState(null, '', location.pathname + (rest ? '?' + rest : '') + location.hash); } catch (e) {}   // the code leaves the address bar
      }
    } catch (e) {}
    if (on) topUp();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run();
})();
