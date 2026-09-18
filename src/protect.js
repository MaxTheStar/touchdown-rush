// ============================================================
// TOUCHDOWN FUN — protect.js: 🛡 PASS PROTECTION (Round 12, pick ⑧ — the last)
// ------------------------------------------------------------
// The hardest pick on the Rulebook Board, and the offensive mirror of 🛡️ Call
// Your Own Defense (v2.6): you have been choosing what the DEFENSE does for a
// round and a half — now choose how your own quarterback gets protected.
//
// Three schemes, and every one of them is a real trade:
//
//   🛡 MAX PROTECT   The running back stays in and blocks. FOUR blockers
//                    instead of three, and the pocket holds noticeably longer.
//                    ⚠️ The cost is real: he runs no route, so you are throwing
//                    to two receivers instead of three, and you cannot hand off
//                    to a man who is busy blocking a linebacker.
//
//   ⚖️ BALANCED      What this game has always done. Three linemen block, the
//                    back releases. ⚠️ THIS IS THE DEFAULT ON PURPOSE — with
//                    this scheme selected every number below is exactly 1 or
//                    unchanged, so the game plays byte-identically to before
//                    this file existed.
//
//   🏃 FIVE OUT      Everybody releases and the routes come open quicker, but
//                    the line is stretched and the pocket collapses fast. The
//                    ball has to be gone.
//
// ------------------------------------------------------------
// HOW A POCKET WORKS IN THIS GAME (worth knowing before changing it)
// ------------------------------------------------------------
// Two pieces of main.js, and they are smaller than you would expect:
//
//   · `updateLine()` — each 'OL' slides in FRONT of the nearest unclaimed
//     rusher, between him and the quarterback.
//   · `nearBlocker(d)` — if any 'OL' is within BLOCK_DIST (30px) of rusher d,
//     that rusher is slowed to `diff().rushSlow` (easy 0.18 → hard 0.50).
//
// That is the whole pocket. So this file needs exactly two things to be true:
// the back has to COUNT as a blocker in both those functions, and `rushSlow`
// has to bend by the scheme. Everything else falls out.
//
// ⚠️ AND NOTE WHICH WAY `rushSlow` POINTS — it is the speed a BLOCKED rusher
// keeps, so SMALLER is a STRONGER pocket. Max protect multiplies it DOWN. Get
// that backwards and the feature does the exact opposite of what it says, in a
// way that would be very hard to see on screen.
//
// ------------------------------------------------------------
// WHERE IT LIVES, AND WHY THERE
// ------------------------------------------------------------
// Inside the 🗣️ AUDIBLE panel — the screen you already open at the line to
// change the play. That is where a protection call belongs in real football,
// and it means this feature costs **zero new screen space**, which matters:
// `#ingame-ctrls` is built for four buttons and both mid-screen edges are
// already taken (⏱️ clock + ⏰ hurry-up on the left, ⚡ power-ups on the right).
//
// ⚠️ A NICE ACCIDENT FALLS OUT OF THAT: ⏰ the hurry-up hides the 🗣️ button,
// so during a no-huddle you cannot change protection either — which is exactly
// right. There is no time to slide the line when you are sprinting to the ball.
//
// ⚠️ THE SCHEME IS STICKY, unlike the defensive call. A defensive call is one
// play; protection is a SCHEME, and real teams have a base one they live in.
// Making a nine-year-old re-pick it every single down would turn a good idea
// into a chore. It resets to ⚖️ BALANCED at the start of each game.
//
// Nothing is saved between games — same call clockplay.js, hurry.js and
// momentum.js made, for the same reason.
// ============================================================
(function () {
  'use strict';

  const $ = id => document.getElementById(id);
  const G = () => (window.__td ? window.__td.G : null);

  // ---- the three schemes --------------------------------------------------
  // rush  = what `diff().rushSlow` gets multiplied by (SMALLER = stronger pocket)
  // route = how fast the receivers run their routes
  // back  = does the running back stay in and block?
  const SCHEMES = [
    { id: 'max', ic: '🛡', name: 'MAX PROTECT', rush: 0.72, route: 1.00, back: true,
      blurb: 'Back stays in. Long pocket, one fewer target.' },
    { id: 'balanced', ic: '⚖️', name: 'BALANCED', rush: 1.00, route: 1.00, back: false,
      blurb: 'Three blockers, everyone else out. The usual.' },
    { id: 'five', ic: '🏃', name: 'FIVE OUT', rush: 1.32, route: 1.10, back: false,
      blurb: 'Everybody releases. Quick routes, no pocket.' },
  ];
  const DEFAULT = 'balanced';

  let id = DEFAULT;
  const scheme = () => SCHEMES.find(s => s.id === id) || SCHEMES[1];

  function newGame() { id = DEFAULT; paint(); }

  // ============================================================
  // WHAT main.js ASKS
  // ------------------------------------------------------------
  // All four of these return the do-nothing value for ⚖️ BALANCED, which is
  // what makes the default byte-identical to the old game.
  // ============================================================

  // Is this player blocking on this snap? (Only ever the running back — the
  // linemen are already blockers by their role and main.js finds them itself.)
  //
  // ⚠️ AND ONLY WHEN THE BALL IS STILL WITH THE QUARTERBACK. The moment it is
  // handed off or thrown, the "pocket" is over and the back should behave like
  // anybody else — otherwise a max-protect back would stand there blocking
  // nobody while his teammate ran for daylight.
  function blocking(o) {
    if (!scheme().back) return false;
    const g = G();
    if (!g || !o) return false;
    const off = window.__td.offense;
    if (!off || o !== off[1]) return false;        // the back, and only the back
    if (g.hasPassed) return false;
    if (g.ballCarrier && g.ballCarrier !== off[0]) return false;
    return true;
  }

  // The pocket. ⚠️ Multiplies `diff().rushSlow`, so SMALLER = a rusher who has
  // been blocked moves slower = the quarterback gets longer.
  function rushSlowMult() { return scheme().rush; }

  // How quickly the routes develop.
  function routeMult() { return scheme().route; }

  // ---- the row inside the 🗣️ audible panel --------------------------------
  // ⚠️ It lives in its OWN element, a sibling of #aud-body — audible.js rewrites
  // that body's innerHTML every time it renders, and anything of ours inside it
  // would be wiped the first time you opened the panel.
  function paint() {
    const row = $('pp-row');
    if (!row) return;
    const cur = scheme();
    row.innerHTML =
      '<div class="pp-head">🛡 PASS PROTECTION</div>' +
      '<div class="pp-opts">' +
      SCHEMES.map(s =>
        '<div class="pp-btn' + (s.id === cur.id ? ' on' : '') + '" data-id="' + s.id + '">' +
          '<b>' + s.ic + ' ' + s.name + '</b><span>' + s.blurb + '</span>' +
        '</div>').join('') +
      '</div>';
    row.querySelectorAll('.pp-btn').forEach(el => {
      el.addEventListener('pointerdown', e => {
        // The panel behind this has its own taps; don't let ours run the play.
        e.preventDefault();
        e.stopPropagation();
        choose(el.getAttribute('data-id'));
      });
    });
  }

  function choose(next) {
    if (!SCHEMES.some(s => s.id === next)) return;
    id = next;
    paint();
    if (window.TDSound) TDSound.sting('coin');
    // Redraw the pre-snap route preview: with the back blocking he has no route
    // to show, and a preview that still drew one would be telling you a lie.
    try { if (window.__td && __td.drawRoutePreview) __td.drawRoutePreview(); } catch (e) {}
  }

  // main.js calls this at every line of scrimmage — it just keeps the row
  // painted and in sync. The scheme itself is sticky and survives the down.
  function newPlay() { paint(); }

  function setup() { paint(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup);
  else setup();

  window.TDProtect = {
    blocking, rushSlowMult, routeMult, newGame, newPlay, paint,
    call: () => id, set: choose, schemes: () => SCHEMES.slice(),
    current: scheme,
  };
})();
