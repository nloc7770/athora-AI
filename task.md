# Sprint: Critical UX & Trust Fixes

**Sprint Goal:** Fix all dead-end user flows, add legal compliance baseline, and resolve data-loss bugs so new users can sign up, upload, and study without hitting broken paths.

**Duration:** 1 week  
**Priority:** P0 tasks are blockers. P1 tasks are high-value trust and retention fixes.

---

## P0 - Launch Blockers

### TASK-001: Wire all landing page CTA buttons to /register

**Files:**
- `/Users/locnguyen/project/athora/apps/web/src/components/landing/landing-page.tsx`

**Fix:**
1. Import `Link` from `next/link` or `useRouter` from `next/navigation`
2. Wrap the nav "Get Started" button (line 111) in `<Link href="/register">`
3. Wrap the mobile nav "Get Started" button (line 125) in `<Link href="/register">`
4. Wrap the hero "Start free" button (line 172) in `<Link href="/register">`
5. Wrap the Free plan "Get started" button (line 505) in `<Link href="/register">`
6. Wrap the Pro plan "Start 14-day free trial" button (line 532) in `<Link href="/register">`
7. Wire the final CTA email input + button (lines 603-609) into a form that submits to `/register?email={value}`

**Effort:** S

---

### TASK-002: Create privacy policy and terms of service pages + cookie consent

**Files:**
- `/Users/locnguyen/project/athora/apps/web/src/app/privacy/page.tsx` (new)
- `/Users/locnguyen/project/athora/apps/web/src/app/terms/page.tsx` (new)
- `/Users/locnguyen/project/athora/apps/web/src/components/landing/landing-page.tsx`
- `/Users/locnguyen/project/athora/apps/web/src/components/ui/cookie-consent.tsx` (new)
- `/Users/locnguyen/project/athora/apps/web/src/app/layout.tsx`
- `/Users/locnguyen/project/athora/apps/web/src/components/auth/auth-form.tsx`

**Fix:**
1. Create `/privacy` page covering: data collected, AI processing, third-party services, retention, GDPR rights, FERPA acknowledgment, deletion requests
2. Create `/terms` page covering: acceptable use, subscription terms, AI-generated content disclaimer, liability limits
3. Update footer links: Privacy -> `/privacy`, Terms -> `/terms`, Security -> `/privacy#security`
4. Add a cookie consent banner component that renders at bottom of viewport, stores consent in localStorage, renders in root layout
5. Add a required checkbox on register form: "I agree to the Terms of Service and Privacy Policy" with links

**Effort:** L

---

### TASK-003: Add error handling to file upload with retry support

**Files:**
- `/Users/locnguyen/project/athora/apps/web/src/app/sessions/[id]/page.tsx`
- `/Users/locnguyen/project/athora/apps/web/src/hooks/use-documents.ts`

**Fix:**
1. In `handleUpload` (line 197-205 of session page), wrap the upload loop in try-catch
2. On failure: show toast with error message, preserve selected files in state, do NOT call `refresh()` on error
3. Add per-file upload status tracking: `{fileName, status: 'uploading'|'done'|'error', error?: string}`
4. Show inline file list with status indicators during upload
5. Add a "Retry failed" button that re-attempts only failed files
6. In the hook, surface specific error messages (file too large, network error, auth expired)

**Effort:** M

---

### TASK-004: Fix first-time user dashboard to show upload-first experience

**Files:**
- `/Users/locnguyen/project/athora/apps/web/src/components/dashboard/dashboard-page.tsx`

**Fix:**
1. Detect first-time user: `documents.length === 0 && courses.length === 0 && !documentsLoading && !coursesLoading`
2. When detected, render a full-width onboarding hero instead of the empty course grid:
   - Large upload dropzone with text: "Drop your first PDF here to get started"
   - Subtext: "We'll generate summaries, flashcards, and practice exams automatically"
   - Accept drag-and-drop and click-to-upload
3. On successful upload, create a default session named after the file, redirect to `/sessions/{id}`
4. Skip the "create a course first" requirement entirely for onboarding uploads

**Effort:** M

---

## P1 - Trust & Retention

### TASK-005: Add error state handling to session workspace

**Files:**
- `/Users/locnguyen/project/athora/apps/web/src/app/sessions/[id]/page.tsx`

**Fix:**
1. After the `isLoading` check (line 230-240), add an error state check:
   ```tsx
   if (error) {
     return (
       <ProtectedRoute><AppLayout>
         <div className="flex h-full flex-col items-center justify-center gap-4">
           <AlertCircle className="h-10 w-10 text-red-400" />
           <p className="text-gray-700 font-medium">Failed to load session</p>
           <p className="text-sm text-gray-500">{error}</p>
           <div className="flex gap-3">
             <Button onClick={refresh}>Retry</Button>
             <Button variant="outline" onClick={() => router.push('/sessions')}>Back to sessions</Button>
           </div>
         </div>
       </AppLayout></ProtectedRoute>
     )
   }
   ```
