// ============================================================
// TOUCHDOWN FUN — sportspage.js: 🗞️ THE SPORTS PAGE (Round 9, pick ①)
// ------------------------------------------------------------
// The morning after every game, the local paper writes you up.
//
// The headline isn't random — it's chosen from what ACTUALLY happened in
// the game you just played. Win by 30 and it's a rout; win by two and
// it's a thriller; keep them off the board and the defence gets the
// back page; have a receiver catch three touchdowns and HE gets it.
//
// Every write-up is kept, so the Sports Page becomes a scrapbook of your
// whole career that you can read back through.
//
// ------------------------------------------------------------
// WHERE THE FACTS COME FROM
// ------------------------------------------------------------
// gamestats.js already keeps the full stat sheet for a game and main.js
// hands it the final score with one call at the whistle:
//     TDGameStats.finish({ my, opp, myAbbr, oppAbbr, myName, oppName })
// That's the exact moment a reporter would file their story, so we wrap
// that one function: the stat book does its job first, then we read the
// finished numbers (teamTotals + the star of the game) and write the
// morning's headline. main.js is untouched, and with this file missing
// nothing changes at all.
// ============================================================
(function () {
  'use strict';

  // Short name — TDStats.shared adds the "tdr-" (so this is "tdr-news").
  const KEY = 'news';
  const CAP = 25;                       // how many write-ups we keep
  const $ = id => document.getElementById(id);

  const T = window.TDStats ? TDStats.shared : null;
  const store = (k, v) => { if (T) T.store(k, v); };
  const load  = (k, f) => (T ? T.load(k, f) : f);

  let list = null;
  function ensure() {
    if (!list) list = load(KEY, null);
    if (!Array.isArray(list)) list = [];
  }
  function save() { store(KEY, list.slice(0, CAP)); }

  // ---- Writing the story --------------------------------------------------
  // Every rule gets a score; the highest-scoring one becomes the headline, so
  // the most remarkable thing about the game is what makes the front page.
  function writeUp(g, tot, star) {
    const me = (g.myName || 'YOUR TEAM').toUpperCase();
    const them = (g.oppName || 'THEM').toUpperCase();
    const margin = g.my - g.opp;
    const won = margin > 0, tied = margin === 0;
    const starName = star && star.name ? star.name.toUpperCase() : null;
    const starTD = star && star.s ? star.s.td : 0;
    const cands = [];

    // — the star of the game had a monster day —
    if (starName && starTD >= 3) {
      cands.push({ w: 100, h: starName + ' SCORES ' + starTD + '!',
        sub: 'A day nobody at the ground will forget.' });
    } else if (starName && starTD === 2 && won) {
      cands.push({ w: 72, h: starName + ' DOES IT TWICE',
        sub: 'Two touchdowns, and ' + me + ' had too much.' });
    }

    // — the defence —
    if (won && g.opp === 0) {
      cands.push({ w: 96, h: me + ' SHUT THEM OUT',
        sub: them + ' never got on the board. Not once.' });
    }
    if (tot.takeaway >= 3) {
      cands.push({ w: 88, h: 'THE DEFENCE FEASTS',
        sub: tot.takeaway + ' takeaways. ' + them + ' could not hold on to it.' });
    }

    // — the shape of the win/loss —
    if (won && margin >= 21) {
      cands.push({ w: 80, h: me + ' RUN RIOT', sub: 'A ' + margin + '-point rout of ' + them + '.' });
    }
    if (won && margin <= 3) {
      cands.push({ w: 84, h: 'THRILLER! ' + me + ' EDGE IT',
        sub: g.my + '–' + g.opp + '. Nobody breathed until the whistle.' });
    }
    if (!won && !tied && margin >= -3) {
      cands.push({ w: 78, h: 'HEARTBREAK FOR ' + me,
        sub: 'Beaten ' + g.opp + '–' + g.my + ' by the width of a post.' });
    }
    if (!won && !tied && margin <= -21) {
      cands.push({ w: 70, h: 'A LONG AFTERNOON',
        sub: them + ' were far too good. Back to the practice field.' });
    }
    if (tied) {
      cands.push({ w: 90, h: 'NOBODY BLINKS: ' + g.my + '–' + g.opp,
        sub: 'Two teams, one point each way, no winner.' });
    }

    // — the offence —
    if (tot.total >= 300) {
      cands.push({ w: 74, h: me + ' PILE UP ' + tot.total + ' YARDS',
        sub: 'The offence would not stop moving.' });
    }
    if (tot.fg >= 3) {
      cands.push({ w: 66, h: 'THE BOOT WINS IT',
        sub: tot.fg + ' field goals — every point counted.' });
    }
    if (tot.rushYds >= 150 && tot.rushYds > tot.recYds * 2) {
      cands.push({ w: 68, h: 'GROUND GAME GRINDS THEM DOWN',
        sub: tot.rushYds + ' yards on the floor.' });
    }

    // — always at least one plain, honest report —
    cands.push({ w: 10,
      h: won ? me + ' BEAT ' + them : tied ? me + ' AND ' + them + ' SHARE IT'
             : them + ' BEAT ' + me,
      sub: 'Final score ' + g.my + '–' + g.opp + '.' });

    cands.sort((a, b) => b.w - a.w);
    return cands[0];
  }

  // ---- Called (through the wrap) the moment a game ends -------------------
  function fileStory(g) {
    ensure();
    const tot  = (window.TDGameStats && TDGameStats.teamTotals) ? TDGameStats.teamTotals()
               : { rushYds: 0, recYds: 0, total: 0, td: 0, fg: 0, takeaway: 0 };
    const star = (window.TDGameStats && TDGameStats.mvp) ? TDGameStats.mvp() : null;
    const starName = star && star.slot
      ? (TDGameStats.rosterName ? TDGameStats.rosterName(star.slot) : null) : null;

    const story = writeUp(g, tot, star ? { name: starName, s: star.s } : null);
    list.unshift({
      h: story.h, sub: story.sub,
      my: g.my, opp: g.opp,
      myAbbr: g.myAbbr || 'YOU', oppAbbr: g.oppAbbr || 'OPP',
      won: g.my > g.opp, t: Date.now(),
    });
    if (list.length > CAP) list.length = CAP;
    save();
  }

  // ---- Drawing ------------------------------------------------------------
  function dayOf(ts) {
    try {
      return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch (e) { return ''; }
  }

  function render() {
    ensure();
    const body = $('news-body');
    if (!body) return;
    if (!list.length) {
      body.innerHTML = '<div class="nw-empty">No write-ups yet. Play a game and the paper will have something to say!</div>';
      return;
    }
    body.innerHTML = list.map((n, i) =>
      '<div class="nw-item' + (i === 0 ? ' lead' : '') + '">' +
        (i === 0 ? '<div class="nw-flag">🗞️ BACK PAGE</div>' : '') +
        '<div class="nw-head">' + n.h + '</div>' +
        '<div class="nw-sub">' + n.sub + '</div>' +
        '<div class="nw-line">' +
          '<span class="nw-score' + (n.won ? ' w' : '') + '">' +
            n.myAbbr + ' ' + n.my + ' – ' + n.opp + ' ' + n.oppAbbr + '</span>' +
          '<span class="nw-date">' + dayOf(n.t) + '</span>' +
        '</div>' +
      '</div>').join('');
  }

  function open()  { ensure(); const m = $('news-modal'); if (m) { m.style.display = 'flex'; render(); } }
  function close() { const m = $('news-modal'); if (m) m.style.display = 'none'; }

  // ---- Wire up ------------------------------------------------------------
  function onTap(id, fn) {
    const el = $(id);
    if (el) el.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); fn(); });
  }

  function wireUp() {
    ensure();
    onTap('open-news', open);
    onTap('news-close', close);

    // ---- The one hook (see the note at the top of this file) --------------
    if (window.TDGameStats && !TDGameStats.__newsWrapped) {
      const original = TDGameStats.finish;
      TDGameStats.finish = function (g) {
        original.apply(TDGameStats, arguments);   // the stat book files first…
        try { fileStory(g || {}); } catch (e) {}  // …then the reporter writes it up
      };
      TDGameStats.__newsWrapped = true;
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wireUp);
  else wireUp();

  window.TDNews = { open, close, render, fileStory, headlines: () => (ensure(), list.slice()), _writeUp: writeUp };
})();
