# QA Report: UI/UX Audit — Authenticated Screens

**Date:** 2026-06-29
**Tester:** AI QA Agent (8 parallel auditors + previous audit)
**User Profile:** Alex Cheng (power user, nhiều documents/sessions/flashcards)
**Focus:** UI/UX improvements cho logged-in user experience

---

## Executive Summary

| Metric | Value |
|--------|-------|
| Total Screens Tested | 7 areas (10+ pages) |
| Total Issues Found | 90 |
| Critical | 1 |
| High | 20 |
| Medium | 44 |
| Low | 25 |

### Screen Scores (1-10)

| Screen | Score | Top Issue |
|--------|-------|-----------|
| Tutor/Settings/Analytics | 5.0 | Tutor sidebar unusable on mobile |
| Dashboard | 5.5 | Fetches ALL documents to show 4 items |
| Sidebar/Header | 6.2 | Notification bell has no accessible label |
| Sessions | 6.5 | No pagination, non-responsive table |
| Exam | 6.5 | Radiogroup lacks keyboard navigation |
| Library | 6.5 | No pagination for documents (critical) |
| Flashcards | 7.0 | Math.random() produces fake due counts |

### 3 Systemic Gaps

1. **No Pagination Anywhere** — Every list view fetches full collections. Performance degrades linearly with usage.
2. **Incomplete Mobile-First** — Mobile CSS used but core features (tutor, session detail, exam nav) break below 768px.
3. **Accessibility Gaps** — Missing labels, no roving tabIndex, non-keyboard-accessible interactive divs.

---

## Critical Issues (P0)

| # | Module | Issue | Severity | Steps to Reproduce | Expected | Actual |
|---|--------|-------|----------|---------------------|----------|--------|
| 1 | Library | No pagination/virtualization for documents | Critical | Login as Alex Cheng → Library → All 50+ docs load at once | Paginated infinite scroll (20-30/page) | All documents mounted to DOM causing jank |
| 2 | Exam | Answer options not keyboard accessible | Critical | Tab through exam page, try to select answer with Enter/Space | Arrow keys move between options per WAI-ARIA radiogroup | All options tabIndex=0, no arrow navigation |
| 3 | Flashcards | Math.random() produces fake due counts | Critical | Navigate to Flashcards → Observe flickering due counts | Stable count from spaced repetition data | Random numbers that change every render |
| 4 | Library | Menu actions non-functional (Open, Rename, Move) | Critical | Click "..." menu on any document, click "Open" | Document opens in viewer | Nothing happens, no onClick handler |
| 5 | Library | No AI feature entry point from library | Critical | View a "ready" document in library | Quick actions to generate quiz/flashcards/TTS | No action buttons, must navigate elsewhere |

## High Issues (P1)

| # | ID | Module | Issue | Steps to Reproduce | Expected | Actual |
|---|-----|--------|-------|---------------------|----------|--------|
| 6 | D2 | Dashboard | Fetches ALL documents to show 4 items | Login → Dashboard → Network tab | API with limit=4&sortBy=updatedAt | Full collection fetched, sliced client-side |
| 7 | S1 | Sessions | No pagination on session list | Login → Sessions with 50+ sessions | Paginated table (20/page) | All sessions rendered in one table |
| 8 | T1 | Tutor | Sidebar always 256px, unusable on mobile | Open Tutor on 375px phone | Sidebar collapses to drawer | Fixed w-64 consumes entire screen |
| 9 | S2 | Sessions | Non-responsive HTML table (6 cols) | Sessions page on mobile | Card layout or hidden columns | Cramped/overflowing table |
| 10 | L3 | Library | No click-to-open on document cards | Click card in normal mode | Navigate to document | Nothing happens |
| 11 | D4 | Dashboard | Document rows not keyboard-accessible | Tab through dashboard | Focusable rows with Enter/Space | Divs with onClick, no role/tabIndex |
| 12 | E2 | Exam | No roving tabIndex in radiogroup | Arrow keys between answers | Focus moves between options | All have tabIndex=0, no arrows |
| 13 | T3 | Tutor | Error state never surfaced | Send msg with network failure | Error toast + retry | Message disappears silently |
| 14 | E1 | Exam | Navigator grid can't scale 50+ Qs | 50-question exam on mobile | Scrollable/collapsible navigator | 6+ rows of dots dominate viewport |
| 15 | N1 | Header | Notification bell no aria-label | Screen reader on header | "Notifications" announced | "Button" with no context |
| 16 | D1 | Dashboard | No dark mode support | Enable dark mode | Consistent dark theme | White backgrounds, unreadable |
| 17 | D3 | Dashboard | No visible focus indicators | Tab through quick actions | Focus ring visible | No focus styling whatsoever |
| 18 | N2 | Header | Bell touch target 32px (< 44px WCAG) | Tap bell on tablet | 44px minimum touch target | 32x32px button |
| 19 | N3 | Header | User menu trigger lacks aria-label | Screen reader on user menu | "User menu" announced | Unlabeled trigger |
| 20 | L2 | Library | Client-side search only, no debounce | Type in search with 50+ docs | Debounced server-side search | Every keystroke re-filters full array |
| 21 | T2 | Tutor | No voice input (STT in stack but missing) | Look for microphone button | Mic button with speech-to-text | Text input only |
| 22 | E3 | Exam | No offline resilience during exam | Network drop mid-exam | Offline banner, auto-retry queue | Single retry button, no auto-recovery |
| 23 | F1 | Flashcards | All cards loaded at once (100+) | Open large deck | Lazy-load/prefetch next 2-3 | Full array in memory and DOM |
| 24 | S1* | Settings | Settings page is a placeholder | Open Settings | Profile edit, theme, notifications | Read-only name/email + "coming soon" |

