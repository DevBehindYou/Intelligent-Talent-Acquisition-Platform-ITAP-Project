import { Router } from "express";
import { platformAdminController } from "../../controllers/platformAdminController.js";
import { requireSuperAdmin } from "../../middleware/requireSession.js";
import { readLimiter } from "../../middleware/rateLimiter.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const router = Router();
router.use(requireSuperAdmin);

router.get("/", readLimiter, asyncHandler(platformAdminController.dashboard));

export default router;
