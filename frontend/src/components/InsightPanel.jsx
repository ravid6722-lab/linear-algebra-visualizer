import {
  basisMatrix2D,
  classifyTransform,
  classifyTransform3,
  currentDet,
  fmt,
  formatVector,
  inverse,
  inverse2x2,
  isInvertible,
  linComb,
  matVec,
  multiply,
  standardFromBasisCoordinates2D,
  transitionMatrix2D,
} from '../math/linearAlgebra.js';
import { useVisualizerStore } from '../store/useVisualizerStore.js';

const conceptLabels = {
  transformation: 'טרנספורמציה',
  combination: 'צירוף ליניארי',
  determinant: 'דטרמיננטה',
  eigen: 'וקטורים עצמיים',
  span: 'מרחב נפרס',
  basis: 'מעבר בסיס',
  abstract: 'מרחבים אבסטרקטיים',
};

const transformTypeLabels = {
  Identity: 'העתקת הזהות',
  'Collapse / Projection': 'קריסה או הטלה לממד נמוך יותר',
  'Collapse / lower-rank': 'קריסה או העתקה מדרגה נמוכה',
  'Uniform scaling': 'מתיחה אחידה',
  'Non-uniform scaling': 'מתיחה לא אחידה',
  Rotation: 'סיבוב',
  Reflection: 'שיקוף',
  'Reflection / orientation flip': 'שיקוף או היפוך אוריינטציה',
  'Orientation-flipping map': 'העתקה שהופכת אוריינטציה',
  'Shear-like': 'העתקה דמוית גזירה',
  'General linear map': 'העתקה ליניארית כללית',
};

function MatrixDisplay({ matrix, label }) {
  const columns = matrix[0]?.length || 1;
  return (
    <div className="insight-matrix-wrap" dir="ltr">
      {label && <div className="insight-matrix-label">{label}</div>}
      <div className="matrix-display" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {matrix.flat().map((value, index) => <span key={index}>{fmt(value)}</span>)}
      </div>
    </div>
  );
}

function VectorReadout({ children }) {
  return <div className="vector-readout" dir="ltr">{children}</div>;
}

function Stat({ label, value, tone = '', wide = false }) {
  return (
    <div className="stat" style={wide ? { gridColumn: '1 / -1' } : undefined}>
      <div className="k">{label}</div>
      <div className={`v ${tone}`}>{value}</div>
    </div>
  );
}

function PanelShell({ badge, children }) {
  return (
    <aside className="right-panel" dir="rtl">
      <div className="card">
        <div className="card-section">
          <div className="section-title">תובנות בזמן אמת <span className="pill">{badge}</span></div>
          {children}
        </div>
      </div>
    </aside>
  );
}

function vectorNorm(vec, dim) {
  return Math.hypot(...vec.slice(0, dim));
}

function spanMeasure(u, v, dim) {
  if (dim === 3) {
    const cross = [
      u[1] * v[2] - u[2] * v[1],
      u[2] * v[0] - u[0] * v[2],
      u[0] * v[1] - u[1] * v[0],
    ];
    return Math.hypot(...cross);
  }
  return Math.abs(u[0] * v[1] - u[1] * v[0]);
}

function spanSpaceLabel(u, v, dim) {
  const tolerance = 0.05;
  const uNorm = vectorNorm(u, dim);
  const vNorm = vectorNorm(v, dim);
  const measure = spanMeasure(u, v, dim);
  if (uNorm < tolerance && vNorm < tolerance) return '{0} — רק וקטור האפס';
  if (measure < tolerance) return 'ישר העובר דרך הראשית';
  return dim === 3 ? 'מישור העובר דרך הראשית בתוך R³' : 'כל המרחב R²';
}

function eigenTestInfo(v, Av, dim) {
  const tolerance = 0.05;
  const vv = v.slice(0, dim);
  const av = Av.slice(0, dim);
  const vNorm = vectorNorm(vv, dim);
  const avNorm = vectorNorm(av, dim);
  if (vNorm < tolerance) return { testable: false, collinear: false, lambda: null };

  const denominator = vv.reduce((sum, value) => sum + value * value, 0);
  const dot = vv.reduce((sum, value, index) => sum + value * av[index], 0);
  const lambda = dot / denominator;
  const residual = av.map((value, index) => value - lambda * vv[index]);
  const residualNorm = vectorNorm(residual, dim);
  const collinear = residualNorm <= tolerance * Math.max(1, avNorm);
  return { testable: true, collinear, lambda };
}

