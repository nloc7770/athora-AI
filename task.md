# Sprint: Security, Performance & Production Readiness

**Sprint Goal:** Eliminate critical security vulnerabilities, fix performance blockers destroying Core Web Vitals, resolve navigation bugs, and establish baseline accessibility and SEO compliance.

**Duration:** 1 week
**Priority:** Critical = ship-blocking security/perf/bugs. High = this sprint. Medium = next sprint.

---

## Critical (fix now)

### TASK-001: Move auth tokens to httpOnly cookies
- Files: `apps/web/src/stores/auth-store.ts`, `apps/backend/src/auth/auth.controller.ts`, `apps/web/src/lib/api.ts`
- Fix: Remove `localStorage.setItem(TOKEN_KEY, token)` and `document.cookie = ...` from auth-store.ts. Add a `/auth/session` endpoint on the backend that sets `Set-Cookie: token=<jwt>; HttpOnly; Secure; SameSite=Strict; Path=/`. Update api.ts to rely on cookie-based auth (remove Authorization header injection from localStorage). Backend auth guard already reads from header — add cookie fallback via `request.cookies['athora-token']`.
- Effort: L
- Acceptance: Tokens no longer appear in `localStorage` or readable `document.cookie`. Network tab shows `Set-Cookie` with HttpOnly flag on login response. App still authenticates correctly on page refresh.

### TASK-002: Remove unsafe-eval and unsafe-inline from CSP script-src
- Files: `apps/web/next.config.ts`, create `apps/web/src/middleware.ts`
- Fix: Replace `"script-src 'self' 'unsafe-inline' 'unsafe-eval'"` with nonce-based CSP. Create middleware.ts that generates a per-request nonce via `crypto.randomUUID()`, sets it as `x-nonce` header, then reference in CSP as `script-src 'self' 'nonce-${nonce}'`. Remove `'unsafe-eval'` entirely. Keep `style-src 'self' 'unsafe-inline'` for Tailwind.
- Effort: M
- Acceptance: Response headers show nonce in script-src, no unsafe-eval, no unsafe-inline. App renders without console CSP errors. Inline scripts use the nonce attribute.

### TASK-003: Replace all img tags with next/image on landing page
- Files: `apps/web/src/components/landing/landing-page.tsx`
- Fix: Import `Image` from `next/image`. Replace every `<img src="/images/..."` with `<Image>`. Hero image: add `priority`, `sizes="(max-width: 768px) 100vw, 50vw"`, `width={800}`, `height={600}`. All below-fold images: default lazy loading with explicit width/height matching actual dimensions. Remove any inline width/height style overrides that conflict.
- Effort: M
- Acceptance: `grep -r '<img' apps/web/src/components/landing/` returns zero results. Lighthouse LCP < 3s on simulated 4G. No CLS from images.

### TASK-004: Split landing page into Server and Client components
- Files: `apps/web/src/components/landing/landing-page.tsx`, `apps/web/src/app/page.tsx`, create `apps/web/src/components/landing/mobile-menu.tsx`, `apps/web/src/components/landing/testimonials-carousel.tsx`, `apps/web/src/components/landing/cta-form.tsx`
- Fix: Remove `'use client'` from landing-page.tsx. Extract interactive parts into separate client components: (1) mobile-menu.tsx — hamburger toggle + menu overlay, (2) testimonials-carousel.tsx — horizontal scroll with buttons, (3) cta-form.tsx — email input + submit. Keep all other sections as server-rendered JSX. Replace framer-motion `useInView` with a lightweight client island using native IntersectionObserver or CSS `@starting-style`.
- Effort: L
- Acceptance: `grep "'use client'" apps/web/src/components/landing/landing-page.tsx` returns nothing. Page renders identically. JS bundle for landing route drops by >40% (verify via `next build` output or network tab).

### TASK-005: Fix dashboard "Continue learning" navigation bug
- Files: `apps/web/src/components/dashboard/dashboard-page.tsx`
- Fix: Line ~435: change `router.push(\`/sessions/${mostRecentDoc.id}\`)` to `router.push(\`/sessions/${mostRecentDoc.sessionId}\`)`. Verify the documents query returns `sessionId` on each document. If not available, add it to the select/join or route to `/documents/${mostRecentDoc.id}` instead.
- Effort: S
- Acceptance: Click "Continue learning" on dashboard with existing documents. Navigates to a valid session page (not 404). Test with multiple sessions.

