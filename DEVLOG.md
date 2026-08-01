# 🏈 Touchdown Rush — Dev Log (where we left off)

A quick "control room" note for whoever opens this repo next (probably future
Max, or Claude helping Max). The player-facing story lives in the README; this
file is the *developer* view: current state, how the pieces fit, and what's next.

---

## 📍 Where we are

- **Version:** v1.9 — cache-buster is `?v=28` in `index.html`.
- **Live site:** https://maxthestar.github.io/touchdown-rush/ (GitHub Pages, served from `main`).
- **Last updated:** 2026-07-30.

## ✅ Sync status — in sync

Local `main` and `origin/main` are in sync through v1.9 (⭐ team ratings, turnover spotting, bad
throws, pick-six returns, control-follows-the-ball). v1.7 = 3f0b3fd, v1.8 = 7778df0. GitHub Pages
rebuilds the live site within a minute or two of each push. The earlier push
blocker is **resolved**: this Mac's SSH key (`~/.ssh/id_ed25519`, "touchdown-rush-mac",
fingerprint `SHA256:NhURco+HMa7SkTP7UvmMAO0XKJL5Pr8nEXik36j05QU`) was added to the
MaxTheStar GitHub account, and `ssh -T git@github.com` now returns "Hi MaxTheStar!".
Normal workflow from here: commit, then `git push origin main`, and GitHub Pages
rebuilds the live site within a minute or two.

## 🎮 What's built (feature state)

- **Core game** — 7-on-7, snap, run/pass, 4 downs, first downs, touchdowns + extra points,
  field goals & punts (kick mini-game), kickoff returns, fumbles & interceptions.
- **A real game** — opponent that scores, 4 × 2:30 quarters, a game clock, sudden-death OT,
  TV/halftime breaks with animated commercials, instant replay on scores.
- **Pick your team** — all 32 NFL teams (codes + colors, no logos), 3 difficulties.
- **v1.1 — Soundtrack & trick plays** — a live chiptune soundtrack built from oscillators
  (`src/sound.js`), the halfback pass (anyone behind the line can throw), and a genuinely
  faster defense on Hard.
- **v1.2 — Play defense** — when the CPU has the ball you control a defender (the YOU tag):
  chase the runner, pressure the QB, break up passes, pick them off, stuff them on downs.
- **v1.3 — Coins, shop, daily rewards, premium** (this iteration — `src/shop.js`):
  - 🪙 **Coins** — earned by playing (TD 10, FG 5, XP 2, takeaway 3, win +25 / try +5).
  - 🛍 **Pro Shop** — 4 upgrades × 3 levels: Speed Cleats, Turbo Dash, Sticky Gloves,
    Catch Energy. Effects are read live during play by `main.js`.
  - 🎁 **Daily Rewards** — 7-day streak calendar; days 3 & 7 grant exclusive uniforms
    (GALAXY, GOLD RUSH) that then appear in the team menu.
  - ⭐ **Premium Pass** — a clearly-labeled *pretend* $1.99 unlock: bigger daily rewards +
    premium-only uniforms (NEON ICE, BLACK DIAMOND).
  - 🌍 **World tracker** moved to a side panel on the menu (off the game field).
