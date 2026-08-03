// ============================================================
// TOUCHDOWN RUSH — tour.js: the friendly STEP-BY-STEP tutorial
// ------------------------------------------------------------
// Nobody wants to read a giant wall of rules! So instead we teach the game a
// LITTLE at a time: a small card pops up, points at ONE thing, you tap "Next",
// and it moves on to the next thing… and the next. Each "area" of the game (the
// team menu, your first offense play, your first time on defense) has its own
// short tour, and each one only ever shows the FIRST time you get there.
//
// main.js just calls:   TDTour.maybeStart('menu' | 'offense' | 'defense')
// ============================================================
(function () {
  'use strict';

  function seen(name)     { try { return localStorage.getItem('tdr-tour-' + name) === '1'; } catch (e) { return false; } }
  function markSeen(name) { try { localStorage.setItem('tdr-tour-' + name, '1'); } catch (e) {} }

  // Each tour is a list of steps. A step teaches ONE thing:
  //   text   — the friendly one-liner
  //   target — (optional) the id of an on-screen button to spotlight with a ring
  //   place  — (optional) 'center' just floats the card (for stuff drawn on the field)
  const TOURS = {
    menu: [
      { text: "👋 Welcome to Touchdown Rush! Use the ◀ ▶ arrows to pick your team.", target: 'tm-next' },
      { text: "⭐ Every team has Offense &amp; Defense star ratings — some are better at scoring, some at stopping you!", place: 'center' },
      { text: "🎚️ Choose how tough the game is: EASY, MEDIUM, or HARD.", target: 'tm-diff' },
      { text: "🛍️ SHOP for gear · 🎁 DAILY for a free gift · 🏆 SEASON for a whole league.", target: 'menu-meta' },
      { text: "▶️ When you're ready, tap PLAY. Have fun out there, coach!", target: 'tm-play' },
    ],
    offense: [
      { text: "🏈 You're on OFFENSE (the cyan team). Tap HIKE to start the play.", target: 'btn-snap' },
      { text: "🎯 To pass, just TAP the receiver you want to throw to — or press 1, 2, or 3.", target: 'pass-grid' },
      { text: "🏃 Move around with these arrows. Cross the far goal line for a TOUCHDOWN!", target: 'dpad' },
      { text: "🤝 Or tap HAND to give the ball to your running back and run it up the middle.", target: 'btn-hand' },
    ],
    defense: [
      { text: "🛡️ Now you're on DEFENSE! You control the player with the YOU tag.", place: 'center' },
      { text: "💥 Chase whoever has the ball and bump into them to make the TACKLE.", place: 'center' },
      { text: "🙌 Snag their pass and it's a PICK — then run it all the way back to score!", place: 'center' },
    ],
  };

  let steps = null, idx = 0, name = null, ui = null;

  // main.js checks this so the CPU won't snap the ball while a tour is up.
  function active() { return steps !== null; }

  // Is a pop-up (shop / daily / season / review) currently covering the screen?
  // If so, the menu tour waits politely until it's closed.
  function anyModalOpen() {
    const mods = document.querySelectorAll('.ov, #review-modal');
    for (const m of mods) { if (getComputedStyle(m).display !== 'none') return true; }
    return false;
  }

  // Build the card + spotlight ring once, then reuse them.
  function build() {
    if (ui) return ui;
    const back = document.createElement('div'); back.className = 'tour-back';
    const ring = document.createElement('div'); ring.className = 'tour-ring';
    const card = document.createElement('div'); card.className = 'tour-card';
    const txt  = document.createElement('div'); txt.className  = 'tour-text';
    const bar  = document.createElement('div'); bar.className  = 'tour-bar';
    const dots = document.createElement('div'); dots.className = 'tour-dots';
    const skip = document.createElement('button'); skip.className = 'tour-skip'; skip.textContent = 'Skip';
    const next = document.createElement('button'); next.className = 'tour-next';
    bar.appendChild(dots); bar.appendChild(skip); bar.appendChild(next);
    card.appendChild(txt); card.appendChild(bar);
    back.appendChild(ring); back.appendChild(card);
    document.body.appendChild(back);
    // Swallow taps so they don't reach the game/menu hiding behind the tour.
    back.addEventListener('pointerdown', e => { e.stopPropagation(); });
    next.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); advance(); });
    skip.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); finish(); });
    ui = { back, ring, card, txt, dots, skip, next };
    return ui;
  }

  function show() {
    if (!steps) return;
    if (anyModalOpen()) { setTimeout(show, 400); return; }   // let a popup finish first
    const u = build();
    const step = steps[idx];
    u.txt.innerHTML = step.text;
    u.next.textContent = (idx === steps.length - 1) ? "Got it! 🏈" : 'Next ▶';

    u.dots.innerHTML = '';
    for (let i = 0; i < steps.length; i++) {
      const d = document.createElement('span');
      d.className = 'tour-dot' + (i === idx ? ' on' : '');
      u.dots.appendChild(d);
    }

    // Spotlight the target button (if any) and keep the card off of it.
    const el = step.target ? document.getElementById(step.target) : null;
    const r  = el ? el.getBoundingClientRect() : null;
    if (r && r.width && r.height) {
      const pad = 8;
      u.ring.style.display = 'block';
      u.ring.style.left   = (r.left - pad) + 'px';
      u.ring.style.top    = (r.top  - pad) + 'px';
      u.ring.style.width  = (r.width  + pad * 2) + 'px';
      u.ring.style.height = (r.height + pad * 2) + 'px';
      // If the target sits low on the screen, move the card UP so it never covers it.
      u.card.classList.toggle('tour-card-top', (window.innerHeight - r.bottom) < 230);
    } else {
      u.ring.style.display = 'none';
      u.card.classList.remove('tour-card-top');
    }
    u.back.style.display = 'block';
  }

  function advance() {
    idx++;
    if (idx >= steps.length) { finish(); return; }
    show();
  }

  function finish() {
    if (name) markSeen(name);
    if (ui) ui.back.style.display = 'none';
    steps = null; name = null; idx = 0;
  }

  function start(n, force) {
    if (active()) return;
    const s = TOURS[n];
    if (!s) return;
    if (!force && seen(n)) return;
    name = n; steps = s; idx = 0;
    // On the menu, wait past the daily-gift popup (it opens on a ~600ms timer) so
    // the gift shows first and the tour follows once it's closed. Elsewhere a
    // short beat is enough for the buttons to lay out.
    setTimeout(show, n === 'menu' ? 800 : 150);
  }
  function maybeStart(n) { start(n, false); }

  window.TDTour = { start, maybeStart, active, seen };
})();
