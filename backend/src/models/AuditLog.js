import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", index: true },
    actorUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    action: String,
    targetType: String,
    targetId: mongoose.Schema.Types.Mixed,
    metadata: mongoose.Schema.Types.Mixed,
    ipAddress: String,
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

auditLogSchema.index({ organizationId: 1, createdAt: -1 });

export const AuditLog = mongoose.model("AuditLog", auditLogSchema);
