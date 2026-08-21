// ============================================================
// TOUCHDOWN FUN — film.js: 🎬 THE FILM ROOM
// ------------------------------------------------------------
// The game already has an INSTANT REPLAY — right after you score it rolls the
// last couple seconds back in slow-mo, then it's gone forever. THE FILM ROOM is
// different: it's your own SAVED highlight reel. Every touchdown you score, we
// quietly keep the ball's actual PATH — the real juke-and-dash into the end zone —
// and stash your best ones. Open the Film Room any time (from the 🏆 Trophy Case)
// to re-watch your longest bombs, your pick-sixes, your trick-play scores, traced
// out on a little field like a director's cut of your career.
//
// How it stays cheap & self-contained: main.js hands us the recorded frames the
// instant a TD happens (window.TDFilm.capture) — the SAME film the instant replay
// uses — and we boil each one down to ~30 points of the ball's route. We keep the
// top dozen (saved in localStorage 'tdr-film'), and replay them on a plain HTML
// <canvas>. This file never touches Phaser; the whole "theater" is DOM + canvas.
// ============================================================
(function () {
  const KEY = 'tdr-film';
  const CAP = 12;            // how many highlights we keep (the best ones)
  const MIN_FRAMES = 12;     // need at least this much film to have a real path
  const SAMPLES = 30;        // boil each path down to ~this many points
  const FIELD_W = 533;       // matches main.js FIELD_WIDTH, so lateral position stays true
  const $ = id => document.getElementById(id);

  let reel = load();         // the saved highlights, newest first
  let idx = 0;               // which one the theater is showing
  let animTimer = null;      // the playback timer (setInterval — NOT rAF, which pauses in bg tabs)

  // ---- Save & load -------------------------------------------------------
  function load() { try { const r = JSON.parse(localStorage.getItem(KEY)); return Array.isArray(r) ? r : []; } catch (e) { return []; } }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(reel)); } catch (e) {} }

  // ---- What KIND of highlight is this? -----------------------------------
  function typeOf(m, yds) {
    if (m.pickSix) return 'pick6';
    if (m.trick)   return 'trick';
    if (yds >= 40) return 'bomb';
    return 'td';
  }
  // A "keep score" so that when the reel is full we drop the least-exciting play
  // (special scores get a bump so a pick-six never gets bumped by a 3-yard plunge).
  function keepScore(h) { return (h.yds || 0) + (h.type === 'pick6' ? 15 : 0) + (h.type === 'trick' ? 10 : 0); }

  // Boil a long list of points down to ~SAMPLES of them (always keep first & last).
  function resample(pts) {
    if (pts.length <= SAMPLES) return pts;
    const out = [], step = (pts.length - 1) / (SAMPLES - 1);
    for (let i = 0; i < SAMPLES; i++) out.push(pts[Math.round(i * step)]);
    return out;
  }

  // ---- main.js calls this the instant YOU score a touchdown --------------
  function capture(m) {
    const frames = (m && m.frames) || [];
    if (frames.length < MIN_FRAMES) return;                 // too quick — no real route to show
    const path = resample(frames.map(f => [Math.round(f.bx), Math.round(f.by)]));
    const yds = Math.max(1, Math.min(100, Math.round(m.yds || 0)));
    const h = {
      id: Date.now() + '_' + Math.floor(Math.random() * 1000),
      type: typeOf(m, yds),
      yds, opp: m.opp || '', q: m.q || 1,
      path, t: Date.now()
    };
    reel.unshift(h);                                        // newest first
    while (reel.length > CAP) {                             // full? drop the weakest highlight
      let lo = 0;
      for (let i = 1; i < reel.length; i++) if (keepScore(reel[i]) < keepScore(reel[lo])) lo = i;
      reel.splice(lo, 1);
    }
    save();
  }

  // ---- The caption for a highlight ---------------------------------------
  function captionOf(h) {
    let title;
    if (h.type === 'pick6')      title = '🦅 PICK SIX!';
    else if (h.type === 'trick') title = '🎩 TRICK-PLAY TD';
    else if (h.type === 'bomb')  title = `💣 ${h.yds}-YARD BOMB`;
    else                         title = `🏈 ${h.yds}-YARD TD`;
    const bits = [];
    if (h.opp) bits.push('vs ' + h.opp);
    bits.push('Q' + h.q);
    return { title, sub: bits.join('  ·  ') };
  }

  // ============================================================
  // THE THEATER (a plain <canvas> — draws the field + the ball's route)
  // ============================================================
  function drawPlay(progress) {
    const canvas = $('film-canvas'); if (!canvas) return;
    const ctx = canvas.getContext('2d'); const W = canvas.width, H = canvas.height;
    const h = reel[idx]; if (!h) return;

    // The field: grass, a dark END ZONE band across the top (that's where you're
    // headed), a bright goal line, and faint yard lines.
    ctx.fillStyle = '#1f7a3a'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#12532a'; ctx.fillRect(0, 0, W, 26);
    ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.font = 'bold 11px Arial'; ctx.textAlign = 'center';
    ctx.fillText('END ZONE', W / 2, 17);
    ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, 26.5); ctx.lineTo(W, 26.5); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.16)'; ctx.lineWidth = 1;
    for (let i = 1; i < 6; i++) { const y = 26 + (H - 26) * i / 6; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    // Normalize the route: x stays true to the field width (a sideline run looks
    // like a sideline run); y fills the field top-to-bottom, with the END ZONE
    // (the last frame — the lowest field-y) at the top.
    const pts = h.path; let minY = Infinity, maxY = -Infinity;
    for (const p of pts) { if (p[1] < minY) minY = p[1]; if (p[1] > maxY) maxY = p[1]; }
    const spanY = Math.max(1, maxY - minY), padX = 20, top = 34, bot = 12;
    const NX = x => padX + (x / FIELD_W) * (W - 2 * padX);
    const NY = y => top + ((y - minY) / spanY) * (H - top - bot);

    const n = pts.length, upto = Math.max(1, Math.round(progress * (n - 1)));
    // the route so far (a golden trail)
    ctx.strokeStyle = '#ffe066'; ctx.lineWidth = 3; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 0; i <= upto; i++) { const X = NX(pts[i][0]), Y = NY(pts[i][1]); i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }
    ctx.stroke();
    // where the run started
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.beginPath(); ctx.arc(NX(pts[0][0]), NY(pts[0][1]), 3, 0, 7); ctx.fill();
    // the ball, right now
    const cp = pts[upto];
    ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#c8102e'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(NX(cp[0]), NY(cp[1]), 6, 0, 7); ctx.fill(); ctx.stroke();
  }

  function stopAnim() { if (animTimer) { clearInterval(animTimer); animTimer = null; } }
  function playAnim() {
    stopAnim();
    let p = 0;
    drawPlay(0);
    animTimer = setInterval(() => {
      p += 0.045;
      if (p >= 1) { drawPlay(1); stopAnim(); return; }   // land on the full route, ball in the end zone
      drawPlay(p);
    }, 30);
  }

  // ---- Render the whole modal --------------------------------------------
  function render() {
    const stage = $('film-stage'), cap = $('film-cap'), nav = $('film-nav');
    if (!stage) return;

    if (!reel.length) {   // nothing saved yet — a friendly nudge
      stopAnim();
      stage.innerHTML = `<div class="film-empty">🎬<br>No highlights yet!<br>` +
        `<span>Score a touchdown and your best plays land right here — your very own highlight reel.</span></div>`;
      if (cap) cap.innerHTML = '';
      if (nav) nav.style.display = 'none';
      return;
    }

    idx = Math.max(0, Math.min(idx, reel.length - 1));
    stage.innerHTML = `<canvas id="film-canvas" width="320" height="196"></canvas>`;
    const c = captionOf(reel[idx]);
    if (cap) cap.innerHTML = `<div class="film-title">${c.title}</div><div class="film-sub">${c.sub}</div>` +
                             `<div class="film-count">Highlight ${idx + 1} of ${reel.length}</div>`;
    if (nav) nav.style.display = 'flex';
    // hide prev/next when there's only one clip (nothing to flip between)
    const one = reel.length <= 1;
    const pv = $('film-prev'), nx = $('film-next');
    if (pv) pv.style.visibility = one ? 'hidden' : 'visible';
    if (nx) nx.style.visibility = one ? 'hidden' : 'visible';
    playAnim();
  }

  // ---- Open / close / navigate -------------------------------------------
  function open() { reel = load(); idx = 0; const el = $('film-modal'); if (el) el.style.display = 'flex'; render(); }
  function closeOverlay() { stopAnim(); const el = $('film-modal'); if (el) el.style.display = 'none'; }
  function show(i) { if (!reel.length) return; idx = (i + reel.length) % reel.length; render(); }

  function tap(id, fn) { const el = $(id); if (el) el.addEventListener('pointerdown', e => { e.preventDefault(); fn(); }); }
  function wire() {
    tap('open-film', open);              // the button in the Trophy Case
    tap('film-close', closeOverlay);
    tap('film-prev', () => show(idx - 1));
    tap('film-next', () => show(idx + 1));
    tap('film-replay', playAnim);
  }
  if (document.readyState !== 'loading') wire();
  else document.addEventListener('DOMContentLoaded', wire);

  // ---- What the rest of the game may use ---------------------------------
  window.TDFilm = {
    capture,                    // main.js: save this touchdown's route
    open,                       // show the Film Room (from the Trophy Case)
    count: () => load().length  // how many highlights are saved
  };
})();
