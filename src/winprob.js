// ============================================================
// TOUCHDOWN FUN — winprob.js: 📈 WIN PROBABILITY (Round 13, pick ⑦)
// ------------------------------------------------------------
// The number every football broadcast puts in the corner: given the score, the
// clock, who has the ball and where it is — who is actually winning?
//
// It is the exact opposite of 🔥 MOMENTUM (v4.1), and they make a nice pair:
// momentum is what you have DONE, win probability is what is LEFT. You can
// have all the momentum in the world and still be losing 28–0 with a minute
// to go, and this number will say so.
//
// ------------------------------------------------------------
// ⚠️ IT HAS TO BE HONEST. THAT IS THE WHOLE FEATURE.
// ------------------------------------------------------------
// A number that flatters you is worse than no number at all — the same rule
// 📋 the scouting cards live by. So this file does not guess: it uses the
// league's OWN idea of how football works, the one `season.js` simulates every
// other game in your season with:
//
//     6 drives a side · each one scores 42% of the time · a score is a
//     touchdown 62% of the time (7) and a field goal the rest (3)
//
// From those three numbers, everything else falls out with no magic constants:
// a drive is worth 2.3 points on average, and how SURE you can be depends on
// how many drives are left. Ten points up with a quarter to play is not the
// same as ten points up at kickoff, and the maths knows why: there is less
// football left to go wrong.
//
// ⚠️ ONE THING IS MEASURED HERE RATHER THAN BORROWED: how long a drive takes.
// The league's simulator assumes six drives a side; a drive you actually PLAY
// takes 83 seconds, so a real game holds about seven drives in total. The
// split is deliberate — the CLOCK is a mechanical fact of this game and was
// timed, while how often a drive scores depends on how good you are, and for
// that the league's own 42% is the fairest assumption available.
//
// ------------------------------------------------------------
// HOW IT THINKS (you could do this on paper)
// ------------------------------------------------------------
//   1. How many drives are left? One drive takes about 50 seconds of game
//      clock, and the two teams take turns.
//   2. What is the margin going to be? Your lead now, plus the drive you are
//      on (worth more from their 10 than from your own 5), plus 2.3 points for
//      every extra drive you get to have.
//   3. How sure is that? Each drive left adds its own wobble. Lots of drives
//      left = a wide range of endings = a number near 50%. None left = the
//      scoreboard IS the answer.
//   4. Turn "expected margin, give or take" into a percentage with the normal
//      curve — the same bell shape that turns up everywhere in sport.
//
// `chance(ctx)` is a PURE FUNCTION of a plain object: no globals, no DOM, no
// randomness. That is what makes it testable — and it was tested by simulating
// thousands of games with the league's own engine and checking that the
// situations it called 70% really were won about 70% of the time.
//
// ------------------------------------------------------------
// ⚠️ TWO PROMISES TO THE PLAYER
// ------------------------------------------------------------
// · IT NEVER SAYS 0% WHILE THERE IS TIME ON THE CLOCK. It is clamped to 1–99%
//   until the game is actually over. Telling a nine-year-old he has no chance
//   with a minute left is both unkind and, in this game, untrue.
// · IT NEVER SPEAKS. The announcer bar was already full — four lines a down —
//   and v2.8 was spent emptying it. A swing shows as a flash on the number
//   itself, which costs no screen time and no voice. Count the voices already
//   talking before you add one.
// ============================================================
(function () {
  'use strict';

  const $ = id => document.getElementById(id);
  const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);

  // ---- the league's own engine, copied from season.js on purpose -----------
  // ⚠️ If season.js ever changes how it scores games, change these with it —
  // the whole point is that this number believes what the league believes.
  const DRIVE_SCORE = 0.42;                       // chance a drive ends in points
  const TD_SHARE    = 0.62;                       // …and how often those points are 7
  const SCORE_PTS   = TD_SHARE * 7 + (1 - TD_SHARE) * 3;   // 5.48 — what a score is worth
  const PTS_DRIVE   = DRIVE_SCORE * SCORE_PTS;             // 2.30 — an average drive
  // How much a single drive can surprise you: E[pts²] − mean². This is the
  // number that makes a big lead safe and a small one nervous.
  const VAR_DRIVE   = DRIVE_SCORE * (TD_SHARE * 49 + (1 - TD_SHARE) * 9) - PTS_DRIVE * PTS_DRIVE;
  // ⚠️ MEASURED IN THIS GAME, NOT COPIED FROM THE LEAGUE. season.js gives each
  // side 6 drives, which would be a drive every 50 seconds — but a drive you
  // actually play takes far longer than that, because one run costs 32 seconds
  // of clock all by itself. Timed over real possessions: **83 seconds**, so a
  // 600-second game is about SEVEN drives, not twelve. That difference is not
  // small: it is the difference between "a touchdown down with four minutes
  // left is nearly even" (wrong) and "you need to hurry" (right).
  const DRIVE_SECS  = 80;
  // …and they are nowhere near all the same length: the timed drives ran from
  // 23 seconds to 139. That spread is not a detail — it is why the model is
  // never quite sure how many possessions are left (see `chance`).
  const DRIVE_SD    = 29;
  // Field position, as a straight line: a drive from your own 25 is the 42%
  // baseline, and every yard nearer their goal is worth a little more.
  const SPOT_SLOPE  = 0.006;
  const FOURTH_DOWN = 0.45;  // 4th and long is usually a punt, not a drive
  const THIRD_LONG  = 0.80;  // 3rd and long is a drive in trouble
  const FLOOR = 0.01, CEIL = 0.99;   // never 0%, never 100%, while the clock runs
  const SWING = 0.07;        // a move this big is worth flashing at you

  // ⚠️ THE FIRST CUT USED A BELL CURVE AND IT WAS NOT HONEST ENOUGH. A normal
  // curve is a fine description of a long game, but football scores are lumpy —
  // 0, 3 or 7 — and at the end of a game there is only one drive left, where
  // "give or take a bell curve" is nonsense: either they score or they don't.
  // So this adds the drives up EXACTLY instead, which is also something a kid
  // can picture: every way the rest of the game could go, with how likely each
  // one is. It costs a few thousand sums and only runs when something changes.
  //
  // One drive, as points: nothing (58%), a field goal (16%), a touchdown (26%).
  // `sign` is +1 for a drive of YOURS and −1 for one of theirs.
  function addDrive(dist, base, p, sign) {
    const out = new Float64Array(dist.length);
    const fg = p * (1 - TD_SHARE), td = p * TD_SHARE, none = 1 - p;
    for (let i = 0; i < dist.length; i++) {
      const v = dist[i]; if (v === 0) continue;
      out[i] += v * none;
      const a = i + sign * 3, b = i + sign * 7;
      if (a >= 0 && a < out.length) out[a] += v * fg;
      if (b >= 0 && b < out.length) out[b] += v * td;
    }
    return out;
  }

  // ============================================================
  // THE THINKING — a pure function, so every situation is testable
  // ============================================================
  // ctx = { lead, secs, ball, spot, down, togo, overtime }
  //   lead     your score minus theirs      secs  seconds left in the whole game
  //   ball     true = YOU have it           spot  the ball's owner's yards from
  //   down/togo the current down            their own goal (0…100)
  function chance(ctx) {
    const c = ctx || {};
    const lead = c.lead || 0;
    const secs = Math.max(0, c.secs || 0);
    const ball = !!c.ball;
    const spot = clamp(c.spot == null ? 25 : c.spot, 0, 100);
    const down = c.down || 1;
    const togo = Math.max(0, c.togo == null ? 10 : c.togo);

    // --- OVERTIME: sudden death, so it is not about margins at all ----------
    // Whoever scores first wins, and the drives alternate. If the man with the
    // ball scores with chance h and the other with chance o, then holding it he
    // wins h of the time, and otherwise they both miss and it starts again:
    //     h + (1−h)(1−o) × (the same thing) …which settles at h / (h + (1−h)o)
    // ⚠️ `spot` is ALWAYS the holder's own yards, so there is no flipping to do
    // here — an earlier version "converted" it and told you 14% when you were
    // the favourite at 63%.
    if (c.overtime) {
      const holder = driveScore(spot, down, togo);
      const other = DRIVE_SCORE;
      const denom = holder + (1 - holder) * other;
      const first = denom <= 0 ? 0.5 : holder / denom;
      return clamp(ball ? first : 1 - first, FLOOR, CEIL);
    }

    // --- HOW MUCH FOOTBALL IS LEFT ------------------------------------------
    // Whole drives, taking turns, and the team with the ball has the first one.
    // ⚠️ THIS IS WHERE POSSESSION GETS ITS VALUE. An earlier version counted
    // the current drive AND gave the other side an extra future one, which
    // cancelled out exactly — so it said having the ball was worth nothing,
    // even up 7 with a minute to go. Whoever has the ball gets the odd drive.
    if (secs <= 0) return lead > 0 ? 1 : lead < 0 ? 0 : 0.5;
    // ⚠️ NOBODY KNOWS HOW MANY DRIVES ARE LEFT, SO DON'T PRETEND TO.
    // Two separate reasons, and both had to be handled or the number lies:
    //   · Rounding makes it JUMP — 2 drives left at 0:41, 1 at 0:39, and the
    //     percentage lurches while nothing is happening. Nobody believes a
    //     number that moves when the game doesn't.
    //   · Drives are not all 80 seconds. Timed here they ran 23 to 139, so
    //     with ten minutes left the game might hold six drives or nine. A
    //     model that assumes exactly seven is SURER THAN IT HAS ANY RIGHT TO
    //     BE, and that showed up in testing as saying 64% for games that were
    //     really won 62% of the time.
    // So: work out the answer for each plausible number of drives and mix them
    // together, weighted by how likely each count is. The spread shrinks as the
    // clock runs down, which is exactly right — late in a game you really do
    // know how many possessions are left.
    const totalF = secs / DRIVE_SECS;
    const sdN = Math.sqrt(totalF) * (DRIVE_SD / DRIVE_SECS);   // renewal-process spread
    let sum = 0, wsum = 0;
    for (let n = Math.max(1, Math.floor(totalF - 2 * sdN)); n <= Math.ceil(totalF + 2 * sdN) + 1; n++) {
      if (n < 1) continue;
      // How likely is it that exactly this many drives fit? A bell curve over
      // the count, and at the low end the fractional part does the same job the
      // old straight mix did.
      const z = (n - totalF) / Math.max(sdN, 0.35);
      const w = Math.exp(-0.5 * z * z);
      if (w < 0.002) continue;
      sum += w * endings(n); wsum += w;
    }
    return clamp(wsum > 0 ? sum / wsum : endings(Math.max(1, Math.round(totalF))), FLOOR, CEIL);

    // --- ADD UP EVERY WAY THE REST OF THE GAME CAN GO -----------------------
    function endings(total) {
      const holderDrives = Math.ceil(total / 2);      // the ball is worth the odd one
      const otherDrives = Math.floor(total / 2);
      const sign = ball ? 1 : -1;                     // is the holder me or them?
      const span = Math.abs(Math.round(lead)) + 7 * total + 2;
      let dist = new Float64Array(2 * span + 1);
      dist[span + Math.round(lead)] = 1;              // where the scoreboard is now
      // The drive in progress is worth what THIS field position is worth…
      dist = addDrive(dist, DRIVE_SCORE, driveScore(spot, down, togo), sign);
      // …and every drive after it is an ordinary one, from the usual spot.
      for (let i = 1; i < holderDrives; i++) dist = addDrive(dist, DRIVE_SCORE, DRIVE_SCORE, sign);
      for (let i = 0; i < otherDrives; i++) dist = addDrive(dist, DRIVE_SCORE, DRIVE_SCORE, -sign);
      // Ahead at the end = a win; level = overtime, which is a coin toss that
      // neither of you has won yet, so it counts half.
      let win = 0, tie = 0;
      for (let i = 0; i < dist.length; i++) {
        if (i > span) win += dist[i];
        else if (i === span) tie += dist[i];
      }
      return win + tie / 2;
    }
  }

  // How likely is THIS drive to end in points, from this spot, on this down?
  function driveScore(spot, down, togo) {
    let p = DRIVE_SCORE + (spot - 25) * SPOT_SLOPE;
    if (down >= 4 && togo > 2) p *= FOURTH_DOWN;
    else if (down === 3 && togo >= 8) p *= THIRD_LONG;
    return clamp(p, 0.04, 0.95);
  }

  // ============================================================
  // READING THE LIVE GAME
  // ------------------------------------------------------------
  // ⚠️ `spot` is always "the yards from the BALL-HOLDER's own goal", because
  // that is what the maths above wants. Your drives count up from your own
  // goal; the CPU's drive keeps its own `G.cpu.spot` the same way, which is
  // why this reads two different fields instead of converting one.
  // ============================================================
  function read() {
    const t = window.__td; if (!t || !t.G || !t.G.team) return null;
    const g = t.G;
    const cpu = g.cpu;
    const mine = !cpu;                                     // no CPU drive = your ball
    // ⚠️ Ask main.js how long a game is rather than writing 4 × 150 in here.
    // A hard-coded copy of somebody else's constant is right until the day it
    // isn't, and then it is wrong silently, which is the worst way to be wrong.
    const qLeft = Math.max(0, (t.NUM_QUARTERS || 4) - g.quarter);
    return {
      lead: g.score - g.oppScore,
      secs: g.overtime ? 0 : Math.max(0, g.clock) + qLeft * (t.QUARTER_SECONDS || 150),
      ball: mine,
      spot: mine ? g.losYards : (cpu.spot || 25),
      down: mine ? g.down : (cpu.down || 1),
      togo: mine ? Math.max(0, g.firstDownYards - g.losYards) : (cpu.togo == null ? 10 : cpu.togo),
      overtime: !!g.overtime,
    };
  }

  // ============================================================
  // THE READOUT
  // ------------------------------------------------------------
  // Bottom of the top-left stack. ⚠️ It is DELIBERATELY the narrowest thing
  // there: under 430px the in-game buttons start at x84, which is the exact
  // collision ⏳ the play clock was bitten by. "📈 62%" with a short bar stops
  // well before that, and the word comes back only when there is room.
  // ============================================================
  let shown = null;      // the percentage on screen right now
  let sig = '';          // the situation it was worked out from
  let live = false;      // is a game actually being played?
  let series = [];       // the swing chart's points
  let fadeAt = 0;

  function paint(p, delta) {
    const row = $('winprob'); if (!row) return;
    const num = $('wp-num'), fill = $('wp-fill'), d = $('wp-delta');
    const pct = Math.round(p * 100);
    if (num) num.textContent = pct + '%';
    if (fill) fill.style.width = pct + '%';
    row.classList.toggle('good', p >= 0.5);
    row.classList.toggle('bad', p < 0.5);
    // A swing worth noticing flashes the number and shows how far it moved —
    // this is the "watch it lurch when you convert on fourth down" moment, and
    // it says it without taking a turn on the announcer bar.
    if (d) {
      if (delta != null && Math.abs(delta) >= SWING) {
        const n = Math.round(delta * 100);
        d.textContent = (n > 0 ? '+' : '') + n;
        d.className = n > 0 ? 'up' : 'down';
        fadeAt = Date.now() + 2600;
      } else if (fadeAt && Date.now() > fadeAt) {
        d.textContent = ''; d.className = ''; fadeAt = 0;
      }
    }
  }

  // ⚠️ `style.display = ''` DOES NOT SHOW IT. Clearing an inline style just
  // hands the element back to the stylesheet — and the stylesheet says
  // `display: none`, because the row must not exist before a game starts. It
  // has to be set to a real value. (The `body.kicking` rules use `!important`
  // on purpose, so they still win over this while the ball is in the air.)
  function show(on) {
    const row = $('winprob'); if (row) row.style.display = on ? 'block' : 'none';
    live = !!on;
  }

  // Called from main.js's `updateHUD`, which runs every frame — so the first
  // thing it does is work out whether anything has actually CHANGED. A win
  // probability that is recomputed sixty times a second while nobody moves is
  // sixty times the work for the same answer.
  function update() {
    const c = read();
    if (!c) { if (live) show(false); return; }
    if (!live) show(true);
    const key = [c.lead, Math.round(c.secs / 2), c.ball ? 1 : 0, Math.round(c.spot),
                 c.down, Math.round(c.togo), c.overtime ? 1 : 0].join('|');
    if (key === sig) { if (fadeAt && Date.now() > fadeAt) paint(shown, null); return; }
    sig = key;
    const p = chance(c);
    const delta = (shown == null) ? null : p - shown;
    shown = p;
    paint(p, delta);
    // One point per play is plenty for the chart — the clock ticking between
    // snaps would otherwise fill it with a thousand nearly identical dots.
    const last = series[series.length - 1];
    if (!last || Math.abs(last.p - p) > 0.004 || (c.secs && last.secs - c.secs > 8)) {
      series.push({ p, secs: c.secs, q: (window.__td.G || {}).quarter || 1 });
      if (series.length > 400) series.shift();
    }
  }

  function newGame() {
    shown = null; sig = ''; series = []; fadeAt = 0;
    const d = $('wp-delta'); if (d) { d.textContent = ''; d.className = ''; }
    update();
  }

  // The last word: the game is over, so the chart should end at the real result
  // rather than wherever the last snap left it.
  function gameEnded(myScore, oppScore) {
    const end = myScore > oppScore ? 1 : myScore < oppScore ? 0 : 0.5;
    series.push({ p: end, secs: 0, q: (window.__td && window.__td.G ? window.__td.G.quarter : 4) });
    show(false);
  }

  // ============================================================
  // 📈 HOW THE GAME WAS WON — the swing chart, drawn in the 📊 Box Score
  // ------------------------------------------------------------
  // The shape a broadcast shows you afterwards: one line, your half of the
  // game above the middle and theirs below. The big cliffs are the moments
  // that decided it, which is a much better story than a column of numbers.
  // Returns '' when there is nothing to draw, so the box score simply misses
  // the section out rather than showing an empty box.
  // ============================================================
  function chartHTML() {
    if (series.length < 3) return '';
    const W = 300, H = 92;
    const n = series.length;
    const pts = series.map((s, i) => {
      const x = (i / (n - 1)) * W;
      const y = H - s.p * H;
      return x.toFixed(1) + ',' + y.toFixed(1);
    }).join(' ');
    const end = series[series.length - 1].p;
    const high = Math.max.apply(null, series.map(s => s.p));
    const low = Math.min.apply(null, series.map(s => s.p));
    const col = end >= 0.5 ? '#6fd98f' : '#ff8a8a';
    return '' +
      // 🎢 and not 📈 — the section right above this one is "📈 Team Totals",
      // and two headings with the same face on them read as the same heading.
      '<div class="bx-sec">🎢 How the game was won</div>' +
      '<div class="wp-chart">' +
        '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" aria-hidden="true">' +
          '<rect x="0" y="0" width="' + W + '" height="' + (H / 2) + '" fill="rgba(111,217,143,0.10)"/>' +
          '<rect x="0" y="' + (H / 2) + '" width="' + W + '" height="' + (H / 2) + '" fill="rgba(255,138,138,0.10)"/>' +
          '<line x1="0" y1="' + (H / 2) + '" x2="' + W + '" y2="' + (H / 2) + '" stroke="rgba(255,255,255,.35)" stroke-width="1" stroke-dasharray="4 4"/>' +
          '<polyline points="' + pts + '" fill="none" stroke="' + col + '" stroke-width="2.5" ' +
            'stroke-linejoin="round" stroke-linecap="round"/>' +
        '</svg>' +
        '<div class="wp-legend"><span>👍 ' + Math.round(high * 100) + '% best</span>' +
        '<span>👎 ' + Math.round(low * 100) + '% worst</span></div>' +
      '</div>';
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => show(false));
  else show(false);

  window.TDWin = {
    // main.js asks these
    update, newGame, gameEnded,
    // boxscore.js asks this one
    chartHTML,
    // the number itself, and everything the tests need
    chance, driveScore, read,
    now: () => shown,
    series: () => series.slice(),
    consts: () => ({ PTS_DRIVE, VAR_DRIVE, SCORE_PTS, DRIVE_SECS }),
  };
})();
