import mongoose from "mongoose";

const interviewSchema = new mongoose.Schema(
  {
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    candidateId: { type: mongoose.Schema.Types.ObjectId, ref: "Candidate", required: true, index: true },
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true, index: true },
    // Links to the candidate's Application when scheduled for a portal applicant (Phase 2).
    applicationId: { type: mongoose.Schema.Types.ObjectId, ref: "Application", index: true },
    scheduledAt: Date,
    // Candidate-facing logistics (docs/13 §7). Safe to show the candidate — unlike notes/feedback.
    type: { type: String, enum: ["phone", "video", "onsite"], default: "video" },
    location: String, // for onsite
    meetingLink: String, // for phone/video
    instructions: String,
    interviewers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    status: { type: String, enum: ["scheduled", "completed", "cancelled", "no_show"], default: "scheduled" },
    notes: String, // INTERNAL — never sent to the candidate
    feedback: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        rating: Number,
        comments: String,
        submittedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

export const Interview = mongoose.model("Interview", interviewSchema);
