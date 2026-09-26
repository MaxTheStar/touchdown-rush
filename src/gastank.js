// ============================================================
// TOUCHDOWN FUN — gastank.js: 😮‍💨 THE GAS TANK (Round 13, pick ⑧ — THE LAST)
// ------------------------------------------------------------
// Nobody runs at full speed for sixty minutes. Break a long one and your legs
// are heavy at the end of it; go no-huddle and you are burning your own team's
// air as well as the clock. Until now your runner was exactly as fast on his
// fortieth carry as his first.
//
// ------------------------------------------------------------
// ⚠️ WHY THIS WAS RANKED LAST, AND THE ONE RULE IT MUST NOT BREAK
// ------------------------------------------------------------
// It touches SPEED, and speed is the thing every other add-on already touches:
// 👟 cleats, 🎡 the spin, ⚡ power-ups, 🎓 the game plan, 🎓 staff, 🧑‍🤝‍🧑 chemistry,
// 🎲 house rules, 🌈 ball skins and ⭐ traits all multiply into it. So this one
// folds in at the same single place they do (`runSpeed` → `TDShop.speedMult`),
// as one more multiplier, instead of inventing a ninth path.
//
// ⚠️ AND IT MUST NEVER FEEL LIKE THE CONTROLS STOPPED WORKING. That is not a
// vague worry — the numbers say exactly how careful to be:
//
//     you run at 205 · a defender CHASING you runs at 194
//
// Your whole margin is ELEVEN pixels a second. A "tired" penalty of 10% would
// put you at 185 and every long run in the game would end with you being reeled
// in from behind, which does not read as tired — it reads as broken. So an
// empty tank costs **6%** (205 → 193), which shaves that eleven-pixel cushion
// down to almost nothing without ever taking it away. Legs get heavy; the
// controls do not stop working.
//
// ------------------------------------------------------------
// HOW IT FILLS AND EMPTIES
// ------------------------------------------------------------
//   · RUNNING with the ball empties it, and only running does. Standing at the
//     line, throwing, watching your receiver — all free.
//   · 💨 A DASH costs a gulp of it, which is the "a breakaway run costs you"
//     part: you can still dash whenever you like, you just cannot dash all day.
//   · THE HUDDLE fills it back up, quickly. You should almost never START a
//     play tired — being tired is something that happens DURING a long run,
//     which is exactly when a real player feels it.
//   · ⏰ THE HURRY-UP fills it at less than half speed, because there is no
//     huddle to breathe in. That is the honest cost the no-huddle never had:
//     it was pure upside before this file.
//   · A TIMEOUT or the end of a quarter fills it completely. That is what a
//     timeout is FOR, and it quietly gives ⏱ the button a third reason to exist.
//
// ⚠️ THE BAR ONLY APPEARS WHEN IT MATTERS (below three quarters full). Most of
// most games it is not on screen at all, which is the same rule ⏳ the play
// clock follows — a HUD row that is always there costs screen space on a phone
// every single down, and this one has something to say on very few of them.
// ============================================================
(function () {
  'use strict';

  const $ = id => document.getElementById(id);
  const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);

  // ---- the dials (every one of them measured against the speeds above) ----
  const FULL        = 100;
  const TIRED_COST  = 0.06;   // an EMPTY tank costs 6%: 205 → 193, against a 194 chase
  const DRAIN_SEC   = 13;     // running flat out empties it in about 7.5 seconds
  const DASH_COST   = 9;      // 💨 one dash — you can spend a few, not a dozen
  const REFILL_SEC  = 26;     // the huddle: a normal gap between plays fills most of it
  const HURRY_MULT  = 0.42;   // ⏰ no huddle, no breather
  const SHOW_AT     = 75;     // the bar appears here…
  const PUFF_AT     = 34;     // …and starts looking worried here
  const MOVING      = 12;     // px/sec: slower than this is standing still, not running
  // ⚠️ A LONG DRIVE HAS TO COST SOMETHING TOO, or the promise is only half kept.
  // The huddle used to refill you to 100 every single time, so tiredness could
  // never last longer than one play — and "legs get heavy on a long drive" was
  // simply not in the game. Now each snap lowers the CEILING the huddle can
  // fill you back up to. Eight plays of a grinding drive and you start the
  // ninth at 68, which is where the bar is already showing.
  const PER_SNAP    = 4;      // each snap of this drive costs 4 off the ceiling…
  const CEIL_FLOOR  = 68;     // …and it never falls below this, ever

  let tank = FULL;
  let ceiling = FULL;         // the most the huddle can give you back on this drive
  let last = 0;               // the clock reading this was last worked out from
  let live = false;           // is the row on screen?
  let lastDash = 0;           // so one dash is charged once, not every frame
  let spent = 0;              // how much has been burned this game (for the tests)
  let wasLive = false;        // for spotting the snap
  let hadBall = null;         // …and for spotting the ball changing hands

  const td = () => window.__td || null;
  const G = () => { const t = td(); return t ? t.G : null; };

  // ============================================================
  // WHAT THE REST OF THE GAME ASKS
  // ============================================================
  // The only thing main.js reads: a multiplier on your runner's top speed.
  // A full tank returns exactly 1, so a fresh play is the game as it always was.
  function speedMult() {
    return 1 - TIRED_COST * (1 - tank / FULL);
  }

  // Is the man I am driving actually running with the ball right now?
  function sprinting() {
    const t = td(), g = G();
    if (!t || !g || !g.ballCarrier) return false;
    if (g.state !== 'live' && g.state !== 'pass') return false;
    const me = g.ballCarrier;
    // ⚠️ Only YOUR men get tired — during their drive the sprites in `offense`
    // are your DEFENDERS, and a defender chasing somebody is not carrying a ball.
    if (t.offense.indexOf(me) < 0) return false;
    const b = me.s.body;
    return !!b && Math.hypot(b.velocity.x, b.velocity.y) > MOVING;
  }

  // ============================================================
  // THE TICK — called from main.js's `updateHUD`, every frame
  // ------------------------------------------------------------
  // ⚠️ IT KEEPS ITS OWN CLOCK, and clamps the step to 120ms. Phaser's delta is
  // not trustworthy across a modal or a sleeping tab — ⏳ the play clock learned
  // that the hard way, and a tank that drains while a menu is open would empty
  // itself between one tool call and the next.
  // ============================================================
  function tick() {
    const g = G();
    if (!g || !g.team) { if (live) show(false); return; }
    const now = Date.now();
    const dt = clamp((now - last) / 1000, 0, 0.12);
    last = now;

    // --- the two things that make a DRIVE tiring, not just a run ------------
    // A snap costs a little off the ceiling…
    const isLive = g.state === 'live' || g.state === 'pass';
    if (isLive && !wasLive) ceiling = Math.max(CEIL_FLOOR, ceiling - PER_SNAP);
    wasLive = isLive;
    // …and the ball changing hands gives your offense a whole rest — they are
    // standing on the sideline while the other team plays.
    const ball = !g.cpu;
    if (hadBall === null) hadBall = ball;
    if (ball !== hadBall) { hadBall = ball; ceiling = FULL; }

    // ⚠️ THERE IS NO "IF WE ARE IN A BREAK, REFILL" CHECK HERE, AND THAT IS
    // DELIBERATE. `updateHUD` does not run while a break screen is up, so such
    // a check gets exactly zero ticks — it looks like a rule and is dead code.
    // main.js calls `timeout()` from `startBreak` and `callTimeout` instead:
    // the rule lives where the rest actually happens.
    if (sprinting()) {
      const burn = DRAIN_SEC * dt;
      tank = clamp(tank - burn, 0, FULL);
      spent += burn;
      // 💨 the dash: one gulp per dash, charged the moment a new one starts.
      if (g.dashUntil && g.dashUntil !== lastDash && g.scene && g.scene.time.now < g.dashUntil) {
        lastDash = g.dashUntil;
        tank = clamp(tank - DASH_COST, 0, FULL);
        spent += DASH_COST;
      }
    } else if (tank < ceiling) {
      // Getting your breath back — at less than half rate in the no-huddle, and
      // only as far as this drive's ceiling.
      const hurry = document.body.classList.contains('hurry') ? HURRY_MULT : 1;
      tank = clamp(tank + REFILL_SEC * hurry * dt, 0, ceiling);
    }
    paint();
  }

  function paint() {
    const row = $('gastank');
    if (!row) return;
    const want = tank < SHOW_AT;
    if (want !== live) show(want);
    if (!want) return;
    const fill = $('gt-fill');
    if (fill) fill.style.width = Math.round(tank) + '%';
    row.classList.toggle('low', tank < PUFF_AT);
  }

  // ⚠️ `style.display = ''` would just hand it back to the stylesheet, which
  // says `none` — the same trap 📈 winprob.js fell into. Set a real value.
  function show(on) {
    const row = $('gastank');
    if (row) row.style.display = on ? 'block' : 'none';
    live = !!on;
  }

  function newGame() {
    tank = FULL; ceiling = FULL; spent = 0; lastDash = 0;
    wasLive = false; hadBall = null; last = Date.now();
    paint();
  }

  // A timeout is a breather — that is the whole point of one, and it buys back
  // the drive's ceiling as well as the tank. That is now ⏱ the button's THIRD
  // job (stop the clock · ⏳ a fresh play clock · this).
  function timeout() { tank = FULL; ceiling = FULL; paint(); }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => show(false));
  else show(false);

  window.TDGas = {
    speedMult, tick, newGame, timeout,
    // for the tests, and for anything that wants to know how tired you are
    level: () => tank,
    ceiling: () => ceiling,
    spent: () => spent,
    sprinting,
    _set: v => { tank = clamp(v, 0, FULL); paint(); },
    consts: () => ({ TIRED_COST, DRAIN_SEC, DASH_COST, REFILL_SEC, HURRY_MULT, SHOW_AT }),
  };
})();
