# Intelligent Talent Acquisition Platform (ITAP)
### AI-Powered Resume Screening & Recruitment Intelligence System
**Document 1 of 9 — Project Overview & Business Requirements**

---

## 1. Executive Summary

ITAP is a full-stack recruitment intelligence platform that automates resume parsing, skill
extraction, semantic candidate matching, AI-assisted interview question generation, and
recruiter analytics — while keeping a human recruiter in control of every hiring decision.

This document set describes ITAP as it will actually be built:

| Layer | Choice |
|---|---|
| Frontend | React 18 (Vite), JavaScript (no TypeScript), Tailwind CSS |
| State / data fetching | Zustand + TanStack Query |
| Backend | Node.js + Express |
| Primary database | MongoDB (Mongoose ODM) |
| Auth provider | Supabase Auth (JWT), enforced with httpOnly cookies |
| AI / NLP layer | Python microservice (resume parsing, embeddings) + pluggable LLM |
| Vector search | Qdrant |

Supabase is used **only** for authentication and identity (it owns `auth.users`, JWT issuance,
password reset, OAuth). All business data — jobs, candidates, resumes, scores, analytics —
lives in MongoDB. This split is deliberate: Supabase's Postgres auth schema is not used as the
system of record, MongoDB is. Document 4 (Auth & Security) covers exactly how a Supabase JWT
gets verified by an Express backend that has nothing to do with Postgres.

---

## 2. Problem Statement

Recruiters receive hundreds to thousands of applications per open role.

```
Software Engineer Opening
        │
        ▼
  1,200 Applications
        │
        ▼
  Manual Resume Review   ◄── bottleneck: hours per requisition
        │
        ▼
    Shortlisting
        │
        ▼
     Interviews
```

Core pain points:

- Manual screening does not scale past a few dozen resumes per role.
- Candidates describe the same skill in inconsistent language ("ML engineer" vs. "AI
  developer" vs. "applied scientist"), so keyword search under-matches good candidates.
- Ranking is inconsistent between recruiters and across time.
- Recruiters spend more time reading resumes than talking to qualified people.
- Interview prep is repeated from scratch for every candidate.

---

## 3. Proposed Solution

```
Job Description  +  Candidate Resumes
              │
              ▼
        Resume Parser
              │
              ▼
       Skill Extraction
              │
              ▼
      Semantic Matching (embeddings + vector search)
              │
              ▼
      Candidate Ranking (explainable)
              │
              ▼
  Interview Question Generator
              │
              ▼
     Recruiter Dashboard
```

The system never auto-rejects or auto-advances a candidate. Every AI score ships with a
plain-language explanation, and every stage transition requires a human click.

---

## 4. Business Objectives

**Primary**

1. Auto-parse resumes (PDF / DOCX / TXT) into structured candidate profiles.
2. Extract technical, soft, domain, and cloud/tooling skills with confidence scores.
3. Match resumes to job descriptions using embeddings, not keyword search.
4. Rank candidates with an explainable, recruiter-adjustable scoring model.
5. Generate role- and candidate-specific interview questions.
6. Give recruiters a dashboard for pipeline health and hiring velocity.

**Secondary**

7. Recruiter productivity analytics (time-to-screen, time-to-hire, offer acceptance).
8. A persistent, searchable talent database (not just per-job applicants).
9. Duplicate / near-duplicate resume detection.
10. Natural-language talent search ("find Python developers with Kubernetes and healthcare
    experience").

**Non-goals for v1** (explicitly out of scope): automated background checks, payroll,
onboarding/offboarding workflows, video interviewing infrastructure, and any automated
reject/advance decision made without a human click.

---

## 5. Target Users & Personas

### 5.1 Recruiter
**Goal:** fill roles fast without losing good candidates to noise.
**Can:** create/edit jobs, bulk-upload resumes, review AI rankings and explanations, message
and schedule candidates, adjust their own view's scoring weights, run talent search.
**Cannot:** change org-wide scoring configuration, manage other recruiters, view org-wide
audit logs.

### 5.2 Hiring Manager
**Goal:** make a confident final call between a short list of strong candidates.
**Can:** view jobs they own, compare shortlisted candidates side-by-side, leave structured
feedback, approve/reject stage progression, view AI insights and interview question sets.
**Cannot:** upload resumes directly, edit job requisitions, access the full applicant pool
(only what's been shortlisted to them).

### 5.3 HR Administrator
**Goal:** keep the platform compliant, consistent, and measurable across the org.
**Can:** manage recruiter/hiring-manager accounts and roles, configure org-wide scoring
weights and rubric templates, view cross-team analytics, view audit logs, manage data
retention and candidate-consent settings.
**Cannot:** be restricted from anything within their org (highest internal role); cross-org
access is prevented by tenant isolation regardless of role.

| Capability | Recruiter | Hiring Manager | HR Admin |
|---|---|---|---|
| Create / edit job postings | ✓ | – | ✓ |
| Upload / bulk-upload resumes | ✓ | – | ✓ |
| View full applicant pool for a job | ✓ (own jobs) | – | ✓ (org-wide) |
| View shortlisted candidates | ✓ | ✓ | ✓ |
| Adjust scoring weights (per-job) | ✓ | – | ✓ |
| Adjust scoring weights (org default) | – | – | ✓ |
| Schedule interviews | ✓ | request only | ✓ |
| Approve stage progression | ✓ | ✓ | ✓ |
| Manage user accounts / roles | – | – | ✓ |
| View audit logs | – | – | ✓ |
| Run natural-language talent search | ✓ | – | ✓ |

---

## 6. Success Metrics

| Metric | Target for v1 |
|---|---|
| Time-to-screen (upload → ranked list) | < 5 minutes for 500 resumes |
| Recruiter-reported ranking trust ("would I have shortlisted this candidate?") | > 80% agreement |
| Reduction in manual screening time | ≥ 60% vs. baseline |
| Duplicate-resume false positive rate | < 2% |
| Dashboard load time (P95) | < 1.5s |
| WCAG conformance | 2.2 AA on all core recruiter/HR flows |

---

## 7. Related Documents

1. `00-project-overview.md` — this document
2. `01-technical-architecture.md` — stack, MVVM pattern, folder structure, system diagram
3. `02-database-schema.md` — MongoDB collections, indexes, Supabase auth relationship
4. `03-api-documentation.md` — REST endpoint reference
5. `04-auth-security.md` — Supabase Auth + JWT + cookie flow, RBAC, security requirements
6. `05-ui-ux-design-system.md` — design tokens, typography, component states (for the design team)
7. `06-pages-and-user-flows.md` — full page inventory, wireframe-level layouts, user flows
8. `07-component-library.md` — component-by-component spec with props and states
9. `08-development-roadmap.md` — phased delivery plan
