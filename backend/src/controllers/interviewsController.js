import { interviewService } from "../services/interviewService.js";

export const interviewsController = {
  async schedule(req, res) {
    const interview = await interviewService.schedule(req.session.organizationId, req.body);
    res.status(201).json({ success: true, data: interview });
  },
  async get(req, res) {
    const interview = await interviewService.get(req.session.organizationId, req.params.interviewId);
    res.json({ success: true, data: interview });
  },
  async submitFeedback(req, res) {
    const interview = await interviewService.submitFeedback(
      req.session.organizationId,
      req.params.interviewId,
      req.session.userId,
      req.body
    );
    res.json({ success: true, data: interview });
  },
};
