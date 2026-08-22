import { verifySupabaseAccessToken, refreshSupabaseSession } from "../config/supabase.js";
import { candidateAuthService } from "../services/candidateAuthService.js";
import { issueSessionCookie, issueRefreshCookie, clearAuthCookies } from "../utils/sessionCookies.js";
import { revokeCurrentSession } from "../utils/sessionRevocation.js";
import { ApiError } from "../middleware/errorHandler.js";
import { CandidateAccount } from "../models/CandidateAccount.js";

// Candidate refresh cookie is scoped to this path so it never collides with the staff one.
const REFRESH_PATH = "/api/candidate/auth/refresh";

// Mirrors authController but issues a userType:"candidate" session carrying candidateAccountId
// (no org, no role). The candidate SPA calls supabase.auth.signIn/signUp then posts the access
// token here, exactly like the staff flow (docs/04-auth-security.md §2 / docs/13 §3.1).
export const candidateAuthController = {
  async createSession(req, res) {
    const { access_token: accessToken, refresh_token: refreshToken } = req.body;
    if (!accessToken) throw new ApiError(400, "VALIDATION_ERROR", "access_token is required.");

    const decoded = await verifySupabaseAccessToken(accessToken).catch(() => {
      throw new ApiError(401, "INVALID_TOKEN", "Could not verify Supabase session.");
    });

    const account = await candidateAuthService.getCandidateAccount(decoded.sub);
    account.lastLoginAt = new Date();
    if (!account.emailVerifiedAt && (decoded.email_confirmed_at || decoded.user_metadata?.email_verified)) {
      account.emailVerifiedAt = new Date();
    }
    await account.save();

    issueSessionCookie(res, { userType: "candidate", candidateAccountId: account._id });
    if (refreshToken) issueRefreshCookie(res, refreshToken, REFRESH_PATH);
    res.json({ success: true, data: { candidate: candidateAuthService.toPublicCandidate(account) } });
  },

  async signup(req, res) {
    const { access_token: accessToken, fullName } = req.body;
    if (!accessToken) throw new ApiError(400, "VALIDATION_ERROR", "access_token is required.");

    const decoded = await verifySupabaseAccessToken(accessToken).catch(() => {
      throw new ApiError(401, "INVALID_TOKEN", "Could not verify Supabase session.");
    });

    const account = await candidateAuthService.findOrCreateCandidateAccount({
      supabaseUserId: decoded.sub,
      email: decoded.email,
      fullName,
    });

    issueSessionCookie(res, { userType: "candidate", candidateAccountId: account._id });
    res.status(201).json({ success: true, data: { candidate: candidateAuthService.toPublicCandidate(account) } });
  },

  async logout(req, res) {
    await revokeCurrentSession(req);
    clearAuthCookies(res, REFRESH_PATH);
    res.json({ success: true, data: {} });
  },

  async me(req, res) {
    const account = await CandidateAccount.findById(req.session.candidateAccountId).lean();
    if (!account) throw new ApiError(404, "ACCOUNT_NOT_FOUND", "Account not found.");
    res.json({ success: true, data: candidateAuthService.toPublicCandidate(account) });
  },

  // Server-side silent refresh, identical in shape to the staff flow (docs/04 §2, step 7).
  async refresh(req, res) {
    const refreshToken = req.cookies?.itap_refresh;
    if (!refreshToken) throw new ApiError(401, "NO_REFRESH_TOKEN", "No refresh token present.");

    const refreshed = await refreshSupabaseSession(refreshToken).catch(() => null);
    if (!refreshed?.access_token) {
      clearAuthCookies(res, REFRESH_PATH);
      throw new ApiError(401, "REFRESH_FAILED", "Could not refresh session. Please sign in again.");
    }

    const decoded = await verifySupabaseAccessToken(refreshed.access_token).catch(() => null);
    if (!decoded) {
      clearAuthCookies(res, REFRESH_PATH);
      throw new ApiError(401, "INVALID_TOKEN", "Refreshed token could not be verified.");
    }

    const account = await candidateAuthService.getCandidateAccount(decoded.sub);
    issueSessionCookie(res, { userType: "candidate", candidateAccountId: account._id });
    if (refreshed.refresh_token) issueRefreshCookie(res, refreshed.refresh_token, REFRESH_PATH);
    res.json({ success: true, data: { candidate: candidateAuthService.toPublicCandidate(account) } });
  },
};
