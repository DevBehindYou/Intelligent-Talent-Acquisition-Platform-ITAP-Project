# ITAP — Pages & User Flows
**Document 7 of 9**

---

## 1. Full Page Inventory

### 1.1 Public / Unauthenticated
| Page | Path | Purpose |
|---|---|---|
| Login | `/login` | Email/password + OAuth via Supabase |
| Register (invite-based) | `/register?invite=` | Org invite acceptance flow |
| Forgot Password | `/forgot-password` | Triggers Supabase reset email |
| Reset Password | `/reset-password?token=` | Sets new password |

### 1.2 Shared (all authenticated roles)
| Page | Path | Purpose |
|---|---|---|
| Dashboard (role-scoped) | `/` | KPI summary, recent activity, quick actions |
| Notifications | `/notifications` | Full notification history |
| Profile / Account Settings | `/settings/profile` | Name, avatar, password, notification prefs |

### 1.3 Recruiter
| Page | Path | Purpose |
|---|---|---|
| Job List | `/jobs` | All jobs the recruiter owns/has access to |
| Create/Edit Job | `/jobs/new`, `/jobs/:jobId/edit` | Job requisition form |
| Job Detail (Pipeline View) | `/jobs/:jobId` | Kanban pipeline for that job |
| Candidate Ranking List | `/jobs/:jobId/rankings` | Ranked table view, alternative to kanban |
| Candidate Detail | `/candidates/:candidateId` | Full profile, score breakdown, Copilot |
| Resume Upload | `/jobs/:jobId/upload` | Single + bulk upload |
| Talent Search | `/talent-search` | Natural-language search across the whole pool |
| Interview Scheduling | `/candidates/:candidateId/schedule` | Scheduling modal/page |
| Scoring Weights (per job) | `/jobs/:jobId/scoring` | Adjust weight sliders for this requisition |

### 1.4 Hiring Manager
| Page | Path | Purpose |
|---|---|---|
| My Shortlists | `/shortlists` | Only candidates shared with this hiring manager |
| Candidate Comparison | `/shortlists/compare?ids=` | Side-by-side comparison of shortlisted candidates |
| Candidate Detail (read + feedback) | `/candidates/:candidateId` | Same page as recruiter, permission-gated actions |
| Interview Feedback Form | `/interviews/:interviewId/feedback` | Structured scorecard |

### 1.5 HR Administrator
| Page | Path | Purpose |
|---|---|---|
| Org Dashboard | `/admin` | Cross-team analytics |
| User Management | `/admin/users` | Invite, deactivate, change roles |
| Scoring Defaults | `/admin/scoring-defaults` | Org-wide weight configuration + rubric templates |
| Audit Log | `/admin/audit-log` | Searchable, filterable action history |
| Data & Compliance | `/admin/compliance` | Retention window, consent settings, export |
| Analytics | `/analytics` | Time-to-hire, funnel, skill-demand trends |

---

## 2. Key User Flows

### 2.1 Recruiter: Create Job → Get Ranked Candidates
```
Login
  │
  ▼
Jobs → "New Job"
  │
  ▼
Fill job form (title, required skills + weights, experience range)
  │
  ▼
Save as Draft ──► Publish (status: open)
  │
  ▼
Job Detail page → "Upload Resumes"
  │
  ▼
Bulk upload (drag & drop, up to 500 files)
  │
  ▼
Live progress bar (Socket.io) → "Parsing 214 / 500..."
  │
  ▼
Ranking List populates incrementally as each resume finishes scoring
  │
  ▼
Recruiter reviews Match Dial + explanation → moves candidate to "Shortlisted"
```

### 2.2 Recruiter: Natural-Language Talent Search
```
Talent Search page
  │
  ▼
Types: "Python developers with Kubernetes and healthcare experience"
  │
  ▼
System shows parsed filters back: Skills [Python, Kubernetes] · Domain [Healthcare]
  │  (recruiter can edit/remove a parsed filter before running the search)
  ▼
Ranked results list, same Match Dial component as job rankings
  │
  ▼
"Add to Job" action → attaches candidate to an open requisition's pipeline
```

