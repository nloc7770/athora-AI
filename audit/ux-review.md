# Athora UX Audit

Auditor perspective: Senior UX Architect (15yr, ex-Stripe, ex-Linear)
Date: 2026-06-25

---

## 1. Landing Page

**File:** `apps/web/src/components/landing/landing-page.tsx`

### What is this? — PASS
Purpose is immediately clear: AI study tool for students. Headline "Study less. Remember everything." communicates the value in under 2 seconds.

### Why should I care? — PASS
Pain points section (lines 45-49) establishes the problem before presenting the solution. Stats section (lines 415-432) adds social proof. Testimonials reinforce.

### Primary CTA — PASS
"Start free — no card needed" is prominent, repeated at bottom with email capture. Good urgency without being pushy.

### Issues Found

| Severity | Location | Issue |
|----------|----------|-------|
| MEDIUM | Line 204 | Hero product image `src="/images/hero-product.png"` has no fallback or skeleton. If image fails to load, the entire right column is an empty rotated white box. Add an `onError` handler or CSS background fallback. |
| MEDIUM | Lines 382-404 | Feature bento grid images (`/images/feature-chat.png`, etc.) have no `width`/`height` attributes. This causes CLS as images load. Violates Core Web Vitals target. |
| LOW | Line 89 | `ctaEmail` state is captured but the form action is `/register` with method GET. The email value is passed via `name="email"` but the register page (`register/page.tsx`) does not read query params — the email is silently dropped. Users must re-type. |
| LOW | Lines 449-460 | Testimonial scroll arrows are `hidden md:flex` — on mobile there is no visual affordance that the carousel is scrollable. No scroll indicator dots or peek of next card. |
| MEDIUM | Line 104 | Grain texture overlay SVG is inlined as a data URI on a `fixed` element with `z-[100]`. This paints on every frame during scroll on older mobile GPUs. Should be `will-change: auto` or moved to a CSS pseudo-element with `pointer-events: none` already set (which it is) but the z-index stacking above everything including future modals is dangerous. |
| LOW | Lines 584-605 | Student gallery images use generic filenames (`hero-student.png`, `ai-learning.png`). If any are missing, user sees broken image with no graceful degradation. |

### Mobile
- Navigation hamburger works (lines 130-147).
- Hero text uses `clamp()` for responsive sizing — good.
- Pain steps use horizontal scroll with `snap-x` — functional but no scroll hint.

---

## 2. Login Page

**File:** `apps/web/src/app/login/page.tsx` + `components/auth/auth-form.tsx`

### What is this? — PASS
"Welcome back" with "Sign in to continue your learning journey" is clear.

### Primary CTA — PASS
Single "Sign in" button, full width.

### Issues Found

| Severity | Location | Issue |
|----------|----------|-------|
| HIGH | auth-form.tsx:60-61 | No rate limiting or throttle on form submission. User can spam the submit button. `isLoading` disables the button but rapid double-clicks before state updates can fire two requests. Add `e.preventDefault()` guard or debounce. |
| MEDIUM | auth-form.tsx:104-109 | "Forgot password?" links to `/forgot-password` — if this route does not exist, user hits a 404 with no recovery. Verify route exists or hide the link. |
| LOW | auth-form.tsx:49 | `min-h-svh` centers the card vertically. On short mobile screens (keyboard open), the card may be partially occluded. Consider `min-h-dvh` or scroll-aware layout. |
| LOW | auth-form.tsx:61-63 | Error message has no `role="alert"` or `aria-live="polite"`. Screen readers won't announce the error. |

### Empty States — N/A
### Error States — PARTIAL
Generic error message is shown but no differentiation between "wrong password", "no account found", "network error". Users get "An unexpected error occurred" for anything not an Error instance (line 26 in login/page.tsx).

---

## 3. Register Page

**File:** `apps/web/src/app/register/page.tsx` + `components/auth/auth-form.tsx`

### What is this? — PASS
"Create an account" / "Start your exam prep with Athora" is clear.

### Issues Found

