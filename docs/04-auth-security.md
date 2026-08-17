# ITAP — Authentication & Security
**Document 5 of 9**

---

## 1. Why Supabase Auth + a Custom Express Backend

Supabase Auth is used purely as an **identity provider** — it issues JSON Web Tokens and
manages credentials (email/password, OAuth, password reset, MFA-ready). It is not used as
the system of record for business data; MongoDB is, per Document 3. This is a well-supported
integration pattern: Supabase explicitly documents verifying its JWTs from a custom,
non-Supabase backend, and issues tokens using either the project's JWKS (asymmetric keys,
default for new projects) or a shared JWT secret (symmetric keys, legacy projects).

```
┌──────────────┐        ┌──────────────────┐        ┌────────────────────┐
│ React SPA    │◄──────►│  Supabase Auth   │        │  Express API        │
│ (Vite)       │  (1)   │  (Postgres,      │        │  (business logic +  │
│              │        │   identity only) │        │   MongoDB)          │
└──────┬───────┘        └──────────────────┘        └──────────┬──────────┘
       │ (2) JWT (access + refresh token)                       │
       ▼                                                         │
┌──────────────┐   (3) POST /auth/session { access_token } ►────┘
│ Express sets │
│ httpOnly     │   (4) Express verifies JWT signature via Supabase JWKS/secret,
│ secure cookie│       looks up/creates the mirrored Mongo `users` doc,
└──────────────┘       sets its OWN httpOnly session cookie (not the raw Supabase token)
```

---

## 2. Full Login Flow

1. **Client → Supabase:** the SPA calls `supabase.auth.signInWithPassword()` (or an OAuth
   flow) directly against Supabase, using `@supabase/supabase-js` with the project's anon key.
2. **Supabase → Client:** Supabase returns a session containing a short-lived JWT **access
   token** and a longer-lived **refresh token**.
3. **Client → Express:** the SPA immediately calls `POST /api/auth/session` with the access
   token in the request body (not as a bearer header, to keep it out of browser history/logs).
4. **Express verification:** the Express `verifySupabaseJwt` middleware validates the token's
   signature (against the project's JWKS endpoint, cached, for asymmetric keys — or the
   `SUPABASE_JWT_SECRET` for symmetric keys) and checks `exp`, `iss`, and `aud` claims.
5. **Mirror + session:** Express looks up the Mongo `users` doc by `supabaseUserId` (creating
   it on first login via a Supabase Auth webhook or lazily on this call), then issues **its
   own** signed, httpOnly, `Secure`, `SameSite=Strict` session cookie scoped to the API domain.
   This is the cookie every subsequent API call relies on — the raw Supabase access token is
   never stored client-side in a way JavaScript can read it.
6. **Every API request** after this sends the cookie automatically (`withCredentials: true`
   on the Axios client); Express verifies the cookie's signature and attached claims
   (`userId`, `organizationId`, `role`) on every request via middleware, with no additional
   round-trip to Supabase needed per request.
7. **Refresh:** before the session cookie's short expiry (e.g., 15 minutes), the SPA silently
   calls `POST /api/auth/refresh`, which uses the Supabase refresh token (kept in a separate
   httpOnly cookie) to mint a new Supabase access token, re-verify it, and re-issue the
   session cookie — the user never notices.
8. **Logout:** `POST /api/auth/logout` clears both cookies and calls `supabase.auth.signOut()`
   to revoke the refresh token server-side.

**Why not just use the Supabase JWT directly as the session cookie?** Keeping Express as the
issuer of its own session cookie means the API can embed exactly the claims it needs
(`organizationId`, `role`) without re-parsing Supabase's token shape everywhere, and it means
token verification cost (JWKS lookup) happens once at login/refresh rather than on every
single request.

---

## 3. Cookie Configuration

| Cookie | Contents | Flags |
|---|---|---|
| `itap_session` | Signed JWT: `{ userId, organizationId, role, exp }` | `httpOnly`, `Secure`, `SameSite=Strict`, short expiry (~15 min) |
| `itap_refresh` | Opaque reference to the Supabase refresh token | `httpOnly`, `Secure`, `SameSite=Strict`, longer expiry (~7 days), path-restricted to `/api/auth/refresh` |

