import mongoose from "mongoose";

/**
 * A reusable assessment definition authored by recruiters (docs/13 §8). `title`/`type`/
 * `instructions` are candidate-facing; `rubric` and `maxScore` are INTERNAL scoring data that
 * must never reach the candidate.
 */
const assessmentSchema = new mongoose.Schema(
  {
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job", index: true },
    type: {
      type: String,
      enum: ["aptitude", "technical", "coding", "questionnaire", "assignment"],
      default: "questionnaire",
    },
    title: { type: String, required: true },
    instructions: String, // candidate-facing
    // INTERNAL — never sent to the candidate:
    rubric: String,
    maxScore: Number,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export const Assessment = mongoose.model("Assessment", assessmentSchema);
