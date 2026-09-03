// ============================================================
// TOUCHDOWN FUN — flag.js: 🚩 THE COACH'S CHALLENGE (Round 9, pick ⑧)
// ------------------------------------------------------------
// The last pick on the Locker Room Board, and the one saved for last on
// purpose: every other feature waits politely for the whistle, but this one
// has to reach into the middle of a live game and change a call that has
// already been made.
//
// WHAT YOU CAN CHALLENGE. Only calls a real coach would actually throw a
// flag at — and only when the answer would change something:
//
//   📏 THE SPOT — he was tackled a whisker short of the first-down marker
//      (or the goal line). "He got there!" Win it and the chains move, or
//      it's six.
//   🧤 THE CATCH — a pass ruled incomplete on third or fourth down, when
//      it's the difference between a drive and a punt. "He had that!"
//
// HOW LIKELY IT IS depends on how close it actually was, which is the whole
// point of the mechanic: a ball half a yard short is very likely coming
// back your way; one a full two yards short probably isn't. You are reading
// the situation, not spinning a wheel.
//
// WHAT IT COSTS is a timeout, exactly like real football — and exactly like
// real football, you only LOSE the timeout if you were wrong. Two challenges
// a game, and you must have a timeout to throw one.
//
// ⚠️ Because throwing the flag needs a timeout, the ⏱️ TWO-MINUTE DRILL —
// which starts you with none — can never offer a challenge. That's the right
// answer and it falls out of the rules on its own, with nothing special
// written for it.
//
// ------------------------------------------------------------
// HOW IT PLUGS IN
// ------------------------------------------------------------
// main.js asks TDFlag.offered(call) at the end of endPlay. If we say yes it
// parks the dead-ball timer and calls TDFlag.ask(done) — the same "hold the
// clock, ask a question, roll on with the answer" shape the ⚡ onside kick
// has used since v1.63. We hand back either a replacement `next` (overturned)
// or a flag saying the timeout is gone (call stands).
//
// The name is TDFlag, not TDChallenge — 📋 TDChallenge is the DAILY
// CHALLENGES feature and has been since v1.35.
// ============================================================
(function () {
  'use strict';

  // Short name — TDStats.shared adds the "tdr-" (so this is "tdr-flag").
  const KEY = 'flag';
  const $ = id => document.getElementById(id);

  const T = window.TDStats ? TDStats.shared : null;
  const store = (k, v) => { if (T) T.store(k, v); };
  const load  = (k, f) => (T ? T.load(k, f) : f);

  const PER_GAME    = 2;     // challenges you get each game
  const SPOT_WINDOW = 2.0;   // how short you can be and still argue the spot
  const CATCH_ODDS  = 0.34;  // a catch is a judgement call — flatter odds

  // How likely a SPOT challenge is to be overturned, by how short you were.
  // Half a yard out is very winnable; two yards out really isn't.
  function spotOdds(shortBy) {
    const t = Math.max(0, Math.min(1, shortBy / SPOT_WINDOW));
    return 0.72 - t * 0.48;         // 0.72 at the marker … 0.24 two yards out
  }

  // ---- State --------------------------------------------------------------
  // Career record lives in the save; `left` is this game only.
  let s = null;
  let left = PER_GAME;
  let pending = null;    // the call currently on the table
  let done = null;       // main.js's callback, held until you answer

  function ensure() {
    if (!s) s = load(KEY, null);
    if (!s || typeof s !== 'object') s = {};
    if (typeof s.thrown !== 'number') s.thrown = 0;
    if (typeof s.won !== 'number') s.won = 0;
    if (!Array.isArray(s.log)) s.log = [];
  }
  function save() { store(KEY, s); }

  function newGame() { ensure(); left = PER_GAME; pending = null; done = null; hidePanel(); }

  // ---- Is this call worth a flag? -----------------------------------------
  // main.js calls this for every play. Saying "yes" parks the game, so it has
  // to be genuinely rare — a wrong "yes" here would stop the game dead.
  function offered(call) {
    ensure();
    hidePanel();
    pending = null;
    if (!call || left <= 0) return false;
    if ((call.timeouts || 0) <= 0) return false;      // nothing to spend
    if (!call.next || call.next.fresh) return false;  // a turnover/score is not a spot call
    if (typeof call.spot !== 'number') return false;

    // 📏 THE SPOT — tackled short of the marker, but only just.
    if (call.result === 'tackle') {
      const shortBy = call.fd - call.spot;
      if (shortBy > 0 && shortBy <= SPOT_WINDOW) {
        const toGoal = 100 - call.spot;
        const forGoalLine = toGoal > 0 && toGoal <= SPOT_WINDOW;
        pending = {
          kind: 'spot',
          title: forGoalLine ? 'HE WAS OVER THE LINE!' : 'HE GOT THE FIRST DOWN!',
          blurb: forGoalLine
            ? 'The referee says he was stopped just short of the goal line.'
            : 'The referee spotted it ' + shortBy.toFixed(1) + ' short of the marker.',
          odds: spotOdds(shortBy),
          call: call,
        };
        return true;
      }
      return false;
    }

    // 🧤 THE CATCH — incomplete, but only when the down actually matters.
    if (call.result === 'incomplete' && call.down >= 3) {
      pending = {
        kind: 'catch',
        title: 'THAT WAS A CATCH!',
        blurb: 'The referee ruled it incomplete. You think he had it and got down.',
        odds: CATCH_ODDS,
        call: call,
      };
      return true;
    }
    return false;
  }

  // ---- Ask the question ---------------------------------------------------
  function ask(cb) {
    done = cb;
    if (!pending) { finish(null); return; }
    showPanel();
  }

  // The player let it go (or the panel timed out).
  function decline() {
    hidePanel();
    finish(null);
  }

  // 🚩 The flag is on the field.
  function throwFlag() {
    ensure();
    if (!pending) { decline(); return; }
    const p = pending;
    left--;
    s.thrown++;
    hidePanel();

    const upheld = Math.random() < p.odds;   // upheld = YOUR challenge won
    if (upheld) s.won++;
    s.log.unshift({ kind: p.kind, won: upheld });
    s.log = s.log.slice(0, 12);
    save();

    // Show the review, then the verdict. The replay screen belongs to main.js,
    // so we just put our own banner over the top of the dead ball — simpler,
    // and it can't collide with a touchdown replay that may already be queued.
    showVerdict(upheld, p);
  }

  function showVerdict(upheld, p) {
    const box = $('flag-verdict');
    if (box) {
      box.innerHTML =
        '<div class="fl-vTop">📺 UNDER REVIEW</div>' +
        '<div class="fl-vRule">' + (upheld ? 'THE CALL IS OVERTURNED' : 'THE CALL STANDS') + '</div>' +
        '<div class="fl-vWhy">' + (upheld
          ? (p.kind === 'spot'
              ? 'Replay shows he got there. The ball is moved up.'
              : 'Replay shows he had it in. Completed pass.')
          : 'There isn\'t enough to change it. You lose a timeout.') + '</div>';
      box.className = 'fl-verdict ' + (upheld ? 'good' : 'bad');
      box.style.display = 'block';
    }
    if (window.TDSound) TDSound.sting(upheld ? 'td' : 'lose');

    // Let it sit long enough to read, then hand the answer back to main.js.
    setTimeout(() => {
      if (box) box.style.display = 'none';
      finish(upheld ? { next: overturnedNext(p) } : { costTimeout: true });
    }, 2100);
  }

  // What the call becomes when you win it.
  function overturnedNext(p) {
    const c = p.call;
    if (p.kind === 'spot') {
      // He reached the marker — so give him the marker, and everything that
      // comes with it. Crossing the goal line is left to the game's own
      // touchdown path; here the ball simply gets to the 1 at worst.
      const gained = Math.min(c.fd, 99.5);
      return { los: gained, down: 1, fd: Math.min(gained + 10, 100) };
    }
    // A catch: he had it, and got a few yards for his trouble.
    const spot = Math.min(c.los + 5, 99);
    if (spot >= c.fd) return { los: spot, down: 1, fd: Math.min(spot + 10, 100) };
    return { los: spot, down: Math.min(c.down + 1, 4), fd: c.fd };
  }

  function finish(verdict) {
    const cb = done;
    done = null; pending = null;
    if (cb) { try { cb(verdict); } catch (e) {} }
  }

  // ---- The little panel on the field --------------------------------------
  function showPanel() {
    const panel = $('flag-panel');
    if (!panel || !pending) { finish(null); return; }
    const t = $('flag-title'), b = $('flag-blurb'), n = $('flag-left');
    if (t) t.textContent = '🚩 ' + pending.title;
    if (b) b.textContent = pending.blurb;
    if (n) n.textContent = left + ' challenge' + (left === 1 ? '' : 's') + ' left · costs a timeout if you\'re wrong';
    panel.style.display = 'flex';
    // It can't sit there forever — the game is parked while it's up.
    clearTimeout(showPanel._t);
    showPanel._t = setTimeout(() => { if (panel.style.display !== 'none') decline(); }, 6000);
  }

  function hidePanel() {
    clearTimeout(showPanel._t);
    const panel = $('flag-panel');
    if (panel) panel.style.display = 'none';
  }

  // ---- The record, shown in the 🏆 Trophy Case ----------------------------
  function render() {
    ensure();
    const body = $('flag-body');
    if (!body) return;
    const pct = s.thrown ? Math.round(s.won / s.thrown * 100) : 0;
    body.innerHTML =
      '<div class="fl-statRow">' +
        '<div class="fl-stat"><b>' + s.thrown + '</b><span>THROWN</span></div>' +
        '<div class="fl-stat"><b>' + s.won + '</b><span>WON</span></div>' +
        '<div class="fl-stat"><b>' + pct + '%</b><span>SUCCESS</span></div>' +
      '</div>' +
      '<div class="fl-how">Throw the red flag when the referee gets a spot or a catch wrong. ' +
        'You get ' + PER_GAME + ' a game, you need a timeout to throw one, and you only lose the ' +
        'timeout if the call stands.</div>' +
      (s.log.length
        ? '<div class="fl-sec">RECENT FLAGS</div>' +
          s.log.map(l => '<div class="fl-log' + (l.won ? ' won' : '') + '">' +
            (l.won ? '✅ Overturned' : '❌ Stood') + ' — ' +
            (l.kind === 'spot' ? 'the spot' : 'a catch') + '</div>').join('')
        : '<div class="fl-sec">RECENT FLAGS</div><div class="fl-none">No flags thrown yet.</div>');
  }

  function open()  { ensure(); const m = $('flag-modal'); if (m) { m.style.display = 'flex'; render(); } }
  function close() { const m = $('flag-modal'); if (m) m.style.display = 'none'; }

  // ---- Wire up ------------------------------------------------------------
  function onTap(id, fn) {
    const el = $(id);
    if (el) el.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); fn(); });
  }

  function wireUp() {
    ensure();
    onTap('flag-throw', throwFlag);
    onTap('flag-let', decline);
    onTap('open-flag', open);
    onTap('flag-close', close);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wireUp);
  else wireUp();

  window.TDFlag = {
    offered, ask, newGame, open, close, render,
    left: () => left,
    record: () => (ensure(), { thrown: s.thrown, won: s.won }),
    _throw: throwFlag, _decline: decline, _pending: () => pending,
    _state: () => s,
  };
})();
