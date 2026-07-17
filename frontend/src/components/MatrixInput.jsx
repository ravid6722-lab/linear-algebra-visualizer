import { PRESET_NAMES, useVisualizerStore } from '../store/useVisualizerStore.js';

const presetLabels = {
  identity: 'יחידה',
  scale: 'מתיחה',
  rotate: 'סיבוב',
  shear: 'גזירה',
  reflect: 'שיקוף',
  collapse: 'קריסה',
};

function updateCell(A, row, col, value) {
  return A.map((r, i) => r.map((cell, j) => (i === row && j === col ? Number(value) : cell)));
}

export default function MatrixInput() {
  const dim = useVisualizerStore((s) => s.dim);
  const A = useVisualizerStore((s) => s.A);
  const concept = useVisualizerStore((s) => s.concept);
  const setMatrix = useVisualizerStore((s) => s.setMatrix);
  const applyPreset = useVisualizerStore((s) => s.applyPreset);
  const showPlaneCombinations = useVisualizerStore((s) => s.showPlaneCombinations);
  const setShowPlaneCombinations = useVisualizerStore((s) => s.setShowPlaneCombinations);

  const matrixRelevantConcepts = ['transformation', 'determinant', 'eigen'];
  const isMatrixRelevant = matrixRelevantConcepts.includes(concept);

  return (
    <div className={`card-section matrix-input-card ${!isMatrixRelevant ? 'matrix-input-disabled' : ''}`} dir="rtl">
      <div className="section-title">
        מטריצה A
        <span id="matrixSizeLbl" className="matrix-size-label">
          {dim}×{dim}
        </span>
      </div>

      <div className="matrix-grid" dir="ltr" style={{ gridTemplateColumns: `repeat(${dim}, 1fr)` }}>
        {A.map((row, rowIndex) =>
          row.map((value, colIndex) => (
            <input
              key={`${rowIndex}-${colIndex}`}
              className="matrix-cell"
              aria-label={`איבר בשורה ${rowIndex + 1}, עמודה ${colIndex + 1}`}
              type="number"
              step="0.1"
              value={value}
              disabled={!isMatrixRelevant}
              onChange={(e) => setMatrix(updateCell(A, rowIndex, colIndex, e.target.value))}
            />
          ))
        )}
      </div>

      <div className="preset-grid">
        {PRESET_NAMES.map((name) => (
          <button key={name} type="button" className="preset-btn" disabled={!isMatrixRelevant} onClick={() => applyPreset(name)}>
            {presetLabels[name] || name}
          </button>
        ))}
      </div>

      {!isMatrixRelevant && (
        <div className="matrix-disabled-hint">מטריצה A אינה משתתפת בנושא שנבחר.</div>
      )}
      {isMatrixRelevant && dim === 2 && (
        <>
          <label className="plane-combination-toggle">
            <input
              type="checkbox"
              checked={showPlaneCombinations}
              onChange={(event) => setShowPlaneCombinations(event.target.checked)}
            />
            <span>הצג את המישור כצירופים ליניאריים של עמודות A</span>
          </label>
          <div className="matrix-disabled-hint drag-enabled-hint">אפשר לגרור על הגרף את קצות הווקטורים A·e₁ ו־A·e₂ כדי לשנות את עמודות המטריצה.</div>
        </>
      )}
    </div>
  );
}
