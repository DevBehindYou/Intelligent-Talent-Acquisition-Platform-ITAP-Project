import { describe, it, expect, beforeEach } from "vitest";
import jwt from "jsonwebtoken";
import { v4 as uuid } from "uuid";
import { env } from "../src/config/env.js";
import { requireStaff } from "../src/middleware/requireSession.js";
import { denylistToken, isTokenDenied } from "../src/utils/tokenDenylist.js";
import { revokeCurrentSession } from "../src/utils/sessionRevocation.js";
import { redisConnection } from "../src/config/redis.js";

// Phase 5 (docs/13 §8): logout must invalidate the token server-side. Backed by the Redis
// denylist (ioredis-mock in the test env), so no live Redis is required.

function sign(jti) {
  return jwt.sign({ userType: "staff", userId: "u1", organizationId: "o1", role: "recruiter", jti }, env.sessionCookieSecret, {
    expiresIn: "5m",
  });
}

function run(middleware, token) {
  return new Promise((resolve) => {
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

beforeEach(async () => {
  await redisConnection.flushall();
});

describe("session revocation via denylist", () => {
  it("allows a fresh token but rejects it once its jti is denylisted", async () => {
    const jti = uuid();
    const token = sign(jti);

    expect((await run(requireStaff, token)).nextCalled).toBe(true);

    await denylistToken(jti, 300);

    const denied = await run(requireStaff, token);
    expect(denied.nextCalled).toBe(false);
    expect(denied.res.statusCode).toBe(401);
    expect(denied.res.body.error.code).toBe("SESSION_REVOKED");
  });

  it("revokeCurrentSession denylists the current token, so it stops working immediately", async () => {
    const jti = uuid();
    const token = sign(jti);

    expect(await isTokenDenied(jti)).toBe(false);
    await revokeCurrentSession({ cookies: { itap_session: token } });
    expect(await isTokenDenied(jti)).toBe(true);

    // The same token is now rejected by the gate — logout truly stops API access.
    expect((await run(requireStaff, token)).res.statusCode).toBe(401);
  });

  it("no-ops safely when there is no session cookie", async () => {
    await expect(revokeCurrentSession({ cookies: {} })).resolves.toBeUndefined();
  });
});
