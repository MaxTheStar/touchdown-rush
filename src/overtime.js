// ============================================================
// TOUCHDOWN FUN — overtime.js: 🔀 BOTH TEAMS GET THE BALL (Round 18, pick ⑥)
// ------------------------------------------------------------
// Overtime was pure sudden death: the first score of any kind won, so a field goal
// on the first drive meant the other team never touched the ball. That is how it
// used to work in the NFL too, and it is the rule the NFL changed.
//
// Now overtime follows the modern NFL rule:
//
//     🏈 a TOUCHDOWN on the first possession ends the game — they never get the ball
//     🥅 a FIELD GOAL on the first possession does NOT — the other team gets a drive:
//          · they score a touchdown   → they win
//          · they kick a field goal   → tied again, and now it is sudden death
//          · they fail to score       → the first team wins
//     ⚡ once both teams have had the ball, the next score of any kind wins
//
// The whole rule is one pure question — `decided(margin, ended)` — asked in the three
// places the old code said "a lead in overtime ends the game":
//
//     margin  = my score − their score (0 → never decided)
//     ended   = which teams' possessions have ended in overtime { you, cpu }
//     decided = margin ≠ 0 AND ( the lead is a touchdown or more  OR  both have had the ball )
//
// ⚠️ A "possession" ENDS when the drive does (a score, a turnover, a punt, a turnover
// on downs) — `finishCpuDrive()` tells it about theirs, `startNextPlay()` about yours.
// ⚠️ THE FLAGS ONLY RESET WHEN OVERTIME FIRST BEGINS, not at every extra 2:00 period, so
// a second overtime picks up as the sudden death it already is.
// ⚠️ Arcade overtime has no kickoff or coin toss — the ball stays where it is, so the
// drive in progress when time ran out is the first possession.
//
// Nothing is saved. main.js asks `decided()` where it used to compare the scores.
// ============================================================
(function () {
  'use strict';

  let ended = { you: false, cpu: false };
  let noted = false;          // the "other team gets a drive" line is said once

  const start  = () => { ended = { you: false, cpu: false }; noted = false; };
  const reset  = start;
  const driveEnded = who => { if (who === 'you' || who === 'cpu') ended[who] = true; };

  // Is the game over? (pure — every combination can be checked without a game)
  function decided(margin, e) {
    e = e || ended;
    if (!margin) return false;
    return Math.abs(margin) >= 6 || !!(e.you && e.cpu);
  }

  // The line to say when somebody leads but the game goes on, or null.
  function note(margin) {
    if (!margin || decided(margin) || noted) return null;
    noted = true;
    return margin > 0 ? '🔀 OT: a field goal is not enough — they get the ball' : '🔀 OT: they kicked a field goal — you get the ball';
  }

  window.TDOT = { start, reset, driveEnded, decided, note, _ended: () => ({ you: ended.you, cpu: ended.cpu }) };
})();
