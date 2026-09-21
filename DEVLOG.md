# 🏈 Touchdown Fun — Dev Log (where we left off)

A quick "control room" note for whoever opens this repo next (probably future
Max, or Claude helping Max). The player-facing story lives in the README; this
file is the *developer* view: current state, how the pieces fit, and what's next.

---

## 📍 Where we are

- **Version:** v4.9 — cache-buster is `?v=165` in `index.html`.
  - Round 6 swept (v1.48–v1.57), **Round 7 swept** (v1.58–v1.67), v1.68 tidied the portrait menu.
  - **Round 8 — The Front Office Board: SWEPT 8/8.** 🌟 Player Nicknames v1.69 · 🍿 Concession
    Stands v1.70 · 🎙️ Broadcast Booth (already in game) · 🎯 Weekly Quests v1.77 · 🚌 Road Trip
    v1.78 · 💰 Free Agency v1.79 · 🎓 Game Plan v1.80 · 📖 Custom Playbook v1.81.
  - **🎉 Round 9 — The Locker Room Board: SWEPT 8/8.** 🗞️ The Sports Page v1.82 (`src/sportspage.js`)
    · 📻 Press Conference v1.83 (`src/press.js`) · 🎓 Coaching Staff v1.84 (`src/staff.js`)
    · 🧑‍🤝‍🧑 Team Chemistry v1.85 (`src/chemistry.js`) · 🏕️ Training Camp v1.86 (`src/training.js`)
    · ⏱️ Two-Minute Drill v1.87 (`src/drill.js`) · 🏥 Injuries & Depth Chart v1.88 (`src/injuries.js`)
    · 🚩 Coach's Challenge v1.89 (`src/flag.js`).
    **Round 9 is done.** Full regression after the sweep:
    46 modules, 41 overlays, 28 menu buttons, normal games + the drill both play start to finish,
    portrait audited at 375×812 (no overhang, no x-scroll, no new front-screen chips), 0 errors.
  - **🏁 Round 10 — The Victory Lap Board: SWEPT 8/8, AND IT WAS THE LAST BOARD (2026-09-09).** Artifact
    `b6849a3c-7936-402f-8150-36c0e2788bde`. Max's instruction this session: **finish Round 10 and
    STOP — there is no Round 11.** Eight picks, easiest→hardest, every one checked against the code
    first (that check killed a ticket-price idea — 🏟️ Stadium Builder already sells seats and pays
    gate receipts — and a fan-mail idea, already covered by 📻 Press Conference + 🗞️ The Sports Page):
    ①🧠 Football IQ Quiz **v1.90** (`src/trivia.js`) · ②🌈 Ball Skins **v1.91** (`src/ball.js`)
    · ③🐯 Team Mascot **v1.92** (`src/mascot.js`) · ④📸 Team Poster **v1.93** (`src/poster.js`)
    · ⑤🎲 House Rules **v1.94** (`src/house.js`) · ⑥🌟 All-Star Game **v1.95** (`src/allstar.js`)
    · ⑦🏅 Awards Night **v1.96** (`src/awards.js`) · ⑧🚚 Relocation & Rebrand **v1.97** (`src/rebrand.js`).
    **🛑 THE DRAFT IS OVER. Max's instruction this session was to finish Round 10 and STOP — there is
    no Round 11, and one should not be invented.** Full regression after the sweep: 60 modules,
    49 overlays, 111 buttons, all 15 pop-ups open/close cleanly and fit portrait at 375×812 (no
    overhang, no x-scroll, the tall ones scroll inside the shared 86vh cap), normal games and the
    ⏱️ drill both play start to finish, 0 console errors. **Six of the eight picks shipped with a
    real bug found and fixed during verification** — see each feature's commit message.
  - **🌈 IF YOU EVER DRAW THE BALL SOMEWHERE NEW, IT NEEDS THE SKIN.** The football is drawn in
    code, and as of v1.91 the colours come from `TDBall.look()` with the original hardcoded values as
    fallbacks on main.js's side — so a missing `ball.js` paints the identical classic ball. There are
    **TWO** ball drawings in this repo: `makeBallTexture` in main.js and `k_ball` in kick.js (the
    field-goal screen), and kick.js **caches** its texture — which is why `repaintBall()` also removes
    `k_ball`, so the kicker rebuilds it in the new colours. The first cut of v1.91 missed that and let
    you buy a golden ball and then kick a brown one. A third ball drawing would need the same two lines.
  - **🐯 THE MASCOT PROVES THERE IS NO FREE CORNER LEFT ON A PHONE.** During a game the D-pad owns
    the bottom-left, `#actions` the bottom-right, `#celeb-fx` the middle and `#streak-fire` the top. The
    mascot pop-in therefore lives at the LEFT EDGE, ABOVE the D-pad
    (`bottom: calc(safe-area + 212px)`, measured at 14px clearance on 375×812) and is `pointer-events:
    none`. Anything new that wants screen space during play has to solve this same problem.
  - **⚠️ A CSS TRANSITION MUST NEVER BE WHAT PUTS AN ELEMENT ON SCREEN.** `mascot.js` starts the pop-in
    off-edge and then writes the final `transform`/`opacity` INLINE, so it lands whether or not a frame
    of animation runs. A throttled or skipped transition would otherwise leave it parked off-screen at
    opacity 0 — invisible, with no error. Same family as the old spin-landing rule (don't set a landing
    state in rAF). **This also matters for TESTING: the preview pane only paints on demand, so a
    transition does NOT advance between tool calls and `getComputedStyle` keeps returning the START
    value. Measuring a mid-transition element there will lie to you — take a screenshot instead.**
  - **📸 THE POSTER MUST STAY AN `<img>`, AND ITS TITLE MUST SURVIVE ANY NAME.** `poster.js` draws a
    900×1200 canvas, but it renders the result as a real `<img>` on purpose: **press-and-hold → Add to
    Photos is the only save route Safari reliably gives an iPad**, and a bare `<canvas>` can't be
    press-and-held. There's a download button too, for computers. Don't "simplify" it back to a canvas.
    The title shrinks to 34px and then ellipsises (`fitTitle`) — the first cut stopped shrinking at 52px
    and a long name ran off both edges. ⚠️ **Pick ⑧ Relocation & Rebrand lets Max type his own team
    name, so every place a team name is drawn has to assume "whatever he typed".**
  - **🎲 `TDHouse.endGame()` MUST BE THE LAST LINE OF `endGame`.** Everything above it asks "was this a
    silly game?" before it counts anything — records, streak, ladder, events. The first cut cleared the
    flag early (beside `freezeEveryone()`), which is BEFORE `TDRecords.gameOver()`, so a 42-point romp
    with a giant ball quietly set a real personal best. **Anything you add to `endGame` that COUNTS goes
    ABOVE that line.** House rules are off entirely for season/playoff/rival/Maxwell/drill games; a
    🎃 event game may be silly but is never collected (blocking events outright was tried first and was
    worse — they run ~12 weeks a year, so a quarter of the year the switches would do nothing).
  - **The house-rule multipliers reuse the ⚡ Power-Up chain pattern:** `hsSpeed()`/`hsCatch()` fold into
    shop.js's `speedMult`/`gloveBoost`, `defSlow()` into `updateDefense`. Every getter is neutral unless
    a house game is LIVE, so a switch flipped on the menu changes nothing by itself.
  - **🌟 `beginGame` NOW TAKES A 7th FLAG, `isAllStar`,** and there is a new `ALLSTAR_TEAM` constant +
    `ALL: {off:9,def:9}` rating beside Maxwell's. The All-Star Game is a SHOWCASE, so `G.allStarGame`
    switches off the ranked ladder, the win streak AND house rules — a trophy you could farm or win with
    a giant ball would be worthless. The bar to make the team is `66 + 2×level` capped at 82: a fixed
    bar would be an achievement once and then automatic forever. allstar.js learns the game ended by
    **wrapping `TDGameStats.finish`** (the injuries.js trick) rather than adding another `endGame` line.
  - ⚠️ **THE GUARD LIST IN `endGame` IS NOW THREE DEEP** (`!G.drillGame && !G.houseGame && !G.allStarGame`)
    on both the streak and the ladder. Any future "this game is special" mode needs to ask whether it
    belongs on that list too.
  - **🏅 AWARDS NIGHT NEEDS *TWO* WRAPPERS, AND THE ORDER IS WHY.** `awards.js` has ZERO main.js edits:
    it wraps `TDGameStats.finish` (a game ended → add its stat sheet to the season tally) AND
    `TDSeason.reportResult` (the season table has just updated → is the season OVER?). One wrapper is
    not enough because at `finish()` time the season still thinks there's another week to play. It
    never opens the ceremony itself — dynasty.js also reacts to a season ending, so awards just sets a
    🔴 dot on the Trophy Case button. ⚠️ Don't gate the ceremony on the PLAYER tally being non-empty:
    🧑‍🏫 Coach of the Year isn't a player, and the first cut gave a 6–0 championship season nothing at all.
  - **🚚 REBRAND IS ONE LINE IN `allTeams()`, AND THAT IS THE WHOLE DESIGN.** Every screen gets its
    teams from `allTeams()`, so `TDRebrand.apply(list)` hands it a REPLACED COPY of your team and the
    rename reaches the menu, scoreboard, standings, newspaper, trophies and poster at once. ⚠️ **It
    must return a COPY** (never mutate an NFL_TEAMS entry) or "back to normal" has nothing to go back
    to. ⚠️ **The copy carries `ratingKey` = the ORIGINAL code**, because `TEAM_RATINGS` is keyed by
    code — without it a rename silently drops your team to a default 5/5, a real gameplay change from
    a cosmetic edit (`teamRating` prefers `ratingKey`). ⚠️ **The 3-letter code is LOCKED during a
    season or playoff run** — season.js saves you as `you:'SEA'`, so changing it underneath orphans
    the save. Names and colours stay editable; only the code waits.
  - **🌈 v1.98 — BALL SKINS NOW CHANGE HOW THE GAME PLAYS (Max's call, 2026-09-09).** They were
    cosmetic; he asked for balls you buy that actually do something. Each ball is now a playstyle:
    🔥 Flame ×1.05 run speed · 🌙 Night Glow +0.06 catch · 🥇 Golden +0.35 grip (fewer fumbles) ·
    ❄️ Ice +0.30 arm (fewer picks) · 🌈 Rainbow a little of all four · 🏈 Classic neutral.
    **NO new balance system** — they fold into the same four shop.js functions the 👟 gear uses
    (`speedMult`/`gloveBoost`/`gripFactor`/`armAccuracy`) via `blSpeed/blCatch/blGrip/blArm`, so they
    stack with gear, spin, game plan, staff, chemistry and house rules and hit the same `clampPerk`
    caps. ⚠️ Unlike 🎲 house rules these apply EVERYWHERE (season/playoff included) — you bought them
    with coins like gear, and gear has always counted. Classic returns the neutral value so the plain
    ball is byte-identical to pre-v1.98.
  - **🏁 Round 11 — "The Chalkboard Board" (opened 2026-09-09).** Artifact
    `857612f6-92de-42cf-8ab7-2b99b03878b2`. Max reversed the earlier stop order and asked for a new
    board, verified the whole game first, then "work on that until the end". The coaching round:
    ①🎓 Hire Staff by ⭐ Rating **v1.99 ✅** · ②📊 League Leaders **v2.0 ✅** · ③⭐ Traits That Matter **v2.1 ✅** ·
    ④📋 Scouting Report **v2.3 ✅** · ⑤🎲 Sim This Game **v2.4 ✅** · ⑥🗣️ Audibles **v2.5 ✅** · ⑦🛡️ Call Your Own Defense **v2.6 ✅** ·
    ⑧🌟 Superstar Mode **v2.7 ✅**. **🏁 SWEPT 8/8 on 2026-09-12.** (Pick ① was originally 🧢 Create-A-Coach; Max's staff-hiring request replaced
    it, because you can't both BE the head coach and HIRE one.)
  - **🎓 v1.99 — STAFF ARE NOW HIRED BY ⭐ STAR RATING, AND THERE IS A HEAD COACH.** Candidates are
    generated with a 1–5 rating (⭐5 = 7% of rolls), and the rating drives BOTH price and strength:
    a ⭐5 does 2.78× a ⭐1 but costs 8.5× as much — the cost curve is steeper than the benefit on
    purpose. 🔍 SCOUT re-rolls the market for 75 coins. ⚠️ **Stars and levels are deliberately two
    different things**: ⭐ talent you BUY, 📈 loyalty you EARN, and `bonus()` multiplies them — which
    is why replacing a coach still resets him to level 1. ⚠️ **Old `{id,lvl,wins}` saves are MIGRATED**
    (level + wins kept, treated as ⭐3) — never reset. The six getters shop.js/main.js call are
    unchanged.
  - **📊 v2.0 — LEAGUE LEADERS.** New read-only `TDSeason.table()` (deep copy) exposes the real league:
    W/L and points for/against are genuine, because season.js already sims every other team's games.
    ⚠️ **Rival PLAYERS don't exist** (their games resolve as scores), so a rival's star is DERIVED from
    what his team actually scored, seeded off the team abbr so **the same player with the same numbers
    is there every open** — a board that reshuffled on every visit would look broken. Your own players
    are real, read from the 🏅 Awards season tally. Ties go to YOUR player.
  - **⭐ v2.1 — TRAITS THAT MATTER. The ten ⭐ traits existed since Round 2 and were wired to NOTHING.**
    ⚠️ **The rule that shaped it: a trait belongs to a PLAYER, not the team.** Everything else in this
    game (gear, coaches, ball skins, house rules) folds into one shared number; traits must not, or
    "my Speedster is fast" becomes "my team is fast". So `speedFor(slot)`/`catchFor(slot)`/`stiffFor(slot)`
    are asked BY OFFENSE SLOT and pay out only for the man carrying or being thrown at. Team-wide ones
    (🎯 Cannon Arm, 🦅 Ball Hawk, 🧱 Wall, 👑 Captain) fold into the usual shop.js chains.
    🧊 **Clutch had to be special-cased**: a player holds only ONE trait, so a 4th-quarter-only trait
    would be dead weight — instead it DOUBLES the squad's other trait effects in Q4.
    ⚠️ **Slot mapping (0 QB, 1 RB, 2/3 WR) is shared with gamestats.js — change one, change both.**
  - **🐛 v2.2 — ⚠️ `hawkBoost` IS THE ONE PERK ADDED STRAIGHT ONTO A RAW PROBABILITY, AND IT NOW HAS A
    HARD CAP (0.25).** main.js starts the CPU interception chance at 0.045 and ADDS hawkBoost to it,
    so a big value here means "every other pass is picked off", not "a bit better". Every other perk
    is clamped (`clampPerk` at 0.95, `stiffChance` via `clamp01`) — this one wasn't. Maxed gear (0.20)
    + a ⭐5 lvl-5 DC and head coach (0.22) + two 🦅 Ball Hawk traits doubled by 🧊 Clutch (0.16) stacked
    to **0.58 → a 65% interception rate (14.6×)**. Partly pre-existing (gear + old flat staff already
    hit 0.27) but v1.99 and v2.1 tipped it from strong to broken. Now ~32% at the ceiling. **Found by a
    verification sweep, not by playing — measure the CEILING of any perk that feeds a probability.**
    `speedMult` also gained a 1.75 safety ceiling: eight systems multiply into it and traits multiply
    it again, but a maxed build only reaches 1.53, so nothing today changes — it just stops the NEXT
    fold-in making the player uncatchable (pursuit is 194 vs a base 205).
  - **🏁 Round 12 — "The Rulebook Board" (drawn 2026-09-13, after Max verified v2.9 and sanctioned a
    new board).** Artifact `0fe7e588-1808-4f12-90d8-ff516e96b77f`. **Theme: the parts of real football
    this game has never had.** Every pick was grepped for first and the check was unusually clean —
    **penalties existed ONLY as 🧠 trivia answers**, and there is no spike, kneel, hurry-up, momentum
    or home-field edge anywhere in the code. Order: ①📣 Home Crowd **v3.0 ✅** · ②🧮 Fourth-Down Helper **v3.1 ✅** ·
    ③⏱️ Spike It & Kneel It **v3.6 ✅** · ④📊 Self-Scouting **v3.8 ✅** · ⑤🟨 Penalties **v3.9 ✅** ·
    ⑥⏰ Hurry-Up Offense **v4.0 ✅** · ⑦🔥 Momentum **v4.1 ✅** · ⑧🛡 Pass Protection **v4.2 ✅** — **🎉 ROUND 12 SWEPT 8/8.** ⚠️ **④ and ⑧ are deliberate mirrors of Round 11** (Self-Scouting points 📋 the
    Scouting Report back at you; Pass Protection is 🛡️ Call Your Own Defense from the other side).
    ⚠️ **⑤ Penalties and ⑦ Momentum carry a warning printed on the chart** — penalties that fire too
    often stop being football, and momentum that only rewards whoever is ahead turns every game into
    a blowout. Both must be tuned by MEASUREMENT.
  - **🚚 v3.2 — "WE ARE STUCK ON THE COMETS AND THERE ARE NO SEAHAWKS ANYMORE" (Max, 2026-09-13).**
    ⚠️ **I first misread that as "stuck on the comments"** and went off and fixed the announcer bar
    (v2.8 — a real problem, and the measurement stood up, but it was not what he was reporting). The
    Comets were the answer: his save held a 🚚 Relocation & Rebrand `{"base":"SEA","city":"Fortree",
    "name":"COMETS"}`, and that feature REPLACES your team's entry by design (v1.97) — which is
    exactly why Seattle had vanished rather than gained a second row. ↩️ BACK TO NORMAL undoes it and
    does work: verified back to SEAHAWKS, navy `#002244` + action green `#69BE28`, all 32 teams
    matching the table. **LESSON: read the bug report literally before reaching for the nearest
    plausible bug.**
  - **🐛 …AND UNDERNEATH IT, A REAL ONE: TWO TEAMS COULD SHARE A THREE-LETTER CODE.** He had also
    designed a custom kit named "seahawks", so `uniform.js`'s `abbrFor()` gave it the code **SEA** —
    the code the real Seattle owns. `abbrFor()` only ever checked YOUR OTHER KITS for a clash, never
    the 32 real teams. ⚠️ **The code is this game's primary key**: `teamByAbbr` does a `.find()`,
    season.js saves you as `you:'SEA'`, the playoff bracket stores codes, rebrand matches on one. A
    `.find()` returns the FIRST hit, so one of the two teams was **permanently invisible to every
    lookup in the game while still sitting in the menu**. Nothing crashed; it was quieter than that.
    Fixed at both ends: `abbrFor()` now avoids real-team codes (so the clash is never created), and
    `allTeams()` ends in a new **`dedupeCodes()`** — the real team keeps its code, a later collider
    keeps its name and colours and gets a fresh code from its own name (his kit is now `SE2`, kept
    and reachable rather than deleted). ⚠️ `ratingKey` is carried through so a re-coded team still
    plays exactly as before (the v1.97 rule: a cosmetic change must never become a gameplay change).
  - **⛶ v3.3 → v3.4 — FULL SCREEN, AND THE HONEST ANSWER TO "MAKE IT FULL SCREEN WHEN I OPEN IT".**
    ⚠️ **No page can do that.** `requestFullscreen` only works inside a real user gesture; every
    browser blocks it on load, deliberately, so a page cannot hijack your screen. What IS allowed is
    going full screen on a tap you were making anyway — so the ▶ PLAY tap now takes the whole screen
    with you. Escape leaves it; the next PLAY puts you back.
  - **⚠️ v3.4 — THERE IS NO FULL-SCREEN BUTTON, AND THERE MUST NOT BE (Max's call).** CrazyGames will
    not accept a game carrying its own full-screen control — it clashes with theirs — and **the portal
    build is a COPY of this repo**, so the hide rule belongs in the source, unscoped, not in a recipe
    step somebody has to remember. v3.3 briefly scoped it to `body.portal` and that was the wrong way
    round. ⚠️ **`autoFullscreen()` also returns early on `body.portal`**, because inside their iframe a
    fullscreen request either fails or fights their own control — that one class switches the whole
    feature off for the portal copy. ⚠️ **iPhone Safari has no fullscreen API at all** (iPad and
    computers do), so `fsSupported()` says no rather than failing silently.

  - **🔬 HOW TO ASK "IS THIS BUTTON ON SCREEN?" WITHOUT GETTING A CONFIDENT WRONG ANSWER.** Closing out
    v3.8 I chased a suspected bug in the ⏱️ clock button and got **three false readings in a row** —
    each one looked like a real product bug and none of them was. `_verify.js` now exports
    `vis(id)` / `sane()` / `awake()` so this cannot happen again. The three traps, all still live:
    ① **`offsetParent === null` DOES NOT MEAN HIDDEN — it is always null for `position: fixed`**, which
    is *every* in-game control here (`#dpad`, `#actions`, `#ingame-ctrls`, `#btn-power`, `#btn-clock`).
    A visibility helper built on it reports the entire on-field UI as hidden. Walk the ancestors for
    `display:none` instead. ② **A HIDDEN PREVIEW PANE reports `innerWidth` 0 and every rect 0×0**, and
    at zero width even `#dpad` computes to `display:none` — so measurements taken then are not just
    imprecise, they are *inverted*. Wake the pane (screenshot / `resize_window`) and check
    `innerWidth > 0` before believing any geometry. ③ **STALE GAME STATE between tool calls**:
    `startGameWithTeam()` opens with `if (G.state !== 'menu') return;`, so calling `kickoffToDrive()`
    after a game has ended **does nothing at all** and leaves `body.kicking` hiding every control —
    which reads exactly like the bug you were hunting. ⚠️ **ALWAYS ASSERT A KNOWN-GOOD BASELINE FIRST**
    (`sane()` = the D-pad and action pad are up mid-play). A test that cannot see the things that are
    definitely there cannot be trusted about the thing you are actually asking about.
  - **✅ AND THE ANSWER WAS: NO BUG.** On a clean load the ⏱️ button is absent in Q1, shows 🏈 SPIKE at
    Q4 0:40 behind, shows 🧎 KNEEL at Q4 1:00 ahead, and every play control is gone at game over.

  - **🏁 Round 13 — "The Game Day Board" (drawn 2026-09-17, right after Round 12 swept).** Artifact
    `50618cb0-d796-44a4-96cc-c729da1a2878`. ⚠️ **Max reversed the stop order again** — "if it's swept,
    then build a new board, upload it, and start working on it" — so the autopilot is RUNNING again.
    **Theme: game day itself** — the hour before kickoff and the moments between whistles. Order:
    ①🪙 Coin Toss **v4.3 ✅** · ②👕 Home & Away Jerseys **v4.4 ✅** · ③🙋 Punt Returns & the MUFFED PUNT **v4.5 ✅** (finished in **v4.8** — see below) ·
    ④⏳ The Play Clock **v4.6 ✅** · ⑤🔇 Silent Count **v4.7 ✅** · ⑥🧑‍🤝‍🧑 Personnel Packages · ⑦📈 Win Probability ·
    ⑧😮‍💨 The Gas Tank. ⚠️ **The grep check killed two ideas**: blocked kicks (v1.28 already gives the
    kick game a rusher who can block one) and kick returns (`startKickoff`/`controlReturner` have
    existed for ages — which is exactly what makes the PUNT return a clean gap). ⚠️ **⑤ depends on ②
    and ④** — it needs to know you are on the road and needs a snap count to be silent about.
  - **🏃 v4.9 — …AND NOW THE BALL SQUIRTS PAST YOU, SO YOU REALLY HAVE TO RUN (`main.js` only).**
    ⚠️ **v4.8 MADE THE RACE REAL, BUT MOST OF THE TIME NOBODY RAN.** It still dropped the ball anywhere
    in an 80×60 box centred **on** the returner — and **43% of that box is inside `RECOVER_DIST`**
    (26px). On those landings `updateLooseBall` found him already standing on it on its very first
    frame, and the "scramble" lasted zero frames. Measured on the REAL punt, driven by the REAL game
    loop, with nobody touching anything: **recovered 5 times in 7, all 5 instant** (landed 6–25px away).
    v4.8's own notes said *"stand still and they take it"* — true only in its test, which placed the
    ball by hand with the nearest gunner 212px away. In a real punt the gunners start 70–95px away.
    **The fix:** the ball keeps going the way a real muff does. The punt was coming down the screen at
    you, so it pops out **past** you with that momentum — a 25°–155° fan toward your own goal line,
    away from the gunners — and always at least `MUFF_MIN` = `RECOVER_DIST + 20` = 46px (max 64, ~6
    yards). ⚠️ **Not a random direction, on purpose:** a ball squirting upfield lands between the
    gunners, and a race you lose before a nine-year-old can move a thumb is a coin flip with extra
    steps — the exact thing this feature exists to remove.
    **Swept over every landing spot (2,489 per difficulty), gunner starts taken from
    `startPuntReturn`:** never touch → **0 recoveries on easy, medium AND hard**; start pushing within
    **0.73s (easy) / 0.69s (medium) / 0.67s (hard)** of "MUFFED IT!!!" → you win it on ANY landing
    (typical landing: 0.91 / 0.86 / 0.83s). A kid reacting to the banner (~0.3–0.5s) always gets it
    back; one who daydreams loses it. **The real-loop trials agree with the model to ~30ms** (medium:
    300 / 700 / 850ms reactions all won, 1000ms lost, never-touch lost 3/3). The ordinary FUMBLE
    bounce (~line 1609) is deliberately untouched — it isn't part of Max's request.
  - **🧪 THREE MORE HARNESS TRAPS, ALL FOUND WHILE CHECKING THIS.** ① **When the preview pane is
    VISIBLE, Phaser's REAL loop runs** (`loop.frame` advances on its own at 60fps) — and `_verify.js`'s
    `RUN` steps the scene AGAIN on top of it, so timers, tweens and physics all run ~2× fast. The
    harness assumes a hidden pane. **When visible, don't pump: just wait on `requestAnimationFrame`
    and let the real loop drive** — that is also simply the most faithful test there is. ② **Stepping
    the scene on SYNTHETIC time freezes every tween** (3.87's TweenManager keys off the real loop), so a
    punt flight never lands. ③ **The pane flips between visible and hidden on its own**, which pauses
    the real loop mid-trial and silently corrupts wall-clock reaction timing — one "win" came out of
    exactly that. When the pane can't be trusted, **finish with an analytic sweep of the real geometry**
    and use the measured trials as the check on the model, not as the whole answer.

  - **🏃 v4.8 — THE MUFF IS NOW A REAL SCRAMBLE (finishes Round 13 pick ③, `main.js` only).**
    ⚠️ **THIS WAS MAX'S OWN REQUEST AND IT HAD BEEN HALF-BUILT FOR THREE VERSIONS.** He asked for it
    on 2026-09-17: *"can you make it so you can actually miss the punt? Or you can catch it but you
    drop it, **and you have to run for it and get the ball back**?"* v4.5 built the miss and the drop
    beautifully — and then settled the loose ball with `Math.random() < OFF_RECOVER_CHANCE` while
    every player stood frozen. The file's own comments called it "a **LIVE BALL**"; it wasn't one.
    The chart showed ③ as ✅ the whole time, which is exactly how a half-built idea disappears.
  - **🏃 WHAT IT DOES NOW.** The bounce lands (480ms), then the game enters a new `'loose'` state:
    you drive your returner with the D-pad, the **three** nearest gunners run at the BALL rather than
    at you, and the first man within `RECOVER_DIST` (26px) falls on it. ⚠️ **There is no randomness
    left in the path at all** — a muff was already the unluckiest moment in the game, and deciding
    the recovery with a second coin flip on top made it something that happened to you *twice*. Now
    it is a race you win by getting there. ⚠️ Only 3 of the 7 chase: all seven converging is both
    hopeless and unreadable on a phone. ⚠️ It cannot hang — after `LOOSE_MS` (4.2s) the pile goes to
    whoever is **actually closest**, which is the same question answered early, not a dice roll.
  - **🐛 THE BUG WAS IN MY TEST, AND IT PASSED CONVINCINGLY BEFORE IT WAS RIGHT.** Staging a loose
    ball by hand, I set the positions and the state but forgot `ballFollow = false` — which the real
    `muffThePunt` does. So `updateBall()` glued the ball **to my own player** every frame: the
    "race" was the ball chasing me, I won it from 170px away without pressing anything, and both
    scenarios reported `byYou: true`. ⚠️ **A staged state must reproduce EVERY flag the real entry
    point sets, not just the interesting ones.** With `ballFollow` fixed: run for it and you recover
    at 24px while the nearest gunner is still 212px away; stand still and they take it.
  - **🧪 TWO HARNESS TRAPS COST MORE TIME THAN THE FEATURE.** (1) A **stale `delayedCall`** from a
    previous scenario (`delayedCall(1500, startCpuDrive)`) fired during the next test and dragged the
    game into `dsim` — a clean reload per scenario is not optional. (2) `G.scene.time.now` read
    13652 right after the call while `update()` was being handed `time=50478`, so a deadline computed
    from the wrong clock can expire instantly. Verified the right way by **counting frames inside
    `updateLooseBall`**: 51 live frames with `expired=false`, then a real resolution.

  - **🔇 v4.7 — THE SILENT COUNT (Round 13, pick ⑤, `src/silent.js`, no save).** The pick the last
    three were building towards: 📣 the crowd (v3.0), 👕 home-and-away (v4.4) and ⏳ the play clock
    (v4.6) all meet here. ⚠️ **CROWD NOISE HAD ONLY EVER POINTED ONE WAY** — crowd.js tilts THEIR
    offense and hands them a flat +3% on the road, but nothing in eleven rounds ever made noise cost
    YOU anything at the line, which is the one thing a hostile crowd is actually famous for.
    **On the road the noise takes two things:** ⏳ **TIME** — the play clock is **11 seconds instead
    of 15**, because the call takes longer to get in. *This is the half you feel every down, and it is
    what makes the other half bite:* a shorter clock means you reach the red more often, and the red
    is the only place a false start lives, so the two compound with no third effect bolted on.
    🏃 **CALM** — the false-start chance **doubles**.
    **🔇 THE SILENT COUNT is the answer:** snap on a look, not a call. Chance drops to **0.45× —
    below even the home rate**, because a line watching the ball genuinely is the calmest a line ever
    gets. ⚠️ **THE COST IS A PASSING COST ONLY, and that is worth knowing before tuning it.** It rides
    on main.js's `ppRush()`, which `updateDefense` reads **inside the `qbHasBall` branch** — the moment
    the ball is handed off or thrown, everyone switches to PURSUE_SPEED and the number stops applying.
    So going silent makes your POCKET worse and does nothing to a running play. Narrower than the real
    football version, but it is the honest description of what the code does, and it makes the trade
    cleaner: **silent is cheapest on the downs you were going to run anyway.**
    ⚠️ **"SPICIER, NEVER UNFAIR" IS HELD IN CODE, NOT BY PICKING NICE NUMBERS.** `playclock.fullSecs()`
    CLAMPS whatever silent.js asks for to at least `DANGER_AT + 5`, so there are **always five seconds
    in which a snap is completely safe**. That floor lives in playclock.js ON PURPOSE — a number wrong
    in silent.js cannot reach through and make the road unfair. Swept with 0/1/3/9/11/15/99/−4/NaN:
    every one lands in [9, 15].
    ⚠️ **`chanceAt()` STAYED PURE.** v4.6 left it as a pure function of one argument specifically so
    this pick would be small; everything situational multiplies on in the new `liveChance()`. That is
    why ⑤ cost playclock.js five lines.
    **Where the switch lives:** a row in the 🗣️ AUDIBLE panel beside 🛡 pass protection — `#sc-row`,
    a **sibling** of `#aud-body` (audible.js rewrites that body's innerHTML every render; protect.js
    learned this in v4.2). `#ingame-ctrls` is full at four buttons and ⏳ the play clock already had to
    shorten its own label to fit beside them, so there is no room up there at all. ⚠️ **And opening
    that panel PAUSES the play clock**, which is why it is a safe place to put a decision.
    ⚠️ **IT SAYS ONE SENTENCE, ONCE A GAME** (the first road line of scrimmage points at the 🗣️
    button). A feature buried in a panel a nine-year-old has to go looking for is a feature nobody
    finds. crowd.js says nothing because it happens every down; this happens once.
    **Verified:** every getter exactly neutral at home (`noiseMult` 1, `clockSecs(15)` 15, `rushMult`
    1, the row renders to empty, and `set(true)` is refused outright) so a home game plays precisely
    as it did before the file existed; road-shouting 0.300 > home 0.150 > road-silent 0.068 at 2.0s;
    the clock reads 11 on three consecutive road downs and the call is sticky across them; the row
    renders two ≥40px taps that do not run a play; the panel with BOTH rows fits 375×812 at 353×676
    with 68px to spare; 0 console errors.
  - **⏳ v4.6 — THE PLAY CLOCK (Round 13, pick ④, `src/playclock.js`, no save).** ⚠️ **THESE ARE THE
    TWO PENALTIES v3.9 DELIBERATELY LEFT OUT.** 🟨 `penalty.js` hooks `endPlay` and judges plays that
    actually RAN, so it could never call the two fouls that happen in the silence BEFORE the snap:
    ⏳ delay of game and 🏃 false start. This is that missing half of the rulebook, and it hooks the one
    place penalty.js cannot reach — the `presnap` branch of `update()`. They can never collide:
    penalty.js parks a play that has ENDED, this parks one that has not STARTED, so unlike 🟨 vs
    🚩 the Coach's Challenge no sequencing was needed.
    **The clock is 15 REAL seconds** (the game clock doesn't run between plays — `advanceClock` only
    fires when a play ends) and it **PAUSES whenever any `.ov` panel is open, during 🎓 the tour, and
    in a hidden tab**. That pause is not a courtesy, it is the feature: opening 🗣️ AUDIBLES to read
    four play descriptions is not dawdling, and a play clock that punished you for using the rest of
    the game would be a bug wearing a rulebook.
    ⚠️ **A FALSE START IS ONLY POSSIBLE IN THE LAST 4 SECONDS**, rising from 0 at 4.0s to 30% at 0.0s.
    That shape IS the balance: if it could happen on any snap the lesson would be "snap immediately",
    which would quietly delete 🗣️ audibles, 🧩 formations, 🎩 tricks and 🛡 protection — four features
    that live in exactly the seconds it would be telling you to skip. **Eleven of the fifteen seconds
    are completely safe.** Brakes in the penalty.js spirit: never on 4th down (the heartbreak rule),
    never two in a row, never on your first snap of a game, at most two a game.
    ⚠️ **AND IT GIVES ⏱ TIMEOUT A REASON TO EXIST AT THE LINE** for the first time since v1.7 — a
    timeout buys a fresh play clock, which is precisely why real coaches burn one there.
    ⚠️ **A DELAY NEVER COSTS THE DOWN** (5 yards, replay it — the real rule), half-the-distance is
    honoured, and **two delays in a row with nobody there PARKS the clock** rather than walking the
    team backwards forever on an iPad left on the sofa.
    **TWO BUGS FOUND IN VERIFICATION.** ① **THE TIE FRAME.** The first cut ticked the clock before
    reading the hike, so pressing HIKE on the exact frame it expired still gave you a delay of game —
    you beat the clock and were penalised for it. The tap is read first now and **every tie goes to
    the player**; a snap that got away before zero is a legal snap. ② **A 375px COLLISION.** Under
    430px `#ingame-ctrls` drops to y104 with its buttons starting at x84, and "⏳ 14 PLAY CLOCK" is
    103px wide — it ran straight under ⏱ TIMEOUT. That is the v1.44/45 status-bar pain exactly. The
    words now drop under 430px and the ⏳ hourglass carries the meaning alone (41px, 31px of daylight).
    ⚠️ **AND THE STALE-CACHE TRAP BIT AGAIN, EXACTLY AS IN v4.3.** The tie-frame fix tested as still
    broken for three rounds because the browser was serving a CACHED `index.html` whose script tags
    still said `?v=160` — the fix was on disk and not on the page. **Bumping `?v=` does not help if the
    HTML itself is cached: load `index.html?cb=<something new>` to force it.** Checking
    `document.querySelector('script[src*="main.js"]').getAttribute('src')` is the two-second way to
    know which build you are actually testing, and it should be the FIRST thing checked when a fix
    "doesn't work".
    ⚠️ **AND `document.hidden` IS TRUE IN THE PREVIEW PANE** even at 1280px with real rects — so the
    clock correctly refused to run at all, which read exactly like a dead feature. Patch it with
    `Object.defineProperty(document,'hidden',{get:()=>false})` to simulate a foregrounded tab.
    **Verified:** 24 pure-rule assertions (the chance curve is 0 outside the danger window and rises
    monotonically inside it; a 1..99 sweep proves a pre-snap penalty can never reach yard 0, so it can
    never hand them a safety; the down never advances); the clock drains at real time and freezes for
    both pre-snap panels; delay of game lands the exact spot/down/marker with the **game clock
    untouched**; the false start fires with the ball never snapped and all six brakes hold; the
    cooldown and the per-game cap hold; the walk-away park works and you can still just play from it;
    80 modules on one cache-buster, 56 overlays all fitting portrait, no sideways scroll, 0 console
    errors.
    🔇 **WHAT PICK ⑤ WANTS FROM THIS FILE:** `chanceAt()` is a pure function of one argument on
    purpose — the Silent Count multiplies it by road noise and divides it back down in exchange for a
    slower start. That is deliberately a small change.
  - **🙋 v4.5 — PUNT RETURNS & THE MUFFED PUNT (Round 13, pick ③, `src/puntreturn.js`, no save).**
    ⚠️ **UNTIL NOW A PUNT WAS A KICKOFF.** When they punted, `takeYourBall()` called `startKickoff()` —
    same deep boot, same wall of coverage, same "RETURN IT!". A punt differs in three ways that all
    matter and are all now real: **it is shorter** (fielded at your own 26–48, not your own 8, so the
    return starts with real field position and less room), **the gunners are already there** (two
    sprinted down while it hung; the rest are still coming), and therefore **you may say no** — 🙋
    FAIR CATCH ends it the instant you touch it.
  - **🙋 THE FAIR CATCH IS ONLY A DECISION BECAUSE OF THE MUFF, AND VICE VERSA.** Catch it with a
    gunner on top of you and you can drop it — and a muffed punt is a **LIVE BALL** either team can
    fall on. *Free yards, or the chance of handing them the ball.* ⚠️ Build one without the other and
    you have built nothing: a fair catch with no risk to avoid is just a worse return, and a muff with
    no fair catch is bad luck happening *to* you. The dials, all measured: **a muff is never random**
    (`muffChance()` is 0 beyond 95px — caught in space you will never drop it, and it is monotonic, so
    closer is never safer), **a fair catch is 100% safe by construction** (`catchThePunt` returns on
    `G.puntFair` *before* the muff check exists), **a muff is not an automatic turnover** (the same
    `OFF_RECOVER_CHANCE` your fumbles use), and the ceiling is **34%** even on your chest.
  - **🙋 IT REUSES THE `kickoff` STATE ON PURPOSE**, so `controlReturner`, `updateKickoffCoverage`,
    `checkKickoffTackle` and the replay recorder all work here untouched; `G.puntPlay` is the only
    thing that tells the two apart. ⚠️ `#btn-faircatch` must **not** inherit
    `body.returning { display:none }` the way the pre-snap buttons do — a punt return *is* a return,
    so that rule would hide the button at the only moment it is meant to exist.
  - **🐛 THE BUG I WROTE AND CAUGHT BEFORE SHIPPING:** `startPuntReturn()` calls `startKickoff()` for
    the setup it needs — but `startKickoff` also fires **its own ball tween**, which landed underneath
    the punt, set `koLive` early and shouted "RETURN IT!" over a ball still in the air. `startKickoff`
    now takes an explicit **`asPunt`** flag that skips the kick itself. ⚠️ Reusing a function for its
    side effects means auditing *all* of them, not just the ones you wanted.
  - **⚠️ THERE ARE NOW **TWO** CARDS BETWEEN THE MENU AND THE KICKOFF, AND IT LOOKS EXACTLY LIKE A
    HANG.** `beginGame` holds the game behind `TDScout.pregame(…, afterScout)` → `TDToss.pregame(
    openingPlay)` → kickoff. Tapping only 🏈 LET'S PLAY hands off to the **coin toss**, which holds it
    again, so the state sits on `'menu'`. I spent a while treating this as a v4.5 regression before
    proving `startKickoff()` itself was fine and finding the second gate. ⚠️ **`#toss-panel` is NOT a
    `.ov`**, so an overlay sweep does not see it either — which is what made it invisible to the
    check. `_verify.js`'s `clearGates()` now walks BOTH gates and `finishGates()` closes the toss.

  - **👕 v4.4 — HOME & AWAY JERSEYS (Round 13, pick ②, `src/homeaway.js`, no save).** ⚠️ **MAX'S OWN
    IDEA**, asked for mid-Round-12 and parked when full screen jumped the queue: *"wear different
    jerseys depending on which game it is, and the jerseys should matter."* The second half of that
    sentence is the point — a white shirt that only looks different is a costume.
  - **👕 THE GAME ALREADY KNEW WHO WAS HOME AND WAS THROWING IT AWAY.** `divisionRoundRobin` builds
    the second half of the season by flipping every pairing (`[a,b]` → `[b,a]`), so the FIRST team in
    a pair has always been the home team — and the schedule screen has said "(division rivals, home &
    away)" in its caption this whole time. But `pairFor()` only answered "who do I play?", looping
    over both slots and returning the other one, which dropped the order on the floor. A new
    `homeAway()` reads it. **Verified on a real season: 3 home, 3 away, weeks 4–6 the exact mirror of
    1–3, same opponent each time (LAR/NYG/BUF → LAR/NYG/BUF).** The schedule chips now say `@`.
  - **👕 ON THE ROAD:** white jersey (helmet stays YOUR colour so you never lose track of who you
    are), **no 📣 home crowd** — those are your seats, your streak, your stadium, and none of them
    travelled — and a **hostile crowd instead: +3% to their offense**. ⚠️ Deliberately HALF the home
    ceiling of 6%: the road should be a headwind you can feel, not a tax. A kid losing away should
    lose to the other team, not to a multiplier. ⚠️ Season games only — a quick game, a 👑 boss game
    and the 🏆 playoffs are all HOME, so everything tuned before this file needs no re-tuning.
  - **🐛 THE BUG: THE KIT COLOURS ARE INTS, NOT CSS STRINGS.** `AWAY_JERSEY` was written `'#eef2f7'`,
    but every kit colour in this game is a Phaser colour int (`G.team.jersey` for Seattle is **8772**,
    i.e. 0x002244) and `makeChibiTexture` hands it straight to `graphics.fillStyle()`. So the white
    kit **silently did nothing**: the away flag was right, the crowd was right, the schedule said `@`
    — and the players ran out in their home shirts. Fixed to `0xEEF2F7`.
  - **🧪 AND THE TEST THAT CAUGHT IT MATTERS AS MUCH AS THE FIX.** A screenshot showed the wrong
    shirts but could not say why, and **sampling a pixel out of the texture was useless** — the
    shoulder pads are drawn under a dark rim, a shading pass and a white sheen, so both teams sampled
    to the same muddy grey. ⚠️ **Wrap the painter instead**: `makeChibiTexture` is a global (main.js
    is a classic script), so recording its arguments answers the question exactly — away paints
    15659767, home paints 8772, helmet identical in both.

  - **🪙 v4.3 — THE COIN TOSS (Round 13, pick ①, `src/toss.js`, no save).** ⚠️ **The point is the
    SECOND choice, not the first.** Calling heads is a 50/50 guess; what matters is that winning it
    lets you ⚡ TAKE THE BALL or ⏳ DEFER — and deferring is what nearly every real NFL team does and
    what a nine-year-old has never heard of. Get a stop after deferring and you can end the first half
    with the ball AND start the second with it. The pick is a lesson wearing a coin costume.
  - **🪙 IT WAS NEARLY FREE, AND AN OLD COMMENT PROVED IT.** All four halftime sites already said
    `startBreak('half', startCpuDrive)` under a comment reading *"you fielded the game-opening
    kickoff, so the OTHER team gets the ball to start the second half"*. That sentence contained an
    ASSUMPTION — *you* fielded the opening kick — which was simply always true. The toss just makes it
    conditional via a new `secondHalfKick()`; the clock, quarter and drive logic are untouched.
    Verified both ways, plus that removing the module returns the old behaviour exactly.
  - **🪙 IT CHAINS ONTO 📋 THE SCOUTING REPORT'S GATE** (`pregame(cb)` → return true to hold the
    kickoff, call back when done). Order is coaches → captains → football, and `G.state` stays 'menu'
    behind both cards so nothing runs underneath. ⚠️ Skipped for the ⏱️ drill, 🌟 All-Star, 🎲 house
    games and a half-time takeover — a toss in front of a practice field is ceremony, not football.
  - **🐛 THE BUG WAS NOT IN THE FEATURE, IT WAS IN HOW I TESTED IT — AND IT IS THE ONE THE DEVLOG
    ALREADY WARNS ABOUT.** The toss card never appeared and `TDToss.pregame` was provably never
    called, which looked exactly like a broken gate. The cause: I added `toss.js` but **did not bump
    the `?v=` cache-buster**, so the browser served the NEW toss.js beside the **cached OLD main.js**
    that had no toss chain in it. ⚠️ **A changed `src/` file behind an unchanged `?v=` serves stale.**
    `fetch(url, {cache:'reload'})` on the changed files, then reload, and it worked first time.
  - **🧪 `secondHalfKick()` was testable only because main.js is a CLASSIC SCRIPT** — its top-level
    functions are globals, so the rule could be checked directly from the console instead of playing
    to half time (the harness still cannot drive the `dsim` defence state past a boundary).

  - **🛡 v4.2 — PASS PROTECTION (Round 12, pick ⑧ — THE LAST, `src/protect.js`, no save).** The
    offensive mirror of 🛡️ Call Your Own Defense: three schemes, each a real trade. 🛡 **MAX PROTECT**
    keeps the back in — four blockers, a longer pocket, but no route to him and **no hand-off** (you
    cannot give the ball to a man blocking a linebacker for you). ⚖️ **BALANCED** is what the game has
    always done. 🏃 **FIVE OUT** releases everybody: routes 10% quicker, pocket 32% weaker.
  - **🛡 THE WHOLE POCKET IS TWO FUNCTIONS**, which is smaller than you would expect: `updateLine()`
    slides each 'OL' in front of the nearest unclaimed rusher, and `nearBlocker(d)` slows any rusher
    within BLOCK_DIST. So this file only had to make the back COUNT in both, and bend `rushSlow`.
  - **⚠️ AND `rushSlow` POINTS THE OTHER WAY TO YOUR INSTINCT** — it is the speed a BLOCKED rusher
    KEEPS, so SMALLER is a STRONGER pocket. 🛡 max multiplies it to 0.72, 🏃 five-out to 1.32, ⚖️
    balanced to exactly 1. Getting that backwards would have made every scheme do the opposite of its
    label in a way almost impossible to see on screen, so it is asserted in the tests by direction,
    not by value.
  - **🛡 VERIFIED BEHAVIOURALLY, NOT JUST ARITHMETICALLY.** Snapped the same down under each scheme and
    watched the back: on ⚖️ BALANCED he runs **12 yards downfield, 151px from the nearest rusher**; on
    🛡 MAX PROTECT he comes **up to the line and sits on one, 10px away**. `blocking()` names only the
    back, and releases him the moment the ball is thrown or handed off — otherwise a max-protect back
    would stand there blocking nobody while his team-mate ran.
  - **🛡 IT COSTS ZERO NEW SCREEN SPACE** — the three buttons live INSIDE the 🗣️ audible panel, which
    is where a protection call belongs in real football anyway. ⚠️ `#pp-row` is a **sibling** of
    `#aud-body`, never a child: audible.js rewrites that body's innerHTML on every render and anything
    of ours inside it would be wiped the first time Max opened the panel (verified it survives a
    re-render). ⚠️ **A nice accident falls out of the location:** ⏰ the hurry-up hides the 🗣️ button,
    so during a no-huddle you cannot change protection either — which is exactly right.
  - **🛡 THE SCHEME IS STICKY**, unlike the defensive call: a defensive call is one play, protection is
    a SCHEME teams live in, and making a nine-year-old re-pick it every down would turn a good idea
    into a chore. Resets to ⚖️ BALANCED each game — and because balanced is a perfect no-op, a game
    where Max never touches this plays byte-identically to v4.1.

  - **🔥 v4.1 — MOMENTUM (Round 12, pick ⑦, `src/momentum.js`, no save).** A swing meter from −100
    (they're rolling) through 0 to +100 (you are), top-centre under the 🎡 buff-pill lane.
  - **⚠️ THE BOARD'S WARNING *IS* THE FEATURE: "whoever is ahead gets better and runs away with it."**
    That is the obvious way to build a momentum meter and it is wrong — it is a machine for turning
    close games into blowouts. Four brakes, all MEASURED: ① **it never reads the scoreboard** to earn
    momentum (big plays, first downs, sacks, takeaways — things you DID); ② it **decays 0.88 a play**,
    so you cannot bank it; ③ ⚠️ **gains scale DOWN when you are ahead and UP when you are behind**
    (losses invert) — the one place the score is read, and it is used to damp the leader, never to
    reward them; ④ the effect is **±4% with a dead zone below ±30**, under crowd.js's ±6%.
  - **🔥 AND THE INVERSION IS PROVEN, NOT ASSERTED.** Six big plays while **21 ahead → +21**; level
    → **+54**; **21 behind → +86**. Six sacks while 21 ahead → −71, while 21 behind → only −18. And
    the cleanest number of the lot: a side **winning 49–0 cannot max the meter at all (73)**, while a
    side **losing 49–0 can (100)**. A takeaway LURCHES rather than nudges (−70 → −36 in one play),
    which is the swing-back the chart asked for.
  - **🐛 THE BUG: THE METER WAS HALF A LIE.** The first cut used `Math.max(0, tilt())` in all three
    effect functions, so momentum only ever HELPED you — the blue half of the meter sat there saying
    "they're rolling" while changing precisely nothing. ⚠️ **That is the same failure 📋 scout.js and
    📊 selfscout.js are written to avoid: a readout that doesn't predict the game is worse than no
    readout**, because it teaches Max to ignore what the game tells him. Now signed and symmetric —
    verified ±0.04 catch/arm and their offense ×0.96 / ×1.04, with the dead zone still silent.
  - **⚠️ IT STACKS WITH THE HOME CROWD AND THAT WAS CHECKED:** a maxed stadium (−6%) plus a full
    meter is **−9.76% to their offense**, which is more than any single system gives. It needs a rare
    confluence (maxed stands + hot streak + big occasion + a pinned meter that is decaying the whole
    time), but it is the number to watch if anything else is ever folded in here.
  - **🔥 WIRING:** three guarded main.js hooks (`endPlay` → `play()`, `cpuDriveEnd` → `theirDrive()`,
    `beginGame` → `newGame()`) plus two fold-ins in shop.js's `gloveBoost`/`armAccuracy` and one in
    the defense sim beside the crowd — the same route 🎡 TDSpin and ⚡ TDPowerup already take for a
    live buff. ⚠️ Overlap was tested against `#hud`'s CHILDREN (it is a zero-width container) and
    against a force-shown `#buff-pill`: no collisions at 375×812.

  - **⏰ v4.0 — THE HURRY-UP OFFENSE (Round 12, pick ⑥, `src/hurry.js`).** The ⏱️ Two-Minute Drill
    (v1.87) gave Max the *situation*; this gives him the *tools*. ⚠️ **The lever is the huddle, not a
    new play.** `advanceClock` takes 32 seconds off an ordinary run because those 32 are the play PLUS
    the huddle before it — so the no-huddle is simply **32 → 16**, twice the snaps out of the same
    clock, which is exactly what the real thing buys you.
  - **⏰ AND IT DELIBERATELY DOES NOTHING ON AN INCOMPLETE.** That one already stops the clock (12s,
    not 32), so there is no huddle inside it to skip. Verified across all four play results: only the
    running-clock play changes. A real and slightly surprising piece of football — throwing it away
    already saved you the time the hurry-up is trying to save.
  - **⚠️ THE BALANCE TRAP, AND THE GATE THAT STOPS IT.** Switch this on in Q1 and you simply get more
    plays than the other team every quarter, forever — more plays is more points, and it would not
    look like a bug, it would look like the game got easy. So it lives behind the SAME gate as ⏱️
    Spike & Kneel: **not in overtime, only in a period whose ending costs something (the half or the
    game), only when behind or tied, only with 17–96 seconds left.** Swept **3,648 quarter × score ×
    clock combinations: 0 rule violations**, and it appears in **Q2 and Q4 only**. ⚠️ The period is
    derived from `quarter` inside the file — that is v3.1/v3.6's bug and it is not coming back.
  - **⏰ IT TURNS ITSELF OFF, WHICH IS THE PART THAT WOULD HAVE ROTTED.** `update()` re-checks the gate
    at every line of scrimmage, so taking the lead, reaching half time, running the clock out or going
    to overtime all switch it off with nothing else having to remember to. All five verified.
  - **⏰ THE TRADE-OFF IS ONE CSS RULE.** Going fast means no standing at the line thinking, so
    `body.hurry` hides 🗣️ audible, 🧩 formation and 🎩 trick — three of the four things you would do
    there, and honest football rather than an invented penalty. Doing it in CSS means it cannot drift
    out of sync with the mode and costs main.js nothing.
  - **🐛 THE BUG: "YOU CANNOT SEE IT" IS NOT "YOU CANNOT PRESS IT".** `update()` runs from `setupPlay`,
    which is YOUR play — so through the other team's drive the button kept whatever it last showed.
    The big `#defense-sim` panel (z-index 40) covers it, which is exactly why this looked fine; but
    the defensive states where that panel is NOT up left a live button setting the tempo for a snap
    that was not yours. Fixed inside hurry.js with a state check on the tap (`presnap` / `dead` /
    `decision` are yours, nothing else is) — verified refused in `dsim`/`dpresnap`/`dlive`/`ddead`/
    `live`/`kickoff` and still working at the line. ⚠️ **`#btn-clock` has shipped with the same shape
    since v3.6** — it is a one-shot play rather than a mode, so it matters less there, but the pattern
    is worth knowing.
  - **⏰ WHERE IT LIVES:** left edge, stacked under ⏱️ `#btn-clock` (7px gap, measured — they genuinely
    can both be up: hurry to the line, then spike to stop the clock). **No new button in
    `#ingame-ctrls`** — that row is built for four and the v1.44/45 portrait pain is why. The CPU's
    drive is untouched: it is simulated a play at a time rather than snapped, so there is no huddle
    in it to skip.

  - **🟨 v3.9 — PENALTIES (Round 12, pick ⑤, `src/penalty.js`/`tdr-penalty`).** The referee has
    stood in the offensive backfield every down since the game was born and has never once thrown
    a flag. Now he does. ⚠️ **THE FLAG IS YELLOW AND THE CHALLENGE FLAG IS RED** — that is the real
    rule, and it is how you tell 🟨 penalty.js apart from 🚩 flag.js at a glance.
  - **🟨 THE POINT OF THE FEATURE IS THE CHOICE, NOT THE YARDS.** When the foul is on the DEFENSE
    you accept or decline, and the panel prints BOTH answers as down-and-distance — "1ST & 10 at
    the 29" against "2ND & 18 at the 16" — because comparing them IS the lesson. Declining is
    often right: five penalty yards are worth nothing when you just ran for twenty. Same philosophy
    as the 🧮 Fourth-Down Helper — show the reasoning, let the coach coach. A flag on YOU has no
    panel at all, because there is no decision to make: the other coach takes whichever is worse
    for you, and `worth()` computes it.
  - **🟨 THE BOARD PRINTED A WARNING ON THIS PICK AND IT WAS THE RIGHT WARNING** — "penalties that
    fire too often stop being football." So the rate is MEASURED, not felt: **6.4% of eligible
    plays, one flag every ~16 plays, 1.5 a game** over a 12,000-play sweep, with the CPU's drive
    independently at 6.5%. Four brakes hold it there: a base chance, a **cooldown** (verified 0
    back-to-back flags in 9,600 plays), a **per-game cap of 4** (verified never exceeded), and a
    list of plays the referee simply swallows his whistle on.
  - **🟨 THE "NO MISERY" RULES, WHICH ARE DELIBERATE AND NOT OVERSIGHTS.** ⚠️ **A flag NEVER wipes
    out a touchdown** — real football allows it, this game does not. No flags on interceptions or
    any turnover either. And **a penalty on YOU can never happen on 4th down**, while the defense
    can still be flagged there: the asymmetry always favours the player, on purpose.
  - **🟨 HALF-THE-DISTANCE IS IMPLEMENTED, AND IT IS WHAT STOPS THE RULEBOOK BEING A SCORING
    MACHINE.** A 15-yard flag on their 4 gives you the 3, not six points; a 10-yard holding call on
    your own 3 moves you to the 1.5, not a safety. Verified at both ends and on the CPU's side too
    (a penalty at their 97 spots at 99, never 100).
  - **🐛 THE BUG WAS ON THE HALF OF THE FEATURE NOBODY WOULD HAVE PLAY-TESTED: their drive.**
    `cpuPlay()` fired flags on the CPU's offense with no idea whether the play had just ended their
    drive — so **holding on their guard AFTER they failed on 4th down handed them a free replay of
    the down and took the ball back off you.** In real football that is the easiest decline a coach
    ever makes. Fixed by passing `turnover` in from `redPlayEnd` and swallowing the whistle;
    verified 0 flags-on-them across 4,000 rolls in that exact spot. ⚠️ **It was never going to show
    up in a play-test** — it needs a 4th-down stop and a 7.5% roll on the same snap.
  - **⚠️ THE OTHER THING THAT HAD TO BE RIGHT: IT MUST NEVER RUN WITH THE COACH'S CHALLENGE.** Both
    hook the same three lines of `endPlay`, both park the game with `deadUntil = MAX_SAFE_INTEGER`,
    and both replace `G.next` — two panels stacked, two callbacks racing, and a dead-ball timer only
    one of them would ever release. `endPlay` asks the penalty FIRST and **`return`s**, so the
    challenge is unreachable on a flagged play. That is also correct football: you do not argue the
    spot on a play a penalty already wiped off the board.
  - **🟨 `redPlayEnd` GETS THE PRE-PLAY DOWN, NOT THE POST-PLAY ONE.** "The penalty wipes out the
    play" means rebuilding the down from where it STARTED — hand `cpuPlay()` the finished numbers
    and a flag on a play that had just earned a first down becomes 1st & 20 instead of a replayed
    2nd & 17. Verified exact: back 10 from their 45 on 2nd & 7 → 2nd & 17 from the 35.
  - **🧪 TESTING NOTE WORTH KEEPING: RESTORING `localStorage` DOES NOT UNDO A SWEEP.** The 12,000-play
    frequency run snapshotted and restored `tdr-penalty` around itself — and the save came back
    **polluted anyway (1,479 phantom flags)**, because the module holds its state in a closure
    variable and writes that copy back on the next `save()`. ⚠️ **A module with an in-memory cache
    can only be reset by RELOADING THE PAGE.** Anything that sweeps a feature's real save has to
    clear the key and reload, not save/restore around it.

  - **📊 v3.8 — SELF-SCOUTING (Round 12, pick ④, `src/selfscout.js`).** 📋 The Scouting Report pointed
    the other way: what YOU call, how often, and who you keep throwing to. ⚠️ **It inherits scout.js's
    rule — THE REPORT HAS TO BE TRUE.** The counts printed on the card ARE the counts `callPlay()`
    asks about when the defense picks its plan, and the counts the man-coverage cushion asks about
    when a DB lines up over your favourite receiver. A card that said "you throw to #2 too much" and
    changed nothing would teach Max to ignore his own coaches.
  - **📊 THREE THINGS KEEP IT FROM BEING UNFAIR, and the board warned about exactly this.**
    ① **Minimum sample** — nothing is read until 12 plays; you cannot be "predictable" after handing
    off twice. ② **Hard cap** — 100% predictable buys the defense at most **+0.12 blitz chance and 7px
    of cushion** (24 → 17), against a base blitz of 0.15 normal / 0.30 hard. Verified across all 21
    run/pass mixes. ③ **A rolling window of the last 20 calls**, which is the one that makes it a GAME
    rather than a punishment: 20 straight runs reads 1.00, ten passes later it is 0.00, ten more and
    you are readable **the other way**. Being read is something you fix at halftime, like a real coach,
    not a state you get stuck in. ⚠️ Career totals are saved and shown, but **only the rolling window
    ever touches play** — a career of 400 runs must not haunt a game you came out throwing in.
  - **🐛 MEASUREMENT CAUGHT THE BALANCE BUG THE BOARD PREDICTED: ON EASY IT INVENTED A BLITZ.** Easy
    sets `blitzOdds = 0` **on purpose** — "easy = mostly tight man, no blitz" is a promise to a new
    player — and self-scouting was pushing that to 0.12 because you ran the ball a lot. Now a
    difficulty that says there is no pressure doesn't get overruled; on easy the read expresses itself
    through COVERAGE instead, which is where easy mode nearly always is anyway. ⚠️ **Anything else
    that ever adds to a difficulty knob has to ask the same question: is this knob zero ON PURPOSE?**
  - **🐛 …AND A SAVE-KEY BUG CAUGHT WHILE IT WAS STILL FREE.** `TDStats.shared.store()` **adds the
    `tdr-` prefix itself** (`stats.js`: `localStorage.setItem('tdr-' + key, …)`), so `KEY =
    'tdr-selfscout'` was writing to **`tdr-tdr-selfscout`**. Every other module passes a BARE name
    (`'quests'` → `tdr-quests`). ⚠️ **This is only ever free to fix before a feature ships** — a save
    key that has been released cannot be renamed without wiping what players saved under it, which is
    the same rule that keeps this repo named touchdown-rush. New modules: pass the bare name.

  - **💥 v3.7 — HITS YOU CAN FEEL (`src/bighit.js`, Max's "aggressive physics" note, 2026-09-16).** NOT a
    draft-board pick — one of four idea screenshots Max sent. ⚠️ **Most of that screenshot was already
    in the game** and the check is why this is the only part that got built: heavy rain and thick snow
    are `weather.js` (seven kinds, with real fumble/catch/FG effects), night games already dim the
    stadium, and the players are already big-headed chibis with helmets and face masks. The one real
    gap was the hitting. Screen shake existed but fired **only on `gain <= 1`**, so a defender could
    run you down after a twelve-yard gain and the game said nothing at all — the best-looking plays
    were the quietest. And there was **no tackle sound anywhere in the game**: sound.js knew a
    touchdown fanfare and nothing about a collision.
  - **💥 THE GRADE IS A V, NOT A LINE, AND THAT IS REAL FOOTBALL.** The hardest hits happen at BOTH
    ends of a play — a sack or a stuff is a defender meeting you in the hole (1.00 / 0.90); a
    chase-down after a long run is a defender catching you at FULL SPEED, so the curve climbs back to
    0.85 by twenty yards. The ordinary five-yard wrap-up is the **quietest** thing on the chart
    (0.38–0.45) because it is the thing that happens most. "More yards = bigger hit" gets the middle
    of the play wrong; "fewer yards = bigger" makes the best run of the game land like nothing.
    `grade()` is a pure function of a plain object, same shape as `TDFourth.advise()` and
    `TDClock.advise()`.
  - **💥 THE SOUND IS TWO SOUNDS, AND THE MIX IS THE WHOLE JOB.** `TDSound.hit(force)` = a THUMP whose
    pitch **slides down as it dies** (that drop is what an ear reads as "heavy" — a tone that holds
    its pitch is a beep) plus a burst of the already-baked hi-hat noise pushed through a **lowpass**,
    which keeps the rumble and throws away the hiss: shoulder pads, not a snake. ⚠️ **Peak volume
    0.085, deliberately UNDER the 0.10–0.12 the stings use** — a sting fires a few times a game, this
    fires forty times, so it has to sit under the music rather than on top of it.
  - **⚠️ TWO CAMERA KICKS ON ONE TACKLE READ AS A STUTTER, NOT A HIT.** bighit.js computes its own
    kick from the grade, so reusing `TDJuice.bigHit()` for the dust would have shaken the screen
    twice. juice.js therefore grew **`turf()`** — the same spray, no kick. ⚠️ Anything else that wants
    particles at a collision should use `turf()` and do its own camera work, or use `bigHit()` and do
    neither; never both.
  - **🐛 AND THE SAME BUG SHAPE FOR THE THIRD TIME IN THREE FEATURES: `p.gain || 0`.** That turned "I
    wasn't told what happened" into "he was buried for no gain" — 0.9, the second-loudest hit in the
    game — so any caller that forgot the field got a maximum crunch on every single play. **A missing
    value is not a zero.** `grade()` now returns 0 unless handed a real finite number. Same family as
    v3.1's `last` flag and v3.6's period check: *derive it, or refuse to guess — never let a falsy
    default stand in for a fact you were not told.*
  - **♿ REDUCE MOTION TURNS OFF THE CAMERA KICK ONLY.** The crunch and the turf still play: sound and
    dust are not motion sickness, and switching the whole feature off would take feedback away from
    exactly the players who most need a play to be legible.

  - **⏱️ v3.6 — SPIKE IT & KNEEL IT (Round 12, pick ③, `src/clockplay.js`).** The two plays where the
    POINT of the play is the clock, and they are OPPOSITES — which is the whole lesson. 🏈 SPIKE costs
    a down, gains nothing and **stops** the clock (6s, against the 32 an ordinary play burns and the 12
    an incompletion costs — a spike is quicker than both). 🧎 KNEEL costs a down, loses a yard and
    **feeds** the clock (42s, MORE than a normal play, because the offence milks the play clock first).
    Three kneels = 126s, which is most of a 150s quarter — so "can I still run this out?" is literally
    `clock <= 3 kneels` in the code rather than a number somebody picked, and **three kneels from 2:00
    with the lead really does end the game** (verified: 120 → 0 → gameover).
  - **⏱️ ONE BUTTON, BECAUSE ONLY ONE OF THEM IS EVER RIGHT.** Behind = spike, ahead = kneel; the
    button already knows which and relabels itself (cool teal 🏈 / warm orange 🧎, so you can tell them
    apart without reading). ⚠️ **AND IT IS NOT PERMANENT FURNITURE** — `display` starts at `none` and
    it is only shown at the line of scrimmage when a clock play is genuinely the call: **3.7% of
    downs**. That is the ONLY reason a phone can afford it. `#ingame-ctrls` is already **full at five**
    (the v2.5 warning printed above it: a sixth button pushed the row to x = −11 at 375px and sliced
    the ⏱ button off). It mirrors ⚡ POWER-UPS across the screen instead. Measured at 375×812:
    **0 collisions**, 163px clear above the D-pad, 219px from ⚡, 66×50 tap target, no x-scroll.
  - **⏱️ IT DOES NOT GO THROUGH `endPlay`, ON PURPOSE.** A spike is not an incomplete pass and a kneel
    is not a tackle: there is no carrier to measure, no catch to file, nothing for the 🚩 Coach's
    Challenge to review and nobody to celebrate. Routing it through `endPlay` would have quietly put a
    **fake catch in the box score** and offered you a flag on a play the referee never had to judge.
    It sets `G.next` the same way `endPlay` does and lets the existing machinery (quarter roll-over,
    the 4th-down panel, handing the ball to the CPU) take over — four surgical hooks in main.js, no
    changes to the play loop.
  - **🐛 v3.6's BUG WAS THE SAME SHAPE AS v3.1's: A COMMENT THAT ONE BRANCH DIDN'T IMPLEMENT.** The
    header said "end of a half or end of a game, never in between" and **only the KNEEL branch checked
    it**. So the spike came up at the end of Q1 and Q3 as well — the two quarter breaks a drive plays
    straight through (`startBreak`: inside a half, your drive carries over) — spending a down to stop
    a clock that was never going to cost you anything. `advise()` now **derives** the period from the
    quarter, main.js hands over `quarters: NUM_QUARTERS` rather than this file keeping a second copy
    of the constant, and the optional `lastPeriod` flag **can only widen the answer, never narrow it**
    — which is what stops v3.1's "caller forgot the flag" bug coming back in the other direction.
    ⚠️ **Found by sweeping 43,776 situations, not by playing.** (The ⏱️ drill needs no override at
    all: it sets `quarter = NUM_QUARTERS` on purpose, so it derives correctly for free.)
  - **⏱️ A KNEEL NEVER BACKS INTO YOUR OWN END ZONE.** That is a safety, and *"I pressed the
    win-the-game button and gave the other team 2 points"* is the worst surprise this game could hand
    a nine-year-old. Clamped at your own 1 (real teams don't kneel on their own 1 either) — verified
    by kneeling from the 1 and checking the opponent's score never moved.
  - **⚠️ `_verify.js` HAD SILENTLY STOPPED STARTING GAMES, AND IT WAS NOT A REGRESSION.** Every
    autoplay run was stalling at `state: 'menu'` with zero errors. Cause: `beginGame` **holds the
    kickoff** behind the 📋 Scouting Report card (`if (TDScout.pregame(…)) return;`), so the game does
    not begin until you tap 🏈 LET'S PLAY — and the harness's `closeModals()` **hid** that card, which
    is not the same thing: hiding it never fires the callback. Also `startGameWithTeam()` takes **no
    arguments** (it reads `allTeams()[G.menuIndex]`), so the harness's `'SEA'` was doing nothing.
    ⚠️ **Confirmed pre-existing by serving a pristine `git archive HEAD` copy on another port and
    watching it fail identically** — worth doing before blaming your own diff. The harness now taps
    `scout-go` for real. ⚠️ `autoplay` still cannot drive the `dsim` defence state; tap it through
    with `__td.DefenseSim.tap()`.

  - **🧮 v3.1 — FOURTH-DOWN HELPER: ADVICE, NOT AUTOPILOT.** Six rules checked in order, each a real
    piece of football reasoning (last minute behind → go, or kick if three actually ties · last minute
    ahead → make them go the length of the field · own half with more than a yard → punt, because a
    turnover there is how you lose a close game · in range → take the points, unless it is short
    yardage at the goal line where seven beats three · short past midfield → go · else punt).
    ⚠️ **It highlights a button and never presses one** — a helper that took the decision away would
    turn the most interesting moment in football into a cutscene. ⚠️ **The panel's second button is
    BOTH the field goal and the punt** (main.js relabels it), so those two answers highlight the same
    button; getting that wrong would point at a button that is not on screen.
  - **🧮 `advise()` IS A PURE FUNCTION AND THAT IS THE DESIGN, NOT A DETAIL.** It takes a plain context
    object — no globals, no DOM — so every situation in the game could be checked without playing a
    down: four distances × every 5-yard line × early and late, confirming it never recommends a field
    goal from out of range. **When a feature's whole job is a judgement, make the judgement a pure
    function and the verification stops being guesswork.**
  - **🐛 v3.1's BUG WAS THE WORST POSSIBLE ANSWER: "4th and 7, three down, fifty seconds left" → PUNT.**
    The late-game rule read `!!c.last && clock <= 120`, i.e. it required the caller to pass a `last`
    flag ALONGSIDE the `quarter` it was already being handed. A caller that passed `quarter: 4,
    clock: 50` and no flag fell straight through to the ordinary "your own half → punt" rule. It now
    derives lateness from the quarter, with the flag left as an override for a caller that genuinely
    knows better (overtime). **LESSON: a pure function must not depend on the caller repeating itself
    correctly — if you can derive it from what you were already given, derive it.**

  - **📣 v3.0 — HOME CROWD: THE STADIUM FINALLY PLAYS FOOTBALL.** Eleven rounds of building seats and
    the stadium only ever paid coins. Loudness = 🏟 seats (`stadium.js` level/18) × 0.55 + 🔥 streak
    (capped at six) × 0.30 + 0.15, all **multiplied by the OCCASION** (playoff/boss 1.0, rival 0.85,
    season 0.7, event 0.6, friendly 0.25) — because a friendly in a huge stadium is still a quiet
    afternoon. It folds into the SAME `G.oppOff` chain the 🎓 DC and the ⭐ 🧱 Wall use, **and** into
    the one `cpuPow` line the 1-player sim runs on, so the two paths can never disagree.
    ⚠️ **Capped at −6% — the same ceiling a maxed coach gets.** Home field is worth two or three
    points in real football; it must never be why you won. Starter stadium + no streak = exactly ×1.
    ⚠️ **Empty stands for ⏱️ the drill (practice field), 🌟 the All-Star Game (neutral site) and a
    🎲 house-rules game (garden kickabout)** — football reasons, not code ones.
  - **🐛 v3.0's BUG IS THE BEST KIND: A GUARD THAT ASKED "HAS THE GAME STARTED?" FROM INSIDE THE CODE
    THAT STARTS THE GAME.** `crowd.js` opened its stands test with `if (G.state === 'menu') return
    false` — sensible, and completely wrong: **`beginGame` computes every strength tilt BEFORE it
    leaves the menu state** (the state only changes at the very end, in `startKickoff`). So at the one
    moment the crowd was asked for its number the answer was "no game on", and `G.oppOff` came out
    **identical with and without the feature (0.9597 both ways)**. The stands question now asks only
    about the OCCASION, from flags `beginGame` has already set; "is a game running" is a separate
    question used only for drawing the readout. **Verification caught it; playing never would have —
    a feature that does nothing looks exactly like a feature that is working subtly.**
  - **🧪 And a measuring trap worth remembering: DON'T A/B TWO EXHIBITION GAMES.** The first attempt
    compared `G.oppOff` with the module and without it — and got 0.9923 vs 0.9741, i.e. the crowd
    apparently making them BETTER. `startGameWithTeam()` picks a RANDOM opponent, so the two runs
    were different teams. The honest test was to instrument the getter on ONE game: called once,
    value 0.9895, `G.oppOff` 1.0029 → 0.9923.

  - **🐛 v2.8 — "IT'S STUCK ON THE COMMENTS" (Max's bug report, 2026-09-13). THE ANNOUNCER BAR WAS ON
    SCREEN 100% OF THE TIME.** Measured over real downs: FOUR lines per down arriving inside a ~1.6s
    window, each wanting 1.2s of screen — and two of them **15 milliseconds apart saying nearly the
    same thing** (`🔴 Press coverage — everybody has a man.` at t=3265, `Press coverage!` at t=3280).
    The bar sits across the middle of the field where the players are, so it never got out of the way.
    ⚠️ **THE FIX WAS NOT TO TRIM THE LINE, IT WAS TO STOP SPEAKING IT.** v2.5's audible tell now lives
    ON the 🗣️ BUTTON (label reads `BLITZ?` / `MAN?` / `ZONE?`, red glow while it is showing their look):
    zero screen time, always visible instead of for 1.2s, and it is on the button your thumb is
    already going to. Plus main.js skips its own snap-time coverage call-out when the button is
    already showing it, `sayComment` now DROPS a line that arrives while another is still fresh
    (<320ms) instead of swapping it in, and the hold is 600ms not 850ms. **Result: 4 lines per down
    → 1, bar presence 100% → 10%.** Big moments never came through here anyway (TOUCHDOWN/FINAL are
    `showBanner`), so a crowded-out line only ever loses chatter.
    **LESSON: when you add a voice to a game, count the voices that are already talking.** A feature
    that is right in isolation can still be wrong as the fourth thing shouting at once.
  - **🧪 AND A TESTING TRAP THAT COST TIME: `G.scene.time.now` IS NOT A STOPWATCH ACROSS TOOL CALLS.**
    The preview pane sleeps between them, so one `V.RUN(150)` advanced Phaser's clock by **20,641ms**
    and made the new freshness guard look broken when it was fine. Same family as "rAF pauses in a
    hidden pane". Test time-based logic inside ONE synchronous burst.
  - **🎲🌟⚡ v2.9 — MAX'S FOUR CALLS after playing v2.7.**
    ① **A simmed game now gives 📈 XP ONLY** — no coins, no streak. Deliberately NOT
    `TDProgress.claimLevelUps()`, because that pays a coin bonus: a level earned by simming is
    celebrated and paid at the end of your next REAL game, so a sim still hands out zero coins.
    ② **A game you TAKE OVER at half time counts for all three** (coins, XP, streak) — "you played
    it". `G.simTakeover` is out of `endGame`'s guard list and out of records.js entirely.
    ③ **🌟 Superstar Mode counts for the 🔥 streak — and got harder in the same breath**, because the
    moment a mode's wins share a board with your real ones it must not be the easy way to fill it.
    ④ **⚡ POWER-UPS is its own button on the SIDE**, which also put `#ingame-ctrls` back to FOUR
    buttons and undid the v2.5 crowding.
  - **🌟 THE SUPERSTAR RETUNE IS THE CLEAREST "TUNE IT BY MEASURING" STORY IN THE REPO.** Max: "you
    can score a million touchdowns with it pretty fast." Three things were stacking — a 10% speed
    edge, a low 38px "open" bar, and a quarterback who threw to the star on every down however
    buried he was. Two passes to get it right:
    `edge 1.10 / bar 38` → a LAZY straight run reached **32–63px** (the million touchdowns) ·
    `edge 1.035 / bar 50` → a PROPER route reached only **24–26px** and three good routes in a row
    came back incomplete (too hard, the other way) · **`edge 1.05 / bar 42`** → jogging straight gets
    31–45px, a route with a real break gets **65–76px**, and pressure still forces contested throws.
    Four test plays now finish 0-0 where the old build was 13-0. A smothered receiver (<26px at the
    deadline) now gets the ball **thrown away** rather than gifted. ⚠️ Note found while measuring:
    **standing perfectly still in zone coverage leaves you wide open (~106px)** because nobody covers
    a man who does not run — it is a 0-yard catch, so it is not worth chasing, but don't be surprised.
  - **⚡ THE POWER-UPS BUTTON DOES TWO JOBS, AND WHICH ONE DEPENDS ON THE MOMENT.** At the line there
    is time to think, so it opens the picker and you choose your power on the field instead of walking
    back to the 🛍 Pro Shop; during a play there is no time at all, so it stays one instant tap that
    fires. **A picker on a live play would have made the feature worse** — you would be tackled
    reading a menu. The label says which job it is on (`POWER-UPS` / `TURBO` / `USED`). New spot
    measured at 375×812: right edge, vertically centred, x 297–363 y 381–431, **zero collisions
    against all twenty other fixed overlays.**

  - **🌟 v2.7 — SUPERSTAR MODE, AND THE QUESTION THAT DESIGNED IT.** You play a whole game as ONE man.
    ⚠️ **What happens when the ball goes somewhere else?** In this game the player has ALWAYS been
    whoever is holding the ball — **there is no AI ball carrier anywhere in main.js** and there never
    needed to be one. A mode where the QB could throw to the OTHER receiver would need a brain for a
    man running with the ball: a whole new system and a whole new set of ways to break. So the
    offense runs through YOU, which is the fantasy anyway, and the mode is built almost entirely out
    of parts that already exist — `controlStar` is `controlBallCarrier`'s movement block, the throw
    is `throwTo(1)`, the catch is `resolvePass` (which already weighs the nearest defender), and
    after the catch **there is nothing to write at all**, because you ARE the carrier.
  - **🐛 v2.7's FIRST BUG: THE QUARTERBACK WAS A TACKLING DUMMY.** He dropped back, stood perfectly
    still and waited 2.6s — sacked on EVERY down, one for a safety, ball never thrown once. **In the
    normal game the PLAYER is holding that quarterback up the whole time**, jinking him away from the
    rush without ever thinking about it. Take the player away and you have to put that back: he now
    feels pressure, slides off the nearest rusher (never past the line) and throws the instant he is
    hurried. 5/5 downs after. **When you automate a role the player used to fill, list what the
    player was silently doing — it is never just the obvious thing.**
  - **🐛 v2.7's SECOND BUG: THE STAR COULD NOT GET OPEN.** An AI receiver gets a "work open" nudge in
    `updateReceivers` worth 0.28 of a receiver's speed — **and your star no longer runs that code,
    because you are running him.** He was the one receiver on the field with no way to shake a
    defender: separation measured 12px through a whole route and every throw was contested. He now
    carries a **1.10 speed edge** (`TDStar.speedEdge()`, exactly 1.0 outside the mode so it cannot
    leak) and separation reaches 32–63px against a 38px "open" bar. **Taking a player out of a system
    also takes away everything that system was quietly giving him.**
  - **🌟 THE GUARD LIST IS NOW FIVE DEEP** (`!G.drillGame && !G.houseGame && !G.allStarGame &&
    !G.simTakeover && !G.starGame`) on the streak, the ladder and the staff, plus its own line in
    records.js's single `beat()` guard. A different control scheme cannot share a scoreboard with the
    real thing. Verified: a 77-0 Superstar game moved none of them; a normal game straight after did.

  - **🛡️ v2.6 — CALL YOUR OWN DEFENSE, AND THE RULE THAT MAKES A CHOICE A CHOICE.** 🔥 BLITZ / 👤 MAN /
    🛡 ZONE before every play the CPU runs. ⚠️ **It lives in the DEFENSE SIM, not on the grass** — in
    1-player mode `startCpuDrive` sends every drive to `DefenseSim`, the tap-to-progress map, so the
    field never sees the CPU's offense at all. That panel IS defense as Max experiences it. Choosing
    a call runs the play (the buttons `stopPropagation`, or the panel's own tap handler fires too and
    you get two plays for one tap).
    ⚠️ **EACH CALL HAS TO BE THE BEST ANSWER TO SOMETHING AND THE WORST TO SOMETHING ELSE.** The
    first cut failed that in both directions at once: 🛡 zone gave up the fewest yards AND killed
    every big play (right every down), while 👤 man gave up MORE yards than making no call at all
    (never worth choosing). Final, 600 plays per cell, **yards allowed per play**:
    `vs KC (72% pass): man 3.42 < zone 3.91 < none 4.01 < blitz 4.24` ·
    `vs CHI (60% run): blitz 2.50 < none 3.21 < zone 3.95 < man 4.54`. Guessing wrong is worse than
    not calling — **which is what makes 📋 the Scouting Report worth reading.** v2.3, v2.5 and v2.6
    are one idea in three pieces: know what is coming, and do something about it.
  - **🐛 `bigPlay` HAD TO BECOME TWO NUMBERS, AND THAT IS THE REAL LESSON OF THIS PICK.** The 8%
    chance of a 10–30 yard chunk is worth **~1.5 yards a play — about a third of everything a drive
    gains** — so it is the strongest lever in `DefenseSim.play()`, and whichever call cut it won every
    down no matter what else it did. It is also the one number that must point OPPOSITE ways for the
    two kinds of play: a blitz means nobody is home if they THROW past it, but extra bodies in the box
    if they RUN into it. `bigPass`/`bigRun`. **When one knob dominates the outcome, tuning the others
    is theatre — find the dominant term first and check it can express what you actually mean.**
  - **🐛 `endDrive()` RENDERED BEFORE IT SET `G.dsimEnding`,** so a finished drive still drew the call
    buttons and still offered you a blitz on a play that was never going to happen. The flag is set
    first now. **A repaint that asks "what state are we in?" has to run AFTER the state changes** —
    the same shape as the v1.94 house-rules bug, where the flag was cleared before the things that
    read it.
  - **🐛 AND A PRE-EXISTING PHONE OVERHANG: `.dsim-card` was 385px wide on a 375px screen.**
    `width: min(93vw, 470px)` with `padding: 16px` ADDED on top, no `box-sizing`, since the panel was
    built. Fixed while measuring the new buttons. Worth grepping for other `width:` + `padding:` pairs
    without `box-sizing`.
  - **🛡️ "TAP TO CONTINUE" WAS QUIETLY THE ENEMY OF THE FEATURE.** It is the biggest, goldest thing on
    the panel, so a nine-year-old taps it every down and never discovers the three calls at all. It
    now reads **"▶ NO CALL — JUST PLAY"**, which is what it actually does — the third option instead
    of the obvious one. ⚠️ When you add a choice to a screen that already has a big friendly button,
    that button is now one of the choices and has to say so.

  - **🗣️ v2.5 — AUDIBLES, AND THE HALF OF THE FEATURE THAT ISN'T THE BUTTON.** The defense's plan for
    a down has been decided before the snap since v1.6 (`callPlay` sets `G.blitz`/`G.coverage` in
    `setupPlay`) — but the game only ever TOLD you about it as the ball was snapped, which is a
    heartbeat too late to act on. ⚠️ **An audible is only a decision if you can see something first**,
    so half of this pick is THE TELL at the line, and the other half is three calls that each answer
    one thing the defense can be doing: 🔥 HOT ROUTES vs a blitz, 🎯 CROSSERS vs man, 🪟 SIT DOWN vs
    zone.
    ⚠️ **THE TELL LIES ABOUT ONE TIME IN FIVE, ON PURPOSE.** A tell that is always right is not a
    read, it is an answer key — you stop looking at the defense and just obey the caption. The
    disguise is rolled ONCE per down and remembered, so the caption, the panel and the button can
    never contradict each other (rolling it per-read was the first instinct and would have).
    ⚠️ **Right pays, wrong costs nothing** — a correct call adds a capped catch bonus through the
    SAME `gloveBoost` chain the gear/spin/staff/balls use (0.185 vs 0.105 on the same snap). For a
    nine-year-old, getting it right should feel clever; getting it wrong shouldn't feel like a fine.
  - **🗣️ THE HOOK IS `updateTrickBtn`, AND THAT IS THE WHOLE TRICK.** That function is already called
    at exactly the three moments an audible cares about — a play is set up, the ball is snapped, the
    🎩 trick is armed — so one line inside it (`TDAudible.sync()`) gives the 🗣️ button the same
    lifetime as the 🎩 one AND makes arming the trick cancel an audible for free, because the trick
    rewrites those same routes. **One call at the line, not two.** Look for a function that already
    fires at your moments before adding new ones.
  - **🐛 v2.5's TWO PORTRAIT BUGS — AND THE SECOND ONE WAS YEARS OLD.** 🗣️ AUDIBLE is the FIFTH button
    in `#ingame-ctrls`, and at 375×812 five × 66px pushed the row to **x = −11**, slicing ⏱ TIMEOUT
    off the left edge of the phone — the v1.44/45 overhang again. Measuring that turned up an older
    one: **the HUD's "1ST & 10" and "Ball on the own 30" run to x=134, and this row has always
    started left of that**, so the scoreboard had been printing underneath these buttons since the
    row was added (at four buttons it started at x=81 — still overlapping). A `≤430px` media query
    now shrinks the row AND drops it below the scoreboard (`top: safe-area + 92px`): measured
    33–363 at y 104–146, **zero collisions against all nineteen fixed overlays**.
    ⚠️ **A SIXTH BUTTON IN THAT ROW HAS TO RE-MEASURE THIS.**
  - **🧪 And a measuring lesson: `#hud` is an empty container.** Its four lines (`#hud-score`,
    `#hud-clock`, `#hud-down`, `#hud-spot`) are positioned independently, so `#hud`'s own
    bounding box is a zero-width point and an overlap test against it **returns a clean pass while
    the text visibly runs under your buttons**. Test against the CHILDREN. A screenshot caught what
    the measurement missed.

  - **🎲 v2.4 — SIM THIS GAME, AND THE RULE THAT A SHORTCUT MUST COST SOMETHING.**
    Hand a regular-season week to the computer and watch it tick in. ⚠️ **It runs on the LEAGUE'S OWN
    ENGINE** — new read-only `TDSeason.simNext()` runs the same `simGame()` that already plays the
    other seven teams' games and hands the score back WITHOUT recording it, and simgame.js then
    reports it through the same `reportResult()` a played game uses. If your simmed weeks ran on a
    different engine, your record would be measured on a different yardstick than everyone else in
    the same table.
    ⚠️ **A SIMMED GAME EARNS NOTHING BUT THE RESULT** — no coins, XP, 🔥 streak, 🏅 ladder,
    📖 records, 🎓 coach levels or ⭐ player stats. Otherwise the fastest way to get rich is to never
    play football. **The panel says so BEFORE you press the button** — a cost you only discover
    afterwards is a trap, not a trade-off.
    ⚠️ **THE PLAYOFFS CAN NEVER BE SIMMED.** `simNext()` returns null outside `phase === 'regular'`:
    the semifinal and the Max Bowl are the two games the whole year is for.
  - **🎮 TAKING OVER AT HALF TIME PUT THE GUARD LIST FOUR DEEP.** `startSeasonGame` now takes an
    optional `resume` ({my, opp, quarter}) and seeds the score after `beginGame` — without it the
    call is byte-identical. That game flies `G.simTakeover`, which now sits beside `drillGame`,
    `houseGame` and `allStarGame` on the streak, the ladder and the staff, plus **one line in
    records.js's single `beat()` guard** (the same one place 🎲 house rules uses). Without it you
    could sim to 28-0, take over, and bank a "personal best" the computer scored for you. It DOES
    still count in the standings — a win is a win in the table.
  - **🐛 v2.4's BUG, AND IT IS A GOOD ONE: THE TAKEOVER GUARD NEVER FIRED.** simgame.js kept its OWN
    copy of the flag, set it in `takeOver()` and then called `startSeasonGame` → `beginGame` → which
    RESETS the flag. The mirror was switched off a microsecond after it was switched on, so the
    record book was never actually protected. `TDSim.takeover()` now READS `G.simTakeover`.
    **ONE FLAG, ONE OWNER — a flag two files both write is a flag that will disagree with itself.**
    (Related to the v1.94 lesson about *where* a flag is cleared; this one is about *who* owns it.)
  - **🎲 Two smaller rules worth keeping:** the tick-in uses `setInterval`, not rAF — **a scoreboard
    that stops when you look away is a bug** (same family as the film.js playback timer) — and the
    quarter-by-quarter split decomposes the score into real 7s and 3s so it **always adds up to the
    engine's exact total** (verified for every total 0–70). The drama is invented; the score is not.

  - **📋 v2.3 — THE SCOUTING REPORT, AND THE RULE THAT SHAPED IT: THE CARD HAS TO BE TRUE.**
    A pre-kickoff card that said "expect the pass" and meant nothing would teach Max to ignore his
    own coaches, so `TDScout.passLean()` does both jobs — it is what the card SHOWS *and* what the
    CPU ROLLS AGAINST. ⚠️ **There are TWO places the other team calls a play and both had to be
    wired**: `DefenseSim.play()` (1-player's tap-to-progress drive, a flat `0.56` for every team in
    the league until now) and `pickRedFormation()` (2-player's live defense, where the look already
    leaned run/pass but was picked by an even shuffle). Miss either and half the game contradicts
    the card. The tendency is derived from the team's own ⭐ ratings — a monster offense throws it
    (KC 10/7 → 72% pass), a defense-first club hands it off (CHI 5/8 → 40%) — with a fixed seed off
    the team code so **a team plays the same way every time you meet it and can actually be learnt**
    (and so a 🚚 rename never changes how a team plays: the seed uses `ratingKey`).
    ⚠️ **The league average is still 0.56** (measured 0.5711 across all 32 teams): spreading teams
    out must change WHO is dangerous in which way, not how hard the league is. With `scout.js`
    missing, `pickRedFormation` returns to an exactly even shuffle (verified 207/193/201/199 of 800)
    and the sim to the flat 0.56.
  - **📋 HOLDING THE KICKOFF IS THE OTHER HALF.** `beginGame` asks `TDScout.pregame()`, and a `true`
    answer means "the card is up, you wait" — `G.state` is still `'menu'` there and `update()`
    returns early on `'menu'`, so the game is **fully parked with nothing running behind it**.
    ⚠️ **Every path back calls `done`** (the button, the backdrop, a 45s safety timer) and
    `release()` is once-only — the 🚩 flag.js discipline, which is what keeps a held game from
    becoming a stuck game. The Phaser keyboard is disabled while the card is up, **or SPACE would
    call `startGameWithTeam()` and start a second game behind it**.
  - **📋 EVERYTHING ELSE ON THE CARD IS READ, NEVER INVENTED** — the real ⭐ ratings, the real season
    standings, a head-to-head counted game by game, and their star *borrowed from* 📊 League Leaders
    (`TDLeaders._rivalStar`) so the two screens never disagree about who their best player is.
    ⚠️ **The head-to-head refuses games that teach you nothing**: a 🎲 house-rules game (it asks
    `TDHouse.live()`, exactly as records.js does before saving a personal best), a ⏱️ drill and the
    🌟 All-Star Game. Verified end-to-end: a real 63-0 giant-ball game recorded nothing, a real
    21-17 game recorded exactly. Zero new `endGame` lines — the history wraps `TDGameStats.finish`
    (the injuries.js trick), which runs *before* `TDHouse.endGame()` clears the silly-game flag.
  - **🐛 v2.3 FIXED ONE IN VERIFICATION: "about 5 throws in 10" for a team that leans RUN.** The
    lean was being read out as a whole number out of ten, so a 48%-pass team's sentence said the
    even split the sentence was trying to say it wasn't. It now reads out as a percentage.
  - **🧪 TWO TESTING LESSONS FROM THIS PICK, BOTH COST TIME.** ① **A long synchronous loop makes the
    preview pane reload itself** — 3,000 iterations of `pickRedFormation` did it — and the reload
    lands on the **browser-cached previous build**, where the new module simply does not exist. That
    looks exactly like "my feature is broken". Chunk verification loops and yield. ② **A hidden pane
    suspends network I/O** (`ERR_NETWORK_IO_SUSPENDED`), so scripts silently fail to load and
    `__td`/`TDScout` come back undefined — take a screenshot to wake the pane, *then* reload. ③ And
    when a src file changes but keeps the same `?v=`, the browser serves the stale copy:
    `fetch(url, {cache:'reload'})` then reload.

  - **🐛 v1.99 ALSO FIXED A BUG LIVE SINCE v1.84: `TDStaff.gameWon` WAS NEVER CALLED.** staff.js had
    the levelling code from the day it shipped and nothing in main.js ever invoked it (`git log -S`
    confirms the line never existed), so for fifteen versions the screen promised "every game you win,
    they get better" and no coach ever levelled up once. `endGame` now calls it with the same guard
    list as the streak and the ladder. **Lesson: an exported function nobody calls looks exactly like
    a working feature — when a module exposes a hook, grep for its CALLER before believing it works.**
  - **📝 Round 10's picks all hang off EXISTING hubs** — 🛍 Pro Shop (ball, mascot, house rules,
    rebrand), 🏆 Trophy Case (poster, all-star, awards) and the 🎯 Practice Arcade (the quiz). Still
    **no new front-screen chips**, per the v1.44/45 lesson.
  - **🚩 THE COACH'S CHALLENGE IS THE ONLY FEATURE THAT CHANGES A CALL MID-GAME.** It uses the
    "hold the clock, ask, roll on with the answer" shape the ⚡ onside kick has used since v1.63:
    `endPlay` asks `TDFlag.offered(call)`, and a yes parks `G.deadUntil = MAX_SAFE_INTEGER` and calls
    `TDFlag.ask(done)`. ⚠️ **Saying yes PARKS A LIVE GAME, so every path back must call `done`** —
    throwing, declining, the 6s panel auto-timeout, and `ask()` with nothing pending all do. If you
    ever add a fourth path, it must call back too or the game freezes. ⚠️ **It is `window.TDFlag`,
    NOT `TDChallenge`** — that name belongs to 📋 Daily Challenges (v1.35). Needing a timeout to throw
    is also why the ⏱️ drill can never offer one; that is not special-cased anywhere.
  - **🏥 INJURIES OWN A NEW THING: THE BENCH.** Before v1.88 the squad was exactly the 8 starters
    in `tdr-roster` and nothing else. `injuries.js` signs 4 backups (`tdr-injury`) and works by
    REALLY SWAPPING a stand-in into the roster — `TDDraft.playerAt` / `TDDraft.swapIn` /
    `TDDraft.makeBenchPlayer` are new additive helpers in `draft.js`. That swap is the whole trick:
    team strength, the box score, ⭐ Player of the Game, 🌱 growth and 🌟 nicknames all read the
    roster, so one swap makes every one of them show the man who actually played. ZERO main.js edits
    (it wraps `TDGameStats.finish`, after the original, so the man who played gets the credit).
    ⚠️ **`heal()` must check the stand-in is STILL in that slot before swapping the starter back** —
    Free Agency and the draft can both replace a starter mid-injury, and swapping back blindly threw
    away a signing the player had paid for. If the slot changed, your signing wins and the returning
    man goes to the bench. ⚠️ **The bench is kept within 14 of the squad average (`BENCH_GAP`)** —
    a bench frozen at signing strength drifts further behind every week until one injury guts the
    team. Fairness rules that must survive any edit: one hurt at a time, 1–3 games, a guaranteed
    clear game after each, nothing before 4 games played, always somebody available, never lost for good.
  - **⏱️ THE TWO-MINUTE DRILL IS THE FIRST PICK THAT REALLY TOUCHES `main.js`.** Everything up to
    v1.86 was a self-contained `src/X.js` with a hook or two. The drill had to change how a game
    STARTS (no kickoff, a rigged 0–4 scoreboard, ball on your own 20, no timeouts) and how it ENDS
    (one possession only), so `main.js` now carries a small set of `G.drillGame` guards:
    `beginGame` takes a 6th `isDrill` arg; `tickPeriodAtBoundary` returns `'gameover'` for a drill
    (no 5th quarter, no overtime); the two `G.next.fresh` possession-change sites call `endGame()`
    instead of `startCpuDrive()` — ONE line each, and it covers both winning and losing;
    `returnToMenuFromGameOver` reopens the drill screen; and `TDStreak`/`TDRanked` are skipped for
    drills so failing one costs you nothing. **Every guard is written so the flag being off leaves
    the original behaviour byte-identical — when editing near these, keep it that way.**
    Four points down is load-bearing: three leaves a field goal as a safe fallback, seven lets you
    play for a tie. `DRILL_SECONDS` / `DRILL_DEFICIT` sit beside `NUM_QUARTERS`.
  - **🏕️ Training Camp grew past its board description on Max's instruction** (2026-09-01): the
    board said "put ONE player on a programme"; he asked for the whole squad in camp with one or
    two breaking through per game, plus an upgradeable facilities section. It hands XP to the
    existing 🌱 Player Growth system in `draft.js` via two new additive helpers there,
    `TDDraft.grantXp(idx, xp)` and `TDDraft.squad()` — deliberately NOT a second rating system.
- **Name:** the game is now **Touchdown Fun** (renamed from "Touchdown Rush" in v1.13). Only the
  *player-facing name* changed. On purpose we did NOT rename the repo, the folder, the
  `maxthestar.github.io/touchdown-rush` web address, the `tdr-` save keys, or the Abacus world-counter
  namespace `touchdown-rush-maxthestar` — changing those would break the live link and wipe everyone's
  saved coins/uniforms/streak and the worldwide counters. The name and the plumbing are allowed to differ.
- **Live site:** https://maxthestar.github.io/touchdown-rush/ (GitHub Pages, served from `main`).
- **Last updated:** 2026-09-13.
- **📦 CrazyGames portal build:** refreshed to v1.57 on 2026-08-22 and staged in
  `~/Desktop/CrazyGames Submission/` (`touchdown-fun-READY.zip` — 568 KB, 33 files, index.html at root).
  Recipe = a COPY of the repo with 3 changes so it makes ZERO external requests: vendor Phaser (CDN→local
  `phaser.min.js`), swap `src/stats.js` for a no-network stub (keeps the `TDStats` API, local saves only),
  strip the `#side-tracker` aside + the external `og:image`/`twitter:image`/`og:url` meta. Verified it
  boots, plays, and makes 0 external requests with 0 console errors. Dad does the actual signup + upload
  (see the folder's "READ ME FIRST" guide). Rebuild this zip from the repo before each upload.
- **✅ v1.33 (the 🎡 Lucky Spin) is PUSHED & LIVE** — the first Round-3 feature, shipped 2026-08-15
  (`src/spin.js` new; `index.html` + `src/shop.js` edited; commit `6adfd4b`).
- **✅ v1.34 (🎡 FREE SPINS in the daily rewards) is PUSHED & LIVE** — shipped 2026-08-15 (commit `693127f`).
  Edits: `src/spin.js` (free-spin credits), `src/shop.js` (3 daily days → free spins), `index.html`
  (badge + credits note + legend), `?v=51`.
- **✅ v1.35 (📋 DAILY CHALLENGES) is PUSHED & LIVE** — the 2nd Round-3 pick, shipped 2026-08-15 (commit
  `4d61638`). New `src/challenges.js`; 6 one-line `TDChallenge.bump()` hooks + an `onMenu()` hook in
  `src/main.js`; a menu bar + modal + toast in `index.html`; `?v=52`.
- **✅ v1.36 (🏆 TROPHY CASE) is PUSHED & LIVE** — the 3rd Round-3 pick, shipped 2026-08-15 (commit
  `9ee2334`). New `src/trophy.js` (read-only showcase); one `TDShop.uniformCatalog()` export in
  `src/shop.js`; one `onMenu()` hook in `src/main.js`; a menu bar + modal in `index.html`; `?v=53`.
- **✅ v1.37 (🌱 PLAYER GROWTH) is PUSHED & LIVE** — the 4th & last Round-3 pick, shipped 2026-08-15. All in
  `src/draft.js` (growth math + roster UI) + two one-line hooks in `src/main.js` (`addGrowth` in endGame,
  `onMenu`) + a sprout badge & growth CSS in `index.html`; `?v=54`. **🎉 The Round-3 board is fully swept.**
- **✅ v1.38 (😈 RIVAL NEMESIS) is PUSHED & LIVE** — the 1st Round-4 pick, shipped 2026-08-15. New
  `src/nemesis.js`; a `startRivalGame` on the `window.TDGame` bridge + a `rivalGame` flag/buff/record hooks
  in `src/main.js`; a 😈 RIVAL button + modal & CSS in `index.html`; `?v=55`.
- **✅ v1.39 (🏅 ACHIEVEMENT BADGES) is PUSHED & LIVE** — the 2nd Round-4 pick, shipped 2026-08-17. New
  `src/achievements.js` (`window.TDAchieve`): 20 badges — 10 milestones read from career totals + 10
  live "big first" moments (💣 40-yd TD, 🔥 hat trick, 🦅 pick-six, 🥅 long FG, 🎩 trick score, ✌️ 2-pt,
  💪 broken tackle, 🛡️ shutout, 💥 blowout, 😤 comeback). Each pops a gold `#ach-toast` ribbon + pays
  coins; the Trophy Case badge wall now draws the full set (with a `0/20` count). Old saves are seeded
  silently (no spam). Wiring: eight one-line `TDAchieve.*` hooks in `src/main.js`, a `listForCase()`
  read in `src/trophy.js`, toast element + CSS + `0/20` label in `index.html`; `?v=56`.

### 🆕 Round 5 — "The Hook Board" (a fresh chart, opened 2026-08-17)

A new Add-On Draft Board (Artifact `ad034ff2-f062-455c-b022-01881a083ab2`) with eight retention add-ons
ranked easiest→hardest. Built so far: 🔥 Streak Heater, 📖 Record Book, 🎟️ Reward Road, 🃏 Card Packs,
and now 🏟️ Stadium Builder (the 5th pick). On deck: 🏅 Ranked Ladder, 🎯 Practice Arcade, 🎬 Film Room.

- **✅ v1.40 (🔥 STREAK HEATER) is PUSHED & LIVE** — the 1st Round-5 pick, shipped 2026-08-17. New
  `src/streak.js` (`window.TDStreak`, key `tdr-streak` = `{cur,best}`): back-to-back wins pay an
  escalating coin bonus (×2 = +5 … +30 cap) folded into the payday total, a fiery `#streak-fire` banner
  flies in on a streak win (and a cold "snapped!" flash when a hot run ends), and a `#streak-flame` pill
  shows top-right on the menu only while a streak is alive (tap it to flare). Wiring: one
  `TDStreak.recordResult()` in `endGame` + one `onMenu()` hook in `src/main.js`; pill + banner + CSS in
  `index.html`; `?v=57`.
- **✅ v1.41 (📖 RECORD BOOK) is PUSHED & LIVE** — the 2nd Round-5 pick, shipped 2026-08-17. New
  `src/records.js` (`window.TDRecords`, key `tdr-records`): tracks personal bests — most points in a
  game, biggest win, longest TD, longest FG, most TDs in a game (best win streak read live from
  streak.js) — plus a live-read Career shelf (games, level, Max Bowls, coins, badges). Beat a best and a
  gold `#rec-toast` "NEW RECORD!" ribbon flashes at game's end (queued, capped at 3 so a big game can't
  spam). Opened from the Trophy Case via an "📖 OPEN RECORD BOOK" button → its own `#records-modal`
  (reuses the `.trec` tiles; beaten-this-game records glow gold). Wiring: four one-line `TDRecords.*`
  hooks in `src/main.js` (startGame / td / fg / gameOver); button + modal + toast + CSS in `index.html`;
  `?v=58`.
- **✅ v1.42 (🎟️ REWARD ROAD) is PUSHED & LIVE** — the 3rd Round-5 pick, shipped 2026-08-17. New
  `src/road.js` (`window.TDRoad`, key `tdr-road` = `{rp,claimed}`): a free tier ladder — finishing a game
  earns +10 road points (a win adds +10 more), and passing a tier's line lights up its 🎁 CLAIM button
  (rewards are coins via `TDShop.earn` and/or free spins via `TDSpin.grantFreeSpins`, escalating; the
  road never ends — every +300 RP past the last tier is another 200-coin bonus). A 3rd slim menu bar
  (`#road-bar`, teal, glows when a reward is ready) opens `#road-modal`, which draws the tier track with
  CLAIM buttons (a 400 ms debounce stops one tap claiming two tiers). Wiring: one `TDRoad.addPoints()` in
  `endGame` + one `onMenu()` hook in `src/main.js`; bar + modal + CSS in `index.html`; `?v=59`.
- **✅ v1.43 (🃏 CARD PACKS) is PUSHED & LIVE** — the 4th Round-5 pick, shipped 2026-08-17. New
  `src/cards.js` (`window.TDCards`, key `tdr-cards` = `{owned,packs,plays}`): an 18-card collectible set
  across 4 rarities (Common/Rare/Epic/Legendary, weighted 60/27/10/3). Open a pack → 3 cards (the 3rd is
  always Rare-or-better), new ones fill the album, doubles auto-sell for coins (5/15/40/120). Earn a free
  pack every 3 games (starter pack on first load) or 🃏 BUY PACK for 150 🪙 (`TDShop.spend`). Opened from
  the Pro Shop via a "🃏 CARD PACKS" button → `#cards-modal` (opener + animated reveal strip with NEW!/
  dupe tags + the album grid); an unopened-packs badge sits on the 🛍 SHOP menu button. Wiring: one
  `TDCards.gameDone()` in `endGame` (celebrates an earned pack) + one `onMenu()` hook in `src/main.js`;
  shop button + badge + modal + CSS in `index.html`; `?v=60`.
- **✅ v1.44 (📱 PHONE-LAYOUT FIXES) is PUSHED & LIVE** — shipped 2026-08-18. CSS-only (`index.html`):
  (1) On phones the 540×720 FIT canvas letterboxes so the Phaser "CHOOSE YOUR TEAM" title (internal Y=56)
  lands ~screen Y 185–205 — where a 3rd stacked bar sat. A `@media (max-width: 500px)` block tightens the
  three status bars (challenges / trophy / Reward Road) to height 25 with tops +92/+120/+148, packing them
  back into the old two-bar footprint so the Reward Road bar clears the title (verified +1–8px on 375×812
  & 390×844). iPad keeps the roomy default (34px) — the road bar sits below the title there. (2) The Card
  Packs reveal used content-box 92px cards that wrapped 2+1 on phones; now `box-sizing:border-box`,
  `width: calc((100% - 16px)/3)`, `max-width:116px`, `flex-wrap:nowrap` → three cards always fill one row
  (shrink on phones, capped on iPad). `?v=61`. Verified all four Round-5 modals on both phone & iPad.
- **✅ v1.45 (📱 iPad TITLE FIX) is PUSHED & LIVE** — shipped 2026-08-18. The centered Phaser "CHOOSE YOUR
  TEAM" title (world x 121–419) reached LEFT into the fixed top-left status bars on wide screens (measured
  39px overlap on iPad — its left edge at screen x≈187 vs the bars' right at x≈226), and there's no
  vertical room to drop it below them (the huge team code sits right underneath). Fix in `src/main.js`
  `buildTeamMenu`: a `fitTitle()` that, on wide screens (`innerWidth ≥ 700`), shrinks the title just enough
  for its left edge to clear the bars — `scale = max(0.62, (270 − 232·540/vw)/halfWidth)` — and re-runs on
  `scene.scale` resize. Phones (bars compacted up out of the way) keep the title full size. Verified +6px
  clearance on iPad mini 744 (scale .68), iPad 834 (.80) & iPad Pro 1024 (.99, near full); phone untouched
  (scale 1, clears vertically). `?v=62`.
- **✅ v1.46 (🔇 QUIET THE 404s) is PUSHED & LIVE** — shipped 2026-08-18. The live console showed
  "Failed to load resource: 404" from `stats.js` reading the **world review counter**: Abacus `/get` 404s
  a counter nobody has ever hit (worldwide `reviews` was still 0/uncreated), and the browser logs that 404
  no matter how the `fetch` is handled — code can't hide it. Fix: `peek()` now, on a 404, quietly
  `/create`s the counter at 0 once (guarded by an in-memory flag + a persistent `tdr-seeded-<counter>` so
  it can never fire twice or hit an existing counter → no 409), after which every read is a clean 200. The
  dashboard's `peekCareful` geo-scan is left ALONE on purpose (auto-creating ~250 country counters would be
  wrong). Also created the live `reviews` counter at 0 by hand so it's clean immediately, not after one
  residual 404. `?v=63`; `dashboard.html` stats.js bumped `?v=22→23`.
- **✅ v1.47 (🔇 QUIET THE DASHBOARD SCAN) is PUSHED & LIVE** — shipped 2026-08-18. `dashboard.html` ONLY
  (game unchanged, still `?v=63`). The 🌍 player-tracker used to scan all 249 country codes on every visit,
  and the ~244 countries with no players each 404'd (Abacus has no "list keys" endpoint — probed, none —
  and auto-creating 249 country counters would be wrong). Now a normal load / 🔄 refresh only re-checks the
  flags already in `tdr-known-countries` — those all exist, so the console stays quiet (0 geo requests when
  none are known yet; we deliberately don't probe the viewer's own country, which may have no counter) —
  and a new **🔍 "find countries"** button runs the full world-discovery stroll on demand
  (that's the only way to find new countries, and it necessarily 404s the empty ones — so it's opt-in, not
  every visit). Verified: normal load = 0 console errors; 🔍 = full stroll runs (chatty on purpose).
- **✅ v1.48 (🏟️ STADIUM BUILDER) is PUSHED & LIVE** — shipped 2026-08-19 (`?v=64`), the 5th Round-5 pick. New
  `src/stadium.js` (`window.TDStadium`, key `tdr-stadium` = `{stands,field,lights,screen,roof,extras}`, each
  a tier index 0…3): build up your own home stadium by spending coins on SEATING, THE FIELD, LIGHTS,
  JUMBOTRON, THE ROOF and GAME-DAY EXTRAS. Each upgrade grows a little emoji stadium in the pop-up (more
  seat rows, day→night→laser sky, a dome, a jumbotron, a jet flyover, champion turf), raises your STADIUM
  LEVEL (0…18) and packs in more FANS (8,000 → 97,900 maxed). The hook: **gate receipts** — bigger crowd =
  bonus coins at the end of every game (`gateReceipts()` = `min(15, floor(capacity/6000))`), so it pays you
  back the more you build. Lives INSIDE the 🛍 Pro Shop (a "🏟️ STADIUM" button next to Card Packs, with a
  ⬆️ badge when you can afford an upgrade) — deliberately NO new menu bar/chip, so the delicate phone
  status-bar/title layout (v1.44/v1.45) is untouched. Reuses the `.chal-row`/`.chal-btn` row look and a
  400 ms buy debounce (same as Reward Road). Wiring: one `TDStadium.gameBonus()` in `endGame` (before the
  FINAL screen, so gate receipts land in the payday) + one `onMenu()` hook in `src/main.js`; shop button +
  `#stadium-modal` + `.stad-*` CSS in `index.html`; new `<script src="src/stadium.js?v=64">`; game bumped
  `?v=63`→`?v=64`. Verified live via DOM/JS: clean boot (0 errors), buy deducts coins & grows the stadium,
  can't-afford shows a gentle note (no purchase), debounce blocks double-taps, `gameBonus` pays into the
  payday (a real `endGame()` tallied +15 with 0 errors), persistence works, maxed render is correct, and
  the pop-up has no horizontal overflow on a 375 px phone.

### 🆕 Round 6 — "The Superstar Board" (a fresh chart, opened 2026-08-19)

A new Add-On Draft Board (Artifact `e9e25465-46cc-429a-853b-fe0790815343`, a night-stadium football
draft-board design) with eight fun picks ranked easiest→hardest: ①📣 Hype Announcer ②🎉 Halftime Show
③🎽 Uniform Designer ④⚡ Power-Up Plays ⑤🏅 Ranked Ladder ⑥🎯 Practice Arcade ⑦🏆 Playoff Tournament
⑧🎬 Film Room. (Picks ⑤⑥⑧ carried over from Round 5.)

- **↔️ Pick ①📣 Hype Announcer — SKIPPED as already-in-game.** The game already has a rich live
  play-by-play system: `sayComment()` fires punchy calls on snaps / runs / sacks / picks / safeties (small
  in-world text at 270,235) and `showBanner(msg,big)` shows the big score callouts ("TOUCHDOWN! +6"). A
  second commentary layer would just duplicate/clutter it, so we moved on rather than build something
  redundant. (If Max wants MORE hype later, the real gap is juicier *visuals* on marquee moments, not more
  text — a separate polish task.)
- **✅ v1.49 (🏅 RANKED LADDER) is PUSHED & LIVE** — shipped 2026-08-19 (`?v=65`), the 5th Round-6 pick
  (built first, since Pick ① was redundant). New `src/ranked.js` (`window.TDRanked`, key `tdr-ranked` =
  `{step,stars,peak,w,l,champ}`): a competitive rank you climb by WINNING — Bronze → Silver → Gold →
  Platinum → Diamond → 👑 Champion, three divisions each (III→II→I), 3 ⭐ to fill a division. A win = +1 ⭐
  (fill three → promote, +30 🪙, or +100 for a whole new tier); a loss = −1 ⭐ (can drop a division) but you
  **never fall out of a tier once earned** (the division floor holds — keeps the badge safe). Champion is
  the top: wins there add Champion stars. Distinct from the XP *level* (which only ever grows) — rank
  reflects how you're playing NOW. Wiring: one `TDRanked.recordResult(won)` in `endGame` BEFORE the FINAL
  screen (so promotion coins count in the payday) which also flies in a `#rank-toast` ribbon on any rank
  change; opened from the 🏆 Trophy Case via a "🏅 RANKED LADDER" button → `#ranked-modal` (big rank badge +
  ⭐ row, the full tier climb lit up to your peak, W–L / win-rate / best-rank). No new menu bar (phone
  layout untouched). Verified live via DOM/JS: promotions/new-tier/demotion/tier-floor all correct, coins
  30/100/40 exact, Champion accrual + no champ demotion, `endGame` pays into the payday with the ribbon
  over the game-over screen (0 errors), and the pop-up has no overflow at 375 px.
- **✅ v1.50 (🎉 HALFTIME SHOW) is PUSHED & LIVE** — shipped 2026-08-19 (`?v=66`), the 2nd Round-6 pick.
  New `src/halftime.js` (`window.TDHalftime`, no persistence — it's an in-the-moment mini-game): at
  HALFTIME a quick tap-to-the-beat show plays — the band strikes up, a big 🥁 pulses on the beat, and you
  tap along to fill a HYPE METER before a 6-second timer runs out. Tap ON the beat (while the drum glows)
  for a PERFECT (+11 vs +5). Fuller meter → better rating (1–3 ⭐) → more bonus coins (5…25, into the
  game's payday), with a 🎉 celebration spray. **Integration is deliberately non-invasive:** it's a DOM
  overlay (`#halftime-modal`) shown ON TOP of the existing halftime break via a single line in
  `startBreak()` — `if (kind === 'half' && window.TDHalftime) TDHalftime.start();`. The overlay covers the
  field so taps drive the show (the "tap to continue" listens on the game *canvas*, a sibling beneath, so
  those taps never leak through), and the game keyboard is switched off while it's up so SPACE can't skip
  the break. When the show finishes it awards coins, flashes the result, then tucks itself away after ~2 s
  — revealing the untouched break screen (score + silly ad + "tap to continue") to tap through to the 2nd
  half. Verified live via DOM/JS: taps fill the meter (+5 / on-beat +11), rating+coins correct (25 at
  100%), the real `startBreak('half')` flow works end-to-end (show on top, break built underneath, keyboard
  off, NO premature resume; then dismiss → keyboard back → `endBreak()` resumes the 2nd half), 0 errors,
  no overflow at 375 px. **NOTE:** the 6-second timer means a `start()` left running between DOM-poke tool
  calls will auto-finish on its own (that's correct behaviour, not a bug) — test the coin award in one
  synchronous call.
- **✅ v1.51 (🎽 UNIFORM DESIGNER) is PUSHED & LIVE** — shipped 2026-08-19 (`?v=67`), the 3rd Round-6 pick.
  New `src/uniform.js` (`window.TDUniform`, key `tdr-custom-uniforms` = an array of
  `{id,abbr,name,jersey,helmet}`, jersey/helmet as `0xRRGGBB` numbers — same shape as the built-in
  uniforms). Design your OWN kit: pick a jersey + helmet color from a 16-swatch palette, name it (🎲
  random-name button), with a live SVG jersey+helmet preview that recolors as you go. SAVE it to your
  Locker (a wardrobe, cap 6, each editable/deletable). **Integration:** a saved kit is just a two-color
  "team", so `allTeams()` in main.js now `.concat(TDUniform.customTeams())` → custom kits appear right in
  CHOOSE YOUR TEAM and the field chibi wears them (the player texture is drawn from exactly
  `jersey`+`helmet`, so NO new art). Saving jumps the menu to the new kit via the existing
  `window.TDMenu.showTeam(abbr)` bridge; I also added a small `TDMenu.refresh()` (clamps `G.menuIndex` +
  repaints) so deleting the kit you're currently "standing on" can't leave the menu card pointing past the
  end of the list. Lives in the 🛍 Pro Shop (a "🎽 UNIFORM DESIGNER" button by Card Packs/Stadium) — NO new
  menu chrome. Verified live via DOM/JS: design→save (hex→int colors, persisted), kit in
  `allTeams()`/`teamByAbbr`, menu jumps to it, a real `startGameWithTeam()` wears it (`window.TEAM` = the
  custom colors) w/ 0 errors; edit-in-place (same id, no dup); validation (empty name / identical colors
  blocked); delete + the delete-while-worn clamp (start-game did NOT crash); the 6-kit cap (save blocked +
  ＋NEW hidden at cap, back below); no overflow @375px. Two small main.js edits only (`allTeams()` concat +
  `TDMenu.refresh`).
- **✅ v1.52 (⚡ POWER-UP PLAYS) is PUSHED & LIVE** — shipped 2026-08-19 (`?v=68`), the 4th Round-6 pick.
  New `src/powerup.js` (`window.TDPowerup`, key `tdr-powerup` = the equipped power id). A once-a-game HERO
  MOVE you equip ahead of time and fire YOURSELF at the right moment (vs the Lucky Spin's random buffs):
  ⚡ TURBO LEGS (×1.7 run speed, 3 s), 🧤 STICKY HANDS (+0.6 catch, 4.5 s), ❄️ FREEZE DEFENSE (defenders
  ×0.15 speed, 2.6 s). Equip one in the 🛍 Pro Shop ("⚡ POWER-UP PLAYS" button → `#power-modal` picker);
  in a game, a `#btn-power` ⭐ button in `#ingame-ctrls` fires it — only mid-play (state `live`/`pass`),
  once per game (button greys via the shared `.off`; a `#power-flash` splash + hint toasts). **Uses the
  exact safe mechanism the Lucky Spin does — no game-loop rewrite:** `TDPowerup.speedMult()/catchAdd()/
  defSlow()` are live multipliers folded in by shop.js (`speedMult() *= puSpeed()`, `gloveBoost` `extra +=
  puCatch()`) and by ONE line in main.js `updateDefense` (`boost *= TDPowerup.defSlow()`); idle = ×1/+0/×1
  so no-fire is byte-identical baseline. Only other main.js edit: `TDPowerup.newGame()` in `beginGame`
  (resets your one use). Verified live via DOM/JS: equip+persist; fire TURBO in a live play → `speedMult`
  1.2→2.04 (folds into `runSpeed`); STICKY → `gloveBoost.catchBonus` 0.2→0.8; FREEZE → `defSlow` 0.15 and
  the `updateDefense` fold runs clean across 1.5 s of pumped frames (0 errors); once-per-game guard (2nd
  fire blocked), must-be-live guard (presnap fire → hint, not used), `newGame` resets; the in-game button
  shows the equipped icon and all FOUR in-game buttons (⏱/🧩/🎩/⭐) fit a 375 px phone (right edge 363<375);
  picker no overflow. **NOTE:** checked the Spin overlap first (as promised) — kept it distinct by making
  it player-*triggered* + swapping in FREEZE (which the Spin has no equivalent of).
- **✅ v1.53 (🎯 PRACTICE ARCADE) is PUSHED & LIVE** — shipped 2026-08-19 (`?v=69`), the 6th Round-6 pick.
  New `src/arcade.js` (`window.TDArcade`, key `tdr-arcade` = `{target: best pts, fg: longest FG yd}`). A
  self-contained hub of skill drills you can play any time (no full game) — **purely additive, ZERO edits
  to main.js/shop.js** (like the Halftime Show, it's its own little DOM world and never touches the Phaser
  sim; it just pays coins via `TDShop.earn`). Two drills: **🎯 TARGET PRACTICE** (targets pop up on a
  yard-lined field, tap them before they vanish, 🔥 combo bonus for chains, 20 s clock — 10+combo pts/hit,
  best pts saved) and **🦵 FIELD GOAL CHALLENGE** (a marker sweeps a meter, tap KICK to stop it in the
  green zone; a make backs you up 5 yd — the green shrinks + sweep speeds up — miss and you're out; longest
  made yd saved). Coins: target `min(20, pts/25)`, FG `min(25, makes×4)`; a 🏆 NEW BEST! ribbon + celebrate
  on a record. Opened from the 🛍 Pro Shop ("🎯 PRACTICE ARCADE" button); `#arcade-modal` swaps
  `#arc-stage` between hub / drill / result and shows `#arc-hud`. Verified live via DOM/JS: hub renders
  both cards+bests; target hit scores (10→12 w/ combo); FG make/miss judging via `getBoundingClientRect`
  (GOOD in-zone → makes+1/yard+5, wide → NO GOOD → result); result shows score+coins+NEW BEST and persists
  `tdr-arcade`; nav (PLAY AGAIN / ← ARCADE); `close()` clears all spawn/timer intervals (no leak) + resets
  mode + restores keyboard; hub/target/FG all fit a 375 px phone, 0 errors. **VERIFY GOTCHA:** the FG
  drill's tap-judging needs real layout (`getBoundingClientRect`) — a HIDDEN browser pane reports
  `innerWidth 0` so every rect is 0 and kicks read as "wide"; take a screenshot first to wake the pane,
  and always `TDArcade.open()` (not just `_startFG()`) so the modal is actually laid out.
- **✅ v1.54 (🏆 PLAYOFF TOURNAMENT) is PUSHED & LIVE** — shipped 2026-08-21 (`?v=70`), the 7th Round-6
  pick. New `src/playoffs.js` (`window.TDPlayoffs`, key `tdr-playoffs` = `{v,titles,bestRound,run}`): a
  16-team **single-elimination bracket** you jump into from the 🏆 SEASON hub — win FOUR games in a row
  (Round of 16 → Quarterfinal → Semifinal → THE FINAL) to lift the trophy; lose once and you're OUT.
  Everyone else's games auto-play (the same power-rated `simGame` upset math as `season.js`), so the
  bracket fills in around you. Round wins pay +10/+15/+20 🪙 and the title pays a **+150 jackpot**; your
  trophies & furthest run persist. **Mirrors the season.js pattern — the bracket file never touches Phaser.**
  Surgical `main.js` hooks: a `G.playoffGame` flag + a rising `roundBuff()` (no bump R16 → +7.5% in THE
  FINAL, applied to the opponent only) in `beginGame`; a `startPlayoffGame(you,opp)` on the `TDGame` bridge
  (calls `beginGame(team,opp,false,false,true)`); a `TDPlayoffs.reportResult(G.score,G.oppScore)` line in
  `endGame` beside the season one; and a return-to-bracket branch in `returnToMenuFromGameOver`. Opened from
  a `#open-playoffs` button INSIDE the Season modal → its own `#playoffs-modal` (a "YOUR RUN" ladder of
  rungs + trophy cap) — **no new menu chip/status bar** (phone layout untouched). Verified via DOM/JS: a
  4-win run advances 0→1→2→3→champion with the buff rising exactly 1.000/1.025/1.050/1.075 and coins
  +10/+15/+20/+150; a loss knocks you out and crowns the sim winner; the REAL integration (`startPlayoffGame`
  → `beginGame` applies the buff [oppOff matched `tilt(off)×1.05` at round 2] → `__td.endGame()` reports →
  bracket advances → return reopens the modal + clears the flag) is clean; persists across a real reload;
  no overflow at 375px; 0 console errors.
- **✅ v1.55 (🎬 FILM ROOM) is PUSHED & LIVE** — shipped 2026-08-21 (`?v=71`), the **8th & FINAL Round-6
  pick — 🎉 the board is SWEPT!** New `src/film.js` (`window.TDFilm`, key `tdr-film` = an array of saved
  highlights). A **persistent career highlight reel**, deliberately DISTINCT from the transient instant
  replay (which films only the last ~2.5s of the current play and is reset every play). Every touchdown you
  score, we harvest the ball's real route from `G.replay`, boil it to ~30 points, and keep your best dozen;
  open the Film Room from the 🏆 Trophy Case to re-watch them traced out on a `<canvas>` mini-field (◀ ▶ to
  flip clips, 🔁 to replay), each classified 💣 bomb (40+ yд) / 🦅 pick six / 🎩 trick / 🏈 TD, capped at 12
  (weakest dropped when full). **Self-contained** (its own DOM + canvas theater, never touches Phaser) with
  **exactly ONE guarded `main.js` hook**: a `TDFilm.capture({yds:100-G.losYards, opp, q, pickSix, trick,
  frames:G.replay})` line beside the existing `TDRecords.td(...)` in the TD branch of `endPlay`. Opened from
  a `#open-film` Trophy Case button → `#film-modal`. ⚠️ Its playback uses `setInterval` (rAF pauses in bg
  tabs) so in a HIDDEN pane the route traces slowly — a screenshot wakes the pane. Verified via DOM/JS:
  capture classifies types correctly + resamples the path + skips too-short plays; the cap keeps the best 12
  (drops the 3 weakest of 15); the REAL hook fires through `__td.endPlay('touchdown')` (65-yд bomb vs the
  right opp, correct path); ◀▶ nav wraps; the empty state shows a friendly nudge; no overflow at 375px;
  0 console errors. **⚠️ Heads-up:** the `git add` for this commit (`bf23bf1`) also swept in a concurrent
  session's uncommitted CrazyGames edits (a balance pass — `PLAYER_SPEED` 215→205, `DEF_SPEED` 186→190,
  `PURSUE_SPEED` 190→194, `OL_SPEED` 188→193, `BLOCK_DIST` 27→30 — and the `#btn-fs{display:none!important}`
  fullscreen-button hide). Those are good/intended changes and are now live; noted so the history is honest.

### 🆕 Round 7 — "The Franchise Board" (a fresh chart, opened 2026-08-22)

A new Add-On Draft Board (Artifact `b9a02152-c952-4f10-8c97-1f550e8128a5`, reusing the R6 night-stadium
design) with eight brand-new picks ranked easiest→hardest — this round is about making the game feel like
YOURS: ①🕺 Touchdown Celebrations ②⭐ Player of the Game ③📊 Box Score ④🎨 Field Designer ⑤🙋 Create-A-Player
⑥🏈 Special Teams Tricks ⑦🎃 Season Events ⑧📚 Dynasty Mode. (Each was checked against the codebase first —
all eight are genuinely new.)

- **✅ v1.58 (🕺 TOUCHDOWN CELEBRATIONS) is PUSHED & LIVE** — shipped 2026-08-22 (`?v=73`), the 1st Round-7
  pick. New `src/celebration.js` (`window.TDCeleb`, key `tdr-celebration` = `{owned, equipped}`): pick your
  signature end-zone move and it plays a big splashy animation over the field every time YOU score. Eight
  moves — 🙌 Raise the Roof / 🏈 Spike It / 🕺 The Dance (free) and 💪 Flex On 'Em (60) / 🔥 On Fire (120) /
  ⚡ Electric (180) / 👑 Crown Me (300) / 🚀 Blast Off (450) bought with coins via `TDShop.spend` — each with
  one of four animation styles (`bounce`/`spin`/`pulse`/`shake`), 10 flying particles and a name flash.
  **Self-contained** (its own `#celeb-fx` DOM overlay, never touches Phaser) with **exactly ONE guarded
  `main.js` hook**: `if (window.TDCeleb) TDCeleb.play();` beside the other TD hooks in the `endPlay`
  touchdown branch. The picker lives in the 🛍 Pro Shop (a "🕺 CELEBRATIONS" button → `#celeb-modal`, big
  looping preview + an 8-card grid) — no new menu chip/status bar. Honors `prefers-reduced-motion` (drops
  the particles and the bounce, keeps a calm label). Verified via DOM/JS: grid renders 8 cards with correct
  EQUIPPED/EQUIP/price tags; buying spends exactly the price, marks owned + auto-equips, and updates the
  preview; buying while broke is blocked with a friendly note (nothing saved); a REAL `__td.endPlay(
  'touchdown')` fires the equipped move (💪 + `celeb-pulse` + 10 particles, score→6); persists across a
  reload; 3-column grid with no overflow at 375px; 0 console errors — then re-verified on the LIVE site.

- **✅ v1.59 (⭐ PLAYER OF THE GAME) is PUSHED & LIVE** — shipped 2026-08-22 (`?v=74`), the 2nd Round-7
  pick. New `src/gamestats.js` (`window.TDGameStats`, **no persistence** — these are this game's numbers):
  a per-game STAT BOOK that counts catches, carries, yards, TDs, made FGs and takeaways for YOUR drafted
  players, matching each on-field guy to his roster spot (`offense[0]`=QB, `[1]`=RB, `[2]/[3]`=WRs; the
  three defensive starters rotate takeaway credit since the 1-player defense is the mini-map sim). Roster
  names are read **read-only** from `tdr-roster` (no draft.js edits), with friendly fallbacks ("Your QB")
  if you've never drafted. At the final whistle the top performer — scored by
  `td*60 + takeaway*50 + fg*35 + rec*5 + yards + passTd*30 + passYds*0.5` — is crowned in a gold
  `#mvp-modal` spotlight (emoji, name, position pill, stat line, coin bonus) that lands ON the FINAL
  screen ~850 ms after the whistle; the bonus is `8–35` coins scaled by TDs/takeaways/yards. A game where
  nobody did anything awards nothing and shows no card. **Seven guarded one-line main.js hooks:**
  `newGame()` in `beginGame`, `play(result, carrierIdx, gain)` at the top of `endPlay` (after the 2-pt
  early-return; gain = `100-losYards` on a TD, 0 on an incomplete, else `spot-losYards`), `noteCatch()` in
  `catchAndRun`, `noteFG()` in `onKickDone`, `noteTakeaway()` at BOTH turnover spots, and `finish()` in
  `endGame` **before** `buildGameOverOverlay` so the bonus lands in the payday. The game keyboard is
  switched off while the card is up (SPACE can't restart behind it). Verified via DOM/JS: the engine
  credits receptions vs carries correctly (a catch also gives the QB a completion + pass yards + pass TD),
  incompletes credit nobody, FG/takeaway logged, MVP + stat line correct; a REAL `catchAndRun` →
  `endPlay('touchdown')` → `endGame()` crowned the real roster name ("Max Vance · WR · 1 catch · 80 rec
  yds · 1 TD · +19 🪙") with the card on top of FINAL and the keyboard off; dismiss restores it; quiet game
  = no award; no overflow at 375px; 0 errors — then re-verified live.
  **📊 Foundation note:** `table()` returns the full stat sheet (every tracked player + side), which the
  next pick (Box Score) reads instead of duplicating the counting.

- **✅ v1.60 (📊 BOX SCORE) is PUSHED & LIVE** — shipped 2026-08-22 (`?v=75`), the 3rd Round-7 pick. New
  `src/boxscore.js` (`window.TDBoxScore`): a broadcast-style post-game sheet — a final-score strip
  (win/loss tinted), six team-total tiles (total / rushing / receiving yards, TDs, FGs, takeaways) and a
  row per player with exactly what they did, plus a ⭐ POTG tag on the Player of the Game and a gentle
  "quiet day at the office" for anyone who didn't touch it. **It does NO counting of its own** — v1.59's
  `gamestats.js` already keeps the book, so this only READS `table()` / `teamTotals()` / `game()`. That
  means **zero new main.js hooks** and the two can never disagree. `gamestats.js` gained only the
  scoreboard side: `finish(info)` now records `{my, opp, myAbbr, oppAbbr, myName, oppName}` and exposes
  `game()` + `teamTotals()` (team yards = rushing + receiving; `passYds` is deliberately NOT added, since
  it's the QB's view of the same yards). So the single main.js change is passing that info into `finish`.
  Opened from the ⭐ card (`#open-box` "FULL BOX SCORE") or later from the 🏆 Trophy Case
  (`#open-box-trophy` "LAST BOX SCORE") — it holds the last finished game until the next kickoff, with a
  friendly empty state before your first game. Verified via DOM/JS: empty state; a real game (SEA 17–ARI
  10) produced correct totals (54 total / 19 rush / 35 rec / 1 TD / 1 FG / 1 takeaway) and 7 player rows
  with real roster names and exactly ONE ⭐ POTG tag; both entry points open it (and opening from the star
  card closes that card); close restores the keyboard; 3-wide tiles, no overflow, sheet scrolls inside the
  card at 375px; 0 errors — then re-verified live.

- **✅ v1.61 (🎨 FIELD DESIGNER) is PUSHED & LIVE** — shipped 2026-08-22 (`?v=76`), the 4th Round-7 pick.
  New `src/field.js` (`window.TDField`, key `tdr-field` = `{turf, endzone, logo}`): design your home field
  — **8 turfs** (Classic Grass, Emerald, Blue Turf, Red Turf, Purple Reign, Teal Tide, Midnight, Snow Day —
  each a pair of mown stripes), **8 end-zone colours**, and **12 midfield logos** (★ 🏈 ⚡ 🔥 👑 🦅 🐉 🌟 🦈
  🐻 🚀 💎), with a live CSS mock-up of the field in the picker and a "↩︎ CLASSIC LOOK" reset.
  **⚠️ Unlike the self-contained pop-ups, this one really changes the PHASER field:**
  - `drawField` now reads `TDField.look()` for the stripe colours, end-zone colour, and midfield logo —
    guarded, so with `field.js` absent it falls back to the original `GRASS_DARK`/`GRASS_LIGHT`/
    `ENDZONE_COLOR` constants and `★` (byte-identical classic look; the reset restores exactly those).
  - `drawField` collects **everything it creates** into `G.fieldParts`, and a new `repaintField()` destroys
    those before redrawing. Exposed on the `TDGame` bridge, so the designer repaints the real field the
    instant you tap a swatch. **Verified ZERO object leak** — the scene display list stayed at exactly 61
    across three repaints (this was the main risk: `drawField` adds ~23 graphics/text objects each call).
  - `drawField` also seeds the end-zone label from `G.team` now (was hard-coded `'MAX FC'`), so a mid-game
    repaint keeps your team name painted in your end zone.
  - **`field.js` must load BEFORE `main.js`** so a saved design is applied on the very first draw.
  Lives in the 🛍 Pro Shop ("🎨 FIELD DESIGNER") — no new menu chip. Verified via DOM/JS: defaults match
  the original constants exactly; tapping turf/end-zone/logo saves + repaints live (a real game showed a
  genuinely blue field with crimson end zones); no leak; reset restores classic; the design survives a
  reload and is applied at startup (midfield text object literally `👑`); 8 swatches/row at 375px with no
  overflow; 0 errors — then re-verified live.

- **✅ v1.62 (🙋 CREATE-A-PLAYER) is PUSHED & LIVE** — shipped 2026-08-23 (`?v=77`), the 5th Round-7 pick.
  New `src/createplayer.js` (`window.TDCreate`): build ONE custom superstar — name (≤16 chars), jersey
  number (0–99), one of **7 positions** and one of the **10 existing ⭐ traits** — and he joins your MY TEAM
  roster as a real **72 OVR** starter, with a live jersey preview as you type.
  **⚠️ Roster integration is the whole trick here.** The roster lives in `draft.js`'s closure, so writing
  `tdr-roster` from outside would go stale and get overwritten on draft.js's next save. Instead **draft.js
  gained a small API** — `getCustom / setCustom / clearCustom / slotList / traitList` — and createplayer.js
  goes through it, so there's exactly one copy of the truth and MY TEAM, 🌱 growth, trades, payroll, the
  📊 Box Score and the ⭐ MVP award all just work. Your guy is a **completely normal player object** (plus
  `custom: true` and `num`), so nothing downstream needed special-casing. `setCustom(pos)` moves him
  between slots and hands the vacated slot back to a generated 60–70 player, so the team is **always 8
  deep** and there's **only ever one** custom player; `clearCustom()` sends him home the same way.
  draft.js's `playerRow` shows him a "🙋 #N YOURS" tag.
  **UX fix found in testing:** the card and the editor now have SEPARATE buttons (`#cap-edit` ✏️ opens the
  form, `#cap-make` 💾/✨ only ever saves). One button doing both jobs mis-saved the position (picking QB
  landed him at WR) because the first tap re-seeded the draft from the existing player — worth remembering
  if a similar two-mode pop-up shows up again. The game keyboard is off while the editor is open so typing
  a name can't hike the ball. Lives in the 🛍 Pro Shop — no new menu chip. Verified via DOM/JS: create →
  right slot/ovr/trait/number and saved to disk; team overall 64→65 (a fair nudge, still inside the +8%
  cap); EDIT prefills and moving RB→QB lands at slot 0 with the old RB slot refilled (roster still 8,
  exactly 1 custom); 3 growth cycles treat him normally (xp 0→54, potential 79); the stat book/MVP use his
  name; MY TEAM shows the tag; short names rejected; remove restores a normal player; survives a reload;
  no overflow at 375px; 0 errors — then re-verified live (test player cleaned up afterwards).

- **✅ v1.63 (🏈 SPECIAL TEAMS TRICKS) is PUSHED & LIVE** — shipped 2026-08-23 (`?v=78`), the 6th Round-7
  pick. New `src/special.js` (`window.TDSpecial`, no persistence — per-game weapons):
  - **🎭 FAKE PUNT / FAKE FIELD GOAL** — a third choice on the 4th-down panel (`#btn-fake`, worded by
    range). You line up to kick, then run a normal down while the defense sells out for the block.
    **Reuses the 🎩 trick play's proven "defense bites" window** instead of touching the play loop: the
    snap sets `trickActive` + a LONGER `FAKE_BITE_MS` (1050ms vs the trick's 780) because they came to
    block. Measured the real effect — on a normal snap coverage drifts **47.7px AWAY** from the line; on a
    fake it collapses **30.7px TOWARD** it, opening the lane. **Two per game**, and a fake does NOT spend
    your separate 🎩 trick play (verified).
  - **⚡ ONSIDE KICK** — after you score, gamble on getting the ball right back. Offered only when a coach
    really would (you're behind, or Q4). ~22% recovery (measured 23% over 4000 rolls). Recover → you keep
    it at your own 45; fail → they take over at midfield via the existing `G.turnoverSpotCpu` lever.
    **The flow is held open by parking `G.deadUntil` while the panel is up**, then releasing it — no new
    game state was needed, which is what kept this safe.
  - main.js hooks are all guarded: the fake button in `showFourthDownChoice`, a `'fake'` branch in
    `chooseFourthDown`, the bite at the snap, per-play + per-game resets, and the onside offer at the end
    of `onKickDone`. ⚠️ **CSS gotcha:** `#fourth-down .choice` (id+class) outranks a bare `#btn-fake`, so
    the fake's font/padding silently lost until the selector became `.choice.fake` — remember this for any
    button added inside an existing id-scoped panel.
- **✅ v1.64 + v1.65 (🙋 PLAYER on the front screen) are PUSHED & LIVE** — shipped 2026-08-23 (`?v=79`,
  then `?v=80`). **Max asked for Create-A-Player to be reachable straight from the menu** instead of only
  through the Pro Shop, so `#menu-meta` gained a 🙋 PLAYER chip (next to 🏟 TEAM) wired to the same
  `TDCreate.open()`; the Pro Shop button still works. That makes **EIGHT chips**, which needed the
  narrow-screen rules tightened — and shipping it exposed a sizing bug worth remembering:
  **the coin chip is the only variable-width item in that row.** At 641 coins it fit with 5px spare, but
  9999 overflowed by 4px and 10,516 by 8px (Max has had 10k+). v1.65 fixes it two ways: `shop.js`
  (+ draft.js's matching painter) now shorten the CHIP only — `10516 → "10.5k"`, `87400 → "87.4k"` (the
  exact number still shows in the Pro Shop; no coin math changed) — and the ≤380px rules go to chips 32px
  / gap 3 / coin 12px. Verified 641 / 9999 / 10.5k / 87.4k / 1001k all fit (worst case 22px slack), no
  label spill. **The row's HEIGHT is unchanged**, so the XP/challenges/trophy/road bars and the delicate
  Phaser "CHOOSE YOUR TEAM" clearance from v1.44/v1.45 are untouched.

- **✅ v1.66 (🎃 SEASON EVENTS) is PUSHED & LIVE** — shipped 2026-08-23 (`?v=82`), the 7th Round-7 pick.
  New `src/events.js` (`window.TDEvents`, key `tdr-events` = `{played, won}`).
  **⚠️ Max redirected this one mid-build and the redirect was right:** events are NOT a mode you pick from
  a menu — you just start a game during Halloween week and it IS 🎃 HALLOWEEN NIGHT. Twelve events across
  the year, each live for **about a week** (sitting on the real holiday where there is one — he chose
  "auto, wider windows"), so one comes around roughly monthly and still feels like an occasion: Oct 15 is
  a normal day, Oct 31 is not.
  Each dresses the game up completely — **his ideas, built as asked**: 🎃 Halloween = night game, black/
  orange field, 🎃👻🦇🕸️ in the end zones and 🧛🧙 in the stands; 🦃 Turkey Bowl = wind, 🦃🍂🥧 on the field
  and a "TURKEY TIME! 🍽️" party on a win; 🎄 Snow Bowl = blizzard, 🎄🎁⛄ decorations with **🎅 Santa (+🤶🦌)
  in the crowd** and "MERRY CHRISTMAS!" on a win — plus nine more, each with its own colours, weather,
  decorations, crowd and themed win celebration (fired via the existing `TDShop.celebrate`). Playing pays
  +15 🪙, winning +40 more; the events screen (opened from the 🏆 Season hub) tracks the 12-month collection.
  Wiring is all guarded and reuses existing paths: `beginGame` asks `TDEvents.begin()` (no new arg, no new
  bridge call — that's what made "automatic" simpler than the menu version), `drawField` takes the event's
  look FIRST then the Field Designer's, decorations ride in `G.fieldParts` so `repaintField()` clears them,
  `weather.js`'s `forGame()` gained an optional `force` argument, and `endGame` pays out.
  🐛 **Caught in testing:** the field only repainted FOR an event, so last week's Santa was still standing
  around during a normal game afterwards. `beginGame` now repaints EVERY game — verified event days theme
  up (47 field parts) and normal days come back completely clean (23, zero decorations), toggling both ways.

- **✅ v1.67 (📚 DYNASTY MODE) is PUSHED & LIVE** — shipped 2026-08-23 (`?v=83`), the **8th & FINAL
  Round-7 pick — 🎉 the board is SWEPT.** New `src/dynasty.js` (`window.TDDynasty`, key `tdr-dynasty` =
  `{year, history, hof, titles, lastSeen}`): finish a season and the calendar turns — players get a
  birthday, guys past 30 slide a little, and at **34 they retire** (a rookie takes the locker, so the
  roster is always 8 deep) into your 🎓 **HALL OF FAME**. Every season is written into **TEAM HISTORY**
  (year, record, Max Bowl or not). Your 🙋 created player never retires. It runs no games itself —
  `season.js` gained a small `snapshot()`, `draft.js` gained `advanceYear()` + `rosterAges()` (ages
  back-filled for old saves), and ONE guarded line in `endGame` after `TDSeason.reportResult` turns the
  page. Opened from the 🏆 Season hub. 🐛 **Caught in testing:** the "already counted" guard keyed off the
  CURRENT year — which advances the instant we turn the page — so it never matched and one finished season
  counted three times. The mark now describes the finished SEASON (`team:phase:W:L:champion`) and clears
  whenever a season is back in progress. Verified clean-slate: 2026 win 5-1 🏆 → 2027 → lose 2-4 → 2028,
  exactly 1 title, repeats are no-ops, retiree in the HoF, roster stays 8.
- **✅ v1.68 (📱 PORTRAIT TIDY-UP) is PUSHED & LIVE** — shipped 2026-08-23 (`?v=84`). Max's words: on a
  phone the menu was *"really thin and all jumbled together."* Measured at 375×812 it was **five layers of
  chrome in the top 185px** (the 8-chip row + four full-width bars stacked four deep); the bottom two
  overlapped the canvas and the Phaser "CHOOSE YOUR TEAM" title had **10px** of clearance, while ~150px of
  width sat unused to the right. On phones (≤500px) the bars now sit in a **2×2 grid** (XP | CHALLENGES /
  TROPHY | REWARD ROAD): chrome 185px → **118px**, title clearance 10px → **77px**. The streak pill drops
  below the grid, bar innards tighten, `#xp-nums` hides (the fill bar shows progress), and the label is
  shortened to "CHALLENGES" so it reads in full. **Desktop/iPad untouched** — the change is entirely
  inside the ≤500px query, so v1.45's wide-screen title fix still governs there. Verified: no clipping,
  nothing off-screen, no page overflow, all three tappable bars still open their pop-ups.
- **🔁 FULL-GAME REGRESSION PASS (2026-08-23, on the live site):** all **31** feature modules load with
  **0 console errors**; one touchdown correctly fired five systems at once (🕺 celebration, 🎬 film capture,
  ⭐ stat book, 🎃 event theming, score); the whole end-of-game chain works (MVP crowned, 📊 box score built,
  event recorded, payday tallied) and returning to the menu clears the event theme (47 field parts → 23);
  **all 12 pop-ups open cleanly** (Playoffs, Film Room, Celebrations, Box Score, Field Designer,
  Create-A-Player, Season Events, Dynasty, Ranked, Arcade, Trophy, Season). Max's real save was snapshotted
  and restored afterwards.

### 🆕 Round 8 — "The Front Office Board" (a fresh chart, opened 2026-08-23)

A new Add-On Draft Board (Artifact `068b76ea-0171-4dfd-966d-c180461faadf`, same night-stadium design).
This round you run the whole club: ①📸 Sticker Book ②🎙️ Broadcast Booth ③🎯 Weekly Quests ④🚌 Road Trip
⑤💰 Free Agency ⑥🍿 Concession Stands ⑦🎓 Game Plan ⑧📖 Custom Playbook.

- **↔️ Pick ①📸 Sticker Book — SWAPPED OUT as already-in-game.** It was covered twice over: 🏅 Achievement
  Badges (v1.39) already rewards the exact same big moments (💣 40+ yd TD, 🛡️ shutout, 😤 comeback, 🔥 hat
  trick, 🦅 pick six…) on a badge wall, and 🃏 Card Packs (v1.43) already does the album/rarity/duplicate
  half. Max chose **🌟 Player Nicknames** as the replacement rather than build a third collection.
- **✅ v1.69 (🌟 PLAYER NICKNAMES) is PUSHED & LIVE** — shipped 2026-08-24 (`?v=85`), the 1st Round-8 pick.
  New `src/nicknames.js` (`window.TDNick`, key `tdr-nicknames`): nickname the guys on your roster and the
  ANNOUNCER uses it live — "THE ROCKET IS ROLLING!" on a big run, "TOUCHDOWN — THE ROCKET!" on a score,
  "RIGHT TO THE ROCKET!" on a catch. Type your own (≤14 chars) or hit 🎲 for one of 22 ready-made ones.
  **Saved against the PLAYER'S ID, not his roster spot**, so moving him around never hands his name to
  someone else, and a Dynasty retirement takes his nickname with him (stale ids are swept on load so the
  save can't grow). `draft.js`'s `rosterAges()` now returns `id` + `slot` for this. Three guarded main.js
  hooks, each simply swapping in a better line when the ball carrier has a nickname and falling straight
  back to the existing play-by-play otherwise (big-run call in `endPlay`, the touchdown call, and the catch
  call in `catchAndRun`). Lives in the 🛍 Pro Shop — no new menu chip. Verified: 8 rows render, edit/🎲/
  save/delete all work, a REAL touchdown by the nicknamed RB announced "TOUCHDOWN — THE ROCKET!" while a
  non-nicknamed player fell back normally; phone-safe, 0 errors — then re-verified live.

## ✅ Sync status — v1.11–v1.69 are all LIVE (v1.25–v1.29 pushed 2026-08-14; v1.30–v1.38 pushed 2026-08-15; v1.39–v1.40 pushed 2026-08-17; v1.41–v1.47 pushed 2026-08-18; v1.48–v1.53 pushed 2026-08-19; v1.54–v1.55 pushed 2026-08-21 — 🎉 Round 6 swept; v1.56 Film Room whole-field replay + v1.57 tab icon/share image pushed 2026-08-21; v1.58-v1.61 — Round-7 picks 1-4 — pushed 2026-08-22; v1.62-v1.68 picks 5-8 + the PLAYER button + the portrait tidy-up pushed 2026-08-23 — Round 7 swept)

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

And **v1.28** (cache-buster `?v=45`) — two things: 🥁 a low "**bum bum bum**" sting (`STINGS.stuff` in `sound.js`)
that plays when the defense **stuffs your two-point try** (and on a blocked kick); and 🏈 a **kick upgrade** — a
rusher (in the opponent's colors) now charges every kick, and if he beats you the **kicker is tackled and you
lose the ball** (`src/kick.js` + hooks in `src/main.js`). Verified by driving the exported globals + `KickGame`
and stepping the frozen loop by hand.

And **v1.29** (cache-buster `?v=46`) — 🌦 **weather now changes GAMEPLAY** (first of a new feature batch Max asked
for on 2026-08-14, shipped one-at-a-time): 🌙 night → harder to catch, 🌧️ rain → shaky field goals, 🌬️ new WINDY
→ passes flutter, plus two new EXTREMES 🥵 HEAT and 🥶 BLIZZARD. `src/weather.js` gained per-kind `catch`/`fg`
multipliers (+ `catchMult()`/`fgMult()`); `main.js` applies `catchMult` to both teams' completions, `kick.js`
can blow a good FG wide (locked once so it can't waver). Verified: FG-wide rates match `fgMult` (rain ~24%,
blizzard ~20%, clear 0%), all 7 overlays + announcer lines render, no errors.

And **v1.30** (cache-buster `?v=47`) — 🛡 **defense is simplified** (2nd of Max's 2026-08-14 feature batch): in
1-player, chasing a ball carrier is GONE — defense is now a **tap-to-progress mini-map** (`#defense-sim` +
`DefenseSim` in `main.js`) that simulates the opponent's drive play-by-play and reuses the old
`cpuDriveEnd()`/`finishCpuDrive()` for scoring & possession. **2-player keeps LIVE defense** (`startCpuDrive`
branches on `G.twoPlayer`) so P2 still runs the red offense. Verified over 400 frozen-clock drives: realistic
endings (punt 60% / turnover 19% / FG 14% / TD 7%), scoring deltas consistent (3/6/7/8), no errors, no loops.

And **v1.31** (cache-buster `?v=48`) — 🛍 **shop upgrade** (3rd of the batch): **4 new gear items** (each ties into
a recent feature) + **3 buyable uniforms**. New gear: 🎯 CANNON ARM (fewer thrown picks), 🧥 ALL-WEATHER GEAR
(shrug off the v1.29 weather penalties on catches & FGs), 🦵 GOLDEN TOE (easier kicks — steadier aim + more time
vs the v1.28 rusher), 🖐 BALL HAWK (more takeaways in the v1.30 defense sim). New 🎽 STYLES shelf sells FIREBALL /
AQUA STORM / VOID STAR uniforms for coins. Verified: perks correct at max (arm .5, weather .8, toe .6, hawk .2),
old saves normalize (no NaN), All-Weather cut rain FG-wide 20→6/80, Golden Toe rushMs 3400→5848, Ball Hawk
turnovers 19%→68%, buying a uniform works, no errors.

And **v1.32** (cache-buster `?v=49`) — 🏟 **draft board made more engaging** (4th & last of the batch, the
in-game half of "New Draft Board"): 🔥 a **TOP PROSPECT** badge highlights the best guy on the board each pick,
💎 **boom/bust reveals** tag every pick (STEAL / STUD / BIG UPGRADE / DEPTH), and a 🏅 **DRAFT GRADE** (A+→D)
recaps the class with a coin **bonus** and a 🏆 **personal-best** chase (`tdr-draftbest`). All in `src/draft.js`
+ CSS. Verified: a strong class graded A+ (+100🪙, NEW BEST stored), the badge + tags render, no errors. The
matching **planning chart** (the other half of "Both") is a fresh Artifact, not code.

And **v1.33** (cache-buster `?v=50`) — 🎡 **THE LUCKY SPIN** (the first pick off the new **Round-3** board):
a timed wheel of **buffs** you can spin every few minutes. Where it lands is a surprise — most spins are
duds or small stuff, but the shiny slices are SUPER rare, so hitting ⚡ TURBO or 🌟 GOD MODE is a real
event. That rarity is the whole hook ("just one more spin!"). All new code lives in **`src/spin.js`**
(+ a `#spin-modal` wheel, an `#open-spin` menu button, and a top-center `#buff-pill` in `index.html`;
+ CSS). Key design choices:
  - **11 slices, 4 rarity tiers, weighted.** Weights (heavier = commoner): Pocket Change 20, Fresh Legs 20,
    No Luck 15, Speed Boost 12, Sticky Hands 12, Coin Stash 9, Sure Hands 6, Truck Stick 5, Coin Jackpot 3,
    ⚡ TURBO 2, 🌟 GOD MODE 1 (total 105). So **GOD MODE ≈ 0.95%**, TURBO ≈ 1.9%, all legendaries ≈ 2.9%.
    Tune it in the `BUFFS` array — `weight` is the only knob for odds.
  - **Buffs are felt WITHOUT touching main.js.** `spin.js` exposes live getters
    (`speedMult / catchAdd / safeThrow / safeBall / truck`) and `shop.js`'s five perk functions quietly
    **fold them in** (guarded by `window.TDSpin`, so no buff = the old value, byte-for-byte). A speed buff
    *stacks* on your cleats; "Sure Hands" pushes `armAccuracy`/`gripFactor` to 1 (no picks/no fumbles);
    "Truck Stick"/"God Mode" floor `stiffChance`. Coins (Pocket Change / Coin Stash / Coin Jackpot) are
    instant `TDShop.earn`. The core game loop was **not edited at all**.
  - **Timed, with a countdown pill.** Buffs last 90–120s (`dur` per slice). A `#buff-pill` rides the top
    while one ticks (hidden on the menu, where the wheel button already shows status). Cooldown is
    `COOLDOWN = 3 min`; the 🎡 button glows when a free spin is ready.
  - **Everything persists** in `tdr-spin` = `{ last, id, until }` — the cooldown AND any buff-in-progress
    survive a reload (you can't refresh for a free spin; an already-expired buff never comes back).
  - **The wheel:** an SVG pie (`#spin-rot`) built in JS, spun with a CSS `transform: rotate()` + transition.
    Landing math brings the chosen slice under the top pointer with ~5–6 whole turns; the visual landing
    ALWAYS matches the awarded buff (verified for all 11). 🐛 **Gotcha fixed:** never apply the landing
    rotate inside `requestAnimationFrame` — browsers pause rAF for background/unfocused tabs, which froze the
    wheel (the buff still applied via a `setTimeout`, so it looked "stuck but working"). It's now set
    synchronously, so it always lands and still animates smoothly when you're watching.

  Verified live via DOM/JS (per house style, not screenshots-only): no console errors; the wheel renders 11
  slices in order on desktop AND a 375px phone; the geometry lands every slice under the pointer and matches
  the reveal; the perk-fold is exactly right for each buff and for GOD MODE, and is a perfect no-op with no
  buff; the pill/countdown/cooldown/ready-glow all work; the buff survives a reload and an expired one does
  not; and the 7th menu chip fits (right edge 364 ≤ 375) with the pill hidden on the menu. A couple of
  screenshots (desktop + mobile wheel, in-game pill) were grabbed as proof for Max.

And **v1.34** (cache-buster `?v=51`, shipped 2026-08-15) — 🎡 **FREE SPINS in the daily
rewards** (Max's follow-up: "replace a few things on the daily chart… write it as 'free spins'"). Three of
the 14 daily-reward days now hand out **free spins** instead of coins — **day 2 (×2), day 6 (×3), day 11
(×3)** (`DAILY` in `src/shop.js`). A "free spin" is a banked spin you can use on the Lucky Spin wheel
**without waiting out its 3-min cooldown**. How it fits together:
  - `src/spin.js` gained a **credits** count (persisted in `tdr-spin.credits`) + `TDSpin.grantFreeSpins(n)`.
    `ready()` is now "cooldown up **OR** credits > 0". In `doSpin`, if the timer is up it's your normal spin
    (restarts the cooldown, credits untouched — no wasted credit); otherwise it spends one credit and
    **leaves the cooldown running**. The wheel button reads SPIN! / FREE SPIN! / ⏱ m:ss accordingly, with a
    "🎡 N free spins ready" note (correct singular/plural), and the 🎡 menu button shows a teal count badge.
  - `src/shop.js` `claim()` now grants `r.spins` via `TDSpin.grantFreeSpins` and guards `r.coins` (a
    free-spins day has no coins — no NaN); the calendar cell + a legend line show "🎡 N FREE SPINS".
  - `index.html`: `#spin-badge` on the button, `#spin-credits` note in the wheel pop-up, legend text, CSS.

  Verified live via DOM/JS: the calendar shows FREE SPINS on days 2/6/11 (desktop + 375px phone); claiming
  day 2 banks exactly 2 credits with no coins added; a normal spin keeps credits + starts the cooldown; a
  free spin drops the count by one and preserves the timer; the badge/note/glow track the count and clear at
  zero; it all persists across a reload; no console errors.

And **v1.35** (cache-buster `?v=52`, shipped 2026-08-15) — 📋 **DAILY CHALLENGES** (the 2nd
Round-3 pick). Three little goals every day — e.g. "Score 2 touchdowns", "Catch 5 passes", "Force a
turnover" — that reset at your local midnight. Beat one and CLAIM its coins; beat all three and bag the
🎁 bonus (a **🎡 free spin + 50 coins**), tying challenges back into the Lucky Spin. How it's built:
  - **New `src/challenges.js` / `window.TDChallenge`.** A 12-entry POOL (kinds: td, fg, catch, takeaway,
    win, play). Each day a **date-seeded** RNG (`hashStr`→`mulberry32`) picks **3 different kinds**, so the
    set is steady all day and rotates daily (verified: 7 distinct sets over 7 days). Progress, claims, and
    the bonus persist in **`tdr-chal`** `{date, ids, prog, claimed, bonus}`; a new local day auto-rolls a
    fresh set and clears progress.
  - **Progress comes from the game, not the loop.** `main.js` calls `TDChallenge.bump(kind)` at six spots,
    each **co-located with the existing `TDProgress.addXP` award** so it fires on exactly the same real
    events: a touchdown (`endPlay`), a made field goal (`onKickDone`), a completed catch (`catchAndRun`), a
    pick-six and a defensive turnover (`startPickSix` + `cpuDriveEnd`), and finishing/winning a game
    (`endGame`). A 7th call, `TDChallenge.onMenu()`, refreshes the bar when the menu shows. Every hook is a
    guarded one-liner (`if (window.TDChallenge) …`), so with the module absent the game is byte-identical.
  - **UI in `index.html`:** a slim **`#chal-bar`** on the menu (stacked under the XP bar) that shows
    "N/3" and **glows "CLAIM!"** when something's collectable; a **`#chal-modal`** with a progress bar +
    CLAIM button per goal, the all-three bonus row, and a "New challenges in Xh Ym" countdown; and a small
    **`#chal-toast`** that flashes "CHALLENGE COMPLETE!" mid-game. All themed amber to sit apart from the
    green XP bar.

  Verified live via DOM/JS: today's set is 3 distinct kinds; bumping ticks the right goals and completing one
  fires the toast; the bar flips to CLAIM!/glow; the modal renders all three + the unlocked bonus + the
  reset clock; claiming the three paid 15+20+25 coins and the bonus paid +50 coins **and +1 free spin**
  (25→135 coins, spins 3→4); forcing a stale day re-rolls and clears progress; the bar hides in-game; a
  real game starts clean with the module loaded; no console errors.

And **v1.36** (cache-buster `?v=53`, shipped 2026-08-15) — 🏆 **THE TROPHY CASE** (the 3rd
Round-3 pick). A shelf that shows off everything you've earned: your 🏅 **records** (team level & title,
Max Bowl titles, games played, coins), a 🎽 **uniform cabinet** (all 9 styles — owned ones in colour, the
rest locked with a hint for how to earn them), and a 🏆 **badge wall** (10 milestones that light up as you
hit them). How it's built:
  - **New `src/trophy.js` / `window.TDTrophy`.** It OWNS no state — it just READS what other files already
    remember and renders it live each time you open it, so it's always in sync and can't corrupt a save:
    `TDProgress.level()/title()`, `TDShop.coins()` + the new `TDShop.uniformCatalog()`, and the raw
    `tdr-games` / `tdr-titles` / `tdr-draftbest` keys. Because it's read-only there are **no gameplay
    hooks** — just a single `TDChallenge`-style `onMenu()` in `showMenu` to refresh the bar.
  - **`src/shop.js`** gained one export, `uniformCatalog()`, returning every uniform with `{owned, how}` —
    "how" derived from the data it already has (a `price` → Pro Shop, the `DAILY` day map → daily reward,
    CHMP → Win the Max Bowl). No other shop behaviour changed.
  - **`index.html`:** a slim gold **`#trophy-bar`** on the menu (stacked under the challenges bar, shows
    "N/9 🎽"), and a **`#trophy-modal`** with the records strip, the uniform-cabinet grid, and the badge
    grid. All themed gold to sit apart from the green XP bar and amber challenges bar.

  Verified live via DOM/JS with a seeded save (3 uniforms owned, level 5, 12 games, 1 title, 620 coins, an
  A draft grade): the records tiles read 1 / Lv 5 PRO / 12 / 620; the cabinet marks GALAXY/GOLD RUSH/FIREBALL
  as ✓ Earned and the other six locked with correct hints (daily day, Pro Shop price, Max Bowl); all 10
  badges resolve correctly (6 unlocked, 4 locked with their requirement); the three menu bars stack with no
  overlap; desktop + 375px phone both clean; no console errors.

And **v1.37** (cache-buster `?v=54`, shipped 2026-08-15) — 🌱 **PLAYER GROWTH** (the 4th &
last Round-3 pick). Your drafted players now get **better the more you play** — each one earns a little
growth XP after every game and climbs toward his **potential**, so your rookies slowly become stars. It's
all built into the existing MY TEAM system (`src/draft.js`):
  - **The math.** Every player gets two new fields — `pot` (his ceiling) and `xp` (progress to the next
    +1). `growthCap(ovr)` gives lower-rated guys the most upside; `growNeed(ovr)` makes early +1s cheap and
    later ones dear. `addGrowth(win)` (called once at the final whistle) hands every starter `12` XP (`+6`
    on a win) and bumps his `ovr` each time `xp` fills, **stopping at `pot`**. Since the team boost is the
    average `ovr` (already capped at +8%), growth can't run away. Old saves get `pot`/`xp` back-filled on
    load (no NaN); a grown player's **salary is left alone** (your homegrown guys stay cheap — no cap
    surprises).
  - **Seeing it.** The 📋 ROSTER tab now shows a green **growth bar** + "▲ N potential" (or "MAXED ⭐") under
    each player; players who leveled up wear a **"▲+N"** badge and a **"🌱 N players grew"** banner sits up
    top — both clear once you've looked. A little **🌱 sprout** rides the TEAM menu button whenever there's
    unseen growth. The DRAFT/TRADE tabs are untouched (growth is roster-only).
  - **Hooks.** Two guarded one-liners in `main.js`: `TDDraft.addGrowth(win)` in `endGame`, and
    `TDDraft.onMenu()` in `showMenu` for the badge. `index.html` gained the sprout badge + growth CSS.

  Verified live via DOM/JS: from a 65-overall team, 8 winning games grew it to 67 (boost +1%→+1.4%); each
  player accrued XP and leveled toward — never past — his potential; blasting 60 games maxed all 8 exactly
  at their `pot` (0 over-cap, all show "MAXED ⭐", team capped at 74, +3%); the ROSTER tab shows bars /
  potential / "▲+N" badges / the "8 players grew" banner, the TEAM sprout shows then clears after viewing,
  the DRAFT tab has zero growth bars, and a real game starts clean; no console errors.

And **v1.38** (cache-buster `?v=55`, shipped 2026-08-15) — 😈 **RIVAL NEMESIS** (the first
Round-4 pick). One team in the league is your **arch-rival**, and the game keeps a running **head-to-head**
with them — your wins, their wins, current streak, who won last, and a 🔥 rivalry-heat meter — plus a
trash-talk line that fits the feud. Challenge them for a tougher-than-normal **grudge match**; beat them for
**+15 bonus coins** and bragging rights. How it's built:
  - **New `src/nemesis.js` / `window.TDNemesis`.** Owns the feud (persisted in `tdr-nemesis`), the modal, and
    the taunts. It leans on main.js's tiny `window.TDGame` bridge for team colours + to start the match, so
    it never touches Phaser. A rival is auto-assigned (a random real NFL team) the first time you hit the
    menu. `recordResult(win)` updates the record/streak/heat and stashes a `justPlayed` result; `onMenu()`
    pops the modal once after a grudge match with a 🏆/😱 headline.
  - **`src/main.js`:** a `startRivalGame(oppAbbr)` added to the `TDGame` bridge; `beginGame` gained an
    `isRival` arg → sets `G.rivalGame`, a **+6% opponent buff** (a notch below Maxwell's +10%), and pulls the
    intro line from `TDNemesis.introLine()`; `endGame` records the result + pays the win bonus; one
    `ensure()/onMenu()` line in `showMenu`. Existing 3-arg `beginGame` callers are unaffected (isRival falsy).
  - **`index.html`:** a 😈 RIVAL button in the CHALLENGE & WEATHER row (shows the rival's abbr, glows red for
    revenge) + a `#nemesis-modal` (rival badge, big record, streak, heat meter, taunt, CHALLENGE button) + CSS.

  Verified live via DOM/JS: a rival auto-picks (CHI/Bears); the modal renders record/streak/taunt/heat; wins
  & losses flip the streak sign, swap the taunt + intro line, grow the heat bar, and toggle the button
  ("CHALLENGE"↔"GET REVENGE") + the red revenge glow; the CHALLENGE button starts a grudge match
  (`G.rivalGame` true, opp = the rival, +6% buff) and closes the modal; after a win the modal auto-pops
  "🏆 YOU BEAT BEARS!" with the updated 4–1 record and clears `justPlayed`; a normal Quick Game is unaffected
  (rival/boss both false); the 3-button challenge row + modal are clean on desktop and a 375px phone; no errors.

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
- **v1.28 — 🥁 "Bum bum bum" + 🏈 the kicker can be tackled** (this iteration — `src/sound.js`, `src/kick.js`,
  `src/main.js`):
  - 🥁 **The "bum bum bum".** A new sting `STINGS.stuff` (three low descending square-wave notes, `[48,46,43]`)
    in `sound.js`. `resolveTwoPoint`'s fail branch now plays `TDSound.sting('stuff')` instead of `'lose'`, so
    getting **stuffed on a two-point try** lands with a dramatic thud. (A blocked kick plays it too.)
  - 🏈 **Block the kick / tackle the kicker.** The kick mini-game (`kick.js`) gained a **rusher** who charges the
    ball while you AIM/POWER: `K.rush` climbs `delta / K.rushMs` each frame, a sprite (`k_rusher`, drawn in the
    OPPONENT's colors from `window.OPP`) slides `RUSH_START → RUSH_END`, and at `rush >= 1` `getBlocked()` fires —
    ball pops loose, "TACKLED! LOST THE BALL", `judge()` returns `'blocked'`. When close, the hint flips to a red
    "🏃 KICK — HURRY!". `main.js` passes `rushMs: diff().kickRush` (easy 4200 / med 3400 / hard 2800) into
    `startKick` + `startExtraPoint`, exposes `window.OPP`, and `onKickDone` handles `outcome==='blocked'` (no
    points, ball to the other team, banner "KICK/PUNT BLOCKED — LOST IT"). The rusher art is rebuilt each `enter`
    so it always matches the current opponent. Verified: block → 0 pts + opponent ball; a quick kick is never
    falsely blocked (rush ~0.07); `rushMs` follows difficulty; visuals (charging rusher, HURRY hint, block) all
    render; no console errors.
- **v1.29 — 🌦 Dynamic weather EFFECTS on gameplay** (this iteration — `src/weather.js`, `src/main.js`,
  `src/kick.js`, `index.html` CSS). Weather used to be pure atmosphere (only slippery-ball fumbles); now each
  kind bites:
  - `weather.js` — `KINDS`/`PREFS` gained 🌬️ `wind`, 🥵 `hot`, 🥶 `blizzard`. `INFO[kind]` now carries `catch`
    (catch/pass-completion mult) and `fg` (field-goal make mult) alongside `fumble`. Signatures: night catch
    0.82; rain fg 0.75 (+fumble 1.5); wind catch 0.80/fg 0.85; snow catch 0.88 (+fumble 1.7); **hot** catch 0.88;
    **blizzard** catch 0.72/fg 0.78/fumble 2.0. New exports `catchMult()` + `fgMult()`. `forGame` AUTO weights:
    clear 34 / night 18 / rain 14 / wind 12 / snow 10 / hot 7 / blizzard 5. `say` lines tell the kid what to expect.
  - `main.js` — the player's catch (`resolvePass`) and the CPU's (`resolveRedPass`) multiply their catch chance by
    `TDWeather.catchMult()`; a new `wxIncompleteMsg()` gives weather-flavored incompletions ("THE WIND GOT IT!").
  - `kick.js` — `doKick` rolls `Math.random() > TDWeather.fgMult()` ONCE on a `good` kick to push it `wide`
    (weather), stored in new `K.lockedResult` so `judge()` can't waver between the flight and the final call;
    the miss banner names the culprit ("NO GOOD — RAIN!"). Guarded by `window.TDWeather` so the standalone
    `kick.html` is unaffected.
  - `index.html` — new `#weather-fx` overlays for `wx-wind` (racing streaks), `wx-hot` (warm shimmer), `wx-blizzard`
    (cold vignette + heavy snow), all added to the reduced-motion opt-out.
  - Verified end-to-end: all 7 `catch`/`fg`/`fumble` multipliers correct; a controlled FG batch blew wide at
    ~`1-fgMult` (rain 19/80, blizzard 16/80, clear 0/80); the three new overlays + announcer lines render; no errors.
- **v1.30 — 🛡 Defense simplified: a tap-to-progress mini-map** (this iteration — `src/main.js` `DefenseSim` +
  `#defense-sim` overlay & CSS in `index.html`). Single-player defense no longer chases a ball carrier:
  - **How it plays** — when the opponent gets the ball (`startCpuDrive`, gated `if (!G.twoPlayer)`), a DOM overlay
    shows a small field map (their end zone ↔ 🛡 yours, a ball marker + first-down line), the down & distance, a
    play-by-play line, and a big TAP button. Each tap runs one play via `DefenseSim.play()` (run/pass outcome from
    difficulty × YOUR `TDDraft.teamOverall().def` × weather `catchMult`/`fumbleMult`), `apply()` moves the ball &
    updates downs, and the drive ends on a score / punt / turnover / stop-on-downs. State is a new `'dsim'`
    (idle in the update loop; keyboard `space`/`1` also advance). Endings are **tap-driven** (`endDrive` sets
    `G.dsimEnding`/`G.dsimPending`; the next tap calls the SAME `cpuDriveEnd()` the live defense used, so scoring,
    the 6/7/8 TD try, safeties and the hand-back are unchanged). Clock/quarter boundaries mirror `defenseNextPlay`
    (`tickPeriodAtBoundary` each tap → qbreak resumes the sim, halftime/gameover exit).
  - **2-player is untouched** — `startCpuDrive` still calls the old live `setupDefensePlay()` when `G.twoPlayer`, so
    Player 2 keeps running the red offense on their possession. The old live-D functions (`updateDefensePlay`,
    `updateRedTeam`, `redPlayEnd`, `pickMyDefender`, `startPickSix`…) stay for that path.
  - ⚠️ Gotcha fixed in testing: `DefenseSim` first used `rint()` (a draft.js helper not in main.js) →
    `ReferenceError`; switched to `Phaser.Math.Between()`. `DefenseSim` is exported on `window.__td` for testing.
  - Verified: 400 frozen-clock drives ended punt 60% / TO 19% / FG 14% / TD 7% with consistent oppScore deltas
    (3/6/7/8), avg ~7 taps, no timeouts/errors; the mini-map DOM (down, yds-to-goal, ball %, first-down line,
    play-by-play) updates; 2-player still enters live `'dpresnap'`; the overlay renders correctly.
- **v1.31 — 🛍 Shop upgrade: 4 new gear items + 3 buyable uniforms** (this iteration — `src/shop.js`,
  `src/main.js`, `src/kick.js`, `index.html`). The shop went 6 → 10 gear items, each wired to a real mechanic
  (and, on purpose, to a recent feature):
  - 🎯 **CANNON ARM** (`arm`, `armAccuracy()` = `.05×lvl`) — `main.js` `resolvePass` multiplies the contested-pass
    INT chance by `(1 - armAccuracy())` (L10 = half the picks).
  - 🧥 **ALL-WEATHER GEAR** (`allwx`, `weatherResist()` = `.08×lvl`, 0..0.8) — blends a weather multiplier back
    toward 1.0: `main.js` catch (`wxCatch += (1-wxCatch)*resist`) and `kick.js` FG (`fg += (1-fg)*resist`). Softens
    the v1.29 penalties.
  - 🦵 **GOLDEN TOE** (`toe`, `toeFactor()` = `.06×lvl`, 0..0.6) — `kick.js` `enter()` slows `aimSpeed` (×`1-toe*.6`),
    raises `rushMs` (×`1+toe*1.2`, more time vs the v1.28 rusher) and lowers `powerToReach` (×`1-toe*.25`).
  - 🖐 **BALL HAWK** (`hawk`, `hawkBoost()` = `.02×lvl`, 0..0.2) — `DefenseSim.play()` adds it to the INT chance and
    half of it to the fumble chance (more v1.30 takeaways).
  - 🎽 **STYLES shelf** — new `#shop-uniforms` list + `SHOP_UNIS`/`buyUniform` in shop.js sells 3 uniforms with a
    `price` (FIREBALL 120 / AQUA STORM 160 / VOID STAR 240); buying spends coins, adds to `owned`, and jumps the
    team menu to the new look. New perks exported on `TDShop`.
  - 🛟 Save-compat: after `load('gear', …)`, `ITEMS.forEach(it => gear[it.id] ??= 0)` so old saves get the new
    item levels (no `undefined → NaN`). Verified end-to-end (see the sync-status note above); no errors.
- **v1.32 — 🏟 A more engaging draft board** (this iteration — `src/draft.js` + `dr-grade`/`dr-top` CSS). Three
  hooks added to the DRAFT tab:
  - 🔥 **TOP PROSPECT** — `draftHTML` finds the highest-ceiling guy on the board (`scouted ? ovr : hi`) and gives
    that row a gold badge + border, so there's always a "grab him before a CPU does!" target.
  - 💎 **Boom/bust reveals** — `draftPick` tags each pick (💎 STEAL ≥90 / 🌟 STUD ≥82 / 🔥 BIG UPGRADE Δ≥6 /
    ⬆ UPGRADE / 👍 DEPTH) in the log + the celebrate label, and stores `p._delta` for grading.
  - 🏅 **DRAFT GRADE** — `gradeDraft()` (called once when the draft finishes in `advanceDraft`) scores the class
    `avgOvr + ΣupgradeΔ×1.4 + traits×4` → A+/A/B/C/D, pays a coin **bonus** (A+ 100 … C 10), and tracks a
    personal best in `tdr-draftbest` (🏆 NEW BEST when beaten). The recap shows the big letter + a scouting report.
  - Verified: a strong class graded **A+** (+100🪙 awarded once, NEW BEST stored `A+`), reveal tags in the log, the
    TOP PROSPECT badge present (exactly one), grade recap renders; no errors.

## 🗂 File map (who does what)

| File | Job |
|------|-----|
| `index.html` | Page shell, all CSS, every HTML overlay/button, and the script load order (bump `?v=N` on every ship). |
| `src/main.js` | The Phaser game: field, players, plays, kickoffs, HUD, replay, team menu. Defense = a tap-to-progress mini-map (`DefenseSim`, v1.30) in 1-player; live defense kept for 2-player. |
| `src/kick.js` | The field-goal/punt/extra-point kick mini-game — now with a 🏈 **rusher who can block the kick / tackle the kicker** (v1.28, reads `rushMs` + `window.OPP`). **Loads before main.js** (main uses `KickGame`). |
| `src/sound.js` | Live chiptune soundtrack (oscillators) + stings (`td`/`win`/`lose`/🥁`stuff`). API: `window.TDSound`. |
| `src/shop.js` | Coins, Pro Shop (**10 gear items** + a 🎽 STYLES uniform shelf, v1.31), Daily Rewards, the ✨ coin celebration. API: `window.TDShop` (perks incl. `armAccuracy`/`weatherResist`/`toeFactor`/`hawkBoost`; + `window.TDMenu` in main.js). |
| `src/progress.js` | 📈 Player progression: XP, team level, titles, the menu level bar, the capped strength boost. API: `window.TDProgress`. |
| `src/weather.js` | 🌦 Weather & night games: 7 kinds (clear/night/rain/🌬️wind/snow/🥵hot/🥶blizzard), each with **gameplay effects** — `catchMult`/`fgMult`/`fumbleMult` (v1.29) — plus the over-field overlay and menu picker. API: `window.TDWeather`. |
| `src/season.js` | 🏆 Season mode: 2-division league (📅 NFL-style home-and-away divisional schedule, v1.23), standings, playoffs, Max Bowl, the season screen. API: `window.TDSeason` (talks to `window.TDGame` in main.js). |
| `src/draft.js` | 🏟 MY TEAM: your roster (💵 salaries + payroll/cap, v1.25), the NFL-style snake draft (📅 real Draft Day + 🔀 on-the-clock pick trades, v1.25), scouting & trades (💰 rating-priced, v1.24), and 📣 rival trade requests (v1.25); 🔥 TOP PROSPECT hype + 💎 boom/bust pick reveals + a 🏅 DRAFT GRADE recap with a coin bonus & personal best (v1.32, `tdr-draftbest`). API: `window.TDDraft` (`boost()` read by main.js; talks to `window.TDGame`, `TDShop`). |
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
`tdr-trivia` (🧠 the Football IQ Quiz — `{best, played, right, wrong}`),
`tdr-ball` (🌈 Ball Skins — `{owned, equipped}`),
`tdr-mascot` (🐯 Team Mascot — `{owned, equipped, name}`),
`tdr-house` (🎲 House Rules — `{on:[ids]}`),
`tdr-allstar` (🌟 All-Star Game — `{played, won, best, selections}`),
`tdr-awards` (🏅 Awards Night — `{tally, games, shelf, pending}`),
`tdr-rebrand` (🚚 Relocation & Rebrand — `{base, abbr, city, name, jersey, helmet}`),
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

Now there's a **Round-3 planning chart** (a fresh Artifact — engagement/retention ideas): 🎡 daily spin,
📆 daily challenges, 🏆 trophy case, 🌱 player growth, 😈 rival nemesis, 🃏 card packs. **First pick built:
🎡 the Lucky Spin = v1.33** (see its section above). The other five are still open.

**Fresh ideas for whenever Max wants more (the board's wide open):**

- 🏟 **MY TEAM follow-ups**: wire the ⭐ traits to real gameplay nudges (a 🚀 Speedster actually faster,
  🎯 Cannon Arm throws farther); show your drafted QB/RB names on the field; a yearly "draft day" tied to
  Season mode; or player growth (young picks level up as you play).
- 📅 **Season deepening**: seed the playoffs by division (division winners get a bye), or drop the 👑 Maxwell
  boss team into the league as the team to beat for the Max Bowl.
- 🎩 **More trick plays**: a second unlock (double-pass / hook-and-lateral), or earn extra trick uses.
- 🎮 **Two-player extras**: let Player 2 throw (a second action button) so the red offense can pass too.
