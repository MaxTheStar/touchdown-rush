// ============================================================
// TOUCHDOWN FUN — gameplan.js: 🎓 THE GAME PLAN (Round 8, pick ⑦)
// ------------------------------------------------------------
// Before kickoff, a real coach decides HOW the team is going to play
// today. That's this: pick one plan and it changes your whole team for
// every game until you change it.
//
// The important bit — every plan gives something AND takes something.
// There is no "best" one, only the right one for how you like to play:
//
//   ⚖️ BALANCED        no changes at all (the default)
//   ✈️ AIR RAID        sharper throws + surer hands, but you run slower
//   🏃 GROUND & POUND  faster running + more broken tackles, wilder throws
//   🛡️ BALL SECURITY   almost no fumbles + safer throws, a step slower
//
// ------------------------------------------------------------
// HOW IT REACHES THE GAME — no main.js changes
// ------------------------------------------------------------
// shop.js already gathers every bonus in the game into a handful of
// little functions (speedMult, gloveBoost, armAccuracy…) that main.js
// asks for while you play. The 🎡 spin buffs and ⚡ power-ups already
// fold into those same functions. We do exactly the same, so the plan
// is live everywhere the gear is — and with no plan chosen (or this
// file missing) every number is ×1 / +0, i.e. the game is unchanged.
// ============================================================
(function () {
  'use strict';

  // Short name — TDStats.shared adds the "tdr-" (so this is "tdr-plan").
  const KEY = 'plan';
  const $ = id => document.getElementById(id);

  const T = window.TDStats ? TDStats.shared : null;
  const store = (k, v) => { if (T) T.store(k, v); };
  const load  = (k, f) => (T ? T.load(k, f) : f);

  // ---- The plans ----------------------------------------------------------
  // speed  — multiplied into your run speed (1 = no change)
  // catch  — added to catch chance / taken off drops
  // arm    — added to "how much we cut interceptions" (negative = more picks)
  // stiff  — added to the chance you break the first tackle
  // grip   — added to "how much we cut fumbles"
  const PLANS = [
    { id: 'balanced', icon: '⚖️', name: 'BALANCED',
      blurb: 'No changes. Play it straight.',
      good: 'Nothing to remember', bad: 'No edge either',
      speed: 1, catch: 0, arm: 0, stiff: 0, grip: 0 },

    { id: 'air', icon: '✈️', name: 'AIR RAID',
      blurb: 'Throw it all over the field.',
      good: 'Sharper throws · surer hands', bad: 'You run a step slower',
      speed: 0.94, catch: 0.07, arm: 0.18, stiff: 0, grip: 0 },

    { id: 'ground', icon: '🏃', name: 'GROUND & POUND',
      blurb: 'Run it down their throats.',
      good: 'Faster running · break more tackles', bad: 'Throws get wilder',
      speed: 1.07, catch: -0.03, arm: -0.14, stiff: 0.12, grip: 0.10 },

    { id: 'safe', icon: '🛡️', name: 'BALL SECURITY',
      blurb: 'Whatever happens, hang on to it.',
      good: 'Almost no fumbles · safer throws', bad: 'A step slower, fewer big plays',
      speed: 0.96, catch: 0.02, arm: 0.12, stiff: -0.02, grip: 0.35 },
  ];
  const byId = id => PLANS.find(p => p.id === id) || PLANS[0];

  // ---- State --------------------------------------------------------------
  let chosen = null;
  function ensure() {
    if (chosen === null) chosen = load(KEY, 'balanced');
    if (!PLANS.some(p => p.id === chosen)) chosen = 'balanced';
  }
  function current() { ensure(); return byId(chosen); }

  function choose(id) {
    if (!PLANS.some(p => p.id === id)) return;
    chosen = id;
    store(KEY, chosen);
    render();
  }

  // ---- What shop.js asks us for (harmless when BALANCED) ------------------
  const speedMult = () => current().speed;
  const catchAdd  = () => current().catch;
  const armAdd    = () => current().arm;
  const stiffAdd  = () => current().stiff;
  const gripAdd   = () => current().grip;

  // ---- Drawing ------------------------------------------------------------
  function render() {
    ensure();
    const list = $('plan-list');
    if (!list) return;
    list.innerHTML = PLANS.map(p => {
      const on = p.id === chosen;
      return '<div class="plan-row' + (on ? ' on' : '') + '" data-plan="' + p.id + '">' +
        '<div class="plan-top">' +
          '<span class="plan-ic">' + p.icon + '</span>' +
          '<span class="plan-name">' + p.name + '</span>' +
          (on ? '<span class="plan-on">IN USE</span>' : '<span class="plan-pick">USE</span>') +
        '</div>' +
        '<div class="plan-blurb">' + p.blurb + '</div>' +
        (p.id === 'balanced' ? '' :
          '<div class="plan-tradeoff">' +
            '<span class="plan-good">▲ ' + p.good + '</span>' +
            '<span class="plan-bad">▼ ' + p.bad + '</span>' +
          '</div>') +
      '</div>';
    }).join('');

    list.querySelectorAll('.plan-row').forEach(el => {
      el.addEventListener('pointerdown', e => {
        e.preventDefault(); e.stopPropagation();
        choose(el.getAttribute('data-plan'));
      });
    });

    const foot = $('plan-foot');
    if (foot) {
      const p = current();
      foot.textContent = p.id === 'balanced'
        ? 'Every plan gives something and costs something — there is no best one.'
        : 'Running ' + p.icon + ' ' + p.name + ' — changes every game until you switch.';
    }
  }

  function open()  { ensure(); const m = $('plan-modal'); if (m) { m.style.display = 'flex'; render(); } }
  function close() { const m = $('plan-modal'); if (m) m.style.display = 'none'; }

  // ---- Wire up ------------------------------------------------------------
  function onTap(id, fn) {
    const el = $(id);
    if (el) el.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); fn(); });
  }
  function wireUp() { ensure(); onTap('open-plan', open); onTap('plan-close', close); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wireUp);
  else wireUp();

  window.TDPlan = {
    open, close, render, choose, current,
    speedMult, catchAdd, armAdd, stiffAdd, gripAdd,
    plans: () => PLANS.slice(),
  };
})();
