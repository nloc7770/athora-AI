# Product Backlog — Student Feedback Sprint Plan

Source: [requirements.md](./requirements.md) | Raw feedback: [student-feedback.md](./student-feedback.md)

---

## Task List

| ID | Title | Priority | Cost | Personas | Requirement |
|----|-------|----------|------|----------|-------------|
| T01 | Implement real SRS scheduling (SM-2) | P0 | XL | Jake, Marcus | FEAT-01 |
| T02 | Replace dashboard stat tiles with daily study brief | P0 | M | Sarah, Jake | UX-02, OPP-02 |
| T03 | Fix hardcoded analytics trend badges | P0 | S | Marcus, Jake | UI-01 |
| T04 | Post-upload onboarding: "what Athora made" screen | P0 | M | Sarah | UX-01, OPP-01 |
| T05 | Rename/explain Sessions — copy + empty state | P0 | S | Sarah, Priya | NAV-02 |
| T06 | Mobile bottom tab bar (replace hamburger for 4-5 primary actions) | P0 | L | Sarah | NAV-01, OPP-04 |
| T07 | Move streak counter to free tier | P1 | S | Jake | UX-06, OPP-03 |
| T08 | Fix fake flashcard mastery percentage | P1 | M | Marcus, Jake | UI-03 |
| T09 | Make History delete affordance touch-accessible | P1 | S | Sarah | UI-05 |
| T10 | Add processing status indicator + completion notification | P1 | S | Sarah | UI-06 |
| T11 | Add document tags / week labels | P1 | L | Priya | FEAT-02 |
| T12 | AI Tutor document scope selector | P1 | L | Priya | FEAT-04, UX-04 |
| T13 | Server-side favourites (replace localStorage) | P1 | M | Priya | FEAT-05 |
| T14 | Library keyboard navigation shortcuts | P1 | M | Marcus | FEAT-06 |
| T15 | Exam list search + course filter | P1 | S | Marcus | FEAT-07 |
| T16 | Delay upsell banner until after first study action | P1 | S | Sarah | UX-03 |
| T17 | Post-session summary with next-action nudge | P1 | M | Jake | UX-05 |
| T18 | Enable bulk Move for multiple documents | P2 | M | Priya, Marcus | FEAT-09, UI-07 |
| T19 | Document-to-study quick-action buttons on cards | P2 | M | Sarah, Marcus, Priya | UX-10, OPP-05 |
| T20 | Exam history on exam list cards (score, attempts, date) | P2 | M | Jake | UX-09 |
| T21 | Weak area identification across exam sessions | P2 | L | Jake | FEAT-08 |
| T22 | Semantic / full-text document search | P2 | L | Priya, Marcus | FEAT-03 |
| T23 | Fix full-page reload on Tutor chat delete | P2 | S | Priya | UX-08 |
| T24 | Allow empty session creation (no file required) | P2 | S | Priya | UX-07 |
| T25 | Fix analytics time-range selector (This Month / All Time data) | P2 | M | Marcus | UI-01 |

---

## Task Detail

### T01 — Implement real SRS scheduling (SM-2)
**Priority:** P0 | **Cost:** XL | **Req:** FEAT-01

Replace the `Math.ceil(cardCount * 0.3)` placeholder with a real spaced repetition algorithm.

**Acceptance criteria:**
- Per-card review records (ease rating, interval, next_due_date) stored in the database and updated on each review
- "Due Today" count computed from `next_due_date <= now()` — not a static estimate
- New cards that have never been reviewed are excluded from the due count until their first review

---

### T02 — Replace dashboard stat tiles with daily study brief
**Priority:** P0 | **Cost:** M | **Req:** UX-02, OPP-02

Swap the four operational stat cards (Documents, Courses, Ready, Processing) for a learning-progress dashboard.

**Acceptance criteria:**
- Dashboard shows: streak (days), cards due today (real SRS count), last exam score with delta, and a primary "Start today's session" CTA
- Streak and due count visible on the free tier (no Pro gate)
- Operational stats (document count, processing status) moved to a secondary section or the Library page

---

### T03 — Fix hardcoded analytics trend badges
**Priority:** P0 | **Cost:** S | **Req:** UI-01

Remove or compute the `+12%`, `+8%`, `+5%` static strings in the analytics stat cards.

