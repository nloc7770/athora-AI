-- Seed default plans
INSERT INTO plans (id, name, price_monthly, price_yearly, credits_monthly, storage_limit_mb, max_documents, features, is_active) VALUES
  (gen_random_uuid(), 'free', 0, 0, 50, 100, 5, '{"chat": true, "flashcards": true, "exams": true, "mindmap": true, "summary": true}', true),
  (gen_random_uuid(), 'starter', 10, 96, 200, 500, 50, '{"chat": true, "flashcards": true, "exams": true, "mindmap": true, "summary": true, "priority_queue": false}', true),
  (gen_random_uuid(), 'student', 25, 240, 600, 2000, 200, '{"chat": true, "flashcards": true, "exams": true, "mindmap": true, "summary": true, "priority_queue": true}', true),
  (gen_random_uuid(), 'pro', 50, 480, 1600, 10000, -1, '{"chat": true, "flashcards": true, "exams": true, "mindmap": true, "summary": true, "priority_queue": true, "api_access": true}', true)
ON CONFLICT (name) DO NOTHING;
