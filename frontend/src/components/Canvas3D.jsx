import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, OrbitControls } from '@react-three/drei';
import { lerpMatrix3, linComb3, matVec3 } from '../math/linearAlgebra.js';
import { useVisualizerStore } from '../store/useVisualizerStore.js';

function length3(v) {
  return Math.hypot(v[0] ?? 0, v[1] ?? 0, v[2] ?? 0);
}

function normalize3(v) {
  const len = length3(v);
  if (len < 1e-9) return [0, 0, 0];
  return [v[0] / len, v[1] / len, v[2] / len];
}

function add3(a, b) {
  return [(a[0] ?? 0) + (b[0] ?? 0), (a[1] ?? 0) + (b[1] ?? 0), (a[2] ?? 0) + (b[2] ?? 0)];
}

function scale3(v, scalar) {
  return [(v[0] ?? 0) * scalar, (v[1] ?? 0) * scalar, (v[2] ?? 0) * scalar];
}

function dot3(a, b) {
  return (a[0] ?? 0) * (b[0] ?? 0) + (a[1] ?? 0) * (b[1] ?? 0) + (a[2] ?? 0) * (b[2] ?? 0);
}

function coefficientsInSpan3D(u, v, w) {
  const uu = dot3(u, u);
  const uv = dot3(u, v);
  const vv = dot3(v, v);
  const uw = dot3(u, w);
  const vw = dot3(v, w);
  const det = uu * vv - uv * uv;

  if (Math.abs(det) < 1e-8) return null;

  return [
    (uw * vv - vw * uv) / det,
    (vw * uu - uw * uv) / det,
  ];
}

function roundDragValue(value, integerSnap = false) {
  const rounded = integerSnap ? Math.round(value) : Math.round(value * 10) / 10;
  return Object.is(rounded, -0) ? 0 : rounded;
}

function replaceMatrixColumn(matrix, columnIndex, vector) {
  return matrix.map((row, rowIndex) => row.map((value, colIndex) => (
    colIndex === columnIndex ? (vector[rowIndex] ?? 0) : value
  )));
}

function DraggableHandle3D({ position, color, onDrag, interactive, onDraggingChange, label }) {
  const { camera, gl } = useThree();
  const dragPlaneRef = useRef(new THREE.Plane());
  const offsetRef = useRef(new THREE.Vector3());
  const draggingRef = useRef(false);
  const pointerIdRef = useRef(null);

  useEffect(() => () => {
    if (gl?.domElement) gl.domElement.style.cursor = '';
  }, [gl]);

  if (!interactive) return null;

  function finishDrag(event) {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    onDraggingChange?.(false);
    if (gl?.domElement) gl.domElement.style.cursor = 'grab';

    try {
      event?.target?.releasePointerCapture?.(pointerIdRef.current);
    } catch {
      // Pointer capture may already have been released by the browser.
    }
    pointerIdRef.current = null;
  }

  function handlePointerDown(event) {
    event.stopPropagation();
    const normal = camera.getWorldDirection(new THREE.Vector3()).normalize();
    const current = new THREE.Vector3(...position);
    dragPlaneRef.current.setFromNormalAndCoplanarPoint(normal, current);

    const intersection = new THREE.Vector3();
    if (event.ray.intersectPlane(dragPlaneRef.current, intersection)) {
      offsetRef.current.copy(current).sub(intersection);
    } else {
      offsetRef.current.set(0, 0, 0);
    }

    draggingRef.current = true;
    pointerIdRef.current = event.pointerId;
    event.target?.setPointerCapture?.(event.pointerId);
    onDraggingChange?.(true);
    if (gl?.domElement) gl.domElement.style.cursor = 'grabbing';
  }

  function handlePointerMove(event) {
    if (!draggingRef.current) return;
    event.stopPropagation();

    const intersection = new THREE.Vector3();
    if (!event.ray.intersectPlane(dragPlaneRef.current, intersection)) return;

    intersection.add(offsetRef.current);
    const integerSnap = event.nativeEvent?.shiftKey === true;
    onDrag([
      roundDragValue(intersection.x, integerSnap),
      roundDragValue(intersection.y, integerSnap),
      roundDragValue(intersection.z, integerSnap),
    ]);
  }

  return (
    <mesh
      position={position}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={finishDrag}
      onPointerCancel={finishDrag}
      onPointerOver={(event) => {
        event.stopPropagation();
        if (gl?.domElement && !draggingRef.current) gl.domElement.style.cursor = 'grab';
      }}
      onPointerOut={() => {
        if (gl?.domElement && !draggingRef.current) gl.domElement.style.cursor = '';
      }}
      userData={{ dragLabel: label }}
      renderOrder={10}
    >
      <sphereGeometry args={[0.15, 22, 22]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.2} depthTest={false} />
    </mesh>
  );
}

