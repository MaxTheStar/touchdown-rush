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
// Two greens for the "mowed grass" stripes — a real field has light and dark
// bands where the mower drove up and down. A touch richer than before.
const GRASS_DARK = 0x246b26;
const GRASS_LIGHT = 0x2f8a33;

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
const BAD_THROW_CHANCE = 0.12; // the QB sometimes slips and sails one into open space
const LOOSE_BALL_DIST  = 34;   // this close to a bad throw's landing = you can make a play on it

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

// ============================================================
// ⭐ TEAM RATINGS (v1.9) — every team gets an OFFENSE and a DEFENSE score out
// of 10, so each one is better at a specific thing (Seattle's a defense team,
// New England leans offense, Kansas City is an offense monster, etc). The menu
// shows the stars, and the numbers give the opponent a gentle strength tilt so
// a great team really does play a little tougher.
// ============================================================
const TEAM_RATINGS = {
  SEA: { off: 6,  def: 9 },  PIT: { off: 6,  def: 8 },  BUF: { off: 9,  def: 8 },
  MIA: { off: 8,  def: 6 },  NE:  { off: 8,  def: 6 },  NYJ: { off: 5,  def: 8 },
  BAL: { off: 9,  def: 7 },  CIN: { off: 8,  def: 5 },  CLE: { off: 6,  def: 8 },
  HOU: { off: 7,  def: 7 },  IND: { off: 7,  def: 6 },  JAX: { off: 6,  def: 5 },
  TEN: { off: 6,  def: 7 },  DEN: { off: 6,  def: 8 },  KC:  { off: 10, def: 7 },
  LV:  { off: 7,  def: 5 },  LAC: { off: 8,  def: 6 },  DAL: { off: 8,  def: 7 },
  NYG: { off: 5,  def: 7 },  PHI: { off: 9,  def: 8 },  WAS: { off: 6,  def: 7 },
  CHI: { off: 5,  def: 8 },  DET: { off: 9,  def: 6 },  GB:  { off: 8,  def: 6 },
  MIN: { off: 8,  def: 7 },  ATL: { off: 7,  def: 5 },  CAR: { off: 5,  def: 6 },
  NO:  { off: 7,  def: 6 },  TB:  { off: 7,  def: 8 },  ARI: { off: 6,  def: 5 },
  LAR: { off: 7,  def: 8 },  SF:  { off: 8,  def: 9 },
};

// Look up a team's ratings (defaults to a balanced 5/5 for the unlockable
// uniforms, which aren't real NFL teams). overall = the average, out of 10.
function teamRating(team) {
  const r = (team && TEAM_RATINGS[team.abbr]) || { off: 5, def: 5 };
  const overall = Math.round((r.off + r.def) / 2);
  const specialty = r.off > r.def ? 'OFFENSE' : r.def > r.off ? 'DEFENSE' : 'BALANCED';
  return { off: r.off, def: r.def, overall, specialty };
}

// Draw a 0–10 rating as filled/empty stars for the menu, e.g. ★★★★★★★☆☆☆.
function stars10(n) {
  n = Phaser.Math.Clamp(Math.round(n), 0, 10);
  return '★'.repeat(n) + '☆'.repeat(10 - n);
}

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
  seasonGame: false,    // 🏆 true while playing a Season game (see beginGame / season.js)
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

  // ---- 🧠 Smart football brains (v1.6): a play-caller for each down ----
  concept: null,        // the offense's play this down (which route each receiver runs)
  lastConcept: -1,      // don't call the exact same concept two downs in a row
  coverage: 'man',      // how the CPU covers this down: 'man' (tight) or 'zone' (soft)
  blitz: false,         // is a linebacker shooting the gap at the QB this down?
  passTarget: null,     // where a thrown ball is headed — defenders break on it

  // ---- v1.8 (in progress): timeouts, formations, and 👑 Maxwell ----
  timeouts: 3,          // YOUR timeouts left this half (3 per half, like real football)
  clockStopped: false,  // a called timeout stops the clock for the very next play
  formation: 0,         // which offensive FORMATION you're lined up in (index into FORMATIONS)
  maxwell: false,       // 👑 is the superstar defender "MAXWELL" switched on for this game?
  starLabel: null,      // the floating "MAXWELL 👑" nametag over the superstar defender

  // ---- v1.9: team-rating strength tilt (all default to 1 = neutral) ----
  myOff: 1, myDef: 1,   // YOUR team's offense/defense multipliers (from teamRating)
  oppOff: 1, oppDef: 1, // the opponent's offense/defense multipliers

  // ---- v1.9: turnovers & control ----
  turnoverSpotCpu: null, // where a turnover puts the ball for a NEW CPU drive (their yards)
  turnoverSpotYou: null, // where a turnover puts the ball for a NEW drive of yours (your yards)
  myDefender: null,      // the defender YOU control right now (closest to the ball, on defense)
  pickSix: false,        // true while you're running back an interception

  // ---- v1.7: smart routes for the CPU OFFENSE (when you play defense) ----
  redConcept: null,     // the CPU offense's play this down (which route each red receiver runs)
  lastRedConcept: -1,   // don't call the CPU's exact concept two downs in a row
  dcoverage: 'man',     // how YOUR AI teammates cover this down: 'man' (tight) or 'zone' (soft)
  dpassTarget: null,    // where the CPU's throw is headed — your defenders break on it

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
let shadowGfx;     // soft ground shadows under every player + the ball (the "3D pop")
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

  // Soft ground shadows: a dark oval painted under every player + the ball,
  // one frame at a time (see drawShadows). It's what makes the little figures
  // look like they're STANDING ON the grass instead of pasted flat on it — the
  // single biggest trick for a 3D feel. Sits just above the field, under everyone.
  shadowGfx = this.add.graphics().setDepth(2);

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

  // 👑 The gold "MAXWELL" tag that floats over the superstar defender, when he's on.
  G.starLabel = this.add.text(0, 0, 'MAXWELL 👑', {
    fontFamily: 'Arial Black, Arial', fontSize: '11px',
    color: '#ffd60a', stroke: '#000', strokeThickness: 4
  }).setOrigin(0.5).setDepth(8).setVisible(false);

  // Camera & world
  this.physics.world.setBounds(0, 0, FIELD_WIDTH, FIELD_LENGTH);
  this.cameras.main.setBounds(0, 0, FIELD_WIDTH, FIELD_LENGTH);

  buildHUD(this);

  // Put the field in your saved view (3D tilt or flat 2D). It's suppressed on the
  // team menu by the CSS, so it "clicks in" the moment the first drive starts.
  applyView(currentView());

  // Show the CHOOSE YOUR TEAM menu first. When you tap PLAY (startGameWithTeam)
  // it paints your colors on and kicks off the first drive at your own 20.
  buildTeamMenu(this);
  enterMenu();

  // Remember the 👑 Maxwell toggle. (The old wall-of-text HOW TO card is gone —
  // a brand-new player now gets the step-by-step TDTour, kicked off by enterMenu.)
  loadMaxwell();

  // Debug handle — lets you peek at the game from the browser console.
  // Try typing  __td.G.score  or  __td.G.state  in DevTools.
  window.__td = { G, offense, defense, keys, touch, touch2, snap, throwTo, handOff, endPlay, setupPlay, toggleTwoPlayer, controlBallCarrier, controlP2Defender, fumble, resolveFumble, chooseFourthDown, startKick, startExtraPoint, onKickDone, showFourthDownChoice, inFieldGoalRange, fieldGoalDistance, NFL_TEAMS, enterMenu, menuNav, startGameWithTeam, startKickoff, endKickoffReturn, controlReturner, updateKickoffCoverage, canPass, passToNearest, canvasTapToWorld, recordReplayFrame, callPlay, PLAYBOOK, callTimeout, cycleFormation, toggleMaxwell, FORMATIONS, layoutSkill, startReplay, updateReplay, endReplay, resolvePass, canHandOff, setDifficulty, diff, updateRouteTrails, drawRoutePreview, sayComment, skipReplay, isRunning, applySwipeRun, dashVelocity, advanceClock, tickPeriodAtBoundary, startCpuDrive, setupDefensePlay, redSnap, redThrow, redPlayEnd, defenseNextPlay, updateDefensePlay, callRedPlay, redRouteVelocity, updateRedTeam, updateBlueTeammates, startPickSix, takeYourBall, catchAndRun, pickMyDefender, controlYourDefender, teamRating, stars10, resolveRedPass, resolveFumble, cpuDriveEnd, finishCpuDrive, endGame, returnToMenuFromGameOver, startNextPlay, startBreak, endBreak };
}

