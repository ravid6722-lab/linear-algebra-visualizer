import { fmt } from '../math/linearAlgebra.js';
import React from 'react';
import { useVisualizerStore } from '../store/useVisualizerStore.js';

function combineArrays(alpha, a, beta, b) {
  return a.map((value, index) => alpha * value + beta * b[index]);
}

function combineMatrices(alpha, A, beta, B) {
  return A.map((row, rowIndex) => row.map((value, colIndex) => alpha * value + beta * B[rowIndex][colIndex]));
}

function polynomialToText(coeffs, name = '') {
  const [a, b, c] = coeffs;
  const pieces = [
    `${fmt(a)}`,
    `${fmt(b)}x`,
    `${fmt(c)}x²`,
  ];
  return `${name ? `${name}(x) = ` : ''}${pieces.join(' + ').replace(/\+ -/g, '- ')}`;
}


function polynomialValue(coeffs, x) {
  const [a, b, c] = coeffs;
  return a + b * x + c * x * x;
}

function makePolynomialPath(coeffs, range) {
  const width = 440;
  const height = 190;
  const points = [];
  const minX = -5;
  const maxX = 5;
  const minY = range.minY;
  const maxY = range.maxY;

  for (let i = 0; i <= 120; i += 1) {
    const ratio = i / 120;
    const x = minX + ratio * (maxX - minX);
    const y = polynomialValue(coeffs, x);
    const px = ratio * width;
    const py = height - ((y - minY) / (maxY - minY)) * height;
    points.push(`${px.toFixed(1)},${py.toFixed(1)}`);
  }

  return `M ${points.join(' L ')}`;
}

function getPolynomialRange(polynomialP, polynomialQ, result) {
  const values = [];
  for (let i = 0; i <= 120; i += 1) {
    const x = -5 + (i / 120) * 10;
    values.push(
      polynomialValue(polynomialP, x),
      polynomialValue(polynomialQ, x),
      polynomialValue(result, x),
    );
  }

  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const span = Math.max(rawMax - rawMin, 1);
  const padding = span * 0.12;

  return {
    minY: rawMin - padding,
    maxY: rawMax + padding,
  };
}

function PolynomialGraph({ polynomialP, polynomialQ, result }) {
  const range = getPolynomialRange(polynomialP, polynomialQ, result);
  const width = 440;
  const height = 190;
  const minX = -5;
  const maxX = 5;
  const ySpan = range.maxY - range.minY;
  const zeroX = ((0 - minX) / (maxX - minX)) * width;
  const zeroY = height - ((0 - range.minY) / ySpan) * height;
  const clampedZeroY = Math.max(0, Math.min(height, zeroY));

  return (
    <div className="function-plot-card polynomial-plot-card" aria-label="גרף של צירוף ליניארי של פולינומים">
      <div className="plot-title-row">
        <div>
          <div className="abstract-object-title">תצוגת גרף</div>
          <div className="plot-caption">אותם אובייקטים אבסטרקטיים מוצגים גם כעקומות בתחום x ∈ [-5,5].</div>
        </div>
      </div>
      <svg viewBox="0 0 440 190" role="img">
        <line x1="0" y1={clampedZeroY} x2="440" y2={clampedZeroY} className="plot-axis" />
        <line x1={zeroX} y1="0" x2={zeroX} y2="190" className="plot-axis" />
        <path d={makePolynomialPath(polynomialP, range)} className="plot-line plot-f" />
        <path d={makePolynomialPath(polynomialQ, range)} className="plot-line plot-g" />
        <path d={makePolynomialPath(result, range)} className="plot-line plot-h" />
      </svg>
      <div className="plot-legend">
        <span><i className="legend-dot f" />p(x)</span>
        <span><i className="legend-dot g" />q(x)</span>
        <span><i className="legend-dot h" />r(x) = αp(x) + βq(x)</span>
      </div>
    </div>
  );
}


