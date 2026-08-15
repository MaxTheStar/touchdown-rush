# 🏈 Touchdown Fun — Dev Log (where we left off)

A quick "control room" note for whoever opens this repo next (probably future
Max, or Claude helping Max). The player-facing story lives in the README; this
file is the *developer* view: current state, how the pieces fit, and what's next.

---

## 📍 Where we are

- **Version:** v1.27 — cache-buster is `?v=44` in `index.html`.
- **Name:** the game is now **Touchdown Fun** (renamed from "Touchdown Rush" in v1.13). Only the
  *player-facing name* changed. On purpose we did NOT rename the repo, the folder, the
  `maxthestar.github.io/touchdown-rush` web address, the `tdr-` save keys, or the Abacus world-counter
  namespace `touchdown-rush-maxthestar` — changing those would break the live link and wipe everyone's
  saved coins/uniforms/streak and the worldwide counters. The name and the plumbing are allowed to differ.
- **Live site:** https://maxthestar.github.io/touchdown-rush/ (GitHub Pages, served from `main`).
- **Last updated:** 2026-08-14.

## ✅ Sync status — v1.11–v1.27 are all LIVE (v1.25–v1.27 pushed 2026-08-14)

Everything through **v1.19** was committed, pushed, and **live** at maxthestar.github.io/touchdown-rush.
On **2026-08-06** v1.11–v1.14 went up (commit `6daef38`) and **v1.15** (`047623a`); on **2026-08-09**
v1.16–v1.19 shipped together (commit `094c34f`). On **2026-08-10** this batch shipped (cache-buster now
`?v=41`) — **v1.20** (🎩 trick play — flea flicker), **v1.21** (🎮 two-player pass-and-play, finished),
**v1.22** (👑 Maxwell is now a BOSS TEAM), **v1.23** (📅 NFL-style season scheduling — divisions + rivals
twice), and **v1.24** (💰 better players cost more). *(The 🌍 online leaderboards idea was deleted from
the board on Max's call — it needs a real backend and he didn't want it.)*

On **2026-08-14** the **Round-2 add-on board** shipped as **v1.25** (cache-buster `?v=42`) — 📅 a real
**Draft Day** (a set date, not every single day), 🔀 **trading draft picks** on the clock (trade up / down +
CPU calls), 💵 **player salaries** with a team payroll & friendly cap, and 📣 **rivals come calling** (other
teams send you trade requests in a 📨 inbox with a badge). All four live in `src/draft.js` (+ new `dr-*` CSS
in `index.html`). Verified live in the browser via DOM/JS (see the v1.25 section below).

Same day, **v1.26** shipped (cache-buster `?v=43`) — 🏈 **two-point conversions**: after every touchdown you
choose ① KICK (+1) or ② GO FOR 2 (+2, one real snap from the 2-yard line), and the CPU goes for two too (its
TDs now score 6/7/8). All in `src/main.js` + a new `#pat-choice` panel in `index.html`. Verified by driving the
exported globals and stepping the frozen game loop by hand.

And **v1.27** (cache-buster `?v=44`) — 🎉 a **celebration when YOU convert a two-pointer**: `resolveTwoPoint`'s
success path now fires `TDShop.celebrate(null, '🎉', 'TWO POINTS!  +2')` (the same confetti party as level-ups /
shop buys; it respects "reduce motion"). A failed try stays quiet, and the CPU's conversions don't party.