| Severity | Location | Issue |
|----------|----------|-------|
| MEDIUM | auth-form.tsx:98-100 | Password hint says "Minimum 8 characters" but there is no strength indicator. Users create weak passwords. Consider showing strength feedback. |
| MEDIUM | auth-form.tsx:113-135 | Terms checkbox uses a native `<input type="checkbox">` that is not styled consistently with the rest of the design system (no custom checkbox component). Looks out of place on some browsers. |
| LOW | auth-form.tsx:137-145 | Submit button is disabled when terms unchecked but there is no tooltip or inline message explaining why. User may be confused. |
| HIGH | register/page.tsx:20-22 | On successful registration, user is immediately redirected to `/dashboard`. No email verification flow. If Supabase requires email confirmation, user lands on dashboard in an unverified state. |

---

## 4. Dashboard

**File:** `apps/web/src/components/dashboard/dashboard-page.tsx`

### What is this? — PASS
Welcome banner with user name, course count, document count. Clear purpose.

### Why should I care? — PASS
"Continue learning" CTA on banner. Quick actions grid provides clear next steps.

### Primary CTA — ISSUE
| Severity | Location | Issue |
|----------|----------|-------|
| HIGH | Line 435 | "Continue learning" button navigates to `/sessions/${mostRecentDoc.id}`. But `mostRecentDoc` comes from `documents` sorted by `updatedAt` — the `id` is a document ID, not a session ID. The URL pattern `/sessions/:id` expects a session ID. This is likely a navigation bug that sends users to a 404 or wrong session. |

### Issues Found

| Severity | Location | Issue |
|----------|----------|-------|
| HIGH | Line 435 | Bug: `mostRecentDoc.id` is a document ID used in a session URL. Should be `mostRecentDoc.sessionId` or route to `/documents/${mostRecentDoc.id}`. |
| MEDIUM | Lines 418-421 | Banner background image `/images/dashboard-banner.png` with `opacity-20` — if missing, layout still works but the gradient looks flat. Not critical but should have fallback. |
| MEDIUM | Lines 559-560 | Course documents are filtered by `d.courseId === course.id` but the `documents` hook may not include `courseId` on all docs. If a document was uploaded via sessions (not courses), the count is misleading (always 0). |
| LOW | Lines 717-758 | Quick Actions grid has 4 items. "Ask AI" routes to `/tutor`, "Review Flashcards" to `/flashcards`, "Start Exam" to `/exam`. These pages likely don't exist as standalone routes based on the sidebar nav structure. Verify they render something useful and don't 404. |
| LOW | Line 508-510 | `DialogTrigger` uses a non-standard `render` prop. This may be a custom Dialog implementation — verify it works with keyboard focus management. Standard Radix UI uses `asChild`. |

### Empty States — GOOD
First-time user sees `OnboardingHero` (line 361-362) with clear upload CTA. Courses and documents sections have individual empty states with action buttons.

### Cognitive Load — MEDIUM CONCERN
Dashboard shows: welcome banner, date header, upload button, recent activity card, courses grid, recent documents list, overview stats, quick actions. That's 7 distinct sections on one page. Consider collapsing "Recent Activity" into "Recent Documents" — they show the same data.

---

## 5. Sessions List Page

**File:** `apps/web/src/app/sessions/page.tsx`

### What is this? — PASS
"Session Management" heading with total count.

### Why should I care? — WEAK
| Severity | Location | Issue |
|----------|----------|-------|
| MEDIUM | Line 101-103 | "Session Management" is an internal/admin term. Students think in terms of "Study Sets" or "My Materials". The label doesn't communicate value. |

### Primary CTA — PASS
"Create new session" button is top-right, clearly visible.

### Issues Found

| Severity | Location | Issue |
|----------|----------|-------|
| MEDIUM | Line 97 | `min-h-screen bg-gray-50` — uses `gray-50` while the rest of the app uses `stone-*` palette (sidebar, landing). Inconsistent design tokens. |
| MEDIUM | Lines 127-203 | Table layout is not responsive. On mobile (320px-768px), a 6-column table with "Session name", "Files", "Status", "Created at", "Last updated", "Delete" will overflow or compress illegibly. No `overflow-x-auto` on the table wrapper itself, only on the outer div. |
| LOW | Line 151 | Empty state text "No sessions yet. Create one to get started." is bare text in a table cell. No icon, no illustration, no CTA button. Compare to dashboard empty states which have icons and action buttons. Inconsistent empty state treatment. |
| LOW | Lines 54-75 | `handleCreate` has no error handling for `createSession` or `uploadDocument` failures. If creation fails, the modal stays in "Processing..." state forever (`finally` sets `creating=false` but UI gives no error feedback). |
| MEDIUM | Lines 78-82 | `handleFileDrop` silently filters to only PDFs (`f.type === 'application/pdf'`). If user drops a .docx, nothing happens. No toast or error message explaining why files were ignored. |

