# ITAP — Candidate Portal & Platform Admin Enhancement (Corrected Spec v2)

> This is a corrected, codebase-grounded rewrite of the original
> *"Enhanced ITAP Candidate & Admin Platform Development Prompt"*. The original was a
> strong feature wishlist but made assumptions that don't hold against the real ITAP
> codebase, conflated two different "candidate" concepts, and left the load-bearing
> architectural decision (candidate identity vs. multi-tenancy) unstated. This version fixes
> those, maps every ask to what already exists, and sequences the work into shippable phases
> with acceptance criteria.

---

## 0. Corrections to the original brief

The original brief's premises, corrected against the actual repo:

| Original claim | Reality (this repo) |
|---|---|
| "The project is already deployed and functional." | ITAP was a **dev-only scaffold**; a deployment-readiness pass (prod Dockerfiles, nginx, CI, fail-fast env, hardening) was done, but it is **not deployed** and has **no live production data**. Plan for a first deploy, not a live migration. |
| "Ensure migrations are safe." | There is **no migration framework**. Persistence is **MongoDB + Mongoose** (schema-on-write). "Migrations" = additive schema fields + optional backfill scripts, not versioned DDL. |
| "Create RBAC / audit logging / notifications / interviews / security." | These **already exist** — see §1.2. The task is to **extend**, not recreate. |
| Single-tenant assumptions throughout | ITAP is **multi-tenant**: every `User`, `Job`, `Candidate`, etc. is scoped by `organizationId`. This is the single most important constraint the original ignored (see §2). |

### 0.1 Real baseline (what ITAP is)

- **Frontend**: React 18 + Vite + Tailwind, MVVM (View → ViewModel hook → `*Api.js` → axios). Feature-folder structure under `frontend/src/features/*`.
- **API**: Node/Express, `routes → controllers → services → models`. Auth via Supabase (IdP only) + a Mongo `User` mirror + an Express-issued httpOnly JWT **session cookie** (`itap_session`, 15-min TTL) and refresh cookie (`itap_refresh`).
- **AI service**: Python/FastAPI (parsing, embeddings, LLM adapter), gated by a shared secret.
- **Data**: MongoDB (system of record), Redis (BullMQ + rate limiting), Qdrant (vectors, optional), Supabase Storage (resumes; local-disk dev fallback).

### 0.2 Extend, don't duplicate — existing capabilities map

Before building anything the brief asks for, reuse these:

| Brief asks for | Already in repo | Action |
|---|---|---|
| RBAC (§17) | `User.role` enum `["recruiter","hiring_manager","hr_admin"]`, `middleware/requireRole.js`, `requireSession.js` | **Extend**: add `candidate` + `super_admin` as *user types* (see §2), add a permission matrix |
| Audit logging (§20) | `models/AuditLog.js` + `middleware/auditLogger.js` | **Extend**: add new event types + actor/target metadata |
| Notifications (§11) | `models/Notification.js`, `shared/store/notificationsStore.js`, socket events in `sockets/pipelineEvents.js` | **Extend**: candidate-facing notification types + delivery-channel abstraction |
| Interviews (§7) | `models/Interview.js`, `services/interviewService.js`, recruiter pages | **Extend**: add a candidate-side read view (redacted) |
| Resume upload/storage (§4) | `models/Resume.js`, `services/storageService.js` (signed URLs, private bucket) | **Reuse**: attach candidate ownership; do **not** build a second storage layer |
| Job CRUD (§5) | `models/Job.js`, `services/jobService.js` | **Reuse + extend** Job fields for discovery filters (see §5.1) |
| Pipeline/status (§6) | `models/PipelineStage.js` (7-stage enum) | **Project** to a candidate-safe status view (see §4.6) |
| Rate limiting / headers / CORS / cookies (§18) | helmet, `rate-limit-redis`, httpOnly+sameSite cookies, fail-fast env, AI shared-secret | **Reuse**; only add what's candidate/admin-specific |
| Security review (§18) | Much already hardened in the readiness pass | **Reconcile** the checklist with §8 before re-doing work |