## Medium Issues (P2)

| # | ID | Module | Issue |
|---|-----|--------|-------|
| 25 | D5 | Dashboard | No error state handling (errors ignored) |
| 26 | D6 | Dashboard | Stats label "Sessions" shows courses data |
| 27 | D7 | Dashboard | No skeleton for stats row while loading (shows 0) |
| 28 | D8 | Dashboard | No active/pressed state on quick action buttons |
| 29 | D9 | Dashboard | Onboarding hero p-16 too large on 320px |
| 30 | N4 | Sidebar | Active state misses dashboard sub-routes |
| 31 | N5 | Sidebar | No visual grouping for 8 nav items |
| 32 | N6 | Sidebar | Nav lacks `aria-label="Main navigation"` |
| 33 | N7 | Sidebar | Sidebar doesn't close on nav link tap (mobile) |
| 34 | N8 | Sidebar | No focus trap for mobile overlay |
| 35 | N9 | Header | No polling/real-time for notifications |
| 36 | S3 | Sessions | No sort functionality on session list |
| 37 | S4 | Sessions | Session creation requires files (artificial restriction) |
| 38 | S5 | Sessions | No error handling in create modal |
| 39 | S6 | Sessions | Document sidebar fixed w-80 breaks on mobile |
| 40 | S7 | Sessions | Tabs lack ARIA tab pattern (role=tab, aria-selected) |
| 41 | S12 | Sessions | Nested scroll containers confuse mobile |
| 42 | F3 | Flashcards | No next-review interval feedback after rating |
| 43 | F4 | Flashcards | No study statistics/history view |
| 44 | F5 | Flashcards | Card flip button lacks aria-expanded |
| 45 | F6 | Flashcards | Difficulty buttons lack keyboard shortcut hints |
| 46 | F7 | Flashcards | Keyboard 1/2/3 order conflicts with visual Hard/Med/Easy |
| 47 | F8 | Flashcards | 3D flip requires custom Tailwind utilities (may break) |
| 48 | E4 | Exam | No exam history/past attempts visible |
| 49 | E5 | Exam | Bottom nav not sticky on mobile |
| 50 | E6 | Exam | Timer aria-live fires every second (disruptive) |
| 51 | E7 | Exam | exam-tab renders all questions at once |
| 52 | E8 | Exam | Results lack category breakdown/weak areas |
| 53 | E9 | Exam | Keyboard 1-4 hardcoded (no support for 5+ options) |
| 54 | L4 | Library | Grid doesn't adapt to 320px (grid-cols-2 cramped) |
| 55 | L5 | Library | Quick action buttons may not forward aria-labels |
| 56 | L6 | Library | Bulk Move limited to single selection |
| 57 | L7 | Library | LayoutGroup causes expensive recalculations (50+ docs) |
| 58 | L8 | Library | No client-side file size validation before upload |
| 59 | L9 | Library | Favorites localStorage only, not synced across devices |
| 60 | T4 | Tutor | Session deletion uses window.location.reload() |
| 61 | T5 | Tutor | Chat input single-line, no multiline |
| 62 | T6 | Tutor | No context awareness UI (which docs are referenced) |
| 63 | T7 | Tutor | Session list items not keyboard-accessible |
| 64 | T8 | Tutor | Race condition with setTimeout(100ms) on first message |
| 65 | S2* | Settings | No profile edit capability whatsoever |
| 66 | A1 | Analytics | Chart lacks axis labels and tooltips |
| 67 | A2 | Analytics | Bar chart unreadable on mobile (28 bars) |
| 68 | A3 | Analytics | No time range selection |

