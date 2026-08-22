import { Offer } from "../models/Offer.js";
import { Application } from "../models/Application.js";
import { ApplicationEvent } from "../models/ApplicationEvent.js";
import { storageService } from "./storageService.js";
import { candidateNotificationService } from "./candidateNotificationService.js";
import { candidateEvents } from "../sockets/candidateEvents.js";
import { ApiError } from "../middleware/errorHandler.js";

// Candidate-safe projection: documents expose only their names, never the storagePath.
function present(offer) {
  const job =
    offer.jobId && typeof offer.jobId === "object"
      ? { id: offer.jobId._id, title: offer.jobId.title, location: offer.jobId.location }
      : { id: offer.jobId };
  return {
    id: offer._id,
    job,
    applicationId: offer.applicationId,
    status: offer.status,
    title: offer.title,
    compensationSummary: offer.compensationSummary,
    startDate: offer.startDate,
    acceptanceDeadline: offer.acceptanceDeadline,
    instructions: offer.instructions,
    documents: (offer.documents || []).map((d, index) => ({ index, name: d.name })),
    releasedAt: offer.releasedAt,
    respondedAt: offer.respondedAt,
  };
}

export const offerService = {
  // --- Recruiter/HR side (invoked by the staff UI later + the round-trip test) ---
  async release(organizationId, { applicationId, releasedBy, title, compensationSummary, startDate, acceptanceDeadline, instructions, documents = [] }) {
    const application = await Application.findOne({ _id: applicationId, organizationId });
    if (!application) throw new ApiError(404, "APPLICATION_NOT_FOUND", "Application not found.");

    const offer = await Offer.create({
      organizationId,
      applicationId,
      candidateAccountId: application.candidateAccountId,
      jobId: application.jobId,
      status: "released",
      title,
      compensationSummary,
      startDate,
      acceptanceDeadline,
      instructions,
      documents,
      releasedBy,
      releasedAt: new Date(),
    });

    // Move the application to the offer stage and record a candidate-visible timeline event.
    application.status = "offer";
    await application.save();
    await ApplicationEvent.create({
      applicationId,
      organizationId,
      type: "offer_released",
      toStatus: "offer",
      actorType: "staff",
      visibility: "candidate",
      metadata: { offerId: offer._id },
    });

    if (application.candidateAccountId) {
      await candidateNotificationService.create({
        candidateAccountId: application.candidateAccountId,
        organizationId,
        type: "offer_released",
        payload: { offerId: offer._id, applicationId },
      });
      candidateEvents.offerReleased(application.candidateAccountId, { offerId: offer._id, applicationId });
    }
    return offer;
  },

  // --- Candidate side (IDOR-scoped by candidateAccountId) ---
  async listForCandidate(candidateAccountId) {
    const offers = await Offer.find({ candidateAccountId, status: { $ne: "draft" } })
      .populate("jobId", "title location")
      .sort({ createdAt: -1 })
      .lean();
    return offers.map(present);
  },

  async getForCandidate(candidateAccountId, offerId) {
    const offer = await Offer.findOne({ _id: offerId, candidateAccountId, status: { $ne: "draft" } })
      .populate("jobId", "title location")
      .lean();
    if (!offer) throw new ApiError(404, "OFFER_NOT_FOUND", "Offer not found.");
    return present(offer);
  },

  // decision: "accept" | "decline". Guards against acting on anything but a live released offer.
  async respond(candidateAccountId, offerId, decision) {
    if (!["accept", "decline"].includes(decision)) {
      throw new ApiError(400, "VALIDATION_ERROR", "decision must be 'accept' or 'decline'.");
    }
    const offer = await Offer.findOne({ _id: offerId, candidateAccountId });
    if (!offer) throw new ApiError(404, "OFFER_NOT_FOUND", "Offer not found.");
    if (offer.status !== "released") {
      throw new ApiError(409, "OFFER_NOT_ACTIONABLE", `This offer can no longer be ${decision}ed.`);
    }

    offer.status = decision === "accept" ? "accepted" : "declined";
    offer.respondedAt = new Date();
    await offer.save();

    await ApplicationEvent.create({
      applicationId: offer.applicationId,
      organizationId: offer.organizationId,
      type: decision === "accept" ? "offer_accepted" : "offer_declined",
      actorType: "candidate",
      actorId: candidateAccountId,
      visibility: "candidate",
      metadata: { offerId: offer._id },
    });
    return present(offer.toObject());
  },

  async documentUrl(candidateAccountId, offerId, index) {
    const offer = await Offer.findOne({ _id: offerId, candidateAccountId }).lean();
    if (!offer) throw new ApiError(404, "OFFER_NOT_FOUND", "Offer not found.");
    const doc = offer.documents?.[index];
    if (!doc?.storagePath) throw new ApiError(404, "DOCUMENT_NOT_FOUND", "Document not found.");
    return storageService.getSignedUrl(doc.storagePath);
  },
};
