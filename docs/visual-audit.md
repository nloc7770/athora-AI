# Visual Content Audit — Athora

> Generated: 2026-06-26
> Updated: 2026-06-27
> Status: ✅ Complete — Assets generated and integrated
> Objective: Identify and fill every visual gap to make the application feel alive, premium, modern, and human.

---

## Executive Summary

Athora's landing page has moderate visual richness (hero images, feature screenshots, student gallery). However, the **in-app experience** (dashboard, library, flashcards, exam, tutor, workspace, onboarding, auth) is significantly under-invested visually — relying almost exclusively on small Lucide icons, text, and badges.

**Key gaps:**
- 6 pages with text-only empty states (no illustrations)
- Auth pages with zero visual identity
- Onboarding flow with minimal step illustrations
- No celebratory/success illustrations
- No error-specific illustrations
- Dashboard lacks visual warmth
- Tutor page has no AI character visual

---

## Page-by-Page Audit

---

### 1. Landing Page (`/`)

#### Current State
- Hero section with product screenshot + mascot ✅
- Feature bento grid with 6 screenshots ✅
- Student gallery with 4 lifestyle photos ✅
- Final CTA with mascot ✅

#### Missing Visual Opportunities

| Location | Gap | Priority |
|----------|-----|----------|
| Problem section | Only small Lucide icons, no illustrations | Medium |
| Stats section | Pure text metrics, no charts/graphics | Low |
| Testimonials | Text initials instead of avatars | Medium |
| Pricing section | Text-only comparison | Low |
| How It Works | JSX mockups instead of real screenshots | Medium |

---

### 2. Auth Pages (`/login`, `/register`, `/forgot-password`)

#### Current State
- Centered card with logo and form fields
- Plain background with no visual interest
- No illustrations, gradients, or imagery

#### Missing Visual Opportunities

| Location | Gap | Priority |
|----------|-----|----------|
| Left panel / background | No split-layout illustration | HIGH |
| Form area | No contextual imagery | Medium |
| Success states | No visual confirmation | Medium |
| Error states | Basic red text, no illustration | Low |

---

### 3. Onboarding Flow (`/onboarding`)

#### Current State
- Progress bar (thin purple gradient)
- Small 12px Lucide icons per step
- Dashed upload zone
- Green success state with text

#### Missing Visual Opportunities

| Location | Gap | Priority |
|----------|-----|----------|
| Step 1: Subject selection | No visual for subjects/courses | HIGH |
| Step 2: Goals | No illustration for exam/learning goals | HIGH |
| Step 3: Study preferences | No visual for study methods | HIGH |
| Step 4: Upload | Minimal upload zone, no drag animation | Medium |
| Step 5: Complete | No celebration illustration | HIGH |
| Each step background | Plain white, no contextual visuals | Medium |

---

### 4. Dashboard (`/dashboard`)

#### Current State
- Onboarding hero with basic upload zone
- Four stat cards with small colored icons
- Quick action buttons (icon only)
- Recent documents list (text + small icons)

#### Missing Visual Opportunities

| Location | Gap | Priority |
|----------|-----|----------|
| Welcome hero (first visit) | No illustration, just upload zone | HIGH |
| Empty state (no documents) | FileText icon only | HIGH |
| Stats visualization | No mini-charts or visual data | Medium |
| Quick actions | Icons lack visual warmth | Low |
| Banner area | No motivational/contextual banner | Medium |

---

### 5. Library Page (`/library`)

#### Current State
- Grid/list document cards with type icons and badges
- FolderOpen icon for empty state
- Upload progress bar
- Color-coded document types

#### Missing Visual Opportunities

| Location | Gap | Priority |
|----------|-----|----------|
| Empty state | Generic folder icon, no illustration | HIGH |
| Document cards | No thumbnail previews | Medium |
| Search empty result | No "not found" illustration | HIGH |
| Upload zone | Minimal, no visual enhancement | Medium |
| Category headers | No category-specific imagery | Low |

---

### 6. Flashcards Page (`/flashcards`)

#### Current State
- Brain icon header
- Due today banner with Clock icon
- Simple progress bars
- Text-emoji completion (🎉)
- Plain flip cards

#### Missing Visual Opportunities

| Location | Gap | Priority |
|----------|-----|----------|
| Empty state (no cards) | Layers icon only | HIGH |
| Completion/success screen | Emoji instead of illustration | HIGH |
| Mastery visualization | Simple bar, no visual system | Medium |
| Card set thumbnails | No visual per set/subject | Medium |
| Study streak | No visual streak indicator | Medium |

---

### 7. Exam Page (`/exam`)

