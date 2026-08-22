import mongoose from "mongoose";

/**
 * A single onboarding checklist item (docs/13 §10). Types:
 *   document        — upload a file (ID, signed form, tax doc) → CandidateDocument
 *   form            — fill structured info (personal/address/bank); sensitive fields are masked
 *                     on read (see onboardingService) and should be encrypted at rest in prod
 *   acknowledgement — acknowledge a policy
 *   info            — read-only HR instruction
 */
const onboardingTaskSchema = new mongoose.Schema(
  {
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    onboardingCaseId: { type: mongoose.Schema.Types.ObjectId, ref: "OnboardingCase", required: true, index: true },
    candidateAccountId: { type: mongoose.Schema.Types.ObjectId, ref: "CandidateAccount", required: true, index: true },

    title: { type: String, required: true },
    description: String,
    type: { type: String, enum: ["document", "form", "acknowledgement", "info"], default: "info" },
    status: { type: String, enum: ["pending", "submitted", "approved", "rejected"], default: "pending" },
    dueDate: Date,

    documentId: { type: mongoose.Schema.Types.ObjectId, ref: "CandidateDocument" }, // for type "document"
    submissionData: { type: mongoose.Schema.Types.Mixed }, // for type "form"
    submittedAt: Date,
    reviewerNote: String, // candidate-visible note (e.g. rejection reason)
  },
  { timestamps: true }
);

onboardingTaskSchema.index({ onboardingCaseId: 1, status: 1 });
onboardingTaskSchema.index({ candidateAccountId: 1, status: 1 });

export const OnboardingTask = mongoose.model("OnboardingTask", onboardingTaskSchema);
