import http from "http";
import { createApp } from "./src/app.js";
import { connectMongo, disconnectMongo } from "./src/config/db.js";
import { redisConnection } from "./src/config/redis.js";
import { initSockets } from "./src/sockets/index.js";
import { startInProcessWorker } from "./src/queues/startInProcessWorker.js";
import { env, validateEnv } from "./src/config/env.js";
import { logger } from "./src/utils/logger.js";

async function main() {
  // Fail fast on a misconfigured production environment before touching the DB or binding a port.
  validateEnv();

  await connectMongo();

  const app = createApp();
  const httpServer = http.createServer(app);
  initSockets(httpServer);

  // See queues/startInProcessWorker.js — dev convenience only. Run `npm run worker` as a
  // separate process/container in production instead.
  if (env.nodeEnv !== "production") {
    startInProcessWorker();
  }

  httpServer.listen(env.port, () => {
    logger.info(`ITAP API listening on port ${env.port}`);
  });

  // Graceful shutdown: stop accepting connections, then release DB/Redis handles so the
  // orchestrator's SIGTERM leads to a clean exit instead of a forced kill.
  let shuttingDown = false;
  async function shutdown(signal) {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info(`${signal} received — shutting down gracefully`);
    const forceExit = setTimeout(() => {
      logger.error("Graceful shutdown timed out — forcing exit");
      process.exit(1);
    }, 10000).unref();
    try {
      await new Promise((resolve) => httpServer.close(resolve));
      await disconnectMongo();
      await redisConnection.quit();
      clearTimeout(forceExit);
      logger.info("Shutdown complete");
      process.exit(0);
    } catch (err) {
      logger.error({ err }, "Error during shutdown");
      process.exit(1);
    }
  }
  ["SIGTERM", "SIGINT"].forEach((sig) => process.on(sig, () => shutdown(sig)));
}

main().catch((err) => {
  logger.error({ err }, "Failed to start server");
  process.exit(1);
});