const functionPairs = {
  trig: {
    title: 'פונקציות טריגונומטריות',
    fLabel: 'f(x) = sin(x)',
    gLabel: 'g(x) = cos(x)',
    shortF: 'sin(x)',
    shortG: 'cos(x)',
    domain: [-Math.PI, Math.PI],
    f: (x) => Math.sin(x),
    g: (x) => Math.cos(x),
  },
  exponential: {
    title: 'גידול ודעיכה מעריכיים',
    fLabel: 'f(x) = eˣ',
    gLabel: 'g(x) = e⁻ˣ',
    shortF: 'eˣ',
    shortG: 'e⁻ˣ',
    domain: [-2.5, 2.5],
    f: (x) => Math.exp(x),
    g: (x) => Math.exp(-x),
  },
  gaussian: {
    title: 'פונקציות דמויות גאוס',
    fLabel: 'f(x) = e⁻ˣ²',
    gLabel: 'g(x) = x·e⁻ˣ²',
    shortF: 'e⁻ˣ²',
    shortG: 'x·e⁻ˣ²',
    domain: [-3, 3],
    f: (x) => Math.exp(-x * x),
    g: (x) => x * Math.exp(-x * x),
  },
};

function getFunctionRange(pair, alpha, beta) {
  const values = [];
  const [minX, maxX] = pair.domain;

  for (let i = 0; i <= 120; i += 1) {
    const x = minX + (i / 120) * (maxX - minX);
    const f = pair.f(x);
    const g = pair.g(x);
    values.push(f, g, alpha * f + beta * g);
  }

  const rawMin = Math.min(...values, 0);
  const rawMax = Math.max(...values, 0);
  const span = Math.max(rawMax - rawMin, 1);
  const padding = span * 0.12;

  return {
    minY: rawMin - padding,
    maxY: rawMax + padding,
  };
}

function makeFunctionPath(fn, domain, range) {
  const width = 440;
  const height = 170;
  const points = [];
  const [minX, maxX] = domain;
  const minY = range.minY;
  const maxY = range.maxY;

  for (let i = 0; i <= 120; i += 1) {
    const ratio = i / 120;
    const x = minX + ratio * (maxX - minX);
    const y = fn(x);
    const px = ratio * width;
    const py = height - ((y - minY) / (maxY - minY)) * height;
    points.push(`${px.toFixed(1)},${py.toFixed(1)}`);
  }

  return `M ${points.join(' L ')}`;
}

function FormulaCard({ title, children }) {
  return (
    <div className="abstract-object-card">
      <div className="abstract-object-title">{title}</div>
      <div className="abstract-object-body" dir="ltr">{children}</div>
    </div>
  );
}

function MatrixBox({ matrix, label }) {
  return (
    <div className="abstract-matrix-box">
      {label && <div className="abstract-matrix-label">{label}</div>}
      <div className="abstract-mini-matrix" dir="ltr">
        {matrix.flat().map((value, index) => <span key={`${label}-${index}`}>{fmt(value)}</span>)}
      </div>
    </div>
  );
}

function InlineVector({ values }) {
  return <span dir="ltr">[{values.map((value) => fmt(value)).join(', ')}]</span>;
}

function LearningPanel({ title, children }) {
  return (
    <div className="abstract-learning-panel">
      <div className="abstract-learning-title">{title}</div>
      <div className="abstract-learning-body">{children}</div>
    </div>
  );
}

function ClosureCheck({ items }) {
  return (
    <LearningPanel title="בדיקת תכונות המרחב">
      <ul className="abstract-check-list">
        {items.map((item) => (
          <li key={item}><span aria-hidden="true">✓</span>{item}</li>
        ))}
      </ul>
    </LearningPanel>
  );
}

function PolynomialComputation({ alpha, beta, polynomialP, polynomialQ, result }) {
  const labels = ['מקדם קבוע', 'מקדם x', 'מקדם x²'];

  return (
    <LearningPanel title="כיצד מחשבים αp + βq">
      <div className="abstract-computation-grid">
        {labels.map((label, index) => (
          <div className="abstract-computation-row" key={label}>
            <span>{label}</span>
            <code>{fmt(alpha)}·{fmt(polynomialP[index])} + {fmt(beta)}·{fmt(polynomialQ[index])} = {fmt(result[index])}</code>
          </div>
        ))}
      </div>
    </LearningPanel>
  );
}

