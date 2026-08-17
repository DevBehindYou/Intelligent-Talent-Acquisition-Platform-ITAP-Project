# ITAP — QA & Verification Report
**Document 12 — What Was Actually Tested**

This document exists because "it's built" and "it works" are different claims. Below is
exactly what was run, against real tooling, in the sandbox this project was built in —
and, just as importantly, what wasn't possible to verify there and still needs a real check
on your end before this goes live.

---

## 1. What Was Verified (with evidence)

| Check | How | Result |
|---|---|---|
| Frontend installs cleanly | `npm install` | Succeeded, all declared dependencies resolved |
| Frontend compiles for production | `npm run build` (Vite) | Succeeded. First build flagged a real problem — see §3 |
| Frontend bundle is code-split | Rebuilt after adding `React.lazy` per route + manual vendor chunks | Confirmed: no chunk-size warning, largest chunk 383KB (was one 1.14MB bundle) |
| All frontend imports resolve | Custom script walking every `.js`/`.jsx` import against the filesystem | 0 missing imports |
| All frontend npm packages used are declared | Custom script cross-referencing imports against `package.json` | 0 missing (2 found and fixed on the first pass: `@hookform/resolvers`, and a stale entry was cleaned up) |
| Backend installs cleanly | `npm install` | Succeeded |
| Backend syntax is valid | `node --check` on every `.js` file | 0 errors |
| Backend imports resolve | Same import-walking script as frontend | 0 missing imports |
| Backend boots and serves real HTTP requests | Started the actual Express app (not a mock), hit live endpoints | `GET /health` → 200; `GET /api/jobs` (no session) → 401; `GET /api/talent-search`, `/api/messaging/draft`, `/api/talent-pools` (no session) → 401 each; unknown route → 404 |
| Backend's full runtime import graph executes | Ran `server.js` itself (not just `node --check`) | All 11 route files, controllers, services, models, and middleware loaded and executed without error; failed only at the expected point (MongoDB connection — see §2) |
| BullMQ/Redis queue wiring is real | Installed Redis via `apt`, started it, connected the actual queue and worker to it | `resumeParsingQueue.waitUntilReady()` and the in-process worker's `waitUntilReady()` both resolved successfully against real Redis |
| Unit tests pass | `npx vitest run` against `backend/tests/matchingService.test.js` | 2/2 passed — confirms the scoring algorithm actually ranks a strong candidate above a weak one, and correctly caps the score when a must-have skill is missing |
| AI service installs cleanly | Fresh venv, `pip install -r requirements.txt` | Succeeded, no dependency conflicts |
| AI service boots and serves real requests | Started `uvicorn`, hit live endpoints | `GET /health` → 200 |
| Resume parsing actually extracts real fields | `POST /parse` with a realistic resume text sample | Correctly extracted full name, email, current title, experience years, education entry (with year), one certification, and 5 skills across categories |
| Embeddings are semantically meaningful, not just non-crashing | Direct Python check: cosine similarity between related vs. unrelated text | Similar text ("Python FastAPI Docker" vs. "...+ AWS") → 0.87 similarity. Unrelated text ("Marketing sales copywriting") → 0.0 similarity |
| LLM fallback contract holds end-to-end | `POST /llm/explain` with `LLM_PROVIDER` unset | Correctly returned `503`, which is exactly the signal Node's `aiServiceClient` needs to fall back to its own template — confirmed by design, not just by reading the code |
| Design fidelity | Read the full HTML/CSS of all 7 supplied Stitch screens (3 were only skimmed in the first pass — corrected in the second pass) | Talent Search, Talent Pools, and Messaging pages were substantially rebuilt after finding they didn't match the actual supplied design (see docs/06 and the git history of this build for what changed) |
| Mobile layout | Manual review of every page's responsive classes; fixed issues found | Sidebar had **no off-canvas behavior at all** below desktop width — fixed with a proper slide-in drawer. Three dense `grid-cols-12` tables (ranking list, pipeline table, audit log) would have broken layout on narrow screens — fixed with horizontal-scroll wrappers. Action-button rows in page headers and the candidate detail hero didn't wrap — fixed |

---

## 2. What Could Not Be Verified in This Environment (and why)

