import { Interview } from "../models/Interview.js";
import { Candidate } from "../models/Candidate.js";
import { ApiError } from "../middleware/errorHandler.js";

// Resolve the per-org Candidate projections that belong to this global account. A candidate's
// interviews are the interviews scheduled against any of those projections.
async function projectionIds(candidateAccountId) {
  const projections = await Candidate.find({ candidateAccountId }).select("_id").lean();
  return projections.map((c) => c._id);
}

// The redaction boundary: explicitly whitelists candidate-safe fields. `notes`, `feedback`, and
// interviewer identities are NEVER included (docs/13 §4.7, §7).
function present(interview) {
  const job =
    interview.jobId && typeof interview.jobId === "object"
      ? { id: interview.jobId._id, title: interview.jobId.title, location: interview.jobId.location }
      : { id: interview.jobId };
  return {
    id: interview._id,
    job,
    applicationId: interview.applicationId,
    scheduledAt: interview.scheduledAt,
    status: interview.status,
    type: interview.type,
    location: interview.location,
    meetingLink: interview.meetingLink,
    instructions: interview.instructions,
  };
}

export const candidateInterviewService = {
  async list(candidateAccountId) {
    const ids = await projectionIds(candidateAccountId);
    if (ids.length === 0) return [];
    const interviews = await Interview.find({ candidateId: { $in: ids } })
      .populate("jobId", "title location")
      .sort({ scheduledAt: -1 })
      .lean();
    return interviews.map(present);
  },

  async get(candidateAccountId, interviewId) {
    const ids = await projectionIds(candidateAccountId);
    // Scoping candidateId to this account's projections makes another candidate's interview 404.
    const interview = await Interview.findOne({ _id: interviewId, candidateId: { $in: ids } })
      .populate("jobId", "title location")
      .lean();
    if (!interview) throw new ApiError(404, "INTERVIEW_NOT_FOUND", "Interview not found.");
    return present(interview);
  },
};
