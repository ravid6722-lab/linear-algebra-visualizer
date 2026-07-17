# Linear Algebra Visualizer — Backend Step 9

Node.js + Express + Socket.io backend with in-memory rooms, REST room creation/checking, presence, and one-way lecturer-to-student state sync.

## Install

```bash
npm install
```

## Environment

Create `backend/.env` from the example file:

```bash
cp .env.example .env
```

Local values:

```env
PORT=3000
CLIENT_URLS=http://localhost:5173,http://127.0.0.1:5173
NODE_ENV=development
```

In production, set `CLIENT_URLS` to the deployed frontend origin.

## Run

```bash
npm run dev
```

Backend runs on the configured `PORT`, usually `http://localhost:3000` locally.

## Endpoints

- `GET /healthz`
- `POST /api/rooms`
- `GET /api/rooms/:joinCode`

## Socket.io events

Client → Server:

- `room:join`
- `lecturer:state-update`

Server → Client:

- `room:presence`
- `room:state-patch`

## Notes

- Room data is in memory only.
- Students receive the current room state when joining.
- Only the socket stored as `lecturerSocketId` may update room state.
