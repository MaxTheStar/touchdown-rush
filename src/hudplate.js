// ============================================================
// TOUCHDOWN FUN — hudplate.js: 🔲 SCOREBOARD BACKING (Round 30, pick ⑦ REPLACED Bigger Scoreboard)  window.TDHudPlate
// ------------------------------------------------------------
// ⚠️ THE ORIGINAL PICK WAS NOT POSSIBLE: "scale the scoreboard text" assumed there was room. There is not: the four rows (score, clock, down, spot) fill y 10-96
// and the in-game button row starts at y 104 from x 84, so even 15% bigger text runs straight into the buttons (the very reason Round 28 left the HUD alone).
// What a small, hard-to-read scoreboard really needs is CONTRAST, not size, so this puts a dark plate behind each row. The plate is made of `background` plus a
// `box-shadow` SPREAD only (neither changes layout), so no row moves or resizes at all. ⚙️ Settings switch, default OFF; Normal is byte-identical. One body class
// (`hudplate`), one CSS rule in index.html. Nothing else reads it. Saved by ⚙️ Settings.
// ============================================================
(function () {
  'use strict';
  function apply(v) { if (document.body) document.body.classList.toggle('hudplate', !!v); }
  function init() {
    if (!window.TDSettings) return;
    TDSettings.register({ id: 'hudplate', label: '🔲 Scoreboard backing', type: 'toggle', def: false,
      hint: 'A dark plate behind the score, clock and down so they are easier to read over the field.', onChange: apply });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  window.TDHudPlate = { apply };
})();