function FunctionSampleTable({ pair, alpha, beta }) {
  const sampleXs = [-1, 0, 1].filter((x) => x >= pair.domain[0] && x <= pair.domain[1]);

  return (
    <LearningPanel title="פעולה נקודתית">
      <div className="abstract-pointwise-note">לכל x מחשבים: h(x) = αf(x) + βg(x)</div>
      <div className="abstract-sample-table">
        <div>x</div><div>f(x)</div><div>g(x)</div><div>h(x)</div>
        {sampleXs.map((x) => {
          const f = pair.f(x);
          const g = pair.g(x);
          const h = alpha * f + beta * g;
          return (
            <React.Fragment key={x}>
              <code>{fmt(x)}</code><code>{fmt(f)}</code><code>{fmt(g)}</code><code>{fmt(h)}</code>
            </React.Fragment>
          );
        })}
      </div>
    </LearningPanel>
  );
}

function MatrixComputation({ alpha, beta, matrixA, matrixB, result }) {
  return (
    <LearningPanel title="כיצד מחשבים αA + βB">
      <div className="abstract-computation-grid">
        {matrixA.map((row, rowIndex) => row.map((value, colIndex) => (
          <div className="abstract-computation-row" key={`${rowIndex}-${colIndex}`}>
            <span>[{rowIndex + 1},{colIndex + 1}]</span>
            <code>{fmt(alpha)}·{fmt(value)} + {fmt(beta)}·{fmt(matrixB[rowIndex][colIndex])} = {fmt(result[rowIndex][colIndex])}</code>
          </div>
        )))}
      </div>
    </LearningPanel>
  );
}

function MatrixBasisPanel() {
  const basis = [
    { label: 'E₁₁', matrix: [[1, 0], [0, 0]] },
    { label: 'E₁₂', matrix: [[0, 1], [0, 0]] },
    { label: 'E₂₁', matrix: [[0, 0], [1, 0]] },
    { label: 'E₂₂', matrix: [[0, 0], [0, 1]] },
  ];

  return (
    <LearningPanel title="הבסיס הסטנדרטי למטריצות 2×2">
      <div className="abstract-basis-matrices">
        {basis.map((item) => <MatrixBox key={item.label} matrix={item.matrix} label={item.label} />)}
      </div>
    </LearningPanel>
  );
}

function PolynomialsView({ alpha, beta, polynomialP, polynomialQ }) {
  const result = combineArrays(alpha, polynomialP, beta, polynomialQ);

  return (
    <>
      <div className="abstract-object-grid">
        <FormulaCard title="אובייקט ראשון">{polynomialToText(polynomialP, 'p')}</FormulaCard>
        <FormulaCard title="אובייקט שני">{polynomialToText(polynomialQ, 'q')}</FormulaCard>
        <FormulaCard title="צירוף ליניארי">αp(x) + βq(x)</FormulaCard>
        <FormulaCard title="תוצאה">{polynomialToText(result, 'r')}</FormulaCard>
      </div>

      <div className="abstract-learning-grid">
        <LearningPanel title="בסיס וקואורדינטות">
          <p>בסיס: {'{1, x, x²}'}</p>
          <p>p(x) ↔ <InlineVector values={polynomialP} /></p>
          <p>q(x) ↔ <InlineVector values={polynomialQ} /></p>
          <p>r(x) ↔ <InlineVector values={result} /></p>
        </LearningPanel>
        <PolynomialComputation alpha={alpha} beta={beta} polynomialP={polynomialP} polynomialQ={polynomialQ} result={result} />
        <ClosureCheck items={[
          'p(x)+q(x) הוא עדיין פולינום',
          'αp(x) הוא עדיין פולינום',
          'αp(x)+βq(x) נשאר במרחב הפולינומים',
        ]} />
      </div>

      <PolynomialGraph polynomialP={polynomialP} polynomialQ={polynomialQ} result={result} />
      <div className="abstract-message">
        אפשר להתייחס לפולינום כאל וקטור של מקדמים. הבסיס {'{1, x, x²}'} מחבר בין הכתיבה הסמלית לבין וקטור הקואורדינטות, והצירוף הליניארי מתבצע מקדם־מקדם.
      </div>
    </>
  );
}

