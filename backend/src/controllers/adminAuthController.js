import { verifySupabaseAccessToken, refreshSupabaseSession } from "../config/supabase.js";
import { adminAuthService } from "../services/adminAuthService.js";
import { issueSessionCookie, issueRefreshCookie, clearAuthCookies } from "../utils/sessionCookies.js";
import { revokeCurrentSession } from "../utils/sessionRevocation.js";
import { ApiError } from "../middleware/errorHandler.js";
import { SuperAdmin } from "../models/SuperAdmin.js";

const REFRESH_PATH = "/api/admin-panel/auth/refresh";

// Super-admin auth. Same Supabase → Express-session pattern as staff/candidate, but gated by the
// SUPER_ADMIN_EMAILS allowlist (adminAuthService), and issues a userType:"super_admin" session.
export const adminAuthController = {
  async createSession(req, res) {
    const { access_token: accessToken, refresh_token: refreshToken } = req.body;
    if (!accessToken) throw new ApiError(400, "VALIDATION_ERROR", "access_token is required.");
    const decoded = await verifySupabaseAccessToken(accessToken).catch(() => {
      throw new ApiError(401, "INVALID_TOKEN", "Could not verify session.");
    });

    const admin = await adminAuthService.findOrCreateSuperAdmin({
      supabaseUserId: decoded.sub,
      email: decoded.email,
      fullName: decoded.user_metadata?.full_name,
    });

    // Password step passed. If MFA is on, don't issue a session yet — require a TOTP code.
    if (admin.mfaEnabled) {
      return res.json({ success: true, data: { mfaRequired: true } });
    }

    admin.lastLoginAt = new Date();
    await admin.save();
    issueSessionCookie(res, { userType: "super_admin", superAdminId: admin._id });
    if (refreshToken) issueRefreshCookie(res, refreshToken, REFRESH_PATH);
    res.json({ success: true, data: { admin: adminAuthService.toPublic(admin) } });
  },

  // Second login step for MFA-enabled admins: re-verify Supabase + allowlist, then the TOTP code.
  async mfaLogin(req, res) {
    const { access_token: accessToken, refresh_token: refreshToken, code } = req.body;
    if (!accessToken) throw new ApiError(400, "VALIDATION_ERROR", "access_token is required.");
    const decoded = await verifySupabaseAccessToken(accessToken).catch(() => {
      throw new ApiError(401, "INVALID_TOKEN", "Could not verify session.");
    });
    const admin = await adminAuthService.findOrCreateSuperAdmin({ supabaseUserId: decoded.sub, email: decoded.email });

    if (admin.mfaEnabled && !adminAuthService.verifyMfaCode(admin, code)) {
      throw new ApiError(401, "INVALID_CODE", "Invalid authentication code.");
    }

    admin.lastLoginAt = new Date();
    await admin.save();
    issueSessionCookie(res, { userType: "super_admin", superAdminId: admin._id });
    if (refreshToken) issueRefreshCookie(res, refreshToken, REFRESH_PATH);
    res.json({ success: true, data: { admin: adminAuthService.toPublic(admin) } });
  },

  // --- MFA enrollment (authenticated) ---
  async mfaSetup(req, res) {
    const data = await adminAuthService.setupMfa(req.session.superAdminId);
    res.json({ success: true, data });
  },
  async mfaEnable(req, res) {
    const data = await adminAuthService.enableMfa(req.session.superAdminId, req.body.code);
    res.json({ success: true, data });
  },
  async mfaDisable(req, res) {
    const data = await adminAuthService.disableMfa(req.session.superAdminId, req.body.code);
    res.json({ success: true, data });
  },

  async logout(req, res) {
    await revokeCurrentSession(req);
    clearAuthCookies(res, REFRESH_PATH);
    res.json({ success: true, data: {} });
  },

  async me(req, res) {
    const admin = await SuperAdmin.findById(req.session.superAdminId).lean();
    if (!admin) throw new ApiError(404, "NOT_FOUND", "Admin not found.");
    res.json({ success: true, data: adminAuthService.toPublic(admin) });
  },

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
    // Re-check the allowlist on every refresh so revoking access takes effect promptly.
    const admin = await adminAuthService.findOrCreateSuperAdmin({ supabaseUserId: decoded.sub, email: decoded.email });
    issueSessionCookie(res, { userType: "super_admin", superAdminId: admin._id });
    if (refreshed.refresh_token) issueRefreshCookie(res, refreshed.refresh_token, REFRESH_PATH);
    res.json({ success: true, data: { admin: adminAuthService.toPublic(admin) } });
  },
};
