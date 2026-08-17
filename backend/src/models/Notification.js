import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, enum: ["ranking_ready", "interview_scheduled", "stage_changed"] },
    payload: mongoose.Schema.Types.Mixed,
    readAt: Date,
  },
  { timestamps: true }
);

export const Notification = mongoose.model("Notification", notificationSchema);