2. The `useSession` hook already returns `error` - destructure it in line 166

**Effort:** S

---

### TASK-006: Preserve chat input on send failure

**Files:**
- `/Users/locnguyen/project/athora/apps/web/src/app/sessions/[id]/page.tsx`

**Fix:**
1. In `handleSendMessage` (lines 215-224), store the message before clearing:
   ```tsx
   const msg = chatInput
   setChatInput('')
   try {
     await sendMessage(msg)
   } catch {
     setChatInput(msg) // restore on failure
   }
   ```
2. The `useChatMessages` hook already handles the error state and removes the optimistic message - the UI just needs the input restored
3. Show a toast on failure: `useToastStore.getState().addToast('Message failed to send. Please try again.', 'error')`

**Effort:** S

---

### TASK-007: Remove or fix progress bars showing 0%

**Files:**
- `/Users/locnguyen/project/athora/apps/web/src/components/dashboard/dashboard-page.tsx`

**Fix:**
1. Find all `<Progress value={0} />` or progress indicators on the dashboard
2. Remove the progress bars entirely from course cards until real tracking is implemented
3. Replace the "Continue Learning" card with a "Recent Activity" card that shows last-accessed documents with timestamps
4. Remove any "0% complete" text - replace with document count per course: "3 documents uploaded"

**Effort:** M

---

### TASK-008: Make AI Tutor suggested questions dynamic based on user courses

**Files:**
- `/Users/locnguyen/project/athora/apps/web/src/components/tutor/tutor-page.tsx`

**Fix:**
1. Replace the hardcoded `suggestedQuestions` array (lines 29-34) with dynamic generation
2. When `activeCourse` is set, show course-relevant placeholder questions based on course name/subject
3. Fallback to generic learning questions if no courses exist: "What would you like to learn about today?", "Help me understand a concept from my notes", "Quiz me on my recent uploads"
4. Remove the disabled microphone button entirely (remove the Mic icon button with "Coming soon" tooltip)

**Effort:** S

---

### TASK-009: Add password requirements display and forgot password link

**Files:**
- `/Users/locnguyen/project/athora/apps/web/src/components/auth/auth-form.tsx`

**Fix:**
1. Below the password input (after line 96), when `mode === 'register'`, render:
   ```tsx
   <p className="text-xs text-muted-foreground">Minimum 8 characters</p>
   ```
2. Below the password input, when `mode === 'login'`, render:
   ```tsx
   <Link href="/forgot-password" className="text-xs text-primary hover:underline self-end">
     Forgot password?
   </Link>
   ```
3. Create a minimal `/forgot-password` page that accepts email and calls the Supabase password reset endpoint

**Effort:** S

---

### TASK-010: Fix inconsistent color system - standardize on semantic tokens

**Files:**
- `/Users/locnguyen/project/athora/apps/web/src/components/dashboard/dashboard-page.tsx`
- `/Users/locnguyen/project/athora/apps/web/src/components/layout/app-layout.tsx`
- `/Users/locnguyen/project/athora/apps/web/src/components/tutor/tutor-page.tsx`
- `/Users/locnguyen/project/athora/apps/web/src/components/layout/sidebar.tsx`

**Fix:**
1. In `app-layout.tsx`: replace `bg-white` with `bg-background`
2. In `sidebar.tsx`: replace `bg-white` with `bg-sidebar` or `bg-background`
3. In `dashboard-page.tsx`: replace any `indigo/violet` gradient with amber/orange brand gradient; replace raw `zinc-*` classes with `text-foreground`, `text-muted-foreground`, `bg-muted`
4. In `tutor-page.tsx`: replace `bg-white` in message bubbles with `bg-card`; use `bg-primary/text-primary-foreground` for user messages
5. Ensure all surfaces use semantic tokens from globals.css so dark mode works

**Effort:** M

---

### TASK-011: Remove FadeUp dead code wrapper or implement real animation

**Files:**
- `/Users/locnguyen/project/athora/apps/web/src/components/landing/landing-page.tsx`