**Entities that genuinely do NOT exist and must be added** (§2): `CandidateAccount`, `Application`, `Offer`, `Assessment` + submissions, `OnboardingCase` + tasks, `Message`/`Conversation`, `CandidateDocument`.

---

## 1. The load-bearing decision: candidate identity vs. multi-tenancy

**This must be decided before any code.** The original brief conflated two different things both called "candidate":

1. **`Candidate` (existing)** — a **recruiter-owned record inside one org's tenant**, created from an uploaded resume. It has `organizationId`, no login, and is edited by recruiters.
2. **"Candidate" (the brief)** — a **self-registering job seeker** with their own login who applies to jobs across *many* orgs.

These cannot be the same document. Every `User` requires an `organizationId` ([`models/User.js:6`](../backend/src/models/User.js)), so a job seeker — who belongs to no recruiter org — cannot be modeled as a `User` without breaking tenant isolation.

### 1.1 Decision (recommended)

- Introduce **`CandidateAccount`** — a **global identity, no `organizationId`**. This is the job seeker's login and canonical profile.
- Introduce **`Application`** — the **join entity**: one `CandidateAccount` applying to one org's `Job`. It carries the application's status, history, and answers, and is the **single source of truth** for candidate/recruiter state (§5).
- Keep the existing tenant-scoped **`Candidate`** as the **recruiter-side projection**. When a `CandidateAccount` applies to an org's job, upsert/link a `Candidate` in that org (`Candidate.candidateAccountId`) so all existing recruiter features (matching, pipeline, interviews) keep working unchanged.
- A `CandidateAccount` therefore fans out into **N per-org `Candidate` projections** — one per org they've applied to — preserving tenant isolation (Org A never sees that the person also applied to Org B).

### 1.2 Auth separation

- Candidates authenticate through Supabase too, but map to a `CandidateAccount` (no org) instead of a `User`.
- The Express session cookie gains a **`userType` claim**: `"candidate" | "staff" | "super_admin"`. Middleware (`requireCandidate`, `requireStaff`, `requireSuperAdmin`) hard-separates the three surfaces at the API layer. A candidate token must be rejected by every staff/admin route and vice versa — enforced server-side, never by route-hiding.

---

## 2. Data model additions (Mongoose)

All new collections follow existing conventions: `timestamps: true`, explicit indexes, ownership scoping. Global entities have **no** `organizationId`; tenant entities keep it.

| Model | Scope | Key fields | Notes / indexes |
|---|---|---|---|
| `CandidateAccount` | **Global** | `supabaseUserId` (unique), `email` (unique), profile subdocs (§4.3), `emailVerifiedAt`, `isActive`, `suspendedAt` | The job-seeker identity. Index `supabaseUserId`, `email`. |
| `Application` | Org (denormalized `organizationId` from Job) | `candidateAccountId`, `jobId`, `organizationId`, `candidateId` (projection link), `resumeId`, `status`, `answers[]`, `submittedAt`, `withdrawnAt` | Unique `{candidateAccountId, jobId}` to block duplicate applications (§4.5). Index `{organizationId, status}`, `{candidateAccountId, status}`. |
| `ApplicationEvent` | Org | `applicationId`, `type`, `fromStatus`, `toStatus`, `actorType`, `actorId`, `visibility` (`candidate`\|`internal`), `metadata`, `createdAt` | Timeline + audit for one application. `visibility:"internal"` rows are **never** returned to candidates (§4.6). Index `{applicationId, createdAt}`. |
| `Offer` | Org | `applicationId`, `status` (`draft`\|`released`\|`accepted`\|`declined`\|`rescinded`), `documentIds`, `acceptanceDeadline`, `releasedBy`, `respondedAt` | Confirmation-required actions; auditable. |
| `Assessment` | Org | `jobId`, `type`, `title`, `instructions`, `deadline` (definition) | Recruiter-authored. |
| `AssessmentAssignment` | Org | `assessmentId`, `applicationId`, `status`, `submittedAt`, `submissionDocIds` | Candidate-visible surface; **never** exposes answers/scoring. |
| `OnboardingCase` | Org | `applicationId`, `joiningDate`, `progressPct`, status | Created on hire. |
| `OnboardingTask` | Org | `onboardingCaseId`, `title`, `type`, `status`, `dueDate`, `documentId` | Checklist items. |
| `Conversation` / `Message` | Org | participants (`candidateAccountId`, staff `userId`), `body`, `attachments[]`, `readAt` | Candidate↔recruiter only; **no** internal notes leak (§4.9). |
| `CandidateDocument` | Global or Org | `candidateAccountId`, `kind` (resume/id/tax/etc.), `storagePath`, `mime`, `size`, `applicationId?` | Reuses `storageService`; private, signed-URL access only. Sensitive (ID/bank/tax) docs are access-controlled to that candidate + authorized staff. |