- **v1.4 — 3D field view + a nicer-looking field** (this iteration — `index.html` + `main.js`):
  - 🎥 **3D / 2D view toggle** — the new cyan **3D** button (top-right, next to Mute) tilts
    the whole field back so you look *down* it into the distance (a pure CSS `perspective`
    tilt on the canvas — the physics and controls are identical). It defaults to 3D, eases
    2D↔3D over 0.45s, is flat on the team menu, and remembers your pick (`tdr-view`).
  - 🧾 **Scoreboard moved into the page** — score / clock / down / spot / hints are now real
    DOM boxes (`#hud` in index.html), not canvas text, so they stay flat & crisp on top when
    the field tilts. `buildHUD/updateHUD` fill them; the old canvas HUD + `hudStyle` are gone.
  - 🎯 **Tap-to-throw stays accurate in 3D** — `canvasTapToWorld` now reads `offsetX/offsetY`
    (the browser's transform-corrected tap position) instead of the on-screen bounding box.
  - 🎨 **Field & players got a glow-up** — mowed-grass stripes, goalposts, a midfield ★, yard
    numbers, bright sidelines, a night-stadium background, shaded chibi players/ball/ref, and
    soft **ground shadows** (`drawShadows`, repainted every frame) so everyone looks 3D.
- **v1.5 — 🏆 Season mode & the Max Bowl** (this iteration — new `src/season.js`):
  - 🏟 **A whole season** — you + 7 other teams form an 8-team league. You play a **6-game
    schedule**; each week the other teams' games are **auto-simulated** (power-rated, with
    upsets) so there's a real **standings** race. A new 🏆 SEASON button on the menu opens it.
  - 🥇 **Playoffs → the Max Bowl** — the top 4 seeds make the playoffs (1v4, 2v3), then the
    winners meet in the **Max Bowl**. Win it and you're the champion: a **+200 coins** jackpot,
    an all-time **championships** count (`tdr-titles`), and the exclusive gold **CHAMPIONS**
    uniform (defined in `shop.js`, granted via `TDShop.grantUniform`, shows in the team menu).
  - 💾 **Save & resume** — the whole season saves to `localStorage` (`tdr-season`); quit and
    pick up right where you left off. Miss the playoffs and the bracket is played out for you.
  - 🔌 **How it wires in** — `season.js` never touches Phaser. It calls `window.TDGame`
    (`main.js`) to start a game with the scheduled opponent (`beginGame(..., isSeason=true)`),
    and `endGame` reports the score back via `TDSeason.reportResult`; then you land back on the
    Season screen (not the plain menu). Quick Game is unchanged.
  - 🔇 Also fixed a v1.4 layout nit: on the menu the Mute button now sits in the far-right
    corner so it never overlaps the 🏆/🛍/🎁 row on a narrow phone.
