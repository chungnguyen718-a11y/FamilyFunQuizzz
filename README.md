# Family Fun Quizzz

Webapp chơi Quiz cho gia đình - multiplayer trivia game tiếng Việt.

## Cấu trúc

```
FamilyFunQuizzz/
├── data/                    # Backend Data
│   ├── categories.json      # Danh sách categories
│   └── questions/           # Câu hỏi theo category
│       ├── tech.json
│       ├── football.json
│       ├── anime.json
│       └── ...
├── server/                  # Backend API
│   ├── index.js             # Express server
│   └── package.json
├── frontend/                # Frontend
│   └── index.html           # Giao diện (fetch từ backend)
└── released/               # Phiên bản cũ (standalone)
```

## Cách chạy

### 1. Start Backend Server

```bash
cd server
npm install
npm start
```

Server chạy tại: `http://localhost:3000`

### 2. Mở Frontend

Mở file `frontend/index.html` trong trình duyệt

Hoặc dùng live server:
```bash
cd frontend
npx serve .
```

## API Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|--------|
| GET | `/api/categories` | Danh sách categories |
| GET | `/api/questions/:category` | Tất cả câu hỏi của 1 category |
| GET | `/api/questions/:category/random?count=10` | Random N câu |
| POST | `/api/questions/batch` | Multi-category questions |
| GET | `/api/stats` | Thống kê question bank |

## Thêm/Sửa Câu Hỏi

Chỉ cần edit file JSON trong `data/questions/`:

```json
{
  "category": "tech",
  "name": "Công nghệ",
  "emoji": "💻",
  "questions": [
    {
      "id": "tech_001",
      "q": "Câu hỏi ở đây?",
      "o": ["A", "B", "C", "D"],
      "a": 0,        // index đáp án đúng (0-3)
      "difficulty": 1 // 1=easy, 2=medium, 3=hard
    }
  ]
}
```

## Game Modes

- **Thường**: Mỗi người 10 câu, điểm ẩn đến cuối
- **Đối kháng**: 2 người chơi cùng lúc, race mode

## Scoring

```
Điểm = 50 + (số giây còn lại × 3)
Tối đa: 95 điểm/câu
```
