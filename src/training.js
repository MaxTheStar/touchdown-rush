// ============================================================
// TOUCHDOWN FUN — training.js: 🏕️ TRAINING CAMP (Round 9, pick ⑤)
// ------------------------------------------------------------
// The whole squad is in camp. Everybody trains — but football doesn't work
// like a video game where all eleven men get better every week. In real
// life one or two lads have a breakthrough after a game and the rest keep
// grinding. That's exactly what this does.
//
// TWO HALVES, ONE SCREEN —
//
//   📋 THE PROGRAMME — what the whole team works on. It decides WHO is in
//      the running to break through: the runners, the catchers, the whole
//      offense, the defense, or everybody. You pick one and the squad
//      trains it until you change your mind.
//
//   🏗️ THE FACILITIES — the camp itself, and you build it up with coins:
//        🏋️ WEIGHT ROOM    how much one session is worth
//        🌱 PRACTICE FIELD how many players break through each game
//        🧊 RECOVERY POOL  the chance a session becomes a BREAKTHROUGH (double)
//        📹 FILM SUITE     a little something for the WHOLE squad, every game
//
// So a brand-new camp improves ONE player a game. A fully built one
// improves three, worth far more each, with the rest of the squad picking
// up film-room XP on the side.
//
// ------------------------------------------------------------
// WHY IT DOESN'T INVENT ITS OWN RATINGS
// ------------------------------------------------------------
// 🌱 Player Growth (v1.37) already lives in draft.js: every player has an
// `ovr`, a `pot` ceiling he can't pass, and `xp` toward his next +1. Camp
// does NOT add a second parallel stat — it hands XP to the growth system
// that's already there, through TDDraft.grantXp(). One place where a
// rating can move, so nothing can ever disagree with anything else.
//
// And because ratings feed TDDraft.boost(), which main.js already reads at
// kickoff, a stronger squad is felt on the field with no new multiplier
// stacked on top of anything.
//
// ------------------------------------------------------------
// HOW IT PLUGS IN
// ------------------------------------------------------------
// One hook: we WRAP TDDraft.addGrowth — the call main.js already makes at
// the final whistle — so ordinary growth happens first and camp runs right
// after it. No main.js edits at all. Delete this file and the game is
// exactly what it was.
// ============================================================
(function () {
  'use strict';

  // Short name — TDStats.shared adds the "tdr-" (so this is "tdr-training").
  const KEY = 'training';
  const $ = id => document.getElementById(id);

  const T = window.TDStats ? TDStats.shared : null;
  const store = (k, v) => { if (T) T.store(k, v); };
  const load  = (k, f) => (T ? T.load(k, f) : f);

  // ---- 📋 The programmes --------------------------------------------------
  // `who` narrows the squad down to the men this programme actually works on.
  const PROGS = [
    { id: 'all',   ic: '⚖️', name: 'ALL-ROUND',
      desc: 'Anybody in the squad can be the one who breaks through.',
      who: sq => sq },
    { id: 'speed', ic: '💨', name: 'SPEED CAMP',
      desc: 'The runners — your running back and both receivers.',
      who: sq => sq.filter(p => p.pos === 'RB' || p.pos === 'WR') },
    { id: 'hands', ic: '🧤', name: 'HANDS CAMP',
      desc: 'The catchers — the receivers and your tight end.',
      who: sq => sq.filter(p => p.pos === 'WR' || p.pos === 'TE') },
    { id: 'off',   ic: '🎯', name: 'OFFENSE CAMP',
      desc: 'The whole offense, quarterback included.',
      who: sq => sq.filter(p => p.side === 'off') },
    { id: 'def',   ic: '🦅', name: 'DEFENSE CAMP',
      desc: 'Your linebacker, corner and safety.',
      who: sq => sq.filter(p => p.side === 'def') },
  ];
  const progById = id => PROGS.find(p => p.id === id) || PROGS[0];

  // ---- 🏗️ The facilities --------------------------------------------------
  // Each one is a short ladder. `effect` is what that level actually does, and
  // `line` is how we say it out loud on the card.
  const FACS = [
    { id: 'gym',   ic: '🏋️', name: 'WEIGHT ROOM', max: 4,
      blurb: 'How much one training session is worth.',
      cost: lv => 120 + lv * 110,
      line: lv => '+' + xpAt(lv) + ' XP per session' },
    { id: 'field', ic: '🌱', name: 'PRACTICE FIELD', max: 2,
      blurb: 'How many players break through each game.',
      cost: lv => 200 + lv * 250,
      line: lv => traineesAt(lv) + (traineesAt(lv) === 1 ? ' player a game' : ' players a game') },
    { id: 'pool',  ic: '🧊', name: 'RECOVERY POOL', max: 4,
      blurb: 'The chance a session becomes a BREAKTHROUGH — double value.',
      cost: lv => 110 + lv * 100,
      line: lv => breakAt(lv) + '% breakthrough chance' },
    { id: 'film',  ic: '📹', name: 'FILM SUITE', max: 4,
      blurb: 'A little something for the whole squad, win or lose.',
      cost: lv => 140 + lv * 120,
      line: lv => (filmAt(lv) ? '+' + filmAt(lv) + ' XP to everyone' : 'nothing yet') },
  ];
  const facById = id => FACS.find(f => f.id === id) || null;

  // The maths for each ladder, kept in one place so the card and the session
  // can never drift apart — the card literally reads these same functions.
  function xpAt(lv)       { return 18 + lv * 7; }        // 18 · 25 · 32 · 39 · 46
  function traineesAt(lv) { return 1 + lv; }             // 1 · 2 · 3
  function breakAt(lv)    { return lv * 12; }            // 0 · 12 · 24 · 36 · 48 (%)
  function filmAt(lv)     { return lv * 4; }             // 0 · 4 · 8 · 12 · 16

  // ---- State --------------------------------------------------------------
  // { prog, fac: {gym,field,pool,film}, sessions, last }
  let s = null;
  function ensure() {
    if (!s) s = load(KEY, null);
    if (!s || typeof s !== 'object') s = {};
    if (!s.prog || !PROGS.some(p => p.id === s.prog)) s.prog = 'all';
    if (!s.fac || typeof s.fac !== 'object') s.fac = {};
    FACS.forEach(f => {
      const v = s.fac[f.id];
      s.fac[f.id] = (typeof v === 'number' && v >= 0) ? Math.min(f.max, Math.floor(v)) : 0;
    });
    if (typeof s.sessions !== 'number') s.sessions = 0;
    if (!s.last) s.last = null;
  }
  function save() { store(KEY, s); }

  const lv = id => (ensure(), s.fac[id] || 0);
  const coins = () => (window.TDShop ? TDShop.coins() : 0);

  // ---- 🏗️ Buying an upgrade ----------------------------------------------
  function upgrade(id) {
    ensure();
    const f = facById(id);
    if (!f) return;
    const cur = lv(id);
    if (cur >= f.max) { msg('That one is fully built.'); return; }
    const price = f.cost(cur);
    if (coins() < price) { msg('You need ' + price + ' 🪙 for that. Play a game or two!'); return; }
    if (window.TDShop && !TDShop.spend(price)) { msg('Not enough coins yet.'); return; }
    s.fac[id] = cur + 1;
    save();
    if (window.TDSound) TDSound.sting('td');
    msg(f.ic + ' ' + f.name + ' upgraded! ' + f.line(cur + 1) + '.');
    render();
  }

  function setProgramme(id) {
    ensure();
    if (!PROGS.some(p => p.id === id)) return;
    s.prog = id;
    save();
    msg(progById(id).ic + ' The squad is now in ' + progById(id).name + '.');
    render();
  }

  // ---- 🏋️ A session, run at the final whistle -----------------------------
  // Everyone is in camp, but only `traineesAt()` men actually break through.
  // We prefer players with room left below their ceiling, so sessions never
  // get quietly wasted on somebody who is already maxed out.
  function session(won) {
    ensure();
    if (!window.TDDraft || !TDDraft.squad || !TDDraft.grantXp) return;

    const sq = TDDraft.squad();
    const prog = progById(s.prog);
    let pool = prog.who(sq).filter(p => p.ovr < p.pot);
    // If everyone in this programme is maxed, let the rest of the squad train
    // instead — a full camp should never do literally nothing.
    if (!pool.length) pool = sq.filter(p => p.ovr < p.pot);

    const results = [];
    const want = traineesAt(lv('field'));
    const chance = breakAt(lv('pool')) / 100;
    const base = xpAt(lv('gym')) + (won ? 6 : 0);   // a win is worth a little more

    for (let i = 0; i < want && pool.length; i++) {
      const pickIdx = Math.floor(Math.random() * pool.length);
      const man = pool.splice(pickIdx, 1)[0];       // splice = nobody trains twice
      const broke = Math.random() < chance;
      const xp = broke ? base * 2 : base;
      const r = TDDraft.grantXp(man.idx, xp);
      if (r) results.push({ name: r.name, pos: r.pos, was: r.was, ovr: r.ovr, up: r.up, xp: xp, broke: broke });
    }

    // 📹 The film suite: a small top-up for everybody who still has room.
    const film = filmAt(lv('film'));
    let filmUps = 0;
    if (film) {
      sq.forEach(p => {
        if (p.ovr >= p.pot) return;
        const r = TDDraft.grantXp(p.idx, film);
        if (r && r.up) filmUps += r.up;
      });
    }

    s.sessions++;
    s.last = { prog: prog.id, results: results, film: film, filmUps: filmUps, won: !!won };
    save();
  }

  // ---- Drawing ------------------------------------------------------------
  function msg(text) {
    const el = $('train-msg');
    if (!el) return;
    el.textContent = text;
    el.style.display = 'block';
    clearTimeout(msg._t);
    msg._t = setTimeout(() => { if (el) el.style.display = 'none'; }, 3400);
  }

  function render() {
    ensure();
    const body = $('train-body');
    if (!body) return;

    const cur = progById(s.prog);

    // --- what happened after the last game ---
    let lastHtml;
    if (!s.last) {
      lastHtml = '<div class="tr-empty">Play a game and camp gets to work.</div>';
    } else if (!s.last.results.length && !s.last.filmUps) {
      lastHtml = '<div class="tr-empty">Everybody trained, nobody broke through this time. It happens.</div>';
    } else {
      lastHtml = s.last.results.map(r =>
        '<div class="tr-whoRow">' +
          '<span class="tr-whoName">' + (r.broke ? '⚡ ' : '') + r.name + '</span>' +
          '<span class="tr-whoPos">' + r.pos + '</span>' +
          (r.up
            ? '<b class="tr-up">' + r.was + ' → ' + r.ovr + '</b>'
            : '<b class="tr-xp">+' + r.xp + ' XP</b>') +
        '</div>').join('') +
        (s.last.film
          ? '<div class="tr-film">📹 Film suite: +' + s.last.film + ' XP to the whole squad' +
            (s.last.filmUps ? ' — ' + s.last.filmUps + ' rating' + (s.last.filmUps > 1 ? 's' : '') + ' up' : '') +
            '</div>'
          : '');
    }

    // --- the programme picker ---
    const progHtml = PROGS.map(p =>
      '<div class="tr-prog' + (p.id === s.prog ? ' on' : '') + '" data-prog="' + p.id + '">' +
        '<span class="tr-pIc">' + p.ic + '</span>' +
        '<span class="tr-pMid"><b>' + p.name + '</b><i>' + p.desc + '</i></span>' +
        (p.id === s.prog ? '<span class="tr-pOn">IN CAMP</span>' : '') +
      '</div>').join('');

    // --- the facilities ---
    const facHtml = FACS.map(f => {
      const at = lv(f.id);
      const maxed = at >= f.max;
      const price = maxed ? 0 : f.cost(at);
      const afford = coins() >= price;
      const pips = Array.from({ length: f.max }, (_, i) =>
        '<i class="' + (i < at ? 'on' : '') + '"></i>').join('');
      return '<div class="tr-fac">' +
        '<div class="tr-fTop">' +
          '<span class="tr-fIc">' + f.ic + '</span>' +
          '<span class="tr-fName">' + f.name + '</span>' +
          '<span class="tr-pips">' + pips + '</span>' +
        '</div>' +
        '<div class="tr-fBlurb">' + f.blurb + '</div>' +
        '<div class="tr-fNow">Now: <b>' + f.line(at) + '</b>' +
          (maxed ? '' : ' <span class="tr-fNext">→ ' + f.line(at + 1) + '</span>') + '</div>' +
        (maxed
          ? '<div class="tr-buy done">FULLY BUILT</div>'
          : '<div class="tr-buy' + (afford ? '' : ' cant') + '" data-fac="' + f.id + '">UPGRADE · ' + price + ' 🪙</div>') +
      '</div>';
    }).join('');

    body.innerHTML =
      '<div class="tr-coins">🪙 ' + coins() + ' coins · ' + s.sessions + ' sessions run</div>' +

      '<div class="tr-sec">AFTER THE LAST GAME</div>' +
      '<div class="tr-who">' + lastHtml + '</div>' +

      '<div class="tr-sec">📋 THE PROGRAMME — what the squad works on</div>' +
      '<div class="tr-note">Everybody trains. ' +
        '<b>' + traineesAt(lv('field')) + '</b> ' +
        (traineesAt(lv('field')) === 1 ? 'player' : 'players') +
        ' actually break through each game — build the practice field for more.</div>' +
      progHtml +

      '<div class="tr-sec">🏗️ THE FACILITIES — build the camp up</div>' +
      facHtml;

    body.querySelectorAll('[data-prog]').forEach(el => {
      el.addEventListener('pointerdown', e => {
        e.preventDefault(); e.stopPropagation();
        setProgramme(el.getAttribute('data-prog'));
      });
    });
    body.querySelectorAll('[data-fac]').forEach(el => {
      el.addEventListener('pointerdown', e => {
        e.preventDefault(); e.stopPropagation();
        upgrade(el.getAttribute('data-fac'));
      });
    });
  }

  function open()  { ensure(); const m = $('train-modal'); if (m) { m.style.display = 'flex'; render(); } }
  function close() { const m = $('train-modal'); if (m) m.style.display = 'none'; }

  // ---- Wire up ------------------------------------------------------------
  function onTap(id, fn) {
    const el = $(id);
    if (el) el.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); fn(); });
  }

  function wireUp() {
    ensure();
    onTap('open-train', open);
    onTap('train-close', close);

    // The one hook. main.js already calls TDDraft.addGrowth(win) at the final
    // whistle for 🌱 ordinary growth; camp runs immediately after it.
    if (window.TDDraft && !TDDraft.__trainWrapped) {
      const original = TDDraft.addGrowth;
      TDDraft.addGrowth = function (win) {
        const grew = original.apply(TDDraft, arguments);   // everyday growth first
        try { session(!!win); } catch (e) {}               // then camp does its work
        return grew;
      };
      TDDraft.__trainWrapped = true;
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wireUp);
  else wireUp();

  window.TDTrain = {
    open, close, render, session, upgrade, setProgramme,
    level: lv, programme: () => (ensure(), s.prog),
    trainees: () => traineesAt(lv('field')),
    _state: () => s,
  };
})();
