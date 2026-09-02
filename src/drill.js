// ============================================================
// TOUCHDOWN FUN — drill.js: ⏱️ THE TWO-MINUTE DRILL (Round 9, pick ⑥)
// ------------------------------------------------------------
// The clock says 2:00. You are four points down. The ball is on your own 20,
// it's first down, and you have no timeouts left. Score a touchdown or the
// drill is over. That's the whole thing.
//
// WHY FOUR POINTS, and not three or seven? Because four is the number that
// makes a field goal useless. Three points still leaves you losing 3–4, so
// there is no safe option to fall back on and no way to play for a tie — you
// have to go for the end zone. That one number is what turns this from
// "another game" into a proper nerve test.
//
// HOW IT ENDS —
//   🏈 You score      → the extra point goes up, you lead, the drill is WON.
//   ⏳ Clock hits 0   → over, however it looked.
//   🙅 You lose the ball (interception, turned over on downs, a punt, or even
//      a made field goal, which just hands the ball back) → over.
// There is only ever ONE possession, so any change of possession is the end.
//
// ------------------------------------------------------------
// THIS ONE REALLY DOES TOUCH THE GAME LOOP
// ------------------------------------------------------------
// Every pick before it on this board was a self-contained file with a hook or
// two. This one cannot be: it has to change how a game STARTS (no kickoff, a
// rigged scoreboard) and how it ENDS (one possession only). So main.js carries
// a handful of small `G.drillGame` guards, and each is written so that with
// the flag off the code does exactly what it always did.
//
// This file owns everything else: the record book, the payout, and the screen.
// It lives under the 🏆 SEASON hub beside the Playoff Tournament, because that
// is where whole-game modes live — no new button on the front screen.
// ============================================================
(function () {
  'use strict';

  // Short name — TDStats.shared adds the "tdr-" (so this is "tdr-drill").
  const KEY = 'drill';
  const $ = id => document.getElementById(id);

  const T = window.TDStats ? TDStats.shared : null;
  const store = (k, v) => { if (T) T.store(k, v); };
  const load  = (k, f) => (T ? T.load(k, f) : f);

  const WIN_COINS  = 60;    // for pulling it off at all
  const FAST_BONUS = 90;    // …plus up to this much for doing it quickly
  const TRY_COINS  = 8;     // a few coins for having a go

  // ---- State --------------------------------------------------------------
  // { tries, wins, streak, bestStreak, bestLeft, last }
  //   bestLeft = the most clock ever left on a WINNING drill, in seconds.
  //              Higher is better: it means you scored faster.
  let s = null;
  function ensure() {
    if (!s) s = load(KEY, null);
    if (!s || typeof s !== 'object') s = {};
    ['tries', 'wins', 'streak', 'bestStreak'].forEach(k => {
      if (typeof s[k] !== 'number' || s[k] < 0) s[k] = 0;
    });
    if (typeof s.bestLeft !== 'number' || s.bestLeft < 0) s.bestLeft = -1;   // -1 = never won
    if (!s.last) s.last = null;
  }
  function save() { store(KEY, s); }

  const clockText = sec => {
    sec = Math.max(0, Math.round(sec));
    const m = Math.floor(sec / 60), r = sec % 60;
    return m + ':' + (r < 10 ? '0' : '') + r;
  };

  // ---- Starting one -------------------------------------------------------
  function start() {
    ensure();
    if (!window.TDGame || !TDGame.startDrillGame) { note('The game is not ready yet.'); return; }
    close();
    if (window.TDSound) TDSound.sting('td');
    const ok = TDGame.startDrillGame();
    if (!ok) { open(); note('Finish what you are doing first, then try again.'); }
  }

  // ---- Ending one (main.js calls this from endGame) -----------------------
  // `left` is whatever was on the game clock when the whistle went.
  function finish(my, opp, left) {
    ensure();
    const won = my > opp;
    s.tries++;
    let coins = TRY_COINS;
    if (won) {
      s.wins++;
      s.streak++;
      if (s.streak > s.bestStreak) s.bestStreak = s.streak;
      // The quicker you scored, the more clock was left, the bigger the bonus.
      const speed = Math.max(0, Math.min(1, (left || 0) / 120));
      coins = WIN_COINS + Math.round(FAST_BONUS * speed);
      if (left > s.bestLeft) s.bestLeft = left;
    } else {
      s.streak = 0;
    }
    s.last = { won: won, my: my, opp: opp, left: Math.max(0, Math.round(left || 0)), coins: coins };
    save();
    if (window.TDShop) TDShop.earn(coins);
  }

  // ---- Drawing ------------------------------------------------------------
  function note(text) {
    const el = $('drill-msg');
    if (!el) return;
    el.textContent = text;
    el.style.display = 'block';
    clearTimeout(note._t);
    note._t = setTimeout(() => { if (el) el.style.display = 'none'; }, 3200);
  }

  function render() {
    ensure();
    const body = $('drill-body');
    if (!body) return;

    const pct = s.tries ? Math.round(s.wins / s.tries * 100) : 0;

    const lastHtml = !s.last
      ? '<div class="dl-empty">You have not tried one yet. Two minutes, four points down — good luck.</div>'
      : '<div class="dl-last ' + (s.last.won ? 'won' : 'lost') + '">' +
          '<span class="dl-lIc">' + (s.last.won ? '🏈' : '⏳') + '</span>' +
          '<span class="dl-lMid">' +
            '<b>' + (s.last.won ? 'DRILL COMPLETE' : 'CAME UP SHORT') + '</b>' +
            '<i>' + s.last.my + '–' + s.last.opp +
              (s.last.won ? ' with ' + clockText(s.last.left) + ' still on the clock' : ' — no touchdown') +
            '</i>' +
          '</span>' +
          '<b class="dl-lCoins">+' + s.last.coins + ' 🪙</b>' +
        '</div>';

    body.innerHTML =
      '<div class="dl-rules">' +
        '<div class="dl-rule"><span>⏱</span> 2:00 on the clock</div>' +
        '<div class="dl-rule"><span>📉</span> Four points down</div>' +
        '<div class="dl-rule"><span>📍</span> Your own 20, 1st down</div>' +
        '<div class="dl-rule"><span>🚫</span> No timeouts</div>' +
      '</div>' +
      '<div class="dl-why">Four points down is the whole point — a field goal cannot save you. ' +
        'Only a touchdown wins this.</div>' +

      '<div class="dl-sec">YOUR RECORD</div>' +
      '<div class="dl-stats">' +
        '<div class="dl-stat"><b>' + s.wins + '/' + s.tries + '</b><span>completed</span></div>' +
        '<div class="dl-stat"><b>' + pct + '%</b><span>success</span></div>' +
        '<div class="dl-stat"><b>' + (s.bestLeft >= 0 ? clockText(s.bestLeft) : '—') + '</b><span>fastest</span></div>' +
        '<div class="dl-stat"><b>' + s.bestStreak + '</b><span>best run</span></div>' +
      '</div>' +
      (s.streak > 1 ? '<div class="dl-streak">🔥 ' + s.streak + ' in a row right now</div>' : '') +

      '<div class="dl-sec">LAST ATTEMPT</div>' +
      lastHtml;
  }

  function open()  { ensure(); const m = $('drill-modal'); if (m) { m.style.display = 'flex'; render(); } }
  function close() { const m = $('drill-modal'); if (m) m.style.display = 'none'; }

  // ---- Wire up ------------------------------------------------------------
  function onTap(id, fn) {
    const el = $(id);
    if (el) el.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); fn(); });
  }

  function wireUp() {
    ensure();
    onTap('open-drill', open);
    onTap('drill-close', close);
    onTap('drill-play', start);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wireUp);
  else wireUp();

  window.TDDrill = {
    open, close, render, start, finish,
    record: () => (ensure(), { tries: s.tries, wins: s.wins, bestLeft: s.bestLeft, streak: s.streak }),
    _state: () => s,
  };
})();