## Low Issues (P3)

| # | ID | Module | Issue |
|---|-----|--------|-------|
| 69 | D10 | Dashboard | CourseSkeleton defined but unused (dead code) |
| 70 | D11 | Dashboard | CreateCourseForm imported but never rendered |
| 71 | D12 | Dashboard | Section headings visually flat |
| 72 | N10 | Sidebar | No collapse/expand toggle on desktop |
| 73 | N11 | Header | Credit balance shows hardcoded infinity |
| 74 | N12 | Header | Mobile header lacks notifications access |
| 75 | N13 | Sidebar | No Escape key handler for overlay |
| 76 | N14 | Header | Mark all read has no undo |
| 77 | S8 | Sessions | Chat input single-line (no Shift+Enter) |
| 78 | S9 | Sessions | Empty state images may be broken (webp paths) |
| 79 | S10 | Sessions | Delete has no loading indicator |
| 80 | S11 | Sessions | Tab change triggers unnecessary full refresh |
| 81 | F9 | Flashcards | Fixed min-h-[260px] too small on mobile |
| 82 | F10 | Flashcards | Swipe-up gesture undiscoverable |
| 83 | F11 | Flashcards | No visual distinction new vs reviewed cards |
| 84 | F12 | Flashcards | Stale closure risk in handleDifficulty |
| 85 | E10 | Exam | Progress bar tracks answered not position |
| 86 | E11 | Exam | Exit dialog text misleading about data loss |
| 87 | E12 | Exam | No mobile interaction hints (swipe tips) |
| 88 | L10 | Library | Skeleton count fixed at 8 regardless of viewport |
| 89 | L11 | Library | No keyboard shortcuts (Cmd+K search) |
| 90 | L12 | Library | Course border color uses fragile name heuristics |
| 91 | A4 | Analytics | Exam trend uses bars not line chart |
| 92 | A5 | Analytics | Error state has no retry button |
| 93 | T9 | Tutor | Delete button invisible on touch devices |

---

## TDD Improvement Plan

### Phase 1: Critical UX Fixes (Week 1-2)

Focus: Performance, broken interactions, data integrity.

| # | Task | Test First | Then Implement | Effort |
|---|------|-----------|----------------|--------|
| 1 | Paginated useDocuments | Test API called with limit/offset params | Cursor pagination in hook + infinite scroll | 4-6h |
| 2 | Paginated useSessions | Test limit/offset passed to /sessions | Server-side pagination + table controls | 3-4h |
| 3 | Dashboard limit=4 | Test dashboard passes limit=4&sortBy=updatedAt | Update hook call in dashboard | 2h |
| 4 | Fix Math.random() due counts | Test dueCount comes from API response | Server-side SRS computation | 3-4h |
| 5 | Click-to-open cards | Test card onClick calls onOpen in normal mode | Add handler + cursor-pointer | 1-2h |
| 6 | Tutor error state | Test error renders toast + retry button | Wire error from hook to UI | 1-2h |
| 7 | Tutor race condition fix | Test direct session ID passing | Eliminate setTimeout, use returned ID | 1-2h |

### Phase 2: Responsive & Accessibility (Week 2-3)

Focus: Mobile-first layouts, ARIA compliance.

| # | Task | Test First | Then Implement | Effort |
|---|------|-----------|----------------|--------|
| 8 | Tutor responsive drawer | Playwright 375px: sidebar hidden, toggle visible | hidden md:flex + Sheet drawer | 3-4h |
| 9 | Sessions card layout mobile | Playwright 375px: no overflow, card layout | Responsive table → cards below sm | 3-4h |
| 10 | Session detail responsive | Playwright 375px: full-screen document view | Breakpoint switch split→full | 2-3h |
| 11 | Exam sticky bottom nav | Test nav sticky on mobile viewport | sticky bottom-0 below sm | 1-2h |
| 12 | Aria-labels (bell, menu) | axe-core: zero unnamed buttons in header | Add aria-label to all icon buttons | 1h |
| 13 | Exam roving tabIndex | Test ArrowDown moves focus to next option | Implement roving tabIndex pattern | 2-3h |
| 14 | Dashboard keyboard access | Test document rows focusable, Enter activates | Replace div→button or add role | 1-2h |
| 15 | Focus rings everywhere | Test focus-visible:ring on all interactive elements | Add focus-visible classes | 2h |
| 16 | Mobile sidebar focus trap | Test focus stays inside when overlay open | Add @radix-ui/react-focus-scope | 2h |

### Phase 3: Polish & Delight (Week 3-4)

