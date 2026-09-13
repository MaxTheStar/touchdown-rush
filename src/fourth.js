// ============================================================
// TOUCHDOWN FUN — fourth.js: 🧮 FOURTH-DOWN HELPER (Round 12, pick ②)
// ------------------------------------------------------------
// It's 4th and 2 on their 38. Go for it, kick it, or punt? Your coach does the
// maths and tells you what he'd do — and, more importantly, WHY.
//
// ⚠️ IT INVENTS NOTHING. Every number it thinks with is already on the screen
// when the panel opens: the down, the distance to the sticks, where the ball
// is, how far a field goal would be, the clock and the score. The helper just
// says out loud what a coach would be thinking, in words a nine-year-old can
// argue with. That is the whole feature — and it is why it is pick ②, right
// after 📣 Home Crowd: both take something the game already knew and let you
// see it.
//
// ⚠️ ADVICE, NOT AUTOPILOT. It highlights a button; it never presses one. You
// can ignore it every single time, and on 4th and 1 on their 35 in the last
// minute you probably should. A helper that took the decision away would make
// the most interesting moment in football into a cutscene.
//
// THE RULES IT FOLLOWS, in the order it checks them — each one is a real piece
// of football reasoning rather than a magic number:
//   1. LAST MINUTE, BEHIND        you need the ball and the points. Go, or kick
//                                 if a field goal actually ties or wins it.
//   2. LAST MINUTE, AHEAD         protect it. Punt (or kick the points) and make
//                                 them go the length of the field.
//   3. OWN HALF, MORE THAN A YARD punt. A turnover here hands them a short field
//                                 and that is how you lose a close game.
//   4. FIELD GOAL RANGE           take the points — unless it is short yardage
//                                 close in and a touchdown is the better prize.
//   5. SHORT YARDAGE PAST MIDFIELD go for it. Fourth and one is a coin flip you
//                                 win more often than you think.
//   6. ANYTHING ELSE              too far to make, too far to kick: punt.
//
// `advise()` is a PURE FUNCTION of a plain context object — no globals, no DOM —
// so every situation can be checked without playing a single down. main.js hands
// it the situation from the one place that already knows it
// (`showFourthDownChoice`). Nothing is saved; there is nothing to save.
// ============================================================
(function () {
  'use strict';

  const $ = id => document.getElementById(id);

  // ---- the thinking ------------------------------------------------------
  // ctx = { togo, spot, fgDist, inRange, quarter, clock, my, opp, last }
  //   togo    yards to the first-down line        spot   your own-goal yard line (0…100)
  //   fgDist  how long the field goal would be    inRange is that inside the limit?
  //   last    is this the final quarter?          clock  seconds left in it
  function advise(ctx) {
    const c = ctx || {};
    const togo = Math.max(0, c.togo || 0);
    const spot = Math.max(0, Math.min(100, c.spot || 0));
    const inRange = !!c.inRange;
    const fgDist = c.fgDist || 0;
    // ⚠️ WORK OUT "IS IT LATE?" HERE, DON'T TRUST THE CALLER TO SAY SO. The
    // first cut required a `last` flag alongside the `quarter` it was already
    // being handed, and a test that passed `quarter: 4, clock: 50` but no flag
    // got told to PUNT while three points down with fifty seconds left — the
    // single worst piece of advice in the whole feature. A pure function must
    // not depend on the caller repeating itself correctly; the flag is now only
    // an override for a caller that genuinely knows better (overtime).
    const lastQ = (c.last !== undefined) ? !!c.last : (c.quarter || 1) >= 4;
    const late = lastQ && (c.clock || 0) <= 120;       // the last two minutes
    const behind = (c.my || 0) < (c.opp || 0);
    const ahead = (c.my || 0) > (c.opp || 0);
    const gap = Math.abs((c.my || 0) - (c.opp || 0));
    const goalLine = spot >= 95;

    // 1. Last two minutes and losing — the clock decides, not the odds.
    if (late && behind) {
      if (inRange && gap <= 3) {
        return { pick: 'kick', why: 'Under two minutes and ' + gap + ' down — this kick ties it up. Take the points.' };
      }
      return { pick: 'go', why: 'Under two minutes and behind. A punt hands them the ball and the win — you have to go for it.' };
    }
    // 2. Last two minutes and winning — make them earn it.
    if (late && ahead) {
      if (inRange) return { pick: 'kick', why: 'Late and ahead — three more points puts this out of reach.' };
      return { pick: 'punt', why: 'Late and ahead. Punt it away and make them go the whole length of the field.' };
    }
    // 3. Your own half is no place to gamble.
    if (spot < 45 && togo > 1) {
      return { pick: 'punt', why: 'Your own end of the field. Lose it here and they start in easy range — punt it.' };
    }
    // 4. In range: usually take the points.
    if (inRange) {
      if (goalLine && togo <= 2) {
        return { pick: 'go', why: 'A yard or two from the goal line. Seven beats three — go and get it.' };
      }
      if (togo <= 1 && spot >= 60) {
        return { pick: 'go', why: 'Only a yard, and you are already deep in their half. Go for it and keep the drive alive.' };
      }
      return { pick: 'kick', why: 'A ' + fgDist + '-yarder is on. Points on the board beat a fifty-fifty.' };
    }
    // 5. Short yardage past midfield.
    if (togo <= 2 && spot >= 45) {
      return { pick: 'go', why: 'Short yardage past midfield and too far to kick — this is a go.' };
    }
    // 6. Nothing doing.
    return { pick: 'punt', why: togo + ' to go and out of kicking range. Punt it and get your defense out there.' };
  }

  const LABEL = { go: 'PLAY IT', kick: 'KICK IT', punt: 'PUNT IT' };
  const ICON  = { go: '💪', kick: '🥅', punt: '🦶' };

  // ---- saying it ---------------------------------------------------------
  // ⚠️ The panel's second button is BOTH the field goal and the punt (main.js
  // relabels it), so 'kick' and 'punt' highlight the same button. Getting that
  // wrong would point at a button that is not there.
  function show(ctx) {
    const box = $('fd-advice');
    const a = advise(ctx);
    if (box) {
      box.innerHTML =
        '<div class="fd-rec">' + ICON[a.pick] + ' COACH SAYS: <b>' + LABEL[a.pick] + '</b></div>' +
        '<div class="fd-why">' + String(a.why).replace(/</g, '&lt;') + '</div>';
    }
    const goBtn = $('btn-go'), kickBtn = $('btn-kick');
    if (goBtn) goBtn.classList.toggle('rec', a.pick === 'go');
    if (kickBtn) kickBtn.classList.toggle('rec', a.pick !== 'go');
    return a;
  }

  function clear() {
    const box = $('fd-advice'); if (box) box.innerHTML = '';
    const goBtn = $('btn-go'), kickBtn = $('btn-kick');
    if (goBtn) goBtn.classList.remove('rec');
    if (kickBtn) kickBtn.classList.remove('rec');
  }

  window.TDFourth = { advise, show, clear, _labels: () => LABEL };
})();
