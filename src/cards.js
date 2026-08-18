// ============================================================
// TOUCHDOWN FUN — cards.js: 🃏 CARD PACKS & THE COLLECTION
// ------------------------------------------------------------
// Rip open packs of player cards and try to collect the whole set. Every few
// games earns you a free pack (or buy one with coins), and each pack spits out
// three cards — most are commons, but every so often a shiny Epic or a super-
// rare Legendary drops. New cards fill your album; doubles turn into coins. The
// "one more pack, I NEED that last Legendary" itch is the whole idea.
//
//   FOUR RARITIES — Common, Rare, Epic, Legendary (rarer = shinier = worth
//     more as a double). A pack is 3 cards: two by the normal odds, and the
//     third is ALWAYS Rare-or-better, so every pack feels worth opening.
//   EARNING PACKS — one free pack every 3 games you finish, plus a 🃏 BUY
//     PACK button in the collection (spends coins).
//   DOUBLES → COINS — a card you already own is auto-sold for coins, so a pack
//     is never a total dud.
//
// Saved in `tdr-cards` = { owned: {id:count}, packs: how many unopened,
// plays: games since your last free pack }. Opened from the Pro Shop (a
// "🃏 CARD PACKS" button) with an unopened-packs badge on the 🛍 SHOP menu
// button. main.js tells us when a game finishes through window.TDCards.
// ============================================================
(function () {
  'use strict';

  const T = window.TDStats ? TDStats.shared : null;
  const store = (k, v) => { if (T) T.store(k, v); };
  const load  = (k, f) => (T ? T.load(k, f) : f);
  const $ = id => document.getElementById(id);

  // Rarity: how likely it drops (weight), its colour, and its double-sell price.
  const RARITY = {
    C: { name: 'Common',    color: '#9fb0c3', weight: 60, dupe: 5   },
    R: { name: 'Rare',      color: '#4fc3f7', weight: 27, dupe: 15  },
    E: { name: 'Epic',      color: '#b98cff', weight: 10, dupe: 40  },
    L: { name: 'Legendary', color: '#ffd24a', weight: 3,  dupe: 120 },
  };

  // The whole set — fun football archetypes (no real players).
  const CARDS = [
    { id: 'rook',    name: 'Rookie QB',      ic: '🏈', r: 'C' },
    { id: 'squad',   name: 'Practice Squad', ic: '🎽', r: 'C' },
    { id: 'steamer', name: 'Special Teamer', ic: '🦵', r: 'C' },
    { id: 'brb',     name: 'Backup RB',      ic: '🏃', r: 'C' },
    { id: 'rwr',     name: 'Rookie WR',      ic: '🧤', r: 'C' },
    { id: 'snap',    name: 'Long Snapper',   ic: '🎯', r: 'C' },
    { id: 'speed',   name: 'Speedster',      ic: '⚡', r: 'R' },
    { id: 'bruiser', name: 'Bruiser RB',     ic: '💪', r: 'R' },
    { id: 'slot',    name: 'Slot Ninja',     ic: '🥷', r: 'R' },
    { id: 'corner',  name: 'Shutdown Corner',ic: '🛡️', r: 'R' },
    { id: 'general', name: 'Field General',  ic: '🧠', r: 'R' },
    { id: 'cannon',  name: 'Cannon Arm',     ic: '💣', r: 'E' },
    { id: 'truck',   name: 'Truck Stick',    ic: '🚛', r: 'E' },
    { id: 'hawk',    name: 'Hawk Safety',    ic: '🦅', r: 'E' },
    { id: 'sack',    name: 'Sack Master',    ic: '🔥', r: 'E' },
    { id: 'goat',    name: 'The G.O.A.T.',   ic: '🐐', r: 'L' },
    { id: 'clutch',  name: 'Captain Clutch', ic: '👑', r: 'L' },
    { id: 'wall',    name: 'Mr. Untouchable',ic: '🧱', r: 'L' },
  ];

  const PACK_EVERY = 3;     // one free pack per this many finished games
  const PACK_COST  = 150;   // coins to buy a pack

  let s = load('cards', null);
  if (!s || typeof s !== 'object') s = {};
  if (typeof s.packs !== 'number') s.packs = 1;   // start with one free pack (a hook)
  if (typeof s.plays !== 'number') s.plays = 0;
  if (!s.owned || typeof s.owned !== 'object') s.owned = {};
  function save() { store('cards', s); }

  const ownedCount = () => CARDS.filter(c => (s.owned[c.id] || 0) > 0).length;

  // A weighted random card, optionally limited to certain rarities.
  function roll(rarities) {
    const pool = CARDS.filter(c => !rarities || rarities.indexOf(c.r) >= 0);
    const total = pool.reduce((a, c) => a + RARITY[c.r].weight, 0);
    let x = Math.random() * total;
    for (const c of pool) { x -= RARITY[c.r].weight; if (x <= 0) return c; }
    return pool[pool.length - 1];
  }

  // ---- 🎁 open a pack -> [{card, isNew, coins}] ---------------------------
  function openPack() {
    if (s.packs <= 0) return null;
    s.packs--;
    const draws = [roll(), roll(), roll(['R', 'E', 'L'])];   // 3rd is Rare-or-better
    const out = draws.map(card => {
      const had = s.owned[card.id] || 0;
      s.owned[card.id] = had + 1;
      const isNew = had === 0;
      let coins = 0;
      if (!isNew) { coins = RARITY[card.r].dupe; if (window.TDShop) TDShop.earn(coins); }
      return { card, isNew, coins };
    });
    save();
    return out;
  }

  function buyPack() {
    if (window.TDShop && TDShop.spend(PACK_COST)) { s.packs++; save(); return true; }
    return false;
  }

  // ---- 🏈 main.js: a game finished — tick the free-pack meter -------------
  function gameDone() {
    s.plays++;
    let earned = false;
    if (s.plays >= PACK_EVERY) { s.plays -= PACK_EVERY; s.packs++; earned = true; }
    save();
    onMenu();
    return earned;   // main.js celebrates when true
  }

  // ---- 🖼 draw the collection --------------------------------------------
  function render() {
    const cnt = $('cards-count');
    if (cnt) cnt.textContent = ownedCount() + ' / ' + CARDS.length;
    const pk = $('cards-packs');
    if (pk) pk.textContent = s.packs;
    const openBtn = $('cards-open');
    if (openBtn) openBtn.classList.toggle('disabled', s.packs <= 0);
    const buyBtn = $('cards-buy');
    if (buyBtn) buyBtn.textContent = 'BUY PACK · ' + PACK_COST + ' 🪙';

    const al = $('cards-album');
    if (al) {
      al.innerHTML = CARDS.map(c => {
        const n = s.owned[c.id] || 0;
        const got = n > 0;
        const col = RARITY[c.r].color;
        const frame = got ? `border-color:${col};box-shadow:inset 0 0 0 1px ${col}55` : '';
        return `<div class="card-cell ${got ? 'got' : 'locked'}" style="${frame}">` +
               `<div class="card-ic">${got ? c.ic : '❓'}</div>` +
               `<div class="card-nm">${got ? c.name : '? ? ?'}</div>` +
               `<div class="card-rar" style="color:${got ? col : '#5a6b7d'}">` +
               `${RARITY[c.r].name}${n > 1 ? ' ×' + n : ''}</div></div>`;
      }).join('');
    }
  }

  // ---- ✨ the pack-opening reveal ----------------------------------------
  function showReveal(results) {
    const rv = $('cards-reveal');
    if (!rv) return;
    if (!results) { rv.innerHTML = ''; return; }
    rv.innerHTML = results.map((res, i) => {
      const c = res.card, col = RARITY[c.r].color;
      const tag = res.isNew
        ? '<span class="rv-tag rv-new">NEW!</span>'
        : '<span class="rv-tag rv-dupe">+' + res.coins + ' 🪙</span>';
      return `<div class="rv-card r-${c.r}" style="border-color:${col};animation-delay:${i * 0.16}s">` +
             `<div class="rv-ic">${c.ic}</div>` +
             `<div class="rv-nm">${c.name}</div>` +
             `<div class="rv-rar" style="color:${col}">${RARITY[c.r].name}</div>${tag}</div>`;
    }).join('');
  }

  function doOpen() {
    const res = openPack();
    if (!res) return;
    if (window.TDSound) TDSound.sting('td');
    showReveal(res);
    render();
    onMenu();
  }
  function doBuy() {
    if (buyPack()) {
      render(); onMenu();
      if (window.TDShop && TDShop.celebrate) TDShop.celebrate($('cards-open'), '🃏', 'PACK BOUGHT');
    } else {
      const b = $('cards-buy');
      if (b) { b.classList.add('nope'); setTimeout(() => b.classList.remove('nope'), 450); }
    }
  }

  // ---- 🏷 badges on the menu (packs waiting to be opened) -----------------
  function onMenu() {
    const b = $('shop-badge');
    if (b) { b.textContent = s.packs; b.style.display = s.packs > 0 ? 'inline-flex' : 'none'; }
    const cb = $('cards-btn-badge');
    if (cb) { cb.textContent = s.packs; cb.style.display = s.packs > 0 ? 'inline-flex' : 'none'; }
  }

  // ---- pop-up plumbing ----------------------------------------------------
  function gameKeyboard(on) { try { window.game.input.keyboard.enabled = on; } catch (e) {} }
  function open()  { const m = $('cards-modal'); if (!m) return; gameKeyboard(false); showReveal(null); render(); m.style.display = 'flex'; }
  function close() { const m = $('cards-modal'); if (m) m.style.display = 'none'; gameKeyboard(true); }

  function onTap(id, fn) { const el = $(id); if (el) el.addEventListener('pointerdown', e => { e.preventDefault(); fn(); }); }
  function wire() {
    onTap('open-cards', open);
    onTap('cards-close', close);
    onTap('cards-open', doOpen);
    onTap('cards-buy', doBuy);
    onMenu();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire);
  else wire();

  // ---- what the rest of the game may use ----------------------------------
  window.TDCards = {
    gameDone, onMenu, open, close,
    packs: () => s.packs,
    collected: () => ownedCount(),
    total: () => CARDS.length,
    _state: () => ({ packs: s.packs, plays: s.plays, owned: ownedCount() }),
  };
})();
