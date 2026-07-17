import pg from 'pg';
import { DEFAULT_QUIZ_TOPICS } from './defaultQuizzes.js';

const { Pool } = pg;

const DATABASE_URL = process.env.DATABASE_URL || '';

export const isDbEnabled = Boolean(DATABASE_URL);

const pool = isDbEnabled
  ? new Pool({
      connectionString: DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    })
  : null;

export async function query(text, params = []) {
  if (!pool) {
    throw new Error('DATABASE_URL אינו מוגדר ולכן מסד הנתונים של מאגר השאלות אינו זמין.');
  }

  return pool.query(text, params);
}

function stripExplanations(question) {
  const { explanations, ...safeQuestion } = question;
  return safeQuestion;
}

async function seedDefaultQuizzesIfEmpty() {
  const topicCount = await query('SELECT COUNT(*)::int AS count FROM quiz_topics');
  if (topicCount.rows[0]?.count > 0) {
    return;
  }

  for (const topic of DEFAULT_QUIZ_TOPICS) {
    await query(
      `INSERT INTO quiz_topics (id, title, concept)
       VALUES ($1, $2, $3)
       ON CONFLICT (id) DO NOTHING`,
      [topic.id, topic.title, topic.questions?.[0]?.concept || null],
    );

    for (const question of topic.questions || []) {
      const safeQuestion = stripExplanations(question);
      await query(
        `INSERT INTO quiz_questions (id, topic_id, concept, question, options, correct_index)
         VALUES ($1, $2, $3, $4, $5::jsonb, $6)
         ON CONFLICT (id) DO NOTHING`,
        [
          safeQuestion.questionId || safeQuestion.id,
          topic.id,
          safeQuestion.concept || topic.questions?.[0]?.concept || null,
          safeQuestion.question,
          JSON.stringify(safeQuestion.options || []),
          safeQuestion.correctIndex,
        ],
      );
    }
  }

  console.log('[db] seeded default quiz topics and questions');
}

export async function initDb() {
  if (!pool) {
    console.warn('[db] DATABASE_URL is not configured. Persistent quiz library API will be unavailable.');
    return false;
  }

  await query(`
    CREATE TABLE IF NOT EXISTS quiz_topics (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      concept TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS quiz_questions (
      id TEXT PRIMARY KEY,
      topic_id TEXT NOT NULL REFERENCES quiz_topics(id) ON DELETE CASCADE,
      concept TEXT,
      question TEXT NOT NULL,
      options JSONB NOT NULL,
      correct_index INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await seedDefaultQuizzesIfEmpty();
  return true;
}
