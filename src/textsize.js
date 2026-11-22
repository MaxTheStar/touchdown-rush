// ============================================================
// TOUCHDOWN FUN — textsize.js: 🔠 TEXT SIZE (Round 28, pick ①)  window.TDTextSize
// ------------------------------------------------------------
// Every word in the game was one size, and on a small phone some of it is tiny. A Normal / Large / Extra Large row in ⚙️ Settings now scales the
// READING text: every pop-up card (season, team, shop, trophy case, stadium, box score, scouting report, ...) and the 4th-down panel.
//     Normal ×1 (today, byte-identical)    Large ×1.12    Extra Large ×1.25
// It is a body class (`ts-1` / `ts-2`) plus one CSS rule each (`zoom` on `.ov-card`, `#fourth-down`), so it cannot touch a game rule.
// ⚠️ WHAT IT DOES NOT SCALE: the live scoreboard and the on-field buttons. They sit at fixed pixel positions around the field (the in-game bar, the
// D-pad, the edge buttons all measured against 375 wide in earlier rounds), so enlarging them would push buttons into each other. Say so plainly.
// ⚠️ The pop-up cards are capped to the screen height at every size (see the CSS) so a bigger card scrolls instead of running off the bottom.
// Saved by the ⚙️ Settings hub ('tdr-settings'); a missing hub or a bad value just means Normal.
// ============================================================
(function () {
  'use strict';
  const CLASSES = ['ts-1', 'ts-2'];
  function apply(v) {
    const b = document.body; if (!b) return;
    CLASSES.forEach(c => b.classList.remove(c));
    if (v === 'large') b.classList.add('ts-1');
    else if (v === 'xl') b.classList.add('ts-2');
  }
  function init() {
    if (!window.TDSettings) return;
    TDSettings.register({ id: 'textsize', label: '🔠 Text size', type: 'choice', def: 'normal',
      hint: 'Bigger words in the pop-up cards. The scoreboard and field buttons stay put.',
      options: [{ v: 'normal', label: 'Normal' }, { v: 'large', label: 'Large' }, { v: 'xl', label: 'Extra' }], onChange: apply });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  window.TDTextSize = { apply };
})();