**Also extend existing models** (additive, non-breaking):

- `Candidate`: add `candidateAccountId` (nullable ref) linking the projection to the global account.
- `Job`: add discovery fields (§5.1).
- `User`: add `super_admin` handling via `userType` (see §6) — decide whether super-admin is a `role` value or a separate flag; recommended: a separate global collection or an `isSuperAdmin`/`userType` claim, **not** an org-scoped role.

---

## 3. Authentication, sessions & the logout requirement

### 3.1 Candidate auth flow
Sign up, login, logout, email verification, forgot/reset password, change password — all via Supabase Auth (mirroring the existing staff flow in `authController`/`authService`), but resolving to a `CandidateAccount`. Social login is an optional Supabase provider config; architecture-compatible, defer implementation.

### 3.2 Resolve the "logout must invalidate the token" requirement
The brief's §18 "critical requirement" **conflicts with the current design**: ITAP uses **stateless JWT session cookies with no server-side revocation**, so today logout only clears the cookie client-side and a stolen token stays valid until its 15-min expiry. To actually meet the requirement:

1. Add a **`jti`** (token id) claim to `itap_session`.
2. On logout (and on password change / forced logout / suspend), write the `jti` (or a per-user `tokensValidAfter` timestamp) to a **Redis denylist** with TTL = remaining token lifetime.
3. `requireSession`/`requireCandidate` check the denylist → immediate invalidation.
4. **Revoke the Supabase refresh token** server-side (the refresh endpoint already exchanges it — add a revoke call) so silent-refresh can't resurrect the session.
5. **Disconnect the user's sockets** on logout (`io.to(user:<id>).disconnectSockets()`).
6. Frontend: on `itap:session-expired`, purge React Query cache and redirect to the correct login (candidate vs staff vs admin). Guard against back-button access by never rendering protected shells without a live `me` check.

### 3.3 Never trust client-supplied role/identity
All authorization derives from the verified session claim, re-checked server-side on every protected route (§7, §8).

---

## 4. Candidate portal

For each area: **reuse** what exists, add the new pieces, and enforce the privacy rule. UI must be responsive/accessible (reuse `shared/components/*`, the existing Tailwind tokens, and the mobile off-canvas pattern already in `Sidebar.jsx`).

- **4.1 Dashboard** — profile-completion %, recommended/open jobs (from `Job` where `status:"open"`, cross-org public projection), recently applied (`Application`), status summary, upcoming interviews (`Interview` candidate view), pending actions (open `AssessmentAssignment`/`OnboardingTask`), notifications.
- **4.2 Auth** — §3.
- **4.3 Profile** — the `CandidateAccount` profile (basic info, headline, summary, skills, experience, education, certifications, projects, languages, links, preferences, availability, salary expectations). **Distinct from** the recruiter's `Candidate` record; validated; sensitive fields access-controlled.
- **4.4 Resume management** — reuse `Resume` + `storageService`; add candidate ownership, multiple resumes, primary selection, replace/delete, per-application selection. Private; signed-URL access only; validate type/size (reuse multer limits).
- **4.5 Job discovery & application** — browse/search/filter/sort public jobs; multi-step apply (select job → review JD → confirm profile → pick resume → answer questions → upload docs → review → submit → confirm). Enforce the unique `{candidateAccountId, jobId}` constraint to prevent duplicates; support withdraw.
- **4.6 Application tracking** — the candidate-safe **status projection**. Map the brief's ~15 statuses onto the real 7-stage recruiter enum (`applied, screened, shortlisted, interviewing, offer, hired, rejected`) plus `Application`/`Offer`/`Onboarding` state, e.g.:

  | Candidate-facing status | Derived from |
  |---|---|
  | Applied / Application Received | `Application.submittedAt` |
  | Under Review | `PipelineStage.stage ∈ {screened}` |
  | Shortlisted | `shortlisted` |
  | Assessment Pending/Completed | `AssessmentAssignment.status` |
  | Interview Scheduled/Completed | `Interview` state |
  | Offer Released/Accepted/Declined | `Offer.status` |
  | Hired / Onboarding | `hired` / `OnboardingCase` |
  | Withdrawn | `Application.withdrawnAt` |

  Timeline comes from `ApplicationEvent` filtered to `visibility:"candidate"`. **Internal recruiter notes / evaluation data are never sent to candidates.**
