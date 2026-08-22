// ============================================================
// TOUCHDOWN FUN — gamestats.js: ⭐ PLAYER OF THE GAME (+ the stat book)
// ------------------------------------------------------------
// Real football keeps STATS — who caught how many passes, who ran for how many
// yards, who scored. This file quietly keeps score of all that while you play,
// and at the final whistle it hands out the ⭐ PLAYER OF THE GAME award: the
// star of YOUR team gets a spotlight, their stat line, and a coin bonus.
//
// It tracks stats for your real drafted players (the ones with names, from MY
// TEAM) by matching each on-field guy to his roster spot:
//   offense[0] = QB   offense[1] = RB   offense[2] = WR1   offense[3] = WR2
// If you've never drafted, it falls back to friendly names like "Your QB".
//
// main.js feeds it with a handful of guarded one-line hooks (a play ended, a
// catch, a made field goal, a takeaway) — it never touches Phaser itself, and
// the whole award screen is plain DOM. Nothing is saved to disk: these are
// THIS game's numbers, fresh every kickoff.
//
// 📊 NOTE FOR LATER: `table()` hands back the full stat sheet, which is exactly
// what the upcoming Box Score feature needs — so the counting lives in one place.
// ============================================================
(function () {
  const T = window.TDStats ? TDStats.shared : null;
  const $ = id => document.getElementById(id);

  // Which roster slot each on-field offense player belongs to, plus the emoji
  // and a friendly fallback name for players who never drafted a team.
  const SLOTS = [
    { idx: 0, pos: 'QB', emoji: '🎯', fallback: 'Your QB' },
    { idx: 1, pos: 'RB', emoji: '🏃', fallback: 'Your Runner' },
    { idx: 2, pos: 'WR', emoji: '🙌', fallback: 'Receiver #1' },
    { idx: 3, pos: 'WR', emoji: '🙌', fallback: 'Receiver #2' },
  ];
  // Defensive starters share the takeaway credit (the defense plays as a unit
  // in the mini-map sim, so we rotate who gets the highlight).
  const DEF_SLOTS = [
    { idx: 5, pos: 'LB', emoji: '🛡', fallback: 'Your Linebacker' },
    { idx: 6, pos: 'CB', emoji: '🦅', fallback: 'Your Corner' },
    { idx: 7, pos: 'S',  emoji: '🚧', fallback: 'Your Safety' },
  ];

  let stats = {};        // slotKey -> the numbers below
  let pendingCatch = -1; // set the moment a pass is caught, used when the play ends
  let defTurn = 0;       // rotates which defender gets credit for a takeaway
  let awarded = null;    // this game's winner (so the Box Score can show it too)

  function blank() {
    return { rec: 0, recYds: 0, rush: 0, rushYds: 0, td: 0, fg: 0, longFg: 0,
             takeaway: 0, comp: 0, passYds: 0, passTd: 0 };
  }

  // Start (or restart) the book — called from beginGame.
  function newGame() {
    stats = {}; pendingCatch = -1; awarded = null;
    for (const s of SLOTS.concat(DEF_SLOTS)) stats[s.idx] = blank();
  }
  newGame();

  // Your drafted roster, read straight from the save (read-only — we never
  // change it). Falls back to friendly names if there's no roster yet.
  function rosterName(slot) {
    let roster = null;
    try { roster = T ? T.load('roster', null) : JSON.parse(localStorage.getItem('tdr-roster')); } catch (e) {}
    const p = Array.isArray(roster) ? roster[slot.idx] : null;
    return (p && p.name) ? p.name : slot.fallback;
  }

  // ---- The hooks main.js calls ------------------------------------------
  function noteCatch(idx) { if (stats[idx]) pendingCatch = idx; }   // a pass was caught by this guy

  // A play just ended. `idx` is who had the ball (an offense index, or -1 if it
  // wasn't one of our tracked guys), `gain` is the yards from the line of
  // scrimmage — so a touchdown counts the whole run, and a sack counts negative.
  function play(result, idx, gain) {
    const yds = Math.round(gain || 0);
    const me = stats[idx];
    if (me) {
      if (pendingCatch === idx) {          // he CAUGHT it — a reception (and a QB completion)
        me.rec++; me.recYds += yds;
        const qb = stats[0];
        if (qb && idx !== 0) {
          qb.comp++; qb.passYds += yds;
          if (result === 'touchdown') qb.passTd++;
        }
      } else if (result !== 'incomplete') {  // he RAN it
        me.rush++; me.rushYds += yds;
      }
      if (result === 'touchdown') me.td++;
    }
    pendingCatch = -1;
  }

  function noteFG(yds) {                    // a made field goal (the kicker is the QB here)
    const k = stats[0]; if (!k) return;
    k.fg++; k.longFg = Math.max(k.longFg, Math.round(yds || 0));
  }

  function noteTakeaway() {                 // your defense got the ball back
    const slot = DEF_SLOTS[defTurn % DEF_SLOTS.length];
    defTurn++;
    const d = stats[slot.idx]; if (d) d.takeaway++;
  }

  // ---- Who was the star? -------------------------------------------------
  // A simple points score: touchdowns and takeaways are worth the most, then
  // yards, catches and field goals. Highest score wins the award.
  function scoreOf(s) {
    return s.td * 60 + s.takeaway * 50 + s.fg * 35 + s.rec * 5
         + s.recYds + s.rushYds + s.passTd * 30 + Math.round(s.passYds * 0.5);
  }

  function mvp() {
    let best = null;
    for (const slot of SLOTS.concat(DEF_SLOTS)) {
      const s = stats[slot.idx]; if (!s) continue;
      const sc = scoreOf(s);
      if (sc <= 0) continue;                       // did nothing — can't be the star
      if (!best || sc > best.score) best = { slot, s, score: sc };
    }
    return best;
  }

  // A readable stat line, e.g. "4 catches · 62 yds · 2 TD".
  function lineFor(slot, s) {
    const bits = [];
    if (slot.pos === 'QB') {
      if (s.comp)    bits.push(s.comp + (s.comp === 1 ? ' completion' : ' completions'));
      if (s.passYds) bits.push(s.passYds + ' pass yds');
      if (s.passTd)  bits.push(s.passTd + ' pass TD');
      if (s.fg)      bits.push(s.fg + ' FG' + (s.longFg ? ' (long ' + s.longFg + ')' : ''));
    }
    if (s.rec)     bits.push(s.rec + (s.rec === 1 ? ' catch' : ' catches'));
    if (s.recYds)  bits.push(s.recYds + ' rec yds');
    if (s.rush)    bits.push(s.rush + (s.rush === 1 ? ' carry' : ' carries'));
    if (s.rushYds) bits.push(s.rushYds + ' rush yds');
    if (s.td)      bits.push(s.td + ' TD');
    if (s.takeaway) bits.push(s.takeaway + (s.takeaway === 1 ? ' takeaway' : ' takeaways'));
    return bits.length ? bits.join('  ·  ') : 'played a solid game';
  }

  // Coins for the award — a little for showing up, more for a big day.
  function bonusFor(b) {
    const yds = b.s.recYds + b.s.rushYds;
    return Math.max(8, Math.min(35, 8 + b.s.td * 6 + b.s.takeaway * 6 + Math.floor(yds / 15)));
  }

  // ---- The final whistle: award it (main.js calls this from endGame) ------
  function gameKeyboard(on) { try { window.game.input.keyboard.enabled = on; } catch (e) {} }

  function finish() {
    const b = mvp();
    if (!b) return 0;                       // nobody did anything — no award this time
    const coins = bonusFor(b);
    if (window.TDShop && TDShop.earn) TDShop.earn(coins);   // paid BEFORE the FINAL screen → lands in the payday
    awarded = { name: rosterName(b.slot), pos: b.slot.pos, emoji: b.slot.emoji, line: lineFor(b.slot, b.s), coins };
    // Let the FINAL score land first, then roll out the spotlight.
    setTimeout(show, 850);
    return coins;
  }

  function show() {
    if (!awarded) return;
    const box = $('mvp-body'); if (!box) return;
    box.innerHTML =
      `<div class="mvp-emoji">${awarded.emoji}</div>` +
      `<div class="mvp-name">${awarded.name}</div>` +
      `<div class="mvp-pos">${awarded.pos}</div>` +
      `<div class="mvp-line">${awarded.line}</div>` +
      `<div class="mvp-coins">🪙 +${awarded.coins} COINS</div>`;
    const el = $('mvp-modal'); if (el) el.style.display = 'flex';
    gameKeyboard(false);        // SPACE shouldn't restart the game behind us
  }

  function closeOverlay() {
    const el = $('mvp-modal'); if (el) el.style.display = 'none';
    gameKeyboard(true);
  }

  function tap(id, fn) { const el = $(id); if (el) el.addEventListener('pointerdown', e => { e.preventDefault(); fn(); }); }
  function wire() { tap('mvp-close', closeOverlay); }
  if (document.readyState !== 'loading') wire();
  else document.addEventListener('DOMContentLoaded', wire);

  // ---- What the rest of the game may use ---------------------------------
  window.TDGameStats = {
    newGame, noteCatch, play, noteFG, noteTakeaway,   // main.js hooks
    finish,                                            // endGame: award the star
    mvp, lineFor, rosterName,                          // handy for the Box Score
    winner: () => awarded,
    // 📊 the full stat sheet — every tracked player with a name (Box Score uses this)
    table: () => SLOTS.concat(DEF_SLOTS).map(slot => ({
      pos: slot.pos, emoji: slot.emoji, name: rosterName(slot),
      side: slot.idx <= 3 ? 'off' : 'def',
      stats: Object.assign({}, stats[slot.idx])
    }))
  };
})();
