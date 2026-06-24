-- Migration: Study Sessions
-- Description: Add study_sessions table and link documents to sessions

CREATE TABLE study_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  ragflow_dataset_id TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Link documents to sessions
ALTER TABLE documents ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES study_sessions(id) ON DELETE SET NULL;
CREATE INDEX idx_documents_session_id ON documents(session_id);

-- RLS
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own sessions" ON study_sessions FOR ALL USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_study_sessions_user_id ON study_sessions(user_id);
CREATE INDEX idx_study_sessions_status ON study_sessions(user_id, status);
