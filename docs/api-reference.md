# API Reference

## Base URL

```
http://localhost:3001
```

## Authentication

All endpoints except `POST /auth/register` and `POST /auth/login` require a Bearer token in the `Authorization` header:

```
Authorization: Bearer <access_token>
```

---

## Auth (`/auth`)

### POST /auth/register

Register a new user account.

| Field | Required | Description |
|-------|----------|-------------|
| Auth required | No | - |

**Request Body:**

```typescript
{
  email: string       // valid email, required
  password: string    // min 6 characters, required
  name?: string       // optional display name
}
```

**Success Response (201):**

```json
{
  "user": { "id": "uuid", "email": "user@example.com" },
  "access_token": "eyJ..."
}
```

**Error Response (400):**

```json
{
  "statusCode": 400,
  "message": ["email must be an email", "password must be longer than or equal to 6 characters"],
  "error": "Bad Request"
}
```

**Example:**

```bash
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "student@example.com", "password": "secret123", "name": "Jane"}'
```

---

### POST /auth/login

Authenticate and receive an access token.

| Field | Required | Description |
|-------|----------|-------------|
| Auth required | No | - |

**Request Body:**

```typescript
{
  email: string       // valid email, required
  password: string    // min 6 characters, required
}
```

**Success Response (200):**

```json
{
  "user": { "id": "uuid", "email": "student@example.com" },
  "access_token": "eyJ..."
}
```

**Error Response (401):**

```json
{
  "statusCode": 401,
  "message": "Invalid credentials",
  "error": "Unauthorized"
}
```

**Example:**

```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "student@example.com", "password": "secret123"}'
```

---

### POST /auth/logout

Invalidate the current session token.

| Field | Required | Description |
|-------|----------|-------------|
| Auth required | Yes | Bearer token |

**Success Response (200):**

```json
{
  "message": "Logged out successfully"
}
```

**Example:**

```bash
curl -X POST http://localhost:3001/auth/logout \
  -H "Authorization: Bearer <token>"
```

---

### GET /auth/me

Get the authenticated user's profile.

| Field | Required | Description |
|-------|----------|-------------|
| Auth required | Yes | Bearer token |

**Success Response (200):**

```json
{
  "id": "uuid",
  "email": "student@example.com",
  "name": "Jane"
}
```

**Example:**

```bash
curl http://localhost:3001/auth/me \
  -H "Authorization: Bearer <token>"
```

---

## Users (`/users`)

### GET /users/me

Get the current user's profile.

| Field | Required | Description |
|-------|----------|-------------|
| Auth required | Yes | Bearer token |

**Success Response (200):**

```json
{
  "id": "uuid",
  "email": "student@example.com",
  "name": "Jane",
  "avatar_url": "https://..."
}
```

**Example:**

```bash
curl http://localhost:3001/users/me \
  -H "Authorization: Bearer <token>"
```

---

### PATCH /users/me

Update the current user's profile.

| Field | Required | Description |
|-------|----------|-------------|
| Auth required | Yes | Bearer token |

**Request Body:**

```typescript
{
  name?: string         // optional
  avatar_url?: string   // optional
}
```

**Success Response (200):**

```json
{
  "id": "uuid",
  "email": "student@example.com",
  "name": "Updated Name",
  "avatar_url": "https://new-avatar.com/img.png"
}
```

**Example:**

```bash
curl -X PATCH http://localhost:3001/users/me \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name": "New Name"}'
```

---

## Courses (`/courses`)

### GET /courses

List all courses for the authenticated user.

| Field | Required | Description |
|-------|----------|-------------|
| Auth required | Yes | Bearer token |

**Success Response (200):**

```json
[
  {
    "id": "uuid",
    "name": "Machine Learning",
    "code": "CS229",
    "color": "#4F46E5",
    "description": "Introduction to ML",
    "user_id": "uuid",
    "created_at": "2026-01-01T00:00:00.000Z"
  }
]
```

**Example:**

```bash
curl http://localhost:3001/courses \
  -H "Authorization: Bearer <token>"
```

---

### GET /courses/:id

Get a single course by ID.

| Field | Required | Description |
|-------|----------|-------------|
| Auth required | Yes | Bearer token |

**Success Response (200):**

```json
{
  "id": "uuid",
  "name": "Machine Learning",
  "code": "CS229",
  "color": "#4F46E5",
  "description": "Introduction to ML",
  "user_id": "uuid",
  "created_at": "2026-01-01T00:00:00.000Z"
}
```

