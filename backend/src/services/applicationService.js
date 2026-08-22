import { Application } from "../models/Application.js";
import { ApplicationEvent } from "../models/ApplicationEvent.js";
import { Job } from "../models/Job.js";
import { Candidate } from "../models/Candidate.js";
import { PipelineStage } from "../models/PipelineStage.js";
import { CandidateAccount } from "../models/CandidateAccount.js";
import { CandidateDocument } from "../models/CandidateDocument.js";
import { ApiError } from "../middleware/errorHandler.js";

// Candidate-facing labels for the canonical Application.status (docs/13 §4.6). The recruiter
// stage vocabulary stays the source of truth; this is presentation only.
const STATUS_LABELS = {
  applied: "Applied",
  screened: "Under Review",
  shortlisted: "Shortlisted",
  interviewing: "Interview Stage",
  offer: "Offer",
  hired: "Hired",
  rejected: "Not Selected",
  withdrawn: "Withdrawn",
};

function presentApplication(application, job) {
  const jobInfo =
    job && typeof job === "object"
      ? { id: job._id, title: job.title, location: job.location, employmentType: job.employmentType, workMode: job.workMode }
      : { id: application.jobId };
  return {
    id: application._id,
    job: jobInfo,
    status: application.status,
    statusLabel: STATUS_LABELS[application.status] || application.status,
    submittedAt: application.submittedAt,
    withdrawnAt: application.withdrawnAt,
    resumeDocumentId: application.resumeDocumentId,
    answers: application.answers,
    createdAt: application.createdAt,
  };
}

export const applicationService = {
  async apply(candidateAccountId, { jobId, resumeDocumentId, answers } = {}) {
    if (!jobId) throw new ApiError(400, "VALIDATION_ERROR", "jobId is required.");

    // Only a public, open job can be applied to.
    const job = await Job.findOne({ _id: jobId, isPublic: true, status: "open" }).lean();
    if (!job) throw new ApiError(404, "JOB_NOT_FOUND", "Job not found or no longer open.");

    // Resolve the resume: the chosen one (must belong to this candidate) or their primary.
    let resumeDoc = null;
    if (resumeDocumentId) {
      resumeDoc = await CandidateDocument.findOne({ _id: resumeDocumentId, candidateAccountId, kind: "resume" }).lean();
      if (!resumeDoc) throw new ApiError(400, "INVALID_RESUME", "Selected resume not found.");
    } else {
      resumeDoc = await CandidateDocument.findOne({ candidateAccountId, kind: "resume", isPrimary: true }).lean();
    }

    // Project the applicant into the org tenant so recruiters see them — single source of truth
    // (docs/13 §5). Upsert one Candidate per account per org.
    const account = await CandidateAccount.findById(candidateAccountId).lean();
    const candidate = await Candidate.findOneAndUpdate(
      { organizationId: job.organizationId, candidateAccountId },
      {
        $setOnInsert: {
          organizationId: job.organizationId,
          candidateAccountId,
          fullName: account?.fullName || "Applicant",
          email: account?.email,
          sourceType: "career_site",
        },
      },
      { upsert: true, new: true }
    );

    let application;
    try {
      application = await Application.create({
        candidateAccountId,
        jobId,
        organizationId: job.organizationId,
        candidateId: candidate._id,
        resumeDocumentId: resumeDoc?._id,
        answers: Array.isArray(answers) ? answers : [],
        status: "applied",
        submittedAt: new Date(),
      });
    } catch (err) {
      // Unique {candidateAccountId, jobId} violation → already applied (spec §4.5).
      if (err?.code === 11000) throw new ApiError(409, "ALREADY_APPLIED", "You have already applied to this job.");
      throw err;
    }

    // Candidate-visible timeline entry + recruiter pipeline entry (both mutate the same truth).
    await ApplicationEvent.create({
      applicationId: application._id,
      organizationId: job.organizationId,
      type: "submitted",
      toStatus: "applied",
      actorType: "candidate",
      actorId: candidateAccountId,
      visibility: "candidate",
    });
    await PipelineStage.findOneAndUpdate(
      { organizationId: job.organizationId, jobId, candidateId: candidate._id },
      { $setOnInsert: { organizationId: job.organizationId, jobId, candidateId: candidate._id, stage: "applied" } },
      { upsert: true, new: true }
    );

    return presentApplication(application.toObject(), job);
  },

  async list(candidateAccountId) {
    const applications = await Application.find({ candidateAccountId })
      .populate("jobId", "title location employmentType workMode")
      .sort({ createdAt: -1 })
      .lean();
    return applications.map((a) => presentApplication(a, a.jobId));
  },

  async get(candidateAccountId, applicationId) {
    // Ownership: scoping by candidateAccountId means another candidate's id simply 404s (IDOR-safe).
    const application = await Application.findOne({ _id: applicationId, candidateAccountId })
      .populate("jobId", "title location employmentType workMode")
      .lean();
    if (!application) throw new ApiError(404, "APPLICATION_NOT_FOUND", "Application not found.");

    // Timeline: ONLY candidate-visible events — internal recruiter notes never leak (docs/13 §4.6).
    const timeline = await ApplicationEvent.find({ applicationId, visibility: "candidate" })
      .sort({ createdAt: 1 })
      .lean();
    return { ...presentApplication(application, application.jobId), timeline };
  },

  async withdraw(candidateAccountId, applicationId) {
    const application = await Application.findOne({ _id: applicationId, candidateAccountId });
    if (!application) throw new ApiError(404, "APPLICATION_NOT_FOUND", "Application not found.");
    if (["hired", "withdrawn", "rejected"].includes(application.status)) {
      throw new ApiError(409, "CANNOT_WITHDRAW", `Cannot withdraw an application that is already ${application.status}.`);
    }

    const fromStatus = application.status;
    application.status = "withdrawn";
    application.withdrawnAt = new Date();
    await application.save();

    await ApplicationEvent.create({
      applicationId,
      organizationId: application.organizationId,
      type: "withdrawn",
      fromStatus,
      toStatus: "withdrawn",
      actorType: "candidate",
      actorId: candidateAccountId,
      visibility: "candidate",
    });
    return presentApplication(application.toObject(), null);
  },
};