function FunctionsView({ alpha, beta, functionPair }) {
  const pair = functionPairs[functionPair] ?? functionPairs.trig;
  const range = getFunctionRange(pair, alpha, beta);
  const [minX, maxX] = pair.domain;
  const zeroX = ((0 - minX) / (maxX - minX)) * 440;
  const zeroY = 170 - ((0 - range.minY) / (range.maxY - range.minY)) * 170;
  const clampedZeroY = Math.max(0, Math.min(170, zeroY));
  const clampedZeroX = Math.max(0, Math.min(440, zeroX));
  const hLabel = `h(x) = ${fmt(alpha)}·${pair.shortF} + ${fmt(beta)}·${pair.shortG}`;

  return (
    <>
      <div className="abstract-object-grid functions-grid">
        <FormulaCard title="זוג פונקציות">{pair.title}</FormulaCard>
        <FormulaCard title="פונקציה ראשונה">{pair.fLabel}</FormulaCard>
        <FormulaCard title="פונקציה שנייה">{pair.gLabel}</FormulaCard>
        <FormulaCard title="צירוף ליניארי">h(x) = αf(x) + βg(x)</FormulaCard>
        <FormulaCard title="תוצאה">{hLabel}</FormulaCard>
      </div>

      <div className="abstract-learning-grid">
        <LearningPanel title="זוג יוצר וקואורדינטות">
          <p>זוג יוצר: {'{'}{pair.shortF}, {pair.shortG}{'}'}</p>
          <p>h(x) = αf(x) + βg(x)</p>
          <p>h(x) ↔ <InlineVector values={[alpha, beta]} /> ביחס לזוג זה</p>
        </LearningPanel>
        <FunctionSampleTable pair={pair} alpha={alpha} beta={beta} />
        <ClosureCheck items={[
          'f(x)+g(x) היא עדיין פונקציה',
          'αf(x) היא עדיין פונקציה',
          'h(x)=αf(x)+βg(x) נשארת במרחב הפונקציות',
        ]} />
      </div>

      <div className="function-plot-card" aria-label="גרף של צירוף ליניארי של פונקציות">
        <svg viewBox="0 0 440 170" role="img">
          <line x1="0" y1={clampedZeroY} x2="440" y2={clampedZeroY} className="plot-axis" />
          <line x1={clampedZeroX} y1="0" x2={clampedZeroX} y2="170" className="plot-axis" />
          <path d={makeFunctionPath((x) => pair.f(x), pair.domain, range)} className="plot-line plot-f" />
          <path d={makeFunctionPath((x) => pair.g(x), pair.domain, range)} className="plot-line plot-g" />
          <path d={makeFunctionPath((x) => alpha * pair.f(x) + beta * pair.g(x), pair.domain, range)} className="plot-line plot-h" />
        </svg>
        <div className="plot-legend">
          <span><i className="legend-dot f" />f(x)</span>
          <span><i className="legend-dot g" />g(x)</span>
          <span><i className="legend-dot h" />h(x)</span>
        </div>
      </div>
      <div className="abstract-message">
        פונקציות הופכות לאובייקטים במרחב וקטורי כאשר החיבור והכפל בסקלר מוגדרים נקודתית. הטבלה מציגה את הפעולה בערכי x בודדים, והגרף מציג את הפונקציה המתקבלת כולה.
      </div>
    </>
  );
}

