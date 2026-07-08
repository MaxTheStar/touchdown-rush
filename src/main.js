// ============================================================
// TOUCHDOWN RUSH — Session 2: 7-on-7, the snap, run OR pass
// ------------------------------------------------------------
// Real football math: 1 yard = 10 pixels.
// The field runs top-to-bottom. Max's team (MAX FC, blue) drives
// UP the screen toward the top endzone. Defense (red) plays down.
//
// A "play" goes: line up -> SNAP (space) -> run with arrows,
// or throw to receiver 1/2/3 while the QB is behind the line.
// Get tackled, score, or throw incomplete -> next down.
// 4 downs to gain 10 yards = a first down. Reach the endzone = 6,
// then kick the extra point for +1 (7 total).
// ============================================================

// ---- Field dimensions ----
const PX_PER_YARD = 10;
const FIELD_WIDTH = 533;                  // 53.3 yards wide
const FIELD_LENGTH = 120 * PX_PER_YARD;   // 120 yards (100 + two endzones)
const ENDZONE = 10 * PX_PER_YARD;         // 10-yard endzones

// ---- Field colors (team colors live in NFL_TEAMS, chosen at the menu) ----
const ENDZONE_COLOR = 0x14337a;   // the painted endzones at each end
const GRASS_DARK = 0x2d7a2d;
const GRASS_LIGHT = 0x379437;

// ---- Speeds (pixels/sec) — tune these to make it easier/harder ----
const PLAYER_SPEED = 215;   // the player you control
const WR_SPEED     = 195;   // receivers running routes
const DEF_SPEED    = 196;   // defenders (a touch slower than you = still beatable)
const OL_SPEED     = 182;   // your linemen mirroring the rush to protect the QB
const BALL_SPEED   = 520;   // how fast a pass flies

// ---- Distances ----
const TACKLE_DIST = 15;   // defender this close to the ball = tackle
const BLOCK_DIST  = 22;   // lineman this close to a rusher = blocks him
const CATCH_CONTEST = 15; // defender this close to the catch = contested

// ---- Pass outcome chances (0..1) — tune for more/fewer drops & picks ----
const CATCH_CHANCE = 0.85; // an OPEN receiver hauls it in...
const DROP_CHANCE  = 0.12; // ...but might catch it and then drop it
const INT_CHANCE   = 0.40; // if a defender is right there, he PICKS IT OFF (else knocks it down)

// ---- Fumbles — a big tackle can knock the ball loose ----
const FUMBLE_CHANCE      = 0.12; // this often, a tackle pops the ball out
const OFF_RECOVER_CHANCE = 0.5;  // ...and your team dives on its own fumble half the time

// ---- Kicking — on 4th down you can try a field goal or punt ----
// A field goal is worth 3 points. How far is the kick? From where the ball
// is, plus 17 yards (the snap is ~7 yards back and the posts are 10 yards
// deep in the endzone). If that's 55 yards or less, you're "in range".
const FG_MAX_DIST = 55;                     // longest field goal you're allowed to try
function fieldGoalDistance() { return (100 - G.losYards) + 17; }
function inFieldGoalRange()  { return fieldGoalDistance() <= FG_MAX_DIST; }

// After a touchdown you get one EXTRA-POINT kick, worth +1. It's a short,
// easy chip shot from a fixed spot — same tap-to-aim, tap-to-power kick.
const XP_DISTANCE = 20;   // how far the extra point is, in yards (short = easy)

// ---- Kickoffs — YOU return the kick: catch it deep and run it back ----
// A new possession (start of game, after a score, after a turnover) begins with
// a kickoff return: the ball is booted to your returner near his own goal, you
// run it back through the coverage team, and where you're tackled is where your
// drive starts. Break all the way through = a return touchdown!
const KO_COVER_SPEED = 190;   // how fast the coverage team chases you (you run 215, so it's beatable)

// ---- The teams! ----------------------------------------------------------
// Every real NFL team, with its own two colors: a JERSEY color (the body) and
// a HELMET color (the head). We use the real 3-letter codes (SEA, PIT, ...)
// instead of the real logos, because the logos belong to the NFL and this game
// is public. Codes are exactly what real scoreboards and helmets use anyway.
// At the main menu you pick YOUR team; the computer gets a random other one.
const NFL_TEAMS = [
  { abbr: 'SEA', name: 'SEAHAWKS',   jersey: 0x002244, helmet: 0x69BE28 },  // Seattle — navy + action green
  { abbr: 'PIT', name: 'STEELERS',   jersey: 0x101820, helmet: 0xFFB612 },  // Pittsburgh — black + gold
  { abbr: 'BUF', name: 'BILLS',      jersey: 0x00338D, helmet: 0xC60C30 },
  { abbr: 'MIA', name: 'DOLPHINS',   jersey: 0x008E97, helmet: 0xFC4C02 },
  { abbr: 'NE',  name: 'PATRIOTS',   jersey: 0x002244, helmet: 0xC60C30 },
  { abbr: 'NYJ', name: 'JETS',       jersey: 0x125740, helmet: 0xFFFFFF },
  { abbr: 'BAL', name: 'RAVENS',     jersey: 0x241773, helmet: 0x000000 },
  { abbr: 'CIN', name: 'BENGALS',    jersey: 0xFB4F14, helmet: 0x000000 },
  { abbr: 'CLE', name: 'BROWNS',     jersey: 0xFF3C00, helmet: 0x311D00 },
  { abbr: 'HOU', name: 'TEXANS',     jersey: 0x03202F, helmet: 0xA71930 },
  { abbr: 'IND', name: 'COLTS',      jersey: 0x002C5F, helmet: 0xFFFFFF },
  { abbr: 'JAX', name: 'JAGUARS',    jersey: 0x006778, helmet: 0xD7A22A },
  { abbr: 'TEN', name: 'TITANS',     jersey: 0x0C2340, helmet: 0x4B92DB },
  { abbr: 'DEN', name: 'BRONCOS',    jersey: 0xFB4F14, helmet: 0x002244 },
  { abbr: 'KC',  name: 'CHIEFS',     jersey: 0xE31837, helmet: 0xFFB81C },
  { abbr: 'LV',  name: 'RAIDERS',    jersey: 0x000000, helmet: 0xA5ACAF },
  { abbr: 'LAC', name: 'CHARGERS',   jersey: 0x0080C6, helmet: 0xFFC20E },
  { abbr: 'DAL', name: 'COWBOYS',    jersey: 0x041E42, helmet: 0x869397 },
  { abbr: 'NYG', name: 'GIANTS',     jersey: 0x0B2265, helmet: 0xA71930 },
  { abbr: 'PHI', name: 'EAGLES',     jersey: 0x004C54, helmet: 0xA5ACAF },
  { abbr: 'WAS', name: 'COMMANDERS', jersey: 0x5A1414, helmet: 0xFFB612 },
  { abbr: 'CHI', name: 'BEARS',      jersey: 0x0B162A, helmet: 0xC83803 },
  { abbr: 'DET', name: 'LIONS',      jersey: 0x0076B6, helmet: 0xB0B7BC },
  { abbr: 'GB',  name: 'PACKERS',    jersey: 0x203731, helmet: 0xFFB612 },
  { abbr: 'MIN', name: 'VIKINGS',    jersey: 0x4F2683, helmet: 0xFFC62F },
  { abbr: 'ATL', name: 'FALCONS',    jersey: 0xA71930, helmet: 0x000000 },
  { abbr: 'CAR', name: 'PANTHERS',   jersey: 0x0085CA, helmet: 0x101820 },
  { abbr: 'NO',  name: 'SAINTS',     jersey: 0x101820, helmet: 0xD3BC8D },
  { abbr: 'TB',  name: 'BUCCANEERS', jersey: 0xD50A0A, helmet: 0x34302B },
  { abbr: 'ARI', name: 'CARDINALS',  jersey: 0x97233F, helmet: 0x000000 },
  { abbr: 'LAR', name: 'RAMS',       jersey: 0x003594, helmet: 0xFFA300 },
  { abbr: 'SF',  name: '49ERS',      jersey: 0xAA0000, helmet: 0xB3995D },
];

