import { Router } from "express";
import { jobsController } from "../controllers/jobsController.js";
import { requireSession } from "../middleware/requireSession.js";
import { requireRole } from "../middleware/requireRole.js";
import { readLimiter, writeLimiter } from "../middleware/rateLimiter.js";
import { auditLog } from "../middleware/auditLogger.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
router.use(requireSession);

router.get("/", readLimiter, asyncHandler(jobsController.list));
router.post("/", writeLimiter, requireRole("recruiter", "hr_admin"), asyncHandler(jobsController.create));
router.get("/:jobId", readLimiter, asyncHandler(jobsController.get));
router.patch("/:jobId", writeLimiter, requireRole("recruiter", "hr_admin"), asyncHandler(jobsController.update));
router.delete("/:jobId", writeLimiter, requireRole("recruiter", "hr_admin"), asyncHandler(jobsController.archive));

router.get("/:jobId/pipeline", readLimiter, asyncHandler(jobsController.pipeline));
router.get("/:jobId/rankings", readLimiter, asyncHandler(jobsController.rankings));
router.get("/:jobId/rankings/:candidateId/explanation", readLimiter, asyncHandler(jobsController.rankingExplanation));
router.patch(
  "/:jobId/scoring-weights",
  writeLimiter,
  requireRole("recruiter", "hr_admin"),
  auditLog("scoring_weights.updated", "job"),
  asyncHandler(jobsController.updateScoringWeights)
);

export default router;
