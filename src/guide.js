// ============================================================
// TOUCHDOWN FUN — guide.js: 📖 THE BUTTON GUIDE (Round 22, pick ⑥)
// ------------------------------------------------------------
// Twenty-one rounds of buttons, and the only way to learn what one does was to meet it. ONE list (GUIDE below) says what every
// in-game button is, what it does and — the part nobody could know — WHEN IT SHOWS UP. Most of them do not exist until the moment they
// can mean something (a 🤸 DIVE with no tackler is just a way to lose a yard), so a reader who goes looking for "the HAIL MARY button" in
// the second quarter is not missing it; it is not there yet. The panel says so, and marks the ones that are up RIGHT NOW by asking the
// real element whether it is on screen — it can not drift from the game.
//
//     TDGuide.open()   TDGuide.close()   TDGuide.missing()  ← buttons in the page that this list forgot (a test hook)
// ⚠️ A new button needs one line here; `missing()` is how the end-of-board check catches a forgotten one.
// ============================================================
(function () {
  'use strict';
  const $ = id => document.getElementById(id);

  // [element id, icon, name, what it does, when it is there, tier]
  // tier 0 = a button you can always have; 1 = hidden in 🧒 ROOKIE mode; 2 = hidden in ROOKIE and in MORE (see rookie.js, which reads this)
  const GUIDE = [
    { g: 'ALWAYS THERE', items: [
      ['btn-mute', '🔊', 'SOUND', 'Mutes or un-mutes everything.', 'Always.', 0],
      ['btn-view', '3D', 'VIEW', 'Flips between the flat field and the tilted 3D look.', 'Always.', 0],
      ['btn-mode', '1P', 'PLAYERS', 'One player (you vs the computer) or two players on one screen.', 'Always.', 0],
      ['btn-pause', '⏸', 'PAUSE', 'Freezes the game and the music. Resume, open settings, or quit.', 'During a game. Not during a timing moment (the jump ball, toe-tap…), which runs on a real clock.', 0],
      ['btn-timeout', '⏱', 'TIMEOUT', 'Stops the clock. The number is how many you have left in the half.', 'During a game.', 0],
      ['btn-power', '⚡', 'POWER-UPS', 'At the line it opens your picker; during a play it fires your once-a-game hero move.', 'Once you have equipped a power-up play.', 0],
    ]},
    { g: 'BEFORE THE SNAP (offense)', items: [
      ['btn-formation', '🧩', 'FORMATION', 'Changes how your team lines up. SHOTGUN stands the QB deeper: about 0.2s more time to throw, but handoffs start later.', 'At the line, before the snap.', 1],
      ['btn-trick', '🎩', 'TRICK', 'The flea flicker: fake the run, then spring a receiver deep. One per game.', 'Before the snap, until you have used your one.', 2],
      ['btn-audible', '🗣️', 'AUDIBLE', 'Change the play after you see what the defense is showing.', 'Before the snap, once the defense is showing you something to read.', 1],
      ['btn-motion', '👀', 'MOTION', 'Send a receiver across and watch who follows him: man or zone.', 'Before the snap only.', 2],
      ['btn-draw', '🎭', 'DRAW', 'Look like a pass, then hand it off behind the rush.', 'Before the snap. It greys out when it would not work.', 2],
      ['btn-screen', '🧱', 'SCREEN', 'Let the rush come, then throw short behind your blockers.', 'Before the snap. It greys out when it would not work.', 2],
      ['btn-pa', '🎣', 'PLAY ACTION', 'Fake the hand-off so the linebackers bite. Needs a real running threat.', 'Before the snap.', 2],
      ['btn-boot', '🌀', 'BOOTLEG', 'Fake one way, roll out the other.', 'Before the snap.', 2],
      ['btn-hard', '🗣', 'HARD COUNT', 'Bark at the line. Sometimes a defender jumps: 5 free yards.', 'Before the snap on 1st, 2nd and 3rd down. One try a down.', 2],
      ['btn-calls', '📋', 'SPECIAL', 'Cycles through the formations that change who has the ball: wildcat, jet sweep, option.', 'Before the snap.', 2],
      ['btn-sneak', '🐢', 'QB SNEAK', 'Quarterback pushes for the last yard.', 'Only within about 2½ yards of the marker or goal line.', 1],
      ['btn-hurry', '⏰', 'HURRY UP', 'Skip the huddle for more plays out of the same clock.', 'Only when you are behind late in a half.', 1],
      ['btn-hail', '🙏', 'HAIL MARY', 'One huge heave to the end zone.', 'Only the last snap of a half (or of a game you are losing by a score or less), 25+ yards out.', 0],
      ['btn-clock', '🏈', 'SPIKE / KNEEL', 'Spike to stop the clock, or kneel to run it out.', 'Only when the clock decides the game: behind and out of time, or ahead and nearly home.', 0],
      ['btn-fakespike', '🎭', 'FAKE SPIKE', 'Look like a spike, then throw.', 'Only in the spike moment.', 2],
    ]},
    { g: 'DURING A PLAY (offense)', items: [
      ['btn-lob', '🏹', 'LOB', 'Your next throw floats over a linebacker instead of firing flat.', 'While you could still throw.', 1],
      ['btn-pump', '🧢', 'PUMP FAKE', 'Freeze a defender. One fake a play.', 'While the quarterback could still throw.', 1],
      ['btn-throwaway', '🧤', 'THROW AWAY', 'Dump it out of bounds. Green outside the pocket; red ⚠ inside it means intentional grounding.', 'Only while a rusher is on you.', 0],
      ['btn-slide', '🛝', 'QB SLIDE', 'Go down feet first and keep the ball. Gives up the rest of the run.', 'Only after the quarterback crosses the line with the ball.', 0],
      ['btn-hotroute', '🪁', 'HOT ROUTE', 'Beat a blitz: the open receiver cuts to a quick route.', 'Only on a blitz.', 1],
      ['btn-pitch', '🔄', 'PITCH', 'Flip it to a teammate level with you or behind you.', 'Only when a legal pitch exists.', 0],
      ['btn-hurdle', '🦘', 'HURDLE', 'Jump the tackler standing right in front of you. Timing is the whole thing, and a miss is costly.', 'Only while a tackler is dead ahead of the ball carrier. Easier: tap SPACE (or the big HIKE button) after the snap and you hurdle.', 1],
      ['btn-juke', '🪄', 'JUKE', 'Beat a tackler. Timing is the whole thing: not too early, not too late.', 'Only while a tackler is closing on the ball carrier. Space / HIKE after the snap juke too.', 1],
      ['btn-dive', '🤸', 'DIVE', 'Stretch for the marker. Gold on the goal line.', 'Only when you are a stretch short with a tackler closing.', 0],
    ]},
    { g: 'KICKING GAME', items: [
      ['btn-faircatch', '🙋', 'FAIR CATCH', 'Wave it: no return, no tackle, no muff.', 'Only while a punt is in the air.', 0],
      ['btn-touchback', '🧎', 'TOUCHBACK', 'Kneel it: your ball on your own 25.', 'Only while a kickoff that reached the end zone is falling.', 0],
    ]},
  ];

  const all = () => GUIDE.reduce((a, s) => a.concat(s.items), []);
  const live = id => { const el = $(id); if (!el) return false; const cs = getComputedStyle(el); return cs.display !== 'none' && cs.visibility !== 'hidden' && el.getClientRects().length > 0; };

  function render() {
    const body = $('guide-body'); if (!body) return;
    body.innerHTML = GUIDE.map(s => '<div class="gd-sec">' + s.g + '</div>' + s.items.map(r => {
      const up = live(r[0]); const hid = !up && r[5] && document.body.classList.contains('rk-hide-' + r[5]);
      return '<div class="gd-row' + (up ? ' up' : '') + (hid ? ' hid' : '') + '"><div class="gd-ic">' + r[1] + '</div><div class="st-txt"><b>' + r[2] + (up ? ' <i>UP NOW</i>' : '') + (hid ? ' <i class="gd-hid">🧒 HIDDEN</i>' : '') + '</b><span>' + r[3] + '</span><span class="gd-when">⏳ ' + r[4] + '</span></div></div>';
    }).join('')).join('');
  }
  function open() { const m = $('guide-modal'); if (!m) return; render(); m.style.display = 'flex'; }
  function close() { const m = $('guide-modal'); if (m) m.style.display = 'none'; }
  // every `.btn` / `.rc` the page has an id for, that the list does not mention (the D-pad, pass buttons and the menu chips are not "buttons to learn")
  const EXEMPT = /^(btn-(up|down|left|right|[123]|hand|snap|fs)|btn2-)/;
  function missing() {
    const have = new Set(all().map(r => r[0]));
    return Array.from(document.querySelectorAll('.btn[id]')).map(e => e.id).filter(id => !have.has(id) && !EXEMPT.test(id));
  }
  function wire() {
    const tap = (id, fn) => { const el = $(id); if (el) el.addEventListener('pointerdown', e => { e.preventDefault(); fn(); }); };
    tap('open-guide', open); tap('pause-guide', open); tap('guide-close', close);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire); else wire();
  window.TDGuide = { open, close, missing, _list: all, _live: live };
})();
