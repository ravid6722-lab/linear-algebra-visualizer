export default function Roadmap() {
  const items = [
    ['🔄', 'סנכרון כיתה בזמן אמת', 'Socket.io משדר כל פעולה של המרצה למסכי הסטודנטים המחוברים.'],
    ['🧊', 'הדמיות תלת־ממד מתקדמות', 'המשך אפשרי: צירים עצמיים בתלת־ממד, תנועות מצלמה והצללה עשירה יותר.'],
    ['🧮', 'מטריצות n×n ומרחבים אבסטרקטיים', 'הרחבה מעבר ל־2D ול־3D למטריצות בממד כללי ולחישוב סימבולי.'],
    ['⚛️', 'תשתית React ו־Node.js', 'ממשק React רכיבי, שרת Node.js/Express וחדרי כיתה.'],
    ['✅', 'בדיקות נכונות נומרית', 'בדיקות אוטומטיות המשוות את החישובים ל־Python/NumPy או ל־MATLAB.'],
  ];

  return (
    <section className="card roadmap-card">
      <div className="card-section">
        <div className="section-title">מפת דרכים <span className="badge-soon">מתוכנן</span></div>
        <p style={{ margin: '0 0 14px 0', fontSize: 13, color: 'var(--text-muted)', maxWidth: 760 }}>
          גרסת React היא הבסיס להמשך פיתוח פלטפורמת הכיתה המלאה.
        </p>
        <div className="roadmap-grid">
          {items.map(([icon, title, body]) => (
            <div className="roadmap-item" key={title}>
              <div className="ri-icon">{icon}</div>
              <div className="ri-title">{title}</div>
              <div className="ri-body">{body}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
