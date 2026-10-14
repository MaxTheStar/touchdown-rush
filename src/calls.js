// ============================================================
// TOUCHDOWN FUN — calls.js: 📋 THE SPECIAL-CALL BUTTON (Round 19)
// ------------------------------------------------------------
// By Round 19 the pre-snap sides of the screen were out of room: four fakes (draw, screen,
// play action, bootleg) each have a button of their own, and at 375x812 the next one would
// have landed on the D-pad. So the formations that CHANGE WHO HAS THE BALL — the wildcat, the
// jet sweep, the read option — share ONE button that cycles through what is on offer:
//
//        OFF  →  🐺 WILDCAT  →  ✈️ JET SWEEP  →  🎯 OPTION  →  OFF …
//
// Each call registers itself ({ id, icon, label, can(), arm(), disarm(), afterSnap(), newPlay() })
// and shows up in the cycle only while it can be called. Calling any of the four older fakes clears this
// one, and arming this one clears them: a down is exactly one call.
//
// Nothing is saved. This file owns the cycle; each call file owns its rules.
// ============================================================
(function () {
  'use strict';

  const $ = id => document.getElementById(id);
  const items = [];
  let cur = -1;                                   // index into `items` of the armed call, or -1

  const td = () => window.__td || null;
  const G  = () => { const t = td(); return t ? t.G : null; };

  function register(it) { items.push(it); }

  function clearOthers() {                        // one call a down
    if (window.TDDraw && TDDraw.armed()) TDDraw.toggle();
    if (window.TDScreen && TDScreen.armed()) TDScreen.toggle();
    if (window.TDPA && TDPA.armed()) TDPA.toggle();
    if (window.TDBoot && TDBoot.armed()) TDBoot.toggle();
  }

  // Take the armed call off (called by the older fakes when THEY are armed, and at every new play).
  function clear() {
    if (cur >= 0) { try { items[cur].disarm(); } catch (e) {} cur = -1; }
    paint();
  }

  // Tap: move to the next call that can be made, or back to OFF.
  function cycle() {
    const g = G(); if (!g || g.state !== 'presnap') return;
    const was = cur;
    if (cur >= 0) { try { items[cur].disarm(); } catch (e) {} }
    let n = was;
    for (let k = 0; k < items.length; k++) {
      n = (n + 1);
      if (n >= items.length) { n = -1; break; }
      if (items[n].can()) break;
      if (k === items.length - 1) n = -1;
    }
    cur = n;
    if (cur >= 0) { clearOthers(); try { items[cur].arm(); } catch (e) { cur = -1; } }
    paint();
  }

  function afterSnap() { if (cur >= 0) { try { items[cur].afterSnap(); } catch (e) { console.error(e); } } }
  function newPlay()   { if (cur >= 0) { try { items[cur].disarm(); } catch (e) {} } cur = -1; items.forEach(i => { try { i.newPlay && i.newPlay(); } catch (e) {} }); paint(); }
  const armedId = () => (cur >= 0 ? items[cur].id : null);

  function paint() {
    const b = $('btn-calls'); if (!b) return;
    const g = G();
    const show = !!(g && g.state === 'presnap' && g.team && items.length);
    b.style.display = show ? 'flex' : 'none';
    b.classList.toggle('armed', cur >= 0);
    const ic = b.querySelector('.cl-ic'), small = b.querySelector('small');
    if (cur >= 0) { if (ic) ic.textContent = items[cur].icon; if (small) small.textContent = items[cur].label + ' ✓'; }
    else { if (ic) ic.textContent = '📋'; if (small) small.textContent = 'SPECIAL'; }
  }

  function wire() {
    const b = $('btn-calls');
    if (b) b.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); cycle(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire);
  else wire();

  window.TDCalls = { register, cycle, clear, afterSnap, newPlay, paint, armedId, _items: items };
})();
