# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Vietnamese family quiz webapp — multiplayer trivia game for 2-4 players on mobile/tablet. Mobile-first, dark theme, single-HTML frontend with no build step.

## Structure

```
FamilyFunQuizzz/
├── frontend/index.html      # Active frontend (fetches questions from server/)
├── server/index.js          # Express API server (Node 18+, ESM)
├── data/
│   ├── categories.json
│   └── questions/           # 12 JSON files, ~40 questions each
├── docs/                    # Design reference docs
└── released/                # Legacy standalone snapshot (no server needed)
```

## Running the App

```bash
cd server && npm start        # API server at http://localhost:3000
# Then open frontend/index.html in browser (via live server or file://)

cd server && npm run dev      # with --watch for auto-reload
```

Standalone (no server): open `released/family-quiz-v4.html` directly.

## Architecture

Two parallel implementations exist:

| | `frontend/index.html` | `released/family-quiz-v4.html` |
|---|---|---|
| Questions | Fetched from `server/` via REST | Embedded inline in `ALL_Q` object |
| AI mode | Not currently implemented | Same |
| Deployment | Requires `server/` running | Single file, no server |

**Active development target is `frontend/index.html` + `server/`.**

### Backend (`server/index.js`)

Express server (ESM, Node 18+). Questions loaded from `data/` on first request, cached in-memory for process lifetime — **restart server after editing JSON files**.

```
GET  /api/categories               → data/categories.json
GET  /api/questions/:category      → data/questions/<category>.json
GET  /api/questions/:category/random?count=10&difficulty=1,2
POST /api/questions/batch          → body: { categories[], countPerCategory }
GET  /api/stats
GET  /api/health
```

All responses: `{ success: bool, data: ... }`. Answer index `a` is included in responses — scoring is client-side (intentional for this family demo).

**Known limitation:** Answer index `a` is exposed in every API response. Anyone with DevTools can see correct answers. Acceptable for family demo; would need server-side scoring for production.

### Question Data Format

`data/questions/<category>.json`:
```json
{
  "category": "history",
  "name": "Lịch sử",
  "emoji": "🏛️",
  "questions": [
    { "id": "history_001", "q": "...", "o": ["A","B","C","D"], "a": 0, "difficulty": 1 }
  ]
}
```
12 categories (~40 questions each): `tech`, `football`, `anime`, `science`, `geography`, `math`, `history`, `literature`, `lifestyle`, `world`, `space`, `music`.

### Frontend Game Modes

1. **Normal (Thường)** — Turn-based. Each player answers 10 private questions. Scores hidden until all complete. `turnScreen` intro shown before each player.
2. **Split (Đối kháng)** — Round-robin race. All players see same screen. Questions assigned Q0→P0, Q1→P1, Q2→P0… Each player answers `total/n = 10` questions total.

> AI mode (Anthropic API) is documented in `.claude/rules/ai-mode.md` but **not implemented** in `frontend/index.html`. It exists only in `released/family-quiz-v4.html`.

### Screen Flow

```
homeScreen
  → (normal) turnScreen (intro per player) → gameScreen → (repeat) → revealScreen → resultScreen
  → (split)  raceScreen → revealScreen → resultScreen
```

`showScreen(id)` is the only way to switch screens — hides all `.screen` elements, sets `display:flex` + class `on` on target, calls `window.scrollTo(0,0)`.

### Key State Objects

```javascript
// Shared global
gameMode, selCats, pCount, players[]

// Normal mode
scores[], corrects[]        // per-player totals
curP                        // current player index
qs[]                        // current player's 10 questions
curQ                        // current question index (0–9)
tmr, tLeft, done, dots[]    // timer state + progress dots
playerQs[][]                // playerQs[playerIdx][0..9] — pre-sliced before game starts
playerHistory[][]           // playerHistory[playerIdx][{q, chosen, correct, timeLeft}]

// Split mode (variable name: sp, overwritten by startSplitMode())
sp = {
  qs[],        // flat array of all questions shuffled
  curQ,        // global question index
  curP,        // current player index (round-robin)
  scores[],    // same reference as global scores[]
  corrects[],  // same reference as global corrects[]
  tLeft,       // seconds remaining
  tmr,         // setInterval handle
  answered,    // boolean — whether current question has been answered
  maxScore     // = 10 * (50 + 10*3) = 800, used for progress bar %
}
```

