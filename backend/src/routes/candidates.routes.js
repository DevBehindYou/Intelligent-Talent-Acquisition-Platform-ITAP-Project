import { Router } from "express";
import { candidatesController } from "../controllers/candidatesController.js";
import { requireSession } from "../middleware/requireSession.js";
import { readLimiter, writeLimiter } from "../middleware/rateLimiter.js";
import { auditLog } from "../middleware/auditLogger.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
router.use(requireSession);

router.get("/", readLimiter, asyncHandler(candidatesController.list));
router.get("/:candidateId", readLimiter, auditLog("candidate.viewed", "candidate"), asyncHandler(candidatesController.get));
router.patch("/:candidateId", writeLimiter, asyncHandler(candidatesController.update));
router.get("/:candidateId/duplicates", readLimiter, asyncHandler(candidatesController.duplicates));
router.post("/:candidateId/stage", writeLimiter, asyncHandler(candidatesController.moveStage));
router.get("/:candidateId/questions", readLimiter, asyncHandler(candidatesController.questions));

export default router;