### 2.3 Hiring Manager: Compare & Decide
```
Notification: "3 new candidates shortlisted for Senior Backend Engineer"
  │
  ▼
My Shortlists → select 3 candidates → "Compare"
  │
  ▼
Side-by-side comparison view (scores, skills, resume summary, AI explanation)
  │
  ▼
Leave structured feedback per candidate → Approve one to advance to "Interviewing"
```

### 2.4 HR Admin: Configure Org Scoring Defaults
```
Admin → Scoring Defaults
  │
  ▼
Adjust default weight sliders (Skills / Experience / Education / Domain)
  │  live preview: "This would move Candidate X from #4 to #2 on Job Y" (sandboxed, not applied)
  ▼
Save → new jobs inherit these defaults; existing jobs keep their own override unless reset
```

### 2.5 Onboarding (First Login)
```
Accept invite email → Register page (name, password) → Supabase account created
  │
  ▼
Mongo `users` doc created/linked via supabaseUserId
  │
  ▼
Role-based first dashboard shown (recruiter sees "Create your first job",
hiring manager sees "No shortlists yet", HR admin sees org setup checklist)
```

---

## 3. Wireframe-Level Layouts (ASCII)

### 3.1 Recruiter Dashboard
```
┌───┬──────────────────────────────────────────────────────────────────┐
│ ▤ │  ITAP            [ Search... ]                    🔔   ⚙  [Avatar]│
│ 🏠│──────────────────────────────────────────────────────────────────│
│ 💼│  Good morning, Ashutosh                                          │
│ 👤│                                                                    │
│ 🔍│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐             │
│ 📅│  │Applications│ │Shortlisted│ │Interviews│ │Avg Match │             │
│ 📊│  │  1,250    │ │   148    │ │    65    │ │   84%    │             │
│   │  └──────────┘ └──────────┘ └──────────┘ └──────────┘             │
│   │                                                                    │
│   │  Open Jobs                              Recent Activity           │
│   │  ┌────────────────────────────┐         ┌───────────────────────┐│
│   │  │ Senior Backend Eng.  ● Open │         │ 12 candidates ranked  ││
│   │  │ 214/500 parsed  ▓▓▓▓▓░░░░ │         │ for Backend Eng.      ││
│   │  │                              │         │ 2 min ago              ││
│   │  │ Product Designer     ● Open │         │───────────────────────││
│   │  │ Fully ranked  ▓▓▓▓▓▓▓▓▓▓ │         │ Candidate moved to    ││
│   │  └────────────────────────────┘         │ Interviewing          ││
│   │                                            └───────────────────────┘│
└───┴──────────────────────────────────────────────────────────────────┘
```

### 3.2 Candidate Ranking List (Job Detail)
```
┌───┬──────────────────────────────────────────────────────────────────┐
│   │  Senior Backend Engineer            [Kanban] [Ranked List ●]     │
│   │  1,250 applicants · sorted by Match Score ▼                      │
│   │──────────────────────────────────────────────────────────────────│
│   │   ╭───╮                                                           │
│   │   │92%│ Jane Doe               Skills 95 · Exp 88 · Edu 90        │
│   │   ╰───╯ Senior SWE, 6 yrs        ✓ Required skills present         │
│   │                                  ✓ Similar project experience      │
│   │           [ View Profile ]  [ Shortlist ]  [ Schedule ]           │
│   │──────────────────────────────────────────────────────────────────│
│   │   ╭───╮                                                           │
│   │   │87%│ Alex Kim               Skills 90 · Exp 82 · Edu 85        │
│   │   ╰───╯ Backend Eng, 5 yrs                                        │
│   │──────────────────────────────────────────────────────────────────│
│   │   (Match Dial = tick-marked semicircular gauge, brass fill,       │
│   │    bold mono numeral in the center)                               │
└───┴──────────────────────────────────────────────────────────────────┘
```

