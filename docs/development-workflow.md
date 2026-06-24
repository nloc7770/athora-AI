# Development Workflow

## Git Branching Strategy

```
main (production)
 └── develop (integration)
      ├── feat/add-flashcard-review
      ├── fix/auth-token-expiry
      └── chore/upgrade-nestjs
```

### Branch naming

- `feat/<short-description>` — new features
- `fix/<short-description>` — bug fixes
- `refactor/<short-description>` — code improvements with no behavior change
- `chore/<short-description>` — tooling, deps, CI changes
- `docs/<short-description>` — documentation only

### Flow

1. Create a branch from `main` (or `develop` if you use one).
2. Make focused commits with conventional commit messages.
3. Open a PR against `main`.
4. CI passes, get review, squash-merge.

### Commit messages

```
feat: add spaced repetition scheduling to flashcards
fix: prevent duplicate course creation on rapid submit
refactor: extract Supabase client into shared module
docs: add deployment guide
test: add unit tests for exam scoring
chore: bump NestJS to v11.1
```

---

## Adding a New Feature

Example: adding a "Study Sessions" feature (tracking time spent studying).

### 1. Database schema

Create a new migration file:

```bash
# supabase/migrations/00004_study_sessions.sql
```

```sql
CREATE TABLE IF NOT EXISTS study_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER
);

ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own sessions" ON study_sessions FOR ALL USING (auth.uid() = user_id);
CREATE INDEX idx_study_sessions_user_id ON study_sessions(user_id);
```

Run via Supabase SQL Editor or `supabase db push`.

### 2. Backend module

```bash
cd apps/backend
nest generate module study-sessions
nest generate controller study-sessions
nest generate service study-sessions
```

Create DTOs, implement the service with Supabase queries, add auth guard to the controller.

### 3. Frontend integration

- Add API calls in a new file (e.g. `src/lib/api/study-sessions.ts`)
- Create the page component under `src/app/study/page.tsx`
- Add navigation link in the sidebar

### 4. Mobile (if applicable)

- Mirror the API integration with Expo-compatible fetch or the shared API client
- Add the corresponding screen and navigation

---

## Testing Approach

### Backend (NestJS + Jest)

```bash
# Run all tests
pnpm --filter @athora/backend test

# Watch mode
pnpm --filter @athora/backend test:watch

# Coverage report
pnpm --filter @athora/backend test:cov
```

Test structure:

```
apps/backend/src/
├── courses/
│   ├── courses.service.ts
│   └── courses.service.spec.ts   ← unit test
├── test/
│   └── app.e2e-spec.ts           ← integration test
```

Guidelines:
- Unit test each service method.
- Mock the Supabase client in unit tests.
- E2E tests hit actual endpoints with `supertest`.
- Target 80%+ coverage on service files.

### Web (Playwright)

```bash
cd apps/web
npx playwright test
```

- Test critical user flows: login, create course, upload document, take exam.
- Screenshot key pages at multiple breakpoints (320, 768, 1440).

### Mobile

- Use Jest for unit testing utility functions and hooks.
- Use Detox or Maestro for E2E testing if needed later.

---

## Code Style and Conventions

### TypeScript

- Strict mode enabled in all `tsconfig.json` files.
- Prefer `interface` for object shapes, `type` for unions/intersections.
- No `any` unless unavoidable (and add a comment explaining why).

### Backend (NestJS)

- One module per domain (courses, documents, flashcards, exams, users).
- DTOs use `class-validator` decorators for request validation.
- Services handle business logic; controllers handle HTTP concerns.
- Use the `@CurrentUser()` decorator to access the authenticated user.
- Guard all mutating endpoints with `SupabaseAuthGuard`.

### Web (Next.js)

- App Router with server components by default.
- Client components marked explicitly with `'use client'`.
- State management via Zustand (see `src/stores/`).
- UI primitives in `src/components/ui/` (shadcn-based).
- Feature components in `src/components/<feature>/`.

### Shared conventions

- Immutable data patterns (no in-place mutation).
- Functions under 50 lines; files under 800 lines.
- Named exports over default exports (except page components).
- Environment variables validated at startup, not scattered through code.

### Formatting and linting

```bash
# Lint all packages
pnpm lint

# Format backend
pnpm --filter @athora/backend format

# The web app uses ESLint with Next.js config
pnpm --filter @athora/web lint
```

---

## PR Checklist

Before requesting review, verify:

- [ ] Branch is up to date with `main`
- [ ] Code compiles without errors (`pnpm build`)
- [ ] Linting passes (`pnpm lint`)
- [ ] Existing tests pass
- [ ] New tests added for new functionality
- [ ] Environment variables documented if new ones added
- [ ] Database migrations included if schema changed
- [ ] No hardcoded secrets or credentials
- [ ] No `console.log` or debug statements left in
- [ ] Mobile app still builds (if touching shared code)
- [ ] PR description explains what and why, not just what files changed

### PR Description Template

```markdown
## What

Brief description of the change.

## Why

Context and motivation.

## How

Implementation approach (if non-obvious).

## Testing

- [ ] Unit tests added/updated
- [ ] Manually tested locally
- [ ] Tested on mobile (if applicable)

## Screenshots (if UI change)

Before / After
```
