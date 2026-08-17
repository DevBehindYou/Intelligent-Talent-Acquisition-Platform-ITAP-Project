# ITAP — Development Roadmap
**Document 9 of 9**

---

## Phase 1 — Core Platform (Weeks 1–6)

**Goal:** authenticated, multi-tenant CRUD platform with resumes stored and parsed, no AI
ranking yet.

| Week | Deliverable |
|---|---|
| 1 | Repo scaffolding (Vite React app, Express API, Docker Compose for Mongo/Redis); Supabase project set up; feature-sliced folder structure in place per Document 2 |
| 2 | Auth end-to-end: Supabase signup/login, JWT verification middleware, session cookie issuance, RBAC middleware, mirrored `users` collection |
| 3 | Job management: `JobForm`, job list/detail pages, jobs API + Mongo model |
| 4 | Resume upload: single + bulk upload UI, Supabase Storage integration, `resumes` collection, BullMQ queue wired (parsing stubbed) |
| 5 | Candidate profile pages (manual data first, no AI yet), pipeline stage model + kanban UI (`dnd-kit`) |
| 6 | Design system implementation: Tailwind tokens from Document 5, core primitives from Document 8, app shell (Sidebar/Topbar) |

**Definition of done:** a recruiter can sign up, create a job, upload resumes, see them land
in a pipeline, and move candidates between stages manually — with no AI involved yet.

---

## Phase 2 — AI Features (Weeks 7–14)

**Goal:** the actual "intelligence" in Intelligent Talent Acquisition Platform.

| Week | Deliverable |
|---|---|
| 7 | Python AI microservice scaffolded (FastAPI); resume parsing (spaCy NER) wired to the BullMQ queue |
| 8 | Skill extraction engine (technical/soft/domain/cloud categorization with confidence scores) |
| 9 | Embedding generation (Sentence-BERT) + Qdrant integration for candidates and job descriptions |
| 10 | Matching & ranking service: similarity score + rule-based factors + weighted overall score |
| 11 | `MatchDial`, `ScoreBreakdown`, ranked list view; live ranking updates via Socket.io |
| 12 | LLM adapter (Ollama-first, pluggable OpenAI-compatible/Anthropic): ranking explanations |
| 13 | Interview question generation; `WeightSliders` with sandboxed re-rank preview |
| 14 | Natural-language talent search (query → parsed filters → vector search → ranked results) |

**Definition of done:** uploading 500 resumes against a job produces a ranked, explainable
candidate list in under 5 minutes, and a recruiter can search the whole talent pool in plain
English.

---

## Phase 3 — Enterprise Features (Weeks 15–22)

**Goal:** the features that make this defensible as an enterprise-grade platform rather than
a screening demo.

| Week | Deliverable |
|---|---|
| 15 | Recruitment analytics dashboard: time-to-screen, time-to-hire, funnel, skill-demand trends |
| 16 | Duplicate/near-duplicate candidate detection (vector similarity + email/phone matching) |
| 17 | AI Copilot drawer: contextual "why is X ranked above Y" chat, streamed responses |
| 18 | Hiring Manager comparison view + structured interview feedback forms |
| 19 | Admin: user/role management, org-wide scoring defaults, rubric templates |
| 20 | Audit log (full read/write action trail) + data retention/consent tooling |
| 21 | Accessibility pass (WCAG 2.2 AA audit across all core flows, per Document 5 §11) |
| 22 | Load testing (500-resume batch under concurrent load), security review, staging → production cutover |

**Definition of done:** the platform is auditable, accessible, role-managed, and has been
load-tested at the scale described in Document 1's success metrics.

---

## Team Roles Needed

| Role | Phase 1 | Phase 2 | Phase 3 |
|---|---|---|---|
| Full-stack (React + Express) | ✓ ✓ | ✓ | ✓ |
| ML/NLP engineer (Python) | – | ✓ ✓ | ✓ |
| UI/UX designer | ✓ | ✓ | ✓ (accessibility pass) |
| DevOps/infra | ✓ | ✓ | ✓ ✓ |
| QA / accessibility auditor | – | ✓ | ✓ ✓ |

---

## Suggested Public Datasets (for training/testing the AI layer)

- Resume Dataset (Kaggle)
- Job Description Dataset (Kaggle)
- O*NET Skills Database
- ESCO Skills Classification
- Hugging Face resume-parsing datasets (where licensing permits)

---

## Milestone Summary

```
Week 6  ──► Manual ATS working end-to-end (no AI)
Week 14 ──► AI ranking + explanations + talent search live
Week 22 ──► Enterprise-ready: analytics, Copilot, RBAC admin, audited, accessible, load-tested
```
