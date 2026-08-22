import { Notification } from "../models/Notification.js";
import { candidateEvents } from "../sockets/candidateEvents.js";
import { ApiError } from "../middleware/errorHandler.js";

// Candidate-facing notification center. Every read/write is scoped by candidateAccountId
// (taken from the verified session in the controller), so notifications never cross accounts.
export const candidateNotificationService = {
  // Called by other services (e.g. interviewService) to persist + push a notification.
  async create({ candidateAccountId, organizationId, type, payload }) {
    const notification = await Notification.create({ candidateAccountId, organizationId, type, payload });
    candidateEvents.notificationNew(candidateAccountId, notification.toObject());
    return notification;
  },

  async list(candidateAccountId, { unreadOnly } = {}) {
    const filter = { candidateAccountId };
    if (unreadOnly) filter.readAt = null;
    return Notification.find(filter).sort({ createdAt: -1 }).limit(50).lean();
  },

  async unreadCount(candidateAccountId) {
    return Notification.countDocuments({ candidateAccountId, readAt: null });
  },

  async markRead(candidateAccountId, notificationId) {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, candidateAccountId },
      { readAt: new Date() },
      { new: true }
    );
    if (!notification) throw new ApiError(404, "NOTIFICATION_NOT_FOUND", "Notification not found.");
    return notification;
  },

  async markAllRead(candidateAccountId) {
    await Notification.updateMany({ candidateAccountId, readAt: null }, { readAt: new Date() });
    return { ok: true };
  },
};
