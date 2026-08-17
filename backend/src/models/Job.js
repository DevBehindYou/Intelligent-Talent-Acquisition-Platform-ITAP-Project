import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
  {
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    title: { type: String, required: true },
    department: String,
    description: String,
    requiredSkills: [{ name: String, weight: Number, mustHave: Boolean }],
    niceToHaveSkills: [String],
    experienceMin: Number,
    experienceMax: Number,
    location: String,
    employmentType: { type: String, enum: ["full_time", "contract", "remote"], default: "full_time" },
    status: { type: String, enum: ["draft", "open", "on_hold", "closed"], default: "draft" },
    jdEmbeddingRef: String,
    scoringWeights: {
      skillsWeight: Number,
      experienceWeight: Number,
      educationWeight: Number,
      domainWeight: Number,
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

jobSchema.index({ organizationId: 1, status: 1 });

export const Job = mongoose.model("Job", jobSchema);
