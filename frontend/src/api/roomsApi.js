const RAW_API_BASE_URL = import.meta.env.VITE_API_BASE_URL
  || import.meta.env.VITE_SOCKET_URL
  || 'http://localhost:3000';

const API_BASE_URL = RAW_API_BASE_URL.replace(/\/$/, '');

async function readJsonResponse(response) {
  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message = data?.error || data?.message || `הבקשה נכשלה עם קוד ${response.status}`;
    throw new Error(message);
  }

  return data;
}

export async function createRoom() {
  const response = await fetch(`${API_BASE_URL}/api/rooms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  const data = await readJsonResponse(response);

  if (!data?.joinCode) {
    throw new Error('השרת לא החזיר קוד הצטרפות.');
  }

  return data.joinCode;
}

export async function checkRoom(joinCode) {
  const code = String(joinCode || '').trim().toUpperCase();
  if (!code) return false;

  const response = await fetch(`${API_BASE_URL}/api/rooms/${encodeURIComponent(code)}`);
  const data = await readJsonResponse(response);
  return Boolean(data?.exists);
}

export { API_BASE_URL };
