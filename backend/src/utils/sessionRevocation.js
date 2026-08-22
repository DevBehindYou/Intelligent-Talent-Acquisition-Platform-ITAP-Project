import { verifySessionToken } from "./sessionCookies.js";
import { denylistToken } from "./tokenDenylist.js";
import { disconnectUser } from "../sockets/index.js";
import { logger } from "./logger.js";

// Server-side revocation on logout: denylist the current session token's jti for its remaining
// lifetime, and drop the user's realtime connections. Best-effort and always safe to call — the
// caller clears the auth cookies regardless. Together with clearing the refresh cookie, this is
// what makes logout actually stop protected API/socket access, not just hide the UI (docs/13 §8).
export async function revokeCurrentSession(req) {
  const token = req.cookies?.itap_session;
  if (!token) return;

  let payload;
  try {
    payload = verifySessionToken(token);
  } catch {
    return; // already expired/invalid — nothing left to revoke
  }

  try {
    if (payload.jti && payload.exp) {
      const remaining = payload.exp - Math.floor(Date.now() / 1000);
      await denylistToken(payload.jti, remaining);
    }
    disconnectUser(payload);
  } catch (err) {
    logger.warn({ err: err.message }, "session revocation partial failure");
  }
}
