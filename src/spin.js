// ============================================================
// TOUCHDOWN FUN — spin.js: 🎡 THE LUCKY SPIN (timed buff wheel)
// ------------------------------------------------------------
// Every few minutes you get ONE spin of the wheel. Where it lands is a
// surprise BUFF that makes your player better for a little while — or,
// if you're unlucky, a tiny prize (or nothing at all!). The really good
// buffs are SUPER rare, so landing on ⚡ TURBO or 🌟 GOD MODE feels
// amazing — that's the whole hook: "just one more spin!"
//
//   How rare is rare? Each slice has a WEIGHT. Common junk is heavy
//   (lands a lot); the legendary slices weigh almost nothing, so you
//   only hit them once in a blue moon (GOD MODE is about 1-in-100).
//
//   How do the buffs actually DO anything? They don't touch the game
//   loop at all. Instead the Pro Shop's perk math (src/shop.js) quietly
//   folds in whatever buff is active right now — so a speed buff STACKS
//   on top of your cleats, "Sure Hands" turns off fumbles & picks, and
//   so on. When the timer runs out, everything snaps back to normal.
//
// Saves through the same tdr- store as everything else, so your
// cooldown and any buff-in-progress survive a page reload (you can't
// just refresh to get a free spin!).
//
// main.js/shop.js talk to us through window.TDSpin — see the bottom.
// ============================================================
(function () {
  'use strict';

  // Borrow the little localStorage helpers from stats.js (loaded first).
  const T = window.TDStats ? TDStats.shared : null;
  const store = (k, v) => { if (T) T.store(k, v); };
  const load  = (k, f) => (T ? T.load(k, f) : f);
  const $ = id => document.getElementById(id);

  // ---- ⏱ How often can you spin? -----------------------------------------
  // "Every few minutes." Three real minutes between spins — long enough to
  // feel like a treat, short enough to keep you coming back. (Your very first
  // spin is free right away.)
  const COOLDOWN = 3 * 60 * 1000;

  // ---- 🎨 The four rarity tiers (just colors + a shout for the reveal) ----
  const TIERS = {
    common:    { color: '#6b7a8d', label: 'COMMON' },
    uncommon:  { color: '#2fa15a', label: 'UNCOMMON' },
    rare:      { color: '#7b4de0', label: 'RARE!' },
    legendary: { color: '#f0b429', label: 'LEGENDARY!!!' },
  };

  // ---- 🎁 The wheel! ------------------------------------------------------
  // `weight`  = how likely this slice is (bigger = more common).
  // `dur`     = how long the buff lasts, in ms (0 = it's instant, like coins).
  // `coins`   = instant coins to hand over (for the prize slices).
  // `fx`      = the actual buff, read live by shop.js while it's active:
  //     speed     — run-speed multiplier (1 = none)
  //     catch     — added to your catch chance AND drop-proofing (0 = none)
  //     safeThrow — 1 = your passes can't be intercepted
  //     safeBall  — 1 = you can't fumble
  //     truck     — chance (0..1) to bust the first tackle every play
  //
  // The ORDER here is also the order around the wheel — the two legendary
  // slices sit across from each other so both shiny prizes stay in view.
  const BUFFS = [
    { id: 'coins-s', tier: 'common',    icon: '🪙', name: 'POCKET CHANGE',
      blurb: 'A few coins for your piggy bank.', weight: 20, dur: 0, coins: 5, fx: {} },
    { id: 'speed-u', tier: 'uncommon',  icon: '👟', name: 'SPEED BOOST',
      blurb: 'Zoom! Faster feet for 2 minutes.', weight: 12, dur: 120000, fx: { speed: 1.28 } },
    { id: 'dud',     tier: 'common',    icon: '🍀', name: 'NO LUCK',
      blurb: 'Aw, nothing this time. Spin again soon!', weight: 15, dur: 0, fx: {} },
    { id: 'turbo',   tier: 'legendary', icon: '⚡', name: 'TURBO MODE',
      blurb: 'Super speed AND sticky hands — for 90s!', weight: 2, dur: 90000, fx: { speed: 1.5, catch: 0.35 } },
    { id: 'catch-u', tier: 'uncommon',  icon: '🧤', name: 'STICKY HANDS',
      blurb: 'Catches stick for 2 minutes.', weight: 12, dur: 120000, fx: { catch: 0.30 } },
    { id: 'coins-m', tier: 'uncommon',  icon: '🪙', name: 'COIN STASH',
      blurb: 'A nice pile of coins!', weight: 9, dur: 0, coins: 30, fx: {} },
    { id: 'safe',    tier: 'rare',      icon: '🎯', name: 'SURE HANDS',
      blurb: 'No fumbles, no picks — 2 whole minutes!', weight: 6, dur: 120000, fx: { safeThrow: 1, safeBall: 1 } },
    { id: 'speed-c', tier: 'common',    icon: '💨', name: 'FRESH LEGS',
      blurb: 'A little pep in your step for 90s.', weight: 20, dur: 90000, fx: { speed: 1.12 } },
    { id: 'god',     tier: 'legendary', icon: '🌟', name: 'GOD MODE',
      blurb: 'EVERYTHING at once — you are UNSTOPPABLE!', weight: 1, dur: 90000,
      fx: { speed: 1.7, catch: 0.5, safeThrow: 1, safeBall: 1, truck: 0.95 } },
    { id: 'truck',   tier: 'rare',      icon: '💪', name: 'TRUCK STICK',
      blurb: 'Bust tackles & run a bit faster — 90s!', weight: 5, dur: 90000, fx: { truck: 0.85, speed: 1.1 } },
    { id: 'coins-l', tier: 'rare',      icon: '💰', name: 'COIN JACKPOT',
      blurb: 'KA-CHING! A big bag of coins!', weight: 3, dur: 0, coins: 100, fx: {} },
  ];
  const byId = id => BUFFS.find(b => b.id === id) || null;

  // ---- 🧠 What we remember between visits ---------------------------------
  //   last    = when you last spun (ms since 1970) — powers the cooldown
  //   id      = the buff that's still ticking (or null)
  //   until   = when that buff wears off (ms since 1970)
  //   credits = 🎡 FREE SPINS you've banked (from the daily rewards) — each one
  //             lets you spin RIGHT NOW without waiting out the cooldown.
  const data = load('spin', { last: 0, id: null, until: 0, credits: 0 });
  let last  = data.last  || 0;
  let curId = (data.id && data.until > Date.now()) ? data.id : null;
  let until = curId ? data.until : 0;
  let credits = data.credits || 0;
  let spinning = false;   // true only during the wheel animation

  function save() { store('spin', { last, id: curId, until, credits }); }

  // ---- ⏱ Cooldown helpers -------------------------------------------------
  function msLeft()    { return Math.max(0, COOLDOWN - (Date.now() - last)); }
  function cooldownUp(){ return last === 0 || msLeft() === 0; }
  // You can spin if your timer is up OR you have a banked free spin to burn.
  function ready()     { return cooldownUp() || credits > 0; }
  function clock(ms) { const s = Math.ceil(ms / 1000); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }

  // ---- 💪 THE LIVE BUFF — shop.js asks these mid-play ---------------------
  // If the active buff has worn off, we tidy it away first, so these always
  // tell the truth. Every getter falls back to "no effect".
  function curBuff() {
    if (curId && Date.now() >= until) { curId = null; until = 0; save(); refresh(); }
    return curId ? byId(curId) : null;
  }
  function fx(key, dflt) { const b = curBuff(); return (b && b.fx[key] != null) ? b.fx[key] : dflt; }
  const speedMult = () => fx('speed', 1);      // × your run speed
  const catchAdd  = () => fx('catch', 0);      // + your catch & drop-proofing
  const safeThrow = () => fx('safeThrow', 0);  // 1 = no interceptions
  const safeBall  = () => fx('safeBall', 0);   // 1 = no fumbles
  const truck     = () => fx('truck', 0);      // 0..1 break-a-tackle chance

  // ============================================================
  // 🎡 THE WHEEL — an SVG pie we spin with a CSS rotate
  // ------------------------------------------------------------
  // Slices are drawn clockwise starting straight UP (12 o'clock). A point at
  // "wheel angle" φ (0 = top, growing clockwise) sits at:
  //     x = CX + r·sin(φ),  y = CY − r·cos(φ)
  // The pointer is pinned at the top, so whichever slice ends up at φ≈0 wins.
  // ============================================================
  const CX = 160, CY = 160, R = 150, ICON_R = 104;
  const SEG = 360 / BUFFS.length;
  let curRot = 0;   // the wheel's current rotation (only ever grows, so it always spins forward)
  let built  = false;

  const rad = d => (d - 90) * Math.PI / 180;          // wheel-angle → screen radians (already offset to top)
  const px  = (phi, r) => (CX + r * Math.cos(rad(phi))).toFixed(2);
  const py  = (phi, r) => (CY + r * Math.sin(rad(phi))).toFixed(2);

  function buildWheel() {
    const g = $('spin-rot');
    if (!g || built) return;
    const slices = BUFFS.map((b, i) => {
      const a0 = i * SEG, a1 = (i + 1) * SEG, mid = a0 + SEG / 2;
      const col = TIERS[b.tier].color;
      const path = `M ${CX} ${CY} L ${px(a0, R)} ${py(a0, R)} A ${R} ${R} 0 0 1 ${px(a1, R)} ${py(a1, R)} Z`;
      // Legendary slices get a bright gold ring so you can SEE the jackpot you're chasing.
      const leg = b.tier === 'legendary';
      return `<path d="${path}" fill="${col}" stroke="${leg ? '#fff3c4' : '#0b1220'}" stroke-width="${leg ? 3 : 2}"/>
              <text x="${px(mid, ICON_R)}" y="${py(mid, ICON_R)}" text-anchor="middle" dominant-baseline="central"
                    font-size="26">${b.icon}</text>`;
    }).join('');
    g.innerHTML = slices;
    built = true;
  }

  // Weighted random: heavier slices win more often.
  function pickBuff() {
    let total = 0; BUFFS.forEach(b => total += b.weight);
    let r = Math.random() * total;
    for (const b of BUFFS) { if ((r -= b.weight) < 0) return b; }
    return BUFFS[0];
  }

  // Where must the wheel stop so slice `i` sits under the top pointer?
  // Its center is at (i+0.5)·SEG clockwise from top; we need that to reach 0
  // (mod 360). Add a handful of extra whole turns for a satisfying whirl.
  function landingRot(i) {
    const mid  = (i + 0.5) * SEG;
    const want = ((-mid) % 360 + 360) % 360;
    let target = Math.ceil((curRot + 5 * 360) / 360) * 360 + want;
    if (target <= curRot) target += 360;
    return target;
  }

  const calm = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function doSpin() {
    if (spinning || !ready()) return;
    spinning = true;
    // If your timer is up, this is your normal spin and it restarts the cooldown.
    // Otherwise you're spending a banked 🎡 FREE SPIN, which leaves the timer alone.
    if (cooldownUp()) last = Date.now();
    else credits = Math.max(0, credits - 1);
    save();
    renderModal();                   // flip the button to "SPINNING…"

    const buff = pickBuff();
    const i = BUFFS.indexOf(buff);
    const g = $('spin-rot');
    const quick = calm();
    curRot = landingRot(i);
    if (g) {
      // Set the transition first, then the new angle in the SAME tick. The CSS
      // transition animates from wherever the wheel is now to the landing spot.
      // (We do NOT use requestAnimationFrame here — a browser pauses rAF whenever
      // the tab isn't the one you're looking at, which would freeze the wheel;
      // a plain style set always lands, and animates smoothly when you're watching.)
      g.style.transition = quick ? 'none' : 'transform 4.2s cubic-bezier(.16,.7,.2,1)';
      g.style.transform = 'rotate(' + curRot + 'deg)';
    }
    if (window.TDSound) TDSound.sting('td');   // a little tick to say "here we go!"
    setTimeout(() => reveal(buff), quick ? 200 : 4300);
  }

  // The wheel stopped — hand over the prize and throw a party sized to how
  // lucky you got.
  function reveal(buff) {
    spinning = false;

    // Prize! Coins are instant; timed buffs start their clock now.
    if (buff.coins && window.TDShop) TDShop.earn(buff.coins);
    if (buff.dur) { curId = buff.id; until = Date.now() + buff.dur; }
    save();

    // Show the result card inside the modal.
    const box = $('spin-result');
    if (box) {
      const t = TIERS[buff.tier];
      box.className = 'spin-result show tier-' + buff.tier;
      box.innerHTML =
        `<div class="sr-tier" style="color:${t.color}">${t.label}</div>
         <div class="sr-icon">${buff.icon}</div>
         <div class="sr-name">${buff.name}</div>
         <div class="sr-blurb">${buff.blurb}</div>`;
    }

    // Sound + confetti: the sadder the slice, the quieter the party.
    const big = buff.tier === 'legendary';
    if (buff.id === 'dud') {
      if (window.TDSound) TDSound.sting('stuff');   // 🥁 the sad "bum bum bum"
    } else if (window.TDShop && TDShop.celebrate) {
      if (window.TDSound) TDSound.sting(big ? 'win' : 'td');
      TDShop.celebrate($('spin-do'), buff.icon, buff.name + '!');
      if (big) setTimeout(() => TDShop.celebrate($('spin-wheel-wrap'), '✨', ''), 250);
    }

    renderModal();
    refresh();
  }

  // ============================================================
  // 🖼 The modal, the menu button & the in-game buff pill
  // ============================================================
  function renderModal() {
    buildWheel();
    const btn = $('spin-do');
    if (btn) {
      if (spinning)         { btn.textContent = 'SPINNING…';           btn.className = 'ov-btn spinning'; }
      else if (cooldownUp()){ btn.textContent = 'SPIN! 🎡';            btn.className = 'ov-btn yes'; }
      else if (credits > 0) { btn.textContent = 'FREE SPIN! 🎡';       btn.className = 'ov-btn yes'; }
      else                  { btn.textContent = '⏱ ' + clock(msLeft());btn.className = 'ov-btn waiting'; }
    }
    // The little "you have free spins!" note under the sub-title.
    const cr = $('spin-credits');
    if (cr) {
      if (credits > 0 && !spinning) {
        cr.style.display = 'block';
        cr.innerHTML = '🎡 <b>' + credits + '</b> free spin' + (credits > 1 ? 's' : '') + ' ready — spin now, no waiting!';
      } else cr.style.display = 'none';
    }
  }

  // The 🎡 menu button glows when a spin is ready, and shows a badge counting
  // any banked FREE SPINS.
  function refreshBtn() {
    const el = $('open-spin');
    if (el) el.classList.toggle('ready', ready() && !spinning);
    const b = $('spin-badge');
    if (b) {
      if (credits > 0) { b.textContent = credits; b.style.display = 'flex'; }
      else b.style.display = 'none';
    }
  }

  // A little pill that rides along the top while a buff is live, counting down.
  function refreshPill() {
    const pill = $('buff-pill');
    if (!pill) return;
    const b = curBuff();
    if (!b || !b.dur) { pill.classList.remove('show'); return; }
    const left = Math.max(0, until - Date.now());
    pill.className = 'buff-pill show tier-' + b.tier;
    pill.innerHTML = `<span class="bp-ic">${b.icon}</span><span class="bp-nm">${b.name}</span>` +
                     `<span class="bp-t">${clock(left)}</span>`;
  }

  function refresh() { refreshBtn(); refreshPill(); if ($('spin-modal') && $('spin-modal').style.display === 'flex') renderModal(); }

  // ---- Pop-up plumbing (same recipe as the shop) --------------------------
  function gameKeyboard(on) { try { window.game.input.keyboard.enabled = on; } catch (e) {} }
  function openModal() {
    const el = $('spin-modal');
    if (!el) return;
    gameKeyboard(false);
    const box = $('spin-result');
    if (box && !spinning) { box.className = 'spin-result'; box.innerHTML = ''; }   // clear last result
    el.style.display = 'flex';
    renderModal();
  }
  function closeModal() {
    const el = $('spin-modal');
    if (el) el.style.display = 'none';
    gameKeyboard(true);
  }

  // ---- Wire the buttons + start the once-a-second heartbeat ---------------
  function onTap(id, fn) {
    const el = $(id);
    if (el) el.addEventListener('pointerdown', e => { e.preventDefault(); fn(); });
  }
  function wireUp() {
    onTap('open-spin',  openModal);
    onTap('spin-do',    doSpin);
    onTap('spin-close', closeModal);
    refresh();
    // Tick every half-second to keep the countdowns & glow honest.
    setInterval(refresh, 500);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wireUp);
  else wireUp();

  // 🎡 Bank some FREE SPINS (the daily rewards call this). Each one lets you spin
  // without waiting for the cooldown. Refreshes the button glow + badge right away.
  function grantFreeSpins(n) {
    n = Math.max(0, Math.floor(n || 0));
    if (!n) return;
    credits += n;
    save();
    refresh();
  }

  // ---- What the rest of the game may use ----------------------------------
  window.TDSpin = {
    // live buff values, folded into the shop perks during play
    speedMult, catchAdd, safeThrow, safeBall, truck,
    // 🎁 daily rewards hand out free spins through here
    grantFreeSpins,
    // handy for menus / debugging
    current: () => curBuff(),
    ready, msLeft, freeSpins: () => credits,
  };
})();
