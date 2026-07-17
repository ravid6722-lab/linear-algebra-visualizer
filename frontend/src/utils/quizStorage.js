import { DEFAULT_QUIZ_TOPICS } from '../data/quizzes.js';

const STORAGE_KEY = 'linear-algebra-quiz-topics-v2-he';

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

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

function normalizeTopic(topic) {
  return {
    id: topic.id || makeId(makeSlug(topic.title || 'topic')),
    title: String(topic.title || 'נושא ללא כותרת').trim(),
    description: String(topic.description || '').trim(),
    questions: Array.isArray(topic.questions) ? topic.questions.map((question) => ({
      ...question,
      topicId: topic.id || question.topicId,
      topicTitle: topic.title || question.topicTitle,
      options: Array.isArray(question.options) ? question.options : [],
      correctIndex: Number(question.correctIndex),
    })) : [],
  };
}

function defaultTopics() {
  return clone(DEFAULT_QUIZ_TOPICS).map(normalizeTopic);
}

function mergeTopicsWithDefaults(storedTopics) {
  const safeStored = Array.isArray(storedTopics) ? storedTopics.map(normalizeTopic) : [];
  const storedById = new Map(safeStored.map((topic) => [topic.id, topic]));

  const mergedDefaults = defaultTopics().map((defaultTopic) => {
    const storedTopic = storedById.get(defaultTopic.id);
    if (!storedTopic) return defaultTopic;

    const storedQuestionsById = new Map(
      storedTopic.questions.map((question) => [question.questionId, question]),
    );

    const defaultQuestions = defaultTopic.questions.map((defaultQuestion) => (
      storedQuestionsById.get(defaultQuestion.questionId) || defaultQuestion
    ));

    const customQuestions = storedTopic.questions.filter((question) => (
      !defaultTopic.questions.some((defaultQuestion) => defaultQuestion.questionId === question.questionId)
    ));

    return normalizeTopic({
      ...defaultTopic,
      ...storedTopic,
      title: storedTopic.title || defaultTopic.title,
      description: storedTopic.description || defaultTopic.description,
      questions: [...defaultQuestions, ...customQuestions],
    });
  });

  const customTopics = safeStored.filter((topic) => (
    !DEFAULT_QUIZ_TOPICS.some((defaultTopic) => defaultTopic.id === topic.id)
  ));

  return [...mergedDefaults, ...customTopics];
}

export function loadQuizTopics() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const topics = defaultTopics();
      saveQuizTopics(topics);
      return topics;
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      const topics = defaultTopics();
      saveQuizTopics(topics);
      return topics;
    }

    const topics = mergeTopicsWithDefaults(parsed);
    saveQuizTopics(topics);
    return topics;
  } catch (error) {
    console.warn('Could not load quiz topics from localStorage. Falling back to defaults.', error);
    const topics = defaultTopics();
    saveQuizTopics(topics);
    return topics;
  }
}

export function saveQuizTopics(topics) {
  const safeTopics = Array.isArray(topics) ? topics.map(normalizeTopic) : defaultTopics();
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(safeTopics));
  return safeTopics;
}

export function resetQuizTopics() {
  window.localStorage.removeItem(STORAGE_KEY);
  const topics = defaultTopics();
  saveQuizTopics(topics);
  return topics;
}

export function createTopic(title, description = '') {
  const cleanTitle = String(title || '').trim();
  return {
    id: makeId(makeSlug(cleanTitle)),
    title: cleanTitle,
    description: String(description || '').trim(),
    questions: [],
  };
}

export function updateTopic(topicId, patch) {
  const topics = loadQuizTopics();
  const nextTopics = topics.map((topic) => topic.id === topicId ? { ...topic, ...patch } : topic);
  return saveQuizTopics(nextTopics);
}

export function addQuestionToTopic(topicId, question) {
  const topics = loadQuizTopics();
  const nextTopics = topics.map((topic) => {
    if (topic.id !== topicId) return topic;
    const safeQuestion = {
      questionId: question.questionId || makeId(`${topicId}-question`),
      topicId: topic.id,
      topicTitle: topic.title,
      concept: question.concept || 'transformation',
      question: String(question.question || '').trim(),
      options: Array.isArray(question.options) ? question.options.map((option) => String(option || '').trim()) : [],
      correctIndex: Number(question.correctIndex),
    };
    return {
      ...topic,
      questions: [...topic.questions, safeQuestion],
    };
  });

  return saveQuizTopics(nextTopics);
}


export function updateQuestionInTopic(topicId, questionId, patch) {
  const topics = loadQuizTopics();
  const nextTopics = topics.map((topic) => {
    if (topic.id !== topicId) return topic;

    return {
      ...topic,
      questions: topic.questions.map((question) => {
        const currentQuestionId = question.questionId || question.id;
        if (currentQuestionId !== questionId) return question;

        return {
          ...question,
          ...patch,
          questionId: currentQuestionId,
          topicId: topic.id,
          topicTitle: topic.title,
          options: Array.isArray(patch.options) ? patch.options : question.options,
          correctIndex: Number.isInteger(Number(patch.correctIndex)) ? Number(patch.correctIndex) : question.correctIndex,
        };
      }),
    };
  });

  return saveQuizTopics(nextTopics);
}

export function deleteTopic(topicId) {
  const topics = loadQuizTopics();
  return saveQuizTopics(topics.filter((topic) => topic.id !== topicId));
}

export function deleteQuestionFromTopic(topicId, questionId) {
  const topics = loadQuizTopics();
  const nextTopics = topics.map((topic) => {
    if (topic.id !== topicId) return topic;

    return {
      ...topic,
      questions: topic.questions.filter((question) => {
        const currentQuestionId = question.questionId || question.id;
        return currentQuestionId !== questionId;
      }),
    };
  });

  return saveQuizTopics(nextTopics);
}

export function getTopicById(topicId) {
  return loadQuizTopics().find((topic) => topic.id === topicId) || null;
}

export function getQuestionById(topicId, questionId) {
  return getTopicById(topicId)?.questions.find((question) => question.questionId === questionId) || null;
}
