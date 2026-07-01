# Requirements: Student Feedback Analysis

Source: Four student persona UX research sessions (Sarah, Marcus, Priya, Jake).
See [student-feedback.md](./student-feedback.md) for raw feedback.

---

## 1. Navigation Issues

### NAV-01: Mobile navigation is overloaded
**Personas:** Sarah, Marcus
**Priority:** P0

**Finding:** The mobile sidebar contains 8 destinations in a flat list. Group labels ("Learn") are rendered at 11px grey text — effectively invisible at a glance. On mobile-first devices this is the primary navigation surface, yet it is the most cluttered screen in the app.

**Impact:** New mobile users (the primary acquisition channel via TikTok) cannot orient themselves. Power users find the density slows navigation.

**Requirement:** Replace the flat 8-item sidebar on mobile with a bottom tab bar containing 4–5 primary destinations. Secondary destinations move to an overflow menu or sub-pages.

---

### NAV-02: "Sessions" terminology is undefined
**Personas:** Sarah, Priya
**Priority:** P0

**Finding:** "Sessions" is the primary noun in the app and the first destination new users land on after uploading their first document. There is no tooltip, description, onboarding copy, or empty state that explains what a Session is.

**Impact:** Every new user who uploads a document is immediately confused at the most critical moment of first-run experience.

**Requirement:** Either rename "Sessions" to a self-explanatory term (e.g. "Study Spaces") or add a persistent one-line description and empty-state copy explaining what Sessions are and what to do there.

---

### NAV-03: Two paths to Library with inconsistent labels
**Personas:** Sarah
**Priority:** P2

**Finding:** "View all" on the dashboard Recent Documents section and "Library" in the sidebar both navigate to the same page. Different labels for the same destination create mild but repeated confusion.

**Requirement:** Standardise the label to "Library" or provide clear visual hierarchy showing "View all" is a shortcut to Library.

---

### NAV-04: Analytics nav item visible to free users with no preview
**Personas:** Marcus, Jake
**Priority:** P2

**Finding:** Analytics is a Pro-only feature but the nav item appears for all users. Free users click it and hit a fully blurred paywall with no preview of what they would get. This wastes a navigation slot and trains users to ignore the item.

**Requirement:** Either show a meaningful free-tier teaser inside Analytics (e.g. last 7 days of activity, no trend data), or remove the nav item for free users and surface an upgrade prompt contextually from the dashboard.

---

## 2. UI Issues

### UI-01: Hardcoded analytics trend badges
**Personas:** Marcus, Jake
**Priority:** P0

**Finding:** Analytics stat cards display `+12%`, `+8%`, `+5%` trend badges that are static strings in the source — never computed from real data. A user who studies diligently for a month will see the same green arrows as a user who never opened the app. This is discovered quickly by any quantitative user and immediately destroys trust in the entire analytics surface.

**Requirement:** Compute trend values from real session/activity data or remove the trend badges entirely until the computation is implemented. Showing no trend is better than a false one.

---

### UI-02: Fake SRS due count
**Personas:** Jake, Marcus
**Priority:** P0

**Finding:** The "Due Today" flashcard count is calculated as `Math.ceil(set.cardCount * 0.3)` — a hardcoded 30% estimate with no relation to actual SRS review history or difficulty ratings submitted by the user. The core daily workflow promise of the app is built on a placeholder.

**Requirement:** Implement real SRS scheduling. Due counts must be derived from the user's actual review history and the configured SRS algorithm (SM-2 or equivalent). Remove the placeholder calculation.

---

### UI-03: Flashcard mastery percentage is a placeholder
**Personas:** Marcus, Jake
**Priority:** P1

**Finding:** Mastery percentage on deck cards uses the same `Math.ceil(cardCount * 0.3)` formula as the due count — not actual review history. A deck a user has studied 40 times and rated all "Easy" can still show 70% mastered.

**Requirement:** Compute mastery from the user's actual difficulty rating history stored in the database. Display mastery only when sufficient review data exists; otherwise show "Not started" or a neutral state.

---

### UI-04: "Exit Exam" warning is a false alarm
**Personas:** Marcus
**Priority:** P2

**Finding:** The "Exit Exam" modal warns "Your progress will be lost" but the code saves answers to `sessionStorage` on every answer submission. The warning is technically incorrect and creates unnecessary anxiety.

**Requirement:** Update the exit warning copy to reflect actual behavior, or implement true progress persistence to the server (so the warning applies accurately if the user clears their browser state).

---

### UI-05: History delete affordance is hover-only
**Personas:** Sarah
**Priority:** P1