function VectorArrow({ vector, color = '#4f46e5', label, opacity = 1, start = [0, 0, 0] }) {
  const len = length3(vector);
  const dir = normalize3(vector);
  const end = add3(start, vector);

  if (len < 1e-6) return null;

  const arrow = new THREE.ArrowHelper(
    new THREE.Vector3(dir[0], dir[1], dir[2]),
    new THREE.Vector3(start[0], start[1], start[2]),
    len,
    color,
    Math.min(0.35, len * 0.22),
    Math.min(0.2, len * 0.12),
  );

  arrow.traverse((object) => {
    if (!object.material) return;
    object.material.transparent = opacity < 1;
    object.material.opacity = opacity;
    object.material.depthWrite = opacity >= 1;
  });

  return (
    <group>
      <primitive object={arrow} />
      {label && (
        <Html position={[start[0] + (end[0] - start[0]) * 1.06, start[1] + (end[1] - start[1]) * 1.06, start[2] + (end[2] - start[2]) * 1.06]} center>
          <span className="label3d" style={{ borderColor: color, color, opacity }}>{label}</span>
        </Html>
      )}
    </group>
  );
}

function AxisLine({ axis, color, label }) {
  const { camera } = useThree();
  const dir = useMemo(() => new THREE.Vector3(...axis).normalize(), [axis]);
  const negativeGeometry = useMemo(() => new THREE.BufferGeometry(), []);
  const arrow = useMemo(() => new THREE.ArrowHelper(
    dir,
    new THREE.Vector3(0, 0, 0),
    3.9,
    color,
    0.32,
    0.18,
  ), [dir, color]);
  const labelAnchorRef = useRef(null);

  useFrame(() => {
    const cameraDistance = camera.position.length();
    const len = Math.max(2.15, Math.min(3.9, cameraDistance * 0.34));
    const headLength = Math.min(0.32, Math.max(0.24, len * 0.12));
    const headWidth = Math.min(0.18, Math.max(0.14, len * 0.07));
    const start = new THREE.Vector3(...scale3(axis, -len));
    const end = new THREE.Vector3(0, 0, 0);

    negativeGeometry.setFromPoints([start, end]);
    arrow.setLength(len, headLength, headWidth);

    if (labelAnchorRef.current) {
      const labelPos = scale3(axis, len + 0.28);
      labelAnchorRef.current.position.set(labelPos[0], labelPos[1], labelPos[2]);
    }
  });

  return (
    <group>
      <line geometry={negativeGeometry}>
        <lineBasicMaterial color={color} transparent opacity={0.55} />
      </line>
      <primitive object={arrow} />
      <group ref={labelAnchorRef}>
        <Html center>
          <span className="label3d axis-label" style={{ color }}>{label}</span>
        </Html>
      </group>
    </group>
  );
}

function SpanLine3D({ vector, color }) {
  const len = length3(vector);
  if (len < 1e-6) return null;

  const dir = normalize3(vector);
  const p1 = scale3(dir, -5);
  const p2 = scale3(dir, 5);
  const geometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(...p1),
    new THREE.Vector3(...p2),
  ]);

  return (
    <line geometry={geometry}>
      <lineDashedMaterial color={color} dashSize={0.25} gapSize={0.18} transparent opacity={0.75} />
    </line>
  );
}

