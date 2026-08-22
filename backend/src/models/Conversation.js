import mongoose from "mongoose";

/**
 * A secure candidate↔recruiter thread (docs/13 §12). Org-scoped, always tied to exactly one
 * candidate account (the participant). Optionally anchored to an Application/Job for context.
 * All messages in a conversation are shared by design — there is no "internal note" here;
 * internal recruiter notes live elsewhere (ApplicationEvent visibility:"internal").
 */
const conversationSchema = new mongoose.Schema(
  {
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    candidateAccountId: { type: mongoose.Schema.Types.ObjectId, ref: "CandidateAccount", required: true, index: true },
    applicationId: { type: mongoose.Schema.Types.ObjectId, ref: "Application", index: true },
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job" },
    subject: String,
    lastMessageAt: { type: Date, default: Date.now },
    lastMessagePreview: String,
    // Per-side read watermarks drive unread badges without a per-message read table.
    candidateLastReadAt: Date,
    staffLastReadAt: Date,
  },
  { timestamps: true }
);

conversationSchema.index({ candidateAccountId: 1, lastMessageAt: -1 });
conversationSchema.index({ organizationId: 1, lastMessageAt: -1 });

export const Conversation = mongoose.model("Conversation", conversationSchema);
