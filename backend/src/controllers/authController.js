import { verifySupabaseAccessToken, refreshSupabaseSession } from "../config/supabase.js";
import { authService } from "../services/authService.js";
import { issueSessionCookie, issueRefreshCookie, clearAuthCookies } from "../utils/sessionCookies.js";
import { revokeCurrentSession } from "../utils/sessionRevocation.js";
import { ApiError } from "../middleware/errorHandler.js";
import { User } from "../models/User.js";

export const authController = {
  // Called right after supabase.auth.signInWithPassword() on the client —
  // docs/04-auth-security.md §2, steps 3-6.
  async createSession(req, res) {
    const { access_token: accessToken, refresh_token: refreshToken } = req.body;
    if (!accessToken) throw new ApiError(400, "VALIDATION_ERROR", "access_token is required.");

    const decoded = await verifySupabaseAccessToken(accessToken).catch(() => {
      throw new ApiError(401, "INVALID_TOKEN", "Could not verify Supabase session.");
    });

    const user = await authService.getMongoUser(decoded.sub);
    user.lastLoginAt = new Date();
    await user.save();

    issueSessionCookie(res, { userType: "staff", userId: user._id, organizationId: user.organizationId, role: user.role });
    if (refreshToken) issueRefreshCookie(res, refreshToken);

    res.json({ success: true, data: { user: authService.toPublicUser(user) } });
  },

  async signup(req, res) {
    const { access_token: accessToken, fullName, organizationName, inviteToken } = req.body;
    if (!accessToken) throw new ApiError(400, "VALIDATION_ERROR", "access_token is required.");

    const decoded = await verifySupabaseAccessToken(accessToken).catch(() => {
      throw new ApiError(401, "INVALID_TOKEN", "Could not verify Supabase session.");
    });

    const user = await authService.findOrCreateUser({
      supabaseUserId: decoded.sub,
      email: decoded.email,
      fullName,
      organizationName,
      inviteToken,
    });

    issueSessionCookie(res, { userType: "staff", userId: user._id, organizationId: user.organizationId, role: user.role });
    res.status(201).json({ success: true, data: { user: authService.toPublicUser(user) } });
  },

  async logout(req, res) {
    await revokeCurrentSession(req); // denylist this token + drop sockets, server-side
    clearAuthCookies(res);
    res.json({ success: true, data: {} });
  },

  async me(req, res) {
    const user = await User.findById(req.session.userId).lean();
    if (!user) throw new ApiError(404, "USER_NOT_FOUND", "User not found.");
    res.json({ success: true, data: authService.toPublicUser(user) });
  },

  // Refresh flow: uses the itap_refresh cookie's Supabase refresh token to mint a fresh
  // Supabase access token, re-verify it, and re-issue itap_session — docs/04 §2, step 7.
  // This runs entirely server-side, so the SPA's axios interceptor can silently recover from
  // an expired session cookie by POSTing here and retrying the original request.
  async refresh(req, res) {
    const refreshToken = req.cookies?.itap_refresh;
    if (!refreshToken) throw new ApiError(401, "NO_REFRESH_TOKEN", "No refresh token present.");

    const refreshed = await refreshSupabaseSession(refreshToken).catch(() => null);
    if (!refreshed?.access_token) {
      clearAuthCookies(res); // stale/invalid refresh token — force a fresh login
      throw new ApiError(401, "REFRESH_FAILED", "Could not refresh session. Please sign in again.");
    }

    const decoded = await verifySupabaseAccessToken(refreshed.access_token).catch(() => null);
    if (!decoded) {
      clearAuthCookies(res);
      throw new ApiError(401, "INVALID_TOKEN", "Refreshed token could not be verified.");
    }

    const user = await authService.getMongoUser(decoded.sub);
    issueSessionCookie(res, { userType: "staff", userId: user._id, organizationId: user.organizationId, role: user.role });
    // Supabase rotates refresh tokens on each use — persist the new one so the next refresh works.
    if (refreshed.refresh_token) issueRefreshCookie(res, refreshed.refresh_token);

    res.json({ success: true, data: { user: authService.toPublicUser(user) } });
  },
};
