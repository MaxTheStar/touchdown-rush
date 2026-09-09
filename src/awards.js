// ============================================================
// TOUCHDOWN FUN — awards.js: 🏅 AWARDS NIGHT (Round 10, pick ⑦)
// ------------------------------------------------------------
// The end of a season deserves a ceremony. When your season finishes, the
// trophies come out — and unlike ⭐ Player of the Game, these are earned over
// a WHOLE YEAR of football, from the stats of every game you played:
//
//   🏆 MOST VALUABLE PLAYER   the biggest season, all round
//   🛡️ DEFENSIVE PLAYER       the most takeaways
//   🧤 BEST HANDS             the most catches
//   🦵 SPECIAL TEAMS          the most field goals (longest one breaks ties)
//   🧑‍🏫 COACH OF THE YEAR      you, if you finished with a winning record
//
// ⚠️ THIS HAD TO BE DIFFERENT FROM ⭐ PLAYER OF THE GAME OR IT WOULD BE THE
// SAME FEATURE TWICE. That one crowns a man every week from one game's stats.
// This one adds every game of the season together and hands out five different
// trophies at the end of it — including one that isn't a player at all. A
// season MVP who only had one good afternoon shouldn't win anything.
//
// EVERY WINNER IS KEPT. The shelf remembers every ceremony you've ever held, so
// after a few seasons you can look back at who your great players were.
//
// HOW IT HOOKS IN — with ZERO edits to main.js. It wraps two functions that
// already run at exactly the right moments (the trick 🏥 injuries.js and
// 🌟 allstar.js use):
//   • TDGameStats.finish  — a game just ended: add its stat sheet to the
//     season tally (only for season games; exhibitions don't count).
//   • TDSeason.reportResult — the season table has just been updated, so this
//     is the first moment we can ask "is the season over?". If it is, the
//     ceremony is computed and stored, and a 🔴 dot appears on the Trophy Case
//     button. We never pop the ceremony open ourselves, because dynasty.js is
//     also reacting to the end of a season and two screens fighting over the
//     same moment is how you get a mess.
//
// Saved in `tdr-awards` = { tally, games, shelf: [...], pending }.
// ============================================================
(function () {
  'use strict';

  const T = window.TDStats ? TDStats.shared : null;
  const store = (k, v) => { if (T) T.store(k, v); };
  const load  = (k, f) => (T ? T.load(k, f) : f);
  const $ = id => document.getElementById(id);

  const MAX_SHELF = 12;      // keep a dozen ceremonies, newest first

  // ---- 💾 the tally and the shelf ----------------------------------------
  let A = load('awards', null);
  if (!A || typeof A !== 'object') A = {};
  if (!A.tally || typeof A.tally !== 'object') A.tally = {};
  if (typeof A.games !== 'number') A.games = 0;
  if (!Array.isArray(A.shelf)) A.shelf = [];
  if (typeof A.pending !== 'boolean') A.pending = false;
  function save() { store('awards', A); }

  const KEYS = ['rec', 'recYds', 'rush', 'rushYds', 'td', 'fg', 'longFg',
                'takeaway', 'comp', 'passYds', 'passTd'];

  // ---- 📈 add one game's stat sheet into the season tally -----------------
  function addGame() {
    if (!window.TDGameStats || !TDGameStats.table) return;
    // Exhibitions don't count towards a season award.
    if (!(window.TDSeason && TDSeason.hasSeason && TDSeason.hasSeason())) return;
    const rows = TDGameStats.table() || [];
    let touched = false;
    for (const row of rows) {
      const s = row.stats || {};
      // Skip anyone who did literally nothing, so the tally stays small.
      if (!KEYS.some(k => s[k])) continue;
      const key = row.name;
      const t = A.tally[key] || (A.tally[key] = {
        name: row.name, pos: row.pos, emoji: row.emoji, side: row.side, games: 0
      });
      t.pos = row.pos; t.emoji = row.emoji; t.side = row.side;   // keep it current
      t.games++;
      for (const k of KEYS) {
        if (k === 'longFg') t.longFg = Math.max(t.longFg || 0, s.longFg || 0);
        else t[k] = (t[k] || 0) + (s[k] || 0);
      }
      touched = true;
    }
    if (touched) { A.games++; save(); }
  }

  // ---- 🏆 who wins what ---------------------------------------------------
  // The MVP score is the season-long version of the same idea gamestats.js uses
  // for one game: touchdowns and takeaways matter most, then yards and catches.
  function mvpScore(t) {
    return (t.td || 0) * 60 + (t.takeaway || 0) * 50 + (t.fg || 0) * 35
         + (t.rec || 0) * 5 + Math.round(((t.recYds || 0) + (t.rushYds || 0)) / 4)
         + (t.passTd || 0) * 25 + Math.round((t.passYds || 0) / 12);
  }
  function best(list, score) {
    let top = null, topV = 0;
    for (const t of list) {
      const v = score(t);
      if (v > topV) { topV = v; top = t; }
    }
    return topV > 0 ? top : null;
  }
  // ⚠️ THE LINE MUST LEAD WITH THE STAT THAT ACTUALLY WON THE TROPHY. `lead` is
  // the award's own stat, and it goes first. Without this the Special Teams
  // winner read "214 pass yds · 2 FG" — technically true, but it buries the
  // reason he won under a number from a different job entirely.
  function lineFor(t, lead) {
    const say = {
      td:       () => t.td       && t.td + ' TD',
      takeaway: () => t.takeaway && t.takeaway + (t.takeaway === 1 ? ' takeaway' : ' takeaways'),
      rec:      () => t.rec      && t.rec + (t.rec === 1 ? ' catch' : ' catches'),
      yds:      () => { const y = (t.recYds || 0) + (t.rushYds || 0); return y && y + ' yds'; },
      passYds:  () => t.passYds  && t.passYds + ' pass yds',
      fg:       () => t.fg       && t.fg + (t.fg === 1 ? ' field goal' : ' field goals'),
      longFg:   () => t.longFg   && 'long of ' + t.longFg + ' yd',
    };
    const order = ['td', 'takeaway', 'rec', 'yds', 'passYds', 'fg'];
    const keys = lead ? [].concat(lead, order.filter(k => lead.indexOf(k) === -1)) : order;
    const bits = [];
    for (const k of keys) {
      const v = say[k] && say[k]();
      if (v && bits.indexOf(v) === -1) bits.push(v);
    }
    return bits.slice(0, 3).join(' · ') || 'a quiet year';
  }

  // Build the ceremony from the tally + how the season went.
  function ceremony(snap) {
    const list = Object.keys(A.tally).map(k => A.tally[k]);
    const out = [];
    const push = (ic, title, t, lead) => {
      if (!t) return;
      out.push({ ic: ic, title: title, name: t.name, emoji: t.emoji, line: lineFor(t, lead) });
    };
    push('🏆', 'Most Valuable Player', best(list, mvpScore));
    push('🛡️', 'Defensive Player',     best(list.filter(t => t.side === 'def'), t => t.takeaway || 0), ['takeaway']);
    push('🧤', 'Best Hands',            best(list, t => t.rec || 0), ['rec']);
    push('🦵', 'Special Teams',         best(list, t => (t.fg || 0) * 100 + (t.longFg || 0)), ['fg', 'longFg']);
    // 🧑‍🏫 the only trophy that isn't a player
    const w = snap ? (snap.w || 0) : 0, l = snap ? (snap.l || 0) : 0;
    if (w > l) {
      out.push({ ic: '🧑‍🏫', title: 'Coach of the Year', name: 'YOU', emoji: '🧑‍🏫',
                 line: w + '–' + l + (snap && snap.won ? ' · MAX BOWL CHAMPIONS' : '') });
    }
    return out;
  }

  // ---- 🎬 the season just ended ------------------------------------------
  function closeSeason() {
    const snap = (window.TDSeason && TDSeason.snapshot) ? TDSeason.snapshot() : null;
    if (!snap || !snap.over) return false;
    // ⚠️ Don't bail just because no PLAYER made the tally. 🧑‍🏫 Coach of the Year
    // isn't a player award, so a winning season always deserves a ceremony even
    // if the stat book somehow came back empty. Build it first, then decide.
    const awards = ceremony(snap);
    if (!awards.length) { A.tally = {}; A.games = 0; save(); return false; }
    A.shelf.unshift({
      when: new Date().toLocaleDateString(),
      team: snap.you || '',
      record: (snap.w || 0) + '–' + (snap.l || 0),
      champion: !!snap.won,
      awards: awards
    });
    if (A.shelf.length > MAX_SHELF) A.shelf.length = MAX_SHELF;
    A.tally = {}; A.games = 0;
    A.pending = true;                 // a 🔴 dot until you go and look
    save();
    badge();
    if (window.TDShop) {
      TDShop.earn(25);
      if (TDShop.celebrate) TDShop.celebrate(null, '🏅', 'AWARDS NIGHT!');
    }
    return true;
  }

  // A red dot on the Trophy Case button, so a ceremony is never missed.
  function badge() {
    const b = $('awards-badge');
    if (b) b.className = A.pending ? 'awards-dot on' : 'awards-dot';
  }

  // ---- 🖼 the screen ------------------------------------------------------
  function render() {
    const box = $('awards-body'); if (!box) return;
    const latest = A.shelf[0];
    const inProgress = Object.keys(A.tally).length;

    let html = '';
    if (latest) {
      html += `<div class="aw-head">
                 <div class="aw-head-t">${latest.champion ? '🏆 ' : ''}${latest.team || 'Your team'} &middot; ${latest.record}</div>
                 <div class="aw-head-s">${latest.when}</div>
               </div>` +
              latest.awards.map(a => `
                <div class="aw-row">
                  <div class="aw-ic">${a.ic}</div>
                  <div class="aw-tx">
                    <div class="aw-title">${a.title}</div>
                    <div class="aw-name">${a.emoji} ${a.name}</div>
                    <div class="aw-line">${a.line}</div>
                  </div>
                </div>`).join('');
    } else {
      html += `<div class="aw-empty">No ceremony yet. Play a <b>🏆 SEASON</b> all the way through
                 and the trophies come out at the end of it.</div>`;
    }

    if (inProgress) {
      html += `<div class="aw-sec">This season so far</div>
               <div class="aw-prog">${A.games} game${A.games === 1 ? '' : 's'} counted &middot;
                 ${inProgress} player${inProgress === 1 ? '' : 's'} in the running</div>`;
    }

    if (A.shelf.length > 1) {
      html += `<div class="aw-sec">Past ceremonies</div>`;
      html += A.shelf.slice(1).map(c => {
        const mvp = c.awards[0];
        return `<div class="aw-past">
                  <span class="aw-past-y">${c.champion ? '🏆 ' : ''}${c.record}</span>
                  <span class="aw-past-n">${mvp ? mvp.emoji + ' ' + mvp.name : '—'}</span>
                  <span class="aw-past-w">MVP</span>
                </div>`;
      }).join('');
    }

    box.innerHTML = html;
    if (A.pending) { A.pending = false; save(); badge(); }   // you've seen it now
  }

  function open()  { render(); const m = $('awards-modal'); if (m) m.style.display = 'flex'; }
  function close() { const m = $('awards-modal'); if (m) m.style.display = 'none'; }

  function wire() {
    const tap = (id, fn) => { const el = $(id); if (el) el.addEventListener('pointerdown', e => { e.preventDefault(); fn(); }); };
    tap('open-awards', open);
    tap('awards-close', close);
    badge();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire);
  else wire();

  // ---- 🔌 the two wrappers, so main.js needs no edits at all --------------
  function hook() {
    if (window.TDGameStats && TDGameStats.finish && !TDGameStats.__awardsWrapped) {
      const original = TDGameStats.finish;
      TDGameStats.finish = function () {
        const out = original.apply(this, arguments);
        try { addGame(); } catch (e) {}
        return out;
      };
      TDGameStats.__awardsWrapped = true;
    }
    // ⚠️ reportResult is the FIRST moment the season table knows it is over —
    // TDGameStats.finish runs earlier in endGame, while the season still thinks
    // there's another week to play. That ordering is why there are two wrappers.
    if (window.TDSeason && TDSeason.reportResult && !TDSeason.__awardsWrapped) {
      const original = TDSeason.reportResult;
      TDSeason.reportResult = function () {
        const out = original.apply(this, arguments);
        try { closeSeason(); } catch (e) {}
        return out;
      };
      TDSeason.__awardsWrapped = true;
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', hook);
  else hook();

  window.TDAwards = {
    open, close, render, badge,
    shelf: () => A.shelf.slice(),
    tally: () => JSON.parse(JSON.stringify(A.tally)),
    pending: () => A.pending,
    _addGame: addGame,
    _closeSeason: closeSeason,
    _ceremony: ceremony,
    _hook: hook,
    _reset: () => { A.tally = {}; A.games = 0; A.shelf = []; A.pending = false; save(); badge(); },
  };
})();
