import { candidateInterviewService } from "../services/candidateInterviewService.js";

export const candidateInterviewController = {
  async list(req, res) {
    const items = await candidateInterviewService.list(req.session.candidateAccountId);
    res.json({ success: true, data: { items } });
  },

  async get(req, res) {
    const data = await candidateInterviewService.get(req.session.candidateAccountId, req.params.interviewId);
    res.json({ success: true, data });
  },
};
