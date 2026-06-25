# Athora Application Route Map

> Generated: 2026-06-25

## Frontend Routes

| Route | Page | Auth Required | Status |
|-------|------|---------------|--------|
| `/` | Landing/Home | No | OK (Static) |
| `/login` | Login | No | OK (Static) |
| `/register` | Register | No | OK (Static) |
| `/forgot-password` | Forgot Password | No | OK (Static) |
| `/privacy` | Privacy Policy | No | OK (Static) |
| `/terms` | Terms of Service | No | OK (Static) |
| `/dashboard` | Dashboard | Yes (ProtectedRoute) | OK (Static) |
| `/library` | Document Library | Yes (ProtectedRoute) | OK (Static) |
| `/sessions` | Study Sessions List | Yes (ProtectedRoute) | OK (Static) |
| `/sessions/[id]` | Session Detail | Yes (ProtectedRoute) | OK (Dynamic) |
| `/flashcards` | Flashcards | Yes (ProtectedRoute) | OK (Static) |
| `/exam` | Exam | Yes (ProtectedRoute) | OK (Static) |
| `/tutor` | AI Tutor | Yes (ProtectedRoute) | OK (Static) |
| `/settings` | User Settings | Yes (ProtectedRoute) | OK (Static) |

## Backend API Endpoints

No global prefix. Base URL: `http://localhost:3001`

### Health

| Method | Path | Controller | Auth |
|--------|------|------------|------|
| GET | `/health` | HealthController | No |

### Auth

| Method | Path | Controller | Auth |
|--------|------|------------|------|
| POST | `/auth/register` | AuthController | No (ThrottlerGuard) |
| POST | `/auth/login` | AuthController | No (ThrottlerGuard) |
| POST | `/auth/refresh` | AuthController | No (ThrottlerGuard) |
| POST | `/auth/forgot-password` | AuthController | No (ThrottlerGuard) |
| POST | `/auth/logout` | AuthController | Yes (SupabaseAuthGuard) |
| GET | `/auth/me` | AuthController | Yes (SupabaseAuthGuard) |

### Users

| Method | Path | Controller | Auth |
|--------|------|------------|------|
| GET | `/users/me` | UsersController | Yes (SupabaseAuthGuard) |
| PATCH | `/users/me` | UsersController | Yes (SupabaseAuthGuard) |

### Courses

| Method | Path | Controller | Auth |
|--------|------|------------|------|
| GET | `/courses` | CoursesController | Yes (SupabaseAuthGuard) |
| GET | `/courses/:id` | CoursesController | Yes (SupabaseAuthGuard) |
| POST | `/courses` | CoursesController | Yes (SupabaseAuthGuard) |
| PATCH | `/courses/:id` | CoursesController | Yes (SupabaseAuthGuard) |
| DELETE | `/courses/:id` | CoursesController | Yes (SupabaseAuthGuard) |

### Sessions

| Method | Path | Controller | Auth |
|--------|------|------------|------|
| GET | `/sessions` | SessionsController | Yes (SupabaseAuthGuard) |
| GET | `/sessions/:id` | SessionsController | Yes (SupabaseAuthGuard) |
| POST | `/sessions` | SessionsController | Yes (SupabaseAuthGuard) |
| PATCH | `/sessions/:id` | SessionsController | Yes (SupabaseAuthGuard) |
| DELETE | `/sessions/:id` | SessionsController | Yes (SupabaseAuthGuard) |
| GET | `/sessions/:id/documents` | SessionsController | Yes (SupabaseAuthGuard) |

### Documents

| Method | Path | Controller | Auth |
|--------|------|------------|------|
| GET | `/documents` | DocumentsController | Yes (SupabaseAuthGuard) |
| GET | `/documents/:id` | DocumentsController | Yes (SupabaseAuthGuard) |
| GET | `/documents/:id/status` | DocumentsController | Yes (SupabaseAuthGuard) |
| GET | `/documents/:id/url` | DocumentsController | Yes (SupabaseAuthGuard) |
| POST | `/documents` | DocumentsController | Yes (SupabaseAuthGuard) |
| POST | `/documents/upload` | DocumentsController | Yes (SupabaseAuthGuard) |
| PATCH | `/documents/:id` | DocumentsController | Yes (SupabaseAuthGuard) |
| DELETE | `/documents/:id` | DocumentsController | Yes (SupabaseAuthGuard) |

### Exams

| Method | Path | Controller | Auth |
|--------|------|------------|------|
| GET | `/exams` | ExamsController | Yes (SupabaseAuthGuard) |
| GET | `/exams/:id` | ExamsController | Yes (SupabaseAuthGuard) |
| POST | `/exams` | ExamsController | Yes (SupabaseAuthGuard) |
| POST | `/exams/:id/submit` | ExamsController | Yes (SupabaseAuthGuard) |
| GET | `/exams/:id/attempts` | ExamsController | Yes (SupabaseAuthGuard) |

### Flashcards

| Method | Path | Controller | Auth |
|--------|------|------------|------|
| GET | `/flashcards/sets` | FlashcardsController | Yes (SupabaseAuthGuard) |
| GET | `/flashcards/sets/:id` | FlashcardsController | Yes (SupabaseAuthGuard) |
| POST | `/flashcards/sets` | FlashcardsController | Yes (SupabaseAuthGuard) |
| POST | `/flashcards/sets/:id/cards` | FlashcardsController | Yes (SupabaseAuthGuard) |
| PATCH | `/flashcards/cards/:id` | FlashcardsController | Yes (SupabaseAuthGuard) |
| DELETE | `/flashcards/sets/:id` | FlashcardsController | Yes (SupabaseAuthGuard) |
| GET | `/flashcards/due` | FlashcardsController | Yes (SupabaseAuthGuard) |

### AI Generation

| Method | Path | Controller | Auth |
|--------|------|------------|------|
| POST | `/ai-generation/generate` | AiGenerationController | Yes (SupabaseAuthGuard + ThrottlerGuard) |
| POST | `/ai-generation/generate-session` | AiGenerationController | Yes (SupabaseAuthGuard + ThrottlerGuard) |
| GET | `/ai-generation/document/:documentId` | AiGenerationController | Yes (SupabaseAuthGuard) |
| GET | `/ai-generation/session/:sessionId` | AiGenerationController | Yes (SupabaseAuthGuard) |
| GET | `/ai-generation/:id` | AiGenerationController | Yes (SupabaseAuthGuard) |

### Chat

| Method | Path | Controller | Auth |
|--------|------|------------|------|
| POST | `/chat/sessions` | ChatController | Yes (SupabaseAuthGuard) |
| GET | `/chat/sessions` | ChatController | Yes (SupabaseAuthGuard) |
| GET | `/chat/sessions/:id/messages` | ChatController | Yes (SupabaseAuthGuard) |
| POST | `/chat/sessions/:id/messages` | ChatController | Yes (SupabaseAuthGuard) |
| POST | `/chat/sessions/:id/messages/stream` | ChatController | Yes (SupabaseAuthGuard) |

## Build Status

| App | Build | Live |
|-----|-------|------|
| Frontend (Next.js 15) | PASS | YES (http://localhost:3000 -> 200) |
| Backend (NestJS) | PASS | YES (http://localhost:3001/health -> 200) |

## Summary

- **14 frontend routes** (6 public, 8 protected)
- **42 backend endpoints** across 10 controllers
- Auth: Client-side `ProtectedRoute` component (no Next.js middleware)
- Backend auth: `SupabaseAuthGuard` on all protected endpoints
- Rate limiting: `ThrottlerGuard` on auth and AI generation endpoints
- Both apps building and serving successfully
