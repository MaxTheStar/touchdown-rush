// ============================================================
// TOUCHDOWN FUN — halfadj.js: 🗣 HALFTIME ADJUSTMENTS (Round 25, pick ④)
// ------------------------------------------------------------
// Halftime was a mini-game and an ad; nothing about the first half changed the second. Now, when you tap to start the second half
// of a 1-PLAYER game, a panel reads the first half back to you ("they ran 9 times for 41, passed 8 for 63") and you pick ONE
// adjustment for their second-half drives:
//
//   🧱 STOP THE RUN   runs gain ×0.85 and are stuffed more, but passes gain ×1.06 and a deep one hits a little more
//   🛡 STOP THE PASS  passes gain ×0.92 and fall incomplete more, but runs gain ×1.08
//   😌 EASE OFF       no change to the scheme: your legs are fresh instead (😮‍💨 Gas Tank refills)
//
// ⚠️ EVERY SCHEME CHANGE COSTS THE OTHER SIDE, so the right pick is the side that hurt you: the panel marks it ("★ what hurt") from the yards per
// play they actually got, but it is a READ, not an order: against a team that adjusts back (they do not: the numbers are fixed for the half) it
// would be wrong. It applies only to the 1-player CPU drives (`DefenseSim.play` through `TDDefense.mods()`); the live 2-player defense is untouched.
// Nothing is saved. main.js: `noted(side, yds)` in DefenseSim.apply, `reset()` in beginGame, `gate(cb)` in endBreak at the half.
// ============================================================
(function () {
  'use strict';
  const ADJ = {
    run:  { id: 'run',  ic: '🧱', name: 'STOP THE RUN',  blurb: 'Runs are stuffed. But passes gain more.',
            mods: { runGain: 0.83, stuff: 0.03, passGain: 1.12, bigPass: 0.02 } },
    pass: { id: 'pass', ic: '🛡', name: 'STOP THE PASS', blurb: 'Passes fall incomplete. But runs gain more.',
            mods: { passGain: 0.93, incomplete: 0.025, runGain: 1.30, bigRun: 0.01 } },
    ease: { id: 'ease', ic: '😌', name: 'EASE OFF',      blurb: 'No change to the scheme: fresh legs.', mods: {} },
  };
  let c = { run: { n: 0, y: 0 }, pass: { n: 0, y: 0 } };   // what THEY did this half
  let chosen = null, decided = false;

  const td = () => window.__td || null;
  function reset() { c = { run: { n: 0, y: 0 }, pass: { n: 0, y: 0 } }; chosen = null; decided = false; }
  function noted(side, yds) {
    const k = side === 'pass' ? 'pass' : side === 'run' ? 'run' : null; if (!k) return;
    c[k].n++; c[k].y += yds || 0;
  }
  const ypp = k => (c[k].n ? c[k].y / c[k].n : 0);
  // which side hurt you more, by yards per play (needs 3+ plays of each to say)
  function hurt() { if (c.run.n < 3 || c.pass.n < 3) return null; return ypp('run') > ypp('pass') ? 'run' : 'pass'; }
  function choose(id) { chosen = ADJ[id] || null; if (chosen && id === 'ease' && window.TDGas && TDGas.timeout) { try { TDGas.timeout(); } catch (e) {} } return chosen; }
  // fold the chosen adjustment into a mods object (multiplicative for the two gains, additive for the rest); pure
  function merge(m) {
    if (!chosen || !chosen.mods) return m;
    const out = Object.assign({}, m);
    for (const k of Object.keys(chosen.mods)) {
      out[k] = (k === 'passGain' || k === 'runGain') ? (out[k] != null ? out[k] : 1) * chosen.mods[k] : (out[k] || 0) + chosen.mods[k];
    }
    return out;
  }
  function active() { return chosen; }

  // ---- the panel -----------------------------------------------------------
  function show(done) {
    const old = document.getElementById('ha-panel'); if (old) old.remove();
    const h = hurt();
    const el = document.createElement('div');
    el.id = 'ha-panel';
    el.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(5,10,24,.94);display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;font-family:Arial,sans-serif;color:#fff';
    const line = k => c[k].n ? `${c[k].n} ${k === 'run' ? 'runs' : 'passes'} for <b>${c[k].y}</b> yds (${ypp(k).toFixed(1)} a play)` : `no ${k === 'run' ? 'runs' : 'passes'}`;
    const btn = a => `<div data-a="${a.id}" style="margin:8px 0;padding:14px 12px;border-radius:12px;background:#17325e;border:2px solid ${h === a.id ? '#ffd60a' : '#2d5a9e'};cursor:pointer;min-height:56px;box-sizing:border-box"><b style="font-size:18px">${a.ic} ${a.name}${h === a.id ? ' ★' : ''}</b><div style="font-size:13px;opacity:.85;margin-top:3px">${a.blurb}</div></div>`;
    el.innerHTML = `<div style="max-width:380px;width:100%"><div style="text-align:center;font-size:20px;font-weight:bold;color:#ffd60a;margin-bottom:6px">🗣 HALFTIME ADJUSTMENT</div>` +
      `<div style="font-size:14px;opacity:.9;margin-bottom:10px;text-align:center">Their first half:<br>${line('run')}<br>${line('pass')}${h ? `<br><span style="color:#ffd60a">★ ${h === 'run' ? 'the run' : 'the pass'} hurt you more</span>` : ''}</div>` +
      btn(ADJ.run) + btn(ADJ.pass) + btn(ADJ.ease) + `</div>`;
    document.body.appendChild(el);
    el.querySelectorAll('[data-a]').forEach(b => b.addEventListener('pointerdown', e => {
      e.preventDefault(); e.stopPropagation();
      choose(b.dataset.a); decided = true; el.remove();
      const g = td() && td().G; if (g && window.__td.sayComment) try { __td.sayComment(chosen.ic + ' ' + chosen.name + ' for the second half'); } catch (x) {}
      done();
    }));
  }
  // endBreak at the half: true = "I am holding the second half behind my panel" (it calls `cb` when you choose)
  function gate(cb) {
    if (document.getElementById('ha-panel')) return true;          // the panel is up: SPACE / a tap on the break screen must not skip past it
    const g = td() && td().G;
    if (decided || !g || !g.cpu || g.twoPlayer) return false;     // 1-player CPU drives only, and only once a game
    decided = true;       // (set before show so a second tap on the break screen cannot open it twice)
    show(cb);
    return true;
  }

  window.TDHalfAdj = { ADJ, reset, noted, hurt, choose, merge, active, show, gate, _counts: () => JSON.parse(JSON.stringify(c)) };
})();
