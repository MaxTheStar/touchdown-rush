// ============================================================
// TOUCHDOWN FUN — rookie.js: 🧒 ROOKIE MODE (Round 22, pick ⑦)
// ------------------------------------------------------------
// Thirty-one buttons is a lot to be handed on the first day. Rookie mode hides the extra ones, in two steps, so a new player sees only what
// football needs and can ask for more when they are ready:
//
//     🧒 ROOKIE  — only the core: snap, throw, hand-off, timeout, pause and the rescue buttons that appear only when they matter
//     ➕ MORE    — adds the everyday decisions (formation, audible, sneak, lob, pump fake, juke, hot route, hurry-up)
//     🏈 FULL    — everything, as the game has always been  (THE DEFAULT: nobody's game changes unless they choose it)
//
// ⚠️ It only HIDES buttons; it never changes how the game plays. Nothing the game REQUIRES is ever hidden: the snap, passing, the hand-off,
// the d-pad, timeout and pause are not in the list at all, and every button that is the only answer to a situation (spike / kneel, fair
// catch, touchback, hail mary, throw away, slide, dive, pitch) is tier 0 — the tiers live in guide.js, the same list the 📖 Button Guide
// reads, so a button can not be hidden here without the guide saying why it is missing.
// Reversible any time: ⚙️ SETTINGS → BUTTONS.
// ============================================================
(function () {
  'use strict';
  function css() {
    const L = window.TDGuide ? TDGuide._list() : [];
    const sel = t => L.filter(r => r[5] >= t).map(r => 'body.rk-hide-' + t + ' #' + r[0]);
    let st = document.getElementById('rookie-css');
    if (!st) { st = document.createElement('style'); st.id = 'rookie-css'; document.head.appendChild(st); }
    st.textContent = [1, 2].map(t => sel(t).join(',\n') + ' { display: none !important; }').join('\n');
  }
  function apply(v) {
    document.body.classList.toggle('rk-hide-1', v === 'rookie');
    document.body.classList.toggle('rk-hide-2', v === 'rookie' || v === 'more');
  }
  function install() {
    css();
    if (!window.TDSettings) return;
    TDSettings.register({
      id: 'rookie', label: '🧒 Buttons', def: 'full', type: 'choice',
      hint: 'ROOKIE hides the extra buttons. MORE adds the everyday ones. FULL is everything.',
      options: [{ v: 'rookie', label: '🧒 ROOKIE' }, { v: 'more', label: '➕ MORE' }, { v: 'full', label: '🏈 FULL' }],
      onChange: apply
    });
  }
  if (document.body) install(); else document.addEventListener('DOMContentLoaded', install);
  window.TDRookie = { apply, css };
})();
