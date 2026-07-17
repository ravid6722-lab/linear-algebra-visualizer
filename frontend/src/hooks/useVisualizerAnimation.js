import { useCallback, useEffect, useRef } from 'react';
import { useVisualizerStore } from '../store/useVisualizerStore.js';

export const DEFAULT_ANIMATION_DURATION_MS = 1600;

export function useVisualizerAnimation() {
  const animSpeed = useVisualizerStore((s) => s.animSpeed);
  const setT = useVisualizerStore((s) => s.setT);
  const speedRef = useRef(animSpeed);
  const animationRef = useRef(null);
  const kickoffRef = useRef(null);

  useEffect(() => {
    speedRef.current = animSpeed;
  }, [animSpeed]);

  useEffect(() => () => {
    cancelAnimationFrame(animationRef.current);
    if (kickoffRef.current) clearTimeout(kickoffRef.current);
  }, []);

  const runAnimation = useCallback((options = {}) => {
    cancelAnimationFrame(animationRef.current);
    if (kickoffRef.current) clearTimeout(kickoffRef.current);

    const durationMs = Number(options.durationMs || DEFAULT_ANIMATION_DURATION_MS);
    const speedAtStart = Math.max(0.001, Number(options.speed || speedRef.current || 1));
    const remoteStartedAt = Number(options.startedAt || 0);

    // Force the visualization to render the starting state first.
    // Without this small kickoff delay, some browsers can batch t=0 with the
    // first animation frame and the user sees no replay, especially after a
    // preset changed the matrix while t was already 1.
    setT(0);

    kickoffRef.current = setTimeout(() => {
      const elapsedFromRemoteStart = remoteStartedAt ? Math.max(0, Date.now() - remoteStartedAt) : 0;
      const startedAtPerf = performance.now() - (elapsedFromRemoteStart / speedAtStart);

      const tick = (now) => {
        const elapsed = (now - startedAtPerf) * speedAtStart;
        const p = Math.max(0, Math.min(1, elapsed / durationMs));
        const eased = p < 0.5 ? 2 * p * p : 1 - ((-2 * p + 2) ** 2) / 2;
        setT(eased);

        if (p < 1) {
          animationRef.current = requestAnimationFrame(tick);
        } else {
          setT(1);
        }
      };

      animationRef.current = requestAnimationFrame(tick);
    }, 40);
  }, [setT]);

  const stopAnimation = useCallback(() => {
    cancelAnimationFrame(animationRef.current);
    if (kickoffRef.current) clearTimeout(kickoffRef.current);
  }, []);

  return { runAnimation, stopAnimation, durationMs: DEFAULT_ANIMATION_DURATION_MS };
}
