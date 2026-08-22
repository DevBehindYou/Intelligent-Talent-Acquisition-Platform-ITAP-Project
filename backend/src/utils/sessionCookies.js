import jwt from "jsonwebtoken";
import { v4 as uuid } from "uuid";
import { env } from "../config/env.js";

const COOKIE_OPTS_BASE = {
  httpOnly: true,
  secure: env.nodeEnv === "production",
  sameSite: env.nodeEnv === "production" ? "none" : "strict",
};

// Express issues and owns this cookie itself, embedding exactly the claims the API needs —
// see docs/04-auth-security.md §2, step 5. The claims object MUST include `userType`
// ("staff" | "candidate" | "super_admin"), which the auth gates in middleware/requireSession.js
// use to keep the three surfaces separate (docs/13-candidate-admin-enhancement-spec.md §1.2):
//   Staff:     { userType: "staff", userId, organizationId, role }
//   Candidate: { userType: "candidate", candidateAccountId }
export function issueSessionCookie(res, claims) {
  // Every token carries a unique jti so it can be individually revoked (denylisted) on logout.
  const token = jwt.sign({ ...claims, jti: uuid() }, env.sessionCookieSecret, {
    expiresIn: `${env.sessionCookieTtlMinutes}m`,
  });
  res.cookie("itap_session", token, {
    ...COOKIE_OPTS_BASE,
    maxAge: env.sessionCookieTtlMinutes * 60 * 1000,
  });
}

// refreshPath scopes the refresh cookie to the endpoint that consumes it. Staff use the
// default; the candidate portal passes "/api/candidate/auth/refresh" so the two flows keep
// separate refresh cookies on the same browser.
export function issueRefreshCookie(res, refreshToken, refreshPath = "/api/auth/refresh") {
  res.cookie("itap_refresh", refreshToken, {
    ...COOKIE_OPTS_BASE,
    path: refreshPath,
    maxAge: env.refreshCookieTtlDays * 24 * 60 * 60 * 1000,
  });
}

export function clearAuthCookies(res, refreshPath = "/api/auth/refresh") {
  res.clearCookie("itap_session", COOKIE_OPTS_BASE);
  res.clearCookie("itap_refresh", { ...COOKIE_OPTS_BASE, path: refreshPath });
}

export function verifySessionToken(token) {
  return jwt.verify(token, env.sessionCookieSecret);
}
