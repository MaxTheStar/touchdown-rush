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
const WR_SPEED     = 195;   // receivers running routes (now a bit faster than coverage = they get open)
const DEF_SPEED    = 186;   // defenders covering & rushing (slower than WRs = more space + more time to throw)
const PURSUE_SPEED = 190;   // defenders CHASING the ball carrier on a run (faster now = running isn't a track meet)
const OL_SPEED     = 188;   // your linemen mirroring the rush to protect the QB (better = the pocket holds longer)

// ---- Swipe controls (touch): while RUNNING, swipe the field to dash or cut ----
// A LONG swipe = a burst of speed (dash) in the swipe direction; a SHORT swipe =
// a quick change of direction. The D-pad still works normally. (Swiping only does
// this while you're running the ball, so it never clashes with tap-to-pass.)
const SWIPE_MIN_FRAC  = 0.05;   // ignore tiny drags (< 5% of the screen height = a tap, not a swipe)
const SWIPE_LONG_FRAC = 0.17;   // a long swipe (>= 17% of screen height) = a DASH; shorter = a quick cut
const DASH_SPEED    = 360;      // dash burst speed (you normally run at PLAYER_SPEED 215)
const DASH_TIME     = 320;      // how long the dash burst lasts (ms)
const DASH_COOLDOWN = 700;      // wait this long after a dash before you can dash again (ms)
const JUKE_TIME     = 200;      // how long a short-swipe direction change lasts (ms)
const BALL_SPEED   = 520;   // how fast a pass flies

// ---- Distances ----
const TACKLE_DIST = 15;   // defender this close to the ball = tackle
const BLOCK_DIST  = 27;   // lineman this close to a rusher = blocks him (bigger = stronger pocket)
const CATCH_CONTEST = 15; // defender this close to the catch = contested
const OVERTHROW_DIST = 55; // if the ball lands farther than this from the receiver, it's overthrown
const HANDOFF_DIST = 60;  // QB must be this close to the RB to hand off (else the HAND button is disabled)

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

// After a touchdown you get one EXTRA-POINT kick, worth +1. How far it is now
// depends on the difficulty you picked (see DIFFICULTY above) — farther = harder.

// ---- Kickoffs — YOU return the kick: catch it deep and run it back ----
// A new possession (start of game, after a score, after a turnover) begins with
// a kickoff return: the ball is booted to your returner near his own goal, you
// run it back through the coverage team, and where you're tackled is where your
// drive starts. Break all the way through = a return touchdown!
// ---- Difficulty (picked on the team menu): EASY / MEDIUM / HARD ----
// Difficulty changes the KICKOFF (faster coverage = harder to return), the
// EXTRA POINT (longer kick), the pocket (rushSlow)… and on HARD, the whole
// defense moves faster on every down (defBoost), so hard mode is truly hard:
// coverage sticks to your receivers and the pursuit can chase you down.
// EASY and MEDIUM keep the normal, fair defense.
// koCover  = kickoff coverage speed (higher = harder to return)
// xpDist   = extra-point distance in yards (farther = harder kick)
// rushSlow = how slow a BLOCKED rusher gets (lower = stronger pocket = more time for the QB)
// defBoost = defense speed multiplier on scrimmage plays (1 = normal)
// redSpeed = how fast THEIR ball carrier runs when you play defense
const DIFFICULTY = {
  easy:   { label: 'EASY',   koCover: 180, xpDist: 22, rushSlow: 0.18, defBoost: 1.0,  redSpeed: 182 },  // strong pocket, lots of time
  medium: { label: 'MEDIUM', koCover: 198, xpDist: 30, rushSlow: 0.32, defBoost: 1.0,  redSpeed: 192 },
  hard:   { label: 'HARD',   koCover: 214, xpDist: 38, rushSlow: 0.50, defBoost: 1.09, redSpeed: 200 },  // weak pocket, REAL defense
};
function diff() { return DIFFICULTY[G.difficulty] || DIFFICULTY.medium; }

// ============================================================
// A REAL GAME: a game clock, 4 quarters, and an opponent that SCORES
// ------------------------------------------------------------
// The other team really plays now. When your possession ends (a punt, a
// turnover, or after you score), the computer gets the ball and its drive
// plays out as a quick "watch it happen" sim with play-by-play — and it can
// SCORE. A game clock counts down through 4 quarters; when time is up, whoever
// has more points WINS. Tie? Sudden-death overtime (next score wins).
//
// The clock only moves at the END of each play (never mid-scramble), so it
// never surprises you — just like the clock flipping to the next down on TV.
// ============================================================
const QUARTER_SECONDS = 150;   // game-clock seconds in a quarter (2:30 arcade quarters)
const NUM_QUARTERS    = 4;
const OT_SECONDS      = 120;   // a sudden-death overtime period (2:00)

// How much game-clock each kind of play burns (in game-seconds).
const TIME_RUN_PLAY   = 32;    // a run / a catch tackled in bounds (clock keeps running)
const TIME_INCOMPLETE = 12;    // an incomplete pass (the clock stops → less time comes off)
const TIME_SCORE_PLAY = 15;    // the play that scored (or a turnover)
const TIME_KICK_PLAY  = 12;    // a field goal / punt / extra point snap
const TIME_KICKOFF    = 8;     // the kickoff + your return

// (The other team's drive used to be a watch-it-happen simulation. Now YOU
//  play defense for real — see the ⭐ PLAY DEFENSE section further down.)

// ---- Quarter breaks, halftime… and the AD BREAK 📺 -------------------------
// When a quarter ends, the game cuts to a TV-style break: the score so far,
// then an ANIMATED commercial — a real little TV spot with moving parts.
// The commercials live in src/ads.js (every sponsor is still 100% made up).
// HALFTIME follows real NFL rules — see the notes on startBreak() below.
const BREAK_MIN_MS = 1200;      // the break can't be tapped away for this long (so it registers)

// ---- Instant replay — after you score, watch it again in slow motion! -----
// While a play is running we quietly remember where everyone was for the last
// couple of seconds (a "film reel"). When you score a touchdown we play that
// film back slowly, with a spotlight on the ball carrier, before the kick.
const REPLAY_FRAMES     = 150;   // how many recent moments we keep (~2.5 seconds of film)
const REPLAY_PLAY_SPEED = 0.45;  // film speed on playback (< 1 = slow motion)
const REPLAY_MIN        = 25;    // need at least this much film, or skip the replay

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

// The CHOOSE-YOUR-TEAM list: every NFL team PLUS any exclusive uniforms
// you've unlocked from the daily rewards (they live in src/shop.js and
// have special:true, so the menu can brag about them).
function allTeams() {
  return (window.TDShop) ? NFL_TEAMS.concat(TDShop.unlockedUniforms()) : NFL_TEAMS;
}

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
  state: 'menu',        // menu | kickoff | presnap | live | pass | dead | fumble | decision | kick | replay | qbreak | gameover
                        //   …plus the PLAY DEFENSE states, all starting with d:
                        //   dpresnap (they line up) | dlive (stop them!) | dpass (their ball
                        //   is in the air) | ddead (between their plays) | dwait (drive over)
  dsnapAt: 0,           // when the red team will snap the ball (they count their own cadence)
  koLive: false,        // during a kickoff: false = ball still in the air, true = run it back!
  difficulty: 'medium', // 'easy' | 'medium' | 'hard' — picked on the team menu
  score: 0,             // YOUR points
  oppScore: 0,          // the COMPUTER team's points
  quarter: 1,           // 1..4 (then overtime); see the game clock below
  clock: QUARTER_SECONDS, // game-clock seconds left in this quarter
  overtime: false,      // true once a tie game goes to sudden-death OT
  gameOver: false,      // true when the final whistle has blown
  cpu: null,            // scratch data + overlay for the computer's simulated drive
  breakResume: null,    // what happens after the quarter-break screen is tapped away
  breakReadyAt: 0,      // the break screen can't be skipped before this time
  breakOverlay: null,   // the break screen's on-screen pieces
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
  comment: null,        // the "announcer" line for quick play-by-play call-outs
  commentTween: null,
  carrierRing: null,    // the bright ring under whoever currently has the ball
  twoPlayer: false,     // false = vs computer, true = a friend controls one defender
  p2Defender: null,     // the single red player Player 2 drives in 2-player mode
  p2Label: null,        // the "P2" tag floating over that defender

  // ---- Swipe dash / juke (touch) ----
  dashVX: 0, dashVY: 0, // the velocity of an active dash/cut
  dashUntil: 0,         // the dash/cut overrides the D-pad until this time
  dashReadyAt: 0,       // can't dash again until this time (cooldown)
  boostUntil: 0,        // 🔋 CATCH ENERGY (a shop upgrade): extra speed until this time

  // ---- Instant replay ----
  replay: [],           // the "film reel": recent frames of where everyone was
  replayPending: false, // just scored — show the replay before the extra point
  replayIdx: 0,         // which film frame we're showing right now (a float, for slo-mo)
  replayHoldUntil: 0,   // freeze on the last frame until this time, then finish
  replayBars: null,     // the cinematic black bars (top & bottom of the screen)
  replayText: null,     // the blinking "📺 INSTANT REPLAY" title
  replayHint: null,     // the little "tap to skip" hint
  replayRing: null,     // the glowing spotlight under the ball carrier
};

