// ============================================================
// TOUCHDOWN FUN — ranked.js: 🏅 THE RANKED LADDER
// ------------------------------------------------------------
// A competitive rank you climb by WINNING — Bronze → Silver → Gold →
// Platinum → Diamond → 👑 Champion. Unlike your team LEVEL (which only ever
// goes up as you earn XP), your RANK is about how you're playing right now:
// win a game and you earn a ⭐; fill three stars and you get promoted; lose
// and you can slip a division. Reach a shiny new tier and it's yours to keep —
// you never fall out of a tier once you've earned its badge.
//
//   WIN  → +1 ⭐. Three stars fills a division → PROMOTED (a coin bonus, and a
//          big party + 100 🪙 when you crack a whole new tier).
//   LOSE → −1 ⭐. Run out and you drop a division… but never below the tier
//          you've reached, so your badge is safe.
//   👑 CHAMPION is the top: every win there adds a Champion star to show off.
//
// Saved in `tdr-ranked` = { step, stars, peak, w, l, champ }. `step` 0…14 is
// the division you're in (0 = Bronze III, 14 = Diamond I); step 15 = Champion.
// main.js tells us each game's result through window.TDRanked.
// Lives inside the 🏆 Trophy Case (a "🏅 RANKED LADDER" button) — no new menu
// bar, so the phone layout stays put — and a ribbon flies in on a rank change.
// ============================================================
(function () {
  'use strict';

  const T = window.TDStats ? TDStats.shared : null;
  const store = (k, v) => { if (T) T.store(k, v); };
  const load  = (k, f) => (T ? T.load(k, f) : f);
  const $ = id => document.getElementById(id);

  // The five climbing tiers (each has three divisions), then Champion on top.
  const TIERS = [
    { name: 'Bronze',   ic: '🥉', col: '#d08a4e' },
    { name: 'Silver',   ic: '🥈', col: '#c2ccd6' },
    { name: 'Gold',     ic: '🥇', col: '#f5c542' },
    { name: 'Platinum', ic: '💠', col: '#5fd6c8' },
    { name: 'Diamond',  ic: '💎', col: '#7cc9ff' },
  ];
  const CHAMP = { name: 'Champion', ic: '👑', col: '#ffcf3f' };
  const DIVS = ['III', 'II', 'I'];    // III = you just arrived, I = top of the tier
  const STARS_PER = 3;                // stars to fill a division
  const CHAMP_STEP = TIERS.length * DIVS.length;   // = 15

  // What a given step looks like (tier + division, colour, label).
  function stepInfo(step) {
    if (step >= CHAMP_STEP) return { tier: CHAMP, div: null, ic: CHAMP.ic, col: CHAMP.col, label: '👑 Champion' };
    const t = TIERS[Math.floor(step / DIVS.length)], d = DIVS[step % DIVS.length];
    return { tier: t, div: d, ic: t.ic, col: t.col, label: t.ic + ' ' + t.name + ' ' + d };
  }
  const tierIndex = step => (step >= CHAMP_STEP ? TIERS.length : Math.floor(step / DIVS.length));

  let s = load('ranked', null);
  if (!s || typeof s.step !== 'number') s = { step: 0, stars: 0, peak: 0, w: 0, l: 0, champ: 0 };
  // tidy any out-of-range save
  s.step = Math.max(0, Math.min(CHAMP_STEP, s.step | 0));
  s.stars = Math.max(0, Math.min(STARS_PER - 1, s.stars | 0));
  if (s.step > s.peak) s.peak = s.step;
  function save() { store('ranked', s); }

  // ---- 🏈 main.js: a game just finished --------------------------------
  // Returns { change, coins } — change is 'up' | 'newtier' | 'champ' | 'down' | null.
  function recordResult(won) {
    const before = s.step;
    let change = null, coins = 0;
    if (won) {
      s.w++;
      if (s.step >= CHAMP_STEP) { s.champ++; change = 'champ'; }
      else if (++s.stars >= STARS_PER) {
        s.stars = 0; s.step++;
        change = (tierIndex(s.step) !== tierIndex(before) || s.step >= CHAMP_STEP) ? 'newtier' : 'up';
      }
    } else {
      s.l++;
      if (s.step >= CHAMP_STEP) { s.champ = Math.max(0, s.champ - 1); }   // champions never fall out
      else if (--s.stars < 0) {
        const tierFloor = tierIndex(s.step) * DIVS.length;     // III of this tier
        if (s.step > tierFloor) { s.step--; s.stars = STARS_PER - 1; change = 'down'; }
        else { s.stars = 0; }                                  // hold the tier — badge is safe
      }
    }
    if (s.step > s.peak) s.peak = s.step;

    // Promotion pay: a little for a division, a lot for a brand-new tier.
    if (change === 'up')      coins = 30;
    else if (change === 'newtier') coins = 100;
    else if (change === 'champ')   coins = 40;
    if (coins && window.TDShop) TDShop.earn(coins);

    save();
    flashRibbon(change, before, coins);
    return { change, coins };
  }

  // ---- the fly-in ribbon at game's end (only on an actual rank change) ----
  let ribTmr = 0;
  function flashRibbon(change, beforeStep, coins) {
    if (!change) return;
    const el = $('rank-toast'); if (!el) return;
    const now = stepInfo(s.step);
    let txt = '', cls = 'up';
    if (change === 'champ')        txt = '👑 CHAMPION WIN!  ★' + s.champ + '   +' + coins + ' 🪙';
    else if (change === 'newtier') { txt = (s.step >= CHAMP_STEP ? '👑 YOU ARE CHAMPION!! ' : '🎉 NEW RANK!  ') + now.label + '   +' + coins + ' 🪙'; cls = 'up big'; }
    else if (change === 'up')      txt = '⬆️ RANKED UP!  ' + now.label + '   +' + coins + ' 🪙';
    else if (change === 'down')  { txt = '⬇️ Dropped to ' + now.label + ' — win it back!'; cls = 'down'; }

    el.textContent = txt;
    el.className = ''; void el.offsetWidth;        // restart the animation
    el.classList.add('show', ...cls.split(' '));
    clearTimeout(ribTmr);
    ribTmr = setTimeout(() => el.classList.remove('show'), 2500);
    if (cls.indexOf('down') < 0 && window.TDShop && TDShop.celebrate) TDShop.celebrate(null, now.ic, now.label);
  }

  // ---- 🖼 draw the pop-up -------------------------------------------------
  function render() {
    const now = stepInfo(s.step);
    const champ = s.step >= CHAMP_STEP;

    // Big current-rank badge + the three-star row.
    const badge = $('rank-now');
    if (badge) {
      let starsHTML;
      if (champ) {
        starsHTML = `<div class="rank-champ">★ ${s.champ} Champion ${s.champ === 1 ? 'win' : 'wins'}</div>`;
      } else {
        let pips = '';
        for (let i = 0; i < STARS_PER; i++) pips += `<span class="rk-star ${i < s.stars ? 'on' : ''}">★</span>`;
        starsHTML = `<div class="rank-stars">${pips}</div>`;
      }
      badge.innerHTML =
        `<div class="rank-emblem" style="--rk:${now.col}">${now.ic}</div>` +
        `<div class="rank-mid"><div class="rank-label" style="color:${now.col}">${champ ? '👑 Champion' : now.tier.name + ' ' + now.div}</div>${starsHTML}</div>`;
    }

    // Progress line.
    const prog = $('rank-prog');
    if (prog) {
      if (champ) prog.innerHTML = '🏆 You\'re at the very top — every win adds a Champion star!';
      else {
        const need = STARS_PER - s.stars;
        const nxt = stepInfo(s.step + 1);
        prog.innerHTML = `<b>${need}</b> ${need === 1 ? 'win' : 'wins'} to <b style="color:${nxt.col}">${nxt.label.replace(/^.. /, '')}</b>`;
      }
    }

    // The full ladder — every tier, lit up once you've reached it (by peak).
    const ladder = $('rank-ladder');
    if (ladder) {
      const peakTier = tierIndex(s.peak);
      const curTier = tierIndex(s.step);
      let rows = '';
      const all = TIERS.concat([CHAMP]);
      for (let i = all.length - 1; i >= 0; i--) {     // Champion at the top, Bronze at the bottom
        const t = all[i];
        const reached = i <= peakTier;
        const here = i === curTier;
        rows +=
          `<div class="rk-rung ${reached ? 'got' : 'locked'} ${here ? 'here' : ''}" style="--rk:${t.col}">` +
          `<span class="rk-ic">${t.ic}</span><span class="rk-nm">${t.name}</span>` +
          `<span class="rk-tag">${here ? 'YOU ARE HERE' : reached ? 'reached' : 'locked'}</span></div>`;
      }
      ladder.innerHTML = rows;
    }

    // Record + peak.
    const stats = $('rank-stats');
    if (stats) {
      const total = s.w + s.l;
      const pct = total ? Math.round(s.w / total * 100) : 0;
      const peak = stepInfo(s.peak);
      stats.innerHTML =
        `<div class="rk-stat"><b>${s.w}–${s.l}</b><span>record</span></div>` +
        `<div class="rk-stat"><b>${pct}%</b><span>win rate</span></div>` +
        `<div class="rk-stat"><b style="color:${peak.col}">${peak.ic}</b><span>best: ${peak.label.replace(/^.. /, '')}</span></div>`;
    }
  }

  // ---- pop-up plumbing (same shape as the other modals) -------------------
  function gameKeyboard(on) { try { window.game.input.keyboard.enabled = on; } catch (e) {} }
  function open()  { const m = $('ranked-modal'); if (!m) return; gameKeyboard(false); render(); m.style.display = 'flex'; }
  function close() { const m = $('ranked-modal'); if (m) m.style.display = 'none'; gameKeyboard(true); }

  function onTap(id, fn) { const el = $(id); if (el) el.addEventListener('pointerdown', e => { e.preventDefault(); fn(); }); }
  function wire() { onTap('open-ranked', open); onTap('ranked-close', close); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire);
  else wire();

  // ---- what the rest of the game may use ----------------------------------
  window.TDRanked = {
    recordResult, open, close,
    rankLabel: () => stepInfo(s.step).label,
    _state: () => Object.assign({}, s, { label: stepInfo(s.step).label }),
  };
})();
