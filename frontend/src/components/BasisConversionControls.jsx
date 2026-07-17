import {
  basisCoordinates2D,
  basisMatrix2D,
  determinant,
  fmt,
  inverse2x2,
  matVec,
  matrixColumns2D,
  standardFromBasisCoordinates2D,
  transitionMatrix2D,
} from '../math/linearAlgebra.js';
import { useVisualizerStore } from '../store/useVisualizerStore.js';

function MatrixMini({ matrix }) {
  return (
    <div className="basis-mini-matrix" style={{ gridTemplateColumns: `repeat(${matrix[0]?.length || 1}, minmax(34px, 1fr))` }}>
      {matrix.flat().map((value, index) => <span key={index}>{fmt(value)}</span>)}
    </div>
  );
}

function EditableMatrix({ label, matrix, onChange, disabled = false, help }) {
  return (
    <div className={`basis-editable-matrix ${disabled ? 'disabled' : ''}`}>
      <div className="basis-editable-matrix-title" dir="ltr">{label}</div>
      <div className="basis-editable-matrix-grid" dir="ltr">
        {matrix.flatMap((row, rowIndex) => row.map((value, colIndex) => (
          <input
            key={`${label}-${rowIndex}-${colIndex}`}
            type="number"
            step="0.1"
            value={Number.isFinite(value) ? Number(value.toFixed(4)) : 0}
            disabled={disabled}
            aria-label={`${label}, שורה ${rowIndex + 1}, עמודה ${colIndex + 1}`}
            onChange={(event) => onChange(rowIndex, colIndex, Number(event.target.value))}
          />
        )))}
      </div>
      {help && <div className="basis-matrix-help">{help}</div>}
    </div>
  );
}

function CoordinateInputs({ label, values, onChange, disabled = false, tone = '' }) {
  return (
    <div className={`basis-coordinate-row ${tone}`}>
      <span className="basis-coordinate-label">{label}</span>
      <div className="basis-coordinate-inputs" dir="ltr">
        {values.map((value, index) => (
          <input
            key={`${label}-${index}`}
            type="number"
            step="0.1"
            value={Number.isFinite(value) ? Number(value.toFixed(4)) : 0}
            disabled={disabled}
            onChange={(event) => onChange(index, Number(event.target.value))}
          />
        ))}
      </div>
    </div>
  );
}

function replaceMatrixCell(matrix, row, col, value) {
  return matrix.map((currentRow, rowIndex) => currentRow.map((cell, colIndex) => (
    rowIndex === row && colIndex === col ? (Number.isFinite(value) ? value : 0) : cell
  )));
}