- **4.7 Interviews** — candidate read view of `Interview` (date/time/type/link/instructions/status), redacted of internal feedback. Reschedule where supported. Design for future Meet/Teams/Zoom/calendar integration behind a provider interface.
- **4.8 Assessments** — candidate view of `AssessmentAssignment` (instructions, deadline, attempt/submission status); never exposes answers or scoring logic.
- **4.9 Offers, onboarding, notifications, messaging** — per §2 models; confirmation-required destructive actions; onboarding sensitive docs access-controlled; messaging excludes internal HR notes.

---

## 5. Recruiter/HR integration — single source of truth

`Application` is the join; recruiter dashboards read/write it. A candidate-side change (apply, withdraw, accept offer) and a recruiter-side change (advance stage, schedule interview, release offer) both mutate the **same** `Application`/`ApplicationEvent`/`Offer` records and emit socket events, so both sides stay consistent. The recruiter's existing `Candidate`/`PipelineStage` views continue to work via the projection link (§1.1).

### 5.1 Job model extensions for discovery
The current `Job` lacks fields the brief's filters assume. Add (additive): `workMode` (`onsite|hybrid|remote`) — distinct from `employmentType`; `experienceLevel` label; `salaryRange {min,max,currency,visible}`; `publishedAt`; a `visibility`/`public` flag so only intentionally-published jobs appear in the candidate portal.

---

## 6. Super Admin panel (`/admin-panel`)

Reconciled with multi-tenancy: **Super Admin is a global role** (`userType:"super_admin"`, no `organizationId`), modeled outside the org — not an org-scoped `hr_admin`. Decide the tenancy scope explicitly (recommended: **platform-wide aggregate metrics + per-org drill-down**, with all cross-tenant access audited).

- Separate login surface at `/admin-panel` (own route tree; not linked from candidate/recruiter nav). **URL obscurity is not security** — every `/api/admin/*` endpoint enforces `requireSuperAdmin` server-side.
- Strong auth: password policy, session timeout, denylist-backed logout (§3.2), account lockout (reuse rate limiter), brute-force protection, **MFA/TOTP architecture** (pluggable; implement the verification step, store the secret encrypted).
- Dashboard metrics (§15 of the brief) + CRUD (§16) with confirmation dialogs and **soft-delete/anonymize** instead of hard delete where audit/retention applies.

---

## 7. RBAC (consolidated — replaces the brief's §14/17/24 overlap)

Single permission matrix, enforced at the API layer with **resource-level ownership checks** (IDOR/BOLA):

| Actor | Scope |
|---|---|
| Candidate | Only own `CandidateAccount`, own `Application`s, own documents, own onboarding. |
| Recruiter | Candidates/applications within their org (and assignment rules if added). |
| HR/Admin (`hr_admin`,`hiring_manager`) | Broader recruitment/onboarding within their org. |
| Super Admin | Platform administration across tenants (audited). |

Enforcement pattern: `requireSession` → `require<UserType>` → service-layer ownership assertion (e.g. `Application.findOne({ _id, candidateAccountId: session.sub })`). **A candidate hitting `/api/candidate/applications/:id` for someone else's id must 404/403 — verified by test (§10).**

---

## 8. Security (consolidated — replaces §18/19/24/26 overlap)

