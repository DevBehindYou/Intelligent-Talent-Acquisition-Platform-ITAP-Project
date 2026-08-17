import { Router } from "express";
import { messagingController } from "../controllers/messagingController.js";
import { requireSession } from "../middleware/requireSession.js";
import { writeLimiter } from "../middleware/rateLimiter.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
router.use(requireSession);
router.post("/draft", writeLimiter, asyncHandler(messagingController.draft));
router.post("/send", writeLimiter, asyncHandler(messagingController.send));

export default router;
