import { getIo } from "./index.js";

// Emits to a single candidate's private room. getIo() throws when sockets aren't initialized
// (standalone worker, tests) — swallow that so the surrounding DB write still succeeds; the
// realtime nudge is best-effort, the persisted Notification/ApplicationEvent is the source of truth.
function safeEmit(run) {
  try {
    run(getIo());
  } catch {
    /* sockets not initialized in this process — skip the realtime push */
  }
}

export const candidateEvents = {
  notificationNew(candidateAccountId, notification) {
    safeEmit((io) => io.to(`candidate:${candidateAccountId}`).emit("candidate:notification:new", { notification }));
  },
  interviewScheduled(candidateAccountId, payload) {
    safeEmit((io) => io.to(`candidate:${candidateAccountId}`).emit("candidate:interview:scheduled", payload));
  },
  applicationUpdated(candidateAccountId, payload) {
    safeEmit((io) => io.to(`candidate:${candidateAccountId}`).emit("candidate:application:updated", payload));
  },
  messageNew(candidateAccountId, payload) {
    safeEmit((io) => io.to(`candidate:${candidateAccountId}`).emit("candidate:message:new", payload));
  },
  offerReleased(candidateAccountId, payload) {
    safeEmit((io) => io.to(`candidate:${candidateAccountId}`).emit("candidate:offer:released", payload));
  },
  assessmentAssigned(candidateAccountId, payload) {
    safeEmit((io) => io.to(`candidate:${candidateAccountId}`).emit("candidate:assessment:assigned", payload));
  },
  onboardingStarted(candidateAccountId, payload) {
    safeEmit((io) => io.to(`candidate:${candidateAccountId}`).emit("candidate:onboarding:started", payload));
  },
};
