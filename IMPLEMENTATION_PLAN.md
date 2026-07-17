# Linear Algebra Visualizer — Implementation Plan (School Project)

Step-by-step plan to turn the single-file HTML demo into a real, multi-user web application matching the project brief. Optimized for a school project: single developer or small team, ~5 weeks, presentable end result.

---

## 1. Target Architecture

```
┌───────────────────────────────┐         ┌──────────────────────────────┐
│         FRONTEND              │  HTTPS  │           BACKEND            │
│   React 18 + Vite             │ ◀─────▶ │   Node.js 20                 │
│   React Three Fiber (3D)      │         │   Express (thin REST)        │
│   Canvas 2D (from demo)       │ ◀─WS──▶ │   Socket.io (real-time)      │
│   math.js                     │         │   In-memory rooms (Map)      │
│   Zustand                     │         └──────────────────────────────┘
│   Plain CSS                   │
└───────────────────────────────┘

   Plain JavaScript (no TypeScript)
   No database · No auth · No persistence
   Rooms exist only while the lecturer's tab is open.
```

**Repository layout — just two folders, no monorepo tooling:**

```
visualizer/
├── frontend/             # React app (Vite)
│   ├── src/
│   ├── package.json
│   └── vite.config.js
├── backend/              # Express + Socket.io
│   ├── src/
│   └── package.json
└── README.md
```

Two folders, two `package.json` files. Run each with its own `npm run dev`.

---

## 2. Phased Roadmap (~5 weeks)

| Phase | Duration | Deliverable |
|---|---|---|
| 0 — Setup | Day 1–2 | Two folders, both apps boot |
| 1 — FE skeleton | Week 1 | React app with demo's UI ported |
| 2 — Visualization | Week 2 | 2D + 3D engines as React components |
| 3 — Math core | Week 2 (parallel) | Math helpers extracted into modules |
| 4 — BE foundation | Week 3 | Express + Socket.io server, in-memory rooms |
| 5 — Real-time sync | Week 3–4 | Lecturer → student state mirror |
| 6 — Classroom features | Week 4 | Live quiz prompts, response aggregation |
| 7 — Manual QA + polish | Week 5 | Presentation-ready |

---

## 3. Phase 0 — Setup (Day 1–2)

### Tasks
1. Create the repo with two folders: `frontend/` and `backend/`
2. **Frontend** — `npm create vite@latest frontend -- --template react`
   - `cd frontend && npm install`
   - `npm install three @react-three/fiber @react-three/drei zustand mathjs react-router-dom`
3. **Backend** — in `backend/`:
   - `npm init -y`
   - `npm install express socket.io cors`
   - Create `src/server.js` with a hello-world `GET /healthz`
   - Add `"dev": "node --watch src/server.js"` to scripts
4. Run both apps locally and confirm they boot

### Definition of done
- `cd frontend && npm run dev` shows the Vite welcome page on http://localhost:5173
- `cd backend && npm run dev` returns `OK` from `GET /healthz` on http://localhost:3000

---

## 4. Phase 1 — Frontend Skeleton (Week 1)

### Stack choice
- **React 18 + Vite + plain JavaScript** (no TypeScript)
- **React Router** — routes: `/`, `/lecturer`, `/student`, `/student/:code`
- **Zustand** for global state
- **Plain CSS** — port the demo's existing CSS as `src/index.css` (or split per-component)

### Tasks
1. Port the demo's HTML into JSX components:
   - `<AppShell>` (header, main grid, footer)
   - `<ConceptSelector>` (left panel — concept buttons)
   - `<MatrixInput dim={2|3} />`
   - `<VectorInput dim={2|3} />`
   - `<AnimationControls>`
   - `<InsightPanel>` (right side — matrix display, det, inverse, explanation)
   - `<QuizCard>`
2. Wire all panels to a single Zustand store:
   ```js
   import { create } from 'zustand';
   export const useStore = create((set) => ({
     dim: 2,
     concept: 'transformation',
     A: [[1,0],[0,1]],
     v: [2, 1], u: [-1, 2],
     alpha: 1, beta: 1,
     t: 1,
     setMatrix: (A) => set({ A }),
     setVector: (key, value) => set({ [key]: value }),
     setConcept: (concept) => set({ concept }),
     setDim: (dim) => set({ dim }),
     // ...etc
   }));
   ```
   Any component reads from it with one line: `const A = useStore(s => s.A);`
3. Set up routes: lecturer view at `/lecturer`, student join form at `/student`, in-session at `/student/:code`

### Definition of done
- Demo's UI fully reproduced in React with mock data
- Changing concept / matrix / vectors updates Zustand and re-renders the right components

---

## 5. Phase 2 — Visualization Engine (Week 2)

### Library choices
- **2D**: keep the demo's vanilla Canvas 2D code; wrap it in a `<Canvas2D>` React component
- **3D**: **Three.js** + **React Three Fiber** + **drei** helpers (`OrbitControls`, `Grid`)