Focus: Visual consistency, perceived performance, interaction refinement.

| # | Task | Test First | Then Implement | Effort |
|---|------|-----------|----------------|--------|
| 17 | Stats skeleton while loading | Test skeleton renders when isLoading | Conditional skeleton stat cards | 1h |
| 18 | Dark mode dashboard | Visual regression: no white bgs in dark | Semantic tokens (bg-card, text-foreground) | 2-3h |
| 19 | SRS interval feedback | Test toast shows next review date after rating | Display computed interval from API | 2h |
| 20 | Exam navigator max-height | Test 50-Q navigator has overflow-y-auto | max-h container + summary badge | 2h |
| 21 | Quick action press states | Test active:scale-[0.97] class present | Add active/transition classes | 1h |
| 22 | Analytics chart labels | Test x-axis labels render | Add date labels + styled tooltips | 2h |
| 23 | Server-side favorites | Test favorites PATCH/GET API calls | DB-backed favorites with localStorage cache | 3-4h |

---

## Summary

| Severity | Count |
|----------|-------|
| Critical (P0) | 5 |
| High (P1) | 19 |
| Medium (P2) | 44 |
| Low (P3) | 25 |
| **Total** | **90** (deduplicated + merged with previous audit) |

## Top 10 Highest Priority Actions

1. **Add pagination to Library** — Critical performance for power users
2. **Add pagination to Dashboard/Sessions** — Same systemic gap
3. **Fix Math.random() in flashcard due counts** — Trust-destroying fake data
4. **Make Tutor responsive** — Core feature unusable on mobile
5. **Add click-to-open on document cards** — Most natural interaction broken
6. **Fix keyboard accessibility (dashboard, exam)** — WCAG violations
7. **Surface error states (tutor, dashboard)** — Silent failures
8. **Make Sessions table responsive** — Unreadable on phones
9. **Add aria-labels to header buttons** — Quick win, high a11y impact
10. **Fix tutor race condition** — First message can be lost

## Top Risk Areas

1. **Performance/Scale** — No pagination anywhere; app degrades with usage
2. **Accessibility** — 15+ ARIA/keyboard violations across all modules
3. **Mobile UX** — 8 features break below 768px despite "mobile first" requirement
4. **Silent Failures** — 5 places where errors are swallowed with no user feedback
5. **Data Integrity** — Fake data (Math.random), race conditions, no offline resilience
6. **Missing Features** — 4 advertised features completely unimplemented (OCR, STT, Search, Payments)

---

## Round 2 — Missing Features Audit (2026-06-29)

Features advertised in project requirements vs implementation status:

| ID | Severity | Feature | Status | Notes |
|----|----------|---------|--------|-------|
| MISS-001 | Critical | OCR | MISSING | No tesseract or text recognition library in codebase |
| MISS-002 | Critical | Speech To Text | MISSING | No STT on web; mobile has TTS only (expo-speech) |
| MISS-003 | High | Text To Speech (Web) | MISSING | Only exists in mobile app via expo-speech |
| MISS-004 | Critical | Global Search | MISSING | No search route, component, or hook |
| MISS-005 | High | User Activity History | PARTIAL | Admin audit log exists; no user-facing history page |
| MISS-006 | High | Export/Import | PARTIAL | Only mindmap PNG export; no doc export/import |
| MISS-007 | High | Offline Mode | PARTIAL | Service worker for push notifications only; no caching |
| MISS-008 | Critical | Payments | MISSING | Paywall UI exists but code has `// TODO: integrate payment provider` |
| MISS-009 | High | User Subscription Mgmt | PARTIAL | Admin panel only; no user-facing upgrade/manage UI |

### Combined Totals (Round 1 + Round 2)

| Severity | Count |
|----------|-------|
| Critical (P0) | 9 |
| High (P1) | 24 |
| Medium (P2) | 44 |
| Low (P3) | 25 |
| **Total** | **99** (includes 9 missing feature findings) |

### Updated Top 10 Priority Issues

1. **MISS-008** [Critical] — Payments not integrated (paywall is decorative only)
2. **MISS-004** [Critical] — No global search feature
3. **MISS-001** [Critical] — OCR completely missing
4. **MISS-002** [Critical] — Speech To Text completely missing
5. **D1/D2** [Critical] — No pagination — app degrades at scale
6. **MISS-009** [High] — No user-facing subscription management
7. **MISS-007** [High] — Offline mode = notification push only
8. **T1** [Critical] — Tutor unusable on mobile (not responsive)
9. **MISS-006** [High] — Export limited to mindmap PNG
10. **F1** [Critical] — Math.random() in SRS due counts (fake data)
