// ============================================================
// TOUCHDOWN FUN — defcall.js: 🛡️ CALL YOUR OWN DEFENSE (Round 11, pick ⑦)
// ------------------------------------------------------------
// When the other team has the ball, you used to tap "continue" and watch. Now
// you coach it: before every single play you send a BLITZ, play MAN, or sit
// back in ZONE — and each one is genuinely better at some things and genuinely
// worse at others.
//
//   🔥 BLITZ   Send everybody. Sacks and stuffed runs go way up… but if they
//              get past it, there is nobody home and it goes a long way.
//   👤 MAN     A defender glued to every receiver. Passes fall incomplete far
//              more often — but your run defence is thinner, and one missed
//              jam is a big gain.
//   🛡 ZONE    Everybody drops and watches the ball. The deep shot basically
//              stops existing; the price is they can take four yards whenever
//              they feel like it.
//
// ⚠️ THIS IS THE MIRROR OF 🗣️ AUDIBLES, ON PURPOSE. That pick let you answer
// what the defense was showing you; this one lets you BE the thing the offense
// has to answer. And it pairs with 📋 the Scouting Report: since v2.3 a team's
// run/pass tendency is real and fixed, so "Chicago runs it" is a fact you can
// act on — call the blitz and stuff them. Three features, one idea: know what
// is coming, and do something about it.
//
// ⚠️ WHERE IT LIVES, AND WHY IT IS NOT ON THE FIELD. In 1-player mode the other
// team's drive is not played out on the grass at all — it is `DefenseSim`, the
// tap-to-progress map in main.js (`startCpuDrive` sends every 1-player drive
// there). That IS defense as Max experiences it, so that is where the call
// belongs: three buttons inside the panel he is already tapping. The buttons
// stop the tap from bubbling, so choosing a call runs exactly one play.
//
// ⚠️ EVERY NUMBER FOLDS INTO THE ONES ALREADY IN `DefenseSim.play()` — the sack
// chance, the stuff chance, the incompletion chance, the big-play chance and
// the yardage multiplier. There is no second simulation. With no call made (or
// with this file missing) every modifier is neutral and the drive plays out
// with exactly the numbers it had before v2.6.
//
// The call is consumed by the play it was made for, so you choose again every
// down — which is the whole point. Nothing is saved.
// ============================================================
(function () {
  'use strict';

  const $ = id => document.getElementById(id);

  // Neutral = the game exactly as it was. Every call is written as a change
  // FROM this, so it is always obvious what a call actually does.
  // ⚠️ THE BIG-PLAY CHANCE IS THE STRONGEST LEVER IN THE WHOLE SIMULATION, and
  // it needs to be TWO levers, not one. A base 8% chance of a 10–30 yard chunk
  // is worth about 1.5 yards a play — roughly a THIRD of everything a drive
  // gains — so whichever call cut it won every down regardless of anything else.
  // It is also the one number that should point opposite ways for the two kinds
  // of play: a 🔥 blitz means nobody is home if they THROW past it, but extra
  // bodies in the box if they RUN into it. One shared `bigPlay` could not say
  // that, and 🛡 zone quietly became the right answer to everything.
  const NEUTRAL = {
    sack: 0, stuff: 0, incomplete: 0, intAdd: 0, fumbleAdd: 0,
    bigPass: 0, bigRun: 0, passGain: 1, runGain: 1,
  };

  // ⚠️ EACH CALL HAS TO BE THE BEST ANSWER TO SOMETHING AND THE WORST ANSWER TO
  // SOMETHING ELSE, or there is nothing to decide. The first cut failed this in
  // both directions at once (measured over 600 plays each): 🛡 ZONE gave up the
  // fewest yards of anything AND killed every big play, so it was simply the
  // right answer every down; 👤 MAN gave up MORE yards than making no call at
  // all, so it was never worth choosing. Both are now written against what the
  // offense is actually doing:
  //     vs the RUN   🔥 blitz best · 🛡 zone middle · 👤 man worst
  //     vs the PASS  👤 man best   · 🛡 zone middle · 🔥 blitz worst
  // So the call is only a good call if it matches what THIS opponent leans on —
  // which is exactly what 📋 the Scouting Report (v2.3) tells you before kickoff.
  const CALLS = [
    { id: 'blitz', ic: '🔥', name: 'BLITZ', tag: '🔥 BLITZ',
      blurb: 'Send everybody. Murder on runs — but risky against the pass.',
      mods: { sack: 0.10, stuff: 0.18, intAdd: 0.01, fumbleAdd: 0.02,
              bigPass: 0.10, bigRun: -0.05, passGain: 1.30, runGain: 0.80 } },
    { id: 'man', ic: '👤', name: 'MAN', tag: '👤 MAN',
      blurb: 'A man on every receiver. Smothers passes, thin against runs.',
      mods: { incomplete: 0.13, intAdd: 0.012, stuff: -0.07,
              bigPass: 0.01, bigRun: 0.07, passGain: 0.80, runGain: 1.35 } },
    { id: 'zone', ic: '🛡', name: 'ZONE', tag: '🛡 ZONE',
      blurb: 'Everyone drops back. No big plays — but they nibble at you.',
      mods: { incomplete: -0.08, stuff: -0.02,
              bigPass: -0.05, bigRun: -0.02, passGain: 1.00, runGain: 1.20 } },
  ];

  let armed = null;   // the call for the play about to happen

  // What main.js's DefenseSim.play() asks for. Neutral unless a call is armed.
  function mods() {
    if (!armed) return NEUTRAL;
    return Object.assign({}, NEUTRAL, armed.mods);
  }

  // main.js's DefenseSim.apply() asks for this once the play has resolved: the
  // label to stick on the front of the play-by-play line, AND the moment the
  // call is used up. One call, one play — you choose again every down.
  function consume() {
    if (!armed) return '';
    const t = '<b>' + armed.tag + '</b> · ';
    armed = null;
    paint();
    return t;
  }

  // ---- the three buttons, inside the panel you are already tapping --------
  function paint() {
    const row = $('dsim-calls'); if (!row) return;
    row.innerHTML = CALLS.map(c =>
      '<div class="dc-btn' + (armed && armed.id === c.id ? ' on' : '') + '" data-id="' + c.id + '">' +
        '<b>' + c.ic + ' ' + c.name + '</b><span>' + c.blurb + '</span></div>').join('');
    row.querySelectorAll('.dc-btn').forEach(el => {
      el.addEventListener('pointerdown', e => {
        // ⚠️ The whole panel is one big "tap to continue", so a call button has
        // to stop the tap from bubbling — otherwise picking a call would run
        // the play twice.
        e.preventDefault();
        e.stopPropagation();
        choose(el.getAttribute('data-id'));
      });
    });
  }

  // Choosing a call IS the tap that snaps the ball — one action, not two.
  function choose(id) {
    const c = CALLS.find(x => x.id === id); if (!c) return;
    armed = c;
    paint();
    try { __td.DefenseSim.tap(); } catch (e) {}
  }

  // main.js: their drive just started (or the panel came back). Fresh call.
  // ⚠️ AND CHECK NOTHING IS SITTING ON TOP OF US. These buttons live at z-index
  // 40; the 🗣️ audible panel and the ⚡ power picker are full-screen overlays at
  // 79. main.js closes them on a possession change (closePreSnapPanels), and
  // this is the belt to that braces: the panel that OWNS these buttons refuses
  // to come up underneath a leftover overlay. Max could not pick a defensive
  // call at all because of exactly this, and nothing looked broken — the
  // buttons were drawn, lit and listening, just unreachable.
  function clearCovers() {
    try { if (window.TDAudible && TDAudible.close) TDAudible.close(); } catch (e) {}
    try { if (window.TDPowerup && TDPowerup.close) TDPowerup.close(); } catch (e) {}
  }
  function show() { armed = null; clearCovers(); paint(); refresh(); }

  // main.js calls this every time the panel repaints. Two jobs:
  //  • hide the three calls when the next tap is NOT a play (a drive that has
  //    just ended is handed off with one tap — there is nothing to call).
  //  • ⚠️ retitle the big gold button. It used to say TAP TO CONTINUE, which is
  //    the most inviting thing on the screen — a nine-year-old would tap that
  //    every single down and never notice the feature at all. Saying what it
  //    actually means now ("no call") turns it into the third option it really
  //    is, instead of the obvious one.
  function refresh() {
    let ending = false;
    try { ending = !!(window.__td && __td.G && __td.G.dsimEnding); } catch (e) {}
    const row = $('dsim-calls');
    if (row) row.style.display = ending ? 'none' : 'flex';
    const tap = $('dsim-tap');
    if (tap && !ending) tap.textContent = '▶ NO CALL — JUST PLAY';
  }

  window.TDDefense = {
    mods, consume, show, refresh,
    armed: () => armed && armed.id,
    _choose: choose,
    _calls: () => CALLS.map(c => ({ id: c.id, mods: c.mods })),
    _neutral: () => NEUTRAL,
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', paint);
  else paint();
})();
