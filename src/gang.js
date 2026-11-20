// ============================================================
// TOUCHDOWN FUN — gang.js: 🛡 GANG TACKLE (Round 27, pick ⑦)  window.TDGang
// ------------------------------------------------------------
// One defender was always enough to stop a runner, and one defender was never enough to be SURE: your 💪 stiff arm (a shop item, or a 🛡 Bruiser's
// trait) gets one roll per play to shrug the first tackler off. Real football has the other half: you can shed one man, you cannot shed a pile.
// Now, if a SECOND defender is within 2.4 tackle-lengths (36 px) of the runner at the contact, it is a GANG TACKLE: the stiff arm gets no roll at all
// (it keeps its once-per-play use for the next contact), and the announcer says so, once per play, only when you actually had a stiff arm to lose.
// ⚠️ IT ONLY TAKES AWAY SOMETHING YOU PAID FOR, so for a player with no stiff-arm gear or trait the game is byte-identical (the roll never happened).
// ⚠️ IT DOES NOT ADD A TACKLE OR A YARD: a lone tackler behaves exactly as before. NOT MEASURED against a full game: how often two defenders
// are that close at contact on a real play is unknown here; the effect is capped by the stiff arm's own chance (the gear's 10-25%) and one use a play.
// Pure helpers only; main.js `checkTackle` asks `count()` and `isGang()`, and resets `G.gangSaid` each snap. Nothing is saved.
// ============================================================
(function () {
  'use strict';
  const REACH = 2.4;      // tackle-lengths: how far a second man may be and still pile on
  // how many defenders are within REACH tackle-lengths of the carrier (pure on positions)
  function count(defense, c, tackleDist) {
    let n = 0;
    const r = (tackleDist || 15) * REACH;
    for (const d of defense || []) {
      const dx = d.s.x - c.x, dy = d.s.y - c.y;
      if (dx * dx + dy * dy < r * r) n++;
    }
    return n;
  }
  const isGang = n => n >= 2;
  window.TDGang = { count, isGang, REACH };
})();
