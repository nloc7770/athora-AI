# Consolidated Requirements — Athora

**Source:** UX, SEO, Performance, Security, Accessibility, and Student Feedback audits (2026-06-25)

---

## Security Requirements

### SEC-01: Token storage must use httpOnly cookies [CRITICAL]
- JWT and refresh tokens stored in localStorage are vulnerable to XSS exfiltration
- Cookie set via `document.cookie` lacks `Secure` and `HttpOnly` flags
- Tokens must be set by the backend as `HttpOnly; Secure; SameSite=Strict` cookies
- Remove all client-side token/cookie manipulation from `auth-store.ts`

### SEC-02: Rotate all exposed secrets [CRITICAL]
- `.env` files contain live SUPABASE_SERVICE_KEY, AI_API_KEY, RAGFLOW_API_KEY
- Verify git history for accidental commits: `git log --all --full-history -- '*.env*'`
- Integrate secrets scanner (trufflehog or git-secrets) in CI

### SEC-03: Remove unsafe-eval and unsafe-inline from CSP script-src [HIGH]
- Current CSP: `script-src 'self' 'unsafe-inline' 'unsafe-eval'` is useless for XSS mitigation
- Replace with nonce-based CSP using Next.js built-in nonce support
- Keep `'unsafe-inline'` only in `style-src` if needed

### SEC-04: Validate uploaded files by magic bytes [HIGH]
- FileTypeValidator only checks MIME type header (trivially spoofed)
- Validate first 4 bytes are `%PDF` for PDF uploads
- Consider ClamAV or equivalent scanner for production

### SEC-05: Rate-limit chat and upload endpoints [HIGH]
- Chat endpoint has no per-endpoint throttle; 30 req/min of LLM streaming drains AI budget
- Upload endpoint allows 1.5GB/min of storage writes at global throttle ceiling
- Add strict per-endpoint limits (chat: 10/min, upload: 3/min)
- Implement per-user daily AI token budget

### SEC-06: Apply ThrottlerGuard globally [MEDIUM]
- Most controllers lack explicit throttle decorators
- Add ThrottlerGuard as global guard; use `@SkipThrottle()` on health checks

### SEC-07: Sanitize Supabase error messages [MEDIUM]
- Raw Supabase errors returned to client enable email enumeration
- Map to generic messages ("Invalid credentials", "Registration failed")
- Log originals server-side

### SEC-08: Remove localhost from production CSP connect-src [MEDIUM]
- `http://localhost:*` allows connections to any local port
- Pin `https://*.supabase.co` to specific project URL in production

### SEC-09: Strengthen password policy to 8+ characters [LOW]
- Current minimum is 6 characters (trivially brute-forceable)
- Add complexity requirements via `@Matches` decorator

### SEC-10: Add audit logging for sensitive operations [LOW]
- No structured logging for login attempts, password resets, document deletions
- Include user ID, IP, user-agent, action type

---

## Performance Requirements

### PERF-01: Replace all img tags with next/image [CRITICAL]
- Zero usage of `next/image` across the codebase
- Hero image is 1.6MB raw PNG with no preload, no responsive sizing
- 29 images totaling 29MB in `/public/images/` with no WebP/AVIF
- Expected LCP improvement: 2-4 seconds on mobile

### PERF-02: Split landing page into Server/Client components [CRITICAL]
- Entire 685-line landing page is `'use client'` — ships all JS before first paint
- Only testimonial carousel and CTA form need client interactivity
- Expected FCP improvement: 30-50% faster

### PERF-03: Dynamic import or replace framer-motion on landing [HIGH]
- ~45KB gzipped shipped to client; only `useInView` used on landing
- Replace with native IntersectionObserver (5 lines) or dynamic import
- Expected bundle reduction: 45KB

### PERF-04: Add Cache-Control headers for static assets [HIGH]
- No caching headers configured for `/images/*` or `/_next/static/*`
- Add `public, max-age=31536000, immutable` for static paths

