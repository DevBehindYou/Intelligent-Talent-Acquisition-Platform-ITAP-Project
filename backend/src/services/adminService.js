import { User } from "../models/User.js";
import { Organization } from "../models/Organization.js";
import { AuditLog } from "../models/AuditLog.js";

export const adminService = {
  async listUsers(organizationId) {
    return User.find({ organizationId }).sort({ createdAt: -1 }).lean();
  },

  // In production this creates a pending invite row + sends an email via a transactional
  // provider; simplified here since email delivery is out of scope for the scaffold.
  async inviteUser(organizationId, { email, role }) {
    return { email, role, organizationId, status: "invited" };
  },

  async updateUserRole(organizationId, userId, role) {
    return User.findOneAndUpdate({ _id: userId, organizationId }, { role }, { new: true });
  },

  async getScoringDefaults(organizationId) {
    const org = await Organization.findById(organizationId).lean();
    return org?.scoringDefaults;
  },

  async updateScoringDefaults(organizationId, weights) {
    const org = await Organization.findByIdAndUpdate(organizationId, { scoringDefaults: weights }, { new: true });
    return org.scoringDefaults;
  },

  async auditLogs(organizationId, { page = 1, pageSize = 50 }) {
    const [items, total] = await Promise.all([
      AuditLog.find({ organizationId })
        .sort({ createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(Number(pageSize))
        .populate("actorUserId", "fullName")
        .lean(),
      AuditLog.countDocuments({ organizationId }),
    ]);
    return { items: items.map((l) => ({ ...l, actorName: l.actorUserId?.fullName || "System" })), total };
  },
};
