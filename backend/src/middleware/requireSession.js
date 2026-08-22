import { verifySessionToken } from "../utils/sessionCookies.js";
import { isTokenDenied } from "../utils/tokenDenylist.js";

// Low-level verifier: checks Express's own session cookie (no per-request round-trip to
// Supabase) and attaches the decoded claims to req.session — docs/04-auth-security.md §2, step 6.
// The claims carry `userType` ("staff" | "candidate" | "super_admin"); the gates below use it
// to keep the three surfaces separate (docs/13-candidate-admin-enhancement-spec.md §1.2). Async
// because it also consults the Redis token denylist so a revoked (logged-out) token is rejected
// immediately, even before its TTL expires (docs/13 §3.2).
async function verifyAndAttach(req, res, next) {
  const token = req.cookies?.itap_session;
  if (!token) {
    return res.status(401).json({ success: false, error: { code: "UNAUTHENTICATED", message: "No session." } });
  }
  let payload;
  try {
    payload = verifySessionToken(token); // { userType, jti, ... }
  } catch {
    return res.status(401).json({ success: false, error: { code: "SESSION_EXPIRED", message: "Session expired." } });
  }
  if (await isTokenDenied(payload.jti)) {
    return res.status(401).json({ success: false, error: { code: "SESSION_REVOKED", message: "Session ended." } });
  }
  req.session = payload;
  next();
}

function forbid(res) {
  return res.status(403).json({ success: false, error: { code: "FORBIDDEN", message: "Not permitted." } });
}

// Gate factory: verify the session, then allow through only if `allow(userType)` is true.
function gate(allow) {
  return (req, res, next) =>
    verifyAndAttach(req, res, () => (allow(req.session?.userType) ? next() : forbid(res))).catch(next);
}

// Staff/recruiter surface: anyone who is NOT a candidate (staff, super_admin, or a legacy
// pre-userType dev token). This is what every existing business route uses.
export const requireStaff = gate((t) => t !== "candidate");

// Candidate portal surface: only candidate sessions.
export const requireCandidate = gate((t) => t === "candidate");

// Super Admin panel surface: only super_admin sessions (spec §6). Wired up in Phase 4.
export const requireSuperAdmin = gate((t) => t === "super_admin");

// Back-compat alias. Every existing staff route imports `requireSession`; aliasing it to
// requireStaff makes the whole staff surface reject candidate tokens with no route-file churn.
// New candidate/admin routes should import requireCandidate / requireSuperAdmin directly.
export const requireSession = requireStaff;
