# Step20-50 — Fix linear combination visualization in 2D and 3D

## What changed
- Preserved the 2D fix where the result vector is shown as the diagonal of the parallelogram built from **αu** and **βv**.
- Fixed the 3D linear-combination view so the same geometric idea is clear there as well.
- In 3D, both **αu** and **βv** start from the common origin.
- Added translated copies of the scaled vectors from the endpoints of each other, so the parallelogram construction is visually explicit.
- Kept the result vector **αu + βv** as the diagonal from the origin to the opposite corner.

## Files changed
- `frontend/src/components/Canvas2D.jsx`
- `frontend/src/components/Canvas3D.jsx`
