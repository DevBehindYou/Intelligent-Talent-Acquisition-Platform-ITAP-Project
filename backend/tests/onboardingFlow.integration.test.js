import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

import { Organization } from "../src/models/Organization.js";
import { Job } from "../src/models/Job.js";
import { CandidateAccount } from "../src/models/CandidateAccount.js";
import { CandidateDocument } from "../src/models/CandidateDocument.js";
import { Application } from "../src/models/Application.js";
import { Notification } from "../src/models/Notification.js";
import { applicationService } from "../src/services/applicationService.js";
import { onboardingService } from "../src/services/onboardingService.js";

// Phase 3: onboarding. Real in-memory MongoDB.
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

async function setup() {
  const org = await Organization.create({ name: "Acme Inc" });
  const job = await Job.create({ organizationId: org._id, title: "Backend Engineer", status: "open", isPublic: true });
  const accountA = await CandidateAccount.create({ supabaseUserId: "sup-A", email: "a@example.com", fullName: "Alice" });
  const accountB = await CandidateAccount.create({ supabaseUserId: "sup-B", email: "b@example.com", fullName: "Bob" });
  await CandidateDocument.create({ candidateAccountId: accountA._id, kind: "resume", isPrimary: true, fileName: "a.pdf", fileType: "pdf" });
  const app = await applicationService.apply(accountA._id, { jobId: job._id });

  await onboardingService.startOnboarding(org._id, {
    applicationId: app.id,
    joiningDate: new Date(Date.now() + 30 * 86400000),
    hrInstructions: "Welcome aboard!",
    tasks: [
      { title: "Upload government ID", type: "document" },
      { title: "Bank details", type: "form" },
      { title: "Acknowledge code of conduct", type: "acknowledgement" },
    ],
    createdBy: new mongoose.Types.ObjectId(),
  });
  return { org, accountA, accountB, applicationId: app.id };
}

describe("candidate onboarding", () => {
  it("creates the case + tasks, notifies, and moves the application to hired", async () => {
    const { accountA, applicationId } = await setup();

    const cases = await onboardingService.getForCandidate(accountA._id);
    expect(cases.length).toBe(1);
    expect(cases[0].tasks.length).toBe(3);
    expect(cases[0].progressPct).toBe(0);
    expect(cases[0].hrInstructions).toBe("Welcome aboard!");

    const app = await Application.findById(applicationId).lean();
    expect(app.status).toBe("hired");

    const notifs = await Notification.find({ candidateAccountId: accountA._id, type: "onboarding_started" }).lean();
    expect(notifs.length).toBeGreaterThan(0);
  });

  it("is IDOR-safe: another candidate sees no onboarding and cannot act on the tasks", async () => {
    const { accountA, accountB } = await setup();
    expect((await onboardingService.getForCandidate(accountB._id)).length).toBe(0);

    const [caseA] = await onboardingService.getForCandidate(accountA._id);
    const formTask = caseA.tasks.find((t) => t.type === "form");
    await expect(
      onboardingService.submitTask(accountB._id, formTask.id, { submissionData: {} })
    ).rejects.toMatchObject({ status: 404 });
  });

  it("submits a form task, masks sensitive fields on read, and updates progress", async () => {
    const { accountA } = await setup();
    const [caseA] = await onboardingService.getForCandidate(accountA._id);
    const formTask = caseA.tasks.find((t) => t.type === "form");

    await onboardingService.submitTask(accountA._id, formTask.id, {
      submissionData: { bankAccountNumber: "12345678", fullName: "Alice" },
    });

    const [updated] = await onboardingService.getForCandidate(accountA._id);
    const form = updated.tasks.find((t) => String(t.id) === String(formTask.id));
    expect(form.status).toBe("submitted");
    expect(form.submissionData.bankAccountNumber).not.toBe("12345678"); // masked
    expect(form.submissionData.bankAccountNumber).toContain("5678"); // shows last 4
    expect(form.submissionData.fullName).toBe("Alice"); // non-sensitive unchanged
    expect(JSON.stringify(updated)).not.toContain("12345678");
    expect(updated.progressPct).toBe(33); // 1 of 3 done
  });

  it("acknowledges a policy task", async () => {
    const { accountA } = await setup();
    const [caseA] = await onboardingService.getForCandidate(accountA._id);
    const ackTask = caseA.tasks.find((t) => t.type === "acknowledgement");
    const result = await onboardingService.acknowledgeTask(accountA._id, ackTask.id);
    expect(result.status).toBe("submitted");
  });
});
