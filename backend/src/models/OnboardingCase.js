import mongoose from "mongoose";

/**
 * A hired candidate's onboarding, created when recruitment transitions to onboarding
 * (docs/13 §10). One per hired application. progressPct is derived from its tasks, not stored.
 */
const onboardingCaseSchema = new mongoose.Schema(
  {
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    applicationId: { type: mongoose.Schema.Types.ObjectId, ref: "Application", required: true, index: true },
    candidateAccountId: { type: mongoose.Schema.Types.ObjectId, ref: "CandidateAccount", required: true, index: true },
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job" },

    status: { type: String, enum: ["not_started", "in_progress", "completed"], default: "not_started" },
    joiningDate: Date,
    hrInstructions: String, // candidate-facing
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export const OnboardingCase = mongoose.model("OnboardingCase", onboardingCaseSchema);
