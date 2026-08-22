import { Router } from "express";
import { candidateNotificationController } from "../../controllers/candidateNotificationController.js";
import { requireCandidate } from "../../middleware/requireSession.js";
import { readLimiter, writeLimiter } from "../../middleware/rateLimiter.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const router = Router();
router.use(requireCandidate);

router.get("/", readLimiter, asyncHandler(candidateNotificationController.list));
router.post("/read-all", writeLimiter, asyncHandler(candidateNotificationController.markAllRead));
router.patch("/:notificationId/read", writeLimiter, asyncHandler(candidateNotificationController.markRead));

export default router;
