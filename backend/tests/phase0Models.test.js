import { describe, it, expect } from "vitest";
import mongoose from "mongoose";

// Importing the models registers them on the mongoose singleton (no DB connection needed).
// This guards against schema typos / duplicate model names and pins the key invariants of the
// Phase 0 data model (docs/13 §1–2): CandidateAccount is global, Application is the join.
import { CandidateAccount } from "../src/models/CandidateAccount.js";
import { Application } from "../src/models/Application.js";
import { ApplicationEvent } from "../src/models/ApplicationEvent.js";
import { Candidate } from "../src/models/Candidate.js";

describe("Phase 0 models", () => {
  it("registers all three new models", () => {
    expect(mongoose.models.CandidateAccount).toBeDefined();
    expect(mongoose.models.Application).toBeDefined();
    expect(mongoose.models.ApplicationEvent).toBeDefined();
  });

  it("CandidateAccount is a GLOBAL identity (no organizationId)", () => {
    expect(CandidateAccount.schema.path("organizationId")).toBeUndefined();
    expect(CandidateAccount.schema.path("supabaseUserId")).toBeDefined();
  });

  it("Application is the tenant-scoped join between account and job", () => {
    expect(Application.schema.path("candidateAccountId")).toBeDefined();
    expect(Application.schema.path("jobId")).toBeDefined();
    expect(Application.schema.path("organizationId")).toBeDefined();
  });

  it("Application blocks duplicate applications via a unique candidate+job index", () => {
    const hasUnique = Application.schema.indexes().some(
      ([fields, opts]) => fields.candidateAccountId === 1 && fields.jobId === 1 && opts?.unique
    );
    expect(hasUnique).toBe(true);
  });

  it("ApplicationEvent carries the candidate|internal visibility boundary", () => {
    const visibility = ApplicationEvent.schema.path("visibility");
    expect(visibility).toBeDefined();
    expect(visibility.enumValues).toEqual(expect.arrayContaining(["candidate", "internal"]));
  });

  it("Candidate gains a nullable link to the global account (projection)", () => {
    const path = Candidate.schema.path("candidateAccountId");
    expect(path).toBeDefined();
    expect(path.isRequired).toBeFalsy();
  });
});
