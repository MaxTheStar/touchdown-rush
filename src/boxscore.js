// ============================================================
// TOUCHDOWN FUN — boxscore.js: 📊 THE BOX SCORE
// ------------------------------------------------------------
// On a real broadcast, when the game ends they put up the BOX SCORE — the full
// sheet of numbers for the game you just watched. That's this: the final score,
// your team's totals (yards on the ground, yards through the air, touchdowns,
// field goals, takeaways), and then a row for every one of your players with
// exactly what they did.
//
// It does NO counting of its own — gamestats.js already keeps the book while you
// play (that's the ⭐ Player of the Game feature), so this file just READS
// `TDGameStats.table()` / `teamTotals()` / `game()` and lays them out. That means
// zero new hooks in main.js and no chance of the two disagreeing.
//
// You can open it from the ⭐ Player of the Game card at the final whistle, or
// later from the 🏆 Trophy Case (it remembers the last finished game until the
// next kickoff). Like the other pop-ups it's plain DOM — Phaser is never touched.
// ============================================================
(function () {
  const $ = id => document.getElementById(id);
  const S = () => window.TDGameStats || null;

  // One stat cell: a big number with a little label under it.
  function tile(n, label) {
    return `<div class="bx-tile"><b>${n}</b><span>${label}</span></div>`;
  }

  // One player's line. We only show the columns that make sense for them, so a
  // receiver's row isn't cluttered with passing numbers.
  function playerRow(p) {
    const s = p.stats;
    const bits = [];
    if (p.pos === 'QB') {
      if (s.comp)    bits.push(`<span>${s.comp}</span> comp`);
      if (s.passYds) bits.push(`<span>${s.passYds}</span> pass yds`);
      if (s.passTd)  bits.push(`<span>${s.passTd}</span> pass TD`);
      if (s.fg)      bits.push(`<span>${s.fg}</span> FG${s.longFg ? ` (long ${s.longFg})` : ''}`);
    }
    if (s.rec)      bits.push(`<span>${s.rec}</span> ${s.rec === 1 ? 'catch' : 'catches'}`);
    if (s.recYds)   bits.push(`<span>${s.recYds}</span> rec yds`);
    if (s.rush)     bits.push(`<span>${s.rush}</span> ${s.rush === 1 ? 'carry' : 'carries'}`);
    if (s.rushYds)  bits.push(`<span>${s.rushYds}</span> rush yds`);
    if (s.td)       bits.push(`<span>${s.td}</span> TD`);
    if (s.takeaway) bits.push(`<span>${s.takeaway}</span> ${s.takeaway === 1 ? 'takeaway' : 'takeaways'}`);

    const quiet = bits.length === 0;
    const star = isStar(p) ? '<span class="bx-star">⭐ POTG</span>' : '';
    return `<div class="bx-row${quiet ? ' quiet' : ''}">` +
             `<div class="bx-who"><span class="bx-emoji">${p.emoji}</span>` +
             `<span class="bx-nm">${p.name}</span><span class="bx-pos">${p.pos}</span>${star}</div>` +
             `<div class="bx-line">${quiet ? 'quiet day at the office' : bits.join('&nbsp; · &nbsp;')}</div>` +
           `</div>`;
  }

  // Was this the Player of the Game? (match on name + position — the award
  // stores exactly those, and no two roster slots share both.)
  function isStar(p) {
    const w = S() && S().winner();
    return !!(w && w.name === p.name && w.pos === p.pos);
  }

  function render() {
    const body = $('box-body'); if (!body || !S()) return;
    const g = S().game();

    if (!g) {   // no finished game yet
      body.innerHTML = `<div class="bx-empty">📊<br>No game to show yet!<br>` +
        `<span>Play a game and the full stat sheet lands here the moment it ends.</span></div>`;
      return;
    }

    const t = S().teamTotals();
    const won = g.my > g.opp;
    const rows = S().table();
    const off = rows.filter(r => r.side === 'off').map(playerRow).join('');
    const def = rows.filter(r => r.side === 'def').map(playerRow).join('');

    body.innerHTML =
      // the scoreboard strip
      `<div class="bx-score ${won ? 'win' : 'loss'}">` +
        `<div class="bx-team"><b>${g.myAbbr}</b><span>${g.my}</span></div>` +
        `<div class="bx-dash">—</div>` +
        `<div class="bx-team"><b>${g.oppAbbr}</b><span>${g.opp}</span></div>` +
      `</div>` +
      `<div class="bx-result">${won ? '🏆 YOU WIN' : (g.my === g.opp ? 'TIE GAME' : 'TOUGH ONE')}</div>` +
      // team totals
      `<div class="bx-sec">📈 Team Totals</div>` +
      `<div class="bx-tiles">` +
        tile(t.total, 'total yards') + tile(t.rushYds, 'rushing') + tile(t.recYds, 'receiving') +
        tile(t.td, 'touchdowns') + tile(t.fg, 'field goals') + tile(t.takeaway, 'takeaways') +
      `</div>` +
      // player lines
      `<div class="bx-sec">🏈 Offense</div><div class="bx-rows">${off}</div>` +
      `<div class="bx-sec">🛡 Defense</div><div class="bx-rows">${def}</div>`;
  }

  // ---- Open / close --------------------------------------------------------
  function open() {
    render();
    const mvp = $('mvp-modal'); if (mvp) mvp.style.display = 'none';   // step out of the star card
    const el = $('box-modal'); if (el) el.style.display = 'flex';
    gameKeyboard(false);
  }
  function closeOverlay() {
    const el = $('box-modal'); if (el) el.style.display = 'none';
    gameKeyboard(true);
  }
  function gameKeyboard(on) { try { window.game.input.keyboard.enabled = on; } catch (e) {} }

  function tap(id, fn) { const el = $(id); if (el) el.addEventListener('pointerdown', e => { e.preventDefault(); fn(); }); }
  function wire() {
    tap('open-box', open);        // the ⭐ Player of the Game card
    tap('open-box-trophy', open); // the 🏆 Trophy Case
    tap('box-close', closeOverlay);
  }
  if (document.readyState !== 'loading') wire();
  else document.addEventListener('DOMContentLoaded', wire);

  window.TDBoxScore = { open };
})();
