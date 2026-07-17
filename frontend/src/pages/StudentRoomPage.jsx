import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Header from '../components/Header.jsx';
import ConceptSelector from '../components/ConceptSelector.jsx';
import MatrixInput from '../components/MatrixInput.jsx';
import VectorInput from '../components/VectorInput.jsx';
import BasisConversionControls from '../components/BasisConversionControls.jsx';
import AbstractSpaceControls from '../components/AbstractSpaceControls.jsx';
import Visualization from '../components/Visualization.jsx';
import InsightPanel from '../components/InsightPanel.jsx';
import Footer from '../components/Footer.jsx';
import StudentLiveQuiz from '../components/StudentLiveQuiz.jsx';
import { useVisualizerStore } from '../store/useVisualizerStore.js';
import { socket } from '../api/socketClient.js';
import { useVisualizerAnimation } from '../hooks/useVisualizerAnimation.js';

const JOIN_ACK_TIMEOUT_MS = 8000;

function defaultPresence() {
  return { studentsConnected: 0, nicknames: [] };
}

function normalizeJoinCode(code) {
  return String(code || '').trim().toUpperCase();
}

function getStoredNickname() {
  const value = sessionStorage.getItem('student:nickname');
  return value && value.trim() ? value.trim() : 'סטודנט';
}

