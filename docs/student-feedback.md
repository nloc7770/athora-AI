# Student Persona Feedback

Raw UX research feedback from four representative student personas. Used as input for requirements and task planning.

---

## Sarah — 18yo First-Year UK Student

**Profile:** Low tech confidence. First AI study tool. Arrived via TikTok ad, likely on mobile.

### Confusing
- "Sessions" — no tooltip, no description, unclear if it's something she creates or something auto-tracked
- "Exam Mode" in the sidebar sounds like it starts a test immediately — scary until clicked
- "AI Tutor" page says "Ask anything..." with zero context about what the AI knows or has read
- "Ready" stat card — ready for what?
- History button on Tutor page is icon-only; on mobile the label is hidden via `hidden sm:inline`
- "Processing" badge on documents has no progress indicator or ETA

### Intuitive
- Onboarding upload drop zone — big, clear, value copy explains what happens
- Greeting with name and date feels warm and personal
- Document type icons (PDF red, audio violet, video blue)
- Tutor suggestion chips give a starting point
- Quick Actions pill row is easy to scan and tap on mobile

### Frustrated
- After uploading first document, redirected to `/sessions/{id}` with zero explanation
- Mobile sidebar has 8 items in a flat list; group labels are tiny 11px grey text
- Upsell banner appears before any value has been delivered
- Uploading from dashboard Quick Actions has no visual feedback or redirect
- No empty state or next-step prompt after first document is processed

### Too Many Clicks
- To study with AI Tutor: find sidebar → open page → read chips → type/click → wait for session → get response. No shortcut from a document to "ask AI about this doc"
- Two paths to the same Library with different labels ("View all" vs "Library" nav item)
- Delete in Tutor History requires hover to reveal trash icon — hover doesn't exist on mobile

### Hard to Discover
- No visible sign from the dashboard that AI Tutor has read uploaded documents
- No persistent drop zone after onboarding — only a small "Upload" pill in Quick Actions
- Analytics exists in nav but has no dashboard teaser
- Mobile History button is icon-only with no label

### Top Issues
1. No explanation of "Sessions" — the primary noun in the app, first landing point after upload
2. Zero post-upload guidance — no "next step" prompt after first document is processed
3. Upsell banner appears before any value is delivered
4. Mobile navigation is overloaded — 8 destinations, near-invisible group labels
5. AI Tutor does not make it clear the AI has read your specific documents
6. Delete affordance in Tutor History is hover-only — inaccessible on touch devices
7. No progress feedback or ETA when a document is "Processing"

### Redesign Priority
Rename "Sessions" to something like "Study Space" or "My Notes" and add a one-line description. Every new user lands there after their first upload with no idea what it is.

### Would Recommend?
Probably not yet. No clear "here is what Athora made from your PDF" moment. Would close the tab and go back to Anki.

---

## Marcus — 21yo MIT CS Student

**Profile:** Power user, 4–8hr/day, keyboard-first, Vim-trained, 50+ documents. Measures everything in keystrokes saved.

### Confusing
- Analytics time-range selector offers "This Week / This Month / All Time" but `activityData` only slices 7 or 14 days — "This Month" and "All Time" show identical charts
- Flashcard mastery percent is hardcoded (`Math.ceil(cardCount * 0.3)`) — does not reflect actual review history
- Exam "Exit Exam" warning says "Your progress will be lost" but code saves to `sessionStorage` on every answer — false alarm
- Library "Move" bulk action is disabled when `selectedIds.size !== 1` — no explanation shown

### Intuitive
- Flashcard keyboard shortcuts (Space/Enter to flip, arrows to navigate, 1-2-3 to rate) — matches Anki mental model
- Exam question navigator grid (numbered pills, purple = answered, outlined = current)
- Library drag-and-drop with batch progress tracking and per-file retry
- Exam session persistence via `sessionStorage` + auto-submit on timer expiry

### Frustrated
- Library has zero keyboard navigation — no shortcut to focus search, open/delete/rename a doc
- Flashcard list requires mouse click to open a deck — no keyboard arrow + Enter path
- Exam list has no search or filter — scrolling a flat list at scale
- Analytics trend badges (`+12%`, `+8%`, `+5%`) are hardcoded static strings — never computed from real data
- Library bulk-delete takes 4+ clicks with no keyboard path

### Too Many Clicks
- Opening a flashcard deck from Library: 5+ clicks (Library → doc → Quick Action → Flashcards tab → deck → Study Now)
- Bulk-delete 3 docs: 6 clicks minimum, no keyboard path
- Rename a document: 5 steps, no inline edit
- Starting a due-review session: 3 steps, no shortcut from elsewhere in the app

### Hard to Discover
- Exam keyboard shortcuts only shown on sm+ breakpoints and only during an active exam
- Flashcard shuffle toggle is a small unlabelled icon button
- Library course filter has no persistent indicator in the header when active
- Analytics is Pro-only but the nav item shows for all users — free users hit a blurred paywall

### Top Issues
1. No global keyboard navigation in Library — highest friction for 50+ doc users
2. Exam list has no search or filter — unusable at scale
3. Hardcoded trend percentages in Analytics destroy trust in the entire dashboard
4. Bulk operations in Library require too many clicks, no keyboard path
5. Flashcard deck list has no keyboard navigation
6. Analytics time-range selector is broken — "This Month" and "All Time" show identical data
7. No cross-surface shortcut to jump directly to a doc's flashcards or exam from Library

### Redesign Priority
Exam list needs search + course filter first. Then a global keyboard shortcut layer for Library (at minimum: "/" to focus search, Enter to open, Delete with confirm).

### Would Recommend?
No — not for a power user at this scale. Keyboard gaps in Library and broken analytics trust make it feel like a polished MVP aimed at casual mobile users.

