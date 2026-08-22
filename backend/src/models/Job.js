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
    // Candidate-portal discovery fields (docs/13 §5.1). workMode is distinct from
    // employmentType; salaryRange.visible gates whether pay shows to candidates.
    workMode: { type: String, enum: ["onsite", "hybrid", "remote"] },
    experienceLevel: { type: String, enum: ["entry", "mid", "senior", "lead"] },
    salaryRange: { min: Number, max: Number, currency: String, visible: { type: Boolean, default: false } },
    // Only isPublic + status:"open" jobs are visible in the candidate portal; publishedAt drives
    // "date posted" sorting/filtering.
    isPublic: { type: Boolean, default: false },
    publishedAt: Date,
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
