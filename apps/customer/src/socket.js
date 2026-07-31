import { io } from 'socket.io-client';
import { SOCKET_URL, api } from './api.js';

let socket = null;

// Lazily connect an authenticated socket using the in-memory access token.
export function getSocket() {
  const token = api.getToken();
  if (!token) return null;
  if (socket && socket.connected) return socket;
  if (socket) socket.disconnect();
  socket = io(SOCKET_URL, { auth: { token }, transports: ['websocket'] });
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
