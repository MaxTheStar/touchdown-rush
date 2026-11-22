// ============================================================
// TOUCHDOWN FUN — gamepad.js: 🎮 CONTROLLER SUPPORT (Round 28, pick ⑧)  window.TDPad
// ------------------------------------------------------------
// Only fingers and a keyboard could play it. A Bluetooth or USB controller (the browser's standard Gamepad layout: Xbox, PlayStation, Switch Pro, most others)
// now drives the same things the on-screen buttons and keys do. It does NOT add new game rules: it only sets the SAME `touch` flags the buttons set, so
// every rule, guard and timing is exactly the one a finger would hit.
//     Left stick / D-pad   move the runner (and ← → pick a team on the front screen)
//     A  (bottom)          HIKE / snap  ·  on the front screen START  ·  on the final screen back to the menu  ·  4th down: ① PLAY 4TH DOWN
//     B  (right)           the runner's move, same as E (hurdle / juke, drives the legs on a second effort)  ·  4th down: ② kick / punt
//     X  (left)            dive for the marker  ·  4th down: ③ fake
//     Y  (top)             hand it off  ·  4th down: ④ QB sneak
//     LB / RB / RT         throw to receiver 1 / 2 / 3          LT  pitch          Back/Select  throw it away  ·  4th down: take a safety
//     L3 (stick click)     QB slide                              R3  pump fake      Start  pause / resume
// 🎮 POP-UPS (Round 29): while any pop-up is open (Season, Settings, the pause card, the scouting card, the speech and mercy cards...) the stick/D-pad moves a
//    gold highlight between its buttons (it starts on the primary one, such as LET'S PLAY), A presses the highlighted button, B closes the pop-up, Start still
//    resumes a paused game; the field gets no input meanwhile.
// ⚠️ WHAT I COULD NOT TEST: there is no controller on this computer, so this was checked against the browser's real Gamepad API with a STAND-IN pad object
//    (a fake `navigator.getGamepads()`), not a physical one. Button numbers follow the W3C "standard" mapping; an odd controller that does not report it may
//    have its buttons on different numbers. Say so plainly.
// ⚠️ NEVER BLOCKS THE FINGERS: the touch controls and keys work exactly as before; a controller only ADDS. Off with no controller plugged in (it only
//    polls once a controller has announced itself). A ⚙️ Settings switch turns it off. Nothing is saved except that switch.
// ============================================================
(function () {
  'use strict';
  const DZ = 0.4;
  const td = () => window.__td || null;
  let enabled = true, running = false, prev = [], navAt = 0, hadDir = false;

  function pad() {
    try { const ps = navigator.getGamepads ? navigator.getGamepads() : []; for (const p of ps) if (p && p.connected) return p; } catch (e) {}
    return null;
  }
  const down = (p, i) => !!(p.buttons[i] && (p.buttons[i].pressed || p.buttons[i].value > 0.5));
  function edge(p, i) { const d = down(p, i); const e = d && !prev[i]; return e; }
  const visible = id => { const el = document.getElementById(id); return !!el && getComputedStyle(el).display !== 'none'; };
  const press = id => { const el = document.getElementById(id); if (el) el.dispatchEvent(new Event('pointerdown', { bubbles: true, cancelable: true })); };
  const overlayOpen = () => [...document.querySelectorAll('.ov')].some(o => o.style.display === 'flex' || getComputedStyle(o).display === 'flex');

  // ---- 🎮 POP-UPS (Round 29, pick ⑧): a controller could play a drive but never open the Season screen, answer a card or close anything. While any
  // pop-up is open the stick/D-pad moves a gold highlight between its buttons, A presses the highlighted one, B closes the pop-up. The game itself gets
  // no input meanwhile (a pop-up is a pause for the fingers too). The highlight starts on the pop-up's PRIMARY button (`.yes`, e.g. LET'S PLAY) when it has one.
  const OVERLAYS = '.ov, #sp-panel, #mr-panel, #ha-panel, #sc-modal, #toss-panel';   // #toss-panel = the coin toss card (found by the final check: it is not an .ov, and G.state stays 'menu' under it)
  const FOCUSABLE = '.ov-btn, .st-sw, .st-op, [data-act], [data-a], [data-pred], [data-ct], .dr-mini, .dr-tab, button, .choice, .ts-btn, .ts-opt';   // .ts-* = the coin toss card
  const isPrimary = e => e.classList.contains('yes') || e.classList.contains('go');
  const shown = el => { if (!el) return false; const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden') return false; const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
  function topOverlay() {
    let best = null, bz = -1;
    document.querySelectorAll(OVERLAYS).forEach((el, i) => { if (!shown(el) || el.closest('#hud')) return; const z = (parseInt(getComputedStyle(el).zIndex, 10) || 0) * 1000 + i; if (z >= bz) { bz = z; best = el; } });
    return best;
  }
  const focusables = ov => [...ov.querySelectorAll(FOCUSABLE)].filter(e => shown(e) && !e.closest('[disabled]'));
  let focusEl = null, focusIdx = -1, navDirAt = 0, styled = false;
  function styleOnce() {
    if (styled) return; styled = true;
    const st = document.createElement('style'); st.textContent = '.pad-focus{outline:3px solid #ffd60a !important;outline-offset:2px;box-shadow:0 0 14px rgba(255,214,10,.8) !important}';
    document.head.appendChild(st);
  }
  function setFocus(el) { if (focusEl && focusEl !== el) focusEl.classList.remove('pad-focus'); focusEl = el; if (el) { styleOnce(); el.classList.add('pad-focus'); try { el.scrollIntoView({ block: 'nearest' }); } catch (e) {} } }
  function clearFocus() { if (focusEl) focusEl.classList.remove('pad-focus'); focusEl = null; focusIdx = -1; }
  function overlayStep(ov, dir) {
    const f = focusables(ov); if (!f.length) return;
    let i = f.indexOf(focusEl);
    if (i < 0) { const prim = f.findIndex(isPrimary); i = prim >= 0 ? prim : 0; if (!dir) { setFocus(f[i]); return; } }
    else i = (i + dir + f.length) % f.length;
    focusIdx = i; setFocus(f[i]);
  }
  function overlayPress(ov) {
    const f = focusables(ov); const el = (focusEl && f.indexOf(focusEl) >= 0) ? focusEl : (f.find(isPrimary) || f[0]);
    if (!el) return;
    focusIdx = f.indexOf(el);
    el.dispatchEvent(new Event('pointerdown', { bubbles: true, cancelable: true }));
    if (typeof el.onclick === 'function') el.click();
    // many pop-ups REBUILD their buttons when one is pressed (the settings rows, the season screen): the highlighted element is then a detached copy.
    // Put the highlight back on the same POSITION in the new list so a second A press hits the same switch, not the first one.
    if (focusEl && !focusEl.isConnected && focusIdx >= 0) { const f2 = focusables(ov); if (f2.length) setFocus(f2[Math.min(focusIdx, f2.length - 1)]); }
  }
  function overlayClose(ov) {
    const c = ov.querySelector('[id$="-close"]') || focusables(ov).find(e => /^\W*(close|done|back|ok|cancel|keep playing|skip|no|resume)\b/i.test(e.textContent.trim()));
    if (c) { c.dispatchEvent(new Event('pointerdown', { bubbles: true, cancelable: true })); if (typeof c.onclick === 'function') c.click(); }
  }
  // returns true if a pop-up took this frame's input
  function overlayFrame(p, A, B, L, R, U, D) {
    const ov = topOverlay();
    if (!ov) { clearFocus(); return false; }
    // Start still resumes a paused game (the pause card is itself a pop-up, so it would otherwise swallow the button that opened it)
    if (edge(p, 9) && window.TDPause && TDPause.isPaused && TDPause.isPaused()) { try { TDPause.resume(); } catch (e) {} return true; }
    if (focusEl && !focusEl.isConnected && focusIdx >= 0) { const f3 = focusables(ov); if (f3.length) setFocus(f3[Math.min(focusIdx, f3.length - 1)]); }   // a rebuild between frames
    if (focusEl && !ov.contains(focusEl)) clearFocus();
    if (!focusEl) overlayStep(ov, 0);
    const now = performance.now(), dir = (L || U) ? -1 : (R || D) ? 1 : 0;
    if (dir && now - navDirAt > 230) { navDirAt = now; overlayStep(ov, dir); }
    if (!dir) navDirAt = 0;
    if (A) overlayPress(ov); else if (B) overlayClose(ov);
    return true;
  }

  // one frame of input (also callable by hand for tests)
  function poll() {
    const t = td(), p = pad();
    if (!t || !t.G || !p) return false;
    if (!enabled) { release(t); prev = p.buttons.map(b => !!b.pressed); return false; }
    const G = t.G, touch = t.touch;
    const ax = p.axes[0] || 0, ay = p.axes[1] || 0;
    const L = ax < -DZ || down(p, 14), R = ax > DZ || down(p, 15), U = ay < -DZ || down(p, 12), D = ay > DZ || down(p, 13);
    const A = edge(p, 0), B = edge(p, 1), X = edge(p, 2), Y = edge(p, 3);
    // ---- a pop-up is open: the pad drives IT, and nothing else gets input ----
    if (overlayFrame(p, A, B, L, R, U, D)) { release(t); keep(p); return true; }
    // ---- menus first: a pad must be able to start and leave a game ----
    if (G.state === 'menu') {
      release(t);
      const now = performance.now();
      if ((L || R) && now - navAt > 280) { navAt = now; if (t.menuNav) t.menuNav(L ? -1 : 1); }
      // ⚠️ START ONLY FROM THE REAL FRONT SCREEN (body.menu). G.state is ALSO 'menu' while the scouting card and the coin toss hold the kickoff, and without this guard
      // an A press on one of those restarted the whole game (the final verification caught it: scouting card, toss, new game, scouting card, forever).
      if (A && !overlayOpen() && document.body.classList.contains('menu') && t.startGameWithTeam) t.startGameWithTeam();
      keep(p); return true;
    }
    if (G.state === 'gameover') { release(t); if (A && t.returnToMenuFromGameOver) t.returnToMenuFromGameOver(); keep(p); return true; }
    // ---- pause (Start) ----
    if (edge(p, 9) && window.TDPause) { try { if (TDPause.isPaused()) TDPause.resume(); else if (TDPause.canPause && TDPause.canPause()) TDPause.pause(); } catch (e) {} }
    if (window.TDPause && TDPause.isPaused && TDPause.isPaused()) { release(t); keep(p); return true; }
    // ---- the 4th-down panel: the face buttons pick a row ----
    if (G.state === 'decision' && visible('fourth-down')) {
      release(t);
      if (A) press('btn-go'); else if (B) press('btn-kick');
      else if (X && visible('btn-fake')) press('btn-fake'); else if (Y && visible('btn-sneak4')) press('btn-sneak4');
      else if (edge(p, 8) && visible('btn-safety')) press('btn-safety');
      keep(p); return true;
    }
    // ---- live play: the same flags the buttons set ----
    touch.left = L; touch.right = R && !L; touch.up = U; touch.down = D && !U;
    hadDir = L || R || U || D;
    if (A) touch.snap = true;
    if (B) touch.move = true;
    if (X) touch.dive = true;
    if (Y) touch.hand = true;
    if (edge(p, 4)) touch.one = true;
    if (edge(p, 5)) touch.two = true;
    if (edge(p, 7)) touch.three = true;
    if (edge(p, 6)) touch.pitch = true;
    if (edge(p, 8)) touch.throwaway = true;
    if (edge(p, 10)) touch.slide = true;
    if (edge(p, 11)) touch.pump = true;
    keep(p); return true;
  }
  function keep(p) { prev = p.buttons.map(b => !!(b.pressed || b.value > 0.5)); }
  // let go of the direction flags (so a stick released, or a pad unplugged, never leaves the runner walking)
  function release(t) { if (hadDir) { const touch = t.touch; touch.left = touch.right = touch.up = touch.down = false; hadDir = false; } }

  function loop() { if (!running) return; poll(); requestAnimationFrame(loop); }
  function start() {
    if (running) return; running = true; requestAnimationFrame(loop);
    try { td() && td().sayComment && td().sayComment('🎮 Controller connected'); } catch (e) {}
  }
  function stop() { if (!pad()) { running = false; const t = td(); if (t) release(t); } }
  window.addEventListener('gamepadconnected', start);
  window.addEventListener('gamepaddisconnected', stop);
  if (pad()) start();          // a pad that was already awake when the page loaded

  function init() {
    if (window.TDSettings) TDSettings.register({ id: 'pad', label: '🎮 Controller', type: 'toggle', def: true,
      hint: 'Use a Bluetooth or USB game controller (A snaps, B breaks tackles, stick moves).', onChange: v => { enabled = !!v; } });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  window.TDPad = { poll, pad, start, stop, isRunning: () => running };
})();
