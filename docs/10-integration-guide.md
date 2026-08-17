# ITAP — Integration Guide
**Document 10 — Integrations**

Covers every external system ITAP talks to, how the integration is wired in this codebase,
and what's required to activate it.

---

## 1. Supabase (Authentication)

**What it's for:** identity only — signup, login, password reset, OAuth, JWT issuance. Not
used for business data (docs/04-auth-security.md §1).

**Where it's wired:**
- Frontend: `frontend/src/shared/lib/supabaseClient.js` — `@supabase/supabase-js` client
  using the public anon key.
- Backend: `backend/src/config/supabase.js` — verifies incoming Supabase JWTs against
  either `SUPABASE_JWT_SECRET` (symmetric/HS256 projects) or `SUPABASE_JWKS_URL`
  (asymmetric/RS256 or ES256 projects, the current Supabase default).

**To activate:** create a Supabase project, copy the Project URL and anon key into
`frontend/.env`, and the URL + JWT secret/JWKS URL + service role key into `backend/.env`.
No Supabase tables need to be created — `auth.users` is managed entirely by Supabase.

**Extending it:** OAuth providers (Google, Microsoft — relevant for enterprise SSO) are
enabled from the Supabase dashboard with no code change; the frontend's
`supabase.auth.signInWithOAuth()` call is not yet wired into `LoginForm.jsx` but the
`authApi.js` service layer is where it would go, following the same `POST /auth/session`
handoff pattern already used for email/password.

---

## 2. MongoDB (System of Record)

**Where it's wired:** `backend/src/config/db.js` connects via Mongoose;
`backend/src/models/*.js` define every collection's schema (docs/02-database-schema.md).

**To activate:** provision MongoDB Atlas (or any MongoDB 6+ instance) and set
`MONGODB_URI`. No manual schema setup — Mongoose creates collections and indexes on first
write, per docs/09-deployment-guide.md §5.

---

## 3. Redis + BullMQ (Job Queue)

**What it's for:** decouples resume upload from resume parsing — uploads return
immediately, parsing happens in the background (docs/01-technical-architecture.md §6).

**Where it's wired:** `backend/src/config/redis.js` (connection), 
`backend/src/queues/resumeParsing.queue.js` (queue definition),
`backend/src/queues/processor.js` (job handler), `backend/src/queues/worker.js` (standalone
worker entrypoint) and `startInProcessWorker.js` (dev-only convenience — see
docs/09-deployment-guide.md §3 for why this is disabled in production).

**Verified working:** the queue was confirmed to connect to a real Redis instance and the
worker confirmed to attach to it successfully during this build (both `waitUntilReady()`
resolved without error against a locally-installed Redis).

---

## 4. Qdrant (Vector Search)

**What it's for:** semantic candidate/job similarity search, once embeddings move past the
v1 keyword-overlap fallback.

**Where it's wired:** `ai-service/app/embeddings/qdrant_client.py`. Every read/write is
scoped by an `organizationId` payload filter for tenant isolation (docs/02-database-schema.md
§4). All methods fail soft — if Qdrant is unreachable, callers get an empty result rather
than a crash, since the product's core ranking (`backend/src/services/matchingService.js`)
doesn't depend on it.

**To activate:** run Qdrant (Docker image `qdrant/qdrant`, already in `docker-compose.yml`)
and set `QDRANT_URL` in `ai-service/.env`. Collections are auto-created on first use.

**Not yet wired:** the Node backend doesn't call Qdrant directly yet — `matchingService.js`
uses local keyword-overlap scoring. Wiring Qdrant results into ranking is a matter of adding
a `matchingService` code path that calls the AI service's embedding-search endpoint and
blends its similarity score into the existing weighted formula, without changing the
`MatchScore` document shape.

---

## 5. LLM Provider (Ollama / OpenAI-compatible / Anthropic)

**What it's for:** ranking explanations, interview question generation, message drafting,
natural-language search-query parsing, and the Copilot chat — all with a template fallback
when no provider is configured, so the product works without this integration
(docs/01-technical-architecture.md §1.3).

**Where it's wired:** `ai-service/app/llm/provider_adapter.py` — a single `chat_completion()`
function dispatches to whichever provider `LLM_PROVIDER` selects; every calling function
(`explain_ranking`, `generate_interview_questions`, `draft_outreach_message`,
`parse_search_query`, `answer_copilot_question`) returns `None` on any failure, which is
what triggers the Node-side template fallback in `backend/src/services/aiServiceClient.js`.

**To activate:**
- **Ollama** (self-hosted, matches the pattern used on the team's SHIP project): run Ollama
  locally or on a server, pull a model (`ollama pull llama3.1`), set `LLM_PROVIDER=ollama`
  and `OLLAMA_BASE_URL`/`OLLAMA_MODEL`.
- **OpenAI-compatible** (Together, Groq, Fireworks, self-hosted vLLM, etc.): set
  `LLM_PROVIDER=openai_compatible` and the base URL/API key/model.
- **Anthropic**: set `LLM_PROVIDER=anthropic` and `ANTHROPIC_API_KEY`.

**Verified working:** the FastAPI service was booted and its `/llm/explain` endpoint hit
directly with no provider configured — it correctly returned `503`, which is what causes
Node's fallback to produce a template-based explanation instead. This confirms the
fail-soft contract holds end-to-end, not just in the Python code.

---

## 6. Supabase Storage (Resume Files)

**What it's for:** private, signed-URL-only storage for uploaded resumes
(docs/04-auth-security.md §5).

**Where it's wired:** `backend/src/services/storageService.js`. Falls back to local disk
storage (`.local-storage/resumes/`) if `SUPABASE_SERVICE_ROLE_KEY` isn't set — **dev only**,
logged as a warning every time it's used.

**To activate:** create a private bucket named `resumes` in your Supabase project, set
`SUPABASE_SERVICE_ROLE_KEY` in `backend/.env`.

---

## 7. Email Delivery (Not Yet Wired)

`backend/src/services/messagingService.js`'s `send()` method is intentionally a stub — it
returns a `queued_for_delivery` status without actually sending anything. Wiring a real
provider (the team used Resend on the LegalCMS project) means:
1. Add `RESEND_API_KEY` (or equivalent) to `backend/.env.example`
2. Replace the stub body in `messagingService.send()` with a real API call
3. No frontend change needed — `MessagingPage.jsx` already calls this endpoint and expects
   the current response shape

Admin user invites (`adminService.inviteUser()`) have the same stub pattern and the same
fix.

---

## 8. Sports/Weather/Maps/Other Third-Party APIs

None used. ITAP has no integrations beyond what's listed above in this version.

---

## 9. Integration Health Checks

| Integration | Health check | Where |
|---|---|---|
| MongoDB | Connection awaited at boot; server won't start without it | `backend/src/config/db.js` |
| Redis | `GET /health` doesn't check it directly, but the worker logs a connection error immediately if unreachable | `backend/src/queues/worker.js` |
| AI service | Every `aiServiceClient` method catches and logs failures independently — no single "is it up" flag, by design, since each capability degrades independently | `backend/src/services/aiServiceClient.js` |
| Qdrant | `GET /health` on the AI service doesn't check it; `ensure_collections()` fails soft | `ai-service/app/embeddings/qdrant_client.py` |
| Supabase | Verified implicitly on every login/signup — a misconfigured JWKS/secret surfaces immediately as a 401 | `backend/src/config/supabase.js` |

A dedicated `/health/deep` endpoint that actively pings Mongo/Redis/AI-service/Qdrant and
reports per-dependency status is a reasonable Phase 3 addition, not yet built.
