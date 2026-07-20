// ============================================================
// TOUCHDOWN RUSH — sound.js: the SOUNDTRACK 🎵 (all made of math!)
// ------------------------------------------------------------
// There are no music files here. The whole soundtrack is PLAYED
// LIVE by your browser using the Web Audio API — little electronic
// "oscillators" that hum at exact frequencies. Stack them up on a
// beat and you get chiptune: the classic arcade-game sound.
//
// Two tunes share the same four chords (Am → F → C → G, the most
// famous chord loop in all of music):
//   • MENU  — a chill, slow version while you pick your team
//   • GAME  — the same tune but FAST, with a driving bass + hi-hats
// Plus little "stings": a fanfare when you score, a win/lose riff.
//
// Browsers only allow sound after you touch the page (so websites
// can't blast you), so the music starts on your very first tap.
// The 🔊 button (top-right) mutes it — and we remember your choice.
//
// main.js just calls:  TDSound.setMode('menu' | 'game')
//                      TDSound.sting('td' | 'win' | 'lose')
// ============================================================
(function () {
  'use strict';

  let ctx = null;        // the AudioContext — the browser's sound engine
  let master = null;     // the master volume knob (mute turns it to 0)
  let noiseBuf = null;   // one reusable burst of static (for the hi-hat)
  let started = false;
  let mode = 'menu';     // which tune is playing: 'menu' or 'game'
  let muted = false;
  try { muted = localStorage.getItem('tdr-muted') === '1'; } catch (e) {}

  // ---- The sheet music -------------------------------------------------
  // Notes are MIDI numbers (69 = the A above middle C; +12 = one octave up).
  // 0 means "rest" (silence). Each row is one bar of eight 8th-notes, and
  // the four rows are the four chords: Am, F, C, G.
  const BASS_ROOTS = [33, 29, 36, 31];   // A1, F1, C2, G1
  const GAME_LEAD = [
    [69, 0, 72, 76,  0, 72,  0, 76],    // Am: A-C-E climbing
    [65, 0, 69, 72,  0, 69,  0, 72],    // F:  F-A-C
    [67, 0, 72, 76,  0, 76, 79,  0],    // C:  a little turn upward
    [71, 0, 74, 79,  0, 74, 72, 71],    // G:  and roll back down
  ];
  const MENU_LEAD = [
    [69, 0, 0, 0, 72, 0, 0, 0],         // the same tune, but lazy —
    [65, 0, 0, 0, 69, 0, 0, 0],         // just two soft notes a bar
    [67, 0, 0, 0, 72, 0, 0, 0],
    [71, 0, 0, 0, 74, 0, 0, 0],
  ];
  const BPM = { menu: 100, game: 132 };

  // MIDI number → frequency in Hz (the formula every synth uses).
  function freqOf(m) { return 440 * Math.pow(2, (m - 69) / 12); }

  // ---- One short synth note --------------------------------------------
  // An oscillator hums at the note's frequency while a gain (volume) knob
  // fades it out fast — that quick fade is what makes it sound plucky.
  function blip(midi, when, dur, type, vol) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;                       // 'square' = classic game console
    osc.frequency.value = freqOf(midi);    // 'triangle' = soft and round
    g.gain.setValueAtTime(vol, when);
    g.gain.exponentialRampToValueAtTime(0.001, when + dur);
    osc.connect(g); g.connect(master);
    osc.start(when); osc.stop(when + dur + 0.02);
  }

  // A hi-hat "tss": a tiny burst of static pushed through a high filter.
  function hat(when) {
    const src = ctx.createBufferSource(); src.buffer = noiseBuf;
    const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 6500;
    const g = ctx.createGain(); g.gain.value = 0.05;
    src.connect(f); f.connect(g); g.connect(master);
    src.start(when);
  }

  // ---- The drummer/conductor -------------------------------------------
  // Every 80ms we peek a little ahead and book the next few notes at exact
  // times on the audio clock (like a conductor reading ahead in the score) —
  // that way the beat never wobbles, even if the game is busy.
  let stepIdx = 0, nextTime = 0;

  function stepDur() { return 60 / BPM[mode] / 2; }   // one 8th-note, in seconds

  function tick() {
    while (nextTime < ctx.currentTime + 0.18) {
      playStep(stepIdx, nextTime);
      stepIdx = (stepIdx + 1) % 32;        // 32 steps = 4 bars, then loop
      nextTime += stepDur();
    }
  }

  function playStep(i, t) {
    const bar = Math.floor(i / 8), beat = i % 8;
    const root = BASS_ROOTS[bar];
    if (mode === 'game') {
      // A pumping bass line: root, root, OCTAVE, root… (+7 = the fifth)
      const bassLine = [root, root, root + 12, root, root, root + 12, root, root + 7];
      blip(bassLine[beat], t, 0.16, 'triangle', 0.16);
      if (beat % 2 === 1) hat(t);                       // hats on the off-beats
      const n = GAME_LEAD[bar][beat];
      if (n) blip(n, t, 0.14, 'square', 0.045);
    } else {
      // Menu: a slow heartbeat bass and a soft, round melody.
      if (beat === 0 || beat === 4) blip(root + 12, t, 0.5, 'triangle', 0.13);
      const n = MENU_LEAD[bar][beat];
      if (n) blip(n, t, 0.45, 'triangle', 0.06);
    }
  }

  // ---- Stings — tiny musical exclamation points! ------------------------
  const STINGS = {
    td:   { notes: [69, 73, 76, 81], gap: 0.09, dur: 0.30, type: 'square',   vol: 0.10 }, // A major fanfare — TOUCHDOWN!
    win:  { notes: [72, 76, 79, 84], gap: 0.16, dur: 0.60, type: 'square',   vol: 0.10 }, // C major — champions!
    lose: { notes: [64, 62, 57],     gap: 0.28, dur: 0.55, type: 'triangle', vol: 0.10 }, // a sad little slide down
  };
  function sting(name) {
    if (!started || !STINGS[name]) return;
    const s = STINGS[name];
    const t0 = ctx.currentTime + 0.02;
    s.notes.forEach((n, i) => blip(n, t0 + i * s.gap, s.dur, s.type, s.vol));
  }

  // ---- Start, switch tunes, mute ---------------------------------------
  function start() {
    if (started) { if (ctx.state === 'suspended') ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;                       // a very old browser — play silent
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.5;
    master.connect(ctx.destination);

    // Bake the hi-hat's static once and reuse it every "tss".
    noiseBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.05), ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);

    nextTime = ctx.currentTime + 0.05;
    setInterval(tick, 80);
    started = true;
    syncButton();
  }

  function setMode(m) { if (BPM[m]) mode = m; }

  function toggle() {
    muted = !muted;
    try { localStorage.setItem('tdr-muted', muted ? '1' : '0'); } catch (e) {}
    if (master) master.gain.value = muted ? 0 : 0.5;
    syncButton();
  }

  function syncButton() {
    const b = document.getElementById('btn-mute');
    if (b) b.textContent = muted ? '🔇' : '🔊';
  }

  // The music may only begin after a real touch — so the FIRST tap anywhere
  // starts it (and every later tap just gently makes sure it's still awake).
  document.addEventListener('pointerdown', start);

  function wireUp() {
    const b = document.getElementById('btn-mute');
    if (b) b.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); start(); toggle(); });
    syncButton();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wireUp);
  else wireUp();

  window.TDSound = { start, setMode, sting, toggle };
})();
