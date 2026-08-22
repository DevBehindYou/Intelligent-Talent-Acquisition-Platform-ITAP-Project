import { Router } from "express";
import { candidateOfferController } from "../../controllers/candidateOfferController.js";
import { requireCandidate } from "../../middleware/requireSession.js";
import { readLimiter, writeLimiter } from "../../middleware/rateLimiter.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const router = Router();
router.use(requireCandidate);

router.get("/", readLimiter, asyncHandler(candidateOfferController.list));
router.get("/:offerId", readLimiter, asyncHandler(candidateOfferController.get));
router.post("/:offerId/accept", writeLimiter, asyncHandler(candidateOfferController.accept));
router.post("/:offerId/decline", writeLimiter, asyncHandler(candidateOfferController.decline));
router.get("/:offerId/documents/:index/download", readLimiter, asyncHandler(candidateOfferController.download));

export default router;