const config = {
  type: Phaser.AUTO,
  width: 540,
  height: 720,
  parent: 'game-container',
  backgroundColor: '#2d7a2d',
  // Scale.FIT = keep the field's shape but shrink/grow it to fill the screen,
  // so it looks right on a computer, an iPad, or a phone. CENTER_BOTH keeps it centered.
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  physics: { default: 'arcade', arcade: { debug: false } },
  scene: { create, update }
};

// ---- Game state (one object so it's easy to read) ----
const G = {
  scene: null,
  state: 'menu',        // menu | kickoff | presnap | live | pass | dead | fumble | decision | kick
  koLive: false,        // during a kickoff: false = ball still in the air, true = run it back!
  score: 0,
  team: null,           // YOUR team (picked at the menu) — an entry from NFL_TEAMS
  oppTeam: null,        // the computer's team (a random other one)
  menuIndex: 0,         // which team the menu is showing right now
  menu: null,           // the menu's on-screen pieces (preview player, name, code)
  endzoneLabel: null,   // the team-name text painted in your home endzone
  down: 1,
  losYards: 20,         // line of scrimmage, yards from own goal
  firstDownYards: 30,   // yards-from-own-goal needed for a first down
  losY: 0,              // pixel y of the line of scrimmage
  ballCarrier: null,    // the offensive player object holding the ball
  hasPassed: false,     // has a pass been thrown this play?
  snapTime: 0,
  deadUntil: 0,
  next: null,           // where the next play starts, decided when a play ends
  kickKind: 'fg',       // what kind of kick is on screen: 'fg' | 'punt' | 'xp' (extra point)
  pendingXP: false,     // just scored a TD? then an extra-point kick comes next
  banner: null,
  twoPlayer: false,     // false = vs computer, true = a friend controls one defender
  p2Defender: null,     // the single red player Player 2 drives in 2-player mode
  p2Label: null,        // the "P2" tag floating over that defender
};

let offense = [];  // 7 blue players (objects, see makePlayer)
let defense = [];  // 7 red players
let ball;          // the football sprite
let ballFollow = true;
let referee;       // the striped official (flavor only, no physics)
let keys;          // keyboard

// ---- Touch controls (the on-screen buttons for iPad) ----
// The four arrows are "held": true while your finger is on them.
// The action buttons are "taps": we set the flag, then use it up once
// (just like pressing a key one time). See setupTouchButtons() below.
const touch = {
  left: false, right: false, up: false, down: false,   // held arrows
  snap: false, one: false, two: false, three: false, hand: false  // one-shot taps
};

// Player 2's arrows (the defense player in 2-player mode)
const touch2 = { left: false, right: false, up: false, down: false };

window.game = new Phaser.Game(config);

// ============================================================
// CREATE — build the field, the 14 players, the ball, the HUD
// ============================================================
function create() {
  G.scene = this;
  drawField(this);

  // Build starter uniforms so the players have something to wear. The real
  // colors get painted on when you pick your team at the menu (see renderMenu).
  makeChibiTexture(this, 'blue', NFL_TEAMS[0].jersey, NFL_TEAMS[0].helmet);
  makeChibiTexture(this, 'red',  NFL_TEAMS[1].jersey, NFL_TEAMS[1].helmet);
  makeBallTexture(this);
  makeRefTexture(this);

  // --- Offense: QB, RB, 2 receivers (1/2), 3 linemen ---
  // The RB is pass target #3 AND can take a handoff (press H).
  offense = [
    makePlayer(this, 'blue', 'QB', { num: 0 }),
    makePlayer(this, 'blue', 'RB', { num: 3, route: 'swing' }),
    makePlayer(this, 'blue', 'WR', { num: 1, route: 'slant' }),
    makePlayer(this, 'blue', 'WR', { num: 2, route: 'streak' }),
    makePlayer(this, 'blue', 'OL', {}),
    makePlayer(this, 'blue', 'OL', {}),
    makePlayer(this, 'blue', 'OL', {}),
  ];

  // --- Defense: 2 linemen, 2 linebackers, 3 defensive backs ---
  defense = [
    makePlayer(this, 'red', 'DL', {}),
    makePlayer(this, 'red', 'DL', {}),
    makePlayer(this, 'red', 'LB', {}),
    makePlayer(this, 'red', 'LB', {}),
    makePlayer(this, 'red', 'DB', { cover: 1 }), // covers WR #1
    makePlayer(this, 'red', 'DB', { cover: 2 }), // covers WR #2
    makePlayer(this, 'red', 'DB', { cover: 3 }), // covers WR #3
  ];

  ball = this.physics.add.sprite(0, 0, 'ball').setDepth(6);

  // The referee — a plain sprite (no physics body), so he's on the field
  // for realism but never blocks, tackles, or gets in the way.
  referee = this.add.sprite(0, 0, 'ref').setDepth(4);

  // Keyboard: arrows to move, SPACE to snap, 1/2/3 to pass
  keys = this.input.keyboard.addKeys({
    up: 'UP', down: 'DOWN', left: 'LEFT', right: 'RIGHT',
    snap: 'SPACE', one: 'ONE', two: 'TWO', three: 'THREE', hand: 'H',
    // Player 2 uses W A S D to drive the defender (handy for testing on a computer)
    w: 'W', a: 'A', s: 'S', d: 'D'
  });

  // Touch: hook the on-screen buttons up so taps work just like keys
  setupTouchButtons();

  // Player 2 drives a linebacker (defense[2]); float a "P2" tag over him
  G.p2Defender = defense[2];
  G.p2Label = this.add.text(0, 0, 'P2', {
    fontFamily: 'Arial Black, Arial', fontSize: '12px',
    color: '#ffe066', stroke: '#000', strokeThickness: 4
  }).setOrigin(0.5).setDepth(8).setVisible(false);

  // Camera & world
  this.physics.world.setBounds(0, 0, FIELD_WIDTH, FIELD_LENGTH);
  this.cameras.main.setBounds(0, 0, FIELD_WIDTH, FIELD_LENGTH);

  buildHUD(this);

  // Show the CHOOSE YOUR TEAM menu first. When you tap PLAY (startGameWithTeam)
  // it paints your colors on and kicks off the first drive at your own 20.
  buildTeamMenu(this);
  enterMenu();

  // Debug handle — lets you peek at the game from the browser console.
  // Try typing  __td.G.score  or  __td.G.state  in DevTools.
  window.__td = { G, offense, defense, keys, touch, touch2, snap, throwTo, handOff, endPlay, setupPlay, toggleTwoPlayer, controlBallCarrier, controlP2Defender, fumble, resolveFumble, chooseFourthDown, startKick, startExtraPoint, onKickDone, showFourthDownChoice, inFieldGoalRange, fieldGoalDistance, NFL_TEAMS, enterMenu, menuNav, startGameWithTeam, startKickoff, endKickoffReturn, controlReturner, updateKickoffCoverage, canQBPass, passToNearest, canvasTapToWorld };
}

