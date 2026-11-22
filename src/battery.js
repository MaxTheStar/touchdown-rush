// ============================================================
// TOUCHDOWN FUN — battery.js: 🔋 BATTERY SAVER (Round 28, pick ⑤)  window.TDSaver
// ------------------------------------------------------------
// The game already trims its showy effects for a device set to "reduce motion" (the camera shake and flash in juice.js, the turf spray in bighit.js,
// the confetti in celebration.js, the flying coins in shop.js), but only when the PHONE says so, and nobody finds that setting. A ⚙️ Settings switch now
// turns the SAME trimming on by hand: those four places ask `TDSaver.on()` as well as the device setting. OFF by default, so today's game is unchanged.
// ⚠️ EFFECTS ONLY, NEVER GAMEPLAY: the places it touches are the shake, the screen flash, the turf spray, the touchdown confetti and the coin burst. No
// speed, timing, physics or rule reads it.
// ⚠️ THE CHART ALSO PROMISED A FRAME-RATE CAP, AND IT IS NOT BUILT, ON PURPOSE: the plays are tuned on frame steps (the sack arrives at ~0.93s, the
// 400ms second effort, the 0.4s jump-ball tiers), and I could not verify a 30fps game plays the same, so gameplay timing was not put at risk for battery.
// Saved by ⚙️ Settings ('tdr-settings').
// ============================================================
(function () {
  'use strict';
  let saver = false;
  function init() {
    if (!window.TDSettings) return;
    TDSettings.register({ id: 'saver', label: '🔋 Battery saver', type: 'toggle', def: false,
      hint: 'Fewer shakes, flashes and confetti. The game plays exactly the same.', onChange: v => { saver = !!v; } });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  window.TDSaver = { on: () => saver };
})();
