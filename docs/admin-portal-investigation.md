I now have all the information needed to compile the complete Admin Portal investigation report. Here is the final deliverable:

# Athora Admin Portal — Architecture & Implementation Report

## 1. ARCHITECTURE DIAGRAM

```
┌─────────────────────────────────────────┐
│                          ATHORA MONOREPO                                 │
│                        pnpm-workspace.yaml                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐  │
│  │  apps/web   │  │ apps/admin  │  │apps/backend │  │ apps/mobile  │  │
│  │  (Next.js)  │  │  (Next.js)  │  │  (NestJS)   │  │   (Expo)     │  │
│  │  Student UI │  │  Admin UI   │  │  REST API   │  │  Native App  │  │
│  │  port:3000  │  │  port:3002  │  │  port:3001  │  │              │  │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬───────┘  │
│         │                │                 │                 │          │
│         │                │      ┌──────────┴──────────┐      │          │
│         │                │      │                     │      │          │
│         │                │      │  /api/*   /admin/*  │      │          │
│         │                │      │                     │      │          │
│         └────────────────┼──────┤  SupabaseAuthGuard  │──────┘          │
│                          │      │  AdminGuard (NEW)   │                 │
│                          │      │  RolesGuard (NEW)   │                 │
│                          │      └──────────┬──────────┘                 │
│                          │                 │                            │
│  ┌───────────────────────┼─────────────────┼─────────────────────────┐  │
│  │                   packages/                                        │  │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐              │  │
│  │  │ @athora/     │ │ @athora/     │ │ @athora/     │              │  │
│  │  │ shared       │ │ api-client   │ │ ui           │              │  │
│  │  │ (types,      │ │ (fetch,      │ │ (Button,     │              │  │
│  │  │  schemas,    │ │  auth,       │ │  Card,       │              │  │
│  │  │  constants)  │ │  pagination) │ │  Dialog...)  │              │  │
│  │  └──────────────┘ └──────────────┘              │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                          INFRASTRUCTURE                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌───────────┐  │
│  │  Supabase    │  │   Redis      │  │  RAGFlow     │  │ Storage   │  │
│  │  (Postgres   │  │  (BullMQ,    │  │  (AI/RAG     │  │ (S3/      │  │
│  │   + Auth     │  │   caching,   │  │   pipeline)  │  │  Supabase │  │
│  │   + RLS)     │  │   rate-limit)│  │              │  │  buckets) │  │
│  └──────────────┘  └──────────────┘  └───────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. DATABASE DIAGRAM

```
┌─────────────────────────────────────────────┐
│                          EXISTING TABLES                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  auth.users (Supabase managed)                                               │
│       │                                                                      │
│       ├──1:1──► profiles (id, name, avatar_url, role[NEW], banned_at[NEW])   │
│       │                                                                      │
│       ├──1:N──► courses (id, user_id, name, code, color, description)        │
│       │              │                                                       │
│       │              ├──1:N──► documents (via course_id, SET NULL)            │
│       │              ├──1:N──► flashcard_sets (via course_id, SET NULL)       │
│       │              └──1:N──► exams (via course_id, SET NULL)                │
│       │                                                                      │
│       ├──1:N──► study_sessions (id, user_id, name, status)                   │
│       │              │                                                       │
│       │              ├──1:N──► documents (via session_id, SET NULL)           │
│       │              ├──1:N──► chat_sessions (via study_session_id)           │
│       │              └──1:N──► ai_generations (via session_id)                │
│       │                                                                      │
│       ├──1:N──► documents (id, user_id, name, type, status, file_url)        │
│       │              │                                                       │
│       │              ├──1:N──► document_datasets (ragflow integration)        │
│       │              ├──1:N──► flashcard_sets (via document_id)               │
│       │              ├──1:N──► chat_sessions (via document_id)                │
│       │              └──1:N──► ai_generations (via document_id)               │
│       │                                                                      │
│       ├──1:N──► flashcard_sets (id, user_id, name)                           │
│       │              └──1:N──► flashcards (id, set_id, front, back, SRS)      │
│       │                                                                      │
│       ├──1:N──► exams (id, user_id, name, question_count)                    │
│       │              ├──1:N──► exam_questions (question, type, options)        │
│       │              └──1:N──► exam_attempts (user_id, answers, score)        │
│       │                                                                      │
│       ├──1:N──► chat_sessions (id, user_id, type, ragflow refs)              │
│       │              └──1:N──► chat_messages (role, content, tokens_used)     │
│       │                                                                      │
│       └──1:N──► ai_generations (id, user_id, type, status, tokens_used)      │
│                                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                          NEW ADMIN TABLES                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  audit_logs                                                                  │
│  ├── id UUID PK                                                              │
│  ├── admin_id UUID FK -> profiles(id)                                        │
│  ├── action TEXT NOT NULL (create|update|delete|ban|unban|login|export)       │
│  ├── resource_type TEXT NOT NULL (user|course|document|exam|...)              │
│  ├── resource_id UUID                                                        │
│  ├── details JSONB (before/after state, metadata)                            │
│  ├── ip_address INET                                                         │
│  ├── user_agent TEXT                                                         │
│  └── created_at TIMESTAMPTZ DEFAULT NOW()                                    │
│                                                                              │
│  plans                                                                       │
│  ├── id UUID PK                                                              │
│  ├── name TEXT NOT NULL (free|pro|team)                                      │
│  ├── price_monthly NUMERIC(10,2) NOT NULL                                    │
│  ├── price_yearly NUMERIC(10,2)                                              │
│  ├── ai_credits_monthly INTEGER NOT NULL                                     │
│  ├── storage_limit_mb INTEGER NOT NULL                                       │
│  ├── max_documents INTEGER                                                   │
│  ├── max_courses INTEGER                                                     │
│  ├── features JSONB (feature flags per plan)                                 │
│  ├── is_active BOOLEAN DEFAULT true                                          │
│  └── created_at TIMESTAMPTZ DEFAULT NOW()                                    │
│                                                                              │
│  subscriptions                                                               │
│  ├── id UUID PK                                                              │
│  ├── user_id UUID FK -> profiles(id) ON DELETE CASCADE                       │
│  ├── plan_id UUID FK -> plans(id)                                            │
│  ├── status TEXT CHECK (active|past_due|canceled|trialing)                   │
│  ├── current_period_start TIMESTAMPTZ                                        │
│  ├── current_period_end TIMESTAMPTZ                                          │
│  ├── cancel_at_period_end BOOLEAN DEFAULT false                              │
│  ├── provider TEXT (stripe|manual)                                           │
│  ├── provider_subscription_id TEXT                                           │
│  ├── created_at TIMESTAMPTZ DEFAULT NOW()                                    │
│  └── updated_at TIMESTAMPTZ DEFAULT NOW()                                    │
│                                                                              │
│  credit_accounts                                                             │
│  ├── id UUID PK                                                              │
│  ├── user_id UUID UNIQUE FK -> profiles(id) ON DELETE CASCADE                │
│  ├── balance INTEGER NOT NULL DEFAULT 0 (in credits)                         │
│  ├── lifetime_earned INTEGER DEFAULT 0                                       │
│  ├── lifetime_spent INTEGER DEFAULT 0                                        │
│  └── updated_at TIMESTAMPTZ DEFAULT NOW()                                    │
│                                                                              │
│  credit_transactions                                                         │
│  ├── id UUID PK                                                              │
│  ├── account_id UUID FK -> credit_accounts(id) ON DELETE CASCADE             │
│  ├── amount INTEGER NOT NULL (positive=credit, negative=debit)               │
│  ├── type TEXT CHECK (subscription|purchase|usage|bonus|refund|admin_adj)     │
│  ├── reference_type TEXT (ai_generation|chat_message|subscription|coupon)     │
│  ├── reference_id UUID                                                       │
│  ├── description TEXT                                                        │
│  ├── balance_after INTEGER NOT NULL                                          │
│  └── created_at TIMESTAMPTZ DEFAULT NOW()                                    │
│                                                                              │
│  coupons                                                                     │
│  ├── id UUID PK                                                              │
│  ├── code TEXT UNIQUE NOT NULL                                               │
│  ├── description TEXT                                                        │
│  ├── discount_type TEXT CHECK (percentage|fixed_credits|plan_upgrade)         │
│  ├── discount_value NUMERIC(10,2) NOT NULL                                   │
│  ├── max_uses INTEGER                                                        │
│  ├── current_uses INTEGER DEFAULT 0                                          │
│  ├── valid_from TIMESTAMPTZ DEFAULT NOW()                                    │
│  ├── valid_until TIMESTAMPTZ                                                 │
│  ├── plan_restriction UUID FK -> plans(id) (nullable)                        │
│  ├── is_active BOOLEAN DEFAULT true                                          │
│  └── created_at TIMESTAMPTZ DEFAULT NOW()                                    │
│                                                                              │
│  coupon_redemptions                                                          │
│  ├── id UUID PK                                                              │
│  ├── coupon_id UUID FK -> coupons(id) ON DELETE CASCADE                      │
│  ├── user_id UUID FK -> profiles(id) ON DELETE CASCADE                       │
│  ├── UNIQUE(coupon_id, user_id)                                              │
│  └── redeemed_at TIMESTAMPTZ DEFAULT NOW()                                   │
│                                                                              │
│  feature_flags                                                               │
│  ├── id UUID PK                                                              │
│  ├── key TEXT UNIQUE NOT NULL                                                │
│  ├── description TEXT                                                        │
│  ├── is_enabled BOOLEAN DEFAULT false                                        │
│  ├── rollout_percentage INTEGER DEFAULT 0 (0-100)                            │
│  ├── target_roles TEXT[] (which roles see this)                              │
│  ├── metadata JSONB                                                          │
│  ├── created_at TIMESTAMPTZ DEFAULT NOW()                                    │
│  └── updated_at TIMESTAMPTZ DEFAULT NOW()                                    │
│                                                                              │
│  system_settings                                                             │
│  ├── key TEXT PK                                                             │
│  ├── value JSONB NOT NULL                                                    │
│  ├── description TEXT                                                        │
│  └── updated_at TIMESTAMPTZ DEFAULT NOW()                                    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. ADMIN NAVIGATION TREE