function AbstractInsight({ space, alpha, beta }) {
  const labels = {
    polynomials: 'פולינומים',
    functions: 'פונקציות',
    matrices: 'מטריצות',
  };
  const explanations = {
    polynomials: 'פולינום ממעלה לכל היותר 2 מיוצג באמצעות וקטור המקדמים שלו. חיבור וכפל בסקלר נעשים מקדם־מקדם, ולכן התוצאה נשארת באותו מרחב.',
    functions: 'פונקציות יוצרות מרחב וקטורי כאשר החיבור והכפל בסקלר מוגדרים נקודתית: לכל x מחשבים αf(x)+βg(x).',
    matrices: 'מטריצות בגודל קבוע יוצרות מרחב וקטורי. אפשר לחשוב על מטריצה 2×2 כעל וקטור בעל ארבע קואורדינטות.',
  };

  return (
    <PanelShell badge="מרחבים אבסטרקטיים">
      <div className="abstract-insight-callout">
        <strong>וקטור אינו חייב להיות חץ גיאומטרי.</strong>
        <span> הוא יכול להיות כל אובייקט שמוגדרים עליו חיבור וכפל בסקלר ומתקיימות אקסיומות המרחב הווקטורי.</span>
      </div>
      <div className="stat-grid" style={{ marginTop: 14 }}>
        <Stat label="המרחב שנבחר" value={labels[space]} />
        <Stat label="הפעולה" value="α·אובייקט₁ + β·אובייקט₂" />
        <Stat label="α" value={fmt(alpha)} />
        <Stat label="β" value={fmt(beta)} />
      </div>
      <div className="insight-subsection">
        <div className="section-title">הסבר</div>
        <div className="explanation rtl-explanation">{explanations[space]}</div>
      </div>
      <div className="insight-subsection">
        <div className="section-title">הקשר לאלגברה ליניארית</div>
        <div className="explanation rtl-explanation">
          אותם מושגים—צירוף ליניארי, פריסה, תלות ליניארית, בסיס וקואורדינטות—חלים גם על פולינומים, פונקציות ומטריצות. ההבדל הוא רק בסוג האובייקט, לא בחוקים האלגבריים.
        </div>
      </div>
    </PanelShell>
  );
}

function DeterminantInsight({ A, det }) {
  const areaScale = Math.abs(det);
  const invertible = Math.abs(det) > 1e-6;
  const reversed = det < -0.05;
  const explanation = Math.abs(det) < 0.05
    ? 'הדטרמיננטה קרובה לאפס. השטח או הנפח קורסים, ולכן המטריצה אינה הפיכה.'
    : det < 0
      ? `הטרנספורמציה משנה שטח או נפח פי ${fmt(areaScale)} וגם הופכת את האוריינטציה.`
      : `הטרנספורמציה משנה שטח או נפח פי ${fmt(areaScale)} ושומרת על האוריינטציה.`;

  return (
    <PanelShell badge="דטרמיננטה">
      <div className="abstract-insight-callout">
        <strong>הדטרמיננטה מתארת את גורם שינוי השטח או הנפח.</strong>
        <span> ב־2D מסתכלים על ריבוע יחידה שהופך למקבילית; ב־3D על קוביית יחידה שהופכת למקבילון.</span>
      </div>
      <div className="insight-subsection">
        <div className="section-title">המטריצה הנוכחית</div>
        <MatrixDisplay matrix={A} label="A" />
      </div>
      <div className="stat-grid">
        <Stat label="det(A)" value={fmt(det)} />
        <Stat label="|det(A)|" value={areaScale < 0.05 ? '≈ 0' : fmt(areaScale)} />
        <Stat label="המטריצה הפיכה?" value={invertible ? 'כן' : 'לא'} tone={invertible ? 'ok' : 'bad'} />
        <Stat label="היפוך אוריינטציה?" value={reversed ? 'כן' : 'לא'} tone={reversed ? 'bad' : 'ok'} />
      </div>
      <div className="insight-subsection">
        <div className="section-title">פירוש</div>
        <div className="explanation rtl-explanation">{explanation}</div>
      </div>
    </PanelShell>
  );
}

