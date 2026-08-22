import { Assessment } from "../models/Assessment.js";
import { AssessmentAssignment } from "../models/AssessmentAssignment.js";
import { Application } from "../models/Application.js";
import { ApplicationEvent } from "../models/ApplicationEvent.js";
import { candidateNotificationService } from "./candidateNotificationService.js";
import { candidateEvents } from "../sockets/candidateEvents.js";
import { ApiError } from "../middleware/errorHandler.js";

// Redaction boundary: the candidate sees the brief + their own submission, never the rubric,
// max score, grade, or evaluator feedback (docs/13 §8).
function presentForCandidate(assignment, assessment) {
  return {
    id: assignment._id,
    title: assessment?.title,
    type: assessment?.type,
    instructions: assessment?.instructions,
    status: assignment.status,
    deadline: assignment.deadline,
    assignedAt: assignment.assignedAt,
    submittedAt: assignment.submittedAt,
    submissionText: assignment.submissionText, // the candidate's own work
  };
}

export const assessmentService = {
  // --- Recruiter/HR side (staff UI + round-trip test) ---
  async createAssessment(organizationId, { jobId, type, title, instructions, rubric, maxScore, createdBy }) {
    return Assessment.create({ organizationId, jobId, type, title, instructions, rubric, maxScore, createdBy });
  },

  async assign(organizationId, { assessmentId, applicationId, deadline, assignedBy }) {
    const assessment = await Assessment.findOne({ _id: assessmentId, organizationId });
    if (!assessment) throw new ApiError(404, "ASSESSMENT_NOT_FOUND", "Assessment not found.");
    const application = await Application.findOne({ _id: applicationId, organizationId });
    if (!application) throw new ApiError(404, "APPLICATION_NOT_FOUND", "Application not found.");

    const assignment = await AssessmentAssignment.create({
      organizationId,
      assessmentId,
      applicationId,
      candidateAccountId: application.candidateAccountId,
      jobId: application.jobId,
      deadline,
      assignedBy,
      status: "assigned",
    });

    await ApplicationEvent.create({
      applicationId,
      organizationId,
      type: "assessment_assigned",
      actorType: "staff",
      visibility: "candidate",
      metadata: { assignmentId: assignment._id },
    });
    if (application.candidateAccountId) {
      await candidateNotificationService.create({
        candidateAccountId: application.candidateAccountId,
        organizationId,
        type: "assessment_assigned",
        payload: { assignmentId: assignment._id, applicationId },
      });
      candidateEvents.assessmentAssigned(application.candidateAccountId, { assignmentId: assignment._id, applicationId });
    }
    return assignment;
  },

  // Internal grading — sets score/feedback the candidate must never see.
  async grade(organizationId, assignmentId, { score, evaluatorFeedback }) {
    const assignment = await AssessmentAssignment.findOneAndUpdate(
      { _id: assignmentId, organizationId },
      { score, evaluatorFeedback, status: "completed" },
      { new: true }
    );
    if (!assignment) throw new ApiError(404, "ASSIGNMENT_NOT_FOUND", "Assignment not found.");
    return assignment;
  },

  // --- Candidate side (IDOR-scoped) ---
  async listForCandidate(candidateAccountId) {
    const assignments = await AssessmentAssignment.find({ candidateAccountId })
      .populate("assessmentId")
      .sort({ createdAt: -1 })
      .lean();
    return assignments.map((a) => presentForCandidate(a, a.assessmentId));
  },

  async getForCandidate(candidateAccountId, assignmentId) {
    const assignment = await AssessmentAssignment.findOne({ _id: assignmentId, candidateAccountId })
      .populate("assessmentId")
      .lean();
    if (!assignment) throw new ApiError(404, "ASSIGNMENT_NOT_FOUND", "Assignment not found.");
    return presentForCandidate(assignment, assignment.assessmentId);
  },

  async submit(candidateAccountId, assignmentId, { submissionText, documentIds = [] }) {
    const assignment = await AssessmentAssignment.findOne({ _id: assignmentId, candidateAccountId });
    if (!assignment) throw new ApiError(404, "ASSIGNMENT_NOT_FOUND", "Assignment not found.");
    if (["submitted", "completed"].includes(assignment.status)) {
      throw new ApiError(409, "ALREADY_SUBMITTED", "This assessment has already been submitted.");
    }
    if (assignment.deadline && Date.now() > new Date(assignment.deadline).getTime()) {
      assignment.status = "expired";
      await assignment.save();
      throw new ApiError(409, "DEADLINE_PASSED", "The deadline for this assessment has passed.");
    }

    assignment.status = "submitted";
    assignment.submittedAt = new Date();
    assignment.submissionText = submissionText;
    assignment.submissionDocumentIds = documentIds;
    await assignment.save();

    await ApplicationEvent.create({
      applicationId: assignment.applicationId,
      organizationId: assignment.organizationId,
      type: "assessment_submitted",
      actorType: "candidate",
      actorId: candidateAccountId,
      visibility: "candidate",
      metadata: { assignmentId: assignment._id },
    });

    const assessment = await Assessment.findById(assignment.assessmentId).lean();
    return presentForCandidate(assignment.toObject(), assessment);
  },
};
