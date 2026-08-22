import { Router } from "express";
import { platformAdminController } from "../../controllers/platformAdminController.js";
import { requireSuperAdmin } from "../../middleware/requireSession.js";
import { readLimiter, writeLimiter } from "../../middleware/rateLimiter.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const c = platformAdminController;
const router = Router();
router.use(requireSuperAdmin);

// Candidates
router.get("/candidates", readLimiter, asyncHandler(c.listCandidates));
router.get("/candidates/:id", readLimiter, asyncHandler(c.getCandidate));
router.post("/candidates/:id/suspend", writeLimiter, asyncHandler(c.suspendCandidate));
router.post("/candidates/:id/reactivate", writeLimiter, asyncHandler(c.reactivateCandidate));
router.post("/candidates/:id/anonymize", writeLimiter, asyncHandler(c.anonymizeCandidate));

// Organizations, recruiters, applications, audit
router.get("/organizations", readLimiter, asyncHandler(c.listOrganizations));
router.get("/recruiters", readLimiter, asyncHandler(c.listRecruiters));
router.post("/recruiters/:id/activate", writeLimiter, asyncHandler(c.activateRecruiter));
router.post("/recruiters/:id/deactivate", writeLimiter, asyncHandler(c.deactivateRecruiter));
router.get("/applications", readLimiter, asyncHandler(c.listApplications));
router.get("/audit-logs", readLimiter, asyncHandler(c.listAuditLogs));

export default router;
