// ============================================================
// TOUCHDOWN FUN — momentum.js: 🔥 MOMENTUM (Round 12, pick ⑦)
// ------------------------------------------------------------
// Football swings. Everybody who has watched a game knows the feeling: one
// team cannot do anything wrong for ten minutes, then somebody strips the
// ball and it is the other way round. Nothing in this game has ever modelled
// that, and juice.js — the nearest thing — is only screen-shake and confetti.
//
// So: a meter, from −100 (they are rolling) through 0 to +100 (you are).
//
// ------------------------------------------------------------
// ⚠️ THE WARNING PRINTED ON THE DRAFT BOARD, AND WHY IT IS THE WHOLE FEATURE
// ------------------------------------------------------------
// Max's chart says it straight out: **"the danger is a snowball: whoever is
// ahead gets better and runs away with it."** That is not a small risk on the
// side of this feature. It is the obvious way to build it and it is wrong.
//
// A momentum meter that reads the scoreboard is a machine for turning close
// games into blowouts: you go ahead, you get better, so you go further ahead.
// Every game ends 42–0 and the game stops being worth playing.
//
// FOUR THINGS STOP THAT HAPPENING HERE, and all four are measured below
// rather than hoped for:
//
//   1. ⚠️ **IT NEVER READS THE SCOREBOARD.** Not once. Momentum is earned on
//      the field — big plays, first downs, sacks, takeaways, turnovers. A team
//      that is two touchdowns down and driving gets hot, which is exactly what
//      happens in a real comeback. This is the big one.
//   2. **IT DECAYS TOWARDS ZERO EVERY SINGLE PLAY.** You cannot bank it. Stop
//      making plays and it bleeds away on its own, so nobody stays hot by
//      sitting on a lead.
//   3. ⚠️ **IT IS HARDER TO GAIN WHEN YOU ARE AHEAD AND EASIER WHEN YOU ARE
//      BEHIND** — and the losses work the other way round. This deliberately
//      *inverts* the snowball: the further in front you get, the less each good
//      play is worth to you and the more each bad one costs. (This is the one
//      place the score is looked at, and note what it is used FOR: damping the
//      leader, never rewarding them.)
//   4. **THE EFFECT IS TINY AND CAPPED**, with a dead zone in the middle so
//      ordinary football is completely untouched. See EFFECT below.
//
// And the swing back the board asked for is a TAKEAWAY: intercept them or
// recover a fumble and the meter does not nudge, it lurches — because that is
// precisely the play that flips a real game.
//
// ------------------------------------------------------------
// WHAT IT ACTUALLY DOES WHEN YOU ARE HOT
// ------------------------------------------------------------
// ⚠️ ALMOST NOTHING, ON PURPOSE. At a full +100 you get:
//
//   🧤 +4% catch  ·  🎯 4% fewer interceptions  ·  📉 their offense −4%
//
// That is *smaller* than the 📣 Home Crowd's −6% ceiling, and for the same
// reason crowd.js gives: this must never be why you won. It is a thumb on the
// scale you can feel over a drive, not a cheat code. ⚠️ It also stacks with
// the crowd, so the two together are checked below — the combined worst case
// has to stay in the same neighbourhood as one maxed-out coach.
//
// ⚠️ AND NOTHING HAPPENS AT ALL INSIDE ±DEADBAND. Most of most games sits in
// that band, which means momentum is a thing that shows up when a game really
// is swinging and is otherwise just a meter that moves.
//
// ------------------------------------------------------------
// HOW IT PLUGS IN
// ------------------------------------------------------------
// Three guarded one-line hooks in main.js — `play()` at the end of your snap,
// `theirDrive()` when their possession ends, `newGame()` — plus two fold-ins
// in shop.js's perk functions and one in the defense sim, which is the same
// route 🎡 TDSpin and ⚡ TDPowerup already take for a live buff. Without this
// file every one of them is byte-identical to before.
//
// Nothing is saved: momentum is a thing that happens inside one game, and
// carrying it across games would be the snowball again with extra steps.
// ============================================================
(function () {
  'use strict';

  const $ = id => document.getElementById(id);
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  // ---- the meter ----------------------------------------------------------
  const MAX      = 100;    // the ends of the meter
  const DECAY    = 0.88;   // what survives each play — brake 2
  const DEADBAND = 30;     // below this, momentum does nothing at all
  const EFFECT   = 0.04;   // the most it can ever be worth — brake 4

  // ⚠️ Deliberately UNDER crowd.js's MAX_TILT of 0.06. Home field is worth
  // more than a hot streak, and neither is worth as much as playing well.

  // ---- what each thing on the field is worth ------------------------------
  // ⚠️ NOT ONE OF THESE IS A SCORE. They are all things you DID.
  const WORTH = {
    touchdown:   22,   // you scored
    bigplay:     12,   // 15+ yards in one go
    firstdown:    5,   // chains moved
    convert:      8,   // ...and it was 3rd or 4th down
    sacked:     -10,   // your quarterback went down
    turnover:   -26,   // you threw it away or lost the ball
    takeaway:    26,   // ⚠️ THE SWING: you took it off them
    stop:        12,   // you got the ball back on downs or a punt
    theyScored: -20,   // they finished a drive in the end zone
    theirFG:    -10,
  };

  const BIG_PLAY = 15;   // yards that count as a "big play"

  let value = 0;        // −100 … +100
  let last = null;      // what moved it last, for the readout

  function newGame() { value = 0; last = null; paint(); }

  // ============================================================
  // BRAKE 3 — THE ANTI-SNOWBALL SCALER
  // ------------------------------------------------------------
  // ⚠️ THE ONLY PLACE THE SCORE IS READ, AND LOOK WHAT IT IS USED FOR.
  // A good play is worth LESS to you the further ahead you already are, and a
  // bad one costs you MORE. Behind, it is the other way round. That is the
  // exact opposite of "whoever is ahead gets better", which is the trap the
  // board warned about — so rather than avoid the scoreboard entirely, this
  // uses it to push back towards the middle.
  //
  // Down 21 a good play is worth 1.6×; level it is 1×; up 21 it is 0.4×.
  // ============================================================
  function scale(gain, my, opp) {
    const lead = (my | 0) - (opp | 0);
    const s = clamp(1 - lead / 35, 0.4, 1.6);
    return gain > 0 ? s : (2 - s);     // losses scale the other way
  }

  function add(amount, my, opp, why) {
    value = clamp(value + amount * scale(amount, my, opp), -MAX, MAX);
    last = why || null;
    paint();
  }

  // Brake 2: every play bleeds some away, before anything is added.
  function decay() { value *= DECAY; if (Math.abs(value) < 0.5) value = 0; }

  // ============================================================
  // YOUR SNAP JUST ENDED
  // ------------------------------------------------------------
  // main.js hands over what happened; we work out what it was worth. One hook,
  // and it reads only things endPlay already had in its hands.
  // ============================================================
  function play(c) {
    if (!c) return;
    decay();
    const my = c.my, opp = c.opp;
    const gained = (typeof c.spot === 'number' && typeof c.los === 'number')
      ? c.spot - c.los : 0;

    if (c.result === 'touchdown')        { add(WORTH.touchdown, my, opp, 'TOUCHDOWN'); return; }
    if (c.result === 'interception')     { add(WORTH.turnover, my, opp, 'INTERCEPTED'); return; }
    if (c.next && c.next.fresh)          { add(WORTH.turnover, my, opp, 'TURNOVER'); return; }

    // A sack: the quarterback himself, going backwards.
    if (c.sack) { add(WORTH.sacked, my, opp, 'SACKED'); return; }

    if (gained >= BIG_PLAY)              { add(WORTH.bigplay, my, opp, 'BIG PLAY'); return; }
    if (c.next && c.next.down === 1) {
      // Moving the chains is worth more when you had to.
      const wasThird = c.down >= 3;
      add(wasThird ? WORTH.convert : WORTH.firstdown, my, opp,
          wasThird ? 'CONVERTED' : 'FIRST DOWN');
      return;
    }
    paint();   // nothing earned — the decay above still counts
  }

  // ============================================================
  // THEIR DRIVE ENDED
  // ------------------------------------------------------------
  // `kind` is main.js's own word for how it finished (cpuDriveEnd), so this
  // file never has to guess.
  // ============================================================
  function theirDrive(kind) {
    decay();
    const g = window.__td && window.__td.G;
    const my = g ? g.score : 0, opp = g ? g.oppScore : 0;
    if (kind === 'touchdown')      add(WORTH.theyScored, my, opp, 'THEY SCORED');
    else if (kind === 'fieldgoal') add(WORTH.theirFG, my, opp, 'THEY KICKED');
    else if (kind === 'turnover')  add(WORTH.takeaway, my, opp, 'TAKEAWAY!');
    else if (kind === 'punt')      add(WORTH.stop, my, opp, 'BIG STOP');
    else if (kind === 'safety')    add(WORTH.takeaway, my, opp, 'SAFETY!');
    else paint();
  }

  // ============================================================
  // WHAT IT IS WORTH — with the dead zone
  // ------------------------------------------------------------
  // 0 inside ±DEADBAND, then ramping to EFFECT at the ends. Returned as a
  // signed 0…1 so every caller scales the same number its own way.
  // ============================================================
  function tilt() {
    const a = Math.abs(value);
    if (a <= DEADBAND) return 0;
    const t = (a - DEADBAND) / (MAX - DEADBAND);
    return value > 0 ? t : -t;
  }

  // 🧤 catching, 🎯 not throwing picks — folded into shop.js's perk functions,
  // exactly where 🎡 TDSpin and ⚡ TDPowerup already live.
  //
  // ⚠️ THESE ARE SIGNED, AND THAT IS THE POINT. The first cut of this file
  // used `Math.max(0, tilt())` everywhere, so momentum only ever HELPED you —
  // which meant the blue half of the meter was decoration. It sat there
  // saying "they're rolling" while changing precisely nothing.
  //
  // That is the same failure 📋 scout.js and 📊 selfscout.js are written to
  // avoid: **a readout that doesn't predict the game is worse than no readout**,
  // because it teaches Max to ignore what the game tells him. If the meter
  // swings against you, the game has to actually get harder — so it does, by
  // the same 4% it would have helped, and not a point more.
  function catchAdd() { return tilt() * EFFECT; }
  function armAdd()   { return tilt() * EFFECT; }

  // 📉 …and their offense, in the defense sim, right next to the home crowd.
  // Below 1 when you are rolling, above 1 when they are.
  function cpuPowMult() { return 1 - tilt() * EFFECT; }

  // ---- the meter on screen ------------------------------------------------
  function paint() {
    const wrap = $('mo-meter'), fill = $('mo-fill'), lab = $('mo-label');
    if (!wrap) return;
    const pct = (value / MAX);             // −1 … 1
    if (fill) {
      // The bar grows from the middle: right when it's yours, left when theirs.
      fill.style.left  = pct >= 0 ? '50%' : (50 + pct * 50) + '%';
      fill.style.width = Math.abs(pct) * 50 + '%';
      fill.className = 'mo-fill ' + (pct >= 0 ? 'mine' : 'theirs');
    }
    if (lab) {
      const a = Math.abs(value);
      lab.textContent = a <= DEADBAND ? 'EVEN'
        : (value > 0 ? '🔥 ' + (last || 'YOU\'RE ROLLING') : '❄️ ' + (last || 'THEY\'RE ROLLING'));
      lab.className = 'mo-label ' + (a <= DEADBAND ? '' : (value > 0 ? 'hot' : 'cold'));
    }
  }

  window.TDMomentum = {
    play, theirDrive, newGame, paint,
    value: () => value, tilt, catchAdd, armAdd, cpuPowMult,
    MAX, DECAY, DEADBAND, EFFECT, WORTH, BIG_PLAY,
    _set: v => { value = clamp(v, -MAX, MAX); paint(); },
    _scale: scale,
  };
})();
