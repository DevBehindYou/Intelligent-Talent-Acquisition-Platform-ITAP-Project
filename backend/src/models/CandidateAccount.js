import mongoose from "mongoose";

/**
 * The job seeker's own login + canonical profile. Deliberately GLOBAL — no organizationId —
 * because a candidate belongs to no recruiter tenant and applies across many. This is the
 * counterpart to the tenant-scoped `Candidate` model (a recruiter-owned projection); the two
 * are linked via Candidate.candidateAccountId. See docs/13-candidate-admin-enhancement-spec.md §1.
 *
 * Phase 0 keeps the profile minimal (identity + a few headline fields); the full profile
 * subdocuments (experience, education, preferences, etc.) land in Phase 1 (spec §4.3).
 */
const candidateAccountSchema = new mongoose.Schema(
  {
    // Mirrors a verified Supabase identity, exactly like User.supabaseUserId does for staff.
    supabaseUserId: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    fullName: { type: String, required: true },
    phone: String,
    avatarUrl: String,
    headline: String,
    location: String,

    // --- Profile (Phase 1, spec §4.3). A reusable profile applied across applications. ---
    summary: String,
    skills: [{ name: String, level: { type: String, enum: ["beginner", "intermediate", "advanced", "expert"] } }],
    experience: [
      {
        title: String,
        company: String,
        location: String,
        startDate: Date,
        endDate: Date,
        current: Boolean,
        description: String,
      },
    ],
    education: [{ degree: String, institution: String, field: String, startYear: Number, endYear: Number }],
    certifications: [{ name: String, issuer: String, year: Number }],
    projects: [{ name: String, description: String, url: String }],
    languages: [{ name: String, proficiency: String }],
    links: { linkedin: String, github: String, portfolio: String, website: String },
    preferences: {
      roles: [String],
      locations: [String],
      employmentTypes: [String], // full_time | contract | remote (mirrors Job.employmentType)
      workModes: [String], // onsite | hybrid | remote
      availability: String, // e.g. "immediate", "2_weeks", "1_month"
      salaryExpectation: { min: Number, max: Number, currency: String },
    },

    emailVerifiedAt: Date,
    isActive: { type: Boolean, default: true },
    suspendedAt: Date,
    anonymizedAt: Date, // set when a platform admin anonymizes the account (GDPR erasure)
    lastLoginAt: Date,
  },
  { timestamps: true }
);

export const CandidateAccount = mongoose.model("CandidateAccount", candidateAccountSchema);