**Example:**

```bash
curl http://localhost:3001/courses/<course_id> \
  -H "Authorization: Bearer <token>"
```

---

### POST /courses

Create a new course.

| Field | Required | Description |
|-------|----------|-------------|
| Auth required | Yes | Bearer token |

**Request Body:**

```typescript
{
  name: string          // required
  code?: string         // e.g. "CS229"
  color?: string        // hex color
  description?: string
}
```

**Success Response (201):**

```json
{
  "id": "uuid",
  "name": "Machine Learning",
  "code": "CS229",
  "color": "#4F46E5",
  "description": "Introduction to ML",
  "user_id": "uuid",
  "created_at": "2026-01-01T00:00:00.000Z"
}
```

**Example:**

```bash
curl -X POST http://localhost:3001/courses \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name": "Machine Learning", "code": "CS229", "color": "#4F46E5"}'
```

---

### PATCH /courses/:id

Update an existing course.

| Field | Required | Description |
|-------|----------|-------------|
| Auth required | Yes | Bearer token |

**Request Body:**

```typescript
{
  name?: string
  code?: string
  color?: string
  description?: string
}
```

**Example:**

```bash
curl -X PATCH http://localhost:3001/courses/<course_id> \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"description": "Updated description"}'
```

---

### DELETE /courses/:id

Delete a course.

| Field | Required | Description |
|-------|----------|-------------|
| Auth required | Yes | Bearer token |

**Success Response (200):**

```json
{
  "message": "Course deleted"
}
```

**Example:**

```bash
curl -X DELETE http://localhost:3001/courses/<course_id> \
  -H "Authorization: Bearer <token>"
```

---

## Documents (`/documents`)

### GET /documents

List all documents. Supports filtering by course and type.

| Field | Required | Description |
|-------|----------|-------------|
| Auth required | Yes | Bearer token |

**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `courseId` | string | Filter by course ID |
| `type` | string | Filter by type: `pdf`, `audio`, `note`, `video` |

**Success Response (200):**

```json
[
  {
    "id": "uuid",
    "name": "Lecture 1 Notes",
    "type": "pdf",
    "course_id": "uuid",
    "file_url": "https://...",
    "file_size": 204800,
    "pages": 12,
    "status": "ready",
    "created_at": "2026-01-01T00:00:00.000Z"
  }
]
```

**Example:**

```bash
curl "http://localhost:3001/documents?courseId=<course_id>&type=pdf" \
  -H "Authorization: Bearer <token>"
```

---

### GET /documents/:id

Get a single document by ID.

| Field | Required | Description |
|-------|----------|-------------|
| Auth required | Yes | Bearer token |

**Example:**

```bash
curl http://localhost:3001/documents/<document_id> \
  -H "Authorization: Bearer <token>"
```

---

### POST /documents

Create a new document record.

| Field | Required | Description |
|-------|----------|-------------|
| Auth required | Yes | Bearer token |

**Request Body:**

```typescript
{
  name: string              // required
  type: string              // required, one of: "pdf" | "audio" | "note" | "video"
  course_id?: string        // link to a course
  file_url?: string         // storage URL
  file_size?: number        // bytes
  pages?: number            // for PDFs
  duration?: number         // for audio/video, in seconds
}
```

**Success Response (201):**

```json
{
  "id": "uuid",
  "name": "Lecture 1 Notes",
  "type": "pdf",
  "course_id": "uuid",
  "file_url": "https://...",
  "file_size": 204800,
  "pages": 12,
  "status": "processing",
  "created_at": "2026-01-01T00:00:00.000Z"
}
```

**Example:**

```bash
curl -X POST http://localhost:3001/documents \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name": "Lecture 1", "type": "pdf", "course_id": "<course_id>", "file_url": "https://storage.example.com/lecture1.pdf", "file_size": 204800, "pages": 12}'
```

---

### PATCH /documents/:id

Update a document.

| Field | Required | Description |
|-------|----------|-------------|
| Auth required | Yes | Bearer token |

**Request Body:**

```typescript
{
  name?: string
  course_id?: string
  file_url?: string
  file_size?: number
  pages?: number
  duration?: number
  status?: string       // one of: "ready" | "processing" | "error"
}
```

**Example:**

```bash
curl -X PATCH http://localhost:3001/documents/<document_id> \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"status": "ready"}'
```

---

### DELETE /documents/:id

Delete a document.

| Field | Required | Description |
|-------|----------|-------------|
| Auth required | Yes | Bearer token |

**Example:**

