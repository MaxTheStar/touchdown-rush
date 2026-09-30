// ============================================================
// TOUCHDOWN FUN — motion.js: 👀 PRE-SNAP MOTION (Round 14, pick ④)
// ------------------------------------------------------------
// Send a receiver jogging across the formation before the snap, and WATCH WHAT
// THEY DO ABOUT IT.
//
//   Somebody runs across with him  →  MAN coverage. That defender has him,
//                                     wherever he goes, so he has to go too.
//   Nobody moves                   →  ZONE. They are guarding grass, not men,
//                                     so a receiver leaving one zone and
//                                     arriving in another is somebody else's
//                                     problem now.
//
// This is the single most useful thing a quarterback does before a snap, and
// the best part is that you do not need this file to explain it — you can just
// look. The defender either follows him or he doesn't.
//
// ------------------------------------------------------------
// ⚠️ WHY IT IS WORTH DOING, AND NOT JUST DECORATION
// ------------------------------------------------------------
// 🗣️ AUDIBLES (v2.5) put a tell on the 🗣️ button — BLITZ? / MAN? / ZONE? — and
// **about one look in five is a deliberate bluff**. That question mark is the
// whole point of this pick: motion is how a real quarterback finds out which
// time he is being lied to. So motion calls `TDAudible.reveal()`, and from
// that moment the button and the panel stop guessing and tell the truth about
// this down. The question mark becomes an exclamation mark.
//
// ⚠️ AND IT COSTS SOMETHING, OR EVERY SNAP WOULD START WITH IT. Sending a man
// in motion burns **four seconds** off ⏳ the play clock (v4.6) — enough that
// you cannot dawdle first, look second and still have time to think. You get
// one motion per down.
//
// ⚠️ IT ALSO REALLY MOVES HIM. He finishes the play lined up where the motion
// put him, which changes his route's side — so his snap spot is re-recorded
// the way 🧑‍🤝‍🧑 personnel.js taught us it must be, or a crossing route mirrors
// the wrong way and the whole play comes out backwards.
// ============================================================
(function () {
  'use strict';

  const $ = id => document.getElementById(id);
  const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);

  const TRAVEL_MS   = 1100;   // how long the jog across takes
  const CLOCK_COST  = 4;      // seconds off ⏳ the play clock
  const MAN_CHASE   = 0.86;   // how far across the defender follows (not all the way)
  const EDGE        = 52;     // keep him on the field
  const MOVER       = 3;      // offense index of the man who goes in motion (WR #2)

  let state = null;   // { from, to, started, man, cover, kind } while he is moving
  let usedThisDown = false;
  let lastResult = null;

  const td = () => window.__td || null;
  const G = () => { const t = td(); return t ? t.G : null; };

  // Can you send somebody in motion right now?
  function can() {
    const g = G(), t = td();
    if (!g || !t || g.state !== 'presnap') return false;
    if (usedThisDown || state) return false;
    if (g.twoPtTry) return true;
    // ⏰ In the no-huddle there is no time for this, which is the same trade the
    // hurry-up already makes with 🗣️ audibles and 🧩 formations.
    if (document.body.classList.contains('hurry')) return false;
    return true;
  }

  // ============================================================
  // SENDING HIM
  // ============================================================
  function send() {
    const g = G(), t = td();
    if (!can()) return false;
    const man = t.offense[MOVER];
    if (!man || !man.s) return false;

    // Across the formation: if he is on the right, he goes left, and vice versa.
    const from = man.s.x;
    const mid = 266;                                   // the middle of the field
    const to = clamp(from < mid ? from + 190 : from - 190, EDGE, 533 - EDGE);

    // ⚠️ ASK THE DEFENSE WHAT IT IS REALLY DOING, NOT WHAT IT IS SHOWING.
    // Beating the disguise is the entire value of motion (see the header).
    const truth = (window.TDAudible && TDAudible.reveal) ? TDAudible.reveal()
                : (g.blitz ? 'blitz' : (g.coverage === 'zone' ? 'zone' : 'man'));

    // In man coverage, the man who has him goes with him. defense[5] covers
    // WR #2 — the same pairing the coverage code uses.
    const cover = (truth === 'man') ? t.defense[5] : null;
    state = { from, to, started: Date.now(), man, cover,
              coverFrom: cover ? cover.s.x : 0, kind: truth };
    usedThisDown = true;

    // ⏳ the price
    const g2 = G();
    if (window.TDPlayClock && TDPlayClock.spend) TDPlayClock.spend(CLOCK_COST);
    else if (g2 && typeof g2.playClockLeft === 'number') g2.playClockLeft -= CLOCK_COST;

    if (window.TDSound) TDSound.sting('coin');
    paint();
    return true;
  }

  // Called every frame from main.js (updateHUD). Walks him across, and walks
  // his man across with him when there is one.
  function tick() {
    if (!state) { paint(); return; }
    const g = G();
    // ⚠️ A snap, a penalty or anything else that ends the pre-snap moment stops
    // the motion where it stands — he does not keep jogging into a live play.
    if (!g || g.state !== 'presnap') { finish(true); return; }
    const p = clamp((Date.now() - state.started) / TRAVEL_MS, 0, 1);
    // ease-in-out, so he looks like he is jogging rather than teleporting
    const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
    const x = state.from + (state.to - state.from) * e;
    state.man.s.setPosition(x, state.man.s.y);
    if (state.man.label) state.man.label.setPosition(x, state.man.s.y);
    if (state.cover) {
      // He follows, but not perfectly in step — he trails across, which is what
      // it looks like on television and is easier to read than a mirror image.
      const cx = state.coverFrom + (state.to - state.from) * e * MAN_CHASE;
      state.cover.s.setPosition(cx, state.cover.s.y);
      if (state.cover.label) state.cover.label.setPosition(cx, state.cover.s.y);
    }
    if (p >= 1) finish(false);
  }

  function finish(cutShort) {
    const t = td();
    if (!state) return;
    const man = state.man;
    // ⚠️ RE-RECORD HIS SNAP SPOT. `sideOf()` reads startX to decide which way a
    // route mirrors, so a man who moved without this ends up running his route
    // toward the sideline he is no longer on (the same trap personnel.js hit).
    if (man) { man.startX = man.s.x; man.startY = man.s.y; }
    lastResult = { kind: state.kind, cutShort: !!cutShort };
    state = null;
    // Redraw the routes from where everybody actually is now.
    try { if (t && t.drawRoutePreview) t.drawRoutePreview(); } catch (e) {}
    // ⚠️ AND TELL THE 🗣️ BUTTON TO REDRAW ITSELF. `reveal()` changes what that
    // button should say — MAN? becomes MAN! — but audible.js only rewrites the
    // label inside `sync()`, which main.js calls when a play is set up or
    // snapped. Neither of those is "a man just finished going in motion", so
    // without this the answer you paid four seconds for sits there unwritten
    // until the next snap, which is far too late to be any use.
    try { if (window.TDAudible && TDAudible.sync) TDAudible.sync(); } catch (e) {}
    paint();
  }

  // A fresh down: he can go again.
  function newPlay() { usedThisDown = false; lastResult = null; state = null; paint(); }

  // ============================================================
  // THE BUTTON
  // ------------------------------------------------------------
  // Its own side button, the shape ⚡ POWER-UPS and ⏱️ SPIKE already use, rather
  // than a fifth chip in #ingame-ctrls — that row is built for four, and the
  // v1.44/45 pain was exactly about crowding it.
  // ============================================================
  function paint() {
    const b = $('btn-motion');
    if (!b) return;
    const g = G();
    const live = !!(g && g.state === 'presnap' && g.team);
    b.style.display = live ? 'flex' : 'none';
    const small = b.querySelector('small');
    if (state) {
      b.classList.add('off');
      if (small) small.textContent = 'GOING…';
      return;
    }
    if (lastResult) {
      b.classList.add('off');
      if (small) small.textContent = lastResult.kind === 'man' ? 'MAN!'
                                   : lastResult.kind === 'zone' ? 'ZONE!' : 'BLITZ!';
      return;
    }
    b.classList.toggle('off', !can());
    if (small) small.textContent = 'MOTION';
  }

  function wire() {
    const b = $('btn-motion');
    if (b) b.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); send(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire);
  else wire();

  window.TDMotion = {
    send, tick, newPlay, can, paint,
    moving: () => !!state,
    result: () => lastResult,
    used: () => usedThisDown,
    consts: () => ({ TRAVEL_MS, CLOCK_COST, MOVER, MAN_CHASE }),
  };
})();