The push path is healthy: this Mac's SSH key (`~/.ssh/id_ed25519`, "touchdown-rush-mac",
fingerprint `SHA256:NhURco+HMa7SkTP7UvmMAO0XKJL5Pr8nEXik36j05QU`) is on the MaxTheStar GitHub
account, `ssh -T git@github.com` returns "Hi MaxTheStar!", and GitHub Pages rebuilds the live site
within a minute or two of each push. Normal workflow: commit, then `git push origin main`.
(Heads-up: GitHub Pages' CDN can serve a stale copy for a minute — verify the live site with a
cache-busting query like `…/index.html?cb=1`.)

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
- **v1.15 — 🎥 Replay the big defensive stops** (this iteration — all in `src/main.js`; cache-buster
  `?v=35 → ?v=36`):
  - 🎬 **The replay system is now reusable.** It used to only fire after YOU score. Two new `G` fields make
    it general: `G.replayTitle` (the headline — `buildReplayOverlay` shows it, defaulting to
    "📺 INSTANT REPLAY") and `G.replayThen` (a callback for "what to do after the film"). `endReplay` now
    runs `G.replayThen` if set (then clears both), otherwise falls back to the old score flow
    (`startExtraPoint`/`startNextPlay`) unchanged — a purely additive change, so scoring replays are untouched.
  - 🎥 **Film the defense too.** `updateDefensePlay` now calls `recordReplayFrame()` every frame (it only ran
    on your offense + kickoffs before), so a defensive series has footage. `redSnap` already reset `G.replay`.
    During a D play the carrier is a red player, so the filmed `ci` is −1 and the spotlight ring falls back to
    the ball (already handled in `applyReplayFrame`).
  - 🛑 **The trigger** lives at the end of `redPlayEnd`: a `bigStop` is `result === 'tackle' && gain <= 0 &&
    G.replay.length >= REPLAY_MIN`. On a big stop it sets `G.replayTitle` (🎥 BIG SACK! if it's the QB behind
    the line, 🎥 TACKLE FOR LOSS! for any other loss, 🎥 BIG STOP! for a no-gainer), stashes the normal
    `finishStop` (banner → `ddead` → `defenseNextPlay`) as `G.replayThen`, and rolls `startReplay()`. Not a big
    stop, or too little film → it just calls `finishStop()` directly (no replay). `setupDefensePlay` re-establishes
    the camera afterward, so the hand-off back to the next down is clean.
  - 🧪 Verified in-browser by driving the real functions: (1) the reusable machinery — synthetic film +
    custom title + a `replayThen` sentinel → `startReplay` shows the custom title, `updateReplay` advances at
    0.45×, and `endReplay` runs the continuation + cleans up every overlay/flag. (2) `recordReplayFrame`
    yields a defensive frame (`ci === -1`). (3) `redPlayEnd` staged four ways: a QB sacked behind the line →
    replay "BIG SACK!", an RB stuffed at the line → replay "TACKLE FOR LOSS!", a normal downfield gain → NO
    replay (→ `ddead`), and a big stop with only 5 frames of film → NO replay. Fresh-tab boot: no console
    errors. (The overlay's *text* can't render in the frozen headless canvas, but it's the identical
    `buildReplayOverlay` the shipped score-replay already uses, so it renders on a real device.)
- **v1.16 — 🌦 Weather & night games** (this iteration — new `src/weather.js` = `window.TDWeather`, plus
  `index.html` + a light touch to `src/main.js`; cache-buster `?v=36 → ?v=37`):
  - 🌦 **Every game now has weather.** `weather.js` picks a look at kickoff: on AUTO it's a weighted
    surprise (40% ☀️ clear, 25% 🌙 night, 20% 🌧️ rain, 15% ❄️ snow); or you lock one in. `forGame()`
    (called from `beginGame`) applies it and returns a friendly announce line that main.js speaks through
    `sayComment` ("🌧️ Rain is falling!", "🌙 Night game!"…). Saved in `localStorage` as `tdr-weather`.
  - 🎨 **Pure atmosphere, painted over the field.** A see-through `#weather-fx` div (index.html) sits at
    `z-index: 9` — above the canvas, below the buttons (10+) and HUD (14) — the same over-the-field trick
    the 3D tilt uses. `apply(kind)` toggles body classes `wx-night` / `wx-rain` / `wx-snow` (+ `wx-active`);
    CSS draws a night vignette, sliding rain streaks (two `::before/::after` layers at different speeds),
    or drifting snow (radial-gradient flakes). It's gated `body:not(.menu).wx-active #weather-fx` so it only
    shows **in-game, never on the menu** (`enterMenu` adds `.menu`, `beginGame` removes it). Honors
    `prefers-reduced-motion` (freezes the rain/snow animation, keeps the tint). It never touches players or
    physics.
  - 🏈 **One gameplay bite — a slippery ball.** New `wxFumble()` in main.js returns `TDWeather.fumbleMult()`
    (clear/night 1.0, **rain 1.5×, snow 1.7×**); both fumble rolls — yours in `checkTackle` and theirs in
    `redCheckTackle` — multiply their odds by it, so wet/snowy games see a few more fumbles. Buy 🔒 IRON GRIP
    in the Pro Shop to fight back (its `gripFactor` still stacks in front).
  - 🎛 **The 🌦 WEATHER menu button** (`#cycle-weather`, under the 👑 Maxwell toggle) cycles AUTO → CLEAR →
    NIGHT → RAIN → SNOW and shows the current pick; `cyclePref` saves it.
  - 🔌 Load order gained `weather.js` (after `shop.js`/`progress.js`, before `season.js`, since it uses
    `TDStats.shared` for storage). All script tags bumped `?v=36 → ?v=37`.
  - 🧪 Verified in-browser (drove the real module): `TDWeather` exposes `forGame/fumbleMult/current/pref`;
    cycling the button walks AUTO→CLEAR→NIGHT→RAIN→SNOW with the right labels and persists `tdr-weather`;
    each kind applies the right body classes (clear = none; night/rain/snow = `wx-<kind>` + `wx-active`) and
    the right fumble multiplier (1.0 / 1.0 / 1.5 / 1.7); the announce lines fire; and the overlay gating is
    exact — `#weather-fx` computes `display:none` with `.menu` on the body and `display:block` without it.
    Fresh-tab boot: no console errors.
