// ============================================================
// TOUCHDOWN FUN — shop.js: 🪙 COINS, the 🛍 PRO SHOP & 🎁 DAILY REWARDS
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
//      what makes it a streak! Every reward is FREE — there's no paid
//      pass, because a homemade web game can't take real money (that
//      needs a payment company and a grown-up's business account).
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
    // 🔥 LAVA — a brand-new free uniform, earned on day 10 of the daily calendar.
    LAV: { abbr: 'LAV', name: 'LAVA',          jersey: 0x7a1206, helmet: 0xff6a1a, special: true },
    // NEON ICE and BLACK DIAMOND used to be "premium" prizes. Now that the paid
    // pass is gone, they're FREE daily rewards again (day 12 and the day-14 finale).
    ICE: { abbr: 'ICE', name: 'NEON ICE',      jersey: 0x0b6f8a, helmet: 0x4de3ff, special: true },
    BLK: { abbr: 'BLK', name: 'BLACK DIAMOND', jersey: 0x101014, helmet: 0x2ee6c8, special: true },
    // 🏆 The gold CHAMPIONS uniform — you can ONLY get this by winning the
    //    Max Bowl in Season mode (season.js grants it via TDShop.grantUniform).
    CHMP: { abbr: 'CHMP', name: 'CHAMPIONS',   jersey: 0x8a6d1a, helmet: 0xffd700, special: true },
  };

  // ---- 🎁 The 14-day reward calendar --------------------------------------
  // coins/uniform = what EVERYONE gets, every day, for FREE. Five days hand out
  // an exclusive uniform (days 3, 7, 10, 12 & 14); the coins climb as your streak
  // grows, and day 14 is the grand-finale jackpot. Keep the streak alive — miss a
  // day and it starts back at day 1!
  const DAILY = [
    { coins: 10 },                    // day 1
    { coins: 15 },                    // day 2
    { coins: 10, uniform: 'GLX' },    // day 3  🎽 GALAXY
    { coins: 20 },                    // day 4
    { coins: 25 },                    // day 5
    { coins: 30 },                    // day 6
    { coins: 50, uniform: 'GLD' },    // day 7  🎽 GOLD RUSH
    { coins: 30 },                    // day 8
    { coins: 35 },                    // day 9
    { coins: 40, uniform: 'LAV' },    // day 10 🎽 LAVA (brand new!)
    { coins: 45 },                    // day 11
    { coins: 50, uniform: 'ICE' },    // day 12 🎽 NEON ICE
    { coins: 60 },                    // day 13
    { coins: 100, uniform: 'BLK' },   // day 14 🎽🎉 BLACK DIAMOND — the finale!
  ];

  // ---- 🛍 The shop shelves ------------------------------------------------
  // Every item now goes all the way to LEVEL 10 — keep buying the same gear and
  // it keeps getting stronger. Each level costs more than the last (PRICES[0] is
  // the price of level 1, PRICES[9] the price of level 10). The real gameplay
  // math lives in the perk functions further down; `next(L)` is just the label
  // the shop shows for the level you'd reach with the NEXT purchase.
  const MAX_LEVEL = 10;
  const PRICES = [25, 40, 60, 85, 115, 150, 190, 235, 285, 350];
  const ITEMS = [
    { id: 'cleats', icon: '👟', name: 'SPEED CLEATS',
      blurb: 'Faster feet every step you take',
      next: L => '+' + (2 * L) + '% run speed' },
    { id: 'turbo',  icon: '⚡', name: 'TURBO DASH',
      blurb: 'Swipe-dashes hit harder & recharge quicker',
      next: L => 'dash +' + (15 * L) + ' speed' },
    { id: 'gloves', icon: '🧤', name: 'STICKY GLOVES',
      blurb: 'Passes stick — more catches, fewer drops',
      next: L => '+' + (2 * L) + '% catching' },
    { id: 'energy', icon: '🔋', name: 'CATCH ENERGY',
      blurb: 'Every clean catch = a burst of speed',
      next: L => ((500 + 180 * L) / 1000).toFixed(1) + 's speed burst' },
    // ---- NEW gear (v1.12) --------------------------------------------------
    { id: 'stiff',  icon: '💪', name: 'STIFF ARM',
      blurb: 'Shrug off the first tackler and keep running',
      next: L => (4 * L) + '% to break a tackle' },
    { id: 'grip',   icon: '🔒', name: 'IRON GRIP',
      blurb: 'Hold the ball tight — way fewer fumbles',
      next: L => '−' + (9 * L) + '% fumbles' },
  ];

  // ---- What you own (loaded from last time) -------------------------------
  let coins   = load('coins', 0);
  let gear    = load('gear', { cleats: 0, turbo: 0, gloves: 0, energy: 0, stiff: 0, grip: 0 });
  let daily   = load('daily', { day: 0, last: '' });  // day = last day claimed (1-7)
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
  // ✨ THE COIN CELEBRATION — a happy little spray when you win stuff
  // ------------------------------------------------------------
  // This is pure sparkle. It spawns a handful of emoji that fly up and
  // fade, plus a floating "+50 🪙" label, and then cleans itself up. It
  // NEVER touches the game or your saved coins — so it can't break a
  // thing. We fire it when you CLAIM a daily reward or BUY some gear.
  // ============================================================
  function celebrate(originEl, emoji, labelText) {
    // Where does the spray start? The button you just tapped (or, if we
    // can't find it, a little above the middle of the screen).
    const box = (originEl && originEl.getBoundingClientRect) ? originEl.getBoundingClientRect() : null;
    const cx  = box ? box.left + box.width  / 2 : window.innerWidth  / 2;
    const cy  = box ? box.top  + box.height / 2 : window.innerHeight * 0.4;

    // A see-through layer that sits ON TOP of the pop-ups so the coins
    // actually show over the shop / daily card (made once, then reused).
    let layer = $('coin-fx');
    if (!layer) {
      layer = document.createElement('div');
      layer.id = 'coin-fx';
      document.body.appendChild(layer);
    }

    // The floating "+50 🪙" (or "LEVEL 2!") that rises up and fades away.
    const label = document.createElement('div');
    label.className = 'fx-label';
    label.textContent = labelText;
    label.style.left = cx + 'px';
    label.style.top  = cy + 'px';
    layer.appendChild(label);
    label.addEventListener('animationend', () => label.remove());

    // Give the little coin counter a happy bump too.
    const chip = $('coin-chip');
    if (chip) { chip.classList.remove('bump'); void chip.offsetWidth; chip.classList.add('bump'); }

    // If this device asked for "reduce motion", we stop here — you still
    // get the label + the counter, just not the flying-coins party.
    const calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (calm) return;

    // A dozen coins spraying up and out in random directions, each one
    // told (via CSS variables) exactly where to fly.
    for (let i = 0; i < 12; i++) {
      const p = document.createElement('div');
      p.className = 'fx-coin';
      p.textContent = emoji;
      p.style.left = cx + 'px';
      p.style.top  = cy + 'px';
      p.style.setProperty('--dx', ((Math.random() * 2 - 1) * 130).toFixed(0) + 'px');
      p.style.setProperty('--dy', (-(70 + Math.random() * 150)).toFixed(0) + 'px');
      p.style.animationDelay = (Math.random() * 100).toFixed(0) + 'ms';
      layer.appendChild(p);
      p.addEventListener('animationend', () => p.remove());
    }
  }

  // ============================================================
  // 💪 THE PERKS — main.js calls these mid-play to apply your gear
  // ------------------------------------------------------------
  // Every perk scales with its gear LEVEL (0–10). The numbers below are tuned
  // so a maxed item (level 10) is a real edge without breaking the game.
  // ============================================================
  // 👟 Speed cleats: multiply your run speed (level 10 = 20% faster).
  function speedMult() { return 1 + 0.02 * gear.cleats; }

  // ⚡ Turbo dash: how much STRONGER a swipe-dash is (added to the base
  // numbers in main.js): faster burst, lasts longer, recharges sooner.
  function dashBoost() {
    return { speed: 15 * gear.turbo, time: 15 * gear.turbo, cooldown: 55 * gear.turbo };
  }

  // 🧤 Sticky gloves: nudge the catch chances (added to the base chances).
  function gloveBoost() {
    return { catchBonus: 0.02 * gear.gloves, dropCut: 0.02 * gear.gloves };
  }

  // 🔋 Catch energy: how long the after-catch speed burst lasts (0 = not owned).
  function energyMs() { return gear.energy ? 500 + 180 * gear.energy : 0; }
  const ENERGY_MULT = 1.25;   // the burst makes you 25% faster

  // 💪 Stiff arm: the chance to break the FIRST tackle of a play (level 10 = 40%).
  // main.js checks this in checkTackle and, on a hit, shoves the tackler off.
  function stiffChance() { return 0.04 * gear.stiff; }

  // 🔒 Iron grip: how much we CUT the fumble chance (a fraction of it). Level 10
  // = 0.9, i.e. 90% fewer fumbles. main.js multiplies FUMBLE_CHANCE by (1 - this).
  function gripFactor() { return 0.09 * gear.grip; }

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
      const maxed = level >= MAX_LEVEL;
      const price = PRICES[level];
      const canBuy = !maxed && coins >= price;
      return `
        <div class="shop-row">
          <div class="shop-icon">${it.icon}</div>
          <div class="shop-info">
            <div class="shop-name">${it.name} <span class="shop-pips">Lv ${level}/${MAX_LEVEL}</span></div>
            <div class="shop-blurb">${maxed ? it.blurb : 'Next: ' + it.next(level + 1)}</div>
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
        buy(btn.dataset.item, btn);
      });
    });
  }

  function buy(id, originEl) {
    const level = gear[id] || 0;
    if (level >= MAX_LEVEL) return;            // already maxed out
    if (!spend(PRICES[level])) return;         // can't afford it (button was gray anyway)
    gear[id] = level + 1;
    store('gear', gear);
    if (window.TDSound) TDSound.sting('td');   // 🎺 cha-ching!
    // 🎉 Spray the item's own icon and shout the new level. We do this BEFORE
    // renderShop() redraws the shelves — otherwise the button we're spraying
    // from would already be gone.
    const item = ITEMS.find(x => x.id === id);
    celebrate(originEl, item ? item.icon : '🪙', 'LEVEL ' + gear[id] + '!');
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
  //   1  = a fresh streak (first visit ever, or the streak broke)
  //   2+ = you claimed yesterday, so the streak continues (day 14 wraps to 1)
  function claimableDay() {
    if (daily.last === dateKey(0)) return 0;
    return (daily.last === dateKey(1)) ? (daily.day % DAILY.length) + 1 : 1;
  }

  function claim() {
    const day = claimableDay();
    if (!day) return;
    const r = DAILY[day - 1];

    earn(r.coins);
    earnedThisGame -= r.coins;  // a gift, not game winnings

    // Uniforms! Days 3 and 7 hand one out.
    const newUnis = [];
    const grant = abbr => {
      if (abbr && !owned.includes(abbr)) { owned.push(abbr); newUnis.push(abbr); }
    };
    grant(r.uniform);
    store('owned-uniforms', owned);

    daily = { day, last: dateKey(0) };
    store('daily', daily);
    if (window.TDSound) TDSound.sting(day === 7 ? 'win' : 'td');
    paintChip();
    renderDaily();
    // 🎉 Coins fly up from the CLAIM button with a big "+N 🪙"!
    celebrate($('daily-claim'), '🪙', '+' + r.coins + ' 🪙');

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
    paintChip();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wireUp);
  else wireUp();

  // Hand the player a uniform they earned outside the daily calendar (season.js
  // calls this to award the 🏆 CHAMPIONS uniform for winning the Max Bowl).
  // Returns true if it was NEW (so callers can celebrate the first time).
  function grantUniform(abbr) {
    if (!UNIFORMS[abbr] || owned.includes(abbr)) return false;
    owned.push(abbr);
    store('owned-uniforms', owned);
    return true;
  }

  // ---- What the rest of the game may use ----------------------------------
  window.TDShop = {
    // coins
    earn, spend, coins: () => coins,
    startGame: () => { earnedThisGame = 0; },
    gameEarnings: () => earnedThisGame,
    // gear perks (read by main.js during plays)
    speedMult, dashBoost, gloveBoost, energyMs, ENERGY_MULT, stiffChance, gripFactor,
    // uniforms you've unlocked (the menu adds them to the team list)
    unlockedUniforms: () => owned.map(a => UNIFORMS[a]).filter(Boolean),
    grantUniform,
    // menu hook
    onMenu,
    // ✨ the celebration spray — progress.js reuses it for a LEVEL UP! party
    celebrate,
  };
})();
