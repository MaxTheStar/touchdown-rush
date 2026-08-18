// ============================================================
// TOUCHDOWN FUN — road.js: 🎟️ THE REWARD ROAD
// ------------------------------------------------------------
// A long, FREE ladder of prizes you climb just by playing. Every game you
// finish earns "road points" (a win earns more), and every so many points
// you reach a new tier with a reward waiting — coins, free spins, bigger and
// bigger the further you go. There's always a next tier in sight, so there's
// always a reason for one more game. (Think battle pass — but nothing costs
// real money, ever. Every reward here is free.)
//
//   HOW POINTS COME IN — finishing a game = +10 RP, and a win adds +10 more.
//   HOW REWARDS WORK — when your points pass a tier's line, its 🎁 CLAIM
//     button lights up (and the menu bar glows). Tap to bank the reward, and
//     the next tier is right there. Banked several at once? Tap through them.
//   IT NEVER ENDS — past the last listed tier the road keeps going: every
//     +300 RP is another 200-coin bonus tier, forever.
//
// Saved in `tdr-road` = { rp: total points, claimed: how many tiers you've
// collected }. main.js feeds us finished games through window.TDRoad.
// ============================================================
(function () {
  'use strict';

  const T = window.TDStats ? TDStats.shared : null;
  const store = (k, v) => { if (T) T.store(k, v); };
  const load  = (k, f) => (T ? T.load(k, f) : f);
  const $ = id => document.getElementById(id);

  const PLAY_RP = 10, WIN_RP = 10;   // finishing earns 10; a win adds 10 more

  // The ladder. `rp` is the TOTAL points needed to reach that tier; `r` is the
  // reward (coins and/or free spins); `t` is how it reads on the row.
  const TIERS = [
    { rp: 40,   r: { coins: 50 },            t: '50 🪙' },
    { rp: 90,   r: { spins: 1 },             t: '1 free spin' },
    { rp: 150,  r: { coins: 100 },           t: '100 🪙' },
    { rp: 230,  r: { coins: 150 },           t: '150 🪙' },
    { rp: 330,  r: { spins: 2 },             t: '2 free spins' },
    { rp: 450,  r: { coins: 250 },           t: '250 🪙' },
    { rp: 600,  r: { coins: 350 },           t: '350 🪙' },
    { rp: 780,  r: { spins: 3 },             t: '3 free spins' },
    { rp: 1000, r: { coins: 500 },           t: '500 🪙' },
    { rp: 1300, r: { coins: 750, spins: 3 }, t: '750 🪙 + 3 spins' },
  ];
  const ENDLESS = { every: 300, coins: 200 };   // repeats past the last tier

  let s = load('road', null);
  if (!s || typeof s.rp !== 'number') s = { rp: 0, claimed: 0 };
  function save() { store('road', s); }

  // Total RP needed to reach tier index i (endless past the listed ones).
  function need(i) {
    if (i < TIERS.length) return TIERS[i].rp;
    const extra = i - TIERS.length + 1;
    return TIERS[TIERS.length - 1].rp + extra * ENDLESS.every;
  }
  function tierAt(i) {
    if (i < TIERS.length) return TIERS[i];
    return { rp: need(i), r: { coins: ENDLESS.coins }, t: ENDLESS.coins + ' 🪙' };
  }
  function rewardIcon(r) { return (r.coins && r.spins) ? '🎁' : (r.spins ? '🎡' : '🪙'); }
  function claimable() { return s.rp >= need(s.claimed); }

  // ---- 🏈 main.js: a game just finished --------------------------------
  function addPoints(won) {
    s.rp += PLAY_RP + (won ? WIN_RP : 0);
    save();
  }

  // ---- 🎁 claim the next ready tier --------------------------------------
  // A claim re-renders the track, which drops a fresh CLAIM button right where
  // your finger just was — so guard against one tap claiming two tiers. (You
  // can still tap through a backlog; just not faster than this.)
  let lastClaim = 0;
  function claim() {
    const now = Date.now();
    if (now - lastClaim < 400) return;
    lastClaim = now;
    if (!claimable()) return;
    const tier = tierAt(s.claimed);
    const r = tier.r || {};
    if (r.coins && window.TDShop) TDShop.earn(r.coins);
    if (r.spins && window.TDSpin && TDSpin.grantFreeSpins) TDSpin.grantFreeSpins(r.spins);
    s.claimed++; save();
    const anchor = $('road-list') || $('road-bar');
    if (window.TDShop && TDShop.celebrate) TDShop.celebrate(anchor, rewardIcon(r), tier.t);
    render();    // refresh the track (next tier may now be claimable)
    onMenu();    // refresh the menu bar
  }

  // ---- 🖼 draw the track --------------------------------------------------
  function render() {
    // The header: total points + progress toward the next tier.
    const top = $('road-top');
    if (top) {
      const goal = need(s.claimed);
      const prev = s.claimed === 0 ? 0 : need(s.claimed - 1);
      const into = Math.max(0, s.rp - prev), span = Math.max(1, goal - prev);
      const pct = Math.min(100, Math.round(into / span * 100));
      const left = Math.max(0, goal - s.rp);
      top.innerHTML =
        `<div class="road-top-row"><span class="road-rp">🎟️ ${s.rp} RP</span>` +
        `<span class="road-next">${claimable() ? 'reward ready!' : left + ' RP to Tier ' + (s.claimed + 1)}</span></div>` +
        `<div class="chal-track"><div class="chal-fill" style="width:${claimable() ? 100 : pct}%"></div></div>`;
    }

    // The tier rows — a window around where you are so the list stays short.
    const list = $('road-list');
    if (!list) return;
    const total = TIERS.length;
    const start = Math.max(0, Math.min(s.claimed - 1, total - 5));   // show a little history
    const end = Math.min(total, Math.max(start + 6, s.claimed + 2));
    let rows = '';
    for (let i = start; i < end; i++) {
      const tier = tierAt(i);
      const done = i < s.claimed;
      const ready = i === s.claimed && claimable();
      const icon = done ? '✅' : ready ? rewardIcon(tier.r) : '🔒';
      const cls = done ? 'done' : ready ? 'ready' : '';
      const right = ready
        ? `<span class="chal-btn go" data-claim="1">CLAIM</span>`
        : done ? `<span class="chal-reward">✓</span>`
               : `<span class="chal-count">${tier.rp} RP</span>`;
      rows +=
        `<div class="chal-row ${cls}">` +
        `<div class="chal-icon">${icon}</div>` +
        `<div class="chal-mid"><div class="chal-name">Tier ${i + 1} — ${tier.t}</div>` +
        `<div class="chal-count">reach ${tier.rp} road points</div></div>` +
        `<div class="chal-right">${right}</div></div>`;
    }
    // A friendly note that the road never really ends.
    rows += `<div class="road-endless">♾️ …and beyond — every +${ENDLESS.every} RP is another ${ENDLESS.coins} 🪙</div>`;
    list.innerHTML = rows;

    // Wire the CLAIM button (there's at most one visible at a time).
    const btn = list.querySelector('[data-claim]');
    if (btn) btn.addEventListener('pointerdown', e => { e.preventDefault(); claim(); });
  }

  // ---- the slim menu bar --------------------------------------------------
  function onMenu() {
    const sum = $('road-bar-sum');
    const bar = $('road-bar');
    const ready = claimable();
    if (sum) sum.textContent = ready ? 'CLAIM!' : 'T' + (s.claimed + 1);
    if (bar) bar.classList.toggle('ready', ready);
  }

  // ---- pop-up plumbing ----------------------------------------------------
  function gameKeyboard(on) { try { window.game.input.keyboard.enabled = on; } catch (e) {} }
  function open()  { const m = $('road-modal'); if (!m) return; gameKeyboard(false); render(); m.style.display = 'flex'; }
  function close() { const m = $('road-modal'); if (m) m.style.display = 'none'; gameKeyboard(true); }

  function onTap(id, fn) { const el = $(id); if (el) el.addEventListener('pointerdown', e => { e.preventDefault(); fn(); }); }
  function wire() { onTap('road-bar', open); onTap('road-close', close); onMenu(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire);
  else wire();

  // ---- what the rest of the game may use ----------------------------------
  window.TDRoad = {
    addPoints, onMenu, open, close, claim,
    points: () => s.rp,
    _state: () => ({ rp: s.rp, claimed: s.claimed, claimable: claimable() }),
  };
})();
