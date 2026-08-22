import { Router } from "express";
import { candidateProfileController } from "../../controllers/candidateProfileController.js";
import { requireCandidate } from "../../middleware/requireSession.js";
import { readLimiter, writeLimiter } from "../../middleware/rateLimiter.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const router = Router();
router.use(requireCandidate);

router.get("/", readLimiter, asyncHandler(candidateProfileController.get));
router.patch("/", writeLimiter, asyncHandler(candidateProfileController.update));

export default router;