**Acceptance criteria:**
- Trend badges are computed from real time-series data (compare current period to prior period)
- If insufficient data exists to compute a trend, the badge is hidden — not shown as a hardcoded placeholder
- The analytics time-range selector (This Week / This Month / All Time) correctly filters the underlying data for all three options

---

### T04 — Post-upload onboarding: "what Athora made" screen
**Priority:** P0 | **Cost:** M | **Req:** UX-01, OPP-01

When a first-time user's document finishes processing, show an interstitial confirming what was generated.

**Acceptance criteria:**
- Triggered once per user after their first document reaches "ready" status
- Screen shows generated asset counts: X flashcards, Y quiz questions, study summary
- Single primary CTA navigates directly into the first flashcard session for that document
- Subsequent document uploads do not re-trigger the interstitial (shown once only)

---

### T05 — Rename/explain Sessions — copy + empty state
**Priority:** P0 | **Cost:** S | **Req:** NAV-02

Eliminate the confusion around the "Sessions" noun for new users.

**Acceptance criteria:**
- Either rename "Sessions" to a self-explanatory label (e.g. "Study Spaces") throughout the app, or add a persistent one-line description on the Sessions page and in the sidebar tooltip
- Empty session state includes copy explaining what a session is and a prompt to create one or upload a document
- The redirect destination after first upload includes contextual copy confirming where the user has landed

---

### T06 — Mobile bottom tab bar
**Priority:** P0 | **Cost:** L | **Req:** NAV-01, OPP-04

Replace the hamburger sidebar on mobile with a bottom tab bar containing 4–5 primary destinations.

**Acceptance criteria:**
- Bottom tab bar visible on mobile (< 768px) with: Home, Library, Study (primary CTA), Tutor, and a More/Profile tab
- Secondary items (Settings, Analytics, Exam Mode) accessible from the More tab or Profile page
- Hamburger sidebar retained only on tablet and desktop
- Active tab state clearly indicated; all tabs keyboard accessible with visible focus rings

---

### T07 — Move streak counter to free tier
**Priority:** P1 | **Cost:** S | **Req:** UX-06, OPP-03

Make the daily streak visible to free users on the dashboard.

**Acceptance criteria:**
- Streak counter displayed on the dashboard for all users regardless of plan
- Advanced analytics (multi-session trend comparisons, weak area breakdown) remain Pro-only
- Free-tier users see a contextual upgrade prompt from within Analytics, not a full blurred paywall

---

### T08 — Fix fake flashcard mastery percentage
**Priority:** P1 | **Cost:** M | **Req:** UI-03

Replace the `Math.ceil(cardCount * 0.3)` mastery calculation with data derived from actual review history.

**Acceptance criteria:**
- Mastery percentage computed from the ratio of cards rated "Good" or "Easy" in the user's review history for that deck
- Decks with no review history show "Not started" rather than a percentage
- Mastery updates in real time after each review session

---

### T09 — Make History delete affordance touch-accessible
**Priority:** P1 | **Cost:** S | **Req:** UI-05

The Tutor History sheet delete button must be accessible on touch devices.

**Acceptance criteria:**
- Delete button permanently visible on touch breakpoints (not hover-revealed)
- Alternatively, swipe-left on a history item reveals a delete affordance on mobile
- Delete action requires a confirmation step before executing

---

### T10 — Processing status indicator + completion notification
**Priority:** P1 | **Cost:** S | **Req:** UI-06

Documents in "Processing" status must communicate progress to the user.

**Acceptance criteria:**
- Processing documents show an animated spinner or progress bar in the Library and dashboard Recent Documents list
- UI polls for status updates and transitions the card to "Ready" without a full page reload
- A toast notification confirms when a document finishes processing: "Your document is ready — start studying"

---

### T11 — Document tags / week labels
**Priority:** P1 | **Cost:** L | **Req:** FEAT-02

Add a tags layer to documents so users can organise within courses by week, topic, or any custom label.

**Acceptance criteria:**
- `tags text[]` column added to the `documents` table via a backward-compatible migration
- Inline tag editor on the document card (click to add/remove tags)
- Filterable tag chips in the Library header — selecting a tag filters the document grid
- Tags appear in the document card footer in both grid and list views

---

### T12 — AI Tutor document scope selector
**Priority:** P1 | **Cost:** L | **Req:** FEAT-04, UX-04

Allow users to scope an AI Tutor conversation to a specific document, course, or document set.

