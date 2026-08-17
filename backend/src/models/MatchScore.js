import mongoose from "mongoose";

const matchScoreSchema = new mongoose.Schema(
  {
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    candidateId: { type: mongoose.Schema.Types.ObjectId, ref: "Candidate", required: true, index: true },
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true, index: true },
    overallScore: Number,
    skillScore: Number,
    experienceScore: Number,
    educationScore: Number,
    domainScore: Number,
    explanation: String,
    reasonTags: [String],
    reasonSummary: String,
    scoredAt: { type: Date, default: Date.now },
    scoringVersion: String,
  },
  { timestamps: true }
);

matchScoreSchema.index({ jobId: 1, overallScore: -1 });
matchScoreSchema.index({ candidateId: 1, jobId: 1 }, { unique: true });

export const MatchScore = mongoose.model("MatchScore", matchScoreSchema);
