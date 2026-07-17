import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import Header from '../components/Header.jsx';
import ConceptSelector from '../components/ConceptSelector.jsx';
import MatrixInput from '../components/MatrixInput.jsx';
import VectorInput from '../components/VectorInput.jsx';
import BasisConversionControls from '../components/BasisConversionControls.jsx';
import AbstractSpaceControls from '../components/AbstractSpaceControls.jsx';
import Visualization from '../components/Visualization.jsx';
import InsightPanel from '../components/InsightPanel.jsx';
import Footer from '../components/Footer.jsx';
import PracticeQuiz from '../components/PracticeQuiz.jsx';
import { useVisualizerStore } from '../store/useVisualizerStore.js';

export default function StudentPracticePage() {
  const dim = useVisualizerStore((s) => s.dim);
  const concept = useVisualizerStore((s) => s.concept);

  useEffect(() => {
    document.body.classList.toggle('dim-3', dim === 3);
  }, [dim]);

  return (
    <div className="app student-practice-app" dir="rtl">
      <Header />

      <section className="card student-practice-banner standalone-practice-banner">
        <div>
          <div className="section-title" style={{ marginBottom: 6 }}>תרגול סטודנט</div>
          <h1>מצב תרגול עצמאי</h1>
          <p>
            אתם מתרגלים באופן עצמאי. השינויים במטריצות, בווקטורים, בהנפשה ובשאלות נשמרים בדפדפן שלכם ואינם משותפים עם שיעור חי.
          </p>
        </div>
        <div className="student-nav-actions">
          <Link className="btn secondary student-nav-button" to="/student">הצטרפות לשיעור חי</Link>
          <Link className="btn secondary student-nav-button" to="/">חזרה לדף הבית</Link>
        </div>
      </section>

      <main className="workspace-grid student-workspace practice-workspace">
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

        <Visualization role="student" followLecturer={false} />
        <InsightPanel />
      </main>

      <div className="page-section-wrap">
        <PracticeQuiz />
      </div>

      <Footer />
    </div>
  );
}
