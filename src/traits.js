// ============================================================
// TOUCHDOWN FUN — traits.js: ⭐ TRAITS THAT MATTER (Round 11, pick ③)
// ------------------------------------------------------------
// Every player you draft has had a ⭐ TRAIT since Round 2 — 🚀 SPEEDSTER,
// 🎯 CANNON ARM, 🧲 SURE HANDS, 🧊 CLUTCH, 🦅 BALL HAWK and six more. They
// show on his card, they cost extra in wages, and until now they did
// NOTHING AT ALL. The word "trait" appeared nowhere in the game loop.
//
// This file makes them real. From now on your Speedster genuinely runs
// faster — but only when HE is the one carrying the ball.
//
// ⚠️ THE WHOLE POINT IS THAT A TRAIT BELONGS TO A PLAYER, NOT THE TEAM.
// Every other bonus in this game is team-wide: gear, coaches, ball skins,
// house rules all just multiply into one shared number. A trait must not work
// like that, or "my Speedster is fast" becomes "my team is fast" and the whole
// idea is lost. So the per-player traits are asked for BY SLOT — who is
// carrying, who was thrown at — and only pay out for that man:
//
//   🚀 SPEEDSTER    +8% run speed        …while HE carries
//   🏃 SHIFTY       +6% run speed        …while HE carries
//   🛡 BRUISER      +18% break a tackle  …while HE carries
//   🧲 SURE HANDS   +8% catching         …when HE is thrown at
//   ⚡ PLAYMAKER    +4% speed AND catch  …for him, either way
//
// Four are genuinely team-wide, and those fold into the same shop.js chains
// everything else uses:
//   🎯 CANNON ARM   −12% interceptions   (the quarterback throws them all)
//   🦅 BALL HAWK    +4% takeaways        (a defensive back's whole job)
//   🧱 WALL         −3% their offence    (a defensive lineman clogs it up)
//   👑 CAPTAIN      +2% speed and catch for EVERYBODY — that is what a
//                   captain is, and it is deliberately the smallest number
//                   here so a captain is nice rather than a must-have.
//
// 🧊 CLUTCH is the odd one out: it does nothing for three quarters and then
// DOUBLES that player's other trait effects in the fourth. A player can only
// hold one trait, so Clutch on its own would be worthless — instead it reads
// as "he shows up when it counts" by amplifying whatever else the squad has.
//
// ⚠️ SLOT MAPPING. Roster slot 0 is the QB, 1 the RB, 2 and 3 the receivers —
// the same mapping gamestats.js uses to credit stats, kept identical here on
// purpose. If that ever changes, both files have to change together.
//
// Nothing is saved: traits already live on the players in `tdr-roster`. This
// file only reads them, so there is no second copy to drift.
// ============================================================
(function () {
  'use strict';

  // How much each trait is worth. Keep them small — a trait should colour a
  // player, not decide a game, and they stack on top of gear and coaches.
  const FX = {
    'SPEEDSTER':  { speed: 0.08 },
    'SHIFTY':     { speed: 0.06 },
    'BRUISER':    { stiff: 0.18 },
    'SURE HANDS': { katch: 0.08 },
    'PLAYMAKER':  { speed: 0.04, katch: 0.04 },
    'CANNON ARM': { arm: 0.12 },      // team-wide: the QB throws every pass
    'BALL HAWK':  { hawk: 0.04 },     // team-wide: defensive
    'WALL':       { oppoff: 0.03 },   // team-wide: defensive
    'CAPTAIN':    { allSpeed: 0.02, allCatch: 0.02 },
    'CLUTCH':     { clutch: true },
  };

  const nameOf = t => (t && (t.n || t)) || null;

  // ---- reading the squad --------------------------------------------------
  function playerAt(idx) {
    try { return (window.TDDraft && TDDraft.playerAt) ? TDDraft.playerAt(idx) : null; }
    catch (e) { return null; }
  }
  function traitAt(idx) {
    const p = playerAt(idx);
    return p ? nameOf(p.trait) : null;
  }
  function fxAt(idx) {
    const n = traitAt(idx);
    return (n && FX[n]) ? FX[n] : null;
  }

  // 🧊 CLUTCH — is it the fourth quarter? If anybody on the squad is Clutch,
  // their team-mates' trait effects are doubled while it matters.
  function clutchMult() {
    let q = 0;
    try { q = (window.__td && __td.G && __td.G.quarter) || 0; } catch (e) {}
    if (q < 4) return 1;
    let has = false;
    for (let i = 0; i < 8; i++) if (traitAt(i) === 'CLUTCH') { has = true; break; }
    return has ? 2 : 1;
  }

  // ---- per-player: only pays out for the man actually involved ------------
  // `slot` is the OFFENSE index (0 QB, 1 RB, 2 WR1, 3 WR2).
  function speedFor(slot) {
    const f = fxAt(slot);
    const own = f && f.speed ? f.speed * clutchMult() : 0;
    return 1 + own + captain('allSpeed');
  }
  function catchFor(slot) {
    const f = fxAt(slot);
    const own = f && f.katch ? f.katch * clutchMult() : 0;
    return own + captain('allCatch');
  }
  function stiffFor(slot) {
    const f = fxAt(slot);
    return f && f.stiff ? f.stiff * clutchMult() : 0;
  }

  // ---- team-wide: everybody on the squad contributes ----------------------
  function sumAll(key) {
    let total = 0;
    for (let i = 0; i < 8; i++) {
      const f = fxAt(i);
      if (f && f[key]) total += f[key];
    }
    return total * clutchMult();
  }
  function captain(key) {
    // 👑 only ONE captain's worth, however many you somehow end up with
    for (let i = 0; i < 8; i++) {
      const f = fxAt(i);
      if (f && f[key]) return f[key] * clutchMult();
    }
    return 0;
  }
  const armAdd     = () => sumAll('arm');
  const hawkAdd    = () => sumAll('hawk');
  const oppOffMult = () => 1 - sumAll('oppoff');

  // ---- what the MY TEAM screen can show ----------------------------------
  // A short, honest description of what a trait actually does now.
  const BLURB = {
    'SPEEDSTER':  'Runs 8% faster with the ball',
    'SHIFTY':     'Runs 6% faster with the ball',
    'BRUISER':    '18% better at breaking a tackle',
    'SURE HANDS': 'Catches 8% better when thrown at',
    'PLAYMAKER':  '+4% speed and catching',
    'CANNON ARM': 'Team throws 12% fewer interceptions',
    'BALL HAWK':  'Team makes 4% more takeaways',
    'WALL':       'Their offence is 3% slower',
    'CAPTAIN':    '+2% speed and catching for everyone',
    'CLUTCH':     'Doubles the squad\'s traits in the 4th quarter',
  };
  function describe(trait) {
    const n = nameOf(trait);
    return (n && BLURB[n]) || '';
  }
  // Everything the squad currently brings, for a summary line.
  function squadTraits() {
    const out = [];
    for (let i = 0; i < 8; i++) {
      const p = playerAt(i); if (!p || !p.trait) continue;
      const n = nameOf(p.trait);
      out.push({ idx: i, name: p.name, pos: p.pos, trait: n,
                 emoji: (p.trait && p.trait.e) || '⭐', blurb: BLURB[n] || '' });
    }
    return out;
  }

  window.TDTraits = {
    speedFor, catchFor, stiffFor,     // main.js asks per player
    armAdd, hawkAdd, oppOffMult,      // shop.js / main.js ask team-wide
    describe, squadTraits, clutchMult,
    traitAt, effects: () => JSON.parse(JSON.stringify(FX)),
  };
})();
