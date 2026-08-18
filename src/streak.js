// ============================================================
// TOUCHDOWN FUN — streak.js: 🔥 THE STREAK HEATER
// ------------------------------------------------------------
// Win games back-to-back and you catch fire. Every win in a row is worth
// a little MORE coins than the last, and once you're rolling a big fiery
// "ON FIRE" banner flies across the screen. Lose, though, and the flame
// goes cold — your streak drops all the way back to zero. So the longer
// your run gets, the more you want to protect it. That "I can't lose NOW"
// tug is the whole point.
//
//   HOW THE BONUS GROWS — the base game already pays +25 for a win. On top
//   of that we add a streak bonus that climbs each win: ×2 = +5, ×3 = +10,
//   ×4 = +15 … up to a +30 cap. It's paid straight into "coins this game"
//   so it shows up in your payday total on the FINAL screen.
//
//   WHAT YOU SEE — a small 🔥 flame pill on the menu whenever a streak is
//   alive (tap it to make it flare), and a big banner the moment a win
//   extends your streak (or a cold "snapped!" flash when a hot run ends).
//
// We remember two numbers in the usual tdr- store (key `tdr-streak`):
//   cur  = your current win streak      best = your longest ever
// The Record Book (records.js) reads `best` to show your all-time record.
//
// main.js talks to us through window.TDStreak — see the bottom.
// ============================================================
(function () {
  'use strict';

  const T = window.TDStats ? TDStats.shared : null;
  const store = (k, v) => { if (T) T.store(k, v); };
  const load  = (k, f) => (T ? T.load(k, f) : f);
  const $ = id => document.getElementById(id);

  // ---- tuning knobs -------------------------------------------------------
  const BONUS_STEP = 5;    // coins added per streak level
  const BONUS_CAP  = 6;    // bonus stops growing past ×7 (6 steps → +30)
  const WARM_AT    = 3;    // ×3–4 = "heating up"; below this it's just a streak
  const FIRE_AT    = 5;    // ×5+  = full "ON FIRE"

  // ---- what we remember ---------------------------------------------------
  let s = load('streak', null);
  if (!s || typeof s.cur !== 'number') s = { cur: 0, best: 0 };
  function save() { store('streak', s); }

  let last = null;   // details of the most recent result (handy for debugging)

  // A streak of N wins pays this bonus on the Nth win (0 until you've won 2).
  function bonusFor(n) {
    if (n < 2) return 0;
    return Math.min(n - 1, BONUS_CAP) * BONUS_STEP;   // ×2=5, ×3=10 … ×7+=30
  }

  // The little word (and how many flames) for a streak of N.
  function tier(n) {
    if (n >= FIRE_AT) return { flames: '🔥🔥🔥', word: 'ON FIRE' };
    if (n >= WARM_AT) return { flames: '🔥🔥',   word: 'HEATING UP' };
    return { flames: '🔥', word: 'STREAK' };
  }

  // ---- main.js calls this from endGame, with won = true / false ----------
  function recordResult(won) {
    const prev = s.cur;
    let bonus = 0, snapped = false, newBest = false;

    if (won) {
      s.cur = prev + 1;
      if (s.cur > s.best) { s.best = s.cur; if (s.cur >= 2) newBest = true; }
      bonus = bonusFor(s.cur);
      if (bonus > 0 && window.TDShop) TDShop.earn(bonus);   // → "coins this game"
    } else {
      snapped = prev >= WARM_AT;   // only a genuinely hot streak "snaps"
      s.cur = 0;
    }
    save();
    last = { won, cur: s.cur, prev, bonus, best: s.best, newBest, snapped };

    // Fly the banner in a beat after the FINAL screen's "YOU WIN!" lands.
    const worthShowing = (won && s.cur >= 2) || snapped;
    if (worthShowing) {
      clearTimeout(bannerTmr);
      bannerTmr = setTimeout(showResultBanner, 850);
    }
    return last;
  }

  // ---- 🔥 the fiery banner ------------------------------------------------
  let bannerTmr = 0, hideTmr = 0;
  function showResultBanner() {
    if (!last) return;
    if (last.won) {
      const t = tier(last.cur);
      let txt = t.flames + '  ' + t.word + '  ·  ×' + last.cur;
      if (last.bonus > 0) txt += '   +' + last.bonus + ' 🪙';
      if (last.newBest)   txt += '   · NEW BEST!';
      flare(txt, false);
    } else {
      flare('💨 STREAK SNAPPED  ·  ×' + last.prev, true);
    }
  }

  function flare(text, cold) {
    const el = $('streak-fire'); if (!el) return;
    el.textContent = text;
    el.classList.toggle('cold', !!cold);
    el.classList.remove('show');   // restart the animation if one's already up
    void el.offsetWidth;           // reflow so the class re-add re-triggers it
    el.classList.add('show');
    clearTimeout(hideTmr);
    hideTmr = setTimeout(() => el.classList.remove('show'), cold ? 1900 : 2500);
  }

  // ---- 🔥 the menu flame pill --------------------------------------------
  // Shows only while a streak is alive, so the menu stays clean otherwise.
  function onMenu() {
    const pill = $('streak-flame'); if (!pill) return;
    if (s.cur >= 1) {
      pill.innerHTML = '<span class="sf-ic">' + tier(s.cur).flames + '</span>×' + s.cur;
      pill.title = 'Win streak: ' + s.cur + (s.best ? '  ·  best ' + s.best : '');
      pill.classList.add('on');
    } else {
      pill.classList.remove('on');
    }
  }

  // Tap the flame pill just to show off / remind yourself what's at stake.
  function poke() {
    if (s.cur >= 2)      { const t = tier(s.cur); flare(t.flames + '  ' + t.word + '  ·  ×' + s.cur + '   keep it going!', false); }
    else if (s.cur === 1) flare('🔥 ×1   win again to build your streak!', false);
    else if (s.best >= 2) flare('🔥 BEST STREAK  ·  ×' + s.best + '   go beat it!', false);
    else                  flare('🔥 Win 2 in a row to start a streak!', false);
  }

  // Wire the pill tap once the page is parsed (scripts load at end of body,
  // so the element already exists when this runs).
  const pill = $('streak-flame');
  if (pill) pill.addEventListener('click', poke);

  // ---- what the rest of the game may use ----------------------------------
  window.TDStreak = {
    recordResult, onMenu, poke,
    current: () => s.cur,
    best:    () => s.best,
    _last:   () => last,
  };
})();