```
Admin Portal Sidebar
├── Dashboard
│   ├── Overview (KPIs, charts)
│   ├── Growth (signups, DAU/MAU)
│   └── AI Costs (tokens, model breakdown)
│
├── Users
│   ├── All Users (list, search, filter)
│   ├── User Detail (profile + all user data)
│   └── Banned Users
│
├── Content
│   ├── Courses (all courses, paginated)
│   ├── Documents (all documents, storage stats)
│   ├── Study Sessions (all sessions)
│   ├── Flashcards (all sets)
│   └── Exams (all exams + attempts)
│
├── AI & Usage
│   ├── Generations (all AI jobs, status, retry)
│   ├── Chat Sessions (all chats, message logs)
│   ├── Token Usage (daily/weekly/monthly breakdown)
│   └── RAGFlow Status (dataset health, processing queue)
│
├── Billing
│   ├── Plans (manage subscription tiers)
│   ├── Subscriptions (all user subs, status)
│   ├── Credits (accounts, transactions, adjustments)
│   └── Coupons (create, manage, track redemptions)
│
├── System
│   ├── Feature Flags (toggle, rollout %)
│   ├── System Settings (global config)
│   ├── Audit Log (all admin actions)
│   └── Health (API status, Redis, Supabase, RAGFlow)
│
└── Account
    ├── My Profile
    └── Logout
```

