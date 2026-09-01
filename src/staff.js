// ============================================================
// TOUCHDOWN FUN — staff.js: 🎓 THE COACHING STAFF (Round 9, pick ③)
// ------------------------------------------------------------
// You've been the only coach in this building. Time to hire some help.
//
// Three jobs, and you fill them yourself:
//   🎯 OFFENSIVE COORDINATOR — runs the attack
//   🛡 DEFENSIVE COORDINATOR — runs the defence
//   🦵 SPECIAL TEAMS COACH   — runs the kicking game
//
// Each job has candidates with different specialities, and hiring one
// costs coins. From then on he's yours: every game you WIN he gains
// experience, and every level makes his speciality a little stronger —
// up to level 5. A coach you've won with for months is genuinely better
// than the one you just hired.
//
// Not happy? You can replace a coach, but the new man starts at level 1,
// so loyalty is worth something.
//
// ------------------------------------------------------------
// HOW THE BONUSES REACH THE GAME
// ------------------------------------------------------------
// Two proven fold-in points, no new machinery:
//   • the offensive and special-teams bonuses fold into the same shop.js
//     perk functions the gear, spin buffs, power-ups and Game Plan all
//     use, so they're live in the middle of every play;
//   • the defensive coordinator gets one line in beginGame, right beside
//     the boss/rival/playoff buffs, quietly slowing the other team's
//     offence.
// With no coach hired every number is ×1 / +0 and the game is unchanged.
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
  // Wins needed to reach level 2, 3, 4, 5. Deliberately a long road.
  const LADDER = [0, 3, 8, 15, 25];

  // ---- The candidates -----------------------------------------------------
  // `per` is how much ONE level is worth; the bonus is per × level.
  const JOBS = [
    { slot: 'oc', title: 'OFFENSIVE COORDINATOR', ic: '🎯', hire: 350,
      picks: [
        { id: 'pass',  ic: '🎯', name: 'Dale Prosser',  spec: 'PASSING GURU',
          blurb: 'Fewer interceptions thrown.', stat: 'arm',   per: 0.030,
          unit: v => '−' + Math.round(v * 100) + '% picks' },
        { id: 'run',   ic: '🏃', name: 'Bud Halloway',  spec: 'GROUND GAME',
          blurb: 'Your runners get up to speed quicker.', stat: 'speed', per: 0.008,
          unit: v => '+' + (v * 100).toFixed(1) + '% run speed' },
        { id: 'hands', ic: '🧤', name: 'Ray Okafor',    spec: 'RECEIVING',
          blurb: 'More catches, fewer drops.', stat: 'catch', per: 0.012,
          unit: v => '+' + (v * 100).toFixed(1) + '% catching' },
      ] },
    { slot: 'dc', title: 'DEFENSIVE COORDINATOR', ic: '🛡', hire: 350,
      picks: [
        { id: 'shut',  ic: '🧱', name: 'Marv Deacon',   spec: 'SHUTDOWN UNIT',
          blurb: 'The other team\'s offence looks slower.', stat: 'oppoff', per: 0.012,
          unit: v => '−' + (v * 100).toFixed(1) + '% their offence' },
        { id: 'hawk',  ic: '🖐', name: 'Cass Rivera',   spec: 'TAKEAWAYS',
          blurb: 'Your defence snatches more of them.', stat: 'hawk',  per: 0.014,
          unit: v => '+' + (v * 100).toFixed(1) + '% takeaways' },
      ] },
    { slot: 'st', title: 'SPECIAL TEAMS COACH', ic: '🦵', hire: 250,
      picks: [
        { id: 'kick',  ic: '🦵', name: 'Gus Pemberton', spec: 'KICKING GAME',
          blurb: 'Steadier aim, more time to get it away.', stat: 'toe', per: 0.020,
          unit: v => 'kicks ' + (v * 100).toFixed(0) + '% easier' },
      ] },
  ];
  const jobOf  = slot => JOBS.find(j => j.slot === slot);
  const pickOf = (slot, id) => { const j = jobOf(slot); return j ? j.picks.find(p => p.id === id) : null; };

  // ---- State: { oc:{id,lvl,wins}|null, dc:…, st:… } ------------------------
  let s = null;
  function ensure() {
    if (!s) s = load(KEY, null);
    if (!s || typeof s !== 'object') s = {};
    ['oc', 'dc', 'st'].forEach(k => {
      const c = s[k];
      if (c && (!pickOf(k, c.id))) s[k] = null;          // a candidate that no longer exists
      if (s[k]) {
        s[k].lvl  = Math.max(1, Math.min(MAX_LVL, s[k].lvl || 1));
        s[k].wins = Math.max(0, s[k].wins || 0);
      } else s[k] = s[k] || null;
    });
  }
  function save() { store(KEY, s); }

  // ---- Hiring -------------------------------------------------------------
  function hire(slot, id) {
    ensure();
    const job = jobOf(slot), p = pickOf(slot, id);
    if (!job || !p) return;
    if (coins() < job.hire) { flash('Not enough coins — you need ' + job.hire + ' 🪙'); return; }
    const replacing = !!s[slot];
    if (window.TDShop) TDShop.spend(job.hire);
    s[slot] = { id: id, lvl: 1, wins: 0 };
    save(); render();
    flash((replacing ? '🔁 ' + p.name + ' takes over — starting at level 1.'
                     : '✍️ ' + p.name + ' hired as ' + job.title.toLowerCase() + '!'));
  }

  // ---- A win: every coach on staff learns something -----------------------
  function gameWon(won) {
    ensure();
    if (!won) return;
    let leveled = null;
    ['oc', 'dc', 'st'].forEach(k => {
      const c = s[k]; if (!c) return;
      c.wins++;
      const want = LADDER[Math.min(c.lvl, LADDER.length - 1)];
      if (c.lvl < MAX_LVL && c.wins >= want) {
        c.lvl++;
        const p = pickOf(k, c.id);
        if (p) leveled = p.name + ' → LEVEL ' + c.lvl;
      }
    });
    save();
    if (leveled) toast('🎓 ' + leveled);
  }

  // ---- What the bonuses actually are --------------------------------------
  function bonus(stat) {
    ensure();
    let total = 0;
    ['oc', 'dc', 'st'].forEach(k => {
      const c = s[k]; if (!c) return;
      const p = pickOf(k, c.id);
      if (p && p.stat === stat) total += p.per * c.lvl;
    });
    return total;
  }
  // shop.js asks for these (0 / ×1 when nobody is hired)
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
  function render() {
    ensure();
    const body = $('staff-body'); if (!body) return;
    const money = coins();

    body.innerHTML = '<div class="st-coins">🪙 ' + money + ' coins</div>' + JOBS.map(job => {
      const c = s[job.slot];
      const hired = c ? pickOf(job.slot, c.id) : null;
      const afford = money >= job.hire;

      const head =
        '<div class="st-jobTop"><span class="st-jobIc">' + job.ic + '</span>' +
          '<span class="st-jobName">' + job.title + '</span></div>';

      const current = hired
        ? '<div class="st-current">' +
            '<div class="st-curTop"><span class="st-ic">' + hired.ic + '</span>' +
              '<span class="st-nm">' + hired.name + '</span>' +
              '<span class="st-lvl">LVL ' + c.lvl + '</span></div>' +
            '<div class="st-spec">' + hired.spec + ' · ' + hired.unit(hired.per * c.lvl) + '</div>' +
            '<div class="st-prog">' +
              (c.lvl >= MAX_LVL ? 'Fully developed — the best in the league.'
               : c.wins + ' / ' + LADDER[c.lvl] + ' wins to level ' + (c.lvl + 1)) +
            '</div>' +
          '</div>'
        : '<div class="st-vacant">Nobody in this job yet.</div>';

      const list = job.picks.map(p => {
        const isHere = hired && hired.id === p.id;
        return '<div class="st-cand' + (isHere ? ' here' : '') + '">' +
          '<div class="st-candTop"><span class="st-ic">' + p.ic + '</span>' +
            '<span class="st-nm">' + p.name + '</span>' +
            (isHere ? '<span class="st-onstaff">ON STAFF</span>'
                    : '<span class="st-hire' + (afford ? '' : ' off') + '" data-slot="' + job.slot +
                      '" data-id="' + p.id + '">' + (hired ? 'REPLACE ' : 'HIRE ') + job.hire + ' 🪙</span>') +
          '</div>' +
          '<div class="st-blurb">' + p.spec + ' — ' + p.blurb + '</div>' +
        '</div>';
      }).join('');

      return '<div class="st-job">' + head + current + list + '</div>';
    }).join('') +
    '<div class="st-foot">Coaches level up when you WIN. Replacing one starts the new man at level 1.</div>';

    body.querySelectorAll('.st-hire').forEach(el => {
      el.addEventListener('pointerdown', e => {
        e.preventDefault(); e.stopPropagation();
        if (el.classList.contains('off')) { flash('Not enough coins yet — keep playing!'); return; }
        hire(el.getAttribute('data-slot'), el.getAttribute('data-id'));
      });
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

    // One hook: main.js already reports every result to the Reward Road with
    // TDRoad.addPoints(youWon) — the same call the 🚌 Road Trip listens to.
    if (window.TDRoad && !TDRoad.__staffWrapped) {
      const original = TDRoad.addPoints;
      TDRoad.addPoints = function (won) {
        original.apply(TDRoad, arguments);
        try { gameWon(!!won); } catch (e) {}
      };
      TDRoad.__staffWrapped = true;
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wireUp);
  else wireUp();

  window.TDStaff = {
    open, close, render, hire, gameWon,
    armAdd, catchAdd, hawkAdd, toeAdd, speedMult, oppOffMult,
    _state: () => s,
  };
})();
