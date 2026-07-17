export function fmt(n) {
  if (typeof n !== 'number' || Number.isNaN(n)) return '—';
  if (Math.abs(n) < 1e-9) return '0';
  return (Math.round(n * 100) / 100).toString();
}

export function matVec(M, v) {
  return [
    M[0][0] * v[0] + M[0][1] * v[1],
    M[1][0] * v[0] + M[1][1] * v[1],
  ];
}

export function matVec3(M, v) {
  return [
    M[0][0] * v[0] + M[0][1] * v[1] + M[0][2] * v[2],
    M[1][0] * v[0] + M[1][1] * v[1] + M[1][2] * v[2],
    M[2][0] * v[0] + M[2][1] * v[1] + M[2][2] * v[2],
  ];
}

export function determinant(M) {
  return M[0][0] * M[1][1] - M[0][1] * M[1][0];
}

export function det3(M) {
  const [a, b, c] = M[0];
  const [d, e, f] = M[1];
  const [g, h, i] = M[2];
  return a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);
}

export function currentDet(M) {
  return M.length === 3 ? det3(M) : determinant(M);
}

export function identityMatrix(n) {
  return Array.from({ length: n }, (_, row) =>
    Array.from({ length: n }, (_, col) => (row === col ? 1 : 0))
  );
}

export function isInvertible(M) {
  return Math.abs(currentDet(M)) > 1e-6;
}

export function inverse2x2(M) {
  const det = determinant(M);
  if (Math.abs(det) <= 1e-6) return null;
  return [
    [M[1][1] / det, -M[0][1] / det],
    [-M[1][0] / det, M[0][0] / det],
  ];
}

export function inverse3(M) {
  const det = det3(M);
  if (Math.abs(det) <= 1e-6) return null;

  const [a, b, c] = M[0];
  const [d, e, f] = M[1];
  const [g, h, i] = M[2];

  return [
    [(e * i - f * h) / det, (c * h - b * i) / det, (b * f - c * e) / det],
    [(f * g - d * i) / det, (a * i - c * g) / det, (c * d - a * f) / det],
    [(d * h - e * g) / det, (b * g - a * h) / det, (a * e - b * d) / det],
  ];
}

export function inverse(M) {
  return M.length === 3 ? inverse3(M) : inverse2x2(M);
}


export function multiplyMatrices2D(A, B) {
  return [
    [A[0][0] * B[0][0] + A[0][1] * B[1][0], A[0][0] * B[0][1] + A[0][1] * B[1][1]],
    [A[1][0] * B[0][0] + A[1][1] * B[1][0], A[1][0] * B[0][1] + A[1][1] * B[1][1]],
  ];
}

export function matrixColumns2D(M) {
  return {
    first: [Number(M?.[0]?.[0]) || 0, Number(M?.[1]?.[0]) || 0],
    second: [Number(M?.[0]?.[1]) || 0, Number(M?.[1]?.[1]) || 0],
  };
}

export function transitionMatrix2D(fromBasisMatrix, toBasisMatrix) {
  const inverseTarget = inverse2x2(toBasisMatrix);
  return inverseTarget ? multiplyMatrices2D(inverseTarget, fromBasisMatrix) : null;
}

export function multiply(M, v) {
  return M.length === 3 ? matVec3(M, v) : matVec(M, v);
}

export function linComb(alpha, u, beta, v) {
  const n = Math.max(u.length, v.length);
  return Array.from({ length: n }, (_, index) => alpha * (u[index] ?? 0) + beta * (v[index] ?? 0));
}

export function linComb3(alpha, u, beta, v) {
  return [
    alpha * (u[0] ?? 0) + beta * (v[0] ?? 0),
    alpha * (u[1] ?? 0) + beta * (v[1] ?? 0),
    alpha * (u[2] ?? 0) + beta * (v[2] ?? 0),
  ];
}

export function lerpMatrix(A, t) {
  const I = [[1, 0], [0, 1]];
  return [
    [I[0][0] * (1 - t) + A[0][0] * t, I[0][1] * (1 - t) + A[0][1] * t],
    [I[1][0] * (1 - t) + A[1][0] * t, I[1][1] * (1 - t) + A[1][1] * t],
  ];
}

export function lerpMatrix3(A, t) {
  const I = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
  return I.map((row, i) => row.map((value, j) => value * (1 - t) + A[i][j] * t));
}

