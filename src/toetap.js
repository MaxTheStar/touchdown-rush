// ============================================================
// TOUCHDOWN FUN — toetap.js: 🦶 THE TOE-TAP CATCH (Round 18, pick ⑤)
// ------------------------------------------------------------
// OUT, FLAT, CORNER and WHEEL routes all end at the sideline, and until now a
// catch there was exactly the same as a catch anywhere. A real receiver has to
// get two feet down before the second one touches the white line, and it is one
// of the best skills in the sport. (📍 Out of Bounds, pick ①, made the line real.)
//
// When an OPEN catch comes down within about three and a half yards of the sideline (34px; a body stops dead at 20),
// the field holds still and you get the same timing panel as 🙌 JUMP BALL: tap as
// his foot comes down.
//
//     🦶 right on it   98%   both feet in — a CATCH
//     👏 close         90%
//     ✋ early / late 70%   one foot out — INCOMPLETE
//
// ⚠️ IT REPLACES A ROLL, IT DOES NOT ADD ONE. An open catch near the sideline
// already had a 12% "catch it and drop it" roll (DROP_CHANCE). That roll is what the
// toe-tap replaces, and the table is set so an ordinary thumb (40% green / 30% close
// / 30% off — the same one every moment uses) catches 87.2% of them against the
// 88% the roll gave. Playing it well wins 98%; ignoring it still catches 70%.
// 🧤 Sticky Gloves (which cut drops) add their drop cut to every zone.
//
// Nothing is saved. This file owns the numbers; main.js's `resolvePass()` starts the
// moment and finishes the play with whatever it reports.
// ============================================================
(function () {
  'use strict';

  const ZONE_PX = 34;     // within this many px of either sideline (a runner's body stops dead at 20)
  const TABLE = { green: 0.98, yellow: 0.90, early: 0.70, late: 0.70 };   // the chance he gets both feet down, by timing

  // Is a catch at x close enough to the sideline for his feet to matter?
  const near = (x, width) => x <= ZONE_PX || x >= width - ZONE_PX;

  const ready = () => !!window.TDJump;

  // Start the moment. `bonus` is Sticky Gloves' drop cut; `done(won)` is called once, after a beat.
  function begin(bonus, done) {
    if (!window.TDJump) return false;
    return TDJump.begin({
      title: '🦶 TOE-TAP!',
      sub: 'Tap as his foot comes down — keep both feet in bounds.',
      winText: '🦶 BOTH FEET IN!',
      success: TABLE,
      icon: '🦶',
      mult: 1, bonus: bonus || 0,
    }, won => { try { done && done(!!won); } catch (e) { console.error(e); } });
  }

  window.TDToe = { near, ready, begin, ZONE_PX, TABLE };
})();
