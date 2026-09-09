// ============================================================
// TOUCHDOWN FUN — mascot.js: 🐯 THE TEAM MASCOT (Round 10, pick ③)
// ------------------------------------------------------------
// Every real team has one: the big furry character on the sideline who winds
// the crowd up, goes bananas when you score, and looks glum when you don't.
// Now yours does too — and YOU get to name it.
//
// Pick a mascot, give it a name, and it works your sideline:
//   🏈 you score      → it runs on, jumps, and shouts about it
//   🏆 you win        → it comes out for a victory dance
//   😔 you lose       → it's still there, telling you next time
//   🪙 every game     → it works the crowd, and the crowd tips you coins
//
// IT IS NOT THE SAME THING AS 🕺 TOUCHDOWN CELEBRATIONS, and the difference is
// the whole point of building it. That's your PLAYER dancing in the end zone,
// in the middle of the screen, for one moment. This is a character that belongs
// to the TEAM: it lives on the sideline, it reacts to the whole game (including
// the ones you lose), and it has a name you chose.
//
// ⚠️ WHERE IT STANDS IS DELIBERATE. The screen is crowded during a game — the
// D-pad owns the bottom-left, the action buttons the bottom-right, the
// celebration overlay the middle, the streak banner the top. So the mascot
// pops in at the LEFT EDGE, ABOVE the D-pad, for about two seconds, and never
// takes taps (pointer-events: none). It can't sit on the field permanently
// without covering a button on a phone — that's the v1.44/45 lesson again.
//
// Saved in `tdr-mascot` = { owned: [ids], equipped: id, name: 'what you called it' }.
// The picker lives in the 🛍 Pro Shop, so there's no new menu button.
// ============================================================
(function () {
  'use strict';

  const T = window.TDStats ? TDStats.shared : null;
  const store = (k, v) => { if (T) T.store(k, v); };
  const load  = (k, f) => (T ? T.load(k, f) : f);
  const $ = id => document.getElementById(id);

  const MAX_NAME = 14;

  // ---- 🐯 who you can have ------------------------------------------------
  // Three are free so everybody has a mascot from day one; the rest cost coins.
  const CREW = [
    { id: 'tiger',  ic: '🐯', name: 'Tiger',  cost: 0,   dflt: 'Chomp',    say: ['ROAAAR!', 'LET\'S GOOO!', 'THAT\'S MY TEAM!'] },
    { id: 'eagle',  ic: '🦅', name: 'Eagle',  cost: 0,   dflt: 'Swoop',    say: ['SCREEEE!', 'UP WE GO!', 'WHAT A PLAY!'] },
    { id: 'bear',   ic: '🐻', name: 'Bear',   cost: 0,   dflt: 'Rumble',   say: ['GRRRREAT!', 'BIG BEAR HUG!', 'ATTA TEAM!'] },
    { id: 'shark',  ic: '🦈', name: 'Shark',  cost: 120, dflt: 'Chomper',  say: ['CHOMP CHOMP!', 'FIN-TASTIC!', 'JAWS DROPPED!'] },
    { id: 'dragon', ic: '🐉', name: 'Dragon', cost: 180, dflt: 'Blaze',    say: ['FIRED UP!', 'TOO HOT!', 'BREATHE FIRE!'] },
    { id: 'dino',   ic: '🦖', name: 'Dino',   cost: 240, dflt: 'Rex',      say: ['RAWWWR!', 'PREHISTORIC!', 'STOMP STOMP!'] },
    { id: 'robot',  ic: '🤖', name: 'Robot',  cost: 300, dflt: 'Bolt',     say: ['BEEP BOOP WIN!', 'COMPUTING… GREAT!', 'SYSTEMS HYPED!'] },
    { id: 'alien',  ic: '👽', name: 'Alien',  cost: 360, dflt: 'Zorp',     say: ['TAKE ME TO YOUR TEAM!', 'OUT OF THIS WORLD!', 'BEAM IT IN!'] },
  ];

  const DEFAULT = 'tiger';
  const byId = id => CREW.find(m => m.id === id) || CREW[0];
  const coins = () => (window.TDShop && TDShop.coins) ? TDShop.coins() : 0;

  // ---- 💾 save & load -----------------------------------------------------
  let state = (() => {
    let s = load('mascot', null);
    if (!s || typeof s !== 'object') s = {};
    let owned = Array.isArray(s.owned) ? s.owned.filter(id => CREW.some(m => m.id === id)) : [];
    // the three free ones are always yours
    for (const m of CREW) if (m.cost === 0 && owned.indexOf(m.id) === -1) owned.push(m.id);
    const equipped = owned.indexOf(s.equipped) !== -1 ? s.equipped : DEFAULT;
    const name = typeof s.name === 'string' && s.name.trim() ? s.name.trim().slice(0, MAX_NAME) : '';
    return { owned, equipped, name };
  })();
  function save() { store('mascot', state); }

  // The name you typed, or the mascot's own default if you never bothered.
  function mascotName() { return state.name || byId(state.equipped).dflt; }

  // ---- 🎬 the sideline pop-in ---------------------------------------------
  let hideTimer = null;
  function reduceMotion() {
    try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; }
  }

  // kind: 'td' | 'win' | 'lose'
  function show(kind, text) {
    const fx = $('mascot-fx'); if (!fx) return;
    const m = byId(state.equipped);
    const line = text || m.say[Math.floor(Math.random() * m.say.length)];
    fx.innerHTML =
      `<div class="masc-bubble">${line}</div>` +
      `<div class="masc-guy">${m.ic}</div>` +
      `<div class="masc-name">${mascotName()}</div>`;
    fx.className = 'masc-' + kind + (reduceMotion() ? ' masc-still' : '');
    // ⚠️ THE LANDING POSITION IS SET INLINE, NOT LEFT TO THE TRANSITION.
    // The slide-in is a CSS transition, and a transition is only DECORATION —
    // it must never be the thing that actually puts the mascot on screen. When
    // the browser throttles or skips transitions (a background tab, a hidden
    // pane, reduce-motion) a mascot that relies on one just never arrives: it
    // sits off-screen at opacity 0 and you see nothing. So we start it off the
    // edge, force a reflow, then write the final transform and opacity straight
    // onto the element. Inline styles win, so the mascot is in the right place
    // whether or not a single frame of animation ever runs.
    fx.style.display = 'block';
    fx.style.transform = 'translateX(-120%)';
    fx.style.opacity = '0';
    void fx.offsetWidth;
    fx.classList.add('in');
    fx.style.transform = 'translateX(0)';
    fx.style.opacity = '1';
    if (hideTimer) clearTimeout(hideTimer);
    hideTimer = setTimeout(hide, kind === 'td' ? 2200 : 2800);
  }
  function hide() {
    const fx = $('mascot-fx'); if (!fx) return;
    fx.classList.remove('in');
    fx.style.transform = 'translateX(-120%)';
    fx.style.opacity = '0';
    if (hideTimer) clearTimeout(hideTimer);
    hideTimer = setTimeout(() => { if (fx) fx.style.display = 'none'; }, 400);
  }

  // ---- the hooks main.js calls -------------------------------------------
  // 🏈 you just scored.
  function cheer(kind) { show(kind || 'td'); }

  // 🏁 the final whistle: react, and hand over the crowd's tip. Called from
  // endGame BEFORE the final screen is built, so the coins land in the payday
  // with everything else.
  function finish(won, myScore) {
    const m = byId(state.equipped);
    // A modest tip — the mascot works the crowd, it doesn't out-earn football.
    let tip = won ? 4 : 2;
    if (typeof myScore === 'number') tip += Math.min(4, Math.floor(myScore / 14));
    if (window.TDShop && TDShop.earn) TDShop.earn(tip);
    show(won ? 'win' : 'lose',
      won ? mascotName().toUpperCase() + ' IS DANCING!' : 'NEXT TIME, TEAM!');
    return tip;
  }

  // ---- 🖼 the picker ------------------------------------------------------
  function renderPreview() {
    const p = $('masc-preview'); if (!p) return;
    const m = byId(state.equipped);
    p.innerHTML =
      `<div class="masc-big">${m.ic}</div>` +
      `<div class="masc-title">${mascotName()}</div>` +
      `<div class="masc-sub">Your ${m.name.toLowerCase()} on the sideline</div>`;
  }

  function renderGrid() {
    const g = $('masc-grid'); if (!g) return;
    g.innerHTML = CREW.map(m => {
      const owned = state.owned.indexOf(m.id) !== -1;
      const on = state.equipped === m.id;
      const tag = on ? '<span class="masc-tag on">ON THE SIDELINE</span>'
                : owned ? '<span class="masc-tag">TAP TO PICK</span>'
                : `<span class="masc-tag buy">${m.cost} 🪙</span>`;
      return `<div class="masc-card${on ? ' on' : ''}" data-id="${m.id}">
                <div class="masc-card-ic">${m.ic}</div>
                <div class="masc-card-nm">${m.name}</div>
                ${tag}
              </div>`;
    }).join('');
    const c = $('masc-coins'); if (c) c.textContent = coins() + ' 🪙';
    const inp = $('masc-name-input');
    if (inp && document.activeElement !== inp) {
      inp.value = state.name;
      inp.placeholder = byId(state.equipped).dflt;
    }
  }

  function note(msg) {
    const n = $('masc-note'); if (!n) return;
    n.textContent = msg; n.classList.add('show');
  }

  function render() { renderPreview(); renderGrid(); }

  function onPick(e) {
    const el = e.target.closest('[data-id]'); if (!el) return;
    e.preventDefault();
    const m = byId(el.getAttribute('data-id'));
    const owned = state.owned.indexOf(m.id) !== -1;
    if (owned) {
      state.equipped = m.id; save();
      note(mascotName() + ' is on the sideline!');
      render();
      show('td', 'HI, I\'M ' + mascotName().toUpperCase() + '!');
    } else if (window.TDShop && TDShop.spend && TDShop.spend(m.cost)) {
      state.owned.push(m.id); state.equipped = m.id; save();
      if (TDShop.celebrate) TDShop.celebrate(null, m.ic, m.name.toUpperCase() + ' JOINS THE TEAM!');
      note('Say hello to your new ' + m.name.toLowerCase() + '!');
      render();
      show('td', 'HI, I\'M ' + mascotName().toUpperCase() + '!');
    } else {
      note('Not enough coins — go score some more!');
      renderGrid();
    }
  }

  // Typing a name. We save as you type but only redraw the PREVIEW, so the
  // input never loses what you're in the middle of writing.
  function onName() {
    const inp = $('masc-name-input'); if (!inp) return;
    state.name = inp.value.replace(/\s+/g, ' ').slice(0, MAX_NAME).trim();
    save();
    renderPreview();
  }

  // ---- open / close -------------------------------------------------------
  function gameKeyboard(on) { try { window.game.input.keyboard.enabled = on; } catch (e) {} }
  function open() {
    render();
    const n = $('masc-note'); if (n) { n.textContent = ''; n.classList.remove('show'); }
    gameKeyboard(false);           // so typing a name doesn't drive the players
    const el = $('mascot-modal'); if (el) el.style.display = 'flex';
  }
  function close() {
    const el = $('mascot-modal'); if (el) el.style.display = 'none';
    gameKeyboard(true);
  }

  function wire() {
    const tap = (id, fn) => { const el = $(id); if (el) el.addEventListener('pointerdown', e => { e.preventDefault(); fn(); }); };
    tap('open-mascot', open);
    tap('mascot-close', close);
    const grid = $('masc-grid');
    if (grid) grid.addEventListener('pointerdown', onPick);
    const inp = $('masc-name-input');
    if (inp) inp.addEventListener('input', onName);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire);
  else wire();

  window.TDMascot = {
    open, close, cheer, finish,
    name: mascotName,
    equipped: () => state.equipped,
    owned: () => state.owned.slice(),
    crew: () => CREW.map(m => ({ id: m.id, name: m.name, cost: m.cost })),
    _state: () => ({ equipped: state.equipped, owned: state.owned.slice(), name: state.name }),
    _show: show, _hide: hide,
    _pickById: id => {
      const el = document.querySelector('#masc-grid [data-id="' + id + '"]');
      if (el) el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    },
  };
})();
