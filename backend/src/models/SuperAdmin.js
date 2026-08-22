import mongoose from "mongoose";

/**
 * A platform super-administrator — GLOBAL, no organizationId (docs/13 §6). Deliberately NOT
 * self-service: an account is only ever created for a Supabase identity whose email is in the
 * SUPER_ADMIN_EMAILS allowlist (see adminAuthService), so the /admin-panel surface can't be
 * joined by signing up.
 */
const superAdminSchema = new mongoose.Schema(
  {
    supabaseUserId: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    fullName: String,
    isActive: { type: Boolean, default: true },
    mfaEnabled: { type: Boolean, default: false }, // TOTP architecture placeholder (Phase 4c)
    mfaSecret: String, // encrypted TOTP secret (set when MFA is enrolled)
    lastLoginAt: Date,
  },
  { timestamps: true }
);

export const SuperAdmin = mongoose.model("SuperAdmin", superAdminSchema);
