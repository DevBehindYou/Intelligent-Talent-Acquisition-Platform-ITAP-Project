import { CandidateAccount } from "../models/CandidateAccount.js";
import { ApiError } from "../middleware/errorHandler.js";

// Whitelist of self-editable fields. Excludes identity/account-state (supabaseUserId, email,
// isActive, suspendedAt, emailVerifiedAt) so a candidate can't tamper with them via the profile
// endpoint — docs/13 §3.3, §7 ("never trust client-supplied fields").
const EDITABLE = [
  "fullName",
  "phone",
  "avatarUrl",
  "headline",
  "location",
  "summary",
  "skills",
  "experience",
  "education",
  "certifications",
  "projects",
  "languages",
  "links",
  "preferences",
];

// Sections used to compute the dashboard's profile-completion %.
const COMPLETION_SECTIONS = [
  (a) => Boolean(a.fullName && a.headline && a.location),
  (a) => Boolean(a.summary),
  (a) => (a.skills?.length ?? 0) > 0,
  (a) => (a.experience?.length ?? 0) > 0,
  (a) => (a.education?.length ?? 0) > 0,
  (a) => Boolean(a.links?.linkedin || a.links?.github || a.links?.portfolio),
  (a) => (a.preferences?.roles?.length ?? 0) > 0,
];

function completionPct(account) {
  const done = COMPLETION_SECTIONS.filter((f) => f(account)).length;
  return Math.round((done / COMPLETION_SECTIONS.length) * 100);
}

function present(account) {
  // Strip internal fields; keep everything the owner legitimately sees about themselves.
  // eslint-disable-next-line no-unused-vars
  const { supabaseUserId, __v, ...rest } = account;
  return { ...rest, profileCompletionPct: completionPct(account) };
}

export const candidateProfileService = {
  async get(candidateAccountId) {
    const account = await CandidateAccount.findById(candidateAccountId).lean();
    if (!account) throw new ApiError(404, "ACCOUNT_NOT_FOUND", "Account not found.");
    return present(account);
  },

  async update(candidateAccountId, payload) {
    const update = {};
    for (const key of EDITABLE) if (key in payload) update[key] = payload[key];

    const account = await CandidateAccount.findByIdAndUpdate(
      candidateAccountId,
      { $set: update },
      { new: true, runValidators: true }
    ).lean();
    if (!account) throw new ApiError(404, "ACCOUNT_NOT_FOUND", "Account not found.");
    return present(account);
  },
};
