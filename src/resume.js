// ============================================================
// TOUCHDOWN FUN — resume.js: 💾 RESUME YOUR GAME (Round 22, pick ⑧)
// ------------------------------------------------------------
// A phone call, a bus stop, a closed tab and a whole game was gone. Now every time YOUR offense is lined up for a snap (a dead ball: nothing
// is moving, nothing is mid-air, the clock is stopped) the game writes down where it is, and the front screen offers ▶ RESUME.
//
//   SAVED    score · quarter · clock · down · spot · yards to go · timeouts · who won the toss · the two teams · the difficulty
//   FRESH    momentum, scouting reads, your power-up, coach's challenges, the stat book, the drive chart, the weather
//   NOT SAVED  anything that is not a plain exhibition: season / playoff / drill / all-star / rival / boss / house-rules / superstar games and two
//              players (🎃 event games ARE saved: it is a plain game in a themed field, and beginGame re-reads the date, so a resumed one is an event game
//              exactly while the event is on) — their stakes live somewhere else, and a "resumed" playoff game could be replayed until it went your way.
//
// ⚠️ THE SAVE IS THE LAST SNAP YOU LINED UP FOR. Quit in the middle of a drive and you are back at that snap; quit while THEY have the ball
// and you are back at your last snap, before their drive. Say so (the button shows the situation) rather than pretend it is a freeze-frame.
// ⚠️ A SAVE THAT WILL NOT LOAD (corrupt, a team that no longer exists, impossible numbers) is thrown away and a NEW game starts — never a
// half-built one. Cleared the moment a game ends.
// ============================================================
(function () {
  'use strict';
  const KEY = 'tdr-resume';
  const $ = id => document.getElementById(id);
  const G = () => (window.__td && __td.G) || null;
  let last = '';

  function eligible(g) {
    return !!(g && g.state === 'presnap' && g.team && g.oppTeam && !g.gameOver && !g.pendingXP && !g.twoPtTry && !g.seasonGame && !g.playoffGame
      && !g.drillGame && !g.allStarGame && !g.rivalGame && !g.bossGame && !g.houseGame && !g.starGame && !g.simTakeover && !g.twoPlayer);
  }
  function snapshot(g) {
    return { v: 1, team: g.team.name, mine: g.team.abbr, opp: g.oppTeam.abbr, diff: g.difficulty, quarter: g.quarter, clock: Math.round(g.clock * 10) / 10,
      score: g.score, oppScore: g.oppScore, down: g.down, los: Math.round(g.losYards * 10) / 10, fd: Math.round(g.firstDownYards * 10) / 10,
      timeouts: g.timeouts, trick: !!g.trickAvailable, theyOpen: !!(window.TDToss && TDToss.theyReceive()), at: Date.now() };
  }
  const num = (v, lo, hi) => typeof v === 'number' && isFinite(v) && v >= lo && v <= hi;
  function valid(s) {
    return !!s && s.v === 1 && typeof s.team === 'string' && typeof s.opp === 'string' && typeof s.diff === 'string'
      && num(s.quarter, 1, 4) && num(s.clock, 0, 150) && num(s.score, 0, 300) && num(s.oppScore, 0, 300) && num(s.down, 1, 4)
      && num(s.los, 0, 100) && num(s.fd, 0, 120) && num(s.timeouts, 0, 3);
  }
  function load() { try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); return valid(s) ? s : null; } catch (e) { return null; } }
  function clear() { try { localStorage.removeItem(KEY); } catch (e) {} last = ''; paint(); }
  const has = () => !!load();

  function tick() {
    const g = G(); if (!g) return;
    if (g.gameOver) { if (has()) clear(); return; }
    if (eligible(g) && !(window.TDPause && TDPause.isPaused && TDPause.isPaused())) {
      const s = snapshot(g), sig = JSON.stringify(Object.assign({}, s, { at: 0 }));
      if (sig !== last) { last = sig; try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} }
    }
    if (g.state === 'menu') paint();
  }

  const ord = d => ['1st', '2nd', '3rd', '4th'][d - 1];
  function clk(c) { const m = Math.floor(c / 60), x = Math.floor(c % 60); return m + ':' + (x < 10 ? '0' : '') + x; }
  function paint() {
    const el = $('tm-resume'); if (!el) return;
    const s = load(), g = G();
    el.style.display = (s && g && g.state === 'menu') ? '' : 'none';
    if (!s) return;
    const togo = Math.max(1, Math.round(s.fd - s.los));
    $('tm-resume-txt').innerHTML = '<b>▶ RESUME GAME</b><small>' + (s.mine || s.team.slice(0, 3).toUpperCase()) + ' ' + s.score + '–' + s.oppScore + ' ' + s.opp + ' · Q' + s.quarter + ' ' + clk(s.clock) + ' · ' + ord(s.down) + ' &amp; ' + togo + '</small>';
  }

  function resume() {
    const s = load(); if (!s) { paint(); return false; }
    let ok = false;
    try { ok = !!(window.TDGame && TDGame.resumeGame(s)); } catch (e) { console.error(e); ok = false; }
    if (!ok) {                      // it would not load: throw it away and start a NEW game from the front screen's own PLAY
      clear();
      const g = G(); if (g && g.state !== 'menu') return false;   // a half-built game is never left behind (beginGame only throws before it leaves 'menu')
      const play = $('tm-play'); if (play) play.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
      return false;
    }
    paint();
    return true;
  }

  function wire() {
    const tap = (id, fn) => { const el = $(id); if (el) el.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); fn(); }); };
    tap('tm-resume-go', resume); tap('tm-resume-x', clear);
    setInterval(tick, 600);
    paint();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire); else wire();
  window.TDResume = { has, load, clear, resume, onMenu: paint, _eligible: eligible, _snapshot: snapshot, _valid: valid, KEY };
})();
