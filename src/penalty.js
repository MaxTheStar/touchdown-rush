// ============================================================
// TOUCHDOWN FUN — penalty.js: 🟨 PENALTIES (Round 12, pick ⑤)
// ------------------------------------------------------------
// Football has a referee, and until now he has never once thrown a flag.
// He stands in the backfield every single down (main.js puts him there) and
// watches eleven guys hold, grab and jump early with total impunity.
//
// ⚠️ THE FLAG IS YELLOW. THE CHALLENGE FLAG IS RED. That is not decoration —
// it is the actual rule, and it is how you tell these two features apart at a
// glance:
//
//   🟨 THE REFEREE throws a YELLOW flag when a player breaks a rule.
//      That is this file.
//   🚩 THE COACH throws a RED flag when he thinks the REFEREE got it wrong.
//      That is flag.js (the Coach's Challenge, Round 9 pick ⑧).
//
// ------------------------------------------------------------
// THE ONE DECISION THIS FEATURE EXISTS FOR
// ------------------------------------------------------------
// When the defense fouls you, you do NOT simply get the yards. You get a
// CHOICE, and it is one of the best choices in football:
//
//   ✅ ACCEPT  — take the penalty. The play is wiped out and you take the
//                yards and whatever down the rule gives you.
//   ❌ DECLINE — no thanks, keep what actually happened on the field.
//
// And the reason that is a real decision is that ACCEPTING IS OFTEN WRONG.
// Defensive holding is five yards. If you just ran for twenty, taking the five
// would be throwing fifteen yards in the bin. A real coach declines there
// without blinking, and after a couple of these Max will too.
//
// So the panel prints BOTH answers as down-and-distance — "1ST & 10 at the 35"
// against "2ND & 3 at the 42" — because the whole lesson is comparing them.
// It is the same philosophy as the 🧮 Fourth-Down Helper: show the reasoning,
// let the coach coach. (It tags the one that gains more field, and that tag is
// a FACT, not an order — sometimes the down matters more than the yards.)
//
// ------------------------------------------------------------
// ⚠️ THE WARNING PRINTED ON THE DRAFT BOARD
// ------------------------------------------------------------
// Max's chart says it straight out: **penalties that fire too often stop being
// football.** A flag every other down is not a rulebook, it is a nuisance —
// and it would wreck the pacing of a game whose quarters are 150 seconds long.
//
// So the rate is not a number somebody felt good about. It is measured, and
// FOUR separate brakes hold it down:
//
//   1. A BASE CHANCE of about one eligible play in twelve.
//   2. A COOLDOWN — never a flag within two plays of the last one, so you can
//      never get two in a row and never feel picked on.
//   3. A PER-GAME CAP of four. A real NFL game averages about six per team,
//      over roughly four times as many plays as a game here.
//   4. A LIST OF PLAYS THAT ARE SIMPLY NEVER FLAGGED (see below).
//
// ------------------------------------------------------------
// ⚠️ THE PLAYS THE REFEREE SWALLOWS HIS WHISTLE ON, AND WHY
// ------------------------------------------------------------
//   · A TOUCHDOWN. Never, ever. Calling a holding penalty that wipes out a
//     touchdown Max just scored is the single most miserable thing this
//     feature could do. Real football allows it; this game does not. That is
//     a deliberate fun rule, not an oversight.
//   · AN INTERCEPTION or any play that hands the ball over. The ball has
//     already changed hands — untangling that is a rules rabbit hole, and
//     "your pick-six came back" is the same misery as above.
//   · A PENALTY ON YOU ON 4TH DOWN. Losing a fourth-down conversion to a
//     holding flag is the other heartbreaker. The DEFENSE can still be
//     flagged on 4th down, because that one rescues your drive — the
//     asymmetry is on purpose and it always favours the player.
//   · A SAFETY, A TWO-POINT TRY, A SPIKE or A KNEEL. These never reach this
//     file at all: main.js settles them and returns before the hook. Worth
//     knowing, because it means no special case had to be written for them.
//
// ------------------------------------------------------------
// HOW IT PLUGS IN
// ------------------------------------------------------------
// Exactly the shape flag.js and the ⚡ onside kick already use, because it is
// the shape this game uses for "hold the clock, ask a question, roll on with
// the answer":
//
//   endPlay  →  TDPenalty.offered(call)   is there a flag on this play?
//            →  TDPenalty.ask(done)       park the dead-ball timer, ask
//            →  done({ next })            here is the down you are playing next
//
// ⚠️ AND IT MUST NEVER RUN ALONGSIDE THE COACH'S CHALLENGE. Both features hook
// the same three lines of endPlay and both park the game with
// `G.deadUntil = MAX_SAFE_INTEGER`. If they ever fired on the same play you
// would get two panels stacked on each other, two callbacks racing to set
// `G.next`, and a dead-ball timer that only one of them would ever release.
// main.js therefore asks the PENALTY FIRST and only offers the challenge if
// no flag came out — which is also just correct football: you do not review
// the spot on a play that a penalty already wiped off the board.
//
// ⚠️ WHEN YOU ARE ON DEFENSE the flags are AUTOMATIC — see cpuPlay() at the
// bottom. There is no panel, because there is no decision for you to make:
// you do not coach their offense. It still matters that it happens, though.
// A rulebook that only ever punished one team would be a bug you could feel
// long before you could prove it.
// ============================================================
(function () {
  'use strict';

  // Short name — TDStats.shared adds the "tdr-" (so this is "tdr-penalty").
  const KEY = 'penalty';
  const $ = id => document.getElementById(id);

  const T = window.TDStats ? TDStats.shared : null;
  const store = (k, v) => { if (T) T.store(k, v); };
  const load  = (k, f) => (T ? T.load(k, f) : f);

  // ---- The dials (see the warning above — these are MEASURED) --------------
  const FLAG_CHANCE  = 0.085;  // chance of a flag on an eligible play (~1 in 12)
  const DEF_SHARE    = 0.45;   // of those flags, how many are on the DEFENSE
  const COOLDOWN     = 2;      // plays that must pass before another flag
  const PER_GAME     = 4;      // hard cap on flags in one game
  const PANEL_MS     = 6500;   // how long the accept/decline panel waits
  const CPU_CHANCE   = 0.075;  // flags while THEY have the ball (auto-applied)

  // ============================================================
  // THE RULEBOOK
  // ------------------------------------------------------------
  // Each entry knows its name, how many yards it is worth, whether it hands
  // over an automatic first down, and where it is measured FROM:
  //
  //   from: 'los'  — stepped off from the line of scrimmage, which wipes out
  //                  whatever the play gained.
  //   from: 'spot' — stepped off from where the play ENDED, so a long run
  //                  keeps most of itself.
  //
  // That difference is the reason there are two ten-yard penalties in here
  // that look identical on paper and feel completely different in a game.
  // ============================================================
  const DEF_FOULS = [
    { id: 'hold',  name: 'DEFENSIVE HOLDING', yards: 5,  first: true,  from: 'los',
      blurb: 'A defender grabbed your receiver and would not let go.' },
    { id: 'off',   name: 'OFFSIDE',           yards: 5,  first: false, from: 'los',
      blurb: 'They jumped across the line before the ball was snapped.' },
    { id: 'face',  name: 'FACE MASK',         yards: 15, first: true,  from: 'spot',
      blurb: 'He pulled your runner down by the cage on his helmet.' },
    { id: 'pi',    name: 'PASS INTERFERENCE', yards: 0,  first: true,  from: 'los',
      blurb: 'He hit your receiver before the ball ever got there.' },
  ];

  const OFF_FOULS = [
    { id: 'ohold', name: 'HOLDING',               yards: -10, first: false, from: 'los',
      blurb: 'One of your linemen grabbed a jersey to keep his man out.' },
    { id: 'block', name: 'ILLEGAL BLOCK IN THE BACK', yards: -10, first: false, from: 'spot',
      blurb: 'One of your blockers hit a defender from behind.' },
  ];

  // ---- State --------------------------------------------------------------
  let s = null;          // the saved career record
  let sincelast = 99;    // plays since the last flag (starts "cold" so play 1 can be flagged)
  let thisGame = 0;      // flags thrown in this game
  let pending = null;    // the flag currently on the table
  let done = null;       // main.js's callback, held until you answer

  function ensure() {
    if (!s) s = load(KEY, null);
    if (!s || typeof s !== 'object') s = {};
    for (const k of ['called', 'accepted', 'declined', 'onYou', 'onThem']) {
      if (typeof s[k] !== 'number') s[k] = 0;
    }
    if (!Array.isArray(s.log)) s.log = [];
  }
  function save() { store(KEY, s); }

  function newGame() {
    ensure();
    sincelast = 99; thisGame = 0; pending = null; done = null;
    hidePanel();
  }

  // ============================================================
  // SPOTTING THE BALL
  // ------------------------------------------------------------
  // ⚠️ THE HALF-THE-DISTANCE RULE IS REAL, and it is the reason a penalty can
  // never score a touchdown or a safety by itself. A fifteen-yard penalty on
  // the defense when you are already on their 6 does NOT put the ball in the
  // end zone — it gives you half of what is left, so you get the 3. The same
  // going backwards: a ten-yard holding call on your own 4 can never hand the
  // other team two points, it just moves you to the 2.
  //
  // Without this the rulebook would be a scoring machine, which is exactly the
  // kind of thing that looks fine until somebody plays for an hour.
  // ============================================================
  function stepOff(from, yards) {
    if (yards >= 0) return Math.min(from + yards, from + (100 - from) / 2);
    return Math.max(from + yards, from / 2);
  }

  // Turn a new ball spot into a real down. `autoFirst` is the rule's automatic
  // first down; otherwise you get one only if the ball actually reached the
  // marker, and if it didn't you REPLAY the down you were on.
  function spotBall(newLos, curDown, curFd, autoFirst) {
    const los = Math.max(1, Math.min(99, newLos));
    if (autoFirst || los >= curFd) {
      return { los: los, down: 1, fd: Math.min(los + 10, 100) };
    }
    return { los: los, down: curDown, fd: curFd };
  }

  // Where a foul puts the ball. Pass interference is the odd one: it has no
  // fixed yardage at all, because the ball goes to the SPOT OF THE FOUL —
  // wherever the receiver was when he got hit. That is why it is football's
  // scariest penalty, and why it is worth a chunk of field here.
  function applyFoul(foul, call) {
    const base = foul.from === 'spot' && typeof call.spot === 'number' ? call.spot : call.los;
    if (foul.id === 'pi') {
      const deep = 12 + Math.floor(Math.random() * 9);   // 12–20 yards downfield
      return spotBall(stepOff(call.los, deep), call.down, call.fd, true);
    }
    return spotBall(stepOff(base, foul.yards), call.down, call.fd, foul.first);
  }

  // ============================================================
  // IS THERE A FLAG ON THIS PLAY?
  // ------------------------------------------------------------
  // ⚠️ Saying "yes" PARKS A LIVE GAME, exactly like the Coach's Challenge, so
  // every reason to say no is checked before any dice are rolled.
  //
  // ⚠️ `decide()` is kept separate and takes its randomness as an argument so
  // the whole rulebook can be swept without playing a down — the same trick
  // TDFourth.advise() and TDClock.advise() use. That is how the rate above is
  // known to be right rather than hoped to be right.
  // ============================================================
  function eligible(call) {
    if (!call) return false;
    if (thisGame >= PER_GAME) return false;             // brake 3: the per-game cap
    if (sincelast < COOLDOWN) return false;             // brake 2: never two in a row
    if (call.result === 'touchdown') return false;      // never wipe out a score
    if (call.result === 'interception') return false;   // the ball already changed hands
    if (!call.next || call.next.fresh) return false;    // any turnover — same reason
    if (typeof call.spot !== 'number') return false;
    return true;
  }

  function decide(call, rnd) {
    const r = (typeof rnd === 'function') ? rnd : Math.random;
    if (r() >= FLAG_CHANCE) return null;

    // On the defense, or on you? A flag on YOU on 4th down is the heartbreaker
    // we refuse to hand out, so on 4th down it is a defensive flag or nothing.
    const onDefense = r() < DEF_SHARE;
    if (!onDefense && call.down >= 4) return null;

    if (onDefense) {
      // Pass interference only exists on a pass that fell incomplete.
      const pool = DEF_FOULS.filter(f => f.id !== 'pi' || call.result === 'incomplete');
      return { side: 'def', foul: pool[Math.floor(r() * pool.length)] };
    }
    return { side: 'off', foul: OFF_FOULS[Math.floor(r() * OFF_FOULS.length)] };
  }

  function offered(call) {
    ensure();
    hidePanel();
    pending = null;
    sincelast++;
    if (!eligible(call)) return false;

    const hit = decide(call, Math.random);
    if (!hit) return false;

    sincelast = 0;
    thisGame++;
    s.called++;
    if (hit.side === 'def') s.onThem++; else s.onYou++;

    pending = {
      side: hit.side,
      foul: hit.foul,
      call: call,
      penNext: applyFoul(hit.foul, call),
      playNext: call.next,
    };
    save();
    return true;
  }

  // ============================================================
  // ASK (or don't)
  // ------------------------------------------------------------
  // A flag on the DEFENSE is your choice, so we put the panel up. A flag on
  // YOU is not — the other coach takes it or leaves it, and he is not stupid:
  // he takes whichever one is worse for you. There is nothing to ask, so we
  // just say what happened and play on.
  // ============================================================
  function ask(cb) {
    done = cb;
    if (!pending) { finish(null); return; }
    if (pending.side === 'off') { autoAgainstYou(); return; }
    showPanel();
  }

  // Net field position of a down, from YOUR point of view: where the ball is,
  // with a down that is further along counting against it. Used both to tag
  // the better choice on the panel and to let the CPU coach make his.
  function worth(n) {
    if (!n) return -999;
    return n.los - (n.down - 1) * 3.5 - Math.max(0, n.fd - n.los) * 0.35;
  }

  function autoAgainstYou() {
    const p = pending;
    // He accepts if the penalty leaves you worse off than the play did.
    const take = worth(p.penNext) < worth(p.playNext);
    const next = take ? p.penNext : p.playNext;
    s.log.unshift({ name: p.foul.name, side: 'off', took: take });
    s.log = s.log.slice(0, 12);
    save();
    if (window.TDSound) TDSound.sting('lose');
    banner('🟨 ' + p.foul.name + ' — ON YOU',
      take ? (p.foul.yards < 0 ? Math.abs(p.foul.yards) + ' YARD PENALTY · REPLAY THE DOWN'
                               : 'PENALTY ACCEPTED')
           : 'THE PENALTY IS DECLINED — THE PLAY STANDS', take ? 'bad' : 'good');
    setTimeout(() => { hideBanner(); finish({ next: next }); }, 2200);
  }

  function choose(accept) {
    const p = pending;
    if (!p) { finish(null); return; }
    hidePanel();
    if (accept) s.accepted++; else s.declined++;
    s.log.unshift({ name: p.foul.name, side: 'def', took: accept });
    s.log = s.log.slice(0, 12);
    save();
    if (window.TDSound) TDSound.sting(accept ? 'td' : 'coin');
    banner(accept ? '🟨 PENALTY ACCEPTED' : '🟨 PENALTY DECLINED',
      accept ? p.foul.name + ' · ' + downLabel(p.penNext)
             : 'YOU KEEP THE PLAY · ' + downLabel(p.playNext), 'good');
    setTimeout(() => { hideBanner(); finish({ next: accept ? p.penNext : p.playNext }); }, 1700);
  }

  function finish(verdict) {
    const cb = done;
    done = null; pending = null;
    if (cb) { try { cb(verdict); } catch (e) {} }
  }

  // ---- Reading a down out loud --------------------------------------------
  // "1ST & 10 at the 35". The yard line is the football one — the field counts
  // up to 50 in the middle and back down again, so their 20 and your 20 are
  // both "the 20".
  function downLabel(n) {
    if (!n) return '';
    const ord = ['', '1ST', '2ND', '3RD', '4TH'][n.down] || n.down + 'TH';
    const togo = (n.fd >= 100) ? 'GOAL' : String(Math.max(1, Math.round(n.fd - n.los)));
    const yl = Math.round(n.los <= 50 ? n.los : 100 - n.los);
    return ord + ' & ' + togo + ' at the ' + yl;
  }

  // ---- The panel on the field ---------------------------------------------
  function showPanel() {
    const panel = $('pen-panel');
    if (!panel || !pending) { finish(null); return; }
    const p = pending;
    const better = worth(p.penNext) > worth(p.playNext);

    const t = $('pen-title'), b = $('pen-blurb');
    const ya = $('pen-yes'), na = $('pen-no'), note = $('pen-note');
    if (t) t.textContent = '🟨 ' + p.foul.name;
    if (b) b.textContent = p.foul.blurb + ' The flag is on THEM — it is your call.';
    if (ya) ya.innerHTML = '✅ ACCEPT<small>' + downLabel(p.penNext) +
      (better ? ' · more yards' : '') + '</small>';
    if (na) na.innerHTML = '❌ DECLINE<small>' + downLabel(p.playNext) +
      (!better ? ' · more yards' : '') + '</small>';
    if (note) note.textContent = 'Accepting wipes out the play. Declining keeps it.';

    panel.style.display = 'flex';
    // It cannot sit there forever — the game is parked while it is up. If you
    // say nothing the referee takes the better of the two for you, because a
    // clock running out should never cost you yards you had earned.
    clearTimeout(showPanel._t);
    showPanel._t = setTimeout(() => {
      if (panel.style.display !== 'none') choose(better);
    }, PANEL_MS);
  }

  function hidePanel() {
    clearTimeout(showPanel._t);
    const panel = $('pen-panel');
    if (panel) panel.style.display = 'none';
  }

  function banner(top, why, tone) {
    const box = $('pen-verdict');
    if (!box) return;
    box.innerHTML = '<div class="pn-vTop">' + top + '</div><div class="pn-vWhy">' + why + '</div>';
    box.className = 'pn-verdict ' + (tone || 'good');
    box.style.display = 'block';
  }
  function hideBanner() {
    const box = $('pen-verdict');
    if (box) box.style.display = 'none';
  }

  // ============================================================
  // THE OTHER HALF: FLAGS WHILE THEY HAVE THE BALL
  // ------------------------------------------------------------
  // No panel and no question — you are not coaching their offense. main.js
  // hands us their down AFTER it has done its normal bookkeeping, and we hand
  // back a replacement or nothing at all.
  //
  // ⚠️ THE CONTEXT IS THE STATE FROM *BEFORE* THE PLAY — their spot, their
  // distance and the down they were actually playing. That is not a
  // convenience, it is what "the penalty wipes out the play" MEANS: we are
  // rebuilding the down from where it started, not patching up where it
  // finished. Handing this function the post-play numbers would give them
  // 1st & 20 from a play that had already earned the first down.
  //
  // ⚠️ AND THE ONE THAT WOULD HAVE BEEN A REAL BUG: A FLAG ON THEM CANNOT
  // RESCUE THEM FROM A TURNOVER ON DOWNS. If they just failed on 4th down,
  // holding on their guard is the best news you have had all drive — so you
  // DECLINE it, keep the ball, and the flag never existed. main.js tells us a
  // turnover is pending and we simply swallow the whistle. Without this, a
  // rulebook meant to be fair would have been quietly handing their offense a
  // free set of downs at the worst possible moment.
  // ============================================================
  function cpuPlay(ctx) {
    ensure();
    if (!ctx) return null;
    sincelast++;
    if (thisGame >= PER_GAME) return null;
    if (sincelast <= COOLDOWN) return null;
    if (Math.random() >= CPU_CHANCE) return null;

    // On THEM (holding — back 10, replay the down) or on YOU (5 yards and an
    // automatic first down for them). A flag on them when they have already
    // turned the ball over on downs is one you would decline, so there isn't one.
    const onThem = Math.random() < 0.55 && !ctx.turnover;
    sincelast = 0;
    thisGame++;
    s.called++;

    if (onThem) {
      s.onThem++;
      save();
      const spot = Math.max(1, Math.round(stepOff(ctx.spot, -10)));
      return {
        spot: spot,
        down: ctx.down,
        togo: Math.round(ctx.togo + (ctx.spot - spot)),
        msg: '🟨 HOLDING ON ' + (ctx.them || 'THEM') + ' — BACK 10',
      };
    }
    s.onYou++;
    save();
    const spot = Math.min(99, Math.round(stepOff(ctx.spot, 5)));
    return {
      spot: spot, down: 1, togo: 10,
      msg: '🟨 PENALTY ON YOU — THEIR FIRST DOWN',
    };
  }

  // ---- The record, shown in the 🏆 Trophy Case ----------------------------
  function render() {
    ensure();
    const body = $('pen-body');
    if (!body) return;
    const calls = s.accepted + s.declined;
    const pct = calls ? Math.round(s.accepted / calls * 100) : 0;
    body.innerHTML =
      '<div class="pn-statRow">' +
        '<div class="pn-stat"><b>' + s.called + '</b><span>FLAGS</span></div>' +
        '<div class="pn-stat"><b>' + s.onYou + '</b><span>ON YOU</span></div>' +
        '<div class="pn-stat"><b>' + s.onThem + '</b><span>ON THEM</span></div>' +
      '</div>' +
      '<div class="pn-statRow">' +
        '<div class="pn-stat"><b>' + s.accepted + '</b><span>ACCEPTED</span></div>' +
        '<div class="pn-stat"><b>' + s.declined + '</b><span>DECLINED</span></div>' +
        '<div class="pn-stat"><b>' + pct + '%</b><span>TAKEN</span></div>' +
      '</div>' +
      '<div class="pn-how">The referee throws a 🟨 <b>yellow</b> flag when someone breaks a rule ' +
        '(the 🚩 red one is yours — that is the Coach\'s Challenge). When the flag is on the ' +
        'defense you choose: <b>accept</b> it and the play is wiped out, or <b>decline</b> it and ' +
        'keep what happened. Declining is often right — five penalty yards are worth nothing if ' +
        'you just ran for twenty.</div>' +
      (s.log.length
        ? '<div class="pn-sec">RECENT FLAGS</div>' +
          s.log.map(l => '<div class="pn-log' + (l.side === 'def' ? ' them' : '') + '">' +
            (l.side === 'def' ? '🟨 On them' : '🟨 On you') + ' — ' + l.name +
            ' · ' + (l.took ? 'accepted' : 'declined') + '</div>').join('')
        : '<div class="pn-sec">RECENT FLAGS</div><div class="pn-none">No flags yet. Play clean!</div>');
  }

  function open()  { ensure(); const m = $('pen-modal'); if (m) { m.style.display = 'flex'; render(); } }
  function close() { const m = $('pen-modal'); if (m) m.style.display = 'none'; }

  // ---- Wire up ------------------------------------------------------------
  function onTap(id, fn) {
    const el = $(id);
    if (el) el.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); fn(); });
  }

  function wireUp() {
    ensure();
    onTap('pen-yes', () => choose(true));
    onTap('pen-no',  () => choose(false));
    onTap('open-pen', open);
    onTap('pen-close', close);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wireUp);
  else wireUp();

  window.TDPenalty = {
    offered, ask, newGame, cpuPlay, open, close, render,
    // Exposed for testing and for anything that wants to reason about a down.
    decide, applyFoul, downLabel, spotBall, stepOff, worth,
    _pending: () => pending,
    _state: () => s,
    _count: () => ({ sincelast: sincelast, thisGame: thisGame }),
    _dials: () => ({ FLAG_CHANCE, DEF_SHARE, COOLDOWN, PER_GAME, CPU_CHANCE }),
  };
})();
