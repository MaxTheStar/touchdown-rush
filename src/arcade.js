// ============================================================
// TOUCHDOWN FUN — arcade.js: 🎯 THE PRACTICE ARCADE
// ------------------------------------------------------------
// A little arcade of quick skill drills you can play ANY time — no full game
// needed. Beat your own high scores and earn a few coins for a good run.
//
//   🎯 TARGET PRACTICE — targets pop up all over the field; tap them before
//      they vanish. Chain hits for a 🔥 combo bonus. 20 seconds on the clock.
//   🦵 FIELD GOAL CHALLENGE — a kick marker sweeps back and forth; tap KICK to
//      stop it in the green. Make it and you back up 5 yards for a harder one —
//      how far can you go before you miss?
//
//   SELF-CONTAINED ON PURPOSE — the whole arcade is its own little DOM world
//   (like the Halftime Show). It never touches the real football sim, so it
//   can't destabilize a game; it just hands you coins through TDShop.earn.
//
// Saved in `tdr-arcade` = { target: best points, fg: longest field goal (yd) }.
// Opened from the 🛍 Pro Shop; main.js doesn't need to know about it at all.
// ============================================================
(function () {
  'use strict';

  const T = window.TDStats ? TDStats.shared : null;
  const store = (k, v) => { if (T) T.store(k, v); };
  const load  = (k, f) => (T ? T.load(k, f) : f);
  const $ = id => document.getElementById(id);

  let best = load('arcade', null);
  if (!best || typeof best !== 'object') best = {};
  if (typeof best.target !== 'number') best.target = 0;
  if (typeof best.fg !== 'number') best.fg = 0;
  function save() { store('arcade', best); }

  // ---- timer bookkeeping (so nothing keeps ticking once you leave) --------
  let mode = null;            // 'target' | 'fg' | 'result' | null (hub)
  let timers = [];
  function clearTimers() { timers.forEach(id => { clearInterval(id); clearTimeout(id); }); timers = []; }
  const every = (fn, ms) => { const id = setInterval(fn, ms); timers.push(id); return id; };
  const after = (fn, ms) => { const id = setTimeout(fn, ms); timers.push(id); return id; };

  const hud = () => $('arc-hud');
  const stage = () => $('arc-stage');

  // ---- 🏠 the hub (pick a drill) ------------------------------------------
  function showHub() {
    mode = null; clearTimers();
    if (hud()) hud().style.display = 'none';
    if ($('arc-back')) $('arc-back').style.display = 'none';
    const s = stage(); if (!s) return;
    s.innerHTML =
      `<div class="arc-cards">
        <div class="arc-card" data-drill="target">
          <div class="arc-card-ic">🎯</div>
          <div class="arc-card-tx"><div class="arc-card-nm">TARGET PRACTICE</div>
            <div class="arc-card-bl">Tap the targets before they vanish — chain them for a combo!</div></div>
          <div class="arc-card-best">BEST<b>${best.target}</b></div>
        </div>
        <div class="arc-card" data-drill="fg">
          <div class="arc-card-ic">🦵</div>
          <div class="arc-card-tx"><div class="arc-card-nm">FIELD GOAL CHALLENGE</div>
            <div class="arc-card-bl">Stop the kick in the green — back up 5 yards each make!</div></div>
          <div class="arc-card-best">BEST<b>${best.fg}<small>yd</small></b></div>
        </div>
      </div>`;
    s.querySelectorAll('[data-drill]').forEach(c => c.addEventListener('pointerdown', e => {
      e.preventDefault(); c.getAttribute('data-drill') === 'target' ? startTarget() : startFG();
    }));
  }

  // ---- 🎯 TARGET PRACTICE -------------------------------------------------
  let tScore, tCombo, tTime;
  function startTarget() {
    mode = 'target'; clearTimers();
    tScore = 0; tCombo = 0; tTime = 20;
    if ($('arc-back')) $('arc-back').style.display = '';
    if (hud()) hud().style.display = 'flex';
    paintTargetHud();
    stage().innerHTML = '<div id="arc-field" class="arc-field"></div>';
    every(spawnTarget, 640);
    every(() => { tTime = Math.max(0, tTime - 0.1); paintTargetHud(); if (tTime <= 0) finishTarget(); }, 100);
    spawnTarget();
  }
  function paintTargetHud() {
    const h = hud(); if (!h) return;
    h.innerHTML = `<span class="arc-hud-s">🎯 ${tScore}</span>` +
      `<span class="arc-hud-c">${tCombo > 1 ? '🔥 x' + tCombo : ''}</span>` +
      `<span class="arc-hud-t">⏱ ${Math.ceil(tTime)}</span>`;
  }
  function spawnTarget() {
    const f = $('arc-field'); if (!f || mode !== 'target') return;
    if (f.querySelectorAll('.arc-tgt').length >= 4) return;
    const el = document.createElement('div');
    el.className = 'arc-tgt';
    el.style.left = (6 + Math.random() * 82) + '%';
    el.style.top = (6 + Math.random() * 76) + '%';
    el.textContent = '🎯';
    el.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); hitTarget(el); });
    f.appendChild(el);
    after(() => { if (el.parentNode && !el.classList.contains('hit')) { el.remove(); tCombo = 0; paintTargetHud(); } }, 1100);
  }
  function hitTarget(el) {
    if (el.classList.contains('hit') || mode !== 'target') return;
    el.classList.add('hit');
    tCombo++;
    tScore += 10 + Math.min(tCombo, 6) * 2;    // combo bonus, capped
    paintTargetHud();
    after(() => { if (el.parentNode) el.remove(); }, 140);
  }
  function finishTarget() {
    if (mode !== 'target') return;
    clearTimers();
    const isBest = tScore > best.target;
    if (isBest) { best.target = tScore; save(); }
    const coins = Math.min(20, Math.floor(tScore / 25));
    if (coins > 0 && window.TDShop) TDShop.earn(coins);
    result('🎯 TARGET PRACTICE', tScore + ' pts', coins, isBest, startTarget);
  }

  // ---- 🦵 FIELD GOAL CHALLENGE --------------------------------------------
  let fgMakes, fgYard;
  function startFG() {
    mode = 'fg'; clearTimers();
    fgMakes = 0; fgYard = 25;
    if ($('arc-back')) $('arc-back').style.display = '';
    if (hud()) hud().style.display = 'flex';
    buildKick();
  }
  function paintFgHud() {
    const h = hud(); if (!h) return;
    h.innerHTML = `<span class="arc-hud-s">🦵 ${fgMakes} made</span><span class="arc-hud-t">${fgYard} yd</span>`;
  }
  function buildKick() {
    if (mode !== 'fg') return;
    paintFgHud();
    const zone = Math.max(15, 44 - (fgYard - 25) * 1.15);   // green shrinks with distance
    const dur = Math.max(0.5, 1.25 - (fgYard - 25) * 0.02);  // sweep speeds up
    stage().innerHTML =
      `<div class="arc-fg">
        <div class="arc-posts"><span></span><span></span></div>
        <div class="arc-ball">🏈</div>
        <div class="arc-meter"><div class="arc-zone"></div>
          <div class="arc-marker" id="arc-marker" style="animation-duration:${dur}s"></div></div>
        <div class="arc-kick" id="arc-kick">KICK! 🦵</div>
        <div class="arc-fg-msg" id="arc-fg-msg">${fgYard} yards out — stop it in the green!</div>
      </div>`;
    const z = stage().querySelector('.arc-zone'); if (z) z.style.width = zone + '%';
    $('arc-kick').addEventListener('pointerdown', e => { e.preventDefault(); kick(); });
  }
  function kick() {
    if (mode !== 'fg') return;
    const m = $('arc-marker'), meter = m && m.parentElement, z = meter && meter.querySelector('.arc-zone');
    if (!m || !meter || !z) return;
    m.style.animationPlayState = 'paused';
    const pr = meter.getBoundingClientRect(), mr = m.getBoundingClientRect(), zr = z.getBoundingClientRect();
    const center = mr.left + mr.width / 2;
    const good = center >= zr.left && center <= zr.right;
    const msg = $('arc-fg-msg'), btn = $('arc-kick');
    if (btn) btn.style.pointerEvents = 'none';
    if (good) {
      fgMakes++;
      if (msg) { msg.textContent = '✅ GOOD from ' + fgYard + '!'; msg.className = 'arc-fg-msg good'; }
      fgYard += 5;
      after(buildKick, 800);
    } else {
      if (msg) { msg.textContent = '❌ NO GOOD — just wide!'; msg.className = 'arc-fg-msg bad'; }
      after(finishFG, 950);
    }
  }
  function finishFG() {
    if (mode !== 'fg') return;
    clearTimers();
    const longest = fgMakes > 0 ? 25 + (fgMakes - 1) * 5 : 0;   // last distance you made
    const isBest = longest > best.fg;
    if (isBest) { best.fg = longest; save(); }
    const coins = Math.min(25, fgMakes * 4);
    if (coins > 0 && window.TDShop) TDShop.earn(coins);
    const txt = fgMakes > 0 ? fgMakes + ' made · longest ' + longest + ' yd' : 'no makes — try again!';
    result('🦵 FIELD GOAL CHALLENGE', txt, coins, isBest, startFG);
  }

  // ---- 🏁 the result screen (shared) --------------------------------------
  function result(title, scoreText, coins, isBest, replay) {
    mode = 'result'; clearTimers();
    if (hud()) hud().style.display = 'none';
    if ($('arc-back')) $('arc-back').style.display = 'none';
    stage().innerHTML =
      `<div class="arc-result">
        <div class="arc-res-t">${title}</div>
        ${isBest ? '<div class="arc-res-best">🏆 NEW BEST!</div>' : ''}
        <div class="arc-res-score">${scoreText}</div>
        <div class="arc-res-coins">${coins > 0 ? '🪙 +' + coins + ' coins' : 'Keep practicing!'}</div>
        <div class="arc-res-btns">
          <div class="ov-btn yes" id="arc-again">PLAY AGAIN</div>
          <div class="ov-btn" id="arc-tohub">← ARCADE</div>
        </div>
      </div>`;
    if (window.TDShop && TDShop.celebrate && (isBest || coins > 0))
      TDShop.celebrate(stage(), isBest ? '🏆' : '🪙', isBest ? 'NEW BEST!' : '+' + coins + ' 🪙');
    $('arc-again').addEventListener('pointerdown', e => { e.preventDefault(); replay(); });
    $('arc-tohub').addEventListener('pointerdown', e => { e.preventDefault(); showHub(); });
  }

  // ---- pop-up plumbing ----------------------------------------------------
  function gameKeyboard(on) { try { window.game.input.keyboard.enabled = on; } catch (e) {} }
  function open()  { const m = $('arcade-modal'); if (!m) return; gameKeyboard(false); showHub(); m.style.display = 'flex'; }
  function close() { clearTimers(); mode = null; const m = $('arcade-modal'); if (m) m.style.display = 'none'; gameKeyboard(true); }

  function wire() {
    const tap = (id, fn) => { const el = $(id); if (el) el.addEventListener('pointerdown', e => { e.preventDefault(); fn(); }); };
    tap('open-arcade', open);
    tap('arcade-close', close);
    tap('arc-back', showHub);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire);
  else wire();

  window.TDArcade = {
    open, close, showHub,
    best: () => Object.assign({}, best),
    _state: () => ({ mode, tScore, tCombo, tTime, fgMakes, fgYard }),
    _startTarget: startTarget, _startFG: startFG,   // for verification
  };
})();
