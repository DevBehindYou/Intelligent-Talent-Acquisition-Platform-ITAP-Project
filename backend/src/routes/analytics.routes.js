import { Router } from "express";
import { analyticsController } from "../controllers/analyticsController.js";
import { requireSession } from "../middleware/requireSession.js";
import { readLimiter } from "../middleware/rateLimiter.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
router.use(requireSession);
router.get("/dashboard", readLimiter, asyncHandler(analyticsController.dashboard));
router.get("/time-to-hire", readLimiter, asyncHandler(analyticsController.timeToHire));
router.get("/skill-demand", readLimiter, asyncHandler(analyticsController.skillDemand));

export default router;
