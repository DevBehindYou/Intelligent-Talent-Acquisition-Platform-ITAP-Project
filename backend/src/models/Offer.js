import mongoose from "mongoose";

/**
 * A job offer extended to a candidate for a specific application (docs/13 §9). Org-scoped, with
 * candidateAccountId denormalized so the candidate portal can query offers directly. Documents
 * are recruiter-provided offer letters — only their names are ever shown to the candidate; the
 * storagePath stays server-side and is downloaded through a signed URL.
 */
const offerSchema = new mongoose.Schema(
  {
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    applicationId: { type: mongoose.Schema.Types.ObjectId, ref: "Application", required: true, index: true },
    candidateAccountId: { type: mongoose.Schema.Types.ObjectId, ref: "CandidateAccount", required: true, index: true },
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job" },

    status: {
      type: String,
      enum: ["draft", "released", "accepted", "declined", "rescinded"],
      default: "draft",
    },
    title: String,
    compensationSummary: String, // free text, e.g. "$150,000 base + equity"
    startDate: Date,
    acceptanceDeadline: Date,
    instructions: String,
    documents: [{ name: String, storagePath: String }],

    releasedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    releasedAt: Date,
    respondedAt: Date, // when the candidate accepted/declined
  },
  { timestamps: true }
);

offerSchema.index({ candidateAccountId: 1, status: 1 });

export const Offer = mongoose.model("Offer", offerSchema);
