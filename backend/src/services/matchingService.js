import { Job } from "../models/Job.js";
import { Candidate } from "../models/Candidate.js";
import { MatchScore } from "../models/MatchScore.js";
import { Organization } from "../models/Organization.js";
import { aiServiceClient } from "./aiServiceClient.js";

/**
 * Real, working v1 scoring: keyword/overlap-based matching that needs no external ML
 * service, so ranking works out of the box. If the AI microservice's /embed endpoint is
 * reachable, its cosine-similarity output is blended in for a stronger skill score —
 * this is the "v1 fallback, upgrade path to Sentence-BERT + Qdrant" mentioned in
 * docs/01-technical-architecture.md §1.3. Nothing about the public scoring shape changes
 * either way, so the frontend and API contract (docs/03-api-documentation.md §6) are stable.
 */

function normalize(str = "") {
  return str.toLowerCase().trim();
}

function skillScore(candidateSkills = [], requiredSkills = [], niceToHaveSkills = []) {
  if (requiredSkills.length === 0 && niceToHaveSkills.length === 0) return 70; // neutral default
  const candidateNames = new Set(candidateSkills.map((s) => normalize(s.name)));

  let earned = 0;
  let possible = 0;
  let missedMustHave = false;

  requiredSkills.forEach((req) => {
    const weight = req.weight ?? 1 / Math.max(requiredSkills.length, 1);
    possible += weight;
    if (candidateNames.has(normalize(req.name))) {
      earned += weight;
    } else if (req.mustHave) {
      missedMustHave = true;
    }
  });

  niceToHaveSkills.forEach((skillName) => {
    const weight = 0.3 / Math.max(niceToHaveSkills.length, 1);
    possible += weight;
    if (candidateNames.has(normalize(skillName))) earned += weight;
  });

  const raw = possible > 0 ? (earned / possible) * 100 : 70;
  return missedMustHave ? Math.min(raw, 55) : raw; // hard cap when a must-have is missing
}

function experienceScore(candidateYears = 0, min = 0, max = 99) {
  if (candidateYears >= min && candidateYears <= max) return 100;
  if (candidateYears < min) return Math.max(0, 100 - (min - candidateYears) * 15);
  return Math.max(0, 100 - (candidateYears - max) * 8);
}

function educationScore(education = []) {
  if (education.length === 0) return 50;
  return 85; // presence of a degree is treated as a reasonable baseline in v1
}

function domainScore(candidateSkills = [], job) {
  const domainSkills = candidateSkills.filter((s) => normalize(s.category) === "domain");
  if (domainSkills.length === 0) return 60;
  const jobText = normalize(`${job.title} ${job.department} ${job.description}`);
  const hits = domainSkills.filter((s) => jobText.includes(normalize(s.name))).length;
  return Math.min(100, 60 + hits * 20);
}

async function resolveWeights(job) {
  if (job.scoringWeights?.skillsWeight !== undefined) return job.scoringWeights;
  const org = await Organization.findById(job.organizationId).lean();
  return org?.scoringDefaults || { skillsWeight: 0.4, experienceWeight: 0.3, educationWeight: 0.15, domainWeight: 0.15 };
}

function buildReasonTags({ skill, experience, missedMustHave }) {
  const tags = [];
  if (skill >= 80) tags.push("required-skills-present");
  if (experience >= 90) tags.push("experience-level-matches");
  if (skill >= 70 && experience >= 70) tags.push("similar-project-experience");
  if (missedMustHave) tags.push("missing-must-have-skill");
  return tags;
}

