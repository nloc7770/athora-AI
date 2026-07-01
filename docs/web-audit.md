# ULTRACODE V4 Audit Report — Athora

**Project:** Athora v0.1.0
**Date:** 2025-06-25
**Branch:** dev
**Stack:** Next.js 15 / React 19 / TypeScript / NestJS / Supabase / PostgreSQL / RAGFlow / OpenAI-compatible LLM

---

## 1. Executive Summary

Athora is an AI-powered study platform helping students pass exams faster through document upload, AI-generated flashcards/summaries/exams/mindmaps, spaced repetition, and an AI tutor chat. The application has 15 routes (5 public, 10 protected), a NestJS backend with 13 modules and 47 endpoints, and integrates Supabase (auth/storage/DB), RAGFlow (document processing/RAG), and an OpenAI-compatible LLM.

### Key Metrics

| Category | Count |
|----------|-------|
| Critical Security Issues | 2 |
| High Security Issues | 6 |
| Critical Performance Issues | 3 |
| High Performance Issues | 5 |
| Critical UX Issues | 5 |
| High UX Issues | 9 |
| Missing Component States | 17 |
| User Flow Gaps | 80+ |

### Top 3 Risks

1. **Broken Access Control** — Any authenticated user can modify another user's flashcards and submit attempts against others' exams (CRITICAL security)
2. **No caching / waterfall fetches** — Every navigation re-fetches all data; session workspace has 5-deep request waterfall adding 1-3s latency (CRITICAL performance)
3. **Silent data loss** — Exam exit without confirmation, fire-and-forget flashcard reviews, library delete without confirmation (CRITICAL UX)

---

## 2. Architecture Overview

### Frontend (apps/web)

```
Next.js 15 App Router
├── Public routes: /, /login, /register, /forgot-password, /onboarding, /privacy, /terms
├── Protected routes: /dashboard, /sessions, /sessions/[id], /flashcards, /exam, /library, /tutor, /settings
├── State: Zustand (auth, app, toast) — no server-state cache (no TanStack Query/SWR)
├── API: Custom fetch wrapper (apps/web/src/lib/api.ts) with retry + refresh interceptor
├── UI: @base-ui/react primitives + CVA variants + Tailwind CSS
├── Animation: framer-motion (imported in 12+ files, no code-splitting)
├── Auth: Client-side ProtectedRoute guard, httpOnly cookie + Bearer token
└── Middleware: CSP nonce generation + security headers (no auth redirects)
```

### Backend (apps/backend)

```
NestJS
├── 13 modules: Auth, Users, Courses, Documents, Flashcards, Exams, Chat, AiGeneration, Sessions, Health, Supabase, Ai, Ragflow
├── 47 REST endpoints (all JSON, 1 SSE stream)
├── Guards: SupabaseAuthGuard (global), ThrottlerGuard (30/60s default)
├── Integrations: Supabase (auth/DB/storage), RAGFlow (document processing/RAG), LLM (DeepSeek-V4-Pro via OpenAI SDK)
├── Security: Helmet, compression, rate limiting, PDF magic byte validation
└── Issues: No CSRF, no pagination, unregistered interceptors/filters, broken ownership checks
```

---

## 3. All Routes

| Path | Auth | Data Fetching | Loading | Error | SEO | Notes |
|------|------|---------------|---------|-------|-----|-------|
| `/` | No | None | No | Yes (global) | Yes | Landing page, 695-line client component |
| `/login` | No | Client | No | No | No | Redirects to /dashboard on success |
| `/register` | No | Client | No | No | No | Redirects to /dashboard (skips onboarding) |
| `/forgot-password` | No | Client | No | No | No | Posts to /auth/forgot-password |
| `/onboarding` | No* | Client | No | No | No | 6-step wizard, uses auth hooks implicitly |
| `/dashboard` | Yes | Client | No | No | No | ProtectedRoute + AppLayout |
| `/sessions` | Yes | Client | Yes | No | No | Session list with create/delete dialogs |
| `/sessions/[id]` | Yes | Client | Yes | Yes | No | Session workspace, 5 hooks on mount |
| `/flashcards` | Yes | Client | No | No | No | Spaced repetition review |
| `/exam` | Yes | Client | No | No | No | Exam list + active + results states |
| `/library` | Yes | Client | No | No | No | Document library grid/list |
| `/tutor` | Yes | Client | No | No | No | AI chat interface |
| `/settings` | Yes | Client | No | No | No | Placeholder page |
| `/privacy` | No | None (SSR) | No | No | Yes | Static server component |
| `/terms` | No | None (SSR) | No | No | Yes | Static server component |

