---
paths:
  - "frontend/**"
  - "released/**"
---

# AI Mode (AI Tạo Câu)

Calls Anthropic API directly from the browser. Storing the API key in the frontend is acceptable for this family demo app.

## Current Implementation

- **Model**: `claude-sonnet-4-20250514`
- **Max tokens**: 1500
- **Endpoint**: `https://api.anthropic.com/v1/messages`
- **Headers**: `x-api-key`, `anthropic-version: 2023-06-01`

## Prompt

Requests 10 Vietnamese multiple-choice questions appropriate for ages 12–14:

```
Tạo 10 câu hỏi trắc nghiệm tiếng Việt về chủ đề: "${topic}".
Mỗi câu có 4 lựa chọn và 1 đáp án đúng.
Phù hợp cho gia đình 12-14 tuổi.
Trả về JSON thuần: [{"q":"...","o":["A","B","C","D"],"a":0}]
```

## Response Parsing

Strip markdown fences before parsing:
```javascript
let text = data.content[0].text.replace(/```json|```/g, '').trim();
const parsed = JSON.parse(text);
```

All 10 AI-generated questions are shared across all players (unlike Normal mode where each player gets a unique slice).
