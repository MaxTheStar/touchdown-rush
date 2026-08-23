// ============================================================
// TOUCHDOWN FUN — events.js: 🎃 SEASON EVENTS
// ------------------------------------------------------------
// Some weeks of the year, football just feels different — and now the game
// knows it. Fire up a game during Halloween week and it's automatically
// 🎃 HALLOWEEN NIGHT: a night game on a black-and-orange field with a pumpkin
// at midfield, and a coin bonus for playing. Christmas week? The ❄️ SNOW BOWL,
// in a blizzard. You don't pick these from a menu — you just show up and
// they're happening. That's the whole point.
//
// There are twelve through the year, each live for about a week, so one comes
// around roughly every month. Win all twelve and you've collected the set (the
// 🎃 SEASON EVENTS screen keeps your trophy case for them, and tells you what's
// on now or what's coming next).
//
// How it hooks in (all guarded, all reusing paths that already existed):
//   • `beginGame` asks us `begin()` — if an event is live, THIS game becomes it.
//   • main.js's `drawField` asks us for a field look FIRST, so the themed turf
//     paints for the game, then flips back to your own when you return.
//   • `TDWeather.forGame(force)` lets the event set its own sky.
//   • `endGame` calls `finish(won)` for the payday.
// Your collection saves in localStorage 'tdr-events'.
// ============================================================
(function () {
  const T = window.TDStats ? TDStats.shared : null;
  const $ = id => document.getElementById(id);

  // Each event is live from `from` to `to` (day-of-month, inclusive) in `month`.
  // Windows sit on the real holiday where there is one, so it lands when it
  // should — and they're about a week long, so you actually run into them.
  const EVENTS = [
    { id: 'winter',  month: 1,  from: 1,  to: 7,  emoji: '❄️', name: 'WINTER BOWL',
      blurb: 'New year, frozen field. Bundle up!', wx: 'snow',
      look: { dark: 0xc2d2e0, light: 0xdce9f4, endzone: 0x1e4f8c, logo: '❄️', logoColor: '#ffffff' },
      deco: ['❄️','⛄','🧊'], crowd: ['🧣','☕','❄️'], win: { emoji: '⛄', text: 'ICE COLD WIN!' } },
    { id: 'heart',   month: 2,  from: 10, to: 17, emoji: '💖', name: 'VALENTINE CLASSIC',
      blurb: 'Show the football some love.', wx: 'clear',
      look: { dark: 0x9e2b58, light: 0xc23a70, endzone: 0x6d1440, logo: '💖', logoColor: '#ffffff' },
      deco: ['💖','🌹','💝'], crowd: ['💕','🥰','💐'], win: { emoji: '💖', text: 'LOVE THIS TEAM!' } },
    { id: 'lucky',   month: 3,  from: 14, to: 20, emoji: '🍀', name: 'LUCKY BOWL',
      blurb: 'Feeling lucky? You might need it.', wx: 'clear',
      look: { dark: 0x14733a, light: 0x1e9c4e, endzone: 0x0b4f26, logo: '🍀', logoColor: '#ffffff' },
      deco: ['🍀','🌈','🪙'], crowd: ['🍀','🎩','🌈'], win: { emoji: '🍀', text: 'LUCKY WIN!' } },
    { id: 'mud',     month: 4,  from: 1,  to: 8,  emoji: '🌧️', name: 'MUD BOWL',
      blurb: 'April showers make a very messy field.', wx: 'rain',
      look: { dark: 0x5a4630, light: 0x6f5739, endzone: 0x3a2c1c, logo: '🌧️', logoColor: '#ffffff' },
      deco: ['🌧️','☔','💧'], crowd: ['☔','🌂','🦆'], win: { emoji: '💦', text: 'MUDDY VICTORY!' } },
    { id: 'spring',  month: 5,  from: 1,  to: 8,  emoji: '🌸', name: 'SPRING SHOWCASE',
      blurb: 'Fresh grass, fresh start.', wx: 'clear',
      look: { dark: 0x2f8a44, light: 0x46ad5c, endzone: 0xb2568c, logo: '🌸', logoColor: '#ffffff' },
      deco: ['🌸','🌷','🐝'], crowd: ['🌸','🦋','🌼'], win: { emoji: '🌸', text: 'SPRING CHAMPS!' } },
    { id: 'summer',  month: 6,  from: 18, to: 25, emoji: '☀️', name: 'SUMMER SLAM',
      blurb: 'Sun beating down — grab some water.', wx: 'hot',
      look: { dark: 0x2b8a5e, light: 0x36a872, endzone: 0xd9911b, logo: '☀️', logoColor: '#ffffff' },
      deco: ['☀️','🏖️','🍉'], crowd: ['🕶️','🍦','🥤'], win: { emoji: '🍉', text: 'SUMMER SLAM WIN!' } },
    { id: 'fire',    month: 7,  from: 1,  to: 7,  emoji: '🎆', name: 'FIREWORKS BOWL',
      blurb: 'Night game, big lights, bigger fireworks.', wx: 'night',
      look: { dark: 0x14285c, light: 0x1c3576, endzone: 0xb01c2e, logo: '🎆', logoColor: '#ffffff' },
      deco: ['🎆','🎇','🗽'], crowd: ['🎆','🇺🇸','🎇'], win: { emoji: '🎆', text: 'FIREWORKS!' } },
    { id: 'camp',    month: 8,  from: 18, to: 28, emoji: '🔥', name: 'TRAINING CAMP HEAT',
      blurb: 'The hottest practice of the year.', wx: 'hot',
      look: { dark: 0x7a5a1c, light: 0x9c7524, endzone: 0x4a3410, logo: '🔥', logoColor: '#ffffff' },
      deco: ['🔥','💦','🥵'], crowd: ['🥤','🧢','💦'], win: { emoji: '💪', text: 'CAMP CHAMPION!' } },
    { id: 'kickoff', month: 9,  from: 5,  to: 12, emoji: '🏈', name: 'KICKOFF CLASSIC',
      blurb: 'Football is BACK. Perfect day for it.', wx: 'clear',
      look: { dark: 0x246b26, light: 0x2f8a33, endzone: 0x8a1420, logo: '🏈', logoColor: '#ffffff' },
      deco: ['🏈','📣','🎉'], crowd: ['📣','🎉','🏈'], win: { emoji: '🏈', text: 'FOOTBALL IS BACK!' } },
    { id: 'spooky',  month: 10, from: 25, to: 31, emoji: '🎃', name: 'HALLOWEEN NIGHT',
      blurb: 'Spooky night game. Watch out for ghosts!', wx: 'night',
      look: { dark: 0x1a1420, light: 0x2a1f33, endzone: 0xc2560d, logo: '🎃', logoColor: '#ffffff' },
      deco: ['🎃','👻','🦇','🕸️'], crowd: ['👻','🧛','🎃','🧙'], win: { emoji: '🎃', text: 'HAPPY HALLOWEEN!' } },
    { id: 'turkey',  month: 11, from: 20, to: 28, emoji: '🦃', name: 'TURKEY BOWL',
      blurb: 'The classic holiday game — windy and wild.', wx: 'wind',
      look: { dark: 0x6b4a1c, light: 0x8a6124, endzone: 0x8c3a12, logo: '🦃', logoColor: '#ffffff' },
      deco: ['🦃','🍂','🥧'], crowd: ['🦃','🍽️','🥧'], win: { emoji: '🦃', text: 'TURKEY TIME! 🍽️' } },
    { id: 'snow',    month: 12, from: 20, to: 27, emoji: '🎄', name: 'SNOW BOWL',
      blurb: 'A blizzard classic. Good luck kicking!', wx: 'blizzard',
      look: { dark: 0x1c5c34, light: 0x276f42, endzone: 0xa81428, logo: '🎄', logoColor: '#ffffff' },
      deco: ['🎄','🎁','⛄'], crowd: ['🎅','🤶','🦌'], win: { emoji: '🎅', text: 'MERRY CHRISTMAS!' } },
  ];

  const PLAY_BONUS = 15;    // 🪙 just for showing up
  const WIN_BONUS  = 40;    // 🪙 more for winning it
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  // ---- Save & load --------------------------------------------------------
  function load() {
    let s = T ? T.load('events', null) : null;
    if (!s) { try { s = JSON.parse(localStorage.getItem('tdr-events')); } catch (e) {} }
    s = (s && typeof s === 'object') ? s : {};
    return { played: Array.isArray(s.played) ? s.played : [], won: Array.isArray(s.won) ? s.won : [] };
  }
  function save() {
    if (T) T.store('events', state);
    else { try { localStorage.setItem('tdr-events', JSON.stringify(state)); } catch (e) {} }
  }
  let state = load();

  // ---- Is an event live RIGHT NOW? ---------------------------------------
  // (a `when` can be passed in for testing — normally it's just today)
  function liveOn(when) {
    const d = when || new Date();
    const m = d.getMonth() + 1, day = d.getDate();
    return EVENTS.find(e => e.month === m && day >= e.from && day <= e.to) || null;
  }
  function active() { return liveOn(null); }

  // How many days until the next one starts (for the "coming up" line).
  function nextUp(when) {
    const d = when || new Date();
    const y = d.getFullYear();
    let best = null, bestDays = Infinity;
    for (const e of EVENTS) {
      for (const yr of [y, y + 1]) {
        const start = new Date(yr, e.month - 1, e.from);
        const days = Math.ceil((start - d) / 86400000);
        if (days > 0 && days < bestDays) { bestDays = days; best = e; }
      }
    }
    return best ? { ev: best, days: bestDays } : null;
  }

  let running = null;   // the event powering THIS game (null = a normal game)

  // ---- main.js game hooks -------------------------------------------------
  // beginGame asks this: if an event is live today, this game becomes it.
  function begin() { running = active(); return running; }
  function fieldOverride() { return running ? running.look : null; }
  function weatherFor() { return running ? running.wx : null; }
  function label() { return running ? (running.emoji + ' ' + running.name) : ''; }
  // 🎃 What to scatter on the field: `deco` goes in the end zones, `crowd` sits
  // up in the stands behind them (Santa watching the Snow Bowl, ghosts at
  // Halloween). main.js's drawField paints these for an event game.
  function decorations() {
    if (!running) return null;
    return { deco: running.deco || [running.emoji], crowd: running.crowd || [running.emoji] };
  }

  // The final whistle of an event game.
  function finish(won) {
    const ev = running; if (!ev) return 0;
    if (!state.played.includes(ev.id)) state.played.push(ev.id);
    if (won && !state.won.includes(ev.id)) state.won.push(ev.id);
    save();
    const coins = PLAY_BONUS + (won ? WIN_BONUS : 0);
    if (window.TDShop && TDShop.earn) TDShop.earn(coins);
    // 🦃 A themed party when you WIN the event — turkey for Thanksgiving,
    // Santa at Christmas, pumpkins at Halloween.
    if (won && ev.win && window.TDShop && TDShop.celebrate) {
      setTimeout(() => TDShop.celebrate(null, ev.win.emoji, ev.win.text), 400);
    }
    return coins;
  }
  // Back to the menu — drop the theme so your own field paints again.
  function clear() { running = null; }

  // ---- The events screen (what's on + the year's collection) --------------
  function render() {
    const body = $('events-body'); if (!body) return;
    const now = active();
    const next = nextUp(null);
    const won = state.won.length;

    const cards = EVENTS.map(e => {
      const isNow = now && e.id === now.id;
      const hasWon = state.won.includes(e.id);
      const played = state.played.includes(e.id);
      const tag = hasWon ? '<span class="ev-tag won">🏆 WON</span>'
                : played ? '<span class="ev-tag played">PLAYED</span>' : '';
      return `<div class="ev-card${isNow ? ' now' : ''}${hasWon ? ' won' : ''}">` +
               `<div class="ev-emoji">${e.emoji}</div>` +
               `<div class="ev-nm">${e.name}</div>` +
               `<div class="ev-mo">${MONTHS[e.month - 1]} ${e.from}–${e.to}</div>${tag}` +
             `</div>`;
    }).join('');

    const hero = now
      ? `<div class="ev-hero live">` +
          `<div class="ev-hero-emoji">${now.emoji}</div>` +
          `<div class="ev-hero-nm">${now.name}</div>` +
          `<div class="ev-hero-blurb">${now.blurb}</div>` +
          `<div class="ev-hero-note">🔴 HAPPENING NOW — just hit PLAY!</div>` +
        `</div>` +
        `<div class="ev-prize">Every game this week is the event · 🪙 +${PLAY_BONUS} for playing, +${WIN_BONUS} more for a WIN</div>`
      : `<div class="ev-hero">` +
          `<div class="ev-hero-emoji">${next ? next.ev.emoji : '📅'}</div>` +
          `<div class="ev-hero-nm">${next ? next.ev.name : 'MORE COMING'}</div>` +
          `<div class="ev-hero-blurb">${next ? next.ev.blurb : ''}</div>` +
          `<div class="ev-hero-note soon">COMING IN ${next ? next.days : '?'} DAY${next && next.days === 1 ? '' : 'S'}</div>` +
        `</div>` +
        `<div class="ev-prize">When it's on, every game you play becomes the event — automatically.</div>`;

    body.innerHTML = hero +
      `<div class="ev-sec">📅 The Whole Year <span>${won}/12 won</span></div>` +
      `<div class="ev-grid">${cards}</div>`;
  }

  function open() { state = load(); render(); const el = $('events-modal'); if (el) el.style.display = 'flex'; }
  function closeOverlay() { const el = $('events-modal'); if (el) el.style.display = 'none'; }

  function tap(id, fn) { const el = $(id); if (el) el.addEventListener('pointerdown', e => { e.preventDefault(); fn(); }); }
  function wire() { tap('open-events', open); tap('events-close', closeOverlay); }
  if (document.readyState !== 'loading') wire();
  else document.addEventListener('DOMContentLoaded', wire);

  window.TDEvents = {
    open, active, nextUp,
    begin, fieldOverride, weatherFor, label, decorations, finish, clear,
    // handy for testing: TDEvents._on(new Date(2026,9,31)) → the Halloween event
    _on: liveOn, _all: () => EVENTS.slice(),
  };
})();
