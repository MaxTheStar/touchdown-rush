// ============================================================
// TOUCHDOWN FUN — throwaway.js: 🧤 THROW IT AWAY (Round 16, pick ③)
// ------------------------------------------------------------
// The rush is on you, nobody is open, and the only choices were to be sacked or
// to force a bad throw. Real quarterbacks have a third one: put the ball in the
// stands and live to see another down.
//
// ⚠️ …AND THE RULE BEHIND IT IS THE INTERESTING PART. You cannot just chuck it
// anywhere. From inside the POCKET (the tackle box, between your two tackles) a
// throw with nobody to catch it is called INTENTIONAL GROUNDING: you lose the
// down AND ten yards — a worse result than the sack it was meant to avoid. A
// quarterback who has ROLLED OUT of the pocket may throw it away legally. So the
// move is a two-step: get outside, THEN throw it away.
//
//   🟩 outside the box   THROWN AWAY  — incomplete, the clock stops, you lose the down
//   🟥 inside the box    GROUNDING!   — loss of down AND 10 yards (never into your
//                                       own end zone: that would be a safety, and
//                                       "I threw it away and gave them two points"
//                                       is not the lesson)
//
// ⚠️ IT NEEDS A COST ON BOTH SIDES OR IT IS A FREE ESCAPE FROM EVERY SACK. The cost
// of the legal throw is the DOWN — you do not get it back, and on 4th down it is
// the end of the drive. The cost of the illegal one is the grounding. And the
// button only exists when a rusher is actually on you (within ~70px) and you are
// still behind the line of scrimmage: with a clean pocket there is nothing to
// escape, and a ball thrown away for no reason is grounding in real football too.
//
// While the button is up, two faint lines mark the edges of the pocket on the
// grass, so the rule can be SEEN: stand between them and the button is red.
//
// Nothing is saved. This file owns the rule and the two pocket lines; main.js's
// `throwAway()` throws the ball and `endPlay` charges the penalty.
// ============================================================
(function () {
  'use strict';

  const BOX_L = 196, BOX_R = 336;   // the tackle box on the field: a little wider than the tackles at 226 and 306
  const PRESSURE = 72;              // px — a rusher this close is "on you" (the line starts 76px away)
  const BOX_DEPTH = 120;            // how far behind the line the pocket lines are drawn

  // ---- the rule (pure, so every spot can be checked without a game) ---------------
  // qb = { x, y }, losY = the line of scrimmage in pixels (smaller y = further upfield),
  // defenders = [{ x, y }]. Returns { available, grounding, inPocket, nearest }.
  function status(qb, losY, defenders) {
    if (!qb || losY == null) return { available: false, grounding: false, inPocket: false, nearest: Infinity };
    const behind = qb.y >= losY - 2;                           // across the line you cannot throw it at all
    let nearest = Infinity;
    for (const d of defenders || []) nearest = Math.min(nearest, Math.hypot(d.x - qb.x, d.y - qb.y));
    const inPocket = qb.x > BOX_L && qb.x < BOX_R;
    return { available: behind && nearest <= PRESSURE, grounding: inPocket, inPocket, nearest };
  }

  // ---- the two lines on the grass ---------------------------------------------------
  let gfx = null, last = '';
  function attach(scene) { gfx = scene.add.graphics().setDepth(1.4); }
  function sync(show, losY, grounding) {
    if (!gfx) return;
    const key = show ? [losY, grounding ? 1 : 0].join('|') : 'off';
    if (key === last) return;
    last = key; gfx.clear();
    if (!show) return;
    const col = grounding ? 0xff6b6b : 0x6bff9a;               // red inside the box, green outside it
    gfx.lineStyle(2, col, 0.55);
    for (const x of [BOX_L, BOX_R]) {
      for (let y = losY; y < losY + BOX_DEPTH; y += 14) {      // a dashed line, so it reads as a boundary and not a wall
        gfx.beginPath(); gfx.moveTo(x, y); gfx.lineTo(x, y + 8); gfx.strokePath();
      }
    }
  }

  window.TDThrowAway = { status, attach, sync, BOX_L, BOX_R, PRESSURE };
})();
