import { API_BASE_URL } from './roomsApi.js';

async function readJsonResponse(response) {
  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message = data?.error || data?.message || `Request failed with status ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export async function fetchQuizTopics() {
  const response = await fetch(`${API_BASE_URL}/api/quiz-topics`);
  return readJsonResponse(response);
}

export async function createQuizTopic(title) {
  const response = await fetch(`${API_BASE_URL}/api/quiz-topics`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  });

  return readJsonResponse(response);
}

export async function addQuestionToTopic(topicId, questionData) {
  const response = await fetch(`${API_BASE_URL}/api/quiz-topics/${encodeURIComponent(topicId)}/questions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(questionData),
  });

  return readJsonResponse(response);
}

export async function updateQuizTopic(topicId, data) {
  const response = await fetch(`${API_BASE_URL}/api/quiz-topics/${encodeURIComponent(topicId)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  return readJsonResponse(response);
}

export async function deleteQuizTopic(topicId) {
  const response = await fetch(`${API_BASE_URL}/api/quiz-topics/${encodeURIComponent(topicId)}`, {
    method: 'DELETE',
  });

  return readJsonResponse(response);
}



export async function updateQuizQuestion(topicId, questionId, questionData) {
  const response = await fetch(`${API_BASE_URL}/api/quiz-topics/${encodeURIComponent(topicId)}/questions/${encodeURIComponent(questionId)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(questionData),
  });

  return readJsonResponse(response);
}

export async function deleteQuizQuestion(topicId, questionId) {
  const response = await fetch(`${API_BASE_URL}/api/quiz-topics/${encodeURIComponent(topicId)}/questions/${encodeURIComponent(questionId)}`, {
    method: 'DELETE',
  });

  return readJsonResponse(response);
}
