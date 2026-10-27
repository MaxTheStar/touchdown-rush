// ============================================================
// TOUCHDOWN FUN — pause.js: ⏸ THE PAUSE MENU (Round 22, pick ⑤)
// ------------------------------------------------------------
// There was no way to stop a game in progress. If somebody called you to dinner the quarter kept going, and leaving meant the game was lost.
// A ⏸ button sits in the top row (in the slot the hidden fullscreen button leaves free) while a game is on. Tap it and:
//
//   · the whole scene stops — players, ball, tweens, delayed calls, the kick meters — because the Phaser scene itself is paused;
//   · the music goes quiet (the audio clock is suspended), and comes back on RESUME;
//   · a card offers  ▶ RESUME  ·  ⚙️ SETTINGS  ·  🚪 QUIT GAME (it asks twice: tap it again to really leave).
//
// ⚠️ A PAUSE MUST NOT BE A CHEAT. The timing moments (jump ball, toe-tap, fall-on-it, swim move…) run on the real clock, not the scene's, so pausing
// in the middle of one would freeze the game but not the ball on the bar — the button simply refuses while one is up (and so does ESC).
// ⚠️ The ⏳ play clock already stops for any open pop-up (it counts every `.ov`), so a pause never costs a delay-of-game flag.
// ============================================================
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  let paused = false, armQuit = false;
  const G = () => (window.__td && __td.G) || null;

  // may the game be paused right now? (pure over the facts)
  function allowed(state, momentLive, gameOver) {
    if (!state || state === 'menu' || gameOver) return false;
    if (momentLive) return false;
    return true;
  }
  const canPause = () => { const g = G(); return !!g && allowed(g.state, !!(window.TDJump && TDJump.active()), !!g.gameOver || g.state === 'gameover'); };

  function pause() {
    if (paused || !canPause()) return false;
    const g = G();
    paused = true; armQuit = false;
    try { g.scene.sys.pause(); } catch (e) {}   // (sys.pause() is immediate; scene.scene.pause() is QUEUED until the next frame and does nothing while the loop is asleep)
    if (window.TDSound && TDSound.suspend) TDSound.suspend(true);
    const m = $('pause-modal'); if (m) { m.style.display = 'flex'; paint(); }
    return true;
  }
  function resume() {
    if (!paused) return;
    const g = G(); paused = false; armQuit = false;
    const m = $('pause-modal'); if (m) m.style.display = 'none';
    try { g.scene.sys.resume(); } catch (e) {}
    if (window.TDSound && TDSound.suspend) TDSound.suspend(false);
  }
  function quit() {
    if (!paused) return;
    if (!armQuit) { armQuit = true; paint(); return; }          // tap it again
    resume();
    try { __td.enterMenu(); } catch (e) { console.error(e); }
  }
  function paint() { const q = $('pause-quit'); if (q) { q.textContent = armQuit ? (window.TDResume && TDResume.has() ? '🚪 TAP AGAIN TO QUIT — RESUME LATER FROM THE MENU' : '🚪 TAP AGAIN TO QUIT — THIS GAME IS LOST') : '🚪 QUIT GAME'; q.classList.toggle('arm', armQuit); } }

  function sync() {
    const b = $('btn-pause'); if (!b) return;
    const g = G();
    b.style.display = (g && !paused && canPause() && !document.body.classList.contains('menu') && !document.body.classList.contains('kicking-hide')) ? 'flex' : 'none';
  }

  function wire() {
    const tap = (id, fn) => { const el = $(id); if (el) el.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); fn(); }); };
    tap('btn-pause', pause); tap('pause-resume', resume); tap('pause-quit', quit);
    tap('pause-settings', () => { if (window.TDSettings) TDSettings.open(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') { if (paused) resume(); else pause(); } });
    setInterval(sync, 300);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire); else wire();

  window.TDPause = { pause, resume, quit, allowed, isPaused: () => paused, canPause };
})();
