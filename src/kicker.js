// ============================================================
// TOUCHDOWN FUN — kicker.js: 🦵 YOUR OWN KICKER
// ------------------------------------------------------------
// Every field goal and extra point in your career has been kicked by nobody.
// The roster is QB, RB, WR, WR, TE, LB, CB, S — there was never a kicker on it,
// so the man in the kicking mini-game had no name and no leg.
//
// Now he does. In 🏟 MY TEAM (the 📋 ROSTER tab) you can SIGN a kicker. Each one
// has two numbers, both on the same 50–95 scale as everybody else:
//
//   🦵 LEG      how far he can kick it — a strong leg needs LESS POWER to reach
//   🎯 ACCURACY how straight — a steady foot makes the aim swing SLOWER
//
// 70 is "average" and changes nothing at all, so a kicker is a choice, not a tax:
// the bomber has the leg and a wobbly aim, the sniper has the aim and a short
// leg, and which one is better depends on how YOU kick. He grows as he makes
// kicks, up to his potential, and his own record (made/tried, longest) is kept.
//
// ⚠️ WHY HE IS NOT A NINTH MAN IN `tdr-roster`
// The roster has been an eight-man array since v1.19, and trades, salary, growth,
// injuries, dynasty and the draft all index it by position (SLOTS, OFF_END). A
// ninth entry would have meant touching every one of them — and an old save with
// eight men would have had to be migrated. A kicker has no spot on the field
// during a play anyway, so he lives in his own save (`tdr-kicker`). Nothing
// about any existing save changes, and no one can lose a team to this.
//
// The effects are folded into kick.js (one block, beside the 🦵 Golden Toe) and
// main.js tells us how each real kick went. Practice drills are untouched.
//
// 🦶 UPDATE (v4.24): punts DO use his leg now, up to ±6 yards (kick.js `puntYards`).
// v4.17 left them alone on purpose — a punt's distance only drew a banner, so a leg
// rating on it would have been pretending. fieldpos.js (Punts That Matter) made the
// distance decide where the other team starts, so the leg earns its yards.
// ============================================================
(function () {
  const T = window.TDStats ? TDStats.shared : null;
  const store = (k, v) => { if (T) T.store(k, v); };
  const load  = (k, f) => (T ? T.load(k, f) : f);

  const AVG = 70;                 // a 70 does nothing — the neutral point
  const LO = 50, HI = 95;
  const POWER_SWING = 0.10;       // ±: how much of the power bar a leg point-range is worth
  const AIM_SWING = 0.25;         // ±: how much slower/faster the aim swings
  const REPLACE_COST = 25;        // 🪙 to let him go and sign somebody new (the first is free)
  const KICKS_PER_POINT = 4;      // made kicks before one of his numbers ticks up

  const FIRST = ['Gus', 'Nico', 'Tobi', 'Hiro', 'Pablo', 'Luca', 'Sven', 'Ari', 'Dmitri', 'Joon',
    'Felix', 'Mateo', 'Yuri', 'Beau', 'Soren', 'Ravi'];
  const LAST = ['Boot', 'Toe', 'Longfoot', 'Kicker', 'Strike', 'Uprights', 'Tee', 'Hook',
    'Stringer', 'Leggett', 'Fairway', 'Rivera', 'Kowalski', 'Tanaka', 'Moreau', 'Olsen'];

  const rint = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1));
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  // ---- The saved man --------------------------------------------------------
  // { name, leg, acc, pot, kind, xp, kicks, made, longest, xpTry, xpMade }
  let k = load('kicker', null);
  function sane(o) {
    return o && typeof o === 'object' && typeof o.name === 'string' &&
      isFinite(o.leg) && isFinite(o.acc);
  }
  if (!sane(k)) k = null;
  else {                                   // a hand-edited / old save can't break the maths
    k.leg = clamp(Math.round(k.leg), LO, HI);
    k.acc = clamp(Math.round(k.acc), LO, HI);
    k.pot = clamp(Math.round(k.pot || Math.max(k.leg, k.acc)), Math.max(k.leg, k.acc), HI);
    ['xp', 'kicks', 'made', 'longest', 'xpTry', 'xpMade'].forEach(f => { k[f] = Math.max(0, +k[f] || 0); });
  }
  function save() { store('kicker', k); }

  // ---- What he does to a kick ----------------------------------------------
  // Both are multipliers on what kick.js already works out; 1 = no change.
  function legEdge() { return k ? (k.leg - AVG) / 25 : 0; }   // −0.8 … +1
  function accEdge() { return k ? (k.acc - AVG) / 25 : 0; }
  function powerMult() { return 1 - legEdge() * POWER_SWING; }   // <1 = needs less power
  function aimMult()   { return 1 - accEdge() * AIM_SWING; }     // <1 = slower swing = easier
  function mods() {
    if (!k) return null;
    return { name: k.name, power: powerMult(), aim: aimMult(), leg: k.leg, acc: k.acc };
  }
  const pct = m => Math.round(Math.abs(1 - m) * 100);

  // ---- Prospects: three different men, so it is a real choice ---------------
  // A bomber (big leg, loose aim), a sniper (steady aim, short leg) and a
  // balanced one. The two specialists are the same total quality on purpose.
  let prospects = null;
  function makeProspects() {
    const mk = (kind, leg, acc, label) => {
      const base = Math.max(leg, acc);
      return { name: pick(FIRST) + ' ' + pick(LAST), kind, label, leg, acc,
               pot: clamp(base + rint(4, 9), base, HI) };
    };
    prospects = [
      mk('bomber', rint(78, 88), rint(56, 64), '💣 BOMBER'),
      mk('sniper', rint(56, 64), rint(78, 88), '🎯 SNIPER'),
      mk('steady', rint(68, 76), rint(68, 76), '⚖️ STEADY'),
    ];
  }

  function sign(i) {
    const p = prospects && prospects[i]; if (!p) return { ok: false, why: 'gone' };
    const cost = k ? REPLACE_COST : 0;
    if (cost) {
      const ok = window.TDShop && TDShop.spend ? TDShop.spend(cost) : false;
      if (!ok) return { ok: false, why: 'coins', cost };
    }
    const old = k;
    k = { name: p.name, leg: p.leg, acc: p.acc, pot: p.pot, kind: p.kind, xp: 0,
          kicks: 0, made: 0, longest: 0, xpTry: 0, xpMade: 0 };
    prospects = null; scouting = false;
    save();
    return { ok: true, cost, replaced: old ? old.name : null };
  }

  // ---- Keeping his record, and growing him ----------------------------------
  // main.js onKickDone tells us about every REAL kick (never a practice drill).
  // A punt is not a kick at the uprights, so it is not counted.
  function record(result, kind, dist) {
    if (!k || !result || result.mode === 'punt') return null;
    const isXp = kind === 'xp';
    const made = !!result.made;
    if (isXp) { k.xpTry++; if (made) k.xpMade++; }
    else {
      k.kicks++;
      if (made) { k.made++; k.longest = Math.max(k.longest, Math.round(dist || result.distance || 0)); }
    }
    let grew = null;
    if (made) {
      k.xp++;
      if (k.xp >= KICKS_PER_POINT) {
        k.xp = 0;
        // A long kick builds the LEG, a short precise one builds the ACCURACY.
        const wantLeg = !isXp && (dist || 0) >= 40;
        const field = wantLeg ? 'leg' : 'acc';
        const other = wantLeg ? 'acc' : 'leg';
        const f = k[field] < k.pot ? field : (k[other] < k.pot ? other : null);
        if (f) { k[f]++; grew = f; }
      }
    }
    save();
    return { made, grew };
  }

  // ---- The card inside 🏟 MY TEAM → 📋 ROSTER -------------------------------
  let scouting = false;
  const bar = (v, col) =>
    `<span class="kk-bar"><i style="width:${Math.round((v - LO) / (HI - LO) * 100)}%;background:${col}"></i></span>`;
  function fx(m) {
    const parts = [];
    if (pct(m.power) >= 1) parts.push(`needs <b>${pct(m.power)}% ${m.power < 1 ? 'less' : 'more'}</b> power`);
    if (pct(m.aim) >= 1) parts.push(`aim swings <b>${pct(m.aim)}% ${m.aim < 1 ? 'slower' : 'faster'}</b>`);
    const py = window.TDFieldPos ? TDFieldPos.legYards(m.leg) : 0;     // 🦶 punts too (fieldpos.js)
    if (py) parts.push(`punts go <b>${Math.abs(py)} yds ${py > 0 ? 'farther' : 'shorter'}</b>`);
    return parts.length ? 'In games: ' + parts.join(' · ') : 'In games: an average kicker — no change';
  }
  function prospectRow(p, i) {
    const cost = k ? `${REPLACE_COST}🪙` : 'FREE';
    return `<div class="kk-pro">
        <div class="kk-pro-top"><b>${p.name}</b><span class="kk-tag">${p.label}</span></div>
        <div class="kk-pro-bars">🦵 ${p.leg} ${bar(p.leg, '#ffb700')}  🎯 ${p.acc} ${bar(p.acc, '#7dd3fc')}</div>
        <div class="kk-pro-bot"><span>▲ ${p.pot} potential</span>
          <div class="dr-mini yes" data-kact="sign" data-i="${i}">SIGN ${cost}</div></div>
      </div>`;
  }
  function cardHTML() {
    let body;
    if (scouting) {
      if (!prospects) makeProspects();
      body = `<div class="kk-hint">Three kickers want the job. ${k ? `Signing one lets <b>${k.name}</b> go (${REPLACE_COST}🪙).` : 'Your first one is free.'}</div>` +
        prospects.map(prospectRow).join('') +
        `<div class="kk-acts"><div class="dr-mini" data-kact="cancel">NEVER MIND</div></div>`;
    } else if (!k) {
      body = `<div class="kk-hint">Nobody. Every field goal and extra point you have ever kicked was kicked by a man with no name and no leg.</div>
        <div class="kk-acts"><div class="dr-mini yes" data-kact="scout">🦵 SCOUT KICKERS</div></div>`;
    } else {
      const m = mods();
      const tries = k.kicks ? `${k.made}/${k.kicks} FG` : 'no field goals yet';
      const xps = k.xpTry ? ` · ${k.xpMade}/${k.xpTry} XP` : '';
      const lg = k.longest ? ` · long ${k.longest}` : '';
      body = `<div class="kk-name">${k.name}<span class="kk-tag">${k.kind === 'bomber' ? '💣 BOMBER' : k.kind === 'sniper' ? '🎯 SNIPER' : '⚖️ STEADY'}</span></div>
        <div class="kk-bars"><div>🦵 LEG <b>${k.leg}</b> ${bar(k.leg, '#ffb700')}</div><div>🎯 ACCURACY <b>${k.acc}</b> ${bar(k.acc, '#7dd3fc')}</div></div>
        <div class="kk-fx">${fx(m)}</div>
        <div class="kk-rec">${tries}${xps}${lg} · ▲ ${k.pot} potential</div>
        <div class="kk-acts"><div class="dr-mini" data-kact="scout">🔄 NEW KICKER</div></div>`;
    }
    return `<div class="kk-card" id="kk-card"><div class="kk-title">🦵 YOUR KICKER</div>${body}</div>`;
  }

  // ---- Taps, inside MY TEAM --------------------------------------------------
  function redraw() {
    if (window.TDDraft && TDDraft.render) TDDraft.render();
  }
  function onTap(e) {
    const el = e.target.closest && e.target.closest('[data-kact]');
    if (!el) return;
    e.preventDefault();
    const act = el.dataset.kact;
    if (act === 'scout') { scouting = true; prospects = null; redraw(); }
    else if (act === 'cancel') { scouting = false; prospects = null; redraw(); }
    else if (act === 'sign') {
      const r = sign(+el.dataset.i);
      if (!r.ok && r.why === 'coins') {
        const c = document.querySelector('#kk-card .kk-hint');
        if (c) c.innerHTML = `🪙 He costs <b>${r.cost}</b> coins — play a game and come back.`;
        return;
      }
      redraw();
    }
  }
  function wire() {
    const body = document.getElementById('team-body');
    if (body) body.addEventListener('pointerdown', onTap);
  }
  if (document.readyState !== 'loading') wire();
  else document.addEventListener('DOMContentLoaded', wire);

  const css = document.createElement('style');
  css.textContent = `
    .kk-card { margin-top: 10px; padding: 10px 12px; border-radius: 10px;
      background: rgba(255,183,0,0.07); border: 1px solid rgba(255,183,0,0.35); text-align: left; }
    .kk-title { font: 800 11px "Arial Black", Arial; letter-spacing: .1em; color: #ffd60a; margin-bottom: 6px; }
    .kk-name { font: 800 15px "Arial Black", Arial; color: #fff; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .kk-tag { font: 800 8.5px "Arial Black", Arial; letter-spacing: .06em; color: #0d1220;
      background: #ffd60a; border-radius: 4px; padding: 2px 6px; }
    .kk-bars { margin-top: 6px; display: flex; flex-direction: column; gap: 4px; font: 700 12px Arial; color: #d7e0ee; }
    .kk-bar { display: inline-block; width: 90px; height: 7px; border-radius: 4px; background: rgba(255,255,255,0.12);
      vertical-align: middle; overflow: hidden; margin-left: 4px; }
    .kk-bar i { display: block; height: 100%; }
    .kk-fx { margin-top: 6px; font: 700 11.5px Arial; color: #9fe0ad; }
    .kk-rec, .kk-hint { margin-top: 4px; font: 700 11.5px Arial; color: #b8c4d8; }
    .kk-acts { margin-top: 8px; display: flex; gap: 8px; }
    .kk-pro { margin-top: 8px; padding: 8px 10px; border-radius: 8px; background: rgba(255,255,255,0.05); }
    .kk-pro-top { display: flex; justify-content: space-between; align-items: center; gap: 8px; font: 800 13px "Arial Black", Arial; color: #fff; }
    .kk-pro-bars { margin-top: 4px; font: 700 12px Arial; color: #d7e0ee; }
    .kk-pro-bot { margin-top: 6px; display: flex; justify-content: space-between; align-items: center; font: 700 11px Arial; color: #b8c4d8; }
  `;
  document.head.appendChild(css);

  window.TDKicker = {
    has: () => !!k,
    get: () => (k ? JSON.parse(JSON.stringify(k)) : null),
    mods, powerMult, aimMult,
    record, cardHTML,
    _debug: {
      prospects: () => { if (!prospects) makeProspects(); return prospects; },
      sign, set: o => { k = o; save(); }, clear: () => { k = null; save(); },
      scouting: v => { scouting = !!v; },
    },
  };
})();
