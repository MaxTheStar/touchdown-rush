// ============================================================
// TOUCHDOWN FUN — personnel.js: 🧑‍🤝‍🧑 PERSONNEL PACKAGES (Round 13, pick ⑥)
// ------------------------------------------------------------
// Real football teams change WHO is on the field from one play to the next.
// Third and long? Take the running back off and send in another receiver.
// Fourth and one at the goal line? Bring on the big guys and push.
//
// This game never did that. The same seven men lined up for every snap of
// every game: a quarterback, a back, two receivers and three linemen.
// 🧩 Formations move those seven AROUND; this file changes WHICH men are out
// there. And the men who run on are men you actually own:
//
//   ⚖️ REGULAR   One back, two receivers. Exactly what the game has always
//                done. ⚠️ THE DEFAULT ON PURPOSE — while it is selected, every
//                question main.js asks this file gets "no change" back, so the
//                game plays exactly as it did before this file existed. Every
//                new drive starts here.
//
//   🙌 3 WIDE    Your running back sits down and your BACKUP RECEIVER comes on
//                (the one 🏥 injuries.js signed for the bench). He lines up in
//                the slot and plays like a receiver, working himself open.
//                ⚠️ The price is real: nobody to hand the ball to, nobody to
//                keep in and block (🛡 MAX PROTECT switches off), and with no
//                run to worry about, the defense sends more blitzes.
//
//   🧱 HEAVY     Receiver #2 sits down and your TIGHT END comes on. ⚠️ He has
//                been on your roster since your very first draft and has NEVER
//                PLAYED A SNAP. The field only had room for seven, and none of
//                those seven spots was his. This is his debut.
//                He's a big man: a step slower on a route, and he doesn't dance
//                his way open, so your passing game loses its second receiver.
//                The payoff is on the ground. On a run he leads the way, and a
//                runner stopped in the pile FALLS FORWARD another yard and a
//                half. Stopped a yard short of the goal line, that step is six
//                points — measured, not hoped: see the DEVLOG for v4.10.
//
// ------------------------------------------------------------
// WHO GETS THE CREDIT
// ------------------------------------------------------------
// "The men you send in are men you actually own" is the whole promise, so a
// substitute has to be a REAL man everywhere the game keeps score: ⭐ his own
// trait works while he's out there, 📊 the box score and ⭐ Player of the Game
// credit HIS catches (your tight end can win it!), and 🌟 the announcer uses
// his nickname. Those files each ask `subAt(spot)` — "is somebody different
// standing in this spot?" — and when the answer is null (always, on ⚖️
// REGULAR) they do exactly what they did before.
//
// ⚠️ NOTHING IS SWAPPED IN YOUR SAVED ROSTER. 🏥 injuries.js really does swap
// a stand-in into a starting slot, because an injury lasts whole games. A
// personnel change lasts a few plays, and writing the roster to the save on
// every down would be slow and — if the game closed mid-drive — would leave
// your running back on the bench for good. So this is a question asked at
// the moment it matters, never a change written down.
//
// ------------------------------------------------------------
// WHERE IT LIVES
// ------------------------------------------------------------
// A row in the 🗣️ AUDIBLE panel, above 🛡 pass protection, because who is on
// the field decides what protection is possible. Opening that panel pauses
// ⏳ the play clock, so a substitution can never cost you a delay of game.
//
// ⚠️ A NICE ACCIDENT, the same one protection has: ⏰ the hurry-up hides the
// 🗣️ button, so a no-huddle offense can't substitute. That is exactly real
// football — the reason to go no-huddle is to stop the DEFENSE changing its
// players, and the price is that you don't get to change yours either.
//
// ⚠️ It is STICKY for the rest of the drive (like protection, it's something
// a team LIVES in — re-picking it every down would turn it into a chore) and
// goes back to ⚖️ REGULAR whenever the ball changes hands. Nothing is saved
// between games.
// ============================================================
(function () {
  'use strict';

  const $ = id => document.getElementById(id);
  const td = () => window.__td || null;
  const G = () => { const t = td(); return t ? t.G : null; };
  const pick = a => a[Math.floor(Math.random() * a.length)];

  // ---- the three packages ---------------------------------------------------
  const PACKS = [
    { id: 'regular', ic: '⚖️', name: 'REGULAR',
      say: 'One back, two receivers. The run and the pass both stay on the menu.' },
    { id: 'wide', ic: '🙌', name: '3 WIDE',
      say: 'Three receivers. But nobody to hand it to or keep in to block, and they blitz more.' },
    { id: 'heavy', ic: '🧱', name: 'HEAVY',
      say: 'Your tight end blocks and the pile falls forward. But only one receiver goes deep.' },
  ];

  // ---- the numbers (each one measured — see the DEVLOG for v4.9) -----------
  const TE_SLOT     = 4;     // draft.js SLOTS = [QB, RB, WR, WR, TE, LB, CB, S] — the tight end
  const TE_SPEED    = 0.84;  // his route speed, as a share of a receiver's
  const PUSH_PX     = 15;    // the pile falls forward a yard and a half (10px = 1 yard)…
  const PUSH_FROM   = -2;    // …for a runner stopped from 2 yards BEHIND the line…
  const PUSH_TO     = 4;     // …to 4 yards past it. Beyond that he was in the open, not a pile.
  const SEAL_DIST   = 30;    // = main.js BLOCK_DIST: this close to the tight end = blocked
  const BLOCK_SPEED = 193;   // = main.js OL_SPEED: when he blocks, he moves like a lineman
  const WIDE_BLITZ  = 0.10;  // extra blitz chance against an empty backfield

  // Where the slot receiver stands, by 🧩 formation. In SPREAD and I-FORM he
  // takes the open side; in the two TRIPS looks he slots in BETWEEN the pair,
  // which turns them into real trips — three receivers to one side.
  const SLOT_X = { 'SPREAD': 395, 'TRIPS R': 415, 'TRIPS L': 118, 'I-FORM': 460 };

  // ---- state (none of it saved) ---------------------------------------------
  let id = 'regular';       // the package on the field right now
  let tip = 'regular';      // what the coach would send in for THIS down
  let hinted = false;       // the once-a-game nudge toward the 🗣️ button
  let bench = null;         // the backup receiver for 3 WIDE, looked up at each line-up
  let playedTE = false;     // did the tight end take a snap this game?
  let subUsed = null;       // the backup who ran on in 3 WIDE this game (for the stat book)

  const pack = () => PACKS.find(p => p.id === id) || PACKS[0];

  // ============================================================
  // WHO COMES ON
  // ============================================================
  // Your tight end: whoever is in roster slot 4 right now. (If 🏥 injuries.js
  // has a stand-in covering him, it's the stand-in — same as every other slot.)
  function tightEnd() {
    try { return (window.TDDraft && TDDraft.playerAt) ? TDDraft.playerAt(TE_SLOT) : null; }
    catch (e) { return null; }
  }
  // Your running back, just for his name on the ⚖️ REGULAR button.
  function runningBack() {
    try { return (window.TDDraft && TDDraft.playerAt) ? TDDraft.playerAt(1) : null; }
    catch (e) { return null; }
  }
  // The receiver who comes off the bench. Asked fresh at every line-up, because
  // the bench can change between games (a backup covering an injury is busy).
  function backup() {
    try { return (window.TDInjury && TDInjury.available) ? TDInjury.available('WR') : null; }
    catch (e) { return null; }
  }
  // You can only send on a man you have.
  function can(which) {
    if (which === 'wide')  return !!(bench || backup());
    if (which === 'heavy') return !!tightEnd();
    return true;
  }

  // ============================================================
  // WHAT THE REST OF THE GAME ASKS
  // ------------------------------------------------------------
  // Every one of these answers "no change" on ⚖️ REGULAR. That's what keeps the
  // default game byte-identical to the one before this file.
  // ============================================================

  // Is somebody different standing in this spot on the field? `spot` is an
  // index into main.js's `offense` array (0 QB, 1 RB, 2 WR #1, 3 WR #2).
  //   key       → the stat book's line for him (gamestats.js)
  //   rosterIdx → his roster slot, for his nickname (null = off the bench)
  //   player    → a copy of the man himself, for his ⭐ trait (traits.js)
  function subAt(spot) {
    if (id === 'wide' && spot === 1) {
      const b = bench || backup();
      return { key: 'sub', rosterIdx: null, pos: 'WR', player: b ? b.player : null };
    }
    if (id === 'heavy' && spot === 3) {
      return { key: TE_SLOT, rosterIdx: TE_SLOT, pos: 'TE', player: tightEnd() };
    }
    return null;
  }

  // Is there a running back on the field to hand the ball to (or keep in)?
  const hasBack = () => id !== 'wide';

  // A substitute runs like HIS position, not like the man whose spot he took:
  // 'wr' = a slot receiver, 'te' = a tight end, null = nobody different here.
  function runsLike(o) {
    const t = td(); if (!t || !o) return null;
    if (id === 'wide'  && o === t.offense[1]) return 'wr';
    if (id === 'heavy' && o === t.offense[3]) return 'te';
    return null;
  }

  // Is a RUN on right now? The back has it after a hand-off, or the
  // quarterback has taken off past the line himself — and nothing was thrown.
  function running() {
    const t = td(), g = G();
    if (!t || !g || g.state !== 'live' || g.hasPassed || !g.ballCarrier) return false;
    const c = g.ballCarrier;
    return c === t.offense[1] || (c === t.offense[0] && c.s.y < g.losY);
  }

  // 🧱 THE LEAD BLOCK. On a HEAVY run the tight end forgets his route and goes
  // to get the man most likely to make the tackle — the chaser nearest the
  // ball — and stands between him and the runner. Returns true when it has
  // moved him, so main.js skips his route for this frame.
  function leadBlock(o) {
    if (id !== 'heavy') return false;
    const t = td();
    if (!t || o !== t.offense[3] || !running()) return false;
    const c = G().ballCarrier.s;
    let best = null, bestD = Infinity;
    for (const d of t.defense) {
      const dd = Math.hypot(d.s.x - c.x, d.s.y - c.y);
      if (dd < bestD) { bestD = dd; best = d; }
    }
    if (!best) { o.s.setVelocity(0, 0); return true; }
    // A spot just on the runner's side of him, like a lineman sets up on a rusher.
    const a = Math.atan2(c.y - best.s.y, c.x - best.s.x);
    t.steer(o.s, best.s.x + Math.cos(a) * 14, best.s.y + Math.sin(a) * 14, BLOCK_SPEED);
    return true;
  }

  // …and a chaser he has hold of is BLOCKED: main.js slows him to what a
  // blocked pass rusher keeps (`diff().rushSlow`) — one rule for both.
  function sealed(d) {
    if (id !== 'heavy' || !d || !running()) return false;
    const te = td().offense[3].s;
    return Math.hypot(te.x - d.s.x, te.y - d.s.y) < SEAL_DIST;
  }

  // 🧱 THE PILE FALLS FORWARD. Called by main.js at the moment of a tackle,
  // before the spot is marked. A run out of HEAVY that is stopped in the pile —
  // from 2 yards behind the line to 4 past it — goes another yard and a half,
  // because eight big bodies are all leaning the same way. Returns true if it
  // moved the runner (main.js then checks whether that step crossed the goal
  // line). ⚠️ Never on a catch: a receiver tackled downfield is not in a pile.
  // ⚠️ IT IS A YARD AND A HALF, NOT A FREE TOUCHDOWN. Measured in real plays:
  // stopped 0.8 yards short of the goal it scores; stopped 2.2 short it does
  // not, and the same sneak out of ⚖️ REGULAR is marked where he fell.
  function pushPile() {
    if (id !== 'heavy') return false;
    const t = td(), g = G();
    if (!t || !g || g.hasPassed || !g.ballCarrier) return false;
    const c = g.ballCarrier;
    if (c !== t.offense[0] && c !== t.offense[1]) return false;
    const gained = (g.losY - c.s.y) / 10;            // yards past the line of scrimmage
    if (gained < PUSH_FROM || gained > PUSH_TO) return false;
    c.s.y -= PUSH_PX;
    t.sayComment(pick(['🧱 The pile falls forward!', '🧱 The big guys push the pile!',
                       '🧱 Pushed forward in the pile!']));
    return true;
  }

  // 🙌 With nobody in the backfield there is no run to worry about and nobody
  // to pick up a blitzer, so the defense sends one more often. main.js adds
  // this to its blitz odds — and never on EASY, where the promise is no blitz.
  // ⚠️ The defense makes its plan when the down is SET UP, so it reacts to the
  // package it SAW there: switch to 3 WIDE at the line and they only catch on
  // from the next snap. That's fair — you surprised them.
  const blitzShift = () => (id === 'wide' ? WIDE_BLITZ : 0);

  // ============================================================
  // LINING UP
  // ------------------------------------------------------------
  // main.js calls this from `layoutSkill`, right after the formation has put
  // the back and the receivers on its spots — so a substitute always starts
  // from the formation, and a 🧩 formation change lines him up again too.
  // ============================================================
  function lineUp(L, f) {
    const t = td(); if (!t) return;
    const off = t.offense;
    bench = backup();
    // Can't send on a man you don't have (no bench yet, or no tight end).
    if (id === 'wide' && !bench) id = 'regular';
    if (id === 'heavy' && !tightEnd()) id = 'regular';
    label(off);
    if (id === 'wide') {
      t.place(off[1], (f && SLOT_X[f.name]) || 395, L + 14);   // up on the line, in the slot
    } else if (id === 'heavy') {
      const right = !(f && f.wr2 < 266);                        // on receiver #2's side
      t.place(off[3], right ? 346 : 186, L + 16);               // shoulder to shoulder with the tackle
    }
  }

  // The tags floating over their heads. ⚠️ They live on the SPRITES, which
  // every package shares, so they're put right at every line-up — otherwise a
  // "TE" tag would still be floating over receiver #2 on the next drive. On
  // ⚖️ REGULAR with nothing changed, this touches nothing at all.
  function label(off) {
    const set = (o, txt, px) => {
      if (!o || !o.label || o.label.text === txt) return;
      o.label.setText(txt);
      o.label.setFontSize(px + 'px');
    };
    set(off[1], id === 'wide'  ? '3'  : 'RB', id === 'wide'  ? 13 : 10);
    set(off[3], id === 'heavy' ? 'TE' : '2',  id === 'heavy' ? 11 : 13);
  }

  // ============================================================
  // THE GAME'S RHYTHM
  // ============================================================
  function newGame() {
    id = 'regular'; tip = 'regular'; hinted = false;
    bench = null; playedTE = false; subUsed = null;
    paint();
  }
  // The ball changed hands — the next drive comes out in its base package.
  // ⚠️ The name tags live on the SPRITES, and between drives those same sprites
  // are your DEFENDERS, so they have to go back here and not wait for the next
  // line-up: otherwise your safety covers a receiver wearing a "TE".
  function newDrive() {
    id = 'regular';
    const t = td();
    if (t) label(t.offense);
  }

  // The ball was snapped: whoever is out there has now really PLAYED.
  function snapped() {
    if (id === 'heavy') playedTE = true;
    if (id === 'wide' && bench) subUsed = bench.player;
  }

  // A new line of scrimmage: what would the coach send in?
  function newPlay() {
    const g = G(); if (!g) return;
    tip = suggest({
      down: g.down, los: g.losYards, fd: g.firstDownYards, twoPt: !!g.twoPtTry,
      quarter: g.quarter, clock: g.clock, behind: g.score < g.oppScore, drill: !!g.drillGame,
    });
    paint();
    hint(g);
  }

  // 💡 THE COACH'S CALL. Short yardage wants the big guys; long yardage (or
  // the clock running out while you're behind) wants receivers; everything
  // else is a normal down. A pure function, so it's easy to test.
  function suggest(c) {
    const togo = Math.max(0, Math.round(c.fd - c.los));   // yards for a first down (or the goal line)
    const toGoal = Math.round(100 - c.los);
    if (c.twoPt || toGoal <= 3 || togo <= 2) return 'heavy';
    const late = c.drill || (c.quarter >= 4 && c.clock <= 120 && c.behind);
    if (late || togo >= 13 || (c.down >= 3 && togo >= 7)) return 'wide';
    return 'regular';
  }

  // "3rd & 8", "1st & goal", "Two-point try" — how the down reads out loud.
  function situation(g) {
    if (g.twoPtTry) return 'Two-point try';
    const ord = ['', '1st', '2nd', '3rd', '4th'][g.down] || (g.down + 'th');
    if (g.firstDownYards >= 100) return ord + ' & goal';
    return ord + ' & ' + Math.max(1, Math.round(g.firstDownYards - g.losYards));
  }

  // ⚠️ ONE SENTENCE, ONCE A GAME — the first time the coach would change the
  // personnel. A choice hidden inside a panel a nine-year-old has to go looking
  // for is a choice nobody makes. After that, the 💡 in the row does the job.
  // (Same rule 🔇 silent.js follows. Count the voices already talking.)
  function hint(g) {
    if (hinted || tip === 'regular' || tip === id || !can(tip)) return;
    if (g.state !== 'presnap') return;                        // 4th down asks its own question first
    if (document.body.classList.contains('hurry')) return;    // no huddle, no substitutions
    hinted = true;
    const p = PACKS.find(x => x.id === tip);
    const line = '💡 ' + situation(g) + ': try ' + p.ic + ' ' + p.name + ' in 🗣️';
    setTimeout(() => {
      const g2 = G();
      if (g2 && g2.state === 'presnap') { try { td().sayComment(line); } catch (e) {} }
    }, 650);
  }

  // ============================================================
  // THE ROW INSIDE THE 🗣️ AUDIBLE PANEL
  // ------------------------------------------------------------
  // ⚠️ Its own element, #pk-row — a SIBLING of #aud-body, never inside it:
  // audible.js rewrites that body's innerHTML on every render, and anything of
  // ours in there would be wiped the first time you opened the panel.
  // ============================================================
  function paint() {
    const row = $('pk-row'); if (!row) return;
    const g = G();
    const rb = runningBack(), te = tightEnd(), bk = bench || backup();
    const cur = pack();
    // Every button names the man who would be out there — that's the point.
    const who = {
      regular: rb ? rb.name + ' at RB' : 'a back + 2 receivers',
      wide: bk ? '+ ' + bk.player.name + (bk.fits ? '' : ' (' + bk.player.pos + ')') : 'no backup',
      heavy: te ? '+ ' + te.name + ' (TE)' : 'no tight end',
    };
    const tipPack = PACKS.find(p => p.id === tip);
    const tipLine = (g && tip !== 'regular' && g.down)
      ? '<i>💡 ' + situation(g) + ': ' + tipPack.ic + ' ' + tipPack.name + '</i>' : '';
    // Tell the story of the package that's ON: who came on for whom, and the price.
    let story = cur.say;
    if (cur.id === 'wide' && bk && rb) story = bk.player.name + ' in for ' + rb.name + '. ' + cur.say;
    if (cur.id === 'heavy' && te) story = te.name + ' makes his debut at tight end. ' + cur.say;

    row.innerHTML =
      '<div class="pk-head"><span>🧑‍🤝‍🧑 PERSONNEL</span>' + tipLine + '</div>' +
      '<div class="pk-opts">' +
      PACKS.map(p =>
        '<div class="pk-btn' + (p.id === cur.id ? ' on' : '') + (can(p.id) ? '' : ' off') +
          (p.id === tip && p.id !== 'regular' ? ' tip' : '') + '" data-id="' + p.id + '">' +
          '<b>' + p.ic + ' ' + p.name + '</b><span>' + who[p.id] + '</span>' +
        '</div>').join('') +
      '</div>' +
      '<div class="pk-say">' + story + '</div>';
    row.querySelectorAll('.pk-btn').forEach(el => {
      el.addEventListener('pointerdown', e => {
        // The panel behind this has its own taps; don't let ours run the play.
        e.preventDefault();
        e.stopPropagation();
        choose(el.getAttribute('data-id'));
      });
    });
  }

  // Send them on. Only at the line of scrimmage — never in the middle of a play.
  function choose(next) {
    const g = G(), t = td();
    if (!g || !t || g.state !== 'presnap') return;
    if (!PACKS.some(p => p.id === next) || next === id || !can(next)) return;
    id = next;
    t.layoutSkill(g.losY);          // run the new man on and line everybody up again…
    t.drawRoutePreview();           // …and draw his route, so you SEE the change before the snap
    paint();
    // 🛡 3 WIDE switches MAX PROTECT off (there's no back to keep in) — repaint that row too.
    if (window.TDProtect && TDProtect.paint) TDProtect.paint();
    if (window.TDSound) TDSound.sting('coin');
    const te = tightEnd();
    t.sayComment(id === 'wide'  ? '🙌 3 WIDE — ' + (bench ? bench.player.name : 'the backup') + ' comes on!'
               : id === 'heavy' ? '🧱 HEAVY — ' + (te ? te.name : 'the tight end') + ' comes on!'
               : '⚖️ Back to REGULAR');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', paint);
  else paint();

  window.TDPersonnel = {
    // main.js asks these
    lineUp, hasBack, runsLike, leadBlock, sealed, pushPile, blitzShift,
    teSpeed: () => TE_SPEED,
    newGame, newDrive, newPlay, snapped,
    // traits.js, gamestats.js and nicknames.js ask this one
    subAt,
    subName: () => (subUsed ? subUsed.name : null),
    played: which => (which === 'te' ? playedTE : which === 'sub' ? !!subUsed : false),
    // the panel, and tests
    paint, set: choose, call: () => id, tip: () => tip, suggest,
    packs: () => PACKS.map(p => p.id),
  };
})();
