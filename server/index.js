import express from 'express';
import cors from 'cors';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(join(__dirname, '..', 'frontend')));

// Path to data folder (go up from /server to project root)
const DATA_PATH = join(__dirname, '..', 'data');
const QUESTIONS_PATH = join(DATA_PATH, 'questions');

// Helper: Fisher-Yates shuffle (unbiased)
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Helper: Validate category param against path traversal
function isValidCategory(cat) {
  return /^[a-z0-9_-]+$/.test(cat);
}

// Helper: Load and cache questions
let categoriesCache = null;
let questionsCache = {};

function loadCategories() {
  if (categoriesCache) return categoriesCache;
  const data = readFileSync(join(DATA_PATH, 'categories.json'), 'utf-8');
  categoriesCache = JSON.parse(data);
  return categoriesCache;
}

function loadQuestionFile(category) {
  if (questionsCache[category]) return questionsCache[category];
  try {
    const data = readFileSync(join(QUESTIONS_PATH, `${category}.json`), 'utf-8');
    questionsCache[category] = JSON.parse(data);
    return questionsCache[category];
  } catch (err) {
    return null;
  }
}

// ==================== API ROUTES ====================

// GET /api/categories - List all categories
app.get('/api/categories', (req, res) => {
  try {
    const data = loadCategories();
    res.json({
      success: true,
      data: data.categories
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to load categories' });
  }
});

// GET /api/questions/:category - Get all questions for a category
app.get('/api/questions/:category', (req, res) => {
  try {
    const { category } = req.params;
    if (!isValidCategory(category)) {
      return res.status(400).json({ success: false, error: 'Invalid category' });
    }
    const data = loadQuestionFile(category);

    if (!data) {
      return res.status(404).json({
        success: false,
        error: `Category '${category}' not found`
      });
    }

    res.json({
      success: true,
      data: {
        category: data.category,
        name: data.name,
        emoji: data.emoji,
        count: data.questions.length,
        questions: data.questions
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to load questions' });
  }
});

// GET /api/questions/:category/random - Get random questions for a game
// Query: ?count=10&difficulty=1,2
app.get('/api/questions/:category/random', (req, res) => {
  try {
    const { category } = req.params;
    if (!isValidCategory(category)) {
      return res.status(400).json({ success: false, error: 'Invalid category' });
    }
    let count = parseInt(req.query.count) || 10;
    let difficulties = req.query.difficulty
      ? req.query.difficulty.split(',').map(d => parseInt(d))
      : null;

    const data = loadQuestionFile(category);
    if (!data) {
      return res.status(404).json({
        success: false,
        error: `Category '${category}' not found`
      });
    }

    let questions = [...data.questions];

    // Filter by difficulty if specified
    if (difficulties) {
      questions = questions.filter(q => difficulties.includes(q.difficulty));
    }

    questions = shuffle(questions);

    // Take requested count (max available)
    count = Math.min(count, questions.length);
    questions = questions.slice(0, count);

    // Keep the `a` (answer index) in response - client needs it to check correct answers
    // In a real production app you'd compute score server-side, but for this simple game it's fine

    res.json({
      success: true,
      data: {
        category: data.category,
        name: data.name,
        emoji: data.emoji,
        count: questions.length,
        questions: questions
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to get random questions' });
  }
});

// POST /api/questions/batch - Get questions from multiple categories
// Body: { categories: ['tech', 'science'], countPerCategory: 10 }
app.post('/api/questions/batch', (req, res) => {
  try {
    const { categories, countPerCategory = 10, difficulties } = req.body;

    if (!categories || !Array.isArray(categories)) {
      return res.status(400).json({
        success: false,
        error: 'categories must be an array'
      });
    }

    let allQuestions = [];

    for (const cat of categories) {
      if (!isValidCategory(cat)) continue;
      const data = loadQuestionFile(cat);
      if (!data) continue;

      let questions = [...data.questions];

      if (difficulties) {
        questions = questions.filter(q => difficulties.includes(q.difficulty));
      }

      allQuestions.push(...questions);
    }

    allQuestions = shuffle(allQuestions);

    // Take requested count
    const totalCount = Math.min(countPerCategory * categories.length, allQuestions.length);
    allQuestions = allQuestions.slice(0, totalCount);

    // Keep answer index `a` - client needs it to check correct answers

    res.json({
      success: true,
      data: {
        count: allQuestions.length,
        questions: allQuestions
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to get batch questions' });
  }
});

// GET /api/stats - Get statistics about question bank
app.get('/api/stats', (req, res) => {
  try {
    const cats = loadCategories();
    const stats = cats.categories.map(cat => {
      const data = loadQuestionFile(cat.id);
      return {
        id: cat.id,
        name: cat.name,
        emoji: cat.emoji,
        totalQuestions: data ? data.questions.length : 0
      };
    });

    const total = stats.reduce((sum, s) => sum + s.totalQuestions, 0);

    res.json({
      success: true,
      data: {
        categoryCount: stats.length,
        totalQuestions: total,
        categories: stats
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to get stats' });
  }
});

// ==================== HEALTH CHECK ====================
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ==================== START SERVER ====================
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   🎮 Family Quizzz Server                             ║
║   ─────────────────────                               ║
║   Server running at: http://localhost:${PORT}             ║
║                                                       ║
║   API Endpoints:                                      ║
║   • GET  /api/categories          - List categories   ║
║   • GET  /api/questions/:cat      - Get questions     ║
║   • GET  /api/questions/:cat/random - Random subset  ║
║   • POST /api/questions/batch     - Multi-category    ║
║   • GET  /api/stats                - Question stats   ║
║   • GET  /api/health               - Health check     ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
  `);
});
