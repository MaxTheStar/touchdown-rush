// ============================================================
// TOUCHDOWN FUN — progress.js: 📈 PLAYER PROGRESSION (your team levels up!)
// ------------------------------------------------------------
// The Pro Shop lets you SPEND coins to get better. This file is the other
// half: the more you PLAY, the better your team gets — automatically, for free.
//
//   ⭐ XP — you earn "experience points" for doing stuff in a game:
//        +12 a touchdown, +6 a field goal, +3 an extra point, +8 a takeaway,
//        and a big +40 for WINNING (+15 just for finishing a game).
//
//   🎚 LEVELS — fill the XP bar and your TEAM LEVEL goes up. Early levels
//        come fast (about a game each), then they take a little longer, so
//        there's always a next level to chase.
//
//   💪 THE REWARD — every level makes your team play a tiny bit stronger
//        (main.js reads boost() in beginGame) AND pays a coin bonus. The boost
//        is small and CAPPED on purpose, so your team feels like it's growing
//        without ever turning the game into a walkover. You also earn TITLES
//        as you climb: ROOKIE → STARTER → PRO → ALL-PRO → SUPERSTAR → LEGEND →
//        HALL OF FAME.
//
// It saves your lifetime XP in localStorage (key tdr-xp) through the same
// helpers everything else uses, so your level is still yours tomorrow.
//
// main.js talks to us through window.TDProgress — see the bottom.
// ============================================================
(function () {
  'use strict';

  // Borrow the little localStorage helpers from stats.js (loaded first).
  const T = window.TDStats ? TDStats.shared : null;
  const store = (k, v) => { if (T) T.store(k, v); };
  const load  = (k, f) => (T ? T.load(k, f) : f);
  const $ = id => document.getElementById(id);

  // ---- How much XP it takes to finish a level and reach the next one -------
  // Level 1 → 2 needs 100 XP, 2 → 3 needs 150, 3 → 4 needs 200… it climbs by
  // 50 each time, so higher levels are a bigger deal.
  function xpToClear(level) { return 100 + (level - 1) * 50; }

  // ---- The titles you earn as your team level climbs -----------------------
  // (checked biggest-first, so the highest one you qualify for wins).
  const TITLES = [
    { min: 21, name: 'HALL OF FAME' },
    { min: 16, name: 'LEGEND' },
    { min: 12, name: 'SUPERSTAR' },
    { min: 8,  name: 'ALL-PRO' },
    { min: 5,  name: 'PRO' },
    { min: 3,  name: 'STARTER' },
    { min: 1,  name: 'ROOKIE' },
  ];
  function titleFor(level) {
    return (TITLES.find(t => level >= t.min) || TITLES[TITLES.length - 1]).name;
  }

  // ---- What we remember -----------------------------------------------------
  let xp = load('xp', 0);          // your LIFETIME experience points (never goes down)
  let earnedThisGame = 0;          // XP earned in the current game (for the FINAL screen)
  let levelAtStart = 0;            // your level when this game kicked off (spot a level-up)

  // ---- Turn lifetime XP into a level + how far into that level you are ------
  // We start at level 1 and keep "spending" XP to clear levels until we can't
  // clear another one. Whatever's left over is your progress into this level.
  function derive() {
    let level = 1, remaining = xp;
    while (remaining >= xpToClear(level)) { remaining -= xpToClear(level); level++; }
    return { level, into: remaining, need: xpToClear(level) };
  }
  function level() { return derive().level; }

  // ---- 💪 The team boost main.js applies in beginGame ----------------------
  // Level 1 = 1.0 (no boost — a brand-new team). Every level adds 0.5%, and it
  // CAPS at level 21 (+10%). Small on purpose: a growing edge, not an "I always
  // win" button. main.js multiplies YOUR offense & defense by this (never the
  // opponent's), on top of the ⭐ team ratings.
  function boost() { return 1 + Math.min(level() - 1, 20) * 0.005; }

  // ============================================================
  // ⭐ EARNING XP
  // ============================================================
  // main.js calls this the moment something good happens in a game. It never
  // pops anything up mid-play (that'd be distracting) — it just banks the XP.
  // The celebration + coin bonus happen on the FINAL screen (see claimLevelUps).
  function addXP(n) {
    if (!(n > 0)) return;
    xp += n;
    earnedThisGame += n;
    store('xp', xp);
    render();   // keep the menu bar honest if it happens to be visible
  }

  // Called by beginGame: start a fresh "XP this game" count and remember the
  // level we're starting at, so endGame can tell if we leveled up.
  function startGame() {
    earnedThisGame = 0;
    levelAtStart = level();
  }

  // Called by endGame AFTER the win/lose XP is banked. If the team leveled up
  // this game, it pays a coin bonus (25 per level gained) and returns the NEW
  // level so the FINAL screen can throw a party. Returns 0 if no level-up.
  function claimLevelUps() {
    const now = level();
    const gained = now - levelAtStart;
    levelAtStart = now;                    // don't count these again
    if (gained > 0 && window.TDShop) TDShop.earn(25 * gained);   // 🪙 level-up bonus
    return gained > 0 ? now : 0;
  }

  // ============================================================
  // 🎚 THE MENU BAR (top-left, under the coins — built in index.html)
  // ============================================================
  function render() {
    const bar = $('xp-bar');
    if (!bar) return;
    const s = derive();
    const pct = Math.round((s.into / s.need) * 100);
    const set = (id, txt) => { const el = $(id); if (el) el.textContent = txt; };
    set('xp-badge', 'LVL ' + s.level);
    set('xp-title', titleFor(s.level));
    set('xp-nums', s.into + ' / ' + s.need + ' XP');
    const fill = $('xp-fill');
    if (fill) fill.style.width = pct + '%';
  }

  // main.js calls this every time the team menu appears.
  function onMenu() { render(); }

  // Draw it once as soon as the page is ready, too.
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', render);
  else render();

  // ---- What the rest of the game may use -----------------------------------
  window.TDProgress = {
    addXP, startGame, claimLevelUps,
    boost,                       // read by main.js in beginGame
    level, title: () => titleFor(level()),
    gameXP: () => earnedThisGame,
    onMenu,
  };
})();
