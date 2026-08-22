import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    conversationId: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation", required: true, index: true },
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    senderType: { type: String, enum: ["candidate", "staff"], required: true },
    // References a CandidateAccount or a User depending on senderType.
    senderId: { type: mongoose.Schema.Types.ObjectId, required: true },
    body: { type: String, required: true },
  },
  { timestamps: true }
);

messageSchema.index({ conversationId: 1, createdAt: 1 });

export const Message = mongoose.model("Message", messageSchema);
