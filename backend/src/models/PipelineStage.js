import mongoose from "mongoose";

const pipelineStageSchema = new mongoose.Schema(
  {
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true, index: true },
    candidateId: { type: mongoose.Schema.Types.ObjectId, ref: "Candidate", required: true, index: true },
    stage: {
      type: String,
      enum: ["applied", "screened", "shortlisted", "interviewing", "offer", "hired", "rejected"],
      default: "applied",
    },
    movedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    movedAt: { type: Date, default: Date.now },
    notes: String,
  },
  { timestamps: true }
);

pipelineStageSchema.index({ jobId: 1, stage: 1 });
pipelineStageSchema.index({ jobId: 1, candidateId: 1 }, { unique: true });

export const PipelineStage = mongoose.model("PipelineStage", pipelineStageSchema);
