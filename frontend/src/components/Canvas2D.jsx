import { useEffect, useRef } from 'react';
import { basisCoordinates2D, determinant, eigenInfo, fmt, lerpMatrix, linComb, matVec, roundInteractiveValue } from '../math/linearAlgebra.js';
import { useVisualizerStore } from '../store/useVisualizerStore.js';

function getCSS(varName) {
  return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
}

function usesMatrixTransform(concept) {
  return concept === 'transformation' || concept === 'determinant' || concept === 'eigen';
}


function finitePoint(point) {
  return Array.isArray(point) && point.length >= 2 && Number.isFinite(point[0]) && Number.isFinite(point[1]);
}

function maxAbsCoord(points) {
  return points.reduce((max, point) => {
    if (!finitePoint(point)) return max;
    return Math.max(max, Math.abs(point[0]), Math.abs(point[1]));
  }, 0);
}

function computeAdaptiveWorldExtent(state, matrix) {
  const points = [
    [0, 0],
    [1, 0],
    [0, 1],
    [-1, 0],
    [0, -1],
  ];

  const basisPoints = [
    [1, 0],
    [0, 1],
    [1, 1],
    [-1, 0],
    [0, -1],
    [-1, -1],
  ];

  basisPoints.forEach((point) => points.push(matVec(matrix, point)));

  if ((state.concept === 'transformation' || state.concept === 'eigen') && finitePoint(state.v)) {
    points.push(state.v);
    points.push(matVec(matrix, state.v));
  }

  if ((state.concept === 'span' || state.concept === 'basis') && finitePoint(state.v) && finitePoint(state.u)) {
    points.push(state.v, state.u, [state.v[0] + state.u[0], state.v[1] + state.u[1]]);
  }

  if (state.concept === 'basis' && finitePoint(state.v) && finitePoint(state.u)) {
    const alpha = Number.isFinite(state.alpha) ? state.alpha : 0;
    const beta = Number.isFinite(state.beta) ? state.beta : 0;
    points.push([alpha * state.u[0], alpha * state.u[1]]);
    points.push([beta * state.v[0], beta * state.v[1]]);
    points.push([alpha * state.u[0] + beta * state.v[0], alpha * state.u[1] + beta * state.v[1]]);
    if (finitePoint(state.basisTargetU) && finitePoint(state.basisTargetV)) {
      points.push(state.basisTargetU, state.basisTargetV);
      points.push([
        state.basisTargetU[0] + state.basisTargetV[0],
        state.basisTargetU[1] + state.basisTargetV[1],
      ]);
    }
  }

  if (state.concept === 'combination' && finitePoint(state.v) && finitePoint(state.u)) {
    points.push(state.v, state.u);
    points.push(linComb(state.alpha || 0, state.u, state.beta || 0, state.v));
    points.push([state.alpha * state.u[0], state.alpha * state.u[1]]);
    points.push([state.beta * state.v[0], state.beta * state.v[1]]);
  }

  const rawExtent = maxAbsCoord(points);
  const paddedExtent = rawExtent * 1.22 + 1;
  return Math.max(5, Math.min(36, paddedExtent));
}

