import mongoose from "mongoose";

// Not in the original Document 3 schema — added to back the "Talent Pools" screen supplied
// in the design export (saved Talent Search segments recruiters can revisit).
const talentPoolSchema = new mongoose.Schema(
  {
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    name: String,
    query: String,
    parsedFilters: mongoose.Schema.Types.Mixed,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export const TalentPool = mongoose.model("TalentPool", talentPoolSchema);
