import { Router } from "express";
import { applicationController } from "../../controllers/applicationController.js";
import { requireCandidate } from "../../middleware/requireSession.js";
import { readLimiter, writeLimiter } from "../../middleware/rateLimiter.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const router = Router();
router.use(requireCandidate);

router.post("/", writeLimiter, asyncHandler(applicationController.apply));
router.get("/", readLimiter, asyncHandler(applicationController.list));
router.get("/:applicationId", readLimiter, asyncHandler(applicationController.get));
router.post("/:applicationId/withdraw", writeLimiter, asyncHandler(applicationController.withdraw));

export default router;
