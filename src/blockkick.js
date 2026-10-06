// ============================================================
// TOUCHDOWN FUN — blockkick.js: 🚫 BLOCK THE KICK (Round 15, pick ⑤)
// ------------------------------------------------------------
// Their field-goal unit runs on. For a while all you could do was ice the
// kicker — spend a timeout and make him stand there. You could not GO AND GET
// IT. Your own kicks could be blocked (the rusher, and since v4.18 a whole
// pocket) but nothing on the other side of the ball could block anything.
//
// Now, when they line up a kick — a field goal OR a punt — you can SEND
// EVERYBODY. One button, and an honest price on it:
//
//        a field goal            block 8%   ·   flag 9%   ·   otherwise nothing
//        a punt                  block 12%  ·   flag 10%  ·   otherwise nothing
//
//   💥 BLOCKED  the kick is dead. You take the ball where it was kicked from, it
//               pays like a takeaway (coins, XP, momentum), and your defender
//               who got a hand on it is credited with the block.
//   🚩 FLAG     you ran into the kicker. 15 yards and an AUTOMATIC FIRST DOWN —
//               their drive is not over, it just got a gift. This is the real
//               rule, and it is what makes the button a decision instead of a
//               free roll: a stop turns into a gift.
//   …           nothing happens and the kick goes as it would have.
//
// ⚠️ THE ODDS ARE ON THE BUTTON, and so is an honest word on when it is worth
// it, the way 🧊 icing does. Sending everybody improves your chance of stopping
// a field goal at ALL (a block, or a miss) by a few points — which is worth the
// price of a flag only when a made kick actually beats you. Up by ten, it is
// just a way to give them a first down.
//
// ⚠️ THE FLAG HAS TO REWIND THE DRIVE, not end it. Their kick was queued as the
// END of the drive (`endDrive('fieldgoal')`) and the next tap resolves it, so a
// flag has to take that ending back and put the drive on the map again at +15
// with a fresh set of downs — main.js `DefenseSim.resume()`.
//
// Nothing is saved. This file owns the odds, the row and the roll; main.js's
// `cpuDriveEnd` asks it what happened to the kick.
// ============================================================
(function () {
  'use strict';

  const $ = id => document.getElementById(id);

  const ODDS = {
    fieldgoal: { block: 0.08, flag: 0.09, noun: 'FIELD GOAL' },
    punt:      { block: 0.12, flag: 0.10, noun: 'PUNT' },
  };
  const FLAG_YARDS = 15;

  let rush = null;     // { kind } once you have sent everybody for THIS kick

  const odds = kind => ODDS[kind] || null;

  // ---- is it worth it? (an honest word, not a rule) ------------------------
  // ctx = { kind, lead, quarter, clock, quarters }
  function worth(ctx) {
    const c = ctx || {};
    const lead = c.lead || 0;                      // yours minus theirs
    const last = (c.quarter || 1) >= (c.quarters || 4);
    if (c.kind === 'punt') {
      if (!last && lead >= 0) return { go: false, why: 'A flag hands them a first down and you can already return a punt. Not worth it.' };
      return { go: true, why: 'You need the ball back. A block is the quickest way to get it.' };
    }
    // a field goal: does making it beat you?
    if (lead <= 3 && last) return { go: true, why: 'This kick ties it or wins it for them. A block is your best shot at stopping it.' };
    if (lead <= 3)          return { go: false, why: 'It is close, but not late. A flag hands them a first down in field-goal range.' };
    return { go: false, why: 'You are far enough ahead that a flag only gives them a first down. Let him kick.' };
  }

  // ---- the roll ----------------------------------------------------------------
  // Called ONCE per kick from cpuDriveEnd. Returns null if you never sent anybody,
  // else { result: 'block' | 'flag' | 'none' }. It clears the rush as it answers,
  // so a repaint can never roll the same kick twice.
  function resolve(kind, rnd) {
    const r = rush; rush = null;
    hide();
    if (!r || r.kind !== kind) return null;
    const o = odds(kind); if (!o) return null;
    const x = (rnd || Math.random)();
    if (x < o.block) return { result: 'block', flagYards: 0 };
    if (x < o.block + o.flag) return { result: 'flag', flagYards: FLAG_YARDS };
    return { result: 'none', flagYards: 0 };
  }

  function sent() { return !!rush; }
  function clear() { rush = null; hide(); }

  // ---- the row inside the 🛡 defense panel ------------------------------------
  function ensureRow() {
    let row = $('bk-row');
    if (row) return row;
    const tap = $('dsim-tap');
    if (!tap || !tap.parentNode) return null;
    row = document.createElement('div');
    row.id = 'bk-row';
    tap.parentNode.insertBefore(row, tap);
    // The whole panel advances the drive when it is touched, so this button has to
    // swallow its own tap (same lesson as icing.js and twelfth.js).
    row.addEventListener('pointerdown', e => {
      e.stopPropagation(); e.preventDefault();
      if (e.target.closest && e.target.closest('.bk-btn') && !rush && lastKind) { rush = { kind: lastKind }; paint(lastCtx); }
    });
    return row;
  }
  function hide() { const row = $('bk-row'); if (row) { row.innerHTML = ''; row.style.display = 'none'; } }

  let lastKind = null, lastCtx = null;
  // main.js calls this every time the panel repaints. ctx = { ending, kind, lead, … }.
  function paint(ctx) {
    ctx = ctx || {};
    const kind = ctx.kind;
    const row = ensureRow(); if (!row) return;
    if (!ctx.ending || !odds(kind)) { lastKind = null; rush = null; hide(); return; }
    lastKind = kind; lastCtx = ctx;
    const o = odds(kind);
    row.style.display = 'block';
    if (rush) {
      row.innerHTML = '<div class="bk-head">🚫 EVERYBODY IS COMING</div>' +
        '<div class="bk-why">' + Math.round(o.block * 100) + '% it is blocked, ' + Math.round(o.flag * 100) +
        '% you hit the kicker. Tap to see.</div>';
      return;
    }
    const w = worth(ctx);
    row.innerHTML =
      '<div class="bk-head">🚫 RUSH THE ' + o.noun + ' &middot; <b>' + Math.round(o.block * 100) + '% block</b> &middot; ' +
        '<b class="flag">' + Math.round(o.flag * 100) + '% flag</b></div>' +
      '<div class="bk-why">' + w.why + '</div>' +
      '<div class="bk-btn' + (w.go ? ' go' : '') + '">🚫 SEND EVERYBODY <small>a flag is 15 yards and a first down</small></div>';
  }

  const css = document.createElement('style');
  css.textContent = `
    #bk-row { display: none; margin: 2px 4px 10px; text-align: left; }
    .bk-head { font: 800 12px "Arial Black", Arial; color: #ffb36b; letter-spacing: .04em; text-transform: uppercase; }
    .bk-head b { color: #fff; } .bk-head b.flag { color: #ff8a8a; }
    .bk-why { font: 12px/1.4 Arial; color: #aab4c8; margin-top: 4px; }
    .bk-btn { -webkit-tap-highlight-color: transparent; touch-action: none; cursor: pointer;
      margin-top: 8px; padding: 10px 12px; border-radius: 11px; text-align: center;
      font: 800 12px "Arial Black", Arial; color: #dfe6f2;
      background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.25); }
    .bk-btn small { display: block; font: 700 10px Arial; opacity: .75; margin-top: 2px; }
    .bk-btn.go { color: #fff1e0; background: rgba(255,155,107,0.22); border-color: rgba(255,155,107,0.85); }
    .bk-btn:active { transform: scale(0.97); background: rgba(255,255,255,0.22); }
  `;
  document.head.appendChild(css);

  window.TDBlockKick = {
    refresh: paint, resolve, clear, sent, worth, odds,
    FLAG_YARDS,
    _send: kind => { rush = { kind }; },
  };
})();