**Acceptance criteria:**
- Scope selector in the Tutor conversation header with options: "All documents", a course, or one or more specific documents
- Active scope persisted for the duration of the conversation and displayed visibly in the UI
- AI responses use only the selected scope as context
- From the Library, "Ask AI about this document" quick action opens Tutor pre-scoped to that document

---

### T13 — Server-side favourites
**Priority:** P1 | **Cost:** M | **Req:** FEAT-05

Replace the `localStorage`-only favourites implementation with server-persisted account data.

**Acceptance criteria:**
- Favourites stored in the database and associated with the user's account (not browser storage)
- Favourites sync correctly when the user logs in on a new device or browser
- Existing localStorage favourites migrated on next login (one-time migration)
- Favourite indicator visible on document cards in Library, Sessions, and dashboard Recent Documents

---

### T14 — Library keyboard navigation
**Priority:** P1 | **Cost:** M | **Req:** FEAT-06

Implement keyboard shortcuts for the Library surface.

**Acceptance criteria:**
- `/` focuses the search input from anywhere on the Library page
- Arrow keys navigate between document cards in the grid
- `Enter` opens the focused document
- `Delete` / `Backspace` triggers the delete confirmation dialog for the focused document
- `Escape` exits multi-select mode
- All shortcuts listed in a discoverable keyboard shortcut hint (e.g. `?` opens a help overlay)

---

### T15 — Exam list search + course filter
**Priority:** P1 | **Cost:** S | **Req:** FEAT-07

Add a search input and course filter to the exam list page.

**Acceptance criteria:**
- Text search filters exams by name in real time
- Course filter dropdown matches the pattern in the Library page
- Both filters composable (search within a course filter)
- Empty state copy when no exams match the current filter

---

### T16 — Delay upsell banner
**Priority:** P1 | **Cost:** S | **Req:** UX-03

Suppress the "Upgrade for unlimited" banner until the user has delivered meaningful value.

**Acceptance criteria:**
- Upsell banner hidden for users who have not yet completed their first study action (first flashcard session or first exam)
- After the trigger event, banner appears with contextual copy tied to the action the user just completed
- Banner can be dismissed per session

---

### T17 — Post-session summary with next-action nudge
**Priority:** P1 | **Cost:** M | **Req:** UX-05

After completing a flashcard session or exam, show a summary screen with a recommended next action.

**Acceptance criteria:**
- Post-session screen shows: session stats (cards reviewed, correct rate, time elapsed) and session-level mastery delta
- At least one next-action card: "X cards still due today", "Try the [Course] exam", or "View your progress in Analytics"
- Next-action card links directly to the relevant surface
- Available on both flashcard completion and exam results screens

---

### T18 — Enable bulk Move for multiple documents
**Priority:** P2 | **Cost:** M | **Req:** FEAT-09, UI-07

Allow moving multiple selected documents to a different course in a single operation.

**Acceptance criteria:**
- Move button in the Library multi-select toolbar is enabled for any selection size (1 or more)
- Course picker modal applies the selected course to all selected documents atomically
- Success toast confirms how many documents were moved
- If the disabled state must remain for any reason, a tooltip explains why and suggests an alternative

---

### T19 — Document-to-study quick-action buttons
**Priority:** P2 | **Cost:** M | **Req:** UX-10, OPP-05

Add study shortcut buttons directly to document cards in Library and Sessions.

**Acceptance criteria:**
- Document cards (in "Ready" state) show three quick-action buttons on the card surface: "Flashcards", "Quiz", "Ask AI"
- Each button deep-links to the relevant study surface scoped to that document
- Buttons visible on hover (desktop) and as a persistent bottom strip (mobile) — no hidden menu required
- Processing/pending documents show a disabled state for study actions

---

### T20 — Exam history on exam list cards
**Priority:** P2 | **Cost:** M | **Req:** UX-09

Show attempt history on each exam card in the exam list.

**Acceptance criteria:**
- Each exam card shows: last score (%), total attempts, and date of last attempt
- Sort option "Lowest score" added to the exam list sort controls
- Cards with no attempts show "Not attempted" state
- Clicking a score opens the results detail for that attempt

---

### T21 — Weak area identification across exam sessions
**Priority:** P2 | **Cost:** L | **Req:** FEAT-08

Aggregate exam performance by topic across sessions to surface weak areas.

