import { Candidate } from "../models/Candidate.js";
import { TalentPool } from "../models/TalentPool.js";
import { aiServiceClient } from "./aiServiceClient.js";

// v1 fallback: naive keyword extraction from the query when the LLM parser isn't
// configured, so natural-language search still returns something useful out of the box.
function keywordFallbackParse(query) {
  const words = query
    .replace(/[.,!?]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 2);
  const stopwords = new Set(["find", "with", "and", "the", "who", "have", "for", "developers", "engineers"]);
  const skills = words.filter((w) => !stopwords.has(w.toLowerCase()) && /^[A-Z]/.test(w));
  return { skills: skills.length ? skills : words.slice(0, 3), domain: [] };
}

export const talentSearchService = {
  // `weights` (0-100 each) mirror the design's "Algorithm Weighting" sliders — Technical
  // Depth, Experience Level, Skill Recency, Domain Expertise, Cultural Fit (AI). v1 applies
  // the ones we have real signal for (technicalDepth -> skill-match weight, domainExpertise
  // -> domain bonus); skillRecency/experienceLevel/culturalFit are accepted and returned so
  // the UI is fully wired, and fall back to a neutral multiplier until resume dates/culture
  // signals are modeled — see docs/01-technical-architecture.md's "v1 fallback" pattern.
  async search(organizationId, query, weights = {}) {
    const parsed = (await aiServiceClient.parseSearchQuery(query)) || keywordFallbackParse(query);
    const allTerms = [...(parsed.skills || []), ...(parsed.domain || [])];

    const filter = { organizationId };
    if (allTerms.length > 0) {
      filter["skills.name"] = { $in: allTerms.map((t) => new RegExp(t, "i")) };
    }

    const candidates = await Candidate.find(filter).limit(50).lean();

    const technicalDepth = (weights.technicalDepth ?? 85) / 100;
    const domainExpertise = (weights.domainExpertise ?? 60) / 100;

    const results = candidates.map((c) => {
      const matched = (c.skills || []).filter((s) => allTerms.some((t) => s.name.toLowerCase().includes(t.toLowerCase())));
      const domainMatched = matched.filter((s) => s.category === "domain");
      const base = allTerms.length ? 50 + matched.length * 15 * technicalDepth : 60;
      const domainBonus = domainMatched.length * 10 * domainExpertise;
      const overallScore = Math.round(Math.min(100, base + domainBonus));
      return {
        candidateId: c._id,
        fullName: c.fullName,
        currentTitle: c.currentTitle,
        overallScore,
        reasonSummary: matched.length ? `Matches on ${matched.map((s) => s.name).join(", ")}.` : "Broad match on your query.",
      };
    });

    results.sort((a, b) => b.overallScore - a.overallScore);
    return { parsedFilters: parsed, results, weights };
  },

  async listPools(organizationId) {
    const pools = await TalentPool.find({ organizationId }).lean();
    return Promise.all(
      pools.map(async (pool) => {
        const daysSinceUpdate = Math.floor((Date.now() - new Date(pool.updatedAt).getTime()) / 86400000);

        // #9: replace full search() call (AI service + full candidate scan) with a lightweight
        // countDocuments using the pool’s stored parsedFilters — the list view only needs the
        // count and health score, not the full result set. Full search is still called when a
        // pool is opened individually (e.g. via a future GET /pools/:id endpoint).
        const skillTerms = pool.parsedFilters?.skills || [];
        const filter = { organizationId };
        if (skillTerms.length > 0) {
          filter["skills.name"] = { $in: skillTerms.map((t) => new RegExp(t, "i")) };
        }
        const candidateCount = await Candidate.countDocuments(filter);

        const healthScore = Math.round(Math.max(0, Math.min(100, 75 - Math.min(30, daysSinceUpdate))));
        const sourcingStatus = daysSinceUpdate <= 7 ? "active_sourcing" : "passive_growing";
        const aiSummary =
          daysSinceUpdate > 14
            ? `Pool needs fresh data. Last meaningful update was ${daysSinceUpdate} days ago. Consider re-running this search.`
            : `${candidateCount} candidate${candidateCount !== 1 ? "s" : ""} match this pool’s filters.`;

        return {
          ...pool,
          candidateCount,
          skills: skillTerms,
          healthScore,
          sourcingStatus,
          aiSummary,
          topMatches: [], // populated on pool detail view, not the list
        };
      })
    );
  },

  async createPool(organizationId, createdBy, { name, query }) {
    const { parsedFilters } = await this.search(organizationId, query);
    return TalentPool.create({ organizationId, name, query, parsedFilters, createdBy });
  },
};
