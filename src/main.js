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
// 4 downs to gain 10 yards = a first down. Reach the endzone = 7.
// ============================================================

// ---- Field dimensions ----
const PX_PER_YARD = 10;
const FIELD_WIDTH = 533;                  // 53.3 yards wide
const FIELD_LENGTH = 120 * PX_PER_YARD;   // 120 yards (100 + two endzones)
const ENDZONE = 10 * PX_PER_YARD;         // 10-yard endzones

// ---- Team colors ----
const HOME_COLOR = 0x1f4fd8;   // MAX FC — blue (Max's team)
const AWAY_COLOR = 0xd83a3a;   // defense — red
const ENDZONE_COLOR = 0x14337a;
const GRASS_DARK = 0x2d7a2d;
const GRASS_LIGHT = 0x379437;

// ---- Speeds (pixels/sec) — tune these to make it easier/harder ----
const PLAYER_SPEED = 215;   // the player you control
const WR_SPEED     = 195;   // receivers running routes
const DEF_SPEED    = 188;   // defenders (a touch slower = beatable)
const BALL_SPEED   = 520;   // how fast a pass flies

// ---- Distances ----
const TACKLE_DIST = 15;   // defender this close to the ball = tackle
const BLOCK_DIST  = 22;   // lineman this close to a rusher = blocks him
const CATCH_CONTEST = 15; // defender this close to the catch = incomplete

const config = {
  type: Phaser.AUTO,
  width: 540,
  height: 720,
  parent: 'game-container',
  backgroundColor: '#2d7a2d',
  physics: { default: 'arcade', arcade: { debug: false } },
  scene: { create, update }
};

// ---- Game state (one object so it's easy to read) ----
const G = {
  scene: null,
  state: 'presnap',     // presnap | live | pass | dead
  score: 0,
  down: 1,
  losYards: 20,         // line of scrimmage, yards from own goal
  firstDownYards: 30,   // yards-from-own-goal needed for a first down
  losY: 0,              // pixel y of the line of scrimmage
  ballCarrier: null,    // the offensive player object holding the ball
  hasPassed: false,     // has a pass been thrown this play?
  snapTime: 0,
  deadUntil: 0,
  next: null,           // where the next play starts, decided when a play ends
  banner: null,
};

let offense = [];  // 7 blue players (objects, see makePlayer)
let defense = [];  // 7 red players
let ball;          // the football sprite
let ballFollow = true;
let keys;          // keyboard

window.game = new Phaser.Game(config);

