// ============================================================
// TOUCHDOWN FUN — nicknames.js: 🌟 PLAYER NICKNAMES
// ------------------------------------------------------------
// Every great player has a nickname. Give one to the guys on your roster — "The
// Rocket", "Big Country", whatever you like — and the ANNOUNCER starts using it
// during the game. Break a long run and it's not "WHAT A RUN!" any more, it's
// "THE ROCKET IS ROLLING!". Score and the crowd hears their name.
//
// Nicknames stick to the PLAYER (we save them against his id, not his roster
// spot), so trading him around or moving him doesn't hand his name to someone
// else — and when a player retires in 📚 Dynasty Mode, his nickname retires with
// him. Old entries are swept up on load so the save can't grow forever.
//
// The announcer bit is tiny on purpose: main.js already has `sayComment()` for
// play-by-play, so we just hand it a better line when the guy carrying the ball
// happens to have a nickname. Everything else is a plain DOM pop-up.
// Saved in localStorage 'tdr-nicknames'.
// ============================================================
(function () {
  const T = window.TDStats ? TDStats.shared : null;
  const $ = id => document.getElementById(id);
  const MAX_LEN = 14;

  // A pile of ready-made ones for the 🎲 button (and for kids who'd rather pick
  // than type). Kept punchy — these get shouted by the announcer.
  const IDEAS = [
    'The Rocket', 'Big Country', 'The Freight Train', 'Sticky Fingers', 'The Jet',
    'Sunshine', 'The Hammer', 'Lightning', 'The Professor', 'Mad Dog',
    'Butter Hands', 'The Bulldozer', 'Turbo', 'The Ghost', 'Cannonball',
    'Slim', 'The Wall', 'Zoom', 'The Blur', 'Tank', 'Rocket Man', 'The Magician',
  ];

  // Which on-field player is which roster spot (same map gamestats.js uses).
  const FIELD_TO_SLOT = { 0: 0, 1: 1, 2: 2, 3: 3 };

  // ---- Save & load --------------------------------------------------------
  function load() {
    let s = T ? T.load('nicknames', null) : null;
    if (!s) { try { s = JSON.parse(localStorage.getItem('tdr-nicknames')); } catch (e) {} }
    return (s && typeof s === 'object') ? s : {};
  }
  function save() {
    if (T) T.store('nicknames', names);
    else { try { localStorage.setItem('tdr-nicknames', JSON.stringify(names)); } catch (e) {} }
  }
  let names = load();

  // Drop nicknames whose player is no longer on the roster (retired or traded
  // away), so this never grows without limit.
  function tidy() {
    const roster = (window.TDDraft && TDDraft.rosterAges) ? TDDraft.rosterAges() : [];
    if (!roster.length) return;
    const live = new Set(roster.map(p => p.id));
    let changed = false;
    for (const id of Object.keys(names)) if (!live.has(id)) { delete names[id]; changed = true; }
    if (changed) save();
  }

  const clean = s => String(s || '').replace(/\s+/g, ' ').trim().slice(0, MAX_LEN);

  // ---- What main.js asks for ---------------------------------------------
  // Given an index into the `offense` array, what's that guy's nickname?
  function forField(idx) {
    const slot = FIELD_TO_SLOT[idx];
    if (slot == null) return null;
    const roster = (window.TDDraft && TDDraft.rosterAges) ? TDDraft.rosterAges() : [];
    const p = roster[slot];
    return (p && names[p.id]) ? names[p.id] : null;
  }
  // A ready-to-shout line, or null if this player has no nickname (in which
  // case main.js just uses its normal announcer line).
  function shout(idx, kind) {
    const n = forField(idx); if (!n) return null;
    const N = n.toUpperCase();
    if (kind === 'td')    return pick([`TOUCHDOWN — ${N}!`, `${N} FINDS THE END ZONE!`, `${N} DOES IT AGAIN!`]);
    if (kind === 'run')   return pick([`${N} IS ROLLING!`, `GO, ${N}, GO!`, `${N} BREAKS FREE!`]);
    if (kind === 'catch') return pick([`${N} HAULS IT IN!`, `RIGHT TO ${N}!`, `${N} IS WIDE OPEN!`]);
    return null;
  }
  const pick = a => a[Math.floor(Math.random() * a.length)];

  // ---- The pop-up ---------------------------------------------------------
  let editing = null;   // the player id currently being typed for

  function render() {
    const body = $('nick-body'); if (!body) return;
    tidy();
    const roster = (window.TDDraft && TDDraft.rosterAges) ? TDDraft.rosterAges() : [];
    if (!roster.length) { body.innerHTML = `<div class="nick-empty">No roster yet — visit 🏟 MY TEAM first!</div>`; return; }

    body.innerHTML = roster.map(p => {
      const nn = names[p.id];
      const isEd = editing === p.id;
      return `<div class="nick-row${nn ? ' has' : ''}">` +
        `<div class="nick-who"><span class="nick-pos">${p.pos}</span>` +
        `<span class="nick-name">${p.name}${p.custom ? ' 🙋' : ''}</span></div>` +
        (isEd
          ? `<div class="nick-edit">` +
              `<input class="nick-input" data-for="${p.id}" maxlength="${MAX_LEN}" value="${nn ? nn.replace(/"/g,'&quot;') : ''}" placeholder="type a nickname" />` +
              `<div class="nick-mini" data-roll="${p.id}">🎲</div>` +
              `<div class="nick-mini ok" data-save="${p.id}">✓</div>` +
            `</div>`
          : `<div class="nick-side">` +
              (nn ? `<span class="nick-tag">“${nn}”</span>` : `<span class="nick-none">no nickname</span>`) +
              `<div class="nick-mini" data-edit="${p.id}">✏️</div>` +
              (nn ? `<div class="nick-mini del" data-clear="${p.id}">🗑</div>` : '') +
            `</div>`) +
      `</div>`;
    }).join('');

    const inp = body.querySelector('.nick-input');
    if (inp) { inp.focus(); inp.addEventListener('pointerdown', e => e.stopPropagation()); }
  }

  function onTap(e) {
    const el = e.target.closest('[data-edit],[data-save],[data-clear],[data-roll]');
    if (!el) return;
    e.preventDefault();
    const body = $('nick-body');
    if (el.dataset.edit)  { editing = el.dataset.edit; render(); return; }
    if (el.dataset.roll)  {
      const inp = body.querySelector('.nick-input[data-for="' + el.dataset.roll + '"]');
      if (inp) inp.value = pick(IDEAS);
      return;
    }
    if (el.dataset.clear) { delete names[el.dataset.clear]; save(); render(); return; }
    if (el.dataset.save)  {
      const id = el.dataset.save;
      const inp = body.querySelector('.nick-input[data-for="' + id + '"]');
      const v = clean(inp ? inp.value : '');
      if (v.length >= 2) names[id] = v; else delete names[id];
      save(); editing = null; render();
      if (v.length >= 2 && window.TDShop && TDShop.celebrate) TDShop.celebrate(null, '🌟', '“' + v.toUpperCase() + '”');
    }
  }

  function gameKeyboard(on) { try { window.game.input.keyboard.enabled = on; } catch (e) {} }
  function open()  { names = load(); editing = null; render(); const el = $('nick-modal'); if (el) el.style.display = 'flex'; gameKeyboard(false); }
  function closeOverlay() { editing = null; const el = $('nick-modal'); if (el) el.style.display = 'none'; gameKeyboard(true); }

  function tap(id, fn) { const el = $(id); if (el) el.addEventListener('pointerdown', e => { e.preventDefault(); fn(); }); }
  function wire() {
    tap('open-nick', open);
    tap('nick-close', closeOverlay);
    const body = $('nick-body'); if (body) body.addEventListener('pointerdown', onTap);
  }
  if (document.readyState !== 'loading') wire();
  else document.addEventListener('DOMContentLoaded', wire);

  window.TDNick = {
    open, forField, shout,
    count: () => Object.keys(load()).length,
  };
})();
