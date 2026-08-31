// ============================================================
// TOUCHDOWN FUN — playbook.js: 📖 THE CUSTOM PLAYBOOK (Round 8, pick ⑧)
// ------------------------------------------------------------
// The last pick on the Front Office Board, and the biggest: design your
// OWN plays and have the game really call them.
//
// A play in this game is simply three routes — one for each wide
// receiver and one for the running back — plus a name. That's exactly
// what the built-in plays are (see PLAYBOOK in main.js), so a play you
// draw here is the same kind of thing the game already uses. Switch it
// ON and it goes into the rotation with the built-in ones; you'll see
// your own name called on the scoreboard mid-game.
//
// You get a little chalkboard preview too, drawn from the same numbers
// the players actually run, so what you see is what they'll do.
//
// ------------------------------------------------------------
// HOW IT REACHES THE GAME
// ------------------------------------------------------------
// main.js's callPlay() asks us for the book each down:
//     const book = (window.TDBook && TDBook.book(PLAYBOOK)) || PLAYBOOK;
// We hand back the built-in plays plus whichever of yours are switched
// on. Nothing else in the game changes, and with this file missing
// callPlay falls straight back to the original list.
// ============================================================
(function () {
  'use strict';

  // Short name — TDStats.shared adds the "tdr-" (so this is "tdr-playbook").
  const KEY = 'playbook';
  const $ = id => document.getElementById(id);

  const T = window.TDStats ? TDStats.shared : null;
  const store = (k, v) => { if (T) T.store(k, v); };
  const load  = (k, f) => (T ? T.load(k, f) : f);

  const MAX_PLAYS = 6;          // how many of your own you can keep

  // ---- The routes you can pick -------------------------------------------
  // Exactly the routes main.js knows how to run (see routeVelocity), described
  // in plain words, with the shape used to draw the little preview.
  // Each shape is a list of [sideways, upfield] points, 0..1 up the board.
  const ROUTES = [
    { id: 'slant',    name: 'SLANT',    hint: 'cuts inside, quick',   pts: [[0,0],[0,.28],[-.55,.62]] },
    { id: 'streak',   name: 'STREAK',   hint: 'straight downfield',   pts: [[0,0],[0,1]] },
    { id: 'out',      name: 'OUT',      hint: 'breaks to the sideline', pts: [[0,0],[0,.55],[.62,.72]] },
    { id: 'in',       name: 'IN',       hint: 'breaks to the middle', pts: [[0,0],[0,.6],[-.62,.76]] },
    { id: 'corner',   name: 'CORNER',   hint: 'deep to the flag',     pts: [[0,0],[0,.52],[.5,1]] },
    { id: 'post',     name: 'POST',     hint: 'deep to the middle',   pts: [[0,0],[0,.52],[-.5,1]] },
    { id: 'curl',     name: 'CURL',     hint: 'stops and comes back', pts: [[0,0],[0,.68],[-.16,.56]] },
    { id: 'comeback', name: 'COMEBACK', hint: 'deep, then back out',  pts: [[0,0],[0,.78],[.2,.62]] },
    { id: 'drag',     name: 'DRAG',     hint: 'shallow across',       pts: [[0,0],[0,.16],[-.8,.3]] },
    { id: 'flat',     name: 'FLAT',     hint: 'quick to the sideline', pts: [[0,0],[.7,.16]] },
    { id: 'swing',    name: 'SWING',    hint: 'out of the backfield', pts: [[0,0],[.55,.08],[.8,.28]] },
    { id: 'wheel',    name: 'WHEEL',    hint: 'out then up the side', pts: [[0,0],[.5,.12],[.62,.9]] },
  ];
  const routeById = id => ROUTES.find(r => r.id === id) || ROUTES[0];

  // ---- State: { plays: [{id,name,wr1,wr2,rb,on}] } -------------------------
  let s = null;
  // Which play is being edited right now (null = the list view)
  let editing = null;

  function ensure() {
    if (!s) s = load(KEY, null);
    if (!s || !Array.isArray(s.plays)) s = { plays: [] };
    s.plays = s.plays.filter(p => p && p.name).slice(0, MAX_PLAYS);
  }
  function save() { store(KEY, s); }

  // ---- What main.js asks for every down -----------------------------------
  // Hand back the built-in plays plus the ones you've switched on. We copy the
  // objects into exactly the shape callPlay expects, so nothing downstream has
  // to know these came from a player.
  function book(builtIn) {
    ensure();
    const mine = s.plays.filter(p => p.on).map(p => ({
      name: p.name, wr1: p.wr1, wr2: p.wr2, rb: p.rb, custom: true,
    }));
    return mine.length ? builtIn.concat(mine) : builtIn;
  }

  // ---- Editing ------------------------------------------------------------
  function blankPlay() {
    return { id: 'pl' + Date.now(), name: 'MY PLAY ' + (s.plays.length + 1),
             wr1: 'slant', wr2: 'streak', rb: 'swing', on: true };
  }

  function startNew() {
    ensure();
    if (s.plays.length >= MAX_PLAYS) { flash('Playbook is full — delete one first.'); return; }
    editing = blankPlay();
    render();
  }
  function edit(id)   { ensure(); const p = s.plays.find(x => x.id === id); if (p) { editing = Object.assign({}, p); render(); } }
  function cancel()   { editing = null; render(); }

  function saveEditing() {
    ensure();
    if (!editing) return;
    const name = (editing.name || '').trim().slice(0, 16) || 'MY PLAY';
    editing.name = name;
    const i = s.plays.findIndex(p => p.id === editing.id);
    if (i >= 0) s.plays[i] = editing; else s.plays.push(editing);
    save();
    editing = null;
    render();
    flash('📖 “' + name + '” is in the playbook — it can be called in your next game!');
  }

  function remove(id) {
    ensure();
    s.plays = s.plays.filter(p => p.id !== id);
    save(); render();
  }
  function toggle(id) {
    ensure();
    const p = s.plays.find(x => x.id === id);
    if (p) { p.on = !p.on; save(); render(); }
  }
  function setRoute(slot, id) { if (editing) { editing[slot] = id; render(); } }

  function flash(msg) {
    const el = $('book-msg');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(flash._t);
    flash._t = setTimeout(() => el.classList.remove('show'), 2800);
  }

  // ---- The chalkboard preview ---------------------------------------------
  // Draws the three routes the way they'll actually run: WR1 from the left,
  // WR2 from the right, RB just behind the line.
  function drawBoard(play) {
    const c = $('book-canvas');
    if (!c) return;
    const ctx = c.getContext('2d'), W = c.width, H = c.height;

    ctx.fillStyle = '#12331f'; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(255,255,255,0.13)'; ctx.lineWidth = 1;
    for (let i = 1; i < 5; i++) {
      const y = H - (H * i / 5);
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
    // the line of scrimmage
    const losY = H - 26;
    ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, losY); ctx.lineTo(W, losY); ctx.stroke();

    // Each man: [start x fraction, side (+1 right / -1 left), route, colour, label]
    const men = [
      [0.18, -1, play.wr1, '#2ee6ff', '1'],
      [0.82,  1, play.wr2, '#2ee6ff', '2'],
      [0.60,  1, play.rb,  '#ffd60a', 'RB'],
    ];
    const runLen = losY - 14;

    men.forEach(m => {
      const [fx, side, rid, col, lab] = m;
      const r = routeById(rid);
      const x0 = fx * W, y0 = (rid === play.rb && m[4] === 'RB') ? losY + 12 : losY - 2;

      ctx.strokeStyle = col; ctx.lineWidth = 2.5; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      ctx.beginPath();
      r.pts.forEach((pt, i) => {
        const x = x0 + pt[0] * side * (W * 0.30);
        const y = y0 - pt[1] * runLen;
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      });
      ctx.stroke();

      // an arrow head at the end of the route
      const last = r.pts[r.pts.length - 1], prev = r.pts[r.pts.length - 2] || [0, 0];
      const lx = x0 + last[0] * side * (W * 0.30), ly = y0 - last[1] * runLen;
      const px = x0 + prev[0] * side * (W * 0.30), py = y0 - prev[1] * runLen;
      const ang = Math.atan2(ly - py, lx - px);
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.moveTo(lx, ly);
      ctx.lineTo(lx - 7 * Math.cos(ang - 0.4), ly - 7 * Math.sin(ang - 0.4));
      ctx.lineTo(lx - 7 * Math.cos(ang + 0.4), ly - 7 * Math.sin(ang + 0.4));
      ctx.closePath(); ctx.fill();

      // the man himself
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.arc(x0, y0, 6, 0, 7); ctx.fill();
      ctx.fillStyle = '#0a1020'; ctx.font = 'bold 8px Arial'; ctx.textAlign = 'center';
      ctx.fillText(lab, x0, y0 + 3);
    });

    // the quarterback
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(W / 2, losY + 16, 6, 0, 7); ctx.fill();
    ctx.fillStyle = '#0a1020'; ctx.font = 'bold 8px Arial'; ctx.textAlign = 'center';
    ctx.fillText('QB', W / 2, losY + 19);
  }

  // ---- Drawing ------------------------------------------------------------
  function routePicker(slot, chosen) {
    return '<div class="bk-pickrow"><span class="bk-slot">' +
      (slot === 'wr1' ? 'RECEIVER 1' : slot === 'wr2' ? 'RECEIVER 2' : 'RUNNING BACK') +
      '</span><div class="bk-routes">' +
      ROUTES.map(r =>
        '<span class="bk-route' + (r.id === chosen ? ' on' : '') +
        '" data-slot="' + slot + '" data-route="' + r.id + '" title="' + r.hint + '">' +
        r.name + '</span>').join('') +
      '</div></div>';
  }

  function render() {
    ensure();
    const body = $('book-body');
    if (!body) return;

    if (editing) {
      body.innerHTML =
        '<canvas id="book-canvas" width="300" height="180"></canvas>' +
        '<div class="bk-nameRow"><span class="bk-slot">PLAY NAME</span>' +
          '<input id="bk-name" maxlength="16" value="' +
            String(editing.name).replace(/"/g, '&quot;') + '"></div>' +
        routePicker('wr1', editing.wr1) +
        routePicker('wr2', editing.wr2) +
        routePicker('rb',  editing.rb) +
        '<div class="bk-editBtns">' +
          '<span class="bk-btn save" id="bk-save">SAVE PLAY</span>' +
          '<span class="bk-btn" id="bk-cancel">CANCEL</span>' +
        '</div>';

      drawBoard(editing);

      body.querySelectorAll('.bk-route').forEach(el => {
        el.addEventListener('pointerdown', e => {
          e.preventDefault(); e.stopPropagation();
          setRoute(el.getAttribute('data-slot'), el.getAttribute('data-route'));
        });
      });
      const nm = $('bk-name');
      if (nm) {
        // the game listens to the keyboard, so hush it while you're typing
        nm.addEventListener('pointerdown', e => e.stopPropagation());
        nm.addEventListener('focus', () => { try { window.game.input.keyboard.enabled = false; } catch (e) {} });
        nm.addEventListener('blur',  () => { try { window.game.input.keyboard.enabled = true;  } catch (e) {} });
        nm.addEventListener('input', () => { editing.name = nm.value; });
      }
      const sv = $('bk-save'), cn = $('bk-cancel');
      if (sv) sv.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation();
        try { window.game.input.keyboard.enabled = true; } catch (er) {} saveEditing(); });
      if (cn) cn.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation();
        try { window.game.input.keyboard.enabled = true; } catch (er) {} cancel(); });
      return;
    }

    // ---- the list view ----
    const rows = s.plays.length ? s.plays.map(p =>
      '<div class="bk-row' + (p.on ? '' : ' off') + '">' +
        '<div class="bk-rowTop">' +
          '<span class="bk-pname">' + p.name + '</span>' +
          '<span class="bk-toggle' + (p.on ? ' on' : '') + '" data-on="' + p.id + '">' +
            (p.on ? 'IN THE BOOK' : 'BENCHED') + '</span>' +
        '</div>' +
        '<div class="bk-rowSub">1 ' + routeById(p.wr1).name + ' · 2 ' + routeById(p.wr2).name +
          ' · RB ' + routeById(p.rb).name + '</div>' +
        '<div class="bk-rowBtns">' +
          '<span class="bk-mini" data-edit="' + p.id + '">EDIT</span>' +
          '<span class="bk-mini del" data-del="' + p.id + '">DELETE</span>' +
        '</div>' +
      '</div>').join('')
      : '<div class="bk-empty">No plays of your own yet. Draw one up!</div>';

    body.innerHTML = rows +
      '<div class="bk-editBtns"><span class="bk-btn save" id="bk-new">✏️ DRAW UP A PLAY</span></div>' +
      '<div class="bk-count">' + s.plays.length + ' / ' + MAX_PLAYS + ' plays · ' +
        s.plays.filter(p => p.on).length + ' in the rotation</div>';

    body.querySelectorAll('[data-edit]').forEach(el => el.addEventListener('pointerdown', e => {
      e.preventDefault(); e.stopPropagation(); edit(el.getAttribute('data-edit')); }));
    body.querySelectorAll('[data-del]').forEach(el => el.addEventListener('pointerdown', e => {
      e.preventDefault(); e.stopPropagation(); remove(el.getAttribute('data-del')); }));
    body.querySelectorAll('[data-on]').forEach(el => el.addEventListener('pointerdown', e => {
      e.preventDefault(); e.stopPropagation(); toggle(el.getAttribute('data-on')); }));
    const nw = $('bk-new');
    if (nw) nw.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); startNew(); });
  }

  function open()  { ensure(); editing = null; const m = $('book-modal'); if (m) { m.style.display = 'flex'; render(); } }
  function close() {
    try { window.game.input.keyboard.enabled = true; } catch (e) {}   // never leave the keys switched off
    const m = $('book-modal'); if (m) m.style.display = 'none';
  }

  // ---- Wire up ------------------------------------------------------------
  function onTap(id, fn) {
    const el = $(id);
    if (el) el.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); fn(); });
  }
  function wireUp() { ensure(); onTap('open-book', open); onTap('book-close', close); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wireUp);
  else wireUp();

  window.TDBook = { open, close, render, book, routes: () => ROUTES.slice(), _state: () => s };
})();
