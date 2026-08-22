import { applicationService } from "../services/applicationService.js";

// candidateAccountId always comes from the verified session — the client never supplies it,
// which is what makes /applications/:id IDOR-safe (docs/13 §7, §24).
export const applicationController = {
  async apply(req, res) {
    const data = await applicationService.apply(req.session.candidateAccountId, req.body);
    res.status(201).json({ success: true, data });
  },

  async list(req, res) {
    const items = await applicationService.list(req.session.candidateAccountId);
    res.json({ success: true, data: { items } });
  },

  async get(req, res) {
    const data = await applicationService.get(req.session.candidateAccountId, req.params.applicationId);
    res.json({ success: true, data });
  },

  async withdraw(req, res) {
    const data = await applicationService.withdraw(req.session.candidateAccountId, req.params.applicationId);
    res.json({ success: true, data });
  },
};
