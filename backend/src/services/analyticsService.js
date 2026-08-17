import mongoose from "mongoose";
import { Job } from "../models/Job.js";
import { Resume } from "../models/Resume.js";
import { PipelineStage } from "../models/PipelineStage.js";
import { MatchScore } from "../models/MatchScore.js";
import { Interview } from "../models/Interview.js";
import { Candidate } from "../models/Candidate.js";

const STAGES = ["applied", "screened", "shortlisted", "interviewing", "offer", "hired"];

export const analyticsService = {
  async dashboard(organizationId) {
    // #6 / #18: cast organizationId to ObjectId for aggregation $match — a plain string
    // won't match ObjectId fields in MongoDB aggregation pipelines, causing silent zero results.
    const orgObjectId = new mongoose.Types.ObjectId(organizationId);

    const [applications, shortlisted, interviews, avgScoreAgg, funnelCounts, matchScores] = await Promise.all([
      Resume.countDocuments({ organizationId }),
      PipelineStage.countDocuments({ organizationId, stage: "shortlisted" }),
      Interview.countDocuments({ organizationId }),
      MatchScore.aggregate([
        { $match: { organizationId: orgObjectId } },
        { $group: { _id: null, avg: { $avg: "$overallScore" } } },
      ]),
      Promise.all(STAGES.map((stage) => PipelineStage.countDocuments({ organizationId, stage }))),
      MatchScore.find({ organizationId }).select("overallScore").lean(),
    ]);

    const funnel = STAGES.map((stage, i) => ({ stage, count: funnelCounts[i] }));

    const buckets = [
      { scoreRange: "0-40", min: 0, max: 40 },
      { scoreRange: "41-60", min: 41, max: 60 },
      { scoreRange: "61-80", min: 61, max: 80 },
      { scoreRange: "81-100", min: 81, max: 100 },
    ];
    const matchDistribution = buckets.map((b) => ({
      scoreRange: b.scoreRange,
      count: matchScores.filter((s) => s.overallScore >= b.min && s.overallScore <= b.max).length,
    }));

    // #18: cast organizationId for Candidate aggregation pipeline too.
    const sourceCounts = await Candidate.aggregate([
      { $match: { organizationId: orgObjectId } },
      { $group: { _id: "$sourceType", count: { $sum: 1 } } },
    ]);
    const topSources = sourceCounts.map((s) => ({ source: s._id || "unknown", yield: s.count }));

    return {
      applications,
      shortlisted,
      interviews,
      offers: funnelCounts[4] ?? 0,
      avgMatchScore: Math.round(avgScoreAgg[0]?.avg ?? 0),
      // #28: these KPIs require dedicated tracking that isn't wired yet.
      // Return null instead of hardcoded placeholder values so the UI can show "N/A".
      timeToScreen: null,
      timeToHire: null,
      offerAcceptanceRate: null,
      interviewConversion: null,
      funnel,
      matchDistribution,
      topSources,
      recentActivity: [],
    };
  },

  // #15: use the stage history (PipelineStage.movedAt where stage === "hired") as the hire
  // date rather than job.updatedAt, which changes whenever any field is edited. Falls back
  // to job.updatedAt only when no "hired" stage record exists (legacy data).
  async timeToHire(organizationId) {
    const jobs = await Job.find({ organizationId, status: "closed" }).select("title createdAt updatedAt _id").lean();

    // Fetch all "hired" pipeline stage records for these jobs in one query.
    const jobIds = jobs.map((j) => j._id);
    const hiredStages = await PipelineStage.find({ organizationId, jobId: { $in: jobIds }, stage: "hired" })
      .select("jobId movedAt")
      .lean();
    const hireTimeByJob = new Map(hiredStages.map((s) => [String(s.jobId), s.movedAt]));

    return jobs.map((j) => {
      const hireDate = hireTimeByJob.get(String(j._id)) || j.updatedAt;
      return {
        job: j.title,
        days: Math.round((new Date(hireDate) - new Date(j.createdAt)) / (1000 * 60 * 60 * 24)),
      };
    });
  },

  async skillDemand(organizationId) {
    // #18: cast to ObjectId for aggregation pipeline.
    const orgObjectId = new mongoose.Types.ObjectId(organizationId);
    const jobs = await Job.aggregate([
      { $match: { organizationId: orgObjectId, status: "open" } },
      { $unwind: "$requiredSkills" },
      { $group: { _id: "$requiredSkills.name", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    return jobs.map((j) => ({ skill: j._id, count: j.count }));
  },
};
