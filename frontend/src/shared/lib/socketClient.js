import { io } from "socket.io-client";

let socket = null;

// Lazily connects once the user is authenticated. Cookies are sent automatically
// since the socket connects to the same origin/credentials as the API (docs/03-api-documentation.md §12).
export function getSocket() {
  if (!socket) {
    socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:4000", {
      withCredentials: true,
      autoConnect: false,
    });
  }
  return socket;
}

export function connectSocket() {
  const s = getSocket();
  if (!s.connected) s.connect();
  return s;
}

export function disconnectSocket() {
  if (socket?.connected) socket.disconnect();
}
