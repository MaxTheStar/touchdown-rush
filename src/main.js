// ============================================================
// TOUCHDOWN RUSH — Session 1: The field + your first player
// ------------------------------------------------------------
// A real football field is 53.3 yards wide and 120 yards long
// (100 yards of play + two 10-yard endzones).
// In our game world: 1 yard = 10 pixels.
// ============================================================

const PX_PER_YARD = 10;
const FIELD_WIDTH = 533;                  // 53.3 yards wide
const FIELD_LENGTH = 120 * PX_PER_YARD;   // 120 yards long
const ENDZONE = 10 * PX_PER_YARD;         // each endzone is 10 yards deep

// Colors
const GRASS_DARK = 0x2d7a2d;
const GRASS_LIGHT = 0x379437;
const HOME_COLOR = 0x1f4fd8;   // Max's team: blue
const ENDZONE_COLOR = 0x14337a;

const config = {
  type: Phaser.AUTO,
  width: 540,
  height: 720,
  parent: 'game-container',
  backgroundColor: '#2d7a2d',
  physics: {
    default: 'arcade',
    arcade: { debug: false }
  },
  scene: { create, update }
};

let player;
let cursors;
let score = 0;
let scoreText;
let yardText;
let celebrating = false;

new Phaser.Game(config);

// ------------------------------------------------------------
// CREATE: runs once at the start — build the field and player
// ------------------------------------------------------------
function create() {
  drawField(this);

  // Our chibi player: BIG helmet, tiny shoulders. Drawn in code
  // for now — Max can replace this with real sprite art later.
  createChibiTexture(this, 'player-blue', HOME_COLOR);

  // Start at your own 20-yard line (20 yards from your own goal line)
  player = this.physics.add.sprite(FIELD_WIDTH / 2, yardsToY(20), 'player-blue');
  player.setCollideWorldBounds(true);

  // The world is the whole field; the camera follows the player
  this.physics.world.setBounds(0, 0, FIELD_WIDTH, FIELD_LENGTH);
  this.cameras.main.setBounds(0, 0, FIELD_WIDTH, FIELD_LENGTH);
  this.cameras.main.startFollow(player, true, 0.1, 0.1);

  cursors = this.input.keyboard.createCursorKeys();

  // HUD — stays glued to the screen while the field scrolls
  scoreText = this.add.text(12, 10, 'SCORE: 0', hudStyle(18))
    .setScrollFactor(0).setDepth(10);
  yardText = this.add.text(12, 36, '', hudStyle(14, '#ffe066'))
    .setScrollFactor(0).setDepth(10);
}

// ------------------------------------------------------------
// UPDATE: runs ~60 times per second — the game's heartbeat
// ------------------------------------------------------------
function update() {
  if (celebrating) return; // freeze controls during the celebration

  const speed = 220;
  let vx = 0, vy = 0;

  if (cursors.left.isDown) vx = -speed;
  else if (cursors.right.isDown) vx = speed;
  if (cursors.up.isDown) vy = -speed;
  else if (cursors.down.isDown) vy = speed;

  // Running diagonally shouldn't be faster than running straight
  if (vx !== 0 && vy !== 0) { vx *= 0.707; vy *= 0.707; }

  player.setVelocity(vx, vy);

  // Face the direction you're running
  if (vx !== 0 || vy !== 0) {
    player.setRotation(Math.atan2(vy, vx) + Math.PI / 2);
  }

  // HUD: show which yard line you're on
  const yards = yYards(player.y);
  if (yards <= 0) {
    touchdown(this);
  } else if (yards >= 100) {
    yardText.setText('YOUR OWN ENDZONE — RUN! →');
  } else {
    yardText.setText(`${Math.ceil(yards)} YARDS TO GO`);
  }
}

// ------------------------------------------------------------
// TOUCHDOWN! +7 points (6 + extra point, automatic for now)
// ------------------------------------------------------------
function touchdown(scene) {
  if (celebrating) return;
  celebrating = true;

  score += 7;
  scoreText.setText('SCORE: ' + score);
  player.setVelocity(0, 0);

  const banner = scene.add.text(270, 320, 'TOUCHDOWN!', {
    fontFamily: 'Arial Black, Arial',
    fontSize: '52px',
    color: '#ffe066',
    stroke: '#000',
    strokeThickness: 8
  }).setOrigin(0.5).setScrollFactor(0).setDepth(20).setScale(0);

  scene.tweens.add({
    targets: banner,
    scale: 1,
    duration: 400,
    ease: 'Back.Out',
    yoyo: true,
    hold: 900,
    onComplete: () => {
      banner.destroy();
      // Line up at your own 20 for the next drive
      player.setPosition(FIELD_WIDTH / 2, yardsToY(20));
      player.setRotation(0);
      celebrating = false;
    }
  });
}

