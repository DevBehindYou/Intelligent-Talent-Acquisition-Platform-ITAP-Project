import { OnboardingCase } from "../models/OnboardingCase.js";
import { OnboardingTask } from "../models/OnboardingTask.js";
import { Application } from "../models/Application.js";
import { ApplicationEvent } from "../models/ApplicationEvent.js";
import { candidateNotificationService } from "./candidateNotificationService.js";
import { candidateEvents } from "../sockets/candidateEvents.js";
import { ApiError } from "../middleware/errorHandler.js";

// Field names in a form submission that hold sensitive PII/financial data. Masked on read
// (defense-in-depth + docs/13 §19 "mask sensitive information"); should also be encrypted at
// rest in production — flagged for the Phase 5 hardening pass.
const SENSITIVE_KEY = /account|routing|ssn|social|tax.?id|id.?number|passport|national.?id|iban|sort.?code/i;

function maskValue(v) {
  const s = String(v ?? "");
  return s.length <= 4 ? "••••" : `••••${s.slice(-4)}`;
}

function maskSensitive(data) {
  if (!data || typeof data !== "object") return data;
  const out = {};
  for (const [k, v] of Object.entries(data)) out[k] = SENSITIVE_KEY.test(k) ? maskValue(v) : v;
  return out;
}

// A task is "done" (counts toward progress) once the candidate has submitted or it's approved.
const DONE = new Set(["submitted", "approved"]);

function presentTask(task) {
  return {
    id: task._id,
    title: task.title,
    description: task.description,
    type: task.type,
    status: task.status,
    dueDate: task.dueDate,
    documentId: task.documentId,
    submissionData: maskSensitive(task.submissionData),
    submittedAt: task.submittedAt,
    reviewerNote: task.reviewerNote,
  };
}

function presentCase(onboardingCase, tasks) {
  const total = tasks.length;
  const done = tasks.filter((t) => DONE.has(t.status)).length;
  return {
    id: onboardingCase._id,
    job: onboardingCase.jobId,
    status: onboardingCase.status,
    joiningDate: onboardingCase.joiningDate,
    hrInstructions: onboardingCase.hrInstructions,
    progressPct: total ? Math.round((done / total) * 100) : 0,
    outstanding: tasks.filter((t) => !DONE.has(t.status)).length,
    tasks: tasks.map(presentTask),
  };
}

export const onboardingService = {
  // --- Recruiter/HR side (staff UI + round-trip test) ---
  async startOnboarding(organizationId, { applicationId, joiningDate, hrInstructions, tasks = [], createdBy }) {
    const application = await Application.findOne({ _id: applicationId, organizationId });
    if (!application) throw new ApiError(404, "APPLICATION_NOT_FOUND", "Application not found.");

    const onboardingCase = await OnboardingCase.create({
      organizationId,
      applicationId,
      candidateAccountId: application.candidateAccountId,
      jobId: application.jobId,
      status: tasks.length ? "in_progress" : "not_started",
      joiningDate,
      hrInstructions,
      createdBy,
    });

    if (tasks.length) {
      await OnboardingTask.insertMany(
        tasks.map((t) => ({
          organizationId,
          onboardingCaseId: onboardingCase._id,
          candidateAccountId: application.candidateAccountId,
          title: t.title,
          description: t.description,
          type: t.type || "info",
          dueDate: t.dueDate,
        }))
      );
    }

    // Transition recruitment → onboarding.
    application.status = "hired";
    await application.save();
    await ApplicationEvent.create({
      applicationId,
      organizationId,
      type: "onboarding_started",
      toStatus: "hired",
      actorType: "staff",
      visibility: "candidate",
      metadata: { onboardingCaseId: onboardingCase._id },
    });
    if (application.candidateAccountId) {
      await candidateNotificationService.create({
        candidateAccountId: application.candidateAccountId,
        organizationId,
        type: "onboarding_started",
        payload: { onboardingCaseId: onboardingCase._id, applicationId },
      });
      candidateEvents.onboardingStarted(application.candidateAccountId, { onboardingCaseId: onboardingCase._id, applicationId });
    }
    return onboardingCase;
  },

  // Staff reviews a submitted task (approve/reject). reviewerNote is candidate-visible on reject.
  async reviewTask(organizationId, taskId, { decision, reviewerNote }) {
    if (!["approve", "reject"].includes(decision)) {
      throw new ApiError(400, "VALIDATION_ERROR", "decision must be 'approve' or 'reject'.");
    }
    const task = await OnboardingTask.findOneAndUpdate(
      { _id: taskId, organizationId },
      { status: decision === "approve" ? "approved" : "rejected", reviewerNote },
      { new: true }
    );
    if (!task) throw new ApiError(404, "TASK_NOT_FOUND", "Task not found.");
    await recomputeCaseStatus(task.onboardingCaseId);
    return task;
  },

  // --- Candidate side (IDOR-scoped) ---
  async getForCandidate(candidateAccountId) {
    const cases = await OnboardingCase.find({ candidateAccountId }).populate("jobId", "title").sort({ createdAt: -1 }).lean();
    const result = [];
    for (const c of cases) {
      const tasks = await OnboardingTask.find({ onboardingCaseId: c._id }).sort({ createdAt: 1 }).lean();
      const jobInfo = c.jobId && typeof c.jobId === "object" ? { id: c.jobId._id, title: c.jobId.title } : { id: c.jobId };
      result.push(presentCase({ ...c, jobId: jobInfo }, tasks));
    }
    return result;
  },

  async submitTask(candidateAccountId, taskId, { submissionData, documentId } = {}) {
    const task = await OnboardingTask.findOne({ _id: taskId, candidateAccountId });
    if (!task) throw new ApiError(404, "TASK_NOT_FOUND", "Task not found.");
    if (task.type === "info") throw new ApiError(400, "NOT_SUBMITTABLE", "This item is informational only.");
    if (DONE.has(task.status)) throw new ApiError(409, "ALREADY_SUBMITTED", "This task is already complete.");

    if (task.type === "document") task.documentId = documentId;
    if (task.type === "form") task.submissionData = submissionData;
    task.status = "submitted";
    task.submittedAt = new Date();
    task.reviewerNote = undefined; // clear any prior rejection note
    await task.save();
    await recomputeCaseStatus(task.onboardingCaseId);
    return presentTask(task.toObject());
  },

  async acknowledgeTask(candidateAccountId, taskId) {
    const task = await OnboardingTask.findOne({ _id: taskId, candidateAccountId });
    if (!task) throw new ApiError(404, "TASK_NOT_FOUND", "Task not found.");
    if (task.type !== "acknowledgement") throw new ApiError(400, "NOT_ACKNOWLEDGEABLE", "This task is not an acknowledgement.");
    task.status = "submitted";
    task.submittedAt = new Date();
    await task.save();
    await recomputeCaseStatus(task.onboardingCaseId);
    return presentTask(task.toObject());
  },
};

// Roll the case status up from its tasks.
async function recomputeCaseStatus(onboardingCaseId) {
  const tasks = await OnboardingTask.find({ onboardingCaseId }).select("status").lean();
  if (tasks.length === 0) return;
  const allDone = tasks.every((t) => t.status === "approved" || t.status === "submitted");
  const anyStarted = tasks.some((t) => t.status !== "pending");
  await OnboardingCase.updateOne(
    { _id: onboardingCaseId },
    { status: allDone ? "completed" : anyStarted ? "in_progress" : "not_started" }
  );
}
