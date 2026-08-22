import { conversationService } from "../services/conversationService.js";

export const candidateConversationController = {
  async list(req, res) {
    const items = await conversationService.listForCandidate(req.session.candidateAccountId);
    res.json({ success: true, data: { items } });
  },

  async thread(req, res) {
    const data = await conversationService.threadForCandidate(
      req.session.candidateAccountId,
      req.params.conversationId
    );
    res.json({ success: true, data });
  },

  async start(req, res) {
    const data = await conversationService.startAsCandidate(req.session.candidateAccountId, req.body);
    res.status(201).json({ success: true, data });
  },

  async send(req, res) {
    const data = await conversationService.sendAsCandidate(
      req.session.candidateAccountId,
      req.params.conversationId,
      req.body.body
    );
    res.status(201).json({ success: true, data });
  },
};
