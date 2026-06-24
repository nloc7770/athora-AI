# Database Schema

## Overview

Athora uses Supabase (PostgreSQL) with Row-Level Security enabled on all tables. The schema is defined in `apps/backend/supabase/migrations/001_initial_schema.sql`.

## Tables

### profiles

User profile information, linked 1:1 with Supabase Auth users.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, FK → auth.users(id) ON DELETE CASCADE | Matches auth user ID |
| name | TEXT | nullable | Display name |
| avatar_url | TEXT | nullable | Profile image URL |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Record creation time |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last update time |

### courses

User-created courses for organizing study materials.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Auto-generated ID |
| user_id | UUID | NOT NULL, FK → auth.users(id) ON DELETE CASCADE | Owner |
| name | TEXT | NOT NULL | Course name |
| code | TEXT | nullable | Course code (e.g., "CS101") |
| color | TEXT | DEFAULT '#6366f1' | UI display color |
| description | TEXT | nullable | Course description |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Record creation time |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last update time |

### documents

Uploaded study materials (PDFs, audio, notes, video).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Auto-generated ID |
| user_id | UUID | NOT NULL, FK → auth.users(id) ON DELETE CASCADE | Owner |
| course_id | UUID | FK → courses(id) ON DELETE SET NULL | Associated course |
| name | TEXT | NOT NULL | Document name |
| type | TEXT | NOT NULL, CHECK IN ('pdf', 'audio', 'note', 'video') | File type |
| file_url | TEXT | nullable | Storage URL |
| file_size | BIGINT | nullable | File size in bytes |
| pages | INTEGER | nullable | Page count (PDFs) |
| duration | INTEGER | nullable | Duration in seconds (audio/video) |
| status | TEXT | DEFAULT 'processing', CHECK IN ('ready', 'processing', 'error') | Processing state |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Record creation time |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last update time |

### flashcard_sets

Collections of flashcards, optionally linked to a course or document.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Auto-generated ID |
| user_id | UUID | NOT NULL, FK → auth.users(id) ON DELETE CASCADE | Owner |
| course_id | UUID | FK → courses(id) ON DELETE SET NULL | Associated course |
| document_id | UUID | FK → documents(id) ON DELETE SET NULL | Source document |
| name | TEXT | NOT NULL | Set name |
| description | TEXT | nullable | Set description |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Record creation time |

### flashcards

Individual flashcards with spaced repetition data.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Auto-generated ID |
| set_id | UUID | NOT NULL, FK → flashcard_sets(id) ON DELETE CASCADE | Parent set |
| front | TEXT | NOT NULL | Question/prompt side |
| back | TEXT | NOT NULL | Answer side |
| difficulty | TEXT | DEFAULT 'medium', CHECK IN ('easy', 'medium', 'hard') | Card difficulty |
| streak | INTEGER | DEFAULT 0 | Consecutive correct answers |
| last_reviewed | TIMESTAMPTZ | nullable | Last review timestamp |
| next_review | TIMESTAMPTZ | nullable | Next scheduled review |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Record creation time |

### exams

Practice exams, optionally linked to a course.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Auto-generated ID |
| user_id | UUID | NOT NULL, FK → auth.users(id) ON DELETE CASCADE | Owner |
| course_id | UUID | FK → courses(id) ON DELETE SET NULL | Associated course |
| name | TEXT | NOT NULL | Exam name |
| question_count | INTEGER | NOT NULL | Total questions |
| difficulty | TEXT | DEFAULT 'mixed' | Exam difficulty level |
| time_limit | INTEGER | nullable | Time limit in seconds |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Record creation time |

### exam_questions

Individual questions within an exam.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Auto-generated ID |
| exam_id | UUID | NOT NULL, FK → exams(id) ON DELETE CASCADE | Parent exam |
| question | TEXT | NOT NULL | Question text |
| type | TEXT | NOT NULL, CHECK IN ('multiple_choice', 'short_answer', 'true_false') | Question format |
| options | JSONB | nullable | Answer options (for multiple choice) |
| correct_answer | TEXT | NOT NULL | Correct answer value |
| explanation | TEXT | nullable | Answer explanation |
| order_index | INTEGER | NOT NULL | Display order |

### exam_attempts

Records of users taking exams.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Auto-generated ID |
| exam_id | UUID | NOT NULL, FK → exams(id) ON DELETE CASCADE | Exam taken |
| user_id | UUID | NOT NULL, FK → auth.users(id) ON DELETE CASCADE | Student |
| answers | JSONB | NOT NULL | User's submitted answers |
| score | NUMERIC(5,2) | nullable | Percentage score |
| time_spent | INTEGER | nullable | Seconds spent |
| completed_at | TIMESTAMPTZ | DEFAULT NOW() | Completion timestamp |

## Relationships Diagram

```
auth.users (Supabase Auth)
    │
    ├── 1:1 ──── profiles
    │
    ├── 1:N ──── courses
    │               │
    │               ├── 1:N ──── documents (course_id, SET NULL on delete)
    │               ├── 1:N ──── flashcard_sets (course_id, SET NULL on delete)
    │               └── 1:N ──── exams (course_id, SET NULL on delete)
    │
    ├── 1:N ──── documents
    │               │
    │               └── 1:N ──── flashcard_sets (document_id, SET NULL on delete)
    │
    ├── 1:N ──── flashcard_sets
    │               │
    │               └── 1:N ──── flashcards (CASCADE on delete)
    │
    ├── 1:N ──── exams
    │               │
    │               ├── 1:N ──── exam_questions (CASCADE on delete)
    │               └── 1:N ──── exam_attempts (CASCADE on delete)
    │
    └── 1:N ──── exam_attempts
```

## Row-Level Security Policies

All tables have RLS enabled. Each policy uses `FOR ALL` (applies to SELECT, INSERT, UPDATE, DELETE).

| Table | Policy Name | Rule |
|-------|-------------|------|
| profiles | Users can view own profile | `auth.uid() = id` |
| courses | Users can manage own courses | `auth.uid() = user_id` |
| documents | Users can manage own documents | `auth.uid() = user_id` |
| flashcard_sets | Users can manage own flashcard_sets | `auth.uid() = user_id` |
| flashcards | Users can manage own flashcards | `set_id IN (SELECT id FROM flashcard_sets WHERE user_id = auth.uid())` |
| exams | Users can manage own exams | `auth.uid() = user_id` |
| exam_questions | Users can view own exam questions | `exam_id IN (SELECT id FROM exams WHERE user_id = auth.uid())` |
| exam_attempts | Users can manage own attempts | `auth.uid() = user_id` |

### RLS Design Notes

- Direct ownership tables (`courses`, `documents`, etc.) check `user_id` directly
- Child tables (`flashcards`, `exam_questions`) verify ownership through their parent table via subquery
- `ON DELETE CASCADE` ensures child records are removed when parents are deleted
- `ON DELETE SET NULL` on optional foreign keys (e.g., `course_id` on documents) preserves records when a course is removed

## Migration Files

| File | Description |
|------|-------------|
| `apps/backend/supabase/migrations/001_initial_schema.sql` | All tables, constraints, RLS policies |