- **v1.17 — 🧩 CPU offense formations** (this iteration — all in `src/main.js`; cache-buster `?v=37 → ?v=38`):
  - 🧩 **The red (CPU) offense now comes out in different FORMATIONS**, just like your team can. New
    `RED_FORMATIONS` (SPREAD / TRIPS R / TRIPS L / I-FORM) mirrors your `FORMATIONS` into the red half of
    the field (their WRs at `L - 14`, their RB a little deeper at `L - rby`). `pickRedFormation()` chooses one
    each defensive down with **no back-to-back repeats** (like the playbook), remembered in `G.dformation`.
    It used to always line up the exact same standard set (the "possible follow-up" the v1.8 note flagged).
  - 🎯 **Your coverage lines up to match.** `setupDefensePlay` now places their skill players from the chosen
    formation, records each one's snap spot (`startX/startY`) so his route still mirrors off the side he lined
    up on, and **moves YOUR cover men across from their receivers** (a hair inside — `inside(x)`), plus shades
    the RB spy toward the middle (`rbGuardX`). So a TRIPS set really overloads one side of your defense the way
    it should, instead of leaving DBs stranded on empty grass.
  - 🧠 **Read the look.** Each formation leans run-or-pass via a `pass` field, used in `redSnap` (falls back to
    the plain `RED_PASS_CHANCE` if missing): **I-FORM ≈ 34% pass (a run look), SPREAD ≈ 62%, TRIPS ≈ 70%**. A
    pre-snap announcer callout ("🔴 They come out in TRIPS RIGHT!") names the look so you can learn to read it.
  - 🔌 No new file, no load-order change — it all rides in `main.js`. `RED_FORMATIONS`/`pickRedFormation` are
    exposed on `window.__td` for console testing. Script tags bumped `?v=37 → ?v=38`.
  - 🧪 Verified in-browser by driving the real functions (scene was live, so I stepped `setupDefensePlay` +
    `redSnap` directly): `pickRedFormation` over 60 picks = **0 back-to-back repeats**, all 4 looks seen; over 8
    staged defensive downs **every** position check passed — red WR1/WR2/RB land on the formation spots, `startX`
    is recorded, and your DB1/DB2/RB-spy line up across from their men; route-mirror `sideOf` is right (TRIPS L →
    both WRs left, TRIPS R → both right, SPREAD/I-FORM → split); and 400 sampled snaps gave pass rates I-FORM
    0.28 / SPREAD 0.55 / TRIPS 0.74 — you can read the formation. Pristine-boot console: no errors.
