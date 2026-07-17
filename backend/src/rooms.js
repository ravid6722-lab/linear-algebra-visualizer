const rooms = new Map();

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 6;

const defaultRoomState = {
  dim: 2,
  concept: 'transformation',
  A: [[1, 0], [0, 1]],
  v: [2, 1],
  u: [-1, 2],
  basisTargetU: [1, 1],
  basisTargetV: [-1, 1],
  basisInputMode: 'bases',
  basisTransition: [[1, 0], [0, 1]],
  showPlaneCombinations: true,
  alpha: 1,
  beta: 1,
  t: 1,
  animSpeed: 1,
  camera3D: {
    position: [6, 5, 7],
    target: [0, 0, 0],
    zoom: 1,
  },
};

function cloneValue(value) {
  if (Array.isArray(value)) return value.map(cloneValue);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, nested]) => [key, cloneValue(nested)]));
  }
  return value;
}

function cloneState(state) {
  return cloneValue(state);
}

function generateJoinCode() {
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i += 1) {
    const index = Math.floor(Math.random() * CODE_CHARS.length);
    code += CODE_CHARS[index];
  }
  return code;
}

function normalizeCode(joinCode) {
  return String(joinCode || '').trim().toUpperCase();
}

export function createRoom() {
  let joinCode = generateJoinCode();

  while (rooms.has(joinCode)) {
    joinCode = generateJoinCode();
  }

  const room = {
    joinCode,
    createdAt: new Date().toISOString(),
    lecturerSocketId: null,
    students: new Map(),
    state: cloneState(defaultRoomState),
    activeQuiz: null,
    quizResponses: new Map(),
  };

  rooms.set(joinCode, room);
  return room;
}

export function getRoom(joinCode) {
  const code = normalizeCode(joinCode);
  if (!code) return null;
  return rooms.get(code) || null;
}

export function roomExists(joinCode) {
  return Boolean(getRoom(joinCode));
}

export function setLecturerSocket(joinCode, socketId) {
  const room = getRoom(joinCode);
  if (!room) return null;
  room.lecturerSocketId = socketId;
  return room;
}

export function addStudent(joinCode, socketId, nickname = 'סטודנט') {
  const room = getRoom(joinCode);
  if (!room) return null;

  const cleanNickname = String(nickname || 'סטודנט').trim() || 'סטודנט';
  room.students.set(socketId, {
    socketId,
    nickname: cleanNickname,
    joinedAt: new Date().toISOString(),
  });

  return room;
}

export function removeStudent(socketId) {
  for (const room of rooms.values()) {
    if (room.students.has(socketId)) {
      room.students.delete(socketId);
      room.quizResponses.delete(socketId);
      return room;
    }
  }
  return null;
}

export function findRoomBySocket(socketId) {
  for (const room of rooms.values()) {
    if (room.lecturerSocketId === socketId || room.students.has(socketId)) {
      return room;
    }
  }
  return null;
}

export function getPresence(joinCode) {
  const room = getRoom(joinCode);
  if (!room) {
    return {
      studentsConnected: 0,
      nicknames: [],
    };
  }

  const nicknames = [...room.students.values()].map((student) => student.nickname);

  return {
    studentsConnected: room.students.size,
    nicknames,
  };
}

export function updateRoomState(joinCode, patch = {}) {
  const room = getRoom(joinCode);
  if (!room) return null;

  const allowedKeys = ['dim', 'concept', 'abstractSpace', 'functionPair', 'polynomialP', 'polynomialQ', 'abstractMatrixA', 'abstractMatrixB', 'A', 'v', 'u', 'basisTargetU', 'basisTargetV', 'basisInputMode', 'basisTransition', 'showPlaneCombinations', 'alpha', 'beta', 't', 'animSpeed', 'camera3D', 'canvas2DZoom'];
  const cleanPatch = {};

  for (const key of allowedKeys) {
    if (Object.prototype.hasOwnProperty.call(patch, key)) {
      cleanPatch[key] = cloneValue(patch[key]);
    }
  }

  room.state = {
    ...room.state,
    ...cleanPatch,
  };

  return cloneState(room.state);
}

