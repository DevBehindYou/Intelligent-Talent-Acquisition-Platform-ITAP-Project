import { Router } from "express";
import { candidateJobController } from "../../controllers/candidateJobController.js";
import { requireCandidate } from "../../middleware/requireSession.js";
import { readLimiter } from "../../middleware/rateLimiter.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const router = Router();
router.use(requireCandidate);

router.get("/", readLimiter, asyncHandler(candidateJobController.list));
router.get("/:jobId", readLimiter, asyncHandler(candidateJobController.get));

export default router;
