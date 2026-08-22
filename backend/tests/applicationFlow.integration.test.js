import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

import { Organization } from "../src/models/Organization.js";
import { Job } from "../src/models/Job.js";
import { CandidateAccount } from "../src/models/CandidateAccount.js";
import { CandidateDocument } from "../src/models/CandidateDocument.js";
import { Application } from "../src/models/Application.js";
import { ApplicationEvent } from "../src/models/ApplicationEvent.js";
import { applicationService } from "../src/services/applicationService.js";

// Real DB-backed integration test for the Phase 1 application flow — proves the Phase 1 DoD
// (docs/13 §10): duplicate applications are blocked, /applications/:id is IDOR-safe, and the
// candidate timeline never leaks internal recruiter events.
let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  // Ensure the unique {candidateAccountId, jobId} index exists so duplicates actually 11000.
  await Application.init();
}, 600000); // generous: first run downloads the mongodb-memory-server binary

afterAll(async () => {
  await mongoose.disconnect();
  await mongod?.stop();
});

// Clean slate before each test so fixed seed ids (sup-A/sup-B) don't collide across tests.
beforeEach(async () => {
  const { collections } = mongoose.connection;
  await Promise.all(Object.values(collections).map((c) => c.deleteMany({})));
});

async function seed() {
  const org = await Organization.create({ name: "Acme Inc" });
  const job = await Job.create({ organizationId: org._id, title: "Backend Engineer", status: "open", isPublic: true });
  const draftJob = await Job.create({ organizationId: org._id, title: "Hidden Role", status: "draft", isPublic: false });
  const accountA = await CandidateAccount.create({ supabaseUserId: "sup-A", email: "a@example.com", fullName: "Alice" });
  const accountB = await CandidateAccount.create({ supabaseUserId: "sup-B", email: "b@example.com", fullName: "Bob" });
  await CandidateDocument.create({
    candidateAccountId: accountA._id,
    kind: "resume",
    isPrimary: true,
    fileName: "alice.pdf",
    fileType: "pdf",
  });
  return { org, job, draftJob, accountA, accountB };
}

describe("candidate application flow", () => {
  it("lets a candidate apply, then blocks a duplicate application (409)", async () => {
    const { job, accountA } = await seed();

    const app = await applicationService.apply(accountA._id, { jobId: job._id });
    expect(app.status).toBe("applied");
    expect(app.statusLabel).toBe("Applied");

    await expect(applicationService.apply(accountA._id, { jobId: job._id })).rejects.toMatchObject({
      status: 409,
      code: "ALREADY_APPLIED",
    });
  });

  it("refuses to apply to a non-public/closed job (404)", async () => {
    const { draftJob, accountA } = await seed();
    await expect(applicationService.apply(accountA._id, { jobId: draftJob._id })).rejects.toMatchObject({ status: 404 });
  });

  it("projects the applicant into the org (Candidate + PipelineStage) on apply", async () => {
    const { job, accountA } = await seed();
    const app = await applicationService.apply(accountA._id, { jobId: job._id });

    const stored = await Application.findById(app.id).lean();
    expect(stored.candidateId).toBeTruthy(); // recruiter-side projection linked
    expect(String(stored.organizationId)).toBe(String(job.organizationId));
  });

  it("is IDOR-safe: candidate B cannot read candidate A's application", async () => {
    const { job, accountA, accountB } = await seed();
    const app = await applicationService.apply(accountA._id, { jobId: job._id });

    // Same application id, but scoped to B → must 404, never leak A's data.
    await expect(applicationService.get(accountB._id, app.id)).rejects.toMatchObject({
      status: 404,
      code: "APPLICATION_NOT_FOUND",
    });
    // A can read their own.
    const own = await applicationService.get(accountA._id, app.id);
    expect(String(own.id)).toBe(String(app.id));
  });

  it("never exposes internal recruiter timeline events to the candidate", async () => {
    const { job, accountA } = await seed();
    const app = await applicationService.apply(accountA._id, { jobId: job._id });

    // A recruiter adds an internal-only note.
    await ApplicationEvent.create({
      applicationId: app.id,
      organizationId: job.organizationId,
      type: "note",
      actorType: "staff",
      visibility: "internal",
      metadata: { note: "weak on system design" },
    });

    const detail = await applicationService.get(accountA._id, app.id);
    expect(detail.timeline.length).toBeGreaterThan(0);
    expect(detail.timeline.every((e) => e.visibility === "candidate")).toBe(true);
    expect(JSON.stringify(detail.timeline)).not.toContain("system design");
  });

  it("lets a candidate withdraw, and blocks re-withdrawing", async () => {
    const { job, accountA } = await seed();
    const app = await applicationService.apply(accountA._id, { jobId: job._id });

    const withdrawn = await applicationService.withdraw(accountA._id, app.id);
    expect(withdrawn.status).toBe("withdrawn");

    await expect(applicationService.withdraw(accountA._id, app.id)).rejects.toMatchObject({ status: 409 });
  });
});
