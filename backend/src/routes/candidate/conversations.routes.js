import { Router } from "express";
import { candidateConversationController } from "../../controllers/candidateConversationController.js";
import { requireCandidate } from "../../middleware/requireSession.js";
import { readLimiter, writeLimiter } from "../../middleware/rateLimiter.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const router = Router();
router.use(requireCandidate);

router.get("/", readLimiter, asyncHandler(candidateConversationController.list));
router.post("/", writeLimiter, asyncHandler(candidateConversationController.start));
router.get("/:conversationId", readLimiter, asyncHandler(candidateConversationController.thread));
router.post("/:conversationId/messages", writeLimiter, asyncHandler(candidateConversationController.send));

export default router;