export default function StudentRoomPage() {
  const { code } = useParams();
  const joinCode = normalizeJoinCode(code);
  const dim = useVisualizerStore((s) => s.dim);
  const concept = useVisualizerStore((s) => s.concept);
  const applyRemotePatch = useVisualizerStore((s) => s.applyRemotePatch);
  const setCamera3D = useVisualizerStore((s) => s.setCamera3D);
  const [nickname] = useState(getStoredNickname);
  const [connectionStatus, setConnectionStatus] = useState('מתחבר...');
  const [connectionError, setConnectionError] = useState('');
  const [roomExpired, setRoomExpired] = useState(false);
  const [presence, setPresence] = useState(defaultPresence());
  const [mode, setMode] = useState('follow');
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [quizResults, setQuizResults] = useState(null);
  const [answerReveal, setAnswerReveal] = useState(null);
  const modeRef = useRef('follow');
  const joinAttemptRef = useRef(0);
  const joinInFlightRef = useRef(false);
  const { runAnimation } = useVisualizerAnimation();

  useEffect(() => {
    document.body.classList.toggle('dim-3', dim === 3);
  }, [dim]);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    if (!joinCode) {
      setConnectionStatus('קוד חדר לא תקין');
      setConnectionError('חסר קוד חדר. חזרו למסך ההצטרפות והזינו קוד תקין.');
      setRoomExpired(true);
      return undefined;
    }

    const attemptId = joinAttemptRef.current + 1;
    joinAttemptRef.current = attemptId;
    let disposed = false;

    setConnectionStatus('מתחבר...');
    setConnectionError('');
    setRoomExpired(false);
    setPresence(defaultPresence());

    function isCurrentAttempt() {
      return !disposed && joinAttemptRef.current === attemptId;
    }

    function handlePresence(nextPresence) {
      if (!isCurrentAttempt()) return;
      setPresence(nextPresence || defaultPresence());
    }

    function applyJoinResponse(response) {
      if (response.state && modeRef.current === 'follow') {
        applyRemotePatch(response.state);
      }

      if (response.activeQuiz) {
        setActiveQuiz(response.activeQuiz);
        setAnswerReveal(response.activeQuiz.answerRevealed ? {
          questionId: response.activeQuiz.questionId,
          correctIndex: response.activeQuiz.correctIndex,
          answerRevealed: true,
        } : null);
      } else {
        setActiveQuiz(null);
        setQuizResults(null);
        setAnswerReveal(null);
      }

      if (response.quizResults) {
        setQuizResults(response.quizResults);
      }

      setPresence(response.presence || defaultPresence());
      setRoomExpired(false);
      setConnectionError('');
      setConnectionStatus(`מחובר לחדר ${joinCode}`);
    }

    function handleJoinFailure(message) {
      const errorMessage = message || 'לא ניתן להצטרף לחדר.';
      const looksExpired = errorMessage.includes('Room not found') || errorMessage.includes('server may have restarted');

      setRoomExpired(looksExpired);
      setPresence(defaultPresence());
      setConnectionStatus(looksExpired ? 'החדר אינו זמין עוד' : 'לא ניתן להתחבר לחדר');
      setConnectionError(looksExpired
        ? 'החדר אינו זמין עוד. ייתכן שהמרצה צריך ליצור חדר חדש.'
        : errorMessage);
    }

    function emitJoin() {
      if (!isCurrentAttempt()) return;
      if (joinInFlightRef.current) return;

      joinInFlightRef.current = true;
      setConnectionStatus('מצטרף לשיעור החי...');
      setConnectionError('');


      socket.timeout(JOIN_ACK_TIMEOUT_MS).emit(
        'room:join',
        { joinCode, nickname, role: 'student' },
        (error, response) => {
          joinInFlightRef.current = false;
          if (!isCurrentAttempt()) return;

          if (error) {
            console.warn('[student] room:join timeout', error);
            setRoomExpired(false);
            setConnectionStatus('מנותק');
            setConnectionError('לא ניתן להתחבר לחדר החי. ודאו שהשרת פועל ונסו שוב.');
            return;
          }


          if (response?.success === true) {
            applyJoinResponse(response);
            return;
          }

          handleJoinFailure(response?.error || 'לא ניתן להצטרף לחדר.');
        },
      );
    }

    function joinWhenConnected() {
      if (!isCurrentAttempt()) return;

      if (socket.connected) {
        emitJoin();
        return;
      }

      setConnectionStatus('מתחבר לשרת...');
      socket.connect();
    }

    function handleSocketConnect() {
      if (!isCurrentAttempt()) return;
      emitJoin();
    }

    function handleSocketDisconnect() {
      if (!isCurrentAttempt()) return;
      joinInFlightRef.current = false;
      setConnectionStatus('החיבור לשיעור החי נותק. בדקו שהשרת עדיין פועל.');
    }

    function handleSocketConnectError(error) {
      if (!isCurrentAttempt()) return;
      joinInFlightRef.current = false;
      setConnectionStatus('לא ניתן להתחבר לשרת.');
      setConnectionError(error?.message || 'לא ניתן להתחבר לשרת.');
    }

    function handleStatePatch(patch) {
      if (modeRef.current === 'follow') {
        applyRemotePatch(patch);
      }
    }

    function handleAnimationTrigger(payload = {}) {
      if (modeRef.current === 'follow') {
        runAnimation({
          durationMs: payload.durationMs,
          startedAt: payload.startedAt,
        });
      }
    }

    function handleCameraUpdate(payload = {}) {
      if (modeRef.current === 'follow' && payload.camera) {
        setCamera3D(payload.camera);
      }
    }

    function handleQuizOpen(quiz) {
      setActiveQuiz(quiz);
      setQuizResults(null);
      setAnswerReveal(quiz?.answerRevealed ? {
        questionId: quiz.questionId,
        correctIndex: quiz.correctIndex,
        answerRevealed: true,
      } : null);
    }

    function handleQuizResults(results) {
      setQuizResults(results);
    }

    function handleQuizAnswerRevealed(payload = {}) {
      setAnswerReveal({
        questionId: payload.questionId,
        correctIndex: payload.correctIndex,
        answerRevealed: true,
      });
      setActiveQuiz((currentQuiz) => currentQuiz && currentQuiz.questionId === payload.questionId ? {
        ...currentQuiz,
        correctIndex: payload.correctIndex,
        answerRevealed: true,
      } : currentQuiz);
    }

    function handleQuizClosed() {
      setActiveQuiz(null);
      setQuizResults(null);
      setAnswerReveal(null);
    }

    socket.on('connect', handleSocketConnect);
    socket.on('connect_error', handleSocketConnectError);
    socket.on('disconnect', handleSocketDisconnect);
    socket.on('room:presence', handlePresence);
    socket.on('room:state-patch', handleStatePatch);
    socket.on('room:animation-trigger', handleAnimationTrigger);
    socket.on('room:camera-update', handleCameraUpdate);
    socket.on('quiz:open', handleQuizOpen);
    socket.on('quiz:results', handleQuizResults);
    socket.on('quiz:answer-revealed', handleQuizAnswerRevealed);
    socket.on('quiz:closed', handleQuizClosed);

    joinWhenConnected();

    return () => {
      disposed = true;
      joinInFlightRef.current = false;
      socket.off('connect', handleSocketConnect);
      socket.off('connect_error', handleSocketConnectError);
      socket.off('disconnect', handleSocketDisconnect);
      socket.off('room:presence', handlePresence);
      socket.off('room:state-patch', handleStatePatch);
      socket.off('room:animation-trigger', handleAnimationTrigger);
      socket.off('room:camera-update', handleCameraUpdate);
      socket.off('quiz:open', handleQuizOpen);
      socket.off('quiz:results', handleQuizResults);
      socket.off('quiz:answer-revealed', handleQuizAnswerRevealed);
      socket.off('quiz:closed', handleQuizClosed);
    };
  }, [joinCode, nickname, applyRemotePatch, runAnimation, setCamera3D]);

  const isFollowMode = mode === 'follow';
  const isConnected = connectionStatus.startsWith('מחובר') && !roomExpired;

  return (
    <div className="app student-practice-app" dir="rtl">
      <Header />

      <section className="card student-practice-banner">
        <div>
          <div className="section-title" style={{ marginBottom: 6 }}>תצוגת סטודנט</div>
          <h1>{isFollowMode ? 'מעקב אחר המרצה' : 'סביבת תרגול'}</h1>
          <p>
            קוד החדר: <strong>{joinCode || '—'}</strong> · {nickname}. במצב מעקב התצוגה מתעדכנת מהמרצה בזמן אמת; במצב תרגול השינויים נשארים בדפדפן שלכם.
          </p>
          <div className={`presence-panel ${isConnected ? 'success-message' : roomExpired ? 'error-message' : 'warning-message'}`} aria-live="polite">
            <span className={`connection-status-badge ${isConnected ? 'connected' : roomExpired ? 'error' : 'warning'}`}>{isConnected ? 'מחובר' : roomExpired ? 'החדר אינו זמין' : 'לתשומת לב'}</span>
            <strong>{connectionStatus}</strong><br />
            מספר הסטודנטים המחוברים בחדר: {presence.studentsConnected}
            {connectionError && <div style={{ marginTop: 8 }}>{connectionError}</div>}
            {!isConnected && (
              <div className="status-actions">
                <Link className="btn secondary student-nav-button" to="/student">חזרה למסך ההצטרפות</Link>
              </div>
            )}
          </div>
        </div>
        <div className="student-mode-panel">
          <div className="mode-toggle" aria-label="מצב סטודנט">
            <button className={isFollowMode ? 'active' : ''} type="button" onClick={() => setMode('follow')}>
              מעקב אחר המרצה
            </button>
            <button className={!isFollowMode ? 'active' : ''} type="button" onClick={() => setMode('practice')}>
              מצב תרגול
            </button>
          </div>
          <div className="student-nav-actions" style={{ marginTop: 10 }}>
            <Link className="btn secondary student-nav-button" to="/student">החלפת חדר</Link>
            <Link className="btn secondary student-nav-button" to="/">דף הבית</Link>
          </div>
        </div>
      </section>

      <main className="workspace-grid student-workspace">
        {!isFollowMode && (
          <aside className="left-panel control-panel">
            <div className="card">
              <ConceptSelector />
              {concept === 'abstract' ? (
                <AbstractSpaceControls />
              ) : (
                <>
                  <MatrixInput />
                  <VectorInput />
                  {concept === 'basis' && <BasisConversionControls />}
                  </>
              )}
            </div>
          </aside>
        )}

        {isFollowMode && (
          <aside className="left-panel control-panel">
            <div className="card">
              <div className="card-section">
                <div className="section-title">מעקב אחר המרצה</div>
                <div className="explanation">
                  הפקדים מושבתים במצב זה. עברו ל־<strong>מצב תרגול</strong> כדי לחקור מטריצות ווקטורים משלכם.
                </div>
              </div>
            </div>
          </aside>
        )}

        <Visualization role="student" followLecturer={isFollowMode} />
        <InsightPanel />
      </main>

      <div className="page-section-wrap">
        <StudentLiveQuiz joinCode={joinCode} quiz={activeQuiz} results={quizResults} answerReveal={answerReveal} />
      </div>

      <Footer />
    </div>
  );
}
