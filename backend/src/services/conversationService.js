import { Conversation } from "../models/Conversation.js";
import { Message } from "../models/Message.js";
import { Application } from "../models/Application.js";
import { candidateEvents } from "../sockets/candidateEvents.js";
import { candidateNotificationService } from "./candidateNotificationService.js";
import { getIo } from "../sockets/index.js";
import { ApiError } from "../middleware/errorHandler.js";

function safeOrgEmit(organizationId, event, payload) {
  try {
    getIo().to(`org:${organizationId}`).emit(event, payload);
  } catch {
    /* sockets not initialized in this process */
  }
}

const preview = (body) => (body.length > 120 ? `${body.slice(0, 119)}…` : body);

function presentConversation(c) {
  return {
    id: c._id,
    subject: c.subject,
    applicationId: c.applicationId,
    jobId: c.jobId,
    lastMessageAt: c.lastMessageAt,
    lastMessagePreview: c.lastMessagePreview,
    unread: Boolean(c.lastMessageAt && (!c.candidateLastReadAt || c.candidateLastReadAt < c.lastMessageAt)),
  };
}

const presentMessage = (m) => ({ id: m._id, senderType: m.senderType, body: m.body, createdAt: m.createdAt });

export const conversationService = {
  async listForCandidate(candidateAccountId) {
    const convos = await Conversation.find({ candidateAccountId }).sort({ lastMessageAt: -1 }).lean();
    return convos.map(presentConversation);
  },

  // IDOR-scoped: another candidate's conversationId simply 404s.
  async threadForCandidate(candidateAccountId, conversationId) {
    const convo = await Conversation.findOne({ _id: conversationId, candidateAccountId });
    if (!convo) throw new ApiError(404, "CONVERSATION_NOT_FOUND", "Conversation not found.");
    const messages = await Message.find({ conversationId }).sort({ createdAt: 1 }).lean();
    convo.candidateLastReadAt = new Date(); // mark read for the candidate
    await convo.save();
    return { conversation: presentConversation(convo.toObject()), messages: messages.map(presentMessage) };
  },

  async sendAsCandidate(candidateAccountId, conversationId, body) {
    if (!body?.trim()) throw new ApiError(400, "VALIDATION_ERROR", "Message body is required.");
    const convo = await Conversation.findOne({ _id: conversationId, candidateAccountId });
    if (!convo) throw new ApiError(404, "CONVERSATION_NOT_FOUND", "Conversation not found.");

    const message = await Message.create({
      conversationId,
      organizationId: convo.organizationId,
      senderType: "candidate",
      senderId: candidateAccountId,
      body: body.trim(),
    });
    convo.lastMessageAt = message.createdAt;
    convo.lastMessagePreview = preview(body.trim());
    convo.candidateLastReadAt = message.createdAt;
    await convo.save();

    safeOrgEmit(convo.organizationId, "conversation:message", {
      conversationId,
      candidateAccountId,
      preview: convo.lastMessagePreview,
    });
    return presentMessage(message.toObject());
  },

  async startAsCandidate(candidateAccountId, { applicationId, subject, body }) {
    if (!applicationId) throw new ApiError(400, "VALIDATION_ERROR", "applicationId is required.");
    if (!body?.trim()) throw new ApiError(400, "VALIDATION_ERROR", "Message body is required.");
    // Ownership: the application must belong to this candidate.
    const application = await Application.findOne({ _id: applicationId, candidateAccountId }).lean();
    if (!application) throw new ApiError(404, "APPLICATION_NOT_FOUND", "Application not found.");

    // One conversation per application — reuse if it already exists.
    let convo = await Conversation.findOne({ candidateAccountId, applicationId });
    if (!convo) {
      convo = await Conversation.create({
        organizationId: application.organizationId,
        candidateAccountId,
        applicationId,
        jobId: application.jobId,
        subject: subject || "Application question",
      });
    }
    const message = await this.sendAsCandidate(candidateAccountId, convo._id, body);
    return { conversationId: convo._id, message };
  },

  // Recruiter/HR side — invoked by the staff UI (Phase: recruiter integration) and by tests.
  // Notifies + pushes to the candidate so the round-trip is real.
  async postAsStaff({ organizationId, conversationId, senderUserId, body }) {
    if (!body?.trim()) throw new ApiError(400, "VALIDATION_ERROR", "Message body is required.");
    const convo = await Conversation.findOne({ _id: conversationId, organizationId });
    if (!convo) throw new ApiError(404, "CONVERSATION_NOT_FOUND", "Conversation not found.");

    const message = await Message.create({
      conversationId,
      organizationId,
      senderType: "staff",
      senderId: senderUserId,
      body: body.trim(),
    });
    convo.lastMessageAt = message.createdAt;
    convo.lastMessagePreview = preview(body.trim());
    convo.staffLastReadAt = message.createdAt;
    await convo.save();

    await candidateNotificationService.create({
      candidateAccountId: convo.candidateAccountId,
      organizationId,
      type: "message_received",
      payload: { conversationId, applicationId: convo.applicationId },
    });
    candidateEvents.messageNew(convo.candidateAccountId, { conversationId, preview: convo.lastMessagePreview });
    return presentMessage(message.toObject());
  },
};
