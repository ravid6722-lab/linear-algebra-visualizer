import express from 'express';
import { isDbEnabled, query } from './db.js';

const router = express.Router();

function makeSlug(text) {
  return String(text || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'topic';
}

function makeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function inferConceptFromText(text) {
  const value = String(text || '').toLowerCase();
  if (value.includes('eigen')) return 'eigen';
  if (value.includes('determinant')) return 'determinant';
  if (value.includes('combination')) return 'combination';
  if (value.includes('basis')) return 'basis';
  if (value.includes('span')) return 'span';
  if (value.includes('transform')) return 'transformation';
  return 'transformation';
}

function requireDatabase(req, res, next) {
  if (!isDbEnabled) {
    res.status(503).json({
      error: 'מסד הנתונים של מאגר השאלות אינו זמין משום ש־DATABASE_URL לא הוגדר.',
      code: 'DATABASE_UNAVAILABLE',
    });
    return;
  }

  next();
}

function validateTitle(title) {
  const cleanTitle = String(title || '').trim();
  if (!cleanTitle) return null;
  return cleanTitle;
}

function validateQuestionPayload(body = {}) {
  const question = String(body.question || '').trim();
  const options = Array.isArray(body.options) ? body.options.map((option) => String(option || '').trim()) : [];
  const correctIndex = Number(body.correctIndex);

  if (!question) {
    return { error: 'יש להזין את נוסח השאלה.' };
  }

  if (options.length !== 4 || options.some((option) => !option)) {
    return { error: 'נדרשות בדיוק ארבע אפשרויות תשובה שאינן ריקות.' };
  }

  if (!Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex > 3) {
    return { error: 'אינדקס התשובה הנכונה חייב להיות 0, 1, 2 או 3.' };
  }

  return { question, options, correctIndex };
}

function mapQuestion(row) {
  const options = Array.isArray(row.options) ? row.options : JSON.parse(row.options || '[]');
  return {
    id: row.id,
    questionId: row.id,
    topicId: row.topic_id,
    concept: row.concept,
    question: row.question,
    options,
    correctIndex: row.correct_index,
  };
}

async function loadTopicsWithQuestions() {
  const result = await query(`
    SELECT
      t.id AS topic_id,
      t.title AS topic_title,
      t.concept AS topic_concept,
      t.created_at AS topic_created_at,
      q.id AS question_id,
      q.concept AS question_concept,
      q.question AS question_text,
      q.options AS question_options,
      q.correct_index AS question_correct_index
    FROM quiz_topics t
    LEFT JOIN quiz_questions q ON q.topic_id = t.id
    ORDER BY t.created_at ASC, q.created_at ASC
  `);

  const topicsById = new Map();

  for (const row of result.rows) {
    if (!topicsById.has(row.topic_id)) {
      topicsById.set(row.topic_id, {
        id: row.topic_id,
        title: row.topic_title,
        concept: row.topic_concept,
        questions: [],
      });
    }

    if (row.question_id) {
      topicsById.get(row.topic_id).questions.push({
        id: row.question_id,
        questionId: row.question_id,
        topicId: row.topic_id,
        topicTitle: row.topic_title,
        concept: row.question_concept || row.topic_concept,
        question: row.question_text,
        options: Array.isArray(row.question_options) ? row.question_options : JSON.parse(row.question_options || '[]'),
        correctIndex: row.question_correct_index,
      });
    }
  }

  return [...topicsById.values()];
}

router.use(requireDatabase);

router.get('/quiz-topics', async (req, res) => {
  try {
    const topics = await loadTopicsWithQuestions();
    res.json(topics);
  } catch (error) {
    console.error('[quiz-library] GET /quiz-topics failed', error);
    res.status(500).json({ error: 'לא ניתן היה לטעון את נושאי הבוחן.' });
  }
});

router.post('/quiz-topics', async (req, res) => {
  const title = validateTitle(req.body?.title);
  if (!title) {
    res.status(400).json({ error: 'יש להזין כותרת לנושא.' });
    return;
  }

  const id = makeId(makeSlug(title));
  const concept = inferConceptFromText(title);

  try {
    const result = await query(
      `INSERT INTO quiz_topics (id, title, concept)
       VALUES ($1, $2, $3)
       RETURNING id, title, concept`,
      [id, title, concept],
    );

    res.status(201).json({ ...result.rows[0], questions: [] });
  } catch (error) {
    console.error('[quiz-library] POST /quiz-topics failed', error);
    res.status(500).json({ error: 'לא ניתן היה ליצור נושא לבוחן.' });
  }
});

router.put('/quiz-topics/:topicId', async (req, res) => {
  const title = validateTitle(req.body?.title);
  if (!title) {
    res.status(400).json({ error: 'יש להזין כותרת לנושא.' });
    return;
  }

  try {
    const result = await query(
      `UPDATE quiz_topics
       SET title = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id, title, concept`,
      [title, req.params.topicId],
    );

    if (result.rowCount === 0) {
      res.status(404).json({ error: 'הנושא לא נמצא.' });
      return;
    }

    res.json({ ...result.rows[0] });
  } catch (error) {
    console.error('[quiz-library] PUT /quiz-topics/:topicId failed', error);
    res.status(500).json({ error: 'לא ניתן היה לעדכן את נושא הבוחן.' });
  }
});

router.delete('/quiz-topics/:topicId', async (req, res) => {
  try {
    const result = await query(
      'DELETE FROM quiz_topics WHERE id = $1 RETURNING id',
      [req.params.topicId],
    );

    if (result.rowCount === 0) {
      res.status(404).json({ error: 'הנושא לא נמצא.' });
      return;
    }

    res.json({ success: true });
  } catch (error) {
    console.error('[quiz-library] DELETE /quiz-topics/:topicId failed', error);
    res.status(500).json({ error: 'לא ניתן היה למחוק את נושא הבוחן.' });
  }
});



router.put('/quiz-topics/:topicId/questions/:questionId', async (req, res) => {
  const validation = validateQuestionPayload(req.body);
  if (validation.error) {
    res.status(400).json({ error: validation.error });
    return;
  }

  try {
    const result = await query(
      `UPDATE quiz_questions
       SET question = $1, options = $2::jsonb, correct_index = $3, updated_at = CURRENT_TIMESTAMP
       WHERE topic_id = $4 AND id = $5
       RETURNING id, topic_id, concept, question, options, correct_index`,
      [
        validation.question,
        JSON.stringify(validation.options),
        validation.correctIndex,
        req.params.topicId,
        req.params.questionId,
      ],
    );

    if (result.rowCount === 0) {
      res.status(404).json({ error: 'השאלה לא נמצאה.' });
      return;
    }

    res.json(mapQuestion(result.rows[0]));
  } catch (error) {
    console.error('[quiz-library] PUT /quiz-topics/:topicId/questions/:questionId failed', error);
    res.status(500).json({ error: 'לא ניתן היה לעדכן את שאלת הבוחן.' });
  }
});

router.delete('/quiz-topics/:topicId/questions/:questionId', async (req, res) => {
  try {
    const result = await query(
      'DELETE FROM quiz_questions WHERE topic_id = $1 AND id = $2 RETURNING id',
      [req.params.topicId, req.params.questionId],
    );

    if (result.rowCount === 0) {
      res.status(404).json({ error: 'השאלה לא נמצאה.' });
      return;
    }

    res.json({ success: true });
  } catch (error) {
    console.error('[quiz-library] DELETE /quiz-topics/:topicId/questions/:questionId failed', error);
    res.status(500).json({ error: 'לא ניתן היה למחוק את שאלת הבוחן.' });
  }
});

router.post('/quiz-topics/:topicId/questions', async (req, res) => {
  const validation = validateQuestionPayload(req.body);
  if (validation.error) {
    res.status(400).json({ error: validation.error });
    return;
  }

  try {
    const topicResult = await query(
      'SELECT id, title, concept FROM quiz_topics WHERE id = $1',
      [req.params.topicId],
    );

    if (topicResult.rowCount === 0) {
      res.status(404).json({ error: 'הנושא לא נמצא.' });
      return;
    }

    const topic = topicResult.rows[0];
    const questionId = makeId(`${topic.id}-question`);
    const concept = topic.concept || inferConceptFromText(topic.title);

    const insertResult = await query(
      `INSERT INTO quiz_questions (id, topic_id, concept, question, options, correct_index)
       VALUES ($1, $2, $3, $4, $5::jsonb, $6)
       RETURNING id, topic_id, concept, question, options, correct_index`,
      [
        questionId,
        topic.id,
        concept,
        validation.question,
        JSON.stringify(validation.options),
        validation.correctIndex,
      ],
    );

    const row = insertResult.rows[0];
    res.status(201).json({
      ...mapQuestion(row),
      topicTitle: topic.title,
    });
  } catch (error) {
    console.error('[quiz-library] POST /quiz-topics/:topicId/questions failed', error);
    res.status(500).json({ error: 'לא ניתן היה ליצור שאלת בוחן.' });
  }
});

export default router;
