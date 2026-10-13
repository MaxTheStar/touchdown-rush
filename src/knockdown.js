// ============================================================
// TOUCHDOWN FUN — knockdown.js: 🙏 KNOCK IT DOWN (Round 17, pick ⑥)
// ------------------------------------------------------------
// v4.37 gave YOU the Hail Mary: the very last snap of a half, or of a game you are
// losing by a score or less, is a prayer — a film, then the timing moment. The
// computer never throws one. When ITS clock is down to the last few seconds it just
// runs one more ordinary play, the period ends on the next tap, and the best moment a
// defense gets — a ball in the air that has to be batted down — was skipped.
//
// Now it is the same rule, asked from the other side. On the computer's very last
// snap of a half (any score) or of a game it is losing by one to eight, from 25+ yards
// out, it heaves it. The panel says so ("🙏 HAIL MARY! :07 left in the half…"), a beat
// later the field holds still and the same timing panel as 🙌 JUMP BALL and 🙌 FALL ON IT
// drops in from the defense's side: the ball hangs, everybody is under it, and you tap
// as it comes down to bat it away.
//
//     🖐 right on it     they catch it   6%    ×  how far away they are
//     👏 close                          14%       (the SAME fade as the offense's own
//     ✋ early / late                   24%        Hail Mary: 1.0 inside 45 yards,
//                                                  down to 0.45 at 95)
//
// A catch is a touchdown. A ball you stop is knocked down in the pile (75%) or comes down
// in YOUR hands for a touchback (25%) — the mirror of the offense's "knocked down or picked
// off".
//
// ⚠️ THE ODDS ARE THE ONES THE OFFENSE PLAYS AGAINST, FLIPPED. Offence: perfect timing 24%,
// ignoring it 4%. Defence: perfect timing 6%, ignoring it 24%. An ordinary thumb (v4.28's
// 40% green / 30% close / 30% off) lets them catch 13.8%, and at 60 yards (factor 0.835)
// that is 11.5% — about one in nine, exactly what your own Hail Mary is at that distance.
// Perfect timing holds them to 5%, and a player who never taps faces 20%.
//
// ⚠️ IT IS RARE ON PURPOSE AND CHEAP TO THE PLAYER. It only exists on the last snap of a
// period (`TDHail.advise`, the very function the offence uses, so the two sides can never
// disagree about what "the last play" is) and the computer has to be the one on offence
// with the clock under 12 seconds. Measured with the real `DefenseSim` and its real clock
// (a simple model of your own drives: 32s a play, 12s on an incompletion), 20,000 halves
// each:
//                                  a Hail Mary fires   they score on it   TDs per 100 halves
//     an ordinary thumb                  22% of halves        12.8%                2.84
//     never taps                         22.7%                21.0%                4.76
//     careful                            22.4%                 8.0%                1.80
//     perfect timing                     22.0%                 5.3%                1.17
// Add the end of the game (the computer also has to be behind by one to eight: about a fifth
// of the time) and a Hail Mary happens in about one game in four, and costs an ordinary thumb
// about 0.03 touchdowns, about 0.2 points, a game.
//
// 🛑 PREVENT DEFENSE (v4.25) was built for exactly this snap and, until now, did nothing
// about it — the computer never threw a long ball with the clock gone. An armed PREVENT now
// cuts their catch chance to 65%, an armed ZONE to 85%; man, blitz and no call change nothing.
// 🖐 BALL HAWK gear widens the green zone, exactly as it does for the tipped ball.
//
// Nothing is saved. This file owns the rule, the numbers and the wording; main.js's
// `DefenseSim.tap()` asks `advise()`, `startCpuHail()` runs it and `apply()` finishes it.
// ============================================================
(function () {
  'use strict';

  const clamp = (v, lo, hi) => v < lo ? lo : v > hi ? hi : v;
  const pick = a => a[Math.floor(Math.random() * a.length)];

  const CATCH = { green: 0.06, yellow: 0.14, early: 0.24, late: 0.24 };   // the chance THEY catch it, by your timing (before distance)
  const ORDINARY = 0.4 * CATCH.green + 0.3 * CATCH.yellow + 0.3 * CATCH.early;   // v4.28's ordinary thumb = 0.138
  const PICK_OF_STOP = 0.25;        // of the balls you stop, this share come down in your hands (an interception)
  const BEAT_MS = 900;              // "here it comes": a beat before the moment, so the panel is read and the tap that snapped it is long gone
  const CALL_MULT = { prevent: 0.65, zone: 0.85 };   // a deep call helps; man / blitz / no call do nothing

  let timer = 0;                    // the beat
  let seq = 0;                      // each Hail Mary gets an id, so a beat left over from an earlier one can never start a later one's moment

  // Can it be drawn at all? (If not, the last snap is the ordinary play it always was.)
  const ready = () => !!(window.TDJump && window.TDHail);

  // ---- the pure parts (so every number can be checked without a game) -----------
  // The rule: EXACTLY the offense's. `ctx` is from the computer's side of the ball —
  // { down, quarter, quarters, clock, my: its score, opp: yours, spot: its yard line, overtime, stopped, twoPt }.
  function advise(ctx) { return ready() ? TDHail.advise(ctx) : null; }

  const callMult = id => (CALL_MULT[id] != null ? CALL_MULT[id] : 1);
  const factor = dist => (window.TDHail ? TDHail.factorFor(dist) : 1);

  // The chance THEY come down with it, for a tap graded `g` ('green' | 'yellow' | 'early' | 'late'), `dist` yards out.
  function catchChance(g, dist, call) {
    const base = CATCH[g] != null ? CATCH[g] : CATCH.late;
    return clamp(base * factor(dist) * callMult(call), 0.01, 0.9);
  }
  // The win-chance table handed to TDJump: the chance YOU stop it. (TDJump itself never lets it pass 95%: even a perfect
  // swat on a prayer is not a sure thing.)
  function stopTable(dist, call) {
    const t = {};
    for (const g of ['green', 'yellow', 'early', 'late']) t[g] = 1 - catchChance(g, dist, call);
    return t;
  }

  // "3:05" style → the line under the field map the moment it is thrown
  function line(clock, lastPeriod) {
    const s = Math.max(1, Math.ceil(clock || 1));
    return '🙏 <b>HAIL MARY!</b> :' + (s < 10 ? '0' : '') + s + ' left in the ' + (lastPeriod ? 'game' : 'half') + ' — everybody runs for the end zone…';
  }

  // What the moment decided, as the play `apply()` finishes. `won` = you stopped it. `dist` = yards to the end zone.
  function ending(won, dist, lastPeriod) {
    const over = lastPeriod ? ' <b>That is the game!</b>' : ' <b>That is the half.</b>';
    if (!won) return { r: 'gain', y: Math.max(1, dist | 0), side: 'pass', tag: 'hail',
                       t: '🙏 <b>CAUGHT!</b> It comes down in the end zone and they have it!' };
    if (Math.random() < PICK_OF_STOP)
      return { r: 'int', y: 0, side: 'pass', tag: 'hail',
               t: pick(['<b>INTERCEPTED!</b> It comes down in <b>your</b> end zone — and you have it!', '<b>PICKED OFF!</b> You come down with the prayer!']) + over };
    return { r: 'inc', y: 0, side: 'pass', tag: 'hail',
             t: pick(['🙏 <b>KNOCKED DOWN!</b> It falls to the turf — nobody has it.', '🙏 <b>BATTED AWAY!</b> The pile cannot hold it.', '🙏 <b>INCOMPLETE!</b> Somebody got a hand on it!']) + over };
  }

  // ---- the moment -----------------------------------------------------------------
  // `o` = { dist, call, hawk }. `call` is the defense you called ('prevent', 'zone', ...) or a function that says which one is armed: it is
  // read when the panel appears, so the label on the play-by-play line ("PREVENT - ...") is always the call that counted.
  // `done(won)` is called exactly once. ⚠️ IT CANNOT HANG: if the panel cannot be drawn, or throws, the ball is decided as if you had ignored it.
  function begin(o, done) {
    cancel();
    const id = ++seq;
    let finished = false;
    const finish = won => { if (finished) return; finished = true; try { done && done(!!won); } catch (e) { console.error(e); } };
    timer = setTimeout(() => {
      timer = 0;
      if (id !== seq) return;
      const call = typeof o.call === 'function' ? o.call() : o.call;
      const table = stopTable(o.dist, call);
      const prevent = call === 'prevent';
      let drawn = false;
      try {
        drawn = !!TDJump.begin({
          title: '🙏 HAIL MARY!',
          sub: 'They heave it! Tap as the ball comes down to knock it away.' + (prevent ? ' 🛑 Your prevent is deep.' : ''),
          winText: '🖐 YOU GOT A HAND ON IT!',
          success: table,
          icon: '🖐',
          zoneBonus: o.hawk || 0,                // 🖐 bigger hands, a wider green (no extra odds: the table is the table)
          perk: '🖐 Ball Hawk: your hands are bigger',
          mult: 1, bonus: 0,
        }, won => finish(won));
      } catch (e) { console.error(e); }
      if (!drawn) finish(Math.random() < table.late);
    }, BEAT_MS);
    return true;
  }
  function cancel() { clearTimeout(timer); timer = 0; seq++; if (window.TDJump) TDJump.cancel(); }

  window.TDKnock = { advise, begin, cancel, ready, line, ending, catchChance, stopTable, CATCH, ORDINARY, PICK_OF_STOP, BEAT_MS, CALL_MULT };
})();