**Redirects:**
- ProtectedRoute -> `/login` (unauthenticated)
- `/login` -> `/dashboard` (on success)
- `/register` -> `/dashboard` (on success, should go to /onboarding)
- `/onboarding` -> `/sessions/[id]` or `/sessions` (on completion)

---

## 4. All API Endpoints

| Method | Path | Auth | Rate Limit | Validation | Notes |
|--------|------|------|-----------|------------|-------|
| POST | /auth/register | No | 5/60s | Yes | email, password (min 6), name? |
| POST | /auth/login | No | 5/60s | Yes | Sets httpOnly cookie |
| POST | /auth/refresh | No | 10/60s | Yes | Updates cookie |
| POST | /auth/forgot-password | No | 3/60s | Yes | Anti-enumeration |
| POST | /auth/logout | Yes | 30/60s | No | Clears cookie + invalidates token |
| GET | /auth/me | Yes | 30/60s | No | Returns profile |
| GET | /users/me | Yes | 30/60s | No | Duplicate of /auth/me |
| PATCH | /users/me | Yes | 30/60s | Yes | name?, avatar_url? |
| GET | /courses | Yes | 30/60s | No | List user courses |
| GET | /courses/:id | Yes | 30/60s | Yes | UUID validated |
| POST | /courses | Yes | 30/60s | Yes | name required |
| PATCH | /courses/:id | Yes | 30/60s | Yes | Partial update |
| DELETE | /courses/:id | Yes | 30/60s | Yes | — |
| GET | /documents | Yes | 30/60s | No | courseId?, type?, sessionId? |
| GET | /documents/:id | Yes | 30/60s | Yes | — |
| GET | /documents/:id/status | Yes | 30/60s | Yes | Processing status |
| GET | /documents/:id/url | Yes | 30/60s | Yes | Signed URL (1hr) |
| POST | /documents | Yes | 30/60s | Yes | Create metadata |
| POST | /documents/upload | Yes | 3/60s | Yes | Multipart, PDF only, 50MB max |
| PATCH | /documents/:id | Yes | 30/60s | Yes | Partial update |
| DELETE | /documents/:id | Yes | 30/60s | Yes | — |
| GET | /flashcards/sets | Yes | 30/60s | No | courseId? filter |
| GET | /flashcards/sets/:id | Yes | 30/60s | Yes | With cards |
| POST | /flashcards/sets | Yes | 30/60s | Yes | Create set |
| POST | /flashcards/sets/:id/cards | Yes | 30/60s | Yes | **NO OWNERSHIP CHECK** |
| PATCH | /flashcards/cards/:id | Yes | 30/60s | Yes | **NO OWNERSHIP CHECK** |
| DELETE | /flashcards/sets/:id | Yes | 30/60s | Yes | — |
| GET | /flashcards/due | Yes | 30/60s | No | Spaced repetition due |
| GET | /exams | Yes | 30/60s | No | List exams |
| GET | /exams/:id | Yes | 30/60s | Yes | With questions |
| POST | /exams | Yes | 30/60s | Yes | Create with questions |
| POST | /exams/:id/submit | Yes | 30/60s | Yes | **NO OWNERSHIP CHECK** |
| GET | /exams/:id/attempts | Yes | 30/60s | Yes | Attempt history |
| POST | /chat/sessions | Yes | 30/60s | Yes | type: document_chat or tutor |
| GET | /chat/sessions | Yes | 30/60s | No | documentId? filter |
| GET | /chat/sessions/:id/messages | Yes | 30/60s | Yes | Full history |
| POST | /chat/sessions/:id/messages | Yes | 10/60s | Yes | RAG or LLM response |
| POST | /chat/sessions/:id/messages/stream | Yes | 30/60s | Yes | SSE (conflicting decorators) |
| POST | /ai-generation/generate | Yes | 5/60s | Yes | documentId + type |
| POST | /ai-generation/generate-session | Yes | 5/60s | Yes | sessionId + type |
| GET | /ai-generation/document/:documentId | Yes | 30/60s | Yes | List generations |
| GET | /ai-generation/session/:sessionId | Yes | 30/60s | Yes | List generations |
| GET | /ai-generation/:id | Yes | 30/60s | Yes | Single generation |
| GET | /sessions | Yes | 30/60s | No | With document_count |
| GET | /sessions/:id | Yes | 30/60s | Yes | With documents |
| POST | /sessions | Yes | 30/60s | Yes | Auto-creates RAGFlow dataset |
| PATCH | /sessions/:id | Yes | 30/60s | Yes | name?, description? |
| DELETE | /sessions/:id | Yes | 30/60s | Yes | Also deletes RAGFlow dataset |
| GET | /sessions/:id/documents | Yes | 30/60s | Yes | Session documents |
| GET | /health | No | None | No | status, timestamp, uptime |