- **v1.18 — 🧹 Home-screen (team menu) cleanup** (this iteration — `src/main.js` team card + `index.html`
  menu CSS/HTML; cache-buster `?v=38 → ?v=39`):
  - 🧾 **The team card is now a real, grouped card.** The name + rating "note" + the offense/defense star
    bars used to be crammed together and literally **overlapped** (measured: name↔note −8px, note↔bars −1px).
    `buildTeamMenu` now draws a rounded `M.card` panel (depth 92, behind the text) and re-spaces the three
    lines with comfortable gaps (name↔note +11, note↔bars +16, verified across all 32 teams; widest name
    COMMANDERS and highest ratings KC both stay inside the card).
  - 🔎 **Ratings are bigger and clearer** — the star bars went 13px → **17px** with roomy line spacing, and
    the number now sits right before the stars: `🏈 OFFENSE  6/10  ★★★★★★☆☆☆☆`. No more squinting.
  - 🎚 **The bottom control stack no longer collides with the card.** It had ballooned to three labelled
    sections (DIFFICULTY / SUPERSTAR CHALLENGE / WEATHER) and, anchored to the viewport bottom, its top crept
    up over the ratings. Now 👑 Maxwell + 🌦 Weather share **one compact row** under a single "CHALLENGE &
    WEATHER" label (Maxwell shortened to `👑 MAXWELL`; `.diff-btn` got `white-space:nowrap` so labels never
    wrap). The ◀▶ team arrows moved up (`top:46% → 40%`) to flank the PLAYER, not the card.
  - 📱 **This is a portrait game, so portrait is the priority** and is now clean (phone + tablet). In
    **landscape** the canvas scales up and the card sits lower, so a `@media (orientation: landscape)` rule
    hides just the little section labels there — enough to keep the buttons off the ratings — while portrait
    keeps every label for clarity.
  - 🧪 Verified by screenshotting the real menu (this browser DOES paint the canvas — the old "screenshots
    time out" note applied to a different preview tool): portrait mobile (375×812) and iPad landscape
    (1024×768) both clean, no overlaps; COMMANDERS (widest name) fits; EASY/MEDIUM/HARD selection still
    highlights; and a full play-through (PLAY → kickoff → defense) ran with the 🌧️ rain overlay showing and a
    🧩 SPREAD CPU formation lined up — no JS console errors (only the harmless auto favicon/apple-touch-icon
    404s, which pre-date this work).
- **v1.19 — 🏟 MY TEAM: draft, scout & trade your own players** (this iteration — new `src/draft.js`,
  `window.TDDraft`; `index.html` gets the 🏟 TEAM button + `#team-modal` + a `.dr-*` stylesheet; one line in
  `main.js` `beginGame`; `spend` exposed on `TDShop`; cache-buster `?v=39 → ?v=40`):
  - 📋 **Your own roster.** You now have **eight named starters** (QB, RB, WR, WR, TE, LB, CB, S), each with a
    rating out of 99, sometimes a ⭐ **trait** (🚀 Speedster, 🎯 Cannon Arm, 🧲 Sure Hands, 🛡 Bruiser…), and the
    school/team they came from. A brand-new team is all honest 60s (regenerated automatically if `tdr-roster`
    is missing). Your **TEAM OVERALL** is the average, split into offense (first five) and defense (last three).
  - 💪 **A better team plays tougher** — `boost()` returns `{off, def}` multipliers that `beginGame` stacks on
    top of the ⭐ team ratings and 📈 level boost. A 60-overall unit is exactly 1.0; it climbs to **+8%** for a
    maxed (99) unit — small, CAPPED, and **YOUR team only** (never the opponent's), same spirit as everything
    else. Offense stars lift your offense, defense stars lift your defense.
  - 🎯 **The DRAFT (a real snake draft).** Six teams (you + five computers, named from the NFL list) take turns
    over three rounds in snake order (1→6, 6→1, 1→6), so you make **3 picks**. A 24-strong prospect class shows
    up from fictional **schools** (STATE U, TECH, COASTAL…). Computer teams grab the best available before your
    pick — grab your guy before they do! Each pick UPGRADES the weakest starter at that position (the button
    teases the gain, e.g. `DRAFT ⬆+24`).
  - 🔎 **Scouting = risk & reward.** A prospect's true rating is hidden as a fuzzy **range** (e.g. `81–94`) with
    a `? ???` trait until you **scout** him for **12 🪙** (spent through `TDShop.spend`). The computer teams
    already "know", so scouting lets you draft as smart as they do. Can't afford it → a friendly inline flash,
    and you can still gamble on an unscouted pick.
  - 🔁 **Trading.** The TRADE tab shows four offers from league (NFL) teams: you get one of their players for
    one of yours, usually a small upgrade that costs coins (some deals **pay you**). Accept → the swap and coins
    settle instantly; 🔄 NEW OFFERS reshuffles the block.
  - 🔌 **How it wires in** — `draft.js` never touches Phaser. It reads coins via `TDShop`, saves through the
    `TDStats.shared` helpers (`tdr-roster`), reads the team list lazily via `window.TDGame.nflAbbrs/teamByAbbr`,
    and the whole pop-up runs on **one delegated click handler** on `#team-body` (so re-renders never re-wire).
    `main.js` only gains the guarded `TDDraft.boost()` multiply in `beginGame`.
  - 🧪 **Verified** end-to-end in the browser via live DOM/JS (canvas-free, so no screenshot timeouts): all nine
    modules load with **no console errors**; the default roster generates + persists; a full draft ran (correct
    snake order — CPU picks before/after your slot, on-the-clock banner, pick log, scouting spends 12🪙 and
    reveals rating+trait, upgrade deltas, 3-pick completion recap); trades swap the roster and move coins the
    right way (including a "you get coins" deal); the "not enough coins" guard flashes and refuses; the
    `beginGame` boost math checks out exactly (SEA off/def × progression × roster boost, YOUR team only, no
    error); season/shop/daily still open & close (no regressions); and the six-chip menu row fits one line at
    375px with no XP-bar overlap.
- **v1.20 — 🎩 Trick play (the flea flicker)** (this iteration — all in `src/main.js` + `index.html`):
  - 🎩 **Once a game**, a new `🎩 TRICK` button appears in the `#ingame-ctrls` row **before the snap** (only
    while you still have it — `body.trick-ready`, toggled by `updateTrickBtn`). Tap it and `callTrick` sends all
    your receivers deep (routes → `streak`/`streak`/`wheel`) and redraws the pre-snap preview.
  - 🪤 At the snap (`snap`) the trick is spent (`G.trickAvailable=false`) and the **defense BITES**: for
    `TRICK_BITE_MS` (780ms) every coverage defender (DBs + LBs, *not* the DL) creeps toward the line at 0.32×
    speed (`updateDefense`), springing a receiver wide open deep. The pass rush is NOT fooled, so you still have
    to get the deep shot off. Reset each play in `setupPlay` and each game in `beginGame`.
  - 🧪 Verified via `__td`: the button shows only pre-snap-while-available; arming flips the routes to all-deep
    and marks the button `armed`; the snap consumes the one use and opens the bite window; a fooled DB drives
    straight at the LOS at 0.32× while the DL keeps rushing full speed; after the window it snaps back to normal
    coverage. No console errors.
- **v1.21 — 🎮 Two-player pass-and-play (finished)** (this iteration — `src/main.js`):
  - The old 2P only let a friend play ONE red defender while you had the ball. Now it's **symmetric and
    competitive, no computer**: Player 2 IS the red team. When YOU have the ball he plays a red defender
    (`p2Defender`, unchanged); when the **RED team** has the ball **he RUNS their offense** with the top
    D-pad / WASD, and you play defense. Whoever scores more wins.
  - 🔌 How: in `updateRedTeam`, an early `if (G.twoPlayer) { controlP2Defender(carrier); return; }` hands the
    red ball-carrier to Player 2 (reusing the P2 input handler) and skips the AI drop-back/handoff/juke/throw;
    `redSnap` forces the red play to a **run** in 2P (P2 has no throw button); the red receivers still run their
    routes as decoys. The `#dpad2` already survives the defense phase (`body.returning` only hides `#actions`).
    The "P2" tag now floats over the red defender on your offense and over the red **carrier** on their drive.
    `beginGame` re-syncs the `two-player` body class from `G.twoPlayer` each game.
  - ⚠️ Every P2 change is gated behind `G.twoPlayer`, so the **1-player game is byte-for-byte unchanged** (verified:
    same input drives the carrier at 215 in 2P, is ignored in 1P; red plays force-run in 2P, mix run/pass in 1P).
- **v1.22 — 👑 Maxwell is now a BOSS TEAM** (this iteration — `src/main.js`):
  - 👑 Maxwell used to be a superstar-safety toggle bolted onto any opponent. Now he's a whole **BOSS TEAM**:
    a new `MAXWELL_TEAM` (`abbr:'MXW'`, gold-and-black, `boss:true`) with **maxed 10/10 ratings**
    (`TEAM_RATINGS.MXW`), not pickable as your team. The menu 👑 toggle now means **"face the boss in Quick
    Game"**: `startGameWithTeam` swaps your opponent to Maxwell when it's on.
  - 💪 `beginGame` sets `G.bossGame = !!opp.boss` and, on top of the maxed rating tilt, gives Maxwell a **+10%
    whole-team buff** (`oppOff/oppDef *= 1.10`). The 👑 superstar free safety AI (range, ballhawk, robber) now
    keys off `G.bossGame` instead of the old menu flag, so it fires **only** when you're actually facing Maxwell.
  - 🧪 Verified: toggle ON → opponent is MAXWELL (gold, MXW), `bossGame=true`, off/def = tilt(10)×1.10 = 1.1825
    exactly; toggle OFF → normal random NFL opponent, `bossGame=false`. No errors.
- **v1.23 — 📅 NFL-style season scheduling** (this iteration — `src/season.js`):
  - 📅 The season used a plain 8-team round robin. Now, like the NFL, the league splits into **two divisions of
    four** and you play your **division rivals twice — home and away** (`nflSchedule`/`divisionRoundRobin`: a
    circle-method leg plus a home/away-flipped rematch leg = 6 rounds of 2 games). Zipped across both divisions
    that's the same **6 weeks × 4 games** the rest of the season already expects, so standings/sims/playoffs are
    untouched. `newSeason` stores `divA`/`divB`; the standings gain a color-coded **DIV** column, and the intro
    + schedule captions explain it. (Old in-progress `tdr-season` saves still load & finish on their old schedule
    — `divisionOf` guards missing `divA`.)
  - 🧪 Verified: fresh season → divA = you + 3, divB = 4; you play your 3 rivals exactly 2× each, every game is
    intra-division, all 8 teams play 6, 6 weeks × 4 games; a full 6-week + playoff run completes with no errors
    and the DIV column renders.
- **v1.24 — 💰 Better players cost more** (this iteration — `src/draft.js`):
  - 💰 Getting stars is now pricier. **Scouting** is tiered by a prospect's projected grade (mid of his shown
    range): `<70 → 8🪙, 70s → 12🪙, 80s → 18🪙, 90+ → 25🪙` (`scoutCost`, shown per-prospect on the button).
    **Trades** are priced off the incoming player's absolute rating, not just the upgrade:
    `coin = max(−15, round((ovr−60)×2.5) + (trait ? 12 : 0))` — a 90-overall costs ~75🪙+, a scrub can even pay
    you. Verified: all four scout tiers appear and match the rule; trade coins climb with incoming overall.
- **v1.25 — 🏟 MY TEAM Round 2: Draft Day, pick trades, salaries & rival requests** (this iteration —
  `src/draft.js` + new `dr-*` CSS in `index.html`). The four-pick "Add-On Draft Board, Round 2":
  - 📅 **A real Draft Day.** The draft is an EVENT now, not an every-day thing. We remember the next Draft Day
    in `localStorage` (`tdr-draftday`); a brand-new player can draft right away, but finishing a draft sets the
    next one `DRAFT_COOLDOWN_DAYS` (=7) out. While locked the 🎯 DRAFT tab shows a friendly countdown
    (`fmtCountdown`, e.g. "6d 23h") and hides START; "DRAFT AGAIN" is gone. `setNextDraftDay()` fires the moment
    the draft's order runs out (in `advanceDraft`). Verified: complete a draft → `draftReady()` flips false,
    reopen → the locked "DRAFT DAY IS SET" screen with a live countdown.
  - 🔀 **Trade draft picks on the clock.** On your pick you can 🔼 **TRADE UP** (spend `TRADE_UP_COST`=20🪙 +
    give up your last upcoming pick → an extra `draft.bonus` pick right now) or 🔽 **TRADE DOWN** (a CPU takes
    your pick now; you get `TRADE_DOWN_PAY`=30🪙 + a pick pushed to the end of `draft.order`). CPU teams also
    ring you: `maybeCallOffer` (~35%) sets `draft.callOffer = {team, coin}` — accept to trade down for their
    coins. The header pick count is computed live (`futureMinePicks()` + `bonus`) since trades change the total.
    Verified: trade-down +30🪙 and `order` 18→19 with a CPU pick logged; trade-up −20🪙 and `bonus` 0→1.
  - 💵 **Player salaries.** Every player carries a `salary` in make-believe $M, scaled by rating
    (`salaryOf(ovr, trait)` ≈ 60→$2M, 70→$7M, 80→$14M, 90→$23M, 99→$33M, +$2M for a ⭐ trait). The 📋 ROSTER
    shows each salary and a **TEAM PAYROLL** bar (`teamPayroll()`) under a friendly `SALARY_CAP` (=$180M) with an
    over/under note — informational, never blocks play. Old saves back-fill a salary on load. Salaries show only
    once a player is scouted/yours. Verified: fresh roster payroll $39–45M, chips scale with rating.
  - 📣 **Rivals come calling.** A 4th tab 📨 **REQS** with a count badge. On opening MY TEAM, rival teams may send
    a trade *request* for one of your BETTER starters (`makeRequest` targets your top 4 by overall, offers a
    same-position player usually a touch worse + coins to cash in). Requests persist in `localStorage`
    (`tdr-requests`, cap `MAX_REQUESTS`=4); Accept swaps the player and pays you, Reject dismisses. This is the
    mirror of the existing 🔁 TRADE tab (there YOU shop; here rivals chase your stars). Verified: badge shows a
    live count, Accept paid coins + swapped the starter, Reject cleared it.
  - 🔌 Interfaces unchanged: `window.TDDraft` still exposes `open / boost / teamOverall`; `main.js:2679` reads
    `boost()` in `beginGame` exactly as before. Added: `payroll` and a small `_debug` helper (harmless in play).
- **v1.26 — 🏈 Two-point conversions** (this iteration — `src/main.js` + a new `#pat-choice` panel in `index.html`):
  - **The choice.** After a TD (and after the optional score replay) we no longer auto-kick — the `dead`-state
    handler and `endReplay` now call `showPATChoice()`, which sets `G.state='patdecision'` and shows the
    `#pat-choice` overlay with two buttons: ① KICK · +1 and ② GO FOR 2 · +2 (keyboard ①/② work too, mirroring
    the 4th-down panel). `choosePAT('kick')` → the existing `startExtraPoint()` kick game; `choosePAT('two')` →
    `startTwoPointTry()`.
  - **The try.** `startTwoPointTry()` sets `G.twoPtTry=true` and calls `setupPlay({los:98, down:1, fd:100})` —
    one ordinary snap from the 2-yard line (fd 100 so it can only ever be a score, never a first down). A new
    guard at the TOP of `endPlay` (`if (G.twoPtTry) { resolveTwoPoint(result); return; }`) catches every ending:
    `resolveTwoPoint` gives **+2** on `'touchdown'` and **0** on anything else (tackle/incomplete/pick/lost
    fumble — all of which funnel through `endPlay`), then hands the ball to the other team on a kickoff. The try
    is untimed (no clock), just like a kicked PAT.
  - **The CPU goes for two too.** `cpuDriveEnd('touchdown')` no longer awards a flat 7 — it scores 6 for the TD,
    then ~25% of the time goes for two (≈45% good → +2) and otherwise kicks (≈94% good → +1). Net: CPU touchdowns
    now score **6 / 7 / 8** with the right banner. Verified distribution over 200 sims: 7 most common, with 8s
    and 6s appearing.
  - New globals exported on `window.__td` for testing: `showPATChoice, choosePAT, startTwoPointTry,
    resolveTwoPoint`. `G.twoPtTry` (and `G.pendingXP`) reset in `beginGame`. Verified: +2 on a converted try,
    +0 on a stuffed try, GO-FOR-2 sets up the 2-yard snap (`losYards 98`, presnap), KICK enters the `xp` kick,
    no console errors.
- **v1.27 — 🎉 Two-point celebration** (this iteration — `src/main.js`): converting a two-pointer is a big,
  gutsy moment, so `resolveTwoPoint`'s `'touchdown'` branch now throws a party — `TDShop.celebrate(null, '🎉',
  'TWO POINTS!  +2')`, the same floating-label + emoji-spray used for level-ups and shop buys (respects
  `prefers-reduced-motion` on its own). Only YOUR made conversion celebrates; a stuffed try and the CPU's
  conversions don't. Verified: a converted try spawns the `TWO POINTS!  +2` label + 12 confetti; a failed try
  spawns none.

## 🗂 File map (who does what)

| File | Job |
|------|-----|
| `index.html` | Page shell, all CSS, every HTML overlay/button, and the script load order (bump `?v=N` on every ship). |
| `src/main.js` | The Phaser game: field, players, plays, defense, kickoffs, HUD, replay, team menu. |
| `src/kick.js` | The field-goal/punt/extra-point kick mini-game. **Loads before main.js** (main uses `KickGame`). |
| `src/sound.js` | Live chiptune soundtrack (oscillators). API: `window.TDSound`. |
| `src/shop.js` | Coins, Pro Shop, Daily Rewards, the ✨ coin celebration. API: `window.TDShop` (+ `window.TDMenu` in main.js). |
| `src/progress.js` | 📈 Player progression: XP, team level, titles, the menu level bar, the capped strength boost. API: `window.TDProgress`. |
| `src/weather.js` | 🌦 Weather & night games: the over-the-field rain/snow/night overlay, the slippery-ball fumble multiplier, and the menu picker. API: `window.TDWeather`. |
| `src/season.js` | 🏆 Season mode: 2-division league (📅 NFL-style home-and-away divisional schedule, v1.23), standings, playoffs, Max Bowl, the season screen. API: `window.TDSeason` (talks to `window.TDGame` in main.js). |
| `src/draft.js` | 🏟 MY TEAM: your roster (💵 salaries + payroll/cap, v1.25), the NFL-style snake draft (📅 real Draft Day + 🔀 on-the-clock pick trades, v1.25), scouting & trades (💰 rating-priced, v1.24), and 📣 rival trade requests (v1.25). API: `window.TDDraft` (`boost()` read by main.js; talks to `window.TDGame`, `TDShop`). |
| `src/stats.js` | World counters (Abacus) + review pop-up + the menu side-tracker. API: `window.TDStats`. |
| `src/tour.js` | 🎓 The step-by-step tutorial (coach marks). API: `window.TDTour` (`maybeStart`/`start`/`active`). |
| `src/ads.js` | Animated TV-break commercials. |
| `dashboard.html` | Private dev dashboard (world numbers + on-device reviews). Not linked from the game. |

Script load order matters: `stats → sound → shop → progress → weather → season → draft → ads → tour → kick → main`.

## 🧰 Conventions

- **Cache-buster:** bump every `?v=N` in `index.html` (and the `stats.js?v=` in `dashboard.html`)
  by 1 whenever files change, so browsers/iPads grab the new version instead of a saved copy.
- **Comments are kid-friendly on purpose** — Max reads the code.
- **localStorage keys are prefixed `tdr-`.** On `localhost` the world counters use a
  separate `-dev` namespace, so home testing never inflates the real world numbers.

## 💾 Persistence (localStorage keys)

`tdr-coins`, `tdr-gear`, `tdr-daily`, `tdr-owned-uniforms`, `tdr-trk`,
`tdr-games`, `tdr-reviews`, `tdr-country`, `tdr-counted-player`, `tdr-counted-geo`,
`tdr-known-countries`, `tdr-review-asked`, `tdr-muted` (🔇 sound on/off),
`tdr-view` (3D or 2D field view), `tdr-season` (the whole in-progress season),
`tdr-titles` (all-time Max Bowl wins), `tdr-maxwell` (👑 the superstar-defender toggle),
`tdr-tour-*` (which 🎓 coach-mark tutorials you've already seen — this replaced the old
`tdr-seen-howto` when v1.10 swapped the HOW TO modal for the step-by-step tour),
`tdr-xp` (📈 lifetime XP — your team level is derived from it),
`tdr-weather` (🌦 your weather pick: auto / clear / night / rain / snow),
`tdr-roster` (🏟 your eight drafted/traded starters — the array `draft.js` saves; a fresh default
team of honest 60s is regenerated automatically if it's ever missing).

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

The 🏈 **Add-On Draft Board** (a chart Max keeps) ranked features easiest → hardest — and as of v1.24
**every pick on it is now built.** ✨ coin celebration (v1.11), 🎁 daily rewards + 🛍 Pro Shop + 🏈 pick-six
(v1.12), ✏️ Touchdown Fun rename (v1.13), 📈 progression (v1.14), 🎥 replay big stops (v1.15), 🌦 weather
(v1.16), 🧩 CPU formations (v1.17), 🏟 MY TEAM draft/scout/trade (v1.19), 🎩 trick play (v1.20), 🎮 two-player
(v1.21), 👑 Maxwell boss team (v1.22), 📅 NFL-style scheduling (v1.23), 💰 pricier stars (v1.24). The
🌍 online-leaderboards pick was **deleted** on Max's call (needs a real backend; not wanted right now).

Then Max opened a **Round-2 Add-On Draft Board** (a fresh chart) with four picks — and as of **v1.25 those
are all built too**: 📅 real Draft Day, 🔀 trading draft picks, 💵 player salaries, 📣 rival trade requests
(see the v1.25 section above). Round 2: swept.

**Fresh ideas for whenever Max wants more (the board's wide open):**

- 🏟 **MY TEAM follow-ups**: wire the ⭐ traits to real gameplay nudges (a 🚀 Speedster actually faster,
  🎯 Cannon Arm throws farther); show your drafted QB/RB names on the field; a yearly "draft day" tied to
  Season mode; or player growth (young picks level up as you play).
- 📅 **Season deepening**: seed the playoffs by division (division winners get a bye), or drop the 👑 Maxwell
  boss team into the league as the team to beat for the Max Bowl.
- 🎩 **More trick plays**: a second unlock (double-pass / hook-and-lateral), or earn extra trick uses.
- 🎮 **Two-player extras**: let Player 2 throw (a second action button) so the red offense can pass too.
