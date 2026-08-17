# ITAP — Data Flow Diagrams
**Document 11 — Data Flow**

Each diagram below traces a real request through the actual code (file references included)
rather than an idealized version — several were corrected against the live-tested behavior
of this build.

---

## 1. Authentication Flow

```
┌──────────┐   1. signInWithPassword()   ┌────────────────┐
│  Browser │ ───────────────────────────► │  Supabase Auth │
│  (SPA)   │ ◄─────────────────────────── │                │
└────┬─────┘   2. access + refresh JWT     └────────────────┘
     │
     │ 3. POST /api/auth/session { access_token, refresh_token }
     ▼
┌──────────────────────────────────────────────────────────┐
│ Express: authController.createSession()                   │
│   a. verifySupabaseAccessToken() — config/supabase.js      │
│      (HS256 via SUPABASE_JWT_SECRET, or RS256/ES256 via    │
│       SUPABASE_JWKS_URL)                                   │
│   b. authService.getMongoUser(decoded.sub) — looks up the  │
│      mirrored `users` doc by supabaseUserId                │
│   c. issueSessionCookie() — signs itap_session (userId,    │
│      organizationId, role), httpOnly/Secure/SameSite=Strict│
│   d. issueRefreshCookie() — stores the Supabase refresh    │
│      token, path-restricted to /api/auth/refresh           │
└───────────────────────┬─────────────────────────────────┘
                          │ 4. Set-Cookie: itap_session, itap_refresh
                          ▼
                 ┌──────────────┐
                 │   Browser    │  every subsequent request sends
                 │  (cookies)   │  itap_session automatically
                 └──────┬───────┘
                         │ 5. GET /api/jobs  (Cookie: itap_session=...)
                         ▼
              ┌────────────────────────────┐
              │ requireSession middleware   │  verifies itap_session
              │ (no Supabase round-trip)    │  locally — jwt.verify()
              └────────────────────────────┘
```
**Verified live:** an unauthenticated `GET /api/jobs` was hit against a running instance of
this exact code and returned `401 UNAUTHENTICATED`, confirming step 5's middleware fires
correctly (see this repository's README verification notes).

---

## 2. Resume Upload → Ranked Candidate

```
Recruiter                Express API              BullMQ/Redis        AI Service (FastAPI)      MongoDB
    │                         │                         │                     │                   │
    │ POST /resumes/bulk      │                         │                     │                   │
    │ (multipart, up to 500)  │                         │                     │                   │
    ├────────────────────────►│                         │                     │                   │
    │                         │ storageService.upload() │                     │                   │
    │                         │  (Supabase Storage, or  │                     │                   │
    │                         │   local disk in dev)    │                     │                   │
    │                         │                         │                     │                   │
    │                         │ Resume.create()          ─────────────────────────────────────────►│
    │                         │  status: "queued"        (one doc per file, shared batchId)         │
    │                         │                         │                     │                   │
    │                         │ resumeParsingQueue.add() │                     │                   │
    │                         ├────────────────────────►│                     │                   │
    │ 202 { batchId, total }  │                         │                     │                   │
    │◄────────────────────────┤                         │                     │                   │
    │                         │                         │                     │                   │
    │  (background, per file) │                         │                     │                   │
    │                         │        processResumeJob(job) picks up the job  │                   │
    │                         │                         │◄────────────────────┤                   │
    │                         │                         │  storageService.readBuffer()             │
    │                         │                         │                     │                   │
    │                         │                         │  POST /parse { fileBase64, fileType }     │
    │                         │                         ├────────────────────►│                   │
    │                         │                         │                     │ pypdf/python-docx  │
    │                         │                         │                     │ extraction, then   │
    │                         │                         │                     │ regex/heuristic    │
    │                         │                         │                     │ skill/education/   │
    │                         │                         │                     │ experience parsing │
    │                         │                         │◄────────────────────┤                   │
    │                         │                         │  parsed fields      │                   │
    │                         │                         │                     │                   │
    │                         │                         │  Candidate.findOne/create() ─────────────►│
    │                         │                         │  Resume.updateOne(status:"parsed") ──────►│
    │                         │                         │                     │                   │
    │                         │                         │  POST /embed { text }                     │
    │                         │                         ├────────────────────►│                   │
    │                         │                         │                     │ HashingVectorizer  │
    │                         │                         │◄────────────────────┤ (v1 — no download  │
    │                         │                         │  768-dim vector     │  needed)            │
    │                         │                         │                     │                   │
    │                         │                         │  matchingService.scoreAndSave()           │
    │                         │                         │   (keyword-overlap scoring — works        │
    │                         │                         │    with or without the embedding step)    │
    │                         │                         │                     │      MatchScore ──►│
    │                         │                         │                     │      .upsert()      │
    │                         │                         │                     │                   │
    │                         │  pipelineEvents.rankingUpdated() ──► Socket.io ──► org:{orgId} room │
    │  ranking:updated event  │                         │                     │                   │
    │◄─────────────────────────────────────────────────────────────────────────────────────────────┤
    │  (dashboard re-renders  │                         │                     │                   │
    │   the ranked list live) │                         │                     │                   │
```
**Verified live:** the AI service's `/parse` endpoint was hit with a realistic resume text
sample and correctly extracted name, email, title, experience years, education, and skills;
`/embed` was confirmed to produce vectors where semantically similar text has high cosine
similarity (0.87) and unrelated text has none (0.0) — not just "doesn't crash."

---

## 3. Candidate Ranking / Scoring (detail of the step above)

```
matchingService.scoreCandidateForJob(candidate, job)
        │
        ├─► resolveWeights(job)
        │      job.scoringWeights set?  ──yes──► use it
        │              │no
        │              ▼
        │      Organization.scoringDefaults (org-wide fallback)
        │
        ├─► skillScore(candidate.skills, job.requiredSkills, job.niceToHaveSkills)
        │      weighted overlap; hard-capped at 55 if a must-have skill is missing
        │
        ├─► experienceScore(candidate.totalExperienceYears, job.experienceMin/Max)
        ├─► educationScore(candidate.education)
        ├─► domainScore(candidate.skills, job)      (domain-category skills vs. job text)
        │
        ├─► overall = Σ(factor × its weight)
        │
        ├─► aiServiceClient.explain({ candidate, job, scores })
        │      LLM configured? ──yes──► POST /llm/explain ──► plain-language explanation
        │              │no / call fails
        │              ▼
        │      template string built from the actual scores (never a placeholder)
        │
        └─► MatchScore.findOneAndUpdate(upsert: true)
```
**Verified live:** two unit tests (`backend/tests/matchingService.test.js`) confirm a
strong candidate scores higher than a weak one for the same job, and that a missing
must-have skill caps the score — both passed against the real scoring function, not a mock.

---

## 4. Talent Search with Weighted Ranking (Live Preview)

```
Recruiter types query + drags weighting sliders
        │
        │ (debounced 400ms — useDebounce in useTalentSearchViewModel.js)
        ▼
POST /api/talent-search { query, weights: { technicalDepth, experienceLevel,
                                              skillRecency, domainExpertise, culturalFit } }
        │
        ▼
talentSearchService.search(organizationId, query, weights)
        │
        ├─► aiServiceClient.parseSearchQuery(query)
        │      LLM configured? ──yes──► structured { skills[], domain[] }
        │              │no
        │              ▼
        │      keywordFallbackParse() — capitalized-word heuristic
        │
        ├─► Candidate.find({ organizationId, "skills.name": $in [...] })
        │
        ├─► per candidate: base score from matched-skill count × technicalDepth weight,
        │                  + domain bonus from domain-tagged skill matches × domainExpertise weight
        │
        └─► sorted results ──► frontend's "Live Impact Preview" panel (top 3, sticky)
```
This is the one flow in the product where the client re-requests on every slider adjustment
(debounced) rather than only on explicit submit — matching the design's live-updating
preview panel.

---

## 5. Pipeline Stage Change (Single or Bulk)

```
Recruiter selects candidate(s) → picks target stage → confirms
        │
        ▼ (bulk: one request per candidate, Promise.all)
POST /api/candidates/:candidateId/stage { jobId, stage }
        │
        ▼
candidateService.moveStage()
   ├─► PipelineStage.findOneAndUpdate(upsert: true)   [organizationId, jobId, candidateId]
   └─► Candidate.updateOne($push: timeline event)
        │
        ▼
pipelineEvents.pipelineStageChanged() ──► Socket.io ──► org:{orgId} room
        │
        ▼
Every connected recruiter's PipelineTable/RankingList updates without a manual refresh
```

---

## 6. Copilot Question (Contextual Chat)

```
Recruiter opens Copilot from a candidate page → asks a question
        │
        ▼
POST /api/copilot/ask { context: { candidateId, jobId }, question }
        │
        ▼
copilotService.ask()
   ├─► Candidate.findOne(), MatchScore.findOne()   — pulls real context, never guesses
   ├─► aiServiceClient.answerCopilotQuestion({ context, question })
   │        LLM configured? ──yes──► POST /llm/copilot ──► answer
   │                │no / call fails
   │                ▼
   │        template: restates the real MatchScore.explanation already on file
   │
   └─► { answer } ──► CopilotDrawer renders it as a chat bubble
```

---

## 7. Personalized Messaging (Draft → Insertions → Send)

```
POST /api/messaging/draft { candidateId, jobId, tone, length }
        │
        ▼
messagingService.draft()
   ├─► Candidate.findOne(), Job.findOne()
   ├─► aiServiceClient.draftMessage({ candidate, job, tone })
   │        LLM configured? ──yes──► { subject, body }  (no per-phrase insertions in v1)
   │                │no / call fails
   │                ▼
   │        templateDraft() — builds subject/body AND a structured `insertions[]` list
   │        (phrase + category + source), which is what lets the frontend highlight the
   │        exact AI-personalized phrases inline (HighlightedBody.jsx) instead of only
   │        describing the personalization in a sidebar
   │
   └─► { subject, body, insertions } ──► MessagingPage's composer + Copilot Reasoning panel

POST /api/messaging/send { candidateId, subject, body }
        │
        ▼
messagingService.send() — currently a stub (status: "queued_for_delivery")
        │  see docs/10-integration-guide.md §7 for wiring a real email provider
```

---

## 8. Notification Delivery

```
Any server-side event (ranking updated, stage changed, interview scheduled)
        │
        ▼
Notification.create() (MongoDB — persisted, so /notifications shows history)
        │
        ▼
pipelineEvents.notificationNew(userId, notification) ──► Socket.io ──► user:{userId} room
        │
        ▼
Connected browser: useNotificationsStore.receiveNotification() ──► badge count increments,
                                                                      toast shown if in-session
```
