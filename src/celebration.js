// ============================================================
// TOUCHDOWN FUN — celebration.js: 🕺 TOUCHDOWN CELEBRATIONS
// ------------------------------------------------------------
// Scoring is the best part — so now your player CELEBRATES it! Pick your
// signature move (a dance, a spike, a flex…) and every time YOU score a
// touchdown it plays a big splashy animation right over the field. Three moves
// are free; the flashier ones you unlock with coins, so there's always a
// snazzier celebration to chase.
//
// It's built the safe, self-contained way (like the Halftime Show and the
// Practice Arcade): its own little DOM world, no Phaser touched. main.js just
// calls window.TDCeleb.play() the instant you score (one guarded line), and the
// picker lives inside the 🛍 Pro Shop — so there's NO new menu button or status
// bar to crowd the phone layout. Your choice saves in localStorage 'tdr-celebration'.
// ============================================================
(function () {
  const KEY = 'tdr-celebration';
  const T = window.TDStats ? TDStats.shared : null;   // shared store/load (same as every feature)
  const $ = id => document.getElementById(id);

  // The moves. Free ones cost 0; the flashy ones cost coins. `anim` picks the
  // big emoji's dance style (see the four keyframes in index.html).
  const MOVES = [
    { id: 'raise',  emoji: '🙌', name: 'Raise the Roof', cost: 0,   anim: 'bounce' },
    { id: 'spike',  emoji: '🏈', name: 'Spike It',       cost: 0,   anim: 'shake'  },
    { id: 'dance',  emoji: '🕺', name: 'The Dance',      cost: 0,   anim: 'spin'   },
    { id: 'flex',   emoji: '💪', name: "Flex On 'Em",    cost: 60,  anim: 'pulse'  },
    { id: 'fire',   emoji: '🔥', name: 'On Fire',        cost: 120, anim: 'pulse'  },
    { id: 'bolt',   emoji: '⚡', name: 'Electric',       cost: 180, anim: 'shake'  },
    { id: 'crown',  emoji: '👑', name: 'Crown Me',       cost: 300, anim: 'bounce' },
    { id: 'rocket', emoji: '🚀', name: 'Blast Off',      cost: 450, anim: 'spin'   },
  ];
  const FREE = MOVES.filter(m => m.cost === 0).map(m => m.id);
  const byId = id => MOVES.find(m => m.id === id) || MOVES[0];

  // ---- Save & load -------------------------------------------------------
  function load() {
    let s = T ? T.load('celebration', null) : null;
    if (!s) { try { s = JSON.parse(localStorage.getItem(KEY)); } catch (e) {} }
    if (!s || typeof s !== 'object') s = {};
    let owned = Array.isArray(s.owned) ? s.owned.slice() : [];
    for (const f of FREE) if (!owned.includes(f)) owned.push(f);      // the free moves are always yours
    owned = owned.filter(id => MOVES.some(m => m.id === id));         // drop anything unknown
    const equipped = (s.equipped && owned.includes(s.equipped)) ? s.equipped : FREE[0];
    return { owned, equipped };
  }
  function save() {
    if (T) T.store('celebration', state);
    else { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }
  }
  let state = load();

  const reduce = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coins = () => (window.TDShop && TDShop.coins) ? TDShop.coins() : 0;

  // ---- Build the splashy burst (used both in-game and in the preview) -----
  function burst(container, move, loop) {
    if (!container) return;
    container.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'celeb-show';

    const big = document.createElement('div');
    big.className = 'celeb-big celeb-' + move.anim + (loop ? ' loop' : '');
    big.textContent = move.emoji;
    wrap.appendChild(big);

    // Flying confetti-emoji shooting outward (skipped when the player prefers
    // reduced motion).
    if (!reduce()) {
      for (let i = 0; i < 10; i++) {
        const p = document.createElement('span');
        p.className = 'celeb-particle';
        p.textContent = Math.random() < 0.5 ? move.emoji : '✨';
        const ang = (Math.PI * 2 * i) / 10, dist = 90 + Math.random() * 55;
        p.style.setProperty('--dx', Math.cos(ang) * dist + 'px');
        p.style.setProperty('--dy', Math.sin(ang) * dist + 'px');
        p.style.animationDelay = (Math.random() * 0.1).toFixed(2) + 's';
        wrap.appendChild(p);
      }
    }

    const label = document.createElement('div');
    label.className = 'celeb-name';
    label.textContent = move.name + '!';
    wrap.appendChild(label);

    container.appendChild(wrap);
  }

  // ---- The in-game moment: main.js calls this the instant YOU score --------
  let clearT = null;
  function play() {
    const fx = $('celeb-fx'); if (!fx) return;
    fx.style.display = 'block';
    burst(fx, byId(state.equipped), false);
    clearTimeout(clearT);
    clearT = setTimeout(() => { fx.style.display = 'none'; fx.innerHTML = ''; }, reduce() ? 900 : 1600);
  }

  // ---- The picker (inside the 🛍 Pro Shop) --------------------------------
  function renderPreview() { burst($('celeb-preview'), byId(state.equipped), true); }   // gentle looping preview

  function renderGrid() {
    const grid = $('celeb-grid'); if (!grid) return;
    grid.innerHTML = '';
    const c = coins();
    for (const m of MOVES) {
      const owned = state.owned.includes(m.id);
      const equipped = state.equipped === m.id;
      const card = document.createElement('div');
      card.className = 'celeb-card' + (equipped ? ' equipped' : '') + (owned ? ' owned' : ' locked');
      let tag;
      if (equipped)   tag = '<span class="celeb-tag on">EQUIPPED</span>';
      else if (owned) tag = '<span class="celeb-tag">EQUIP</span>';
      else            tag = `<span class="celeb-tag buy${c >= m.cost ? '' : ' cant'}">🪙 ${m.cost}</span>`;
      card.innerHTML = `<div class="celeb-emoji">${m.emoji}</div><div class="celeb-cardnm">${m.name}</div>${tag}`;
      card.addEventListener('pointerdown', e => { e.preventDefault(); onCard(m); });
      grid.appendChild(card);
    }
  }

  let busy = 0;
  function onCard(m) {
    const now = Date.now();
    if (now - busy < 350) return;   // debounce double-taps (like the other shops)
    busy = now;

    if (state.owned.includes(m.id)) {          // already yours → equip it (and show it off)
      state.equipped = m.id; save();
      renderPreview(); renderGrid();
    } else if (window.TDShop && TDShop.spend && TDShop.spend(m.cost)) {   // buy it (spend returns false if broke)
      state.owned.push(m.id); state.equipped = m.id; save();
      if (TDShop.celebrate) TDShop.celebrate(null, m.emoji, m.name + ' UNLOCKED!');
      renderPreview(); renderGrid();
    } else {
      note('Not enough coins — go score some more!');
    }
  }

  let noteT = null;
  function note(msg) {
    const n = $('celeb-note'); if (!n) return;
    n.textContent = msg; n.classList.add('show');
    clearTimeout(noteT); noteT = setTimeout(() => n.classList.remove('show'), 1400);
  }

  // ---- Open / close the picker -------------------------------------------
  function open() {
    state = load();
    renderPreview(); renderGrid();
    const el = $('celeb-modal'); if (el) el.style.display = 'flex';
  }
  function closeOverlay() { const el = $('celeb-modal'); if (el) el.style.display = 'none'; }

  function tap(id, fn) { const el = $(id); if (el) el.addEventListener('pointerdown', e => { e.preventDefault(); fn(); }); }
  function wire() { tap('open-celeb', open); tap('celeb-close', closeOverlay); }
  if (document.readyState !== 'loading') wire();
  else document.addEventListener('DOMContentLoaded', wire);

  // ---- What the rest of the game may use ----------------------------------
  window.TDCeleb = {
    play,   // main.js: you scored — show the celebration!
    open    // the Pro Shop button opens the picker
  };
})();