// ============================================================
// UPDATE — the heartbeat, ~60x per second
// ============================================================
function update(time, delta) {
  // Repaint the ground shadows first thing, every frame, so they follow the
  // players no matter what the game is doing (many states below "return" early).
  drawShadows();

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
    if (window.TDTour && TDTour.active()) G.dsnapAt = time + 1100;   // hold the snap during the tutorial
    else if (time >= G.dsnapAt) redSnap(time);
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
  // Read out what the defense is doing — a blitz is always called (fair
  // warning!), and the coverage is called out some of the time so you learn it.
  if (G.blitz) sayComment(pick(['BLITZ!!', "They're coming!", 'Pressure!']));
  else if (Math.random() < 0.5) sayComment(pick(['Hut, hut!', 'Here we go!', 'The snap!']));
  else if (Math.random() < 0.55) sayComment(G.coverage === 'zone'
             ? pick(['Zone coverage!', "They're in zone!"])
             : pick(['Man to man!', 'Press coverage!']));
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
  let targetX = Phaser.Math.Clamp(wr.s.x + wr.s.body.velocity.x * flight, 10, FIELD_WIDTH - 10);
  let targetY = wr.s.y + wr.s.body.velocity.y * flight;

  // 🎲 Sometimes the QB slips and throws a bad one — it sails off into open
  // space, where anyone nearby (a defender OR another receiver) can grab it.
  if (Math.random() < BAD_THROW_CHANCE) {
    targetX = Phaser.Math.Clamp(targetX + Phaser.Math.Between(-95, 95), 10, FIELD_WIDTH - 10);
    targetY = targetY + Phaser.Math.Between(-80, 80);
    sayComment(pick(['Bad throw!', 'Off the mark!', 'That one sailed!', 'Wobbly pass!']));
  }
  G.passTarget = { x: targetX, y: targetY };   // 🧠 defenders break on this spot

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
  G.passTarget = null;   // the ball has arrived — stop the break-on-the-ball chase
  // Where the receiver ACTUALLY is when the ball arrives (he kept running).
  const wx = wr.s.x, wy = wr.s.y;

  // If the ball landed nowhere near the intended receiver, it was a BAD THROW
  // into open space — now it's a scramble. Whoever is closest to where it comes
  // down can make a play on it (a defender picks it, or another receiver grabs it).
  if (Phaser.Math.Distance.Between(x, y, wx, wy) > OVERTHROW_DIST) {
    let nd = Infinity, ndef = null;
    for (const d of defense) {
      const dd = Phaser.Math.Distance.Between(d.s.x, d.s.y, x, y);
      if (dd < nd) { nd = dd; ndef = d; }
    }
    if (nd < LOOSE_BALL_DIST) {   // a defender jumps the bad throw = INTERCEPTION
      G.turnoverSpotCpu = Phaser.Math.Clamp(Math.round(100 - yardsFromOwnGoal(y)), 1, 99);
      endPlay('interception', 'PICKED OFF!');
      return;
    }
    let nw = Infinity, nwr = null;   // one of YOUR receivers might adjust and haul it in
    for (const o of offense) {
      if (o.role !== 'WR' && o.role !== 'RB') continue;
      const dd = Phaser.Math.Distance.Between(o.s.x, o.s.y, x, y);
      if (dd < nw) { nw = dd; nwr = o; }
    }
    if (nwr && nw < LOOSE_BALL_DIST) { catchAndRun(nwr, x, y, pick(['Caught it anyway!', 'What a grab!'])); return; }
    endPlay('incomplete', 'OVERTHROWN!');
    return;
  }

  // Who is closest to the RECEIVER when the ball arrives?
  let nearestDef = Infinity, nearestD = null;
  for (const d of defense) {
    const dd = Phaser.Math.Distance.Between(d.s.x, d.s.y, wx, wy);
    if (dd < nearestDef) { nearestDef = dd; nearestD = d; }
  }
  const starThere = G.maxwell && nearestD === defense[6];   // 👑 is it Maxwell in coverage?

  // A defender is right there — he either intercepts it or knocks it away.
  // Maxwell contests from a hair farther and picks it off a lot more often.
  if (nearestDef < (starThere ? CATCH_CONTEST + 6 : CATCH_CONTEST)) {
    const intChance = starThere ? Math.min(0.75, INT_CHANCE + 0.25) : INT_CHANCE;
    if (Math.random() < intChance) {
      G.turnoverSpotCpu = Phaser.Math.Clamp(Math.round(100 - yardsFromOwnGoal(wy)), 1, 99);
      endPlay('interception');
    } else endPlay('incomplete', 'BROKEN UP!');
    return;
  }

  // Wide open — but receivers aren't perfect. They can miss it...
  // (🧤 STICKY GLOVES from the shop tilt both chances your way.)
  const gl = window.TDShop ? TDShop.gloveBoost() : { catchBonus: 0, dropCut: 0 };
  if (Math.random() > CATCH_CHANCE + gl.catchBonus) { endPlay('incomplete', 'INCOMPLETE'); return; }
  // ...or catch it and drop it.
  if (Math.random() < DROP_CHANCE - gl.dropCut)  { endPlay('incomplete', 'DROPPED IT!'); return; }

  // Clean catch! You now control this receiver.
  catchAndRun(wr, wx, wy, nearestDef > 120 ? pick(['WIDE OPEN!', 'ALL ALONE!', 'Nobody there!'])
                                           : pick(['Nice grab!', 'Caught it!', 'Reception!', 'What a catch!']));
}

