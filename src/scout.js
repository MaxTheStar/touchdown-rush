// ============================================================
// TOUCHDOWN FUN — scout.js: 📋 SCOUTING REPORT (Round 11, pick ④)
// ------------------------------------------------------------
// Before the kickoff, your coaches hand you a card: here's who you're playing,
// here's what they're good at, here's what they LEAN ON, and here's the one
// thing to watch out for. Read it and you should know whether to expect the
// run or the pass.
//
// ⚠️ THE WHOLE POINT IS THAT THE REPORT IS TRUE. A scouting report that says
// "expect the pass" and then means nothing would be worse than no report at
// all — it would teach Max to ignore his own coaches. So this feature does two
// jobs, and the second one is the important half:
//
//   1. IT TELLS YOU the opponent's run/pass tendency, `passLean()`.
//   2. IT *IS* the opponent's run/pass tendency. main.js asks this same
//      function when the other team calls a play, in BOTH places they can be
//      called:
//        • DefenseSim.play()   — 1-player mode's tap-to-progress drive, which
//          used to throw it on a flat 0.56 for every team in the league
//        • pickRedFormation()  — 2-player mode's live defense, where the look
//          they line up in already leaned run-or-pass (I-FORM = run,
//          SPREAD/TRIPS = pass) but was picked by an even shuffle
//      So the number you read on the card is the number the game rolls against.
//      Same trick as ⭐ traits.js: the flavour was already half-built, it just
//      wasn't wired to anything.
//
// WHERE THE TENDENCY COMES FROM. Not made up, and not random: a team's own
// ⭐ ratings. A club with a monster offense and an ordinary defense throws it
// (Kansas City, 10 off / 7 def); a club built on defense hands it off and lets
// its defense win the game (Seattle, 6 off / 9 def). That is real football
// logic AND it is explainable in one sentence to whoever is reading the card.
// A small fixed-seed wobble off the team's abbreviation gives each club a
// little personality, and because the seed never changes, a team's tendency is
// the same every time you play them — you can actually learn it.
//
// THE LEAGUE AVERAGE IS STILL 0.56, on purpose. That was the old flat number
// for everybody, so spreading teams out around it changes who is dangerous in
// which way without making the league as a whole harder or easier.
//
// Everything else on the card is simply READ, never invented:
//   • the ⭐ ratings are the real TEAM_RATINGS (they already tilt team speed)
//   • the season line is the real standings — season.js plays every other
//     team's games for real, so W/L and points for/against are genuine
//   • the head-to-head line is counted by us, game by game (see `remember`)
//   • their named star is the SAME derived star 📊 League Leaders shows, on
//     purpose — two screens disagreeing about who their best player is would
//     look broken. leaders.js explains why a rival's star has to be derived.
//
// HOW IT HOLDS THE KICKOFF. `pregame()` returns true when it has put the card
// up, and main.js then waits instead of kicking off — G.state is still 'menu'
// at that moment, and update() returns early on 'menu', so the game is fully
// parked with nothing running behind the card. ⚠️ EVERY PATH BACK MUST CALL
// `done` — the 🏈 LET'S PLAY button, the backdrop, and a safety timer — or the
// game would sit on a field that never kicks off. Same discipline as
// 🚩 flag.js, which parks a LIVE game to ask you a question.
//
// Saved in `tdr-scout` = { auto, hist: { ABBR: {g,w,them,you} } } — whether you
// want the card before every game, plus what we've seen of each opponent.
// The card comes up by itself before kickoff; the 🎓 COACHING STAFF screen has
// a 📋 SCOUTING REPORTS button so you can re-read any team any time (and so the
// feature is still reachable if you switch the auto-card off).
// ============================================================
(function () {
  'use strict';

  const T = window.TDStats ? TDStats.shared : null;
  const store = (k, v) => { if (T) T.store(k, v); };
  const load  = (k, f) => (T ? T.load(k, f) : f);
  const $ = id => document.getElementById(id);

  // The flat pass chance every team used to get. Kept as the centre of the
  // range (and as the answer when we have no team to look at) so the league
  // plays exactly as hard as it always did — just not all the same way.
  const NEUTRAL = 0.56;
  const SPREAD  = 0.042;   // how much each point of (offense − defense) tilts it
  const WOBBLE  = 0.05;    // a little fixed personality per club
  const MIN_LEAN = 0.28, MAX_LEAN = 0.78;

  // ---- 💾 what we remember ------------------------------------------------
  let state = (() => {
    const s = load('scout', null) || {};
    const hist = (s.hist && typeof s.hist === 'object') ? s.hist : {};
    return { auto: s.auto !== false, hist };   // the card is ON until you turn it off
  })();
  function save() { store('scout', { auto: state.auto, hist: state.hist }); }

  // ---- a tiny fixed-seed RNG (the same one leaders.js uses) ---------------
  function hashStr(str) {
    let h = 1779033703 ^ str.length;
    for (let i = 0; i < str.length; i++) {
      h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    return h >>> 0;
  }
  // One steady number in 0…1 for a given team — NOT a stream, so asking twice
  // gives the same answer. That is what makes a tendency learnable.
  function seeded(key) { return (hashStr('scout:' + key) % 10000) / 10000; }

  const clamp = (v, lo, hi) => v < lo ? lo : v > hi ? hi : v;

  // A team's ⭐ ratings, through main.js's bridge. 🚚 A renamed team keeps its
  // real ratings (rebrand.js leaves the original code in `ratingKey`), and
  // teamRating already knows that — which is why we ask it instead of guessing.
  function ratingOf(team) {
    if (window.TDGame && TDGame.teamRating) return TDGame.teamRating(team);
    return { off: 5, def: 5, overall: 5, specialty: 'BALANCED' };
  }
  // The key we seed off: the ORIGINAL team code, so renaming your club never
  // changes how a team plays. (Cosmetic edits must stay cosmetic — v1.97.)
  const keyOf = team => (team && (team.ratingKey || team.abbr)) || 'CPU';

  // ============================================================
  // THE ONE NUMBER — how often this opponent throws the ball.
  // main.js asks this on every CPU play, so it has to be cheap and steady:
  // pure arithmetic on their ratings plus a fixed hash. No randomness, no
  // saved state, nothing to drift.
  // ============================================================
  function passLean(team) {
    if (!team) return NEUTRAL;
    const r = ratingOf(team);
    const tilt = (r.off - r.def) * SPREAD;              // offense club? throw it.
    const flavour = (seeded(keyOf(team)) - 0.5) * 2 * WOBBLE;
    return clamp(NEUTRAL + tilt + flavour, MIN_LEAN, MAX_LEAN);
  }

  // Turn that number into words a nine-year-old can act on. ⚠️ SAY IT AS A
  // PERCENTAGE, not as "x times out of 10" — rounding to a whole number in ten
  // made a 48%-pass team read as "about 5 throws in 10", which is exactly the
  // even split the sentence was trying to say it ISN'T.
  function leanWords(lean) {
    const pct = Math.round(lean * 100);
    if (lean >= 0.66) return { tag: 'PASS-FIRST', line: 'They throw it about ' + pct + '% of the time. Expect the ball in the air.' };
    if (lean >= 0.58) return { tag: 'LEANS PASS', line: 'A bit more pass than run — about ' + pct + '% of their plays are throws.' };
    if (lean <= 0.42) return { tag: 'RUN-FIRST',  line: 'They hand it off most of the day — only about ' + pct + '% of their plays are throws.' };
    if (lean <= 0.50) return { tag: 'LEANS RUN',  line: 'A bit more run than pass — about ' + pct + '% of their plays are throws.' };
    return { tag: 'BALANCED', line: 'Just about even at ' + pct + '% throws. They will keep you guessing.' };
  }

  // ---- 🤝 what we've seen of them ourselves ------------------------------
  // Counted by us, game by game, so the head-to-head line is real.
  function seen(abbr) {
    const h = state.hist[abbr];
    return h ? { g: h.g || 0, w: h.w || 0, them: h.them || 0, you: h.you || 0 } : null;
  }
  function remember(g) {
    if (!g || !g.oppAbbr) return;
    // 🎲 A silly house-rules game is not scouting — records.js asks TDHouse the
    // same question before it will save a personal best, and so do we.
    try { if (window.TDHouse && TDHouse.live && TDHouse.live()) return; } catch (e) {}
    // ⏱️ A two-minute drill is one rigged possession and 🌟 the All-Star Game is
    // a showcase — neither tells you anything about how that team plays.
    try {
      const G = window.__td && __td.G;
      if (G && (G.drillGame || G.allStarGame)) return;
    } catch (e) {}
    const h = state.hist[g.oppAbbr] || { g: 0, w: 0, them: 0, you: 0 };
    h.g += 1;
    if ((g.my || 0) > (g.opp || 0)) h.w += 1;
    h.them += (g.opp || 0);
    h.you  += (g.my  || 0);
    state.hist[g.oppAbbr] = h;
    save();
  }

  // ---- 📖 their real season, when there is one ---------------------------
  function seasonLine(abbr) {
    const tbl = (window.TDSeason && TDSeason.table) ? TDSeason.table() : null;
    if (!tbl || !tbl.rec || !tbl.rec[abbr]) return null;
    const r = tbl.rec[abbr];
    const place = (tbl.order || []).indexOf(abbr);
    return {
      w: r.w || 0, l: r.l || 0, pf: r.pf || 0, pa: r.pa || 0,
      place: place >= 0 ? place + 1 : null,
      week: tbl.week, tbl: tbl,
    };
  }

  // Their star, borrowed from 📊 League Leaders so both screens name the same
  // man. Only possible while a season is running — that is where the points
  // those teams have really scored live.
  function theirStar(abbr, sl) {
    if (!sl || !window.TDLeaders || !TDLeaders._rivalStar) return null;
    try {
      const games = Math.max(1, (sl.week || 1) - 1);
      const power = sl.tbl.power ? sl.tbl.power[abbr] : 60;
      const s = TDLeaders._rivalStar(abbr, { pf: sl.pf, pa: sl.pa }, power, games);
      return (s && s.td > 0) ? s : null;
    } catch (e) { return null; }
  }

  // ============================================================
  // BUILDING THE REPORT — one plain object, so it can be checked and drawn
  // separately (and so a test can read the advice without the HTML).
  // ============================================================
  function report(opp, mine) {
    const r = ratingOf(opp), lean = passLean(opp), words = leanWords(lean);
    const abbr = opp ? opp.abbr : 'CPU';
    const sl = seasonLine(abbr);
    const h2h = seen(abbr);

    // 🔍 THE ONE THING TO WATCH. Their best side of the ball, said plainly.
    let watch;
    if (r.off >= 9)      watch = 'That offense is one of the best in the league (' + r.off + '/10). You will have to score to keep up.';
    else if (r.def >= 9) watch = 'That defense is brutal (' + r.def + '/10). Points are going to be hard work today.';
    else if (r.off >= 8) watch = 'A strong offense (' + r.off + '/10) — give them a short field and they will take it.';
    else if (r.def >= 8) watch = 'A strong defense (' + r.def + '/10). Do not expect much to come easy.';
    else if (r.off <= 5) watch = 'Their offense is the weak spot (' + r.off + '/10). Get a lead and they may not catch up.';
    else if (r.def <= 5) watch = 'Their defense is the weak spot (' + r.def + '/10) — go after it early.';
    else                 watch = 'No glaring weakness and no superstar unit either. This one is on you.';
    if (opp && opp.boss) watch = '👑 It is MAXWELL. Maxed out on both sides of the ball, with a superstar free safety. Nobody has a plan for this — good luck.';

    // 🎓 WHAT TO DO ABOUT IT. Two pieces of advice: one for when they have the
    // ball (straight off the tendency, so it is genuinely useful), one for when
    // you do (off their defense rating).
    const onDefense = lean >= 0.62
      ? 'When they have the ball, expect the throw. Hang back a step and watch the deep man — patience is how you get the 🖐 pick.'
      : lean <= 0.46
        ? 'When they have the ball, expect the run. Crowd the line and make them earn every single yard.'
        : 'When they have the ball, they mix it up. Stay square, read it, and do not guess early.';
    const onOffense = r.def >= 8
      ? 'On offense, their defense is stout — take the short stuff, keep the sticks moving, and save 🎩 your trick play for when they cheat up.'
      : r.def <= 5
        ? 'On offense, there are yards out there. Take your shots early while they are still figuring you out.'
        : 'On offense, play your game: mix the run and the pass and they cannot settle on one answer.';

    const star = theirStar(abbr, sl);
    return {
      abbr: abbr, name: opp ? opp.name : 'THE OPPONENT',
      jersey: opp ? opp.jersey : 0x888888, helmet: opp ? opp.helmet : 0x333333,
      off: r.off, def: r.def, overall: r.overall,
      lean: lean, leanTag: words.tag, leanLine: words.line,
      watch: watch, onDefense: onDefense, onOffense: onOffense,
      season: sl, h2h: h2h, star: star,
      mineOff: mine ? ratingOf(mine).off : null,
      mineDef: mine ? ratingOf(mine).def : null,
    };
  }

  // ---- drawing -----------------------------------------------------------
  const hex = n => '#' + ('000000' + (n >>> 0).toString(16)).slice(-6);
  const stars10 = n => { n = clamp(Math.round(n), 0, 10); return '★'.repeat(n) + '☆'.repeat(10 - n); };
  const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  function bar(ic, label, val) {
    return '<div class="sc-rate">' +
      '<div class="sc-rate-ic">' + ic + '</div>' +
      '<div class="sc-rate-nm">' + label + '</div>' +
      '<div class="sc-rate-st">' + stars10(val) + '</div>' +
      '<div class="sc-rate-v">' + val + '</div></div>';
  }

  function reportHTML(rep) {
    // The meter: how far along the RUN → PASS line this team sits. The marker
    // is placed from the same number the game rolls against.
    const pct = Math.round(rep.lean * 100);
    let html =
      '<div class="sc-team">' +
        '<div class="sc-swatch"><i style="background:' + hex(rep.jersey) + '"></i>' +
                              '<i style="background:' + hex(rep.helmet) + '"></i></div>' +
        '<div class="sc-team-ab">' + esc(rep.abbr) + '</div>' +
        '<div class="sc-team-nm">' + esc(rep.name) + '</div>' +
      '</div>' +

      '<div class="sc-sec">⭐ WHAT THEY&rsquo;VE GOT</div>' +
      bar('🏈', 'OFFENSE', rep.off) +
      bar('🛡', 'DEFENSE', rep.def) +

      '<div class="sc-sec">🎯 WHAT THEY LEAN ON</div>' +
      '<div class="sc-meter">' +
        '<div class="sc-meter-bar"><i style="left:' + pct + '%"></i></div>' +
        '<div class="sc-meter-ends"><span>🏃 RUN</span><b>' + esc(rep.leanTag) + '</b><span>PASS 🎯</span></div>' +
      '</div>' +
      '<div class="sc-line">' + esc(rep.leanLine) + '</div>' +

      '<div class="sc-sec">🔍 WATCH OUT FOR</div>' +
      '<div class="sc-line">' + esc(rep.watch) + '</div>';

    if (rep.star) {
      html += '<div class="sc-star">' +
        '<div class="sc-star-nm">' + esc(rep.star.name) + '</div>' +
        '<div class="sc-star-sub">' + esc(rep.star.pos) + ' · ' + rep.star.td + ' TD · ' +
          rep.star.yards + ' yds this season</div></div>';
    }

    if (rep.season) {
      const s = rep.season;
      html += '<div class="sc-sec">📖 THEIR SEASON</div>' +
        '<div class="sc-stats">' +
          '<div><b>' + s.w + '–' + s.l + '</b><span>record</span></div>' +
          '<div><b>' + s.pf + '</b><span>scored</span></div>' +
          '<div><b>' + s.pa + '</b><span>allowed</span></div>' +
          (s.place ? '<div><b>' + s.place + '</b><span>in league</span></div>' : '') +
        '</div>';
    }

    if (rep.h2h && rep.h2h.g > 0) {
      const h = rep.h2h;
      const avgYou = Math.round(h.you / h.g), avgThem = Math.round(h.them / h.g);
      html += '<div class="sc-sec">🤝 YOU AGAINST THEM</div>' +
        '<div class="sc-line">' + h.g + (h.g === 1 ? ' game' : ' games') + ' played · you are <b>' +
          h.w + '–' + (h.g - h.w) + '</b> · the scores average <b>' + avgYou + '–' + avgThem +
          '</b>.</div>';
    }

    html += '<div class="sc-sec">🎓 COACH SAYS</div>' +
      '<div class="sc-coach">' + esc(rep.onDefense) + '</div>' +
      '<div class="sc-coach">' + esc(rep.onOffense) + '</div>';
    return html;
  }

  // ---- the scouting cabinet: every team you have faced -------------------
  function indexHTML() {
    const abbrs = Object.keys(state.hist).filter(a => state.hist[a] && state.hist[a].g > 0);
    if (!abbrs.length) {
      return '<div class="sc-empty">You have not played anybody yet! Your coaches hand you a ' +
        'report on the other team right before every kickoff — and every team you play gets ' +
        'filed here so you can read up on them again.</div>';
    }
    abbrs.sort((a, b) => state.hist[b].g - state.hist[a].g);
    return '<div class="sc-line">Tap a team to read their report again.</div>' +
      abbrs.map(a => {
        const h = state.hist[a];
        return '<div class="sc-row" data-abbr="' + esc(a) + '">' +
          '<div class="sc-row-ab">' + esc(a) + '</div>' +
          '<div class="sc-row-mid"><b>' + h.g + (h.g === 1 ? ' game' : ' games') + '</b>' +
            '<span>you are ' + h.w + '–' + (h.g - h.w) + '</span></div>' +
          '<div class="sc-row-go">📋</div></div>';
      }).join('');
  }

  // ============================================================
  // THE CARD
  // ============================================================
  let pendingDone = null;      // the kickoff we are holding, if any
  let safety = 0;              // the timer that refuses to let us hold it forever
  let mode = 'report';

  function gameKeyboard(on) { try { window.game.input.keyboard.enabled = on; } catch (e) {} }

  function paint(html, opts) {
    const body = $('scout-body'); if (!body) return false;
    body.innerHTML = html;
    const go = $('scout-go');
    if (go) go.style.display = (opts && opts.go) ? 'inline-block' : 'none';
    const tog = $('scout-auto');
    if (tog) {
      tog.style.display = (opts && opts.toggle) ? 'block' : 'none';
      tog.className = 'sc-toggle' + (state.auto ? ' on' : '');
      tog.textContent = '📋 Report before every game: ' + (state.auto ? 'ON' : 'OFF');
    }
    const back = $('scout-back');
    if (back) back.style.display = (opts && opts.back) ? 'inline-block' : 'none';
    const close = $('scout-close');
    if (close) close.style.display = (opts && opts.go) ? 'none' : 'inline-block';
    const sub = $('scout-sub');
    if (sub) sub.textContent = (opts && opts.sub) || '';
    // Tapping a filed team re-opens that team's report.
    body.querySelectorAll('.sc-row').forEach(el => {
      el.addEventListener('pointerdown', e => {
        e.preventDefault();
        showTeam(el.getAttribute('data-abbr'));
      });
    });
    return true;
  }

  function showModal() { const m = $('scout-modal'); if (m) m.style.display = 'flex'; }
  function hideModal() { const m = $('scout-modal'); if (m) m.style.display = 'none'; }

  // The pre-kickoff card. Returns true when it has taken over the kickoff.
  // ⚠️ Whatever happens after a `true`, `done` MUST end up being called.
  function pregame(mine, opp, done) {
    if (!state.auto || !opp || typeof done !== 'function') return false;
    if (!$('scout-modal') || !$('scout-body')) return false;      // no card, no hold
    mode = 'report';
    const rep = report(opp, mine);
    if (!paint(reportHTML(rep), { go: true, toggle: true, sub: 'Your coaches on this week\'s opponent.' })) return false;
    pendingDone = done;
    showModal();
    gameKeyboard(false);       // SPACE must not start a second game behind the card
    // The safety net: if anything at all goes wrong with the buttons, the game
    // kicks off by itself rather than sitting on a field that never starts.
    clearTimeout(safety);
    safety = setTimeout(release, 45000);
    return true;
  }

  // Let the held kickoff go — exactly once, from whichever path gets here first.
  function release() {
    clearTimeout(safety); safety = 0;
    const go = pendingDone; pendingDone = null;
    hideModal();
    gameKeyboard(true);
    if (go) { try { go(); } catch (e) {} }
  }

  // Reading a report from the 🎓 COACHING STAFF screen (no kickoff waiting).
  function showTeam(abbr) {
    const team = (window.TDGame && TDGame.teamByAbbr) ? TDGame.teamByAbbr(abbr) : null;
    if (!team) return;
    mode = 'report';
    paint(reportHTML(report(team, null)), { back: true, sub: 'What we know about ' + abbr + '.' });
    showModal();
  }

  function openIndex() {
    mode = 'index';
    paint(indexHTML(), { toggle: true, sub: 'Every team you have faced.' });
    showModal();
    gameKeyboard(false);
  }

  function close() {
    // If a kickoff is waiting on us, closing means "fine, let's play".
    if (pendingDone) { release(); return; }
    hideModal();
    gameKeyboard(true);
  }

  function toggleAuto() {
    state.auto = !state.auto; save();
    const tog = $('scout-auto');
    if (tog) {
      tog.className = 'sc-toggle' + (state.auto ? ' on' : '');
      tog.textContent = '📋 Report before every game: ' + (state.auto ? 'ON' : 'OFF');
    }
  }

  function wire() {
    const tap = (id, fn) => { const el = $(id); if (el) el.addEventListener('pointerdown', e => { e.preventDefault(); fn(); }); };
    tap('scout-go', release);          // 🏈 LET'S PLAY — the normal way out
    tap('scout-close', close);
    tap('scout-back', openIndex);
    tap('scout-auto', toggleAuto);
    tap('open-scout', openIndex);      // the button in 🎓 COACHING STAFF
    // Tapping the dark backdrop also lets the kickoff go (never traps you).
    const m = $('scout-modal');
    if (m) m.addEventListener('pointerdown', e => { if (e.target === m) { e.preventDefault(); close(); } });

    // 🤝 Count this game against that opponent, by wrapping the call main.js
    // already makes at the final whistle (the injuries.js trick) — so the
    // head-to-head line needs no extra line in endGame.
    if (window.TDGameStats && TDGameStats.finish && !TDGameStats.__scoutWrapped) {
      const original = TDGameStats.finish;
      TDGameStats.finish = function (g) {
        const out = original.apply(this, arguments);
        try { remember(g); } catch (e) {}
        return out;
      };
      TDGameStats.__scoutWrapped = true;
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire);
  else wire();

  window.TDScout = {
    // main.js asks these
    passLean,                 // ← the number the CPU's play call rolls against
    pregame,                  // ← beginGame: show the card, hold the kickoff
    // screens
    openIndex, showTeam, close,
    // handy for checking the numbers
    report, leanWords,
    auto: () => state.auto,
    seen,
    _release: release,
    _remember: remember,
    _reset: () => { state = { auto: true, hist: {} }; save(); },
  };
})();
