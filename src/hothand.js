// ============================================================
// TOUCHDOWN FUN — hothand.js: 🔥 THE HOT HAND (Round 14, pick ③)
// ------------------------------------------------------------
// Some days one player cannot be stopped. He catches three in a row, breaks a
// tackle on each of them, and by the fourth everybody in the stadium knows who
// is getting the ball. That is the hot hand, and until now this game had no
// idea who was having a good day.
//
// ------------------------------------------------------------
// ⚠️ HOW THIS IS NOT 🔥 MOMENTUM (v4.1), WHICH IT MUST NOT BE
// ------------------------------------------------------------
// They share a flame and nothing else, and the difference is worth being able
// to say in one line:
//
//     MOMENTUM is the TEAM, and any good play feeds it — a sack, a takeaway,
//     a third-down stop by a defence you never see.
//     THE HOT HAND is ONE MAN, and only his OWN touches feed it.
//
// So your defence forcing a fumble makes the team hot and does nothing for
// your receiver; your receiver catching three in a row makes HIM hot and
// barely moves the team meter. They can even point opposite ways, which is
// exactly right: a team can be reeling while one man is having the game of his
// life, and that is usually the only reason the game is still close.
//
// ------------------------------------------------------------
// ⚠️ IT IS KEYED TO THE MAN, NOT THE SHIRT
// ------------------------------------------------------------
// 🧑‍🤝‍🧑 Personnel Packages (v4.10) can put a different man in a spot mid-drive.
// If heat lived on the SPOT, your tight end would run on and inherit a hot
// streak he had nothing to do with — and your back would lose his by sitting
// down for one play. So heat is stored against the same key the 📊 stat book
// uses, which already knows how to answer "who is actually standing there?".
//
// ------------------------------------------------------------
// ⚠️ AND THE EFFECT IS SMALL, BECAUSE THE POINT IS THE STORY
// ------------------------------------------------------------
// A fully hot player catches about 5 points more often and runs 3% faster.
// That is enough to notice across a drive and nowhere near enough to break a
// game — the flame over his head is doing most of the work, and it should.
// Heat also bleeds away every single play, so nobody stays hot by standing
// still; it is a record of what you have done LATELY, which is the only kind
// of hot that means anything.
// ============================================================
(function () {
  'use strict';

  const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);

  const MAX        = 100;
  const HOT_AT     = 60;    // the flame lights here
  const COOL_PLAY  = 9;     // …and everybody loses this much every play
  const CATCH_GAIN = 26;    // a catch that went somewhere
  const RUN_GAIN   = 22;    // a carry of 4+ yards
  const BIG_BONUS  = 14;    // …with extra for a really big one
  const TD_GAIN    = 34;    // a touchdown is the hottest thing you can do
  const MISS_COST  = 20;    // a drop or an incompletion thrown at him
  const LOSS_COST  = 16;    // stuffed for no gain or less
  const BIG_PLAY   = 18;    // yards that count as "really big"
  const CATCH_ADD  = 0.05;  // at full heat: how much more often he hauls it in
  const SPEED_ADD  = 0.03;  // …and how much quicker he runs

  let heat = {};            // key -> 0…100
  let tag = null;           // the floating 🔥 over the hot man
  let hottest = null;       // the offense index the flame is following

  const td = () => window.__td || null;

  // The same question 📊 gamestats.js asks: who is REALLY standing in this
  // spot? `null` from personnel.js (its default) means "the usual man".
  function keyOf(idx) {
    const sub = (window.TDPersonnel && TDPersonnel.subAt) ? TDPersonnel.subAt(idx) : null;
    return sub ? sub.key : idx;
  }

  const heatAt = idx => heat[keyOf(idx)] || 0;
  const isHot = idx => heatAt(idx) >= HOT_AT;
  // 0 at the threshold, 1 when he is as hot as he can get — so the effect
  // fades in rather than snapping on at 60.
  const share = idx => clamp((heatAt(idx) - HOT_AT) / (MAX - HOT_AT), 0, 1);

  // ---- what the rest of the game asks -------------------------------------
  // Both return the "nothing to see here" value for anybody who is not hot, so
  // a game where nobody gets going is byte-for-byte the game without this file.
  const catchAdd = idx => (isHot(idx) ? CATCH_ADD * (0.5 + 0.5 * share(idx)) : 0);
  const speedMult = idx => (isHot(idx) ? 1 + SPEED_ADD * (0.5 + 0.5 * share(idx)) : 1);

  // ============================================================
  // EARNING IT
  // ------------------------------------------------------------
  // main.js calls this once per play, from the same place it tells the 📊 stat
  // book what happened — so "what counts" is decided in exactly one spot.
  // ============================================================
  function play(result, idx, gain) {
    // Everybody cools off a little, every single play, including the man who
    // just did something. Heat is about LATELY.
    for (const k of Object.keys(heat)) heat[k] = Math.max(0, heat[k] - COOL_PLAY);

    if (idx == null || idx < 0) { paint(); return; }
    const k = keyOf(idx);
    const yds = Math.round(gain || 0);
    let d = 0;
    if (result === 'touchdown') d = TD_GAIN;
    else if (result === 'incomplete') d = -MISS_COST;
    else if (result === 'interception') d = -MISS_COST;
    else if (yds >= BIG_PLAY) d = CATCH_GAIN + BIG_BONUS;
    else if (yds >= 4) d = RUN_GAIN;
    else if (yds <= 0) d = -LOSS_COST;
    else d = 6;                                   // a couple of yards is something
    heat[k] = clamp((heat[k] || 0) + d, 0, MAX);
    paint();
  }

  // A pass thrown at him that never arrived cools HIM specifically, even though
  // the play's "carrier" was the quarterback.
  function targeted(idx, caught) {
    if (idx == null || idx < 0) return;
    const k = keyOf(idx);
    if (!caught) heat[k] = clamp((heat[k] || 0) - MISS_COST, 0, MAX);
    paint();
  }

  function newGame() { heat = {}; hottest = null; paint(); }

  // ============================================================
  // THE FLAME
  // ------------------------------------------------------------
  // ⚠️ ITS OWN FLOATING TAG, NOT THE PLAYER'S NAME LABEL. Two other files
  // write those labels — main.js sets them up and 🧑‍🤝‍🧑 personnel.js rewrites
  // them at every line-up — so a 🔥 appended there would be wiped the next time
  // anybody substituted, or would survive on a man who had gone cold. A
  // separate tag that follows the hot man cannot be argued with.
  // ============================================================
  function ensureTag() {
    const t = td();
    if (tag || !t || !t.G || !t.G.scene || !t.G.scene.add) return tag;
    try {
      tag = t.G.scene.add.text(0, 0, '🔥', {
        fontFamily: 'Arial Black, Arial', fontSize: '14px',
        color: '#ffb347', stroke: '#000', strokeThickness: 4
      }).setOrigin(0.5).setDepth(9).setVisible(false);
    } catch (e) { tag = null; }
    return tag;
  }

  // Who is hottest right now? Only the four men who can carry the ball.
  function paint() {
    let best = null, bestHeat = HOT_AT;
    for (let i = 0; i <= 3; i++) {
      const h = heatAt(i);
      if (h >= bestHeat) { bestHeat = h; best = i; }
    }
    hottest = best;
  }

  // Called every frame from main.js's updateHUD, next to the other floating
  // tags, so the flame sits over the right head as he moves.
  function follow() {
    const t = td();
    if (!t || !t.G || !t.G.team) { if (tag) tag.setVisible(false); return; }
    const el = ensureTag();
    if (!el) return;
    const man = (hottest != null) ? t.offense[hottest] : null;
    const onField = man && man.s && man.s.visible && t.G.state !== 'menu';
    if (!onField) { el.setVisible(false); return; }
    el.setVisible(true);
    el.setPosition(man.s.x + 13, man.s.y - 20);
  }

  window.TDHot = {
    // main.js asks these
    play, targeted, newGame, follow, catchAdd, speedMult,
    // and these are for the tests, and for anything that wants to know
    heatAt, isHot, hottest: () => hottest,
    _set: (idx, v) => { heat[keyOf(idx)] = clamp(v, 0, MAX); paint(); },
    consts: () => ({ HOT_AT, COOL_PLAY, CATCH_GAIN, RUN_GAIN, TD_GAIN, MISS_COST, CATCH_ADD, SPEED_ADD }),
  };
})();
