// ============================================================
// TOUCHDOWN FUN — draft.js: 🏟 MY TEAM (draft, scout & trade players!)
// ------------------------------------------------------------
// Until now every team was the same seven chibi players. This file gives you a
// ROSTER of your very own STAR players — and three fun ways to make it better:
//
//   📋 YOUR ROSTER — eight starters (a QB, a runner, two receivers, a tight end,
//      and three defenders). Each has a rating out of 99, sometimes a special
//      ⭐ TRAIT (🚀 Speedster, 🎯 Cannon Arm…), and the school/team they came
//      from. Your TEAM OVERALL is the average — and a better team really does
//      play a little tougher (main.js reads boost() in beginGame, capped at +8%,
//      split into offense & defense, YOUR team only — same gentle idea as the
//      ⭐ team ratings and 📈 level boost).
//
//   🎯 THE DRAFT — just like the real NFL Draft! A new class of young stars from
//      schools all over shows up, and SIX teams (you + five computers) take turns
//      picking in a "snake" order. Grab the best player before a computer team
//      snaps him up. Every pick UPGRADES one of your starters.
//
//   🔎 SCOUTING — a prospect's true rating is HIDDEN (you only see a rough range)
//      until you SCOUT him for a few 🪙 coins. The computer teams already know, so
//      scouting helps you draft as smart as they do. Big risk-and-reward!
//
//   🔁 TRADING — teams around the league offer TRADES: you get one of their
//      players for one of yours (sometimes with coins to even it out). Say yes to
//      the ones that make your team better.
//
// It saves your roster in the browser (localStorage tdr-roster) through the same
// helpers everything else uses. main.js talks to us through window.TDDraft.
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
  // MORE it costs to scout him. We can't see his real rating yet, so we price it
  // off the middle of his shown range (his "projected" grade). Stars are pricey!
  function scoutCost(p) {
    const proj = Math.round((p.lo + p.hi) / 2);
    if (proj >= 90) return 25;   // could be a superstar — scouts cost a fortune
    if (proj >= 80) return 18;   // clearly a starter
    if (proj >= 70) return 12;   // a solid prospect
    return 8;                    // a project / depth guy
  }

  // ============================================================
  // WHO'S ON THE TEAM — positions, names, traits, schools
  // ============================================================
  // Your eight starting slots. Offense first (5), then defense (3). The two WR
  // slots are why you'll sometimes see a receiver "battle" for a starting job.
  const SLOTS   = ['QB', 'RB', 'WR', 'WR', 'TE', 'LB', 'CB', 'S'];
  const OFF_END = 5;                          // roster[0..4] = offense, [5..7] = defense
  const POS_EMOJI = { QB: '🎯', RB: '🏃', WR: '🙌', TE: '🧱', LB: '🛡', CB: '🦅', S: '🚧' };

  // Fun, made-up player names (nobody real — just cool football names). A wide
  // mix of last names so every kind of kid sees a name that could be theirs.
  const FIRST = ['Max', 'Jax', 'Rico', 'Tank', 'Zeke', 'Blaze', 'Duke', 'Ace', 'Rex', 'Bo',
    'Cash', 'Colt', 'Nash', 'Gio', 'Leo', 'Milo', 'Theo', 'Cruz', 'Kai', 'Ty',
    'Deac', 'Bronx', 'Rome', 'Ziggy', 'Juno', 'Ravi', 'Omar', 'Kenji', 'Malik', 'Enzo'];
  const LAST = ['Thunder', 'Steele', 'Rocket', 'Bolt', 'Cannon', 'Swift', 'Stone', 'Blaze',
    'Flash', 'Wolfe', 'Fox', 'Hawk', 'Storm', 'Ridge', 'Frost', 'Knox', 'Vance', 'Marsh',
    'Reyes', 'Diaz', 'Okafor', 'Sato', 'Nakamura', 'Kim', 'Osei', 'Adeyemi', 'Bautista',
    'Ivanov', 'Ali', 'Rivera', 'Chen', 'Okoye', 'Santos', 'Mensah', 'Park'];

  // The special ⭐ TRAITS a player can have (pure collection pride for now — the
  // fun is chasing them). Keyed by an emoji so they read at a glance.
  const TRAITS = [
    { e: '🚀', n: 'SPEEDSTER' }, { e: '🎯', n: 'CANNON ARM' }, { e: '🧲', n: 'SURE HANDS' },
    { e: '🛡', n: 'BRUISER' },   { e: '⚡', n: 'PLAYMAKER' },   { e: '🧊', n: 'CLUTCH' },
    { e: '🧱', n: 'WALL' },       { e: '🦅', n: 'BALL HAWK' },   { e: '🏃', n: 'SHIFTY' },
    { e: '👑', n: 'CAPTAIN' },
  ];

  // Fictional "schools" the draft prospects come from — the different teams you
  // draft OUT of, just like colleges in the real NFL Draft.
  const SCHOOLS = ['STATE U', 'TECH', 'RIVERSIDE', 'MOUNTAIN', 'CENTRAL', 'COASTAL',
    'NORTHERN', 'VALLEY', 'LAKESIDE', 'SUNSET', 'IRONTON', 'PINE CREST', 'BAYVIEW',
    'GRAND CITY', 'FROSTBURG', 'DESERT'];

  // ---- Tiny random helpers ------------------------------------------------
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const rint = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1));
  let idSeq = 1;

  // Build one player. `scouted` players show their real rating; unscouted
  // prospects only show a rough range (lo..hi) until you pay to scout them.
  function makePlayer(pos, minOvr, maxOvr, opts) {
    opts = opts || {};
    const ovr = rint(minOvr, maxOvr);
    // Better players are likelier to carry a special trait.
    const traitChance = 0.18 + Math.max(0, ovr - 70) * 0.015;
    const trait = (Math.random() < traitChance) ? pick(TRAITS) : null;
    // The "scouting range": a fuzzy window around the true rating, fixed per
    // prospect (asymmetric so its middle doesn't give the answer away).
    const lo = Math.max(40, ovr - rint(4, 9));
    const hi = Math.min(99, ovr + rint(4, 9));
    return {
      id: 'p' + (idSeq++),
      name: pick(FIRST) + ' ' + pick(LAST),
      pos, ovr, trait,
      from: opts.from || pick(SCHOOLS),
      scouted: opts.scouted !== false ? (opts.scouted === true) : false,
      lo, hi,
    };
  }

  // ============================================================
  // YOUR ROSTER — load, save, and the all-important TEAM OVERALL
  // ============================================================
  // A brand-new team gets eight honest, middle-of-the-road starters (ratings in
  // the 60s), so there's plenty of room to grow through the draft and trades.
  function freshRoster() {
    return SLOTS.map(pos => makePlayer(pos, 60, 70, { from: 'PRO', scouted: true }));
  }

  let roster = load('roster', null);
  if (!Array.isArray(roster) || roster.length !== SLOTS.length) {
    roster = freshRoster();
    saveRoster();
  } else {
    // Old saves are trusted, but make sure every starter is "known".
    roster.forEach(p => { p.scouted = true; });
  }
  function saveRoster() { store('roster', roster); }

  const avg = list => Math.round(list.reduce((s, p) => s + p.ovr, 0) / list.length);
  // Team overall, split into offense (the first five) and defense (the last three).
  function teamOverall() {
    const off = avg(roster.slice(0, OFF_END));
    const def = avg(roster.slice(OFF_END));
    return { off, def, ovr: avg(roster) };
  }

  // ---- 💪 The boost main.js applies in beginGame --------------------------
  // A 60-overall unit is exactly 1.0 (no boost). It climbs to +8% for a maxed
  // (99) unit — small and CAPPED on purpose, stacked on top of the ⭐ team
  // ratings and 📈 level boost, and only ever on YOUR team.
  function unitBoost(v) { return 1 + Math.min(Math.max((v - 60) / 39, 0), 1) * 0.08; }
  function boost() {
    const t = teamOverall();
    return { off: unitBoost(t.off), def: unitBoost(t.def) };
  }

  // The weakest starter at a position (for WR that's the lower-rated of the two).
  // Returns { idx, player } — the slot a new player at this position would take.
  function weakestAt(pos) {
    let best = -1;
    roster.forEach((p, i) => {
      if (p.pos !== pos) return;
      if (best < 0 || p.ovr < roster[best].ovr) best = i;
    });
    return best < 0 ? null : { idx: best, player: roster[best] };
  }

  // ============================================================
  // THE 🏟 MY TEAM SCREEN (a DOM pop-up with three tabs)
  // ============================================================
  let view   = 'roster';   // 'roster' | 'draft' | 'trade'
  let draft  = null;       // the in-progress draft (see startDraft)
  let offers = null;       // the current trade offers (see makeOffers)

  // A colored rating chip — green for stars, down to gray for depth guys.
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
  function playerRow(p, extra) {
    const shown = p.scouted ? `${p.ovr}` : `${p.lo}–${p.hi}`;
    const tr = p.scouted ? traitChip(p.trait) : `<span class="dr-trait dr-unk">❔ ???</span>`;
    return `<div class="dr-row">
        <div class="dr-pos">${POS_EMOJI[p.pos] || ''}<b>${p.pos}</b></div>
        <div class="dr-main">
          <div class="dr-name">${p.name}</div>
          <div class="dr-sub">from ${p.from} ${tr}</div>
        </div>
        <div class="dr-ovr" style="color:${p.scouted ? ovrColor(p.ovr) : '#c6cede'}">${shown}</div>
        ${extra || ''}
      </div>`;
  }

  function tabsHTML() {
    const tab = (id, label) => `<div class="dr-tab${view === id ? ' on' : ''}" data-act="tab" data-v="${id}">${label}</div>`;
    return `<div class="dr-tabs">${tab('roster', '📋 ROSTER')}${tab('draft', '🎯 DRAFT')}${tab('trade', '🔁 TRADE')}</div>`;
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
    const rows = roster.map(p => playerRow(p)).join('');
    return head + `<div class="dr-list">${rows}</div>` +
      `<div class="dr-hint">Draft young stars or trade to raise your overall — a better team plays tougher!</div>`;
  }

  // ---- 🎯 The DRAFT tab ---------------------------------------------------
  const DRAFT_TEAMS = 6;    // you + five computer teams
  const DRAFT_ROUNDS = 3;   // three of YOUR picks per draft day
  const CLASS_SIZE = 24;    // prospects in the class (plenty for everyone)

  function startDraft() {
    // Five computer teams, picked from the real NFL names (just for flavor).
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

    // The class: a spread of prospects across every position, boom-or-bust.
    const board = [];
    for (let i = 0; i < CLASS_SIZE; i++) board.push(makePlayer(pick(SLOTS), 58, 96, { scouted: false }));

    draft = { teams, you, order, ptr: 0, board, log: [], picks: [], done: false };
    advanceDraft();      // let any computer teams ahead of you pick first
  }

  // A computer team grabs a smart pick: usually the best available (by TRUE
  // rating — they've done their homework), with a little randomness so it's not
  // always the tippy-top. Removes him from the board and notes it in the log.
  function cpuPick(teamName) {
    if (!draft.board.length) return;
    const ranked = draft.board.slice().sort((a, b) => b.ovr - a.ovr);
    const p = ranked[rint(0, Math.min(2, ranked.length - 1))];
    draft.board.splice(draft.board.indexOf(p), 1);
    draft.log.unshift(`🤖 ${teamName} drafted ${p.pos} ${p.name} (${p.ovr})`);
  }

  // Walk the pick order, letting computer teams pick, until it's YOUR turn (then
  // stop and let the screen wait for you) or the draft runs out of picks.
  function advanceDraft() {
    while (draft.ptr < draft.order.length) {
      const slot = draft.order[draft.ptr];
      if (slot === draft.you) return;                 // your turn — wait for a tap
      cpuPick(draft.teams[slot - 1]);
      draft.ptr++;
    }
    draft.done = true;
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
    const w = weakestAt(p.pos);
    const old = w ? w.player.ovr : 0;
    p.scouted = true;                                 // once he's yours, you know him
    if (w) roster[w.idx] = p;
    saveRoster();
    draft.board.splice(i, 1);
    draft.picks.push(p);
    const delta = p.ovr - old;
    draft.log.unshift(`✅ YOU drafted ${p.pos} ${p.name} (${p.ovr})${delta > 0 ? ' ⬆+' + delta : ''}`);
    if (delta > 0) { party($('team-body'), p.trait ? p.trait.e : '⭐', 'UPGRADE +' + delta + '!'); sting('td'); }
    draft.ptr++;
    advanceDraft();
    render();
  }

  function draftHTML() {
    if (!draft) {
      return `<div class="dr-intro">It's <b>DRAFT DAY</b>! A new class of young stars just arrived from
        schools all over. <b>${DRAFT_TEAMS} teams</b> take turns picking in snake order — grab the best
        one before a computer team does. Each pick <b>upgrades a starter</b>.<br><br>
        🔎 A prospect's true rating is hidden — <b>scout</b> him to see it (<b>8–25 🪙</b>: the bigger the
        star he might be, the more scouting costs).</div>
        ${coinLine()}
        <div class="dr-actions"><div class="ov-btn yes" data-act="startDraft">START DRAFT ▶</div></div>`;
    }

    // Draft finished — a little recap of who you landed.
    if (draft.done) {
      const got = draft.picks.length
        ? draft.picks.map(p => playerRow(p)).join('')
        : `<div class="dr-hint">No picks this time.</div>`;
      return `<div class="dr-cap">🎉 DRAFT COMPLETE — your haul:</div>
        <div class="dr-list">${got}</div>
        <div class="dr-actions">
          <div class="ov-btn yes" data-act="tab" data-v="roster">SEE MY TEAM</div>
          <div class="ov-btn" data-act="newDraft">DRAFT AGAIN</div>
        </div>`;
    }

    // You're on the clock. Show the round/pick, the recent picks, then the board.
    const round = Math.floor(draft.ptr / DRAFT_TEAMS) + 1;
    const myNum = draft.picks.length + 1;
    const logHTML = draft.log.slice(0, 3).map(l => `<div class="dr-log">${l}</div>`).join('');
    // Sort the board so it's easy to read: offense group, then defense, best first.
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
      // The DRAFT button teases the gain — but only once you've scouted him.
      let gain = '';
      if (p.scouted) {
        const d = p.ovr - yours;
        gain = d > 0 ? `<span class="dr-up">⬆+${d}</span>` : d < 0 ? `<span class="dr-dn">⬇${d}</span>` : `<span class="dr-eq">=</span>`;
      }
      const scoutBtn = p.scouted ? '' : `<div class="dr-mini" data-act="scout" data-i="${i}">🔎 ${scoutCost(p)}🪙</div>`;
      return `<div class="dr-item">
          ${playerRow(p)}
          <div class="dr-rowbtns">
            <div class="dr-vs">your ${p.pos}: <b>${yours}</b></div>
            ${scoutBtn}
            <div class="dr-mini yes" data-act="draft" data-i="${i}">DRAFT ${gain}</div>
          </div>
        </div>`;
    }).join('');

    return `<div class="dr-clock">🎯 ROUND ${round} · YOUR PICK ${myNum} OF ${DRAFT_ROUNDS} — <b>ON THE CLOCK!</b></div>
      ${coinLine()}
      ${logHTML ? `<div class="dr-logbox">${logHTML}</div>` : ''}
      <div class="dr-list dr-board">${rows}</div>`;
  }

  // ---- 🔁 The TRADE tab ---------------------------------------------------
  const OFFER_COUNT = 4;

  // Build a batch of trade offers. Each is a league team offering one of their
  // players for one of yours — usually a small upgrade that costs you some coins
  // (that's the catch), sometimes a cool trait instead. Fair-ish on purpose.
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
      // Their player: usually a touch better than yours (−2 .. +12).
      const inOvr = Math.min(99, Math.max(50, mine.player.ovr + rint(-2, 12)));
      const incoming = makePlayer(pos, inOvr, inOvr, { from: abbr, scouted: true });
      // Coins to even it up: priced off how GOOD their guy is (not just the
      // upgrade), so a big star really costs a lot — plus extra for a ⭐ trait.
      // A weak player they're dumping can even pay YOU a little (floored at −15).
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

  // A tiny inline message (used when you can't afford something).
  let flashMsg = '';
  function flash(msg) { flashMsg = msg; render(); setTimeout(() => { flashMsg = ''; render(); }, 1600); }

  // ---- Draw whichever tab is showing -------------------------------------
  function render() {
    const body = $('team-body');
    if (!body) return;
    let inner = view === 'draft' ? draftHTML() : view === 'trade' ? tradeHTML() : rosterHTML();
    const msg = flashMsg ? `<div class="dr-flash">${flashMsg}</div>` : '';
    body.innerHTML = tabsHTML() + msg + inner;
  }

  // ---- One click handler for the whole pop-up (event delegation) ----------
  function onTap(e) {
    const el = e.target.closest('[data-act]');
    if (!el) return;
    e.preventDefault();
    const act = el.dataset.act;
    if (act === 'tab')        { view = el.dataset.v; if (view === 'trade') offers = null; render(); }
    else if (act === 'startDraft' || act === 'newDraft') { startDraft(); render(); }
    else if (act === 'scout') scout(+el.dataset.i);
    else if (act === 'draft') draftPick(+el.dataset.i);
    else if (act === 'newOffers') { makeOffers(); render(); }
    else if (act === 'accept') acceptOffer(el.dataset.id);
    else if (act === 'pass')   passOffer(el.dataset.id);
  }

  // ---- Open / close the pop-up -------------------------------------------
  function open() {
    view = 'roster'; draft = null; offers = null; flashMsg = '';
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
  };
})();
