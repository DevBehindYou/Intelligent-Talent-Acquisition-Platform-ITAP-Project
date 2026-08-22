import mongoose from "mongoose";

/**
 * One assessment assigned to one candidate's application — the candidate-visible surface
 * (docs/13 §8). `score` and `evaluatorFeedback` are INTERNAL recruiter-only fields; the candidate
 * sees their own submission and the status, never the grade or the evaluation.
 */
const assessmentAssignmentSchema = new mongoose.Schema(
  {
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    assessmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Assessment", required: true, index: true },
    applicationId: { type: mongoose.Schema.Types.ObjectId, ref: "Application", required: true, index: true },
    candidateAccountId: { type: mongoose.Schema.Types.ObjectId, ref: "CandidateAccount", required: true, index: true },
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job" },

    status: {
      type: String,
      enum: ["assigned", "in_progress", "submitted", "completed", "expired"],
      default: "assigned",
    },
    deadline: Date,
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    assignedAt: { type: Date, default: Date.now },
    submittedAt: Date,
    submissionText: String, // the candidate's own submission — OK to show them
    submissionDocumentIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "CandidateDocument" }],

    // INTERNAL — never sent to the candidate:
    score: Number,
    evaluatorFeedback: String,
  },
  { timestamps: true }
);

assessmentAssignmentSchema.index({ candidateAccountId: 1, status: 1 });

export const AssessmentAssignment = mongoose.model("AssessmentAssignment", assessmentAssignmentSchema);
