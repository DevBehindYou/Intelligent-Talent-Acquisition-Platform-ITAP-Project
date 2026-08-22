import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

import { Organization } from "../src/models/Organization.js";
import { Job } from "../src/models/Job.js";
import { CandidateAccount } from "../src/models/CandidateAccount.js";
import { CandidateDocument } from "../src/models/CandidateDocument.js";
import { Candidate } from "../src/models/Candidate.js";
import { ApplicationEvent } from "../src/models/ApplicationEvent.js";
import { Notification } from "../src/models/Notification.js";
import { applicationService } from "../src/services/applicationService.js";
import { interviewService } from "../src/services/interviewService.js";
import { candidateInterviewService } from "../src/services/candidateInterviewService.js";

// Phase 2 DoD (docs/13 §10): a recruiter scheduling an interview reaches the candidate side, and
// internal notes/feedback never leak. Runs against a real in-memory MongoDB.
let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  await Promise.all([Candidate.init(), ApplicationEvent.init()]);
}, 600000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongod?.stop();
});

beforeEach(async () => {
  const { collections } = mongoose.connection;
  await Promise.all(Object.values(collections).map((c) => c.deleteMany({})));
});

// Seed an org + open job, and have candidate A apply (which creates the Application + the per-org
// Candidate projection the recruiter schedules against).
async function seed() {
  const org = await Organization.create({ name: "Acme Inc" });
  const job = await Job.create({ organizationId: org._id, title: "Backend Engineer", status: "open", isPublic: true });
  const accountA = await CandidateAccount.create({ supabaseUserId: "sup-A", email: "a@example.com", fullName: "Alice" });
  const accountB = await CandidateAccount.create({ supabaseUserId: "sup-B", email: "b@example.com", fullName: "Bob" });
  await CandidateDocument.create({ candidateAccountId: accountA._id, kind: "resume", isPrimary: true, fileName: "a.pdf", fileType: "pdf" });
  await applicationService.apply(accountA._id, { jobId: job._id });
  const projection = await Candidate.findOne({ candidateAccountId: accountA._id }).lean();
  return { org, job, accountA, accountB, projectionId: projection._id };
}

describe("candidate interview view", () => {
  it("shows the interview logistics but redacts internal notes and feedback", async () => {
    const { org, job, accountA, projectionId } = await seed();

    const interview = await interviewService.schedule(org._id, {
      candidateId: projectionId,
      jobId: job._id,
      scheduledAt: new Date(Date.now() + 86400000),
      notes: "INTERNAL: probe system design depth",
      type: "video",
      meetingLink: "https://meet.example/abc",
      instructions: "Bring a code sample",
    });
    await interviewService.submitFeedback(org._id, interview._id, new mongoose.Types.ObjectId(), {
      rating: 2,
      comments: "weak on distributed systems",
    });

    const view = await candidateInterviewService.get(accountA._id, interview._id);

    // Candidate-facing logistics are present…
    expect(view.type).toBe("video");
    expect(view.meetingLink).toBe("https://meet.example/abc");
    expect(view.instructions).toBe("Bring a code sample");
    // …and the internal fields are gone.
    expect("notes" in view).toBe(false);
    expect("feedback" in view).toBe(false);
    expect("interviewers" in view).toBe(false);
    const serialized = JSON.stringify(view);
    expect(serialized).not.toContain("system design");
    expect(serialized).not.toContain("distributed systems");
  });

  it("is IDOR-safe: another candidate cannot read the interview", async () => {
    const { org, job, accountB, projectionId } = await seed();
    const interview = await interviewService.schedule(org._id, {
      candidateId: projectionId,
      jobId: job._id,
      scheduledAt: new Date(),
    });
    await expect(candidateInterviewService.get(accountB._id, interview._id)).rejects.toMatchObject({ status: 404 });
  });

  it("notifies the candidate and records a candidate-visible application event", async () => {
    const { org, job, accountA, projectionId } = await seed();
    await interviewService.schedule(org._id, { candidateId: projectionId, jobId: job._id, scheduledAt: new Date() });

    const notifs = await Notification.find({ candidateAccountId: accountA._id }).lean();
    expect(notifs.some((n) => n.type === "interview_scheduled_candidate")).toBe(true);

    const events = await ApplicationEvent.find({ visibility: "candidate", type: "interview_scheduled" }).lean();
    expect(events.length).toBeGreaterThan(0);
  });
});