// Put the ball in a receiver's hands and hand YOU the controls — shared by a
// clean catch and an "caught the bad throw in open space" grab.
function catchAndRun(wr, x, y, msg) {
  ball.setPosition(x, y);
  G.ballCarrier = wr;
  G.state = 'live';
  ballFollow = true;
  G.scene.cameras.main.startFollow(wr.s, true, 0.12, 0.12);
  // 🔋 CATCH ENERGY (shop): a clean catch fires a burst of speed!
  const boostMs = window.TDShop ? TDShop.energyMs() : 0;
  if (boostMs) { G.boostUntil = G.scene.time.now + boostMs; sayComment(pick(['🔋 CATCH ENERGY!', '🔋 Boost ON!'])); }
  else sayComment(msg);
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
function canvasTapToWorld(e) {
  const cam = G.scene.cameras.main;
  const canvas = G.scene.sys.game.canvas;
  // offsetX/offsetY are where you tapped INSIDE the canvas, in the canvas's own
  // coordinate space. The browser works those out AFTER undoing any CSS transform
  // — including our 3D tilt — so a tap lands on the right receiver whether the
  // field is flat (2D) or leaning back (3D). (The old code used the on-screen
  // bounding box, which the tilt would have skewed.) If a browser somehow doesn't
  // give us offsets, fall back to the bounding-box math.
  let fx, fy;
  if (typeof e.offsetX === 'number' && canvas.offsetWidth) {
    fx = e.offsetX / canvas.offsetWidth  * 540;   // 540 = game width
    fy = e.offsetY / canvas.offsetHeight * 720;   // 720 = game height
  } else {
    const rect = canvas.getBoundingClientRect();
    fx = (e.clientX - rect.left) / rect.width  * 540;
    fy = (e.clientY - rect.top)  / rect.height * 720;
  }
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
// ============================================================
// 🧠 SMART FOOTBALL BRAINS (v1.6) — the play-caller
// ------------------------------------------------------------
// Instead of running the SAME three routes every down, each play we pull a
// "concept" out of this little playbook: a short option, a medium option and a
// deep option that work together (just like a real offense). Then the defense
// decides how to cover it — tight MAN (beat your guy) or a soft ZONE (find the
// open window) — and might send a blitz. Higher difficulty = more zone, more
// blitz, and defenders that break harder on the ball.
// ============================================================
const PLAYBOOK = [
  { name: 'Slants',    wr1: 'slant',  wr2: 'slant',  rb: 'swing' },
  { name: 'Verticals', wr1: 'streak', wr2: 'streak', rb: 'wheel' },
  { name: 'Smash',     wr1: 'curl',   wr2: 'corner', rb: 'flat'  },
  { name: 'Mesh',      wr1: 'drag',   wr2: 'drag',   rb: 'swing' },
  { name: 'Out & up',  wr1: 'out',    wr2: 'corner', rb: 'flat'  },
  { name: 'Dig-post',  wr1: 'in',     wr2: 'post',   rb: 'swing' },
  { name: 'Flood',     wr1: 'curl',   wr2: 'out',    rb: 'wheel' },
  { name: 'Classic',   wr1: 'slant',  wr2: 'streak', rb: 'swing' },
];

// Call the next play: give each receiver a route, and let the defense pick its
// coverage + whether to blitz. Runs once per down, in setupPlay.
function callPlay() {
  let i = Phaser.Math.Between(0, PLAYBOOK.length - 1);
  if (i === G.lastConcept) i = (i + 1) % PLAYBOOK.length;   // never repeat back-to-back
  G.lastConcept = i;
  const c = PLAYBOOK[i];
  G.concept = c;
  offense[2].route = c.wr1;   // WR #1 (lines up left)
  offense[3].route = c.wr2;   // WR #2 (lines up right)
  offense[1].route = c.rb;    // RB (#3)

  // The defense reads its plan for the down. Easy = mostly tight man, no blitz.
  // Hard = more zone and more pressure.
  const d = G.difficulty;
  const zoneOdds  = d === 'easy' ? 0.15 : d === 'hard' ? 0.55 : 0.42;
  const blitzOdds = d === 'easy' ? 0.0  : d === 'hard' ? 0.30 : 0.15;
  G.coverage = Math.random() < zoneOdds ? 'zone' : 'man';
  G.blitz    = Math.random() < blitzOdds;
  G.passTarget = null;
}

// -1 = this receiver lined up on the LEFT, +1 = on the RIGHT. We read his
// SNAP spot (startX), not where he is now, so a crossing route doesn't flip
// direction when it passes midfield.
function sideOf(o) {
  const x = (o.startX != null) ? o.startX : o.s.x;
  return x < FIELD_WIDTH / 2 ? -1 : 1;
}

// The velocity for a receiver's route this frame, given how far he's run
// (depth) and which side he started on. "IN" points toward the middle, "OUT"
// toward his own sideline — so one route definition mirrors left and right.
function routeVelocity(o, depth, side) {
  const S = WR_SPEED, IN = -side, OUT = side;
  switch (o.route) {
    case 'slant':    return depth < 52  ? { vx: 0, vy: -S } : { vx: IN  * S * 0.70, vy: -S * 0.62 };
    case 'out':      return depth < 96  ? { vx: 0, vy: -S } : { vx: OUT * S * 0.78, vy: -S * 0.32 };
    case 'in':       return depth < 104 ? { vx: 0, vy: -S } : { vx: IN  * S * 0.78, vy: -S * 0.30 };
    case 'corner':   return depth < 92  ? { vx: 0, vy: -S } : { vx: OUT * S * 0.55, vy: -S * 0.78 };
    case 'post':     return depth < 92  ? { vx: 0, vy: -S } : { vx: IN  * S * 0.55, vy: -S * 0.78 };
    case 'curl':     return depth < 118 ? { vx: 0, vy: -S } : { vx: IN  * S * 0.18, vy:  S * 0.42 };
    case 'comeback': return depth < 150 ? { vx: 0, vy: -S } : { vx: OUT * S * 0.28, vy:  S * 0.36 };
    case 'drag':     return { vx: IN * S * 0.90, vy: -S * 0.22 };                    // shallow cross
    case 'wheel':    return depth < 26  ? { vx: S * 0.90, vy: -S * 0.16 } : { vx: S * 0.14, vy: -S * 0.95 };
    case 'flat':     return { vx: S * 0.82, vy: -S * 0.16 };                         // RB checkdown
    case 'swing':    return depth < 20  ? { vx: S * 0.85, vy: -S * 0.20 } : { vx: S * 0.25, vy: -S * 0.90 };
    default:         return { vx: 0, vy: -S };                                        // 'streak'
  }
}

function updateReceivers(elapsed) {
  for (const o of offense) {
    if (o.role !== 'WR' && o.role !== 'RB') continue;
    if (o === G.ballCarrier) continue; // once caught / handed the ball, the player drives

    const depth = o.startY - o.s.y; // yards upfield since the snap
    const side = sideOf(o);
    let { vx, vy } = routeVelocity(o, depth, side);

    // 🧠 WORK OPEN — if a defender is crowding him, the receiver slides toward
    // the open grass (away from that defender) to shake free. Just a nudge, so
    // the route still looks like a route. WRs only, and only past the stem.
    if (o.role === 'WR' && depth > 44) {
      let nearX = null, nd = Infinity;
      for (const d of defense) {
        const dd = Phaser.Math.Distance.Between(o.s.x, o.s.y, d.s.x, d.s.y);
        if (dd < nd) { nd = dd; nearX = d.s.x; }
      }
      if (nearX != null && nd < 40) vx += (o.s.x < nearX ? -1 : 1) * WR_SPEED * 0.28;
    }

    // Don't run off the field or into the endzone wall
    if (o.s.x < 12 && vx < 0) vx = 0;
    if (o.s.x > FIELD_WIDTH - 12 && vx > 0) vx = 0;
    if (o.s.y <= ENDZONE + 8) vy = 0;

    o.s.setVelocity(vx * G.myOff, vy * G.myOff);   // ⭐ your team's offense rating
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

// A simple sketch of where each route goes, from the receiver's pre-snap spot,
// so you can read the play and pick who to throw to before the snap.
function routePath(o) {
  const sx = o.s.x, sy = o.s.y, top = ENDZONE + 20;
  const side = sideOf(o), IN = -side, OUT = side;
  const clampX = x => Phaser.Math.Clamp(x, 12, FIELD_WIDTH - 12);
  const up = d => Math.max(top, sy - d);
  switch (o.route) {
    case 'slant':    return [{ x: sx, y: sy }, { x: sx, y: up(60)  }, { x: clampX(sx + IN  * 130), y: up(150) }];
    case 'out':      return [{ x: sx, y: sy }, { x: sx, y: up(100) }, { x: clampX(sx + OUT * 95),  y: up(135) }];
    case 'in':       return [{ x: sx, y: sy }, { x: sx, y: up(108) }, { x: clampX(sx + IN  * 150), y: up(150) }];
    case 'corner':   return [{ x: sx, y: sy }, { x: sx, y: up(95)  }, { x: clampX(sx + OUT * 110), y: up(230) }];
    case 'post':     return [{ x: sx, y: sy }, { x: sx, y: up(95)  }, { x: clampX(sx + IN  * 120), y: up(235) }];
    case 'curl':     return [{ x: sx, y: sy }, { x: sx, y: up(125) }, { x: clampX(sx + IN  * 20),  y: up(95)  }];
    case 'comeback': return [{ x: sx, y: sy }, { x: sx, y: up(160) }, { x: clampX(sx + OUT * 35),  y: up(120) }];
    case 'drag':     return [{ x: sx, y: sy }, { x: clampX(sx + IN * 180), y: up(45) }];
    case 'wheel':    return [{ x: sx, y: sy }, { x: clampX(sx + 90), y: up(20) }, { x: clampX(sx + 120), y: up(230) }];
    case 'flat':     return [{ x: sx, y: sy }, { x: clampX(sx + 95), y: up(18) }];
    case 'swing': {  const ox = clampX(sx + 90);
                     return [{ x: sx, y: sy }, { x: ox, y: up(20) }, { x: clampX(ox + 35), y: up(210) }]; }
    default:         return [{ x: sx, y: sy }, { x: sx, y: up(300) }];   // 'streak' = straight up
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
  const boost = diff().defBoost * G.oppDef;   // HARD mode + ⭐ the opponent's defense rating

  for (const d of defense) {
    // In 2-player mode, one defender is driven by Player 2's fingers (or WASD),
    // so we skip the computer's brain for him.
    if (G.twoPlayer && d === G.p2Defender) {
      controlP2Defender(d);
      continue;
    }

    let tx, ty, speed = DEF_SPEED * boost;
    const isStar = G.maxwell && d === defense[6];   // 👑 the superstar free safety

    if (!qbHasBall && G.state !== 'pass') {
      // Someone caught it (or is running it) — everyone hunts the ball, but at the
      // slower PURSUE_SPEED so a good runner can actually break away. (Maxwell,
      // the ballhawk, closes a touch faster than the rest.)
      tx = carrier.x; ty = carrier.y; speed = PURSUE_SPEED * boost * (isStar ? 1.12 : 1);
    } else if (isStar) {
      // 👑 MAXWELL roams the deep middle as a center-field robber: he hovers over
      // the top of your deepest receiver and reads the throw, ignoring man/zone.
      const deep = nearestThreatInBand(0, FIELD_WIDTH);
      tx = deep ? (deep.s.x + FIELD_WIDTH / 2) / 2 : FIELD_WIDTH / 2;
      ty = Math.min((deep ? deep.s.y : G.losY) - 28, G.losY - 118);
      speed = DEF_SPEED * boost * 1.06;
    } else if (d.role === 'DL') {
      // Linemen rush the quarterback...
      tx = offense[0].s.x; ty = offense[0].s.y;
      // ...unless an offensive lineman is blocking them. How slowed depends on
      // difficulty (easy = a strong pocket, hard = rushers push through faster).
      if (nearBlocker(d)) speed = DEF_SPEED * boost * diff().rushSlow;
    } else if (d.role === 'LB') {
      if (G.blitz && d === defense[2]) {
        // 🔥 BLITZ — this linebacker shoots the gap and chases the QB (and gets
        // slowed if a lineman picks him up, same as the down linemen).
        tx = offense[0].s.x; ty = offense[0].s.y;
        if (nearBlocker(d)) speed = DEF_SPEED * boost * diff().rushSlow;
      } else if (G.coverage === 'zone') {
        // Zone: sit in the short middle and jump the nearest crosser.
        const th = nearestThreatInBand(175, 358);
        tx = th ? th.s.x : (d === defense[2] ? 210 : 322);
        ty = G.losY - 55;
        speed = DEF_SPEED * boost * 0.85;
      } else {
        // Man/spy: shadow the QB in a short zone so the pocket holds; pursue
        // once the ball is thrown or handed off.
        tx = offense[0].s.x; ty = G.losY - 45;
        speed = DEF_SPEED * boost * 0.8;
      }
    } else { // DB
      if (G.coverage === 'zone') {
        // Zone: guard a deep third; slide toward the most dangerous receiver in
        // it (the one who's run the farthest upfield), else sit at your landmark.
        const z = dbZone(d);
        const th = nearestThreatInBand(z.lo, z.hi);
        tx = th ? th.s.x : z.homeX;
        ty = Math.min((th ? th.s.y : G.losY) - 26, G.losY - 92);
      } else {
        // Man: stay glued to your receiver, on the goal side (just above him).
        const wr = offense.find(o => (o.role === 'WR' || o.role === 'RB') && o.num === d.cover);
        if (wr) { tx = wr.s.x; ty = wr.s.y - 24; }
        else { tx = carrier.x; ty = carrier.y; }
      }
    }

    // 🧠 BREAK ON THE BALL — the instant a pass is in the air, any defender
    // near where it's headed drives hard to that spot to knock it down or pick
    // it. A wide-open throw still sails in; a covered one gets contested.
    if (G.state === 'pass' && G.passTarget && d.role !== 'DL') {
      const toBall = Phaser.Math.Distance.Between(d.s.x, d.s.y, G.passTarget.x, G.passTarget.y);
      // Maxwell has a superstar's range — he breaks on the ball from much farther.
      const reach = isStar ? 230 : G.difficulty === 'easy' ? 118 : G.difficulty === 'hard' ? 165 : 145;
      if (toBall < reach) {
        tx = G.passTarget.x; ty = G.passTarget.y;
        speed = DEF_SPEED * boost * (isStar ? 1.22 : G.difficulty === 'easy' ? 1.0 : 1.12);
      }
    }

    steer(d.s, tx, ty, speed);
  }
}

// The receiver (of yours) most threatening a zone: whoever is inside the x-band
// [loX..hiX] and has run the farthest upfield (smallest y). null = nobody there.
function nearestThreatInBand(loX, hiX) {
  let best = null, bestY = Infinity;
  for (const o of offense) {
    if (o.role !== 'WR' && o.role !== 'RB') continue;
    if (o === G.ballCarrier) continue;
    if (o.s.x < loX || o.s.x > hiX) continue;
    if (o.s.y < bestY) { bestY = o.s.y; best = o; }
  }
  return best;
}

// Which deep third a zone defender patrols — matched to who he'd cover in man
// (DB #1 = left, DB #2 = right, DB #3 = the middle).
function dbZone(d) {
  if (d.cover === 1) return { lo: 0,   hi: 205,         homeX: 120 };
  if (d.cover === 2) return { lo: 328, hi: FIELD_WIDTH, homeX: FIELD_WIDTH - 120 };
  return               { lo: 150, hi: 383,         homeX: FIELD_WIDTH / 2 };
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
    // The defense recovers — turnover! Their new drive starts right here.
    G.turnoverSpotCpu = Phaser.Math.Clamp(Math.round(100 - yardsFromOwnGoal(ball.y)), 1, 99);
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
  G.pickSix = false;                // a pick-six return that reached the endzone is done
  if (routeGfx) routeGfx.clear();   // the route lines vanish when the play ends
  let msg, next, big = false;

  // 🛑 SAFETY — you got tackled with the ball in your OWN end zone. That's 2
  // points for the other team, and you free-kick the ball back to them (so
  // they get the next possession — you'll be playing defense).
  if (result === 'tackle' && yardsFromOwnGoal(G.ballCarrier.s.y) <= 0) {
    G.oppScore += 2;
    if (window.TDSound) TDSound.sting('lose');
    sayComment(pick(['SAFETY!', 'Tackled in the end zone!', 'Two points, the other way!']));
    advanceClock(TIME_SCORE_PLAY);
    G.next = { los: 20, down: 1, fd: 30, fresh: true };   // free kick → they receive
    G.state = 'dead';
    G.deadUntil = G.scene.time.now + 1800;
    updateHUD();
    showBanner('SAFETY!  ' + (G.oppTeam ? G.oppTeam.abbr : 'DEF') + ' +2', true);
    return;
  }

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
  if (G.clockStopped) { G.clockStopped = false; return; }   // ⏱ a timeout froze the clock this play
  G.clock = Math.max(0, G.clock - sec);
}

// ⏱ Call a timeout — it stops the game clock for the very next play (so it
// doesn't burn any time). You get 3 per half, just like real football.
function callTimeout() {
  // Works whenever the ball's in play (your drive OR while you're on defense) —
  // that's when stopping the clock actually matters late in a game.
  const canCall = ['presnap', 'live', 'dead', 'dpresnap', 'dlive', 'ddead'].includes(G.state);
  if (!canCall || G.timeouts <= 0 || G.gameOver || G.clockStopped) return;
  G.timeouts--;
  G.clockStopped = true;
  sayComment('Timeout! The clock stops.');
  showBanner('⏱ TIMEOUT  ·  ' + G.timeouts + ' left', false);
  updateTimeoutBtn();
}

// Keep the on-screen TIMEOUT button showing how many you have left (and gray
// it out when you're out, or when it isn't your clock to stop).
function updateTimeoutBtn() {
  const b = document.getElementById('btn-timeout');
  if (!b) return;
  b.innerHTML = '⏱<small>' + G.timeouts + '</small>';
  b.classList.toggle('off', G.timeouts <= 0);
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
    if (G.quarter === 3) { G.timeouts = 3; updateTimeoutBtn(); }   // ⏱ fresh timeouts each half
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
  // After a turnover, they take over right where it happened; otherwise a normal
  // possession starts at their own 25.
  const spot = (G.turnoverSpotCpu != null) ? G.turnoverSpotCpu : 25;
  G.turnoverSpotCpu = null;
  G.cpu = { spot, down: 1, togo: 10, play: null };
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
  defense[1].startY = defense[1].s.y; defense[1].startX = defense[1].s.x;   // their RB
  defense[2].startY = defense[2].s.y; defense[2].startX = defense[2].s.x;   // their left WR
  defense[3].startY = defense[3].s.y; defense[3].startX = defense[3].s.x;   // their right WR

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
  G.myDefender = offense[0];        // you start on your middle linebacker
  ballFollow = true;
  G.cpu.play = null;
  G.state = 'dpresnap';
  G.dsnapAt = G.scene.time.now + 1100;   // they snap it on their own count
  G.scene.cameras.main.startFollow(defense[0].s, true, 0.12, 0.12);
  updateBall();
  updateHUD();
  if (window.TDTour) TDTour.maybeStart('defense');   // 🎓 first-time-on-defense tour
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
  callRedPlay();                          // 🧠 pick their route concept + your coverage
  G.state = 'dlive';
  G.replay = [];
  sayComment(pick(['Here they come!', 'The snap…', 'Stop them!']));
}

// Control auto-switches to whichever of YOUR defenders is closest to the ball,
// so you're always driving the guy in the best spot to make the play — with a
// little "stickiness" so it doesn't flip every single frame. (On an interception
// you become the guy who caught it — that's set straight away in startPickSix.)
function pickMyDefender() {
  if (!G.myDefender) G.myDefender = offense[0];
  const bx = ball.x, by = ball.y;
  let best = G.myDefender;
  let bestD = Phaser.Math.Distance.Between(best.s.x, best.s.y, bx, by);
  for (const o of offense) {
    const dd = Phaser.Math.Distance.Between(o.s.x, o.s.y, bx, by);
    if (dd < bestD - 22) { bestD = dd; best = o; }   // only switch if clearly closer
  }
  G.myDefender = best;
}

// YOU drive your defender — arrows or the D-pad, tackle on contact. Control
// auto-switches to the nearest defender ONLY on a LIVE RUN (a red ballcarrier who
// ISN'T their QB is running it). While their QB is in the pocket you keep your own
// man, and on an interception you're switched straight to the guy who picked it
// off (that happens in startPickSix).
function controlYourDefender() {
  if (G.state === 'dlive' && G.ballCarrier && G.ballCarrier !== defense[0]) pickMyDefender();
  if (!G.myDefender) G.myDefender = offense[0];
  const p = G.myDefender.s;
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

// ---- 🧠 Smart routes for the CPU offense (v1.7) ----------------------------
// The red team runs the SAME playbook your offense does, and your AI teammates
// cover it with a man/zone mix — so playing defense is a real read now, not the
// same slant-and-streak every down.
function callRedPlay() {
  let i = Phaser.Math.Between(0, PLAYBOOK.length - 1);
  if (i === G.lastRedConcept) i = (i + 1) % PLAYBOOK.length;   // no back-to-back repeats
  G.lastRedConcept = i;
  const c = PLAYBOOK[i];
  G.redConcept = c;
  defense[2].route = c.wr1;   // their left WR
  defense[3].route = c.wr2;   // their right WR
  defense[1].route = c.rb;    // their RB
  // Your AI teammates read their coverage for the down (man tight / zone soft).
  const d = G.difficulty;
  const zoneOdds = d === 'easy' ? 0.25 : d === 'hard' ? 0.5 : 0.4;
  G.dcoverage = Math.random() < zoneOdds ? 'zone' : 'man';
  G.dpassTarget = null;
}

// The red team attacks DOWN the screen, so their routes are your offense's
// routes with the up/down flipped — same left/right breaks, opposite depth.
function redRouteVelocity(wr, depth, side) {
  const v = routeVelocity(wr, depth, side);
  return { vx: v.vx, vy: -v.vy };
}

// The red receiver (defense[1/2/3]) most threatening a blue zone: inside the
// x-band and farthest DOWNFIELD (largest y). null = nobody there.
function nearestRedThreatInBand(loX, hiX) {
  let best = null, bestY = -Infinity;
  for (const wr of [defense[1], defense[2], defense[3]]) {
    if (wr === G.ballCarrier) continue;
    if (wr.s.x < loX || wr.s.x > hiX) continue;
    if (wr.s.y > bestY) { bestY = wr.s.y; best = wr; }
  }
  return best;
}

// Which third a zone cover-defender of YOURS patrols (mirror of dbZone).
function blueZone(o) {
  if (o === offense[2]) return { lo: 0,   hi: 205,         homeX: 120 };
  if (o === offense[3]) return { lo: 328, hi: FIELD_WIDTH, homeX: FIELD_WIDTH - 120 };
  return               { lo: 150, hi: 383,         homeX: FIELD_WIDTH / 2 };   // offense[1], middle
}

// ---- The red team's brain --------------------------------------------------
function updateRedTeam(elapsed) {
  const play = G.cpu.play;
  const qb = defense[0], rb = defense[1];
  const carrier = G.ballCarrier;

  updateRedLine();   // their line blocks your rushers

  // Their receivers run REAL routes now — the same playbook your offense uses,
  // just flipped so "downfield" for them is DOWN the screen. (They run routes on
  // run plays too — real teams fake you out like that.) The RB only runs his
  // route on a pass; on a run he's coming back for the handoff (handled below).
  const runners = play.type === 'pass' ? [defense[1], defense[2], defense[3]] : [defense[2], defense[3]];
  for (const wr of runners) {
    if (wr === carrier) continue;
    const depth = wr.s.y - wr.startY;
    let { vx, vy } = redRouteVelocity(wr, depth, sideOf(wr));
    // Work open: a crowded receiver slides toward the open grass (WRs only).
    if (wr !== defense[1] && depth > 44) {
      let nearX = null, nd = Infinity;
      for (const o of offense) {
        const dd = Phaser.Math.Distance.Between(wr.s.x, wr.s.y, o.s.x, o.s.y);
        if (dd < nd) { nd = dd; nearX = o.s.x; }
      }
      if (nearX != null && nd < 40) vx += (wr.s.x < nearX ? -1 : 1) * WR_SPEED * 0.28;
    }
    if (wr.s.x < 12 && vx < 0) vx = 0;
    if (wr.s.x > FIELD_WIDTH - 12 && vx > 0) vx = 0;
    if (wr.s.y >= FIELD_LENGTH - ENDZONE - 8) vy = 0;   // don't run into their endzone wall
    wr.s.setVelocity(vx * G.oppOff, vy * G.oppOff);      // ⭐ the opponent's offense rating
    if (vx || vy) wr.s.setRotation(Math.atan2(vy, vx) + Math.PI / 2);
  }

  // Their RB on a RUN play comes back to the QB for the handoff.
  if (rb !== carrier && play.type === 'run' && !play.handed) {
    steer(rb.s, qb.s.x, qb.s.y + 2, WR_SPEED);
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
  steer(c, Phaser.Math.Clamp(tx, 24, FIELD_WIDTH - 24), c.y + 140, diff().redSpeed * G.oppOff);   // ⭐ opp offense
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
    if (o === (G.myDefender || offense[0])) continue;   // that's YOU — you drive yourself
    let tx, ty, speed = DEF_SPEED;

    // Which red receiver does this teammate cover in man? (null = a rusher/spy.)
    const assign = o === offense[2] ? defense[2]
                 : o === offense[3] ? defense[3]
                 : o === offense[1] ? defense[1] : null;

    if (!qbHasIt && G.state !== 'dpass') {
      // Someone's running the ball — your teammates chase, but on purpose a
      // step slow: THEY rally, but YOU are the closer. Stand around and the
      // red team will march right down the field. Hunt, and you're the hero.
      tx = carrier.s.x; ty = carrier.s.y; speed = PURSUE_SPEED * 0.8;
    } else if (o === offense[4] || o === offense[5]) {
      tx = defense[0].s.x; ty = defense[0].s.y;             // rush their QB…
      if (redNearBlocker(o)) speed = DEF_SPEED * 0.4;       // …through their blockers
    } else if (assign && G.dcoverage === 'zone') {
      // Zone: drop to your third and slide toward the deepest red threat in it
      // (goal-side, for red, is BELOW — larger y).
      const z = blueZone(o);
      const th = nearestRedThreatInBand(z.lo, z.hi);
      tx = th ? th.s.x : z.homeX;
      ty = Math.max((th ? th.s.y : G.losY) + 26, G.losY + 92);
    } else if (assign) {
      tx = assign.s.x; ty = assign.s.y + 24;               // man: cover goal-side (below him)
    } else {
      tx = carrier.s.x; ty = carrier.s.y + 55; speed = DEF_SPEED * 0.85;   // the AI linebacker spies
    }

    // 🧠 BREAK ON THE BALL — when their pass is in the air, your nearby
    // teammates rally to where it's headed to swat it or pick it (not the
    // rushers, and not you — you drive yourself).
    if (G.state === 'dpass' && G.dpassTarget && o !== offense[4] && o !== offense[5]) {
      const toBall = Phaser.Math.Distance.Between(o.s.x, o.s.y, G.dpassTarget.x, G.dpassTarget.y);
      if (toBall < 135) { tx = G.dpassTarget.x; ty = G.dpassTarget.y; speed = DEF_SPEED * 1.08; }
    }

    steer(o.s, tx, ty, speed * G.myDef);   // ⭐ your team's defense rating
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
  // Their QB slips sometimes too — a bad throw sails wide, right into your reach.
  const bad = !hurried && Math.random() < BAD_THROW_CHANCE;
  const wob = bad ? 95 : (hurried ? 40 : 0);
  if (bad) sayComment(pick(['Bad throw!', 'Off the mark!', 'That one sailed!']));
  const tX = Phaser.Math.Clamp(best.s.x + best.s.body.velocity.x * flight
             + Phaser.Math.Between(-wob, wob), 10, FIELD_WIDTH - 10);
  const tY = best.s.y + best.s.body.velocity.y * flight + (bad ? Phaser.Math.Between(-80, 80) : 0);
  G.dpassTarget = { x: tX, y: tY };   // 🧠 your defenders break on this spot
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
  G.dpassTarget = null;              // the ball has arrived — stop the break-on-the-ball chase
  const wx = wr.s.x, wy = wr.s.y;

  if (Phaser.Math.Distance.Between(x, y, wx, wy) > OVERTHROW_DIST) {
    // A bad throw into open space — anybody nearby can grab it.
    let nb = Infinity, jumper = null;   // nearest of YOUR defenders to the landing
    for (const o of offense) {
      const dd = Phaser.Math.Distance.Between(o.s.x, o.s.y, x, y);
      if (dd < nb) { nb = dd; jumper = o; }
    }
    if (nb < LOOSE_BALL_DIST) { startPickSix(jumper, x, y); return; }   // you jump it = PICK SIX!
    let nr = Infinity, rwr = null;      // nearest RED receiver to the landing
    for (const rr of [defense[1], defense[2], defense[3]]) {
      const dd = Phaser.Math.Distance.Between(rr.s.x, rr.s.y, x, y);
      if (dd < nr) { nr = dd; rwr = rr; }
    }
    if (rwr && nr < LOOSE_BALL_DIST) {  // a red receiver adjusts and hauls it in — tackle him!
      ball.setPosition(x, y);
      G.ballCarrier = rwr; G.state = 'dlive'; ballFollow = true;
      G.scene.cameras.main.startFollow(rwr.s, true, 0.12, 0.12);
      sayComment(pick(['They caught it anyway!', 'Complete — get him!']));
      return;
    }
    redPlayEnd('incomplete', 'OVERTHROWN!');
    return;
  }

  // Whoever of YOURS is closest when it arrives can make a play on it.
  let nd = Infinity, picker = null;
  for (const o of offense) {
    const dd = Phaser.Math.Distance.Between(o.s.x, o.s.y, wx, wy);
    if (dd < nd) { nd = dd; picker = o; }
  }
  if (nd < CATCH_CONTEST + 2) {
    if (Math.random() < RED_INT) {
      // 🏈 YOU picked it off — take control of that defender and RUN IT BACK!
      startPickSix(picker, wx, wy);
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

// 🏈 PICK SIX! You intercepted a pass — take control of that defender and run it
// back toward THEIR endzone. We reuse the whole kickoff-return system: you drive
// the ball carrier, the red team chases you, a tackle spots your new drive right
// there (see endKickoffReturn), and reaching the endzone is a defensive TD.
function startPickSix(picker, x, y) {
  if (window.TDSound) TDSound.sting('td');
  if (window.TDShop)  TDShop.earn(3);        // 🪙 takeaways pay 3 coins
  G.cpu = null;                              // their drive is over
  G.dpassTarget = null;
  G.ballCarrier = picker;
  G.myDefender = picker;                     // you instantly become the interceptor
  ball.setPosition(x, y).setVisible(true);
  ballFollow = true;
  for (const o of offense) if (o !== picker) o.s.setVelocity(0, 0);   // teammates hold up
  G.koLive = true;
  G.pickSix = true;
  G.state = 'kickoff';                        // ← the shared run-it-back machinery
  G.scene.cameras.main.startFollow(picker.s, true, 0.12, 0.12);
  showBanner('INTERCEPTED!  RUN IT BACK!', true);
  sayComment(pick(['Pick! Take it to the house!', 'INTERCEPTED — go, go, go!', 'It’s a PICK!']));
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
        // You recover their fumble — YOUR drive starts right at this spot.
        G.turnoverSpotYou = Phaser.Math.Clamp(Math.round(100 - redYardsFromGoal(c.y)), 1, 99);
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
    // 🛑 SAFETY (your way) — you dropped their ball carrier in THEIR own end
    // zone. 2 points for YOU, and they free-kick it back to you.
    if (result === 'tackle' && redYardsFromGoal(G.ballCarrier.s.y) <= 0) {
      cpuDriveEnd('safety', 'SAFETY!  YOU +2');
      return;
    }
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
  else if (kind === 'safety')    { big = true; msg = customMsg || 'SAFETY!  YOU +2';
                                   G.score += 2;                          // 🛑 the 2 points are YOURS
                                   if (window.TDSound) TDSound.sting('td');
                                   if (window.TDShop) TDShop.earn(3); }   // 🪙 a takeaway-ish reward
  else                           { big = true; msg = customMsg || 'TURNOVER — YOUR BALL!';
                                   if (window.TDShop) TDShop.earn(3); }   // 🪙 takeaways pay 3

  G.oppScore += pts;
  updateHUD();
  showBanner(msg, big);
  G.scene.time.delayedCall(1700, finishCpuDrive);
}

// Ball back to you: settle the clock/quarter at this possession boundary, then
// take over. After a TURNOVER you start right at the spot; otherwise you field
// a kickoff (unless the game is over, or it's time for a break).
function finishCpuDrive() {
  G.cpu = null;
  document.body.classList.remove('returning');
  if (G.overtime && G.score !== G.oppScore) { endGame(); return; }  // sudden death
  const t = tickPeriodAtBoundary();
  if (t === 'gameover') { endGame(); return; }
  if (t === 'halftime') { G.turnoverSpotYou = null; startBreak('half', startCpuDrive); return; }  // they get the 2nd-half kick
  if (t === 'qbreak')   { startBreak('q', takeYourBall); return; }
  takeYourBall();
}

// Start YOUR possession: right at the turnover spot if you just got one,
// otherwise field a kickoff.
function takeYourBall() {
  if (G.turnoverSpotYou != null) {
    const s = G.turnoverSpotYou; G.turnoverSpotYou = null;
    document.body.classList.remove('returning');
    setupPlay({ los: s, down: 1, fd: Math.min(s + 10, 100) });
  } else {
    startKickoff();
  }
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

  // 🏆 In a SEASON game, tell the season how it went — this records the result,
  // auto-plays the other teams' games, and moves the schedule/playoffs along.
  // We do it LAST, so the FINAL screen above still shows just THIS game's coins.
  if (G.seasonGame && window.TDSeason) TDSeason.reportResult(G.score, G.oppScore);
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

  O.again = s.add.text(270, 600, G.seasonGame ? 'tap for your season →' : 'tap to play again', {
    fontFamily: 'Arial Black, Arial', fontSize: '18px', color: '#8fd0ff',
    stroke: '#000', strokeThickness: 3 }).setOrigin(0.5).setScrollFactor(0).setDepth(52);
  s.tweens.add({ targets: O.again, alpha: 0.3, duration: 600, yoyo: true, repeat: -1 });

  G.gameOverOverlay = O;
}

function returnToMenuFromGameOver() {
  const O = G.gameOverOverlay;
  if (O) { for (const k in O) if (O[k] && O[k].destroy) O[k].destroy(); G.gameOverOverlay = null; }
  document.body.classList.remove('kicking', 'returning', 'two-player');
  const wasSeason = G.seasonGame;
  G.seasonGame = false;
  enterMenu();
  // 🏆 A season game drops you back on the SEASON screen (with updated standings,
  // your next game, or the championship trophy) — not the plain team menu.
  if (wasSeason && window.TDSeason) TDSeason.open();
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

  // The headline line: the team's OVERALL rating + what it's best at (or, for an
  // unlocked uniform, its "exclusive" brag). Sits just under the team name.
  M.note = scene.add.text(mid, 497, '', {
    fontFamily: 'Arial Black, Arial', fontSize: '15px', color: '#ffd60a', align: 'center',
    stroke: '#000', strokeThickness: 3 }).setOrigin(0.5).setScrollFactor(0).setDepth(94);

  // ⭐ Offense / defense star bars, tucked in above the DIFFICULTY buttons.
  M.ratingBars = scene.add.text(mid, 524, '', { fontFamily: 'Arial, sans-serif',
    fontSize: '13px', color: '#ffffff', align: 'center', lineSpacing: 2,
    stroke: '#000', strokeThickness: 3 }).setOrigin(0.5).setScrollFactor(0).setDepth(94);

  G.menu = M;
  setMenuVisible(false);
}

// Show or hide all the menu pieces at once.
function setMenuVisible(v) {
  const M = G.menu; if (!M) return;
  for (const o of [M.bg, M.title, M.abbr, M.swatch, M.preview, M.name, M.note, M.ratingBars]) o.setVisible(v);
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
  if (window.TDTour)  TDTour.maybeStart('menu');  // 🎓 first-visit menu tour (waits for popups)
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
  // ⭐ Headline = overall rating + specialty (or the exclusive-uniform brag),
  // then the offense & defense star bars underneath.
  const r = teamRating(t);
  G.menu.note.setText(t.special ? '⭐ EXCLUSIVE UNIFORM!'
                                : 'OVERALL ' + r.overall + '/10  ·  BEST AT ' + r.specialty);
  G.menu.note.setColor(t.special ? '#ffe066' : '#ffd60a');
  G.menu.ratingBars.setText('🏈 OFFENSE  ' + stars10(r.off) + '  ' + r.off + '\n'
                          + '🛡 DEFENSE  ' + stars10(r.def) + '  ' + r.def);

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

// Tap PLAY (Quick Game): lock in your team and give the computer a random
// OTHER team, then hand off to beginGame() to actually start.
function startGameWithTeam() {
  if (G.state !== 'menu') return;
  const team = allTeams()[G.menuIndex];
  // Pick a random OTHER team for the computer (always a real NFL team —
  // your exclusive daily-reward uniforms are yours alone).
  let opp;
  do { opp = NFL_TEAMS[Phaser.Math.Between(0, NFL_TEAMS.length - 1)]; } while (opp === team);
  beginGame(team, opp, false);
}

// The shared "start a brand-new game" routine, used by BOTH Quick Game and
// 🏆 Season mode. `team`/`opp` are team objects; `isSeason` is true for a
// season game (so endGame knows to report the final score back to the season).
function beginGame(team, opp, isSeason) {
  G.team = team;
  G.oppTeam = opp;
  G.seasonGame = !!isSeason;

  // ⭐ Turn each team's OFFENSE/DEFENSE ratings into a gentle speed tilt: a 5 is
  // neutral, a 10 is +7.5%, a 1 is −6%. So a great team really does play tougher,
  // and the team YOU pick plays to its strength — without breaking the balance.
  const mr = teamRating(team), orr = teamRating(opp);
  const tilt = v => 1 + (v - 5) * 0.015;
  G.myOff = tilt(mr.off);  G.myDef = tilt(mr.def);
  G.oppOff = tilt(orr.off); G.oppDef = tilt(orr.def);

  // Fresh scoreboard & game clock for a brand-new game.
  G.score = 0; G.oppScore = 0;
  G.quarter = 1; G.clock = QUARTER_SECONDS;
  G.overtime = false; G.gameOver = false;
  G.boostUntil = 0;                              // no leftover 🔋 energy burst
  G.timeouts = 3; G.clockStopped = false; G.formation = 0;   // ⏱ fresh timeouts, 🧩 back to SPREAD
  updateTimeoutBtn(); updateFormationBtn();
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

// ---- Season mode drives the game through here (see src/season.js) ---------
// season.js does all the league bookkeeping in the DOM; when it's time to
// actually PLAY, it calls startSeasonGame, and we report the score back to it
// from endGame(). Kept tiny on purpose — the season never touches Phaser.
window.TDGame = {
  // find a team (or an earned uniform) by its abbreviation
  teamByAbbr: (abbr) => allTeams().find(t => t.abbr === abbr) || null,
  // the team currently shown on the CHOOSE YOUR TEAM menu
  currentMenuTeamAbbr: () => { const t = allTeams()[G.menuIndex]; return t ? t.abbr : null; },
  // just the real NFL teams (season.js builds the 8-team league from these)
  nflAbbrs: () => NFL_TEAMS.map(t => t.abbr),
  // start a season game: your team vs the week's scheduled opponent
  startSeasonGame(youAbbr, oppAbbr) {
    const team = this.teamByAbbr(youAbbr), opp = this.teamByAbbr(oppAbbr);
    if (team && opp && G.scene) beginGame(team, opp, true);
  }
};

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
  G.pickSix = false;            // if this was an interception return, it's over now
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

// ============================================================
// 🧩 FORMATIONS (v1.7) — how your skill players line up before the snap.
// Each entry gives WR#1 / WR#2's x and the RB's spot (x + how far behind the
// QB). Moving a receiver across midfield flips which way his routes break
// (routes mirror off each guy's snap side), so formations really play
// differently — TRIPS overloads one side, I-FORM tightens up for the run.
// ============================================================
const FORMATIONS = [
  { name: 'SPREAD',  wr1: 55,  wr2: 478, rbx: 266, rby: 84  },  // wide open, RB beside the QB
  { name: 'TRIPS R', wr1: 360, wr2: 470, rbx: 150, rby: 44  },  // both WRs stacked to the right
  { name: 'TRIPS L', wr1: 63,  wr2: 173, rbx: 416, rby: 44  },  // both WRs stacked to the left
  { name: 'I-FORM',  wr1: 150, wr2: 383, rbx: 266, rby: 104 },  // tight, RB deep behind the QB
];

// Put WR#1, WR#2 and the RB where the current formation says, at line 'L' (the
// pixel y of the line of scrimmage), and remember each one's snap spot (startX/
// startY) so the route system knows which side he lined up on.
function layoutSkill(L) {
  const f = FORMATIONS[G.formation] || FORMATIONS[0];
  place(offense[1], f.rbx, L + f.rby);   // RB
  place(offense[2], f.wr1, L + 14);      // WR #1
  place(offense[3], f.wr2, L + 14);      // WR #2
  for (const i of [1, 2, 3]) { offense[i].startY = offense[i].s.y; offense[i].startX = offense[i].s.x; }
}

// The FORMATION button (pre-snap only): cycle to the next look, re-line-up, and
// redraw the route preview from the new spots (same routes — they just move/mirror).
function cycleFormation() {
  if (G.state !== 'presnap') return;
  G.formation = (G.formation + 1) % FORMATIONS.length;
  layoutSkill(G.losY);
  drawRoutePreview();
  updateFormationBtn();
  sayComment(FORMATIONS[G.formation].name + ' formation');
}

function updateFormationBtn() {
  const b = document.getElementById('btn-formation');
  if (b) b.innerHTML = '🧩<small>' + FORMATIONS[G.formation].name + '</small>';
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
  place(offense[4], 226, L + 16);   // OL
  place(offense[5], 266, L + 16);   // OL
  place(offense[6], 306, L + 16);   // OL
  layoutSkill(L);                   // 🧩 line up the RB + WRs per the chosen formation
  updateFormationBtn();

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
  callPlay();           // 🧠 pick this down's routes + the defense's coverage/blitz
  drawRoutePreview();   // show where the receivers will run, BEFORE the snap

  // On 4th down, don't snap right away — first offer the choice:
  // go for it, or kick (a field goal if you're close, otherwise a punt).
  if (G.down === 4) {
    G.state = 'decision';
    showFourthDownChoice();
  } else {
    G.state = 'presnap';
    if (window.TDTour) TDTour.maybeStart('offense');   // 🎓 first-snap offense tour
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

  // The 1P / 2P switch, the 3D/2D view toggle, and the Fullscreen button
  bindTapEl('btn-mode', toggleTwoPlayer);
  bindTapEl('btn-view', toggleView);
  bindTapEl('btn-fs', toggleFullscreen);

  // ⏱ Timeout + 🧩 Formation (in-game), and the menu HOW TO PLAY / Maxwell toggle
  bindTapEl('btn-timeout', callTimeout);
  bindTapEl('btn-formation', cycleFormation);
  bindTapEl('open-howto', () => { if (window.TDTour) TDTour.start('menu', true); });  // 🎓 replay the tour
  bindTapEl('toggle-maxwell', toggleMaxwell);

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
        const w = canvasTapToWorld(e);
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

// ---- 👑 MAXWELL toggle (on the menu) --------------------------------------
// Flip the superstar defender on/off for your games, and remember the choice.
function toggleMaxwell() {
  G.maxwell = !G.maxwell;
  try { localStorage.setItem('tdr-maxwell', G.maxwell ? '1' : '0'); } catch (e) {}
  updateMaxwellBtn();
  if (G.maxwell) sayComment && sayComment('👑 Maxwell is IN the game!');
}
function updateMaxwellBtn() {
  const b = document.getElementById('toggle-maxwell');
  if (b) b.classList.toggle('on', G.maxwell);
}
function loadMaxwell() {
  try { G.maxwell = localStorage.getItem('tdr-maxwell') === '1'; } catch (e) {}
  updateMaxwellBtn();
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

// ---- 3D / 2D field view -----------------------------------------------------
// A pure-CSS "camera": adding the .threeD class to #game-container tilts the
// whole field back so you're looking DOWN it into the distance — the classic
// arcade-football look (all the CSS lives in index.html). It's ONLY a picture
// change: the game, the physics, and every control work exactly the same in both
// views. We remember your pick in localStorage so the game opens the way you like.
// The button shows the view you're IN (like the 1P/2P button) — tap it to flip.
function currentView() {
  try { return localStorage.getItem('tdr-view') === '2D' ? '2D' : '3D'; }
  catch (e) { return '3D'; }   // default: show off the 3D field
}
function applyView(mode) {
  const gc = document.getElementById('game-container');
  if (gc) gc.classList.toggle('threeD', mode === '3D');
  const btn = document.getElementById('btn-view');
  if (btn) btn.textContent = mode;
  try { localStorage.setItem('tdr-view', mode); } catch (e) {}
  if (window.game && game.scale) game.scale.refresh();   // re-fit after the box tilts
}
function toggleView() {
  applyView(currentView() === '3D' ? '2D' : '3D');
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
  const o = { s, role, num: opts.num, route: opts.route, cover: opts.cover, startY: 0, startX: 0, label: null, trail: [] };
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
  // The scoreboard used to be drawn ON the game canvas. Now it lives in the PAGE
  // — the little #hud boxes in index.html — so when the field tilts back into 3D
  // the score, clock and hints stay flat and crisp on top instead of leaning with
  // the field. Each box gets a tiny wrapper with a .setText() so the rest of the
  // game can keep calling hud.score.setText(...) exactly like it always has.
  const box = id => {
    const el = document.getElementById(id);
    return { el, setText: t => { if (el) el.textContent = t; } };
  };
  hud.score = box('hud-score');
  hud.down  = box('hud-down');
  hud.spot  = box('hud-spot');
  hud.clock = box('hud-clock');
  hud.help  = box('hud-help');
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
      const me = (G.myDefender || offense[0]).s;
      G.youLabel.setPosition(me.x, me.y - 22);
      if (G.p2Label) G.p2Label.setVisible(false);   // P2 sits out the defense phase (for now)
    }
  }

  // 👑 Float the gold "MAXWELL" tag over the superstar — only while YOU'RE on
  // offense (that's when defense[6] is the CPU's ballhawk you're up against).
  if (G.starLabel) {
    const showStar = G.maxwell && G.team && !onDefense && defense[6] && G.state !== 'kickoff';
    G.starLabel.setVisible(!!showStar);
    if (showStar) G.starLabel.setPosition(defense[6].s.x, defense[6].s.y - 22);
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
    hud.down.setText(G.pickSix ? 'INTERCEPTION!' : 'KICKOFF');
    hud.spot.setText(G.pickSix ? 'Run it back to THEIR endzone!' : 'Catch it and run it back!');
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
  const W = FIELD_WIDTH, L = FIELD_LENGTH;
  const g = scene.add.graphics().setDepth(0);

  // --- 1) Mowed-grass stripes -------------------------------------------------
  // A real field has light + dark bands where the mower drove up and down. We
  // paint a band every 5 yards (24 bands over 120 yards) for a lush striped look.
  for (let i = 0; i < 24; i++) {
    g.fillStyle(i % 2 === 0 ? GRASS_DARK : GRASS_LIGHT);
    g.fillRect(0, i * 5 * PX_PER_YARD, W, 5 * PX_PER_YARD);
  }

  // --- 2) End zones -----------------------------------------------------------
  // A solid painted colour with a slightly darker inner block + diagonal paint
  // stripes, so they read as real end-zone turf instead of a flat rectangle.
  for (const top of [0, L - ENDZONE]) {
    g.fillStyle(ENDZONE_COLOR);              g.fillRect(0, top, W, ENDZONE);
    g.fillStyle(0x000000, 0.16);             g.fillRect(6, top + 6, W - 12, ENDZONE - 12);
    g.lineStyle(2, 0xffffff, 0.14);          // faint diagonal "paint" hatching
    for (let x = -ENDZONE; x < W; x += 22) {
      g.beginPath(); g.moveTo(x, top); g.lineTo(x + ENDZONE, top + ENDZONE); g.strokePath();
    }
  }

  // --- 3) Yard lines (every 5 yds; bold on the 10s) + goal lines --------------
  for (let yd = 0; yd <= 100; yd += 5) {
    const y = ENDZONE + yd * PX_PER_YARD;
    const onTen = yd % 10 === 0;
    g.lineStyle(onTen ? 3 : 1.5, 0xffffff, onTen ? 0.9 : 0.5);
    g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.strokePath();
  }
  // The two GOAL lines get the boldest paint (that's where a touchdown counts).
  g.lineStyle(5, 0xffffff, 0.95);
  for (const y of [ENDZONE, L - ENDZONE]) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.strokePath(); }

  // --- 4) Hash marks — two inner rows of little ticks, like the real thing ----
  g.lineStyle(1, 0xffffff, 0.4);
  for (let yd = 0; yd < 100; yd++) {
    const y = ENDZONE + yd * PX_PER_YARD;
    for (const x of [W * 0.35, W * 0.65]) {
      g.beginPath(); g.moveTo(x - 4, y); g.lineTo(x + 4, y); g.strokePath();
    }
  }

  // --- 5) Sidelines — a bright white boundary down each edge of the field -----
  g.lineStyle(4, 0xffffff, 0.9);
  g.strokeRect(1.5, ENDZONE, W - 3, L - 2 * ENDZONE);

  // --- 6) Yard NUMBERS on both sides (10..50..10), with a dark outline so they
  //        stay readable on the light grass stripes. ---------------------------
  for (let yd = 10; yd <= 90; yd += 10) {
    const label = String(yd <= 50 ? yd : 100 - yd);
    for (const x of [42, W - 42]) {
      scene.add.text(x, ENDZONE + yd * PX_PER_YARD, label, {
        fontFamily: 'Arial Black, Arial', fontSize: '22px', color: '#ffffff',
        stroke: '#0c3a12', strokeThickness: 3
      }).setOrigin(0.5).setDepth(1).setAlpha(0.65);
    }
  }

  // --- 7) Midfield star at the 50-yard line -----------------------------------
  const midY = ENDZONE + 50 * PX_PER_YARD;
  g.lineStyle(2, 0xffffff, 0.25); g.strokeCircle(W / 2, midY, 34);
  scene.add.text(W / 2, midY, '★', {
    fontFamily: 'Arial Black, Arial', fontSize: '46px', color: '#ffe066'
  }).setOrigin(0.5).setDepth(1).setAlpha(0.35);

  // --- 8) End-zone team names (nudged toward the goal line so the goalposts,
  //        drawn next, sit clearly at the back of the zone) --------------------
  scene.add.text(W / 2, ENDZONE * 0.78, 'TOUCHDOWN', {
    fontFamily: 'Arial Black, Arial', fontSize: '26px', color: '#ffe066',
    stroke: '#000', strokeThickness: 4
  }).setOrigin(0.5).setDepth(1).setAlpha(0.92);
  // Your home end zone shows your team's name once you've picked it (see
  // startGameWithTeam). Until then it just says MAX FC.
  G.endzoneLabel = scene.add.text(W / 2, L - ENDZONE * 0.78, 'MAX FC', {
    fontFamily: 'Arial Black, Arial', fontSize: '26px', color: '#ffffff',
    stroke: '#000', strokeThickness: 4
  }).setOrigin(0.5).setDepth(1).setAlpha(0.85);

  // --- 9) Goalposts — their own layer, drawn ON TOP so they always show -------
  const gp = scene.add.graphics().setDepth(1);
  drawGoalpost(gp, W / 2, 'top');
  drawGoalpost(gp, W / 2, 'bottom');
}

// A classic yellow goalpost (base pole → crossbar → two uprights), tucked into
// the back of an end zone. 'top' points down into the field; 'bottom' points up.
function drawGoalpost(g, cx, where) {
  const gold = 0xf5c518, spread = 26;
  const top = where === 'top';
  const uprightY = top ? 5  : FIELD_LENGTH - 5;    // tips of the uprights (at the end line)
  const crossY   = top ? 30 : FIELD_LENGTH - 30;   // the crossbar
  const baseY    = top ? 54 : FIELD_LENGTH - 54;   // where the base pole meets the field
  // a small shadow line first so the posts read as 3D metal
  g.lineStyle(6, 0x000000, 0.18);
  g.beginPath(); g.moveTo(cx + 2, baseY); g.lineTo(cx + 2, crossY); g.strokePath();
  g.lineStyle(5, gold, 1);
  g.beginPath(); g.moveTo(cx, baseY); g.lineTo(cx, crossY); g.strokePath();               // base pole
  g.beginPath(); g.moveTo(cx - spread, crossY); g.lineTo(cx + spread, crossY); g.strokePath(); // crossbar
  g.beginPath(); g.moveTo(cx - spread, crossY); g.lineTo(cx - spread, uprightY); g.strokePath(); // upright L
  g.beginPath(); g.moveTo(cx + spread, crossY); g.lineTo(cx + spread, uprightY); g.strokePath(); // upright R
}

// Repaint every ground shadow this frame — a soft dark oval a little BELOW each
// visible player + the ball, so they look like they're standing on the grass.
function drawShadows() {
  if (!shadowGfx) return;
  shadowGfx.clear();
  const blob = (sp, rw) => {
    if (!sp || !sp.visible) return;
    shadowGfx.fillStyle(0x0a1f0a, 0.30);
    shadowGfx.fillEllipse(sp.x, sp.y + 13, rw, rw * 0.42);
  };
  for (const o of offense) blob(o.s, 26);
  for (const d of defense) blob(d.s, 26);
  if (referee) blob(referee, 26);
  if (ball && ballFollow !== undefined) blob(ball, 15);
}

// Draw one chibi player in a team's two colors: JERSEY (body/shoulder pads) and
// HELMET (head). Now with soft shading — a bright highlight up top and a darker
// rim below — so each little guy looks rounded and three-dimensional instead of
// flat. We can call this again with the same `key` to REPAINT a team (handy when
// you flip teams in the menu), so we clear the old picture first.
function makeChibiTexture(scene, key, jersey, helmet) {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const g = scene.make.graphics({ x: 0, y: 0, add: false });

  // Shoulder pads (jersey), shaded: base → dark bottom rim → bright top highlight
  g.fillStyle(jersey);          g.fillEllipse(20, 25, 32, 17);
  g.fillStyle(0x000000, 0.20);  g.fillEllipse(20, 29, 30, 9);     // ambient-occlusion under the pads
  g.fillStyle(0xffffff, 0.16);  g.fillEllipse(20, 20, 26, 8);     // sheen across the top of the pads

  // Arms (skin tone) poking out the sides
  g.fillStyle(0xd9a066);        g.fillCircle(5, 25, 4); g.fillCircle(35, 25, 4);

  // Helmet — a rounded ball with a shine and a face mask
  g.fillStyle(helmet);          g.fillCircle(20, 15, 13);         // the helmet
  g.fillStyle(0x000000, 0.18);  g.fillEllipse(20, 19, 22, 12);    // shade at the base of the helmet
  g.fillStyle(helmet);          g.fillCircle(20, 14, 12);         // re-cap the top so the shade sits low
  g.fillStyle(0xffffff, 0.30);  g.fillEllipse(15, 10, 11, 7);     // top-left specular highlight (the shine)
  g.fillStyle(0xe8e8e8);        g.fillEllipse(20, 20, 15, 5);     // face mask (light grey bar up front)
  g.fillStyle(jersey);          g.fillRect(18, 3, 4, 12);         // helmet stripe (jersey colour, so it shows)

  g.generateTexture(key, 40, 36);
  g.destroy();
}

function makeBallTexture(scene) {
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  g.fillStyle(0x6f3410);       g.fillEllipse(9, 6, 16, 10);       // dark leather base
  g.fillStyle(0x8B4513);       g.fillEllipse(9, 5, 15, 9);        // brown top
  g.fillStyle(0xffffff, 0.35); g.fillEllipse(6, 3.5, 6, 3);       // little shine
  g.fillStyle(0xffffff);       g.fillRect(6, 4.4, 6, 1.2);        // white laces stripe
  g.lineStyle(1, 0xffffff, 0.9);
  for (const lx of [7, 9, 11]) { g.beginPath(); g.moveTo(lx, 3.4); g.lineTo(lx, 6.6); g.strokePath(); }
  g.generateTexture('ball', 18, 12);
  g.destroy();
}

function makeRefTexture(scene) {
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  // black-and-white striped shirt (chibi, seen from above), lightly shaded
  g.fillStyle(0xffffff);        g.fillEllipse(20, 25, 32, 17);
  g.fillStyle(0x000000);
  for (let i = 0; i < 4; i++) g.fillRect(9 + i * 7, 17, 3, 16);
  g.fillStyle(0x000000, 0.16);  g.fillEllipse(20, 29, 30, 8);     // shade under the shirt
  // arms
  g.fillStyle(0xd9a066);        g.fillCircle(5, 25, 4); g.fillCircle(35, 25, 4);
  // head with a black cap + a shine
  g.fillStyle(0xd9a066);        g.fillCircle(20, 15, 12);
  g.fillStyle(0x111111);        g.fillEllipse(20, 10, 26, 12);
  g.fillStyle(0xffffff, 0.22);  g.fillEllipse(16, 8, 9, 4);
  g.generateTexture('ref', 40, 36);
  g.destroy();
}
