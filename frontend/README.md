# Linear Algebra Visualizer — Frontend Step 9

React + Vite frontend with Routes, Zustand, Canvas2D, Canvas3D, REST room creation/checking, Socket.io presence, and one-way lecturer-to-student state sync.

## Install

```bash
npm install
```

## Environment

Create `frontend/.env` from the example file:

```bash
cp .env.example .env
```

Local values:

```env
VITE_SOCKET_URL=http://localhost:3000
VITE_API_BASE_URL=http://localhost:3000
```

In production, both values should point to the deployed backend URL.

## Run

```bash
npm run dev
```

Frontend runs at:

```txt
http://localhost:5173
```

## Step 9 flow

1. Run the backend and make sure `VITE_SOCKET_URL` / `VITE_API_BASE_URL` point to it.
2. Open `/lecturer`.
3. Click **Start Live Session**.
4. Open `/student` in another tab.
5. Enter a nickname and the lecturer room code.
6. In the student page, keep **Follow Lecturer** selected.
7. Change matrix/vector/concept/dim in the lecturer page.
8. The student visualization should update in real time.
9. Switch the student to **Practice Mode** to make local changes that are not overwritten by lecturer updates.

## Notes

- Sync is one-way: lecturer → server → students.
- Students do not send visualization state to the server in this step.
- Quiz synchronization is not implemented yet.
