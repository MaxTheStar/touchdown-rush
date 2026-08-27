// ============================================================
// TOUCHDOWN FUN — concession.js: 🍿 THE CONCESSION STANDS
// ------------------------------------------------------------
// You don't just play for the team any more — you RUN the snack bar too!
// This is its own little game-inside-the-game (a bit like a cafe game):
// hungry fans walk up to your counter, each one orders something, and you
// have to MAKE it with the tools on your counter before they get grumpy and
// wander off. Serve them fast, chain up a 🔥 streak, and the tips roll in.
//
//   ▶️ THE RUSH (the mini-game) — 45 seconds, three fans in line at a time.
//      Each fan's speech bubble shows their order, like 🌭 🥤. Tap those same
//      buttons on your counter IN ORDER to build it on the tray. Finish the
//      tray and they're served automatically: 😄 + coins. Their patience bar
//      is ticking the whole time, so keep the line moving!
//
//   🏬 MORE STANDS — you start with one little 🌭 hot dog cart. Buy more
//      stands (popcorn, soda, pretzels, pizza, ice cream) and TWO things
//      happen: that snack unlocks as a new button in the rush, AND the stand
//      quietly sells to the crowd during every football game you play, paying
//      you "sales" coins in the payday at the end. Stands earn while you play.
//
//   🧑‍🍳 YOUR CREW — hire help, once, and they stay for good: a 👨‍🍳 COOK preps
//      the first item of every order, a 🤡 COMEDIAN keeps the crowd laughing
//      so they wait way longer, a 💁 CASHIER adds a tip to every single sale,
//      and a 🎺 PEP BAND pulls a bigger crowd so game-day sales pay more.
//
//   SELF-CONTAINED ON PURPOSE — like the Practice Arcade, the whole thing is
//   its own DOM world. It never touches the real football sim, so it can't
//   break a game; it just hands you coins through TDShop.earn. (And, as
//   always: every single coin here is won by playing. No real money, ever.)
//
// Saved in `tdr-concession` = { stands, staff, best, served, earned, seenHow }.
// Opened from the 🛍 Pro Shop and from the 🎯 Practice Arcade hub. main.js only
// needs one line — TDFood.gameBonus() — to pay the game-day sales.
// ============================================================
(function () {
  'use strict';

  const T = window.TDStats ? TDStats.shared : null;
  const store = (k, v) => { if (T) T.store(k, v); };
  const load  = (k, f) => (T ? T.load(k, f) : f);
  const $ = id => document.getElementById(id);

  // ---- 🍔 the menu: every snack, what it's worth, and which stand sells it --
  // `pay` is what that item adds to a sale in the rush; `sales` is what the
  // stand quietly earns you during a football game. Prices climb, and so does
  // how fussy the snack is to make (pizza takes two taps' worth of patience).
  const STANDS = [
    { id: 'cart',    icon: '🌭', name: 'HOT DOG CART',    cost: 0,   pay: 2, sales: 2,
      blurb: 'The one you started with. Classic dog, classic fan.' },
    { id: 'pop',     icon: '🍿', name: 'POPCORN STAND',   cost: 120, pay: 2, sales: 3,
      blurb: 'Hot, buttery, and the whole stadium can smell it.' },
    { id: 'soda',    icon: '🥤', name: 'SODA FOUNTAIN',   cost: 200, pay: 1, sales: 3,
      blurb: 'Everybody wants a drink. Quick to pour, quick to sell.' },
    { id: 'pretzel', icon: '🥨', name: 'PRETZEL TWIST',   cost: 320, pay: 3, sales: 4,
      blurb: 'Big salty twists. Fans pay extra for these.' },
    { id: 'pizza',   icon: '🍕', name: 'PIZZA CORNER',    cost: 500, pay: 3, sales: 5,
      blurb: 'By the slice, straight from the oven. A crowd favorite.' },
    { id: 'ice',     icon: '🍦', name: 'ICE CREAM TRUCK', cost: 750, pay: 4, sales: 6,
      blurb: 'The fanciest stand you can own — and the best payday.' },
  ];

  // ---- 🧑‍🍳 the crew you can hire (one-time cost, yours forever) -------------
  const CREW = [
    { id: 'cook',  icon: '👨‍🍳', name: 'THE COOK',    cost: 250,
      perk: 'Preps the FIRST item of every order for you.' },
    { id: 'joker', icon: '🤡',   name: 'THE COMEDIAN', cost: 300,
      perk: 'Keeps the crowd laughing — fans wait much longer.' },
    { id: 'cash',  icon: '💁',   name: 'THE CASHIER',  cost: 200,
      perk: 'Works the register: +2 🪙 tip on every sale.' },
    { id: 'band',  icon: '🎺',   name: 'THE PEP BAND', cost: 400,
      perk: 'Pulls a bigger crowd: +25% game-day sales.' },
  ];

  const RUSH_MS   = 45000;   // one rush is 45 seconds
  const RUSH_CAP  = 40;      // the most coins one rush can pay (keeps it fair)
  const SALES_CAP = 25;      // the most game-day sales can pay after a game

  // ---- 💾 what we remember -------------------------------------------------
  let s = load('concession', null);
  if (!s || typeof s !== 'object') s = {};
  if (!Array.isArray(s.stands) || !s.stands.length) s.stands = ['cart'];  // the free cart
  if (!Array.isArray(s.staff)) s.staff = [];
  if (typeof s.best !== 'number') s.best = 0;
  if (typeof s.served !== 'number') s.served = 0;
  if (typeof s.earned !== 'number') s.earned = 0;
  if (typeof s.seenHow !== 'boolean') s.seenHow = false;
  // Sweep out anything we don't recognise, so an old save can never break us.
  s.stands = s.stands.filter(id => STANDS.some(x => x.id === id));
  s.staff  = s.staff.filter(id => CREW.some(x => x.id === id));
  if (!s.stands.length) s.stands = ['cart'];
  function save() { store('concession', s); }

  const hasStand = id => s.stands.indexOf(id) >= 0;
  const hasCrew  = id => s.staff.indexOf(id) >= 0;
  const myStands = () => STANDS.filter(x => hasStand(x.id));

  // 🪙 GAME-DAY SALES — what your stands sell during a football game. Every
  // stand chips in, the pep band adds a quarter more, and it's capped so the
  // snack bar stays a nice bonus instead of taking over the coin economy.
  function salesPerGame() {
    let n = 0;
    myStands().forEach(x => { n += x.sales; });
    if (hasCrew('band')) n = Math.round(n * 1.25);
    return Math.min(SALES_CAP, n);
  }

  // main.js calls this right before the FINAL screen, so the coins land in
  // the payday total with everything else you earned that game.
  function gameBonus() {
    const n = salesPerGame();
    if (n > 0 && window.TDShop) { TDShop.earn(n); s.earned += n; save(); }
    return n;
  }

  // ---- ⏱ timer bookkeeping (nothing keeps ticking once you leave) ----------
  let mode = null;            // 'hub' | 'how' | 'rush' | 'over'
  let timers = [];
  function clearTimers() { timers.forEach(id => { clearInterval(id); clearTimeout(id); }); timers = []; }
  const every = (fn, ms) => { const id = setInterval(fn, ms); timers.push(id); return id; };
  const after = (fn, ms) => { const id = setTimeout(fn, ms); timers.push(id); return id; };

  const stage = () => $('food-stage');
  const hud   = () => $('food-hud');
  const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // ============================================================
  // 🏠 THE HUB — stands, crew, and the big START button
  // ============================================================
  function showHub() {
    mode = 'hub'; clearTimers();
    if (hud()) hud().style.display = 'none';
    if ($('food-back')) $('food-back').style.display = 'none';
    const st = stage(); if (!st) return;
    const coins = window.TDShop ? TDShop.coins() : 0;

    const standRows = STANDS.map(x => {
      const own = hasStand(x.id);
      const can = !own && coins >= x.cost;
      return `<div class="food-row${own ? ' own' : ''}">
          <div class="food-row-ic">${x.icon}</div>
          <div class="food-row-tx">
            <div class="food-row-nm">${esc(x.name)}</div>
            <div class="food-row-bl">${esc(x.blurb)}</div>
            <div class="food-row-pk">🪙 ${x.sales} sales every game · +${x.pay} 🪙 a serve</div>
          </div>
          ${own
            ? `<div class="food-tag own">OWNED</div>`
            : `<div class="food-buy${can ? '' : ' no'}" data-buy="${x.id}">🪙 ${x.cost}</div>`}
        </div>`;
    }).join('');

    const crewRows = CREW.map(x => {
      const own = hasCrew(x.id);
      const can = !own && coins >= x.cost;
      return `<div class="food-row${own ? ' own' : ''}">
          <div class="food-row-ic">${x.icon}</div>
          <div class="food-row-tx">
            <div class="food-row-nm">${esc(x.name)}</div>
            <div class="food-row-bl">${esc(x.perk)}</div>
          </div>
          ${own
            ? `<div class="food-tag own">HIRED</div>`
            : `<div class="food-buy${can ? '' : ' no'}" data-hire="${x.id}">🪙 ${x.cost}</div>`}
        </div>`;
    }).join('');

    st.innerHTML =
      `<div class="food-stats">
        <div class="food-stat"><b>${s.stands.length}</b><span>stands</span></div>
        <div class="food-stat"><b>${s.served}</b><span>fans served</span></div>
        <div class="food-stat"><b>${s.best}</b><span>best rush 🪙</span></div>
      </div>
      <div class="food-go" id="food-start">▶️ START THE RUSH</div>
      <div class="food-note">Your stands sell <b>${salesPerGame()} 🪙</b> for you during every football game — that lands in your payday automatically.</div>
      <div class="food-help" id="food-how">❓ HOW TO PLAY</div>
      <div class="food-sect">🏬 YOUR STANDS — buy one, sell it forever</div>
      ${standRows}
      <div class="food-sect">🧑‍🍳 YOUR CREW — hire help for the counter</div>
      ${crewRows}`;

    tap($('food-start'), () => (s.seenHow ? startRush() : showHow()));
    tap($('food-how'), showHow);
    st.querySelectorAll('[data-buy]').forEach(el => tap(el, () => buyStand(el.getAttribute('data-buy'))));
    st.querySelectorAll('[data-hire]').forEach(el => tap(el, () => hire(el.getAttribute('data-hire'))));
  }

  // A tiny helper so every button in here reacts the same way on a phone.
  function tap(el, fn) {
    if (!el) return;
    el.addEventListener('pointerdown', e => { e.preventDefault(); fn(); });
  }

  // ---- 🛒 buying a stand / hiring the crew ---------------------------------
  // Same 400 ms guard the Stadium Builder uses: a buy re-draws the list and
  // drops a fresh button under your finger, and we don't want one tap to buy
  // two things.
  let lastBuy = 0;
  function guard() { const n = Date.now(); if (n - lastBuy < 400) return false; lastBuy = n; return true; }

  function buyStand(id) {
    if (!guard()) return;
    const x = STANDS.find(v => v.id === id);
    if (!x || hasStand(id)) return;
    if (!window.TDShop || !TDShop.spend(x.cost)) return;   // can't afford it (button was greyed)
    s.stands.push(id); save();
    showHub();
    if (window.TDShop && TDShop.celebrate) TDShop.celebrate($('food-stage'), x.icon, x.name + ' OPEN!');
  }

  function hire(id) {
    if (!guard()) return;
    const x = CREW.find(v => v.id === id);
    if (!x || hasCrew(id)) return;
    if (!window.TDShop || !TDShop.spend(x.cost)) return;
    s.staff.push(id); save();
    showHub();
    if (window.TDShop && TDShop.celebrate) TDShop.celebrate($('food-stage'), x.icon, x.name + ' HIRED!');
  }

  // ============================================================
  // 📖 HOW TO PLAY — shown the first time you walk up to the counter
  // ============================================================
  function showHow() {
    mode = 'how'; clearTimers();
    if (hud()) hud().style.display = 'none';
    if ($('food-back')) $('food-back').style.display = 'block';
    const st = stage(); if (!st) return;
    st.innerHTML =
      `<div class="food-how">
        <div class="food-how-t">🍿 WELCOME TO THE COUNTER!</div>
        <div class="food-step"><span>1️⃣</span><div>Fans line up and each one shows what they want, like <b>🌭 🥤</b>.</div></div>
        <div class="food-step"><span>2️⃣</span><div>Tap the <b>same buttons on your counter</b>, in that order, to build it on the tray.</div></div>
        <div class="food-step"><span>3️⃣</span><div>Finish the tray and they're served — 😄 <b>coins!</b> Wrong button? The tray just shakes, no harm done.</div></div>
        <div class="food-step"><span>4️⃣</span><div>Watch the little <b>patience bar</b> under each fan. Empty means they walk off 😠 and your 🔥 streak resets.</div></div>
        <div class="food-step"><span>⏱️</span><div>You get <b>45 seconds</b>. Serve fans back-to-back for a 🔥 streak and bigger tips — a rush pays up to <b>${RUSH_CAP} 🪙</b>.</div></div>
        <div class="food-go" id="food-go2">▶️ LET'S GO!</div>
      </div>`;
    tap($('food-go2'), startRush);
    if (!s.seenHow) { s.seenHow = true; save(); }
  }

  // ============================================================
  // 🔥 THE RUSH — the actual mini-game
  // ============================================================
  const FACES = ['🧑', '👩', '👦', '👧', '🧔', '👵', '👴', '🧑‍🦰', '👩‍🦱', '🙋'];
  let line, tray, coins, combo, bestCombo, servedNow, endAt, spawnAt, nextId, lastTick;

  function unlocked() { return myStands(); }              // the snacks you can make
  const itemOf = id => STANDS.find(x => x.id === id);

  // How long a fan will wait. It gets a little tighter as the rush heats up
  // (but never brutal), and the comedian buys you a LOT of extra room.
  function patienceFor() {
    const base = Math.max(5200, 9000 - servedNow * 250);
    return hasCrew('joker') ? Math.round(base * 1.5) : base;
  }

  // What this fan wants. Early on it's one thing; once you're rolling they
  // start asking for two, then three.
  function makeOrder() {
    const pool = unlocked();
    let n = 1;
    if (servedNow >= 3) n = 1 + (Math.random() < 0.5 ? 1 : 0);
    if (servedNow >= 8) n = 1 + Math.floor(Math.random() * 3);
    n = Math.min(n, 3);
    const order = [];
    for (let i = 0; i < n; i++) order.push(pool[Math.floor(Math.random() * pool.length)].id);
    return order;
  }

  function newCustomer() {
    return {
      key: nextId++,
      face: FACES[Math.floor(Math.random() * FACES.length)],
      order: makeOrder(),
      max: patienceFor(),
      left: patienceFor(),
      going: false,        // true while their little leaving animation plays
    };
  }

  function startRush() {
    mode = 'rush'; clearTimers();
    if ($('food-back')) $('food-back').style.display = 'block';
    line = []; tray = []; coins = 0; combo = 0; bestCombo = 0; servedNow = 0; nextId = 1;
    endAt = Date.now() + RUSH_MS; spawnAt = 0; lastTick = Date.now();
    for (let i = 0; i < 2; i++) line.push(newCustomer());
    startTray();

    const st = stage(); if (!st) return;
    st.innerHTML =
      `<div class="food-counter">
        <div class="food-line" id="food-line"></div>
        <div class="food-tray" id="food-tray"></div>
        <div class="food-tools" id="food-tools"></div>
      </div>`;
    if (hud()) hud().style.display = 'flex';
    paintTools();
    paintLine();
    paintHud();

    // One heartbeat drives the whole rush: patience drains, new fans arrive,
    // the clock runs down. setInterval (not requestAnimationFrame) so it keeps
    // its promise even if the tab slips into the background.
    every(tick, 100);
  }

  // The COOK's perk: the first item of the order is already prepped and waiting
  // on the tray when the fan steps up. He only helps on orders of TWO or more,
  // though — a one-item order has to leave you at least one tap to make, or
  // there'd be nothing for you to do and nothing to ring the sale up.
  function startTray() {
    tray = [];
    if (hasCrew('cook') && line.length && line[0].order.length > 1) tray.push(line[0].order[0]);
  }

  function tick() {
    if (mode !== 'rush') return;
    const now = Date.now();
    if (now >= endAt) { endRush(); return; }

    // How much time REALLY went by since the last beat. We measure it instead
    // of assuming 100 ms, because phones (and browser tabs left in the
    // background) slow timers down — and if we just counted beats, the fans
    // would get hungry in slow motion on a slow phone. The 500 ms cap means a
    // tab that dozed off for a while doesn't wake up and instantly empty
    // everybody's patience bar.
    let dt = now - lastTick; lastTick = now;
    if (dt > 500) dt = 500;

    // Patience drains: the fan at the front is the one being served, so they
    // get impatient fastest; the folks behind tick down at half speed.
    let lostFront = false;
    line.forEach((c, i) => {
      if (c.going) return;
      c.left -= (i === 0 ? dt : dt * 0.5);
      if (c.left <= 0) { c.left = 0; c.going = true; if (i === 0) lostFront = true; }
    });
    const walked = line.filter(c => c.going);
    if (walked.length) {
      line = line.filter(c => !c.going);
      combo = 0;
      if (lostFront) startTray();                 // the order on the tray left with them
      flashNote('😠 walked off!', 'bad');
    }

    // Keep the line topped up to three, one new fan at a time.
    if (line.length < 3 && now >= spawnAt) {
      line.push(newCustomer());
      spawnAt = now + 1200;
      if (line.length === 1) startTray();
    }

    paintLine();
    paintHud();
  }

  // ---- 🖐 the counter buttons ---------------------------------------------
  function paintTools() {
    const el = $('food-tools'); if (!el) return;
    el.innerHTML = unlocked().map(x =>
      `<div class="food-tool" data-item="${x.id}"><span>${x.icon}</span><b>${esc(x.name.split(' ')[0])}</b></div>`
    ).join('');
    el.querySelectorAll('[data-item]').forEach(b => tap(b, () => useTool(b.getAttribute('data-item'))));
  }

  // Tapping a snack: if it's the next thing the front fan asked for, it lands
  // on the tray. If it isn't, the tray just gives a little shake — we never
  // punish a kid for a wrong tap, we only cost them a second.
  function useTool(id) {
    if (mode !== 'rush' || !line.length) return;
    const want = line[0].order;
    // Belt and braces: if the tray is somehow already full, ring it up rather
    // than leaving the poor fan stuck at the counter.
    if (tray.length >= want.length) { serve(); return; }
    if (want[tray.length] === id) {
      tray.push(id);
      paintTray(true);
      if (tray.length === want.length) after(serve, 160);
    } else {
      paintTray(false, true);
    }
  }

  function serve() {
    if (mode !== 'rush' || !line.length) return;
    const c = line.shift();
    let pay = 0;
    c.order.forEach(id => { const it = itemOf(id); if (it) pay += it.pay; });
    combo++; if (combo > bestCombo) bestCombo = combo;
    pay += Math.min(3, Math.floor(combo / 3));        // 🔥 streak tip
    if (hasCrew('cash')) pay += 2;                    // 💁 the cashier's tip
    coins += pay; servedNow++;
    s.served++;
    startTray();
    paintLine(); paintTray(); paintHud();
    flashNote('😄 +' + pay + ' 🪙' + (combo > 2 ? '  🔥' + combo : ''), 'good');
  }

  // ---- 🎨 drawing the rush -------------------------------------------------
  function paintLine() {
    const el = $('food-line'); if (!el) return;
    if (!line.length) { el.innerHTML = `<div class="food-empty">…waiting for the next fan…</div>`; return; }
    el.innerHTML = line.slice(0, 3).map((c, i) => {
      const pct = Math.max(0, Math.round((c.left / c.max) * 100));
      const mood = pct > 55 ? 'ok' : pct > 25 ? 'mid' : 'low';
      const order = c.order.map((id, j) => {
        const it = itemOf(id);
        const done = i === 0 && j < tray.length;
        return `<span class="food-want${done ? ' done' : ''}">${it ? it.icon : '❓'}</span>`;
      }).join('');
      return `<div class="food-cust${i === 0 ? ' front' : ''}">
          <div class="food-face">${c.face}</div>
          <div class="food-bubble">${order}</div>
          <div class="food-pat"><i class="${mood}" style="width:${pct}%"></i></div>
        </div>`;
    }).join('');
  }

  function paintTray(pop, shake) {
    const el = $('food-tray'); if (!el) return;
    const items = tray.map(id => { const it = itemOf(id); return `<span>${it ? it.icon : ''}</span>`; }).join('');
    el.innerHTML = `<div class="food-tray-lab">TRAY</div><div class="food-tray-in">${items || '<i>empty</i>'}</div>`;
    if (shake) { el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); }
    if (pop)   { el.classList.remove('pop');   void el.offsetWidth; el.classList.add('pop'); }
  }

  function paintHud() {
    const h = hud(); if (!h) return;
    const left = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
    h.innerHTML =
      `<span class="food-hud-c">🪙 ${coins}</span>
       <span class="food-hud-f">${combo > 1 ? '🔥 ' + combo + ' in a row' : ''}</span>
       <span class="food-hud-t">⏱ ${left}s</span>`;
  }

  // The little message that pops over the counter when you serve someone (or
  // when a fan gives up). It fades on its own.
  function flashNote(txt, kind) {
    const st = stage(); if (!st) return;
    const n = document.createElement('div');
    n.className = 'food-flash ' + (kind || '');
    n.textContent = txt;
    st.appendChild(n);
    after(() => { if (n.parentNode) n.remove(); }, 900);
  }

  // ---- 🏁 the bell rings ---------------------------------------------------
  function endRush() {
    if (mode !== 'rush') return;
    mode = 'over'; clearTimers();
    if (hud()) hud().style.display = 'none';
    const paid = Math.min(RUSH_CAP, coins);
    const isBest = paid > s.best;
    if (isBest) s.best = paid;
    if (paid > 0) { s.earned += paid; if (window.TDShop) TDShop.earn(paid); }
    save();

    const st = stage(); if (!st) return;
    st.innerHTML =
      `<div class="food-over">
        <div class="food-over-t">🔔 THAT'S THE RUSH!</div>
        <div class="food-over-n">${servedNow} fan${servedNow === 1 ? '' : 's'} served${bestCombo > 2 ? ' · best streak 🔥' + bestCombo : ''}</div>
        <div class="food-over-c">+${paid} 🪙</div>
        ${coins > paid ? `<div class="food-over-cap">(a rush pays up to ${RUSH_CAP} 🪙)</div>` : ''}
        ${isBest ? `<div class="food-over-best">🏆 NEW BEST DAY!</div>` : ''}
        <div class="food-over-btns">
          <div class="ov-btn yes" id="food-again">RUN IT AGAIN</div>
          <div class="ov-btn" id="food-tohub">← CONCESSIONS</div>
        </div>
      </div>`;
    tap($('food-again'), startRush);
    tap($('food-tohub'), showHub);
    if (window.TDShop && TDShop.celebrate && (isBest || paid > 0))
      TDShop.celebrate(stage(), isBest ? '🏆' : '🍿', isBest ? 'NEW BEST!' : '+' + paid + ' 🪙');
  }

  // ---- 🔌 pop-up plumbing --------------------------------------------------
  function gameKeyboard(on) { try { window.game.input.keyboard.enabled = on; } catch (e) {} }
  function open() {
    const m = $('food-modal'); if (!m) return;
    gameKeyboard(false);
    if (s.seenHow) showHub(); else showHow();     // your very first visit = the instructions
    m.style.display = 'flex';
  }
  function close() {
    clearTimers(); mode = null;
    const m = $('food-modal'); if (m) m.style.display = 'none';
    gameKeyboard(true);
  }
  // The ← button: from the rush or the how-to it goes back to the hub.
  function back() { showHub(); }

  function wire() {
    const bind = (id, fn) => { const el = $(id); if (el) el.addEventListener('pointerdown', e => { e.preventDefault(); fn(); }); };
    bind('open-food', open);
    bind('food-close', close);
    bind('food-back', back);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire);
  else wire();

  window.TDFood = {
    open, close, showHub, showHow, gameBonus, salesPerGame,
    owned: () => s.stands.slice(),
    crew:  () => s.staff.slice(),
    _state: () => ({ mode, coins, combo, servedNow, tray: tray ? tray.slice() : [],
                     line: line ? line.map(c => ({ order: c.order.slice(), left: c.left })) : [],
                     best: s.best, served: s.served, stands: s.stands.slice(), staff: s.staff.slice() }),
    _startRush: startRush, _tap: useTool, _end: endRush,   // for verification
  };
})();