// ============================================================
// UPDATE — the heartbeat, ~60x per second
// ============================================================
function update(time, delta) {
  // MAIN MENU: pick your team. On a computer, ← → flip teams and SPACE starts;
  // on the iPad the on-screen ◀ ▶ PLAY buttons do the same (see setupTouchButtons).
  if (G.state === 'menu') {
    if (Phaser.Input.Keyboard.JustDown(keys.left))       menuNav(-1);
    else if (Phaser.Input.Keyboard.JustDown(keys.right)) menuNav(1);
    else if (Phaser.Input.Keyboard.JustDown(keys.snap))  startGameWithTeam();
    return;
  }

  if (G.state === 'dead') {
    freezeEveryone();
    if (time >= G.deadUntil) {
      if (G.pendingXP) startExtraPoint();   // just scored? kick the extra point first
      else startNextPlay();
    }
    updateBall();
    return;
  }

  // KICKING: the kick mini-game is drawn on top of the field. Let it run;
  // it calls back to onKickDone() when the kick is finished.
  if (G.state === 'kick') {
    freezeEveryone();
    KickGame.update(delta);
    return;
  }

  // 4TH DOWN CHOICE: pick to play the down, or kick (field goal / punt).
  if (G.state === 'decision') {
    freezeEveryone();
    if (Phaser.Input.Keyboard.JustDown(keys.one)) chooseFourthDown('play');
    else if (Phaser.Input.Keyboard.JustDown(keys.two)) chooseFourthDown('kick');
    updateBall();
    updateHUD();
    return;
  }

  // FUMBLE suspense: everyone's frozen while the loose ball bounces and we
  // wait to see who recovers (resolveFumble runs on a timer).
  if (G.state === 'fumble') {
    freezeEveryone();
    return;
  }

  if (G.state === 'presnap') {
    freezeEveryone();
    if (consume('snap') || Phaser.Input.Keyboard.JustDown(keys.snap)) snap(time);
    updateBall();
    updateHUD();
    return;
  }

  // KICKOFF RETURN: catch the kick, then run it back through the coverage team.
  if (G.state === 'kickoff') {
    if (!G.koLive) { freezeEveryone(); updateHUD(); return; }  // ball still in the air
    controlReturner();          // you drive the returner with arrows / the D-pad
    updateKickoffCoverage();    // the coverage team chases you
    updateBall();
    if (checkTouchdown()) return;   // took it all the way = return TD!
    checkKickoffTackle();
    updateHUD();
    return;
  }

  // state is 'live' or 'pass'
  const elapsed = (time - G.snapTime) / 1000;

  if (G.state === 'live') controlBallCarrier();
  updateReceivers(elapsed);
  updateLine();
  updateDefense(elapsed);
  updateBall();

  if (G.state === 'live') {
    if (checkTouchdown()) return;
    checkTackle();
  }
  updateHUD();
}

// ============================================================
// THE SNAP — hand the ball to the QB, everyone goes live
// ============================================================
function snap(time) {
  G.state = 'live';
  G.snapTime = time;
  G.hasPassed = false;
  G.ballCarrier = offense[0]; // QB
  G.scene.cameras.main.startFollow(G.ballCarrier.s, true, 0.12, 0.12);
}

// ---- Move the player you control ----
function controlBallCarrier() {
  const p = G.ballCarrier.s;
  let vx = 0, vy = 0;
  // Move if EITHER the arrow key OR the on-screen arrow button is held
  if (keys.left.isDown || touch.left) vx = -PLAYER_SPEED;
  else if (keys.right.isDown || touch.right) vx = PLAYER_SPEED;
  if (keys.up.isDown || touch.up) vy = -PLAYER_SPEED;
  else if (keys.down.isDown || touch.down) vy = PLAYER_SPEED;
  if (vx && vy) { vx *= 0.707; vy *= 0.707; }
  p.setVelocity(vx, vy);
  if (vx || vy) p.setRotation(Math.atan2(vy, vx) + Math.PI / 2);

  // Passing / handoff: only the QB, behind the line, once per play (canQBPass).
  // You can also just TAP a receiver — see the canvas listener in setupTouchButtons.
  if (canQBPass()) {
    if (consume('one')   || Phaser.Input.Keyboard.JustDown(keys.one))   throwTo(1);
    else if (consume('two')   || Phaser.Input.Keyboard.JustDown(keys.two))   throwTo(2);
    else if (consume('three') || Phaser.Input.Keyboard.JustDown(keys.three)) throwTo(3);
    else if (consume('hand')  || Phaser.Input.Keyboard.JustDown(keys.hand))  handOff();
  }
}

// Player 2 drives their defender with WASD keys or the top D-pad.
// Tackles/sacks/pass break-ups still happen automatically on contact.
function controlP2Defender(d) {
  let vx = 0, vy = 0;
  if (keys.a.isDown || touch2.left) vx = -PLAYER_SPEED;
  else if (keys.d.isDown || touch2.right) vx = PLAYER_SPEED;
  if (keys.w.isDown || touch2.up) vy = -PLAYER_SPEED;
  else if (keys.s.isDown || touch2.down) vy = PLAYER_SPEED;
  if (vx && vy) { vx *= 0.707; vy *= 0.707; }
  d.s.setVelocity(vx, vy);
  if (vx || vy) d.s.setRotation(Math.atan2(vy, vx) + Math.PI / 2);
}

// Hand the ball to the running back — now you control him.
function handOff() {
  const rb = offense[1];
  G.ballCarrier = rb;
  G.hasPassed = true; // no passing after a handoff; defense now chases the RB
  G.scene.cameras.main.startFollow(rb.s, true, 0.12, 0.12);
}

// ============================================================
// PASSING — throw to the receiver wearing that number
// ============================================================
function throwTo(num) {
  const wr = offense.find(o => (o.role === 'WR' || o.role === 'RB') && o.num === num);
  if (!wr) return;

  G.hasPassed = true;
  G.state = 'pass';
  ballFollow = false;

  // Lead the receiver: aim where they'll BE when the ball arrives
  const qb = offense[0].s;
  const dist = Phaser.Math.Distance.Between(qb.x, qb.y, wr.s.x, wr.s.y);
  const flight = dist / BALL_SPEED;
  const targetX = Phaser.Math.Clamp(wr.s.x + wr.s.body.velocity.x * flight, 10, FIELD_WIDTH - 10);
  const targetY = wr.s.y + wr.s.body.velocity.y * flight;

  ball.setPosition(qb.x, qb.y);
  G.scene.cameras.main.startFollow(ball, true, 0.12, 0.12);

  G.scene.tweens.add({
    targets: ball,
    x: targetX, y: targetY,
    duration: Math.max(220, flight * 1000),
    ease: 'Sine.Out',
    onComplete: () => resolvePass(wr, targetX, targetY)
  });
}

function resolvePass(wr, x, y) {
  // Who is closest to the ball when it arrives?
  let nearestDef = Infinity;
  for (const d of defense) {
    nearestDef = Math.min(nearestDef, Phaser.Math.Distance.Between(d.s.x, d.s.y, x, y));
  }

  // A defender is right there — he either intercepts it or knocks it away.
  if (nearestDef < CATCH_CONTEST) {
    if (Math.random() < INT_CHANCE) endPlay('interception');
    else endPlay('incomplete', 'BROKEN UP!');
    return;
  }

  // Wide open — but receivers aren't perfect. They can miss it...
  if (Math.random() > CATCH_CHANCE) { endPlay('incomplete', 'INCOMPLETE'); return; }
  // ...or catch it and drop it.
  if (Math.random() < DROP_CHANCE)  { endPlay('incomplete', 'DROPPED IT!'); return; }

  // Clean catch! You now control this receiver.
  G.ballCarrier = wr;
  G.state = 'live';
  ballFollow = true;
  G.scene.cameras.main.startFollow(wr.s, true, 0.12, 0.12);
}

// ============================================================
// TAP-TO-PASS + SCRAMBLE — tap a receiver to throw, on the run
// ------------------------------------------------------------
// While the QB has the ball behind the line, a tap on the field throws to the
// receiver nearest your finger — you don't have to remember 1/2/3. You can do
// it ON THE RUN: scramble around to dodge the rush, then tap the open guy (or
// cross the line and run it yourself).
// ============================================================

// Can the QB throw right now? He has the ball, is behind the line, and hasn't
// thrown yet this play. Shared by the tap AND the number buttons/keys.
function canQBPass() {
  return G.state === 'live'
    && G.ballCarrier === offense[0]
    && !G.hasPassed
    && offense[0].s.y >= G.losY - 2;   // still behind the line of scrimmage
}

// Turn a screen tap (client x/y) into a spot on the field (world x/y). The
// field is drawn at 540x720 then scaled to fit the screen, so we undo that
// scaling and add the camera's scroll to get the real field position.
function canvasTapToWorld(clientX, clientY) {
  const cam = G.scene.cameras.main;
  const rect = G.scene.sys.game.canvas.getBoundingClientRect();
  const fx = (clientX - rect.left) / rect.width  * 540;   // 540 = game width
  const fy = (clientY - rect.top)  / rect.height * 720;   // 720 = game height
  return { x: fx / cam.zoom + cam.scrollX, y: fy / cam.zoom + cam.scrollY };
}

