import { Router } from "express";
import { adminController } from "../controllers/adminController.js";
import { requireSession } from "../middleware/requireSession.js";
import { requireRole } from "../middleware/requireRole.js";
import { readLimiter, writeLimiter } from "../middleware/rateLimiter.js";
import { auditLog } from "../middleware/auditLogger.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
router.use(requireSession, requireRole("hr_admin"));

router.get("/users", readLimiter, asyncHandler(adminController.listUsers));
router.post("/users/invite", writeLimiter, asyncHandler(adminController.inviteUser));
router.patch("/users/:userId/role", writeLimiter, auditLog("user.role_changed", "user"), asyncHandler(adminController.updateUserRole));
router.get("/organization/scoring-defaults", readLimiter, asyncHandler(adminController.getScoringDefaults));
router.patch(
  "/organization/scoring-defaults",
  writeLimiter,
  auditLog("scoring_defaults.updated", "organization"),
  asyncHandler(adminController.updateScoringDefaults)
);
router.get("/audit-logs", readLimiter, asyncHandler(adminController.auditLogs));

export default router;