**Acceptance criteria:**
- Exam questions tagged with a topic label at AI generation time (stored in the database)
- Analytics "Weak Areas" section shows per-topic correct rate across all exam attempts
- Weak areas surfaced on the post-exam summary screen: "You answered [Topic] questions correctly 40% of the time"
- Topic tags editable by the user from the exam detail view

---

### T22 — Semantic / full-text document search
**Priority:** P2 | **Cost:** L | **Req:** FEAT-03

Extend Library search to match document content, not just document names.

**Acceptance criteria:**
- Search bar in Library returns documents ranked by semantic relevance using existing document embeddings
- Results include a snippet of the matching content from the document
- Name-match results ranked above semantic matches when both exist
- Search performance acceptable (< 500ms p95) for a library of 100+ documents

---

### T23 — Fix full-page reload on Tutor chat delete
**Priority:** P2 | **Cost:** S | **Req:** UX-08

Replace `window.location.reload()` with an in-place state update after deleting a Tutor chat.

**Acceptance criteria:**
- Deleted chat session removed from the history list without a page reload
- Active conversation reset to blank state if the deleted session was the current one
- No visual flash or layout shift during the delete operation

---

### T24 — Allow empty session creation
**Priority:** P2 | **Cost:** S | **Req:** UX-07

Remove the requirement to upload a file before a session can be created.

**Acceptance criteria:**
- Create button in the session creation modal enabled with only a session name (file upload optional)
- Empty session shows an empty state with a clear prompt to add documents
- Existing sessions with files continue to work unchanged

---

### T25 — Fix analytics time-range selector data slicing
**Priority:** P2 | **Cost:** M | **Req:** UI-01 (analytics subset)

The time-range selector must produce distinct data for each option.

**Acceptance criteria:**
- "This Week" shows the current 7-day window
- "This Month" shows the current calendar month
- "All Time" shows the full history from account creation
- Activity bar chart bar count reflects the selected range (7 bars for week, ~30 for month, variable for all time)

---

## Sprint Plan

### Sprint 1 — Foundation & First-Run (2 weeks)
**Goal:** Fix the highest-trust and first-run issues. Every P0 + high-leverage P1 quick wins.

| ID | Title | Cost |
|----|-------|------|
| T03 | Fix hardcoded analytics trend badges | S |
| T05 | Rename/explain Sessions — copy + empty state | S |
| T09 | Make History delete affordance touch-accessible | S |
| T10 | Processing status indicator + completion notification | S |
| T15 | Exam list search + course filter | S |
| T16 | Delay upsell banner | S |
| T23 | Fix full-page reload on Tutor chat delete | S |
| T24 | Allow empty session creation | S |
| T02 | Replace dashboard stat tiles with daily study brief | M |
| T04 | Post-upload onboarding: "what Athora made" screen | M |
| T07 | Move streak counter to free tier | S |
| T06 | Mobile bottom tab bar | L |

**Sprint 1 total cost:** 3L + 2M + 6S

---

### Sprint 2 — Study Loop & Organisation (2 weeks)
**Goal:** Fix the core daily study loop (real SRS, mastery, post-session) and first organisation features (tags, keyboard nav).

| ID | Title | Cost |
|----|-------|------|
| T01 | Implement real SRS scheduling (SM-2) | XL |
| T08 | Fix fake flashcard mastery percentage | M |
| T13 | Server-side favourites | M |
| T14 | Library keyboard navigation | M |
| T17 | Post-session summary with next-action nudge | M |
| T11 | Document tags / week labels | L |
| T19 | Document-to-study quick-action buttons | M |
| T20 | Exam history on exam list cards | M |

**Sprint 2 total cost:** 1XL + 1L + 5M

---

### Sprint 3 — Power User & Discovery (2 weeks)
**Goal:** AI scoping, semantic search, bulk ops, weak areas, and remaining P2 fixes.

| ID | Title | Cost |
|----|-------|------|
| T12 | AI Tutor document scope selector | L |
| T18 | Enable bulk Move for multiple documents | M |
| T21 | Weak area identification across exam sessions | L |
| T22 | Semantic / full-text document search | L |
| T25 | Fix analytics time-range selector data slicing | M |

**Sprint 3 total cost:** 3L + 2M

---

## Priority Summary

| Priority | Count | Key theme |
|----------|-------|-----------|
| P0 | 6 tasks (T01–T06) | Trust, first-run, mobile nav |
| P1 | 11 tasks (T07–T17) | Study loop, organisation, retention |
| P2 | 8 tasks (T18–T25) | Power user, scale, advanced features |
