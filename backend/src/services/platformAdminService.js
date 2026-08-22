import { CandidateAccount } from "../models/CandidateAccount.js";
import { Application } from "../models/Application.js";
import { Job } from "../models/Job.js";
import { Organization } from "../models/Organization.js";
import { User } from "../models/User.js";
import { Interview } from "../models/Interview.js";
import { Offer } from "../models/Offer.js";
import { OnboardingCase } from "../models/OnboardingCase.js";

const toMap = (agg) => Object.fromEntries(agg.map((a) => [a._id, a.count]));

// Platform-wide (cross-tenant) metrics for the super-admin dashboard (docs/13 §15). Deliberately
// NOT org-scoped — a super-admin sees the whole platform. Every count is a single indexed query
// or a small aggregation, all issued in parallel.
export const platformAdminService = {
  async dashboard() {
    const since30 = new Date(Date.now() - 30 * 86400000);
    const [
      totalCandidates,
      newCandidates,
      activeCandidates,
      totalApplications,
      applicationsByStatus,
      totalJobs,
      openJobs,
      totalOrgs,
      totalRecruiters,
      recruitersByRole,
      totalInterviews,
      totalOffers,
      acceptedOffers,
      totalOnboarding,
      completedOnboarding,
    ] = await Promise.all([
      CandidateAccount.countDocuments({}),
      CandidateAccount.countDocuments({ createdAt: { $gte: since30 } }),
      CandidateAccount.countDocuments({ isActive: true }),
      Application.countDocuments({}),
      Application.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      Job.countDocuments({}),
      Job.countDocuments({ status: "open" }),
      Organization.countDocuments({}),
      User.countDocuments({}),
      User.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]),
      Interview.countDocuments({}),
      Offer.countDocuments({ status: { $ne: "draft" } }),
      Offer.countDocuments({ status: "accepted" }),
      OnboardingCase.countDocuments({}),
      OnboardingCase.countDocuments({ status: "completed" }),
    ]);

    const byStatus = toMap(applicationsByStatus);
    const hires = byStatus.hired || 0;

    return {
      candidates: { total: totalCandidates, new30d: newCandidates, active: activeCandidates },
      recruiters: { total: totalRecruiters, byRole: toMap(recruitersByRole) },
      recruitment: {
        totalJobs,
        openJobs,
        totalApplications,
        applicationsByStatus: byStatus,
        interviews: totalInterviews,
        offers: totalOffers,
        acceptedOffers,
        hires,
        conversionRate: totalApplications ? Math.round((hires / totalApplications) * 100) : 0,
      },
      organizations: totalOrgs,
      onboarding: { total: totalOnboarding, completed: completedOnboarding },
    };
  },
};
