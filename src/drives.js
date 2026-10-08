// ============================================================
// TOUCHDOWN FUN — drives.js: 📋 THE DRIVE CHART (Round 16, pick ②)
// ------------------------------------------------------------
// A football game is a story told in drives: who had the ball, where they got
// it, how long they kept it, and how it ended. The game has always kept a score
// and, since Round 7, a box score of PLAYERS — but nobody ever wrote the drives
// down, so the story of a game could not be read back. "Seattle punted, Kansas
// City scored, Seattle fumbled" lived only in your head.
//
// This file writes it down as it happens, for BOTH teams:
//
//     Q1 2:22   SEA   from own 24   8 plays · 61 yds    TOUCHDOWN  +7
//     Q1 0:41   KC    from own 25   3 plays ·  4 yds    PUNT
//
// ⚠️ IT IS A RECORD, NOT A SECOND SIMULATION. Every number is read off something
// main.js already decided: a drive STARTS where `setupPlay` / `startCpuDrive`
// start it, each PLAY is one `endPlay` / `DefenseSim.apply`, and it ENDS where
// `endPlay` / `onKickDone` / `cpuDriveEnd` end it. Nothing here can change who
// wins a play, so it can never disagree with the scoreboard.
//
// ⚠️ A TOUCHDOWN DRIVE'S POINTS ARE NOT KNOWN WHEN IT ENDS. The six come at the
// whistle, but the extra point (or the two-pointer) comes AFTER, and a chart that
// said "TOUCHDOWN +6" and then a +7 on the scoreboard would be wrong in a way a
// nine-year-old would notice. So the drive closes with 6 and the try ADDS to it.
//
// Where to read it: the 📊 Box Score has a section for it, and the break screens
// (end of a quarter, halftime) get a small 📋 DRIVES button — that is when you
// actually have a minute to read a game.
//
// Nothing is saved: like the stat book, these are THIS game's drives and stay
// until the next kickoff (so the Box Score can show the last finished game).
// ============================================================
(function () {
  'use strict';

  const $ = id => document.getElementById(id);

  let drives = [];                 // closed drives, in order
  let cur = { you: null, opp: null };
  let names = { you: 'YOU', opp: 'OPP' };
  let seq = 0;

  function newGame(you, opp) {
    drives = []; cur = { you: null, opp: null }; seq = 0;
    names = { you: you || 'YOU', opp: opp || 'OPP' };
    hideBreakButton();
  }
  function setNames(you, opp) { names = { you: you || names.you, opp: opp || names.opp }; }

  // ---- recording ---------------------------------------------------------------
  // `start` = yards from THAT TEAM'S OWN goal line. `when` = e.g. "Q1 2:22".
  function begin(team, start, when) {
    if (cur[team]) return cur[team];                          // idempotent: a drive starts once
    const d = { id: ++seq, team, start: Math.round(start), end: Math.round(start), plays: 0, yards: 0,
                when: when || '', result: null, pts: 0, open: true, ret: false };
    cur[team] = d;
    return d;
  }
  const beginYou = (start, when) => begin('you', start, when);
  const beginOpp = (start, when) => begin('opp', start, when);

  // One play of this drive. `spot` = where the ball is now (that team's yards).
  function play(team, spot) {
    const d = cur[team]; if (!d) return;
    d.plays++;
    if (spot != null) { d.end = Math.round(spot); d.yards = d.end - d.start; }
  }

  // Close a drive. `result` is a short code; `pts` the points it produced.
  function end(team, result, pts, spot) {
    const d = cur[team]; if (!d) return null;
    if (spot != null) { d.end = Math.round(spot); d.yards = d.end - d.start; }
    d.result = result; d.pts = pts || 0; d.open = false;
    drives.push(d); cur[team] = null;
    return d;
  }

  // The try after a touchdown: it belongs to the drive that scored. (+1 kick, +2 conversion.)
  function addPts(team, pts) {
    for (let i = drives.length - 1; i >= 0; i--) {
      if (drives[i].team === team && drives[i].result === 'TD') { drives[i].pts += pts; return; }
    }
  }

  // main.js's endPlay: one of YOUR plays just ended. `o` = { result, spot, losYards, next, msg, when }.
  function yourPlay(o) {
    let d = cur.you;
    if (!d) {                                                  // a return touchdown: no snap ever happened
      d = begin('you', o.losYards != null ? o.losYards : 0, o.when);
      d.ret = true;
    }
    const spot = (o.result === 'touchdown') ? 100 : (o.spot != null ? o.spot : o.losYards);
    play('you', spot);
    const msg = String(o.msg || '').toUpperCase();
    if (o.result === 'touchdown')                              end('you', 'TD', 6, 100);
    else if (o.result === 'interception')                      end('you', /FUMBLE/.test(msg) ? 'FUMBLE' : 'INT', 0, spot);
    else if (/SAFETY/.test(msg))                               end('you', 'SAFETY', 0, spot);
    else if (o.next && o.next.fresh && /DOWNS/.test(msg))      end('you', 'DOWNS', 0, spot);
    else if (o.next && o.next.fresh)                           end('you', 'END', 0, spot);   // any other change of possession
  }

  // A kick ended your drive (onKickDone): kind = 'fg' | 'punt' | 'xp'.
  function yourKick(kind, made, blocked) {
    if (kind === 'xp') { if (made) addPts('you', 1); return; }  // the try rides on the touchdown drive
    if (!cur.you) return;
    if (kind === 'punt')        end('you', blocked ? 'BLOCKED' : 'PUNT', 0);
    else if (made)              end('you', 'FG', 3);
    else                        end('you', blocked ? 'BLOCKED' : 'MISSED FG', 0);
  }

  // Their drive ended (cpuDriveEnd): kind is main.js's own word for it.
  function endOpp(kind, msg, pts) {
    const m = String(msg || '').toUpperCase();
    let r = 'END';
    if (kind === 'touchdown') r = 'TD';
    else if (kind === 'fieldgoal') r = 'FG';
    else if (kind === 'fgmiss') r = 'MISSED FG';
    else if (kind === 'punt') r = 'PUNT';
    else if (kind === 'safety') r = 'SAFETY';
    else if (/INTERCEPT/.test(m)) r = 'INT';
    else if (/FUMBLE/.test(m)) r = 'FUMBLE';
    else if (/DOWNS/.test(m)) r = 'DOWNS';
    else if (/BLOCK/.test(m)) r = 'BLOCKED';
    else if (kind === 'turnover') r = 'TURNOVER';
    end('opp', r, pts || 0);
  }

  // The half (or the game) ends with the ball still in somebody's hands.
  function closeAll(reason) {
    for (const t of ['you', 'opp']) if (cur[t]) end(t, reason, 0);
  }

  // ---- reading it back -----------------------------------------------------------
  const spotWords = y => (y <= 50 ? 'own ' + Math.max(1, y) : 'opp ' + Math.max(1, 100 - y));
  const CHIP = {   // result -> [label, good-for-you?]
    TD: 'TOUCHDOWN', FG: 'FIELD GOAL', PUNT: 'PUNT', INT: 'INTERCEPTION', FUMBLE: 'FUMBLE',
    DOWNS: 'TURNOVER ON DOWNS', 'MISSED FG': 'MISSED FG', BLOCKED: 'BLOCKED KICK', SAFETY: 'SAFETY',
    'END OF HALF': 'END OF HALF', 'END OF GAME': 'END OF GAME', END: 'POSSESSION ENDED', TURNOVER: 'TURNOVER',
  };
  // Who is this good for? A score is good for the team that made it; a turnover or a miss, for the other.
  function tone(d) {
    const mine = d.team === 'you';
    if (d.result === 'TD' || d.result === 'FG') return mine ? 'good' : 'bad';
    if (d.result === 'SAFETY') return mine ? 'bad' : 'good';
    if (['INT', 'FUMBLE', 'DOWNS', 'MISSED FG', 'BLOCKED'].includes(d.result)) return mine ? 'bad' : 'good';
    return 'flat';
  }
  const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  function rowHTML(d, live) {
    const label = live ? 'ON THE FIELD' : (CHIP[d.result] || d.result);
    const pts = (!live && d.pts) ? ' +' + d.pts : '';
    const plays = d.plays ? d.plays + (d.plays === 1 ? ' play' : ' plays') + ' · ' : '';
    const yds = (d.yards < 0 ? '−' : '') + Math.abs(d.yards) + ' yds';
    return '<div class="dv-row ' + d.team + '">' +
      '<div class="dv-tm">' + esc(names[d.team]) + '</div>' +
      '<div class="dv-main"><b>' + (d.ret && !d.plays ? 'Return' : plays + yds) + '</b>' +
        '<span>' + esc(d.when) + (d.ret && !d.plays ? '' : ' · from ' + spotWords(d.start)) + '</span></div>' +
      '<div class="dv-res ' + (live ? 'live' : tone(d)) + '">' + esc(label) + pts + '</div></div>';
  }

  // The whole chart: a one-line summary per team, then every drive in order.
  function html() {
    const all = drives.concat([cur.you, cur.opp].filter(Boolean)).sort((a, b) => a.id - b.id);
    if (!all.length) return '<div class="dv-empty">📋<br>No drives yet.<br><span>Play a few downs and they will show up here.</span></div>';
    const sum = t => {
      const mine = all.filter(d => d.team === t);
      const scored = mine.filter(d => d.pts > 0).length;
      const yds = mine.reduce((a, d) => a + Math.max(0, d.yards), 0);
      return '<div class="dv-sum"><b>' + esc(names[t]) + '</b><span>' + mine.length + (mine.length === 1 ? ' drive' : ' drives') +
        ' · ' + scored + ' scored · ' + yds + ' yds</span></div>';
    };
    return '<div class="dv-sums">' + sum('you') + sum('opp') + '</div>' +
      '<div class="dv-list">' + all.map(d => rowHTML(d, d.open)).join('') + '</div>';
  }

  // ---- the pop-up (opened from the break screens) -----------------------------------
  function gameKeyboard(on) { try { window.game.input.keyboard.enabled = on; } catch (e) {} }
  function modal() {
    let m = $('drv-modal');
    if (m) return m;
    m = document.createElement('div');
    m.id = 'drv-modal';
    m.innerHTML = '<div class="dv-card"><div class="dv-title">📋 THE DRIVE CHART</div><div class="dv-sub">Every possession of the game so far.</div>' +
      '<div id="drv-body"></div><div class="dv-close" id="drv-close">CLOSE</div></div>';
    document.body.appendChild(m);
    const stop = e => { e.preventDefault(); e.stopPropagation(); };
    m.addEventListener('pointerdown', e => { e.stopPropagation(); if (e.target === m) closeModal(); });
    $('drv-close').addEventListener('pointerdown', e => { stop(e); closeModal(); });
    return m;
  }
  function open() {
    const m = modal();
    $('drv-body').innerHTML = html();
    m.style.display = 'flex';
    gameKeyboard(false);                           // SPACE must not end the break behind the chart
  }
  function closeModal() {
    const m = $('drv-modal'); if (m) m.style.display = 'none';
    gameKeyboard(true);
  }

  // The little 📋 DRIVES button that floats over a break screen.
  function showBreakButton() {
    let b = $('drv-break');
    if (!b) {
      b = document.createElement('div');
      b.id = 'drv-break'; b.textContent = '📋 DRIVES';
      b.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); open(); });
      document.body.appendChild(b);
    }
    b.style.display = 'block';
  }
  function hideBreakButton() { const b = $('drv-break'); if (b) b.style.display = 'none'; closeModal(); }

  const css = document.createElement('style');
  css.textContent = `
    #drv-modal { display: none; position: fixed; inset: 0; z-index: 130; align-items: center; justify-content: center;
      background: rgba(6,10,20,0.88); padding: 14px; }
    #drv-modal .dv-card { width: min(94vw, 460px); max-height: 88vh; display: flex; flex-direction: column;
      box-sizing: border-box; background: rgba(18,28,48,0.98); border: 2px solid rgba(255,255,255,0.18);
      border-radius: 18px; padding: 16px; text-align: left; box-shadow: 0 12px 44px rgba(0,0,0,.55); }
    .dv-title { font: 900 18px "Arial Black", Arial; color: #ffe066; text-align: center; }
    .dv-sub { font: 700 12px Arial; color: #9fb0c3; text-align: center; margin: 3px 0 10px; }
    #drv-body { overflow-y: auto; min-height: 0; flex: 1; }
    .dv-sums, .dv-list { text-align: left; }   /* the Box Score centres everything inside it */
    .dv-sums { display: flex; gap: 8px; margin-bottom: 8px; }
    .dv-sum { flex: 1; min-width: 0; padding: 7px 9px; border-radius: 10px; background: rgba(255,255,255,0.06); }
    .dv-sum b { display: block; font: 800 13px "Arial Black", Arial; color: #fff; }
    .dv-sum span { font: 700 10.5px Arial; color: #9fb0c3; }
    .dv-list { display: flex; flex-direction: column; gap: 5px; }
    .dv-row { display: flex; align-items: center; gap: 9px; padding: 7px 9px; border-radius: 10px;
      background: rgba(255,255,255,0.05); border-left: 4px solid #5db3ff; }
    .dv-row.opp { border-left-color: #ff9b6b; }
    .dv-tm { flex: 0 0 38px; font: 900 12px "Arial Black", Arial; color: #dfe6f2; }
    .dv-main { flex: 1; min-width: 0; }
    .dv-main b { display: block; font: 800 12.5px Arial; color: #fff; }
    .dv-main span { font: 700 10.5px Arial; color: #9fb0c3; }
    .dv-res { flex: 0 0 auto; max-width: 42%; text-align: right; font: 800 10.5px "Arial Black", Arial; letter-spacing: .02em; color: #c6cede; }
    .dv-res.good { color: #7ff0a0; } .dv-res.bad { color: #ff9b9b; } .dv-res.live { color: #ffe066; }
    .dv-close { margin-top: 12px; text-align: center; padding: 11px; border-radius: 12px; cursor: pointer;
      font: 800 14px "Arial Black", Arial; color: #10151f; background: rgba(255,214,10,0.92); }
    .dv-empty { text-align: center; font: 700 15px Arial; color: #dfe6f2; padding: 18px 8px; }
    .dv-empty span { font: 12px Arial; color: #9fb0c3; }
    #drv-break { display: none; position: fixed; z-index: 70; left: 50%; transform: translateX(-50%);
      bottom: calc(14px + env(safe-area-inset-bottom, 0px)); padding: 10px 18px; border-radius: 22px; cursor: pointer;
      font: 800 13px "Arial Black", Arial; color: #fff; background: rgba(93,179,255,0.28); border: 2px solid rgba(93,179,255,0.8);
      touch-action: none; -webkit-tap-highlight-color: transparent; }
    #drv-break:active { transform: translateX(-50%) scale(.96); }
  `;
  document.head.appendChild(css);

  window.TDDrives = {
    newGame, setNames, beginYou, beginOpp, play, end, addPts,
    yourPlay, yourKick, endOpp, closeAll,
    html, open, close: closeModal, showBreakButton, hideBreakButton,
    count: () => drives.length,
    _all: () => drives.map(d => Object.assign({}, d)),
    _cur: () => ({ you: cur.you && Object.assign({}, cur.you), opp: cur.opp && Object.assign({}, cur.opp) }),
  };
})();
