// ============================================================
// TOUCHDOWN FUN — gamelen.js: ⏱ GAME LENGTH (Round 28, pick ③)  window.TDGameLen
// ------------------------------------------------------------
// Every quarter was 2:30 whether you had ten minutes or two. A Short / Normal / Long row in ⚙️ Settings sets the quarter length for EXHIBITION games:
//     Short  1:30 a quarter      Normal  2:30 (today)      Long  4:00
// ⚠️ EXHIBITION GAMES ONLY: a season, playoff, rival, Maxwell, drill or all-star game is always the standard 2:30 (main.js `beginGame` asks), so the league,
// the standings and every record stay on one yardstick. ⚠️ Normal is byte-identical (G.qSecs is 150, the constant it always was).
// ⚠️ THE OTHER CLOCK RULES ARE TUNED FOR 2:30: the 🕑 two-minute warning is skipped in a Short game (the whole quarter is under 2:00), the ⏰ hurry-up and
// ⏱ spike windows (17 to 96 seconds) cover more of a Short quarter, and a ▶ resumed game is only offered for standard-length games. Nothing here
// changes the number of quarters. The length is read when a game BEGINS, so changing it never moves a game already on the field. Saved by ⚙️ Settings.
// ============================================================
(function () {
  'use strict';
  const SECS = { short: 90, normal: 150, long: 240 };
  let mode = 'normal';
  const seconds = () => SECS[mode] || 150;
  function init() {
    if (!window.TDSettings) return;
    TDSettings.register({ id: 'glen', label: '⏱ Game length', type: 'choice', def: 'normal',
      hint: 'Quarter length for exhibition games: 1:30, 2:30 or 4:00. Season and playoff games stay 2:30.',
      options: [{ v: 'short', label: 'Short' }, { v: 'normal', label: 'Normal' }, { v: 'long', label: 'Long' }],
      onChange: v => { mode = SECS[v] ? v : 'normal'; } });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  window.TDGameLen = { seconds, SECS, mode: () => mode };
})();
