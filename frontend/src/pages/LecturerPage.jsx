import { useEffect, useRef, useState } from 'react';
import Header from '../components/Header.jsx';
import ConceptSelector from '../components/ConceptSelector.jsx';
import MatrixInput from '../components/MatrixInput.jsx';
import VectorInput from '../components/VectorInput.jsx';
import BasisConversionControls from '../components/BasisConversionControls.jsx';
import AbstractSpaceControls from '../components/AbstractSpaceControls.jsx';
import Visualization from '../components/Visualization.jsx';
import InsightPanel from '../components/InsightPanel.jsx';
import QuizCard from '../components/QuizCard.jsx';
import Footer from '../components/Footer.jsx';
import { useVisualizerStore } from '../store/useVisualizerStore.js';
import { checkRoom, createRoom } from '../api/roomsApi.js';
import { joinRoom, socket } from '../api/socketClient.js';

const SYNC_DEBOUNCE_MS = 120;

function defaultPresence() {
  return { studentsConnected: 0, nicknames: [] };
}

export default function LecturerPage() {
  const dim = useVisualizerStore((s) => s.dim);
  const concept = useVisualizerStore((s) => s.concept);
  const [joinCode, setJoinCode] = useState('');
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isRecoveringRoom, setIsRecoveringRoom] = useState(false);
  const [roomError, setRoomError] = useState('');
  const [roomWarning, setRoomWarning] = useState('');
  const [roomExpired, setRoomExpired] = useState(false);
  const [presence, setPresence] = useState(defaultPresence());
  const [socketStatus, setSocketStatus] = useState('לא מחובר');
  const joinCodeRef = useRef('');
  const roomExpiredRef = useRef(false);
  const recoveringRef = useRef(false);
  const syncTimerRef = useRef(null);

  useEffect(() => {
    document.body.classList.toggle('dim-3', dim === 3);
  }, [dim]);

  useEffect(() => {
    joinCodeRef.current = joinCode;
  }, [joinCode]);

  useEffect(() => {
    roomExpiredRef.current = roomExpired;
  }, [roomExpired]);

  async function syncCurrentState(code) {
    const patch = useVisualizerStore.getState().getSyncSnapshot();
    return new Promise((resolve) => {
      socket.emit('lecturer:state-update', { joinCode: code, patch }, () => resolve());
    });
  }

  async function rejoinExistingLecturerRoom(code) {
    const response = await joinRoom({
      joinCode: code,
      role: 'lecturer',
      nickname: 'מרצה',
    });

    await syncCurrentState(code);
    setPresence(response.presence || defaultPresence());
    setSocketStatus('מחובר כמרצה · התצוגה מסונכרנת');
    setRoomExpired(false);
    setRoomWarning('');
    setRoomError('');
  }

  async function recoverAfterReconnect() {
    const activeJoinCode = joinCodeRef.current;
    if (!activeJoinCode || recoveringRef.current) return;

    recoveringRef.current = true;
    setIsRecoveringRoom(true);
    setSocketStatus('מתחבר מחדש · בודק את החדר...');

    try {
      const exists = await checkRoom(activeJoinCode);

      if (!exists) {
        setRoomExpired(true);
        setPresence(defaultPresence());
        setSocketStatus('החדר פג');
        setRoomWarning('השרת הופעל מחדש והחדר הקודם אינו קיים עוד. צרו חדר חדש ושתפו את הקוד החדש עם הסטודנטים.');
        return;
      }

      await rejoinExistingLecturerRoom(activeJoinCode);
    } catch (error) {
      setSocketStatus('החיבור מחדש נכשל');
      setRoomWarning(error.message?.includes('Failed to fetch')
        ? 'השרת עדיין אינו זמין. המערכת תנסה להתחבר שוב כאשר החיבור יחזור.'
        : (error.message || 'לא ניתן לוודא אם החדר עדיין קיים.'));
    } finally {
      recoveringRef.current = false;
      setIsRecoveringRoom(false);
    }
  }

  useEffect(() => {
    function handlePresence(nextPresence) {
      setPresence(nextPresence || defaultPresence());
    }

    function handleSocketConnect() {
      if (joinCodeRef.current) {
        recoverAfterReconnect();
      } else {
        setSocketStatus('מחובר');
      }
    }

    function handleSocketDisconnect() {
      if (joinCodeRef.current) {
        setSocketStatus('מנותק · ייתכן שהשרת אינו פעיל');
      } else {
        setSocketStatus('לא מחובר');
      }
    }

    function handleSocketConnectError() {
      setSocketStatus('שגיאת חיבור · בדקו את השרת');
    }

    socket.on('connect', handleSocketConnect);
    socket.on('disconnect', handleSocketDisconnect);
    socket.on('connect_error', handleSocketConnectError);
    socket.on('room:presence', handlePresence);

    return () => {
      socket.off('connect', handleSocketConnect);
      socket.off('disconnect', handleSocketDisconnect);
      socket.off('connect_error', handleSocketConnectError);
      socket.off('room:presence', handlePresence);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    const unsubscribe = useVisualizerStore.subscribe((state) => {
      const activeJoinCode = joinCodeRef.current;
      if (!activeJoinCode || !socket.connected || roomExpiredRef.current) return;

      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);

      syncTimerRef.current = setTimeout(() => {
        if (roomExpiredRef.current) return;
        const patch = state.getSyncSnapshot();
        socket.emit('lecturer:state-update', { joinCode: activeJoinCode, patch }, (response) => {
          if (!response?.success) {
            console.warn('State sync failed:', response?.error || 'Unknown error');
            if (response?.error?.includes('Room not found')) {
              setRoomExpired(true);
              setSocketStatus('החדר פג');
              setRoomWarning('החדר הנוכחי אינו קיים עוד. צרו חדר חדש כדי להמשיך בשיעור החי.');
            }
          }
        });
      }, SYNC_DEBOUNCE_MS);
    });

    return () => unsubscribe();
  }, []);

  function handleLecturerAnimate(payload) {
    const activeJoinCode = joinCodeRef.current;
    if (!activeJoinCode || !socket.connected || roomExpiredRef.current) return;

    socket.emit('lecturer:animation-trigger', {
      joinCode: activeJoinCode,
      durationMs: payload.durationMs,
      startedAt: payload.startedAt,
    }, (response) => {
      if (!response?.success) {
        console.warn('Animation sync failed:', response?.error || 'Unknown error');
      }
    });
  }

  function handleCameraChange(camera) {
    const activeJoinCode = joinCodeRef.current;
    if (!activeJoinCode || !socket.connected || roomExpiredRef.current) return;

    socket.emit('lecturer:camera-update', { joinCode: activeJoinCode, camera }, (response) => {
      if (!response?.success) {
        console.warn('Camera sync failed:', response?.error || 'Unknown error');
      }
    });
  }

  async function handleStartLiveSession() {
    setIsCreatingRoom(true);
    setRoomError('');
    setRoomWarning('');
    setRoomExpired(false);
    roomExpiredRef.current = false;
    setSocketStatus('יוצר חדר...');
    setPresence(defaultPresence());

    try {
      const code = await createRoom();
      setJoinCode(code);
      joinCodeRef.current = code;
      setSocketStatus('מחבר את המרצה...');

      const response = await joinRoom({
        joinCode: code,
        role: 'lecturer',
        nickname: 'מרצה',
      });

      await syncCurrentState(code);

      setPresence(response.presence || defaultPresence());
      setSocketStatus('מחובר כמרצה · התצוגה מסונכרנת');
    } catch (error) {
      setRoomError(error.message?.includes('Failed to fetch') ? 'לא ניתן להתחבר לשרת. ודאו שהשרת פועל ושכתובת השרת בקובץ ההגדרות נכונה.' : (error.message || 'לא ניתן ליצור חדר או להצטרף אליו. ודאו שהשרת פועל.'));
      setSocketStatus('החיבור נכשל');
    } finally {
      setIsCreatingRoom(false);
    }
  }

  const socketBadgeClass = socketStatus.startsWith('מחובר')
    ? 'connected'
    : socketStatus.includes('פג') || socketStatus.includes('נכשל') || socketStatus.includes('שגיאת') || socketStatus.includes('מנותק')
      ? 'error'
      : 'warning';

  return (
    <div className="app" dir="rtl">
      <Header />

      <section className="card live-session-card">
        <div>
          <div className="section-title" style={{ marginBottom: 6 }}>שיעור חי</div>
          <h1>סביבת המרצה</h1>
          <p>
            התחילו שיעור חי כדי ליצור קוד הצטרפות. הסטודנטים יזינו את הקוד באזור הסטודנטים, והתצוגה של המרצה תסונכרן אליהם בזמן אמת.
          </p>
          {joinCode && (
            <div className={`join-code-display ${roomExpired ? 'expired-room-code' : ''}`} aria-live="polite">
              קוד החדר: <strong>{joinCode}</strong>
              {roomExpired && <span className="room-expired-label">פג לאחר הפעלה מחדש של השרת</span>}
            </div>
          )}
          <div className="session-dashboard" aria-live="polite">
            <div className="dashboard-stat">
              <span className="dashboard-label">חיבור לשרת</span>
              <span className={`connection-status-badge ${socketBadgeClass}`}>{isRecoveringRoom ? 'מתחבר מחדש...' : socketStatus}</span>
            </div>
            <div className="dashboard-stat">
              <span className="dashboard-label">מספר סטודנטים מחוברים</span>
              <strong>{presence.studentsConnected}</strong>
            </div>
            <div className="dashboard-students">
              <span className="dashboard-label">סטודנטים מחוברים</span>
              {presence.nicknames?.length > 0 ? (
                <div className="presence-names">
                  {presence.nicknames.map((name, index) => (
                    <span className="presence-pill" key={`${name}-${index}`}>{name}</span>
                  ))}
                </div>
              ) : (
                <div className="empty-table-note">עדיין אין סטודנטים מחוברים.</div>
              )}
            </div>
          </div>
          {roomWarning && <div className="message-box warning-message">{roomWarning}</div>}
          {roomError && <div className="message-box error-message">{roomError}</div>}
        </div>

        <button className="btn primary live-session-btn" type="button" onClick={handleStartLiveSession} disabled={isCreatingRoom || isRecoveringRoom}>
          {isCreatingRoom ? 'יוצר...' : roomExpired ? 'יצירת חדר חדש' : joinCode ? 'יצירת שיעור חדש' : 'התחלת שיעור חי'}
        </button>
      </section>

      <main className="workspace-grid lecturer-workspace">
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

        <Visualization role="lecturer" onCameraChange={handleCameraChange} onAnimate={handleLecturerAnimate} />
        <InsightPanel />
      </main>

      <div className="page-section-wrap">
        <QuizCard joinCode={roomExpired ? '' : joinCode} />
      </div>
      <Footer />
    </div>
  );
}
