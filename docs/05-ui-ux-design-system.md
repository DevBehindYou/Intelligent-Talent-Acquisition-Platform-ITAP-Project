# ITAP — UI/UX Design System
**Document 6 of 9 — For the Design Team**

> **Note on reference material:** this document was prepared without the reference image
> mentioned during scoping — it wasn't actually attached to the request that generated this
> doc. Everything below is a deliberate, from-scratch design direction for this specific
> product. If a reference image or brand guideline shows up later, treat Section 2 (Design
> Direction) as the section to reconcile against it; Sections 3 onward (tokens, components,
> states) can mostly be re-skinned without restructuring.

---

## 1. Who This Is For and What It Has to Do

ITAP is used for hours at a stretch by recruiters and HR admins scanning dense candidate
lists, comparing scores, and trusting an AI's reasoning enough to act on it. That's a
different job than a consumer app: the interface needs to reward fast scanning, dense
comparison, and — critically — make the AI's confidence *legible*, not just present. A
recruiter who can't tell *why* a candidate scored 92 won't trust the number.

That "make the invisible reasoning visible" problem is the design brief in one sentence.

---

## 2. Design Direction — "Instrument, Not Dashboard"

Rather than a generic SaaS-dashboard look, ITAP borrows from **precision measuring
instruments** — calipers, spectrum analyzers, surveying tools: objects whose entire job is
to turn a fuzzy signal into a confident, readable number. The AI match score is not a
progress bar; it's a **dial**, styled like an instrument gauge with tick marks, because that
visual language already means "measured, not guessed" to anyone who's looked at a gauge.

This deliberately avoids two default AI-product looks worth naming so we don't drift back
into them by habit: (a) warm cream background with a terracotta accent, and (b) near-black
background with a single neon accent. ITAP's base is a **light, cool-toned working surface**
(recruiters stare at this all day — it needs to be easy on the eyes at data density) with a
**deep Prussian-blue** structural color and a **brass/ochre** signal accent that only appears
on AI-generated content (scores, insights, copilot output) — so color itself teaches users
"this number came from the AI" vs. "this is just data."

**Signature element:** the **Match Dial** — a semi-circular, tick-marked gauge with a brass
needle/fill, used everywhere a match score appears (candidate cards, ranking lists, the
candidate detail hero). It's the one place we spend visual boldness; everything else stays
quiet and disciplined.

---

## 3. Color Tokens

Core palette (six named values):

| Token | Hex | Usage |
|---|---|---|
| `ink` | `#12202E` | Primary text, sidebar background, high-contrast surfaces |
| `canvas` | `#F5F6F8` | App background (cool, slightly blue-gray — not cream) |
| `paper` | `#FFFFFF` | Cards, table rows, modals |
| `prussian` | `#1D4E6B` | Primary brand color — buttons, active nav state, links, focus rings |
| `brass` | `#AD7A22` | AI-signal accent only — match scores, AI badges, Copilot highlights |
| `slate` | `#5B6B7C` | Secondary text, borders, muted icons, placeholders |

Semantic/status colors (separate from brand, used for pipeline stages and system states):

| Token | Hex | Usage |
|---|---|---|
| `success` | `#2F7D5C` | Hired, offer accepted, positive deltas |
| `warning` | `#C97A26` | Needs attention, pending review (kept visually distinct from `brass`) |
| `danger` | `#C1443C` | Rejected, errors, destructive actions |
| `info` | `#3E7CA6` | Informational banners, neutral status |

**Tailwind config mapping** (`tailwind.config.js` excerpt):
```js
theme: {
  extend: {
    colors: {
      ink: "#12202E",
      canvas: "#F5F6F8",
      paper: "#FFFFFF",
      prussian: { DEFAULT: "#1D4E6B", 600: "#173F55", 700: "#123040" },
      brass: { DEFAULT: "#AD7A22", 100: "#F3E6CB", 600: "#8E641B" },
      slate: "#5B6B7C",
      success: "#2F7D5C",
      warning: "#C97A26",
      danger: "#C1443C",
      info: "#3E7CA6",
    }
  }
}
```

**Contrast rule:** `brass` on `paper`/`canvas` fails AA at small text sizes — it is used only
for fills, icons, and large numerals (≥ 24px), never for small body text. Small AI-badge text
uses `ink` on a `brass/100` background instead.

---

## 4. Typography

| Role | Typeface | Usage |
|---|---|---|
| Display / headings | **Space Grotesk** (Medium/Semibold only) | Page titles, section headers, KPI numbers — used with restraint, not on body copy |
| Body | **Inter** | All body text, labels, table content — chosen for legibility at small sizes and data density |
| Data / mono | **IBM Plex Mono** | Match-score numerals, candidate IDs, timestamps, code-like values — this is the typographic half of the "instrument readout" signature, paired with the Match Dial |

Type scale (rem, 16px base):

| Token | Size | Weight | Line height | Use |
|---|---|---|---|---|
| `display-lg` | 2.25rem | 600 (Space Grotesk) | 1.15 | Dashboard/page hero titles |
| `display-md` | 1.5rem | 600 (Space Grotesk) | 1.2 | Section headers, modal titles |
| `body-lg` | 1rem | 400 (Inter) | 1.5 | Default body |
| `body-sm` | 0.875rem | 400 (Inter) | 1.45 | Table cells, secondary text |
| `caption` | 0.75rem | 500 (Inter) | 1.4 | Labels, badges, timestamps |
| `data-lg` | 1.75rem | 500 (IBM Plex Mono) | 1 | Match score numerals on the dial |
| `data-sm` | 0.8125rem | 500 (IBM Plex Mono) | 1.3 | Inline IDs, small metrics |

