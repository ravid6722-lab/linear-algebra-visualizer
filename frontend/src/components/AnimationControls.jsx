import { useVisualizerStore } from '../store/useVisualizerStore.js';
import { useVisualizerAnimation } from '../hooks/useVisualizerAnimation.js';

export default function AnimationControls({ onAnimate, compact = false }) {
  const animSpeed = useVisualizerStore((s) => s.animSpeed);
  const setAnimSpeed = useVisualizerStore((s) => s.setAnimSpeed);
  const setT = useVisualizerStore((s) => s.setT);
  const { runAnimation } = useVisualizerAnimation();

  function animate() {
    const payload = {
      durationMs: Math.round(1200 / animSpeed),
      startedAt: Date.now(),
      speed: animSpeed,
    };
    runAnimation(payload);
    onAnimate?.(payload);
  }

  function reset() {
    setT(1);
  }

  if (compact) {
    return (
      <div className="animation-controls-compact" dir="rtl">
        <button className="btn primary animation-play-button" type="button" onClick={animate}>▶ הנפש את המרחב</button>
        <button className="btn animation-reset-button" type="button" onClick={reset}>איפוס</button>
        <label className="animation-speed-compact">
          <span>מהירות</span>
          <select value={animSpeed} onChange={(event) => setAnimSpeed(Number(event.target.value))}>
            <option value="0.5">0.5×</option>
            <option value="1">1×</option>
            <option value="1.5">1.5×</option>
            <option value="2">2×</option>
          </select>
        </label>
      </div>
    );
  }

  return (
    <div className="card-section" dir="rtl">
      <div className="section-title">הנפשה</div>
      <div className="animation-actions">
        <button className="btn primary" type="button" onClick={animate}>▶ הפעל הנפשה</button>
        <button className="btn" type="button" onClick={reset}>איפוס</button>
      </div>
      <div className="coef-label"><span>מהירות</span><code>{Number(animSpeed).toFixed(1)}×</code></div>
      <input type="range" min="0.3" max="2.5" step="0.1" value={animSpeed} onChange={(e) => setAnimSpeed(Number(e.target.value))} />
    </div>
  );
}
