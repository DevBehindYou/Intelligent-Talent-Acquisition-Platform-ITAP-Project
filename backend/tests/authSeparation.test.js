import { describe, it, expect } from "vitest";
import jwt from "jsonwebtoken";
import { v4 as uuid } from "uuid";
import { env } from "../src/config/env.js";
import {
  requireStaff,
  requireCandidate,
  requireSuperAdmin,
  requireSession,
} from "../src/middleware/requireSession.js";

// Phase 0 DoD (docs/13 §10): a candidate token must be rejected by every staff route, and the
// three surfaces (staff / candidate / super_admin) must be hard-separated at the API layer.
// The gates are async now (they consult the token denylist), so `run` resolves when the
// middleware either responds or calls next.

function sign(claims) {
  return jwt.sign({ ...claims, jti: uuid() }, env.sessionCookieSecret, { expiresIn: "5m" });
}

function run(middleware, claims, rawToken) {
  return new Promise((resolve) => {
    const token = rawToken ?? (claims ? sign(claims) : undefined);
    const req = { cookies: token ? { itap_session: token } : {} };
    const res = {
      statusCode: null,
      body: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(payload) {
        this.body = payload;
        resolve({ res, nextCalled: false });
        return this;
      },
    };
    const next = () => resolve({ res, nextCalled: true });
    middleware(req, res, next);
  });
}

const STAFF = { userType: "staff", userId: "u1", organizationId: "o1", role: "recruiter" };
const CANDIDATE = { userType: "candidate", candidateAccountId: "ca1" };
const SUPER = { userType: "super_admin", superAdminId: "s1" };

describe("auth surface separation", () => {
  it("requireStaff allows staff and rejects candidates", async () => {
    expect((await run(requireStaff, STAFF)).nextCalled).toBe(true);
    const denied = await run(requireStaff, CANDIDATE);
    expect(denied.nextCalled).toBe(false);
    expect(denied.res.statusCode).toBe(403);
  });

  it("requireSession (staff alias) rejects candidate tokens — the core DoD", async () => {
    const denied = await run(requireSession, CANDIDATE);
    expect(denied.nextCalled).toBe(false);
    expect(denied.res.statusCode).toBe(403);
    expect((await run(requireSession, STAFF)).nextCalled).toBe(true);
  });

  it("requireCandidate allows candidates and rejects staff/super_admin", async () => {
    expect((await run(requireCandidate, CANDIDATE)).nextCalled).toBe(true);
    expect((await run(requireCandidate, STAFF)).res.statusCode).toBe(403);
    expect((await run(requireCandidate, SUPER)).res.statusCode).toBe(403);
  });

  it("requireSuperAdmin allows only super_admin", async () => {
    expect((await run(requireSuperAdmin, SUPER)).nextCalled).toBe(true);
    expect((await run(requireSuperAdmin, STAFF)).res.statusCode).toBe(403);
    expect((await run(requireSuperAdmin, CANDIDATE)).res.statusCode).toBe(403);
  });

  it("rejects a missing session with 401 (not 403)", async () => {
    const denied = await run(requireStaff, null);
    expect(denied.nextCalled).toBe(false);
    expect(denied.res.statusCode).toBe(401);
  });

  it("rejects a token signed with the wrong secret", async () => {
    const badToken = jwt.sign({ ...CANDIDATE, jti: uuid() }, "not-the-secret");
    const denied = await run(requireStaff, null, badToken);
    expect(denied.nextCalled).toBe(false);
    expect(denied.res.statusCode).toBe(401);
  });
});