function DashedBasisAxis3D({ vector, color, label, axisLength = 5.2 }) {
  const len = length3(vector);
  const dir = normalize3(vector);
  const geometry = useMemo(() => {
    const positions = [];
    const dash = 0.36;
    const gap = 0.22;
    const step = dash + gap;

    for (let start = -axisLength; start < axisLength; start += step) {
      const end = Math.min(start + dash, axisLength);
      if (end <= start) continue;
      positions.push(
        dir[0] * start, dir[1] * start, dir[2] * start,
        dir[0] * end, dir[1] * end, dir[2] * end,
      );
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    return geom;
  }, [axisLength, dir]);

  if (len < 1e-6) return null;

  const positiveTipStart = scale3(dir, axisLength - 0.5);
  const positiveTipVector = scale3(dir, 0.5);
  const labelPosition = scale3(dir, axisLength + 0.35);

  return (
    <group>
      <lineSegments geometry={geometry}>
        <lineBasicMaterial color={color} transparent opacity={0.9} />
      </lineSegments>
      <VectorArrow start={positiveTipStart} vector={positiveTipVector} color={color} opacity={0.9} />
      <Html position={labelPosition} center>
        <span className="label3d axis-label" style={{ color }}>{label}</span>
      </Html>
    </group>
  );
}

function BasisParallelogram({ v, u, color = '#0ea5e9', fillOpacity = 0.22, edgeOpacity = 0.95 }) {
  const p0 = [0, 0, 0];
  const p1 = v;
  const p2 = add3(v, u);
  const p3 = u;

  const geometry = useMemo(() => {
    const positions = new Float32Array([...p0, ...p1, ...p2, ...p0, ...p2, ...p3]);
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geom.computeVertexNormals();
    return geom;
  }, [v, u]);

  const edgeGeometry = useMemo(() => {
    const positions = new Float32Array([...p0, ...p1, ...p1, ...p2, ...p2, ...p3, ...p3, ...p0]);
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geom;
  }, [v, u]);

  return (
    <group>
      <mesh geometry={geometry}>
        <meshBasicMaterial color={color} transparent opacity={fillOpacity} side={THREE.DoubleSide} />
      </mesh>
      <lineSegments geometry={edgeGeometry}>
        <lineBasicMaterial color={color} transparent opacity={edgeOpacity} />
      </lineSegments>
    </group>
  );
}

function TransformedUnitCube({ matrix, det }) {
  const color = Math.abs(det) < 0.05 ? '#f59e0b' : det < 0 ? '#dc2626' : '#4f46e5';

  const { surfaceGeometry, edgeGeometry } = useMemo(() => {
    const corners = [];
    for (let i = 0; i < 8; i += 1) {
      const base = [(i >> 0) & 1, (i >> 1) & 1, (i >> 2) & 1];
      corners.push(matVec3(matrix, base));
    }

    const faces = [
      [0, 1, 3, 2],
      [4, 5, 7, 6],
      [0, 1, 5, 4],
      [2, 3, 7, 6],
      [0, 2, 6, 4],
      [1, 3, 7, 5],
    ];

    const surfacePositions = [];
    faces.forEach((face) => {
      const [a, b, c, d] = face.map((index) => corners[index]);
      surfacePositions.push(...a, ...b, ...c, ...a, ...c, ...d);
    });

    const surface = new THREE.BufferGeometry();
    surface.setAttribute('position', new THREE.Float32BufferAttribute(surfacePositions, 3));
    surface.computeVertexNormals();

    const edgePairs = [
      [0, 1], [0, 2], [0, 4], [1, 3], [1, 5], [2, 3],
      [2, 6], [3, 7], [4, 5], [4, 6], [5, 7], [6, 7],
    ];
    const edgePositions = [];
    edgePairs.forEach(([a, b]) => edgePositions.push(...corners[a], ...corners[b]));

    const edges = new THREE.BufferGeometry();
    edges.setAttribute('position', new THREE.Float32BufferAttribute(edgePositions, 3));

    return { surfaceGeometry: surface, edgeGeometry: edges };
  }, [matrix]);

  return (
    <group>
      <mesh geometry={surfaceGeometry}>
        <meshLambertMaterial color={color} transparent opacity={0.18} side={THREE.DoubleSide} />
      </mesh>
      <lineSegments geometry={edgeGeometry}>
        <lineBasicMaterial color={color} transparent opacity={0.9} />
      </lineSegments>
    </group>
  );
}

function Scene3D({ state, interactive, onDraggingChange }) {
  const setVector = useVisualizerStore((store) => store.setVector);
  const setMatrix = useVisualizerStore((store) => store.setMatrix);
  const setCoefficients = useVisualizerStore((store) => store.setCoefficients);
  const Mt = useMemo(() => lerpMatrix3(state.A, state.t), [state.A, state.t]);
  const det = useMemo(() => {
    const [a, b, c] = Mt[0];
    const [d, e, f] = Mt[1];
    const [g, h, i] = Mt[2];
    return a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);
  }, [Mt]);

  const matrixIsUsed = state.concept === 'transformation' || state.concept === 'determinant' || state.concept === 'eigen';
  const iHat = useMemo(() => matVec3(Mt, [1, 0, 0]), [Mt]);
  const jHat = useMemo(() => matVec3(Mt, [0, 1, 0]), [Mt]);
  const kHat = useMemo(() => matVec3(Mt, [0, 0, 1]), [Mt]);
  const Av = useMemo(() => matVec3(Mt, state.v), [Mt, state.v]);
  const Au = useMemo(() => matVec3(Mt, state.u), [Mt, state.u]);
  const combination = useMemo(() => linComb3(state.alpha, state.u, state.beta, state.v), [state.alpha, state.u, state.beta, state.v]);

  return (
    <>
      <ambientLight intensity={0.85} />
      <directionalLight position={[5, 8, 6]} intensity={0.55} />
      <directionalLight position={[-4, 4, -3]} intensity={0.2} />

      <gridHelper args={[10, 10, '#cdd5e0', '#e3e8f0']} />
      <AxisLine axis={[1, 0, 0]} color="#ef4444" label="x" />
      <AxisLine axis={[0, 1, 0]} color="#22c55e" label="y" />
      <AxisLine axis={[0, 0, 1]} color="#3b82f6" label="z" />

      {(state.concept === 'determinant' || state.concept === 'transformation') && (
        <TransformedUnitCube matrix={Mt} det={det} />
      )}

      {matrixIsUsed && (
        <>
          <VectorArrow vector={iHat} color="#ef4444" label="A·e₁" />
          <VectorArrow vector={jHat} color="#22c55e" label="A·e₂" />
          <VectorArrow vector={kHat} color="#3b82f6" label="A·e₃" />
          <DraggableHandle3D position={iHat} color="#ef4444" label="A·e₁" interactive={interactive} onDraggingChange={onDraggingChange} onDrag={(point) => setMatrix(replaceMatrixColumn(state.A, 0, point))} />
          <DraggableHandle3D position={jHat} color="#22c55e" label="A·e₂" interactive={interactive} onDraggingChange={onDraggingChange} onDrag={(point) => setMatrix(replaceMatrixColumn(state.A, 1, point))} />
          <DraggableHandle3D position={kHat} color="#3b82f6" label="A·e₃" interactive={interactive} onDraggingChange={onDraggingChange} onDrag={(point) => setMatrix(replaceMatrixColumn(state.A, 2, point))} />
        </>
      )}

      {state.concept === 'combination' ? (
        <>
          <VectorArrow vector={state.u} color="#f97316" label="u" opacity={0.65} />
          <VectorArrow vector={state.v} color="#4f46e5" label="v" opacity={0.65} />
          <VectorArrow vector={scale3(state.u, state.alpha)} color="#f97316" label="αu" />
          <VectorArrow vector={scale3(state.v, state.beta)} color="#4f46e5" label="βv" />
          <VectorArrow start={scale3(state.u, state.alpha)} vector={scale3(state.v, state.beta)} color="#4f46e5" opacity={0.7} />
          <VectorArrow start={scale3(state.v, state.beta)} vector={scale3(state.u, state.alpha)} color="#f97316" opacity={0.7} />
          <VectorArrow vector={combination} color="#0ea5e9" label="αu+βv" />
          <BasisParallelogram v={scale3(state.v, state.beta)} u={scale3(state.u, state.alpha)} color="#0ea5e9" />
        </>
      ) : state.concept === 'transformation' ? (
        <>
          <VectorArrow vector={state.v} color="#4f46e5" label="v" opacity={0.45} />
          <VectorArrow vector={Av} color="#4f46e5" label="A·v" />
        </>
      ) : state.concept === 'eigen' ? (
        <>
          <SpanLine3D vector={state.v} color="#4f46e5" />
          <VectorArrow vector={state.v} color="#4f46e5" label="v" opacity={0.45} />
          <VectorArrow vector={Av} color="#4f46e5" label="A·v" />
        </>
      ) : null}

      {(state.concept === 'span' || state.concept === 'basis') && (
        <>
          <VectorArrow vector={state.v} color="#4f46e5" label="v" opacity={state.concept === 'basis' ? 0.6 : 1} />
          <VectorArrow vector={state.u} color="#f97316" label="u" opacity={state.concept === 'basis' ? 0.6 : 1} />
          {state.concept === 'basis' ? (
            <>
              <DashedBasisAxis3D vector={state.u} color="#f97316" label="ציר u" />
              <DashedBasisAxis3D vector={state.v} color="#4f46e5" label="ציר v" />
            </>
          ) : (
            <>
              <SpanLine3D vector={state.v} color="#4f46e5" />
              <SpanLine3D vector={state.u} color="#f97316" />
            </>
          )}
          <BasisParallelogram v={state.v} u={state.u} color="#0ea5e9" fillOpacity={state.concept === 'basis' ? 0.08 : 0.22} edgeOpacity={state.concept === 'basis' ? 0.45 : 0.95} />
          {state.concept === 'basis' && (
            <>
              <VectorArrow vector={scale3(state.u, state.alpha)} color="#f97316" label="αu" />
              <VectorArrow vector={scale3(state.v, state.beta)} color="#4f46e5" label="βv" />
              <VectorArrow start={scale3(state.u, state.alpha)} vector={scale3(state.v, state.beta)} color="#4f46e5" opacity={0.75} />
              <VectorArrow start={scale3(state.v, state.beta)} vector={scale3(state.u, state.alpha)} color="#f97316" opacity={0.75} />
              <VectorArrow vector={[state.alpha * state.u[0] + state.beta * state.v[0], state.alpha * state.u[1] + state.beta * state.v[1], state.alpha * state.u[2] + state.beta * state.v[2]]} color="#0ea5e9" label="w" />
              <BasisParallelogram v={scale3(state.v, state.beta)} u={scale3(state.u, state.alpha)} color="#0ea5e9" fillOpacity={0.14} edgeOpacity={0.8} />
            </>
          )}
        </>
      )}

      {(state.concept === 'transformation' || state.concept === 'eigen') && (
        <DraggableHandle3D
          position={state.v}
          color="#4f46e5"
          label="v"
          interactive={interactive}
          onDraggingChange={onDraggingChange}
          onDrag={(point) => setVector('v', point)}
        />
      )}

      {(state.concept === 'combination' || state.concept === 'span' || state.concept === 'basis') && (
        <>
          <DraggableHandle3D position={state.u} color="#f97316" label="u" interactive={interactive} onDraggingChange={onDraggingChange} onDrag={(point) => setVector('u', point)} />
          <DraggableHandle3D position={state.v} color="#4f46e5" label="v" interactive={interactive} onDraggingChange={onDraggingChange} onDrag={(point) => setVector('v', point)} />
        </>
      )}

      {(state.concept === 'combination' || state.concept === 'basis') && (
        <DraggableHandle3D
          position={combination}
          color="#0ea5e9"
          label="w"
          interactive={interactive}
          onDraggingChange={onDraggingChange}
          onDrag={(point) => {
            const coefficients = coefficientsInSpan3D(state.u, state.v, point);
            if (coefficients) setCoefficients(roundDragValue(coefficients[0]), roundDragValue(coefficients[1]));
          }}
        />
      )}

    </>
  );
}