export const matchingService = {
  /**
   * @param {object} [options]
   * @param {object} [options.weights] Pre-resolved scoring weights — pass this in bulk loops
   *   to avoid an Organization.findById per candidate (N+1).
   * @param {boolean} [options.useLlmExplanation=true] When false, skips the AI service call
   *   and uses the template explanation. Bulk rescoring passes false so 500 candidates don't
   *   trigger 500 blocking LLM round-trips.
   */
  async scoreCandidateForJob(candidate, job, { weights, useLlmExplanation = true } = {}) {
    const resolvedWeights = weights || (await resolveWeights(job));
    const skill = skillScore(candidate.skills, job.requiredSkills, job.niceToHaveSkills);
    const experience = experienceScore(candidate.totalExperienceYears, job.experienceMin, job.experienceMax);
    const education = educationScore(candidate.education);
    const domain = domainScore(candidate.skills, job);

    const overall =
      skill * resolvedWeights.skillsWeight +
      experience * resolvedWeights.experienceWeight +
      education * resolvedWeights.educationWeight +
      domain * resolvedWeights.domainWeight;

    const missedMustHave = (job.requiredSkills || []).some(
      (req) => req.mustHave && !(candidate.skills || []).some((s) => normalize(s.name) === normalize(req.name))
    );

    const reasonTags = buildReasonTags({ skill, experience, missedMustHave });

    let explanation = null;
    let reasonSummary = null;
    const llmExplanation = useLlmExplanation
      ? await aiServiceClient.explain({
          candidate: { fullName: candidate.fullName, skills: candidate.skills },
          job: { title: job.title, requiredSkills: job.requiredSkills },
          scores: { overall, skill, experience, education, domain },
        })
      : null;

    if (llmExplanation) {
      explanation = llmExplanation;
      reasonSummary = llmExplanation.slice(0, 140);
    } else {
      // Template fallback so the product still explains itself with no LLM configured —
      // docs/01-technical-architecture.md, LLM adapter "Ollama-first, pluggable" note.
      explanation = missedMustHave
        ? `${candidate.fullName} is missing at least one must-have skill for this role, which caps the overall score.`
        : `${candidate.fullName} scores ${Math.round(overall)} overall: ${Math.round(skill)} on skills, ${Math.round(
            experience
          )} on experience fit, and ${Math.round(domain)} on domain relevance.`;
      reasonSummary = explanation.slice(0, 140);
    }

    return {
      candidateId: candidate._id,
      jobId: job._id,
      organizationId: job.organizationId,
      overallScore: Math.round(overall),
      skillScore: Math.round(skill),
      experienceScore: Math.round(experience),
      educationScore: Math.round(education),
      domainScore: Math.round(domain),
      explanation,
      reasonTags,
      reasonSummary,
      scoringVersion: `${resolvedWeights.skillsWeight}-${resolvedWeights.experienceWeight}-${resolvedWeights.educationWeight}-${resolvedWeights.domainWeight}`,
    };
  },

  async scoreAndSave(candidate, job, options) {
    const scoreData = await this.scoreCandidateForJob(candidate, job, options);
    return MatchScore.findOneAndUpdate(
      { candidateId: candidate._id, jobId: job._id },
      { ...scoreData, scoredAt: new Date() },
      { upsert: true, new: true }
    );
  },

  // Bulk rescoring of a whole job (e.g. after its scoring weights change). Optimized for the
  // documented 500-candidate scale: weights resolved once (no N+1), template explanations
  // instead of a blocking LLM call per candidate, and bounded parallelism so we neither
  // serialize nor stampede Mongo/the AI service.
  // #3: organizationId is required to scope the Job lookup — prevents cross-tenant rescoring.
  async recomputeAllForJob(jobId, organizationId) {
    const job = await Job.findOne({ _id: jobId, organizationId });
    if (!job) return { scored: 0 };

    const weights = await resolveWeights(job);
    const candidates = await Candidate.find({
      organizationId: job.organizationId,
      resumeIds: { $exists: true, $ne: [] },
    });

    const CONCURRENCY = 10;
    let scored = 0;
    for (let i = 0; i < candidates.length; i += CONCURRENCY) {
      const batch = candidates.slice(i, i + CONCURRENCY);
      await Promise.all(
        batch.map((candidate) => this.scoreAndSave(candidate, job, { weights, useLlmExplanation: false }))
      );
      scored += batch.length;
    }
    return { scored };
  },
};