// ------------------------------------------------------------
// FIELD DRAWING — stripes, yard lines, numbers, endzones
// ------------------------------------------------------------
function drawField(scene) {
  const g = scene.add.graphics();

  // Alternating grass stripes, one per 10 yards
  for (let i = 0; i < 12; i++) {
    g.fillStyle(i % 2 === 0 ? GRASS_DARK : GRASS_LIGHT);
    g.fillRect(0, i * 10 * PX_PER_YARD, FIELD_WIDTH, 10 * PX_PER_YARD);
  }

  // Endzones (top = the one you score in, bottom = your own)
  g.fillStyle(ENDZONE_COLOR);
  g.fillRect(0, 0, FIELD_WIDTH, ENDZONE);
  g.fillRect(0, FIELD_LENGTH - ENDZONE, FIELD_WIDTH, ENDZONE);

  // Yard lines every 5 yards
  for (let yd = 0; yd <= 100; yd += 5) {
    const y = ENDZONE + yd * PX_PER_YARD;
    g.lineStyle(yd % 10 === 0 ? 3 : 1.5, 0xffffff, yd % 10 === 0 ? 0.9 : 0.5);
    g.beginPath();
    g.moveTo(0, y);
    g.lineTo(FIELD_WIDTH, y);
    g.strokePath();
  }

  // Hash marks every yard, two columns like a real field
  g.lineStyle(1, 0xffffff, 0.35);
  for (let yd = 0; yd < 100; yd++) {
    const y = ENDZONE + yd * PX_PER_YARD;
    for (const x of [FIELD_WIDTH * 0.35, FIELD_WIDTH * 0.65]) {
      g.beginPath();
      g.moveTo(x - 4, y);
      g.lineTo(x + 4, y);
      g.strokePath();
    }
  }

  // Yard numbers every 10 yards (NFL style: counts up to 50, back down)
  for (let yd = 10; yd <= 90; yd += 10) {
    const label = String(yd <= 50 ? yd : 100 - yd);
    for (const x of [40, FIELD_WIDTH - 40]) {
      scene.add.text(x, ENDZONE + yd * PX_PER_YARD, label, {
        fontFamily: 'Arial Black, Arial',
        fontSize: '22px',
        color: '#ffffff'
      }).setOrigin(0.5).setAlpha(0.55);
    }
  }

  // Endzone lettering
  scene.add.text(FIELD_WIDTH / 2, ENDZONE / 2, 'TOUCHDOWN', {
    fontFamily: 'Arial Black, Arial', fontSize: '34px', color: '#ffe066'
  }).setOrigin(0.5).setAlpha(0.9);
  scene.add.text(FIELD_WIDTH / 2, FIELD_LENGTH - ENDZONE / 2, 'MAX FC', {
    fontFamily: 'Arial Black, Arial', fontSize: '34px', color: '#ffffff'
  }).setOrigin(0.5).setAlpha(0.7);
}

// ------------------------------------------------------------
// CHIBI PLAYER TEXTURE — big helmet, small body, drawn in code
// ------------------------------------------------------------
function createChibiTexture(scene, key, jerseyColor) {
  const g = scene.make.graphics({ x: 0, y: 0, add: false });

  // Small shoulder pads (seen from above)
  g.fillStyle(jerseyColor);
  g.fillEllipse(20, 26, 30, 16);

  // Tiny arms
  g.fillStyle(0xd9a066); // skin
  g.fillCircle(5, 26, 4);
  g.fillCircle(35, 26, 4);

  // BIG helmet — the chibi signature
  g.fillStyle(jerseyColor);
  g.fillCircle(20, 16, 13);
  g.fillStyle(0xffffff);
  g.fillCircle(20, 16, 10);
  g.fillStyle(jerseyColor);
  g.fillCircle(20, 16, 9);

  // Helmet center stripe
  g.fillStyle(0xffffff);
  g.fillRect(18, 3, 4, 26 - 13);

  g.generateTexture(key, 40, 36);
  g.destroy();
}

// ------------------------------------------------------------
// Yard-math helpers: convert between world pixels and yard lines
// ------------------------------------------------------------
function yardsToY(yardsFromOwnGoal) {
  // Your own goal line is at the BOTTOM of the world
  return FIELD_LENGTH - ENDZONE - yardsFromOwnGoal * PX_PER_YARD;
}

function yYards(y) {
  // How many yards from the opponent's goal line (0 = touchdown!)
  return (y - ENDZONE) / PX_PER_YARD;
}

function hudStyle(size, color = '#ffffff') {
  return {
    fontFamily: 'Arial Black, Arial',
    fontSize: size + 'px',
    color,
    stroke: '#000',
    strokeThickness: 4
  };
}
