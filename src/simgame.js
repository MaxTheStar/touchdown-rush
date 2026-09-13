// ============================================================
// TOUCHDOWN FUN — simgame.js: 🎲 SIM THIS GAME (Round 11, pick ⑤)
// ------------------------------------------------------------
// Some weeks you just want the result. Hand this week's season game to the
// computer, watch the score tick in quarter by quarter, and get on with the
// year. If it's going badly at half time you can grab the headset and play the
// second half yourself.
//
// ⚠️ IT MUST BE THE SAME ENGINE THE REST OF THE LEAGUE USES. season.js already
// plays the other seven teams' games every week, with a hidden power rating and
// a lot of luck. If YOUR simmed games ran on a different engine, your record
// would be measured on a different yardstick than everyone else's in the same
// table — so `TDSeason.simNext()` runs the league's own `simGame()` on your
// fixture and hands the score back WITHOUT recording it. We tick it out, and
// then report it through `TDSeason.reportResult()` — the exact same call a
// really-played game makes, so the standings, the other teams' games, the
// playoffs, 🏅 Awards Night and 📚 Dynasty all carry on knowing nothing about
// this feature at all.
//
// ⚠️ WHAT A SIMMED GAME EARNS — MAX'S CALL, 2026-09-13: **📈 XP ONLY.** The team
// still learns something from a week of football, so the XP is real; but there
// are **no 🪙 coins and no 🔥 win streak**, and still no 🏅 ladder, 📖 records,
// 🎓 coach levels or ⭐ player stats. Otherwise the fastest way to get rich would
// be to never play football, which would be a strange thing for a football game
// to teach. The panel says so out loud before you press the button — a cost you
// find out about afterwards is just a trap.
// ⚠️ AND IF YOU TAKE OVER AT HALF TIME, YOU GET EVERYTHING — coins, XP and the
// streak, exactly like a game you played from the kickoff. Also Max's call, and
// it is the right one: you did play it. That is why `G.simTakeover` no longer
// appears in endGame's guard list at all.
//
// ⚠️ YOU CANNOT SIM A PLAYOFF GAME. The semifinal and the Max Bowl are the two
// games the whole season is for, and they are short work to play. Only the six
// regular-season weeks can be handed over.
//
// 🎮 TAKING OVER AT HALF TIME plays the rest for real from the simmed half-time
// score (main.js's `startSeasonGame` takes a `resume`). `G.simTakeover` still
// flies so the game KNOWS it was half-simmed, and simgame.js still reads it —
// but per Max it no longer costs you anything: a taken-over game counts for the
// coins, the XP and the streak like any other.
//
// The tick-in uses setInterval, not requestAnimationFrame: rAF is paused in a
// background tab, and a scoreboard that stops when you look away is a bug.
// Nothing is saved — the season table is the only record, so there is no second
// copy of the truth to drift. Opened from a button in the 🏆 SEASON hub.
// ============================================================
(function () {
  'use strict';

  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  let plan = null;        // this game's quarters, worked out up front
  let at = 0;             // which quarter we're showing
  let timer = 0;

  // ---- turning a final score into a believable four quarters -------------
  // The league's engine builds a score out of touchdowns (7) and field goals
  // (3), so we take it apart the same way and sprinkle the pieces across the
  // four quarters. Purely for the watching — the total is exactly the score the
  // engine produced, never a point more or less.
  function chunks(total) {
    total = Math.max(0, Math.round(total));
    let sevens = Math.floor(total / 7);
    // step back until whatever is left divides into field goals
    while (sevens >= 0 && (total - sevens * 7) % 3 !== 0) sevens--;
    if (sevens < 0) return total > 0 ? [total] : [];       // safety net, never normally hit
    const out = [];
    for (let i = 0; i < sevens; i++) out.push(7);
    for (let i = 0; i < (total - sevens * 7) / 3; i++) out.push(3);
    return out;
  }
  function spread(total) {
    const q = [0, 0, 0, 0];
    chunks(total).forEach(pts => { q[Math.floor(Math.random() * 4)] += pts; });
    return q;
  }

  const LINES = [
    ['They take the opening kickoff.', 'A quiet first quarter.', 'Feeling each other out.'],
    ['Second quarter — the game opens up.', 'Both sides trading punts and chances.', 'A lively second quarter.'],
    ['Out of the locker room for the third.', 'Third quarter under way.', 'The game turns here.'],
    ['Fourth quarter. Whatever happens, happens now.', 'Final quarter — hold on.', 'Down to the last twelve minutes.'],
  ];
  const pick = a => a[Math.floor(Math.random() * a.length)];

  // ---- the panel ---------------------------------------------------------
  function scoreboard(my, opp, label) {
    const you = plan ? plan.youAbbr : 'YOU', them = plan ? plan.oppAbbr : 'OPP';
    return '<div class="sm-board">' +
      '<div class="sm-side"><b>' + esc(you) + '</b><i>' + my + '</i></div>' +
      '<div class="sm-mid">' + esc(label) + '</div>' +
      '<div class="sm-side"><b>' + esc(them) + '</b><i>' + opp + '</i></div></div>';
  }

  function paintIntro() {
    const body = $('sim-body'); if (!body) return;
    body.innerHTML =
      scoreboard(0, 0, 'KICKOFF') +
      '<div class="sm-note">Hand week ' + plan.week + ' to the computer and watch it play out. ' +
        'You can take over at half time if it is going badly.</div>' +
      '<div class="sm-warn">⚠️ A simmed game gives you <b>📈 XP only</b> &mdash; no 🪙 coins and no ' +
        '🔥 win streak, no ranked stars, no records, and your coaches do not level up. ' +
        '<b>Take over at half time and you get all of it.</b></div>';
    btn('sim-go', '🎲 SIM IT');
    show('sim-take', false); show('sim-keep', false);
    show('sim-go', true); show('sim-close', true);
  }

  function paintQuarter() {
    const body = $('sim-body'); if (!body) return;
    const my = plan.myQ.slice(0, at + 1).reduce((a, b) => a + b, 0);
    const op = plan.opQ.slice(0, at + 1).reduce((a, b) => a + b, 0);
    body.innerHTML =
      scoreboard(my, op, 'END OF Q' + (at + 1)) +
      '<div class="sm-log">' + plan.log.slice(0, at + 1).map(l =>
        '<div class="sm-log-row">' + esc(l) + '</div>').join('') + '</div>';
  }

  function paintHalf() {
    const body = $('sim-body'); if (!body) return;
    const my = plan.myQ[0] + plan.myQ[1], op = plan.opQ[0] + plan.opQ[1];
    body.innerHTML =
      scoreboard(my, op, 'HALF TIME') +
      '<div class="sm-log">' + plan.log.slice(0, 2).map(l =>
        '<div class="sm-log-row">' + esc(l) + '</div>').join('') + '</div>' +
      '<div class="sm-note">' +
        (my > op ? 'You are ahead. Keep the computer on it, or go and finish the job yourself?'
                 : my < op ? 'You are behind. This is the moment to grab the headset.'
                           : 'All square at the half. Sim it out, or take it yourself?') +
      '</div>' +
      '<div class="sm-warn">🎮 Taking over plays the second half for real from ' + my + '–' + op +
        ' &mdash; and because you actually played it, you get the <b>🪙 coins, the 📈 XP and the ' +
        '🔥 win streak</b>, just like any other game.</div>';
    show('sim-go', false);
    show('sim-keep', true); show('sim-take', true); show('sim-close', false);
  }

  function paintFinal() {
    const body = $('sim-body'); if (!body) return;
    const my = plan.my, op = plan.opp;
    const won = my > op;
    body.innerHTML =
      scoreboard(my, op, 'FINAL') +
      '<div class="sm-log">' + plan.log.map(l => '<div class="sm-log-row">' + esc(l) + '</div>').join('') + '</div>' +
      '<div class="sm-final ' + (won ? 'win' : 'loss') + '">' +
        (won ? '✅ You win it ' + my + '–' + op + '.' : '❌ They take it ' + op + '–' + my + '.') +
      '</div>' +
      '<div class="sm-note">Straight into the standings. On to week ' + (plan.week + 1) + '.</div>';
    show('sim-go', false); show('sim-keep', false); show('sim-take', false);
    btnText('sim-close', 'DONE');
    show('sim-close', true);
  }

  function show(id, on) { const el = $(id); if (el) el.style.display = on ? 'inline-block' : 'none'; }
  function btnText(id, t) { const el = $(id); if (el) el.textContent = t; }
  function btn(id, t) { btnText(id, t); }

  // ---- running it --------------------------------------------------------
  function step() {
    at++;
    if (at === 2) { stop(); paintHalf(); return; }        // half time: your call
    if (at >= 4) { stop(); paintFinal(); finish(); return; }
    paintQuarter();
  }
  function stop() { if (timer) { clearInterval(timer); timer = 0; } }
  function run() {
    stop();
    paintQuarter();
    timer = setInterval(step, 1500);
  }

  function start() {
    if (!plan) return;
    at = 0;
    run();
  }
  function keepSimming() {
    if (!plan) return;
    show('sim-keep', false); show('sim-take', false);
    at = 2;
    run();
  }

  // The result goes in through the SAME door a played game uses.
  function finish() {
    if (!plan || plan.reported) return;
    plan.reported = true;
    const won = plan.my > plan.opp;
    if (window.TDSeason && TDSeason.reportResult) TDSeason.reportResult(plan.my, plan.opp);
    // 📈 XP, and ONLY XP (Max, 2026-09-13) — the same numbers endGame banks for
    // a played game. Deliberately NOT TDProgress.claimLevelUps(), because that
    // pays a 🪙 coin bonus: a level earned here gets celebrated and paid at the
    // end of your next REAL game instead, so a sim still never hands out coins.
    if (window.TDProgress && TDProgress.addXP) TDProgress.addXP(won ? 40 : 15);
    // 📚 …and if that finished the season, turn the page, exactly as endGame does.
    if (window.TDDynasty && TDDynasty.check) TDDynasty.check();
  }

  // 🎮 Play the second half yourself, from the simmed half-time score.
  function takeOver() {
    if (!plan || !window.TDGame || !TDGame.startSeasonGame) return;
    const my = plan.myQ[0] + plan.myQ[1], op = plan.opQ[0] + plan.opQ[1];
    stop();
    close();
    const season = $('season-modal'); if (season) season.style.display = 'none';
    TDGame.startSeasonGame(plan.youAbbr, plan.oppAbbr, { my: my, opp: op, quarter: 3 });
    plan = null;                     // this game belongs to the player now
  }

  // ---- opening / closing -------------------------------------------------
  function open() {
    const next = (window.TDSeason && TDSeason.simNext) ? TDSeason.simNext() : null;
    const m = $('sim-modal'); if (!m) return;
    if (!next) {
      const body = $('sim-body');
      if (body) body.innerHTML = '<div class="sm-note">Nothing to sim right now. Start a ' +
        '<b>🏆 SEASON</b> and you can hand any regular-season week to the computer.<br><br>' +
        '⚠️ The <b>semifinal</b> and the <b>Max Bowl</b> can never be simmed — those are the two ' +
        'games the whole season was for, and you play those yourself.</div>';
      show('sim-go', false); show('sim-keep', false); show('sim-take', false);
      btnText('sim-close', 'CLOSE'); show('sim-close', true);
      m.style.display = 'flex';
      gameKeyboard(false);
      return;
    }
    plan = {
      youAbbr: next.you, oppAbbr: next.opp, week: next.week,
      my: next.my, opp: next.oppScore, reported: false,
      myQ: null, opQ: null, log: null,
    };
    // quarters that add up to exactly the engine's score
    plan.myQ = spread(plan.my);
    plan.opQ = spread(plan.opp);
    plan.log = [0, 1, 2, 3].map(i => {
      const m2 = plan.myQ[i], o2 = plan.opQ[i];
      const bits = [];
      if (m2) bits.push(plan.youAbbr + ' +' + m2);
      if (o2) bits.push(plan.oppAbbr + ' +' + o2);
      return 'Q' + (i + 1) + ' · ' + (bits.length ? bits.join(' · ') : 'no score') + ' — ' + pick(LINES[i]);
    });
    at = 0;
    paintIntro();
    m.style.display = 'flex';
    gameKeyboard(false);
  }

  function close() {
    stop();
    const m = $('sim-modal'); if (m) m.style.display = 'none';
    gameKeyboard(true);
    btnText('sim-close', 'CLOSE');
    // ⚠️ Walking away from a finished sim must not lose the result — but walking
    // away BEFORE it finished simply cancels it, and the week is still there to
    // play or sim again.
    if (plan && at >= 4) finish();
    if (plan && plan.reported) plan = null;
  }

  function gameKeyboard(on) { try { window.game.input.keyboard.enabled = on; } catch (e) {} }

  function wire() {
    const tap = (id, fn) => { const el = $(id); if (el) el.addEventListener('pointerdown', e => { e.preventDefault(); fn(); }); };
    tap('open-sim', open);
    tap('sim-go', start);
    tap('sim-keep', keepSimming);
    tap('sim-take', takeOver);
    tap('sim-close', close);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire);
  else wire();

  window.TDSim = {
    open, close,
    // 📖 records.js asks this before saving a personal best; main.js's endGame
    // guard list asks G.simTakeover for the same reason.
    // ⚠️ ONE FLAG, ONE OWNER: this READS main.js's G.simTakeover instead of
    // keeping its own copy. The first cut kept a mirror here, set it in
    // takeOver() and then called startSeasonGame — which runs beginGame, which
    // RESETS the flag — so the mirror was switched off a microsecond after it
    // was switched on and the record-book guard never fired once. A flag that
    // two files both write is a flag that will disagree with itself.
    takeover: () => { try { return !!(window.__td && __td.G && __td.G.simTakeover); } catch (e) { return false; } },
    _chunks: chunks,
    _spread: spread,
    _plan: () => plan,
  };
})();
