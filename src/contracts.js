// ============================================================
// TOUCHDOWN FUN — contracts.js: ✍️ CONTRACT EXTENSIONS (Round 26, pick ⑥)  window.TDContract
// ------------------------------------------------------------
// Salaries were a payroll number; nobody's deal ever ran out. Now every starter has YEARS LEFT (1-3 to start, shown nowhere until it
// matters). When a season ENDS (champions crowned or you are out) everyone's deal ticks down one year. If any starter's reaches 0,
// ONE of them (the best) is "up": the Season screen asks you to EXTEND (2 more years, for coins) or let him WALK. Walking swaps in a
// bench player 6-14 overall lower, so the team is ALWAYS still eight deep. Ignore the question and he walks when the next season starts.
//   ⚠️ ONE player a season, the others expiring that year get a 1-year reprieve, so a roster can never be gutted in one go.
//   ⚠️ Your ✏️ Create-A-Player star (`custom`) has no contract: he never walks.
//   ⚠️ NO HOLDOUTS: the chart's "skip him a week" half is not built (a week with a man missing needs the injury stand-in machinery and a
//   second reason to lose a starter); the choice is the whole feature.
//   Price = about 4 coins per $M of his salary (same curve as draft.js salaryOf), at least 10. Saved: 'tdr-contracts' {yrs:{id:n}, pending}.
// ============================================================
(function () {
  'use strict';
  const T = window.TDStats ? TDStats.shared : null;
  const load = (k, f) => (T ? T.load(k, f) : f);
  const store = (k, v) => { if (T) T.store(k, v); };
  let c = load('contracts', null);
  if (!c || typeof c !== 'object') c = {};
  if (!c.yrs || typeof c.yrs !== 'object') c.yrs = {};
  if (c.pending && (typeof c.pending !== 'object' || !c.pending.id)) c.pending = null;
  if (!c.pending) c.pending = null;
  const save = () => store('contracts', c);
  const D = () => window.TDDraft || null;
  const ages = () => { try { return (D() && D().rosterAges) ? D().rosterAges() : []; } catch (e) { return []; } };
  const priceOf = ovr => Math.max(10, Math.round(0.06 * Math.pow(Math.max(0, ovr - 50), 1.6)) * 4);
  const startYears = id => 1 + (String(id).split('').reduce((a, ch) => a + ch.charCodeAt(0), 0) % 3);   // 1-3, steady per player

  function ensure() {
    ages().forEach(p => { if (!p.custom && c.yrs[p.id] == null) c.yrs[p.id] = startYears(p.id); });
  }
  // a season just ended: tick every deal, and put the best expiring player up (the rest get one more year)
  function seasonOver() {
    if (c.pending) return c.pending;               // a question is already waiting
    ensure();
    const roster = ages().filter(p => !p.custom);
    roster.forEach(p => { c.yrs[p.id] = (c.yrs[p.id] || 1) - 1; });
    const expiring = roster.filter(p => c.yrs[p.id] <= 0).sort((a, b) => b.ovr - a.ovr);
    expiring.forEach((p, i) => { if (i > 0) c.yrs[p.id] = 1; });          // reprieve for everyone but the best
    if (expiring.length) {
      const p = expiring[0];
      c.pending = { id: p.id, name: p.name, pos: p.pos, ovr: p.ovr, price: priceOf(p.ovr) };
    }
    save();
    return c.pending;
  }
  function extend() {
    const p = c.pending; if (!p) return false;
    const S = window.TDShop; if (!S || S.coins() < p.price) return false;
    S.spend(p.price);
    c.yrs[p.id] = 2; c.pending = null; save(); return true;
  }
  function walk() {
    const p = c.pending; if (!p) return false;
    const now = ages().find(x => x.id === p.id);
    c.pending = null; delete c.yrs[p.id];
    if (now && D() && D().swapIn && D().makeBenchPlayer) {
      const sub = D().makeBenchPlayer(now.pos, now.ovr - 14, now.ovr - 6);
      D().swapIn(now.slot, sub, 0);            // the slot is refilled in the same breath: always eight
      const g = ages().find(x => x.slot === now.slot); if (g) c.yrs[g.id] = 2;
    }
    save(); return true;
  }
  // the next season is starting: anyone you never answered walks
  function newSeason() { if (c.pending) walk(); }
  function pending() { return c.pending ? Object.assign({}, c.pending) : null; }

  function html() {
    const p = c.pending; if (!p) return '';
    const can = window.TDShop && TDShop.coins() >= p.price;
    return `<div class="se-cap">✍️ CONTRACT UP <small>(answer before next season or he walks)</small></div>` +
      `<div class="se-ticker" style="display:block;padding:10px;margin-bottom:8px;background:rgba(255,255,255,.06);border-radius:8px;text-align:left">` +
      `<b>${p.name}</b> · ${p.pos} · ${p.ovr} overall<br><span style="opacity:.8">His deal is up. Re-sign him for 2 more years?</span>` +
      `<div data-ct="extend" style="margin:8px 0 4px;padding:10px;border-radius:10px;min-height:44px;box-sizing:border-box;cursor:${can ? 'pointer' : 'default'};background:${can ? '#17325e' : '#2a2a2a'};border:2px solid ${can ? '#ffd60a' : '#555'};opacity:${can ? 1 : .6}"><b>✍️ EXTEND</b> · ${p.price} 🪙${can ? '' : ' (not enough coins)'}</div>` +
      `<div data-ct="walk" style="padding:10px;border-radius:10px;min-height:44px;box-sizing:border-box;cursor:pointer;background:#17325e;border:2px solid #2d5a9e"><b>👋 LET HIM WALK</b> · a bench player takes his spot</div></div>`;
  }
  function act(k) { return k === 'extend' ? extend() : k === 'walk' ? walk() : false; }

  window.TDContract = { seasonOver, extend, walk, newSeason, pending, html, act, yearsLeft: id => c.yrs[id], _state: () => JSON.parse(JSON.stringify(c)) };
})();