### 3.3 Candidate Detail (with Copilot Drawer)
```
┌───┬───────────────────────────────────────────┬──────────────────────┐
│   │  ← Back to rankings                        │  ✦ Copilot            │
│   │                                             │  ─────────────────── │
│   │   ╭─────╮   Jane Doe                        │  "Why is Jane ranked  │
│   │   │ 92% │   Senior Software Engineer        │  above Alex?"         │
│   │   ╰─────╯   jane@email.com · 6 yrs exp       │                       │
│   │                                             │  Jane scored higher   │
│   │  Skills           Score Breakdown           │  because:             │
│   │  ● Python ● FastAPI  Skills      95         │  • Stronger FastAPI   │
│   │  ● Docker ● AWS      Experience  88         │    experience         │
│   │                       Education   90         │  • 3 more years of    │
│   │  Education                                   │    backend dev        │
│   │  B.Tech, XYZ University            Interview │  • AWS certification  │
│   │                                    Questions  │                       │
│   │  Certifications                    ────────  │  [ Ask another        │
│   │  AWS Certified Developer          1. Explain │    question... ]      │
│   │                                    dependency│                       │
│   │  [ Move to Interviewing ]  [ Reject ]  injection                     │
└───┴───────────────────────────────────────────┴──────────────────────┘
```

### 3.4 Job Creation Form
```
┌───┬──────────────────────────────────────────────────────────────────┐
│   │  New Job Requisition                                              │
│   │──────────────────────────────────────────────────────────────────│
│   │  Title            [ Senior Backend Engineer            ]         │
│   │  Department       [ Engineering            ▾ ]                    │
│   │  Description       ┌────────────────────────────────────┐        │
│   │                     │ (rich text)                        │        │
│   │                     └────────────────────────────────────┘        │
│   │  Required Skills    [ Node.js  x ] [ MongoDB  x ] [ + Add ]       │
│   │                       weight ▓▓▓▓░░  weight ▓▓▓░░░                │
│   │  Nice-to-have        [ Docker  x ] [ AWS  x ] [ + Add ]           │
│   │  Experience          Min [ 5 ] – Max [ 10 ] years                  │
│   │  Location            [ Remote        ▾ ]                          │
│   │                                                                    │
│   │                       [ Save as Draft ]     [ Publish Job ]        │
└───┴──────────────────────────────────────────────────────────────────┘
```

### 3.5 Talent Search
```
┌───┬──────────────────────────────────────────────────────────────────┐
│   │  Talent Search                                                     │
│   │  ┌────────────────────────────────────────────────────┐  [Search] │
│   │  │ Find Python developers with Kubernetes and          │           │
│   │  │ healthcare experience...                             │           │
│   │  └────────────────────────────────────────────────────┘           │
│   │  Understood as:  [Skills: Python ×] [Skills: Kubernetes ×]        │
│   │                   [Domain: Healthcare ×]                           │
│   │──────────────────────────────────────────────────────────────────│
│   │   ╭───╮  Sam Rivera    Python · Kubernetes · Healthcare (Payer)   │
│   │   │89%│                                    [ Add to Job ▾ ]       │
│   │   ╰───╯                                                           │
└───┴──────────────────────────────────────────────────────────────────┘
```

---

## 4. Handoff Notes for the Design Team

- Build the **Match Dial** as a standalone Figma component first — it's reused on every
  screen above and is the signature visual element (see Document 5, Section 2).
- Design the ranked list row and the kanban card as two views of the *same* candidate-summary
  component, not two separate designs, since they share the same underlying data.
- The Copilot drawer is the only dark surface in the product — don't let dark-mode styling
  leak into the main content area.
- Every page needs an empty state and a loading (skeleton) state designed alongside the
  populated state — see Document 5, Section 9, for the tone to use in empty-state copy.
