// ============================================================
// TOUCHDOWN FUN — injuries.js: 🏥 INJURIES & DEPTH CHART (Round 9, pick ⑦)
// ------------------------------------------------------------
// Up to now your eight starters played every snap of every game forever.
// From here they don't: every so often somebody gets knocked out for a game
// or two, a stand-in comes off the bench, and suddenly your bench matters.
//
// THE BENCH IS NEW. Before this file the squad was exactly eight men and
// nothing else, so the first thing we do is sign four backups — one either
// side of the ball, rated a notch below your starters. They sit there doing
// nothing until the day you need them.
//
// THE DEPTH CHART is the decision. For each of your eight spots you say who
// covers it if that man goes down. Pick someone whose natural position
// matches and he plays at his full rating; pick anyone else and he loses a
// few points for playing out of position. That's the whole game of it:
// four backups, eight spots, so somebody is always covered by the wrong guy.
//
// ------------------------------------------------------------
// "NEEDS CARE SO IT NEVER FEELS UNFAIR" — the board said it, so here are
// the rules I actually built to keep that promise:
//   • NEVER more than one player hurt at a time.
//   • Only ever ONE to THREE games, and you always see the countdown.
//   • It can't happen two games running — there's a guaranteed clear game
//     after every injury, so you're never stuck in a spiral.
//   • It can't happen at all until you've played a few games, so a brand-new
//     player never meets this before they understand the roster.
//   • A stand-in is WORSE, never useless — and there is always somebody, so
//     you can never end up with a hole in the team.
//   • Nobody is ever lost for good. He always comes back.
//
// ------------------------------------------------------------
// HOW IT PLUGS IN
// ------------------------------------------------------------
// It does the simplest possible thing: it REALLY SWAPS the stand-in into the
// roster (TDDraft.swapIn) and swaps the starter back when he's fit. Because
// team strength, the box score, ⭐ Player of the Game, 🌱 growth and 🌟
// nicknames all read that same roster, every one of them shows the man who
// actually played without knowing this file exists.
//
// One hook: we wrap TDGameStats.finish, AFTER the original runs, so the man
// who played the game is the one who gets credit for it in the stat book.
// ============================================================
(function () {
  'use strict';

  // Short name — TDStats.shared adds the "tdr-" (so this is "tdr-injury").
  const KEY = 'injury';
  const $ = id => document.getElementById(id);

  const T = window.TDStats ? TDStats.shared : null;
  const store = (k, v) => { if (T) T.store(k, v); };
  const load  = (k, f) => (T ? T.load(k, f) : f);

  const BENCH_POS   = ['QB', 'WR', 'LB', 'CB'];   // one either side of the ball
  const OUT_OF_POS  = 6;      // rating knocked off for covering the wrong spot
  const BENCH_GAP   = 14;     // the most a backup may fall behind the squad average
  const BENCH_NEAR  = 8;      // …and the closest a freshly signed one starts
  const CHANCE      = 0.20;   // how often someone gets hurt, on an eligible game
  const MIN_GAMES   = 4;      // …and not at all until you've played this many
  const KNOCKS = [
    { what: 'a knock',        min: 1, max: 1 },
    { what: 'a sore ankle',   min: 1, max: 2 },
    { what: 'a tight hamstring', min: 2, max: 3 },
    { what: 'a bruised rib',  min: 1, max: 2 },
    { what: 'a bang on the shoulder', min: 2, max: 3 },
  ];

  const rint = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = list => list[Math.floor(Math.random() * list.length)];

  // ---- State --------------------------------------------------------------
  // { bench:[player], out:null|{slot,pos,name,player,games,what,standIn},
  //   chart:{slotIdx: benchIdx}, cleared:bool, log:[], seen:bool }
  let s = null;

  function ensure() {
    if (!s) s = load(KEY, null);
    if (!s || typeof s !== 'object') s = {};
    if (!Array.isArray(s.bench)) s.bench = [];
    if (!s.chart || typeof s.chart !== 'object') s.chart = {};
    if (typeof s.cleared !== 'boolean') s.cleared = true;   // last game was injury-free
    if (!Array.isArray(s.log)) s.log = [];
    if (s.out && typeof s.out !== 'object') s.out = null;
    tendBench();
  }
  function save() { store(KEY, s); }

  // ---- The bench ----------------------------------------------------------
  // Signed the first time this ever runs, pitched off your CURRENT squad so
  // they're a believable notch below your starters.
  //
  // …AND THEN KEPT IN TOUCH. This is a fairness fix, not a nicety: your
  // starters keep growing (🌱 growth, 🏕️ camp, the draft, free agency), so a
  // bench frozen at the rating it was signed at would drift further behind
  // every week until one injury gutted the team. Instead the backups never
  // fall more than BENCH_GAP below the squad average — they quietly improve
  // with everyone else, while always staying a clear step below. They never
  // go DOWN, so this can only ever help you.
  function tendBench() {
    if (!window.TDDraft || !TDDraft.squad || !TDDraft.makeBenchPlayer) return;
    const sq = TDDraft.squad();
    if (!sq.length) return;
    const avg = Math.round(sq.reduce((n, p) => n + p.ovr, 0) / sq.length);

    if (s.bench.length !== BENCH_POS.length) {
      s.bench = BENCH_POS.map(pos => TDDraft.makeBenchPlayer(pos, avg - BENCH_GAP, avg - BENCH_NEAR));
      save();
      return;
    }
    // Don't judge the average while a stand-in is filling in — he IS one of
    // these men, so it would be measuring the bench against itself.
    if (s.out) return;
    const floor = avg - BENCH_GAP;
    let moved = false;
    s.bench.forEach(b => {
      if (b.ovr < floor) { b.ovr = floor; moved = true; }
    });
    if (moved) save();
  }

  // Which bench man is ALREADY on the field covering an injury? He can't be in
  // two places at once, so he is not available to back anybody else up. Returns
  // -1 when nobody is hurt, which is why this changes nothing in the normal case.
  function busyIdx() { return s.out ? s.out.benchIdx : -1; }

  // Who covers slot `idx`? Your pick from the depth chart, or the best man
  // available if you haven't said. There is ALWAYS somebody.
  function coverFor(idx, slotPos) {
    ensure();
    const busy = busyIdx();
    const chosen = s.chart[idx];
    if (typeof chosen === 'number' && s.bench[chosen] && chosen !== busy) return chosen;
    // Nothing chosen (or your pick is already playing): prefer a natural fit,
    // else simply the best rated man still sitting down.
    let best = -1;
    s.bench.forEach((b, i) => {
      if (i === busy) return;
      const fits = b.pos === slotPos;
      const bestFits = best >= 0 && s.bench[best].pos === slotPos;
      if (best < 0) { best = i; return; }
      if (fits && !bestFits) { best = i; return; }
      if (fits === bestFits && b.ovr > s.bench[best].ovr) best = i;
    });
    return best;
  }

  // ---- The final whistle --------------------------------------------------
  function gameEnded() {
    ensure();

    // 1) Anybody hurt gets a game closer to being fit.
    if (s.out) {
      s.out.games--;
      if (s.out.games <= 0) { heal(); return; }   // fit again — and never two things at once
      save();
      return;
    }

    // 2) A guaranteed clear game after every injury, so this can never spiral.
    if (!s.cleared) { s.cleared = true; save(); return; }

    // 3) Not until the player has some games behind them.
    const played = load('games', 0);
    if (played < MIN_GAMES) return;

    if (Math.random() < CHANCE) hurtSomebody();
  }

  function hurtSomebody() {
    if (!window.TDDraft || !TDDraft.squad || !TDDraft.swapIn) return;
    const sq = TDDraft.squad();
    if (!sq.length) return;
    const man = sq[Math.floor(Math.random() * sq.length)];
    const knock = pick(KNOCKS);
    const games = rint(knock.min, knock.max);

    const benchIdx = coverFor(man.idx, man.pos);
    const standIn = s.bench[benchIdx];
    if (!standIn) return;                       // no bench at all — do nothing

    const drop = (standIn.pos === man.pos) ? 0 : OUT_OF_POS;
    const starter = TDDraft.swapIn(man.idx, standIn, drop);
    if (!starter) return;

    s.out = {
      slot: man.idx, pos: man.pos, name: starter.name, player: starter,
      games: games, what: knock.what, benchIdx: benchIdx,
      standIn: standIn.name, outOfPosition: drop > 0, ovrWas: starter.ovr,
    };
    s.cleared = false;
    s.seen = false;
    s.log.unshift({ name: starter.name, pos: man.pos, what: knock.what,
                    games: games, standIn: standIn.name });
    s.log = s.log.slice(0, 8);
    save();
    paintBadge();
  }

  function heal() {
    if (!s.out || !window.TDDraft || !TDDraft.swapIn) { s.out = null; save(); return; }
    const played = TDDraft.playerAt ? TDDraft.playerAt(s.out.slot) : null;

    // ⚠️ IS OUR STAND-IN STILL IN THAT SPOT? 💰 Free Agency and the 🏈 draft can
    // both replace a starter, and nothing stops you doing it while somebody is
    // hurt. If you have deliberately put a NEW player in this spot, swapping the
    // old starter back over him would silently throw away a signing you paid
    // for. So in that case we simply stand down: the injury is over, the man you
    // chose keeps his place, and the returning player goes to the bench instead.
    const stillOurs = !!(played && played.name === s.out.standIn);

    if (stillOurs) {
      // Whatever the stand-in picked up while he played (🏕️ camp XP, a rating
      // bump) goes back to the bench with him — he earned it out there.
      if (s.bench[s.out.benchIdx]) {
        const b = s.bench[s.out.benchIdx];
        b.xp = played.xp;
        if (played.ovr > b.ovr && !s.out.outOfPosition) b.ovr = played.ovr;
      }
      TDDraft.swapIn(s.out.slot, s.out.player, 0);
      s.back = { name: s.out.name, pos: s.out.pos, benched: false };
    } else {
      // You replaced this spot yourself — your choice wins.
      if (s.bench[s.out.benchIdx]) s.bench[s.out.benchIdx] = s.out.player;
      s.back = { name: s.out.name, pos: s.out.pos, benched: true };
    }

    s.out = null;
    s.seen = false;
    save();
    paintBadge();
  }

  // ---- What the rest of the game can ask us -------------------------------
  const injured = () => (ensure(), s.out ? { name: s.out.name, pos: s.out.pos,
                                             games: s.out.games, what: s.out.what } : null);

  // ---- The little red dot on the 🏟 MY TEAM button ------------------------
  function paintBadge() {
    const b = $('inj-badge');
    if (!b) return;
    const on = !!(s && (s.out || s.back));
    b.textContent = on ? '●' : '';
    b.style.display = on ? 'inline' : 'none';
  }

  // ---- Drawing ------------------------------------------------------------
  function render() {
    ensure();
    const body = $('inj-body');
    if (!body) return;
    const sq = (window.TDDraft && TDDraft.squad) ? TDDraft.squad() : [];

    // --- the news at the top ---
    let head;
    if (s.out) {
      head = '<div class="ij-hurt">' +
        '<div class="ij-hurtTop"><span class="ij-hIc">🏥</span>' +
          '<b>' + s.out.name + '</b><span class="ij-hPos">' + s.out.pos + '</span></div>' +
        '<div class="ij-hWhat">Out with ' + s.out.what + ' — back in <b>' +
          s.out.games + '</b> ' + (s.out.games === 1 ? 'game' : 'games') + '.</div>' +
        '<div class="ij-hCover">' + s.out.standIn + ' is covering' +
          (s.out.outOfPosition ? ' <span class="ij-oop">out of position (−' + OUT_OF_POS + ')</span>' : '') +
        '</div></div>';
    } else if (s.back) {
      head = '<div class="ij-back">💪 <b>' + s.back.name + '</b> (' + s.back.pos + ') is fit again' +
             (s.back.benched
               ? ' — but you signed someone into his spot while he was out, so he goes to the bench.'
               : ' and back in the team.') + '</div>';
    } else {
      head = '<div class="ij-fit">💚 Everybody is fit. Nobody is hurt right now.</div>';
    }

    // --- the depth chart: who covers each spot ---
    const rows = sq.map(p => {
      const isHurtSpot = !!(s.out && s.out.slot === p.idx);
      // The spot that is currently covered says so plainly. Without this it drew
      // the stand-in as his OWN backup, which reads like a bug even though the
      // maths underneath was fine.
      if (isHurtSpot) {
        return '<div class="ij-row hurt">' +
          '<span class="ij-rPos">' + p.pos + '</span>' +
          '<span class="ij-rName">' + p.name + '<i>' + p.ovr + ' OVR</i></span>' +
          '<span class="ij-rArrow">←</span>' +
          '<span class="ij-rCover playing">in for ' + s.out.name +
            '<i>back in ' + s.out.games + (s.out.games === 1 ? ' game' : ' games') + '</i></span>' +
        '</div>';
      }
      const bIdx = coverFor(p.idx, p.pos);
      const b = s.bench[bIdx];
      const chosen = typeof s.chart[p.idx] === 'number';
      const fits = b && b.pos === p.pos;
      return '<div class="ij-row' + (isHurtSpot ? ' hurt' : '') + '" data-slot="' + p.idx + '">' +
        '<span class="ij-rPos">' + p.pos + '</span>' +
        '<span class="ij-rName">' + p.name + '<i>' + p.ovr + ' OVR</i></span>' +
        '<span class="ij-rArrow">←</span>' +
        '<span class="ij-rCover' + (fits ? ' fits' : '') + '">' +
          (b ? b.name + '<i>' + b.pos + ' · ' + b.ovr + (fits ? '' : ' · −' + OUT_OF_POS) + '</i>'
             : '<i>nobody</i>') +
          (chosen ? '' : '<u>auto</u>') +
        '</span>' +
      '</div>';
    }).join('');

    // --- the bench ---
    const busy = busyIdx();
    const bench = s.bench.map((b, i) =>
      '<div class="ij-bench' + (i === busy ? ' playing' : '') + '">' +
      '<span class="ij-bPos">' + b.pos + '</span>' +
      '<span class="ij-bName">' + b.name + (i === busy ? ' <em>· on the field</em>' : '') + '</span>' +
      '<b class="ij-bOvr">' + b.ovr + '</b></div>').join('');

    body.innerHTML =
      head +
      '<div class="ij-sec">📋 DEPTH CHART — tap a row to change who covers it</div>' +
      '<div class="ij-note">A backup at his own position plays at full strength. ' +
        'Anyone else loses ' + OUT_OF_POS + ' points for covering a spot that isn\'t his.</div>' +
      rows +
      '<div class="ij-sec">🪑 THE BENCH</div>' +
      (bench || '<div class="ij-fit">No backups signed yet.</div>') +
      (s.log.length
        ? '<div class="ij-sec">🗒️ THE TREATMENT ROOM</div>' +
          s.log.map(l => '<div class="ij-log">' + l.name + ' (' + l.pos + ') — ' + l.what +
                         ', ' + l.games + (l.games === 1 ? ' game' : ' games') + '</div>').join('')
        : '');

    body.querySelectorAll('[data-slot]').forEach(el => {
      el.addEventListener('pointerdown', e => {
        e.preventDefault(); e.stopPropagation();
        cycleCover(parseInt(el.getAttribute('data-slot'), 10));
      });
    });
  }

  // Tapping a row walks through the bench, then back to "auto".
  function cycleCover(idx) {
    ensure();
    if (!s.bench.length) return;
    if (s.out && s.out.slot === idx) return;   // that spot is already covered
    const cur = s.chart[idx];
    if (typeof cur !== 'number') s.chart[idx] = 0;
    else if (cur + 1 >= s.bench.length) delete s.chart[idx];   // back to auto
    else s.chart[idx] = cur + 1;
    save();
    render();
  }

  // Opening SHOWS the "he's fit again" news; closing is what clears it. Doing it
  // the other way round (as this first did) wiped the news before it was drawn,
  // so you never got told your man was back.
  function open()  {
    ensure(); s.seen = true; save();
    const m = $('inj-modal'); if (m) { m.style.display = 'flex'; render(); }
    paintBadge();
  }
  function close() {
    ensure();
    if (s.back) { s.back = null; save(); paintBadge(); }   // you've read it now
    const m = $('inj-modal'); if (m) m.style.display = 'none';
  }

  // ---- Wire up ------------------------------------------------------------
  function onTap(id, fn) {
    const el = $(id);
    if (el) el.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); fn(); });
  }

  function wireUp() {
    ensure();
    onTap('open-inj', open);
    onTap('inj-close', close);
    paintBadge();

    // One hook, and it runs AFTER the original — so the stat book, the box score
    // and ⭐ Player of the Game all still describe the man who actually played,
    // and only then does anybody get swapped.
    if (window.TDGameStats && !TDGameStats.__injWrapped) {
      const original = TDGameStats.finish;
      TDGameStats.finish = function (g) {
        original.apply(TDGameStats, arguments);
        try { gameEnded(); } catch (e) {}
      };
      TDGameStats.__injWrapped = true;
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wireUp);
  else wireUp();

  window.TDInjury = {
    open, close, render, gameEnded, injured, coverFor,
    bench: () => (ensure(), s.bench.slice()),
    _heal: heal, _hurt: hurtSomebody,
    _state: () => s,
  };
})();
