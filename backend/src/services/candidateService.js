import { Candidate } from "../models/Candidate.js";
import { MatchScore } from "../models/MatchScore.js";
import { PipelineStage } from "../models/PipelineStage.js";
import { InterviewQuestion } from "../models/InterviewQuestion.js";
import { Job } from "../models/Job.js";
import { ApiError } from "../middleware/errorHandler.js";
import { aiServiceClient } from "./aiServiceClient.js";

function normalize(str = "") {
  return str.toLowerCase();
}

export const candidateService = {
  async list(organizationId, { search, skills, stage, scope, userId, page = 1, pageSize = 20 }) {
    const filter = { organizationId };
    if (search) {
      filter.$or = [{ fullName: { $regex: search, $options: "i" } }, { currentTitle: { $regex: search, $options: "i" } }];
    }
    if (skills) {
      const skillList = skills.split(",").map((s) => s.trim());
      filter["skills.name"] = { $in: skillList.map((s) => new RegExp(`^${s}$`, "i")) };
    }

    let candidateIds;
    if (stage) {
      const stageFilter = { organizationId, stage };
      // scope="mine" narrows a stage view to candidates *this* user moved into that stage
      // (PipelineStage.movedBy) — e.g. the "My Shortlists" page. Without this the param was
      // silently ignored, so that page showed the whole org's shortlisted candidates.
      if (scope === "mine" && userId) stageFilter.movedBy = userId;
      const stages = await PipelineStage.find(stageFilter).select("candidateId").lean();
      candidateIds = stages.map((s) => s.candidateId);
      filter._id = { $in: candidateIds };
    }

    const [items, total] = await Promise.all([
      Candidate.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(Number(pageSize))
        .lean(),
      Candidate.countDocuments(filter),
    ]);

    const withBestScore = await Promise.all(
      items.map(async (c) => {
        const best = await MatchScore.findOne({ candidateId: c._id }).sort({ overallScore: -1 }).lean();
        return { ...c, bestMatchScore: best?.overallScore ?? null };
      })
    );

    return { items: withBestScore, total };
  },

  async get(organizationId, candidateId) {
    const candidate = await Candidate.findOne({ _id: candidateId, organizationId }).lean();
    if (!candidate) throw new ApiError(404, "CANDIDATE_NOT_FOUND", "Candidate not found.");
    // #5: scope MatchScore by organizationId to prevent cross-tenant data leakage.
    const best = await MatchScore.findOne({ candidateId, organizationId }).sort({ overallScore: -1 }).lean();
    return { ...candidate, bestMatchScore: best?.overallScore ?? null };
  },

  async update(organizationId, candidateId, payload) {
    const candidate = await Candidate.findOneAndUpdate({ _id: candidateId, organizationId }, payload, { new: true });
    if (!candidate) throw new ApiError(404, "CANDIDATE_NOT_FOUND", "Candidate not found.");
    return candidate;
  },

  // Duplicate detection: finds candidates in the same org with the same email, or same
  // normalized full name. Email match is exact (DB query); name match uses a case-insensitive
  // MongoDB regex so it scales to any org size without loading all candidates into memory.
  // A future upgrade can layer in embedding-similarity (Qdrant) without changing the
  // response shape (docs/02-database-schema.md §4).
  async findDuplicates(organizationId, candidateId) {
    const candidate = await Candidate.findOne({ _id: candidateId, organizationId }).lean();
    if (!candidate) throw new ApiError(404, "CANDIDATE_NOT_FOUND", "Candidate not found.");

    const exclusion = { _id: { $ne: candidateId }, organizationId };

    // Email-based dedup (exact, fast index lookup).
    const byEmail = candidate.email
      ? await Candidate.find({ ...exclusion, email: candidate.email }).lean()
      : [];

    // Name-based dedup (case-insensitive regex, org-scoped — never loads all candidates).
    const byName = candidate.fullName
      ? await Candidate.find({
          ...exclusion,
          fullName: { $regex: `^${candidate.fullName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" },
        }).lean()
      : [];

    const seen = new Set();
    return [...byEmail, ...byName].filter((c) => (seen.has(String(c._id)) ? false : seen.add(String(c._id))));
  },

  async moveStage(organizationId, candidateId, { jobId, stage, movedBy }) {
    if (!jobId) throw new ApiError(400, "VALIDATION_ERROR", "jobId is required to move a pipeline stage.");
    const stageDoc = await PipelineStage.findOneAndUpdate(
      { organizationId, jobId, candidateId },
      { stage, movedBy, movedAt: new Date() },
      { upsert: true, new: true }
    );
    // #14: scope by organizationId to prevent cross-tenant timeline writes.
    await Candidate.updateOne(
      { _id: candidateId, organizationId },
      { $push: { timeline: { type: "stage_change", description: `Moved to ${stage}`, date: new Date() } } }
    );
    return stageDoc;
  },

  async questions(organizationId, candidateId, jobId) {
    const existing = await InterviewQuestion.find({ organizationId, candidateId, jobId }).lean();
    if (existing.length > 0) return existing;

    const [candidate, job] = await Promise.all([
      Candidate.findOne({ _id: candidateId, organizationId }).lean(),
      Job.findOne({ _id: jobId, organizationId }).lean(),
    ]);
    if (!candidate || !job) return [];

    const generated = await aiServiceClient.generateInterviewQuestions({ candidate, job });
    const questions = generated.length > 0 ? generated : templateQuestions(candidate, job);

    const docs = await InterviewQuestion.insertMany(
      questions.map((q) => ({ organizationId, candidateId, jobId, question: q.question, category: q.category }))
    );
    return docs;
  },
};

function templateQuestions(candidate, job) {
  const topSkill = candidate.skills?.[0]?.name || job.requiredSkills?.[0]?.name || "this role";
  return [
    { question: `Walk me through a recent project where you used ${topSkill}.`, category: "technical" },
    { question: `How would you approach designing a scalable solution for ${job.title}?`, category: "problem_solving" },
    { question: "Tell me about a time you disagreed with a technical decision. How did you handle it?", category: "behavioral" },
  ];
}
