// ============================================================
// TOUCHDOWN FUN — selfscout.js: 📊 SELF-SCOUTING (Round 12, pick ④)
// ------------------------------------------------------------
// 📋 The Scouting Report (v2.3) hands you a card on THEM. This is the same
// card pointed the other way: here is what YOU call, how often, and who you
// keep throwing to — because the other team's coaches are watching too.
//
// ⚠️ THE RULE THIS FEATURE INHERITS FROM scout.js: **THE REPORT HAS TO BE
// TRUE.** A card that says "you throw to #2 far too much" and then changes
// nothing would be worse than no card at all — it would teach Max to ignore
// his own coaches. So, exactly like the scouting report, this does two jobs
// and the second is the important half:
//
//   1. IT TELLS YOU what you lean on.
//   2. IT *IS* what the defense reads. The same counts that print on the card
//      are the counts `callPlay()` asks about when the defense picks its plan,
//      and the counts the man-coverage cushion asks about when a defensive
//      back lines up over your favourite receiver.
//
// ⚠️ AND THE RULE THE DRAFT BOARD PRINTED ON THIS PICK: **A DEFENSE THAT READS
// YOU TOO WELL IS NOT FUN, IT IS JUST UNFAIR.** Three things keep it honest:
//
//   · A MINIMUM SAMPLE. Nothing is read at all until 12 plays. You cannot be
//     "predictable" after handing off twice; a defense that decided you were a
//     running team on play 2 would be guessing, not scouting.
//   · A HARD CAP. The very most being 100% predictable can buy the defense is
//     +0.12 blitz chance and 7 pixels of cushion. For comparison the base
//     blitz chance is 0.15 (0.30 on hard) — so this can matter, and it can
//     never take over. **Measured, not guessed: see the sweep in the commit.**
//   · A ROLLING WINDOW — and this is the one that makes it a GAME rather than
//     a punishment. Only your last 20 calls count. Notice the card, start
//     mixing it up, and the read fades within a drive or two. Being read is
//     not a state you get stuck in; it is a thing you can fix, which is
//     exactly what a real coach does at halftime.
//
// ⚠️ `read()` IS A PURE FUNCTION of a plain list of calls — no globals, no
// DOM — the same shape as TDFourth.advise(), TDClock.advise() and
// TDHit.grade(). Every tendency the game can produce is therefore checkable
// without playing a down.
//
// Saved to `tdr-selfscout` (key 'selfscout' — stats.js adds the prefix) so your CAREER totals survive (the card shows them
// for fun), but ⚠️ only the ROLLING WINDOW ever affects play — a career of
// 400 runs must not haunt a game in which you have come out throwing.
// ============================================================
(function () {
  'use strict';

  const T = window.TDStats ? TDStats.shared : null;
  const store = (k, v) => { if (T) T.store(k, v); };
  const load  = (k, f) => (T ? T.load(k, f) : f);
  const $ = id => document.getElementById(id);

  // ⚠️ NO `tdr-` HERE. TDStats.shared.store() adds that prefix itself
  // (stats.js: `localStorage.setItem('tdr-' + key, …)`), so passing
  // 'tdr-selfscout' wrote to **tdr-tdr-selfscout** — every other module passes
  // a bare name ('quests' → tdr-quests). Caught before shipping, which is the
  // only time it is free: a save key that has already been released can never
  // be renamed without wiping what players have saved under it.
  const KEY = 'selfscout';

  // ---- the knobs, all in one place so they can be argued with -------------
  const WINDOW     = 20;    // how many recent calls the defense remembers
  const MIN_SAMPLE = 12;    // below this, the defense has nothing to go on
  const MAX_BLITZ  = 0.12;  // the most predictability can add to blitz odds
  const BASE_CUSH  = 24;    // main.js's normal man-coverage cushion, in pixels
  const MIN_CUSH   = 17;    // …and the tightest a read receiver can ever be played

  // career totals — shown on the card, never used to steer the defense
  let career = load(KEY, { runs: 0, passes: 0, wr: [0, 0, 0], form: [0, 0, 0, 0] });
  if (!career || typeof career !== 'object') career = { runs: 0, passes: 0, wr: [0,0,0], form: [0,0,0,0] };
  if (!Array.isArray(career.wr))   career.wr   = [0, 0, 0];
  if (!Array.isArray(career.form)) career.form = [0, 0, 0, 0];

  let recent = [];   // the rolling window: { kind:'run'|'pass', num:1|2|3|null, form:0..3 }

  // ---- the thinking (PURE) -----------------------------------------------
  // calls = a list of { kind, num }. Returns what a defensive coordinator
  // would take from it, or nulls when there is not enough to take anything.
  function read(calls) {
    const list = Array.isArray(calls) ? calls.slice(-WINDOW) : [];
    const n = list.length;
    const base = {
      plays: n, ready: false, passLean: 0.5, predictability: 0,
      favWr: null, favWrShare: 0, favWrEdge: 0,
    };
    if (n < MIN_SAMPLE) return base;

    const passes = list.filter(c => c && c.kind === 'pass').length;
    const passLean = passes / n;
    // 0 at a perfect 50/50, 1 at "he has only ever done one of the two".
    const predictability = Math.min(1, Math.abs(passLean - 0.5) * 2);

    // Who do you throw at? Only worth reading if you have actually thrown.
    let favWr = null, favWrShare = 0, favWrEdge = 0;
    const throws = list.filter(c => c && c.kind === 'pass' && c.num >= 1 && c.num <= 3);
    if (throws.length >= 6) {
      const tally = [0, 0, 0];
      for (const c of throws) tally[c.num - 1]++;
      const top = tally.indexOf(Math.max(...tally));
      const share = tally[top] / throws.length;
      // An even spread is 1/3 each. Anything above that is a lean; we scale it
      // so "half your throws" is a mild read and "all of them" is the maximum.
      if (share > 0.45) {
        favWr = top + 1;
        favWrShare = share;
        favWrEdge = Math.min(1, (share - 1 / 3) / (1 - 1 / 3));
      }
    }
    return { plays: n, ready: true, passLean, predictability, favWr, favWrShare, favWrEdge };
  }

  function now() { return read(recent); }

  // ---- what the DEFENSE gets out of it (the important half) --------------
  // How much to move the blitz dice. Positive = blitz more (you run a lot, so
  // they crowd the line); negative = blitz less and drop into coverage
  // (you throw a lot, so they rush less and cover more).
  // ⚠️ Returns 0 until MIN_SAMPLE, and never exceeds ±MAX_BLITZ.
  function blitzShift() {
    const r = now();
    if (!r.ready) return 0;
    const runLean = 1 - r.passLean;          // 1 = you only ever run
    const dir = (runLean - 0.5) * 2;         // -1 all pass … +1 all run
    return Math.max(-MAX_BLITZ, Math.min(MAX_BLITZ, dir * MAX_BLITZ));
  }

  // The cushion a defensive back plays with over receiver `num`, in pixels.
  // Your favourite gets crowded; everybody else is covered exactly as before.
  // ⚠️ Never tighter than MIN_CUSH, so a read receiver is harder to hit, never
  // impossible — and the other two open up as a result, which is the way out.
  function cushion(num) {
    const r = now();
    if (!r.ready || !r.favWr || num !== r.favWr) return BASE_CUSH;
    return BASE_CUSH - (BASE_CUSH - MIN_CUSH) * r.favWrEdge;
  }

  // ---- counting ----------------------------------------------------------
  // main.js calls this the moment you commit to a play.
  function call(kind, num, form) {
    if (kind !== 'run' && kind !== 'pass') return;
    const c = {
      kind: kind,
      num: (num >= 1 && num <= 3) ? num : null,
      form: (form >= 0 && form <= 3) ? form : 0,
    };
    recent.push(c);
    if (recent.length > WINDOW * 2) recent = recent.slice(-WINDOW);   // don't grow forever
    if (kind === 'run') career.runs++; else career.passes++;
    if (c.num) career.wr[c.num - 1]++;
    career.form[c.form]++;
    store(KEY, career);
  }

  // A new game starts with a clean sheet: last week's habits are not what this
  // defense is watching.
  function reset() { recent = []; }

  // ---- the card ----------------------------------------------------------
  function pct(x) { return Math.round(x * 100) + '%'; }

  function bar(label, value, total, hot) {
    const share = total > 0 ? value / total : 0;
    return '<div class="ss-row"><span class="ss-lab">' + label + '</span>' +
           '<span class="ss-bar"><i class="' + (hot ? 'hot' : '') + '" style="width:' +
           Math.round(share * 100) + '%"></i></span>' +
           '<span class="ss-num">' + pct(share) + '</span></div>';
  }

  function html() {
    const r = now();
    const FORMS = ['SPREAD', 'TRIPS R', 'TRIPS L', 'I-FORM'];
    let h = '';

    // --- what they can see right now ---
    h += '<div class="ss-sec">📡 What they can see right now</div>';
    if (!r.ready) {
      h += '<p class="ss-note">Only <b>' + r.plays + '</b> of the last ' + MIN_SAMPLE +
           ' calls in. Their coaches have <b>nothing to go on yet</b> — you need to run ' +
           (MIN_SAMPLE - r.plays) + ' more play' + (MIN_SAMPLE - r.plays === 1 ? '' : 's') +
           ' before anyone could read you.</p>';
    } else {
      const runs = r.plays - Math.round(r.passLean * r.plays);
      h += bar('🏃 RUN',  runs, r.plays, r.predictability > 0.5 && r.passLean < 0.5);
      h += bar('🎯 PASS', Math.round(r.passLean * r.plays), r.plays, r.predictability > 0.5 && r.passLean > 0.5);
      // ⚠️ THE BANDS HAVE TO MATCH WHAT THE SPLIT ACTUALLY MEANS, or the card
      // lies in a quieter way than being wrong: predictability 0.5 is a 75/25
      // split, and throwing on three of every four downs is a real tendency a
      // coordinator would absolutely act on — not "a slight lean". Read the
      // numbers as: 0.2 ≈ 60/40, 0.45 ≈ 72/28, 0.7 ≈ 85/15.
      const verdict = r.predictability < 0.2  ? ['🟢', 'Balanced. They cannot sit on anything.']
                    : r.predictability < 0.45 ? ['🟡', 'A slight lean. Nothing they can build a defense on yet.']
                    : r.predictability < 0.7  ? ['🟠', 'They have noticed. Expect them to sit on it.']
                    :                           ['🔴', 'You are an open book. Mix it up or they will eat you alive.'];
      h += '<p class="ss-verdict">' + verdict[0] + ' <b>' + pct(r.predictability) + ' readable</b> — ' + verdict[1] + '</p>';
      if (r.favWr) {
        h += '<p class="ss-note">🎯 <b>' + pct(r.favWrShare) + '</b> of your throws go to receiver <b>#' +
             r.favWr + '</b>. His man is playing him <b>' +
             Math.round(BASE_CUSH - cushion(r.favWr)) + 'px tighter</b> because of it — ' +
             'which means the other two are <b>more open than usual</b>.</p>';
      } else {
        h += '<p class="ss-note">🎯 You spread the ball around. No defender is cheating toward anyone.</p>';
      }
      h += '<p class="ss-note ss-dim">Only your last ' + WINDOW + ' calls count. ' +
           'Change what you call and this fades within a drive — that is the whole idea.</p>';
    }

    // --- career, for fun ---
    const tot = career.runs + career.passes;
    h += '<div class="ss-sec">📚 Your career</div>';
    if (tot < 1) {
      h += '<p class="ss-note">No plays called yet. Go and call some!</p>';
    } else {
      h += bar('🏃 RUN', career.runs, tot, false);
      h += bar('🎯 PASS', career.passes, tot, false);
      const wtot = career.wr[0] + career.wr[1] + career.wr[2];
      if (wtot > 0) for (let i = 0; i < 3; i++) h += bar('#' + (i + 1) + ' receiver', career.wr[i], wtot, false);
      const ftot = career.form.reduce((a, b) => a + b, 0);
      if (ftot > 0) {
        h += '<div class="ss-sec">🧩 Formations you line up in</div>';
        for (let i = 0; i < 4; i++) h += bar(FORMS[i], career.form[i], ftot, false);
      }
      h += '<p class="ss-note ss-dim">' + tot + ' plays called, all time. Career totals are just for reading — ' +
           'they never affect a game.</p>';
    }
    return h;
  }

  function open() {
    const body = $('selfscout-body');
    if (body) body.innerHTML = html();
    const m = $('selfscout-modal');
    if (m) m.style.display = 'flex';
  }
  function close() { const m = $('selfscout-modal'); if (m) m.style.display = 'none'; }

  function wire() {
    const tap = (id, fn) => { const el = $(id); if (el) el.addEventListener('pointerdown', e => { e.preventDefault(); fn(); }); };
    tap('selfscout-close', close);
    tap('open-selfscout', open);
    const m = $('selfscout-modal');
    if (m) m.addEventListener('pointerdown', e => { if (e.target === m) { e.preventDefault(); close(); } });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire);
  else wire();

  window.TDSelf = {
    read, now, call, reset, open, close,
    blitzShift, cushion,
    WINDOW, MIN_SAMPLE, MAX_BLITZ, BASE_CUSH, MIN_CUSH,
  };
})();
