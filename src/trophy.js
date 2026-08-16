// ============================================================
// TOUCHDOWN FUN — trophy.js: 🏆 THE TROPHY CASE
// ------------------------------------------------------------
// A shelf that shows off EVERYTHING you've earned, all in one place:
//
//   🏅 RECORDS — your team level & title, championships won, games
//      played, and coins in the bank.
//   🎽 UNIFORM CABINET — every style in the game. The ones you own glow
//      in their colors; the rest sit locked with a hint for how to earn
//      them (a daily-reward day, the Pro Shop, or the Max Bowl).
//   🏆 BADGES — little milestones that light up as you hit them
//      (first game, 10 games, a championship, level 10, and so on).
//
// This screen OWNS nothing — it just READS what the other files already
// remember (shop coins & uniforms, progress level, season titles, the
// world tracker's game count, your best draft grade). So it's always in
// sync and can never break your save. Open it, feel proud, close it.
//
// main.js talks to us through window.TDTrophy — see the bottom.
// ============================================================
(function () {
  'use strict';

  const T = window.TDStats ? TDStats.shared : null;
  const load = (k, f) => (T ? T.load(k, f) : f);
  const $ = id => document.getElementById(id);
  const hex = n => '#' + (n >>> 0).toString(16).padStart(6, '0');   // 0x3b1e6e → "#3b1e6e"

  // ---- 📥 Gather everything you've earned (all read live) -----------------
  function gather() {
    const level  = window.TDProgress ? TDProgress.level() : 1;
    const title  = window.TDProgress ? TDProgress.title() : 'ROOKIE';
    const coins  = window.TDShop ? TDShop.coins() : 0;
    const games  = load('games', 0);                 // finished games (stats.js)
    const titles = load('titles', 0);                // Max Bowl wins (season.js)
    const draftbest = load('draftbest', '');         // best grade: D..A+ (draft.js)
    const uniforms  = (window.TDShop && TDShop.uniformCatalog) ? TDShop.uniformCatalog() : [];
    const ownedCount = uniforms.filter(u => u.owned).length;
    return { level, title, coins, games, titles, draftbest, uniforms, ownedCount };
  }

  // ---- 🏆 The milestone badges (earned vs still-locked) -------------------
  function badgesFor(g) {
    const aGrade = (g.draftbest || '').charAt(0) === 'A';   // 'A' or 'A+'
    return [
      { icon: '🏈', name: 'First Snap', need: 'Finish 1 game',        got: g.games >= 1 },
      { icon: '🎮', name: 'Gamer',      need: 'Finish 10 games',      got: g.games >= 10 },
      { icon: '🎖️', name: 'Veteran',    need: 'Finish 25 games',      got: g.games >= 25 },
      { icon: '🏆', name: 'Champion',   need: 'Win the Max Bowl',     got: g.titles >= 1 },
      { icon: '👑', name: 'Dynasty',    need: 'Win 3 Max Bowls',      got: g.titles >= 3 },
      { icon: '⭐', name: 'All-Star',   need: 'Reach team level 5',   got: g.level >= 5 },
      { icon: '🌟', name: 'Legend',     need: 'Reach team level 10',  got: g.level >= 10 },
      { icon: '🎽', name: 'Collector',  need: 'Own 5 uniforms',       got: g.ownedCount >= 5 },
      { icon: '💰', name: 'Moneybags',  need: 'Save up 500 coins',    got: g.coins >= 500 },
      { icon: '🎯', name: 'Draft Ace',  need: 'Earn an A+ draft grade', got: aGrade },
    ];
  }

  // ---- 🖼 Draw the case ----------------------------------------------------
  function render() {
    const g = gather();

    // 🏅 The four record tiles across the top.
    const recs = $('trophy-records');
    if (recs) {
      const tiles = [
        { ic: '🏆', v: g.titles,        l: 'TITLES' },
        { ic: '📈', v: 'Lv ' + g.level, l: g.title },
        { ic: '🎮', v: g.games,         l: 'GAMES' },
        { ic: '🪙', v: g.coins,         l: 'COINS' },
      ];
      recs.innerHTML = tiles.map(t =>
        `<div class="trec"><div class="trec-ic">${t.ic}</div><div class="trec-v">${t.v}</div><div class="trec-l">${t.l}</div></div>`
      ).join('');
    }

    // 🎽 The uniform cabinet — owned ones in colour, locked ones dimmed.
    const uc = $('trophy-uni-count');
    if (uc) uc.textContent = g.ownedCount + '/' + g.uniforms.length;
    const cab = $('trophy-uniforms');
    if (cab) {
      cab.innerHTML = g.uniforms.map(u =>
        `<div class="tuni${u.owned ? '' : ' locked'}">
           <div class="tuni-chip" style="background:linear-gradient(${hex(u.jersey)} 50%, ${hex(u.helmet)} 50%)">
             ${u.owned ? '' : '<span class="tuni-lock">🔒</span>'}
           </div>
           <div class="tuni-name">${u.name}</div>
           <div class="tuni-how">${u.owned ? '✓ Earned' : u.how}</div>
         </div>`
      ).join('');
    }

    // 🏆 The badge wall.
    const bg = $('trophy-badges');
    if (bg) {
      bg.innerHTML = badgesFor(g).map(b =>
        `<div class="tbadge${b.got ? '' : ' locked'}">
           <div class="tbadge-ic">${b.got ? b.icon : '🔒'}</div>
           <div class="tbadge-nm">${b.name}</div>
           <div class="tbadge-nd">${b.got ? '✓ Unlocked' : b.need}</div>
         </div>`
      ).join('');
    }
  }

  // ---- The slim menu bar (shows how much of the closet you've filled) -----
  function refreshBar() {
    const el = $('trophy-bar-sum');
    if (!el) return;
    const g = gather();
    el.textContent = g.ownedCount + '/' + g.uniforms.length + ' 🎽';
  }

  // ---- Pop-up plumbing (same recipe as the shop / challenges) -------------
  function gameKeyboard(on) { try { window.game.input.keyboard.enabled = on; } catch (e) {} }
  function openModal() {
    const m = $('trophy-modal');
    if (!m) return;
    gameKeyboard(false);
    render();
    m.style.display = 'flex';
  }
  function closeModal() {
    const m = $('trophy-modal');
    if (m) m.style.display = 'none';
    gameKeyboard(true);
  }
  function onMenu() { refreshBar(); }

  function onTap(id, fn) {
    const el = $(id);
    if (el) el.addEventListener('pointerdown', e => { e.preventDefault(); fn(); });
  }
  function wireUp() {
    onTap('trophy-bar', openModal);
    onTap('trophy-close', closeModal);
    refreshBar();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wireUp);
  else wireUp();

  // ---- What the rest of the game may use ----------------------------------
  window.TDTrophy = { onMenu, open: openModal };
})();
