import { create } from 'zustand';

const default2D = {
  A: [[1, 0], [0, 1]],
  v: [2, 1],
  u: [-1, 2],
};

const default3D = {
  A: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
  v: [2, 1, 1],
  u: [-1, 2, 1],
};

const defaultTargetBasis2D = {
  first: [1, 1],
  second: [-1, 1],
};

const defaultBasisTransition2D = [[1, 0], [0, 1]];

const presets2D = {
  identity: [[1, 0], [0, 1]],
  scale: [[1.5, 0], [0, 1.5]],
  rotate: [[0.71, -0.71], [0.71, 0.71]],
  shear: [[1, 1], [0, 1]],
  reflect: [[1, 0], [0, -1]],
  collapse: [[1, 1], [2, 2]],
};

const presets3D = {
  identity: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
  scale: [[1.5, 0, 0], [0, 1.5, 0], [0, 0, 1.5]],
  rotate: [[0.71, -0.71, 0], [0.71, 0.71, 0], [0, 0, 1]],
  shear: [[1, 1, 0], [0, 1, 0], [0, 0, 1]],
  reflect: [[1, 0, 0], [0, 1, 0], [0, 0, -1]],
  collapse: [[1, 0, 1], [0, 1, 1], [1, 1, 2]],
};

const rotateAngles = [45, 90, 135, 180, 225, 270, 315, 0];

function roundPresetValue(value) {
  const rounded = Math.round(value * 100) / 100;
  return Object.is(rounded, -0) ? 0 : rounded;
}

function rotationMatrix2D(degrees) {
  const rad = (degrees * Math.PI) / 180;
  const c = roundPresetValue(Math.cos(rad));
  const s = roundPresetValue(Math.sin(rad));
  return [[c, -s], [s, c]];
}

function rotationMatrix3D(degrees) {
  const R = rotationMatrix2D(degrees);
  return [
    [R[0][0], R[0][1], 0],
    [R[1][0], R[1][1], 0],
    [0, 0, 1],
  ];
}

function matricesClose(A, B, tolerance = 0.02) {
  if (!Array.isArray(A) || !Array.isArray(B) || A.length !== B.length) return false;

  return A.every((row, rowIndex) => (
    Array.isArray(row)
    && Array.isArray(B[rowIndex])
    && row.length === B[rowIndex].length
    && row.every((cell, colIndex) => Math.abs((Number(cell) || 0) - B[rowIndex][colIndex]) <= tolerance)
  ));
}

function nextRotationPreset(currentMatrix, dim) {
  const builders = dim === 3 ? rotationMatrix3D : rotationMatrix2D;
  const currentIndex = rotateAngles.findIndex((degrees) => matricesClose(currentMatrix, builders(degrees)));
  const nextAngle = currentIndex === -1 ? rotateAngles[0] : rotateAngles[(currentIndex + 1) % rotateAngles.length];
  return builders(nextAngle);
}

function cloneValue(value) {
  if (Array.isArray(value)) return value.map(cloneValue);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, nested]) => [key, cloneValue(nested)]));
  }
  return value;
}

function cloneMatrix(M) {
  return M.map((row) => [...row]);
}

function basisMatrixFromVectors(first, second) {
  return [
    [Number(first?.[0]) || 0, Number(second?.[0]) || 0],
    [Number(first?.[1]) || 0, Number(second?.[1]) || 0],
  ];
}

function inverse2D(M) {
  const det = M[0][0] * M[1][1] - M[0][1] * M[1][0];
  if (Math.abs(det) <= 1e-8) return null;
  return [
    [M[1][1] / det, -M[0][1] / det],
    [-M[1][0] / det, M[0][0] / det],
  ];
}

function multiplyMatrices2D(A, B) {
  return [
    [A[0][0] * B[0][0] + A[0][1] * B[1][0], A[0][0] * B[0][1] + A[0][1] * B[1][1]],
    [A[1][0] * B[0][0] + A[1][1] * B[1][0], A[1][0] * B[0][1] + A[1][1] * B[1][1]],
  ];
}

function targetBasisFromTransition(first, second, transition) {
  const inverseTransition = inverse2D(transition);
  if (!inverseTransition) return null;
  const sourceMatrix = basisMatrixFromVectors(first, second);
  const targetMatrix = multiplyMatrices2D(sourceMatrix, inverseTransition);
  return {
    first: [targetMatrix[0][0], targetMatrix[1][0]],
    second: [targetMatrix[0][1], targetMatrix[1][1]],
  };
}

function cloneDimState(value) {
  return {
    A: cloneMatrix(value.A),
    v: [...value.v],
    u: [...value.u],
  };
}