// Throw to whichever eligible receiver is closest to the tapped spot.
function passToNearest(worldX, worldY) {
  let best = null, bestD = Infinity;
  for (const o of offense) {
    if (o.role !== 'WR' && o.role !== 'RB') continue;
    const d = Phaser.Math.Distance.Between(worldX, worldY, o.s.x, o.s.y);
    if (d < bestD) { bestD = d; best = o; }
  }
  if (best) throwTo(best.num);
}

// ============================================================
// RECEIVERS — run their routes after the snap
// ============================================================
function updateReceivers(elapsed) {
  for (const o of offense) {
    if (o.role !== 'WR' && o.role !== 'RB') continue;
    if (o === G.ballCarrier) continue; // once caught / handed the ball, the player drives

    const depth = o.startY - o.s.y; // yards upfield since the snap
    let vx = 0, vy = -WR_SPEED;

    if (o.route === 'streak') {
      vx = 0;                                   // straight up the field
    } else if (o.route === 'slant') {
      if (depth > 70) { vx = WR_SPEED * 0.7; vy = -WR_SPEED * 0.6; } // cut inside
    } else if (o.route === 'out') {
      if (depth > 110) { vx = -WR_SPEED * 0.7; vy = -WR_SPEED * 0.4; } // break to sideline
    } else if (o.route === 'swing') {
      // the running back swings out to the flat, then turns upfield
      if (depth < 20) { vx = WR_SPEED * 0.85; vy = -WR_SPEED * 0.2; }
      else { vx = WR_SPEED * 0.25; vy = -WR_SPEED * 0.9; }
    }

    // Don't run off the field or into the endzone wall
    if (o.s.x < 12 && vx < 0) vx = 0;
    if (o.s.x > FIELD_WIDTH - 12 && vx > 0) vx = 0;
    if (o.s.y <= ENDZONE + 8) vy = 0;

    o.s.setVelocity(vx, vy);
    if (vx || vy) o.s.setRotation(Math.atan2(vy, vx) + Math.PI / 2);
  }
}

// ============================================================
// OFFENSIVE LINE — actively block the rushers to protect the QB
// ------------------------------------------------------------
// Each lineman slides in FRONT of a rusher (between him and the QB)
// and mirrors him. A rusher near a blocker gets slowed (nearBlocker),
// so a real pocket forms instead of the line standing still.
// ============================================================
function updateLine() {
  const qb = offense[0].s;
  const rushers = defense.filter(d => d.role === 'DL');
  const linemen = offense.filter(o => o.role === 'OL' && o !== G.ballCarrier);
  const claimed = new Set();

  for (const ol of linemen) {
    let best = null, bestD = Infinity;     // nearest rusher overall
    let free = null, freeD = Infinity;     // nearest UNclaimed rusher
    for (const r of rushers) {
      const dd = Phaser.Math.Distance.Between(ol.s.x, ol.s.y, r.s.x, r.s.y);
      if (dd < bestD) { bestD = dd; best = r; }
      if (!claimed.has(r) && dd < freeD) { freeD = dd; free = r; }
    }
    const target = free || best;           // double-team if everyone's claimed
    if (!target) { ol.s.setVelocity(0, 0); continue; }
    if (free) claimed.add(free);

    // Aim for a spot just goal-side of the rusher, on his path to the QB
    const a = Math.atan2(qb.y - target.s.y, qb.x - target.s.x);
    steer(ol.s, target.s.x + Math.cos(a) * 14, target.s.y + Math.sin(a) * 14, OL_SPEED);
  }
}

// ============================================================
// DEFENSE — rush the QB, cover receivers, chase the ball
// ============================================================
function updateDefense(elapsed) {
  const carrier = G.ballCarrier.s;
  const qbHasBall = G.ballCarrier === offense[0] && !G.hasPassed;

  for (const d of defense) {
    // In 2-player mode, one defender is driven by Player 2's fingers (or WASD),
    // so we skip the computer's brain for him.
    if (G.twoPlayer && d === G.p2Defender) {
      controlP2Defender(d);
      continue;
    }

    let tx, ty, speed = DEF_SPEED;

    if (!qbHasBall && G.state !== 'pass') {
      // Someone caught it (or QB is scrambling with intent) — everyone hunts the ball.
      tx = carrier.x; ty = carrier.y;
    } else if (d.role === 'DL') {
      // Linemen rush the quarterback...
      tx = offense[0].s.x; ty = offense[0].s.y;
      // ...unless an offensive lineman is blocking them.
      if (nearBlocker(d)) speed = DEF_SPEED * 0.4;
    } else if (d.role === 'LB') {
      // Linebackers spy the QB in a short zone — they don't blitz, so the
      // pocket holds; they pursue once the ball is thrown or handed off.
      tx = offense[0].s.x; ty = G.losY - 45;
      speed = DEF_SPEED * 0.8;
    } else { // DB
      // Cover your receiver — stay on the goal side (just above him).
      const wr = offense.find(o => (o.role === 'WR' || o.role === 'RB') && o.num === d.cover);
      if (wr) { tx = wr.s.x; ty = wr.s.y - 24; }
      else { tx = carrier.x; ty = carrier.y; }
    }

    steer(d.s, tx, ty, speed);
  }
}

function nearBlocker(d) {
  for (const o of offense) {
    if (o.role !== 'OL') continue;
    if (Phaser.Math.Distance.Between(o.s.x, o.s.y, d.s.x, d.s.y) < BLOCK_DIST) return true;
  }
  return false;
}

// ============================================================
// TACKLES, TOUCHDOWNS, END OF PLAY
// ============================================================
function checkTackle() {
  const c = G.ballCarrier.s;
  for (const d of defense) {
    if (Phaser.Math.Distance.Between(d.s.x, d.s.y, c.x, c.y) < TACKLE_DIST) {
      // A hard tackle sometimes knocks the ball loose = FUMBLE!
      if (Math.random() < FUMBLE_CHANCE) fumble();
      else endPlay('tackle');
      return;
    }
  }
}

// The ball pops loose! Show a big "FUMBLE!!!" for suspense, make the ball
// bounce free, then a moment later decide who dives on it.
function fumble() {
  freezeEveryone();
  G.state = 'fumble';          // a special pause so the next play doesn't start yet
  showBanner('FUMBLE!!!', true);

  // Bounce the loose ball a short random distance from the carrier
  ballFollow = false;
  const c = G.ballCarrier.s;
  const bx = Phaser.Math.Clamp(c.x + Phaser.Math.Between(-40, 40), 12, FIELD_WIDTH - 12);
  const by = c.y + Phaser.Math.Between(-30, 30);
  G.scene.tweens.add({ targets: ball, x: bx, y: by, duration: 500, ease: 'Bounce.Out' });

  // After the suspense, decide the recovery
  G.scene.time.delayedCall(1100, resolveFumble);
}

function resolveFumble() {
  if (Math.random() < OFF_RECOVER_CHANCE) {
    // Your team dives on it — you keep the ball right where it came loose.
    endPlay('tackle', 'YOU RECOVERED IT!');
  } else {
    // The defense recovers — turnover! (Fresh drive at your own 20, like a pick.)
    endPlay('interception', 'FUMBLE LOST!');
  }
}

function checkTouchdown() {
  if (G.ballCarrier.s.y <= ENDZONE) {
    endPlay('touchdown');
    return true;
  }
  return false;
}

// Decide what the next play is, show a banner, and pause briefly.
function endPlay(result, customMsg) {
  freezeEveryone();
  let msg, next, big = false;

  if (result === 'touchdown') {
    G.score += 6;
    msg = 'TOUCHDOWN!  +6';
    big = true;
    G.pendingXP = true;   // after the TD banner, kick the extra point (worth +1)
    next = { los: 20, down: 1, fd: 30, fresh: true };
  } else if (result === 'interception') {
    // The other team caught it! You don't play defense yet, so the ball
    // comes back out and you start a fresh drive at your own 20.
    msg = customMsg || 'INTERCEPTED!';
    big = true;
    next = { los: 20, down: 1, fd: 30, fresh: true };
  } else {
    const spot = (result === 'incomplete')
      ? G.losYards
      : Phaser.Math.Clamp(yardsFromOwnGoal(G.ballCarrier.s.y), 0, 99);

    if (spot >= G.firstDownYards) {
      msg = 'FIRST DOWN!';
      next = { los: spot, down: 1, fd: Math.min(spot + 10, 100) };
    } else {
      const nd = G.down + 1;
      if (nd > 4) {
        msg = 'TURNOVER ON DOWNS';
        next = { los: 20, down: 1, fd: 30, fresh: true };
      } else {
        msg = customMsg || (result === 'incomplete' ? 'INCOMPLETE' : 'TACKLE');
        next = { los: spot, down: nd, fd: G.firstDownYards };
      }
    }
  }

  G.next = next;
  G.state = 'dead';
  G.deadUntil = G.scene.time.now + 1600;
  showBanner(msg, big);
}

