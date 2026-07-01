-- Migration: 00013_study_analytics
-- Description: Create study_activities table for progress tracking & analytics

-- =============================================================================
-- 1. study_activities — tracks all user learning activities
-- =============================================================================
CREATE TABLE study_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('flashcard_review', 'exam_attempt', 'chat_message', 'document_upload')),
  session_id UUID REFERENCES study_sessions(id) ON DELETE SET NULL,
  duration_seconds INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_study_activities_user_id ON study_activities(user_id);
CREATE INDEX idx_study_activities_created_at ON study_activities(created_at DESC);
CREATE INDEX idx_study_activities_type ON study_activities(activity_type);
CREATE INDEX idx_study_activities_user_date ON study_activities(user_id, created_at);

-- RLS
ALTER TABLE study_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own activities" ON study_activities FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own activities" ON study_activities FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =============================================================================
-- 2. Update plans features to include analytics flag
-- =============================================================================
UPDATE plans SET features = features || '{"analytics": false}'::jsonb WHERE name IN ('free', 'starter');
UPDATE plans SET features = features || '{"analytics": true}'::jsonb WHERE name IN ('student', 'pro');
