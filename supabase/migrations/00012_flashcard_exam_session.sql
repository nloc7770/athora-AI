-- Migration: Add session_id and source to flashcard_sets and exams
-- Description: Link AI-generated flashcards/exams back to their source session

-- flashcard_sets: add session_id and source
ALTER TABLE flashcard_sets ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES study_sessions(id) ON DELETE SET NULL;
ALTER TABLE flashcard_sets ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual';
ALTER TABLE flashcard_sets ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- exams: add session_id, document_id, source, total_questions
ALTER TABLE exams ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES study_sessions(id) ON DELETE SET NULL;
ALTER TABLE exams ADD COLUMN IF NOT EXISTS document_id UUID REFERENCES documents(id) ON DELETE SET NULL;
ALTER TABLE exams ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual';
ALTER TABLE exams ADD COLUMN IF NOT EXISTS total_questions INTEGER;
ALTER TABLE exams ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Rename 'name' to 'title' if needed (backend uses 'title')
-- flashcard_sets already has 'name', backend inserts 'title' — add alias column
ALTER TABLE flashcard_sets ADD COLUMN IF NOT EXISTS title TEXT;
-- Backfill title from name
UPDATE flashcard_sets SET title = name WHERE title IS NULL;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_flashcard_sets_session_id ON flashcard_sets(session_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_sets_document_id ON flashcard_sets(document_id);
CREATE INDEX IF NOT EXISTS idx_exams_session_id ON exams(session_id);
CREATE INDEX IF NOT EXISTS idx_exams_document_id ON exams(document_id);
