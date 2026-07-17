import { loadEnvFile } from './env.js';
loadEnvFile();
import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import { initDb } from './db.js';
import quizLibraryRoutes from './quizLibraryRoutes.js';
import {
  addQuizResponse,
  addStudent,
  clearActiveQuiz,
  createRoom,
  findRoomBySocket,
  getActiveQuiz,
  getPresence,
  getQuizResults,
  getRoom,
  getRoomState,
  removeStudent,
  revealQuizAnswer,
  roomExists,
  setActiveQuiz,
  setLecturerSocket,
  updateRoomState,
} from './rooms.js';

const PORT = process.env.PORT || 3000;
const DEFAULT_CLIENT_URLS = ['http://localhost:5173', 'http://127.0.0.1:5173'];
const CLIENT_URLS = (process.env.CLIENT_URLS || process.env.CLIENT_URL || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const ALLOWED_ORIGINS = CLIENT_URLS.length > 0 ? CLIENT_URLS : DEFAULT_CLIENT_URLS;

function corsOrigin(origin, callback) {
  if (!origin || ALLOWED_ORIGINS.includes(origin)) {
    callback(null, true);
    return;
  }

  callback(new Error(`Origin not allowed by CORS: ${origin}`));
}
const JOIN_CODE_PATTERN = /^[A-Z0-9]{4,10}$/;

const app = express();

app.use(cors({
  origin: corsOrigin,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));
app.use(express.json());

app.get('/healthz', (req, res) => {
  res.status(200).json({ ok: true });
});

app.post('/api/rooms', (req, res) => {
  const room = createRoom();
  console.log(`[rooms] room created: ${room.joinCode}`);
  res.status(201).json({ joinCode: room.joinCode });
});

app.get('/api/rooms/:joinCode', (req, res) => {
  const joinCode = normalizeCode(req.params.joinCode);
  if (!isValidJoinCode(joinCode)) {
    res.json({ exists: false });
    return;
  }
  res.json({ exists: roomExists(joinCode) });
});

// Mount the optional persistent quiz library after the in-memory room routes.
// This keeps live rooms available even when DATABASE_URL is not configured.
app.use('/api', quizLibraryRoutes);

const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: corsOrigin,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

function normalizeCode(joinCode) {
  return String(joinCode || '').trim().toUpperCase();
}

function isValidJoinCode(joinCode) {
  return JOIN_CODE_PATTERN.test(normalizeCode(joinCode));
}

function roomName(joinCode) {
  return `room:${normalizeCode(joinCode)}`;
}

function ackError(ack, message) {
  if (typeof ack === 'function') {
    ack({ success: false, error: message });
  }
}

function ackSuccess(ack, payload = {}) {
  if (typeof ack === 'function') {
    ack({ success: true, ...payload });
  }
}

function rejectEvent(eventName, socketId, message) {
  console.warn(`[socket] invalid event rejected: ${eventName} from ${socketId}. ${message}`);
}

function safeHandler(eventName, socket, handler) {
  return (payload = {}, ack) => {
    try {
      handler(payload || {}, ack);
    } catch (error) {
      console.error(`[socket] handler failed: ${eventName} from ${socket.id}`, error);
      ackError(ack, 'אירעה שגיאת שרת בעת הטיפול בבקשה.');
    }
  };
}

function getExistingRoomOrAck(joinCode, ack, socket, eventName) {
  const normalizedCode = normalizeCode(joinCode);

  if (!isValidJoinCode(normalizedCode)) {
    const message = 'קוד ההצטרפות חסר או אינו תקין.';
    rejectEvent(eventName, socket.id, message);
    ackError(ack, message);
    return null;
  }

  const room = getRoom(normalizedCode);
  if (!room) {
    const message = eventName === 'room:join'
      ? 'החדר לא נמצא. ייתכן שהשרת הופעל מחדש.'
      : 'החדר לא נמצא.';
    rejectEvent(eventName, socket.id, message);
    ackError(ack, message);
    return null;
  }

  return room;
}

function requireLecturer(joinCode, socket, ack, eventName) {
  const room = getExistingRoomOrAck(joinCode, ack, socket, eventName);
  if (!room) return null;

  if (room.lecturerSocketId !== socket.id) {
    const message = 'רק המרצה יכול לבצע פעולה זו.';
    rejectEvent(eventName, socket.id, `${message} room=${room.joinCode}`);
    ackError(ack, message);
    return null;
  }

  return room;
}

function emitPresence(joinCode) {
  const normalizedCode = normalizeCode(joinCode);
  const presence = getPresence(normalizedCode);
  io.to(roomName(normalizedCode)).emit('room:presence', presence);
  return presence;
}

function emitQuizResultsIfActive(joinCode) {
  const results = getQuizResults(joinCode);
  if (results) {
    io.to(roomName(joinCode)).emit('quiz:results', results);
  }
  return results;
}

io.on('connection', (socket) => {
  console.log(`[socket] connected: ${socket.id}`);

  socket.on('room:join', safeHandler('room:join', socket, (payload = {}, ack) => {
    const joinCode = normalizeCode(payload.joinCode);
    const role = String(payload.role || '').trim().toLowerCase();
    const nickname = payload.nickname || 'סטודנט';

    console.log('[socket] room:join', { joinCode, role, nickname });

    const room = getExistingRoomOrAck(joinCode, ack, socket, 'room:join');
    if (!room) return;

    if (role !== 'lecturer' && role !== 'student') {
      const message = 'התפקיד אינו תקין. נדרש מרצה או סטודנט.';
      rejectEvent('room:join', socket.id, message);
      ackError(ack, message);
      return;
    }

    socket.join(roomName(joinCode));

    if (role === 'lecturer') {
      setLecturerSocket(joinCode, socket.id);
      console.log(`[socket] lecturer joined room ${joinCode}: ${socket.id}`);
    }

    if (role === 'student') {
      addStudent(joinCode, socket.id, nickname);
      console.log(`[socket] student joined room ${joinCode}: ${socket.id} (${nickname})`);
    }

    const presence = emitPresence(joinCode);
    const state = getRoomState(joinCode);
    const activeQuiz = getActiveQuiz(joinCode);
    const quizResults = getQuizResults(joinCode);

    ackSuccess(ack, {
      joinCode,
      presence,
      state,
      activeQuiz,
      quizResults,
    });

    if (role === 'student' && activeQuiz) {
      socket.emit('quiz:open', activeQuiz);
      emitQuizResultsIfActive(joinCode);
    }
  }));

  socket.on('lecturer:state-update', safeHandler('lecturer:state-update', socket, (payload = {}, ack) => {
    const joinCode = normalizeCode(payload.joinCode);
    const patch = payload.patch;
    const room = requireLecturer(joinCode, socket, ack, 'lecturer:state-update');
    if (!room) return;

    if (!patch || typeof patch !== 'object' || Array.isArray(patch)) {
      ackError(ack, 'עדכון המצב אינו תקין.');
      return;
    }

    const nextState = updateRoomState(joinCode, patch);
    socket.to(roomName(joinCode)).emit('room:state-patch', patch);
    ackSuccess(ack, { state: nextState });
  }));

  socket.on('lecturer:animation-trigger', safeHandler('lecturer:animation-trigger', socket, (payload = {}, ack) => {
    const joinCode = normalizeCode(payload.joinCode);
    const room = requireLecturer(joinCode, socket, ack, 'lecturer:animation-trigger');
    if (!room) return;

    const durationMs = Number(payload.durationMs || 1600);
    const startedAt = Number(payload.startedAt || Date.now());

    if (!Number.isFinite(durationMs) || durationMs <= 0 || !Number.isFinite(startedAt)) {
      ackError(ack, 'נתוני ההנפשה אינם תקינים.');
      return;
    }

    socket.to(roomName(joinCode)).emit('room:animation-trigger', { durationMs, startedAt });
    ackSuccess(ack);
  }));

  socket.on('lecturer:camera-update', safeHandler('lecturer:camera-update', socket, (payload = {}, ack) => {
    const joinCode = normalizeCode(payload.joinCode);
    const camera = payload.camera || null;
    const room = requireLecturer(joinCode, socket, ack, 'lecturer:camera-update');
    if (!room) return;

    if (!camera || !Array.isArray(camera.position) || !Array.isArray(camera.target)) {
      ackError(ack, 'נתוני המצלמה אינם תקינים.');
      return;
    }

    const cleanCamera = {
      position: camera.position.slice(0, 3).map(Number),
      target: camera.target.slice(0, 3).map(Number),
      zoom: Number(camera.zoom || 1),
    };

    const validCamera = cleanCamera.position.every(Number.isFinite)
      && cleanCamera.target.every(Number.isFinite)
      && Number.isFinite(cleanCamera.zoom)
      && cleanCamera.zoom > 0;

    if (!validCamera) {
      ackError(ack, 'ערכי המצלמה אינם תקינים.');
      return;
    }

    updateRoomState(joinCode, { camera3D: cleanCamera });
    socket.to(roomName(joinCode)).emit('room:camera-update', { camera: cleanCamera });
    ackSuccess(ack, { camera: cleanCamera });
  }));

  socket.on('lecturer:open-quiz', safeHandler('lecturer:open-quiz', socket, (payload = {}, ack) => {
    const joinCode = normalizeCode(payload.joinCode);
    const quiz = payload.quiz || {};
    const room = requireLecturer(joinCode, socket, ack, 'lecturer:open-quiz');
    if (!room) return;

    if (!quiz.question || !Array.isArray(quiz.options) || quiz.options.length < 2) {
      ackError(ack, 'נתוני הבוחן אינם תקינים.');
      return;
    }

    const correctIndex = Number(quiz.correctIndex);
    if (!Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex >= quiz.options.length) {
      ackError(ack, 'אינדקס התשובה הנכונה בבוחן אינו תקין.');
      return;
    }

    const activeQuiz = setActiveQuiz(joinCode, quiz);
    const results = getQuizResults(joinCode);
    socket.to(roomName(joinCode)).emit('quiz:open', activeQuiz);
    io.to(roomName(joinCode)).emit('quiz:results', results);

    console.log(`[quiz] quiz opened in room ${joinCode}: ${activeQuiz.questionId}`);
    ackSuccess(ack, { activeQuiz, results });
  }));

  socket.on('student:quiz-response', safeHandler('student:quiz-response', socket, (payload = {}, ack) => {
    const joinCode = normalizeCode(payload.joinCode);
    const questionId = String(payload.questionId || '');
    const choiceIndex = Number(payload.choiceIndex);
    const room = getExistingRoomOrAck(joinCode, ack, socket, 'student:quiz-response');
    if (!room) return;

    if (!room.activeQuiz) {
      ackError(ack, 'אין בוחן פעיל.');
      return;
    }

    if (!room.students.has(socket.id)) {
      ackError(ack, 'רק סטודנטים שהצטרפו לחדר יכולים לשלוח תשובות.');
      return;
    }

    if (room.activeQuiz.questionId !== questionId) {
      ackError(ack, 'השאלה שנשלחה אינה תואמת לבוחן הפעיל.');
      return;
    }

    if (room.activeQuiz.answerRevealed === true) {
      ackError(ack, 'התשובה כבר נחשפה.');
      return;
    }

    if (!Number.isInteger(choiceIndex) || choiceIndex < 0 || choiceIndex >= room.activeQuiz.options.length) {
      ackError(ack, 'בחירת התשובה אינה תקינה.');
      return;
    }

    const results = addQuizResponse(joinCode, socket.id, choiceIndex);
    if (!results) {
      ackError(ack, 'לא ניתן היה לשמור את התשובה לבוחן.');
      return;
    }

    console.log(`[quiz] response received in room ${joinCode}: socket=${socket.id}, choice=${choiceIndex}`);
    io.to(roomName(joinCode)).emit('quiz:results', results);

    ackSuccess(ack, {
      results,
      answerRevealed: room.activeQuiz.answerRevealed === true,
      correct: room.activeQuiz.answerRevealed === true ? choiceIndex === room.activeQuiz.correctIndex : null,
      correctIndex: room.activeQuiz.answerRevealed === true ? room.activeQuiz.correctIndex : null,
    });
  }));

  socket.on('lecturer:reveal-answer', safeHandler('lecturer:reveal-answer', socket, (payload = {}, ack) => {
    const joinCode = normalizeCode(payload.joinCode);
    const room = requireLecturer(joinCode, socket, ack, 'lecturer:reveal-answer');
    if (!room) return;

    const revealPayload = revealQuizAnswer(joinCode);
    if (!revealPayload) {
      ackError(ack, 'אין בוחן פעיל.');
      return;
    }

    const results = getQuizResults(joinCode);
    const fullRevealPayload = { ...revealPayload, results };
    io.to(roomName(joinCode)).emit('quiz:answer-revealed', fullRevealPayload);
    if (results) io.to(roomName(joinCode)).emit('quiz:results', results);

    console.log(`[quiz] answer revealed in room ${joinCode}: ${revealPayload.questionId}`);
    ackSuccess(ack, fullRevealPayload);
  }));

  socket.on('lecturer:close-quiz', safeHandler('lecturer:close-quiz', socket, (payload = {}, ack) => {
    const joinCode = normalizeCode(payload.joinCode);
    const room = requireLecturer(joinCode, socket, ack, 'lecturer:close-quiz');
    if (!room) return;

    clearActiveQuiz(joinCode);
    io.to(roomName(joinCode)).emit('quiz:closed');
    console.log(`[quiz] quiz closed in room ${joinCode}`);

    ackSuccess(ack);
  }));

  socket.on('disconnect', (reason) => {
    const room = findRoomBySocket(socket.id);

    if (room?.lecturerSocketId === socket.id) {
      console.log(`[socket] lecturer disconnected from room ${room.joinCode}. room kept alive for now. reason=${reason}`);
    } else if (room) {
      removeStudent(socket.id);
      console.log(`[socket] student disconnected from room ${room.joinCode}. reason=${reason}`);
      emitPresence(room.joinCode);
      emitQuizResultsIfActive(room.joinCode);
    } else {
      console.log(`[socket] disconnected: ${socket.id}. reason=${reason}`);
    }
  });
});

async function startServer() {
  try {
    await initDb();
  } catch (error) {
    console.warn('[db] initialization failed. Server will continue without persistent quiz library.', error);
  }

  httpServer.listen(PORT, () => {
    console.log(`Linear Algebra Visualizer backend running on port ${PORT}`);
    console.log(`Allowed frontend origins: ${ALLOWED_ORIGINS.join(', ')}`);
  });
}

startServer();