**Finding:** Deleting a chat in the Tutor History sheet requires hovering to reveal the trash icon. Hover does not exist on touch devices, making delete effectively inaccessible on mobile.

**Requirement:** Make the delete affordance permanently visible on touch breakpoints, or add a long-press / swipe-to-delete gesture with a visible affordance.

---

### UI-06: No progress indicator for "Processing" documents
**Personas:** Sarah
**Priority:** P1

**Finding:** Documents in "Processing" status show only a badge with no progress bar, spinner animation, estimated time, or polling feedback. A first-time user will assume the upload failed.

**Requirement:** Add a progress indicator (spinner or animated progress bar) to Processing documents. Poll for status updates and transition the UI when processing completes. Show a notification or toast when a document becomes ready.

---

### UI-07: Bulk Move disabled for multi-select with no explanation
**Personas:** Marcus, Priya
**Priority:** P1

**Finding:** The Library toolbar shows a Move button that is disabled when more than one document is selected (`selectedIds.size !== 1`). The button is visible but greyed out with no tooltip or explanation. Users who select 5–10 documents to reorganise discover the limitation only after trying.

**Requirement:** Either implement bulk Move for multiple selections, or show a clear tooltip on the disabled state explaining the limitation and suggesting an alternative path.

---

### UI-08: Tutor history button is icon-only on mobile
**Personas:** Sarah, Priya
**Priority:** P2

**Finding:** The History button in the Tutor page header has no visible text label on mobile (`hidden sm:inline` hides the label). An icon-only button with only an `aria-label` is not discoverable for new users.

**Requirement:** Show a text label alongside the History icon on all breakpoints, or use a more prominent affordance (e.g. a drawer handle or persistent sidebar).

---

### UI-09: Library sort has no active state indicator
**Personas:** Priya
**Priority:** P3

**Finding:** Sort preference is persisted to `localStorage` but the UI shows no indicator of which sort is currently active until the dropdown is opened.

**Requirement:** Display the active sort option as a label or badge next to the sort control so the current state is visible without interaction.

---

## 3. UX / Workflow Issues

### UX-01: No post-upload guidance for new users
**Personas:** Sarah
**Priority:** P0

**Finding:** After uploading their first document, new users are redirected to `/sessions/{id}` with no explanation, no welcome copy, and no suggested next action. The onboarding upload screen disappears and is replaced by a stats dashboard showing all zeros. There is no "here is what Athora made from your PDF" moment.

**Impact:** This is the single highest-friction point in the acquisition funnel. A user who does not understand what just happened will close the tab.

**Requirement:** Implement a post-upload onboarding state. When a user's first document finishes processing, show an interstitial or inline prompt that:
- Confirms what was generated (flashcards, quiz, summary)
- Provides a clear single CTA to the most valuable action (e.g. "Review your flashcards")
- Links to the AI Tutor with context that it has read their document

---

### UX-02: Dashboard shows operational metadata, not study progress
**Personas:** Sarah, Jake
**Priority:** P0

**Finding:** The four dashboard stat cards (Documents, Courses, Ready, Processing) are operational metadata about uploads. They tell a student nothing about their learning progress. For a student opening the app daily, the dashboard should answer: "What should I study today?"

**Requirement:** Replace or supplement the operational stat tiles with a daily study brief containing:
- Streak count (available on free tier)
- Real cards due today (from real SRS, not the placeholder)
- Last exam score with delta from previous attempt
- A single primary CTA: "Start today's session"

---

### UX-03: Upsell appears before any value is delivered
**Personas:** Sarah
**Priority:** P1

**Finding:** The "Upgrade for unlimited" upsell banner appears below the user's name before they have completed their first study action. For a first-time user this signals the free plan is too limited to bother with, and undermines the initial goodwill of the onboarding.

**Requirement:** Gate the upsell banner behind a meaningful usage trigger (e.g. after first flashcard session completed, or after the user has uploaded 3+ documents). Replace it in the initial session with a contextual benefit message.

---

### UX-04: AI Tutor does not surface its document context
**Personas:** Sarah, Priya
**Priority:** P1

**Finding:** The AI Tutor empty state says "I have access to all your uploaded documents" but this is only visible after navigating to the Tutor page. From the dashboard and Library there is no indication that the AI has read the user's documents. For Priya with 100+ docs, "all your documents" is also uninformative — there is no way to know which documents are actually in context.

**Requirement:**
1. Add a visible callout from the Library doc card: "Ask AI about this document" shortcut
2. On the Tutor page, show a collapsible list of documents the AI has access to
3. Add a document scope selector so users can pin a conversation to a specific document or course

