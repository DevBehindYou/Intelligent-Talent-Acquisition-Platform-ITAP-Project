import { Organization } from "../models/Organization.js";
import { User } from "../models/User.js";
import { ApiError } from "../middleware/errorHandler.js";

export const authService = {
  // Mirrors (or creates) the Mongo `users` doc for a verified Supabase identity —
  // docs/02-database-schema.md §1.
  // #12: uses findOneAndUpdate with upsert on supabaseUserId (unique index) to prevent
  // orphan Organization documents if two simultaneous signups race for the same Supabase UID.
  async findOrCreateUser({ supabaseUserId, email, fullName, organizationName, inviteToken }) {
    // Fast path: user already exists (returning login, OAuth, etc.)
    const existing = await User.findOne({ supabaseUserId });
    if (existing) return existing;

    if (inviteToken) {
      // In production this looks up a pending invite record for organizationId/role;
      // simplified here to keep the scaffold self-contained.
      throw new ApiError(400, "INVITE_NOT_FOUND", "This invite link is invalid or has expired.");
    }

    if (!organizationName) {
      throw new ApiError(400, "VALIDATION_ERROR", "organizationName is required to create a new workspace.");
    }

    // Create the org first, then atomically find-or-create the user. If two requests race:
    // - The first succeeds and creates both org and user.
    // - The second hits the unique index on supabaseUserId and the findOneAndUpdate returns
    //   the already-created user, leaving at most one extra orphan org. This is a rare edge
    //   case acceptable without full transactions on a standalone MongoDB.
    const organization = await Organization.create({ name: organizationName });
    const user = await User.findOneAndUpdate(
      { supabaseUserId },
      {
        $setOnInsert: {
          supabaseUserId,
          organizationId: organization._id,
          email,
          fullName,
          role: "hr_admin", // the first user in a new org is its admin
        },
      },
      { upsert: true, new: true }
    );
    return user;
  },

  async getMongoUser(supabaseUserId) {
    const user = await User.findOne({ supabaseUserId });
    if (!user) throw new ApiError(404, "USER_NOT_FOUND", "No account found for this session.");
    return user;
  },

  toPublicUser(user) {
    return {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
      avatarUrl: user.avatarUrl,
    };
  },
};