export default function BasisConversionControls() {
  const dim = useVisualizerStore((s) => s.dim);
  const u = useVisualizerStore((s) => s.u);
  const v = useVisualizerStore((s) => s.v);
  const targetU = useVisualizerStore((s) => s.basisTargetU);
  const targetV = useVisualizerStore((s) => s.basisTargetV);
  const basisInputMode = useVisualizerStore((s) => s.basisInputMode);
  const basisTransition = useVisualizerStore((s) => s.basisTransition);
  const alpha = useVisualizerStore((s) => s.alpha);
  const beta = useVisualizerStore((s) => s.beta);
  const setCoefficients = useVisualizerStore((s) => s.setCoefficients);
  const setVector = useVisualizerStore((s) => s.setVector);
  const setBasisTargetVector = useVisualizerStore((s) => s.setBasisTargetVector);
  const setBasisInputMode = useVisualizerStore((s) => s.setBasisInputMode);
  const setBasisTransition = useVisualizerStore((s) => s.setBasisTransition);

  if (dim !== 2) {
    return (
      <div className="card-section basis-conversion-card">
        <div className="section-title">מעבר בין בסיסים</div>
        <div className="explanation rtl-explanation">
          מעבר בסיס מלא ב־R³ דורש שלושה וקטורי בסיס. בתצוגת 3D הנוכחית u ו־v מדגימים בסיס של מישור בלבד. כדי להזין שתי מטריצות בסיס, לחשב מטריצות מעבר ולבצע המרה דו־כיוונית, עברו לתצוגת 2D.
        </div>
      </div>
    );
  }

  const PB = basisMatrix2D(u, v);
  const PC = basisMatrix2D(targetU, targetV);
  const detPB = determinant(PB);
  const detPC = determinant(PC);
  const inversePB = inverse2x2(PB);
  const inversePC = inverse2x2(PC);
  const validB = Boolean(inversePB);
  const validC = Boolean(inversePC);
  const bothValid = validB && validC;
  const transitionCFromB = bothValid ? transitionMatrix2D(PB, PC) : null;
  const transitionBFromC = bothValid ? transitionMatrix2D(PC, PB) : null;
  const coordinatesB = [alpha, beta];
  const w = standardFromBasisCoordinates2D(u, v, coordinatesB);
  const coordinatesC = validC ? matVec(inversePC, w) : [0, 0];

  function updateSourceMatrix(row, col, value) {
    const next = replaceMatrixCell(PB, row, col, value);
    const columns = matrixColumns2D(next);
    setVector('u', columns.first);
    setVector('v', columns.second);
  }

  function updateTargetMatrix(row, col, value) {
    const next = replaceMatrixCell(PC, row, col, value);
    const columns = matrixColumns2D(next);
    setBasisTargetVector('basisTargetU', columns.first);
    setBasisTargetVector('basisTargetV', columns.second);
  }

  function updateTransitionMatrix(row, col, value) {
    setBasisTransition(replaceMatrixCell(basisTransition, row, col, value));
  }

  function updateBasisCoordinate(index, value) {
    const next = [...coordinatesB];
    next[index] = Number.isFinite(value) ? value : 0;
    setCoefficients(next[0], next[1]);
  }

  function updateStandardCoordinate(index, value) {
    if (!validB) return;
    const nextW = [...w];
    nextW[index] = Number.isFinite(value) ? value : 0;
    const nextCoordinates = basisCoordinates2D(u, v, nextW);
    if (nextCoordinates) setCoefficients(nextCoordinates[0], nextCoordinates[1]);
  }

  function updateTargetCoordinate(index, value) {
    if (!validB || !validC) return;
    const nextCoordinatesC = [...coordinatesC];
    nextCoordinatesC[index] = Number.isFinite(value) ? value : 0;
    const nextW = matVec(PC, nextCoordinatesC);
    const nextCoordinatesB = matVec(inversePB, nextW);
    setCoefficients(nextCoordinatesB[0], nextCoordinatesB[1]);
  }

  function setSourceBasis(matrix) {
    const columns = matrixColumns2D(matrix);
    setVector('u', columns.first);
    setVector('v', columns.second);
  }

  function setTargetBasis(matrix) {
    setBasisInputMode('bases');
    const columns = matrixColumns2D(matrix);
    setBasisTargetVector('basisTargetU', columns.first);
    setBasisTargetVector('basisTargetV', columns.second);
  }

  function useTransitionPreset(matrix) {
    setBasisInputMode('transition');
    setBasisTransition(matrix);
  }

  const transitionInputValid = Boolean(inverse2x2(basisTransition));

  function activateTransitionMode() {
    setBasisInputMode('transition');
    setBasisTransition(transitionCFromB || [[1, 0], [0, 1]]);
  }

  return (
    <div className="card-section basis-conversion-card">
      <div className="section-title">מעבר בין בסיסים</div>

      <div className="basis-intro">
        בסיס B ובסיס C הם שתי מערכות צירים לתיאור אותו וקטור גיאומטרי. מטריצת המעבר משנה את הקואורדינטות בלבד; הווקטור w במישור נשאר אותו וקטור.
      </div>

      <div className="basis-mode-toggle" role="tablist" aria-label="אופן הזנת בסיסים">
        <button
          type="button"
          className={basisInputMode === 'bases' ? 'active' : ''}
          onClick={() => setBasisInputMode('bases')}
        >
          הזנת שני בסיסים
        </button>
        <button
          type="button"
          className={basisInputMode === 'transition' ? 'active' : ''}
          onClick={activateTransitionMode}
        >
          הזנת מטריצת מעבר
        </button>
      </div>

      <div className="basis-preset-row">
        <button type="button" className="btn btn-small" onClick={() => setSourceBasis([[1, 0], [0, 1]])}>B סטנדרטי</button>
        <button type="button" className="btn btn-small" onClick={() => setTargetBasis([[1, 0], [0, 1]])}>C סטנדרטי</button>
        <button type="button" className="btn btn-small" onClick={() => setTargetBasis([[0.71, -0.71], [0.71, 0.71]])}>C מסובב 45°</button>
        <button type="button" className="btn btn-small" onClick={() => useTransitionPreset([[1, 1], [0, 1]])}>מעבר גזירה</button>
      </div>

      <div className="basis-input-grid">
        <EditableMatrix
          label="P_B = [b₁ b₂]"
          matrix={PB}
          onChange={updateSourceMatrix}
          help="עמודות המטריצה הן וקטורי הבסיס B."
        />

        {basisInputMode === 'bases' ? (
          <EditableMatrix
            label="P_C = [c₁ c₂]"
            matrix={PC}
            onChange={updateTargetMatrix}
            help="שנו את בסיס היעד C באופן ישיר."
          />
        ) : (
          <EditableMatrix
            label="T(C←B)"
            matrix={basisTransition}
            onChange={updateTransitionMatrix}
            help="המערכת גוזרת ממנו את P_C כך ש־[w]C=T(C←B)[w]B."
          />
        )}
      </div>

      {basisInputMode === 'transition' && (
        <div className={`basis-validity ${transitionInputValid ? 'valid' : 'invalid'}`}>
          {transitionInputValid
            ? 'מטריצת המעבר הפיכה. בסיס C נגזר ממנה ומוצג מיד בגרף ובטבלאות.'
            : 'מטריצת מעבר בין בסיסים חייבת להיות הפיכה. כל עוד הדטרמיננטה אפס, בסיס C האחרון נשמר.'}
        </div>
      )}

      <div className="basis-validity-grid">
        <div className={`basis-validity ${validB ? 'valid' : 'invalid'}`}>
          {validB ? `B הוא בסיס תקין: det(P_B)=${fmt(detPB)}.` : 'B אינו בסיס: וקטורי העמודות תלויים ליניארית.'}
        </div>
        <div className={`basis-validity ${validC ? 'valid' : 'invalid'}`}>
          {validC ? `C הוא בסיס תקין: det(P_C)=${fmt(detPC)}.` : 'C אינו בסיס: וקטורי העמודות תלויים ליניארית.'}
        </div>
      </div>

      <div className="basis-matrix-grid expanded">
        <div className="basis-matrix-block">
          <span>P_B</span>
          <MatrixMini matrix={PB} />
        </div>
        <div className="basis-matrix-block">
          <span>P_C</span>
          <MatrixMini matrix={PC} />
        </div>
        <div className="basis-matrix-block">
          <span>T(C←B)=P_C⁻¹P_B</span>
          {transitionCFromB ? <MatrixMini matrix={transitionCFromB} /> : <div className="basis-no-inverse">לא קיימת</div>}
        </div>
        <div className="basis-matrix-block">
          <span>T(B←C)=P_B⁻¹P_C</span>
          {transitionBFromC ? <MatrixMini matrix={transitionBFromC} /> : <div className="basis-no-inverse">לא קיימת</div>}
        </div>
      </div>

      <div className="basis-coordinate-section">
        <div className="basis-subtitle">אותו וקטור בשלוש מערכות קואורדינטות</div>
        <CoordinateInputs label="[w]B" values={coordinatesB} onChange={updateBasisCoordinate} disabled={!validB} tone="basis-b-tone" />
        <CoordinateInputs label="[w]std" values={w} onChange={updateStandardCoordinate} disabled={!validB} />
        <CoordinateInputs label="[w]C" values={coordinatesC} onChange={updateTargetCoordinate} disabled={!bothValid} tone="basis-c-tone" />
      </div>

      <div className="basis-formulas" dir="ltr">
        <code>[w]std = P_B · [w]B = P_C · [w]C</code>
        <code>[w]C = P_C⁻¹ · P_B · [w]B = T(C←B) · [w]B</code>
        <code>[w]B = T(B←C) · [w]C</code>
      </div>

      <div className="basis-drag-hint">
        אפשר לגרור בגרף את b₁, b₂, c₁, c₂ ואת w. גרירת בסיס משנה את מטריצות המעבר; גרירת w מעדכנת בו־זמנית את [w]B ואת [w]C.
      </div>
    </div>
  );
}
