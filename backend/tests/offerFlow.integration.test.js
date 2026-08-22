import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

import { Organization } from "../src/models/Organization.js";
import { Job } from "../src/models/Job.js";
import { CandidateAccount } from "../src/models/CandidateAccount.js";
import { CandidateDocument } from "../src/models/CandidateDocument.js";
import { Application } from "../src/models/Application.js";
import { ApplicationEvent } from "../src/models/ApplicationEvent.js";
import { Notification } from "../src/models/Notification.js";
import { applicationService } from "../src/services/applicationService.js";
import { offerService } from "../src/services/offerService.js";

// Phase 3: offers. Real in-memory MongoDB.
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

const releaseFor = (org, applicationId, extra = {}) =>
  offerService.release(org._id, {
    applicationId,
    releasedBy: new mongoose.Types.ObjectId(),
    title: "Backend Engineer",
    compensationSummary: "$150,000 base + equity",
    acceptanceDeadline: new Date(Date.now() + 7 * 86400000),
    ...extra,
  });

describe("candidate offers", () => {
  it("releases an offer the candidate can see (docs redacted), notifies them, moves the app to offer", async () => {
    const { org, accountA, applicationId } = await seed();
    const offer = await releaseFor(org, applicationId, {
      documents: [{ name: "Offer Letter.pdf", storagePath: "acme/secret-offer.pdf" }],
    });

    const view = await offerService.getForCandidate(accountA._id, offer._id);
    expect(view.status).toBe("released");
    expect(view.title).toBe("Backend Engineer");
    expect(view.documents[0].name).toBe("Offer Letter.pdf");
    expect(view.documents[0].storagePath).toBeUndefined(); // never leak the storage path

    const notifs = await Notification.find({ candidateAccountId: accountA._id, type: "offer_released" }).lean();
    expect(notifs.length).toBeGreaterThan(0);

    const app = await Application.findById(applicationId).lean();
    expect(app.status).toBe("offer");
  });

  it("is IDOR-safe: another candidate cannot see the offer", async () => {
    const { org, accountB, applicationId } = await seed();
    const offer = await releaseFor(org, applicationId);
    await expect(offerService.getForCandidate(accountB._id, offer._id)).rejects.toMatchObject({ status: 404 });
  });

  it("accepts an offer, records the event, and blocks re-responding", async () => {
    const { org, accountA, applicationId } = await seed();
    const offer = await releaseFor(org, applicationId);

    const accepted = await offerService.respond(accountA._id, offer._id, "accept");
    expect(accepted.status).toBe("accepted");
    expect(accepted.respondedAt).toBeTruthy();

    const events = await ApplicationEvent.find({ type: "offer_accepted", visibility: "candidate" }).lean();
    expect(events.length).toBeGreaterThan(0);

    await expect(offerService.respond(accountA._id, offer._id, "decline")).rejects.toMatchObject({ status: 409 });
  });

  it("declines an offer", async () => {
    const { org, accountA, applicationId } = await seed();
    const offer = await releaseFor(org, applicationId);
    const declined = await offerService.respond(accountA._id, offer._id, "decline");
    expect(declined.status).toBe("declined");
  });
});