---

## 4. ROUTE STRUCTURE

```
apps/admin/src/app/
├── layout.tsx                         (AdminLayout with sidebar + auth check)
├── page.tsx                           (redirect to /dashboard)
├── login/
│   └── page.tsx                       (admin login form)
│
├── dashboard/
│   ├── page.tsx                       (overview KPIs)
│   ├── growth/page.tsx                (signup/activity charts)
│   └── ai-costs/page.tsx              (token consumption graphs)
│
├── users/
│   ├── page.tsx                       (user list table with search/filter)
│   ├── [id]/page.tsx                  (user detail + tabs for their data)
│   └── banned/page.tsx                (banned users list)
│
├── content/
│   ├── courses/page.tsx               (all courses table)
│   ├── documents/page.tsx             (all documents table)
│   ├── sessions/page.tsx              (all study sessions table)
│   ├── flashcards/page.tsx            (all flashcard sets table)
│   └── exams/
│       ├── page.tsx                   (all exams table)
│       └── attempts/page.tsx          (all attempts table)
│
├── ai/
│   ├── generations/page.tsx           (all AI generations table)
│   ├── generations/[id]/page.tsx      (generation detail)
│   ├── chat/page.tsx                  (all chat sessions)
│   ├── chat/[id]/page.tsx             (chat message log)
│   ├── usage/page.tsx                 (token usage analytics)
│   └── ragflow/page.tsx               (RAGFlow health/queue)
│
├── billing/
│   ├── plans/page.tsx                 (plan management CRUD)
│   ├── subscriptions/page.tsx         (all subscriptions)
│   ├── credits/page.tsx               (credit accounts + transactions)
│   └── coupons/page.tsx               (coupon CRUD)
│
├── system/
│   ├── feature-flags/page.tsx         (flag list + toggle)
│   ├── settings/page.tsx              (system settings key/value)
│   ├── audit-log/page.tsx             (searchable audit trail)
│   └── health/page.tsx                (service status dashboard)
│
└── account/
    └── page.tsx                       (admin profile)
```