// ============================================================
// 4TH DOWN — go for it, or kick (field goal / punt)
// ------------------------------------------------------------
// When it's 4th down we pause and show two buttons. Button ① plays the
// down like normal. Button ② is a FIELD GOAL when you're close enough,
// or a PUNT when you're too far. The kick itself is the KickGame screen.
// ============================================================
function showFourthDownChoice() {
  const panel  = document.getElementById('fourth-down');
  const goBtn   = document.getElementById('btn-go');
  const kickBtn = document.getElementById('btn-kick');
  if (goBtn)   goBtn.textContent = '① PLAY 4TH DOWN';
  if (kickBtn) {
    kickBtn.textContent = inFieldGoalRange()
      ? '② FIELD GOAL · ' + Math.round(fieldGoalDistance()) + ' yd'
      : '② PUNT';
  }
  if (panel) panel.style.display = 'flex';
}

function hideFourthDownChoice() {
  const panel = document.getElementById('fourth-down');
  if (panel) panel.style.display = 'none';
}

// The player picked an option ('play' or 'kick').
function chooseFourthDown(which) {
  if (G.state !== 'decision') return;   // ignore stray taps
  hideFourthDownChoice();
  if (which === 'play') { G.state = 'presnap'; return; }
  startKick(inFieldGoalRange() ? 'fg' : 'punt');
}

// Hand off to the KickGame screen (drawn on top of the field).
function startKick(mode) {
  G.state = 'kick';
  G.kickKind = mode;   // 'fg' or 'punt' — an extra point comes through startExtraPoint()
  document.body.classList.add('kicking');   // hide the football buttons
  G.scene.cameras.main.stopFollow();
  KickGame.enter(G.scene, {
    mode,
    distance: fieldGoalDistance(),
    onDone: onKickDone,
  });
}

// After a touchdown: a short, easy extra-point kick worth +1. It's just a
// field goal from a fixed close spot — same KickGame, so nothing new to learn.
function startExtraPoint() {
  G.pendingXP = false;
  G.state = 'kick';
  G.kickKind = 'xp';
  document.body.classList.add('kicking');   // hide the football buttons
  G.scene.cameras.main.stopFollow();
  KickGame.enter(G.scene, {
    mode: 'fg',
    distance: XP_DISTANCE,
    points: 1,            // a made extra point is worth 1, not 3
    onDone: onKickDone,
  });
}

// The kick finished — score it, then start a fresh drive.
function onKickDone(result) {
  document.body.classList.remove('kicking');  // bring the football buttons back
  let msg;
  if (G.kickKind === 'xp' && result.made) {
    G.score += 1;
    msg = 'EXTRA POINT!  +1';
  } else if (G.kickKind === 'xp') {
    msg = (result.outcome === 'short') ? 'NO GOOD — SHORT!' : 'NO GOOD — WIDE!';
  } else if (result.mode === 'fg' && result.made) {
    G.score += 3;
    msg = 'FIELD GOAL!  +3';
  } else if (result.mode === 'fg') {
    msg = (result.outcome === 'short') ? 'NO GOOD — SHORT!' : 'NO GOOD — WIDE!';
  } else {
    msg = 'PUNT — ' + result.puntYards + ' YDS';
  }
  // There's no opponent yet, so every kick just hands the ball back and
  // you start again at your own 20 (like a touchback). Field position and
  // pinning the other team deep will matter once we add an opponent team.
  G.next = { los: 20, down: 1, fd: 30, fresh: true };
  G.state = 'dead';
  G.deadUntil = G.scene.time.now + 1600;
  showBanner(msg, true);
}

// ============================================================
// CHOOSE YOUR TEAM — the main menu you see first
// ------------------------------------------------------------
// A big preview player wears the team you're looking at. Flip through the
// teams with ◀ ▶ (or the arrow keys), then tap PLAY to start. The computer
// gets a random OTHER team. It's drawn on the game canvas; the ◀ ▶ PLAY
// buttons are real on-screen buttons (see index.html) so taps never miss.
// ============================================================
function buildTeamMenu(scene) {
  const M = {};
  const mid = 270;

  // A solid dark cover so the football field is fully hidden behind the menu.
  M.bg = scene.add.graphics().setScrollFactor(0).setDepth(90);
  M.bg.fillStyle(0x0a1020, 1); M.bg.fillRect(0, 0, 540, 720);

  M.title = scene.add.text(mid, 70, 'CHOOSE YOUR TEAM',
    { fontFamily: 'Arial Black, Arial', fontSize: '26px', color: '#ffe066',
      stroke: '#000', strokeThickness: 5 }).setOrigin(0.5).setScrollFactor(0).setDepth(94);

  // The huge 3-letter team code (SEA, PIT, ...).
  M.abbr = scene.add.text(mid, 150, '', { fontFamily: 'Arial Black, Arial',
    fontSize: '70px', color: '#ffffff', stroke: '#000', strokeThickness: 8 })
    .setOrigin(0.5).setScrollFactor(0).setDepth(94);

  // Two little color bars = a peek at the uniform (jersey color + helmet color).
  M.swatch = scene.add.graphics().setScrollFactor(0).setDepth(93);

  // The preview player, wearing the team you're looking at (texture 'blue').
  M.preview = scene.add.sprite(mid, 340, 'blue').setScale(5)
    .setScrollFactor(0).setDepth(94);

  // The team's name under the player.
  M.name = scene.add.text(mid, 470, '', { fontFamily: 'Arial Black, Arial',
    fontSize: '40px', color: '#ffffff', stroke: '#000', strokeThickness: 6 })
    .setOrigin(0.5).setScrollFactor(0).setDepth(94);

  M.note = scene.add.text(mid, 520, 'You’ll play a random team', {
    fontFamily: 'Arial Black, Arial', fontSize: '15px', color: '#aab4c8',
    stroke: '#000', strokeThickness: 3 }).setOrigin(0.5).setScrollFactor(0).setDepth(94);

  G.menu = M;
  setMenuVisible(false);
}

// Show or hide all the menu pieces at once.
function setMenuVisible(v) {
  const M = G.menu; if (!M) return;
  for (const o of [M.bg, M.title, M.abbr, M.swatch, M.preview, M.name, M.note]) o.setVisible(v);
}

// Open the menu (start it on the Seahawks — team #0).
function enterMenu() {
  G.state = 'menu';
  document.body.classList.add('menu');   // hide the football buttons, show ◀ ▶ PLAY
  G.menuIndex = 0;
  setMenuVisible(true);
  renderMenu();
}

// Paint the menu for whichever team you're currently looking at.
function renderMenu() {
  const t = NFL_TEAMS[G.menuIndex];
  // Repaint the preview player's uniform, then refresh anything using it.
  makeChibiTexture(G.scene, 'blue', t.jersey, t.helmet);
  G.menu.preview.setTexture('blue');
  for (const o of offense) o.s.setTexture('blue');

  G.menu.abbr.setText(t.abbr);
  G.menu.name.setText(t.name);

  // Two color bars: jersey on top, helmet under it.
  const g = G.menu.swatch; g.clear();
  g.fillStyle(t.jersey, 1); g.fillRoundedRect(180, 210, 180, 12, 4);
  g.fillStyle(t.helmet, 1); g.fillRoundedRect(180, 226, 180, 12, 4);
  g.lineStyle(2, 0xffffff, 0.5); g.strokeRoundedRect(180, 210, 180, 28, 4);
}

// Flip to the next/previous team (wraps around the list).
function menuNav(dir) {
  if (G.state !== 'menu') return;
  const n = NFL_TEAMS.length;
  G.menuIndex = (G.menuIndex + dir + n) % n;
  renderMenu();
}

