# API Examples

Practical curl examples for common Athora workflows.

## Complete Flow: Register to Exam

This walkthrough covers the full student journey: creating an account, setting up a course, uploading study material, generating flashcards, and taking a practice exam.

### 1. Register a new account

```bash
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@university.edu",
    "password": "securepass123",
    "name": "Alex Chen"
  }'
```

Response:

```json
{
  "user": { "id": "u-abc123", "email": "student@university.edu" },
  "access_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

Save the token:

```bash
export TOKEN="eyJhbGciOiJIUzI1NiIs..."
```

### 2. Login (if you already have an account)

```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@university.edu",
    "password": "securepass123"
  }'
```

```bash
export TOKEN="<access_token from response>"
```

### 3. Create a course

```bash
curl -X POST http://localhost:3001/courses \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Machine Learning",
    "code": "CS229",
    "color": "#4F46E5",
    "description": "Stanford ML course materials"
  }'
```

Response:

```json
{
  "id": "course-xyz789",
  "name": "Machine Learning",
  "code": "CS229",
  "color": "#4F46E5",
  "description": "Stanford ML course materials",
  "user_id": "u-abc123",
  "created_at": "2026-01-15T09:00:00.000Z"
}
```

```bash
export COURSE_ID="course-xyz789"
```

### 4. Upload a document

```bash
curl -X POST http://localhost:3001/documents \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Lecture 1 - Linear Regression",
    "type": "pdf",
    "course_id": "'$COURSE_ID'",
    "file_url": "https://storage.example.com/uploads/lecture1.pdf",
    "file_size": 2048000,
    "pages": 24
  }'
```

Response:

```json
{
  "id": "doc-def456",
  "name": "Lecture 1 - Linear Regression",
  "type": "pdf",
  "course_id": "course-xyz789",
  "file_url": "https://storage.example.com/uploads/lecture1.pdf",
  "file_size": 2048000,
  "pages": 24,
  "status": "processing",
  "created_at": "2026-01-15T09:05:00.000Z"
}
```

```bash
export DOC_ID="doc-def456"
```

### 5. Create a flashcard set from the document

```bash
curl -X POST http://localhost:3001/flashcards/sets \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Linear Regression Key Concepts",
    "description": "Core concepts from Lecture 1",
    "course_id": "'$COURSE_ID'",
    "document_id": "'$DOC_ID'"
  }'
```

Response:

```json
{
  "id": "set-ghi012",
  "name": "Linear Regression Key Concepts",
  "description": "Core concepts from Lecture 1",
  "course_id": "course-xyz789",
  "document_id": "doc-def456",
  "created_at": "2026-01-15T09:10:00.000Z"
}
```

```bash
export SET_ID="set-ghi012"
```

### 6. Add flashcards to the set

```bash
curl -X POST http://localhost:3001/flashcards/sets/$SET_ID/cards \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "front": "What is the cost function for linear regression?",
    "back": "Mean Squared Error (MSE): J(θ) = (1/2m) Σ(hθ(x) - y)²",
    "difficulty": "medium"
  }'
```

```bash
curl -X POST http://localhost:3001/flashcards/sets/$SET_ID/cards \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "front": "What is gradient descent?",
    "back": "An iterative optimization algorithm that updates parameters in the direction of steepest descent of the cost function",
    "difficulty": "easy"
  }'
```

### 7. Review due flashcards

```bash
curl http://localhost:3001/flashcards/due \
  -H "Authorization: Bearer $TOKEN"
```

### 8. Update a card after reviewing it

```bash
curl -X PATCH http://localhost:3001/flashcards/cards/<card_id> \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "streak": 1,
    "last_reviewed": "2026-01-15T10:00:00Z",
    "next_review": "2026-01-17T10:00:00Z"
  }'
```

### 9. Create a practice exam

```bash
curl -X POST http://localhost:3001/exams \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Linear Regression Quiz",
    "course_id": "'$COURSE_ID'",
    "question_count": 3,
    "difficulty": "medium",
    "time_limit": 900,
    "questions": [
      {
        "question": "Which function measures the error in linear regression?",
        "type": "multiple_choice",
        "options": ["Cross-entropy", "MSE", "Hinge loss", "KL divergence"],
        "correct_answer": "MSE",
        "explanation": "Mean Squared Error is the standard cost function for linear regression",
        "order_index": 0
      },
      {
        "question": "Gradient descent always converges to the global minimum for linear regression",
        "type": "true_false",
        "correct_answer": "true",
        "explanation": "The MSE cost function for linear regression is convex, so gradient descent converges to the global minimum",
        "order_index": 1
      },
      {
        "question": "What does the learning rate control?",
        "type": "short_answer",
        "correct_answer": "The step size of each gradient descent update",
        "order_index": 2
      }
    ]
  }'
```

Response:

```json
{
  "id": "exam-jkl345",
  "name": "Linear Regression Quiz",
  "course_id": "course-xyz789",
  "question_count": 3,
  "difficulty": "medium",
  "time_limit": 900,
  "created_at": "2026-01-15T10:00:00.000Z"
}
```

```bash
export EXAM_ID="exam-jkl345"
```

### 10. Take the exam (submit answers)

```bash
curl -X POST http://localhost:3001/exams/$EXAM_ID/submit \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "answers": [
      {"question_id": "q1-uuid", "answer": "MSE"},
      {"question_id": "q2-uuid", "answer": "true"},
      {"question_id": "q3-uuid", "answer": "The step size of gradient descent updates"}
    ],
    "time_spent": 420
  }'
```

Response:

```json
{
  "id": "attempt-mno678",
  "exam_id": "exam-jkl345",
  "score": 100,
  "total_questions": 3,
  "correct_answers": 3,
  "time_spent": 420,
  "submitted_at": "2026-01-15T10:07:00.000Z"
}
```

### 11. Review past attempts

```bash
curl http://localhost:3001/exams/$EXAM_ID/attempts \
  -H "Authorization: Bearer $TOKEN"
```

---

## Additional Examples

### List documents filtered by course and type

```bash
curl "http://localhost:3001/documents?courseId=$COURSE_ID&type=pdf" \
  -H "Authorization: Bearer $TOKEN"
```

### Update your profile

```bash
curl -X PATCH http://localhost:3001/users/me \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Alex C.", "avatar_url": "https://avatars.example.com/alex.jpg"}'
```

### Update a course

```bash
curl -X PATCH http://localhost:3001/courses/$COURSE_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"color": "#DC2626", "description": "Updated course description"}'
```

### Delete a document

```bash
curl -X DELETE http://localhost:3001/documents/$DOC_ID \
  -H "Authorization: Bearer $TOKEN"
```

### Get flashcard sets for a specific course

```bash
curl "http://localhost:3001/flashcards/sets?courseId=$COURSE_ID" \
  -H "Authorization: Bearer $TOKEN"
```

### Logout

```bash
curl -X POST http://localhost:3001/auth/logout \
  -H "Authorization: Bearer $TOKEN"
```
