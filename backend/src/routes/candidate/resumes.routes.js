import { Router } from "express";
import multer from "multer";
import { candidateDocumentController } from "../../controllers/candidateDocumentController.js";
import { requireCandidate } from "../../middleware/requireSession.js";
import { readLimiter, writeLimiter } from "../../middleware/rateLimiter.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

// Single-file upload, 10MB cap, pdf/docx/txt only (mirrors the recruiter bulk uploader).
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    const ok = /\.(pdf|docx|txt)$/i.test(file.originalname);
    cb(ok ? null : new Error("Unsupported file type"), ok);
  },
});

const router = Router();
router.use(requireCandidate);

router.get("/", readLimiter, asyncHandler(candidateDocumentController.list));
router.post("/", writeLimiter, upload.single("file"), asyncHandler(candidateDocumentController.upload));
router.patch("/:documentId/primary", writeLimiter, asyncHandler(candidateDocumentController.setPrimary));
router.get("/:documentId/download", readLimiter, asyncHandler(candidateDocumentController.download));
router.delete("/:documentId", writeLimiter, asyncHandler(candidateDocumentController.remove));

export default router;