// Tap PLAY: lock in your team, give the computer a random other team, paint
// both uniforms for real, then start the game.
function startGameWithTeam() {
  if (G.state !== 'menu') return;
  G.team = NFL_TEAMS[G.menuIndex];

  // Pick a random OTHER team for the computer.
  let oi;
  do { oi = Phaser.Math.Between(0, NFL_TEAMS.length - 1); } while (oi === G.menuIndex);
  G.oppTeam = NFL_TEAMS[oi];

  // Paint both teams onto their players.
  makeChibiTexture(G.scene, 'blue', G.team.jersey, G.team.helmet);
  makeChibiTexture(G.scene, 'red',  G.oppTeam.jersey, G.oppTeam.helmet);
  for (const o of offense) o.s.setTexture('blue');
  for (const d of defense) d.s.setTexture('red');

  // Tell the kicking screen your colors, so its kicker matches your team.
  window.TEAM = { jersey: G.team.jersey, helmet: G.team.helmet };

  // Put your team's name in your home endzone.
  if (G.endzoneLabel) G.endzoneLabel.setText(G.team.name);

  setMenuVisible(false);
  document.body.classList.remove('menu');
  startKickoff();   // the game opens with a kickoff for you to return
}

// ============================================================
// KICKOFF RETURN — catch the kick deep and run it back
// ------------------------------------------------------------
// Every brand-new possession starts here: the ball is booted to your returner
// near his own goal, the coverage team spreads downfield, and you run it back.
// Get tackled → your drive starts at that spot. Reach the endzone → return TD!
// (Only the returner is your guy on the field; the rest wait for the drive.)
// ============================================================
function startKickoff() {
  G.state = 'kickoff';
  G.koLive = false;                          // the ball is in the air first
  document.body.classList.remove('kicking'); // make sure the run buttons are showing

  // Only the returner is on the field — hide the other offense players + the ref.
  for (let i = 1; i < offense.length; i++) {
    offense[i].s.setVisible(false);
    if (offense[i].label) offense[i].label.setVisible(false);
  }
  if (offense[0].label) offense[0].label.setVisible(false);
  if (referee) referee.setVisible(false);
  // Hide the scrimmage labels (QB/RUSH/1/2) — they don't apply on a kickoff.
  for (const d of defense) if (d.label) d.label.setVisible(false);

  // The returner waits deep, near his own 8-yard line.
  G.ballCarrier = offense[0];
  place(offense[0], 266, 1020);
  offense[0].s.setVisible(true);

  // The coverage team: a spread wall downfield that converges on the returner.
  const cov = [
    [70, 720], [190, 720], [345, 720], [465, 720],  // front wall
    [130, 600], [270, 600], [410, 600],             // back row
  ];
  for (let i = 0; i < defense.length; i++) {
    place(defense[i], cov[i][0], cov[i][1]);
    defense[i].s.setVisible(true);
  }

  // Boot the ball down into the returner's hands, THEN let you run.
  ballFollow = false;
  ball.setPosition(266, 680).setVisible(true);
  G.scene.cameras.main.startFollow(offense[0].s, true, 0.12, 0.12);
  G.scene.tweens.add({
    targets: ball, x: 266, y: 1014, duration: 650, ease: 'Sine.In',
    onComplete: () => { ballFollow = true; G.koLive = true; showBanner('RETURN IT!', false); }
  });
  updateHUD();
}

// Drive the returner (movement only — no passing on a kickoff).
function controlReturner() {
  const p = G.ballCarrier.s;
  let vx = 0, vy = 0;
  if (keys.left.isDown || touch.left) vx = -PLAYER_SPEED;
  else if (keys.right.isDown || touch.right) vx = PLAYER_SPEED;
  if (keys.up.isDown || touch.up) vy = -PLAYER_SPEED;
  else if (keys.down.isDown || touch.down) vy = PLAYER_SPEED;
  if (vx && vy) { vx *= 0.707; vy *= 0.707; }
  p.setVelocity(vx, vy);
  if (vx || vy) p.setRotation(Math.atan2(vy, vx) + Math.PI / 2);
}

// The whole coverage team runs straight at the returner.
function updateKickoffCoverage() {
  const c = G.ballCarrier.s;
  for (const d of defense) {
    // In 2-player mode, a friend drives one coverage player to hunt you down.
    if (G.twoPlayer && d === G.p2Defender) { controlP2Defender(d); continue; }
    steer(d.s, c.x, c.y, KO_COVER_SPEED);
  }
}

// Any coverage player close enough = tackle, and the return is over.
function checkKickoffTackle() {
  const c = G.ballCarrier.s;
  for (const d of defense) {
    if (Phaser.Math.Distance.Between(d.s.x, d.s.y, c.x, c.y) < TACKLE_DIST) {
      endKickoffReturn();
      return;
    }
  }
}

// Tackled! Start a normal 1st-&-10 drive from wherever you were brought down.
function endKickoffReturn() {
  freezeEveryone();
  const spot = Phaser.Math.Clamp(Math.round(yardsFromOwnGoal(G.ballCarrier.s.y)), 1, 99);
  G.next = { los: spot, down: 1, fd: Math.min(spot + 10, 100) };  // no 'fresh' → a normal drive next
  G.state = 'dead';
  G.deadUntil = G.scene.time.now + 1400;
  showBanner('NICE RETURN!', false);
}

// ============================================================
// SETTING UP A PLAY — line all 14 players up at the LOS
// ============================================================
function startNextPlay() {
  // A brand-new possession is fielded as a kickoff return; otherwise it's a
  // normal down from wherever the last play ended.
  if (G.next && G.next.fresh) startKickoff();
  else setupPlay(G.next);
}

function setupPlay(next) {
  // Bring everyone back onto the field (a kickoff return hides all but the returner).
  for (const o of offense) { o.s.setVisible(true); if (o.label) o.label.setVisible(true); }
  for (const d of defense) { d.s.setVisible(true); if (d.label) d.label.setVisible(true); }
  if (referee) referee.setVisible(true);

  G.down = next.down;
  G.losYards = next.los;
  G.firstDownYards = next.fd;
  G.losY = yardsToY(G.losYards);
  G.hasPassed = false;
  G.ballCarrier = offense[0];
  ballFollow = true;
  touch.snap = touch.one = touch.two = touch.three = touch.hand = false; // clear old taps

  const L = G.losY;
  place(offense[0], 266, L + 60);   // QB
  place(offense[1], 266, L + 84);   // RB (behind the QB)
  place(offense[2], 55,  L + 14);   // WR #1 (left)
  place(offense[3], 478, L + 14);   // WR #2 (right)
  place(offense[4], 226, L + 16);   // OL
  place(offense[5], 266, L + 16);   // OL
  place(offense[6], 306, L + 16);   // OL
  offense[1].startY = offense[1].s.y;   // RB
  offense[2].startY = offense[2].s.y;   // WR #1
  offense[3].startY = offense[3].s.y;   // WR #2

  place(defense[0], 246, L - 16);   // DL RUSH
  place(defense[1], 286, L - 16);   // DL RUSH
  place(defense[2], 226, L - 46);   // LB
  place(defense[3], 306, L - 46);   // LB
  place(defense[4], 60,  L - 28);   // DB on WR #1
  place(defense[5], 473, L - 28);   // DB on WR #2
  place(defense[6], 266, L - 40);   // DB on the RB

  // Referee stands in the offensive backfield, off to the side (out of the way)
  referee.setPosition(410, L + 90);

  G.scene.cameras.main.startFollow(offense[0].s, true, 0.12, 0.12);
  updateBall();

  // On 4th down, don't snap right away — first offer the choice:
  // go for it, or kick (a field goal if you're close, otherwise a punt).
  if (G.down === 4) {
    G.state = 'decision';
    showFourthDownChoice();
  } else {
    G.state = 'presnap';
  }
}

// ============================================================
// THE BALL — sits with the carrier, except mid-throw
// ============================================================
function updateBall() {
  if (!ballFollow) return;
  const c = G.ballCarrier.s;
  ball.setPosition(c.x, c.y - 6);
}

