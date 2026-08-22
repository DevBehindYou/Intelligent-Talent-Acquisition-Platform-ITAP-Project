import { redisConnection } from "../config/redis.js";
import { logger } from "./logger.js";

// Redis-backed denylist of revoked session-token ids (jti). Entries auto-expire when the token
// they revoke would have expired anyway, so the set stays small. This is what makes logout (and
// forced-logout / suspension) invalidate a stateless JWT session immediately server-side, across
// every API instance — docs/13 §3.2, §8 ("logout must invalidate the token").
const key = (jti) => `denylist:${jti}`;

export async function denylistToken(jti, ttlSeconds) {
  if (!jti) return;
  try {
    await redisConnection.set(key(jti), "1", "EX", Math.max(1, Math.floor(ttlSeconds)));
  } catch (err) {
    logger.warn({ err: err.message }, "denylistToken failed");
  }
}

export async function isTokenDenied(jti) {
  if (!jti) return false;
  try {
    return (await redisConnection.exists(key(jti))) === 1;
  } catch (err) {
    // Fail open: a Redis blip must not lock every user out. The token still expires on its own
    // short TTL, so the exposure window is bounded.
    logger.warn({ err: err.message }, "isTokenDenied check failed — failing open");
    return false;
  }
}