### Tasks
1. `<Canvas2D>` component
   - `useRef` to the `<canvas>` element, `useEffect` to redraw on state changes
   - All drawing logic ported straight from the demo's `render()` function
2. `<Canvas3D>` component
   - React Three Fiber scene
   - Subcomponents: `<TransformedAxes>`, `<BasisArrows>`, `<UnitCubeParallelepiped>`, `<VectorArrow>`, `<SpanLine>`, `<BasisParallelogram>`
   - `<OrbitControls makeDefault enableDamping />`
3. `<Visualization>` parent picks 2D or 3D based on `state.dim`
4. A shared `useAnimationFrame(durationMs)` hook drives `state.t` from 0→1; both viz components react automatically

### Definition of done
- Every feature from the demo's 2D and 3D canvases works in React
- Toggling dim swaps the canvas without flicker

---

## 6. Phase 3 — Math Core (Week 2, in parallel)

### Location
Plain JS modules under `frontend/src/math/`.

### Tasks
1. Port the demo's math into modules:
   ```js
   // frontend/src/math/index.js
   export function det(M)          { /* 2x2 or 3x3 */ }
   export function inverse(M)      { /* 2x2 or 3x3 */ }
   export function multiply(M, v)  { /* MxV */ }
   export function lerpMatrix(I, A, t) { /* identity → A */ }
   export function eigen2(M)       { /* real eigenvalues + eigenvectors */ }
   export function classifyTransform(M) { /* Identity/Scale/Rotation/etc */ }
   ```
2. Use **math.js** internally where helpful (e.g. 3×3 eigenvalues, complex numbers)
3. Manual sanity checks against an online matrix calculator or Python in a terminal

### Definition of done
- All math from the demo lives in `src/math/` and the UI uses it
- Eyeball correctness on identity, rotation, shear, collapse, plus a few 3D examples

---

## 7. Phase 4 — Backend Foundation (Week 3)

The backend is intentionally tiny — its only job is to broker real-time messages between a lecturer and connected students. **No database, no auth, no persistent users.**

### Stack
- **Node.js 20 + plain JavaScript**
- **Express** for the small HTTP surface
- **Socket.io 4** mounted on the same HTTP server

### In-memory data structures

```js
// backend/src/rooms.js
const rooms = new Map();   // joinCode -> Room

// Room shape:
// {
//   joinCode,                       // 6-char human-readable, e.g. "K7R2QF"
//   createdAt,
//   lecturerSocketId,
//   students: Map<socketId, { nickname, joinedAt }>,
//   state: { dim, concept, A, v, u, alpha, beta, t, activeQuiz },
//   quizResponses: Map<questionId, Map<socketId, choiceIndex>>
// }
```

Cleanup: when the lecturer's socket disconnects, the room is removed and students receive `room:closed`.

### REST endpoints (minimal)

```
POST   /api/rooms                → { joinCode }
   Creates a new in-memory room. No body needed.

GET    /api/rooms/:joinCode      → { exists: true | false }
   Used by the student-join page to validate a code before connecting.

GET    /healthz                  → 200 OK
```

That's the entire HTTP surface. Everything else flows over Socket.io.

### Definition of done
- Lecturer can `POST /api/rooms` and get a join code back
- Student can `GET /api/rooms/:joinCode` to verify a code

---

## 8. Phase 5 — Real-Time Sync (Week 3–4)

### Stack
- **Socket.io 4** server, on the same HTTP server as Express
- Rooms namespaced by `joinCode`: `room:${joinCode}`

### Event protocol

**Client → Server**
- `room:join` `{ joinCode, nickname, role }` → ack `{ state }`
- `lecturer:state-update` `{ patch }` — partial diff (lecturer only)
- `lecturer:open-quiz` `{ question }`
- `lecturer:close-quiz`
- `student:quiz-response` `{ questionId, choiceIndex }`

**Server → Client**
- `room:state` — full snapshot on join
- `room:state-patch` — incremental diff
- `room:presence` `{ studentsConnected, nicknames }`
- `quiz:open` `{ question }`
- `quiz:results` `{ questionId, distribution, correctPct }`
- `room:closed`

### How "auth" works without auth
- The lecturer is whoever created the room. Their `socketId` is stored on the room. Only events from that socket are accepted as `lecturer:*`.
- Students choose any nickname when joining. Nicknames are not unique and are not stored anywhere after the room ends.
- Knowing the join code is the only credential.

### Implementation tasks
1. Lecturer's Zustand store mirrors changes to the server via a debounced emitter (~60ms); server rebroadcasts to the room
2. Student's Zustand store is read-only for shared fields and is hydrated by server events
3. Reconnect: client remembers `joinCode` + `nickname` in `sessionStorage` and re-joins automatically
4. Lecturer disconnects → room destroyed → `room:closed` broadcast → students redirected to a "lesson ended" screen

### Definition of done
- Two browser tabs (lecturer + student) reflect lecturer's matrix changes within ~100ms
- Refreshing the student tab re-joins the same room

---

