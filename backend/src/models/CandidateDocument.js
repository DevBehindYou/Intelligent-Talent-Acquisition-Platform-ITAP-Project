import mongoose from "mongoose";

/**
 * A candidate-owned file (resume, cover letter, certificate, later ID/tax docs). GLOBAL, like
 * CandidateAccount — it belongs to the job seeker, not to any recruiter org. Distinct from the
 * org-scoped recruiter `Resume` model (which drives the parsing/matching pipeline); when a
 * candidate applies, the chosen document is referenced by the Application and can later be
 * projected into an org Resume for the recruiter side. See docs/13 §2, §4.4.
 *
 * Stored via storageService in the private bucket — accessed only through short-lived signed
 * URLs, never a public path (docs/04-auth-security.md §5).
 */
const candidateDocumentSchema = new mongoose.Schema(
  {
    candidateAccountId: { type: mongoose.Schema.Types.ObjectId, ref: "CandidateAccount", required: true, index: true },
    kind: { type: String, enum: ["resume", "cover_letter", "certificate", "identity", "other"], default: "resume" },
    fileName: String, // original filename, for display
    storagePath: String, // private storageService object path
    fileType: { type: String, enum: ["pdf", "docx", "txt"] },
    mimeType: String,
    size: Number,
    isPrimary: { type: Boolean, default: false }, // the resume used by default when applying
  },
  { timestamps: true }
);

candidateDocumentSchema.index({ candidateAccountId: 1, kind: 1 });

export const CandidateDocument = mongoose.model("CandidateDocument", candidateDocumentSchema);
