import { candidateNotificationService } from "../services/candidateNotificationService.js";

export const candidateNotificationController = {
  async list(req, res) {
    const accountId = req.session.candidateAccountId;
    const items = await candidateNotificationService.list(accountId, { unreadOnly: req.query.unread === "true" });
    const unreadCount = await candidateNotificationService.unreadCount(accountId);
    res.json({ success: true, data: { items, unreadCount } });
  },

  async markRead(req, res) {
    const data = await candidateNotificationService.markRead(req.session.candidateAccountId, req.params.notificationId);
    res.json({ success: true, data });
  },

  async markAllRead(req, res) {
    const data = await candidateNotificationService.markAllRead(req.session.candidateAccountId);
    res.json({ success: true, data });
  },
};
