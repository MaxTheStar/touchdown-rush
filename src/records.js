// ============================================================
// TOUCHDOWN FUN — records.js: 📖 THE RECORD BOOK
// ------------------------------------------------------------
// Your own hall of records. Every game we watch for a personal best —
// most points in a game, the longest touchdown, the longest field goal,
// the most TDs in one game, the biggest win — and the moment you beat one,
// a gold "📖 NEW RECORD!" ribbon flashes. Then it lives in the Record Book
// forever, waiting for you to beat it again. Chasing your own best is the
// kind of goal you can always ALMOST reach — so there's always one more game.
//
//   TWO SHELVES —
//     🥇 PERSONAL BESTS — the single-game / single-play records we track
//        ourselves (saved in `tdr-records`). The 🔥 best win streak is read
//        live from streak.js.
//     📊 CAREER — big lifetime numbers we just READ from the other files
//        (games played, team level, Max Bowls, coins, badges). No history to
//        keep, so these are always right.
//
//   NO SPAM — new records are announced AT THE END of the game (not mid-play),
//   a couple at a time, so a monster game doesn't bury you in ribbons.
//
// Opened from the Trophy Case (a "📖 OPEN RECORD BOOK" button). main.js feeds
// us the plays through window.TDRecords — see the bottom.
// ============================================================
(function () {
  'use strict';

  const T = window.TDStats ? TDStats.shared : null;
  const store = (k, v) => { if (T) T.store(k, v); };
  const load  = (k, f) => (T ? T.load(k, f) : f);
  const $ = id => document.getElementById(id);

  // The personal-best records we keep ourselves. `prefix`/`unit` are just for
  // how the number reads (a "+7" win margin, a "62 yd" kick).
  const BESTS = [
    { key: 'pts', ic: '🏈', label: 'Most Points',  prefix: '',  unit: ''    },
    { key: 'mgn', ic: '💥', label: 'Biggest Win',  prefix: '+', unit: ''    },
    { key: 'td',  ic: '🎯', label: 'Longest TD',   prefix: '',  unit: ' yd' },
    { key: 'fg',  ic: '🥅', label: 'Longest FG',   prefix: '',  unit: ' yd' },
    { key: 'tds', ic: '🏆', label: 'Most TDs',     prefix: '',  unit: ''    },
  ];

  let r = load('records', null);
  if (!r || typeof r !== 'object') r = {};
  BESTS.forEach(b => { if (typeof r[b.key] !== 'number') r[b.key] = 0; });
  function save() { store('records', r); }

  let gTDs = 0;        // touchdowns YOU scored this game (for "Most TDs")
  let pending = [];    // records beaten this game — announced when it ends
  let fresh = {};      // keys beaten this game (they glow gold in the book)

  // Beat a record if `value` tops the old one. Returns true if it was new.
  function beat(key, value) {
    if (value > (r[key] || 0)) {
      r[key] = value; save();
      const m = BESTS.find(b => b.key === key);
      pending.push({ label: m.label, text: (m.prefix || '') + value + (m.unit || '') });
      fresh[key] = true;
      return true;
    }
    return false;
  }

  // ---- 🏈 live shouts from main.js ---------------------------------------
  function startGame() { gTDs = 0; pending = []; fresh = {}; }   // fresh per-game
  function td(yds) {
    gTDs++;
    beat('td',  Math.max(0, Math.round(yds || 0)));   // longest scoring play
    beat('tds', gTDs);                                // most TDs in this game
  }
  function fg(dist) { beat('fg', Math.max(0, Math.round(dist || 0))); }
  function gameOver(ctx) {
    ctx = ctx || {};
    beat('pts', ctx.my || 0);
    if (ctx.won) beat('mgn', (ctx.my || 0) - (ctx.opp || 0));
    announce();
  }

  // ---- 📖 the "NEW RECORD!" ribbon (queued, at game's end) ----------------
  let q = [], busy = false, hideTmr = 0, startTmr = 0;
  function announce() {
    if (!pending.length) return;
    // At most three, so a huge game doesn't spam a pile of ribbons.
    q = pending.slice(0, 3).map(p => '📖 NEW RECORD · ' + p.label + ': ' + p.text);
    clearTimeout(startTmr);
    startTmr = setTimeout(() => { if (!busy) next(); }, 1150);
  }
  function next() {
    const el = $('rec-toast');
    if (!el || !q.length) { busy = false; return; }
    busy = true;
    el.textContent = q.shift();
    el.classList.add('show');
    clearTimeout(hideTmr);
    hideTmr = setTimeout(() => { el.classList.remove('show'); setTimeout(next, 320); }, 1900);
  }

  // ---- 📊 career totals (all read live from the other files) --------------
  function career() {
    const games  = load('games', 0);                        // stats.js
    const titles = load('titles', 0);                       // season.js
    const level  = window.TDProgress ? TDProgress.level() : 1;
    const title  = window.TDProgress ? TDProgress.title() : 'LEVEL';
    const coins  = window.TDShop ? TDShop.coins() : 0;
    const list   = (window.TDAchieve && TDAchieve.listForCase) ? TDAchieve.listForCase() : [];
    const badges = list.filter(b => b.got).length;
    const badgeTot = list.length || 20;
    return { games, titles, level, title, coins, badges, badgeTot };
  }

  // ---- 🖼 draw the book ---------------------------------------------------
  function tile(ic, v, l, glow) {
    return `<div class="trec${glow ? ' rec-new' : ''}">` +
           `<div class="trec-ic">${ic}</div><div class="trec-v">${v}</div>` +
           `<div class="trec-l">${l}</div></div>`;
  }
  function render() {
    const bb = $('rec-bests');
    if (bb) {
      let html = BESTS.map(b => {
        const v = r[b.key] || 0;
        const disp = v > 0 ? (b.prefix || '') + v + (b.unit || '') : '—';
        return tile(b.ic, disp, b.label, !!fresh[b.key]);
      }).join('');
      const sb = window.TDStreak ? TDStreak.best() : 0;      // 🔥 from streak.js
      html += tile('🔥', sb > 0 ? '×' + sb : '—', 'Win Streak', false);
      bb.innerHTML = html;
    }
    const cc = $('rec-career');
    if (cc) {
      const c = career();
      cc.innerHTML =
        tile('🎮', c.games, 'Games') +
        tile('📈', 'Lv ' + c.level, c.title || 'LEVEL') +
        tile('🏆', c.titles, 'Max Bowls') +
        tile('🪙', c.coins, 'Coins') +
        tile('🏅', c.badges + '/' + c.badgeTot, 'Badges');
    }
  }

  // ---- pop-up plumbing (same recipe as the Trophy Case) -------------------
  function gameKeyboard(on) { try { window.game.input.keyboard.enabled = on; } catch (e) {} }
  function open()  { const m = $('records-modal'); if (!m) return; gameKeyboard(false); render(); m.style.display = 'flex'; }
  function close() { const m = $('records-modal'); if (m) m.style.display = 'none'; gameKeyboard(true); }

  function onTap(id, fn) { const el = $(id); if (el) el.addEventListener('pointerdown', e => { e.preventDefault(); fn(); }); }
  function wire() { onTap('open-records', open); onTap('records-close', close); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire);
  else wire();

  // ---- what the rest of the game may use ----------------------------------
  window.TDRecords = {
    startGame, td, fg, gameOver,   // live shouts from main.js
    open, close,                   // the Trophy Case opens us
    _bests: () => Object.assign({}, r),
  };
})();
