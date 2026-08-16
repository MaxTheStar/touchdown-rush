// ============================================================
// TOUCHDOWN FUN — challenges.js: 📋 DAILY CHALLENGES
// ------------------------------------------------------------
// Three little goals every day — "Score 2 touchdowns", "Catch 5 passes",
// "Force a turnover" — that reset every morning. Beat one and CLAIM a pile
// of coins; beat all three and you bag a 🎡 FREE SPIN plus a coin bonus.
// It's a reason to come back tomorrow, and a reason to play one more game.
//
//   HOW PROGRESS WORKS — main.js already shouts whenever something good
//   happens (a touchdown, a field goal, a catch, a takeaway, a win). We
//   listen for those shouts through TDChallenge.bump(kind) and tick the
//   matching challenge up by one. Nothing here touches the game loop.
//
//   WHICH THREE TODAY? — picked from the POOL below using today's DATE as
//   the dice, so the set is steady all day and swaps at YOUR midnight. We
//   always pick three DIFFERENT kinds so no day is all touchdowns.
//
// Everything saves through the same tdr- store as the rest of the game.
//
// main.js talks to us through window.TDChallenge — see the bottom.
// ============================================================
(function () {
  'use strict';

  const T = window.TDStats ? TDStats.shared : null;
  const store = (k, v) => { if (T) T.store(k, v); };
  const load  = (k, f) => (T ? T.load(k, f) : f);
  const $ = id => document.getElementById(id);

  // ---- 🎯 The pool of possible challenges --------------------------------
  // `kind` is the event we listen for; `goal` is how many; `coins` is the
  // prize for beating it. We pick three DIFFERENT kinds each day.
  const POOL = [
    { id: 'td1',    icon: '🏈', kind: 'td',       goal: 1, name: 'Score a touchdown',   coins: 15 },
    { id: 'td2',    icon: '🏈', kind: 'td',       goal: 2, name: 'Score 2 touchdowns',  coins: 25 },
    { id: 'td3',    icon: '🏈', kind: 'td',       goal: 3, name: 'Score 3 touchdowns',  coins: 40 },
    { id: 'fg1',    icon: '🥅', kind: 'fg',       goal: 1, name: 'Kick a field goal',   coins: 15 },
    { id: 'fg2',    icon: '🥅', kind: 'fg',       goal: 2, name: 'Kick 2 field goals',  coins: 30 },
    { id: 'catch3', icon: '🧤', kind: 'catch',    goal: 3, name: 'Catch 3 passes',      coins: 15 },
    { id: 'catch5', icon: '🧤', kind: 'catch',    goal: 5, name: 'Catch 5 passes',      coins: 20 },
    { id: 'catch8', icon: '🧤', kind: 'catch',    goal: 8, name: 'Catch 8 passes',      coins: 35 },
    { id: 'take1',  icon: '🛡', kind: 'takeaway', goal: 1, name: 'Force a turnover',    coins: 25 },
    { id: 'take2',  icon: '🛡', kind: 'takeaway', goal: 2, name: 'Force 2 turnovers',   coins: 40 },
    { id: 'win1',   icon: '🏆', kind: 'win',      goal: 1, name: 'Win a game',          coins: 30 },
    { id: 'play2',  icon: '🎮', kind: 'play',     goal: 2, name: 'Play 2 games',        coins: 20 },
  ];
  const byId = id => POOL.find(c => c.id === id) || null;

  // 🎁 Beat all three in a day → this bonus (a FREE SPIN + coins).
  const BONUS = { spins: 1, coins: 50 };

  // ---- 📆 "What day is it?" (YOUR local day, like the daily rewards) ------
  function dateKey() {
    const d = new Date();
    return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  }

  // A tiny seeded random so "today's three" are the same all day and change
  // tomorrow. hashStr turns the date into a number; mulberry32 turns that
  // number into a repeatable stream of random-looking values.
  function hashStr(s) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Pick three challenges for a given day — different kinds, newest-date-seeded.
  function pickFor(key) {
    const rng = mulberry32(hashStr(key));
    const order = POOL.map((c, i) => ({ c, r: rng() + i * 0 })).sort((a, b) => a.r - b.r);
    const chosen = [], kinds = {};
    for (const { c } of order) {
      if (kinds[c.kind]) continue;          // one per kind, so the day feels varied
      kinds[c.kind] = 1; chosen.push(c.id);
      if (chosen.length === 3) break;
    }
    return chosen;
  }

  // ---- 🧠 What we remember -------------------------------------------------
  //   date  = which day these three belong to
  //   ids   = the three challenge ids
  //   prog  = how far along each one is, e.g. { td2: 1 }
  //   claimed = ids you've already collected the coins for
  //   bonus = have you claimed the all-three bonus yet?
  let state = load('chal', null);
  ensureToday();   // sets up a fresh day if we've never run, or it's a new day

  function ensureToday() {
    const key = dateKey();
    if (!state || state.date !== key || !Array.isArray(state.ids)) {
      state = { date: key, ids: pickFor(key), prog: {}, claimed: [], bonus: false };
      save();
    }
    // Drop any ids that no longer exist (in case the POOL changed in an update).
    state.ids = state.ids.filter(byId);
    while (state.ids.length < 3) {                 // top back up to three if needed
      const extra = pickFor(key + '-' + state.ids.length).find(id => !state.ids.includes(id));
      if (!extra) break; state.ids.push(extra);
    }
  }
  function save() { store('chal', state); }

  // ---- 📊 Little status helpers ------------------------------------------
  const progOf = id => state.prog[id] || 0;
  const doneOf  = id => { const c = byId(id); return c ? progOf(id) >= c.goal : false; };
  const claimedOf = id => state.claimed.indexOf(id) >= 0;
  const allDone = () => state.ids.every(doneOf);
  function claimableCount() {
    let n = state.ids.filter(id => doneOf(id) && !claimedOf(id)).length;
    if (allDone() && !state.bonus) n++;
    return n;
  }
  function completedCount() { return state.ids.filter(doneOf).length; }

  // ---- 🎧 main.js shouts events at us here --------------------------------
  // Tick every active, unfinished challenge of this kind up by n (usually 1).
  function bump(kind, n) {
    ensureToday();
    n = n || 1;
    let changed = false, justDone = false;
    state.ids.forEach(id => {
      const c = byId(id);
      if (!c || c.kind !== kind || doneOf(id)) return;
      state.prog[id] = Math.min(c.goal, progOf(id) + n);
      changed = true;
      if (doneOf(id)) justDone = true;
    });
    if (changed) { save(); refreshBar(); if (isOpen()) render(); }
    if (justDone) toast('📋 CHALLENGE COMPLETE!');
  }

  // ============================================================
  // 🎉 Claiming
  // ============================================================
  function claim(id, el) {
    ensureToday();
    const c = byId(id);
    if (!c || !doneOf(id) || claimedOf(id)) return;
    state.claimed.push(id); save();
    if (window.TDShop) { TDShop.earn(c.coins); TDShop.celebrate(el, '🪙', '+' + c.coins + ' 🪙'); }
    if (window.TDSound) TDSound.sting('td');
    render(); refreshBar();
  }
  function claimBonus(el) {
    ensureToday();
    if (state.bonus || !allDone()) return;
    state.bonus = true; save();
    if (window.TDSpin && TDSpin.grantFreeSpins) TDSpin.grantFreeSpins(BONUS.spins);
    if (window.TDShop) { TDShop.earn(BONUS.coins); TDShop.celebrate(el, '🎡', 'FREE SPIN + ' + BONUS.coins + ' 🪙'); }
    if (window.TDSound) TDSound.sting('win');
    render(); refreshBar();
  }

  // ============================================================
  // 🖼 The modal
  // ============================================================
  function bar(id) {                 // a little progress bar for one challenge
    const c = byId(id), p = progOf(id), pct = Math.round(100 * Math.min(1, p / c.goal));
    return `<div class="chal-track"><div class="chal-fill" style="width:${pct}%"></div></div>
            <div class="chal-count">${Math.min(p, c.goal)} / ${c.goal}</div>`;
  }
  function render() {
    const box = $('chal-list');
    if (!box) return;
    box.innerHTML = state.ids.map(id => {
      const c = byId(id);
      const done = doneOf(id), got = claimedOf(id);
      const right = got ? `<div class="chal-btn got">✓ GOT IT</div>`
                  : done ? `<div class="chal-btn go" data-claim="${id}">CLAIM ${c.coins} 🪙</div>`
                  :        `<div class="chal-reward">${c.coins} 🪙</div>`;
      return `
        <div class="chal-row${done ? ' done' : ''}">
          <div class="chal-icon">${c.icon}</div>
          <div class="chal-mid">
            <div class="chal-name">${c.name}</div>
            ${bar(id)}
          </div>
          <div class="chal-right">${right}</div>
        </div>`;
    }).join('');

    // The all-three BONUS row.
    const bonusBox = $('chal-bonus');
    if (bonusBox) {
      if (state.bonus) {
        bonusBox.className = 'chal-bonus claimed';
        bonusBox.innerHTML = `🎁 <b>ALL DONE!</b> Bonus claimed — see you tomorrow!`;
      } else if (allDone()) {
        bonusBox.className = 'chal-bonus ready';
        bonusBox.innerHTML = `<div>🎁 <b>ALL THREE BEATEN!</b></div>
          <div class="chal-btn go big" id="chal-bonus-btn">CLAIM 🎡 FREE SPIN + ${BONUS.coins} 🪙</div>`;
      } else {
        bonusBox.className = 'chal-bonus';
        bonusBox.innerHTML = `🎁 Beat all three today → <b>🎡 free spin + ${BONUS.coins} 🪙</b>`;
      }
    }

    // "New challenges in Xh Ym" (time until your local midnight).
    const rst = $('chal-reset');
    if (rst) {
      const now = new Date();
      const mid = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
      const ms = mid - now, h = Math.floor(ms / 3600000), m = Math.floor((ms % 3600000) / 60000);
      rst.textContent = '🔄 New challenges in ' + h + 'h ' + m + 'm';
    }

    // Wire the CLAIM buttons (rebuilt every render).
    box.querySelectorAll('.chal-btn[data-claim]').forEach(b => {
      b.addEventListener('pointerdown', e => { e.preventDefault(); claim(b.dataset.claim, b); });
    });
    const bb = $('chal-bonus-btn');
    if (bb) bb.addEventListener('pointerdown', e => { e.preventDefault(); claimBonus(bb); });
  }

  // ---- The slim menu bar that opens the modal + glows when you can claim --
  function refreshBar() {
    const b = $('chal-bar');
    if (!b) return;
    ensureToday();
    const claimable = claimableCount();
    const sum = $('chal-bar-sum');
    if (sum) {
      if (claimable > 0) sum.textContent = 'CLAIM! ';
      else if (state.bonus) sum.textContent = 'ALL DONE ✓';
      else sum.textContent = completedCount() + '/3';
    }
    b.classList.toggle('ready', claimable > 0);
  }

  // ---- A brief "challenge complete!" toast during play --------------------
  let toastT = 0;
  function toast(text) {
    const el = $('chal-toast');
    if (!el) return;
    el.textContent = text;
    el.classList.add('show');
    clearTimeout(toastT);
    toastT = setTimeout(() => el.classList.remove('show'), 2200);
  }

  // ============================================================
  // Pop-up plumbing (same recipe as the shop / spin)
  // ============================================================
  function gameKeyboard(on) { try { window.game.input.keyboard.enabled = on; } catch (e) {} }
  function isOpen() { const m = $('chal-modal'); return m && m.style.display === 'flex'; }
  function openModal() {
    const el = $('chal-modal');
    if (!el) return;
    ensureToday();
    gameKeyboard(false);
    el.style.display = 'flex';
    render();
  }
  function closeModal() {
    const el = $('chal-modal');
    if (el) el.style.display = 'none';
    gameKeyboard(true);
  }

  // main.js calls this every time the team menu appears.
  function onMenu() { ensureToday(); refreshBar(); }

  // ---- Wire the buttons ----------------------------------------------------
  function onTap(id, fn) {
    const el = $(id);
    if (el) el.addEventListener('pointerdown', e => { e.preventDefault(); fn(); });
  }
  function wireUp() {
    onTap('chal-bar', openModal);
    onTap('chal-close', closeModal);
    refreshBar();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wireUp);
  else wireUp();

  // ---- What the rest of the game may use ----------------------------------
  window.TDChallenge = {
    bump,           // main.js ticks progress through here
    onMenu,         // refresh the bar when the menu shows
    // handy for debugging
    today: () => state.ids.slice(),
    progress: () => Object.assign({}, state.prog),
  };
})();
