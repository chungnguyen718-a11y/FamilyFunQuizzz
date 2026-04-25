---
paths:
  - "frontend/**"
  - "released/**"
---

# Frontend Game Logic

## Game Modes

1. **Normal (Thường)** — Turn-based, each player answers 10 questions privately. Scores hidden until all complete.
2. **Split (Đối kháng)** — Race on split screen. Round-robin assignment: Q0→P0, Q1→P1, Q2→P0… Total questions = `n × 10` (strictly capped via `pool.slice(0, total)`).
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

// Split/race mode — single object `sp`
sp = { qs, curQ, curP, scores, corrects, tLeft, tmr, answered, maxScore }
```

## Constants

```javascript
const TIMER_MAX = 10;
const SCORE_BASE = 50;
const SCORE_PER_SEC = 3; // max per question: 50 + 10×3 = 80pts
```

## Scoring

```javascript
// Correct: SCORE_BASE + tLeft × SCORE_PER_SEC. Max = 80pts/question.
if (ok) { scores[curP] += SCORE_BASE + tLeft * SCORE_PER_SEC; }
```

## Avatars

25 avatars total — first 4 are player defaults:

```javascript
const AVATARS = ['🧔','👩','👦','👧','🧑‍🚀','🧙','🦊','🐼','🤖','👾',
                 '🦸','🧸','🐯','🦄','🐸','🐉','🧜','🐧','🦁','🐺',
                 '🐙','🦖','👻','🎃','🦋'];
```

## Key Functions

| Function | Purpose |
|---|---|
| `buildHome()` | Fetch categories from API, render category grid and player inputs |
| `toggleCat(el)` | Toggle a category on/off, update `selCats[]` |
| `toggleAllCats()` | Toggle all categories on/off at once |
| `updateSelectAllBtn()` | Sync "Chọn tất / Bỏ chọn" button state and color |
| `handleStart()` | Validate inputs, build player list, route to mode |
| `startNormalMode()` | Fetch pool, slice 10 questions per player, call `showTurn()` |
| `startSplitMode()` | Fetch pool, `slice(0, n×10)`, build `sp` object, start race |
| `startAIMode()` | Call Anthropic API, parse JSON, build questions |
| `loadQ()` / `loadRaceQ()` | Render question and options with animations |
| `pick()` / `pickRace()` | Handle answer selection, update score/history |
| `showResult()` | Build podium, leaderboard, per-player review |
| `confetti()` | 70 animated particles on win screen |
| `beep(ok)` | Web Audio API: 880Hz ting (correct) / 200Hz buzz (wrong) |
