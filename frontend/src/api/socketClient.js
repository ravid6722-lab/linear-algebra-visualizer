import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';
const SOCKET_ACK_TIMEOUT_MS = 8000;
const SOCKET_CONNECT_TIMEOUT_MS = 8000;

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 800,
});

export function connectSocket() {
  if (!socket.connected && !socket.active) {
    socket.connect();
  } else if (!socket.connected) {
    socket.connect();
  }
  return socket;
}

function waitForSocketConnection() {
  return new Promise((resolve, reject) => {
    if (socket.connected) {
      resolve(socket);
      return;
    }

    let settled = false;

    function cleanup() {
      socket.off('connect', handleConnect);
      socket.off('connect_error', handleConnectError);
      clearTimeout(timer);
    }

    function handleConnect() {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(socket);
    }

    function handleConnectError(error) {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error(error?.message || 'לא ניתן להתחבר לשרת.'));
    }

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error('לא ניתן להתחבר לשרת. ודאו שהשרת פועל ושכתובת VITE_SOCKET_URL מוגדרת כראוי.'));
    }, SOCKET_CONNECT_TIMEOUT_MS);

    socket.once('connect', handleConnect);
    socket.once('connect_error', handleConnectError);
    socket.connect();
  });
}

export async function joinRoom(payload) {
  const activeSocket = await waitForSocketConnection();

  return new Promise((resolve, reject) => {
    activeSocket.timeout(SOCKET_ACK_TIMEOUT_MS).emit('room:join', payload, (error, response) => {
      if (error) {
        reject(new Error('לא ניתן להתחבר לחדר החי. השרת פועל אך בקשת ההצטרפות לא קיבלה מענה. נסו שוב.'));
        return;
      }

      if (!response?.success) {
        reject(new Error(response?.error || 'לא ניתן להצטרף לחדר.'));
        return;
      }

      resolve(response);
    });
  });
}
