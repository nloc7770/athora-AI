# Project Structure

## Root Layout

```
athora/
├── apps/
│   ├── web/                    # Next.js 16 web application
│   ├── backend/                # NestJS API server
│   └── mobile/                 # React Native + Expo mobile app
├── packages/
│   └── shared/                 # Shared TypeScript types
├── docs/                       # Project documentation
├── package.json                # Workspace root config
├── pnpm-workspace.yaml         # pnpm workspace definition
├── pnpm-lock.yaml              # Dependency lockfile
├── start.sh                    # Startup script
├── .gitignore                  # Git ignore rules
└── README.md                   # Project readme
```

## Workspace Configuration

Defined in `pnpm-workspace.yaml`:

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

Root `package.json` scripts:

| Script | Description |
|--------|-------------|
| `pnpm dev` | Run all apps in parallel |
| `pnpm dev:web` | Run web app only |
| `pnpm dev:backend` | Run backend only |
| `pnpm build` | Build all packages |
| `pnpm build:web` | Build web app |
| `pnpm build:backend` | Build backend |
| `pnpm lint` | Lint all packages |

## apps/web

Next.js 16 web application with App Router.

```
apps/web/
├── src/
│   ├── app/                        # Next.js App Router pages
│   │   ├── layout.tsx              # Root layout
│   │   ├── page.tsx                # Landing page (/)
│   │   ├── globals.css             # Global styles (Tailwind)
│   │   ├── favicon.ico
│   │   ├── dashboard/
│   │   │   └── page.tsx            # Dashboard route
│   │   ├── library/
│   │   │   └── page.tsx            # Document library route
│   │   ├── flashcards/
│   │   │   └── page.tsx            # Flashcards route
│   │   ├── exam/
│   │   │   └── page.tsx            # Exam route
│   │   ├── tutor/
│   │   │   └── page.tsx            # AI Tutor route
│   │   └── workspace/
│   │       ├── page.tsx            # Document workspace
│   │       └── audio/
│   │           └── page.tsx        # Audio workspace
│   ├── components/
│   │   ├── dashboard/
│   │   │   └── dashboard-page.tsx  # Dashboard UI
│   │   ├── documents/
│   │   │   ├── library-page.tsx    # Document library UI
│   │   │   ├── workspace-page.tsx  # Document viewer/editor
│   │   │   └── audio-workspace-page.tsx  # Audio player workspace
│   │   ├── exam/
│   │   │   └── exam-page.tsx       # Exam taking UI
│   │   ├── flashcards/
│   │   │   └── flashcards-page.tsx # Flashcard review UI
│   │   ├── landing/
│   │   │   └── landing-page.tsx    # Landing/marketing page
│   │   ├── layout/
│   │   │   ├── app-layout.tsx      # Authenticated app shell
│   │   │   └── sidebar.tsx         # Navigation sidebar
│   │   ├── tutor/
│   │   │   └── tutor-page.tsx      # AI Tutor chat interface
│   │   └── ui/                     # shadcn/ui components
│   │       ├── avatar.tsx
│   │       ├── badge.tsx
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── dialog.tsx
│   │       ├── dropdown-menu.tsx
│   │       ├── input.tsx
│   │       ├── progress.tsx
│   │       ├── scroll-area.tsx
│   │       ├── separator.tsx
│   │       ├── sheet.tsx
│   │       ├── slider.tsx
│   │       ├── tabs.tsx
│   │       └── tooltip.tsx
│   ├── data/
│   │   └── mock.ts                 # Mock data for development
│   ├── lib/
│   │   └── utils.ts                # Utility functions (cn, etc.)
│   └── stores/
│       └── app-store.ts            # Zustand state management
├── public/                         # Static assets
├── components.json                 # shadcn/ui configuration
├── next.config.ts                  # Next.js configuration
├── postcss.config.mjs              # PostCSS config (Tailwind)
├── eslint.config.mjs               # ESLint configuration
├── tsconfig.json                   # TypeScript config
└── package.json
```

## apps/backend

NestJS API server with modular architecture.

