// ============================================================
// TOUCHDOWN RUSH — ads.js: ANIMATED COMMERCIALS for the TV breaks 📺
// ------------------------------------------------------------
// When a quarter ends, the game cuts to a commercial — and now the
// commercials MOVE: products slide in, bubbles rise, cleats dash,
// confetti falls. Each one is a little animated TV spot drawn and
// animated right on the game canvas (no video files needed — the
// same trick real motion graphics use: shapes + movement + timing).
//
// Every sponsor is still 100% made up (that's the law of this game),
// but the vibe is "real TV commercial with a wink", not goofy.
//
// main.js calls  TDAds.play(scene)  during a break, and calls
// .destroy() on what it gets back when the break ends.
// ------------------------------------------------------------
// WANT TO ADD YOUR OWN AD? Copy one of the entries in ADS below,
// change the brand + tagline + colors, and build the scene from
// rectangles, circles, text and tweens. Ship it. That's it!
// ============================================================
(function () {
  'use strict';

  // The ad "TV screen" — the card the commercial plays inside.
  // (Screen space is 540x720; the card sits under the scoreboard.)
  const CARD = { x: 60, y: 246, w: 420, h: 238 };
  const CX = 270;              // center of the screen (and the card)
  const STAGE_Y = 330;         // where the product usually sits
  const BRAND_Y = 428;         // the brand name line
  const TAG_Y = 460;           // the tagline under it

  // ---- THE COMMERCIALS ---------------------------------------------------
  // Each one: a brand, a color, a tagline, and a build() that animates the
  // scene. build() gets the scene plus two helpers:
  //   obj(o)   — "this is part of my ad" (so it gets cleaned up after)
  //   tween(c) — "run this animation" (also cleaned up after)
  const ADS = [

    { brand: 'CHILL COLA', color: 0x18a7d8, tag: 'Ice cold. Game on.',
      build(s, obj, tween) {
        // A frosty can slides up, bubbles rise, sparkles twinkle.
        const can = obj(s.add.container(CX, STAGE_Y + 210));
        const g = s.add.graphics();
        g.fillStyle(0xd8e0ea, 1); g.fillRoundedRect(-30, -48, 60, 96, 10);   // the can
        g.fillStyle(0x18a7d8, 1); g.fillRect(-30, -20, 60, 40);              // the label band
        g.fillStyle(0xb9c3d1, 1); g.fillRoundedRect(-24, -54, 48, 8, 3);     // the top rim
        can.add(g);
        can.add(s.add.text(0, 0, 'CHILL', { fontFamily: 'Arial Black, Arial',
          fontSize: '16px', color: '#ffffff' }).setOrigin(0.5));
        tween({ targets: can, y: STAGE_Y + 8, duration: 700, ease: 'Back.Out' });

        for (let i = 0; i < 6; i++) {                                        // rising bubbles
          const b = obj(s.add.circle(CX - 50 + i * 20, STAGE_Y + 70, 3 + (i % 3), 0xffffff, 0.7)
            .setScrollFactor(0).setDepth(62));
          tween({ targets: b, y: STAGE_Y - 60, alpha: 0, duration: 1600,
                  delay: 500 + i * 260, repeat: -1 });
        }
        for (const [dx, dy] of [[-70, -40], [64, -55], [78, 20]]) {          // frost sparkles
          const sp = obj(s.add.text(CX + dx, STAGE_Y + dy, '✦', { fontSize: '20px',
            color: '#bfeaff' }).setOrigin(0.5).setScrollFactor(0).setDepth(62));
          tween({ targets: sp, alpha: 0.1, duration: 500, yoyo: true, repeat: -1,
                  delay: Math.random() * 400 });
        }
      } },

    { brand: 'APEX CLEATS', color: 0xd83a3a, tag: 'Engineered for the end zone.',
      build(s, obj, tween) {
        // A cleat sprints in with speed lines, lands, and gently bobs.
        const shoe = obj(s.add.container(-160, STAGE_Y + 20));
        const g = s.add.graphics();
        g.fillStyle(0xd83a3a, 1); g.fillRoundedRect(-48, -30, 84, 34, { tl: 18, tr: 12, bl: 2, br: 2 });
        g.fillStyle(0x101820, 1); g.fillRect(-48, 4, 96, 10);                // the sole
        for (let i = 0; i < 4; i++) { g.fillRect(-40 + i * 24, 14, 8, 8); }  // the studs
        g.lineStyle(3, 0xffffff, 0.9);                                       // the laces
        for (let i = 0; i < 3; i++) { g.lineBetween(-20 + i * 14, -26, -8 + i * 14, -10); }
        shoe.add(g);
        tween({ targets: shoe, x: CX, duration: 650, ease: 'Cubic.Out' });
        tween({ targets: shoe, y: STAGE_Y + 14, duration: 900, yoyo: true,
                repeat: -1, delay: 700, ease: 'Sine.InOut' });

        for (let i = 0; i < 3; i++) {                                        // whoosh lines
          const ln = obj(s.add.rectangle(CX - 150, STAGE_Y + i * 16, 90, 4, 0xffffff, 0.55)
            .setScrollFactor(0).setDepth(62));
          tween({ targets: ln, x: CX + 170, alpha: 0, duration: 520,
                  delay: i * 90, ease: 'Cubic.Out' });
        }
      } },

    { brand: 'HALFTIME PIZZA', color: 0xe07b00, tag: 'Hot slices. Fast breaks.',
      build(s, obj, tween) {
        // A slice spins in; steam curls up while it gently sways.
        const slice = obj(s.add.container(CX, STAGE_Y).setScale(0).setAngle(-160));
        const g = s.add.graphics();
        g.fillStyle(0xf5c542, 1); g.fillTriangle(-48, -34, 48, -34, 0, 62);  // the cheese
        g.fillStyle(0xb5722a, 1); g.fillRoundedRect(-52, -46, 104, 16, 8);   // the crust
        g.fillStyle(0xc0392b, 1);                                            // the pepperoni
        g.fillCircle(-16, -12, 9); g.fillCircle(18, -16, 8); g.fillCircle(2, 18, 8);
        slice.add(g);
        tween({ targets: slice, scale: 1, angle: 0, duration: 750, ease: 'Back.Out' });
        tween({ targets: slice, angle: 4, duration: 1200, yoyo: true, repeat: -1,
                delay: 800, ease: 'Sine.InOut' });

        for (let i = 0; i < 3; i++) {                                        // the steam
          const st = obj(s.add.text(CX - 24 + i * 24, STAGE_Y - 52, '〜', { fontSize: '20px',
            color: '#ffffff' }).setOrigin(0.5).setAlpha(0).setScrollFactor(0).setDepth(62));
          tween({ targets: st, y: STAGE_Y - 92, alpha: { from: 0.8, to: 0 },
                  duration: 1500, delay: 600 + i * 350, repeat: -1 });
        }
      } },

    { brand: 'PRO-GRIP GLOVES', color: 0x11862f, tag: 'Never lose the handle.',
      build(s, obj, tween) {
        // A football drops into the glove — flash! — then sits snug.
        const glove = obj(s.add.container(CX, STAGE_Y + 34));
        const g = s.add.graphics();
        g.fillStyle(0x11862f, 1);
        g.fillRoundedRect(-34, -10, 68, 44, 14);                             // the palm
        for (let i = 0; i < 4; i++) g.fillRoundedRect(-32 + i * 17, -34, 13, 30, 6); // fingers
        g.fillStyle(0x0c5f21, 1); g.fillRoundedRect(-34, 6, 68, 10, 5);      // the grip strip
        glove.add(g);

        const ball = obj(s.add.container(CX, CARD.y + 16).setAlpha(0));
        const bg2 = s.add.graphics();
        bg2.fillStyle(0x8B4513, 1); bg2.fillEllipse(0, 0, 44, 28);
        bg2.lineStyle(2, 0xffffff, 1); bg2.lineBetween(-10, 0, 10, 0);       // the laces
        for (let i = -1; i <= 1; i++) bg2.lineBetween(i * 6, -4, i * 6, 4);
        ball.add(bg2);
        tween({ targets: ball, y: STAGE_Y - 4, alpha: 1, duration: 600,
                ease: 'Bounce.Out', delay: 250 });

        const ring = obj(s.add.circle(CX, STAGE_Y, 12).setStrokeStyle(4, 0xffe066, 1)
          .setScrollFactor(0).setDepth(62).setAlpha(0));                     // the catch flash
        tween({ targets: ring, alpha: { from: 1, to: 0 }, scale: 3.4,
                duration: 500, delay: 850 });
        tween({ targets: [ball, glove], y: '+=5', duration: 1000, yoyo: true,
                repeat: -1, delay: 1000, ease: 'Sine.InOut' });
      } },

    { brand: 'TDR SPORTS', color: 0xffd60a, tag: 'All football. All season.',
      build(s, obj, tween) {
        // A network bumper: three color bars sweep through, the logo lands.
        const colors = [0xd83a3a, 0xffd60a, 0x1877d8];
        colors.forEach((c, i) => {
          const bar = obj(s.add.rectangle(CARD.x - 220, STAGE_Y - 26 + i * 26, 420, 20, c, 0.9)
            .setScrollFactor(0).setDepth(62));
          tween({ targets: bar, x: CX, duration: 550, delay: i * 130, ease: 'Cubic.Out' });
          tween({ targets: bar, alpha: 0.25, duration: 700, delay: 1100 });
        });
        const logo = obj(s.add.text(CX, STAGE_Y, 'TDR SPORTS', {
          fontFamily: 'Arial Black, Arial', fontSize: '40px', color: '#ffffff',
          stroke: '#0a1020', strokeThickness: 8 }).setOrigin(0.5)
          .setScrollFactor(0).setDepth(63).setScale(1.6).setAlpha(0));
        tween({ targets: logo, scale: 1, alpha: 1, duration: 450, delay: 900, ease: 'Back.Out' });
        tween({ targets: logo, scale: 1.04, duration: 900, yoyo: true, repeat: -1,
                delay: 1400, ease: 'Sine.InOut' });
      } },

    { brand: 'THE MAX BOWL', color: 0xbf9b00, tag: 'The season’s biggest stage. Coming soon.',
      build(s, obj, tween) {
        // The trophy rises, shines, and confetti drifts down. Coming soon…
        const cup = obj(s.add.container(CX, STAGE_Y + 8).setScale(0));
        const g = s.add.graphics();
        g.fillStyle(0xf1c40f, 1);
        g.fillRoundedRect(-36, -52, 72, 44, { tl: 8, tr: 8, bl: 26, br: 26 }); // the cup
        g.fillRect(-6, -8, 12, 26);                                            // the stem
        g.fillRoundedRect(-26, 18, 52, 12, 4);                                 // the base
        g.fillStyle(0xffffff, 0.35); g.fillRoundedRect(-26, -48, 12, 30, 6);   // the gleam
        cup.add(g);
        tween({ targets: cup, scale: 1, duration: 800, ease: 'Elastic.Out' });

        const star = obj(s.add.text(CX + 30, STAGE_Y - 52, '✦', { fontSize: '24px',
          color: '#ffffff' }).setOrigin(0.5).setScrollFactor(0).setDepth(63).setAlpha(0));
        tween({ targets: star, alpha: 1, duration: 400, yoyo: true, repeat: -1, delay: 900 });

        for (let i = 0; i < 8; i++) {                                          // the confetti
          const c = obj(s.add.rectangle(CARD.x + 30 + i * 46, CARD.y + 14, 7, 12,
            [0xd83a3a, 0xffd60a, 0x1877d8, 0x11862f][i % 4], 0.9)
            .setScrollFactor(0).setDepth(62).setAngle(i * 40));
          tween({ targets: c, y: CARD.y + CARD.h - 20, angle: '+=220',
                  duration: 2200 + (i % 3) * 500, delay: i * 150, repeat: -1 });
        }
      } },
  ];

  // ---- The player: build the TV screen, then run one random commercial ---
  function play(scene) {
    const objs = [], tweens = [];
    const obj = o => { o.setScrollFactor && o.setScrollFactor(0); objs.push(o);
                       o.setDepth && !o.depth && o.setDepth(62); return o; };
    const tween = cfg => { tweens.push(scene.tweens.add(cfg)); };

    // The TV screen the ad plays on (dark, like a real broadcast cut).
    const screen = scene.add.graphics().setScrollFactor(0).setDepth(61);
    screen.fillStyle(0x101a30, 1);
    screen.fillRoundedRect(CARD.x, CARD.y, CARD.w, CARD.h, 18);
    screen.lineStyle(3, 0xffd60a, 0.9);
    screen.strokeRoundedRect(CARD.x, CARD.y, CARD.w, CARD.h, 18);
    objs.push(screen);

    // The little "AD" tag in the corner — real TV honesty rules!
    objs.push(scene.add.text(CARD.x + CARD.w - 10, CARD.y + 12, ' AD ', {
      fontFamily: 'Arial Black, Arial', fontSize: '12px',
      color: '#5b4300', backgroundColor: '#ffd60a'
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(63));

    const ad = ADS[Math.floor(Math.random() * ADS.length)];
    ad.build(scene, obj, tween);

    // Brand + tagline, fading in under the action like a real spot.
    const hex = '#' + (ad.color & 0xffffff).toString(16).padStart(6, '0');
    const brand = scene.add.text(CX, BRAND_Y, ad.brand, {
      fontFamily: 'Arial Black, Arial', fontSize: '26px', color: hex,
      stroke: '#0a1020', strokeThickness: 5 }).setOrigin(0.5)
      .setScrollFactor(0).setDepth(63).setAlpha(0);
    const tag = scene.add.text(CX, TAG_Y, ad.tag, {
      fontFamily: 'Arial Black, Arial', fontSize: '15px', color: '#cfd8e8',
      stroke: '#0a1020', strokeThickness: 3 }).setOrigin(0.5)
      .setScrollFactor(0).setDepth(63).setAlpha(0);
    objs.push(brand, tag);
    tweens.push(scene.tweens.add({ targets: brand, alpha: 1, duration: 400, delay: 500 }));
    tweens.push(scene.tweens.add({ targets: tag,   alpha: 1, duration: 400, delay: 750 }));

    return {
      destroy() {
        for (const t of tweens) t.remove();
        for (const o of objs) if (o && o.destroy) o.destroy();
      }
    };
  }

  window.TDAds = { play };
})();
