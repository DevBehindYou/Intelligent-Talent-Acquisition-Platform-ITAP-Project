import { SuperAdmin } from "../models/SuperAdmin.js";
import { generateMfaSecret, verifyTotp, qrDataUrl } from "../utils/totp.js";
import { ApiError } from "../middleware/errorHandler.js";

// The allowlist of emails permitted to become platform super-admins. Read at call time so it
// can be configured per-environment (and set in tests). Comma-separated, case-insensitive.
export function allowedAdminEmails() {
  return (process.env.SUPER_ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAllowedAdminEmail(email) {
  if (!email) return false;
  return allowedAdminEmails().includes(email.toLowerCase());
}

export const adminAuthService = {
  // Provisions (or fetches) a super-admin ONLY for an allowlisted, verified Supabase identity.
  async findOrCreateSuperAdmin({ supabaseUserId, email, fullName }) {
    if (!isAllowedAdminEmail(email)) {
      throw new ApiError(403, "NOT_AUTHORIZED", "This account is not permitted to access the admin panel.");
    }
    const existing = await SuperAdmin.findOne({ supabaseUserId });
    if (existing) {
      if (!existing.isActive) throw new ApiError(403, "ADMIN_DISABLED", "This admin account is disabled.");
      return existing;
    }
    return SuperAdmin.findOneAndUpdate(
      { supabaseUserId },
      { $setOnInsert: { supabaseUserId, email: email.toLowerCase().trim(), fullName } },
      { upsert: true, new: true }
    );
  },

  async getSuperAdmin(superAdminId) {
    const admin = await SuperAdmin.findById(superAdminId);
    if (!admin || !admin.isActive) throw new ApiError(403, "NOT_AUTHORIZED", "Admin account not found or disabled.");
    return admin;
  },

  toPublic(admin) {
    return { id: admin._id, email: admin.email, fullName: admin.fullName, mfaEnabled: admin.mfaEnabled };
  },

  verifyMfaCode(admin, code) {
    return verifyTotp(admin.mfaSecret, code);
  },

  // Generate + store a pending secret (mfaEnabled stays false until a code is verified). Returns
  // the otpauth URI + QR for authenticator-app enrollment. NOTE: mfaSecret is stored as-is here;
  // encrypt it at rest with an app/KMS key in production (flagged, like other sensitive fields).
  async setupMfa(superAdminId) {
    const admin = await SuperAdmin.findById(superAdminId);
    if (!admin) throw new ApiError(404, "NOT_FOUND", "Admin not found.");
    const { secret, otpauthUrl } = generateMfaSecret(admin.email);
    admin.mfaSecret = secret;
    admin.mfaEnabled = false; // not active until enableMfa verifies a code
    await admin.save();
    return { otpauthUrl, secret, qrDataUrl: await qrDataUrl(otpauthUrl) };
  },

  async enableMfa(superAdminId, code) {
    const admin = await SuperAdmin.findById(superAdminId);
    if (!admin) throw new ApiError(404, "NOT_FOUND", "Admin not found.");
    if (!admin.mfaSecret) throw new ApiError(400, "MFA_NOT_SET_UP", "Start MFA setup first.");
    if (!verifyTotp(admin.mfaSecret, code)) throw new ApiError(401, "INVALID_CODE", "That code is not valid.");
    admin.mfaEnabled = true;
    await admin.save();
    return { mfaEnabled: true };
  },

  async disableMfa(superAdminId, code) {
    const admin = await SuperAdmin.findById(superAdminId);
    if (!admin) throw new ApiError(404, "NOT_FOUND", "Admin not found.");
    if (admin.mfaEnabled && !verifyTotp(admin.mfaSecret, code)) {
      throw new ApiError(401, "INVALID_CODE", "That code is not valid.");
    }
    admin.mfaEnabled = false;
    admin.mfaSecret = undefined;
    await admin.save();
    return { mfaEnabled: false };
  },
};
