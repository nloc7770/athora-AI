# Library Module — UI/UX Review

## Overview

The library module displays uploaded documents in grid/list views with type and course filters. It supports single-file upload via button click, document status polling, and a context menu with mostly non-functional actions. The module serves as the document repository but currently lacks any connection to Athora's AI study features, making it a passive file list rather than a study launchpad.

---

## Finding 1: No Sort Capability

**Location:** Lines 250-261, `filteredDocuments` useMemo

**Problem:** No sort option anywhere. Documents render in API-returned order with no user control. `filteredDocuments` only filters, never sorts.

**Impact:** Students cannot find most recent uploads, largest files, or alphabetical order quickly. Becomes painful past 20+ documents.

**Solution:** Add sort dropdown (Date added, Name A-Z, Size, Last modified) next to view toggle. Apply `Array.sort()` in useMemo before returning filtered results.

**Priority:** P1 | **Complexity:** S

---

## Finding 2: No Drag-and-Drop Upload

**Location:** Lines 319-324

**Problem:** Upload exclusively via hidden `<input type="file">` triggered by button. No drop zone on library page.

**Impact:** Drag-and-drop is the primary upload gesture on desktop. Users who drag a PDF see nothing happen — a dead interaction.

**Solution:** Wrap document area in drop zone with visual feedback (dashed border + "Drop files here" overlay on dragenter). Reuse same upload logic for dropped files.

**Priority:** P1 | **Complexity:** M

---

## Finding 3: Single-File Upload Only

**Location:** `handleFileChange` reads `e.target.files?.[0]`, input lacks `multiple` attribute, line 269

**Problem:** Only first file accepted. `uploadingDocId` is single string (line 234).

**Impact:** Students with multi-page handouts or lecture sets must upload one-at-a-time. Tedious and primitive vs batch upload in Drive/Dropbox.

**Solution:** Add `multiple` to input. Iterate FileList, track each upload in `Map<string, UploadState>`, render stacked progress list.

**Priority:** P1 | **Complexity:** M

---

## Finding 4: No Document Preview / Thumbnails

**Location:** Lines 591-593

**Problem:** Document cards show only type icon (FileText/Headphones/Video). No thumbnail, first-page preview, or inline player. "Open" menu item does nothing (no onClick).

**Impact:** In library of 30 PDFs all showing same icon, users rely entirely on filenames. Visual identification impossible.

**Solution:** Generate first-page thumbnail on upload (server-side). Show in card. For audio/video, show waveform/frame. Add Quick Preview on hover or click.

**Priority:** P1 | **Complexity:** L

---

## Finding 5: Non-Functional Menu Actions (Open, Rename, Move)

**Location:** Lines 604-606, 710-712

**Problem:** "Open", "Rename", and "Move" have no onClick handlers. Only "Delete" is wired.

**Impact:** Standard file operations are shown but broken. Erodes user trust. App feels unfinished.

**Solution:** Implement all actions or remove until functional. Minimum: "Open" navigates to viewer/session. "Rename" opens inline edit or modal. "Move" opens course picker.

**Priority:** P0 | **Complexity:** M

---

## Finding 6: No Bulk/Multi-Select Actions

**Problem:** No checkbox, long-press, or shift-click multi-select. Every action operates on single document.

**Impact:** Deleting or moving 15 documents requires 30+ clicks with confirmation each time.

**Solution:** Add selection mode (checkbox on hover or "Select" toggle). Floating action bar with "Delete selected", "Move to course", "Download". Track `selectedIds: Set<string>`.

**Priority:** P2 | **Complexity:** L

---

## Finding 7: No Favorites / Pinning

**Problem:** No mechanism to pin or favorite important documents. All documents equal visual weight.

**Impact:** Students have 2-3 active documents used daily. Without pinning, these get buried as library grows.

**Solution:** Star/pin toggle on each card. "Starred" filter or pinned section at top. Store as boolean on document model.

**Priority:** P2 | **Complexity:** M

---

## Finding 8: No "Recent" or Activity View

**Problem:** Flat list with type/course filters. No "Recently opened" or "Recently uploaded" view.

