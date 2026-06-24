-- Seed data for local development
-- This file is applied during `supabase db reset` to populate a working local environment.

-- Test user ID (matches the default Supabase local auth test user)
-- Use this UUID when signing in locally with: test@studyos.local / password123
DO $$
DECLARE
  test_user_id UUID := '00000000-0000-0000-0000-000000000001';
  course_cs101 UUID := 'a0000000-0000-0000-0000-000000000001';
  course_math UUID := 'a0000000-0000-0000-0000-000000000002';
  doc_lecture UUID := 'b0000000-0000-0000-0000-000000000001';
  doc_notes UUID := 'b0000000-0000-0000-0000-000000000002';
  flashcard_set_1 UUID := 'c0000000-0000-0000-0000-000000000001';
  flashcard_set_2 UUID := 'c0000000-0000-0000-0000-000000000002';
BEGIN

  -- Insert test user into auth.users (local only)
  INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_user_meta_data,
    created_at,
    updated_at
  ) VALUES (
    test_user_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'test@studyos.local',
    crypt('password123', gen_salt('bf')),
    NOW(),
    '{"name": "Test Student", "avatar_url": null}'::jsonb,
    NOW(),
    NOW()
  ) ON CONFLICT (id) DO NOTHING;

  -- Profile (created automatically by trigger, but ensure it exists)
  INSERT INTO profiles (id, name, avatar_url)
  VALUES (test_user_id, 'Test Student', NULL)
  ON CONFLICT (id) DO NOTHING;

  -- Courses
  INSERT INTO courses (id, user_id, name, code, color, description) VALUES
    (course_cs101, test_user_id, 'Intro to Computer Science', 'CS101', '#6366f1', 'Fundamentals of programming and computational thinking'),
    (course_math, test_user_id, 'Linear Algebra', 'MATH201', '#ec4899', 'Vectors, matrices, and linear transformations');

  -- Documents
  INSERT INTO documents (id, user_id, course_id, name, type, file_size, pages, status) VALUES
    (doc_lecture, test_user_id, course_cs101, 'Week 1 - Variables and Types.pdf', 'pdf', 2458000, 24, 'ready'),
    (doc_notes, test_user_id, course_math, 'Eigenvalues Explained', 'note', NULL, NULL, 'ready');

  -- Flashcard sets
  INSERT INTO flashcard_sets (id, user_id, course_id, document_id, name, description) VALUES
    (flashcard_set_1, test_user_id, course_cs101, doc_lecture, 'Python Basics', 'Variables, types, and control flow'),
    (flashcard_set_2, test_user_id, course_math, NULL, 'Linear Algebra Fundamentals', 'Key definitions and theorems');

  -- Flashcards for Python Basics
  INSERT INTO flashcards (set_id, front, back, difficulty) VALUES
    (flashcard_set_1, 'What is a variable?', 'A named reference to a value stored in memory.', 'easy'),
    (flashcard_set_1, 'Name the four primitive data types in Python.', 'int, float, str, bool', 'medium'),
    (flashcard_set_1, 'What does the `//` operator do?', 'Integer (floor) division — divides and rounds down to the nearest integer.', 'medium'),
    (flashcard_set_1, 'What is the difference between a list and a tuple?', 'Lists are mutable (can be changed after creation). Tuples are immutable (fixed once created).', 'hard'),
    (flashcard_set_1, 'What does `len()` return for a string?', 'The number of characters in the string.', 'easy');

  -- Flashcards for Linear Algebra
  INSERT INTO flashcards (set_id, front, back, difficulty) VALUES
    (flashcard_set_2, 'What is a vector space?', 'A set V together with addition and scalar multiplication operations satisfying eight axioms (closure, associativity, commutativity, identity, inverse, compatibility, distribution).', 'hard'),
    (flashcard_set_2, 'What is an eigenvalue?', 'A scalar lambda such that Av = lambda*v for some non-zero vector v.', 'medium'),
    (flashcard_set_2, 'What is the rank of a matrix?', 'The dimension of the column space (number of linearly independent columns).', 'medium'),
    (flashcard_set_2, 'When is a matrix invertible?', 'When its determinant is non-zero, equivalently when it has full rank.', 'easy');

END $$;
