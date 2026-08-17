import { AuditLog } from "../models/AuditLog.js";

// Writes an audit entry for sensitive actions — docs/04-auth-security.md §5. Fire-and-forget
// by design: an audit-log write failure should never block the underlying request.
export function auditLog(action, targetType) {
  return async (req, res, next) => {
    res.on("finish", () => {
      if (res.statusCode >= 400) return;
      AuditLog.create({
        organizationId: req.session?.organizationId,
        actorUserId: req.session?.userId,
        action,
        targetType,
        targetId: req.params.id || req.params.candidateId || req.params.jobId || req.params.userId,
        ipAddress: req.ip,
      }).catch(() => {});
    });
    next();
  };
}
