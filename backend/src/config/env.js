import dotenv from "dotenv";
import { z } from "zod";
dotenv.config();

const nodeEnv = process.env.NODE_ENV || "development";
const isProd = nodeEnv === "production";

// Sentinel used as the session-signing secret only outside production. If this value ever
// reaches production it would let anyone forge session cookies, so validation below rejects it.
const DEV_SESSION_SECRET = "dev-only-insecure-secret";

export const env = {
  nodeEnv,
  port: Number(process.env.PORT || 4000),
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:5173",

  supabaseUrl: process.env.SUPABASE_URL,
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
  supabaseJwksUrl: process.env.SUPABASE_JWKS_URL,
  supabaseJwtSecret: process.env.SUPABASE_JWT_SECRET,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,

  mongodbUri: process.env.MONGODB_URI || "mongodb://localhost:27017/itap",
  redisUrl: process.env.REDIS_URL || "redis://localhost:6379",

  sessionCookieSecret: process.env.SESSION_COOKIE_SECRET || (isProd ? "" : DEV_SESSION_SECRET),
  sessionCookieTtlMinutes: Number(process.env.SESSION_COOKIE_TTL_MINUTES || 15),
  refreshCookieTtlDays: Number(process.env.REFRESH_COOKIE_TTL_DAYS || 7),

  aiServiceUrl: process.env.AI_SERVICE_URL || "http://localhost:8000",
  // Shared secret sent to the AI microservice (see services/aiServiceClient.js). Required in
  // production so the AI service can reject any request that isn't from this API.
  aiServiceToken: process.env.AI_SERVICE_TOKEN,
};

// In production, missing/insecure secrets are a hard boot failure — never a silent default.
// Outside production we only warn, so the scaffold still runs out of the box.
const productionSchema = z
  .object({
    supabaseUrl: z.string().url("SUPABASE_URL must be a valid URL"),
    supabaseJwtSecret: z.string().optional(),
    supabaseJwksUrl: z.string().url().optional(),
    mongodbUri: z.string().min(1),
    redisUrl: z.string().min(1),
    clientOrigin: z.string().url("CLIENT_ORIGIN must be a valid URL in production"),
    sessionCookieSecret: z
      .string()
      .min(16, "SESSION_COOKIE_SECRET must be at least 16 characters")
      .refine((v) => v !== DEV_SESSION_SECRET, "SESSION_COOKIE_SECRET is still the insecure dev default"),
  })
  .refine((v) => Boolean(v.supabaseJwtSecret || v.supabaseJwksUrl), {
    message: "Set SUPABASE_JWT_SECRET or SUPABASE_JWKS_URL so Supabase tokens can be verified",
    path: ["supabaseJwtSecret"],
  });

export function validateEnv() {
  if (!isProd) {
    // Soft, non-fatal warnings in dev/test — mirrors the original behavior.
    if (!env.supabaseUrl) {
      // #11: use structured logger so the warning is visible in pino log output alongside
      // all other startup messages, rather than going to a separate console.warn stream.
      // Import is inline to avoid a circular dependency with logger -> env -> logger.
      import("../utils/logger.js").then(({ logger }) =>
        logger.warn("[config] SUPABASE_URL not set — auth verification will fail until it is.")
      );
    }
    return;
  }

  const result = productionSchema.safeParse(env);
  if (!result.success) {
    const issues = result.error.issues.map((i) => `  - ${i.path.join(".") || "env"}: ${i.message}`).join("\n");
    // Fail fast: a misconfigured production API must not start.
    throw new Error(`Invalid production environment configuration:\n${issues}`);
  }
}