// ============================================================
// HELPERS
// ============================================================
// ---- Touch button wiring ----
// Connect each on-screen button (by its id in index.html) to the touch state.
function setupTouchButtons() {
  // Player 1 (offense) — arrows move, actions do things
  bindHold('btn-up', 'up');       // arrows: true while held, false when let go
  bindHold('btn-down', 'down');
  bindHold('btn-left', 'left');
  bindHold('btn-right', 'right');
  bindTap('btn-snap', 'snap');    // actions: one tap = one action
  bindTap('btn-1', 'one');
  bindTap('btn-2', 'two');
  bindTap('btn-3', 'three');
  bindTap('btn-hand', 'hand');

  // Player 2 (defense) — just four arrows, moving the "P2" red player
  bindHold('btn2-up', 'up', touch2);
  bindHold('btn2-down', 'down', touch2);
  bindHold('btn2-left', 'left', touch2);
  bindHold('btn2-right', 'right', touch2);

  // The 1P / 2P switch and the Fullscreen button
  bindTapEl('btn-mode', toggleTwoPlayer);
  bindTapEl('btn-fs', toggleFullscreen);

  // The 4th-down choice buttons (① play the down, ② kick)
  bindTapEl('btn-go', () => chooseFourthDown('play'));
  bindTapEl('btn-kick', () => chooseFourthDown('kick'));

  // The main-menu buttons: ◀ ▶ flip teams, PLAY starts the game
  bindTapEl('tm-prev', () => menuNav(-1));
  bindTapEl('tm-next', () => menuNav(1));
  bindTapEl('tm-play', startGameWithTeam);

  // Tap-to-pass: a tap on the field (not on a button) throws to the receiver
  // nearest your finger — but only when the QB can pass. We listen for a DOM
  // pointerdown on the game canvas, the same dependable way the kick screen
  // reads taps on the iPad. Taps on the D-pad / action buttons hit those
  // elements instead, so they never trigger a throw.
  const gameCanvas = window.game && window.game.canvas;
  if (gameCanvas) {
    gameCanvas.addEventListener('pointerdown', e => {
      if (!canQBPass()) return;
      const w = canvasTapToWorld(e.clientX, e.clientY);
      passToNearest(w.x, w.y);
    });
  }

  // ---- Stop iOS Safari from zooming (the "stuck zoomed-in" bug) ----
  // Three holes were letting zoom through, so we plug all three:
  //  1) Block the pinch gesture events — and pass { passive: false }, or
  //     Safari quietly ignores our preventDefault and zooms anyway.
  //  2) Also block any TWO-finger touchmove — the surest pinch stopper,
  //     and it was missing before. (One finger still moves freely, so the
  //     D-pad and 2-player controls keep working.)
  //  3) Block the quick double-tap that zooms in.
  const noZoom = e => e.preventDefault();
  document.addEventListener('gesturestart',  noZoom, { passive: false });
  document.addEventListener('gesturechange', noZoom, { passive: false });
  document.addEventListener('gestureend',    noZoom, { passive: false });
  document.addEventListener('touchmove', e => {
    if (e.touches.length > 1) e.preventDefault();   // two fingers = a pinch
  }, { passive: false });
  let lastTap = 0;
  document.addEventListener('touchend', e => {
    const now = Date.now();
    if (now - lastTap <= 400) e.preventDefault();   // two quick taps = zoom
    lastTap = now;
  }, { passive: false });

  // Re-fit the field to the screen after rotating or entering/leaving fullscreen
  const refit = () => { if (window.game && game.scale) game.scale.refresh(); };
  window.addEventListener('resize', refit);
  window.addEventListener('orientationchange', () => setTimeout(refit, 250));
  // On some first loads the game area is measured before the layout is ready and
  // comes out 0-sized (blank screen). Watch it and re-fit the moment it gets a
  // real size — this fixes the blank-on-load without guessing a delay.
  const gc = document.getElementById('game-container');
  if (gc && window.ResizeObserver) new ResizeObserver(refit).observe(gc);
}

// Fill the whole screen (works in Safari on iPad, and elsewhere). We fullscreen
// the WHOLE page so the touch buttons stay visible on top of the field.
function toggleFullscreen() {
  const doc = document;
  const el = doc.documentElement;
  const isFull = doc.fullscreenElement || doc.webkitFullscreenElement;
  if (!isFull) {
    if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
  } else {
    if (doc.exitFullscreen) doc.exitFullscreen();
    else if (doc.webkitExitFullscreen) doc.webkitExitFullscreen();
  }
  setTimeout(() => { if (window.game && game.scale) game.scale.refresh(); }, 300);
}

// A "hold" button: down = start moving, up/leave = stop.
// `target` is which player's switches to flip (defaults to Player 1's).
function bindHold(id, action, target = touch) {
  const el = document.getElementById(id);
  if (!el) return;
  const press   = e => { e.preventDefault(); target[action] = true; };
  const release = e => { e.preventDefault(); target[action] = false; };
  el.addEventListener('pointerdown', press);
  el.addEventListener('pointerup', release);
  el.addEventListener('pointerleave', release);
  el.addEventListener('pointercancel', release);
}

// Run a function once each time a button is tapped.
function bindTapEl(id, fn) {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener('pointerdown', e => { e.preventDefault(); fn(); });
}

// A "tap" button: each tap raises a flag the game uses up once (see consume()).
function bindTap(id, action) {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener('pointerdown', e => { e.preventDefault(); touch[action] = true; });
}

// Read a tap flag and clear it, so one tap causes exactly one action.
function consume(action) {
  if (touch[action]) { touch[action] = false; return true; }
  return false;
}

// Flip between "vs computer" (1P) and "friend plays defense" (2P).
function toggleTwoPlayer() {
  G.twoPlayer = !G.twoPlayer;
  document.body.classList.toggle('two-player', G.twoPlayer);   // shows/hides P2's D-pad
  const btn = document.getElementById('btn-mode');
  if (btn) btn.textContent = G.twoPlayer ? '2P' : '1P';
}

function steer(sprite, tx, ty, speed) {
  const a = Math.atan2(ty - sprite.y, tx - sprite.x);
  sprite.setVelocity(Math.cos(a) * speed, Math.sin(a) * speed);
  sprite.setRotation(a + Math.PI / 2);
}

function freezeEveryone() {
  for (const o of offense) o.s.setVelocity(0, 0);
  for (const d of defense) d.s.setVelocity(0, 0);
}

function place(o, x, y) {
  o.s.setPosition(x, y);
  o.s.setVelocity(0, 0);
  o.s.setRotation(0);
  if (o.label) o.label.setPosition(x, y);
}

function makePlayer(scene, color, role, opts) {
  const s = scene.physics.add.sprite(0, 0, color);
  s.setCollideWorldBounds(true);
  s.setDepth(5);
  const o = { s, role, num: opts.num, route: opts.route, cover: opts.cover, startY: 0, label: null };
  // Labels so the key players are obvious: QB, RB, receivers 1/2,
  // and the two rushers ("the defense on the quarterback").
  if (role === 'QB' || role === 'WR' || role === 'DL' || role === 'RB') {
    const txt = role === 'QB' ? 'QB' : role === 'DL' ? 'RUSH' : role === 'RB' ? 'RB' : String(opts.num);
    o.label = scene.add.text(0, 0, txt, {
      fontFamily: 'Arial Black, Arial', fontSize: role === 'DL' ? '9px' : role === 'RB' ? '10px' : '13px',
      color: '#ffffff', stroke: '#000', strokeThickness: 3
    }).setOrigin(0.5).setDepth(7);
  }
  return o;
}

function yardsToY(yds) { return FIELD_LENGTH - ENDZONE - yds * PX_PER_YARD; }
function yardsFromOwnGoal(y) { return (FIELD_LENGTH - ENDZONE - y) / PX_PER_YARD; }

// ============================================================
// HUD — score, down & distance, ball position, instructions
// ============================================================
let hud = {};
function buildHUD(scene) {
  hud.score = scene.add.text(12, 10, '', hudStyle(18)).setScrollFactor(0).setDepth(20);
  hud.down  = scene.add.text(12, 36, '', hudStyle(16, '#ffe066')).setScrollFactor(0).setDepth(20);
  hud.spot  = scene.add.text(12, 60, '', hudStyle(12, '#cccccc')).setScrollFactor(0).setDepth(20);
  hud.help  = scene.add.text(270, 700, '', hudStyle(13, '#ffffff'))
    .setOrigin(0.5).setScrollFactor(0).setDepth(20);
}

