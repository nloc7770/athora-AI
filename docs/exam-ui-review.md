# Exam Module — UI/UX Review

## Overview

The exam module provides a paginated quiz-taking interface (`exam-page.tsx`, 614 lines) and a session-embedded variant (`exam-tab.tsx`, 287 lines). Both implement independent quiz logic with different UX patterns, data shapes, and type safety levels.

---

## Finding 1: Answer Options Lack Keyboard Semantics and ARIA Roles

**Location:** `exam-page.tsx` lines 367-406

**Problem:** Answer options are rendered as `<Card>` with `onClick` but no `role="button"`, `tabIndex`, or keyboard event handler. Users cannot select answers with Enter/Space.

**Impact:** Keyboard-only users are completely blocked from answering questions. WCAG 2.1 Level A violation (2.1.1 Keyboard).

**Solution:** Replace `<Card onClick>` with `<button>` elements styled as cards, or add `role="radio"`, `aria-checked`, `tabIndex={0}`, and `onKeyDown` handlers. Wrap the option group in `role="radiogroup"` with `aria-labelledby` pointing to the question text.

**Priority:** P0 | **Complexity:** S

---

## Finding 2: Timer Counts Up But Never Enforces Time Limit

**Location:** `exam-page.tsx` lines 66-69, `use-exams.ts` line 11

**Problem:** `elapsedSeconds` increments upward. The `timeLimit` field is rendered as a badge in list view but never enforced during active exam.

**Impact:** Students see "15 min" on the card, start the exam, and can take unlimited time. Defeats the purpose of timed practice.

**Solution:** Implement countdown timer when `exam.timeLimit` is set. Add visual warnings at 50%, 25%, and 5% remaining. Auto-submit with 10-second warning modal at expiry.

**Priority:** P0 | **Complexity:** M

---

## Finding 3: useExams Error State Is Silently Swallowed

**Location:** `exam-page.tsx` line 60

**Problem:** Hook destructures `refresh` but ignores `error`. API failures show "No exams available" empty state instead of an error message.

**Impact:** Network failures masquerade as "no data." No retry mechanism offered.

**Solution:** Destructure `error` from `useExams()`. Render distinct error state with retry button between loading and empty-state checks.

**Priority:** P1 | **Complexity:** S

---

## Finding 4: Submit Button Only Appears After All Questions Answered

**Location:** `exam-page.tsx` line 446

**Problem:** Submit button conditionally renders only when `answeredCount === questionCount`.

**Impact:** Users cannot submit partial attempts. No indication a submit button will eventually appear. Users may think exam is broken on long quizzes.

**Solution:** Always show Submit button. If not all questions answered, show badge "X unanswered" and confirmation dialog before submission.

**Priority:** P1 | **Complexity:** S

---

## Finding 5: Question Dots Unusable at Scale (50+ Questions)

**Location:** Lines 410-425

**Problem:** One 2.5x2.5 dot per question in flex-wrap container. At 50 questions, multiple rows of indistinguishable dots. Touch targets (10px) far below 44px WCAG minimum.

**Impact:** Navigation is impossible at scale. Cannot identify unanswered questions quickly.

**Solution:** Replace dots with numbered grid (5-10 per row) using 32x32px touch targets. Color-code: gray = unanswered, blue = current, green = answered. Collapsible drawer on mobile.

**Priority:** P1 | **Complexity:** M

---

## Finding 6: No Feedback on Answer Selection

**Location:** Lines 105-109

**Problem:** Answer selection updates state and styling but provides no micro-interaction (no animation, haptic, or sound cue).

**Impact:** In high-stress exam context, users need immediate confirmation tap registered. Styling change alone may not be perceived on mobile.

**Solution:** Add `scale(0.98) -> scale(1)` spring animation via framer-motion `whileTap`. Subtle checkmark appear animation on selected option's letter circle.

**Priority:** P2 | **Complexity:** S

---

## Finding 7: No Progress Persistence or Recovery

**Location:** Lines 83-92

**Problem:** `beforeunload` handler warns about close, but all exam state lives in React state. Tab crash, battery death, or force-close loses all progress.

**Impact:** For 50-question exam taking 30+ minutes, losing all progress is devastating. Especially likely on mobile.

**Solution:** Persist `{ answers, currentQuestion, elapsedSeconds, selectedExamId }` to `sessionStorage` on every answer change. On mount, check for existing progress and offer "Resume exam?" dialog.

**Priority:** P1 | **Complexity:** M

---

## Finding 8: Duplicated Quiz Logic Between ExamPage and ExamTab

**Location:** `exam-page.tsx` (614 lines) and `exam-tab.tsx` (287 lines)

**Problem:** Both implement quiz-taking logic independently with different UX patterns, styling, and data shapes. ExamTab uses `any[]` types and has field access inconsistency (`q.correctAnswer` vs `q.correct_answer`).

**Impact:** Bug fixes must be applied twice. Inconsistent user experience. Type safety absent in ExamTab.

**Solution:** Extract shared `QuizEngine` hook handling answer selection, scoring, and state transitions. Create shared presentational components (`QuestionCard`, `OptionButton`, `ScoreCard`).

**Priority:** P1 | **Complexity:** L

---

## Finding 9: Results View Lacks Educational Value

**Location:** Lines 548-588

**Problem:** Results show only correct/incorrect icons with correct answer text. Original question text not shown. No explanation of why an answer is correct.

**Impact:** Missed learning opportunity. Students cannot review what they got wrong in context.

