// ============================================================
// TOUCHDOWN FUN — lefty.js: 🤚 LEFT-HANDED MODE (Round 22, pick ②)
// ------------------------------------------------------------
// The D-pad is always on the left and the buttons on the right. A left-handed kid holds the phone the wrong way round.
// ⚙️ SETTINGS → 🤚 Left-handed swaps them: the D-pad goes right, the action pad goes left, and every side button (the columns at the edges of the
// screen — SNEAK, DRAW, JUKE, SLIDE, FAIR CATCH and the rest) swaps to the opposite edge.
//
// ⚠️ IT IS BUILT FROM THE REAL STYLES, NOT A SECOND COPY OF THEM. On first use this file reads the game's own style sheets, finds every fixed
// control that is pinned to the bottom or to the middle of a side edge, and writes a mirrored rule under `body.lefty` (left ↔ right, same value).
// Add a new button next round and it mirrors itself; there is no list to forget to update. The top rows (score, mute, the view button, the return
// calls) stay where they are — they are for reading, not for thumbs.
// ⚠️ A mirror is only safe if nothing lands on anything else, so the 375-wide overlap audit has to be clean in BOTH modes (DEVLOG v4.81).
// ============================================================
(function () {
  'use strict';
  let built = false;

  function isThumbRule(st) {
    if (st.position !== 'fixed') return false;
    if (!(st.left || st.right)) return false;
    const top = st.top || '', bottom = st.bottom || '';
    return /50%/.test(top) || (!!bottom && !top);            // the edge columns (top: calc(50% …)) and the bottom pads (bottom-pinned)
  }

  function build() {
    if (built) return; built = true;
    const out = [];
    const visit = rules => {
      for (const r of rules) {
        if (r.cssRules && !(r instanceof CSSStyleRule)) { visit(r.cssRules); continue; }   // media/supports blocks: look inside (their mirrors keep their own breakpoint below)
        if (!(r instanceof CSSStyleRule) || !r.selectorText || /body\.(lefty|menu|kicking|returning)/.test(r.selectorText)) continue;
        const st = r.style;
        if (!isThumbRule(st)) continue;
        const sel = r.selectorText.split(',').map(s => 'body.lefty ' + s.trim()).join(', ');
        const L = st.getPropertyValue('left'), R = st.getPropertyValue('right');
        let decl = '';
        if (L && !R) decl = 'left: auto !important; right: ' + L + ' !important;';
        else if (R && !L) decl = 'right: auto !important; left: ' + R + ' !important;';
        else continue;
        const wrap = r.parentRule && r.parentRule.conditionText ? '@media ' + r.parentRule.conditionText + ' { ' + sel + ' { ' + decl + ' } }' : sel + ' { ' + decl + ' }';
        out.push(wrap);
      }
    };
    for (const sh of Array.from(document.styleSheets)) { try { visit(sh.cssRules); } catch (e) { /* a cross-origin sheet: skip */ } }
    const el = document.createElement('style'); el.id = 'lefty-css'; el.textContent = out.join('\n'); document.head.appendChild(el);
    return out.length;
  }

  function apply(on) { if (on) build(); document.body.classList.toggle('lefty', !!on); }
  function init() { if (window.TDSettings) TDSettings.register({ id: 'lefty', label: '🤚 Left-handed', type: 'toggle', def: false,
    hint: 'Swap the D-pad and the buttons: the D-pad on the right, the action pad on the left.', onChange: v => { if (document.body) apply(v); else document.addEventListener('DOMContentLoaded', () => apply(v)); } }); }
  init();

  window.TDLefty = { apply, build, on: () => document.body.classList.contains('lefty'), _rules: () => (document.getElementById('lefty-css') || { textContent: '' }).textContent.split('\n').length };
})();
