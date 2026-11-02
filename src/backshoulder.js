// ============================================================
// TOUCHDOWN FUN — backshoulder.js: 🎚 BACK-SHOULDER THROW (Round 24, pick ②)
// ------------------------------------------------------------
// A covered receiver with the defender trailing him (the man is behind him, chasing) used to
// get the same throw as everyone else. Real quarterbacks put it on the back shoulder, where only
// the receiver can reach it. There is NO new button: it happens on its own when the throw
// reaches a covered man who has the defender on his hip.
//
//   · the interception chance on the covered ball is cut to INT_KEEP of normal (0.55);
//   · the price is yards: the catch is made BACK_PX (14px, about 1.4 yards) short of where he
//     would have been, and he has no room to run (the defender is right there either way).
//
// ⚠️ NOT A FREE UPGRADE: it only applies when the defender TRAILS (his y is behind the receiver's),
// never when he is stepping in front of the route (a defender ahead of the man jumps the ball),
// and the catch is still the 🙌 jump-ball moment. Nothing is saved.
// main.js: `resolvePass` asks `TDBackShoulder.applies(wy, nearestD)` and keeps the answer in G.bShoulder.
// ============================================================
(function () {
  'use strict';
  const INT_KEEP = 0.55, BACK_PX = 14, TRAIL_PX = 6;
  // y grows toward our own end zone: a trailing defender has a LARGER y than the receiver.
  function applies(wy, d) { return !!d && d.s.y > wy + TRAIL_PX; }
  window.TDBackShoulder = { INT_KEEP, BACK_PX, TRAIL_PX, applies };
})();
