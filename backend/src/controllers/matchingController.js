import { Job } from "../models/Job.js";
import { matchingService } from "../services/matchingService.js";

export const matchingController = {
  async recompute(req, res) {
    const job = await Job.findOne({ _id: req.params.jobId, organizationId: req.session.organizationId });
    if (!job) return res.status(404).json({ success: false, error: { code: "JOB_NOT_FOUND" } });
    // #3: pass organizationId so recomputeAllForJob scopes its own Job lookup correctly.
    const result = await matchingService.recomputeAllForJob(job._id, req.session.organizationId);
    res.json({ success: true, data: result });
  },
};
