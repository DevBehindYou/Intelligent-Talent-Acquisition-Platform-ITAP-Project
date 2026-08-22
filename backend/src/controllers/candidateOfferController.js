import { offerService } from "../services/offerService.js";

export const candidateOfferController = {
  async list(req, res) {
    const items = await offerService.listForCandidate(req.session.candidateAccountId);
    res.json({ success: true, data: { items } });
  },

  async get(req, res) {
    const data = await offerService.getForCandidate(req.session.candidateAccountId, req.params.offerId);
    res.json({ success: true, data });
  },

  async accept(req, res) {
    const data = await offerService.respond(req.session.candidateAccountId, req.params.offerId, "accept");
    res.json({ success: true, data });
  },

  async decline(req, res) {
    const data = await offerService.respond(req.session.candidateAccountId, req.params.offerId, "decline");
    res.json({ success: true, data });
  },

  async download(req, res) {
    const url = await offerService.documentUrl(
      req.session.candidateAccountId,
      req.params.offerId,
      Number(req.params.index)
    );
    res.json({ success: true, data: { url } });
  },
};
