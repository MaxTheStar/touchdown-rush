// ============================================================
// TOUCHDOWN RUSH — stats.js: the WORLD TRACKER, player REVIEWS,
// and the DEVELOPER DASHBOARD (the little 📊 tab on the left edge)
// ------------------------------------------------------------
// How can a game with no server know how many people play it?
// We borrow two FREE public helpers:
//
//   1) Abacus (abacus.jasoncameron.dev) — a "hit counter" on the
//      internet. Every time someone taps PLAY, we ask Abacus to
//      add +1 to our counter. Anyone's browser, anywhere on Earth,
//      adds to the SAME number — that's the world total.
//
//   2) api.country.is — tells us which COUNTRY a player is in
//      (just the country, like "US" or "JP" — never their name,
//      never their address, never anything personal). We then
//      bump a per-country counter, so the dashboard can show
//      little flags: 🇺🇸 12 · 🇯🇵 3 · 🇧🇷 1 ...
//
// REVIEWS are saved in the browser's localStorage (the same place
// the game could keep high scores) — so the dashboard shows every
// review written on THIS device, and a world counter tells us how
// many reviews exist across ALL devices. (Storing the actual text
// from every device needs a real database — that's a future level!)
//
// main.js calls exactly two things:
//   TDStats.recordGameStart()  — when someone taps PLAY
//   TDStats.recordGameEnd()    — at the final whistle (this is what
//                                asks for a review after game #2)
// ============================================================
(function () {
  'use strict';

  // ---- The counter service ----------------------------------------------
  // All our counters live under one "namespace" (like a folder name).
  // On your own computer (localhost) we use a separate practice folder,
  // so testing at home never inflates the REAL world numbers.
  const API = 'https://abacus.jasoncameron.dev';
  const DEV = (location.hostname === 'localhost' || location.hostname === '127.0.0.1');
  const NS  = 'touchdown-rush-maxthestar' + (DEV ? '-dev' : '');

  // Counter names:
  //   plays    — total games started, everywhere on Earth
  //   players  — how many different people (devices) have ever played
  //   reviews  — how many reviews have been written, everywhere
  //   geo-XX   — players per country (geo-US, geo-JP, ...)

  // Every officially-assigned 2-letter country code on Earth (ISO 3166).
  // The dashboard checks each one to build the flag list.
  const ALL_COUNTRIES = ('AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW').split(' ');

  // ---- Tiny helpers ------------------------------------------------------
  const $ = id => document.getElementById(id);

  // localStorage can be switched off (private browsing) — never let that
  // crash the game, just quietly do without it.
  function store(key, value) { try { localStorage.setItem('tdr-' + key, JSON.stringify(value)); } catch (e) {} }
  function load(key, fallback) {
    try {
      const raw = localStorage.getItem('tdr-' + key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch (e) { return fallback; }
  }

  // Ask Abacus to add +1 to a counter. "Fire and forget": if the internet
  // is down or the service is asleep, the game just keeps playing.
  function bump(counter) {
    return fetch(`${API}/hit/${NS}/${counter}`).then(r => r.ok).catch(() => false);
  }

  // Read a counter without changing it (0 if it doesn't exist yet).
  function peek(counter) {
    return fetch(`${API}/get/${NS}/${counter}`)
      .then(r => (r.ok ? r.json() : { value: 0 }))
      .then(j => j.value || 0)
      .catch(() => 0);
  }

  // Like peek, but also reports "limited: true" when Abacus says 429 —
  // "whoa, too many questions too fast!" — so the world scan knows to
  // take a breather instead of mistaking it for zero.
  function peekCareful(counter) {
    return fetch(`${API}/get/${NS}/${counter}`)
      .then(r => {
        if (r.status === 429) return { n: 0, limited: true };
        if (!r.ok) return { n: 0 };
        return r.json().then(j => ({ n: j.value || 0 }));
      })
      .catch(() => ({ n: 0 }));
  }

  const sleep = ms => new Promise(res => setTimeout(res, ms));

  // Turn "US" into 🇺🇸 — flag emoji are secretly just the two letters
  // written in a special "regional indicator" alphabet.
  function flagOf(cc) {
    return cc.replace(/./g, ch => String.fromCodePoint(0x1F1E6 + ch.charCodeAt(0) - 65));
  }

  // Turn "US" into "United States" — the browser knows every country name.
  let regionNames = null;
  try { regionNames = new Intl.DisplayNames(['en'], { type: 'region' }); } catch (e) {}
  function nameOf(cc) {
    try { return (regionNames && regionNames.of(cc)) || cc; } catch (e) { return cc; }
  }

  // ---- Which country is THIS player in? ---------------------------------
  // We ask api.country.is once and remember the answer for a week, so we
  // don't pester the service every single game. ipwho.is is the backup.
  function lookupCountry() {
    const saved = load('country', null);
    if (saved && saved.cc && Date.now() - saved.when < 7 * 24 * 3600 * 1000) {
      return Promise.resolve(saved.cc);
    }
    return fetch('https://api.country.is/')
      .then(r => r.json()).then(j => j.country)
      .catch(() => fetch('https://ipwho.is/?fields=country_code')
        .then(r => r.json()).then(j => j.country_code))
      .then(cc => {
        if (cc && /^[A-Z]{2}$/.test(cc)) { store('country', { cc, when: Date.now() }); return cc; }
        return null;
      })
      .catch(() => null);
  }

  // ---- RECORD: someone tapped PLAY --------------------------------------
  function recordGameStart() {
    bump('plays');   // +1 game, worldwide

    // The FIRST game ever on this device also counts a new PLAYER (and puts
    // their country on the map). The flags only get set after the counter
    // really answered, so a dropped connection just retries next game.
    if (!load('counted-player', false)) {
      bump('players').then(ok => { if (ok) store('counted-player', true); });
    }
    if (!load('counted-geo', false)) {
      lookupCountry().then(cc => {
        if (cc) bump('geo-' + cc).then(ok => { if (ok) store('counted-geo', true); });
      });
    }
  }

  // ---- RECORD: the final whistle ----------------------------------------
  // Counts finished games on this device — and after the SECOND finished
  // game (a real player now, not a passer-by!) politely asks for a review.
  function recordGameEnd() {
    const games = load('games', 0) + 1;
    store('games', games);
    if (games >= 2 && !load('review-asked', false)) {
      // Let the FINAL screen have its moment first, then ask.
      setTimeout(() => openReview(1), 1600);
    }
  }

  // ============================================================
  // THE REVIEW — a 3-step conversation, gentle on purpose:
  //   step 1  "Would you like to do a review?"  YES / NO
  //   step 2  "Are you sure?"                   YES / NO  (mis-tap guard)
  //   step 3  stars + write your review         SEND / CANCEL
  // Saying NO anywhere closes it — and we never auto-ask again.
  // ============================================================
  let chosenStars = 0;

  // While you're TYPING a review, the game must not listen to the keyboard —
  // otherwise pressing SPACE in a sentence would hike the ball / restart the
  // game behind the pop-up (true story: it happened in testing).
  function gameKeyboard(on) {
    try { window.game.input.keyboard.enabled = on; } catch (e) {}
  }

  function openReview(step) {
    store('review-asked', true);          // ask once, never nag
    gameKeyboard(false);
    $('review-modal').style.display = 'flex';
    showStep(step);
  }

  function showStep(n) {
    for (let i = 1; i <= 4; i++) $('rv-step' + i).style.display = (i === n) ? 'block' : 'none';
    if (n === 3) { chosenStars = 0; paintStars(); $('rv-text').value = ''; }
  }

  function closeReview() {
    $('review-modal').style.display = 'none';
    gameKeyboard(true);                   // give the keys back to the game
  }

  function paintStars() {
    const spans = $('rv-stars').children;
    for (let i = 0; i < spans.length; i++) spans[i].textContent = (i < chosenStars) ? '★' : '☆';
  }

  function sendReview() {
    const text = $('rv-text').value.trim();
    if (!text && !chosenStars) { closeReview(); return; }   // empty = never mind
    const reviews = load('reviews', []);
    reviews.unshift({ stars: chosenStars, text: text.slice(0, 280), when: Date.now() });
    store('reviews', reviews);
    bump('reviews');                       // +1 on the world review counter
    showStep(4);                           // "THANKS!"
    setTimeout(closeReview, 1600);
    if (dashOpen) renderReviews();         // dashboard updates live
  }

  // ============================================================
  // THE DEVELOPER DASHBOARD — slides out from the 📊 tab.
  // Local numbers appear instantly; world numbers arrive as the
  // counters answer (tap 🔄 to re-ask).
  // ============================================================
  let dashOpen = false;

  function toggleDash(open) {
    dashOpen = (open !== undefined) ? open : !dashOpen;
    $('dash').classList.toggle('open', dashOpen);
    if (dashOpen) { renderReviews(); refreshWorld(); }
  }

  function statTile(big, label) {
    return `<div class="dash-tile"><div class="dash-big">${big}</div><div class="dash-lab">${label}</div></div>`;
  }

  function renderStats(w) {
    $('dash-stats').innerHTML =
      statTile(w ? w.plays   : '…', 'games played<br>worldwide') +
      statTile(w ? w.players : '…', 'players<br>worldwide') +
      statTile(w ? w.reviews : '…', 'reviews<br>worldwide') +
      statTile(load('games', 0),    'games finished<br>on this device');
  }

  function renderCountries(list) {
    if (!list) { $('dash-countries').textContent = 'finding the flags…'; return; }
    if (!list.length) { $('dash-countries').textContent = 'No countries yet — share the link!'; return; }
    $('dash-countries').innerHTML = list.map(c =>
      `<div class="dash-row"><span>${flagOf(c.cc)} ${nameOf(c.cc)}</span><b>${c.n}</b></div>`
    ).join('');
  }

  function renderReviews() {
    const reviews = load('reviews', []);
    $('dash-note').textContent = DEV
      ? '(practice numbers — this is your home computer)'
      : 'Reviews written on this device:';
    if (!reviews.length) { $('dash-reviews').textContent = 'No reviews here yet.'; return; }
    $('dash-reviews').innerHTML = '';
    for (const r of reviews) {
      const div = document.createElement('div');
      div.className = 'dash-review';
      const head = document.createElement('div');
      head.className = 'dash-rev-head';
      head.textContent = ('★'.repeat(r.stars) + '☆'.repeat(5 - r.stars)) + '  ·  ' +
        new Date(r.when).toLocaleDateString();
      const body = document.createElement('div');
      body.textContent = r.text || '(no words — just stars)';   // textContent = safe, plain text
      div.appendChild(head); div.appendChild(body);
      $('dash-reviews').appendChild(div);
    }
  }

  // ---- Asking the world for fresh numbers -------------------------------
  // Abacus only answers about 30 questions in a row before saying "slow
  // down!" (a 429 answer) — and there are 249 countries. So the scan is
  // POLITE: first the important stuff in one quick gulp (the top numbers,
  // your country, countries we've found before, and the most likely ones),
  // then it strolls through the rest of the world one country at a time,
  // pausing for a breather whenever Abacus asks. Found flags pop in live,
  // and get remembered so the next open is instant.
  const POPULAR = ('US CA MX BR GB FR DE ES IT NL SE PL TR IN CN JP KR AU NZ SG PH ID VN ZA').split(' ');

  let refreshing = false;
  let scanStamp = 0;          // bumps every scan — an old scan sees it changed and stops

  function refreshWorld() {
    if (refreshing) return;
    refreshing = true;
    const myScan = ++scanStamp;
    renderStats(null); renderCountries(null);

    Promise.all([peek('plays'), peek('players'), peek('reviews')])
      .then(([plays, players, reviews]) => renderStats({ plays, players, reviews }));

    scanCountries(myScan).finally(() => { if (myScan === scanStamp) refreshing = false; });
  }

  async function scanCountries(myScan) {
    const known = load('known-countries', []);          // flags found on earlier scans
    const mine  = (load('country', {}) || {}).cc;       // this device's own country
    // Check the likeliest countries FIRST (in one quick gulp), then everyone else.
    const first = [...new Set([...known, mine, ...POPULAR].filter(Boolean))].slice(0, 25);
    const rest  = ALL_COUNTRIES.filter(cc => !first.includes(cc));

    const found = [];
    function show(done, total) {
      found.sort((a, b) => b.n - a.n);
      renderCountries(found);
      $('dash-progress').textContent =
        (done < total) ? `🌍 checking the world… ${done} of ${total} countries` : '';
    }

    const quick = await Promise.all(first.map(cc => peekCareful('geo-' + cc)));
    const queue = [...rest];
    quick.forEach((r, i) => {
      if (r.n > 0) found.push({ cc: first[i], n: r.n });
      else if (r.limited) queue.push(first[i]);          // "slow down" ≠ zero — ask again later
    });
    const total = first.length + queue.length;
    show(first.length, total);

    let done = first.length;
    while (queue.length) {
      if (myScan !== scanStamp || !dashOpen) return;     // panel closed / new scan → stop quietly
      const cc = queue.shift();
      const r = await peekCareful('geo-' + cc);
      if (r.limited) { queue.unshift(cc); await sleep(21000); continue; }   // breather, then retry
      if (r.n > 0) found.push({ cc, n: r.n });
      show(++done, total);
      await sleep(500);                                  // stroll, don't sprint
    }
    store('known-countries', found.map(c => c.cc));      // remember for next time
  }

  // ---- Wire up all the buttons (pointerdown = instant, like the D-pad) ---
  function onTap(id, fn) {
    const el = $(id);
    if (el) el.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); fn(); });
  }

  function wireUp() {
    onTap('dash-tab',     () => toggleDash());
    onTap('dash-close',   () => toggleDash(false));
    onTap('dash-refresh', refreshWorld);
    onTap('dash-add',     () => { openReview(3); });   // write one any time, no questions asked

    onTap('rv1-yes', () => showStep(2));
    onTap('rv1-no',  closeReview);
    onTap('rv2-yes', () => showStep(3));
    onTap('rv2-no',  closeReview);
    onTap('rv-send', sendReview);
    onTap('rv-cancel', closeReview);

    // The five stars — tap the 3rd star = a 3-star review.
    const stars = $('rv-stars');
    for (let i = 1; i <= 5; i++) {
      const s = document.createElement('span');
      s.textContent = '☆';
      s.addEventListener('pointerdown', e => { e.preventDefault(); chosenStars = i; paintStars(); });
      stars.appendChild(s);
    }

    // The textarea needs a real tap-to-type (the game blocks most touches).
    const ta = $('rv-text');
    if (ta) ta.addEventListener('pointerdown', e => e.stopPropagation());
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wireUp);
  else wireUp();

  // What main.js (and DevTools) can call:
  window.TDStats = { recordGameStart, recordGameEnd, openReview, toggleDash, refreshWorld };
})();
