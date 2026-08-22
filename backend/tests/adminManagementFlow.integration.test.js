import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

import { Organization } from "../src/models/Organization.js";
import { Job } from "../src/models/Job.js";
import { CandidateAccount } from "../src/models/CandidateAccount.js";
import { CandidateDocument } from "../src/models/CandidateDocument.js";
import { User } from "../src/models/User.js";
import { AuditLog } from "../src/models/AuditLog.js";
import { applicationService } from "../src/services/applicationService.js";
import { adminManagementService } from "../src/services/adminManagementService.js";

// Phase 4b: super-admin management (soft-delete/anonymize + audit). Real in-memory MongoDB.
let mongod;
const admin = { superAdminId: new mongoose.Types.ObjectId() };

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
  const account = await CandidateAccount.create({
    supabaseUserId: "sup-A",
    email: "alice@example.com",
    fullName: "Alice",
    phone: "555-1234",
    skills: [{ name: "React" }],
  });
  await CandidateDocument.create({
    candidateAccountId: account._id,
    kind: "resume",
    isPrimary: true,
    fileName: "a.pdf",
    fileType: "pdf",
    storagePath: "acme/a.pdf",
  });
  await applicationService.apply(account._id, { jobId: job._id });
  const recruiter = await User.create({
    supabaseUserId: "sup-R",
    organizationId: org._id,
    email: "rec@acme.com",
    fullName: "Rec",
    role: "recruiter",
  });
  return { org, account, recruiter };
}

describe("admin candidate management", () => {
  it("suspends and reactivates a candidate, writing audit entries", async () => {
    const { account } = await seed();
    expect((await adminManagementService.setCandidateSuspended(admin, account._id, true)).isActive).toBe(false);
    expect((await adminManagementService.setCandidateSuspended(admin, account._id, false)).isActive).toBe(true);

    const audits = await AuditLog.find({ targetId: account._id }).lean();
    expect(audits.some((a) => a.action === "candidate.suspended")).toBe(true);
    expect(audits.some((a) => a.action === "candidate.reactivated")).toBe(true);
  });

  it("anonymizes a candidate: scrubs PII, deletes documents, keeps the record, blocks re-run", async () => {
    const { account } = await seed();
    const result = await adminManagementService.anonymizeCandidate(admin, account._id);
    expect(result.anonymizedAt).toBeTruthy();

    const after = await CandidateAccount.findById(account._id).lean();
    expect(after).toBeTruthy(); // record kept (referential integrity)
    expect(after.fullName).toBe("Deleted candidate");
    expect(after.email).not.toContain("alice");
    expect(after.skills.length).toBe(0);
    expect(after.phone).toBeFalsy();

    expect((await CandidateDocument.find({ candidateAccountId: account._id }).lean()).length).toBe(0);

    await expect(adminManagementService.anonymizeCandidate(admin, account._id)).rejects.toMatchObject({ status: 409 });
    expect(await AuditLog.findOne({ action: "candidate.anonymized", targetId: account._id }).lean()).toBeTruthy();
  });

  it("lists/searches candidates and returns detail (with applications, no supabaseUserId)", async () => {
    const { account } = await seed();
    const list = await adminManagementService.listCandidates({ search: "alice" });
    expect(list.total).toBe(1);

    const detail = await adminManagementService.getCandidate(account._id);
    expect(detail.applications.length).toBe(1);
    expect(detail.supabaseUserId).toBeUndefined();
  });
});

describe("admin recruiter management", () => {
  it("toggles recruiter active state with an audit entry", async () => {
    const { recruiter } = await seed();
    expect((await adminManagementService.setRecruiterActive(admin, recruiter._id, false)).isActive).toBe(false);
    expect(await AuditLog.findOne({ action: "recruiter.deactivated", targetId: recruiter._id }).lean()).toBeTruthy();
  });
});
