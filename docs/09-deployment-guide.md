# ITAP — Deployment Guide
**Document 9 — Deployment**

---

## 1. Production Deployment Overview

ITAP is deployed across two cloud platforms:

| Component | Platform | URL |
|---|---|---|
| Frontend (React/Vite SPA) | **Vercel** | `https://itap-project.vercel.app` |
| Backend API (Express/Node.js) | **Render** | `https://itap-backend.onrender.com` |
| AI Service (FastAPI/Python) | **Render** | `https://itap-ai-service.onrender.com` |
| Database | **MongoDB Atlas** | Managed cluster |
| Cache / Queue | **Upstash Redis** | Managed Redis (TLS) |
| Identity / Auth | **Supabase** | `https://rawpparwkftofykdcbxj.supabase.co` |

---

## 2. Frontend — Vercel

### Deployment Settings
| Setting | Value |
|---|---|
| **Framework Preset** | Vite |
| **Root Directory** | `frontend` |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |

### Environment Variables (Vercel)
Set these in **Vercel → Project → Settings → Environment Variables**:

| Variable | Value |
|---|---|
| `VITE_API_BASE_URL` | `https://itap-backend.onrender.com/api` |
| `VITE_SOCKET_URL` | `https://itap-backend.onrender.com` |
| `VITE_SUPABASE_URL` | `https://rawpparwkftofykdcbxj.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | *(copy from `frontend/.env`)* |

> **Important:** The variable must be named `VITE_API_BASE_URL` — not `VITE_API_URL`. The
> axios client reads `import.meta.env.VITE_API_BASE_URL` specifically.

### SPA Routing Fix
A `vercel.json` file is required at `frontend/vercel.json` to prevent 404 errors when users
navigate directly to deep routes (e.g. `/login`, `/candidates/123`). Without it, Vercel
serves a 404 because no physical `login.html` file exists — the React Router handles all
routing client-side.

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

---

## 3. Backend API — Render

### Deployment Settings
| Setting | Value |
|---|---|
| **Service Type** | Web Service |
| **Repository Root** | `backend` |
| **Environment** | Node |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Instance Type** | Free (or Starter for production) |

### Environment Variables (Render — Backend)
Set these in **Render → Service → Environment**:

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |
| `PORT` | `10000` |
| `CLIENT_ORIGIN` | `https://itap-project.vercel.app` |
| `MONGODB_URI` | *(your MongoDB Atlas connection string)* |
| `REDIS_URL` | *(your Upstash Redis TLS URL, starts with `rediss://`)* |
| `SUPABASE_URL` | `https://rawpparwkftofykdcbxj.supabase.co` |
| `SUPABASE_JWKS_URL` | `https://rawpparwkftofykdcbxj.supabase.co/auth/v1/.well-known/jwks.json` |
| `SUPABASE_ANON_KEY` | *(copy from `backend/.env`)* |
| `SUPABASE_SERVICE_ROLE_KEY` | *(copy from `backend/.env`)* |
| `SESSION_COOKIE_SECRET` | *(minimum 32-char random string — copy from `backend/.env`)* |
| `SESSION_COOKIE_TTL_MINUTES` | `15` |
| `REFRESH_COOKIE_TTL_DAYS` | `7` |
| `AI_SERVICE_URL` | `https://itap-ai-service.onrender.com` |

### Background Worker — Free Tier Workaround
Render does **not** offer a free tier for Background Worker services. As a workaround, the
`package.json` includes a combined start script that runs both the Express API and the BullMQ
worker in the same process:

```json
"start:free": "node src/queues/worker.js & node server.js"
```

To use this, change the **Start Command** in Render from `npm start` to `npm run start:free`.
This is acceptable for demo/portfolio use. For production workloads, deploy the worker as a
separate Render service with `npm run worker`.

---

## 4. AI Service — Render

### Deployment Settings
| Setting | Value |
|---|---|
| **Service Type** | Web Service |
| **Repository Root** | `ai-service` |
| **Environment** | Python 3 |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |

### Environment Variables (Render — AI Service)
| Variable | Value |
|---|---|
| `PYTHON_VERSION` | `3.11.9` |
| `OLLAMA_API_KEY` | *(your Ollama Cloud API key)* |
| `LLM_PROVIDER` | `ollama` |

