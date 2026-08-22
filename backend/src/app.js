import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import path from "path";
import { env } from "./config/env.js";
import { logger } from "./utils/logger.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

import authRoutes from "./routes/auth.routes.js";
import jobsRoutes from "./routes/jobs.routes.js";
import resumesRoutes from "./routes/resumes.routes.js";
import candidatesRoutes from "./routes/candidates.routes.js";
import matchingRoutes from "./routes/matching.routes.js";
import interviewsRoutes from "./routes/interviews.routes.js";
import talentSearchRoutes, { poolsRouter as talentPoolsRoutes } from "./routes/talentSearch.routes.js";
import messagingRoutes from "./routes/messaging.routes.js";
import copilotRoutes from "./routes/copilot.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import candidateRoutes from "./routes/candidate/index.js";
import adminPanelRoutes from "./routes/admin-panel/index.js";

export function createApp() {
  const app = express();

  // Trust the reverse proxy (Render) so rate limiting applies to the real client IP,
  // not the load balancer's IP. Without this, the rate limiter instantly triggers 429s.
  app.set("trust proxy", 1);

  app.use(helmet());
  app.use(cors({ origin: env.clientOrigin, credentials: true }));
  app.use(express.json({ limit: "2mb" }));
  app.use(cookieParser());
  app.use(
    pinoHttp({
      logger,
      // Simplify the HTTP request logs so they don't dump massive headers in the terminal
      serializers: {
        req: (req) => ({ method: req.method, url: req.url }),
        res: (res) => ({ statusCode: res.statusCode }),
      },
    })
  );

  // Dev-only static serving for locally-stored resumes when Supabase Storage isn't
  // configured — see services/storageService.js. Never enabled in production.
  if (env.nodeEnv !== "production") {
    app.use("/local-storage", express.static(path.join(process.cwd(), ".local-storage", "resumes")));
  }

  app.get("/health", (req, res) => res.json({ status: "ok" }));

  app.use("/api/auth", authRoutes);
  app.use("/api/jobs", jobsRoutes);
  app.use("/api/resumes", resumesRoutes);
  app.use("/api/candidates", candidatesRoutes);
  app.use("/api/matching", matchingRoutes);
  app.use("/api/interviews", interviewsRoutes);
  app.use("/api/talent-search", talentSearchRoutes);
  app.use("/api/talent-pools", talentPoolsRoutes);
  app.use("/api/messaging", messagingRoutes);
  app.use("/api/copilot", copilotRoutes);
  app.use("/api/analytics", analyticsRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/candidate", candidateRoutes); // candidate portal (auth, profile, resumes, jobs, applications)
  app.use("/api/admin-panel", adminPanelRoutes); // super-admin panel (platform-wide, requireSuperAdmin)

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