### Navigation — PASS
Clicking a row navigates to session detail. Back navigation via sidebar.

---

## 6. Session Detail (Workspace)

**File:** `apps/web/src/app/sessions/[id]/page.tsx`

### What is this? — PASS
Session name in header, tab navigation for different study modes.

### Why should I care? — PASS
Tabs clearly show what's possible: Documents, Chat, Flashcards, Exam, Summary, Mind Map.

### Issues Found

| Severity | Location | Issue |
|----------|----------|-------|
| HIGH | Lines 339-349 | Loading state is a full-screen centered spinner with no text. User has no idea what's loading or how long to wait. Add "Loading session..." label. |
| MEDIUM | Lines 411-428 | Tab bar uses `overflow-x-auto` but no visual scroll indicator on mobile. With 6 tabs, the rightmost tabs (Summary, Mind Map) are invisible on small screens. Users may never discover them. Add fade gradient or scroll shadow to hint at more tabs. |
| MEDIUM | Lines 530 | Documents panel width toggles between `w-80` (when doc selected) and `max-w-3xl w-full` (when not). This causes a jarring layout shift when selecting a document. The entire document list reflows. Use a fixed two-column layout with the right panel sliding in. |
| LOW | Line 399 | Back button is just an arrow icon with no label. Accessibility: no `aria-label` on the button. Screen readers will announce "button" with no context. |
| LOW | Lines 56, 91 | `document: any` and `ch: any` — type safety aside, the `DocumentInsight` component silently renders nothing if `document` is null. No loading or error state for that case. |
| MEDIUM | Lines 644-649 | Chat empty state when no docs ready says "Upload and process documents first to start chatting". But the user is already ON the chat tab — the message should offer a way to switch to the Documents tab or trigger upload from here. Dead end. |

### Error States — GOOD
Error state (lines 351-378) shows icon, message, Retry button, and "Back to sessions" escape hatch. Well done.

---

## 7. Sidebar

**File:** `apps/web/src/components/layout/sidebar.tsx`

### What is this? — PASS
Standard sidebar with logo, navigation items, user info, logout.

### Navigation — PASS
Active state is clearly distinguished with amber gradient background. User always knows where they are.

### Issues Found

| Severity | Location | Issue |
|----------|----------|-------|
| MEDIUM | Lines 22-30 | 7 navigation items: Dashboard, Sessions, Library, AI Tutor, Flashcards, Exam Mode, Settings. "Library", "AI Tutor", "Flashcards", and "Exam Mode" are likely placeholder routes with no content. If they 404 or show empty shells, users lose trust. |
| LOW | Line 82 | Active state logic: `pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href + "/"))`. The `/dashboard` exception means `/dashboard/something` won't highlight Dashboard. Edge case but worth noting. |
| LOW | Lines 129-132 | "Free plan" label is static text at the bottom with no upgrade CTA. Missed conversion opportunity. Should link to pricing or upgrade page. |
| MEDIUM | Lines 138-161 | `MobileHeader` only shows hamburger + logo. No breadcrumb or page title. User must open the sidebar to confirm where they are. On mobile, after navigating deep (e.g., `/sessions/abc123`), there's no context in the header about current location. |

### Mobile
- Overlay pattern (line 46-50) with click-to-close works correctly.
- Transition with `-translate-x-full` is smooth.
- Close button inside sidebar (line 69-76) is present.

---

## 8. Settings Page

**File:** `apps/web/src/app/settings/page.tsx`

### What is this? — PASS
"Settings" with "Manage your account preferences" subtitle.

### Issues Found

