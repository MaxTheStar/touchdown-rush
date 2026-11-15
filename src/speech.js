// ============================================================
// TOUCHDOWN FUN — speech.js: 📣 PRE-GAME SPEECH (Round 26, pick ③)  window.TDSpeech
// ------------------------------------------------------------
// The team used to walk out with nothing said. Before the kickoff of a REAL game (season, playoff, rival, boss; one player) you pick one of
// three short speeches. Each trades a sliver of one side for a sliver of the other, so none is "the best":
//   🔥 FIRE THEM UP   your offense ×1.02, but they get ×1.012 (you are loose on defense)
//   🧘 STAY CALM      their offense ×0.985, but yours ×0.99 (careful, a little slow)
//   🤝 KEEP IT PLAIN  nothing changes (the old game, exactly)
// ⚠️ SMALL ON PURPOSE: the spread between the best and worst speech is about 1-2%, the size of a coach's tweak, never a result-decider.
// It multiplies G.myOff / G.oppOff once, at the choice, AFTER beginGame set them, and beginGame resets them next game, so nothing carries over.
// Nothing is saved. A 30s safety timer picks KEEP IT PLAIN, so the kickoff can never be held forever. main.js: chained in beginGame
// between the scouting card and the coin toss (`TDSpeech.pregame(next)` returns true when it is holding the kickoff).
// ============================================================
(function () {
  'use strict';
  const SP = {
    fire:  { id: 'fire',  ic: '🔥', name: 'FIRE THEM UP',  blurb: 'Your offense hits harder. But you are loose on defense.', my: 1.02, opp: 1.012 },
    calm:  { id: 'calm',  ic: '🧘', name: 'STAY CALM',     blurb: 'Their offense is tamed. But yours plays careful.',        my: 0.99, opp: 0.985 },
    plain: { id: 'plain', ic: '🤝', name: 'KEEP IT PLAIN', blurb: 'Nothing said. Nothing changes.',                          my: 1,    opp: 1 },
  };
  let chosen = null, safety = 0;
  const td = () => window.__td || null;

  // is this a game that gets a speech? one-player real games only
  function eligible(g) {
    return !!g && !g.twoPlayer && !g.drillGame && !g.houseGame && !g.allStarGame && !g.starGame && !g.simTakeover &&
           !!(g.seasonGame || g.playoffGame || g.rivalGame || g.bossGame);
  }
  // fold a speech into the game's two ratings (pure on numbers; the one place it touches G)
  function apply(id, g) {
    const s = SP[id] || SP.plain; chosen = s;
    if (g) { g.myOff *= s.my; g.oppOff *= s.opp; }
    return s;
  }
  function pregame(done) {
    const g = td() && td().G;
    chosen = null;
    if (!eligible(g) || typeof done !== 'function') return false;
    const old = document.getElementById('sp-panel'); if (old) old.remove();
    const el = document.createElement('div');
    el.id = 'sp-panel';
    el.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(5,10,24,.94);display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;font-family:Arial,sans-serif;color:#fff';
    const btn = a => `<div data-a="${a.id}" style="margin:8px 0;padding:14px 12px;border-radius:12px;background:#17325e;border:2px solid #2d5a9e;cursor:pointer;min-height:44px"><div style="font-size:17px;font-weight:bold">${a.ic} ${a.name}</div><div style="font-size:13px;opacity:.85;margin-top:3px">${a.blurb}</div></div>`;
    el.innerHTML = `<div style="max-width:380px;width:100%"><div style="text-align:center;font-size:20px;font-weight:bold;color:#ffd60a;margin-bottom:6px">📣 PRE-GAME SPEECH</div>` +
      `<div style="font-size:14px;opacity:.9;margin-bottom:10px;text-align:center">The team is in the tunnel. Say something.</div>` + btn(SP.fire) + btn(SP.calm) + btn(SP.plain) + `</div>`;
    document.body.appendChild(el);
    let fired = false;
    const go = id => {
      if (fired) return; fired = true; clearTimeout(safety); safety = 0; el.remove();
      const s = apply(id, td().G);
      if (id !== 'plain') { try { td().sayComment(s.ic + ' ' + s.name + '!'); } catch (x) {} }
      try { done(); } catch (x) {}
    };
    el.querySelectorAll('[data-a]').forEach(b => b.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); go(b.dataset.a); }));
    safety = setTimeout(() => go('plain'), 30000);
    return true;
  }
  window.TDSpeech = { SP, eligible, apply, pregame, active: () => chosen };
})();
