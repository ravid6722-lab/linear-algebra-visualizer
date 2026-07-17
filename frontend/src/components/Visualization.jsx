import { useEffect, useRef } from 'react';
import Canvas2D from './Canvas2D.jsx';
import Canvas3D from './Canvas3D.jsx';
import AbstractSpaceVisualizer from './AbstractSpaceVisualizer.jsx';
import AnimationControls from './AnimationControls.jsx';
import { currentDet, fmt } from '../math/linearAlgebra.js';
import { useVisualizerStore } from '../store/useVisualizerStore.js';

const titles = {
  transformation: 'טרנספורמציה ליניארית',
  combination: 'צירוף ליניארי',
  determinant: 'דטרמיננטה',
  eigen: 'וקטורים עצמיים',
  span: 'מרחב נפרס',
  basis: 'בסיס, קואורדינטות ומעבר בסיס',
  abstract: 'מרחבים וקטוריים אבסטרקטיים',
};

export default function Visualization({ role = 'lecturer', followLecturer = false, onCameraChange, onAnimate } = {}) {
  const dim = useVisualizerStore((s) => s.dim);
  const concept = useVisualizerStore((s) => s.concept);
  const A = useVisualizerStore((s) => s.A);
  const v = useVisualizerStore((s) => s.v);
  const u = useVisualizerStore((s) => s.u);
  const alpha = useVisualizerStore((s) => s.alpha);
  const beta = useVisualizerStore((s) => s.beta);
  const basisTargetU = useVisualizerStore((s) => s.basisTargetU);
  const basisTargetV = useVisualizerStore((s) => s.basisTargetV);
  const showPlaneCombinations = useVisualizerStore((s) => s.showPlaneCombinations);
  const t = useVisualizerStore((s) => s.t);
  const canvas2DZoom = useVisualizerStore((s) => s.canvas2DZoom);
  const canvasWrapRef = useRef(null);
  const setCanvas2DZoom = useVisualizerStore((s) => s.setCanvas2DZoom);
  const zoomIn2D = useVisualizerStore((s) => s.zoomIn2D);
  const zoomOut2D = useVisualizerStore((s) => s.zoomOut2D);
  const resetZoom2D = useVisualizerStore((s) => s.resetZoom2D);

  const state = { dim, concept, A, v, u, basisTargetU, basisTargetV, showPlaneCombinations, alpha, beta, t, canvas2DZoom };
  const det = currentDet(A);
  const areaScale = Math.abs(det);
  const basisDet = (u?.[0] ?? 0) * (v?.[1] ?? 0) - (u?.[1] ?? 0) * (v?.[0] ?? 0);
  const matrixIsUsed = concept === 'transformation' || concept === 'determinant' || concept === 'eigen';
  const directManipulationEnabled = dim === 2 && !followLecturer;

  useEffect(() => {
    const canvasWrap = canvasWrapRef.current;
    if (!canvasWrap || dim !== 2) return undefined;

    const handleWheel = (event) => {
      if (event.cancelable) event.preventDefault();
      event.stopPropagation();
      const direction = event.deltaY < 0 ? 1 : -1;
      setCanvas2DZoom(Number((canvas2DZoom + direction * 0.12).toFixed(2)));
    };

    canvasWrap.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvasWrap.removeEventListener('wheel', handleWheel);
  }, [canvas2DZoom, dim, setCanvas2DZoom]);

  if (concept === 'abstract') return <AbstractSpaceVisualizer />;

  return (
    <section className="viz-card card" dir="rtl">
      <div className="viz-toolbar">
        <div className="viz-title-block">
          <h2>{titles[concept]} · {dim}D</h2>
          <div className="meta">
            <span>{dim === 2 ? 'הדמיה דו־ממדית' : 'הדמיה תלת־ממדית'}</span>
            <span>מצב: <b>{t < 1 ? 'בהנפשה' : 'תוצאה מלאה'}</b></span>
          </div>
        </div>
        {!followLecturer && concept !== 'abstract' && <AnimationControls compact onAnimate={onAnimate} />}
      </div>

      <div className="canvas-wrap" ref={canvasWrapRef}>
        {dim === 2
          ? <Canvas2D state={state} interactive={!followLecturer} />
          : <Canvas3D role={role} followLecturer={followLecturer} onCameraChange={onCameraChange} />}

        {matrixIsUsed && (
          <div className="fixed-matrix-badge" dir="ltr">
            <strong>A קבועה</strong>
            <span>{A.map((row) => `[${row.map(fmt).join(', ')}]`).join(' ')}</span>
            <small>המישור נע מ־I אל A; ערכי המטריצה אינם משתנים בזמן ההנפשה.</small>
          </div>
        )}

        {directManipulationEnabled && (
          <div className="direct-manipulation-hint">
            גררו את העיגולים בקצות החצים כדי לשנות את הנתונים הגיאומטריים. הערכים האלגבריים יתעדכנו מיד.
          </div>
        )}

        {dim === 2 ? (
          <div className="viz-overlay d2-only" dir="ltr">
            {matrixIsUsed && (
              <>
                <div className="overlay-chip"><span className="swatch" style={{ background: 'var(--vec-i)' }} /> A·e₁</div>
                <div className="overlay-chip"><span className="swatch" style={{ background: 'var(--vec-j)' }} /> A·e₂</div>
              </>
            )}

            {concept === 'combination' ? (
              <>
                <div className="overlay-chip"><span className="swatch" style={{ background: 'rgba(79, 70, 229, 0.75)' }} /> v → βv</div>
                <div className="overlay-chip"><span className="swatch" style={{ background: 'rgba(249, 115, 22, 0.78)' }} /> u → αu</div>
                <div className="overlay-chip"><span className="swatch" style={{ background: 'var(--accent)' }} /> αu + βv</div>
              </>
            ) : concept === 'transformation' ? (
              <>
                <div className="overlay-chip"><span className="swatch" style={{ background: 'rgba(79, 70, 229, 0.45)' }} /> v</div>
                <div className="overlay-chip"><span className="swatch" style={{ background: 'var(--vec-v)' }} /> A·v</div>
              </>
            ) : concept === 'eigen' ? (
              <div className="overlay-chip"><span className="swatch" style={{ background: 'var(--vec-v)' }} /> v → A·v</div>
            ) : (concept === 'span' || concept === 'basis') ? (
              <>
                <div className="overlay-chip"><span className="swatch" style={{ background: 'var(--vec-v)' }} /> {concept === 'basis' ? 'b₂' : 'v'}</div>
                <div className="overlay-chip"><span className="swatch" style={{ background: 'var(--vec-u)' }} /> {concept === 'basis' ? 'b₁' : 'u'}</div>
                {concept === 'basis' && (
                  <>
                    <div className="overlay-chip"><span className="swatch" style={{ background: 'var(--basis-c1)' }} /> c₁, c₂ — בסיס C</div>
                    <div className="overlay-chip"><span className="swatch" style={{ background: 'var(--accent)' }} /> w = αb₁ + βb₂</div>
                    <div className="overlay-chip area-overlay-chip">det(P_B) = {Math.abs(basisDet) < 0.05 ? '≈ 0' : fmt(basisDet)}</div>
                  </>
                )}
              </>
            ) : null}

            {(concept === 'determinant' || concept === 'transformation') && (
              <div className="overlay-chip area-overlay-chip">|det(A)| = {areaScale < 0.05 ? '≈ 0' : fmt(areaScale)}</div>
            )}
          </div>
        ) : (
          <div className="viz-overlay d3-only" dir="ltr">
            {matrixIsUsed ? (
              <>
                <div className="overlay-chip"><span className="swatch" style={{ background: '#ef4444' }} /> A·e₁</div>
                <div className="overlay-chip"><span className="swatch" style={{ background: '#22c55e' }} /> A·e₂</div>
                <div className="overlay-chip"><span className="swatch" style={{ background: '#3b82f6' }} /> A·e₃</div>
                {concept !== 'determinant' && <div className="overlay-chip"><span className="swatch" style={{ background: 'var(--vec-v)' }} /> v → A·v</div>}
              </>
            ) : concept === 'combination' ? (
              <>
                <div className="overlay-chip"><span className="swatch" style={{ background: '#f97316' }} /> u → αu</div>
                <div className="overlay-chip"><span className="swatch" style={{ background: '#4f46e5' }} /> v → βv</div>
                <div className="overlay-chip"><span className="swatch" style={{ background: '#0ea5e9' }} /> αu+βv</div>
              </>
            ) : (concept === 'span' || concept === 'basis') ? (
              <>
                <div className="overlay-chip"><span className="swatch" style={{ background: '#4f46e5' }} /> v</div>
                <div className="overlay-chip"><span className="swatch" style={{ background: '#f97316' }} /> u</div>
                {concept === 'basis' && <div className="overlay-chip"><span className="swatch" style={{ background: 'var(--accent)' }} /> w = αu + βv</div>}
              </>
            ) : null}
          </div>
        )}

        {dim === 2 && (
          <div className="zoom-2d-controls" aria-label="פקדי תקריב דו־ממדי" dir="ltr">
            <button type="button" onClick={zoomOut2D} title="התרחקות">−</button>
            <span>{Math.round(canvas2DZoom * 100)}%</span>
            <button type="button" onClick={zoomIn2D} title="התקרבות">+</button>
            <button type="button" onClick={resetZoom2D} title="איפוס תקריב">איפוס</button>
          </div>
        )}
      </div>
    </section>
  );
}
