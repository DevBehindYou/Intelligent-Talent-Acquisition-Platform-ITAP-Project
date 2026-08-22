import { platformAdminService } from "../services/platformAdminService.js";
import { adminManagementService } from "../services/adminManagementService.js";

const actor = (req) => ({ superAdminId: req.session.superAdminId });

export const platformAdminController = {
  async dashboard(req, res) {
    const data = await platformAdminService.dashboard();
    res.json({ success: true, data });
  },

  // Candidates
  async listCandidates(req, res) {
    res.json({ success: true, data: await adminManagementService.listCandidates(req.query) });
  },
  async getCandidate(req, res) {
    res.json({ success: true, data: await adminManagementService.getCandidate(req.params.id) });
  },
  async suspendCandidate(req, res) {
    res.json({ success: true, data: await adminManagementService.setCandidateSuspended(actor(req), req.params.id, true) });
  },
  async reactivateCandidate(req, res) {
    res.json({ success: true, data: await adminManagementService.setCandidateSuspended(actor(req), req.params.id, false) });
  },
  async anonymizeCandidate(req, res) {
    res.json({ success: true, data: await adminManagementService.anonymizeCandidate(actor(req), req.params.id) });
  },

  // Organizations / recruiters / applications / audit
  async listOrganizations(req, res) {
    res.json({ success: true, data: await adminManagementService.listOrganizations(req.query) });
  },
  async listRecruiters(req, res) {
    res.json({ success: true, data: await adminManagementService.listRecruiters(req.query) });
  },
  async activateRecruiter(req, res) {
    res.json({ success: true, data: await adminManagementService.setRecruiterActive(actor(req), req.params.id, true) });
  },
  async deactivateRecruiter(req, res) {
    res.json({ success: true, data: await adminManagementService.setRecruiterActive(actor(req), req.params.id, false) });
  },
  async listApplications(req, res) {
    res.json({ success: true, data: await adminManagementService.listApplications(req.query) });
  },
  async listAuditLogs(req, res) {
    res.json({ success: true, data: await adminManagementService.listAuditLogs(req.query) });
  },
};