---

## 5. Layout & Spacing

- **Base unit:** 4px. Spacing scale: 4, 8, 12, 16, 24, 32, 48, 64.
- **Grid:** 12-column, 24px gutter on desktop (≥1280px); collapses to 4-column on tablet,
  single column on mobile.
- **App shell:** fixed 72px icon-rail (collapsible to a 240px labeled sidebar) in `ink`,
  light `canvas` content area, sticky `paper` topbar with search + notifications + avatar.
- **Density:** tables default to a "comfortable" 44px row height with a "compact" 32px
  toggle for power users scanning large candidate lists.
- **Dividers:** 1px hairline, `slate` at 15% opacity — used to separate table rows and
  panel sections instead of heavy card shadows, keeping the dense data views calm.
- **Radius:** `4px` for inputs/buttons, `8px` for cards/modals, `full` for badges/avatars/pills.
- **Elevation:** two shadow levels only — `shadow-sm` (resting cards) and `shadow-md`
  (popovers, modals, the Copilot drawer). No decorative shadows beyond that.

---

## 6. The Copilot Drawer — the One Dark Surface

The AI Copilot panel (contextual "why is this candidate ranked here" chat) is the one
deliberately dark surface in the product — an `ink` background with `paper`-on-`ink` text
and `brass` accents for AI-attributed content. It slides in from the right as an overlay,
never replacing the recruiter's main light working view. This creates a clear, purposeful
contrast zone: *light = your data, dark = the AI thinking out loud* — instead of dark mode
being an arbitrary toggle.

---

## 7. Iconography & Imagery

- Icon set: **lucide-react**, 20px default size, 1.5px stroke, `slate` by default, `prussian`
  when interactive/active.
- No stock photography or illustrated mascots — the product's personality comes from the
  Match Dial and typography, not decorative imagery.
- Avatars: initials-on-color-circle fallback (deterministic color from user id) when no
  photo is set.

---

## 8. Core Component States (design-team checklist)

Every interactive component must be designed for **all** of these states, not just default:

| State | Notes |
|---|---|
| Default | |
| Hover | subtle background shift, no color hue change |
| Focus (keyboard) | 2px `prussian` outline, offset 2px — never remove focus rings |
| Active/pressed | |
| Disabled | 40% opacity, no hover feedback, cursor `not-allowed` |
| Loading | skeleton shimmer for content, spinner only inside buttons |
| Error | `danger` border + inline message below the field, never color-only |
| Empty | see Section 9 |

---

## 9. Empty, Loading, and Error States (Voice & Design)

Treat these as design moments, not afterthoughts:

- **Empty pipeline:** "No candidates yet. Upload resumes or connect a career-site feed to
  start ranking." + primary action button — an invitation to act, not a dead end.
- **No search results:** show the parsed filters the AI understood from the query, so the
  recruiter can see *why* nothing matched and adjust — never a bare "no results."
- **Parsing failed:** name what went wrong ("This file couldn't be read — it may be a scanned
  image without OCR text") and offer a fix (retry, or flag for manual entry). Errors describe
  what happened; they don't apologize and they're never vague.

---

## 10. Motion

Motion is restrained and purposeful:

- **Match Dial fill:** animates from 0 to its score once on first render (600ms, ease-out) —
  the one deliberate "moment" in the interface, reinforcing "this was measured."
- **Copilot drawer:** slides in/out, 250ms.
- **Row updates (live ranking):** new/changed rows get a brief 400ms highlight fade, not a
  jarring re-sort jump.
- Respect `prefers-reduced-motion`: all of the above degrade to instant state changes.

---

## 11. Accessibility (WCAG 2.2 AA — Non-Negotiable for Recruiter/HR Flows)

- Minimum contrast 4.5:1 for body text, 3:1 for large text/icons.
- Every Match Dial has a text-equivalent (`aria-label="Match score 92 out of 100"`) — the
  score must never be conveyed by the dial's fill alone.
- All color-coded pipeline stages carry a text label, not color alone (color-blind safe).
- Full keyboard operability for the candidate table, kanban drag-and-drop (with a
  keyboard-accessible "move to stage" menu as an alternative to dragging), and the Copilot
  drawer.
- Visible focus indicators everywhere; no `outline: none` without a replacement.
- Form errors are announced via `aria-live="polite"` regions, not just visual styling.

---

## 12. Responsive Breakpoints

| Breakpoint | Width | Behavior |
|---|---|---|
| `sm` | ≥ 640px | Single-column, sidebar becomes a bottom sheet / hamburger |
| `md` | ≥ 768px | Two-column where relevant (e.g., candidate list + preview pane collapses) |
| `lg` | ≥ 1024px | Sidebar visible, tables show full column set |
| `xl` | ≥ 1280px | Full desktop layout, Copilot drawer can sit alongside content rather than overlay |

ITAP is primarily a desktop/laptop tool (recruiters at a workstation) — mobile is supported
for review-on-the-go (approving stage moves, reading Copilot explanations) but resume
upload and scoring-weight configuration are desktop-only flows in v1.
