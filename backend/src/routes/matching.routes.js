import { Router } from "express";
import { matchingController } from "../controllers/matchingController.js";
import { requireSession } from "../middleware/requireSession.js";
import { requireRole } from "../middleware/requireRole.js";
import { writeLimiter } from "../middleware/rateLimiter.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
router.use(requireSession);

router.post("/recompute/:jobId", writeLimiter, requireRole("recruiter", "hr_admin"), asyncHandler(matchingController.recompute));

export default router;
