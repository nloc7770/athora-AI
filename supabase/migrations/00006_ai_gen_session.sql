-- Migration: AI Generation Session Support
-- Description: Add session_id to ai_generations, make document_id nullable

ALTER TABLE ai_generations ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES study_sessions(id) ON DELETE CASCADE;
ALTER TABLE ai_generations ALTER COLUMN document_id DROP NOT NULL;
CREATE INDEX idx_ai_generations_session_id ON ai_generations(session_id);
