import { Router } from "express";
import { authController } from "../controllers/authController.js";
import { requireSession } from "../middleware/requireSession.js";
import { authLimiter } from "../middleware/rateLimiter.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.post("/session", authLimiter, asyncHandler(authController.createSession));
router.post("/signup", authLimiter, asyncHandler(authController.signup));
router.post("/logout", asyncHandler(authController.logout));
router.post("/refresh", authLimiter, asyncHandler(authController.refresh));
router.get("/me", requireSession, asyncHandler(authController.me));

export default router;
