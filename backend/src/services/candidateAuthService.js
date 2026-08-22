import { CandidateAccount } from "../models/CandidateAccount.js";
import { ApiError } from "../middleware/errorHandler.js";

// Candidate-side counterpart to authService. Resolves a verified Supabase identity to a GLOBAL
// CandidateAccount (no org) — docs/13-candidate-admin-enhancement-spec.md §1.2, §3.1.
export const candidateAuthService = {
  async findOrCreateCandidateAccount({ supabaseUserId, email, fullName }) {
    const existing = await CandidateAccount.findOne({ supabaseUserId });
    if (existing) return existing;
    if (!email) throw new ApiError(400, "VALIDATION_ERROR", "email is required to create an account.");

    // Upsert on the unique supabaseUserId so two concurrent signups can't create duplicates
    // (mirrors authService.findOrCreateUser).
    return CandidateAccount.findOneAndUpdate(
      { supabaseUserId },
      {
        $setOnInsert: {
          supabaseUserId,
          email: email.toLowerCase().trim(),
          fullName: fullName?.trim() || email.split("@")[0],
        },
      },
      { upsert: true, new: true }
    );
  },

  async getCandidateAccount(supabaseUserId) {
    const account = await CandidateAccount.findOne({ supabaseUserId });
    if (!account) throw new ApiError(404, "ACCOUNT_NOT_FOUND", "No candidate account found for this session.");
    return account;
  },

  // Only ever return non-sensitive identity fields to the client.
  toPublicCandidate(account) {
    return {
      id: account._id,
      fullName: account.fullName,
      email: account.email,
      avatarUrl: account.avatarUrl,
      headline: account.headline,
      emailVerifiedAt: account.emailVerifiedAt,
    };
  },
};
