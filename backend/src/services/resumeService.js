import { v4 as uuid } from "uuid";
import { Resume } from "../models/Resume.js";
import { Candidate } from "../models/Candidate.js";
import { MatchScore } from "../models/MatchScore.js";
import { storageService } from "./storageService.js";
import { resumeParsingQueue } from "../queues/resumeParsing.queue.js";
import { ApiError } from "../middleware/errorHandler.js";

function extensionOf(filename) {
  const ext = filename.split(".").pop()?.toLowerCase();
  return ["pdf", "docx", "txt"].includes(ext) ? ext : "txt";
}

export const resumeService = {
  async bulkUpload(organizationId, jobId, uploadedBy, files) {
    const batchId = uuid();

    const resumeDocs = await Promise.all(
      files.map(async (file) => {
        const objectPath = await storageService.upload(organizationId, file);
        return Resume.create({
          organizationId,
          jobId: jobId || undefined,
          fileUrl: objectPath,
          fileType: extensionOf(file.originalname),
          status: "queued",
          uploadedBy,
          batchId,
        });
      })
    );

    await Promise.all(
      resumeDocs.map((resume) =>
        resumeParsingQueue.add("parse-resume", {
          resumeId: String(resume._id),
          organizationId: String(organizationId),
          jobId: jobId ? String(jobId) : null,
          batchId,
          totalInBatch: resumeDocs.length,
        })
      )
    );

    return { batchId, totalFiles: resumeDocs.length, status: "processing" };
  },

  async get(organizationId, resumeId) {
    return Resume.findOne({ _id: resumeId, organizationId }).lean();
  },

  async signedDownloadUrl(organizationId, resumeId) {
    const resume = await Resume.findOne({ _id: resumeId, organizationId }).lean();
    if (!resume) return null;
    return storageService.getSignedUrl(resume.fileUrl);
  },

  // #4: full resume removal — deletes the stored file, removes the resumeId from the
  // candidate’s resumeIds array, and removes any MatchScore docs linked to this resume’s
  // candidate (where this was the candidate’s only resume). This prevents dangling references
  // and Supabase Storage leaks that the old inline Resume.deleteOne caused.
  async remove(organizationId, resumeId) {
    const resume = await Resume.findOne({ _id: resumeId, organizationId }).lean();
    if (!resume) throw new ApiError(404, "RESUME_NOT_FOUND", "Resume not found.");

    // 1. Delete the physical file.
    if (resume.fileUrl) {
      await storageService.delete(resume.fileUrl).catch(() => {}); // best-effort — don’t block delete on storage error
    }

    // 2. Remove this resumeId from its candidate’s resumeIds list.
    if (resume.candidateId) {
      await Candidate.updateOne(
        { _id: resume.candidateId, organizationId },
        { $pull: { resumeIds: resume._id } }
      );
    }

    // 3. Remove the Resume document.
    await Resume.deleteOne({ _id: resumeId });
  },
};