---

## 5. User Flows

### 5.1 Authentication

**Flow:** Register -> Login -> Session Init -> Protected Routes -> Refresh -> Logout

**Gaps:**
- No password reset completion page (`/reset-password` route missing)
- No email verification after registration
- No OAuth/social login
- ProtectedRoute does not preserve returnTo URL
- Register skips onboarding for new users
- No session expiry warning before forced logout
- No rate limiting feedback in UI

### 5.2 Onboarding

**Flow:** Study Style -> Subject -> Timeline -> Insight -> Upload -> Ready

**Gaps:**
- Preferences (studyStyle, subject, timeline) never persisted to backend
- No back navigation between steps
- No way to re-trigger onboarding
- Dashboard OnboardingHero is separate parallel experience
- Register does not redirect to /onboarding

### 5.3 Document Upload & Processing

**Flow:** File Select -> Upload -> Status Polling (3s) -> Ready

**Gaps:**
- No client-side file size validation (50MB)
- No upload progress percentage
- No cancel upload
- Polling never backs off or times out
- Inconsistent accepted file types across pages
- No duplicate detection

### 5.4 AI Chat / Tutor

**Flow:** Init Session -> Select Course -> Send Message -> Display Response

**Gaps:**
- No actual streaming (uses single POST, not SSE/WebSocket)
- No message retry on failure
- No markdown rendering
- No file attachment support
- Chat history not paginated

### 5.5 Flashcard Review

**Flow:** View Due -> Filter Course -> Flip Card -> Rate Difficulty -> Navigate

**Gaps:**
- Difficulty PATCH is fire-and-forget (no error handling)
- No keyboard shortcuts
- Cannot create/edit/delete cards manually
- No undo after rating
- nextReviewAt field unused in UI

### 5.6 Exam/Quiz

**Flow:** List Exams -> Start -> Answer -> Navigate -> Submit -> Results

**Gaps:**
- No confirmation before exit (answers lost)
- No time limit enforcement (timer counts up)
- No partial save/resume
- No explanation for wrong answers
- No question bookmarking
- Session ExamTab disconnected from /exam page

### 5.7 Study Sessions

**Flow:** List -> Create (name + files) -> Workspace -> Upload -> Generate AI -> Chat

**Gaps:**
- No session renaming after creation
- No pagination
- Session-generated content not reflected in global /flashcards or /exam
- No AI generation progress percentage

### 5.8 Library/Documents

**Flow:** View -> Filter/Search -> Upload -> Delete

**Gaps:**
- Open/Rename/Move menu items non-functional
- No document preview/viewer
- No bulk operations
- No pagination
- Delete has no confirmation dialog

### 5.9 Missing Flows (Listed in Stack)

- **TTS (Text-to-Speech)** — No implementation exists
- **Speech-to-Text** — No implementation exists
- **Subscription/Payment** — Only "Free plan" text, no Stripe integration
- **Settings** — Empty placeholder page

---

## 6. Security Findings

### CRITICAL

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| S1 | Flashcard cards can be created/modified by any authenticated user without ownership check | `apps/backend/src/flashcards/flashcards.service.ts` (createCard, updateCard) | Data corruption, academic sabotage, injection of malicious content into other users' sets |
| S2 | Exam submission does not verify exam ownership — any user can submit attempts and infer correct answers | `apps/backend/src/exams/exams.service.ts` (submitAttempt) | Score pollution, answer extraction via brute-force submission |

