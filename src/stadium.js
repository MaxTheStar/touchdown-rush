// ============================================================
// TOUCHDOWN FUN — stadium.js: 🏟️ THE STADIUM BUILDER
// ------------------------------------------------------------
// Your very own home stadium — and YOU get to build it! Spend the coins you
// win on bigger seating, brighter lights, a giant jumbotron, a nicer field,
// a roof, and game-day extras like fireworks and a jet flyover. Every part
// you upgrade makes the little stadium in the pop-up grow right in front of
// you, packs in more fans, and raises your STADIUM LEVEL.
//
//   WHY BUILD? — the more fans your seats hold, the more "gate receipts"
//     (bonus coins) you collect at the end of every game. Build it up and it
//     slowly pays you back, game after game. So it's a fun thing to save up
//     for AND it helps you earn faster. (No real money — ever. You build it
//     all with coins you win by playing.)
//
//   WHERE — it lives inside the 🛍 Pro Shop (a "🏟️ STADIUM" button), right
//     next to Card Packs — because building it is just spending coins, like
//     buying gear. A little ⬆️ badge shows when you can afford an upgrade.
//
// Saved in `tdr-stadium` = { stands, field, lights, screen, roof, extras } —
// each number is just which tier you've bought (0 = the free starting one).
// main.js pays the gate-receipts bonus through window.TDStadium at game's end.
// ============================================================
(function () {
  'use strict';

  const T = window.TDStats ? TDStats.shared : null;
  const store = (k, v) => { if (T) T.store(k, v); };
  const load  = (k, f) => (T ? T.load(k, f) : f);
  const $ = id => document.getElementById(id);
  const fmt = n => n.toLocaleString('en-US');   // 12000 -> "12,000"

  // Every part of the stadium you can build up. Each tier lists what it's
  // CALLED, what it COSTS in coins to buy, and how many extra FANS it seats.
  // Tier 0 is the free one you start with. Seating is the big fan driver;
  // the fancy stuff (lights, screen, roof, extras) seats a few more too.
  const PARTS = [
    { id: 'stands', icon: '🪑', name: 'SEATING', tiers: [
      { name: 'Bleachers',       cost: 0,    cap: 8000  },
      { name: 'Grandstand',      cost: 150,  cap: 12000 },
      { name: 'Upper Deck',      cost: 450,  cap: 20000 },
      { name: 'Skybox Suites',   cost: 1000, cap: 28000 },
    ]},
    { id: 'field', icon: '🌱', name: 'THE FIELD', tiers: [
      { name: 'Dirt Lot',        cost: 0,    cap: 0    },
      { name: 'Green Grass',     cost: 120,  cap: 1000 },
      { name: 'Pro Turf',        cost: 320,  cap: 1500 },
      { name: 'Champion Turf',   cost: 700,  cap: 2500 },
    ]},
    { id: 'lights', icon: '💡', name: 'LIGHTS', tiers: [
      { name: 'Daytime Only',    cost: 0,    cap: 0    },
      { name: 'Floodlights',     cost: 140,  cap: 1500 },
      { name: 'Stadium Lights',  cost: 360,  cap: 2000 },
      { name: 'Laser Show',      cost: 800,  cap: 3000 },
    ]},
    { id: 'screen', icon: '📺', name: 'JUMBOTRON', tiers: [
      { name: 'No Screen',       cost: 0,    cap: 0    },
      { name: 'Small Screen',    cost: 130,  cap: 1200 },
      { name: 'Big Screen',      cost: 380,  cap: 1800 },
      { name: 'Mega Screen',     cost: 850,  cap: 2600 },
    ]},
    { id: 'roof', icon: '🏛️', name: 'THE ROOF', tiers: [
      { name: 'Open Air',        cost: 0,    cap: 0    },
      { name: 'Canopy',          cost: 200,  cap: 1500 },
      { name: 'Big Overhang',    cost: 520,  cap: 2200 },
      { name: 'Retractable Dome',cost: 1100, cap: 3500 },
    ]},
    { id: 'extras', icon: '🎆', name: 'GAME-DAY EXTRAS', tiers: [
      { name: 'Quiet Day',       cost: 0,    cap: 0    },
      { name: 'Team Mascot',     cost: 160,  cap: 1200 },
      { name: 'Fireworks',       cost: 460,  cap: 1800 },
      { name: 'Jet Flyover',     cost: 1000, cap: 2600 },
    ]},
  ];

  // Load what you've built (default: everything at the free tier 0). Old saves
  // that never had a stadium just start fresh; a stray/broken value snaps to 0.
  let s = load('stadium', null);
  if (!s || typeof s !== 'object') s = {};
  PARTS.forEach(p => {
    const v = s[p.id];
    if (typeof v !== 'number' || v < 0 || v > p.tiers.length - 1) s[p.id] = 0;
  });
  function save() { store('stadium', s); }

  // ---- the numbers ---------------------------------------------------------
  // FANS = add up the seats of every tier you've bought so far.
  function capacity() {
    let c = 0;
    PARTS.forEach(p => { for (let i = 0; i <= s[p.id]; i++) c += p.tiers[i].cap; });
    return c;
  }
  // LEVEL = how many upgrades you've bought in total (0…18).
  function level()    { let n = 0; PARTS.forEach(p => n += s[p.id]); return n; }
  function maxLevel() { let n = 0; PARTS.forEach(p => n += p.tiers.length - 1); return n; }
  function allMaxed() { return level() === maxLevel(); }

  // 🪙 GATE RECEIPTS — the bonus coins your fans pay at the end of a game.
  // Bigger stadium → more fans → more coins, up to a friendly +15 cap so it
  // stays a nice little boost and never runs away with the coin economy.
  function gateReceipts() { return Math.min(15, Math.floor(capacity() / 6000)); }

  // Can you afford the NEXT upgrade of ANY part right now? (lights the ⬆️ badge)
  function canAfford() {
    const coins = window.TDShop ? TDShop.coins() : 0;
    return PARTS.some(p => s[p.id] < p.tiers.length - 1 && coins >= p.tiers[s[p.id] + 1].cost);
  }

  // ---- 🏈 main.js: a game just finished — pay the gate receipts -----------
  // Called BEFORE the FINAL screen is built, so the coins land in this game's
  // payday total. Returns how many it paid (0 if the stadium's still tiny).
  function gameBonus() {
    const g = gateReceipts();
    if (g > 0 && window.TDShop) TDShop.earn(g);
    return g;
  }

  // ---- 🛒 buy the next tier of a part -------------------------------------
  // A buy re-draws the list, dropping a fresh button under your finger — so a
  // 400 ms guard stops one tap buying two tiers (same trick the Reward Road uses).
  let lastBuy = 0;
  function buy(id) {
    const now = Date.now();
    if (now - lastBuy < 400) return;
    lastBuy = now;
    const p = PARTS.find(x => x.id === id);
    if (!p) return;
    const nextIdx = s[p.id] + 1;
    if (nextIdx > p.tiers.length - 1) return;            // already fully built
    const tier = p.tiers[nextIdx];
    if (!window.TDShop || !TDShop.spend(tier.cost)) { flashNote(); return; }
    s[p.id] = nextIdx; save();
    const anchor = $('stad-scene') || $('stadium-modal');
    if (TDShop.celebrate) {
      // A big party when the WHOLE stadium is finished, else a little pop.
      if (allMaxed()) TDShop.celebrate(anchor, '🏆', 'MAX STADIUM!');
      else            TDShop.celebrate(anchor, p.icon, tier.name + '!');
    }
    render(); onMenu();
  }

  // A gentle "not enough coins" line under the list (no scary pop-up).
  let noteT = 0;
  function flashNote() {
    const n = $('stad-note'); if (!n) return;
    n.textContent = '💸 Not enough coins — play a game to earn more!';
    clearTimeout(noteT);
    noteT = setTimeout(() => { const el = $('stad-note'); if (el) el.textContent = ''; }, 1900);
  }

  // ---- 🖼 draw the little stadium ----------------------------------------
  function paintScene() {
    const sc = $('stad-scene'); if (!sc) return;
    const L = s.lights, R = s.roof, SC = s.screen, F = s.field, EX = s.extras, ST = s.stands;

    // The sky's mood comes from the lights: sunny day → glowing night → laser show.
    const sky = L === 0 ? 'day' : (L >= 3 ? 'laser' : 'night');

    // Roof: a bar across the top; the dome (tier 3) arches over everything.
    const roofHTML = R > 0 ? `<div class="stad-roof r${R}">${R >= 3 ? '🏟️ DOME' : ''}</div>` : '';

    // Lights: a little row of bulbs, more of them as the tier climbs.
    let lightsHTML = '';
    if (L > 0) { const bulbs = [3, 5, 7][L - 1] || 0; lightsHTML = `<div class="stad-lights">${'💡'.repeat(bulbs)}</div>`; }

    // Jumbotron in the corner, bigger each tier.
    const jumboHTML = SC > 0 ? `<div class="stad-jumbo j${SC}">📺</div>` : '';

    // Game-day extras floating over the bowl.
    const exArt = ['', '🐯', '🎆🎆', '🛩️'][EX] || '';
    const extrasHTML = EX > 0 ? `<div class="stad-extras">${exArt}</div>` : '';

    // Seating bowl: one row of seats for the base, plus one more per upgrade.
    // Back rows are wider so it reads like a stadium bowl.
    let seats = '';
    for (let i = ST + 1; i >= 1; i--) seats += `<div class="stad-seatrow">${'🪑'.repeat(4 + i * 2)}</div>`;

    // The field, colored by its tier (champion turf shows a 🏈 at midfield).
    const fieldCls = ['dirt', 'grass', 'turf', 'champ'][F] || 'dirt';
    const fieldHTML = `<div class="stad-field ${fieldCls}">${F >= 3 ? '🏈' : ''}</div>`;

    sc.className = 'stad-scene ' + sky;
    sc.innerHTML = roofHTML + lightsHTML + jumboHTML + extrasHTML +
                   `<div class="stad-seats">${seats}</div>` + fieldHTML;
  }

  // ---- 🖊 draw the whole pop-up (scene + numbers + the shopping list) ------
  function render() {
    paintScene();

    const head = $('stad-head');
    if (head) head.innerHTML =
      `<span class="stad-lvl">★ LEVEL ${level()}/${maxLevel()}</span>` +
      `<span class="stad-cap">🎟️ ${fmt(capacity())} FANS</span>`;

    const gate = $('stad-gate');
    if (gate) gate.innerHTML = allMaxed()
      ? '🏆 MAX STADIUM — the biggest, loudest house in the league!'
      : `🪙 Gate receipts: <b>+${gateReceipts()}</b> coins every game`;

    const list = $('stad-list');
    if (!list) return;
    const coins = window.TDShop ? TDShop.coins() : 0;
    let rows = '';
    PARTS.forEach(p => {
      const cur   = p.tiers[s[p.id]];
      const maxed = s[p.id] >= p.tiers.length - 1;
      const next  = maxed ? null : p.tiers[s[p.id] + 1];
      const afford = next && coins >= next.cost;
      const right = maxed
        ? '<span class="chal-reward">✅ MAX</span>'
        : `<span class="chal-btn ${afford ? 'go' : 'got'}" data-buy="${p.id}">${fmt(next.cost)} 🪙</span>`;
      const sub = maxed
        ? 'Fully built! ⭐'
        : `Next: ${next.name}${next.cap ? ' · +' + fmt(next.cap) + ' fans' : ''}`;
      rows +=
        `<div class="chal-row${maxed ? ' done' : ''}">` +
        `<div class="chal-icon">${p.icon}</div>` +
        `<div class="chal-mid"><div class="chal-name">${p.name} — ${cur.name}</div>` +
        `<div class="chal-count">${sub}</div></div>` +
        `<div class="chal-right">${right}</div></div>`;
    });
    list.innerHTML = rows;

    // Wire the BUY buttons (event per visible button; there are only six).
    list.querySelectorAll('[data-buy]').forEach(b =>
      b.addEventListener('pointerdown', e => { e.preventDefault(); buy(b.getAttribute('data-buy')); }));
  }

  // ---- 🏷 the ⬆️ badge on the "🏟️ STADIUM" shop button --------------------
  function onMenu() {
    const b = $('stadium-btn-badge');
    if (!b) return;
    const on = canAfford();
    b.textContent = on ? '⬆️' : '';
    b.style.display = on ? 'inline-block' : 'none';
  }

  // ---- pop-up plumbing (same shape as the other modals) -------------------
  function gameKeyboard(on) { try { window.game.input.keyboard.enabled = on; } catch (e) {} }
  function open()  { const m = $('stadium-modal'); if (!m) return; gameKeyboard(false); render(); m.style.display = 'flex'; }
  function close() { const m = $('stadium-modal'); if (m) m.style.display = 'none'; gameKeyboard(true); }

  function onTap(id, fn) { const el = $(id); if (el) el.addEventListener('pointerdown', e => { e.preventDefault(); fn(); }); }
  function wire() { onTap('open-stadium', open); onTap('stadium-close', close); onMenu(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire);
  else wire();

  // ---- what the rest of the game may use ----------------------------------
  window.TDStadium = {
    gameBonus, onMenu, open, close,
    capacity, level, gateReceipts,
    _state: () => Object.assign({}, s, { level: level(), cap: capacity(), gate: gateReceipts() }),
  };
})();