### Scoring

```javascript
// Correct answer: 50 base + 3 points per second remaining
// Max per question: 50 + 10×3 = 80 pts (NOT 95)
if (ok) { scores[curP] += SCORE_BASE + tLeft * SCORE_PER_SEC; }
// SCORE_BASE = 50, SCORE_PER_SEC = 3, TIMER_MAX = 10
```

### Question Distribution

**Normal mode:** `fetchBatchQuestions(selCats, players.length * 10)` → shuffle pool → slice by player index (P0: 0–9, P1: 10–19…). If pool has fewer than `players.length * 10` questions, the last player(s) get fewer than 10 questions — `loadQ()` calls `endPlayer()` early.

**Split mode:** Same batch fetch → shuffle → round-robin assignment via `sp.curP = (sp.curP + 1) % players.length`.

### Key Functions

| Function | Purpose |
|---|---|
| `buildHome()` | Fetch categories from API, render grid + player inputs |
| `handleStart()` | Validate inputs, build player list, route to mode |
| `startNormalMode()` | Fetch questions, distribute to playerQs[], show first turnScreen |
| `startSplitMode()` | Fetch questions, init sp object, go to raceScreen |
| `loadQ()` / `loadRaceQ()` | Render question + options with animations, start timer |
| `pick()` / `pickRace()` | Handle answer selection, highlight correct/wrong, update score |
| `timeOut()` / `raceTimeOut()` | Handle timer expiry, highlight correct answer |
| `showResult()` | Build podium (top 3 only), leaderboard, per-player history review |
| `confetti()` | 70 animated DOM particles, auto-clears after 6s |
| `beep(ok)` | Web Audio API via global `audioCtx` (reused, not recreated per call) |

## Gameplay Logic (End-to-End)

### 1. Setup (homeScreen)

Người chơi cấu hình trận đấu trên một màn hình duy nhất:
- Chọn **chế độ**: Normal (lần lượt) hoặc Split (đối kháng)
- Chọn **chủ đề** (1 hoặc nhiều trong 12 category) — chọn nhiều category = pool câu hỏi lớn hơn
- Chọn **số người** (2–4) và nhập tên + avatar cho từng người
- Nhấn **Bắt đầu** → `handleStart()` validate + fetch câu hỏi từ server, rồi phân nhánh theo mode

### 2. Normal Mode — Chơi lần lượt

```
[Setup] → fetch toàn bộ pool 1 lần → phân chia sẵn câu hỏi theo player
        → lặp qua từng player: turnScreen → gameScreen → (player tiếp theo)
        → revealScreen → resultScreen
```

**Fetch:** `POST /api/questions/batch` với `countPerCategory = players.length * 10`. Server trả pool đã shuffle. Frontend shuffle lại, rồi slice: P0 lấy index 0–9, P1 lấy 10–19, v.v. → mỗi người có 10 câu riêng, không trùng nhau (nếu pool đủ).

**turnScreen:** Màn hình giới thiệu lượt chơi. Hiện tên + avatar người chơi, thông báo điểm sẽ bị ẩn. Người khác có thể xem nhưng không biết điểm. Nhấn "Tôi sẵn sàng!" để vào `gameScreen`.

**gameScreen:** Hiển thị từng câu hỏi với:
- Progress badge (1/10), timer bar đếm ngược 10 giây (xanh → vàng → đỏ)
- Câu hỏi + 4 lựa chọn (A/B/C/D)
- Score strip ở dưới (điểm người khác bị ẩn với icon 🔒)
- 10 progress dots phản ánh đúng/sai/current

**Khi trả lời (`pick()`):** Disable tất cả nút, highlight đáp án đúng (xanh) và sai (đỏ), flash toàn màn hình, phát beep. Lưu vào `playerHistory`. Sau 1.2s chuyển câu tiếp.

**Khi hết giờ (`timeOut()`):** Highlight đáp án đúng, không cộng điểm, sau 1.4s chuyển câu tiếp.

**Hết 10 câu (`endPlayer()`):** Nếu còn player tiếp → `turnScreen` người tiếp. Nếu tất cả xong → `revealScreen`.