function CombinationInsight({ u, v, alpha, beta }) {
  const alphaU = u.map((value) => alpha * value);
  const betaV = v.map((value) => beta * value);
  const result = linComb(alpha, u, beta, v);

  return (
    <PanelShell badge="צירוף ליניארי">
      <div className="abstract-insight-callout">
        <strong>הווקטור החדש מתקבל מחיבור αu ו־βv.</strong>
        <span> שינוי המקדמים משנה את האורך ואת הכיוון של כל רכיב, ולכן גם את הווקטור הסופי.</span>
      </div>
      <div className="stat-grid" style={{ marginTop: 14 }}>
        <Stat label="α" value={fmt(alpha)} />
        <Stat label="β" value={fmt(beta)} />
        <Stat label="הפעולה" value="αu + βv" wide />
      </div>
      <div className="insight-subsection">
        <div className="section-title">נתונים אלגבריים</div>
        <VectorReadout>
          <div><b>u</b> = {formatVector(u)}</div>
          <div><b>v</b> = {formatVector(v)}</div>
          <div><b>αu</b> = {formatVector(alphaU)}</div>
          <div><b>βv</b> = {formatVector(betaV)}</div>
          <div><b>αu + βv</b> = {formatVector(result)}</div>
        </VectorReadout>
      </div>
      <div className="insight-subsection">
        <div className="section-title">קשר לגרף</div>
        <div className="explanation rtl-explanation">גרירת u או v משנה את הווקטורים עצמם. גרירת הווקטור הסופי, כאשר u ו־v בלתי תלויים, מחשבת מחדש את α ואת β.</div>
      </div>
    </PanelShell>
  );
}

function SpanInsight({ u, v, dim }) {
  const measure = spanMeasure(u, v, dim);
  const independent = measure > 0.05;
  const spanLabel = spanSpaceLabel(u, v, dim);

  return (
    <PanelShell badge="מרחב נפרס">
      <div className="abstract-insight-callout">
        <strong>המרחב הנפרס הוא אוסף כל הצירופים αu+βv.</strong>
        <span> אם הווקטורים תלויים ליניארית מתקבל ישר; אם הם בלתי תלויים מתקבל R² או מישור בתוך R³.</span>
      </div>
      <div className="stat-grid" style={{ marginTop: 14 }}>
        <Stat label={dim === 3 ? 'שטח המקבילית' : '|det([u v])|'} value={measure < 0.05 ? '≈ 0' : fmt(measure)} />
        <Stat label="בלתי תלויים?" value={independent ? 'כן' : 'לא'} tone={independent ? 'ok' : 'bad'} />
        <Stat label="span{u,v}" value={spanLabel} wide />
      </div>
      <div className="insight-subsection">
        <div className="section-title">וקטורים</div>
        <VectorReadout>
          <div><b>u</b> = {formatVector(u)}</div>
          <div><b>v</b> = {formatVector(v)}</div>
        </VectorReadout>
      </div>
      <div className="insight-subsection">
        <div className="section-title">תרגול נפרד</div>
        <div className="explanation rtl-explanation">שנו או גררו כל וקטור בנפרד ובדקו מתי המרחב עובר מישר למישור. כך ניתן להתמקד בפריסה בלי לערב מטריצת טרנספורמציה.</div>
      </div>
    </PanelShell>
  );
}

