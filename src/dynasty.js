// ============================================================
// TOUCHDOWN FUN — dynasty.js: 📚 DYNASTY MODE
// ------------------------------------------------------------
// A single season is one story. A DYNASTY is the whole book: you keep playing
// season after season, and the years actually mean something.
//
//   • Every time a season finishes, the calendar turns to the next YEAR.
//   • Your players get a birthday. Guys past their prime slowly slip, and at 34
//     they retire — a rookie takes their locker (your own 🙋 created player never
//     retires, because he's you).
//   • Retired players go into your 🎓 HALL OF FAME, so your old stars are
//     remembered forever.
//   • Every season is written into your team HISTORY — the year, your record,
//     and whether you lifted the Max Bowl trophy.
//
// It never runs the games itself — season.js already does that. Dynasty just
// watches for a season to END (via the little snapshot season.js now exposes)
// and turns the page. One guarded line in main.js is all it takes.
// Saves in localStorage 'tdr-dynasty'.
// ============================================================
(function () {
  const T = window.TDStats ? TDStats.shared : null;
  const $ = id => document.getElementById(id);
  const START_YEAR = 2026;

  // ---- Save & load --------------------------------------------------------
  function blank() { return { year: START_YEAR, history: [], hof: [], titles: 0, lastSeen: null }; }
  function load() {
    let s = T ? T.load('dynasty', null) : null;
    if (!s) { try { s = JSON.parse(localStorage.getItem('tdr-dynasty')); } catch (e) {} }
    if (!s || typeof s !== 'object') return blank();
    return {
      year: typeof s.year === 'number' ? s.year : START_YEAR,
      history: Array.isArray(s.history) ? s.history : [],
      hof: Array.isArray(s.hof) ? s.hof : [],
      titles: typeof s.titles === 'number' ? s.titles : 0,
      lastSeen: s.lastSeen || null,
    };
  }
  function save() {
    if (T) T.store('dynasty', state);
    else { try { localStorage.setItem('tdr-dynasty', JSON.stringify(state)); } catch (e) {} }
  }
  let state = load();

  // ---- Turning the page ---------------------------------------------------
  // main.js calls this right after a season game is reported. If that game
  // ENDED the season (champion or eliminated), we write the year into the
  // history book, age everybody, and move to the next year. The `lastSeen` key
  // makes sure one finished season is only ever counted once.
  function check() {
    if (!window.TDSeason || !TDSeason.snapshot) return null;
    const snap = TDSeason.snapshot();
    if (!snap) return null;
    // While a season is still being played, forget any previous "already done"
    // mark — the next finish is a brand-new page to turn.
    if (!snap.over) { if (state.lastSeen) { state.lastSeen = null; save(); } return null; }

    // The mark describes the FINISHED SEASON itself (not the year — the year
    // moves on the moment we advance, which is exactly what broke the first
    // version of this guard and turned the page twice).
    const stamp = [snap.you, snap.phase, snap.w, snap.l, snap.champion].join(':');
    if (state.lastSeen === stamp) return null;      // already turned this page
    state.lastSeen = stamp;

    const entry = { year: state.year, team: snap.you, w: snap.w, l: snap.l, won: !!snap.won };
    state.history.unshift(entry);
    if (state.history.length > 30) state.history.length = 30;   // keep it tidy
    if (snap.won) state.titles++;

    // 🎂 a year passes on the roster — some guys retire into the Hall of Fame
    let retired = [];
    if (window.TDDraft && TDDraft.advanceYear) retired = TDDraft.advanceYear() || [];
    for (const r of retired) state.hof.unshift(Object.assign({ year: state.year }, r));
    if (state.hof.length > 40) state.hof.length = 40;

    state.year++;
    save();

    // a little "welcome to the new year" note once you're back on the menu
    pending = { entry, retired };
    return pending;
  }

  let pending = null;   // shown once, next time you open the dynasty screen

  // ---- The dynasty screen -------------------------------------------------
  function render() {
    const body = $('dyn-body'); if (!body) return;
    const ages = (window.TDDraft && TDDraft.rosterAges) ? TDDraft.rosterAges() : [];
    const oldest = ages.slice().sort((a, b) => b.age - a.age)[0];

    let flash = '';
    if (pending) {
      const r = pending.retired;
      flash = `<div class="dyn-flash">📅 Welcome to ${state.year}!` +
        (r.length ? `<span>${r.length} player${r.length === 1 ? '' : 's'} retired — see the Hall of Fame.</span>`
                  : `<span>The whole squad is back for another run.</span>`) + `</div>`;
      pending = null;
    }

    const rows = state.history.length
      ? state.history.map(h =>
          `<div class="dyn-row${h.won ? ' champ' : ''}">` +
            `<span class="dyn-yr">${h.year}</span>` +
            `<span class="dyn-team">${h.team}</span>` +
            `<span class="dyn-rec">${h.w}–${h.l}</span>` +
            `<span class="dyn-res">${h.won ? '🏆 MAX BOWL' : '—'}</span>` +
          `</div>`).join('')
      : `<div class="dyn-empty">No seasons finished yet — play a full 🏆 SEASON and this book starts writing itself.</div>`;

    const hof = state.hof.length
      ? state.hof.map(p =>
          `<div class="dyn-hof"><span class="dyn-hof-nm">${p.name}</span>` +
          `<span class="dyn-hof-pos">${p.pos}</span>` +
          `<span class="dyn-hof-sub">${p.ovr} OVR · retired ${p.year} at ${p.age}</span></div>`).join('')
      : `<div class="dyn-empty">Nobody has retired yet. Your veterans are still going!</div>`;

    const roster = ages.length
      ? `<div class="dyn-ages">` + ages.map(p =>
          `<div class="dyn-age${p.age >= 32 ? ' old' : ''}${p.custom ? ' mine' : ''}">` +
          `<b>${p.age}</b><span>${p.pos}</span></div>`).join('') + `</div>`
      : '';

    body.innerHTML = flash +
      `<div class="dyn-hero">` +
        `<div class="dyn-year">${state.year}</div>` +
        `<div class="dyn-sub">SEASON ${state.history.length + 1} · ${state.titles} 🏆 ${state.titles === 1 ? 'TITLE' : 'TITLES'}</div>` +
      `</div>` +
      `<div class="dyn-sec">🎂 Your Squad's Ages${oldest ? ` <span>oldest ${oldest.age}</span>` : ''}</div>` +
      roster +
      `<div class="dyn-note">Players retire at 34 — a rookie takes their spot. Your 🙋 created player never retires.</div>` +
      `<div class="dyn-sec">📖 Team History</div><div class="dyn-book">${rows}</div>` +
      `<div class="dyn-sec">🎓 Hall of Fame <span>${state.hof.length}</span></div><div class="dyn-book">${hof}</div>`;
  }

  function open() { state = load(); render(); const el = $('dynasty-modal'); if (el) el.style.display = 'flex'; }
  function closeOverlay() { const el = $('dynasty-modal'); if (el) el.style.display = 'none'; }

  function tap(id, fn) { const el = $(id); if (el) el.addEventListener('pointerdown', e => { e.preventDefault(); fn(); }); }
  function wire() { tap('open-dynasty', open); tap('dynasty-close', closeOverlay); }
  if (document.readyState !== 'loading') wire();
  else document.addEventListener('DOMContentLoaded', wire);

  window.TDDynasty = {
    open, check,
    year: () => state.year,
    titles: () => state.titles,
    history: () => state.history.slice(),
    hof: () => state.hof.slice(),
  };
})();
