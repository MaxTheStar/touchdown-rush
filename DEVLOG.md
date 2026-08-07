# 🏈 Touchdown Fun — Dev Log (where we left off)

A quick "control room" note for whoever opens this repo next (probably future
Max, or Claude helping Max). The player-facing story lives in the README; this
file is the *developer* view: current state, how the pieces fit, and what's next.

---

## 📍 Where we are

- **Version:** v1.14 — cache-buster is `?v=35` in `index.html`.
- **Name:** the game is now **Touchdown Fun** (renamed from "Touchdown Rush" in v1.13). Only the
  *player-facing name* changed. On purpose we did NOT rename the repo, the folder, the
  `maxthestar.github.io/touchdown-rush` web address, the `tdr-` save keys, or the Abacus world-counter
  namespace `touchdown-rush-maxthestar` — changing those would break the live link and wipe everyone's
  saved coins/uniforms/streak and the worldwide counters. The name and the plumbing are allowed to differ.
- **Live site:** https://maxthestar.github.io/touchdown-rush/ (GitHub Pages, served from `main`).
- **Last updated:** 2026-08-06.

## ✅ Sync status — v1.11 + v1.12 in progress (NOT pushed yet)

v1.11 (🗑 removed the Premium Pass + ✨ coin celebration) and v1.12 (🎁 bigger 14-day daily
rewards + 🛍 more Pro Shop gear to level 10 + confirmed the 🏈 pick-six extra point already
works) are **committed locally only if you've run `git commit`, and NOT pushed** unless you've
run `git push origin main`. Everything through v1.10 (🎓 step-by-step tutorial `src/tour.js`,
clearer 🌍 world tracker, UI de-clutter) is already live.
v1.9 = ⭐ ratings/turnovers/pick-sixes. GitHub Pages
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
    (GALAXY, GOLD RUSH) that then appear in the team menu. *(Grown to 14 days in v1.12.)*
  - ⭐ **Premium Pass** — *(REMOVED in v1.11 — the game can't take real money, so all rewards
    are free now. Its two uniforms, NEON ICE & BLACK DIAMOND, became free daily rewards in v1.12.)*
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
  - ✅ UPDATE (v1.12): the pick-six extra point turned out to ALREADY work — a return TD goes through
    `checkTouchdown()` → `endPlay('touchdown')`, which sets `G.pendingXP`, so the dead-ball handler
    (and `endReplay`) kick the extra point exactly like a normal TD. Verified in-browser by stepping
    the real `update()` loop through a staged pick-six: TD → +6 → (replay) → XP kick, both the
    replay and no-replay paths. This earlier "skips the PAT" note was stale.
