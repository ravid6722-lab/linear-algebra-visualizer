import { useVisualizerStore } from '../store/useVisualizerStore.js';

function updateIndex(arr, index, value) {
  return arr.map((cell, i) => (i === index ? Number(value) : cell));
}

function VectorRow({ label, labelClass, values, dim, onChange, disabled = false, hint = '' }) {
  return (
    <div className={`vector-row ${disabled ? 'vector-row-disabled' : ''}`}>
      <span className={`vec-label ${labelClass}`}>{label}</span>
      <div className="vector-values-wrap">
        <div className="vector-values" dir="ltr" aria-label={`ערכי הווקטור ${label}`}>
          {values.slice(0, dim).map((value, index) => (
            <input
              key={`${label}-${index}`}
              className="vec-input"
              type="number"
              step="0.1"
              value={value}
              disabled={disabled}
              onChange={(e) => onChange(index, e.target.value)}
            />
          ))}
        </div>
        {disabled && hint ? <div className="vector-disabled-hint">{hint}</div> : null}
      </div>
    </div>
  );
}

export default function VectorInput() {
  const dim = useVisualizerStore((s) => s.dim);
  const concept = useVisualizerStore((s) => s.concept);
  const v = useVisualizerStore((s) => s.v);
  const u = useVisualizerStore((s) => s.u);
  const alpha = useVisualizerStore((s) => s.alpha);
  const beta = useVisualizerStore((s) => s.beta);
  const setVector = useVisualizerStore((s) => s.setVector);
  const setAlpha = useVisualizerStore((s) => s.setAlpha);
  const setBeta = useVisualizerStore((s) => s.setBeta);
  const uRelevantConcepts = ['combination', 'span', 'basis'];
  const isURelevant = uRelevantConcepts.includes(concept);
  const isVRelevant = concept !== 'determinant';
  const areCoefficientsRelevant = ['combination', 'basis'].includes(concept);

  return (
    <div className="card-section vector-input-card" dir="rtl">
      <div className="section-title">וקטורים ומקדמים</div>

      <div className="vector-stack">
        <VectorRow
          label="v"
          labelClass="v"
          values={v}
          dim={dim}
          disabled={!isVRelevant}
          hint="הווקטור v אינו משתתף בהדגמת הדטרמיננטה."
          onChange={(index, value) => setVector('v', updateIndex(v, index, value))}
        />

        <VectorRow
          label="u"
          labelClass="u"
          values={u}
          dim={dim}
          disabled={!isURelevant}
          hint="הווקטור u משמש בצירופים ליניאריים, במרחב נפרס ובבסיס."
          onChange={(index, value) => setVector('u', updateIndex(u, index, value))}
        />
      </div>

      <div className={`coef-row ${!areCoefficientsRelevant ? 'coef-row-disabled' : ''}`}>
        <div className="coef-label">
          <span>α — המקדם של u</span>
          <code>{Number(alpha).toFixed(1)}</code>
        </div>
        <input
          type="range"
          min="-5"
          max="5"
          step="0.1"
          value={alpha}
          disabled={!areCoefficientsRelevant}
          onChange={(e) => setAlpha(Number(e.target.value))}
        />
        {!areCoefficientsRelevant && <div className="coef-disabled-hint">המקדם α אינו נדרש בנושא שנבחר.</div>}
      </div>

      <div className={`coef-row ${!areCoefficientsRelevant ? 'coef-row-disabled' : ''}`}>
        <div className="coef-label">
          <span>β — המקדם של v</span>
          <code>{Number(beta).toFixed(1)}</code>
        </div>
        <input
          type="range"
          min="-5"
          max="5"
          step="0.1"
          value={beta}
          disabled={!areCoefficientsRelevant}
          onChange={(e) => setBeta(Number(e.target.value))}
        />
        {!areCoefficientsRelevant && <div className="coef-disabled-hint">המקדם β אינו נדרש בנושא שנבחר.</div>}
      </div>

      {dim === 2 && isVRelevant && (
        <div className="basis-drag-hint">העיגולים בקצות החצים הם נקודות גרירה. שינוי גיאומטרי על הגרף יעדכן מיד את הערכים האלגבריים.</div>
      )}
    </div>
  );
}
