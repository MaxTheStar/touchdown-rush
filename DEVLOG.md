# 🏈 Touchdown Fun — Dev Log (where we left off)

A quick "control room" note for whoever opens this repo next (probably future
Max, or Claude helping Max). The player-facing story lives in the README; this
file is the *developer* view: current state, how the pieces fit, and what's next.

---

## 📍 Where we are

- **Version:** v1.46 — cache-buster is `?v=63` in `index.html`.
- **Name:** the game is now **Touchdown Fun** (renamed from "Touchdown Rush" in v1.13). Only the
  *player-facing name* changed. On purpose we did NOT rename the repo, the folder, the
  `maxthestar.github.io/touchdown-rush` web address, the `tdr-` save keys, or the Abacus world-counter
  namespace `touchdown-rush-maxthestar` — changing those would break the live link and wipe everyone's
  saved coins/uniforms/streak and the worldwide counters. The name and the plumbing are allowed to differ.
- **Live site:** https://maxthestar.github.io/touchdown-rush/ (GitHub Pages, served from `main`).
- **Last updated:** 2026-08-17.
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

## ✅ Sync status — v1.11–v1.52 are all LIVE (v1.25–v1.29 pushed 2026-08-14; v1.30–v1.38 pushed 2026-08-15; v1.39–v1.40 pushed 2026-08-17; v1.41–v1.47 pushed 2026-08-18; v1.48–v1.52 pushed 2026-08-19)

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
