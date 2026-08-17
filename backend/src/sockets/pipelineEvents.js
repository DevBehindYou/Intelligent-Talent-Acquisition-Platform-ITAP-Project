import { getIo } from "./index.js";

// Thin, named emitters so services never construct raw Socket.io event strings inline —
// keeps every event name traceable to docs/03-api-documentation.md §12 in one place.
export const pipelineEvents = {
  resumeBatchProgress(organizationId, payload) {
    getIo().to(`org:${organizationId}`).emit("resume-batch:progress", payload);
  },
  rankingUpdated(organizationId, payload) {
    getIo().to(`org:${organizationId}`).emit("ranking:updated", payload);
  },
  pipelineStageChanged(organizationId, payload) {
    getIo().to(`org:${organizationId}`).emit("pipeline:stage-changed", payload);
  },
  notificationNew(userId, notification) {
    getIo().to(`user:${userId}`).emit("notification:new", { notification });
  },
};
