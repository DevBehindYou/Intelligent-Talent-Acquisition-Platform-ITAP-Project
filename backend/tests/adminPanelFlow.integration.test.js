import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

import { Organization } from "../src/models/Organization.js";
import { Job } from "../src/models/Job.js";
import { CandidateAccount } from "../src/models/CandidateAccount.js";
import { CandidateDocument } from "../src/models/CandidateDocument.js";
import { applicationService } from "../src/services/applicationService.js";
import { adminAuthService } from "../src/services/adminAuthService.js";
import { platformAdminService } from "../src/services/platformAdminService.js";

// Phase 4a: super-admin auth (allowlist) + platform dashboard. Real in-memory MongoDB.
let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  process.env.SUPER_ADMIN_EMAILS = "admin@platform.com, boss@acme.com";
}, 600000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongod?.stop();
});

beforeEach(async () => {
  const { collections } = mongoose.connection;
  await Promise.all(Object.values(collections).map((c) => c.deleteMany({})));
});

describe("super-admin auth (allowlist)", () => {
  it("provisions an admin only for an allowlisted email, idempotently", async () => {
    const admin = await adminAuthService.findOrCreateSuperAdmin({
      supabaseUserId: "sup-admin",
      email: "admin@platform.com",
      fullName: "Platform Admin",
    });
    expect(admin.email).toBe("admin@platform.com");

    const again = await adminAuthService.findOrCreateSuperAdmin({ supabaseUserId: "sup-admin", email: "admin@platform.com" });
    expect(String(again._id)).toBe(String(admin._id));
  });

  it("rejects a non-allowlisted email with 403", async () => {
    await expect(
      adminAuthService.findOrCreateSuperAdmin({ supabaseUserId: "sup-x", email: "random@evil.com" })
    ).rejects.toMatchObject({ status: 403 });
  });

  it("rejects a disabled admin account", async () => {
    const admin = await adminAuthService.findOrCreateSuperAdmin({ supabaseUserId: "sup-d", email: "boss@acme.com" });
    admin.isActive = false;
    await admin.save();
    await expect(
      adminAuthService.findOrCreateSuperAdmin({ supabaseUserId: "sup-d", email: "boss@acme.com" })
    ).rejects.toMatchObject({ status: 403 });
  });
});

describe("platform dashboard (cross-tenant)", () => {
  it("aggregates metrics across all organizations", async () => {
    const org1 = await Organization.create({ name: "Org One" });
    const org2 = await Organization.create({ name: "Org Two" });
    const job1 = await Job.create({ organizationId: org1._id, title: "J1", status: "open", isPublic: true });
    const job2 = await Job.create({ organizationId: org2._id, title: "J2", status: "open", isPublic: true });
    const accA = await CandidateAccount.create({ supabaseUserId: "a", email: "a@x.com", fullName: "A" });
    await CandidateAccount.create({ supabaseUserId: "b", email: "b@x.com", fullName: "B" });
    await CandidateDocument.create({ candidateAccountId: accA._id, kind: "resume", isPrimary: true, fileName: "a.pdf", fileType: "pdf" });

    // One candidate applies across TWO different orgs — the dashboard must see both.
    await applicationService.apply(accA._id, { jobId: job1._id });
    await applicationService.apply(accA._id, { jobId: job2._id });

    const dash = await platformAdminService.dashboard();
    expect(dash.candidates.total).toBe(2);
    expect(dash.organizations).toBe(2);
    expect(dash.recruitment.totalJobs).toBe(2);
    expect(dash.recruitment.totalApplications).toBe(2);
    expect(dash.recruitment.applicationsByStatus.applied).toBe(2);
  });
});
