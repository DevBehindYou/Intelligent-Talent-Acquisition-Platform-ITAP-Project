import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

import { SuperAdmin } from "../src/models/SuperAdmin.js";
import { adminAuthService } from "../src/services/adminAuthService.js";
import { generateTotpCode } from "../src/utils/totp.js";

// Phase 4c: admin MFA (TOTP). Real in-memory MongoDB. Valid codes are generated with otplib,
// so the tests are deterministic within the time window.
let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  process.env.SUPER_ADMIN_EMAILS = "admin@platform.com";
}, 600000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongod?.stop();
});

beforeEach(async () => {
  await SuperAdmin.deleteMany({});
});

const makeAdmin = () =>
  adminAuthService.findOrCreateSuperAdmin({ supabaseUserId: "sup-admin", email: "admin@platform.com", fullName: "Admin" });

describe("admin MFA enrollment", () => {
  it("setup returns a secret + QR and stays disabled until a valid code enables it", async () => {
    const admin = await makeAdmin();
    const setup = await adminAuthService.setupMfa(admin._id);
    expect(setup.secret).toBeTruthy();
    expect(setup.otpauthUrl).toContain("otpauth://");
    expect(setup.qrDataUrl).toContain("data:image/png");

    const pending = await SuperAdmin.findById(admin._id).lean();
    expect(pending.mfaEnabled).toBe(false); // not active yet
    expect(pending.mfaSecret).toBe(setup.secret);

    await expect(adminAuthService.enableMfa(admin._id, "000000")).rejects.toMatchObject({ status: 401 });

    const result = await adminAuthService.enableMfa(admin._id, generateTotpCode(setup.secret));
    expect(result.mfaEnabled).toBe(true);
  });

  it("verifyMfaCode accepts a valid code and rejects an invalid one", async () => {
    const admin = await makeAdmin();
    const setup = await adminAuthService.setupMfa(admin._id);
    const fresh = await SuperAdmin.findById(admin._id);
    expect(adminAuthService.verifyMfaCode(fresh, generateTotpCode(setup.secret))).toBe(true);
    expect(adminAuthService.verifyMfaCode(fresh, "123456")).toBe(false);
  });

  it("disable requires a valid code and clears the secret", async () => {
    const admin = await makeAdmin();
    const setup = await adminAuthService.setupMfa(admin._id);
    await adminAuthService.enableMfa(admin._id, generateTotpCode(setup.secret));

    await expect(adminAuthService.disableMfa(admin._id, "000000")).rejects.toMatchObject({ status: 401 });

    await adminAuthService.disableMfa(admin._id, generateTotpCode(setup.secret));
    const after = await SuperAdmin.findById(admin._id).lean();
    expect(after.mfaEnabled).toBe(false);
    expect(after.mfaSecret).toBeFalsy();
  });
});