#### Current State
- GraduationCap icon header
- List of exam cards with badges
- Active exam with progress bar
- Results with Trophy icon

#### Missing Visual Opportunities

| Location | Gap | Priority |
|----------|-----|----------|
| Empty state (no exams) | FileQuestion icon only | HIGH |
| Results/success screen | Trophy icon only, no illustration | HIGH |
| Exam completion celebration | No visual reward | HIGH |
| Subject-specific visuals | No category imagery | Medium |
| Question cards | Pure text, no type indicators | Low |

---

### 8. AI Tutor (`/tutor`)

#### Current State
- Purple circle with Sparkles icon
- Three text suggestion buttons
- Simple chat bubbles
- Bouncing dots for streaming

#### Missing Visual Opportunities

| Location | Gap | Priority |
|----------|-----|----------|
| Welcome/empty state | No AI character illustration | HIGH |
| Tutor avatar in chat | No visual avatar | HIGH |
| Suggestion cards | Plain text buttons | Medium |
| Chat empty sidebar | No illustration | Medium |
| Thinking state | Dots only, no character animation | Low |

---

### 9. Workspace Pages (`/sessions/[id]`)

#### Current State
- Skeleton placeholder lines for document
- Tab interface with icons
- Chat with basic bubbles
- Mind map with flow visualization ✅

#### Missing Visual Opportunities

| Location | Gap | Priority |
|----------|-----|----------|
| Loading state | Generic skeletons, no themed loader | Medium |
| Empty chat | No welcoming illustration | Medium |
| Generated materials preview | No visual cards | Medium |
| Audio workspace | No waveform visualization | Medium |

---

### 10. Sessions List (`/sessions`)

#### Current State
- Table with columns (name, files, status, created, updated, actions)
- Badge status indicators
- Modal for creation with file upload

#### Missing Visual Opportunities

| Location | Gap | Priority |
|----------|-----|----------|
| Empty state | Text only, no illustration | HIGH |
| Session cards | No visual preview | Medium |
| Create modal | Basic upload zone | Low |

---

### 11. Error Pages

#### Current State
- Warning icon in red circle
- Generic "Something went wrong" text

#### Missing Visual Opportunities

| Location | Gap | Priority |
|----------|-----|----------|
| 404 page | No illustration | HIGH |
| 500 error | Generic icon only | HIGH |
| Network error | No offline illustration | Medium |

---

### 12. Settings Page (`/settings`)

#### Current State
- Form-based settings
- No visual identity

#### Missing Visual Opportunities

| Location | Gap | Priority |
|----------|-----|----------|
| Profile section header | No avatar/banner | Low |
| Account section | Text-only | Low |

---

## Priority Matrix

### Critical (Must Have) — 15 images

1. Auth page illustration (login/register split panel)
2. Onboarding step 1 illustration (subject selection)
3. Onboarding step 2 illustration (goals)
4. Onboarding step 3 illustration (study preferences)
5. Onboarding completion celebration
6. Dashboard welcome hero (first visit)
7. Dashboard empty state
8. Library empty state
9. Library search no results
10. Flashcards empty state
11. Flashcards completion/success
12. Exam empty state
13. Exam results/celebration
14. AI Tutor welcome illustration
15. Sessions empty state

### High (Should Have) — 8 images

16. Error 404 illustration
17. Error 500 illustration
18. AI Tutor avatar
19. Onboarding upload step illustration
20. Dashboard motivational banner
21. Landing testimonial avatars (set of 6)
22. Landing problem section illustration
23. Landing how-it-works screenshots (3)

### Medium (Nice to Have) — 10 images

24. Document type thumbnails (PDF, audio, video, notes)
25. Course category illustrations (4)
26. Study streak visualization
27. Flashcard mastery badge set
28. Workspace loading illustration
29. Audio waveform graphic
30. Upload success illustration
31. Network/offline error illustration
32. Exam subject illustrations (4)
33. Quick action illustrations (4)

---

## Design Direction

**Style:** Modern, clean, soft 3D illustration with subtle gradients
**Palette:** Purple primary (oklch 0.55 0.25 295), teal accent, warm neutrals
**Mood:** Approachable, focused, empowering
**Diversity:** Inclusive representation across gender, ethnicity, age
**Consistency:** Same illustrative language across all assets
**Format:** WebP for production, PNG fallback

---

## Next Steps

1. Set `IMAGE_API_KEY` environment variable
2. Generate HIGH priority images first (15 critical assets)
3. Optimize and import into components
4. Verify responsive rendering and dark mode
5. Proceed to SHOULD HAVE tier
6. Final QA pass across all pages
