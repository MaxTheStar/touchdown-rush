// ============================================================
// TOUCHDOWN FUN — allstar.js: 🌟 THE ALL-STAR GAME (Round 10, pick ⑥)
// ------------------------------------------------------------
// Once a year the best players in the league line up together — and if you've
// built a good enough squad, some of YOURS are on that list.
//
// WHO MAKES IT is read straight off your roster's ratings, so it rewards the
// team you actually built rather than handing out invitations. The bar rises
// as your team level climbs, so "making the All-Star team" keeps meaning
// something instead of becoming automatic the moment you draft one good player.
//
// THE GAME ITSELF is your team against 🌟 THE ALL-STARS — a 9/9 squad of the
// league's best, strong but a notch below 👑 Maxwell, because this is a
// showcase and not a boss fight. Win it and you lift the All-Star trophy, your
// selected players come home with a little extra 🌱 growth XP, and it goes on
// your record. Lose and nothing bad happens at all — that's the point of an
// exhibition.
//
// ⚠️ IT IS A SHOWCASE, SO IT COUNTS FOR NOTHING ELSE. main.js flags the game
// with G.allStarGame, and that flag switches OFF the 🏅 ranked ladder, the
// 🔥 win streak and 🎲 house rules for the duration. You can't farm the ladder
// with it, and you can't win the trophy with a giant ball — so the trophy
// always means you really did beat them.
//
// HOW IT KNOWS THE GAME ENDED — it wraps TDGameStats.finish (the same trick
// 🏥 injuries.js uses) instead of adding another line to endGame. The wrapper
// runs AFTER the original, so everything else has already had its turn.
//
// Saved in `tdr-allstar` = { played, won, best, selections, pending }.
// Opened from the 🏆 Trophy Case.
// ============================================================
(function () {
  'use strict';

  const T = window.TDStats ? TDStats.shared : null;
  const store = (k, v) => { if (T) T.store(k, v); };
  const load  = (k, f) => (T ? T.load(k, f) : f);
  const $ = id => document.getElementById(id);

  // ---- 💾 your All-Star history ------------------------------------------
  let rec = load('allstar', null);
  if (!rec || typeof rec !== 'object') rec = {};
  if (typeof rec.played !== 'number') rec.played = 0;
  if (typeof rec.won    !== 'number') rec.won    = 0;
  if (typeof rec.best   !== 'number') rec.best   = 0;   // biggest winning margin
  if (typeof rec.selections !== 'number') rec.selections = 0;   // career call-ups
  function save() { store('allstar', rec); }

  // ---- ⭐ who makes the team ----------------------------------------------
  // The bar starts at 68 and creeps up with your team level, so an All-Star
  // call-up stays an achievement instead of becoming automatic. It never goes
  // above 82, because at some point every good team should have someone there.
  function bar() {
    const lvl = window.TDProgress ? TDProgress.level() : 1;
    return Math.min(82, 66 + lvl * 2);
  }
  function squad() {
    return (window.TDDraft && TDDraft.squad) ? TDDraft.squad() : [];
  }
  function selected() {
    const cut = bar();
    return squad().filter(p => p.ovr >= cut).sort((a, b) => b.ovr - a.ovr);
  }
  // You need at least one man on the team to have a game to play.
  function eligible() { return selected().length > 0; }

  // ---- ▶ playing it -------------------------------------------------------
  let pending = null;         // who was selected when the game kicked off

  function play() {
    if (!eligible()) return false;
    const who = selected();
    pending = who.map(p => p.idx);
    close();
    const abbr = (window.TDGame && TDGame.currentMenuTeamAbbr) ? TDGame.currentMenuTeamAbbr() : null;
    if (abbr && window.TDGame && TDGame.startAllStarGame) {
      TDGame.startAllStarGame(abbr);
      return true;
    }
    pending = null;
    return false;
  }

  // Called (through the TDGameStats wrapper below) when a game finishes.
  function finish(my, opp) {
    if (!pending) return null;
    const who = pending; pending = null;
    const won = my > opp;
    rec.played++;
    rec.selections += who.length;
    if (won) {
      rec.won++;
      if (my - opp > rec.best) rec.best = my - opp;
      // 🌱 the men who played come home a bit better — through draft.js's own
      // growth system, so there is still only ONE place a rating ever moves.
      if (window.TDDraft && TDDraft.grantXp) for (const idx of who) TDDraft.grantXp(idx, 22);
      if (window.TDShop) {
        TDShop.earn(30);
        if (TDShop.celebrate) TDShop.celebrate(null, '🌟', 'ALL-STAR CHAMPIONS!');
      }
    } else if (window.TDShop) {
      TDShop.earn(10);          // you turned up and played; that's worth something
    }
    save();
    return { won: won, count: who.length };
  }

  // ---- 🖼 the screen ------------------------------------------------------
  function render() {
    const box = $('allstar-body'); if (!box) return;
    const who = selected();
    const cut = bar();
    const all = squad();
    const nearly = all.filter(p => p.ovr < cut).sort((a, b) => b.ovr - a.ovr)[0];

    const list = who.length
      ? who.map(p => `<div class="as-row">
            <div class="as-ic">${p.emoji}</div>
            <div class="as-tx"><div class="as-nm">${p.name}</div>
              <div class="as-bl">${p.pos} &middot; ${p.side === 'off' ? 'Offense' : 'Defense'}</div></div>
            <div class="as-ovr">${p.ovr}</div>
          </div>`).join('')
      : `<div class="as-empty">Nobody made the cut this year — you need a player rated
           <b>${cut}</b> or better.${nearly ? ` Your closest is <b>${nearly.name}</b> at
           <b>${nearly.ovr}</b>.` : ''} Train them up and come back!</div>`;

    box.innerHTML =
      `<div class="as-hero">
         <div class="as-hero-ic">🌟</div>
         <div class="as-hero-t">${who.length ? who.length + (who.length === 1 ? ' ALL-STAR' : ' ALL-STARS') : 'NO ALL-STARS YET'}</div>
         <div class="as-hero-s">The bar this year is ${cut} overall</div>
       </div>
       <div class="as-list">${list}</div>
       <div class="as-stats">
         <div class="as-stat"><b>${rec.played}</b><span>Played</span></div>
         <div class="as-stat"><b>${rec.won}</b><span>Won</span></div>
         <div class="as-stat"><b>${rec.selections}</b><span>Call-ups</span></div>
       </div>
       <div class="as-note">Your squad vs 🌟 THE ALL-STARS, the league's best. It's a showcase —
         it never touches your 🏅 ladder or 🔥 streak, and 🎲 house rules are off. Win it and your
         All-Stars come home better.</div>`;

    const go = $('allstar-play');
    if (go) {
      go.style.display = who.length ? '' : 'none';
      go.textContent = '▶ PLAY THE ALL-STAR GAME';
    }
  }

  function open()  { render(); const m = $('allstar-modal'); if (m) m.style.display = 'flex'; }
  function close() { const m = $('allstar-modal'); if (m) m.style.display = 'none'; }

  function wire() {
    const tap = (id, fn) => { const el = $(id); if (el) el.addEventListener('pointerdown', e => { e.preventDefault(); fn(); }); };
    tap('open-allstar', open);
    tap('allstar-close', close);
    tap('allstar-play', play);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire);
  else wire();

  // ---- 🔌 hook the end of a game WITHOUT touching main.js -----------------
  // Same trick as 🏥 injuries.js: wrap TDGameStats.finish and run after the
  // original, so every other end-of-game job has already happened. If that
  // module is ever missing this simply never fires, which is safe.
  function hookGameEnd() {
    if (!window.TDGameStats || !TDGameStats.finish || TDGameStats.__allstarWrapped) return;
    const original = TDGameStats.finish;
    TDGameStats.finish = function (ctx) {
      const out = original.apply(this, arguments);
      try { if (pending && ctx) finish(ctx.my || 0, ctx.opp || 0); } catch (e) {}
      return out;
    };
    TDGameStats.__allstarWrapped = true;
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', hookGameEnd);
  else hookGameEnd();

  window.TDAllStar = {
    open, close, play, render,
    selected, bar, eligible,
    record: () => Object.assign({}, rec),
    _pending: () => pending,
    _finish: finish,
    _hook: hookGameEnd,
  };
})();