// ============================================================
// CREATE — build the field, the 14 players, the ball, the HUD
// ============================================================
function create() {
  G.scene = this;
  drawField(this);

  makeChibiTexture(this, 'blue', HOME_COLOR);
  makeChibiTexture(this, 'red', AWAY_COLOR);
  makeBallTexture(this);

  // --- Offense: QB, 3 receivers (numbered 1/2/3), 3 linemen ---
  offense = [
    makePlayer(this, 'blue', 'QB', { num: 0 }),
    makePlayer(this, 'blue', 'WR', { num: 1, route: 'slant' }),
    makePlayer(this, 'blue', 'WR', { num: 2, route: 'streak' }),
    makePlayer(this, 'blue', 'WR', { num: 3, route: 'out' }),
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

  // Keyboard: arrows to move, SPACE to snap, 1/2/3 to pass
  keys = this.input.keyboard.addKeys({
    up: 'UP', down: 'DOWN', left: 'LEFT', right: 'RIGHT',
    snap: 'SPACE', one: 'ONE', two: 'TWO', three: 'THREE'
  });

  // Camera & world
  this.physics.world.setBounds(0, 0, FIELD_WIDTH, FIELD_LENGTH);
  this.cameras.main.setBounds(0, 0, FIELD_WIDTH, FIELD_LENGTH);

  buildHUD(this);

  // Start the first drive at Max's own 20
  startDrive();

  // Debug handle — lets you peek at the game from the browser console.
  // Try typing  __td.G.score  or  __td.G.state  in DevTools.
  window.__td = { G, offense, defense, keys };
}

// ============================================================
// UPDATE — the heartbeat, ~60x per second
// ============================================================
function update(time) {
  if (G.state === 'dead') {
    freezeEveryone();
    if (time >= G.deadUntil) startNextPlay();
    updateBall();
    return;
  }

  if (G.state === 'presnap') {
    freezeEveryone();
    if (Phaser.Input.Keyboard.JustDown(keys.snap)) snap(time);
    updateBall();
    updateHUD();
    return;
  }

  // state is 'live' or 'pass'
  const elapsed = (time - G.snapTime) / 1000;

  if (G.state === 'live') controlBallCarrier();
  updateReceivers(elapsed);
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
  if (keys.left.isDown) vx = -PLAYER_SPEED;
  else if (keys.right.isDown) vx = PLAYER_SPEED;
  if (keys.up.isDown) vy = -PLAYER_SPEED;
  else if (keys.down.isDown) vy = PLAYER_SPEED;
  if (vx && vy) { vx *= 0.707; vy *= 0.707; }
  p.setVelocity(vx, vy);
  if (vx || vy) p.setRotation(Math.atan2(vy, vx) + Math.PI / 2);

  // Passing: only the QB, only behind the line, only once per play
  const qb = offense[0];
  const behindLine = qb.s.y >= G.losY - 2;
  if (G.ballCarrier === qb && behindLine && !G.hasPassed) {
    if (Phaser.Input.Keyboard.JustDown(keys.one))   throwTo(1);
    else if (Phaser.Input.Keyboard.JustDown(keys.two))   throwTo(2);
    else if (Phaser.Input.Keyboard.JustDown(keys.three)) throwTo(3);
  }
}

// ============================================================
// PASSING — throw to the receiver wearing that number
// ============================================================
function throwTo(num) {
  const wr = offense.find(o => o.role === 'WR' && o.num === num);
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
  // Is a defender right on the catch point? Then it's incomplete.
  let contested = false;
  for (const d of defense) {
    if (Phaser.Math.Distance.Between(d.s.x, d.s.y, x, y) < CATCH_CONTEST) {
      contested = true; break;
    }
  }
  if (contested) {
    endPlay('incomplete');
    return;
  }
  // Caught! You now control this receiver.
  G.ballCarrier = wr;
  G.state = 'live';
  ballFollow = true;
  G.scene.cameras.main.startFollow(wr.s, true, 0.12, 0.12);
}

// ============================================================
// RECEIVERS — run their routes after the snap
// ============================================================
function updateReceivers(elapsed) {
  for (const o of offense) {
    if (o.role !== 'WR') continue;
    if (o === G.ballCarrier) continue; // once caught, the player drives

    const depth = o.startY - o.s.y; // yards upfield since the snap
    let vx = 0, vy = -WR_SPEED;

    if (o.route === 'streak') {
      vx = 0;                                   // straight up the field
    } else if (o.route === 'slant') {
      if (depth > 70) { vx = WR_SPEED * 0.7; vy = -WR_SPEED * 0.6; } // cut inside
    } else if (o.route === 'out') {
      if (depth > 110) { vx = -WR_SPEED * 0.7; vy = -WR_SPEED * 0.4; } // break to sideline
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
// DEFENSE — rush the QB, cover receivers, chase the ball
// ============================================================
function updateDefense(elapsed) {
  const carrier = G.ballCarrier.s;
  const qbHasBall = G.ballCarrier === offense[0] && !G.hasPassed;

  for (const d of defense) {
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
      // Linebackers hesitate a beat, then pursue the ball carrier.
      if (elapsed < 0.3) { d.s.setVelocity(0, 0); continue; }
      tx = carrier.x; ty = carrier.y;
    } else { // DB
      // Cover your receiver — stay on the goal side (just above him).
      const wr = offense.find(o => o.role === 'WR' && o.num === d.cover);
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
      endPlay('tackle');
      return;
    }
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
function endPlay(result) {
  freezeEveryone();
  let msg, next;

  if (result === 'touchdown') {
    G.score += 7;
    msg = 'TOUCHDOWN!  +7';
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
        msg = result === 'incomplete' ? 'INCOMPLETE' : 'TACKLE';
        next = { los: spot, down: nd, fd: G.firstDownYards };
      }
    }
  }

  G.next = next;
  G.state = 'dead';
  G.deadUntil = G.scene.time.now + 1600;
  showBanner(msg, result === 'touchdown');
}

// ============================================================
// SETTING UP A PLAY — line all 14 players up at the LOS
// ============================================================
function startDrive() {
  G.score = G.score; // keep score across drives
  setupPlay({ los: 20, down: 1, fd: 30 });
}

function startNextPlay() {
  setupPlay(G.next);
}

function setupPlay(next) {
  G.down = next.down;
  G.losYards = next.los;
  G.firstDownYards = next.fd;
  G.losY = yardsToY(G.losYards);
  G.hasPassed = false;
  G.ballCarrier = offense[0];
  ballFollow = true;

  const L = G.losY;
  place(offense[0], 266, L + 60);   // QB
  place(offense[1], 55,  L + 14);   // WR1 (left)
  place(offense[2], 478, L + 14);   // WR2 (right)
  place(offense[3], 150, L + 26);   // WR3 (slot)
  place(offense[4], 226, L + 16);   // OL
  place(offense[5], 266, L + 16);   // OL
  place(offense[6], 306, L + 16);   // OL
  offense[1].startY = offense[1].s.y;
  offense[2].startY = offense[2].s.y;
  offense[3].startY = offense[3].s.y;

  place(defense[0], 246, L - 16);   // DL
  place(defense[1], 286, L - 16);   // DL
  place(defense[2], 226, L - 46);   // LB
  place(defense[3], 306, L - 46);   // LB
  place(defense[4], 60,  L - 28);   // DB on WR1
  place(defense[5], 473, L - 28);   // DB on WR2
  place(defense[6], 150, L - 40);   // DB on WR3

  G.state = 'presnap';
  G.scene.cameras.main.startFollow(offense[0].s, true, 0.12, 0.12);
  updateBall();
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
  // Number labels on QB and receivers so passing targets are obvious
  if (role === 'QB' || role === 'WR') {
    const txt = role === 'QB' ? 'QB' : String(opts.num);
    o.label = scene.add.text(0, 0, txt, {
      fontFamily: 'Arial Black, Arial', fontSize: '13px', color: '#ffffff',
      stroke: '#000', strokeThickness: 3
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

  hud.score.setText('SCORE: ' + G.score);

  const toGo = G.firstDownYards - G.losYards;
  const distTxt = (G.firstDownYards >= 100) ? 'GOAL' : String(Math.max(0, Math.round(toGo)));
  hud.down.setText(`${ordinal(G.down)} & ${distTxt}`);
  hud.spot.setText('Ball on the ' + describeSpot(G.losYards));

  if (G.state === 'presnap') {
    hud.help.setText('Press SPACE to hike the ball');
  } else if (G.state === 'live' && G.ballCarrier === offense[0] && !G.hasPassed) {
    hud.help.setText('Arrows = run    1 / 2 / 3 = pass to that receiver');
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
  scene.add.text(FIELD_WIDTH / 2, FIELD_LENGTH - ENDZONE / 2, 'MAX FC', {
    fontFamily: 'Arial Black, Arial', fontSize: '30px', color: '#ffffff'
  }).setOrigin(0.5).setAlpha(0.7);
}

function makeChibiTexture(scene, key, color) {
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  g.fillStyle(color);           g.fillEllipse(20, 26, 30, 16);   // shoulder pads
  g.fillStyle(0xd9a066);        g.fillCircle(5, 26, 4);          // arms
  g.fillCircle(35, 26, 4);
  g.fillStyle(color);           g.fillCircle(20, 16, 13);        // BIG helmet
  g.fillStyle(0xffffff);        g.fillCircle(20, 16, 10);
  g.fillStyle(color);           g.fillCircle(20, 16, 9);
  g.fillStyle(0xffffff);        g.fillRect(18, 3, 4, 13);        // helmet stripe
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
