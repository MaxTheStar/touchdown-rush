// ============================================================
// TOUCHDOWN FUN — voice.js: 🗣 READ ALOUD (Round 29, pick ①)  window.TDVoice
// ------------------------------------------------------------
// The announcer only wrote its lines, so a player who reads slowly, or is watching the field, missed them. A ⚙️ Settings switch "Read aloud" speaks each
// announcer line with the device's own voice (the browser's SpeechSynthesis, nothing is downloaded or sent anywhere).
// ⚠️ OFF BY DEFAULT (a game that suddenly talks in a classroom is a bad surprise). ⚠️ ONE LINE AT A TIME: a new line cancels the one still being spoken, so
// the voice can never fall behind the play. ⚠️ ONLY WHAT IS REALLY SHOWN: main.js `sayComment` calls `say()` only after its own "is the old line still fresh"
// gate, so a line the screen skipped is never spoken either. ⚠️ EMOJI AND SYMBOLS ARE REMOVED before speaking (a voice reads "football" for 🏈 and
// "exclamation" noises for ★), and a line identical to the last one within 1.5 seconds is not repeated. ⚠️ A browser or device with no voice just stays
// quiet: every call is wrapped, and the ⚙️ row does not appear where SpeechSynthesis does not exist. Never speaks while the tab is hidden. Nothing is saved but the switch.
// ============================================================
(function () {
  'use strict';
  let on = false, lastText = '', lastAt = 0;
  const supported = () => !!(window.speechSynthesis && window.SpeechSynthesisUtterance);
  // remove emoji, pictographs and stray symbols; keep letters, digits and ordinary punctuation (pure)
  function clean(t) {
    return String(t || '')
      .replace(/[\u{1F000}-\u{1FFFF}\u{2190}-\u{2BFF}\u{FE0F}\u{200D}\u{2600}-\u{27BF}]/gu, ' ')
      .replace(/[★☆•·→←↑↓✓✔✖]/g, ' ')
      .replace(/\s+/g, ' ').trim();
  }
  function say(text) {
    if (!on || !supported() || document.hidden) return false;
    const t = clean(text); if (!t) return false;
    const now = performance.now();
    if (t === lastText && now - lastAt < 1500) return false;
    lastText = t; lastAt = now;
    try {
      speechSynthesis.cancel();                       // one line at a time: the newest wins
      // lower-case so an ALL-CAPS line is read as words rather than spelled out letter by letter by some voices
      const u = new SpeechSynthesisUtterance(t.toLowerCase());
      u.rate = 1.05; u.pitch = 1.05; u.volume = 1;
      speechSynthesis.speak(u);
      return true;
    } catch (e) { return false; }
  }
  function init() {
    if (!window.TDSettings || !supported()) return;
    TDSettings.register({ id: 'voice', label: '🗣 Read aloud', type: 'toggle', def: false,
      hint: 'The announcer says each line out loud, using this device\'s own voice.',
      onChange: v => { on = !!v; if (!on) { try { speechSynthesis.cancel(); } catch (e) {} } } });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  window.TDVoice = { say, clean, supported, isOn: () => on };
})();
