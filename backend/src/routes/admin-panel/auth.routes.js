import { Router } from "express";
import { adminAuthController } from "../../controllers/adminAuthController.js";
import { requireSuperAdmin } from "../../middleware/requireSession.js";
import { authLimiter } from "../../middleware/rateLimiter.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const router = Router();

router.post("/session", authLimiter, asyncHandler(adminAuthController.createSession));
router.post("/mfa/login", authLimiter, asyncHandler(adminAuthController.mfaLogin));
router.post("/logout", asyncHandler(adminAuthController.logout));
router.post("/refresh", authLimiter, asyncHandler(adminAuthController.refresh));
router.get("/me", requireSuperAdmin, asyncHandler(adminAuthController.me));

// MFA enrollment — only while authenticated as the admin enrolling.
router.post("/mfa/setup", requireSuperAdmin, asyncHandler(adminAuthController.mfaSetup));
router.post("/mfa/enable", requireSuperAdmin, asyncHandler(adminAuthController.mfaEnable));
router.post("/mfa/disable", requireSuperAdmin, asyncHandler(adminAuthController.mfaDisable));

export default router;
