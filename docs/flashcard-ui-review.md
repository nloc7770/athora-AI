# Flashcards Module — UI/UX Review

## Overview

The flashcards module provides a 3D flip card UI in two independent implementations: `flashcards-page.tsx` (standalone page) and `flashcards-tab.tsx` (session-embedded). A `use-flashcards.ts` hook provides data fetching including an unused `useDueCards` hook. The module currently functions as a static card viewer rather than a spaced repetition study tool.

---

## Finding 1: No Swipe Gesture Support on Mobile

**Location:** `flashcards-page.tsx` lines 245-252, `flashcards-tab.tsx` lines 195-219

**Problem:** Card navigation relies solely on button taps (Previous/Next). No touch swipe gestures exist despite the project's "mobile first" requirement.

**Impact:** Swipe-to-navigate is the dominant interaction pattern in every competitive flashcard app (Anki, Quizlet, RemNote). Students studying one-handed on phones must reach for small buttons, breaking flow of rapid review.

**Solution:** Add horizontal swipe detection via framer-motion drag gestures or lightweight touch handler. Swipe left = next, swipe right = previous. Optional: swipe up = flip, swipe down = rate difficulty.

**Priority:** P0 | **Complexity:** M

---

## Finding 2: Difficulty Rating Immediately Advances Card (Race Condition UX)

**Location:** `flashcards-page.tsx` lines 68-80

**Problem:** `handleDifficulty` calls `handleNext()` synchronously after fire-and-forget PATCH. The moment a user taps a rating, card flips to next card's front instantly. No visual confirmation rating was saved.

**Impact:** Users see rating buttons flash before disappearing. If PATCH fails silently, user has already moved on. No feedback loop.

**Solution:** After rating, show brief (300ms) success micro-animation (checkmark or color pulse) before auto-advancing. Add optimistic state update to card's difficulty field locally.

**Priority:** P1 | **Complexity:** S

---

## Finding 3: Session FlashcardsTab Has No Difficulty Rating

**Location:** `flashcards-tab.tsx` lines 165-168, 179-182

**Problem:** Displays difficulty badge if one already exists but provides zero mechanism for user to rate a card. No Easy/Medium/Hard buttons anywhere in session tab.

**Impact:** Cards generated within sessions are a dead end for spaced repetition. Entire SRS backend useless for session-generated cards — likely the most common generation path.

**Solution:** Add same difficulty rating buttons (Easy/Medium/Hard) after flip. Wire to same PATCH endpoint. Add "Save to My Flashcards" CTA for persistent storage.

**Priority:** P0 | **Complexity:** M

---

## Finding 4: useDueCards Hook Is Dead Code — No SRS Surface Exists

**Location:** `use-flashcards.ts` lines 130-155, imported in `flashcards-page.tsx` line 14

**Problem:** `useDueCards()` fetches `/flashcards/due` but is never invoked. The entire spaced repetition value proposition has zero UI surface.

**Impact:** Core differentiator (SRS) is backend-ready but invisible. No daily review queue, no "cards due today" badge, no study habit driver. Equivalent of building Anki's algorithm but hiding the review button.

**Solution:** Add "Due Today" section at top of flashcards list. Show count badge. "Start Review" enters focused SRS mode with only due cards. Dashboard widget showing daily due count.

**Priority:** P0 | **Complexity:** L

---

## Finding 5: No Keyboard Shortcuts for Card Navigation

**Location:** Neither `flashcards-page.tsx` nor `flashcards-tab.tsx`

**Problem:** No keyboard event listeners registered. Navigation requires mouse clicks only.

**Impact:** Desktop students expect Space/Enter to flip, arrows for nav, 1/2/3 for ratings (standard Anki shortcuts). Desktop study sessions unnecessarily slow.

**Solution:** Add `useEffect` with `keydown` listener: Space/Enter = flip, ArrowLeft = prev, ArrowRight = next, 1 = Hard, 2 = Medium, 3 = Easy (active after flip). Show hint footer on desktop.

