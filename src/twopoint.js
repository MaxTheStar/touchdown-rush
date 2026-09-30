// ============================================================
// TOUCHDOWN FUN — twopoint.js: 🎯 THE TWO-POINT CHART (Round 14, pick ①)
// ------------------------------------------------------------
// You just scored. Kick the easy point, or go for two?
//
// Real coaches do not guess at this. They carry a laminated card — the
// two-point chart — that says what to do at every single score, and they look
// at it while the crowd is still cheering. This file is that card, and more
// importantly it is the REASON on the card, because the reason is the part
// that is actually worth learning.
//
// ------------------------------------------------------------
// THE WHOLE IDEA IN ONE SENTENCE
// ------------------------------------------------------------
// **Land on a number that makes THEM need an extra score.**
//
// That is it. Up 5, a touchdown beats you; go for two and you are up 7, where
// their touchdown only TIES. Down 10, a touchdown and a two still leaves you
// short; go for two and you are down 8, where a touchdown and a two ties it.
// Every line on the chart is that same thought.
//
// ⚠️ IT IS ADVICE, NOT AUTOPILOT — the same rule 🧮 the Fourth-Down Helper
// (v3.1) lives by. It highlights a button; it never presses one, and going for
// two when the card says kick is allowed to be the best moment of your game.
//
// ⚠️ AND IT IS HONEST ABOUT WHEN IT MATTERS. Early in a game the chart barely
// moves the needle — there is too much football left for one point to decide
// anything — so it says so instead of pretending. It gets insistent in the
// second half, which is exactly when a real coach starts staring at the card.
//
// `advise()` is a PURE FUNCTION of a plain object: no globals, no DOM, no
// randomness, so every score in the game can be checked without playing a down.
// ============================================================
(function () {
  'use strict';

  const $ = id => document.getElementById(id);

  // ---- the card itself ----------------------------------------------------
  // The key is the score difference AFTER your touchdown and BEFORE the try —
  // which is exactly what the scoreboard says while the panel is open. Negative
  // means you are still behind. Anything not on this list: take the point.
  //
  // ⚠️ EVERY ONE OF THESE IS "MAKE THEM NEED ANOTHER SCORE", not a hunch:
  const CARD = {
    '-10': 'Two makes it 8 — then a touchdown and a two-point play ties it. One point leaves you needing more than that.',
    '-5':  'Two makes it 3, and a field goal ties a 3-point game. One point leaves you needing a touchdown.',
    '-2':  'Two ties it up right now. There is nothing to think about.',
    '1':   'Two puts you 3 up, so their field goal only TIES. One point leaves you 2 up, where a field goal beats you.',
    '5':   'Two puts you 7 up, so their touchdown only TIES. One point leaves you 6 up, where a touchdown beats you.',
    '12':  'Two puts you 14 up — two touchdowns behind. One point leaves 13, which is still two scores, but 14 is the number that holds.',
  };

  // ---- the thinking -------------------------------------------------------
  // ctx = { diff, quarter, clock, quarters }
  //   diff  your score minus theirs, with the touchdown already counted
  //   clock seconds left in this quarter
  function advise(ctx) {
    const c = ctx || {};
    const diff = Math.round(c.diff || 0);
    const quarters = c.quarters || 4;
    const quarter = c.quarter || 1;
    const clock = Math.max(0, c.clock || 0);
    const last = quarter >= quarters;
    const late = last && clock <= 150;          // the final few minutes

    // ⚠️ THE ONE CASE THAT BEATS THE CARD: if one point wins the game and there
    // is no time left to lose it, take the point. A chart is a plan for the
    // rest of the game, and sometimes there is no rest of the game.
    if (late && diff === 0) {
      return { pick: 'kick', why: 'This kick puts you in front with almost no time left. Take the lead and let them try to answer.', hot: true };
    }
    if (late && diff === -1) {
      return { pick: 'two', why: 'One point only ties it. Two WINS it right here — and there is not enough clock left to get another chance.', hot: true };
    }

    const line = CARD[String(diff)];
    if (line) {
      // The card is right all game, but it is worth saying how much it matters.
      const hedge = last || quarter >= quarters - 1
        ? ''
        : ' (It is still early, so the kick is not a mistake — but this is what the card says.)';
      return { pick: 'two', why: line + hedge, hot: last };
    }

    // Not on the card: the extra point is the percentage play, and it is worth
    // saying WHY rather than just "kick".
    if (diff === -1) return { pick: 'kick', why: 'One point ties the game. Never go for two when a kick can tie it.', hot: last };
    if (diff === -3) return { pick: 'kick', why: 'The kick makes it a 2-point game, so a field goal still beats them. Take it.', hot: false };
    if (diff === -8) return { pick: 'kick', why: 'The kick makes it 7 — one touchdown ties. That is the best number on the board from here.', hot: last };
    if (diff >= 15)  return { pick: 'kick', why: 'You are comfortably ahead. Points are points — bank the easy one.', hot: false };
    return { pick: 'kick', why: 'The card says take the point here. Nothing about this score is worth the risk of getting nothing.', hot: false };
  }

  // ---- saying it ----------------------------------------------------------
  // ⚠️ The advice row is its OWN element inside the panel, not part of either
  // button — a button that changes size when the advice appears would move
  // under a thumb that is already on its way down.
  function show(ctx) {
    const a = advise(ctx);
    const box = $('pat-advice');
    if (box) {
      box.innerHTML =
        '<div class="pat-rec">' + (a.pick === 'two' ? '💪' : '🥅') + ' THE CHART SAYS: <b>' +
          (a.pick === 'two' ? 'GO FOR 2' : 'KICK IT') + '</b></div>' +
        '<div class="pat-why">' + String(a.why).replace(/</g, '&lt;') + '</div>';
      box.classList.toggle('hot', !!a.hot);
    }
    const kickBtn = $('btn-xp'), twoBtn = $('btn-two');
    if (kickBtn) kickBtn.classList.toggle('rec', a.pick === 'kick');
    if (twoBtn) twoBtn.classList.toggle('rec', a.pick === 'two');
    return a;
  }

  function clear() {
    const box = $('pat-advice');
    if (box) { box.innerHTML = ''; box.classList.remove('hot'); }
    const kickBtn = $('btn-xp'), twoBtn = $('btn-two');
    if (kickBtn) kickBtn.classList.remove('rec');
    if (twoBtn) twoBtn.classList.remove('rec');
  }

  window.TDTwo = { advise, show, clear, card: () => Object.keys(CARD).map(Number).sort((a, b) => a - b) };
})();