function CameraSyncControls({ role, followLecturer, onCameraChange, enabled = true }) {
  const camera3D = useVisualizerStore((s) => s.camera3D);
  const setCamera3D = useVisualizerStore((s) => s.setCamera3D);
  const { camera } = useThree();
  const controlsRef = useRef(null);
  const lastSentRef = useRef(0);
  const applyingRemoteRef = useRef(false);

  useEffect(() => {
    if (role !== 'student' || !followLecturer || !camera3D || !controlsRef.current) return;

    applyingRemoteRef.current = true;
    camera.position.set(...camera3D.position);
    camera.zoom = camera3D.zoom || 1;
    camera.updateProjectionMatrix();
    controlsRef.current.target.set(...camera3D.target);
    controlsRef.current.update();

    requestAnimationFrame(() => {
      applyingRemoteRef.current = false;
    });
  }, [camera, camera3D, followLecturer, role]);

  function handleChange() {
    if (!controlsRef.current || applyingRemoteRef.current) return;

    const nextCamera = {
      position: [camera.position.x, camera.position.y, camera.position.z],
      target: [controlsRef.current.target.x, controlsRef.current.target.y, controlsRef.current.target.z],
      zoom: camera.zoom || 1,
    };

    if (role === 'lecturer') {
      setCamera3D(nextCamera);

      const now = Date.now();
      if (now - lastSentRef.current >= 120) {
        lastSentRef.current = now;
        onCameraChange?.(nextCamera);
      }
    }

    if (role === 'student' && !followLecturer) {
      setCamera3D(nextCamera);
    }
  }

  return <OrbitControls ref={controlsRef} makeDefault enabled={enabled} enableDamping dampingFactor={0.08} onChange={handleChange} />;
}

