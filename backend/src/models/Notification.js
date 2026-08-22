import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    // Exactly one recipient is set: userId for staff, candidateAccountId for candidates.
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    candidateAccountId: { type: mongoose.Schema.Types.ObjectId, ref: "CandidateAccount", index: true },
    type: {
      type: String,
      enum: [
        // staff
        "ranking_ready",
        "interview_scheduled",
        "stage_changed",
        // candidate (Phase 2/3)
        "application_status_changed",
        "interview_scheduled_candidate",
        "message_received",
        "offer_released",
        "assessment_assigned",
        "onboarding_started",
      ],
    },
    payload: mongoose.Schema.Types.Mixed,
    readAt: Date,
  },
  { timestamps: true }
);

export const Notification = mongoose.model("Notification", notificationSchema);
