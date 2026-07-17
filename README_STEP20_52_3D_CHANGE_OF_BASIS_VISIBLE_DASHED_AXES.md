# Step 20.52 — 3D Change of Basis Visible Dashed Axes

## What changed

This update fixes the 3D Change of Basis visualization so the second coordinate system is clearly visible.

### 3D Change of Basis
- Added explicit dashed basis axes for the second coordinate system:
  - `u-axis`
  - `v-axis`
- The dashed axes are drawn as real segmented 3D lines, so they are visible instead of relying on Three.js dashed-line rendering behavior.
- Added small positive-direction arrowheads to the dashed axes.
- Kept the standard `x`, `y`, `z` coordinate axes visible.
- Kept the same vector `w` visible together with its basis decomposition:
  - `αu`
  - `βv`
  - `w = αu + βv`

## Educational goal

The visualization now better emphasizes that Change of Basis means the same geometric vector can be described using two coordinate systems:

- the standard coordinate system,
- and the basis coordinate system defined by `u` and `v`.

Because this 3D view currently uses two basis vectors, the dashed `u-axis` and `v-axis` represent a basis plane inside 3D space rather than a full 3D basis with three basis vectors.

## Files changed

- `frontend/src/components/Canvas3D.jsx`
