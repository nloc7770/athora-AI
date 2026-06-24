# System Architecture

## Overview

Athora is an AI-powered study platform that helps students organize courses, manage documents, create flashcards, and take practice exams. The system consists of a web application, mobile application, and a NestJS backend, all backed by Supabase for database, authentication, and file storage.

## Tech Stack

### Web (`apps/web`)

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 |
| UI Library | React 19 |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 |
| Components | shadcn/ui, Base UI |
| Animation | Framer Motion |
| State | Zustand |
| Testing | Playwright (E2E) |
| Package Manager | pnpm 11.4 |

### Backend (`apps/backend`)

| Layer | Technology |
|-------|-----------|
| Framework | NestJS 11 |
| Language | TypeScript 5 |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth + Passport JWT |
| Validation | class-validator, class-transformer |
| Testing | Jest, Supertest |

### Mobile (`apps/mobile`)

| Layer | Technology |
|-------|-----------|
| Framework | React Native 0.85 + Expo 56 |
| Language | TypeScript 6 |
| UI | React 19 |

### Shared (`packages/shared`)

| Layer | Technology |
|-------|-----------|
| Language | TypeScript 5 |
| Purpose | Shared interfaces, types, constants |

## System Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Client Layer                                │
├──────────────────────────────┬──────────────────────────────────────┤
│   Web App (Next.js 16)       │   Mobile App (Expo + React Native)   │
│   localhost:3000             │   Expo Dev Client                    │
└──────────────┬───────────────┴──────────────────┬───────────────────┘
               │                                  │
               │         HTTP / REST              │
               ▼                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     NestJS API (port 3001)                           │
├─────────────────────────────────────────────────────────────────────┤
│  Modules: Auth | Courses | Documents | Flashcards | Exams | Users   │
│  Guards: SupabaseAuthGuard (JWT verification)                       │
└──────────────────────────────────┬──────────────────────────────────┘
                                   │
                                   │  Supabase JS Client
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         Supabase                                     │
├──────────────────┬──────────────────┬───────────────────────────────┤
│  PostgreSQL DB   │  Auth Service    │  Storage (file uploads)       │
│  (with RLS)      │  (JWT tokens)    │  (documents, audio, etc.)    │
└──────────────────┴──────────────────┴───────────────────────────────┘
```

## Data Flows

### Authentication Flow

```
1. Client sends credentials → POST /auth/login
2. Backend validates with Supabase Auth
3. Supabase returns JWT access token + refresh token
4. Client stores token, attaches to subsequent requests via Authorization header
5. Backend SupabaseAuthGuard verifies JWT on protected routes
6. Guard extracts user ID and attaches to request context
```

### Document Upload Flow

```
1. Client uploads file → POST /documents (multipart)
2. Backend stores file in Supabase Storage bucket
3. Backend creates document record in DB (status: 'processing')
4. External AI Service processes document (extract text, generate summaries)
5. Backend updates document status to 'ready'
6. Client can now access document content and AI-generated materials
```

### Study Session Flow

```
1. User selects a flashcard set or exam
2. Client fetches cards/questions → GET /flashcards/:setId or GET /exams/:id
3. User completes study session (reviews cards or answers questions)
4. Client submits results → PATCH /flashcards/:id or POST /exams/:id/attempts
5. Backend updates spaced repetition data (next_review, streak) or scores exam
6. Dashboard reflects updated progress
```

## Security Architecture

### Authentication

- Supabase Auth handles user registration, login, and token management
- JWTs are verified server-side using `@nestjs/passport` with a custom Supabase strategy
- `SupabaseAuthGuard` protects all authenticated endpoints
- `@CurrentUser()` decorator extracts user context from verified tokens

### Row-Level Security (RLS)

All database tables have RLS enabled. Policies ensure users can only access their own data:
- `profiles`: access limited to `auth.uid() = id`
- `courses`, `documents`, `flashcard_sets`, `exams`, `exam_attempts`: access limited to `auth.uid() = user_id`
- `flashcards`: access through parent `flashcard_sets` ownership
- `exam_questions`: access through parent `exams` ownership

### API Security

- CORS configured for allowed origins
- Input validation via `class-validator` on all DTOs
- Parameterized queries through Supabase client (no raw SQL injection risk)
- File upload size limits enforced

## Module Architecture (Backend)

```
AppModule
├── AuthModule          → login, register, JWT verification
├── UsersModule         → profile management
├── CoursesModule       → CRUD courses
├── DocumentsModule     → upload, manage documents
├── FlashcardsModule    → flashcard sets and individual cards
├── ExamsModule         → exam generation, questions, attempts
└── SupabaseModule      → shared Supabase client service
```

Each domain module follows the Controller → Service → Supabase pattern with DTOs for request validation.
