import { Router } from "express";
import { talentSearchController } from "../controllers/talentSearchController.js";
import { requireSession } from "../middleware/requireSession.js";
import { readLimiter, writeLimiter } from "../middleware/rateLimiter.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
router.use(requireSession);
router.post("/", readLimiter, asyncHandler(talentSearchController.search));

const poolsRouter = Router();
poolsRouter.use(requireSession);
poolsRouter.get("/", readLimiter, asyncHandler(talentSearchController.listPools));
poolsRouter.post("/", writeLimiter, asyncHandler(talentSearchController.createPool));

export { poolsRouter };
export default router;