### PERF-05: Convert source images to WebP [MEDIUM]
- Even with next/image, smaller source files reduce server CPU on first optimization
- 40-70% size reduction available

### PERF-06: Move shadcn to devDependencies [LOW]
- CLI scaffolding tool listed as production dependency
- No runtime impact but packaging hygiene issue

---

## SEO Requirements

### SEO-01: Create robots.txt [CRITICAL]
- No robots.txt exists; authenticated pages could be indexed
- Disallow: /dashboard, /settings, /library, /flashcards, /exam, /tutor, /sessions, /api/

### SEO-02: Create sitemap.xml [CRITICAL]
- No sitemap; search engines cannot discover pages efficiently
- Include all public routes with appropriate changeFrequency and priority

### SEO-03: Add OG image for social sharing [CRITICAL]
- No `og:image` specified; social shares show blank previews
- Create 1200x630 branded image

### SEO-04: Add JSON-LD structured data [CRITICAL]
- No structured data anywhere; missing rich snippet opportunities
- Add SoftwareApplication, Organization, FAQPage schemas

### SEO-05: Add per-page metadata to all public routes [HIGH]
- Only privacy/terms export page-level metadata
- All other pages inherit generic "Athora" title

### SEO-06: Improve homepage title with keywords [HIGH]
- Current: "Athora" (no keywords)
- Target: "Athora — AI Study Assistant | Flashcards, Quizzes & Exam Prep"

### SEO-07: Improve image alt texts [MEDIUM]
- Hero alt is generic ("Athora AI workspace")
- Feature card alts use only feature titles, not descriptive sentences

### SEO-08: Create standalone /features and /pricing pages [MEDIUM]
- Anchor links don't create separate indexable URLs
- Dedicated pages capture long-tail keywords

---

## Accessibility Requirements

### A11Y-01: Add skip navigation link [CRITICAL]
- No skip-to-content link on any page
- Keyboard/screen reader users must tab through entire nav on every page

### A11Y-02: Add aria-label to mobile menu toggle [CRITICAL]
- Hamburger button has no accessible name; screen readers announce "button" only

### A11Y-03: Add role="alert" to auth form errors [CRITICAL]
- Error messages not announced to screen readers
- Add `role="alert"` or `aria-live="assertive"`

### A11Y-04: Add labels to form inputs [CRITICAL]
- CTA email input has no label or aria-label (placeholder is not a substitute)
- Search input on sessions page has no label
- Modal form labels not connected via htmlFor/id

### A11Y-05: Fix focus trapping in modals [CRITICAL]
- Create session modal has no focus trap; users tab into background content
- Mobile menu has no focus trap management

### A11Y-06: Make table rows keyboard-accessible [CRITICAL]
- Sessions table rows use onClick on `<tr>` but are not focusable
- Add tabIndex, role, onKeyDown handler

### A11Y-07: Add aria-label to icon-only buttons [CRITICAL]
- Delete session buttons (Trash2 icon) have no accessible name
- Sidebar close button has no accessible name

### A11Y-08: Add visible focus indicators to all interactive elements [HIGH]
- Anchor links on landing page have no focus-visible style
- Exam tab option buttons rely solely on background color
- Testimonial scroll buttons have no dedicated focus style

### A11Y-09: Fix color contrast violations [HIGH]
- text-stone-400 on bg-stone-50 yields 2.7:1 (needs 4.5:1)
- text-stone-500 on bg-stone-900 yields 3.8:1
- Fix: Use text-stone-500 on light, text-stone-400 on dark

### A11Y-10: Add progressbar semantics to flashcard progress [HIGH]
- Custom div-based progress bar has no role, aria-valuenow, aria-valuemin, aria-valuemax

### A11Y-11: Add aria-live to dynamic status updates [HIGH]
- Upload progress not announced
- Generation failure states not announced
- Exam score result not announced

### A11Y-12: Respect prefers-reduced-motion [HIGH]
- FadeUp animation ignores reduced motion preference
- Flashcard flip has no reduced-motion alternative