**revealScreen:** Màn hình "Tất cả đã xong!" — hiện avatar từng người nhưng vẫn ẩn điểm. Nhấn "Xem kết quả!" mới reveal.

### 3. Split Mode — Đối kháng

```
[Setup] → fetch toàn bộ pool 1 lần → tất cả chơi trên cùng 1 màn hình
        → round-robin: Q0→P0, Q1→P1, Q2→P0, ... → revealScreen → resultScreen
```

**raceScreen:** Một màn hình duy nhất cho tất cả người chơi:
- Race track với progress bar per-player (% điểm / maxScore)
- Chỉ 1 người trả lời mỗi câu (hiện rõ "Bố trả lời"), người còn lại xem
- Sau mỗi câu, `curP = (curP + 1) % n` → sang người tiếp
- `maxScore = 10 × 80 = 800` dùng để tính % tiến trình trên thanh race

**Khi đúng (`pickRace()`):** Cộng điểm, hiện `+Xđ` popup nổi lên từ nút player pill, cập nhật race bar với animation spring.

**Khi hết câu (`endRace()`):** Copy `sp.scores` → global `scores[]`, chuyển sang `revealScreen`.

### 4. Kết quả (resultScreen)

- **Podium:** Top 3 theo điểm, thứ tự hiển thị: hạng 2 (trái) – hạng 1 (giữa, cao nhất) – hạng 3 (phải). Player thứ 4 chỉ xuất hiện trong leaderboard, không có podium block.
- **Leaderboard:** Tất cả player xếp theo điểm giảm dần, hiển thị `X/10 câu đúng · Yđ`
- **Chi tiết từng người:** Từng câu hỏi với badge ✓/✗/⏱, thời gian phản hồi, đáp án sai đã chọn vs đáp án đúng
- **Confetti:** 70 DOM particle rơi, tự clear sau 6s
- Nút "Chơi lại" giữ nguyên players + settings, fetch câu hỏi mới. Nút "Trang chủ" về homeScreen.

### 5. Công thức điểm

```
Đúng:  score += 50 + tLeft × 3     (max 80đ khi trả lời ngay lập tức, min 50đ khi còn 0s)
Sai:   +0đ
Timeout: +0đ
```

### 6. Feedback hệ thống (mỗi câu trả lời)

| Tín hiệu | Đúng | Sai / Timeout |
|---|---|---|
| Màn hình flash | Xanh nhạt | Đỏ nhạt |
| Beep âm thanh | 880Hz sine (ting) | 200Hz sawtooth (buzz) |
| Button | Border xanh + ✓ | Border đỏ + ✗, đáp án đúng highlight xanh |
| Race bar | Nhảy lên với spring animation | Không thay đổi |

## Styling Conventions

- CSS variables: `--bg #0d1117`, `--card`, `--card2`, `--card3`, `--text`, `--muted`
- Player colors: `--c1` orange `#ff7b2c`, `--c2` teal `#2ec4b6`, `--c3` purple `#818cf8`
- Feedback: `--ok` green (correct), `--no` red (wrong), `--warn` amber (timer)
- Fonts: `Baloo 2` (headings), `Nunito` (body) — both support Vietnamese
- Max-width: 420px (home/normal), 480px (race/split)
- Screens: `display:none` by default; `showScreen(id)` sets `display:flex` + class `on`
- Animations: `fadeUp`, `pop`, `slideIn` with staggered `animation-delay: ${i * 0.05}s`

## Adding Questions

Edit the relevant `data/questions/<category>.json` and restart the server. For the standalone `released/` file, edit the inline `ALL_Q` object directly.

## Detailed Rules

Context-specific guidance is in `.claude/rules/`:

| Rule file | Covers |
|---|---|
| [`project-overview.md`](.claude/rules/project-overview.md) | Two implementations, how to run |
| [`backend-api.md`](.claude/rules/backend-api.md) | Endpoints, question schema |
| [`frontend-game-logic.md`](.claude/rules/frontend-game-logic.md) | Game modes, screen flow, state, key functions |
| [`frontend-styling.md`](.claude/rules/frontend-styling.md) | CSS variables, fonts, animations |
| [`ai-mode.md`](.claude/rules/ai-mode.md) | AI mode details (legacy, only in released/) |
