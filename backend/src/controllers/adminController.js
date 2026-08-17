import { adminService } from "../services/adminService.js";
import { ApiError } from "../middleware/errorHandler.js";


export const adminController = {
  async listUsers(req, res) {
    const data = await adminService.listUsers(req.session.organizationId);
    res.json({ success: true, data });
  },
  async inviteUser(req, res) {
    const data = await adminService.inviteUser(req.session.organizationId, req.body);
    res.status(201).json({ success: true, data });
  },
  async updateUserRole(req, res) {
    const data = await adminService.updateUserRole(req.session.organizationId, req.params.userId, req.body.role);
    res.json({ success: true, data });
  },
  async getScoringDefaults(req, res) {
    const data = await adminService.getScoringDefaults(req.session.organizationId);
    res.json({ success: true, data });
  },
  async updateScoringDefaults(req, res) {
    const { skillsWeight, experienceWeight, educationWeight, domainWeight } = req.body;
    // #16: validate that org-level default weights sum to 1.0 (same constraint as per-job weights).
    const sum = (skillsWeight ?? 0) + (experienceWeight ?? 0) + (educationWeight ?? 0) + (domainWeight ?? 0);
    if (Math.abs(sum - 1.0) > 0.01) {
      throw new ApiError(
        400,
        "VALIDATION_ERROR",
        `Scoring weights must sum to 1.0 (got ${sum.toFixed(3)}). Adjust the values and try again.`
      );
    }
    const data = await adminService.updateScoringDefaults(req.session.organizationId, req.body);
    res.json({ success: true, data });
  },
  async auditLogs(req, res) {
    const data = await adminService.auditLogs(req.session.organizationId, req.query);
    res.json({ success: true, data });
  },
};
