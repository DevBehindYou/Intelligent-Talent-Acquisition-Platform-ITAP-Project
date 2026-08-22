import { Interview } from "../models/Interview.js";
import { Candidate } from "../models/Candidate.js";
import { Application } from "../models/Application.js";
import { ApplicationEvent } from "../models/ApplicationEvent.js";
import { candidateNotificationService } from "./candidateNotificationService.js";
import { candidateEvents } from "../sockets/candidateEvents.js";
import { ApiError } from "../middleware/errorHandler.js";

export const interviewService = {
  async schedule(
    organizationId,
    { candidateId, jobId, scheduledAt, notes, interviewers = [], type, location, meetingLink, instructions }
  ) {
    const interview = await Interview.create({
      organizationId,
      candidateId,
      jobId,
      scheduledAt,
      notes,
      interviewers,
      type,
      location,
      meetingLink,
      instructions,
    });

    // Log the interview to the candidate's timeline so it appears in History
    await Candidate.updateOne(
      { _id: candidateId, organizationId },
      {
        $push: {
          timeline: {
            type: "interview",
            description: `Scheduled interview for ${new Date(scheduledAt).toLocaleString()}`,
            date: new Date(),
          },
        },
      }
    );

    // If this candidate applied through the portal, push the update to their side: a persisted
    // notification, a candidate-visible ApplicationEvent, and a best-effort realtime nudge.
    await notifyCandidateOfInterview(organizationId, candidateId, jobId, interview);

    return interview;
  },

  async get(organizationId, interviewId) {
    const interview = await Interview.findOne({ _id: interviewId, organizationId }).populate("interviewers", "fullName");
    if (!interview) throw new ApiError(404, "INTERVIEW_NOT_FOUND", "Interview not found.");
    return interview;
  },

  async submitFeedback(organizationId, interviewId, userId, { rating, comments }) {
    const interview = await Interview.findOneAndUpdate(
      { _id: interviewId, organizationId },
      { $push: { feedback: { userId, rating, comments, submittedAt: new Date() } }, $set: { status: "completed" } },
      { new: true }
    );
    if (!interview) throw new ApiError(404, "INTERVIEW_NOT_FOUND", "Interview not found.");
    return interview;
  },
};

// Bridges a recruiter-side interview to the candidate portal. No-ops for recruiter-uploaded
// candidates with no portal account. Failures here must not break scheduling, so they're logged
// and swallowed by the caller's normal error handling only for the realtime part (candidateEvents
// is already safe); the DB writes below are awaited so the candidate's data stays consistent.
async function notifyCandidateOfInterview(organizationId, candidateId, jobId, interview) {
  const candidate = await Candidate.findOne({ _id: candidateId, organizationId })
    .select("candidateAccountId")
    .lean();
  if (!candidate?.candidateAccountId) return; // recruiter-uploaded candidate, no portal account

  const application = await Application.findOne({ candidateAccountId: candidate.candidateAccountId, jobId });
  if (application) {
    interview.applicationId = application._id;
    await interview.save();
    await ApplicationEvent.create({
      applicationId: application._id,
      organizationId,
      type: "interview_scheduled",
      actorType: "staff",
      visibility: "candidate",
      metadata: { interviewId: interview._id, scheduledAt: interview.scheduledAt },
    });
  }

  await candidateNotificationService.create({
    candidateAccountId: candidate.candidateAccountId,
    organizationId,
    type: "interview_scheduled_candidate",
    payload: {
      interviewId: interview._id,
      jobId,
      applicationId: application?._id,
      scheduledAt: interview.scheduledAt,
    },
  });

  candidateEvents.interviewScheduled(candidate.candidateAccountId, {
    interviewId: interview._id,
    jobId,
    applicationId: application?._id,
    scheduledAt: interview.scheduledAt,
  });
}
