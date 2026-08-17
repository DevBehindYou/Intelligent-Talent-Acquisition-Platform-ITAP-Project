import rateLimit from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import { redisConnection } from "../config/redis.js";

// Limits per docs/03-api-documentation.md §1. Backed by a shared Redis store so limits are
// enforced across every API instance — the library's in-memory default only limits per
// process, which silently multiplies the real limit by the number of replicas. Redis is a
// base requirement of the platform (BullMQ), so this adds no new infra.
function makeStore(prefix) {
  return new RedisStore({
    prefix,
    sendCommand: (...args) => redisConnection.call(...args),
  });
}

export const readLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  store: makeStore("rl:read:"),
});
export const writeLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  store: makeStore("rl:write:"),
});
export const bulkUploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  store: makeStore("rl:bulk:"),
});
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  store: makeStore("rl:auth:"),
});