export default function Canvas3D({ role = 'lecturer', followLecturer = false, onCameraChange } = {}) {
  const [isDragging, setIsDragging] = useState(false);
  const dim = useVisualizerStore((s) => s.dim);
  const concept = useVisualizerStore((s) => s.concept);
  const A = useVisualizerStore((s) => s.A);
  const v = useVisualizerStore((s) => s.v);
  const u = useVisualizerStore((s) => s.u);
  const alpha = useVisualizerStore((s) => s.alpha);
  const beta = useVisualizerStore((s) => s.beta);
  const t = useVisualizerStore((s) => s.t);

  const state = { dim, concept, A, v, u, alpha, beta, t };
  const interactive = !(role === 'student' && followLecturer);

  return (
    <div className="canvas3d d3-only" aria-label="הדמיה תלת־ממדית של אלגברה לינארית">
      <Canvas camera={{ position: [7.2, 6.2, 8.2], fov: 44, near: 0.1, far: 100 }}>
        <color attach="background" args={['#f1f4fa']} />
        <Scene3D state={state} interactive={interactive} onDraggingChange={setIsDragging} />
        <CameraSyncControls role={role} followLecturer={followLecturer} onCameraChange={onCameraChange} enabled={!isDragging} />
      </Canvas>
      <div className="canvas3d-help">{interactive ? 'גררו נקודה צבעונית לשינוי ערך · גררו רקע לסיבוב · Shift להצמדה למספרים שלמים' : 'גררו כדי לסובב · גללו כדי לשנות מרחק'}</div>
    </div>
  );
}