function MatricesView({ alpha, beta, abstractMatrixA, abstractMatrixB }) {
  const result = combineMatrices(alpha, abstractMatrixA, beta, abstractMatrixB);

  return (
    <>
      <div className="abstract-matrix-row">
        <MatrixBox matrix={abstractMatrixA} label="A" />
        <div className="abstract-operator">+</div>
        <MatrixBox matrix={abstractMatrixB} label="B" />
        <div className="abstract-operator">→</div>
        <MatrixBox matrix={result} label="αA + βB" />
      </div>

      <div className="abstract-learning-grid">
        <LearningPanel title="קואורדינטות באמצעות פריסה">
          <p>A ↔ <InlineVector values={abstractMatrixA.flat()} /></p>
          <p>B ↔ <InlineVector values={abstractMatrixB.flat()} /></p>
          <p>αA + βB ↔ <InlineVector values={result.flat()} /></p>
        </LearningPanel>
        <MatrixComputation alpha={alpha} beta={beta} matrixA={abstractMatrixA} matrixB={abstractMatrixB} result={result} />
        <ClosureCheck items={[
          'A+B היא עדיין מטריצה 2×2',
          'αA היא עדיין מטריצה 2×2',
          'αA+βB נשארת באותו מרחב מטריצות',
        ]} />
      </div>

      <MatrixBasisPanel />

      <div className="abstract-message">
        אפשר לראות מטריצה 2×2 כווקטור בעל ארבע קואורדינטות. החיבור והכפל בסקלר נעשים איבר־איבר, ולכן התוצאה נשארת באותו מרחב מטריצות.
      </div>
    </>
  );
}

export default function AbstractSpaceVisualizer() {
  const abstractSpace = useVisualizerStore((s) => s.abstractSpace);
  const alpha = useVisualizerStore((s) => s.alpha);
  const beta = useVisualizerStore((s) => s.beta);
  const functionPair = useVisualizerStore((s) => s.functionPair);
  const polynomialP = useVisualizerStore((s) => s.polynomialP);
  const polynomialQ = useVisualizerStore((s) => s.polynomialQ);
  const abstractMatrixA = useVisualizerStore((s) => s.abstractMatrixA);
  const abstractMatrixB = useVisualizerStore((s) => s.abstractMatrixB);

  const title = abstractSpace === 'functions'
    ? 'פונקציות כווקטורים'
    : abstractSpace === 'matrices'
      ? 'מטריצות כווקטורים'
      : 'פולינומים כווקטורים';

  return (
    <section className="viz-card card abstract-viz-card" dir="rtl">
      <div className="viz-toolbar">
        <h2>מרחבים וקטוריים אבסטרקטיים</h2>
        <div className="meta">
          מוצג: <b>{title}</b> · α = {fmt(alpha)}, β = {fmt(beta)}
        </div>
      </div>

      <div className="abstract-viz-wrap">
        <div className="abstract-core-statement">
          <span className="abstract-badge">רעיון מרכזי</span>
          וקטור אינו חייב להיות חץ. הוא יכול להיות כל אובייקט שעליו מוגדרים חיבור וכפל בסקלר ושמקיים את אקסיומות המרחב הווקטורי.
        </div>

        <div className="abstract-axioms-strip">
          <div><strong>סגירות</strong><span>חיבור וכפל בסקלר נשארים במרחב</span></div>
          <div><strong>איבר אפס</strong><span>קיים אובייקט 0 שאינו משנה אובייקט אחר</span></div>
          <div><strong>נגדי חיבורי</strong><span>לכל אובייקט קיים אובייקט נגדי</span></div>
          <div><strong>דיסטריבוטיביות</strong><span>הכפל בסקלר מתפלג על חיבור</span></div>
        </div>

        {abstractSpace === 'functions' && <FunctionsView alpha={alpha} beta={beta} functionPair={functionPair} />}
        {abstractSpace === 'matrices' && (
          <MatricesView
            alpha={alpha}
            beta={beta}
            abstractMatrixA={abstractMatrixA}
            abstractMatrixB={abstractMatrixB}
          />
        )}
        {abstractSpace === 'polynomials' && (
          <PolynomialsView
            alpha={alpha}
            beta={beta}
            polynomialP={polynomialP}
            polynomialQ={polynomialQ}
          />
        )}
      </div>
    </section>
  );
}
