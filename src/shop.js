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
    // 🎽 v1.31 — three NEW styles you can BUY with coins in the Pro Shop's
    //    STYLES shelf (a `price` = it's for sale). They join your team menu once bought.
    FIRE: { abbr: 'FIRE', name: 'FIREBALL',    jersey: 0x8a1f06, helmet: 0xff7a1a, special: true, price: 120 },
    AQUA: { abbr: 'AQUA', name: 'AQUA STORM',  jersey: 0x06406a, helmet: 0x22d3ee, special: true, price: 160 },
    VOID: { abbr: 'VOID', name: 'VOID STAR',   jersey: 0x14091f, helmet: 0x8a4dff, special: true, price: 240 },
  };
  // The abbrs that are for SALE in the shop (in display order).
  const SHOP_UNIS = ['FIRE', 'AQUA', 'VOID'];

  // ---- 🎁 The 14-day reward calendar --------------------------------------
  // coins/uniform = what EVERYONE gets, every day, for FREE. Five days hand out
  // an exclusive uniform (days 3, 7, 10, 12 & 14); the coins climb as your streak
  // grows, and day 14 is the grand-finale jackpot. Keep the streak alive — miss a
  // day and it starts back at day 1!
  // Three days now hand out 🎡 FREE SPINS instead of coins (days 2, 6 & 11) —
  // banked spins you can use on the Lucky Spin wheel without waiting out its timer.
  const DAILY = [
    { coins: 10 },                    // day 1
    { spins: 2 },                     // day 2  🎡 FREE SPINS
    { coins: 10, uniform: 'GLX' },    // day 3  🎽 GALAXY
    { coins: 20 },                    // day 4
    { coins: 25 },                    // day 5
    { spins: 3 },                     // day 6  🎡 FREE SPINS
    { coins: 50, uniform: 'GLD' },    // day 7  🎽 GOLD RUSH
    { coins: 30 },                    // day 8
    { coins: 35 },                    // day 9
    { coins: 40, uniform: 'LAV' },    // day 10 🎽 LAVA (brand new!)
    { spins: 3 },                     // day 11 🎡 FREE SPINS
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
    // ---- NEW gear (v1.31) — each ties into a recent feature -----------------
    { id: 'arm',    icon: '🎯', name: 'CANNON ARM',
      blurb: 'Zip your passes in — way fewer interceptions',
      next: L => '−' + (5 * L) + '% picks thrown' },
    { id: 'allwx',  icon: '🧥', name: 'ALL-WEATHER GEAR',
      blurb: 'Shrug off rain, wind, snow & the cold',
      next: L => (8 * L) + '% weather-proof' },
    { id: 'toe',    icon: '🦵', name: 'GOLDEN TOE',
      blurb: 'Steadier aim + more time before the block',
      next: L => 'kicks ' + (6 * L) + '% easier' },
    { id: 'hawk',   icon: '🖐', name: 'BALL HAWK',
      blurb: 'Snag more picks & fumbles on defense',
      next: L => '+' + (2 * L) + '% takeaways' },
  ];

  // ---- What you own (loaded from last time) -------------------------------
  let coins   = load('coins', 0);
  let gear    = load('gear', { cleats: 0, turbo: 0, gloves: 0, energy: 0, stiff: 0, grip: 0 });
  // Make sure every shop item has a level, even in OLD saves from before it existed
  // (otherwise a new perk would read `undefined` and go NaN). New items start at 0.
  ITEMS.forEach(it => { if (gear[it.id] == null) gear[it.id] = 0; });
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
  // Big piles get shortened (12,340 → "12.3k") so the coin chip stays narrow —
  // the menu row has eight chips on it now and a five-digit number pushed the
  // last one off the edge of a phone. The real number is always in the Pro Shop.
  function shortCoins(n) {
    if (n < 10000) return String(n);
    const k = n / 1000;
    return (k < 100 ? k.toFixed(1) : Math.round(k)) + 'k';
  }
  function paintChip() {
    const el = $('coin-amt');
    if (el) el.textContent = shortCoins(coins);
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
  // 🎡 A tiny bridge to the Lucky Spin (src/spin.js). If a spin buff is live
  // right now, these fold its boost into your gear below — so a speed buff
  // STACKS on your cleats, "Sure Hands" turns off picks/fumbles, etc. No buff
  // (or the wheel not loaded yet) = every one of these is a harmless "do nothing".
  const spin = () => window.TDSpin || null;
  const spinSpeed = () => { const s = spin(); return s ? s.speedMult() : 1; };
  const spinCatch = () => { const s = spin(); return s ? s.catchAdd()  : 0; };
  const spinSafeThrow = () => { const s = spin(); return s ? s.safeThrow() : 0; };
  const spinSafeBall  = () => { const s = spin(); return s ? s.safeBall()  : 0; };
  const spinTruck     = () => { const s = spin(); return s ? s.truck()     : 0; };
  // ⚡ Power-Up Plays fold in the same harmless way (×1 / +0 when nothing's firing).
  const puSpeed = () => (window.TDPowerup ? window.TDPowerup.speedMult() : 1);
  const puCatch = () => (window.TDPowerup ? window.TDPowerup.catchAdd()  : 0);
  // 🎓 The GAME PLAN folds in the same way — but it's the only one that can go
  // DOWN as well as up (that's the point of it: every plan costs you something).
  // With no plan chosen, or the file missing, these are ×1 / +0 exactly like the
  // others, so the game is untouched.
  const gpSpeed = () => (window.TDPlan ? window.TDPlan.speedMult() : 1);
  const gpCatch = () => (window.TDPlan ? window.TDPlan.catchAdd()  : 0);
  const gpArm   = () => (window.TDPlan ? window.TDPlan.armAdd()    : 0);
  const gpStiff = () => (window.TDPlan ? window.TDPlan.stiffAdd()  : 0);
  const gpGrip  = () => (window.TDPlan ? window.TDPlan.gripAdd()   : 0);
  // Keep every final number inside the range main.js expects.
  //
  // ⚠️ These are allowed to go NEGATIVE on purpose — that's how a game plan's
  // downside actually bites. main.js reads them as:
  //     picks   = intChance   * (1 - armAccuracy())   → negative ⇒ MORE picks
  //     fumbles = fumbleChance* (1 - gripFactor())    → negative ⇒ MORE fumbles
  //     catches = CATCH_CHANCE + catchBonus           → negative ⇒ fewer catches
  // Clamping those at 0 (as I first did) quietly deleted the cost of a plan for
  // anyone without the matching gear, which made ⚖️ BALANCED strictly worse than
  // 🏃 GROUND & POUND — a free upgrade. So we floor them well below zero and only
  // cap the top end.
  // 🎓 The COACHING STAFF folds in the same harmless way (+0 / ×1 with nobody hired).
  const stArm   = () => (window.TDStaff ? window.TDStaff.armAdd()    : 0);
  const stCatch = () => (window.TDStaff ? window.TDStaff.catchAdd()  : 0);
  const stHawk  = () => (window.TDStaff ? window.TDStaff.hawkAdd()   : 0);
  const stToe   = () => (window.TDStaff ? window.TDStaff.toeAdd()    : 0);
  const stSpeed = () => (window.TDStaff ? window.TDStaff.speedMult() : 1);
  // 🧑‍🤝‍🧑 TEAM CHEMISTRY folds in the same harmless way: a hot room is a touch
  // quicker and surer-handed, a cold one a touch worse, and a brand-new save
  // sitting at the ordinary middle reads exactly x1 and +0.
  const chSpeed = () => (window.TDChem ? window.TDChem.speedMult() : 1);
  const chCatch = () => (window.TDChem ? window.TDChem.catchAdd()  : 0);
  const clampPerk = (v, lo) => Math.max(lo, Math.min(0.95, v));
  // stiffChance is a raw probability main.js rolls against, so it alone must
  // stay inside 0..1.
  const clamp01 = v => Math.max(0, Math.min(1, v));

  // 👟 Speed cleats: multiply your run speed (level 10 = 20% faster).
  //    …times any 🎡 speed buff that's ticking right now.
  function speedMult() { return (1 + 0.02 * gear.cleats) * spinSpeed() * puSpeed() * gpSpeed() * stSpeed() * chSpeed(); }

  // ⚡ Turbo dash: how much STRONGER a swipe-dash is (added to the base
  // numbers in main.js): faster burst, lasts longer, recharges sooner.
  function dashBoost() {
    return { speed: 15 * gear.turbo, time: 15 * gear.turbo, cooldown: 55 * gear.turbo };
  }

  // 🧤 Sticky gloves: nudge the catch chances (added to the base chances).
  //    A 🎡 catch buff (Sticky Hands / Turbo / God Mode) piles on top.
  function gloveBoost() {
    const extra = spinCatch() + puCatch() + gpCatch() + stCatch() + chCatch();
    const v = clampPerk(0.02 * gear.gloves + extra, -0.30);
    return { catchBonus: v, dropCut: v };
  }

  // 🔋 Catch energy: how long the after-catch speed burst lasts (0 = not owned).
  function energyMs() { return gear.energy ? 500 + 180 * gear.energy : 0; }
  const ENERGY_MULT = 1.25;   // the burst makes you 25% faster

  // 💪 Stiff arm: the chance to break the FIRST tackle of a play (level 10 = 40%).
  // main.js checks this in checkTackle and, on a hit, shoves the tackler off.
  //    🎡 Truck Stick / God Mode set a big floor here (bust nearly every tackle).
  function stiffChance() { return clamp01(Math.max(0.04 * gear.stiff, spinTruck()) + gpStiff()); }

  // 🔒 Iron grip: how much we CUT the fumble chance (a fraction of it). Level 10
  // = 0.9, i.e. 90% fewer fumbles. main.js multiplies FUMBLE_CHANCE by (1 - this).
  //    🎡 A "safe ball" buff (Sure Hands / God Mode) pushes this to 1 = no fumbles.
  function gripFactor() { const g = 0.09 * gear.grip; return clampPerk(1 - (1 - g) * (1 - spinSafeBall()) + gpGrip(), -0.50); }

  // 🎯 Cannon arm: how much we CUT the chance a contested pass is intercepted.
  // Level 10 = 0.5 (half as many picks). main.js multiplies its INT chance by (1 - this).
  //    🎡 A "safe throw" buff (Sure Hands / God Mode) pushes this to 1 = no picks.
  function armAccuracy() { const a = 0.05 * gear.arm; return clampPerk(1 - (1 - a) * (1 - spinSafeThrow()) + gpArm() + stArm(), -0.50); }

  // 🧥 All-weather gear: how much you SHRUG OFF the weather (0 = full effect, 0.8
  // at level 10). main.js/kick.js blend a weather multiplier back toward 1.0 by this,
  // so catches & field goals suffer less in rain/wind/snow/cold. Read live.
  function weatherResist() { return 0.08 * gear.allwx; }

  // 🦵 Golden toe: how much EASIER kicks are (0..0.6). kick.js slows the aim swing,
  // gives more time before the rusher, and needs a little less power. Read on enter.
  function toeFactor() { return 0.06 * gear.toe + stToe(); }

  // 🖐 Ball hawk: extra takeaway chance on defense (0..0.20 at level 10). The
  // DefenseSim adds this to its interception & fumble odds. Read per play.
  function hawkBoost() { return 0.02 * gear.hawk + stHawk(); }

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

    renderShopUniforms();   // 🎽 the STYLES shelf below the gear
  }

  // 🎽 The STYLES shelf: buy new uniforms with coins. Owned ones show a check;
  // the rest show their price (grayed out until you can afford them).
  function renderShopUniforms() {
    const box = $('shop-uniforms');
    if (!box) return;
    box.innerHTML = SHOP_UNIS.map(abbr => {
      const u = UNIFORMS[abbr];
      const have = owned.includes(abbr);
      const canBuy = !have && coins >= u.price;
      const hex = n => '#' + n.toString(16).padStart(6, '0');
      return `
        <div class="shop-row">
          <div class="uni-chip" style="background:linear-gradient(${hex(u.jersey)} 50%,${hex(u.helmet)} 50%)"></div>
          <div class="shop-info">
            <div class="shop-name">${u.name}</div>
            <div class="shop-blurb">${have ? 'In your team menu' : 'A fresh look for your squad'}</div>
          </div>
          <div class="shop-buy ${have ? 'maxed' : canBuy ? '' : 'poor'}" data-uni="${abbr}">
            ${have ? 'OWNED ✓' : u.price + ' 🪙'}
          </div>
        </div>`;
    }).join('');
    box.querySelectorAll('.shop-buy[data-uni]').forEach(btn => {
      btn.addEventListener('pointerdown', e => { e.preventDefault(); buyUniform(btn.dataset.uni, btn); });
    });
  }

  function buyUniform(abbr, originEl) {
    const u = UNIFORMS[abbr];
    if (!u || owned.includes(abbr)) return;
    if (!spend(u.price)) return;                 // can't afford (button was gray)
    owned.push(abbr);
    store('owned-uniforms', owned);
    if (window.TDSound) TDSound.sting('win');
    celebrate(originEl, '🎽', u.name + '!');
    renderShop();
    // Pop the team menu to the new style so you can see it right away.
    if (window.TDMenu) setTimeout(() => { closeOv('shop-modal'); TDMenu.showTeam(abbr); }, 900);
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

    if (r.coins) {
      earn(r.coins);
      earnedThisGame -= r.coins;  // a gift, not game winnings
    }
    // 🎡 FREE SPINS days (2, 6 & 11) bank spins on the Lucky Spin wheel instead.
    if (r.spins && window.TDSpin && TDSpin.grantFreeSpins) TDSpin.grantFreeSpins(r.spins);

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
    // 🎉 The reward flies up from the CLAIM button — coins, or free spins!
    if (r.spins) celebrate($('daily-claim'), '🎡', '+' + r.spins + ' FREE SPIN' + (r.spins > 1 ? 'S' : ''));
    else         celebrate($('daily-claim'), '🪙', '+' + r.coins + ' 🪙');

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
      const reward = r.uniform ? uniChip(r.uniform)
                   : r.spins  ? '🎡<div class="uni-name">' + r.spins + ' FREE SPIN' + (r.spins > 1 ? 'S' : '') + '</div>'
                   : '🪙' + r.coins;
      return `
        <div class="${cls}">
          <div class="day-num">${claimed ? '✓' : 'DAY ' + d}</div>
          <div class="day-free">${reward}</div>
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
    //
    // …but NOT to a brand-new player. Someone who has never played a down
    // doesn't want a rewards calendar for a game they haven't tried yet — they
    // want the football. A pop-up in their face before the first snap is the
    // fastest way to lose them (and game portals check for exactly this).
    // So: first visit = straight to the team screen, one tap to PLAY. The 🎁
    // DAILY button is still right there, glowing, whenever they want it.
    // Once they've finished a game they're a real player, and the doorbell
    // rings again like it always did.
    const played = load('games', 0) > 0;
    if (played && !autoOpened && claimableDay()) {
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

  // 🏆 The full uniform catalog for the Trophy Case — every style, whether you
  // own it yet, and how to earn the ones you don't. Read live, so `owned` is current.
  function uniformCatalog() {
    const dayOf = {};
    DAILY.forEach((r, i) => { if (r.uniform) dayOf[r.uniform] = i + 1; });
    const order = ['GLX', 'GLD', 'LAV', 'ICE', 'BLK', 'FIRE', 'AQUA', 'VOID', 'CHMP'];
    return order.map(abbr => {
      const u = UNIFORMS[abbr];
      if (!u) return null;
      let how;
      if (u.price)              how = 'Pro Shop · ' + u.price + ' 🪙';
      else if (abbr === 'CHMP') how = 'Win the Max Bowl 🏆';
      else if (dayOf[abbr])     how = 'Daily reward · Day ' + dayOf[abbr];
      else                      how = 'Special reward';
      return { abbr, name: u.name, jersey: u.jersey, helmet: u.helmet, owned: owned.includes(abbr), how };
    }).filter(Boolean);
  }

  // ---- What the rest of the game may use ----------------------------------
  window.TDShop = {
    // coins
    earn, spend, coins: () => coins,
    startGame: () => { earnedThisGame = 0; },
    gameEarnings: () => earnedThisGame,
    // gear perks (read by main.js / kick.js during plays)
    speedMult, dashBoost, gloveBoost, energyMs, ENERGY_MULT, stiffChance, gripFactor,
    armAccuracy, weatherResist, toeFactor, hawkBoost,
    // uniforms you've unlocked (the menu adds them to the team list)
    unlockedUniforms: () => owned.map(a => UNIFORMS[a]).filter(Boolean),
    uniformCatalog,   // 🏆 the full collection (owned + how to earn) for the Trophy Case
    grantUniform,
    // menu hook
    onMenu,
    // ✨ the celebration spray — progress.js reuses it for a LEVEL UP! party
    celebrate,
  };
})();
