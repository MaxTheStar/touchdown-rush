// ============================================================
// TOUCHDOWN FUN — playclock.js: ⏳ THE PLAY CLOCK (Round 13, pick ④)
// ------------------------------------------------------------
// Until now you could stand at the line of scrimmage for an hour. Cycle the
// formation forty times, read the audible tell, make a cup of tea, come back,
// and the eleven men opposite you would still be politely waiting.
//
// Real football does not work like that. There is a second clock on every
// scoreboard in the world — the PLAY CLOCK — and it is the one that decides
// how long you get to think. Run it to zero and the referee marks off five
// yards for DELAY OF GAME.
//
// ------------------------------------------------------------
// ⚠️ THESE ARE THE TWO PENALTIES v3.9 DELIBERATELY LEFT OUT
// ------------------------------------------------------------
// 🟨 penalty.js judges plays that actually RAN. It hooks `endPlay`, looks at
// what happened, and throws a flag on the holding or the face mask it finds
// there. That is why it could never call either of these two:
//
//   ⏳ DELAY OF GAME — the ball was never snapped.
//   🏃 FALSE START   — the ball was never snapped, and now it never will be.
//
// Both fouls happen in the silence BEFORE the snap, which is a moment that
// simply had no rules in it. This file is that missing half of the rulebook,
// and it hooks the one place penalty.js cannot reach: the `presnap` state.
//
// ⚠️ THEY CANNOT COLLIDE. penalty.js parks a play that has ENDED; this parks a
// play that has not STARTED. There is no frame in which both are live, and no
// coordination between them is needed (unlike 🟨 vs 🚩 the Coach's Challenge,
// which fight over the same three lines of endPlay and had to be sequenced).
//
// ------------------------------------------------------------
// THE DECISION THIS FEATURE EXISTS FOR
// ------------------------------------------------------------
// The clock on its own would just be a timer. What makes it football is the
// three-way choice it creates once it goes red:
//
//   ① SNAP IT ANYWAY — fastest, but a hurried line can jump: FALSE START.
//   ② CALL A TIMEOUT — costs you one of your three, and buys a fresh clock.
//      ⚠️ THIS IS THE REAL ANSWER, and it is the thing worth learning. Every
//      coach on television burns a timeout to avoid a delay-of-game flag, and
//      the ⏱ TIMEOUT button has been sitting there since v1.7 waiting for a
//      reason to be pressed at the line. This gives it one.
//   ③ LET IT EXPIRE — five yards, same down, and you go again.
//
// ------------------------------------------------------------
// ⚠️ THE DIALS, AND WHY THEY ARE THESE NUMBERS
// ------------------------------------------------------------
// FULL = 15 seconds of REAL time (not game clock — the game clock does not run
// between plays here, `advanceClock` only fires when a play ends). A real play
// clock is 40 seconds, but a real quarterback spends most of it on a huddle
// this game does not have. Fifteen was picked by counting what you can
// actually DO at the line: read the 🗣️ tell on the button, cycle 🧩 the
// formation a couple of times, arm 🎩 the trick, and hike it. That is three or
// four seconds for somebody who knows what they want, and eight or nine for
// somebody deciding. Fifteen leaves room for the second player and still makes
// the number on the screen mean something.
//
// ⚠️ AND THE CLOCK PAUSES WHENEVER A PANEL IS OPEN — see `paused()`. Opening
// 🗣️ AUDIBLES to read four play descriptions is not dawdling, it is the
// feature working. A play clock that punished you for using the rest of the
// game would be a bug wearing a rulebook.
//
// DANGER = the last 4 seconds. This is the ONLY window in which a false start
// is possible, and the chance climbs from zero at 4.0s to FS_MAX at 0.0s.
// ⚠️ THAT SHAPE IS THE WHOLE BALANCE. If a false start could happen on any
// snap, the lesson would be "snap immediately" — which would quietly delete
// 🗣️ audibles, 🧩 formations, 🎩 trick plays and 🛡 protection, four features
// that all live in exactly the seconds it would be telling you to skip. By
// confining it to the last four seconds, ELEVEN SECONDS ARE COMPLETELY SAFE
// and the punishment lands only on the genuine last-instant scramble.
//
// ------------------------------------------------------------
// ⚠️ THE BRAKES (the same discipline 🟨 penalty.js is held to)
// ------------------------------------------------------------
//   · A FALSE START IS NEVER CALLED ON 4TH DOWN. Losing a fourth-down try to
//     a dice roll is the heartbreak penalty.js already refuses to hand out,
//     and this file keeps that promise. Delay of game still applies there —
//     because that one is not a dice roll, it is entirely your own doing.
//   · NEVER TWO FALSE STARTS IN A ROW, and at most FS_PER_GAME of them.
//   · NEVER ON THE FIRST SNAP OF A GAME. You have just walked on the field.
//   · A DELAY OF GAME NEVER COSTS YOU THE DOWN. Five yards, replay the down —
//     that is the real rule, and it means this penalty can never take the ball
//     away from you no matter how many times it happens.
//   · THE HALF-THE-DISTANCE RULE applies, so backing up can never reach your
//     own end zone and can never hand them a safety.
//   · ⚠️ AND IT PARKS ITSELF IF YOU WALK AWAY. Two delays in a row with no
//     snap between them and the clock simply stops until you play again —
//     see IDLE_PARK. Without it, an iPad left on the sofa would collect a flag
//     every fifteen seconds forever, which is not a rule, it is a nuisance.
//
// ------------------------------------------------------------
// HOW IT PLUGS IN — one hook does nearly all of it
// ------------------------------------------------------------
// The `presnap` branch of main.js's update() runs every frame while you stand
// at the line, and that is the entire life of this feature, so:
//
//   update()   → TDPlayClock.tick(time)        count down, paint, expire
//              → TDPlayClock.judgeSnap()       "…did your line jump?"
//   snap()     → TDPlayClock.stop()            ball's gone
//   timeout    → TDPlayClock.reset()           a fresh 15
//   beginGame  → TDPlayClock.newGame()         clear the per-game counters
//
// ⚠️ IT STARTS ITSELF. There is no `start()` hook, on purpose: `tick` notices
// it is not running and begins a fresh clock. That matters because presnap is
// entered from TWO places — setupPlay for downs 1–3, and chooseFourthDown for
// a 4th down you decided to go for — and a start() hook would have needed both
// and would have been silently missing one of them forever.
//
// Nothing is saved. A play clock is not something you remember between games
// (the same call toss.js, homeaway.js, hurry.js, momentum.js and protect.js
// all made). The flags themselves are announced and then they are history.
//
// ------------------------------------------------------------
// 🔇 WHAT PICK ⑤ WILL WANT FROM THIS FILE
// ------------------------------------------------------------
// ✅ BUILT as pick ⑤ (`src/silent.js`, v4.7). It plugs in at exactly two
// points and nowhere else: `liveChance()` multiplies `chanceAt()` by its
// `noiseMult()`, and `fullSecs()` asks it how long the clock is. `chanceAt`
// itself stayed pure, which is why that was a five-line change.
// ============================================================
(function () {
  'use strict';

  const $ = id => document.getElementById(id);
  const G = () => { try { return window.__td && __td.G; } catch (e) { return null; } };

  // ---- The dials (see the long note above — these are reasoned, not felt) --
  const FULL        = 15;    // seconds on a fresh play clock
  const WARN_AT     = 7;     // amber from here down
  const DANGER_AT   = 4;     // red, flashing — and the only false-start window
  const FS_MAX      = 0.30;  // false-start chance with 0.0 showing
  const FS_PER_GAME = 2;     // hard cap, so it can never feel like a vendetta
  const IDLE_PARK   = 2;     // delays in a row (no snap between) before parking
  const YARDS       = 5;     // both fouls are five yards, both from the line

  // A frame this long means something stopped the world (a hidden tab, a slow
  // repaint). We only ever charge you for 120ms of it — always in your favour.
  const MAX_FRAME_MS = 120;

  // ---- State (all per-play or per-game; nothing here outlives a game) ------
  let running   = false;   // is a clock ticking right now?
  let left      = FULL;    // seconds remaining
  let lastTime  = 0;       // previous tick's timestamp, for our own delta
  let parked    = false;   // walked-away mode: the clock has given up waiting
  let delays    = 0;       // delays in a row with no snap between them
  let fsThisGame = 0;      // false starts called this game
  let fsLast    = false;   // was the LAST snap a false start? (no two in a row)
  let snaps     = 0;       // snaps taken this game (the first one is free)
  let onFoul    = null;    // main.js's "perform this penalty" handler

  // ============================================================
  // IS THE CLOCK ALLOWED TO RUN RIGHT NOW?
  // ------------------------------------------------------------
  // Three things stop it dead, and every one of them is a moment where the
  // player is reading rather than dawdling:
  //
  //   · ANY OPEN PANEL. Every modal in this game is a `.ov`, and every one of
  //     them is opened by setting an inline display. `getElementsByClassName`
  //     hands back a LIVE collection the browser already maintains, so this
  //     costs a loop over ~56 inline-style reads and no layout at all — cheap
  //     enough to do sixty times a second, which is what it does.
  //   · 🎓 THE TUTORIAL. The tour literally tells you to look at a button.
  //     Flagging you for obeying it would be absurd. (main.js already holds
  //     the CPU's snap for the same reason — see G.dsnapAt in update().)
  //   · A HIDDEN TAB. Phaser pauses its loop there anyway; this is the belt to
  //     that braces.
  // ============================================================
  let ovs = null;
  function overlayOpen() {
    if (!ovs) ovs = document.getElementsByClassName('ov');   // live, cached once
    for (let i = 0; i < ovs.length; i++) {
      const d = ovs[i].style.display;
      if (d && d !== 'none') return true;
    }
    return false;
  }
  function paused() {
    if (typeof document !== 'undefined' && document.hidden) return true;
    if (window.TDTour && TDTour.active()) return true;
    return overlayOpen();
  }

  // ============================================================
  // THE RULES — pure functions, so the whole rulebook can be swept
  // without playing a single down
  // ------------------------------------------------------------
  // ⚠️ This is the trick TDFourth.advise, TDClock.advise and TDPenalty.decide
  // all use, and it is the only reason the numbers above are KNOWN to be right
  // rather than hoped to be right: a test can ask "what is the chance at 3.5
  // seconds?" without a game, a canvas or a tap.
  // ============================================================

  // The chance your line jumps if you snap it with `secs` showing.
  // Zero at DANGER_AT and above — eleven of the fifteen seconds are safe.
  function chanceAt(secs) {
    const s = Math.max(0, Math.min(FULL, +secs || 0));
    if (s >= DANGER_AT) return 0;
    return FS_MAX * (1 - s / DANGER_AT);
  }

  // The chance that actually gets rolled, once the situation has its say.
  // ⚠️ `chanceAt` ABOVE STAYS PURE, and that is deliberate: the curve has to be
  // sweepable without a game, a stadium or a road trip. Everything situational
  // is multiplied on HERE instead, which is where 🔇 the silent count plugs in
  // (crowd noise makes your line jumpy; going silent calms it right down).
  function liveChance(secs) {
    let c = chanceAt(secs);
    try { if (window.TDSilent) c *= TDSilent.noiseMult(); } catch (e) {}
    return c < 0 ? 0 : c > 1 ? 1 : c;
  }

  // How long a fresh play clock is. Fifteen at home — and 🔇 silent.js shortens
  // it on the road, because the call takes longer to get in through the noise.
  //
  // ⚠️ AND IT IS CLAMPED HERE, NOT THERE. Whatever anybody else asks for, there
  // must always be at least five seconds in which a snap is COMPLETELY safe,
  // because the moment the whole clock sits inside the danger window the road
  // stops being spicy and starts being unfair. A hard floor in this file means
  // no future caller can take that away by getting a number wrong.
  function fullSecs() {
    let s = FULL;
    try { if (window.TDSilent) s = TDSilent.clockSecs(FULL); } catch (e) {}
    if (!(s > 0)) s = FULL;
    return Math.max(DANGER_AT + 5, Math.min(FULL, s));
  }

  // ⚠️ HALF THE DISTANCE TO THE GOAL. Five yards back from your own 6 is not
  // your own 1, it is your own 3 — and that is why a pre-snap penalty can
  // never walk you into your own end zone and hand them two points. The same
  // rule 🟨 penalty.js spells out; both files need it and neither should ever
  // be the only one that has it.
  function stepBack(from) {
    return Math.max(1, Math.min(99, Math.max(from - YARDS, from / 2)));
  }

  // Where a pre-snap foul leaves you. ⚠️ BOTH OF THESE REPLAY THE DOWN — the
  // marker does not move, so 2nd & 4 becomes 2nd & 9 and you try again. That
  // is the real rule for both fouls, and it is what makes this penalty one you
  // can always recover from.
  function spotAfter(los, down, fd) {
    const spot = stepBack(los);
    return { los: spot, down: down, fd: fd };
  }

  // ---- The two fouls -------------------------------------------------------
  const FOULS = {
    delay: {
      id: 'delay', name: 'DELAY OF GAME',
      shout: '⏳ Too slow! Delay of game — five yards.',
      blurb: 'The play clock hit zero before the ball was snapped.',
    },
    falsestart: {
      id: 'falsestart', name: 'FALSE START',
      shout: '🏃 He flinched! False start — five yards.',
      blurb: 'A lineman moved before the snap. Nothing you can do but go again.',
    },
  };

  function foulPacket(kind) {
    const g = G(); if (!g) return null;
    const f = FOULS[kind]; if (!f) return null;
    return {
      id: f.id, name: f.name, shout: f.shout, blurb: f.blurb, yards: YARDS,
      next: spotAfter(g.losYards, g.down, g.firstDownYards),
    };
  }

  // ============================================================
  // THE READOUT
  // ------------------------------------------------------------
  // It lives in the top-left HUD stack, directly under the spot — because it
  // is a CLOCK, and the other clock is already there. It is only on the screen
  // while a clock is actually running, which is why it can afford a row of its
  // own on a phone: most of the game there is nothing there at all. (Exactly
  // the argument ⏱️ #btn-clock makes for its strip.)
  // ============================================================
  function paint() {
    const box = $('playclock'); if (!box) return;
    if (!running) { box.style.display = 'none'; return; }
    const num = $('pc-num');
    box.style.display = 'block';
    const lab = $('pc-lab');
    if (parked) {
      // Walked away. Say so plainly rather than counting at an empty room.
      if (num) num.textContent = '\u2014';
      if (lab) lab.textContent = 'READY WHEN YOU ARE';
      box.className = 'parked';
      box.title = 'Waiting for you. Press HIKE when you are ready.';
      return;
    }
    // A real play clock shows whole seconds and shows 1 until it is truly gone.
    if (num) num.textContent = String(Math.ceil(left));
    if (lab) lab.textContent = 'PLAY CLOCK';
    box.className = left <= DANGER_AT ? 'danger' : left <= WARN_AT ? 'warn' : '';
    box.title = 'Play clock \u2014 snap it, or call a timeout.';
  }

  function hide() { const b = $('playclock'); if (b) b.style.display = 'none'; }

  // ============================================================
  // THE HEARTBEAT — called from the presnap branch of main.js's update()
  // ------------------------------------------------------------
  // ⚠️ IT STARTS ITSELF (see the header). The first tick of a new line of
  // scrimmage finds `running === false` and begins a fresh clock, which is how
  // a 4th down you chose to go for gets a play clock without main.js having to
  // remember to hand it one.
  // ============================================================
  function tick(time) {
    const g = G();
    if (!g || g.gameOver || g.state !== 'presnap') { stop(); return; }

    if (!running) {                  // a new line of scrimmage
      running = true;
      left = fullSecs();
      lastTime = time;
      paint();
      return;
    }

    // ⚠️ OUR OWN DELTA, CLAMPED. Phaser's `delta` is not trustworthy across a
    // modal, a hidden tab or a stalled frame, and an un-clamped one would hand
    // out a delay of game for the crime of opening the audible panel.
    const dt = Math.min(Math.max(time - lastTime, 0), MAX_FRAME_MS);
    lastTime = time;

    if (parked || paused()) { paint(); return; }

    left = Math.max(0, left - dt / 1000);
    paint();
    if (left <= 0) expire();
  }

  // The clock reached zero. Five yards, same down, go again.
  function expire() {
    const packet = foulPacket('delay');
    delays++;
    stop();
    // ⚠️ Park after two in a row. The clock is not being ignored on purpose at
    // that point — nobody is there. Coming back to a game that quietly waited
    // is kind; coming back to a team on its own 3 is not.
    if (delays >= IDLE_PARK) parked = true;
    if (packet && onFoul) onFoul(packet);
  }

  // ============================================================
  // THE SNAP — did your line jump?
  // ------------------------------------------------------------
  // Called the instant you press HIKE, BEFORE main.js snaps the ball, because
  // a false start means the ball is never snapped at all. Returns the foul
  // (and performs it) or null for "go ahead, play football".
  // ============================================================
  function judgeSnap() {
    const g = G();
    if (!g || g.state !== 'presnap') return null;
    snaps++;
    delays = 0;              // you snapped it: you are clearly still here
    const wasLast = fsLast;
    fsLast = false;

    // Every brake, before any dice.
    if (!running || parked) return null;             // no clock, no pressure
    if (left > DANGER_AT) return null;               // the eleven safe seconds
    if (g.down >= 4) return null;                    // never the 4th-down heartbreak
    if (snaps <= 1) return null;                     // never on your first snap
    if (wasLast) return null;                        // never two in a row
    if (fsThisGame >= FS_PER_GAME) return null;      // the per-game cap
    if (Math.random() >= liveChance(left)) return null;

    const packet = foulPacket('falsestart');
    if (!packet) return null;
    fsThisGame++;
    fsLast = true;
    stop();
    if (onFoul) onFoul(packet);
    return packet;
  }

  // ---- Lifecycle -----------------------------------------------------------
  function stop()  { running = false; hide(); }

  // ⏱ A TIMEOUT BUYS A FRESH PLAY CLOCK. That is the real rule and it is the
  // whole reason the timeout button is now worth pressing at the line.
  function reset() {
    if (!running) return;
    left = fullSecs();
    parked = false;
    delays = 0;
    paint();
  }

  function newGame() {
    running = false; left = fullSecs(); lastTime = 0;
    parked = false; delays = 0;
    fsThisGame = 0; fsLast = false; snaps = 0;
    hide();
  }

  function setup(fn) { onFoul = fn; hide(); }

  window.TDPlayClock = {
    tick, judgeSnap, stop, reset, newGame, setup,
    // pure rules, exposed so they can be swept without playing a down
    chanceAt, spotAfter, stepBack,
    // …and the situational versions the game actually rolls against
    liveChance, fullSecs,
    FULL, WARN_AT, DANGER_AT, FS_MAX, FS_PER_GAME, YARDS,
    // a window into the live state, for the test harness
    _state: () => ({ running, left, parked, delays, fsThisGame, fsLast, snaps }),
    _set: o => { if (typeof o.left === 'number') left = o.left;
                 if (typeof o.running === 'boolean') running = o.running;
                 if (typeof o.snaps === 'number') snaps = o.snaps; },
  };
})();
