// ============================================================
// TOUCHDOWN FUN — hardcount.js: 🗣 THE HARD COUNT (Round 18, pick ③)
// ------------------------------------------------------------
// 🔇 Silent Count (v4.7) was the defense making life hard for a road quarterback.
// This is the other half of that fight: the quarterback barking at the line to make
// the defense JUMP. A real hard count is a bluff on the snap count — "set, hut —"
// and then nothing — and the defender who flinches is offside: five free yards.
//
//   🟨 THEY JUMP (most of the time, nothing)   OFFSIDE: +5 yards, replay the down
//   🏃 YOUR OWN LINE FLINCHES (rare)            FALSE START: -5 yards, replay the down
//   …and each bark costs 3 seconds of ⏳ the play clock, so it pushes you toward the
//   danger zone where a snap can false-start by itself.
//
// ⚠️ A FREE FIVE YARDS EVERY DOWN WOULD BE A BUG, NOT A FEATURE. So:
//   · they LEARN: each bark this game multiplies the chance by 0.8 — the same "they
//     have seen it" shape as the 🧢 pump fake. Added up over a whole game that is
//     about three and a half yards of expected gain, however often you bark;
//   · never on 4th down (a flag there changes whether you go for it — the one place
//     a free gamble is a free lunch), never in the no-huddle (no time to bark);
//   · on the road the crowd drowns out the cadence: ×0.7;
//   · one bark a down.
//
// Both flags replay the down and never advance the clock (nothing was played), through
// main.js's presnapFoul(), the same road ⏳ the play clock's penalties travel.
//
// Nothing is saved. This file owns the rule, the roll and the button.
// ============================================================
(function () {
  'use strict';

  const $ = id => document.getElementById(id);

  const BASE       = 0.14;   // chance a defender jumps on the first bark of a game
  const LEARN      = 0.8;    // …times this for every bark already made
  const ROAD       = 0.7;    // the crowd covers the cadence
  const FLINCH     = 0.05;   // chance YOUR line moves first
  const CLOCK_COST = 3;      // seconds off ⏳ the play clock
  const YARDS      = 5;

  let uses = 0;              // barks this game
  let usedThisDown = false;
  let lastResult = null;     // 'jump' | 'flinch' | 'nothing' for the button's label

  const td = () => window.__td || null;
  const G  = () => { const t = td(); return t ? t.G : null; };

  // ---- the rules (pure, so they can be swept without a game) ----------------------
  function jumpChance(nUses, away) {
    return BASE * Math.pow(LEARN, Math.max(0, nUses | 0)) * (away ? ROAD : 1);
  }
  // Where an OFFSIDE puts the ball: five yards, but never more than half the distance to the
  // goal (so it can't score), and a first down only if it reaches the marker; otherwise replay.
  function spotJump(los, down, fd) {
    const nl = Math.min(los + YARDS, los + (100 - los) / 2);
    return nl >= fd ? { los: nl, down: 1, fd: Math.min(nl + 10, 100) } : { los: nl, down: down, fd: fd };
  }

  function can() {
    const g = G(), t = td();
    if (!g || !t || g.state !== 'presnap' || g.team == null) return false;
    if (usedThisDown || g.down >= 4 || g.drillGame) return false;
    if (document.body.classList.contains('hurry')) return false;
    return true;
  }

  // ---- the bark -----------------------------------------------------------------
  function bark() {
    const g = G(), t = td();
    if (!can()) return null;
    usedThisDown = true;
    const away = !!g.awayGame;
    const p = jumpChance(uses, away);
    uses++;
    if (window.TDPlayClock && TDPlayClock.spend) TDPlayClock.spend(CLOCK_COST);
    const r = Math.random();
    let kind = 'nothing';
    if (r < FLINCH) kind = 'flinch';
    else if (r < FLINCH + p) kind = 'jump';
    lastResult = kind;
    if (kind === 'jump') {
      // one of the two linemen jumps across: a few pixels is plenty to see
      const dl = t.defense[Math.random() < 0.5 ? 0 : 1];
      if (dl && dl.s) { dl.s.y += 14; if (dl.label) dl.label.setPosition(dl.s.x, dl.s.y); }
      const next = spotJump(g.losYards, g.down, g.firstDownYards);
      t.presnapFoul({ id: 'offside', name: 'OFFSIDE ON THE DEFENSE', good: true, yards: YARDS,
        shout: '🗣 The hard count works! He jumped — offside, five yards.', next });
    } else if (kind === 'flinch') {
      const pk = window.TDPlayClock && TDPlayClock.foulPacket && TDPlayClock.foulPacket('falsestart');
      if (pk) t.presnapFoul(pk); else lastResult = 'nothing';
    } else {
      t.sayComment('🗣 They did not bite.');
    }
    paint();
    return kind;
  }

  // ---- the button ---------------------------------------------------------------
  function paint() {
    const b = $('btn-hard'); if (!b) return;
    const g = G();
    b.style.display = (g && g.state === 'presnap' && g.team && g.down < 4 && !g.drillGame) ? 'flex' : 'none';
    const small = b.querySelector('small');
    if (usedThisDown) {
      b.classList.add('off');
      if (small) small.textContent = lastResult === 'jump' ? 'OFFSIDE!' : lastResult === 'flinch' ? 'FLINCH' : 'NO BITE';
      return;
    }
    b.classList.toggle('off', !can());
    if (small) small.textContent = uses >= 4 ? 'SEEN IT' : 'HARD COUNT';
  }
  function newPlay() { usedThisDown = false; lastResult = null; paint(); }
  function newGame() { uses = 0; newPlay(); }

  function wire() {
    const b = $('btn-hard');
    if (b) b.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); bark(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire);
  else wire();

  window.TDHard = { bark, can, paint, newPlay, newGame, jumpChance, spotJump,
    BASE, LEARN, ROAD, FLINCH, CLOCK_COST, YARDS, uses: () => uses };
})();
