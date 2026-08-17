import { Job } from "../models/Job.js";
import { MatchScore } from "../models/MatchScore.js";
import { Resume } from "../models/Resume.js";
import { PipelineStage } from "../models/PipelineStage.js";
import { ApiError } from "../middleware/errorHandler.js";

// Every method here takes organizationId explicitly and scopes every query with it —
// docs/02-database-schema.md §5 ("no service method may accept a raw id from the client
// without also scoping by the authenticated user's organizationId").
export const jobService = {
  async list(organizationId, { status, search, page = 1, pageSize = 20 }) {
    const filter = { organizationId };
    if (status) filter.status = status;
    // #26: escape user-supplied search to prevent ReDoS via pathological regex patterns.
    if (search) filter.title = { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };

    const [items, total] = await Promise.all([
      Job.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(Number(pageSize))
        .lean(),
      Job.countDocuments(filter),
    ]);

    // #8: replace N+1 per-job countDocuments with a single aggregation over all job IDs
    // on this page — reduces queries from 2*pageSize to 2 regardless of page size.
    const jobIds = items.map((j) => j._id);
    const [resumeCounts, scoreCounts] = await Promise.all([
      Resume.aggregate([
        { $match: { jobId: { $in: jobIds } } },
        { $group: { _id: "$jobId", count: { $sum: 1 } } },
      ]),
      MatchScore.aggregate([
        { $match: { jobId: { $in: jobIds } } },
        { $group: { _id: "$jobId", count: { $sum: 1 } } },
      ]),
    ]);

    const resumeCountMap = new Map(resumeCounts.map((r) => [String(r._id), r.count]));
    const scoreCountMap = new Map(scoreCounts.map((s) => [String(s._id), s.count]));

    const withStats = items.map((job) => ({
      ...job,
      totalApplicants: resumeCountMap.get(String(job._id)) ?? 0,
      rankedCount: scoreCountMap.get(String(job._id)) ?? 0,
    }));

    return { items: withStats, total };
  },

  async get(organizationId, jobId) {
    const job = await Job.findOne({ _id: jobId, organizationId }).lean();
    if (!job) throw new ApiError(404, "JOB_NOT_FOUND", "Job not found.");
    return job;
  },

  async create(organizationId, createdBy, payload) {
    return Job.create({ ...payload, organizationId, createdBy });
  },

  async update(organizationId, jobId, payload) {
    const job = await Job.findOneAndUpdate({ _id: jobId, organizationId }, payload, { new: true });
    if (!job) throw new ApiError(404, "JOB_NOT_FOUND", "Job not found.");
    return job;
  },

  async archive(organizationId, jobId) {
    const job = await Job.findOneAndUpdate({ _id: jobId, organizationId }, { status: "closed" });
    if (!job) throw new ApiError(404, "JOB_NOT_FOUND", "Job not found.");
  },

  async pipeline(organizationId, jobId) {
    const stages = await PipelineStage.find({ organizationId, jobId }).populate("candidateId").lean();
    const scores = await MatchScore.find({ organizationId, jobId }).lean();
    const scoreByCandidate = new Map(scores.map((s) => [String(s.candidateId), s]));

    return stages
      .filter((s) => s.candidateId)
      .map((s) => {
        const score = scoreByCandidate.get(String(s.candidateId._id));
        return {
          candidateId: s.candidateId._id,
          fullName: s.candidateId.fullName,
          currentTitle: s.candidateId.currentTitle,
          stage: s.stage,
          overallScore: score?.overallScore ?? 0,
          reasonSummary: score?.reasonSummary,
        };
      });
  },
};
