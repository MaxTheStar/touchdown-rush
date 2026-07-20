# 🏈 Touchdown Rush — Dev Log (where we left off)

A quick "control room" note for whoever opens this repo next (probably future
Max, or Claude helping Max). The player-facing story lives in the README; this
file is the *developer* view: current state, how the pieces fit, and what's next.

---

## 📍 Where we are

- **Version:** v1.3 — cache-buster is `?v=21` in `index.html`.
- **Live site:** https://maxthestar.github.io/touchdown-rush/ (GitHub Pages, served from `main`).
- **Last updated:** 2026-07-20.

## ✅ Sync status — in sync

Local `main` and `origin/main` are in sync as of 2026-07-20. The earlier push
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

## 🗂 File map (who does what)

| File | Job |
|------|-----|
| `index.html` | Page shell, all CSS, every HTML overlay/button, and the script load order (bump `?v=N` on every ship). |
| `src/main.js` | The Phaser game: field, players, plays, defense, kickoffs, HUD, replay, team menu. |
| `src/kick.js` | The field-goal/punt/extra-point kick mini-game. **Loads before main.js** (main uses `KickGame`). |
| `src/sound.js` | Live chiptune soundtrack (oscillators). API: `window.TDSound`. |
| `src/shop.js` | Coins, Pro Shop, Daily Rewards, Premium. API: `window.TDShop` (+ `window.TDMenu` in main.js). |
| `src/stats.js` | World counters (Abacus) + review pop-up + the menu side-tracker. API: `window.TDStats`. |
| `src/ads.js` | Animated TV-break commercials. |
| `dashboard.html` | Private dev dashboard (world numbers + on-device reviews). Not linked from the game. |

Script load order matters: `stats → sound → shop → ads → kick → main`.

## 🧰 Conventions

- **Cache-buster:** bump every `?v=N` in `index.html` (and the `stats.js?v=` in `dashboard.html`)
  by 1 whenever files change, so browsers/iPads grab the new version instead of a saved copy.
- **Comments are kid-friendly on purpose** — Max reads the code.
- **localStorage keys are prefixed `tdr-`.** On `localhost` the world counters use a
  separate `-dev` namespace, so home testing never inflates the real world numbers.

## 💾 Persistence (localStorage keys)

`tdr-coins`, `tdr-gear`, `tdr-daily`, `tdr-premium`, `tdr-owned-uniforms`, `tdr-trk`,
`tdr-games`, `tdr-reviews`, `tdr-country`, `tdr-counted-player`, `tdr-counted-geo`,
`tdr-known-countries`, `tdr-review-asked`.

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

- Smarter pass routes on both offense and defense; touchdown replays on defensive stops.
- **Seasons**, a **"Max Bowl,"** and **drafting players**.
- More shop items and more daily-reward uniforms; a little coins-fly animation and a
  "cha-ching" sound when you buy or claim.
- Maybe a real shared backend someday (leaderboards, cross-device reviews).
