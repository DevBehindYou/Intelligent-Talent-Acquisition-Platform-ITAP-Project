import { Resume } from "../models/Resume.js";
import { Candidate } from "../models/Candidate.js";
import { Job } from "../models/Job.js";
import { storageService } from "../services/storageService.js";
import { aiServiceClient } from "../services/aiServiceClient.js";
import { matchingService } from "../services/matchingService.js";
import { pipelineEvents } from "../sockets/pipelineEvents.js";
import { logger } from "../utils/logger.js";

// Only used as a same-process, zero-dependency fallback for .txt files if the AI service is
// completely unreachable (see the catch path around aiServiceClient.parseResume below).
// PDF/DOCX bytes are always sent to the AI service, which owns real extraction
// (ai-service/app/parsing/file_extraction.py) — docs/01-technical-architecture.md §1.3.
async function crudeExtractText(buffer, fileType) {
  if (fileType === "txt") return buffer.toString("utf-8");
  return "";
}

export async function processResumeJob(job) {
  const { resumeId, organizationId, jobId, batchId, totalInBatch } = job.data;
  const resume = await Resume.findById(resumeId);
  if (!resume) return;

  try {
    await Resume.updateOne({ _id: resumeId }, { status: "parsing" });

    const buffer = await storageService.readBuffer(resume.fileUrl);

    const aiResult = await aiServiceClient.parseResume({
      fileBase64: buffer.toString("base64"),
      fileType: resume.fileType,
      // #24: background queue jobs get the full 15s — not the 5s default used for
      // user-facing requests. Pass via axios config override.
      _timeoutOverride: 15000,
    });
    const localText = aiResult ? "" : await crudeExtractText(buffer, resume.fileType);
    const parsed = aiResult || fallbackParse(localText);
    const extractedTextForStorage = aiResult ? `[extracted server-side, ${aiResult.rawTextLength ?? 0} chars]` : localText;

    // Only dedup against an existing candidate when the resume actually yielded an email.
    // Without this guard, findOne({ organizationId, email: undefined }) drops the undefined
    // key and matches an arbitrary candidate in the org — silently merging unrelated resumes.
    const parsedEmail = parsed.email ? String(parsed.email).trim().toLowerCase() : null;
    let candidate = parsedEmail
      ? await Candidate.findOne({ organizationId, email: parsedEmail }).catch(() => null)
      : null;
    if (!candidate) {
      candidate = await Candidate.create({
        organizationId,
        fullName: parsed.fullName || "Unknown Candidate",
        email: parsedEmail, // normalized so future case-insensitive dedup lookups match

        phone: parsed.phone,
        currentTitle: parsed.currentTitle,
        totalExperienceYears: parsed.totalExperienceYears ?? 0,
        education: parsed.education ?? [],
        certifications: parsed.certifications ?? [],
        skills: parsed.skills ?? [],
        resumeIds: [resume._id],
        sourceType: "upload",
        timeline: [{ type: "note", description: "Resume uploaded and parsed", date: new Date() }],
      });
    } else {
      candidate.resumeIds.push(resume._id);
      await candidate.save();
    }

    await Resume.updateOne(
      { _id: resumeId },
      { status: "parsed", candidateId: candidate._id, parsedAt: new Date(), rawExtractedText: extractedTextForStorage.slice(0, 5000) }
    );

    // Embedding generation happens here — see comment in resumeParsing.queue.js about
    // splitting this into its own queue at higher volume.
    await aiServiceClient.embed(`${candidate.fullName} ${(candidate.skills || []).map((s) => s.name).join(" ")}`);

    if (jobId) {
      const jobDoc = await Job.findById(jobId);
      if (jobDoc) {
        const score = await matchingService.scoreAndSave(candidate, jobDoc);
        pipelineEvents.rankingUpdated(organizationId, { jobId, candidateId: candidate._id, overallScore: score.overallScore });
      }
    }
  } catch (err) {
    logger.error({ err }, `Failed to process resume ${resumeId}`);
    await Resume.updateOne({ _id: resumeId }, { status: "failed", parseError: err.message });
  }

  const processedCount = await Resume.countDocuments({ batchId, status: { $in: ["parsed", "failed"] } });
  pipelineEvents.resumeBatchProgress(organizationId, { batchId, processed: processedCount, total: totalInBatch });
}

function fallbackParse(text) {
  // Minimal heuristic fallback if the AI service is completely unreachable, so uploads
  // still land as candidates (with mostly-empty fields) rather than failing outright.
  const emailMatch = text.match(/[\w.+-]+@[\w-]+\.[\w.-]+/);
  return {
    fullName: undefined,
    email: emailMatch?.[0],
    skills: [],
    education: [],
    certifications: [],
    totalExperienceYears: 0,
  };
}
