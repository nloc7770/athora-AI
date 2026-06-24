# Components Reference — Athora

## UI Components (`components/ui/`)

Base primitives from shadcn v4, built on `@base-ui/react`.

| Component | File | Description |
|-----------|------|-------------|
| `Button` | `ui/button.tsx` | Primary action button with CVA variants |
| `Card` | `ui/card.tsx` | Content container with ring border |
| `Badge` | `ui/badge.tsx` | Small label/tag |
| `Input` | `ui/input.tsx` | Text input field |
| `Progress` | `ui/progress.tsx` | Horizontal progress bar |
| `Tabs` | `ui/tabs.tsx` | Tabbed content switcher |
| `Dialog` | `ui/dialog.tsx` | Modal dialog |
| `DropdownMenu` | `ui/dropdown-menu.tsx` | Context menu / dropdown |
| `Sheet` | `ui/sheet.tsx` | Slide-out panel (mobile drawer) |
| `ScrollArea` | `ui/scroll-area.tsx` | Custom scrollable container |
| `Separator` | `ui/separator.tsx` | Horizontal/vertical divider |
| `Slider` | `ui/slider.tsx` | Range input slider |
| `Tooltip` | `ui/tooltip.tsx` | Hover tooltip |
| `Avatar` | `ui/avatar.tsx` | User avatar with fallback |

---

## Button

### Variants

| Variant | Appearance |
|---------|------------|
| `default` | Solid primary background |
| `outline` | Bordered, transparent background |
| `secondary` | Muted background |
| `ghost` | No border, no background until hover |
| `destructive` | Red-tinted for dangerous actions |
| `link` | Underlined text link |

### Sizes

| Size | Height | Usage |
|------|--------|-------|
| `xs` | 24px | Inline tiny actions |
| `sm` | 28px | Compact buttons |
| `default` | 32px | Standard |
| `lg` | 36px | Prominent actions |
| `icon` | 32x32 | Icon-only button |
| `icon-xs` | 24x24 | Small icon button |
| `icon-sm` | 28x28 | Medium icon button |
| `icon-lg` | 36x36 | Large icon button |

### Usage

```tsx
import { Button } from '@/components/ui/button'

<Button variant="default" size="lg">
  Start Exam <ArrowRight className="ml-2 h-4 w-4" />
</Button>

<Button variant="ghost" size="icon">
  <Menu className="h-5 w-5" />
</Button>
```

---

## Card

### Props

| Prop | Type | Default |
|------|------|---------|
| `size` | `'default' \| 'sm'` | `'default'` |
| `className` | `string` | — |

Includes sub-components: `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`.

### Usage

```tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

<Card className="border-l-4 border-l-indigo-500">
  <CardHeader>
    <CardTitle>Chapter 5</CardTitle>
  </CardHeader>
  <CardContent>
    <Progress value={68} />
  </CardContent>
</Card>
```

---

## Badge

### Variants

| Variant | Style |
|---------|-------|
| `default` | Solid primary |
| `secondary` | Muted background |
| `outline` | Bordered, no fill |

### Usage

```tsx
<Badge variant="secondary">CS 101</Badge>
<Badge variant="outline" style={{ borderColor: '#6366f1', color: '#6366f1' }}>
  MATH 201
</Badge>
```

---

## Feature Components

### DashboardPage

**Location:** `components/dashboard/dashboard-page.tsx`

Sections:
- Welcome banner (gradient card with user greeting)
- Date header + Upload button
- Continue Learning card (last document, progress bar)
- Courses grid (4-column responsive grid)
- Recent Documents list + Study Stats sidebar
- Quick Actions (4-button grid: Ask AI, Review Flashcards, Start Exam, Upload)

**Data:** Imports `courses`, `documents` from `@/data/mock`

---

### LibraryPage

**Location:** `components/documents/library-page.tsx`

Features:
- Search input with icon
- Type filter tabs (All, PDFs, Audio, Notes, Video)
- Course dropdown filter
- Grid/List view toggle
- Animated document cards with `LayoutGroup`

**Sub-components (internal):**
- `DocumentCard` — grid view card with type icon, status badge, course label
- `DocumentListItem` — compact list row
- `StatusBadge` / `StatusDot` — ready/processing/error indicators

---

### WorkspacePage

**Location:** `components/documents/workspace-page.tsx`

Features:
- Desktop: split-pane (50/50) with collapsible AI panel
- Mobile: toggle between Document and AI Professor views
- Resizable via panel toggle button

**Sub-components (internal):**
- `DocumentViewer` — simulated PDF viewer with zoom, pagination, placeholder text
- `AIProfessorPanel` — tabbed panel (Chat / Summary / Flashcards)
- `ChatMessage` — individual message bubble with markdown bold support

