// ============================================================
// KICK IT! — the kicking mini-game (behind-the-kicker view)
// ------------------------------------------------------------
// You stand BEHIND the ball and look up the field at the yellow
// goalposts far away. Three easy steps, one tap each:
//   1) AIM   — a crosshair slides left/right. Tap to stop it
//              between the posts.
//   2) POWER — a bar fills up. Tap to stop it high enough to
//              reach the goal.
//   3) KICK! — the ball flies. Between the posts = IT'S GOOD!
//
// This whole thing is ONE reusable piece called `KickGame`.
//   • The practice page (kick.html) uses it by itself.
//   • The real game (main.js) drops it on top of the field on 4th down.
// Both share this exact code — so we only fix bugs in one place.
//
// How another file drives it:
//   KickGame.enter(scene, { mode:'fg', distance:42, onDone: fn });
//   ...call KickGame.update(delta) every frame while it's active...
//   ...KickGame calls your onDone(result) when the kick is finished.
// ============================================================

window.KickGame = (function () {
  // ---- Where things sit on the 540x720 screen ----
  const W = 540, H = 720;
  const GOAL_Y      = 250;   // the crossbar height on screen (lower + nearer = a bigger goal)
  const GOAL_CENTER = 270;   // middle of the goal (screen x)
  const POST_LEFT   = 210;   // inside edge of the left upright (wider gate)
  const POST_RIGHT  = 330;   // inside edge of the right upright
  const POST_TOP    = 120;   // how high the uprights reach (taller uprights)
  const BALL_X = 270, BALL_Y = 636;  // the ball's spot on the tee

  // ---- How the meters move (tune to taste) ----
  const AIM_SPEED   = 190;   // base speed the aim crosshair slides (px/sec)
  const AIM_LEFT    = 186;   // crosshair swings between these x's (24px outside the left post)
  const AIM_RIGHT   = 354;   //                                   (24px outside the right post)
  const POWER_SPEED = 1.6;   // how fast the power bar fills (per sec)
  const MAX_PUNT    = 55;    // a full-power punt goes this many yards

  // ---- Colors ----
  const SKY_TOP = 0x0b1020, SKY_LOW = 0x1a2a4a, CROWD = 0x11162b;
  const FIELD_NEAR = 0x379437, GOAL_GOLD = 0xffd400;

  // ---- Private state for the current kick ----
  const K = {
    scene: null,
    active: false,
    mode: 'fg',        // 'fg' = field goal, 'punt' = punt
    distance: 40,      // how far the kick is, in yards
    points: 3,         // what a MADE kick is worth (field goal 3, extra point 1)
    standalone: false, // true on the practice page (loops forever)
    onDone: null,      // the function to call when the kick is over
    powerToReach: 0.55,// how much power you need for THIS distance
    aimSpeed: AIM_SPEED,

    state: 'aim',      // aim -> power -> kick -> result
    aimX: GOAL_CENTER, aimDir: 1,
    power: 0, powerDir: 1,
    lockedAim: 0, lockedPower: 0,

    // practice-page scoreboard
    made: 0, streak: 0, best: 0,

    // display objects (kept so we can clean them all up)
    objs: [],
    ball: null, crosshair: null, powerBar: null,
    hud: null, hint: null, distLabel: null, banner: null,
    flight: null,       // the ball-flight tween (so we can stop it)

    // input handlers (kept so we can unhook them)
    onPointer: null, onSpace: null, canvas: null,
  };

  // ---- tiny helpers ----
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function bigStyle(size, color) {
    return { fontFamily: 'Arial Black, Arial', fontSize: size + 'px', color,
             stroke: '#000', strokeThickness: 4 };
  }
  // Every visible thing goes on TOP of the game and stays glued to the
  // screen (scrollFactor 0) even when the game's camera is scrolled away.
  function keep(obj) { obj.setScrollFactor(0).setDepth(110); K.objs.push(obj); return obj; }

  // ==========================================================
  // ENTER — start a kick. `scene` is any Phaser scene to draw into.
  // ==========================================================
  function enter(scene, opts) {
    K.scene = scene;
    K.mode = opts.mode || 'fg';
    K.distance = opts.distance || 40;
    K.points = (opts.points != null) ? opts.points : 3;  // 3 for a field goal, 1 for an extra point
    K.standalone = !!opts.standalone;
    K.onDone = opts.onDone || null;
    K.active = true;

    // Longer kicks are harder: you need more power, and the aim swings faster.
    K.powerToReach = clamp(0.30 + (K.distance - 17) / 70, 0.35, 0.92);
    K.aimSpeed = AIM_SPEED * (1 + (K.distance - 34) / 130);

    makeTextures(scene);
    buildView(scene);

    // A punt is just "boot it far" — no aiming, so skip straight to power.
    K.aimX = GOAL_CENTER; K.aimDir = 1;
    K.power = 0; K.powerDir = 1;
    K.state = (K.mode === 'punt') ? 'power' : 'aim';

    // One tap (or SPACE) does the next step. We listen for a plain DOM tap
    // right on the game canvas — the SAME dependable way the on-screen D-pad
    // buttons work on the iPad. (Phaser's own canvas input was missing taps
    // in this overlay, so the kick screen felt frozen when you tapped.)
    // Tapping the FIELD GOAL / PUNT button doesn't reach the canvas (it's a
    // separate element), so entering a kick never counts as your first tap.
    K.onPointer = () => tap();
    K.onSpace = () => tap();
    K.canvas = scene.sys.game.canvas;
    if (K.canvas) K.canvas.addEventListener('pointerdown', K.onPointer);
    scene.input.keyboard.on('keydown-SPACE', K.onSpace);

    updateHUD();
  }

  // ==========================================================
  // EXIT — tear everything down (so nothing leaks between kicks)
  // ==========================================================
  function exit() {
    if (K.flight) { K.flight.stop(); K.flight = null; }
    if (K.canvas) K.canvas.removeEventListener('pointerdown', K.onPointer);
    if (K.scene) {
      K.scene.input.keyboard.off('keydown-SPACE', K.onSpace);
    }
    for (const o of K.objs) o.destroy();
    K.objs = [];
    K.ball = K.crosshair = K.powerBar = K.hud = K.hint = K.distLabel = K.banner = null;
    K.active = false;
  }

  function isActive() { return K.active; }

  // ==========================================================
  // UPDATE — slide the meters while we're aiming / powering up
  // ==========================================================
  function update(delta) {
    if (!K.active) return;
    const dt = delta / 1000;

    if (K.state === 'aim') {
      K.aimX += K.aimDir * K.aimSpeed * dt;
      if (K.aimX > AIM_RIGHT) { K.aimX = AIM_RIGHT; K.aimDir = -1; }
      if (K.aimX < AIM_LEFT)  { K.aimX = AIM_LEFT;  K.aimDir = 1; }
      K.crosshair.setPosition(K.aimX, GOAL_Y - 30).setVisible(true);
    }

    if (K.state === 'power') {
      K.power += K.powerDir * POWER_SPEED * dt;
      if (K.power > 1) { K.power = 1; K.powerDir = -1; }
      if (K.power < 0) { K.power = 0; K.powerDir = 1; }
    }

    drawPowerBar();
  }

  // ==========================================================
  // THE STEPS — one tap moves to the next
  // ==========================================================
  function tap() {
    if (!K.active) return;
    if (K.state === 'aim')         lockAim();
    else if (K.state === 'power')  lockPower();
    else if (K.state === 'result') afterResult();
    // during 'kick' the ball is flying — taps do nothing
  }

  function lockAim() {
    K.lockedAim = K.aimX;
    K.state = 'power';
    K.power = 0; K.powerDir = 1;
    updateHUD();
  }

  function lockPower() {
    K.lockedPower = K.power;
    K.state = 'kick';
    doKick();
  }

  // Fly the ball toward wherever you aimed, with your power.
  function doKick() {
    if (K.crosshair) K.crosshair.setVisible(false);
    const result = judge();

    // A punt always goes straight ahead; a field goal goes where you aimed.
    const endX = (K.mode === 'punt') ? GOAL_CENTER : K.lockedAim;
    // Where the ball ends up depends on the outcome:
    //   good  -> sail UP through the uprights and rest BETWEEN them, above the crossbar (a clear make!)
    //   wide  -> arc to about crossbar height but off to the SIDE of a post (missed)
    //   short -> die low, well below the bar
    //   punt  -> boom high up the middle and away (a big kick, NOT a made field goal)
    let endY, endScale, arcPeak;
    if (result === 'short')     { endY = 430;    endScale = 0.55; arcPeak = 60;  }
    else if (result === 'wide') { endY = GOAL_Y; endScale = 0.34; arcPeak = 110; }
    else if (result === 'punt') { endY = 96;     endScale = 0.30; arcPeak = 70;  }
    else                        { endY = 205;    endScale = 0.42; arcPeak = 95;  }  // GOOD: through & between the posts

    const p = { t: 0 };
    K.flight = K.scene.tweens.add({
      targets: p, t: 1, duration: 950, ease: 'Sine.Out',
      onUpdate: () => {
        const t = p.t;
        const x = Phaser.Math.Linear(BALL_X, endX, t);
        const y = Phaser.Math.Linear(BALL_Y, endY, t) - arcPeak * Math.sin(Math.PI * t);
        K.ball.setPosition(x, y).setScale(Phaser.Math.Linear(1, endScale, t));
        K.ball.setRotation(t * 8);
      },
      onComplete: () => { K.flight = null; showResult(result); }
    });
  }

  // Work out the outcome from the locked-in aim + power.
  function judge() {
    // A punt ALWAYS gets away — power just decides how far, never a miss.
    if (K.mode === 'punt') return 'punt';
    // A field goal needs enough power to reach, and good aim between the posts.
    const reaches = K.lockedPower >= K.powerToReach;
    if (!reaches) return 'short';
    const between = K.lockedAim >= POST_LEFT && K.lockedAim <= POST_RIGHT;
    return between ? 'good' : 'wide';
  }

  function showResult(result) {
    K.state = 'result';
    if (result === 'good') {
      K.made++; K.streak++; K.best = Math.max(K.best, K.streak);
      showBanner("IT'S GOOD!  +" + K.points, '#ffe066');
    } else if (result === 'punt') {
      const yds = Math.round(20 + K.lockedPower * MAX_PUNT);
      showBanner('NICE PUNT!  ' + yds + ' YDS', '#ffe066');
    } else if (result === 'short') {
      K.streak = 0;
      showBanner('NO GOOD — SHORT!', '#ff8080');
    } else {
      K.streak = 0;
      showBanner('NO GOOD — WIDE!', '#ff8080');
    }
    updateHUD();
  }

  // After the result, either loop (practice page) or hand control back.
  function afterResult() {
    if (K.standalone) {
      // Practice: reset the ball and pick a fresh distance to try.
      resetForNext();
      return;
    }
    // In the real game: tell main.js what happened, then clean up.
    const result = judge();
    const cb = K.onDone;
    const payload = {
      mode: K.mode,
      made: (result === 'good'),
      outcome: result,
      distance: K.distance,
      points: K.points,
      puntYards: Math.round(20 + K.lockedPower * MAX_PUNT),
    };
    exit();
    if (cb) cb(payload);
  }

  // Practice-page only: put the ball back and try a new distance.
  function resetForNext() {
    K.ball.setPosition(BALL_X, BALL_Y).setScale(1).setRotation(0);
    K.distance = Phaser.Math.Between(23, 50);
    K.powerToReach = clamp(0.30 + (K.distance - 17) / 70, 0.35, 0.92);
    K.aimSpeed = AIM_SPEED * (1 + (K.distance - 34) / 130);
    K.aimX = GOAL_CENTER; K.aimDir = 1;
    K.power = 0; K.powerDir = 1;
    K.state = 'aim';
    if (K.banner) { K.banner.destroy(); K.banner = null; }
    updateHUD();
  }

  // ==========================================================
  // METERS + TEXT
  // ==========================================================
  function drawPowerBar() {
    const g = K.powerBar;
    if (!g) return;
    g.clear();
    if (K.state !== 'power' && K.state !== 'kick' && K.state !== 'result') return;

    const x = 34, top = 300, bottom = 636, w = 26, h = bottom - top;
    g.fillStyle(0x000000, 0.45); g.fillRoundedRect(x, top, w, h, 6);
    // Green "reach zone": stop the bar in here (or higher) to reach the goal.
    const zoneBot = top + h * (1 - K.powerToReach);
    g.fillStyle(0x2ecc40, 0.30); g.fillRect(x, top, w, zoneBot - top);
    const level = (K.state === 'power') ? K.power : K.lockedPower;
    const fillH = h * level;
    g.fillStyle(level >= K.powerToReach ? 0x2ecc40 : 0xffcc00, 1);
    g.fillRoundedRect(x, bottom - fillH, w, fillH, 6);
    g.lineStyle(2, 0xffffff, 0.8); g.strokeRoundedRect(x, top, w, h, 6);
  }

  function updateHUD() {
    // Top line: scoreboard on the practice page, or the kick name in-game.
    if (K.standalone) {
      K.hud.setText(`MADE ${K.made}   ·   STREAK ${K.streak}   ·   BEST ${K.best}`);
    } else {
      K.hud.setText(K.mode === 'punt' ? 'PUNT' : `${Math.round(K.distance)}-YD FIELD GOAL`);
    }
    // The distance badge under the goal (nice for judging power).
    if (K.distLabel) K.distLabel.setText(K.mode === 'punt' ? 'BOOT IT!' : Math.round(K.distance) + ' yd');

    if (K.state === 'aim')         K.hint.setText('TAP to AIM  ⟵ ⟶');
    else if (K.state === 'power')  K.hint.setText(K.mode === 'punt' ? 'TAP to BOOT it' : 'TAP to set POWER');
    else if (K.state === 'kick')   K.hint.setText('');
    else if (K.state === 'result') K.hint.setText(K.standalone ? 'TAP to kick again' : 'TAP to continue');
  }

  function showBanner(text, color) {
    if (K.banner) K.banner.destroy();
    K.banner = keep(K.scene.add.text(W / 2, 380, text, {
      fontFamily: 'Arial Black, Arial', fontSize: '38px',
      color, stroke: '#000', strokeThickness: 7
    }).setOrigin(0.5).setDepth(120).setScale(0));
    K.scene.tweens.add({ targets: K.banner, scale: 1, duration: 300, ease: 'Back.Out' });
  }

  // ==========================================================
  // BUILDING THE VIEW (all drawn in code)
  // ==========================================================
  function buildView(scene) {
    // Opaque backdrop so the football field underneath is hidden.
    const bg = scene.add.graphics();
    drawStadium(bg);
    keep(bg).setDepth(100);

    const goal = scene.add.graphics();
    drawGoalposts(goal);
    keep(goal).setDepth(102);

    // The kicker (a chibi guy) stands just below the ball, closest to us.
    keep(scene.add.sprite(BALL_X, BALL_Y + 46, 'k_kicker')).setDepth(104);
    // The football on its tee.
    K.ball = keep(scene.add.sprite(BALL_X, BALL_Y, 'k_ball')).setDepth(106);

    // The aim crosshair (hidden until we're aiming).
    K.crosshair = keep(scene.add.sprite(GOAL_CENTER, GOAL_Y - 30, 'k_cross'))
      .setDepth(108).setVisible(false);

    // The power meter graphics (redrawn every frame).
    K.powerBar = keep(scene.add.graphics()).setDepth(108);

    // Text: top line, a distance badge, and the "what to do" hint.
    K.hud   = keep(scene.add.text(W / 2, 26, '', bigStyle(18, '#ffe066')).setOrigin(0.5));
    K.distLabel = keep(scene.add.text(GOAL_CENTER, GOAL_Y + 56, '', bigStyle(14, '#ffffff')).setOrigin(0.5));
    K.hint  = keep(scene.add.text(W / 2, 486, '', bigStyle(20, '#ffffff')).setOrigin(0.5));
  }

  function drawStadium(g) {
    // Fill the WHOLE screen first so the football field underneath is fully
    // hidden — the dark green becomes the "grass" apron beside the field.
    g.fillStyle(0x14331a); g.fillRect(0, 0, W, H);
    g.fillStyle(SKY_TOP); g.fillRect(0, 0, W, 120);
    g.fillStyle(SKY_LOW); g.fillRect(0, 120, W, 60);
    g.fillStyle(CROWD);   g.fillRect(0, 150, W, 40);
    const fanColors = [0xffd400, 0xffffff, 0x4fa3ff, 0xff6b6b, 0x8cff8c];
    for (let i = 0; i < 120; i++) {
      g.fillStyle(fanColors[i % fanColors.length], 0.9);
      g.fillCircle((i * 37) % W, 156 + ((i * 13) % 30), 2);
    }
    // The field as a trapezoid: wide down here, narrow far away = a 3D feel.
    const topL = 150, topR = 390, botL = 0, botR = W, horizon = 180;
    g.fillStyle(FIELD_NEAR);
    g.beginPath();
    g.moveTo(botL, H); g.lineTo(botR, H); g.lineTo(topR, horizon); g.lineTo(topL, horizon);
    g.closePath(); g.fillPath();
    // Yard lines (they bunch toward the top = perspective).
    g.lineStyle(3, 0xffffff, 0.5);
    for (let i = 1; i <= 7; i++) {
      const t = i / 8;
      const y = Phaser.Math.Linear(H, horizon, t);
      g.beginPath();
      g.moveTo(Phaser.Math.Linear(botL, topL, t), y);
      g.lineTo(Phaser.Math.Linear(botR, topR, t), y);
      g.strokePath();
    }
  }

  function drawGoalposts(g) {
    g.fillStyle(GOAL_GOLD, 1);
    const thick = 6;
    g.fillRect(GOAL_CENTER - thick / 2, GOAL_Y, thick, 40);                                   // base pole
    g.fillRect(POST_LEFT - thick, GOAL_Y - thick / 2, (POST_RIGHT - POST_LEFT) + thick * 2, thick); // crossbar
    g.fillRect(POST_LEFT - thick, POST_TOP, thick, GOAL_Y - POST_TOP);                        // left upright
    g.fillRect(POST_RIGHT, POST_TOP, thick, GOAL_Y - POST_TOP);                               // right upright
  }

  // Make the little pictures once, then reuse them for every kick.
  function makeTextures(scene) {
    if (!scene.textures.exists('k_cross')) {
      const g = scene.make.graphics({ x: 0, y: 0, add: false });
      g.lineStyle(3, 0xffffff, 1);
      g.strokeCircle(20, 20, 12);
      g.beginPath(); g.moveTo(2, 20); g.lineTo(38, 20); g.strokePath();
      g.beginPath(); g.moveTo(20, 2); g.lineTo(20, 38); g.strokePath();
      g.generateTexture('k_cross', 40, 40); g.destroy();
    }
    if (!scene.textures.exists('k_ball')) {
      const g = scene.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0x8B4513); g.fillEllipse(11, 8, 20, 13);
      g.lineStyle(2, 0xffffff); g.beginPath(); g.moveTo(5, 8); g.lineTo(17, 8); g.strokePath();
      for (let i = 7; i <= 15; i += 2) { g.beginPath(); g.moveTo(i, 6); g.lineTo(i, 10); g.strokePath(); }
      g.generateTexture('k_ball', 22, 16); g.destroy();
    }
    if (!scene.textures.exists('k_kicker')) {
      // Dress the kicker in your team's colors if the main game set them
      // (window.TEAM); otherwise fall back to the old blue (e.g. practice page).
      const T = window.TEAM || {};
      const jersey = (T.jersey != null) ? T.jersey : 0x1f4fd8;
      const helmet = (T.helmet != null) ? T.helmet : 0x1f4fd8;
      const g = scene.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(jersey);   g.fillEllipse(20, 30, 32, 18);   // body (jersey)
      g.fillStyle(0xd9a066); g.fillCircle(5, 30, 4); g.fillCircle(35, 30, 4);  // arms
      g.fillStyle(helmet);   g.fillCircle(20, 16, 14);        // helmet
      g.fillStyle(0xffffff); g.fillCircle(20, 16, 10);
      g.fillStyle(helmet);   g.fillCircle(20, 16, 9);
      g.fillStyle(0xffffff); g.fillRect(18, 2, 4, 14);        // stripe
      g.generateTexture('k_kicker', 40, 40); g.destroy();
    }
  }

  // What other files are allowed to call.
  // (peek() is just a window into the current kick, handy from the console.)
  return {
    enter, exit, update, tap, isActive,
    peek: () => ({ state: K.state, mode: K.mode, active: K.active,
                   outcome: judge(), lockedPower: K.lockedPower,
                   powerToReach: K.powerToReach, distance: K.distance }),
  };
})();
