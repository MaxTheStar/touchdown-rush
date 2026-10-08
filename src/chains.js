// ============================================================
// TOUCHDOWN FUN — chains.js: 📏 BRING OUT THE CHAINS (Round 16, pick ①)
// ------------------------------------------------------------
// Two things were missing, and the second one was a surprise.
//
// 1) ⚠️ THERE WAS NO FIRST-DOWN LINE ON THE FIELD. NOT ONE. The field drew yard
//    lines and yard numbers and nothing else: no line of scrimmage, no yellow
//    line, so "3RD & 4" meant counting numbers off the grass in your head. (The
//    little defense map has a first-down line; the real field never did.) Every
//    football broadcast paints two lines for exactly this reason:
//        🟦 BLUE    the line of scrimmage — where the ball is snapped from
//        🟨 YELLOW  the line to gain — get the ball past it for a first down
//    Now they are on the grass, under the players, from the huddle to the whistle.
//
// 2) A first down was a flat yes or no (`spot >= firstDownYards`), so a ball an
//    inch short and a ball three yards short got the same instant answer. When it
//    is REALLY close — inside 27 inches of the line either way — they stop and
//    bring out the chains, and for a second and a half the stadium holds its
//    breath: "📏 CHAINS OUT…" and then the verdict, in inches.
//
// ⚠️ THE ANSWER IS NEVER RANDOM AND NEVER CHANGES. The measurement reads the same
// `spot` the game was always going to use; it only makes you wait for it. A ball a
// hair past the line is still a first down and a hair short still is not — which
// is exactly why it is worth watching. (A dice-roll "measurement" would make the
// one moment that should be pure fact into the least trustworthy thing on screen.)
//
// ⚠️ IT STAYS OUT OF THE WAY OF THE REST OF THE DEAD BALL: no measurement in the
// no-huddle (the pace is the point), none for a touchdown or a goal-to-go (the
// goal line is not a chain), and if a penalty or a challenge is about to park the
// game the verdict is held back rather than shouted over the top of it.
//
// Nothing is saved. This file owns the lines and the verdict; main.js asks it
// what to paint each frame and whether a stopped ball was close.
// ============================================================
(function () {
  'use strict';

  const CLOSE_YDS = 0.75;      // 27 inches: closer than this to the line, either side, and they measure
  const HOLD_MS = 1500;        // how long the chains are out
  const INCHES = 36;

  let scene = null, gfx = null, label = null;
  let last = '';               // what is drawn right now (so a frame that changes nothing repaints nothing)
  let holdUntil = 0, holdFd = 0, holdSpot = 0, holdText = '';

  // ---- the verdict (pure, so every inch can be checked without a game) -----------
  // spot / fd are both in yards from YOUR goal line. Returns null unless it was close.
  function measure(spot, fd) {
    if (fd == null || fd >= 100 || spot == null) return null;      // goal-to-go: the goal line is not a chain
    const d = spot - fd;
    if (Math.abs(d) > CLOSE_YDS) return null;
    const made = d >= 0;                                           // the game's own rule, unchanged
    const inches = Math.round(Math.abs(d) * INCHES);
    const by = inches <= 1 ? 'BY AN INCH!' : inches === 0 ? 'DEAD EVEN' : 'BY ' + inches + ' INCHES';
    return {
      made, inches,
      line1: made ? 'FIRST DOWN!' : 'SHORT!',
      line2: (inches === 0 && made) ? 'DEAD EVEN' : by,
    };
  }

  // ---- the two lines on the grass --------------------------------------------------
  // Called once from main.js's create(): the lines belong to the field's scene.
  function attach(sc) {
    scene = sc;
    gfx = sc.add.graphics().setDepth(1.5);          // above the turf, BELOW every player
    label = sc.add.text(0, 0, '', { fontFamily: 'Arial Black, Arial', fontSize: '15px', color: '#fff3a0',
      stroke: '#000', strokeThickness: 4 }).setOrigin(0.5, 1).setDepth(26).setVisible(false);
  }

  // Called every frame from updateHUD. `s` = { on, losY, fdY, w }. Repaints only on a change.
  function sync(s) {
    if (!gfx) return;
    const holding = holdUntil > (scene ? scene.time.now : 0);
    const on = !!(s && s.on) || holding;
    if (!on || !s || s.losY == null) {
      if (last !== 'off') { gfx.clear(); label.setVisible(false); last = 'off'; }
      return;
    }
    const key = [s.losY, s.fdY, s.w, holding ? 1 : 0].join('|');
    if (key === last) return;
    last = key;
    gfx.clear();
    // 🟨 the line to gain — a soft glow, then the line itself (none on goal-to-go)
    if (s.fdY != null) {
      gfx.lineStyle(9, 0xffd60a, 0.20); gfx.beginPath(); gfx.moveTo(0, s.fdY); gfx.lineTo(s.w, s.fdY); gfx.strokePath();
      gfx.lineStyle(3, 0xffd60a, 0.95); gfx.beginPath(); gfx.moveTo(0, s.fdY); gfx.lineTo(s.w, s.fdY); gfx.strokePath();
    }
    // 🟦 the line of scrimmage
    gfx.lineStyle(7, 0x2e9bff, 0.18); gfx.beginPath(); gfx.moveTo(0, s.losY); gfx.lineTo(s.w, s.losY); gfx.strokePath();
    gfx.lineStyle(2.5, 0x2e9bff, 0.9);  gfx.beginPath(); gfx.moveTo(0, s.losY); gfx.lineTo(s.w, s.losY); gfx.strokePath();
    // 📏 while the chains are out: a bright tick where the ball is, and the verdict's inches on the line
    if (holding && s.fdY != null) {
      const y = holdSpot;
      gfx.lineStyle(4, 0xffffff, 1); gfx.beginPath(); gfx.moveTo(s.w / 2 - 26, y); gfx.lineTo(s.w / 2 + 26, y); gfx.strokePath();
      label.setPosition(s.w / 2, Math.min(y, s.fdY) - 6).setText(holdText).setVisible(true);
    } else label.setVisible(false);
  }

  // The chains come out. `spotY`/`fdY` are pixel rows; `text` is what to print on the field.
  function hold(spotY, text) { holdUntil = (scene ? scene.time.now : 0) + HOLD_MS; holdSpot = spotY; holdText = text; last = ''; }
  function holding() { return !!scene && holdUntil > scene.time.now; }

  window.TDChains = { measure, attach, sync, hold, holding, HOLD_MS, CLOSE_YDS };
})();
