import { candidateDocumentService } from "../services/candidateDocumentService.js";
import { ApiError } from "../middleware/errorHandler.js";

export const candidateDocumentController = {
  async list(req, res) {
    const items = await candidateDocumentService.list(req.session.candidateAccountId);
    res.json({ success: true, data: { items } });
  },

  async upload(req, res) {
    if (!req.file) throw new ApiError(400, "VALIDATION_ERROR", "A file is required.");
    const doc = await candidateDocumentService.upload(req.session.candidateAccountId, req.file, {
      kind: req.body.kind,
    });
    res.status(201).json({ success: true, data: doc });
  },

  async setPrimary(req, res) {
    const doc = await candidateDocumentService.setPrimary(req.session.candidateAccountId, req.params.documentId);
    res.json({ success: true, data: doc });
  },

  async download(req, res) {
    const url = await candidateDocumentService.signedUrl(req.session.candidateAccountId, req.params.documentId);
    res.json({ success: true, data: { url } });
  },

  async remove(req, res) {
    const result = await candidateDocumentService.remove(req.session.candidateAccountId, req.params.documentId);
    res.json({ success: true, data: result });
  },
};
