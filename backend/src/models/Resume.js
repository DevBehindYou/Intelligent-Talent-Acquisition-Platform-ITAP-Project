import mongoose from "mongoose";

const resumeSchema = new mongoose.Schema(
  {
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    candidateId: { type: mongoose.Schema.Types.ObjectId, ref: "Candidate" },
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job" },
    fileUrl: String, // Supabase Storage path (private bucket) — see docs/04-auth-security.md §5
    fileType: { type: String, enum: ["pdf", "docx", "txt"] },
    status: { type: String, enum: ["queued", "parsing", "parsed", "failed"], default: "queued" },
    parsedAt: Date,
    rawExtractedText: String,
    parseError: String,
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    batchId: { type: String, index: true },
  },
  { timestamps: true }
);

resumeSchema.index({ organizationId: 1, jobId: 1, status: 1 });

export const Resume = mongoose.model("Resume", resumeSchema);
