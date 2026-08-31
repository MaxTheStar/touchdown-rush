// ============================================================
// TOUCHDOWN FUN — press.js: 📻 THE PRESS CONFERENCE (Round 9, pick ②)
// ------------------------------------------------------------
// After every game a reporter is waiting with a question, and for the
// first time in this game what YOU SAY changes what happens next.
//
// Three ways to answer, every time:
//   🎤 PROUD    — big talk. The players love it, the other team reads it
//                 on the wall and comes out angry. High risk, high reward.
//   🤝 HUMBLE   — say the right thing. Safe, steady, nobody gets upset.
//   😤 FIRED UP — call your shot. A big mood swing either way.
//
// Each answer moves the LOCKER ROOM MOOD (0–100) and pays a media fee.
// Big talk also leaves BULLETIN BOARD MATERIAL: your next opponent plays
// angry — but beat them anyway and the payday is doubled.
//
// The mood is deliberately kept public (TDPress.mood()) because 🧑‍🤝‍🧑 Team
// Chemistry, later on this board, is going to read it.
//
// ------------------------------------------------------------
// WHEN IT HAPPENS
// ------------------------------------------------------------
// A conference becomes AVAILABLE at the final whistle — it does not shove
// itself in front of you. (Ambushing a player with a pop-up is exactly
// what we removed from the front screen in v1.57.) The 🏆 Trophy Case
// button grows a red dot when a reporter is waiting.
//
// gamestats.js is handed the final score at the whistle, so we wrap that
// one call to know a game finished and who it was against. main.js is
// untouched, and without this file nothing changes.
// ============================================================
(function () {
  'use strict';

  // Short name — TDStats.shared adds the "tdr-" (so this is "tdr-press").
  const KEY = 'press';
  const $ = id => document.getElementById(id);

  const T = window.TDStats ? TDStats.shared : null;
  const store = (k, v) => { if (T) T.store(k, v); };
  const load  = (k, f) => (T ? T.load(k, f) : f);

  const FEE = { proud: 45, humble: 30, fired: 40 };   // the media pays for your time
  const BULLETIN_WIN = 120;   // for backing up your big talk and beating them anyway

  // ---- The questions ------------------------------------------------------
  // Each is written for a WIN or a LOSS, so the reporter never asks something
  // daft like "great win!" after you've been thrashed.
  const WIN_Qs = [
    'Big win today. What did you make of your team out there?',
    'That result puts everyone on notice. Anything to say to the rest of the league?',
    'You looked in control all game. Was it as easy as it looked?',
  ];
  const LOSS_Qs = [
    'A tough afternoon. What went wrong out there?',
    'That is a hard one to take. Where does the team go from here?',
    'They outplayed you today. What do you say to the supporters?',
  ];

  // The three answers, with what each does.
  function options(won, opp) {
    const them = (opp || 'them').toUpperCase();
    return [
      { id: 'proud',  ic: '🎤', label: 'TALK THEM UP',
        line: won ? 'That was the best team in this league today. Nobody lives with us.'
                  : 'One bad day. We are still the best team in this league.',
        mood: won ? +14 : +6, fee: FEE.proud, bulletin: true,
        note: 'The players stand taller — but ' + them + ' will have that on their wall.' },
      { id: 'humble', ic: '🤝', label: 'STAY HUMBLE',
        line: won ? 'Credit to them, they made it hard. We just did our jobs.'
                  : 'They were better than us today. We will work.',
        mood: won ? +6 : +2, fee: FEE.humble, bulletin: false,
        note: 'Nothing flashy — and nobody gets upset.' },
      { id: 'fired',  ic: '😤', label: 'CALL YOUR SHOT',
        line: won ? 'Same again next week. Write it down.'
                  : 'Next time we play them, it will not be close.',
        mood: won ? +18 : -4, fee: FEE.fired, bulletin: true,
        note: won ? 'The locker room erupts.' : 'Bold, after a loss. The room is not sure.' },
    ];
  }

  // ---- State --------------------------------------------------------------
  // { mood, pending: {won, opp} | null, done: n, bulletin: bool, last: {...} }
  let s = null;
  function ensure() {
    if (!s) s = load(KEY, null);
    if (!s || typeof s.mood !== 'number') s = { mood: 50, pending: null, done: 0, bulletin: false, last: null };
    s.mood = Math.max(0, Math.min(100, s.mood));
  }
  function save() { store(KEY, s); }

  // ---- Called (through the wrap) at the final whistle ---------------------
  function gameEnded(g) {
    ensure();
    const won = (g.my || 0) > (g.opp || 0);
    // Did you just beat a team you'd wound up? That's the reward for the risk.
    if (s.bulletin && won) {
      s.proved = (s.proved || 0) + 1;
      if (window.TDShop) TDShop.earn(BULLETIN_WIN);
      s.lastProved = true;
    } else {
      s.lastProved = false;
    }
    // A new conference is waiting. Whatever you said last time is spent now,
    // so bulletin-board anger only ever lasts the ONE game it was aimed at.
    s.bulletin = false;
    s.pending = { won: won, opp: g.oppName || g.oppAbbr || 'them',
                  q: (won ? WIN_Qs : LOSS_Qs)[Math.floor(Math.random() * WIN_Qs.length)] };
    save();
    paintBadge();
  }

  // ---- Answering ----------------------------------------------------------
  function answer(id) {
    ensure();
    if (!s.pending) return;
    const opt = options(s.pending.won, s.pending.opp).find(o => o.id === id);
    if (!opt) return;
    s.mood = Math.max(0, Math.min(100, s.mood + opt.mood));
    s.bulletin = !!opt.bulletin;
    s.done++;
    s.last = { line: opt.line, note: opt.note, mood: opt.mood, fee: opt.fee, ic: opt.ic };
    s.pending = null;
    if (window.TDShop) TDShop.earn(opt.fee);
    save();
    paintBadge();
    render();
  }

  // ---- What the rest of the game can ask us -------------------------------
  const mood = () => (ensure(), s.mood);
  // 🧑‍🤝‍🧑 Team Chemistry (a later pick) will use this: a hot room plays a touch
  // better, a cold one a touch worse. Kept tiny on purpose — mood should
  // colour a game, never decide it.
  const moodMult = () => { ensure(); return 1 + (s.mood - 50) / 100 * 0.06; };   // 0.97 … 1.03
  // True while your big talk is still on the other team's wall.
  const bulletin = () => (ensure(), !!s.bulletin);
  const waiting  = () => (ensure(), !!s.pending);

  function moodWord(m) {
    return m >= 85 ? 'FLYING'  : m >= 65 ? 'BUZZING'
         : m >= 45 ? 'STEADY'  : m >= 25 ? 'FLAT' : 'ROCK BOTTOM';
  }

  // ---- The little red dot on the Trophy Case button -----------------------
  function paintBadge() {
    const b = $('press-badge');
    if (!b) return;
    const on = waiting();
    b.textContent = on ? '●' : '';
    b.style.display = on ? 'inline' : 'none';
  }

  // ---- Drawing ------------------------------------------------------------
  function render() {
    ensure();
    const body = $('press-body');
    if (!body) return;

    const meter =
      '<div class="pr-moodRow">' +
        '<span class="pr-moodLab">LOCKER ROOM</span>' +
        '<span class="pr-moodWord">' + moodWord(s.mood) + '</span>' +
      '</div>' +
      '<div class="pr-track"><div class="pr-fill" style="width:' + s.mood + '%"></div></div>' +
      (s.bulletin ? '<div class="pr-bulletin">📌 Your next opponent has your words on their wall — they will come out angry.</div>' : '');

    if (!s.pending) {
      body.innerHTML = meter +
        (s.last
          ? '<div class="pr-quote"><span class="pr-ic">' + s.last.ic + '</span>' +
            '<span>“' + s.last.line + '”</span></div>' +
            '<div class="pr-note">' + s.last.note + '</div>' +
            '<div class="pr-paid">Media fee +' + s.last.fee + ' 🪙 · mood ' +
              (s.last.mood >= 0 ? '+' : '') + s.last.mood + '</div>' +
            (s.lastProved ? '<div class="pr-proved">💪 You backed up your talk and beat them — +' +
              BULLETIN_WIN + ' 🪙</div>' : '')
          : '<div class="pr-empty">No reporters right now. Play a game and one will be waiting.</div>') +
        '<div class="pr-count">Conferences given: ' + s.done + '</div>';
      return;
    }

    const opts = options(s.pending.won, s.pending.opp);
    body.innerHTML = meter +
      '<div class="pr-q"><span class="pr-mic">🎙️</span><span>' + s.pending.q + '</span></div>' +
      opts.map(o =>
        '<div class="pr-opt" data-ans="' + o.id + '">' +
          '<div class="pr-optTop"><span class="pr-ic">' + o.ic + '</span>' +
            '<span class="pr-optLab">' + o.label + '</span>' +
            '<span class="pr-fee">+' + o.fee + ' 🪙</span></div>' +
          '<div class="pr-line">“' + o.line + '”</div>' +
          '<div class="pr-effect">' +
            '<span class="' + (o.mood >= 0 ? 'pr-up' : 'pr-down') + '">mood ' +
              (o.mood >= 0 ? '+' : '') + o.mood + '</span>' +
            (o.bulletin ? '<span class="pr-warn">📌 bulletin board</span>' : '') +
          '</div>' +
        '</div>').join('');

    body.querySelectorAll('.pr-opt').forEach(el => {
      el.addEventListener('pointerdown', e => {
        e.preventDefault(); e.stopPropagation();
        answer(el.getAttribute('data-ans'));
      });
    });
  }

  function open()  { ensure(); const m = $('press-modal'); if (m) { m.style.display = 'flex'; render(); } }
  function close() { const m = $('press-modal'); if (m) m.style.display = 'none'; }

  // ---- Wire up ------------------------------------------------------------
  function onTap(id, fn) {
    const el = $(id);
    if (el) el.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); fn(); });
  }

  function wireUp() {
    ensure();
    onTap('open-press', open);
    onTap('press-close', close);
    paintBadge();

    if (window.TDGameStats && !TDGameStats.__pressWrapped) {
      const original = TDGameStats.finish;
      TDGameStats.finish = function (g) {
        original.apply(TDGameStats, arguments);      // stat book (and the paper) first
        try { gameEnded(g || {}); } catch (e) {}     // then a reporter starts waiting
      };
      TDGameStats.__pressWrapped = true;
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wireUp);
  else wireUp();

  window.TDPress = {
    open, close, render, answer, gameEnded,
    mood, moodMult, bulletin, waiting, moodWord,
    _state: () => s,
  };
})();
