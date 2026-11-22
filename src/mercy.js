// ============================================================
// TOUCHDOWN FUN — mercy.js: 🏁 MERCY RULE (Round 28, pick ④)  window.TDMercy
// ------------------------------------------------------------
// A 40-point blowout still had to be played out to the end. When the second half is about to start (the break into the 3rd or 4th quarter) and
// YOU lead by 35 or more, a card offers to END THE GAME NOW. 🏁 END IT counts as a normal finished game at that score (stats, coins, season result and
// streak all go through the real `endGame`); KEEP PLAYING carries on exactly as before, and the card is asked at most once per break.
// ⚠️ ONLY THE LEADER IS OFFERED IT: if the CPU leads by 35 you are never handed a way out of a loss, so the rule can never be used to dodge one.
// ⚠️ NEVER FOR A GAME THAT MUST BE PLAYED OUT: the season semifinal and Max Bowl, the 🏆 playoff tournament, the 👑 boss, drills, all-star, Superstar,
// sim takeover and 2-player games are never offered it. Nothing is saved. main.js `endBreak()` asks `TDMercy.gate(keep, end)` beside the halftime panel.
// ============================================================
(function () {
  'use strict';
  const LEAD = 35;
  let asked = 0;           // the quarter we last asked in (so a break is asked once)
  const td = () => window.__td || null;

  // pure: should the card show? c = { quarter, my, opp, overtime, special (true for a game that must be played out) }
  function eligible(c) {
    if (!c || c.special || c.overtime) return false;
    if (c.quarter < 3) return false;
    return (c.my - c.opp) >= LEAD;
  }
  function special(g) {
    if (g.twoPlayer || g.drillGame || g.allStarGame || g.starGame || g.simTakeover || g.bossGame || g.playoffGame || g.houseGame) return true;
    try {
      if (g.seasonGame && window.TDSeason && TDSeason.table) { const t = TDSeason.table(); if (t && (t.phase === 'semifinal' || t.phase === 'maxbowl')) return true; }
    } catch (e) {}
    return false;
  }
  function newGame() { asked = 0; const old = document.getElementById('mr-panel'); if (old) old.remove(); }
  // returns true when it is HOLDING the break behind its card (it calls keep() or end() itself)
  function gate(keep, end) {
    const t = td(), g = t && t.G;
    if (!g || document.getElementById('mr-panel')) return !!document.getElementById('mr-panel');
    if (asked === g.quarter) return false;
    if (!eligible({ quarter: g.quarter, my: g.score, opp: g.oppScore, overtime: g.overtime, special: special(g) })) return false;
    asked = g.quarter;
    const el = document.createElement('div');
    el.id = 'mr-panel';
    el.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(5,10,24,.94);display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;font-family:Arial,sans-serif;color:#fff';
    const btn = (id, label, sub, gold) => `<div data-a="${id}" style="margin:8px 0;padding:14px 12px;border-radius:12px;background:#17325e;border:2px solid ${gold ? '#ffd60a' : '#2d5a9e'};cursor:pointer;min-height:44px"><div style="font-size:17px;font-weight:bold">${label}</div><div style="font-size:13px;opacity:.85;margin-top:3px">${sub}</div></div>`;
    el.innerHTML = `<div style="max-width:380px;width:100%"><div style="text-align:center;font-size:20px;font-weight:bold;color:#ffd60a;margin-bottom:6px">🏁 MERCY RULE</div>` +
      `<div style="font-size:14px;opacity:.9;margin-bottom:10px;text-align:center">You lead ${g.score}–${g.oppScore}. End the game here?</div>` +
      btn('end', '🏁 END IT', 'Counts as a normal win at this score.', true) + btn('keep', '🏈 KEEP PLAYING', 'Play the rest of the game.', false) + `</div>`;
    document.body.appendChild(el);
    let fired = false;
    const go = which => { if (fired) return; fired = true; el.remove(); try { (which === 'end' ? end : keep)(); } catch (e) { console.error(e); } };
    el.querySelectorAll('[data-a]').forEach(b => b.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); go(b.dataset.a); }));
    return true;
  }
  window.TDMercy = { eligible, gate, newGame, LEAD };
})();