| Gap | Reason | What to do |
|---|---|---|
| Full end-to-end flow against a real MongoDB | MongoDB isn't in Ubuntu's package repos (removed years ago over licensing), and MongoDB's own download servers weren't reachable from this sandbox's network allowlist | Run `docker compose up` on your own machine/CI — this is the single most important thing to do before treating this as production-ready. Everything up to the Mongo connection was verified; the actual read/write paths (create a job, upload a resume, see it ranked) were not exercised against a live database |
| Actual browser rendering | No browser available in this environment — verification was build-success + static analysis, not visual inspection | Run `npm run dev` and click through the app yourself, side-by-side with the design-reference screenshots, before sign-off |
| Real screen sizes / device testing | No browser, so responsive fixes were verified by reading the generated Tailwind classes, not by resizing an actual viewport | Test at 375px (mobile), 768px (tablet), 1024px+ (desktop) in real dev tools |
| Supabase Auth end-to-end | Requires a real Supabase project and network access this sandbox doesn't have | Create a project, fill in `.env`, and test signup → login → session refresh manually |
| Accessibility (WCAG 2.2 AA) | No automated a11y tooling (axe, Lighthouse) was run | Run an axe/Lighthouse pass before launch — docs/05-ui-ux-design-system.md §11 has the specific requirements to check against (Match Dial `aria-label`, focus rings, color-independent status) |
| Load testing at the 500-resume/job scale documented as a success metric | Requires a running stack with real data volume | Not attempted here — flagged as an open Phase 3 item in docs/08-development-roadmap.md |
| Cross-browser testing | No browser in this environment | Standard pre-launch check — Vite's default target should cover evergreen browsers without extra config |

---

## 3. Real Issues Found and Fixed During This Build

Listed because "we tested it and fixed what broke" is more credible than "we tested it and
it was fine" for a project built in one pass:

1. **1.14MB single JS bundle, no code splitting** — caught by Vite's own build warning.
   Fixed with `React.lazy` per route (`app/routes.jsx`) and manual vendor chunking
   (`vite.config.js`). Rebuilt and confirmed the warning is gone.
2. **Sidebar had no mobile/off-canvas mode** — it was a permanently-visible flex column at
   every viewport width, contradicting docs/05-ui-ux-design-system.md §12's own
   requirement. Rebuilt as a slide-in drawer with backdrop and hamburger trigger.
3. **Three dense tables would break on narrow screens** — `RankingList`, `PipelineTable`,
   and the admin audit log all used a fixed `grid-cols-12` layout with no horizontal-scroll
   fallback. Fixed by wrapping each in `overflow-x-auto` with a `min-width`.
4. **Action-button rows didn't wrap** — page header actions and the candidate detail hero's
   button row could overflow rather than wrap to a new line on narrow screens. Fixed with
   `flex-wrap`.
5. **Three design screens were under-analyzed in the first pass** — AI Search
   Configuration, Personalized Messaging, and Talent Pools were only checked by
   grep'ing section headers, not reading the full markup. On a full re-read, all three
   turned out to be meaningfully different from what had been built (a weighted-ranking
   live-preview panel, an inline AI-highlighted message composer with a sourced reasoning
   panel, and health-dial pool cards, respectively). All three were rebuilt against the
   actual supplied HTML, with corresponding backend support added (weighted talent search
   scoring, structured message "insertions" for inline highlighting, pool health scoring).
6. **A resume-parsing design gap**: the original processor sent pre-extracted text to the
   AI service, but only handled `.txt` extraction locally — PDFs and DOCX files would have
   arrived at the AI service as empty strings. Fixed by moving real extraction
   (`pypdf`/`python-docx`) into the AI service itself, with the Node side sending file bytes
   instead of attempting its own extraction.

---

## 4. Recommended Next Steps Before Production

1. `docker compose up --build` locally with a real Supabase project configured — walk
   through signup → create a job → upload a real PDF resume → confirm it appears ranked.
2. Resize the browser (or use device emulation) through the full range in
   docs/05-ui-ux-design-system.md §12 and confirm against the design-reference screenshots.
3. Run an accessibility audit (axe or Lighthouse) against the core recruiter/HR flows.
4. Load-test resume upload at the 500-file/job scale referenced in
   docs/00-project-overview.md's success metrics.
5. Security review of the auth cookie flow and rate limiting before handling real candidate
   PII — docs/04-auth-security.md §5 has the compliance posture to review against.
