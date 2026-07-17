import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <div className="landing-page" dir="rtl">
      <div className="landing-card card final-landing-card">
        <div className="brand-mark landing-mark">Σ</div>
        <h1>המחשה אינטראקטיבית באלגברה ליניארית</h1>
        <p>
          כלי לימודי להצגה ולתרגול של טרנספורמציות ליניאריות, דטרמיננטה, צירופים ליניאריים,
          מרחב נפרס, בסיס, מעבר בסיס ומרחבים וקטוריים אבסטרקטיים.
        </p>

        <div className="landing-feature-grid" aria-label="יכולות מרכזיות">
          <div className="landing-feature">
            <strong>המחשה</strong>
            <span>חקרו נושאים באלגברה ליניארית בתצוגות 2D ו־3D עם מטריצות ווקטורים אינטראקטיביים.</span>
          </div>
          <div className="landing-feature">
            <strong>הוראה חיה</strong>
            <span>פתחו חדר, שתפו קוד וסנכרנו את תצוגת המרצה עם הסטודנטים.</span>
          </div>
          <div className="landing-feature">
            <strong>בדיקת הבנה</strong>
            <span>הפעילו שאלונים חיים וצפו בתשובות הכיתה בזמן אמת.</span>
          </div>
        </div>

        <div className="landing-actions">
          <Link className="btn primary" to="/lecturer">כניסה כמרצה</Link>
          <Link className="btn" to="/student">כניסה כסטודנט</Link>
        </div>
      </div>
    </div>
  );
}