- **v1.10 — 🎓 Step-by-step tutorial, clearer tracker, UI de-clutter** (new `src/tour.js`):
  - 🎓 **Step tutorial (replaces the wall-of-text HOW TO)** — `src/tour.js` = `window.TDTour`. Short
    "coach-mark" tours (`menu` / `offense` / `defense`), each shown ONCE (localStorage `tdr-tour-*`):
    a dim backdrop + a gold spotlight ring on one button + a card with the tip, progress dots, Skip,
    and Next ▶ (last step = "Got it!"). main.js fires `TDTour.maybeStart('menu')` from `enterMenu`,
    `'offense'` at the first scrimmage `presnap` (in `setupPlay`), `'defense'` from `setupDefensePlay`.
    The 📖 HOW TO button **re-arms ALL tours** (`TDTour.reset()`) then replays the menu tour — so it
    shows the menu tour now AND makes the offense/defense tours pop again next play (handy on a device
    that's already seen them, e.g. "show it on my iPad"). The old `#howto-modal` +
    `openHowto/closeHowto/maybeShowHowtoOnFirstVisit` are **deleted**. The tours have NO screen-size
    gate — verified working at phone (375) and iPad (768).
  - The menu tour waits out the day-1 daily-gift popup (opens on a ~600ms timer): `anyModalOpen()`
    polling + a longer initial delay, so the gift shows first and the tour follows. During the
    `defense` tour the CPU snap is held (`update()` pushes `G.dsnapAt` forward while `TDTour.active()`).
  - 🌍 **Clearer world tracker** — split into "🌍 AROUND THE WORLD" (games/players/reviews, worldwide)
    vs "🏈 YOU (this device)" (games you've finished), and on localhost a pink "⚙️ practice numbers
    (test mode)" note (`#trk-dev`, set in `stats.js refreshTracker`) so the small dev counters aren't
    mistaken for the real world totals.
  - 🧹 UI de-clutter: removed the giant HOW TO overlay + its CSS; verified menu at mobile (375) and
    tablet (768) — tracker sits far-left, no overlap with the centered difficulty/PLAY stack.
  - 💳 **Premium payment (still declined):** a static kids' game can't take real money → Premium stays
    the clearly-labeled PRETEND unlock (the gold row + "$1.99 PRETEND" checkout already show in DAILY).
    Did NOT add a real payment collector or a prominent buy button. A real store would be a grown-up's
    project with a payment provider + their own business account.
  - 🧪 Verified in-browser: all 3 tours trigger + step through + mark seen (menu 5 steps, offense 4,
    defense 3); ring spotlights the right buttons; tracker relabeled; no console errors.
- **v1.11 — 🗑 Removed the Premium Pass + ✨ coin celebration** (this iteration — `src/shop.js` +
  `index.html`):
  - 💸 **Premium Pass fully removed.** Max asked to take it out because the game can't collect real
    money yet — so we deleted it everywhere instead of leaving a pretend checkout. Gone: the
    `#premium-modal` overlay + all `.prem-*`/`.day-prem` CSS in `index.html`; the `premium` state,
    `buyPremium()`, the daily "gold row" (`pCoins`/`pUniform` fields, the second cell row, the
    `#daily-premium` strip, the `prem-buy`/`prem-no` wiring) in `shop.js`. The **normal free daily
    rewards are untouched** (day 3 = GALAXY, day 7 = GOLD RUSH). The `tdr-premium` localStorage key
    is now unused (left in place; harmless). NEON ICE (`ICE`) + BLACK DIAMOND (`BLK`) were
    premium-only, so **nobody new earns them right now** — they're kept defined in `UNIFORMS` so
    anyone who already owns them keeps wearing them, and they're the obvious things to hand out for
    free when we build "Bigger daily rewards" (see the draft board).
  - ✨ **Coin celebration (the first draft-board pick, "really easy").** New `celebrate(originEl,
    emoji, labelText)` in `shop.js`: spawns a `#coin-fx` layer at `z-index: 200` (above the
    pop-ups), sprays 12 emoji that fly up/out along per-particle `--dx/--dy` CSS vars (`@keyframes
    coinFly`), floats a big `+N 🪙` / `LEVEL N!` label (`coinLabel`), and bumps `#coin-chip`
    (`chipBump`). Fired from `claim()` (coins, `+N 🪙`) and `buy()` (the gear's own icon, `LEVEL N!`
    — called BEFORE `renderShop()` so the tapped button still exists to spray from). Respects
    `prefers-reduced-motion` (keeps a gentle label, drops the flying coins). Pure sparkle — never
    touches game state or saved coins.
  - 🧪 Verify plan: daily modal shows a single free row (no gold row); CLAIM sprays coins + `+N 🪙`
    and bumps the counter; buying gear sprays the item icon + `LEVEL N!`; no `premium`/`prem-*`
    left in code (only a history comment in `shop.js`); no console errors.
- **v1.12 — 🎁 Bigger daily rewards + 🛍 more Pro Shop gear (to level 10) + 🏈 pick-six PAT confirmed**
  (this iteration — `src/shop.js`, `src/main.js`, `index.html`):
  - 🎁 **Daily rewards grew from 7 → 14 days** (`DAILY` in `shop.js`). Days 1–7 are unchanged; days
    8–14 add climbing coin gifts and **three more free uniforms**: a brand-new 🔥 **LAVA** (`LAV`,
    day 10), plus **NEON ICE** (`ICE`, day 12) and **BLACK DIAMOND** (`BLK`, day 14 finale) — the two
    ex-"premium" uniforms **re-homed as free rewards** (they were orphaned when the pass was removed
    in v1.11). Day 14 (100🪙 + BLACK DIAMOND) is the new grand finale. `claimableDay()` now wraps at
    `DAILY.length` instead of a hardcoded 7. The calendar CSS (`repeat(7,1fr)`) flows to 2 rows on its
    own; index.html subtitle/legend updated ("day 14 is the BIG one", "uniforms on days 3, 7, 10, 12 &
    14"). Verified: 14 cells, uniforms on the right days, no layout overflow (420px card, 2 rows).
  - 🛍 **Pro Shop max level 3 → 10, and two NEW items.** `MAX_LEVEL = 10`; `PRICES` is now a 10-step
    climb `[25,40,60,85,115,150,190,235,285,350]`. Each item's fixed 3-string `lvl` array was replaced
    by a `next(L)` label function (kept in sync with the perk math), and the shelf shows `Lv N/10`
    instead of dots. **Perks were re-tuned so level 10 is a sensible ceiling** (not 3.3× the old L3):
    cleats `1+0.02·lvl` (L10 +20% run), turbo `{15,15,55}·lvl`, gloves `0.02·lvl` (L10 ±20%), energy
    `500+180·lvl` ms. Two NEW gear items, both wired into `checkTackle` in `main.js`: 💪 **STIFF ARM**
    (`stiffChance()=0.04·lvl`, L10 = 40% to break the FIRST tackle of a play — shoves the tackler 28px
    clear and gives a ~500ms free run via `G.stiffUntil`; once per down, reset in `snap()` via
    `G.stiffUsed`) and 🔒 **IRON GRIP** (`gripFactor()=0.09·lvl`, main.js uses `FUMBLE_CHANCE*(1-grip)`,
    L10 = 90% fewer fumbles). Both exposed on `window.TDShop`. `gear` default now includes `stiff`/`grip`
    (old saves lazily default them to 0 via `gear[id]||0`, so it's backward-compatible).
  - 🏈 **Pick-six extra point** — investigated and confirmed it ALREADY works (see the v1.9 note update
    above); no code change was needed, so none was made (avoids a double-PAT bug).
  - 🧪 Verified in-browser (stepping the real `update()` loop + driving `checkTackle` with a staged
    tackle and a stubbed RNG): shop buys 1→10 with escalating prices, `speedMult` scales 1.02→1.20, MAX!
    caps at 10 and a further tap is a no-op; STIFF ARM breaks a tackle (stays live, shoves the defender
    past `TACKLE_DIST`, sets the free-run window); IRON GRIP turns a would-be fumble roll into a clean
    tackle; a NO-perk player still tackles/fumbles exactly as before (regression check); pick-six → XP
    in both the replay and no-replay paths; no console errors.
- **v1.13 — ✏️ Renamed the game to "Touchdown Fun"** (this iteration — display strings only):
  - Changed every place a PLAYER sees the name: the `<title>` + `apple-mobile-web-app-title` meta +
    the big `<h1>` logo + the review-box placeholder in `index.html`, the tutorial welcome line in
    `src/tour.js`, plus the titles of `README.md`, `kick.html`, `dashboard.html` and the friendly
    `// TOUCHDOWN FUN —` header comment atop each `src/*.js`.
  - **Left the plumbing alone on purpose:** the repo/folder name, the `maxthestar.github.io/touchdown-rush`
    web address, the `tdr-` localStorage save keys, and the Abacus world-counter namespace
    `touchdown-rush-maxthestar` are UNCHANGED — renaming any of them would break the live link, erase
    everyone's saved coins/uniforms/daily streak, or reset the worldwide counters to zero.
  - Cache-buster bumped `?v=33 → ?v=34` (and `dashboard.html`'s `stats.js?v=21 → 22`). 🧪 Verified live
    in the browser: tab title "Touchdown Fun 🏈", logo "🏈 TOUCHDOWN FUN", app-title meta "Touchdown Fun",
    review placeholder updated, all 8 scripts at `?v=34`, no console errors.
- **v1.14 — 📈 Player progression (your team levels up as you play)** (this iteration — new
  `src/progress.js` = `window.TDProgress`, plus `index.html` + `src/main.js` + one `shop.js` export):
  - ⭐ **XP from playing** — main.js banks XP right next to every coin reward: TD +12, FG +6, extra
    point +3, any takeaway (INT / safety / turnover) +8, and at `endGame` a big **+40 for a win / +15
    for a loss**. `addXP()` never pops anything mid-play — it just saves the XP (localStorage `tdr-xp`,
    lifetime total) and refreshes the menu bar if it's showing.
  - 🎚 **Team level curve** — `derive()` turns lifetime XP into a level: `xpToClear(L) = 100 + (L-1)*50`
    (L1→2 = 100 XP, then +50 each level). Titles climb with level: **ROOKIE → STARTER → PRO → ALL-PRO
    → SUPERSTAR → LEGEND → HALL OF FAME** (`titleFor`). Levels are unbounded.
  - 💪 **The reward is balanced** — `boost() = 1 + min(level-1, 20) * 0.005`: **1.0 at level 1, capped at
    +10% by level 21** and never higher. `beginGame` multiplies **only YOUR** `G.myOff`/`G.myDef` by it
    (never the opponent's), stacked on top of the ⭐ team-ratings tilt. Small on purpose so the game
    stays fair. Leveling up also pays **25 coins per level gained** (`claimLevelUps`, called from `endGame`).
  - 🎚 **Menu bar** — a new `#xp-bar` strip sits under the top-left money row (menu only): a green **LVL N**
    badge, the title, `into / need XP`, and an animated fill bar. `TDProgress.onMenu()` (from `enterMenu`)
    refreshes it. The **FINAL screen** now shows `⭐ +N XP` and, on a level-up, a pulsing **LEVEL UP! Lv N —
    TITLE** with a ⭐ celebration (reuses `TDShop.celebrate`, newly exported from shop.js).
  - 🔌 Load order gained `progress.js` (after `shop.js`, since it uses `TDShop.earn`/`celebrate` and
    `TDStats.shared`). All script tags bumped `?v=34 → ?v=35`.
  - 🧪 Verified in-browser (zeroed `tdr-xp`, walked the curve, then restored the local save): fresh = L1
    ROOKIE 0/100 boost 1.0; +100 XP → exactly L2 (0/150, boost 1.005); +700 → L5 PRO 100/300 (33% bar),
    gameXP 800; `claimLevelUps` from L1→L5 returned 5 and paid +100 coins (25×4); a second claim was a
    no-op (0 coins). Boost caps: L21 = 1.10, L142 = still 1.10. Menu bar renders + is visible; all scripts
    at `?v=35`; no console errors.

## 🗂 File map (who does what)

| File | Job |
|------|-----|
| `index.html` | Page shell, all CSS, every HTML overlay/button, and the script load order (bump `?v=N` on every ship). |
| `src/main.js` | The Phaser game: field, players, plays, defense, kickoffs, HUD, replay, team menu. |
| `src/kick.js` | The field-goal/punt/extra-point kick mini-game. **Loads before main.js** (main uses `KickGame`). |
| `src/sound.js` | Live chiptune soundtrack (oscillators). API: `window.TDSound`. |
| `src/shop.js` | Coins, Pro Shop, Daily Rewards, the ✨ coin celebration. API: `window.TDShop` (+ `window.TDMenu` in main.js). |
| `src/progress.js` | 📈 Player progression: XP, team level, titles, the menu level bar, the capped strength boost. API: `window.TDProgress`. |
| `src/season.js` | 🏆 Season mode: league, standings, playoffs, Max Bowl, the season screen. API: `window.TDSeason` (talks to `window.TDGame` in main.js). |
| `src/stats.js` | World counters (Abacus) + review pop-up + the menu side-tracker. API: `window.TDStats`. |
| `src/tour.js` | 🎓 The step-by-step tutorial (coach marks). API: `window.TDTour` (`maybeStart`/`start`/`active`). |
| `src/ads.js` | Animated TV-break commercials. |
| `dashboard.html` | Private dev dashboard (world numbers + on-device reviews). Not linked from the game. |

Script load order matters: `stats → sound → shop → progress → season → ads → tour → kick → main`.

## 🧰 Conventions

- **Cache-buster:** bump every `?v=N` in `index.html` (and the `stats.js?v=` in `dashboard.html`)
  by 1 whenever files change, so browsers/iPads grab the new version instead of a saved copy.
- **Comments are kid-friendly on purpose** — Max reads the code.
- **localStorage keys are prefixed `tdr-`.** On `localhost` the world counters use a
  separate `-dev` namespace, so home testing never inflates the real world numbers.

## 💾 Persistence (localStorage keys)

`tdr-coins`, `tdr-gear`, `tdr-daily`, `tdr-owned-uniforms`, `tdr-trk`,
`tdr-games`, `tdr-reviews`, `tdr-country`, `tdr-counted-player`, `tdr-counted-geo`,
`tdr-known-countries`, `tdr-review-asked`, `tdr-view` (3D or 2D field view),
`tdr-season` (the whole in-progress season), `tdr-titles` (all-time Max Bowl wins),
`tdr-maxwell` (👑 the superstar-defender toggle), `tdr-seen-howto` (has the tutorial popped once),
`tdr-xp` (📈 lifetime XP — your team level is derived from it).

## 📝 Notes & limitations

- **No real money — every reward is free.** The old pretend Premium Pass was removed in v1.11.
  A static GitHub Pages game can't take real money anyway (that needs a payment provider —
  Stripe / App Store / Play — *and* a grown-up's business account), so all daily rewards are
  simply free. If real payments are ever wanted, that's a backend + payment-provider project,
  not a front-end tweak.
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

The 🏈 **Add-On Draft Board** (a chart Max keeps) ranks features easiest → hardest. **Built so far:**
✨ coin celebration (v1.11), 🎁 bigger daily rewards + 🛍 more Pro Shop gear + 🏈 pick-six PAT (v1.12),
✏️ renamed the game to **Touchdown Fun** (v1.13), 📈 **player progression** (v1.14 — Max chose this one).
**Still on the board, roughly easiest → hardest:**

- **🎥 Replay the big defensive stops** — the replay camera already exists (used on scores); point it
  at a huge tackle too. The brains are smart on BOTH sides now (v1.6 + v1.8).
- **🌧️ Weather & night games**, then **📋 CPU offense formations** (teach the red team the formation
  system your team already uses).
- **🎩 A drafted trick play** (e.g. a flea-flicker you unlock). *(📈 player progression is now DONE — v1.14.)*
- **🎮 Two-player pass-and-play** (share the screen) — the leading difficulty-ladder finalist.
- **🌍 Online leaderboards / a real shared backend** (needs a server; the hardest one).
- Maxwell follow-ups if wanted: custom art (a crown on the chibi), let him jump routes he didn't start
  near, or make him a whole boss TEAM instead of one player.
