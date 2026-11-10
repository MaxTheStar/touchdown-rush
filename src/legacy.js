// ============================================================
// TOUCHDOWN FUN — legacy.js: 🏅 LEGACY SCORE (Round 25, pick ⑦)
// ------------------------------------------------------------
// A dynasty tracks titles, but nothing said how good the WHOLE career was. This adds one number to the Trophy Case, built ONLY from things the game already
// saves and exposes: it keeps no tally of its own, so it can never disagree with the screens it is built from, and it needs no save.
//
//     🏆 each Max Bowl title        40
//     🥇 each Hall of Fame entry     12   (dynasty.js)
//     📚 each dynasty season played  10   (dynasty.js history)
//     🎖 each trophy-shelf award      5   (awards.js)
//     🏅 each badge unlocked          3   (achievements.js)
//     📖 each record on the books     2   (records.js: every best that is above zero)
//     🎮 each game finished           1   (the world tracker's game count, capped at 100)
//
//     0–29 ROOKIE · 30–99 STARTER · 100–199 STAR · 200–349 LEGEND · 350+ IMMORTAL
//
// ⚠️ THE GAME COUNT IS CAPPED AT 100 points so a long grind alone can never buy a tier above STAR: titles and the awards carry the top end.
// Nothing is saved. trophy.js's `render()` calls `TDLegacy.paint()`, which draws a card under the four record tiles.
// ============================================================
(function () {
  'use strict';
  const W = { title: 40, hof: 12, season: 10, award: 5, badge: 3, record: 2, game: 1 }, GAME_CAP = 100;
  const TIERS = [[350, 'IMMORTAL', '🌌'], [200, 'LEGEND', '🌟'], [100, 'STAR', '⭐'], [30, 'STARTER', '🎽'], [0, 'ROOKIE', '🌱']];
  const T = window.TDStats ? TDStats.shared : null;
  const num = (f, d) => { try { const v = f(); return isFinite(v) ? +v : d; } catch (e) { return d; } };

  // read everything from the modules that own it
  function inputs() {
    return {
      titles: num(() => T.load('titles', 0), 0),
      hof: num(() => TDDynasty.hof().length, 0),
      seasons: num(() => TDDynasty.history().length, 0),
      awards: num(() => TDAwards.shelf().length, 0),
      badges: num(() => TDAchieve._got().length, 0),
      records: num(() => Object.values(TDRecords.bests()).filter(v => +v > 0).length, 0),
      games: num(() => T.load('games', 0), 0),
    };
  }
  // the score from the inputs (pure)
  function score(i) {
    const parts = {
      titles: i.titles * W.title, hof: i.hof * W.hof, seasons: i.seasons * W.season, awards: i.awards * W.award,
      badges: i.badges * W.badge, records: i.records * W.record, games: Math.min(GAME_CAP, i.games * W.game),
    };
    const total = Object.values(parts).reduce((a, b) => a + b, 0);
    return { total, parts };
  }
  function tier(total) { for (const t of TIERS) if (total >= t[0]) return { min: t[0], name: t[1], ic: t[2] }; return { min: 0, name: 'ROOKIE', ic: '🌱' }; }
  function next(total) { const up = TIERS.slice().reverse().find(t => t[0] > total); return up ? { need: up[0] - total, name: up[1] } : null; }
  function read() { const r = score(inputs()); return Object.assign({ tier: tier(r.total), next: next(r.total) }, r); }

  // a card in the Trophy Case, under the record tiles
  function paint() {
    const recs = document.getElementById('trophy-records'); if (!recs) return;
    let el = document.getElementById('trophy-legacy');
    if (!el) { el = document.createElement('div'); el.id = 'trophy-legacy'; recs.insertAdjacentElement('afterend', el); }
    const r = read();
    const rows = [['🏆 titles', r.parts.titles], ['🥇 hall of fame', r.parts.hof], ['📚 seasons', r.parts.seasons], ['🎖 awards', r.parts.awards],
                  ['🏅 badges', r.parts.badges], ['📖 records', r.parts.records], ['🎮 games', r.parts.games]].filter(x => x[1] > 0);
    el.style.cssText = 'margin:10px 0;padding:12px 14px;border-radius:12px;background:linear-gradient(135deg,#1c2f57,#241a4a);border:2px solid #ffd60a;color:#fff;text-align:center';
    el.innerHTML = `<div style="font-size:12px;letter-spacing:2px;opacity:.8">LEGACY</div><div style="font-size:30px;font-weight:900">${r.tier.ic} ${r.total}</div>` +
      `<div style="font-size:16px;font-weight:bold;color:#ffd60a">${r.tier.name}</div>` +
      `<div style="font-size:12px;opacity:.85;margin-top:4px">${r.next ? r.next.need + ' to ' + r.next.name : 'the top tier'}</div>` +
      (rows.length ? `<div style="font-size:11px;opacity:.7;margin-top:6px">${rows.map(x => x[0] + ' ' + x[1]).join(' · ')}</div>` : '');
  }

  window.TDLegacy = { W, GAME_CAP, TIERS, inputs, score, tier, next, read, paint };
})();