**Impact:** Most common visit pattern is "find what I just worked on." Without recency, users must remember filenames.

**Solution:** Add "Recent" tab or default sort. Track `lastAccessedAt`. Show 5 most recent in horizontal scroll section above main grid.

**Priority:** P1 | **Complexity:** M

---

## Finding 9: Course Border Color Uses Fragile String Heuristic

**Location:** Lines 81-116, `getCourseBorderColor` function

**Problem:** Matches course names against hardcoded substrings ("cs", "math", "bio", "phil"). Course model already has a `color` field that is ignored.

**Impact:** "Data Structures" gets zinc because it doesn't contain "cs". Breaks for non-English names. Won't scale.

**Solution:** Use `course.color` from API. Fall back to deterministic hash-based color from course ID. Delete `getCourseBorderColor` entirely.

**Priority:** P1 | **Complexity:** S

---

## Finding 10: Polling Continues When Tab is Hidden

**Location:** `use-documents.ts` lines 108-153, `useDocumentStatus` hook

**Problem:** Polls every 3s via `setInterval` without checking `document.visibilityState`. Interval only clears on unmount or terminal status.

**Impact:** Tab hidden for 10 minutes = 200 unnecessary API requests. Wastes bandwidth, drains battery, adds server load, may trigger rate limits.

**Solution:** Add `visibilitychange` listener. Pause when hidden, resume on focus. Alternative: switch to WebSocket/SSE for status updates.

**Priority:** P1 | **Complexity:** S

---

## Finding 11: Skeletons Lack Accessibility Attributes

**Location:** Lines 166-191, `SkeletonCard` and `SkeletonListItem`

**Problem:** No `aria-busy`, `role="status"`, or `aria-label`. Screen readers announce nothing during load.

**Impact:** Assistive technology users don't know page is loading. May assume library is empty.

**Solution:** Wrap skeleton container with `aria-busy="true"` and `role="status"`. Add `aria-label="Loading documents"` or visually-hidden live region.

**Priority:** P1 | **Complexity:** S

---

## Finding 12: Filter Buttons Missing `aria-pressed`

**Location:** Lines 384-397

**Problem:** Filter buttons toggle visual state via className but have no `aria-pressed` or `role="tablist"` semantics.

**Impact:** Screen reader users cannot determine which filter is active. WCAG 4.1.2 violation.

**Solution:** Add `aria-pressed={activeFilter === option.value}` to each filter button. Or refactor to `role="tablist"` / `role="tab"` with `aria-selected`.

**Priority:** P1 | **Complexity:** S

---

## Finding 13: Document Menu Button Invisible to Keyboard Users

**Location:** Lines 597-598, 695-696

**Problem:** MoreVertical trigger has `opacity-0 group-hover:opacity-100`. Only visible on mouse hover. Keyboard focus does not reveal it.

**Impact:** Keyboard-only users cannot see or discover the menu button. WCAG 2.4.7 Focus Visible violation.

**Solution:** Add `focus-within:opacity-100` to card or `focus:opacity-100` to button itself.

**Priority:** P1 | **Complexity:** S

---

## Finding 14: No Clear Filters / Active Filter Summary

**Problem:** When multiple filters active (type + course + search), no summary showing what's active and no "Clear all" action.

**Impact:** Users forget active filters, see fewer documents than expected, think files are missing.

**Solution:** Show dismissible filter chips below filter bar ("Type: PDF x | Course: CS101 x | Clear all") when any filter is non-default.

**Priority:** P2 | **Complexity:** S

---

## Finding 15: No Entry Point to AI Features from Library

**Problem:** Document cards show status and metadata but provide no way to access AI quiz generation, flashcards, or TTS. Only working action is Delete.

**Impact:** Library should be launchpad for study activities. Students must navigate elsewhere to use AI features with their documents. Buries Athora's core differentiation.

**Solution:** Add quick-action buttons on ready documents: "Generate Quiz", "Create Flashcards", "Listen (TTS)". Navigate to session page with document pre-selected.

**Priority:** P0 | **Complexity:** M

---

## Finding 16: Client-Side Search Won't Scale

