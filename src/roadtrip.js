// ============================================================
// TOUCHDOWN FUN — roadtrip.js: 🚌 THE ROAD TRIP (Round 8, pick ④)
// ------------------------------------------------------------
// Every other reward system here counts things up. The Road Trip is a
// JOURNEY: the team boards the bus and plays its way across the country,
// five away games in five towns. WIN and you roll on to the next town.
// Lose and the bus doesn't move — you're stuck there until you win.
// (No punishment beyond that. Getting stuck in FROSTBURG is bad enough.)
//
// Arrive somewhere new and there's a welcome payout waiting, bigger at
// every stop. Make it all the way home and you get the 🏆 trip trophy,
// a big bonus and a free spin — then a brand-new route is drawn up so
// you can do it again somewhere else.
//
// It's deliberately NOT the 🎟️ Reward Road: that one is a points ladder
// that only ever goes up, no matter how you play. This one only moves
// when you WIN, which makes a single game matter.
//
// ------------------------------------------------------------
// HOW WE KNOW YOU FINISHED A GAME
// ------------------------------------------------------------
// main.js already tells the Reward Road every result with one clean
// call — TDRoad.addPoints(youWon). That's exactly what the bus needs,
// so we wrap that one function: ours runs the original first, then
// moves the bus. No new hooks in main.js, and if this file is missing
// the game is completely unchanged.
// ============================================================
(function () {
  'use strict';

  // Short name on purpose — TDStats.shared adds the "tdr-" for us, so this
  // saves to "tdr-trip" (writing 'tdr-trip' here would make "tdr-tdr-trip").
  const KEY = 'trip';
  const $ = id => document.getElementById(id);

  const T = window.TDStats ? TDStats.shared : null;
  const store = (k, v) => { if (T) T.store(k, v); };
  const load  = (k, f) => (T ? T.load(k, f) : f);

  // ---- The towns the bus can visit ---------------------------------------
  // All made up (same flavour as the college towns in draft.js), each with a
  // little line the announcer would say when you roll into town.
  const TOWNS = [
    { icon: '🌆', name: 'GRAND CITY',   note: 'Big lights, big crowd.' },
    { icon: '❄️', name: 'FROSTBURG',    note: 'Bring the gloves.' },
    { icon: '🌵', name: 'DESERT ROCK',  note: 'Hot, dry and loud.' },
    { icon: '🌊', name: 'LAKESIDE',     note: 'Wind off the water.' },
    { icon: '🌲', name: 'PINE CREST',   note: 'A tough little stadium.' },
    { icon: '🏔️', name: 'SUMMIT PEAK',  note: 'Thin air up here.' },
    { icon: '⚓', name: 'HARBOR BAY',   note: 'Foghorns all game long.' },
    { icon: '🌾', name: 'PRAIRIE FIELD', note: 'Nothing to block the wind.' },
    { icon: '🔥', name: 'EMBER FALLS',  note: 'The loudest fans on the road.' },
    { icon: '🌙', name: 'MIDNIGHT MESA', note: 'A proper night game.' },
  ];

  // What each stop pays when you arrive — further from home, bigger welcome.
  const PAYOUTS = [40, 60, 90, 130, 200];
  const STOPS = PAYOUTS.length;
  const FINISH = { coins: 250, spins: 1 };     // for making it all the way home

  // ---- State --------------------------------------------------------------
  // { route: [town indexes], at: how many stops reached, done: trips finished }
  let s = null;

  function newRoute() {
    const pool = TOWNS.map((t, i) => i);
    // shuffle, then take five different towns
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = pool[i]; pool[i] = pool[j]; pool[j] = tmp;
    }
    return pool.slice(0, STOPS);
  }

  function ensure() {
    if (!s) s = load(KEY, null);
    if (!s || !Array.isArray(s.route) || s.route.length !== STOPS) {
      s = { route: newRoute(), at: 0, done: 0 };
      save();
    }
  }
  function save() { store(KEY, s); }

  // ---- The bus moves ------------------------------------------------------
  function finishGame(won) {
    ensure();
    if (!won) return;                       // the bus only moves on a win
    if (s.at >= STOPS) return;              // already home (waiting on a new route)

    const town = TOWNS[s.route[s.at]];
    const pay = PAYOUTS[s.at];
    s.at++;
    if (window.TDShop) TDShop.earn(pay);

    if (s.at >= STOPS) {
      // Made it home — trophy, bonus, and a fresh route for next time.
      s.done++;
      if (window.TDShop) TDShop.earn(FINISH.coins);
      if (window.TDSpin && TDSpin.grantFreeSpins) TDSpin.grantFreeSpins(FINISH.spins);
      save();
      toast('🏆 ROAD TRIP COMPLETE! +' + FINISH.coins + ' 🪙 and a free spin!');
      // Draw up the next route, but leave the finished one on screen until the
      // player next opens the board (so they get to SEE they finished it).
      s.pendingNew = true;
      save();
    } else {
      save();
      toast('🚌 ARRIVED IN ' + town.name + '! +' + pay + ' 🪙');
    }
    if (isOpen()) render();
  }

  // A brief message during play — reuses the daily-challenge toast strip.
  function toast(msg) {
    const el = $('chal-toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 2400);
  }

  // ---- Drawing ------------------------------------------------------------
  function isOpen() { const m = $('trip-modal'); return m && m.style.display === 'flex'; }

  function render() {
    ensure();
    // If the last trip finished, start the new route the moment they look.
    if (s.pendingNew) { s.route = newRoute(); s.at = 0; delete s.pendingNew; save(); }

    const list = $('trip-list');
    if (!list) return;
    list.innerHTML = s.route.map((ti, i) => {
      const t = TOWNS[ti];
      const reached = i < s.at;
      const here = i === s.at;
      const cls = reached ? 'trip-stop done' : here ? 'trip-stop here' : 'trip-stop';
      const badge = reached ? '<span class="trip-tick">✓</span>'
                  : here   ? '<span class="trip-next">NEXT — WIN TO GO</span>'
                           : '<span class="trip-pay">' + PAYOUTS[i] + ' 🪙</span>';
      return '<div class="' + cls + '">' +
               '<span class="trip-ic">' + t.icon + '</span>' +
               '<span class="trip-body"><b>' + t.name + '</b><small>' + t.note + '</small></span>' +
               badge +
             '</div>';
    }).join('');

    const bar = $('trip-bar-fill');
    if (bar) bar.style.width = Math.round((s.at / STOPS) * 100) + '%';

    const sum = $('trip-sum');
    if (sum) {
      sum.textContent = s.at >= STOPS
        ? '🏆 Trip complete — a new route is ready!'
        : 'Stop ' + (s.at + 1) + ' of ' + STOPS + ' · win your next game to roll on';
    }
    const done = $('trip-done');
    if (done) {
      done.textContent = s.done > 0
        ? '🏆 Trips completed: ' + s.done
        : 'Finish all ' + STOPS + ' for +' + FINISH.coins + ' 🪙 and a free spin';
    }
  }

  function open()  { ensure(); const m = $('trip-modal'); if (m) { m.style.display = 'flex'; render(); } }
  function close() { const m = $('trip-modal'); if (m) m.style.display = 'none'; }

  // ---- Wire up ------------------------------------------------------------
  function onTap(id, fn) {
    const el = $(id);
    if (el) el.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); fn(); });
  }

  function wireUp() {
    ensure();
    onTap('open-trip', open);
    onTap('trip-close', close);

    // ---- The one hook (see the note at the top) ---------------------------
    if (window.TDRoad && !TDRoad.__tripWrapped) {
      const original = TDRoad.addPoints;
      TDRoad.addPoints = function (won) {
        original.apply(TDRoad, arguments);     // the Reward Road, exactly as before
        try { finishGame(!!won); } catch (e) {} // …then move the bus, never breaking the game
      };
      TDRoad.__tripWrapped = true;
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wireUp);
  else wireUp();

  window.TDTrip = { open, close, render, finishGame, _state: () => s };
})();
