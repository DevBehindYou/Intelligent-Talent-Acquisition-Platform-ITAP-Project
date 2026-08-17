# ITAP — Database Schema
**Document 3 of 9**

---

## 1. How Supabase and MongoDB Divide Responsibility

Supabase owns **identity only**:

```
Supabase (Postgres, managed by Supabase Auth)
  auth.users
    id (uuid)            ← the ONLY thing MongoDB stores a reference to
    email
    encrypted_password
    email_confirmed_at
    raw_app_meta_data
    ...
```

MongoDB owns **everything else**, including a `users` collection that mirrors just enough
identity data (denormalized at signup, via a Supabase Auth webhook / trigger) to avoid a
network hop to Supabase on every request:

```
MongoDB `users` collection
  _id                    ← Mongo ObjectId, used everywhere else in the app
  supabaseUserId          ← the Supabase auth.users.id (uuid), unique index
  organizationId
  email
  fullName
  role                    ← "recruiter" | "hiring_manager" | "hr_admin"
  ...
```

Every write to MongoDB uses `_id` / `organizationId`. `supabaseUserId` exists solely to map
an incoming verified JWT (see Document 4) to the correct Mongo user document.

---

## 2. Collections

### 2.1 `organizations`
```
_id
name
plan                    // "starter" | "growth" | "enterprise"
scoringDefaults: {
  skillsWeight: Number,       // default 0.4
  experienceWeight: Number,   // default 0.3
  educationWeight: Number,    // default 0.15
  domainWeight: Number        // default 0.15
}
dataRetentionDays: Number     // candidate PII auto-purge window
createdAt, updatedAt
```

### 2.2 `users`
```
_id
supabaseUserId          (String, unique, indexed)
organizationId          (ObjectId, indexed)
email
fullName
role                    // "recruiter" | "hiring_manager" | "hr_admin"
avatarUrl
isActive
lastLoginAt
createdAt, updatedAt
```
Index: `{ organizationId: 1, role: 1 }`, `{ supabaseUserId: 1 }` (unique)

### 2.3 `jobs`
```
_id
organizationId          (indexed)
title
department
description
requiredSkills: [ { name, weight, mustHave: Boolean } ]
niceToHaveSkills: [String]
experienceMin, experienceMax
location
employmentType          // "full_time" | "contract" | "remote"
status                  // "draft" | "open" | "on_hold" | "closed"
jdEmbeddingRef           // pointer / id to the vector stored in Qdrant
scoringWeights           // overrides organizationId.scoringDefaults, optional
createdBy                (ObjectId → users)
createdAt, updatedAt
```
Index: `{ organizationId: 1, status: 1 }`

### 2.4 `candidates`
```
_id
organizationId          (indexed)
fullName
email
phone
currentTitle
totalExperienceYears
education: [ { degree, institution, year } ]
certifications: [String]
skills: [ { name, category, confidence } ]   // category: technical | soft | domain | cloud
resumeIds: [ObjectId]                        // may apply to multiple jobs
sourceType                                   // "upload" | "referral" | "career_site"
duplicateOfCandidateId                       // set if flagged as a near-duplicate
consentGivenAt                               // candidate data-processing consent timestamp
createdAt, updatedAt
```
Index: `{ organizationId: 1, email: 1 }` (compound, used for dedup lookups)

### 2.5 `resumes`
```
_id
organizationId
candidateId
jobId                    // which requisition this upload was for (nullable = general pool)
fileUrl                  // Supabase Storage signed-URL reference (private bucket path, not the URL itself)
fileType                 // "pdf" | "docx" | "txt"
status                   // "queued" | "parsing" | "parsed" | "failed"
parsedAt
rawExtractedText         // stored for re-parsing / audit, not shown in UI by default
uploadedBy                (ObjectId → users)
createdAt, updatedAt
```
Index: `{ organizationId: 1, jobId: 1, status: 1 }`

### 2.6 `matchScores`
```
_id
organizationId
candidateId              (indexed)
jobId                     (indexed)
overallScore              // 0-100
skillScore
experienceScore
educationScore
domainScore
explanation               // short LLM-generated plain-language reasoning
reasonTags: [String]      // e.g. ["required-skills-present","similar-project-experience"]
scoredAt
scoringVersion            // which weight config produced this score, for audit/reproducibility
```
Index: `{ jobId: 1, overallScore: -1 }` (drives the ranked list query)
Unique compound index: `{ candidateId: 1, jobId: 1 }`

### 2.7 `pipelineStages`
```
_id
organizationId
jobId
candidateId
stage                     // "applied" | "screened" | "shortlisted" | "interviewing" | "offer" | "hired" | "rejected"
movedBy                    (ObjectId → users)
movedAt
notes
```
Index: `{ jobId: 1, stage: 1 }`

### 2.8 `interviewQuestions`
```
_id
organizationId
candidateId
jobId
question
category                  // "technical" | "problem_solving" | "behavioral"
generatedAt
```

### 2.9 `interviews`
```
_id
organizationId
candidateId
jobId
scheduledAt
interviewers: [ObjectId]   // → users
status                     // "scheduled" | "completed" | "cancelled" | "no_show"
feedback: [ { userId, rating, comments, submittedAt } ]
createdAt, updatedAt
```

### 2.10 `notifications`
```
_id
organizationId
userId                     (indexed)
type                       // "ranking_ready" | "interview_scheduled" | "stage_changed"
payload
readAt
createdAt
```

### 2.11 `auditLogs`
```
_id
organizationId
actorUserId
action                      // "candidate.viewed" | "job.created" | "scoring_weights.updated" ...
targetType, targetId
metadata
ipAddress
createdAt
```
Index: `{ organizationId: 1, createdAt: -1 }`, TTL index tied to `dataRetentionDays` where
applicable.

---

## 3. Entity Relationship Overview

```
organizations 1───* users
organizations 1───* jobs
organizations 1───* candidates
jobs 1───* resumes            (a resume upload is tied to one requisition)
candidates 1───* resumes       (a candidate can apply to several jobs over time)
jobs *───* candidates          via matchScores + pipelineStages (junction collections)
candidates 1───* interviewQuestions
candidates 1───* interviews
users 1───* auditLogs (as actor)
```

---

## 4. Vector Store (Qdrant) — Not MongoDB, Referenced From It

```
Collection: candidate_vectors
  point id      = candidateId (Mongo ObjectId as string)
  vector        = 768-dim Sentence-BERT embedding of parsed resume text
  payload       = { organizationId, candidateId, skills: [...] }   // for pre-filtering

Collection: job_vectors
  point id      = jobId
  vector        = 768-dim embedding of the job description
  payload       = { organizationId, jobId }
```

Qdrant is queried with an `organizationId` payload filter on every search — tenant isolation
is enforced at the vector-store layer too, not only in MongoDB.

---

## 5. Indexing & Multi-Tenancy Rules

- Every collection above starts with `organizationId` as the first field in its primary
  compound index — this is a hard rule, not an optimization, since it's also how tenant
  isolation is enforced at the query-builder level in the service layer.
- No service method may accept a raw candidate/job `_id` from the client without also
  scoping the query by the authenticated user's `organizationId`.
- `dataRetentionDays` (per organization) drives a scheduled job that soft-deletes candidate
  PII past the retention window, keeping `matchScores` and `auditLogs` in an anonymized form
  for historical analytics.
