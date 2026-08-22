import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

import { Organization } from "../src/models/Organization.js";
import { Job } from "../src/models/Job.js";
import { CandidateAccount } from "../src/models/CandidateAccount.js";
import { CandidateDocument } from "../src/models/CandidateDocument.js";
import { Notification } from "../src/models/Notification.js";
import { applicationService } from "../src/services/applicationService.js";
import { assessmentService } from "../src/services/assessmentService.js";

// Phase 3: assessments. The key guarantee — the candidate never sees the rubric, max score,
// grade, or evaluator feedback. Real in-memory MongoDB.
let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
}, 600000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongod?.stop();
});

beforeEach(async () => {
  const { collections } = mongoose.connection;
  await Promise.all(Object.values(collections).map((c) => c.deleteMany({})));
});

const SECRET_RUBRIC = "SECRET RUBRIC award 10 pts for recursion";
const SECRET_FEEDBACK = "SECRET FEEDBACK candidate was weak on edge cases";

async function setupAssigned() {
  const org = await Organization.create({ name: "Acme Inc" });
  const job = await Job.create({ organizationId: org._id, title: "Backend Engineer", status: "open", isPublic: true });
  const accountA = await CandidateAccount.create({ supabaseUserId: "sup-A", email: "a@example.com", fullName: "Alice" });
  const accountB = await CandidateAccount.create({ supabaseUserId: "sup-B", email: "b@example.com", fullName: "Bob" });
  await CandidateDocument.create({ candidateAccountId: accountA._id, kind: "resume", isPrimary: true, fileName: "a.pdf", fileType: "pdf" });
  const app = await applicationService.apply(accountA._id, { jobId: job._id });

  const assessment = await assessmentService.createAssessment(org._id, {
    title: "Coding Test",
    type: "coding",
    instructions: "Build a small REST endpoint and submit the repo link.",
    rubric: SECRET_RUBRIC,
    maxScore: 100,
    createdBy: new mongoose.Types.ObjectId(),
  });
  const assignment = await assessmentService.assign(org._id, {
    assessmentId: assessment._id,
    applicationId: app.id,
    deadline: new Date(Date.now() + 3 * 86400000),
    assignedBy: new mongoose.Types.ObjectId(),
  });
  return { org, accountA, accountB, assignment };
}

describe("candidate assessments", () => {
  it("shows the brief but redacts rubric/max-score/grade, and notifies the candidate", async () => {
    const { accountA, assignment } = await setupAssigned();

    const view = await assessmentService.getForCandidate(accountA._id, assignment._id);
    expect(view.title).toBe("Coding Test");
    expect(view.instructions).toContain("REST endpoint");
    expect("score" in view).toBe(false);
    expect("rubric" in view).toBe(false);
    expect("evaluatorFeedback" in view).toBe(false);
    expect(JSON.stringify(view)).not.toContain("SECRET RUBRIC");

    const notifs = await Notification.find({ candidateAccountId: accountA._id, type: "assessment_assigned" }).lean();
    expect(notifs.length).toBeGreaterThan(0);
  });

  it("is IDOR-safe: another candidate cannot read the assignment", async () => {
    const { accountB, assignment } = await setupAssigned();
    await expect(assessmentService.getForCandidate(accountB._id, assignment._id)).rejects.toMatchObject({ status: 404 });
  });

  it("submits once and blocks a second submission", async () => {
    const { accountA, assignment } = await setupAssigned();
    const submitted = await assessmentService.submit(accountA._id, assignment._id, { submissionText: "my repo link" });
    expect(submitted.status).toBe("submitted");
    expect(submitted.submissionText).toBe("my repo link");

    await expect(
      assessmentService.submit(accountA._id, assignment._id, { submissionText: "again" })
    ).rejects.toMatchObject({ status: 409 });
  });

  it("still hides the grade and evaluator feedback after the recruiter grades it", async () => {
    const { org, accountA, assignment } = await setupAssigned();
    await assessmentService.submit(accountA._id, assignment._id, { submissionText: "done" });
    await assessmentService.grade(org._id, assignment._id, { score: 42, evaluatorFeedback: SECRET_FEEDBACK });

    const view = await assessmentService.getForCandidate(accountA._id, assignment._id);
    expect("score" in view).toBe(false);
    expect("evaluatorFeedback" in view).toBe(false);
    expect(JSON.stringify(view)).not.toContain("SECRET FEEDBACK");
  });
});