---

### UX-05: No post-session flow
**Personas:** Jake
**Priority:** P1

**Finding:** After completing a flashcard session or an exam, the only options are "Review Again" or "Back to Decks/Exams." There is no nudge toward the next logical action (due cards, weak-topic exam, analytics summary). The session ends in a dead end.

**Requirement:** Add a post-session summary screen that:
- Shows session stats (time, correct rate, cards reviewed)
- Surfaces the next recommended action (e.g. "You have 4 more cards due today", "Try the Pharmacology exam")
- Links directly to Analytics for the full progress view

---

### UX-06: Streak and retention mechanics are fully Pro-gated
**Personas:** Jake
**Priority:** P1

**Finding:** The streak counter — the single most motivating daily metric for a student — is behind a Pro gate. Free users get zero retention hooks. This eliminates the habit loop that would convert free users to paid, and frustrates students who just want to study.

**Requirement:** Make the streak counter visible on the free tier. Reserve advanced analytics (trend data, weak area breakdown, cross-session comparisons) for Pro. The daily habit loop (streak + due cards) must be free to build retention before asking for payment.

---

### UX-07: Session creation requires immediate file upload
**Personas:** Priya
**Priority:** P2

**Finding:** The Session creation modal requires at least one file (`Create` button disabled when `selectedFiles.length === 0`). Users cannot create an empty named session to organise into first and add files later.

**Requirement:** Allow session creation without an immediate file upload. Show an empty session state with a clear prompt to add documents.

---

### UX-08: Full-page reload after deleting a Tutor chat
**Personas:** Priya
**Priority:** P2

**Finding:** `window.location.reload()` is called after deleting a chat session in the Tutor page. This causes a jarring full-page reload instead of an in-place state update, especially noticeable on slow mobile connections.

**Requirement:** Replace the reload with an in-place state mutation — remove the deleted session from the chat list and navigate to a blank conversation state without reloading the page.

---

### UX-09: No exam history visible from exam list
**Personas:** Jake
**Priority:** P2

**Finding:** The exam list shows exam name, question count, and difficulty badge but no previous score, attempt count, or last-attempted date. A student cannot prioritise which exam to retake without this information.

**Requirement:** Add to each exam list card: last score (%), number of attempts, and date of last attempt. Sort options should include "Lowest score" to surface weak areas.

---

### UX-10: No document-to-study shortcut
**Personas:** Sarah, Marcus
**Priority:** P2

**Finding:** Going from a Library document to studying its flashcards takes 5+ clicks. There is no shortcut from a document card to "Study this document's flashcards" or "Ask AI about this document."

**Requirement:** Add contextual quick-action buttons on document cards in the Library and in Sessions: "Flashcards", "Quiz", "Ask AI". These should deep-link directly to the relevant study surface scoped to that document.

---

## 4. Missing Features

### FEAT-01: Real spaced repetition scheduling
**Personas:** Jake, Marcus
**Priority:** P0

**Finding:** The SRS system is a placeholder. Due counts are a static 30% estimate. There is no actual scheduling algorithm tracking review intervals, ease factors, or next-due dates.

**Requirement:** Implement SM-2 or equivalent SRS algorithm. Store per-card review history (ease rating, interval, next due date) in the database. Compute due counts from actual scheduling data.

---

### FEAT-02: Document tags / week labels
**Personas:** Priya
**Priority:** P1

**Finding:** Courses are the only organisational layer. A medical student uploading 5–10 PDFs weekly across multiple modules has no way to organise by week, topic, or sub-module. Within a course everything is a flat list.

**Requirement:** Add a tags field to documents (array of strings). Render tags as filterable chips in the Library header. Allow inline tag editing from the document card. Schema change: `tags text[]` column on the `documents` table.

---

### FEAT-03: Full-text / semantic document search
**Personas:** Priya, Marcus
**Priority:** P1

**Finding:** Library search matches only document name and course name. A medical student cannot search for "renin-angiotensin system" to find the lecture that mentioned it. A power user with 50+ docs is equally limited.

**Requirement:** Implement content-aware search using document embeddings already generated for the AI Tutor. The search bar in Library should return documents ranked by semantic relevance to the query, not just name substring match.

---

### FEAT-04: AI Tutor document scoping
**Personas:** Priya
**Priority:** P1

**Finding:** The AI Tutor draws from the entire document corpus with no visible scoping. With 100+ documents, context dilution is a real problem and the user has no control.

