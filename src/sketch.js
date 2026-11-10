// ============================================================
// TOUCHDOWN FUN — sketch.js: ✏️ DRAW YOUR OWN PLAY (Round 25, pick ⑧)
// ------------------------------------------------------------
// ⚠️ NAME: `window.TDDraw` is the 🎭 DRAW play (draw.js), so this is TDSketch.
// Every route in the game is one the game made. Pick ✏️ on the special-call button (📋) and a drawing pad opens: drag a finger (or the mouse) to draw
// ONE route for your first receiver, tap DONE, and he runs it.
//
// THE LIMITS THAT KEEP IT HONEST (a drawn route must not beat every coverage):
//   · the line is cut to MAX_LEN (320px, about as long as the longest built-in route) and turned into at most MAX_PTS (6) waypoints, one every ~STEP px;
//   · he runs it at SPEED (0.9) of a built-in route's speed, and stops at the last waypoint (he sits down there, like a hook);
//   · the pad shows 30 yards upfield from where he lines up, and a route that goes nowhere (under MIN_LEN) is a plain straight route.
// Nothing is saved. main.js: `case 'sketch'` in routeVelocity / routePath (and `TDSketch.vel` / `TDSketch.path`).
// ============================================================
(function () {
  'use strict';
  const MAX_LEN = 320, MAX_PTS = 6, STEP = 52, SPEED = 0.9, MIN_LEN = 40, REACH = 9, PAD = 300;
  const td = () => window.__td || null;
  const G  = () => { const t = td(); return t ? t.G : null; };
  let raw = [];                          // the finger's path, in pad pixels (== world px, y down), relative to the start

  // cut a raw path to MAX_LEN and keep <= MAX_PTS waypoints (pure). Points are {x,y} offsets from the start; y negative = upfield.
  function simplify(path) {
    if (!path || path.length < 2) return [];
    const out = []; let acc = 0, last = { x: 0, y: 0 }, lastKept = { x: 0, y: 0 };
    for (const p of path) {
      const d = Math.hypot(p.x - last.x, p.y - last.y);
      if (acc + d > MAX_LEN) { const k = (MAX_LEN - acc) / d; p.x = last.x + (p.x - last.x) * k; p.y = last.y + (p.y - last.y) * k; acc = MAX_LEN; }
      else acc += d;
      last = { x: p.x, y: p.y };
      if (Math.hypot(p.x - lastKept.x, p.y - lastKept.y) >= STEP) { out.push({ x: Math.round(p.x), y: Math.round(p.y) }); lastKept = { x: p.x, y: p.y }; }
      if (acc >= MAX_LEN) break;
    }
    if (acc >= MIN_LEN && (!out.length || Math.hypot(last.x - out[out.length - 1].x, last.y - out[out.length - 1].y) > 12)) out.push({ x: Math.round(last.x), y: Math.round(last.y) });
    while (out.length > MAX_PTS) { out.splice(Math.floor(out.length / 2), 1); }   // drop middle points before the end ones
    return acc >= MIN_LEN ? out : [];
  }
  const length = pts => { let a = { x: 0, y: 0 }, L = 0; for (const p of pts) { L += Math.hypot(p.x - a.x, p.y - a.y); a = p; } return L; };

  // ---- the receiver follows the waypoints --------------------------------
  function vel(o, S) {
    const g = G(); const pts = g && g.sketchPts; if (!pts || !pts.length) return { vx: 0, vy: -S };
    // ⚠️ the waypoints are clamped INSIDE the field (a route drawn off the edge used to run him out of bounds, which measured as 'open' because nobody follows you there)
    const wx = k => Math.max(12, Math.min(521, o.startX + pts[k].x)), wy = k => Math.max(40, o.startY + pts[k].y);
    let i = o._ski || 0;
    while (i < pts.length && Math.hypot(wx(i) - o.s.x, wy(i) - o.s.y) < REACH) i++;
    o._ski = i;
    if (i >= pts.length) return { vx: 0, vy: 0 };
    const dx = wx(i) - o.s.x, dy = wy(i) - o.s.y, d = Math.hypot(dx, dy) || 1;
    return { vx: dx / d * S * SPEED, vy: dy / d * S * SPEED };
  }
  function path(o, clampX) {
    const g = G(), pts = (g && g.sketchPts) || [];
    const out = [{ x: o.s.x, y: o.s.y }];
    if (!pts.length) return [out[0], { x: o.s.x, y: Math.max(40, o.s.y - 300) }];
    for (const p of pts) out.push({ x: clampX(o.s.x + p.x), y: Math.max(40, o.s.y + p.y) });
    return out;
  }

  // ---- the pad -------------------------------------------------------------
  function gameKeyboard(on) { try { window.game.input.keyboard.enabled = on; } catch (e) {} }
  function openPad() {
    const g = G(), t = td(); if (!g || !t) return;
    const old = document.getElementById('sk-pad'); if (old) old.remove();
    raw = [];
    const el = document.createElement('div'); el.id = 'sk-pad';
    el.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(5,10,24,.95);display:flex;align-items:center;justify-content:center;padding:12px;box-sizing:border-box;font-family:Arial,sans-serif;color:#fff;touch-action:none';
    el.innerHTML = '<div style="max-width:340px;width:100%;text-align:center"><div style="font-size:19px;font-weight:bold;color:#ffd60a">✏️ DRAW YOUR ROUTE</div>' +
      '<div style="font-size:12px;opacity:.8;margin:4px 0 8px">Drag from the white dot. It is cut at about 32 yards and he sits down at the end.</div>' +
      '<canvas id="sk-cv" width="' + PAD + '" height="' + PAD + '" style="width:100%;max-width:300px;aspect-ratio:1;background:#14502b;border:2px solid #fff;border-radius:8px;touch-action:none"></canvas>' +
      '<div style="display:flex;gap:10px;margin-top:10px"><div id="sk-clear" style="flex:1;padding:14px;border-radius:10px;background:#3a4560;font-weight:bold;cursor:pointer">CLEAR</div>' +
      '<div id="sk-done" style="flex:2;padding:14px;border-radius:10px;background:#1e8f4a;font-weight:bold;cursor:pointer">DONE ✓</div></div></div>';
    document.body.appendChild(el); gameKeyboard(false);
    const cv = el.querySelector('#sk-cv'), cx = cv.getContext('2d'), sx = PAD / 2, sy = PAD - 22;
    const paint = () => {
      cx.clearRect(0, 0, PAD, PAD);
      cx.strokeStyle = 'rgba(255,255,255,.25)'; cx.lineWidth = 1;
      for (let y = sy; y > 0; y -= 100) { cx.beginPath(); cx.moveTo(0, y); cx.lineTo(PAD, y); cx.stroke(); }   // a yard line every 10 yards
      const pts = simplify(raw.map(p => ({ x: p.x, y: p.y })));
      cx.strokeStyle = '#ffd60a'; cx.lineWidth = 4; cx.beginPath(); cx.moveTo(sx, sy);
      for (const p of pts) cx.lineTo(sx + p.x, sy + p.y); cx.stroke();
      cx.fillStyle = '#ffd60a'; for (const p of pts) { cx.beginPath(); cx.arc(sx + p.x, sy + p.y, 4, 0, 7); cx.fill(); }
      cx.fillStyle = '#fff'; cx.beginPath(); cx.arc(sx, sy, 7, 0, 7); cx.fill();
    };
    paint();
    let down = false;
    const at = e => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * PAD / r.width - sx, y: (e.clientY - r.top) * PAD / r.height - sy }; };
    cv.addEventListener('pointerdown', e => { e.preventDefault(); down = true; raw = [{ x: 0, y: 0 }, at(e)]; paint(); });
    cv.addEventListener('pointermove', e => { if (!down) return; e.preventDefault(); raw.push(at(e)); paint(); });
    window.addEventListener('pointerup', () => { down = false; }, { once: false });
    el.querySelector('#sk-clear').addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); raw = []; paint(); });
    el.querySelector('#sk-done').addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); finish(); });
  }
  function finish() {
    const g = G(), t = td(); const pad = document.getElementById('sk-pad'); if (pad) pad.remove(); gameKeyboard(true);
    if (!g || !t) return;
    g.sketchPts = simplify(raw.map(p => ({ x: p.x, y: p.y })));
    try { t.drawRoutePreview(); } catch (e) {}
  }

  // ---- the special-call plumbing ---------------------------------------------
  function can() { const g = G(); return !!(g && td() && g.state === 'presnap' && g.team != null); }
  function arm() {
    const g = G(), t = td(); if (!g || !t) return;
    g.sketchOn = true; g.sketchPts = g.sketchPts || [];
    t.offense[2].route = 'sketch';
    try { t.drawRoutePreview(); } catch (e) {}
    openPad();
  }
  function disarm() {
    const g = G(), t = td(); if (!g || !t) return;
    g.sketchOn = false;
    const pad = document.getElementById('sk-pad'); if (pad) { pad.remove(); gameKeyboard(true); }
    if (g.concept) t.offense[2].route = g.concept.wr1;
    try { t.drawRoutePreview(); } catch (e) {}
  }
  function afterSnap() { const g = G(), t = td(); if (g) { t.offense[2]._ski = 0; } if (t) t.sayComment('✏️ Your play! He runs the route you drew.'); }

  window.TDSketch = { MAX_LEN, MAX_PTS, STEP, SPEED, MIN_LEN, simplify, length, vel, path, can, arm, disarm, afterSnap, openPad, finish };
  if (window.TDCalls) TDCalls.register({ id: 'sketch', icon: '✏️', label: 'SKETCH', can, arm, disarm, afterSnap,
    newPlay: () => { const g = G(); if (g) { g.sketchOn = false; } const t = td(); if (t && t.offense[2]) t.offense[2]._ski = 0; } });
})();
