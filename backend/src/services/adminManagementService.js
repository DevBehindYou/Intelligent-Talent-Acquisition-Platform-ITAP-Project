import { CandidateAccount } from "../models/CandidateAccount.js";
import { Application } from "../models/Application.js";
import { Organization } from "../models/Organization.js";
import { User } from "../models/User.js";
import { Job } from "../models/Job.js";
import { CandidateDocument } from "../models/CandidateDocument.js";
import { AuditLog } from "../models/AuditLog.js";
import { storageService } from "./storageService.js";
import { ApiError } from "../middleware/errorHandler.js";

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Every super-admin write is audited. actorUserId holds the SuperAdmin id (an ObjectId), and
// metadata.actorType marks it as a platform action (docs/13 §20).
async function audit(admin, action, targetType, targetId, metadata = {}, organizationId) {
  await AuditLog.create({
    organizationId,
    actorUserId: admin?.superAdminId,
    action,
    targetType,
    targetId,
    metadata: { actorType: "super_admin", ...metadata },
  });
}

export const adminManagementService = {
  // ---- Candidates ----
  async listCandidates({ search, status, page = 1, pageSize = 20 } = {}) {
    const filter = {};
    if (search) {
      const s = escapeRegex(search);
      filter.$or = [{ email: { $regex: s, $options: "i" } }, { fullName: { $regex: s, $options: "i" } }];
    }
    if (status === "active") filter.isActive = true;
    if (status === "suspended") filter.isActive = false;

    const [items, total] = await Promise.all([
      CandidateAccount.find(filter, "email fullName isActive suspendedAt anonymizedAt createdAt lastLoginAt")
        .sort({ createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(Number(pageSize))
        .lean(),
      CandidateAccount.countDocuments(filter),
    ]);
    return { items, total };
  },

  async getCandidate(candidateAccountId) {
    const candidate = await CandidateAccount.findById(candidateAccountId).lean();
    if (!candidate) throw new ApiError(404, "CANDIDATE_NOT_FOUND", "Candidate not found.");
    const applications = await Application.find({ candidateAccountId })
      .populate("jobId", "title")
      .populate("organizationId", "name")
      .sort({ createdAt: -1 })
      .lean();
    // eslint-disable-next-line no-unused-vars
    const { supabaseUserId, __v, ...safe } = candidate;
    return {
      ...safe,
      applications: applications.map((a) => ({
        id: a._id,
        job: a.jobId?.title,
        organization: a.organizationId?.name,
        status: a.status,
        submittedAt: a.submittedAt,
      })),
    };
  },

  async setCandidateSuspended(admin, candidateAccountId, suspended) {
    const update = suspended ? { isActive: false, suspendedAt: new Date() } : { isActive: true, suspendedAt: null };
    const candidate = await CandidateAccount.findByIdAndUpdate(candidateAccountId, update, { new: true });
    if (!candidate) throw new ApiError(404, "CANDIDATE_NOT_FOUND", "Candidate not found.");
    await audit(admin, suspended ? "candidate.suspended" : "candidate.reactivated", "CandidateAccount", candidateAccountId, {
      email: candidate.email,
    });
    return { id: candidate._id, isActive: candidate.isActive };
  },

  // GDPR erasure (soft): strip PII + delete stored documents, but KEEP the record so
  // applications/audit stay referentially intact (docs/13 §16, §19).
  async anonymizeCandidate(admin, candidateAccountId) {
    const candidate = await CandidateAccount.findById(candidateAccountId);
    if (!candidate) throw new ApiError(404, "CANDIDATE_NOT_FOUND", "Candidate not found.");
    if (candidate.anonymizedAt) throw new ApiError(409, "ALREADY_ANONYMIZED", "This candidate is already anonymized.");

    // Delete their private documents (files + records).
    const docs = await CandidateDocument.find({ candidateAccountId }).lean();
    await Promise.all(docs.map((d) => storageService.delete(d.storagePath).catch(() => {})));
    await CandidateDocument.deleteMany({ candidateAccountId });

    candidate.email = `anonymized-${candidate._id}@deleted.invalid`; // keep unique index satisfied
    candidate.fullName = "Deleted candidate";
    candidate.phone = undefined;
    candidate.avatarUrl = undefined;
    candidate.headline = undefined;
    candidate.location = undefined;
    candidate.summary = undefined;
    candidate.skills = [];
    candidate.experience = [];
    candidate.education = [];
    candidate.certifications = [];
    candidate.projects = [];
    candidate.languages = [];
    candidate.links = {};
    candidate.preferences = {};
    candidate.isActive = false;
    candidate.anonymizedAt = new Date();
    await candidate.save();

    await audit(admin, "candidate.anonymized", "CandidateAccount", candidateAccountId, {});
    return { id: candidate._id, anonymizedAt: candidate.anonymizedAt };
  },

  // ---- Organizations ----
  async listOrganizations({ page = 1, pageSize = 20 } = {}) {
    const [orgs, total] = await Promise.all([
      Organization.find({}).sort({ createdAt: -1 }).skip((page - 1) * pageSize).limit(Number(pageSize)).lean(),
      Organization.countDocuments({}),
    ]);
    const ids = orgs.map((o) => o._id);
    const [userCounts, jobCounts] = await Promise.all([
      User.aggregate([{ $match: { organizationId: { $in: ids } } }, { $group: { _id: "$organizationId", c: { $sum: 1 } } }]),
      Job.aggregate([{ $match: { organizationId: { $in: ids } } }, { $group: { _id: "$organizationId", c: { $sum: 1 } } }]),
    ]);
    const uMap = new Map(userCounts.map((x) => [String(x._id), x.c]));
    const jMap = new Map(jobCounts.map((x) => [String(x._id), x.c]));
    return {
      items: orgs.map((o) => ({
        id: o._id,
        name: o.name,
        createdAt: o.createdAt,
        recruiters: uMap.get(String(o._id)) || 0,
        jobs: jMap.get(String(o._id)) || 0,
      })),
      total,
    };
  },

  // ---- Recruiters (org Users) ----
  async listRecruiters({ search, page = 1, pageSize = 20 } = {}) {
    const filter = {};
    if (search) {
      const s = escapeRegex(search);
      filter.$or = [{ email: { $regex: s, $options: "i" } }, { fullName: { $regex: s, $options: "i" } }];
    }
    const [users, total] = await Promise.all([
      User.find(filter, "email fullName role isActive organizationId lastLoginAt")
        .populate("organizationId", "name")
        .sort({ createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(Number(pageSize))
        .lean(),
      User.countDocuments(filter),
    ]);
    return {
      items: users.map((u) => ({
        id: u._id,
        email: u.email,
        fullName: u.fullName,
        role: u.role,
        isActive: u.isActive,
        organization: u.organizationId?.name,
        lastLoginAt: u.lastLoginAt,
      })),
      total,
    };
  },

  async setRecruiterActive(admin, userId, isActive) {
    const user = await User.findByIdAndUpdate(userId, { isActive }, { new: true });
    if (!user) throw new ApiError(404, "USER_NOT_FOUND", "User not found.");
    await audit(
      admin,
      isActive ? "recruiter.activated" : "recruiter.deactivated",
      "User",
      userId,
      { email: user.email },
      user.organizationId
    );
    return { id: user._id, isActive: user.isActive };
  },

  // ---- Applications (cross-tenant) ----
  async listApplications({ status, page = 1, pageSize = 20 } = {}) {
    const filter = {};
    if (status) filter.status = status;
    const [apps, total] = await Promise.all([
      Application.find(filter)
        .populate("jobId", "title")
        .populate("organizationId", "name")
        .populate("candidateAccountId", "email fullName")
        .sort({ createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(Number(pageSize))
        .lean(),
      Application.countDocuments(filter),
    ]);
    return {
      items: apps.map((a) => ({
        id: a._id,
        candidate: a.candidateAccountId?.fullName || a.candidateAccountId?.email,
        job: a.jobId?.title,
        organization: a.organizationId?.name,
        status: a.status,
        submittedAt: a.submittedAt,
      })),
      total,
    };
  },

  // ---- Audit logs ----
  async listAuditLogs({ page = 1, pageSize = 30 } = {}) {
    const [items, total] = await Promise.all([
      AuditLog.find({}).sort({ createdAt: -1 }).skip((page - 1) * pageSize).limit(Number(pageSize)).lean(),
      AuditLog.countDocuments({}),
    ]);
    return { items, total };
  },
};
