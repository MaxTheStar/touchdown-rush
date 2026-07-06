# 🏈 Touchdown Rush

An arcade American football game with **big heads and small bodies** — real football,
chibi style. Built with [Phaser 3](https://phaser.io), the open-source 2D game engine.

**Made by Max ([@MaxTheStar](https://github.com/MaxTheStar))** — my first game!

## How to play

```bash
# from this folder:
python3 -m http.server 8000
# then open http://localhost:8000 in your browser
```

| Key | Action |
|-----|--------|
| SPACE | Hike the ball (start the play) |
| ← → ↑ ↓ | Run with the ball carrier |
| 1 / 2 / 3 | Throw to the receiver wearing that number (QB, behind the line) |

7-on-7. You're on offense (blue, **MAX FC**). Get 10 yards in 4 downs for a first
down; reach the endzone for a **touchdown = 7 points**.

**Passing isn't automatic:** receivers can drop the ball or miss it, and if you
throw into coverage the defense can **intercept** it — that's a turnover, so your
drive restarts. The key players are labeled: **QB**, receivers **1 / 2 / 3**, and
the two **RUSH** defenders coming after your quarterback.

## Roadmap

- [x] **v0.1 — The field.** Scrolling field, yard lines, chibi runner, touchdowns.
- [x] **v0.2 — Real football.** 7v7, the snap, run or pass, 7 AI defenders who rush,
      cover, and tackle, 4 downs to gain 10 yards, first downs, turnover on downs.
- [ ] **v0.3 — Better defense & routes.** Smarter coverage, more pass routes, a running back.
- [ ] **v0.4 — Kicking game.** Field goals, punts, kickoffs.
- [ ] **v0.5 — Two-player.** Player 2 controls the defense (WASD vs arrows,
      works with one keyboard or two).
- [ ] **v1.0 — Ship it!** Sounds, polish, and live on GitHub Pages.
- [ ] **Someday:** field goals, punts, kickoffs, playbooks, seasons,
      online two-computer mode.

## The team

- **Max** — game designer, programmer, head coach
- **Dad** — assistant coach, QA department
- **Claude** — offensive line (does the heavy lifting so Max can run)
