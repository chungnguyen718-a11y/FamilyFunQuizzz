---
paths:
  - "server/**"
  - "data/**"
---

# Backend API

Express server (`server/index.js`) — ESM, Node 18+. Questions are loaded from `data/` on first request and cached in memory for the process lifetime (restart server after editing JSON files).

## Endpoints

```
GET  /api/categories                           → data/categories.json
GET  /api/questions/:category                  → data/questions/<category>.json
GET  /api/questions/:category/random?count=10&difficulty=1,2
POST /api/questions/batch                      body: { categories[], countPerCategory }
GET  /api/stats
GET  /api/health
```

All responses use the envelope: `{ success: bool, data: ... }`.

The answer index `a` is included in all question responses — scoring is entirely client-side.

## Question Data Format

`data/questions/<category>.json`:
```json
{
  "category": "tech",
  "name": "Công nghệ",
  "emoji": "💻",
  "questions": [
    { "id": "tech_001", "q": "...", "o": ["A","B","C","D"], "a": 0, "difficulty": 1 }
  ]
}
```

- `a`: index of correct answer (0–3)
- `difficulty`: 1 = easy, 2 = medium, 3 = hard
- 12 categories (~40 questions each): `tech`, `football`, `anime`, `science`, `geography`, `math`, `history`, `literature`, `lifestyle`, `world`, `space`, `music`

## Adding Questions

Edit the relevant `data/questions/<category>.json` and restart the server (cache is in-process). For the standalone `released/` file, edit the inline `ALL_Q` object directly.
