# ITAP — Intelligent Talent Acquisition Platform

Full-stack implementation of the platform specified in `/docs`, built to match the UI/UX
design your team supplied (`ITAP_Design_System.zip` — a Stitch export of 7 screens plus a
token spec, itself generated from `docs/05-ui-ux-design-system.md`).

```
itap/
├─ docs/                13 documentation files — BRD, architecture, schema, API, auth,
│                       design system, pages/flows, component library, roadmap,
│                       deployment, integrations, data flow diagrams, and a QA/verification
│                       report documenting exactly what was and wasn't tested
├─ design-reference/    The original Stitch export (7 screens' HTML/CSS + screenshots +
│                       DESIGN.md) supplied by the design team — kept for provenance
├─ frontend/            React 18 + Vite + JavaScript + Tailwind CSS
├─ backend/              Node.js + Express + MongoDB (Mongoose) + Supabase Auth (JWT)
├─ ai-service/            Python + FastAPI — resume parsing, embeddings, LLM adapter
└─ docker-compose.yml
```

**Read `docs/12-qa-verification-report.md` first if you want to know what's actually been
tested versus what still needs a real check on your end** — it's an honest list, including
three real bugs found and fixed while building this (a 1.14MB unsplit JS bundle, a sidebar
with no mobile behavior at all, and three tables that would've broken on narrow screens).

## Quick start

**1. Create a Supabase project** (free tier is fine) at supabase.com. You only need Auth —
no tables are created there; MongoDB is the system of record (see `docs/04-auth-security.md §1`).

**2. Fill in environment files**, copying each `.env.example` to `.env`:
```
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env
cp ai-service/.env.example ai-service/.env
```
At minimum, set `SUPABASE_URL` / `SUPABASE_ANON_KEY` (frontend) and `SUPABASE_URL` +
either `SUPABASE_JWT_SECRET` or `SUPABASE_JWKS_URL` (backend) from your Supabase project's
API settings.

**3. Run everything:**
```
docker compose up --build
```
This starts the frontend (`:5173`), API (`:4000`), the AI service (`:8000`), MongoDB, Redis,
and Qdrant. The API's dev server also runs an in-process resume-parsing worker, so uploads
work without starting a separate worker container (see `backend/src/queues/startInProcessWorker.js`).

Without Docker, run each service's `npm install && npm run dev` (frontend, backend) and
`pip install -r requirements.txt && uvicorn app.main:app --reload` (ai-service) in three
terminals, plus a local MongoDB/Redis. Qdrant and a configured LLM provider are optional —
see "What works without extra setup" below.

**4. Sign up.** The first account created for a new organization name becomes that org's
`hr_admin` (see `authService.findOrCreateUser`). Invite recruiters/hiring managers from
Admin → Users after that.

## Production deployment

`docker compose up` (above) uses the **dev** stack — hot-reload servers via each service's
`Dockerfile.dev`, source bind-mounted. For a real deployment use the production stack:

```
docker compose -f docker-compose.prod.yml up --build -d
```

This builds the production images (default `Dockerfile` in each service): the frontend is
compiled by Vite and served by **nginx** (which also reverse-proxies `/api` and `/socket.io`
to the API, so the browser talks to one origin); the API and worker run `node` as non-root
under `dumb-init`; the AI service runs `uvicorn` with no `--reload`. Mongo/Redis/Qdrant and
the AI service stay on the internal network — only the web tier is published.

Create a **root `.env`** (compose auto-loads it) with:

```
VITE_SUPABASE_URL=https://your-project.supabase.co   # baked into the frontend at BUILD time
VITE_SUPABASE_ANON_KEY=your-anon-key                 # (Vite inlines VITE_* vars, so these
PUBLIC_SITE_ORIGIN=https://itap.example.com          #  are build args, not runtime env)
AI_SERVICE_TOKEN=a-long-random-shared-secret         # API ⇄ AI service auth
WEB_PORT=8080                                         # host port for the web tier
```

Then fill `backend/.env` (real `SUPABASE_*` + `SESSION_COOKIE_SECRET` — the API **refuses to
boot** in production without them, see `backend/src/config/env.js`) and `ai-service/.env`
(set the matching `AI_SERVICE_TOKEN`). CI (`.github/workflows/ci.yml`) lints + builds the
frontend, runs the backend tests, and import-checks the AI service on every push/PR.

## What works without extra setup

Everything runs end-to-end with just Mongo + Redis + Supabase Auth configured — no Qdrant,
no LLM provider required:

- Auth (signup/login/logout/session refresh), RBAC, multi-tenancy
- Job CRUD, resume upload (falls back to local disk storage if Supabase Storage isn't
  configured — dev only, see `backend/src/services/storageService.js`)
- **Real PDF/DOCX/TXT text extraction** and regex/heuristic resume parsing
  (`ai-service/app/parsing/`) — not a stub, just not a full NER model
- **Real matching/ranking**: a working keyword-overlap scoring algorithm
  (`backend/src/services/matchingService.js`) that needs no embeddings to produce sensible,
  explainable scores
- Pipeline management, bulk stage moves, interview scheduling/feedback, analytics
  aggregations, audit log, org scoring-weight config

## What's pluggable / upgrades the "v1 fallback"

Each of these has a working default and a documented drop-in upgrade path — the API
contracts don't change either way:

| Feature | v1 default | Upgrade path |
|---|---|---|
| Candidate/job embeddings | `HashingVectorizer` (scikit-learn, no model download) | Swap `ai-service/app/embeddings/embedder.py` for `sentence-transformers` (e.g. `all-mpnet-base-v2`) |
| Semantic vector search | Not required — keyword matching handles ranking | Qdrant is already wired (`ai-service/app/embeddings/qdrant_client.py`); point `matchingService.js` at it once embeddings are real |
| Ranking explanations, interview questions, message drafts, search-query parsing, Copilot | Template-based fallback strings | Set `LLM_PROVIDER=ollama` (or `openai_compatible` / `anthropic`) in `ai-service/.env` — see `ai-service/app/llm/provider_adapter.py` |
| Resume storage | Local disk (dev only) | Set `SUPABASE_SERVICE_ROLE_KEY` to use real Supabase Storage |
| OCR for scanned PDFs | Not run | Uncomment the OCR extras in `ai-service/requirements.txt`, install system Tesseract, wire `ai-service/app/parsing/ocr.py` into `file_extraction.py` |

## Fidelity to the supplied design

`frontend/tailwind.config.js` and `frontend/index.html` transcribe the Stitch export's
tokens (colors, type scale, spacing, Material Symbols icons) directly — see the comment
block at the top of `tailwind.config.js` for the one deliberate fix (the export's
`borderRadius.full: 0.75rem` would have broken every circular avatar; native Tailwind
`9999px` is kept instead). The Match Dial component reproduces the export's exact SVG
gauge technique (`frontend/src/shared/components/MatchDial.jsx`).

## Roadmap mapping

This build covers **Phase 1 and Phase 2** of `docs/08-development-roadmap.md` in full, and
most of **Phase 3** (analytics, Copilot, admin/RBAC, audit log) — the remaining Phase 3 items
not implemented here are: a full WCAG audit pass, load testing at the 500-resume/job scale,
and a production security review. Duplicate-candidate detection is implemented as a
heuristic (email + skill-overlap match) rather than the full vector-similarity version.

## Tests

`backend/tests/matchingService.test.js` has a real, passing suite (`npm test` — 2/2 pass,
run with Vitest) covering the scoring algorithm's core behavior: a stronger candidate
outranks a weaker one for the same job, and a missing must-have skill caps the score. It's a
starting point, not full coverage — the next-highest-value additions are `resumeService`
(upload → queue) and `talentSearchService` (weighted scoring), both currently untested.

## Design fidelity — what changed after a second, deeper pass

The first build read all 7 supplied screens' section headers but only fully read 3 of them
line-by-line. On a full re-read, 3 screens turned out to be meaningfully different from what
had shipped:

- **AI Search Engine** (`/talent-search`): rebuilt as a bento layout with a 5-slider
  "Algorithm Weighting" panel (Technical Depth, Experience Level, Skill Recency, Domain
  Expertise, Cultural Fit) and a live-updating "Impact Preview" of the top 3 matches —
  backed by real weighted scoring in `talentSearchService.search()`, not decorative sliders.
- **Personalized Messaging**: rebuilt as a 60/40 composer with tone/length segmented
  controls, AI-personalized phrases highlighted inline in the message body
  (`HighlightedBody.jsx`), and a dark "Copilot Reasoning" panel with numbered, sourced
  insight blocks — backed by a `messagingService.draft()` that returns structured
  `insertions`, not just a subject/body string.
- **Talent Pools**: rebuilt with the "AI Health Dial" (the same `MatchDial` component reused
  as a pool-health gauge), a sourcing-status pill, and a stacked avatar row of top matches.

Full detail, plus the mobile-layout fixes made in the same pass, is in
`docs/12-qa-verification-report.md §3`.