---

## 5. API SPECIFICATION

### 5.1 Infrastructure Endpoints

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/admin/auth/login` | Public (throttled) | Admin login, validates role |
| GET | `/admin/auth/me` | AdminGuard | Current admin profile + permissions |
| POST | `/admin/auth/logout` | AdminGuard | Clear admin session |

### 5.2 Dashboard Endpoints

| Method | Path | Auth | Response |
|--------|------|------|----------|
| GET | `/admin/dashboard/overview` | AdminGuard | `{ totalUsers, totalDocuments, totalExams, totalAiGenerations, totalStorage, activeUsers24h }` |
| GET | `/admin/dashboard/growth` | AdminGuard | `{ signups: TimeSeriesData[], activeUsers: TimeSeriesData[] }` with period query param |
| GET | `/admin/dashboard/ai-costs` | AdminGuard | `{ byModel: {model, tokens, cost}[], byDay: TimeSeriesData[], totalTokens, estimatedCost }` |
| GET | `/admin/dashboard/storage` | AdminGuard | `{ totalBytes, byType: {type, bytes, count}[], topUsers: {userId, bytes}[] }` |

### 5.3 User Management Endpoints

| Method | Path | Query/Body | Response |
|--------|------|------------|----------|
| GET | `/admin/users` | `?page&limit&search&role&sortBy&sortOrder&createdAfter&createdBefore&is_banned` | `PaginatedResponse<AdminUser>` |
| GET | `/admin/users/:id` | - | `AdminUserDetail` (profile + stats + subscription) |
| PATCH | `/admin/users/:id` | `{ name?, role? }` | Updated profile |
| POST | `/admin/users/:id/ban` | `{ reason, duration_days? }` | void |
| POST | `/admin/users/:id/unban` | - | void |
| GET | `/admin/users/:id/activity` | `?page&limit&type` | `PaginatedResponse<AuditLog>` |
| GET | `/admin/users/:id/credits` | - | `CreditAccount + recent transactions` |
| POST | `/admin/users/:id/credits/adjust` | `{ amount, reason }` | Updated balance |

### 5.4 Content Management Endpoints

| Method | Path | Query/Body | Response |
|--------|------|------------|----------|
| GET | `/admin/courses` | `?page&limit&userId&search&sortBy&sortOrder` | `PaginatedResponse<Course>` |
| GET | `/admin/courses/:id` | - | Course detail |
| DELETE | `/admin/courses/:id` | - | void |
| POST | `/admin/courses/bulk-delete` | `{ ids: UUID[] }` | `{ deleted: number }` |
| GET | `/admin/documents` | `?page&limit&userId&type&status&courseId&sessionId&sortBy&sortOrder` | `PaginatedResponse<Document>` |
| GET | `/admin/documents/:id` | - | Document detail |
| GET | `/admin/documents/:id/url` | - | Signed download URL |
| DELETE | `/admin/documents/:id` | - | void |
| POST | `/admin/documents/bulk-delete` | `{ ids: UUID[] }` | `{ deleted: number }` |
| GET | `/admin/documents/stats` | - | `{ byType, byStatus, totalSize, processing }` |
| GET | `/admin/sessions` | `?page&limit&userId&status&sortBy&sortOrder` | `PaginatedResponse<StudySession>` |
| DELETE | `/admin/sessions/:id` | - | void |
| GET | `/admin/flashcards/sets` | `?page&limit&userId&courseId&sortBy&sortOrder` | `PaginatedResponse<FlashcardSet>` |
| GET | `/admin/flashcards/sets/:id` | - | Set + cards |
| DELETE | `/admin/flashcards/sets/:id` | - | void |
| GET | `/admin/flashcards/stats` | - | `{ totalSets, totalCards, avgCardsPerSet, reviewStats }` |
| GET | `/admin/exams` | `?page&limit&userId&courseId&sortBy&sortOrder` | `PaginatedResponse<Exam>` |
| GET | `/admin/exams/:id` | - | Exam + questions |
| DELETE | `/admin/exams/:id` | - | void |
| GET | `/admin/exams/attempts` | `?page&limit&userId&examId&minScore&maxScore&sortBy` | `PaginatedResponse<ExamAttempt>` |
| GET | `/admin/exams/stats` | - | `{ avgScore, completionRate, byDifficulty }` |

### 5.5 AI & Chat Endpoints

| Method | Path | Query/Body | Response |
|--------|------|------------|----------|
| GET | `/admin/ai-generation` | `?page&limit&userId&type&status&model&sortBy&sortOrder` | `PaginatedResponse<AiGeneration>` |
| GET | `/admin/ai-generation/:id` | - | Generation detail + result |
| POST | `/admin/ai-generation/:id/retry` | - | New generation record |
| POST | `/admin/ai-generation/bulk-retry` | `{ ids: UUID[] }` | `{ retried: number }` |
| GET | `/admin/ai-generation/stats` | `?period` | `{ byType, byStatus, byModel, tokenUsage, costEstimate }` |
| GET | `/admin/chat/sessions` | `?page&limit&userId&type&sortBy&sortOrder` | `PaginatedResponse<ChatSession>` |
| GET | `/admin/chat/sessions/:id/messages` | `?page&limit` | `PaginatedResponse<ChatMessage>` |
| DELETE | `/admin/chat/sessions/:id` | - | void |
| GET | `/admin/chat/stats` | - | `{ totalSessions, totalMessages, avgMessagesPerSession, tokenUsage }` |

### 5.6 Billing Endpoints

| Method | Path | Query/Body | Response |
|--------|------|------------|----------|
| GET | `/admin/plans` | - | `Plan[]` |
| POST | `/admin/plans` | `CreatePlanDto` | Created plan |
| PATCH | `/admin/plans/:id` | `UpdatePlanDto` | Updated plan |
| DELETE | `/admin/plans/:id` | - | void (soft deactivate) |
| GET | `/admin/subscriptions` | `?page&limit&userId&planId&status&sortBy` | `PaginatedResponse<Subscription>` |
| PATCH | `/admin/subscriptions/:id` | `{ status?, plan_id? }` | Updated subscription |
| GET | `/admin/credits` | `?page&limit&userId&sortBy` | `PaginatedResponse<CreditAccount>` |
| GET | `/admin/credits/:userId/transactions` | `?page&limit&type` | `PaginatedResponse<CreditTransaction>` |
| POST | `/admin/credits/:userId/adjust` | `{ amount, reason, type }` | Transaction record |
| GET | `/admin/coupons` | `?page&limit&is_active` | `PaginatedResponse<Coupon>` |
| POST | `/admin/coupons` | `CreateCouponDto` | Created coupon |
| PATCH | `/admin/coupons/:id` | `UpdateCouponDto` | Updated coupon |
| DELETE | `/admin/coupons/:id` | - | void (deactivate) |
| GET | `/admin/coupons/:id/redemptions` | `?page&limit` | `PaginatedResponse<CouponRedemption>` |

### 5.7 System Endpoints

| Method | Path | Query/Body | Response |
|--------|------|------------|----------|
| GET | `/admin/feature-flags` | - | `FeatureFlag[]` |
| POST | `/admin/feature-flags` | `CreateFlagDto` | Created flag |
| PATCH | `/admin/feature-flags/:id` | `{ is_enabled?, rollout_percentage?, target_roles? }` | Updated flag |
| DELETE | `/admin/feature-flags/:id` | - | void |
| GET | `/admin/settings` | - | `SystemSetting[]` |
| PATCH | `/admin/settings/:key` | `{ value: any }` | Updated setting |
| GET | `/admin/audit-log` | `?page&limit&admin_id&action&resource_type&dateFrom&dateTo` | `PaginatedResponse<AuditLog>` |
| GET | `/admin/health` | - | `{ api, database, redis, ragflow, storage }` |

---

## 6. PERMISSION MATRIX

```
Roles: super_admin, admin, user (student)

