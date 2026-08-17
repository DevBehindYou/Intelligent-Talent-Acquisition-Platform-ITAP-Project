# ITAP — Component Library
**Document 8 of 9**

Conventions used below: components live under `shared/components/` unless marked
**(feature)**, in which case they live under `features/<name>/components/`. All components
are function components, styled with Tailwind utility classes plus the tokens in Document 5.

---

## 1. Primitives

### `Button`
Props: `variant` (`primary` | `secondary` | `ghost` | `danger`), `size` (`sm` | `md` | `lg`),
`isLoading`, `leftIcon`, `disabled`, `onClick`.
States: default, hover, focus (visible `prussian` ring), active, disabled, loading (spinner
replaces label, width does not shift).

### `Input` / `Textarea`
Props: `label`, `error`, `hint`, `leftIcon`, `type`.
Error state shows a `danger`-bordered field + inline message + `aria-describedby` linking to it.

### `Select` / `MultiSelect`
Props: `options`, `value`, `onChange`, `searchable`.
Used for department, employment type, skill tag entry (multi-select with weight sliders
attached per tag for the job form).

### `Checkbox` / `Toggle`
Standard, `prussian` when checked.

### `Badge`
Props: `tone` (`neutral` | `success` | `warning` | `danger` | `ai`).
The `ai` tone uses `brass/100` background + `ink` text — reserved exclusively for
AI-attributed content (never reused for a plain status badge, so the color keeps its meaning).

### `Avatar`
Props: `src`, `name` (for initials fallback), `size`.
Deterministic background color derived from user id when no photo.

### `Tooltip`
Wraps any element; used heavily on truncated skill tags and score-breakdown factors.

---

## 2. Data Display

### `MatchDial` **(feature: candidates, but promoted to shared since it's reused across jobs/talent-search)**
The signature component (Document 5, Section 2).
Props: `score` (0–100), `size` (`sm` | `md` | `lg`), `showLabel`.
- Renders a semicircular tick-marked SVG gauge, `slate` track, `brass` fill, animated 0→score
  on mount (600ms ease-out, respects `prefers-reduced-motion`).
- Center numeral in `data-lg`/`data-sm` (IBM Plex Mono).
- `aria-label="Match score {score} out of 100"` always present — never rely on the visual
  fill alone (Document 5, Section 11).

### `ScoreBreakdown` **(feature: matching)**
Props: `skillScore`, `experienceScore`, `educationScore`, `domainScore`.
Renders four labeled horizontal bars, `prussian` fill, with the numeric value in mono type
at the end of each bar.

### `StageTag` **(feature: candidates)**
Props: `stage` (`applied|screened|shortlisted|interviewing|offer|hired|rejected`).
Each stage has a fixed color + **text label always visible** (never color-only, per
accessibility requirements). Colors map to the semantic tokens, not `brass`/`prussian`.

### `Table` / `DataGrid`
Built on TanStack Table. Props: `columns`, `data`, `sortable`, `density` (`comfortable`|`compact`),
`onRowClick`, `emptyState`.
Sticky header, hairline row dividers, keyboard-navigable rows (arrow keys + Enter to open).

### `Timeline` **(feature: candidates)**
Used on the candidate detail page for stage-history and interview history. Vertical line,
`slate` connectors, event dot colored by event type.

### `KpiCard` **(feature: analytics)**
Props: `label`, `value`, `delta`, `deltaDirection`.
Value in `display-md`/mono for the number itself; delta shown as a small colored chip
(`success`/`danger`) with an arrow icon, never color alone (icon direction carries meaning too).

---

## 3. Navigation

### `Sidebar`
Collapsible icon-rail ↔ labeled sidebar (Document 5, Section 5). Active item gets a
`prussian` left-border + background tint. Role-aware: renders a different item set for
recruiter vs. hiring manager vs. HR admin (composed at the `app/layout` level, not by the
Sidebar itself branching on role internally — keeps it a dumb View component).

