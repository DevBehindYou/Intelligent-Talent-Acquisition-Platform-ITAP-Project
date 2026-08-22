import { Router } from "express";
import { candidateAssessmentController } from "../../controllers/candidateAssessmentController.js";
import { requireCandidate } from "../../middleware/requireSession.js";
import { readLimiter, writeLimiter } from "../../middleware/rateLimiter.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const router = Router();
router.use(requireCandidate);

router.get("/", readLimiter, asyncHandler(candidateAssessmentController.list));
router.get("/:assignmentId", readLimiter, asyncHandler(candidateAssessmentController.get));
router.post("/:assignmentId/submit", writeLimiter, asyncHandler(candidateAssessmentController.submit));

export default router;
