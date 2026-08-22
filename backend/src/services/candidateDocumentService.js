import { CandidateDocument } from "../models/CandidateDocument.js";
import { storageService } from "./storageService.js";
import { ApiError } from "../middleware/errorHandler.js";

function extOf(filename = "") {
  const ext = filename.split(".").pop()?.toLowerCase();
  return ["pdf", "docx", "txt"].includes(ext) ? ext : "txt";
}

// Every method scopes by candidateAccountId (taken from the verified session by the controller),
// so one candidate can never touch another's documents — resource-level ownership (docs/13 §7).
export const candidateDocumentService = {
  async list(candidateAccountId) {
    return CandidateDocument.find({ candidateAccountId }).sort({ isPrimary: -1, createdAt: -1 }).lean();
  },

  async upload(candidateAccountId, file, { kind = "resume" } = {}) {
    // storageService namespaces objects by its first arg; pass the account id as the folder.
    const storagePath = await storageService.upload(String(candidateAccountId), file);
    // The first resume a candidate uploads becomes their primary automatically.
    const isFirstResume =
      kind === "resume" && (await CandidateDocument.countDocuments({ candidateAccountId, kind: "resume" })) === 0;

    return CandidateDocument.create({
      candidateAccountId,
      kind,
      fileName: file.originalname,
      storagePath,
      fileType: extOf(file.originalname),
      mimeType: file.mimetype,
      size: file.size,
      isPrimary: isFirstResume,
    });
  },

  async setPrimary(candidateAccountId, documentId) {
    const doc = await CandidateDocument.findOne({ _id: documentId, candidateAccountId });
    if (!doc) throw new ApiError(404, "DOCUMENT_NOT_FOUND", "Document not found.");
    await CandidateDocument.updateMany({ candidateAccountId, kind: doc.kind }, { isPrimary: false });
    doc.isPrimary = true;
    await doc.save();
    return doc;
  },

  async signedUrl(candidateAccountId, documentId) {
    const doc = await CandidateDocument.findOne({ _id: documentId, candidateAccountId }).lean();
    if (!doc) throw new ApiError(404, "DOCUMENT_NOT_FOUND", "Document not found.");
    return storageService.getSignedUrl(doc.storagePath);
  },

  async remove(candidateAccountId, documentId) {
    const doc = await CandidateDocument.findOne({ _id: documentId, candidateAccountId });
    if (!doc) throw new ApiError(404, "DOCUMENT_NOT_FOUND", "Document not found.");
    await storageService.delete(doc.storagePath).catch(() => {}); // best-effort file cleanup
    await doc.deleteOne();
    // If we removed the primary resume, promote the most recent remaining one.
    if (doc.isPrimary) {
      const next = await CandidateDocument.findOne({ candidateAccountId, kind: doc.kind }).sort({ createdAt: -1 });
      if (next) {
        next.isPrimary = true;
        await next.save();
      }
    }
    return { deleted: true };
  },
};
