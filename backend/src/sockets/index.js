import { Server } from "socket.io";
import { parse as parseCookies } from "cookie";
import { env } from "../config/env.js";
import { verifySessionToken } from "../utils/sessionCookies.js";

let ioInstance = null;

// Auth on connect: parses the same itap_session cookie the REST API uses, so a socket
// connection is only ever attributed to a real authenticated user/org (docs/03 §12).
export function initSockets(httpServer) {
  ioInstance = new Server(httpServer, {
    cors: { origin: env.clientOrigin, credentials: true },
  });

  ioInstance.use((socket, next) => {
    // #10: use the `cookie` package to parse the cookie header — handles all RFC-compliant
    // edge cases (URL-encoding, ordering, spaces) that a hand-rolled regex can miss.
    const cookies = parseCookies(socket.handshake.headers.cookie || "");
    const sessionToken = cookies.itap_session;
    if (!sessionToken) return next(new Error("Unauthenticated socket connection"));
    try {
      socket.data.session = verifySessionToken(decodeURIComponent(sessionToken));
      next();
    } catch {
      next(new Error("Invalid session"));
    }
  });

  ioInstance.on("connection", (socket) => {
    const { organizationId, userId } = socket.data.session;
    socket.join(`org:${organizationId}`);
    socket.join(`user:${userId}`);
  });

  return ioInstance;
}

export function getIo() {
  if (!ioInstance) throw new Error("Sockets not initialized — call initSockets(httpServer) first.");
  return ioInstance;
}
