// ============================================================
// TOUCHDOWN RUSH — season.js: 🏆 SEASON MODE & THE MAX BOWL
// ------------------------------------------------------------
// Quick Game is ONE game against a random team. SEASON MODE is a whole journey:
// you and 7 other teams make an 8-team LEAGUE. You play a 6-game schedule, and
// every week the OTHER teams' games get "auto-played" for you, so there's a real
// STANDINGS race. The top 4 teams make the PLAYOFFS — a semifinal, then the big
// one: THE MAX BOWL. Win the Max Bowl and you're the champion (a trophy, a big
// coins jackpot, and a shiny gold CHAMPIONS uniform).
//
// This whole file is just bookkeeping + the season screen (a DOM pop-up). It
// NEVER touches the Phaser game directly. When it's time to actually play a game
// it asks main.js (window.TDGame) to start one; when that game ends, main.js
// tells us the score (window.TDSeason.reportResult). Your season saves into the
// browser (localStorage 'tdr-season'), so you can quit and pick right back up.
// ============================================================
(function () {
  const KEY = 'tdr-season';   // where the whole season is saved
  const REG_WEEKS = 6;        // how many regular-season games YOU play
  const LEAGUE = 8;           // teams in the league (you + 7 others)
  const $ = id => document.getElementById(id);

  // S = the whole season, or null if no season is going right now.
  let S = null;

  // ---- Save & load -------------------------------------------------------
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      const s = JSON.parse(raw);
      return (s && s.v === 1) ? s : null;   // ignore anything from an older shape
    } catch (e) { return null; }
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
  function getTitles() { try { return +localStorage.getItem('tdr-titles') || 0; } catch (e) { return 0; } }
  S = load();

  // ---- Tiny helpers ------------------------------------------------------
  const teamName = a => { const t = window.TDGame && TDGame.teamByAbbr(a); return t ? t.name : a; };
  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // Round-robin schedule (the "circle method"): everyone plays everyone once.
  // With 8 teams that's 7 rounds of 4 games each; we use the first 6 as weeks.
  function roundRobin(teams) {
    const n = teams.length, arr = teams.slice(), rounds = [];
    for (let r = 0; r < n - 1; r++) {
      const pairs = [];
      for (let i = 0; i < n / 2; i++) pairs.push([arr[i], arr[n - 1 - i]]);
      rounds.push(pairs);
      arr.splice(1, 0, arr.pop());   // rotate everyone except the first team
    }
    return rounds;
  }

  // Who does `abbr` play in a given week? (scans that week's 4 games)
  function pairFor(week, abbr) {
    const pairs = S.schedule[week - 1] || [];
    for (const [a, b] of pairs) { if (a === abbr) return b; if (b === abbr) return a; }
    return null;
  }

  // ---- Auto-playing the OTHER teams' games -------------------------------
  // A quick pretend game. Stronger teams (higher hidden "power") tend to score
  // more, but there's plenty of luck — upsets happen, just like real football.
  function teamPoints(edge) {
    let pts = 0;
    const chance = Math.max(0.15, Math.min(0.72, 0.42 + edge / 300));   // scoring-chance per drive
    for (let i = 0; i < 6; i++) if (Math.random() < chance) pts += (Math.random() < 0.62 ? 7 : 3);
    return pts;
  }
  function simGame(a, b) {
    let sa = teamPoints(S.power[a] - S.power[b]);
    let sb = teamPoints(S.power[b] - S.power[a]);
    if (sa === sb) {                      // no ties allowed — someone kicks a late field goal
      if (Math.random() < 0.5 + (S.power[a] - S.power[b]) / 200) sa += 3; else sb += 3;
    }
    return { a: sa, b: sb, winner: sa > sb ? a : b };
  }

  // Add one game's result to the standings (wins, losses, points for/against).
  function record(a, b, as, bs) {
    const ra = S.rec[a], rb = S.rec[b];
    ra.pf += as; ra.pa += bs; rb.pf += bs; rb.pa += as;
    if (as > bs) { ra.w++; rb.l++; } else if (bs > as) { rb.w++; ra.l++; }
  }

  // Sort the whole league best-to-worst: most wins, then best point-difference.
  function sortedStandings() {
    return S.league.slice().sort((a, b) => {
      const ra = S.rec[a], rb = S.rec[b];
      if (rb.w !== ra.w) return rb.w - ra.w;
      const da = ra.pf - ra.pa, db = rb.pf - rb.pa;
      if (db !== da) return db - da;
      return rb.pf - ra.pf;
    });
  }

  // ---- Starting a fresh season -------------------------------------------
  function newSeason(youAbbr) {
    if (!youAbbr || !window.TDGame) return;
    const others = shuffle(TDGame.nflAbbrs().filter(a => a !== youAbbr)).slice(0, LEAGUE - 1);
    const league = [youAbbr, ...others];
    const power = {}; league.forEach(a => power[a] = 48 + Math.floor(Math.random() * 25));   // 48–72
    const rec = {}; league.forEach(a => rec[a] = { w: 0, l: 0, pf: 0, pa: 0 });
    S = {
      v: 1, you: youAbbr, league, power, rec,
      schedule: roundRobin(league).slice(0, REG_WEEKS),
      week: 1, phase: 'regular', results: [],
      seeds: null, semi: null, yourSemiOpp: null, yourBowlOpp: null, champion: null
    };
    save();
  }

  // ---- The playoffs ------------------------------------------------------
  // After the 6-game regular season: seed the league, and either put YOU into a
  // semifinal (if you finished top 4) or auto-play the whole bracket without you.
  function startPlayoffs() {
    const order = sortedStandings();
    S.seeds = order;
    S.semi = [[order[0], order[3]], [order[1], order[2]]];   // 1v4 and 2v3
    if (order.slice(0, 4).includes(S.you)) {
      for (const [a, b] of S.semi) {
        if (a === S.you) S.yourSemiOpp = b;
        else if (b === S.you) S.yourSemiOpp = a;
      }
      S.phase = 'semifinal';
    } else {
      // You didn't make it — play out the bracket to crown a champion.
      const w1 = simGame(S.semi[0][0], S.semi[0][1]).winner;
      const w2 = simGame(S.semi[1][0], S.semi[1][1]).winner;
      S.champion = simGame(w1, w2).winner;
      S.phase = 'eliminated';
    }
  }

  // The semifinal that does NOT involve you (auto-played when you win yours).
  function otherSemi() { return S.semi.find(p => p[0] !== S.you && p[1] !== S.you); }

  // Championship payday: a trophy on the shelf, a coins jackpot, and the gold
  // CHAMPIONS uniform added to your collection (it shows up in the team menu).
  function awardChampion() {
    const titles = getTitles() + 1;
    try { localStorage.setItem('tdr-titles', titles); } catch (e) {}
    if (window.TDShop) {
      if (TDShop.earn) TDShop.earn(200);
      if (TDShop.grantUniform) TDShop.grantUniform('CHMP');
    }
  }

  // ---- main.js calls this when a season game finishes --------------------
  function reportResult(yourScore, oppScore) {
    if (!S) return;
    const win = yourScore > oppScore;

    if (S.phase === 'regular') {
      const opp = pairFor(S.week, S.you);
      record(S.you, opp, yourScore, oppScore);
      S.results.push({ week: S.week, opp, ys: yourScore, os: oppScore, win });
      // auto-play the week's OTHER three games for the standings
      for (const [a, b] of S.schedule[S.week - 1]) {
        if (a === S.you || b === S.you) continue;
        const r = simGame(a, b); record(a, b, r.a, r.b);
      }
      S.week++;
      if (S.week > REG_WEEKS) startPlayoffs();

    } else if (S.phase === 'semifinal') {
      if (win) {
        S.yourBowlOpp = simGame(otherSemi()[0], otherSemi()[1]).winner;
        S.phase = 'maxbowl';
      } else {
        // the team that beat you goes on; play out the rest for a champion
        const otherWinner = simGame(otherSemi()[0], otherSemi()[1]).winner;
        S.champion = simGame(S.yourSemiOpp, otherWinner).winner;
        S.phase = 'eliminated';
      }

    } else if (S.phase === 'maxbowl') {
      if (win) { S.phase = 'champion'; S.champion = S.you; awardChampion(); }
      else { S.phase = 'eliminated'; S.champion = S.yourBowlOpp; }
    }
    save();
  }

  // What game does the big PLAY button start next? (null = the season is over)
  function nextGame() {
    if (!S) return null;
    if (S.phase === 'regular') {
      const opp = pairFor(S.week, S.you);
      return opp ? { opp, label: `PLAY WEEK ${S.week} ▶` } : null;
    }
    if (S.phase === 'semifinal') return { opp: S.yourSemiOpp, label: 'PLAY SEMIFINAL ▶' };
    if (S.phase === 'maxbowl')  return { opp: S.yourBowlOpp, label: 'PLAY MAX BOWL 🏆' };
    return null;
  }

  // ============================================================
  // THE SEASON SCREEN (a DOM pop-up — standings, schedule, playoffs)
  // ============================================================
  function titleShelf() {
    const t = getTitles();
    return t > 0 ? `<div class="se-titles">🏆 Championships won: <b>${t}</b></div>` : '';
  }

  function headerHTML() {
    const r = S.rec[S.you];
    const phaseTxt = {
      regular: `Week ${Math.min(S.week, REG_WEEKS)} of ${REG_WEEKS}`,
      semifinal: 'Playoffs · Semifinal', maxbowl: 'Playoffs · Max Bowl',
      champion: 'CHAMPIONS 🏆', eliminated: 'Season over'
    }[S.phase];
    return `<div class="se-head"><b>${teamName(S.you)}</b> · ${r.w}-${r.l} · <span>${phaseTxt}</span></div>`;
  }

  function standingsHTML() {
    const order = S.seeds || sortedStandings();
    const rows = order.map((a, i) => {
      const r = S.rec[a], diff = r.pf - r.pa;
      const me = a === S.you ? ' se-me' : '';
      const line = i === 3 ? ' se-line' : '';   // the top-4 PLAYOFF cutoff line
      return `<tr class="se-row${me}${line}"><td>${i + 1}</td><td class="se-ab">${a}</td>` +
             `<td>${r.w}-${r.l}</td><td>${diff > 0 ? '+' : ''}${diff}</td></tr>`;
    }).join('');
    return `<div class="se-cap">STANDINGS <small>(top 4 make the playoffs)</small></div>` +
           `<table class="se-tab"><tr class="se-h"><td></td><td>TEAM</td><td>W-L</td><td>DIFF</td></tr>${rows}</table>`;
  }

  function scheduleHTML() {
    let chips = '';
    for (let w = 1; w <= REG_WEEKS; w++) {
      const opp = pairFor(w, S.you);
      const res = S.results.find(r => r.week === w);
      let cls = 'se-up', top = 'vs ' + opp, sub = 'WK ' + w;
      if (res) { cls = res.win ? 'se-w' : 'se-l'; top = (res.win ? 'W ' : 'L ') + res.ys + '-' + res.os; sub = 'vs ' + opp; }
      else if (S.phase === 'regular' && w === S.week) { cls = 'se-now'; sub = 'NEXT'; }
      chips += `<div class="se-wk ${cls}"><div class="se-wk-t">${top}</div><div class="se-wk-s">${sub}</div></div>`;
    }
    return `<div class="se-cap">YOUR SCHEDULE</div><div class="se-sched">${chips}</div>`;
  }

  function playoffHTML() {
    if (S.phase === 'regular') return '';
    if (S.phase === 'champion')
      return `<div class="se-champ">🏆🏆🏆<br>${teamName(S.you)} WIN THE MAX BOWL!<br><span>You're the season champions!</span></div>` + titleShelf();
    if (S.phase === 'eliminated')
      return `<div class="se-out">Your season is over — no title this time.<br>🏆 <b>${teamName(S.champion)}</b> won the Max Bowl.</div>` + titleShelf();
    // still alive: semifinal or Max Bowl coming up
    const stage = S.phase === 'maxbowl' ? '🏆 THE MAX BOWL' : 'the SEMIFINAL';
    const opp = S.phase === 'maxbowl' ? S.yourBowlOpp : S.yourSemiOpp;
    const line = S.phase === 'maxbowl' ? 'Win this and you are the CHAMPION!' : 'Win to reach the Max Bowl.';
    return `<div class="se-bracket">You made the PLAYOFFS! Next up: <b>${stage}</b> vs <b>${teamName(opp)}</b>.<br>${line}</div>`;
  }

  function render() {
    const body = $('season-body'), playBtn = $('season-play');
    if (!body || !playBtn) return;

    if (!S) {   // no season going — invite the player to start one
      const you = window.TDGame ? TDGame.currentMenuTeamAbbr() : null;
      body.innerHTML =
        `<div class="se-intro">Start a whole season with <b>${you ? teamName(you) : 'your team'}</b>!<br>` +
        `Play ${REG_WEEKS} games, climb an 8-team league, and win your way to the <b>🏆 MAX BOWL</b>.</div>` +
        titleShelf();
      playBtn.textContent = 'START SEASON';
      return;
    }

    body.innerHTML = headerHTML() + standingsHTML() + scheduleHTML() + playoffHTML();
    const ng = nextGame();
    playBtn.textContent = ng ? ng.label : 'NEW SEASON';
  }

  // ---- Open / close the pop-up, and the big PLAY button ------------------
  function open() {
    S = load();          // reload — reflects the game we just finished
    render();
    const el = $('season-modal'); if (el) el.style.display = 'flex';
  }
  function closeOverlay() { const el = $('season-modal'); if (el) el.style.display = 'none'; }

  function onPlay() {
    // No season, or last one finished → begin a new one with the menu's team.
    if (!S || S.phase === 'champion' || S.phase === 'eliminated') {
      newSeason(window.TDGame ? TDGame.currentMenuTeamAbbr() : null);
      render();
      return;
    }
    const ng = nextGame();
    if (!ng) { render(); return; }
    save();
    closeOverlay();
    if (window.TDSound) TDSound.sting('td');
    TDGame.startSeasonGame(S.you, ng.opp);   // hand off to the real game
  }

  // ---- Hook up the buttons once the page exists --------------------------
  function tap(id, fn) {
    const el = $(id);
    if (el) el.addEventListener('pointerdown', e => { e.preventDefault(); fn(); });
  }
  function wire() { tap('open-season', open); tap('season-play', onPlay); tap('season-close', closeOverlay); }
  if (document.readyState !== 'loading') wire();
  else document.addEventListener('DOMContentLoaded', wire);

  // ---- What the rest of the game may use ---------------------------------
  window.TDSeason = {
    open,                       // show the season screen (main.js after a season game)
    reportResult,               // main.js: here's how your season game ended
    hasSeason: () => !!load()   // is a season in progress?
  };
})();
