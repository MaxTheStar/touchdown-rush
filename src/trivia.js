// ============================================================
// TOUCHDOWN FUN — trivia.js: 🧠 THE FOOTBALL IQ QUIZ (Round 10, pick ①)
// ------------------------------------------------------------
// Ten questions about football. Not about THIS game's buttons — about the
// actual sport: how many points a safety is worth, what a pick six is, why
// the referee throws a yellow flag. Answer right, earn points and coins;
// answer wrong, and the quiz tells you the real answer and why, so you
// finish the round knowing more than you started it.
//
//   🔥 STREAKS — every correct answer in a row is worth a little more than
//      the last (+2, +4, +6… up to +10 extra). Get all ten and there's a
//      perfect-round bonus on top. So the difference between "I knew most
//      of them" and "I knew ALL of them" really shows on the scoreboard.
//
//   📈 IT GETS HARDER AS YOU GET BETTER — the questions come in three tiers
//      (the basics, proper football words, then the tricky stuff like the
//      red zone and play-action). While your best score is low you mostly
//      get tier-1 questions; as it climbs, the mix shifts up. A quiz you
//      can ace forever stops being worth playing, so this one grows with you.
//
//   🧠 YOUR RANK — your best score earns a rank, from 🥉 ROOKIE up to
//      🧠 PROFESSOR. It's shown on the Arcade card so there's something to
//      chase.
//
//   NO CLOCK, ON PURPOSE. Every other drill in the Arcade is a race — targets
//   vanish, the kick meter sweeps. This one is the opposite: sit and think as
//   long as you like. A quiz with a countdown tests your thumbs, not your brain.
//
// SELF-CONTAINED, like the rest of the Arcade — its own little DOM world that
// never touches the football sim, so it cannot possibly break a game. It only
// reaches out to hand you coins through TDShop.earn.
//
// Saved in `tdr-trivia` = { best, played, right, wrong }.
// Opened from the 🎯 Practice Arcade; main.js doesn't need to know it exists.
// ============================================================
(function () {
  'use strict';

  const T = window.TDStats ? TDStats.shared : null;
  const store = (k, v) => { if (T) T.store(k, v); };
  const load  = (k, f) => (T ? T.load(k, f) : f);
  const $ = id => document.getElementById(id);

  // ---- 📚 THE QUESTION BANK ----------------------------------------------
  // Each one is: q = the question, a = the three answers, c = which one is
  // right (0, 1 or 2), why = what you learn either way, t = how hard it is
  // (1 = the basics, 2 = proper football words, 3 = the tricky stuff).
  // Everything here is true of real football AND of Touchdown Fun, so nothing
  // you learn in the quiz will surprise you out on the field.
  const BANK = [
    // ---- tier 1: the basics ----------------------------------------------
    { t: 1, q: 'How many points is a touchdown worth?', a: ['3', '6', '7'], c: 1,
      why: 'A touchdown is 6. The extra point after it is what makes the score 7.' },
    { t: 1, q: 'How many points is a field goal worth?', a: ['3', '2', '6'], c: 0,
      why: 'A field goal is 3 points — the safe choice when a touchdown looks too far away.' },
    { t: 1, q: 'After a touchdown, how much is the kicked extra point worth?', a: ['2', '1', '3'], c: 1,
      why: 'The kick is worth 1. That is why most touchdowns end up being 7 points.' },
    { t: 1, q: 'Instead of kicking, you can "go for two". How many points is that?', a: ['2', '1', '4'], c: 0,
      why: 'Going for two is worth 2 — riskier than the kick, but worth double.' },
    { t: 1, q: 'How many yards do you need to get a first down?', a: ['5', '10', '20'], c: 1,
      why: 'Ten yards. Get them and your downs reset and you start counting again.' },
    { t: 1, q: 'How many downs (tries) do you get to make those yards?', a: ['4', '3', '5'], c: 0,
      why: 'Four downs. Most teams punt or kick on the fourth one rather than risk it.' },
    { t: 1, q: 'What is the painted area you run into to score called?', a: ['The goal box', 'The end zone', 'The score line'], c: 1,
      why: 'The end zone. Get the ball into it and that is six points.' },
    { t: 1, q: 'How many players does each team have on the field at once?', a: ['9', '11', '13'], c: 1,
      why: 'Eleven a side — which is why the offensive line is so crowded.' },
    { t: 1, q: 'How many quarters are there in a football game?', a: ['2', '4', '6'], c: 1,
      why: 'Four quarters, with halftime in the middle after the second one.' },
    { t: 1, q: 'Who throws the ball on offense?', a: ['The kicker', 'The quarterback', 'The linebacker'], c: 1,
      why: 'The quarterback — he takes the snap and decides where the ball goes.' },
    { t: 1, q: 'What is it called when a defender catches a pass meant for the offense?', a: ['A fumble', 'An interception', 'A sack'], c: 1,
      why: 'An interception — the ball changes teams right there, mid-air.' },
    { t: 1, q: 'What is it called when a player drops the ball while carrying it?', a: ['A fumble', 'An incompletion', 'A safety'], c: 0,
      why: 'A fumble. The ball is live, so either team can jump on it.' },
    { t: 1, q: 'What is the kick that starts the game called?', a: ['The punt', 'The kickoff', 'The snap'], c: 1,
      why: 'The kickoff. It also restarts play after each score.' },
    { t: 1, q: 'What do you call the pass that is caught for a touchdown?', a: ['A touchdown pass', 'A field pass', 'A goal kick'], c: 0,
      why: 'A touchdown pass — the quarterback and the catcher both get credit for it.' },

    // ---- tier 2: proper football words ------------------------------------
    { t: 2, q: 'You get tackled with the ball in your OWN end zone. What is that?', a: ['A touchback', 'A safety', 'A fumble'], c: 1,
      why: 'A safety — and it gives the OTHER team 2 points. The worst way to lose points.' },
    { t: 2, q: 'What is a "pick six"?', a: ['Six points for a kick', 'An interception returned for a touchdown', 'The sixth pick of the draft'], c: 1,
      why: 'A pick (interception) taken all the way back for six points. It swings a game fast.' },
    { t: 2, q: 'What does the referee throw when there is a penalty?', a: ['A yellow flag', 'A red card', 'A whistle'], c: 0,
      why: 'A yellow flag. Red flags are different — a coach throws those to challenge a call.' },
    { t: 2, q: 'What is a "sack"?', a: ['A long run', 'Tackling the quarterback before he throws', 'Catching your own pass'], c: 1,
      why: 'Dropping the quarterback behind the line before he can get rid of the ball.' },
    { t: 2, q: 'On fourth down, what is it called when you kick the ball away to the other team?', a: ['A punt', 'A field goal', 'An onside kick'], c: 0,
      why: 'A punt — you give up the ball, but you make them start a long way from your end zone.' },
    { t: 2, q: 'A touchdown plus a made extra point adds up to how many points?', a: ['6', '7', '8'], c: 1,
      why: 'Seven. And a touchdown with a two-point conversion is 8.' },
    { t: 2, q: 'What is the imaginary line where the ball sits before each play?', a: ['The line of scrimmage', 'The goal line', 'The sideline'], c: 0,
      why: 'The line of scrimmage. Nobody may cross it until the ball is snapped.' },
    { t: 2, q: 'Why would a team try an onside kick?', a: ['To score 3 points', 'To get the ball straight back', 'To end the quarter'], c: 1,
      why: 'It is a short, tricky kickoff you hope to recover yourself — usually when you are behind late.' },
    { t: 2, q: 'Whose main job is protecting the quarterback?', a: ['The offensive line', 'The receivers', 'The safeties'], c: 0,
      why: 'The offensive line — the big players right in front of him.' },
    { t: 2, q: 'What is a "Hail Mary"?', a: ['A short safe pass', 'A very long desperate pass', 'A running play'], c: 1,
      why: 'A huge heave to the end zone when time is almost gone. It rarely works — but when it does!' },
    { t: 2, q: 'What happens if the score is tied when time runs out?', a: ['Both teams win', 'Overtime', 'A penalty kick'], c: 1,
      why: 'Overtime — extra football until somebody finally comes out ahead.' },
    { t: 2, q: 'What does "1st and 10" mean?', a: ['First down, 10 yards to go', '1 point, 10 minutes left', 'First quarter, 10 players'], c: 0,
      why: 'The down you are on, then the yards you still need. "3rd and 2" means third down, 2 to go.' },

    // ---- tier 3: the tricky stuff -----------------------------------------
    { t: 3, q: 'How long is a football field between the two goal lines?', a: ['80 yards', '100 yards', '120 yards'], c: 1,
      why: '100 yards goal line to goal line — plus a 10-yard end zone at each end.' },
    { t: 3, q: 'How deep is each end zone?', a: ['10 yards', '5 yards', '20 yards'], c: 0,
      why: 'Ten yards deep. So the whole field, end to end, is really 120 yards.' },
    { t: 3, q: 'What is the "red zone"?', a: ['Inside the opponent’s 20-yard line', 'The referee’s area', 'The bench'], c: 0,
      why: 'The last 20 yards before the end zone. Teams talk about it because scoring gets harder there.' },
    { t: 3, q: 'What is a "blitz"?', a: ['A fast running play', 'Sending extra defenders after the quarterback', 'A long field goal'], c: 1,
      why: 'The defense gambles: more rushers means more chance of a sack, but fewer players covering.' },
    { t: 3, q: 'What is a "false start"?', a: ['An offensive player moves before the snap', 'Kicking too early', 'Starting the clock late'], c: 0,
      why: 'A false start costs the offense 5 yards — everyone must be still until the ball moves.' },
    { t: 3, q: 'What is "offside"?', a: ['Running out of bounds', 'A defender is across the line when the ball is snapped', 'Throwing forward twice'], c: 1,
      why: 'Offside is a defensive penalty — they jumped the line before the snap.' },
    { t: 3, q: 'What is "holding"?', a: ['Grabbing a player who does not have the ball', 'Keeping the ball too long', 'Holding the ball with two hands'], c: 0,
      why: 'Holding is grabbing or hanging on to a blocker or defender. It is the most common penalty in football.' },
    { t: 3, q: 'What is "pass interference"?', a: ['Throwing the ball out of bounds', 'Illegally stopping a receiver from catching it', 'Two receivers on one side'], c: 1,
      why: 'You may go for the ball, but you may not shove or hold the catcher while it is in the air.' },
    { t: 3, q: 'What is a "play-action" pass?', a: ['A pass after faking a handoff', 'A pass thrown backwards', 'A pass on fourth down'], c: 0,
      why: 'You pretend to hand the ball off so the defense charges the run — then you throw over them.' },
    { t: 3, q: 'You use all four downs and still come up short. What is that called?', a: ['A turnover on downs', 'A safety', 'A touchback'], c: 0,
      why: 'A turnover on downs — no punt, no kick, the other team simply takes over right there.' },
    { t: 3, q: 'What is a "screen pass"?', a: ['A pass to the sideline', 'A short pass to a player with blockers in front of him', 'A pass over the goalpost'], c: 1,
      why: 'You let the rushers come, then flip it short to a player who suddenly has a wall of blockers.' },
    { t: 3, q: 'Which of these is worth the FEWEST points?', a: ['A safety', 'A kicked extra point', 'A field goal'], c: 1,
      why: 'The extra point is 1, a safety is 2, a field goal is 3. The extra point is the smallest score in football.' },
  ];

  const ROUND = 10;              // questions in one quiz
  const PERFECT_BONUS = 25;      // all ten right

  // ---- 💾 your record -----------------------------------------------------
  let rec = load('trivia', null);
  if (!rec || typeof rec !== 'object') rec = {};
  if (typeof rec.best   !== 'number') rec.best   = 0;
  if (typeof rec.played !== 'number') rec.played = 0;
  if (typeof rec.right  !== 'number') rec.right  = 0;
  if (typeof rec.wrong  !== 'number') rec.wrong  = 0;
  function save() { store('trivia', rec); }

  // ---- 🧠 ranks — your best score earns you a title -----------------------
  // These numbers are set against what is actually POSSIBLE, which is the
  // only way a rank means anything. A perfect round on the easy mix scores
  // 210, and the highest score in the game is 255 (a perfect round once the
  // hard questions have arrived). So 🧠 PROFESSOR is deliberately just out of
  // reach of a good first go: you have to earn the hard questions FIRST by
  // scoring well, and then answer all ten of those. Ranks you can max out on
  // your first try are not worth having.
  const RANKS = [
    { at: 250, ic: '🧠', nm: 'PROFESSOR' },
    { at: 190, ic: '🥇', nm: 'PRO' },
    { at: 120, ic: '🥈', nm: 'STARTER' },
    { at: 0,   ic: '🥉', nm: 'ROOKIE' },
  ];
  function rank() { return RANKS.find(r => rec.best >= r.at) || RANKS[RANKS.length - 1]; }

  // ---- 🎲 building a round ------------------------------------------------
  // How many questions come from each tier depends on how well you've done.
  // A quiz you can ace forever stops being worth playing.
  function mix() {
    if (rec.best < 80)  return [7, 3, 0];
    if (rec.best < 150) return [4, 4, 2];
    return [2, 4, 4];
  }
  function shuffle(list) {
    const out = list.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = out[i]; out[i] = out[j]; out[j] = t;
    }
    return out;
  }
  function buildRound() {
    const want = mix();
    let picked = [];
    for (let t = 1; t <= 3; t++) {
      const pool = shuffle(BANK.filter(q => q.t === t));
      picked = picked.concat(pool.slice(0, want[t - 1]));
    }
    // If a tier ran short (it shouldn't), top up from whatever is left over.
    if (picked.length < ROUND) {
      const rest = shuffle(BANK.filter(q => picked.indexOf(q) === -1));
      picked = picked.concat(rest.slice(0, ROUND - picked.length));
    }
    return shuffle(picked).slice(0, ROUND);
  }

  // ---- the state of the quiz you're playing right now ---------------------
  let round = null;    // the ten questions
  let idx = 0;         // which one you're on (0-9)
  let score = 0, streak = 0, correct = 0;
  let answered = false;   // have you picked on THIS question yet?
  let mode = null;        // 'hub' | 'quiz' | 'result'

  const hud = () => $('trv-hud');
  const stage = () => $('trv-stage');

  // ---- 🏠 the hub ---------------------------------------------------------
  function showHub() {
    mode = 'hub'; round = null;
    if (hud()) hud().style.display = 'none';
    const s = stage(); if (!s) return;
    const r = rank();
    const asked = rec.right + rec.wrong;
    const pct = asked > 0 ? Math.round((rec.right / asked) * 100) : 0;
    s.innerHTML =
      `<div class="trv-hero">
        <div class="trv-rank-ic">${r.ic}</div>
        <div class="trv-rank-nm">${r.nm}</div>
        <div class="trv-rank-sub">Your football IQ rank</div>
      </div>
      <div class="trv-stats">
        <div class="trv-stat"><b>${rec.best}</b><span>Best score</span></div>
        <div class="trv-stat"><b>${rec.played}</b><span>Quizzes</span></div>
        <div class="trv-stat"><b>${pct}<small>%</small></b><span>Correct</span></div>
      </div>
      <div class="trv-go" id="trv-start">▶ START THE QUIZ</div>
      <div class="trv-note">Ten questions about real football. No clock — take as long as you like.
        Answer in a row for bonus points, and get all ten for a <b>perfect bonus</b>.</div>`;
    const go = $('trv-start');
    if (go) go.addEventListener('pointerdown', e => { e.preventDefault(); startQuiz(); });
  }

  // ---- ▶ the quiz itself --------------------------------------------------
  function startQuiz() {
    mode = 'quiz';
    round = buildRound();
    idx = 0; score = 0; streak = 0; correct = 0;
    if (hud()) hud().style.display = 'flex';
    paintHud();
    paintQuestion();
  }

  function paintHud() {
    const h = hud(); if (!h) return;
    h.innerHTML =
      `<span class="trv-hud-q">Q ${Math.min(idx + 1, ROUND)}/${ROUND}</span>` +
      `<span class="trv-hud-st">${streak > 1 ? '🔥 ' + streak + ' in a row' : ''}</span>` +
      `<span class="trv-hud-s">${score}</span>`;
  }

  function paintQuestion() {
    const s = stage(); if (!s || !round) return;
    answered = false;
    const q = round[idx];
    const stars = '●'.repeat(q.t) + '○'.repeat(3 - q.t);
    s.innerHTML =
      `<div class="trv-tier">${stars} ${q.t === 1 ? 'BASICS' : q.t === 2 ? 'FOOTBALL WORDS' : 'TRICKY ONE'}</div>
       <div class="trv-q">${q.q}</div>
       <div class="trv-answers">` +
        q.a.map((txt, i) => `<div class="trv-a" data-i="${i}">${txt}</div>`).join('') +
       `</div>
       <div class="trv-why" id="trv-why"></div>
       <div class="trv-next-wrap" id="trv-next-wrap"></div>`;
    s.querySelectorAll('.trv-a').forEach(el => el.addEventListener('pointerdown', e => {
      e.preventDefault();
      answer(parseInt(el.getAttribute('data-i'), 10));
    }));
  }

  function answer(i) {
    if (answered || mode !== 'quiz' || !round) return;
    answered = true;
    const q = round[idx];
    const right = i === q.c;

    // Mark every button: green on the right one, red on your wrong pick.
    const s = stage();
    s.querySelectorAll('.trv-a').forEach(el => {
      const n = parseInt(el.getAttribute('data-i'), 10);
      el.classList.add('locked');
      if (n === q.c) el.classList.add('right');
      else if (n === i) el.classList.add('wrong');
    });

    if (right) {
      correct++;
      streak++;
      // Base is worth more for a harder question; the streak adds on top.
      const base = 10 + (q.t - 1) * 5;
      const bonus = Math.min(10, (streak - 1) * 2);
      score += base + bonus;
      rec.right++;
    } else {
      streak = 0;
      rec.wrong++;
    }
    paintHud();

    const why = $('trv-why');
    if (why) {
      why.className = 'trv-why show ' + (right ? 'good' : 'bad');
      why.innerHTML = `<b>${right ? '✅ Correct!' : '❌ Not quite.'}</b> ${q.why}`;
    }
    const wrap = $('trv-next-wrap');
    if (wrap) {
      const last = idx >= ROUND - 1;
      wrap.innerHTML = `<div class="trv-next" id="trv-next">${last ? '🏁 SEE YOUR SCORE' : 'NEXT →'}</div>`;
      $('trv-next').addEventListener('pointerdown', e => { e.preventDefault(); next(); });
    }
  }

  function next() {
    if (mode !== 'quiz' || !answered) return;
    if (idx >= ROUND - 1) { finish(); return; }
    idx++;
    paintHud();
    paintQuestion();
  }

  // ---- 🏁 the result ------------------------------------------------------
  function finish() {
    mode = 'result';
    const perfect = correct === ROUND;
    if (perfect) score += PERFECT_BONUS;

    const isBest = score > rec.best;
    if (isBest) rec.best = score;
    rec.played++;
    save();

    const coins = Math.min(20, Math.floor(score / 12));
    if (coins > 0 && window.TDShop) TDShop.earn(coins);

    if (hud()) hud().style.display = 'none';
    const r = rank();
    const s = stage(); if (!s) return;
    s.innerHTML =
      `<div class="trv-result">
        <div class="trv-res-t">${perfect ? '🏆 A PERFECT ROUND!' : correct >= 7 ? '🧠 Nice work!' : correct >= 4 ? '👍 Not bad!' : '📚 Keep studying!'}</div>
        <div class="trv-res-score">${score}</div>
        <div class="trv-res-line">${correct} of ${ROUND} correct${perfect ? ` · +${PERFECT_BONUS} perfect bonus` : ''}</div>
        ${isBest ? '<div class="trv-res-best">⭐ NEW BEST SCORE!</div>' : ''}
        ${coins > 0 ? `<div class="trv-res-coins">+${coins} 🪙</div>` : ''}
        <div class="trv-res-rank">${r.ic} ${r.nm}</div>
        <div class="trv-res-btns">
          <div class="ov-btn" id="trv-again">PLAY AGAIN</div>
          <div class="ov-btn" id="trv-tohub">← QUIZ MENU</div>
        </div>
      </div>`;
    $('trv-again').addEventListener('pointerdown', e => { e.preventDefault(); startQuiz(); });
    $('trv-tohub').addEventListener('pointerdown', e => { e.preventDefault(); showHub(); });
  }

  // ---- pop-up plumbing ----------------------------------------------------
  function gameKeyboard(on) { try { window.game.input.keyboard.enabled = on; } catch (e) {} }
  function open()  { const m = $('trivia-modal'); if (!m) return; gameKeyboard(false); showHub(); m.style.display = 'flex'; }
  function close() { mode = null; round = null; const m = $('trivia-modal'); if (m) m.style.display = 'none'; gameKeyboard(true); }
  // Back to the Arcade you came from, rather than dumping you on the menu.
  function backToArcade() { close(); if (window.TDArcade) TDArcade.open(); }

  function wire() {
    const tap = (id, fn) => { const el = $(id); if (el) el.addEventListener('pointerdown', e => { e.preventDefault(); fn(); }); };
    tap('trivia-close', close);
    tap('trv-back', backToArcade);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire);
  else wire();

  window.TDTrivia = {
    open, close, showHub,
    best: () => rec.best,
    rank,
    record: () => Object.assign({}, rec),
    // for verification
    _state: () => ({ mode, idx, score, streak, correct, answered, len: round ? round.length : 0 }),
    _round: () => round,
    _start: startQuiz, _answer: answer, _next: next,
    _bank: () => BANK.length,
  };
})();
