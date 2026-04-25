# Project Overview

Vietnamese family quiz webapp — multiplayer trivia game for 2-4 players on mobile/tablet.

## Two Parallel Implementations

| | `frontend/index.html` | `released/family-quiz-v4.html` |
|---|---|---|
| Questions | Fetched from `server/` via REST | Embedded inline in `ALL_Q` object |
| AI mode | Calls Anthropic API from browser | Same |
| Deployment | Requires `server/` running | Single file, no server |

**Active development target is `frontend/index.html` + `server/`.** The `released/` file is a legacy standalone snapshot — only touch it for hotfixes.

## How to Run

```bash
# Backend + frontend (current)
cd server && npm start        # API at http://localhost:3000
# Then open frontend/index.html in browser

cd server && npm run dev      # with --watch for auto-reload

# Legacy standalone (no server)
# Open released/family-quiz-v4.html directly in any browser
```
