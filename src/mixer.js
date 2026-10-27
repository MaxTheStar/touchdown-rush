// ============================================================
// TOUCHDOWN FUN — mixer.js: 🔊 THE SOUND MIXER (Round 22, pick ③)
// ------------------------------------------------------------
// Mute was all or nothing: the music, the touchdown fanfare and the crunch of a tackle were one knob, so a kid who wants the hits without the
// tune (or the other way round) had no choice. ⚙️ SETTINGS now has two sliders, 🎵 MUSIC and 💥 EFFECTS (the stings and the tackle thump).
//
// ⚠️ THE DEFAULTS SOUND EXACTLY LIKE TODAY: both buses start at 1.0, feeding the same master knob the mute button already turns, so the 🔊 button still
// silences EVERYTHING and a player who never opens Settings hears no difference. (sound.js: `musicBus` and `fxBus` both feed `master`.)
// ============================================================
(function () {
  'use strict';
  function apply() { if (window.TDSound && TDSound.setMix) TDSound.setMix(TDSettings.get('mix_music'), TDSettings.get('mix_fx')); }
  if (window.TDSettings) {
    TDSettings.register({ id: 'mix_music', label: '🎵 Music', type: 'range', def: 1, hint: 'The tune and the hi-hat.', onChange: apply });
    TDSettings.register({ id: 'mix_fx', label: '💥 Effects', type: 'range', def: 1, hint: 'Touchdown fanfares, stings and tackle thumps.', onChange: apply });
  }
  apply();
  window.TDMixer = { apply };
})();
