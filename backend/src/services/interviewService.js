import mongoose from "mongoose";
import { Interview } from "../models/Interview.js";
import { ApiError } from "../middleware/errorHandler.js";

export const interviewService = {
  async schedule(organizationId, { candidateId, jobId, scheduledAt, notes, interviewers = [] }) {
    const interview = await Interview.create({ organizationId, candidateId, jobId, scheduledAt, notes, interviewers });
    
    // Log the interview to the candidate's timeline so it appears in History
    await mongoose.model("Candidate").updateOne(
      { _id: candidateId, organizationId },
      { $push: { timeline: { type: "interview", description: `Scheduled interview for ${new Date(scheduledAt).toLocaleString()}`, date: new Date() } } }
    );
    
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
