import { resumeService } from "../services/resumeService.js";
import { ApiError } from "../middleware/errorHandler.js";

export const resumesController = {
  async bulkUpload(req, res) {
    if (!req.files || req.files.length === 0) {
      throw new ApiError(400, "VALIDATION_ERROR", "No files were uploaded.");
    }
    const result = await resumeService.bulkUpload(req.session.organizationId, req.body.jobId, req.session.userId, req.files);
    res.status(202).json({ success: true, data: result });
  },

  async get(req, res) {
    const resume = await resumeService.get(req.session.organizationId, req.params.resumeId);
    if (!resume) throw new ApiError(404, "RESUME_NOT_FOUND", "Resume not found.");
    res.json({ success: true, data: resume });
  },

  async download(req, res) {
    const url = await resumeService.signedDownloadUrl(req.session.organizationId, req.params.resumeId);
    if (!url) throw new ApiError(404, "RESUME_NOT_FOUND", "Resume not found.");
    res.json({ success: true, data: { url } });
  },

  async remove(req, res) {
    // #4: delegate to resumeService.remove for full cleanup (file, candidateId ref, MatchScore).
    await resumeService.remove(req.session.organizationId, req.params.resumeId);
    res.json({ success: true, data: {} });
  },
};
