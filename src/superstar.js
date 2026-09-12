// ============================================================
// TOUCHDOWN FUN — superstar.js: 🌟 SUPERSTAR MODE (Round 11, pick ⑧)
// ------------------------------------------------------------
// The last pick on the board, and the strangest one: you stop being the whole
// team and become ONE player. Your star receiver. The quarterback is somebody
// else's problem now — your only job is to get open, catch it, and go.
//
// ⚠️ THE ONE DESIGN QUESTION THAT DECIDED EVERYTHING: what happens when the
// ball goes somewhere else? In this game the player has ALWAYS been whoever is
// holding the ball — there is no "AI ball carrier" anywhere in main.js, because
// there has never needed to be one. So a mode where the quarterback can throw
// to the OTHER receiver would need a brain for a man running with the ball,
// which is a whole new system and a whole new set of ways to be broken.
//
// So: in Superstar Mode the offense runs through YOU. The quarterback drops
// back and looks for you, and only you. That is not a cop-out — it is the
// fantasy. You are the star; the ball is coming your way; the only question is
// whether you can shake the man covering you. It also means the mode is built
// almost entirely out of parts that already exist:
//
//   • getting open  — you drive your man with the D-pad, the same code that
//                     drives the ball carrier (main.js `controlStar`)
//   • the throw     — `throwTo(1)`, the same call your own button makes
//   • the catch     — `resolvePass`, which already weighs how close the nearest
//                     defender is, so being covered really does cost you
//   • after the catch — nothing at all: the moment you have the ball you ARE
//                     the ball carrier, and every system in the game already
//                     knows what to do with that
//
// THE QUARTERBACK'S THREE SECONDS, which is the whole skill of the mode:
//   0.00–0.45s  he drops back
//   0.45–2.60s  he looks for you, and throws THE INSTANT you are open
//   at 2.60s    he has to let it go anyway — into coverage, if that is where
//               you are. Getting open early is rewarded with a clean catch;
//               never getting open gets you a contested ball. And if the pocket
//               collapses first he is sacked, exactly as he would be for you.
//
// ⚠️ IT IS AN EXHIBITION, AND IT COUNTS FOR NOTHING — no 🔥 streak, no 🏅 ladder,
// no 🎓 coach levels, no 📖 records. Every other "special" mode in this game
// (⏱️ the drill, 🎲 house rules, 🌟 the All-Star Game, a half-simmed takeover)
// made that same promise, and the reason is the same: you are playing a
// different game with a different control scheme, so its results cannot share a
// scoreboard with the real thing. The panel says so before you start. You still
// get the normal payday, because you still played a game.
//
// Nothing is saved. Opened from the 🏆 SEASON hub, where the other game modes
// already live — no new front-screen chip.
// ============================================================
(function () {
  'use strict';

  const $ = id => document.getElementById(id);
  const G = () => { try { return window.__td && __td.G; } catch (e) { return null; } };

  const STAR_SLOT = 2;      // offense[2] = WR #1, thrown to as `throwTo(1)`
  const STAR_NUM  = 1;
  const DROP_S    = 0.35;   // how long the QB spends dropping back
  const LOOK_S    = 1.90;   // how long he can wait for you to come open
  const OPEN_DIST = 38;     // how far from the nearest defender counts as "open"
  const PRESSURE  = 74;     // a rusher this close and the ball has to come out NOW
  const SLIDE     = 96;     // how fast he slides away from the man closest to him
  const EDGE      = 1.10;   // your star runs a little faster than anybody else

  let thrown = false;       // has he let it go on this play?

  // Is a Superstar game running right now? ⚠️ ONE OWNER: main.js's G.starGame is
  // the flag, and this module only ever READS it — the v2.4 takeover bug was a
  // module keeping its own copy and beginGame resetting it underneath.
  function on() { const g = G(); return !!(g && g.starGame); }

  function player() {
    try { return __td.offense[STAR_SLOT] || null; } catch (e) { return null; }
  }

  // main.js's snap(): a new play, so he has not thrown yet.
  function snap() { thrown = false; }

  // The edge main.js gives your star while you are driving him. It replaces the
  // "work open" nudge an AI receiver gets in updateReceivers and that he no
  // longer runs — without it he is the one receiver on the field who cannot
  // shake his man. Exactly 1 when this is not a Superstar game, so it can never
  // leak into a normal one.
  function speedEdge() { return on() ? EDGE : 1; }

  // How far the nearest defender is from your star right now.
  function coverDist() {
    const me = player(); if (!me) return 999;
    let nd = Infinity;
    try {
      for (const d of __td.defense) {
        const dd = Phaser.Math.Distance.Between(me.s.x, me.s.y, d.s.x, d.s.y);
        if (dd < nd) nd = dd;
      }
    } catch (e) { return 999; }
    return nd;
  }

  // How close the nearest rusher is to the quarterback.
  function rushDist(qb) {
    let nd = Infinity;
    try {
      for (const d of __td.defense) {
        const dd = Phaser.Math.Distance.Between(qb.s.x, qb.s.y, d.s.x, d.s.y);
        if (dd < nd) nd = dd;
      }
    } catch (e) { return 999; }
    return nd;
  }

  // The quarterback's brain, called every frame of a live play while HE still
  // has the ball. Everything it can do is something the player could already do
  // with the buttons — it just does it by itself.
  //
  // ⚠️ THE FIRST CUT OF THIS WAS UNPLAYABLE and it is worth remembering why: he
  // dropped back, stood perfectly still, and waited 2.6 seconds for the star to
  // come open. He was sacked on EVERY SINGLE DOWN — one of them for a safety —
  // and the ball never once came out. In the normal game the player is holding
  // that quarterback up the whole time, jinking him away from the rush without
  // thinking about it; take the player away and you have to put that back. So
  // he now FEELS PRESSURE and slides away from it, and a rusher inside
  // PRESSURE makes him throw immediately, ready or not. A quarterback who
  // cannot buy himself a second is not a quarterback, he is a tackling dummy.
  function qbThink(elapsed) {
    const g = G(); if (!g || thrown) return;
    let qb;
    try { qb = __td.offense[0]; } catch (e) { return; }
    if (!qb || g.ballCarrier !== qb) return;

    // …drop back into the pocket.
    if (elapsed < DROP_S) { qb.s.setVelocity(0, 78); return; }

    // …then slide away from whoever is closest, staying behind the line.
    const rush = rushDist(qb);
    let vx = 0, vy = 0;
    if (rush < PRESSURE + 34) {
      try {
        let nd = Infinity, near = null;
        for (const d of __td.defense) {
          const dd = Phaser.Math.Distance.Between(qb.s.x, qb.s.y, d.s.x, d.s.y);
          if (dd < nd) { nd = dd; near = d; }
        }
        if (near) {
          vx = (qb.s.x < near.s.x ? -1 : 1) * SLIDE;
          vy = (qb.s.y < near.s.y ? -1 : 1) * SLIDE * 0.55;
          // never scramble PAST the line — that would end the passing play
          if (qb.s.y < g.losY + 10 && vy < 0) vy = 0;
          if (qb.s.x < 40) vx = Math.abs(vx);
          if (qb.s.x > 492) vx = -Math.abs(vx);
        }
      } catch (e) {}
    }
    qb.s.setVelocity(vx, vy);

    // …and get rid of it: the moment you are open, the moment he is hit, or
    // when he has simply held it too long.
    let canThrow = false;
    try { canThrow = __td.canPass(); } catch (e) {}
    if (!canThrow) return;
    const open = coverDist() >= OPEN_DIST;
    const hurried = rush < PRESSURE;
    if (open || hurried || elapsed >= LOOK_S) {
      thrown = true;
      try {
        __td.sayComment(open ? '🌟 You are OPEN — here it comes!'
                      : hurried ? '🌟 He is under pressure — go get it!'
                      : '🌟 He has to throw it — go get it!');
        __td.throwTo(STAR_NUM);
      } catch (e) {}
    }
  }

  // ---- the panel ---------------------------------------------------------
  function render() {
    const body = $('star-body'); if (!body) return;
    let name = 'your star receiver';
    try {
      if (window.TDDraft && TDDraft.playerAt) {
        const p = TDDraft.playerAt(STAR_SLOT);
        if (p && p.name) name = p.name;
      }
    } catch (e) {}
    body.innerHTML =
      '<div class="ss-hero">🌟</div>' +
      '<div class="ss-name">' + String(name).replace(/</g, '&lt;') + '</div>' +
      '<div class="ss-note">You are <b>one player</b> for the whole game. Not the team &mdash; ' +
        'just him. The quarterback drops back and looks for you, and the only question is ' +
        'whether you can get away from the man covering you.</div>' +
      '<div class="ss-steps">' +
        '<div><b>1</b><span>Hike it, then run your route yourself with the arrows.</span></div>' +
        '<div><b>2</b><span>Shake the defender. The moment you are open, the ball is gone.</span></div>' +
        '<div><b>3</b><span>Stay covered for three seconds and he throws it anyway &mdash; into coverage.</span></div>' +
        '<div><b>4</b><span>Catch it and you are off. From there it is the game you know.</span></div>' +
      '</div>' +
      '<div class="ss-warn">⚠️ A showcase game: it pays the normal coins, but it does <b>not</b> touch ' +
        'your win streak, your ranked stars, your coaches or your record book &mdash; you are playing ' +
        'a different game from the one those are measured on.</div>';
  }

  function open() { render(); const m = $('star-modal'); if (m) m.style.display = 'flex'; gameKeyboard(false); }
  function close() { const m = $('star-modal'); if (m) m.style.display = 'none'; gameKeyboard(true); }

  function begin() {
    const g = G(); if (!g || g.state !== 'menu') { close(); return; }
    close();
    const season = $('season-modal'); if (season) season.style.display = 'none';
    thrown = false;
    try { TDGame.startSuperstarGame(); } catch (e) {}
  }

  function gameKeyboard(on2) { try { window.game.input.keyboard.enabled = on2; } catch (e) {} }

  function wire() {
    const tap = (id, fn) => { const el = $(id); if (el) el.addEventListener('pointerdown', e => { e.preventDefault(); fn(); }); };
    tap('open-star', open);
    tap('star-play', begin);
    tap('star-close', close);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire);
  else wire();

  window.TDStar = {
    on, player, qbThink, snap, open, close, begin, speedEdge,
    slot: () => STAR_SLOT,
    coverDist,
    _openDist: () => OPEN_DIST,
    _thrown: () => thrown,
  };
})();