**Fix:**
1. The `FadeUp` component (lines 24-30) is a no-op div wrapper
2. Either implement a real intersection-observer animation:
   ```tsx
   import { useInView } from 'framer-motion'
   function FadeUp({ children, className, delay = 0 }) {
     const ref = useRef(null)
     const isInView = useInView(ref, { once: true, margin: '-50px' })
     return (
       <div ref={ref} className={className} style={{
         opacity: isInView ? 1 : 0,
         transform: isInView ? 'translateY(0)' : 'translateY(20px)',
         transition: `opacity 0.5s ease ${delay}s, transform 0.5s ease ${delay}s`
       }}>
         {children}
       </div>
     )
   }
   ```
3. Or remove all `<FadeUp>` wrappers and leave children unwrapped (reduces DOM nesting by ~30 nodes)

**Effort:** S

---

### TASK-012: Fix unsubstantiated marketing stats

**Files:**
- `/Users/locnguyen/project/athora/apps/web/src/components/landing/landing-page.tsx`

**Fix:**
1. Line 149: Change "Helping 12,000+ students learn faster" to "Helping students learn faster" (remove specific number until verified)
2. Lines 394-398: Add asterisk to stats and a small disclaimer below: `*Based on early user surveys, [month] [year]` - OR replace with softer language: "2.4x" -> "Significantly", "89%" -> "Most students", "1M+" -> keep if verifiable from DB
3. Testimonials: Add a note `// TODO: Verify testimonials are from real users or add "Names changed" disclaimer`
4. For David Park testimonial (line 58-62): Replace with a quote about consistent study habits, not cramming

**Effort:** S

---

### TASK-013: Add mobile nav Reviews link and fix footer dead links

**Files:**
- `/Users/locnguyen/project/athora/apps/web/src/components/landing/landing-page.tsx`

**Fix:**
1. In mobile nav (lines 119-128): Add `<a href="#testimonials" className="block text-sm text-stone-700">Reviews</a>` between Pricing and the buttons
2. Footer Product links (line 633): Wire Features -> `#features`, Pricing -> `#pricing`, remove Changelog and Roadmap (or link to real pages if they exist)
3. Footer Company links (line 641): Remove dead links. Keep only "Contact" pointing to `mailto:` or a real contact page
4. Footer Legal links (line 649): Wire Privacy -> `/privacy`, Terms -> `/terms`, Security -> `/privacy#security`
5. Line 656: Replace `2024` with `{new Date().getFullYear()}`

**Effort:** S

---

### TASK-014: Add keyboard navigation to flashcards tab

**Files:**
- `/Users/locnguyen/project/athora/apps/web/src/app/sessions/[id]/_components/flashcards-tab.tsx`

**Fix:**
1. Add `tabIndex={0}` to the flashcard container
2. Add `onKeyDown` handler:
   - ArrowLeft: previous card
   - ArrowRight: next card
   - Space/Enter: flip card
3. Add `aria-label="Flashcard {current} of {total}"` and `role="region"`
4. Add `aria-live="polite"` to the card content area so screen readers announce card changes
5. Show keyboard shortcut hints below the card on desktop: "Use arrow keys to navigate, space to flip"

**Effort:** S

---

### TASK-015: Fix pricing section - add monthly/annual toggle

**Files:**
- `/Users/locnguyen/project/athora/apps/web/src/components/landing/landing-page.tsx`

**Fix:**
1. Add state: `const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')`
2. Above the pricing cards (after line 487), add a toggle:
   ```tsx
   <div className="flex items-center justify-center gap-3 mt-8">
     <span className={billingCycle === 'monthly' ? 'font-semibold' : 'text-stone-400'}>Monthly</span>
     <button onClick={() => setBillingCycle(b => b === 'monthly' ? 'yearly' : 'monthly')} className="relative h-6 w-11 rounded-full bg-amber-200">
       <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-amber-600 transition ${billingCycle === 'yearly' ? 'left-5.5' : 'left-0.5'}`} />
     </button>
     <span className={billingCycle === 'yearly' ? 'font-semibold' : 'text-stone-400'}>Yearly <span className="text-amber-600 text-xs font-medium">Save 33%</span></span>
   </div>
   ```
3. Show `$12/mo` for monthly, `$8/mo` (billed $96/year) for yearly
4. CTA button text should reflect selection: "Start monthly" or "Start yearly plan"

**Effort:** S

---

## Summary

| Priority | Count | Total Effort |
|----------|-------|--------------|
| P0       | 4     | S + L + M + M |
| P1       | 11    | S + S + M + S + S + M + S + S + S + S + S |
| **Total**| **15**| ~1 week with 2 devs |

## Execution Order

1. TASK-001 (unblocks signups immediately)
2. TASK-004 (unblocks first-time user flow)
3. TASK-003 (prevents data loss)
4. TASK-005 + TASK-006 (error resilience, can parallelize)
5. TASK-002 (legal, needs review - start early, land last)
6. TASK-007 through TASK-015 (parallelize across devs)