export function eigenInfo(M) {
  const [[a, b], [c, d]] = M;
  const tr = a + d;
  const det = a * d - b * c;
  const disc = tr * tr - 4 * det;
  if (disc < -1e-9) return { real: false, pairs: [] };

  const s = Math.sqrt(Math.max(0, disc));
  const lambdas = [(tr + s) / 2, (tr - s) / 2];
  const pairs = [];

  for (const lambda of lambdas) {
    let v;
    if (Math.abs(b) > 1e-9) v = [b, lambda - a];
    else if (Math.abs(c) > 1e-9) v = [lambda - d, c];
    else v = [lambda === a ? 1 : 0, lambda === d ? 1 : 0];

    const n = Math.hypot(v[0], v[1]);
    if (n < 1e-9) continue;
    v = [v[0] / n, v[1] / n];

    if (!pairs.some((p) => Math.abs(p.v[0] * v[1] - p.v[1] * v[0]) < 1e-3)) {
      pairs.push({ lambda, v });
    }
  }

  return { real: true, pairs };
}

export function classifyTransform(M) {
  const [[a, b], [c, d]] = M;
  const det = determinant(M);
  const eps = 0.05;

  if (Math.abs(a - 1) < eps && Math.abs(d - 1) < eps && Math.abs(b) < eps && Math.abs(c) < eps) {
    return 'Identity';
  }
  if (Math.abs(det) < 1e-4) return 'Collapse / Projection';
  if (Math.abs(b) < eps && Math.abs(c) < eps && Math.abs(a - d) < eps) return 'Uniform scaling';
  if (Math.abs(b) < eps && Math.abs(c) < eps) return 'Non-uniform scaling';

  const ATA00 = a * a + c * c;
  const ATA11 = b * b + d * d;
  const ATA01 = a * b + c * d;
  if (Math.abs(ATA00 - 1) < eps && Math.abs(ATA11 - 1) < eps && Math.abs(ATA01) < eps) {
    return det > 0 ? 'Rotation' : 'Reflection';
  }

  if (det < 0) return 'Reflection / orientation flip';
  if (Math.abs(a - 1) < eps && Math.abs(d - 1) < eps) return 'Shear-like';
  return 'General linear map';
}

export function classifyTransform3(M) {
  const det = det3(M);
  if (Math.abs(det) < 1e-4) return 'Collapse / lower-rank';

  let isI = true;
  for (let i = 0; i < 3; i += 1) {
    for (let j = 0; j < 3; j += 1) {
      if (Math.abs(M[i][j] - (i === j ? 1 : 0)) > 0.05) isI = false;
    }
  }
  if (isI) return 'Identity';

  const diagonalEqual = Math.abs(M[0][0] - M[1][1]) < 0.05 && Math.abs(M[1][1] - M[2][2]) < 0.05;
  const offDiagonalZero =
    Math.abs(M[0][1]) < 0.05 && Math.abs(M[0][2]) < 0.05 &&
    Math.abs(M[1][0]) < 0.05 && Math.abs(M[1][2]) < 0.05 &&
    Math.abs(M[2][0]) < 0.05 && Math.abs(M[2][1]) < 0.05;
  if (diagonalEqual && offDiagonalZero) return 'Uniform scaling';

  let isOrtho = true;
  for (let i = 0; i < 3; i += 1) {
    for (let j = 0; j < 3; j += 1) {
      const dot = M[0][i] * M[0][j] + M[1][i] * M[1][j] + M[2][i] * M[2][j];
      if (Math.abs(dot - (i === j ? 1 : 0)) > 0.05) isOrtho = false;
    }
  }
  if (isOrtho) return det > 0 ? 'Rotation' : 'Reflection / orientation flip';
  if (det < 0) return 'Orientation-flipping map';
  return 'General linear map';
}

export function formatVector(v) {
  return `(${v.map(fmt).join(', ')})`;
}

export function basisMatrix2D(u, v) {
  return [
    [Number(u?.[0]) || 0, Number(v?.[0]) || 0],
    [Number(u?.[1]) || 0, Number(v?.[1]) || 0],
  ];
}

export function standardFromBasisCoordinates2D(u, v, coordinates) {
  return matVec(basisMatrix2D(u, v), coordinates);
}

export function basisCoordinates2D(u, v, standardVector) {
  const basisMatrix = basisMatrix2D(u, v);
  const inverseBasis = inverse2x2(basisMatrix);
  return inverseBasis ? matVec(inverseBasis, standardVector) : null;
}

export function roundInteractiveValue(value, precision = 2) {
  const factor = 10 ** precision;
  const rounded = Math.round((Number(value) || 0) * factor) / factor;
  return Object.is(rounded, -0) ? 0 : rounded;
}
