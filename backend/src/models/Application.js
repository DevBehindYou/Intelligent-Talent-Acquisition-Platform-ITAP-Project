import mongoose from "mongoose";

/**
 * The join entity between a global CandidateAccount and one org's Job — the single source of
 * truth for candidate/recruiter application state (docs/13-candidate-admin-enhancement-spec.md
 * §1.1, §5). organizationId is denormalized from the Job so every query stays tenant-scoped
 * without a join, and candidateId links the per-org recruiter-side Candidate projection once
 * the application is accepted into that tenant's pipeline.
 *
 * status mirrors the recruiter PipelineStage vocabulary (+ "withdrawn") so the two stay in
 * lockstep; the richer candidate-facing labels ("Under Review", "Assessment Pending", …) are
 * a presentation projection layered on top in Phase 1 (spec §4.6).
 */
const applicationSchema = new mongoose.Schema(
  {
    candidateAccountId: { type: mongoose.Schema.Types.ObjectId, ref: "CandidateAccount", required: true, index: true },
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true, index: true },
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    // Per-org recruiter-side projection (nullable until the application is projected into the tenant).
    candidateId: { type: mongoose.Schema.Types.ObjectId, ref: "Candidate" },
    // The candidate's chosen resume — a global CandidateDocument, not the org-scoped Resume.
    resumeDocumentId: { type: mongoose.Schema.Types.ObjectId, ref: "CandidateDocument" },

    status: {
      type: String,
      enum: ["applied", "screened", "shortlisted", "interviewing", "offer", "hired", "rejected", "withdrawn"],
      default: "applied",
    },
    answers: [{ question: String, answer: String }],

    submittedAt: { type: Date, default: Date.now },
    withdrawnAt: Date,
  },
  { timestamps: true }
);

// One application per candidate per job — blocks accidental duplicate applications (spec §4.5).
applicationSchema.index({ candidateAccountId: 1, jobId: 1 }, { unique: true });
// Recruiter-side listing/filtering within a tenant.
applicationSchema.index({ organizationId: 1, status: 1 });
// Candidate-side "my applications" listing.
applicationSchema.index({ candidateAccountId: 1, status: 1 });

export const Application = mongoose.model("Application", applicationSchema);
