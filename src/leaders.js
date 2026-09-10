// ============================================================
// TOUCHDOWN FUN — leaders.js: 📊 LEAGUE LEADERS (Round 11, pick ②)
// ------------------------------------------------------------
// Who is actually having the best year in this league? Not just you — all
// eight teams. Three leaderboards (touchdowns, yards, takeaways), plus the
// team leaders, and YOUR players sitting in the list wherever they've earned
// to be. Seeing your man at #3 in the league is the whole point.
//
// ⚠️ WHERE THE NUMBERS COME FROM, AND WHY THEY ARE NOT MADE UP.
// The season is a real simulation: every week `season.js` plays the other
// seven teams' games and records who won and by how much. So the league keeps
// genuine W/L, points-for and points-against for every team — that half is
// simply read.
//
// What the league does NOT keep is a stat sheet for the other teams' PLAYERS
// (they have no players — their games are simulated as scores). So a rival
// team's star is DERIVED from what that team actually did:
//   • how many points they really scored this season sets the size of the year
//   • their power rating tilts it a little
//   • a seed built from the team's own abbreviation picks the name
// That means the numbers agree with the season you actually played — a team
// that has scored 200 points has a bigger star than one stuck on 90 — and,
// because the seed is fixed, the SAME player with the SAME numbers is there
// every time you open the screen. A leaderboard that reshuffled itself on
// every visit would just look broken.
//
// YOUR OWN players are the opposite: those are real, counted play by play, and
// come straight from the season tally 🏅 Awards Night already keeps.
//
// Nothing is saved — the whole screen is built fresh from the season, so there
// is no third copy of the truth to drift.
// Opened from the 🏆 SEASON hub, because it belongs to the league.
// ============================================================
(function () {
  'use strict';

  const $ = id => document.getElementById(id);

  // ---- a tiny fixed-seed RNG, so a rival's star never reshuffles ----------
  // Same trick 📋 Daily Challenges uses to keep a day's goals steady.
  function hashStr(str) {
    let h = 1779033703 ^ str.length;
    for (let i = 0; i < str.length; i++) {
      h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
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

  const FIRST = ['Jaylen', 'Deshawn', 'Marcus', 'Trey', 'Kade', 'Rome', 'Zion', 'Cam',
                 'Amari', 'Bo', 'Jax', 'Silas', 'Rico', 'Tank', 'Dez', 'Kobe',
                 'Nico', 'Ty', 'Dane', 'Elias'];
  const LAST  = ['Boone', 'Vasquez', 'Okonkwo', 'Ferris', 'Salter', 'Nakamura', 'Reyes',
                 'Cobb', 'Ingram', 'Duval', 'Mackey', 'Salvatore', 'Pike', 'Hollis',
                 'Adeyemi', 'Brant', 'Cortez', 'Dunn'];
  const POS = ['RB', 'WR', 'WR', 'TE', 'QB'];

  // ---- build one rival team's star from what that team really did ---------
  function rivalStar(abbr, rec, power, games) {
    const rand = mulberry32(hashStr('leader:' + abbr + ':' + (rec.pf || 0)));
    const pf = Math.max(0, rec.pf || 0);
    const strength = ((power || 60) - 48) / 24;          // 0…1 across the 48–72 range
    // A star accounts for roughly a quarter to a third of his team's points.
    const share = 0.24 + rand() * 0.10 + strength * 0.05;
    const tds = Math.round((pf * share) / 6.6);
    const ypt = 26 + Math.round(rand() * 18);            // yards per touchdown-ish
    const yards = Math.round(tds * ypt + rand() * 40 * Math.max(1, games) / 4);
    // takeaways belong to the defence — driven by how few points they concede
    const stinginess = Math.max(0, 1 - (rec.pa || 0) / Math.max(1, pf + (rec.pa || 0) + 40));
    const takeaways = Math.round(stinginess * 6 + rand() * 3);
    return {
      name: FIRST[Math.floor(rand() * FIRST.length)] + ' ' + LAST[Math.floor(rand() * LAST.length)],
      pos: POS[Math.floor(rand() * POS.length)],
      abbr: abbr, mine: false,
      td: Math.max(0, tds), yards: Math.max(0, yards), takeaway: Math.max(0, takeaways),
    };
  }

  // ---- your own players: real, counted play by play -----------------------
  function myPlayers(myAbbr) {
    const tally = (window.TDAwards && TDAwards.tally) ? TDAwards.tally() : {};
    return Object.keys(tally).map(k => {
      const t = tally[k];
      return {
        name: t.name, pos: t.pos, abbr: myAbbr, mine: true,
        td: t.td || 0,
        yards: (t.recYds || 0) + (t.rushYds || 0),
        takeaway: t.takeaway || 0,
      };
    });
  }

  // ---- everybody, ranked --------------------------------------------------
  function build() {
    const tbl = (window.TDSeason && TDSeason.table) ? TDSeason.table() : null;
    if (!tbl) return null;
    const games = Math.max(1, (tbl.week || 1) - 1);
    const list = [];
    (tbl.league || []).forEach(abbr => {
      if (abbr === tbl.you) return;                     // yours are real, added below
      const rec = tbl.rec[abbr] || { w: 0, l: 0, pf: 0, pa: 0 };
      list.push(rivalStar(abbr, rec, tbl.power ? tbl.power[abbr] : 60, games));
    });
    const mine = myPlayers(tbl.you);
    return { tbl: tbl, players: list.concat(mine), games: games, mineCount: mine.length };
  }

  // Ties go to YOUR player. His number was counted play by play; the rival's
  // was worked out from his team's scoring, so when they're level the real one
  // deserves the higher spot.
  const byStat = key => (a, b) =>
    ((b[key] || 0) - (a[key] || 0)) || ((a.mine ? 0 : 1) - (b.mine ? 0 : 1));
  const rank = (players, key) =>
    players.filter(p => (p[key] || 0) > 0).sort(byStat(key)).slice(0, 5);

  // ---- drawing ------------------------------------------------------------
  function teamTiles(tbl) {
    const rec = tbl.rec, league = tbl.league || [];
    if (!league.length) return '';
    const bestBy = (fn, better) => league.slice().sort((a, b) => better(fn(b), fn(a)))[0];
    const wins   = bestBy(a => rec[a].w, (x, y) => x - y);
    const scored = bestBy(a => rec[a].pf, (x, y) => x - y);
    const stingy = bestBy(a => -rec[a].pa, (x, y) => x - y);
    const tile = (ic, abbr, val, label) =>
      '<div class="ld-tile' + (abbr === tbl.you ? ' mine' : '') + '">' +
        '<div class="ld-tile-ic">' + ic + '</div>' +
        '<div class="ld-tile-ab">' + abbr + '</div>' +
        '<div class="ld-tile-v">' + val + '</div>' +
        '<div class="ld-tile-l">' + label + '</div></div>';
    return '<div class="ld-tiles">' +
      tile('🏆', wins,   rec[wins].w + '–' + rec[wins].l, 'Best record') +
      tile('🔥', scored, rec[scored].pf,                  'Most points') +
      tile('🛡️', stingy, rec[stingy].pa,                  'Fewest allowed') +
    '</div>';
  }

  function boardFor(players, key, ic, title, unit) {
    const top = rank(players, key);
    if (!top.length) return '';
    return '<div class="ld-sec">' + ic + ' ' + title + '</div>' +
      top.map((p, i) =>
        '<div class="ld-row' + (p.mine ? ' mine' : '') + '">' +
          '<div class="ld-pos">' + (i + 1) + '</div>' +
          '<div class="ld-who"><div class="ld-nm">' + (p.mine ? '★ ' : '') + p.name + '</div>' +
            '<div class="ld-sub">' + p.pos + ' · ' + p.abbr + '</div></div>' +
          '<div class="ld-val">' + p[key] + '<small>' + unit + '</small></div>' +
        '</div>').join('');
  }

  function render() {
    const body = $('leaders-body'); if (!body) return;
    const d = build();
    if (!d) {
      body.innerHTML = '<div class="ld-empty">No league yet. Start a <b>🏆 SEASON</b> and the ' +
        'table fills up as the weeks go by — yours and everybody else\'s.</div>';
      return;
    }
    const { tbl, players } = d;
    const mineRanked = ['td', 'yards', 'takeaway'].map(k => {
      const all = players.filter(p => (p[k] || 0) > 0).sort(byStat(k));
      const i = all.findIndex(p => p.mine);
      return i < 0 ? null : { key: k, place: i + 1, who: all[i].name, val: all[i][k] };
    }).filter(Boolean);

    const best = mineRanked.sort((a, b) => a.place - b.place)[0];
    const NAMEOF = { td: 'touchdowns', yards: 'yards', takeaway: 'takeaways' };

    body.innerHTML =
      '<div class="ld-head">Week ' + tbl.week + ' &middot; ' +
        (tbl.phase === 'regular' ? 'regular season' : tbl.phase) + '</div>' +
      teamTiles(tbl) +
      (best
        ? '<div class="ld-you">Your best: <b>' + best.who + '</b> is <b>#' + best.place +
          '</b> in the league for ' + NAMEOF[best.key] + ' (' + best.val + ').</div>'
        : '<div class="ld-you">Play some season games and your players will start showing up here.</div>') +
      boardFor(players, 'td', '🏈', 'TOUCHDOWNS', '') +
      boardFor(players, 'yards', '📏', 'YARDS', '') +
      boardFor(players, 'takeaway', '🖐', 'TAKEAWAYS', '') +
      '<div class="ld-foot">★ marks your players. Rival teams are simulated, so their stars are ' +
      'worked out from the points those teams have actually scored this season.</div>';
  }

  function open()  { render(); const m = $('leaders-modal'); if (m) m.style.display = 'flex'; }
  function close() { const m = $('leaders-modal'); if (m) m.style.display = 'none'; }

  function wire() {
    const tap = (id, fn) => { const el = $(id); if (el) el.addEventListener('pointerdown', e => { e.preventDefault(); fn(); }); };
    tap('open-leaders', open);
    tap('leaders-close', close);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire);
  else wire();

  window.TDLeaders = {
    open, close, render,
    _build: build,
    _rank: rank,
    _rivalStar: rivalStar,
  };
})();
