import Redis from "ioredis";
import { env } from "./env.js";

// Shared connection used by BullMQ queues/workers and the rate limiter store.
export const redisConnection = new Redis(env.redisUrl, { maxRetriesPerRequest: null });