---

## High (this sprint)

### TASK-006: Create robots.txt and sitemap.xml
- Files: Create `apps/web/src/app/robots.ts`, create `apps/web/src/app/sitemap.ts`
- Fix: robots.ts — disallow /dashboard, /settings, /library, /flashcards, /exam, /tutor, /sessions, /api/. Allow /. Reference sitemap URL. sitemap.ts — include /, /login, /register, /privacy, /terms with appropriate changeFrequency and priority. Use env var or hardcode `https://athora.app` as base.
- Effort: S
- Acceptance: `curl localhost:3000/robots.txt` returns valid robots directives. `curl localhost:3000/sitemap.xml` returns valid XML with all public URLs listed.

### TASK-007: Add rate limiting to chat and upload endpoints
- Files: `apps/backend/src/chat/chat.controller.ts`, `apps/backend/src/documents/documents.controller.ts`, `apps/backend/src/app.module.ts`
- Fix: Add `@Throttle({ default: { ttl: 60000, limit: 10 } })` to chat sendMessage method. Add `@Throttle({ default: { ttl: 60000, limit: 3 } })` to documents upload method. Add ThrottlerGuard as global APP_GUARD provider in app.module.ts. Add `@SkipThrottle()` to health check endpoint.
- Effort: S
- Acceptance: 11th chat message within 60s returns HTTP 429. 4th file upload within 60s returns HTTP 429. Health endpoint responds 200 regardless of rate.

### TASK-008: Add skip navigation link and fix modal focus trapping
- Files: `apps/web/src/app/layout.tsx`, `apps/web/src/app/sessions/page.tsx`, `apps/web/src/components/landing/landing-page.tsx`
- Fix: (1) Add skip link as first child in layout.tsx: `<a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:bg-white focus:px-4 focus:py-2 focus:rounded-md focus:shadow-lg">Skip to main content</a>`. Add `id="main-content"` to `<main>`. (2) Replace session create modal's motion.div with Radix Dialog or wrap with react-focus-lock. (3) Add focus trap to mobile menu: move focus to first link on open, trap within, return to toggle on close.
- Effort: M
- Acceptance: Tab from page load — first focusable element is skip link. Enter jumps to main. Create session modal traps focus (Tab cycles within). Mobile menu traps focus when open.

### TASK-009: Add aria-labels to icon-only buttons and form inputs
- Files: `apps/web/src/components/landing/landing-page.tsx`, `apps/web/src/app/sessions/page.tsx`, `apps/web/src/components/layout/sidebar.tsx`, `apps/web/src/components/auth/auth-form.tsx`
- Fix: (1) Mobile menu button: `aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}` + `aria-expanded={mobileMenuOpen}`. (2) Delete session buttons: `aria-label="Delete session"`. (3) Sidebar close button: `aria-label="Close sidebar"`. (4) Sessions search input: `aria-label="Search sessions"`. (5) CTA email input: `aria-label="Email address"`. (6) Modal form labels: add `htmlFor` to each label, matching `id` on each input. (7) Auth error div: add `role="alert"`.
- Effort: S
- Acceptance: Lighthouse accessibility audit returns zero "elements do not have accessible name" violations on landing, sessions, sidebar, and auth pages.

### TASK-010: Add OG image and JSON-LD structured data
- Files: Create `apps/web/public/og-image.png`, modify `apps/web/src/app/layout.tsx` or `apps/web/src/app/page.tsx`
- Fix: (1) Create 1200x630 branded OG image with Athora logo + tagline "Study less. Remember everything." on amber/stone background. (2) Add openGraph images array to root metadata in layout.tsx. (3) Add JSON-LD script tag in page.tsx: SoftwareApplication schema (name: Athora, applicationCategory: EducationalApplication, offers: [{price: 0, name: Free}, {price: 12, name: Pro, billingPeriod: month}]). Add Organization schema (name: Athora, url).
- Effort: M
- Acceptance: Twitter card validator shows image preview. Google Rich Results Test validates JSON-LD without errors.

