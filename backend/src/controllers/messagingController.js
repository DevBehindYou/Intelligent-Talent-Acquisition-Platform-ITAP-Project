import { messagingService } from "../services/messagingService.js";

export const messagingController = {
  async draft(req, res) {
    const data = await messagingService.draft(req.session.organizationId, req.body);
    res.json({ success: true, data });
  },
  async send(req, res) {
    const data = await messagingService.send(req.session.organizationId, req.body);
    res.json({ success: true, data });
  },
};
