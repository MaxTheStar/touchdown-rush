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
  // 🧑‍🤝‍🧑 PERSONNEL PACKAGES (personnel.js) — two men who only play when you
  // SEND THEM ON: your tight end (roster slot 4, who never had a spot on the
  // field before 🧱 HEAVY) and the backup receiver who comes off the bench in
  // 🙌 3 WIDE. They are counted like everyone else, but they only get a line
  // on the sheet in a game they actually played — otherwise every box score
  // would carry two "quiet day at the office" rows for men who never came on.
  const EXTRA_SLOTS = [
    { idx: 4,     pos: 'TE', emoji: '🧱', fallback: 'Your Tight End', side: 'off', extra: 'te' },
    { idx: 'sub', pos: 'WR', emoji: '🙌', fallback: 'Your Backup Receiver', side: 'off', extra: 'sub' },
  ];
  const ALL_SLOTS = () => SLOTS.concat(EXTRA_SLOTS, DEF_SLOTS);

  let stats = {};        // slotKey -> the numbers below
  let pendingCatch = -1; // set the moment a pass is caught, used when the play ends
  let defTurn = 0;       // rotates which defender gets credit for a takeaway
  let awarded = null;    // this game's winner (so the Box Score can show it too)
  let game = null;       // 📊 the scoreboard side of things, filled in at the final whistle
  let lastCredit = null; // 📊 the defender credited with THEIR last play (the takeaway goes to him)

  function blank() {
    return { rec: 0, recYds: 0, rush: 0, rushYds: 0, td: 0, fg: 0, longFg: 0,
             takeaway: 0, comp: 0, passYds: 0, passTd: 0,
             // 📊 DEFENSE (v4.23): the 1-player defense sim credits each of THEIR plays to
             // one of your three defenders — see noteDefense() below.
             tkl: 0, sack: 0, tfl: 0, pd: 0, int: 0, ff: 0 };
  }

  // Start (or restart) the book — called from beginGame.
  function newGame() {
    stats = {}; pendingCatch = -1; awarded = null; game = null; lastCredit = null;
    for (const s of ALL_SLOTS()) stats[s.idx] = blank();
  }
  newGame();

  // Your drafted roster, read straight from the save (read-only — we never
  // change it). Falls back to friendly names if there's no roster yet.
  function rosterName(slot) {
    // 🙌 the backup receiver lives on the 🏥 bench, not in the roster — ask
    // personnel.js which man it actually sent on this game.
    if (slot.extra === 'sub') {
      const n = (window.TDPersonnel && TDPersonnel.subName) ? TDPersonnel.subName() : null;
      return n || slot.fallback;
    }
    let roster = null;
    try { roster = T ? T.load('roster', null) : JSON.parse(localStorage.getItem('tdr-roster')); } catch (e) {}
    const p = Array.isArray(roster) ? roster[slot.idx] : null;
    return (p && p.name) ? p.name : slot.fallback;
  }

  // 🧑‍🤝‍🧑 main.js tells us which SPOT on the field had the ball. Usually that
  // spot IS the roster slot — but when a substitute is standing in it
  // (personnel.js), the credit goes to the man who was actually out there.
  function keyOf(idx) {
    const sub = (window.TDPersonnel && TDPersonnel.subAt) ? TDPersonnel.subAt(idx) : null;
    return sub ? sub.key : idx;
  }

  // ---- The hooks main.js calls ------------------------------------------
  function noteCatch(idx) { idx = keyOf(idx); if (stats[idx]) pendingCatch = idx; }   // a pass was caught by this guy

  // A play just ended. `idx` is who had the ball (an offense index, or -1 if it
  // wasn't one of our tracked guys), `gain` is the yards from the line of
  // scrimmage — so a touchdown counts the whole run, and a sack counts negative.
  function play(result, idx, gain) {
    idx = keyOf(idx);
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
    // 📊 In the 1-player defense the man who MADE the play gets the takeaway: the
    // interception is his, and so is the tackle on the 4th-down stop. The old
    // rotation is only the fallback now, for the 2-player live defense where no
    // single play is credited.
    let idx = lastCredit;
    lastCredit = null;
    if (idx == null) { idx = DEF_SLOTS[defTurn % DEF_SLOTS.length].idx; defTurn++; }
    const d = stats[idx]; if (d) d.takeaway++;
  }

  // ---- 📊 THE DEFENSIVE BOX SCORE (Round 15, pick ②) -----------------------
  // The defense used to have ONE number, `takeaway`, handed to your three
  // defenders in turn like a raffle: nobody was ever credited with a sack or a
  // tackle. Now every play THEY run in the defense sim is credited to somebody.
  //
  // WHO IS A WEIGHTED DRAW, NOT A ROTATION, and the weights are football:
  //                 linebacker  corner  safety
  //   a run            55%       15%     30%
  //   a run for a loss 70%       10%     20%
  //   a catch          20%       45%     35%      (somebody tackled the receiver)
  //   a sack           65%       10%     25%
  //   a pass defended  15%       60%     25%
  //   an interception  10%       55%     35%
  // …then nudged by who your men actually are: a 🛡 BRUISER makes more tackles, a
  // 🦅 BALL HAWK more passes defended and picks, a ⚡ PLAYMAKER more sacks and
  // takeaways, and a higher rating makes any man likelier to be the one. So the
  // linebacker you drafted at 84 really does lead the sheet.
  //
  // ⚠️ IT IS A STAT BOOK, NOT A SECOND SIMULATION. Nothing here changes who wins a
  // play — `DefenseSim.play()` already decided that — it only writes down who it
  // was. That is why it cannot disagree with the scoreboard.
  const CREDIT = {            // [LB, CB, S] — rows must each sum to 1
    run:   [0.55, 0.15, 0.30], loss: [0.70, 0.10, 0.20], catch: [0.20, 0.45, 0.35],
    sack:  [0.65, 0.10, 0.25], pd:   [0.15, 0.60, 0.25], int:   [0.10, 0.55, 0.35],
    ff:    [0.50, 0.20, 0.30],
  };
  const TRAIT_NUDGE = {       // trait -> { kind: multiplier }
    'BRUISER':   { run: 1.5, loss: 1.5, catch: 1.3 },
    'BALL HAWK': { pd: 1.8, int: 2.0 },
    'PLAYMAKER': { sack: 1.4, ff: 1.4, int: 1.3, pd: 1.3 },
    'WALL':      { run: 1.4, loss: 1.4, sack: 1.3 },
  };
  const PD_SHARE = 0.55;      // not every incompletion is a defender's doing — some are just missed

  function weightsFor(kind) {
    return DEF_SLOTS.map((slot, i) => {
      let w = CREDIT[kind][i];
      try {
        const tr = window.TDTraits && TDTraits.traitAt ? TDTraits.traitAt(slot.idx) : null;
        if (tr && TRAIT_NUDGE[tr] && TRAIT_NUDGE[tr][kind]) w *= TRAIT_NUDGE[tr][kind];
        const p = window.TDDraft && TDDraft.playerAt ? TDDraft.playerAt(slot.idx) : null;
        if (p && p.ovr) w *= p.ovr / 70;
      } catch (e) {}
      return w;
    });
  }
  // Draw one defender's slot index for a kind of play.
  function whoMade(kind) {
    const w = weightsFor(kind);
    let r = Math.random() * w.reduce((a, b) => a + b, 0);
    for (let i = 0; i < w.length; i++) { r -= w[i]; if (r <= 0) return DEF_SLOTS[i].idx; }
    return DEF_SLOTS[DEF_SLOTS.length - 1].idx;
  }

  // main.js DefenseSim.apply() hands over every play it resolves:
  //   { r: 'gain'|'inc'|'int'|'fum', y: yards, tag: 'sack'|undefined, side: 'pass'|'run' }
  // Returns the slot idx credited (or null — an incompletion nobody caused).
  function noteDefense(p) {
    if (!p) return null;
    let idx = null;
    const give = (kind, fields) => {
      idx = whoMade(kind);
      const d = stats[idx]; if (!d) return;
      for (const f of fields) d[f]++;
    };
    if (p.r === 'int')                    give('int',   ['int']);
    else if (p.r === 'fum')               give('ff',    ['ff']);
    else if (p.tag === 'sack')            give('sack',  ['sack', 'tkl', 'tfl']);   // a sack is also a tackle for loss
    else if (p.r === 'inc') { if (Math.random() < PD_SHARE) give('pd', ['pd']); }
    else if (p.side === 'run') {
      if (p.y < 0)                        give('loss',  ['tkl', 'tfl']);
      else if (p.y === 0)                 give('loss',  ['tkl']);
      else                                give('run',   ['tkl']);
    }
    else                                  give('catch', ['tkl']);                  // a completion was tackled by somebody
    lastCredit = idx;
    return idx;
  }

  // ---- Who was the star? -------------------------------------------------
  // A simple points score: touchdowns and takeaways are worth the most, then
  // yards, catches and field goals. Highest score wins the award.
  function scoreOf(s) {
    return s.td * 60 + s.takeaway * 50 + s.fg * 35 + s.rec * 5
         + s.recYds + s.rushYds + s.passTd * 30 + Math.round(s.passYds * 0.5)
         // 📊 …and a defender can win it now: a sack is worth most, then a forced
         // fumble, a tackle for loss, a pass defended, and a plain tackle. (The
         // takeaway above already pays for an interception or a recovery.)
         + s.sack * 35 + s.ff * 30 + s.tfl * 8 + s.pd * 10 + s.tkl * 4;
  }

  function mvp() {
    let best = null;
    for (const slot of ALL_SLOTS()) {   // 🧱 yes — your tight end can win it
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
    if (s.sack)    bits.push(s.sack + (s.sack === 1 ? ' sack' : ' sacks'));
    if (s.tkl)     bits.push(s.tkl + (s.tkl === 1 ? ' tackle' : ' tackles'));
    if (s.tfl)     bits.push(s.tfl + ' for loss');
    if (s.pd)      bits.push(s.pd + (s.pd === 1 ? ' pass defended' : ' passes defended'));
    if (s.int)     bits.push(s.int + (s.int === 1 ? ' interception' : ' interceptions'));
    if (s.ff)      bits.push(s.ff + (s.ff === 1 ? ' forced fumble' : ' forced fumbles'));
    if (s.takeaway > s.int) bits.push(s.takeaway + (s.takeaway === 1 ? ' takeaway' : ' takeaways'));
    return bits.length ? bits.join('  ·  ') : 'played a solid game';
  }

  // Coins for the award — a little for showing up, more for a big day.
  function bonusFor(b) {
    const yds = b.s.recYds + b.s.rushYds;
    return Math.max(8, Math.min(35, 8 + b.s.td * 6 + b.s.takeaway * 6 + b.s.sack * 3 + Math.floor(yds / 15)));
  }

  // ---- The final whistle: award it (main.js calls this from endGame) ------
  function gameKeyboard(on) { try { window.game.input.keyboard.enabled = on; } catch (e) {} }

  // 📊 Team totals for the Box Score. Note `passYds` is the QB's view of the same
  // yards the receivers gained, so team yards = rushing + receiving (never both).
  function teamTotals() {
    let rushYds = 0, recYds = 0, td = 0, fg = 0, takeaway = 0, rec = 0, rush = 0;
    let sack = 0, tkl = 0, pd = 0;
    for (const slot of ALL_SLOTS()) {   // a substitute's yards are the team's yards too
      const s = stats[slot.idx]; if (!s) continue;
      rushYds += s.rushYds; recYds += s.recYds; td += s.td;
      fg += s.fg; takeaway += s.takeaway; rec += s.rec; rush += s.rush;
      sack += s.sack; tkl += s.tkl; pd += s.pd;
    }
    return { rushYds, recYds, total: rushYds + recYds, td, fg, takeaway, rec, rush, sack, tkl, pd };
  }

  // main.js fills this in at the final whistle so the Box Score has a scoreboard.
  function setGame(info) { game = Object.assign({ when: Date.now() }, info || {}); }

  // The final whistle. `info` is the scoreboard ({my, opp, myAbbr, oppAbbr}) which
  // we keep for the 📊 Box Score — recorded even if nobody earned the star award.
  function finish(info) {
    setGame(info);
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
    noteDefense,                                       // 📊 main.js DefenseSim: who made THEIR play
    finish,                                            // endGame: award the star
    mvp, lineFor, rosterName,                          // handy for the Box Score
    winner: () => awarded,
    game: () => game,          // 📊 the scoreboard (null until a game has finished)
    teamTotals,                // 📊 team-level yardage / TDs / turnovers
    // 📊 the full stat sheet — every tracked player with a name (Box Score uses this)
    // 🧑‍🤝‍🧑 …plus the tight end / backup receiver, but only in a game they played.
    table: () => SLOTS.concat(EXTRA_SLOTS.filter(shown), DEF_SLOTS).map(slot => ({
      pos: slot.pos, emoji: slot.emoji, name: rosterName(slot),
      side: slot.side || (slot.idx <= 3 ? 'off' : 'def'),
      stats: Object.assign({}, stats[slot.idx])
    }))
  };

  // Did this substitute get onto the field this game? He shows if he took a
  // snap (personnel.js knows), or if he has a number to his name anyway.
  function shown(slot) {
    const s = stats[slot.idx];
    if (s && Object.keys(s).some(k => s[k])) return true;
    return !!(window.TDPersonnel && TDPersonnel.played && TDPersonnel.played(slot.extra));
  }
})();