### TASK-011: Make sessions table responsive for mobile
- Files: `apps/web/src/app/sessions/page.tsx`
- Fix: Below `md` breakpoint, replace 6-column table with card layout. Each card: session name (bold, truncated), file count badge, status badge, relative date. Use `hidden md:table` on table element and `md:hidden` on card container. Cards must be clickable (navigate to session) and have keyboard support (tabIndex, onKeyDown for Enter). Add `aria-label="Delete session"` to delete buttons within cards.
- Effort: M
- Acceptance: At 375px viewport width, sessions display as stacked cards with no horizontal overflow. At 1024px, table renders. Both layouts navigable via keyboard. Delete works in both views.

### TASK-012: Validate uploaded files by magic bytes
- Files: `apps/backend/src/documents/documents.controller.ts`
- Fix: After ParseFilePipe validation passes, add: `const header = file.buffer.subarray(0, 5).toString(); if (!header.startsWith('%PDF-')) { throw new BadRequestException('Invalid PDF file: content does not match PDF format'); }`. Place before calling document service.
- Effort: S
- Acceptance: Upload a .txt file renamed to .pdf — returns 400 with "Invalid PDF file" message. Upload valid PDF — succeeds normally. Upload empty file — returns 400.

---

## Medium (next sprint)

### TASK-013: Fix color contrast and unify design tokens
- Files: `apps/web/src/components/landing/landing-page.tsx`, `apps/web/src/app/sessions/page.tsx`, `apps/web/src/app/settings/page.tsx`
- Fix: (1) Replace all `text-stone-400` on light backgrounds with `text-stone-500` (4.6:1 ratio). (2) Replace `text-stone-500` on dark backgrounds (bg-stone-900) with `text-stone-400` (5.6:1 ratio). (3) Replace `gray-*` tokens in sessions page with `stone-*`. (4) Replace `zinc-*` tokens in settings page with `stone-*`. Standardize entire app on stone palette.
- Effort: S
- Acceptance: Lighthouse accessibility: zero contrast violations. `grep -r 'text-gray-\|text-zinc-\|bg-gray-\|bg-zinc-' apps/web/src/` returns zero results (excluding third-party UI components).

### TASK-014: Add per-page metadata to all public routes
- Files: `apps/web/src/app/page.tsx`, `apps/web/src/app/login/page.tsx`, `apps/web/src/app/register/page.tsx`
- Fix: Add `export const metadata: Metadata` to each. Homepage: title "Athora — AI Study Assistant | Flashcards, Quizzes & Exam Prep", description ~155 chars with CTA. Login: "Sign In — Athora". Register: "Create Account — Athora". Each with unique descriptions targeting relevant keywords.
- Effort: S
- Acceptance: View page source for each route — unique `<title>` and `<meta name="description">` tags. No route shows bare "Athora" as its only title text.

### TASK-015: Respect prefers-reduced-motion in FadeUp animations
- Files: `apps/web/src/components/landing/landing-page.tsx` (FadeUp component)
- Fix: Add check for `window.matchMedia('(prefers-reduced-motion: reduce)')` (or `useReducedMotion` from framer-motion if still imported). When reduced motion is preferred, render children immediately with no transform/opacity transition. For flashcard flip in flashcards-tab.tsx, replace rotateY with instant opacity crossfade when reduced motion active.
- Effort: S
- Acceptance: With OS "Reduce motion" enabled: landing page elements appear instantly (no slide-up). Flashcards swap content without 3D rotation. No layout shift during either behavior.

---

## Summary

| Priority | Count | Total Effort |
|----------|-------|--------------|
| Critical | 5     | L + M + M + L + S |
| High     | 7     | S + S + M + S + M + M + S |
| Medium   | 3     | S + S + S |
| **Total**| **15**| ~1 week with 2 devs |

## Execution Order

1. TASK-001 + TASK-002 (security — unblocks safe production deploy)
2. TASK-005 (critical bug — quick win)
3. TASK-003 + TASK-004 (performance — can parallelize, largest LCP/FCP impact)
4. TASK-007 + TASK-012 (backend security hardening — parallelize)
5. TASK-006 + TASK-010 (SEO foundation — parallelize)
6. TASK-008 + TASK-009 (accessibility — parallelize)
7. TASK-011 (mobile UX)
8. TASK-013 through TASK-015 (polish — next sprint or time permitting)