```
apps/backend/
├── src/
│   ├── main.ts                         # App bootstrap (port 3001)
│   ├── app.module.ts                   # Root module
│   ├── auth/
│   │   ├── auth.module.ts              # Auth module definition
│   │   ├── auth.controller.ts          # Login/register endpoints
│   │   ├── auth.service.ts             # Auth business logic
│   │   └── dto/
│   │       ├── login.dto.ts            # Login request validation
│   │       └── register.dto.ts         # Register request validation
│   ├── users/
│   │   ├── users.module.ts
│   │   ├── users.controller.ts         # Profile endpoints
│   │   ├── users.service.ts
│   │   └── dto/
│   │       └── update-user.dto.ts
│   ├── courses/
│   │   ├── courses.module.ts
│   │   ├── courses.controller.ts       # CRUD course endpoints
│   │   ├── courses.service.ts
│   │   └── dto/
│   │       ├── create-course.dto.ts
│   │       └── update-course.dto.ts
│   ├── documents/
│   │   ├── documents.module.ts
│   │   ├── documents.controller.ts     # Upload/manage documents
│   │   ├── documents.service.ts
│   │   └── dto/
│   │       ├── create-document.dto.ts
│   │       └── update-document.dto.ts
│   ├── flashcards/
│   │   ├── flashcards.module.ts
│   │   ├── flashcards.controller.ts    # Flashcard set/card endpoints
│   │   ├── flashcards.service.ts
│   │   └── dto/
│   │       ├── create-flashcard-set.dto.ts
│   │       ├── create-flashcard.dto.ts
│   │       └── update-flashcard.dto.ts
│   ├── exams/
│   │   ├── exams.module.ts
│   │   ├── exams.controller.ts         # Exam/question/attempt endpoints
│   │   ├── exams.service.ts
│   │   └── dto/
│   │       ├── create-exam.dto.ts
│   │       └── submit-exam.dto.ts
│   ├── supabase/
│   │   ├── supabase.module.ts          # Supabase client provider
│   │   └── supabase.service.ts         # Supabase client wrapper
│   └── common/
│       ├── decorators/
│       │   └── current-user.decorator.ts  # @CurrentUser() param decorator
│       └── guards/
│           └── supabase-auth.guard.ts     # JWT auth guard
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql      # Database schema
├── test/                               # E2E tests
├── .env                                # Environment variables (local)
├── .env.example                        # Env template
├── nest-cli.json                       # NestJS CLI config
├── eslint.config.mjs                   # ESLint config
├── .prettierrc                         # Prettier config
├── tsconfig.json                       # TypeScript config
├── tsconfig.build.json                 # Build-specific TS config
└── package.json
```

## apps/mobile

React Native + Expo mobile application.

```
apps/mobile/
├── App.tsx                         # Root component
├── index.ts                        # Entry point
├── src/
│   ├── screens/
│   │   ├── index.ts                # Screen exports
│   │   ├── HomeScreen.tsx          # Dashboard/home
│   │   ├── LibraryScreen.tsx       # Document library
│   │   ├── FlashcardsScreen.tsx    # Flashcard review
│   │   ├── TutorScreen.tsx         # AI Tutor
│   │   └── ProfileScreen.tsx       # User profile
│   └── constants/
│       └── colors.ts               # Color palette
├── assets/                         # Images, fonts
├── app.json                        # Expo configuration
├── tsconfig.json                   # TypeScript config
├── .gitignore
└── package.json
```

## packages/shared

Shared TypeScript types used across web, backend, and mobile.

```
packages/shared/
├── src/
│   ├── index.ts                    # Package entry (re-exports)
│   └── types/
│       └── index.ts                # Shared interfaces and types
├── dist/                           # Compiled output
├── tsconfig.json
└── package.json
```

## How Apps Connect

### Shared Types

The `@athora/shared` package exports TypeScript interfaces used by all apps. Each app can import from it:

```typescript
import { Course, Document, Flashcard } from '@athora/shared';
```

### Workspace Scripts

The root `package.json` uses pnpm workspace filters to target specific apps:

```bash
pnpm --filter @athora/web dev      # Run web dev server
pnpm --filter @athora/backend dev  # Run backend dev server
pnpm -r --parallel run dev          # Run all in parallel
```

### Communication

- Web and Mobile communicate with the backend via REST API (port 3001)
- All apps share the same Supabase project for auth and data
- The backend acts as the single gateway to the database
