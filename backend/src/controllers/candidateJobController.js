import { candidateJobService } from "../services/candidateJobService.js";

export const candidateJobController = {
  async list(req, res) {
    const data = await candidateJobService.list(req.query);
    res.json({ success: true, data });
  },

  async get(req, res) {
    const job = await candidateJobService.get(req.params.jobId);
    res.json({ success: true, data: job });
  },
};
