import { onboardingService } from "../services/onboardingService.js";

export const candidateOnboardingController = {
  async list(req, res) {
    const items = await onboardingService.getForCandidate(req.session.candidateAccountId);
    res.json({ success: true, data: { items } });
  },

  async submitTask(req, res) {
    const data = await onboardingService.submitTask(req.session.candidateAccountId, req.params.taskId, req.body);
    res.json({ success: true, data });
  },

  async acknowledgeTask(req, res) {
    const data = await onboardingService.acknowledgeTask(req.session.candidateAccountId, req.params.taskId);
    res.json({ success: true, data });
  },
};