function BasisInsight({ u, v, targetU, targetV, alpha, beta, dim }) {
  const measureB = spanMeasure(u, v, dim);
  const independentB = measureB > 0.05;
  const coordinatesB = [alpha, beta];
  const w = linComb(alpha, u, beta, v);
  const alphaU = u.map((value) => alpha * value);
  const betaV = v.map((value) => beta * value);
  const PB = dim === 2 ? basisMatrix2D(u, v) : [u.slice(0, 3), v.slice(0, 3)].map((_, row) => [u[row] ?? 0, v[row] ?? 0]);
  const PC = dim === 2 ? basisMatrix2D(targetU, targetV) : null;
  const inversePB = dim === 2 ? inverse2x2(PB) : null;
  const inversePC = dim === 2 ? inverse2x2(PC) : null;
  const independentC = Boolean(inversePC);
  const verifiedW = dim === 2 ? standardFromBasisCoordinates2D(u, v, coordinatesB) : w;
  const coordinatesC = inversePC ? matVec(inversePC, verifiedW) : null;
  const transitionCFromB = inversePB && inversePC ? transitionMatrix2D(PB, PC) : null;
  const transitionBFromC = inversePB && inversePC ? transitionMatrix2D(PC, PB) : null;

  return (
    <PanelShell badge="בסיסים ומטריצות מעבר">
      <div className="abstract-insight-callout">
        <strong>אותו וקטור גיאומטרי נשאר קבוע, אבל רשימת הקואורדינטות משתנה עם בחירת הבסיס.</strong>
        <span> בסיס B ובסיס C הם שתי מערכות צירים. מטריצת המעבר ממירה בין [w]B לבין [w]C בלי להזיז את w במישור.</span>
      </div>

      <div className="stat-grid" style={{ marginTop: 14 }}>
        <Stat label="B תקין?" value={dim === 3 ? (independentB ? 'כן, עבור מישור' : 'לא') : (independentB ? 'כן' : 'לא')} tone={independentB ? 'ok' : 'bad'} />
        <Stat label="C תקין?" value={dim === 2 ? (independentC ? 'כן' : 'לא') : 'זמין ב־2D'} tone={dim === 2 && independentC ? 'ok' : 'bad'} />
        <Stat label="[w]B" value={`(${fmt(alpha)}, ${fmt(beta)})`} />
        <Stat label="[w]std" value={formatVector(verifiedW)} />
        <Stat label="[w]C" value={coordinatesC ? formatVector(coordinatesC) : 'לא מוגדר'} wide />
      </div>

      <div className="insight-subsection">
        <div className="section-title">מטריצות הבסיס</div>
        <MatrixDisplay matrix={PB} label="P_B = [b₁ b₂]" />
        {dim === 2 && <MatrixDisplay matrix={PC} label="P_C = [c₁ c₂]" />}
        {dim === 3 && <div className="explanation rtl-explanation">ב־R³ שני וקטורים מגדירים בסיס של מישור בלבד. לבסיס מלא של R³ נדרש וקטור שלישי.</div>}
      </div>

      {dim === 2 && (
        <div className="insight-subsection">
          <div className="section-title">מטריצות המעבר</div>
          {transitionCFromB ? (
            <>
              <MatrixDisplay matrix={transitionCFromB} label="T(C←B) = P_C⁻¹P_B" />
              <MatrixDisplay matrix={transitionBFromC} label="T(B←C) = P_B⁻¹P_C" />
            </>
          ) : (
            <div className="explanation rtl-explanation">מטריצת מעבר קיימת רק כאשר שני הבסיסים תקינים, כלומר שתי מטריצות הבסיס הפיכות.</div>
          )}
        </div>
      )}

      <div className="basis-equation-panel" dir="ltr">
        <code>[w]std = P_B · [w]B</code>
        {coordinatesC && <code>[w]std = P_C · [w]C</code>}
        {transitionCFromB && <code>[w]C = T(C←B) · [w]B</code>}
        {transitionBFromC && <code>[w]B = T(B←C) · [w]C</code>}
      </div>

      <div className="insight-subsection">
        <div className="section-title">פירוק בבסיס B</div>
        <VectorReadout>
          <div><b>b₁</b> = {formatVector(u)}</div>
          <div><b>b₂</b> = {formatVector(v)}</div>
          <div><b>αb₁</b> = {formatVector(alphaU)}</div>
          <div><b>βb₂</b> = {formatVector(betaV)}</div>
          <div><b>w</b> = {formatVector(w)}</div>
        </VectorReadout>
      </div>

      {coordinatesC && (
        <div className="insight-subsection">
          <div className="section-title">פירוק בבסיס C</div>
          <VectorReadout>
            <div><b>c₁</b> = {formatVector(targetU)}</div>
            <div><b>c₂</b> = {formatVector(targetV)}</div>
            <div><b>[w]C</b> = {formatVector(coordinatesC)}</div>
            <div><b>w</b> = {fmt(coordinatesC[0])}c₁ + {fmt(coordinatesC[1])}c₂</div>
          </VectorReadout>
        </div>
      )}

      <div className="insight-subsection">
        <div className="section-title">מה כדאי לבדוק?</div>
        <div className="explanation rtl-explanation">שנו את B או את C וראו כיצד מטריצת המעבר והקואורדינטות משתנות. לאחר מכן שנו את [w]B, את [w]C או גררו את w: כל שלוש הדרכים מתארות את אותו וקטור במישור.</div>
      </div>
    </PanelShell>
  );
}

