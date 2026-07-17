import { useVisualizerStore } from '../store/useVisualizerStore.js';

const spaces = [
  { key: 'polynomials', label: 'פולינומים' },
  { key: 'functions', label: 'פונקציות' },
  { key: 'matrices', label: 'מטריצות' },
];

const polynomialLabels = ['מקדם קבוע', 'מקדם x', 'מקדם x²'];

const functionPairs = [
  { key: 'trig', label: 'sin(x) / cos(x)' },
  { key: 'exponential', label: 'eˣ / e⁻ˣ' },
  { key: 'gaussian', label: 'e⁻ˣ² / x·e⁻ˣ²' },
];

function NumberInput({ label, value, onChange }) {
  return (
    <label className="poly-coef-field">
      <span>{label}</span>
      <input
        type="number"
        step="1"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}

function MatrixCellInput({ label, value, onChange }) {
  return (
    <input
      className="matrix-object-cell"
      aria-label={label}
      type="number"
      step="1"
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
    />
  );
}

function MatrixObjectEditor({ title, matrix, matrixKey, onEntryChange }) {
  return (
    <div className="matrix-object-editor">
      <div className="matrix-object-header">
        <span>{title}</span>
        <span>2×2</span>
      </div>
      <div className="matrix-object-bracket">
        <div className="matrix-object-grid">
          {matrix.map((row, rowIndex) => row.map((value, colIndex) => (
            <MatrixCellInput
              key={`${matrixKey}-${rowIndex}-${colIndex}`}
              label={`${title}, שורה ${rowIndex + 1}, עמודה ${colIndex + 1}`}
              value={value}
              onChange={(nextValue) => onEntryChange(matrixKey, rowIndex, colIndex, nextValue)}
            />
          )))}
        </div>
      </div>
    </div>
  );
}

export default function AbstractSpaceControls() {
  const abstractSpace = useVisualizerStore((s) => s.abstractSpace);
  const setAbstractSpace = useVisualizerStore((s) => s.setAbstractSpace);
  const alpha = useVisualizerStore((s) => s.alpha);
  const beta = useVisualizerStore((s) => s.beta);
  const setAlpha = useVisualizerStore((s) => s.setAlpha);
  const setBeta = useVisualizerStore((s) => s.setBeta);
  const functionPair = useVisualizerStore((s) => s.functionPair);
  const setFunctionPair = useVisualizerStore((s) => s.setFunctionPair);
  const polynomialP = useVisualizerStore((s) => s.polynomialP);
  const polynomialQ = useVisualizerStore((s) => s.polynomialQ);
  const setPolynomialCoeff = useVisualizerStore((s) => s.setPolynomialCoeff);
  const abstractMatrixA = useVisualizerStore((s) => s.abstractMatrixA);
  const abstractMatrixB = useVisualizerStore((s) => s.abstractMatrixB);
  const setAbstractMatrixEntry = useVisualizerStore((s) => s.setAbstractMatrixEntry);
  const resetAbstractObjects = useVisualizerStore((s) => s.resetAbstractObjects);

  return (
    <div className="card-section abstract-controls-card" dir="rtl">
      <div className="section-title">מרחב וקטורי אבסטרקטי</div>

      <div className="abstract-space-tabs" role="group" aria-label="בחירת מרחב וקטורי אבסטרקטי">
        {spaces.map((space) => (
          <button
            key={space.key}
            type="button"
            className={abstractSpace === space.key ? 'active' : ''}
            onClick={() => setAbstractSpace(space.key)}
          >
            {space.label}
          </button>
        ))}
      </div>

      <div className="abstract-help-text">
        בחרו סוג אובייקט ושנו את α ואת β כדי לבנות צירוף ליניארי. בדקו כיצד קואורדינטות, בסיס וסגירות פועלים גם ללא חצים גיאומטריים.
      </div>


      {abstractSpace === 'functions' && (
        <div className="function-pair-card">
          <label className="function-pair-field">
            <span>זוג פונקציות</span>
            <select value={functionPair} onChange={(e) => setFunctionPair(e.target.value)}>
              {functionPairs.map((pair) => (
                <option key={pair.key} value={pair.key}>{pair.label}</option>
              ))}
            </select>
          </label>
        </div>
      )}

      {abstractSpace === 'polynomials' && (
        <div className="poly-editor-card">
          <div className="poly-editor-header">
            <div>
              <div className="section-title small-title">עריכת פולינומים</div>
              <p>שנו את המקדמים של p(x) ושל q(x).</p>
            </div>
            <button type="button" className="btn btn-small ghost" onClick={resetAbstractObjects}>
              איפוס
            </button>
          </div>

          <div className="poly-editor-grid">
            <div className="poly-editor-group">
              <div className="poly-editor-name">p(x)</div>
              {polynomialP.map((value, index) => (
                <NumberInput
                  key={`p-${polynomialLabels[index]}`}
                  label={polynomialLabels[index]}
                  value={value}
                  onChange={(nextValue) => setPolynomialCoeff('p', index, nextValue)}
                />
              ))}
            </div>

            <div className="poly-editor-group">
              <div className="poly-editor-name">q(x)</div>
              {polynomialQ.map((value, index) => (
                <NumberInput
                  key={`q-${polynomialLabels[index]}`}
                  label={polynomialLabels[index]}
                  value={value}
                  onChange={(nextValue) => setPolynomialCoeff('q', index, nextValue)}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {abstractSpace === 'matrices' && (
        <div className="matrix-editor-card">
          <div className="poly-editor-header">
            <div>
              <div className="section-title small-title">עריכת מטריצות</div>
              <p>שנו את איברי A ו־B. התוצאה מחושבת איבר־איבר.</p>
            </div>
            <button type="button" className="btn btn-small ghost" onClick={resetAbstractObjects}>
              איפוס
            </button>
          </div>

          <div className="matrix-editor-grid">
            <MatrixObjectEditor
              title="מטריצה A"
              matrix={abstractMatrixA}
              matrixKey="a"
              onEntryChange={setAbstractMatrixEntry}
            />

            <MatrixObjectEditor
              title="מטריצה B"
              matrix={abstractMatrixB}
              matrixKey="b"
              onEntryChange={setAbstractMatrixEntry}
            />
          </div>
        </div>
      )}

      <div className="coef-row">
        <div className="coef-label">
          <span>α — מקדם האובייקט הראשון</span>
          <code>{Number(alpha).toFixed(1)}</code>
        </div>
        <input
          type="range"
          min="-3"
          max="3"
          step="0.1"
          value={alpha}
          onChange={(e) => setAlpha(Number(e.target.value))}
        />
      </div>

      <div className="coef-row">
        <div className="coef-label">
          <span>β — מקדם האובייקט השני</span>
          <code>{Number(beta).toFixed(1)}</code>
        </div>
        <input
          type="range"
          min="-3"
          max="3"
          step="0.1"
          value={beta}
          onChange={(e) => setBeta(Number(e.target.value))}
        />
      </div>
    </div>
  );
}
