import mongoose from "mongoose";

/**
 * Append-only timeline for a single Application — powers both the candidate's progress tracker
 * and the recruiter's audit view (docs/13-candidate-admin-enhancement-spec.md §2, §4.6).
 *
 * The `visibility` field is the privacy boundary: rows marked "internal" (recruiter notes,
 * evaluation data) are NEVER returned to the candidate. Candidate-facing endpoints must always
 * filter to visibility:"candidate".
 */
const applicationEventSchema = new mongoose.Schema(
  {
    applicationId: { type: mongoose.Schema.Types.ObjectId, ref: "Application", required: true, index: true },
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, index: true },

    type: { type: String, required: true }, // e.g. "submitted", "status_changed", "note", "interview_scheduled"
    fromStatus: String,
    toStatus: String,

    actorType: { type: String, enum: ["candidate", "staff", "system"], default: "system" },
    // References a CandidateAccount or a User depending on actorType (null for system events).
    actorId: { type: mongoose.Schema.Types.ObjectId },

    visibility: { type: String, enum: ["candidate", "internal"], default: "candidate", index: true },
    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

// Timeline reads: one application, chronological.
applicationEventSchema.index({ applicationId: 1, createdAt: 1 });

export const ApplicationEvent = mongoose.model("ApplicationEvent", applicationEventSchema);
