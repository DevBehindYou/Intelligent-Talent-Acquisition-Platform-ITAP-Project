# ITAP — API Documentation
**Document 4 of 9**

Base URL (example): `https://api.itap.app/v1`

All endpoints require an authenticated session (httpOnly cookie set after Supabase login —
see Document 4 for the full flow) unless marked **Public**.

---

## 1. Conventions

**Response envelope**
```json
{
  "success": true,
  "data": { },
  "meta": { "page": 1, "pageSize": 20, "total": 134 }
}
```

**Error envelope**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "requiredSkills must include at least one skill",
    "details": { "field": "requiredSkills" }
  }
}
```

**Pagination:** `?page=1&pageSize=20` on all list endpoints.
**Filtering:** `?status=open&department=engineering`
**Sorting:** `?sortBy=overallScore&order=desc`

**Rate limits:** 300 requests/min per authenticated user on read endpoints, 60/min on
write endpoints, 10/min on bulk-upload endpoints.

---

## 2. Auth

| Method | Path | Description |
|---|---|---|
| POST | `/auth/signup` | **Public.** Creates a Supabase Auth user + mirrored Mongo `users` doc |
| POST | `/auth/login` | **Public.** Verifies Supabase credentials, sets httpOnly session cookie |
| POST | `/auth/logout` | Clears session cookie, revokes refresh token |
| POST | `/auth/refresh` | Rotates access token using the refresh cookie |
| GET | `/auth/me` | Returns the current user's profile + role + organization |
| POST | `/auth/forgot-password` | **Public.** Triggers Supabase password-reset email |

---

## 3. Jobs

| Method | Path | Description |
|---|---|---|
| GET | `/jobs` | List jobs (filter by status/department) |
| POST | `/jobs` | Create a job requisition |
| GET | `/jobs/:jobId` | Job detail |
| PATCH | `/jobs/:jobId` | Update job (skills, weights, status) |
| DELETE | `/jobs/:jobId` | Archive a job (soft delete) |
| GET | `/jobs/:jobId/pipeline` | Candidates grouped by pipeline stage for this job |

**POST `/jobs`** — example request:
```json
{
  "title": "Senior Backend Engineer",
  "department": "Engineering",
  "description": "…",
  "requiredSkills": [
    { "name": "Node.js", "weight": 0.3, "mustHave": true },
    { "name": "MongoDB", "weight": 0.2, "mustHave": true }
  ],
  "niceToHaveSkills": ["Docker", "AWS"],
  "experienceMin": 5,
  "experienceMax": 10,
  "location": "Remote",
  "employmentType": "full_time"
}
```

---

## 4. Resumes

| Method | Path | Description |
|---|---|---|
| POST | `/resumes` | Upload a single resume (multipart) |
| POST | `/resumes/bulk` | Bulk upload (zip or multiple files), enqueues parsing jobs |
| GET | `/resumes/:resumeId` | Resume metadata + parsing status |
| GET | `/resumes/:resumeId/download` | Returns a short-lived signed URL |
| DELETE | `/resumes/:resumeId` | Remove a resume (does not delete the candidate) |

**Bulk upload response** (job enqueued, not synchronous):
```json
{
  "success": true,
  "data": {
    "batchId": "b_8f21",
    "totalFiles": 500,
    "status": "processing"
  }
}
```
Progress is pushed over the `resume-batch:progress` Socket.io event, not polled.

---

## 5. Candidates

| Method | Path | Description |
|---|---|---|
| GET | `/candidates` | List/search candidates (org-wide talent pool) |
| GET | `/candidates/:candidateId` | Candidate profile (parsed fields, skills, history) |
| PATCH | `/candidates/:candidateId` | Manual correction of parsed fields |
| GET | `/candidates/:candidateId/duplicates` | Suggested duplicate/near-duplicate candidates |
| POST | `/candidates/:candidateId/stage` | Move candidate to a pipeline stage for a given job |

---

## 6. Matching & Ranking

| Method | Path | Description |
|---|---|---|
| GET | `/jobs/:jobId/rankings` | Ranked candidate list for a job, with score breakdown |
| GET | `/jobs/:jobId/rankings/:candidateId/explanation` | Full plain-language ranking explanation |
| PATCH | `/jobs/:jobId/scoring-weights` | Adjust per-job scoring weights (recruiter/HR admin) |
| POST | `/matching/recompute/:jobId` | Force a re-score of all candidates against this job |

**GET `/jobs/:jobId/rankings`** — example response item:
```json
{
  "candidateId": "c_9a12",
  "fullName": "Candidate Name",
  "overallScore": 92,
  "skillScore": 95,
  "experienceScore": 88,
  "educationScore": 90,
  "reasonTags": ["required-skills-present", "similar-project-experience"]
}
```

---

## 7. Interviews

| Method | Path | Description |
|---|---|---|
| GET | `/candidates/:candidateId/questions?jobId=` | AI-generated interview questions |
| POST | `/candidates/:candidateId/questions/regenerate` | Regenerate with different emphasis |
| POST | `/interviews` | Schedule an interview |
| GET | `/interviews/:interviewId` | Interview detail |
| POST | `/interviews/:interviewId/feedback` | Submit structured feedback |

---

## 8. Talent Search (Natural Language)

| Method | Path | Description |
|---|---|---|
| POST | `/talent-search` | Body: `{ "query": "Python developers with Kubernetes and healthcare experience" }` |

Response returns a ranked candidate list plus the parsed structured filters the AI derived
from the natural-language query, shown back to the recruiter for transparency:
```json
{
  "parsedFilters": {
    "skills": ["Python", "Kubernetes"],
    "domain": ["Healthcare"]
  },
  "results": [ /* candidate summaries with similarity score */ ]
}
```

---

## 9. Copilot (Explainability Chat)

| Method | Path | Description |
|---|---|---|
| POST | `/copilot/ask` | Body: `{ "context": {"jobId","candidateId"}, "question": "Why is Candidate A ranked above Candidate B?" }` — streamed response |

---

## 10. Analytics

| Method | Path | Description |
|---|---|---|
| GET | `/analytics/dashboard` | Org-wide KPI summary (applications, shortlisted, interviews, offers, avg match score) |
| GET | `/analytics/time-to-hire` | Time-to-screen / time-to-hire trend data |
| GET | `/analytics/skill-demand` | Most-requested skills across open jobs |

---

## 11. Admin

| Method | Path | Description |
|---|---|---|
| GET | `/admin/users` | List org users |
| POST | `/admin/users/invite` | Invite a new recruiter/hiring manager |
| PATCH | `/admin/users/:userId/role` | Change role |
| PATCH | `/admin/organization/scoring-defaults` | Org-wide default scoring weights |
| GET | `/admin/audit-logs` | Paginated audit trail |

---

## 12. WebSocket Events (Socket.io)

| Event | Payload | Fired when |
|---|---|---|
| `resume-batch:progress` | `{ batchId, processed, total }` | During bulk resume parsing |
| `ranking:updated` | `{ jobId, candidateId, overallScore }` | After a score is (re)computed |
| `pipeline:stage-changed` | `{ jobId, candidateId, stage }` | On stage move |
| `notification:new` | `{ notification }` | Any new notification for the connected user |
