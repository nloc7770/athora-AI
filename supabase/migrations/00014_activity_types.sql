-- Migration: 00014_activity_types
-- Description: Add exam_generation and flashcard_generation activity types

ALTER TABLE study_activities DROP CONSTRAINT IF EXISTS study_activities_activity_type_check;
ALTER TABLE study_activities ADD CONSTRAINT study_activities_activity_type_check
  CHECK (activity_type IN (
    'flashcard_review',
    'exam_attempt',
    'chat_message',
    'document_upload',
    'exam_generation',
    'flashcard_generation'
  ));