## 9. Phase 6 — Classroom Features (Week 4)

### Tasks
1. **Lecturer dashboard**
   - All demo controls + a "Start Live Session" button → calls `POST /api/rooms`, shows the join code prominently (consider a QR code for projector use — `react-qr-code` is one extra small dep, or skip)
   - Connected-students sidebar with nicknames
   - Quick-quiz panel: a small bank of pre-written multiple-choice questions per concept (hard-coded in the frontend, just like the demo already has). Lecturer picks one and emits `lecturer:open-quiz`.
2. **Student view**
   - Landing page asks for nickname + join code
   - Read-only visualization mirrored from the lecturer
   - Quiz prompt appears when lecturer opens a question
   - After answering: shows whether they got it right + class distribution bar
3. **Live class analytics (in-memory only)**
   - Simple bar chart of the current question's answer distribution — plain `<div>`s with width %, no charting library needed
   - Correct% live counter for the active question
   - Stats are wiped when the lecturer closes the room

### Definition of done
- Lecturer can run a 20-minute class with 5 fake students (browser tabs) and the experience is smooth
- When the lecturer's tab closes, every trace of the session disappears from the server

---

## 10. Phase 7 — Manual QA + Polish (Week 5)

### Tasks
1. Click through every concept and preset, verify visualizations look right
2. Test with 3–5 browser tabs simultaneously (1 lecturer + multiple students)
3. Test refresh / reconnect behavior on the student side
4. Test on a tablet-size browser window
5. Fix any visual bugs you find
6. Write a short README explaining: how to install, how to run, the demo flow
7. Record a screencast or take screenshots for the project submission

### Definition of done
- Confident demoing this live to the class without crashing
- README is clear enough that a grader can clone and run it in 5 minutes

---

## 11. Library Decisions Summary

| Concern | Library | Why |
|---|---|---|
| Build tool | **Vite** | Zero-config dev server |
| Frontend framework | **React 18** (plain JS) | Required by brief; mature ecosystem |
| Routing | **React Router v6** | Standard SPA routing |
| State | **Zustand** | 4-line API, no boilerplate |
| Styling | **Plain CSS** | Port the demo's CSS as-is |
| 2D viz | **Canvas 2D** | Already working in the demo |
| 3D viz | **Three.js + React Three Fiber + drei** | Already in demo; R3F gives clean React integration |
| Numerics | **math.js** | Eigen, complex, fractions |
| Backend framework | **Express** | Simple, familiar |
| Real-time | **Socket.io 4** | Rooms + reconnect built in |

**Explicitly NOT used:** TypeScript, Tailwind, Zod, React Query, monorepo tooling, formal testing libraries (Vitest/Playwright/k6), Sentry/monitoring, i18n, GitHub Actions CI, database, ORM, auth provider, password hashing.

---

## 12. Deployment (Optional)

If you want a live URL to demo from:

- **Frontend** → **Vercel** (free, deploy via GitHub)
- **Backend** → **Render.com** free tier or **Railway** free tier
- Set the frontend's `VITE_API_URL` env var to point at the deployed backend
- Set the backend's CORS to allow the frontend's origin

Otherwise, just demo from `localhost` with both apps running in two terminals — that's perfectly fine for a school presentation.

---

## 13. What's Intentionally NOT in this plan

For a school project, these are explicitly out of scope. Each one would add real complexity without making the core idea any clearer to a grader.

- User accounts, login, password reset
- Saving lessons to reuse later
- Lecture replay or scrubbing through past sessions
- Class scoring, grading, per-student progress
- Snapshot / PDF export
- Hebrew / RTL / i18n (unless your project specifically requires it)
- TypeScript
- Tailwind / CSS-in-JS
- Automated test suite (manual QA only)
- CI/CD pipelines
- Production monitoring (Sentry, PostHog, etc.)
- n×n matrices and abstract vector spaces
- Symbolic algebra
- Multiple lecturers / collaborative editing

Any of these can be bolted on later if the project gets extended after grading.

---

## 14. Risk Notes

| Risk | What to do |
|---|---|
| Demo crashes during presentation | Keep the original `linear-algebra-visualizer-demo.html` as a backup — it runs offline with no server. |
| Backend restarts and wipes the live room | Acceptable trade-off for "no DB". Note it in the README. |
| 3D performance on the projector laptop | Test on the actual laptop before presenting; offer a 2D fallback toggle. |
| Network flakiness in the classroom | Demo from `localhost` instead of a deployed URL. |

---

## 15. First-Day Checklist

Concrete things to do on day 1:

1. Create the repo with `frontend/` and `backend/` folders
2. `npm create vite@latest frontend -- --template react`
3. Install frontend deps: `three @react-three/fiber @react-three/drei zustand mathjs react-router-dom`
4. In `backend/`: `npm init -y && npm install express socket.io cors`
5. Confirm both apps boot locally
6. Copy the demo's CSS and math into the React project to get going

End of day 1: a working two-app skeleton ready to receive the demo's code.
