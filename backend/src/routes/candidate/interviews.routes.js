import { Router } from "express";
import { candidateInterviewController } from "../../controllers/candidateInterviewController.js";
import { requireCandidate } from "../../middleware/requireSession.js";
import { readLimiter } from "../../middleware/rateLimiter.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const router = Router();
router.use(requireCandidate);

router.get("/", readLimiter, asyncHandler(candidateInterviewController.list));
router.get("/:interviewId", readLimiter, asyncHandler(candidateInterviewController.get));

export default router;
