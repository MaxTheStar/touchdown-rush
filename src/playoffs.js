// ============================================================
// TOUCHDOWN FUN — playoffs.js: 🏆 THE PLAYOFF TOURNAMENT
// ------------------------------------------------------------
// Season mode is a long journey (a 6-game schedule, then the Max Bowl). THE
// PLAYOFF TOURNAMENT is the FAST version of that thrill: a 16-team, single-
// elimination bracket you can jump into any time. Win FOUR games in a row —
// Round of 16 → Quarterfinal → Semifinal → THE FINAL — and you lift the trophy.
// Lose even once and you're OUT. That's the whole hook: no second chances, pure
// playoff pressure, and every round the opponent gets a little tougher.
//
// Just like season.js, this file is only BOOKKEEPING + a pop-up screen. It never
// touches the Phaser game. When it's time to actually play a round it asks
// main.js (window.TDGame.startPlayoffGame) to run the game; when that game ends,
// main.js hands the score back (window.TDPlayoffs.reportResult), and we advance
// the bracket (auto-playing everyone else's games) or knock you out. Your run
// saves into the browser (localStorage 'tdr-playoffs'), so you can quit and come
// right back to it — plus we remember your trophies and your best-ever run.
// ============================================================
(function () {
  const KEY = 'tdr-playoffs';           // where the bracket + your trophy shelf live
  const FIELD = 16;                      // teams in the bracket → win 4 rounds to take it all
  const ROUND_NAMES = ['Round of 16', 'Quarterfinal', 'Semifinal', 'THE FINAL'];
  const ROUND_SHORT = ['R16', 'QF', 'SF', 'FINAL'];
  const ROUND_COINS = [10, 15, 20, 0];  // 🪙 for WINNING each round (the Final's prize is the jackpot below)
  const CHAMP_COINS = 150;              // 🏆 lift-the-trophy jackpot
  const $ = id => document.getElementById(id);

  // P = your whole playoff world: trophies won, best run ever, and the CURRENT
  // tournament (P.run), or null if you're not in one right now.
  let P = null;

  // ---- Save & load -------------------------------------------------------
  function blank() { return { v: 1, titles: 0, bestRound: -1, run: null }; }
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return blank();
      const p = JSON.parse(raw);
      if (!p || p.v !== 1) return blank();              // ignore an older shape
      if (typeof p.titles !== 'number') p.titles = 0;    // backfill missing fields
      if (typeof p.bestRound !== 'number') p.bestRound = -1;
      if (p.run === undefined) p.run = null;
      return p;
    } catch (e) { return blank(); }
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(P)); } catch (e) {} }
  P = load();

  // ---- Tiny helpers ------------------------------------------------------
  const teamName = a => { const t = window.TDGame && TDGame.teamByAbbr(a); return t ? t.name : a; };
  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // ---- Auto-playing everyone ELSE's games --------------------------------
  // Your games are real (you play them!). The OTHER matchups in the bracket get
  // a quick pretend game so the rounds fill in around you. Stronger teams (higher
  // hidden "power") tend to win, but there's lots of luck — upsets happen, just
  // like the real playoffs. (Same math as season.js, on purpose.)
  function teamPoints(edge) {
    let pts = 0;
    const chance = Math.max(0.15, Math.min(0.72, 0.42 + edge / 300));
    for (let i = 0; i < 6; i++) if (Math.random() < chance) pts += (Math.random() < 0.62 ? 7 : 3);
    return pts;
  }
  function simWinner(a, b, power) {
    let sa = teamPoints(power[a] - power[b]);
    let sb = teamPoints(power[b] - power[a]);
    if (sa === sb) { if (Math.random() < 0.5) sa += 3; else sb += 3; }   // no ties — a late FG decides it
    return sa > sb ? a : b;
  }
  // Play a whole bracket out to a single champion (used when YOU get knocked out,
  // so we can still crown someone for the trophy line).
  function simOutBracket(field, power) {
    let f = field.slice();
    while (f.length > 1) {
      const next = [];
      for (let i = 0; i < f.length; i += 2) next.push(simWinner(f[i], f[i + 1], power));
      f = next;
    }
    return f[0];
  }

  // ---- Starting a fresh tournament ---------------------------------------
  function newTournament(youAbbr) {
    if (!youAbbr || !window.TDGame) return;
    // 15 random other teams + you = a 16-team field, drawn in a random order
    // (so the bracket is a fresh surprise every time).
    const others = shuffle(TDGame.nflAbbrs().filter(a => a !== youAbbr)).slice(0, FIELD - 1);
    const field = shuffle([youAbbr, ...others]);
    const power = {}; field.forEach(a => power[a] = 48 + Math.floor(Math.random() * 25));   // 48–72
    P.run = {
      you: youAbbr, field, power,
      round: 0, alive: true, champion: null,
      results: [],          // YOUR games so far: {round, opp, ys, os, win}
      flash: null,          // a one-time celebration on the next open: 'advanced' | 'champ' | 'out'
      flashCoins: 0
    };
    save();
  }

  // Your opponent this round = the other team in your bracket "pair" (teams are
  // paired up two-by-two: index 0 vs 1, 2 vs 3, and so on).
  function yourOpp() {
    const r = P.run; if (!r) return null;
    const i = r.field.indexOf(r.you);
    if (i < 0) return null;
    const partner = (i % 2 === 0) ? i + 1 : i - 1;
    return r.field[partner] || null;
  }

  // ---- main.js calls this when YOUR playoff game finishes ----------------
  function reportResult(yourScore, oppScore) {
    const r = P.run; if (!r || !r.alive) return;
    const win = yourScore > oppScore;
    const opp = yourOpp();
    const wonRound = r.round;
    r.results.push({ round: r.round, opp, ys: yourScore, os: oppScore, win });

    // Build the winners of THIS round: your game's real result, everyone else simmed.
    const f = r.field, next = [];
    for (let i = 0; i < f.length; i += 2) {
      if (f[i] === r.you || f[i + 1] === r.you) next.push(win ? r.you : opp);
      else next.push(simWinner(f[i], f[i + 1], r.power));
    }

    if (!win) {
      // 💀 Knocked out. Play the rest of the bracket out so someone still lifts the
      // trophy (bragging rights for whoever beat you).
      r.alive = false;
      r.champion = next.length === 1 ? next[0] : simOutBracket(next, r.power);
      r.flash = 'out'; r.flashCoins = 0;
      if (wonRound > P.bestRound) P.bestRound = wonRound;   // you still reached this round
      save(); return;
    }

    // ✅ You won — pay the round bonus.
    if (window.TDShop && ROUND_COINS[wonRound]) TDShop.earn(ROUND_COINS[wonRound]);

    if (next.length === 1) {
      // 🏆 THE FINAL is won — you're the champion!
      r.champion = r.you; r.alive = false;
      r.flash = 'champ'; r.flashCoins = CHAMP_COINS;
      P.titles++; P.bestRound = 4;                          // 4 = "won it all"
      if (window.TDShop) TDShop.earn(CHAMP_COINS);
      save(); return;
    }

    // ▶ Advance to the next round.
    r.field = next; r.round++;
    r.flash = 'advanced'; r.flashCoins = ROUND_COINS[wonRound];
    if (r.round > P.bestRound) P.bestRound = r.round;
    save();
  }

  // The opponent buff main.js applies during a playoff game: the deeper you go,
  // the tougher it gets (Round of 16 = none, up to +7.5% in THE FINAL). Gentle —
  // a notch below the 👑 Maxwell boss (+10%).
  function roundBuff() {
    const r = P.run ? Math.min(3, P.run.round) : 0;
    return 1 + r * 0.025;   // 1.000, 1.025, 1.050, 1.075
  }

  // Is there a game for you to play right now? (null = nothing to play)
  function nextGame() {
    const r = P.run;
    if (!r || !r.alive || r.champion) return null;
    const opp = yourOpp();
    return opp ? { opp, label: `PLAY ${ROUND_SHORT[r.round]} ▶` } : null;
  }

  // ============================================================
  // THE PLAYOFF SCREEN (a DOM pop-up — your bracket run + trophy shelf)
  // ============================================================
  function bestLine() {
    const parts = [];
    if (P.titles > 0) parts.push(`🏆 Trophies: <b>${P.titles}</b>`);
    if (P.bestRound >= 0) parts.push(`Best run: <b>${P.bestRound >= 4 ? 'CHAMPION 🏆' : ROUND_NAMES[P.bestRound]}</b>`);
    return parts.length ? `<div class="po-best">${parts.join(' &nbsp;·&nbsp; ')}</div>` : '';
  }

  function introHTML(you) {
    return `<div class="po-intro">A <b>16-team single-elimination bracket</b>. Win ` +
      `<b>four games in a row</b> — Round of 16, Quarterfinal, Semifinal, then <b>THE FINAL</b> — ` +
      `to lift the trophy. <b>Lose once and you're out!</b><br><br>You'll play as ` +
      `<b>${you ? teamName(you) : 'your team'}</b>. Everyone else's games play out on their own, ` +
      `so the bracket fills in around you.</div>`;
  }

  function headerHTML() {
    const r = P.run;
    const phase = r.champion === r.you ? 'CHAMPIONS 🏆'
      : !r.alive ? 'Eliminated'
      : `${ROUND_NAMES[r.round]} — win ${4 - r.round} more`;
    const left = r.alive && !r.champion ? ` &nbsp;·&nbsp; ${r.field.length} left` : '';
    return `<div class="po-head"><b>${teamName(r.you)}</b> &nbsp;·&nbsp; <span>${phase}</span>${left}</div>`;
  }

  // The "YOUR RUN" ladder — four rungs, then the trophy on top.
  function pathHTML() {
    const r = P.run;
    let rungs = '';
    for (let rd = 0; rd < 4; rd++) {
      const res = r.results.find(x => x.round === rd);
      let cls, ic, right;
      if (res) {
        cls = res.win ? 'po-w' : 'po-l';
        ic = res.win ? '✅' : '❌';
        right = `${res.win ? 'W' : 'L'} ${res.ys}–${res.os} · ${res.opp}`;
      } else if (r.alive && rd === r.round) {
        cls = 'po-now'; ic = '🏈'; right = `NEXT · vs ${yourOpp() || '?'}`;
      } else {
        cls = 'po-up'; ic = '⚪'; right = r.alive ? '—' : 'out';
      }
      rungs += `<div class="po-rung ${cls}"><span class="po-ic">${ic}</span>` +
               `<span class="po-nm">${ROUND_NAMES[rd]}</span><span class="po-rt">${right}</span></div>`;
    }
    const won = r.champion === r.you;
    rungs += `<div class="po-rung po-trophy${won ? ' got' : ''}"><span class="po-ic">🏆</span>` +
             `<span class="po-nm">CHAMPION</span><span class="po-rt">` +
             `${won ? teamName(r.you) + '!' : (r.alive ? 'win it all' : teamName(r.champion))}</span></div>`;
    return `<div class="po-sec">🪜 Your Run</div><div class="po-ladder">${rungs}</div>`;
  }

  function resultHTML() {
    const r = P.run;
    if (r.champion === r.you)
      return `<div class="po-champ">🏆🏆🏆<br>${teamName(r.you)} ARE CHAMPIONS!<br>` +
             `<span>Four wins, no losses. +${CHAMP_COINS} 🪙 in the bank!</span></div>`;
    if (!r.alive)
      return `<div class="po-out">Knocked out in the <b>${ROUND_NAMES[r.round]}</b>.<br>` +
             `🏆 <b>${teamName(r.champion)}</b> went on to win it. Run it back?</div>`;
    if (r.flash === 'advanced')
      return `<div class="po-flash">✅ YOU ADVANCE!${r.flashCoins ? ` &nbsp;+${r.flashCoins} 🪙` : ''}<br>` +
             `<span>On to the ${ROUND_NAMES[r.round]}.</span></div>`;
    return '';
  }

  function render() {
    const body = $('playoffs-body'), playBtn = $('playoffs-play');
    if (!body || !playBtn) return;
    const r = P.run;

    if (!r) {   // no tournament going — invite the player to start one
      const you = window.TDGame ? TDGame.currentMenuTeamAbbr() : null;
      body.innerHTML = introHTML(you) + bestLine();
      playBtn.textContent = 'START TOURNAMENT';
      return;
    }

    body.innerHTML = resultHTML() + headerHTML() + pathHTML() + bestLine();
    const ng = nextGame();
    playBtn.textContent = ng ? ng.label : 'NEW TOURNAMENT';

    // Consume the one-time flash so the celebration shows exactly once.
    if (r.flash) { r.flash = null; r.flashCoins = 0; save(); }
  }

  // ---- Open / close the pop-up, and the big PLAY button ------------------
  function open() {
    P = load();                                   // reload — reflects the game we just finished
    render();
    const se = $('season-modal'); if (se) se.style.display = 'none';   // don't stack on the Season hub
    const el = $('playoffs-modal'); if (el) el.style.display = 'flex';
  }
  function closeOverlay() { const el = $('playoffs-modal'); if (el) el.style.display = 'none'; }

  function onPlay() {
    // No run, or the last one is finished → start a brand-new tournament and show
    // the bracket (a second tap on PLAY then kicks off your first game).
    if (!P.run || !P.run.alive || P.run.champion) {
      newTournament(window.TDGame ? TDGame.currentMenuTeamAbbr() : null);
      render();
      return;
    }
    const ng = nextGame();
    if (!ng || !ng.opp) { render(); return; }
    save();
    closeOverlay();
    if (window.TDSound) TDSound.sting('td');
    TDGame.startPlayoffGame(P.run.you, ng.opp);   // hand off to the real game
  }

  // ---- Hook up the buttons once the page exists --------------------------
  function tap(id, fn) {
    const el = $(id);
    if (el) el.addEventListener('pointerdown', e => { e.preventDefault(); fn(); });
  }
  function wire() {
    tap('open-playoffs', open);        // the button that lives in the Season hub
    tap('playoffs-play', onPlay);
    tap('playoffs-close', closeOverlay);
  }
  if (document.readyState !== 'loading') wire();
  else document.addEventListener('DOMContentLoaded', wire);

  // ---- What the rest of the game may use ---------------------------------
  window.TDPlayoffs = {
    open,               // show the bracket screen (main.js after a playoff game)
    reportResult,       // main.js: here's how your playoff game ended
    roundBuff           // main.js: how much tougher this round's opponent plays
  };
})();
