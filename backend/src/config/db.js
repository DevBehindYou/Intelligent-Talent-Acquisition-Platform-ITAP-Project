import mongoose from "mongoose";
import { env } from "./env.js";
import { logger } from "../utils/logger.js";

export async function connectMongo() {
  mongoose.set("strictQuery", true);
  // Building indexes on boot is convenient in dev but can block writes on a large prod
  // collection — build them out-of-band there (e.g. a migration/ops step) instead.
  mongoose.set("autoIndex", env.nodeEnv !== "production");

  mongoose.connection.on("error", (err) => logger.error({ err }, "MongoDB connection error"));
  mongoose.connection.on("disconnected", () => logger.warn("MongoDB disconnected"));
  mongoose.connection.on("reconnected", () => logger.info("MongoDB reconnected"));

  await mongoose.connect(env.mongodbUri, {
    maxPoolSize: Number(process.env.MONGO_MAX_POOL_SIZE || 10),
    minPoolSize: Number(process.env.MONGO_MIN_POOL_SIZE || 0),
    serverSelectionTimeoutMS: 10000,
  });
  logger.info("MongoDB connected");
}

export async function disconnectMongo() {
  await mongoose.connection.close();
  logger.info("MongoDB connection closed");
}
