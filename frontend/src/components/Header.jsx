import { Link } from 'react-router-dom';
import { useVisualizerStore } from '../store/useVisualizerStore.js';

export default function Header() {
  const dim = useVisualizerStore((s) => s.dim);
  const setDim = useVisualizerStore((s) => s.setDim);

  return (
    <header className="topbar" dir="rtl">
      <div className="brand">
        <div className="brand-mark">Σ</div>
        <div>
          <div className="brand-title">המחשה אינטראקטיבית באלגברה ליניארית</div>
          <div className="brand-sub">כלי לימודי לתרגול ולהדגמה בכיתה</div>
        </div>
      </div>

      <div className="topbar-right">
        <Link className="toplink" to="/">דף הבית</Link>
        <Link className="toplink" to="/student">אזור הסטודנטים</Link>
        <div className="mode-toggle" title="מעבר בין תצוגה דו־ממדית לתלת־ממדית" dir="ltr">
          <button className={dim === 2 ? 'active' : ''} type="button" onClick={() => setDim(2)}>2D</button>
          <button className={dim === 3 ? 'active' : ''} type="button" onClick={() => setDim(3)}>3D</button>
        </div>
      </div>
    </header>
  );
}
