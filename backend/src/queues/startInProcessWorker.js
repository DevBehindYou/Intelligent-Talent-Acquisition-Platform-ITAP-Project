import { Worker } from "bullmq";
import { redisConnection } from "../config/redis.js";
import { processResumeJob } from "./processor.js";
import { logger } from "../utils/logger.js";

// Convenience for local dev only — runs the same processor inside the API process so
// `npm run dev` alone is enough to see the full upload → parse → score flow. Disable this
// (and use `npm run worker` as a separate process/container) once you have real load.
export function startInProcessWorker() {
  const worker = new Worker("resume-parsing", processResumeJob, { connection: redisConnection, concurrency: 3 });
  worker.on("failed", (job, err) => logger.error({ err }, `Resume job ${job?.id} failed`));
  return worker;
}
