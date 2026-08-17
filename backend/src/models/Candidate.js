import mongoose from "mongoose";

const candidateSchema = new mongoose.Schema(
  {
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    fullName: { type: String, required: true },
    email: String,
    phone: String,
    currentTitle: String,
    totalExperienceYears: Number,
    education: [{ degree: String, institution: String, year: Number }],
    certifications: [String],
    skills: [{ name: String, category: String, confidence: Number }],
    resumeIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Resume" }],
    sourceType: { type: String, enum: ["upload", "referral", "career_site"], default: "upload" },
    duplicateOfCandidateId: { type: mongoose.Schema.Types.ObjectId, ref: "Candidate" },
    consentGivenAt: Date,
    timeline: [{ type: { type: String }, description: String, date: Date }],
  },
  { timestamps: true }
);

candidateSchema.index({ organizationId: 1, email: 1 });

export const Candidate = mongoose.model("Candidate", candidateSchema);
