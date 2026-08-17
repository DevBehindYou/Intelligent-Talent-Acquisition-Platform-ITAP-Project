# ITAP — Technical Architecture
**Document 2 of 9**

---

## 1. Technology Stack

### 1.1 Frontend

| Concern | Choice | Why |
|---|---|---|
| Build tool | Vite | Fast HMR, native ESM, minimal config |
| Language | JavaScript (ES2022+) | Per project requirement — no TypeScript |
| UI library | React 18 | Concurrent rendering, hooks-first |
| Styling | Tailwind CSS + a small custom design-token layer | Utility-first, maps 1:1 to Document 5's tokens |
| Routing | React Router v6 | Nested routes match the role-based page tree in Document 6 |
| Server-state / caching | TanStack Query | Handles caching, retries, background refetch for all API data |
| Client/UI state | Zustand | Lightweight, no boilerplate, plays well with the ViewModel pattern below |
| Forms | React Hook Form + Zod | Schema validation shared between client and (via a thin adapter) server |
| HTTP client | Axios (with an interceptor for auth cookies + refresh) | |
| Icons | lucide-react | Consistent, tree-shakeable |
| Charts | Recharts | Dashboard and analytics visualizations |
| Tables | TanStack Table | Sorting/filtering/pagination for candidate lists |
| Drag & drop | dnd-kit | Kanban-style pipeline stages |
| Realtime | Socket.io client | Live pipeline updates, notification badges |
| Testing | Vitest + React Testing Library + Playwright (e2e) | |

### 1.2 Backend

| Concern | Choice | Why |
|---|---|---|
| Runtime | Node.js 20 LTS | |
| Framework | Express | Simple, well-understood, matches team's MERN background |
| Database | MongoDB (Atlas) via Mongoose | Flexible schema for resumes/skills, matches existing team expertise |
| Auth | Supabase Auth (JWT), verified server-side | See Document 4 |
| File storage | Supabase Storage (private buckets) with signed URLs | Resumes are private objects, not embedded in Mongo |
| Job queue | BullMQ + Redis | Resume parsing, embedding generation, bulk uploads run as background jobs |
| Realtime | Socket.io server | Pushes ranking/pipeline updates to connected recruiters |
| Validation | Zod (shared schemas with frontend where practical) | |
| Logging | Pino | Structured logs for audit trail |
| Rate limiting | express-rate-limit + Redis store | |

### 1.3 AI / NLP layer (Python microservice)

| Concern | Choice | Why |
|---|---|---|
| Service framework | FastAPI | Async, typed, easy to containerize separately from the Node API |
| Resume parsing | spaCy (NER) + rule-based section detection | Extracts name, education, experience, certifications |
| Embeddings | Sentence-BERT (`all-mpnet-base-v2` or similar) | Turns resumes and JDs into comparable vectors |
| Vector database | Qdrant (self-hosted via Docker, or Qdrant Cloud) | Semantic search, candidate similarity, duplicate detection |
| LLM layer | Provider-agnostic adapter: Ollama (local/self-hosted default) with pluggable OpenAI-compatible / Anthropic API fallback | Interview question generation, ranking explanations, resume summaries — mirrors the "Ollama-first multi-provider" pattern already used on the SHIP project |
| OCR (scanned resumes) | Tesseract via `pytesseract`, or a cloud OCR fallback | |

### 1.4 Infrastructure

| Concern | Choice |
|---|---|
| Frontend hosting | Vercel |
| Backend hosting | Railway or Render (Node API + Python AI service as separate services) |
| Database | MongoDB Atlas |
| Vector DB | Qdrant Cloud (or self-hosted on the same VPC as the AI service) |
| Cache / queue | Redis (Upstash or Railway Redis) |
| CI/CD | GitHub Actions (lint → test → build → deploy) |
| Containerization | Docker Compose for local dev; each service (`web`, `api`, `ai-service`, `mongo`, `redis`, `qdrant`) as its own container |

---

## 2. High-Level System Diagram

```
                         ┌─────────────────────────┐
                         │   React (Vite) SPA      │
                         │  Recruiter / HM / Admin │
                         └────────────┬────────────┘
                                      │ HTTPS (httpOnly cookie)
                                      ▼
                         ┌─────────────────────────┐
                         │   Express API Gateway   │
                         │  (routes/controllers)   │
                         └───┬─────────┬───────────┘
                              │                    │
         verifies JWT         │                    │  enqueues jobs
     (Supabase JWT secret)    │                    │
                              ▼                    ▼
                  ┌───────────────────┐   ┌─────────────────┐
                  │  Supabase Auth    │   │   BullMQ + Redis│
                  │ (identity only)   │   │  (job queue)     │
                  └───────────────────┘   └────────┬────────┘
                                                     │
                              ┌──────────────────────┼───────────────────────┐
                              ▼                      ▼                       ▼
                    ┌──────────────────┐   ┌───────────────────┐   ┌──────────────────┐
                    │  MongoDB Atlas   │   │  Python AI Service │   │ Supabase Storage │
                    │ (system of record)│   │  (FastAPI)        │   │  (resume files)  │
                    └──────────────────┘   └─────────┬─────────┘   └──────────────────┘
                                                       │
                                          ┌────────────┼────────────┐
                                          ▼                          ▼
                                 ┌─────────────────┐        ┌──────────────┐
                                 │  Qdrant (vectors)│        │  LLM Adapter │
                                 └─────────────────┘        │ Ollama/OpenAI│
                                                             │ /Anthropic   │
                                                             └──────────────┘
```