**Location:** Lines 250-261

**Problem:** Search filters already-fetched documents array in memory. Full list fetched on mount with no pagination.

**Impact:** At 100+ documents, initial load slow and all items rendered at once. At 500+, response payload exceeds 1MB.

**Solution:** Server-side search endpoint with debounced queries (300ms). Cursor-based pagination or infinite scroll. Immediate: add react-virtual for list virtualization.

**Priority:** P2 (becomes P0 at 50+ documents) | **Complexity:** L

---

## Finding 17: No Folder/Tag Organization System

**Problem:** Only organizational axis is "Course." No folders, tags, labels, or nested hierarchy.

**Impact:** Course-level grouping too coarse. 20 documents in one course have no sub-organization option.

**Solution:** Lightweight tagging system (multi-tag per document, colored pills). Custom tag creation. Tag filter in filter bar. Simpler than nested folders, fits mobile-first.

**Priority:** P2 | **Complexity:** L

---

## Finding 18: Grid Cards Have No Minimum Height — Layout Shift

**Location:** Line 586

**Problem:** Grid cards use `flex flex-col` with no `min-h`. Variable name lengths (1 vs 2 lines from `line-clamp-2`) create uneven heights in same row.

**Impact:** Visual jaggedness. CLS as names load. Unprofessional appearance vs uniform Drive cards.

**Solution:** Add `min-h-[180px]` to Card in grid view. Ensure name area always reserves 2-line height regardless of content.

**Priority:** P2 | **Complexity:** S

---

## Finding 19: No Mobile Swipe Actions

**Problem:** On mobile, only way to access actions is tiny MoreVertical menu (opacity-0, doesn't work on touch). No swipe-to-reveal pattern.

**Impact:** Mobile-first app with no mobile-optimized interaction. Touch targets ~24x24px, below 44px WCAG minimum.

**Solution:** In list view on mobile, implement swipe-left to reveal action buttons. Make menu trigger always visible on touch. Ensure 44x44px touch targets.

**Priority:** P1 | **Complexity:** M

---

## Finding 20: Upload Error Has No Retry Action

**Location:** Lines 352-367, error banner

**Problem:** Failed upload shows only "Dismiss" button. No "Retry" option. File reference lost after input reset (line 286).

**Impact:** On mobile with slow connections, failures are common. Re-selecting file (navigating picker again) adds 10-15s friction.

**Solution:** Store failed File in ref. Show "Retry" next to Dismiss. Auto-retry once (3s delay) for network errors. Clear stored file on success or explicit dismiss.

**Priority:** P1 | **Complexity:** S

---

## Summary by Priority

| Priority | Count | Key Themes |
|----------|-------|------------|
| P0 | 2 | Non-functional actions, no AI entry point |
| P1 | 12 | Sort, upload, accessibility, mobile, polling, thumbnails |
| P2 | 6 | Bulk actions, favorites, search scaling, tags, layout |

## Top 5 Quick Wins (High Impact, Low Complexity)

1. Wire "Open" menu item — navigate to document (P0, S)
2. Use `course.color` instead of string heuristic (P1, S)
3. Add `aria-pressed` to filters + `focus:opacity-100` on menu (P1, S)
4. Add sort dropdown (P1, S)
5. Pause polling on hidden tab (P1, S)

## Implementation Priority Order

1. Finding 5 (functional menu actions) — P0, M
2. Finding 15 (AI quick-actions) — P0, M
3. Finding 9 (course color fix) — P1, S
4. Finding 11 (skeleton a11y) — P1, S
5. Finding 12 (filter a11y) — P1, S
6. Finding 13 (menu focus visibility) — P1, S
7. Finding 10 (polling optimization) — P1, S
8. Finding 20 (upload retry) — P1, S
9. Finding 1 (sort) — P1, S
10. Finding 2 (drag-and-drop) — P1, M
11. Finding 3 (multi-file upload) — P1, M
12. Finding 8 (recent view) — P1, M
13. Finding 19 (mobile swipe) — P1, M
14. Finding 4 (thumbnails) — P1, L
15. Remaining P2 items by complexity