CSRF mitigation: since cookies are `SameSite=Strict` and the API only accepts JSON bodies
(not form submissions), classic CSRF via auto-submitted forms is not viable; state-changing
requests additionally require a custom header (`X-Requested-With`) as defense in depth.

---

## 4. Role-Based Access Control (RBAC)

Roles are stored on the Mongo `users` document and embedded as a claim in the session
cookie so Express middleware can authorize without a database round-trip on every request.

```js
// middleware/requireRole.js (illustrative)
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.session.role)) {
      return res.status(403).json({ success: false, error: { code: "FORBIDDEN" } });
    }
    next();
  };
}

// usage
router.patch("/admin/organization/scoring-defaults",
  requireRole("hr_admin"),
  adminController.updateScoringDefaults);
```

| Action | recruiter | hiring_manager | hr_admin |
|---|---|---|---|
| Create/edit jobs | ✓ | – | ✓ |
| Upload resumes | ✓ | – | ✓ |
| View full applicant pool | ✓ (own jobs) | – | ✓ (org-wide) |
| View shortlisted candidates | ✓ | ✓ | ✓ |
| Adjust per-job scoring weights | ✓ | – | ✓ |
| Adjust org-wide scoring defaults | – | – | ✓ |
| Schedule interviews | ✓ | request only | ✓ |
| Manage users/roles | – | – | ✓ |
| View audit logs | – | – | ✓ |

**Tenant isolation** is enforced independently of role: every query in the service layer is
scoped by `organizationId` pulled from the session claims, never from a client-supplied
parameter — a compromised or buggy frontend cannot leak another organization's data by
passing a different `organizationId` in a request body.

---

## 5. Data Protection & Compliance

- **Resumes at rest:** stored in private Supabase Storage buckets, never public; access is
  via short-lived (60s) signed URLs generated per download request, logged in `auditLogs`.
- **PII minimization:** the `candidates` collection stores only what's needed for matching
  and contact; free-text resume content lives in `resumes.rawExtractedText` behind a
  narrower access control than the parsed summary fields.
- **Consent tracking:** `candidates.consentGivenAt` records when a candidate's data was
  collected under an applicable legal basis; `organizations.dataRetentionDays` drives
  scheduled anonymization of PII past retention.
- **Applicable regimes:** the platform should be built to support both the EU/UK GDPR model
  (lawful basis, right to erasure, data portability) and India's Digital Personal Data
  Protection Act, 2023 (consent-based processing, purpose limitation, breach notification),
  since the initial team and likely early customers are India-based. This is a compliance
  posture, not legal advice — a lawyer should review the final consent flows and retention
  policy before launch.
- **Audit logging:** every read of a candidate's personal data, every scoring-weight change,
  and every role change is written to `auditLogs` with actor, timestamp, and IP.
- **Rate limiting & abuse prevention:** login attempts are rate-limited per IP and per
  account to slow credential-stuffing; bulk-upload endpoints are rate-limited separately
  from normal API traffic given their cost.
- **Secrets management:** `SUPABASE_JWT_SECRET` / JWKS URL, Mongo connection string, Redis
  URL, and LLM provider keys are injected via environment variables through the hosting
  platform's secret manager — never committed, never logged.

---

## 6. Environment Variables (Backend)

```
SUPABASE_URL=
SUPABASE_ANON_KEY=            # used only by the frontend
SUPABASE_JWT_SECRET=          # or SUPABASE_JWKS_URL for asymmetric keys
SUPABASE_SERVICE_ROLE_KEY=    # backend-only, for Storage signed URLs
MONGODB_URI=
REDIS_URL=
SESSION_COOKIE_SECRET=
NODE_ENV=production
```

Frontend (`.env` for Vite, `VITE_` prefixed, safe to expose):
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_API_BASE_URL=
```