export function getRoomState(joinCode) {
  const room = getRoom(joinCode);
  if (!room) return null;
  return cloneState(room.state);
}

export function setActiveQuiz(joinCode, quiz = {}) {
  const room = getRoom(joinCode);
  if (!room) return null;

  const options = Array.isArray(quiz.options) ? quiz.options.map(String) : [];
  const activeQuiz = {
    questionId: String(quiz.questionId || `quiz-${Date.now()}`),
    libraryQuestionId: String(quiz.libraryQuestionId || quiz.sourceQuestionId || quiz.originalQuestionId || ''),
    topicId: String(quiz.topicId || ''),
    topicTitle: String(quiz.topicTitle || ''),
    concept: String(quiz.concept || 'general'),
    question: String(quiz.question || ''),
    options,
    correctIndex: Number.isInteger(quiz.correctIndex) ? quiz.correctIndex : Number(quiz.correctIndex || 0),
    openedAt: quiz.openedAt || new Date().toISOString(),
    answerRevealed: quiz.answerRevealed === true,
  };

  room.activeQuiz = activeQuiz;
  room.quizResponses = new Map();
  return cloneValue(activeQuiz);
}

export function clearActiveQuiz(joinCode) {
  const room = getRoom(joinCode);
  if (!room) return null;
  room.activeQuiz = null;
  room.quizResponses = new Map();
  return true;
}

export function addQuizResponse(joinCode, socketId, choiceIndex) {
  const room = getRoom(joinCode);
  if (!room || !room.activeQuiz) return null;

  const index = Number(choiceIndex);
  if (!Number.isInteger(index) || index < 0 || index >= room.activeQuiz.options.length) {
    return null;
  }

  // A Map naturally supports answer changes: the latest choice replaces the previous one.
  room.quizResponses.set(socketId, index);
  return getQuizResults(joinCode);
}

export function revealQuizAnswer(joinCode) {
  const room = getRoom(joinCode);
  if (!room || !room.activeQuiz) return null;

  room.activeQuiz.answerRevealed = true;
  return {
    questionId: room.activeQuiz.questionId,
    correctIndex: room.activeQuiz.correctIndex,
    answerRevealed: true,
  };
}

export function getStudentQuizStatus(joinCode) {
  const room = getRoom(joinCode);
  if (!room || !room.activeQuiz) return [];

  return [...room.students.values()].map((student) => {
    const hasAnswered = room.quizResponses.has(student.socketId);
    return {
      socketId: student.socketId,
      nickname: student.nickname,
      hasAnswered,
      choiceIndex: hasAnswered ? room.quizResponses.get(student.socketId) : null,
    };
  });
}

export function getQuizResults(joinCode) {
  const room = getRoom(joinCode);
  if (!room || !room.activeQuiz) return null;

  const optionCount = room.activeQuiz.options.length;
  const distribution = Array.from({ length: optionCount }, () => 0);

  for (const choiceIndex of room.quizResponses.values()) {
    if (Number.isInteger(choiceIndex) && choiceIndex >= 0 && choiceIndex < optionCount) {
      distribution[choiceIndex] += 1;
    }
  }

  const totalResponses = room.quizResponses.size;
  const correctCount = distribution[room.activeQuiz.correctIndex] || 0;
  const correctPct = totalResponses === 0 ? 0 : Math.round((correctCount / totalResponses) * 100);

  return {
    questionId: room.activeQuiz.questionId,
    totalResponses,
    distribution,
    correctPct,
    answerRevealed: room.activeQuiz.answerRevealed === true,
    studentStatuses: getStudentQuizStatus(joinCode),
  };
}

export function getActiveQuiz(joinCode) {
  const room = getRoom(joinCode);
  if (!room || !room.activeQuiz) return null;
  return cloneValue(room.activeQuiz);
}

export { rooms };