┌────────────────────────┬──────────────┬──────────────┬──────────────┐
│ Resource / Action      │ super_admin  │ admin        │ user         │
├────────────────────────┼──────────────┼──────────────┼──────────────┤
│ Admin Portal Access    │ YES          │ YES          │ NO           │
├────────────────────────┼──────────────┼──────────────┼──────────────┤
│ Users: list/view       │ YES          │ YES          │ NO (own)     │
│ Users: edit profile    │ YES          │ YES          │ NO (own)     │
│ Users: change role     │ YES          │ NO           │ NO           │
│ Users: ban/unban       │ YES          │ YES          │ NO           │
│ Users: delete          │ YES          │ NO           │ NO           │
├────────────────────────┼──────────────┼──────────────┼──────────────┤
│ Content: list all      │ YES          │ YES          │ NO (own)     │
│ Content: view any      │ YES          │ YES          │ NO (own)     │
│ Content: delete any    │ YES          │ YES          │ NO (own)     │
│ Content: bulk delete   │ YES          │ NO           │ NO           │
├────────────────────────┼──────────────┼──────────────┼──────────────┤
│ AI Gen: list all       │ YES          │ YES          │ NO (own)     │
│ AI Gen: retry          │ YES          │ YES          │ NO           │
│ AI Gen: bulk retry     │ YES          │ NO           │ NO           │
├────────────────────────┼──────────────┼──────────────┼──────────────┤
│ Chat: view all         │ YES          │ YES          │ NO (own)     │
│ Chat: delete any       │ YES          │ YES          │ NO (own)     │
├────────────────────────┼──────────────┼──────────────┼──────────────┤
│ Plans: manage          │ YES          │ NO           │ NO           │
│ Subscriptions: view    │ YES          │ YES          │ NO (own)     │
│ Subscriptions: modify  │ YES          │ NO           │ NO           │
│ Credits: view all      │ YES          │ YES          │ NO (own)     │
│ Credits: adjust        │ YES          │ YES          │ NO           │
│ Coupons: manage        │ YES          │ YES          │ NO           │
├────────────────────────┼──────────────┼──────────────┼──────────────┤
│ Feature Flags: view    │ YES          │ YES          │ NO           │
│ Feature Flags: modify  │ YES          │ NO           │ NO           │
│ System Settings        │ YES          │ NO           │ NO           │
│ Audit Log: view        │ YES          │ YES (own)    │ NO           │
│ Audit Log: view all    │ YES          │ NO           │ NO           │
├────────────────────────┼──────────────┼──────────────┼──────────────┤
│ Dashboard: full        │ YES          │ YES          │ NO           │
│ Health: view           │ YES          │ YES          │ NO           │
└────────────────────────┴──────────────┴──────────────┴──────────────┘
```

---

## 7. IMPLEMENTATION PLAN

### Phase 0: Infrastructure (Week 1, ~3 days)

| Task | Effort | Files |
|------|--------|-------|
| DB Migration: Add `role` + `banned_at` to `profiles` | 2h | `supabase/migrations/00008_admin_roles.sql` |
| DB Migration: Create admin tables (audit_logs, plans, subscriptions, credit_accounts, credit_transactions, coupons, coupon_redemptions, feature_flags, system_settings) | 4h | `supabase/migrations/00009_admin_tables.sql` |
| Add `AdminGuard` + `RolesGuard` + `@Roles()` decorator to backend | 3h | `apps/backend/src/common/guards/admin.guard.ts`, `roles.guard.ts` |
| Extract `@athora/shared` types (clean up duplicates) | 2h | `packages/shared/src/types/` |
| Scaffold `apps/admin` (Next.js, copy config from web) | 2h | `apps/admin/` |
| Admin login (reuse existing auth, validate role) | 2h | `apps/backend/src/admin/auth/` |

### Phase 1: Core Admin CRUD (Week 1-2, ~5 days)

| Task | Effort | Priority |
|------|--------|----------|
| Admin Layout + Sidebar navigation | 4h | P0 |
| Dashboard overview (KPIs from DB counts) | 4h | P0 |
| User list (paginated, searchable, filterable) | 6h | P0 |
| User detail page (profile + stats + actions) | 4h | P0 |
| Ban/unban user action | 2h | P0 |
| Credit accounts + transactions view | 4h | P0 |
| Credit adjustment (manual bonus/refund) | 3h | P0 |
| Audit log (list + filters) | 4h | P0 |

### Phase 2: Billing + Content (Week 2-3, ~5 days)

| Task | Effort | Priority |
|------|--------|----------|
| Plans CRUD | 4h | P1 |
| Subscriptions list + management | 4h | P1 |
| Coupons CRUD + redemption tracking | 4h | P1 |
| Documents management (list, view, delete) | 4h | P1 |
| Study sessions management | 3h | P1 |
| Flashcards management | 3h | P1 |
| Exams + attempts management | 4h | P1 |

### Phase 3: AI + Analytics (Week 3-4, ~4 days)

| Task | Effort | Priority |
|------|--------|----------|
| AI generations list + retry + stats | 6h | P1 |
| Chat sessions viewer (read message logs) | 4h | P1 |
| Token usage analytics (charts) | 4h | P2 |
| Feature flags management | 3h | P2 |
| System settings management | 2h | P2 |
| Health status dashboard | 3h | P2 |

### Phase 4: Polish + Advanced (Week 4, ~3 days)

| Task | Effort | Priority |
|------|--------|----------|
| Growth analytics (DAU/MAU/retention charts) | 6h | P2 |
| Bulk actions (delete, retry) | 3h | P2 |
| Export (CSV) for user list + transactions | 3h | P2 |
| Impersonation (login as user) | 4h | P3 |
| Real-time dashboard updates (WebSocket) | 4h | P3 |

**Total estimated effort: ~15-20 engineering days**

---

## 8. REUSABLE COMPONENTS LIST

### From `apps/web/src/components/ui/` (share via `packages/ui`)

| Component | Reuse in Admin | Notes |
|-----------|---------------|-------|
| Button | YES | All variants |
| Card | YES | Container for widgets |
| Dialog | YES | Confirmations, modals |
| Input | YES | All forms |
| Badge | YES | Status indicators |
| Tooltip | YES | Help text |
| Tabs | YES | Detail page tabs |
| Progress | YES | Loading indicators |
| Sheet | YES | Mobile drawer |
| Separator | YES | Visual dividers |
| DropdownMenu | YES | Actions menus |
| Markdown | YES | Chat logs display |

### From `apps/web/src/` (share via `packages/`)

| Module | Extract To | Reuse |
|--------|-----------|-------|
| `lib/api.ts` | `packages/api-client` | Admin + Mobile |
| `stores/auth-store.ts` | Pattern only | Admin has own store |
| `stores/toast-store.ts` | `packages/ui` | Shared toast |
| `components/ui/*` | `packages/ui` | All apps |
| `lib/utils.ts` (cn helper) | `packages/ui` | Tailwind merge |

### Admin-specific (new, NOT shared)

| Component | Purpose |
|-----------|---------|
| AdminLayout | Sidebar + header + breadcrumb |
| DataTable | Paginated, sortable, filterable table (TanStack Table) |
| StatCard | KPI metric card |
| Chart | Time-series line/bar charts (Recharts) |
| UserAvatar | User display with status |
| ActionMenu | Row actions (edit, ban, delete) |
| FilterBar | Multi-filter chip bar |
| AuditEntry | Single audit log row |
| CreditBadge | Balance display |

---

## 9. MIGRATION PLAN

### Migration 00008: Admin Roles

```sql
-- Add role to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user'
  CHECK (role IN ('user', 'admin', 'super_admin'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS banned_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ban_reason TEXT;

-- Index for admin queries
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Set first user as super_admin (manual one-time)
-- UPDATE profiles SET role = 'super_admin' WHERE id = '<your-user-id>';
```

### Migration 00009: Admin Tables

```sql
-- audit_logs, plans, subscriptions, credit_accounts, credit_transactions,
-- coupons, coupon_redemptions, feature_flags, system_settings
-- (Full DDL in Database Diagram section above)
```

### Migration 00010: Seed Plans

```sql
INSERT INTO plans (name, price_monthly, ai_credits_monthly, storage_limit_mb, max_documents) VALUES
  ('free', 0, 50, 100, 5),
  ('starter', 10, 200, 500, 50),
  ('student', 25, 600, 2000, 200),
  ('pro', 50, 1600, 10000, -1);
```

### Data Migration Steps

1. Create tables (00008, 00009, 00010)
2. Set admin role on your user manually
3. Create credit_accounts for all existing users (`INSERT ... SELECT FROM profiles`)
4. No destructive changes — all additive

---

## 10. ZERO-BUG REVIEW

### Potential Issues

| Risk | Severity | Mitigation |
|------|----------|-----------|
| Admin bypasses RLS (using service key) | HIGH | Admin endpoints use service key intentionally — but validate admin role in guard BEFORE accessing data |
| Credit balance race condition | HIGH | Use DB transaction for debit/credit (`UPDATE ... SET balance = balance - X WHERE balance >= X RETURNING balance`) |
| Audit log volume (10M rows) | MEDIUM | Partition by month, auto-archive after 90 days, cursor pagination |
| N+1 queries on user list with stats | MEDIUM | Use aggregate subqueries, not individual counts per user |
| Admin impersonation security | HIGH | Only super_admin, log all impersonation events, auto-expire after 1 hour |
| Coupon race condition (max_uses) | MEDIUM | Use `UPDATE SET current_uses = current_uses + 1 WHERE current_uses < max_uses RETURNING *` |
| Feature flag cache invalidation | LOW | Use short TTL (60s) or pub/sub via Redis |
| Large CSV exports blocking event loop | MEDIUM | Stream CSV via readable stream, not in-memory buffer |

### Edge Cases to Handle

1. **User deletes account while admin viewing** — 404 gracefully, don't crash
2. **Admin bans themselves** — prevent in guard
3. **Last super_admin demoted** — prevent in role change logic
4. **Credit balance goes negative** — DB constraint `CHECK (balance >= 0)`
5. **Concurrent plan price changes** — optimistic locking or `updated_at` check
6. **Audit log contains PII** — don't log passwords, only log field names changed (not values for sensitive fields)

### Pre-Launch Checklist

- [ ] All admin endpoints protected by AdminGuard
- [ ] All write actions logged to audit_logs
- [ ] Pagination on every list endpoint (no unbounded queries)
- [ ] Rate limiting on admin endpoints (stricter for destructive actions)
- [ ] Admin login requires 2FA (future, P3)
- [ ] CORS configured for admin origin separately
- [ ] Admin cannot access student app routes (separate cookie scope)