```bash
curl -X DELETE http://localhost:3001/documents/<document_id> \
  -H "Authorization: Bearer <token>"
```

---

## Flashcards (`/flashcards`)

### GET /flashcards/sets

List all flashcard sets. Supports filtering by course.

| Field | Required | Description |
|-------|----------|-------------|
| Auth required | Yes | Bearer token |

**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `courseId` | string | Filter by course ID |

**Success Response (200):**

```json
[
  {
    "id": "uuid",
    "name": "ML Fundamentals",
    "description": "Key concepts",
    "course_id": "uuid",
    "document_id": "uuid",
    "card_count": 25,
    "created_at": "2026-01-01T00:00:00.000Z"
  }
]
```

**Example:**

```bash
curl "http://localhost:3001/flashcards/sets?courseId=<course_id>" \
  -H "Authorization: Bearer <token>"
```

---

### GET /flashcards/sets/:id

Get a flashcard set with all its cards.

| Field | Required | Description |
|-------|----------|-------------|
| Auth required | Yes | Bearer token |

**Success Response (200):**

```json
{
  "id": "uuid",
  "name": "ML Fundamentals",
  "description": "Key concepts",
  "cards": [
    {
      "id": "uuid",
      "front": "What is gradient descent?",
      "back": "An optimization algorithm...",
      "difficulty": "medium",
      "streak": 3,
      "next_review": "2026-01-05T00:00:00.000Z"
    }
  ]
}
```

**Example:**

```bash
curl http://localhost:3001/flashcards/sets/<set_id> \
  -H "Authorization: Bearer <token>"
```

---

### POST /flashcards/sets

Create a new flashcard set.

| Field | Required | Description |
|-------|----------|-------------|
| Auth required | Yes | Bearer token |

**Request Body:**

```typescript
{
  name: string            // required
  description?: string
  course_id?: string      // link to a course
  document_id?: string    // link to source document
}
```

**Example:**

```bash
curl -X POST http://localhost:3001/flashcards/sets \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name": "ML Fundamentals", "course_id": "<course_id>", "document_id": "<document_id>"}'
```

---

### POST /flashcards/sets/:id/cards

Add a card to an existing flashcard set.

| Field | Required | Description |
|-------|----------|-------------|
| Auth required | Yes | Bearer token |

**Request Body:**

```typescript
{
  front: string           // required, question side
  back: string            // required, answer side
  difficulty?: string     // one of: "easy" | "medium" | "hard"
}
```

**Example:**

```bash
curl -X POST http://localhost:3001/flashcards/sets/<set_id>/cards \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"front": "What is overfitting?", "back": "When a model learns noise in training data", "difficulty": "medium"}'
```

---

### PATCH /flashcards/cards/:id

Update a flashcard (content or review state).

| Field | Required | Description |
|-------|----------|-------------|
| Auth required | Yes | Bearer token |

**Request Body:**

```typescript
{
  front?: string
  back?: string
  difficulty?: string       // "easy" | "medium" | "hard"
  streak?: number           // review streak count
  last_reviewed?: string    // ISO date string
  next_review?: string      // ISO date string
}
```

**Example:**

```bash
curl -X PATCH http://localhost:3001/flashcards/cards/<card_id> \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"streak": 4, "last_reviewed": "2026-01-03T10:00:00Z", "next_review": "2026-01-06T10:00:00Z"}'
```

---

### DELETE /flashcards/sets/:id

Delete a flashcard set and all its cards.

| Field | Required | Description |
|-------|----------|-------------|
| Auth required | Yes | Bearer token |

**Example:**

```bash
curl -X DELETE http://localhost:3001/flashcards/sets/<set_id> \
  -H "Authorization: Bearer <token>"
```

---

### GET /flashcards/due

Get all flashcards due for review (spaced repetition).

| Field | Required | Description |
|-------|----------|-------------|
| Auth required | Yes | Bearer token |

**Success Response (200):**

```json
[
  {
    "id": "uuid",
    "front": "What is gradient descent?",
    "back": "An optimization algorithm...",
    "difficulty": "medium",
    "streak": 2,
    "next_review": "2026-01-03T00:00:00.000Z",
    "set_id": "uuid"
  }
]
```

**Example:**

```bash
curl http://localhost:3001/flashcards/due \
  -H "Authorization: Bearer <token>"
```

---

## Exams (`/exams`)

### GET /exams

List all exams for the authenticated user.

| Field | Required | Description |
|-------|----------|-------------|
| Auth required | Yes | Bearer token |

