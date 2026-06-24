# Roadmap

## Current State

The project has a working monorepo structure with three apps and a shared package:

**Done:**
- Monorepo setup with pnpm workspaces
- NestJS backend with module structure (auth, courses, documents, flashcards, exams, users)
- Supabase integration with RLS policies and JWT auth guard
- Database schema: profiles, courses, documents, flashcard sets/cards, exams/questions/attempts
- Storage buckets for documents and avatars with access policies
- Database triggers (auto-create profile on signup, updated_at timestamps)
- Next.js 16 web app with pages: landing, dashboard, library, workspace, flashcards, exam, tutor
- UI component library (shadcn-based: button, card, dialog, tabs, etc.)
- Zustand state management
- Expo mobile app scaffolding
- Dev launcher script (`start.sh`)
- Environment variable templates for all apps

**Current limitations:**
- Web app uses mock data (`src/data/mock.ts`) — not connected to real backend
- No real authentication flow wired end-to-end
- AI features (tutor, summarization) are placeholder UI only
- Mobile app is a bare Expo template, no screens built yet
- No test coverage yet
- No CI/CD pipeline

---

## Phase 1: Core Functionality

**Goal:** Wire up real data flow from frontend through backend to Supabase.

### Authentication
- [ ] Implement Supabase Auth signup/login on web (email + password)
- [ ] Add OAuth providers (Google, Apple)
- [ ] Session persistence and refresh token handling
- [ ] Protected routes on web (redirect to login if unauthenticated)
- [ ] Auth context/provider shared across the app

### CRUD Operations
- [ ] Connect web dashboard to real courses API
- [ ] Connect library page to real documents API
- [ ] Implement file upload flow (web → backend → Supabase Storage)
- [ ] Connect flashcards page to real flashcard sets/cards API
- [ ] Connect exam page to real exams API
- [ ] Remove mock data file once all pages use real data

### Backend Hardening
- [ ] Add request validation on all endpoints (DTOs are defined, wire them up)
- [ ] Add proper error responses with consistent format
- [ ] Add pagination to list endpoints
- [ ] Add rate limiting middleware
- [ ] Write unit tests for all service methods (target 80%+)
- [ ] Add E2E tests for critical flows

### Web Polish
- [ ] Loading states and skeleton UI
- [ ] Error boundaries and user-friendly error messages
- [ ] Optimistic updates for better UX
- [ ] Responsive design pass (test 320–1440px)

---

## Phase 2: AI Features

**Goal:** Add intelligent study assistance powered by an external AI service.

### AI Chat (Tutor)
- [ ] Design AI service interface (REST or WebSocket)
- [ ] Implement chat API endpoint on backend (proxies to AI service)
- [ ] Stream responses to frontend (SSE or WebSocket)
- [ ] Chat UI with message history, markdown rendering
- [ ] Context-aware: pass current document/course as context

### Document Summarization
- [ ] Upload document → trigger summarization job
- [ ] Display summary on document detail page
- [ ] Allow re-summarization with different parameters (length, focus)

### Flashcard Generation
- [ ] Generate flashcards from a document via AI
- [ ] User can review and edit generated cards before saving
- [ ] Difficulty estimation on generated cards

### Exam Generation
- [ ] Generate practice exams from course materials
- [ ] Multiple question types: multiple choice, short answer, true/false
- [ ] Explanations for correct answers

---

## Phase 3: Mobile App

**Goal:** Ship a functional mobile app on iOS and Android.

### Foundation
- [ ] Set up navigation (React Navigation or Expo Router)
- [ ] Implement auth screens (login, signup)
- [ ] Supabase client integration with secure token storage
- [ ] Shared API client between web and mobile (or via backend)

### Core Screens
- [ ] Dashboard / home screen
- [ ] Course list and detail
- [ ] Document viewer (PDF, audio player)
- [ ] Flashcard review (swipe interface)
- [ ] Exam taking interface

### Mobile-Specific
- [ ] Push notifications (Expo Notifications)
- [ ] Offline support for flashcard review
- [ ] Dark mode support
- [ ] App Store / Play Store submission via EAS

---

## Phase 4: Advanced Features

**Goal:** Differentiate with smart study scheduling and insights.

### Spaced Repetition Algorithm
- [ ] Implement SM-2 (or SM-18/FSRS) algorithm for card scheduling
- [ ] Track card performance history (ease, interval, repetitions)
- [ ] Daily review queue based on next_review timestamps
- [ ] Adaptive difficulty based on user performance

### Analytics and Insights
- [ ] Study time tracking (per course, per day)
- [ ] Flashcard performance charts (retention rate, cards due)
- [ ] Exam score history and trend visualization
- [ ] Weekly/monthly study reports

### Notifications and Reminders
- [ ] Daily study reminders (configurable time)
- [ ] "Cards due" notifications
- [ ] Exam deadline reminders
- [ ] Streak tracking and motivation nudges

### Collaboration (stretch)
- [ ] Share flashcard sets with other users
- [ ] Study groups
- [ ] Shared course notes

---

## Known Issues and TODOs

### Bugs
- None tracked yet (project is pre-launch)

### Technical Debt
- [ ] Web app entirely uses mock data — needs API integration
- [ ] No error handling on frontend API calls
- [ ] Backend has no test coverage
- [ ] No input sanitization on document names/descriptions
- [ ] TypeScript strict mode may need enforcement in some files

### Infrastructure
- [ ] Set up CI/CD pipeline (GitHub Actions)
- [ ] Add Sentry error tracking (web + mobile)
- [ ] Add analytics (PostHog or similar)
- [ ] Set up staging environment
- [ ] Database backup strategy
- [ ] Rate limiting and abuse prevention on production

### Documentation
- [ ] API documentation (Swagger/OpenAPI via NestJS)
- [ ] Architecture decision records (ADRs) for key choices
- [ ] Contributing guide for external contributors
