import mongoose from "mongoose";

const organizationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    plan: { type: String, enum: ["starter", "growth", "enterprise"], default: "starter" },
    scoringDefaults: {
      skillsWeight: { type: Number, default: 0.4 },
      experienceWeight: { type: Number, default: 0.3 },
      educationWeight: { type: Number, default: 0.15 },
      domainWeight: { type: Number, default: 0.15 },
    },
    dataRetentionDays: { type: Number, default: 365 },
  },
  { timestamps: true }
);

export const Organization = mongoose.model("Organization", organizationSchema);
