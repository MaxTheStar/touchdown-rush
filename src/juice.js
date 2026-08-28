// ============================================================
// TOUCHDOWN FUN — juice.js: the FEEL of the game 🎉
// ------------------------------------------------------------
// "Juice" is what game makers call the little bursts of life that
// happen when something big happens: the screen kicks, confetti flies,
// a puff of turf sprays where the tackle landed. None of it changes a
// single rule of football — you don't score more, you don't run faster.
// It just makes a touchdown FEEL like a touchdown.
//
// It matters more than it sounds. A game where scoring is a silent
// text banner feels flat; the same game with a screen-kick and confetti
// feels finished. Game portals grade exactly this ("the game responds
// to the player's actions"), and it's the cheapest polish there is.
//
// main.js only ever calls these three, and every one is safe to call:
//   TDJuice.touchdown(scene, x, y)  — the big one: kick, flash, confetti
//   TDJuice.bigHit(scene, x, y)     — a tackle or a sack: small kick + turf
//   TDJuice.pickup(scene, x, y)     — a catch or a takeaway: a quick ring
//
// If anything is missing (no scene yet, no camera) the calls quietly do
// nothing, so they can never break a play.
//
// ♿ If your computer is set to "reduce motion", the screen never shakes
// and the flash is skipped — the confetti still falls, gently.
// ============================================================
(function () {
  'use strict';

  let REDUCED = false;
  try { REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  // Party colours — the game's gold, the two team cyans/reds, a green.
  const CONFETTI = [0xffd60a, 0x2ee6ff, 0xff5b5b, 0x5cff9d, 0xffffff];

  // Everything we spawn sits just above the players (depth 5-6) but below
  // the banners and the HUD (30+), so it never covers the words.
  const FX_DEPTH = 9;

  function camOf(scene) {
    return (scene && scene.cameras && scene.cameras.main) ? scene.cameras.main : null;
  }

  // A short, sharp camera kick. `amount` is a fraction of the screen, so
  // 0.01 is a 1% nudge — enough to feel, small enough to stay readable.
  function shake(scene, ms, amount) {
    if (REDUCED) return;
    const cam = camOf(scene);
    if (cam && cam.shake) cam.shake(ms, amount);
  }

  function flash(scene, ms, r, g, b) {
    if (REDUCED) return;
    const cam = camOf(scene);
    if (cam && cam.flash) cam.flash(ms, r, g, b);
  }

  // Throw a handful of little shapes out from a point and fade them away.
  // Each one gets its own direction, distance and spin so it never looks
  // like a repeating pattern.
  function spray(scene, x, y, opts) {
    if (!scene || !scene.add || !scene.tweens) return;
    const n      = opts.count;
    const colors = opts.colors;
    const spin   = opts.spin;

    for (let i = 0; i < n; i++) {
      // Fan the pieces around a circle, with a little randomness so the
      // ring doesn't look mechanical.
      const ang  = (Math.PI * 2 * i / n) + (Math.random() - 0.5) * 0.6;
      const dist = opts.dist * (0.55 + Math.random() * 0.75);
      const size = opts.size * (0.7 + Math.random() * 0.7);
      const col  = colors[(Math.random() * colors.length) | 0];

      const p = opts.round
        ? scene.add.circle(x, y, size * 0.5, col, 1)
        : scene.add.rectangle(x, y, size, size * 1.6, col, 1);
      p.setDepth(FX_DEPTH);

      scene.tweens.add({
        targets: p,
        x: x + Math.cos(ang) * dist,
        // a touch of "gravity": pieces drift down as well as out
        y: y + Math.sin(ang) * dist + (opts.fall || 0),
        angle: spin ? (Math.random() * 720 - 360) : 0,
        alpha: 0,
        scale: opts.shrink ? 0.2 : 1,
        duration: opts.ms * (0.75 + Math.random() * 0.5),
        ease: 'Cubic.Out',
        onComplete: function () { p.destroy(); }
      });
    }
  }

  // An expanding ring — the classic "something good happened here" mark.
  function ring(scene, x, y, color, radius, ms) {
    if (!scene || !scene.add || !scene.tweens) return;
    const c = scene.add.circle(x, y, 6).setStrokeStyle(3, color, 1)
      .setFillStyle(0, 0).setDepth(FX_DEPTH);
    scene.tweens.add({
      targets: c, scale: radius / 6, alpha: 0, duration: ms, ease: 'Cubic.Out',
      onComplete: function () { c.destroy(); }
    });
  }

  // ---- 🏈 TOUCHDOWN — the big moment -------------------------------------
  function touchdown(scene, x, y) {
    if (!scene) return;
    shake(scene, 340, 0.011);
    flash(scene, 180, 255, 214, 10);          // a warm gold blink
    ring(scene, x, y, 0xffd60a, 90, 520);
    spray(scene, x, y, {
      count: 26, colors: CONFETTI, dist: 120, size: 7, ms: 900,
      spin: true, fall: 70, round: false, shrink: false
    });
  }

  // ---- 💥 A TACKLE or a SACK ---------------------------------------------
  function bigHit(scene, x, y) {
    if (!scene) return;
    shake(scene, 130, 0.006);
    spray(scene, x, y, {
      // turf and dust, so it reads as a hit on grass
      count: 10, colors: [0xdfe9d8, 0xbfd4b4, 0x8fae86], dist: 46, size: 5,
      ms: 420, spin: false, fall: 14, round: true, shrink: true
    });
  }

  // ---- 🙌 A CATCH or a TAKEAWAY ------------------------------------------
  function pickup(scene, x, y) {
    if (!scene) return;
    ring(scene, x, y, 0x2ee6ff, 54, 360);
  }

  window.TDJuice = { touchdown, bigHit, pickup };
})();