| Severity | Location | Issue |
|----------|----------|-------|
| HIGH | Lines 34-51 | Profile section is read-only. No edit button, no way to change name, no way to change email or password. User is stuck with whatever they registered with. For a product that shows user name in dashboard banner and sidebar, this is a significant gap. |
| MEDIUM | Lines 54-58 | "More settings coming soon" placeholder with dashed border. This is acceptable for beta but communicates incompleteness. If shipping to users, either hide this section or provide a waitlist/feedback mechanism. |
| LOW | Line 97 (sidebar) | Settings uses `zinc-*` color tokens while rest of app uses `stone-*`. Inconsistent palette. Compare: sidebar uses `stone-200`, `stone-100`, `stone-900`. Settings uses `zinc-200`, `zinc-100`, `zinc-900`. |
| LOW | Lines 38-39 | Avatar shows first character of email. If user has a name, it still shows email initial (line 39: `user?.email?.charAt(0)`). Should prefer `user?.name?.charAt(0)` when available. |

### Cognitive Load — N/A (page is too empty)
### Empty States — The entire page IS an empty state.

---

## Cross-Cutting Issues

### Design System Inconsistency

| Issue | Files Affected |
|-------|---------------|
| Mixed color tokens: `gray-*` vs `stone-*` vs `zinc-*` | sessions/page.tsx uses `gray-*`, sidebar uses `stone-*`, settings uses `zinc-*` |
| Mixed border radius: `rounded-lg`, `rounded-xl`, `rounded-2xl`, `rounded-3xl` with no clear hierarchy | All pages |
| Card styling: landing uses custom cards, dashboard uses shadcn Card, sessions uses plain `div` with border | Inconsistent component usage |

### Accessibility Gaps

| Issue | Location |
|-------|----------|
| No skip-to-content link | All pages with sidebar |
| Auth form error lacks `role="alert"` | auth-form.tsx:61 |
| Session workspace back button lacks `aria-label` | sessions/[id]/page.tsx:399 |
| Delete button in sessions table lacks accessible label | sessions/page.tsx:187-195 |
| Color contrast: `text-stone-400` on `bg-stone-50` fails WCAG AA for small text | landing-page.tsx (multiple instances) |
| Testimonial scroll buttons have `aria-label` — good | landing-page.tsx:452-460 |

### Mobile Responsiveness Concerns

| Issue | Location |
|-------|----------|
| Sessions table is not mobile-friendly (6 columns) | sessions/page.tsx:127-203 |
| Session workspace tabs overflow without hint | sessions/[id]/page.tsx:411-428 |
| Mobile header has no page context | sidebar.tsx:138-161 |
| Document insight panel has no mobile layout (split pane) | sessions/[id]/page.tsx:528-620 |

### Navigation Architecture

The sidebar advertises 7 destinations. Based on the files audited, only Dashboard, Sessions, and Settings have real implementations. Library, AI Tutor, Flashcards, and Exam Mode are likely dead ends or thin shells. This creates a "ghost town" feeling where most of the app appears non-functional.

**Recommendation:** Hide unimplemented routes behind a feature flag or show a proper "Coming soon" page with context, rather than leaving nav items that lead nowhere.

---

## Priority Fixes (Ranked)

### P0 — Ship Blockers
1. **Dashboard navigation bug** — `mostRecentDoc.id` used as session ID (dashboard-page.tsx:435)
2. **Settings has no edit capability** — Users cannot update their profile
3. **Sessions table not responsive** — Unusable on mobile

### P1 — High Impact
4. **Register → no email verification** — Security/trust issue
5. **Session workspace loading state** — No text, users may think app is broken
6. **Auth form error lacks aria attributes** — Accessibility violation
7. **Color token inconsistency** — Ship a unified `stone-*` palette

### P2 — Polish
8. **"Session Management" naming** — Use student-friendly terminology
9. **Tab overflow indicator on mobile** — Users miss features
10. **Settings avatar logic** — Prefer name initial over email initial
11. **CTA email dropped on register** — Friction in conversion funnel
12. **Ghost nav items** — Hide unimplemented features

---

## Summary

The landing page is well-crafted with clear hierarchy and good persuasion mechanics. Auth flows are functional but minimal. The dashboard has a solid information architecture with one critical navigation bug. Sessions are the core feature and work well on desktop but fall apart on mobile due to the table layout and split-pane document view. Settings is essentially a placeholder.

The biggest systemic issue is **design system fragmentation** — three different gray palettes, inconsistent component usage, and no shared empty state pattern. This creates a feeling of multiple apps stitched together rather than one cohesive product.

Strongest areas: landing page storytelling, dashboard empty/onboarding state, session workspace feature density.
Weakest areas: mobile responsiveness in authenticated views, settings page, unimplemented nav routes.
