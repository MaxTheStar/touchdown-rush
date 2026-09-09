// ============================================================
// TOUCHDOWN FUN — poster.js: 📸 THE TEAM POSTER (Round 10, pick ④)
// ------------------------------------------------------------
// Everything you've built — your team, your colours, your record, your best
// players, your trophies, your mascot — drawn as ONE picture you can keep.
//
// This is the first thing in the game that LEAVES the game. Every other
// screen is something you look at inside Touchdown Fun; this one becomes a
// real image file you can save to the iPad, put on the lock screen, or send
// to Dad. That's the whole point of it.
//
// HOW IT'S MADE — it's drawn on a <canvas>, the same way the football and the
// players are drawn in code. Nothing here is a stored picture: every poster is
// drawn fresh from whatever is true right now, so it's never out of date and
// it costs nothing to keep. It reads (all read-only, nothing is changed):
//     the team + colours  from TDGame.teamByAbbr / currentMenuTeamAbbr
//     your squad          from TDDraft.squad()
//     career + trophies   from tdr-games, tdr-titles, TDProgress, TDAchieve
//     your best moments   from TDRecords
//     your mascot         from TDMascot
//
// ⚠️ HOW YOU SAVE IT IS THE FIDDLY BIT, AND IT'S IPAD'S FAULT. A "download"
// link is the obvious way and it works fine on a computer — but on iPad and
// iPhone, Safari has never really supported downloading like that. What DOES
// always work there is the thing everybody already knows: press and hold a
// picture, then "Add to Photos". So the poster is shown as a REAL <img> (not
// just a canvas), which is press-and-holdable, AND there's a save button for
// everywhere else. Both paths, no dead ends.
//
// Opened from the 🏆 Trophy Case — it belongs with the keepsakes, not the shop.
// Nothing to buy, nothing to unlock, no save file of its own: it's a picture
// OF your save, not another thing to keep.
// ============================================================
(function () {
  'use strict';

  const T = window.TDStats ? TDStats.shared : null;
  const load = (k, f) => (T ? T.load(k, f) : f);
  const $ = id => document.getElementById(id);

  // The poster is drawn big (900×1200) so it still looks sharp saved and
  // opened full size later, and shown small on screen.
  const W = 900, H = 1200;

  const hex = n => '#' + ((n || 0) & 0xffffff).toString(16).padStart(6, '0');

  // ---- gather everything worth putting on a poster ------------------------
  function gather() {
    const abbr = (window.TDGame && TDGame.currentMenuTeamAbbr) ? TDGame.currentMenuTeamAbbr() : null;
    const team = (abbr && window.TDGame && TDGame.teamByAbbr) ? TDGame.teamByAbbr(abbr) : null;
    const squad = (window.TDDraft && TDDraft.squad) ? TDDraft.squad() : [];
    const best = squad.slice().sort((a, b) => b.ovr - a.ovr).slice(0, 5);
    const ach = (window.TDAchieve && TDAchieve.listForCase) ? TDAchieve.listForCase() : [];
    const recs = (window.TDRecords && TDRecords.bests) ? TDRecords.bests() : null;
    return {
      name: team ? team.name : 'MY TEAM',
      abbr: team ? team.abbr : 'TD',
      jersey: hex(team ? team.jersey : 0x14337a),
      helmet: hex(team ? team.helmet : 0xffd60a),
      games: load('games', 0),
      titles: load('titles', 0),
      level: window.TDProgress ? TDProgress.level() : 1,
      rank: window.TDProgress ? TDProgress.title() : 'ROOKIE',
      coins: window.TDShop ? TDShop.coins() : 0,
      badges: ach.filter(b => b.got).length,
      badgeTot: ach.length || 20,
      streak: window.TDStreak ? TDStreak.best() : 0,
      squad: best,
      mascotEmoji: mascotEmoji(),
      mascotName: window.TDMascot ? TDMascot.name() : null,
      recs: recs,
    };
  }
  // TDMascot exposes ids and names, not the emoji — pull it off the picker card
  // if it's been rendered, otherwise fall back to a plain football.
  function mascotEmoji() {
    if (!window.TDMascot) return '🏈';
    const map = { tiger: '🐯', eagle: '🦅', bear: '🐻', shark: '🦈',
                  dragon: '🐉', dino: '🦖', robot: '🤖', alien: '👽' };
    return map[TDMascot.equipped()] || '🏈';
  }

  // ---- little drawing helpers --------------------------------------------
  function roundRect(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }
  function centred(c, text, y, font, fill) {
    c.font = font; c.fillStyle = fill; c.textAlign = 'center';
    c.fillText(text, W / 2, y);
  }

  // Sets c.font to the biggest size the name fits at, and returns the text to
  // draw — trimmed with an ellipsis if even the smallest size is too narrow.
  function fitTitle(c, text, maxW) {
    let size = 104;
    const set = () => { c.font = '800 ' + size + 'px "Arial Black", Arial'; };
    set();
    while (c.measureText(text).width > maxW && size > 34) { size -= 3; set(); }
    if (c.measureText(text).width <= maxW) return text;
    let cut = text;
    while (cut.length > 1 && c.measureText(cut + '\u2026').width > maxW) cut = cut.slice(0, -1);
    return cut + '\u2026';
  }

  // ---- 🎨 draw the poster -------------------------------------------------
  function draw(d) {
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    const c = cv.getContext('2d');

    // background: your team's jersey colour, deepened top to bottom
    const bg = c.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, d.jersey);
    bg.addColorStop(1, '#070d18');
    c.fillStyle = bg; c.fillRect(0, 0, W, H);

    // faint field stripes across the middle, so it reads as football
    c.save();
    c.globalAlpha = 0.07; c.fillStyle = '#ffffff';
    for (let y = 300; y < H - 210; y += 60) c.fillRect(60, y, W - 120, 3);
    c.restore();

    // a helmet-coloured band behind the title
    c.fillStyle = d.helmet;
    c.fillRect(0, 196, W, 10);

    // ---- header ----
    centred(c, 'TOUCHDOWN FUN', 82, '600 30px Arial', 'rgba(255,255,255,0.62)');
    // ⚠️ The team name has to survive ANY name, because you will eventually be
    // able to type your own. Shrink to fit first; if it is still too wide even
    // at the smallest readable size, trim it and add an ellipsis. Never let it
    // run off the edge of the poster.
    c.fillStyle = '#ffffff'; c.textAlign = 'center';
    c.fillText(fitTitle(c, d.name, W - 110), W / 2, 168);

    // ---- the mascot, big, just under the band ----
    c.textAlign = 'center';
    c.font = '128px Arial';
    c.fillText(d.mascotEmoji, W / 2, 350);
    if (d.mascotName) {
      centred(c, d.mascotName.toUpperCase(), 398, '800 34px "Arial Black", Arial', d.helmet);
    }

    // ---- the record tiles ----
    const tiles = [
      ['🏈', d.games, 'GAMES'],
      ['🏆', d.titles, 'MAX BOWLS'],
      ['📈', d.level, 'LEVEL'],
      ['🏅', d.badges + '/' + d.badgeTot, 'BADGES'],
    ];
    const tw = 186, gap = 20;
    const total = tiles.length * tw + (tiles.length - 1) * gap;
    let tx = (W - total) / 2;
    for (const [ic, val, label] of tiles) {
      c.fillStyle = 'rgba(255,255,255,0.10)';
      roundRect(c, tx, 440, tw, 150, 18); c.fill();
      c.textAlign = 'center';
      c.font = '38px Arial'; c.fillStyle = '#ffffff';
      c.fillText(ic, tx + tw / 2, 486);
      c.font = '800 46px "Arial Black", Arial'; c.fillStyle = d.helmet;
      c.fillText(String(val), tx + tw / 2, 538);
      c.font = '700 20px Arial'; c.fillStyle = 'rgba(255,255,255,0.66)';
      c.fillText(label, tx + tw / 2, 570);
      tx += tw + gap;
    }

    // ---- the squad ----
    c.textAlign = 'left';
    c.font = '800 30px "Arial Black", Arial'; c.fillStyle = d.helmet;
    c.fillText('★ TOP OF THE ROSTER', 70, 660);
    // The vertical budget below the roster is tight: five rows, then the best
    // moments line, then the footer band at H-96. Row spacing is 68 (not 72) so
    // all three fit with air between them instead of touching.
    let y = 692;
    if (d.squad.length === 0) {
      c.font = '600 26px Arial'; c.fillStyle = 'rgba(255,255,255,0.6)';
      c.fillText('Draft a squad and they will show up here!', 70, y + 24);
      y += 60;                       // so the best-moments line clears the message
    }
    for (const p of d.squad) {
      c.fillStyle = 'rgba(255,255,255,0.08)';
      roundRect(c, 70, y, W - 140, 62, 14); c.fill();
      c.textAlign = 'left';
      c.font = '32px Arial'; c.fillStyle = '#fff';
      c.fillText(p.emoji, 92, y + 43);
      c.font = '800 30px "Arial Black", Arial';
      c.fillText(p.name, 146, y + 43);
      c.textAlign = 'right';
      c.font = '700 24px Arial'; c.fillStyle = 'rgba(255,255,255,0.62)';
      c.fillText(p.pos, W - 168, y + 43);
      c.font = '800 34px "Arial Black", Arial'; c.fillStyle = d.helmet;
      c.fillText(String(p.ovr), W - 96, y + 43);
      y += 68;
    }

    // ---- a best moment, if there is one ----
    const r = d.recs;
    // r's keys come straight from records.js's BESTS list: pts / mgn / td / fg / tds.
    const bits = [];
    if (r && r.pts) bits.push(r.pts + '-point game');
    if (r && r.td)  bits.push(r.td + '-yard touchdown');
    if (d.streak)   bits.push(d.streak + '-win streak');
    if (bits.length) {
      c.textAlign = 'center';
      c.font = '700 26px Arial'; c.fillStyle = 'rgba(255,255,255,0.72)';
      c.fillText(bits.join('  ·  '), W / 2, Math.min(y + 42, H - 122));
    }

    // ---- footer ----
    c.fillStyle = 'rgba(0,0,0,0.34)';
    c.fillRect(0, H - 96, W, 96);
    c.textAlign = 'center';
    c.font = '700 26px Arial'; c.fillStyle = 'rgba(255,255,255,0.8)';
    const when = new Date().toLocaleDateString();
    c.fillText(d.rank + '  ·  ' + when, W / 2, H - 40);

    return cv;
  }

  // ---- the pop-up ---------------------------------------------------------
  let lastUrl = null;

  function render() {
    const box = $('poster-box'); if (!box) return;
    const d = gather();
    const cv = draw(d);
    let url;
    try { url = cv.toDataURL('image/png'); } catch (e) { url = null; }
    lastUrl = url;
    box.innerHTML = url
      ? `<img id="poster-img" class="poster-img" alt="${d.name} team poster" src="${url}" />`
      : `<div class="poster-fail">Couldn't draw the poster on this device.</div>`;
    const note = $('poster-note');
    if (note) note.innerHTML = 'Press and hold the poster to save it to your photos &mdash; ' +
      'or tap <b>SAVE POSTER</b> below.';
  }

  // Saving: works on a computer, and harmlessly does nothing extra on iPad
  // (where press-and-hold is the real answer, which the note above says).
  function savePoster() {
    if (!lastUrl) return;
    const d = gather();
    const a = document.createElement('a');
    a.href = lastUrl;
    a.download = (d.name || 'my-team').toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-poster.png';
    document.body.appendChild(a);
    a.click();
    a.remove();
    const note = $('poster-note');
    if (note) note.innerHTML = 'Saved! Check your downloads &mdash; on an iPad, press and hold the poster instead.';
  }

  function gameKeyboard(on) { try { window.game.input.keyboard.enabled = on; } catch (e) {} }
  function open() {
    render();
    gameKeyboard(false);
    const m = $('poster-modal'); if (m) m.style.display = 'flex';
  }
  function close() {
    const m = $('poster-modal'); if (m) m.style.display = 'none';
    gameKeyboard(true);
  }

  function wire() {
    const tap = (id, fn) => { const el = $(id); if (el) el.addEventListener('pointerdown', e => { e.preventDefault(); fn(); }); };
    tap('open-poster', open);
    tap('poster-close', close);
    tap('poster-save', savePoster);
    tap('poster-refresh', render);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire);
  else wire();

  window.TDPoster = {
    open, close, render, save: savePoster,
    _gather: gather,
    _draw: () => draw(gather()),
    _url: () => lastUrl,
  };
})();