function updateHUD() {
  // Keep number labels glued to their players
  for (const o of offense) if (o.label) o.label.setPosition(o.s.x, o.s.y);
  for (const d of defense) if (d.label) d.label.setPosition(d.s.x, d.s.y);

  // Float the "P2" tag over Player 2's defender (only in 2-player mode)
  if (G.p2Label) {
    if (G.twoPlayer && G.p2Defender) {
      G.p2Label.setVisible(true).setPosition(G.p2Defender.s.x, G.p2Defender.s.y - 22);
    } else {
      G.p2Label.setVisible(false);
    }
  }

  // Scoreboard shows your team code, your score, and who you're playing.
  hud.score.setText(G.team
    ? `${G.team.abbr} ${G.score}   vs ${G.oppTeam.abbr}`
    : 'SCORE: ' + G.score);

  // On a kickoff there's no down & distance yet — show return info instead.
  if (G.state === 'kickoff') {
    hud.down.setText('KICKOFF');
    hud.spot.setText('Catch it and run it back!');
    hud.help.setText(G.koLive ? 'RUN IT BACK — head up the field! ⬆' : 'Here comes the kick…');
    return;
  }

  const toGo = G.firstDownYards - G.losYards;
  const distTxt = (G.firstDownYards >= 100) ? 'GOAL' : String(Math.max(0, Math.round(toGo)));
  hud.down.setText(`${ordinal(G.down)} & ${distTxt}`);
  hud.spot.setText('Ball on the ' + describeSpot(G.losYards));

  if (G.state === 'presnap') {
    hud.help.setText('Press SPACE to hike the ball');
  } else if (G.state === 'live' && G.ballCarrier === offense[0] && !G.hasPassed) {
    hud.help.setText('TAP a receiver to throw (or 1/2/3)   ·   H hand off   ·   arrows = scramble');
  } else if (G.state === 'live') {
    hud.help.setText('Arrows = run to the endzone!');
  } else {
    hud.help.setText('');
  }
}

function ordinal(n) { return ['', '1ST', '2ND', '3RD', '4TH'][n] || n + 'TH'; }
function describeSpot(yds) {
  if (yds === 50) return '50';
  return yds < 50 ? `own ${yds}` : `opponent ${100 - yds}`;
}

function showBanner(text, big) {
  if (G.banner) G.banner.destroy();
  G.banner = G.scene.add.text(270, 300, text, {
    fontFamily: 'Arial Black, Arial',
    fontSize: big ? '48px' : '34px',
    color: big ? '#ffe066' : '#ffffff',
    stroke: '#000', strokeThickness: 7
  }).setOrigin(0.5).setScrollFactor(0).setDepth(30).setScale(0);

  G.scene.tweens.add({
    targets: G.banner, scale: 1, duration: 350, ease: 'Back.Out',
    yoyo: true, hold: 800,
    onComplete: () => { if (G.banner) { G.banner.destroy(); G.banner = null; } }
  });
}

function hudStyle(size, color = '#ffffff') {
  return { fontFamily: 'Arial Black, Arial', fontSize: size + 'px', color,
           stroke: '#000', strokeThickness: 4 };
}

// ============================================================
// ART — field, chibi players, football (all drawn in code)
// ============================================================
function drawField(scene) {
  const g = scene.add.graphics();
  for (let i = 0; i < 12; i++) {
    g.fillStyle(i % 2 === 0 ? GRASS_DARK : GRASS_LIGHT);
    g.fillRect(0, i * 10 * PX_PER_YARD, FIELD_WIDTH, 10 * PX_PER_YARD);
  }
  g.fillStyle(ENDZONE_COLOR);
  g.fillRect(0, 0, FIELD_WIDTH, ENDZONE);
  g.fillRect(0, FIELD_LENGTH - ENDZONE, FIELD_WIDTH, ENDZONE);

  for (let yd = 0; yd <= 100; yd += 5) {
    const y = ENDZONE + yd * PX_PER_YARD;
    g.lineStyle(yd % 10 === 0 ? 3 : 1.5, 0xffffff, yd % 10 === 0 ? 0.9 : 0.5);
    g.beginPath(); g.moveTo(0, y); g.lineTo(FIELD_WIDTH, y); g.strokePath();
  }
  g.lineStyle(1, 0xffffff, 0.35);
  for (let yd = 0; yd < 100; yd++) {
    const y = ENDZONE + yd * PX_PER_YARD;
    for (const x of [FIELD_WIDTH * 0.35, FIELD_WIDTH * 0.65]) {
      g.beginPath(); g.moveTo(x - 4, y); g.lineTo(x + 4, y); g.strokePath();
    }
  }
  for (let yd = 10; yd <= 90; yd += 10) {
    const label = String(yd <= 50 ? yd : 100 - yd);
    for (const x of [40, FIELD_WIDTH - 40]) {
      scene.add.text(x, ENDZONE + yd * PX_PER_YARD, label, {
        fontFamily: 'Arial Black, Arial', fontSize: '22px', color: '#ffffff'
      }).setOrigin(0.5).setAlpha(0.5);
    }
  }
  scene.add.text(FIELD_WIDTH / 2, ENDZONE / 2, 'TOUCHDOWN', {
    fontFamily: 'Arial Black, Arial', fontSize: '30px', color: '#ffe066'
  }).setOrigin(0.5).setAlpha(0.9);
  // Your home endzone shows your team's name once you've picked it (see
  // startGameWithTeam). Until then it just says MAX FC.
  G.endzoneLabel = scene.add.text(FIELD_WIDTH / 2, FIELD_LENGTH - ENDZONE / 2, 'MAX FC', {
    fontFamily: 'Arial Black, Arial', fontSize: '30px', color: '#ffffff'
  }).setOrigin(0.5).setAlpha(0.7);
}

// Draw one chibi player in a team's two colors: JERSEY (body/shoulder pads)
// and HELMET (head). We can call this again with the same `key` to REPAINT a
// team — handy when you flip teams in the menu — so we clear the old picture
// first (Phaser won't overwrite a texture that's still hanging around).
function makeChibiTexture(scene, key, jersey, helmet) {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  g.fillStyle(jersey);          g.fillEllipse(20, 26, 30, 16);   // shoulder pads (jersey)
  g.fillStyle(0xd9a066);        g.fillCircle(5, 26, 4);          // arms
  g.fillCircle(35, 26, 4);
  g.fillStyle(helmet);          g.fillCircle(20, 16, 13);        // BIG helmet
  g.fillStyle(0xffffff);        g.fillCircle(20, 16, 10);        // facemask ring
  g.fillStyle(helmet);          g.fillCircle(20, 16, 9);
  g.fillStyle(jersey);          g.fillRect(18, 3, 4, 13);        // helmet stripe (jersey, so it shows)
  g.generateTexture(key, 40, 36);
  g.destroy();
}

function makeBallTexture(scene) {
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  g.fillStyle(0x8B4513); g.fillEllipse(8, 5, 14, 9);
  g.lineStyle(1.5, 0xffffff); g.beginPath(); g.moveTo(4, 5); g.lineTo(12, 5); g.strokePath();
  g.generateTexture('ball', 16, 10);
  g.destroy();
}

function makeRefTexture(scene) {
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  // black-and-white striped shirt (chibi, seen from above)
  g.fillStyle(0xffffff); g.fillEllipse(20, 26, 30, 16);
  g.fillStyle(0x000000);
  for (let i = 0; i < 4; i++) g.fillRect(9 + i * 7, 18, 3, 16);
  // arms
  g.fillStyle(0xd9a066); g.fillCircle(5, 26, 4); g.fillCircle(35, 26, 4);
  // head with a black cap
  g.fillStyle(0xd9a066); g.fillCircle(20, 15, 12);
  g.fillStyle(0x111111); g.fillEllipse(20, 10, 26, 12);
  g.generateTexture('ref', 40, 36);
  g.destroy();
}