function TransformationInsight({ A, v, concept, dim }) {
  const det = currentDet(A);
  const invertible = isInvertible(A);
  const inverseA = inverse(A);
  const Av = multiply(A, v);
  const rawType = dim === 3 ? classifyTransform3(A) : classifyTransform(A);
  const typeLabel = transformTypeLabels[rawType] || rawType;
  const eigenTest = eigenTestInfo(v, Av, dim);

  return (
    <PanelShell badge={conceptLabels[concept]}>
      <div className="abstract-insight-callout">
        <strong>{concept === 'eigen' ? 'וקטור עצמי שומר על הכיוון שלו תחת הטרנספורמציה.' : 'עמודות המטריצה קובעות לאן נשלחים וקטורי הבסיס הסטנדרטי.'}</strong>
        <span>{concept === 'eigen' ? ' במקרה כזה A·v=λv.' : ' גרירת A·e₁ או A·e₂ על הגרף משנה ישירות את עמודות A.'}</span>
      </div>

      <div className="insight-subsection">
        <div className="section-title">המטריצה הנוכחית</div>
        <MatrixDisplay matrix={A} label="A" />
      </div>

      <div className="stat-grid">
        <Stat label="det(A)" value={fmt(det)} />
        <Stat label="הפיכה?" value={invertible ? 'כן' : 'לא'} tone={invertible ? 'ok' : 'bad'} />
        <Stat label="סוג הטרנספורמציה" value={typeLabel} wide />
        {concept === 'eigen' && (
          <>
            <Stat label="v ו־A·v באותו כיוון?" value={eigenTest.collinear ? 'כן' : 'לא'} tone={eigenTest.collinear ? 'ok' : 'bad'} />
            <Stat label="v וקטור עצמי?" value={eigenTest.collinear ? 'כן' : 'לא'} tone={eigenTest.collinear ? 'ok' : 'bad'} />
            <Stat label="λ" value={eigenTest.collinear ? fmt(eigenTest.lambda) : 'לא מוגדר עבור v זה'} wide />
          </>
        )}
      </div>

      <div className="insight-subsection">
        <div className="section-title">המטריצה ההפוכה</div>
        {inverseA ? <MatrixDisplay matrix={inverseA} label="A⁻¹" /> : <div className="explanation rtl-explanation">A⁻¹ אינה קיימת מפני ש־det(A)={fmt(det)}.</div>}
      </div>

      <div className="insight-subsection">
        <div className="section-title">וקטור לדוגמה</div>
        <VectorReadout>
          <div><b>v</b> = {formatVector(v)}</div>
          <div><b>A·v</b> = {formatVector(Av)}</div>
          {concept === 'eigen' && <div><b>A·v = λv?</b> {eigenTest.collinear ? 'כן' : 'לא'}</div>}
        </VectorReadout>
      </div>
    </PanelShell>
  );
}

export default function InsightPanel() {
  const dim = useVisualizerStore((s) => s.dim);
  const concept = useVisualizerStore((s) => s.concept);
  const A = useVisualizerStore((s) => s.A);
  const v = useVisualizerStore((s) => s.v);
  const u = useVisualizerStore((s) => s.u);
  const alpha = useVisualizerStore((s) => s.alpha);
  const basisTargetU = useVisualizerStore((s) => s.basisTargetU);
  const basisTargetV = useVisualizerStore((s) => s.basisTargetV);
  const beta = useVisualizerStore((s) => s.beta);
  const abstractSpace = useVisualizerStore((s) => s.abstractSpace);

  if (concept === 'abstract') return <AbstractInsight space={abstractSpace} alpha={alpha} beta={beta} />;
  if (concept === 'determinant') return <DeterminantInsight A={A} det={currentDet(A)} />;
  if (concept === 'combination') return <CombinationInsight u={u} v={v} alpha={alpha} beta={beta} />;
  if (concept === 'span') return <SpanInsight u={u} v={v} dim={dim} />;
  if (concept === 'basis') return <BasisInsight u={u} v={v} targetU={basisTargetU} targetV={basisTargetV} alpha={alpha} beta={beta} dim={dim} />;
  return <TransformationInsight A={A} v={v} concept={concept} dim={dim} />;
}
