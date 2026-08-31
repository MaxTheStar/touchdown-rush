// ============================================================
// TOUCHDOWN FUN — quests.js: 🎯 WEEKLY QUESTS (Round 8, pick ③)
// ------------------------------------------------------------
// The 📋 DAILY CHALLENGES are little one-day sprints: "score a
// touchdown", "catch 3 passes". Fun, but they vanish at midnight.
//
// WEEKLY QUESTS are the long game. Three BIG goals that live for a
// whole week and remember everything you do — score 12 touchdowns,
// win 5 games, force 6 turnovers. You chip away at them across every
// game you play, and the payouts are much bigger than a daily.
//
// Beat all three in one week and you get the 🏆 CLEAN SWEEP bonus.
//
// ------------------------------------------------------------
// HOW WE KNOW WHAT YOU DID — the neat trick in this file
// ------------------------------------------------------------
// challenges.js is ALREADY told about every touchdown, catch, field
// goal, turnover, win and finished game — main.js calls its bump()
// at each of those moments. Those are exactly the same events a
// weekly quest cares about.
//
// So instead of scattering eight more hooks through main.js, we
// politely WRAP that one function: we keep a copy of the original,
// put our own in its place, and ours passes every event along to
// both the daily challenges AND our weekly quests. One tidy place
// instead of eight, and main.js doesn't change at all.
//
// (If this file is ever removed the game is completely unchanged —
// the wrap simply never happens.)
// ============================================================
(function () {
  'use strict';

  // NOTE the short name: TDStats.shared.store/load add the "tdr-" in front for
  // us, so this saves to "tdr-quests". Passing the full "tdr-quests" here would
  // save to "tdr-tdr-quests" — same as every other module in the game, which
  // all pass the short name ('chal', 'film', 'nicknames'…).
  const KEY = 'quests';
  const $ = id => document.getElementById(id);

  // Borrow the same little save/load helpers everything else uses.
  const T = window.TDStats ? TDStats.shared : null;
  const store = (k, v) => { if (T) T.store(k, v); };
  const load  = (k, f) => (T ? T.load(k, f) : f);

  // ---- The quest pool -----------------------------------------------------
  // Same 'kind' names the daily challenges use, so the events line up for
  // free. The goals are much bigger — these last SEVEN days, not one.
  const POOL = [
    { id: 'wtd8',   icon: '🏈', kind: 'td',       goal: 8,  name: 'Score 8 touchdowns',    coins: 120 },
    { id: 'wtd12',  icon: '🏈', kind: 'td',       goal: 12, name: 'Score 12 touchdowns',   coins: 180 },
    { id: 'wwin3',  icon: '🏆', kind: 'win',      goal: 3,  name: 'Win 3 games',           coins: 130 },
    { id: 'wwin5',  icon: '🏆', kind: 'win',      goal: 5,  name: 'Win 5 games',           coins: 200 },
    { id: 'wcat15', icon: '🧤', kind: 'catch',    goal: 15, name: 'Catch 15 passes',       coins: 110 },
    { id: 'wcat25', icon: '🧤', kind: 'catch',    goal: 25, name: 'Catch 25 passes',       coins: 170 },
    { id: 'wfg5',   icon: '🥅', kind: 'fg',       goal: 5,  name: 'Kick 5 field goals',    coins: 130 },
    { id: 'wtak4',  icon: '🛡', kind: 'takeaway', goal: 4,  name: 'Force 4 turnovers',     coins: 150 },
    { id: 'wtak6',  icon: '🛡', kind: 'takeaway', goal: 6,  name: 'Force 6 turnovers',     coins: 210 },
    { id: 'wply6',  icon: '🎮', kind: 'play',     goal: 6,  name: 'Play 6 games',          coins: 100 },
  ];
  const byId = id => POOL.find(q => q.id === id) || null;

  // 🏆 Beat all three in one week → the CLEAN SWEEP.
  const SWEEP = { coins: 300, spins: 2 };

  // ---- Which week is it? --------------------------------------------------
  // Weeks run Monday→Sunday in YOUR timezone. We count how many whole weeks
  // have passed since a fixed Monday, which gives every week a tidy number we
  // can use both as an id ("is this a new week?") and as dice (which three
  // quests this week gets) — so the set is steady all week and swaps Monday.
  const EPOCH_MONDAY = Date.UTC(2024, 0, 1);   // 1 Jan 2024 was a Monday
  function weekId() {
    const now = new Date();
    const localMidnight = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    return Math.floor((localMidnight - EPOCH_MONDAY) / (7 * 24 * 3600 * 1000));
  }

  // How many days are left before the quests swap (for the "resets in…" line).
  function daysLeft() {
    const now = new Date();
    const localMidnight = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    const daysIn = Math.floor((localMidnight - EPOCH_MONDAY) / (24 * 3600 * 1000)) % 7;
    return 7 - daysIn;
  }

  // A tiny predictable random number generator, seeded by the week number, so
  // everyone playing the same week gets the same three quests.
  function seeded(seed) {
    let s = seed * 9301 + 49297;
    return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  }

  // ---- State --------------------------------------------------------------
  // { week, ids:[3], prog:{id:n}, claimed:[ids], sweep:bool }
  let state = null;

  function freshWeek(w) {
    const rng = seeded(w);
    // Shuffle the pool with the week's dice, then take three quests that are
    // all DIFFERENT kinds — three "score N touchdowns" in one week would be
    // a boring board.
    const shuffled = POOL.map(q => ({ q, r: rng() })).sort((a, b) => a.r - b.r).map(x => x.q);
    const picked = [], kinds = {};
    for (const q of shuffled) {
      if (kinds[q.kind]) continue;
      kinds[q.kind] = true;
      picked.push(q.id);
      if (picked.length === 3) break;
    }
    return { week: w, ids: picked, prog: {}, claimed: [], sweep: false };
  }

  function ensureWeek() {
    const w = weekId();
    if (!state) state = load(KEY, null);
    if (!state || state.week !== w || !Array.isArray(state.ids) || state.ids.length !== 3) {
      state = freshWeek(w);
      save();
      return;
    }
    // If the pool changed in an update, drop ids that no longer exist.
    if (state.ids.some(id => !byId(id))) { state = freshWeek(w); save(); }
  }

  function save() { store(KEY, state); }

  const progOf    = id => (state.prog[id] || 0);
  const doneOf    = id => { const q = byId(id); return q ? progOf(id) >= q.goal : false; };
  const claimedOf = id => state.claimed.indexOf(id) > -1;

  // ---- Recording what you did ---------------------------------------------
  function bump(kind, n) {
    ensureWeek();
    n = n || 1;
    let changed = false, justDone = false;
    state.ids.forEach(id => {
      const q = byId(id);
      if (!q || q.kind !== kind || doneOf(id)) return;
      state.prog[id] = Math.min(q.goal, progOf(id) + n);
      changed = true;
      if (doneOf(id)) justDone = true;
    });
    if (changed) { save(); if (isOpen()) render(); }
    if (justDone) toast('🎯 WEEKLY QUEST COMPLETE!');
  }

  // ---- Claiming -----------------------------------------------------------
  function claim(id) {
    ensureWeek();
    const q = byId(id);
    if (!q || !doneOf(id) || claimedOf(id)) return;
    state.claimed.push(id);
    if (window.TDShop) TDShop.earn(q.coins);
    save();
    maybeSweep();
    render();
  }

  function maybeSweep() {
    if (state.sweep) return;
    if (!state.ids.every(id => claimedOf(id))) return;
    state.sweep = true;
    if (window.TDShop) TDShop.earn(SWEEP.coins);
    if (window.TDSpin && TDSpin.grantFreeSpins) TDSpin.grantFreeSpins(SWEEP.spins);
    save();
    toast('🏆 CLEAN SWEEP! +' + SWEEP.coins + ' 🪙 and ' + SWEEP.spins + ' free spins!');
  }

  // ---- A brief toast during play ------------------------------------------
  function toast(msg) {
    const el = $('chal-toast');            // reuse the daily-challenge toast
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 2200);
  }

  // ---- Drawing the board --------------------------------------------------
  function isOpen() { const m = $('quest-modal'); return m && m.style.display === 'flex'; }

  function render() {
    ensureWeek();
    const list = $('quest-list');
    if (!list) return;
    list.innerHTML = state.ids.map(id => {
      const q = byId(id), p = progOf(id), done = doneOf(id), got = claimedOf(id);
      const pct = Math.round((p / q.goal) * 100);
      const btn = got  ? '<span class="q-got">CLAIMED ✓</span>'
                : done ? '<span class="q-claim" data-q="' + id + '">CLAIM ' + q.coins + ' 🪙</span>'
                       : '<span class="q-coins">' + q.coins + ' 🪙</span>';
      return '<div class="q-row' + (got ? ' q-done' : '') + '">' +
               '<div class="q-top"><span class="q-ic">' + q.icon + '</span>' +
                 '<span class="q-name">' + q.name + '</span>' + btn + '</div>' +
               '<div class="q-track"><div class="q-fill" style="width:' + pct + '%"></div></div>' +
               '<div class="q-num">' + p + ' / ' + q.goal + '</div>' +
             '</div>';
    }).join('');

    // Wire the CLAIM buttons (pointerdown = instant, like the rest of the game)
    list.querySelectorAll('.q-claim').forEach(el => {
      el.addEventListener('pointerdown', e => {
        e.preventDefault(); e.stopPropagation();
        claim(el.getAttribute('data-q'));
      });
    });

    const sw = $('quest-sweep');
    if (sw) {
      sw.textContent = state.sweep
        ? '🏆 CLEAN SWEEP claimed — nice week!'
        : '🏆 Beat all three for +' + SWEEP.coins + ' 🪙 and ' + SWEEP.spins + ' free spins';
      sw.className = state.sweep ? 'q-sweep got' : 'q-sweep';
    }
    const rs = $('quest-reset');
    if (rs) {
      const d = daysLeft();
      rs.textContent = 'New quests in ' + d + (d === 1 ? ' day' : ' days');
    }
  }

  function open()  { ensureWeek(); const m = $('quest-modal'); if (m) { m.style.display = 'flex'; render(); } }
  function close() { const m = $('quest-modal'); if (m) m.style.display = 'none'; }

  // ---- Wire up ------------------------------------------------------------
  function onTap(id, fn) {
    const el = $(id);
    if (el) el.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); fn(); });
  }

  function wireUp() {
    ensureWeek();
    onTap('open-quests', open);
    onTap('quest-close', close);

    // ---- The listen-in trick (see the note at the top of this file) --------
    // We only wrap once, and only if the daily challenges are actually there.
    if (window.TDChallenge && !TDChallenge.__questsWrapped) {
      const original = TDChallenge.bump;
      TDChallenge.bump = function (kind, n) {
        original.apply(TDChallenge, arguments);   // the daily challenge, exactly as before
        try { bump(kind, n); } catch (e) {}       // …and our weekly quest, never breaking the game
      };
      TDChallenge.__questsWrapped = true;
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wireUp);
  else wireUp();

  window.TDQuests = { open, close, bump, render, _state: () => state };
})();
