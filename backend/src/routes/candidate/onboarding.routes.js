import { Router } from "express";
import { candidateOnboardingController } from "../../controllers/candidateOnboardingController.js";
import { requireCandidate } from "../../middleware/requireSession.js";
import { readLimiter, writeLimiter } from "../../middleware/rateLimiter.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const router = Router();
router.use(requireCandidate);

router.get("/", readLimiter, asyncHandler(candidateOnboardingController.list));
router.post("/tasks/:taskId/submit", writeLimiter, asyncHandler(candidateOnboardingController.submitTask));
router.post("/tasks/:taskId/acknowledge", writeLimiter, asyncHandler(candidateOnboardingController.acknowledgeTask));

export default router;
