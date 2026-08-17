# ITAP — Deployment Guide
**Document 9 — Deployment**

---

## 1. Environments

| Environment | Purpose | Notes |
|---|---|---|
| Local | Development | `docker compose up --build` — see root `README.md` |
| Staging | Pre-production verification | Mirrors production topology at lower instance sizes |
| Production | Live traffic | Auto-scaled API/worker, managed DB/cache/vector store |

---

## 2. Component-by-Component Hosting

| Component | Recommended host | Why |
|---|---|---|
| Frontend (static build) | Vercel | Zero-config Vite support, edge CDN, preview deployments per PR |
| API (Express) | Railway or Render | Simple container deploys, easy env var management, WebSocket support for Socket.io |
| Worker (BullMQ) | Railway/Render — separate service from the API | Independent scaling; resume-parsing load shouldn't compete with request-serving capacity (docs/01-technical-architecture.md §7) |
| AI service (FastAPI) | Railway/Render, or a GPU-backed host if you upgrade to a real embedding model | Stateless, horizontally scalable |
| MongoDB | MongoDB Atlas | Managed backups, point-in-time recovery, network peering |
| Redis | Upstash or Railway Redis | BullMQ + rate-limit store |
| Qdrant | Qdrant Cloud, or self-hosted alongside the AI service | Only required once embeddings move past the v1 `HashingVectorizer` fallback |
| Supabase | Supabase Cloud | Auth only — no business data lives here (docs/04-auth-security.md §1) |

---

## 3. Build & Release Steps

**Frontend**
```
cd frontend
npm ci
npm run build        # outputs dist/ — verified locally: single build produces
                      # per-route chunks, no chunk over ~400KB (see vite.config.js
                      # manualChunks + app/routes.jsx's React.lazy split)
```
Deploy `dist/` as a static site. Set `VITE_API_BASE_URL` to the production API's public URL
and `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` to the production Supabase project.

**Backend**
```
cd backend
npm ci
npm start             # server.js — connects Mongo, starts Express + Socket.io
```
In production, **do not** rely on the in-process worker (`startInProcessWorker.js` — dev
convenience only). Deploy the worker as its own process:
```
npm run worker        # src/queues/worker.js
```
Set `NODE_ENV=production` so `server.js` skips starting the in-process worker automatically.

**AI service**
```
cd ai-service
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

---

## 4. Environment Variables Checklist

Every value below is already documented per-service in that service's `.env.example`; this
is the cross-service checklist for a production rollout.

- [ ] `SUPABASE_URL`, `SUPABASE_JWKS_URL` (or `SUPABASE_JWT_SECRET`), `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `MONGODB_URI` pointed at the production Atlas cluster, with IP allowlisting or VPC peering configured
- [ ] `REDIS_URL` pointed at the production Redis instance
- [ ] `SESSION_COOKIE_SECRET` — a long, random value, **different from the dev default**
- [ ] `CLIENT_ORIGIN` set to the exact production frontend origin (CORS + cookie `SameSite` depend on this matching)
- [ ] `AI_SERVICE_URL` pointed at the deployed FastAPI service
- [ ] `LLM_PROVIDER` — set to `ollama`, `openai_compatible`, or `anthropic` once you're ready to move off the template fallback (docs/01-technical-architecture.md §1.3)
- [ ] `QDRANT_URL` — only needed once you've upgraded past the v1 keyword-matching scorer

---

## 5. Database Provisioning

MongoDB Atlas: create the cluster, then let Mongoose create collections/indexes on first
write (all indexes are declared in the Mongoose schemas under `backend/src/models/`, so no
manual migration step is required for a fresh environment). For an existing environment,
run a one-off script that calls `Model.init()` on each model to force index creation ahead
of traffic, rather than relying on lazy index builds under load.

Qdrant (once enabled): the AI service creates both collections (`candidate_vectors`,
`job_vectors`) automatically on first use — see `ai-service/app/embeddings/qdrant_client.py`'s
`ensure_collections()`.

---

## 6. Scaling Notes

- **API**: stateless aside from the Socket.io connection registry — scale horizontally
  behind a load balancer. If running more than one API instance, switch Socket.io to the
  Redis adapter (`@socket.io/redis-adapter`) so events broadcast across instances, not just
  within one process's connected sockets.
- **Worker**: scale by concurrency (`Worker(..., { concurrency: N })` in
  `backend/src/queues/worker.js`) before scaling instance count — resume parsing is I/O
  bound (network calls to the AI service and storage), not CPU bound, so a single worker
  process with higher concurrency goes a long way before you need more containers.
- **AI service**: CPU-bound once real embedding models are in play; scale with more
  `--workers` (uvicorn) or replicas behind a load balancer. GPU is only relevant if/when you
  move to a transformer-based embedding model (docs/01-technical-architecture.md §1.3's
  upgrade path).
- **Rate limits**: the in-memory `express-rate-limit` store used in this build only works
  correctly with a single API instance. Swap it for `rate-limit-redis` before scaling the
  API horizontally, or limits become effectively per-instance instead of global.

---

## 7. CI/CD

`docs/08-development-roadmap.md`'s roadmap calls for GitHub Actions. A minimal pipeline per
service:
```
lint → test → build → deploy (on merge to main)
```
For the backend, `npm test` runs the Vitest suite in `backend/tests/` (currently one file,
`matchingService.test.js` — both tests pass; see this repo's verification notes in the
top-level README for how that was confirmed). For the frontend, `npm run build` doubles as
a compile-correctness check — a broken import or JSX error fails the build, not just lint.

---

## 8. Rollback

Both Vercel (frontend) and Railway/Render (backend/worker/AI service) support one-click
rollback to a previous deploy. Because MongoDB schema changes here are additive
(Mongoose schemas, no migrations framework wired up yet), a code rollback is safe without a
corresponding DB rollback in the common case — flag any future schema change that
*removes* or *renames* a field for a proper migration script instead of relying on this.
