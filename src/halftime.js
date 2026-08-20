// ============================================================
// TOUCHDOWN FUN — halftime.js: 🎉 THE HALFTIME SHOW
// ------------------------------------------------------------
// A quick tap-to-the-beat mini-game that plays at HALFTIME (right when the 2nd
// quarter ends). The marching band strikes up, a big drum pulses on the beat —
// tap along to fire up the crowd and fill the HYPE METER before time runs out.
// The fuller the meter, the better your rating and the more bonus coins you
// take into the second half. Tap ON the beat (while the drum is glowing) for a
// PERFECT and extra hype!
//
//   HOW IT FITS IN — main.js already shows a little TV break at halftime (the
//   score + a silly ad + "tap to continue"). We just pop this show ON TOP of
//   it for a few seconds; when it's done it tucks itself away and the normal
//   break is right there waiting — so the game's halftime flow is untouched.
//   Our overlay covers the field, so taps drive the show (not the game), and
//   we switch the game's keyboard off while it's up so SPACE can't skip ahead.
//
// Nothing to save — it's an in-the-moment mini-game. main.js kicks it off
// through window.TDHalftime.start().
// ============================================================
(function () {
  'use strict';

  const $ = id => document.getElementById(id);

  const DURATION = 6.0;      // seconds of tapping
  const TAP_GAIN = 5;        // hype per ordinary tap
  const PERFECT_GAIN = 11;   // hype per on-the-beat tap
  const BEAT_MS = 500;       // the band's tempo
  const HOT_MS = 175;        // how long the "on the beat" window stays open

  let meter = 0, timeLeft = 0, hot = false, running = false;
  let tickT = 0, beatT = 0, hotT = 0;

  function clearTimers() { clearInterval(tickT); clearInterval(beatT); clearTimeout(hotT); tickT = beatT = hotT = 0; }
  function gameKeyboard(on) { try { window.game.input.keyboard.enabled = on; } catch (e) {} }

  // ---- 🏈 main.js: halftime just started — put on the show ----------------
  function start() {
    const m = $('halftime-modal');
    if (!m || running) return;
    running = true;
    meter = 0; timeLeft = DURATION; hot = false;

    setFill();
    const t = $('ht-timer'); if (t) t.textContent = Math.ceil(timeLeft);
    const r = $('ht-result'); if (r) { r.className = 'ht-result'; r.innerHTML = ''; }
    const tap = $('ht-tap'); if (tap) tap.classList.remove('hidden');

    gameKeyboard(false);           // so SPACE can't skip the break behind us
    m.style.display = 'flex';

    clearTimers();
    tickT = setInterval(onTick, 100);
    beatT = setInterval(onBeat, BEAT_MS);
    onBeat();                      // start on a beat so the first tap can be PERFECT
  }

  function onTick() {
    timeLeft = Math.max(0, timeLeft - 0.1);
    const t = $('ht-timer'); if (t) t.textContent = Math.ceil(timeLeft);
    if (timeLeft <= 0) finish();
  }

  function onBeat() {
    const d = $('ht-drum');
    if (d) { d.classList.remove('beat'); void d.offsetWidth; d.classList.add('beat'); }   // restart the pulse
    hot = true;
    clearTimeout(hotT);
    hotT = setTimeout(() => { hot = false; }, HOT_MS);
  }

  // ---- a tap on the show --------------------------------------------------
  function tap() {
    if (!running) return;
    const perfect = hot;
    meter = Math.min(100, meter + (perfect ? PERFECT_GAIN : TAP_GAIN));
    setFill();
    popFeedback(perfect ? 'PERFECT! +' + PERFECT_GAIN : '+' + TAP_GAIN, perfect);
    if (meter >= 100) finish();    // maxed the crowd out early — great!
  }

  function setFill() {
    const f = $('ht-fill'); if (f) f.style.width = meter + '%';
    const l = $('ht-meter-lab'); if (l) l.textContent = Math.round(meter) + '%';
  }

  // A little "+5 / PERFECT!" that floats up and fades from the tap button.
  function popFeedback(txt, perfect) {
    const host = $('ht-tap'); if (!host) return;
    const el = document.createElement('div');
    el.className = 'ht-pop' + (perfect ? ' perfect' : '');
    el.textContent = txt;
    host.appendChild(el);
    setTimeout(() => el.remove(), 650);
  }

  // ---- the show's over — tally it up --------------------------------------
  function finish() {
    if (!running) return;
    running = false;
    clearTimers();
    const tap = $('ht-tap'); if (tap) tap.classList.add('hidden');

    const pct = Math.round(meter);
    let stars, label;
    if (pct >= 80)      { stars = 3; label = 'SUPERSTAR SHOW!'; }
    else if (pct >= 40) { stars = 2; label = 'Great show!'; }
    else                { stars = 1; label = 'Nice show!'; }
    const coins = 5 + Math.round(pct / 100 * 20);   // 5 … 25
    if (window.TDShop) TDShop.earn(coins);          // lands in this game's payday

    const r = $('ht-result');
    if (r) {
      r.innerHTML =
        `<div class="ht-stars">${'⭐'.repeat(stars)}</div>` +
        `<div class="ht-rlabel">${label}</div>` +
        `<div class="ht-coins">+${coins} 🪙 for the crowd!</div>`;
      r.classList.add('show');
    }
    if (window.TDShop && TDShop.celebrate) TDShop.celebrate($('ht-result') || $('halftime-modal'), '🎉', label);

    setTimeout(end, 2000);   // then tuck away, revealing the break screen to tap through
  }

  // ---- close up: hide us and give the game its keyboard back --------------
  function end() {
    clearTimers();
    running = false;
    const m = $('halftime-modal'); if (m) m.style.display = 'none';
    gameKeyboard(true);
  }

  // Skip: if the show's still going, tally what you've got; otherwise just close.
  function skip() { if (running) finish(); else end(); }

  // ---- wiring -------------------------------------------------------------
  function onTap(id, fn) { const el = $(id); if (el) el.addEventListener('pointerdown', e => { e.preventDefault(); fn(); }); }
  function wire() { onTap('ht-tap', tap); onTap('ht-scene', tap); onTap('ht-skip', skip); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire);
  else wire();

  window.TDHalftime = { start, skip, _state: () => ({ meter, timeLeft, running }) };
})();