**Requirement:** Add a document/course scope selector to the Tutor conversation header. Allow the user to pin a conversation to "All documents", a specific course, or one or more specific documents. Show the active scope persistently in the conversation UI.

---

### FEAT-05: Server-side favourites
**Personas:** Priya
**Priority:** P1

**Finding:** Favourites are stored in `localStorage` only. A user who studies on multiple devices will silently lose their curated shortlist on each new device or browser. This will be perceived as a bug.

**Requirement:** Persist favourites to the user's account in the database. Sync on login. Remove the `localStorage`-only implementation.

---

### FEAT-06: Library keyboard navigation
**Personas:** Marcus
**Priority:** P1

**Finding:** The Library has no keyboard shortcuts. A power user with 50+ documents cannot focus search, navigate between docs, open, rename, or delete without a mouse. The baseline expectation from Notion (Ctrl+P) and file managers is not met.

**Requirement:** Implement keyboard shortcuts for Library:
- `/` to focus the search input
- Arrow keys to navigate the document grid
- `Enter` to open the focused document
- `Delete` or `Backspace` to delete with confirmation dialog
- `Escape` to exit select mode

---

### FEAT-07: Exam list search and filter
**Personas:** Marcus
**Priority:** P1

**Finding:** The exam list has no search input and no course filter. With many generated exams it is an unsortable flat list.

**Requirement:** Add a search input (filter by exam name) and a course filter dropdown to the exam list page, matching the pattern already present in the Library.

---

### FEAT-08: Weak area identification
**Personas:** Jake
**Priority:** P2

**Finding:** Exam results show per-question correct/wrong but there is no topic-level aggregation across sessions. A law student cannot see "you miss Evidence questions 60% of the time."

**Requirement:** Tag exam questions with topic labels at generation time. Aggregate performance by topic across all exam sessions. Surface a "Weak Areas" section in Analytics and on the post-session summary screen.

---

### FEAT-09: Bulk Move for multiple documents
**Personas:** Priya, Marcus
**Priority:** P2

**Finding:** The Move action is intentionally limited to one document at a time. Reorganising a large library is extremely tedious.

**Requirement:** Enable bulk Move for multiple selected documents. Show a course picker modal that applies the selected course to all selected documents in a single operation.

---

## 5. Product Opportunities

### OPP-01: "What Athora made from your document" moment
**Personas:** Sarah
**Priority:** P0

**Finding:** The most powerful retention and word-of-mouth moment — showing the user what the AI generated from their PDF — does not exist in the current flow. Users are redirected to a session page with no fanfare.

**Opportunity:** After processing completes on the first document, show a preview screen: "From your PDF we generated X flashcards, a Y-question quiz, and a study summary." With a single tap the user is in their first flashcard session. This is the "aha moment" the entire acquisition funnel should lead to.

---

### OPP-02: Daily study brief as the dashboard default
**Personas:** Sarah, Jake
**Priority:** P0

**Finding:** The dashboard is the most-visited screen and currently provides zero study direction.

**Opportunity:** A daily brief (streak, due cards, recommended exam, last score) transforms the dashboard from an admin screen into a habit-forming entry point. This is the single highest-leverage UI change for DAU and retention.

---

### OPP-03: Free-tier retention hooks
**Personas:** Jake
**Priority:** P1

**Finding:** All retention mechanics (streak, trend data, weak areas) are Pro-gated. Free users have no daily hook.

**Opportunity:** Move streak and due-card count to the free tier. Gate advanced analytics (multi-session comparisons, weak area breakdown, export). The habit loop is the conversion funnel — paywalling it before it forms prevents conversion, not after.

---

### OPP-04: Progressive mobile navigation
**Personas:** Sarah
**Priority:** P1

**Finding:** A bottom tab bar with 4–5 primary actions would serve the TikTok-acquired mobile user far better than a hamburger menu with 8 items.

**Opportunity:** Implement a standard mobile bottom tab bar: Home / Library / Study (primary CTA) / Tutor / Profile. Move Settings, Analytics, and Exam Mode to sub-pages or the Profile tab.

---

### OPP-05: Document-to-study deep links
**Personas:** Sarah, Marcus, Priya
**Priority:** P2

**Finding:** Every persona identified the disconnect between "I have a document" and "I am studying from it" as a friction point. The path from document to any study mode is 3–5+ clicks.

**Opportunity:** Every document card should be a study launchpad. Three quick-action buttons — Flashcards, Quiz, Ask AI — visible on the card surface (not hidden in a menu) would collapse the path from document to studying into a single tap.
