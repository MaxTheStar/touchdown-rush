// ============================================================
// TOUCHDOWN FUN — churn.js: 💪 SECOND EFFORT (Round 27, pick ⑤)  window.TDChurn
// ------------------------------------------------------------
// The whistle used to end every run the instant a defender touched you. Now, once a QUARTER, when you are wrapped up on a SHORT run, there is a
// brief moment (0.4 seconds) where you can DRIVE YOUR LEGS: press SPACE (or the big HIKE button) and the pile moves forward, 1 to 3 yards, the
// sooner the better:    0-0.13s  +3 yds     0.13-0.26s  +2 yds     0.26-0.4s  +1 yd     no press: nothing, the play ends as it always did.
// ⚠️ SMALL ON PURPOSE: it only offers itself when the run gained 4 yards or less (a stuffed run, never a breakaway), only for a runner who is not the
// quarterback, only in a 1-player game, and ONCE A QUARTER, so it is at most about 4 times a game and cannot turn every run into a first down.
// ⚠️ IT DOES NOT TOUCH FUMBLES: main.js rolls the fumble BEFORE this moment, so a churn can neither cause nor prevent one.
// Reuses Space/HIKE, which is already the runner's move (no tiny button to chase). Nothing is saved. main.js: `TDChurn.start(done)` replaces the plain
// `endPlay('tackle')` in `checkTackle`, `pending()` freezes the runner while it is open.
// ============================================================
(function () {
  'use strict';
  const WINDOW_MS = 400, MAX_GAIN = 4;
  const TIERS = [[130, 3], [260, 2], [400, 1]];     // [pressed within ms, yards] at NORMAL
  // 🎯 THE WINDOW SETTING (Round 29, pick ②): Easy 1.5x (0.6s) / Normal 1x (0.4s, today) / Hard 0.75x (0.3s). It stretches or squeezes the TIMES only; the
  // yards (3 / 2 / 1) never change, so no setting is a free yard and Normal is byte-identical. Picked in ⚙️ Settings, read each time the moment opens.
  const SCALES = { easy: 1.5, normal: 1, hard: 0.75 };
  let scale = 1;
  const winMs = () => Math.round(WINDOW_MS * scale);
  let usedInQuarter = -1;     // the quarter number in which the one churn was spent
  let open = false, tapAt = null, t0 = 0, doneCb = null, timer = null;

  const td = () => window.__td || null;
  const G = () => { const t = td(); return t ? t.G : null; };

  // yards for a press `ms` after the wrap-up (pure); 0 = too late or no press
  function yardsFor(ms) {
    if (ms == null || ms < 0) return 0;
    for (const [lim, y] of TIERS) if (ms <= Math.round(lim * scale)) return y;
    return 0;
  }
  // may the moment be offered? ctx = { gain, isQB, twoPlayer, quarter }  (pure)
  function eligible(c) {
    if (!c || c.isQB || c.twoPlayer) return false;
    if (usedInQuarter === c.quarter) return false;
    return c.gain <= MAX_GAIN;
  }
  // called from checkTackle where the plain whistle was: returns true if the moment is open (it calls `done` itself later)
  function start(ctx, done) {
    if (open || !eligible(ctx) || typeof done !== 'function') return false;
    usedInQuarter = ctx.quarter;
    open = true; tapAt = null; doneCb = done; t0 = performance.now();
    try { td().sayComment('💪 WRAPPED UP! Drive your legs, hit SPACE!'); } catch (e) {}
    timer = setTimeout(finish, winMs());
    return true;
  }
  function tap() { if (open && tapAt == null) tapAt = performance.now() - t0; }
  function finish() {
    clearTimeout(timer); timer = null;
    if (!open) return;
    open = false;
    const y = yardsFor(tapAt), cb = doneCb; doneCb = null; tapAt = null;
    try { cb(y); } catch (e) { console.error(e); }
  }
  function newGame() { usedInQuarter = -1; open = false; tapAt = null; doneCb = null; clearTimeout(timer); timer = null; }

  function init() {
    if (!window.TDSettings) return;
    TDSettings.register({ id: 'churnwin', label: '🎯 Second effort window', type: 'choice', def: 'normal',
      hint: 'How long you have to drive the pile when wrapped up: 0.6s, 0.4s or 0.3s. The yards are the same.',
      options: [{ v: 'easy', label: 'Easy' }, { v: 'normal', label: 'Normal' }, { v: 'hard', label: 'Hard' }],
      onChange: v => { scale = SCALES[v] || 1; } });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  window.TDChurn = { start, tap, pending: () => open, eligible, yardsFor, newGame, WINDOW_MS, MAX_GAIN, TIERS, winMs, SCALES };
})();
