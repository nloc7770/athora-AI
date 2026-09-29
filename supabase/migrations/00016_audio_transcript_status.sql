-- Knowledge-brain phase: audio STT support + honest document statuses.
-- Additive only — existing rows and queries keep working.

-- 1. Widen documents.status CHECK. 00001 line 36 created it inline, so the
-- constraint name is documents_status_check. The processor already writes
-- 'uploading'/'parsing'/'failed'; those updates were silently failing against
-- the old CHECK because updateDocumentStatus ignores the supabase error.
-- Widening only ADDS values — old rows hold only the original three.
ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_status_check;
ALTER TABLE documents ADD CONSTRAINT documents_status_check
  CHECK (status IN ('ready', 'processing', 'error', 'uploading', 'parsing', 'failed'));

-- 2. Audio transcript (STT output), nullable — pdf/doc rows never touch it.
ALTER TABLE documents ADD COLUMN IF NOT EXISTS transcript TEXT;