### HIGH

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| S3 | Cookie missing Secure flag in non-production (staging) | `apps/backend/src/auth/auth.controller.ts` (COOKIE_OPTIONS) | Token interceptable via MITM on staging |
| S4 | Chat message content has no MaxLength — enables prompt injection + cost exhaustion | `apps/backend/src/chat/dto/send-message.dto.ts` | Unbounded LLM token spend, prompt injection |
| S5 | CORS origin is single string — no multi-origin support | `apps/backend/src/main.ts` | Developers tempted to use `*` in prod |
| S6 | Login/register responses expose full Supabase user/session internals | `apps/backend/src/auth/auth.service.ts` | Leaks app_metadata, identities, provider tokens |
| S7 | No rate limit on AI auto-generation — 4 calls per upload, no user budget | `apps/backend/src/documents/document-processor.service.ts` | Unbounded AI API costs |
| S8 | No CSRF protection for cookie-based auth on state-changing endpoints | `apps/backend/src/main.ts` (no CSRF middleware) | Cross-site request forgery on all POST/PATCH/DELETE |

### MEDIUM

| # | Issue | Location |
|---|-------|----------|
| S9 | SubmitExamDto AnswerEntryDto has no validation decorators | `apps/backend/src/exams/dto/submit-exam.dto.ts` |
| S10 | TimeoutInterceptor, AiErrorFilter, LoggingInterceptor never registered | `apps/backend/src/common/` |
| S11 | Chat streaming uses conflicting @Sse + @Post decorators | `apps/backend/src/chat/chat.controller.ts` |
| S12 | In-memory concurrency limiter ineffective in multi-instance | `apps/backend/src/documents/document-processor.service.ts` |
| S13 | No pagination on list endpoints — unbounded data retrieval | All service list methods |
| S14 | Password minimum length is 6 (weak) | `apps/backend/src/auth/dto/register.dto.ts` |
| S15 | AllExceptionsFilter may leak internals in HttpException responses | `apps/backend/src/common/filters/all-exceptions.filter.ts` |
| S16 | Supabase service key used for all operations — bypasses RLS | `apps/backend/src/supabase/supabase.service.ts` |

---

## 7. Performance Findings

### CRITICAL

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| P1 | Waterfall API requests on /sessions/[id] — 5 sequential fetches | `apps/web/src/app/sessions/[id]/page.tsx` | 1-3s added latency on mobile |
| P2 | No caching layer — every navigation re-fetches from scratch | All hooks (use-sessions, use-documents, use-courses, etc.) | Loading spinners on every back-nav |
| P3 | Dashboard fires 3 parallel fetches without cache — repeated on every visit | `apps/web/src/components/dashboard/dashboard-page.tsx` | 4 round trips before content renders |

### HIGH

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| P4 | framer-motion (50kb+) imported in 12 files with no code-splitting | All page components | Landing page JS exceeds 150kb budget |
| P5 | No code-splitting — all tab components eagerly loaded | `apps/web/src/app/sessions/[id]/page.tsx` | Session page chunk inflated by unused tabs |
| P6 | Missing loading.tsx on 10/15 routes — full-page CLS | /dashboard, /flashcards, /exam, /library, /tutor, etc. | CLS > 0.1 |
| P7 | useDocuments called redundantly — double fetch of documents | `apps/web/src/app/sessions/[id]/page.tsx` | Doubled network cost + race condition |
| P8 | No debounce on chat input — rapid Enter sends duplicates | `apps/web/src/app/sessions/[id]/page.tsx` | Duplicate API calls |

### MEDIUM

| # | Issue | Location |
|---|-------|----------|
| P9 | AuthProvider initializes on public routes — blocks rendering | `apps/web/src/app/layout.tsx` |
| P10 | Document status polling (3s) never backs off — 10 docs = 200 req/min | `apps/web/src/hooks/use-documents.ts` |
| P11 | No pagination on any frontend list | All list hooks |
| P12 | No React.memo on expensive list items | Session workspace, dashboard |
| P13 | Landing page is 'use client' despite being mostly static | `apps/web/src/components/landing/landing-page.tsx` |
| P14 | Onboarding calls useSessions/useDocuments on mount — unused until step 5 | `apps/web/src/app/onboarding/page.tsx` |

---

## 8. UX Findings

