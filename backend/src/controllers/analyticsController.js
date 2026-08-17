import { analyticsService } from "../services/analyticsService.js";

export const analyticsController = {
  async dashboard(req, res) {
    const data = await analyticsService.dashboard(req.session.organizationId);
    res.json({ success: true, data });
  },
  async timeToHire(req, res) {
    const data = await analyticsService.timeToHire(req.session.organizationId);
    res.json({ success: true, data });
  },
  async skillDemand(req, res) {
    const data = await analyticsService.skillDemand(req.session.organizationId);
    res.json({ success: true, data });
  },
};
