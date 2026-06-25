# Accessibility Audit — Athora Web App

**Date:** 2026-06-25  
**Standard:** WCAG 2.2 (Level AA)  
**Auditor:** Senior Accessibility Specialist  

---

## Summary

| Category | Issues Found | Severity |
|----------|-------------|----------|
| Keyboard Navigation | 6 | 3 Critical, 3 High |
| ARIA Labels | 5 | 2 Critical, 3 High |
| Color Contrast | 3 | 2 High, 1 Medium |
| Focus Indicators | 4 | 2 Critical, 2 High |
| Screen Reader / Semantics | 5 | 1 Critical, 4 High |
| Skip Navigation | 1 | Critical |
| Form Labels | 3 | 1 Critical, 2 High |
| Error Announcements | 3 | 2 Critical, 1 High |
| Motion / Reduced Motion | 2 | 1 High, 1 Medium |
| Touch Targets | 4 | 2 High, 2 Medium |

**Total issues: 36**

---

## 1. Keyboard Navigation

### CRITICAL

**1.1 — Sessions page: table rows as clickable but not focusable (sessions/page.tsx:155-199)**

Table rows use `onClick` on `<tr>` elements but `<tr>` is not natively focusable. Keyboard users cannot reach or activate these rows.

```tsx
// Problem: <tr> with onClick but no keyboard support
<tr onClick={() => router.push(`/sessions/${session.id}`)} className="cursor-pointer">
```

**Fix:** Add `tabIndex={0}`, `role="link"`, `onKeyDown` handler for Enter/Space, or convert each row into a link wrapper.

---

**1.2 — Landing page: mobile menu toggle has no keyboard trap management (landing-page.tsx:130-147)**

When the mobile menu opens, focus is not moved into it and not trapped. Keyboard users can tab behind the menu into obscured content.

**Fix:** Move focus to the first menu link on open. Trap focus within the menu. Return focus to the toggle button on close.

---

**1.3 — Sessions page: custom modal not keyboard-trapped (sessions/page.tsx:209-321)**

The "Create new session" modal uses `motion.div` with `onClick` backdrop dismiss but has no focus trap. Users can tab outside the modal into background content.

**Fix:** Use a focus trap library (e.g., `@radix-ui/react-dialog` or `react-focus-lock`) or implement manual focus trapping.

---

### HIGH

**1.4 — Flashcards tab: card flip only responds to click (flashcards-tab.tsx:142-181)**

The flashcard flip button is correctly a `<button>` so it is focusable, but keyboard navigation between cards relies on separate Previous/Next buttons which is acceptable. No issue with the button itself.

**1.5 — Exam tab: "Reveal answer" is a `<button>` element without visible focus ring (exam-tab.tsx:252-256)**

The reveal/hide toggle is a bare `<button>` styled as a text link with no focus-visible styles.

**Fix:** Add `focus-visible:outline` or `focus-visible:ring` classes.

**1.6 — File upload drop zone not keyboard accessible (sessions/page.tsx:258-275)**

The drop zone uses `onClick` on a `<div>` to trigger file input, but the `<div>` is not focusable and has no keyboard event handler.

**Fix:** Add `tabIndex={0}`, `role="button"`, `onKeyDown` for Enter/Space, and appropriate ARIA label.

---

## 2. ARIA Labels

### CRITICAL

**2.1 — Landing page: mobile hamburger menu button has no accessible name (landing-page.tsx:130)**

```tsx
<button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
```

No `aria-label`, no visible text. Screen readers announce "button" with no context.

**Fix:** Add `aria-label="Open navigation menu"` or `aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}` and `aria-expanded={mobileMenuOpen}`.

---

**2.2 — Sessions page: delete buttons have no accessible names (sessions/page.tsx:187-195)**

```tsx
<Button variant="ghost" size="sm" onClick={...}>
  <Trash2 className="h-4 w-4" />
</Button>
```

Icon-only button with no `aria-label` or `sr-only` text.

**Fix:** Add `aria-label="Delete session"` or include visually-hidden text.

