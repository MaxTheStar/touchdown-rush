// ============================================================
// TOUCHDOWN FUN — createplayer.js: 🙋 CREATE-A-PLAYER
// ------------------------------------------------------------
// Put YOURSELF in the game. Make one custom superstar — your name, your jersey
// number, your position, and a ⭐ special skill — and he joins your MY TEAM
// roster as a real starter. He plays, he grows, he shows up in the box score,
// and he can be your Player of the Game just like anybody else.
//
// The roster itself lives inside draft.js, so we don't poke at the save file
// behind its back — draft.js grew a few little helpers for us
// (`TDDraft.setCustom / getCustom / clearCustom / slotList / traitList`) and we
// go through those. That way MY TEAM, growth, trades and payroll all stay in
// sync with exactly one copy of the truth.
//
// Only ONE custom player at a time (he's your guy!) — creating him again just
// edits him, and moving him to a different position hands the old slot back to a
// normal generated player, so your team is always eight deep. The editor lives
// in the 🛍 Pro Shop, so there's no new menu button.
// ============================================================
(function () {
  const $ = id => document.getElementById(id);
  const D = () => window.TDDraft || null;

  // What position does what? (a friendly hint so picking one makes sense)
  const POS_INFO = {
    QB: { e: '🎯', what: 'throws the passes' },
    RB: { e: '🏃', what: 'runs the ball' },
    WR: { e: '🙌', what: 'catches deep passes' },
    TE: { e: '🧱', what: 'blocks and catches' },
    LB: { e: '🛡', what: 'stops the run' },
    CB: { e: '🦅', what: 'covers receivers' },
    S:  { e: '🚧', what: 'the last line of defense' },
  };

  // What we're building right now (before you tap CREATE).
  let draft = { name: '', num: 1, pos: 'WR', trait: 'SPEEDSTER' };

  // ---- Little helpers ------------------------------------------------------
  function cleanName(s) {
    return String(s || '').replace(/\s+/g, ' ').trim().slice(0, 16);
  }
  function cleanNum(n) {
    n = parseInt(n, 10);
    if (!isFinite(n)) n = 1;
    return Math.max(0, Math.min(99, n));
  }

  // ---- Drawing the editor --------------------------------------------------
  function renderPreview() {
    const box = $('cap-preview'); if (!box) return;
    const info = POS_INFO[draft.pos] || { e: '🏈', what: '' };
    const tr = (D() ? D().traitList() : []).find(t => t.n === draft.trait);
    const nm = cleanName(draft.name) || 'YOUR NAME';
    box.innerHTML =
      `<div class="cap-jersey"><span class="cap-num">${cleanNum(draft.num)}</span></div>` +
      `<div class="cap-info">` +
        `<div class="cap-nm">${nm}</div>` +
        `<div class="cap-pos">${info.e} ${draft.pos} — ${info.what}</div>` +
        (tr ? `<div class="cap-tr">${tr.e} ${tr.n}</div>` : '') +
      `</div>`;
  }

  function renderPicks() {
    const posBox = $('cap-positions'), trBox = $('cap-traits');
    if (posBox && D()) {
      // one button per position (WR appears twice in the roster — show it once)
      const seen = [];
      posBox.innerHTML = D().slotList().filter(p => {
        if (seen.includes(p)) return false; seen.push(p); return true;
      }).map(p => {
        const i = POS_INFO[p] || { e: '🏈' };
        return `<div class="cap-pos-btn${p === draft.pos ? ' on' : ''}" data-pos="${p}">` +
               `<span>${i.e}</span><b>${p}</b></div>`;
      }).join('');
    }
    if (trBox && D()) {
      trBox.innerHTML = D().traitList().map(t =>
        `<div class="cap-tr-btn${t.n === draft.trait ? ' on' : ''}" data-trait="${t.n}">` +
        `${t.e} ${t.n}</div>`).join('');
    }
  }

  // The "you already have one" panel vs the editor. Two clearly separate views,
  // each with its OWN buttons — an EDIT button that opens the form, and a
  // SAVE/CREATE button inside the form (one button doing both jobs was confusing).
  function render() {
    const cur = D() ? D().getCustom() : null;
    const have = $('cap-have'), form = $('cap-form'), del = $('cap-delete');
    const mkBtn = $('cap-make'), edBtn = $('cap-edit');
    if (cur && !editing) {
      if (mkBtn) mkBtn.style.display = 'none';    // showing the card: EDIT + REMOVE
      if (edBtn) edBtn.style.display = '';
      if (have) {
        const info = POS_INFO[cur.pos] || { e: '🏈', what: '' };
        const tr = cur.trait ? `${cur.trait.e} ${cur.trait.n}` : 'no special skill';
        have.style.display = 'block';
        have.innerHTML =
          `<div class="cap-card">` +
            `<div class="cap-jersey big"><span class="cap-num">${cur.num != null ? cur.num : 1}</span></div>` +
            `<div class="cap-nm big">${cur.name}</div>` +
            `<div class="cap-pos">${info.e} ${cur.pos} — ${info.what}</div>` +
            `<div class="cap-tr">${tr}</div>` +
            `<div class="cap-ovr">${cur.ovr} OVR</div>` +
            `<div class="cap-note">He's on your team — see him in 🏟 MY TEAM!</div>` +
          `</div>`;
      }
      if (form) form.style.display = 'none';
      if (del) del.style.display = '';
      return;
    }
    // the editor
    if (have) have.style.display = 'none';
    if (form) form.style.display = 'block';
    if (del) del.style.display = cur ? '' : 'none';
    if (edBtn) edBtn.style.display = 'none';      // editing: SAVE (+ REMOVE if he exists)
    if (mkBtn) { mkBtn.style.display = ''; mkBtn.textContent = cur ? '💾 SAVE CHANGES' : '✨ CREATE MY PLAYER'; }
    renderPreview();
    renderPicks();
  }

  let editing = false;

  // ---- Taps ---------------------------------------------------------------
  function onPick(e) {
    const pos = e.target.closest('[data-pos]');
    const tr  = e.target.closest('[data-trait]');
    if (!pos && !tr) return;
    e.preventDefault();
    if (pos) draft.pos = pos.dataset.pos;
    if (tr)  draft.trait = tr.dataset.trait;
    renderPreview(); renderPicks();
  }

  function readInputs() {
    const n = $('cap-name'), j = $('cap-num');
    if (n) draft.name = n.value;
    if (j) draft.num = j.value;
  }

  let noteT = null;
  function note(msg) {
    const el = $('cap-msg'); if (!el) return;
    el.textContent = msg; el.classList.add('show');
    clearTimeout(noteT); noteT = setTimeout(() => el.classList.remove('show'), 1600);
  }

  // The EDIT button on the player card: open the form, filled in with him.
  function edit() {
    if (!D()) return;
    const cur = D().getCustom(); if (!cur) return;
    editing = true;
    startEdit(cur);
  }

  // The CREATE / SAVE button — this one ONLY ever saves.
  function make() {
    if (!D()) return;
    readInputs();
    const name = cleanName(draft.name);
    if (name.length < 2) { note('Give your player a name first!'); return; }
    D().setCustom(draft.pos, { name, num: cleanNum(draft.num), trait: draft.trait });
    editing = false;
    if (window.TDShop && TDShop.celebrate) TDShop.celebrate(null, '🙋', name.toUpperCase() + ' JOINS THE TEAM!');
    if (window.TDDraft && TDDraft.onMenu) TDDraft.onMenu();
    render();
  }

  function startEdit(cur) {
    draft = { name: cur.name, num: cur.num != null ? cur.num : 1, pos: cur.pos,
              trait: cur.trait ? cur.trait.n : 'SPEEDSTER' };
    const n = $('cap-name'), j = $('cap-num');
    if (n) n.value = draft.name;
    if (j) j.value = draft.num;
    render();
  }

  function removeHim() {
    if (!D()) return;
    if (!D().getCustom()) return;
    D().clearCustom();
    editing = false;
    draft = { name: '', num: 1, pos: 'WR', trait: 'SPEEDSTER' };
    const n = $('cap-name'), j = $('cap-num');
    if (n) n.value = ''; if (j) j.value = 1;
    note('Your player left the team.');
    render();
  }

  // ---- Open / close --------------------------------------------------------
  function open() {
    editing = false;
    const cur = D() ? D().getCustom() : null;
    if (!cur) {
      const n = $('cap-name'), j = $('cap-num');
      if (n && !n.value) n.value = '';
      if (j && !j.value) j.value = 1;
    }
    render();
    const el = $('cap-modal'); if (el) el.style.display = 'flex';
    gameKeyboard(false);       // typing a name shouldn't hike the ball!
  }
  function closeOverlay() {
    const el = $('cap-modal'); if (el) el.style.display = 'none';
    gameKeyboard(true);
  }
  function gameKeyboard(on) { try { window.game.input.keyboard.enabled = on; } catch (e) {} }

  function tap(id, fn) { const el = $(id); if (el) el.addEventListener('pointerdown', e => { e.preventDefault(); fn(); }); }
  function wire() {
    tap('open-cap', open);
    tap('cap-close', closeOverlay);
    tap('cap-edit', edit);
    tap('cap-make', make);
    tap('cap-delete', removeHim);
    const picks = $('cap-picks'); if (picks) picks.addEventListener('pointerdown', onPick);
    // the text boxes need real taps (the game swallows most touches)
    for (const id of ['cap-name', 'cap-num']) {
      const el = $(id);
      if (el) {
        el.addEventListener('pointerdown', e => e.stopPropagation());
        el.addEventListener('input', () => { readInputs(); renderPreview(); });
      }
    }
  }
  if (document.readyState !== 'loading') wire();
  else document.addEventListener('DOMContentLoaded', wire);

  window.TDCreate = { open };
})();
