-- Migration: Add missing columns used by backend services
-- Description: Columns for RAGFlow integration, processing progress, and chat-session linking

-- documents: RAGFlow tracking + processing progress
ALTER TABLE documents ADD COLUMN IF NOT EXISTS ragflow_dataset_id TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS ragflow_document_id TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS processing_progress INTEGER DEFAULT 0;

-- chat_sessions: link to study_sessions
ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS study_session_id UUID REFERENCES study_sessions(id) ON DELETE SET NULL;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_documents_ragflow_dataset_id ON documents(ragflow_dataset_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_study_session_id ON chat_sessions(study_session_id);