---

### HIGH

**2.3 — Landing page: navigation landmark has no aria-label (landing-page.tsx:109)**

```tsx
<nav className="sticky top-0 ...">
```

When multiple `<nav>` elements exist (header + footer links), each should have a distinguishing `aria-label`.

**Fix:** Add `aria-label="Main navigation"` to the header nav.

---

**2.4 — Sidebar: `<nav>` element has no aria-label (sidebar.tsx:80)**

```tsx
<nav className="flex-1 space-y-1 px-3 py-4">
```

**Fix:** Add `aria-label="Main navigation"` or `aria-label="App navigation"`.

---

**2.5 — Sidebar: close button has no accessible name (sidebar.tsx:69-76)**

The `<Button variant="ghost" size="icon">` with only an `<X>` icon lacks accessible text.

**Fix:** Add `aria-label="Close sidebar"`.

---

## 3. Color Contrast

### HIGH

**3.1 — Landing page: stone-400 text on stone-50 background (landing-page.tsx:243, 276, 368, etc.)**

`text-stone-400` (#a8a29e) on `bg-stone-50` (#fafaf9) yields approximately 2.7:1 contrast ratio. WCAG AA requires 4.5:1 for normal text.

Affected elements: section labels ("The problem", "How it works", "Features"), stats footnote text.

**Fix:** Use `text-stone-500` (#78716c) minimum, which yields ~4.6:1.

---

**3.2 — Landing page: stone-500 text on stone-900 background in features section (landing-page.tsx:368)**

`text-stone-500` (#78716c) on `bg-stone-900` (#1c1917) yields approximately 3.8:1 — fails AA for small text.

**Fix:** Use `text-stone-400` (#a8a29e) on dark backgrounds for body text (yields ~5.6:1).

---

### MEDIUM

**3.3 — Sessions page: gray-400 placeholder and helper text**

`text-gray-400` for table empty states and helper text may fall below 4.5:1 depending on exact background. Verify against the actual rendered background.

---

## 4. Focus Indicators

### CRITICAL

**4.1 — Landing page: anchor links have no visible focus style (landing-page.tsx:118-120)**

```tsx
<a href="#features" className="text-sm text-stone-500 hover:text-stone-900 transition-colors">
```

Only `hover` state is styled; no `focus-visible` ring or outline.

**Fix:** Add `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600` or equivalent.

---

**4.2 — Exam tab: option buttons rely solely on background color change for indication (exam-tab.tsx:210-248)**

Selected state is communicated only via background color, which is invisible to keyboard-only users who rely on focus rings.

**Fix:** Ensure each option button shows a clear focus-visible indicator distinct from selection state.

---

### HIGH

**4.3 — Sessions page: table row click targets have no focus indicator**

Since rows are not focusable, there is no focus indicator at all. Once keyboard access is added, ensure a visible focus ring.

---

**4.4 — Landing page: testimonial scroll buttons have custom border styling but no dedicated focus style (landing-page.tsx:449-463)**

The chevron buttons have `border border-stone-200` styling and hover states, but no explicit `focus-visible` ring.

**Fix:** Add `focus-visible:ring-2 focus-visible:ring-amber-500`.

---

## 5. Screen Reader / Semantic HTML

### CRITICAL

**5.1 — No skip navigation link anywhere in the app**

Neither the landing page nor the app layout provides a "Skip to main content" link. Keyboard and screen reader users must tab through the entire navigation on every page.

**Fix:** Add a visually-hidden skip link as the first focusable element:

```tsx
<a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:bg-white focus:px-4 focus:py-2 focus:rounded-md focus:shadow-lg">
  Skip to main content
</a>
```

Add `id="main-content"` to the `<main>` element.

---

### HIGH

**5.2 — Sessions page: no heading hierarchy within the create modal (sessions/page.tsx:226)**

The modal heading uses `<h2>` but is not in a `<dialog>` or element with `role="dialog"` and `aria-labelledby`.

**Fix:** Add `role="dialog"`, `aria-modal="true"`, and `aria-labelledby` referencing the heading ID.

---

**5.3 — Landing page: sections lack `aria-labelledby` connecting headings (landing-page.tsx)**

Multiple `<section>` elements have headings but no `aria-labelledby` linking them. While not strictly required, this improves landmark navigation.

**Fix:** Add `id` to section headings and `aria-labelledby` to their parent `<section>`.

---

**5.4 — Flashcards tab: progress bar has no accessible semantics (flashcards-tab.tsx:133-137)**

```tsx
<div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
  <div className="h-full rounded-full bg-indigo-500" style={{ width: `${...}%` }} />
</div>
```

No `role="progressbar"`, no `aria-valuenow`, `aria-valuemin`, `aria-valuemax`.

**Fix:** Add `role="progressbar"` with `aria-valuenow={currentIndex + 1}`, `aria-valuemin={1}`, `aria-valuemax={totalCards}`, and `aria-label="Flashcard progress"`.

---

**5.5 — Exam tab: score result not announced to screen readers (exam-tab.tsx:169-181)**

When the user submits all answers, the score card appears but is not announced.

**Fix:** Add `aria-live="polite"` to the score card container or use `role="alert"`.

---

## 6. Skip Navigation

### CRITICAL

**6.1 — No skip navigation link exists**

See item 5.1 above. This is the single most impactful accessibility fix for keyboard users.

---

## 7. Form Labels

### CRITICAL

**7.1 — Landing page: CTA email input has no associated label (landing-page.tsx:633-639)**

```tsx
<Input type="email" name="email" placeholder="you@university.edu" ... />
```

Placeholder is not a substitute for a label. No `<label>`, no `aria-label`.

**Fix:** Add `aria-label="Email address"` or a visually-hidden `<label>`.

---

### HIGH

**7.2 — Sessions page: search input has no associated label (sessions/page.tsx:117-122)**

```tsx
<Input placeholder="Search by session name" ... />
```

No `<label>` or `aria-label`. The decorative Search icon is not accessible text.

**Fix:** Add `aria-label="Search sessions"` to the Input.

---

**7.3 — Sessions page: modal form labels not connected via htmlFor (sessions/page.tsx:233-250)**

```tsx
<label className="text-sm font-medium text-gray-700">Session name *</label>
<Input ... />
```

The `<label>` elements are missing `htmlFor` attributes and Inputs are missing matching `id` attributes.

**Fix:** Add `htmlFor="session-name"` to label and `id="session-name"` to Input. Repeat for description and file upload.

---

## 8. Error Announcements

### CRITICAL

**8.1 — Auth form: error message not announced to screen readers (auth-form.tsx:62-65)**

```tsx
<div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
  {error}
</div>
```

Error appears visually but has no `role="alert"` or `aria-live="assertive"`. Screen reader users won't know authentication failed.

**Fix:** Add `role="alert"` to the error container.

---

**8.2 — Sessions page: upload progress not announced (sessions/page.tsx:299-303)**

Progress status text updates ("Uploading file 1/3...") are not in a live region.

**Fix:** Add `aria-live="polite"` to the progress container.

---

### HIGH

**8.3 — Flashcards/Exam tab: failure states not announced (flashcards-tab.tsx:80-94, exam-tab.tsx:100-115)**

"Generation failed" messages appear visually but are not in a live region.

**Fix:** Wrap error states in `role="alert"` or `aria-live="assertive"`.

---

## 9. Motion / Reduced Motion

### HIGH

**9.1 — Landing page: FadeUp animation ignores prefers-reduced-motion (landing-page.tsx:26-43)**

The `FadeUp` component applies `translateY` and opacity transitions unconditionally via inline styles. Users who have `prefers-reduced-motion: reduce` set in their OS preferences still see all animations.

**Fix:** Check `window.matchMedia('(prefers-reduced-motion: reduce)')` or use framer-motion's `useReducedMotion` hook, and skip transforms when reduced motion is preferred:

```tsx
import { useReducedMotion } from 'framer-motion'

function FadeUp({ children, className, delay = 0 }) {
  const shouldReduce = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })

  return (
    <div
      ref={ref}
      className={className}
      style={shouldReduce ? {} : {
        opacity: isInView ? 1 : 0,
        transform: isInView ? 'translateY(0px)' : 'translateY(20px)',
        transition: `opacity 0.6s ... ${delay}s, transform 0.6s ... ${delay}s`,
      }}
    >
      {children}
    </div>
  )
}
```

---

### MEDIUM

**9.2 — Flashcards tab: 3D card flip animation has no reduced-motion alternative (flashcards-tab.tsx:148-149)**

The `rotateY(180deg)` flip with 500ms duration may cause discomfort for motion-sensitive users.

**Fix:** When `prefers-reduced-motion: reduce`, replace the flip with an instant show/hide or a simple opacity crossfade.

---

## 10. Touch Targets

### HIGH

**10.1 — Landing page: testimonial scroll buttons are 36x36px (h-9 w-9) (landing-page.tsx:449-463)**

WCAG 2.2 SC 2.5.8 Target Size (Minimum) requires 24x24px minimum, but recommends 44x44px for mobile. At 36px these pass the minimum but fail the enhanced criterion on mobile.

**Fix:** Increase to `h-11 w-11` (44px) or add sufficient spacing (24px+) from adjacent targets.

---

**10.2 — Sessions page: file remove buttons are undersized (sessions/page.tsx:289)**

```tsx
<button onClick={() => removeFile(i)} className="text-gray-400 hover:text-red-500">
  <X className="h-4 w-4" />
</button>
```

The button has no explicit dimensions. The tap target is only the 16px icon size.

**Fix:** Add `min-h-[44px] min-w-[44px]` or wrap with appropriate padding.

---

### MEDIUM

**10.3 — Sidebar: navigation links are py-2 (32px height) (sidebar.tsx:86-97)**

At `py-2` with `text-sm`, the rendered height is approximately 36px. Acceptable on desktop but tight for mobile touch.

**Fix:** Increase to `py-2.5` or `py-3` for mobile viewports.

---

**10.4 — Exam tab: "Reveal answer" text button has minimal tap area (exam-tab.tsx:252-256)**

Small text-only button with no padding beyond its content.

**Fix:** Add `py-2 px-3` minimum or ensure the touch area is at least 44x44px.

---

## Priority Remediation Plan

### Phase 1 — Critical (ship-blocking)

1. Add skip navigation link to app layout and landing page
2. Add `aria-label` to mobile menu toggle button
3. Add `role="alert"` to auth form error messages
4. Add labels/`aria-label` to CTA email input and search input
5. Fix focus trapping in sessions create modal
6. Connect modal labels with `htmlFor`/`id`
7. Add `aria-label` to delete session buttons
8. Make table rows keyboard-accessible

### Phase 2 — High (fix within sprint)

1. Add `aria-label` to all `<nav>` elements
2. Add focus-visible styles to all anchor links and custom buttons
3. Fix color contrast for `text-stone-400` on light backgrounds
4. Add `role="progressbar"` to flashcards progress bar
5. Add `aria-live` to upload progress and generation failure states
6. Respect `prefers-reduced-motion` in FadeUp component
7. Make file upload drop zone keyboard-accessible
8. Increase touch targets to 44px minimum on mobile

### Phase 3 — Medium (next iteration)

1. Add `aria-labelledby` to section landmarks
2. Add reduced-motion alternative for flashcard flip
3. Verify gray-400 text contrast across all backgrounds
4. Increase sidebar nav link heights for mobile

---

## Notes

- Full WCAG 2.2 AA compliance requires manual testing with assistive technologies (NVDA, VoiceOver, JAWS) and expert accessibility review beyond this static code audit.
- The `<Dialog>` component from Radix UI (used in the delete confirmation) likely handles focus trapping and ARIA correctly if configured with proper props — verify at runtime.
- The `<Button>` and `<Input>` UI components should be checked at the design system level for baseline focus styles.
