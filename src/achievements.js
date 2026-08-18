// ============================================================
// TOUCHDOWN FUN — achievements.js: 🏅 ACHIEVEMENT BADGES
// ------------------------------------------------------------
// Little surprise pop-ups for the big moments — the first time you throw a
// long bomb for a score, break a tackle, pitch a shutout, or claw all the way
// back from behind. Each one flashes a gold "🏅 UNLOCKED!" ribbon, drops a few
// coins in your pocket, and lights up forever on the Trophy Case badge wall.
//
//   TWO KINDS OF BADGE, ONE SYSTEM —
//     • MILESTONE badges are figured out from your career totals (games
//       played, championships, team level, coins, uniforms). We just glance
//       at what the other files already remember and see which ones are true.
//     • "BIG FIRST" badges happen DURING a play — a 40-yard touchdown, a
//       pick-six, a two-point try. main.js gives us a tiny shout the moment
//       one happens (TDAchieve.td(...), .fg(...), .brokeTackle(), …) and we
//       pop the badge right there on the field.
//
//   NO SPAM FOR OLD PLAYERS — the very first time this runs we quietly mark
//   every milestone you'VE ALREADY earned as "done" WITHOUT the pop-ups or
//   the coins (you earned those long ago). After that, brand-new ones pop for
//   real. So updating the game never dumps a pile of ribbons on your head.
//
// We remember which badges you've unlocked in the same tdr- store as the rest
// of the game (the key is `tdr-ach`). This file OWNS that list; the Trophy Case
// just asks us for it to draw the wall.
//
// main.js & trophy.js talk to us through window.TDAchieve — see the bottom.
// ============================================================
(function () {
  'use strict';

  const T = window.TDStats ? TDStats.shared : null;
  const store = (k, v) => { if (T) T.store(k, v); };
  const load  = (k, f) => (T ? T.load(k, f) : f);
  const $ = id => document.getElementById(id);

  // How long a touchdown / field goal has to be to count as a "big one".
  const LONG_TD = 40;   // yards — a real downtown bomb
  const LONG_FG = 40;   // yards — a long field goal

  // ---- 🏅 Every badge in the game ----------------------------------------
  // `stat` badges carry a little test(g) that reads your career totals.
  // `evt` badges have no test — main.js unlocks them the moment they happen.
  // `coins` is the little reward for earning it the first time.
  const ACH = [
    // ---- Milestones (read from your career totals) ----
    { id: 'first',    icon: '🏈', name: 'First Snap',  need: 'Finish 1 game',           coins: 20, stat: g => g.games   >= 1  },
    { id: 'gamer',    icon: '🎮', name: 'Gamer',       need: 'Finish 10 games',         coins: 25, stat: g => g.games   >= 10 },
    { id: 'vet',      icon: '🎖️', name: 'Veteran',     need: 'Finish 25 games',         coins: 40, stat: g => g.games   >= 25 },
    { id: 'champ',    icon: '🏆', name: 'Champion',    need: 'Win the Max Bowl',        coins: 50, stat: g => g.titles  >= 1  },
    { id: 'dynasty',  icon: '👑', name: 'Dynasty',     need: 'Win 3 Max Bowls',         coins: 75, stat: g => g.titles  >= 3  },
    { id: 'allstar',  icon: '⭐', name: 'All-Star',    need: 'Reach team level 5',      coins: 30, stat: g => g.level   >= 5  },
    { id: 'legend',   icon: '🌟', name: 'Legend',      need: 'Reach team level 10',     coins: 60, stat: g => g.level   >= 10 },
    { id: 'collect',  icon: '🎽', name: 'Collector',   need: 'Own 5 uniforms',          coins: 30, stat: g => g.owned   >= 5  },
    { id: 'money',    icon: '💰', name: 'Moneybags',   need: 'Save up 500 coins',       coins: 25, stat: g => g.coins   >= 500 },
    { id: 'draftace', icon: '🎯', name: 'Draft Ace',   need: 'Earn an A+ draft grade',  coins: 40, stat: g => (g.draftbest || '').charAt(0) === 'A' },
    // ---- "Big first" moments (main.js pops these live) ----
    { id: 'bomb',     icon: '💣', name: 'Downtown',    need: 'Score a 40+ yard TD',     coins: 30, evt: true },
    { id: 'hattrick', icon: '🔥', name: 'Hat Trick',   need: 'Score 3 TDs in one game', coins: 40, evt: true },
    { id: 'picksix',  icon: '🦅', name: 'Pick Six',    need: 'Return a pick for a TD',  coins: 35, evt: true },
    { id: 'longfg',   icon: '🥅', name: 'Long Range',  need: 'Make a 40+ yard field goal', coins: 30, evt: true },
    { id: 'trick',    icon: '🎩', name: 'Trickster',   need: 'Score on a trick play',   coins: 35, evt: true },
    { id: 'twopt',    icon: '✌️', name: 'Two & Through', need: 'Convert a 2-point try',  coins: 25, evt: true },
    { id: 'truck',    icon: '💪', name: 'Truck Stick', need: 'Break a tackle',          coins: 20, evt: true },
    { id: 'shutout',  icon: '🛡️', name: 'Shutout',     need: 'Win without letting them score', coins: 40, evt: true },
    { id: 'blowout',  icon: '💥', name: 'Blowout',     need: 'Win by 21+ points',       coins: 35, evt: true },
    { id: 'comeback', icon: '😤', name: 'Comeback',    need: 'Win after trailing by 10+', coins: 45, evt: true },
  ];
  const byId = id => ACH.find(a => a.id === id) || null;

  // ---- 🧠 What we remember -------------------------------------------------
  //   got = the ids you've unlocked. That's it — everything else is figured
  //   out fresh each time from the other files, so it can never fall out of sync.
  const saved = load('ach', null);
  let state = (saved && Array.isArray(saved.got)) ? saved : { got: [] };
  // If we've never run before, the FIRST check should mark your already-earned
  // milestones silently (no pop-ups, no coins) — you earned them long ago.
  let needSeed = !(saved && Array.isArray(saved.got));
  function save() { store('ach', state); }

  // These reset every game (main.js calls startGame()).
  let tdCount = 0;     // touchdowns YOU'VE scored this game (for the Hat Trick)
  let maxBehind = 0;   // the biggest hole you fell into this game (for the Comeback)

  const has = id => state.got.indexOf(id) >= 0;

  // ---- 📥 Your career totals (all read live from the other files) ---------
  function gather() {
    const level     = window.TDProgress ? TDProgress.level() : 1;
    const coins     = window.TDShop ? TDShop.coins() : 0;
    const games     = load('games', 0);        // finished games (stats.js)
    const titles    = load('titles', 0);       // Max Bowl wins (season.js)
    const draftbest = load('draftbest', '');   // best grade D..A+ (draft.js)
    const unis      = (window.TDShop && TDShop.uniformCatalog) ? TDShop.uniformCatalog() : [];
    const owned     = unis.filter(u => u.owned).length;
    return { level, coins, games, titles, draftbest, owned };
  }

  // ---- 🔓 Unlock one badge -------------------------------------------------
  // Returns true if this was NEW. `silent` skips the pop-up + coins (used for
  // the one-time "you already earned these" seeding).
  function unlock(id, silent) {
    if (has(id)) return false;
    const a = byId(id);
    if (!a) return false;
    state.got.push(id);
    save();
    if (!silent) {
      if (window.TDShop)  TDShop.earn(a.coins);   // 🪙 a little reward for the milestone
      if (window.TDSound) TDSound.sting('td');    // 🎺 a happy little sting
      toast('🏅 ' + a.name + '   ·   +' + a.coins + ' 🪙');
    }
    return true;
  }

  // ---- 🏈 Live shouts from main.js ----------------------------------------
  // A touchdown YOU scored. ctx = { yds, pickSix, trick }.
  function td(ctx) {
    ctx = ctx || {};
    tdCount++;
    if (tdCount >= 3) unlock('hattrick');       // 🔥 three in one game!
    if (ctx.pickSix) { unlock('picksix'); return; }   // 🦅 a returned interception
    if ((ctx.yds || 0) >= LONG_TD) unlock('bomb');    // 💣 a long scoring play
    if (ctx.trick) unlock('trick');             // 🎩 scored off the flea flicker
  }
  function fg(dist)        { if ((dist || 0) >= LONG_FG) unlock('longfg'); }  // 🥅 a long field goal
  function twoPoint()      { unlock('twopt'); }        // ✌️ converted a 2-point try
  function brokeTackle()   { unlock('truck'); }        // 💪 shrugged a defender off
  function oppScored(gap)  { if (gap > maxBehind) maxBehind = gap; }   // remember the biggest hole

  // The game is over — check the "how the whole game went" badges, then
  // refresh the milestones (winning may have leveled you up or won a title).
  function gameOver(ctx) {
    ctx = ctx || {};
    if (ctx.won) {
      if (ctx.opp === 0)            unlock('shutout');   // 🛡️ held them scoreless
      if ((ctx.my - ctx.opp) >= 21) unlock('blowout');   // 💥 won in a rout
      if (maxBehind >= 10)         unlock('comeback');  // 😤 climbed out of a 10+ hole
    }
    stat();
  }

  // ---- ⭐ Check the milestone badges from your career totals ---------------
  function stat() {
    const g = gather();
    const silent = needSeed;   // the very first run marks what you already have, quietly
    ACH.forEach(a => { if (a.stat && a.stat(g)) unlock(a.id, silent); });
    if (needSeed) { needSeed = false; save(); }   // seeding done — save it so we never spam
  }

  // ---- 🖼 The Trophy Case asks us for the whole wall ----------------------
  // Same shape trophy.js already draws: { icon, name, need, got }.
  function listForCase() {
    const g = gather();
    return ACH.map(a => ({
      icon: a.icon, name: a.name, need: a.need,
      got: has(a.id) || (a.stat ? !!a.stat(g) : false),
    }));
  }

  // ---- 🎉 The "badge unlocked!" ribbon during play ------------------------
  // Badges can unlock in bunches (a game-winning play might pop three at once),
  // so we line them up and show them one after another.
  let queue = [], busy = false, tmr = 0;
  function toast(text) {
    queue.push(text);
    if (!busy) nextToast();
  }
  function nextToast() {
    const el = $('ach-toast');
    if (!el || !queue.length) { busy = false; return; }
    busy = true;
    el.textContent = queue.shift();
    el.classList.add('show');
    clearTimeout(tmr);
    tmr = setTimeout(() => {
      el.classList.remove('show');
      setTimeout(nextToast, 340);   // let it slide out before the next slides in
    }, 2100);
  }

  // main.js calls these at the natural moments.
  function startGame() { tdCount = 0; maxBehind = 0; }   // fresh per-game counters
  function onMenu()    { stat(); }                        // check for anything newly earned

  // ---- What the rest of the game may use ----------------------------------
  window.TDAchieve = {
    startGame, onMenu,                                  // lifecycle
    td, fg, twoPoint, brokeTackle, oppScored, gameOver, // live shouts from main.js
    listForCase,                                        // the Trophy Case draws this
    // handy for debugging
    _got: () => state.got.slice(),
  };
})();
