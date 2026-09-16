// ============================================================
// TOUCHDOWN FUN — sound.js: the SOUNDTRACK 🎵 (all made of math!)
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

  // ---- 💥 THE CRUNCH — a tackle you can HEAR ----------------------------
  // Until v3.7 a defender could flatten you and the game said nothing at all.
  // A real hit is two sounds at once, so this is built the same way:
  //   1. a THUMP  — a low tone that drops in pitch as it dies. That fast drop
  //                 is what your ear reads as "something heavy just landed";
  //                 a tone that holds its pitch sounds like a beep instead.
  //   2. a CRUNCH — a burst of static (the same baked noise the hi-hat uses)
  //                 pushed through a LOWPASS filter, which keeps the low
  //                 rumble and throws away the hiss: shoulder pads, not a snake.
  //
  // `force` is 0…1 and everything scales off it — louder, lower and longer for
  // a big hit. ⚠️ It is CLAMPED: main.js works force out from the play, and a
  // stray number here would either be silent or blow the mix apart.
  //
  // ⚠️ THE MIX IS THE WHOLE JOB. These fire on nearly every play, so they have
  // to sit UNDER the music rather than on top of it. Peak volume is 0.085 —
  // below the 0.10–0.12 the stings use, because a sting happens a few times a
  // game and this happens forty times.
  function hit(force) {
    if (!started || !ctx) return;
    const f = Math.max(0, Math.min(1, force || 0));
    const t0 = ctx.currentTime + 0.01;

    // 1. the thump — pitch slides down as it fades (heavy, not beepy)
    const osc = ctx.createOscillator();
    const og  = ctx.createGain();
    osc.type = 'triangle';
    const hz = 108 - 30 * f;                       // a harder hit lands LOWER
    osc.frequency.setValueAtTime(hz, t0);
    osc.frequency.exponentialRampToValueAtTime(hz * 0.45, t0 + 0.13 + 0.07 * f);
    og.gain.setValueAtTime(0.030 + 0.055 * f, t0);
    og.gain.exponentialRampToValueAtTime(0.001, t0 + 0.15 + 0.10 * f);
    osc.connect(og); og.connect(master);
    osc.start(t0); osc.stop(t0 + 0.30);

    // 2. the crunch — static with the hiss filtered off = pads colliding
    if (noiseBuf) {
      const src = ctx.createBufferSource(); src.buffer = noiseBuf;
      src.playbackRate.value = 0.75 + 0.35 * (1 - f);   // big hits = slower, chunkier
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 900 + 1700 * f;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.020 + 0.050 * f, t0);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.09 + 0.06 * f);
      src.connect(lp); lp.connect(g); g.connect(master);
      src.start(t0);
    }
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
    stuff:{ notes: [48, 46, 43],     gap: 0.19, dur: 0.32, type: 'square',   vol: 0.12 }, // 🥁 "BUM… BUM… BUM" — you got stopped!
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

  window.TDSound = { start, setMode, sting, hit, toggle };
})();