### CRITICAL

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| U1 | No confirmation before exam exit — all answers lost | `apps/web/src/components/exam/exam-page.tsx` | 30+ min of work lost on misclick |
| U2 | Library delete has no confirmation — immediate irreversible | `apps/web/src/components/documents/library-page.tsx` | Accidental data destruction |
| U3 | Onboarding preferences never persisted — personalization hollow | `apps/web/src/app/onboarding/page.tsx` | Core value prop undermined |
| U4 | Flashcard rating fire-and-forget — review progress silently lost | `apps/web/src/components/flashcards/flashcards-page.tsx` | Spaced repetition corrupted |
| U5 | ProtectedRoute does not preserve returnTo URL | `apps/web/src/components/auth/protected-route.tsx` | Users lose context after re-login |

### HIGH

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| U6 | No skip-to-content link, no aria-label on main | `apps/web/src/components/layout/app-layout.tsx` | WCAG 2.4.1 violation |
| U7 | Tutor chat input/send button have no accessible labels | `apps/web/src/components/tutor/tutor-page.tsx` | Primary interaction inaccessible |
| U8 | Flashcard flip has no keyboard support or ARIA | `apps/web/src/components/flashcards/flashcards-page.tsx` | Keyboard users cannot use flashcards |
| U9 | 10/15 routes missing loading.tsx — blank screens during fetch | Multiple routes | Perceived as broken on slow connections |
| U10 | Library Open/Rename/Move menu items non-functional | `apps/web/src/components/documents/library-page.tsx` | Broken UI expectations |
| U11 | Exam timer never enforces timeLimit — counts up indefinitely | `apps/web/src/components/exam/exam-page.tsx` | No time-pressure practice |
| U12 | Register redirects to /dashboard, skipping onboarding | Auth store redirect logic | New users miss value demonstration |
| U13 | No error.tsx on most routes — unhandled errors show blank screen | /dashboard, /flashcards, /exam, /library, /tutor | No recovery path |
| U14 | No client-side file size validation — 50MB uploads fail after transfer | Library, dashboard, onboarding upload handlers | Wasted time and data on mobile |

### MEDIUM

| # | Issue | Location |
|---|-------|----------|
| U15 | No keyboard shortcuts for flashcard review | `flashcards-page.tsx` |
| U16 | Onboarding has no back navigation | `onboarding/page.tsx` |
| U17 | Chat has no message retry on failure | `tutor-page.tsx` |
| U18 | Workspace panel toggle has no aria-label | `workspace-page.tsx` |
| U19 | Exam answer options have no ARIA semantics | `exam-page.tsx` |
| U20 | ErrorBoundary/GlobalError lack role='alert' | `error-boundary.tsx`, `error.tsx` |
| U21 | AI generation has no cancel or timeout | `use-ai-generation.ts` |
| U22 | Settings page is empty placeholder | `settings/page.tsx` |
| U23 | No session expiry warning | `protected-route.tsx`, `api.ts` |

---

## 9. Missing States & Edge Cases

| Component | Missing State |
|-----------|--------------|
| FlashcardsPage | No aria-label on card flip or navigation buttons |
| TutorPage | No aria-label on input/send; no error state on send failure |
| WorkspacePage | No aria-label on panel toggle or mobile view toggle |
| LibraryPage | No aria-labels on grid/list toggle or action buttons |
| AudioWorkspacePage | No loading, no error, hardcoded demo data only |
| OnboardingPage | No ARIA on steps, no role=progressbar, no upload error shown |
| MindmapTab | No aria-labels on zoom controls or SVG content |
| SummaryTab | No aria on expandable/collapsible sections |
| ExamTab | No aria-labels on answer option buttons |
| FlashcardsTab (Session) | No aria on card navigation or flip |
| ErrorBoundary | No role=alert, no loading state |
| GlobalError | No role=alert |
| Card | No built-in loading skeleton, error, or empty state |
| Avatar | No alt text enforcement on AvatarImage |
| LandingPage | No loading state for images, no error boundary |
| DashboardPage | No error state for course/upload failures (toast only) |
| AppLayout | No aria-label on main, no skip-to-content |

---

## 10. Prioritized Fix List

### P0 — Fix Immediately (Security + Data Loss)

