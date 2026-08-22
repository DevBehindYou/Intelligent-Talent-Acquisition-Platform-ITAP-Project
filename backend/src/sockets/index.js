import { Server } from "socket.io";
import { parse as parseCookies } from "cookie";
import { env } from "../config/env.js";
import { verifySessionToken } from "../utils/sessionCookies.js";
import { isTokenDenied } from "../utils/tokenDenylist.js";

let ioInstance = null;

// Auth on connect: parses the same itap_session cookie the REST API uses, so a socket
// connection is only ever attributed to a real authenticated user/org (docs/03 §12).
export function initSockets(httpServer) {
  ioInstance = new Server(httpServer, {
    cors: { origin: env.clientOrigin, credentials: true },
  });

  ioInstance.use(async (socket, next) => {
    // #10: use the `cookie` package to parse the cookie header — handles all RFC-compliant
    // edge cases (URL-encoding, ordering, spaces) that a hand-rolled regex can miss.
    const cookies = parseCookies(socket.handshake.headers.cookie || "");
    const sessionToken = cookies.itap_session;
    if (!sessionToken) return next(new Error("Unauthenticated socket connection"));
    try {
      const payload = verifySessionToken(decodeURIComponent(sessionToken));
      // A revoked (logged-out) token must not open a new realtime connection either.
      if (await isTokenDenied(payload.jti)) return next(new Error("Session revoked"));
      socket.data.session = payload;
      next();
    } catch {
      next(new Error("Invalid session"));
    }
  });

  ioInstance.on("connection", (socket) => {
    const session = socket.data.session;
    // Candidate sockets have no org/userId — route them to their own private room so candidate
    // events (interview scheduled, notifications) reach only that job seeker (docs/13 §1.2).
    if (session.userType === "candidate") {
      socket.join(`candidate:${session.candidateAccountId}`);
    } else {
      socket.join(`org:${session.organizationId}`);
      socket.join(`user:${session.userId}`);
    }
  });

  return ioInstance;
}

export function getIo() {
  if (!ioInstance) throw new Error("Sockets not initialized — call initSockets(httpServer) first.");
  return ioInstance;
}

// Forcibly drop a user's live realtime connections — called on logout so a session that's been
// revoked server-side can't keep receiving events (docs/13 §8). Safe when sockets aren't
// initialized (e.g. the standalone worker).
export function disconnectUser(session) {
  if (!ioInstance || !session) return;
  try {
    if (session.userType === "candidate" && session.candidateAccountId) {
      ioInstance.to(`candidate:${session.candidateAccountId}`).disconnectSockets(true);
    } else if (session.userId) {
      ioInstance.to(`user:${session.userId}`).disconnectSockets(true);
    }
  } catch {
    /* best-effort */
  }
}