**Success Response (200):**

```json
[
  {
    "id": "uuid",
    "name": "ML Midterm Practice",
    "course_id": "uuid",
    "question_count": 20,
    "difficulty": "medium",
    "time_limit": 3600,
    "created_at": "2026-01-01T00:00:00.000Z"
  }
]
```

**Example:**

```bash
curl http://localhost:3001/exams \
  -H "Authorization: Bearer <token>"
```

---

### GET /exams/:id

Get a single exam with its questions.

| Field | Required | Description |
|-------|----------|-------------|
| Auth required | Yes | Bearer token |

**Success Response (200):**

```json
{
  "id": "uuid",
  "name": "ML Midterm Practice",
  "question_count": 20,
  "time_limit": 3600,
  "questions": [
    {
      "id": "uuid",
      "question": "Which algorithm is used for classification?",
      "type": "multiple_choice",
      "options": ["SVM", "K-means", "PCA", "DBSCAN"],
      "order_index": 0
    }
  ]
}
```

**Example:**

```bash
curl http://localhost:3001/exams/<exam_id> \
  -H "Authorization: Bearer <token>"
```

---

### POST /exams

Create a new exam with questions.

| Field | Required | Description |
|-------|----------|-------------|
| Auth required | Yes | Bearer token |

**Request Body:**

```typescript
{
  name: string                    // required
  course_id?: string              // link to a course
  question_count: number          // required
  difficulty?: string             // e.g. "easy", "medium", "hard"
  time_limit?: number             // seconds
  questions: [                    // required array
    {
      question: string            // required
      type: string                // "multiple_choice" | "short_answer" | "true_false"
      options?: unknown           // answer options (for multiple choice)
      correct_answer: string      // required
      explanation?: string        // optional explanation
      order_index: number         // required, display order
    }
  ]
}
```

**Example:**

```bash
curl -X POST http://localhost:3001/exams \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "ML Midterm Practice",
    "course_id": "<course_id>",
    "question_count": 2,
    "difficulty": "medium",
    "time_limit": 1800,
    "questions": [
      {
        "question": "What is supervised learning?",
        "type": "short_answer",
        "correct_answer": "Learning from labeled data",
        "explanation": "Supervised learning uses labeled examples to train models",
        "order_index": 0
      },
      {
        "question": "K-means is a supervised algorithm",
        "type": "true_false",
        "correct_answer": "false",
        "explanation": "K-means is unsupervised clustering",
        "order_index": 1
      }
    ]
  }'
```

---

### POST /exams/:id/submit

Submit answers for an exam attempt.

| Field | Required | Description |
|-------|----------|-------------|
| Auth required | Yes | Bearer token |

**Request Body:**

```typescript
{
  answers: [                      // required array
    {
      question_id: string         // ID of the question
      answer: string              // user's answer
    }
  ]
  time_spent?: number             // seconds taken
}
```

**Success Response (200):**

```json
{
  "id": "uuid",
  "exam_id": "uuid",
  "score": 85,
  "total_questions": 20,
  "correct_answers": 17,
  "time_spent": 1200,
  "submitted_at": "2026-01-03T10:30:00.000Z"
}
```

**Example:**

```bash
curl -X POST http://localhost:3001/exams/<exam_id>/submit \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "answers": [
      {"question_id": "q1-uuid", "answer": "Learning from labeled data"},
      {"question_id": "q2-uuid", "answer": "false"}
    ],
    "time_spent": 900
  }'
```

---

### GET /exams/:id/attempts

Get all past attempts for an exam.

| Field | Required | Description |
|-------|----------|-------------|
| Auth required | Yes | Bearer token |

**Success Response (200):**

```json
[
  {
    "id": "uuid",
    "score": 85,
    "total_questions": 20,
    "correct_answers": 17,
    "time_spent": 1200,
    "submitted_at": "2026-01-03T10:30:00.000Z"
  }
]
```

**Example:**

```bash
curl http://localhost:3001/exams/<exam_id>/attempts \
  -H "Authorization: Bearer <token>"
```

---

## Error Responses

All endpoints return errors in a consistent format:

```json
{
  "statusCode": 400,
  "message": "Error description or array of validation errors",
  "error": "Bad Request"
}
```

Common status codes:

| Code | Meaning |
|------|---------|
| 400 | Validation error or bad request |
| 401 | Missing or invalid authentication token |
| 403 | Forbidden (not the resource owner) |
| 404 | Resource not found |
| 500 | Internal server error |