### A11Y-13: Increase touch targets to 44px minimum [HIGH]
- Testimonial scroll buttons: 36x36px
- File remove buttons: 16px icon with no padding
- "Reveal answer" button has minimal tap area

### A11Y-14: Add aria-label to nav elements [HIGH]
- Landing page nav and sidebar nav have no distinguishing aria-label

---

## UX Requirements

### UX-01: Fix dashboard navigation bug [CRITICAL]
- `mostRecentDoc.id` (document ID) used in session URL `/sessions/${id}`
- Should use `mostRecentDoc.sessionId` or route to documents

### UX-02: Make sessions table responsive [HIGH]
- 6-column table overflows on mobile (320-768px)
- Convert to card layout on mobile or hide non-essential columns

### UX-03: Add profile editing to settings page [HIGH]
- Settings is read-only; users cannot change name, email, or password
- Banner and sidebar show user name but it cannot be updated

### UX-04: Add email verification flow on registration [HIGH]
- Users redirected to dashboard immediately without verifying email
- If Supabase requires confirmation, user lands in unverified state

### UX-05: Add loading text to session workspace spinner [MEDIUM]
- Full-screen spinner with no text; users think app is broken
- Add "Loading session..." label

### UX-06: Unify color tokens across app [MEDIUM]
- Sessions uses gray-*, sidebar uses stone-*, settings uses zinc-*
- Standardize on stone-* palette

### UX-07: Add tab overflow indicator on mobile [MEDIUM]
- 6 tabs in session workspace; rightmost tabs invisible on small screens
- Add fade gradient or scroll shadow hint

### UX-08: Show error feedback when file drop is rejected [MEDIUM]
- handleFileDrop silently filters non-PDF files; no user feedback

### UX-09: Rename "Session Management" to student-friendly term [LOW]
- "Session Management" is admin terminology
- Use "Study Sets" or "My Materials"

### UX-10: Hide unimplemented nav routes [LOW]
- Library, AI Tutor, Flashcards, Exam Mode routes likely dead ends
- Creates "ghost town" feeling; hide behind feature flags

### UX-11: Pass CTA email to register page [LOW]
- Landing page email captured but register page doesn't read query params
- Users must re-type email

---

## Student Feedback Requirements

### STU-01: Implement spaced repetition algorithm [HIGH]
- Flashcards are a linear carousel; no SM-2, no Leitner, no scheduling
- Landing page promises "spaced-repetition cards" but delivers sequential browsing
- All 4 students noted this gap

### STU-02: Add progress tracking and analytics [HIGH]
- No visibility into which cards were wrong, which questions missed repeatedly
- No retention tracking over time
- Pro tier promises this feature but no implementation exists

### STU-03: Publish Terms of Service and Privacy Policy content [HIGH]
- Footer links to /privacy and /terms but pages may lack real content
- GDPR compliance, data retention, AI processing disclosures required for EU/UK

### STU-04: Support additional file formats (DOCX, PPTX) [MEDIUM]
- Upload zone only accepts PDF despite landing page claiming "any format"
- OCR in stack but no image-based entry point

### STU-05: Stream chat responses token-by-token [MEDIUM]
- Current architecture is request/response; user stares at spinner
- Modern AI UIs use SSE or WebSocket for incremental output

### STU-06: Add session organization (folders/tags/courses) [MEDIUM]
- Sessions are a flat list with search only
- Students with multiple subjects need categorization

### STU-07: Add timed exam mode [LOW]
- No countdown, no time-per-question metric
- Students need pressure simulation for realistic practice

### STU-08: Bridge design gap between landing and workspace [LOW]
- Landing page has personality (grain, editorial layout, warm palette)
- Workspace reverts to generic gray-on-white; feels like different app

### STU-09: Improve flashcard flip animation [LOW]
- No easing curve, no shadow shift, no scale bounce
- Feels flat compared to Anki or native card animations

### STU-10: Fix mind map responsiveness [LOW]
- Fixed 600px height with no mobile adaptation
- Initial zoom at 300% is disorienting; should fit content