**Already hardened** (do not redo): helmet security headers, CORS locked to `CLIENT_ORIGIN`, Redis-backed rate limiting, httpOnly+sameSite+secure cookies, fail-fast prod env validation, AI-service shared-secret auth, Mongoose org-scoped tenant isolation.

**New work for this enhancement**: candidate/staff/admin session separation (§3), denylist-backed logout (§3.2), IDOR/BOLA ownership checks on every candidate/admin resource (§7), file-upload validation + storage privacy for the new document types (reuse `storageService`; sanitize filenames including Windows separators — the current dev local-disk path only strips `/`), sensitive-data minimization/masking (IDs, bank, tax), MFA for admin, and audit coverage for all new sensitive actions (§9). Follow the deployment region's data-protection rules (e.g. GDPR) — a stakeholder decision (§11).

---

## 9. Audit & monitoring (extend existing `AuditLog`)

Reuse `models/AuditLog.js` + `middleware/auditLogger.js`; add event types: candidate signup/login/logout/failed-login, password reset, application submitted/withdrawn, status change, interview change, assessment assigned/submitted, offer released/accepted/declined, onboarding task change, admin CRUD, suspension/reactivation, role/permission change. Record actor (type+id), action, target, result, and safe request metadata. **Never** log passwords, tokens, or document contents.

---

## 10. Phased delivery plan (with acceptance criteria)

Each phase ships independently, keeps existing recruiter features green, and lands with tests.

- **Phase 0 — Foundation.** `CandidateAccount` + `Application` + `ApplicationEvent` models; `userType` claim + `requireCandidate/requireStaff/requireSuperAdmin`; projection link on `Candidate`. **DoD**: staff app unaffected (existing tests pass); a candidate token is rejected by all staff routes (test).
- **Phase 1 — Candidate core.** Candidate auth, profile, resume management, public job discovery (+ Job field extensions), multi-step apply, application tracking (candidate-safe projection). **DoD**: a candidate can register → complete profile → apply → see status; IDOR test on `/applications/:id` passes; duplicate application blocked.
- **Phase 2 — Communication.** Candidate interview view, notifications (extended), messaging. **DoD**: recruiter scheduling an interview appears candidate-side in realtime; no internal notes leak (test).
- **Phase 3 — Assessments, offers, onboarding.** **DoD**: offer accept/decline is confirmation-gated + audited; onboarding docs are access-controlled.
- **Phase 4 — Super Admin.** `/admin-panel` auth surface, platform dashboard, CRUD with soft-delete, MFA architecture. **DoD**: every `/api/admin/*` route enforces `requireSuperAdmin` (test); destructive actions soft-delete.
- **Phase 5 — Hardening & E2E.** Denylist-backed logout, socket termination, full authz test matrix, production-style verification. **DoD**: after logout, protected API calls fail and cached data is purged (test).

---

## 11. Decisions still needed from stakeholders

1. **Candidate identity model** — confirm the global `CandidateAccount` + per-org `Candidate` projection (§1). This is the gate for everything else.
2. **Super-admin tenancy scope** — platform-wide aggregate + per-org drill-down, or something narrower? (§6)
3. **Data-protection region** — which privacy regime governs (GDPR/CCPA/other)? Drives retention/anonymization/consent.
4. **Providers** — email/SMS for notifications; TOTP/MFA; calendar/video for interviews. Architect behind interfaces now, pick vendors later.
5. **Application status taxonomy** — confirm the candidate-facing vocabulary and its mapping to the 7-stage recruiter enum (§4.6), or extend the enum.

---

## 12. Testing (ITAP-specific)

Reuse **Vitest**; add **supertest** for API-level authz tests. Minimum matrix:
- **Authz**: candidate cannot reach staff/admin endpoints; recruiter cannot reach super-admin; candidate cannot read another candidate's application/profile/documents (IDOR); privilege escalation blocked.
- **Functional**: registration, apply, tracking projection correctness (no internal fields), interview visibility, assessment/offer/onboarding flows, admin CRUD soft-delete.
- **Security**: logout invalidation (denylist), file-upload abuse, rate-limit enforcement, injection/XSS/CSRF where applicable.
