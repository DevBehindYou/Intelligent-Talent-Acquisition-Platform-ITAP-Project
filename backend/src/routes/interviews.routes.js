import { Router } from "express";
import { interviewsController } from "../controllers/interviewsController.js";
import { requireSession } from "../middleware/requireSession.js";
import { readLimiter, writeLimiter } from "../middleware/rateLimiter.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
router.use(requireSession);

router.post("/", writeLimiter, asyncHandler(interviewsController.schedule));
router.get("/:interviewId", readLimiter, asyncHandler(interviewsController.get));
router.post("/:interviewId/feedback", writeLimiter, asyncHandler(interviewsController.submitFeedback));

export default router;