const initialCache = {
  2: cloneDimState(default2D),
  3: cloneDimState(default3D),
};

const defaultCamera3D = {
  position: [6, 5, 7],
  target: [0, 0, 0],
  zoom: 1,
};

const defaultPolynomialP = [1, 2, 0];
const defaultPolynomialQ = [0, 1, -1];
const defaultAbstractMatrixA = [[1, 2], [0, 1]];
const defaultAbstractMatrixB = [[0, 1], [3, -1]];

const initialState = {
  dim: 2,
  concept: 'transformation',
  abstractSpace: 'polynomials',
  functionPair: 'trig',
  polynomialP: [...defaultPolynomialP],
  polynomialQ: [...defaultPolynomialQ],
  abstractMatrixA: cloneMatrix(defaultAbstractMatrixA),
  abstractMatrixB: cloneMatrix(defaultAbstractMatrixB),
  A: cloneMatrix(default2D.A),
  v: [...default2D.v],
  u: [...default2D.u],
  basisTargetU: [...defaultTargetBasis2D.first],
  basisTargetV: [...defaultTargetBasis2D.second],
  basisInputMode: 'bases',
  basisTransition: cloneMatrix(defaultBasisTransition2D),
  showPlaneCombinations: true,
  alpha: 1,
  beta: 1,
  t: 1,
  animSpeed: 1,
  camera3D: { ...defaultCamera3D },
  canvas2DZoom: 1,
  dimCache: initialCache,
};

const syncKeys = ['dim', 'concept', 'abstractSpace', 'functionPair', 'polynomialP', 'polynomialQ', 'abstractMatrixA', 'abstractMatrixB', 'A', 'v', 'u', 'basisTargetU', 'basisTargetV', 'basisInputMode', 'basisTransition', 'showPlaneCombinations', 'alpha', 'beta', 't', 'animSpeed', 'camera3D', 'canvas2DZoom'];

function createDimCacheFromState(state) {
  const current = {
    A: state.A,
    v: state.v,
    u: state.u,
  };

  const nextCache = {
    ...state.dimCache,
    [state.dim]: cloneDimState(current),
  };

  return nextCache;
}

function normalizePatchForStore(patch = {}) {
  const cleanPatch = {};

  for (const key of syncKeys) {
    if (Object.prototype.hasOwnProperty.call(patch, key)) {
      cleanPatch[key] = cloneValue(patch[key]);
    }
  }

  return cleanPatch;
}

