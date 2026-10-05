// ============================================================
// TOUCHDOWN FUN — pitch.js: 🔄 THE PITCH
// ------------------------------------------------------------
// You are running out of room at the edge. Pitch it out to the man trailing you
// and he takes it the rest of the way — option football, and the most fun two
// players can have with one ball.
//
// A pitch is a LATERAL: it has to go sideways or BACKWARDS, never forward, so the
// only man you can pitch to is one who is level with you or behind you. (The game
// already had one backwards throw — the halfback pass — but nothing a runner could
// do in the open field.)
//
// ⚠️ WHAT MAKES IT WORTH DOING IS THAT IT CAN GO WRONG. A pitch nobody catches is
// a LIVE BALL — it is not an incomplete pass, there is no whistle, and the
// defense can fall on it as easily as you can. That is the same race v4.8/v4.9
// built for the muffed punt (the ball squirts past the man, you chase it, first
// to reach it wins), plugged into a second place. So the question is never
// "is a pitch good?" — it is "is the man trailing you CLEAN?": a pitch to a man
// with a defender on his hip is a turnover waiting to happen, and a pitch to a man
// with room is a fresh runner and a defense that just chased the wrong guy.
//
// This file is the BRAIN and stays pure (who can I pitch to, how risky is it?) so
// every number below can be checked without playing a down. main.js owns the
// ball in flight and the scramble, exactly as it does for a pass and a muff.
// ============================================================
(function () {
  const RANGE      = 135;   // px — a pitch is a short toss, not a throw
  const LEVEL_SLOP = 8;     // px — "level with you" still counts as sideways
  const BASE_DROP  = 0.05;  // a clean pitch to a man with room
  const PRESSURE   = 62;    // px — a defender this close is on his hip
  const PRESSURE_ADD = 0.16;
  const FAR_AT     = 95;    // px — long pitches are harder to handle…
  const FAR_ADD    = 0.06;
  const MAX_DROP   = 0.45;  // …but never hopeless, even in a blizzard

  // Who can take a pitch from `c`? Every candidate is { i, x, y }, already
  // filtered to the men who are eligible at all (not blocking, not a lineman).
  // Returns the NEAREST legal one, or null. Legal = level or behind, in range.
  // (On this field the offense runs UP the screen, so "behind" means a larger y.)
  function pick(c, cands) {
    let best = null, bd = Infinity;
    for (const t of cands || []) {
      if (t.y < c.y - LEVEL_SLOP) continue;            // ahead of the ball = forward = illegal
      const d = Math.hypot(t.x - c.x, t.y - c.y);
      if (d > RANGE || d < 6) continue;
      if (d < bd) { bd = d; best = t; }
    }
    return best ? { i: best.i, x: best.x, y: best.y, dist: bd } : null;
  }

  // How likely is the receiver to fumble it? `defDist` = how far the nearest
  // defender is from HIM when it arrives. `sure` = a ⭐ Sure Hands trait bonus
  // (traits.js), `wx` = the 🌦 weather's fumble multiplier.
  function dropChance(o) {
    o = o || {};
    let p = BASE_DROP;
    if (o.defDist != null && o.defDist < PRESSURE) {
      // the closer the defender, the worse it is (full add at 0px, none at the edge)
      p += PRESSURE_ADD * (1 - o.defDist / PRESSURE) * 0.5 + PRESSURE_ADD * 0.5;
    }
    if ((o.dist || 0) > FAR_AT) p += FAR_ADD;
    p -= (o.sure || 0) * 0.6;
    p *= (o.wx != null ? o.wx : 1);
    return Math.max(0.01, Math.min(MAX_DROP, p));
  }

  window.TDPitch = { pick, dropChance, RANGE };
})();
