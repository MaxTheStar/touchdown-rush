# 🏈 Touchdown Rush

An arcade American football game with **big heads and small bodies** — real football,
chibi style. Built with [Phaser 3](https://phaser.io), the open-source 2D game engine.

**Made by Max ([@MaxTheStar](https://github.com/MaxTheStar))** — my first game!

### ▶️ Play it now (any phone, tablet, or computer): **https://maxthestar.github.io/touchdown-rush/**

## How to play

```bash
# to run it on your own computer, from this folder:
python3 -m http.server 8000
# then open http://localhost:8000 in your browser
```

**🏈 Pick your team first!** The game opens on a **CHOOSE YOUR TEAM** screen — flip
through all **32 NFL teams** with ◀ ▶, see your player in that team's colors, then tap
**PLAY**. You wear your team's real colors; the computer gets a random other team.

| Key | Action |
|-----|--------|
| SPACE | Hike the ball (start the play) |
| ← → ↑ ↓ | Run with the ball carrier (and **scramble** as the QB) |
| 1 / 2 | Throw to a wide receiver |
| 3 | Throw to the running back |
| H | Hand the ball off to the running back |

**🎯 Tap-to-pass:** while you're the QB behind the line, just **tap a receiver** to throw
to him — no need to remember the numbers. You can do it on the run: **scramble** around to
dodge the rush, then tap the open guy (or take off and run it yourself).

**📱 On an iPad or phone:** no keyboard needed! Use the on-screen buttons — a D-pad to
run, and **HIKE / 1 / 2 / 3 / HAND** to make plays.

**🛡️ 2-player mode:** tap the **1P / 2P** button (top-right). In **2P**, a friend controls
one defender (the **P2** linebacker) with the top D-pad (or **W A S D** on a keyboard) and
tries to tackle you. Player 1 runs the offense as usual.

7-on-7. You're on offense. Get 10 yards in 4 downs for a first down; reach the endzone for
a **touchdown = 6 points**, then kick the **extra point** for **+1** (7 total!).

**🏆 It's a real game now — the other team scores too!** When your drive ends (a punt, a
turnover, or after you score), the **computer gets the ball** and you watch its drive play
out — the announcer calls each play, a bar shows them marching down the field, and it ends
in a **touchdown, field goal, punt, or turnover**. A **game clock** counts down through
**4 quick quarters of 2:30 each**; when time runs out, **whoever has more points WINS**.
Tied at the end? **Sudden-death overtime** — the next score wins it. The scoreboard up top
shows **both** teams (`SEA 14 — CHI 7`) and the clock (`Q2 · 1:45`). Lose or win, tap the
final screen to **play again**.

**📺 TV breaks!** When a quarter ends, the game stops for a little break: the score so far
and *a quick word from our sponsors* — every sponsor is 100% made-up and very silly
(CHIBI COLA: the official drink of BIG HEADS!). Tap to continue.

**🏈 Real NFL rules at the half:** you fielded the opening kickoff, so the **other team
gets the ball to start the second half**, and a drive can't carry across halftime — but
between Q1/Q2 and Q3/Q4 your drive **does** carry over, exactly like on TV. And a
touchdown as time expires still earns its extra point (the try is **untimed**, real rule).

**🦵 Kickoff returns:** every new drive starts with a **kickoff you return** — catch it deep,
run it back through the coverage team, and where you're tackled is where your drive starts.
Break all the way through for a **return touchdown!**

**🥅 Kicking (4th down):** on 4th down you get a choice — **① play the down**, or **② kick**.
If you're close enough it's a **FIELD GOAL** (worth **3 points**); too far and it's a **PUNT**.
Kicking flips to a behind-the-kicker view: **tap to AIM** between the posts, **tap to set
POWER**, and it flies **through the uprights**. Longer kicks are harder. Want to just practice
kicks? Open **[`kick.html`](kick.html)**.

**Passing isn't automatic:** receivers can drop the ball or miss it, and if you throw into
coverage the defense can **intercept** it — that's a turnover, so your drive restarts. A hard
tackle can also knock the ball loose (a **fumble**) — then either team can grab it.

## Roadmap

- [x] **v0.1 — The field.** Scrolling field, yard lines, chibi runner, touchdowns.
- [x] **v0.2 — Real football.** 7v7, the snap, run or pass, 7 AI defenders who rush,
      cover, and tackle, 4 downs to gain 10 yards, first downs, turnover on downs.
- [x] **v0.2.1 — Realism.** Droppable passes and interceptions; a running back
      (handoff or checkdown); an offensive line that actively blocks the pass rush.
- [x] **v0.2.2 — Play anywhere.** iPad/phone touch controls (on-screen D-pad +
      buttons) and a screen that scales to fit any device.
- [x] **v0.2.3 — Two-player (first version).** Tap 1P/2P: a friend controls one
      defender (the P2 linebacker) by touch or WASD.
- [x] **v0.2.4 — Fumbles!** A hard tackle can knock the ball loose — then either
      team can recover it. Lose it and it's a turnover.
- [x] **v0.5 — LIVE on the internet!** Playable on any device at the link above (GitHub Pages).
- [x] **v0.4 — Kicking game (part 1).** On 4th down, go for it, kick a **field goal**
      (worth 3 — a behind-the-kicker aim + power mini-game), or **punt** if you're out of range.
- [x] **v0.6 — Extra point.** A touchdown is 6, then a short kick for +1 (make it = 7).
- [x] **v0.7 — Choose your team.** Pick from all 32 NFL teams (real colors); play a random one.
- [x] **v0.8 — Kickoff returns.** Catch the kick deep and run it back for good field position.
- [x] **v0.9 — Tap-to-pass + a better field goal** (it now sails through the uprights).
- [x] **⭐ v1.0 — The other team scores!** A real opponent that gets the ball and can score,
      a game clock with **4 quarters**, sudden-death **overtime**, and a real **winner** at
      the end. When you give up the ball, you watch the computer's drive play out with
      play-by-play — touchdown, field goal, punt, or turnover.
- [x] **v1.0.1 — TV time!** Quick **2:30 quarters**, a **break screen** between quarters
      (score + a very silly made-up ad 📺), and **real NFL halftime rules**: the other team
      gets the second-half kickoff, drives don't cross the half, and the extra point is
      untimed.
- [ ] **v1.1 — Better defense & routes.** Smarter coverage, more pass routes, touchdown replays.
- [ ] **The next big one — play defense!** Instead of *watching* the computer's drive, control
      a defender and try to stop them yourself. (Then: seasons, a "Max Bowl," and drafting players.)

## The team

- **Max** — game designer, programmer, head coach
- **Dad** — assistant coach, QA department
- **Claude** — offensive line (does the heavy lifting so Max can run)
