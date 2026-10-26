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
    bigPass: 0, bigRun: 0, passGain: 1, runGain: 1, spy: 0,
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

  // ============================================================
  // 🛑 PREVENT DEFENSE (Round 15, pick ④) — the one call that is not always there
  // ------------------------------------------------------------
  // Up seven with forty seconds left, the only way they score is a big play, so
  // real coaches drop everybody deep and make them take the long way down the
  // field: they can have the short stuff, they cannot have the touchdown.
  //
  // ⚠️ IT ONLY EXISTS IN THE SITUATION IT IS FOR. Early in a game "prevent" is the
  // famous mistake (it prevents you from winning: they just march), so the button
  // appears only when a coach would genuinely reach for it:
  //     the end of a half (Q2 or Q4)  ·  their ball  ·  last 80 seconds
  //     ·  you lead by ONE SCORE (1 to 8)
  // — the first call in the game that is conditional, which is what makes it a
  // call worth KNOWING rather than a fourth thing to tap.
  //
  // ⚠️ AND IT HAS TO BE THE WRONG CALL SOMETIMES, like the other three (see the
  // table above). It is the best answer when they need a LOT of yards in a hurry,
  // and the worst when they are close: soft coverage and a thin box hand a team on
  // your 20 an easy chunk. Measured against the others over thousands of
  // clock-aware drives (see DEVLOG v4.25).
  // ============================================================
  const PREVENT_CLOCK = 80;       // seconds left in the quarter
  const PREVENT = { id: 'prevent', ic: '🛑', name: 'PREVENT', tag: '🛑 PREVENT',
    blurb: 'Late, up one score: everybody deep. No big plays — but they can have the short stuff, so it fails if they are close.',
    mods: { sack: -0.07, stuff: -0.06, incomplete: -0.12, intAdd: 0, fumbleAdd: -0.01,
            bigPass: -0.08, bigRun: -0.08, passGain: 0.90, runGain: 1.30 } };

  // Is that call on the table right now? Read straight off main.js's own state so
  // it can never disagree with the game.
  function preventOn() {
    try {
      const g = window.__td && __td.G;
      if (!g || !g.cpu || g.state !== 'dsim' || g.dsimEnding || g.overtime) return false;
      if (g.quarter !== 2 && g.quarter !== __td.NUM_QUARTERS) return false;   // the end of a half
      if (g.clock > PREVENT_CLOCK) return false;
      const lead = g.score - g.oppScore;
      return lead >= 1 && lead <= 8;                                           // a one-score game
    } catch (e) { return false; }
  }

  // ============================================================
  // 🛑 GOAL-LINE DEFENSE (Round 21, pick ①) — the second conditional call
  // ------------------------------------------------------------
  // They are on your 3-yard line and your calls were the same three you use at midfield. Real defenses have a goal-line package: everybody
  // on the line, nothing deep. It exists only inside your 8, and ONLY there, because it is the best answer to a run into the end zone and
  // the worst to a pass: nobody is deep and nobody is covering, so a throw to the corner is a touchdown.
  // ⚠️ IT HAS TO BE THE WRONG CALL SOMETIMES, like the others: measured in DEVLOG v4.72 (touchdown chance of a snap from their 5 against a
  // team that runs 70%, 56% and 30% of the time).
  // ============================================================
  const GOAL_SPOT = 92;            // their yards from THEIR goal: 92+ = inside your 8
  const GOALLINE = { id: 'goalline', ic: '🛑', name: 'GOAL LINE', tag: '🛑 GOAL LINE',
    blurb: 'Inside your 8: everybody on the line. They cannot run it in — but a throw to the corner has nobody home.',
    mods: { sack: -0.02, stuff: 0.20, incomplete: -0.10, intAdd: -0.01, fumbleAdd: 0.01,
            bigPass: 0.0, bigRun: -0.08, passGain: 1.25, runGain: 0.55 } };
  function goalOn() {
    try {
      const g = window.__td && __td.G;
      if (!g || !g.cpu || g.state !== 'dsim' || g.dsimEnding) return false;
      return g.cpu.spot >= GOAL_SPOT;
    } catch (e) { return false; }
  }

  // ============================================================
  // 🕵 SPY THE QUARTERBACK (Round 21, pick ②) — the third conditional call
  // ------------------------------------------------------------
  // On third or fourth and long a quarterback who pulls it down and runs is the most frustrating play there is. DefenseSim.play() now has that
  // play (a SCRAMBLE: on 3rd/4th and 6+ a passing play turns into one SCRAMBLE_P of the time, for 6–16 yards), and a SPY is the answer: one
  // man shadows him, so the scramble is a 0–2 yard play. The price is the pass rush: with a man not rushing, sacks fall (−0.04) and the
  // quarterback has a half-second longer (bigPass +0.03).
  // ⚠️ THE SCRAMBLE IS NOT A FREE BUFF TO THEM: SCRAMBLE_P was tuned so a no-call defense concedes the SAME third-and-long conversion rate as
  // before the scramble existed (DEVLOG v4.73), so the spy is worth exactly what it takes back.
  // It exists only on 3rd/4th down with 6+ to go — the only downs a quarterback runs.
  // ============================================================
  const SPY = { id: 'spy', ic: '🕵', name: 'SPY', tag: '🕵 SPY',
    blurb: '3rd/4th and long: one man shadows the quarterback. He cannot scramble — but your pass rush is thinner.',
    mods: { spy: 1, sack: -0.08, bigPass: 0.08, incomplete: -0.03 } };
  function spyOn() {
    try {
      const g = window.__td && __td.G;
      if (!g || !g.cpu || g.state !== 'dsim' || g.dsimEnding) return false;
      return g.cpu.down >= 3 && g.cpu.togo >= 6;
    } catch (e) { return false; }
  }

  // ============================================================
  // 🤝 DOUBLE THEIR STAR (Round 21, pick ③) — the fourth conditional call
  // ------------------------------------------------------------
  // Every opponent has one receiver the whole offense is built around. Real defenses put two men on him and dare everyone else to beat them: the
  // big ball is gone, the short ball is a gift. It exists only against a team that REALLY throws (the Scouting Report's lean, `TDScout.passLean`,
  // 62% or more): against a team that runs it is two men standing around.
  // ⚠️ IT TRADES THE DEEP BALL FOR THE SHORT ONE, and has to lose to a plain blitz or man against some teams: measured in DEVLOG v4.74.
  // ============================================================
  const DOUBLE_LEAN = 0.62;
  const DOUBLE = { id: 'double', ic: '🤝', name: 'DOUBLE', tag: '🤝 DOUBLE',
    blurb: 'Against a team that throws: two men on their star. The big ball is gone — but the short one is a gift.',
    mods: { bigPass: -0.07, incomplete: -0.04, passGain: 0.97, sack: -0.02, intAdd: 0.004, runGain: 1.08 } };
  function doubleOn() {
    try {
      const g = window.__td && __td.G;
      if (!g || !g.cpu || g.state !== 'dsim' || g.dsimEnding) return false;
      return !!(window.TDScout && TDScout.passLean && TDScout.passLean(g.oppTeam) >= DOUBLE_LEAN);
    } catch (e) { return false; }
  }

  // ============================================================
  // 🧩 NICKEL AND DIME (Round 21, pick ⑦) — two PACKAGES, each wrong in the other's spot
  // ------------------------------------------------------------
  // Your defense is the same seven men on every down. On third and long a real defense takes a lineman off for another defensive back (a DIME);
  // on third and a yard it puts the extra big man in (a HEAVY). Both are conditional calls, and each is the worst call in the other's spot:
  //   🧩 DIME   3rd/4th and 7+ to go:   passes are smothered (more incompletions, no deep ball) — but the box is thin: runs gain more
  //   🧱 HEAVY  3rd/4th and 2 or less:  runs are stuffed — but nobody is back, so a pass finds grass
  // ⚠️ Measured against the existing calls on the same downs in DEVLOG v4.78.
  // ============================================================
  const DIME = { id: 'dime', ic: '🧩', name: 'DIME', tag: '🧩 DIME',
    blurb: '3rd/4th and 7+: an extra defensive back. Passes are smothered — but the box is thin and they can run it.',
    mods: { incomplete: 0.13, bigPass: -0.06, passGain: 0.88, stuff: -0.03, runGain: 1.10, bigRun: 0.0 } };
  const HEAVY = { id: 'heavy', ic: '🧱', name: 'HEAVY', tag: '🧱 HEAVY',
    blurb: '3rd/4th and 2 or less: an extra big man. Runs are stuffed — but nobody is deep, so a pass finds grass.',
    mods: { stuff: 0.26, runGain: 0.55, bigRun: -0.06, incomplete: -0.12, sack: -0.03, bigPass: 0.04, passGain: 1.2 } };
  function dimeOn()  { try { const g = __td.G; return !!(g.cpu && g.state === 'dsim' && !g.dsimEnding && g.cpu.down >= 3 && g.cpu.togo >= 7); } catch (e) { return false; } }
  function heavyOn() { try { const g = __td.G; return !!(g.cpu && g.state === 'dsim' && !g.dsimEnding && g.cpu.down >= 3 && g.cpu.togo <= 2); } catch (e) { return false; } }

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
    // 🛑 …plus PREVENT, on its own full-width row, only when it is on the table.
    let list = preventOn() || (armed && armed.id === 'prevent') ? CALLS.concat(PREVENT) : CALLS;
    if (goalOn() || (armed && armed.id === 'goalline')) list = list.concat(GOALLINE);   // 🛑 inside your 8 only
    if (spyOn() || (armed && armed.id === 'spy')) list = list.concat(SPY);               // 🕵 third/fourth and long only
    if (doubleOn() || (armed && armed.id === 'double')) list = list.concat(DOUBLE);       // 🤝 only against a team that throws
    if (dimeOn() || (armed && armed.id === 'dime')) list = list.concat(DIME);             // 🧩 third and long
    if (heavyOn() || (armed && armed.id === 'heavy')) list = list.concat(HEAVY);          // 🧱 third and short
    row.innerHTML = list.map(c =>
      '<div class="dc-btn' + ((c === PREVENT || c === GOALLINE || c === SPY || c === DOUBLE || c === DIME || c === HEAVY) ? ' dc-wide' : '') + (armed && armed.id === c.id ? ' on' : '') + '" data-id="' + c.id + '">' +
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
    const c = CALLS.find(x => x.id === id) || (id === 'prevent' ? PREVENT : id === 'goalline' ? GOALLINE : id === 'spy' ? SPY : id === 'double' ? DOUBLE : id === 'dime' ? DIME : id === 'heavy' ? HEAVY : null); if (!c) return;
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
    // 🛑 the clock moves between plays, so the late-game call can appear (or go)
    // on any repaint. Cheap: three or four small divs.
    if (!ending) paint();
    const tap = $('dsim-tap');
    if (tap && !ending) tap.textContent = '▶ NO CALL — JUST PLAY';
  }

  window.TDDefense = {
    mods, consume, show, refresh,
    armed: () => armed && armed.id,
    preventOn,
    _choose: choose,
    goalOn, GOAL_SPOT, spyOn, doubleOn, DOUBLE_LEAN, dimeOn, heavyOn,
    _calls: () => CALLS.concat(PREVENT, GOALLINE, SPY, DOUBLE, DIME, HEAVY).map(c => ({ id: c.id, mods: c.mods })),
    _neutral: () => NEUTRAL,
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', paint);
  else paint();
})();
