---
paths:
  - "frontend/**"
  - "released/**"
---

# Frontend Game Logic

## Game Modes

1. **Normal (Thường)** — Turn-based, each player answers 10 questions privately. Scores hidden until all complete.
2. **Split (Đối kháng)** — 2-player race on split screen. Round-robin assignment: Q0→P0, Q1→P1, Q2→P0…
3. **AI (AI Tạo câu)** — Calls Anthropic API from browser to generate 10 custom questions from a user-provided topic.

## Screen Flow

```
homeScreen → turnScreen (intro) → gameScreen  (Normal)
           → raceScreen                        (Split)
           → revealScreen (scores hidden until all done)
           → resultScreen (rankings + per-player review)
```

`showScreen(id)` hides all `.screen` elements, then sets `display:flex` + class `on` on the target and calls `window.scrollTo(0,0)`.

## Key State Objects

```javascript
// Global
gameMode, selCats, pCount, players

// Per-player (Normal mode)
scores[], corrects[], playerQs[], playerHistory[]

// Normal mode active question
curP, qs, curQ, tmr, tLeft

// Split/race mode
race = { qs, curQ, curP, scores, corrects, tLeft, tmr, answered }
```

## Scoring

```javascript
// Correct: 50 base + 3 pts per second remaining. Max = 95 pts/question.
if (ok) { scores[curP] += 50 + tLeft * 3; }
```

## Key Functions

| Function | Purpose |
|---|---|
| `buildHome()` | Render category grid and player inputs |
| `handleStart()` | Validate inputs, build player list, route to mode |
| `startAIMode()` | Call Anthropic API, parse JSON, build questions |
| `buildAllPlayerQs(n)` | Shuffle pool, slice 10 per player (no overlap if pool ≥40) |
| `loadQ()` / `loadRaceQ()` | Render question and options with animations |
| `pick()` / `pickRace()` | Handle answer selection, update score/history |
| `showResult()` | Build podium, leaderboard, per-player review |
| `confetti()` | 70 animated particles on win screen |
| `beep(ok)` | Web Audio API: 880Hz ting (correct) / 200Hz buzz (wrong) |