| # | Category | Issue | Effort |
|---|----------|-------|--------|
| 1 | Security | Add ownership check to flashcard create/update (S1) | 2h |
| 2 | Security | Add ownership check to exam submit (S2) | 1h |
| 3 | Security | Add MaxLength to chat message DTO (S4) | 30min |
| 4 | Security | Add CSRF protection or custom header check (S8) | 2h |
| 5 | Security | Register TimeoutInterceptor globally on AI controllers (S10) | 1h |
| 6 | UX | Add confirmation dialog before exam exit (U1) | 1h |
| 7 | UX | Add confirmation dialog before library delete (U2) | 1h |
| 8 | UX | Add error handling to flashcard difficulty PATCH (U4) | 1h |
| 9 | Security | Add validation decorators to AnswerEntryDto (S9) | 30min |
| 10 | Security | Sanitize auth response — return minimal DTO (S6) | 2h |

### P1 — Fix This Sprint (Performance + Key UX)

| # | Category | Issue | Effort |
|---|----------|-------|--------|
| 11 | Perf | Add TanStack Query — caching + parallel fetches (P1, P2, P3) | 3d |
| 12 | Perf | Code-split session workspace tabs with next/dynamic (P5) | 4h |
| 13 | Perf | Add loading.tsx skeletons for all protected routes (P6, U9) | 4h |
| 14 | Perf | Remove duplicate useDocuments on /sessions/[id] (P7) | 1h |
| 15 | Perf | Lazy-load framer-motion, use CSS for simple anims (P4) | 1d |
| 16 | UX | Preserve returnTo URL in ProtectedRoute (U5) | 1h |
| 17 | UX | Redirect register to /onboarding for new users (U12) | 2h |
| 18 | UX | Add skip-to-content + aria-label on main (U6) | 30min |
| 19 | UX | Add keyboard support + ARIA to flashcard flip (U8) | 2h |
| 20 | UX | Add aria-labels to tutor chat input/send (U7) | 30min |
| 21 | Security | Add AI generation per-user daily quota (S7) | 4h |
| 22 | Security | Increase password min length to 8 + complexity (S14) | 30min |
| 23 | UX | Add error.tsx to /dashboard, /flashcards, /exam, /library, /tutor (U13) | 2h |
| 24 | UX | Add client-side 50MB file size validation (U14) | 30min |
| 25 | Perf | Debounce chat input, disable send while in-flight (P8) | 1h |

### P2 — Fix Next Sprint (Polish + Architecture)

| # | Category | Issue | Effort |
|---|----------|-------|--------|
| 26 | Security | CORS multi-origin support (S5) | 1h |
| 27 | Security | Fix @Sse + @Post conflict on streaming endpoint (S11) | 2h |
| 28 | Perf | Move AuthProvider inside protected route group (P9) | 2h |
| 29 | Perf | Batch document status polling, add backoff (P10) | 4h |
| 30 | Perf | Add pagination to all list endpoints (backend + frontend) (P11, S13) | 2d |
| 31 | Perf | Convert landing page to RSC with small client islands (P13) | 4h |
| 32 | UX | Persist onboarding preferences to backend (U3) | 4h |
| 33 | UX | Add keyboard shortcuts to flashcard review (U15) | 2h |
| 34 | UX | Add back navigation to onboarding (U16) | 1h |
| 35 | UX | Add exam time limit enforcement + countdown (U11) | 3h |
| 36 | UX | Implement or remove library Open/Rename/Move items (U10) | 4h |
| 37 | UX | Add ARIA to exam answer options (role=radio) (U19) | 2h |
| 38 | UX | Add role=alert to ErrorBoundary/GlobalError (U20) | 30min |
| 39 | UX | Add cancel/timeout to AI generation polling (U21) | 2h |
| 40 | UX | Add session expiry warning (U23) | 3h |
| 41 | Security | Use per-request Supabase client (user JWT) for RLS (S16) | 1d |
| 42 | Security | Distributed concurrency limiter for doc processing (S12) | 4h |
| 43 | Arch | Remove duplicate /users/me endpoint | 30min |
| 44 | Arch | Fix incorrect exception types in services (NotFoundException on create) | 1h |
| 45 | Perf | React.memo on expensive list items (P12) | 2h |

---

**Total estimated effort:** ~12-15 engineering days for P0+P1, ~8-10 additional days for P2.

**Recommended sequence:** P0 security fixes first (1 day), then P1 performance (TanStack Query migration) in parallel with P1 UX fixes (3-4 days), then P2 in the following sprint.
