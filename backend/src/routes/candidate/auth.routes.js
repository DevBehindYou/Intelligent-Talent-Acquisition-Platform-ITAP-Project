import { Router } from "express";
import { candidateAuthController } from "../../controllers/candidateAuthController.js";
import { requireCandidate } from "../../middleware/requireSession.js";
import { authLimiter } from "../../middleware/rateLimiter.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const router = Router();

router.post("/session", authLimiter, asyncHandler(candidateAuthController.createSession));
router.post("/signup", authLimiter, asyncHandler(candidateAuthController.signup));
router.post("/logout", asyncHandler(candidateAuthController.logout));
router.post("/refresh", authLimiter, asyncHandler(candidateAuthController.refresh));
router.get("/me", requireCandidate, asyncHandler(candidateAuthController.me));

export default router;
