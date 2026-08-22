import { assessmentService } from "../services/assessmentService.js";

export const candidateAssessmentController = {
  async list(req, res) {
    const items = await assessmentService.listForCandidate(req.session.candidateAccountId);
    res.json({ success: true, data: { items } });
  },

  async get(req, res) {
    const data = await assessmentService.getForCandidate(req.session.candidateAccountId, req.params.assignmentId);
    res.json({ success: true, data });
  },

  async submit(req, res) {
    const data = await assessmentService.submit(req.session.candidateAccountId, req.params.assignmentId, req.body);
    res.json({ success: true, data });
  },
};
