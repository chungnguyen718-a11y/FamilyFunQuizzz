---
paths:
  - "frontend/**"
  - "released/**"
---

# Frontend Styling Conventions

Full CSS patterns and component specs are in `docs/frontend-design-skill.md`. Key rules below.

## CSS Variables

```css
:root {
  --bg: #0d1117;    --card: #161b22;   --card2: #21262d;  --card3: #30363d;
  --text: #f0f6fc;  --muted: #8b949e;
  --c1: #ff7b2c;    /* Orange — player 1, primary accent */
  --c2: #2ec4b6;    /* Teal — player 2 */
  --c3: #818cf8;    /* Purple — player 3 */
  --ok: #22c55e;    --no: #ef4444;     --warn: #f59e0b;
}
```

## Typography & Layout

- Headings: `Baloo 2` (playful, supports Vietnamese). Body: `Nunito`.
- Max-width: **420px** for home/normal screens, **480px** for race/split.
- Card padding: `1.1rem`. Gap between cards: `0.75rem`. Border radius: `12px–16px`.
- Use `rem` units, not `px`, for scalable sizing.

## Animations

```css
@keyframes fadeUp { from { opacity:0; transform:translateY(14px) } to { opacity:1; transform:none } }
@keyframes pop    { 0%{ transform:scale(.8); opacity:0 } 60%{ transform:scale(1.1) } 100%{ transform:scale(1); opacity:1 } }
```

- Stagger list entries: `animation-delay: ${i * 0.05}s`
- Timer bar: `transition: width 1s linear, background .4s`
- Do **not** animate `display` — use opacity/visibility instead.

## Screens

- All `.screen` elements start as `display:none`.
- `showScreen(id)` is the only way to switch screens — do not manipulate `.screen` display directly.
- Each screen container gets `fadeUp` on its main inner element.

## Common Mistakes to Avoid

- Don't set `display:flex` on `.screen` by default.
- Don't forget `window.scrollTo(0,0)` in `showScreen`.
- Don't use absolute pixel sizes — use `rem`.
