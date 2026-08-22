import { candidateProfileService } from "../services/candidateProfileService.js";

// candidateAccountId always comes from the verified session (req.session), never from the
// request body or params — this is the ownership guarantee (docs/13 §3.3).
export const candidateProfileController = {
  async get(req, res) {
    const data = await candidateProfileService.get(req.session.candidateAccountId);
    res.json({ success: true, data });
  },

  async update(req, res) {
    const data = await candidateProfileService.update(req.session.candidateAccountId, req.body);
    res.json({ success: true, data });
  },
};