**Priority:** P1 | **Complexity:** S

---

## Finding 6: No prefers-reduced-motion Respect

**Location:** `flashcards-page.tsx` lines 192-197

**Problem:** 3D flip animation (`rotateY(180deg)`, `duration-500`) and framer-motion entrance run unconditionally. No `prefers-reduced-motion` check.

**Impact:** Users with vestibular disorders experience nausea from 3D rotations. WCAG 2.1 Level AA violation (2.3.3).

**Solution:** Add `useReducedMotion` hook. When active, replace 3D flip with instant crossfade or opacity swap. Set duration to 0 on motion variants.

**Priority:** P1 | **Complexity:** S

---

## Finding 7: No Screen Reader Announcement on Card Flip

**Location:** `flashcards-page.tsx` line 202, `flashcards-tab.tsx` line 156

**Problem:** Flip button has `aria-label`, but card state change triggers no ARIA live region announcement. Screen reader user clicks flip and hears nothing about revealed answer.

**Impact:** Blind or low-vision users cannot use flashcards. Content change is purely visual (CSS transform). WCAG 4.1.3 violation.

**Solution:** Add `aria-live="polite"` region containing current card content (front or back). Update on flip. Alternative: `aria-describedby` linking to visually-hidden element.

**Priority:** P1 | **Complexity:** S

---

## Finding 8: Duplicated Flip Card UI — No Shared Component

**Location:** `flashcards-page.tsx` lines 192-226, `flashcards-tab.tsx` lines 152-192

**Problem:** Nearly identical flip card UIs with different styling (purple vs indigo, zinc vs gray, different min-heights 260px vs 280px). Navigation also duplicated.

**Impact:** Fixes and enhancements must be applied twice. Divergence grows over time. Inconsistent styling confuses users.

**Solution:** Extract `<FlipCard>` component and `<CardNavigation>` component into `src/components/flashcards/`. Unify color scheme. Accept card data, callbacks as props.

**Priority:** P1 | **Complexity:** M

---

## Finding 9: No End-of-Deck State or Completion Celebration

**Location:** `flashcards-page.tsx` line 249

**Problem:** At last card, Next button simply disables. No completion screen, no summary, no stats, no congratulations.

**Impact:** Abrupt endings feel anticlimactic. Users don't know accuracy distribution, time spent, or whether to review again. Major missed gamification opportunity.

**Solution:** After last card rated/navigated past, show completion screen: total reviewed, difficulty distribution (pie/bar), time spent, streak count, "Review Again" / "Review Mistakes" CTAs.

**Priority:** P0 | **Complexity:** M

---

## Finding 10: No Study Streaks or Gamification

**Problem:** No streak tracking, daily goal, XP system, or mastery percentage per deck. UI is purely functional with zero motivational mechanics.

**Impact:** Without behavioral nudges, no reason to return daily. Duolingo, Quizlet, Anki all use streaks as primary retention lever. Student dropout directly correlated with lack of gamification.

**Solution:** Add: (1) daily streak counter, (2) "cards reviewed today" progress ring, (3) mastery % per deck, (4) optional daily goal setting.

**Priority:** P1 | **Complexity:** XL

---

## Finding 11: No Card Editing or Manual Card Creation

**Problem:** Entire system is AI-generation-only. No UI to manually create, edit, or delete individual cards. List view shows sets as read-only.

**Impact:** AI-generated cards are often imperfect. Students cannot correct mistakes, add mnemonics, or create cards for missed content. Users feel powerless over study material.

**Solution:** Add: (1) edit button on each card (inline editor for front/back), (2) delete with confirmation, (3) "Add Card" at deck level, (4) long-press context menu on mobile.

**Priority:** P1 | **Complexity:** L

---

## Finding 12: Progress Bar Only Shows Position, Not Mastery

**Location:** `flashcards-page.tsx` lines 184-189, `flashcards-tab.tsx` lines 144-149

**Problem:** Progress bar shows `(currentCardIndex + 1) / totalCards` — linear position only. Does not distinguish Easy (mastered) from Hard (needs repetition).

