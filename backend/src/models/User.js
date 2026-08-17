import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    supabaseUserId: { type: String, required: true, unique: true, index: true },
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    // #27: unique:true mirrors Supabase Auth's own uniqueness guarantee at the DB layer.
    email: { type: String, required: true, unique: true },
    fullName: { type: String, required: true },
    role: { type: String, enum: ["recruiter", "hiring_manager", "hr_admin"], default: "recruiter" },
    avatarUrl: String,
    isActive: { type: Boolean, default: true },
    lastLoginAt: Date,
  },
  { timestamps: true }
);

userSchema.index({ organizationId: 1, role: 1 });

export const User = mongoose.model("User", userSchema);
