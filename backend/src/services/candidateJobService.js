import { Job } from "../models/Job.js";
import { ApiError } from "../middleware/errorHandler.js";

// Fields safe to expose to a candidate — deliberately excludes scoringWeights, createdBy, and
// jdEmbeddingRef (recruiter-internal). docs/13 §4.5, §7.
const PUBLIC_FIELDS =
  "title department description requiredSkills niceToHaveSkills experienceMin experienceMax " +
  "location employmentType workMode experienceLevel salaryRange publishedAt organizationId createdAt";

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function publicView(job) {
  const org = job.organizationId; // populated { _id, name } or a raw id
  const salaryVisible = job.salaryRange?.visible;
  return {
    ...job,
    organizationId: undefined,
    company: org && typeof org === "object" ? { id: org._id, name: org.name } : undefined,
    // Hide pay unless the recruiter marked it visible.
    salaryRange: salaryVisible
      ? { min: job.salaryRange.min, max: job.salaryRange.max, currency: job.salaryRange.currency }
      : null,
  };
}

// Only public + open jobs are ever discoverable through the candidate portal.
const DISCOVERABLE = { isPublic: true, status: "open" };

export const candidateJobService = {
  async list({ search, location, employmentType, workMode, experienceLevel, page = 1, pageSize = 20 } = {}) {
    const filter = { ...DISCOVERABLE };
    if (search) {
      const safe = escapeRegex(search);
      filter.$or = [{ title: { $regex: safe, $options: "i" } }, { description: { $regex: safe, $options: "i" } }];
    }
    if (location) filter.location = { $regex: escapeRegex(location), $options: "i" };
    if (employmentType) filter.employmentType = employmentType;
    if (workMode) filter.workMode = workMode;
    if (experienceLevel) filter.experienceLevel = experienceLevel;

    const [items, total] = await Promise.all([
      Job.find(filter, PUBLIC_FIELDS)
        .populate("organizationId", "name")
        .sort({ publishedAt: -1, createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(Number(pageSize))
        .lean(),
      Job.countDocuments(filter),
    ]);
    return { items: items.map(publicView), total };
  },

  async get(jobId) {
    const job = await Job.findOne({ _id: jobId, ...DISCOVERABLE }, PUBLIC_FIELDS)
      .populate("organizationId", "name")
      .lean();
    if (!job) throw new ApiError(404, "JOB_NOT_FOUND", "Job not found or no longer open.");
    return publicView(job);
  },
};