**Solution:** Render full question text, all options (highlighting user's pick and correct answer), and AI-generated explanation. Add "Review Mistakes Only" filter button.

**Priority:** P1 | **Complexity:** M

---

## Finding 10: No Keyboard Shortcuts for Question Navigation

**Problem:** No keyboard shortcuts for arrow keys, number keys, or accelerators during active exam.

**Impact:** Power users must tab through multiple elements. Every second counts during timed exam.

**Solution:** Add global key listeners: Left/Right arrows for prev/next, 1-4/A-D for option selection, Enter to submit. Show subtle keyboard shortcut hint on desktop.

**Priority:** P2 | **Complexity:** S

---

## Finding 11: Fixed max-w-3xl Layout Ignores Mobile and Wide Screens

**Location:** Lines 201, 290, 519

**Problem:** All exam states use `max-w-3xl` (768px) with `px-4`. On mobile (320px) this leaves 288px for content. On desktop (1440px+), 60% is wasted.

**Impact:** Long options wrap awkwardly on phones. Desktop feels like stretched mobile app.

**Solution:** Use responsive max-width: `max-w-lg md:max-w-2xl lg:max-w-3xl xl:max-w-4xl`. On desktop, consider split layout with question map sidebar.

**Priority:** P2 | **Complexity:** M

---

## Finding 12: Exam Cards in List View Lack Historical Context

**Location:** Lines 237-277

**Problem:** Exam list shows only name, question count, difficulty, and time limit. No indication of previous attempts, best score, or attempt count.

**Impact:** Students cannot prioritize which exams to retake. `useExamAttempts` hook exists but is unused in list view.

**Solution:** Fetch attempt history. Display last score badge, attempt count, progress indicator. Sort low-score exams first as "Needs Review."

**Priority:** P2 | **Complexity:** M

---

## Finding 13: No Network Error Handling During Active Exam Submit

**Location:** Lines 124-150, 428-430

**Problem:** Submit errors display simple red box with no retry button. Timer already stopped. Network drop after 30 minutes means total progress loss.

**Impact:** No recovery path except refreshing page (which loses all state).

**Solution:** On submit failure: keep timer paused, show retry button, implement exponential backoff auto-retry (3 attempts). Persist answers to sessionStorage.

**Priority:** P1 | **Complexity:** S

---

## Finding 14: ExamTab Uses `any` Types Throughout

**Location:** `exam-tab.tsx` lines 23, 70, 197

**Problem:** `generations` typed as `any[]`. Dual field access pattern (`correctAnswer` vs `correct_answer`) suggests unclear API contract.

**Impact:** No compile-time safety. Backend changes silently break UI at runtime.

**Solution:** Define proper `ExamGeneration` and `GeneratedQuestion` interfaces. Normalize API response in fetch layer. Remove all `any` types. Add Zod schema for runtime validation.

**Priority:** P2 | **Complexity:** M

---

## Finding 15: No Celebration or Emotional Payoff on Completion

**Location:** Lines 512-608

**Problem:** Static Trophy icon and "Exam Complete" text regardless of score. No animation, no confetti, no differentiated response.

**Impact:** Highest-emotion moment gets flat, clinical response. Fails to reward effort.

**Solution:** Score-conditional celebrations: 90%+ gets confetti + gold trophy + "Outstanding!". 70-89% gets green checkmark + encouragement. Below 70% gets supportive "Keep going" with suggestions. Animated score counter.

**Priority:** P2 | **Complexity:** M

---

## Finding 16: ExamTab Shows All Questions on One Scroll Page

**Location:** `exam-tab.tsx` lines 196-273

**Problem:** All questions rendered in single scrollable list. 30-question exam shows 30+ cards simultaneously.

**Impact:** Cognitive overload. Research shows one-at-a-time presentation improves focus and reduces test anxiety.

**Solution:** Add toggle: "Focus Mode" (one at a time) vs "Overview Mode" (scrollable). Default to Focus Mode for 10+ questions.

**Priority:** P2 | **Complexity:** M

---

## Finding 17: Exam List Cards Have No Loading Skeleton

**Location:** Lines 219-222

**Problem:** Centered Loader2 spinner during loading. Layout jumps from empty spinner to full card grid.

**Impact:** CLS (Cumulative Layout Shift). Users cannot predict page layout.

**Solution:** Render 3-4 skeleton cards matching exam card dimensions with pulsing placeholders.

**Priority:** P3 | **Complexity:** S

---

## Finding 18: Exit Exam Dialog Uses Non-Standard DialogClose Pattern

**Location:** Line 492

**Problem:** `<DialogClose render={<Button variant="outline" />}>` uses unusual render prop pattern. May not handle focus return properly.

**Impact:** Focus may not return to trigger element after dialog close. WCAG 2.4.3 violation.

**Solution:** Use standard `<DialogClose asChild><Button>Continue</Button></DialogClose>` pattern. Test focus return behavior.

**Priority:** P2 | **Complexity:** S

---

## Implementation Priority Order

1. Finding 1 (keyboard a11y) — P0, S
2. Finding 2 (timer enforcement) — P0, M
3. Finding 13 (submit retry) — P1, S
4. Finding 3 (error state) — P1, S
5. Finding 4 (always-visible submit) — P1, S
6. Finding 7 (progress persistence) — P1, M
7. Finding 5 (question grid) — P1, M
8. Finding 9 (rich results) — P1, M
9. Finding 8 (shared architecture) — P1, L
10. Remaining P2 items by complexity (S first)
