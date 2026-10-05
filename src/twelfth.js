// ============================================================
// TOUCHDOWN FUN — twelfth.js: 📣 THE TWELFTH MAN (Round 14, pick ⑧)
// ------------------------------------------------------------
// Their drive, your stadium. For thirteen rounds that was the one part of the
// game where you had NOTHING TO DO: the defensive sim is tap-to-progress, and the
// crowd (📣 Home Crowd, v3.0) is a number you can read but never touch.
//
// Now you get a hand on the dial. Before each of their plays, a timing bar sweeps
// across the panel. Stop it in the green and the whole stadium comes up with you —
// and for THAT ONE PLAY a louder house means:
//
//   🚩 a chance they can't hear the count and jump  → FALSE START, −5 yards, replay the down
//   🎯 a chance the QB can't hear his own check     → a few more incompletions
//   🐌 a touch less of everything they do           → a little less yardage on a snap
//
// ⚠️ IT MUST NOT BE A TAPPING CONTEST, AND IT ISN'T: you get ONE try per play, it
// is a TIMING test (stopping early or late is worth almost nothing, tapping fast
// is worth nothing), and the result lasts for one snap only. Spamming does
// nothing because there is nothing to spam.
//
// ⚠️ IT IS WORTH NOTHING ON THE ROAD. A visiting stadium is not yours to raise —
// that is the honest half of 👕 Home & Away (v4.4), so the row there is a single
// dim line instead of a button. The same goes wherever 📣 crowd.js says there is
// no home crowd at all (drill, all-star game, house rules).
//
// ⚠️ THE FIRST CUT WAS FAR TOO STRONG, AND ONLY A DRIVE-LEVEL MEASUREMENT SHOWED
// IT. The numbers were −4% yardage, +8% incompletions and a 12% false start, and
// they LOOKED small: in points per drive (medium difficulty, their ball at the 25,
// 3,000+ drives each) a perfect roar in a packed stadium took them from 0.81 to
// 0.37 — more than HALF their scoring. The reason is that a drive is a chain of
// conversions and every one of those percentages hits every link: crowd.js's own
// −6% cap is already −26% points per drive, and a lone 12% false start is −31%.
//
// So they are now sized against THAT yardstick: a perfect roar in a packed
// stadium is worth about what the crowd's whole cap is worth (−26% against one
// opponent, −19% against another), and a perfect roar in a typical stadium about
// half that (−13% and −8%). It is
// scaled by how loud your stadium ACTUALLY is — a tiny quiet stadium gets about a
// third of it, because a crowd that isn't there can't be raised. And a false
// start still shows up about once every four drives at the top (0.24 a drive),
// which is often enough to feel like THEY are the ones losing their heads.
// Nothing is saved.
//
// This file is the BRAIN + the row. main.js's DefenseSim asks for the result of
// the roar once per play (`take()`), exactly the way it asks 🛡️ defcall.js.
// ============================================================
(function () {
  'use strict';

  const $ = id => document.getElementById(id);
  const clamp01 = v => v < 0 ? 0 : v > 1 ? 1 : v;

  const SWEEP_MS = 1500;       // one pass of the marker, edge to edge
  const GREEN = 0.11;          // ± this around 0.5 is a perfect roar
  const YELLOW = 0.26;         // ± this is a good one
  const LIFT = { green: 1, yellow: 0.5, miss: 0.12 };
  const MAX_POW = 0.015;       // the most a perfect roar can cost their yardage
  const MAX_INC = 0.02;        // …extra incompletions
  const MAX_FALSE = 0.05;      // …chance of a false start on the snap

  let active = null;           // { grade, boost } — the roar waiting to be used
  let t0 = 0;                  // when this try's marker started sweeping
  let raf = 0;
  let falseStarts = 0;         // this game, for the readout

  // ---- the pure maths (testable without a game) ----------------------------
  // Where is the marker at time `ms` after the sweep began? 0..1, bouncing.
  function markerAt(ms) {
    const p = (ms % (SWEEP_MS * 2)) / SWEEP_MS;      // 0..2
    return p <= 1 ? p : 2 - p;
  }
  function grade(pos) {
    const d = Math.abs(pos - 0.5);
    return d <= GREEN ? 'green' : d <= YELLOW ? 'yellow' : 'miss';
  }
  // How much of the maximum a roar is worth, given how loud the place is anyway.
  function boostFor(g, noise) {
    return LIFT[g] * (0.35 + 0.65 * clamp01(noise));
  }
  function modsFor(boost) {
    return { pow: 1 - MAX_POW * boost, incomplete: MAX_INC * boost, falseStart: MAX_FALSE * boost };
  }

  // ---- is there a stadium to raise? ----------------------------------------
  function road() { try { return !!(window.TDHome && TDHome.away && TDHome.away()); } catch (e) { return false; } }
  function stands() { try { return !!(window.TDCrowd && TDCrowd.stands && TDCrowd.stands()); } catch (e) { return false; } }
  function noise() { try { return window.TDCrowd ? TDCrowd.noise() : 0; } catch (e) { return 0; } }

  // ---- the roar --------------------------------------------------------------
  function roar(now) {
    if (active || road() || !stands()) return null;
    const g = grade(markerAt((now != null ? now : performance.now()) - t0));
    active = { grade: g, boost: boostFor(g, noise()) };
    return active;
  }
  // main.js asks ONCE per play. Clears the roar, so each play needs its own.
  function take() {
    const a = active; active = null;
    t0 = performance.now();
    return a ? Object.assign({ grade: a.grade, boost: a.boost }, modsFor(a.boost)) : null;
  }
  function newGame() { active = null; falseStarts = 0; stopAnim(); }
  function noteFalseStart() { falseStarts++; }

  // ---- the row inside the defense panel --------------------------------------
  function ensureRow() {
    let row = $('tw-row');
    if (row) return row;
    const calls = $('dsim-calls');
    if (!calls || !calls.parentNode) return null;
    row = document.createElement('div');
    row.id = 'tw-row';
    calls.parentNode.insertBefore(row, calls);
    // The whole panel advances the drive when it is touched, so a button inside
    // it has to swallow its own tap (icing.js learned this the hard way).
    row.addEventListener('pointerdown', e => {
      e.stopPropagation(); e.preventDefault();
      if (e.target.closest && e.target.closest('.tw-btn')) { roar(); paint(); }
    });
    return row;
  }

  // "about a 3% chance" — and "under 1%" for a roar that barely registered, rather
  // than a rounded "0%" that would read like a promise it was never going to keep.
  function jumpWords(p) {
    const pc = p * 100;
    return pc < 1 ? 'under a 1% chance' : 'about a ' + Math.round(pc) + '% chance';
  }

  const WORD = { green: ['🔊 DEAFENING', 'They cannot hear a thing.'],
                 yellow: ['📣 LOUD', 'The place is up.'],
                 miss: ['👏 A RAGGED CHEER', 'You were off the beat.'] };

  function paint(ctx) {
    const row = ensureRow(); if (!row) return;
    ctx = ctx || {};
    if (ctx.ending) { active = null; row.style.display = 'none'; stopAnim(); return; }
    if (!stands() && !road()) { row.style.display = 'none'; stopAnim(); return; }
    row.style.display = 'block';
    if (road()) {
      row.innerHTML = '<div class="tw-dim">🚌 ROAD GAME — this is their house. Nothing here to raise.</div>';
      stopAnim(); return;
    }
    if (active) {
      const w = WORD[active.grade];
      row.innerHTML = '<div class="tw-head">📣 THE TWELFTH MAN</div>' +
        '<div class="tw-res ' + active.grade + '">' + w[0] + ' <small>' + w[1] + '</small></div>' +
        '<div class="tw-why">This snap: ' + jumpWords(modsFor(active.boost).falseStart) +
        ' they jump the count, and their offense runs a touch slower.</div>';
      stopAnim(); return;
    }
    row.innerHTML = '<div class="tw-head">📣 THE TWELFTH MAN</div>' +
      '<div class="tw-bar"><i class="tw-yellow"></i><i class="tw-green"></i><b id="tw-mark"></b></div>' +
      '<div class="tw-btn">📣 RAISE THE ROOF <small>stop it in the green</small></div>';
    startAnim();
  }

  function startAnim() {
    stopAnim();
    if (!t0) t0 = performance.now();
    const step = () => {
      const m = $('tw-mark');
      if (!m) { raf = 0; return; }
      m.style.left = (markerAt(performance.now() - t0) * 100) + '%';
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  }
  function stopAnim() { if (raf) { cancelAnimationFrame(raf); raf = 0; } }

  // The little readout main.js appends to the play-by-play after a false start.
  function falseStartLine() {
    return '🚩 <b>FALSE START!</b> The ' + (falseStarts > 1 ? 'crowd does it again — ' : 'crowd was too loud — ') +
      'they cannot hear the count. <b>−5</b>, replay the down.';
  }

  const css = document.createElement('style');
  css.textContent = `
    #tw-row { display: none; margin: 2px 4px 10px; text-align: left; }
    .tw-head { font: 800 12px "Arial Black", Arial; color: #ffd60a; letter-spacing: .04em; text-transform: uppercase; }
    .tw-bar { position: relative; height: 16px; margin: 8px 2px 0; border-radius: 8px;
      background: rgba(255,255,255,0.10); overflow: hidden; }
    .tw-bar i { position: absolute; top: 0; bottom: 0; }
    .tw-yellow { left: 24%; width: 52%; background: rgba(255,214,10,0.30); }
    .tw-green  { left: 39%; width: 22%; background: rgba(63,200,95,0.75); }
    .tw-bar b { position: absolute; top: -2px; bottom: -2px; width: 4px; margin-left: -2px; left: 0;
      background: #fff; border-radius: 2px; box-shadow: 0 0 6px rgba(255,255,255,.9); }
    .tw-btn { -webkit-tap-highlight-color: transparent; touch-action: none; cursor: pointer;
      margin-top: 8px; padding: 10px 12px; border-radius: 11px; text-align: center;
      font: 800 12px "Arial Black", Arial; color: #fff3c4;
      background: rgba(255,214,10,0.20); border: 1px solid rgba(255,214,10,0.8); }
    .tw-btn small { display: block; font: 700 10px Arial; opacity: .8; margin-top: 2px; }
    .tw-btn:active { transform: scale(0.97); background: rgba(255,214,10,0.45); }
    .tw-res { margin-top: 4px; font: 800 15px "Arial Black", Arial; color: #fff; }
    .tw-res small { font: 700 11px Arial; opacity: .75; margin-left: 4px; }
    .tw-res.green { color: #7ff0a0; } .tw-res.yellow { color: #ffe066; } .tw-res.miss { color: #aab4c8; }
    .tw-why { font: 12px/1.4 Arial; color: #aab4c8; margin-top: 3px; }
    .tw-dim { font: italic 12px/1.4 Arial; color: #8793a8; }
  `;
  document.head.appendChild(css);

  window.TDTwelfth = {
    refresh: paint, take, newGame, noteFalseStart, falseStartLine,
    // pure, for checking the numbers without playing a down
    markerAt, grade, boostFor, modsFor,
    _roar: roar, _active: () => active, _t0: () => t0,
    _consts: { SWEEP_MS, GREEN, YELLOW, MAX_POW, MAX_INC, MAX_FALSE },
  };
})();
