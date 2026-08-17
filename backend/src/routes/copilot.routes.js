import { Router } from "express";
import { copilotController } from "../controllers/copilotController.js";
import { requireSession } from "../middleware/requireSession.js";
import { writeLimiter } from "../middleware/rateLimiter.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
router.use(requireSession);
router.post("/ask", writeLimiter, asyncHandler(copilotController.ask));

export default router;
