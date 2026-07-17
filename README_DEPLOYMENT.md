# Step 17 — Deployment Preparation

This step prepares the Linear Algebra Visualizer for a future deployment step. It does not deploy the app yet.

The main change is that local development URLs are now configurable through `.env` files instead of being hard-coded in the source code.

## Local environment files

Create these files locally. Do not commit real `.env` files.

### frontend/.env

```env
VITE_SOCKET_URL=http://localhost:3000
VITE_API_BASE_URL=http://localhost:3000
```

`VITE_SOCKET_URL` is used by Socket.io.
`VITE_API_BASE_URL` is used by REST calls such as creating and checking rooms.

### backend/.env

```env
PORT=3000
CLIENT_URLS=http://localhost:5173,http://127.0.0.1:5173
NODE_ENV=development
```

`CLIENT_URLS` controls which frontend origins are allowed by CORS and Socket.io CORS. Multiple origins are separated by commas.

## Run locally after Step 17

Use two terminal windows.

### Backend

```cmd
cd "C:\מסמכים\לימודים\שנה ג\פרויקט בתעשיה\project\backend"
npm install
copy .env.example .env
npm run dev
```

Expected output includes the backend port and the allowed frontend origins.

### Frontend

```cmd
cd "C:\מסמכים\לימודים\שנה ג\פרויקט בתעשיה\project\frontend"
npm install
copy .env.example .env
npm run dev
```

Open:

```txt
http://localhost:5173
```

## Production values for Step 18

When deploying later, set environment variables in the hosting dashboards.

### Backend hosting, for example Render or Railway

Set:

```env
CLIENT_URLS=https://your-frontend-domain.vercel.app
NODE_ENV=production
```

Most hosting providers set `PORT` automatically. If they do not, set it according to the provider instructions.

### Frontend hosting, for example Vercel or Netlify

Set:

```env
VITE_SOCKET_URL=https://your-backend-domain.onrender.com
VITE_API_BASE_URL=https://your-backend-domain.onrender.com
```

The frontend must point to the deployed backend URL, not to localhost.

## Step 18 plan

In the next step, deploy:

- Frontend to Vercel or Netlify.
- Backend to Render or Railway.

Then update the production environment variables so both sides can communicate online.

## Checks after future deployment

- Open the deployed frontend.
- Create a lecturer room.
- Join from a student browser/device.
- Verify Socket.io connects.
- Verify visualization state sync works.
- Verify Live Quiz opens, updates, reveals answers, and closes.
- Verify the backend health endpoint returns `{ "ok": true }`.

## Current limitations

This step does not add a database. Rooms and live quiz state are still stored in backend memory, and custom quiz topics/questions are still stored in frontend `localStorage`.

## Step 19 — PostgreSQL persistent quiz library

After Step 19, custom quiz topics and questions should be stored in PostgreSQL instead of only in browser `localStorage`.

### Render PostgreSQL setup

1. In Render, create a new PostgreSQL database.
2. Copy the database connection string. Render usually provides an internal database URL for services running on Render.
3. Open the backend Web Service.
4. Go to Environment.
5. Add:

```env
DATABASE_URL=postgres://USER:PASSWORD@HOST:PORT/DATABASE
```

6. Save changes.
7. Redeploy the backend.

The backend creates the required tables automatically and seeds default topics/questions if the database is empty.

### Production check

Open the Vercel frontend and go to Lecturer View. In `Manage Quiz Topics & Questions`, the status should say:

```txt
Quiz library: Server database
```

Add a topic and question, refresh the browser, and verify they remain visible.
