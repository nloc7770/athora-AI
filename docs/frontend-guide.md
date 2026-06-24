# Frontend Guide — Athora (Web)

## Tech Stack

| Layer | Library |
|-------|---------|
| Framework | Next.js 16 (App Router) |
| UI primitives | @base-ui/react + shadcn v4 |
| Styling | Tailwind CSS v4 |
| Animation | Framer Motion 12 |
| State | Zustand 5 |
| Icons | lucide-react |
| Package manager | pnpm 11 |

---

## Page Routes

| Route | File | Description |
|-------|------|-------------|
| `/` | `app/page.tsx` | Landing/marketing page |
| `/dashboard` | `app/dashboard/page.tsx` | Main dashboard with courses, recent docs, stats |
| `/library` | `app/library/page.tsx` | Document library with grid/list view, search, filters |
| `/tutor` | `app/tutor/page.tsx` | AI Tutor — voice + text chat interface |
| `/flashcards` | `app/flashcards/page.tsx` | Spaced-repetition flashcard review |
| `/exam` | `app/exam/page.tsx` | AI-generated exam setup and test-taking |
| `/workspace` | `app/workspace/page.tsx` | Document viewer + AI Professor panel (split view) |
| `/workspace/audio` | `app/workspace/audio/page.tsx` | Audio document workspace |

Each route page is a thin wrapper that renders `<AppLayout>` around a feature component (except the landing page which is standalone).

---

## Component Hierarchy

```
app/page.tsx
└── LandingPage (standalone, no sidebar)

app/{route}/page.tsx
└── AppLayout
    ├── Sidebar (desktop persistent, mobile overlay)
    ├── MobileHeader (sticky top bar on mobile)
    └── <main>
        └── Feature page component (DashboardPage, LibraryPage, etc.)
```

### Feature Components

| Component | Path | Role |
|-----------|------|------|
| `LandingPage` | `components/landing/landing-page.tsx` | Marketing page (hero, features, pricing, testimonials) |
| `DashboardPage` | `components/dashboard/dashboard-page.tsx` | Welcome banner, courses grid, recent docs, quick actions |
| `LibraryPage` | `components/documents/library-page.tsx` | Filterable document grid/list with search |
| `WorkspacePage` | `components/documents/workspace-page.tsx` | Split-pane: DocumentViewer + AIProfessorPanel |
| `AudioWorkspacePage` | `components/documents/audio-workspace-page.tsx` | Audio-specific workspace |
| `TutorPage` | `components/tutor/tutor-page.tsx` | Voice-first AI tutor with chat fallback |
| `FlashcardsPage` | `components/flashcards/flashcards-page.tsx` | 3D-flip flashcard review with spaced repetition |
| `ExamPage` | `components/exam/exam-page.tsx` | Exam setup (course, difficulty, time) + active quiz |

### Layout Components

| Component | Path | Role |
|-----------|------|------|
| `AppLayout` | `components/layout/app-layout.tsx` | Flex shell: Sidebar + main content |
| `Sidebar` | `components/layout/sidebar.tsx` | Navigation links, logo, AI credits meter |
| `MobileHeader` | `components/layout/sidebar.tsx` | Sticky top bar with hamburger menu (mobile only) |

---

## State Management (Zustand)

The app uses a single Zustand store at `src/stores/app-store.ts`:

```typescript
interface AppState {
  sidebarOpen: boolean           // Mobile sidebar visibility
  activeCourse: string | null    // Currently selected course ID
  activeDocument: string | null  // Currently selected document ID
  searchQuery: string            // Global search input
  setSidebarOpen: (open: boolean) => void
  setActiveCourse: (courseId: string | null) => void
  setActiveDocument: (docId: string | null) => void
  setSearchQuery: (query: string) => void
}
```

Most page-level state (filters, flipped cards, exam config) is managed via local `useState` hooks inside the feature components.

---

## Styling Approach

### Tailwind CSS v4

- Utility-first with `@tailwindcss/postcss` plugin
- No custom `tailwind.config` needed — uses CSS-first configuration
- `tw-animate-css` for extra animation utilities

### shadcn/ui v4

- Components live in `src/components/ui/`
- Built on `@base-ui/react` (Radix replacement for shadcn v4)
- Use `class-variance-authority` (CVA) for variant styling
- Utility function `cn()` from `src/lib/utils` for conditional classnames (`clsx` + `tailwind-merge`)

### Design Tokens (via Tailwind/CSS variables)

| Token | Value | Usage |
|-------|-------|-------|
| Primary text | `zinc-900` | Headings, body |
| Secondary text | `zinc-500` | Descriptions, muted |
| Accent | `amber-500/600` | CTAs, highlights, pricing badge |
| Surfaces | `white`, `zinc-50` | Cards, page backgrounds |
| Dark sections | `zinc-900`, `zinc-950` | Features section, CTA |
| Course colors | `indigo`, `violet`, `cyan`, `amber` | Per-course identity |
| Border | `zinc-200` | Card borders, separators |
| Border radius | `rounded-xl`, `rounded-2xl`, `rounded-3xl` | Cards and containers |

---

## Animation Patterns

### FadeUp (Framer Motion)

The primary entrance animation used across the app:

```tsx
function FadeUp({ children, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
    >
      {children}
    </motion.div>
  )
}
```

### Staggered Container (Dashboard)

```tsx
const container: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
}
const item: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
}
```

### Other Patterns

- **3D card flip** — flashcards use `rotateY` with `perspective` and `backfaceVisibility`
- **AnimatePresence** — used for page transitions (exam setup/active), conditional UI
- **Float/bob** — landing hero uses `animate={{ y: [0, -4, 0] }}` with infinite repeat
- **Pulsing rings** — tutor listening state uses expanding border rings
- **Layout animations** — library uses `LayoutGroup` + `layout` prop for grid/list switch

---

## Path Aliases

Configured in `tsconfig.json`:

| Alias | Maps to |
|-------|---------|
| `@/` | `src/` |

Usage: `import { Button } from '@/components/ui/button'`

---

## How to Add a New Page

1. Create route file: `src/app/<route-name>/page.tsx`
2. Create feature component: `src/components/<feature>/<feature>-page.tsx`
3. Wrap in `AppLayout` in the route file:

```tsx
"use client"

import { AppLayout } from "@/components/layout/app-layout"
import MyFeaturePage from "@/components/my-feature/my-feature-page"

export default function MyFeature() {
  return (
    <AppLayout>
      <MyFeaturePage />
    </AppLayout>
  )
}
```

4. Add navigation link in `src/components/layout/sidebar.tsx` (the `navigation` array):

```tsx
{ name: 'My Feature', href: '/my-feature', icon: SomeIcon },
```

---

## How to Add a New Component

1. **UI primitive** — use `npx shadcn@latest add <component>` or create in `src/components/ui/`
2. **Feature component** — create in `src/components/<feature>/` alongside related components
3. Mark with `'use client'` if it uses hooks, state, or browser APIs
4. Import UI primitives from `@/components/ui/`
5. Use `cn()` for conditional classnames
6. Follow existing animation patterns (FadeUp wrapper or motion.div with variants)

---

## Mock Data

All prototype data lives in `src/data/mock.ts`. Exported interfaces and arrays:

- `Course` / `courses` — 4 courses with progress, color, document counts
- `Document` / `documents` — 8 documents with types (pdf, audio, note, video), statuses
- `Flashcard` / `flashcards` — 6 cards with spaced-repetition metadata
- `Message` / `chatMessages` — pre-seeded chat conversation
- `suggestedQuestions` — AI tutor prompt suggestions
