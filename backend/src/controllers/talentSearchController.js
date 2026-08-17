import { talentSearchService } from "../services/talentSearchService.js";

export const talentSearchController = {
  async search(req, res) {
    const data = await talentSearchService.search(req.session.organizationId, req.body.query, req.body.weights);
    res.json({ success: true, data });
  },
  async listPools(req, res) {
    const data = await talentSearchService.listPools(req.session.organizationId);
    res.json({ success: true, data });
  },
  async createPool(req, res) {
    const data = await talentSearchService.createPool(req.session.organizationId, req.session.userId, req.body);
    res.status(201).json({ success: true, data });
  },
};
