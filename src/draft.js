// ============================================================
// TOUCHDOWN FUN — draft.js: 🏟 MY TEAM (draft, trade, salaries & rivals!)
// ------------------------------------------------------------
// Until now every team was the same seven chibi players. This file gives you a
// ROSTER of your very own STAR players — and lots of fun ways to make it better:
//
//   📋 YOUR ROSTER — eight starters (a QB, a runner, two receivers, a tight end,
//      and three defenders). Each has a rating out of 99, sometimes a special
//      ⭐ TRAIT (🚀 Speedster, 🎯 Cannon Arm…), a school/team they came from, and
//      now a 💵 SALARY too (better players get paid more!). Your TEAM OVERALL is
//      the average — and a better team really does play a little tougher (main.js
//      reads boost() in beginGame, capped at +8%, split into offense & defense).
//
//   📅 DRAFT DAY — the draft is a real EVENT now, not something you can do every
//      single day. It happens on a set Draft Day; after you draft, the next one is
//      a week away and the tab shows a friendly countdown. Big picks feel big!
//
//   🎯 THE DRAFT — just like the real NFL Draft! A new class of young stars shows
//      up and SIX teams (you + five computers) take turns picking in "snake" order.
//      And now you can WHEEL AND DEAL on the clock: 🔼 trade up to grab an extra
//      star now, or 🔽 trade down for coins + a pick later. Teams call YOU with pick
//      swaps too.
//
//   🔎 SCOUTING — a prospect's true rating is HIDDEN (you only see a rough range)
//      until you SCOUT him for a few 🪙 coins. Big risk-and-reward!
//
//   🔁 TRADING — shop your roster around the league: swap one of your players for
//      one of theirs (coins even it up).
//
//   📨 REQUESTS — rival teams come to YOU. When you build up stars, other teams
//      send TRADE REQUESTS for them — a player (and usually coins) for your guy.
//      Accept to cash in, or turn down the lowballs. A badge shows new ones.
//
// It saves your roster, the next Draft Day, and pending requests in the browser
// (localStorage tdr-roster / tdr-draftday / tdr-requests) through the same helpers
// everything else uses. main.js talks to us through window.TDDraft.
// ============================================================
(function () {
  'use strict';

  // Borrow the little localStorage helpers from stats.js (loaded first).
  const T = window.TDStats ? TDStats.shared : null;
  const store = (k, v) => { if (T) T.store(k, v); };
  const load  = (k, f) => (T ? T.load(k, f) : f);
  const $ = id => document.getElementById(id);

  // ---- Coins live in shop.js — we just borrow them ------------------------
  const coins = () => (window.TDShop ? TDShop.coins() : 0);
  const spend = n => (window.TDShop && TDShop.spend ? TDShop.spend(n) : false);
  const earn  = n => { if (window.TDShop) TDShop.earn(n); };
  const paintCoins = () => { const el = $('coin-amt'); if (el) el.textContent = coins(); };
  const party = (el, emoji, label) => { if (window.TDShop && TDShop.celebrate) TDShop.celebrate(el, emoji, label); };
  const sting = k => { if (window.TDSound && TDSound.sting) TDSound.sting(k); };

  // 🪙 to reveal a prospect's true rating + trait — the better he might be, the
  // MORE it costs to scout him. We price it off the middle of his shown range.
  function scoutCost(p) {
    const proj = Math.round((p.lo + p.hi) / 2);
    if (proj >= 90) return 25;   // could be a superstar — scouts cost a fortune
    if (proj >= 80) return 18;   // clearly a starter
    if (proj >= 70) return 12;   // a solid prospect
    return 8;                    // a project / depth guy
  }

  // ============================================================
  // 💵 SALARIES — better players get paid more
  // ============================================================
  // The team's whole "cap" is make-believe money in millions ($M). A 60-overall
  // depth guy makes a little; a 90+ superstar makes a LOT. Traits pay a bonus.
  // Curve: 60≈$2M, 70≈$7M, 80≈$14M, 90≈$23M, 99≈$33M. Smooth and easy to read.
  const SALARY_CAP = 180;                       // friendly team payroll cap ($M)
  function salaryOf(ovr, trait) {
    const base = Math.max(1, Math.round(0.06 * Math.pow(Math.max(0, ovr - 50), 1.6)));
    return base + (trait ? 2 : 0);              // stars with a ⭐ trait cost a bit more
  }
  const fmtSal = m => '$' + m + 'M';

  // ============================================================
  // WHO'S ON THE TEAM — positions, names, traits, schools
  // ============================================================
  const SLOTS   = ['QB', 'RB', 'WR', 'WR', 'TE', 'LB', 'CB', 'S'];
  const OFF_END = 5;                          // roster[0..4] = offense, [5..7] = defense
  const POS_EMOJI = { QB: '🎯', RB: '🏃', WR: '🙌', TE: '🧱', LB: '🛡', CB: '🦅', S: '🚧' };

  const FIRST = ['Max', 'Jax', 'Rico', 'Tank', 'Zeke', 'Blaze', 'Duke', 'Ace', 'Rex', 'Bo',
    'Cash', 'Colt', 'Nash', 'Gio', 'Leo', 'Milo', 'Theo', 'Cruz', 'Kai', 'Ty',
    'Deac', 'Bronx', 'Rome', 'Ziggy', 'Juno', 'Ravi', 'Omar', 'Kenji', 'Malik', 'Enzo'];
  const LAST = ['Thunder', 'Steele', 'Rocket', 'Bolt', 'Cannon', 'Swift', 'Stone', 'Blaze',
    'Flash', 'Wolfe', 'Fox', 'Hawk', 'Storm', 'Ridge', 'Frost', 'Knox', 'Vance', 'Marsh',
    'Reyes', 'Diaz', 'Okafor', 'Sato', 'Nakamura', 'Kim', 'Osei', 'Adeyemi', 'Bautista',
    'Ivanov', 'Ali', 'Rivera', 'Chen', 'Okoye', 'Santos', 'Mensah', 'Park'];

  const TRAITS = [
    { e: '🚀', n: 'SPEEDSTER' }, { e: '🎯', n: 'CANNON ARM' }, { e: '🧲', n: 'SURE HANDS' },
    { e: '🛡', n: 'BRUISER' },   { e: '⚡', n: 'PLAYMAKER' },   { e: '🧊', n: 'CLUTCH' },
    { e: '🧱', n: 'WALL' },       { e: '🦅', n: 'BALL HAWK' },   { e: '🏃', n: 'SHIFTY' },
    { e: '👑', n: 'CAPTAIN' },
  ];

  const SCHOOLS = ['STATE U', 'TECH', 'RIVERSIDE', 'MOUNTAIN', 'CENTRAL', 'COASTAL',
    'NORTHERN', 'VALLEY', 'LAKESIDE', 'SUNSET', 'IRONTON', 'PINE CREST', 'BAYVIEW',
    'GRAND CITY', 'FROSTBURG', 'DESERT'];

  // ---- Tiny random helpers ------------------------------------------------
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const rint = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1));
  const clampOvr = v => Math.min(99, Math.max(50, v));
  let idSeq = 1;

  // ---- 🌱 PLAYER GROWTH — your guys get better the more you play ----------
  // Every player can climb from his current rating up to his POTENTIAL. Rookies
  // (lower-rated) have the most room to grow; near the top it barely moves. He
  // earns a little growth XP after every game, and each time it fills he goes +1.
  const GROW_GAIN = 12, GROW_WIN_BONUS = 6;         // XP a game (a bit more on a win)
  function growthCap(ovr) {                         // his ceiling — lower guys get more upside
    return Math.min(99, ovr + Math.max(2, Math.round((85 - ovr) * 0.35) + rint(1, 4)));
  }
  function growNeed(ovr) { return 20 + Math.max(0, ovr - 55) * 3; }   // XP for the NEXT +1

  // Build one player. `scouted` players show their real rating; unscouted
  // prospects only show a rough range (lo..hi) until you pay to scout them.
  function makePlayer(pos, minOvr, maxOvr, opts) {
    opts = opts || {};
    const ovr = rint(minOvr, maxOvr);
    const traitChance = 0.18 + Math.max(0, ovr - 70) * 0.015;
    const trait = (Math.random() < traitChance) ? pick(TRAITS) : null;
    const lo = Math.max(40, ovr - rint(4, 9));
    const hi = Math.min(99, ovr + rint(4, 9));
    return {
      id: 'p' + (idSeq++),
      name: pick(FIRST) + ' ' + pick(LAST),
      pos, ovr, trait,
      from: opts.from || pick(SCHOOLS),
      scouted: opts.scouted !== false ? (opts.scouted === true) : false,
      salary: salaryOf(ovr, trait),
      lo, hi,
      pot: growthCap(ovr),   // 🌱 how high he can grow
      xp: 0,                 // 🌱 growth XP toward his next +1
    };
  }

  // ============================================================
  // YOUR ROSTER — load, save, TEAM OVERALL and TEAM PAYROLL
  // ============================================================
  function freshRoster() {
    return SLOTS.map(pos => makePlayer(pos, 60, 70, { from: 'PRO', scouted: true }));
  }

  let roster = load('roster', null);
  if (!Array.isArray(roster) || roster.length !== SLOTS.length) {
    roster = freshRoster();
    saveRoster();
  } else {
    // Old saves are trusted, but make sure every starter is "known", has a salary,
    // and (for saves from before v1.37) has growth fields so 🌱 growth can't go NaN.
    roster.forEach(p => {
      p.scouted = true;
      if (p.salary == null) p.salary = salaryOf(p.ovr, p.trait);
      if (p.pot == null || p.pot < p.ovr) p.pot = growthCap(p.ovr);
      if (p.xp == null) p.xp = 0;
    });
  }
  function saveRoster() { store('roster', roster); }

  // 🌱 Called once at the final whistle: every player earns a little growth XP
  // (a bit more on a win) and climbs toward his potential. Marks who leveled up
  // (`p.grew`) so the roster can show a "▲+N" badge, and returns the same list.
  function addGrowth(win) {
    const gain = GROW_GAIN + (win ? GROW_WIN_BONUS : 0);
    const grew = [];
    roster.forEach(p => {
      if (p.pot == null) p.pot = growthCap(p.ovr);
      if (p.xp == null) p.xp = 0;
      if (p.ovr >= p.pot) return;                       // already maxed — no more room
      p.xp += gain;
      let ups = 0;
      while (p.ovr < p.pot && p.xp >= growNeed(p.ovr)) { p.xp -= growNeed(p.ovr); p.ovr++; ups++; }
      if (ups) { p.grew = (p.grew || 0) + ups; grew.push({ name: p.name, pos: p.pos, ovr: p.ovr, up: ups }); }
    });
    if (grew.length) saveRoster();
    return grew;
  }
  // How many players have grown since you last looked at the roster?
  function growthPending() { return roster.filter(p => p.grew).length; }

  // ============================================================
  // 🙋 CREATE-A-PLAYER (src/createplayer.js talks to these)
  // ------------------------------------------------------------
  // Your one custom superstar lives in a normal roster slot and is a completely
  // normal player object (so growth, trades, payroll, the box score and the MVP
  // award all treat him like anyone else) — he just carries `custom: true` plus
  // the jersey number you picked. These little helpers exist because the roster
  // lives in this file's closure: an outside module must go through us, or our
  // in-memory copy would get stale and overwrite the change on the next save.
  // ============================================================
  const CUSTOM_OVR = 72;   // a solid starter — better than a rookie, no runaway star

  function getCustom() {
    const i = roster.findIndex(p => p && p.custom);
    return i < 0 ? null : Object.assign({ slot: i }, roster[i]);
  }

  // Put your custom guy in the slot for `pos`. If he was already somewhere else,
  // that old slot goes back to a normal generated player, so the team stays 8 deep.
  function setCustom(pos, info) {
    const slot = SLOTS.indexOf(pos);
    if (slot < 0) return null;
    const old = roster.findIndex(p => p && p.custom);
    if (old >= 0 && old !== slot) {
      roster[old] = makePlayer(SLOTS[old], 60, 70, { from: 'PRO', scouted: true });
    }
    const trait = TRAITS.find(t => t.n === (info && info.trait)) || null;
    const prev = (old === slot) ? roster[slot] : null;      // editing in place keeps his growth
    const ovr = prev ? prev.ovr : CUSTOM_OVR;
    roster[slot] = {
      id: prev ? prev.id : 'custom',
      name: (info && info.name) || 'My Star',
      pos, ovr, trait,
      from: 'YOU', scouted: true,
      salary: salaryOf(ovr, trait),
      lo: ovr, hi: ovr,
      pot: prev ? prev.pot : growthCap(ovr),
      xp: prev ? prev.xp : 0,
      custom: true,
      num: (info && info.num) != null ? info.num : 1,
    };
    saveRoster();
    return Object.assign({ slot }, roster[slot]);
  }

  // Send your custom guy home — the slot goes back to a normal player.
  function clearCustom() {
    const i = roster.findIndex(p => p && p.custom);
    if (i < 0) return false;
    roster[i] = makePlayer(SLOTS[i], 60, 70, { from: 'PRO', scouted: true });
    saveRoster();
    return true;
  }

  // The positions you can pick for him (same eight the roster uses).
  function slotList() { return SLOTS.slice(); }
  function traitList() { return TRAITS.map(t => ({ e: t.e, n: t.n })); }

  const avg = list => Math.round(list.reduce((s, p) => s + p.ovr, 0) / list.length);
  function teamOverall() {
    const off = avg(roster.slice(0, OFF_END));
    const def = avg(roster.slice(OFF_END));
    return { off, def, ovr: avg(roster) };
  }
  // Total payroll ($M) = everyone's salary added up.
  function teamPayroll() { return roster.reduce((s, p) => s + (p.salary || 0), 0); }

  // ---- 💪 The boost main.js applies in beginGame --------------------------
  function unitBoost(v) { return 1 + Math.min(Math.max((v - 60) / 39, 0), 1) * 0.08; }
  function boost() {
    const t = teamOverall();
    return { off: unitBoost(t.off), def: unitBoost(t.def) };
  }

  // The weakest starter at a position (for WR that's the lower-rated of the two).
  function weakestAt(pos) {
    let best = -1;
    roster.forEach((p, i) => {
      if (p.pos !== pos) return;
      if (best < 0 || p.ovr < roster[best].ovr) best = i;
    });
    return best < 0 ? null : { idx: best, player: roster[best] };
  }

  // ============================================================
  // 📅 DRAFT DAY — the draft is a real event, not an every-day thing
  // ============================================================
  // We remember (in localStorage) the earliest time the NEXT draft may start.
  // A brand-new player can draft right away; after each draft the next Draft Day
  // is one week out. (Change DRAFT_COOLDOWN_DAYS to make the wait shorter/longer.)
  const DRAFT_COOLDOWN_DAYS = 7;
  const DAY_MS = 24 * 60 * 60 * 1000;
  const nextDraftAt = () => load('draftday', 0);      // 0 = wide open (never drafted)
  const draftReady  = () => Date.now() >= nextDraftAt();
  function setNextDraftDay() { store('draftday', Date.now() + DRAFT_COOLDOWN_DAYS * DAY_MS); }

  // "3d 4h" / "4h 20m" / "12m" — a friendly countdown to the next Draft Day.
  function fmtCountdown(ms) {
    if (ms <= 0) return 'now';
    const d = Math.floor(ms / DAY_MS);
    const h = Math.floor((ms % DAY_MS) / (60 * 60 * 1000));
    const m = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
    if (d > 0) return `${d}d ${h}h`;
    if (h > 0) return `${h}h ${m}m`;
    return `${Math.max(1, m)}m`;
  }

  // ============================================================
  // THE 🏟 MY TEAM SCREEN (a DOM pop-up with four tabs)
  // ============================================================
  let view   = 'roster';   // 'roster' | 'draft' | 'trade' | 'requests'
  let draft  = null;       // the in-progress draft (see startDraft)
  let offers = null;       // the current "shop around" trade offers (see makeOffers)
  let requests = load('requests', []);   // incoming rival trade requests (persist)
  function saveRequests() { store('requests', requests); }

  function ovrColor(v) {
    if (v >= 90) return '#ffd60a';
    if (v >= 80) return '#7bd88f';
    if (v >= 70) return '#8fd0ff';
    if (v >= 60) return '#c6cede';
    return '#9aa4b8';
  }
  function traitChip(tr) {
    return tr ? `<span class="dr-trait">${tr.e} ${tr.n}</span>` : '';
  }
  // One player as a table-ish row. `extra` is optional right-side HTML (buttons).
  // `showGrowth` adds the 🌱 growth bar + "▲+N" badge (roster tab only).
  function playerRow(p, extra, showGrowth) {
    const shown = p.scouted ? `${p.ovr}` : `${p.lo}–${p.hi}`;
    const tr = p.scouted ? traitChip(p.trait) : `<span class="dr-trait dr-unk">❔ ???</span>`;
    // Salary only shows once we truly know the player (scouted / on your team).
    const sal = p.scouted ? `<span class="dr-sal">💵 ${fmtSal(p.salary)}</span>` : '';
    // 🌱 The growth bar — how close he is to his next +1, and his ceiling.
    let grow = '';
    if (showGrowth && p.scouted) {
      const maxed = p.ovr >= (p.pot || p.ovr);
      const pct = maxed ? 100 : Math.round(100 * (p.xp || 0) / growNeed(p.ovr));
      grow = `<div class="dr-grow">
          <div class="dr-grow-bar"><i style="width:${pct}%"></i></div>
          <span class="dr-grow-lab">${maxed ? 'MAXED ⭐' : '▲ ' + p.pot + ' potential'}</span>
        </div>`;
    }
    const grew = (showGrowth && p.grew) ? `<span class="dr-grew">▲+${p.grew}</span>` : '';
    // 🙋 your own created superstar wears his jersey number and a little tag
    const mine = p.custom ? `<span class="dr-mine">🙋 #${p.num != null ? p.num : 1} YOURS</span>` : '';
    return `<div class="dr-row">
        <div class="dr-pos">${POS_EMOJI[p.pos] || ''}<b>${p.pos}</b></div>
        <div class="dr-main">
          <div class="dr-name">${p.name}${mine}</div>
          <div class="dr-sub">from ${p.from} ${sal} ${tr}</div>
          ${grow}
        </div>
        ${grew}
        <div class="dr-ovr" style="color:${p.scouted ? ovrColor(p.ovr) : '#c6cede'}">${shown}</div>
        ${extra || ''}
      </div>`;
  }

  function tabsHTML() {
    const rq = requests.length;
    const badge = rq ? ` <span class="dr-badge">${rq}</span>` : '';
    const tab = (id, label) => `<div class="dr-tab${view === id ? ' on' : ''}" data-act="tab" data-v="${id}">${label}</div>`;
    return `<div class="dr-tabs">${tab('roster', '📋 ROSTER')}${tab('draft', '🎯 DRAFT')}${tab('trade', '🔁 TRADE')}${tab('requests', '📨 REQS' + badge)}</div>`;
  }
  function coinLine() {
    return `<div class="dr-coins">🪙 <b>${coins()}</b> coins</div>`;
  }

  // ---- 📋 The ROSTER tab --------------------------------------------------
  function rosterHTML() {
    const t = teamOverall();
    const b = boost();
    const pctOff = Math.round((b.off - 1) * 100), pctDef = Math.round((b.def - 1) * 100);
    const head = `<div class="dr-team">
        <div class="dr-team-ovr" style="color:${ovrColor(t.ovr)}">${t.ovr}<span>TEAM OVERALL</span></div>
        <div class="dr-team-sd">
          <div>🏈 OFFENSE <b style="color:${ovrColor(t.off)}">${t.off}</b></div>
          <div>🛡 DEFENSE <b style="color:${ovrColor(t.def)}">${t.def}</b></div>
        </div>
      </div>
      <div class="dr-boost">In games: <b>+${pctOff}%</b> offense · <b>+${pctDef}%</b> defense</div>`;

    // 💵 Team payroll bar (used vs. the friendly cap).
    const pay = teamPayroll();
    const pct = Math.min(100, Math.round(pay / SALARY_CAP * 100));
    const over = pay > SALARY_CAP;
    const note = over
      ? `⚠ ${fmtSal(pay - SALARY_CAP)} over the cap — trade a star to get under.`
      : `${fmtSal(SALARY_CAP - pay)} under the cap — room for a big signing!`;
    const payHTML = `<div class="dr-pay${over ? ' over' : ''}">
        <div class="dr-pay-top"><span>💵 TEAM PAYROLL</span><b>${fmtSal(pay)}</b><span class="dr-pay-cap">/ ${fmtSal(SALARY_CAP)} cap</span></div>
        <div class="dr-pay-bar"><i style="width:${pct}%"></i></div>
        <div class="dr-pay-note">${note}</div>
      </div>`;

    // 🌱 A banner when players have grown since your last game.
    const grewCount = roster.filter(p => p.grew).length;
    const grewSum = grewCount
      ? `<div class="dr-grow-sum">🌱 <b>${grewCount}</b> player${grewCount > 1 ? 's' : ''} grew since your last game!</div>`
      : '';

    const rows = roster.map(p => playerRow(p, '', true)).join('');
    const html = head + payHTML + grewSum + `<div class="dr-list">${rows}</div>` +
      `<div class="dr-hint">🌱 Your players grow as you play — keep going and your rookies become stars!</div>`;

    // You've seen the growth now — clear the "▲+N" badges so they don't linger.
    if (grewCount) { roster.forEach(p => { p.grew = 0; }); saveRoster(); }
    return html;
  }

  // ---- 🎯 The DRAFT tab ---------------------------------------------------
  const DRAFT_TEAMS  = 6;    // you + five computer teams
  const DRAFT_ROUNDS = 3;    // three of YOUR picks per draft day
  const CLASS_SIZE   = 24;   // prospects in the class (plenty for everyone)
  const TRADE_UP_COST = 20;  // 🪙 to trade up (plus you give a future pick)
  const TRADE_DOWN_PAY = 30; // 🪙 you get for trading down

  function startDraft() {
    const names = (window.TDGame ? TDGame.nflAbbrs() : []).slice();
    for (let i = names.length - 1; i > 0; i--) { const j = rint(0, i); [names[i], names[j]] = [names[j], names[i]]; }
    const you = rint(1, DRAFT_TEAMS);                       // your draft slot (1..6)
    const teams = [];
    let n = 0;
    for (let s = 1; s <= DRAFT_TEAMS; s++) teams.push(s === you ? 'YOU' : (names[n++] || 'CPU'));

    // A snake order: 1..6, then 6..1, then 1..6 (rounds alternate direction).
    const order = [];
    for (let r = 0; r < DRAFT_ROUNDS; r++) {
      const line = [];
      for (let s = 1; s <= DRAFT_TEAMS; s++) line.push(s);
      if (r % 2 === 1) line.reverse();
      order.push(...line);
    }

    const board = [];
    for (let i = 0; i < CLASS_SIZE; i++) board.push(makePlayer(pick(SLOTS), 58, 96, { scouted: false }));

    // bonus = extra picks to make right now (from trading up).
    // callOffer = a CPU's "let me move up" proposal for your current pick.
    draft = { teams, you, order, ptr: 0, board, log: [], picks: [], bonus: 0, callOffer: null, done: false };
    advanceDraft();      // let any computer teams ahead of you pick first
  }

  // A computer team grabs a smart pick: usually one of the best available (by
  // TRUE rating), with a little randomness. Removes him and notes it in the log.
  function cpuPick(teamName) {
    if (!draft.board.length) return;
    const ranked = draft.board.slice().sort((a, b) => b.ovr - a.ovr);
    const p = ranked[rint(0, Math.min(2, ranked.length - 1))];
    draft.board.splice(draft.board.indexOf(p), 1);
    draft.log.unshift(`🤖 ${teamName} drafted ${p.pos} ${p.name} (${p.ovr})`);
  }

  // How many more picks YOU still have coming after the one you're on now.
  function futureMinePicks() {
    let c = 0;
    for (let i = draft.ptr + 1; i < draft.order.length; i++) if (draft.order[i] === draft.you) c++;
    return c;
  }
  // A random computer team name (the "trade partner").
  function randomCpuTeam() {
    const cpus = draft.teams.filter(t => t !== 'YOU');
    return cpus.length ? pick(cpus) : 'CPU';
  }

  // Sometimes, when you land on the clock, a team calls to trade UP into your pick.
  function maybeCallOffer() {
    if (draft.callOffer || !draft.board.length) return;
    if (Math.random() < 0.35) draft.callOffer = { team: randomCpuTeam(), coin: rint(30, 60) };
  }

  // Walk the pick order, letting computer teams pick, until it's YOUR turn (then
  // stop and let the screen wait for you) or the draft runs out of picks.
  function advanceDraft() {
    while (draft.ptr < draft.order.length) {
      const slot = draft.order[draft.ptr];
      if (slot === draft.you) { maybeCallOffer(); return; }   // your turn — wait for a tap
      cpuPick(draft.teams[slot - 1]);
      draft.ptr++;
    }
    // Out of picks — the draft is over. Lock in the next Draft Day + grade the class.
    if (!draft.done) { draft.done = true; setNextDraftDay(); gradeDraft(); }
  }

  // 🏅 Grade your draft class (A+ → D) from the picks you made: their average
  // overall, the upgrades they brought, and any ⭐ traits you landed. A good grade
  // pays a coin BONUS, and beating your best-ever grade is a little trophy moment.
  function gradeDraft() {
    const picks = draft.picks;
    let grade = '—', score = 0, bonus = 0, newBest = false;
    if (picks.length) {
      let sumOvr = 0, sumUp = 0, traits = 0;
      picks.forEach(p => { sumOvr += p.ovr; if (p._delta > 0) sumUp += p._delta; if (p.trait) traits++; });
      score = sumOvr / picks.length + sumUp * 1.4 + traits * 4;
      if      (score >= 95) { grade = 'A+'; bonus = 100; }
      else if (score >= 88) { grade = 'A';  bonus = 60; }
      else if (score >= 80) { grade = 'B';  bonus = 30; }
      else if (score >= 72) { grade = 'C';  bonus = 10; }
      else                  { grade = 'D';  bonus = 0; }
      const order = ['D', 'C', 'B', 'A', 'A+'];
      const best = load('draftbest', '');
      newBest = order.indexOf(grade) > order.indexOf(best);
      if (newBest) store('draftbest', grade);
      if (bonus > 0) { earn(bonus); paintCoins(); }
    }
    draft.grade = grade; draft.gradeScore = Math.round(score); draft.gradeBonus = bonus; draft.newBest = newBest;
  }

  // Scout a prospect: pay coins to reveal his true rating + trait.
  function scout(i) {
    const p = draft.board[i];
    if (!p || p.scouted) return;
    if (!spend(scoutCost(p))) { flash('Not enough coins to scout this one!'); return; }
    p.scouted = true;
    paintCoins();
    render();
  }

  // Draft a prospect onto your team — he takes over the weakest starting job at
  // his position. Shows the upgrade (or downgrade) so your choice is always clear.
  function draftPick(i) {
    const p = draft.board[i];
    if (!p || draft.done) return;
    draft.callOffer = null;                           // acting ends any pending call
    const w = weakestAt(p.pos);
    const old = w ? w.player.ovr : 0;
    p.scouted = true;                                 // once he's yours, you know him
    if (w) roster[w.idx] = p;
    saveRoster();
    draft.board.splice(i, 1);
    draft.picks.push(p);
    const delta = p.ovr - old;
    p._delta = delta;                                 // remembered for the DRAFT GRADE later
    // 💎 A fun "how'd that pick go?" reveal — steal, stud, upgrade, or depth.
    const tag = p.ovr >= 90 ? '💎 STEAL!' : p.ovr >= 82 ? '🌟 STUD!'
              : delta >= 6 ? '🔥 BIG UPGRADE!' : delta > 0 ? '⬆ UPGRADE' : '👍 DEPTH PICK';
    draft.log.unshift(`✅ YOU drafted ${p.pos} ${p.name} (${p.ovr}) ${tag}`);
    party($('team-body'), p.trait ? p.trait.e : '⭐', tag);
    sting('td');
    // A trade-up bonus pick keeps you on the clock; a normal pick moves the draft on.
    if (draft.bonus > 0) draft.bonus--;
    else { draft.ptr++; advanceDraft(); }
    render();
  }

  // 🔼 TRADE UP — spend coins + your last upcoming pick to draft an EXTRA guy NOW.
  function tradeUp() {
    if (!draft || draft.done) return;
    if (futureMinePicks() < 1) { flash('No future pick left to trade up with!'); return; }
    if (!spend(TRADE_UP_COST)) { flash(`Need ${TRADE_UP_COST}🪙 to trade up.`); return; }
    // Give up your LAST upcoming pick (remove it from the order)…
    for (let i = draft.order.length - 1; i > draft.ptr; i--) {
      if (draft.order[i] === draft.you) { draft.order.splice(i, 1); break; }
    }
    draft.bonus++;                                    // …and get an extra pick right now.
    draft.callOffer = null;
    paintCoins();
    draft.log.unshift(`🔼 YOU traded up — extra pick now for ${TRADE_UP_COST}🪙 + a future pick`);
    render();
  }

  // 🔽 TRADE DOWN — let a team pick now; you get coins + a pick at the very end.
  function tradeDown(partnerFromCall, coinFromCall) {
    if (!draft || draft.done) return;
    const partner = partnerFromCall || randomCpuTeam();
    const pay = coinFromCall || TRADE_DOWN_PAY;
    earn(pay); paintCoins();
    draft.order.push(draft.you);                      // your new pick at the end
    draft.callOffer = null;
    draft.log.unshift(`🔽 YOU traded down — ${partner} picks now; you get ${pay}🪙 + a late pick`);
    cpuPick(partner);                                 // the partner uses your current pick
    draft.ptr++;
    advanceDraft();
    render();
  }
  function acceptCall() { if (draft && draft.callOffer) tradeDown(draft.callOffer.team, draft.callOffer.coin); }
  function declineCall() { if (draft) { draft.callOffer = null; render(); } }

  function draftHTML() {
    // Not started yet — either LOCKED (waiting for Draft Day) or ready to go.
    if (!draft) {
      if (!draftReady()) {
        const left = fmtCountdown(nextDraftAt() - Date.now());
        return `<div class="dr-lock">
            <div class="dr-lock-em">📅</div>
            <div class="dr-lock-h">DRAFT DAY IS SET</div>
            <div class="dr-lock-sub">The next class of stars arrives in</div>
            <div class="dr-lock-count">${left}</div>
            <div class="dr-hint">Just like the real NFL, the draft only happens on Draft Day — not every day.
              Keep playing games to earn 🪙 and scout in the meantime!</div>
          </div>`;
      }
      return `<div class="dr-intro">It's <b>DRAFT DAY</b>! A new class of young stars just arrived from
        schools all over. <b>${DRAFT_TEAMS} teams</b> take turns picking in snake order — grab the best
        one before a computer team does. Each pick <b>upgrades a starter</b>.<br><br>
        🔎 <b>Scout</b> a prospect to see his true rating (<b>8–25 🪙</b>). On the clock you can also
        🔼 <b>trade up</b> or 🔽 <b>trade down</b> to wheel and deal!</div>
        ${coinLine()}
        <div class="dr-actions"><div class="ov-btn yes" data-act="startDraft">START DRAFT ▶</div></div>`;
    }

    // Draft finished — your GRADE, a recap of who you landed, and the next date.
    if (draft.done) {
      const got = draft.picks.length
        ? draft.picks.map(p => playerRow(p)).join('')
        : `<div class="dr-hint">No picks this time.</div>`;
      const left = fmtCountdown(nextDraftAt() - Date.now());
      const g = draft.grade || '—';
      const gClass = { 'A+': 'ap', 'A': 'a', 'B': 'b', 'C': 'c', 'D': 'd' }[g] || 'na';
      const reports = {
        'A+': 'A LEGENDARY haul — Hall-of-Fame scouting!',
        'A':  'Fantastic class! Your team got a lot better.',
        'B':  'Solid draft — some real contributors.',
        'C':  'A few useful pieces to build on.',
        'D':  'Rough one — better luck next Draft Day!',
      };
      const report = reports[g] || 'The class is in the books.';
      return `<div class="dr-cap">🎉 DRAFT COMPLETE${draft.newBest ? ' — 🏆 NEW BEST!' : ''}</div>
        <div class="dr-grade dr-grade-${gClass}">${g}<span>DRAFT GRADE</span></div>
        <div class="dr-grade-sub">${report}${draft.gradeBonus ? ` · <b>+${draft.gradeBonus}🪙 bonus!</b>` : ''}</div>
        <div class="dr-list">${got}</div>
        <div class="dr-nextday">📅 Next Draft Day in <b>${left}</b></div>
        <div class="dr-actions">
          <div class="ov-btn yes" data-act="tab" data-v="roster">SEE MY TEAM</div>
        </div>`;
    }

    // You're on the clock. Header counts picks dynamically (trades change the total).
    const round = Math.floor(draft.ptr / DRAFT_TEAMS) + 1;
    const myNum = draft.picks.length + 1;
    const total = draft.picks.length + 1 + draft.bonus + futureMinePicks();
    const logHTML = draft.log.slice(0, 3).map(l => `<div class="dr-log">${l}</div>`).join('');

    // A team is on the phone wanting to trade up into your pick?
    const call = draft.callOffer ? `<div class="dr-call">
        📞 <b>${draft.callOffer.team}</b> want to trade up for your pick — they'll pay <b>${draft.callOffer.coin}🪙</b> + you get a late pick.
        <div class="dr-rowbtns">
          <div class="dr-mini yes" data-act="acceptCall">TRADE DOWN ✅</div>
          <div class="dr-mini" data-act="declineCall">KEEP PICK</div>
        </div>
      </div>` : '';

    // Your own trade buttons.
    const canUp = futureMinePicks() >= 1;
    const tradeRow = `<div class="dr-trade-row">
        <div class="dr-mini${canUp ? '' : ' off'}" data-act="tradeUp">🔼 TRADE UP <small>${TRADE_UP_COST}🪙+pick</small></div>
        <div class="dr-mini" data-act="tradeDown">🔽 TRADE DOWN <small>+${TRADE_DOWN_PAY}🪙</small></div>
      </div>`;

    // 🔥 The single best guy on the whole board right now — build some hype so
    // there's always a "get him before a CPU does!" target each pick.
    let topIdx = -1, topVal = -1;
    draft.board.forEach((p, i) => { const v = p.scouted ? p.ovr : p.hi; if (v > topVal) { topVal = v; topIdx = i; } });

    // Sort the board: offense group, then defense, best first.
    const idx = draft.board.map((p, i) => i);
    idx.sort((a, b) => {
      const ga = SLOTS.indexOf(draft.board[a].pos) < OFF_END ? 0 : 1;
      const gb = SLOTS.indexOf(draft.board[b].pos) < OFF_END ? 0 : 1;
      if (ga !== gb) return ga - gb;
      const va = draft.board[a].scouted ? draft.board[a].ovr : draft.board[a].hi;
      const vb = draft.board[b].scouted ? draft.board[b].ovr : draft.board[b].hi;
      return vb - va;
    });
    const rows = idx.map(i => {
      const p = draft.board[i];
      const w = weakestAt(p.pos);
      const yours = w ? w.player.ovr : 0;
      let gain = '';
      if (p.scouted) {
        const d = p.ovr - yours;
        gain = d > 0 ? `<span class="dr-up">⬆+${d}</span>` : d < 0 ? `<span class="dr-dn">⬇${d}</span>` : `<span class="dr-eq">=</span>`;
      }
      const scoutBtn = p.scouted ? '' : `<div class="dr-mini" data-act="scout" data-i="${i}">🔎 ${scoutCost(p)}🪙</div>`;
      const topBadge = (i === topIdx) ? `<div class="dr-topbadge">🔥 TOP PROSPECT</div>` : '';
      return `<div class="dr-item${i === topIdx ? ' dr-top' : ''}">
          ${topBadge}
          ${playerRow(p)}
          <div class="dr-rowbtns">
            <div class="dr-vs">your ${p.pos}: <b>${yours}</b></div>
            ${scoutBtn}
            <div class="dr-mini yes" data-act="draft" data-i="${i}">DRAFT ${gain}</div>
          </div>
        </div>`;
    }).join('');

    const clockLabel = draft.bonus > 0
      ? `🎯 ROUND ${round} · BONUS PICK — <b>ON THE CLOCK!</b>`
      : `🎯 ROUND ${round} · YOUR PICK ${myNum} OF ${total} — <b>ON THE CLOCK!</b>`;
    return `<div class="dr-clock">${clockLabel}</div>
      ${coinLine()}
      ${call}
      ${tradeRow}
      ${logHTML ? `<div class="dr-logbox">${logHTML}</div>` : ''}
      <div class="dr-list dr-board">${rows}</div>`;
  }

  // ---- 🔁 The TRADE tab (shop your roster around) -------------------------
  const OFFER_COUNT = 4;

  function makeOffers() {
    const abbrs = (window.TDGame ? TDGame.nflAbbrs() : []).slice();
    for (let i = abbrs.length - 1; i > 0; i--) { const j = rint(0, i); [abbrs[i], abbrs[j]] = [abbrs[j], abbrs[i]]; }
    offers = [];
    for (let k = 0; k < OFFER_COUNT; k++) {
      const pos = pick(SLOTS);
      const mine = weakestAt(pos);
      if (!mine) continue;
      const abbr = abbrs[k] || 'CPU';
      const teamName = (window.TDGame && TDGame.teamByAbbr(abbr)) ? TDGame.teamByAbbr(abbr).name : abbr;
      const inOvr = clampOvr(mine.player.ovr + rint(-2, 12));
      const incoming = makePlayer(pos, inOvr, inOvr, { from: abbr, scouted: true });
      const coin = Math.max(-15, Math.round((incoming.ovr - 60) * 2.5) + (incoming.trait ? 12 : 0));
      offers.push({ id: 'o' + k, teamName, abbr, incoming, giveIdx: mine.idx, coin });
    }
  }

  function acceptOffer(id) {
    const o = offers.find(x => x.id === id);
    if (!o) return;
    if (o.coin > 0 && !spend(o.coin)) { flash('Not enough coins for this trade!'); return; }
    if (o.coin < 0) { earn(-o.coin); paintCoins(); }
    roster[o.giveIdx] = o.incoming;                   // their player takes the spot
    saveRoster();
    offers = offers.filter(x => x.id !== id);
    party($('team-body'), o.incoming.trait ? o.incoming.trait.e : '🤝', 'TRADE DONE!');
    sting('td');
    render();
  }
  function passOffer(id) { offers = offers.filter(x => x.id !== id); render(); }

  function tradeHTML() {
    if (!offers) makeOffers();
    let cards;
    if (!offers.length) {
      cards = `<div class="dr-hint">No offers on the table. Tap "NEW OFFERS" to shop your roster around!</div>`;
    } else {
      cards = offers.map(o => {
        const give = roster[o.giveIdx];
        const better = o.incoming.ovr - give.ovr;
        const coinTxt = o.coin > 0 ? `<span class="dr-dn">you pay ${o.coin}🪙</span>`
                      : o.coin < 0 ? `<span class="dr-up">you get ${-o.coin}🪙</span>`
                      : `<span class="dr-eq">even up</span>`;
        return `<div class="dr-offer">
            <div class="dr-offer-h">🔁 ${o.teamName} want to trade</div>
            <div class="dr-offer-body">
              <div class="dr-offer-side">
                <div class="dr-lab dr-get">YOU GET</div>
                ${playerRow(o.incoming)}
              </div>
              <div class="dr-offer-side">
                <div class="dr-lab dr-give">YOU GIVE</div>
                ${playerRow(give)}
              </div>
            </div>
            <div class="dr-offer-foot">
              ${better > 0 ? `<span class="dr-up">⬆ +${better} at ${give.pos}</span>` : better < 0 ? `<span class="dr-dn">⬇ ${better} at ${give.pos}</span>` : `<span class="dr-eq">lateral</span>`}
              · ${coinTxt}
            </div>
            <div class="dr-rowbtns">
              <div class="dr-mini yes" data-act="accept" data-id="${o.id}">ACCEPT ✅</div>
              <div class="dr-mini" data-act="pass" data-id="${o.id}">PASS</div>
            </div>
          </div>`;
      }).join('');
    }
    return `<div class="dr-intro">Teams around the league want your players! Accept a trade to swap a
        starter — some deals cost coins, some pay you.</div>
      ${coinLine()}
      <div class="dr-offers">${cards}</div>
      <div class="dr-actions"><div class="ov-btn" data-act="newOffers">🔄 NEW OFFERS</div></div>`;
  }

  // ---- 📨 The REQUESTS tab (rivals come to YOU) ---------------------------
  const MAX_REQUESTS = 4;

  // Build one incoming request: a rival targets one of your BETTER starters and
  // offers a same-position player (usually a touch worse) PLUS coins for him.
  function makeRequest() {
    const ranked = roster.map((p, i) => ({ p, i })).sort((a, b) => b.p.ovr - a.p.ovr);
    const t = pick(ranked.slice(0, 4));               // they chase your top players
    const mine = t.p, idx = t.i;
    const abbrs = (window.TDGame ? TDGame.nflAbbrs() : []).slice();
    const abbr = abbrs.length ? pick(abbrs) : 'CPU';
    const teamName = (window.TDGame && TDGame.teamByAbbr(abbr)) ? TDGame.teamByAbbr(abbr).name : abbr;
    const inOvr = clampOvr(mine.ovr + rint(-10, -1));  // their guy is a bit worse
    const incoming = makePlayer(mine.pos, inOvr, inOvr, { from: abbr, scouted: true });
    // They pay you coins for the drop-off, plus a premium for a real star.
    const coin = Math.max(5, Math.round((mine.ovr - incoming.ovr) * 3 + Math.max(0, mine.ovr - 70) * 1.5));
    return { id: 'r' + Date.now() + Math.floor(Math.random() * 1000), teamName, abbr, wantIdx: idx, incoming, coin };
  }

  // On opening MY TEAM, rivals may send a new request (up to a small cap).
  function maybeAddRequest() {
    if (requests.length >= MAX_REQUESTS) return;
    const chance = requests.length === 0 ? 0.8 : 0.35;
    if (Math.random() < chance) { requests.push(makeRequest()); saveRequests(); }
  }

  function acceptRequest(id) {
    const r = requests.find(x => x.id === id);
    if (!r) return;
    earn(r.coin); paintCoins();
    roster[r.wantIdx] = r.incoming;                   // you send your star, get their guy
    saveRoster();
    requests = requests.filter(x => x.id !== id); saveRequests();
    party($('team-body'), '🤝', `+${r.coin}🪙 TRADE!`);
    sting('td');
    render();
  }
  function rejectRequest(id) { requests = requests.filter(x => x.id !== id); saveRequests(); render(); }

  function requestsHTML() {
    let cards;
    if (!requests.length) {
      cards = `<div class="dr-hint">📭 No trade requests right now. Build up star players and rival teams
        will come calling — check back after a few games!</div>`;
    } else {
      cards = requests.map(r => {
        const give = roster[r.wantIdx];
        const drop = r.incoming.ovr - give.ovr;       // usually negative (you drop a bit)
        return `<div class="dr-offer dr-req">
            <div class="dr-offer-h">📣 ${r.teamName} want your ${give.pos} <b>${give.name}</b>!</div>
            <div class="dr-offer-body">
              <div class="dr-offer-side">
                <div class="dr-lab dr-give">YOU GIVE</div>
                ${playerRow(give)}
              </div>
              <div class="dr-offer-side">
                <div class="dr-lab dr-get">YOU GET</div>
                ${playerRow(r.incoming)}
              </div>
            </div>
            <div class="dr-offer-foot">
              ${drop < 0 ? `<span class="dr-dn">⬇ ${drop} at ${give.pos}</span>` : drop > 0 ? `<span class="dr-up">⬆ +${drop} at ${give.pos}</span>` : `<span class="dr-eq">lateral</span>`}
              · <span class="dr-up">you get ${r.coin}🪙</span>
            </div>
            <div class="dr-rowbtns">
              <div class="dr-mini yes" data-act="acceptReq" data-id="${r.id}">ACCEPT ✅</div>
              <div class="dr-mini" data-act="rejectReq" data-id="${r.id}">REJECT</div>
            </div>
          </div>`;
      }).join('');
    }
    return `<div class="dr-intro">Rival teams come to <b>YOU</b>! When you've got stars, other teams send
        trade requests for them — cash in on a great one, or turn down a lowball.</div>
      ${coinLine()}
      <div class="dr-offers">${cards}</div>`;
  }

  // A tiny inline message (used when you can't afford something).
  let flashMsg = '';
  function flash(msg) { flashMsg = msg; render(); setTimeout(() => { flashMsg = ''; render(); }, 1600); }

  // ---- Draw whichever tab is showing -------------------------------------
  function render() {
    const body = $('team-body');
    if (!body) return;
    let inner = view === 'draft' ? draftHTML()
              : view === 'trade' ? tradeHTML()
              : view === 'requests' ? requestsHTML()
              : rosterHTML();
    const msg = flashMsg ? `<div class="dr-flash">${flashMsg}</div>` : '';
    body.innerHTML = tabsHTML() + msg + inner;
    onMenu();   // keep the 🌱 growth badge on the TEAM button in sync
  }

  // 🌱 Put a little sprout on the TEAM menu button when players have grown.
  function onMenu() {
    const b = $('team-grow-badge');
    if (b) b.style.display = growthPending() ? 'flex' : 'none';
  }

  // ---- One click handler for the whole pop-up (event delegation) ----------
  function onTap(e) {
    const el = e.target.closest('[data-act]');
    if (!el) return;
    e.preventDefault();
    const act = el.dataset.act;
    if (act === 'tab')        { view = el.dataset.v; if (view === 'trade') offers = null; render(); }
    else if (act === 'startDraft' || act === 'newDraft') { if (draftReady()) startDraft(); render(); }
    else if (act === 'scout')       scout(+el.dataset.i);
    else if (act === 'draft')       draftPick(+el.dataset.i);
    else if (act === 'tradeUp')     tradeUp();
    else if (act === 'tradeDown')   tradeDown();
    else if (act === 'acceptCall')  acceptCall();
    else if (act === 'declineCall') declineCall();
    else if (act === 'newOffers')   { makeOffers(); render(); }
    else if (act === 'accept')      acceptOffer(el.dataset.id);
    else if (act === 'pass')        passOffer(el.dataset.id);
    else if (act === 'acceptReq')   acceptRequest(el.dataset.id);
    else if (act === 'rejectReq')   rejectRequest(el.dataset.id);
  }

  // ---- Open / close the pop-up -------------------------------------------
  function open() {
    view = 'roster'; draft = null; offers = null; flashMsg = '';
    maybeAddRequest();                                // rivals may have called since last time
    render();
    const el = $('team-modal'); if (el) el.style.display = 'flex';
  }
  function closeOverlay() { const el = $('team-modal'); if (el) el.style.display = 'none'; }

  function tap(id, fn) {
    const el = $(id);
    if (el) el.addEventListener('pointerdown', e => { e.preventDefault(); fn(); });
  }
  function wire() {
    tap('open-team', open);
    tap('team-close', closeOverlay);
    const body = $('team-body');
    if (body) body.addEventListener('pointerdown', onTap);
  }
  if (document.readyState !== 'loading') wire();
  else document.addEventListener('DOMContentLoaded', wire);

  // ---- What the rest of the game may use ----------------------------------
  window.TDDraft = {
    open,               // show the MY TEAM screen (the 🏟 menu button)
    boost,              // main.js beginGame: { off, def } multipliers for YOUR team
    teamOverall,        // { off, def, ovr } — handy for other modules / debug
    payroll: teamPayroll,
    addGrowth,          // 🌱 main.js endGame: grow your players a little
    growthPending,      // how many players grew since last viewed (for the badge)
    onMenu,             // refresh the 🌱 TEAM-button badge when the menu shows
    // 🙋 Create-A-Player (createplayer.js) — your one custom superstar
    getCustom, setCustom, clearCustom, slotList, traitList,
    // Small dev helpers (handy for testing; harmless in play).
    _debug: {
      state: () => ({ nextDraftAt: nextDraftAt(), draftReady: draftReady(), payroll: teamPayroll(), requests: requests.length, draft }),
      resetDraftDay: () => { store('draftday', 0); },
      addRequest: () => { if (requests.length < MAX_REQUESTS) { requests.push(makeRequest()); saveRequests(); } render(); },
      clearRequests: () => { requests = []; saveRequests(); render(); },
    },
  };
})();