---

## Priya — 20yo Oxford Medical Student

**Profile:** Uploads 5–10 PDFs weekly across modules (Anatomy, Physiology, Pharmacology, Pathology). Studies late at night under exam pressure. 100+ documents accumulated over a term.

### Confusing
- Sessions vs Library split is opaque — docs live in both but the relationship is unclear. Library card shows course badge, not which session owns the doc
- Bulk Move is disabled for multi-select (`selectedIds.size !== 1`) with no explanation
- Tutor has no indication of which documents it is drawing context from — "all your uploaded documents" is useless with 100+ docs
- Session creation requires at least one file — cannot create an empty named session to organise into first

### Intuitive
- Drag-and-drop upload works consistently everywhere — library, session creation modal, onboarding
- Bulk select mode with floating action toolbar, Escape to cancel, select-all toggle
- Session creation modal shows per-file upload progress inline
- Dark mode applied consistently across all components

### Frustrated
- No folder or tag layer inside a course — everything lands in a flat list within the course filter
- Search only matches document name and course name — no full-text search inside document content
- Session search only filters by session name — not by documents within or description content
- AI Tutor has no way to scope a conversation to a specific document or module
- `window.location.reload()` called after deleting a Tutor chat — jarring full-page reload instead of in-place state update

### Too Many Clicks
- Opening a document from Library routes through a session; if no `session_id` exists, sent to `/sessions?doc=<id>`, then navigate into session — 2–3 extra navigations to open a PDF
- Moving 10 documents to a different course requires 10 separate Move operations (bulk Move intentionally disabled for multi-select)
- Creating a study session: 6+ interactions before being in the session; cannot drag existing Library docs into a session

### Hard to Discover
- Favourites stored in `localStorage` only — silently missing on a second device (will feel like a bug)
- No visual indicator on document cards that they are favourited outside the Library grid view
- Sort preference persisted to `localStorage` but no indicator in the UI showing which sort is active
- Tutor history sheet accessed via icon button with no label on mobile

### Top Issues
1. No sub-folder or tag layer within courses — cannot organise 100+ docs by week or topic
2. Search is name-only, not content-aware — medical students need concept-level search
3. Bulk Move is UI-blocked for multiple selections
4. AI Tutor has no document scoping — context dilution with 100+ docs
5. Favourites are device-local (localStorage), not persisted to the user's account

### Redesign Priority
Week/tag organisation layer inside courses. A simple "Add tag" or "Week" field on each document — shown as filterable chips in the Library — would unblock the core use case with minimal schema change (tags array on the document record + tag-filter pill row in the Library header).

### Would Recommend?
Probably yes, with hesitation. Core loop is smooth, dark mode quality is good for late-night use. But at 100+ docs the flat organisation model becomes a real problem within a few weeks.

---

## Jake — 22yo Law Student

**Profile:** Daily exam prep: flashcards + exams + reviewing mistakes. Wants progress tracking and habit formation.

### Confusing
- "Due Today" banner due count is faked: `Math.ceil(set.cardCount * 0.3)` — not a real SRS calculation
- Analytics trend badges (+12%, +8%, +5%) are hardcoded static numbers — not computed from real data
- Exam list shows question count and difficulty but no previous score or attempt history
- Dashboard stats (Documents, Courses, Ready, Processing) are operational metadata, not learning progress

### Intuitive
- "Due Today" review button surfaces at the top of the flashcard list — one tap to start
- Exam session persistence via `sessionStorage`
- Keyboard shortcuts well-implemented and hinted inline
- Flashcard completion screen shows Again/Good/Easy counts and time elapsed
- Exam results expand per-question with correct answer, user answer, and explanation

### Frustrated
- No daily study plan or suggested routine — must self-direct every session from a blank dashboard
- Streak only visible inside Analytics (Pro-gated) — no daily accountability for free users
- No weak area identification across sessions — no topic-level aggregation
- Analytics fully paywalled for free users — removes all retention hooks

### Hard to Discover
- Keyboard shortcuts for flashcard rating only shown as small hint text — easy to miss on mobile
- "Due Today" banner only appears if `dueCards.length > 0` — no explanation of when cards will next be due
- Flashcard mastery percent is computed from the same fake 30% due estimate — not from actual difficulty ratings
- No way to see cross-exam weak topics from the exam list view

### Too Many Clicks
- Check progress after a study session: complete flashcards → navigate to Analytics → wait for load. No post-session link to analytics
- Find which decks need the most work: no sorting by mastery or due count — must scan manually
- Retake a failed exam and compare scores: 6+ steps, no side-by-side or delta shown

### Top Issues
1. Fake SRS due counts — `Math.ceil(cardCount * 0.3)` is not spaced repetition. Core daily workflow promise built on a placeholder
2. Dashboard is study-blind — four operational stats replace what should be a daily study brief (streak, cards due, recommended exam, last score)
3. Streak and all progress metrics are Pro-gated — removes habit loop from free users
4. No weak area identification across sessions
5. Hardcoded trend percentages in analytics stat cards — worse than no trend, erodes credibility
6. Exam history invisible from the exam list — no previous score, attempt count, or last-attempted date
7. Post-session flow is a dead end — no nudge toward next logical action

### Redesign Priority
Dashboard: replace four operational stat tiles with a daily study brief — streak (free tier), cards due today (real SRS count), last exam score with delta, and a single CTA to start the recommended session.

### Would Recommend?
Unlikely. The core daily loop (open app → know what to study → study → see progress) has critical gaps. The SRS due count is fake, the dashboard shows no learning data, and the streak is paywalled. The bones are good but the habit-forming layer is missing.