let offense = [];  // 7 blue players (objects, see makePlayer)
let defense = [];  // 7 red players
let ball;          // the football sprite
let ballFollow = true;
let routeGfx;      // the colored "route lines" drawn behind each receiver
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

  // The colored route lines drawn behind the receivers (under the players).
  routeGfx = this.add.graphics().setDepth(3);

  // A bright ring that sits under WHOEVER has the ball, so you always know
  // which player to drive (especially right after a catch or a handoff).
  G.carrierRing = this.add.graphics().setDepth(4).setVisible(false);
  G.carrierRing.lineStyle(4, 0x2ee6ff, 0.95);
  G.carrierRing.strokeCircle(0, 0, 20);
  G.carrierRing.fillStyle(0x2ee6ff, 0.14);
  G.carrierRing.fillCircle(0, 0, 20);

  // A little "announcer" line that pops quick play-by-play call-outs.
  G.comment = this.add.text(270, 235, '', {
    fontFamily: 'Arial Black, Arial', fontSize: '26px',
    color: '#ffffff', stroke: '#0a1a3a', strokeThickness: 6
  }).setOrigin(0.5).setScrollFactor(0).setDepth(26).setVisible(false);

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

  // The "YOU" tag that floats over YOUR defender when you play defense.
  G.youLabel = this.add.text(0, 0, 'YOU', {
    fontFamily: 'Arial Black, Arial', fontSize: '12px',
    color: '#2ee6ff', stroke: '#000', strokeThickness: 4
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
  window.__td = { G, offense, defense, keys, touch, touch2, snap, throwTo, handOff, endPlay, setupPlay, toggleTwoPlayer, controlBallCarrier, controlP2Defender, fumble, resolveFumble, chooseFourthDown, startKick, startExtraPoint, onKickDone, showFourthDownChoice, inFieldGoalRange, fieldGoalDistance, NFL_TEAMS, enterMenu, menuNav, startGameWithTeam, startKickoff, endKickoffReturn, controlReturner, updateKickoffCoverage, canPass, passToNearest, canvasTapToWorld, recordReplayFrame, startReplay, updateReplay, endReplay, resolvePass, canHandOff, setDifficulty, diff, updateRouteTrails, drawRoutePreview, sayComment, skipReplay, isRunning, applySwipeRun, dashVelocity, advanceClock, tickPeriodAtBoundary, startCpuDrive, setupDefensePlay, redSnap, redThrow, redPlayEnd, defenseNextPlay, updateDefensePlay, cpuDriveEnd, finishCpuDrive, endGame, returnToMenuFromGameOver, startNextPlay, startBreak, endBreak };
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

  // QUARTER BREAK / HALFTIME: the whole game waits for a tap (or SPACE).
  if (G.state === 'qbreak') {
    freezeEveryone();
    if (consume('snap') || Phaser.Input.Keyboard.JustDown(keys.snap)) endBreak();
    return;
  }

  // GAME OVER: the final screen is up. Tap / SPACE goes back to the team menu.
  if (G.state === 'gameover') {
    if (Phaser.Input.Keyboard.JustDown(keys.snap)) returnToMenuFromGameOver();
    return;
  }

  // Keep the "who has the ball" ring glued under the ball carrier while a play
  // is live (hidden during dead time, kicks, replays — the replay has its own ring).
  if (G.carrierRing) {
    const showRing = (G.state === 'live' || G.state === 'pass'
                   || G.state === 'dlive' || G.state === 'dpass'
                   || (G.state === 'kickoff' && G.koLive));
    G.carrierRing.setVisible(showRing);
    if (showRing && G.ballCarrier) G.carrierRing.setPosition(G.ballCarrier.s.x, G.ballCarrier.s.y);
  }

  // ⭐ PLAY DEFENSE — the other team has the ball and runs REAL plays at you.
  if (G.state === 'dpresnap') {                 // they're lining up…
    freezeEveryone();
    if (time >= G.dsnapAt) redSnap(time);
    updateBall(); updateHUD();
    return;
  }
  if (G.state === 'dlive' || G.state === 'dpass') { updateDefensePlay(time); return; }
  if (G.state === 'ddead') {                    // between their plays
    freezeEveryone();
    if (time >= G.deadUntil) defenseNextPlay();
    updateBall(); updateHUD();
    return;
  }
  if (G.state === 'dwait') { freezeEveryone(); return; }   // their drive just ended

  if (G.state === 'dead') {
    freezeEveryone();
    if (time >= G.deadUntil) {
      if (G.replayPending) { G.replayPending = false; startReplay(); }  // watch the score again!
      else if (G.pendingXP) startExtraPoint();   // just scored? kick the extra point first
      else startNextPlay();
    }
    updateBall();
    return;
  }

  // INSTANT REPLAY: play back the film of the touchdown in slow motion.
  if (G.state === 'replay') { updateReplay(); return; }

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
    recordReplayFrame();        // remember this moment, in case it's a return TD
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
  recordReplayFrame();        // remember this moment, in case the play ends in a TD
  updateRouteTrails();        // draw the colored route line trailing each receiver

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
  G.replay = [];              // start a fresh film reel for this play
  G.dashUntil = 0;            // no leftover dash from the last play
  G.ballCarrier = offense[0]; // QB
  G.scene.cameras.main.startFollow(G.ballCarrier.s, true, 0.12, 0.12);
  if (Math.random() < 0.6) sayComment(pick(['Hut, hut!', 'Here we go!', 'The snap!']));
}

// How fast YOUR player runs right now: the base speed, times the 👟 SPEED
// CLEATS from the shop, times a short 🔋 CATCH ENERGY burst after a clean
// catch (both live in src/shop.js — without them this is just PLAYER_SPEED).
function runSpeed() {
  let s = PLAYER_SPEED;
  if (window.TDShop) {
    s *= TDShop.speedMult();
    if (G.scene.time.now < G.boostUntil) s *= TDShop.ENERGY_MULT;
  }
  return s;
}

// ---- Move the player you control ----
function controlBallCarrier() {
  const p = G.ballCarrier.s;
  const dash = dashVelocity();
  if (dash) {
    // A swipe dash/cut is driving him — it overrides the D-pad for its moment.
    p.setVelocity(dash.vx, dash.vy);
    p.setRotation(Math.atan2(dash.vy, dash.vx) + Math.PI / 2);
  } else {
    const spd = runSpeed();
    let vx = 0, vy = 0;
    // Move if EITHER the arrow key OR the on-screen arrow button is held
    if (keys.left.isDown || touch.left) vx = -spd;
    else if (keys.right.isDown || touch.right) vx = spd;
    if (keys.up.isDown || touch.up) vy = -spd;
    else if (keys.down.isDown || touch.down) vy = spd;
    if (vx && vy) { vx *= 0.707; vy *= 0.707; }
    p.setVelocity(vx, vy);
    if (vx || vy) p.setRotation(Math.atan2(vy, vx) + Math.PI / 2);
  }

  // Passing / handoff: whoever has the ball, behind the line, one forward
  // pass per play (canPass) — so the RB can throw after a handoff too!
  // You can also just TAP a receiver — see the canvas listener in setupTouchButtons.
  if (canPass()) {
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

// Can the QB actually hand off right now? He must have the ball, not have
// thrown, AND be close enough to the running back (you can't hand off from
// across the field). Shared by the HAND button and the H key.
function canHandOff() {
  if (G.state !== 'live' || G.ballCarrier !== offense[0] || G.hasPassed) return false;
  return Phaser.Math.Distance.Between(
    offense[0].s.x, offense[0].s.y, offense[1].s.x, offense[1].s.y) <= HANDOFF_DIST;
}

// Hand the ball to the running back — now you control him. This is NOT a
// pass, so the RB can still throw one (the halfback pass!) while he's
// behind the line — that's why we don't touch G.hasPassed here.
function handOff() {
  if (!canHandOff()) return;          // too far away? no handoff.
  const rb = offense[1];
  G.ballCarrier = rb;
  G.scene.cameras.main.startFollow(rb.s, true, 0.12, 0.12);
  sayComment(pick(['Handoff!', 'He gives it off!', 'Hands it off!']));
}

// ============================================================
// PASSING — throw to the receiver wearing that number
// ============================================================
function throwTo(num) {
  const wr = offense.find(o => (o.role === 'WR' || o.role === 'RB') && o.num === num);
  if (!wr || wr === G.ballCarrier) return;   // can't throw the ball to yourself!

  G.hasPassed = true;
  G.state = 'pass';
  ballFollow = false;

  // Lead the receiver: aim where they'll BE when the ball arrives.
  // The throw leaves from whoever is CARRYING the ball — usually the QB,
  // but on a halfback pass it's the RB doing the throwing.
  const thrower = G.ballCarrier.s;
  const dist = Phaser.Math.Distance.Between(thrower.x, thrower.y, wr.s.x, wr.s.y);
  const flight = dist / BALL_SPEED;
  const targetX = Phaser.Math.Clamp(wr.s.x + wr.s.body.velocity.x * flight, 10, FIELD_WIDTH - 10);
  const targetY = wr.s.y + wr.s.body.velocity.y * flight;

  ball.setPosition(thrower.x, thrower.y);
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
  // Where the receiver ACTUALLY is when the ball arrives (he kept running).
  const wx = wr.s.x, wy = wr.s.y;

  // If the ball landed nowhere near him, it was overthrown — INCOMPLETE.
  // (This is the fix for the "ball sails way past him but it's still a catch,
  //  and somehow a first down" bug — now a bad throw is just incomplete.)
  if (Phaser.Math.Distance.Between(x, y, wx, wy) > OVERTHROW_DIST) {
    endPlay('incomplete', 'OVERTHROWN!');
    return;
  }

  // Who is closest to the RECEIVER when the ball arrives?
  let nearestDef = Infinity;
  for (const d of defense) {
    nearestDef = Math.min(nearestDef, Phaser.Math.Distance.Between(d.s.x, d.s.y, wx, wy));
  }

  // A defender is right there — he either intercepts it or knocks it away.
  if (nearestDef < CATCH_CONTEST) {
    if (Math.random() < INT_CHANCE) endPlay('interception');
    else endPlay('incomplete', 'BROKEN UP!');
    return;
  }

  // Wide open — but receivers aren't perfect. They can miss it...
  // (🧤 STICKY GLOVES from the shop tilt both chances your way.)
  const gl = window.TDShop ? TDShop.gloveBoost() : { catchBonus: 0, dropCut: 0 };
  if (Math.random() > CATCH_CHANCE + gl.catchBonus) { endPlay('incomplete', 'INCOMPLETE'); return; }
  // ...or catch it and drop it.
  if (Math.random() < DROP_CHANCE - gl.dropCut)  { endPlay('incomplete', 'DROPPED IT!'); return; }

  // Clean catch! Put the ball in his hands and you now control this receiver.
  ball.setPosition(wx, wy);
  G.ballCarrier = wr;
  G.state = 'live';
  ballFollow = true;
  G.scene.cameras.main.startFollow(wr.s, true, 0.12, 0.12);

  // 🔋 CATCH ENERGY (shop): a clean catch fires a burst of speed!
  const boostMs = window.TDShop ? TDShop.energyMs() : 0;
  if (boostMs) G.boostUntil = G.scene.time.now + boostMs;
  sayComment(boostMs ? pick(['🔋 CATCH ENERGY!', '🔋 Boost ON!'])
           : nearestDef > 120 ? pick(['WIDE OPEN!', 'ALL ALONE!', 'Nobody there!'])
                              : pick(['Nice grab!', 'Caught it!', 'Reception!', 'What a catch!']));
}

// ============================================================
// TAP-TO-PASS + SCRAMBLE — tap a receiver to throw, on the run
// ------------------------------------------------------------
// While the QB has the ball behind the line, a tap on the field throws to the
// receiver nearest your finger — you don't have to remember 1/2/3. You can do
// it ON THE RUN: scramble around to dodge the rush, then tap the open guy (or
// cross the line and run it yourself).
// ============================================================

// Can the ball carrier throw right now? REAL football rules: ANYONE holding
// the ball may throw a forward pass, as long as (1) he's still behind the line
// of scrimmage and (2) nobody has thrown a forward pass yet this play. That
// unlocks the famous HALFBACK PASS trick play: hand off to the RB, and while
// he's still behind the line he can pull up and throw deep! (Linemen are the
// one exception — they're not eligible, same as on TV.)
// Shared by the tap AND the number buttons/keys.
function canPass() {
  const c = G.ballCarrier;
  return G.state === 'live'
    && c && c.role !== 'OL'
    && !G.hasPassed
    && c.s.y >= G.losY - 2;   // still behind the line of scrimmage
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
    if (o === G.ballCarrier) continue;   // the thrower isn't a target
    const d = Phaser.Math.Distance.Between(worldX, worldY, o.s.x, o.s.y);
    if (d < bestD) { bestD = d; best = o; }
  }
  if (best) throwTo(best.num);
}

// ============================================================
// SWIPE DASH / CUT — swipe the field while running for a burst or a quick cut
// ------------------------------------------------------------
// You're "running the ball" when a play is live and you can no longer pass (past
// the line, after a catch, on a handoff), or during a kickoff return. A long
// swipe = a speed burst (dash); a short swipe = a quick change of direction.
// The D-pad keeps working; swiping only kicks in while running, so it never
// clashes with tap-to-pass (which only fires while you CAN pass).
// ============================================================
function isRunning() {
  return (G.state === 'live' && !canPass()) || (G.state === 'kickoff' && G.koLive);
}

// Turn a finished swipe into a dash (long) or a quick cut (short). dx/dy are the
// screen drag; the field is drawn upright so screen direction = field direction.
function applySwipeRun(dx, dy, frac) {
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len, uy = dy / len;              // unit direction
  const now = G.scene.time.now;
  // ⚡ TURBO DASH from the shop makes the burst faster, longer, and
  // quicker to recharge (all zeros until you buy it — see src/shop.js).
  const up = window.TDShop ? TDShop.dashBoost() : { speed: 0, time: 0, cooldown: 0 };
  if (frac >= SWIPE_LONG_FRAC && now >= G.dashReadyAt) {
    const spd = DASH_SPEED + up.speed;
    const time = DASH_TIME + up.time;
    G.dashVX = ux * spd; G.dashVY = uy * spd;                 // long swipe = DASH
    G.dashUntil = now + time;
    G.dashReadyAt = now + time + (DASH_COOLDOWN - up.cooldown);  // then a short cooldown
    sayComment(pick(['DASH!', 'He hits the gas!', 'Burst of speed!']));
  } else {
    G.dashVX = ux * runSpeed(); G.dashVY = uy * runSpeed();   // short swipe = a quick cut
    G.dashUntil = now + JUKE_TIME;
  }
}

// While a dash/cut is active it drives the ball carrier instead of the D-pad.
function dashVelocity() {
  return (G.scene.time.now < G.dashUntil) ? { vx: G.dashVX, vy: G.dashVY } : null;
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
// ROUTE LINES — a colored trail showing where each receiver runs
// ------------------------------------------------------------
// Every frame we drop a breadcrumb at each receiver's feet and draw the whole
// trail as a line in his own color, so you can see the routes develop and pick
// who to throw to. Reset each play (in setupPlay) and cleared when a play ends.
// ============================================================
function updateRouteTrails() {
  if (!routeGfx) return;
  routeGfx.clear();
  for (const o of offense) {
    if (o.role !== 'WR' && o.role !== 'RB') continue;
    o.trail.push({ x: o.s.x, y: o.s.y });
    if (o.trail.length > 140) o.trail.shift();     // keep the line a sensible length
    if (o.trail.length < 2) continue;
    routeGfx.lineStyle(4, routeColor(o), 0.7);
    routeGfx.beginPath();
    routeGfx.moveTo(o.trail[0].x, o.trail[0].y);
    for (let i = 1; i < o.trail.length; i++) routeGfx.lineTo(o.trail[i].x, o.trail[i].y);
    routeGfx.strokePath();
  }
}

// Each receiver gets his own line color (RB yellow, WR #1 orange, WR #2 pink).
function routeColor(o) {
  if (o.role === 'RB') return 0xffe066;
  return o.num === 1 ? 0xffa23a : 0xff6ea5;
}

// Before the snap, draw each receiver's PLANNED route as a colored line (with a
// dot at the end) so you can see where everyone's going and pick who to throw
// to. Once the ball is snapped, updateRouteTrails takes over with the real path.
function drawRoutePreview() {
  if (!routeGfx) return;
  routeGfx.clear();
  for (const o of offense) {
    if (o.role !== 'WR' && o.role !== 'RB') continue;
    const pts = routePath(o);
    routeGfx.lineStyle(4, routeColor(o), 0.55);
    routeGfx.beginPath();
    routeGfx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) routeGfx.lineTo(pts[i].x, pts[i].y);
    routeGfx.strokePath();
    routeGfx.fillStyle(routeColor(o), 0.75);
    routeGfx.fillCircle(pts[pts.length - 1].x, pts[pts.length - 1].y, 5);   // the target spot
  }
}

// A simple sketch of where each route goes, from the receiver's pre-snap spot.
function routePath(o) {
  const sx = o.s.x, sy = o.s.y, top = ENDZONE + 20;
  const clampX = x => Phaser.Math.Clamp(x, 12, FIELD_WIDTH - 12);
  if (o.route === 'slant') {          // up a bit, then cut inside
    return [{ x: sx, y: sy }, { x: sx, y: sy - 70 }, { x: clampX(sx + 120), y: sy - 170 }];
  }
  if (o.route === 'swing') {          // out to the flat, then turn upfield
    const ox = clampX(sx + 90);
    return [{ x: sx, y: sy }, { x: ox, y: sy - 20 }, { x: clampX(ox + 35), y: Math.max(top, sy - 210) }];
  }
  return [{ x: sx, y: sy }, { x: sx, y: Math.max(top, sy - 300) }];   // 'streak' = straight up
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
  const boost = diff().defBoost;   // HARD mode: the whole defense moves faster

  for (const d of defense) {
    // In 2-player mode, one defender is driven by Player 2's fingers (or WASD),
    // so we skip the computer's brain for him.
    if (G.twoPlayer && d === G.p2Defender) {
      controlP2Defender(d);
      continue;
    }

    let tx, ty, speed = DEF_SPEED * boost;

    if (!qbHasBall && G.state !== 'pass') {
      // Someone caught it (or is running it) — everyone hunts the ball, but at the
      // slower PURSUE_SPEED so a good runner can actually break away.
      tx = carrier.x; ty = carrier.y; speed = PURSUE_SPEED * boost;
    } else if (d.role === 'DL') {
      // Linemen rush the quarterback...
      tx = offense[0].s.x; ty = offense[0].s.y;
      // ...unless an offensive lineman is blocking them. How slowed depends on
      // difficulty (easy = a strong pocket, hard = rushers push through faster).
      if (nearBlocker(d)) speed = DEF_SPEED * boost * diff().rushSlow;
    } else if (d.role === 'LB') {
      // Linebackers spy the QB in a short zone — they don't blitz, so the
      // pocket holds; they pursue once the ball is thrown or handed off.
      tx = offense[0].s.x; ty = G.losY - 45;
      speed = DEF_SPEED * boost * 0.8;
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
  if (routeGfx) routeGfx.clear();   // the route lines vanish when the play ends
  let msg, next, big = false;

  if (result === 'touchdown') {
    G.score += 6;
    msg = 'TOUCHDOWN!  +6';
    big = true;
    if (window.TDSound) TDSound.sting('td');   // 🎺 the touchdown fanfare!
    if (window.TDShop)  TDShop.earn(10);       // 🪙 touchdowns pay 10 coins
    G.pendingXP = true;   // after the TD banner, kick the extra point (worth +1)
    G.replayPending = G.replay.length >= REPLAY_MIN;   // enough film? show the replay first
    next = { los: 20, down: 1, fd: 30, fresh: true };
  } else if (result === 'interception') {
    // The other team caught it! It's THEIR ball now — and that means you're
    // about to PLAY DEFENSE (fresh:true hands the drive to them).
    msg = customMsg || 'INTERCEPTED!';
    big = true;
    next = { los: 20, down: 1, fd: 30, fresh: true };
  } else {
    const spot = (result === 'incomplete')
      ? G.losYards
      : Phaser.Math.Clamp(yardsFromOwnGoal(G.ballCarrier.s.y), 0, 99);

    // Announcer call-outs for how the run/tackle ended.
    if (result === 'tackle') {
      const gain = spot - G.losYards;
      if (G.ballCarrier === offense[0] && gain < 0) sayComment(pick(['SACKED!', 'Got him!', 'Down he goes!']));
      else if (gain >= 15) sayComment(pick(['WHAT A RUN!', "He's rolling!", 'Big gain!', 'Huge play!']));
      else if (Math.random() < 0.35) sayComment(pick(['Big hit!', 'Tackled!', 'Wrapped up!']));
    }

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

  // Run some game-clock off for this play (an incomplete stops the clock, so
  // less time comes off; a score/turnover is a quick whistle).
  advanceClock(result === 'incomplete' ? TIME_INCOMPLETE
             : (result === 'touchdown' || result === 'interception') ? TIME_SCORE_PLAY
             : TIME_RUN_PLAY);

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
    distance: diff().xpDist,   // farther on higher difficulty
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
    if (window.TDSound) TDSound.sting('td');
    if (window.TDShop)  TDShop.earn(2);        // 🪙 extra points pay 2 coins
  } else if (G.kickKind === 'xp') {
    msg = (result.outcome === 'short') ? 'NO GOOD — SHORT!' : 'NO GOOD — WIDE!';
  } else if (result.mode === 'fg' && result.made) {
    G.score += 3;
    msg = 'FIELD GOAL!  +3';
    if (window.TDSound) TDSound.sting('td');
    if (window.TDShop)  TDShop.earn(5);        // 🪙 field goals pay 5 coins
  } else if (result.mode === 'fg') {
    msg = (result.outcome === 'short') ? 'NO GOOD — SHORT!' : 'NO GOOD — WIDE!';
  } else {
    msg = 'PUNT — ' + result.puntYards + ' YDS';
  }
  // A kick (or missed kick) ends your possession — the ball goes to the OTHER
  // team next (startNextPlay sees fresh:true and runs their drive). Run a little
  // clock off for the kick play — EXCEPT an extra point: in real football the
  // try after a touchdown is UNTIMED, so it never burns clock (a TD as time
  // expires still gets its extra point, just like on TV).
  if (G.kickKind !== 'xp') advanceClock(TIME_KICK_PLAY);
  G.next = { los: 20, down: 1, fd: 30, fresh: true };
  G.state = 'dead';
  G.deadUntil = G.scene.time.now + 1600;
  showBanner(msg, true);
}

// ============================================================
// THE GAME CLOCK — 4 quarters, then a winner
// ============================================================
// Take some game-clock off the current quarter. We DON'T end the quarter here
// mid-flow; the dead-ball boundary handlers (startNextPlay + the CPU drive)
// notice the clock hit 0 and roll it over cleanly.
function advanceClock(sec) {
  if (G.gameOver) return;
  G.clock = Math.max(0, G.clock - sec);
}

// Called at a dead-ball boundary AFTER the clock's been charged. Rolls into
// the next quarter and reports what kind of stop is due:
//   'continue' — clock still running (or overtime just began), play on
//   'qbreak'   — a quarter just ended (Q1 or Q3) → show the break screen
//   'halftime' — the 2nd quarter ended → show the HALFTIME screen
//   'gameover' — time's up and someone is ahead → final whistle
function tickPeriodAtBoundary() {
  if (G.clock > 0) return 'continue';
  // Time expired in this period.
  if (!G.overtime && G.quarter < NUM_QUARTERS) {         // Q1→Q2→Q3→Q4
    G.quarter++;
    G.clock = QUARTER_SECONDS;
    return (G.quarter === 3) ? 'halftime' : 'qbreak';    // Q2 just ended = halftime
  }
  // End of the 4th quarter (or an overtime period).
  if (G.score !== G.oppScore) return 'gameover';         // somebody's ahead → final
  // Still tied → (keep playing) sudden-death overtime: the next score wins.
  G.overtime = true;
  G.clock = OT_SECONDS;
  showBanner('OVERTIME!', true);
  sayComment('Next score wins!');
  return 'continue';
}

function quarterLabel() { return G.overtime ? 'OT' : 'Q' + G.quarter; }
function formatClock(sec) {
  sec = Math.max(0, Math.round(sec));
  const m = Math.floor(sec / 60), s = sec % 60;
  return m + ':' + (s < 10 ? '0' : '') + s;
}

// ============================================================
// ⭐ PLAY DEFENSE! — the other team runs REAL plays… and YOU stop them
// ------------------------------------------------------------
// When your possession ends, the other team gets the ball — and instead of
// watching a little bar march down a chart, YOU PLAY DEFENSE. The red team
// lines up and runs actual plays: handoffs, drop-backs, passes to receivers
// running routes. You control ONE defender (the one wearing the YOU tag)
// with the same arrows / D-pad as always, while your AI teammates rush the
// passer and cover the receivers. Get close to the ball carrier and the
// tackle is automatic — same rule the defense has always used on you.
//
// Stop them for 4 downs, break up a pass, pick one off, or pop the ball
// loose, and the ball is YOURS. Let them march and they WILL score.
//
// Their field position lives in G.cpu.spot as "THEIR yards from THEIR own
// goal". Their own goal is the TOP of the screen, so they drive DOWN
// toward your endzone at the bottom — the mirror image of your drives.
// ============================================================
const RED_PASS_CHANCE = 0.55;   // how often they call a pass play (else they run)
const RED_CATCH = 0.82;         // their receivers are good…
const RED_INT = 0.35;           // …but throw into YOUR coverage and you can pick it off!
const RED_FUMBLE = 0.08;        // a big tackle can still pop the ball loose

// Yard math for the red team (the mirror of yardsToY / yardsFromOwnGoal).
function redYardsToY(yds) { return ENDZONE + yds * PX_PER_YARD; }
function redYardsFromGoal(y) { return (y - ENDZONE) / PX_PER_YARD; }

// Their drive begins: fresh sticks at their own 25, then line up the first play.
function startCpuDrive() {
  // A safety net: if somehow there's no opponent, just kick off to the player.
  if (!G.oppTeam) { startKickoff(); return; }
  G.cpu = { spot: 25, down: 1, togo: 10, play: null };
  showBanner(G.oppTeam.abbr + ' BALL — PLAY DEFENSE!', true);
  sayComment('Tackle the ball carrier!');
  setupDefensePlay();
}

// Line up one red play: their offense faces DOWN the field, your defense
// meets them, and the snap comes by itself a moment later.
function setupDefensePlay() {
  const L = redYardsToY(G.cpu.spot);        // their line of scrimmage, in pixels
  G.losY = L;                               // (sack math + the carrier ring use this)
  G.hasPassed = false;
  document.body.classList.remove('kicking');
  document.body.classList.add('returning'); // defense = run-only controls (no pass buttons)

  for (const o of offense) { o.s.setVisible(true); o.trail = []; if (o.label) o.label.setVisible(false); }
  for (const d of defense) { d.s.setVisible(true); if (d.label) d.label.setVisible(false); }
  if (referee) referee.setVisible(true);
  if (routeGfx) routeGfx.clear();

  // The RED offense lines up (upside-down mirror of your formation):
  place(defense[0], 266, L - 60);   // their QB
  place(defense[1], 266, L - 84);   // their RB, behind him
  place(defense[2], 55,  L - 14);   // their left receiver (runs a slant)
  place(defense[3], 478, L - 14);   // their right receiver (runs a streak)
  place(defense[4], 226, L - 16);   // their line
  place(defense[5], 266, L - 16);
  place(defense[6], 306, L - 16);
  defense[1].startY = defense[1].s.y;
  defense[2].startY = defense[2].s.y;
  defense[3].startY = defense[3].s.y;

  // YOUR defense lines up to meet them — YOU are the middle linebacker:
  place(offense[0], 266, L + 46);   // YOU (the YOU tag floats over you)
  place(offense[4], 246, L + 16);   // your rushers, on their line
  place(offense[5], 286, L + 16);
  place(offense[6], 326, L + 46);   // an AI linebacker beside you
  place(offense[2], 60,  L + 28);   // covering their left receiver
  place(offense[3], 473, L + 28);   // covering their right receiver
  place(offense[1], 206, L + 40);   // watching their RB out of the backfield

  referee.setPosition(410, L - 90);

  G.ballCarrier = defense[0];       // their QB starts with it
  ballFollow = true;
  G.cpu.play = null;
  G.state = 'dpresnap';
  G.dsnapAt = G.scene.time.now + 1100;   // they snap it on their own count
  G.scene.cameras.main.startFollow(defense[0].s, true, 0.12, 0.12);
  updateBall();
  updateHUD();
}

// They snap it! Secretly pick their play — a run or a pass. You'll find out
// the same way a real defense does: by watching what they do.
function redSnap(time) {
  G.snapTime = time;
  G.cpu.play = {
    type: Math.random() < RED_PASS_CHANCE ? 'pass' : 'run',
    handed: false, thrown: false,
    throwAt: 0.8 + Math.random() * 0.8,   // pass plays let it fly at a random moment
  };
  G.state = 'dlive';
  G.replay = [];
  sayComment(pick(['Here they come!', 'The snap…', 'Stop them!']));
}

// YOU are the defender with the YOU tag — same controls as ever: arrows or
// the D-pad. Get to whoever has the ball; the tackle happens on contact.
function controlYourDefender() {
  const p = offense[0].s;
  const spd = runSpeed();   // cleats help you chase, too
  let vx = 0, vy = 0;
  if (keys.left.isDown || touch.left) vx = -spd;
  else if (keys.right.isDown || touch.right) vx = spd;
  if (keys.up.isDown || touch.up) vy = -spd;
  else if (keys.down.isDown || touch.down) vy = spd;
  if (vx && vy) { vx *= 0.707; vy *= 0.707; }
  p.setVelocity(vx, vy);
  if (vx || vy) p.setRotation(Math.atan2(vy, vx) + Math.PI / 2);
}

// The heartbeat of a defensive play (runs every frame during dlive/dpass).
function updateDefensePlay(time) {
  const elapsed = (time - G.snapTime) / 1000;
  controlYourDefender();
  updateRedTeam(elapsed);
  updateBlueTeammates();
  updateBall();
  updateHUD();
  if (G.state !== 'dlive') return;   // ball in the air (or the play just ended)
  if (redCheckTouchdown()) return;
  redCheckTackle();
}

// ---- The red team's brain --------------------------------------------------
function updateRedTeam(elapsed) {
  const play = G.cpu.play;
  const qb = defense[0], rb = defense[1];
  const carrier = G.ballCarrier;

  updateRedLine();   // their line blocks your rushers

  // Their receivers run routes — "downfield" for them is DOWN the screen.
  // (They run routes on run plays too. Real teams fake you out like that.)
  for (const wr of [defense[2], defense[3]]) {
    if (wr === carrier) continue;
    const depth = wr.s.y - wr.startY;
    let vx = 0, vy = WR_SPEED;
    if (wr === defense[2] && depth >= 70) {   // the slant cuts toward the middle
      vx = WR_SPEED * 0.66; vy = WR_SPEED * 0.75;
    }
    wr.s.setVelocity(vx, vy);
    wr.s.setRotation(Math.atan2(vy, vx) + Math.PI / 2);
  }

  // Their RB: on a pass he swings out to the flat; on a run he comes for the ball.
  if (rb !== carrier) {
    if (play.type === 'pass') {
      const depth = rb.s.y - rb.startY;
      rb.s.setVelocity(depth < 60 ? -WR_SPEED * 0.55 : 0, WR_SPEED * 0.7);
    } else if (!play.handed) {
      steer(rb.s, qb.s.x, qb.s.y + 2, WR_SPEED);
    }
  }

  // Their QB: a run play hands it off; a pass play drops back, then throws —
  // EARLY and wildly if you're bearing down on him (a hurried throw!).
  if (carrier === qb) {
    if (play.type === 'run') {
      qb.s.setVelocity(0, 0);
      if (!play.handed &&
          (Phaser.Math.Distance.Between(rb.s.x, rb.s.y, qb.s.x, qb.s.y) < 22 || elapsed > 1.3)) {
        play.handed = true;
        G.ballCarrier = rb;
        G.scene.cameras.main.startFollow(rb.s, true, 0.12, 0.12);
        sayComment(pick(['They hand it off!', 'Handoff!']));
      }
    } else {
      steer(qb.s, 266, redYardsToY(G.cpu.spot) - 105, 120);   // drop back into the pocket
      const pressured = elapsed > 0.5 && nearestBlueTo(qb) < 40;
      if (elapsed >= play.throwAt || pressured) redThrow(pressured);
    }
    return;
  }

  // A red runner has it (their RB, or a receiver after a catch): he weaves
  // downfield, juking away from the nearest tackler — usually YOU.
  const c = carrier.s;
  let near = null, nd = Infinity;
  for (const o of offense) {
    const dd = Phaser.Math.Distance.Between(o.s.x, o.s.y, c.x, c.y);
    if (dd < nd) { nd = dd; near = o; }
  }
  let tx = c.x + (266 - c.x) * 0.12;                        // drift off the sideline
  if (near && nd < 95) tx = c.x + (c.x - near.s.x) * 1.7;   // juke away from the tackler
  steer(c, Phaser.Math.Clamp(tx, 24, FIELD_WIDTH - 24), c.y + 140, diff().redSpeed);
}

// Their linemen block whoever is rushing their QB — and YOU count as a
// rusher, so charge in and you'll feel them lean on you (mirror of updateLine).
function updateRedLine() {
  const qb = defense[0].s;
  const rushers = [offense[0], offense[4], offense[5]];
  const linemen = [defense[4], defense[5], defense[6]].filter(d => d !== G.ballCarrier);
  const claimed = new Set();

  for (const ol of linemen) {
    let best = null, bestD = Infinity;
    let free = null, freeD = Infinity;
    for (const r of rushers) {
      const dd = Phaser.Math.Distance.Between(ol.s.x, ol.s.y, r.s.x, r.s.y);
      if (dd < bestD) { bestD = dd; best = r; }
      if (!claimed.has(r) && dd < freeD) { freeD = dd; free = r; }
    }
    const target = free || best;
    if (!target) { ol.s.setVelocity(0, 0); continue; }
    if (free) claimed.add(free);
    const a = Math.atan2(qb.y - target.s.y, qb.x - target.s.x);
    steer(ol.s, target.s.x + Math.cos(a) * 14, target.s.y + Math.sin(a) * 14, OL_SPEED * 0.95);
  }
}

// Is a red lineman leaning on this blue rusher? (Slows him — their pocket.)
function redNearBlocker(blue) {
  for (const d of [defense[4], defense[5], defense[6]]) {
    if (d === G.ballCarrier) continue;
    if (Phaser.Math.Distance.Between(d.s.x, d.s.y, blue.s.x, blue.s.y) < BLOCK_DIST) return true;
  }
  return false;
}

// How close is the NEAREST of your players to this red player?
function nearestBlueTo(p) {
  let nd = Infinity;
  for (const o of offense) {
    nd = Math.min(nd, Phaser.Math.Distance.Between(o.s.x, o.s.y, p.s.x, p.s.y));
  }
  return nd;
}

// ---- Your AI teammates -----------------------------------------------------
// Two rush the passer, three cover their receivers, one spies beside you.
// The moment the ball is RUNNING (handoff or a catch), everyone swarms it.
function updateBlueTeammates() {
  const carrier = G.ballCarrier;
  const qbHasIt = carrier === defense[0] && !G.hasPassed;

  for (const o of offense) {
    if (o === offense[0]) continue;   // that's YOU — you drive yourself
    let tx, ty, speed = DEF_SPEED;

    if (!qbHasIt && G.state !== 'dpass') {
      // Someone's running the ball — your teammates chase, but on purpose a
      // step slow: THEY rally, but YOU are the closer. Stand around and the
      // red team will march right down the field. Hunt, and you're the hero.
      tx = carrier.s.x; ty = carrier.s.y; speed = PURSUE_SPEED * 0.8;
    } else if (o === offense[4] || o === offense[5]) {
      tx = defense[0].s.x; ty = defense[0].s.y;             // rush their QB…
      if (redNearBlocker(o)) speed = DEF_SPEED * 0.4;       // …through their blockers
    } else if (o === offense[2]) { tx = defense[2].s.x; ty = defense[2].s.y + 24; }  // cover (goal-side = BELOW)
    else if (o === offense[3]) { tx = defense[3].s.x; ty = defense[3].s.y + 24; }
    else if (o === offense[1]) { tx = defense[1].s.x; ty = defense[1].s.y + 24; }
    else { tx = carrier.s.x; ty = carrier.s.y + 55; speed = DEF_SPEED * 0.85; }      // the AI linebacker spies
    steer(o.s, tx, ty, speed);
  }
}

// ---- Their pass ------------------------------------------------------------
function redThrow(hurried) {
  const play = G.cpu.play;
  if (play.thrown) return;
  play.thrown = true;
  G.hasPassed = true;

  // They throw to whoever is most OPEN (farthest from all your defenders).
  // A HURRIED throw (you got in his face!) grabs anyone — and wobbles.
  const targets = [defense[1], defense[2], defense[3]];
  let best = targets[0], bestGap = -1;
  for (const t of targets) {
    const gap = nearestBlueTo(t);
    if (gap > bestGap) { bestGap = gap; best = t; }
  }
  if (hurried) { best = pick(targets); sayComment('HURRIED THROW!'); }
  else sayComment(pick(['They let it fly!', 'Downfield…', 'The throw…']));

  G.state = 'dpass';
  ballFollow = false;
  const from = defense[0].s;
  const dist = Phaser.Math.Distance.Between(from.x, from.y, best.s.x, best.s.y);
  const flight = dist / BALL_SPEED;
  const wobble = hurried ? 40 : 0;
  const tX = Phaser.Math.Clamp(best.s.x + best.s.body.velocity.x * flight
             + Phaser.Math.Between(-wobble, wobble), 10, FIELD_WIDTH - 10);
  const tY = best.s.y + best.s.body.velocity.y * flight;
  ball.setPosition(from.x, from.y);
  G.scene.cameras.main.startFollow(ball, true, 0.12, 0.12);
  G.scene.tweens.add({
    targets: ball, x: tX, y: tY,
    duration: Math.max(220, flight * 1000), ease: 'Sine.Out',
    onComplete: () => resolveRedPass(best, tX, tY)
  });
}

// The ball comes down — YOUR coverage decides what happens.
function resolveRedPass(wr, x, y) {
  if (G.state !== 'dpass') return;   // the drive ended some other way — let it drop
  const wx = wr.s.x, wy = wr.s.y;

  if (Phaser.Math.Distance.Between(x, y, wx, wy) > OVERTHROW_DIST) {
    redPlayEnd('incomplete', 'OVERTHROWN!');
    return;
  }

  // Whoever of YOURS is closest when it arrives can make a play on it.
  let nd = Infinity;
  for (const o of offense) {
    nd = Math.min(nd, Phaser.Math.Distance.Between(o.s.x, o.s.y, wx, wy));
  }
  if (nd < CATCH_CONTEST + 2) {
    if (Math.random() < RED_INT) {
      if (window.TDSound) TDSound.sting('td');           // a takeaway deserves a fanfare!
      cpuDriveEnd('turnover', 'INTERCEPTED — YOUR BALL!');
    } else {
      redPlayEnd('incomplete', 'YOU BROKE IT UP!');
    }
    return;
  }

  if (Math.random() > RED_CATCH) { redPlayEnd('incomplete', 'INCOMPLETE'); return; }

  // They caught it — now it's a foot race. TACKLE HIM!
  ball.setPosition(wx, wy);
  G.ballCarrier = wr;
  G.state = 'dlive';
  ballFollow = true;
  G.scene.cameras.main.startFollow(wr.s, true, 0.12, 0.12);
  sayComment(pick(['Caught it — TACKLE HIM!', 'Complete — get him!']));
}

// ---- Tackles, touchdowns, and the end of a red play ------------------------
function redCheckTouchdown() {
  if (G.ballCarrier.s.y >= FIELD_LENGTH - ENDZONE) {
    cpuDriveEnd('touchdown');
    return true;
  }
  return false;
}

function redCheckTackle() {
  const c = G.ballCarrier.s;
  for (const o of offense) {
    if (Phaser.Math.Distance.Between(o.s.x, o.s.y, c.x, c.y) < TACKLE_DIST) {
      if (Math.random() < RED_FUMBLE) {
        if (window.TDSound) TDSound.sting('td');
        cpuDriveEnd('turnover', 'FUMBLE — YOUR BALL!');
      } else {
        redPlayEnd('tackle', null, o === offense[0]);   // did YOU make the stop?
      }
      return;
    }
  }
}

// A red play is over — move their sticks and set up what's next.
function redPlayEnd(result, customMsg, byYou) {
  freezeEveryone();
  if (routeGfx) routeGfx.clear();
  advanceClock(result === 'incomplete' ? TIME_INCOMPLETE : TIME_RUN_PLAY);

  let spot = G.cpu.spot;
  if (result !== 'incomplete') {
    spot = Phaser.Math.Clamp(Math.round(redYardsFromGoal(G.ballCarrier.s.y)), 1, 99);
  }
  const gain = spot - G.cpu.spot;

  let msg;
  if (result === 'incomplete') {
    msg = customMsg || 'INCOMPLETE';
  } else if (G.ballCarrier === defense[0] && gain < 0) {
    msg = 'SACKED!';                                   // you got to their QB!
  } else {
    msg = customMsg || (gain >= 1 ? 'THEY GAIN ' + gain : 'STUFFED — NO GAIN!');
  }
  if (byYou) sayComment(pick(['YOU made the stop!', 'What a tackle!', 'Big hit!']));

  G.cpu.spot = spot;
  G.cpu.togo -= gain;
  if (G.cpu.spot >= 100) { cpuDriveEnd('touchdown'); return; }   // (safety net)

  // Downs count on EVERY play, complete or not — just like yours.
  if (G.cpu.togo <= 0) { G.cpu.down = 1; G.cpu.togo = 10; msg = 'THEIR FIRST DOWN'; }
  else G.cpu.down++;

  if (G.cpu.down > 4) {
    if (window.TDSound) TDSound.sting('td');
    cpuDriveEnd('turnover', 'STOPPED ON DOWNS — YOUR BALL!');
    return;
  }

  G.state = 'ddead';
  G.deadUntil = G.scene.time.now + 1500;
  showBanner(msg, false);
}

// Between red plays: settle the clock/quarter (same boundaries as your
// drives), let them make their 4th-down choice, then line up the next play.
function defenseNextPlay() {
  if (G.overtime && G.score !== G.oppScore) { endGame(); return; }
  const t = tickPeriodAtBoundary();
  if (t === 'gameover') { endGame(); return; }
  if (t === 'halftime') { startBreak('half', startCpuDrive); return; }  // they receive the 2nd-half kick (real rules)
  if (t === 'qbreak')   { startBreak('q', setupDefensePlay); return; }  // the drive carries across Q1/Q3

  // 4th down: they usually kick — a field goal in range, a punt if not.
  // But short yardage past midfield? They just might GO FOR IT. Be ready.
  if (G.cpu.down === 4) {
    const fgDist = (100 - G.cpu.spot) + 17;
    if (fgDist <= FG_MAX_DIST && Math.random() < 0.85) { cpuDriveEnd('fieldgoal'); return; }
    if (!(G.cpu.togo <= 2 && G.cpu.spot > 40 && Math.random() < 0.5)) { cpuDriveEnd('punt'); return; }
    sayComment("They're GOING FOR IT!");
  }
  setupDefensePlay();
}

// Their drive is OVER — tally it up, show the banner, then hand the ball back.
// (Their touchdown counts 7 — the try after is automatic for the computer.)
function cpuDriveEnd(kind, customMsg) {
  if (!G.cpu) return;
  freezeEveryone();
  G.state = 'dwait';                 // hold everything while the banner lands
  const abbr = G.oppTeam.abbr;
  let msg, pts = 0, big = false;
  if (kind === 'touchdown')      { pts = 7; big = true; msg = abbr + ' TOUCHDOWN';
                                   if (window.TDSound) TDSound.sting('lose'); }
  else if (kind === 'fieldgoal') { pts = 3; big = true; msg = abbr + ' FIELD GOAL  +3'; }
  else if (kind === 'punt')      { msg = abbr + ' PUNTS IT AWAY'; }
  else                           { big = true; msg = customMsg || 'TURNOVER — YOUR BALL!';
                                   if (window.TDShop) TDShop.earn(3); }   // 🪙 takeaways pay 3

  G.oppScore += pts;
  updateHUD();
  showBanner(msg, big);
  G.scene.time.delayedCall(1700, finishCpuDrive);
}

// Ball back to you: settle the clock/quarter at this possession boundary, then
// you field a kickoff (unless the game is over, or it's time for a break).
function finishCpuDrive() {
  G.cpu = null;
  document.body.classList.remove('returning');
  if (G.overtime && G.score !== G.oppScore) { endGame(); return; }  // sudden death
  const t = tickPeriodAtBoundary();
  if (t === 'gameover') { endGame(); return; }
  if (t === 'halftime') { startBreak('half', startCpuDrive); return; }  // they get the 2nd-half kick (real rules)
  if (t === 'qbreak')   { startBreak('q', startKickoff); return; }
  startKickoff();
}

// ============================================================
// QUARTER BREAKS & HALFTIME — the score, a breather… and an AD 📺
// ------------------------------------------------------------
// A little TV-style break between quarters: the score so far, a word from our
// sponsors (all sponsors are 100% imaginary and extremely silly), and "tap to
// continue". Halftime adds a note about the real NFL rule for who gets the
// ball next. The break can't be tapped away for the first BREAK_MIN_MS, so a
// stray tap doesn't blow right through it.
// ============================================================
function startBreak(kind, resume) {
  G.state = 'qbreak';
  G.breakResume = resume;
  G.breakReadyAt = G.scene.time.now + BREAK_MIN_MS;
  freezeEveryone();
  G.scene.cameras.main.stopFollow();
  if (routeGfx) routeGfx.clear();
  if (G.banner) { G.banner.destroy(); G.banner = null; }
  document.body.classList.add('kicking');       // hide the football buttons
  buildBreakOverlay(kind);
}

// Tap / SPACE ends the break and the game picks up where it left off.
function endBreak() {
  if (G.state !== 'qbreak') return;
  if (G.scene.time.now < G.breakReadyAt) return;   // too soon — let the break land
  destroyBreakOverlay();
  const resume = G.breakResume;
  G.breakResume = null;
  if (resume) resume(); else startKickoff();
}

function buildBreakOverlay(kind) {
  const s = G.scene, O = {};
  // Small helper: centered text pinned to the screen, above everything else.
  const mk = (y, str, size, color, opts = {}) => s.add.text(270, y, str, Object.assign({
    fontFamily: 'Arial Black, Arial', fontSize: size + 'px', color,
    stroke: '#000', strokeThickness: Math.max(3, Math.round(size / 6)), align: 'center'
  }, opts)).setOrigin(0.5).setScrollFactor(0).setDepth(62);

  O.bg = s.add.graphics().setScrollFactor(0).setDepth(60);
  O.bg.fillStyle(0x0a1020, 1); O.bg.fillRect(0, 0, 540, 720);

  O.title = mk(100, kind === 'half' ? '🏈 HALFTIME 🏈'
                                    : 'END OF THE ' + ordinal(G.quarter - 1) + ' QUARTER',
               28, '#ffe066');
  O.score = mk(172, `${G.team.abbr} ${G.score}   —   ${G.oppTeam.abbr} ${G.oppScore}`, 40, '#ffffff');

  // ---- the commercial break — an ANIMATED ad (see src/ads.js) ----
  O.adLabel = mk(232, 'COMMERCIAL BREAK', 13, '#aab4c8');
  if (window.TDAds) O.ad = TDAds.play(s);   // O.ad.destroy() runs at cleanup

  // Halftime: teach the real-football rule for who gets the ball next.
  if (kind === 'half') {
    O.rule = mk(530, 'Real NFL rules: you took the opening kickoff,\nso the ' +
                     G.oppTeam.name + ' get the ball\nto start the second half.',
                14, '#8fd0ff');
  }

  O.hint = mk(kind === 'half' ? 632 : 560, 'tap to continue', 18, '#ffffff');
  s.tweens.add({ targets: O.hint, alpha: 0.25, duration: 550, yoyo: true, repeat: -1 });
  G.breakOverlay = O;
}

function destroyBreakOverlay() {
  const O = G.breakOverlay; if (!O) return;
  for (const k in O) if (O[k] && O[k].destroy) O[k].destroy();
  G.breakOverlay = null;
}

// ============================================================
// GAME OVER — the final score, and who won
// ============================================================
function endGame() {
  if (G.state === 'gameover') return;   // the whistle only blows once
  G.gameOver = true;
  G.state = 'gameover';
  if (window.TDSound) TDSound.sting(G.score > G.oppScore ? 'win' : 'lose');
  // 🪙 the game check: +25 for a win, +5 for a good try (before the FINAL
  // screen is built, so it can show everything you earned today).
  if (window.TDShop) TDShop.earn(G.score > G.oppScore ? 25 : 5);
  freezeEveryone();
  G.cpu = null;
  document.body.classList.add('kicking');   // hide the football buttons
  G.scene.cameras.main.stopFollow();
  buildGameOverOverlay();

  // Tell the tracker a game FINISHED — after your second finished game it
  // pops the friendly "Would you like to do a review?" (see src/stats.js).
  if (window.TDStats) TDStats.recordGameEnd();
}

function buildGameOverOverlay() {
  const s = G.scene;
  const O = {};
  O.bg = s.add.graphics().setScrollFactor(0).setDepth(50);
  O.bg.fillStyle(0x06080f, 1); O.bg.fillRect(0, 0, 540, 720);   // solid — a clean FINAL screen

  const youWon  = G.score > G.oppScore;
  const headline = youWon ? 'YOU WIN!' : 'YOU LOSE';
  O.head = s.add.text(270, 170, 'FINAL', {
    fontFamily: 'Arial Black, Arial', fontSize: '30px', color: '#aab4c8',
    stroke: '#000', strokeThickness: 5 }).setOrigin(0.5).setScrollFactor(0).setDepth(52);

  O.score = s.add.text(270, 300,
    `${G.team.abbr} ${G.score}\n${G.oppTeam.abbr} ${G.oppScore}`, {
    fontFamily: 'Arial Black, Arial', fontSize: '64px', color: '#ffffff',
    stroke: '#000', strokeThickness: 8, align: 'center', lineSpacing: 10
  }).setOrigin(0.5).setScrollFactor(0).setDepth(52);

  O.result = s.add.text(270, 450, headline, {
    fontFamily: 'Arial Black, Arial', fontSize: '48px',
    color: youWon ? '#ffe066' : '#ff8a8a', stroke: '#000', strokeThickness: 7
  }).setOrigin(0.5).setScrollFactor(0).setDepth(52).setScale(0);
  s.tweens.add({ targets: O.result, scale: 1, duration: 450, ease: 'Back.Out' });

  O.winner = s.add.text(270, 512,
    (youWon ? G.team.name : G.oppTeam.name) + ' WIN!', {
    fontFamily: 'Arial Black, Arial', fontSize: '22px', color: '#ffffff',
    stroke: '#000', strokeThickness: 4 }).setOrigin(0.5).setScrollFactor(0).setDepth(52);

  // 🪙 Payday! Show the coins this game earned (spend them in the shop).
  if (window.TDShop && TDShop.gameEarnings() > 0) {
    O.coins = s.add.text(270, 554, '🪙 +' + TDShop.gameEarnings() + ' COINS EARNED', {
      fontFamily: 'Arial Black, Arial', fontSize: '20px', color: '#ffe066',
      stroke: '#000', strokeThickness: 4 }).setOrigin(0.5).setScrollFactor(0).setDepth(52);
  }

  O.again = s.add.text(270, 600, 'tap to play again', {
    fontFamily: 'Arial Black, Arial', fontSize: '18px', color: '#8fd0ff',
    stroke: '#000', strokeThickness: 3 }).setOrigin(0.5).setScrollFactor(0).setDepth(52);
  s.tweens.add({ targets: O.again, alpha: 0.3, duration: 600, yoyo: true, repeat: -1 });

  G.gameOverOverlay = O;
}

function returnToMenuFromGameOver() {
  const O = G.gameOverOverlay;
  if (O) { for (const k in O) if (O[k] && O[k].destroy) O[k].destroy(); G.gameOverOverlay = null; }
  document.body.classList.remove('kicking', 'returning', 'two-player');
  enterMenu();
}

// ---- small color helpers (for the opponent's on-screen colors) ----
function hexColor(n) { return '#' + (n & 0xffffff).toString(16).padStart(6, '0'); }
// Lighten a color a touch so dark team colors still read on the dark overlay.
function brighten(n) {
  let r = (n >> 16) & 0xff, g = (n >> 8) & 0xff, b = n & 0xff;
  r = Math.min(255, Math.round(r + (255 - r) * 0.45));
  g = Math.min(255, Math.round(g + (255 - g) * 0.45));
  b = Math.min(255, Math.round(b + (255 - b) * 0.45));
  return (r << 16) | (g << 8) | b;
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
  if (window.TDSound) TDSound.setMode('menu');   // 🎵 the chill menu tune
  document.body.classList.add('menu');   // hide the football buttons, show ◀ ▶ PLAY
  G.menuIndex = 0;
  setMenuVisible(true);
  renderMenu();
  syncDiffButtons();   // highlight the current difficulty
  if (window.TDShop)  TDShop.onMenu();           // 🪙 coin count + a daily gift if one's ready
  if (window.TDStats && TDStats.refreshTracker) TDStats.refreshTracker();  // 🌍 side panel
}

// Paint the menu for whichever team you're currently looking at.
function renderMenu() {
  const t = allTeams()[G.menuIndex];
  // Repaint the preview player's uniform, then refresh anything using it.
  makeChibiTexture(G.scene, 'blue', t.jersey, t.helmet);
  G.menu.preview.setTexture('blue');
  for (const o of offense) o.s.setTexture('blue');

  G.menu.abbr.setText(t.abbr);
  G.menu.name.setText(t.name);
  // Exclusive daily-reward uniforms get to show off a little.
  G.menu.note.setText(t.special ? '⭐ EXCLUSIVE DAILY-REWARD UNIFORM!'
                                : 'You’ll play a random team');
  G.menu.note.setColor(t.special ? '#ffe066' : '#aab4c8');

  // Two color bars: jersey on top, helmet under it.
  const g = G.menu.swatch; g.clear();
  g.fillStyle(t.jersey, 1); g.fillRoundedRect(180, 210, 180, 12, 4);
  g.fillStyle(t.helmet, 1); g.fillRoundedRect(180, 226, 180, 12, 4);
  g.lineStyle(2, 0xffffff, 0.5); g.strokeRoundedRect(180, 210, 180, 28, 4);
}

// Flip to the next/previous team (wraps around the list).
function menuNav(dir) {
  if (G.state !== 'menu') return;
  const n = allTeams().length;
  G.menuIndex = (G.menuIndex + dir + n) % n;
  renderMenu();
}

// Jump the menu straight to one uniform (shop.js calls this the moment you
// claim a new one, so you can try on your prize right away!).
window.TDMenu = {
  showTeam(abbr) {
    const i = allTeams().findIndex(t => t.abbr === abbr);
    if (i >= 0 && G.state === 'menu') { G.menuIndex = i; renderMenu(); }
  }
};

// Pick a difficulty (Easy/Medium/Hard) on the menu; highlight the chosen button.
function setDifficulty(level) {
  if (!DIFFICULTY[level]) return;
  G.difficulty = level;
  syncDiffButtons();
}
function syncDiffButtons() {
  document.querySelectorAll('.diff-btn').forEach(b =>
    b.classList.toggle('sel', b.dataset.diff === G.difficulty));
}

// Tap PLAY: lock in your team, give the computer a random other team, paint
// both uniforms for real, then start the game.
function startGameWithTeam() {
  if (G.state !== 'menu') return;
  G.team = allTeams()[G.menuIndex];

  // Pick a random OTHER team for the computer (always a real NFL team —
  // your exclusive daily-reward uniforms are yours alone).
  let opp;
  do { opp = NFL_TEAMS[Phaser.Math.Between(0, NFL_TEAMS.length - 1)]; } while (opp === G.team);
  G.oppTeam = opp;

  // Fresh scoreboard & game clock for a brand-new game.
  G.score = 0; G.oppScore = 0;
  G.quarter = 1; G.clock = QUARTER_SECONDS;
  G.overtime = false; G.gameOver = false;
  G.boostUntil = 0;                              // no leftover 🔋 energy burst
  if (window.TDShop) TDShop.startGame();         // 🪙 fresh "coins this game" count

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

  // Count this game on the WORLD player tracker (see src/stats.js) —
  // +1 game, and the very first game on a device adds its country flag.
  if (window.TDStats) TDStats.recordGameStart();

  if (window.TDSound) TDSound.setMode('game');   // 🎵 kick the music into gear
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
  G.replay = [];                             // start a fresh film reel for the return
  G.dashUntil = 0;                           // no leftover dash
  document.body.classList.remove('kicking'); // make sure the run buttons are showing
  document.body.classList.add('returning');  // hide the pass/HIKE buttons — you only run a return

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

// Drive the returner (movement only — no passing on a kickoff). Swipe-dash works here too.
function controlReturner() {
  const p = G.ballCarrier.s;
  const dash = dashVelocity();
  if (dash) {
    p.setVelocity(dash.vx, dash.vy);
    p.setRotation(Math.atan2(dash.vy, dash.vx) + Math.PI / 2);
    return;
  }
  const spd = runSpeed();   // your shop cleats work on returns too!
  let vx = 0, vy = 0;
  if (keys.left.isDown || touch.left) vx = -spd;
  else if (keys.right.isDown || touch.right) vx = spd;
  if (keys.up.isDown || touch.up) vy = -spd;
  else if (keys.down.isDown || touch.down) vy = spd;
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
    steer(d.s, c.x, c.y, diff().koCover);   // coverage speed depends on difficulty
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
  advanceClock(TIME_KICKOFF);   // the kickoff + return took a few seconds
  const spot = Phaser.Math.Clamp(Math.round(yardsFromOwnGoal(G.ballCarrier.s.y)), 1, 99);
  G.next = { los: spot, down: 1, fd: Math.min(spot + 10, 100) };  // no 'fresh' → a normal drive next
  G.state = 'dead';
  G.deadUntil = G.scene.time.now + 1400;
  showBanner('NICE RETURN!', false);
}

// ============================================================
// INSTANT REPLAY — watch the touchdown again in slow motion
// ------------------------------------------------------------
// During a play we snap a "photo" of the whole field every frame and keep the
// last ~2.5 seconds of them (a little film reel, G.replay). When you score, we
// roll that film back slowly with black movie bars and a spotlight on the ball
// carrier — then the game continues to the extra-point kick.
// ============================================================

// Snap one photo of the field: where every player + the ball is right now,
// and which offense player is carrying it (so the spotlight follows him).
function recordReplayFrame() {
  G.replay.push({
    o: offense.map(p => ({ x: p.s.x, y: p.s.y, r: p.s.rotation, vis: p.s.visible })),
    d: defense.map(p => ({ x: p.s.x, y: p.s.y, r: p.s.rotation, vis: p.s.visible })),
    bx: ball.x, by: ball.y,
    ci: offense.indexOf(G.ballCarrier),   // carrier's index in offense (-1 if none)
  });
  if (G.replay.length > REPLAY_FRAMES) G.replay.shift();   // only keep the recent film
}

// Start rolling the film. Freeze the game, add the movie bars + spotlight,
// and let updateReplay() play it out frame by frame.
function startReplay() {
  G.state = 'replay';
  G.replayIdx = 0;
  G.replayHoldUntil = 0;
  if (G.banner) { G.banner.destroy(); G.banner = null; }   // clear the "TOUCHDOWN!" banner first
  freezeEveryone();
  ballFollow = false;                       // we place the ball by hand during the film
  G.scene.cameras.main.stopFollow();
  touch.snap = false;                       // clear any stray tap so it doesn't skip instantly
  buildReplayOverlay();
}

// Build the on-screen replay decorations (bars, title, hint, spotlight ring).
function buildReplayOverlay() {
  const s = G.scene;
  // Cinematic black bars pinned to the top & bottom of the screen (540x720).
  const bars = s.add.graphics().setScrollFactor(0).setDepth(40);
  bars.fillStyle(0x000000, 0.82);
  bars.fillRect(0, 0, 540, 64);
  bars.fillRect(0, 720 - 64, 540, 64);
  G.replayBars = bars;

  G.replayText = s.add.text(270, 32, '📺  INSTANT REPLAY', {
    fontFamily: 'Arial Black, Arial', fontSize: '26px',
    color: '#ffe066', stroke: '#000', strokeThickness: 5
  }).setOrigin(0.5).setScrollFactor(0).setDepth(42);
  s.tweens.add({ targets: G.replayText, alpha: 0.25, duration: 500, yoyo: true, repeat: -1 });

  G.replayHint = s.add.text(270, 720 - 32, 'tap ▶ to skip', {
    fontFamily: 'Arial Black, Arial', fontSize: '14px',
    color: '#ffffff', stroke: '#000', strokeThickness: 3
  }).setOrigin(0.5).setScrollFactor(0).setDepth(42);

  // A glowing ring that sits UNDER the ball carrier (depth 4 = below players).
  const ring = s.add.graphics().setDepth(4);
  ring.lineStyle(4, 0xffe066, 0.9);
  ring.strokeCircle(0, 0, 26);
  ring.fillStyle(0xffe066, 0.15);
  ring.fillCircle(0, 0, 26);
  G.replayRing = ring;
}

// Play the film: advance slowly, move everyone to their filmed spots, and
// follow the action. A tap / SPACE skips to the end.
function updateReplay() {
  const frames = G.replay;
  if (!frames.length) { endReplay(); return; }

  // Let the player skip the replay (HIKE button or SPACE — a field tap is handled separately).
  if (consume('snap') || Phaser.Input.Keyboard.JustDown(keys.snap)) { skipReplay(); return; }

  if (G.replayIdx >= frames.length - 1) {
    // Reached the end — hold on the final frame a beat, then finish.
    applyReplayFrame(frames[frames.length - 1]);
    if (!G.replayHoldUntil) G.replayHoldUntil = G.scene.time.now + 700;
    else if (G.scene.time.now >= G.replayHoldUntil) endReplay();
    return;
  }

  applyReplayFrame(frames[Math.floor(G.replayIdx)]);
  G.replayIdx += REPLAY_PLAY_SPEED;         // < 1 frame per tick = slow motion
}

// Move every player + the ball to where they were in this filmed frame.
function applyReplayFrame(f) {
  for (let i = 0; i < offense.length; i++) {
    const p = offense[i], fo = f.o[i];
    p.s.setPosition(fo.x, fo.y).setRotation(fo.r).setVisible(fo.vis);
    if (p.label) p.label.setPosition(fo.x, fo.y);
  }
  for (let i = 0; i < defense.length; i++) {
    const p = defense[i], fd = f.d[i];
    p.s.setPosition(fd.x, fd.y).setRotation(fd.r).setVisible(fd.vis);
    if (p.label) p.label.setPosition(fd.x, fd.y);
  }
  ball.setPosition(f.bx, f.by);

  // Spotlight the ball carrier (fall back to the ball if there isn't one).
  const c = (f.ci >= 0 && f.o[f.ci]) ? f.o[f.ci] : { x: f.bx, y: f.by };
  G.replayRing.setPosition(c.x, c.y);

  G.scene.cameras.main.centerOn(f.bx, f.by);
}

// Skip the replay right now (a tap anywhere, the HIKE button, or SPACE).
function skipReplay() {
  if (G.state === 'replay') endReplay();
}

// The film is over — clean up the decorations and go on to the extra point.
function endReplay() {
  for (const k of ['replayBars', 'replayText', 'replayHint', 'replayRing']) {
    if (G[k]) { G[k].destroy(); G[k] = null; }
  }
  G.replayHoldUntil = 0;
  // Pick up exactly where the touchdown left off: kick the extra point.
  if (G.pendingXP) startExtraPoint();
  else startNextPlay();
}

// ============================================================
// SETTING UP A PLAY — line all 14 players up at the LOS
// ============================================================
function startNextPlay() {
  // This is a dead-ball boundary: settle the game clock / quarter first.
  // Sudden death — a lead in overtime ends the game right here.
  if (G.overtime && G.score !== G.oppScore) { endGame(); return; }
  const t = tickPeriodAtBoundary();
  if (t === 'gameover') { endGame(); return; }

  if (t === 'halftime') {
    // REAL NFL RULES at the half: you fielded the game-opening kickoff, so the
    // OTHER team gets the ball to start the second half — and a drive never
    // carries across halftime (whatever you had going is over).
    startBreak('half', startCpuDrive);
    return;
  }
  if (t === 'qbreak') {
    // Between Q1/Q2 and Q3/Q4 the game takes a breather, then picks up EXACTLY
    // where it left off — a drive DOES carry over inside a half (real rules).
    startBreak('q', () => {
      if (G.next && G.next.fresh) startCpuDrive();
      else { document.body.classList.remove('kicking'); setupPlay(G.next); }
    });
    return;
  }

  // A possession change (fresh) hands the ball to the COMPUTER now — its drive
  // plays out (and can score) before you get the ball back. Otherwise this same
  // drive of yours simply continues to the next down.
  if (G.next && G.next.fresh) startCpuDrive();
  else setupPlay(G.next);
}

function setupPlay(next) {
  // Bring everyone back onto the field (a kickoff return hides all but the returner).
  for (const o of offense) { o.s.setVisible(true); if (o.label) o.label.setVisible(true); o.trail = []; }
  for (const d of defense) { d.s.setVisible(true); if (d.label) d.label.setVisible(true); }
  if (routeGfx) routeGfx.clear();   // wipe last play's route lines
  if (referee) referee.setVisible(true);
  document.body.classList.remove('returning');  // the return is over — bring the pass/HIKE buttons back

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
  drawRoutePreview();   // show where the receivers will run, BEFORE the snap

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

  // Difficulty picker on the menu (Easy / Medium / Hard)
  bindTapEl('diff-easy',   () => setDifficulty('easy'));
  bindTapEl('diff-medium', () => setDifficulty('medium'));
  bindTapEl('diff-hard',   () => setDifficulty('hard'));

  // Tap-to-pass: a tap on the field (not on a button) throws to the receiver
  // nearest your finger — but only when the QB can pass. We listen for a DOM
  // pointerdown on the game canvas, the same dependable way the kick screen
  // reads taps on the iPad. Taps on the D-pad / action buttons hit those
  // elements instead, so they never trigger a throw.
  const gameCanvas = window.game && window.game.canvas;
  if (gameCanvas) {
    let swipeStart = null;
    gameCanvas.addEventListener('pointerdown', e => {
      if (G.state === 'gameover') { returnToMenuFromGameOver(); return; }  // tap the final screen to play again
      if (G.state === 'qbreak') { endBreak(); return; }     // tap ends the quarter break / halftime
      if (G.state === 'replay') { skipReplay(); return; }   // tap the field to skip the instant replay
      if (canPass()) {                                       // behind the line: a tap throws to a receiver
        const w = canvasTapToWorld(e.clientX, e.clientY);
        passToNearest(w.x, w.y);
        return;
      }
      swipeStart = { x: e.clientX, y: e.clientY };           // else start tracking a swipe (dash / cut)
    });
    gameCanvas.addEventListener('pointerup', e => {
      if (!swipeStart) return;
      const dx = e.clientX - swipeStart.x, dy = e.clientY - swipeStart.y;
      swipeStart = null;
      if (!isRunning()) return;                              // swiping only dashes while you're running the ball
      const frac = Math.hypot(dx, dy) / (gameCanvas.getBoundingClientRect().height || 720);
      if (frac < SWIPE_MIN_FRAC) return;                     // too small = just a tap, not a swipe
      applySwipeRun(dx, dy, frac);
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
  const o = { s, role, num: opts.num, route: opts.route, cover: opts.cover, startY: 0, label: null, trail: [] };
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
  // The game clock + quarter, tucked in the top-right corner.
  hud.clock = scene.add.text(528, 10, '', hudStyle(17, '#ffe066'))
    .setOrigin(1, 0).setScrollFactor(0).setDepth(20);
  hud.help  = scene.add.text(270, 700, '', hudStyle(13, '#ffffff'))
    .setOrigin(0.5).setScrollFactor(0).setDepth(20);
}

function updateHUD() {
  // Keep number labels glued to their players
  for (const o of offense) if (o.label) o.label.setPosition(o.s.x, o.s.y);
  for (const d of defense) if (d.label) d.label.setPosition(d.s.x, d.s.y);

  // Gray out the HAND button when you're too far from the RB to hand off.
  const handBtn = document.getElementById('btn-hand');
  if (handBtn) handBtn.classList.toggle('off', !canHandOff());

  // Float the "P2" tag over Player 2's defender (only in 2-player mode)
  if (G.p2Label) {
    if (G.twoPlayer && G.p2Defender) {
      G.p2Label.setVisible(true).setPosition(G.p2Defender.s.x, G.p2Defender.s.y - 22);
    } else {
      G.p2Label.setVisible(false);
    }
  }

  // Scoreboard now shows BOTH teams' points — yours and the computer's.
  hud.score.setText(G.team
    ? `${G.team.abbr} ${G.score}  —  ${G.oppTeam.abbr} ${G.oppScore}`
    : 'SCORE: ' + G.score);

  // The game clock + quarter (Q2 · 3:45), top-right.
  if (hud.clock) hud.clock.setText(G.team ? `${quarterLabel()} · ${formatClock(G.clock)}` : '');

  // ⭐ While YOU play defense: show THEIR down & distance, and float the
  // YOU tag over your defender so you never lose yourself in the pile.
  const onDefense = (G.state === 'dpresnap' || G.state === 'dlive'
                  || G.state === 'dpass' || G.state === 'ddead' || G.state === 'dwait');
  if (G.youLabel) {
    G.youLabel.setVisible(onDefense);
    if (onDefense) {
      G.youLabel.setPosition(offense[0].s.x, offense[0].s.y - 22);
      if (G.p2Label) G.p2Label.setVisible(false);   // P2 sits out the defense phase (for now)
    }
  }
  if (onDefense) {
    if (G.cpu) {
      const toGo = (G.cpu.spot + G.cpu.togo >= 100) ? 'GOAL' : Math.max(1, Math.round(G.cpu.togo));
      hud.down.setText(`${G.oppTeam.abbr} ${ordinal(G.cpu.down)} & ${toGo}`);
      hud.spot.setText(G.cpu.spot <= 50
        ? `They're on their ${Math.round(G.cpu.spot)}`
        : `They're on YOUR ${Math.round(100 - G.cpu.spot)}!`);
    }
    hud.help.setText('PLAY DEFENSE!  Tackle whoever has the ball');
    return;
  }

  // On a kickoff there's no down & distance yet — show return info instead.
  if (G.state === 'kickoff') {
    hud.down.setText('KICKOFF');
    hud.spot.setText('Catch it and run it back!');
    hud.help.setText(G.koLive ? 'RUN IT BACK! ⬆  ·  swipe = DASH' : 'Here comes the kick…');
    return;
  }

  const toGo = G.firstDownYards - G.losYards;
  const distTxt = (G.firstDownYards >= 100) ? 'GOAL' : String(Math.max(0, Math.round(toGo)));
  hud.down.setText(`${ordinal(G.down)} & ${distTxt}`);
  hud.spot.setText('Ball on the ' + describeSpot(G.losYards));

  if (G.state === 'presnap') {
    hud.help.setText('Press SPACE to hike the ball');
  } else if (G.state === 'live' && canPass() && G.ballCarrier !== offense[0]) {
    // The RB (or a receiver) has it behind the line — the trick play is ON.
    hud.help.setText('TRICK PLAY! TAP a receiver to throw — or just run it!');
  } else if (G.state === 'live' && G.ballCarrier === offense[0] && !G.hasPassed) {
    hud.help.setText('TAP a receiver to throw (or 1/2/3)   ·   H hand off   ·   arrows = scramble');
  } else if (G.state === 'live') {
    hud.help.setText('Run to the endzone!  ·  swipe the field = DASH / cut');
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

// Pick a random item from a list (used for the announcer's lines).
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// The "announcer": pop a quick play-by-play call-out, then fade it out.
function sayComment(text) {
  if (!G.comment) return;
  if (G.commentTween) G.commentTween.stop();
  G.comment.setText(text).setVisible(true).setAlpha(0).setScale(0.7);
  G.commentTween = G.scene.tweens.add({
    targets: G.comment, alpha: 1, scale: 1, duration: 180, ease: 'Back.Out',
    yoyo: true, hold: 850,
    onComplete: () => { if (G.comment) G.comment.setVisible(false); }
  });
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
