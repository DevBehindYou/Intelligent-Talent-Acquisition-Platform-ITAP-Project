import { Router } from "express";
import multer from "multer";
import { resumesController } from "../controllers/resumesController.js";
import { requireSession } from "../middleware/requireSession.js";
import { bulkUploadLimiter, readLimiter, writeLimiter } from "../middleware/rateLimiter.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 500 },
  fileFilter: (req, file, cb) => {
    const ok = /\.(pdf|docx|txt)$/i.test(file.originalname);
    cb(ok ? null : new Error("Unsupported file type"), ok);
  },
});

const router = Router();
router.use(requireSession);

router.post("/bulk", bulkUploadLimiter, upload.array("files", 500), asyncHandler(resumesController.bulkUpload));
router.get("/:resumeId", readLimiter, asyncHandler(resumesController.get));
router.get("/:resumeId/download", readLimiter, asyncHandler(resumesController.download));
router.delete("/:resumeId", writeLimiter, asyncHandler(resumesController.remove));

export default router;