export default function Canvas2D({ state, interactive = true }) {
  const canvasRef = useRef(null);
  const interactionRef = useRef({ cx: 0, cy: 0, unit: 1, handles: [] });
  const activeDragRef = useRef(null);

  function findHandle(event) {
    const canvas = canvasRef.current;
    if (!canvas || !interactive) return null;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    return interactionRef.current.handles
      .map((handle) => ({ ...handle, distance: Math.hypot(handle.x - x, handle.y - y) }))
      .filter((handle) => handle.distance <= (handle.hitRadius || 18))
      .sort((a, b) => a.distance - b.distance)[0] || null;
  }

  function pointFromPointer(event) {
    const canvas = canvasRef.current;
    const mapping = interactionRef.current;
    if (!canvas || !mapping.unit) return [0, 0];
    const rect = canvas.getBoundingClientRect();
    const screenX = event.clientX - rect.left;
    const screenY = event.clientY - rect.top;
    const precision = event.shiftKey ? 0 : 1;
    return [
      roundInteractiveValue((screenX - mapping.cx) / mapping.unit, precision),
      roundInteractiveValue((mapping.cy - screenY) / mapping.unit, precision),
    ];
  }

  function applyDraggedPoint(handleKey, point) {
    const store = useVisualizerStore.getState();
    const [x, y] = point;

    if (handleKey === 'u' || handleKey === 'v') {
      store.setVector(handleKey, [x, y]);
      return;
    }

    if (handleKey === 'basis-target-u' || handleKey === 'basis-target-v') {
      const targetKey = handleKey === 'basis-target-u' ? 'basisTargetU' : 'basisTargetV';
      store.setBasisInputMode('bases');
      store.setBasisTargetVector(targetKey, [x, y]);
      return;
    }

    if (handleKey === 'matrix-column-0' || handleKey === 'matrix-column-1') {
      const columnIndex = handleKey.endsWith('1') ? 1 : 0;
      const nextMatrix = store.A.map((row) => [...row]);
      nextMatrix[0][columnIndex] = x;
      nextMatrix[1][columnIndex] = y;
      store.setMatrix(nextMatrix);
      return;
    }

    if (handleKey === 'basis-result' || handleKey === 'combination-result') {
      const coordinates = basisCoordinates2D(store.u, store.v, [x, y]);
      if (!coordinates) return;
      store.setCoefficients(
        roundInteractiveValue(coordinates[0], 2),
        roundInteractiveValue(coordinates[1], 2),
      );
    }
  }

  function handlePointerDown(event) {
    const handle = findHandle(event);
    if (!handle) return;
    activeDragRef.current = handle.key;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    event.currentTarget.style.cursor = 'grabbing';
    event.preventDefault();
  }

  function handlePointerMove(event) {
    if (!interactive) return;
    if (activeDragRef.current) {
      applyDraggedPoint(activeDragRef.current, pointFromPointer(event));
      event.preventDefault();
      return;
    }
    event.currentTarget.style.cursor = findHandle(event) ? 'grab' : 'crosshair';
  }

  function endPointerDrag(event) {
    if (!activeDragRef.current) return;
    activeDragRef.current = null;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    event.currentTarget.style.cursor = 'crosshair';
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || state.dim !== 2) return undefined;

    let resizeObserver;

    const draw = () => {
      const ctx = canvas.getContext('2d');
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const width = rect.width || 900;
      const height = rect.height || 900;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const cx = width / 2;
      const cy = height / 2;

      const t = typeof state.t === 'number' ? state.t : 1;
      const Mt = lerpMatrix(state.A, t);
      const matrixIsUsed = usesMatrixTransform(state.concept);
      // Keep the viewport scale stable during animation.
      // The animated matrix Mt changes every frame, but the original input vector v
      // should not appear to shrink/grow just because the adaptive zoom recalculated
      // a different world extent. Use the final matrix A for sizing the scene.
      const displayMatrix = matrixIsUsed ? state.A : [[1, 0], [0, 1]];
      const worldExtent = computeAdaptiveWorldExtent(state, displayMatrix);
      const manualZoom = Number.isFinite(state.canvas2DZoom) ? state.canvas2DZoom : 1;
      const unit = (Math.min(width, height) / (worldExtent * 2)) * manualZoom;

      const tx = (x) => cx + x * unit;
      const ty = (y) => cy - y * unit;

      const labelBoxes = [];
      const interactiveHandles = [];

      function registerDragHandle(key, point, color, label) {
        if (!interactive || !finitePoint(point)) return;
        interactiveHandles.push({
          key,
          point,
          color,
          label,
          x: tx(point[0]),
          y: ty(point[1]),
          hitRadius: 20,
        });
      }

      function drawDragHandle(handle) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(handle.x, handle.y, 8, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.96)';
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = handle.color;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(handle.x, handle.y, 14, 0, Math.PI * 2);
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = `${handle.color}55`;
        ctx.stroke();
        ctx.restore();
      }

      function boxesOverlap(a, b) {
        return !(a.x + a.w < b.x || b.x + b.w < a.x || a.y + a.h < b.y || b.y + b.h < a.y);
      }

      function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
      }

      function drawRoundedRect(x, y, w, h, r) {
        const radius = Math.min(r, w / 2, h / 2);
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + w - radius, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
        ctx.lineTo(x + w, y + h - radius);
        ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
        ctx.lineTo(x + radius, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
      }

      function drawCanvasLabel(text, anchorX, anchorY, color, options = {}) {
        const font = options.font || '700 13px Arial, sans-serif';
        const paddingX = options.paddingX ?? 6;
        const paddingY = options.paddingY ?? 4;
        const margin = 8;
        const candidates = [
          [0, 0],
          [0, -18],
          [0, 18],
          [18, 0],
          [-18, 0],
          [16, -16],
          [-16, 16],
          [16, 16],
          [-16, -16],
          [28, -24],
          [-28, 24],
          [28, 24],
          [-28, -24],
        ];

        ctx.save();
        ctx.font = font;
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';

        const metrics = ctx.measureText(text);
        const textWidth = metrics.width;
        const textHeight = options.textHeight || 16;
        const boxWidth = textWidth + paddingX * 2;
        const boxHeight = textHeight + paddingY * 2;

        let best = null;
        for (const [dx, dy] of candidates) {
          const centerX = clamp(anchorX + dx, margin + boxWidth / 2, width - margin - boxWidth / 2);
          const centerY = clamp(anchorY + dy, margin + boxHeight / 2, height - margin - boxHeight / 2);
          const box = {
            x: centerX - boxWidth / 2,
            y: centerY - boxHeight / 2,
            w: boxWidth,
            h: boxHeight,
          };
          if (!labelBoxes.some((existing) => boxesOverlap(box, existing))) {
            best = { centerX, centerY, box };
            break;
          }
          if (!best) best = { centerX, centerY, box };
        }

        ctx.fillStyle = 'rgba(255, 255, 255, 0.86)';
        drawRoundedRect(best.box.x, best.box.y, best.box.w, best.box.h, 7);
        ctx.fill();

        ctx.strokeStyle = 'rgba(148, 163, 184, 0.28)';
        ctx.lineWidth = 1;
        drawRoundedRect(best.box.x, best.box.y, best.box.w, best.box.h, 7);
        ctx.stroke();

        ctx.fillStyle = color;
        ctx.fillText(text, best.centerX, best.centerY);
        labelBoxes.push(best.box);
        ctx.restore();
      }

      function drawAxisArrowHead(from, to, color) {
        const x1 = tx(from[0]);
        const y1 = ty(from[1]);
        const rawX2 = tx(to[0]);
        const rawY2 = ty(to[1]);
        const dx = rawX2 - x1;
        const dy = rawY2 - y1;
        const len = Math.hypot(dx, dy);
        if (len < 1) return;

        const padding = 18;
        const minX = padding;
        const maxX = width - padding;
        const minY = padding;
        const maxY = height - padding;

        // Keep the axis arrowhead inside the visible canvas.
        // The axis line may extend outside the viewport, but the direction marker should
        // already be visible at the default zoom, without forcing the user to zoom out.
        let scale = 1;
        if (rawX2 > maxX && dx > 0) scale = Math.min(scale, (maxX - x1) / dx);
        if (rawX2 < minX && dx < 0) scale = Math.min(scale, (minX - x1) / dx);
        if (rawY2 > maxY && dy > 0) scale = Math.min(scale, (maxY - y1) / dy);
        if (rawY2 < minY && dy < 0) scale = Math.min(scale, (minY - y1) / dy);

        if (!Number.isFinite(scale) || scale <= 0) return;

        const x2 = x1 + dx * scale;
        const y2 = y1 + dy * scale;
        const visibleLen = Math.hypot(x2 - x1, y2 - y1);
        if (visibleLen < 1) return;

        const ux = (x2 - x1) / visibleLen;
        const uy = (y2 - y1) / visibleLen;
        const head = 12;

        ctx.save();
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(x2 - ux * head - uy * head * 0.55, y2 - uy * head + ux * head * 0.55);
        ctx.lineTo(x2 - ux * head + uy * head * 0.55, y2 - uy * head - ux * head * 0.55);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      function drawGrid(M, highlight = false) {
        const range = 8;
        ctx.lineWidth = 1;
        ctx.strokeStyle = getCSS('--grid-line');
        ctx.beginPath();

        for (let i = -range; i <= range; i += 1) {
          const p1 = matVec(M, [i, -range]);
          const p2 = matVec(M, [i, range]);
          ctx.moveTo(tx(p1[0]), ty(p1[1]));
          ctx.lineTo(tx(p2[0]), ty(p2[1]));

          const q1 = matVec(M, [-range, i]);
          const q2 = matVec(M, [range, i]);
          ctx.moveTo(tx(q1[0]), ty(q1[1]));
          ctx.lineTo(tx(q2[0]), ty(q2[1]));
        }
        ctx.stroke();

        ctx.lineWidth = 2;
        ctx.strokeStyle = highlight ? getCSS('--primary') : getCSS('--grid-axis');
        ctx.beginPath();
        const xa1 = matVec(M, [-range, 0]);
        const xa2 = matVec(M, [range, 0]);
        const ya1 = matVec(M, [0, -range]);
        const ya2 = matVec(M, [0, range]);
        ctx.moveTo(tx(xa1[0]), ty(xa1[1]));
        ctx.lineTo(tx(xa2[0]), ty(xa2[1]));
        ctx.moveTo(tx(ya1[0]), ty(ya1[1]));
        ctx.lineTo(tx(ya2[0]), ty(ya2[1]));
        ctx.stroke();

        const axisColor = highlight ? getCSS('--primary') : getCSS('--grid-axis');
        drawAxisArrowHead(xa1, xa2, axisColor);
        drawAxisArrowHead(ya1, ya2, axisColor);
      }

      function drawLinearCombinationPlane(M) {
        if (!state.showPlaneCombinations) return;

        const firstColumn = matVec(M, [1, 0]);
        const secondColumn = matVec(M, [0, 1]);
        const selectedCoordinates = [2, 1];
        const selectedPoint = matVec(M, selectedCoordinates);
        const firstPart = [selectedCoordinates[0] * firstColumn[0], selectedCoordinates[0] * firstColumn[1]];

        ctx.save();
        for (let i = -3; i <= 3; i += 1) {
          for (let j = -3; j <= 3; j += 1) {
            const point = matVec(M, [i, j]);
            ctx.beginPath();
            ctx.arc(tx(point[0]), ty(point[1]), i === 0 && j === 0 ? 3 : 2.4, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(79, 70, 229, 0.42)';
            ctx.fill();
          }
        }

        ctx.strokeStyle = 'rgba(14, 165, 233, 0.82)';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([7, 5]);
        ctx.beginPath();
        ctx.moveTo(tx(0), ty(0));
        ctx.lineTo(tx(firstPart[0]), ty(firstPart[1]));
        ctx.lineTo(tx(selectedPoint[0]), ty(selectedPoint[1]));
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();

        drawCanvasLabel('2(A·e₁)+1(A·e₂)', tx(selectedPoint[0]), ty(selectedPoint[1]), getCSS('--accent'), {
          font: '700 12px Arial, sans-serif',
          perp: 0,
        });
      }

      function drawArrow(from, to, color, lineWidth = 3, label = null, labelOptions = {}) {
        const x1 = tx(from[0]);
        const y1 = ty(from[1]);
        const x2 = tx(to[0]);
        const y2 = ty(to[1]);
        const dx = x2 - x1;
        const dy = y2 - y1;
        const len = Math.hypot(dx, dy);
        if (len < 0.5) return;

        const ux = dx / len;
        const uy = dy / len;
        const head = Math.min(14, len * 0.4);

        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2 - ux * head * 0.6, y2 - uy * head * 0.6);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(x2 - ux * head - uy * head * 0.5, y2 - uy * head + ux * head * 0.5);
        ctx.lineTo(x2 - ux * head + uy * head * 0.5, y2 - uy * head - ux * head * 0.5);
        ctx.closePath();
        ctx.fill();

        if (label) {
          const labelDistance = labelOptions.distance ?? (lineWidth >= 4 ? 24 : 20);
          const perpendicularOffset = labelOptions.perp ?? 0;
          const anchorX = x2 + ux * labelDistance + -uy * perpendicularOffset;
          const anchorY = y2 + uy * labelDistance + ux * perpendicularOffset;
          drawCanvasLabel(label, anchorX, anchorY, color, labelOptions);
        }
      }

      function drawParallelogram(M, fill, stroke) {
        const p0 = [0, 0];
        const p1 = matVec(M, [1, 0]);
        const p2 = matVec(M, [1, 1]);
        const p3 = matVec(M, [0, 1]);
        ctx.beginPath();
        ctx.moveTo(tx(p0[0]), ty(p0[1]));
        ctx.lineTo(tx(p1[0]), ty(p1[1]));
        ctx.lineTo(tx(p2[0]), ty(p2[1]));
        ctx.lineTo(tx(p3[0]), ty(p3[1]));
        ctx.closePath();
        ctx.fillStyle = fill;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = stroke;
        ctx.stroke();
      }

      function drawSpanLine(vec, color) {
        const r = 20;
        const n = Math.hypot(vec[0], vec[1]);
        if (n < 1e-6) return;
        const unitVec = [vec[0] / n, vec[1] / n];
        const p1 = [unitVec[0] * r, unitVec[1] * r];
        const p2 = [-unitVec[0] * r, -unitVec[1] * r];
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.moveTo(tx(p1[0]), ty(p1[1]));
        ctx.lineTo(tx(p2[0]), ty(p2[1]));
        ctx.stroke();
        ctx.setLineDash([]);
      }

      function drawBasisAxis(vec, color, label) {
        const n = Math.hypot(vec[0], vec[1]);
        if (n < 1e-6) return;
        const r = worldExtent * 1.2;
        const unitVec = [vec[0] / n, vec[1] / n];
        const p1 = [-unitVec[0] * r, -unitVec[1] * r];
        const p2 = [unitVec[0] * r, unitVec[1] * r];
        ctx.save();
        ctx.strokeStyle = `${color}99`;
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 6]);
        ctx.beginPath();
        ctx.moveTo(tx(p1[0]), ty(p1[1]));
        ctx.lineTo(tx(p2[0]), ty(p2[1]));
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
        drawAxisArrowHead([0, 0], p2, color);
        drawCanvasLabel(label, tx(p2[0]), ty(p2[1]), color, {
          font: '700 12px Arial, sans-serif',
          paddingX: 7,
          paddingY: 4,
        });
      }

      ctx.clearRect(0, 0, width, height);

      const det = determinant(Mt);
      const basisBDet = state.u[0] * state.v[1] - state.u[1] * state.v[0];
      const basisCDet = (state.basisTargetU?.[0] ?? 0) * (state.basisTargetV?.[1] ?? 0)
        - (state.basisTargetU?.[1] ?? 0) * (state.basisTargetV?.[0] ?? 0);
      const basisBValid = Math.abs(basisBDet) > 0.05;
      const basisCValid = Math.abs(basisCDet) > 0.05;

      if (matrixIsUsed) {
        ctx.save();
        ctx.globalAlpha = 0.35;
        drawGrid([[1, 0], [0, 1]]);
        ctx.restore();
        drawGrid(Mt, true);
        drawLinearCombinationPlane(Mt);
      } else {
        drawGrid([[1, 0], [0, 1]], true);
      }

      if (state.concept === 'determinant' || state.concept === 'transformation') {
        let fill = 'rgba(79, 70, 229, 0.18)';
        let stroke = getCSS('--primary');
        if (det < 0) {
          fill = 'rgba(220, 38, 38, 0.18)';
          stroke = getCSS('--danger');
        }
        if (Math.abs(det) < 0.05) {
          fill = 'rgba(245, 158, 11, 0.22)';
          stroke = getCSS('--warning');
        }
        drawParallelogram(Mt, fill, stroke);

      }

      if (state.concept === 'span') {
        drawSpanLine(state.v, getCSS('--vec-v'));
        drawSpanLine(state.u, getCSS('--vec-u'));
      }

      if (state.concept === 'eigen') {
        const info = eigenInfo(state.A);
        if (info.real) {
          const colors = [getCSS('--accent'), getCSS('--warning')];
          info.pairs.forEach((pair, index) => {
            const color = colors[index % colors.length];
            drawSpanLine(pair.v, color);
            drawCanvasLabel(`כיוון עצמי  λ=${fmt(pair.lambda)}`, tx(pair.v[0] * 4.2), ty(pair.v[1] * 4.2), color, {
              font: '700 12px Arial, sans-serif',
            });
          });
        } else {
          ctx.fillStyle = 'rgba(220,38,38,0.95)';
          ctx.font = '600 14px Arial, sans-serif';
          ctx.fillText('אין וקטורים עצמיים ממשיים — הטרנספורמציה משנה כל כיוון ממשי.', 18, height - 22);
        }
      }

      if (state.concept === 'basis') {
        const drawBasisParallelogram = (first, second, fill, stroke, dashed = false) => {
          ctx.save();
          if (dashed) ctx.setLineDash([7, 5]);
          ctx.beginPath();
          ctx.moveTo(tx(0), ty(0));
          ctx.lineTo(tx(first[0]), ty(first[1]));
          ctx.lineTo(tx(first[0] + second[0]), ty(first[1] + second[1]));
          ctx.lineTo(tx(second[0]), ty(second[1]));
          ctx.closePath();
          ctx.fillStyle = fill;
          ctx.fill();
          ctx.strokeStyle = stroke;
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.restore();
        };

        drawBasisParallelogram(
          state.u,
          state.v,
          basisBValid ? 'rgba(249,115,22,0.08)' : 'rgba(245,158,11,0.16)',
          basisBValid ? 'rgba(249,115,22,0.72)' : getCSS('--warning'),
        );

        if (finitePoint(state.basisTargetU) && finitePoint(state.basisTargetV)) {
          drawBasisParallelogram(
            state.basisTargetU,
            state.basisTargetV,
            basisCValid ? 'rgba(16,185,129,0.07)' : 'rgba(245,158,11,0.12)',
            basisCValid ? 'rgba(5,150,105,0.72)' : getCSS('--warning'),
            true,
          );

          drawBasisAxis(state.basisTargetU, getCSS('--basis-c1') || '#059669', 'ציר c₁');
          drawBasisAxis(state.basisTargetV, getCSS('--basis-c2') || '#7c3aed', 'ציר c₂');
        }

        drawBasisAxis(state.u, getCSS('--vec-u'), 'ציר b₁');
        drawBasisAxis(state.v, getCSS('--vec-v'), 'ציר b₂');
      }

      if (matrixIsUsed) {
        const iHat = matVec(Mt, [1, 0]);
        const jHat = matVec(Mt, [0, 1]);
        drawArrow([0, 0], iHat, getCSS('--vec-i'), 4, 'î', { perp: -10, distance: 20 });
        drawArrow([0, 0], jHat, getCSS('--vec-j'), 4, 'ĵ', { perp: 10, distance: 20 });
        registerDragHandle('matrix-column-0', iHat, getCSS('--vec-i'), 'A·e₁');
        registerDragHandle('matrix-column-1', jHat, getCSS('--vec-j'), 'A·e₂');
      }

      if (state.concept === 'combination') {
        const au = [state.alpha * state.u[0], state.alpha * state.u[1]];
        const bv = [state.beta * state.v[0], state.beta * state.v[1]];
        const sum = linComb(state.alpha, state.u, state.beta, state.v);

        drawArrow([0, 0], state.u, `${getCSS('--vec-u')}88`, 2, 'u', { perp: -14, distance: 18 });
        drawArrow([0, 0], state.v, `${getCSS('--vec-v')}88`, 2, 'v', { perp: 14, distance: 18 });

        const combinationResultColor = getCSS('--accent');
        ctx.beginPath();
        ctx.moveTo(tx(0), ty(0));
        ctx.lineTo(tx(au[0]), ty(au[1]));
        ctx.lineTo(tx(sum[0]), ty(sum[1]));
        ctx.lineTo(tx(bv[0]), ty(bv[1]));
        ctx.closePath();
        ctx.fillStyle = 'rgba(14,165,233,0.10)';
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = 'rgba(14,165,233,0.28)';
        ctx.stroke();

        drawArrow([0, 0], au, getCSS('--vec-u'), 3, 'α·u', { perp: -16, distance: 22 });
        drawArrow([0, 0], bv, getCSS('--vec-v'), 3, 'β·v', { perp: 16, distance: 22 });
        drawArrow(au, sum, `${getCSS('--vec-v')}bb`, 2.5, null);
        drawArrow(bv, sum, `${getCSS('--vec-u')}bb`, 2.5, null);
        drawArrow([0, 0], sum, combinationResultColor, 4, 'αu+βv', { perp: -20, distance: 28 });
        registerDragHandle('u', state.u, getCSS('--vec-u'), 'u');
        registerDragHandle('v', state.v, getCSS('--vec-v'), 'v');
        if (Math.abs(state.u[0] * state.v[1] - state.u[1] * state.v[0]) > 0.05) {
          registerDragHandle('combination-result', sum, combinationResultColor, 'αu+βv');
        }
      } else if (state.concept === 'span' || state.concept === 'basis') {
        const firstLabel = state.concept === 'basis' ? 'b₁' : 'u';
        const secondLabel = state.concept === 'basis' ? 'b₂' : 'v';
        drawArrow([0, 0], state.v, state.concept === 'basis' ? `${getCSS('--vec-v')}99` : getCSS('--vec-v'), state.concept === 'basis' ? 3 : 4, secondLabel, { perp: -14, distance: 24 });
        drawArrow([0, 0], state.u, state.concept === 'basis' ? `${getCSS('--vec-u')}99` : getCSS('--vec-u'), state.concept === 'basis' ? 3 : 4, firstLabel, { perp: 14, distance: 24 });
        registerDragHandle('v', state.v, getCSS('--vec-v'), secondLabel);
        registerDragHandle('u', state.u, getCSS('--vec-u'), firstLabel);
        if (state.concept === 'basis') {
          if (finitePoint(state.basisTargetU) && finitePoint(state.basisTargetV)) {
            const c1Color = getCSS('--basis-c1') || '#059669';
            const c2Color = getCSS('--basis-c2') || '#7c3aed';
            ctx.save();
            ctx.setLineDash([7, 5]);
            drawArrow([0, 0], state.basisTargetU, c1Color, 3, 'c₁', { perp: 15, distance: 22 });
            drawArrow([0, 0], state.basisTargetV, c2Color, 3, 'c₂', { perp: -15, distance: 22 });
            ctx.restore();
            registerDragHandle('basis-target-u', state.basisTargetU, c1Color, 'c₁');
            registerDragHandle('basis-target-v', state.basisTargetV, c2Color, 'c₂');
          }

          const alphaU = [state.alpha * state.u[0], state.alpha * state.u[1]];
          const betaV = [state.beta * state.v[0], state.beta * state.v[1]];
          const w = [alphaU[0] + betaV[0], alphaU[1] + betaV[1]];

          ctx.beginPath();
          ctx.moveTo(tx(0), ty(0));
          ctx.lineTo(tx(alphaU[0]), ty(alphaU[1]));
          ctx.lineTo(tx(w[0]), ty(w[1]));
          ctx.lineTo(tx(betaV[0]), ty(betaV[1]));
          ctx.closePath();
          ctx.fillStyle = 'rgba(14,165,233,0.10)';
          ctx.fill();
          ctx.lineWidth = 1.5;
          ctx.strokeStyle = 'rgba(14,165,233,0.34)';
          ctx.stroke();

          drawArrow([0, 0], alphaU, getCSS('--vec-u'), 3.2, 'αb₁', { perp: 16, distance: 22 });
          drawArrow([0, 0], betaV, getCSS('--vec-v'), 3.2, 'βb₂', { perp: -16, distance: 22 });
          drawArrow(alphaU, w, `${getCSS('--vec-v')}bb`, 2.2, null);
          drawArrow(betaV, w, `${getCSS('--vec-u')}bb`, 2.2, null);

          if (basisCValid) {
            const targetCoordinates = basisCoordinates2D(state.basisTargetU, state.basisTargetV, w);
            if (targetCoordinates) {
              const cPart = [
                targetCoordinates[0] * state.basisTargetU[0],
                targetCoordinates[0] * state.basisTargetU[1],
              ];
              ctx.save();
              ctx.strokeStyle = 'rgba(5,150,105,0.72)';
              ctx.lineWidth = 2;
              ctx.setLineDash([6, 5]);
              ctx.beginPath();
              ctx.moveTo(tx(0), ty(0));
              ctx.lineTo(tx(cPart[0]), ty(cPart[1]));
              ctx.lineTo(tx(w[0]), ty(w[1]));
              ctx.stroke();
              ctx.restore();
            }
          }

          drawArrow([0, 0], w, getCSS('--accent'), 4.5, 'w', { perp: -22, distance: 28 });
          if (basisBValid) registerDragHandle('basis-result', w, getCSS('--accent'), 'w');
        }
      } else if (state.concept === 'transformation' || state.concept === 'eigen') {
        const Av = matVec(Mt, state.v);
        const showInputVector = state.concept === 'transformation' || state.concept === 'eigen';
        if (showInputVector) {
          drawArrow([0, 0], state.v, `${getCSS('--vec-v')}88`, 3, 'v', { perp: 14, distance: 22 });
          registerDragHandle('v', state.v, getCSS('--vec-v'), 'v');
        }
        drawArrow([0, 0], Av, getCSS('--vec-v'), 4, 'A·v', { perp: -14, distance: 26 });
      }

      interactiveHandles.forEach(drawDragHandle);
      interactionRef.current = { cx, cy, unit, handles: interactiveHandles };
    };

    draw();
    resizeObserver = new ResizeObserver(draw);
    resizeObserver.observe(canvas);
    window.addEventListener('resize', draw);

    return () => {
      if (resizeObserver) resizeObserver.disconnect();
      window.removeEventListener('resize', draw);
    };
  }, [state]);

  return (
    <canvas
      ref={canvasRef}
      className="d2-only interactive-canvas-2d"
      width="900"
      height="900"
      aria-label="הדמיה אינטראקטיבית דו־ממדית באלגברה ליניארית"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endPointerDrag}
      onPointerCancel={endPointerDrag}
      onPointerLeave={(event) => {
        if (!activeDragRef.current) event.currentTarget.style.cursor = 'crosshair';
      }}
      style={{ touchAction: 'none', cursor: interactive ? 'crosshair' : 'default' }}
    />
  );
}
