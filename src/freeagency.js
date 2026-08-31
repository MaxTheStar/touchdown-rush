// ============================================================
// TOUCHDOWN FUN — freeagency.js: 💰 FREE AGENCY (Round 8, pick ⑤)
// ------------------------------------------------------------
// The 🏟 DRAFT sells you YOUNG players: they start low and grow every
// game until they hit their potential. Great — but slow.
//
// FREE AGENCY is the other half of running a club: ready-made veterans
// you can buy with coins and slot straight into the team TODAY. They're
// better than anyone you'd draft… but they're finished growing. What you
// pay for is what you get, forever.
//
//   ROOKIE     — cheap-ish, starts low, climbs for weeks
//   FREE AGENT — costs coins, great right now, never improves
//
// That's the whole decision, and it's a real one.
//
// Five veterans are on the market at a time. The list is drawn from the
// date, so it's steady all day and a fresh crop arrives every 3 days —
// no refreshing the page to reroll. Sign one and he's replaced in the
// market immediately (he's gone — you signed him).
//
// The roster itself lives in draft.js, so signing is done by calling
// TDDraft.signFreeAgent(); this file is just the shop window.
// ============================================================
(function () {
  'use strict';

  // Short name — TDStats.shared adds the "tdr-" (so this is "tdr-fa").
  const KEY = 'fa';
  const $ = id => document.getElementById(id);

  const T = window.TDStats ? TDStats.shared : null;
  const store = (k, v) => { if (T) T.store(k, v); };
  const load  = (k, f) => (T ? T.load(k, f) : f);
  const coins = () => (window.TDShop ? TDShop.coins() : 0);

  const MARKET = 5;          // how many veterans are on the board
  const REFRESH_DAYS = 3;    // a fresh crop this often

  const FIRST = ['Duke', 'Rex', 'Cash', 'Vince', 'Otis', 'Bo', 'Hank', 'Moe', 'Gus',
                 'Sly', 'Ace', 'Cole', 'Rocco', 'Dex', 'Bear', 'Chip', 'Marv', 'Ty'];
  const LAST  = ['Steele', 'Vaughn', 'Hollis', 'Barrett', 'Mackey', 'Dune', 'Prince',
                 'Rivers', 'Stone', 'Kane', 'Fox', 'Wolfe', 'Nash', 'Cross', 'Reed'];
  const CLUBS = ['GRAND CITY', 'FROSTBURG', 'LAKESIDE', 'IRONTON', 'BAYVIEW',
                 'SUNSET', 'CENTRAL', 'COASTAL', 'VALLEY', 'NORTHERN'];
  // Little veteran flavour lines — what he's known for.
  const REPS = ['Ten-year pro.', 'Never drops one.', 'Team captain.', 'Hits like a truck.',
                'Ice in his veins.', 'Two-time all-star.', 'Fastest man on the field.',
                'Reads every play.', 'Great in the cold.', 'Loudest guy in the huddle.'];

  const POS_EMOJI = { QB: '🎯', RB: '🏃', WR: '🙌', TE: '🧱', LB: '🛡', CB: '🦅', S: '🚧' };

  // ---- What a veteran costs ----------------------------------------------
  // Steep on purpose: an 85 should feel like a real season's savings, so the
  // free draft always stays worth doing.
  function feeFor(ovr) { return Math.round(40 + Math.pow(Math.max(0, ovr - 60), 1.9) * 2.4); }

  // ---- Which 3-day window are we in? --------------------------------------
  function windowId() {
    const now = new Date();
    const days = Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 86400000);
    return Math.floor(days / REFRESH_DAYS);
  }
  function daysLeft() {
    const now = new Date();
    const days = Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 86400000);
    return REFRESH_DAYS - (days % REFRESH_DAYS);
  }

  // Predictable dice, seeded by the window, so the market is steady.
  function seeded(seed) {
    let s = (seed * 7919 + 13) % 233280;
    return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  }

  function makeVet(rng, slots) {
    const pos = slots[Math.floor(rng() * slots.length)];
    const ovr = 72 + Math.floor(rng() * 17);          // 72–88: better than you'll draft
    return {
      id: 'v' + Math.floor(rng() * 1e9),
      name: FIRST[Math.floor(rng() * FIRST.length)] + ' ' + LAST[Math.floor(rng() * LAST.length)],
      pos, ovr,
      from: CLUBS[Math.floor(rng() * CLUBS.length)],
      rep: REPS[Math.floor(rng() * REPS.length)],
      fee: feeFor(ovr),
    };
  }

  // ---- State: { win, list:[vets], signed:n } -------------------------------
  let s = null;

  function slots() {
    return (window.TDDraft && TDDraft.slots) ? TDDraft.slots() : ['QB','RB','WR','TE','LB','CB','S'];
  }

  function freshMarket(win) {
    const rng = seeded(win);
    const sl = slots();
    const list = [];
    for (let i = 0; i < MARKET; i++) list.push(makeVet(rng, sl));
    return { win, list, signed: (s && s.signed) || 0 };
  }

  function ensure() {
    const w = windowId();
    if (!s) s = load(KEY, null);
    if (!s || s.win !== w || !Array.isArray(s.list)) { s = freshMarket(w); save(); }
  }
  function save() { store(KEY, s); }

  // ---- Signing ------------------------------------------------------------
  function sign(id) {
    ensure();
    const i = s.list.findIndex(v => v.id === id);
    if (i < 0) return;
    const v = s.list[i];

    if (coins() < v.fee) { flash('Not enough coins — you need ' + v.fee + ' 🪙'); return; }
    if (!window.TDDraft || !TDDraft.signFreeAgent) { flash('Roster unavailable.'); return; }

    const res = TDDraft.signFreeAgent(v.pos, v);
    if (!res) { flash('Could not sign him.'); return; }
    if (res.blocked === 'custom') {
      flash("That's your own created star's spot — he keeps it!");
      return;
    }

    if (window.TDShop) TDShop.spend(v.fee);
    s.signed++;
    // He's signed, so he leaves the market — a fresh face takes his place.
    const rng = seeded(windowId() * 977 + s.signed * 31 + i);
    s.list[i] = makeVet(rng, slots());
    save();
    render();
    flash('✍️ SIGNED ' + v.name + ' (' + v.pos + ' ' + v.ovr + ')' +
          (res.replaced ? ' — replaced ' + res.replaced.name + ' (' + res.replaced.ovr + ')' : ''));
  }

  function flash(msg) {
    const el = $('fa-msg');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(flash._t);
    flash._t = setTimeout(() => el.classList.remove('show'), 2600);
  }

  // ---- Drawing ------------------------------------------------------------
  function isOpen() { const m = $('fa-modal'); return m && m.style.display === 'flex'; }

  function render() {
    ensure();
    const list = $('fa-list');
    if (!list) return;
    const money = coins();

    list.innerHTML = s.list.map(v => {
      const mine = (window.TDDraft && TDDraft.currentAt) ? TDDraft.currentAt(v.pos) : null;
      const diff = mine ? v.ovr - mine.ovr : null;
      const better = diff !== null && diff > 0;
      const afford = money >= v.fee;
      const yours = mine
        ? '<span class="fa-mine">your ' + v.pos + ': <b>' + mine.ovr + '</b>' +
          (diff !== null ? ' <span class="' + (better ? 'fa-up' : 'fa-down') + '">' +
            (better ? '▲+' + diff : (diff === 0 ? '=' : '▼' + diff)) + '</span>' : '') +
          (mine.custom ? ' <span class="fa-lock">🙋 your star</span>' : '') + '</span>'
        : '';
      return '<div class="fa-row">' +
        '<div class="fa-top">' +
          '<span class="fa-pos">' + (POS_EMOJI[v.pos] || '') + ' ' + v.pos + '</span>' +
          '<span class="fa-name">' + v.name + '</span>' +
          '<span class="fa-ovr">' + v.ovr + '</span>' +
        '</div>' +
        '<div class="fa-sub">from ' + v.from + ' · ' + v.rep + '</div>' +
        '<div class="fa-bot">' + yours +
          '<span class="fa-sign' + (afford ? '' : ' off') + '" data-fa="' + v.id + '">' +
            (afford ? 'SIGN ' + v.fee + ' 🪙' : v.fee + ' 🪙') + '</span>' +
        '</div>' +
      '</div>';
    }).join('');

    list.querySelectorAll('.fa-sign').forEach(el => {
      el.addEventListener('pointerdown', e => {
        e.preventDefault(); e.stopPropagation();
        if (el.classList.contains('off')) { flash('Not enough coins yet — keep playing!'); return; }
        sign(el.getAttribute('data-fa'));
      });
    });

    const head = $('fa-head');
    if (head) head.textContent = '🪙 ' + money + ' coins · new veterans in ' +
      daysLeft() + (daysLeft() === 1 ? ' day' : ' days');
    const foot = $('fa-foot');
    if (foot) foot.textContent = s.signed > 0
      ? '✍️ Veterans signed: ' + s.signed
      : 'A veteran is great NOW but never grows — a rookie is the opposite.';
  }

  function open()  { ensure(); const m = $('fa-modal'); if (m) { m.style.display = 'flex'; render(); } }
  function close() { const m = $('fa-modal'); if (m) m.style.display = 'none'; }

  // ---- Wire up ------------------------------------------------------------
  function onTap(id, fn) {
    const el = $(id);
    if (el) el.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); fn(); });
  }
  function wireUp() {
    ensure();
    onTap('open-fa', open);
    onTap('fa-close', close);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wireUp);
  else wireUp();

  window.TDFreeAgency = { open, close, render, sign, feeFor, _state: () => s };
})();
