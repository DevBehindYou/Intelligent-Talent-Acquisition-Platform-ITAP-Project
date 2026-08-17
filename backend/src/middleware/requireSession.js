import { verifySessionToken } from "../utils/sessionCookies.js";

// Guards every business-data route. Verifies Express's own session cookie — no round-trip
// to Supabase needed per request (docs/04-auth-security.md §2, step 6).
export function requireSession(req, res, next) {
  const token = req.cookies?.itap_session;
  if (!token) {
    return res.status(401).json({ success: false, error: { code: "UNAUTHENTICATED", message: "No session." } });
  }
  try {
    const payload = verifySessionToken(token);
    req.session = payload; // { userId, organizationId, role }
    next();
  } catch {
    return res.status(401).json({ success: false, error: { code: "SESSION_EXPIRED", message: "Session expired." } });
  }
}