---

## 3. Frontend Architecture: MVVM over React

The team's earlier MERN projects (NEXUS CRM, LegalCMS) used a fairly conventional
components-call-APIs-directly pattern. For ITAP — which has heavier client-side logic
(scoring adjustments, live ranking, kanban drag state, AI copilot streaming) — we apply
**MVVM** on top of React so that logic stays testable and components stay dumb.

| MVVM Layer | React equivalent | Responsibility |
|---|---|---|
| **Model** | `services/*Api.js` + Mongoose-backed REST responses | Raw data shape, persistence, no UI concerns |
| **ViewModel** | Custom hooks, e.g. `useCandidateRankingViewModel()` | Owns state, calls the Model layer (via TanStack Query), exposes a plain object of `{ data, actions, derivedState }` to the View |
| **View** | Functional components (`CandidateRankingPage.jsx`) | Renders only what the ViewModel gives it; no direct API calls, no business logic |

Example shape (illustrative, not final code):

```
// Model
services/candidatesApi.js        → getCandidates(), getMatchScore(), updateStage()

// ViewModel
features/candidates/hooks/useCandidateListViewModel.js
  - wraps TanStack Query + Zustand filter state
  - exposes: { candidates, isLoading, sortBy, setSortBy, filters, setFilters, rankedList }

// View
features/candidates/pages/CandidateListPage.jsx
  - const vm = useCandidateListViewModel()
  - renders <CandidateTable rows={vm.rankedList} onSort={vm.setSortBy} />
```

Rules enforced across the codebase:

- A View component never imports `axios` or a `*Api.js` file directly.
- A ViewModel hook never returns JSX.
- Cross-feature communication happens through shared stores in `shared/store/`, never by
  importing one feature's hook into another feature.

---

## 4. Frontend Folder Structure (Feature-Sliced)

```
src/
├─ app/                      # App shell: providers, router, layout
│  ├─ routes.jsx
│  ├─ providers/             # QueryClientProvider, AuthProvider, ThemeProvider
│  └─ layout/                # AppShell, Sidebar, Topbar wiring
│
├─ features/
│  ├─ auth/
│  │  ├─ components/         # LoginForm, RegisterForm, ForgotPasswordForm
│  │  ├─ hooks/               # useAuthViewModel, useSession
│  │  ├─ services/            # authApi.js
│  │  └─ store/               # authStore.js (Zustand)
│  │
│  ├─ jobs/
│  │  ├─ components/          # JobForm, JobCard, JobFilters
│  │  ├─ hooks/                # useJobListViewModel, useJobFormViewModel
│  │  ├─ services/             # jobsApi.js
│  │  └─ pages/                # JobListPage.jsx, JobDetailPage.jsx, CreateJobPage.jsx
│  │
│  ├─ resumes/
│  │  ├─ components/          # ResumeUploader, BulkUploadModal, ParsingProgress
│  │  ├─ hooks/                 # useResumeUploadViewModel
│  │  ├─ services/               # resumesApi.js
│  │  └─ pages/                  # ResumeUploadPage.jsx
│  │
│  ├─ candidates/
│  │  ├─ components/           # CandidateTable, CandidateCard, MatchDial, StageTag
│  │  ├─ hooks/                  # useCandidateListViewModel, useCandidateDetailViewModel
│  │  ├─ services/                # candidatesApi.js
│  │  └─ pages/                    # CandidateListPage.jsx, CandidateDetailPage.jsx
│  │
│  ├─ matching/
│  │  ├─ components/            # ScoreBreakdown, WeightSliders
│  │  ├─ hooks/                    # useScoringConfigViewModel
│  │  └─ services/                  # matchingApi.js
│  │
│  ├─ interviews/
│  │  ├─ components/            # QuestionList, ScheduleModal, FeedbackForm
│  │  ├─ hooks/                    # useInterviewViewModel
│  │  ├─ services/                  # interviewsApi.js
│  │  └─ pages/                      # InterviewSchedulePage.jsx
│  │
│  ├─ talent-search/
│  │  ├─ components/             # NaturalLanguageSearchBar, ResultsList
│  │  ├─ hooks/                    # useTalentSearchViewModel
│  │  └─ services/                  # talentSearchApi.js
│  │
│  ├─ copilot/
│  │  ├─ components/              # CopilotDrawer, CopilotMessage, StreamingAnswer
│  │  ├─ hooks/                      # useCopilotViewModel
│  │  └─ services/                    # copilotApi.js
│  │
│  ├─ analytics/
│  │  ├─ components/               # KpiCard, FunnelChart, TimeToHireChart
│  │  ├─ hooks/                       # useAnalyticsViewModel
│  │  └─ pages/                        # AnalyticsDashboardPage.jsx
│  │
│  └─ admin/
│     ├─ components/                 # UserTable, RoleEditor, ScoringDefaultsForm, AuditLogTable
│     ├─ hooks/                        # useAdminUsersViewModel
│     └─ pages/                          # AdminUsersPage.jsx, AdminSettingsPage.jsx
│
├─ shared/
│  ├─ components/                # Button, Input, Select, Badge, Modal, Toast, Table, EmptyState, Skeleton
│  ├─ hooks/                       # useDebounce, usePagination, useOnClickOutside
│  ├─ utils/                        # formatDate, formatScore, currency, download helpers
│  ├─ store/                          # notificationsStore.js, uiStore.js (theme, sidebar collapsed)
│  └─ lib/                             # axiosClient.js, socketClient.js, queryClient.js
│
├─ styles/
│  └─ tokens.css                       # CSS variables consumed by tailwind.config.js
│
└─ main.jsx
```

