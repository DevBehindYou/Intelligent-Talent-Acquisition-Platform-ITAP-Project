import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

import { Organization } from "../src/models/Organization.js";
import { Job } from "../src/models/Job.js";
import { CandidateAccount } from "../src/models/CandidateAccount.js";
import { CandidateDocument } from "../src/models/CandidateDocument.js";
import { Notification } from "../src/models/Notification.js";
import { applicationService } from "../src/services/applicationService.js";
import { conversationService } from "../src/services/conversationService.js";

// Phase 2b: candidate↔recruiter messaging. Real in-memory MongoDB.
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

async function seed() {
  const org = await Organization.create({ name: "Acme Inc" });
  const job = await Job.create({ organizationId: org._id, title: "Backend Engineer", status: "open", isPublic: true });
  const accountA = await CandidateAccount.create({ supabaseUserId: "sup-A", email: "a@example.com", fullName: "Alice" });
  const accountB = await CandidateAccount.create({ supabaseUserId: "sup-B", email: "b@example.com", fullName: "Bob" });
  await CandidateDocument.create({ candidateAccountId: accountA._id, kind: "resume", isPrimary: true, fileName: "a.pdf", fileType: "pdf" });
  const app = await applicationService.apply(accountA._id, { jobId: job._id });
  return { org, job, accountA, accountB, applicationId: app.id };
}

describe("candidate messaging", () => {
  it("lets a candidate start a conversation and read their own thread", async () => {
    const { accountA, applicationId } = await seed();
    const { conversationId } = await conversationService.startAsCandidate(accountA._id, {
      applicationId,
      body: "Hi — a quick question about the role.",
    });

    const list = await conversationService.listForCandidate(accountA._id);
    expect(list.length).toBe(1);

    const thread = await conversationService.threadForCandidate(accountA._id, conversationId);
    expect(thread.messages.length).toBe(1);
    expect(thread.messages[0].senderType).toBe("candidate");
  });

  it("is IDOR-safe: another candidate cannot read or post to the thread", async () => {
    const { accountA, accountB, applicationId } = await seed();
    const { conversationId } = await conversationService.startAsCandidate(accountA._id, { applicationId, body: "Hello" });

    await expect(conversationService.threadForCandidate(accountB._id, conversationId)).rejects.toMatchObject({ status: 404 });
    await expect(conversationService.sendAsCandidate(accountB._id, conversationId, "sneaky")).rejects.toMatchObject({ status: 404 });
  });

  it("a staff reply notifies the candidate and appears in their thread", async () => {
    const { org, accountA, applicationId } = await seed();
    const { conversationId } = await conversationService.startAsCandidate(accountA._id, { applicationId, body: "Hello" });

    await conversationService.postAsStaff({
      organizationId: org._id,
      conversationId,
      senderUserId: new mongoose.Types.ObjectId(),
      body: "Thanks for applying — we'll be in touch.",
    });

    const notifs = await Notification.find({ candidateAccountId: accountA._id, type: "message_received" }).lean();
    expect(notifs.length).toBeGreaterThan(0);

    const thread = await conversationService.threadForCandidate(accountA._id, conversationId);
    expect(thread.messages.length).toBe(2);
    expect(thread.messages[1].senderType).toBe("staff");
  });
});
