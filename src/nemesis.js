// ============================================================
// TOUCHDOWN FUN — nemesis.js: 😈 YOUR RIVAL NEMESIS
// ------------------------------------------------------------
// One team in the league is YOUR arch-rival, and the game remembers
// every grudge match you play against them: your wins, their wins, who
// won last, and how hot the feud has gotten. They've always got some
// trash talk ready. Beat them for bonus coins + bragging rights; lose
// and they'll be back for more.
//
//   • The first time you reach the menu we quietly assign you a rival
//     (a random real NFL team) and save it.
//   • Tap 😈 RIVAL to see the head-to-head story, then CHALLENGE them —
//     a grudge match is a notch tougher than a normal game.
//   • main.js runs the actual game and calls recordResult() at the
//     final whistle; the history lives in tdr-nemesis.
//
// We lean on main.js's tiny window.TDGame bridge for team colors and to
// kick off the grudge match, so this file never touches Phaser.
// ============================================================
(function () {
  'use strict';

  const T = window.TDStats ? TDStats.shared : null;
  const store = (k, v) => { if (T) T.store(k, v); };
  const load  = (k, f) => (T ? T.load(k, f) : f);
  const $ = id => document.getElementById(id);
  const hex = n => '#' + (n >>> 0).toString(16).padStart(6, '0');
  const bridge = () => window.TDGame || null;

  // ---- 🧠 What we remember about the feud ---------------------------------
  //   abbr       = your rival's team code
  //   w / l      = YOUR wins / YOUR losses against them
  //   streak     = current run (+ = you winning, − = them winning)
  //   last       = who won the last grudge match ('win' | 'lose' | null)
  //   played     = total grudge matches (drives the 🔥 heat meter)
  //   justPlayed = a grudge result waiting to be shown on the menu (once)
  let d = load('nemesis', { abbr: null, w: 0, l: 0, streak: 0, last: null, played: 0, justPlayed: null });
  function save() { store('nemesis', d); }

  // Make sure a rival is chosen. Called from main.js showMenu (once TDGame
  // exists). We try not to pick the team you're currently looking at.
  function ensure() {
    if (d.abbr) return;
    const g = bridge();
    if (!g || !g.nflAbbrs) return;
    const abbrs = g.nflAbbrs();
    if (!abbrs.length) return;
    const you = g.currentMenuTeamAbbr ? g.currentMenuTeamAbbr() : null;
    let picked, tries = 0;
    do { picked = abbrs[Math.floor(Math.random() * abbrs.length)]; tries++; } while (picked === you && tries < 20);
    d.abbr = picked;
    save();
  }

  function rivalTeam() { const g = bridge(); return (g && d.abbr && g.teamByAbbr) ? g.teamByAbbr(d.abbr) : null; }
  function rivalName() { const t = rivalTeam(); return t ? t.name : 'YOUR RIVAL'; }
  function heat() { return Math.min(1, d.played / 10); }   // 🔥 0..1, grows with games played

  // 😈 A trash-talk line that fits where the feud stands right now.
  function taunt() {
    const n = rivalName();
    if (d.played === 0)  return `${n} says you don't stand a chance. Prove them wrong! 😤`;
    if (d.streak >= 3)   return `You've won ${d.streak} straight — ${n} is DESPERATE for payback! 🔥`;
    if (d.streak <= -3)  return `${n} has your number: ${-d.streak} in a row. Turn it around! 😱`;
    if (d.last === 'win')  return `You beat ${n} last time. They want revenge… 😏`;
    if (d.last === 'lose') return `${n} beat you last time. Time to get even! 😡`;
    if (d.w === d.l)       return `Dead even with ${n}. This one's for bragging rights! ⚔️`;
    return `The feud with ${n} is heating up. Settle it on the field! 😈`;
  }

  // main.js reads this for the kickoff announcer line of a grudge match.
  function introLine() {
    const n = rivalName();
    if (d.last === 'lose') return `😈 GRUDGE MATCH vs ${n} — REVENGE TIME!`;
    if (d.streak >= 3)     return `😈 GRUDGE MATCH vs ${n} — can anyone stop you?`;
    return `😈 GRUDGE MATCH vs ${n} — settle the score!`;
  }

  // main.js calls this at the final whistle of a rival game.
  function recordResult(win) {
    if (win) { d.w++; d.streak = d.streak >= 0 ? d.streak + 1 : 1;  d.last = 'win'; }
    else     { d.l++; d.streak = d.streak <= 0 ? d.streak - 1 : -1; d.last = 'lose'; }
    d.played++;
    d.justPlayed = win ? 'win' : 'lose';
    save();
    return { win, w: d.w, l: d.l, streak: d.streak };
  }

  // ---- 🖼 The modal --------------------------------------------------------
  function render() {
    const t = rivalTeam();
    const badge = $('nemesis-badge');
    if (badge) badge.style.background = t
      ? `linear-gradient(${hex(t.jersey)} 50%, ${hex(t.helmet)} 50%)` : '#33405a';
    const nm = $('nemesis-name'); if (nm) nm.textContent = t ? t.name : '???';

    const g = bridge();
    const you = (g && g.currentMenuTeamAbbr && g.currentMenuTeamAbbr()) || 'YOU';
    const vs = $('nemesis-vs'); if (vs) vs.textContent = you + '  vs  ' + (d.abbr || '???');

    const rec = $('nemesis-record');
    if (rec) rec.innerHTML =
      `<div class="nm-rec win"><b>${d.w}</b><span>YOU</span></div>
       <div class="nm-dash">–</div>
       <div class="nm-rec lose"><b>${d.l}</b><span>${d.abbr || 'THEM'}</span></div>`;

    const stk = $('nemesis-streak');
    if (stk) {
      if (d.streak > 0)      stk.textContent = `🔥 You're on a ${d.streak}-win streak!`;
      else if (d.streak < 0) stk.textContent = `❄️ They've won ${-d.streak} in a row`;
      else if (d.played)     stk.textContent = 'All square — dead even';
      else                   stk.textContent = 'No grudge matches yet';
    }

    const fill = $('nemesis-heat-fill'); if (fill) fill.style.width = Math.round(heat() * 100) + '%';
    const tn = $('nemesis-taunt'); if (tn) tn.textContent = taunt();
    const btn = $('nemesis-play'); if (btn) btn.textContent = (d.last === 'lose') ? '⚔️ GET REVENGE →' : '⚔️ CHALLENGE THEM →';

    // Clear any leftover result headline (flashResult re-sets it when needed).
    const fl = $('nemesis-flash'); if (fl) { fl.className = 'nemesis-flash'; fl.textContent = ''; }
  }

  // Headline the modal with the result of the grudge match you just played.
  function flashResult(res) {
    const el = $('nemesis-flash');
    if (!el) return;
    el.className = 'nemesis-flash show ' + (res === 'win' ? 'win' : 'lose');
    el.textContent = res === 'win' ? '🏆 YOU BEAT ' + rivalName() + '!'
                                   : '😱 ' + rivalName() + ' GOT REVENGE!';
    if (res === 'win' && window.TDShop && TDShop.celebrate) TDShop.celebrate($('nemesis-badge'), '😈', 'RIVAL DOWN!  +15 🪙');
    if (window.TDSound) TDSound.sting(res === 'win' ? 'win' : 'stuff');
  }

  // ---- Pop-up plumbing -----------------------------------------------------
  function gameKeyboard(on) { try { window.game.input.keyboard.enabled = on; } catch (e) {} }
  function openModal() {
    ensure();
    const m = $('nemesis-modal'); if (!m) return;
    gameKeyboard(false); render(); m.style.display = 'flex';
  }
  function closeModal() { const m = $('nemesis-modal'); if (m) m.style.display = 'none'; gameKeyboard(true); }

  // Start the grudge match (the modal's CHALLENGE button).
  function play() {
    const g = bridge();
    if (!g || !g.startRivalGame || !d.abbr) return;
    closeModal();
    g.startRivalGame(d.abbr);
  }

  // ---- The 😈 RIVAL menu button ------------------------------------------
  function refreshBtn() {
    const btn = $('open-nemesis');
    if (!btn) return;
    btn.textContent = '😈 ' + (d.abbr || 'RIVAL');
    btn.classList.toggle('revenge', d.last === 'lose');   // glow when they beat you last
  }

  // ---- Called from main.js showMenu ---------------------------------------
  function onMenu() {
    refreshBtn();
    // Just finished a grudge match? Pop the result once, like a doorbell.
    if (d.justPlayed) {
      const res = d.justPlayed;
      d.justPlayed = null; save();
      setTimeout(() => { openModal(); flashResult(res); }, 550);
    }
  }

  // ---- Wire the buttons ----------------------------------------------------
  function onTap(id, fn) { const el = $(id); if (el) el.addEventListener('pointerdown', e => { e.preventDefault(); fn(); }); }
  function wireUp() {
    onTap('open-nemesis', openModal);
    onTap('nemesis-close', closeModal);
    onTap('nemesis-play', play);
    refreshBtn();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wireUp);
  else wireUp();

  // ---- What the rest of the game may use ----------------------------------
  window.TDNemesis = { ensure, onMenu, recordResult, introLine, open: openModal, get: () => d };
})();