**Boundary rule:** a `features/*` folder may import from `shared/`, never from another
`features/*` folder directly. Cross-feature composition happens at the `app/` or `pages/`
level.

---

## 5. Backend Architecture

```
server/
├─ src/
│  ├─ routes/            # jobs.routes.js, candidates.routes.js, auth.routes.js, ...
│  ├─ controllers/       # thin: parse request, call service, shape response
│  ├─ services/          # business logic: matchingService.js, rankingService.js
│  ├─ models/            # Mongoose schemas: Job.js, Candidate.js, Resume.js, MatchScore.js
│  ├─ middleware/         # verifySupabaseJwt.js, requireRole.js, rateLimiter.js, auditLogger.js
│  ├─ queues/               # resumeParsing.queue.js, embeddingGeneration.queue.js
│  ├─ sockets/                # pipelineEvents.js
│  ├─ config/                   # db.js, redis.js, supabase.js
│  └─ app.js
├─ tests/
└─ server.js

ai-service/               # separate FastAPI deployable
├─ app/
│  ├─ parsing/            # resume_parser.py, ocr.py
│  ├─ embeddings/           # embedder.py, qdrant_client.py
│  ├─ llm/                    # provider_adapter.py (ollama / openai-compatible / anthropic)
│  └─ main.py
└─ requirements.txt
```

Layering rule on the Node side: **routes never talk to Mongoose directly** — they call a
controller, which calls a service, which is the only layer allowed to touch a Model. This
keeps ranking/matching logic unit-testable independent of Express.

---

## 6. Core Data Flow — Resume → Ranked Candidate

```
Recruiter uploads resume(s)
        │
        ▼
Express: POST /api/resumes  → stores file in Supabase Storage, creates Resume doc (status: "queued")
        │
        ▼
BullMQ job enqueued: parse-resume
        │
        ▼
AI Service (FastAPI): OCR (if scanned) → NLP parse → skill extraction → embedding generation
        │
        ▼
Embedding written to Qdrant (candidate vector) + parsed fields written back to MongoDB
        │
        ▼
Matching Service: compares candidate vector to job-description vector(s) → similarity score
        │
        ▼
Ranking Service: combines similarity + rule-based factors (experience match, must-have skills)
   → weighted overall score + per-factor breakdown
        │
        ▼
LLM Adapter: generates a short plain-language explanation of the ranking
        │
        ▼
MatchScore doc saved → Socket.io emits "ranking:updated" → Recruiter dashboard updates live
```

---

## 7. Non-Functional Requirements

| Category | Requirement |
|---|---|
| Performance | Rank 500 resumes against one JD in under 5 minutes end-to-end (parsing + embedding + scoring) |
| Scalability | Resume parsing and embedding generation run as horizontally-scalable background workers, decoupled from the request/response cycle |
| Availability | 99.5% uptime target for the API; background AI jobs may degrade gracefully (queued, not lost) if the AI service is temporarily down |
| Multi-tenancy | Every document in MongoDB carries an `organizationId`; every query is scoped by it at the service layer, never left to the client |
| Accessibility | WCAG 2.2 AA across recruiter/HR flows (see Document 5) |
| Data protection | Resumes encrypted at rest (Supabase Storage), signed URLs with short expiry, audit log on every read of a candidate's personal data |
| Localization-ready | All UI strings pulled from a single i18n resource file even if only English ships in v1 |
