import mongoose from "mongoose";

const interviewQuestionSchema = new mongoose.Schema(
  {
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    candidateId: { type: mongoose.Schema.Types.ObjectId, ref: "Candidate", required: true, index: true },
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true, index: true },
    question: String,
    category: { type: String, enum: ["technical", "problem_solving", "behavioral"] },
    generatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const InterviewQuestion = mongoose.model("InterviewQuestion", interviewQuestionSchema);