---

### FlashcardsPage

**Location:** `components/flashcards/flashcards-page.tsx`

Features:
- Stats bar (streak, due today, mastered)
- Course filter badges
- Progress bar
- 3D flip card (front question / back answer)
- Difficulty rating buttons (Hard / Medium / Easy)
- Navigation arrows + reset

**Animation:** `rotateY` with `perspective: 1200px` and `transformStyle: preserve-3d`

---

### ExamPage

**Location:** `components/exam/exam-page.tsx`

States: `setup` | `active`

Setup phase:
- Course selector (card grid)
- Question count slider (5–25)
- Difficulty selector (easy/medium/hard/mixed)
- Question type multi-select (multiple-choice, short-answer, true-false)
- Time limit selector (none, 15, 30, 60 min)
- Suggested weak areas badges

Active phase:
- Timer + progress bar
- Question card with answer options
- Question dot navigator
- Previous / Next / Submit buttons

---

### TutorPage

**Location:** `components/tutor/tutor-page.tsx`

States: `idle` | `listening` | `speaking`

Features:
- Course context selector (badge group)
- AI Professor avatar with animated rings (state-dependent)
- Chat message area with ScrollArea
- Suggested question cards (shown when no messages)
- Text input + send button
- Voice toggle button (large circular, pulsing)

---

### LandingPage

**Location:** `components/landing/landing-page.tsx`

Sections (top to bottom):
1. Sticky navigation (logo, links, CTA)
2. Hero (headline, subtext, CTA button, floating product preview)
3. Problem section (3 pain points with numbered steps)
4. Features bento grid (dark bg: chat, flashcards, exam cards)
5. Stats bar (2.4x faster, 89% higher grades, 1M+ cards)
6. Testimonials (featured quote + 4 smaller cards)
7. Pricing (Free vs Pro comparison)
8. Student gallery (4 portrait images)
9. Final CTA (email input + start button)
10. Footer (product, company, legal links)

---

## Design Tokens

### Colors

| Token | Tailwind Class | Hex | Usage |
|-------|---------------|-----|-------|
| Primary text | `text-zinc-900` | `#18181B` | Headings |
| Secondary text | `text-zinc-500` | `#71717A` | Descriptions |
| Muted text | `text-zinc-400` | `#A1A1AA` | Timestamps, hints |
| Accent | `text-amber-600` | `#D97706` | CTAs, highlights |
| Background | `bg-white` | `#FFFFFF` | Default page bg |
| Subtle bg | `bg-zinc-50` | `#FAFAFA` | Card backgrounds, sections |
| Dark surface | `bg-zinc-900` | `#18181B` | Dark sections, primary buttons |
| Darkest surface | `bg-zinc-950` | `#09090B` | Features section |
| Success | `text-emerald-500` | `#10B981` | Status ready, positive stats |
| Warning | `text-amber-500` | `#F59E0B` | Processing, streak |
| Error | `text-red-500` | `#EF4444` | Error status, hard difficulty |
| Indigo | `text-indigo-500` | `#6366F1` | CS course, links, active states |
| Violet | `text-violet-500` | `#8B5CF6` | Math course, audio type |

### Spacing

| Pattern | Classes | Usage |
|---------|---------|-------|
| Page padding | `p-6` | Standard page content |
| Section vertical | `py-20 md:py-28` to `py-24 md:py-32` | Landing page sections |
| Card padding | `p-4` to `p-8` | Varies by card importance |
| Component gap | `gap-3` to `gap-6` | Between related elements |
| Grid gap | `gap-4` | Card grids |

### Typography

| Element | Classes | Notes |
|---------|---------|-------|
| Hero headline | `text-5xl md:text-7xl font-bold` | Letter-spacing: -0.05em |
| Section headline | `text-3xl md:text-5xl font-bold` | Letter-spacing: -0.03em |
| Card title | `text-lg font-bold` | — |
| Body text | `text-sm` to `text-base` | Leading-relaxed for longer text |
| Label | `text-xs font-medium uppercase tracking-widest` | Section labels |
| Meta | `text-xs text-zinc-400` | Timestamps, file sizes |

### Border Radius

| Element | Class |
|---------|-------|
| Buttons | `rounded-lg` (default), `rounded-full` (pill CTAs) |
| Cards | `rounded-xl` to `rounded-3xl` |
| Badges | `rounded-full` |
| Inputs | `rounded-lg` to `rounded-xl` |
| Avatars | `rounded-full` |

### Shadows

| Usage | Classes |
|-------|---------|
| Cards on hover | `shadow-md` |
| Elevated cards | `shadow-lg` |
| Hero elements | `shadow-xl` |
| Buttons (prominent) | `shadow-lg` |
