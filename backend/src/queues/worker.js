import "dotenv/config";
import { Worker } from "bullmq";
import { redisConnection } from "../config/redis.js";
import { connectMongo } from "../config/db.js";
import { processResumeJob } from "./processor.js";
import { validateEnv } from "../config/env.js";
import { logger } from "../utils/logger.js";

// Standalone worker process entrypoint (`npm run worker`). In production this runs as its
// own deployable, scaled independently of the API — docs/01-technical-architecture.md §7
// ("Scalability"). For local development, `npm run dev` also starts an in-process worker
// (see startInProcessWorker below) so a single `docker compose up` is enough to see resumes
// get parsed without running two processes.
async function main() {
  validateEnv();
  await connectMongo();
  const worker = new Worker("resume-parsing", processResumeJob, { connection: redisConnection, concurrency: 5 });
  worker.on("completed", (job) => logger.info(`Resume job ${job.id} completed`));
  worker.on("failed", (job, err) => logger.error({ err }, `Resume job ${job?.id} failed`));
  logger.info("Resume parsing worker started");
}

main().catch((err) => {
  logger.error({ err }, "Worker failed to start");
  process.exit(1);
});