- **v1.6 — 🧠 Smart football brains** (this iteration — all in `src/main.js`):
  - 📋 **A route playbook** — instead of the same three routes every down, each play now pulls a
    "concept" out of an 8-play `PLAYBOOK` (Slants, Verticals, Smash, Mesh, Out & up, Dig-post,
    Flood, Classic), and never calls the same one twice in a row (`callPlay`, run from `setupPlay`).
    Added 8 new route shapes on top of streak/slant/swing: `out, in (dig), corner, post, curl,
    comeback, drag, wheel, flat`. Routes are defined once in `routeVelocity` and **mirror** by the
    side the receiver lined up on (`sideOf` reads each receiver's snap-time `startX`), so a left and
    a right receiver break in opposite directions from one definition. `routePath` draws them all in
    the pre-snap preview.
  - 🏃 **Receivers work open** — in `updateReceivers`, a WR crowded within 40px slides toward the
    open grass (away from the nearest defender) to shake free. Just a nudge, so routes still look
    like routes.
  - 🛡 **The defense reads the play** — each down the CPU picks `G.coverage` = `man` (tight, glued
    to your guy) or `zone` (DBs drop to deep thirds via `dbZone`/`nearestThreatInBand`, LBs widen to
    the short middle), and may `G.blitz` (a linebacker shoots the gap at the QB). Odds scale by
    difficulty: easy ≈ 15% zone / 0% blitz, medium ≈ 42% / 15%, hard ≈ 55% / 30%.
  - 🎯 **Break on the ball** — the moment a pass is thrown, `throwTo` stores `G.passTarget` and any
    non-lineman defender within reach (118/145/165px by difficulty) drives hard to that spot to knock
    it down or pick it. A **wide-open** throw still sails in; a **covered** one gets contested. Reset
    in `resolvePass`.
  - 🔊 The announcer now calls the coverage/blitz at the snap ("BLITZ!!", "Zone coverage!",
    "Man to man!") so you can learn to read it.
  - ⚠️ **Only the offense-has-ball path got the brains.** When YOU play defense, the CPU offense
    (the red team's `updateRedReceivers`/juke AI) is unchanged — that's the natural next follow-up.
  - 🧪 Verified by frame-stepping the scene in the browser (the headless preview never paints the
    WebGL canvas, so the rAF loop is frozen — step `scene.update` + `physics.world.update` by hand,
    or just drive `__td.callPlay`): all 8 concepts appear with no repeats, every route breaks the
    right way and mirrors, man/zone/break-on-ball/blitz all fire with no errors.
- **v1.7 — 🛑 Safeties, 📖 tutorial, ⏱ timeouts, 🧩 formations & 👑 Maxwell** (this iteration —
  `src/main.js` + `index.html`):
  - 🛑 **Safeties (2 points)** — tackled with the ball in your OWN end zone = +2 for the defense and
    a free kick to the other team. Handled both ways: `endPlay` (you concede → `G.oppScore += 2`,
    `fresh` possession to the CPU) and `redPlayEnd`→`cpuDriveEnd('safety')` (you tackle them in their
    end zone → `G.score += 2`, ball kicked back to you). Guarded by `yardsFromOwnGoal(...) <= 0` /
    `redYardsFromGoal(...) <= 0`; a normal midfield tackle never false-triggers.
  - 📖 **HOW TO PLAY tutorial** — a friendly `#howto-modal` overlay (moving, passing, defense,
    formations/timeouts, 4th down). Auto-pops on a first-ever visit (`tdr-seen-howto`), or via the
    new 📖 HOW TO menu button. `z-index: 85` so it sits on top of the day-1 daily-rewards popup.
  - ⏱ **Timeouts** — `callTimeout` gives you 3 per half; a timeout sets `G.clockStopped`, and the
    next `advanceClock` is skipped (the clock stops for that play). Refills at halftime
    (`tickPeriodAtBoundary`). The `#btn-timeout` button shows how many are left. Works on offense
    AND while you're on defense (to stop their clock late).
  - 🧩 **Formations** — `FORMATIONS` (SPREAD / TRIPS R / TRIPS L / I-FORM); `layoutSkill(L)` places
    the RB + WRs and records `startX/startY`. `setupPlay` uses it; the `#btn-formation` button
    (`cycleFormation`, pre-snap only) cycles the look and redraws the preview. Because routes mirror
    off snap side, moving a WR across the ball actually changes how his route breaks.
  - 👑 **Maxwell (the next-hardest feature)** — a superstar CPU free safety, toggled on the menu
    (`toggle-maxwell`, persisted as `tdr-maxwell`). When on, `defense[6]` roams the deep middle as a
    center-field robber, breaks on the ball from way farther (reach 230 vs 118–165), closes faster,
    and picks it off far more often (`INT_CHANCE + 0.25` when he's the nearest defender). A gold
    "MAXWELL 👑" nametag (`G.starLabel`) floats over him.
  - 🧪 Verified in-browser: safeties both ways (+2, possession flips, no false positives on a normal
    tackle), timeout decrement + clock-skip + halftime refill, all 4 formations reposition & update
    `startX`, Maxwell's robber path + 230px break reach (a normal DB holds at 200px, breaks at 120px)
    + persisted toggle + nametag. Tutorial + menu screenshotted at iPad size — clean, no overlap.
- **v1.8 — 🧠 Smart routes for the CPU offense** (this iteration — all in `src/main.js`):
  - The v1.6 brains covered only YOUR offense. Now the CPU offense (when you play defense) runs the
    **same 8-play `PLAYBOOK`**: `callRedPlay` (fired from `redSnap`, no back-to-back repeats) assigns
    each red receiver a route, and `redRouteVelocity` is just `routeVelocity` with the downfield (vy)
    flipped — so their routes break exactly like yours, mirrored L/R off `sideOf`/`startX` (now
    recorded for `defense[1..3]` in `setupDefensePlay`). Red WRs "work open" when crowded, too.
  - **Your AI teammates now read man vs zone** (`G.dcoverage`, picked per down by difficulty in
    `callRedPlay`) in the rewritten `updateBlueTeammates`: `blueZone`/`nearestRedThreatInBand` drop
    the cover-DBs into deep thirds, and they **break on the ball** (`G.dpassTarget`, set in `redThrow`,
    cleared in `resolveRedPass`) — so the varied red routes have real coverage to beat.
  - 🧪 Verified in-browser (frame-stepped, since the headless preview never paints): red play-caller
    hits all 8 concepts with no repeats; a red post breaks inside AND downfield (`vy +152`); man
    coverage tracks, zone drops the DBs to deep thirds, break-on-ball rallies the nearest defender —
    no runtime errors in any defensive state.
  - ⚠️ The CPU offense still lines up in one standard set (no CPU formations) — a possible follow-up.
- **v1.9 — ⭐ Team ratings, turnovers, bad throws & pick-sixes** (this iteration — all in `src/main.js`):
  - ⭐ **Team ratings** — every NFL team has a fixed OFFENSE and DEFENSE score out of 10 in
    `TEAM_RATINGS` (e.g. SEA 6/9 = a defense team, NE 8/6 = offense, KC 10/7). `teamRating()` +
    `stars10()` power a menu display (overall + specialty headline, then ⭐ star bars) under the team
    name. The numbers also give a **gentle strength tilt**: `beginGame` turns each rating into a
    multiplier (`tilt(v)=1+(v-5)*0.015`, so 5 is neutral, 10≈+7.5%) stored on `G.myOff/myDef/oppOff/
    oppDef` and applied to your WR route speed, their coverage `boost`, their carrier/receiver speed,
    and your teammates' pursuit. Unlockable uniforms default to a balanced 5/5.
  - 🔁 **Turnover spotting** — an interception or fumble recovery now hands the ball over **right at
    the spot**, no kickoff. `G.turnoverSpotCpu` (their yards) / `G.turnoverSpotYou` (your yards) are
    set at the takeaway and consumed by `startCpuDrive` / the new `takeYourBall` (called from
    `finishCpuDrive`).
  - 🎲 **Bad throws** — both QBs (`throwTo` + `redThrow`) sometimes slip (`BAD_THROW_CHANCE`) and sail
    one into open space. `resolvePass`/`resolveRedPass` now handle a ball that lands away from the
    intended target: the nearest player of EITHER team within `LOOSE_BALL_DIST` makes a play — a
    defender picks it, or another receiver adjusts and catches it (shared `catchAndRun` hands you the
    controls).
  - 🏈 **Pick-six returns + control-follows-the-ball** — on defense, `pickMyDefender` switches the
    defender YOU drive to whoever's closest to the ball (22px hysteresis, `G.myDefender`; the YOU tag
    + `updateBlueTeammates` follow it). Per Max's call, `controlYourDefender` only runs that
    auto-switch on a **live run** (`G.state==='dlive' && G.ballCarrier !== defense[0]`) — while their
    QB is in the pocket, or the ball's in the air, you keep your own man. When you intercept,
    `startPickSix` makes you that defender and **reuses the whole kickoff-return system** (state
    `'kickoff'`, `G.pickSix`) to run it back — a tackle spots your new drive (`endKickoffReturn`),
    reaching the endzone is a defensive TD (`checkTouchdown`→`endPlay('touchdown')`).
  - 🧪 Verified in-browser: ratings render + screenshot-checked (no overlap with the DIFFICULTY
    buttons — they start at canvas y≈546, bars sit above); control switches to the nearest defender
    with hysteresis; pick-six enters the return state controlling the picker; turnover spots computed
    + consumed both ways; open-field catch/INT on a bad throw. No console errors.
  - ⚠️ NOTE for next time: a pick-six TD currently skips its own extra-point kick (it goes through the
    kickoff-return TD path) — fine, but noting it in case Max wants the PAT added.

## 🗂 File map (who does what)

| File | Job |
|------|-----|
| `index.html` | Page shell, all CSS, every HTML overlay/button, and the script load order (bump `?v=N` on every ship). |
| `src/main.js` | The Phaser game: field, players, plays, defense, kickoffs, HUD, replay, team menu. |
| `src/kick.js` | The field-goal/punt/extra-point kick mini-game. **Loads before main.js** (main uses `KickGame`). |
| `src/sound.js` | Live chiptune soundtrack (oscillators). API: `window.TDSound`. |
| `src/shop.js` | Coins, Pro Shop, Daily Rewards, Premium. API: `window.TDShop` (+ `window.TDMenu` in main.js). |
| `src/season.js` | 🏆 Season mode: league, standings, playoffs, Max Bowl, the season screen. API: `window.TDSeason` (talks to `window.TDGame` in main.js). |
| `src/stats.js` | World counters (Abacus) + review pop-up + the menu side-tracker. API: `window.TDStats`. |
| `src/ads.js` | Animated TV-break commercials. |
| `dashboard.html` | Private dev dashboard (world numbers + on-device reviews). Not linked from the game. |

Script load order matters: `stats → sound → shop → season → ads → kick → main`.

## 🧰 Conventions

- **Cache-buster:** bump every `?v=N` in `index.html` (and the `stats.js?v=` in `dashboard.html`)
  by 1 whenever files change, so browsers/iPads grab the new version instead of a saved copy.
- **Comments are kid-friendly on purpose** — Max reads the code.
- **localStorage keys are prefixed `tdr-`.** On `localhost` the world counters use a
  separate `-dev` namespace, so home testing never inflates the real world numbers.

## 💾 Persistence (localStorage keys)

`tdr-coins`, `tdr-gear`, `tdr-daily`, `tdr-premium`, `tdr-owned-uniforms`, `tdr-trk`,
`tdr-games`, `tdr-reviews`, `tdr-country`, `tdr-counted-player`, `tdr-counted-geo`,
`tdr-known-countries`, `tdr-review-asked`, `tdr-view` (3D or 2D field view),
`tdr-season` (the whole in-progress season), `tdr-titles` (all-time Max Bowl wins),
`tdr-maxwell` (👑 the superstar-defender toggle), `tdr-seen-howto` (has the tutorial popped once).

## 📝 Notes & limitations

- **Premium is pretend by design.** A static GitHub Pages game can't take real money — that
  needs a payment provider (Stripe / App Store / Play) *and* a grown-up's business account.
  The checkout says so honestly and unlocks for free. If real payments are ever wanted, that's
  a backend + payment-provider project, not a front-end tweak.
- **Reviews stay on the device** they were written on (no shared database yet).
- **Browser-preview screenshots time out** on the WebGL canvas; verify changes via live
  DOM/JS state (`window.TDShop`, `__td.G`, element `innerText`) instead.

## ▶️ Run it locally

```
python3 -m http.server 8055
# game:      http://localhost:8055/index.html
# dashboard: http://localhost:8055/dashboard.html
```

## 🔮 Next up (ideas for the next cycle)

- **Touchdown replays on defensive stops** — the brains are now smart on BOTH sides (your offense +
  coverage in v1.6, the CPU offense + your AI teammates' man/zone in v1.8), so the remaining polish
  here is showing the instant replay after a big defensive stop, and maybe CPU formations.
- Still on the difficulty ladder: **two-player pass-and-play** (the other v1.6 finalist), a **drafted
  skill play**, weather/night games, player progression. (👑 Maxwell shipped in v1.7.)
- Maxwell follow-ups if wanted: give him custom art (a crown on the chibi), let him jump routes he
  didn't start near, or make him a whole boss TEAM instead of one player.
- **Seasons**, a **"Max Bowl,"** and **drafting players**.
- More shop items and more daily-reward uniforms; a little coins-fly animation and a
  "cha-ching" sound when you buy or claim.
- Maybe a real shared backend someday (leaderboards, cross-device reviews).
