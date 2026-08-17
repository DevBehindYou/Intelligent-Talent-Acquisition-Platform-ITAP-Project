import { describe, it, expect } from "vitest";

// A light smoke test for the pure-function parts of matchingService's scoring model.
// Full coverage would mock Mongoose models for scoreAndSave/recomputeAllForJob; this
// starter test exercises the exported scoring shape via scoreCandidateForJob's inputs.
import { matchingService } from "../src/services/matchingService.js";

describe("matchingService.scoreCandidateForJob", () => {
  it("scores a strong candidate higher than a weak one for the same job", async () => {
    const job = {
      _id: "job1",
      organizationId: "org1",
      title: "Senior Backend Engineer",
      department: "Engineering",
      description: "Backend role",
      requiredSkills: [
        { name: "Node.js", weight: 0.5, mustHave: true },
        { name: "MongoDB", weight: 0.5, mustHave: false },
      ],
      niceToHaveSkills: ["Docker"],
      experienceMin: 3,
      experienceMax: 8,
      scoringWeights: { skillsWeight: 0.4, experienceWeight: 0.3, educationWeight: 0.15, domainWeight: 0.15 },
    };

    const strongCandidate = {
      _id: "c1",
      fullName: "Strong Candidate",
      skills: [
        { name: "Node.js", category: "technical" },
        { name: "MongoDB", category: "technical" },
        { name: "Docker", category: "cloud" },
      ],
      totalExperienceYears: 5,
      education: [{ degree: "B.Tech", institution: "X", year: 2018 }],
    };

    const weakCandidate = {
      _id: "c2",
      fullName: "Weak Candidate",
      skills: [{ name: "PHP", category: "technical" }],
      totalExperienceYears: 1,
      education: [],
    };

    const strongScore = await matchingService.scoreCandidateForJob(strongCandidate, job);
    const weakScore = await matchingService.scoreCandidateForJob(weakCandidate, job);

    expect(strongScore.overallScore).toBeGreaterThan(weakScore.overallScore);
    expect(strongScore.overallScore).toBeGreaterThanOrEqual(0);
    expect(strongScore.overallScore).toBeLessThanOrEqual(100);
  });

  it("caps the score when a must-have skill is missing", async () => {
    const job = {
      _id: "job1",
      organizationId: "org1",
      title: "Role",
      requiredSkills: [{ name: "Kubernetes", weight: 1, mustHave: true }],
      niceToHaveSkills: [],
      experienceMin: 0,
      experienceMax: 20,
      scoringWeights: { skillsWeight: 1, experienceWeight: 0, educationWeight: 0, domainWeight: 0 },
    };
    const candidate = { _id: "c1", fullName: "No K8s", skills: [], totalExperienceYears: 5, education: [] };

    const score = await matchingService.scoreCandidateForJob(candidate, job);
    expect(score.overallScore).toBeLessThanOrEqual(55);
    expect(score.reasonTags).toContain("missing-must-have-skill");
  });
});

// Regression coverage for the bulk-rescoring optimization (recomputeAllForJob). The job here
// deliberately has NO scoringWeights, so if the supplied `weights` weren't honored the code
// would fall through to an Organization.findById with no DB and hang/throw.
describe("matchingService.scoreCandidateForJob — bulk options", () => {
  const jobWithoutWeights = {
    _id: "job1",
    organizationId: "org1",
    title: "Role",
    requiredSkills: [{ name: "Node.js", weight: 1, mustHave: false }],
    niceToHaveSkills: [],
    experienceMin: 0,
    experienceMax: 20,
  };
  const candidate = {
    _id: "c1",
    fullName: "Dev",
    skills: [{ name: "Node.js", category: "technical" }],
    totalExperienceYears: 5,
    education: [],
  };

  it("honors pre-resolved weights without an Organization lookup (N+1 fix)", async () => {
    const weights = { skillsWeight: 1, experienceWeight: 0, educationWeight: 0, domainWeight: 0 };
    const score = await matchingService.scoreCandidateForJob(candidate, jobWithoutWeights, {
      weights,
      useLlmExplanation: false,
    });
    expect(score.scoringVersion).toBe("1-0-0-0");
    expect(score.overallScore).toBeGreaterThanOrEqual(0);
    expect(score.overallScore).toBeLessThanOrEqual(100);
  });

  it("produces a template explanation when the LLM is disabled (bulk path)", async () => {
    const weights = { skillsWeight: 0.4, experienceWeight: 0.3, educationWeight: 0.15, domainWeight: 0.15 };
    const score = await matchingService.scoreCandidateForJob(candidate, jobWithoutWeights, {
      weights,
      useLlmExplanation: false,
    });
    expect(typeof score.explanation).toBe("string");
    expect(score.explanation.length).toBeGreaterThan(0);
    expect(score.reasonSummary).toBeTruthy();
  });
});
