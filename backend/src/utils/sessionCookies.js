import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

const COOKIE_OPTS_BASE = {
  httpOnly: true,
  secure: env.nodeEnv === "production",
  sameSite: env.nodeEnv === "production" ? "none" : "strict",
};

// Express issues and owns this cookie itself, embedding exactly the claims the API needs
// (userId, organizationId, role) — see docs/04-auth-security.md §2, step 5.
export function issueSessionCookie(res, { userId, organizationId, role }) {
  const token = jwt.sign({ userId, organizationId, role }, env.sessionCookieSecret, {
    expiresIn: `${env.sessionCookieTtlMinutes}m`,
  });
  res.cookie("itap_session", token, {
    ...COOKIE_OPTS_BASE,
    maxAge: env.sessionCookieTtlMinutes * 60 * 1000,
  });
}

export function issueRefreshCookie(res, refreshToken) {
  res.cookie("itap_refresh", refreshToken, {
    ...COOKIE_OPTS_BASE,
    path: "/api/auth/refresh",
    maxAge: env.refreshCookieTtlDays * 24 * 60 * 60 * 1000,
  });
}

export function clearAuthCookies(res) {
  res.clearCookie("itap_session", COOKIE_OPTS_BASE);
  res.clearCookie("itap_refresh", { ...COOKIE_OPTS_BASE, path: "/api/auth/refresh" });
}

export function verifySessionToken(token) {
  return jwt.verify(token, env.sessionCookieSecret);
}