### `Topbar`
Global search, notification bell (with unread badge), avatar menu (Profile, Settings, Logout).

### `Breadcrumbs`
Used on nested pages (Job → Candidate → Interview Feedback).

### `Tabs`
Used to switch Kanban ↔ Ranked List on the job detail page, and between profile sections
on the candidate detail page.

---

## 4. Feedback & Overlays

### `Modal`
Props: `title`, `onClose`, `size`, `footer`.
Focus-trapped, closes on `Escape`, returns focus to the triggering element on close.

### `ConfirmDialog`
Built on `Modal`. Used for destructive actions (delete job, remove resume, deactivate user).
Requires typing the item's name for high-consequence deletes (e.g., deleting a job with an
active pipeline).

### `Toast`
Props: `tone`, `message`, `action` (optional undo link).
Auto-dismiss 5s, pausable on hover/focus, announced via `aria-live="polite"`.

### `EmptyState`
Props: `icon`, `title`, `description`, `action`.
Copy follows the voice guidance in Document 5, Section 9 — always names a next action.

### `Skeleton`
Row/card/text variants matching the shape of the content they stand in for; used instead of
spinners for list/table loading.

---

## 5. Layout

### `PageHeader`
Props: `title`, `subtitle`, `actions` (right-aligned button group), `breadcrumbs`.

### `Panel` / `SplitView`
`SplitView` powers the Candidate Detail layout (main profile + Copilot drawer) and the
Hiring Manager comparison view (N candidates side by side, horizontally scrollable at `sm`).

### `CopilotDrawer` **(feature: copilot)**
Props: `context` (`{ jobId, candidateId }`), `isOpen`, `onClose`.
The one dark (`ink` background) surface in the product (Document 5, Section 6). Streams
LLM responses token-by-token; shows a source/context chip at the top ("About: Jane Doe vs.
Alex Kim") so the recruiter always knows what the AI is reasoning about.

---

## 6. Forms (Feature-Specific, Composed from Primitives)

### `JobForm` **(feature: jobs)**
Composes `Input`, `Textarea`, `MultiSelect` (skills with per-tag weight sliders), `Select`
(department, employment type), number range inputs (experience min/max). Validated with
Zod; `requiredSkills` must have at least one entry before Publish is enabled (Save as Draft
has no such requirement).

### `ResumeUploader` **(feature: resumes)**
Drag-and-drop zone + file picker, accepts `.pdf/.docx/.txt`, shows a per-file row with
status (`queued → parsing → parsed/failed`) fed by `resume-batch:progress` socket events.
Failed files show an inline reason and a "Retry" action, never silently drop the file.

### `FilterBar` **(feature: candidates)**
Skill filter chips, experience range slider, stage filter, "must-have skills only" toggle.
Persists filter state in the URL query string so a filtered view is shareable/bookmarkable.

### `NaturalLanguageSearchBar` **(feature: talent-search)**
Single text input + submit; on response, renders the AI-parsed filters as removable chips
above the results (transparency requirement — Document 6, Section 2.2).

### `WeightSliders` **(feature: matching)**
Four sliders (Skills/Experience/Education/Domain) that must sum to 100%; adjusting one
proportionally redistributes the others unless the user has manually pinned a value. Shows
a live, sandboxed "this would re-rank these candidates" preview before committing (Document
6, Section 2.4).

---

## 7. Component Ownership Summary

| Category | Shared | Feature-specific |
|---|---|---|
| Primitives | Button, Input, Select, Checkbox, Badge, Avatar, Tooltip | — |
| Data display | Table, Timeline, Skeleton, MatchDial (promoted) | ScoreBreakdown, StageTag, KpiCard |
| Navigation | Sidebar, Topbar, Breadcrumbs, Tabs | — |
| Feedback | Modal, ConfirmDialog, Toast, EmptyState | — |
| Layout | PageHeader, Panel, SplitView | CopilotDrawer |
| Forms | — | JobForm, ResumeUploader, FilterBar, NaturalLanguageSearchBar, WeightSliders |
