// ============================================================
// TOUCHDOWN FUN — audible.js: 🗣️ AUDIBLES (Round 11, pick ⑥)
// ------------------------------------------------------------
// You get to the line, you look at what the defense is showing you — and you
// change the play. See a linebacker creeping up and switch to quick routes;
// see them playing off you and sit down in the soft spot instead.
//
// ⚠️ AN AUDIBLE IS ONLY A DECISION IF YOU CAN SEE SOMETHING FIRST. The game has
// always decided the defense's plan before the snap (`callPlay` sets G.blitz and
// G.coverage in setupPlay) — but it only ever told you about it AS the ball was
// snapped, which is a heartbeat too late to do anything about. So this feature
// is really two halves:
//
//   1. THE TELL — at the line, the defense now SHOWS you something.
//   2. THE CALL — three audibles, one for each thing they can be doing.
//
// ⚠️ AND THE TELL LIES ABOUT ONE TIME IN FIVE. A tell that is always right is
// not a read, it is an answer key: you would stop looking at the defense and
// just obey the caption. Real defenses disguise, so this one does too — often
// enough to keep you honest, rarely enough that reading is still worth it.
//
//   🔥 HOT ROUTES  slant / slant / flat  — the answer to a BLITZ. Everything
//                  breaks early, so the ball is gone before they get there.
//   🎯 CROSSERS    drag / drag / swing   — the answer to MAN coverage. Nobody
//                  stays glued to a receiver running across his face.
//   🪟 SIT DOWN    curl / in / flat      — the answer to ZONE. Stop in the gap
//                  between defenders instead of running into one.
//
// ⚠️ READING IT RIGHT PAYS, READING IT WRONG COSTS NOTHING. A correct call adds
// a small, capped catch bonus through the SAME `gloveBoost` chain the 👟 gear,
// the 🎡 spin, 🎓 the staff and 🌈 the balls already use — no new balance
// system. A wrong call just leaves you running those routes, which is its own
// answer. This is a game for a nine-year-old: getting it right should feel
// clever, getting it wrong should not feel like a punishment.
//
// HOW IT PLUGS IN — TWO one-line hooks and no new machinery:
//   • setupPlay  → `TDAudible.newPlay()` (here is this down's defensive plan,
//     and here is a fresh audible) and says the tell.
//   • updateTrickBtn → `TDAudible.sync()`. That function is already called at
//     exactly the three moments that matter — the play is set up, the ball is
//     snapped, the 🎩 trick is armed — so the 🗣️ button appears and disappears
//     with the 🎩 one, and arming the trick cancels an audible for free
//     (one call at the line; the trick rewrites the same routes).
// With this file missing, every one of those hooks is skipped and the game is
// exactly what it was.
//
// Nothing is saved: an audible lasts one snap.
// ============================================================
(function () {
  'use strict';

  const $ = id => document.getElementById(id);
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const G = () => { try { return window.__td && __td.G; } catch (e) { return null; } };

  const DISGUISE = 0.20;      // how often the look they give you is a lie
  const RIGHT_CATCH = 0.08;   // the reward for reading it right (capped downstream)

  const CALLS = [
    { id: 'hot',   ic: '🔥', name: 'HOT ROUTES', beats: 'blitz',
      blurb: 'Quick and short. Beats a blitz — the ball is gone before they arrive.',
      wr1: 'slant', wr2: 'slant', rb: 'flat',
      shout: '🔥 HOT ROUTES — get it out quick!' },
    { id: 'cross', ic: '🎯', name: 'CROSSERS', beats: 'man',
      blurb: 'Run them across the field. Beats man coverage — nobody can stay glued.',
      wr1: 'drag', wr2: 'drag', rb: 'swing',
      shout: '🎯 CROSSERS — run them off each other!' },
    { id: 'sit',   ic: '🪟', name: 'SIT DOWN', beats: 'zone',
      blurb: 'Stop in the soft spot. Beats zone — find the window between them.',
      wr1: 'curl', wr2: 'in', rb: 'flat',
      shout: '🪟 SIT DOWN — find the window!' },
  ];

  const TELLS = {
    blitz: ['🔴 A linebacker is creeping up…', '🔴 They are crowding the line!', '🔴 Somebody is showing pressure…'],
    man:   ['🔴 They are jammed up tight on your receivers.', '🔴 Press coverage — everybody has a man.', '🔴 Tight on the line, eye to eye.'],
    zone:  ['🔴 They are playing off — dropping back.', '🔴 Everybody is backing up into zone.', '🔴 Soft coverage, cushion everywhere.'],
  };

  // this down
  let truth = null;     // what the defense really is: 'blitz' | 'man' | 'zone'
  let showing = null;   // what they LOOK like (the same, or a disguise)
  let armed = null;     // the call you made, or null
  let wasRight = false;
  let lastState = '';

  // What the defense is really doing, boiled down to the one thing that matters
  // most: if they are coming, that is the thing to answer.
  function truthOf(blitz, coverage) { return blitz ? 'blitz' : (coverage === 'zone' ? 'zone' : 'man'); }

  // main.js: a new down is set up, and here is the plan the defense just made.
  function newPlay(blitz, coverage) {
    truth = truthOf(blitz, coverage);
    // ⚠️ The disguise is rolled ONCE per down and remembered, so the caption,
    // the panel and the button all tell the same story. Rolling it twice would
    // mean the tell could contradict itself between two taps.
    if (Math.random() < DISGUISE) {
      const others = ['blitz', 'man', 'zone'].filter(t => t !== truth);
      showing = pick(others);
    } else {
      showing = truth;
    }
    armed = null;
    wasRight = false;
  }

  // The line main.js reads out at the line of scrimmage.
  function tell() { return showing ? pick(TELLS[showing]) : null; }

  // ---- the panel ---------------------------------------------------------
  function render() {
    const body = $('aud-body'); if (!body) return;
    body.innerHTML =
      '<div class="au-show">They are showing:<b>' +
        (showing === 'blitz' ? '🔥 PRESSURE' : showing === 'zone' ? '🪟 ZONE' : '🎯 MAN') +
      '</b></div>' +
      CALLS.map(c =>
        '<div class="au-call' + (armed && armed.id === c.id ? ' on' : '') + '" data-id="' + c.id + '">' +
          '<div class="au-ic">' + c.ic + '</div>' +
          '<div class="au-txt"><b>' + c.name + '</b><span>' + c.blurb + '</span></div>' +
        '</div>').join('') +
      '<div class="au-foot">Watch what they do, not what they say — about one look in five ' +
        'is a bluff.</div>';
    body.querySelectorAll('.au-call').forEach(el => {
      el.addEventListener('pointerdown', e => { e.preventDefault(); call(el.getAttribute('data-id')); });
    });
  }

  function open() {
    const g = G();
    if (!g || g.state !== 'presnap' || !showing) return;
    render();
    const m = $('aud-modal'); if (m) m.style.display = 'flex';
    gameKeyboard(false);
  }
  function close() {
    const m = $('aud-modal'); if (m) m.style.display = 'none';
    gameKeyboard(true);
  }

  // Make the call: rewrite the routes and repaint the pre-snap preview, so you
  // SEE the new play before you hike it (exactly what 🎩 callTrick does).
  function call(id) {
    const g = G();
    if (!g || g.state !== 'presnap') { close(); return; }
    const c = CALLS.find(x => x.id === id); if (!c) return;
    armed = c;
    wasRight = (c.beats === truth);
    try {
      const off = __td.offense;
      off[2].route = c.wr1;
      off[3].route = c.wr2;
      off[1].route = c.rb;
      __td.drawRoutePreview();
      __td.sayComment(c.shout);
    } catch (e) {}
    close();
    sync();
  }

  // ---- the button, and the three moments that matter ---------------------
  // Called from main.js's updateTrickBtn, which already fires when a play is set
  // up, when the ball is snapped, and when the 🎩 trick is armed.
  function sync() {
    const g = G();
    if (!g) return;
    const ready = g.state === 'presnap' && !!showing && !g.trickArmed;
    document.body.classList.toggle('audible-ready', ready);
    const b = $('btn-audible');
    if (b) b.classList.toggle('armed', !!armed);
    // 🎩 Arming the trick overwrites these same routes, so it cancels the
    // audible — one call at the line, not two.
    if (g.trickArmed && armed) { armed = null; wasRight = false; }
    // The snap just happened: if you read it right, say so a beat after the
    // "BLITZ!!" shout main.js makes on the very same frame.
    if (lastState === 'presnap' && g.state !== 'presnap') {
      if (armed && wasRight) {
        const line = '🗣️ Good read! ' + armed.ic + ' ' + armed.name.toLowerCase() + ' was the call.';
        setTimeout(() => { try { __td.sayComment(line); } catch (e) {} }, 900);
      }
      if (g.state !== 'presnap' && !armed) { /* no call made — nothing to say */ }
    }
    lastState = g.state;
    if (g.state !== 'presnap') close();
  }

  // 🧤 The reward, folded into shop.js's existing gloveBoost chain. Neutral (0)
  // unless you are actually running a correct audible on this snap.
  function catchAdd() { return (armed && wasRight) ? RIGHT_CATCH : 0; }

  function gameKeyboard(on) { try { window.game.input.keyboard.enabled = on; } catch (e) {} }

  function wire() {
    const tap = (id, fn) => { const el = $(id); if (el) el.addEventListener('pointerdown', e => { e.preventDefault(); fn(); }); };
    tap('btn-audible', open);
    tap('aud-close', close);
    const m = $('aud-modal');
    if (m) m.addEventListener('pointerdown', e => { if (e.target === m) { e.preventDefault(); close(); } });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire);
  else wire();

  window.TDAudible = {
    newPlay, tell, sync, open, close, catchAdd,
    showing: () => showing,
    truth: () => truth,
    armed: () => armed && armed.id,
    right: () => wasRight,
    _call: call,
    _calls: () => CALLS.map(c => ({ id: c.id, beats: c.beats })),
  };
})();
