// ============================================================
// TOUCHDOWN RUSH — shop.js: 🪙 COINS, the 🛍 PRO SHOP & 🎁 DAILY REWARDS
// ------------------------------------------------------------
// This file is the game's locker room — everything you OWN lives here:
//
//   🪙 COINS — you earn them by playing: +10 a touchdown, +5 a field
//      goal, +2 an extra point, +3 for a takeaway on defense, +25 for
//      winning the game (+5 for a good try). Daily rewards pay too.
//
//   🛍 THE PRO SHOP — spend coins on gear that makes YOUR player
//      better: speed cleats, turbo dashes, sticky gloves and catch
//      energy. Each item has 3 levels. The gear is real: main.js asks
//      this file for the boosts in the middle of every play.
//
//   🎁 DAILY REWARDS — come back every day and claim a present. The
//      week is 7 days; days 3 and 7 hold EXCLUSIVE uniforms you can't
//      get anywhere else. Miss a day and the week starts over — that's
//      what makes it a streak!
//
//   ⭐ THE PREMIUM PASS ($1.99) — makes every daily reward bigger and
//      adds two premium-only uniforms. The checkout is PRETEND on
//      purpose: a homemade web game can't take real money (that needs
//      a payment company and a grown-up's business account), so the
//      button says so honestly and just unlocks it.
//
// Everything saves through the same store/load helpers stats.js uses,
// so your coins and gear are still yours tomorrow (on this device).
//
// main.js talks to us through window.TDShop — see the bottom.
// ============================================================
(function () {
  'use strict';

  // Borrow the little localStorage helpers from stats.js (loaded first).
  const T = window.TDStats ? TDStats.shared : null;
  const store = (k, v) => { if (T) T.store(k, v); };
  const load  = (k, f) => (T ? T.load(k, f) : f);
  const $ = id => document.getElementById(id);

  // ---- 🎽 The exclusive uniforms (daily rewards ONLY — not on the menu
  // until you've earned them). Same shape as a team in NFL_TEAMS, plus
  // special:true so the menu can brag about them.
  const UNIFORMS = {
    GLX: { abbr: 'GLX', name: 'GALAXY',        jersey: 0x3b1e6e, helmet: 0x9b4dff, special: true },
    GLD: { abbr: 'GLD', name: 'GOLD RUSH',     jersey: 0xc9a227, helmet: 0xffe066, special: true },
    ICE: { abbr: 'ICE', name: 'NEON ICE',      jersey: 0x0b6f8a, helmet: 0x4de3ff, special: true },
    BLK: { abbr: 'BLK', name: 'BLACK DIAMOND', jersey: 0x101014, helmet: 0x2ee6c8, special: true },
  };

  // ---- 🎁 The 7-day reward calendar ---------------------------------------
  // coins/uniform = what EVERYONE gets. pCoins/pUniform = the EXTRA gold-row
  // stuff premium players get ON TOP. Day 7 is the big one on purpose.
  const DAILY = [
    { coins: 10, pCoins: 15 },                                      // day 1
    { coins: 15, pCoins: 20 },                                      // day 2
    { coins: 10, uniform: 'GLX', pCoins: 15, pUniform: 'ICE' },     // day 3 🎽
    { coins: 20, pCoins: 25 },                                      // day 4
    { coins: 25, pCoins: 30 },                                      // day 5
    { coins: 30, pCoins: 35 },                                      // day 6
    { coins: 50, uniform: 'GLD', pCoins: 50, pUniform: 'BLK' },     // day 7 🎽🎉
  ];

  // ---- 🛍 The shop shelves ------------------------------------------------
  // Every item has 3 levels; each level costs more than the last.
  // The actual gameplay math lives in the perk functions further down —
  // `lvl` here is just the label the shop shows for the NEXT level.
  const PRICES = [30, 60, 100];
  const ITEMS = [
    { id: 'cleats', icon: '👟', name: 'SPEED CLEATS',
      blurb: 'Faster feet every step you take',
      lvl: ['+4% run speed', '+8% run speed', '+12% run speed'] },
    { id: 'turbo',  icon: '⚡', name: 'TURBO DASH',
      blurb: 'Swipe-dashes hit harder & recharge quicker',
      lvl: ['dash +30 speed', 'dash +60 speed', 'dash +90 speed'] },
    { id: 'gloves', icon: '🧤', name: 'STICKY GLOVES',
      blurb: 'Passes stick — more catches, fewer drops',
      lvl: ['+4% catching', '+8% catching', '+12% catching'] },
    { id: 'energy', icon: '🔋', name: 'CATCH ENERGY',
      blurb: 'Every clean catch = a burst of speed',
      lvl: ['1.2s speed burst', '1.6s speed burst', '2.0s speed burst'] },
  ];

  // ---- What you own (loaded from last time) -------------------------------
  let coins   = load('coins', 0);
  let gear    = load('gear', { cleats: 0, turbo: 0, gloves: 0, energy: 0 });
  let daily   = load('daily', { day: 0, last: '' });  // day = last day claimed (1-7)
  let premium = load('premium', false);
  let owned   = load('owned-uniforms', []);           // abbrs, e.g. ['GLX']

  let earnedThisGame = 0;   // shown on the FINAL screen ("🪙 +42 COINS")
  let autoOpened = false;   // pop the daily gift only once per visit

  // ============================================================
  // 🪙 COINS
  // ============================================================
  function earn(n) {
    coins += n;
    earnedThisGame += n;
    store('coins', coins);
  }
  function spend(n) {
    if (coins < n) return false;
    coins -= n;
    store('coins', coins);
    paintChip();
    return true;
  }
  function paintChip() {
    const el = $('coin-amt');
    if (el) el.textContent = coins;
  }

  // ============================================================
  // 💪 THE PERKS — main.js calls these mid-play to apply your gear
  // ============================================================
  // Speed cleats: multiply your run speed (level 3 = 12% faster).
  function speedMult() { return 1 + 0.04 * gear.cleats; }

  // Turbo dash: how much STRONGER a swipe-dash is (added to the base
  // numbers in main.js): faster burst, lasts longer, recharges sooner.
  function dashBoost() {
    return { speed: 30 * gear.turbo, time: 40 * gear.turbo, cooldown: 150 * gear.turbo };
  }

  // Sticky gloves: nudge the catch chances (added to the base chances).
  function gloveBoost() {
    return { catchBonus: 0.04 * gear.gloves, dropCut: 0.04 * gear.gloves };
  }

  // Catch energy: how long the after-catch speed burst lasts (0 = not owned).
  function energyMs() { return gear.energy ? 800 + 400 * gear.energy : 0; }
  const ENERGY_MULT = 1.25;   // the burst makes you 25% faster

  // ============================================================
  // 🛍 THE PRO SHOP screen
  // ============================================================
  function renderShop() {
    const box = $('shop-items');
    if (!box) return;
    const sc = $('shop-coins');
    if (sc) sc.textContent = '🪙 ' + coins;

    box.innerHTML = ITEMS.map(it => {
      const level = gear[it.id] || 0;
      const pips = '●'.repeat(level) + '○'.repeat(3 - level);
      const maxed = level >= 3;
      const price = PRICES[level];
      const canBuy = !maxed && coins >= price;
      return `
        <div class="shop-row">
          <div class="shop-icon">${it.icon}</div>
          <div class="shop-info">
            <div class="shop-name">${it.name} <span class="shop-pips">${pips}</span></div>
            <div class="shop-blurb">${maxed ? it.blurb : 'Next: ' + it.lvl[level]}</div>
          </div>
          <div class="shop-buy ${maxed ? 'maxed' : canBuy ? '' : 'poor'}" data-item="${it.id}">
            ${maxed ? 'MAX!' : price + ' 🪙'}
          </div>
        </div>`;
    }).join('');

    // Wire every BUY button (pointerdown = instant, like all our buttons).
    box.querySelectorAll('.shop-buy[data-item]').forEach(btn => {
      btn.addEventListener('pointerdown', e => {
        e.preventDefault();
        buy(btn.dataset.item);
      });
    });
  }

  function buy(id) {
    const level = gear[id] || 0;
    if (level >= 3) return;                    // already maxed out
    if (!spend(PRICES[level])) return;         // can't afford it (button was gray anyway)
    gear[id] = level + 1;
    store('gear', gear);
    if (window.TDSound) TDSound.sting('td');   // 🎺 cha-ching!
    renderShop();
  }

  // ============================================================
  // 🎁 DAILY REWARDS
  // ============================================================
  // Days are compared as simple local-date strings like "2026-7-19",
  // so a new reward unlocks at YOUR midnight, not some internet midnight.
  function dateKey(daysAgo) {
    const d = new Date(Date.now() - daysAgo * 86400000);
    return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  }

  // Which day can you claim right now?
  //   0  = you already claimed today — come back tomorrow!
  //   1  = a fresh week (first visit ever, or the streak broke)
  //   2+ = you claimed yesterday, so the streak continues (7 wraps to 1)
  function claimableDay() {
    if (daily.last === dateKey(0)) return 0;
    return (daily.last === dateKey(1)) ? (daily.day % 7) + 1 : 1;
  }

  function claim() {
    const day = claimableDay();
    if (!day) return;
    const r = DAILY[day - 1];

    earn(r.coins + (premium ? r.pCoins : 0));
    earnedThisGame -= r.coins + (premium ? r.pCoins : 0);  // a gift, not game winnings

    // Uniforms! (premium players also get the gold-row one)
    const newUnis = [];
    const grant = abbr => {
      if (abbr && !owned.includes(abbr)) { owned.push(abbr); newUnis.push(abbr); }
    };
    grant(r.uniform);
    if (premium) grant(r.pUniform);
    store('owned-uniforms', owned);

    daily = { day, last: dateKey(0) };
    store('daily', daily);
    if (window.TDSound) TDSound.sting(day === 7 ? 'win' : 'td');
    paintChip();
    renderDaily();

    // A new uniform? Jump the team menu right to it so you can try it on!
    if (newUnis.length && window.TDMenu) {
      setTimeout(() => { closeOv('daily-modal'); TDMenu.showTeam(newUnis[0]); }, 900);
    }
  }

  // A tiny two-color chip that previews a uniform (jersey top, helmet bottom).
  function uniChip(abbr) {
    const u = UNIFORMS[abbr];
    const hex = n => '#' + n.toString(16).padStart(6, '0');
    return `<div class="uni-chip" style="background:linear-gradient(${hex(u.jersey)} 50%,${hex(u.helmet)} 50%)"></div>
            <div class="uni-name">${u.name}</div>`;
  }

  function renderDaily() {
    const grid = $('daily-grid');
    if (!grid) return;
    const today = claimableDay();                      // 0 = claimed already
    const shownDay = today || daily.day;               // the column to highlight

    grid.innerHTML = DAILY.map((r, i) => {
      const d = i + 1;
      // "claimed" = days already collected this week (before the current day,
      // or including it if you've claimed today).
      const claimed = today === 0 ? d <= daily.day : d < shownDay;
      const cls = 'day-cell' + (d === shownDay ? ' today' : '') + (claimed ? ' claimed' : '');
      return `
        <div class="${cls}">
          <div class="day-num">${claimed ? '✓' : 'DAY ' + d}</div>
          <div class="day-free">${r.uniform ? uniChip(r.uniform) : '🪙' + r.coins}</div>
          <div class="day-prem">${r.pUniform ? uniChip(r.pUniform) : '+🪙' + r.pCoins}</div>
        </div>`;
    }).join('');

    // The big CLAIM button (or the "come back" message).
    const btn = $('daily-claim');
    if (btn) {
      if (today) {
        btn.textContent = 'CLAIM DAY ' + today + ' 🎁';
        btn.classList.remove('done');
      } else {
        btn.textContent = '✓ SEE YOU TOMORROW!';
        btn.classList.add('done');
      }
    }

    // The premium strip under the calendar.
    const p = $('daily-premium');
    if (p) {
      p.innerHTML = premium
        ? '<div class="prem-on">⭐ PREMIUM PASS ACTIVE — the gold row is yours every day!</div>'
        : '<div class="prem-btn" id="prem-open">⭐ PREMIUM PASS · $1.99<span>unlock the gold row — bigger rewards every day</span></div>';
      const open = $('prem-open');
      if (open) open.addEventListener('pointerdown', e => {
        e.preventDefault(); closeOv('daily-modal'); openOv('premium-modal');
      });
    }
  }

  // ============================================================
  // ⭐ THE PREMIUM PASS — a PRETEND checkout, and proud of it
  // ------------------------------------------------------------
  // Real money needs a real payment company (Stripe, the App Store...)
  // and a grown-up's business account — a hobby web game has neither.
  // Charging kids for real without one would be wrong (and impossible
  // here anyway), so the checkout tells the truth and unlocks for free.
  // ============================================================
  function buyPremium() {
    premium = true;
    store('premium', premium);
    if (window.TDSound) TDSound.sting('win');
    closeOv('premium-modal');
    openOv('daily-modal');    // straight back to the calendar — now with gold!
    renderDaily();
  }

  // ============================================================
  // Pop-up plumbing (same recipe as the review pop-up in stats.js)
  // ============================================================
  // While a pop-up is open the game must not hear the keyboard —
  // otherwise SPACE would start a game behind the shop.
  function gameKeyboard(on) {
    try { window.game.input.keyboard.enabled = on; } catch (e) {}
  }
  function openOv(id) {
    const el = $(id);
    if (!el) return;
    gameKeyboard(false);
    el.style.display = 'flex';
    if (id === 'shop-modal') renderShop();
    if (id === 'daily-modal') renderDaily();
  }
  function closeOv(id) {
    const el = $(id);
    if (el) el.style.display = 'none';
    gameKeyboard(true);
  }

  // ---- main.js calls this every time the team menu appears ----------------
  function onMenu() {
    paintChip();
    // A present is waiting? Show the calendar once per visit, like a doorbell.
    if (!autoOpened && claimableDay()) {
      autoOpened = true;
      setTimeout(() => openOv('daily-modal'), 600);
    }
  }

  // ---- Wire the buttons ----------------------------------------------------
  function onTap(id, fn) {
    const el = $(id);
    if (el) el.addEventListener('pointerdown', e => { e.preventDefault(); fn(); });
  }
  function wireUp() {
    onTap('open-shop',  () => openOv('shop-modal'));
    onTap('open-daily', () => openOv('daily-modal'));
    onTap('shop-close',  () => closeOv('shop-modal'));
    onTap('daily-close', () => closeOv('daily-modal'));
    onTap('daily-claim', claim);
    onTap('prem-buy',    buyPremium);
    onTap('prem-no',     () => { closeOv('premium-modal'); openOv('daily-modal'); });
    paintChip();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wireUp);
  else wireUp();

  // ---- What the rest of the game may use ----------------------------------
  window.TDShop = {
    // coins
    earn, coins: () => coins,
    startGame: () => { earnedThisGame = 0; },
    gameEarnings: () => earnedThisGame,
    // gear perks (read by main.js during plays)
    speedMult, dashBoost, gloveBoost, energyMs, ENERGY_MULT,
    // uniforms you've unlocked (the menu adds them to the team list)
    unlockedUniforms: () => owned.map(a => UNIFORMS[a]).filter(Boolean),
    // menu hook
    onMenu,
  };
})();