> **Important:** `PYTHON_VERSION` must be an **exact** version like `3.11.9`. Render does
> not support wildcard versions like `3.11.x`. Using Python 3.14+ (Render's default) causes
> `pydantic-core` to fail to compile because pre-built wheels are not yet available for it.

---

## 5. Known Production Gotchas & Fixes Applied

The following issues were encountered and resolved during the initial production deployment:

### 5.1 Cross-Origin Authentication Cookies (401 Unauthorized)
**Problem:** Session cookies set by Render could not be read by Vercel because the two
services are on different domains. Browsers enforce `SameSite=Strict` by default, which
blocks cross-origin cookies entirely.

**Fix applied:** `backend/src/utils/sessionCookies.js` — cookies are now issued with
`SameSite=None; Secure` when `NODE_ENV=production`, which is the only browser-compatible
policy for cross-origin authenticated sessions. `NODE_ENV=production` must be set on Render
for this to activate.

### 5.2 Rate Limiter Triggering 429 on All Requests
**Problem:** Render routes requests through internal load balancers. Without proxy trust
configured, `express-rate-limit` saw every request as coming from the same IP address
(the load balancer's IP), instantly exhausting the auth rate limit and returning 429 for all
login attempts.

**Fix applied:** `backend/src/app.js` — added `app.set('trust proxy', 1)` so Express reads
the real client IP from the `X-Forwarded-For` header injected by Render's proxy layer.

### 5.3 SPA Deep-Link 404s on Vercel
**Problem:** Navigating directly to any route other than `/` (e.g. `/login`, `/candidates`)
returned a Vercel 404 because no physical HTML files exist at those paths — routing is
handled entirely by React Router in the browser.

**Fix applied:** Added `frontend/vercel.json` with a catch-all rewrite rule that sends all
traffic to `index.html`, allowing the SPA to boot and React Router to handle the path.

### 5.4 Wrong Environment Variable Name on Vercel
**Problem:** The environment variable was mistakenly set as `VITE_API_URL` on Vercel, but
`axiosClient.js` reads `VITE_API_BASE_URL`. Because Vite replaces unknown `import.meta.env`
references with `undefined` at build time, every API call silently fell back to
`http://localhost:4000/api` — which does not exist in the cloud.

**Fix:** Rename the Vercel environment variable from `VITE_API_URL` to `VITE_API_BASE_URL`.

### 5.5 Python Version Mismatch on Render AI Service
**Problem:** Setting `PYTHON_VERSION=3.11.x` was not recognized by Render, causing it to
fall back to Python 3.14.3. `pydantic-core` (a dependency of FastAPI/Pydantic v2) does not
have pre-built wheels for Python 3.14, so pip attempted to compile it from Rust source, which
failed because the Render build environment has a read-only filesystem for Cargo.

**Fix:** Use the exact version string `PYTHON_VERSION=3.11.9`.

---

## 6. Environments Summary

| Environment | Frontend | Backend | Notes |
|---|---|---|---|
| **Local Dev** | `http://localhost:5173` | `http://localhost:4000` | Uses `.env` files, `npm run dev` |
| **Production** | `https://itap-project.vercel.app` | `https://itap-backend.onrender.com` | Auto-deployed on push to `main` |

---

## 7. CI/CD — Auto Deployment

Both platforms auto-deploy when code is pushed to the `main` branch:
- **Vercel** detects changes in the `frontend/` directory and rebuilds the SPA.
- **Render** detects any repository change and rebuilds/restarts the Node.js service.

No manual deploy steps are needed after the initial setup.

---

## 8. Database Seeding in Production

To populate the production database with demo data, run the seed script locally pointed at
the production MongoDB and Supabase instances:

```bash
cd backend
# Temporarily update .env with production MONGODB_URI and SUPABASE_* values, then:
node scripts/seed.js
```

This creates the `demo@itap.com` / `demo@1234` demo user in Supabase and populates MongoDB
with jobs, candidates, talent pools, pipeline stages, and match scores.

---

## 9. Rollback

- **Vercel:** Go to *Deployments* tab → click any previous deployment → *Promote to Production*.
- **Render:** Go to *Events* tab → click any previous deploy → *Rollback to this deploy*.

MongoDB schema changes in this project are additive only (no field removals or renames),
so a code rollback is always safe without a corresponding database rollback.
