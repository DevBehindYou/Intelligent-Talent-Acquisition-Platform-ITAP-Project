import Redis from "ioredis";
import { createRequire } from "module";
import { env } from "./env.js";

// In tests, use an in-memory Redis so Redis-backed code (rate limiter, token denylist) runs
// without a live server. Loaded only in the test env via createRequire, so production —
// installed with `npm ci --omit=dev` — never touches ioredis-mock.
let RedisImpl = Redis;
if (env.nodeEnv === "test") {
  RedisImpl = createRequire(import.meta.url)("ioredis-mock");
}

// Shared connection used by BullMQ queues/workers, the rate limiter store, and the token denylist.
export const redisConnection = new RedisImpl(env.redisUrl, { maxRetriesPerRequest: null });