export const useVisualizerStore = create((set, get) => ({
  ...initialState,

  setDim: (dim) => set((state) => {
    if (state.dim === dim) return state;

    const nextCache = createDimCacheFromState(state);
    const restored = nextCache[dim] ?? (dim === 3 ? default3D : default2D);

    return {
      dim,
      t: 1,
      A: cloneMatrix(restored.A),
      v: [...restored.v],
      u: [...restored.u],
      dimCache: nextCache,
    };
  }),

  setConcept: (concept) => set({ concept, t: 1 }),
  setAbstractSpace: (abstractSpace) => set({ abstractSpace }),
  setFunctionPair: (functionPair) => set({ functionPair }),
  setPolynomialCoeff: (which, index, value) => set((state) => {
    const key = which === 'q' ? 'polynomialQ' : 'polynomialP';
    const next = [...state[key]];
    next[index] = Number.isFinite(value) ? value : 0;
    return { [key]: next };
  }),
  setAbstractMatrixEntry: (which, rowIndex, colIndex, value) => set((state) => {
    const key = which === 'b' ? 'abstractMatrixB' : 'abstractMatrixA';
    const next = cloneMatrix(state[key]);
    next[rowIndex][colIndex] = Number.isFinite(value) ? value : 0;
    return { [key]: next };
  }),
  resetAbstractObjects: () => set({
    polynomialP: [...defaultPolynomialP],
    polynomialQ: [...defaultPolynomialQ],
    abstractMatrixA: cloneMatrix(defaultAbstractMatrixA),
    abstractMatrixB: cloneMatrix(defaultAbstractMatrixB),
  }),
  setMatrix: (A) => set({ A: cloneMatrix(A), t: 1 }),
  setVector: (key, value) => set((state) => {
    const nextValue = [...value];
    const patch = { [key]: nextValue, t: 1 };

    if (state.dim === 2 && state.basisInputMode === 'transition' && (key === 'u' || key === 'v')) {
      const nextU = key === 'u' ? nextValue : state.u;
      const nextV = key === 'v' ? nextValue : state.v;
      const derived = targetBasisFromTransition(nextU, nextV, state.basisTransition);
      if (derived) {
        patch.basisTargetU = derived.first;
        patch.basisTargetV = derived.second;
      }
    }

    return patch;
  }),
  setBasisTargetVector: (key, value) => set({ [key]: [...value], t: 1 }),
  setBasisInputMode: (basisInputMode) => set({ basisInputMode }),
  setBasisTransition: (basisTransition) => set((state) => {
    const nextTransition = cloneMatrix(basisTransition);
    const derived = targetBasisFromTransition(state.u, state.v, nextTransition);
    return {
      basisTransition: nextTransition,
      ...(derived ? { basisTargetU: derived.first, basisTargetV: derived.second } : {}),
      t: 1,
    };
  }),
  setShowPlaneCombinations: (showPlaneCombinations) => set({ showPlaneCombinations: Boolean(showPlaneCombinations) }),
  setAlpha: (alpha) => set({ alpha }),
  setBeta: (beta) => set({ beta }),
  setCoefficients: (alpha, beta) => set({ alpha, beta, t: 1 }),
  setT: (t) => set({ t }),
  setAnimSpeed: (animSpeed) => set({ animSpeed }),
  setCamera3D: (camera3D) => set({ camera3D: cloneValue(camera3D) }),
  setCanvas2DZoom: (canvas2DZoom) => set({ canvas2DZoom: Math.max(0.5, Math.min(3, Number(canvas2DZoom) || 1)) }),
  zoomIn2D: () => set((state) => ({ canvas2DZoom: Math.min(3, Number((state.canvas2DZoom + 0.2).toFixed(2))) })),
  zoomOut2D: () => set((state) => ({ canvas2DZoom: Math.max(0.5, Number((state.canvas2DZoom - 0.2).toFixed(2))) })),
  resetZoom2D: () => set({ canvas2DZoom: 1 }),

  resetState: () => set({
    ...initialState,
    A: cloneMatrix(default2D.A),
    v: [...default2D.v],
    u: [...default2D.u],
    basisTargetU: [...defaultTargetBasis2D.first],
    basisTargetV: [...defaultTargetBasis2D.second],
    basisInputMode: 'bases',
    basisTransition: cloneMatrix(defaultBasisTransition2D),
    showPlaneCombinations: true,
    polynomialP: [...defaultPolynomialP],
    polynomialQ: [...defaultPolynomialQ],
    abstractMatrixA: cloneMatrix(defaultAbstractMatrixA),
    abstractMatrixB: cloneMatrix(defaultAbstractMatrixB),
    camera3D: { ...defaultCamera3D },
    canvas2DZoom: 1,
    dimCache: {
      2: cloneDimState(default2D),
      3: cloneDimState(default3D),
    },
  }),

  applyPreset: (name) => {
    const { dim, A } = get();

    if (name === 'rotate') {
      set({ A: cloneMatrix(nextRotationPreset(A, dim)), t: 1 });
      return;
    }

    const preset = dim === 3 ? presets3D[name] : presets2D[name];
    if (!preset) return;
    set({ A: cloneMatrix(preset), t: 1 });
  },

  getSyncSnapshot: () => {
    const state = get();
    return {
      dim: state.dim,
      concept: state.concept,
      abstractSpace: state.abstractSpace,
      functionPair: state.functionPair,
      polynomialP: cloneValue(state.polynomialP),
      polynomialQ: cloneValue(state.polynomialQ),
      abstractMatrixA: cloneValue(state.abstractMatrixA),
      abstractMatrixB: cloneValue(state.abstractMatrixB),
      A: cloneValue(state.A),
      v: cloneValue(state.v),
      u: cloneValue(state.u),
      basisTargetU: cloneValue(state.basisTargetU),
      basisTargetV: cloneValue(state.basisTargetV),
      basisInputMode: state.basisInputMode,
      basisTransition: cloneValue(state.basisTransition),
      showPlaneCombinations: state.showPlaneCombinations,
      alpha: state.alpha,
      beta: state.beta,
      t: state.t,
      animSpeed: state.animSpeed,
      camera3D: cloneValue(state.camera3D),
      canvas2DZoom: state.canvas2DZoom,
    };
  },

  applyRemotePatch: (patch = {}) => set((state) => {
    const cleanPatch = normalizePatchForStore(patch);
    if (Object.keys(cleanPatch).length === 0) return state;

    const next = {
      ...state,
      ...cleanPatch,
    };

    if (Object.prototype.hasOwnProperty.call(cleanPatch, 'dim') || cleanPatch.A || cleanPatch.v || cleanPatch.u) {
      next.dimCache = {
        ...state.dimCache,
        [next.dim]: cloneDimState({ A: next.A, v: next.v, u: next.u }),
      };
    }

    return next;
  }),
}));

export const PRESET_NAMES = Object.keys(presets2D);
