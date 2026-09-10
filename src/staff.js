// ============================================================
// TOUCHDOWN FUN — staff.js: 🎓 THE COACHING STAFF
// ------------------------------------------------------------
// You've been the only coach in this building. Time to hire some help.
//
// Four jobs, and you fill them yourself:
//   👔 HEAD COACH            — runs the whole club (helps two departments)
//   🎯 OFFENSIVE COORDINATOR — runs the attack
//   🛡 DEFENSIVE COORDINATOR — runs the defence
//   🦵 SPECIAL TEAMS COACH   — runs the kicking game
//
// ⭐ STARS ARE THE POINT (Max's design, v1.99). Every coach on the market has
// a rating out of five stars, and it is the FIRST thing you see:
//
//   ⭐☆☆☆☆  cheap, and it shows            ⭐⭐⭐⭐☆  properly good, properly pricey
//   ⭐⭐⭐☆☆  a solid, affordable hire        ⭐⭐⭐⭐⭐  rare. Save up.
//
// The better he is, the MORE HE COSTS and the more he actually does — a ⭐5
// coach is worth nearly three times a ⭐1 in his speciality. A five-star is
// deliberately rare on the market, so finding one is an event.
//
// ⚠️ STARS AND LEVELS ARE TWO DIFFERENT THINGS, and keeping both is what makes
// hiring interesting:
//   • ⭐ STARS  = raw talent. You BUY it, up front, with coins.
//   • 📈 LEVELS = loyalty. You EARN it, by winning games together (1→5).
// The bonus multiplies the two, so a ⭐2 coach you've won a whole season with
// can genuinely out-perform the ⭐4 you just signed. Replacing a coach throws
// the levels away and starts the new man at 1 — talent is for sale, history
// isn't.
//
// 🔍 THE MARKET refreshes when you pay a scout fee, so if nobody good is
// available you can go looking again. Candidates are generated and SAVED, so
// the man you were saving up for is still there tomorrow.
//
// ------------------------------------------------------------
// HOW THE BONUSES REACH THE GAME
// ------------------------------------------------------------
// Two proven fold-in points, no new machinery:
//   • the offensive, receiving, kicking and takeaway bonuses fold into the
//     same shop.js perk functions the gear, spin buffs, power-ups, Game Plan
//     and 🌈 ball skins all use, so they're live in the middle of every play;
//   • the defensive bonus gets one line in beginGame, right beside the
//     boss/rival/playoff buffs, quietly slowing the other team's offence.
// With nobody hired every number is ×1 / +0 and the game is unchanged, and
// the six getters below are exactly the ones shop.js and main.js already call.
// ============================================================
(function () {
  'use strict';

  // Short name — TDStats.shared adds the "tdr-" (so this is "tdr-staff").
  const KEY = 'staff';
  const $ = id => document.getElementById(id);

  const T = window.TDStats ? TDStats.shared : null;
  const store = (k, v) => { if (T) T.store(k, v); };
  const load  = (k, f) => (T ? T.load(k, f) : f);
  const coins = () => (window.TDShop ? TDShop.coins() : 0);

  const MAX_LVL = 5;
  const LADDER = [0, 3, 8, 15, 25];     // wins needed for level 2,3,4,5
  const SCOUT_FEE = 75;                 // to see a fresh set of candidates
  const MARKET_SIZE = 3;                // candidates per job

  // ⭐ What a star is worth. A ⭐5 does ~2.8× what a ⭐1 does.
  const STAR_MULT = [0, 0.72, 1.04, 1.36, 1.68, 2.00];
  // ⭐ …and what he charges for it. Steeper than the benefit on purpose, so a
  // five-star is something you SAVE UP for rather than something you just buy.
  const STAR_COST = [0, 0.40, 0.80, 1.40, 2.20, 3.40];
  // How often each rating turns up. Five-stars are rare — that's the hook.
  const STAR_ODDS = [[1, 18], [2, 27], [3, 30], [4, 18], [5, 7]];

  // ---- The archetypes -----------------------------------------------------
  // `gains` is how much ONE level at ⭐(mult 1) is worth, per stat. The head
  // coach helps TWO departments at once, which is what makes him the boss.
  const JOBS = [
    { slot: 'hc', title: 'HEAD COACH', ic: '👔', base: 500,
      archs: [
        { id: 'tact', ic: '🧠', spec: 'THE TACTICIAN', blurb: 'Sharper attack, tougher defence.',
          gains: { speed: 0.005, oppoff: 0.007 } },
        { id: 'moti', ic: '🔥', spec: 'THE MOTIVATOR', blurb: 'Surer hands, hungrier defence.',
          gains: { catch: 0.007, hawk: 0.008 } },
        { id: 'vet',  ic: '🧊', spec: 'THE OLD HAND',  blurb: 'Calmer passing, steadier kicking.',
          gains: { arm: 0.018, toe: 0.012 } },
      ] },
    { slot: 'oc', title: 'OFFENSIVE COORDINATOR', ic: '🎯', base: 350,
      archs: [
        { id: 'pass',  ic: '🎯', spec: 'PASSING GURU', blurb: 'Fewer interceptions thrown.',
          gains: { arm: 0.030 } },
        { id: 'run',   ic: '🏃', spec: 'GROUND GAME',  blurb: 'Your runners get up to speed quicker.',
          gains: { speed: 0.008 } },
        { id: 'hands', ic: '🧤', spec: 'RECEIVING',    blurb: 'More catches, fewer drops.',
          gains: { catch: 0.012 } },
      ] },
    { slot: 'dc', title: 'DEFENSIVE COORDINATOR', ic: '🛡', base: 350,
      archs: [
        { id: 'shut', ic: '🧱', spec: 'SHUTDOWN UNIT', blurb: 'The other team\'s offence looks slower.',
          gains: { oppoff: 0.012 } },
        { id: 'hawk', ic: '🖐', spec: 'TAKEAWAYS',     blurb: 'Your defence snatches more of them.',
          gains: { hawk: 0.014 } },
      ] },
    { slot: 'st', title: 'SPECIAL TEAMS COACH', ic: '🦵', base: 250,
      archs: [
        { id: 'kick', ic: '🦵', spec: 'KICKING GAME',  blurb: 'Steadier aim, more time to get it away.',
          gains: { toe: 0.020 } },
        { id: 'ret',  ic: '💨', spec: 'RETURN GAME',   blurb: 'Your returners hit the hole faster.',
          gains: { speed: 0.006 } },
      ] },
  ];
  const SLOTS = JOBS.map(j => j.slot);
  const jobOf  = slot => JOBS.find(j => j.slot === slot);
  const archOf = (slot, id) => { const j = jobOf(slot); return j ? j.archs.find(a => a.id === id) : null; };

  // How each bonus reads on screen.
  const LABEL = {
    arm:    v => '−' + (v * 100).toFixed(1) + '% picks thrown',
    catch:  v => '+' + (v * 100).toFixed(1) + '% catching',
    speed:  v => '+' + (v * 100).toFixed(1) + '% run speed',
    hawk:   v => '+' + (v * 100).toFixed(1) + '% takeaways',
    toe:    v => 'kicks ' + (v * 100).toFixed(0) + '% easier',
    oppoff: v => '−' + (v * 100).toFixed(1) + '% their offence',
  };

  // ---- Making up coaches --------------------------------------------------
  const FIRST = ['Dale', 'Bud', 'Ray', 'Marv', 'Cass', 'Gus', 'Hank', 'Otis', 'Vince', 'Rudy',
                 'Sal', 'Dutch', 'Wally', 'Cliff', 'Mo', 'Rex', 'Lou', 'Gene', 'Buck', 'Chip'];
  const LAST  = ['Prosser', 'Halloway', 'Okafor', 'Deacon', 'Rivera', 'Pemberton', 'Vance', 'Boyd',
                 'Castellan', 'Nowak', 'Ferraro', 'Whitlock', 'Bramble', 'Quill', 'Ashford', 'Doyle'];
  const rnd = arr => arr[Math.floor(Math.random() * arr.length)];

  function rollStars() {
    const total = STAR_ODDS.reduce((a, b) => a + b[1], 0);
    let r = Math.random() * total;
    for (const [stars, w] of STAR_ODDS) { r -= w; if (r <= 0) return stars; }
    return 3;
  }
  function makeCandidate(slot) {
    const job = jobOf(slot);
    const a = rnd(job.archs);
    return { arch: a.id, name: rnd(FIRST) + ' ' + rnd(LAST), stars: rollStars() };
  }
  function makeMarket() {
    const m = {};
    SLOTS.forEach(sl => {
      m[sl] = [];
      for (let i = 0; i < MARKET_SIZE; i++) m[sl].push(makeCandidate(sl));
    });
    return m;
  }

  const costOf = (slot, stars) =>
    Math.round((jobOf(slot).base * STAR_COST[Math.max(1, Math.min(5, stars))]) / 10) * 10;
  const starStr = n => '⭐'.repeat(n) + '☆'.repeat(5 - n);

  // ---- State --------------------------------------------------------------
  // { hc/oc/dc/st: {arch,name,stars,lvl,wins}|null, market:{slot:[cand,…]} }
  let s = null;
  function ensure() {
    if (!s) s = load(KEY, null);
    if (!s || typeof s !== 'object') s = {};
    SLOTS.forEach(k => {
      const c = s[k];
      if (!c) { s[k] = null; return; }
      // ⚠️ MIGRATION from the pre-star save, which looked like {id,lvl,wins}.
      // Anyone already on staff keeps his level and win history and is treated
      // as a ⭐3 — the middle of the range, so nobody is nerfed or gifted.
      if (c.arch == null && c.id != null) { c.arch = c.id; delete c.id; }
      if (!archOf(k, c.arch)) { s[k] = null; return; }   // an archetype that no longer exists
      if (typeof c.stars !== 'number') c.stars = 3;
      if (typeof c.name !== 'string' || !c.name) c.name = rnd(FIRST) + ' ' + rnd(LAST);
      c.stars = Math.max(1, Math.min(5, c.stars));
      c.lvl   = Math.max(1, Math.min(MAX_LVL, c.lvl || 1));
      c.wins  = Math.max(0, c.wins || 0);
    });
    if (!s.market || typeof s.market !== 'object') s.market = makeMarket();
    SLOTS.forEach(sl => {
      if (!Array.isArray(s.market[sl]) || !s.market[sl].length) {
        s.market[sl] = [];
        for (let i = 0; i < MARKET_SIZE; i++) s.market[sl].push(makeCandidate(sl));
      }
      s.market[sl] = s.market[sl].filter(c => c && archOf(sl, c.arch));
      while (s.market[sl].length < MARKET_SIZE) s.market[sl].push(makeCandidate(sl));
    });
  }
  function save() { store(KEY, s); }

  // ---- Hiring -------------------------------------------------------------
  function hire(slot, idx) {
    ensure();
    const job = jobOf(slot); if (!job) return false;
    const cand = (s.market[slot] || [])[idx]; if (!cand) return false;
    const price = costOf(slot, cand.stars);
    if (coins() < price) { flash('Not enough coins — ' + cand.name + ' wants ' + price + ' 🪙'); return false; }
    const replacing = !!s[slot];
    if (window.TDShop) TDShop.spend(price);
    s[slot] = { arch: cand.arch, name: cand.name, stars: cand.stars, lvl: 1, wins: 0 };
    // he's off the market now; someone new turns up in his place
    s.market[slot].splice(idx, 1, makeCandidate(slot));
    save(); render();
    flash(replacing
      ? '🔁 ' + cand.name + ' (' + starStr(cand.stars) + ') takes over — starting at level 1.'
      : '✍️ ' + cand.name + ' hired as ' + job.title.toLowerCase() + '!');
    return true;
  }

  function scout() {
    ensure();
    if (coins() < SCOUT_FEE) { flash('Scouting costs ' + SCOUT_FEE + ' 🪙 — not enough yet.'); return false; }
    if (window.TDShop) TDShop.spend(SCOUT_FEE);
    s.market = makeMarket();
    save(); render();
    const best = Math.max.apply(null, SLOTS.map(sl => Math.max.apply(null, s.market[sl].map(c => c.stars))));
    flash(best >= 5 ? '🔍 New names in — and there is a ⭐⭐⭐⭐⭐ among them!'
                    : '🔍 A fresh set of candidates is in.');
    return true;
  }

  // ---- A win: every coach on staff learns something -----------------------
  function gameWon(won) {
    ensure();
    if (!won) return;
    let leveled = null;
    SLOTS.forEach(k => {
      const c = s[k]; if (!c) return;
      c.wins++;
      const want = LADDER[Math.min(c.lvl, LADDER.length - 1)];
      if (c.lvl < MAX_LVL && c.wins >= want) {
        c.lvl++;
        leveled = c.name + ' → LEVEL ' + c.lvl;
      }
    });
    save();
    if (leveled) toast('🎓 ' + leveled);
  }

  // ---- What the bonuses actually are --------------------------------------
  // stars × levels: talent you bought, times loyalty you earned.
  function bonus(stat) {
    ensure();
    let total = 0;
    SLOTS.forEach(k => {
      const c = s[k]; if (!c) return;
      const a = archOf(k, c.arch);
      if (a && a.gains && a.gains[stat]) total += a.gains[stat] * c.lvl * STAR_MULT[c.stars];
    });
    return total;
  }
  // shop.js asks for these (0 / ×1 when nobody is hired) — unchanged contract
  const armAdd    = () => bonus('arm');
  const catchAdd  = () => bonus('catch');
  const hawkAdd   = () => bonus('hawk');
  const toeAdd    = () => bonus('toe');
  const speedMult = () => 1 + bonus('speed');
  // main.js beginGame asks for this — a multiplier ON THE OPPONENT'S offence
  const oppOffMult = () => 1 - bonus('oppoff');

  // ---- Little messages ----------------------------------------------------
  function flash(msg) {
    const el = $('staff-msg'); if (!el) return;
    el.textContent = msg; el.classList.add('show');
    clearTimeout(flash._t); flash._t = setTimeout(() => el.classList.remove('show'), 2600);
  }
  function toast(msg) {
    const el = $('chal-toast'); if (!el) return;
    el.textContent = msg; el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 2400);
  }

  // ---- Drawing ------------------------------------------------------------
  function gainsLine(arch, lvl, stars) {
    const mult = STAR_MULT[stars] * lvl;
    return Object.keys(arch.gains)
      .map(k => (LABEL[k] ? LABEL[k](arch.gains[k] * mult) : k))
      .join(' · ');
  }

  function render() {
    ensure();
    const body = $('staff-body'); if (!body) return;
    const money = coins();

    body.innerHTML =
      '<div class="st-coins">🪙 ' + money + ' coins</div>' +
      '<div class="st-scout' + (money >= SCOUT_FEE ? '' : ' off') + '" id="st-scout">' +
        '🔍 SCOUT NEW CANDIDATES · ' + SCOUT_FEE + ' 🪙</div>' +
      JOBS.map(job => {
        const c = s[job.slot];
        const arch = c ? archOf(job.slot, c.arch) : null;

        const head =
          '<div class="st-jobTop"><span class="st-jobIc">' + job.ic + '</span>' +
            '<span class="st-jobName">' + job.title + '</span></div>';

        const current = (c && arch)
          ? '<div class="st-current">' +
              '<div class="st-curTop"><span class="st-ic">' + arch.ic + '</span>' +
                '<span class="st-nm">' + c.name + '</span>' +
                '<span class="st-lvl">LVL ' + c.lvl + '</span></div>' +
              '<div class="st-stars">' + starStr(c.stars) + '</div>' +
              '<div class="st-spec">' + arch.spec + ' · ' + gainsLine(arch, c.lvl, c.stars) + '</div>' +
              '<div class="st-prog">' +
                (c.lvl >= MAX_LVL ? 'Fully developed — the best he will ever be.'
                 : c.wins + ' / ' + LADDER[c.lvl] + ' wins to level ' + (c.lvl + 1)) +
              '</div>' +
            '</div>'
          : '<div class="st-vacant">Nobody in this job yet.</div>';

        const list = (s.market[job.slot] || []).map((cand, i) => {
          const a = archOf(job.slot, cand.arch);
          if (!a) return '';
          const price = costOf(job.slot, cand.stars);
          const afford = money >= price;
          return '<div class="st-cand">' +
            '<div class="st-candTop"><span class="st-ic">' + a.ic + '</span>' +
              '<span class="st-nm">' + cand.name + '</span>' +
              '<span class="st-hire' + (afford ? '' : ' off') + '" data-slot="' + job.slot +
                '" data-i="' + i + '">' + (c ? 'REPLACE ' : 'HIRE ') + price + ' 🪙</span>' +
            '</div>' +
            '<div class="st-stars sm">' + starStr(cand.stars) + '</div>' +
            '<div class="st-blurb">' + a.spec + ' — ' + a.blurb + '</div>' +
            '<div class="st-would">At level 1: ' + gainsLine(a, 1, cand.stars) + '</div>' +
          '</div>';
        }).join('');

        return '<div class="st-job">' + head + current + list + '</div>';
      }).join('') +
      '<div class="st-foot">⭐ Stars are talent you BUY. 📈 Levels are loyalty you EARN by winning. ' +
      'The bonus multiplies both — so a ⭐⭐☆☆☆ you have won a season with can beat a ⭐⭐⭐⭐☆ you just signed.</div>';

    body.querySelectorAll('.st-hire').forEach(el => {
      el.addEventListener('pointerdown', e => {
        e.preventDefault(); e.stopPropagation();
        if (el.classList.contains('off')) { flash('Not enough coins yet — keep playing!'); return; }
        hire(el.getAttribute('data-slot'), parseInt(el.getAttribute('data-i'), 10));
      });
    });
    const sc = $('st-scout');
    if (sc) sc.addEventListener('pointerdown', e => {
      e.preventDefault(); e.stopPropagation();
      if (sc.classList.contains('off')) { flash('Scouting costs ' + SCOUT_FEE + ' 🪙 — not enough yet.'); return; }
      scout();
    });
  }

  function open()  { ensure(); const m = $('staff-modal'); if (m) { m.style.display = 'flex'; render(); } }
  function close() { const m = $('staff-modal'); if (m) m.style.display = 'none'; }

  // ---- Wire up ------------------------------------------------------------
  function onTap(id, fn) {
    const el = $(id);
    if (el) el.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); fn(); });
  }

  function wireUp() {
    ensure();
    onTap('open-staff', open);
    onTap('staff-close', close);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wireUp);
  else wireUp();

  window.TDStaff = {
    open, close, render, hire, gameWon, scout,
    armAdd, catchAdd, hawkAdd, toeAdd, speedMult, oppOffMult,
    // handy for verification
    costOf, starStr,
    market: () => JSON.parse(JSON.stringify((s && s.market) || {})),
    staff: () => JSON.parse(JSON.stringify({ hc: s && s.hc, oc: s && s.oc, dc: s && s.dc, st: s && s.st })),
    _state: () => s,
    _setStars: (slot, n) => { ensure(); if (s[slot]) { s[slot].stars = n; save(); } },
    _setMarket: (slot, i, patch) => { ensure(); Object.assign(s.market[slot][i], patch); save(); render(); },
  };
})();
