// ============================================================
// TOUCHDOWN FUN — dive.js: 🤸 DIVE FOR THE MARKER (Round 16, pick ④)
// ------------------------------------------------------------
// You are a yard and a half from the first-down line with a tackler closing, and
// all you could do was run into him. Real runners do the other thing: lower a
// shoulder, stretch the ball out in front of them and DIVE for the marker.
//
// This is that. When all of these are true a 🤸 DIVE button appears:
//     · you have the ball and are running (not still behind the line with a pass on)
//     · a tackler is within ~60px — he is about to get you
//     · the ball is SHORT of the line to gain, or of the goal line, by less than
//       the dive can cover (under ~1.7 yards)
//
// Tap it and the runner launches ~1.8 yards straight up the field and the play is
// over where he lands: if the ball crosses the line, it is a first down (or a
// touchdown — the ball breaking the plane is the whole point of diving at the goal
// line); if he came up short, he is down short.
//
// ⚠️ IT HAS TO COST SOMETHING OR IT IS JUST FREE YARDS. A man stretched out
// horizontally has the ball away from his body, and a diver is easier to strip:
// the dive fumbles 18% of the time against 12% for an ordinary tackle (the Iron
// Grip gear and the weather count exactly as they do on any other fumble). So it
// is a real decision: if you are going to be tackled short anyway it is nearly free
// yards, and if you were going to break it, you just gave away a turnover chance.
//
// ⚠️ AND IT ONLY EXISTS WHERE IT MEANS SOMETHING. Not mid-field (a dive that gains
// a yard of nothing is a button you would tap every play), only within reach of a
// line that decides something. That is also why it pairs with 📏 the chains: dive
// and come up inches short and they bring them out.
//
// Nothing is saved. This file owns the rule; main.js's `dive()` throws the body and
// `endPlay` spots the ball.
// ============================================================
(function () {
  'use strict';

  const DIVE_PX = 18;        // how far the lunge goes (1.8 yards)
  const REACH_PX = 17;       // short by MORE than this and the dive cannot get there, so no button
  const CLOSING_PX = 62;     // a tackler this close is about to get you
  const STRIP = 0.18;        // a diver fumbles this often (an ordinary tackle: 0.12)

  // ---- the rule (pure, so every spot can be checked without a game) ---------------
  // c = { x, y } the runner; fdY = the first-down line in pixels (or null on goal-to-go);
  // goalY = the goal line in pixels (smaller y = further upfield); defenders = [{ x, y }].
  // Returns { available, kind: 'marker'|'goal'|null, short, nearest }.
  function status(c, fdY, goalY, defenders) {
    const none = { available: false, kind: null, short: 0, nearest: Infinity };
    if (!c) return none;
    let nearest = Infinity;
    for (const d of defenders || []) nearest = Math.min(nearest, Math.hypot(d.x - c.x, d.y - c.y));
    if (nearest > CLOSING_PX) return Object.assign(none, { nearest });
    // which line is within reach? The goal line wins a tie — that is the one worth six points.
    const toGoal = goalY != null ? c.y - goalY : Infinity;
    const toMark = fdY != null ? c.y - fdY : Infinity;
    if (toGoal > 0.5 && toGoal <= REACH_PX) return { available: true, kind: 'goal', short: toGoal, nearest };
    if (toMark > 0.5 && toMark <= REACH_PX) return { available: true, kind: 'marker', short: toMark, nearest };
    return Object.assign(none, { nearest });
  }

  // How likely the diver is to cough it up. `grip` is 🔒 Iron Grip (0..1), `wx` the weather multiplier.
  function stripChance(grip, wx) { return Math.min(0.6, STRIP * (1 - (grip || 0)) * (wx != null ? wx : 1)); }

  window.TDDive = { status, stripChance, DIVE_PX, REACH_PX, CLOSING_PX, STRIP };
})();