**Impact:** After one pass, bar is "full" regardless of performance. Gives false confidence. No honest learning feedback.

**Solution:** Segmented progress bar: green for Easy, amber for Medium, red for Hard, gray for unreviewed. Show mastery % alongside position counter.

**Priority:** P2 | **Complexity:** M

---

## Finding 13: Card Content Overflow Not Handled for Long Text

**Location:** Fixed `min-h-[260px]`/`min-h-[280px]` container with `p-8` padding

**Problem:** Long AI-generated answers overflow visible area with no scroll, truncation, or expansion mechanism.

**Impact:** Long answers get clipped. Users cannot read full answer. Especially problematic on mobile.

**Solution:** Add `overflow-y-auto` to card inner content. Responsive font size based on content length. "Scroll for more" indicator if content overflows.

**Priority:** P1 | **Complexity:** S

---

## Finding 14: No Shuffle / Random Order Option

**Problem:** Cards always presented in creation order (index 0 to N). No shuffle or random mode.

**Impact:** Sequential review creates order-dependent memory (serial position effect). Students memorize sequence rather than individual facts.

**Solution:** Add "Shuffle" toggle in review header. Randomize with Fisher-Yates on activation. Persist shuffle preference per session.

**Priority:** P2 | **Complexity:** S

---

## Finding 15: Fire-and-Forget PATCH with No Retry or Queue

**Location:** `flashcards-page.tsx` lines 72-78

**Problem:** `apiClient.patch()` fires without await, only `.catch()` toast. No retry queue, no offline support, no batching.

**Impact:** On flaky mobile networks, ratings silently lost. SRS algorithm gets incorrect data. User has no indication progress was lost.

**Solution:** Local queue (IndexedDB or in-memory) buffering rating PATCHes with exponential backoff retry. Subtle "syncing..." indicator. Optimistic local update.

**Priority:** P2 | **Complexity:** L

---

## Finding 16: Empty State Provides No Direct Action Path

**Location:** `flashcards-page.tsx` lines 117-121

**Problem:** Empty state shows passive message "Generate flashcards from your documents..." with no button, link, or navigation.

**Impact:** Dead-end empty states cause abandonment. User must mentally figure out multi-step navigation to create flashcards.

**Solution:** Add primary CTA "Go to Study Sessions" or "Create Flashcards" navigating to `/sessions`. Optional 3-step mini tutorial of generation flow.

**Priority:** P2 | **Complexity:** S

---

## Finding 17: No Card Count or Due Indicator on Set Cards in List View

**Location:** `flashcards-page.tsx` lines 126-149

**Problem:** Set cards show only name, date, and total count. No due count, mastery level, or last studied date.

**Impact:** Users cannot prioritize which deck to study. No urgency signals. No visible progress.

**Solution:** Add to each set card: (1) "X due" badge when cards due, (2) last studied date, (3) mastery progress bar. Use `useDueCards` data for per-set due counts.

**Priority:** P1 | **Complexity:** M

---

## Critical Path

Items 1, 3, 4, 9 form the minimum viable spaced repetition experience. Without swipe, session rating, a due-cards surface, and completion feedback, the flashcards module is a static card viewer — not a study tool. These four should be addressed as a single sprint to unlock the SRS value loop.

## Implementation Priority Order

1. Finding 1 (swipe gestures) — P0, M
2. Finding 3 (session rating) — P0, M
3. Finding 4 (SRS due surface) — P0, L
4. Finding 9 (completion state) — P0, M
5. Finding 5 (keyboard shortcuts) — P1, S
6. Finding 6 (reduced motion) — P1, S
7. Finding 7 (screen reader) — P1, S
8. Finding 13 (text overflow) — P1, S
9. Finding 2 (rating feedback) — P1, S
10. Finding 8 (shared component) — P1, M
11. Finding 17 (due indicators) — P1, M
12. Finding 11 (card editing) — P1, L
13. Finding 10 (gamification) — P1, XL
14. Remaining P2 items
