import mongoose from "mongoose";

const candidateSchema = new mongoose.Schema(
  {
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    // Links this tenant-scoped recruiter projection to the global job-seeker identity, when the
    // candidate applied through the portal. Null for recruiter-uploaded resumes with no account.
    // See docs/13-candidate-admin-enhancement-spec.md §1.1.
    candidateAccountId: { type: mongoose.Schema.Types.ObjectId, ref: "CandidateAccount", index: true },
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
