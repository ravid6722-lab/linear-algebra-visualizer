import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { checkRoom } from '../api/roomsApi.js';

function friendlyJoinError(error) {
  const message = String(error?.message || '');
  if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
    return 'לא ניתן להתחבר לשרת. ודאו שהשרת פועל ושכתובת השרת בקובץ ההגדרות נכונה.';
  }
  return message || 'לא ניתן לבדוק את החדר. ודאו שהשרת פועל.';
}

export default function StudentJoinPage() {
  const navigate = useNavigate();
  const [nickname, setNickname] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const [isChecking, setIsChecking] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const code = joinCode.trim().toUpperCase();
    const cleanNickname = nickname.trim();

    if (!cleanNickname) {
      setError('יש להזין שם לפני ההצטרפות.');
      return;
    }
    if (!code) {
      setError('יש להזין קוד חדר.');
      return;
    }

    setIsChecking(true);
    setError('');

    try {
      const exists = await checkRoom(code);
      if (!exists) {
        setError('החדר לא נמצא. בדקו את הקוד או בקשו מהמרצה קוד חדש.');
        return;
      }
      sessionStorage.setItem('student:nickname', cleanNickname);
      navigate(`/student/${encodeURIComponent(code)}`);
    } catch (err) {
      setError(friendlyJoinError(err));
    } finally {
      setIsChecking(false);
    }
  }

  return (
    <div className="landing-page" dir="rtl">
      <form className="landing-card card join-card" onSubmit={handleSubmit}>
        <h1>אזור הסטודנטים</h1>
        <p>הצטרפו לשיעור חי באמצעות קוד חדר, או תרגלו באופן עצמאי.</p>

        <div className="student-entry-options">
          <div className="student-entry-option active">
            <strong>הצטרפות לשיעור חי</strong>
            <span>השתמשו בקוד שקיבלתם מהמרצה כדי לעקוב אחר ההדגמה.</span>
          </div>
          <Link className="student-entry-option practice-link" to="/student-practice">
            <strong>תרגול עצמאי</strong>
            <span>שנו מטריצות ווקטורים וענו על שאלות ללא חדר פעיל.</span>
          </Link>
        </div>

        <label className="form-label">
          שם או כינוי
          <input className="join-input" value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="לדוגמה: דנה" disabled={isChecking} />
        </label>

        <label className="form-label">
          קוד חדר
          <input className="join-input" dir="ltr" value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} placeholder="ABC123" disabled={isChecking} />
        </label>

        {isChecking && <div className="message-box loading-message">בודק את החדר...</div>}
        {error && <div className="message-box error-message">{error}</div>}

        <div className="landing-actions">
          <button className="btn primary" type="submit" disabled={isChecking}>{isChecking ? 'בודק...' : 'הצטרפות לשיעור'}</button>
          <Link className="btn" to="/">חזרה לדף הבית</Link>
        </div>
      </form>
    </div>
  );
}
