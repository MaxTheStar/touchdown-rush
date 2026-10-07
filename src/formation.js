// ============================================================
// TOUCHDOWN FUN — formation.js: 🧠 READ THE FORMATION (Round 15, pick ⑥)
// ------------------------------------------------------------
// Before every snap a real defense looks at how the offense lined up and knows
// a lot before the ball moves: three receivers bunched on one side means a pass,
// two backs behind the quarterback means a run. In the two-player game the red
// team shows a different look every down (spread, trips, I-formation) and a sharp
// defender learns what each one means. In the one-player game you got a map and a
// tap, and no idea how they lined up.
//
// Now the panel shows it: a little diagram of THIS snap's formation, and what it
// usually means. You read it, then you make the call (🔥 blitz kills a run, 👤 man
// smothers a pass) — the thing 📋 the Scouting Report and 🛡️ defensive calls have
// been waiting for. The scouting card tells you what a TEAM does; the formation
// tells you what it is about to do RIGHT NOW.
//
//   🏃 run looks     I-FORM (a back behind a back) · JUMBO (an extra tight end)
//   🎯 pass looks    SPREAD · TRIPS RIGHT · TRIPS LEFT · EMPTY (no back at all)
//
// ⚠️ THE TELL HAS TO BE ABLE TO LIE, OR IT IS NOT A READ, IT IS A SPOILER. Three
// decisive looks in ten are a disguise: they show a run look and throw it
// (play-action) or show a pass look and run it (a draw), and 45% of snaps they
// line up in a SINGLE-BACK look that could be anything. The log says so out
// loud when they lie ("🎭 They showed a RUN look and threw it"), so a bluff teaches
// instead of just costing you.
//
// ⚠️ AND THE FIRST CUT WAS FAR TOO GOOD. With a 20% bluff and no neutral look, a
// player who simply read every snap (man vs a pass look, blitz vs a run look)
// took their scoring from 0.94 to 0.34 points a drive — a 64% cut — because the
// calls have always been strong WHEN THEY MATCH and nobody could ever know. The
// calls were not wrong; knowing the answer was the whole advantage. So the tell
// was made less certain until a perfect reader gets a real edge and not a cheat
// code: at 30% bluff / 45% neutral, reading EVERY snap right takes about a third off
// their scoring (0.98 → ~0.65 points a drive on an average opponent), and a kid who
// is right half the time gets a fraction of that (numbers in DEVLOG v4.27).
//
// ⚠️ IT DOES NOT CHANGE HOW OFTEN THEY THROW. Which play they run (their INTENT)
// is still drawn from the team's real tendency (scout.js `passLean`), exactly as
// before, and the formation is chosen to go with it. So a pass-first team still
// passes as often as the scouting card said it would; this only decides how you get
// to see it coming. (A down-and-distance nudge — nobody runs on 3rd and 12 — is in
// `passIntent`, switched OFF with SITUATION = 0: it raised their scoring by 15%
// because passes carry the big plays, and this pick is about information, not about
// making them better.) main.js's `DefenseSim.play()` asks for the intent via `take()`.
//
// Nothing is saved.
// ============================================================
(function () {
  'use strict';

  const $ = id => document.getElementById(id);
  const clamp = (v, lo, hi) => v < lo ? lo : v > hi ? hi : v;

  let BLUFF = 0.30;          // three decisive looks in ten lie
  let EVEN_SHARE = 0.45;     // nearly half of all snaps come out in a look that tells you nothing
  const SITUATION = 0.0;       // how much the down and distance move the mix (see passIntent)

  // ---- the looks ----------------------------------------------------------------
  // Positions are on a 100 x 34 drawing: the line of scrimmage is y = 13 and the
  // offense is moving UP. ol = the five linemen (always the same), q = quarterback,
  // others = skill players.
  const OL = [34, 42, 50, 58, 66];
  const LOOKS = [
    { id: 'single', name: 'SINGLE-BACK', kind: 'even', q: [50, 18], skill: [[50, 25, 'b'], [74, 13, 'r'], [6, 12, 'r'], [24, 11, 'r'], [94, 12, 'r']] },
    { id: 'iform', name: 'I-FORMATION', kind: 'run',  q: [50, 18], skill: [[50, 23, 'b'], [50, 28, 'b'], [73, 13, 'r'], [6, 12, 'r'], [94, 12, 'r']] },
    { id: 'jumbo', name: 'JUMBO',       kind: 'run',  q: [50, 18], skill: [[44, 23, 'b'], [56, 23, 'b'], [26, 13, 'r'], [74, 13, 'r'], [94, 12, 'r']] },
    { id: 'spread', name: 'SPREAD',     kind: 'pass', q: [50, 23], skill: [[58, 23, 'b'], [6, 12, 'r'], [22, 11, 'r'], [78, 11, 'r'], [94, 12, 'r']] },
    { id: 'tripsr', name: 'TRIPS RIGHT', kind: 'pass', q: [50, 23], skill: [[42, 23, 'b'], [6, 12, 'r'], [74, 11, 'r'], [84, 10, 'r'], [94, 12, 'r']] },
    { id: 'tripsl', name: 'TRIPS LEFT',  kind: 'pass', q: [50, 23], skill: [[58, 23, 'b'], [94, 12, 'r'], [26, 11, 'r'], [16, 10, 'r'], [6, 12, 'r']] },
    { id: 'empty', name: 'EMPTY',       kind: 'pass', q: [50, 23], skill: [[6, 12, 'r'], [20, 11, 'r'], [80, 11, 'r'], [94, 12, 'r'], [70, 14, 'r']] },
  ];
  const byKind = k => LOOKS.filter(l => l.kind === k);
  const EVEN = LOOKS[0];

  // ---- the thinking (pure, so it can be checked without a game) ------------------
  // How likely is the play to be a pass, given the team's tendency and the down?
  // `lean` is the scouting card's number (0..1). The situation moves it the way
  // football does: long yardage throws, short yardage runs.
  function passIntent(lean, down, togo) {
    let p = (lean == null ? 0.56 : lean);
    const t = togo == null ? 10 : togo;
    // ⚠️ 1st and 10 is a NORMAL snap — the long-yardage nudge is for 2nd and 3rd
    // down. (The first cut gave it to 1st and 10 too and the mix came out 76% pass
    // on a snap that should sit at the team's own tendency.)
    if (t >= 10) p += ((down || 1) === 1 ? 0 : 0.20);
    else if (t >= 7) p += 0.12;
    else if (t >= 4) p += 0.03;
    else if (t >= 2) p -= 0.10;
    else p -= 0.25;
    if ((down || 1) >= 3 && t >= 7) p += 0.08;
    return clamp((lean == null ? 0.56 : lean) + (p - (lean == null ? 0.56 : lean)) * SITUATION, 0.08, 0.92);
  }

  // Choose this snap's intent and the look they show. `rnd` is injectable for tests.
  // Returns { look, intent: 'pass'|'run', bluff: bool }.
  function draw(lean, down, togo, rnd, avoidId) {
    rnd = rnd || Math.random;
    const intent = rnd() < passIntent(lean, down, togo) ? 'pass' : 'run';
    // three snaps in ten they line up in a look that could be anything
    if (rnd() < EVEN_SHARE) return { look: EVEN, intent, bluff: false };
    const bluff = rnd() < BLUFF;
    const showKind = bluff ? (intent === 'pass' ? 'run' : 'pass') : intent;
    let pool = byKind(showKind);
    if (pool.length > 1 && avoidId) pool = pool.filter(l => l.id !== avoidId);   // never the same look twice running (when there is a choice)
    const look = pool[Math.floor(rnd() * pool.length)];
    return { look, intent, bluff };
  }

  // ---- state for the snap about to happen ------------------------------------------
  let cur = null;
  let lastId = null;
  function newGame() { cur = null; lastId = null; }

  function oppLean() {
    try { return (window.TDScout && TDScout.passLean) ? TDScout.passLean(__td.G.oppTeam) : null; } catch (e) { return null; }
  }

  // main.js asks ONCE per play. Returns { intent, bluff, look } and clears it, so
  // the next snap gets its own look.
  function take() {
    const c = cur; cur = null;
    return c;
  }

  // The words main.js puts on the front of the play-by-play when they lied.
  function bluffLine(fm) {
    if (!fm || !fm.bluff) return '';
    return fm.intent === 'pass'
      ? '🎭 They showed a <b>RUN</b> look and threw it — play-action! · '
      : '🎭 They showed a <b>PASS</b> look and ran it — a draw! · ';
  }

  // ---- the drawing -------------------------------------------------------------------
  function svg(look) {
    const dot = (p, cls) => '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="2.3" class="fm-' + (cls === 'b' ? 'back' : 'rcv') + '"/>';
    return '<svg viewBox="0 0 100 34" class="fm-svg" role="img" aria-label="' + look.name + '">' +
      '<line x1="0" y1="13" x2="100" y2="13" class="fm-los"/>' +
      OL.map(x => '<rect x="' + (x - 3) + '" y="11" width="6" height="4" rx="1" class="fm-ol"/>').join('') +
      '<circle cx="' + look.q[0] + '" cy="' + look.q[1] + '" r="2.5" class="fm-qb"/>' +
      look.skill.map(p => dot(p, p[2])).join('') +
      '</svg>';
  }

  function ensureRow() {
    let row = $('fm-row');
    if (row) return row;
    const field = document.querySelector('#defense-sim .dsim-field');
    if (!field || !field.parentNode) return null;
    row = document.createElement('div');
    row.id = 'fm-row';
    field.parentNode.insertBefore(row, field.nextSibling);
    row.addEventListener('pointerdown', e => e.stopPropagation());   // reading is not a tap on the play
    return row;
  }

  // main.js calls this every time the panel repaints. ctx = { ending, down, togo }.
  function refresh(ctx) {
    ctx = ctx || {};
    const row = ensureRow(); if (!row) return;
    if (ctx.ending) { cur = null; row.style.display = 'none'; row.innerHTML = ''; return; }
    if (!cur) {
      cur = draw(oppLean(), ctx.down, ctx.togo, null, lastId);
      lastId = cur.look.id;
    }
    row.style.display = 'block';
    const L = cur.look;
    row.innerHTML =
      '<div class="fm-head">👀 THEY LINE UP IN <b>' + L.name + '</b></div>' +
      '<div class="fm-body">' + svg(L) +
        '<div class="fm-says ' + L.kind + '">' + (L.kind === 'pass' ? '🎯 looks like a PASS' : L.kind === 'run' ? '🏃 looks like a RUN' : '🤷 could be either') +
          '<small>' + (L.kind === 'pass' ? 'man coverage smothers throws' : L.kind === 'run' ? 'a blitz stuffs the run' : 'nothing to read — guess, or play it safe') + '</small></div>' +
      '</div>';
  }

  const css = document.createElement('style');
  css.textContent = `
    #fm-row { display: none; margin: 8px 4px 0; text-align: left; }
    .fm-head { font: 800 11px "Arial Black", Arial; color: #9fd8ff; letter-spacing: .04em; text-transform: uppercase; }
    .fm-head b { color: #fff; }
    .fm-body { display: flex; align-items: center; gap: 10px; margin-top: 4px; }
    .fm-svg { flex: 0 0 56%; max-width: 56%; height: auto; background: rgba(255,255,255,0.05); border-radius: 8px; padding: 4px; }
    .fm-los { stroke: rgba(255,214,10,0.55); stroke-width: .6; stroke-dasharray: 2 1.5; }
    .fm-ol { fill: #d7e0ee; }
    .fm-qb { fill: #5db3ff; }
    .fm-back { fill: #ffd60a; }
    .fm-rcv { fill: #ff9b6b; }
    .fm-says { font: 800 12px "Arial Black", Arial; color: #fff; min-width: 0; }
    .fm-says small { display: block; font: 700 10px Arial; opacity: .75; margin-top: 3px; }
    .fm-says.pass { color: #ffb36b; } .fm-says.run { color: #8fe3a3; } .fm-says.even { color: #c6cede; }
  `;
  document.head.appendChild(css);

  window.TDFormation = {
    refresh, take, newGame, bluffLine,
    // pure, for checking the numbers without playing a down
    passIntent, draw, LOOKS,
    _cur: () => cur,
    _tune: (b, e) => { if (b != null) BLUFF = b; if (e != null) EVEN_SHARE = e; return { BLUFF, EVEN_SHARE }; },
  };
})();
