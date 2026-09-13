// ============================================================
// TOUCHDOWN FUN — powerup.js: ⚡ POWER-UP PLAYS
// ------------------------------------------------------------
// A once-a-game HERO MOVE you pick ahead of time and set off YOURSELF at the
// perfect moment (unlike the 🎡 Lucky Spin, whose buffs land at random). Equip
// one in the Pro Shop, then tap the ⭐ button during a play to unleash it:
//
//   ⚡ TURBO LEGS    — blaze downfield, way faster for a few seconds.
//   🧤 STICKY HANDS  — glue on the gloves: catch almost anything.
//   ❄️ FREEZE DEFENSE — ice the defenders: they crawl while you cut loose.
//
// You get ONE per game — so save it for 4th-and-goal!
//
//   HOW IT WORKS (and why it's safe) — same trick the Lucky Spin uses: we DON'T
//   touch the game loop, we just hand out live multipliers that code already
//   reads. While TURBO/STICKY is firing, shop.js folds our speed/catch boost
//   into its perk math; while FREEZE is firing, main.js's one defender-speed
//   line multiplies by our defSlow(). No power firing = every getter returns a
//   harmless "×1 / +0", so the game plays exactly as before.
//
// Saved in `tdr-powerup` = which power you've got equipped ('turbo' by default).
// The "one per game" is just in memory — main.js calls newGame() each kickoff.
// ============================================================
(function () {
  'use strict';

  const T = window.TDStats ? TDStats.shared : null;
  const store = (k, v) => { if (T) T.store(k, v); };
  const load  = (k, f) => (T ? T.load(k, f) : f);
  const $ = id => document.getElementById(id);

  // The three powers: how they read, and how STRONG / how LONG each fires.
  const POWERS = {
    turbo:  { icon: '⚡', name: 'TURBO LEGS',     blurb: 'Blaze downfield — 70% faster for a few seconds. Break one loose!', color: '#ffd54a', dur: 3000 },
    sticky: { icon: '🧤', name: 'STICKY HANDS',   blurb: 'Glue on the gloves — catch almost anything you can reach.',       color: '#46e3a0', dur: 4500 },
    freeze: { icon: '❄️', name: 'FREEZE DEFENSE', blurb: 'Ice the defenders — they crawl while you slip away.',             color: '#8fd0ff', dur: 2600 },
  };
  const ORDER = ['turbo', 'sticky', 'freeze'];

  let equipped = load('powerup', 'turbo');
  if (!POWERS[equipped]) equipped = 'turbo';

  let usedThisGame = false;   // you only get one per game
  let activeKind = null, activeUntil = 0;
  const firing = kind => activeKind === kind && Date.now() < activeUntil;

  // ---- live multipliers the rest of the game reads (harmless when idle) ----
  function speedMult() { return firing('turbo')  ? 1.7  : 1; }   // shop.js speedMult folds this in
  function catchAdd()  { return firing('sticky') ? 0.6  : 0; }   // shop.js gloveBoost adds this on
  function defSlow()   { return firing('freeze') ? 0.15 : 1; }   // main.js updateDefense multiplies by this

  // ---- 🏈 main.js: fresh game — you get your one power back ----------------
  function newGame() { usedThisGame = false; activeKind = null; activeUntil = 0; paintBtn(); }

  // ---- fire it! (the in-game ⭐ button) ------------------------------------
  function fire() {
    const g = window.__td && window.__td.G;
    if (!g) return;
    if (usedThisGame) { toast('Already used your power this game!', false); return; }
    // only mid-play, when it can actually do something
    if (g.state !== 'live' && g.state !== 'pass') { toast('Snap the ball first, then fire!', false); return; }
    const p = POWERS[equipped]; if (!p) return;
    usedThisGame = true;
    activeKind = equipped;
    activeUntil = Date.now() + p.dur;
    bigFlash(p);
    if (window.TDSound && TDSound.sting) { try { TDSound.sting('win'); } catch (e) {} }
    paintBtn();
  }

  // ---- the big splashy "POWER!" moment + little hint toasts ---------------
  let flashT = 0;
  function bigFlash(p) {
    const el = $('power-flash'); if (!el) return;
    el.style.setProperty('--pc', p.color);
    el.innerHTML = `<span class="pf-ic">${p.icon}</span><span class="pf-nm">${p.name}!</span>`;
    el.className = 'power-flash fire show';
    clearTimeout(flashT); flashT = setTimeout(() => { el.className = 'power-flash'; }, 1200);
  }
  function toast(msg, good) {
    const el = $('power-flash'); if (!el) return;
    el.style.setProperty('--pc', good ? '#46e3a0' : '#ffb04d');
    el.innerHTML = `<span class="pf-hint">${msg}</span>`;
    el.className = 'power-flash hint show';
    clearTimeout(flashT); flashT = setTimeout(() => { el.className = 'power-flash'; }, 1400);
  }

  // ---- the in-game button (shows your power; greys out once used) ----------
  // ⚠️ IT DOES TWO JOBS NOW (Max asked for a side button you press to activate a
  // power-up, 2026-09-13), and which one depends on the moment — because the
  // two jobs want opposite things. AT THE LINE there is time to think, so it
  // opens the picker and you choose your power right there on the field instead
  // of walking back to the 🛍 Pro Shop. DURING A PLAY there is no time at all,
  // so it stays what it always was: ONE tap, fires instantly. Putting the
  // picker on a live play would have made the feature worse — you would be
  // tackled while reading a menu.
  function inPlay() {
    const g = window.__td && window.__td.G;
    return !!g && (g.state === 'live' || g.state === 'pass');
  }
  function inGame() {
    const g = window.__td && window.__td.G;
    return !!g && g.state !== 'menu' && g.state !== 'gameover';
  }
  function tapBtn() { if (inPlay()) fire(); else openPicker(); }

  function paintBtn() {
    const b = $('btn-power'); if (!b) return;
    const p = POWERS[equipped] || POWERS.turbo;
    const ic = b.querySelector('.pw-ic'); if (ic) ic.textContent = usedThisGame ? '✔' : p.icon;
    const sm = b.querySelector('small');
    if (sm) sm.textContent = usedThisGame ? 'USED' : (inPlay() ? p.name.split(' ')[0] : 'POWER-UPS');
    b.classList.toggle('off', usedThisGame);
    b.classList.toggle('ready', !usedThisGame && inPlay());
  }

  // main.js's updateTrickBtn calls this at the three moments the label can
  // change: a play is set up, the ball is snapped, the 🎩 trick is armed.
  function sync() { paintBtn(); }

  // ---- the Pro Shop picker (equip your power for next game) ----------------
  function render() {
    const list = $('power-list'); if (!list) return;
    list.innerHTML = ORDER.map(k => {
      const p = POWERS[k], on = k === equipped;
      return `<div class="pw-card${on ? ' on' : ''}" data-pick="${k}" style="--pc:${p.color}">` +
        `<div class="pw-card-ic">${p.icon}</div>` +
        `<div class="pw-card-body"><div class="pw-card-nm">${p.name}</div>` +
        `<div class="pw-card-bl">${p.blurb}</div></div>` +
        `<div class="pw-card-tick">${on ? '✓' : ''}</div></div>`;
    }).join('');
  }
  function equip(kind) {
    if (!POWERS[kind]) return;
    equipped = kind; store('powerup', equipped);
    render(); paintBtn();
    const p = POWERS[kind];
    // Picked from the field? Get out of the way and let him play — the toast
    // says what happened. Picked in the 🛍 Pro Shop? Stay put, he may browse.
    if (inGame()) {
      close();
      toast(p.icon + ' ' + p.name + ' ready — tap ⚡ during the play!', true);
      return;
    }
    if (window.TDShop && TDShop.celebrate) TDShop.celebrate($('power-list') || $('power-modal'), p.icon, p.name + ' equipped!');
  }

  // ---- pop-up plumbing ----------------------------------------------------
  function gameKeyboard(on) { try { window.game.input.keyboard.enabled = on; } catch (e) {} }
  function open()  { const m = $('power-modal'); if (!m) return; gameKeyboard(false); render(); m.style.display = 'flex'; }
  // The same picker, opened from the field. It refuses mid-play (that is what
  // firing is for) and says so, rather than silently doing nothing.
  function openPicker() {
    if (usedThisGame) { toast('Already used your power this game!', false); return; }
    if (inPlay()) { fire(); return; }
    open();
  }
  function close() { const m = $('power-modal'); if (m) m.style.display = 'none'; gameKeyboard(true); }

  function wire() {
    const tap = (id, fn) => { const el = $(id); if (el) el.addEventListener('pointerdown', e => { e.preventDefault(); fn(); }); };
    tap('open-power', open);
    tap('power-close', close);
    tap('btn-power', tapBtn);               // at the line: pick · during a play: FIRE
    const list = $('power-list');
    if (list) list.addEventListener('pointerdown', e => {
      const c = e.target.closest('[data-pick]'); if (!c) return;
      e.preventDefault(); equip(c.getAttribute('data-pick'));
    });
    paintBtn();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire);
  else wire();

  // ---- what the rest of the game reads ------------------------------------
  window.TDPowerup = {
    speedMult, catchAdd, defSlow,   // live multipliers (shop.js + main.js fold these in)
    newGame, fire, open, close, sync, openPicker,
    equipped: () => equipped,
    _state: () => ({ equipped, usedThisGame, firing: activeKind, until: activeUntil }),
  };
})();
