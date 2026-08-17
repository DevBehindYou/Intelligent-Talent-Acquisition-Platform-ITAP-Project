import { jobService } from "../services/jobService.js";
import { matchingService } from "../services/matchingService.js";
import { MatchScore } from "../models/MatchScore.js";
import { ApiError } from "../middleware/errorHandler.js";

export const jobsController = {
  async list(req, res) {
    const data = await jobService.list(req.session.organizationId, req.query);
    res.json({ success: true, data });
  },

  async get(req, res) {
    const job = await jobService.get(req.session.organizationId, req.params.jobId);
    res.json({ success: true, data: job });
  },

  async create(req, res) {
    const job = await jobService.create(req.session.organizationId, req.session.userId, req.body);
    res.status(201).json({ success: true, data: job });
  },

  async update(req, res) {
    const job = await jobService.update(req.session.organizationId, req.params.jobId, req.body);
    res.json({ success: true, data: job });
  },

  async archive(req, res) {
    await jobService.archive(req.session.organizationId, req.params.jobId);
    res.json({ success: true, data: {} });
  },

  async pipeline(req, res) {
    const items = await jobService.pipeline(req.session.organizationId, req.params.jobId);
    res.json({ success: true, data: { items } });
  },

  async rankings(req, res) {
    const { sortBy = "overallScore", order = "desc" } = req.query;
    const items = await MatchScore.find({ organizationId: req.session.organizationId, jobId: req.params.jobId })
      .sort({ [sortBy]: order === "desc" ? -1 : 1 })
      .populate("candidateId", "fullName currentTitle email")
      .lean();

    const shaped = items
      .filter((i) => i.candidateId)
      .map((i) => ({
        candidateId: i.candidateId._id,
        fullName: i.candidateId.fullName,
        currentTitle: i.candidateId.currentTitle,
        overallScore: i.overallScore,
        skillScore: i.skillScore,
        experienceScore: i.experienceScore,
        educationScore: i.educationScore,
        domainScore: i.domainScore,
        reasonTags: i.reasonTags,
        reasonSummary: i.reasonSummary,
        appliedAt: i.createdAt,
      }));

    res.json({ success: true, data: { items: shaped, total: shaped.length } });
  },

  async rankingExplanation(req, res) {
    const score = await MatchScore.findOne({
      organizationId: req.session.organizationId,
      jobId: req.params.jobId,
      candidateId: req.params.candidateId,
    }).lean();
    // #13: return 404 instead of { data: null } so the frontend can handle it correctly.
    if (!score) throw new ApiError(404, "SCORE_NOT_FOUND", "No ranking score found for this candidate and job.");
    res.json({ success: true, data: score });
  },

  async updateScoringWeights(req, res) {
    const { skillsWeight, experienceWeight, educationWeight, domainWeight } = req.body;
    // #16: reject weight sets that don’t sum to 1.0 (±0.01 tolerance for floating-point rounding).
    const sum = (skillsWeight ?? 0) + (experienceWeight ?? 0) + (educationWeight ?? 0) + (domainWeight ?? 0);
    if (Math.abs(sum - 1.0) > 0.01) {
      throw new ApiError(
        400,
        "VALIDATION_ERROR",
        `Scoring weights must sum to 1.0 (got ${sum.toFixed(3)}). Adjust the values and try again.`
      );
    }
    const job = await jobService.update(req.session.organizationId, req.params.jobId, { scoringWeights: req.body });
    // #3: pass organizationId so recomputeAllForJob can scope its Job lookup.
    matchingService.recomputeAllForJob(job._id, req.session.organizationId).catch(() => {}); // fire-and-forget re-score
    res.json({ success: true, data: job });
  },
};
