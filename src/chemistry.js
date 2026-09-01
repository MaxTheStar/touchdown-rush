// ============================================================
// TOUCHDOWN FUN — chemistry.js: 🧑‍🤝‍🧑 TEAM CHEMISTRY (Round 9, pick ④)
// ------------------------------------------------------------
// Every team has a feeling in the room. Win a close one and everybody
// walks in on Monday standing a little taller. Get thrashed and the same
// room goes quiet. This is that feeling, as a number from 0 to 100.
//
// CHEMISTRY is the one "how does the team feel" number in the game, and
// three things move it:
//
//   1. WHAT HAPPENED IN THE GAME — a win lifts it, a loss drops it, a
//      blowout either way counts double, and big plays (touchdowns and
//      takeaways) lift it on their own. Win a nail-biter or climb out of
//      a double-digit hole and the room goes wild.
//   2. WHAT YOU SAID — 📻 the Press Conference already moves a locker-room
//      mood when you answer the reporter. We read that and let it swing
//      chemistry too, so talking your team up genuinely matters.
//   3. TIME — nothing stays extreme forever. Between games chemistry
//      drifts a little back toward the middle, so one bad afternoon never
//      buries you and one great one never coasts forever.
//
// WHAT IT DOES: a hot room plays a touch sharper, a cold one a touch
// sloppier — you run slightly faster and catch slightly better when
// chemistry is high, and slightly worse when it's low.
//
// ⚠️ ON PURPOSE, THE EFFECT IS TINY: ×0.97 … ×1.03 on speed, and about
// two and a half percent either way on catching. Chemistry should COLOUR
// a game, never decide one. A kid who is on a bad run should never feel
// like the game has quietly stopped letting them win — that is the fastest
// way to make someone put a controller down. Big number, small effect.
//
// ------------------------------------------------------------
// HOW IT PLUGS IN (the low-risk pattern, same as 🎓 Coaching Staff)
// ------------------------------------------------------------
// • It listens by WRAPPING TDGameStats.finish — the call main.js already
//   makes at the final whistle. 📻 press.js wraps the same function; the
//   two wraps stack politely because each one guards with its own flag.
// • Its perks fold into shop.js through the exact same little functions
//   the Coaching Staff uses, so with this file deleted the game plays
//   precisely as it did before (×1 and +0).
// • It lives in a modal opened from the 🛍 Pro Shop, next to the Coaching
//   Staff — no new chip on the front screen. (Phones letterbox the Phaser
//   title when the top bar grows; we learned that the hard way in v1.44.)
// ============================================================
(function () {
  'use strict';

  // Short name — TDStats.shared adds the "tdr-" (so this is "tdr-chemistry").
  const KEY = 'chemistry';
  const $ = id => document.getElementById(id);

  const T = window.TDStats ? TDStats.shared : null;
  const store = (k, v) => { if (T) T.store(k, v); };
  const load  = (k, f) => (T ? T.load(k, f) : f);

  const START = 50;          // a brand-new team feels perfectly ordinary
  const DRIFT = 2;           // how far it creeps back to the middle each game
  const CAP   = 16;          // the most one game can move it, up or down

  // ---- State --------------------------------------------------------------
  // { chem, seenPress, games, last: {total, why[]}, best, worst }
  let s = null;
  function ensure() {
    if (!s) s = load(KEY, null);
    if (!s || typeof s.chem !== 'number') {
      s = { chem: START, seenPress: null, games: 0, last: null, best: START, worst: START };
    }
    s.chem = clamp(s.chem);
    if (typeof s.best  !== 'number') s.best  = s.chem;
    if (typeof s.worst !== 'number') s.worst = s.chem;
  }
  function save() { store(KEY, s); }

  const clamp = v => Math.max(0, Math.min(100, v));

  // ---- Reading the press conference ---------------------------------------
  // press.js keeps its own 0–100 mood that only moves when you ANSWER the
  // reporter. We remember what it was the last time we looked, so we can add
  // the CHANGE (and never the same swing twice). The first time we ever look
  // there is nothing to compare against, so we just remember it quietly.
  function pressSwing() {
    if (!window.TDPress || !TDPress.mood) return 0;
    const now = TDPress.mood();
    if (typeof s.seenPress !== 'number') { s.seenPress = now; return 0; }
    const moved = now - s.seenPress;
    s.seenPress = now;
    // Half of what the reporter did — saying the right thing helps, but the
    // scoreboard should always matter more than the microphone.
    return Math.round(moved * 0.5);
  }

  // ---- Working out what a game did to the room ----------------------------
  // Everything here comes from numbers the stat book already counts honestly:
  // the final score, and the team's touchdowns and takeaways.
  function deltaFor(info, tot) {
    const my  = info.my  | 0;
    const opp = info.opp | 0;
    const margin = my - opp;
    const won = margin > 0;
    const why = [];
    const add = (label, n) => { if (n) why.push({ label: label, n: n }); };

    if (won)             add('🏆 A win', 6);
    else if (margin === 0) add('🤝 A tie', 1);
    else                 add('😔 A loss', -5);

    if (won  && margin >= 21) add('💥 A proper hammering', 4);
    if (!won && margin <= -21) add('🧊 Beaten badly', -7);
    if (won  && margin <= 3)   add('😤 Won a nail-biter', 3);
    if (won  && opp === 0)     add('🛡️ A shutout', 3);

    // Big plays lift the room even in a defeat — everybody remembers the
    // 60-yard touchdown, not the punt before it.
    const tds  = (tot && tot.td)       | 0;
    const taws = (tot && tot.takeaway) | 0;
    if (tds  >= 3) add('🏈 ' + tds + ' touchdowns', 3);
    if (taws >= 2) add('🦅 ' + taws + ' takeaways', 3);

    // 😤 A real comeback: achievements.js is the one that watches how far
    // behind you fell, so we ask it. If that file isn't loaded we simply
    // skip this — no crash, just no comeback bonus.
    let hole = 0;
    try { if (window.TDAchieve && TDAchieve.maxBehind) hole = TDAchieve.maxBehind() | 0; } catch (e) {}
    if (won && hole >= 10) add('🔥 Came back from ' + hole + ' down', 5);

    const said = pressSwing();
    if (said) add(said > 0 ? '📻 What you told the press' : '📻 That press conference', said);

    // Drift back toward the middle, so nothing is ever permanent.
    const pull = s.chem > START ? -DRIFT : s.chem < START ? DRIFT : 0;
    if (pull) add('⏳ Settling back to normal', pull);

    let total = why.reduce((sum, w) => sum + w.n, 0);
    total = Math.max(-CAP, Math.min(CAP, total));
    return { total: total, why: why };
  }

  // ---- Called (through the wrap) at the final whistle ---------------------
  function gameEnded(info) {
    ensure();
    const tot = (window.TDGameStats && TDGameStats.teamTotals) ? TDGameStats.teamTotals() : null;
    const d = deltaFor(info || {}, tot);
    s.chem = clamp(s.chem + d.total);
    s.games++;
    s.last = d;
    if (s.chem > s.best)  s.best  = s.chem;
    if (s.chem < s.worst) s.worst = s.chem;
    save();
  }

  // ---- What the rest of the game can ask us -------------------------------
  const value = () => (ensure(), s.chem);

  // The two perks. Both are deliberately gentle, and both read ×1 / +0 when
  // chemistry sits at the ordinary middle — so a fresh save plays exactly
  // like the game did before this file existed.
  const speedMult = () => { ensure(); return 1 + (s.chem - START) / 100 * 0.06; };   // 0.97 … 1.03
  const catchAdd  = () => { ensure(); return (s.chem - START) / 100 * 0.05; };       // −0.025 … +0.025

  // Five words for how the room feels, matching the press conference's ladder.
  function word(c) {
    return c >= 85 ? 'UNBREAKABLE' : c >= 65 ? 'TIGHT'
         : c >= 45 ? 'STEADY'      : c >= 25 ? 'SHAKY' : 'FALLING APART';
  }
  // Green when the room is good, amber when it is ordinary, red when it is not.
  // Without this the words "FALLING APART" render in cheerful green, which reads
  // as a compliment — exactly the wrong feeling.
  function tone(c) { return c >= 65 ? 'hot' : c >= 45 ? 'ok' : 'cold'; }

  function blurb(c) {
    return c >= 85 ? 'Nobody wants to play you right now. The room is flying.'
         : c >= 65 ? 'Everyone knows their job and trusts the man beside them.'
         : c >= 45 ? 'A normal locker room. Win some games and it will lift.'
         : c >= 25 ? 'Heads are dropping. A good result would fix a lot.'
         :           'It has gone quiet in there. Time to give them something.';
  }

  // ---- Drawing ------------------------------------------------------------
  function render() {
    ensure();
    const body = $('chem-body');
    if (!body) return;

    const pct = Math.round(s.chem);
    const sp  = Math.round((speedMult() - 1) * 1000) / 10;      // as a percentage
    const ct  = Math.round(catchAdd() * 1000) / 10;
    const sign = n => (n > 0 ? '+' : '') + n;

    body.innerHTML =
      '<div class="ch-topRow">' +
        '<span class="ch-lab">TEAM CHEMISTRY</span>' +
        '<span class="ch-word ch-t-' + tone(s.chem) + '">' + word(s.chem) + '</span>' +
      '</div>' +
      '<div class="ch-track"><div class="ch-fill ch-f-' + tone(s.chem) + '" style="width:' + pct + '%"></div></div>' +
      '<div class="ch-num">' + pct + ' / 100</div>' +
      '<div class="ch-blurb">' + blurb(s.chem) + '</div>' +

      '<div class="ch-sec">WHAT IT IS DOING RIGHT NOW</div>' +
      '<div class="ch-perks">' +
        '<div class="ch-perk"><span class="ch-pIc">👟</span><span>Run speed</span>' +
          '<b class="' + (sp >= 0 ? 'ch-up' : 'ch-down') + '">' + sign(sp) + '%</b></div>' +
        '<div class="ch-perk"><span class="ch-pIc">🧤</span><span>Catching</span>' +
          '<b class="' + (ct >= 0 ? 'ch-up' : 'ch-down') + '">' + sign(ct) + '%</b></div>' +
      '</div>' +

      (s.last
        ? '<div class="ch-sec">AFTER THE LAST GAME</div>' +
          '<div class="ch-why">' +
            s.last.why.map(w =>
              '<div class="ch-whyRow"><span>' + w.label + '</span>' +
              '<b class="' + (w.n >= 0 ? 'ch-up' : 'ch-down') + '">' + sign(w.n) + '</b></div>').join('') +
            '<div class="ch-whyTot"><span>Total</span><b class="' +
              (s.last.total >= 0 ? 'ch-up' : 'ch-down') + '">' + sign(s.last.total) + '</b></div>' +
          '</div>'
        : '<div class="ch-empty">Play a game and you will see exactly what moved the room.</div>') +

      '<div class="ch-foot">Games together: ' + s.games +
        ' · best ' + Math.round(s.best) + ' · worst ' + Math.round(s.worst) + '</div>';
  }

  function open()  { ensure(); const m = $('chem-modal'); if (m) { m.style.display = 'flex'; render(); } }
  function close() { const m = $('chem-modal'); if (m) m.style.display = 'none'; }

  // ---- Wire up ------------------------------------------------------------
  function onTap(id, fn) {
    const el = $(id);
    if (el) el.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); fn(); });
  }

  function wireUp() {
    ensure();
    onTap('open-chem', open);
    onTap('chem-close', close);

    // One hook, and it is the same final-whistle call 📻 press.js listens to.
    // Each wrapper checks its OWN flag, so both can sit on the function at
    // once and neither stops the other running.
    if (window.TDGameStats && !TDGameStats.__chemWrapped) {
      const original = TDGameStats.finish;
      TDGameStats.finish = function (g) {
        original.apply(TDGameStats, arguments);      // the stat book goes first
        try { gameEnded(g || {}); } catch (e) {}     // then the room reacts
      };
      TDGameStats.__chemWrapped = true;
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wireUp);
  else wireUp();

  window.TDChem = {
    open, close, render, gameEnded,
    value, speedMult, catchAdd, word, tone,
    _state: () => s,
  };
})();
